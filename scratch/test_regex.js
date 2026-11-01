const fs = require('fs');
const content = fs.readFileSync('js/data/mock-data.js', 'utf8');

const userId = 'USR-112';
const idRegex = new RegExp(`\\s*\\{[\\s\\S]*?"id":\\s*"${userId}"[\\s\\S]*?\\n\\s*\\},?`, 'g');
const m = content.match(idRegex);
console.log('Match found:', !!m);
if (m) {
  console.log('Matched length:', m[0].length);
  console.log('--- START MATCH ---');
  console.log(m[0].slice(0, 150));
  console.log('--- END MATCH ---');
  console.log(m[0].slice(-150));
}
