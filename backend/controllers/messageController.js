// backend/controllers/messageController.js
const pool = require('../config/database');

/* ---------------------------
   Helpers
---------------------------- */
function toIntStrict(x, label = 'value') {
  const n = Number(x);
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`Invalid ${label}: expected positive integer, got "${x}"`);
    err.code = 'INVALID_INT';
    throw err;
  }
  return n;
}

function extractUserIdFromReq(req) {
  // authMiddleware lama: req.user = decoded
  // Token kamu mungkin punya variasi field.
  const u = req.user;
  const candidates = [
    u?.userId,
    u?.id,
    u?.user?.userId,
    u?.user?.id,
    u?.data?.userId,
    u?.data?.id,
    u?.sub,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isInteger(n) && n > 0) return n;
  }
  // fallback: kalau decoded memang angka (jarang)
  if (Number.isInteger(u)) return u;
  const err = new Error(`Invalid current user: expected integer, got "${String(u)}"`);
  err.code = 'INVALID_INT';
  throw err;
}

async function isUsersConnected(a, b) {
  const user1 = Math.min(a, b);
  const user2 = Math.max(a, b);
  const { rows } = await pool.query(
    `SELECT 1 FROM connections
     WHERE user1_id = $1 AND user2_id = $2 AND status = 'accepted'
     LIMIT 1`,
    [user1, user2]
  );
  return rows.length > 0;
}

/* ---------------------------
   GET /api/messages/threads
   Daftar partner (pernah chat ATAU sudah accepted) + last msg + unread
---------------------------- */
async function getThreads(req, res) {
  try {
    const me = toIntStrict(extractUserIdFromReq(req), 'current user');

    // Kumpulkan kandidat partner dari messages & connections
    const { rows: partners } = await pool.query(
      `
      WITH
      msg_pairs AS (
        SELECT DISTINCT
          CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS partner_id
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
      ),
      conn_pairs AS (
        SELECT
          CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END AS partner_id
        FROM connections c
        WHERE (c.user1_id = $1 OR c.user2_id = $1) AND c.status = 'accepted'
      ),
      all_partners AS (
        SELECT partner_id FROM msg_pairs
        UNION
        SELECT partner_id FROM conn_pairs
      )
      SELECT DISTINCT ap.partner_id
      FROM all_partners ap
      `,
      [me] // ← penting: ada $1, maka param harus diisi
    );

    if (partners.length === 0) {
      return res.json({ success: true, threads: [] });
    }

    const partnerIds = partners.map((r) => r.partner_id);

    // Ambil metadata thread per partner
    const { rows: threadRows } = await pool.query(
      `
      SELECT
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.fakultas,
        u.angkatan,
        -- last message content
        (
          SELECT m.content
          FROM messages m
          WHERE (m.sender_id = $1 AND m.receiver_id = u.user_id)
             OR (m.sender_id = u.user_id AND m.receiver_id = $1)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message,
        -- last message time
        (
          SELECT m.created_at
          FROM messages m
          WHERE (m.sender_id = $1 AND m.receiver_id = u.user_id)
             OR (m.sender_id = u.user_id AND m.receiver_id = $1)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_at,
        -- unread count (pesan dia ke saya yg belum dibaca)
        (
          SELECT COUNT(*)::int
          FROM messages m
          WHERE m.receiver_id = $1
            AND m.sender_id = u.user_id
            AND m.is_read = FALSE
        ) AS unread_count
      FROM users u
      WHERE u.user_id = ANY($2::int[])
      ORDER BY last_at DESC NULLS LAST, u.name ASC
      `,
      [me, partnerIds]
    );

    return res.json({ success: true, threads: threadRows });
  } catch (err) {
    console.error('🔴 [MESSAGES] getThreads error:', err);
    const msg =
      err.code === 'INVALID_INT'
        ? err.message
        : 'Gagal mengambil threads: ' + err.message;
    return res.status(500).json({ success: false, error: msg });
  }
}

/* ---------------------------
   GET /api/messages/unread-count
   Ringkasan unread per partner (untuk badge sidebar)
---------------------------- */
async function getUnreadSummary(req, res) {
  try {
    const me = toIntStrict(extractUserIdFromReq(req), 'current user');
    const { rows } = await pool.query(
      `
      SELECT sender_id AS partner_id, COUNT(*)::int AS count
      FROM messages
      WHERE receiver_id = $1 AND is_read = FALSE
      GROUP BY sender_id
      `,
      [me]
    );
    return res.json({ success: true, summary: rows });
  } catch (err) {
    console.error('🔴 [MESSAGES] getUnreadSummary error:', err);
    return res.status(500).json({ success: false, error: 'Gagal mengambil unread count: ' + err.message });
  }
}

/* ---------------------------
   GET /api/messages/history?userId=&limit=&cursor=
   (FE kamu pakai endpoint ini)
---------------------------- */
async function getHistory(req, res) {
  try {
    const me = toIntStrict(extractUserIdFromReq(req), 'current user');

    const other = toIntStrict(req.query.userId, 'userId');
    const limit = Math.min(toIntStrict(Number(req.query.limit || 20), 'limit'), 100);
    const cursor = req.query.cursor ? toIntStrict(req.query.cursor, 'cursor') : null;

    const allowed = await isUsersConnected(me, other);
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Belum terkoneksi (accepted) dengan user ini' });
    }

    const params = [me, other];
    let sql = `
      SELECT *
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
    `;

    if (cursor) {
      sql += ` AND message_id < $3`;
      params.push(cursor);
    }

    // DESC supaya cursor "older" gampang; nanti dibalik sebelum kirim
    sql += ` ORDER BY message_id DESC LIMIT ${limit}`;

    const { rows } = await pool.query(sql, params);
    const nextCursor = rows.length > 0 ? rows[rows.length - 1].message_id : null;

    // FE kamu expect: { items: [...], nextCursor }
    return res.json({
      success: true,
      items: rows.reverse(), // oldest → newest
      nextCursor,
    });
  } catch (err) {
    console.error('🔴 [MESSAGES] getHistory error:', err);
    const msg =
      err.code === 'INVALID_INT'
        ? err.message
        : 'Gagal mengambil percakapan: ' + err.message;
    return res.status(500).json({ success: false, error: msg });
  }
}

/* ---------------------------
   GET /api/messages/conversation/:userId
   Versi param (opsional/legacy). Mengembalikan shape sama dengan /history
---------------------------- */
async function getConversation(req, res) {
  try {
    const me = toIntStrict(extractUserIdFromReq(req), 'current user');

    const other = toIntStrict(req.params.userId, 'userId');
    const limit = Math.min(toIntStrict(Number(req.query.limit || 20), 'limit'), 100);
    const before = req.query.before ? toIntStrict(req.query.before, 'before') : null;

    const allowed = await isUsersConnected(me, other);
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Belum terkoneksi (accepted) dengan user ini' });
    }

    const params = [me, other];
    let sql = `
      SELECT *
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
    `;
    if (before) {
      sql += ` AND message_id < $3`;
      params.push(before);
    }
    sql += ` ORDER BY message_id DESC LIMIT ${limit}`;

    const { rows } = await pool.query(sql, params);
    const nextCursor = rows.length > 0 ? rows[rows.length - 1].message_id : null;

    return res.json({
      success: true,
      items: rows.reverse(),
      nextCursor,
    });
  } catch (err) {
    console.error('🔴 [MESSAGES] getConversation error:', err);
    const msg =
      err.code === 'INVALID_INT'
        ? err.message
        : 'Gagal mengambil percakapan: ' + err.message;
    return res.status(500).json({ success: false, error: msg });
  }
}

/* ---------------------------
   POST /api/messages/send
   body: { receiverId, content, messageType?, fileUrl? }
---------------------------- */
async function sendMessage(req, res) {
  try {
    const sender = toIntStrict(extractUserIdFromReq(req), 'current user');
    const receiver = toIntStrict(req.body?.receiverId, 'receiverId');

    const content = (req.body?.content || '').toString();
    const messageType = (req.body?.messageType || 'text').toString();
    const fileUrl = req.body?.fileUrl || null;

    if (!content && !fileUrl) {
      return res.status(400).json({ success: false, error: 'Content atau fileUrl wajib diisi' });
    }

    const allowed = await isUsersConnected(sender, receiver);
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Belum terkoneksi (accepted) dengan user ini' });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO messages (sender_id, receiver_id, content, message_type, file_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [sender, receiver, content, messageType, fileUrl]
    );

    const msg = rows[0];

    // Optional: Socket.IO realtime
    const io = req.app?.get && req.app.get('io');
    if (io) {
      io.to(String(receiver)).emit('message:new', {
        from: sender,
        to: receiver,
        message: msg,
      });
    }

    return res.json({ success: true, message: msg });
  } catch (err) {
    console.error('🔴 [MESSAGES] sendMessage error:', err);
    const msg =
      err.code === 'INVALID_INT'
        ? err.message
        : 'Gagal mengirim pesan: ' + err.message;
    return res.status(500).json({ success: false, error: msg });
  }
}

/* ---------------------------
   POST /api/messages/mark-read
   body: { userId }
---------------------------- */
async function markAsRead(req, res) {
  try {
    const me = toIntStrict(extractUserIdFromReq(req), 'current user');
    const other = toIntStrict(req.body?.userId, 'userId');

    const { rowCount } = await pool.query(
      `
      UPDATE messages
      SET is_read = TRUE
      WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE
      `,
      [me, other]
    );

    return res.json({ success: true, updated: rowCount });
  } catch (err) {
    console.error('🔴 [MESSAGES] markAsRead error:', err);
    const msg =
      err.code === 'INVALID_INT'
        ? err.message
        : 'Gagal update read status: ' + err.message;
    return res.status(500).json({ success: false, error: msg });
  }
}

module.exports = {
  getThreads,
  getUnreadSummary,
  getHistory,
  getConversation, // optional/legacy
  sendMessage,
  markAsRead,
};
