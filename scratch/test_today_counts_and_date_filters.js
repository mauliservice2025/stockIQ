const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.document = {
  getElementById: (id) => {
    if (!global._elements) global._elements = {};
    if (!global._elements[id]) {
      global._elements[id] = { textContent: '', value: '', title: '', style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {} } };
    }
    return global._elements[id];
  },
  querySelector: () => ({ style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {} } }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.State = {
  currentPlantId: 'ALL',
  hasPermission: () => true,
  showToast: () => {}
};

// Load DB
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
eval(dbCode);

// Load Billing module
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

// Load Transfers
const trfCode = fs.readFileSync(path.join(__dirname, '../js/modules/transfers.js'), 'utf8');
eval(trfCode);

// Load Receive Transfers
const rcvCode = fs.readFileSync(path.join(__dirname, '../js/modules/receive-transfers.js'), 'utf8');
eval(rcvCode);

console.log('=== STARTING TESTS: TODAY COUNTS AND DATE FILTER DEFAULTS ===\n');

let failed = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failed++;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

const todayStr = window.BillingModule.getTodayDateStr();
console.log(`Today's Date String: ${todayStr}`);

// Test 1: getDashboardDateFilter defaults to today
assert(window.BillingModule.getDashboardDateFilter() === todayStr, 'Dashboard date filter defaults to todayStr');

// Setup mock records: 1 job card today, 3 job cards past; 2 bills today, 5 bills past; 1 delivery today, 4 deliveries past
window.DB.data = {
  jobCards: [
    { id: 'JC-TODAY-1', date: todayStr, job_card_no: 'JC-001', status: 'READY_FOR_BILLING', plant_id: 'PLANT-01' },
    { id: 'JC-PAST-1', date: '2026-01-01', job_card_no: 'JC-002', status: 'READY_FOR_BILLING', plant_id: 'PLANT-01' },
    { id: 'JC-PAST-2', date: '2026-05-15', job_card_no: 'JC-003', status: 'READY_FOR_BILLING', plant_id: 'PLANT-01' },
  ],
  billingEstimates: [
    { id: 'EST-TODAY-1', date: todayStr, estimate_no: 'EST-001', status: 'SUBMITTED', plant_id: 'PLANT-01' },
    { id: 'EST-PAST-1', date: '2026-02-01', estimate_no: 'EST-002', status: 'SUBMITTED', plant_id: 'PLANT-01' }
  ],
  draftBills: [
    { id: 'DB-PAST-1', date: '2026-03-01', draft_bill_no: 'DB-002', status: 'FINALIZED', plant_id: 'PLANT-01' }
  ],
  finalBills: [
    { id: 'FB-TODAY-1', invoice_date: todayStr, invoice_no: 'INV-001', status: 'PAID', plant_id: 'PLANT-01' },
    { id: 'FB-PAST-1', invoice_date: '2026-04-01', invoice_no: 'INV-002', status: 'PAID', plant_id: 'PLANT-01' }
  ],
  vehicleDeliveries: [
    { id: 'DEL-TODAY-1', bill_id: 'FB-TODAY-1', invoice_no: 'INV-001', delivery_date: todayStr, gate_pass_no: 'GP-001', status: 'READY_FOR_DELIVERY', plant_id: 'PLANT-01' },
    { id: 'DEL-PAST-1', delivery_date: '2026-05-01', gate_pass_no: 'GP-002', status: 'DELIVERED', plant_id: 'PLANT-01' }
  ],
  plants: [{ id: 'PLANT-01', name: 'Plant 1', is_active: true }],
  _workshop_all_customers_purged_v3: true
};

// Test 2: Top Tab Badges strictly count today's records
window.BillingModule.updateTopTabBadges();
const jcBadge = document.getElementById('billing-badge-jobcards').textContent;
const estBadge = document.getElementById('billing-badge-estimates').textContent;
const billBadge = document.getElementById('billing-badge-billing').textContent;
const billListBadge = document.getElementById('billing-badge-billlist').textContent;
const delBadge = document.getElementById('billing-badge-delivery').textContent;

assert(Number(jcBadge) === 1, `Job Card badge is 1 (today's count only), got ${jcBadge}`);
assert(Number(estBadge) === 1, `Estimate badge is 1 (today's count only), got ${estBadge}`);
assert(Number(billListBadge) === 1, `Bill List badge is 1 (today's count only), got ${billListBadge}`);
assert(Number(delBadge) === 1, `Delivery badge is 1 (today's count only), got ${delBadge}`);

// Test 3: Dashboard HTML render contains todayStr in date input and Today preset active
const container = { innerHTML: '' };
window.BillingModule.activeTab = 'DASHBOARD';
window.BillingModule.render(container);
assert(container.innerHTML.includes(`value="${todayStr}"`), 'Dashboard date filter input value contains todayStr');
assert(container.innerHTML.includes('Today\'s count'), 'Badge titles contain Today\'s count');

// Test 4: Switching dashboard filter to 'ALL' keeps top badges counting today only
window.BillingModule.setDashboardDateFilter('ALL');
window.BillingModule.updateTopTabBadges();
const jcBadgeAfterAll = document.getElementById('billing-badge-jobcards').textContent;
assert(Number(jcBadgeAfterAll) === 1, `After setting dashboard to ALL, Job Card badge remains 1 (today only), got ${jcBadgeAfterAll}`);

// Test 5: Job Cards tab defaults to today
window.BillingModule.activeTab = 'JOB_CARDS';
window.BillingModule.jobCardFromDate = undefined;
window.BillingModule.jobCardToDate = undefined;
const jcHtml = window.BillingModule.renderJobCardsTab();
assert(jcHtml.includes(`id="jobcard-from-date"`) && jcHtml.includes(`value="${todayStr}"`), 'Job Card From Date defaults to today');
assert(jcHtml.includes(`id="jobcard-to-date"`) && jcHtml.includes(`value="${todayStr}"`), 'Job Card To Date defaults to today');

// Test 6: Bill List tab defaults to today
window.BillingModule.activeTab = 'FINAL_BILLS';
window.BillingModule.finalBillFromDate = undefined;
window.BillingModule.finalBillToDate = undefined;
const fbHtml = window.BillingModule.renderFinalBillsTab();
assert(fbHtml.includes(`id="finalbill-from-date"`) && fbHtml.includes(`value="${todayStr}"`), 'Bill List From Date defaults to today');
assert(fbHtml.includes(`id="finalbill-to-date"`) && fbHtml.includes(`value="${todayStr}"`), 'Bill List To Date defaults to today');

// Test 7: Vehicle Delivery tab defaults to today
window.BillingModule.activeTab = 'DELIVERY';
window.BillingModule.deliveryFromDate = undefined;
window.BillingModule.deliveryToDate = undefined;
const delHtml = window.BillingModule.renderDeliveryTab();
assert(delHtml.includes(`id="delivery-from-date"`) && delHtml.includes(`value="${todayStr}"`), 'Vehicle Delivery From Date defaults to today');
assert(delHtml.includes(`id="delivery-to-date"`) && delHtml.includes(`value="${todayStr}"`), 'Vehicle Delivery To Date defaults to today');

// Test 8: Transfers screen defaults to today
window.TransfersModule.fromDate = '';
window.TransfersModule.toDate = '';
const trfContainer = { innerHTML: '' };
window.TransfersModule.render(trfContainer);
assert(trfContainer.innerHTML.includes(`id="trf-from-date"`) && trfContainer.innerHTML.includes(`value="${todayStr}"`), 'Transfers From Date defaults to today');
assert(trfContainer.innerHTML.includes(`id="trf-to-date"`) && trfContainer.innerHTML.includes(`value="${todayStr}"`), 'Transfers To Date defaults to today');

// Test 9: Receive Transfers screen defaults to today
window.ReceiveTransfersModule._fromDate = '';
window.ReceiveTransfersModule._toDate = '';
const rcvContainer = { innerHTML: '' };
window.ReceiveTransfersModule.render(rcvContainer);
assert(rcvContainer.innerHTML.includes(`id="rcv-from-date"`) && rcvContainer.innerHTML.includes(`value="${todayStr}"`), 'Receive Transfers From Date defaults to today');
assert(rcvContainer.innerHTML.includes(`id="rcv-to-date"`) && rcvContainer.innerHTML.includes(`value="${todayStr}"`), 'Receive Transfers To Date defaults to today');

console.log(`\n================================`);
if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error(`💥 ${failed} TEST(S) FAILED!`);
  process.exit(1);
}
