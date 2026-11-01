const fs = require('fs');
const path = require('path');

console.log('--- Verifying ISCM Full Integration for CRM Reminders ---');

// 1. Verify index.html contains group-crm and customer-reminders.js script
const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
if (!indexHtml.includes('id="group-crm"')) {
  console.error('FAIL: index.html missing id="group-crm"');
  process.exit(1);
}
if (!indexHtml.includes('js/modules/customer-reminders.js')) {
  console.error('FAIL: index.html missing customer-reminders.js script tag');
  process.exit(1);
}
console.log('PASS: index.html contains group-crm sidebar menu and customer-reminders.js script tag.');

// 2. Verify app.js contains CRM routes and permissions
const appJs = fs.readFileSync(path.resolve(__dirname, '../js/app.js'), 'utf8');
const expectedRoutes = [
  '#/customer-reminders',
  '#/reminder-dashboard',
  '#/reminder-configuration',
  '#/reminder-processing',
  '#/reminder-history',
  '#/reminder-reports',
  '#/message-templates'
];
expectedRoutes.forEach(r => {
  if (!appJs.includes(r)) {
    console.error(`FAIL: app.js missing route ${r}`);
    process.exit(1);
  }
});
console.log('PASS: app.js contains all CRM routes.');

// 3. Verify pinned-submodules.js contains CRM submodules
const pinnedJs = fs.readFileSync(path.resolve(__dirname, '../js/modules/pinned-submodules.js'), 'utf8');
if (!pinnedJs.includes('reminder-dashboard') || !pinnedJs.includes('Customer Relationship (CRM)')) {
  console.error('FAIL: pinned-submodules.js missing CRM submodules');
  process.exit(1);
}
console.log('PASS: pinned-submodules.js includes CRM submodule registry entries.');

// 4. Verify state.js aliasMap includes CRM
const stateJs = fs.readFileSync(path.resolve(__dirname, '../js/state.js'), 'utf8');
if (!stateJs.includes('CUSTOMER_REMINDERS') || !stateJs.includes('REMINDER_DASHBOARD')) {
  console.error('FAIL: state.js missing CRM permissions alias mapping');
  process.exit(1);
}
console.log('PASS: state.js includes CRM permission aliases.');

console.log('--- ALL INTEGRATION CHECKS PASSED (4/4) ---');
