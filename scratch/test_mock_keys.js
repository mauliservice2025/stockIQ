const fs = require('fs');
const mockDataCode = fs.readFileSync('d:/Projects/ISCM/js/data/mock-data.js', 'utf8');

const regex = /"([a-zA-Z0-9_]+)":\s*\[/g;
const keys = new Set();
let match;
while ((match = regex.exec(mockDataCode)) !== null) {
  keys.add(match[1]);
}
console.log('Collection keys in mock-data:', Array.from(keys));
