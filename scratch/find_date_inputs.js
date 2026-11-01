const fs = require('fs');

const content = fs.readFileSync('js/modules/billing.js', 'utf8');
const lines = content.split('\n');

console.log('--- Date inputs in billing.js ---');
lines.forEach((l, i) => {
  if (l.includes('type="date"') || l.includes("type='date'") || l.includes('Date:')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
