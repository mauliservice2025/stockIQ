/**
 * Test Suite for Sub-Module Pinning and Dynamic Pin Discovery
 * Validates that Opening Balance and any newly developed pages onwards have full Pin option.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failed++;
  }
}

console.log('========================================================');
console.log('RUNNING PIN OPTION VERIFICATION SUITE');
console.log('========================================================\n');

// Mock browser DOM
global.window = global;
global.window.location = { hash: '#/opening-balance' };

const storage = {
  userPinnedSubmodules: []
};

global.window.DB = {
  getUserPinnedSubmodules: (userId) => storage.userPinnedSubmodules.filter(p => p.user_id === userId),
  pinUserSubmodule: (userId, submoduleId) => {
    if (storage.userPinnedSubmodules.length >= 7) {
      return { success: false, code: 'LIMIT_REACHED', message: 'Maximum 7 sub-modules can be pinned.' };
    }
    const maxOrder = storage.userPinnedSubmodules.reduce((max, p) => Math.max(max, p.sort_order || 0), 0);
    const newPin = {
      id: `PIN-${Date.now()}-${Math.random()}`,
      user_id: userId,
      submodule_id: submoduleId,
      sort_order: maxOrder + 1,
      pinned_at: new Date().toISOString()
    };
    storage.userPinnedSubmodules.push(newPin);
    return { success: true, pin: newPin };
  },
  unpinUserSubmodule: (userId, submoduleId) => {
    storage.userPinnedSubmodules = storage.userPinnedSubmodules.filter(p => !(p.user_id === userId && p.submodule_id === submoduleId));
    return { success: true };
  },
  getMaxPinnedSubmodules: () => 7,
  subscribe: () => {}
};

global.window.State = {
  getCurrentUser: () => ({ id: 'USR-001', username: 'admin' }),
  showToast: () => {}
};

global.window.App = {
  canAccessRoute: () => true,
  getRequiredPermCode: (route) => 'INVENTORY',
  routes: {
    '#/dashboard': { title: 'Executive Operations Dashboard', section: 'Overview' },
    '#/inventory': { title: 'Central Inventory Stock', section: 'Inventory & Logistics' },
    '#/opening-balance': { title: 'Opening Balance Management', section: 'Inventory & Logistics' },
    '#/custom-future-page': { title: 'Future Custom Feature', section: 'Future Suite' }
  }
};

// Build mock DOM elements
const mockSidebar = {
  id: 'app-sidebar',
  children: [],
  querySelectorAll: (sel) => {
    return mockSidebarLinks;
  }
};

class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.classList = new Set();
    this.style = {};
    this.innerHTML = '';
  }
  set className(val) {
    this._className = val;
    this.classList = new Set((val || '').split(/\s+/).filter(Boolean));
  }
  get className() {
    return Array.from(this.classList).join(' ');
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
  }
  prepend(child) {
    child.parentElement = this;
    this.children.unshift(child);
  }
  querySelector(sel) {
    if (sel === '.sub-nav-title' && this.attributes['data-title']) {
      return { textContent: this.attributes['data-title'] };
    }
    if (sel === '.sidebar-sub-pin-btn') {
      return this.children.find(c => c.classList && c.classList.has('sidebar-sub-pin-btn')) || null;
    }
    return null;
  }
  querySelectorAll(sel) {
    if (sel.includes('.sidebar-sub-pin-btn')) {
      return this.children.filter(c => c.classList && c.classList.has('sidebar-sub-pin-btn'));
    }
    return [];
  }
  closest(sel) {
    if (sel === '.module-group') {
      return {
        querySelector: (subSel) => {
          if (subSel === '.module-header-title') return { textContent: 'Inventory & Logistics' };
          if (subSel === '.module-header-icon') return { textContent: '🏬' };
          return null;
        }
      };
    }
    return null;
  }
  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter(c => c !== this);
    }
  }
}

// Create mock links in sidebar
const linkInventory = new MockElement('a');
linkInventory.setAttribute('href', '#/inventory');
linkInventory.setAttribute('data-title', 'Stock Balances');
linkInventory.classList.add('sub-nav-item');

const linkOpeningBalance = new MockElement('a');
linkOpeningBalance.setAttribute('href', '#/opening-balance');
linkOpeningBalance.setAttribute('data-title', 'Opening Balance');
linkOpeningBalance.classList.add('sub-nav-item');

const linkFuturePage = new MockElement('a');
linkFuturePage.setAttribute('href', '#/custom-future-page');
linkFuturePage.setAttribute('data-title', 'Future Custom Feature');
linkFuturePage.classList.add('sub-nav-item');

const mockSidebarLinks = [linkInventory, linkOpeningBalance, linkFuturePage];

const mockPinnedBar = new MockElement('div');
mockPinnedBar.id = 'pinned-submodules-bar';

const mockPageActions = new MockElement('div');
mockPageActions.id = 'page-actions-container';

global.document = {
  getElementById: (id) => {
    if (id === 'app-sidebar') return mockSidebar;
    if (id === 'pinned-submodules-bar') return mockPinnedBar;
    if (id === 'page-actions-container') return mockPageActions;
    if (id === 'header-screen-pin-btn') return mockPageActions.children.find(c => c.id === 'header-screen-pin-btn') || null;
    return null;
  },
  createElement: (tag) => new MockElement(tag),
  body: new MockElement('body'),
  addEventListener: () => {}
};

// 1. Load PinnedSubmodulesModule
const pinnedCode = fs.readFileSync(path.join(rootDir, 'js/modules/pinned-submodules.js'), 'utf-8');
eval(pinnedCode);

assert(typeof window.PinnedSubmodulesModule === 'object', 'PinnedSubmodulesModule is instantiated on window');

// Test 1: Opening Balance registration
console.log('\n1. Checking Opening Balance canonical registration:');
const obSub = window.PinnedSubmodulesModule.getSubmoduleById('opening-balance');
assert(obSub !== null, 'Opening Balance submodule found by ID "opening-balance"');
assert(obSub && obSub.title === 'Opening Balance', 'Title is "Opening Balance"');
assert(obSub && obSub.route === '#/opening-balance', 'Route is "#/opening-balance"');
assert(obSub && obSub.group === 'Inventory & Logistics', 'Group is "Inventory & Logistics"');

// Test 2: Sub-route aliases
console.log('\n2. Checking Opening Balance sub-route aliases:');
const aliasInv = window.PinnedSubmodulesModule.getSubmoduleByRoute('#/inventory-opening');
const aliasCfg = window.PinnedSubmodulesModule.getSubmoduleByRoute('#/opening-balance-config');
assert(aliasInv && aliasInv.id === 'opening-balance', '#/inventory-opening maps to opening-balance');
assert(aliasCfg && aliasCfg.id === 'opening-balance', '#/opening-balance-config maps to opening-balance');

// Test 3: Attaching sidebar pin icons
console.log('\n3. Checking Sidebar Pin Icon attachment on Opening Balance:');
window.PinnedSubmodulesModule.attachSidebarPinIcons();

const obPinBtn = linkOpeningBalance.querySelector('.sidebar-sub-pin-btn');
assert(obPinBtn !== null, 'Pin button (.sidebar-sub-pin-btn) is attached to #nav-item-opening-balance');
assert(obPinBtn && obPinBtn.attributes['data-submodule-id'] === 'opening-balance', 'Pin button data-submodule-id is "opening-balance"');

// Test 4: Pinning Opening Balance
console.log('\n4. Testing Pinning Opening Balance action:');
assert(!window.PinnedSubmodulesModule.isSubmodulePinned('opening-balance'), 'Initially not pinned');
window.PinnedSubmodulesModule.togglePin('opening-balance');
assert(window.PinnedSubmodulesModule.isSubmodulePinned('opening-balance'), 'After toggle, isSubmodulePinned("opening-balance") is true');
assert(mockPinnedBar.innerHTML.includes('Opening Balance'), 'Pinned bar renders Opening Balance chip');
assert(mockPinnedBar.innerHTML.includes('#/opening-balance'), 'Pinned bar chip links to #/opening-balance');

// Test 5: Screen Header Pin Button
console.log('\n5. Checking Screen Header Pin Toggle Button:');
window.location.hash = '#/opening-balance';
window.PinnedSubmodulesModule.updateScreenHeaderPinButton();
const headerPinBtn = mockPageActions.children.find(c => c.id === 'header-screen-pin-btn');
assert(headerPinBtn !== null, 'Screen header pin button (#header-screen-pin-btn) created in #page-actions-container');
assert(headerPinBtn && headerPinBtn.innerHTML.includes('Pinned'), 'Header pin button shows "Pinned" state');

// Unpin test
window.PinnedSubmodulesModule.togglePin('opening-balance');
assert(!window.PinnedSubmodulesModule.isSubmodulePinned('opening-balance'), 'Unpinned successfully');
assert(headerPinBtn && headerPinBtn.innerHTML.includes('Pin to Top Bar'), 'Header pin button updates to "Pin to Top Bar"');

// Test 6: "All new developed pages onwards" Dynamic Discovery
console.log('\n6. Checking "All new developed pages onwards" Dynamic Discovery:');
// Verify future page in mock sidebar
const futureSub = window.PinnedSubmodulesModule.getSubmoduleByRoute('#/custom-future-page');
assert(futureSub !== null, 'Future newly developed page auto-discovered without hardcoded entry');
assert(futureSub && futureSub.title === 'Future Custom Feature', 'Auto-discovered title is "Future Custom Feature"');

const futurePinBtn = linkFuturePage.querySelector('.sidebar-sub-pin-btn');
assert(futurePinBtn !== null, 'Future page automatically receives sidebar Pin button');

window.PinnedSubmodulesModule.togglePin(futureSub.id);
assert(window.PinnedSubmodulesModule.isSubmodulePinned(futureSub.id), 'Future page can be pinned to top bar');
assert(mockPinnedBar.innerHTML.includes('Future Custom Feature'), 'Future page chip appears in Pinned bar');

console.log('\n========================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
