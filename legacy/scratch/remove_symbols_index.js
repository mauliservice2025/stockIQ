const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

const bulletCountBefore = (html.match(/<span class="sub-nav-bullet"><\/span>/g) || []).length;
console.log('Bullets before:', bulletCountBefore);

// Remove sub-nav-bullet and preceding whitespace
html = html.replace(/\s*<span class="sub-nav-bullet"><\/span>/g, '');

const bulletCountAfter = (html.match(/<span class="sub-nav-bullet"><\/span>/g) || []).length;
console.log('Bullets after:', bulletCountAfter);

// Remove sub-module-icon
const iconBefore = (html.match(/<span class="sub-module-icon">[\s\S]*?<\/span>/g) || []).length;
console.log('sub-module-icon before:', iconBefore);

html = html.replace(/\s*<span class="sub-module-icon">[\s\S]*?<\/span>/g, '');

const iconAfter = (html.match(/<span class="sub-module-icon">[\s\S]*?<\/span>/g) || []).length;
console.log('sub-module-icon after:', iconAfter);

fs.writeFileSync(filePath, html, 'utf8');
console.log('index.html updated successfully.');
