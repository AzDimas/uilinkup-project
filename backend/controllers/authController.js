const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER USER
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
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING user_id, name, email, role, angkatan, fakultas, created_at`,
      [name, email, hashedPassword, role, angkatan, fakultas]
    );

    const user = result.rows[0];

    // Auto-create profile berdasarkan role
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

    // Data user untuk frontend
    const userResponse = {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      angkatan: user.angkatan,
      fakultas: user.fakultas,
      createdAt: user.created_at,
    };

    // 🔑 Payload JWT – PAKAI user_id (bukan userId)
    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    // Generate JWT token pakai payload
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'User berhasil dibuat',
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// LOGIN USER
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cari user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email atau password salah' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: 'Email atau password salah' });
    }

    // Data dasar user
    let fullUserData = {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      angkatan: user.angkatan,
      fakultas: user.fakultas,
      createdAt: user.created_at,
    };

    // Tambahan data profil berdasarkan role
    if (user.role === 'alumni') {
      const alumniResult = await pool.query(
        `SELECT bio, skills, current_job, company, industry, location, 
                years_of_experience, linkedin_url, cv_link, portfolio_link 
         FROM alumni_profiles WHERE user_id = $1`,
        [user.user_id]
      );
      if (alumniResult.rows.length > 0) {
        fullUserData = { ...fullUserData, ...alumniResult.rows[0] };
      }
    } else if (user.role === 'student') {
      const studentResult = await pool.query(
        `SELECT nim, current_semester, ipk, interest_fields as interests, 
                bio, linkedin_url, cv_link, portfolio_link 
         FROM student_profiles WHERE user_id = $1`,
        [user.user_id]
      );
      if (studentResult.rows.length > 0) {
        fullUserData = { ...fullUserData, ...studentResult.rows[0] };
      }
    } else if (user.role === 'admin') {
      const adminResult = await pool.query(
        `SELECT department, permissions FROM admin_profiles WHERE user_id = $1`,
        [user.user_id]
      );
      if (adminResult.rows.length > 0) {
        fullUserData = { ...fullUserData, ...adminResult.rows[0] };
      }
    }

    // 🔑 Payload JWT – konsisten pakai user_id
    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    // Generate JWT token pakai payload (INI YANG PENTING)
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login berhasil',
      token,
      user: fullUserData,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login };
