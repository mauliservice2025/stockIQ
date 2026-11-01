const pg = require('../database/pg');
(async () => {
  try {
    const res = await pg.query("INSERT INTO users (id, username, email, full_name, primary_role_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;", [
      'USR-TEST-ROLEUSER', 'TESTROLEUSER', 'testroleuser@example.com', 'Test Role User', 'ROLE-USER', 'ACTIVE'
    ]);
    console.log('Inserted successfully:', res.rows[0]);
    await pg.query("DELETE FROM users WHERE id = 'USR-TEST-ROLEUSER';");
  } catch (err) {
    console.error('Insert error with ROLE-USER:', err.message);
  }
})();
