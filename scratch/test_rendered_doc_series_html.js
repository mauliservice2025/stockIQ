const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock localStorage
const localStorageStore = {};
const localStorageMock = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

// Mock DOM
global.window = {
  localStorage: localStorageMock
};
global.localStorage = localStorageMock;

// Load db.js
require('../js/data/mock-data.js');
global.INITIAL_DATA = global.window.INITIAL_DATA;
require('../js/data/db.js');
require('../js/modules/doc-series-master.js');

const db = global.window.DB;
const docSeriesMod = global.window.DocSeriesMasterModule;

console.log('--- Verifying Data Layer & Migration ---');
const allSeries = docSeriesMod.getAllSeries();
console.log(`Total series count: ${allSeries.length}`);

// Verify Row 1 is DNS-018
assert.strictEqual(allSeries[0].id, 'DNS-018', 'First item in series array must be DNS-018');
assert.strictEqual(allSeries[0].branch_name, 'Mauli Service Center 1', 'DNS-018 branch must be Mauli Service Center 1');
assert.strictEqual(allSeries[0].branch_code, 'MSC1', 'DNS-018 branch code must be MSC1');

// Verify Row 2-8 sequence matches screenshot
const expectedOrder = ['DNS-018', 'DNS-001', 'DNS-004', 'DNS-005', 'DNS-006', 'DNS-007', 'DNS-008', 'DNS-009'];
for (let i = 0; i < expectedOrder.length; i++) {
  assert.strictEqual(allSeries[i].id, expectedOrder[i], `Row ${i + 1} must be ${expectedOrder[i]} (got ${allSeries[i].id})`);
}
console.log('✓ Row order exactly matches user screenshot: ' + expectedOrder.join(', '));

// Verify no old facilities exist
const oldNames = ['Pune Main Workshop', 'Mumbai Central Workshop', 'Nashik Auto Hub', 'BR-001', 'BR-002', 'BR-003', 'PUN', 'MUM', 'NAS'];
allSeries.forEach(s => {
  oldNames.forEach(old => {
    assert.notStrictEqual(s.branch_name, old, `Series ${s.id} branch_name must not be ${old}`);
    assert.notStrictEqual(s.branch_code, old, `Series ${s.id} branch_code must not be ${old}`);
    assert.notStrictEqual(s.branch_id, old, `Series ${s.id} branch_id must not be ${old}`);
  });
  // Must only be Mauli Service Center 1 or Mauli Service Center 2
  assert(['Mauli Service Center 1', 'Mauli Service Center 2'].includes(s.branch_name),
    `Series ${s.id} branch_name "${s.branch_name}" must be Mauli 1 or 2`);
  assert(['MSC1', 'MSC2'].includes(s.branch_code),
    `Series ${s.id} branch_code "${s.branch_code}" must be MSC1 or MSC2`);
  assert(['PLANT-01', 'PLANT-02'].includes(s.branch_id),
    `Series ${s.id} branch_id "${s.branch_id}" must be PLANT-01 or PLANT-02`);
});
console.log('✓ Zero mentions of deleted/legacy facilities across all series records.');

// Verify HTML rendering of table rows
const tableHtml = docSeriesMod.renderTableContent();
assert(!tableHtml.includes('Pune Main Workshop'), 'Rendered table HTML must not contain "Pune Main Workshop"');
assert(!tableHtml.includes('Mumbai Central Workshop'), 'Rendered table HTML must not contain "Mumbai Central Workshop"');
assert(!tableHtml.includes('Nashik Auto Hub'), 'Rendered table HTML must not contain "Nashik Auto Hub"');
assert(tableHtml.includes('Mauli Service Center 1'), 'Rendered table HTML must contain "Mauli Service Center 1"');
assert(tableHtml.includes('Mauli Service Center 2'), 'Rendered table HTML must contain "Mauli Service Center 2"');
assert(tableHtml.includes('PO/MSC1/26-27/0001'), 'Rendered table HTML must contain PO/MSC1/26-27/0001 for DNS-018');
assert(tableHtml.includes('WO/MSC1/2026/000001'), 'Rendered table HTML must contain WO/MSC1/2026/000001 for DNS-001');

console.log('✓ Rendered HTML table rows match required data and active facilities.');

// Verify getBranches() returns active facilities
const branches = docSeriesMod.getBranches();
console.log('Available branches in dropdown:', branches.map(b => `${b.code}: ${b.name}`));
assert(branches.some(b => b.code === 'MSC1' && b.name === 'Mauli Service Center 1'), 'Must include MSC1');
assert(branches.some(b => b.code === 'MSC2' && b.name === 'Mauli Service Center 2'), 'Must include MSC2');
console.log('✓ Facility dropdown options correctly return Mauli Service Center 1 (MSC1) and Mauli Service Center 2 (MSC2).');

console.log('\n================================================================');
console.log('🎉 HTML RENDERING & DATA VERIFICATION COMPLETE (100% PASS)');
console.log('================================================================\n');
