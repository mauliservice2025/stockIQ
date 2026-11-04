const fs = require('fs');

const mockDocument = {
  getElementById: (id) => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  body: { appendChild: () => {} },
  createElement: () => ({ style: {}, innerHTML: '', appendChild: () => {}, remove: () => {} })
};

const mockWindow = {
  location: { hash: '#/job-cards' },
  addEventListener: () => {},
  DB: {
    data: {
      _workshop_all_customers_purged_v3: true,
      jobCards: [
        {
          id: 'JC-001',
          job_card_no: 'JC/MSC1/2026/0038',
          vehicle_reg_no: 'MH12AC4335',
          vehicle_model: 'Honda Activa',
          customer_name: 'Pravin Patil',
          customer_mobile: '9838462423',
          customer_cin: 'CIN/MSC1/2026/000031',
          cin_number: 'CIN/MSC1/2026/000031',
          status: 'READY_FOR_BILLING',
          parts_required: []
        }
      ],
      billingEstimates: [
        {
          id: 'EST-001',
          estimate_no: 'EST/MSC1/2026/0026-R3',
          job_card_id: 'JC-001',
          job_card_no: 'JC/MSC1/2026/0038',
          vehicle_reg_no: 'MH12AC4335',
          customer_name: 'Pravin OldName',
          customer_mobile: '9800000000',
          customer_cin: 'CIN/OLD/001',
          status: 'SUBMITTED',
          items: []
        }
      ],
      draftBills: [
        {
          id: 'DBILL-001',
          draft_bill_no: 'DB/MSC1/2026/0012',
          job_card_id: 'JC-001',
          job_card_no: 'JC/MSC1/2026/0038',
          vehicle_reg_no: 'MH12AC4335',
          customer_name: 'Pravin OldName',
          customer_mobile: '9800000000',
          customer_cin: 'CIN/OLD/001',
          status: 'DRAFT',
          items: []
        }
      ],
      finalBills: [
        {
          id: 'BILL-001',
          invoice_no: 'INV/MSC1/2026/0005',
          job_card_id: 'JC-001',
          job_card_no: 'JC/MSC1/2026/0038',
          vehicle_reg_no: 'MH12AC4335',
          customer_name: 'Pravin OldName',
          customer_mobile: '9800000000',
          customer_cin: 'CIN/OLD/001',
          status: 'FINALIZED',
          items: []
        }
      ],
      vehicleDeliveries: [
        {
          id: 'DEL-001',
          gate_pass_no: 'GP-001',
          job_card_id: 'JC-001',
          job_card_no: 'JC/MSC1/2026/0038',
          vehicle_reg_no: 'MH12AC4335',
          customer_name: 'Pravin OldName',
          customer_mobile: '9800000000',
          customer_cin: 'CIN/OLD/001',
          status: 'READY_FOR_DELIVERY'
        }
      ],
      vehicles: [
        {
          id: 'VEH-001',
          vehicle_reg_no: 'MH12AC4335',
          customer_name: 'Pravin OldName',
          customer_mobile: '9800000000',
          customer_cin: 'CIN/OLD/001'
        }
      ],
      customers: []
    },
    getAll(col) { return this.data[col] || []; },
    getById(col, id) { return (this.data[col] || []).find(x => x.id === id); },
    upsert(col, item) {
      if (!this.data[col]) this.data[col] = [];
      const idx = this.data[col].findIndex(x => x.id === item.id);
      if (idx >= 0) this.data[col][idx] = Object.assign({}, this.data[col][idx], item);
      else this.data[col].push(item);
    },
    saveData() {},
    emitChange() {},
    logAudit() {},
    normalizeVehicleReg(r) { return String(r || '').replace(/\s+/g, '').toUpperCase(); },
    formatVehicleRegDisplay(r) { return r; }
  },
  State: { showToast: () => {}, showModal: () => {}, closeModal: () => {} }
};
mockWindow.window = mockWindow;

const billingJs = fs.readFileSync('js/modules/billing.js', 'utf8');
const fn = new Function('window', 'document', billingJs + '; return window.BillingModule;');
const BillingModule = fn(mockWindow, mockDocument);

console.log('--- Test 1: syncJobCardCustomerToJourney ---');
const jc = mockWindow.DB.getById('jobCards', 'JC-001');
BillingModule.syncJobCardCustomerToJourney(jc);

const est = mockWindow.DB.getById('billingEstimates', 'EST-001');
const db = mockWindow.DB.getById('draftBills', 'DBILL-001');
const fb = mockWindow.DB.getById('finalBills', 'BILL-001');
const del = mockWindow.DB.getById('vehicleDeliveries', 'DEL-001');
const veh = mockWindow.DB.getById('vehicles', 'VEH-001');

console.log('Estimate customer:', est.customer_name, '| CIN:', est.customer_cin, '| Mobile:', est.customer_mobile);
console.log('Draft Bill customer:', db.customer_name, '| CIN:', db.customer_cin, '| Mobile:', db.customer_mobile);
console.log('Final Bill customer:', fb.customer_name, '| CIN:', fb.customer_cin, '| Mobile:', fb.customer_mobile);
console.log('Vehicle Delivery customer:', del.customer_name, '| CIN:', del.customer_cin, '| Mobile:', del.customer_mobile);
console.log('Vehicle customer:', veh.customer_name, '| CIN:', veh.customer_cin, '| Mobile:', veh.customer_mobile);

if (est.customer_name !== 'Pravin Patil' || est.customer_cin !== 'CIN/MSC1/2026/000031' || est.customer_mobile !== '9838462423') {
  throw new Error('Estimate was not updated with job card customer!');
}
if (db.customer_name !== 'Pravin Patil' || db.customer_cin !== 'CIN/MSC1/2026/000031') {
  throw new Error('Draft bill was not updated with job card customer!');
}
if (fb.customer_name !== 'Pravin Patil' || fb.customer_cin !== 'CIN/MSC1/2026/000031') {
  throw new Error('Final bill was not updated with job card customer!');
}
if (del.customer_name !== 'Pravin Patil' || del.customer_cin !== 'CIN/MSC1/2026/000031') {
  throw new Error('Vehicle delivery was not updated with job card customer!');
}
if (veh.customer_name !== 'Pravin Patil' || veh.customer_cin !== 'CIN/MSC1/2026/000031') {
  throw new Error('Vehicle was not updated with job card customer!');
}

console.log('\n--- Test 2: syncAllJobCardStatuses customer propagation ---');
// Modify JC again
jc.customer_name = 'Sanjay Sharma';
jc.customer_mobile = '9822334455';
jc.customer_cin = 'CIN/MSC1/2026/000099';
BillingModule.syncAllJobCardStatuses();

const est2 = mockWindow.DB.getById('billingEstimates', 'EST-001');
const db2 = mockWindow.DB.getById('draftBills', 'DBILL-001');
const fb2 = mockWindow.DB.getById('finalBills', 'BILL-001');
const del2 = mockWindow.DB.getById('vehicleDeliveries', 'DEL-001');

if (est2.customer_name !== 'Sanjay Sharma' || est2.customer_cin !== 'CIN/MSC1/2026/000099') {
  throw new Error('syncAllJobCardStatuses failed to update Estimate!');
}
if (db2.customer_name !== 'Sanjay Sharma' || db2.customer_cin !== 'CIN/MSC1/2026/000099') {
  throw new Error('syncAllJobCardStatuses failed to update Draft Bill!');
}
if (fb2.customer_name !== 'Sanjay Sharma' || fb2.customer_cin !== 'CIN/MSC1/2026/000099') {
  throw new Error('syncAllJobCardStatuses failed to update Final Bill!');
}
if (del2.customer_name !== 'Sanjay Sharma' || del2.customer_cin !== 'CIN/MSC1/2026/000099') {
  throw new Error('syncAllJobCardStatuses failed to update Vehicle Delivery!');
}

console.log('\n--- Test 3: getActiveEstimate dynamic sync from Job Card ---');
jc.customer_name = 'Anita Desai';
jc.customer_cin = 'CIN/MSC1/2026/000100';
// Notice est in DB has Sanjay Sharma, but JC has Anita Desai
BillingModule.activeEstimateId = 'EST-001';
const activeEst = BillingModule.getActiveEstimate();
if (activeEst.customer_name !== 'Anita Desai' || activeEst.customer_cin !== 'CIN/MSC1/2026/000100') {
  throw new Error('getActiveEstimate did not dynamically sync customer from Job Card!');
}

console.log('\n--- Test 4: getActiveCustomerBillingBill dynamic sync from Job Card ---');
BillingModule.activeBillingBillId = 'DBILL-001';
const activeBill = BillingModule.getActiveCustomerBillingBill();
if (activeBill.customer_name !== 'Anita Desai' || activeBill.customer_cin !== 'CIN/MSC1/2026/000100') {
  throw new Error('getActiveCustomerBillingBill did not dynamically sync customer from Job Card!');
}

console.log('\n--- Test 5: Table rendering has edit customer button ---');
const jcTableHtml = BillingModule.renderJobCardsTab();
if (!jcTableHtml.includes('showUpdateCustomerDetailsModal')) {
  throw new Error('renderJobCardsTab does not contain showUpdateCustomerDetailsModal trigger!');
}

console.log('\nALL 5 TESTS PASSED SUCCESSFULLY! Customer/patient details propagate flawlessly across the entire journey!');
