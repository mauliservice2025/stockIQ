const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('VERIFYING UPDATE CUSTOMER INFORMATION & MOBILE NUMBER PROPAGATION');
console.log('================================================================\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Verify button existence in modal footer
assert(billingJs.includes('id="btn-update-customer-info"'), 'Button with id btn-update-customer-info must exist');
assert(billingJs.includes('>Update Customer Information</button>'), 'Button label must be Update Customer Information');
assert(billingJs.includes('window.BillingModule.updateCustomerInformationOnly()'), 'Button must call updateCustomerInformationOnly');
console.log('✓ PASS: "Update Customer Information" button exists beside "Create Job Card"');

// 2. Setup mock DB & test environment
const mockData = {
  customers: [
    {
      id: 'CUST-001',
      cin_number: 'CIN-000126',
      name: 'Anand Kulkarni',
      mobile: '9822119810',
      address: 'Old Street 1',
      city: 'Haveli',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '412101'
    }
  ],
  jobCards: [
    {
      id: 'JC-ACTIVE-001',
      job_card_no: 'JC/MSC1/2026/0001',
      customer_cin: 'CIN-000126',
      customer_name: 'Anand Kulkarni',
      customer_mobile: '9822119810',
      vehicle_reg_no: 'MH 12 AB 1234',
      status: 'IN_SERVICE' // Active, not finalized
    },
    {
      id: 'JC-FINALIZED-002',
      job_card_no: 'JC/MSC1/2026/0002',
      customer_cin: 'CIN-000126',
      customer_name: 'Anand Kulkarni',
      customer_mobile: '9822119810',
      vehicle_reg_no: 'MH 12 AB 1234',
      invoice_no: 'INV-2026-0002', // Finalized!
      status: 'BILLED'
    }
  ],
  billingEstimates: [
    {
      id: 'EST-ACTIVE-001',
      estimate_no: 'EST/MSC1/2026/0001',
      job_card_id: 'JC-ACTIVE-001',
      customer_cin: 'CIN-000126',
      customer_name: 'Anand Kulkarni',
      customer_mobile: '9822119810',
      vehicle_reg_no: 'MH 12 AB 1234',
      status: 'SUBMITTED' // Active, unfinalized
    },
    {
      id: 'EST-FINALIZED-002',
      estimate_no: 'EST/MSC1/2026/0002',
      job_card_id: 'JC-FINALIZED-002',
      customer_cin: 'CIN-000126',
      customer_name: 'Anand Kulkarni',
      customer_mobile: '9822119810',
      vehicle_reg_no: 'MH 12 AB 1234',
      final_bill_no: 'INV-2026-0002', // Finalized!
      status: 'CONVERTED'
    }
  ],
  draftBills: [
    {
      id: 'DB-ACTIVE-001',
      draft_bill_no: 'DB/MSC1/2026/0001',
      job_card_id: 'JC-ACTIVE-001',
      customer_cin: 'CIN-000126',
      customer_name: 'Anand Kulkarni',
      customer_mobile: '9822119810',
      vehicle_reg_no: 'MH 12 AB 1234',
      status: 'DRAFT' // Active, unfinalized
    },
    {
      id: 'DB-FINALIZED-002',
      draft_bill_no: 'DB/MSC1/2026/0002',
      job_card_id: 'JC-FINALIZED-002',
      customer_cin: 'CIN-000126',
      customer_name: 'Anand Kulkarni',
      customer_mobile: '9822119810',
      vehicle_reg_no: 'MH 12 AB 1234',
      invoice_no: 'INV-2026-0002',
      status: 'FINALIZED' // Finalized!
    }
  ],
  finalBills: [
    {
      id: 'INV-FINAL-002',
      invoice_no: 'INV-2026-0002',
      draft_bill_id: 'DB-FINALIZED-002',
      job_card_id: 'JC-FINALIZED-002',
      customer_name: 'Anand Kulkarni',
      customer_mobile: '9822119810',
      status: 'FINALIZED'
    }
  ],
  vehicles: [
    {
      id: 'VEH-001',
      reg_no: 'MH12AB1234',
      vehicle_reg_no: 'MH 12 AB 1234',
      customer_mobile: '9822119810',
      customer_name: 'Anand Kulkarni'
    }
  ]
};

let toastMsg = null;
let auditLogs = [];

global.window = {
  DB: {
    getAll: (table) => mockData[table] || [],
    getById: (table, id) => (mockData[table] || []).find(r => r.id === id),
    upsert: (table, obj) => {
      if (!mockData[table]) mockData[table] = [];
      const idx = mockData[table].findIndex(r => r.id === obj.id);
      if (idx !== -1) mockData[table][idx] = obj;
      else mockData[table].push(obj);
    },
    saveData: () => {},
    emitChange: () => {},
    normalizeVehicleReg: (v) => String(v || '').replace(/\s+/g, '').toUpperCase(),
    logAudit: (action, type, id, details) => {
      auditLogs.push({ action, type, id, details });
    }
  },
  State: {
    showToast: (msg, type) => {
      toastMsg = msg;
    },
    closeModal: () => {}
  }
};

// Mock Document inputs
const domElements = {
  'new-jc-customer': { value: 'Anand R. Kulkarni', trim() { return this.value.trim(); } },
  'new-jc-mobile': { value: '9899001122', dataset: { originalMobile: '9822119810' }, trim() { return this.value.trim(); } },
  'new-jc-alt-mobile': { value: '9822001122', trim() { return this.value.trim(); } },
  'new-jc-customer-type': { value: 'Retail Individual' },
  'new-jc-address': { value: 'Flat 402, Golden Palms', trim() { return this.value.trim(); } },
  'new-jc-city': { value: 'Pune', trim() { return this.value.trim(); } },
  'new-jc-district': { value: 'Pune', trim() { return this.value.trim(); } },
  'new-jc-state': { value: 'Maharashtra', trim() { return this.value.trim(); } },
  'new-jc-pincode': { value: '411038', trim() { return this.value.trim(); } },
  'new-jc-email': { value: 'anand.k@example.com', trim() { return this.value.trim(); } },
  'new-jc-gstin': { value: '27AABCU9603R1ZM', trim() { return this.value.trim().toUpperCase(); } },
  'new-jc-cin': { value: 'CIN-000126', dataset: { originalCin: 'CIN-000126' }, trim() { return this.value.trim(); } },
  'new-jc-reg': { value: 'MH 12 AB 1234', trim() { return this.value.trim(); } }
};

global.document = {
  getElementById: (id) => domElements[id] || null
};

// Extract and test updateCustomerInformationOnly
const extractCode = billingJs.slice(
  billingJs.indexOf('updateCustomerInformationOnly() {'),
  billingJs.indexOf('viewJobCard(jcId) {')
);

const ctx = vm.createContext({
  window: global.window,
  document: global.document,
  console: console,
  Date: Date,
  String: String
});

const script = new vm.Script(`
  const BillingModule = {
    refresh() {},
    canUpdateCustomerDetails: () => true,
    showUpdateCustomerDetailsModal: () => {},
    ${extractCode}
  };
  BillingModule.updateCustomerInformationOnly();
`);

script.runInContext(ctx);

// 3. Verifications
console.log('Verifying Results after Mobile Update (9822119810 -> 9899001122):');

// A. Customer record in 'customers'
const cust = mockData.customers.find(c => c.cin_number === 'CIN-000126');
assert.strictEqual(cust.mobile, '9899001122', 'Customer master mobile must be updated to 9899001122');
assert.strictEqual(cust.name, 'Anand R. Kulkarni', 'Customer name must be updated');
assert.strictEqual(cust.pincode, '411038', 'Customer pincode must be updated');
console.log('✓ PASS: Customer master updated with new mobile & demographic details');

// B. Active Job Card (Unfinalized)
const activeJc = mockData.jobCards.find(j => j.id === 'JC-ACTIVE-001');
assert.strictEqual(activeJc.customer_mobile, '9899001122', 'Active Job Card customer_mobile must be updated');
assert.strictEqual(activeJc.customer_name, 'Anand R. Kulkarni', 'Active Job Card customer_name must be updated');
console.log('✓ PASS: Active Job Card (JC-ACTIVE-001) mobile updated to 9899001122');

// C. Finalized Job Card (Locked!)
const finalizedJc = mockData.jobCards.find(j => j.id === 'JC-FINALIZED-002');
assert.strictEqual(finalizedJc.customer_mobile, '9822119810', 'Finalized Job Card mobile must REMAIN original (locked)');
console.log('✓ PASS: Finalized Job Card (JC-FINALIZED-002) mobile remained locked at 9822119810');

// D. Active Estimate (Unfinalized)
const activeEst = mockData.billingEstimates.find(e => e.id === 'EST-ACTIVE-001');
assert.strictEqual(activeEst.customer_mobile, '9899001122', 'Active Estimate customer_mobile must be updated');
console.log('✓ PASS: Active Estimate (EST-ACTIVE-001) mobile updated to 9899001122');

// E. Finalized Estimate (Locked!)
const finalizedEst = mockData.billingEstimates.find(e => e.id === 'EST-FINALIZED-002');
assert.strictEqual(finalizedEst.customer_mobile, '9822119810', 'Finalized Estimate mobile must REMAIN original (locked)');
console.log('✓ PASS: Finalized Estimate (EST-FINALIZED-002) mobile remained locked at 9822119810');

// F. Active Draft Bill (Unfinalized)
const activeDb = mockData.draftBills.find(d => d.id === 'DB-ACTIVE-001');
assert.strictEqual(activeDb.customer_mobile, '9899001122', 'Active Draft Bill customer_mobile must be updated');
console.log('✓ PASS: Active Draft Bill (DB-ACTIVE-001) mobile updated to 9899001122');

// G. Finalized Draft Bill (Locked!)
const finalizedDb = mockData.draftBills.find(d => d.id === 'DB-FINALIZED-002');
assert.strictEqual(finalizedDb.customer_mobile, '9822119810', 'Finalized Draft Bill mobile must REMAIN original (locked)');
console.log('✓ PASS: Finalized Draft Bill (DB-FINALIZED-002) mobile remained locked at 9822119810');

// H. Final Bills collection (Always Immutable!)
const finalBill = mockData.finalBills.find(b => b.id === 'INV-FINAL-002');
assert.strictEqual(finalBill.customer_mobile, '9822119810', 'Official Final GST Invoice must NEVER be modified (locked)');
console.log('✓ PASS: Final GST Invoice (INV-FINAL-002) remained strictly immutable at 9822119810');

// I. Toast & Audit
assert(toastMsg && toastMsg.includes('Customer Information updated successfully'), 'Success toast must be displayed');
assert(auditLogs.length > 0, 'Audit log must be recorded');
console.log('✓ PASS: User feedback toast displayed and security audit logged');

console.log('\n================================================================');
console.log('🎉 ALL 9 TEST SUITES PASSED (100%)!');
console.log('================================================================\n');
