const pg = require('../database/pg');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    await pg.query("DELETE FROM users WHERE id IN ('USR-TEST-99', 'USR-TEST-EXACT', 'USR-TEST-ROLEUSER');");
    console.log('Cleaned up test users from PostgreSQL');
  } catch (e) {
    console.warn('PG cleanup warning:', e.message);
  }

  // Also clean from mock-data.js
  const mockPath = path.join(__dirname, '../js/data/mock-data.js');
  let content = fs.readFileSync(mockPath, 'utf8');
  ['USR-TEST-99', 'USR-TEST-EXACT', 'USR-TEST-ROLEUSER'].forEach(id => {
    const idRegex = new RegExp(`\\s*\\{[\\s\\S]*?"id":\\s*"${id}"[\\s\\S]*?\\},?`, 'g');
    content = content.replace(idRegex, '');
  });
  fs.writeFileSync(mockPath, content, 'utf8');
  console.log('Cleaned up test users from mock-data.js');
})();
