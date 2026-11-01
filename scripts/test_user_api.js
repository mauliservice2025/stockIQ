(async () => {
  try {
    const testUpdate = {
      username: 'PUN2026TEST',
      password_hash: 'sha256$test$abcdef123456',
      password_salt: 'test',
      status: 'ACTIVE'
    };

    const res = await fetch('http://localhost:3000/api/users/USR-002', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUpdate)
    });

    const data = await res.json();
    console.log('PUT /api/users/USR-002 Response:', data.id, data.username, data.password_hash);

    // Verify directly from PostgreSQL
    const pg = require('../database/pg.js');
    const pgRes = await pg.query('SELECT id, username, password_hash, status FROM users WHERE id = $1', ['USR-002']);
    console.log('Direct Postgres verification:', pgRes.rows[0]);

    // Restore USR-002 back to test baseline
    const restoreHash = 'sha256$a1b2c3d4e5f67890$418f71b5fb505f102e76c66b69732e8621ec418c5a0275660013bbb30838052e';
    await fetch('http://localhost:3000/api/users/USR-002', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'PUN2026002',
        password_hash: restoreHash,
        password_salt: 'a1b2c3d4e5f67890'
      })
    });
    console.log('Restored USR-002 baseline.');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    process.exit(0);
  }
})();
