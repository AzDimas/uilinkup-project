// backend/services/aiSearchService.js
const { Pool } = require("pg");
require("dotenv").config();

/* ------------------------------- bootstrap ------------------------------- */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // aman untuk Neon / remote; lokal juga oke
});

const EMBED_URL = process.env.EMBED_URL || "http://127.0.0.1:8081/embed";

/* -------------------------------- helpers -------------------------------- */

const toPgVector = (arr) => `[${arr.join(",")}]`;

const normalize = (vec) => {
  const n = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / n);
};

const formatDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "-";
  }
};

async function fetchEmbedding(text) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);

  try {
    const r = await fetch(EMBED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: [text] }),
      signal: ctrl.signal,
    });

    if (!r.ok) throw new Error(`Embedding failed: ${r.status}`);

    const j = await r.json();
    const v = j?.vectors?.[0];
    if (!Array.isArray(v)) throw new Error("Invalid embedding response");
    return v;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------- INTENT DETECTION ---------------------------- */

function detectIntent(message) {
  const text = (message || "").toLowerCase().trim();

  // alumni by angkatan
  const angkatanMatch = text.match(/angkatan\s+(\d{4})|class of\s+(\d{4})/);
  if (angkatanMatch) {
    const year = Number(angkatanMatch[1] || angkatanMatch[2]);
    return { type: "alumni_by_angkatan", angkatan: year };
  }

  // events bulan ini/depan
  if (
    /event|acara|webinar|workshop|seminar/.test(text) &&
    /bulan ini|bulan depan|this month|next month|minggu ini/.test(text)
  ) {
    return { type: "events" };
  }

  // --- parser angka & kata kunci kecil ---
  const nimMatch = text.match(/nim\s+(\d{5,})/);
  const semesterMatch = text.match(/semester\s*(?:ke\s*)?(\d{1,2})/);
  const gpaMatch = text.match(
    /ipk\s*(?:>=?|minimal|min|di atas|lebih dari)?\s*([0-4](?:\.\d{1,2})?)/
  );
  const interestMatch = text.match(
    /(minat|interest|bidang)\s*[:\-]?\s*([a-z0-9 ,\-]+)/ // "minat ai & iot"
  );
  const facultyMatch =
    text.match(/fakultas\s+([a-zA-Z0-9 .]+)/) ||
    text.match(/ftui|fasilkom|feb ui|fikom|teknik/);
  const industryMatch = text.match(
    /industri\s+([a-z0-9 .]+)|di\s+([a-z0-9 ]*(fintech|edtech|perbankan|konsultan|startup))/
  );
  const expMatch = text.match(/pengalaman\s+(\d+)\s*(tahun|th)/);

  // job type
  let jobType = null;
  if (/magang|internship|intern\b/.test(text)) jobType = "internship";
  else if (/full[\s-]?time/.test(text)) jobType = "full_time";
  else if (/part[\s-]?time|paruh waktu/.test(text)) jobType = "part_time";
  else if (/kontrak|contract/.test(text)) jobType = "contract";

  // mentorship flag
  const mentorshipOnly = /mentor|mentoring|membimbing|bimbing/.test(text);

  // location "di jakarta", "di bandung"
  let location = null;
  const locMatch = text.match(/di\s+([a-zA-Z ]{3,})/);
  if (locMatch) location = locMatch[1].trim();

  // skill dari teks
  let skillText = null;
  const skillMatch = text.match(/skill\s+([a-z0-9 ,]+)/);
  if (skillMatch) skillText = skillMatch[1].trim();

  const nimStr = nimMatch?.[1] || null;
  const semesterNum = semesterMatch ? Number(semesterMatch[1]) : null;
  const minGpa = gpaMatch ? Number(gpaMatch[1]) : null;
  const interestStr = interestMatch?.[2]?.trim() || null;
  const facultyStr = facultyMatch
    ? (facultyMatch[1] || facultyMatch[0] || "").trim()
    : null;
  const industryStr = industryMatch
    ? (industryMatch[1] || industryMatch[2] || "").trim()
    : null;
  const minExp = expMatch ? Number(expMatch[1]) : null;

  // student intent
  if (
    /mahasiswa|student|mhs/.test(text) ||
    nimStr ||
    semesterNum ||
    minGpa ||
    interestStr
  ) {
    return {
      type: "student",
      nim: nimStr,
      semester: semesterNum,
      minGpa,
      interestField: interestStr,
      faculty: facultyStr,
    };
  }

  // job intent
  if (/lowongan|job|kerja|pekerjaan|intern|magang/.test(text)) {
    return {
      type: "jobs",
      jobType,
      industry: industryStr,
      minExp,
      location,
      requiredSkill: skillText,
      activeOnly: true,
    };
  }

  // job applications intent
  if (/lamaran saya|lamaran ku|status lamaran|job application/.test(text)) {
    return { type: "job_applications" };
  }

  // forum intent
  if (/forum|diskusi|thread|group|grup/.test(text)) {
    return {
      type: "forum",
      topic: (interestStr || industryStr || text).slice(0, 80),
    };
  }

  // alumni generic intent
  if (/alumni|mentor|lulusan|senior/.test(text)) {
    return {
      type: "alumni",
      industry: industryStr,
      minExp,
      mentorshipOnly,
      location,
      faculty: facultyStr,
      skillText,
    };
  }

  // fallback
  return { type: "mixed" };
}

/* --------------------------- PARAMETRIZED QUERIES ------------------------- */

/* Alumni: vector + filter (lokasi, skill, angkatan, fakultas, industri, exp, mentor) */
function alumniQuery(
  qvecStr,
  {
    location,
    skill,
    angkatan,
    faculty,
    industry,
    minExp,
    mentorshipOnly,
    limit,
    offset,
  }
) {
  return {
    sql: `
      WITH q AS (SELECT $1::vector AS v)
      SELECT
        'alumni' AS source,
        ap.user_id,
        u.name,
        ap.current_job AS title,
        ap.company AS context,
        ap.bio,
        u.fakultas,
        COALESCE(ap.angkatan, u.angkatan) AS angkatan,
        COALESCE(1 - (ap.embedding <=> (SELECT v FROM q)), 0.0) AS score
      FROM alumni_profiles ap
      JOIN users u ON u.user_id = ap.user_id
      WHERE ap.embedding IS NOT NULL
        AND ap.privacy_level = 'public'
        AND ($2::text  IS NULL OR ap.location ILIKE '%' || $2 || '%')
        AND ($3::text  IS NULL OR $3 = ANY(ap.skills))
        AND ($4::int   IS NULL OR ap.angkatan = $4 OR u.angkatan = $4)
        AND ($5::text  IS NULL OR u.fakultas ILIKE '%' || $5 || '%')
        AND ($6::text  IS NULL OR ap.industry ILIKE '%' || $6 || '%')
        AND ($7::int   IS NULL OR ap.years_of_experience >= $7)
        AND ($8::bool  IS NULL OR ap.available_for_mentorship = true)
      ORDER BY score DESC
      LIMIT $9 OFFSET $10
    `,
    params: [
      qvecStr, // $1
      location || null, // $2
      skill || null, // $3
      angkatan || null, // $4
      faculty || null, // $5
      industry || null, // $6
      minExp || null, // $7
      mentorshipOnly === true ? true : null, // $8
      limit, // $9
      offset, // $10
    ],
  };
}

/* Alumni by angkatan tanpa embedding (simple) */
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

/* Student: vector + filter (nim, semester, ipk, minat, fakultas) */
function studentQuery(
  qvecStr,
  { nim, semester, minGpa, interestField, faculty, limit, offset }
) {
  return {
    sql: `
      WITH q AS (SELECT $1::vector AS v)
      SELECT
        'student' AS source,
        sp.user_id,
        u.name,
        u.fakultas,
        u.angkatan,
        sp.bio,
        sp.ipk,
        sp.current_semester AS semester,
        sp.interest_fields,
        COALESCE(1 - (sp.embedding <=> (SELECT v FROM q)), 0.0) AS score
      FROM student_profiles sp
      JOIN users u ON u.user_id = sp.user_id
      WHERE sp.embedding IS NOT NULL
        AND ($2::text    IS NULL OR sp.nim = $2)
        AND ($3::int     IS NULL OR sp.current_semester = $3)
        AND ($4::numeric IS NULL OR sp.ipk >= $4)
        AND (
          $5::text IS NULL OR
          EXISTS (
            SELECT 1
            FROM unnest(sp.interest_fields) AS f
            WHERE f ILIKE '%' || $5 || '%'
          )
        )
        AND ($6::text IS NULL OR u.fakultas ILIKE '%' || $6 || '%')
      ORDER BY score DESC
      LIMIT $7 OFFSET $8
    `,
    params: [
      qvecStr, // $1
      nim || null, // $2
      semester || null, // $3
      minGpa || null, // $4
      interestField || null, // $5
      faculty || null, // $6
      limit, // $7
      offset, // $8
    ],
  };
}

/* Jobs: vector + filter (location, jobType, industry, minExp, skill, activeOnly) */
function jobQuery(
  qvecStr,
  { location, requiredSkill, jobType, industry, minExp, activeOnly, limit, offset }
) {
  return {
    sql: `
      WITH q AS (SELECT $1::vector AS v)
      SELECT
        'job' AS source,
        j.job_id AS user_id,
        NULL AS name,
        j.title,
        j.company AS context,
        j.description AS bio,
        COALESCE(1 - (j.embedding <=> (SELECT v FROM q)), 0.0) AS score
      FROM jobs j
      WHERE j.embedding IS NOT NULL
        AND ($2::text IS NULL OR j.location ILIKE '%' || $2 || '%')
        AND ($3::text IS NULL OR j.job_type = $3::job_type)
        AND ($4::text IS NULL OR j.industry ILIKE '%' || $4 || '%')
        AND ($5::int  IS NULL OR j.min_experience IS NULL OR j.min_experience <= $5)
        AND (
          $6::text IS NULL OR
          EXISTS (
            SELECT 1
            FROM unnest(j.required_skills) AS s
            WHERE s ILIKE '%' || $6 || '%'
          )
        )
        AND ($7::bool IS NULL OR (j.is_active = true AND (j.expires_at IS NULL OR j.expires_at > now())))
      ORDER BY score DESC
      LIMIT $8 OFFSET $9
    `,
    params: [
      qvecStr, // $1
      location || null, // $2
      jobType || null, // $3
      industry || null, // $4
      minExp || null, // $5
      requiredSkill || null, // $6
      activeOnly === false ? null : true, // $7 (default true)
      limit, // $8
      offset, // $9
    ],
  };
}

/* Events: vector only (start_time >= now) */
function eventQuery(qvecStr, { limit, offset }) {
  return {
    sql: `
      WITH q AS (SELECT $1::vector AS v)
      SELECT
        'event' AS source,
        e.event_id AS user_id,
        e.title,
        e.location AS context,
        e.description AS bio,
        e.start_time,
        COALESCE(1 - (e.embedding <=> (SELECT v FROM q)), 1.0) AS score
      FROM events e
      WHERE e.is_active = true
      ORDER BY e.start_time ASC
      LIMIT $2 OFFSET $3
    `,
    params: [qvecStr, limit, offset],
  };
}

/* Job applications: status lamaran current user */
function jobApplicationsQuery({ applicantId, limit, offset }) {
  return {
    sql: `
      SELECT
        'job_application' AS source,
        ja.application_id AS user_id,
        j.title,
        j.company AS context,
        ja.status,
        ja.applied_at,
        ja.status_note,
        1.0 AS score
      FROM job_applications ja
      JOIN jobs j ON j.job_id = ja.job_id
      WHERE ja.applicant_id = $1
      ORDER BY ja.applied_at DESC
      LIMIT $2 OFFSET $3
    `,
    params: [applicantId, limit, offset],
  };
}

/* Forum posts: cari berdasarkan topic sederhana */
function forumPostsQuery({ topic, limit, offset }) {
  return {
    sql: `
      SELECT
        'forum_post' AS source,
        gp.post_id AS user_id,
        gp.title,
        g.name AS context,
        gp.content AS bio,
        gp.like_count,
        gp.reply_count,
        gp.created_at,
        1.0 AS score
      FROM group_posts gp
      LEFT JOIN groups g ON g.group_id = gp.group_id
      WHERE ($1::text IS NULL OR gp.title ILIKE '%' || $1 || '%' OR gp.content ILIKE '%' || $1 || '%')
      ORDER BY gp.like_count DESC, gp.created_at DESC
      LIMIT $2 OFFSET $3
    `,
    params: [topic || null, limit, offset],
  };
}

/* ------------------------------ DB utilities ------------------------------ */

async function runQuery({ sql, params }) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

/**
 * TIDAK ada filter MIN_SCORE lagi.
 * Selalu ambil top-K (default 5) dari rows yang sudah di-ORDER BY di SQL.
 */
const pickTop = (rows, k = 5) =>
  rows
    .slice()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, k);

/* ------------------------------- main service ----------------------------- */

async function searchWithAI(payload) {
  const {
    message,
    keyword = "",
    location = null,
    skill = null,
    limit = 5,
    offset = 0,
    currentUserId = null, // opsional, untuk status lamaran
  } = payload || {};

  if (!message) throw new Error("Message required");

  const intent = detectIntent(message);

  // 1) Ambil embedding query
  let qvecStr = null;
  try {
    const raw = await fetchEmbedding(message);
    qvecStr = toPgVector(normalize(raw));
  } catch (err) {
    console.error("Embedding error:", err.message);
    return {
      message:
        "Modul pencarian vektor sementara tidak tersedia. Coba lagi nanti.",
      results: [],
      meta: { intent: intent.type, vector: false },
    };
  }

  /* ------------ Branch intent spesifik ------------ */

  // Student
  if (intent.type === "student") {
    const rows = await runQuery(
      studentQuery(qvecStr, {
        nim: intent.nim,
        semester: intent.semester,
        minGpa: intent.minGpa,
        interestField: intent.interestField,
        faculty: intent.faculty,
        limit,
        offset,
      })
    );
    const top = pickTop(rows);

    const msg =
      top.length === 0
        ? "Belum ketemu mahasiswa yang cocok dengan kriteria tersebut."
        : "Berikut beberapa mahasiswa yang relevan dengan pencarianmu.";

    return {
      message: msg,
      results: top.map((r) => ({
        source: r.source,
        user_id: r.user_id,
        name: r.name,
        title: null,
        context: r.fakultas,
        fakultas: r.fakultas,
        angkatan: r.angkatan,
        ipk: r.ipk,
        semester: r.semester,
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

  // Events
  if (intent.type === "events") {
    const rows = await runQuery(eventQuery(qvecStr, { limit, offset }));
    const top = pickTop(rows);

    const reply =
      top.length === 0
        ? "Belum ada event yang cocok untuk bulan ini."
        : `Ada ${top.length} event yang relevan untukmu.`;

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

  // Alumni by angkatan
  if (intent.type === "alumni_by_angkatan") {
    const rows = await runQuery(
      alumniByAngkatanOnlyQuery({
        angkatan: intent.angkatan,
        limit,
        offset,
      })
    );
    const top = pickTop(rows);

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
      meta: { intent: "alumni_by_angkatan", angkatan: intent.angkatan, limit, offset },
    };
  }

  // Job applications (status lamaran)
  if (intent.type === "job_applications") {
    if (!currentUserId) {
      return {
        message:
          "Untuk melihat status lamaran, kamu perlu login dan fitur ini dihubungkan dengan akunmu.",
        results: [],
        meta: { intent: "job_applications", needUserId: true },
      };
    }

    const rows = await runQuery(
      jobApplicationsQuery({ applicantId: currentUserId, limit, offset })
    );
    const top = pickTop(rows);

    const reply =
      top.length === 0
        ? "Belum ada data lamaran kerja yang bisa ditampilkan."
        : "Berikut beberapa status lamaran kerjamu.";

    return {
      message: reply,
      results: top.map((r) => ({
        source: r.source,
        user_id: r.user_id,
        name: r.title,
        title: r.title,
        context: `${r.context} • status: ${r.status}`,
        fakultas: null,
        angkatan: null,
        ipk: null,
        semester: null,
        interest: [],
        score: r.score,
        bio: r.status_note || "",
      })),
      meta: { intent: "job_applications", limit, offset },
    };
  }

  // Forum
  if (intent.type === "forum") {
    const rows = await runQuery(
      forumPostsQuery({ topic: intent.topic || keyword, limit, offset })
    );
    const top = pickTop(rows);

    const reply =
      top.length === 0
        ? "Belum ada diskusi forum yang relevan dengan topik itu."
        : "Saya menemukan beberapa diskusi forum yang relevan.";

    return {
      message: reply,
      results: top.map((r) => ({
        source: r.source,
        user_id: r.user_id,
        name: r.title,
        title: r.title,
        context: r.context,
        fakultas: null,
        angkatan: null,
        ipk: null,
        semester: null,
        interest: [],
        score: r.score,
        bio: (r.bio || "").slice(0, 140),
      })),
      meta: { intent: "forum", topic: intent.topic, limit, offset },
    };
  }

  // Alumni intent khusus + filter (lokasi, skill, industri, dll.)
  if (intent.type === "alumni") {
    const rows = await runQuery(
      alumniQuery(qvecStr, {
        location: intent.location || location,
        skill: intent.skillText || skill,
        angkatan: null,
        faculty: intent.faculty || null,
        industry: intent.industry || null,
        minExp: intent.minExp || null,
        mentorshipOnly: intent.mentorshipOnly || null,
        limit,
        offset,
      })
    );
    const top = pickTop(rows);

    const reply =
      top.length === 0
        ? "Belum ketemu alumni yang cocok dengan kriteria tersebut."
        : "Saya menemukan beberapa alumni yang relevan.";

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
        intent: "alumni",
        faculty: intent.faculty,
        industry: intent.industry,
        minExp: intent.minExp,
        mentorshipOnly: intent.mentorshipOnly,
        location: intent.location || location,
        skill: intent.skillText || skill,
        limit,
        offset,
      },
    };
  }

  // Jobs intent khusus
  if (intent.type === "jobs") {
    const rows = await runQuery(
      jobQuery(qvecStr, {
        location: intent.location || location,
        requiredSkill: intent.requiredSkill || skill,
        jobType: intent.jobType || null,
        industry: intent.industry || null,
        minExp: intent.minExp || null,
        activeOnly: intent.activeOnly !== false,
        limit,
        offset,
      })
    );
    const top = pickTop(rows);

    const reply =
      top.length === 0
        ? "Belum ketemu lowongan yang cocok dengan kriteria tersebut."
        : "Berikut beberapa lowongan yang relevan.";

    return {
      message: reply,
      results: top.map((r) => ({
        source: r.source,
        user_id: r.user_id,
        name: null,
        title: r.title,
        context: r.context,
        fakultas: null,
        angkatan: null,
        ipk: null,
        semester: null,
        interest: [],
        score: r.score,
        bio: (r.bio || "").slice(0, 140),
      })),
      meta: {
        intent: "jobs",
        location: intent.location || location,
        requiredSkill: intent.requiredSkill || skill,
        jobType: intent.jobType,
        industry: intent.industry,
        minExp: intent.minExp,
        activeOnly: intent.activeOnly !== false,
        limit,
        offset,
      },
    };
  }

  // Fallback MIXED: alumni → student → job
  let rows = await runQuery(
    alumniQuery(qvecStr, {
      location,
      skill,
      angkatan: null,
      faculty: null,
      industry: null,
      minExp: null,
      mentorshipOnly: null,
      limit,
      offset,
    })
  );
  let top = pickTop(rows);
  if (top.length) {
    return {
      message: "Saya menemukan beberapa alumni yang relevan.",
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
      meta: { intent: "fallback_alumni", limit, offset },
    };
  }

  rows = await runQuery(
    studentQuery(qvecStr, {
      nim: null,
      semester: null,
      minGpa: null,
      interestField: null,
      faculty: null,
      limit,
      offset,
    })
  );
  top = pickTop(rows);
  if (top.length) {
    return {
      message: "Saya menemukan beberapa mahasiswa yang relevan.",
      results: top.map((r) => ({
        source: r.source,
        user_id: r.user_id,
        name: r.name,
        title: null,
        context: r.fakultas,
        fakultas: r.fakultas,
        angkatan: r.angkatan,
        ipk: r.ipk,
        semester: r.semester,
        interest: r.interest_fields || [],
        score: r.score,
        bio: (r.bio || "").slice(0, 140),
      })),
      meta: { intent: "fallback_student", limit, offset },
    };
  }

  rows = await runQuery(
    jobQuery(qvecStr, {
      location,
      requiredSkill: skill,
      jobType: null,
      industry: null,
      minExp: null,
      activeOnly: true,
      limit,
      offset,
    })
  );
  top = pickTop(rows);
  if (top.length) {
    return {
      message: "Berikut beberapa lowongan yang relevan.",
      results: top.map((r) => ({
        source: r.source,
        user_id: r.user_id,
        name: null,
        title: r.title,
        context: r.context,
        fakultas: null,
        angkatan: null,
        ipk: null,
        semester: null,
        interest: [],
        score: r.score,
        bio: (r.bio || "").slice(0, 140),
      })),
      meta: { intent: "fallback_job", limit, offset },
    };
  }

  return {
    message: "Maaf, belum ada hasil yang relevan.",
    results: [],
    meta: { intent: intent.type, limit, offset },
  };
}

module.exports = {
  searchWithAI,
};
