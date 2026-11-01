// Automated Unit Test for Estimate Add Item 3 Category Buttons & Master Selection
const assert = require('assert');

// Mock browser environment
const domNodes = {};
function getMockEl(id) {
  if (!domNodes[id]) {
    domNodes[id] = {
      id,
      value: '',
      style: {},
      innerHTML: '',
      innerText: '',
      textContent: '',
      className: '',
      classList: {
        contains(c) { return this.parent.className.includes(c); },
        add(c) { if (!this.parent.className.includes(c)) this.parent.className += ' ' + c; },
        remove(c) { this.parent.className = this.parent.className.replace(c, '').trim(); }
      },
      getAttribute(k) { return this[k]; },
      setAttribute(k, v) { this[k] = v; },
      select() {}
    };
    domNodes[id].classList.parent = domNodes[id];
  }
  return domNodes[id];
}

global.document = {
  getElementById(id) {
    return getMockEl(id);
  },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  addEventListener() {}
};

let capturedModal = null;
let lastToast = null;
global.window = global;
global.window.State = {
  currentPlantId: 'PLANT-01',
  currentUser: { name: 'Pravin Patil', primary_role: 'ROLE-ADMIN' },
  showModal(opts) { capturedModal = opts; },
  closeModal() {},
  showToast(msg, type) { lastToast = { msg, type }; console.log(`[Toast ${type}]: ${msg}`); },
  hasPermission() { return true; }
};

const DB = {
  data: {
    jobCards: [
      { id: 'JC-01', job_card_no: 'JC/01', vehicle_model: 'Activa 6G', vehicle_model_id: 'MOD-ACTIVA' }
    ],
    billingEstimates: [
      {
        id: 'EST-TEST-01',
        estimate_no: 'EST/MSC1/2026/0001',
        status: 'DRAFT',
        customer_name: 'Pravin Patil',
        vehicle_model: 'Activa 6G',
        vehicle_model_id: 'MOD-ACTIVA',
        job_card_id: 'JC-01',
        items: [],
        estimated_total: 0
      }
    ],
    draftBills: [],
    finalBills: [],
    items: [
      { id: 'ITEM-01', code: 'PRT-101', name: 'Front Disc Brake Pad', sale_price: 380, stock: 25, item_type: 'Spare Part' },
      { id: 'ITEM-02', code: 'PRT-102', name: 'Engine Valve Set', sale_price: 150, stock: 5, item_type: 'Spare Part' },
      { id: 'CON-01', code: 'CON-LS-01', name: 'Chain Lube Spray (150ml)', sale_price: 180, stock: 20, item_type: 'Consumable' }
    ],
    itemVehicleCompatibility: [
      { id: 'COMPAT-01', model_id: 'MOD-ACTIVA', item_id: 'ITEM-01' }
    ],
    inventoryBalances: [
      { item_id: 'ITEM-01', on_hand: 25, available: 25 },
      { item_id: 'CON-01', on_hand: 20, available: 20 }
    ]
  },
  getAll(t) { return this.data[t] || []; },
  getById(t, id) { return (this.data[t] || []).find(x => x.id === id); },
  upsert(t, item) {
    if (!this.data[t]) this.data[t] = [];
    const idx = this.data[t].findIndex(x => x.id === item.id);
    if (idx >= 0) this.data[t][idx] = item;
    else this.data[t].push(item);
  },
  saveData() {},
  emitChange() {},
  getDefaultTax() { return { rate: 18, name: 'GST 18%' }; }
};
window.DB = DB;

require('../js/modules/billing.js');
const billing = window.BillingModule;
billing.activeEstimateId = 'EST-TEST-01';

console.log('Testing Estimate Add Item Modal 3 Category Buttons & Master Selection...');

// TEST 1: Open Add Item Modal in Estimate
console.log('\n--- TEST 1: showAddEstimateItemModal opens with 3 category buttons & Job Card item list ---');
billing.showAddEstimateItemModal();
assert(capturedModal, 'Modal must be launched');
const html = capturedModal.contentHtml;

assert(html.includes('id="est-modal-tab-part"'), 'Spare Part button must be present');
assert(html.includes('id="est-modal-tab-labour"'), 'Labour Service button must be present');
assert(html.includes('id="est-modal-tab-consumable"'), 'Consumable button must be present');
assert(html.includes('⚙️ Spare Part'), 'Spare Part button text present');
assert(html.includes('🛠️ Labour Service'), 'Labour Service button text present');
assert(html.includes('🧪 Consumable'), 'Consumable button text present');
console.log('✓ PASS: All 3 category buttons (Spare Part, Labour Service, Consumable) are present!');

assert(html.includes('⭐ Compatible Parts for Activa 6G'), 'Compatible parts optgroup must be present same as Job Card');
assert(html.includes('All Workshop Parts'), 'All Workshop Parts optgroup must be present same as Job Card');
assert(!html.includes('Popular Spare Parts'), 'Popular Spare Parts dummy group must NOT be present');
console.log('✓ PASS: Dropdown item list matches Job Card item list exactly (Compatible Parts + All Workshop Parts, no fake popular parts)!');

assert(html.includes('Select from Master or type custom name:'), 'Master preset select label present');
assert(html.includes('id="est-add-item-preset"'), 'Master preset select dropdown present');
assert(html.includes('id="est-add-item-code"'), 'Item Code input present');
assert(html.includes('id="est-add-item-name"'), 'Item / Service Description input present');
assert(html.includes('id="est-add-item-qty"'), 'Quantity input present');
assert(html.includes('id="est-add-item-rate"'), 'Unit Rate input present');
assert(html.includes('id="est-add-item-amount-display"'), 'Line Amount display present');
assert(html.includes('+ Add Item to Estimate'), 'Submit button present');
console.log('✓ PASS: Form fields (Item Code, Description, Qty, Rate, Line Amount, Add Button) present matching image!');

// TEST 2: Tab button switching (Spare Part, Labour Service, Consumable)
console.log('\n--- TEST 2: Switching category tabs updates dropdown options to matching category ---');
// Switch to Labour Service
billing.setAddEstimateItemType('LABOUR');
assert.strictEqual(getMockEl('est-add-item-type').value, 'LABOUR');
assert(getMockEl('est-modal-tab-labour').className.includes('btn-primary'), 'Labour tab should be active');
assert(getMockEl('est-modal-tab-part').className.includes('btn-ghost'), 'Spare Part tab should be inactive');
assert(getMockEl('est-add-item-code').value.startsWith('LBR-'), 'Code prefix should be LBR- for labour');
assert(getMockEl('est-add-item-preset').innerHTML.includes('Standard Labour Services'), 'Dropdown should show Labour Services');
console.log('✓ PASS: Switching to Labour Service sets type=LABOUR and shows Standard Labour Services in dropdown');

// Switch to Consumable
billing.setAddEstimateItemType('CONSUMABLE');
assert.strictEqual(getMockEl('est-add-item-type').value, 'CONSUMABLE');
assert(getMockEl('est-modal-tab-consumable').className.includes('btn-primary'), 'Consumable tab should be active');
assert(getMockEl('est-add-item-code').value.startsWith('CON-'), 'Code prefix should be CON- for consumable');
assert(getMockEl('est-add-item-preset').innerHTML.includes('Consumables & Lubricants'), 'Dropdown should show Consumables & Lubricants');
console.log('✓ PASS: Switching to Consumable sets type=CONSUMABLE and shows Consumables & Lubricants in dropdown');

// Switch back to Spare Part
billing.setAddEstimateItemType('PART');
assert.strictEqual(getMockEl('est-add-item-type').value, 'PART');
assert(getMockEl('est-modal-tab-part').className.includes('btn-primary'), 'Spare Part tab should be active');
assert(getMockEl('est-add-item-code').value.startsWith('PRT-'), 'Code prefix should be PRT- for spare part');
assert(getMockEl('est-add-item-preset').innerHTML.includes('⭐ Compatible Parts for Activa 6G'), 'Dropdown should show Compatible Parts');
assert(getMockEl('est-add-item-preset').innerHTML.includes('All Workshop Parts'), 'Dropdown should show All Workshop Parts');
console.log('✓ PASS: Switching to Spare Part sets type=PART and restores Job Card item list');

// TEST 3: Preset selection from master dropdown
console.log('\n--- TEST 3: onEstimateItemPresetChange populates code, name, rate and type ---');
billing.onEstimateItemPresetChange('LBR-BO-03|Brake Overhaul & Cleaning|LABOUR|250');
assert.strictEqual(getMockEl('est-add-item-code').value, 'LBR-BO-03');
assert.strictEqual(getMockEl('est-add-item-name').value, 'Brake Overhaul & Cleaning');
assert.strictEqual(getMockEl('est-add-item-rate').value, '250');
assert.strictEqual(getMockEl('est-add-item-type').value, 'LABOUR');
assert(getMockEl('est-modal-tab-labour').className.includes('btn-primary'));
assert(getMockEl('est-add-item-amount-display').innerText.includes('250.00'));
console.log('✓ PASS: Selecting Labour preset accurately populates all inputs, switches active tab, and calculates total');

// TEST 4: Form submit adds item to Estimate
console.log('\n--- TEST 4: handleAddEstimateItemSubmit adds item to Estimate ---');
getMockEl('est-add-item-qty').value = '2';
billing.calcEstModalTotal();
assert(getMockEl('est-add-item-amount-display').innerText.includes('500.00'), 'Total for 2 units should be 500');

billing.handleAddEstimateItemSubmit();
const est = billing.getActiveEstimate();
assert.strictEqual(est.items.length, 1, '1 item should be added to estimate');
const addedItem = est.items[0];
assert.strictEqual(addedItem.code, 'LBR-BO-03');
assert.strictEqual(addedItem.name, 'Brake Overhaul & Cleaning');
assert.strictEqual(addedItem.type, 'LABOUR');
assert.strictEqual(addedItem.qty, 2);
assert.strictEqual(addedItem.rate, 250);
assert.strictEqual(addedItem.amount, 500);
console.log(`✓ PASS: Item successfully added to Estimate: ${addedItem.code} - ${addedItem.name} (₹${addedItem.amount})`);

// TEST 5: Add Consumable item
console.log('\n--- TEST 5: Add Consumable item to Estimate ---');
billing.onEstimateItemPresetChange('CON-LS-01|Chain Lube Spray (150ml)|CONSUMABLE|180');
getMockEl('est-add-item-qty').value = '1';
billing.calcEstModalTotal();
billing.handleAddEstimateItemSubmit();

assert.strictEqual(est.items.length, 2, '2 items should be in estimate');
const conItem = est.items[1];
assert.strictEqual(conItem.code, 'CON-LS-01');
assert.strictEqual(conItem.name, 'Chain Lube Spray (150ml)');
assert.strictEqual(conItem.type, 'CONSUMABLE');
assert.strictEqual(conItem.qty, 1);
assert.strictEqual(conItem.rate, 180);
console.log(`✓ PASS: Consumable item added to Estimate: ${conItem.code} - ${conItem.name} (₹${conItem.amount})`);

console.log('\n========================================');
console.log('ALL ESTIMATE ADD ITEM TAB TESTS PASSED! ✅');
console.log('========================================');
