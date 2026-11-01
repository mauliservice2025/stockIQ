const fs = require('fs');
const lines = fs.readFileSync('js/modules/billing.js', 'utf8').split('\n');
console.log('Searching in billing.js (total lines:', lines.length, ')');

lines.forEach((l, i) => {
  if (l.includes("'jobCards'") || l.includes('"jobCards"')) {
    if (l.includes('upsert') || l.includes('save') || l.includes('edit') || l.includes('update')) {
      console.log((i + 1) + ': ' + l.trim());
    }
  }
  if (/function\s+.*jobcard|save.*jobcard|edit.*jobcard|update.*jobcard/i.test(l)) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
