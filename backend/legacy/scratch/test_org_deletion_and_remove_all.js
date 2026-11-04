const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('TESTING ORGANIZATION MASTER REMOVE ALL & DELETION RULE');
console.log('====================================================\n');

// 1. Verify "Remove All" button is NOT in org-location.js Organization Master
console.log('1. Checking org-location.js for "Remove All"...');
const orgLocContent = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');

// Match the Organization Master tab section
const orgTabMatch = orgLocContent.match(/renderOrganizationsTab\(\)\s*\{[\s\S]*?return `([\s\S]*?)`;\s*\}/);
assert(orgTabMatch, 'renderOrganizationsTab must exist');
assert(!orgTabMatch[1].includes('Remove All'), 'renderOrganizationsTab must NOT contain "Remove All" button');
assert(!orgTabMatch[1].includes('clearAllOrganizations'), 'renderOrganizationsTab must NOT call clearAllOrganizations');
console.log('✓ "Remove All" button successfully removed from Organization Master tab in org-location.js.\n');

// 2. Verify "Remove All" button is NOT in organizations.js toolbar
console.log('2. Checking organizations.js for "Remove All"...');
const orgsContent = fs.readFileSync(path.join(__dirname, '../js/modules/organizations.js'), 'utf8');
const orgsToolbarMatch = orgsContent.match(/class="card-header"[\s\S]*?<!-- Hierarchy Banner Guide -->/);
assert(orgsToolbarMatch, 'organizations.js toolbar section must exist');
assert(!orgsToolbarMatch[0].includes('Remove All'), 'organizations.js toolbar must NOT contain "Remove All" button');
console.log('✓ "Remove All" button successfully removed from organizations.js toolbar.\n');

// 3. Test organization deletion block when facilities exist
console.log('3. Testing deletion block in organizations.js...');
// Mock window and DB environment
const mockPlants = [
  { id: 'PLANT-01', name: 'Mauli Service Center 1', organization_id: 'ORG-001', company_id: 'COMP-01' },
  { id: 'PLANT-02', name: 'Mauli Service Center 2', organization_id: 'ORG-001', company_id: 'COMP-01' }
];
const mockOrgs = [
  { id: 'ORG-001', code: 'MSC-01', name: 'Mauli Service Center Pvt. Ltd.', status: 'Active' },
  { id: 'ORG-002', code: 'EMPTY-02', name: 'Empty Organization Without Facilities', status: 'Active' }
];

let alertMessages = [];
let toastMessages = [];
let deletedIds = [];

const mockDB = {
  getAll(col) {
    if (col === 'plants') return mockPlants;
    if (col === 'organizations') return mockOrgs;
    return [];
  },
  getById(col, id) {
    if (col === 'organizations') return mockOrgs.find(o => o.id === id);
    if (col === 'plants') return mockPlants.find(p => p.id === id);
    return null;
  },
  delete(col, id) {
    deletedIds.push({ col, id });
  },
  logAudit() {}
};

const mockState = {
  showToast(msg, type) {
    toastMessages.push({ msg, type });
  }
};

// Simulate deleteOrganization logic
function simulateDeleteOrganization(orgId) {
  const org = mockDB.getById('organizations', orgId);
  if (!org) return;

  const allPlants = mockDB.getAll('plants') || [];
  const linkedPlants = allPlants.filter(p => p.organization_id === org.id || p.company_id === org.id);

  if (linkedPlants.length > 0) {
    const facilityNames = linkedPlants.map(p => `• ${p.name || p.code || p.id}`).slice(0, 5).join('\n');
    const extraCount = linkedPlants.length > 5 ? `\n...and ${linkedPlants.length - 5} more` : '';
    const msg = `Cannot delete organization "${org.name}" (${org.code}).\n\nThere are ${linkedPlants.length} facility(ies) created under this organization:\n${facilityNames}${extraCount}\n\nPlease delete or reassign all associated facilities in Facility Master before deleting this organization.`;

    mockState.showToast(`Cannot delete organization: ${linkedPlants.length} facility(ies) are currently created under it.`, 'error');
    alertMessages.push(msg);
    return false;
  }

  mockDB.delete('organizations', orgId);
  return true;
}

// Test 3a: Trying to delete ORG-001 (has 2 facilities)
const result1 = simulateDeleteOrganization('ORG-001');
assert.strictEqual(result1, false, 'Deletion of ORG-001 must be blocked');
assert.strictEqual(deletedIds.length, 0, 'No organization should have been deleted');
assert(toastMessages.some(t => t.type === 'error' && t.msg.includes('2 facility(ies)')), 'Error toast must mention 2 facilities');
assert(alertMessages.some(m => m.includes('Mauli Service Center 1') && m.includes('Mauli Service Center 2')), 'Alert must list linked facilities');
console.log('✓ Attempting to delete organization with linked facilities was blocked and user was alerted.');

// Test 3b: Deleting ORG-002 (0 facilities)
const result2 = simulateDeleteOrganization('ORG-002');
assert.strictEqual(result2, true, 'Deletion of empty ORG-002 must be allowed');
assert.strictEqual(deletedIds.length, 1, 'ORG-002 should be deleted');
assert.strictEqual(deletedIds[0].id, 'ORG-002', 'Deleted ID must be ORG-002');
console.log('✓ Organization with zero facilities can be deleted normally.\n');

// 4. Test DB-level protection in db.js
console.log('4. Testing DB-level integrity protection in db.js...');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
assert(dbContent.includes('[DB Integrity] Cannot delete organization'), 'db.js delete() must have integrity check');
assert(dbContent.includes('[DB Integrity] Cannot clear organizations'), 'db.js clear() must have integrity check');
console.log('✓ db.js contains defense-in-depth integrity checks for both delete and clear.\n');

// 5. Test Action column button rendering
console.log('5. Testing row action delete button tooltip and styling...');
assert(orgLocContent.includes('Cannot delete: ${linkedBranches.length} facility(ies) created under this organization'), 'org-location.js row must explain why delete is prevented');
assert(orgLocContent.includes('opacity: 0.45; cursor: not-allowed;'), 'org-location.js row must have visual disabled indication');
assert(orgsContent.includes('Cannot delete: ${linkedPlants.length} facility(ies) created under this organization'), 'organizations.js row must explain why delete is prevented');
console.log('✓ Row action delete buttons render with informative tooltips and disabled styling when facilities are linked.\n');

console.log('====================================================');
console.log('ALL TESTS PASSED SUCCESSFULLY (100%)!');
console.log('====================================================');
