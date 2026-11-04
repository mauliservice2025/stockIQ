const fs = require('fs');
const vm = require('vm');
const mockDataContent = fs.readFileSync('js/data/mock-data.js', 'utf8');
const dbContent = fs.readFileSync('js/data/db.js', 'utf8');
const stateContent = fs.readFileSync('js/state.js', 'utf8');
const appContent = fs.readFileSync('js/app.js', 'utf8');

const sandbox = {
  console,
  window: {},
  document: {
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => null,
    documentElement: { setAttribute: () => {} }
  },
  CustomEvent: class {}
};
sandbox.window = sandbox;
sandbox.window.document = sandbox.document;
sandbox.window.addEventListener = () => {};
sandbox.window.dispatchEvent = () => {};
sandbox.localStorage = { getItem: () => null, setItem: () => {} };

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(appContent, sandbox);

const db = sandbox.DB;
const sanket = db.getAll('users').find(u => u.username === 'SANKETB');
console.log('Sanket user found:', sanket.username, sanket.primary_role);

sandbox.State.currentUserId = sanket.id;
console.log('State.getCurrentUser():', sandbox.State.getCurrentUser().username, sandbox.State.getCurrentUser().primary_role);

const app = sandbox.App;
const routes = Object.keys(app.routes);
const accessible = [];
const blocked = [];

for (const r of routes) {
  if (app.canAccessRoute(r)) {
    accessible.push(r);
  } else {
    blocked.push(r);
  }
}

console.log('Accessible routes (' + accessible.length + '):', accessible);
console.log('Blocked routes (' + blocked.length + '):', blocked);
