const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('VERIFYING BILLING "+ ADD ITEM" MODAL FORMAT');
console.log('================================================================\n');

const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

// 1. Verify showAddSingleScreenItemModal contains all elements from screenshot
assert(billingJs.includes('id="bill-modal-tab-part"'), 'Must have Spare Part tab');
assert(billingJs.includes('id="bill-modal-tab-labour"'), 'Must have Labour Service tab');
assert(billingJs.includes('id="bill-modal-tab-consumable"'), 'Must have Consumable tab');
assert(billingJs.includes('Select from Master or type custom name:'), 'Must have master preset label');
assert(billingJs.includes('id="bill-add-item-preset"'), 'Must have preset dropdown');
assert(billingJs.includes('id="add-item-name"'), 'Must have description input');
assert(billingJs.includes('id="add-item-qty"'), 'Must have quantity input');
assert(billingJs.includes('id="add-item-rate"'), 'Must have unit rate input');
assert(billingJs.includes('Line Amount:'), 'Must have Line Amount display');
assert(billingJs.includes('id="add-item-amount-display"'), 'Must have amount display element');
assert(billingJs.includes('+ Add Item to Bill'), 'Must have + Add Item to Bill button');

console.log('✓ PASS: Modal markup contains all elements from the requested format');

// 2. Test modal rendering and behavior in simulated DOM
let openedModal = null;
global.window = {
  DB: {
    getAll: (table) => {
      if (table === 'items') {
        return [{ id: 'ITM-01', name: 'Engine Oil', code: 'ENG-OIL', current_stock: 12 }];
      }
      if (table === 'inventoryBalances') {
        return [{ item_id: 'ITM-01', available: 12 }];
      }
      return [];
    },
    saveData: () => {},
    emitChange: () => {},
    getById: () => null,
    upsert: () => {}
  },
  State: {
    showModal: (config) => {
      openedModal = config;
    },
    closeModal: () => {},
    showToast: () => {}
  }
};

const domNodes = {
  'add-item-type': { value: 'PART' },
  'bill-modal-tab-part': { className: 'btn btn-sm btn-primary' },
  'bill-modal-tab-labour': { className: 'btn btn-sm btn-ghost' },
  'bill-modal-tab-consumable': { className: 'btn btn-sm btn-ghost' },
  'add-item-code': { value: 'PRT-001' },
  'add-item-name': { value: '' },
  'add-item-qty': { value: '2' },
  'add-item-rate': { value: '450' },
  'add-item-amount-display': { innerText: '' }
};

global.document = {
  getElementById: (id) => domNodes[id] || null
};

const extractMethods = `
  getItemCode(it, idx) {
    if (it && it.code) return it.code;
    return 'PRT-001';
  },
  getActiveCustomerBillingBill() {
    if (!this._activeBill) {
      this._activeBill = {
        id: 'BILL-001',
        items: [],
        subtotal: 0,
        tax_rate: 0
      };
    }
    return this._activeBill;
  },
  ${billingJs.slice(billingJs.indexOf('showAddSingleScreenItemModal() {'), billingJs.indexOf('updateSingleScreenDiscount(val) {'))}
`;

const ctx = vm.createContext({
  window: global.window,
  document: global.document,
  console: console,
  Number: Number,
  Math: Math,
  String: String,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  Array: Array,
  Date: Date,
  domNodes: domNodes
});

const script = new vm.Script(`
  const BillingModule = {
    recalculateBillTotals(bill) {
      bill.subtotal = bill.items.reduce((s, it) => s + (it.qty * it.rate), 0);
      bill.net_payable = bill.subtotal;
    },
    refresh() {},
    ${extractMethods}
  };

  // 1. Open modal
  BillingModule.showAddSingleScreenItemModal();

  // 2. Select preset
  BillingModule.onBillItemPresetChange('PRT-SP-05|Spark Plug NGK|PART|165');

  // 3. Switch tab to Labour
  BillingModule.setAddBillItemType('LABOUR');

  // 4. Calculate total
  domNodes['add-item-qty'].value = '3';
  domNodes['add-item-rate'].value = '500';
  BillingModule.calcBillModalTotal();

  // 5. Submit item
  BillingModule.submitAddSingleScreenItem();

  BillingModule.submittedBill = BillingModule.getActiveCustomerBillingBill();
`);

script.runInContext(ctx);

assert(openedModal, 'Modal must have been shown');
assert(openedModal.title.includes('Add Item'), 'Modal title must be appropriate');
assert(openedModal.contentHtml.includes('⚙️ Spare Part'), 'Modal must render Spare Part button');
assert(openedModal.contentHtml.includes('🛠️ Labour Service'), 'Modal must render Labour Service button');
assert(openedModal.contentHtml.includes('🧪 Consumable'), 'Modal must render Consumable button');
assert(openedModal.contentHtml.includes('Line Amount:'), 'Modal must render Line Amount:');

console.log('✓ PASS: Modal open verified with title:', openedModal.title);
assert.strictEqual(domNodes['bill-modal-tab-labour'].className, 'btn btn-sm btn-primary', 'Labour tab must be active');
assert.strictEqual(domNodes['add-item-amount-display'].innerText, '₹1,500.00', 'Amount display must be 3 x 500 = ₹1,500.00');

console.log('✓ PASS: Tab switching and dynamic line amount calculation verified');
console.log('\n================================================================');
console.log('🎉 ALL BILLING ADD ITEM FORMAT TESTS PASSED (100%)!');
console.log('================================================================\n');
