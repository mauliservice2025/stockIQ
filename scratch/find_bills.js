const fs = require('fs');
const content = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('customerBills') || l.includes('finalBills') || l.includes('draftBills')) {
    if (l.includes('getAll')) console.log(i + 1, l.trim());
  }
});
