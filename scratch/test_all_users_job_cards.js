const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mockDataCode = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

const domMock = {
  location: { hash: '#/dashboard' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  document: {
    getElementById() { return { setAttribute() {}, remove() {}, removeProperty() {}, setProperty() {}, innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, querySelectorAll() { return []; } }; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    documentElement: { setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} } },
    body: { classList: { add() {}, remove() {}, toggle() {} } },
    createElement() { return { setAttribute() {}, style: {}, classList: { add() {}, remove() {} } }; },
    addEventListener() {}
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

ctx.App.init();

const allUsers = ctx.DB.getAll('users');
console.log('Testing canAccessRoute(#/job-cards) for ALL users in DB:');
console.log('Total users:', allUsers.length);

allUsers.forEach(u => {
  ctx.State.currentUserId = u.id;
  const canAccess = ctx.App.canAccessRoute('#/job-cards');
  const role = ctx.DB.getById('roles', u.primary_role) || { name: u.primary_role };
  console.log(`User ${u.id} (${u.username}, Role: ${u.primary_role} - ${role.name}): canAccess = ${canAccess}`);
});
