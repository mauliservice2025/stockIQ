const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Setup mock browser DOM environment
function createMockDom() {
  const elements = new Map();

  class MockElement {
    constructor(tagName, id = '', className = '') {
      this.tagName = tagName.toUpperCase();
      this.id = id;
      this.className = className;
      this.style = {};
      this.attributes = new Map();
      this.children = [];
      this.innerHTML = '';
      this.innerText = '';
      this.parentElement = null;
      this.classList = {
        classes: new Set(className ? className.split(' ') : []),
        add: (c) => this.classList.classes.add(c),
        remove: (c) => this.classList.classes.delete(c),
        contains: (c) => this.classList.classes.has(c)
      };
    }
    setAttribute(k, v) { this.attributes.set(k, String(v)); }
    getAttribute(k) { return this.attributes.get(k) || null; }
    hasAttribute(k) { return this.attributes.has(k); }
    removeAttribute(k) { this.attributes.delete(k); }
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    }
    querySelector(sel) {
      for (const child of this.children) {
        if (child.matches(sel)) return child;
        const found = child.querySelector(sel);
        if (found) return found;
      }
      return null;
    }
    querySelectorAll(sel) {
      const parts = sel.split(',').map(s => s.trim());
      let results = [];
      const matchAny = (el) => {
        for (const p of parts) {
          if (p.includes('sub-nav-item') && el.classList.contains('sub-nav-item')) return true;
          if (p.includes('nav-item') && el.classList.contains('nav-item')) return true;
          if (el.matches(p)) return true;
        }
        return false;
      };
      for (const child of this.children) {
        if (matchAny(child)) results.push(child);
        results = results.concat(child.querySelectorAll(sel));
      }
      return results;
    }
    closest(sel) {
      let cur = this.parentElement;
      while (cur) {
        if (cur.matches && cur.matches(sel)) return cur;
        cur = cur.parentElement;
      }
      return null;
    }
    matches(sel) {
      if (sel.includes('sub-nav-item') && this.classList.contains('sub-nav-item')) return true;
      if (sel.includes('nav-item') && (this.classList.contains('nav-item') || this.classList.contains('sub-nav-item'))) return true;
      if (sel.startsWith('#')) return this.id === sel.slice(1);
      if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
      return this.tagName.toLowerCase() === sel.toLowerCase();
    }
  }

  const doc = {
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => elements.get(id) || null,
    querySelector: (sel) => {
      for (const el of elements.values()) {
        if (el.matches(sel)) return el;
        const found = el.querySelector(sel);
        if (found) return found;
      }
      return null;
    },
    querySelectorAll: (sel) => {
      let results = [];
      for (const el of elements.values()) {
        if (el.matches(sel)) results.push(el);
        results = results.concat(el.querySelectorAll(sel));
      }
      return results;
    },
    documentElement: new MockElement('html'),
    registerElement: (el) => { if (el.id) elements.set(el.id, el); return el; },
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  return { doc, elements, MockElement };
}

const { doc, elements, MockElement } = createMockDom();

// Build mock DOM elements required by App
const viewContainer = doc.registerElement(new MockElement('div', 'view-container'));
const sidebar = doc.registerElement(new MockElement('aside', 'app-sidebar'));
const pageTitleText = doc.registerElement(new MockElement('span', 'page-title-text'));
const breadcrumbSection = doc.registerElement(new MockElement('span', 'breadcrumb-section'));
const breadcrumbCurrent = doc.registerElement(new MockElement('span', 'breadcrumb-current'));
const userProfileDropdown = doc.registerElement(new MockElement('div', 'header-user-profile'));

// Add sidebar items
const storeGroup = new MockElement('div', 'group-store', 'module-group');
const storeSubMenu = new MockElement('div', '', 'module-sub-menu');
const storeInventoryLink = new MockElement('a', '', 'sub-nav-item');
storeInventoryLink.setAttribute('href', '#/store-inventory');
storeSubMenu.appendChild(storeInventoryLink);
storeGroup.appendChild(storeSubMenu);
sidebar.appendChild(storeGroup);

const securityGroup = new MockElement('div', 'group-security', 'module-group');
const secSubMenu = new MockElement('div', '', 'module-sub-menu');
const usersLink = new MockElement('a', '', 'sub-nav-item');
usersLink.setAttribute('href', '#/users');
secSubMenu.appendChild(usersLink);
securityGroup.appendChild(secSubMenu);
sidebar.appendChild(securityGroup);

const sandbox = {
  window: {},
  document: doc,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: class { constructor(t, d) { this.type = t; this.detail = d; } },
  Event: class { constructor(t) { this.type = t; } },
  location: { hash: '#/store-inventory' },
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; }
  },
  console: console,
  scrollTo: () => {}
};
sandbox.window = sandbox;

vm.createContext(sandbox);

// Load mock-data.js, db.js, state.js, app.js, user-management.js
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const appContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const userMgmtContent = fs.readFileSync(path.join(__dirname, '../js/modules/user-management.js'), 'utf8');

vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(appContent, sandbox);
vm.runInContext(userMgmtContent, sandbox);

const DB = sandbox.window.DB;
const State = sandbox.window.State;
const App = sandbox.window.App;
const UMM = sandbox.window.UserManagementModule;

console.log('=== STARTING FULL UI & RBAC SIMULATION ===\n');

// TEST 1: User & Role Resolution for Sagar Sable
console.log('--- TEST 1: Sagar Sable User & Role ---');
const sagar = DB.getById('users', 'USR-106');
assert(sagar, 'Sagar Sable (USR-106) must exist in DB');
assert.strictEqual(sagar.primary_role, 'ROLE-002');
console.log('✓ Found user USR-106:', sagar.full_name, 'Role:', sagar.primary_role);

State.switchSimulatedUser('USR-106');
const curUser = State.getCurrentUser();
assert.strictEqual(curUser.id, 'USR-106');
console.log('✓ Switched session to user:', curUser.full_name);

// TEST 2: Route access for Sagar Sable
console.log('\n--- TEST 2: Route Access for Sagar Sable ---');
assert.strictEqual(App.canAccessRoute('#/store-inventory'), true, 'Must allow #/store-inventory');
assert.strictEqual(App.canAccessRoute('#/job-card-parts'), true, 'Must allow #/job-card-parts');
assert.strictEqual(App.canAccessRoute('#/stock-transfers'), true, 'Must allow #/stock-transfers');
assert.strictEqual(App.canAccessRoute('#/grn'), true, 'Must allow #/grn');
assert.strictEqual(App.canAccessRoute('#/security-dashboard'), false, 'Must DENY #/security-dashboard');
assert.strictEqual(App.canAccessRoute('#/users'), false, 'Must DENY #/users');
assert.strictEqual(App.canAccessRoute('#/roles'), false, 'Must DENY #/roles');
console.log('✓ Sagar has full access to Store modules and is denied Security / User / Role modules');

// TEST 3: Navigation & Screen Rendering
console.log('\n--- TEST 3: Handle Route Simulation ---');
sandbox.window.location.hash = '#/store-inventory';
App.handleRoute(false);
assert(!viewContainer.innerHTML.includes('No Accessible Modules'), 'Must NOT display "No Accessible Modules" card!');
console.log('✓ Handle route did NOT show "No Accessible Modules" banner!');
console.log('✓ View container rendered properly for Sagar Sable.');

// TEST 4: Sidebar Filtering
console.log('\n--- TEST 4: Sidebar RBAC Filtering ---');
App.filterSidebarByPermissions();
assert.strictEqual(storeGroup.style.display, '', 'Store module group must be VISIBLE');
assert.strictEqual(securityGroup.style.display, 'none', 'Security module group must be HIDDEN');
console.log('✓ Store navigation group is visible in sidebar.');
console.log('✓ Security navigation group is hidden in sidebar.');

// TEST 5: Role Master Table
console.log('\n--- TEST 5: Role Master Rendering ---');
const rolesHtml = UMM.renderRoleMaster();
assert(rolesHtml.includes('ROLE-002'), 'Role Master must display ROLE-002');
assert(rolesHtml.includes('Store Operations Executive'), 'Role Master must display "Store Operations Executive"');
assert(rolesHtml.includes('btn-disabled-blurred'), 'ROLE-002 delete button must be disabled/blurred');
assert(rolesHtml.includes('This role is assigned to one or more users. Please deactivate the role instead.'), 'Must display assigned warning tooltip');
console.log('✓ Role Master table includes ROLE-002 (Store Operations Executive).');
console.log('✓ Delete button for ROLE-002 is disabled & blurred with assigned user tooltip.');

// TEST 6: Role-Permission Matrix
console.log('\n--- TEST 6: Role-Permission Matrix Rendering ---');
UMM.selectedRoleId = 'ROLE-002';
const matrixHtml = UMM.renderSubModulePermissionMatrix('PERMISSIONS');
assert(matrixHtml.includes('ROLE-002'), 'Matrix must list ROLE-002');
assert(matrixHtml.includes('Store Operations Executive'), 'Matrix must show role name');
console.log('✓ Permission matrix successfully renders for ROLE-002.');

const storeMasterPerm = UMM.getSubModulePermEntry('ROLE-002', 'STORE_MASTER');
assert(storeMasterPerm.view === true, 'ROLE-002 must have view=true for STORE_MASTER');
console.log('✓ STORE_MASTER permission entry for ROLE-002 is verified view=true.');

console.log('\n=== ALL SIMULATION TESTS PASSED SUCCESSFULLY! ===');
