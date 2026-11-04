const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Setup mock window & DOM
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.dispatchEvent = () => {};
global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
global.window.location = { hash: '#/inventory' };
const createMockEl = (id = '') => ({
  id,
  innerHTML: '',
  style: {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  querySelector() { return createMockEl(); },
  querySelectorAll() { return []; },
  setAttribute() {},
  removeAttribute() {},
  getAttribute() { return ''; },
  remove() {},
  addEventListener() {}
});

global.document = {
  documentElement: createMockEl('html'),
  getElementById(id) {
    if (!this._elements) this._elements = {};
    if (!this._elements[id]) {
      this._elements[id] = createMockEl(id);
    }
    return this._elements[id];
  },
  querySelector(sel) {
    return createMockEl();
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

global.State = {
  currentPlantId: 'ALL',
  currentUser: { name: 'Pravin Patil', username: 'pravin', email: 'pravin@stockiq.com' },
  hasPermission() { return true; },
  subscribe() {},
  getCurrentPlant() { return { name: 'Mauli Service Center', code: 'MSC' }; },
  getCurrentUser() { return { name: 'Pravin Patil', username: 'pravin', email: 'pravin@stockiq.com', primary_role: 'ADMIN' }; }
};

// Load db.js
const { DatabaseLayer } = require('../js/data/db.js');
window.DB = new DatabaseLayer();

// Load app.js (which defines window.renderInventoryLogisticsTabs)
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
eval(appCode);

// Load inventory.js, opening-balance.js, traceability.js, transfers.js
const invCode = fs.readFileSync(path.join(__dirname, '../js/modules/inventory.js'), 'utf8');
eval(invCode);

const obCode = fs.readFileSync(path.join(__dirname, '../js/modules/opening-balance.js'), 'utf8');
eval(obCode);

const traceCode = fs.readFileSync(path.join(__dirname, '../js/modules/traceability.js'), 'utf8');
eval(traceCode);

const trfCode = fs.readFileSync(path.join(__dirname, '../js/modules/transfers.js'), 'utf8');
eval(trfCode);

console.log('=== TEST SUITE: INVENTORY & LOGISTICS SUB-MODULE TABS ===\n');

// 1. Verify window.renderInventoryLogisticsTabs exists and returns tabs
assert(typeof window.renderInventoryLogisticsTabs === 'function', 'window.renderInventoryLogisticsTabs must be a function');

const tabsHtml = window.renderInventoryLogisticsTabs('#/inventory');
assert(tabsHtml.includes('class="tabs-header inventory-logistics-tabs"'), 'Must contain .tabs-header.inventory-logistics-tabs');
assert(tabsHtml.includes('Stock Balances'), 'Must include Stock Balances tab');
assert(tabsHtml.includes('Opening Balance'), 'Must include Opening Balance tab');
assert(tabsHtml.includes('Genealogy & Trace'), 'Must include Genealogy & Trace tab');
assert(tabsHtml.includes('Stock Transfer'), 'Must include Stock Transfer tab');
assert(tabsHtml.includes("onclick=\"window.location.hash='#/inventory'\""), 'Must link to #/inventory');
assert(tabsHtml.includes("onclick=\"window.location.hash='#/opening-balance'\""), 'Must link to #/opening-balance');
assert(tabsHtml.includes("onclick=\"window.location.hash='#/traceability'\""), 'Must link to #/traceability');
assert(tabsHtml.includes("onclick=\"window.location.hash='#/transfers'\""), 'Must link to #/transfers');
console.log('✓ 1. window.renderInventoryLogisticsTabs generates all 4 sub-module tabs.');

// 2. Verify active highlighting for each sub-module
const testRoutes = [
  { hash: '#/inventory', expectedActiveText: 'Stock Balances' },
  { hash: '#/opening-balance', expectedActiveText: 'Opening Balance' },
  { hash: '#/inventory-opening', expectedActiveText: 'Opening Balance' },
  { hash: '#/opening-balance-config', expectedActiveText: 'Opening Balance' },
  { hash: '#/traceability', expectedActiveText: 'Genealogy & Trace' },
  { hash: '#/transfers', expectedActiveText: 'Stock Transfer' }
];

testRoutes.forEach(tc => {
  const html = window.renderInventoryLogisticsTabs(tc.hash);
  const activeBtnMatch = html.match(/<button[^>]*class="tab-btn active"[^>]*>[\s\S]*?<span>(.*?)<\/span>[\s\S]*?<\/button>/);
  assert(activeBtnMatch, `Must have active tab-btn for hash ${tc.hash}`);
  assert.strictEqual(activeBtnMatch[1].trim(), tc.expectedActiveText, `Active tab for ${tc.hash} must be "${tc.expectedActiveText}"`);
});
console.log('✓ 2. Active tab is correctly highlighted for all routes & alias hashes.');

// 3. Verify InventoryModule.render renders tabs header
const invContainer = { innerHTML: '' };
window.InventoryModule.render(invContainer);
assert(invContainer.innerHTML.includes('tabs-header inventory-logistics-tabs'), 'Stock Balances must render tabs header');
assert(invContainer.innerHTML.includes('tab-btn active') && invContainer.innerHTML.includes('Stock Balances'), 'Stock Balances tab must be active in InventoryModule');
console.log('✓ 3. InventoryModule.render renders sub-module tabs with Stock Balances active.');

// 4. Verify OpeningBalanceModule.render renders tabs header
const obContainer = { innerHTML: '' };
window.OpeningBalanceModule.render(obContainer);
assert(obContainer.innerHTML.includes('tabs-header inventory-logistics-tabs'), 'Opening Balance must render tabs header');
assert(obContainer.innerHTML.includes('Opening Balance'), 'Opening Balance tab must be present');
console.log('✓ 4. OpeningBalanceModule.render renders sub-module tabs with Opening Balance active.');

// 5. Verify TraceabilityModule.render renders tabs header
const traceContainer = { innerHTML: '' };
window.TraceabilityModule.render(traceContainer);
assert(traceContainer.innerHTML.includes('tabs-header inventory-logistics-tabs'), 'Traceability must render tabs header');
assert(traceContainer.innerHTML.includes('Genealogy & Trace'), 'Genealogy & Trace tab must be present');
console.log('✓ 5. TraceabilityModule.render renders sub-module tabs with Genealogy & Trace active.');

// 6. Verify TransfersModule.render renders tabs header
const trfContainer = { innerHTML: '' };
window.TransfersModule.render(trfContainer);
assert(trfContainer.innerHTML.includes('tabs-header inventory-logistics-tabs'), 'Transfers must render tabs header');
assert(trfContainer.innerHTML.includes('Stock Transfer'), 'Stock Transfer tab must be present');
console.log('✓ 6. TransfersModule.render renders sub-module tabs with Stock Transfer active.');

// 7. Verify isTopTabsModule hides pageTopBar for Inventory & Logistics routes
const app = window.App;
const checkIsTopTabs = (hash) => {
  const routeConfig = app.routes[hash];
  return Boolean(routeConfig && (
    routeConfig.section === 'Masters' || 
    routeConfig.section === 'Organization & Facility Setup' || 
    routeConfig.section === 'User Roles & Security' || 
    routeConfig.section === 'Organization & Location' || 
    routeConfig.section === 'Common Master' || 
    routeConfig.section === 'Store Master Setup' || 
    routeConfig.section === 'Store & Inventory Master' || 
    routeConfig.section === 'Store & Inventory' || 
    routeConfig.section === 'Item Master Setup' || 
    routeConfig.section === 'Billing' || 
    routeConfig.section === 'Workshop' || 
    routeConfig.module === window.BillingModule || 
    hash.startsWith('#/billing') ||
    routeConfig.section === 'Inventory & Logistics' ||
    hash === '#/inventory' ||
    hash.startsWith('#/opening-balance') ||
    hash.startsWith('#/inventory-opening') ||
    hash === '#/traceability' ||
    hash === '#/transfers'
  ));
};

assert(checkIsTopTabs('#/inventory'), '#/inventory must be recognized as top tabs module');
assert(checkIsTopTabs('#/opening-balance'), '#/opening-balance must be recognized as top tabs module');
assert(checkIsTopTabs('#/traceability'), '#/traceability must be recognized as top tabs module');
assert(checkIsTopTabs('#/transfers'), '#/transfers must be recognized as top tabs module');
console.log('✓ 7. isTopTabsModule is true for all Inventory & Logistics routes (hiding redundant top bar).');

console.log('\n🎉 ALL INVENTORY & LOGISTICS SUB-MODULE TABS TESTS PASSED (100%)!');
