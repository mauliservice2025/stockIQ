const fs = require('fs');
const assert = require('assert');

console.log('Testing Dashboard Date & Facility Filter and Today Count Badge Features...');

const billingJs = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');
const indexHtml = fs.readFileSync('d:/Projects/ISCM/index.html', 'utf8');

// 1. Verify billing.js properties & methods
assert(billingJs.includes('dashboardDateFilter: undefined'), 'Must have dashboardDateFilter state property');
assert(billingJs.includes('dashboardFacilityFilter: \'ALL\''), 'Must have dashboardFacilityFilter state property');
assert(billingJs.includes('getDashboardDateFilter()'), 'Must have getDashboardDateFilter method');
assert(billingJs.includes('getDashboardFacilityFilter()'), 'Must have getDashboardFacilityFilter method');
assert(billingJs.includes('setDashboardDateFilter(val)'), 'Must have setDashboardDateFilter method');
assert(billingJs.includes('setDashboardFacilityFilter(val)'), 'Must have setDashboardFacilityFilter method');
assert(billingJs.includes('normalizeDateStr(val)'), 'Must have normalizeDateStr method');
assert(billingJs.includes('filterRecordsByDateAndFacility(records, dateFilter, facilityFilter)'), 'Must have filterRecordsByDateAndFacility method');
assert(billingJs.includes('updateTopTabBadges()'), 'Must have updateTopTabBadges method');

console.log('✓ State properties and filter helper methods verified');

// 2. Verify HTML IDs for tab badges
assert(billingJs.includes('id="billing-badge-jobcards"'), 'Job Cards tab badge must have id="billing-badge-jobcards"');
assert(billingJs.includes('id="billing-badge-estimates"'), 'Estimates tab badge must have id="billing-badge-estimates"');
assert(billingJs.includes('id="billing-badge-billing"'), 'Billing tab badge must have id="billing-badge-billing"');
assert(billingJs.includes('id="billing-badge-billlist"'), 'Bill List tab badge must have id="billing-badge-billlist"');
assert(billingJs.includes('id="billing-badge-delivery"'), 'Delivery tab badge must have id="billing-badge-delivery"');

console.log('✓ Tab badge IDs verified for reactive count synchronization');

// 3. Verify Dashboard header controls
assert(billingJs.includes('id="dashboard-date-filter"'), 'Dashboard must have date filter input with id="dashboard-date-filter"');
assert(billingJs.includes('id="dashboard-facility-filter"'), 'Dashboard must have facility dropdown with id="dashboard-facility-filter"');
assert(billingJs.includes('window.BillingModule.setDashboardDateFilter(window.BillingModule.getTodayDateStr())'), 'Dashboard must have quick Today preset button');
assert(billingJs.includes('window.BillingModule.setDashboardDateFilter(\'\')'), 'Dashboard must have All Dates preset button');

console.log('✓ Dashboard date filter and facility dropdown controls verified');

// 4. Test logic functionally in sandbox
const vm = require('vm');
const sandbox = {
  window: {},
  document: {
    getElementById: (id) => ({ id, textContent: '' })
  },
  console: console
};
sandbox.window = sandbox;
sandbox.global = sandbox;

// Mock window.DB
sandbox.DB = {
  data: {
    jobCards: [
      { id: '1', job_card_no: 'JC001', date: '2026-10-25', plant_id: 'PLANT-01' },
      { id: '2', job_card_no: 'JC002', date: '2026-10-25', plant_id: 'PLANT-02' },
      { id: '3', job_card_no: 'JC003', date: '2026-10-24', plant_id: 'PLANT-01' }
    ],
    billingEstimates: [
      { id: 'E1', estimate_no: 'EST001', date: '2026-10-25', plant_id: 'PLANT-01' },
      { id: 'E2', estimate_no: 'EST002', date: '2026-10-23', plant_id: 'PLANT-01' }
    ],
    draftBills: [
      { id: 'D1', bill_no: 'DB001', date: '2026-10-25', plant_id: 'PLANT-01' }
    ],
    finalBills: [
      { id: 'B1', invoice_no: 'INV001', date: '2026-10-25', plant_id: 'PLANT-01', net_payable: 1500, amount_paid: 1500, status: 'PAID' },
      { id: 'B2', invoice_no: 'INV002', date: '2026-10-20', plant_id: 'PLANT-01', net_payable: 2000, amount_paid: 1000, status: 'PARTIALLY_PAID' }
    ],
    vehicleDeliveries: [
      { id: 'DEL1', delivery_id: 'DEL001', date: '2026-10-25', plant_id: 'PLANT-01' }
    ],
    plants: [
      { id: 'PLANT-01', name: 'Mauli Service Center 1', code: 'MSC1' },
      { id: 'PLANT-02', name: 'Mauli Service Center 2', code: 'MSC2' }
    ]
  },
  getAll(col) {
    return this.data[col] || [];
  },
  getActivePlants() {
    return this.data.plants || [];
  },
  isPlantActive() {
    return true;
  }
};
sandbox.window.DB = sandbox.DB;

// Execute in sandbox
try {
  vm.runInNewContext(billingJs, sandbox);
  const BM = sandbox.window.BillingModule;

  // Test getTodayDateStr
  const todayStr = BM.getTodayDateStr();
  console.log('Today date string calculated:', todayStr);

  // Test default date filter
  assert.strictEqual(BM.getDashboardDateFilter(), todayStr, 'Default dashboard date filter must be today');
  assert.strictEqual(BM.getDashboardFacilityFilter(), 'ALL', 'Default dashboard facility filter must be ALL');

  // Test filtering by today
  const todayJCs = BM.filterRecordsByDateAndFacility(sandbox.DB.data.jobCards, todayStr, 'ALL');
  assert.strictEqual(todayJCs.length, 2, 'Should filter 2 job cards for today');

  const todayEsts = BM.filterRecordsByDateAndFacility(sandbox.DB.data.billingEstimates, todayStr, 'ALL');
  assert.strictEqual(todayEsts.length, 1, 'Should filter 1 estimate for today');

  const todayFinalBills = BM.filterRecordsByDateAndFacility(sandbox.DB.data.finalBills, todayStr, 'ALL');
  assert.strictEqual(todayFinalBills.length, 1, 'Should filter 1 final bill for today');

  // Test facility filtering
  const plant1JCs = BM.filterRecordsByDateAndFacility(sandbox.DB.data.jobCards, todayStr, 'PLANT-01');
  assert.strictEqual(plant1JCs.length, 1, 'Should filter 1 job card for today at PLANT-01');

  // Test All dates
  const allJCs = BM.filterRecordsByDateAndFacility(sandbox.DB.data.jobCards, '', 'ALL');
  assert.strictEqual(allJCs.length, 3, 'Should show all 3 job cards when date filter is cleared');

  console.log('✓ Functional filtering assertions passed with mock data');
} catch (e) {
  console.error('Error during VM test execution:', e);
  throw e;
}

// 5. Check index.html cache busters
assert(indexHtml.includes('billing.js?v=1.7'), 'billing.js cache buster bumped to 1.7');
console.log('✓ index.html cache buster verified (v=1.7)');

console.log('\n🎉 ALL DASHBOARD DATE & FACILITY FILTER TESTS PASSED!\n');
