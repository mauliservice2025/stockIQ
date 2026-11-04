const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const mockStorage = {
  _data: {},
  getItem: function(k) { return this._data[k] || null; },
  setItem: function(k, v) { this._data[k] = String(v); },
  removeItem: function(k) { delete this._data[k]; },
  clear: function() { this._data = {}; }
};
const sandbox = {
  localStorage: mockStorage,
  window: { localStorage: mockStorage },
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {} }
  },
  console: console
};
sandbox.window.document = sandbox.document;
vm.createContext(sandbox);

vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/state.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/item-setup-master.js', 'utf8'), sandbox);

const html = sandbox.window.ItemSetupModule.renderItemMasterTab();

// Verify KPI cards are completely gone
assert(!html.includes('TOTAL ITEMS') && !html.includes('Total Items'), 'Must NOT have Total Items KPI card');
assert(!html.includes('kpi-card'), 'Must NOT contain kpi-card');
assert(!html.includes('Enterprise Valuation'), 'Must NOT contain Enterprise Valuation');
console.log('✓ PASS: KPI cards banner completely removed from Item Master.');

// Verify symbol buttons are present
assert(html.includes('✏️'), 'Must contain ✏️ for Edit');
assert(html.includes('🔒') || html.includes('🔓'), 'Must contain 🔒 / 🔓 for Status toggle');
assert(html.includes('🗑️'), 'Must contain 🗑️ for Delete');
assert(!html.includes('>Edit<'), 'Must NOT contain text button Edit');
assert(!html.includes('>Deactivate<'), 'Must NOT contain text button Deactivate');
assert(!html.includes('>Delete<'), 'Must NOT contain text button Delete');
console.log('✓ PASS: Text buttons (Edit, Deactivate, Delete) replaced with symbol icons (✏️, 🔒, 🗑️).');

console.log('\nAll assertions passed!');
