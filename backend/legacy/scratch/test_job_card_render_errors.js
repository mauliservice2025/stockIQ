const fs = require('fs');

global.window = global;
global.window.location = { hash: '#/job-cards' };
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.scrollTo = () => {};

global.localStorage = {
  _s: {},
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
  activeElement: null,
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

// Check candidateRoleIds mapping for ROLE-ADMIN
const user = {
  id: 'USR-ADMIN-01',
  username: 'admin',
  full_name: 'Pravin Patil',
  primary_role: 'ROLE-ADMIN',
  status: 'ACTIVE'
};

const allRoles = window.DB.getAll('roles') || [];
console.log('All roles count:', allRoles.length);
const foundRole = allRoles.find(r => r.id === 'ROLE-ADMIN' || r.code === 'ROLE-ADMIN');
console.log('foundRole for ROLE-ADMIN:', foundRole);

const rolePerms = window.DB.getAll('role_permissions') || [];
const mapping = rolePerms.filter(rp => rp.perm_code === 'STORE_TX_JOB_CARD_ISSUE');
console.log('role_permissions with STORE_TX_JOB_CARD_ISSUE:', mapping.map(m => m.role_id));
