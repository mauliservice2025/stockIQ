const fs = require('fs');
const content = fs.readFileSync('d:/Projects/ISCM/js/app.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('handleRoute')) {
    console.log(i + 1, l.trim());
  }
});
