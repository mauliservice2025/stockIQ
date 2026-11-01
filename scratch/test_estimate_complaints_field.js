const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log('--- TEST: Customer Complaints & Instructions in Estimate Screen ---');

const mockDataCode = fs.readFileSync('js/data/mock-data.js', 'utf8');
const docPrintConfigCode = fs.readFileSync('js/modules/doc-print-config.js', 'utf8');
const billingCode = fs.readFileSync('js/modules/billing.js', 'utf8');

const domModals = [];
const context = {
  console: console,
  setTimeout: (fn) => fn(),
  window: {},
  document: {
    getElementById: (id) => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => ({ style: {}, appendChild: () => {}, id: '' })
  }
};
context.window = context;
context.window.State = {
  currentPlantId: 'PLANT-01',
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
  showModal: (opts) => {
    domModals.push(opts);
    console.log(`[Modal Opened]: ${opts.title}`);
  },
  closeModal: () => {}
};

vm.createContext(context);
vm.runInContext(mockDataCode, context);

// Mock DB
context.window.DB = {
  data: JSON.parse(JSON.stringify(context.window.INITIAL_DATA || {})),
  getAll(collection) {
    return this.data[collection] || [];
  },
  getById(collection, id) {
    return (this.data[collection] || []).find(x => x.id === id) || null;
  },
  upsert(collection, record) {
    if (!this.data[collection]) this.data[collection] = [];
    const idx = this.data[collection].findIndex(x => x.id === record.id);
    if (idx !== -1) {
      this.data[collection][idx] = record;
    } else {
      this.data[collection].push(record);
    }
  },
  saveData() {},
  emitChange() {},
  getDefaultTax: () => ({ rate: 0, name: 'GST 0%' }),
  getActivePlants() {
    return this.getAll('plants');
  },
  isPlantActive: () => true
};

vm.runInContext(docPrintConfigCode, context);
vm.runInContext(billingCode, context);

const BM = context.window.BillingModule;
assert(BM, 'BillingModule must exist');

// Set up a mock Job Card exactly like in the user's screenshot
const testJC = {
  id: 'JC-2026-0015',
  job_card_no: 'JC/MSC1/2026/0015',
  customer_cin: 'CIN/MSC/2026/000011',
  customer_name: 'Parag Gulve',
  customer_mobile: '9887737737',
  vehicle_reg_no: 'MG 20 TH 9827',
  vehicle_model: 'Honda Activa 6G',
  odometer_km: '9,877 km',
  service_type: 'General Service',
  complaints: ['Servicing, bulb issue, brake issue.'],
  parts_required: [],
  labour_tasks: [{ desc: 'General Service Labour', qty: 2, rate: 250, amount: 500 }]
};

context.window.DB.data.jobCards = [testJC];

// 1. Create estimate for this Job Card
BM.createEstimateForJobCardRecord(testJC);
const est = BM.getActiveEstimate();
assert(est, 'Estimate must have been created');
assert.strictEqual(est.customer_complaints, 'Servicing, bulb issue, brake issue.');
assert.strictEqual(est.complaints, 'Servicing, bulb issue, brake issue.');
console.log('✓ 1. createEstimateForJobCardRecord populated customer_complaints from Job Card');

// 2. Render Estimate Screen
const html = BM.renderEstimatesTab();

// Verify Customer Complaints & Instructions is rendered
assert(html.includes('Customer Complaints & Instructions'), 'Must include Customer Complaints & Instructions header');
assert(html.includes('estimate-customer-complaints'), 'Must have textarea id estimate-customer-complaints');
assert(html.includes('Servicing, bulb issue, brake issue.'), 'Textarea must contain the complaints');
console.log('✓ 2. Customer Complaints & Instructions is visible on the Estimate screen with pre-filled content');

// Verify it is placed above Terms & Remarks
const complaintsIdx = html.indexOf('Customer Complaints & Instructions');
const termsIdx = html.indexOf('Terms & Remarks');
assert(complaintsIdx !== -1 && termsIdx !== -1, 'Both fields must be present');
assert(complaintsIdx < termsIdx, 'Customer Complaints & Instructions must appear BEFORE Terms & Remarks');
console.log('✓ 3. Customer Complaints & Instructions is positioned ABOVE Terms & Remarks');

// 4. Test updating complaints
BM.updateEstimateComplaints('Servicing, bulb issue, brake issue, engine tuning needed.');
const updatedEst = BM.getActiveEstimate();
assert.strictEqual(updatedEst.customer_complaints, 'Servicing, bulb issue, brake issue, engine tuning needed.');
console.log('✓ 4. updateEstimateComplaints updates active estimate correctly');

// 5. Test print estimate modal
BM.showPrintEstimateModal(updatedEst.id);
const printModal = domModals[domModals.length - 1];
assert(printModal, 'Print modal opened');
assert(printModal.contentHtml.includes('Servicing, bulb issue, brake issue, engine tuning needed.'), 'Print modal includes customer complaints');
console.log('✓ 5. showPrintEstimateModal renders Customer Complaints & Instructions note');

// 6. Test WhatsApp Share
BM.shareEstimateWhatsApp(updatedEst.id);
const shareModal = domModals[domModals.length - 1];
assert(shareModal.contentHtml.includes('Complaints'), 'WhatsApp share message includes complaints');
console.log('✓ 6. shareEstimateWhatsApp includes complaints in WhatsApp share text');

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY 100%!');
