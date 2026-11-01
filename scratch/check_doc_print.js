const fs = require('fs');
const content = fs.readFileSync('js/modules/doc-print-config.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  const match = l.match(/^\s{2}([a-zA-Z0-9_]+)\s*\(/);
  if (match) {
    console.log((i + 1) + ': ' + match[1]);
  }
});
