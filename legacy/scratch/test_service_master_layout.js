const assert = require('assert');
const fs = require('fs');

console.log('--- Testing Service Master Layout & Field Refinements ---');

let lastModal = null;
global.window = {
  DB: {
    data: { services: [] },
    getAll: () => [
      { id: 'LBR-001', code: 'LBR-001', name: 'General Service Labour', rate: 399, status: 'Active', category: 'Periodic Maintenance', sac_code: '998729', description: 'Complete periodic 2-wheeler general maintenance' },
      { id: 'LBR-002', code: 'LBR-002', name: 'Engine Oil & Filter Replacement', rate: 100, status: 'Active', category: 'Engine Service', sac_code: '998729', description: 'Draining engine oil, replacing oil strainer' }
    ],
    saveData: () => {}
  },
  PaginationHelper: {
    paginate: (items) => ({ items, totalRecords: items.length, totalPages: 1, currentPage: 1, pageSize: 10 }),
    render: () => '<div id="pagination">Pagination</div>'
  },
  State: {
    showModal: (config) => { lastModal = config; },
    closeModal: () => { lastModal = null; },
    showToast: () => {}
  }
};

const code = fs.readFileSync('d:/Projects/ISCM/js/modules/service-master.js', 'utf8');
eval(code);

assert(window.ServiceMasterModule, 'ServiceMasterModule must be loaded');

const renderedHtml = window.ServiceMasterModule.render();

// 1. Verify /Operation removed from table column header
assert(renderedHtml.includes('<th>Service Name</th>') || renderedHtml.includes('>Service Name</th>'), 'Expected column header "Service Name" without / Operation');
assert(!renderedHtml.includes('Service / Operation Name'), 'Expected "Service / Operation Name" to be removed from table header');
console.log('✓ 1. Verified column header is "Service Name" without / Operation.');

// 2. Verify description details are NOT shown in the services list
assert(!renderedHtml.includes('Complete periodic 2-wheeler general maintenance'), 'Description details should not show in the services list');
assert(!renderedHtml.includes('Draining engine oil, replacing oil strainer'), 'Description details should not show in the services list');
assert(renderedHtml.includes('General Service Labour'), 'Service name must still be displayed');
console.log('✓ 2. Verified description details are NOT shown on the list of services.');

// 3. Verify Add Modal fields
window.ServiceMasterModule.openAddModal();
assert(lastModal, 'Add Modal should open');
assert(lastModal.contentHtml.includes('Service Name <span'), 'Add modal must have "Service Name" label without / Operation');
assert(!lastModal.contentHtml.includes('Service / Operation Name'), 'Add modal must not contain "Service / Operation Name"');
assert(lastModal.contentHtml.includes('<label class="form-label" style="font-size: 12px; font-weight: 600;">Description</label>'), 'Add modal description label must be "Description" without / Operation Scope');
assert(!lastModal.contentHtml.includes('Description / Operation Scope'), 'Add modal must not contain "Description / Operation Scope"');
assert(!lastModal.contentHtml.includes('GST Tax Rate (%)'), 'Add modal must not contain "GST Tax Rate (%)" field');
assert(!lastModal.contentHtml.includes('id="srv-input-tax"'), 'Add modal must not contain "#srv-input-tax" input');
console.log('✓ 3. Verified Add Modal has "Service Name", "Description", and GST Tax field is removed.');

// 4. Verify Edit Modal fields
window.ServiceMasterModule.openEditModal('LBR-001');
assert(lastModal, 'Edit Modal should open');
assert(lastModal.contentHtml.includes('Service Name <span'), 'Edit modal must have "Service Name" label without / Operation');
assert(!lastModal.contentHtml.includes('Service / Operation Name'), 'Edit modal must not contain "Service / Operation Name"');
assert(lastModal.contentHtml.includes('<label class="form-label" style="font-size: 12px; font-weight: 600;">Description</label>'), 'Edit modal description label must be "Description" without / Operation Scope');
assert(!lastModal.contentHtml.includes('Description / Operation Scope'), 'Edit modal must not contain "Description / Operation Scope"');
assert(!lastModal.contentHtml.includes('GST Tax Rate (%)'), 'Edit modal must not contain "GST Tax Rate (%)" field');
assert(!lastModal.contentHtml.includes('id="srv-input-tax"'), 'Edit modal must not contain "#srv-input-tax" input');
console.log('✓ 4. Verified Edit Modal has "Service Name", "Description", and GST Tax field is removed.');

console.log('\n🎉 ALL SERVICE MASTER REFINEMENT TESTS PASSED (100%)!');
