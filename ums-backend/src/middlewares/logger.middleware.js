const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    if (req.user) {
      logData.userId = req.user.user_id;
      logData.username = req.user.username;
      logData.role = req.user.role;
    }

    const level = res.statusCode >= 500 ? 'error'
      : res.statusCode >= 400 ? 'warn'
      : 'http';

    logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, logData);
  });

  next();
};

module.exports = requestLogger;
