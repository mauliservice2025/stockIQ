const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mockDataCode = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

const eventListeners = {};

const elementsById = {};
function getOrCreateElem(id) {
  if (!elementsById[id]) {
    elementsById[id] = {
      id,
      innerHTML: '',
      innerText: '',
      textContent: '',
      style: {
        setProperty(k, v) { this[k] = v; },
        removeProperty(k) { delete this[k]; }
      },
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); },
        toggle(c, force) {
          if (force === undefined) {
            if (this._set.has(c)) { this._set.delete(c); return false; }
            else { this._set.add(c); return true; }
          }
          if (force) this._set.add(c); else this._set.delete(c);
          return force;
        }
      },
      hasAttribute() { return false; },
      getAttribute() { return null; },
      setAttribute() {},
      removeAttribute() {},
      remove() {},
      closest() { return null; },
      querySelectorAll() { return []; },
      querySelector() { return null; },
      addEventListener() {}
    };
  }
  return elementsById[id];
}

const domMock = {
  location: { hash: '#/dashboard' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  document: {
    getElementById(id) { return getOrCreateElem(id); },
    querySelector(sel) {
      if (sel.startsWith('#')) return getOrCreateElem(sel.slice(1));
      return getOrCreateElem('elem_' + sel.replace(/[^a-zA-Z0-9]/g, '_'));
    },
    querySelectorAll(sel) {
      return [
        {
          getAttribute(a) { if (a === 'href') return '#/job-cards'; return null; },
          classList: { add() {}, remove() {} },
          closest() { return null; }
        }
      ];
    },
    documentElement: {
      setAttribute() {},
      classList: { add() {}, remove() {}, toggle() {} }
    },
    body: {
      classList: { add() {}, remove() {}, toggle() {} }
    },
    createElement() {
      return getOrCreateElem('new_el_' + Math.random());
    },
    addEventListener(evt, fn) {
      if (!eventListeners[evt]) eventListeners[evt] = [];
      eventListeners[evt].push(fn);
    }
  },
  window: {},
  addEventListener(evt, fn) {
    if (!eventListeners[evt]) eventListeners[evt] = [];
    eventListeners[evt].push(fn);
  },
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

console.log('Testing App init:');
ctx.App.init();

console.log('--- Current Route:', ctx.location.hash);
console.log('--- Simulating click on Job Card Menu (navigating to #/job-cards):');

// Simulate hash change to #/job-cards
ctx.location.hash = '#/job-cards';
try {
  ctx.App.handleRoute();
  console.log('✓ Successfully handled route to #/job-cards');
  const viewContainer = elementsById['view-container'];
  console.log('view-container innerHTML length:', viewContainer ? viewContainer.innerHTML.length : 0);
  console.log('Contains Job Card Management?', viewContainer && viewContainer.innerHTML.includes('Job Card Management'));
} catch (err) {
  console.error('FAILED handleRoute to #/job-cards:', err);
}
