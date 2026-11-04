// Test Customer Billing Screen Fix, Customer Eligibility & Automatic Details Fetching
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.document = {
  getElementById: (id) => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

let lastModal = null;
let lastToast = null;
global.window.State = {
  showModal: (opts) => {
    lastModal = opts;
    console.log(`[Modal opened]: ${opts.title}`);
  },
  closeModal: () => {
    lastModal = null;
    console.log('[Modal closed]');
  },
  showToast: (msg, type) => {
    lastToast = { msg, type };
    console.log(`[Toast ${type}]: ${msg}`);
  }
};

// Mock DB
global.window.DB = {
  data: {
    jobCards: [
      {
        id: 'JC-001',
        job_card_no: 'JC-PUN-26-001',
        customer_name: 'Rushikesh Dhiwar',
        customer_mobile: '9876567876',
        customer_cin: 'CIN-MSC1-000132',
        vehicle_reg_no: 'MH12VV3443',
        vehicle_model: 'Honda Activa 125',
        odometer_km: '10,000 km',
        service_type: 'General Service',
        parts_required: [
          { item_id: 'PRT-1', item_name: 'Brake Lever Pair', qty: 2, unit_price: 230 }
        ],
        labour_tasks: [
          { desc: 'General Service Labour', hours: 2, rate: 250, amount: 500 }
        ]
      },
      {
        id: 'JC-NO-CIN',
        job_card_no: 'JC-PUN-26-999',
        customer_name: 'Walk-in Anonymous',
        customer_mobile: '9999900000',
        customer_cin: '',
        cin_number: '',
        cin: '',
        vehicle_reg_no: 'MH14AB1234',
        vehicle_model: 'Bajaj Pulsar 150',
        parts_required: [
          { item_name: 'Engine Oil', qty: 1, unit_price: 400 }
        ],
        labour_tasks: []
      }
    ],
    billingEstimates: [
      {
        id: 'EST-001',
        estimate_no: 'EST-PUN-26-001-R1',
        customer_name: 'Rushikesh Dhiwar',
        customer_mobile: '9876567876',
        customer_cin: 'CIN-MSC1-000132',
        vehicle_reg_no: 'MH12VV3443',
        vehicle_model: 'Honda Activa 125',
        odometer_km: '10,000 km',
        service_type: 'General Service',
        job_card_no: 'JC-PUN-26-001',
        job_card_id: 'JC-001',
        items: [
          { id: 'ITM-1', item_name: 'Forged Alloy Brake Lever Pair', type: 'PART', qty: 2, rate: 230, amount: 460 },
          { id: 'ITM-2', item_name: 'General Service Labour', type: 'LABOUR', qty: 2, rate: 250, amount: 500 }
        ],
        tax_rate: 18,
        discount_amount: 0,
        grand_total: 1133
      }
    ],
    draftBills: [],
    finalBills: [],
    customers: [
      {
        id: 'CUST-001',
        customer_name: 'Rushikesh Dhiwar',
        mobile: '9876567876',
        customer_cin: 'CIN-MSC1-000132'
      }
    ],
    vehicles: []
  },
  getAll: (coll) => global.window.DB.data[coll] || [],
  getById: (coll, id) => (global.window.DB.data[coll] || []).find(x => x.id === id),
  upsert: (coll, item) => {
    if (!global.window.DB.data[coll]) global.window.DB.data[coll] = [];
    const idx = global.window.DB.data[coll].findIndex(x => x.id === item.id);
    if (idx >= 0) global.window.DB.data[coll][idx] = item;
    else global.window.DB.data[coll].push(item);
  },
  getDefaultTax: () => ({ rate: 18, cgst_rate: 9, sgst_rate: 9, name: 'GST 18%' }),
  getTaxByRate: (r) => ({ rate: r, cgst_rate: r / 2, sgst_rate: r / 2, name: `GST ${r}%` }),
  renderTaxSelectOptions: (sel) => `<option value="${sel}" selected>GST ${sel}%</option>`,
  saveData: () => {},
  emitChange: () => {},
  logAudit: () => {}
};

// Load billing.js
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');
eval(billingCode);

console.log('--- TEST 1: Customer Eligibility Filtering ---');
const { eligibleJobCards, eligibleEstimates } = window.BillingModule.getEligibleBillingSources();
console.log(`Found ${eligibleEstimates.length} eligible estimate(s)`);
console.log(`Found ${eligibleJobCards.length} eligible job card(s)`);

if (eligibleEstimates.length !== 1 || eligibleEstimates[0].estimate_no !== 'EST-PUN-26-001-R1') {
  throw new Error('Eligible estimates failed');
}

// Ensure JC-NO-CIN is excluded since it has NO CIN and NO Estimate
const hasNoCin = eligibleJobCards.some(j => j.id === 'JC-NO-CIN');
console.log('Job Card without CIN and without Estimate in eligible list (should be false):', hasNoCin);
if (hasNoCin) throw new Error('Job Card without CIN or Estimate should NOT be eligible');

console.log('✓ PASS: Test 1');

console.log('\n--- TEST 2: Customer Ineligibility Enforcement ---');
const blockedResult = window.BillingModule.createOrUpdateBillFromJobCard('JC-NO-CIN', false);
console.log('createOrUpdateBillFromJobCard("JC-NO-CIN") returned:', blockedResult);
if (blockedResult !== null) throw new Error('Expected blocked result to be null');
if (!lastToast || !lastToast.msg.includes('restricted')) {
  throw new Error('Expected restriction toast message');
}
console.log('✓ PASS: Test 2');

console.log('\n--- TEST 3: Automatic Details Fetching from Estimate ---');
const billFromEst = window.BillingModule.createOrUpdateBillFromEstimate('EST-001', false);
console.log('Auto-fetched Bill details from Estimate:');
console.log('- Bill No / Draft ID:', billFromEst.draft_bill_no, '/', billFromEst.id);
console.log('- Customer Name:', billFromEst.customer_name);
console.log('- Customer Mobile:', billFromEst.customer_mobile);
console.log('- Customer CIN:', billFromEst.customer_cin);
console.log('- Vehicle Reg No:', billFromEst.vehicle_reg_no);
console.log('- Vehicle Model:', billFromEst.vehicle_model);
console.log('- Items count:', billFromEst.items ? billFromEst.items.length : 0);
console.log('- Subtotal: ₹' + billFromEst.subtotal);
console.log('- Tax Rate: ' + billFromEst.tax_rate + '%');
console.log('- CGST (' + billFromEst.cgst_rate + '%): ₹' + billFromEst.cgst_amount);
console.log('- SGST (' + billFromEst.sgst_rate + '%): ₹' + billFromEst.sgst_amount);
console.log('- Grand Total: ₹' + billFromEst.grand_total);

if (billFromEst.customer_name !== 'Rushikesh Dhiwar') throw new Error('Customer name mismatch');
if (billFromEst.customer_cin !== 'CIN-MSC1-000132') throw new Error('Customer CIN mismatch');
if (billFromEst.vehicle_reg_no !== 'MH12VV3443') throw new Error('Vehicle Reg No mismatch');
if (billFromEst.items.length !== 2) throw new Error('Items length mismatch');
if (billFromEst.subtotal !== 960) throw new Error(`Subtotal mismatch: got ${billFromEst.subtotal}, expected 960`);
if (billFromEst.tax_rate !== 18) throw new Error('Tax rate mismatch');
if (billFromEst.grand_total !== 1133) throw new Error(`Grand Total mismatch: got ${billFromEst.grand_total}, expected 1133`);
console.log('✓ PASS: Test 3');

console.log('\n--- TEST 4: Automatic Details Fetching from Job Card ---');
const billFromJc = window.BillingModule.createOrUpdateBillFromJobCard('JC-001', false);
console.log('Auto-fetched Bill details from Job Card:');
console.log('- Bill No / Draft ID:', billFromJc.draft_bill_no, '/', billFromJc.id);
console.log('- Customer Name:', billFromJc.customer_name);
console.log('- Customer Mobile:', billFromJc.customer_mobile);
console.log('- Customer CIN:', billFromJc.customer_cin);
console.log('- Vehicle Reg No:', billFromJc.vehicle_reg_no);
console.log('- Vehicle Model:', billFromJc.vehicle_model);
console.log('- Items count:', billFromJc.items ? billFromJc.items.length : 0);
console.log('- Subtotal: ₹' + billFromJc.subtotal);
console.log('- Tax Rate: ' + billFromJc.tax_rate + '%');
console.log('- CGST: ₹' + billFromJc.cgst_amount + ', SGST: ₹' + billFromJc.sgst_amount);
console.log('- Grand Total: ₹' + billFromJc.grand_total);

if (billFromJc.customer_name !== 'Rushikesh Dhiwar') throw new Error('Customer name mismatch');
if (billFromJc.customer_cin !== 'CIN-MSC1-000132') throw new Error('Customer CIN mismatch');
if (billFromJc.vehicle_reg_no !== 'MH12VV3443') throw new Error('Vehicle Reg No mismatch');
if (billFromJc.grand_total <= 0) throw new Error('Grand total invalid');
console.log('✓ PASS: Test 4');

console.log('\n--- TEST 5: Single Screen Customer Billing Renderer (No crashes) ---');
window.BillingModule.activeBillingBillId = billFromEst.id;
const htmlOutput = window.BillingModule.renderCustomerBillingSingleScreen();
console.log('Rendered HTML length:', htmlOutput.length);

if (!htmlOutput.includes('Customer Billing') || !htmlOutput.includes('Billing Queue')) {
  throw new Error('Key Customer Billing UI elements missing from rendered output');
}
if (!htmlOutput.includes('Rushikesh Dhiwar')) {
  throw new Error('Customer name not rendered in HTML');
}
if (!htmlOutput.includes('CIN-MSC1-000132')) {
  throw new Error('Customer CIN not rendered in HTML');
}
if (!htmlOutput.includes('MH12VV3443')) {
  throw new Error('Vehicle Reg No not rendered in HTML');
}
if (!htmlOutput.includes('Forged Alloy Brake Lever Pair')) {
  throw new Error('Estimate items not rendered in HTML');
}
if (!htmlOutput.includes('₹1,133.00')) {
  throw new Error('Grand Total not rendered correctly in HTML');
}

console.log('✓ PASS: Test 5');

console.log('\n--- ALL 5 TESTS PASSED WITH 100% SUCCESS! ---');
