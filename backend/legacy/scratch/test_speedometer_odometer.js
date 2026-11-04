const assert = require('assert');
// Mock window and browser environment
global.window = global;
global.document = {
  getElementById: (id) => ({ style: {}, classList: { add: () => {}, remove: () => {} }, innerText: '' }),
  addEventListener: () => {}
};

// 1. Syntax check billing.js
console.log('Testing billing.js syntax...');
require('../js/modules/billing.js');
console.log('billing.js loaded successfully without syntax errors.');

const BillingModule = global.BillingModule || window.BillingModule;

// Test validateOdometerKey
console.log('Testing key events...');
let prevented = false;
const makeEvent = (key, val = '') => ({
  key,
  target: { value: val, selectionStart: val.length, selectionEnd: val.length },
  preventDefault: () => { prevented = true; },
  ctrlKey: false,
  metaKey: false
});

// Negative signs should be blocked
prevented = false;
BillingModule.validateOdometerKey(makeEvent('-'));
assert.strictEqual(prevented, true, "Negative sign '-' must be prevented");

prevented = false;
BillingModule.validateOdometerKey(makeEvent('+'));
assert.strictEqual(prevented, true, "Plus sign '+' must be prevented");

prevented = false;
BillingModule.validateOdometerKey(makeEvent('e'));
assert.strictEqual(prevented, true, "'e' must be prevented");

prevented = false;
BillingModule.validateOdometerKey(makeEvent('.'));
assert.strictEqual(prevented, true, "Decimal '.' must be prevented");

// Digits should be allowed
prevented = false;
BillingModule.validateOdometerKey(makeEvent('5'));
assert.strictEqual(prevented, false, "Digit '5' must be allowed");

console.log('All key validation assertions passed!');

// Test input capping
console.log('Testing input capping...');
const dummyFb = { style: {}, innerText: '' };
const dummyEl = {
  value: '123456',
  style: {},
  focus: () => {},
  classList: { remove: () => {}, add: () => {} }
};
global.document = {
  getElementById: (id) => (id === 'new-jc-km-feedback' ? dummyFb : null)
};

BillingModule.validateOdometerInput(dummyEl);
assert.strictEqual(dummyEl.value, '99999', 'Values > 99999 must be clamped to 99999');

dummyEl.value = '-50';
BillingModule.validateOdometerBlur(dummyEl);
assert.strictEqual(dummyEl.value, '0', 'Negative values must be clamped to 0');

console.log('All input & blur validation tests passed!');
