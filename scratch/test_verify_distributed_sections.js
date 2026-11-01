const fs = require('fs');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING DISTRIBUTED SECTIONS IN CREATE JOB CARD MODAL');
console.log('================================================================');

let lastModalConfig = null;

global.window = {
  DB: {
    getAll: (table) => {
      if (table === 'jobCards') return [{ id: 'JC-1' }, { id: 'JC-2' }];
      if (table === 'vehicleModels') return [
        { id: 'MOD-01', name: 'Activa 6G', variant: 'Deluxe', manufacturer_id: 'MFG-01', active: true },
        { id: 'MOD-02', name: 'Pulsar 150', variant: 'Twin Disc', manufacturer_id: 'MFG-02', active: true }
      ];
      if (table === 'vehicleManufacturers') return [
        { id: 'MFG-01', name: 'Honda Motorcycles' },
        { id: 'MFG-02', name: 'Bajaj Auto' }
      ];
      if (table === 'users') return [
        { id: 'USR-101', full_name: 'Santosh Shinde', user_type: 'technician', status: 'ACTIVE' },
        { id: 'USR-102', full_name: 'Vikram Rathod', user_type: 'technician', status: 'ACTIVE' }
      ];
      return [];
    },
    getRegistrationConfig: (facilityId) => {
      return {
        customer_fields: [
          { field_key: 'customer_name', applicable: true, mandatory: true },
          { field_key: 'mobile_number', applicable: true, mandatory: true },
          { field_key: 'alt_mobile_number', applicable: true, mandatory: false },
          { field_key: 'email', applicable: false, mandatory: false },
          { field_key: 'address', applicable: true, mandatory: false },
          { field_key: 'city', applicable: true, mandatory: false },
          { field_key: 'district', applicable: true, mandatory: false },
          { field_key: 'state', applicable: true, mandatory: false },
          { field_key: 'pincode', applicable: true, mandatory: false },
          { field_key: 'customer_type', applicable: true, mandatory: false },
          { field_key: 'gstin', applicable: false, mandatory: false }
        ],
        vehicle_fields: [
          { field_key: 'vehicle_reg_no', applicable: true, mandatory: true },
          { field_key: 'vehicle_model', applicable: true, mandatory: true },
          { field_key: 'odometer_km', applicable: true, mandatory: true },
          { field_key: 'fuel_level', applicable: true, mandatory: false },
          { field_key: 'mfg_year', applicable: false, mandatory: false },
          { field_key: 'chassis_no', applicable: false, mandatory: false },
          { field_key: 'engine_no', applicable: false, mandatory: false },
          { field_key: 'color', applicable: false, mandatory: false },
          { field_key: 'insurance_company', applicable: false, mandatory: false },
          { field_key: 'insurance_policy_no', applicable: false, mandatory: false }
        ]
      };
    }
  },
  State: {
    showModal: (config) => {
      lastModalConfig = config;
    },
    closeModal: () => {}
  }
};

eval(fs.readFileSync('js/modules/billing.js', 'utf8'));

// Run showNewJobCardModal
window.BillingModule.showNewJobCardModal('PLANT-01');

assert(lastModalConfig, 'Modal must have been triggered');
const html = lastModalConfig.contentHtml;

console.log('\n--- 1. Checking Section Headers ---');
assert(html.includes('1. Customer Information'), 'Must contain "1. Customer Information"');
console.log('✓ PASS: Section 1 is "👤 1. Customer Information"');

assert(html.includes('2. Vehicle Details'), 'Must contain "2. Vehicle Details"');
console.log('✓ PASS: Section 2 is "🏍️ 2. Vehicle Details"');

assert(html.includes('3. Service Scope & Assignment'), 'Must contain "3. Service Scope & Assignment"');
console.log('✓ PASS: Section 3 is "🛠️ 3. Service Scope & Assignment"');

console.log('\n--- 2. Checking Section Separation ---');
// Verify that customer section comes first and vehicle section is separate
const custSecIdx = html.indexOf('1. Customer Information');
const vehSecIdx = html.indexOf('2. Vehicle Details');
const servSecIdx = html.indexOf('3. Service Scope & Assignment');

assert(custSecIdx < vehSecIdx, 'Customer Information must precede Vehicle Details');
assert(vehSecIdx < servSecIdx, 'Vehicle Details must precede Service Scope & Assignment');
console.log('✓ PASS: Correct sequential hierarchy: Customer Information -> Vehicle Details -> Service Scope & Assignment');

// Verify Customer section contains customer inputs
const custSubStr = html.substring(custSecIdx, vehSecIdx);
assert(custSubStr.includes('id="new-jc-no"'), 'Customer section contains Job Card No');
assert(custSubStr.includes('id="new-jc-date"'), 'Customer section contains Date');
assert(custSubStr.includes('id="new-jc-customer"'), 'Customer section contains Customer Name');
assert(custSubStr.includes('id="new-jc-mobile"'), 'Customer section contains Customer Mobile');
assert(custSubStr.includes('id="new-jc-alt-mobile"'), 'Customer section contains Alternate Mobile');
assert(custSubStr.includes('id="new-jc-customer-type"'), 'Customer section contains Customer Type');
assert(custSubStr.includes('id="new-jc-address"'), 'Customer section contains Street Address');
assert(custSubStr.includes('id="new-jc-city"'), 'Customer section contains City');
assert(custSubStr.includes('id="new-jc-district"'), 'Customer section contains District');
assert(custSubStr.includes('id="new-jc-state"'), 'Customer section contains State');
assert(custSubStr.includes('id="new-jc-pincode"'), 'Customer section contains PIN Code');
console.log('✓ PASS: Customer section contains all customer information fields cleanly');

// Verify Vehicle section contains vehicle inputs
const vehSubStr = html.substring(vehSecIdx, servSecIdx);
assert(vehSubStr.includes('id="new-jc-reg"'), 'Vehicle section contains Vehicle Reg No');
assert(vehSubStr.includes('id="new-jc-model"'), 'Vehicle section contains Vehicle Model');
assert(vehSubStr.includes('id="new-jc-km"'), 'Vehicle section contains Odometer KM');
assert(vehSubStr.includes('id="new-jc-fuel"'), 'Vehicle section contains Fuel Level');
console.log('✓ PASS: Vehicle section contains all vehicle detail fields cleanly');

// Verify Service section contains service inputs
const servSubStr = html.substring(servSecIdx);
assert(servSubStr.includes('id="new-jc-service-type"'), 'Service section contains Service Type');
assert(servSubStr.includes('id="new-jc-tech"'), 'Service section contains Technician Assigned');
assert(servSubStr.includes('id="new-jc-delivery"'), 'Service section contains Expected Delivery');
assert(servSubStr.includes('id="new-jc-complaints"'), 'Service section contains Customer Complaints');
assert(servSubStr.includes('id="new-jc-diagnosis"'), 'Service section contains Diagnosis Remarks');
console.log('✓ PASS: Service section contains all scope and assignment fields cleanly');

console.log('\n================================================================');
console.log('🎉 ALL DISTRIBUTED SECTION TESTS PASSED SUCCESSFULLY!');
console.log('================================================================\n');
