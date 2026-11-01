/**
 * Integration Test: Job Card & Job Card Parts Workflow Unification & Deduplication
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING JOB CARD DEDUPLICATION & CONSOLIDATED WORKFLOW');
console.log('================================================================');

// 1. Check index.html sidebar
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Find subgroup-billing section
const billingMatch = html.match(/<div class="module-sub-menu" id="subgroup-billing">([\s\S]*?)<\/div>/);
if (!billingMatch) {
  console.error('FAIL: subgroup-billing not found in index.html');
  process.exit(1);
}

const billingContent = billingMatch[1];
const jobCardOccurrences = (billingContent.match(/href="#\/job-cards"/g) || []).length;
const partsWorkflowOccurrences = (billingContent.match(/href="#\/job-card-parts"/g) || []).length;

console.log(`Job Cards links in Billing sidebar: ${jobCardOccurrences}`);
console.log(`Job Card Parts links in Billing sidebar: ${partsWorkflowOccurrences}`);

if (jobCardOccurrences === 1 && partsWorkflowOccurrences === 0) {
  console.log('✓ PASS: Exactly 1 unified "Job Card" link in Billing sidebar; zero duplicate "Job Card Parts" link!');
} else {
  console.error(`FAIL: Expected 1 Job Card link and 0 duplicate links, got ${jobCardOccurrences} and ${partsWorkflowOccurrences}`);
  process.exit(1);
}

// 2. Check Item Master Setup module - ensure no parts workflow crept back in
const itemMasterMatch = html.match(/<div class="module-sub-menu" id="subgroup-item-master-setup">([\s\S]*?)<\/div>/);
if (itemMasterMatch && itemMasterMatch[1].includes('#/job-card-parts')) {
  console.error('FAIL: Job Card Parts Workflow was found in Item Master Setup!');
  process.exit(1);
}
console.log('✓ PASS: Item Master Setup does not contain Job Card Parts Workflow.');

// 3. Check js/modules/billing.js has unified subview toggle
const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
if (billingJs.includes('setJobCardsSubView') && billingJs.includes('parts-requisition-console')) {
  console.log('✓ PASS: BillingModule has setJobCardsSubView controller and integrated parts requisition console.');
} else {
  console.error('FAIL: setJobCardsSubView missing in billing.js');
  process.exit(1);
}

const sandbox = {
  window: {},
  document: {
    documentElement: { setAttribute() {}, classList: { add() {}, remove() {} } },
    body: { classList: { add() {}, remove() {} } },
    getElementById: (id) => ({ innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, querySelectorAll: () => [], setAttribute() {}, getAttribute: () => '' }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({ style: {}, classList: { add() {} } })
  },
  console: console,
  localStorage: { getItem: () => null, setItem: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: class CustomEvent { constructor(type, params) { this.type = type; this.detail = params?.detail; } }
};
sandbox.window = sandbox;

const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const appContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(appContent, sandbox);
vm.runInContext(billingJs, sandbox);

// Check routes in App.routes
const routes = sandbox.window.App.routes;
if (routes['#/job-cards'] && routes['#/job-card-parts']) {
  console.log('✓ PASS: Both #/job-cards and alias #/job-card-parts properly registered in router.');
} else {
  console.error('FAIL: Routes missing in App.routes');
  process.exit(1);
}

// Check BillingModule renderJobCardsTab produces both sub-view toggle buttons
const htmlOutput = sandbox.window.BillingModule.renderJobCardsTab();
if (htmlOutput.includes('Job Cards Registry') && htmlOutput.includes('Parts Requisition & Issue Console')) {
  console.log('✓ PASS: renderJobCardsTab() provides tab toggle for both Registry and Parts Console.');
} else {
  console.error('FAIL: renderJobCardsTab did not include unified toggles');
  process.exit(1);
}

// Test toggling subview
sandbox.window.BillingModule.setJobCardsSubView('PARTS');
if (sandbox.window.BillingModule.jobCardSubView === 'PARTS_WORKFLOW') {
  console.log('✓ PASS: Subview toggled to PARTS successfully.');
} else {
  console.error('FAIL: Expected jobCardSubView === PARTS_WORKFLOW');
  process.exit(1);
}
sandbox.window.BillingModule.setJobCardsSubView('REGISTER');
if (sandbox.window.BillingModule.jobCardSubView === 'REGISTER') {
  console.log('✓ PASS: Subview toggled back to REGISTER successfully.');
} else {
  console.error('FAIL: Expected jobCardSubView === REGISTER');
  process.exit(1);
}

console.log('================================================================');
console.log('🎉 ALL DEDUPLICATION & UNIFIED WORKFLOW CHECKS PASSED (100%)!');
console.log('================================================================');
