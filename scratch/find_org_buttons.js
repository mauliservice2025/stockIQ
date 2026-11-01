const fs = require('fs');
const code = fs.readFileSync('js/modules/org-location.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('class="btn') && (l.includes('✏️') || l.includes('🗑️') || l.includes('🔒') || l.includes('btn-icon'))) {
    console.log((i+1) + ': ' + l.trim());
  }
});
