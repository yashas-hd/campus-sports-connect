const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyOTP, resendOTP } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

module.exports = router;
