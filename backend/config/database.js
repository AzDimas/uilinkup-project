// backend/config/database.js
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // kalau Neon, ini biasanya perlu
});

module.exports = pool;
