const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const db = require('../config/database');
const logger = require('../config/logger');

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }
    const { username, password } = req.body;
    const isStudentId = /^\d{13}$/.test(username);
    const result = isStudentId
      ? await authService.loginStudent(username, password)
      : await authService.loginUser(username, password);

    res.json({ success: true, message: 'Login successful', data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    const result = await authService.refreshAccessToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

const logout = async (req, res) => {
  logger.info(`User logged out: ${req.user?.username}`);
  res.json({ success: true, message: 'Logged out successfully.' });
};

// ลืมรหัส — ส่ง request ให้ Admin (ไม่ต้องล็อกอิน)
const requestPasswordReset = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'กรุณาระบุ username' });

    const result = await db.query(
      'SELECT user_id FROM users WHERE username = $1 AND is_active = true', [username]
    );

    // ไม่บอกว่า user ไม่มี (security)
    if (result.rows.length === 0) {
      return res.json({ success: true, message: 'ส่งคำขอเรียบร้อย Admin จะดำเนินการให้' });
    }

    const userId = result.rows[0].user_id;
    const existing = await db.query(
      `SELECT request_id FROM password_reset_requests WHERE user_id = $1 AND status = 'pending'`, [userId]
    );
    if (existing.rows.length > 0) {
      return res.json({ success: true, message: 'มีคำขอรีเซ็ตรหัสอยู่แล้ว กรุณารอ Admin ดำเนินการ' });
    }

    await db.query('INSERT INTO password_reset_requests (user_id) VALUES ($1)', [userId]);
    res.json({ success: true, message: 'ส่งคำขอเรียบร้อย กรุณารอ Admin ดำเนินการ' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refreshToken, getMe, logout, requestPasswordReset };
