// backend/routes/aiRoutes.js
const express = require("express");
const router = express.Router();

const { handleAiSearch } = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware"); // path-nya samain dengan file-mu

// Kalau mau AI wajib login:
router.post("/search", authMiddleware, handleAiSearch);

module.exports = router;
