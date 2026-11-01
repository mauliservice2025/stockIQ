const fs = require('fs');

const content = fs.readFileSync('js/modules/user-management.js', 'utf8');
const re = /window\.DB\.(?:getAll|insert|update|delete|find)\(['"]([^'"]+)['"]/g;
let m;
const set = new Set();
while ((m = re.exec(content)) !== null) {
  set.add(m[1]);
}
console.log('Collections in user-management:', Array.from(set));
