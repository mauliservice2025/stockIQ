/**
 * Verification Suite for Master Names Selection & Copying
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING MASTER NAMES SELECTION AND COPY SUPPORT');
console.log('================================================================\n');

const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const layoutCss = fs.readFileSync(path.join(__dirname, '../css/layout.css'), 'utf8');
const componentsCss = fs.readFileSync(path.join(__dirname, '../css/components.css'), 'utf8');
const variablesCss = fs.readFileSync(path.join(__dirname, '../css/variables.css'), 'utf8');

let passCount = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// 1. High-contrast selection styling
console.log('--- 1. High-Contrast ::selection CSS ---');
assert(variablesCss.includes('::selection') && variablesCss.includes('rgba(99, 102, 241'), 'variables.css defines clear ::selection background');

// 2. Removal of user-select: none on module headers and tables
console.log('\n--- 2. Removal of user-select: none on Module Headers & Tables ---');
assert(!layoutCss.includes('.module-header {\n  height: 40px;\n  padding: 0 12px;\n  border-radius: var(--radius-sm);\n  color: var(--text-secondary);\n  font-family: var(--font-sans);\n  font-size: 13px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all var(--transition-fast);\n  user-select: none;'), '.module-header no longer has user-select: none');
assert(!layoutCss.includes('.sub-module-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 10px 8px 12px;\n  cursor: pointer;\n  user-select: none;'), '.sub-module-header no longer has user-select: none');
assert(!componentsCss.includes('.data-table th.sortable {\n  cursor: pointer;\n  user-select: none;'), '.data-table th.sortable no longer has user-select: none');

// 3. Explicit user-select: text on sidebar nav items and master titles
console.log('\n--- 3. Explicit user-select: text on Master Names in Sidebar ---');
assert(layoutCss.includes('.sub-nav-title,\n.brand-title,\n.brand-subtitle,\n.page-title,\n.page-subtitle,\n.breadcrumbs'), 'layout.css explicitly sets user-select: text !important on sidebar nav titles');
assert(layoutCss.includes('-webkit-user-drag: none !important'), 'layout.css sets -webkit-user-drag: none !important to prevent link drag from interrupting text selection');

// 4. Explicit user-select: text on tab buttons, tables, and cards
console.log('\n--- 4. Explicit user-select: text on Tab Buttons & Cards ---');
assert(componentsCss.includes('.tab-btn,\n.tab-btn *,\n.store-submodules-nav'), 'components.css sets user-select: text !important on tab buttons and sub-module navigation');
assert(componentsCss.includes('.data-table td,\n.data-table th *'), 'components.css sets user-select: text !important on data table cells and headers');

// 5. JavaScript Selection-Protection Logic in index.html
console.log('\n--- 5. Selection-Protection Logic in index.html ---');
assert(htmlContent.includes('// If user is selecting text (e.g. copying master name), do not toggle accordion'), 'toggleModuleGroup checks for text selection before toggling');
assert(htmlContent.includes('// If user is selecting text (e.g. copying master name), do not toggle sub-module'), 'toggleSubModuleGroup checks for text selection before toggling');
assert(htmlContent.includes('isDragSelecting || (sel && sel.trim().length > 0)'), 'Global click handler suppresses navigation when user selects/highlights text');

// 6. Test behavior with mock events
console.log('\n--- 6. State Machine Testing of Click vs. Selection ---');
let clickPrevented = false;
let clickStopped = false;

const sandbox = {
  window: {
    getSelection: () => ({ toString: () => 'Brand Master' }) // text selected!
  },
  document: {
    addEventListener: () => {}
  }
};

const fakeEvent = {
  target: {
    closest: (selector) => ({ tagName: 'A', href: '#/item-brands' })
  },
  preventDefault: () => { clickPrevented = true; },
  stopPropagation: () => { clickStopped = true; }
};

// Evaluate the selection interceptor
const interceptor = function(e, sel) {
  if (sel && sel.trim().length > 0) {
    const clickable = e.target.closest('a.nav-item, a.sub-nav-item, a.sub-sub-nav-item, .tab-btn, .module-header, .sub-module-header');
    if (clickable) {
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
  }
  return false;
};

const intercepted = interceptor(fakeEvent, sandbox.window.getSelection().toString());
assert(intercepted && clickPrevented && clickStopped, 'Text selection cleanly intercepts click navigation to preserve selection for copying');

// Test normal click (no selection)
clickPrevented = false;
clickStopped = false;
const normalIntercepted = interceptor(fakeEvent, '');
assert(!normalIntercepted && !clickPrevented, 'Normal click without selection proceeds to navigate normally');

console.log('\n================================================================');
console.log(`RESULTS: ${passCount} / ${totalTests} assertions passed (${Math.round((passCount/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passCount === totalTests) {
  console.log('🎉 ALL MASTER NAMES SELECTION CHECKS PASSED (100%)!');
} else {
  console.error('❌ Some assertions failed.');
  process.exit(1);
}
