const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'js', 'modules');
const files = fs.readdirSync(modulesDir);

const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

files.forEach(file => {
  if (!file.endsWith('.js')) return;
  const content = fs.readFileSync(path.join(modulesDir, file), 'utf8');
  const lines = content.split('\n');
  const emojiLines = [];
  lines.forEach((l, idx) => {
    if (emojiPattern.test(l)) {
      emojiLines.push({ line: idx + 1, text: l.trim() });
    }
  });
  if (emojiLines.length > 0) {
    console.log(`\n=== File: ${file} (${emojiLines.length} emoji lines) ===`);
    emojiLines.slice(0, 10).forEach(el => console.log(`  L${el.line}: ${el.text}`));
  }
});
