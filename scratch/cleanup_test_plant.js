const { Client } = require('pg');
const c = new Client('postgresql://postgres:postgres@localhost:5432/stockiq');
c.connect().then(() => c.query("DELETE FROM plants WHERE id = 'PLANT-99';")).then(() => {
  console.log('Cleaned PLANT-99');
  c.end();
});
