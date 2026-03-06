const { Pool } = require('pg');
const logger = require('./logger');

// ─── Supabase Pooler Fix ─────────────────────────────────────
// Port 6543 = Transaction Pooler  → requires SSL + no prepared statements
// Port 5432 = Direct connection   → standard pg config
const dbUrl = process.env.DATABASE_URL || '';
const isSupabasePooler = dbUrl.includes('pooler.supabase.com');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },   // Supabase always requires SSL
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,       // 15s — pooler cold start needs more time
  allowExitOnIdle: false,
});

pool.on('connect', () => {
  logger.info('Connected to PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err.message });
});

// ─── Query Wrapper ───────────────────────────────────────────
// For Transaction Pooler (port 6543) we MUST avoid named prepared statements.
// pg by default uses unnamed statements which is fine — but just to be explicit:
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query({ text, values: params });
    const duration = Date.now() - start;
    logger.debug('Query OK', { duration: `${duration}ms`, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error', { text, error: error.message });
    throw error;
  }
};

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
