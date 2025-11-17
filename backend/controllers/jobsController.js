// backend/controllers/jobsController.js
const pool = require('../config/database');

// helper
const toInt = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Error(`INVALID_INT:${v}`);
  return n;
};

const nowIso = () => new Date().toISOString();

/* ============================================================
   GET /api/jobs
   Filter: q, type, location, company, skills, page, status, sort
   - status: open | closed | all (default open)
   - open   = is_active = true AND (expires_at IS NULL OR expires_at >= NOW())
   - closed = is_active = false OR (expires_at < NOW())
=============================================================== */
exports.listJobs = async (req, res) => {
  try {
    const {
      q = '',
      type = '',
      location = '',
      company = '',
      skills = '',
      page = '1',
      pageSize = '20',
      status = 'open',   // open | closed | all
      sort = 'newest'    // newest | oldest
    } = req.query;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20));
    const offset = (p - 1) * ps;

    const where = [];
    const params = [];
    let idx = 1;

    const statusNorm = String(status || '').toLowerCase();

    if (statusNorm === 'open') {
      // hanya yang masih aktif dan belum lewat expires_at
      where.push(`j.is_active = TRUE AND (j.expires_at IS NULL OR j.expires_at >= NOW())`);
    } else if (statusNorm === 'closed') {
      // yang sudah non-aktif ATAU sudah lewat expires_at
      where.push(`(j.is_active = FALSE OR (j.expires_at IS NOT NULL AND j.expires_at < NOW()))`);
    }
    // status === 'all' -> tidak tambah kondisi

    // q search
    if (q) {
      params.push(`%${q}%`);
      params.push(`%${q}%`);
      params.push(`%${q}%`);
      where.push(`(j.title ILIKE $${idx++} OR j.company ILIKE $${idx++} OR j.location ILIKE $${idx++})`);
    }

    if (type) {
      params.push(type);
      where.push(`j.job_type = $${idx++}`);
    }

    if (location) {
      params.push(`%${location}%`);
      where.push(`j.location ILIKE $${idx++}`);
    }

    if (company) {
      params.push(`%${company}%`);
      where.push(`j.company ILIKE $${idx++}`);
    }

    if (skills) {
      const arr = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (arr.length > 0) {
        params.push(arr);
        where.push(`j.required_skills && $${idx++}::text[]`);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    let sortSql = `ORDER BY j.created_at DESC`;
    if (sort === 'oldest') sortSql = `ORDER BY j.created_at ASC`;

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM jobs j ${whereSql}`,
      params
    );
    const total = totalRows[0]?.total || 0;

    const { rows } = await pool.query(
      `SELECT j.*, 
              u.name AS poster_name,
              u.email AS poster_email
         FROM jobs j
         JOIN users u ON u.user_id = j.posted_by_id
         ${whereSql}
         ${sortSql}
         LIMIT ${ps} OFFSET ${offset}`,
      params
    );

    res.json({ success: true, items: rows, total, page: p, pageSize: ps });

  } catch (err) {
    console.error('🔴 [JOBS] listJobs error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil jobs: ' + err.message });
  }
};

/* ============================================================
   GET /api/jobs/:jobId
=============================================================== */
exports.getJobDetail = async (req, res) => {
  try {
    const jobId = toInt(req.params.jobId);

    const { rows } = await pool.query(
      `SELECT j.*, u.name AS poster_name, u.email AS poster_email
         FROM jobs j
         JOIN users u ON u.user_id = j.posted_by_id
        WHERE j.job_id = $1`,
      [jobId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Job tidak ditemukan' });
    }

    res.json({ success: true, job: rows[0] });
  } catch (err) {
    console.error('🔴 [JOBS] getJobDetail error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil detail: ' + err.message });
  }
};

/* ============================================================
   GET /api/jobs/me/posted
=============================================================== */
exports.listPostedByMe = async (req, res) => {
  try {
    const me = toInt(req.user.userId);

    const { rows } = await pool.query(
      `SELECT * FROM jobs WHERE posted_by_id = $1 ORDER BY created_at DESC`,
      [me]
    );

    res.json({ success: true, items: rows });
  } catch (err) {
    console.error('🔴 [JOBS] listPostedByMe error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil job saya: ' + err.message });
  }
};

/* ============================================================
   GET /api/jobs/me/applied
=============================================================== */
exports.listAppliedByMe = async (req, res) => {
  try {
    const me = toInt(req.user.userId);

    const { rows } = await pool.query(
      `SELECT a.application_id, a.job_id, a.cover_letter, a.resume_link,
              a.status, a.applied_at, a.status_note, a.status_updated_at,
              j.title, j.company, j.location, j.job_type, j.posted_by_id,
              j.expires_at, j.is_active
         FROM job_applications a
         JOIN jobs j ON j.job_id = a.job_id
        WHERE a.applicant_id = $1
        ORDER BY a.applied_at DESC`,
      [me]
    );

    res.json({ success: true, items: rows });

  } catch (err) {
    console.error('🔴 [JOBS] listAppliedByMe error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil aplikasi saya: ' + err.message });
  }
};

/* ============================================================
   POST /api/jobs
=============================================================== */
exports.createJob = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const {
      title, description, company, location, job_type,
      industry = null, required_skills = [], min_experience = null,
      salary_range = null, application_link = null, expires_at = null
    } = req.body || {};

    if (!title || !description || !company || !location || !job_type) {
      return res.status(400).json({ success: false, error: 'Field wajib belum lengkap' });
    }

    const { rows } = await pool.query(
      `INSERT INTO jobs
        (posted_by_id, title, description, company, location, job_type, industry,
         required_skills, min_experience, salary_range, application_link, expires_at)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        me, title, description, company, location, job_type, industry,
        required_skills, min_experience, salary_range, application_link, expires_at
      ]
    );

    res.json({ success: true, job: rows[0] });

  } catch (err) {
    console.error('🔴 [JOBS] createJob error:', err);
    res.status(500).json({ success: false, error: 'Gagal membuat job: ' + err.message });
  }
};

/* ============================================================
   PUT /api/jobs/:jobId  (Owner only)
=============================================================== */
exports.updateJob = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const jobId = toInt(req.params.jobId);

    const { rows: chk } = await pool.query(
      `SELECT posted_by_id FROM jobs WHERE job_id = $1`,
      [jobId]
    );
    if (!chk.length) return res.status(404).json({ success: false, error: 'Job tidak ditemukan' });
    if (chk[0].posted_by_id !== me) return res.status(403).json({ success: false, error: 'Bukan pemilik job' });

    const {
      title, description, company, location, job_type,
      industry, required_skills, min_experience,
      salary_range, application_link, expires_at, is_active
    } = req.body || {};

    const { rows } = await pool.query(
      `UPDATE jobs SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         company = COALESCE($4, company),
         location = COALESCE($5, location),
         job_type = COALESCE($6, job_type),
         industry = COALESCE($7, industry),
         required_skills = COALESCE($8, required_skills),
         min_experience = COALESCE($9, min_experience),
         salary_range = COALESCE($10, salary_range),
         application_link = COALESCE($11, application_link),
         expires_at = COALESCE($12, expires_at),
         is_active = COALESCE($13, is_active)
       WHERE job_id = $1
       RETURNING *`,
      [
        jobId, title, description, company, location, job_type, industry,
        required_skills, min_experience, salary_range, application_link, expires_at, is_active
      ]
    );

    res.json({ success: true, job: rows[0] });

  } catch (err) {
    console.error('🔴 [JOBS] updateJob error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengubah job: ' + err.message });
  }
};

/* ============================================================
   DELETE /api/jobs/:jobId (soft deactivate)
=============================================================== */
exports.deactivateJob = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const jobId = toInt(req.params.jobId);

    const { rows: chk } = await pool.query(
      `SELECT posted_by_id FROM jobs WHERE job_id = $1`,
      [jobId]
    );
    if (!chk.length) return res.status(404).json({ success: false, error: 'Job tidak ditemukan' });
    if (chk[0].posted_by_id !== me) return res.status(403).json({ success: false, error: 'Bukan pemilik job' });

    await pool.query(
      `UPDATE jobs SET is_active = FALSE WHERE job_id = $1`,
      [jobId]
    );

    res.json({ success: true, deactivated: true });

  } catch (err) {
    console.error('🔴 [JOBS] deactivateJob error:', err);
    res.status(500).json({ success: false, error: 'Gagal menonaktifkan job: ' + err.message });
  }
};

/* ============================================================
   POST /api/jobs/:jobId/apply
=============================================================== */
exports.applyJob = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const jobId = toInt(req.params.jobId);

    const { cover_letter = null, resume_link = null } = req.body || {};

    const { rows: jrows } = await pool.query(
      `SELECT is_active, expires_at FROM jobs WHERE job_id = $1`,
      [jobId]
    );
    if (!jrows.length) {
      return res.status(404).json({ success: false, error: 'Job tidak ditemukan' });
    }

    const job = jrows[0];

    if (!job.is_active) {
      return res.status(400).json({ success: false, error: 'Job tidak aktif' });
    }

    if (job.expires_at && new Date(job.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Pendaftaran telah ditutup (expired).' });
    }

    const { rows } = await pool.query(
      `INSERT INTO job_applications 
          (job_id, applicant_id, cover_letter, resume_link)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (job_id, applicant_id)
       DO UPDATE SET 
         cover_letter = EXCLUDED.cover_letter,
         resume_link = EXCLUDED.resume_link,
         applied_at = NOW(),
         status = 'pending'
       RETURNING *`,
      [jobId, me, cover_letter, resume_link]
    );

    res.json({ success: true, application: rows[0] });

  } catch (err) {
    console.error('🔴 [JOBS] applyJob error:', err);
    res.status(500).json({ success: false, error: 'Gagal apply job: ' + err.message });
  }
};

/* ============================================================
   GET /api/jobs/:jobId/applications
=============================================================== */
exports.listApplicationsForJob = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const jobId = toInt(req.params.jobId);

    const { rows: chk } = await pool.query(
      `SELECT posted_by_id FROM jobs WHERE job_id = $1`,
      [jobId]
    );
    if (!chk.length) return res.status(404).json({ success: false, error: 'Job tidak ditemukan' });
    if (chk[0].posted_by_id !== me) return res.status(403).json({ success: false, error: 'Bukan pemilik job' });

    const { rows } = await pool.query(
      `SELECT a.*, u.name AS applicant_name, u.email AS applicant_email
         FROM job_applications a
         JOIN users u ON u.user_id = a.applicant_id
        WHERE a.job_id = $1
        ORDER BY a.applied_at DESC`,
      [jobId]
    );

    res.json({ success: true, items: rows });

  } catch (err) {
    console.error('🔴 [JOBS] listApplicationsForJob error:', err);
    res.status(500).json({ success: false, error: 'Gagal list aplikasi: ' + err.message });
  }
};

/* ============================================================
   PATCH /api/jobs/:jobId/applications/:applicationId
   (Update status & message)
=============================================================== */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const jobId = toInt(req.params.jobId);
    const applicationId = toInt(req.params.applicationId);

    const { status, note = null } = req.body || {};
    if (!status) return res.status(400).json({ success: false, error: 'Status wajib diisi' });

    const { rows: chk } = await pool.query(
      `SELECT posted_by_id FROM jobs WHERE job_id = $1`,
      [jobId]
    );
    if (!chk.length) return res.status(404).json({ success: false, error: 'Job tidak ditemukan' });
    if (chk[0].posted_by_id !== me) return res.status(403).json({ success: false, error: 'Bukan pemilik job' });

    const { rows } = await pool.query(
      `UPDATE job_applications
          SET status = $1,
              status_note = $2,
              status_updated_at = NOW()
        WHERE application_id = $3 AND job_id = $4
        RETURNING *`,
      [status, note, applicationId, jobId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Lamaran tidak ditemukan' });
    }

    res.json({ success: true, application: rows[0] });

  } catch (err) {
    console.error('🔴 [JOBS] updateApplicationStatus error:', err);
    res.status(500).json({ success: false, error: 'Gagal update status: ' + err.message });
  }
};

/* ============================================================
   PUT /api/job-applications/:applicationId/status (alias lama)
=============================================================== */
exports.updateApplicationStatusByAppId = async (req, res) => {
  try {
    const me = Number(req.user.userId);
    const applicationId = Number(req.params.applicationId);
    const { status } = req.body || {};

    if (!status) return res.status(400).json({ success: false, error: 'Status wajib diisi' });

    const { rows: chk } = await pool.query(
      `SELECT a.job_id, j.posted_by_id
         FROM job_applications a
         JOIN jobs j ON j.job_id = a.job_id
        WHERE a.application_id = $1`,
      [applicationId]
    );

    if (!chk.length) {
      return res.status(404).json({ success: false, error: 'Aplikasi tidak ditemukan' });
    }

    if (chk[0].posted_by_id !== me) {
      return res.status(403).json({ success: false, error: 'Bukan pemilik job' });
    }

    const { rows } = await pool.query(
      `UPDATE job_applications 
          SET status = $1, status_updated_at = NOW()
        WHERE application_id = $2
        RETURNING *`,
      [status, applicationId]
    );

    res.json({ success: true, application: rows[0] });

  } catch (err) {
    console.error('🔴 [JOBS] updateApplicationStatusByAppId error:', err);
    res.status(500).json({ success: false, error: 'Gagal update status: ' + err.message });
  }
};
