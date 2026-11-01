// scratch/test_tab_removal.js
const fs = require('fs');

// Mock window and browser environment
global.window = {
  DB: {
    getAll: (tbl) => {
      if (tbl === 'items') return [];
      if (tbl === 'plants') return [{ id: 'PLANT-01', name: 'Plant 1', code: 'P1' }];
      if (tbl === 'itemCategories') return [{ id: 'CAT-SPARE', name: 'Spare Parts' }];
      if (tbl === 'itemSubcategories') return [{ id: 'SUB-BRK', name: 'Brakes', category_id: 'CAT-SPARE' }];
      if (tbl === 'itemBrands') return [{ id: 'BR-01', name: 'Bosch' }];
      if (tbl === 'itemManufacturers') return [{ id: 'MF-01', name: 'Bosch Ltd' }];
      if (tbl === 'uoms') return [{ id: 'NOS', name: 'Numbers', code: 'NOS' }];
      if (tbl === 'hsnCodes') return [{ id: 'HSN-01', code: '87141000' }];
      if (tbl === 'vehicleModels') return [];
      if (tbl === 'warehouses') return [];
      if (tbl === 'zones') return [];
      if (tbl === 'bins') return [];
      return [];
    },
    getById: (tbl, id) => null,
    insert: (tbl, doc) => doc,
    update: (tbl, id, patch) => patch
  },
  State: {
    currentPlantId: 'PLANT-01',
    showModal: (config) => { global.lastModalConfig = config; },
    closeModal: () => {},
    showToast: (msg, type) => { console.log(`[Toast ${type}]: ${msg}`); }
  }
};
global.document = {
  addEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: () => null
};

// Load item-setup-master.js
const code = fs.readFileSync('d:/Projects/ISCM/js/modules/item-setup-master.js', 'utf8');
eval(code);

const mod = window.ItemSetupModule;

let pass = 0;
let fail = 0;
function assert(cond, name) {
  if (cond) {
    console.log(`✅ PASS: ${name}`);
    pass++;
  } else {
    console.error(`❌ FAIL: ${name}`);
    fail++;
  }
}

console.log('--- TESTING ITEM MASTER TAB REMOVAL ---');

// 1. Initial tab fallback test
mod.showItemModal(null, 'INVENTORY');
assert(mod.modalActiveTab === 'BASIC', 'Fallback from INVENTORY to BASIC');

mod.showItemModal(null, 'STORE');
assert(mod.modalActiveTab === 'BASIC', 'Fallback from STORE to BASIC');

mod.showItemModal(null, 'PRICING');
assert(mod.modalActiveTab === 'BASIC', 'Fallback from PRICING to BASIC');

mod.showItemModal(null, 'JOBCARD');
assert(mod.modalActiveTab === 'JOBCARD', 'Valid tab JOBCARD is respected');

// 2. Render Modal content check
mod.showItemModal(null, 'BASIC');
const html = global.lastModalConfig.contentHtml;

assert(!html.includes('id="tab-pane-inventory"'), 'tab-pane-inventory removed from DOM');
assert(!html.includes('id="tab-pane-store"'), 'tab-pane-store removed from DOM');
assert(!html.includes('id="tab-pane-pricing"'), 'tab-pane-pricing removed from DOM');

assert(html.includes('id="tab-pane-basic"'), 'tab-pane-basic is present');
assert(html.includes('id="tab-pane-compat"'), 'tab-pane-compat is present');
assert(html.includes('id="tab-pane-uom"'), 'tab-pane-uom is present');
assert(html.includes('id="tab-pane-tax"'), 'tab-pane-tax is present');
assert(html.includes('id="tab-pane-jobcard"'), 'tab-pane-jobcard is present');
assert(html.includes('id="tab-pane-warranty"'), 'tab-pane-warranty is present');
assert(html.includes('id="tab-pane-audit"'), 'tab-pane-audit is present');

// Check tab buttons
assert(!html.includes("switchModalTab('INVENTORY')"), "Inventory Controls tab button removed");
assert(!html.includes("switchModalTab('STORE')"), "Store & Bin Mapping tab button removed");
assert(!html.includes("switchModalTab('PRICING')"), "Pricing & Cost tab button removed");

console.log(`\nSummary: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
