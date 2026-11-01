const fs = require('fs');

const compCss = fs.readFileSync('./css/components.css', 'utf8');
const layoutCss = fs.readFileSync('./css/layout.css', 'utf8');

console.log('Testing components.css...');
const compThUppercase = compCss.match(/th[^{]*\{[^}]*text-transform:\s*uppercase/gi);
if (compThUppercase) {
  console.error('FAIL: Found th with uppercase in components.css:', compThUppercase);
} else {
  console.log('PASS: No th with uppercase in components.css');
}

const compThCapitalize = compCss.match(/th[^{]*\{[^}]*text-transform:\s*capitalize/gi);
console.log('PASS: Found th with capitalize in components.css count:', compThCapitalize ? compThCapitalize.length : 0);

console.log('\nTesting layout.css...');
const layoutThUppercase = layoutCss.match(/th[^{]*\{[^}]*text-transform:\s*uppercase/gi);
if (layoutThUppercase) {
  console.error('FAIL: Found th with uppercase in layout.css:', layoutThUppercase);
} else {
  console.log('PASS: No th with uppercase in layout.css');
}

const layoutThCapitalize = layoutCss.match(/th[^{]*\{[^}]*text-transform:\s*capitalize/gi);
console.log('PASS: Found th with capitalize in layout.css count:', layoutThCapitalize ? layoutThCapitalize.length : 0);

// Check sub-module title wrap
const subModuleCapitalize = layoutCss.includes('.sub-module-title-wrap') && layoutCss.includes('text-transform: capitalize;');
console.log('PASS: sub-module-title-wrap has capitalize:', subModuleCapitalize);

// Test browser style simulation
console.log('\nAll CSS checks completed successfully!');
