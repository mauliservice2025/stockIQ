// Comprehensive RBAC Screen & Module Hiding Verification Script
const fs = require('fs');
const path = require('path');

// 1. Read mock-data.js to get INITIAL_DATA
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');

// Sandbox execution of mock data
const vm = require('vm');
const sandbox = {
  window: {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: class { constructor(t, d) { this.type = t; this.detail = d; } },
  Event: class { constructor(t) { this.type = t; } },
  location: { hash: '#/dashboard' },
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; }
  },
  console: console,
  document: {
    addEventListener: () => {},
    documentElement: { setAttribute: () => {}, getAttribute: () => {} },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);

// Read db.js and state.js
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const appContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(appContent, sandbox);

const DB = sandbox.window.DB;
const State = sandbox.window.State;
const App = sandbox.window.App;

console.log('--- STARTING RBAC VERIFICATION ---');

// DB is already initialized in constructor

// Test 1: Sagar Sable User & Role
const sagar = DB.getById('users', 'USR-106');
console.log('User USR-106 found:', !!sagar, 'Name:', sagar.full_name, 'Role:', sagar.primary_role);

State.switchSimulatedUser('USR-106');
const currentUser = State.getCurrentUser();
console.log('Current simulated user:', currentUser.full_name, 'Role:', currentUser.primary_role);

// Test 2: Route Permissions for Sagar
const testRoutes = [
  // Should be ALLOWED
  { route: '#/store-inventory', expected: true, name: 'Store & Inventory Suite' },
  { route: '#/store-master', expected: true, name: 'Store Master' },
  { route: '#/stores', expected: true, name: 'Store Master Alias' },
  { route: '#/item-master', expected: true, name: 'Item Master' },
  { route: '#/item-categories', expected: true, name: 'Item Category Master' },
  { route: '#/item-subcategories', expected: true, name: 'Item Sub-Category Master' },
  { route: '#/item-brands', expected: true, name: 'Brand Master' },
  { route: '#/item-manufacturers', expected: true, name: 'Manufacturer Master' },
  { route: '#/uom-master', expected: true, name: 'UOM Master' },
  { route: '#/hsn-master', expected: true, name: 'HSN/SAC Master' },
  { route: '#/store-mapping', expected: true, name: 'Store Category Mapping' },
  { route: '#/vehicle-compatibility', expected: true, name: 'Vehicle Compatibility' },
  { route: '#/job-card-parts', expected: true, name: 'Job Card Parts' },
  { route: '#/stock-transfers', expected: true, name: 'Stock Transfers' },
  { route: '#/stock-counts', expected: true, name: 'Physical Count' },
  { route: '#/warranty-scrap', expected: true, name: 'Warranty & Scrap' },
  { route: '#/inventory-rules', expected: true, name: 'Inventory Rules' },
  { route: '#/stock-ledger', expected: true, name: 'Stock Ledger' },
  { route: '#/grn', expected: true, name: 'Goods Receipt GRN' },
  { route: '#/putaway', expected: true, name: 'Directed Putaway' },
  { route: '#/inventory', expected: true, name: 'Central Inventory' },
  { route: '#/transfers', expected: true, name: 'Inter-Facility Transfers' },
  { route: '#/returns', expected: true, name: 'Material Returns' },
  { route: '#/adjustments', expected: true, name: 'Adjustments' },
  { route: '#/billing-dashboard', expected: true, name: 'Billing Dashboard' },
  { route: '#/job-cards', expected: true, name: 'Job Card Management' },
  { route: '#/billing-estimates', expected: true, name: 'Billing Estimates' },
  { route: '#/draft-bills', expected: true, name: 'Draft Bills' },
  { route: '#/final-bills', expected: true, name: 'Final Bills' },
  { route: '#/vehicle-delivery', expected: true, name: 'Vehicle Delivery' },

  // Should be HIDDEN / FORBIDDEN
  { route: '#/security-dashboard', expected: false, name: 'Security Dashboard' },
  { route: '#/users', expected: false, name: 'User Master' },
  { route: '#/roles', expected: false, name: 'Role Master' },
  { route: '#/permissions', expected: false, name: 'Permission Master' },
  { route: '#/access-requests', expected: false, name: 'Access Requests' },
  { route: '#/user-access-control', expected: false, name: 'User Access Control' },
  { route: '#/sod-rules', expected: false, name: 'SoD Rules' },
  { route: '#/approval-authorities', expected: false, name: 'Approval Authorities' },
  { route: '#/org-location', expected: false, name: 'Org & Location Suite' },
  { route: '#/organizations', expected: false, name: 'Organization Master' },
  { route: '#/branches', expected: false, name: 'Facility Master' },
  { route: '#/storage-locations', expected: false, name: 'Storage Locations' },
  { route: '#/racks', expected: false, name: 'Racks' },
  { route: '#/shelves', expected: false, name: 'Shelves' },
  { route: '#/bins', expected: false, name: 'Bins' },
  { route: '#/production', expected: false, name: 'Production & BOM' },
  { route: '#/dispatch', expected: false, name: 'Outbound Logistics' },
  { route: '#/purchase-planning', expected: false, name: 'Purchase Planning' },
  { route: '#/requisitions', expected: false, name: 'Purchase Requisitions' },
  { route: '#/orders', expected: false, name: 'Purchase Orders' },
  { route: '#/reports', expected: false, name: 'Executive MIS' },
  { route: '#/audit', expected: false, name: 'System Audit' }
];

let failed = 0;
testRoutes.forEach(t => {
  const allowed = App.canAccessRoute(t.route);
  const pass = allowed === t.expected;
  if (!pass) {
    console.error(`FAIL: ${t.name} (${t.route}) expected allowed=${t.expected} but got ${allowed}`);
    failed++;
  } else {
    console.log(`PASS: ${t.name} (${t.route}) -> ${allowed ? 'VISIBLE' : 'HIDDEN'}`);
  }
});

console.log(`\nRoute check complete: ${testRoutes.length - failed}/${testRoutes.length} passed.`);

// Test 3: getFirstAuthorizedRoute for Sagar
const firstAuthRoute = App.getFirstAuthorizedRoute();
console.log('First authorized route for Sagar:', firstAuthRoute);
if (firstAuthRoute !== '#/store-inventory' && firstAuthRoute !== '#/dashboard') {
  console.error('FAIL: Expected first authorized route to be #/store-inventory or #/dashboard, got:', firstAuthRoute);
} else {
  console.log('PASS: First authorized route is valid.');
}

// Test 4: Pravin Patil (Admin) access check
State.switchSimulatedUser('USR-001');
console.log('\nSwitched to Pravin Patil (ROLE-ADMIN):');
let adminFailed = 0;
testRoutes.forEach(t => {
  const allowed = App.canAccessRoute(t.route);
  if (!allowed) {
    console.error(`FAIL: Admin should have access to ${t.route}`);
    adminFailed++;
  }
});
if (adminFailed === 0) {
  console.log('PASS: Admin has universal access to all routes.');
} else {
  console.error(`FAIL: Admin failed ${adminFailed} routes.`);
}

console.log('\n--- VERIFICATION FINISHED ---');
process.exit(failed + adminFailed);
