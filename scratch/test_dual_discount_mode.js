const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('TEST SUITE: DUAL DISCOUNT (AMOUNT ₹ & PERCENT %) ON ALL 3 SCREENS');
console.log('================================================================');

const billingJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'billing.js'), 'utf8');

// Set up mock DOM and global environment
const domNodes = {};
const document = {
  getElementById: (id) => {
    if (!domNodes[id]) {
      domNodes[id] = {
        id,
        value: '',
        innerText: '',
        style: {},
        innerHTML: ''
      };
    }
    return domNodes[id];
  },
  createElement: (tag) => ({ tag, style: {}, appendChild: () => {}, querySelector: () => null }),
  body: { appendChild: () => {} }
};

const window = {
  location: { hash: '#/customer-billing' },
  document,
  State: {
    currentPlantId: 'PLANT-01',
    showToast: (msg, type) => console.log(`[TOAST] (${type}): ${msg}`),
    showModal: (config) => {
      window.lastModal = config;
    },
    closeModal: () => {
      window.lastModal = null;
    }
  },
  DB: {
    data: {
      billingEstimates: [],
      draftBills: [],
      finalBills: [],
      jobCards: [],
      customers: [],
      vehicles: []
    },
    getAll: (col) => window.DB.data[col] || [],
    getById: (col, id) => (window.DB.data[col] || []).find(r => r.id === id),
    upsert: (col, item) => {
      if (!window.DB.data[col]) window.DB.data[col] = [];
      const idx = window.DB.data[col].findIndex(r => r.id === item.id);
      if (idx >= 0) window.DB.data[col][idx] = { ...item };
      else window.DB.data[col].push({ ...item });
      return item;
    },
    saveData: () => {},
    emitChange: () => {},
    getDefaultTax: () => ({ rate: 18, cgst_rate: 9, sgst_rate: 9, name: 'GST 18%' }),
    getTaxByRate: (r) => ({ rate: Number(r), cgst_rate: Number(r) / 2, sgst_rate: Number(r) / 2, name: `GST ${r}%` }),
    renderTaxSelectOptions: (sel) => `<option value="${sel}">${sel}% GST</option>`
  }
};

const sandbox = {
  window,
  document,
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  parseFloat,
  parseInt,
  Math,
  Number,
  String,
  Array,
  Object,
  Date,
  domNodes
};

vm.createContext(sandbox);
vm.runInContext(billingJs, sandbox);
const BillingModule = sandbox.window.BillingModule;

// -------------------------------------------------------------
// TEST 1: ESTIMATE SCREEN - AMOUNT & PERCENT DISCOUNT
// -------------------------------------------------------------
console.log('\n--- 1. Testing Estimate Screen Discount ---');

const testEstimate = {
  id: 'EST-TEST-001',
  estimate_no: 'EST/MSC1/2026/0001',
  status: 'DRAFT',
  tax_rate: 18,
  items: [
    { id: '1', name: 'Brake Disc', type: 'PART', qty: 2, rate: 500, amount: 1000 },
    { id: '2', name: 'Labour Overhaul', type: 'LABOUR', qty: 1, rate: 1000, amount: 1000 }
  ]
};

// Subtotal = 2000
BillingModule.activeEstimateId = testEstimate.id;
window.DB.data.billingEstimates = [testEstimate];

// Test 1a: Amount-wise discount ₹200
testEstimate.discount_type = 'AMOUNT';
testEstimate.discount_value = 200;
BillingModule.recalculateEstimateTotals(testEstimate);

if (testEstimate.subtotal === 2000 && testEstimate.discount_amount === 200 && testEstimate.taxable_amount === 1800) {
  console.log(`✓ Estimate Amount Discount: Subtotal=₹2000, Disc=₹${testEstimate.discount_amount}, Taxable=₹${testEstimate.taxable_amount}`);
} else {
  throw new Error(`Estimate Amount Discount calculation failed: ${JSON.stringify(testEstimate)}`);
}

// Tax = 18% of 1800 = 324 => estimated_total = 2124
if (testEstimate.tax_amount === 324 && testEstimate.estimated_total === 2124) {
  console.log(`✓ Estimate Tax & Total: Tax=₹${testEstimate.tax_amount}, Total=₹${testEstimate.estimated_total}`);
} else {
  throw new Error(`Estimate Tax/Total failed: ${testEstimate.tax_amount}, ${testEstimate.estimated_total}`);
}

// Test 1b: Percentage-wise discount 15%
BillingModule.setEstimateDiscountType('PERCENT');
BillingModule.updateEstimateDiscount(15);
const estAfterPct = BillingModule.getActiveEstimate();

// 15% of 2000 = 300 discount => Taxable = 1700 => Tax 18% = 306 => Total = 2006
if (estAfterPct.discount_type === 'PERCENT' && estAfterPct.discount_amount === 300 && estAfterPct.taxable_amount === 1700 && estAfterPct.estimated_total === 2006) {
  console.log(`✓ Estimate Percent Discount (15%): Disc=₹${estAfterPct.discount_amount}, Taxable=₹${estAfterPct.taxable_amount}, Total=₹${estAfterPct.estimated_total}`);
} else {
  throw new Error(`Estimate Percent Discount failed: ${JSON.stringify(estAfterPct)}`);
}

// Test 1c: Verify Estimate markup has dual mode toggles and inputs
const estHtml = BillingModule.renderEstimatesTab();
if (estHtml.includes('setEstimateDiscountType(\'AMOUNT\')') && estHtml.includes('setEstimateDiscountType(\'PERCENT\')') && estHtml.includes('est-discount-input') && estHtml.includes('est-taxable-display')) {
  console.log('✓ Estimate UI contains dual mode ₹/% buttons and live input binding');
} else {
  throw new Error('Estimate UI missing dual mode controls');
}

// -------------------------------------------------------------
// TEST 2: DRAFT BILL (CUSTOMER BILLING) - AMOUNT & PERCENT DISCOUNT
// -------------------------------------------------------------
console.log('\n--- 2. Testing Customer Billing / Draft Bill Screen Discount ---');

const testDraftBill = {
  id: 'DBILL-TEST-001',
  draft_bill_no: 'DB/MSC1/2026/0001',
  status: 'DRAFT',
  tax_rate: 0,
  items: [
    { id: '1', name: 'Engine Oil', type: 'PART', qty: 2, rate: 250, amount: 500 },
    { id: '2', name: 'Oil Filter', type: 'PART', qty: 1, rate: 150, amount: 150 },
    { id: '3', name: 'Clutch OH', type: 'LABOUR', qty: 1, rate: 450, amount: 450 },
    { id: '4', name: 'Clutch Roller Set', type: 'PART', qty: 1, rate: 320, amount: 320 }
  ]
};
// Subtotal = 500 + 150 + 450 + 320 = 1420 (similar to user screenshot)
window.DB.data.draftBills = [testDraftBill];
BillingModule.activeBillingBillId = testDraftBill.id;

// Test 2a: Amount-wise discount ₹120
testDraftBill.discount_type = 'AMOUNT';
BillingModule.updateSingleScreenDiscount(120);
const activeBill1 = BillingModule.getActiveCustomerBillingBill();

if (activeBill1.discount_amount === 120 && activeBill1.taxable_amount === 1300 && activeBill1.grand_total === 1300) {
  console.log(`✓ Draft Bill Amount Discount (₹120): Subtotal=₹1420, Disc=₹${activeBill1.discount_amount}, Taxable=₹${activeBill1.taxable_amount}, Grand Total=₹${activeBill1.grand_total}`);
} else {
  throw new Error(`Draft Bill Amount Discount failed: ${JSON.stringify(activeBill1)}`);
}

// Test 2b: Percentage-wise discount 10%
BillingModule.setSingleScreenDiscountType('PERCENT');
BillingModule.updateSingleScreenDiscount(10);
const activeBill2 = BillingModule.getActiveCustomerBillingBill();

// 10% of 1420 = 142 discount => Taxable = 1278
if (activeBill2.discount_type === 'PERCENT' && activeBill2.discount_amount === 142 && activeBill2.taxable_amount === 1278 && activeBill2.grand_total === 1278) {
  console.log(`✓ Draft Bill Percent Discount (10%): Disc=₹${activeBill2.discount_amount}, Taxable=₹${activeBill2.taxable_amount}, Grand Total=₹${activeBill2.grand_total}`);
} else {
  throw new Error(`Draft Bill Percent Discount failed: ${JSON.stringify(activeBill2)}`);
}

// Test 2c: Verify Customer Billing markup has dual mode toggles and live element IDs
const billingHtml = BillingModule.renderCustomerBillingSingleScreen();
if (billingHtml.includes('setSingleScreenDiscountType(\'AMOUNT\')') && 
    billingHtml.includes('setSingleScreenDiscountType(\'PERCENT\')') && 
    billingHtml.includes('billing-discount-input') && 
    billingHtml.includes('billing-taxable-display') &&
    billingHtml.includes('billing-grand-total-display')) {
  console.log('✓ Customer Billing UI contains dual mode ₹/% toggle buttons and live input elements');
} else {
  throw new Error('Customer Billing UI missing dual mode controls');
}

// Test 2d: Verify showGenerateDraftBillModal dual discount support
BillingModule.showGenerateDraftBillModal();
if (window.lastModal && window.lastModal.contentHtml.includes('new-db-disc-type') && window.lastModal.contentHtml.includes('new-db-disc')) {
  console.log('✓ Generate Draft Bill modal contains discount type selector and input');
} else {
  throw new Error('Generate Draft Bill modal missing discount type selector');
}

// -------------------------------------------------------------
// TEST 3: FINAL BILL SCREEN - AMOUNT & PERCENT DISCOUNT
// -------------------------------------------------------------
console.log('\n--- 3. Testing Final Bill Screen Discount ---');

const testFinalBill = {
  id: 'INV-TEST-001',
  invoice_no: 'INV/MSC1/2026/0001',
  status: 'FINALIZED',
  subtotal: 5000,
  tax_rate: 18,
  amount_paid: 2000,
  items: [
    { id: '1', name: 'Major Service', type: 'LABOUR', qty: 1, rate: 5000, amount: 5000 }
  ]
};
window.DB.data.finalBills = [testFinalBill];

// Test 3a: Verify showEditBillDiscountModal is present and opens
BillingModule.showEditBillDiscountModal('INV-TEST-001');
if (window.lastModal && window.lastModal.contentHtml.includes('edit-bill-disc-type') && window.lastModal.contentHtml.includes('edit-bill-disc-val')) {
  console.log('✓ Final Bill Edit Discount modal opened with discount type dropdown and value input');
} else {
  throw new Error('Final Bill Edit Discount modal failed to open');
}

// Test 3b: Submit Amount discount ₹500 on Final Bill
document.getElementById('edit-bill-disc-type').value = 'AMOUNT';
document.getElementById('edit-bill-disc-val').value = '500';
BillingModule.submitEditBillDiscount('INV-TEST-001');

const updatedFinBill = window.DB.getById('finalBills', 'INV-TEST-001');
// Subtotal 5000 - 500 = 4500 Taxable => Tax 18% = 810 => Grand Total = 5310 => Paid 2000 => Bal = 3310
if (updatedFinBill.discount_type === 'AMOUNT' && updatedFinBill.discount_amount === 500 && updatedFinBill.taxable_amount === 4500 && updatedFinBill.grand_total === 5310 && updatedFinBill.balance_due === 3310) {
  console.log(`✓ Final Bill Amount Discount applied: Disc=₹${updatedFinBill.discount_amount}, Taxable=₹${updatedFinBill.taxable_amount}, Total=₹${updatedFinBill.grand_total}, Bal=₹${updatedFinBill.balance_due}`);
} else {
  throw new Error(`Final Bill Amount Discount submission failed: ${JSON.stringify(updatedFinBill)}`);
}

// Test 3c: Submit Percentage discount 20% on Final Bill
BillingModule.showEditBillDiscountModal('INV-TEST-001');
document.getElementById('edit-bill-disc-type').value = 'PERCENT';
document.getElementById('edit-bill-disc-val').value = '20';
BillingModule.submitEditBillDiscount('INV-TEST-001');

const updatedFinBillPct = window.DB.getById('finalBills', 'INV-TEST-001');
// 20% of 5000 = 1000 discount => Taxable 4000 => Tax 18% = 720 => Total = 4720 => Paid 2000 => Bal = 2720
if (updatedFinBillPct.discount_type === 'PERCENT' && updatedFinBillPct.discount_amount === 1000 && updatedFinBillPct.taxable_amount === 4000 && updatedFinBillPct.grand_total === 4720 && updatedFinBillPct.balance_due === 2720) {
  console.log(`✓ Final Bill Percent Discount (20%) applied: Disc=₹${updatedFinBillPct.discount_amount}, Taxable=₹${updatedFinBillPct.taxable_amount}, Total=₹${updatedFinBillPct.grand_total}, Bal=₹${updatedFinBillPct.balance_due}`);
} else {
  throw new Error(`Final Bill Percent Discount submission failed: ${JSON.stringify(updatedFinBillPct)}`);
}

// Test 3d: Verify Bill List table has Edit Discount button and % badge
const finalBillsHtml = BillingModule.renderFinalBillsTab();
if (finalBillsHtml.includes('showEditBillDiscountModal(\'INV-TEST-001\')') && finalBillsHtml.includes('(20%)')) {
  console.log('✓ Bill List table contains Edit Discount (🏷️) button and percentage display');
} else {
  throw new Error('Bill List table missing Edit Discount button or percentage badge');
}

// Test 3e: Verify viewBillDetails modal contains Edit Discount button
BillingModule.viewBillDetails('INV-TEST-001');
if (window.lastModal && window.lastModal.contentHtml.includes('showEditBillDiscountModal(\'INV-TEST-001\')')) {
  console.log('✓ Bill Overview modal contains "🏷️ Edit Discount (₹ / %)" button');
} else {
  throw new Error('Bill Overview modal missing Edit Discount button');
}

console.log('\n================================================================');
console.log('🎉 ALL DUAL DISCOUNT (AMOUNT & PERCENT) TESTS PASSED 100%!');
console.log('================================================================');
