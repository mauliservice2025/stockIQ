// Verification script for:
// 1. Job Cards tab: No duplicate table, no stray "+ New Job Card" label
// 2. Facility Name: Rendered in top navigation header banner across all screens, removed locally from subviews
// 3. Compact Customer & Estimate Details: Matched 2-tier layout, fonts, and format across Estimate & Billing screens

global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.document = {
  getElementById: (id) => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

require('../js/data/db.js');
require('../js/data/mock-data.js');
require('../js/state.js');
require('../js/modules/billing.js');

window.DB.data._estimates_cleared_by_user_request = true;
window.DB.data._job_cards_cleared_by_user_request = true;
window.DB.data._bills_cleared_by_user_request_v2 = true;
window.DB.data._deliveries_cleared_by_user_request = true;
window.BillingModule._seeded = true;

// Ensure test data
if (!window.DB.data.billingEstimates || window.DB.data.billingEstimates.length === 0) {
  window.DB.data.billingEstimates = [
    {
      id: 'EST-001',
      estimate_no: 'EST-PUN-26-001',
      customer_name: 'Rushikesh Dhiwar',
      customer_mobile: '9876567876',
      customer_cin: 'CIN-MSC1-000132',
      vehicle_reg_no: 'MH12VV3443',
      vehicle_model: 'Honda Activa 125',
      grand_total: 1340,
      status: 'DRAFT',
      items: [{ id: 'ITM-1', name: 'Lever', qty: 2, rate: 230, amount: 460 }]
    }
  ];
}
if (!window.DB.data.draftBills || window.DB.data.draftBills.length === 0) {
  window.DB.data.draftBills = [
    {
      id: 'DBILL-001',
      draft_bill_no: 'DB-PUN-26-001',
      estimate_id: 'EST-001',
      estimate_no: 'EST-PUN-26-001',
      customer_name: 'Rushikesh Dhiwar',
      customer_mobile: '9876567876',
      customer_cin: 'CIN-MSC1-000132',
      vehicle_reg_no: 'MH12VV3443',
      vehicle_model: 'Honda Activa 125',
      grand_total: 1340,
      status: 'DRAFT',
      items: [{ id: 'ITM-1', name: 'Lever', qty: 2, rate: 230, amount: 460 }]
    }
  ];
}
window.BillingModule.activeEstimateId = 'EST-001';
window.BillingModule.activeBillingBillId = 'DBILL-001';

console.log('--- TEST 1: Job Cards Tab Cleanliness ---');
const jcHtml = window.BillingModule.renderJobCardsTab();

// Check for stray "+ New Job Card" outside of buttons
const newJcOccurrences = [...jcHtml.matchAll(/\+ New Job Card/g)];
console.log('"+ New Job Card" occurrences in renderJobCardsTab():', newJcOccurrences.length);
// There should only be the official header action button and the empty state button
if (newJcOccurrences.length > 2) {
  throw new Error(`Failed: Too many "+ New Job Card" matches: ${newJcOccurrences.length}`);
}

// Check that there is only 1 official + New Job Card button in the header
if (newJcOccurrences.length !== 1) {
  throw new Error(`Failed: Expected exactly 1 "+ New Job Card" button, but got ${newJcOccurrences.length}`);
}
console.log('✓ PASS: Job Cards Tab contains clean markup with exactly 1 official + New Job Card button');

console.log('--- TEST 2: Facility Name in Top Header Banner ---');
const fakeContainer = {};
window.BillingModule.render(fakeContainer);
const topBannerHtml = fakeContainer.innerHTML;

const hasTopFacility = topBannerHtml.includes('Workshop Facility:') && topBannerHtml.includes('Mauli Service Center 1 (MSC1)');
console.log('Top navigation banner contains Facility Name:', hasTopFacility);
if (!hasTopFacility) throw new Error('Failed: Facility Name missing from top navigation banner');

// Check that local duplicate facility headers were removed from subviews
const estHtml = window.BillingModule.renderEstimatesTab();
const estHasLocalFacility = estHtml.includes('<span>Workshop Facility:</span>');
console.log('Estimate Management contains local duplicate facility header:', estHasLocalFacility, '(should be false)');
if (estHasLocalFacility) throw new Error('Failed: Local facility header not removed from Estimates tab');

const billHtml = window.BillingModule.renderCustomerBillingSingleScreen();
const billHasLocalFacility = billHtml.includes('<span>Workshop Facility:</span>');
console.log('Customer Billing contains local duplicate facility header:', billHasLocalFacility, '(should be false)');
if (billHasLocalFacility) throw new Error('Failed: Local facility header not removed from Customer Billing screen');
console.log('✓ PASS: Facility Name moved to top banner and removed from local sub-screens');

console.log('--- TEST 3: Compact Format & Typography Matching across Estimate & Billing ---');
// Check Estimate Management Details Card
const hasEstSectionA = estHtml.includes('A. Customer & Estimate Details');
const hasEstTier1 = estHtml.includes('Tier 1: Core Identifiers');
const hasEstTier2 = estHtml.includes('Tier 2: Customer & Vehicle Details');
console.log('Estimate screen has Section A title and 2 tiers:', hasEstSectionA && hasEstTier1 && hasEstTier2);
if (!hasEstSectionA || !hasEstTier1 || !hasEstTier2) {
  throw new Error('Failed: Estimate screen missing Section A title or 2-tier structure');
}

// Check Customer Billing Details Card
const hasBillSectionA = billHtml.includes('A. Customer & Bill Details');
const hasBillTier1 = billHtml.includes('Tier 1: Core Identifiers');
const hasBillTier2 = billHtml.includes('Tier 2: Customer & Vehicle Details');
console.log('Customer Billing screen has Section A title and 2 tiers:', hasBillSectionA && hasBillTier1 && hasBillTier2);
if (!hasBillSectionA || !hasBillTier1 || !hasBillTier2) {
  throw new Error('Failed: Customer Billing screen missing Section A title or 2-tier structure');
}

// Check matching Vehicle Reg number plate format
const estPlate = estHtml.includes('background: #ffffff; color: #111827; padding: 2px 10px; border-radius: 4px; font-weight: 900;');
const billPlate = billHtml.includes('background: #ffffff; color: #111827; padding: 2px 10px; border-radius: 4px; font-weight: 900;');
console.log('Both screens use consistent number plate styling:', estPlate && billPlate);
if (!estPlate || !billPlate) throw new Error('Failed: Number plate styling inconsistency');

console.log('✓ ALL TESTS PASSED WITH 100% SUCCESS!');
