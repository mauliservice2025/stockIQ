const fs = require('fs');
const assert = require('assert');

let modal = null;
global.window = {
  State: { showModal: (m) => { modal = m; }, closeModal: () => {}, showToast: () => {} },
  DB: { insert: () => {}, logAudit: () => {}, getAll: () => [] }
};

eval(fs.readFileSync('js/modules/masters.js', 'utf8'));

console.log('--- TESTING VENDOR ONBOARDING MODAL ---');
window.MastersModule.showAddSupplierModal();

console.log('Modal title:', modal.title);
assert(!modal.title.includes('➕'), 'Title should not contain ➕');

const emojis = ['🏢', '👤', '💳', '⭐', '💾', '➕'];
const foundEmojis = emojis.filter(e => modal.title.includes(e) || modal.contentHtml.includes(e));
console.log('Found emojis in vendor modal:', foundEmojis);
assert.strictEqual(foundEmojis.length, 0, 'No emojis should be present in modal');

const prefilled = [
  'P. R. Shinde',
  '9822011002',
  'sales@bharatforge.com',
  'Pune',
  'Maharashtra',
  'Plot No. 12',
  '411026'
].filter(v => modal.contentHtml.includes('value="' + v + '"'));
console.log('Prefilled values in vendor inputs:', prefilled);
assert.strictEqual(prefilled.length, 0, 'All inputs should be default blank');

const emailMandatory = modal.contentHtml.includes('Email Address <span class="required"') || modal.contentHtml.includes('id="new-sup-email" class="form-control" required');
console.log('Is vendor email mandatory:', emailMandatory);
assert.strictEqual(emailMandatory, false, 'Email address must not be mandatory');

console.log('\n--- VERIFYING CUSTOMER MODAL REMOVAL ---');
assert.strictEqual(typeof window.MastersModule.showAddCustomerModal, 'undefined', 'showAddCustomerModal must be removed');
console.log('✔ showAddCustomerModal has been completely removed.');

console.log('\nALL MODAL CLEANUP VERIFICATIONS PASSED! ✔');
