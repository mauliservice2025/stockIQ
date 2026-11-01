const fs = require('fs');
const content = fs.readFileSync('js/data/mock-data.js', 'utf8');
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
const res = vm.runInContext(content + '\n;INITIAL_DATA;', sandbox);
const series = res.document_number_series || [];
console.log('Total document number series in INITIAL_DATA:', series.length);
series.forEach(s => {
  console.log(`${s.id} | ${s.doc_type_code} | ${s.branch_id} | ${s.branch_code} | ${s.prefix}`);
});
