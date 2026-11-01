/* ==========================================================================
   ENTERPRISE ISCM - POSTGRESQL DATABASE ADAPTER & CONNECTION POOL
   Provides robust PostgreSQL connection pooling, health checks, and query execution
   ========================================================================== */

require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT, 10) || 5432,
  database: process.env.PGDATABASE || 'stockiq',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  max: parseInt(process.env.PG_MAX_CLIENTS, 10) || 20,
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS, 10) || 30000,
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT_MS, 10) || 4000
};

// If DATABASE_URL is provided, use it directly
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: poolConfig.connectionTimeoutMillis }
    : poolConfig
);

let isConnected = false;
let lastError = null;

// Catch errors on idle clients to prevent process crash
pool.on('error', (err) => {
  console.warn('⚠️ Unexpected PostgreSQL client error on idle client:', err.message);
  isConnected = false;
  lastError = err.message;
});

/**
 * Execute a parameterized query against PostgreSQL pool
 */
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log(`[SQL] ${duration}ms | rows: ${res.rowCount} | ${text.substring(0, 100)}`);
    }
    return res;
  } catch (err) {
    console.error(`[SQL ERROR] ${err.message} in query: ${text.substring(0, 120)}`);
    throw err;
  }
}

/**
 * Test connectivity to PostgreSQL and return status
 */
async function testConnection() {
  try {
    const res = await pool.query('SELECT version() as pg_version, current_database() as db_name, NOW() as current_time;');
    isConnected = true;
    lastError = null;
    return {
      connected: true,
      database: res.rows[0].db_name,
      version: res.rows[0].pg_version,
      timestamp: res.rows[0].current_time
    };
  } catch (err) {
    isConnected = false;
    lastError = err.message;
    return {
      connected: false,
      error: err.message,
      code: err.code || 'UNKNOWN'
    };
  }
}

function isAvailable() {
  return isConnected;
}

function getLastError() {
  return lastError;
}

module.exports = {
  pool,
  query,
  testConnection,
  isAvailable,
  getLastError,
  poolConfig
};
