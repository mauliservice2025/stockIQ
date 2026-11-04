const { Client } = require('pg');
const fs = require('fs');

(async () => {
  const serverContent = fs.readFileSync('server.js', 'utf8');
  const userMatch = serverContent.match(/user:\s*['"]([^'"]+)['"]/);
  const passMatch = serverContent.match(/password:\s*['"]([^'"]+)['"]/);
  const hostMatch = serverContent.match(/host:\s*['"]([^'"]+)['"]/);
  const portMatch = serverContent.match(/port:\s*(\d+)/);
  const dbMatch = serverContent.match(/database:\s*['"]([^'"]+)['"]/);

  const client = new Client({
    user: userMatch ? userMatch[1] : 'postgres',
    password: passMatch ? passMatch[1] : 'postgres',
    host: hostMatch ? hostMatch[1] : 'localhost',
    port: portMatch ? parseInt(portMatch[1]) : 5432,
    database: dbMatch ? dbMatch[1] : 'iscm_db'
  });

  try {
    await client.connect();
    console.log('Connected to PG successfully!');
    const cols = await client.query("SELECT column_name, data_type, is_nullable, character_maximum_length FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;");
    console.log('Columns in users table:', cols.rows.map(c => `${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));
    const constraints = await client.query("SELECT conname, contype, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'users'::regclass;");
    console.log('Constraints on users table:', constraints.rows);
    await client.end();
  } catch (err) {
    console.error('PG Error:', err.message);
  }
})();
