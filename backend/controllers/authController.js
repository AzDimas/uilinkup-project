const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
const register = async (req, res) => {
  const { name, email, password, role, angkatan, fakultas } = req.body;

  try {
    // Cek jika email sudah ada
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user baru
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, angkatan, fakultas) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, name, email, role`,
      [name, email, hashedPassword, role, angkatan, fakultas]
    );

    const user = result.rows[0];

    // Auto-create profile kosong berdasarkan role
    if (role === 'student') {
      await pool.query(
        `INSERT INTO student_profiles (user_id) VALUES ($1)`,
        [user.user_id]
      );
    } else if (role === 'alumni') {
      await pool.query(
        `INSERT INTO alumni_profiles (user_id) VALUES ($1)`,
        [user.user_id]
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User berhasil dibuat',
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Cari user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email atau password salah' });
    }

    const user = result.rows[0];

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Email atau password salah' });
    }

    // 3. Buat JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login };