const express = require('express');
const { 
  getUserProfile, 
  getAllUsers, 
  updateUserProfile, 
  deleteUserProfile 
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, getUserProfile);
router.get('/', authMiddleware, getAllUsers);
router.put('/profile', authMiddleware, updateUserProfile);
router.delete('/profile', authMiddleware, deleteUserProfile);

module.exports = router;