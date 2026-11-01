const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Setup mock browser environment
const localStorageData = {};
const mockLocalStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

const window = {
  location: { hash: '' }
};

const sandbox = {
  window,
  localStorage: mockLocalStorage,
  document: {
    getElementById: () => null,
    querySelector: () => null,
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {} }
  },
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Date
};
sandbox.window.localStorage = mockLocalStorage;
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);

// 1. Load mock data
const mockDataCode = fs.readFileSync('js/data/mock-data.js', 'utf8');
vm.runInContext(mockDataCode, sandbox);

// 2. Load DB module
const dbCode = fs.readFileSync('js/data/db.js', 'utf8');
vm.runInContext(dbCode, sandbox);

// 3. Load Doc Series Master Module
const docSeriesCode = fs.readFileSync('js/modules/doc-series-master.js', 'utf8');
vm.runInContext(docSeriesCode, sandbox);

// 4. Load Billing Module
const billingCode = fs.readFileSync('js/modules/billing.js', 'utf8');
vm.runInContext(billingCode, sandbox);

console.log('=== TEST 1: DocSeriesMasterModule.DOC_TYPES ===');
const docTypes = sandbox.window.DocSeriesMasterModule.DOC_TYPES;
const expectedCodes = ['JC', 'EST', 'DB', 'INV', 'GP'];
expectedCodes.forEach(code => {
  const dt = docTypes.find(d => d.code === code);
  assert(dt, `Missing doc type: ${code}`);
  console.log(`✓ Doc type ${code}: ${dt.name} (${dt.module}) - Prefix: ${dt.defaultPrefix}`);
});

console.log('\n=== TEST 2: Active Series Existence across Facilities ===');
const allSeries = sandbox.window.DocSeriesMasterModule.getAllSeries();
['PLANT-01', 'PLANT-02', 'ALL'].forEach(facilityId => {
  expectedCodes.forEach(code => {
    const series = allSeries.find(s => s.doc_type_code === code && s.branch_id === facilityId);
    assert(series, `Missing series for ${code} in facility ${facilityId}`);
    assert.strictEqual(series.status, 'Active', `Series ${series.id} must be Active`);
    console.log(`✓ Found series for ${code} [${facilityId}]: ${series.id} (${series.prefix}/${series.branch_code}/YYYY/######)`);
  });
});

console.log('\n=== TEST 3: Real-Time Sequence Preview (Non-mutating) ===');
expectedCodes.forEach(code => {
  const seriesBefore = allSeries.find(s => s.doc_type_code === code && s.branch_id === 'PLANT-01');
  const countBefore = seriesBefore.current_number;
  const preview = sandbox.window.DocSeriesMasterModule.previewNextNumber(code, 'PLANT-01');
  assert(preview.startsWith(`${code}/MSC1/`), `Preview ${preview} does not start with ${code}/MSC1/`);
  assert.strictEqual(seriesBefore.current_number, countBefore, `Preview must not mutate sequence count`);
  console.log(`✓ Preview for ${code} [PLANT-01]: ${preview} (Counter unchanged: ${countBefore})`);
});

console.log('\n=== TEST 4: Atomic Number Generation & Sequence Increment ===');
expectedCodes.forEach(code => {
  const seriesBefore = allSeries.find(s => s.doc_type_code === code && s.branch_id === 'PLANT-01');
  const countBefore = seriesBefore.current_number;
  const genRes = sandbox.window.DocSeriesMasterModule.generateNextNumber(code, 'PLANT-01');
  assert(genRes.success, `Generation failed for ${code}: ${genRes.error}`);
  assert.strictEqual(genRes.sequence, countBefore + 1, `Sequence must increment by 1`);
  console.log(`✓ Generated ${code}: ${genRes.docNumber} (Seq #${genRes.sequence})`);
});

console.log('\n=== TEST 5: BillingModule Helper Methods ===');
const jcNo = sandbox.window.BillingModule.generateJobCardNumber('PLANT-01');
console.log(`✓ BillingModule.generateJobCardNumber: ${jcNo}`);
assert(jcNo.startsWith('JC/MSC1/'), `Job Card number must start with JC/MSC1/`);

const estNo = sandbox.window.BillingModule.generateEstimateNumber('PLANT-01');
console.log(`✓ BillingModule.generateEstimateNumber: ${estNo}`);
assert(estNo.startsWith('EST/MSC1/'), `Estimate number must start with EST/MSC1/`);

const dbNo = sandbox.window.BillingModule.generateDraftBillNumber('PLANT-01');
console.log(`✓ BillingModule.generateDraftBillNumber: ${dbNo}`);
assert(dbNo.startsWith('DB/MSC1/'), `Draft bill number must start with DB/MSC1/`);

const invNo = sandbox.window.BillingModule.generateBillNumber('PLANT-01');
console.log(`✓ BillingModule.generateBillNumber: ${invNo}`);
assert(invNo.startsWith('INV/MSC1/'), `Bill number must start with INV/MSC1/`);

const gpNo = sandbox.window.BillingModule.generateGatePassNumber('PLANT-01');
console.log(`✓ BillingModule.generateGatePassNumber: ${gpNo}`);
assert(gpNo.startsWith('GP/MSC1/'), `Gate pass number must start with GP/MSC1/`);

console.log('\n>>> ALL 5 TESTS PASSED SUCCESSFULLY! <<<');
