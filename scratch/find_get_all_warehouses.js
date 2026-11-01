const fs = require('fs');

fs.readdirSync('js/modules').forEach(f => {
  if (f.endsWith('.js')) {
    const lines = fs.readFileSync('js/modules/' + f, 'utf8').split('\n');
    lines.forEach((l, idx) => {
      if (l.includes("getAll('warehouses')") || l.includes('getAll("warehouses")')) {
        console.log(`${f}:${idx + 1}: ${l.trim()}`);
      }
    });
  }
});
