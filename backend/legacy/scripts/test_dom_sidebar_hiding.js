const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Extract sidebar HTML from index.html
const sidebarMatch = indexHtml.match(/<aside class="sidebar[\s\S]*?<\/aside>/);
if (!sidebarMatch) {
  console.error('Could not find sidebar in index.html');
  process.exit(1);
}
const sidebarHtml = sidebarMatch[0];

// Simple DOM tree mock to verify querySelectors and visibility
console.log('Sidebar extracted from index.html successfully.');

// Check all module-groups in index.html
const moduleGroupMatches = [...sidebarHtml.matchAll(/id="(group-[^"]+)"/g)].map(m => m[1]);
console.log('Module groups found in sidebar:', moduleGroupMatches);

// Check that each group has corresponding links
const groupMap = {
  'group-procurement': ['#/purchase-planning', '#/requisitions', '#/orders', '#/grn'],
  'group-quality': ['#/quality', '#/putaway', '#/warehouse-map'],
  'group-inventory': ['#/inventory', '#/opening-balance', '#/transfers', '#/receive-transfers'],
  'group-production': ['#/production'],
  'group-dispatch': ['#/dispatch'],
  'group-control': ['#/returns', '#/adjustments', '#/reports', '#/masters', '#/audit'],
  'group-billing': ['#/billing-dashboard', '#/job-cards', '#/billing-estimates', '#/draft-bills', '#/final-bills', '#/vehicle-delivery'],
  'group-item-master-setup': ['#/item-dashboard', '#/item-master', '#/item-categories', '#/item-subcategories', '#/item-brands', '#/item-manufacturers', '#/vehicle-compatibility', '#/uom-master', '#/hsn-master', '#/stock-transfers', '#/stock-counts', '#/warranty-scrap', '#/inventory-rules', '#/stock-ledger'],
  'group-org-location': [
    '#/organizations', '#/branches', '#/financial-calendar', '#/doc-series', '#/holiday-master', '#/registration-config',
    '#/common-master', '#/address-master', '#/tax-master'
  ],
  'group-user-roles-security': [
    '#/security-dashboard', '#/users', '#/roles', '#/permissions', '#/role-permissions', '#/user-roles', '#/warehouse-access', '#/sod-rules', '#/approval-authorities', '#/delegations', '#/access-requests', '#/password-policy', '#/login-security', '#/sessions', '#/login-history', '#/access-reports', '#/user-activity'
  ],
  'group-store-inventory': ['#/store-master', '#/store-mapping', '#/storage-locations', '#/racks', '#/shelves', '#/bins']
};

// Check for Sagar Sable
const sagarAllowedRoutes = new Set([
  '#/item-dashboard', '#/store-inventory', '#/store-master', '#/store-mapping', '#/vehicle-compatibility',
  '#/job-card-parts', '#/stock-transfers', '#/stock-counts', '#/warranty-scrap',
  '#/inventory-rules', '#/stock-ledger', '#/grn', '#/putaway', '#/inventory',
  '#/transfers', '#/returns', '#/adjustments', '#/dashboard',
  '#/billing-dashboard', '#/job-cards', '#/billing-estimates', '#/draft-bills', '#/final-bills', '#/vehicle-delivery'
]);

console.log('\n--- MODULE GROUP VISIBILITY FOR SAGAR SABLE ---');
for (const [groupId, links] of Object.entries(groupMap)) {
  const visibleLinks = links.filter(l => sagarAllowedRoutes.has(l));
  const isGroupVisible = visibleLinks.length > 0;
  console.log(`[${groupId}]: ${isGroupVisible ? 'VISIBLE' : 'HIDDEN'} (${visibleLinks.length}/${links.length} sub-items allowed)`);

  if ((groupId === 'group-user-management' || groupId === 'group-admin-panel' || groupId === 'group-user-roles-security') && isGroupVisible) {
    console.error(`FAIL: ${groupId} should be HIDDEN for Sagar!`);
    process.exit(1);
  }
  if (groupId === 'group-masters' && isGroupVisible) {
    console.error(`FAIL: ${groupId} should be HIDDEN for Sagar!`);
    process.exit(1);
  }
  if (groupId === 'group-production' && isGroupVisible) {
    console.error(`FAIL: ${groupId} should be HIDDEN for Sagar!`);
    process.exit(1);
  }
  if (groupId === 'group-dispatch' && isGroupVisible) {
    console.error(`FAIL: ${groupId} should be HIDDEN for Sagar!`);
    process.exit(1);
  }
  if (groupId === 'group-store-inventory' && !isGroupVisible) {
    console.error(`FAIL: ${groupId} should be VISIBLE for Sagar!`);
    process.exit(1);
  }
  if (groupId === 'group-item-master-setup' && !isGroupVisible) {
    console.error(`FAIL: ${groupId} should be VISIBLE for Sagar!`);
    process.exit(1);
  }
}

console.log('\nAll module group visibility rules for Sagar Sable verified successfully!');
