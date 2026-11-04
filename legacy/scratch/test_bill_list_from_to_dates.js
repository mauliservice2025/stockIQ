const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.document = {
  getElementById: (id) => null,
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

// Mock state and UI helpers
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
console.log('Today local date:', todayStr);

// Setup database with multi-date final bills
// 1 bill from today (2026-10-26) fully settled
// 13 bills from earlier dates (e.g. 2026-10-20 to 2026-10-25)
const testBills = [
  {
    id: 'INV-TODAY-01',
    invoice_no: 'INV/MSC1/2026/0020',
    invoice_date: todayStr,
    plant_id: 'PLANT-01',
    customer_name: 'Jaggu Kolhe',
    net_payable: 549,
    amount_paid: 549,
    balance_due: 0,
    status: 'PAID',
    payment_mode: 'Cash'
  },
  {
    id: 'INV-PAST-01',
    invoice_no: 'INV/MSC1/2026/0001',
    invoice_date: '2026-10-20',
    plant_id: 'PLANT-01',
    customer_name: 'Past Customer 1',
    net_payable: 1000,
    amount_paid: 1000,
    balance_due: 0,
    status: 'PAID',
    payment_mode: 'UPI'
  },
  {
    id: 'INV-PAST-02',
    invoice_no: 'INV/MSC1/2026/0002',
    invoice_date: '2026-10-21',
    plant_id: 'PLANT-01',
    customer_name: 'Past Customer 2',
    net_payable: 2000,
    amount_paid: 1000,
    balance_due: 1000,
    status: 'PARTIALLY_PAID',
    payment_mode: 'Cash'
  },
  {
    id: 'INV-PAST-03',
    invoice_no: 'INV/MSC1/2026/0003',
    invoice_date: '2026-10-22',
    plant_id: 'PLANT-01',
    customer_name: 'Past Customer 3',
    net_payable: 1500,
    amount_paid: 0,
    balance_due: 1500,
    status: 'FINALIZED',
    payment_mode: 'UNPAID'
  }
];

window.DB.data.finalBills = [...testBills];
window.DB.saveData();

console.log('\n--- TEST 1: Default Bill List State & Filter ---');
BM.finalBillFromDate = undefined;
BM.finalBillToDate = undefined;
BM.finalBillStatusFilter = 'ALL';
BM.refresh = () => {};

const defaultFrom = BM.getFinalBillFromDate();
const defaultTo = BM.getFinalBillToDate();
console.log('Default From Date:', defaultFrom);
console.log('Default To Date:', defaultTo);
if (defaultFrom !== todayStr || defaultTo !== todayStr) {
  throw new Error(`Expected default dates to be ${todayStr}, got From: ${defaultFrom}, To: ${defaultTo}`);
}

const html = BM.renderFinalBillsTab();

// Verify From Date & To Date inputs exist in rendered HTML
if (!html.includes('id="finalbill-from-date"')) {
  throw new Error('Rendered HTML missing id="finalbill-from-date"');
}
if (!html.includes('id="finalbill-to-date"')) {
  throw new Error('Rendered HTML missing id="finalbill-to-date"');
}
console.log('✓ From Date and To Date input elements rendered correctly');

// Verify Category Pills show today's counts only (1 total, 1 fully settled, 0 partial, 0 pending)
// Pill 1: All: 1
const allPillMatch = html.match(/<span>All<\/span>\s*<span class="badge badge-subtle"[^>]*>(\d+)<\/span>/);
console.log('All Pill Count:', allPillMatch ? allPillMatch[1] : 'NOT FOUND');
if (!allPillMatch || allPillMatch[1] !== '1') {
  throw new Error(`Expected All Pill Count to be 1 for today, got ${allPillMatch ? allPillMatch[1] : 'null'}`);
}

// Pill 2: Fully Settled: 1
const fullyPillMatch = html.match(/<span>✓ Fully Settled<\/span>\s*<span class="badge badge-subtle"[^>]*>(\d+)<\/span>/);
console.log('Fully Settled Pill Count:', fullyPillMatch ? fullyPillMatch[1] : 'NOT FOUND');
if (!fullyPillMatch || fullyPillMatch[1] !== '1') {
  throw new Error(`Expected Fully Settled Pill Count to be 1 for today, got ${fullyPillMatch ? fullyPillMatch[1] : 'null'}`);
}

// Pill 3: Partially Settled: 0
const partialPillMatch = html.match(/<span>⏳ Partially Settled<\/span>\s*<span class="badge badge-subtle"[^>]*>(\d+)<\/span>/);
console.log('Partially Settled Pill Count:', partialPillMatch ? partialPillMatch[1] : 'NOT FOUND');
if (!partialPillMatch || partialPillMatch[1] !== '0') {
  throw new Error(`Expected Partially Settled Pill Count to be 0 for today, got ${partialPillMatch ? partialPillMatch[1] : 'null'}`);
}

// Pill 4: Pending: 0
const pendingPillMatch = html.match(/<span>⚠️ Pending<\/span>\s*<span class="badge badge-subtle"[^>]*>(\d+)<\/span>/);
console.log('Pending Pill Count:', pendingPillMatch ? pendingPillMatch[1] : 'NOT FOUND');
if (!pendingPillMatch || pendingPillMatch[1] !== '0') {
  throw new Error(`Expected Pending Pill Count to be 0 for today, got ${pendingPillMatch ? pendingPillMatch[1] : 'null'}`);
}

console.log('✓ Category pills correctly count today records only by default!');

console.log('\n--- TEST 2: Changing Date Filter Updates Category Counts ---');
// Switch to 'ALL'
BM.setFinalBillAllDates();
const htmlAll = BM.renderFinalBillsTab();

const allPillAllMatch = htmlAll.match(/<span>All<\/span>\s*<span class="badge badge-subtle"[^>]*>(\d+)<\/span>/);
console.log('All Dates - Total Count:', allPillAllMatch ? allPillAllMatch[1] : 'NOT FOUND');
if (!allPillAllMatch || allPillAllMatch[1] !== '4') {
  throw new Error(`Expected All Pill Count to be 4 for ALL dates, got ${allPillAllMatch ? allPillAllMatch[1] : 'null'}`);
}

const partialPillAllMatch = htmlAll.match(/<span>⏳ Partially Settled<\/span>\s*<span class="badge badge-subtle"[^>]*>(\d+)<\/span>/);
console.log('All Dates - Partially Settled Count:', partialPillAllMatch ? partialPillAllMatch[1] : 'NOT FOUND');
if (!partialPillAllMatch || partialPillAllMatch[1] !== '1') {
  throw new Error(`Expected Partially Settled Pill Count to be 1 for ALL dates, got ${partialPillAllMatch ? partialPillAllMatch[1] : 'null'}`);
}

console.log('✓ Switching to All Dates correctly updates pill counts to include past records');

// Switch back to Today
BM.setFinalBillToday();
const htmlTodayAgain = BM.renderFinalBillsTab();
const allPillTodayMatch = htmlTodayAgain.match(/<span>All<\/span>\s*<span class="badge badge-subtle"[^>]*>(\d+)<\/span>/);
if (!allPillTodayMatch || allPillTodayMatch[1] !== '1') {
  throw new Error(`Expected All Pill Count to be 1 after setFinalBillToday(), got ${allPillTodayMatch ? allPillTodayMatch[1] : 'null'}`);
}
console.log('✓ setFinalBillToday() correctly resets count back to today only');

console.log('\n--- TEST 3: Vehicle Delivery From/To Date & Scoped Counts ---');
const testDeliveries = [
  {
    id: 'DEL-INV-TODAY-01',
    invoice_no: 'INV/MSC1/2026/0020',
    gate_pass_no: 'Pending Gate Pass',
    date: todayStr,
    delivery_date: 'Ready for Handover',
    settled_at: new Date().toISOString(),
    plant_id: 'PLANT-01',
    status: 'READY_FOR_DELIVERY'
  },
  {
    id: 'DEL-PAST-01',
    invoice_no: 'INV/MSC1/2026/0001',
    gate_pass_no: 'GP-PAST-001',
    date: '2026-10-15',
    delivery_date: '2026-10-15',
    plant_id: 'PLANT-01',
    status: 'READY_FOR_DELIVERY'
  }
];
window.DB.data.vehicleDeliveries = [...testDeliveries];
window.DB.saveData();

BM.deliveryFromDate = undefined;
BM.deliveryToDate = undefined;

const delHtml = BM.renderDeliveryTab();
if (!delHtml.includes('id="delivery-from-date"') || !delHtml.includes('id="delivery-to-date"')) {
  throw new Error('Vehicle Delivery missing From/To date inputs');
}
if (!delHtml.includes('1 of 1 Deliveries')) {
  throw new Error(`Expected Vehicle delivery to show '1 of 1 Deliveries' for today, but got: ${delHtml.substring(0, 400)}`);
}
console.log('✓ Vehicle Delivery From/To Date inputs and today count verified');

console.log('\n🎉 ALL BILL LIST & VEHICLE DELIVERY DATE FILTER & TODAY COUNT TESTS PASSED!');
