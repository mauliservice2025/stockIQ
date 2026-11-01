/**
 * Test Suite: Document Print Configuration Master Integration for Facility Prints
 * Verifies that all prints fetch from Document Print Configuration Master if configured for facility.
 */

const fs = require('fs');
const vm = require('vm');

const mockDataCode = fs.readFileSync('js/data/mock-data.js', 'utf8');
const docPrintConfigCode = fs.readFileSync('js/modules/doc-print-config.js', 'utf8');
const billingCode = fs.readFileSync('js/modules/billing.js', 'utf8');

// Set up mock browser environment
const domLogs = [];
const printCalls = [];

const sandbox = {
  window: {},
  document: {
    getElementById: (id) => null,
    querySelectorAll: () => [],
    createElement: (tag) => ({
      id: '',
      style: {},
      contentWindow: {
        document: {
          open: () => {},
          write: (html) => { printCalls.push(html); },
          close: () => {}
        },
        focus: () => {},
        print: () => { printCalls.push('PRINT_TRIGGERED'); }
      }
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {}
    }
  },
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  URL: { createObjectURL: () => 'blob:dummy', revokeObjectURL: () => {} }
};

sandbox.window = sandbox;

// Run scripts in sandbox
vm.createContext(sandbox);
vm.runInContext(mockDataCode, sandbox);

// Mock DB
sandbox.DB = {
  data: JSON.parse(JSON.stringify(sandbox.INITIAL_DATA)),
  getAll(collection) {
    return this.data[collection] || [];
  },
  getById(collection, id) {
    const list = this.getAll(collection);
    return list.find(item => item.id === id) || null;
  },
  upsert(collection, record) {
    if (!this.data[collection]) this.data[collection] = [];
    const idx = this.data[collection].findIndex(r => r.id === record.id);
    if (idx >= 0) {
      this.data[collection][idx] = Object.assign({}, this.data[collection][idx], record);
    } else {
      this.data[collection].push(record);
    }
  },
  emitChange() {},
  saveData() {},
  getActivePlants() {
    return this.getAll('plants');
  },
  isPlantActive() {
    return true;
  }
};

// Mock State
const shownModals = [];
sandbox.State = {
  modals: [],
  showModal(opts) {
    shownModals.push(opts);
  },
  closeModal() {},
  showToast(msg, type) {},
  getCurrentUser() {
    return { name: 'Admin User', role: 'System Administrator' };
  }
};

vm.runInContext(docPrintConfigCode, sandbox);
vm.runInContext(billingCode, sandbox);

console.log('=== TEST 1: Facility-Specific Template Resolution ===');
// For PLANT-01, JC has DPC-JC-PUN (specifically for PLANT-01)
const jcPlant01 = sandbox.DocPrintConfigModule.getPublishedTemplate('JC', 'PLANT-01');
console.log('JC @ PLANT-01:', jcPlant01?.id, jcPlant01?.code);
if (jcPlant01?.id !== 'DPC-JC-PUN') throw new Error('Expected DPC-JC-PUN for PLANT-01');

// For PLANT-02, JC has DPC-JC-STD (fallback to ALL facilities)
const jcPlant02 = sandbox.DocPrintConfigModule.getPublishedTemplate('JC', 'PLANT-02');
console.log('JC @ PLANT-02:', jcPlant02?.id, jcPlant02?.code);
if (jcPlant02?.id !== 'DPC-JC-STD') throw new Error('Expected DPC-JC-STD fallback for PLANT-02');

console.log('=== TEST 2: All Document Types Resolution for Facilities ===');
const docTypes = ['JC', 'EST', 'DB', 'INV', 'GP', 'PO', 'GRN', 'TRANSFER', 'DISPATCH'];
docTypes.forEach(dt => {
  const tpl = sandbox.DocPrintConfigModule.getPublishedTemplate(dt, 'PLANT-01');
  console.log(`DocType: ${dt} -> Template: ${tpl?.id} (${tpl?.name})`);
  if (!tpl) throw new Error(`Template not found for ${dt}`);
});

console.log('=== TEST 3: Strict Facility Isolation (No Cross-Facility Leakage) ===');
// Create a fake doc type only published for PLANT-09
sandbox.DB.upsert('document_print_configurations', {
  id: 'DPC-SPECIAL-09',
  code: 'DPC-SPEC-09',
  name: 'Special Template Only For Facility 9',
  facility_id: 'PLANT-09',
  document_type: 'SPECIAL_TEST',
  status: 'Published'
});

const specForPlant01 = sandbox.DocPrintConfigModule.getPublishedTemplate('SPECIAL_TEST', 'PLANT-01');
console.log('Special template for PLANT-01:', specForPlant01);
if (specForPlant01 !== null) throw new Error('Expected null when facility is not configured');

console.log('=== TEST 4: Dynamic Document Name Edit & Print Generation ===');
const invTpl = sandbox.DocPrintConfigModule.getPublishedTemplate('INV', 'PLANT-01');
console.log('Initial doc title:', invTpl.header_config.doc_title);

// Simulate user editing the document title/name in Document Print Configuration Master
sandbox.DocPrintConfigModule.activeConfigId = invTpl.id;
sandbox.DocPrintConfigModule.handleDocNameChange('CUSTOM TAX INVOICE (GST COMPLIANT)');

const updatedTpl = sandbox.DocPrintConfigModule.getPublishedTemplate('INV', 'PLANT-01');
console.log('Updated doc title:', updatedTpl.header_config.doc_title);
if (updatedTpl.header_config.doc_title !== 'CUSTOM TAX INVOICE (GST COMPLIANT)') {
  throw new Error('Document title was not updated');
}

// Generate print HTML for an invoice transaction
const testInv = {
  id: 'INV-2026-0099',
  invoice_no: 'INV/26/0099',
  invoice_date: '2026-10-19',
  customer_name: 'Rajesh Sharma',
  customer_mobile: '9822998877',
  customer_cin: 'CIN-PUN-0099',
  vehicle_reg_no: 'MH-12-RS-9999',
  vehicle_model: 'Honda CB Shine',
  plant_id: 'PLANT-01',
  items: [
    { code: 'ENG-OIL', description: 'Engine Oil 4T 10W30', qty: 1, rate: 450, total: 450, type: 'Part' },
    { code: 'SRV-GEN', description: 'General Service Labour', qty: 1, rate: 550, total: 550, type: 'Labour' }
  ],
  grand_total: 1180
};

const generatedHtml = sandbox.DocPrintConfigModule.generatePrintHtml('INV', 'PLANT-01', testInv);
if (!generatedHtml.includes('CUSTOM TAX INVOICE (GST COMPLIANT)')) {
  throw new Error('Generated HTML does not reflect updated document title from master');
}
if (!generatedHtml.includes('Rajesh Sharma') || !generatedHtml.includes('MH-12-RS-9999')) {
  throw new Error('Generated HTML does not contain transaction details');
}
console.log('generatePrintHtml correctly rendered customized title & invoice details!');

console.log('=== TEST 5: BillingModule.printInvoice hook ===');
shownModals.length = 0;
// Add testInv to finalBills
sandbox.DB.upsert('finalBills', testInv);
sandbox.BillingModule.printInvoice(testInv.id);

if (shownModals.length === 0) throw new Error('No modal shown by BillingModule.printInvoice');
const lastModal = shownModals[shownModals.length - 1];
if (!lastModal.contentHtml.includes('CUSTOM TAX INVOICE (GST COMPLIANT)')) {
  throw new Error('BillingModule.printInvoice did not use Document Print Configuration Master template');
}
console.log('BillingModule.printInvoice successfully fetched from Document Print Configuration Master!');

console.log('=== TEST 6: BillingModule.triggerPrintInvoice hook ===');
printCalls.length = 0;
sandbox.BillingModule.triggerPrintInvoice(testInv.id);
const printedIframeHtml = printCalls.find(c => typeof c === 'string' && c.includes('<!DOCTYPE html>'));
if (!printedIframeHtml || !printedIframeHtml.includes('CUSTOM TAX INVOICE (GST COMPLIANT)')) {
  throw new Error('triggerPrintInvoice did not print Document Print Configuration Master template');
}
console.log('BillingModule.triggerPrintInvoice successfully printed Document Print Configuration Master template!');

console.log('=== TEST 7: Job Card (JC) Print Integration ===');
const testJc = {
  id: 'JC-PUN-001',
  job_card_no: 'JC/2026/001',
  plant_id: 'PLANT-01',
  customer_name: 'Amitabh Verma',
  vehicle_reg_no: 'MH-14-AV-1000',
  parts_required: [
    { item_code: 'BRK-PAD', item_name: 'Brake Pad Set', qty: 1, unit_price: 350, total: 350 }
  ]
};
sandbox.DB.upsert('jobCards', testJc);
shownModals.length = 0;
sandbox.BillingModule.printJobCard(testJc.id);
const jcModal = shownModals[shownModals.length - 1];
if (!jcModal.contentHtml.includes('configured-print-doc')) {
  throw new Error('Job Card modal did not use Document Print Configuration Master');
}
console.log('Job Card print successfully fetched from Document Print Configuration Master!');

console.log('=== TEST 8: Gate Pass (GP) Print Integration ===');
const testGp = {
  id: 'DEL-PUN-001',
  gate_pass_no: 'GP-2026-0001',
  plant_id: 'PLANT-01',
  customer_name: 'Siddharth Roy',
  vehicle_reg_no: 'MH-12-SR-7777',
  delivery_date: '2026-10-19'
};
sandbox.DB.upsert('vehicleDeliveries', testGp);
shownModals.length = 0;
sandbox.BillingModule.viewGatePass(testGp.id);
const gpModal = shownModals[shownModals.length - 1];
if (!gpModal.contentHtml.includes('configured-print-doc')) {
  throw new Error('Gate pass modal did not use Document Print Configuration Master');
}
console.log('Gate Pass print successfully fetched from Document Print Configuration Master!');

console.log('=== ALL INTEGRATION TESTS PASSED PERFECTLY! ===');
