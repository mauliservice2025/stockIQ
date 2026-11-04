const fs = require('fs');
const path = require('path');

// Setup minimal DOM and environment stubs
global.window = global;
global.document = {
  body: {
    appendChild: (el) => {
      global.document._appendedChildren = global.document._appendedChildren || [];
      global.document._appendedChildren.push(el);
      global.document._lastAppended = el;
    }
  },
  getElementById: (id) => {
    return global.document._elements ? global.document._elements[id] : null;
  },
  createElement: (tag) => {
    return {
      tagName: tag,
      style: {},
      innerHTML: '',
      remove: function() { this.removed = true; }
    };
  },
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.localStorage = {
  _store: {},
  getItem: function(k) { return this._store[k] || null; },
  setItem: function(k, v) { this._store[k] = String(v); },
  removeItem: function(k) { delete this._store[k]; }
};

// Mock DB
const dbData = {
  vehicles: [
    { id: 'VEH-01', vehicle_reg_no: 'MH12AC4335', reg_no: 'MH12AC4335', model_name: 'Honda Activa (110)', vehicle_model: 'Honda Activa (110)', customer_name: 'Pravin S Patil', customer_mobile: '9838462423', cin_number: 'CIN/MSC/2026/000036' }
  ],
  vehicleModels: [
    { id: 'MOD-01', name: 'Honda Activa', variant: '110', displacement_cc: 110, fuel_type: 'Petrol' },
    { id: 'MOD-02', name: 'Honda Activa 125', variant: '125cc', displacement_cc: 125, fuel_type: 'Petrol' },
    { id: 'MOD-03', name: 'TVS Jupiter', variant: 'ZX', displacement_cc: 113, fuel_type: 'Petrol' }
  ],
  customers: [
    { id: 'CUST-01', cin_number: 'CIN/MSC/2026/000036', name: 'Pravin S Patil', mobile: '9838462423' }
  ],
  jobCards: [
    { id: 'JC-01', job_card_no: 'JC-2026-0001', vehicle_reg_no: 'MH12AC4335', vehicle_model: 'Honda Activa (110)', customer_name: 'Pravin S Patil', customer_mobile: '9838462423', status: 'IN_PROGRESS' }
  ],
  billingEstimates: [
    { id: 'EST-01', estimate_no: 'EST-2026-0001', job_card_id: 'JC-01', vehicle_reg_no: 'MH12AC4335', vehicle_model: 'Honda Activa (110)', is_finalized: false }
  ],
  draftBills: [
    { id: 'DB-01', draft_bill_no: 'DB-2026-0001', job_card_id: 'JC-01', vehicle_reg_no: 'MH12AC4335', vehicle_model: 'Honda Activa (110)', is_finalized: false }
  ],
  vehicleDeliveries: [
    { id: 'DEL-01', job_card_id: 'JC-01', vehicle_reg_no: 'MH12AC4335', vehicle_model: 'Honda Activa (110)', status: 'PENDING' }
  ],
  finalBills: []
};

global.window.DB = {
  data: dbData,
  getAll: (table) => dbData[table] || [],
  getById: (table, id) => (dbData[table] || []).find(r => r.id === id),
  upsert: (table, record) => {
    if (!dbData[table]) dbData[table] = [];
    const idx = dbData[table].findIndex(r => r.id === record.id);
    if (idx >= 0) dbData[table][idx] = { ...record };
    else dbData[table].push({ ...record });
  },
  emitChange: () => {},
  saveData: () => {},
  normalizeVehicleReg: (v) => String(v || '').replace(/[\s-]/g, '').toUpperCase(),
  formatVehicleRegDisplay: (v) => v
};

global.window.State = {
  currentPlantId: 'PLANT-01',
  getCurrentUser: () => ({ id: 'USR-001', username: 'p.patil', role: 'ADMIN' }),
  showToast: (msg, type) => console.log(`[TOAST ${type}] ${msg}`)
};

// Load BillingModule
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('--- STARTING UPDATE CUSTOMER VEHICLE MODEL TESTS ---');

// Test 1: showUpdateCustomerDetailsModal HTML checks
window.BillingModule.showUpdateCustomerDetailsModal('MH12AC4335');
const overlay = document._lastAppended;
if (!overlay) {
  throw new Error('Overlay was not appended to document.body');
}

const html = overlay.innerHTML;

// Check Title
if (!html.includes('Update Customer Information')) {
  throw new Error('Title does not contain "Update Customer Information"');
}
if (html.includes('& Sync Throughout Journey')) {
  throw new Error('Removed label "& Sync Throughout Journey" is still present!');
}

// Check removed labels
if (html.includes('Preserving')) {
  throw new Error('Removed label "Preserving ... Past Service Records" is still present!');
}
if (html.includes('Current Owner:')) {
  throw new Error('Removed label "Current Owner:" is still present!');
}
if (html.includes('Customer Sync Policy:')) {
  throw new Error('Removed label "Customer Sync Policy:" is still present!');
}

// Check Vehicle Model input & datalist
if (!html.includes('id="transfer-vehicle-model"')) {
  throw new Error('Input field id="transfer-vehicle-model" is missing!');
}
if (!html.includes('id="transfer-vehicle-models-list"')) {
  throw new Error('Datalist id="transfer-vehicle-models-list" is missing!');
}

// Check default Transfer Reason
if (!html.includes('<option value="Customer Demographic / Vehicle Model Correction" selected>Customer Demographic / Vehicle Model Correction</option>')) {
  throw new Error('Default selected option "Customer Demographic / Vehicle Model Correction" is missing or not selected!');
}

console.log('✓ Test 1 Passed: Modal header, removed labels, Vehicle Model input, datalist, and default transfer reason validated.');

// Test 2: confirmCustomerOwnershipTransfer functionality
// Mock form elements
const domElements = {
  'transfer-cust-name': { value: 'Pravin S Patil' },
  'transfer-cust-mobile': { value: '9838462423' },
  'transfer-vehicle-model': { value: 'Honda Activa 125 (125cc)' },
  'transfer-cust-alt-mobile': { value: '' },
  'transfer-cust-type': { value: 'Retail Individual' },
  'transfer-cust-address': { value: 'Ravet, Pune' },
  'transfer-cust-city': { value: 'Pune' },
  'transfer-cust-district': { value: 'Pune' },
  'transfer-cust-state': { value: 'Maharashtra' },
  'transfer-cust-pincode': { value: '412101' },
  'transfer-cust-email': { value: 'pravin@example.com' },
  'transfer-cust-gstin': { value: '' },
  'transfer-cust-reason': { value: 'Customer Demographic / Vehicle Model Correction' },
  'new-jc-model-search': { value: '', dataset: {} },
  'new-jc-model': { value: '', dataset: {} },
  'new-jc-customer': { value: '', dataset: {} },
  'new-jc-mobile': { value: '', dataset: {} },
  'customer-ownership-overlay': overlay
};
document._elements = domElements;

window.BillingModule.setReturningVehicleLock = function(locked, obj) {
  this._returningLock = { locked, obj };
};

window.BillingModule.confirmCustomerOwnershipTransfer('MH12AC4335', 'Pravin S Patil', '9838462423', 'CIN/MSC/2026/000036');

// Verify vehicle model updated in DB
const veh = dbData.vehicles.find(v => v.reg_no === 'MH12AC4335');
if (veh.model_name !== 'Honda Activa 125 (125cc)' || veh.vehicle_model !== 'Honda Activa 125 (125cc)') {
  throw new Error(`Vehicle model not updated in vehicles DB: ${veh.vehicle_model}`);
}
if (veh.model_variant !== '125cc') {
  throw new Error(`Vehicle variant not matched: ${veh.model_variant}`);
}
if (!veh.ownership_history || veh.ownership_history.length === 0 || veh.ownership_history[0].vehicle_model !== 'Honda Activa 125 (125cc)') {
  throw new Error('Vehicle ownership history does not record the updated vehicle model!');
}

// Verify Job Card updated
const jc = dbData.jobCards.find(j => j.id === 'JC-01');
if (jc.vehicle_model !== 'Honda Activa 125 (125cc)') {
  throw new Error(`Job card vehicle model not updated: ${jc.vehicle_model}`);
}

// Verify Estimate & Draft Bill & Delivery updated
const est = dbData.billingEstimates.find(e => e.id === 'EST-01');
if (est.vehicle_model !== 'Honda Activa 125 (125cc)') {
  throw new Error(`Billing estimate vehicle model not updated: ${est.vehicle_model}`);
}

const db = dbData.draftBills.find(d => d.id === 'DB-01');
if (db.vehicle_model !== 'Honda Activa 125 (125cc)') {
  throw new Error(`Draft bill vehicle model not updated: ${db.vehicle_model}`);
}

const del = dbData.vehicleDeliveries.find(d => d.id === 'DEL-01');
if (del.vehicle_model !== 'Honda Activa 125 (125cc)') {
  throw new Error(`Vehicle delivery vehicle model not updated: ${del.vehicle_model}`);
}

// Verify DOM elements updated
if (domElements['new-jc-model-search'].value !== 'Honda Activa 125 (125cc)') {
  throw new Error(`new-jc-model-search input value not updated: ${domElements['new-jc-model-search'].value}`);
}

if (window.BillingModule._returningLock?.obj?.model !== 'Honda Activa 125 (125cc)') {
  throw new Error(`Returning vehicle lock model not updated: ${window.BillingModule._returningLock?.obj?.model}`);
}

console.log('✓ Test 2 Passed: Vehicle model successfully updated across vehicles DB, jobCards, estimates, draftBills, deliveries, and form inputs.');
console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
