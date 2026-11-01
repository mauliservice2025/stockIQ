// Automated test verifying Previous UI and Registration Configuration enforcement
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

let capturedModalOpts = null;
global.document = {
  activeElement: null,
  getElementById: (id) => {
    if (!global._elements) global._elements = {};
    if (!global._elements[id]) {
      global._elements[id] = { textContent: '', value: '', title: '', style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {} } };
    }
    return global._elements[id];
  },
  querySelector: () => ({ style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {} } }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};

let lastAlertMessage = '';
global.alert = (msg) => {
  lastAlertMessage = msg;
  console.log('[ALERT]:', msg);
};
global.confirm = () => true;

global.State = {
  currentPlantId: 'PLANT-01',
  hasPermission: () => true,
  showToast: () => {},
  showModal: (opt) => {
    capturedModalOpts = opt;
  },
  closeModal: () => {}
};

// Load DB
const dbCode = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
eval(dbCode);

// Load Billing Module
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('--- Starting Previous UI & Registration Configuration Tests ---');

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  // Seed facilities and default registration configurations
  window.DB.data = {
    plants: [
      { id: 'PLANT-01', code: 'MSC1', name: 'Mauli Service Center - I', is_active: true, status: 'Active' },
      { id: 'PLANT-02', code: 'MSC2', name: 'Mauli Service Center - II', is_active: true, status: 'Active' }
    ],
    jobCards: [],
    vehicleModels: [
      { id: 'MOD-01', name: 'Splendor Plus', manufacturer_id: 'MFG-01', active: true }
    ],
    vehicleManufacturers: [
      { id: 'MFG-01', name: 'Hero MotoCorp' }
    ],
    users: [
      { id: 'USR-107', full_name: 'Sanket Borole', user_type: 'technician', status: 'ACTIVE' }
    ],
    registration_configurations: []
  };

  // Test 1: Open Job Card Modal renders Previous Multi-Section UI
  window.BillingModule.showNewJobCardModal('PLANT-01');
  assert(capturedModalOpts !== null, 'Modal options captured');
  assert(capturedModalOpts.maxWidth === 'min(1240px, 98vw)', `Modal maxWidth is previous spacious layout: min(1240px, 98vw) (got: ${capturedModalOpts.maxWidth})`);

  const html = capturedModalOpts.contentHtml;
  assert(html.includes('🏍️ 1. Vehicle Details'), 'Contains Section 1: Vehicle Details');
  assert(html.includes('👤 2. Customer Information'), 'Contains Section 2: Customer Information');
  assert(html.includes('🛠️ 3. Service Scope & Assignment'), 'Contains Section 3: Service Scope & Assignment');
  assert(html.includes('📋 4. Customer Complaints & Diagnosis') || html.includes('Customer Complaints & Instructions'), 'Contains Section 4: Complaints & Instructions');

  // Test 2: Date defaults to today's local date with max constraint
  assert(html.includes(`value="${todayStr}"`), `Date field defaults to today's local date ${todayStr}`);
  assert(html.includes(`max="${todayStr}"`), `Date field has max="${todayStr}" restriction`);

  // Test 3: Registration Configuration Applicability (PLANT-01 defaults: gstin and engine_no are applicable: false)
  const cfg1 = window.DB.getRegistrationConfig('PLANT-01');
  const gstinCfg = cfg1.customer_fields.find(f => f.field_key === 'gstin');
  const engineCfg = cfg1.vehicle_fields.find(f => f.field_key === 'engine_no');

  assert(gstinCfg && gstinCfg.applicable === false, 'PLANT-01 default config has gstin applicable: false');
  assert(!html.includes('id="new-jc-gstin"'), 'Hidden (applicable: false) gstin field is NOT rendered in modal');

  assert(engineCfg && engineCfg.applicable === false, 'PLANT-01 default config has engine_no applicable: false');
  assert(!html.includes('id="new-jc-engine"'), 'Hidden (applicable: false) engine_no field is NOT rendered in modal');

  // Test 4: Dynamic facility switch updates configuration
  // For PLANT-02, customize config so gstin is applicable: true, and chassis_no is mandatory: true
  const cfg2 = window.DB.getRegistrationConfig('PLANT-02');
  const gstinCfg2 = cfg2.customer_fields.find(f => f.field_key === 'gstin');
  if (gstinCfg2) { gstinCfg2.applicable = true; gstinCfg2.mandatory = false; }
  const chassisCfg2 = cfg2.vehicle_fields.find(f => f.field_key === 'chassis_no');
  if (chassisCfg2) { chassisCfg2.applicable = true; chassisCfg2.mandatory = true; }
  window.DB.saveRegistrationConfig('PLANT-02', cfg2);

  window.BillingModule.showNewJobCardModal('PLANT-02');
  const html2 = capturedModalOpts.contentHtml;
  assert(html2.includes('id="new-jc-gstin"'), 'PLANT-02 modal dynamically renders gstin because applicable: true');
  assert(html2.includes('Chassis / VIN <span style="color: var(--color-danger)">*</span>'), 'PLANT-02 modal marks Chassis / VIN with mandatory asterisk *');

  // Test 5: Validation of Mandatory Fields in saveNewJobCard
  // Attempt to save PLANT-02 Job Card without Chassis / VIN (which is mandatory for PLANT-02)
  global.document.getElementById('new-jc-reg').value = 'MH12AB1234';
  global.document.getElementById('new-jc-model').value = 'MOD-01';
  global.document.getElementById('new-jc-km').value = '12000';
  global.document.getElementById('new-jc-customer').value = 'Sachin Patil';
  global.document.getElementById('new-jc-mobile').value = '9876543210';
  global.document.getElementById('new-jc-chassis').value = ''; // empty!

  lastAlertMessage = '';
  window.BillingModule.jobCardFacilityId = 'PLANT-02';
  window.BillingModule.saveNewJobCard();

  assert(lastAlertMessage.includes('Chassis') && lastAlertMessage.includes('mandatory as per Registration Configuration'), 
    `saveNewJobCard blocked missing mandatory Chassis No: "${lastAlertMessage}"`);

  // Test 6: Fill mandatory Chassis and save succeeds
  global.document.getElementById('new-jc-chassis').value = 'MA3ER456789012345';
  global.document.getElementById('new-jc-km').value = '12000';
  global.document.getElementById('new-jc-date').value = todayStr;

  lastAlertMessage = '';
  window.BillingModule.saveNewJobCard();

  const savedJc = (window.DB.getAll('jobCards') || []).find(j => j.vehicle_reg_no === 'MH12AB1234');
  assert(savedJc !== undefined, 'Job Card successfully created and saved');
  assert(savedJc.chassis_no === 'MA3ER456789012345', 'Saved Job Card persisted Chassis No from Registration Config');
  assert(savedJc.date === todayStr, `Saved Job Card date is ${todayStr}`);

  console.log(`\n========================================`);
  console.log(`All ${passedTests}/${totalTests} tests passed successfully!`);
  console.log(`========================================\n`);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
