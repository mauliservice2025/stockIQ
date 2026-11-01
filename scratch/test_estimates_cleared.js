// Automated verification for "remove all estimates" requirement
const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = global;
global.document = {
  getElementById: (id) => null
};

// Minimal Mock DB
const dbData = {
  billingEstimates: [],
  jobCards: [],
  draftBills: [],
  finalBills: [],
  customers: [],
  vehicles: []
};

window.DB = {
  data: dbData,
  getAll: (collection) => dbData[collection] || [],
  getById: (collection, id) => (dbData[collection] || []).find(x => x.id === id),
  upsert: (collection, item) => {
    if (!dbData[collection]) dbData[collection] = [];
    const idx = dbData[collection].findIndex(x => x.id === item.id);
    if (idx >= 0) dbData[collection][idx] = item;
    else dbData[collection].push(item);
  },
  saveData: () => {},
  emitChange: () => {},
  logAudit: () => {}
};

window.State = {
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
  showModal: () => {},
  closeModal: () => {}
};

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('Testing BillingModule Estimate clearing and empty states...');

// 1. Test ensureSeedData initializes estimates as empty
window.BillingModule.ensureSeedData();
console.log('Estimates count after ensureSeedData():', window.DB.data.billingEstimates.length);
if (window.DB.data.billingEstimates.length !== 0) {
  throw new Error(`Expected 0 estimates, found ${window.DB.data.billingEstimates.length}`);
}
console.log('✓ ensureSeedData leaves billingEstimates empty (0 records)');

// 2. Test getActiveEstimate returns null
const active = window.BillingModule.getActiveEstimate();
console.log('Active estimate when empty:', active);
if (active !== null) {
  throw new Error(`Expected null active estimate, got: ${JSON.stringify(active)}`);
}
console.log('✓ getActiveEstimate() correctly returns null');

// 3. Test renderEstimatesTab with no estimates
const htmlEmpty = window.BillingModule.renderEstimatesTab();
if (!htmlEmpty.includes('No estimates found') || !htmlEmpty.includes('No Estimate Selected or Available')) {
  throw new Error('Missing empty state HTML in renderEstimatesTab');
}
console.log('✓ renderEstimatesTab() generates empty state UI for both queue and workspace');

// 4. Test createNewEstimate() starts a new draft
window.BillingModule.createNewEstimate();
const activeNew = window.BillingModule.getActiveEstimate();
if (!activeNew || activeNew.status !== 'DRAFT') {
  throw new Error(`Expected active draft estimate, got: ${JSON.stringify(activeNew)}`);
}
console.log('✓ createNewEstimate() successfully initializes a new draft:', activeNew.id);

// 5. Test renderEstimatesTab with active new draft
const htmlNew = window.BillingModule.renderEstimatesTab();
if (!htmlNew.includes('Estimate Management') || !htmlNew.includes('F. Estimate Actions (Draft mode)')) {
  throw new Error('Missing active draft workspace UI in renderEstimatesTab');
}
console.log('✓ renderEstimatesTab() renders interactive draft workspace');

// 6. Test saveDraftEstimate()
window.BillingModule.saveDraftEstimate();
console.log('Saved estimates count in DB:', window.DB.data.billingEstimates.length);
if (window.DB.data.billingEstimates.length !== 1) {
  throw new Error(`Expected 1 saved estimate, found ${window.DB.data.billingEstimates.length}`);
}
console.log('✓ saveDraftEstimate() successfully persists draft to DB');

// 7. Test clearAllEstimates() resets DB and active estimate
window.BillingModule.clearAllEstimates();
if (window.DB.data.billingEstimates.length !== 0) {
  throw new Error(`Expected 0 estimates after clearAllEstimates, found ${window.DB.data.billingEstimates.length}`);
}
if (window.BillingModule.getActiveEstimate() !== null) {
  throw new Error('Expected active estimate to be null after clearAllEstimates');
}
console.log('✓ clearAllEstimates() successfully clears all estimates back to empty state');

console.log('ALL ESTIMATE TESTS PASSED SUCCESSFULLY! 🎉');
