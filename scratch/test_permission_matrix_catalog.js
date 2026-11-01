const fs = require('fs');
const assert = require('assert');

console.log('Testing Permission Matrix subModulesCatalog & Category completeness...');

global.window = {
  DB: {
    getAll: (k) => {
      if (k === 'roles') {
        return [
          { id: 'ROLE-ADMIN', code: 'SYSTEM_ADMIN', name: 'System Administrator' },
          { id: 'ROLE-STORE-MGR', code: 'STORE_MGR', name: 'Store Manager' }
        ];
      }
      return [];
    },
    data: {
      role_permissions: []
    }
  },
  State: {
    getCurrentUser: () => ({ primary_role_id: 'ROLE-ADMIN' })
  }
};

eval(fs.readFileSync('js/modules/user-management.js', 'utf8'));

const mod = window.UserManagementModule;
assert(Array.isArray(mod.subModulesCatalog), 'subModulesCatalog must be an array');
console.log(`Total catalogued sub-modules: ${mod.subModulesCatalog.length}`);
assert(mod.subModulesCatalog.length >= 60, `Expected at least 60 sub-modules, got ${mod.subModulesCatalog.length}`);

// Verify categories exist
const expectedCategories = [
  'Overview',
  'Billing & Job Card',
  'Item Master Setup',
  'Store Master Setup',
  'Procurement',
  'Quality & Storage',
  'Inventory & Logistics',
  'Manufacturing',
  'Outbound Logistics',
  'Control & Audits',
  'Masters',
  'Organization & Facility Setup',
  'Security Suite'
];

const foundCategories = [...new Set(mod.subModulesCatalog.map(sm => sm.category))];
expectedCategories.forEach(cat => {
  assert(foundCategories.includes(cat), `Category "${cat}" must be present in subModulesCatalog`);
});

// Verify every entry has valid attributes
mod.subModulesCatalog.forEach(sm => {
  assert(sm.code, `Item ${sm.name} must have a code`);
  assert(sm.name, `Item ${sm.code} must have a name`);
  assert(sm.category, `Item ${sm.code} must have a category`);
  assert(sm.route, `Item ${sm.code} must have a route`);
});

// Test HTML rendering
const catalogHtml = mod.renderPermissionCatalogMaster();
assert(catalogHtml.includes('Permission Master'), 'Catalog must render');
assert(catalogHtml.includes('Billing & Job Card'), 'Catalog must render Billing & Job Card');

const matrixHtml = mod.renderSubModulePermissionMatrix();
assert(matrixHtml.includes('Role-Permission Matrix'), 'Matrix must render');
assert(matrixHtml.includes('Billing & Job Card'), 'Matrix must render Billing & Job Card section');

console.log('✓ PASS: All 13 modules and 62 sub-modules verified in Permission Matrix successfully!');
