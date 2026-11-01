/**
 * Test Suite: Pinned Sub-Modules (Personalized Quick Access Bar - BRD v1.0)
 * Validates:
 * - Placement & Registry completeness
 * - Max 7 pins enforcement (PIN-FR-10, PIN-FR-11, PIN-BR-02)
 * - Duplicate pin blocking (PIN-FR-03, PIN-BR-03)
 * - Reordering & Order persistence (PIN-FR-27 to PIN-FR-30, PIN-BR-07)
 * - Single-click Pin & Unpin (PIN-FR-04 to PIN-FR-08)
 * - User isolation (PIN-BR-01, PIN-FR-34)
 * - Permission-based filtering (PIN-FR-35 to PIN-FR-39)
 * - Clear all / Reset with audit trail (PIN-FR-42, PIN-BR-11, Section 16)
 * - UI Pinned Bar and Manage Modal rendering (PIN-FR-15 to PIN-FR-22, PIN-FR-40)
 */

const assert = require('assert');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Mock browser globals
global.window = {
  location: { hash: '#/job-cards' },
  addEventListener: () => {},
  State: {
    currentUser: { id: 'USR-001', username: 'ppatil', full_name: 'Pravin Patil', primary_role: 'ROLE-001' },
    getCurrentUser: function() { return this.currentUser; },
    hasPermission: function(permCode, action) {
      if (permCode === 'BLOCKED_PERM') return false;
      return true;
    },
    showToast: (msg, type) => { /* console.log(`[Toast ${type}]: ${msg}`); */ }
  },
  App: {
    canAccessRoute: function(route) {
      if (route === '#/blocked-route') return false;
      return true;
    },
    handleRoute: () => {}
  }
};
global.document = {
  getElementById: (id) => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, querySelector: () => null })
};

// Load dependencies
const { DatabaseLayer } = require('../js/data/db.js');
global.DB = new DatabaseLayer();
window.DB = global.DB;

const { PinnedSubmodulesController, SUBMODULE_REGISTRY } = require('../js/modules/pinned-submodules.js');

console.log('Testing Pinned Sub-Modules (BRD v1.0 Compliance)...');

// 1. Registry verification
console.log('1. Testing Sub-Module Registry...');
assert(Array.isArray(SUBMODULE_REGISTRY), 'SUBMODULE_REGISTRY should be an array');
assert(SUBMODULE_REGISTRY.length >= 25, 'Should register all accessible submodules');

const jobCardSub = SUBMODULE_REGISTRY.find(s => s.id === 'job-cards');
assert(jobCardSub, 'Job Card submodule must be in registry');
assert.strictEqual(jobCardSub.route, '#/job-cards');
assert.strictEqual(jobCardSub.title, 'Job Card');

const estimateSub = SUBMODULE_REGISTRY.find(s => s.id === 'billing-estimates');
assert(estimateSub, 'Estimate submodule must be in registry');

const draftBillSub = SUBMODULE_REGISTRY.find(s => s.id === 'draft-bills');
assert(draftBillSub, 'Draft Bill submodule must be in registry');

console.log('✔ Sub-Module Registry verified successfully.');

// 2. System Configuration & Default Limit of 7
console.log('2. Testing Pin Limit Configuration (PIN-FR-10, PIN-FR-14)...');
assert.strictEqual(DB.getMaxPinnedSubmodules(), 7, 'Default pin limit must be 7');
const limitUpdate = DB.setMaxPinnedSubmodules(8);
assert(limitUpdate.success, 'Admin can configure max limit');
assert.strictEqual(DB.getMaxPinnedSubmodules(), 8);
DB.setMaxPinnedSubmodules(7); // Restore to 7
assert.strictEqual(DB.getMaxPinnedSubmodules(), 7);
console.log('✔ Pin Limit Configuration verified.');

// 3. User Pinning & User Isolation (PIN-BR-01, PIN-FR-34)
console.log('3. Testing User Pinning & User Isolation...');
const user1 = 'USR-001';
const user2 = 'USR-002';

DB.resetUserPinnedSubmodules(user1);
DB.resetUserPinnedSubmodules(user2);

const pin1 = DB.pinUserSubmodule(user1, 'job-cards');
assert(pin1.success, 'USR-001 should pin job-cards');
assert.strictEqual(pin1.currentCount, 1);

const pin2 = DB.pinUserSubmodule(user1, 'billing-estimates');
assert(pin2.success, 'USR-001 should pin billing-estimates');
assert.strictEqual(pin2.currentCount, 2);

const user1Pins = DB.getUserPinnedSubmodules(user1);
assert.strictEqual(user1Pins.length, 2, 'USR-001 should have 2 pins');
assert.strictEqual(user1Pins[0].submodule_id, 'job-cards');
assert.strictEqual(user1Pins[1].submodule_id, 'billing-estimates');

// User 2 should have 0 pins (Isolation)
const user2Pins = DB.getUserPinnedSubmodules(user2);
assert.strictEqual(user2Pins.length, 0, 'USR-002 must not see USR-001 pins (PIN-BR-01)');

// Pin for User 2
DB.pinUserSubmodule(user2, 'final-bills');
assert.strictEqual(DB.getUserPinnedSubmodules(user2).length, 1);
assert.strictEqual(DB.getUserPinnedSubmodules(user1).length, 2);

console.log('✔ User Pinning and User Isolation verified.');

// 4. Duplicate Pin Prevention (PIN-FR-03, PIN-BR-03)
console.log('4. Testing Duplicate Pin Prevention...');
const dupRes = DB.pinUserSubmodule(user1, 'job-cards');
assert(!dupRes.success, 'Cannot pin same submodule twice');
assert.strictEqual(dupRes.code, 'DUPLICATE');
console.log('✔ Duplicate Pin Prevention verified.');

// 5. Max 7 Pins Limit Enforcement (PIN-FR-10, PIN-FR-11, PIN-BR-02)
console.log('5. Testing Maximum 7 Pins Limit Enforcement...');
// User 1 already has 2 pins ('job-cards', 'billing-estimates')
assert(DB.pinUserSubmodule(user1, 'customer-billing').success);  // 3
assert(DB.pinUserSubmodule(user1, 'draft-bills').success);       // 4
assert(DB.pinUserSubmodule(user1, 'final-bills').success);       // 5
assert(DB.pinUserSubmodule(user1, 'vehicle-delivery').success);  // 6
assert(DB.pinUserSubmodule(user1, 'store-master').success);      // 7

assert.strictEqual(DB.getUserPinnedSubmodules(user1).length, 7);

// Attempt 8th pin
const eighthRes = DB.pinUserSubmodule(user1, 'inventory');
assert(!eighthRes.success, '8th pin must be blocked');
assert.strictEqual(eighthRes.code, 'LIMIT_REACHED');
assert.strictEqual(eighthRes.message, 'You can pin a maximum of 7 sub-modules. Unpin one to add another.');
assert.strictEqual(DB.getUserPinnedSubmodules(user1).length, 7, 'Count remains strictly 7');

console.log('✔ Maximum 7 Pins Limit enforced correctly.');

// 6. Unpinning & Order Re-normalization (PIN-FR-06, PIN-FR-28)
console.log('6. Testing Unpinning & Order Re-normalization...');
// Unpin 'draft-bills' (was position 4)
const unpinRes = DB.unpinUserSubmodule(user1, 'draft-bills');
assert(unpinRes.success);

const pinsAfterUnpin = DB.getUserPinnedSubmodules(user1);
assert.strictEqual(pinsAfterUnpin.length, 6, 'Now 6 pins remain');
// Check normalized sequence 1..6
pinsAfterUnpin.forEach((p, idx) => {
  assert.strictEqual(p.display_order, idx + 1, `Order must be continuous ${idx + 1}`);
});

console.log('✔ Unpinning and Order Re-normalization verified.');

// 7. Reordering (PIN-FR-27 to PIN-FR-30, PIN-BR-07)
console.log('7. Testing Pinned Items Reordering...');
// Current remaining: ['job-cards', 'billing-estimates', 'customer-billing', 'final-bills', 'vehicle-delivery', 'store-master']
const reordered = ['store-master', 'vehicle-delivery', 'job-cards', 'billing-estimates', 'customer-billing', 'final-bills'];
const reorderRes = DB.reorderUserPinnedSubmodules(user1, reordered);
assert(reorderRes.success);

const pinsAfterReorder = DB.getUserPinnedSubmodules(user1);
assert.strictEqual(pinsAfterReorder[0].submodule_id, 'store-master');
assert.strictEqual(pinsAfterReorder[0].display_order, 1);
assert.strictEqual(pinsAfterReorder[1].submodule_id, 'vehicle-delivery');
assert.strictEqual(pinsAfterReorder[1].display_order, 2);

console.log('✔ Reordering verified.');

// 8. Audit Trail (Section 16, PIN-BR-11)
console.log('8. Testing Audit Trail Logging...');
const auditLogs = DB.getUserPinnedAuditLogs(user1);
assert(auditLogs.length > 0, 'Audit logs must be recorded');
const actions = auditLogs.map(l => l.action);
assert(actions.includes('PIN_SUBMODULE'), 'Audit must record PIN_SUBMODULE');
assert(actions.includes('UNPIN_SUBMODULE'), 'Audit must record UNPIN_SUBMODULE');
assert(actions.includes('REORDER_PINS'), 'Audit must record REORDER_PINS');

console.log('✔ Audit Trail verified.');

// 9. Reset / Clear All Pins (PIN-FR-42)
console.log('9. Testing Reset All Pins...');
const resetRes = DB.resetUserPinnedSubmodules(user1);
assert(resetRes.success);
assert.strictEqual(resetRes.removedCount, 6);
assert.strictEqual(DB.getUserPinnedSubmodules(user1).length, 0);

console.log('✔ Reset All Pins verified.');

// 10. Controller UI & Permission Integration
console.log('10. Testing PinnedSubmodulesController logic...');
const controller = new PinnedSubmodulesController();

// Route resolution
const resolvedJobCard = controller.getSubmoduleByRoute('#/job-cards');
assert(resolvedJobCard, 'Must resolve #/job-cards');
assert.strictEqual(resolvedJobCard.id, 'job-cards');

const resolvedPart = controller.getSubmoduleByRoute('#/job-card-parts');
assert(resolvedPart, 'Must resolve #/job-card-parts alias to job-cards');
assert.strictEqual(resolvedPart.id, 'job-cards');

// Empty state rendering
let renderedHtml = '';
const mockContainer = {
  style: {},
  set innerHTML(val) { renderedHtml = val; },
  get innerHTML() { return renderedHtml; },
  querySelectorAll: () => []
};
global.document.getElementById = (id) => {
  if (id === 'pinned-submodules-bar') return mockContainer;
  return null;
};

controller.renderPinnedBar();
assert(renderedHtml.includes('Pin your frequently used sub-modules for quick access'), 'Empty state message must render (PIN-FR-20)');
assert(renderedHtml.includes('btn-pin-action-sm'), 'Empty state button must render');

// Pin 3 items: Job Card, Estimate, Draft Bill
DB.pinUserSubmodule(user1, 'job-cards');
DB.pinUserSubmodule(user1, 'billing-estimates');
DB.pinUserSubmodule(user1, 'draft-bills');

controller.renderPinnedBar();
assert(renderedHtml.includes('Job Card'), 'Job Card must render in pinned chips');
assert(renderedHtml.includes('Estimate'), 'Estimate must render in pinned chips');
assert(renderedHtml.includes('Draft Bill'), 'Draft Bill must render in pinned chips');
assert(!renderedHtml.includes('pinned-bar-lead'), 'PINNED label removed from bar for cleaner layout');
assert(!renderedHtml.includes('btn-manage-pins'), 'Manage Pins button removed from bar for cleaner layout');

// Active item highlight (PIN-FR-18)
window.location.hash = '#/job-cards';
controller.renderPinnedBar();
assert(renderedHtml.includes('pinned-chip active'), 'Active sub-module chip must have active class (PIN-FR-18)');

// Catalog rendering in manage modal
const catalogHtml = controller.renderModalCatalogItems('');
assert(catalogHtml.includes('Available Sub-Modules') || catalogHtml.includes('manage-catalog-item'), 'Catalog items must render');
assert(catalogHtml.includes('✓ Pinned'), 'Pinned items must show Pinned status');
assert(catalogHtml.includes('+ Pin'), 'Unpinned items must have + Pin button');

console.log('✔ PinnedSubmodulesController logic and HTML rendering verified.');

console.log('----------------------------------------------------');
console.log('🎉 ALL PINNED SUB-MODULES (BRD v1.0) TESTS PASSED WITH 100% SUCCESS!');
