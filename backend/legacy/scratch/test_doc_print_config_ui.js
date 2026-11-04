const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Testing Document Print Configuration Master UI & Delete Changes ---');

// Read doc-print-config.js
const code = fs.readFileSync(path.join(__dirname, '../js/modules/doc-print-config.js'), 'utf8');

// Mock browser environment
let toastMessages = [];
let deletedConfigs = [];
let auditLogs = [];

const mockCurrentUser = {
  id: 'USR-001',
  name: 'Pravin Patil',
  username: 'p.patil',
  primary_role: 'ROLE-ADMIN',
  status: 'ACTIVE'
};

let currentPerms = {
  'DOC_PRINT_CONFIG_MASTER': { delete: true }
};

const sandbox = {
  console: console,
  document: {
    getElementById: (id) => null,
    createElement: (tag) => ({ id: '', style: {}, innerHTML: '', appendChild: () => {} }),
    body: { appendChild: () => {} }
  },
  window: {},
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  fetch: async () => ({ ok: true, json: async () => ({ success: true }) })
};

sandbox.window = sandbox;
sandbox.window.State = {
  getCurrentUser: () => mockCurrentUser,
  hasPermission: (permCode, action) => {
    if (mockCurrentUser.primary_role === 'ROLE-ADMIN' || mockCurrentUser.id === 'USR-001') return true;
    if (currentPerms[permCode] && currentPerms[permCode][action.toLowerCase()]) return true;
    return false;
  },
  showToast: (msg, type) => {
    toastMessages.push({ msg, type });
  }
};

const mockConfigs = [
  {
    id: 'DPC-JC-001',
    code: 'DPC-JC-001',
    name: 'Job Card',
    document_type: 'JC',
    facility_id: 'ALL',
    applicable_facilities: ['ALL'],
    version: '1.2',
    status: 'Published',
    effective_from: '2026-04-01',
    updated_by: 'Administrator',
    updated_at: '2026-10-21T10:00:00Z'
  },
  {
    id: 'DPC-EST-001',
    code: 'DPC-EST-001',
    name: 'Estimate Quotation',
    document_type: 'EST',
    facility_id: 'ALL',
    applicable_facilities: ['ALL'],
    version: '1.1',
    status: 'Published',
    effective_from: '2026-04-01',
    updated_by: 'Administrator',
    updated_at: '2026-10-19T10:00:00Z'
  }
];

sandbox.window.DB = {
  getAll: (table) => {
    if (table === 'document_print_configurations') return mockConfigs;
    if (table === 'plants') return [
      { id: 'PLANT-01', code: 'PUNE-W01', name: 'Pune Workshop' }
    ];
    if (table === 'document_print_audit_logs') return auditLogs;
    return [];
  },
  delete: (table, id) => {
    if (table === 'document_print_configurations') {
      deletedConfigs.push(id);
    }
  },
  upsert: (table, record) => {
    if (table === 'document_print_audit_logs') {
      auditLogs.push(record);
    }
  }
};

// Execute module script
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const docModule = sandbox.window.DocPrintConfigModule;
if (!docModule) {
  console.error('FAIL: DocPrintConfigModule not exported');
  process.exit(1);
}
console.log('✓ DocPrintConfigModule loaded successfully.');

// Test 1: Verify getFacilities does not contain "(Company-wide Default)"
const facilities = docModule.getFacilities();
const allFac = facilities.find(f => f.id === 'ALL');
console.log('All Facilities name:', allFac.name);
if (allFac.name.includes('(Company-wide') || allFac.name.includes('Default')) {
  console.error('FAIL: Facility name still includes (Company-wide)');
  process.exit(1);
}
console.log('✓ Facility name is clean:', allFac.name);

// Test 2: Verify renderTableContent does NOT render code under name and does NOT render (Company-wide)
const tableHtml = docModule.renderTableContent();

// Check for code subtext in Name column
if (tableHtml.includes('>DPC-JC-001<') || tableHtml.includes('>DPC-EST-001<')) {
  console.error('FAIL: Code subtext still rendered in table');
  process.exit(1);
}
console.log('✓ Code subtext is removed from Name column.');

// Check for (Company-wide) in Facility column
if (tableHtml.includes('(Company-wide)')) {
  console.error('FAIL: (Company-wide) still rendered in table');
  process.exit(1);
}
console.log('✓ (Company-wide) text is removed.');

// Check for Delete button
if (!tableHtml.includes('🗑️ Delete')) {
  console.error('FAIL: Delete button not found in table HTML');
  process.exit(1);
}
console.log('✓ Delete button is present in Actions column.');

// Test 3: Check permission logic
// Admin user can delete
const canDeleteAdmin = docModule.canDeleteConfiguration(mockConfigs[0]);
console.log('canDeleteConfiguration (Admin):', canDeleteAdmin);
if (!canDeleteAdmin) {
  console.error('FAIL: Admin should have delete permission');
  process.exit(1);
}

// Non-admin user without permission
mockCurrentUser.id = 'USR-009';
mockCurrentUser.primary_role = 'ROLE-OPERATOR';
currentPerms = {};
const canDeleteOperator = docModule.canDeleteConfiguration(mockConfigs[0]);
console.log('canDeleteConfiguration (Unauthorized):', canDeleteOperator);
if (canDeleteOperator) {
  console.error('FAIL: Unauthorized operator should not have delete permission');
  process.exit(1);
}
console.log('✓ Access-based delete rights evaluation works correctly.');

// Test 4: Delete execution
(async () => {
  mockCurrentUser.id = 'USR-001';
  mockCurrentUser.primary_role = 'ROLE-ADMIN';
  await docModule.deleteConfiguration('DPC-JC-001');

  if (!deletedConfigs.includes('DPC-JC-001')) {
    console.error('FAIL: Record was not deleted from DB');
    process.exit(1);
  }
  console.log('✓ Record successfully deleted from DB.');

  if (auditLogs.length === 0 || auditLogs[0].action !== 'DELETE') {
    console.error('FAIL: Audit log not recorded for delete');
    process.exit(1);
  }
  console.log('✓ Audit log created:', auditLogs[0]);

  console.log('--- ALL TESTS PASSED SUCCESSFULLY ---');
})();
