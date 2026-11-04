// Comprehensive DOM simulation for Login Branch scoping & locking
const fs = require('fs');
const assert = require('assert');

// Simple DOM element mock
class Element {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.innerHTML = '';
    this.value = '';
    this.disabled = false;
    this.style = {};
    this.attrs = {};
  }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k]; }
  focus() {}
  select() {}
}

const elements = {
  'login-username': new Element('login-username', 'input'),
  'login-password': new Element('login-password', 'input'),
  'login-branch-select': new Element('login-branch-select', 'select'),
  'login-branch-scope-badge': new Element('login-branch-scope-badge', 'span'),
  'login-branch-help-text': new Element('login-branch-help-text', 'div'),
  'login-user-match-card': new Element('login-user-match-card', 'div'),
  'login-feedback': new Element('login-feedback', 'div'),
  'global-facility-select': new Element('global-facility-select', 'select'),
  'profile-facility-list': new Element('profile-facility-list', 'div')
};

const mockDoc = {
  getElementById(id) {
    return elements[id] || null;
  }
};

global.document = mockDoc;
global.fetch = () => Promise.resolve({ ok: false });

const mockWindow = {
  DB: {
    getAll(type) {
      if (type === 'users') {
        return [
          { id: 'USR-001', username: 'PRAVINP', full_name: 'Pravin Patil', user_type: 'Admin', primary_role: 'ROLE-001', plant_id: 'PLANT-01' },
          { id: 'USR-002', username: 'RUSHID', full_name: 'Rushikesh Dhiwar', user_type: 'Employee', primary_role: 'ROLE-STORE-MGR', plant_id: 'PLANT-01' },
          { id: 'USR-106', username: 'SAGARS', full_name: 'Sagar Sable', user_type: 'Employee', primary_role: 'ROLE-STORE-EXEC', plant_id: 'PLANT-01' }
        ];
      }
      if (type === 'plants') {
        return [
          { id: 'PLANT-01', name: 'Pune Central Facility', branch_code: 'PUN-01' },
          { id: 'PLANT-02', name: 'Chakan Assembly Plant', branch_code: 'CHK-02' }
        ];
      }
      if (type === 'roles') {
        return [
          { id: 'ROLE-001', name: 'System Administrator' },
          { id: 'ROLE-STORE-MGR', name: 'Store Manager' },
          { id: 'ROLE-STORE-EXEC', name: 'Store Executive' }
        ];
      }
      return [];
    },
    getActivePlants() { return this.getAll('plants'); },
    isPlantActive() { return true; },
    getById(t, id) { return this.getAll(t).find(x => x.id === id); }
  },
  State: {
    currentPlantId: 'PLANT-01',
    showToast(m, t) { this.lastToast = { m, t }; },
    login(id, branch) { this.loggedInUser = id; this.currentPlantId = branch; },
    setPlant(p) { this.currentPlantId = p; }
  },
  document: mockDoc
};

global.window = mockWindow;

// Evaluate auth.js
const authCode = fs.readFileSync('js/modules/auth.js', 'utf8');
const evalAuth = new Function('window', 'document', authCode);
evalAuth(mockWindow, mockDoc);

const Auth = mockWindow.AuthModule;

console.log('--- 1. Testing Default / Blank State ---');
Auth.populateBranchDropdown(null);
assert.strictEqual(elements['login-branch-select'].disabled, false, 'Default select must be enabled');
assert.ok(elements['login-branch-select'].innerHTML.includes('All Branches (Consolidated)'), 'Must include Consolidated option');
console.log('✅ PASS: Blank state displays enabled dropdown with all branches');

console.log('--- 2. Testing Standard User Typing (sagar) ---');
elements['login-username'].value = 'sagar';
Auth.onLoginUsernameInput('sagar');
assert.strictEqual(elements['login-branch-select'].disabled, true, 'Sagar must have disabled select');
assert.strictEqual(elements['login-branch-select'].value, 'PLANT-01', 'Must be locked to PLANT-01');
assert.ok(elements['login-branch-scope-badge'].innerHTML.includes('Assigned Branch Locked'), 'Scope badge must show locked');
assert.ok(elements['login-branch-help-text'].innerHTML.includes('Policy Enforced'), 'Help text must show policy enforcement');
assert.ok(!elements['login-branch-select'].innerHTML.includes('All Branches (Consolidated)'), 'Must NOT include Consolidated option');
console.log('✅ PASS: Standard user automatically locks dropdown to assigned branch PLANT-01');

console.log('--- 3. Testing Standard User Trying to Submit Unauthorized Branch ---');
elements['login-username'].value = 'sagar';
elements['login-password'].value = 'Apex@2026!';
elements['login-branch-select'].value = 'PLANT-02'; // Attempting to tamper
let toastShown = false;
mockWindow.State.showToast = (msg, type) => {
  if (type === 'error' && msg.includes('Restricted')) toastShown = true;
};
Auth.submitLogin().then(() => {
  assert.strictEqual(toastShown, true, 'Must show error toast when tampering with branch');
  console.log('✅ PASS: Tampering with branch is strictly rejected with Access Denied');

  console.log('--- 4. Testing Admin User Typing (p.patil) ---');
  elements['login-username'].value = 'p.patil';
  Auth.onLoginUsernameInput('p.patil');
  assert.strictEqual(elements['login-branch-select'].disabled, false, 'Admin select must be enabled');
  assert.ok(elements['login-branch-select'].innerHTML.includes('All Branches (Consolidated)'), 'Admin select must include Consolidated');
  assert.ok(elements['login-branch-scope-badge'].innerHTML.includes('Universal Branch Scope'), 'Admin scope badge must show universal');
  console.log('✅ PASS: Admin user has unlocked dropdown with universal branch scope');

  console.log('\nALL DOM SIMULATION TESTS PASSED! 🎉');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
