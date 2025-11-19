const express = require('express');
// gunakan global fetch (Node>=18) atau node-fetch jika tersedia
let fetchImpl = global.fetch;
try { fetchImpl = fetchImpl || require('node-fetch'); } catch (e) {}

const pkg = require('pg');
const { Pool } = pkg;

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const EMBED_URL = process.env.EMBED_URL || 'http://127.0.0.1:8081/embed';

const ALUMNI_VEC_WEIGHT = Number(process.env.ALUMNI_VEC_WEIGHT ?? 0.7);
const ALUMNI_BM25_WEIGHT = 1 - ALUMNI_VEC_WEIGHT;
const MIN_SCORE = Number(process.env.MIN_SCORE ?? 0.0);

const toPgVector = (arr) => `[${arr.join(',')}]`;
const normalize = (vec) => {
  const n = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / n);
};

async function fetchEmbedding(text) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetchImpl(EMBED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: [text] }),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`Embed failed: ${r.status}`);
    const j = await r.json();
    const v = j?.vectors?.[0];
    if (!Array.isArray(v)) throw new Error('Invalid embedding response');
    return v;
  } finally {
    clearTimeout(timer);
  }
}

const alumniQuery = (qvecStr, { keyword, location, skill, limit, offset }) => ({
  sql: `
    WITH qv AS (SELECT $1::vector AS v),
    base AS (
      SELECT *,
             CASE WHEN $2 = '' THEN 0
                  ELSE ts_rank_cd(ts, websearch_to_tsquery('simple', $2))
             END AS bm25_raw
      FROM alumni_profiles
      WHERE privacy_level = 'public'
        AND embedding IS NOT NULL
        AND ($3::text IS NULL OR location ILIKE '%' || $3 || '%')
        AND ($4::text IS NULL OR $4 = ANY(skills))
        AND ($2 = '' OR ts @@ websearch_to_tsquery('simple', $2))
    ),
    norm AS (
      SELECT base.*,
             CASE WHEN MAX(bm25_raw) OVER () > 0
                  THEN bm25_raw / NULLIF(MAX(bm25_raw) OVER (), 0)
                  ELSE 0
             END AS bm25
      FROM base
    )
    SELECT
      'alumni' AS source,
      user_id,
      current_job AS title,
      company AS context,
      bio,
      ($5 * (1 - (embedding <=> (SELECT v FROM qv))) + $6 * bm25) AS score
    FROM norm
    ORDER BY score DESC
    LIMIT $7 OFFSET $8
  `,
  params: [qvecStr, keyword || '', location, skill, ALUMNI_VEC_WEIGHT, ALUMNI_BM25_WEIGHT, limit, offset],
});

const studentQuery = (qvecStr, { limit, offset }) => ({
  sql: `
    WITH qv AS (SELECT $1::vector AS v)
    SELECT
      'student' AS source,
      student_profile_id AS id,
      NULL AS title,
      NULL AS context,
      bio,
      (1 - (embedding <=> (SELECT v FROM qv))) AS score
    FROM student_profiles
    WHERE embedding IS NOT NULL
    ORDER BY score DESC
    LIMIT $2 OFFSET $3
  `,
  params: [qvecStr, limit, offset],
});

const jobQuery = (qvecStr, { limit, offset }) => ({
  sql: `
    WITH qv AS (SELECT $1::vector AS v)
    SELECT
      'job' AS source,
      job_id AS id,
      title,
      company AS context,
      description AS bio,
      (1 - (embedding <=> (SELECT v FROM qv))) AS score
    FROM jobs
    WHERE embedding IS NOT NULL AND "is_active" = true
    ORDER BY score DESC
    LIMIT $2 OFFSET $3
  `,
  params: [qvecStr, limit, offset],
});

async function runQuery({ sql, params }) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

const pickTop = (rows, k = 3) =>
  rows.filter(r => (r.score ?? 0) >= MIN_SCORE)
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
      .slice(0, k);

function formatReply(top) {
  if (top.length === 0) return 'Maaf, belum ada hasil yang relevan.';
  const best = top[0];
  switch (best.source) {
    case 'alumni':
      return `Saya menemukan alumni yang cocok: ${best.title ?? 'Alumni'} di ${best.context ?? '-'}.`;
    case 'student':
      return `Ada mahasiswa dengan minat serupa: ${(best.bio || '').slice(0, 80)}...`;
    case 'job':
      return `Ada lowongan yang relevan: ${best.title} di ${best.context}.`;
    default:
      return 'Berikut hasil paling relevan.';
  }
}

router.post('/', async (req, res) => {
  const {
    message,
    keyword = '',
    location = null,
    skill = null,
    limit = 5,
    offset = 0,
  } = req.body || {};

  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    const raw = await fetchEmbedding(message);
    const qvecStr = toPgVector(normalize(raw));

    // alumni first
    let results = [];
    const alumniRows = await runQuery(alumniQuery(qvecStr, { keyword, location, skill, limit, offset }));
    const topAlumni = pickTop(alumniRows, 3);
    if (topAlumni.length > 0) {
      results = topAlumni;
    } else {
      const studentRows = await runQuery(studentQuery(qvecStr, { limit, offset }));
      const topStudent = pickTop(studentRows, 3);
      if (topStudent.length > 0) {
        results = topStudent;
      } else {
        const jobRows = await runQuery(jobQuery(qvecStr, { limit, offset }));
        results = pickTop(jobRows, 3);
      }
    }

    const reply = formatReply(results);

    res.json({
      message: reply,
      results: results.map((r) => ({
        source: r.source,
        title: r.title,
        context: r.context,
        score: r.score,
        bio: (r.bio || '').slice(0, 140),
      })),
      meta: {
        limit,
        offset,
        keyword,
        location,
        skill,
        weights: { vec: ALUMNI_VEC_WEIGHT, bm25: ALUMNI_BM25_WEIGHT },
        min_score: MIN_SCORE,
      },
    });
  } catch (err) {
    console.error('chatbot route error:', err);
    res.status(500).json({ error: 'chatbot error', detail: err.message });
  }
});

module.exports = router;