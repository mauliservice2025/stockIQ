const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Find all module-sub-menu sections
const subMenuMatches = html.match(/class="module-sub-menu"[\s\S]*?(?=(?:<div class="module-group"|<\/nav>))/g) || [];
console.log('Sub-menus found:', subMenuMatches.length);

const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

subMenuMatches.forEach((sm, i) => {
  const lines = sm.split('\n');
  lines.forEach((line, l) => {
    if (emojiPattern.test(line)) {
      console.log(`Emoji in sub-menu ${i}, line:`, line.trim());
    }
  });
});

// Also check sub-nav-bullet
const bullets = (html.match(/class="sub-nav-bullet"/g) || []).length;
console.log('Total sub-nav-bullets in index.html:', bullets);

// Also check sub-module-icon
const icons = (html.match(/class="sub-module-icon"/g) || []).length;
console.log('Total sub-module-icons in index.html:', icons);
