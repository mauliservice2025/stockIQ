const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Testing Document Print Configuration Designer Fullscreen Modal & Form Name ---');

// Read doc-print-config.js
const code = fs.readFileSync(path.join(__dirname, '../js/modules/doc-print-config.js'), 'utf8');

let capturedModalOptions = null;
let closedModalId = null;
let stateModalClosed = false;

const mockConfigs = [
  {
    id: 'DPC-JC-001',
    code: 'DPC-JC-001',
    name: 'Job Card',
    document_type: 'JC',
    facility_id: 'ALL',
    applicable_facilities: ['ALL'],
    version: '1.2',
    status: 'Published',
    page_settings: {
      page_size: 'A4',
      orientation: 'portrait',
      margin_top: 8,
      margin_bottom: 8,
      margin_left: 10,
      margin_right: 10,
      font_family: 'Inter, sans-serif',
      font_size: '11px',
      line_spacing: '1.3'
    },
    header_config: { doc_title: 'WORKSHOP JOB CARD', show_logo: true },
    body_config: { show_customer_name: true },
    columns_config: [{ id: 'col_sr', name: 'SR.', field: 'sr_no', width: 5, visible: true }],
    footer_config: { show_customer_sign: true }
  }
];

const mockDom = {};

const sandbox = {
  console: console,
  document: {
    getElementById: (id) => mockDom[id] || null,
    querySelectorAll: () => [],
    createElement: (tag) => ({ id: '', style: {}, innerHTML: '', parentElement: null, appendChild: () => {}, remove: () => {} }),
    body: { appendChild: () => {} }
  },
  window: {},
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

sandbox.window = sandbox;
sandbox.window.State = {
  showModal: (opts) => {
    capturedModalOptions = opts;
  },
  closeModal: () => {
    stateModalClosed = true;
  },
  showToast: () => {},
  getCurrentUser: () => ({ id: 'USR-001', name: 'Pravin Patil', primary_role: 'ROLE-ADMIN' })
};

sandbox.window.DB = {
  getAll: (table) => {
    if (table === 'document_print_configurations') return mockConfigs;
    if (table === 'plants') return [{ id: 'PLANT-01', code: 'PUNE-01', name: 'Pune Workshop' }];
    return [];
  },
  getById: (table, id) => {
    if (table === 'document_print_configurations') return mockConfigs.find(c => c.id === id);
    if (table === 'plants') return { id: 'PLANT-01', code: 'PUNE-01', name: 'Pune Workshop' };
    return null;
  },
  upsert: () => {}
};

// Run doc-print-config.js in vm
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const docModule = sandbox.window.DocPrintConfigModule;
if (!docModule) {
  console.error('FAIL: DocPrintConfigModule not exported');
  process.exit(1);
}
console.log('✓ DocPrintConfigModule loaded successfully.');

// Test 1: Open designer modal
docModule.showDesignerModal('DPC-JC-001');

if (!capturedModalOptions) {
  console.error('FAIL: window.State.showModal was not called');
  process.exit(1);
}
console.log('✓ window.State.showModal called successfully.');

// Test 2: Check isFullScreen and maxWidth
console.log('isFullScreen:', capturedModalOptions.isFullScreen);
console.log('maxWidth:', capturedModalOptions.maxWidth);
if (capturedModalOptions.isFullScreen !== true) {
  console.error('FAIL: isFullScreen must be true');
  process.exit(1);
}
if (capturedModalOptions.maxWidth !== '100vw') {
  console.error('FAIL: maxWidth must be 100vw');
  process.exit(1);
}
console.log('✓ Test Passed: Modal is configured as full screen (isFullScreen: true, maxWidth: 100vw).');

// Test 3: Check Title / Form Name
console.log('Modal title HTML:', capturedModalOptions.title);
if (!capturedModalOptions.title.includes('Document Print Configuration Designer')) {
  console.error('FAIL: Title must include form name "Document Print Configuration Designer"');
  process.exit(1);
}
if (!capturedModalOptions.title.includes('DPC-JC-001')) {
  console.error('FAIL: Title must include configuration code');
  process.exit(1);
}
console.log('✓ Test Passed: Modal header clearly shows form name and template code.');

// Test 4: Check contentHtml layout
if (!capturedModalOptions.contentHtml.includes('Page & Typography')) {
  console.error('FAIL: Content must include designer tabs');
  process.exit(1);
}
if (!capturedModalOptions.contentHtml.includes('designer-controls-panel')) {
  console.error('FAIL: Content must include controls panel');
  process.exit(1);
}
if (!capturedModalOptions.contentHtml.includes('designer-preview-target')) {
  console.error('FAIL: Content must include preview target');
  process.exit(1);
}
console.log('✓ Test Passed: Content includes controls panel, tabs, and real-time live preview.');

// Test 5: Check footerHtml actions
if (!capturedModalOptions.footerHtml.includes('Save as Draft')) {
  console.error('FAIL: Footer must include Save as Draft button');
  process.exit(1);
}
if (!capturedModalOptions.footerHtml.includes('Publish Live Template') && !capturedModalOptions.footerHtml.includes('Republish')) {
  console.error('FAIL: Footer must include Publish button');
  process.exit(1);
}
console.log('✓ Test Passed: Footer includes save, close, and publish buttons.');

// Test 6: Check closeModal
stateModalClosed = false;
docModule.closeModal('doc-print-designer-modal');
if (!stateModalClosed) {
  console.error('FAIL: closeModal should trigger window.State.closeModal');
  process.exit(1);
}
console.log('✓ Test Passed: closeModal correctly triggers window.State.closeModal().');

console.log('--- ALL DESIGNER FULLSCREEN TESTS PASSED ---');
