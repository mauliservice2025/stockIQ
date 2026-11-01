const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mockDataCode = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

const domMock = {
  location: { hash: '#/job-cards' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  document: {
    getElementById(id) {
      return {
        id,
        innerHTML: '',
        setAttribute() {},
        removeAttribute() {},
        remove() {},
        innerText: '',
        style: { setProperty() {}, removeProperty() {} },
        classList: { add() {}, remove() {}, toggle() {} },
        querySelectorAll() { return []; },
        querySelector() { return null; },
        addEventListener() {},
        focus() {}
      };
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    body: {
      classList: { add() {}, remove() {}, toggle() {} }
    },
    createElement() {
      return {
        style: {},
        classList: { add() {}, remove() {} },
        appendChild() {},
        setAttribute() {}
      };
    },
    documentElement: {
      setAttribute() {},
      classList: { add() {}, remove() {}, toggle() {} }
    },
    addEventListener() {},
    scrollTo() {}
  },
  window: {},
  addEventListener() {},
  scrollTo() {},
  dispatchEvent() {},
  CustomEvent: class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } },
  console: console,
  navigator: { userAgent: 'node' }
};

domMock.window = domMock;
const ctx = vm.createContext(domMock);

vm.runInContext(mockDataCode, ctx);
vm.runInContext(dbCode, ctx);
vm.runInContext(stateCode, ctx);
vm.runInContext(billingCode, ctx);
vm.runInContext(appCode, ctx);

console.log('Testing App initialization and route to #/job-cards:');
try {
  console.log('App instance:', typeof ctx.App);
  console.log('Current user:', ctx.State.getCurrentUser().id, ctx.State.getCurrentUser().primary_role);
  console.log('canAccessRoute(#/job-cards):', ctx.App.canAccessRoute('#/job-cards'));
  
  // Try rendering job cards tab
  const container = { innerHTML: '' };
  ctx.location.hash = '#/job-cards';
  ctx.BillingModule.render(container);
  console.log('BillingModule.render() succeeded! HTML length:', container.innerHTML.length);
} catch (err) {
  console.error('ERROR during job cards render:', err);
}
