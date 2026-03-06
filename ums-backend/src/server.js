require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const requestLogger = require('./middlewares/logger.middleware');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const authRoutes      = require('./routes/auth.routes');
const adminRoutes     = require('./routes/admin.routes');
const studentRoutes   = require('./routes/student.routes');
const professorRoutes = require('./routes/professor.routes');
const libraryRoutes   = require('./routes/library.routes');

// Create logs dir only in non-serverless environments
if (process.env.NODE_ENV !== 'production') {
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ───────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, Swagger, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Explicit preflight
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── API Docs (local only) ───────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'UMS API Documentation',
  swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Health Check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'UMS API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/student',   studentRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/library',   libraryRoutes);

// ─── 404 & Error Handler ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server (local only — Vercel uses module.exports) ─
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info(`UMS API Server started — http://localhost:${PORT}`);
    logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
