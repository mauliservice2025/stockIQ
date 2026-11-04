// Verification for dynamic Add Button label with master name
const fs = require('fs');
const path = require('path');

global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

global.document = {
  getElementById: (id) => null
};

let openedModalTitle = '';
global.State = {
  openModal: (title) => { openedModalTitle = title; },
  closeModal: () => {},
  showToast: () => {}
};

// Load mock data and DB
eval(fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/modules/common-lookup-master.js'), 'utf8'));

const mod = window.CommonLookupMasterModule;
const container = { innerHTML: '' };

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// 1. When ALL is selected
mod.setTypeFilter('ALL');
mod.render(container);
assert(container.innerHTML.includes('+ Add Common Master'), 'When ALL is selected, button says "+ Add Common Master"');

// 2. When GENDER is selected (as requested in user screenshot)
mod.setTypeFilter('GENDER');
mod.render(container);
assert(container.innerHTML.includes('+ Add Gender'), 'When Gender is selected, button says "+ Add Gender"');

// Test modal title
mod.showAddModal();
assert(openedModalTitle === 'Add Gender', 'When Gender is selected, modal title says "Add Gender"');

// 3. When TITLE is selected
mod.setTypeFilter('TITLE');
mod.render(container);
assert(container.innerHTML.includes('+ Add Title'), 'When Title is selected, button says "+ Add Title"');

mod.showAddModal();
assert(openedModalTitle === 'Add Title', 'When Title is selected, modal title says "Add Title"');

// 4. When REFERRAL_SOURCE is selected
mod.setTypeFilter('REFERRAL_SOURCE');
mod.render(container);
assert(container.innerHTML.includes('+ Add Referral Source'), 'When Referral Source is selected, button says "+ Add Referral Source"');

// 5. When DISCOUNT_REASON is selected
mod.setTypeFilter('DISCOUNT_REASON');
mod.render(container);
assert(container.innerHTML.includes('+ Add Discount Reason'), 'When Discount Reason is selected, button says "+ Add Discount Reason"');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
