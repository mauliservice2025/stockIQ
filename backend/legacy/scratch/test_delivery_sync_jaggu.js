const fs = require('fs');

// Mock browser environment
global.window = global;
global.document = {
  _elements: {},
  getElementById(id) {
    if (!this._elements[id]) {
      this._elements[id] = { textContent: '', title: '', style: {} };
    }
    return this._elements[id];
  },
  addEventListener: () => {},
  createElement: () => ({ style: {} }),
  body: { appendChild: () => {}, removeChild: () => {} }
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

// Load DB
require('../js/data/db.js');

window.State = {
  currentUser: { id: 'USR-001', username: 'admin', role: 'ADMIN', facility_id: 'PLANT-01' },
  currentPlantId: 'PLANT-01',
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
  showModal: () => {}
};

window.PaginationHelper = {
  paginate: (items, key) => ({
    items: items.slice(0, 10),
    totalRecords: items.length,
    totalPages: Math.ceil(items.length / 10) || 1,
    currentPage: 1,
    pageSize: 10,
    startIndex: 0
  }),
  render: () => '',
  reset: () => {},
  setPage: () => {},
  setPageSize: () => {}
};

// Load billing module
require('../js/modules/billing.js');

const BM = window.BillingModule;
const todayStr = BM.getTodayDateStr();

console.log('=== TEST: Vehicle Delivery Sync for Fully Settled Bill ===');
console.log('Today:', todayStr);

// Clear existing deliveries
window.DB.data.vehicleDeliveries = [];
window.DB.data.jobCards = [];
window.DB.data.finalBills = [];
window.DB.data.draftBills = [];

// Create Job Card for Jaggu Kolhe
const jc = {
  id: 'JC-0030',
  job_card_no: 'JC/MSC1/2026/0030',
  customer_name: 'Jaggu Kolhe',
  customer_mobile: '9090098898',
  vehicle_reg_no: 'MH12AC4378',
  vehicle_model: 'Activa 6G',
  plant_id: 'PLANT-01',
  facility_id: 'PLANT-01',
  branch_id: 'PLANT-01',
  status: 'BILLED',
  date: todayStr
};
window.DB.upsert('jobCards', jc);

// Create Final Bill Fully Settled
const bill = {
  id: 'INV-0020',
  invoice_no: 'INV/MSC1/2026/0020',
  job_card_id: 'JC-0030',
  job_card_no: 'JC/MSC1/2026/0030',
  customer_name: 'Jaggu Kolhe',
  customer_mobile: '9090098898',
  vehicle_reg_no: 'MH12AC4378',
  net_payable: 549,
  amount_paid: 549,
  balance_due: 0,
  status: 'PAID',
  invoice_date: todayStr,
  plant_id: 'PLANT-01'
};
window.DB.upsert('finalBills', bill);

// Run top tab badge update
BM.updateTopTabBadges();

const delBadgeEl = document.getElementById('billing-badge-delivery');
console.log('Vehicle Delivery Top Badge text:', delBadgeEl.textContent);
if (String(delBadgeEl.textContent) !== '1') {
  throw new Error(`Expected Vehicle Delivery top badge to be 1, got: ${delBadgeEl.textContent}`);
}
console.log('✓ Top tab badge for Vehicle Delivery shows 1');

// Render Vehicle Delivery Tab
BM.deliveryFromDate = undefined;
BM.deliveryToDate = undefined;
BM.deliveryStatusFilter = 'ALL';
const delHtml = BM.renderDeliveryTab();

if (!delHtml.includes('Jaggu Kolhe')) {
  throw new Error('Vehicle Delivery screen HTML missing Jaggu Kolhe!');
}
if (!delHtml.includes('MH12AC4378')) {
  throw new Error('Vehicle Delivery screen HTML missing vehicle registration MH12AC4378!');
}
if (!delHtml.includes('INV/MSC1/2026/0020')) {
  throw new Error('Vehicle Delivery screen HTML missing invoice number INV/MSC1/2026/0020!');
}
if (!delHtml.includes('READY FOR HANDOVER')) {
  throw new Error('Vehicle Delivery screen HTML missing READY FOR HANDOVER status badge!');
}
if (!delHtml.includes('Issue Gate Pass')) {
  throw new Error('Vehicle Delivery screen HTML missing Issue Gate Pass action button!');
}
console.log('✓ Vehicle Delivery screen correctly displays Jaggu Kolhe ready for handover with Issue Gate Pass button!');

console.log('\n🎉 ALL DELIVERY SYNC TESTS PASSED SUCCESSFULLY!');
