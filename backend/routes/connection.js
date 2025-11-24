const express = require('express');
const {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getUserConnections,
  getPendingRequests,
  getSentRequests,
  checkConnectionStatus,
  removeConnection,
  getConnectionStats,
  getConnectionStatsByUserId
} = require('../controllers/connectionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/:userId/send', authMiddleware, sendConnectionRequest);
router.get('/status/:userId', authMiddleware, checkConnectionStatus);
router.get('/my-connections', authMiddleware, getUserConnections);
router.get('/pending-requests', authMiddleware, getPendingRequests);
router.get('/sent-requests', authMiddleware, getSentRequests);
router.get('/stats', authMiddleware, getConnectionStats);
router.get('/stats/:userId', authMiddleware, getConnectionStatsByUserId);
router.put('/:connectionId/accept', authMiddleware, acceptConnectionRequest);
router.put('/:connectionId/reject', authMiddleware, rejectConnectionRequest);
router.delete('/:connectionId/remove', authMiddleware, removeConnection);

module.exports = router;