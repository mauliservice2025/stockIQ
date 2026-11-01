const fs = require('fs');
const lines = fs.readFileSync('js/data/mock-data.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('"USR-001"') || l.includes('"USR-002"') || l.includes('"USR-106"')) {
    console.log(i + 1, l);
  }
});
