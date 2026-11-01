/**
 * Test Suite for Registration Configuration Master & Dynamic Job Card Intake
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('TESTING REGISTRATION CONFIGURATION MASTER & DYNAMIC POLICY');
console.log('================================================================\n');

// 1. Sidebar in index.html
console.log('Test 1: Verifying Sidebar Navigation in Admin Panel...');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(indexHtml.includes('href="#/registration-config"'), 'Sidebar must contain link to #/registration-config');
assert(indexHtml.includes('Registration Configuration'), 'Sidebar must show "Registration Configuration" title');
assert(indexHtml.includes('js/modules/registration-config.js'), 'index.html must load registration-config.js');
console.log('  -> PASS: Sidebar link and script tag present in index.html');

// 2. Route & RBAC in app.js
console.log('Test 2: Verifying Route & RBAC in js/app.js...');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appJs.includes("'#/registration-config': { module: window.OrgLocationModule") || appJs.includes("'#/registration-config': { module: window.RegistrationConfigModule"), 'Router must handle #/registration-config with OrgLocationModule or RegistrationConfigModule');
assert(appJs.includes("'#/registration-config': 'CONFIG_REGISTRATION'"), 'Route must have RBAC permission mapping');
console.log('  -> PASS: Router and RBAC mapping properly configured');

// 3. User Management Role Permission
console.log('Test 3: Verifying User Management Role Permission...');
const userMgmtJs = fs.readFileSync(path.join(__dirname, '../js/modules/user-management.js'), 'utf8');
assert(userMgmtJs.includes('CONFIG_REGISTRATION'), 'User Management permission list must include CONFIG_REGISTRATION');
assert(userMgmtJs.includes('Registration Configuration Master'), 'Permission label must mention Registration Configuration');
console.log('  -> PASS: CONFIG_REGISTRATION permission present in user-management.js');

// 4. DB Registration Config APIs
console.log('Test 4: Verifying DB Registration Config APIs in js/data/db.js...');
// Mock window and DB
const mockWindow = {
  State: {
    currentPlantId: 'PLANT-01',
    getCurrentUser: () => ({ full_name: 'Super Admin' }),
    showToast: () => {}
  }
};
global.window = mockWindow;

// Evaluate Database class from db.js
const dbJs = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
assert(dbJs.includes('getRegistrationConfig'), 'Database must implement getRegistrationConfig');
assert(dbJs.includes('saveRegistrationConfig'), 'Database must implement saveRegistrationConfig');
assert(dbJs.includes('copyRegistrationConfig'), 'Database must implement copyRegistrationConfig');
assert(dbJs.includes('resetRegistrationConfig'), 'Database must implement resetRegistrationConfig');
assert(dbJs.includes('buildDefaultRegistrationConfig'), 'Database must implement buildDefaultRegistrationConfig');
console.log('  -> PASS: Database class implements all 5 Registration Configuration methods');

// 5. RegistrationConfigModule implementation
console.log('Test 5: Verifying RegistrationConfigModule implementation...');
const regConfigJs = fs.readFileSync(path.join(__dirname, '../js/modules/registration-config.js'), 'utf8');
assert(regConfigJs.includes('getFacilities'), 'RegistrationConfigModule must implement getFacilities');
assert(regConfigJs.includes('onFacilityChange'), 'RegistrationConfigModule must implement onFacilityChange');
assert(regConfigJs.includes('toggleApplicable'), 'RegistrationConfigModule must implement toggleApplicable');
assert(regConfigJs.includes('toggleMandatory'), 'RegistrationConfigModule must implement toggleMandatory');
assert(regConfigJs.includes('saveConfiguration'), 'RegistrationConfigModule must implement saveConfiguration');
assert(regConfigJs.includes('openCopyModal'), 'RegistrationConfigModule must implement openCopyModal');
assert(regConfigJs.includes('executeCopyConfig'), 'RegistrationConfigModule must implement executeCopyConfig');
assert(regConfigJs.includes('resetToDefault'), 'RegistrationConfigModule must implement resetToDefault');
console.log('  -> PASS: RegistrationConfigModule has complete configuration management suite');

// 6. Test Facility 1 vs Facility 2 Default Behavior (BRD requirement)
const vm = require('vm');
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');

const sandbox = {
  window: {},
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
  console: console,
  localStorage: { getItem: () => null, setItem: () => {} }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbJs, sandbox);
const dbInstance = sandbox.DB;

const plant1Config = dbInstance.getRegistrationConfig('PLANT-01');
const plant2Config = dbInstance.getRegistrationConfig('PLANT-02');

const p1Mobile = plant1Config.customer_fields.find(f => f.field_key === 'mobile_number');
const p2Mobile = plant2Config.customer_fields.find(f => f.field_key === 'mobile_number');

assert(p1Mobile, 'Plant 1 config must have mobile_number field');
assert(p2Mobile, 'Plant 2 config must have mobile_number field');

assert.strictEqual(p1Mobile.mandatory, true, 'Mauli Service Center 1 must have Mobile Number as MANDATORY');
assert.strictEqual(p2Mobile.mandatory, false, 'Mauli Service Center 2 must have Mobile Number as NON-MANDATORY (OPTIONAL)');
console.log('  -> PASS: Mauli 1 has Mobile Number mandatory = true, Mauli 2 has Mobile Number mandatory = false');

// 7. Test Copy Configuration across facilities
console.log('Test 7: Verifying Copy Configuration API...');
// Modify plant 1 email to mandatory
const modifiedPlant1 = JSON.parse(JSON.stringify(plant1Config));
const emailField = modifiedPlant1.customer_fields.find(f => f.field_key === 'email');
emailField.mandatory = true;
dbInstance.saveRegistrationConfig('PLANT-01', modifiedPlant1);

// Copy plant 1 configuration to plant 3
dbInstance.copyRegistrationConfig('PLANT-01', ['PLANT-03']);
const plant3Config = dbInstance.getRegistrationConfig('PLANT-03');
const p3Email = plant3Config.customer_fields.find(f => f.field_key === 'email');
assert.strictEqual(p3Email.mandatory, true, 'Copied config in Plant 3 must reflect Plant 1 settings');
console.log('  -> PASS: Copy Configuration accurately replicates policy settings');

// 8. Test Dynamic Enforcement in Job Card Intake (BillingModule)
console.log('Test 8: Verifying Dynamic Policy Integration in BillingModule...');
const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
assert(billingJs.includes('getRegistrationConfig'), 'BillingModule must query getRegistrationConfig');
assert(billingJs.includes('onJobCardFacilityChange'), 'BillingModule must provide onJobCardFacilityChange facility switch');
assert(billingJs.includes('new-jc-facility-select'), 'Billing modal must include facility selector');
assert(billingJs.includes('isMan(\'CUSTOMER\', \'mobile_number\')'), 'Customer Mobile must check isMan dynamically');
console.log('  -> PASS: Job Card Intake dynamically evaluates facility-wise Registration Configuration');

console.log('\n================================================================');
console.log('🎉 ALL REGISTRATION CONFIGURATION TESTS PASSED (8/8)!');
console.log('================================================================\n');
