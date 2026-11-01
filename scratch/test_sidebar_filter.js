const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock DOM
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Load mock-data
const mockDataModule = require('../js/data/mock-data.js');
global.INITIAL_DATA = mockDataModule.INITIAL_DATA;

const storage = {
  'ISCM_CURRENT_USER_ID': 'USR-106',
  'ISCM_LOGGED_IN': 'true'
};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

global.window = global;
global.window.addEventListener = () => {};
global.document = {
  querySelector: () => null,
  getElementById: () => null,
  querySelectorAll: () => [],
  documentElement: { setAttribute: () => {} },
  addEventListener: () => {}
};
global.CustomEvent = class CustomEvent { constructor(name, detail) { this.name = name; this.detail = detail; } };
global.dispatchEvent = () => {};

// Load db.js
const dbCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'data', 'db.js'), 'utf8');
vm.runInThisContext(dbCode);

// Load state.js
const stateCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'state.js'), 'utf8');
vm.runInThisContext(stateCode);

// Load app.js
const appCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
vm.runInThisContext(appCode);

// Let's inspect what canAccessRoute returns for every link in the sidebar!
const regex = /<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
let match;
const links = [];
while ((match = regex.exec(html)) !== null) {
  const href = match[1];
  const text = match[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  if (href.startsWith('#/')) {
    links.push({ href, text });
  }
}

window.State.login('USR-106');
const user = window.State.getCurrentUser();
console.log('Logged in as:', user.full_name, 'Role:', user.primary_role);

console.log('\n--- EVALUATING ALL SIDEBAR / APP LINKS FOR SAGAR SABLE ---');
links.forEach(l => {
  const allowed = window.App.canAccessRoute(l.href);
  const status = allowed ? 'VISIBLE' : 'HIDDEN (NO RIGHTS)';
  console.log(`${l.href.padEnd(28)} | ${status.padEnd(20)} | ${l.text}`);
});
