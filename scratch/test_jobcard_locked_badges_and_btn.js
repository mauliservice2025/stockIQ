const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing Job Card Locked Badges Removal and Update Customer Info Button Lifecycle...');

// Setup minimal DOM simulation
class MockElement {
  constructor(tagName, id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.value = '';
    this.innerHTML = '';
    this.innerText = '';
    this.disabled = false;
    this.readOnly = false;
    this.options = [];
  }
  setAttribute(k, v) { this.attributes[k] = v; if (k === 'disabled') this.disabled = true; }
  removeAttribute(k) { delete this.attributes[k]; if (k === 'disabled') this.disabled = false; }
  getAttribute(k) { return this.attributes[k]; }
  focus() {}
  blur() {}
  remove() {}
}

const elements = new Map();
const documentMock = {
  getElementById(id) {
    return elements.get(id) || null;
  },
  createElement(tag) {
    return new MockElement(tag);
  },
  body: {
    appendChild() {},
    removeChild() {}
  }
};

global.document = documentMock;
global.window = {
  document: documentMock,
  State: {
    showModal(opts) {
      window._lastModal = opts;
    },
    closeModal() {},
    showToast() {},
    currentPlantId: 'PLANT-01'
  },
  DB: {
    getAll(table) {
      if (table === 'customers') {
        return [
          { id: 'CUST-1', cin_number: 'CIN/MSC/2026/000038', name: 'Pravin S Patil', mobile: '9838462423' }
        ];
      }
      if (table === 'vehicles') {
        return [
          { id: 'VEH-1', vehicle_reg_no: 'MH 12 AC 4335', customer_mobile: '9838462423', customer_name: 'Pravin S Patil', model_name: 'Bajaj Pulsar NS160' }
        ];
      }
      if (table === 'jobCards') {
        return [
          { id: 'JC-1', job_card_no: 'JC/MSC1/2026/0042', vehicle_reg_no: 'MH 12 AC 4335', customer_mobile: '9838462423', customer_name: 'Pravin S Patil', status: 'CLOSED' }
        ];
      }
      return [];
    },
    normalizeVehicleReg(v) {
      return String(v || '').replace(/\s+/g, '').toUpperCase();
    },
    getActivePlants() {
      return [{ id: 'PLANT-01', name: 'Mauli Service Center - I' }];
    }
  }
};

// Read billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// Quick syntax check / evaluation
try {
  eval(billingCode);
} catch (e) {
  console.error('Syntax/eval error in billing.js:', e);
  process.exit(1);
}

const BM = window.BillingModule;
assert(BM, 'BillingModule must be defined');

// Test 1: Verify modal HTML doesn't contain the removed badges & lightning button
BM.showNewJobCardModal();
assert(window._lastModal, 'Modal should have opened');

const contentHtml = window._lastModal.contentHtml;
const footerHtml = window._lastModal.footerHtml;

assert(!contentHtml.includes('id="new-jc-model-locked-badge"'), 'new-jc-model-locked-badge must NOT exist in modal HTML');
assert(!contentHtml.includes('id="new-jc-name-locked-badge"'), 'new-jc-name-locked-badge must NOT exist in modal HTML');
assert(!contentHtml.includes('id="new-jc-mobile-locked-badge"'), 'new-jc-mobile-locked-badge must NOT exist in modal HTML');
assert(!contentHtml.includes('id="new-jc-cin-btn"'), 'new-jc-cin-btn must NOT exist in modal HTML');
console.log('✓ Test 1 Passed: 4 badges/labels successfully removed from Job Card modal markup');

// Test 2: Check footer button is disabled by default
assert(footerHtml.includes('id="btn-update-customer-info"'), 'btn-update-customer-info must exist in footerHtml');
assert(footerHtml.includes('disabled'), 'btn-update-customer-info must have disabled attribute initially in footerHtml');
assert(footerHtml.includes('cursor: not-allowed'), 'btn-update-customer-info must have cursor: not-allowed initially');
assert(footerHtml.includes('opacity: 0.5'), 'btn-update-customer-info must have opacity: 0.5 initially');
console.log('✓ Test 2 Passed: btn-update-customer-info is disabled in default / initial state');

// Test 3: Test setReturningVehicleLock enabling and disabling
const btnUpdate = new MockElement('button', 'btn-update-customer-info');
btnUpdate.disabled = true;
btnUpdate.style.opacity = '0.5';
btnUpdate.style.cursor = 'not-allowed';
elements.set('btn-update-customer-info', btnUpdate);

const modelSearch = new MockElement('input', 'new-jc-model-search');
elements.set('new-jc-model-search', modelSearch);

const nameEl = new MockElement('input', 'new-jc-customer');
elements.set('new-jc-customer', nameEl);

const mobEl = new MockElement('input', 'new-jc-mobile');
elements.set('new-jc-mobile', mobEl);

// Call setReturningVehicleLock(true) -> existing customer / vehicle details entered
BM.setReturningVehicleLock(true, { model: 'Bajaj Pulsar NS160', name: 'Pravin S Patil', mobile: '9838462423' });
assert.strictEqual(btnUpdate.disabled, false, 'btn-update-customer-info must be ENABLED for returning/existing vehicle');
assert.strictEqual(btnUpdate.style.cursor, 'pointer', 'btn-update-customer-info cursor should be pointer');
assert.strictEqual(btnUpdate.style.opacity, '1', 'btn-update-customer-info opacity should be 1');
console.log('✓ Test 3 Passed: setReturningVehicleLock(true) successfully enables btn-update-customer-info');

// Call setReturningVehicleLock(false) -> new customer / vehicle reset
BM.setReturningVehicleLock(false);
assert.strictEqual(btnUpdate.disabled, true, 'btn-update-customer-info must be DISABLED for new customer / vehicle');
assert.strictEqual(btnUpdate.style.cursor, 'not-allowed', 'btn-update-customer-info cursor should be not-allowed');
assert.strictEqual(btnUpdate.style.opacity, '0.5', 'btn-update-customer-info opacity should be 0.5');
console.log('✓ Test 4 Passed: setReturningVehicleLock(false) successfully disables btn-update-customer-info');

// Test 5: onCustomerMobileInput with existing customer mobile
const cinInput = new MockElement('input', 'new-jc-cin');
elements.set('new-jc-cin', cinInput);
const cinBadge = new MockElement('span', 'new-jc-cin-badge');
elements.set('new-jc-cin-badge', cinBadge);

const mobileInput = new MockElement('input', 'new-jc-mobile');
mobileInput.value = '9838462423';
elements.set('new-jc-mobile', mobileInput);

BM.onCustomerMobileInput(mobileInput);
assert.strictEqual(btnUpdate.disabled, false, 'btn-update-customer-info must be enabled when existing customer mobile is typed');
console.log('✓ Test 5 Passed: onCustomerMobileInput enables btn-update-customer-info for existing customer');

// Test 6: onCustomerMobileInput with unknown mobile
mobileInput.value = '9999999999';
BM.onCustomerMobileInput(mobileInput);
assert.strictEqual(btnUpdate.disabled, true, 'btn-update-customer-info must be disabled when unknown new customer mobile is typed');
console.log('✓ Test 6 Passed: onCustomerMobileInput disables btn-update-customer-info for new customer');

// Test 7: updateCustomerInformationOnly is no-op if button is disabled
btnUpdate.disabled = true;
let modalOpened = false;
BM.showUpdateCustomerDetailsModal = () => { modalOpened = true; };
BM.updateCustomerInformationOnly();
assert.strictEqual(modalOpened, false, 'updateCustomerInformationOnly should NOT open modal when button is disabled');
console.log('✓ Test 7 Passed: updateCustomerInformationOnly respects disabled state');

// Test 8: Verify blurred / dimmed styling and no toasts on clicking locked inputs
let toastMessages = [];
window.State.showToast = (msg, type) => {
  toastMessages.push({ msg, type });
};

// Re-lock
BM.setReturningVehicleLock(true, { model: 'Bajaj Pulsar NS160', name: 'Pravin S Patil', mobile: '9838462423' });
assert.strictEqual(modelSearch.style.pointerEvents, 'none', 'modelSearch pointerEvents should be none');
assert.strictEqual(modelSearch.style.opacity, '0.65', 'modelSearch opacity should be 0.65');
assert.strictEqual(nameEl.style.pointerEvents, 'none', 'nameEl pointerEvents should be none');
assert.strictEqual(nameEl.style.opacity, '0.65', 'nameEl opacity should be 0.65');
const currentMobEl = document.getElementById('new-jc-mobile');
assert.strictEqual(currentMobEl.style.pointerEvents, 'none', 'mobEl pointerEvents should be none');
assert.strictEqual(currentMobEl.style.opacity, '0.65', 'mobEl opacity should be 0.65');
console.log('✓ Test 8 Passed: Existing vehicle locks blur / dim vehicle model, customer name, and customer mobile');

// Test 9: Verify no error/toast messages are emitted on clicking or searching locked fields
toastMessages = [];
BM.onCustomerFieldClick(modelSearch, 'model');
BM.onCustomerFieldClick(nameEl, 'name');
BM.onCustomerFieldClick(mobEl, 'mobile');
BM.onVehicleModelSearch('activa');
BM.toggleVehicleModelDropdown();

assert.strictEqual(toastMessages.length, 0, 'No error/toast messages should be shown on clicking locked fields');
console.log('✓ Test 9 Passed: Zero error/toast messages shown on clicking or interacting with locked fields');

console.log('\nAll tests passed successfully!');
