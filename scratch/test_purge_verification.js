const fs = require('fs');
const path = require('path');

async function testFullPurge() {
  console.log('--- 1. Testing mock-data.js ---');
  const { INITIAL_DATA } = require('../js/data/mock-data.js');
  console.log('mock-data items:', INITIAL_DATA.items ? INITIAL_DATA.items.length : 0);
  console.log('mock-data vehicleModels:', INITIAL_DATA.vehicleModels ? INITIAL_DATA.vehicleModels.length : 0);
  console.log('mock-data itemVehicleCompatibility:', INITIAL_DATA.itemVehicleCompatibility ? INITIAL_DATA.itemVehicleCompatibility.length : 0);

  console.log('\n--- 2. Testing DatabaseLayer (db.js) ---');
  // Mock localStorage
  const storage = {
    APEX_ISCM_DATABASE_V2: JSON.stringify({
      items: [{ id: 'OLD-ITEM-01', code: 'OLD' }],
      vehicleModels: [{ id: 'OLD-MOD-01', name: 'OLD' }],
      itemVehicleCompatibility: [{ id: 'OLD-IVC-01' }],
      inventoryBalances: [{ id: 'OLD-BAL-01' }]
    })
  };
  global.localStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = v; },
    removeItem: (k) => { delete storage[k]; }
  };
  global.window = { INITIAL_DATA };

  const dbCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'data', 'db.js'), 'utf8');
  eval(dbCode);

  const db = global.window.DB;
  const dbItems = db.getAll('items');
  const dbModels = db.getAll('vehicleModels');
  const dbCompat = db.getAll('itemVehicleCompatibility');
  const dbBalances = db.getAll('inventoryBalances');

  console.log('DB items count after migration:', dbItems.length);
  console.log('DB vehicleModels count after migration:', dbModels.length);
  console.log('DB itemVehicleCompatibility count after migration:', dbCompat.length);
  console.log('DB inventoryBalances count after migration:', dbBalances.length);

  console.log('\n--- 3. Testing SQLite stockiq.db ---');
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const sqliteBuffer = fs.readFileSync(path.join(__dirname, '..', 'database', 'stockiq.db'));
  const sqldb = new SQL.Database(sqliteBuffer);
  const sqliteItems = sqldb.exec('SELECT count(*) as cnt FROM items')[0].values[0][0];
  console.log('SQLite stockiq.db items count:', sqliteItems);
  sqldb.close();

  console.log('\n--- 4. Testing PostgreSQL ---');
  const { Client } = require('pg');
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/stockiq' });
  try {
    await client.connect();
    const pgRes = await client.query('SELECT count(*) FROM items');
    console.log('PostgreSQL items count:', pgRes.rows[0].count);
    await client.end();
  } catch (err) {
    console.log('PG Error/Offline:', err.message);
  }

  console.log('\n--- VERIFICATION RESULT ---');
  const allClear = (
    (INITIAL_DATA.items.length === 0) &&
    (INITIAL_DATA.vehicleModels.length === 0) &&
    (INITIAL_DATA.itemVehicleCompatibility.length === 0) &&
    (dbItems.length === 0) &&
    (dbModels.length === 0) &&
    (dbCompat.length === 0) &&
    (sqliteItems === 0)
  );
  console.log('ALL TARGET DATA COMPLETELY PURGED:', allClear);
}

testFullPurge().catch(console.error);
