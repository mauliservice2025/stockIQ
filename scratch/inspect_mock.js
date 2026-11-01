const fs = require('fs');
const mockContent = fs.readFileSync('./js/data/mock-data.js', 'utf8');
const vm = require('vm');
const sandbox = { window: {}, console: console };
vm.createContext(sandbox);
vm.runInContext(mockContent, sandbox);
console.log('Keys in sandbox.window:', Object.keys(sandbox.window));
const data = sandbox.window.INITIAL_DATA || sandbox.window.MOCK_DATA || sandbox.window.SEED_DATA;
console.log('Found data obj:', !!data);
if (data) {
  console.log('Items length:', (data.items || []).length);
  console.log('Sample item:', data.items ? data.items[0] : null);
} else {
  for (const k of Object.keys(sandbox.window)) {
    console.log(k, typeof sandbox.window[k]);
  }
}
