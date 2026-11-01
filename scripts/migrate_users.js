const pg = require('../database/pg.js');

async function migrate() {
  try {
    console.log('Running user schema migration on PostgreSQL...');
    await pg.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt VARCHAR(64);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_history JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_last_changed TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(150);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(150);
    `);

    // Backfill standard initial password hashes if password_hash is NULL
    // Default system password hash for p.patil: Apex@2026!
    const defaultSalt = 'a1b2c3d4e5f67890';
    const adminHash = 'sha256$a1b2c3d4e5f67890$31d609d6b3258ee2429b14c0e987ddca6558550f014f0824b8a3813fde440ce4';
    
    await pg.query(`
      UPDATE users 
      SET password_salt = COALESCE(password_salt, $1),
          password_hash = COALESCE(password_hash, $2),
          password_history = COALESCE(password_history, jsonb_build_array($2::text))
      WHERE password_hash IS NULL;
    `, [defaultSalt, adminHash]);

    console.log('Migration and initial password hash backfill completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
