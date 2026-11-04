const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log('=== TEST: Job Card Toolbar & Blue Pin Button Removal ===\n');

const billingCode = fs.readFileSync('js/modules/billing.js', 'utf8');
const pinnedCode = fs.readFileSync('js/modules/pinned-submodules.js', 'utf8');

const elements = new Map();

function makeElement(tag, id = '') {
  return {
    tagName: tag.toUpperCase(),
    id: id,
    style: {},
    className: '',
    children: [],
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    appendChild(child) { this.children.push(child); elements.set(child.id, child); },
    remove() { elements.delete(this.id); }
  };
}

const context = {
  console,
  setTimeout: fn => fn(),
  window: {
    location: { hash: '#/job-cards' }
  },
  document: {
    getElementById(id) { return elements.get(id) || null; },
    createElement(tag) { return makeElement(tag); }
  }
};
context.window.State = {
  showModal: () => {},
  closeModal: () => {},
  showToast: () => {}
};
context.window.DB = {
  data: {
    jobCards: [{ id: 'JC-01', job_card_no: 'JC/2026/001', customer_name: 'Test', status: 'CLOSED', created_at: '2026-10-26' }],
    plants: [],
    billingEstimates: [],
    draftBills: [],
    finalBills: [],
    vehicleDeliveries: [],
    userPinnedSubmodules: []
  },
  getAll(col) { return this.data[col] || []; },
  getById(col, id) { return (this.data[col] || []).find(x => x.id === id); },
  saveData: () => {}
};

vm.createContext(context);
vm.runInContext(billingCode, context);
vm.runInContext(pinnedCode, context);

const BM = context.window.BillingModule;
const PS = context.window.PinnedSubmodulesModule;

// TEST 1: Verify Job Card toolbar has no "Today" or "All" buttons
console.log('--- TEST 1: Verify Today and All buttons removed from Job Card toolbar ---');
BM.jobCardViewMode = 'TABLE';
const jobCardHtml = BM.renderJobCardsTab();

assert(!jobCardHtml.includes('>Today</button>'), 'Toolbar must NOT contain Today button');
assert(!jobCardHtml.includes('>All</button>'), 'Toolbar must NOT contain All button');
assert(jobCardHtml.includes('id="jobcard-from-date"'), 'From date picker must remain');
assert(jobCardHtml.includes('id="jobcard-to-date"'), 'To date picker must remain');
assert(jobCardHtml.includes('+ New Job Card'), 'New Job Card button must remain');
console.log('✓ TEST 1 PASSED: "Today" and "All" buttons removed, date range pickers preserved.');

// TEST 2: Verify tabs ribbon has no billing-header-pin-container
console.log('\n--- TEST 2: Verify tabs ribbon has no billing-header-pin-container ---');
const container = { innerHTML: '' };
BM.activeTab = 'JOB_CARDS';
BM.render(container);

assert(!container.innerHTML.includes('id="billing-header-pin-container"'), 'Tabs ribbon must NOT contain billing-header-pin-container');
console.log('✓ TEST 2 PASSED: billing-header-pin-container completely removed from ribbon.');

// TEST 3: Verify PinnedSubmodulesModule suppresses Pin button on billing & job card routes
console.log('\n--- TEST 3: Verify Pin button suppression on billing routes ---');
// Simulate leftover button existing in DOM
const dummyPinBtn = makeElement('button', 'billing-header-screen-pin-btn');
elements.set('billing-header-screen-pin-btn', dummyPinBtn);
assert(context.document.getElementById('billing-header-screen-pin-btn') !== null);

context.window.location.hash = '#/job-cards';
PS.updateScreenHeaderPinButton();
assert(context.document.getElementById('billing-header-screen-pin-btn') === null, 'Leftover pin button must be removed on #/job-cards');

context.window.location.hash = '#/customer-billing';
PS.updateScreenHeaderPinButton();
assert(context.document.getElementById('billing-header-screen-pin-btn') === null, 'Pin button must not be created on #/customer-billing');

context.window.location.hash = '#/vehicle-delivery';
PS.updateScreenHeaderPinButton();
assert(context.document.getElementById('billing-header-screen-pin-btn') === null, 'Pin button must not be created on #/vehicle-delivery');

console.log('✓ TEST 3 PASSED: Pin button is fully suppressed on all Billing & Job Card routes.');

console.log('\n🎉 ALL TESTS PASSED! Job Card toolbar and blue button cleanups are verified. 🎉');
