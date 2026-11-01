const fs = require('fs');

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

global.window = {
  localStorage: global.localStorage,
  addEventListener: () => {},
  dispatchEvent: () => {}
};

let mockDataContent = fs.readFileSync('d:/Projects/ISCM/js/data/mock-data.js', 'utf8');
mockDataContent = mockDataContent.replace('const INITIAL_DATA =', 'global.INITIAL_DATA =');
eval(mockDataContent);

let dbContent = fs.readFileSync('d:/Projects/ISCM/js/data/db.js', 'utf8');
dbContent = dbContent.replace('class DatabaseLayer', 'global.DatabaseLayer = class DatabaseLayer');
eval(dbContent);
global.window.DB = new DatabaseLayer();

let docSeriesContent = fs.readFileSync('d:/Projects/ISCM/js/modules/doc-series-master.js', 'utf8');
eval(docSeriesContent);

console.log('--- TEST 1: User creates a new Series for JC ---');
// Suppose user deactivated DNS-JC-001 and created DNS-JC-CUSTOM:
const all = window.DocSeriesMasterModule.getAllSeries();
const oldSeries = all.find(s => s.id === 'DNS-JC-001');
oldSeries.status = 'Inactive';
window.DB.upsert('document_number_series', oldSeries);

const newCustomSeries = {
  id: 'DNS-JC-CUSTOM',
  doc_type_code: 'JC',
  doc_type_name: 'Job Card',
  branch_id: 'PLANT-01',
  branch_code: 'MSC1',
  prefix: 'JCARD',
  separator: '/',
  year_format: 'YYYY',
  number_length: 5,
  starting_number: 1,
  current_number: 0,
  next_number: 1,
  status: 'Active',
  updated_at: new Date().toISOString()
};
window.DB.upsert('document_number_series', newCustomSeries);

console.log('Preview with custom series (PLANT-01):', window.DocSeriesMasterModule.previewNextNumber('JC', 'PLANT-01'));
console.log('Preview with custom series (MSC1):', window.DocSeriesMasterModule.previewNextNumber('JC', 'MSC1'));
console.log('Preview with custom series (MAULI-01):', window.DocSeriesMasterModule.previewNextNumber('JC', 'MAULI-01'));

console.log('\n--- TEST 2: User changes Starting Number ---');
// User edits starting number to 500
newCustomSeries.starting_number = 500;
newCustomSeries.next_number = 500;
window.DB.upsert('document_number_series', newCustomSeries);
console.log('Preview starting from 500:', window.DocSeriesMasterModule.previewNextNumber('JC', 'PLANT-01'));
const genRes = window.DocSeriesMasterModule.generateNextNumber('JC', 'PLANT-01');
console.log('Generated number:', genRes.docNumber, 'Next seq:', genRes.sequence);
console.log('Preview after generation:', window.DocSeriesMasterModule.previewNextNumber('JC', 'PLANT-01'));
