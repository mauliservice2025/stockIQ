const fs = require('fs');
const code = fs.readFileSync('js/modules/store-inventory.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('<button class="btn btn-icon') || (l.includes('Actions') && lines[i+1]?.includes('<td'))) {
    console.log((i+1) + ': ' + l.trim());
  }
});
