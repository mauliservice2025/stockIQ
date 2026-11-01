const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser environment
const toasts = [];
const modals = [];

global.window = {
  State: {
    showToast: (msg, type) => {
      toasts.push({ msg, type });
      console.log(`[Toast] [${type}]: ${msg}`);
    },
    showModal: (config) => {
      modals.push(config);
      console.log(`[Modal] opened: ${config.title}`);
    },
    closeModal: () => {
      console.log('[Modal] closed');
    }
  },
  DB: {
    data: {
      roles: [
        {
          id: 'ROLE-ADMIN',
          code: 'SYSTEM_ADMIN',
          name: 'System Administrator',
          description: 'Full system configuration, security governance, user lifecycle and operational oversight.',
          is_system: true,
          status: 'ACTIVE'
        },
        {
          id: 'ROLE-STORE-MGR',
          code: 'STORE_MGR',
          name: 'Store Manager',
          description: 'Store operations supervisor',
          is_system: true,
          status: 'ACTIVE'
        },
        {
          id: 'ROLE-003',
          code: '003',
          name: 'Mechanic',
          description: 'Mechanic responsible for operations.',
          is_system: false,
          status: 'ACTIVE'
        }
      ],
      users: []
    },
    getById(collection, id) {
      return (this.data[collection] || []).find(x => x.id === id);
    },
    getAll(collection) {
      return this.data[collection] || [];
    },
    update(collection, id, updated) {
      const idx = (this.data[collection] || []).findIndex(x => x.id === id);
      if (idx !== -1) {
        this.data[collection][idx] = { ...this.data[collection][idx], ...updated };
      }
    }
  }
};

global.document = {
  getElementById: (id) => null
};

// Load user-management.js
const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'user-management.js'), 'utf8');

// Evaluate script
eval(code);

const um = window.UserManagementModule;
assert(um, 'UserManagementModule must be defined');

console.log('--- TEST 1: Check renderRoleMaster output for System Administrator vs other roles ---');
const rolesHtml = um.renderRoleMaster();

// Verify System Administrator row does NOT have showEditRoleModal('ROLE-ADMIN')
assert(!rolesHtml.includes("showEditRoleModal('ROLE-ADMIN')"), 'System Administrator row MUST NOT contain Edit button');
console.log('✓ PASS: System Administrator row does NOT contain Edit button');

// Verify other roles DO have showEditRoleModal
assert(rolesHtml.includes("showEditRoleModal('ROLE-STORE-MGR')"), 'Store Manager row MUST contain Edit button');
assert(rolesHtml.includes("showEditRoleModal('ROLE-003')"), 'Mechanic row MUST contain Edit button');
console.log('✓ PASS: Other roles (Store Manager, Mechanic) still contain Edit button');

console.log('\n--- TEST 2: Calling showEditRoleModal for System Administrator ---');
toasts.length = 0;
modals.length = 0;
um.showEditRoleModal('ROLE-ADMIN');
assert.strictEqual(modals.length, 0, 'No modal should open for ROLE-ADMIN');
assert(toasts.some(t => t.type === 'warning' && t.msg.includes('protected')), 'Warning toast should be emitted for ROLE-ADMIN');
console.log('✓ PASS: showEditRoleModal for ROLE-ADMIN blocked with warning toast');

console.log('\n--- TEST 3: Calling submitEditRole for System Administrator ---');
toasts.length = 0;
um.submitEditRole('ROLE-ADMIN');
assert(toasts.some(t => t.type === 'warning' && t.msg.includes('protected')), 'Warning toast should be emitted on submitEditRole for ROLE-ADMIN');
console.log('✓ PASS: submitEditRole for ROLE-ADMIN blocked with warning toast');

console.log('\n--- TEST 4: Calling showEditRoleModal for another role (Mechanic) ---');
toasts.length = 0;
modals.length = 0;
um.showEditRoleModal('ROLE-003');
assert.strictEqual(modals.length, 1, 'Modal should open for ROLE-003');
assert.strictEqual(modals[0].title, '✏️ Edit Role Definition');
console.log('✓ PASS: showEditRoleModal opens normally for non-admin roles');

console.log('\nALL TESTS PASSED SUCCESSFULLY!');
