const fs = require('fs');
const vm = require('vm');

const sandbox = {
  window: {},
  HTMLElement: class {},
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  CustomEvent: class {},
  Event: class {},
  location: { hash: '#/item-master' },
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; }
  },
  console: console,
  document: {
    addEventListener: () => {},
    documentElement: { setAttribute: () => {}, getAttribute: () => {} },
    getElementById: (id) => {
      if (id === 'view-container') return { innerHTML: '' };
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => []
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/state.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/item-setup-master.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/org-location.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/modules/store-inventory.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('js/app.js', 'utf8'), sandbox);

const testHashes = [
  '#/item-master',
  '#/item-categories',
  '#/item-subcategories',
  '#/item-brands',
  '#/item-manufacturers',
  '#/vehicle-compatibility',
  '#/uom-master',
  '#/hsn-master'
];

testHashes.forEach(h => {
  sandbox.window.location.hash = h;
  try {
    sandbox.window.App.handleRoute(false);
    console.log(`Route ${h}: SUCCESS`);
  } catch (err) {
    console.error(`Route ${h}: FAILED ->`, err.message);
  }
});
