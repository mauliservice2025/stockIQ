/* ==========================================================================
   STOCKIQ - INSTANT SQLITE DATABASE GENERATOR
   Creates a self-contained database/stockiq.db file viewable immediately in
   DBeaver without needing PostgreSQL server or Docker installed!
   Usage: node database/export-sqlite.js
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function createSqliteDb() {
  console.log('📦 Initializing SQLite generator (sql.js)...');
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const seedPath = path.join(__dirname, 'seed.sql');
  const outputPath = path.join(__dirname, 'stockiq.db');

  // 1. Prepare Schema SQL for SQLite
  console.log('📜 Loading and adapting schema.sql for SQLite...');
  let schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Strip PostgreSQL-specific statements
  schemaSql = schemaSql
    .replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/gi, '')
    .replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/gi, '')
    .replace(/CREATE OR REPLACE VIEW plants AS SELECT [^;]+;/gi, 'CREATE TABLE IF NOT EXISTS plants (id VARCHAR(36) PRIMARY KEY, company_id VARCHAR(36), code VARCHAR(30), name VARCHAR(100), plant_type VARCHAR(50), address TEXT, city VARCHAR(100), state VARCHAR(100), country VARCHAR(100), is_active BOOLEAN);')
    .replace(/CREATE OR REPLACE VIEW/gi, 'CREATE VIEW IF NOT EXISTS')
    .replace(/TIMESTAMP WITH TIME ZONE/gi, 'DATETIME')
    .replace(/TIMESTAMP/gi, 'DATETIME')
    .replace(/ALTER TABLE \w+ ADD COLUMN IF NOT EXISTS [^;]+;/gi, '');

  db.run(schemaSql);
  console.log('✅ Schema tables created!');

  // 2. Prepare Seed SQL for SQLite
  console.log('🌱 Loading and running seed.sql...');
  let seedSql = fs.readFileSync(seedPath, 'utf-8');
  db.run(seedSql);
  console.log('✅ All data seeded!');

  // 3. Export binary SQLite file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(outputPath, buffer);

  console.log('====================================================');
  console.log(`🎉 SUCCESS: SQLite database created at:`);
  console.log(`   ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  console.log('====================================================');
  console.log('\nTo view in DBeaver right now:');
  console.log('  1. In DBeaver, click "New Database Connection"');
  console.log('  2. Select "SQLite"');
  console.log(`  3. Set Path: ${outputPath}`);
  console.log('  4. Click "Finish" — all 38 tables and records are immediately browsable!');
}

createSqliteDb().catch(err => {
  console.error('❌ Error creating SQLite database:', err);
});
