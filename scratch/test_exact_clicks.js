const fs = require('fs');

class Element {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      _classes: new Set(className.split(' ').filter(Boolean)),
      add(...c) { c.forEach(x => this._classes.add(x)); },
      remove(...c) { c.forEach(x => this._classes.delete(x)); },
      contains(x) { return this._classes.has(x); },
      toggle(x) { if (this.contains(x)) this.remove(x); else this.add(x); }
    };
    this.style = {
      _styles: {},
      setProperty(k, v) { this._styles[k] = v; },
      removeProperty(k) { delete this._styles[k]; }
    };
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this._innerHTML = '';
  }
  remove() {}
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
  hasAttribute(k) { return this.attributes[k] !== undefined; }
  removeAttribute(k) { delete this.attributes[k]; }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) { this._innerHTML = v; }
  closest(selector) {
    let curr = this;
    while (curr) {
      if (selector.startsWith('#') && curr.id === selector.slice(1)) return curr;
      if (selector.startsWith('.') && curr.classList.contains(selector.slice(1))) return curr;
      curr = curr.parentNode;
    }
    return null;
  }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
}

const elementsById = {};
function getEl(id) {
  if (!elementsById[id]) {
    elementsById[id] = new Element('div', id);
  }
  return elementsById[id];
}

global.window = global;
global.window.location = { hash: '#/billing-dashboard' };
global.window.addEventListener = (ev, fn) => {
  if (!global.window._listeners) global.window._listeners = {};
  if (!global.window._listeners[ev]) global.window._listeners[ev] = [];
  global.window._listeners[ev].push(fn);
};
global.window.removeEventListener = () => {};
global.window.scrollTo = () => {};
global.window.getSelection = () => ({ toString: () => '', anchorNode: null });

global.localStorage = {
  _s: { ISCM_CURRENT_USER_ID: 'USR-111', ISCM_PLANT_ID: 'PLANT-01' },
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = v; },
  removeItem(k) { delete this._s[k]; }
};

global.document = {
  documentElement: new Element('html'),
  body: new Element('body'),
  getElementById: (id) => getEl(id),
  querySelector: (sel) => {
    if (sel.startsWith('#')) return getEl(sel.slice(1));
    return new Element('div');
  },
  querySelectorAll: (sel) => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.CustomEvent = class { constructor(type, detail) { this.type = type; this.detail = detail; } };
global.dispatchEvent = () => {};

eval(fs.readFileSync('js/data/mock-data.js', 'utf8').replace('const INITIAL_DATA', 'global.INITIAL_DATA'));
eval(fs.readFileSync('js/data/db.js', 'utf8'));
eval(fs.readFileSync('js/state.js', 'utf8'));
eval(fs.readFileSync('js/pagination.js', 'utf8'));
eval(fs.readFileSync('js/modules/billing.js', 'utf8'));
eval(fs.readFileSync('js/app.js', 'utf8'));
eval(fs.readFileSync('js/modules/pinned-submodules.js', 'utf8'));

// Initial state: Start on #/billing-dashboard
console.log('--- Initial Route: #/billing-dashboard ---');
window.App.handleRoute();
console.log('Initial activeTab:', window.BillingModule.activeTab);

// Now simulate clicking: window.location.hash = '#/job-cards'
console.log('\n--- Action 1: User navigates to #/job-cards ---');
window.location.hash = '#/job-cards';
// Fire hashchange listeners
(window._listeners['hashchange'] || []).forEach(fn => fn());

console.log('After hashchange activeTab:', window.BillingModule.activeTab);
console.log('After hashchange jobCardSubView:', window.BillingModule.jobCardSubView);
const viewContainer = getEl('view-container');
console.log('Does viewContainer have "Job Card Management"?', viewContainer.innerHTML.includes('Job Card Management'));
console.log('Does viewContainer have "Connected Two-Wheeler Workshop"?', viewContainer.innerHTML.includes('Connected Two-Wheeler Workshop'));

// Now simulate clicking the top tab button when hash is ALREADY #/job-cards:
console.log('\n--- Action 2: Click Job Cards Tab when already on #/job-cards ---');
// onclick code from line 470:
window.BillingModule.activeTab='JOB_CARDS'; 
window.BillingModule.setJobCardsSubView('REGISTER'); 
if (window.location.hash==='#/job-cards') {
  window.BillingModule.refresh();
} else {
  window.location.hash='#/job-cards';
}

console.log('After clicking tab, activeTab:', window.BillingModule.activeTab);
const subview = getEl('billing-subview-container');
console.log('Does billing-subview-container have "Job Card Management"?', subview.innerHTML.includes('Job Card Management'));
console.log('Does billing-subview-container have "Connected Two-Wheeler Workshop"?', subview.innerHTML.includes('Connected Two-Wheeler Workshop'));
