const fs = require('fs');
global.window = global;
eval(fs.readFileSync('js/data/mock-data.js', 'utf8'));

console.log('INITIAL_DATA.permissions length:', (INITIAL_DATA.permissions || []).length);
console.log('Sample permissions:', (INITIAL_DATA.permissions || []).slice(0, 3));
console.log('Categories/modules in permissions:', Array.from(new Set((INITIAL_DATA.permissions || []).map(p => p.module))));
