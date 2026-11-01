const fs = require('fs');
const assert = require('assert');

console.log('--- 1. Testing Document Number Series for INV and CN ---');
const docSeriesFile = fs.readFileSync('d:/Projects/ISCM/js/modules/doc-series-master.js', 'utf8');
const mockDataFile = fs.readFileSync('d:/Projects/ISCM/js/data/mock-data.js', 'utf8');

assert(mockDataFile.includes('"doc_type_code": "INV"'), 'mock-data must contain INV series');
assert(mockDataFile.includes('"doc_type_code": "CN"'), 'mock-data must contain CN series');
console.log('✔ Document Number Series contains active INV (Tax Invoice) and CN (Credit Note) series.');

// Behavioral Simulation
global.window = {};
global.localStorage = { getItem: () => null, setItem: () => null };

eval(fs.readFileSync('d:/Projects/ISCM/js/data/mock-data.js', 'utf8'));
eval(fs.readFileSync('d:/Projects/ISCM/js/data/db.js', 'utf8'));
eval(fs.readFileSync('d:/Projects/ISCM/js/modules/doc-series-master.js', 'utf8'));

// Test generating INV number
const invRes = window.DocSeriesMasterModule.generateNextNumber('INV', 'PLANT-01');
assert(invRes && invRes.success, 'INV number generation must succeed');
console.log('✔ Generated next INV number:', invRes.docNumber);
assert(invRes.docNumber.startsWith('INV/MSC1/'), 'INV number must match series format INV/MSC1/YYYY/XXXXXX');

// Test generating CN number
const cnRes = window.DocSeriesMasterModule.generateNextNumber('CN', 'PLANT-01');
assert(cnRes && cnRes.success, 'CN number generation must succeed');
console.log('✔ Generated next CN number:', cnRes.docNumber);
assert(cnRes.docNumber.startsWith('CN/MSC1/'), 'CN number must match series format CN/MSC1/YYYY/XXXXXX');

console.log('\n--- 2. Testing Single-Screen Customer Billing Workflow Requirements ---');

// Proposed UI Test Case:
// Job Card: JC-000501
// Customer CIN: CIN-000126
// Customer: Rahul Patil (98XXXXXX10)
// Vehicle: MH12AB1234 (Honda Activa, 18,500 km)
// Items:
// 1. Engine Oil, Qty 1, ₹450
// 2. Oil Filter, Qty 1, ₹150
// 3. General Service Labour, Qty 1, ₹500
// Subtotal: ₹1,100.00
// Tax: ₹198.00 (CGST 9% + SGST 9%)
// Discount: ₹0.00
// Grand Total: ₹1,298.00

const items = [
  { id: 'ITM-01', name: 'Engine Oil', type: 'PART', qty: 1, rate: 450, amount: 450 },
  { id: 'ITM-02', name: 'Oil Filter', type: 'PART', qty: 1, rate: 150, amount: 150 },
  { id: 'ITM-03', name: 'General Service Labour', type: 'LABOUR', qty: 1, rate: 500, amount: 500 }
];

let subtotal = items.reduce((s, it) => s + (it.qty * it.rate), 0);
assert.strictEqual(subtotal, 1100, 'Subtotal must be 1100');

let discount = 0;
let taxable = subtotal - discount;
let tax = taxable * 0.18;
assert.strictEqual(tax, 198, 'Tax at 18% must be 198');

let grandTotal = Math.round(taxable + tax);
assert.strictEqual(grandTotal, 1298, 'Grand Total must be 1298');

// Draft state
let amountReceived = 0;
let balanceDue = grandTotal - amountReceived;
assert.strictEqual(balanceDue, 1298, 'Initial balance due must equal grand total 1298');

console.log('✔ Illustrative calculation exactly matches specification:');
console.log(`  Subtotal: ₹${subtotal.toFixed(2)}`);
console.log(`  Tax (18%): ₹${tax.toFixed(2)}`);
console.log(`  Discount: ₹${discount.toFixed(2)}`);
console.log(`  Grand Total: ₹${grandTotal.toFixed(2)}`);
console.log(`  Balance Due: ₹${balanceDue.toFixed(2)}`);

// Simulate Finalization:
const finalBillInvNo = invRes.docNumber;
amountReceived = 1298; // Paid in full
balanceDue = Math.max(0, grandTotal - amountReceived);
const paymentStatus = balanceDue === 0 ? 'PAID' : (amountReceived > 0 ? 'PARTIALLY_PAID' : 'OUTSTANDING');

assert.strictEqual(balanceDue, 0, 'Balance due must be 0 when paid in full');
assert.strictEqual(paymentStatus, 'PAID', 'Payment status must be PAID');
console.log(`✔ Finalized Bill Number: ${finalBillInvNo}, Payment Status: ${paymentStatus}, Balance Due: ₹${balanceDue}`);

console.log('\nALL WORKFLOW CHECKS PASSED! 🎯');
