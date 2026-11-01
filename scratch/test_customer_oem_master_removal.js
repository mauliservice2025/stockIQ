const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: COMPLETE REMOVAL OF CUSTOMER & OEM ACCOUNT MASTER ===\n');

// 1. Check index.html UI
console.log('1. Checking index.html UI...');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(!indexHtml.includes('Customer & OEM Account Master'), 'index.html must not contain Customer & OEM Account Master text');
assert(!indexHtml.includes('id="nav-item-customers"'), 'index.html must not contain #nav-item-customers');
assert(!indexHtml.includes('id="nav-item-customer-master"'), 'index.html must not contain #nav-item-customer-master');
assert(!indexHtml.includes('href="#/customers"'), 'index.html must not contain href="#/customers"');
console.log('  ✓ index.html has no Customer & OEM Account Master nav links or elements.');

// 2. Check js/app.js
console.log('2. Checking js/app.js...');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(!appJs.includes("'#/customers':"), 'app.js routes must not contain #/customers');
assert(!appJs.includes("'#/customer-master':"), 'app.js routes must not contain #/customer-master');
assert(!appJs.includes('CUSTOMER_MASTER'), 'app.js must not reference CUSTOMER_MASTER');
console.log('  ✓ app.js has no customer routes or permissions mapping.');

// 3. Check js/modules/org-location.js
console.log('3. Checking js/modules/org-location.js...');
const orgLocationJs = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');
assert(!orgLocationJs.includes("key: 'CUSTOMERS'"), 'org-location.js must not contain CUSTOMERS tab key');
assert(!orgLocationJs.includes('Customer & OEM Account Master'), 'org-location.js must not contain Customer & OEM Account Master label');
assert(!orgLocationJs.includes('renderCustomersTab'), 'org-location.js must not contain renderCustomersTab');
assert(!orgLocationJs.includes("'CUSTOMERS': '#/customers'"), 'org-location.js routeMap must not contain CUSTOMERS');
console.log('  ✓ org-location.js has no CUSTOMERS tab or render handler.');

// 4. Check js/modules/masters.js
console.log('4. Checking js/modules/masters.js...');
const mastersJs = fs.readFileSync(path.join(__dirname, '../js/modules/masters.js'), 'utf8');
assert(!mastersJs.includes('renderCustomersMaster'), 'masters.js must not contain renderCustomersMaster');
assert(!mastersJs.includes('showAddCustomerModal'), 'masters.js must not contain showAddCustomerModal');
assert(!mastersJs.includes('submitNewCustomer'), 'masters.js must not contain submitNewCustomer');
assert(!mastersJs.includes('Customer & OEM Account Master'), 'masters.js must not contain Customer & OEM Account Master text');
console.log('  ✓ masters.js has no customer master rendering or onboarding actions.');

// 5. Check js/modules/pinned-submodules.js
console.log('5. Checking js/modules/pinned-submodules.js...');
const pinnedJs = fs.readFileSync(path.join(__dirname, '../js/modules/pinned-submodules.js'), 'utf8');
assert(!pinnedJs.includes('Customer & OEM Account Master'), 'pinned-submodules.js must not contain Customer & OEM Account Master');
assert(!pinnedJs.includes('CUSTOMER_MASTER'), 'pinned-submodules.js must not contain CUSTOMER_MASTER');
console.log('  ✓ pinned-submodules.js has no customer master entry.');

// 6. Check js/modules/user-management.js
console.log('6. Checking js/modules/user-management.js...');
const userMgmtJs = fs.readFileSync(path.join(__dirname, '../js/modules/user-management.js'), 'utf8');
assert(!userMgmtJs.includes('CUSTOMER_MASTER'), 'user-management.js must not contain CUSTOMER_MASTER');
assert(!userMgmtJs.includes('Customer & OEM Account Master'), 'user-management.js must not contain Customer & OEM Account Master');
console.log('  ✓ user-management.js has no CUSTOMER_MASTER permission or alias.');

// 7. Check js/state.js
console.log('7. Checking js/state.js...');
const stateJs = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
assert(!stateJs.includes('CUSTOMER_MASTER'), 'state.js must not contain CUSTOMER_MASTER');
console.log('  ✓ state.js has no CUSTOMER_MASTER alias.');

// 8. Check Database Runtime
console.log('8. Checking Database Runtime...');
global.window = global;
global.window.location = { hash: '#/suppliers' };
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};
require(path.join(__dirname, '../js/data/mock-data.js'));
require(path.join(__dirname, '../js/data/db.js'));

const customers = window.DB.getAll('customers') || [];
assert.strictEqual(customers.length, 0, 'Database customers table must be empty or purged');
console.log('  ✓ Database customers table is empty / purged (0 rows).');

console.log('\n🎉 ALL CUSTOMER & OEM ACCOUNT MASTER REMOVAL CHECKS PASSED (100%)!');
