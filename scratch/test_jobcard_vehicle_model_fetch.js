const fs = require('fs');
const assert = require('assert');

// Setup mock window environment
let lastModalConfig = null;
let lastToast = null;
const mockJobCards = [];

global.window = {
  DB: {
    getAll: (table) => {
      if (table === 'jobCards') return mockJobCards;
      if (table === 'vehicleModels') {
        return [
          { id: 'MOD-01', manufacturer_id: 'VM-01', code: 'ACTIVA-6G', name: 'Activa 6G', variant: 'Deluxe (BS6)', displacement_cc: 110, fuel_type: 'Petrol', active: true },
          { id: 'MOD-02', manufacturer_id: 'VM-01', code: 'ACTIVA-125', name: 'Activa 125', variant: 'Disc SmartXonnect', displacement_cc: 125, fuel_type: 'Petrol', active: true },
          { id: 'MOD-04', manufacturer_id: 'VM-02', code: 'JUPITER-125', name: 'Jupiter 125', variant: 'Disc SmartXonnect', displacement_cc: 125, fuel_type: 'Petrol', active: true },
          { id: 'MOD-06', manufacturer_id: 'VM-03', code: 'SPLENDOR-PLUS', name: 'Splendor Plus', variant: 'Self Cast XTEC', displacement_cc: 97, fuel_type: 'Petrol', active: true }
        ];
      }
      if (table === 'vehicleManufacturers') {
        return [
          { id: 'VM-01', name: 'Honda Motorcycle & Scooter India' },
          { id: 'VM-02', name: 'TVS Motor Company' },
          { id: 'VM-03', name: 'Hero MotoCorp Ltd.' }
        ];
      }
      return [];
    },
    upsert: (table, obj) => {
      if (table === 'jobCards') mockJobCards.push(obj);
    },
    emitChange: () => {},
    isPlantActive: () => true,
    isWarehouseActive: () => true
  },
  State: {
    showModal: (config) => { lastModalConfig = config; },
    closeModal: () => {},
    showToast: (msg, type) => { lastToast = { msg, type }; }
  }
};

eval(fs.readFileSync('js/modules/billing.js', 'utf8'));

console.log('================================================================');
console.log('TESTING VEHICLE MODEL FETCH FROM VEHICLE COMPATIBILITY MASTER');
console.log('================================================================');

// 1. Test showNewJobCardModal rendering
window.BillingModule.showNewJobCardModal();
assert(lastModalConfig, 'showNewJobCardModal must open a modal');
const html = lastModalConfig.contentHtml;

console.log('\n--- 1. Testing Vehicle Model Dropdown ---');
assert(html.includes('<select id="new-jc-model"'), 'Vehicle Model must be a <select> element, not a plain text input');
console.log('✓ PASS: Vehicle Model is a <select id="new-jc-model"> element');

assert(!html.includes('<input type="text" id="new-jc-model"'), 'Old text input for vehicle model must be removed');
console.log('✓ PASS: Old text input <input type="text" id="new-jc-model"> successfully eliminated');

assert(html.includes('-- Select from Vehicle Compatibility Master --'), 'Must show default placeholder option');
console.log('✓ PASS: Default placeholder option present');

// 2. Test that vehicle models from Vehicle Compatibility Master are populated
console.log('\n--- 2. Verifying Vehicle Models from Master ---');
assert(html.includes('value="MOD-01"'), 'MOD-01 (Activa 6G) must be present in dropdown');
assert(html.includes('value="MOD-02"'), 'MOD-02 (Activa 125) must be present in dropdown');
assert(html.includes('value="MOD-04"'), 'MOD-04 (Jupiter 125) must be present in dropdown');
assert(html.includes('value="MOD-06"'), 'MOD-06 (Splendor Plus) must be present in dropdown');
assert(html.includes('Activa 6G'), 'Activa 6G label must be present');
assert(html.includes('Jupiter 125'), 'Jupiter 125 label must be present');
assert(html.includes('Splendor Plus'), 'Splendor Plus label must be present');
console.log('✓ PASS: All models from Vehicle Compatibility Master populated in select options');

// 3. Test saving a new Job Card with a selected model from Vehicle Compatibility Master
console.log('\n--- 3. Testing Job Card Save with Master Vehicle Model ---');
global.document = {
  getElementById: (id) => {
    const mockElements = {
      'new-jc-no': { value: 'JC-PUN-26-009' },
      'new-jc-date': { value: '2026-10-08' },
      'new-jc-customer': { value: 'Pravin Patil' },
      'new-jc-mobile': { value: '9876543210' },
      'new-jc-reg': { value: 'MH-12-AB-9999' },
      'new-jc-model': {
        tagName: 'SELECT',
        value: 'MOD-01',
        selectedOptions: [{
          value: 'MOD-01',
          getAttribute: (attr) => {
            if (attr === 'data-name') return 'Honda Activa 6G';
            if (attr === 'data-model') return 'Activa 6G';
            if (attr === 'data-variant') return 'Deluxe (BS6)';
            return '';
          },
          text: 'Honda Activa 6G - Deluxe (BS6)'
        }]
      },
      'new-jc-km': { value: '12000' },
      'new-jc-fuel': { value: '50%' },
      'new-jc-service-type': { value: 'Periodic Maintenance Service' },
      'new-jc-tech': { value: 'Santosh Shinde' },
      'new-jc-delivery': { value: '2026-10-09T18:00' },
      'new-jc-complaints': { value: 'Full service and oil change' },
      'new-jc-diagnosis': { value: 'Brake pads check' }
    };
    return mockElements[id] || { value: '' };
  }
};

window.BillingModule.saveNewJobCard();

const savedJc = mockJobCards.find(j => j.job_card_no === 'JC-PUN-26-009');
assert(savedJc, 'Job Card must be saved to DB');
assert.strictEqual(savedJc.vehicle_model_id, 'MOD-01', 'vehicle_model_id must match MOD-01 from Vehicle Compatibility Master');
assert.strictEqual(savedJc.vehicle_model, 'Honda Activa 6G', 'vehicle_model must store model name');
assert.strictEqual(savedJc.vehicle_variant, 'Deluxe (BS6)', 'vehicle_variant must store variant');
assert.strictEqual(savedJc.customer_name, 'Pravin Patil');
assert.strictEqual(savedJc.vehicle_reg_no, 'MH-12-AB-9999');
console.log('✓ PASS: Job Card correctly saved with vehicle_model_id: ' + savedJc.vehicle_model_id);
console.log('✓ PASS: Job Card correctly saved with vehicle_model: ' + savedJc.vehicle_model);
console.log('✓ PASS: Job Card correctly saved with vehicle_variant: ' + savedJc.vehicle_variant);

console.log('\n================================================================');
console.log('🎉 ALL VEHICLE MODEL MASTER TESTS PASSED (100%)!');
console.log('================================================================\n');
