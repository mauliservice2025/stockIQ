const fs = require('fs');
const vm = require('vm');

const sandbox = {
  window: {},
  HTMLElement: class {},
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

const mod = sandbox.window.StoreInventoryModule;
const container = { innerHTML: '' };
mod.activeTab = 'ITEM_MASTER';
mod.render(container);

console.log('container.innerHTML length:', container.innerHTML.length);
console.log('Includes tabs-header:', container.innerHTML.includes('tabs-header'));
console.log('Tabs header snippet:');
const thIdx = container.innerHTML.indexOf('tabs-header');
if (thIdx !== -1) {
  console.log(container.innerHTML.slice(thIdx, thIdx + 500));
}
