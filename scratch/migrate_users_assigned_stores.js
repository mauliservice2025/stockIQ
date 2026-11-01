const pg = require('../database/pg');

async function main() {
  try {
    await pg.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_stores JSONB");
    console.log('Successfully ensured assigned_stores column on users table');
  } catch (e) {
    console.error('Migration error:', e.message);
  } finally {
    await pg.pool.end();
  }
}

main();
