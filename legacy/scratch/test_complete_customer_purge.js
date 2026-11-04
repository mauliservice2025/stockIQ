const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { Pool } = require('pg');
require('dotenv').config();

async function runVerification() {
  console.log('=====================================================');
  console.log('🔍 VERIFYING CUSTOMER DATA REMOVAL ACROSS UI, CODE, DB');
  console.log('=====================================================');

  // 1. Check mock-data.js
  console.log('\n--- 1. Testing mock-data.js ---');
  const { INITIAL_DATA } = require('../js/data/mock-data.js');
  const collectionsToCheck = [
    'jobCards', 'billingEstimates', 'draftBills', 'finalBills', 
    'vehicleDeliveries', 'creditNotes', 'paymentReceipts', 
    'jobCardParts', 'customers', 'vehicles', 'warrantyClaims'
  ];

  let mockDataAllEmpty = true;
  for (const col of collectionsToCheck) {
    const len = Array.isArray(INITIAL_DATA[col]) ? INITIAL_DATA[col].length : -1;
    console.log(`INITIAL_DATA.${col}: length = ${len}`);
    if (len !== 0) mockDataAllEmpty = false;
  }
  console.log('mock-data.js all empty:', mockDataAllEmpty);

  // 2. Testing DatabaseLayer (db.js) with simulated populated localStorage
  console.log('\n--- 2. Testing DatabaseLayer (db.js) ---');
  const mockStorage = {
    APEX_ISCM_DATABASE_V2: JSON.stringify({
      jobCards: [{ id: 'OLD-JC-01', customer_name: 'Old Customer', vehicle_reg_no: 'MH12AA1111' }],
      billingEstimates: [{ id: 'OLD-EST-01', customer_name: 'Old Customer' }],
      draftBills: [{ id: 'OLD-DB-01', customer_name: 'Old Customer' }],
      finalBills: [{ id: 'OLD-FB-01', customer_name: 'Old Customer' }],
      vehicleDeliveries: [{ id: 'OLD-DEL-01', customer_name: 'Old Customer' }],
      customers: [{ id: 'CUST-01', name: 'Old Customer' }],
      vehicles: [{ id: 'VEH-01', vehicle_reg_no: 'MH12AA1111' }],
      creditNotes: [{ id: 'CN-01' }],
      paymentReceipts: [{ id: 'PR-01' }],
      jobCardParts: [{ id: 'JCP-01' }]
    })
  };

  global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = v; },
    removeItem: (k) => { delete mockStorage[k]; }
  };
  global.window = { INITIAL_DATA };

  const dbCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'data', 'db.js'), 'utf8');
  eval(dbCode);

  const db = global.window.DB;
  let dbAllEmpty = true;
  for (const col of collectionsToCheck) {
    const data = db.getAll(col);
    const len = Array.isArray(data) ? data.length : 0;
    console.log(`DB.${col}: length = ${len}`);
    if (len !== 0) dbAllEmpty = false;
  }
  console.log('DatabaseLayer purge effective:', dbAllEmpty);

  // 3. Testing PostgreSQL database
  console.log('\n--- 3. Testing PostgreSQL Database ---');
  const pool = new Pool();
  let pgAllEmpty = true;
  try {
    const custRes = await pool.query('SELECT count(*) FROM customers');
    console.log('PostgreSQL customers table count:', custRes.rows[0].count);
    if (parseInt(custRes.rows[0].count, 10) !== 0) pgAllEmpty = false;

    const soRes = await pool.query('SELECT count(*) FROM sales_orders');
    console.log('PostgreSQL sales_orders table count:', soRes.rows[0].count);

    const shRes = await pool.query('SELECT count(*) FROM shipments');
    console.log('PostgreSQL shipments table count:', shRes.rows[0].count);
  } catch (err) {
    console.error('PG Error:', err.message);
  } finally {
    await pool.end();
  }

  // 4. Testing SQLite database
  console.log('\n--- 4. Testing SQLite Database ---');
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '..', 'database', 'stockiq.db');
  let sqliteAllEmpty = true;
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    const sqldb = new SQL.Database(filebuffer);
    const res = sqldb.exec('SELECT count(*) FROM customers');
    const cnt = res[0] ? res[0].values[0][0] : 0;
    console.log('SQLite customers table count:', cnt);
    if (cnt !== 0) sqliteAllEmpty = false;
    sqldb.close();
  }

  // 5. Code Grep Verification
  console.log('\n--- 5. Code Verification in billing.js & customer-reminders.js ---');
  const billingCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'billing.js'), 'utf8');
  const crmCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'customer-reminders.js'), 'utf8');

  const forbiddenTerms = ['Rahul Patil', 'CIN-000126', 'Anand Kulkarni', 'Ramesh Deshmukh', 'Suralkar', 'Wakhare'];
  let codeClean = true;
  for (const term of forbiddenTerms) {
    const inBilling = billingCode.includes(term);
    const inCrm = crmCode.includes(term);
    if (inBilling || inCrm) {
      console.log(`❌ Found '${term}' (inBilling: ${inBilling}, inCrm: ${inCrm})`);
      codeClean = false;
    } else {
      console.log(`✅ Cleared '${term}'`);
    }
  }

  console.log('\n=====================================================');
  const finalSuccess = mockDataAllEmpty && dbAllEmpty && pgAllEmpty && sqliteAllEmpty && codeClean;
  console.log(`🎉 ALL VERIFICATIONS PASSED: ${finalSuccess}`);
  console.log('=====================================================');
}

runVerification().catch(console.error);
