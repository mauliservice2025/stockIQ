const fs = require('fs');
const initSqlJs = require('sql.js');

initSqlJs().then(SQL => {
  const filebuffer = fs.readFileSync('database/stockiq.db');
  const db = new SQL.Database(filebuffer);
  const res = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
  const tables = res[0] ? res[0].values.map(v => v[0]) : [];
  tables.forEach(t => {
    try {
      const c = db.exec('SELECT count(*) FROM ' + t);
      const count = c[0].values[0][0];
      if (t.toLowerCase().includes('cust') || t.toLowerCase().includes('job') || t.toLowerCase().includes('bill')) {
        console.log(t, count);
      }
    } catch(e) {}
  });
});

