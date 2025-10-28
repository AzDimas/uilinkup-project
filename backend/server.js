const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ TEST ROUTE - Cek server jalan
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'UILinkUp API berhasil jalan! 🚀',
    timestamp: new Date().toISOString()
  });
});

// ✅ TEST DATABASE ROUTE - Cek koneksi database
app.get('/api/users', async (req, res) => {
  const { Pool } = require('pg');
  
  // Setup koneksi database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Query database untuk ambil sample users
    const result = await pool.query(`
      SELECT user_id, name, email, role, fakultas 
      FROM users 
      LIMIT 5
    `);
    
    res.json({ 
      success: true,
      totalUsers: result.rows.length,
      users: result.rows 
    });
    
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ✅ ROOT ROUTE
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to UILinkUp Backend API!',
    endpoints: {
      test: '/api/test',
      users: '/api/users',
      docs: 'Coming soon...'
    }
  });
});

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎉 Server UILinkUp berjalan di http://localhost:${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`👥 Users endpoint: http://localhost:${PORT}/api/users`);
});