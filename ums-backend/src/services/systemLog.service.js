const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Log user action to system_logs table
 * @param {number|null} userId
 * @param {string} action
 * @param {string|null} tableName
 * @param {number|null} recordId
 */
const logAction = async (userId, action, tableName = null, recordId = null) => {
  try {
    await db.query(
      `INSERT INTO system_logs (user_id, action, table_name, record_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, action, tableName, recordId]
    );
  } catch (error) {
    // Don't throw - logging failure shouldn't break the main flow
    logger.error('Failed to write system log', { error: error.message, userId, action });
  }
};

module.exports = { logAction };
