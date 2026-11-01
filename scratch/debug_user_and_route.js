const fs = require('fs');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.location = { hash: '#/job-cards' };
global.window.scrollTo = () => {};

global.localStorage = {
  _s: { ISCM_CURRENT_USER_ID: 'USR-001' },
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = v; },
  removeItem(k) { delete this._s[k]; }
};

const dummyEl = { 
  innerHTML: '', 
  addEventListener: () => {}, 
  removeEventListener: () => {},
  classList: { remove: () => {}, add: () => {}, toggle: () => {}, contains: () => false },
  style: { setProperty: () => {}, removeProperty: () => {} },
  setAttribute: () => {},
  getAttribute: () => null,
  querySelectorAll: () => [],
  querySelector: () => null,
  remove: () => {}
};

global.document = {
  documentElement: dummyEl,
  body: dummyEl,
  getElementById: (id) => dummyEl,
  querySelector: () => dummyEl,
  querySelectorAll: () => [],
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

// Test: hash = '#/job-cards'
window.location.hash = '#/job-cards';
console.log('App.canAccessRoute(#/job-cards):', window.App.canAccessRoute('#/job-cards'));

const container = { innerHTML: '' };
global.document.getElementById = (id) => id === 'view-container' ? container : dummyEl;

window.App.handleRoute();

console.log('BillingModule.activeTab after handleRoute():', window.BillingModule.activeTab);
console.log('BillingModule.jobCardSubView:', window.BillingModule.jobCardSubView);

if (container.innerHTML.includes('Connected Two-Wheeler Workshop & Billing Workflow')) {
  console.log('Container rendered: DASHBOARD (Connected Two-Wheeler Workshop & Billing Workflow)');
} else if (container.innerHTML.includes('Job Card Management')) {
  console.log('Container rendered: JOB CARD MANAGEMENT REGISTER');
} else {
  console.log('Container rendered something else, length:', container.innerHTML.length);
}
