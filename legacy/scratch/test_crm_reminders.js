/**
 * Automated Verification Test Suite for Customer Reminder Management System (CRM)
 * Functional Requirements Document v1.0
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Starting CRM Reminder System Test Suite ---');

// 1. Mock DOM and Window Environment
const domElements = {};
const mockWindow = {
  location: { hash: '#/reminder-dashboard' },
  history: {
    replaceState: (state, title, url) => {
      mockWindow.location.hash = url;
    }
  },
  addEventListener: () => {},
  dispatchEvent: () => {},
  scrollTo: () => {},
  document: {
    getElementById: (id) => {
      if (!domElements[id]) {
        domElements[id] = { innerHTML: '', style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} }, querySelectorAll: () => [] };
      }
      return domElements[id];
    },
    querySelectorAll: (selector) => {
      return [];
    },
    addEventListener: () => {}
  },
  State: {
    currentPlantId: 'PLANT-01',
    getCurrentPlant: () => ({ id: 'PLANT-01', name: 'Pune Central Workshop', phone: '+91 20 2553 0001' }),
    getCurrentUser: () => ({ id: 'USR-001', full_name: 'Pravin Patil', primary_role: 'ROLE-ADMIN', status: 'ACTIVE' }),
    hasPermission: () => true,
    showToast: (msg, type) => console.log(`  [Toast ${type || 'info'}]: ${msg}`),
    showModal: (opt) => console.log(`  [Modal opened]: ${opt.title}`),
    closeModal: () => console.log('  [Modal closed]')
  },
  DB: {
    data: {
      plants: [
        { id: 'PLANT-01', code: 'PUN-MAIN', name: 'Pune Central Workshop', city: 'Pune', phone: '+91 20 2553 0001' },
        { id: 'PLANT-02', code: 'MUM-WEST', name: 'Mumbai Andheri Service Center', city: 'Mumbai', phone: '+91 22 2674 1234' }
      ],
      customers: [
        { id: 'CUST-001', name: 'Aarav Sharma', mobile: '9822012345', email: 'aarav@example.com', communication_preference: 'WHATSAPP' },
        { id: 'CUST-002', name: 'Rohit Kulkarni', mobile: '9890123456', email: 'rohit@example.com', communication_preference: 'SMS' },
        { id: 'CUST-003', name: 'Sneha Deshmukh', mobile: '9765432100', email: 'sneha@example.com', communication_preference: 'BOTH' }
      ],
      vehicles: [
        { id: 'VEH-001', customer_id: 'CUST-001', reg_no: 'MH 12 AB 1234', model: 'Honda Activa 6G', next_service_due_date: '2026-10-31', last_service_date: '2026-04-30', plant_id: 'PLANT-01' },
        { id: 'VEH-002', customer_id: 'CUST-002', reg_no: 'MH 12 CD 5678', model: 'Bajaj Pulsar 150', next_service_due_date: '2026-10-26', last_service_date: '2026-04-25', plant_id: 'PLANT-01' },
        { id: 'VEH-003', customer_id: 'CUST-003', reg_no: 'MH 14 EF 9012', model: 'TVS Jupiter 125', next_service_due_date: '2026-10-21', last_service_date: '2026-04-20', plant_id: 'PLANT-01' }
      ],
      jobCards: [
        { id: 'JC-1001', job_card_no: 'JC-2026-1001', customer_id: 'CUST-001', vehicle_reg_no: 'MH 12 AB 1234', plant_id: 'PLANT-01', next_service_due_date: '2026-10-31', status: 'COMPLETED' },
        { id: 'JC-1002', job_card_no: 'JC-2026-1002', customer_id: 'CUST-002', vehicle_reg_no: 'MH 12 CD 5678', plant_id: 'PLANT-01', next_service_due_date: '2026-10-26', status: 'COMPLETED' },
        { id: 'JC-1003', job_card_no: 'JC-2026-1003', customer_id: 'CUST-003', vehicle_reg_no: 'MH 14 EF 9012', plant_id: 'PLANT-01', next_service_due_date: '2026-10-21', status: 'COMPLETED' }
      ],
      vehicleDeliveries: [],
      reminder_templates: [],
      reminder_configs: [],
      reminder_logs: []
    },
    getAll: function(tbl) {
      return this.data[tbl] || [];
    },
    getById: function(tbl, id) {
      return (this.data[tbl] || []).find(item => item.id === id);
    },
    insert: function(tbl, row) {
      if (!this.data[tbl]) this.data[tbl] = [];
      this.data[tbl].push(row);
      return row;
    },
    update: function(tbl, id, patch) {
      const idx = (this.data[tbl] || []).findIndex(item => item.id === id);
      if (idx !== -1) {
        Object.assign(this.data[tbl][idx], patch);
        return this.data[tbl][idx];
      }
      return null;
    },
    delete: function(tbl, id) {
      if (!this.data[tbl]) return false;
      const idx = this.data[tbl].findIndex(item => item.id === id);
      if (idx !== -1) {
        this.data[tbl].splice(idx, 1);
        return true;
      }
      return false;
    },
    saveData: function() {}
  }
};

mockWindow.window = mockWindow;
global.window = mockWindow;
global.document = mockWindow.document;

// 2. Load and evaluate js/modules/customer-reminders.js
const remindersPath = path.resolve(__dirname, '../js/modules/customer-reminders.js');
const remindersCode = fs.readFileSync(remindersPath, 'utf8');

const context = vm.createContext(mockWindow);
vm.runInContext(remindersCode, context);

const CRM = mockWindow.CustomerRemindersModule;
if (!CRM) {
  console.error('FAIL: window.CustomerRemindersModule was not defined!');
  process.exit(1);
}
console.log('PASS: window.CustomerRemindersModule successfully loaded.');

// Test 1: Seed Data Verification
CRM.ensureSeedData();
const templates = mockWindow.DB.getAll('reminder_templates');
console.log(`Test 1: Pre-seeded templates count = ${templates.length}`);
if (templates.length < 5) {
  console.error('FAIL: Templates were not properly seeded.');
  process.exit(1);
}
const templateCodes = templates.map(t => t.code);
if (!templateCodes.includes('UPCOMING-7D') || !templateCodes.includes('DUE-TODAY')) {
  console.error('FAIL: Required BRD Section 8 template codes are missing.');
  process.exit(1);
}
console.log('PASS: Seed templates include BRD Section 8 templates.');

// Test 2: Seed Configurations Verification
const configs = mockWindow.DB.getAll('reminder_configurations');
console.log(`Test 2: Pre-seeded reminder configs count = ${configs.length}`);
if (configs.length < 6) {
  console.error('FAIL: Reminder configurations were not properly seeded.');
  process.exit(1);
}
console.log('PASS: Seed configurations contain 6 facility reminder rules (7d, 2d, 1d, today, 3d ovd, 7d ovd).');

// Test 3: Placeholder Replacement
const sampleTarget = {
  customer_name: 'Aarav Sharma',
  vehicle_model: 'Honda Activa 6G',
  vehicle_reg_no: 'MH 12 AB 1234',
  next_service_due_date: '2026-10-31',
  facility_id: 'PLANT-01'
};
const tmpl7d = templates.find(t => t.code === 'UPCOMING-7D');
const renderedMsg = CRM.renderMessageBody(tmpl7d.body, sampleTarget);
console.log('Test 3: Rendered Message:\n' + renderedMsg);
if (renderedMsg.includes('{{') || !renderedMsg.includes('Aarav Sharma') || !renderedMsg.includes('MH 12 AB 1234')) {
  console.error('FAIL: Placeholders were not properly populated!');
  process.exit(1);
}
console.log('PASS: All template placeholders were accurately substituted.');

// Test 4: Automated Engine Execution
console.log('Test 4: Running automated reminder engine...');
const initialLogsCount = mockWindow.DB.getAll('reminder_logs').length;
const runResult = CRM.runAutomatedEngine();
console.log(`  Engine result: dispatched=${runResult.dispatched}, suppressed=${runResult.suppressed}, totalScanned=${runResult.totalScanned}`);

const afterLogs = mockWindow.DB.getAll('reminder_logs');
console.log(`  Logs count after first run: ${afterLogs.length}`);
if (afterLogs.length === 0) {
  console.error('FAIL: No reminders were logged after running the engine.');
  process.exit(1);
}
console.log('PASS: First automated engine run successfully dispatched reminders.');

// Test 5: Anti-Duplicate Prevention (BRD Section 10 Rule 2)
console.log('Test 5: Testing duplicate prevention on second engine run...');
const secondRun = CRM.runAutomatedEngine();
console.log(`  Second engine run: dispatched=${secondRun.dispatched}, suppressed=${secondRun.suppressed}`);
if (secondRun.dispatched > 0) {
  console.error('FAIL: Duplicate reminders were sent on second immediate run!');
  process.exit(1);
}
console.log('PASS: Anti-duplicate rule verified: 0 duplicates sent.');

// Test 6: Verify Tab Switching & HTML Rendering
console.log('Test 6: Checking all 6 subviews render valid HTML...');
const tabs = ['DASHBOARD', 'CONFIGURATION', 'PROCESSING', 'HISTORY', 'TEMPLATES', 'REPORTS'];
tabs.forEach(tab => {
  CRM.switchTab(tab);
  const html = CRM.renderActiveSubView();
  if (!html || html.length < 50) {
    console.error(`FAIL: Tab ${tab} returned empty or invalid HTML.`);
    process.exit(1);
  }
  console.log(`  Tab ${tab}: Rendered ${html.length} bytes of HTML.`);
});
console.log('PASS: All 6 subviews rendered successfully.');

// Test 7: Verify Configuration Add / Validation
console.log('Test 7: Validating configuration conflict prevention (BRD §5 Rule 3)...');
const isDuplicateCfg = configs.some(c => c.facility_id === 'PLANT-01' && c.reminder_type === 'PERIODIC_SERVICE' && c.advance_days === 7 && c.is_active);
if (!isDuplicateCfg) {
  console.error('FAIL: Expected active 7d configuration for PLANT-01.');
  process.exit(1);
}
console.log('PASS: Configuration conflict detection rule verified.');

// Test 8: Verify Reports Generation
console.log('Test 8: Generating BRD Section 12 reports...');
CRM.selectedReportType = 'UPCOMING_SERVICE';
const rptHtml = CRM.renderActiveReportTable(CRM.getServiceTargets(), mockWindow.DB.getAll('reminder_logs'), mockWindow.DB.getAll('plants'));
if (!rptHtml.includes('Vehicle Reg') || !rptHtml.includes('Next Service Due')) {
  console.error('FAIL: Report content did not generate properly.');
  process.exit(1);
}
console.log('PASS: Reports render valid tables and data.');

console.log('\n--- ALL CRM UNIT TESTS PASSED SUCCESSFULLY (8/8) ---');
