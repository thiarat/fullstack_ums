const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authCtrl = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Login
router.post('/login',
  body('username').notEmpty(),
  body('password').notEmpty(),
  authCtrl.login
);

// Refresh token
router.post('/refresh', authCtrl.refreshToken);

// Get current user
router.get('/me', authenticate, authCtrl.getMe);

// Logout
router.post('/logout', authenticate, authCtrl.logout);

// NEW: ลืมรหัส — นักศึกษา/อาจารย์ส่ง request มาให้ Admin
router.post('/forgot-password', authCtrl.requestPasswordReset);

module.exports = router;
