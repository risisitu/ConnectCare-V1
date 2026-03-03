const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

// Public routes for password reset flow
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router;
