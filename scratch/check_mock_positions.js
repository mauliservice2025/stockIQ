const fs = require('fs');
const content = fs.readFileSync('js/data/mock-data.js', 'utf8');

const orgIdx = content.indexOf('"organizations":');
const plantIdx = content.indexOf('"plants":');

console.log('--- From orgIdx (1000) ---');
console.log(content.slice(orgIdx, orgIdx + 1000));

console.log('--- From plantIdx (1200) ---');
console.log(content.slice(plantIdx, plantIdx + 1200));
