const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('--- Testing Sync Next Service Date from Vehicle Delivery to Bill UI and Print ---');

// Mock browser environment
const dom = {
  getElementById: (id) => null,
  querySelectorAll: () => []
};

global.window = {
  location: { hash: '#/billing' },
  State: {
    toasts: [],
    modals: [],
    currentPlantId: 'PLANT-01',
    showToast(msg, type) {
      this.toasts.push({ msg, type });
    },
    showModal(opts) {
      this.modals.push(opts);
    },
    closeModal() {}
  },
  DB: {
    data: {
      jobCards: [],
      billingEstimates: [],
      draftBills: [],
      finalBills: [],
      vehicleDeliveries: [],
      vehicles: [],
      customers: [],
      plants: [{ id: 'PLANT-01', name: 'Mauli Service Center 1' }]
    },
    getAll(col) {
      return this.data[col] || [];
    },
    getById(col, id) {
      return (this.data[col] || []).find(item => item.id === id);
    },
    upsert(col, item) {
      if (!this.data[col]) this.data[col] = [];
      const idx = this.data[col].findIndex(x => x.id === item.id);
      if (idx >= 0) this.data[col][idx] = item;
      else this.data[col].push(item);
    },
    saveData() {},
    emitChange() {},
    isPlantActive() { return true; },
    getDefaultTax() { return { rate: 18, name: 'GST 18%' }; }
  },
  StoreInventoryModule: {},
  DocSeriesMasterModule: {
    previewNextNumber: () => 'GP/MSC1/2026/0001',
    generateNextNumber: () => ({ success: true, docNumber: 'GP/MSC1/2026/0001' })
  }
};
global.document = dom;

// Read billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// Execute billing.js in VM
vm.runInThisContext(billingCode);
const BM = window.BillingModule;
assert(BM, 'BillingModule should be defined on window');

// Setup test scenario matching user screenshot:
// Bill No: INV/MSC1/2026/0012
// Job Card: JC/MSC1/2026/0016
// Vehicle Reg: MH12GH5676
// Customer: Ganesh Kale

const testJc = {
  id: 'JC-16',
  job_card_no: 'JC/MSC1/2026/0016',
  customer_name: 'Ganesh Kale',
  customer_mobile: '8765434567',
  customer_cin: 'CIN/MSC/2026/000012',
  vehicle_reg_no: 'MH12GH5676',
  vehicle_model: 'Activa 6G',
  status: 'READY_FOR_DELIVERY',
  payment_status: 'PAID',
  invoice_no: 'INV/MSC1/2026/0012',
  next_service_due_date: '2026-12-21'
};

const testBill = {
  id: 'BILL-12',
  invoice_no: 'INV/MSC1/2026/0012',
  job_card_id: 'JC-16',
  job_card_no: 'JC/MSC1/2026/0016',
  customer_name: 'Ganesh Kale',
  customer_mobile: '8765434567',
  customer_cin: 'CIN/MSC/2026/000012',
  vehicle_reg_no: 'MH12GH5676',
  vehicle_model: 'Activa 6G',
  status: 'PAID',
  grand_total: 1239,
  next_service_due_date: '2026-12-21'
};

const testVehicle = {
  id: 'VEH-1',
  vehicle_reg_no: 'MH12GH5676',
  vehicle_model: 'Activa 6G',
  customer_name: 'Ganesh Kale',
  next_service_due_date: '2026-12-21'
};

const testDelivery = {
  id: 'DEL-16',
  gate_pass_no: 'GP/MSC1/2026/0006',
  job_card_id: 'JC-16',
  job_card_no: 'JC/MSC1/2026/0016',
  invoice_no: 'INV/MSC1/2026/0012',
  customer_name: 'Ganesh Kale',
  customer_mobile: '8765434567',
  vehicle_reg_no: 'MH12GH5676',
  vehicle_model: 'Activa 6G',
  status: 'READY_FOR_DELIVERY',
  delivery_date: 'Ready for Handover',
  next_service_due_date: '2026-12-21'
};

window.DB.data.jobCards = [testJc];
window.DB.data.finalBills = [testBill];
window.DB.data.draftBills = [];
window.DB.data.vehicles = [testVehicle];
window.DB.data.vehicleDeliveries = [testDelivery];

console.log('\nTest 1: Normalizing and Formatting service dates');
assert.strictEqual(BM.normalizeServiceDate('2026-12-25'), '2026-12-25');
assert.strictEqual(BM.formatServiceDateDisplay('2026-12-25'), '25-Dec-2026');
console.log('✓ normalizeServiceDate and formatServiceDateDisplay passed!');

console.log('\nTest 2: updateDeliveryNextServiceDate syncs to Bill, Job Card, and Vehicle');
BM.updateDeliveryNextServiceDate('DEL-16', '2026-12-25');

// Check delivery record
const updatedDel = window.DB.getById('vehicleDeliveries', 'DEL-16');
assert.strictEqual(updatedDel.next_service_due_date, '2026-12-25', 'Delivery should have updated next_service_due_date');

// Check final bill
const updatedBill = window.DB.getById('finalBills', 'BILL-12');
assert.strictEqual(updatedBill.next_service_due_date, '2026-12-25', 'Final Bill must be updated to 2026-12-25');
assert.strictEqual(updatedBill.next_service_date, '2026-12-25', 'Final Bill next_service_date must be updated');

// Check job card
const updatedJc = window.DB.getById('jobCards', 'JC-16');
assert.strictEqual(updatedJc.next_service_due_date, '2026-12-25', 'Job Card must be updated to 2026-12-25');

// Check vehicle
const updatedVeh = window.DB.getById('vehicles', 'VEH-1');
assert.strictEqual(updatedVeh.next_service_due_date, '2026-12-25', 'Vehicle master must be updated to 2026-12-25');
console.log('✓ updateDeliveryNextServiceDate passed!');

console.log('\nTest 3: getActiveCustomerBillingBill returns synced Next Service Date');
BM.activeBillingBillId = 'BILL-12';
const activeBill = BM.getActiveCustomerBillingBill();
assert.strictEqual(activeBill.next_service_due_date, '2026-12-25', 'Active Bill must reflect 2026-12-25 in UI');
console.log('✓ getActiveCustomerBillingBill passed!');

console.log('\nTest 4: resolveInvoiceOrBill returns synced Next Service Date for Bill Print');
const resolvedForPrint = BM.resolveInvoiceOrBill('INV/MSC1/2026/0012');
assert.strictEqual(resolvedForPrint.next_service_due_date, '2026-12-25', 'Resolved Bill for Print must have 2026-12-25');
console.log('✓ resolveInvoiceOrBill passed!');

console.log('\nTest 5: Auto-healing sync in syncAllJobCardStatuses');
// Reset bill to old date (simulating older pre-existing data)
testBill.next_service_due_date = '2026-12-21';
window.DB.upsert('finalBills', testBill);
updatedDel.status = 'DELIVERED';
updatedDel.next_service_due_date = '2026-12-25';
window.DB.upsert('vehicleDeliveries', updatedDel);

// Run sync
BM.syncAllJobCardStatuses();
const healedBill = window.DB.getById('finalBills', 'BILL-12');
assert.strictEqual(healedBill.next_service_due_date, '2026-12-25', 'Auto-healing sync should update final bill to delivery date 2026-12-25');
console.log('✓ Auto-healing sync in syncAllJobCardStatuses passed!');

console.log('\nTest 6: Vehicle Delivery table includes Next Service Due column & edit action');
const tableHtml = BM.renderDeliveryTab();
assert(tableHtml.includes('Next Service Due'), 'Table should have Next Service Due header');
assert(tableHtml.includes('25-Dec-2026'), 'Table should display formatted date 25-Dec-2026');
assert(tableHtml.includes('showEditNextServiceDateModal'), 'Table should have edit modal button');
console.log('✓ Vehicle Delivery table passed!');

console.log('\nALL 6 NEXT SERVICE DATE SYNC TESTS PASSED SUCCESSFULLY! ✅');
