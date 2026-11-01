const fs = require('fs');

['inventory.js', 'adjustments.js', 'goods-receipt.js', 'transfers.js', 'receive-transfers.js', 'opening-balance.js'].forEach(file => {
  const lines = fs.readFileSync('js/modules/' + file, 'utf8').split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('warehouses')) {
      console.log(`${file}:${idx + 1}: ${l.trim()}`);
    }
  });
});
