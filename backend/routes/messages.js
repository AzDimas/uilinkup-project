// backend/routes/messages.js
const express = require('express');
const router = express.Router();

// ⚠️ Sesuai keinginanmu: default export, BUKAN destructuring
const authMiddleware = require('../middleware/authMiddleware');

const {
  getThreads,
  getHistory,          // FE pakai /messages/history
  getConversation,     // opsi alternatif via :userId (biar fleksibel)
  sendMessage,
  markAsRead,
  getUnreadSummary,    // FE pakai /messages/unread-count
} = require('../controllers/messageController');

// Health check sederhana
router.get('/health', (req, res) => res.json({ ok: true, route: 'messages' }));

// ==== Endpoints yang dipakai FE sekarang ====
router.get('/threads', authMiddleware, getThreads);
router.get('/history', authMiddleware, getHistory);          // ?userId=&limit=&cursor=
router.post('/send', authMiddleware, sendMessage);           // { receiverId, content, ... }
router.post('/mark-read', authMiddleware, markAsRead);       // { userId }
router.get('/unread-count', authMiddleware, getUnreadSummary);

// ==== Alternatif/legacy (optional, aman untuk dipasang) ====
router.get('/conversation/:userId', authMiddleware, getConversation); // sama dengan /history tapi via param

module.exports = router;
