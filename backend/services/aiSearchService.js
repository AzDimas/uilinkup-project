// services/aiSearchService.js
const { Pool } = require("pg");
require("dotenv").config();

/* ------------------------------- bootstrap ------------------------------- */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // penting untuk Neon
});

const EMBED_URL = process.env.EMBED_URL || "http://127.0.0.1:8081/embed";

/* ----------------------------- tunable weights ---------------------------- */
// sama seperti di node-mini/server.js
const ALUMNI_VEC_WEIGHT = Number(process.env.ALUMNI_VEC_WEIGHT ?? 0.7); // 0.0–1.0
const ALUMNI_BM25_WEIGHT = 1 - ALUMNI_VEC_WEIGHT;
const MIN_SCORE = Number(process.env.MIN_SCORE ?? 0.0);

/* -------------------------------- helpers -------------------------------- */

const toPgVector = (arr) => `[${arr.join(",")}]`;

const normalize = (vec) => {
  const n = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / n);
};

async function fetchEmbedding(text) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(EMBED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: [text] }),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`Embed failed: ${r.status}`);
    const j = await r.json();
    const v = j?.vectors?.[0];
    if (!Array.isArray(v)) throw new Error("Invalid embedding response");
    return v;
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------------- parametrized queries ------------------------- */

// === 1) Alumni hybrid: vector + BM25 (sudah pakai websearch_to_tsquery & normalisasi) ===
function alumniQuery(qvecStr, { keyword, location, skill, limit, offset }) {
  return {
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
    params: [
      qvecStr,
      keyword || "",
      location,
      skill,
      ALUMNI_VEC_WEIGHT,
      ALUMNI_BM25_WEIGHT,
      limit,
      offset,
    ],
  };
}

// === 2) Student: pure semantic vector search ===
function studentQuery(qvecStr, { limit, offset }) {
  return {
    sql: `
      SELECT
        'student' AS source,
        user_id,
        NULL AS title,
        NULL AS context,
        bio,
        1 - (embedding <=> $1::vector) AS score
      FROM student_profiles
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2 OFFSET $3
    `,
    params: [qvecStr, limit, offset],
  };
}

// === 3) Jobs: pure semantic vector search ===
function jobQuery(qvecStr, { limit, offset }) {
  return {
    sql: `
      SELECT
        'job' AS source,
        job_id AS user_id,
        title,
        company AS context,
        description AS bio,
        1 - (embedding <=> $1::vector) AS score
      FROM jobs
      WHERE is_active = true AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2 OFFSET $3
    `,
    params: [qvecStr, limit, offset],
  };
}

async function runQuery({ sql, params }) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

const pickTop = (rows, k = 3) =>
  rows
    .filter((r) => (r.score ?? 0) >= MIN_SCORE)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    .slice(0, k);

function formatReply(top) {
  if (top.length === 0) return "Maaf, belum ada hasil yang relevan.";
  const best = top[0];
  switch (best.source) {
    case "alumni":
      return `Saya menemukan alumni yang cocok: ${best.title ?? "Alumni"} di ${
        best.context ?? "-"
      }.`;
    case "student":
      return `Ada mahasiswa dengan minat serupa: ${
        (best.bio || "").slice(0, 80)
      }...`;
    case "job":
      return `Ada lowongan yang relevan: ${best.title} di ${best.context}.`;
    default:
      return "Berikut hasil paling relevan.";
  }
}

/* ------------------------------- main service ----------------------------- */

async function searchWithAI(payload) {
  const {
    message,
    keyword = "",
    location = null,
    skill = null,
    limit = 5,
    offset = 0,
  } = payload || {};

  if (!message) {
    throw new Error("Message required");
  }

  // 1) embed + normalisasi
  const raw = await fetchEmbedding(message);
  const qvecStr = toPgVector(normalize(raw));

  // 2) Alumni-first cascading fallback
  let results = [];

  // Alumni
  const alumniRows = await runQuery(
    alumniQuery(qvecStr, { keyword, location, skill, limit, offset })
  );
  const topAlumni = pickTop(alumniRows, 3);
  if (topAlumni.length > 0) {
    results = topAlumni;
  } else {
    // Student
    const studentRows = await runQuery(
      studentQuery(qvecStr, { limit, offset })
    );
    const topStudent = pickTop(studentRows, 3);
    if (topStudent.length > 0) {
      results = topStudent;
    } else {
      // Jobs
      const jobRows = await runQuery(jobQuery(qvecStr, { limit, offset }));
      results = pickTop(jobRows, 3);
    }
  }

  const reply = formatReply(results);

  return {
    message: reply,
    results: results.map((r) => ({
      source: r.source,
      title: r.title,
      context: r.context,
      score: r.score,
      bio: (r.bio || "").slice(0, 140),
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
  };
}

module.exports = {
  searchWithAI,
};
