const pg = require('../database/pg.js');
(async () => {
  try {
    const res = await pg.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'facilities' ORDER BY ordinal_position;");
    console.log('facilities columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    const facs = await pg.query('SELECT id, code, name FROM facilities;');
    console.log('facilities rows:', facs.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();
