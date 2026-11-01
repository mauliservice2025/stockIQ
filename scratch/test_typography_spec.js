const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: TYPOGRAPHY SPECIFICATION COMPLIANCE ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. Check index.html Google Fonts link
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(indexHtml.includes('family=Inter:wght@400;500;600;700;800'), 'index.html imports Google Font Inter (400, 500, 600, 700, 800)');

// 2. Check css/variables.css
const varsCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'variables.css'), 'utf8');
assert(varsCss.includes('@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800'), 'css/variables.css has @import for Inter');
assert(varsCss.includes("--font-sans: 'Inter'"), 'css/variables.css sets --font-sans to Inter');
assert(varsCss.includes('--fs-page-title: 20px'), 'css/variables.css defines --fs-page-title: 20px');
assert(varsCss.includes('--fs-menu-heading: 13px'), 'css/variables.css defines --fs-menu-heading: 13px');
assert(varsCss.includes('--fs-sidebar-menu: 14px'), 'css/variables.css defines --fs-sidebar-menu: 14px');
assert(varsCss.includes('--fs-table-header: 13px'), 'css/variables.css defines --fs-table-header: 13px');
assert(varsCss.includes('--fs-table-data: 14px'), 'css/variables.css defines --fs-table-data: 14px');
assert(varsCss.includes('--fs-status: 12px'), 'css/variables.css defines --fs-status: 12px');
assert(varsCss.includes('--fs-placeholder: 14px'), 'css/variables.css defines --fs-placeholder: 14px');

// 3. Check css/layout.css and css/components.css for 12 specified elements
const layoutCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'layout.css'), 'utf8');
const compCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'components.css'), 'utf8');

// Spec 1: Page Title - Common Master (Inter 20px, 700 / Bold)
assert(
  (layoutCss.includes('.page-title') && layoutCss.includes('font-size: 20px') && layoutCss.includes('font-weight: 700')) &&
  (compCss.includes('.page-title') && compCss.includes('font-size: 20px !important') && compCss.includes('font-weight: 700 !important')),
  'Spec 1 - Page Title: Inter 20px 700/Bold enforced in layout and components'
);

// Spec 2: Section/Menu Heading - MASTERS (Inter 13px, 600 / Semi-bold)
assert(
  compCss.includes('.module-header') && compCss.includes('.module-header-title') && compCss.includes('font-size: 13px !important') && compCss.includes('font-weight: 600 !important'),
  'Spec 2 - Section/Menu Heading: Inter 13px 600/Semi-bold enforced'
);

// Spec 3: Sidebar Menu (Inter 14px, 400-500)
assert(
  compCss.includes('.sidebar .sub-nav-item') && compCss.includes('font-size: 14px !important') && compCss.includes('font-weight: 500 !important'),
  'Spec 3 - Sidebar Menu: Inter 14px 400-500 enforced'
);

// Spec 4: Selected Menu (Inter 14px, 600)
assert(
  compCss.includes('.sidebar .sub-nav-item.active') && compCss.includes('font-size: 14px !important') && compCss.includes('font-weight: 600 !important'),
  'Spec 4 - Selected Menu: Inter 14px 600 enforced'
);

// Spec 5: Form Label - Type (Inter 13-14px, 500)
assert(
  compCss.includes('.form-label') && (compCss.includes('font-size: 13.5px !important') || compCss.includes('font-size: 14px !important')) && compCss.includes('font-weight: 500 !important'),
  'Spec 5 - Form Label - Type: Inter 13-14px 500 enforced'
);

// Spec 6: Dropdown Text (Inter 14px, 400-500)
assert(
  compCss.includes('select') && compCss.includes('select.form-control') && compCss.includes('font-size: 14px !important') && compCss.includes('font-weight: 400 !important'),
  'Spec 6 - Dropdown Text: Inter 14px 400-500 enforced'
);

// Spec 7: Table Header (Inter 13px, 600)
assert(
  compCss.includes('.data-table th') && compCss.includes('font-size: 13px !important') && compCss.includes('font-weight: 600 !important'),
  'Spec 7 - Table Header: Inter 13px 600 enforced'
);

// Spec 8: Table Data (Inter 14px, 400)
assert(
  compCss.includes('.data-table td') && compCss.includes('font-size: 14px !important') && compCss.includes('font-weight: 400'),
  'Spec 8 - Table Data: Inter 14px 400 enforced'
);

// Spec 9: Status - Active (Inter 12px, 500-600)
assert(
  compCss.includes('.status-pill') && compCss.includes('font-size: 12px !important') && compCss.includes('font-weight: 600 !important'),
  'Spec 9 - Status - Active: Inter 12px 500-600 enforced'
);

// Spec 10: Breadcrumb (Inter 12-13px, 400-500)
assert(
  compCss.includes('.breadcrumbs') && compCss.includes('font-size: 13px !important') && compCss.includes('font-weight: 400 !important'),
  'Spec 10 - Breadcrumb: Inter 12-13px 400-500 enforced'
);

// Spec 11: Search Placeholder (Inter 14px, 400)
assert(
  compCss.includes('::placeholder') && compCss.includes('font-size: 14px !important') && compCss.includes('font-weight: 400 !important'),
  'Spec 11 - Search Placeholder: Inter 14px 400 enforced'
);

// Spec 12: Pagination (Inter 12-13px, 400-500)
assert(
  compCss.includes('.user-pagination-bar') && compCss.includes('font-size: 13px !important') && compCss.includes('font-weight: 400 !important') &&
  compCss.includes('.pagination-buttons .btn') && (compCss.includes('font-size: 12.5px !important') || compCss.includes('font-size: 13px !important')),
  'Spec 12 - Pagination: Inter 12-13px 400-500 enforced'
);

// 4. Verify Common Lookup Master module
const clmJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'common-lookup-master.js'), 'utf8');
assert(clmJs.includes('Type:</label>') || clmJs.includes('Type:'), 'Common Lookup Master renders Type label');
assert(clmJs.includes('id="common-lookup-type-select"') && clmJs.includes('font-size: 14px'), 'Common Lookup Master Type select is 14px');
assert(clmJs.includes('cell-strong') && clmJs.includes('font-size: 14px'), 'Common Lookup Master table data name cell is 14px');
assert(clmJs.includes('font-size: 13px') && clmJs.includes('Showing'), 'Common Lookup Master pagination text is 13px');

console.log(`\nResults: ${passCount} PASSED, ${failCount} FAILED.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL TYPOGRAPHY CHECKS PASSED PERFECTLY!\n');
}
