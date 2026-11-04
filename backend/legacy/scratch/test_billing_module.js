const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING NEW BILLING MODULE (JOB CARD -> ESTIMATE -> BILL -> DELIVERY)');
console.log('================================================================\n');

// 1. Read necessary files
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const stateContent = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
const billingContent = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// 2. Setup sandbox
const sandbox = {
  window: {},
  document: {
    getElementById: (id) => null,
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [],
    addEventListener: () => {}
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  confirm: () => true,
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  addEventListener: () => {}
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbContent, sandbox);
vm.runInContext(stateContent, sandbox);
vm.runInContext(billingContent, sandbox);

const Billing = sandbox.window.BillingModule;
assert(Billing, 'BillingModule must exist on window');
Billing.init();

// =============================================================================
// TEST 1: SIDEBAR ORDER & POSITIONING IN INDEX.HTML
// =============================================================================
console.log('Test 1: Verifying Sidebar placement upper side of Item Master Setup...');
const moduleGroupMatches = [...indexHtml.matchAll(/id="(group-[^"]+)"/g)].map(m => m[1]);
const billingIndex = moduleGroupMatches.indexOf('group-billing');
const itemSetupIndex = moduleGroupMatches.indexOf('group-item-master-setup');
const controlIndex = moduleGroupMatches.indexOf('group-control');

assert(billingIndex !== -1, 'group-billing must exist in sidebar');
assert(itemSetupIndex !== -1, 'group-item-master-setup must exist in sidebar');
assert.strictEqual(
  billingIndex + 1,
  itemSetupIndex,
  'group-billing must be positioned immediately upper side of group-item-master-setup'
);
assert.strictEqual(
  controlIndex + 1,
  billingIndex,
  'group-control must be immediately above group-billing'
);
console.log('  -> PASS: group-billing correctly positioned upper side of group-item-master-setup!\n');

// =============================================================================
// TEST 2: DASHBOARD VIEW & WORKFLOW STEPPER
// =============================================================================
console.log('Test 2: Verifying Billing Dashboard & Connected Workflow Stepper...');
Billing.activeTab = 'DASHBOARD';
const dashHtml = Billing.renderDashboardTab();
assert(dashHtml.includes('Connected Two-Wheeler Workshop & Billing Workflow'), 'Must render workflow title');
assert(dashHtml.includes('1. Job Card'), 'Must include Job Card step');
assert(dashHtml.includes('2. Estimate'), 'Must include Estimate step');
assert(dashHtml.includes('3. Parts Issue'), 'Must include Parts Issue step');
assert(dashHtml.includes('4. Draft Bill'), 'Must include Draft Bill step');
assert(dashHtml.includes('5. Final Bill'), 'Must include Final Bill step');
assert(dashHtml.includes('6. Delivery Pass'), 'Must include Delivery Pass step');
assert(dashHtml.includes('Active Job Cards'), 'Must show Active Job Cards KPI');
assert(dashHtml.includes('Estimates Pending'), 'Must show Estimates Pending KPI');
assert(dashHtml.includes('Draft Bills To Finalize'), 'Must show Draft Bills KPI');
assert(dashHtml.includes('Revenue Collected'), 'Must show Revenue Collected KPI');
console.log('  -> PASS: Dashboard view rendered successfully!\n');

// =============================================================================
// TEST 3: JOB CARD TAB (SEARCH, FILTERS, DATA)
// =============================================================================
console.log('Test 3: Verifying Job Cards Tab...');
Billing.activeTab = 'JOB_CARDS';
let jcHtml = Billing.renderJobCardsTab();
assert(jcHtml.includes('id="jobcard-search-input"'), 'Must have job card search input ID');
assert(jcHtml.includes('All Status'), 'Must have status filter');
assert(jcHtml.includes('+ New Job Card'), 'Must have New Job Card button');
assert(jcHtml.includes('JC-PUN-26-001'), 'Must render initial seeded job card');

// Test Live Search
Billing.setJobCardSearch('Ramesh');
jcHtml = Billing.renderJobCardsTab();
assert(jcHtml.includes('Ramesh Patil'), 'Search for Ramesh must return Ramesh Patil');
assert(!jcHtml.includes('Sunil Joshi'), 'Search for Ramesh must NOT return Sunil Joshi');

// Reset
Billing.resetJobCardFilters();
jcHtml = Billing.renderJobCardsTab();
assert(jcHtml.includes('Sunil Joshi'), 'Reset must restore all job cards');
console.log('  -> PASS: Job Cards tab & filtering verified!\n');

// =============================================================================
// TEST 4: ESTIMATES TAB (SEARCH, FILTERS, APPROVAL)
// =============================================================================
console.log('Test 4: Verifying Estimates Tab...');
Billing.activeTab = 'ESTIMATES';
let estHtml = Billing.renderEstimatesTab();
assert(estHtml.includes('id="estimate-search-input"'), 'Must have estimate search input ID');
assert(estHtml.includes('All Status'), 'Must have status filter');
assert(estHtml.includes('+ Create Estimate'), 'Must have Create Estimate button');
assert(estHtml.includes('EST-PUN-26-001'), 'Must render seeded estimates');

// Test Search
Billing.setEstimateSearch('EST-PUN-26-002');
estHtml = Billing.renderEstimatesTab();
assert(estHtml.includes('EST-PUN-26-002'), 'Must find EST-PUN-26-002');
assert(!estHtml.includes('EST-PUN-26-001'), 'Must filter out EST-PUN-26-001');

Billing.resetEstimateFilters();
console.log('  -> PASS: Estimates tab & search verified!\n');

// =============================================================================
// TEST 5: DRAFT BILLS TAB (SEARCH, FILTERS, FINALIZATION)
// =============================================================================
console.log('Test 5: Verifying Draft Bills Tab...');
Billing.activeTab = 'DRAFT_BILLS';
let dbHtml = Billing.renderDraftBillsTab();
assert(dbHtml.includes('id="draftbill-search-input"'), 'Must have draft bill search input ID');
assert(dbHtml.includes('DB-PUN-26-001'), 'Must render seeded draft bills');
assert(dbHtml.includes('Finalize Bill'), 'Must have Finalize Bill action button');

Billing.setDraftBillSearch('Jupiter');
dbHtml = Billing.renderDraftBillsTab();
assert(dbHtml.includes('Jupiter'), 'Must find Jupiter draft bill');

Billing.resetDraftBillFilters();
console.log('  -> PASS: Draft Bills tab verified!\n');

// =============================================================================
// TEST 6: FINAL BILLS & GST TAX INVOICES TAB
// =============================================================================
console.log('Test 6: Verifying Final Bills & Invoices Tab...');
Billing.activeTab = 'FINAL_BILLS';
let fbHtml = Billing.renderFinalBillsTab();
assert(fbHtml.includes('id="finalbill-search-input"'), 'Must have final bill search input ID');
assert(fbHtml.includes('INV-PUN-26-001'), 'Must render seeded GST tax invoices');
assert(fbHtml.includes('TAX INVOICES') || fbHtml.includes('Invoices'), 'Header title must indicate Invoices');

// Test filter
Billing.setFinalBillPaymentFilter('UPI');
fbHtml = Billing.renderFinalBillsTab();
assert(fbHtml.includes('UPI'), 'Must filter by UPI mode');

Billing.resetFinalBillFilters();
console.log('  -> PASS: Final Bills tab verified!\n');

// =============================================================================
// TEST 7: VEHICLE DELIVERY TAB (GATE PASS & CLOSURE)
// =============================================================================
console.log('Test 7: Verifying Vehicle Delivery & Gate Pass Tab...');
Billing.activeTab = 'DELIVERY';
let delHtml = Billing.renderDeliveryTab();
assert(delHtml.includes('id="delivery-search-input"'), 'Must have delivery search input ID');
assert(delHtml.includes('+ Issue Gate Pass'), 'Must have Issue Gate Pass button');
assert(delHtml.includes('GP-PUN-26-001'), 'Must render seeded gate passes');

Billing.resetDeliveryFilters();
console.log('  -> PASS: Vehicle Delivery tab verified!\n');

// =============================================================================
// TEST 8: END-TO-END WORKFLOW (JC -> EST -> DB -> INV -> DEL)
// =============================================================================
console.log('Test 8: Verifying End-to-End Two-Wheeler Lifecycle...');
const db = sandbox.window.DB;

// 1. Create a Job Card
const testJc = {
  id: 'JC-TEST-999',
  job_card_no: 'JC-PUN-26-999',
  date: '2026-09-23',
  customer_name: 'Nitin Gadkari',
  customer_mobile: '9822998877',
  vehicle_reg_no: 'MH-12-NG-2026',
  vehicle_model: 'Ather 450X',
  status: 'ESTIMATE_PENDING'
};
db.upsert('jobCards', testJc);
assert(db.getById('jobCards', 'JC-TEST-999'), 'Job Card must be saved in DB');

// 2. Create Estimate
const testEst = {
  id: 'EST-TEST-999',
  estimate_no: 'EST-PUN-26-999',
  job_card_id: testJc.id,
  job_card_no: testJc.job_card_no,
  customer_name: testJc.customer_name,
  vehicle_reg_no: testJc.vehicle_reg_no,
  labour_total: 400,
  parts_total: 600,
  estimated_total: 1180,
  status: 'SUBMITTED'
};
db.upsert('billingEstimates', testEst);
assert(db.getById('billingEstimates', 'EST-TEST-999'), 'Estimate must be saved in DB');

// 3. Customer Approves Estimate
Billing.approveEstimate('EST-TEST-999');
const approvedEst = db.getById('billingEstimates', 'EST-TEST-999');
assert.strictEqual(approvedEst.status, 'CUSTOMER_APPROVED', 'Estimate status must become CUSTOMER_APPROVED');

const updatedJc = db.getById('jobCards', testJc.id);
assert.strictEqual(updatedJc.status, 'WORK_IN_PROGRESS', 'Job Card status must advance to WORK_IN_PROGRESS');

// 4. Create Draft Bill
const testDb = {
  id: 'DB-TEST-999',
  draft_bill_no: 'DB-PUN-26-999',
  job_card_id: testJc.id,
  job_card_no: testJc.job_card_no,
  customer_name: testJc.customer_name,
  vehicle_reg_no: testJc.vehicle_reg_no,
  labour_total: 400,
  parts_total: 600,
  gross_amount: 1000,
  discount_amount: 0,
  taxable_amount: 1000,
  cgst_rate: 9,
  cgst_amount: 90,
  sgst_rate: 9,
  sgst_amount: 90,
  total_tax: 180,
  net_payable: 1180,
  status: 'READY_FOR_FINALIZATION'
};
db.upsert('draftBills', testDb);

// 5. Finalize Draft Bill
Billing.finalizeDraftBill('DB-TEST-999');
const finalDb = db.getById('draftBills', 'DB-TEST-999');
assert.strictEqual(finalDb.status, 'FINALIZED', 'Draft bill must be marked FINALIZED');

const finalBills = db.getAll('finalBills') || [];
const generatedInv = finalBills.find(b => b.draft_bill_id === 'DB-TEST-999');
assert(generatedInv, 'Official GST invoice must be generated');
assert.strictEqual(generatedInv.net_payable, 1180, 'Invoice net payable must match');

const billedJc = db.getById('jobCards', testJc.id);
assert.strictEqual(billedJc.status, 'BILLED', 'Job card status must advance to BILLED');

console.log('  -> PASS: Complete Two-Wheeler Lifecycle flow verified!\n');

// =============================================================================
// TEST 9: MERGED SINGLE JOB CARD MASTER (NO DUPLICATE MASTERS OR TOGGLE PILLS)
// =============================================================================
console.log('Test 9: Verifying Merged Single Job Card Master in Billing & Job Card module...');
const billingGroupMatch = indexHtml.match(/<div class="module-group" id="group-billing">([\s\S]*?)<\/div>\s*<!-- Item Master Setup/);
assert(billingGroupMatch, 'Must find group-billing HTML block');
const billingGroupHtml = billingGroupMatch[1];

// 1. Must contain single unified link to #/job-cards with title 'Job Card'
assert(billingGroupHtml.includes('href="#/job-cards"'), 'group-billing must contain link to #/job-cards');
assert(billingGroupHtml.includes('Job Card'), 'group-billing must contain single master label Job Card');

// 2. Must NOT contain separate duplicate link to #/job-card-parts in sidebar
assert(!billingGroupHtml.includes('href="#/job-card-parts"'), 'group-billing must NOT duplicate with a separate #/job-card-parts link');

// 3. Verify route mapping in appJs
assert(appJs.includes("'#/job-cards': { module: window.BillingModule, title: 'Job Card', section: 'Billing', subSection: 'Workshop' }"), 'app.js route must map #/job-cards with single master title');

// 4. Verify BillingModule single master rendering
Billing.activeTab = 'JOB_CARDS';
Billing.jobCardViewMode = 'CONSOLE';
const masterHtml = Billing.renderJobCardsTab();
assert(masterHtml.includes('Job Card Management'), 'renderJobCardsTab must render Job Card Management master');
assert(masterHtml.includes('Active Job Cards'), 'renderJobCardsTab must include active job cards selectable list');
assert(masterHtml.includes('Requisite Spare Parts &amp; Availability Matrix') || masterHtml.includes('Requisite Spare Parts & Availability Matrix'), 'renderJobCardsTab must include spare parts matrix');

// 5. Must NOT contain separate sub-master toggle pills (Job Cards Register vs Parts Workflow)
assert(!masterHtml.includes('Job Cards Register</span>\n          </button>'), 'Master must NOT contain separate Job Cards Register toggle pill');
assert(!masterHtml.includes('Job Card Parts Workflow</span>\n          </button>'), 'Master must NOT contain separate Parts Workflow toggle pill');

Billing.activeTab = 'PARTS_WORKFLOW';
const partsHtml = Billing.renderPartsWorkflowTab();
assert(partsHtml && partsHtml.length > 50, 'renderPartsWorkflowTab must return content');
console.log('  -> PASS: Both masters successfully merged into single Job Card master!\n');

console.log('================================================================');
console.log('ALL BILLING MODULE TESTS PASSED SUCCESSFULLY! (9/9)');
console.log('================================================================');
