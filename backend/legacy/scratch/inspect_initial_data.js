const fs = require('fs');
const code = fs.readFileSync('js/data/mock-data.js', 'utf8');
const vm = require('vm');
const ctx = {};
vm.runInNewContext(code.replace('const INITIAL_DATA =', 'var INITIAL_DATA ='), ctx);
console.log('Keys in INITIAL_DATA:', Object.keys(ctx.INITIAL_DATA));
