const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser environment
global.window = {
  State: {
    showToast: () => {},
    showModal: () => {},
    closeModal: () => {}
  },
  DB: {
    data: {
      document_print_configurations: [
        {
          id: 'DPC-JC-001',
          code: 'DPC-JC-001',
          name: 'Job Card',
          document_type: 'JC',
          facility_id: 'ALL',
          status: 'Published',
          version: '1.1',
          effective_from: '2026-04-01',
          updated_by: 'Administrator',
          updated_at: '2026-10-19'
        },
        {
          id: 'DPC-JC-PUN',
          code: 'DPC-JC-PUN',
          name: 'Pune Main Workshop Custom Job Card',
          document_type: 'JC',
          facility_id: 'PLANT-01',
          status: 'Inactive',
          version: '1.1',
          effective_from: '2026-05-01',
          updated_by: 'Administrator',
          updated_at: '2026-10-19'
        }
      ],
      plants: [
        { id: 'PLANT-01', code: 'PUN-01', name: 'Mauli Service Center 1' }
      ]
    },
    getAll(col) {
      return this.data[col] || [];
    },
    getById(col, id) {
      return (this.data[col] || []).find(x => x.id === id);
    }
  }
};

global.document = {
  getElementById: () => null,
  querySelector: () => null
};

// Load doc-print-config.js
require('../js/modules/doc-print-config.js');
const mod = global.window.DocPrintConfigModule;
assert(mod, 'DocPrintConfigModule must be loaded');

console.log('--- TEST 1: Check upper-side filter placement and toolbar removal ---');
const html = mod.renderContentCard();

// Assert filters are inside card-header
assert(html.includes('id="doc-print-config-filters"'), 'Must have doc-print-config-filters element');
const cardHeaderIndex = html.indexOf('class="card-header"');
const filterIndex = html.indexOf('id="doc-print-config-filters"');
const buttonIndex = html.indexOf('+ Create Configuration');
const tableIndex = html.indexOf('id="doc-print-config-table-container"');

assert(cardHeaderIndex < filterIndex, 'Filters must be located within/after card-header start');
assert(filterIndex < buttonIndex, 'Filters must be placed upperside before or beside action buttons');
assert(buttonIndex < tableIndex, 'Header & filters must be placed above table container');
assert(!html.includes('id="doc-print-config-toolbar"'), 'Separate lower toolbar box must be removed');
console.log('✓ PASS: Filters moved to upper side inside card-header, separate lower toolbar removed.');

console.log('\n--- TEST 2: Check removal of labels in table rows ---');
assert(!html.includes('Standard Default Fallback'), 'Standard Default Fallback label must be removed');
assert(!html.includes('Facility-Specific Override'), 'Facility-Specific Override label must be removed');

// Verify facility name still appears
assert(html.includes('All Facilities (Company-wide)'), 'Facility name must still appear');
assert(html.includes('Mauli Service Center 1'), 'Specific facility name must still appear');
console.log('✓ PASS: Subtitle labels removed from Facility Applicability column while facility names are preserved.');

console.log('\nALL VERIFICATION CHECKS PASSED (100%)!');
