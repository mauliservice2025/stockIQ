// Test script: Verify Layout, No Duplication, and Master List on Top
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('VERIFYING MASTER LIST ON TOP, NO DUPLICATION & FULL SCREEN');
console.log('================================================================\n');

// 1. Check index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
if (indexHtml.includes('id="page-top-bar"')) {
  console.log('[PASS] index.html: div.page-top-bar has id="page-top-bar" for programmatic toggling.');
} else {
  console.error('[FAIL] index.html missing id="page-top-bar".');
  process.exit(1);
}

// 2. Check js/app.js routing logic
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
if (appJs.includes("routeConfig.section === 'Admin Pannel'") && appJs.includes("isTopTabsModule")) {
  console.log('[PASS] js/app.js: Router cleanly hides pageTopBar (breadcrumbs + h1 title) for Organization & Location.');
} else {
  console.error('[FAIL] js/app.js does not contain proper pageTopBar toggling logic.');
  process.exit(1);
}

// 3. Check js/modules/org-location.js for card-title removal
const orgLocJs = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');
const cardTitleMatches = orgLocJs.match(/<div class="card-title">/g);
if (!cardTitleMatches || cardTitleMatches.length === 0) {
  console.log('[PASS] js/modules/org-location.js: All redundant <div class="card-title"> elements removed from all 7 tabs!');
} else {
  console.error(`[FAIL] Found ${cardTitleMatches.length} remaining card-title elements in org-location.js.`);
  process.exit(1);
}

// 4. Check that tabs header is positioned on top with sleek styling
if (orgLocJs.includes('class="tabs-header" style="margin-top: 4px; margin-bottom: 16px; overflow-x: auto;"')) {
  console.log('[PASS] js/modules/org-location.js: Master tabs list is styled directly on top.');
} else {
  console.error('[FAIL] tabs-header missing sleek top styling.');
  process.exit(1);
}

// 5. Check js/modules/organizations.js for card-title removal
const orgsJs = fs.readFileSync(path.join(__dirname, '../js/modules/organizations.js'), 'utf8');
const orgCardTitleMatches = orgsJs.match(/<div class="card-title">/g);
if (!orgCardTitleMatches || orgCardTitleMatches.length === 0) {
  console.log('[PASS] js/modules/organizations.js: Redundant <div class="card-title"> removed from standalone OrganizationModule.');
} else {
  console.error(`[FAIL] Found ${orgCardTitleMatches.length} remaining card-title elements in organizations.js.`);
  process.exit(1);
}

// 6. Simulate DOM and verify tab rendering for all 7 masters
global.window = {
  location: { hash: '#/bins' },
  DB: {
    getAll(tbl) {
      if (tbl === 'organizations') return [{ id: 'ORG-001', code: 'PATIL-AUTO', name: 'Patil Auto Dynamics', status: 'Active' }];
      if (tbl === 'plants') return [{ id: 'PLANT-001', code: 'PUN-01', name: 'Pune Plant', organization_id: 'ORG-001', status: 'Active' }];
      if (tbl === 'warehouses') return [{ id: 'WH-001', code: 'RMS-01', name: 'Raw Materials Store', plant_id: 'PLANT-001', status: 'Active' }];
      if (tbl === 'zones') return [{ id: 'Z-001', code: 'Z-A', name: 'Zone A', warehouse_id: 'WH-001', status: 'Active' }];
      if (tbl === 'racks') return [{ id: 'R-001', code: 'R-01', name: 'Rack 1', warehouse_id: 'WH-001', status: 'Active' }];
      if (tbl === 'shelves') return [{ id: 'S-001', code: 'S-01', name: 'Shelf 1', rack_id: 'R-001', status: 'Active' }];
      if (tbl === 'bins') return [{ id: 'B-001', code: 'RMS-A01-S1-B1', rack: 'R-01', shelf: 'S-01', bin: 'B-01', warehouse_id: 'WH-001', status: 'Active' }];
      return [];
    }
  }
};

const mockContainer = { innerHTML: '' };
const mockTopBar = { style: { display: '' } };

global.document = {
  getElementById(id) {
    if (id === 'view-container') return mockContainer;
    if (id === 'page-top-bar') return mockTopBar;
    return null;
  },
  querySelector(sel) {
    if (sel === '.page-top-bar') return mockTopBar;
    return null;
  }
};

// Load OrgLocationModule
eval(orgLocJs);

const tabs = ['ORGANIZATIONS', 'BRANCHES', 'STORES', 'LOCATIONS', 'RACKS', 'SHELVES', 'BINS'];
for (const tab of tabs) {
  window.OrgLocationModule.activeTab = tab;
  window.OrgLocationModule.render(mockContainer);
  
  // Verify top bar was hidden
  if (mockTopBar.style.display !== 'none') {
    console.error(`[FAIL] page-top-bar was not hidden when rendering tab ${tab}`);
    process.exit(1);
  }

  // Verify content has no card-title
  if (mockContainer.innerHTML.includes('card-title')) {
    console.error(`[FAIL] card-title found in rendered HTML for tab ${tab}`);
    process.exit(1);
  }

  // Verify tabs-header is present at top
  if (!mockContainer.innerHTML.includes('tabs-header')) {
    console.error(`[FAIL] tabs-header missing in rendered HTML for tab ${tab}`);
    process.exit(1);
  }
}

console.log('[PASS] DOM simulation: page-top-bar is hidden, tabs-header is on top, and no duplicate card-titles across all 7 masters!');
console.log('\n================================================================');
console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
console.log('================================================================');
