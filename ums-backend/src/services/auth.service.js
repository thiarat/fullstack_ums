const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../config/logger');
const { logAction } = require('./systemLog.service');

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

// ─── bcrypt compare with $2a / $2b prefix fix ─────────────────
// pgcrypto generates $2a$ prefix; bcryptjs expects $2b$
// Normalize prefix before comparing
const bcryptCompare = async (plain, hash) => {
  if (!hash) return false;
  // Normalize $2a$ → $2b$ for bcryptjs compatibility
  const normalized = hash.startsWith('$2a$')
    ? '$2b$' + hash.slice(4)
    : hash;
  return bcrypt.compare(plain, normalized);
};

const loginUser = async (username, password) => {
  const result = await db.query(
    `SELECT u.user_id, u.username, u.password_secure, u.is_active,
            r.role_name,
            COALESCE(p.first_name, 'Admin') as first_name,
            COALESCE(p.last_name, '')       as last_name,
            p.prof_id
     FROM users u
     JOIN roles r ON u.role_id = r.role_id
     LEFT JOIN professors p ON u.user_id = p.user_id
     WHERE u.username = $1`,
    [username]
  );

  if (result.rows.length === 0) {
    logger.warn(`Login failed: user not found [${username}]`);
    throw { statusCode: 401, message: 'Invalid username or password.' };
  }

  const user = result.rows[0];
  logger.debug(`Login attempt: ${username} | hash prefix: ${user.password_secure?.slice(0,7)}`);

  if (!user.is_active) {
    throw { statusCode: 403, message: 'Account is deactivated. Please contact admin.' };
  }

  const isMatch = await bcryptCompare(password, user.password_secure);
  logger.debug(`Password match for ${username}: ${isMatch}`);

  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid username or password.' };
  }

  await db.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
    [user.user_id]
  );

  const payload = {
    user_id: user.user_id,
    username: user.username,
    role: user.role_name,
    first_name: user.first_name,
    last_name: user.last_name,
    prof_id: user.prof_id ?? null,
  };

  const tokens = generateTokens(payload);
  await logAction(user.user_id, 'LOGIN', 'users', user.user_id);
  logger.info(`Login OK: ${user.username} (${user.role_name})`);

  return { ...tokens, user: payload };
};

const loginStudent = async (username, password) => {
  const result = await db.query(
    `SELECT u.user_id, u.username, u.password_secure, u.is_active,
            r.role_name,
            s.first_name, s.last_name, s.student_id, s.profile_image
     FROM users u
     JOIN roles r ON u.role_id = r.role_id
     JOIN students s ON u.user_id = s.user_id
     WHERE u.username = $1 AND r.role_name = 'Student'`,
    [username]
  );

  if (result.rows.length === 0) {
    logger.warn(`Student login failed: not found [${username}]`);
    throw { statusCode: 401, message: 'Invalid student ID or password.' };
  }

  const user = result.rows[0];
  logger.debug(`Student login: ${username} | hash prefix: ${user.password_secure?.slice(0,7)}`);

  if (!user.is_active) {
    throw { statusCode: 403, message: 'Account is deactivated.' };
  }

  const isMatch = await bcryptCompare(password, user.password_secure);
  logger.debug(`Student password match for ${username}: ${isMatch}`);

  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid student ID or password.' };
  }

  await db.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
    [user.user_id]
  );

  const payload = {
    user_id: user.user_id,
    username: user.username,
    role: user.role_name,
    first_name: user.first_name,
    last_name: user.last_name,
    student_id: user.student_id,
    profile_image: user.profile_image,
  };

  const tokens = generateTokens(payload);
  await logAction(user.user_id, 'STUDENT_LOGIN', 'users', user.user_id);
  logger.info(`Student login OK: ${user.username}`);

  return { ...tokens, user: payload };
};

const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { iat, exp, ...payload } = decoded;
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });
    return { accessToken };
  } catch {
    throw { statusCode: 401, message: 'Invalid or expired refresh token.' };
  }
};

module.exports = { loginUser, loginStudent, refreshAccessToken };
