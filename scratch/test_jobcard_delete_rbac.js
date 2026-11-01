// Test Job Card Delete and Role-Based Permissions
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.document = {
  getElementById: (id) => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Global confirm mock
let confirmResponse = true;
global.confirm = (msg) => {
  return confirmResponse;
};

let lastModal = null;
let lastToast = null;
global.window.State = {
  currentUser: {
    id: 'USR-002',
    username: 'store_mgr',
    primary_role: 'ROLE-STORE-MGR',
    status: 'ACTIVE'
  },
  getCurrentUser() {
    return this.currentUser;
  },
  showModal: (opts) => {
    lastModal = opts;
  },
  closeModal: () => {
    lastModal = null;
  },
  showToast: (msg, type) => {
    lastToast = { msg, type };
    console.log(`[Toast ${type}]: ${msg}`);
  },
  hasPermission(permCode, action = 'VIEW') {
    if (this.currentUser.primary_role === 'ROLE-ADMIN') return true;
    const rolePerms = window.DB.getAll('role_permissions') || [];
    const mapping = rolePerms.find(rp => rp.role_id === this.currentUser.primary_role && rp.perm_code === permCode);
    if (!mapping) return false;
    return !!mapping[action.toLowerCase()];
  }
};

// Mock DB
global.window.DB = {
  data: {
    jobCards: [
      {
        id: 'JC-001',
        job_card_no: 'JC-PUN-26-001',
        customer_name: 'Rushikesh Dhiwar',
        customer_mobile: '9876567876',
        customer_cin: 'CIN-MSC1-000132',
        vehicle_reg_no: 'MH12VV3443',
        vehicle_model: 'Honda Activa 125',
        odometer_km: '10,000 km',
        service_type: 'General Service',
        status: 'READY_FOR_BILLING'
      },
      {
        id: 'JC-002',
        job_card_no: 'JC-PUN-26-002',
        customer_name: 'Amit Deshmukh',
        customer_mobile: '9822012345',
        customer_cin: 'CIN-MSC1-000135',
        vehicle_reg_no: 'MH12CD5678',
        vehicle_model: 'Bajaj Pulsar 150',
        odometer_km: '15,000 km',
        service_type: 'General Service',
        status: 'ESTIMATE_APPROVED'
      }
    ],
    role_permissions: [
      {
        role_id: 'ROLE-STORE-MGR',
        perm_code: 'STORE_TX_JOB_CARD_ISSUE',
        view: true,
        add: true,
        edit: true,
        delete: true
      },
      {
        role_id: 'ROLE-TECHNICIAN',
        perm_code: 'STORE_TX_JOB_CARD_ISSUE',
        view: true,
        add: false,
        edit: true,
        delete: false
      }
    ],
    billingEstimates: [],
    draftBills: [],
    finalBills: []
  },
  getAll: (coll) => global.window.DB.data[coll] || [],
  getById: (coll, id) => (global.window.DB.data[coll] || []).find(x => x.id === id),
  delete: (coll, id) => {
    if (!global.window.DB.data[coll]) return false;
    global.window.DB.data[coll] = global.window.DB.data[coll].filter(x => x.id !== id && x.job_card_no !== id);
    return true;
  },
  upsert: (coll, item) => {
    if (!global.window.DB.data[coll]) global.window.DB.data[coll] = [];
    const idx = global.window.DB.data[coll].findIndex(x => x.id === item.id);
    if (idx >= 0) global.window.DB.data[coll][idx] = item;
    else global.window.DB.data[coll].push(item);
  },
  saveData: () => {},
  emitChange: () => {},
  logAudit: (act, type, id, desc) => console.log(`[Audit]: ${act} on ${type}:${id} - ${desc}`)
};

// Load billing.js
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');
eval(billingCode);

console.log('--- TEST 1: Clear All button is removed ---');
let html = window.BillingModule.renderJobCardsTab();
if (html.includes('Clear All') || html.includes('clearAllJobCards')) {
  throw new Error('Clear All button still found in rendered Job Cards tab');
}
console.log('✓ PASS: "Clear All" button successfully removed from Job Cards tab.');

console.log('\n--- TEST 2: Delete button visible when user has DELETE permission ---');
// User is ROLE-STORE-MGR (delete: true)
if (!window.BillingModule.canDeleteJobCard()) {
  throw new Error('ROLE-STORE-MGR should have delete permission');
}
if (!html.includes('deleteJobCard(\'JC-001\')')) {
  throw new Error('Delete button for JC-001 not found in ACTIONS column');
}
if (!html.includes('deleteJobCard(\'JC-002\')')) {
  throw new Error('Delete button for JC-002 not found in ACTIONS column');
}
console.log('✓ PASS: Delete button rendered for each card in the ACTIONS column.');

console.log('\n--- TEST 3: Performing Delete as authorized user ---');
const countBefore = window.DB.getAll('jobCards').length;
window.BillingModule.deleteJobCard('JC-001');
const countAfter = window.DB.getAll('jobCards').length;
console.log(`Job Cards count: ${countBefore} -> ${countAfter}`);
if (countAfter !== countBefore - 1) {
  throw new Error('Job Card JC-001 was not deleted');
}
if (window.DB.getById('jobCards', 'JC-001')) {
  throw new Error('JC-001 still exists in DB');
}
console.log('✓ PASS: Authorized deletion succeeded and updated DB state.');

console.log('\n--- TEST 4: RBAC Restriction when user lacks DELETE permission ---');
// Switch user to ROLE-TECHNICIAN (delete: false)
window.State.currentUser = {
  id: 'USR-009',
  username: 'tech_borole',
  primary_role: 'ROLE-TECHNICIAN',
  status: 'ACTIVE'
};

if (window.BillingModule.canDeleteJobCard()) {
  throw new Error('ROLE-TECHNICIAN should NOT have delete permission');
}

// Re-render HTML with restricted user
html = window.BillingModule.renderJobCardsTab();
if (html.includes('window.BillingModule.deleteJobCard(')) {
  throw new Error('Active delete click handler should not be available to restricted user');
}
if (!html.includes('Delete Restricted') || !html.includes('🔒')) {
  throw new Error('Restricted/locked state not displayed for unauthorized user');
}
console.log('✓ PASS: UI shows restricted/locked delete action for unauthorized user.');

// Attempt to call deleteJobCard directly
lastToast = null;
window.BillingModule.deleteJobCard('JC-002');
if (window.DB.getById('jobCards', 'JC-002') === undefined) {
  throw new Error('JC-002 should NOT have been deleted by unauthorized user');
}
if (!lastToast || lastToast.type !== 'danger' || !lastToast.msg.includes('Access Denied')) {
  throw new Error('Expected Access Denied toast for unauthorized delete action');
}
console.log('✓ PASS: Direct invocation blocked by RBAC permission check with Access Denied warning.');

console.log('\n--- ALL TESTS PASSED WITH 100% SUCCESS! ---');
