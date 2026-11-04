// Test verification for Supplier & Vendor Master and Customer & OEM Account Master
// moving under Organization & Facility Setup besides Facility Master

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing Supplier & Vendor Master and Customer & OEM Account Master placement...');

// 1. Check index.html sidebar order
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
assert(indexHtml.includes('id="nav-item-branches"'), 'Facility Master nav item must exist');
assert(indexHtml.includes('id="nav-item-suppliers"'), 'Supplier Master nav item must exist');
assert(indexHtml.includes('id="nav-item-customers"'), 'Customer Master nav item must exist');

const branchPos = indexHtml.indexOf('id="nav-item-branches"');
const supplierPos = indexHtml.indexOf('id="nav-item-suppliers"');
const customerPos = indexHtml.indexOf('id="nav-item-customers"');
const docPrintPos = indexHtml.indexOf('id="nav-item-doc-print-config"');

assert(branchPos < supplierPos, 'Supplier Master must come after Facility Master');
assert(supplierPos < customerPos, 'Customer Master must come after Supplier Master');
assert(customerPos < docPrintPos, 'Customer Master must come before Document Print Configuration Master');
console.log('✔ index.html sidebar menu hierarchy is correct');

// 2. Check app.js routes
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
assert(appJs.includes("'#/suppliers': { module: window.OrgLocationModule, title: 'Supplier & Vendor Master', section: 'Organization & Facility Setup' }"), 'app.js must route #/suppliers to OrgLocationModule');
assert(appJs.includes("'#/customers': { module: window.OrgLocationModule, title: 'Customer & OEM Account Master', section: 'Organization & Facility Setup' }"), 'app.js must route #/customers to OrgLocationModule');
assert(appJs.includes("'#/suppliers': 'SUPPLIER_MASTER'"), 'app.js permissionsMap must map #/suppliers to SUPPLIER_MASTER');
assert(appJs.includes("'#/customers': 'CUSTOMER_MASTER'"), 'app.js permissionsMap must map #/customers to CUSTOMER_MASTER');
console.log('✔ app.js routing and permissions map are correct');

// 3. Check org-location.js tabConfig and renderer
const orgLocationJs = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf-8');
assert(orgLocationJs.includes("{ key: 'BRANCHES', perm: 'BRANCH_MASTER', label: 'Facility Master' }"), 'BRANCHES tab exists');
assert(orgLocationJs.includes("{ key: 'SUPPLIERS', perm: 'SUPPLIER_MASTER', label: 'Supplier & Vendor Master' }"), 'SUPPLIERS tab exists');
assert(orgLocationJs.includes("{ key: 'CUSTOMERS', perm: 'CUSTOMER_MASTER', label: 'Customer & OEM Account Master' }"), 'CUSTOMERS tab exists');

const branchTabPos = orgLocationJs.indexOf("{ key: 'BRANCHES', perm: 'BRANCH_MASTER', label: 'Facility Master' }");
const supTabPos = orgLocationJs.indexOf("{ key: 'SUPPLIERS', perm: 'SUPPLIER_MASTER', label: 'Supplier & Vendor Master' }");
const custTabPos = orgLocationJs.indexOf("{ key: 'CUSTOMERS', perm: 'CUSTOMER_MASTER', label: 'Customer & OEM Account Master' }");
assert(branchTabPos < supTabPos && supTabPos < custTabPos, 'Tabs order in tabConfig must be BRANCHES -> SUPPLIERS -> CUSTOMERS');

assert(orgLocationJs.includes("renderSuppliersTab()"), 'renderSuppliersTab exists in OrgLocationModule');
assert(orgLocationJs.includes("renderCustomersTab()"), 'renderCustomersTab exists in OrgLocationModule');
assert(orgLocationJs.includes("'SUPPLIERS': '#/suppliers'"), 'switchTab routeMap contains SUPPLIERS');
assert(orgLocationJs.includes("'CUSTOMERS': '#/customers'"), 'switchTab routeMap contains CUSTOMERS');
console.log('✔ org-location.js tab configuration and methods are correct');

// 4. Check masters.js modal and render methods
const mastersJs = fs.readFileSync(path.join(__dirname, '../js/modules/masters.js'), 'utf-8');
assert(mastersJs.includes('showAddCustomerModal()'), 'masters.js has showAddCustomerModal');
assert(mastersJs.includes('submitNewCustomer(e)'), 'masters.js has submitNewCustomer');
assert(mastersJs.includes('showAddSupplierModal()'), 'masters.js has showAddSupplierModal');
assert(mastersJs.includes('submitNewSupplier(e)'), 'masters.js has submitNewSupplier');
assert(mastersJs.includes('+ Onboard New Customer'), 'masters.js has + Onboard New Customer button');
assert(mastersJs.includes('+ Onboard New Vendor'), 'masters.js has + Onboard New Vendor button');
console.log('✔ masters.js onboard actions and tables are correct');

// 5. Check user-management.js and state.js permissions
const userMgmtJs = fs.readFileSync(path.join(__dirname, '../js/modules/user-management.js'), 'utf-8');
assert(userMgmtJs.includes("code: 'SUPPLIER_MASTER', name: 'Supplier & Vendor Master', category: 'Organization & Facility Setup'"), 'SUPPLIER_MASTER in user-management.js registry');
assert(userMgmtJs.includes("code: 'CUSTOMER_MASTER', name: 'Customer & OEM Account Master', category: 'Organization & Facility Setup'"), 'CUSTOMER_MASTER in user-management.js registry');
assert(userMgmtJs.includes("'SUPPLIER_MASTER': 'MASTERS'"), 'SUPPLIER_MASTER in user-management.js aliasMap');
assert(userMgmtJs.includes("'CUSTOMER_MASTER': 'MASTERS'"), 'CUSTOMER_MASTER in user-management.js aliasMap');

const stateJs = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf-8');
assert(stateJs.includes("'SUPPLIER_MASTER': 'MASTERS'"), 'SUPPLIER_MASTER in state.js aliasMap');
assert(stateJs.includes("'CUSTOMER_MASTER': 'MASTERS'"), 'CUSTOMER_MASTER in state.js aliasMap');
console.log('✔ user-management.js and state.js permissions registries are correct');

// 6. Test runtime execution with simulated DOM and DB
global.document = {
  getElementById: (id) => null,
  querySelector: () => null
};

global.window = {
  location: { hash: '#/suppliers' },
  State: {
    hasPermission: () => true,
    showModal: (cfg) => { window.lastModal = cfg; },
    closeModal: () => { window.lastModal = null; },
    showToast: (msg) => { window.lastToast = msg; }
  },
  DB: {
    _data: {
      suppliers: [
        { code: 'SUP-01', name: 'Bosch India Ltd', category: 'OEM_COMPONENTS', contact: 'A. Rao', email: 'rao@bosch.in', phone: '9800000001', city: 'Bengaluru', payment_terms: 45, rating: 4.8 }
      ],
      customers: [
        { code: 'CUST-01', name: 'Mahindra Logistics', category: 'OEM', contact: 'K. Patel', email: 'patel@mahindra.com', phone: '9800000002', city: 'Mumbai', credit_limit: 10000000, payment_terms: 30 }
      ],
      organizations: [{ id: 'ORG-01', name: 'Mauli Corp', status: 'Active' }],
      plants: [{ id: 'PLANT-01', name: 'Plant 1', organization_id: 'ORG-01' }],
      warehouses: [],
      zones: [],
      racks: [],
      shelves: [],
      bins: []
    },
    getAll(col) { return this._data[col] || []; },
    insert(col, item) { this._data[col] = this._data[col] || []; this._data[col].push(item); },
    logAudit() {}
  }
};

eval(mastersJs);
eval(orgLocationJs);

// Render suppliers in OrgLocationModule
window.location.hash = '#/suppliers';
let container = { innerHTML: '' };
window.OrgLocationModule.render(container);
assert(container.innerHTML.includes('Approved Supplier & Vendor Master (SRM)'), 'Renders suppliers tab content');
assert(container.innerHTML.includes('Bosch India Ltd'), 'Renders supplier record');
assert(container.innerHTML.includes('+ Onboard New Vendor'), 'Renders onboard vendor button');

// Render customers in OrgLocationModule
window.location.hash = '#/customers';
window.OrgLocationModule.render(container);
assert(container.innerHTML.includes('Customer & OEM Account Master'), 'Renders customers tab content');
assert(container.innerHTML.includes('Mahindra Logistics'), 'Renders customer record');
assert(container.innerHTML.includes('+ Onboard New Customer'), 'Renders onboard customer button');

// Test switchTab
window.OrgLocationModule.switchTab('SUPPLIERS');
assert.strictEqual(window.location.hash, '#/suppliers', 'switchTab switches to #/suppliers');
window.OrgLocationModule.switchTab('CUSTOMERS');
assert.strictEqual(window.location.hash, '#/customers', 'switchTab switches to #/customers');

// Test Supplier Onboarding Modal & Submission
window.MastersModule.showAddSupplierModal();
assert(window.lastModal && window.lastModal.title.includes('Onboard Supplier / Vendor'), 'Supplier modal opened');

global.document.getElementById = (id) => {
  const fields = {
    'new-sup-code': { value: 'SUP-NEW-01' },
    'new-sup-name': { value: 'New Test Supplier' },
    'new-sup-cat': { value: 'RAW_MATERIAL' },
    'new-sup-contact': { value: 'Tester' },
    'new-sup-email': { value: 'test@supplier.com' },
    'new-sup-city': { value: 'Nashik' },
    'new-sup-terms': { value: '30' }
  };
  return fields[id] || null;
};
window.MastersModule.submitNewSupplier({ preventDefault: () => {} });
assert.strictEqual(window.DB.getAll('suppliers').length, 2, 'Supplier successfully inserted in DB');
assert(window.lastToast.includes('New Test Supplier onboarded!'), 'Supplier toast displayed');

// Test Customer Onboarding Modal & Submission
window.MastersModule.showAddCustomerModal();
assert(window.lastModal && window.lastModal.title.includes('Onboard Customer / OEM Account'), 'Customer modal opened');

global.document.getElementById = (id) => {
  const fields = {
    'new-cust-code': { value: 'CUST-NEW-01' },
    'new-cust-name': { value: 'New Test OEM Customer' },
    'new-cust-cat': { value: 'OEM' },
    'new-cust-contact': { value: 'OEM Lead' },
    'new-cust-email': { value: 'oem@test.com' },
    'new-cust-phone': { value: '9800000099' },
    'new-cust-city': { value: 'Pune' },
    'new-cust-credit': { value: '2500000' },
    'new-cust-terms': { value: '60' }
  };
  return fields[id] || null;
};
window.MastersModule.submitNewCustomer({ preventDefault: () => {} });
assert.strictEqual(window.DB.getAll('customers').length, 2, 'Customer successfully inserted in DB');
assert(window.lastToast.includes('New Test OEM Customer onboarded!'), 'Customer toast displayed');

console.log('✔ Modal onboarding actions and DB insertions verified successfully!');
console.log('✔ Runtime rendering and tab switching test passed successfully!');
