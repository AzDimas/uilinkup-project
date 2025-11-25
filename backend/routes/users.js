const express = require('express');
const { 
  getUserProfile, 
  getAllUsers, 
  updateUserProfile, 
  deleteUserProfile,
  getUserById,
  getUserStats,
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, getUserProfile);
router.get('/', authMiddleware, getAllUsers);
router.get('/:id/stats', authMiddleware, getUserStats);
router.get('/:id', authMiddleware, getUserById);
router.put('/profile', authMiddleware, updateUserProfile);
router.delete('/profile', authMiddleware, deleteUserProfile);

module.exports = router;