/* ==========================================================================
   STOCKIQ - POSTGRESQL DATABASE INITIALIZER & MIGRATOR
   Creates the database (if needed), executes schema.sql, and seeds all 40 tables
   Usage: npm run db:init  (or: node database/init-db.js)
   ========================================================================== */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');
const { poolConfig } = require('./pg');
const { runSeeder, generateSeedSqlFile } = require('./seed');

async function createDatabaseIfNotExists() {
  const targetDb = poolConfig.database;
  console.log(`\n🔍 Checking database [${targetDb}] on ${poolConfig.host}:${poolConfig.port}...`);

  // Connect to default maintenance database 'postgres'
  const adminClient = new Client({
    host: poolConfig.host,
    port: poolConfig.port,
    user: poolConfig.user,
    password: poolConfig.password,
    database: 'postgres',
    connectionTimeoutMillis: poolConfig.connectionTimeoutMillis
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1;`,
      [targetDb]
    );

    if (res.rowCount === 0) {
      console.log(`🔨 Database [${targetDb}] does not exist. Creating...`);
      await adminClient.query(`CREATE DATABASE "${targetDb}";`);
      console.log(`✅ Database [${targetDb}] successfully created!`);
    } else {
      console.log(`✓ Database [${targetDb}] already exists.`);
    }
  } catch (err) {
    console.warn(`⚠️ Notice connecting to maintenance database: ${err.message}`);
    // If user doesn't have permission to create DB or already targeting custom DB, continue to attempt connection
  } finally {
    try { await adminClient.end(); } catch (_) {}
  }
}

async function applySchema(client) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  console.log(`\n📜 Executing schema DDL from: ${schemaPath}...`);
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  await client.query(schemaSql);
  console.log('✅ Schema tables, extensions, and indexes created successfully!');
}

async function getTableRowCounts(client) {
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  const counts = {};
  for (const row of tablesRes.rows) {
    const t = row.table_name;
    try {
      const c = await client.query(`SELECT COUNT(*) as count FROM "${t}";`);
      counts[t] = parseInt(c.rows[0].count, 10);
    } catch (_) {}
  }
  return counts;
}

async function main() {
  console.log('====================================================');
  console.log('  StockIQ - PostgreSQL Database Setup & Migration');
  console.log('====================================================');

  // Step 1: Ensure static seed file is up-to-date
  generateSeedSqlFile();

  // Step 2: Ensure database exists
  await createDatabaseIfNotExists();

  // Step 3: Connect to target database
  console.log(`\n🔌 Connecting to target database [${poolConfig.database}]...`);
  const targetPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    password: poolConfig.password,
    connectionTimeoutMillis: poolConfig.connectionTimeoutMillis
  });

  let client;
  try {
    client = await targetPool.connect();
    console.log('✅ Connected successfully!');

    // Step 4: Apply Schema
    await applySchema(client);

    // Step 5: Seed Data
    console.log('\n🌱 Seeding initial records...');
    await runSeeder(client);

    // Step 6: Summary Verification
    console.log('\n📊 Database Row Verification Report:');
    console.log('----------------------------------------------------');
    const counts = await getTableRowCounts(client);
    for (const [table, count] of Object.entries(counts)) {
      console.log(`  ${table.padEnd(32)}: ${count} rows`);
    }
    console.log('----------------------------------------------------');
    console.log('🎉 PostgreSQL Database is ready for production use!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Initialization Error:', err.message);
    console.log('\nTroubleshooting Checklist:');
    console.log('  1. Ensure your PostgreSQL service or Docker container is active:');
    console.log('     docker run --name stockiq-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=stockiq -p 5432:5432 -d postgres:16');
    console.log('  2. Confirm your .env credentials match your PostgreSQL instance.');
    console.log('  3. You can also manually import the schema and seed scripts:');
    console.log(`     psql -U postgres -d stockiq -f database/schema.sql`);
    console.log(`     psql -U postgres -d stockiq -f database/seed.sql`);
    process.exit(1);
  } finally {
    if (client) client.release();
    await targetPool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
