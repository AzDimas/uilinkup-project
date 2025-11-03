// controllers/connectionController.js
const pool = require('../config/database');

// SEND CONNECTION REQUEST
const sendConnectionRequest = async (req, res) => {
  console.log('🟡 [CONNECTION] Send connection request:', {
    fromUserId: req.user.userId,
    toUserId: req.params.userId
  });

  try {
    const fromUserId = parseInt(req.user.userId, 10);
    const toUserId = parseInt(req.params.userId, 10);

    if (Number.isNaN(fromUserId) || Number.isNaN(toUserId)) {
      return res.status(400).json({ success: false, error: 'User ID tidak valid' });
    }

    // Tidak boleh connect ke diri sendiri
    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        error: 'Tidak bisa mengirim koneksi ke diri sendiri'
      });
    }

    // Pastikan user target ada
    const userCheck = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [toUserId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan'
      });
    }

    // Cek apakah sudah ada koneksi (arah apa pun)
    const existingConnection = await pool.query(
      `SELECT connection_id, status 
       FROM connections 
       WHERE (user1_id = $1 AND user2_id = $2) 
          OR (user1_id = $2 AND user2_id = $1)`,
      [Math.min(fromUserId, toUserId), Math.max(fromUserId, toUserId)]
    );

    if (existingConnection.rows.length > 0) {
      const connection = existingConnection.rows[0];
      return res.status(400).json({
        success: false,
        error: `Koneksi sudah ${connection.status === 'pending' ? 'dalam proses' : 'diterima'}`
      });
    }

    // Simpan koneksi
    const user1Id = Math.min(fromUserId, toUserId);
    const user2Id = Math.max(fromUserId, toUserId);

    console.log('🟡 [CONNECTION] Inserting connection:', {
      user1Id,
      user2Id,
      requester_id: fromUserId,
      recipient_id: toUserId
    });

    const result = await pool.query(
      `INSERT INTO connections (user1_id, user2_id, status, requester_id, recipient_id)
       VALUES ($1, $2, 'pending', $3, $4)
       RETURNING connection_id`,
      [user1Id, user2Id, fromUserId, toUserId]
    );

    console.log('🟢 [CONNECTION] Connection created:', result.rows[0]);

    res.json({
      success: true,
      message: 'Permintaan koneksi berhasil dikirim',
      connectionId: result.rows[0].connection_id
    });
  } catch (err) {
    console.error('🔴 [CONNECTION] Send connection error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengirim permintaan koneksi: ' + err.message
    });
  }
};

// CHECK CONNECTION STATUS
const checkConnectionStatus = async (req, res) => {
  console.log('🟡 [CONNECTION] Check connection status:', {
    userId: req.user.userId,
    otherUserId: req.params.userId
  });

  try {
    const userId = parseInt(req.user.userId, 10);
    const otherUserId = parseInt(req.params.userId, 10);

    const result = await pool.query(
      `SELECT 
        connection_id,
        status,
        user1_id,
        user2_id,
        requester_id,
        recipient_id,
        created_at
       FROM connections 
       WHERE (user1_id = $1 AND user2_id = $2) 
          OR (user1_id = $2 AND user2_id = $1)`,
      [Math.min(userId, otherUserId), Math.max(userId, otherUserId)]
    );

    console.log('🟢 [CONNECTION] Check result:', result.rows);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        status: 'not_connected'
      });
    }

    const connection = result.rows[0];

    let requestDirection = null;
    if (connection.status === 'pending') {
      const isRequester = connection.requester_id === userId;
      requestDirection = isRequester ? 'outgoing' : 'incoming';
      console.log('🟡 [CONNECTION] Request direction:', {
        userId,
        requester_id: connection.requester_id,
        recipient_id: connection.recipient_id,
        isRequester,
        requestDirection
      });
    }

    res.json({
      success: true,
      status: connection.status,
      connectionId: connection.connection_id,
      requestDirection,
      createdAt: connection.created_at
    });
  } catch (err) {
    console.error('🔴 [CONNECTION] Check connection status error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal memeriksa status koneksi: ' + err.message
    });
  }
};

// GET USER CONNECTIONS (accepted only)
const getUserConnections = async (req, res) => {
  console.log('🟡 [CONNECTION] Get user connections:', {
    userId: req.user.userId
  });

  try {
    const userId = parseInt(req.user.userId, 10);

    const result = await pool.query(
      `SELECT 
        c.connection_id,
        c.status,
        c.created_at,
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.fakultas,
        u.angkatan
       FROM connections c
       JOIN users u ON (
         CASE 
           WHEN c.user1_id = $1 THEN c.user2_id
           ELSE c.user1_id
         END
       ) = u.user_id
       WHERE (c.user1_id = $1 OR c.user2_id = $1)
       AND c.status = 'accepted'
       ORDER BY c.created_at DESC`,
      [userId]
    );

    console.log('🟢 [CONNECTION] User connections:', result.rows.length);

    res.json({
      success: true,
      connections: result.rows
    });
  } catch (err) {
    console.error('🔴 [CONNECTION] Get connections error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil daftar koneksi: ' + err.message
    });
  }
};

// GET PENDING REQUESTS (incoming untuk user login)
const getPendingRequests = async (req, res) => {
  console.log('🟡 [CONNECTION] Get pending requests (incoming):', {
    userId: req.user.userId
  });

  try {
    const userId = parseInt(req.user.userId, 10);

    const result = await pool.query(
      `SELECT 
        c.connection_id,
        c.created_at,
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.fakultas,
        u.angkatan
       FROM connections c
       JOIN users u ON c.requester_id = u.user_id   -- tampilkan profil pengirim
       WHERE c.recipient_id = $1
       AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId]
    );

    console.log('🟢 [CONNECTION] Pending requests:', result.rows.length);

    res.json({
      success: true,
      pendingRequests: result.rows
    });
  } catch (err) {
    console.error('🔴 [CONNECTION] Get pending requests error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil permintaan koneksi: ' + err.message
    });
  }
};

// GET SENT REQUESTS (outgoing dari user login)
const getSentRequests = async (req, res) => {
  console.log('🟡 [CONNECTION] Get sent requests (outgoing):', {
    userId: req.user.userId
  });

  try {
    const userId = parseInt(req.user.userId, 10);

    const result = await pool.query(
      `SELECT 
        c.connection_id,
        c.created_at,
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.fakultas,
        u.angkatan
       FROM connections c
       JOIN users u ON c.recipient_id = u.user_id   -- tampilkan profil penerima
       WHERE c.requester_id = $1
       AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId]
    );

    console.log('🟢 [CONNECTION] Sent requests:', result.rows.length);

    res.json({
      success: true,
      sentRequests: result.rows
    });
  } catch (err) {
    console.error('🔴 [CONNECTION] Get sent requests error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil permintaan koneksi yang dikirim: ' + err.message
    });
  }
};

// ACCEPT CONNECTION (hanya boleh oleh recipient)
const acceptConnectionRequest = async (req, res) => {
  console.log('🟡 [CONNECTION] Accept connection:', {
    userId: req.user.userId,
    connectionId: req.params.connectionId
  });

  try {
    const userId = parseInt(req.user.userId, 10);
    const connectionId = parseInt(req.params.connectionId, 10);

    const result = await pool.query(
      `UPDATE connections 
       SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
       WHERE connection_id = $1 
       AND recipient_id = $2
       AND status = 'pending' 
       RETURNING *`,
      [connectionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Permintaan koneksi tidak ditemukan atau Anda bukan penerima'
      });
    }

    console.log('🟢 [CONNECTION] Connection accepted:', result.rows[0]);

    res.json({
      success: true,
      message: 'Koneksi berhasil diterima'
    });
  } catch (err) {
    console.error('🔴 [CONNECTION] Accept connection error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal menerima koneksi: ' + err.message
    });
  }
};

// REJECT CONNECTION (hapus pending; hanya boleh oleh recipient)
const rejectConnectionRequest = async (req, res) => {
  console.log('🟡 [CONNECTION] Reject connection:', {
    userId: req.user.userId,
    connectionId: req.params.connectionId
  });

  try {
    const userId = parseInt(req.user.userId, 10);
    const connectionId = parseInt(req.params.connectionId, 10);

    const result = await pool.query(
      `DELETE FROM connections 
       WHERE connection_id = $1 
       AND recipient_id = $2
       AND status = 'pending' 
       RETURNING *`,
      [connectionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Permintaan koneksi tidak ditemukan atau Anda bukan penerima'
      });
    }

    console.log('🟢 [CONNECTION] Connection rejected:', result.rows[0]);

    res.json({
      success: true,
      message: 'Koneksi berhasil ditolak'
    });
  } catch (err) {
    console.error('🔴 [CONNECTION] Reject connection error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal menolak koneksi: ' + err.message
    });
  }
};

// REMOVE CONNECTION
// - Jika pending: hanya requester yang boleh cancel
// - Jika accepted: kedua pihak boleh remove
const removeConnection = async (req, res) => {
  console.log('🟡 [CONNECTION] Remove connection:', {
    userId: req.user.userId,
    connectionId: req.params.connectionId
  });

  try {
    const userId = parseInt(req.user.userId, 10);
    const connectionId = parseInt(req.params.connectionId, 10);

    const { rows } = await pool.query(
      `SELECT connection_id, status, requester_id, recipient_id
       FROM connections
       WHERE connection_id = $1`,
      [connectionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Koneksi tidak ditemukan' });
    }

    const c = rows[0];

    if (c.status === 'pending') {
      if (c.requester_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Hanya pengirim yang bisa membatalkan permintaan koneksi'
        });
      }
    } else if (c.status === 'accepted') {
      // OK oleh kedua pihak
      if (c.requester_id !== userId && c.recipient_id !== userId) {
        return res.status(403).json({ success: false, error: 'Tidak berwenang' });
      }
    } else {
      // Status lain (fallback)
      return res.status(400).json({ success: false, error: 'Status koneksi tidak valid' });
    }

    await pool.query(
      `DELETE FROM connections WHERE connection_id = $1`,
      [connectionId]
    );

    console.log('🟢 [CONNECTION] Connection removed:', connectionId);

    res.json({
      success: true,
      message: c.status === 'pending' ? 'Permintaan koneksi dibatalkan' : 'Koneksi berhasil dihapus'
    });
  } catch (err) {
    console.error('🔴 [CONNECTION] Remove connection error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus koneksi: ' + err.message
    });
  }
};

// GET STATS
const getConnectionStats = async (req, res) => {
  console.log('🟡 [CONNECTION] Get connection stats:', {
    userId: req.user.userId
  });

  try {
    const userId = parseInt(req.user.userId, 10);

    const stats = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'accepted') as total_connections,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests
       FROM connections 
       WHERE user1_id = $1 OR user2_id = $1`,
      [userId]
    );

    console.log('🟢 [CONNECTION] Stats:', stats.rows[0]);

    res.json({
      success: true,
      stats: stats.rows[0]
    });
  } catch (err) {
    console.error('🔴 [CONNECTION] Get connection stats error:', err);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil statistik koneksi: ' + err.message
    });
  }
};

module.exports = {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getUserConnections,
  getPendingRequests,
  getSentRequests,
  checkConnectionStatus,
  removeConnection,
  getConnectionStats
};
