const fs = require('fs');
const path = require('path');

function checkJsFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      checkJsFiles(full);
    } else if (f.endsWith('.js') || f.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (/placeholder=["'].*search/i.test(line) || /class=["'][^"']*search/i.test(line) || /id=["'][^"']*search/i.test(line)) {
          if (line.includes('<input') || (idx > 0 && lines[idx-1].includes('<input')) || (idx > 1 && lines[idx-2].includes('<input'))) {
            console.log(`${full}:${idx+1}: ${line.trim()}`);
          }
        }
      });
    }
  }
}

checkJsFiles('js');
checkJsFiles('index.html' === 'index.html' ? '.' : '.');
