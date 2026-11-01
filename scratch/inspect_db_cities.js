const fs = require('fs');
const files = ['js/data/db.js', 'js/data/mock-data.js'];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('cities') || l.includes('Pune') || l.includes('Chakan') || l.includes('CITY-01')) {
      console.log(`${f}:${i+1}: ${l.trim().substring(0, 100)}`);
    }
  });
});
