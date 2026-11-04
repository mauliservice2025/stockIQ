// Test script for vehicle delivery data removal and empty state
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser environment
global.window = global;
global.document = {
  getElementById: (id) => null
};

window.State = {
  currentPlantId: 'ALL',
  showToast: (msg, type) => console.log(`[Toast ${type || 'info'}]: ${msg}`),
  showModal: () => {},
  closeModal: () => {}
};

window.DB = {
  data: {
    jobCards: [],
    billingEstimates: [],
    draftBills: [],
    finalBills: [],
    vehicleDeliveries: [
      { id: 'DEL-PREV-01', gate_pass_no: 'GP-PUN-26-001' }
    ]
  },
  getAll: (coll) => window.DB.data[coll] || [],
  getById: (coll, id) => (window.DB.data[coll] || []).find(x => x.id === id),
  saveData: () => {},
  emitChange: () => {},
  logAudit: () => {}
};

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('Testing Vehicle Delivery & Gate Pass removal...');

// 1. Test ensureSeedData flushes vehicleDeliveries
window.BillingModule.ensureSeedData();
assert.strictEqual(window.DB.data.vehicleDeliveries.length, 0, 'vehicleDeliveries must be cleared to 0');
assert.strictEqual(window.DB.data._deliveries_cleared_by_user_request, true, 'Persistent flag must be set');
console.log('✓ ensureSeedData() cleared vehicleDeliveries to 0');

// 2. Test re-running ensureSeedData does not re-seed deliveries
window.BillingModule._seeded = false;
window.BillingModule.ensureSeedData();
assert.strictEqual(window.DB.data.vehicleDeliveries.length, 0, 'Re-run ensureSeedData must remain 0');
console.log('✓ Re-running ensureSeedData() maintains empty slate without re-seeding');

// 3. Test renderDeliveryTab produces clean empty state
const deliveryHtml = window.BillingModule.renderDeliveryTab();
assert(deliveryHtml.includes('0 of 0 Deliveries'), 'Header must reflect 0 of 0 deliveries');
assert(deliveryHtml.includes('No Vehicle Delivery & Gate Pass Records Found'), 'Must display empty state banner');
assert(deliveryHtml.includes('+ Issue Gate Pass'), 'Must contain + Issue Gate Pass button');
console.log('✓ renderDeliveryTab() renders clean empty state UI');

// 4. Test clearAllDeliveries method
window.DB.data.vehicleDeliveries.push({
  id: 'DEL-TEMP-1',
  gate_pass_no: 'GP-TEMP-001',
  delivery_date: '2026-10-10 12:00',
  job_card_no: 'JC-1',
  customer_name: 'Test Customer',
  customer_mobile: '9999999999',
  vehicle_reg_no: 'MH12AB1234',
  status: 'DELIVERED'
});
assert.strictEqual(window.DB.data.vehicleDeliveries.length, 1);

window.BillingModule.clearAllDeliveries();
assert.strictEqual(window.DB.data.vehicleDeliveries.length, 0, 'clearAllDeliveries must reset to 0');
console.log('✓ clearAllDeliveries() successfully flushes records');

console.log('\nALL VEHICLE DELIVERY REMOVAL TESTS PASSED! 🛵');
