const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('ENTERPRISE ISCM - DOCUMENT NUMBER SERIES MASTER TEST SUITE');
console.log('BRD v1.0 Compliance & Organizational Placement Verification');
console.log('================================================================\n');

// 1. Navigation & DOM Placement in index.html
console.log('--- TEST 1: Navigation & DOM Placement in index.html ---');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Check that subgroup-org-location contains Facility Master and Document Number Series Master
const orgSubgroupMatch = indexHtml.match(/id="subgroup-org-location"[\s\S]*?<\/div>\s*<\/div>/);
assert(orgSubgroupMatch, 'subgroup-org-location must exist in index.html');
const orgSubgroupHtml = orgSubgroupMatch[0];

const branchIdx = orgSubgroupHtml.indexOf('href="#/branches"');
const docSeriesIdx = orgSubgroupHtml.indexOf('href="#/doc-series"');
assert(branchIdx !== -1, 'Facility Master (href="#/branches") must exist in Organization & Facility Setup');
assert(docSeriesIdx !== -1, 'Document Number Series Master (href="#/doc-series") must exist in Organization & Facility Setup');
assert(docSeriesIdx > branchIdx, 'Document Number Series Master must be placed BELOW Facility Master');

// Check clean label (zero emojis)
const docSeriesLinkMatch = orgSubgroupHtml.match(/<a[^>]*href="#\/doc-series"[^>]*>[\s\S]*?<\/a>/);
assert(docSeriesLinkMatch, 'Link element for #/doc-series must exist');
const linkText = docSeriesLinkMatch[0];
assert(linkText.includes('<span class="sub-nav-title">Document Number Series Master</span>'), 'Link title must say "Document Number Series Master" without symbols');
const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert(!emojiPattern.test(linkText), 'No emojis permitted in sub-nav-title');
console.log('✓ Document Number Series Master link exists inside Organization Setup directly below Facility Master.');
console.log('✓ Clean typography: Zero symbols/emojis in navigation title.');

// Check script tag in index.html
assert(indexHtml.includes('js/modules/doc-series-master.js'), 'index.html must include script tag for doc-series-master.js');
console.log('✓ Script tag for doc-series-master.js is loaded in index.html.');

// 2. Router & RBAC in js/app.js & js/state.js
console.log('\n--- TEST 2: Routing Configuration & RBAC ---');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appJs.includes("'#/doc-series': { module: window.OrgLocationModule"), 'Route #/doc-series must map to OrgLocationModule');
assert(appJs.includes("section: 'Admin Pannel'"), 'Section must be Admin Pannel');
assert(appJs.includes("subSection: 'Organization & Facility Setup'"), 'subSection must be Organization & Facility Setup');
assert(appJs.includes("'#/doc-series': 'DOC_SERIES_MASTER'"), 'Route #/doc-series must require DOC_SERIES_MASTER permission');

const stateJs = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
assert(stateJs.includes("'DOC_SERIES_MASTER': 'MASTERS'"), 'state.js aliasMap must map DOC_SERIES_MASTER to MASTERS category');

const mockDataJs = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
assert(mockDataJs.includes('"id": "PERM-DOC-SERIES"'), 'PERM-DOC-SERIES must exist in mock-data permissions');
assert(mockDataJs.includes('"code": "DOC_SERIES_MASTER"'), 'DOC_SERIES_MASTER code must exist in mock-data');
console.log('✓ Router maps #/doc-series under Admin Pannel -> Organization & Facility Setup.');
console.log('✓ RBAC: DOC_SERIES_MASTER alias mapped to MASTERS permission in state.js.');

// 3. Tab Integration in js/modules/org-location.js
console.log('\n--- TEST 3: Tab Integration in org-location.js ---');
const orgLocJs = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');

// Check tabConfig ordering: ORGANIZATIONS -> BRANCHES -> DOC_SERIES -> STORES ...
assert(orgLocJs.includes("{ key: 'DOC_SERIES', perm: 'DOC_SERIES_MASTER', label: 'Document Number Series Master' }"), 'DOC_SERIES tab must exist in tabConfig');
const branchTabIdx = orgLocJs.indexOf("key: 'BRANCHES'");
const docSeriesTabIdx = orgLocJs.indexOf("key: 'DOC_SERIES'");
assert(docSeriesTabIdx > branchTabIdx, 'DOC_SERIES tab must appear after BRANCHES (Facility Master) in tabConfig');

// Check hash sync and routeMap
assert(orgLocJs.includes("hash === '#/doc-series'"), 'org-location.js must synchronize activeTab to DOC_SERIES on #/doc-series');
assert(orgLocJs.includes("'DOC_SERIES': '#/doc-series'"), 'routeMap must map DOC_SERIES to #/doc-series');
assert(orgLocJs.includes("if (this.activeTab === 'DOC_SERIES') return this.renderDocSeriesTab();"), 'renderActiveTabContent must delegate to renderDocSeriesTab');
assert(orgLocJs.includes("renderDocSeriesTab()"), 'renderDocSeriesTab method must exist in OrgLocationModule');
assert(!orgLocJs.includes('<div class="card-title">'), 'Zero redundant card-title elements in org-location.js');
console.log('✓ org-location.js tabConfig lists Document Number Series Master directly below Facility Master.');
console.log('✓ Zero redundant card-title tags in org-location.js.');

// 4. Seed Data Verification
console.log('\n--- TEST 4: Seed Data in INITIAL_DATA.document_number_series ---');
const { INITIAL_DATA } = require('../js/data/mock-data.js');
assert(Array.isArray(INITIAL_DATA.document_number_series), 'INITIAL_DATA.document_number_series must be an array');
assert(INITIAL_DATA.document_number_series.length >= 14, `Must have at least 14 seed records (found ${INITIAL_DATA.document_number_series.length})`);

const docTypes = new Set(INITIAL_DATA.document_number_series.map(s => s.doc_type_code));
const requiredDocTypes = ['WO', 'JC', 'INV', 'CS', 'PO', 'GRN', 'PR', 'SR', 'ST', 'MI', 'MR', 'CN', 'DN', 'WC'];
requiredDocTypes.forEach(type => {
  assert(docTypes.has(type), `Required document type ${type} must be seeded`);
});
console.log(`✓ Seed data contains ${INITIAL_DATA.document_number_series.length} series covering all 14 BRD document types: ${requiredDocTypes.join(', ')}.`);

// 5. Number Formatting Engine & BRD Standard Examples
console.log('\n--- TEST 5: Number Formatting Engine & Examples ---');
// Mock window & environment to test doc-series-master.js logic
global.window = {
  DB: {
    data: {
      document_number_series: JSON.parse(JSON.stringify(INITIAL_DATA.document_number_series)),
      plants: []
    },
    getAll(col) { return this.data[col] || []; },
    upsert(col, item) {
      if (!this.data[col]) this.data[col] = [];
      const idx = this.data[col].findIndex(x => x.id === item.id);
      if (idx !== -1) this.data[col][idx] = item;
      else this.data[col].push(item);
      return item;
    },
    remove(col, id) {
      if (!this.data[col]) return;
      this.data[col] = this.data[col].filter(x => x.id !== id);
    }
  },
  State: {
    showToast(msg, type) { /* mock toast */ }
  }
};
global.INITIAL_DATA = INITIAL_DATA;

require('../js/modules/doc-series-master.js');
const mod = global.window.DocSeriesMasterModule;
assert(mod, 'DocSeriesMasterModule must be mounted to window');

// Test standard format: PREFIX/BRANCH/YYYY/######
const sampleConfig = {
  prefix: 'WO',
  branch_code: 'MSC1',
  separator: '/',
  year_format: 'YYYY',
  number_length: 6,
  starting_number: 1
};
const formattedSample = mod.formatDocumentNumber(sampleConfig, 1);
assert.strictEqual(formattedSample, 'WO/MSC1/2026/000001', `Formatted sample must be WO/MSC1/2026/000001 (got ${formattedSample})`);
console.log('✓ Format 1 (Standard): WO/MSC1/2026/000001 matches BRD Section 2 & 46.');

// Test next number for Mauli 1 WO (curr=0, start=1)
const puneWo = mod.getAllSeries().find(s => s.id === 'DNS-001');
assert(puneWo, 'DNS-001 must exist');
const puneWoNext = mod.formatDocumentNumber(puneWo, (puneWo.current_number || 0) + 1);
assert.strictEqual(puneWoNext, 'WO/MSC1/2026/000001', `Mauli 1 WO next must be WO/MSC1/2026/000001 (got ${puneWoNext})`);
console.log('✓ Next Mauli Service Center 1 Work Order: WO/MSC1/2026/000001 starts from 1.');

// Test Mauli 2 WO (curr=0, start=1)
const mumWo = mod.getAllSeries().find(s => s.id === 'DNS-002');
assert(mumWo, 'DNS-002 must exist');
const mumWoNext = mod.formatDocumentNumber(mumWo, (mumWo.current_number || 0) + 1);
assert.strictEqual(mumWoNext, 'WO/MSC2/2026/000001', `Mauli 2 WO next must be WO/MSC2/2026/000001 (got ${mumWoNext})`);
console.log('✓ Next Mauli Service Center 2 Work Order: WO/MSC2/2026/000001 starts from 1.');

// Test Mauli 1 Tax Invoice (curr=0, start=1)
const puneInv = mod.getAllSeries().find(s => s.id === 'DNS-004');
assert(puneInv, 'DNS-004 must exist');
const puneInvNext = mod.formatDocumentNumber(puneInv, (puneInv.current_number || 0) + 1);
assert.strictEqual(puneInvNext, 'INV/MSC1/2026/000001', `Mauli 1 Invoice next must be INV/MSC1/2026/000001 (got ${puneInvNext})`);
console.log('✓ Next Mauli Service Center 1 Invoice: INV/MSC1/2026/000001 starts from 1.');

// 6. Atomic Number Generation Engine (BRD Section 40, BNR-03, AC-02, AC-07)
console.log('\n--- TEST 6: Atomic Sequential Number Generation Engine ---');
const genResult1 = mod.generateNextNumber('WO', 'PLANT-01');
assert(genResult1.success, 'Generation 1 must succeed');
assert.strictEqual(genResult1.docNumber, 'WO/MSC1/2026/000001', 'First generated number must be WO/MSC1/2026/000001');
assert.strictEqual(genResult1.sequence, 1, 'Sequence must increment to 1');

const genResult2 = mod.generateNextNumber('WO', 'PLANT-01');
assert(genResult2.success, 'Generation 2 must succeed');
assert.strictEqual(genResult2.docNumber, 'WO/MSC1/2026/000002', 'Second generated number must be WO/MSC1/2026/000002');
assert.strictEqual(genResult2.sequence, 2, 'Sequence must increment to 2');
console.log('✓ Atomic sequential generator safely increments sequence: 0 -> 1 -> 2.');

// 7. Business Protection Rules
console.log('\n--- TEST 7: Business Protection Rules (BNR-05, BNR-06, AC-12, AC-13) ---');

// AC-13 / BNR-06: Inactive series cannot generate numbers
const inactiveSeries = mod.getAllSeries().find(s => s.status === 'Inactive');
assert(inactiveSeries, 'Must have at least one Inactive series');
const inactiveGenResult = mod.generateNextNumber(inactiveSeries.doc_type_code, inactiveSeries.branch_id);
// It should either fail or not match the inactive series
if (inactiveGenResult.success) {
  assert(inactiveGenResult.seriesId !== inactiveSeries.id, 'Inactive series must never generate document numbers');
}
console.log('✓ Inactive series cannot generate new document numbers (AC-13 / BNR-06).');

// AC-12 / BNR-05: Used number series cannot be physically deleted
const usedSeries = mod.getAllSeries().find(s => s.id === 'DNS-001');
assert(usedSeries.generated_count > 0, 'DNS-001 must have generated count > 0');
let alertTriggered = false;
global.alert = (msg) => { alertTriggered = true; };
mod.deleteSeries('DNS-001');
assert(alertTriggered, 'Attempt to delete used series must trigger alert/warning');
assert(mod.getAllSeries().some(s => s.id === 'DNS-001'), 'Used series must NOT be deleted from DB');
console.log('✓ Deletion protection: Used number series (generated_count > 0) cannot be deleted (BNR-05 / AC-12).');

// Unused series CAN be deleted
const unusedSeries = mod.getAllSeries().find(s => s.id === 'DNS-016');
assert(unusedSeries && unusedSeries.generated_count === 0, 'DNS-016 must be unused');
global.confirm = () => true;
mod.deleteSeries('DNS-016');
assert(!mod.getAllSeries().some(s => s.id === 'DNS-016'), 'Unused series should be safely deletable');
console.log('✓ Unused number series (generated_count === 0) can be deleted safely.');

console.log('\n================================================================');
console.log('🎉 ALL DOCUMENT NUMBER SERIES MASTER TESTS PASSED (100%)!');
console.log('================================================================\n');
