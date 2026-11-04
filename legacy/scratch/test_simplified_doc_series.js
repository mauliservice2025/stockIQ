const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing Simplified Doc Series Master DOM & Layout...');

const { INITIAL_DATA } = require('../js/data/mock-data.js');

global.window = {
  DB: {
    getAll(tbl) {
      if (tbl === 'document_number_series') return INITIAL_DATA.document_number_series;
      if (tbl === 'plants') return [
        { id: 'BR-001', code: 'PUN', name: 'Pune Main Workshop' },
        { id: 'BR-002', code: 'MUM', name: 'Mumbai Central Workshop' }
      ];
      return [];
    },
    upsert() {},
    remove() {}
  },
  State: {
    hasPermission: () => true,
    showToast: () => {}
  }
};
global.INITIAL_DATA = INITIAL_DATA;

require('../js/modules/doc-series-master.js');
const mod = global.window.DocSeriesMasterModule;

const html = mod.renderContentCard();

// 1. Must NOT contain redundant <h2> heading
assert(!html.includes('<h2'), 'Must not contain redundant <h2> title inside card');
console.log('✓ Pass: No redundant <h2> title inside card.');

// 2. Must start with standard <div class="content-card"
assert(html.includes('<div class="content-card" id="doc-series-wrapper"'), 'Must have root .content-card wrapper');
console.log('✓ Pass: Root container is standard .content-card.');

// 3. Must contain clean .card-header
assert(html.includes('<div class="card-header"'), 'Must have .card-header');
console.log('✓ Pass: Contains .card-header.');

// 4. Check clean left toolbar filters and right actions
assert(html.includes('id="doc-series-search-input"'), 'Search input exists');
assert(html.includes('id="doc-series-type-filter"'), 'Doc type filter exists');
assert(html.includes('id="doc-series-branch-filter"'), 'Branch filter exists');
assert(html.includes('id="doc-series-status-filter"'), 'Status filter exists');
assert(html.includes('Test Generator'), 'Test generator button exists');
assert(html.includes('Export CSV'), 'Export CSV button exists');
assert(html.includes('+ Add Number Series'), '+ Add Number Series button exists');
console.log('✓ Pass: All filters and actions present with ample breathing room.');

// 5. Check table structure
assert(html.includes('<div class="table-responsive">'), 'Table is wrapped in table-responsive');
assert(html.includes('<table class="data-table">'), 'Table has data-table class');
console.log('✓ Pass: Clean responsive data table.');

// 6. Check that rows do NOT have cluttered subtext
assert(!html.includes('Length: 6 digits | Sep:'), 'No noisy "Length: 6 digits | Sep:" subtext');
assert(!html.includes('CODE: PUN'), 'No noisy "CODE: PUN" badge subtext');
assert(!html.includes('Start: 1'), 'No noisy "Start: 1" subtext');
console.log('✓ Pass: All duplicate/noisy subtext removed from rows.');

// 7. Check 3 clean action buttons per row
const tableContent = mod.renderTableContent();
assert(tableContent.includes('triggerQuickGenerate'), 'Contains ⚡ triggerQuickGenerate');
assert(tableContent.includes('showEditModal'), 'Contains ✏️ showEditModal');
assert(tableContent.includes('deleteSeries'), 'Contains 🗑️ deleteSeries');
// Check that 👁️ (showDetailsModal) and 🔒 (toggleStatus) are not cluttering every row
assert(!tableContent.includes('showDetailsModal'), 'Table rows do not have redundant 👁️ showDetailsModal button');
assert(!tableContent.includes('toggleStatus'), 'Table rows do not have redundant 🔒 toggleStatus button');
console.log('✓ Pass: Table action buttons simplified to 3 standard icons (⚡, ✏️, 🗑️).');

console.log('\nAll Simplified Doc Series Master assertions passed with flying colors!');
