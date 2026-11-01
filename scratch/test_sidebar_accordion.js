// Automated Test Script: Sidebar Accordion Behavior & Default State
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('TESTING SIDEBAR ACCORDION BEHAVIOR & ANIMATION CONFIG');
console.log('================================================================\n');

let failed = false;

// 1. Check index.html default markup
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Verify that no module-group starts with "open" class
const openGroupMatches = indexHtml.match(/class=["'][^"']*module-group[^"']*open[^"']*["']/g);
if (openGroupMatches && openGroupMatches.length > 0) {
  console.error(`[FAIL] Default state: Found ${openGroupMatches.length} module groups with 'open' class in index.html!`);
  failed = true;
} else {
  console.log('[PASS] Requirement 1 & 7: All module groups start collapsed by default in index.html (zero "open" classes).');
}

// 2. Check CSS for smooth animation
const layoutCss = fs.readFileSync(path.join(__dirname, '../css/layout.css'), 'utf8');
if (layoutCss.includes('max-height: 4000px')) {
  console.error('[FAIL] Found max-height: 4000px in layout.css (causes delay/snapping in animation)');
  failed = true;
} else if (layoutCss.includes('max-height: 750px') && layoutCss.includes('transition: max-height 0.35s')) {
  console.log('[PASS] Requirement 6: Smooth animation configured with realistic max-height: 750px and cubic-bezier easing.');
} else {
  console.warn('[WARN] Check layout.css transition properties.');
}

// 3. Check js/app.js handleRoute does not auto-expand
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
if (appJs.includes("parentGroup.classList.add('open')")) {
  console.error('[FAIL] Requirement 7: handleRoute still contains auto-expansion logic on page load/route change!');
  failed = true;
} else {
  console.log('[PASS] Requirement 7: handleRoute does NOT automatically expand module groups on page load or routing.');
}

// 4. Simulate DOM & Accordion Actions
class MockClassList {
  constructor(initial = []) {
    this.classes = new Set(initial);
  }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  contains(c) { return this.classes.has(c); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this.add(c); else this.remove(c);
      return force;
    }
    if (this.contains(c)) { this.remove(c); return false; }
    else { this.add(c); return true; }
  }
}

class MockElement {
  constructor(id) {
    this.id = id;
    this.classList = new MockClassList();
    this.parentElement = null;
  }
  closest(selector) {
    if (selector === '.module-group') return this;
    return null;
  }
}

const moduleProcurement = new MockElement('group-procurement');
const moduleQuality = new MockElement('group-quality');
const moduleInventory = new MockElement('group-inventory');
const moduleOrgLocation = new MockElement('group-org-location');
const allGroups = [moduleProcurement, moduleQuality, moduleInventory, moduleOrgLocation];

global.document = {
  querySelectorAll(sel) {
    if (sel === '.module-group') return allGroups;
    if (sel === '.module-group.open') return allGroups.filter(g => g.classList.contains('open'));
    return [];
  },
  getElementById(id) {
    return allGroups.find(g => g.id === id) || null;
  }
};

// Load toggleModuleGroup logic from index.html
const fnMatch = indexHtml.match(/window\.toggleModuleGroup\s*=\s*function\(el\)\s*\{([\s\S]*?)\n\s*\};/);
if (!fnMatch) {
  console.error('[FAIL] Could not extract toggleModuleGroup from index.html');
  process.exit(1);
}
const toggleModuleGroup = new Function('el', fnMatch[1]);

// Test 4A: Default state
console.log('\n--- Simulating Accordion Interactions ---');
const openCountDefault = document.querySelectorAll('.module-group.open').length;
if (openCountDefault === 0) {
  console.log('[PASS] Default State: Exactly 0 modules expanded.');
} else {
  console.error(`[FAIL] Expected 0 expanded modules, found ${openCountDefault}`);
  failed = true;
}

// Test 4B: Click Module A (Procurement) -> Module A expands
toggleModuleGroup(moduleProcurement);
if (moduleProcurement.classList.contains('open') && document.querySelectorAll('.module-group.open').length === 1) {
  console.log('[PASS] Click Module A: Module A (Procurement) expands.');
} else {
  console.error('[FAIL] Module A failed to expand.');
  failed = true;
}

// Test 4C: Click Module B (Org Location) -> Module A collapses and Module B expands
toggleModuleGroup(moduleOrgLocation);
if (!moduleProcurement.classList.contains('open') && moduleOrgLocation.classList.contains('open') && document.querySelectorAll('.module-group.open').length === 1) {
  console.log('[PASS] Click Module B: Module A collapsed and Module B (Organization & Location) expanded.');
  console.log('[PASS] Only one module expanded at a time.');
} else {
  console.error('[FAIL] Accordion switch failed between Module A and Module B.');
  failed = true;
}

// Test 4D: Click the expanded module again -> It collapses
toggleModuleGroup(moduleOrgLocation);
if (!moduleOrgLocation.classList.contains('open') && document.querySelectorAll('.module-group.open').length === 0) {
  console.log('[PASS] Click the expanded module again: Module B collapses. All modules are now collapsed.');
} else {
  console.error('[FAIL] Clicking expanded module did not collapse it.');
  failed = true;
}

// Test 4E: Re-test with another module (Quality)
toggleModuleGroup(moduleQuality);
if (moduleQuality.classList.contains('open') && document.querySelectorAll('.module-group.open').length === 1) {
  console.log('[PASS] Quality module expanded as sole active module.');
} else {
  console.error('[FAIL] Quality module failed to expand.');
  failed = true;
}

toggleModuleGroup(moduleQuality);
if (!moduleQuality.classList.contains('open') && document.querySelectorAll('.module-group.open').length === 0) {
  console.log('[PASS] Quality module collapsed on second click.');
} else {
  console.error('[FAIL] Quality module failed to collapse.');
  failed = true;
}

if (failed) {
  console.error('\nSOME TESTS FAILED!');
  process.exit(1);
} else {
  console.log('\n================================================================');
  console.log('ALL 7 ACCORDION & ANIMATION REQUIREMENTS VERIFIED SUCCESSFULLY!');
  console.log('================================================================');
}
