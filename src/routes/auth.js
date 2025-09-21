const express = require('express');
const router = express.Router();

const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validateRegister, validateLogin, validateProfileUpdate } = require('../middlewares/validation');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, validateProfileUpdate, updateProfile);

module.exports = router;