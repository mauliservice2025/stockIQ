const fs = require('fs');
const assert = require('assert');

global.window = {
  DB: {
    getAll: () => [
      {
        id: 'JC-1',
        job_card_no: 'JC-PUN-26-006',
        date: '2026-10-07',
        customer_name: 'angad sheth',
        customer_mobile: '6787653456',
        vehicle_reg_no: 'MH12VV6558',
        vehicle_model: 'Activa 6G',
        service_type: 'Periodic Service',
        technician_name: 'Santosh Shinde',
        status: 'COMPLETED',
        parts_required: [{ item_code: '2W-LUB-1', item_name: 'Engine Oil', status: 'ISSUED' }]
      }
    ],
    isPlantActive: () => true,
    isWarehouseActive: () => true,
    getById: () => null
  },
  State: { hasPermission: () => true, showToast: () => {} }
};

eval(fs.readFileSync('js/modules/billing.js', 'utf8'));

const out = window.BillingModule.renderJobCardsTab();

console.log('1. Default View is Table View:', out.includes('<table class="data-table">'));
assert(out.includes('<table class="data-table">'), 'Default view must be clean data table');

console.log('2. No 2-column split by default:', !out.includes('grid-template-columns: 320px 1fr'));
assert(!out.includes('grid-template-columns: 320px 1fr'), 'Must not render cramped split screen by default');

console.log('3. Displays Parts Status in Table:', out.includes('Parts (Issued)'));
assert(out.includes('Parts (Issued)'), 'Must show parts status in table');

console.log('4. Clean Parts & Details button on row:', out.includes('⚙️ Parts & Details'));
assert(out.includes('⚙️ Parts & Details'), 'Must provide Parts & Details button on row');

console.log('5. Details subtitles removed:', !out.includes('Workshop Job Cards & Spare Parts Management'));
assert(!out.includes('Workshop Job Cards & Spare Parts Management'), 'Job card header subtitle must be removed');

// Test BillingModule top banner
const container = { innerHTML: '' };
window.BillingModule.render(container);
console.log('6. Top header details removed:', !container.innerHTML.includes('Workshop Job Cards, Spare Parts Requisition'));
assert(!container.innerHTML.includes('Workshop Job Cards, Spare Parts Requisition'), 'Top banner subtitle must be removed');
console.log('7. Top header icon box removed:', !container.innerHTML.includes('width: 44px; height: 44px;'));
assert(!container.innerHTML.includes('width: 44px; height: 44px;'), 'Top banner icon box must be removed');

console.log('\n🎉 ALL SIMPLIFIED JOB CARD CHECKS PASSED (100%)!');
