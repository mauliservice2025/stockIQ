const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing KPI Cards Single Line CSS & JS implementations...');

// 1. Verify css/components.css
const cssPath = path.join(__dirname, '..', 'css', 'components.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Check that line 2061 exclusion contains :not(.kpi-grid):not(.dash-kpi-grid)
assert(
  cssContent.includes(':not(.kpi-grid):not(.dash-kpi-grid)'),
  'FAIL: css/components.css missing :not(.kpi-grid):not(.dash-kpi-grid) in main-content selector'
);
console.log('✔ Passed: css/components.css excludes .kpi-grid and .dash-kpi-grid from flex column override');

// Check that explicit .kpi-grid styles exist with display: grid !important and repeat(4, 1fr)
assert(
  cssContent.includes('.kpi-grid,\n.main-content > .kpi-grid,\n.main-content > div.kpi-grid') &&
  cssContent.includes('grid-template-columns: repeat(4, 1fr) !important;'),
  'FAIL: css/components.css missing explicit .kpi-grid 4-column rule'
);
console.log('✔ Passed: css/components.css has explicit .kpi-grid repeat(4, 1fr) !important rule');

// 2. Verify js/modules/inventory.js
const invPath = path.join(__dirname, '..', 'js', 'modules', 'inventory.js');
const invContent = fs.readFileSync(invPath, 'utf8');
assert(
  invContent.includes('<div class="kpi-grid" style="display: grid !important; grid-template-columns: repeat(4, 1fr) !important;'),
  'FAIL: inventory.js missing inline 4-column grid style on kpi-grid'
);
console.log('✔ Passed: js/modules/inventory.js has inline 4-column grid style on kpi-grid');

// 3. Verify js/modules/purchase-planning.js
const ppPath = path.join(__dirname, '..', 'js', 'modules', 'purchase-planning.js');
const ppContent = fs.readFileSync(ppPath, 'utf8');
assert(
  ppContent.includes('<div class="kpi-grid" style="display: grid !important; grid-template-columns: repeat(4, 1fr) !important;'),
  'FAIL: purchase-planning.js missing inline 4-column grid style on kpi-grid'
);
console.log('✔ Passed: js/modules/purchase-planning.js has inline 4-column grid style on kpi-grid');

// 4. Verify js/modules/dashboard.js
const dashPath = path.join(__dirname, '..', 'js', 'modules', 'dashboard.js');
const dashContent = fs.readFileSync(dashPath, 'utf8');
assert(
  dashContent.includes('<div class="kpi-grid" style="display: grid !important; grid-template-columns: repeat(4, 1fr) !important;'),
  'FAIL: dashboard.js missing inline 4-column grid style on kpi-grid'
);
console.log('✔ Passed: js/modules/dashboard.js has inline 4-column grid style on kpi-grid');

console.log('\nAll KPI Card Single Line tests PASSED successfully!');
