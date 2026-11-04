const fs = require('fs');

console.log('--- TEST: BillingModule Job Card Navigation & Permissions ---');

// Mock browser environment
global.window = global;
global.window.location = { hash: '#/job-cards' };
global.window.addEventListener = () => {};
global.window.dispatchEvent = () => {};
global.confirm = () => true;
global.CustomEvent = class {};
global.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; }
};

const makeElem = () => ({
  innerHTML: '',
  value: '',
  textContent: '',
  innerText: '',
  dataset: {},
  classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
  style: {
    setProperty(prop, val) { this[prop] = val; }
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  appendChild: () => {},
  setAttribute() {},
  removeAttribute() {},
  getAttribute() { return null; },
  remove() {}
});

global.document = {
  documentElement: makeElem(),
  body: makeElem(),
  createElement: () => makeElem(),
  getElementById: (id) => {
    const el = makeElem();
    el.id = id;
    return el;
  },
  querySelector: () => makeElem(),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Evaluate scripts
eval(fs.readFileSync('js/data/mock-data.js', 'utf8'));
window.INITIAL_DATA = INITIAL_DATA;
eval(fs.readFileSync('js/data/db.js', 'utf8'));
eval(fs.readFileSync('js/state.js', 'utf8'));
eval(fs.readFileSync('js/modules/billing.js', 'utf8'));

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

// 1. Check permissions in INITIAL_DATA for ROLE-ADMIN
const adminPerms = INITIAL_DATA.role_permissions
  .filter(rp => rp.role_id === 'ROLE-ADMIN')
  .map(rp => rp.permission_id);

assert(adminPerms.includes('STORE_TX_JOB_CARD_ISSUE'), 'ROLE-ADMIN has STORE_TX_JOB_CARD_ISSUE in INITIAL_DATA');
assert(adminPerms.includes('JOB_CARDS'), 'ROLE-ADMIN has JOB_CARDS in INITIAL_DATA');
assert(adminPerms.includes('BILLING_DASHBOARD'), 'ROLE-ADMIN has BILLING_DASHBOARD in INITIAL_DATA');

// 2. State hasPermission check for Admin
window.State.currentUser = {
  id: 'USR-002', // Non-USR-001 user with ROLE-ADMIN
  name: 'Admin User',
  role: 'ROLE-ADMIN',
  roles: ['ROLE-ADMIN']
};

assert(window.State.hasPermission('STORE_TX_JOB_CARD_ISSUE'), 'hasPermission(STORE_TX_JOB_CARD_ISSUE) returns true for ROLE-ADMIN');
assert(window.State.hasPermission('JOB_CARDS'), 'hasPermission(JOB_CARDS) returns true for ROLE-ADMIN');

// 3. BillingModule navigation on hash #/job-cards
window.location.hash = '#/job-cards';

// Reset activeTab to DASHBOARD to ensure render() corrects it
window.BillingModule.activeTab = 'DASHBOARD';
const html = window.BillingModule.render();

assert(window.BillingModule.activeTab === 'JOB_CARDS', 'BillingModule.activeTab is set to JOB_CARDS on #/job-cards');
assert(window.BillingModule.jobCardSubView === 'REGISTER', 'BillingModule.jobCardSubView is set to REGISTER on #/job-cards');
assert(html.includes('Job Card Management'), 'Rendered HTML contains "Job Card Management" heading');
assert(!html.includes('Connected Two-Wheeler Workshop & Billing Workflow'), 'Rendered HTML does NOT show Dashboard overview text when on #/job-cards');

// 4. Test renderActiveSubView directly
const subViewHtml = window.BillingModule.renderActiveSubView();
assert(subViewHtml.includes('Job Card Management') || subViewHtml.includes('jc-register-table') || subViewHtml.includes('New Job Card'), 'renderActiveSubView() renders job cards view');

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
