/**
 * Verification Test: Auto-Capitalization of First Letter for Customer Name
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('TESTING CUSTOMER NAME FIRST LETTER AUTO-CAPITALIZATION');
console.log('================================================================\n');

// 1. Verify code in js/modules/billing.js
const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

assert(billingJs.includes('toTitleCase('), 'BillingModule must define toTitleCase');
assert(billingJs.includes('formatCustomerNameInput('), 'BillingModule must define formatCustomerNameInput');
assert(billingJs.includes('formatCustomerNameBlur('), 'BillingModule must define formatCustomerNameBlur');
assert(billingJs.includes('formatCustomerNamePaste('), 'BillingModule must define formatCustomerNamePaste');
assert(billingJs.includes('id="new-jc-customer" class="form-control" placeholder="e.g. Anand Kulkarni" style="text-transform: capitalize;"'), 'new-jc-customer input must have text-transform: capitalize');
assert(billingJs.includes('oninput="window.BillingModule.formatCustomerNameInput(this)"'), 'new-jc-customer input must bind oninput');
assert(billingJs.includes('onblur="window.BillingModule.formatCustomerNameBlur(this)"'), 'new-jc-customer input must bind onblur');
assert(billingJs.includes('onpaste="window.BillingModule.formatCustomerNamePaste(event, this)"'), 'new-jc-customer input must bind onpaste');

console.log('✓ PASS: All attributes and method hooks present in billing.js');

// 2. Verify code in js/modules/store-inventory.js
const storeJs = fs.readFileSync(path.join(__dirname, '../js/modules/store-inventory.js'), 'utf8');
assert(storeJs.includes('id="jc-cust-name" class="form-control" placeholder="Customer full name" style="text-transform: capitalize;"'), 'jc-cust-name must have text-transform: capitalize');
assert(storeJs.includes('oninput="window.BillingModule ? window.BillingModule.formatCustomerNameInput(this) : null"'), 'jc-cust-name must bind oninput');
assert(storeJs.includes('window.BillingModule.toTitleCase(rawCustName)'), 'submitCreateJobCard must format customer name to title case');

console.log('✓ PASS: Store inventory module also supports customer name auto-capitalization');

// 3. Execution Test using vm sandbox
const sandbox = {
  window: {},
  document: {
    documentElement: { setAttribute() {}, classList: { add() {}, remove() {} } },
    body: { classList: { add() {}, remove() {} } },
    getElementById: (id) => null
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(billingJs, sandbox);

const BillingModule = sandbox.window.BillingModule;
assert(BillingModule, 'BillingModule must be initialized in sandbox');

// Test toTitleCase
const cases = [
  { in: 'anand kulkarni', out: 'Anand Kulkarni' },
  { in: 'ANAND KULKARNI', out: 'Anand Kulkarni' },
  { in: 'anand', out: 'Anand' },
  { in: 'a', out: 'A' },
  { in: 'dr. anand kulkarni', out: 'Dr. Anand Kulkarni' },
  { in: 'sachin r. tendulkar', out: 'Sachin R. Tendulkar' },
  { in: 'anand-kumar patil', out: 'Anand-Kumar Patil' },
  { in: "o'connor smith", out: "O'Connor Smith" },
  { in: 'ramesh chandra joshi', out: 'Ramesh Chandra Joshi' }
];

for (const tc of cases) {
  const res = BillingModule.toTitleCase(tc.in);
  assert.strictEqual(res, tc.out, `Expected "${tc.out}" for input "${tc.in}", got "${res}"`);
  console.log(`  ✓ toTitleCase("${tc.in}") -> "${res}"`);
}

// Test live typing simulation with formatCustomerNameInput
console.log('\nTesting live keystroke typing simulation:');
let simulatedInput = {
  value: '',
  selectionStart: 0,
  selectionEnd: 0,
  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }
};

const fullString = 'anand kulkarni';
for (let i = 0; i < fullString.length; i++) {
  const nextChar = fullString[i];
  simulatedInput.value = simulatedInput.value.slice(0, simulatedInput.selectionStart) + nextChar + simulatedInput.value.slice(simulatedInput.selectionEnd);
  simulatedInput.selectionStart++;
  simulatedInput.selectionEnd = simulatedInput.selectionStart;
  BillingModule.formatCustomerNameInput(simulatedInput);
}

assert.strictEqual(simulatedInput.value, 'Anand Kulkarni', `Expected final typed string "Anand Kulkarni", got "${simulatedInput.value}"`);
console.log(`  ✓ Typed "anand kulkarni" character-by-character -> successfully auto-capitalized to "${simulatedInput.value}"`);

// Test onblur handling for ALL-CAPS
simulatedInput.value = 'PRAVIN PATIL';
BillingModule.formatCustomerNameBlur(simulatedInput);
assert.strictEqual(simulatedInput.value, 'Pravin Patil', `Expected onblur "Pravin Patil", got "${simulatedInput.value}"`);
console.log(`  ✓ onblur with "PRAVIN PATIL" -> successfully formatted to "${simulatedInput.value}"`);

console.log('\n================================================================');
console.log('🎉 ALL AUTO-CAPITALIZATION CHECKS PASSED (100%)!');
console.log('================================================================');
