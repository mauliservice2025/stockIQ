const fs = require('fs');
const path = require('path');

function findFiles(dir, match) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (!full.includes('node_modules') && !full.includes('.git')) {
          results = results.concat(findFiles(full, match));
        }
      } else if (match(file, full, stat)) {
        results.push({ full, size: stat.size, mtime: stat.mtime });
      }
    }
  } catch(e) {}
  return results;
}

const brainDir = 'C:/Users/PravinPatil/.gemini/antigravity-ide/brain';
const matches = findFiles(brainDir, (file, full, stat) => {
  return file.includes('mock') || (stat.size > 150000 && stat.size < 300000 && file.endsWith('.js'));
});

console.log('Found in brain:', matches);

const scratchMatches = findFiles('d:/Projects/ISCM/scratch', (file, full, stat) => {
  return file.includes('mock');
});
console.log('Found in scratch:', scratchMatches);
