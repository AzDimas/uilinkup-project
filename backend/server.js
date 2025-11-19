// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require("dotenv");
const aiRoutes = require("./routes/ai");
require('dotenv').config();
dotenv.config();
const app = express();

// ---------- Core Middlewares ----------
app.use(cors()); // kalau perlu, atur origin whitelist di sini
app.use(express.json({ limit: '2mb' }));

// ---------- DB Pool (opsional untuk healthcheck) ----------
const pool = require('./config/database');

// ---------- Routers ----------
app.use('/api/auth', require('./routes/auth'));             // Auth (login/register)
app.use('/api/users', require('./routes/users'));           // Users (profil, list, dll)
app.use('/api/connections', require('./routes/connection')); // Connections (kirim/terima/daftar)
app.use('/api/messages', require('./routes/messages'));     // ✅ Messages (baru ditambahkan)
app.use('/api/jobs', require('./routes/jobs'));             // Jobs (lowongan kerja)
app.use('/api/events', require('./routes/events'));
app.use('/api/groups', require('./routes/groups'));         // Groups & Forums (baru ditambahkan)
app.use('/api/chat', require('./routes/chatbot'));
app.use("/api/ai", aiRoutes);

// ---------- Healthcheck ----------
app.get('/api/test', (req, res) => {
  res.json({
    message: 'UILinkUp API berhasil jalan! 🚀',
    timestamp: new Date().toISOString()
  });
});

// Health DB sederhana (gunakan pool dari config/database)
app.get('/api/db-health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, db: 'ok' });
  } catch (err) {
    console.error('DB health error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Root ----------
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to UILinkUp Backend API!',
    endpoints: {
      test: '/api/test',
      dbHealth: '/api/db-health',
      auth: '/api/auth',
      users: '/api/users',
      connections: '/api/connections',
      messages: '/api/messages' // ✅ tampilkan juga di root
    }
  });
});

// ---------- 404 Fallback ----------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint tidak ditemukan'
  });
});

// ---------- Global Error Handler (jaga-jaga) ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Terjadi kesalahan pada server'
  });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎉 Server UILinkUp berjalan di http://localhost:${PORT}`);
  console.log(`📊 Test endpoint:     http://localhost:${PORT}/api/test`);
  console.log(`🗄️  DB health:         http://localhost:${PORT}/api/db-health`);
  console.log(`🔐 Auth endpoints:    http://localhost:${PORT}/api/auth`);
  console.log(`👤 Users endpoints:   http://localhost:${PORT}/api/users`);
  console.log(`🔗 Connections:       http://localhost:${PORT}/api/connections`);
  console.log(`💬 Messages:          http://localhost:${PORT}/api/messages`);
});
