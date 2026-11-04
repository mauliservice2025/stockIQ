const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find all module-sub-menu contents
const subMenuRegex = /<div class="module-sub-menu">([\s\S]*?)<\/div>\s*<\/div>/g;
let match;
let groupIndex = 0;
while ((match = subMenuRegex.exec(html)) !== null) {
  groupIndex++;
  console.log('--- Sub Menu Group ' + groupIndex + ' ---');
  const lines = match[1].split('\n');
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('<a') || trimmed.startsWith('<span') || trimmed.startsWith('<div class="sub-module')) {
      console.log(trimmed);
    }
  });
}
