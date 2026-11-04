// Automated Unit Test for RBAC Rights on Changing Next Service Date in Vehicle Delivery & Billing
const assert = require('assert');

// Setup mock window & browser environment
global.window = global;
global.document = {
  getElementById: (id) => null
};

// Load state and modules
const DB = {
  data: {
    users: [
      { id: 'USR-001', username: 'p.patil', primary_role: 'ROLE-ADMIN', status: 'ACTIVE' },
      { id: 'USR-002', username: 'manager.vikram', primary_role: 'ROLE-STORE-MGR', status: 'ACTIVE' },
      { id: 'USR-003', username: 'cashier.amit', primary_role: 'ROLE-CASHIER', status: 'ACTIVE' },
      { id: 'USR-004', username: 'guest.viewer', primary_role: 'ROLE-GUEST', status: 'ACTIVE' }
    ],
    roles: [
      { id: 'ROLE-ADMIN', name: 'System Administrator' },
      { id: 'ROLE-STORE-MGR', name: 'Workshop Store Manager' },
      { id: 'ROLE-CASHIER', name: 'Cashier & Front Desk' },
      { id: 'ROLE-GUEST', name: 'Guest Viewer' }
    ],
    role_permissions: [
      // Store Mgr has VEHICLE_DELIVERY view and edit
      { role_id: 'ROLE-STORE-MGR', perm_code: 'VEHICLE_DELIVERY', view: true, edit: true, add: true },
      // Cashier only has view for VEHICLE_DELIVERY, NO edit
      { role_id: 'ROLE-CASHIER', perm_code: 'VEHICLE_DELIVERY', view: true, edit: false, add: false },
      // Guest has no permissions
    ],
    vehicleDeliveries: [
      {
        id: 'DEL-001',
        gate_pass_no: 'GP/MSC1/2026/0001',
        delivery_date: '2026-10-22 14:00',
        job_card_id: 'JC-001',
        job_card_no: 'JC/MSC1/2026/0001',
        invoice_no: 'INV/MSC1/2026/0001',
        customer_name: 'Rahul Sharma',
        customer_mobile: '9876543210',
        vehicle_reg_no: 'MH12AB1234',
        vehicle_model: 'Activa 6G',
        status: 'DELIVERED',
        next_service_due_date: '2026-11-20'
      }
    ],
    jobCards: [
      { id: 'JC-001', job_card_no: 'JC/MSC1/2026/0001', next_service_due_date: '2026-11-20' }
    ],
    finalBills: [
      { id: 'BILL-001', invoice_no: 'INV/MSC1/2026/0001', job_card_no: 'JC/MSC1/2026/0001', next_service_due_date: '2026-11-20' }
    ],
    vehicles: []
  },
  getAll(table) { return this.data[table] || []; },
  getById(table, id) { return (this.data[table] || []).find(r => r.id === id); },
  upsert(table, item) {
    if (!this.data[table]) this.data[table] = [];
    const idx = this.data[table].findIndex(r => r.id === item.id);
    if (idx >= 0) this.data[table][idx] = item;
    else this.data[table].push(item);
  },
  saveData() {},
  emitChange() {}
};
window.DB = DB;

let currentUser = DB.data.users[0];
let lastToast = null;
let lastModal = null;

const State = {
  getCurrentUser() { return currentUser; },
  showToast(msg, type) {
    lastToast = { msg, type };
    console.log(`[Toast ${type}]: ${msg}`);
  },
  showModal(opts) {
    lastModal = opts;
  },
  closeModal() {
    lastModal = null;
  },
  hasPermission(permCode, action = 'VIEW') {
    const user = this.getCurrentUser();
    if (!user || user.status !== 'ACTIVE') return false;
    if (user.primary_role === 'ROLE-ADMIN' || user.id === 'USR-001' || user.username === 'p.patil') return true;

    const rolePerms = DB.getAll('role_permissions') || [];
    const normalizedAction = action.toLowerCase();
    const candidateRoleIds = [user.primary_role];

    let mapping = null;
    for (const rid of candidateRoleIds) {
      mapping = rolePerms.find(rp => rp.role_id === rid && (rp.perm_code === permCode || rp.perm_code === permCode.toUpperCase()));
      if (mapping) break;
    }

    if (!mapping) {
      const aliasMap = {
        'CHANGE_NEXT_SERVICE_DATE': 'VEHICLE_DELIVERY'
      };
      let catCode = aliasMap[permCode];
      if (catCode) {
        for (const rid of candidateRoleIds) {
          mapping = rolePerms.find(rp => rp.role_id === rid && (rp.perm_code === catCode || rp.perm_code === catCode.toUpperCase()));
          if (mapping) break;
        }
      }
    }

    if (!mapping) return false;
    return !!mapping[normalizedAction];
  }
};
window.State = State;

// Require UserManagementModule to check catalog
require('../js/modules/user-management.js');

// Require BillingModule
require('../js/modules/billing.js');
const billing = window.BillingModule;

console.log('Testing Next Service Date RBAC Rights Enforcement...\n');

// 1. Verify User Management subModulesCatalog contains CHANGE_NEXT_SERVICE_DATE
console.log('--- TEST 1: Check Permissions Catalog in User Management ---');
const subMod = window.UserManagementModule.subModulesCatalog.find(sm => sm.code === 'CHANGE_NEXT_SERVICE_DATE');
assert(subMod, 'CHANGE_NEXT_SERVICE_DATE must be present in subModulesCatalog');
console.log(`✓ subModulesCatalog contains ${subMod.code} ("${subMod.name}")`);

// 2. Test Admin User (USR-001 / ROLE-ADMIN)
console.log('\n--- TEST 2: Admin User Rights ---');
currentUser = DB.data.users[0]; // Admin
assert.strictEqual(billing.canChangeNextServiceDate(), true, 'Admin must have rights to change Next Service Date');
console.log('✓ Admin has rights to change Next Service Date.');

// 3. Test Store Manager (ROLE-STORE-MGR) with VEHICLE_DELIVERY edit = true
console.log('\n--- TEST 3: Store Manager Rights (with edit rights) ---');
currentUser = DB.data.users[1]; // Store Manager
assert.strictEqual(billing.canChangeNextServiceDate(), true, 'Store Manager with VEHICLE_DELIVERY edit right must have permission');
console.log('✓ Store Manager with VEHICLE_DELIVERY edit right has permission.');

// 4. Test Cashier (ROLE-CASHIER) with VEHICLE_DELIVERY edit = false
console.log('\n--- TEST 4: Cashier Rights (view only, NO edit) ---');
currentUser = DB.data.users[2]; // Cashier
assert.strictEqual(billing.canChangeNextServiceDate(), false, 'Cashier without edit rights must NOT have permission');
console.log('✓ Cashier correctly denied permission.');

// 5. Test Guest (ROLE-GUEST)
console.log('\n--- TEST 5: Guest Rights (no permissions) ---');
currentUser = DB.data.users[3]; // Guest
assert.strictEqual(billing.canChangeNextServiceDate(), false, 'Guest must NOT have permission');
console.log('✓ Guest correctly denied permission.');

// 6. Test showEditNextServiceDateModal when unauthorized
console.log('\n--- TEST 6: showEditNextServiceDateModal when unauthorized ---');
currentUser = DB.data.users[2]; // Cashier
lastToast = null;
lastModal = null;
billing.showEditNextServiceDateModal('DEL-001');
assert.strictEqual(lastModal, null, 'Modal must NOT open for unauthorized user');
assert(lastToast && lastToast.type === 'danger' && lastToast.msg.includes('Access Denied'), 'Danger toast must be shown');
console.log('✓ Modal blocked and access denied toast displayed.');

// 7. Test updateDeliveryNextServiceDate when unauthorized
console.log('\n--- TEST 7: updateDeliveryNextServiceDate when unauthorized ---');
currentUser = DB.data.users[2]; // Cashier
lastToast = null;
billing.updateDeliveryNextServiceDate('DEL-001', '2027-05-15');
const delAfterDenied = DB.getById('vehicleDeliveries', 'DEL-001');
assert.strictEqual(delAfterDenied.next_service_due_date, '2026-11-20', 'Date must NOT be updated when unauthorized');
assert(lastToast && lastToast.type === 'danger' && lastToast.msg.includes('Access Denied'), 'Danger toast must be shown');
console.log('✓ Direct update blocked and date remained unchanged.');

// 8. Test updateDeliveryNextServiceDate when authorized (Admin)
console.log('\n--- TEST 8: updateDeliveryNextServiceDate when authorized ---');
currentUser = DB.data.users[0]; // Admin
lastToast = null;
billing.updateDeliveryNextServiceDate('DEL-001', '2026-12-25');
const delAfterAllowed = DB.getById('vehicleDeliveries', 'DEL-001');
assert.strictEqual(delAfterAllowed.next_service_due_date, '2026-12-25', 'Date must be updated when authorized');
assert(lastToast && lastToast.type === 'success', 'Success toast must be shown');
console.log('✓ Update succeeded when authorized.');

// 9. Grant Cashier explicit CHANGE_NEXT_SERVICE_DATE permission and re-test
console.log('\n--- TEST 9: Granting explicit CHANGE_NEXT_SERVICE_DATE rights to Cashier ---');
DB.data.role_permissions.push({
  role_id: 'ROLE-CASHIER',
  perm_code: 'CHANGE_NEXT_SERVICE_DATE',
  edit: true,
  view: true
});
currentUser = DB.data.users[2]; // Cashier
assert.strictEqual(billing.canChangeNextServiceDate(), true, 'Cashier must now have permission after explicit grant');
lastToast = null;
billing.updateDeliveryNextServiceDate('DEL-001', '2027-01-10');
assert.strictEqual(DB.getById('vehicleDeliveries', 'DEL-001').next_service_due_date, '2027-01-10');
assert(lastToast && lastToast.type === 'success');
console.log('✓ Explicit CHANGE_NEXT_SERVICE_DATE right enabled Cashier to change date successfully.');

// 10. Test UI Action Button Rendering (Enabled vs Disabled)
console.log('\n--- TEST 10: UI Action Button Rendering (Enabled vs Disabled) ---');
// When authorized
currentUser = DB.data.users[0]; // Admin
const htmlAuthorized = billing.renderDeliveryTab();
assert(htmlAuthorized.includes('title="Change Next Service Date (Sync to Bill UI & Print)"'), 'Enabled button should have normal title');
assert(!htmlAuthorized.includes('disabled title="Access Denied: You do not have permission'), 'Enabled button must not be disabled');

// When unauthorized
currentUser = DB.data.users[3]; // Guest
const htmlUnauthorized = billing.renderDeliveryTab();
assert(htmlUnauthorized.includes('disabled title="Access Denied: You do not have permission to change Next Service Date'), 'Unauthorized user must receive disabled button with Access Denied tooltip');
console.log('✓ UI Action button correctly renders as enabled for authorized users and disabled for unauthorized users.');

console.log('\n========================================');
console.log('ALL 10 RBAC RIGHTS TESTS PASSED! ✅');
console.log('========================================');
