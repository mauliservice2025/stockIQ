const fs = require('fs');
const path = require('path');

try {
  const sqlite3 = require('sqlite3');
  const db = new sqlite3.Database(path.join(__dirname, '..', 'database', 'stockiq.db'));
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      console.log('sqlite err:', err.message);
    } else {
      console.log('sqlite tables:', rows.map(r => r.name));
    }
    db.close();
  });
} catch (e) {
  console.log('sqlite3 not installed or error:', e.message);
}
