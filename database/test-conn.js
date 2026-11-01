/* ==========================================================================
   STOCKIQ - POSTGRESQL CONNECTION DIAGNOSTIC TOOL
   Usage: node database/test-conn.js
   ========================================================================== */

require('dotenv').config();
const { testConnection, poolConfig } = require('./pg');

async function run() {
  console.log('====================================================');
  console.log('  StockIQ - PostgreSQL Connection Diagnostic');
  console.log('====================================================');
  console.log('Target Server:');
  console.log(`  Host:     ${poolConfig.host}:${poolConfig.port}`);
  console.log(`  Database: ${poolConfig.database}`);
  console.log(`  User:     ${poolConfig.user}`);
  console.log('Connecting to PostgreSQL...');

  const result = await testConnection();

  if (result.connected) {
    console.log('\n✅ SUCCESS: Successfully connected to PostgreSQL!');
    console.log(`  Database:   ${result.database}`);
    console.log(`  Postgres:   ${result.version}`);
    console.log(`  Server Time: ${result.timestamp}`);
    process.exit(0);
  } else {
    console.log('\n❌ CONNECTION FAILED: Could not reach PostgreSQL server.');
    console.log(`  Error: ${result.error}`);
    if (result.code) console.log(`  Code:  ${result.code}`);
    console.log('\nTroubleshooting Tips:');
    console.log('  1. Ensure PostgreSQL service is running (e.g. `net start postgresql-x64-16` or Docker)');
    console.log('  2. Verify credentials in `.env` (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)');
    console.log('  3. If database does not exist yet, run: npm run db:init');
    process.exit(1);
  }
}

run();
