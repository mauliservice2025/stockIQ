const fs = require('fs');
const assert = require('assert');

let modal = null;
let toast = null;

const mockDelivery = {
  id: 'DEL-001',
  job_card_id: 'JC-0015',
  job_card_no: 'JC/MSC1/2026/0015',
  invoice_no: 'INV/MSC1/2026/0009',
  customer_name: 'Parag Gulve',
  customer_mobile: '9887737737',
  vehicle_reg_no: 'MG20TH9827',
  vehicle_model: 'Honda Activa 6G',
  status: 'READY_FOR_DELIVERY'
};

global.window = {
  DB: {
    getAll: (tbl) => {
      if (tbl === 'vehicleDeliveries') return [mockDelivery];
      if (tbl === 'jobCards') return [{ id: 'JC-0015', job_card_no: 'JC/MSC1/2026/0015', branch_id: 'PLANT-01' }];
      if (tbl === 'users') return [];
      return [];
    },
    getById: (tbl, id) => (id === 'DEL-001' ? mockDelivery : null),
    upsert: (tbl, item) => item,
    insert: (tbl, item) => item,
    logAudit: () => {},
    saveData: () => {},
    emitChange: () => {},
    getNextDocumentNumber: () => 'GP/MSC1/2026/0004'
  },
  State: {
    showModal: (m) => { modal = m; },
    closeModal: () => { modal = null; },
    showToast: (msg, type) => { toast = { msg, type }; },
    currentPlantId: 'PLANT-01'
  }
};

eval(fs.readFileSync('js/modules/billing.js', 'utf8'));

console.log('--- 1. TESTING GATE PASS MODAL RENDERING ---');
window.BillingModule.showNewGatePassModal('JC-0015', 'INV/MSC1/2026/0009', 'DEL-001');

assert(modal !== null, 'Modal must be open');
assert(!modal.contentHtml.includes('new-gp-delivery-select'), 'Must NOT contain customer dropdown');
assert(!modal.contentHtml.includes('Select Ready for Handover Customer'), 'Must NOT contain "Select Ready for Handover Customer"');
assert(modal.contentHtml.includes('new-gp-del-id'), 'Must contain hidden delivery id');
assert(modal.contentHtml.includes('new-gp-info-summary'), 'Must contain handover info summary card');
assert(modal.contentHtml.includes('Parag Gulve'), 'Must display customer name');
assert(modal.contentHtml.includes('MG20TH9827'), 'Must display vehicle reg no');
assert(modal.contentHtml.includes('Next Service Date'), 'Must contain "Next Service Date" label');
assert(modal.contentHtml.includes('new-gp-next-service-date'), 'Must contain Next Service Date input field');
console.log('✓ Dropdown removed, summary card displayed, and Next Service Date field present!');

console.log('\n--- 2. TESTING SAVE GATE PASS WITH NEXT SERVICING DATE ---');
global.document = {
  getElementById: (id) => {
    if (id === 'new-gp-del-id') return { value: 'DEL-001' };
    if (id === 'new-gp-jc') return { value: 'JC-0015' };
    if (id === 'new-gp-jc-id') return { value: 'JC-0015' };
    if (id === 'new-gp-jc-no') return { value: 'JC/MSC1/2026/0015' };
    if (id === 'new-gp-inv') return { value: 'INV/MSC1/2026/0009' };
    if (id === 'new-gp-facility') return { value: 'PLANT-01' };
    if (id === 'new-gp-no') return { value: 'GP/MSC1/2026/0004' };
    if (id === 'new-gp-date') return { value: '2026-10-21T12:07' };
    if (id === 'new-gp-next-service-date') return { value: '2027-01-21' };
    if (id === 'new-gp-remarks') return { value: 'Delivered in good running order.' };
    return null;
  }
};

window.BillingModule.saveGatePass();
assert(mockDelivery.status === 'DELIVERED', 'Delivery status must update to DELIVERED');
assert(mockDelivery.gate_pass_no && mockDelivery.gate_pass_no.startsWith('GP/'), 'Gate pass number assigned');
assert(mockDelivery.next_service_due_date === '2027-01-21', 'Next servicing date must be saved to delivery');
console.log('✓ Save Gate Pass succeeded with Next Servicing Date (Gate Pass:', mockDelivery.gate_pass_no, ', Next Service:', mockDelivery.next_service_due_date, ')!');

console.log('\nALL GATE PASS MODAL VERIFICATIONS PASSED! ✔');
