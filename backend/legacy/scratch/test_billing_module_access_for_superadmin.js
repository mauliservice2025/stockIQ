const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: BILLING & JOB CARD ACCESS FOR SUPERADMIN (ROLE-001) ===\n');

// Mock browser environment
global.window = global;
global.window.location = { hash: '#/users' };
global.window.addEventListener = () => {};
global.window.dispatchEvent = () => {};
global.CustomEvent = class {};
global.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; }
};

const makeElem = () => ({
  innerHTML: '',
  value: '',
  textContent: '',
  innerText: '',
  classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
  style: {},
  querySelectorAll: () => [],
  querySelector: () => null,
  setAttribute() {},
  removeAttribute() {},
  getAttribute() { return null; },
  remove() {}
});

global.document = {
  documentElement: makeElem(),
  body: makeElem(),
  getElementById: () => makeElem(),
  querySelector: () => makeElem(),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

eval(fs.readFileSync('js/data/mock-data.js', 'utf8'));
window.INITIAL_DATA = INITIAL_DATA;
eval(fs.readFileSync('js/data/db.js', 'utf8'));
eval(fs.readFileSync('js/state.js', 'utf8'));
eval(fs.readFileSync('js/app.js', 'utf8'));

// 1. Verify USR-111 (Sanket Borole)
const sanket = window.DB.getAll('users').find(u => u.id === 'USR-111' || u.username === 'SANKETB');
assert(sanket, 'USR-111 must exist');
window.State.login(sanket.id);
const currentUser = window.State.getCurrentUser();
console.log('✓ Current User:', currentUser.full_name, `[${currentUser.id}]`, 'primary_role:', currentUser.primary_role);
assert.strictEqual(currentUser.primary_role, 'ROLE-001');

// 2. Test route permissions for Billing & Job Card
const billingRoutes = [
  '#/billing-dashboard',
  '#/job-cards',
  '#/billing-estimates',
  '#/customer-billing',
  '#/draft-bills',
  '#/final-bills',
  '#/vehicle-delivery'
];

console.log('\n--- Checking Route Access for all 7 Billing & Job Card screens ---');
billingRoutes.forEach(r => {
  const permCode = window.App.getRequiredPermCode(r);
  const canAccess = window.App.canAccessRoute(r);
  console.log(`Route: ${r.padEnd(22)} | PermCode: ${permCode.padEnd(25)} | canAccess: ${canAccess}`);
  assert.strictEqual(canAccess, true, `Should have access to ${r}`);
});

// 3. Test DOM filterSidebarByPermissions for Billing module group
function createMockElement(tag, attrs = {}) {
  const el = {
    tagName: tag.toUpperCase(),
    style: {},
    attributes: { ...attrs },
    classList: {
      _c: new Set(),
      add(c) { el.classList._c.add(c); },
      remove(c) { el.classList._c.delete(c); },
      contains(c) { return el.classList._c.has(c); }
    },
    setAttribute(k, v) { el.attributes[k] = String(v); },
    removeAttribute(k) { delete el.attributes[k]; },
    getAttribute(k) { return el.attributes[k] !== undefined ? el.attributes[k] : null; },
    querySelectorAll(selector) {
      const results = [];
      function recurse(node) {
        for (const child of node.children || []) {
          let match = false;
          if (selector.includes('.module-group') && (child.attributes.class || '').includes('module-group')) match = true;
          if (selector.includes('a.sub-nav-item') && child.tagName === 'A') match = true;
          if (selector.includes('a.nav-item') && child.tagName === 'A') match = true;
          if (selector.includes('.module-sub-menu > div') && child.tagName === 'DIV') match = true;
          if (match && !results.includes(child)) results.push(child);
          recurse(child);
        }
      }
      recurse(el);
      return results;
    },
    children: []
  };
  return el;
}

const mockSidebar = createMockElement('aside', { id: 'app-sidebar' });

// Billing & Job Card group
const billingGroup = createMockElement('div', { class: 'module-group', id: 'group-billing' });
const billingSubMenu = createMockElement('div', { class: 'module-sub-menu', id: 'subgroup-billing' });
billingRoutes.forEach(r => {
  const link = createMockElement('a', { class: 'sub-nav-item nav-item', href: r });
  billingSubMenu.children.push(link);
});
billingGroup.children.push(billingSubMenu);
mockSidebar.children.push(billingGroup);

// Other ungranted group (e.g. Procurement)
const procGroup = createMockElement('div', { class: 'module-group', id: 'group-procurement' });
const procSubMenu = createMockElement('div', { class: 'module-sub-menu' });
procSubMenu.children.push(createMockElement('a', { class: 'sub-nav-item nav-item', href: '#/requisitions' }));
procGroup.children.push(procSubMenu);
mockSidebar.children.push(procGroup);

global.document.getElementById = (id) => id === 'app-sidebar' ? mockSidebar : null;

window.App.filterSidebarByPermissions = window.App.constructor.prototype.filterSidebarByPermissions.bind(window.App);
window.App.filterSidebarByPermissions();

console.log('\n--- Checking DOM Sidebar Filtering Results ---');
console.log('Billing Group display:', billingGroup.style.display || '(visible)');
console.log('Procurement Group display:', procGroup.style.display);

assert.strictEqual(billingGroup.style.display, '', 'Billing & Job Card group MUST be visible');
assert.strictEqual(procGroup.style.display, 'none', 'Procurement group MUST be hidden');

billingSubMenu.children.forEach((child, i) => {
  assert.strictEqual(child.style.display, '', `Billing item ${billingRoutes[i]} MUST be visible`);
});

console.log('\n🎉 ALL TESTS PASSED: Billing & Job Card module is completely accessible and visible in sidebar for Superadmin!');
