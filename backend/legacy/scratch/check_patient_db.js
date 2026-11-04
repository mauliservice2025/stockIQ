const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stockiq_db'
});

async function main() {
  try {
    await client.connect();
    const deptRes = await client.query("SELECT * FROM departments WHERE name ILIKE '%patient%'");
    console.log('Departments with patient:', deptRes.rows);
    if (deptRes.rows.length > 0) {
      await client.query("UPDATE departments SET name = 'Customer Care & Relations', code = 'CUST-CARE' WHERE name ILIKE '%patient%'");
      console.log('Updated departments in PG.');
    }
    const userRes = await client.query("SELECT * FROM users WHERE department ILIKE '%patient%' OR designation ILIKE '%patient%'");
    console.log('Users with patient:', userRes.rows);
    if (userRes.rows.length > 0) {
      await client.query("UPDATE users SET department = 'Customer Care & Relations', designation = 'Customer Service Lead' WHERE department ILIKE '%patient%' OR designation ILIKE '%patient%'");
      console.log('Updated users in PG.');
    }
    await client.end();
  } catch (err) {
    console.log('PG error/skip:', err.message);
  }
}

main();

