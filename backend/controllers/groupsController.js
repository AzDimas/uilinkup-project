// backend/controllers/groupsController.js
const pool = require('../config/database');

const toInt = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Error(`INVALID_INT:${v}`);
  return n;
};

const nowIso = () => new Date().toISOString();

/* Helper: role & membership di group */
const getGroupRole = async (userId, groupId) => {
  if (!userId) return null;
  const { rows } = await pool.query(
    `SELECT role FROM group_members WHERE user_id = $1 AND group_id = $2`,
    [userId, groupId]
  );
  return rows[0]?.role || null;
};

const isAdminRole = (role) => role === 'owner' || role === 'admin';

/* ============================================================
   GET /api/groups
   Filter: q, faculty, type, page, pageSize
============================================================ */
exports.listGroups = async (req, res) => {
  try {
    const {
      q = '',
      faculty = '',
      type = '',
      page = '1',
      pageSize = '20',
    } = req.query;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20));
    const offset = (p - 1) * ps;

    const where = [];
    const params = [];
    let idx = 1;

    if (q) {
      params.push(`%${q}%`);
      params.push(`%${q}%`);
      where.push(
        `(g.name ILIKE $${idx++} OR g.description ILIKE $${idx++})`
      );
    }

    if (faculty) {
      params.push(faculty);
      where.push(`g.faculty = $${idx++}`);
    }

    if (type) {
      params.push(type);
      where.push(`g.group_type = $${idx++}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM groups g ${whereSql}`,
      params
    );
    const total = totalRows[0]?.total || 0;

    const { rows } = await pool.query(
      `SELECT g.*,
              u.name AS creator_name,
              u.email AS creator_email,
              (
                SELECT COUNT(*)::int
                FROM group_members gm
                WHERE gm.group_id = g.group_id
              ) AS member_count
         FROM groups g
         JOIN users u ON u.user_id = g.created_by_id
         ${whereSql}
         ORDER BY g.created_at DESC
         LIMIT ${ps} OFFSET ${offset}`,
      params
    );

    res.json({ success: true, items: rows, total, page: p, pageSize: ps });
  } catch (err) {
    console.error('🔴 [GROUPS] listGroups error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil daftar group: ' + err.message,
    });
  }
};

/* ============================================================
   GET /api/groups/:groupId
============================================================ */
exports.getGroupDetail = async (req, res) => {
  try {
    const groupId = toInt(req.params.groupId);
    const me = req.user ? Number(req.user.userId) : null;

    const { rows } = await pool.query(
      `SELECT g.*,
              u.name AS creator_name,
              u.email AS creator_email,
              (
                SELECT COUNT(*)::int
                FROM group_members gm
                WHERE gm.group_id = g.group_id
              ) AS member_count
         FROM groups g
         JOIN users u ON u.user_id = g.created_by_id
        WHERE g.group_id = $1`,
      [groupId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, error: 'Group tidak ditemukan' });
    }

    const group = rows[0];
    let myRole = null;

    if (me) {
      myRole = await getGroupRole(me, groupId);
    }

    res.json({
      success: true,
      group,
      myRole: myRole || null,
    });
  } catch (err) {
    console.error('🔴 [GROUPS] getGroupDetail error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil detail group: ' + err.message,
    });
  }
};

/* ============================================================
   POST /api/groups
   Body: { name, description?, group_type, faculty?, batch_year?, interest_field?, is_private? }
============================================================ */
exports.createGroup = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const {
      name,
      description = null,
      group_type,
      faculty = null,
      batch_year = null,
      interest_field = null,
      is_private = false,
    } = req.body || {};

    if (!name || !group_type) {
      return res
        .status(400)
        .json({ success: false, error: 'Nama group dan tipe wajib diisi' });
    }

    const { rows } = await pool.query(
      `INSERT INTO groups
         (name, description, group_type, faculty, batch_year,
          interest_field, is_private, created_by_id)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        name,
        description,
        group_type,
        faculty,
        batch_year,
        interest_field,
        is_private,
        me,
      ]
    );

    const group = rows[0];

    // auto masukkan creator sebagai owner di group_members
    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1,$2,'owner')
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [group.group_id, me]
    );

    res.json({ success: true, group });
  } catch (err) {
    console.error('🔴 [GROUPS] createGroup error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat group: ' + err.message,
    });
  }
};

/* ============================================================
   POST /api/groups/:groupId/join
============================================================ */
exports.joinGroup = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const groupId = toInt(req.params.groupId);

    // Pastikan group ada
    const { rows: grows } = await pool.query(
      `SELECT * FROM groups WHERE group_id = $1`,
      [groupId]
    );
    if (!grows.length) {
      return res
        .status(404)
        .json({ success: false, error: 'Group tidak ditemukan' });
    }

    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1,$2,'member')
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [groupId, me]
    );

    res.json({ success: true, joined: true });
  } catch (err) {
    console.error('🔴 [GROUPS] joinGroup error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal bergabung ke group: ' + err.message,
    });
  }
};

/* ============================================================
   POST /api/groups/:groupId/leave
============================================================ */
exports.leaveGroup = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const groupId = toInt(req.params.groupId);

    // kalau owner, bisa kita larang leave tanpa mengalihkan ownership
    const { rows: r } = await pool.query(
      `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, me]
    );
    if (!r.length) {
      return res.json({ success: true, left: true }); // sudah bukan member
    }
    if (r[0].role === 'owner') {
      return res.status(400).json({
        success: false,
        error:
          'Owner tidak bisa keluar dari group tanpa mengalihkan ownership.',
      });
    }

    await pool.query(
      `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, me]
    );

    res.json({ success: true, left: true });
  } catch (err) {
    console.error('🔴 [GROUPS] leaveGroup error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal keluar dari group: ' + err.message,
    });
  }
};

/* ============================================================
   GET /api/groups/:groupId/members
============================================================ */
exports.listGroupMembers = async (req, res) => {
  try {
    const groupId = toInt(req.params.groupId);

    const { rows } = await pool.query(
      `SELECT gm.group_member_id, gm.role, gm.joined_at,
              u.user_id, u.name, u.email, u.role AS user_role
         FROM group_members gm
         JOIN users u ON u.user_id = gm.user_id
        WHERE gm.group_id = $1
        ORDER BY gm.joined_at ASC`,
      [groupId]
    );

    res.json({ success: true, items: rows });
  } catch (err) {
    console.error('🔴 [GROUPS] listGroupMembers error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil member group: ' + err.message,
    });
  }
};

/* ============================================================
   GLOBAL FEED
   GET /api/groups/posts/feed
   q, faculty, scope, page, pageSize
   scope: 'all' (default) | 'my'
   - all : semua post dari group yang is_private = FALSE
   - my  : hanya post dari group yang user sudah join (group_members)
============================================================ */
exports.listGlobalPosts = async (req, res) => {
  try {
    const me = req.user ? Number(req.user.userId) : null;
    const {
      q = '',
      faculty = '',
      scope = 'all',
      page = '1',
      pageSize = '20',
    } = req.query;

    const myGroups = scope === 'my';

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20));
    const offset = (p - 1) * ps;

    const where = [`g.is_private = FALSE`];
    const params = [];
    let idx = 1;

    // Filter "My Groups" → hanya group di mana user join
    if (myGroups && me) {
      params.push(me);
      where.push(
        `EXISTS (
           SELECT 1
             FROM group_members gm
            WHERE gm.group_id = g.group_id
              AND gm.user_id = $${idx++}
         )`
      );
    }

    if (q) {
      params.push(`%${q}%`);
      params.push(`%${q}%`);
      where.push(
        `(gp.title ILIKE $${idx++} OR gp.content ILIKE $${idx++})`
      );
    }

    if (faculty) {
      // program yang "mengakar" ke faculty juga pakai g.faculty ini
      params.push(faculty);
      where.push(`g.faculty = $${idx++}`);
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    const baseFrom = `
      FROM group_posts gp
      JOIN groups g ON g.group_id = gp.group_id
    `;

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total
         ${baseFrom}
       ${whereSql}`,
      params
    );
    const total = totalRows[0]?.total || 0;

    const { rows } = await pool.query(
      `SELECT gp.*,
              g.name AS group_name,
              g.faculty,
              g.batch_year,
              g.interest_field,
              u.name AS author_name
         ${baseFrom}
         JOIN users  u ON u.user_id = gp.author_id
       ${whereSql}
       ORDER BY gp.created_at DESC
       LIMIT ${ps} OFFSET ${offset}`,
      params
    );

    res.json({ success: true, items: rows, total, page: p, pageSize: ps });
  } catch (err) {
    console.error('🔴 [GROUPS] listGlobalPosts error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil feed post: ' + err.message,
    });
  }
};

/* ============================================================
   LIST POST PER GROUP
   GET /api/groups/:groupId/posts
   q, page, pageSize
============================================================ */
exports.listGroupPosts = async (req, res) => {
  try {
    const groupId = toInt(req.params.groupId);
    const { q = '', page = '1', pageSize = '20' } = req.query;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20));
    const offset = (p - 1) * ps;

    const where = [`gp.group_id = $1`];
    const params = [groupId];
    let idx = 2;

    if (q) {
      params.push(`%${q}%`);
      params.push(`%${q}%`);
      where.push(
        `(gp.title ILIKE $${idx++} OR gp.content ILIKE $${idx++})`
      );
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total
         FROM group_posts gp
        ${whereSql}`,
      params
    );
    const total = totalRows[0]?.total || 0;

    const { rows } = await pool.query(
      `SELECT gp.*,
              u.name AS author_name
         FROM group_posts gp
         JOIN users u ON u.user_id = gp.author_id
        ${whereSql}
        ORDER BY gp.is_pinned DESC, gp.created_at DESC
        LIMIT ${ps} OFFSET ${offset}`,
      params
    );

    res.json({ success: true, items: rows, total, page: p, pageSize: ps });
  } catch (err) {
    console.error('🔴 [GROUPS] listGroupPosts error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil post group: ' + err.message,
    });
  }
};

/* ============================================================
   DETAIL POST
   GET /api/groups/:groupId/posts/:postId
============================================================ */
exports.getGroupPostDetail = async (req, res) => {
  try {
    const groupId = toInt(req.params.groupId);
    const postId = toInt(req.params.postId);

    const { rows } = await pool.query(
      `SELECT gp.*,
              g.name AS group_name,
              g.faculty,
              g.batch_year,
              g.interest_field,
              u.name AS author_name
         FROM group_posts gp
         JOIN groups g ON g.group_id = gp.group_id
         JOIN users  u ON u.user_id = gp.author_id
        WHERE gp.post_id = $1 AND gp.group_id = $2`,
      [postId, groupId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, error: 'Post tidak ditemukan' });
    }

    res.json({ success: true, post: rows[0] });
  } catch (err) {
    console.error('🔴 [GROUPS] getGroupPostDetail error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil detail post: ' + err.message,
    });
  }
};

/* ============================================================
   BUAT POST BARU DI GROUP
   POST /api/groups/:groupId/posts
   (Tanpa kolom visibility di DB → semua dianggap public)
============================================================ */
exports.createGroupPost = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const groupId = toInt(req.params.groupId);

    const {
      title,
      content,
      // visibility diabaikan karena kolomnya tidak ada di DB
    } = req.body || {};

    if (!title || !content) {
      return res
        .status(400)
        .json({ success: false, error: 'Judul dan konten wajib diisi' });
    }

    // wajib member group untuk ngepost
    const role = await getGroupRole(me, groupId);
    if (!role) {
      return res.status(403).json({
        success: false,
        error: 'Anda belum menjadi member group ini',
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO group_posts
         (group_id, author_id, title, content)
       VALUES
         ($1,$2,$3,$4)
       RETURNING *`,
      [groupId, me, title, content]
    );

    res.json({ success: true, post: rows[0] });
  } catch (err) {
    console.error('🔴 [GROUPS] createGroupPost error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat post: ' + err.message,
    });
  }
};

/* ============================================================
   LIST REPLIES
   GET /api/groups/:groupId/posts/:postId/replies
============================================================ */
exports.listPostReplies = async (req, res) => {
  try {
    const postId = toInt(req.params.postId);

    const { rows } = await pool.query(
      `SELECT r.*,
              u.user_id AS author_id,
              u.name AS author_name
         FROM group_post_replies r
         JOIN users u ON u.user_id = r.author_id
        WHERE r.post_id = $1
        ORDER BY r.created_at ASC`,
      [postId]
    );

    res.json({ success: true, items: rows });
  } catch (err) {
    console.error('🔴 [GROUPS] listPostReplies error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil replies: ' + err.message,
    });
  }
};

/* ============================================================
   TAMBAH REPLY
   POST /api/groups/:groupId/posts/:postId/replies
   (reply_count diupdate, tanpa last_activity_at)
   → semua user login boleh reply, tidak cek membership
============================================================ */
exports.addPostReply = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const groupId = toInt(req.params.groupId);
    const postId = toInt(req.params.postId);

    const { content, parent_reply_id = null } = req.body || {};
    if (!content) {
      return res
        .status(400)
        .json({ success: false, error: 'Konten reply wajib diisi' });
    }

    // Pastikan post ada di dalam group
    const { rows: p } = await pool.query(
      `SELECT post_id FROM group_posts WHERE post_id = $1 AND group_id = $2`,
      [postId, groupId]
    );
    if (!p.length) {
      return res
        .status(404)
        .json({ success: false, error: 'Post tidak ditemukan' });
    }

    // tidak cek membership → semua user yang login boleh reply
    const { rows } = await pool.query(
      `INSERT INTO group_post_replies
         (post_id, author_id, parent_reply_id, content)
       VALUES
         ($1,$2,$3,$4)
       RETURNING *`,
      [postId, me, parent_reply_id, content]
    );

    await pool.query(
      `UPDATE group_posts
         SET reply_count = reply_count + 1
       WHERE post_id = $1`,
      [postId]
    );

    res.json({ success: true, reply: rows[0] });
  } catch (err) {
    console.error('🔴 [GROUPS] addPostReply error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal menambah reply: ' + err.message,
    });
  }
};

/* ============================================================
   TANDAI JAWABAN (Q&A)
   POST /api/groups/:groupId/posts/:postId/replies/:replyId/mark-answer
   (Backend masih ada, walau frontend kamu sekarang sudah tidak pakai)
============================================================ */
exports.markReplyAsAnswer = async (req, res) => {
  try {
    const me = toInt(req.user.userId);
    const groupId = toInt(req.params.groupId);
    const postId = toInt(req.params.postId);
    const replyId = toInt(req.params.replyId);

    // ambil data post & group
    const { rows: pRows } = await pool.query(
      `SELECT gp.post_id, gp.author_id, gp.group_id
         FROM group_posts gp
        WHERE gp.post_id = $1 AND gp.group_id = $2`,
      [postId, groupId]
    );
    if (!pRows.length) {
      return res
        .status(404)
        .json({ success: false, error: 'Post tidak ditemukan' });
    }
    const post = pRows[0];

    const role = await getGroupRole(me, groupId);
    const isPostAuthor = Number(post.author_id) === me;
    const canManage = isPostAuthor || isAdminRole(role);

    if (!canManage) {
      return res.status(403).json({
        success: false,
        error: 'Tidak punya izin menandai jawaban',
      });
    }

    // set semua reply di post jadi is_answer = false, lalu set yang dipilih = true
    await pool.query(
      `UPDATE group_post_replies
          SET is_answer = FALSE
        WHERE post_id = $1`,
      [postId]
    );

    const { rows } = await pool.query(
      `UPDATE group_post_replies
          SET is_answer = TRUE
        WHERE reply_id = $1 AND post_id = $2
        RETURNING *`,
      [replyId, postId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, error: 'Reply tidak ditemukan' });
    }

    res.json({ success: true, reply: rows[0] });
  } catch (err) {
    console.error('🔴 [GROUPS] markReplyAsAnswer error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal menandai jawaban: ' + err.message,
    });
  }
};
