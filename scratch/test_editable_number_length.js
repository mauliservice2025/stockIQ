const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const localStorageData = {};
const mockLocalStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

const domElements = {};
const sandbox = {
  window: {
    location: { hash: '' }
  },
  localStorage: mockLocalStorage,
  document: {
    getElementById: (id) => domElements[id] || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {}, insertAdjacentHTML: (pos, html) => { sandbox.lastModalHtml = html; } }
  },
  alert: (msg) => console.log('[ALERT]:', msg),
  confirm: () => true,
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Date
};
sandbox.window.localStorage = mockLocalStorage;
sandbox.window.window = sandbox.window;
sandbox.window.alert = (msg) => console.log('[ALERT]:', msg);
sandbox.window.confirm = () => true;
sandbox.window.State = {
  currentPlantId: 'PLANT-01',
  currentUser: { full_name: 'Pravin Patil', name: 'Pravin Patil', role: 'ADMIN' },
  showToast: (msg, type) => console.log(`[TOAST] (${type}): ${msg}`),
  showModal: (opts) => console.log(`[MODAL]: ${opts.title}`),
  closeModal: () => {}
};

vm.createContext(sandbox);

vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/doc-series-master.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/billing.js', 'utf8'), sandbox);

console.log('\n--- TEST SUITE: Editable Number Length in Document Number Series Master ---');

// Setup: Series with existing transaction (current_number = 1, just like in user screenshot)
const seriesList = sandbox.window.DocSeriesMasterModule.getAllSeries();
const jcSeries = seriesList.find(s => s.doc_type_code === 'JC' && s.branch_id === 'PLANT-01');
assert(jcSeries, 'JC series for PLANT-01 must exist');
jcSeries.current_number = 1;
jcSeries.generated_count = 1;
jcSeries.number_length = 6;
sandbox.window.DB.upsert('document_number_series', jcSeries);

console.log(`[Setup] Series ${jcSeries.id}: current_number = ${jcSeries.current_number}, number_length = ${jcSeries.number_length}`);

// Test 1: Verify showEditModal renders Number Length WITHOUT disabled attribute
console.log('\n[Test 1] Testing showEditModal: Number Length must be editable (not disabled)...');
sandbox.window.DocSeriesMasterModule.showEditModal(jcSeries.id);
const modalHtml = sandbox.lastModalHtml;
assert(modalHtml, 'Modal HTML must be rendered');

// Ensure dns-modal-length does NOT have disabled
const lengthSelectMatch = modalHtml.match(/<select[^>]*id="dns-modal-length"[^>]*>/);
assert(lengthSelectMatch, 'dns-modal-length select element must exist in modal');
assert(!lengthSelectMatch[0].includes('disabled'), 'dns-modal-length must NOT have disabled attribute');
console.log('✅ Test 1 Passed: Number Length dropdown is fully enabled and editable in Edit Modal!');

// Test 2: Verify live preview reacts when changing Number Length from 6 to 4 digits
console.log('\n[Test 2] Testing live reactive preview when Number Length is changed...');
const previewEl = { innerText: '' };
const patternEl = { innerText: '' };
domElements['dns-modal-id'] = { value: jcSeries.id };
domElements['dns-modal-prefix'] = { value: 'JC' };
domElements['dns-modal-branch-code'] = { value: 'MSC1' };
domElements['dns-modal-separator'] = { value: '/' };
domElements['dns-modal-year-format'] = { value: 'YYYY' };
domElements['dns-modal-length'] = { value: '4' }; // User changes length from 6 to 4!
domElements['dns-modal-start-num'] = { value: '1' };
domElements['dns-modal-suffix'] = { value: '' };
domElements['dns-preview-display'] = previewEl;
domElements['dns-pattern-display'] = patternEl;

sandbox.window.DocSeriesMasterModule.updateModalPreview();
console.log('   Live preview text:', previewEl.innerText);
console.log('   Pattern mask text:', patternEl.innerText);
assert.strictEqual(previewEl.innerText, 'JC/MSC1/2026/0002', 'Preview must pad next sequence to 4 digits (0002)');
assert.strictEqual(patternEl.innerText, 'JC/MSC1/2026/####', 'Pattern mask must show 4 hash symbols (####)');
console.log('✅ Test 2 Passed: Live preview updated reactively to 4 digits!');

// Test 3: Verify saveEditSeries updates number_length even with existing transactions
console.log('\n[Test 3] Testing saveEditSeries saves updated number_length...');
domElements['dns-modal-reset'] = { value: 'Financial Year' };
domElements['dns-modal-status'] = { value: 'Active' };
domElements['dns-modal-eff-from'] = { value: '2026-04-01' };
domElements['dns-modal-eff-to'] = { value: '2027-03-31' };
domElements['dns-modal-desc'] = { value: 'Updated 4-digit Job Card series' };

sandbox.window.DocSeriesMasterModule.saveEditSeries({ preventDefault: () => {} }, jcSeries.id);

const updatedSeries = sandbox.window.DB.getById('document_number_series', jcSeries.id);
assert.strictEqual(updatedSeries.number_length, 4, `Series number_length should be 4, got ${updatedSeries.number_length}`);
console.log(`✅ Test 3 Passed: Number length successfully updated to ${updatedSeries.number_length} in database!`);

// Test 4: Verify subsequent number generation uses updated 4-digit padding
console.log('\n[Test 4] Testing number generation with updated 4-digit length...');
const genRes = sandbox.window.DocSeriesMasterModule.generateNextNumber('JC', 'PLANT-01');
assert(genRes.success, 'Generation should succeed');
assert.strictEqual(genRes.docNumber, 'JC/MSC1/2026/0002', `Generated number should be JC/MSC1/2026/0002, got ${genRes.docNumber}`);
console.log(`✅ Test 4 Passed: Generated ${genRes.docNumber} using the newly configured 4-digit length!`);

console.log('\n🎉 ALL EDITABLE NUMBER LENGTH TESTS PASSED SUCCESSFULLY!\n');
