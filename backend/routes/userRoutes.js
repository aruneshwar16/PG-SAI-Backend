const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// User routes
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

module.exports = router; 