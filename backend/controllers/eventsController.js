// backend/controllers/eventsController.js
const pool = require('../config/database');

const toInt = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Error(`INVALID_INT:${v}`);
  return n;
};

const now = () => new Date();

/**
 * Helper untuk membangun WHERE clause listEvents
 * Query:
 *  - q         : search di title/description/location
 *  - type      : event_type
 *  - audience  : all|students|alumni
 *  - from      : ISO date (filter start_time >= from)
 *  - to        : ISO date (filter start_time <= to)
 *  - onlyPublic: 'true' | 'false'  (default 'true')
 */
const buildWhere = (query) => {
  const {
    q = '',
    type = '',
    audience = '',
    from = '',
    to = '',
    onlyPublic = 'true',
  } = query;

  const where = [`e.is_cancelled = FALSE`];
  const params = [];
  let idx = 1;

  if (onlyPublic === 'true') {
    where.push(`e.is_public = TRUE`);
  }

  if (q) {
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    where.push(
      `(e.title ILIKE $${idx++} OR e.description ILIKE $${idx++} OR e.location ILIKE $${idx++})`
    );
  }

  if (type) {
    params.push(type);
    where.push(`e.event_type = $${idx++}`);
  }

  if (audience) {
    // kolom "audience" bertipe ENUM (misal event_audience: 'all','students','alumni')
    params.push(audience);
    where.push(`e.audience = $${idx++}`);
  }

  if (from) {
    params.push(from);
    where.push(`e.start_time >= $${idx++}`);
  }
  if (to) {
    params.push(to);
    where.push(`e.start_time <= $${idx++}`);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
};

/**
 * GET /api/events
 * Query: q, type, audience, from, to, page, pageSize, onlyPublic
 * - Hanya event yang tidak cancelled
 * - Default hanya event public (onlyPublic=true)
 * - Diurut start_time ASC (upcoming duluan)
 */
exports.listEvents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const offset = (page - 1) * pageSize;

    const { whereSql, params } = buildWhere(req.query);

    const totalSql = `SELECT COUNT(*)::int AS total FROM events e ${whereSql}`;
    const { rows: totalRows } = await pool.query(totalSql, params);
    const total = totalRows[0]?.total ?? 0;

    const listSql = `
      SELECT
        e.*,
        (
          SELECT COUNT(*)::int
          FROM event_registrations r
          WHERE r.event_id = e.event_id
        ) AS registered_count
      FROM events e
      ${whereSql}
      ORDER BY e.start_time ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    const { rows } = await pool.query(listSql, params);

    res.json({ success: true, items: rows, total, page, pageSize });
  } catch (err) {
    console.error('[EVENTS] listEvents error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil events: ' + err.message,
    });
  }
};

/**
 * GET /api/events/:eventId
 * Sertakan registered_count dan myRegistration (jika login)
 */
exports.getEventDetail = async (req, res) => {
  try {
    const eventId = toInt(req.params.eventId);

    const { rows } = await pool.query(
      `
      SELECT e.*,
             (
               SELECT COUNT(*)::int
               FROM event_registrations r
               WHERE r.event_id = e.event_id
             ) AS registered_count
      FROM events e
      WHERE e.event_id = $1
      `,
      [eventId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: 'Event tidak ditemukan' });
    }

    const event = rows[0];
    let myRegistration = null;

    if (req.user && req.user.userId) {
      const me = toInt(req.user.userId);
      const mine = await pool.query(
        `SELECT * FROM event_registrations WHERE event_id = $1 AND user_id = $2`,
        [eventId, me]
      );
      if (mine.rows.length > 0) {
        myRegistration = mine.rows[0];
      }
    }

    res.json({ success: true, event, myRegistration });
  } catch (err) {
    console.error('[EVENTS] getEventDetail error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil detail: ' + err.message,
    });
  }
};

/**
 * POST /api/events
 * Body:
 * {
 *   title, description, event_type,
 *   start_time, end_time, location,
 *   meeting_link?, max_attendees?,
 *   is_public?, audience?,                // 'all' | 'students' | 'alumni'
 *   registration_deadline?,               // batas akhir pendaftaran
 *   cover_image?                          // opsional URL cover
 * }
 */
exports.createEvent = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const {
      title,
      description,
      event_type,
      start_time,
      end_time,
      location,
      meeting_link = null,
      max_attendees = null,
      is_public = true,
      audience = 'all',
      registration_deadline = null,
      cover_image = null,
    } = req.body || {};

    if (!title || !description || !event_type || !start_time || !end_time || !location) {
      return res.status(400).json({
        success: false,
        error: 'Field wajib belum lengkap',
      });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO events
        (
          organizer_id,
          title,
          description,
          event_type,
          start_time,
          end_time,
          location,
          meeting_link,
          max_attendees,
          is_public,
          audience,
          registration_deadline,
          cover_image
        )
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
      `,
      [
        me,
        title,
        description,
        event_type,
        start_time,
        end_time,
        location,
        meeting_link,
        max_attendees,
        is_public,
        audience,
        registration_deadline,
        cover_image,
      ]
    );

    res.json({ success: true, event: rows[0] });
  } catch (err) {
    console.error('[EVENTS] createEvent error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat event: ' + err.message,
    });
  }
};

/**
 * PUT /api/events/:eventId
 * Hanya organizer
 */
exports.updateEvent = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const eventId = toInt(req.params.eventId);

    const { rows: chk } = await pool.query(
      `SELECT organizer_id FROM events WHERE event_id = $1`,
      [eventId]
    );
    if (chk.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: 'Event tidak ditemukan' });
    }
    if (chk[0].organizer_id !== me) {
      return res
        .status(403)
        .json({ success: false, error: 'Bukan penyelenggara' });
    }

    const {
      title,
      description,
      event_type,
      start_time,
      end_time,
      location,
      meeting_link,
      max_attendees,
      is_public,
      audience,
      registration_deadline,
      is_cancelled,
      cover_image,
    } = req.body || {};

    const { rows } = await pool.query(
      `
      UPDATE events SET
        title               = COALESCE($2,  title),
        description         = COALESCE($3,  description),
        event_type          = COALESCE($4,  event_type),
        start_time          = COALESCE($5,  start_time),
        end_time            = COALESCE($6,  end_time),
        location            = COALESCE($7,  location),
        meeting_link        = COALESCE($8,  meeting_link),
        max_attendees       = COALESCE($9,  max_attendees),
        is_public           = COALESCE($10, is_public),
        audience            = COALESCE($11, audience),
        registration_deadline = COALESCE($12, registration_deadline),
        is_cancelled        = COALESCE($13, is_cancelled),
        cover_image         = COALESCE($14, cover_image)
      WHERE event_id = $1
      RETURNING *
      `,
      [
        eventId,
        title,
        description,
        event_type,
        start_time,
        end_time,
        location,
        meeting_link,
        max_attendees,
        is_public,
        audience,
        registration_deadline,
        is_cancelled,
        cover_image,
      ]
    );

    res.json({ success: true, event: rows[0] });
  } catch (err) {
    console.error('[EVENTS] updateEvent error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengubah event: ' + err.message,
    });
  }
};

/**
 * DELETE /api/events/:eventId
 * Soft cancel: set is_cancelled = TRUE
 */
exports.cancelEvent = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const eventId = toInt(req.params.eventId);

    const { rows: chk } = await pool.query(
      `SELECT organizer_id FROM events WHERE event_id = $1`,
      [eventId]
    );
    if (chk.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: 'Event tidak ditemukan' });
    }
    if (chk[0].organizer_id !== me) {
      return res
        .status(403)
        .json({ success: false, error: 'Bukan penyelenggara' });
    }

    await pool.query(
      `UPDATE events SET is_cancelled = TRUE WHERE event_id = $1`,
      [eventId]
    );

    res.json({ success: true, cancelled: true });
  } catch (err) {
    console.error('[EVENTS] cancelEvent error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membatalkan event: ' + err.message,
    });
  }
};

/**
 * POST /api/events/:eventId/register
 */
exports.registerEvent = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const eventId = toInt(req.params.eventId);

    const { rows: erows } = await pool.query(
      `SELECT * FROM events WHERE event_id = $1`,
      [eventId]
    );
    if (erows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: 'Event tidak ditemukan' });
    }

    const ev = erows[0];

    if (ev.is_cancelled) {
      return res.status(400).json({
        success: false,
        error: 'Event dibatalkan',
      });
    }

    if (new Date(ev.end_time) < now()) {
      return res.status(400).json({
        success: false,
        error: 'Event sudah berlalu',
      });
    }

    // cek deadline pendaftaran
    if (ev.registration_deadline && new Date(ev.registration_deadline) < now()) {
      return res.status(400).json({
        success: false,
        error: 'Pendaftaran ditutup',
      });
    }

    // cek kuota
    const { rows: crows } = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM event_registrations WHERE event_id = $1`,
      [eventId]
    );
    const count = crows[0]?.cnt ?? 0;

    if (ev.max_attendees && count >= ev.max_attendees) {
      return res.status(400).json({
        success: false,
        error: 'Kuota penuh',
      });
    }

    // cek audience vs role user
    if (ev.audience !== 'all') {
      const { rows: urows } = await pool.query(
        `SELECT role FROM users WHERE user_id = $1`,
        [me]
      );
      const role = urows[0]?.role || null; // user_role enum: 'student' | 'alumni' | 'admin' (misal)

      if (ev.audience === 'students' && role !== 'student') {
        return res.status(403).json({
          success: false,
          error: 'Event khusus mahasiswa',
        });
      }

      if (ev.audience === 'alumni' && role !== 'alumni') {
        return res.status(403).json({
          success: false,
          error: 'Event khusus alumni',
        });
      }
    }

    const { rows } = await pool.query(
      `
      INSERT INTO event_registrations (event_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (event_id, user_id) DO NOTHING
      RETURNING *
      `,
      [eventId, me]
    );

    const reg = rows[0] || null;

    res.json({
      success: true,
      registered: !!reg,
      registration: reg,
    });
  } catch (err) {
    console.error('[EVENTS] registerEvent error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mendaftar: ' + err.message,
    });
  }
};

/**
 * DELETE /api/events/:eventId/register
 */
exports.unregisterEvent = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const eventId = toInt(req.params.eventId);

    await pool.query(
      `DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, me]
    );

    res.json({ success: true, unregistered: true });
  } catch (err) {
    console.error('[EVENTS] unregisterEvent error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal batal daftar: ' + err.message,
    });
  }
};

/**
 * GET /api/events/me/hosting/list
 */
exports.listMyHosting = async (req, res) => {
  try {
    const me = toInt(req.user.userId);

    const { rows } = await pool.query(
      `
      SELECT e.*,
             (
               SELECT COUNT(*)::int
               FROM event_registrations r
               WHERE r.event_id = e.event_id
             ) AS registered_count
      FROM events e
      WHERE e.organizer_id = $1
      ORDER BY e.start_time DESC
      `,
      [me]
    );

    res.json({ success: true, items: rows });
  } catch (err) {
    console.error('[EVENTS] listMyHosting error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil event saya: ' + err.message,
    });
  }
};

/**
 * GET /api/events/me/registered/list
 */
exports.listMyRegistered = async (req, res) => {
  try {
    const me = toInt(req.user.userId);

    const { rows } = await pool.query(
      `
      SELECT e.*,
             r.registered_at,
             (
               SELECT COUNT(*)::int
               FROM event_registrations x
               WHERE x.event_id = e.event_id
             ) AS registered_count
      FROM event_registrations r
      JOIN events e ON e.event_id = r.event_id
      WHERE r.user_id = $1
      ORDER BY e.start_time DESC
      `,
      [me]
    );

    res.json({ success: true, items: rows });
  } catch (err) {
    console.error('[EVENTS] listMyRegistered error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil event terdaftar: ' + err.message,
    });
  }
};

/**
 * GET /api/events/:eventId/registrants  (organizer only)
 */
exports.listRegistrants = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const eventId = toInt(req.params.eventId);

    const { rows: chk } = await pool.query(
      `SELECT organizer_id FROM events WHERE event_id = $1`,
      [eventId]
    );
    if (chk.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: 'Event tidak ditemukan' });
    }
    if (chk[0].organizer_id !== me) {
      return res
        .status(403)
        .json({ success: false, error: 'Bukan penyelenggara' });
    }

    const { rows } = await pool.query(
      `
      SELECT
        r.*,
        u.name,
        u.email,
        sp.ipk,
        sp.current_semester,
        sp.nim,
        ap.company AS alumni_company,
        ap.current_job
      FROM event_registrations r
      JOIN users u ON u.user_id = r.user_id
      LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
      LEFT JOIN alumni_profiles ap ON ap.user_id = u.user_id
      WHERE r.event_id = $1
      ORDER BY r.registered_at DESC
      `,
      [eventId]
    );

    res.json({ success: true, items: rows });
  } catch (err) {
    console.error('[EVENTS] listRegistrants error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil registrants: ' + err.message,
    });
  }
};
