const path = require('path');
const assert = require('assert');

// 1. Mock browser globals
global.window = global;
global.window.location = { hash: '#/suppliers' };
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

let lastToast = null;
let lastModal = null;
window.State = {
  showToast(msg, type) {
    lastToast = { msg, type };
  },
  showModal(opts) {
    lastModal = opts;
  },
  closeModal() {
    lastModal = null;
  }
};

const domElements = {};
global.document = {
  body: {
    appendChild(el) {
      domElements[el.id] = el;
    }
  },
  createElement(tag) {
    return {
      tagName: tag,
      id: '',
      style: {},
      innerHTML: '',
      remove() {
        if (this.id && domElements[this.id]) {
          delete domElements[this.id];
        }
      }
    };
  },
  getElementById(id) {
    if (domElements[id]) return domElements[id];
    return {
      id,
      value: '',
      style: {},
      classList: {
        add() {},
        remove() {}
      },
      dataset: {},
      innerHTML: '',
      focus() {}
    };
  }
};

// 2. Load dependencies
require(path.join(__dirname, '../js/data/mock-data.js'));
require(path.join(__dirname, '../js/data/db.js'));
require(path.join(__dirname, '../js/modules/billing.js'));
require(path.join(__dirname, '../js/modules/masters.js'));

console.log('=== TEST SUITE: VENDOR CODE UNIQUENESS & ADDRESS MASTER INTEGRATION ===\n');

// -----------------------------------------------------------------------------
// Test 1: Vendor Code Uniqueness Validation
// -----------------------------------------------------------------------------
console.log('Test 1: Vendor Code Uniqueness Validation...');

// Insert an existing supplier with code "001"
window.DB.insert('suppliers', {
  id: '001',
  code: '001',
  name: 'Uttam Supplier',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411026'
});

const codeInput = {
  id: 'new-sup-code',
  value: '001',
  style: {},
  classList: {
    classes: new Set(),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); }
  },
  focus() {}
};
const codeFeedback = {
  id: 'new-sup-code-feedback',
  style: {},
  innerHTML: ''
};
domElements['new-sup-code'] = codeInput;
domElements['new-sup-code-feedback'] = codeFeedback;

// 1.1 Real-time check on duplicate code "001"
const isUnique1 = window.MastersModule.checkVendorCodeUnique('001');
assert.strictEqual(isUnique1, false, 'Duplicate vendor code "001" must return false');
assert(codeInput.style.borderColor.includes('ef4444'), 'Duplicate input border must be colored red');
assert(codeFeedback.innerHTML.includes('Duplicate Vendor Code'), 'Warning text must mention duplicate vendor code');
console.log('  ✓ Real-time duplicate check detects existing code "001" and renders danger warning.');

// 1.2 Real-time check on unique code "VEND-999"
const isUnique2 = window.MastersModule.checkVendorCodeUnique('VEND-999');
assert.strictEqual(isUnique2, true, 'Unique vendor code "VEND-999" must return true');
assert(codeInput.style.borderColor.includes('10b981'), 'Unique input border must be colored green');
assert(codeFeedback.innerHTML.includes('is unique and available'), 'Success text must show vendor code is available');
console.log('  ✓ Real-time unique check accepts available code and indicates success.');

// 1.3 Form submission prevention on duplicate code
const initialCount = (window.DB.getAll('suppliers') || []).length;
codeInput.value = '001';
const nameInput = { id: 'new-sup-name', value: 'Another Duplicate Vendor' };
domElements['new-sup-name'] = nameInput;

window.MastersModule.submitNewSupplier({ preventDefault: () => {} });
assert.strictEqual((window.DB.getAll('suppliers') || []).length, initialCount, 'Supplier count must not increase on duplicate code');
assert(lastToast && lastToast.type === 'danger', 'Danger toast must be shown on duplicate submission');
assert(lastToast.msg.includes('already exists'), 'Toast message must state vendor code already exists');
console.log('  ✓ Form submit blocks insertion of duplicate code "001" with danger notification.');

// -----------------------------------------------------------------------------
// Test 2: Address Master Lookups (City, State, PIN)
// -----------------------------------------------------------------------------
console.log('\nTest 2: Address Master Lookups (City, State, PIN)...');

// 2.1 Lookup by Pincode: 411026 (Bhosari / Walhekarwadi / PCMC)
const addr411026 = window.MastersModule.getAddressFromMaster({ pincode: '411026' });
assert(addr411026, 'Must find address for 411026');
assert(addr411026.city.includes('Pimpri') || addr411026.city.includes('Pune'), `City should resolve for 411026, got: ${addr411026.city}`);
assert.strictEqual(addr411026.state, 'Maharashtra', 'State should be Maharashtra');
console.log(`  ✓ PIN 411026 resolved to City: "${addr411026.city}", State: "${addr411026.state}".`);

// 2.2 Lookup by Pincode: 422001 (Nashik)
const addr422001 = window.MastersModule.getAddressFromMaster({ pincode: '422001' });
assert(addr422001, 'Must find address for 422001');
assert.strictEqual(addr422001.city, 'Nashik', 'City should be Nashik');
assert.strictEqual(addr422001.state, 'Maharashtra', 'State should be Maharashtra');
console.log(`  ✓ PIN 422001 resolved to City: "${addr422001.city}", State: "${addr422001.state}".`);

// 2.3 Lookup by City: Pune
const addrPune = window.MastersModule.getAddressFromMaster({ city: 'Pune' });
assert(addrPune, 'Must find address for city Pune');
assert.strictEqual(addrPune.state, 'Maharashtra', 'State for Pune should be Maharashtra');
assert(addrPune.pincode && addrPune.pincode.startsWith('411'), `PIN for Pune should start with 411, got: ${addrPune.pincode}`);
console.log(`  ✓ City "Pune" resolved to State: "${addrPune.state}", PIN: "${addrPune.pincode}".`);

// 2.4 Lookup by Area: Walhekarwadi
const addrWalhekarwadi = window.MastersModule.getAddressFromMaster({ city: 'Walhekarwadi' });
assert(addrWalhekarwadi, 'Must find address for Walhekarwadi');
assert.strictEqual(addrWalhekarwadi.state, 'Maharashtra');
console.log(`  ✓ Area "Walhekarwadi" resolved to City: "${addrWalhekarwadi.city}", State: "${addrWalhekarwadi.state}", PIN: "${addrWalhekarwadi.pincode}".`);

// -----------------------------------------------------------------------------
// Test 3: Autofill Handlers in Onboard Supplier Form
// -----------------------------------------------------------------------------
console.log('\nTest 3: Autofill Handlers in Onboard Supplier Form...');

const cityField = { id: 'new-sup-city', value: '', dataset: {} };
const stateField = { id: 'new-sup-state', value: '', dataset: {} };
const pinField = { id: 'new-sup-pincode', value: '', dataset: {} };
const feedbackEl = { id: 'new-sup-address-feedback', style: {}, innerHTML: '' };

domElements['new-sup-city'] = cityField;
domElements['new-sup-state'] = stateField;
domElements['new-sup-pincode'] = pinField;
domElements['new-sup-address-feedback'] = feedbackEl;

// 3.1 Enter 411026 into PIN field
window.MastersModule.lookupAddressByPin('411026', 'new');
assert(cityField.value.length > 0, 'City field should be auto-populated');
assert.strictEqual(stateField.value, 'Maharashtra', 'State field should be auto-populated with Maharashtra');
assert(feedbackEl.innerHTML.includes('Fetched from Address Master'), 'Feedback banner must indicate Address Master fetch');
console.log(`  ✓ lookupAddressByPin('411026') autofilled City: "${cityField.value}", State: "${stateField.value}".`);

// 3.2 Enter Nashik into City field
cityField.value = 'Nashik';
stateField.value = '';
pinField.value = '';
window.MastersModule.lookupAddressByCity('Nashik', 'new');
assert.strictEqual(stateField.value, 'Maharashtra', 'State field should be auto-populated');
assert.strictEqual(pinField.value, '422001', 'PIN field should be auto-populated with Nashik PIN 422001');
console.log(`  ✓ lookupAddressByCity('Nashik') autofilled State: "${stateField.value}", PIN: "${pinField.value}".`);

// -----------------------------------------------------------------------------
// Test 4: Address Master Modal Picker & Selection
// -----------------------------------------------------------------------------
console.log('\nTest 4: Address Master Modal Picker & Selection...');

window.MastersModule.openAddressMasterModal('new');
assert(domElements['address-master-picker-overlay'], 'Modal overlay element should be attached to document');
assert(domElements['address-master-picker-overlay'].innerHTML.includes('Address Master Location Picker'), 'Picker title should render');

// Select an item from picker
window.MastersModule.selectAddressFromPicker('411026', 'Pimpri-Chinchwad', 'Maharashtra', 'new');
assert.strictEqual(cityField.value, 'Pimpri-Chinchwad');
assert.strictEqual(stateField.value, 'Maharashtra');
assert.strictEqual(pinField.value, '411026');
assert(!domElements['address-master-picker-overlay'], 'Overlay should be removed after selection');
console.log('  ✓ Address Master Picker allows searching and populates City, State, PIN seamlessly.');

// -----------------------------------------------------------------------------
// Test 5: Successful Supplier Insertion with Unique Code & Master Address
// -----------------------------------------------------------------------------
console.log('\nTest 5: Onboarding Supplier with Unique Code & Master Address...');

codeInput.value = 'VEND-UNIQUE-01';
nameInput.value = 'Apex Precision Tech Ltd.';
domElements['new-sup-cat'] = { value: 'OEM_COMPONENTS' };
domElements['new-sup-contact'] = { value: 'Mr. Rajesh Patil' };
domElements['new-sup-phone'] = { value: '9822019999' };
domElements['new-sup-address'] = { value: 'Walhekarwadi Industrial Estate' };
cityField.value = 'Pimpri-Chinchwad';
stateField.value = 'Maharashtra';
pinField.value = '411026';

window.MastersModule.submitNewSupplier({ preventDefault: () => {} });
const created = window.DB.getById('suppliers', 'VEND-UNIQUE-01');
assert(created, 'Supplier VEND-UNIQUE-01 must exist in DB');
assert.strictEqual(created.city, 'Pimpri-Chinchwad');
assert.strictEqual(created.state, 'Maharashtra');
assert.strictEqual(created.pincode, '411026');
assert(lastToast.msg.includes('Apex Precision Tech Ltd. onboarded!'), 'Success toast displayed');
console.log('  ✓ Vendor onboarded successfully with unique code and Address Master details!');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY (100%)!');
