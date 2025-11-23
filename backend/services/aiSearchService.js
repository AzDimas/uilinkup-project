// backend/services/aiSearchService.js
const { Pool } = require("pg");
require("dotenv").config();

/* ------------------------------- bootstrap ------------------------------- */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // penting untuk Neon
});

const EMBED_URL = process.env.EMBED_URL || "http://127.0.0.1:8081/embed";

/* ----------------------------- tunable weights ---------------------------- */
// pakai weight sama untuk alumni & student
const ALUMNI_VEC_WEIGHT = Number(process.env.ALUMNI_VEC_WEIGHT ?? 0.8); // 0–1
const ALUMNI_BM25_WEIGHT = 1 - ALUMNI_VEC_WEIGHT;
const MIN_SCORE = Number(process.env.MIN_SCORE ?? 0.0);

/* -------------------------------- helpers -------------------------------- */

const toPgVector = (arr) => `[${arr.join(",")}]`;

const normalize = (vec) => {
  const n = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / n);
};

const formatDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return "-";
  }
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

/* ---------------------------- intent detection ---------------------------- */

function detectIntent(message) {
  const text = (message || "").toLowerCase();

  // Alumni by angkatan
  const angkatanMatch = text.match(/angkatan\s+(\d{4})|class of\s+(\d{4})/);
  if (angkatanMatch) {
    const year = Number(angkatanMatch[1] || angkatanMatch[2]);
    return { type: "alumni_by_angkatan", angkatan: year };
  }

  // Event bulanan
  if (
    /event|acara|webinar|workshop|seminar/.test(text) &&
    /bulan ini|minggu ini|bulan depan|this month|next month/.test(text)
  ) {
    return { type: "events" };
  }

  // Basic Q&A
  if (
    /apa itu|apa bedanya|perbedaan|bedanya|beda nya|what is|difference between/.test(
      text
    )
  ) {
    return { type: "qa" };
  }

  // NIM / semester / IPK / minat / fakultas (mahasiswa)
  const nimMatch = text.match(/nim\s+(\d{5,})/);
  const semesterMatch = text.match(/semester\s+(\d{1,2})/);
  const gpaMatch = text.match(
    /ipk\s*(?:>=?|minimal|min|di atas|lebih dari)?\s*([0-4](?:\.\d{1,2})?)/
  );
  const interestMatch = text.match(
    /(minat|interest|bidang)\s*[:\-]?\s*([a-z0-9 ,]+)/ // "minat ai", "interest data science"
  );
  const facultyMatch = text.match(/fakultas\s+([a-zA-Z ]+)/); // "fakultas teknik"

  if (
    /mahasiswa|student|mhs/.test(text) ||
    nimMatch ||
    semesterMatch ||
    gpaMatch
  ) {
    return {
      type: "student",
      nim: nimMatch?.[1] || null,
      semester: semesterMatch ? Number(semesterMatch[1]) : null,
      minGpa: gpaMatch ? Number(gpaMatch[1]) : null,
      interestField: interestMatch?.[2]?.trim() || null,
      faculty: facultyMatch?.[1]?.trim() || null,
    };
  }

  // Alumni generic
  if (/alumni|mentor|lulusan|senior/.test(text)) {
    return { type: "alumni" };
  }

  // Job / magang
  if (/lowongan|job|kerja|intern|magang/.test(text)) {
    return { type: "jobs" };
  }

  // fallback
  return { type: "mixed" };
}

/* --------------------------- parametrized queries ------------------------- */

/* === 1) Alumni hybrid: vector + BM25 + JOIN users === */
function alumniQuery(
  qvecStr,
  { keyword, location, skill, angkatan, limit, offset }
) {
  return {
    sql: `
      WITH qv AS (SELECT $1::vector AS v),
      base AS (
        SELECT
          ap.*,
          u.name,
          u.fakultas,
          u.angkatan AS user_angkatan,
          CASE WHEN $2 = '' THEN 0
               ELSE ts_rank_cd(ap.ts, websearch_to_tsquery('simple', $2))
          END AS bm25_raw
        FROM alumni_profiles ap
        JOIN users u ON u.user_id = ap.user_id
        WHERE ap.privacy_level = 'public'
          AND ap.embedding IS NOT NULL
          AND ($3::text IS NULL OR ap.location ILIKE '%' || $3 || '%')
          AND ($4::text IS NULL OR $4 = ANY(ap.skills))
          AND ($5::int IS NULL OR ap.angkatan = $5 OR u.angkatan = $5)
          AND ($2 = '' OR ap.ts @@ websearch_to_tsquery('simple', $2))
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
        name,
        current_job AS title,
        company AS context,
        bio,
        fakultas,
        user_angkatan AS angkatan,
        ($6 * (1 - (embedding <=> (SELECT v FROM qv))) + $7 * bm25) AS score
      FROM norm
      ORDER BY score DESC
      LIMIT $8 OFFSET $9
    `,
    params: [
      qvecStr,
      keyword || "",
      location,
      skill,
      angkatan || null,
      ALUMNI_VEC_WEIGHT,
      ALUMNI_BM25_WEIGHT,
      limit,
      offset,
    ],
  };
}

/* === 1b) Alumni by angkatan only: JOIN users, no vector === */
function alumniByAngkatanOnlyQuery({ angkatan, limit, offset }) {
  return {
    sql: `
      SELECT
        'alumni' AS source,
        ap.user_id,
        u.name,
        ap.current_job AS title,
        ap.company AS context,
        ap.bio,
        u.fakultas,
        u.angkatan,
        1.0 AS score
      FROM alumni_profiles ap
      JOIN users u ON u.user_id = ap.user_id
      WHERE ap.privacy_level = 'public'
        AND u.angkatan = $1
      ORDER BY ap.user_id
      LIMIT $2 OFFSET $3
    `,
    params: [angkatan, limit, offset],
  };
}

/* === 2) Student: hybrid vector + filter + JOIN users === */
function studentQuery(
  qvecStr,
  { nim, semester, minGpa, interestField, faculty, keyword, limit, offset }
) {
  return {
    sql: `
      WITH qv AS (SELECT $1::vector AS v),
      base AS (
        SELECT
          sp.*,
          u.name,
          u.fakultas,
          CASE WHEN $2 = '' THEN 0
               ELSE ts_rank_cd(sp.ts, websearch_to_tsquery('simple', $2))
          END AS bm25_raw
        FROM student_profiles sp
        JOIN users u ON u.user_id = sp.user_id
        WHERE sp.embedding IS NOT NULL
          AND ($3::text    IS NULL OR sp.nim = $3)
          AND ($4::int     IS NULL OR sp.current_semester = $4)
          AND ($5::numeric IS NULL OR sp.ipk >= $5)
          AND (
            $6::text IS NULL OR
            EXISTS (
              SELECT 1
              FROM unnest(sp.interest_fields) AS f
              WHERE f ILIKE '%' || $6 || '%'
            )
          )
          AND ($7::text IS NULL OR u.fakultas ILIKE '%' || $7 || '%')
          AND ($2 = '' OR sp.ts @@ websearch_to_tsquery('simple', $2))
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
        'student' AS source,
        user_id,
        name,
        fakultas,
        bio,
        ipk,
        current_semester,
        interest_fields,
        ($8 * (1 - (embedding <=> (SELECT v FROM qv))) + $9 * bm25) AS score
      FROM norm
      ORDER BY score DESC
      LIMIT $10 OFFSET $11
    `,
    params: [
      qvecStr,
      keyword || "",
      nim || null,
      semester || null,
      minGpa || null,
      interestField || null,
      faculty || null,
      ALUMNI_VEC_WEIGHT,
      ALUMNI_BM25_WEIGHT,
      limit,
      offset,
    ],
  };
}

/* === 3) Jobs: pure semantic vector search === */
function jobQuery(qvecStr, { limit, offset }) {
  return {
    sql: `
      WITH qv AS (SELECT $1::vector AS v)
      SELECT
        'job' AS source,
        job_id AS user_id,
        NULL AS name,
        title,
        company AS context,
        description AS bio,
        NULL::text AS fakultas,
        NULL::int AS angkatan,
        1 - (embedding <=> (SELECT v FROM qv)) AS score
      FROM jobs
      WHERE is_active = true
        AND embedding IS NOT NULL
      ORDER BY score DESC
      LIMIT $2 OFFSET $3
    `,
    params: [qvecStr, limit, offset],
  };
}

/* === 4) Events: mulai dari bulan ini ke depan === */
function eventQuery(qvecStr, { limit, offset }) {
  return {
    sql: `
      SELECT
        'event' AS source,
        event_id AS user_id,
        title,
        location AS context,
        description AS bio,
        start_time,
        COALESCE(1 - (embedding <=> $1::vector), 1.0) AS score
      FROM events
      WHERE is_active = true
        AND start_time >= date_trunc('month', NOW())
      ORDER BY start_time ASC
      LIMIT $2 OFFSET $3
    `,
    params: [qvecStr, limit, offset],
  };
}

/* ------------------------------ db utilities ------------------------------ */

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
      return `Saya menemukan alumni yang cocok: ${
        best.name || best.title || "Alumni"
      }${best.context ? ` di ${best.context}` : ""}.`;
    case "student":
      return "Saya menemukan beberapa mahasiswa yang relevan dengan pencarianmu.";
    case "job":
      return `Ada lowongan yang relevan: ${best.title} di ${best.context}.`;
    case "event":
      return `Ada event yang mungkin cocok untukmu: ${best.title} di ${best.context}.`;
    default:
      return "Berikut hasil paling relevan.";
  }
}

/* ------------------------------ OpenAI client ----------------------------- */

let openai = null;
if (process.env.OPENAI_API_KEY) {
  const OpenAI = require("openai");
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function answerWithLLM(message) {
  if (!openai) {
    return (
      "Modul tanya-jawab AI belum dikonfigurasi. " +
      "Kamu tetap bisa pakai pencarian alumni, mahasiswa, event, dan lowongan."
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah AI Career Assistant untuk mahasiswa & alumni Universitas Indonesia. Jawab dengan singkat, jelas, dan bahasa Indonesia.",
        },
        { role: "user", content: message },
      ],
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Maaf, saya belum bisa menjawab pertanyaan itu.";
    return text;
  } catch (err) {
    console.error("OpenAI LLM error:", err);

    if (err?.status === 429 || err?.code === "insufficient_quota") {
      return (
        "Maaf, modul tanya-jawab AI sedang tidak tersedia karena kuota habis. " +
        "Kamu masih bisa pakai fitur pencarian alumni, mahasiswa, event, dan lowongan seperti biasa."
      );
    }

    return (
      "Maaf, terjadi gangguan pada modul tanya-jawab AI. " +
      "Silakan coba lagi nanti atau gunakan fitur pencarian alumni/mahasiswa/event."
    );
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

  const intent = detectIntent(message);

  // 1) Basic Q&A
  if (intent.type === "qa") {
    const answer = await answerWithLLM(message);
    return {
      message: answer,
      results: [],
      meta: { intent: "qa" },
    };
  }

  // 2) embed untuk alumni / student / job / events
  const raw = await fetchEmbedding(message);
  const qvecStr = toPgVector(normalize(raw));

  // 3) Student intent
  if (intent.type === "student") {
    const rows = await runQuery(
      studentQuery(qvecStr, {
        nim: intent.nim,
        semester: intent.semester,
        minGpa: intent.minGpa,
        interestField: intent.interestField,
        faculty: intent.faculty,
        keyword,
        limit,
        offset,
      })
    );

    const top = pickTop(rows, 5);

    const msg =
      top.length === 0
        ? "Belum ketemu mahasiswa yang cocok dengan kriteria tersebut."
        : "Saya menemukan beberapa mahasiswa yang relevan dengan kriteria pencarianmu.";

    return {
      message: msg,
      results: top.map((r) => ({
        source: r.source,
        user_id: r.user_id,
        name: r.name,
        title: null,
        context: r.fakultas,
        fakultas: r.fakultas,
        angkatan: null,
        ipk: r.ipk,
        semester: r.current_semester,
        interest: r.interest_fields || [],
        score: r.score,
        bio: (r.bio || "").slice(0, 140),
      })),
      meta: {
        intent: "student",
        nim: intent.nim,
        semester: intent.semester,
        minGpa: intent.minGpa,
        interestField: intent.interestField,
        faculty: intent.faculty,
        limit,
        offset,
      },
    };
  }

  // 4) Events
  if (intent.type === "events") {
    const rows = await runQuery(eventQuery(qvecStr, { limit, offset }));
    const top = pickTop(rows, 5);

    const reply =
      top.length === 0
        ? "Belum ada event yang cocok untuk bulan ini."
        : `Ada ${top.length} event yang relevan untukmu bulan ini.`;

    return {
      message: reply,
      results: top.map((e) => ({
        source: e.source,
        user_id: e.user_id,
        name: e.title,
        title: e.title,
        context: `${e.context || "-"} • ${formatDate(e.start_time)}`,
        fakultas: null,
        angkatan: null,
        ipk: null,
        semester: null,
        interest: [],
        score: e.score,
        bio: (e.bio || "").slice(0, 140),
      })),
      meta: { intent: "events", limit, offset },
    };
  }

  // 5) Alumni by angkatan
  if (intent.type === "alumni_by_angkatan") {
    const rows = await runQuery(
      alumniByAngkatanOnlyQuery({
        angkatan: intent.angkatan,
        limit,
        offset,
      })
    );

    const top = pickTop(rows, 5);

    const reply =
      top.length === 0
        ? `Belum ketemu alumni angkatan ${intent.angkatan} yang cocok dengan pencarianmu.`
        : `Saya menemukan beberapa alumni angkatan ${intent.angkatan} yang relevan.`;

    return {
      message: reply,
      results: top.map((r) => ({
        source: r.source,
        user_id: r.user_id,
        name: r.name,
        title: r.title,
        context: r.context,
        fakultas: r.fakultas,
        angkatan: r.angkatan,
        ipk: null,
        semester: null,
        interest: [],
        score: r.score,
        bio: (r.bio || "").slice(0, 140),
      })),
      meta: {
        intent: "alumni_by_angkatan",
        angkatan: intent.angkatan,
        limit,
        offset,
      },
    };
  }

  // 6) Default: alumni → student → job
  let rows = await runQuery(
    alumniQuery(qvecStr, { keyword, location, skill, angkatan: null, limit, offset })
  );
  if (!rows.length) {
    rows = await runQuery(
      studentQuery(qvecStr, {
        nim: null,
        semester: null,
        minGpa: null,
        interestField: null,
        faculty: null,
        keyword,
        limit,
        offset,
      })
    );
  }
  if (!rows.length) {
    rows = await runQuery(jobQuery(qvecStr, { limit, offset }));
  }

  const top = pickTop(rows, 5);
  const reply = formatReply(top);

  return {
    message: reply,
    results: top.map((r) => ({
      source: r.source,
      user_id: r.user_id,
      name: r.name,
      title: r.title ?? null,
      context: r.source === "student" ? r.fakultas : r.context ?? null,
      fakultas: r.fakultas ?? null,
      angkatan: r.angkatan ?? null,
      ipk: r.ipk ?? null,
      semester: r.current_semester ?? null,
      interest: r.interest_fields || [],
      score: r.score,
      bio: (r.bio || "").slice(0, 140),
    })),
    meta: {
      intent: intent.type,
      limit,
      offset,
      keyword,
      location,
      skill,
    },
  };
}

module.exports = {
  searchWithAI,
};
