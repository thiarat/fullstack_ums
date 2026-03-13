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
  // Query fresh data from DB so name/email updates are reflected immediately
  try {
    const userId = req.user.user_id;
    const result = await db.query(
      `SELECT u.user_id, u.username, u.email, r.role_name AS role, u.is_active,
              COALESCE(s.first_name, p.first_name, 'Admin') AS first_name,
              COALESCE(s.last_name,  p.last_name,  '')       AS last_name,
              COALESCE(s.profile_image, p.profile_image, u.profile_image) AS profile_image,
              s.student_id, p.prof_id
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN students s ON u.user_id = s.user_id
       LEFT JOIN professors p ON u.user_id = p.user_id
       WHERE u.user_id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: { user: result.rows[0] } });
  } catch (err) {
    // Fallback to token data if DB query fails
    res.json({ success: true, data: { user: req.user } });
  }
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
