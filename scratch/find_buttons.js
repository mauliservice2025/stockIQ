const fs = require('fs');
const code = fs.readFileSync('js/modules/item-setup-master.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('<button class="btn') && (l.includes('Edit') || l.includes('✏️') || l.includes('Deactivate') || l.includes('Delete') || l.includes('🗑️') || l.includes('btn-xs'))) {
    console.log((i+1) + ': ' + l.trim());
  }
});
