const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const logger = require('../config/logger');

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
    }

    const { username, password } = req.body;

    // Determine if student (13 digit numeric) or staff
    const isStudentId = /^\d{13}$/.test(username);
    let result;

    if (isStudentId) {
      result = await authService.loginStudent(username, password);
    } else {
      result = await authService.loginUser(username, password);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

const logout = async (req, res) => {
  // JWT is stateless; client should discard tokens
  logger.info(`User logged out: ${req.user?.username}`);
  res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { login, refreshToken, getMe, logout };
