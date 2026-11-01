const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const mockDataContent = fs.readFileSync('js/data/mock-data.js', 'utf8');
const dbContent = fs.readFileSync('js/data/db.js', 'utf8');
const stateContent = fs.readFileSync('js/state.js', 'utf8');
const appContent = fs.readFileSync('js/app.js', 'utf8');
const authContent = fs.readFileSync('js/modules/auth.js', 'utf8');
const userMgmtContent = fs.readFileSync('js/modules/user-management.js', 'utf8');
const storeInvContent = fs.readFileSync('js/modules/store-inventory.js', 'utf8');

const mockEl = (id = '') => ({
  id,
  classList: {
    classes: new Set(),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); },
    toggle(c, force) {
      if (force !== undefined) {
        if (force) this.classes.add(c); else this.classes.delete(c);
        return force;
      }
      if (this.classes.has(c)) { this.classes.delete(c); return false; }
      this.classes.add(c); return true;
    },
    contains(c) { return this.classes.has(c); }
  },
  setAttribute: () => {},
  getAttribute: () => null,
  hasAttribute: () => false,
  removeAttribute: () => {},
  style: {},
  innerHTML: '',
  innerText: '',
  value: '',
  querySelectorAll: () => [],
  querySelector: () => null,
  focus: () => {},
  blur: () => {},
  select: () => {},
  closest: () => null,
  appendChild: () => {},
  contains: () => true
});

const elements = {};
function getOrCreateEl(id) {
  if (!elements[id]) elements[id] = mockEl(id);
  return elements[id];
}

const sandbox = {
  window: {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: class { constructor(t, d) { this.type = t; this.detail = d; } },
  Event: class { constructor(t) { this.type = t; } },
  location: { hash: '#/login' },
  localStorage: {
    data: { 'ISCM_LOGGED_IN': 'false', 'ISCM_CURRENT_USER_ID': 'USR-106' },
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; }
  },
  console: console,
  document: {
    addEventListener: () => {},
    documentElement: { setAttribute: () => {}, getAttribute: () => {} },
    getElementById: (id) => getOrCreateEl(id),
    querySelector: () => mockEl(),
    querySelectorAll: () => [],
    createElement: () => mockEl()
  },
  scrollTo: () => {},
  setTimeout: (fn) => fn(),
  clearTimeout: () => {}
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(storeInvContent, sandbox);
vm.runInContext(userMgmtContent, sandbox);
vm.runInContext(authContent, sandbox);
vm.runInContext(appContent, sandbox);

const State = sandbox.window.State;
const App = sandbox.window.App;
const DB = sandbox.window.DB;

console.log('--- TEST 1: Sagar Sable Login ---');
State.login('USR-106', 'PLANT-01');
const user = State.getCurrentUser();
console.log('Logged in user:', user.full_name, 'Role:', user.primary_role);
assert.strictEqual(user.primary_role, 'ROLE-STORE-EXEC');
assert.strictEqual(State.isLoggedIn, true);

const firstRoute = App.getFirstAuthorizedRoute();
console.log('First authorized route for Sagar:', firstRoute);
assert.strictEqual(firstRoute, '#/store-inventory');

sandbox.location.hash = firstRoute;
App.handleRoute();
console.log('Successfully routed to #/store-inventory without errors');

console.log('\n--- TEST 2: Sagar Sable Sign Out via Confirmation Modal ---');
App.handleSignOut();
assert.strictEqual(getOrCreateEl('global-modal-overlay').classList.contains('active'), true);
console.log('Modal opened with title:', getOrCreateEl('global-modal-title').innerHTML);

App.performSignOut();
console.log('performSignOut executed');
assert.strictEqual(State.isLoggedIn, false);
assert.strictEqual(sandbox.localStorage.getItem('ISCM_LOGGED_IN'), 'false');
assert.strictEqual(sandbox.location.hash, '#/login');
assert.strictEqual(getOrCreateEl('global-modal-overlay').classList.contains('active'), false);
console.log('State.isLoggedIn is false, hash is #/login, modal is closed.');

console.log('\n--- TEST 3: Zero-Permission User Fallback & Logout ---');
// Create a temporary user with zero permissions
const zeroUser = {
  id: 'USR-ZERO',
  username: 'ZERO',
  full_name: 'Zero Perm User',
  primary_role: 'ROLE-NONEXISTENT',
  status: 'ACTIVE'
};
DB.upsert('users', zeroUser);
State.login('USR-ZERO', 'PLANT-01');

const viewContainer = getOrCreateEl('view-container');
sandbox.location.hash = '#/dashboard';
App.handleRoute();
console.log('Zero perm user view-container HTML preview:', viewContainer.innerHTML.substring(0, 150));
assert(viewContainer.innerHTML.includes('No Accessible Modules'), 'Must display No Accessible Modules banner');
assert(viewContainer.innerHTML.includes('Logout'), 'Must contain Logout button');

// Click logout from banner
App.performSignOut();
assert.strictEqual(State.isLoggedIn, false);
assert.strictEqual(sandbox.location.hash, '#/login');
console.log('Successfully logged out from zero-permission state.');

console.log('\n--- ALL LOGOUT AND RBAC TESTS PASSED SUCCESSFULLY! ---');
