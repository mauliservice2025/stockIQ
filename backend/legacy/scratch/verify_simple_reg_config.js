const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
const dbJs = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
const regJs = fs.readFileSync(path.join(__dirname, '../js/modules/registration-config.js'), 'utf8');

const sandbox = {
  window: {},
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  },
  console: console,
  localStorage: { getItem: () => null, setItem: () => {} }
};
sandbox.window = sandbox;
sandbox.window.State = { currentPlantId: 'PLANT-01', getCurrentUser: () => ({ full_name: 'Super Admin' }), showToast: () => {} };
vm.createContext(sandbox);
vm.runInContext(mockDataContent, sandbox);
vm.runInContext(dbJs, sandbox);
vm.runInContext(regJs, sandbox);

const cardHtml = sandbox.RegistrationConfigModule.renderContentCard();
console.log('HTML Length:', cardHtml.length);

assert(cardHtml.includes('Field Name & Description'), 'Must have 1st column: Field Name & Description');
assert(cardHtml.includes('>Applicable<'), 'Must have 2nd column: Applicable');
assert(cardHtml.includes('>Mandatory<'), 'Must have 3rd column: Mandatory');

assert(!cardHtml.includes('FIELD KEY'), 'Must NOT have developer column FIELD KEY');
assert(!cardHtml.includes('FIELD STATUS'), 'Must NOT have redundant column FIELD STATUS');
assert(!cardHtml.includes('CONSUMED BY'), 'Must NOT have redundant column CONSUMED BY');

assert(cardHtml.includes('toggleApplicable'), 'Must use toggleApplicable for 1-click toggling');
assert(cardHtml.includes('toggleMandatory'), 'Must use toggleMandatory for 1-click toggling');

// Test toggle behavior
console.log('\nTesting 1-click toggle behavior:');
const initialApplicable = sandbox.RegistrationConfigModule.currentWorkingConfig.customer_fields.find(f => f.field_key === 'mobile_number').applicable;
sandbox.RegistrationConfigModule.toggleApplicable('CUSTOMER', 'mobile_number');
const afterToggle = sandbox.RegistrationConfigModule.currentWorkingConfig.customer_fields.find(f => f.field_key === 'mobile_number').applicable;
assert.strictEqual(afterToggle, !initialApplicable, 'Applicable state should flip');

console.log('✓ PASS: toggleApplicable flipped mobile_number applicable from', initialApplicable, 'to', afterToggle);
console.log('✓ PASS: All simplified UI checks and assertions passed (100%)!');
