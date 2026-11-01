const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING SUPER ADMIN RBAC RESTRICTIONS SUITE ===\n');

// 1. Setup mock browser environment
global.window = global;
global.window.location = { hash: '#/security-dashboard' };
global.window.addEventListener = () => {};
global.window.dispatchEvent = () => {};
global.CustomEvent = class CustomEvent {
  constructor(type, params) {
    this.type = type;
    this.detail = params ? params.detail : null;
  }
};
global.localStorage = {
  _store: {},
  getItem: (k) => global.localStorage._store[k] || null,
  setItem: (k, v) => { global.localStorage._store[k] = String(v); },
  removeItem: (k) => { delete global.localStorage._store[k]; },
  clear: () => { global.localStorage._store = {}; }
};

const makeElem = () => ({
  innerHTML: '',
  value: '',
  textContent: '',
  innerText: '',
  focus: () => {},
  classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
  style: {},
  addEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => null,
  setAttribute: () => {},
  removeAttribute: () => {},
  getAttribute: () => null,
  remove: () => {},
  appendChild: () => {}
});

global.document = {
  documentElement: makeElem(),
  body: makeElem(),
  getElementById: (id) => makeElem(),
  querySelector: () => makeElem(),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => makeElem()
};

// 2. Load mock-data, DB, State, App, and UserManagementModule
eval(fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8'));
window.INITIAL_DATA = INITIAL_DATA;

eval(fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'));

eval(fs.readFileSync(path.join(__dirname, '../js/modules/user-management.js'), 'utf8'));

console.log('✓ Successfully loaded all modules into runtime.');

// TEST 1: Verify ROLE-001 exists in DB
const roles = window.DB.getAll('roles');
const role001 = roles.find(r => r.id === 'ROLE-001' || r.code === '001');
assert(role001, 'ROLE-001 (Super Admin) must exist in DB roles');
console.log('✓ TEST 1 PASSED: Found role ROLE-001 (' + role001.name + ') in DB.');

// TEST 2: Verify USR-111 (Sanket Borole) has primary_role ROLE-001
const users = window.DB.getAll('users');
const sanket = users.find(u => u.id === 'USR-111' || u.username === 'SANKETB');
assert(sanket, 'USR-111 (Sanket Borole) must exist in DB users');
assert.strictEqual(sanket.primary_role, 'ROLE-001', 'USR-111 primary_role must be ROLE-001');
console.log('✓ TEST 2 PASSED: USR-111 (Sanket Borole) is assigned primary_role: ' + sanket.primary_role);

// TEST 3: Switch current user to Sanket Borole
window.State.login(sanket.id);
const currentUser = window.State.getCurrentUser();
assert.strictEqual(currentUser.id, 'USR-111');
console.log('✓ TEST 3 PASSED: Current logged in user is ' + currentUser.full_name + ' (' + currentUser.primary_role + ')');

// TEST 4: Validate permissions configured for ROLE-001
// Expected granted: SEC_DASHBOARD (view: true), USER_MASTER (view: true), BILLING_DASHBOARD (view: true)
const canSecDash = window.State.hasPermission('SEC_DASHBOARD', 'VIEW');
const canUserMaster = window.State.hasPermission('USER_MASTER', 'VIEW');
const canBillingDash = window.State.hasPermission('BILLING_DASHBOARD', 'VIEW');
assert(canSecDash, 'Sanket Borole should be granted VIEW on SEC_DASHBOARD');
assert(canUserMaster, 'Sanket Borole should be granted VIEW on USER_MASTER');
assert(canBillingDash, 'Sanket Borole should be granted VIEW on BILLING_DASHBOARD');
console.log('✓ TEST 4 PASSED: Permitted screens SEC_DASHBOARD, USER_MASTER, and BILLING_DASHBOARD returned true.');

// TEST 5: Validate UNCONFIGURED / UNGRANTED permissions are strictly denied
const ungrantedModules = [
  { code: 'ROLE_MASTER', name: 'Role Master' },
  { code: 'PERMISSIONS', name: 'Permission Matrix' },
  { code: 'INVENTORY', name: 'Inventory & Stock' },
  { code: 'STORE_MASTER', name: 'Store Master' },
  { code: 'ORDERS', name: 'Purchase Orders' },
  { code: 'REQUISITIONS', name: 'Requisitions' },
  { code: 'GRN', name: 'Goods Receipt Note' },
  { code: 'ORG_MASTER', name: 'Organization Master' },
  { code: 'COMMON_MASTER', name: 'Common Master' },
  { code: 'REPORTS', name: 'Reports & Audits' }
];

for (const m of ungrantedModules) {
  const hasPerm = window.State.hasPermission(m.code, 'VIEW');
  assert(!hasPerm, 'Sanket Borole must NOT have access to unconfigured module: ' + m.code + ' (' + m.name + ')');
}
console.log('✓ TEST 5 PASSED: All 10 unconfigured modules are strictly denied access.');

// TEST 6: Route-level access checks via window.App.canAccessRoute
const permittedRoutes = ['#/security-dashboard', '#/users', '#/billing-dashboard', '#/job-cards'];
for (const r of permittedRoutes) {
  assert(window.App.canAccessRoute(r), 'canAccessRoute must return true for permitted route: ' + r);
}
const deniedRoutes = [
  '#/roles',
  '#/permissions',
  '#/inventory',
  '#/orders',
  '#/requisitions',
  '#/grn',
  '#/store-master',
  '#/organizations',
  '#/reports'
];
for (const r of deniedRoutes) {
  assert(!window.App.canAccessRoute(r), 'canAccessRoute must return false for unpermitted route: ' + r);
}
console.log('✓ TEST 6 PASSED: canAccessRoute accurately permits only authorized routes and blocks ungranted routes.');

// TEST 7: Test first authorized route resolution
const firstRoute = window.App.getFirstAuthorizedRoute();
assert(firstRoute === '#/billing-dashboard' || firstRoute === '#/security-dashboard' || firstRoute === '#/users', 'getFirstAuthorizedRoute should resolve to an authorized route');
console.log('✓ TEST 7 PASSED: getFirstAuthorizedRoute resolved to ' + firstRoute);

// TEST 8: Test Action-level permission enforcement (View vs Delete vs Approve)
const rolePerms = window.DB.getAll('role_permissions');
const secDashEntry = rolePerms.find(rp => rp.role_id === 'ROLE-001' && rp.perm_code === 'SEC_DASHBOARD');
// Turn off DELETE for SEC_DASHBOARD
secDashEntry.delete = false;
window.DB.saveData();

const canViewSec = window.State.hasPermission('SEC_DASHBOARD', 'VIEW');
const canDeleteSec = window.State.hasPermission('SEC_DASHBOARD', 'DELETE');
assert(canViewSec, 'View permission must remain true');
assert(!canDeleteSec, 'Action-level check failed: DELETE should be false');
console.log('✓ TEST 8 PASSED: Action-level enforcement validated (VIEW=true, DELETE=false).');

// TEST 9: Test dynamic permission update from UI matrix
// Grant INVENTORY to ROLE-001 via updatePermCheckbox
let filterCalled = false;
window.App.filterSidebarByPermissions = () => { filterCalled = true; };
window.UserManagementModule.updatePermCheckbox('ROLE-001', 'INVENTORY', 'view', true);

assert(filterCalled, 'filterSidebarByPermissions must be invoked after updating permission checkbox');
const canNowAccessInventory = window.App.canAccessRoute('#/inventory');
assert(canNowAccessInventory, 'canAccessRoute must immediately grant access to #/inventory after matrix update');
console.log('✓ TEST 9 PASSED: Permission changes dynamically update access and trigger sidebar refresh.');

// TEST 10: Verify Developer / Root Fallback account (USR-001 Pravin Patil) retains universal access
const rootUser = users.find(u => u.id === 'USR-001');
window.State.login(rootUser.id);
const rootCanAccessInventory = window.App.canAccessRoute('#/inventory');
const rootCanAccessSec = window.App.canAccessRoute('#/security-dashboard');
const rootCanAccessRoles = window.App.canAccessRoute('#/roles');
assert(rootCanAccessInventory && rootCanAccessSec && rootCanAccessRoles, 'Root developer USR-001 must have universal access');
console.log('✓ TEST 10 PASSED: Developer root owner USR-001 maintains universal fallback access.');

// TEST 11: Direct DOM test of filterSidebarByPermissions for Sanket Borole
window.State.login(sanket.id);

function createMockElement(tag, attrs = {}) {
  const el = {
    tagName: tag.toUpperCase(),
    style: {},
    attributes: { ...attrs },
    classList: {
      _classes: new Set(),
      add: (c) => el.classList._classes.add(c),
      remove: (c) => el.classList._classes.delete(c),
      contains: (c) => el.classList._classes.has(c)
    },
    setAttribute: (k, v) => { el.attributes[k] = String(v); },
    removeAttribute: (k) => { delete el.attributes[k]; },
    getAttribute: (k) => el.attributes[k] !== undefined ? el.attributes[k] : null,
    querySelectorAll: (selector) => {
      // Basic selector matching for sidebar
      const results = [];
      function recurse(node) {
        for (const child of node.children || []) {
          let match = false;
          if (selector.includes('.module-group') && child.attributes.class && child.attributes.class.includes('module-group')) match = true;
          if (selector.includes('a.nav-item') && child.tagName === 'A') match = true;
          if (selector.includes('a.sub-nav-item') && child.tagName === 'A') match = true;
          if (selector.includes('.module-sub-menu > div') && child.tagName === 'DIV') match = true;
          if (match && !results.includes(child)) results.push(child);
          recurse(child);
        }
      }
      recurse(el);
      return results;
    },
    children: []
  };
  return el;
}

const mockSidebar = createMockElement('aside', { id: 'app-sidebar' });

// 1. Dashboard standalone link
const dashLink = createMockElement('a', { class: 'nav-item', href: '#/dashboard' });
mockSidebar.children.push(dashLink);

// 2. Procurement module group (all unpermitted)
const procGroup = createMockElement('div', { class: 'module-group', id: 'group-procurement' });
const subMenuProc = createMockElement('div', { class: 'module-sub-menu' });
const reqLink = createMockElement('a', { class: 'sub-nav-item', href: '#/requisitions' });
const poLink = createMockElement('a', { class: 'sub-nav-item', href: '#/orders' });
subMenuProc.children.push(reqLink, poLink);
procGroup.children.push(subMenuProc);
mockSidebar.children.push(procGroup);

// 3. User Roles & Security module group (has permitted items)
const secGroup = createMockElement('div', { class: 'module-group', id: 'group-security' });
const subMenuSec = createMockElement('div', { class: 'module-sub-menu' });
const secDashLink = createMockElement('a', { class: 'sub-nav-item', href: '#/security-dashboard' });
const usersLink = createMockElement('a', { class: 'sub-nav-item', href: '#/users' });
const rolesLink = createMockElement('a', { class: 'sub-nav-item', href: '#/roles' });
subMenuSec.children.push(secDashLink, usersLink, rolesLink);
secGroup.children.push(subMenuSec);
mockSidebar.children.push(secGroup);

global.document.getElementById = (id) => id === 'app-sidebar' ? mockSidebar : null;

// Re-bind original filterSidebarByPermissions
window.App.filterSidebarByPermissions = window.App.constructor.prototype.filterSidebarByPermissions.bind(window.App);
window.App.filterSidebarByPermissions();

// Check assertions:
// Dashboard should be hidden
assert.strictEqual(dashLink.style.display, 'none', 'Dashboard link should be hidden for Sanket');
// Procurement group should be completely hidden
assert.strictEqual(procGroup.style.display, 'none', 'Procurement module group should be hidden for Sanket');
// User Roles & Security group should be VISIBLE
assert.strictEqual(secGroup.style.display, '', 'User Roles & Security module group should be visible for Sanket');
// Security Dashboard and Users links should be visible
assert.strictEqual(secDashLink.style.display, '', 'Security Dashboard sub-item should be visible');
assert.strictEqual(usersLink.style.display, '', 'User Master sub-item should be visible');
// Roles link should be hidden
assert.strictEqual(rolesLink.style.display, 'none', 'Roles sub-item should be hidden');

console.log('✓ TEST 11 PASSED: DOM sidebar accurately hides unpermitted module groups and shows only permitted items.');

console.log('\n>>> ALL 11 TESTS PASSED SUCCESSFULLY! <<<');

