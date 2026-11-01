const pg = require('../database/pg.js');
(async () => {
  try {
    const res = await pg.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;");
    console.log('PostgreSQL users columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    const userRows = await pg.query("SELECT id, username, email, full_name, password_hash FROM users LIMIT 5;");
    console.log('Sample users in DB:', JSON.stringify(userRows.rows, null, 2));
  } catch (e) {
    console.error('Error querying postgres:', e);
  } finally {
    process.exit(0);
  }
})();
