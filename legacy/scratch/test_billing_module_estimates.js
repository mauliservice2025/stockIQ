// Unit test for Estimate Management module
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {
  location: { hash: '#/billing-estimates' },
  DB: {
    data: {
      customers: [
        {
          id: 'CUST-000126',
          cin_number: 'CIN-000126',
          cin: 'CIN-000126',
          customer_cin: 'CIN-000126',
          name: 'Rahul Patil',
          customer_name: 'Rahul Patil',
          mobile: '98XXXXXX10',
          customer_mobile: '98XXXXXX10',
          city: 'Pune',
          vehicles: ['MH12AB1234']
        }
      ],
      vehicles: [
        {
          id: 'VEH-000126',
          vehicle_reg_no: 'MH12AB1234',
          customer_cin: 'CIN-000126',
          customer_name: 'Rahul Patil',
          model_name: 'Honda Activa',
          vehicle_model: 'Honda Activa',
          odometer_km: '18,500 km'
        }
      ],
      billingEstimates: [],
      jobCards: [],
      draftBills: [],
      finalBills: []
    },
    getAll(tbl) { return this.data[tbl] || []; },
    getById(tbl, id) { return (this.data[tbl] || []).find(x => x.id === id); },
    upsert(tbl, obj) {
      if (!this.data[tbl]) this.data[tbl] = [];
      const idx = this.data[tbl].findIndex(x => x.id === obj.id);
      if (idx >= 0) this.data[tbl][idx] = obj;
      else this.data[tbl].push(obj);
      return obj;
    },
    saveData() {},
    emitChange() {},
    logAudit(action, entity, id, desc) {
      console.log(`[AUDIT] ${action} on ${entity} (${id}): ${desc}`);
    }
  },
  State: {
    showToast(msg, type) {
      console.log(`[TOAST - ${type || 'info'}]: ${msg}`);
    },
    showModal(opts) {
      console.log(`[MODAL]:`, opts.title);
    },
    closeModal() {}
  },
  DocSeriesMasterModule: {
    generateNextNumber(code, plant) {
      return { success: true, docNumber: `${code}-PUN-26-999` };
    }
  }
};

// Mock DOM
global.document = {
  getElementById(id) {
    return {
      innerHTML: '',
      value: '',
      addEventListener() {}
    };
  },
  activeElement: null
};

// Load billing.js
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('--- Testing Estimate Management Initial Seeding ---');
window.BillingModule.ensureSeedData();
const estimates = window.DB.getAll('billingEstimates');
console.log(`Loaded ${estimates.length} estimates.`);
const est1 = estimates[0];
console.log('Sample Estimate No:', est1.estimate_no);
console.log('Customer CIN:', est1.customer_cin, '| Name:', est1.customer_name, '| Mobile:', est1.customer_mobile);
console.log('Vehicle No:', est1.vehicle_reg_no, '| Model:', est1.vehicle_model, '| Odometer:', est1.odometer_km);
console.log('Items Count:', est1.items.length, '| Subtotal:', est1.subtotal, '| Total:', est1.estimated_total);

if (est1.customer_cin !== 'CIN-000126' || est1.customer_name !== 'Rahul Patil' || est1.vehicle_reg_no !== 'MH12AB1234') {
  throw new Error('Initial estimate seed mismatch!');
}
if (est1.items.length !== 3 || est1.subtotal !== 1100 || est1.estimated_total !== 1100) {
  throw new Error(`Totals mismatch! Expected 1100, got subtotal=${est1.subtotal}, total=${est1.estimated_total}`);
}
console.log('✓ Initial estimate seed values match PRD v1.0 exactly!');

console.log('\n--- Testing Single-Screen HTML Renderer ---');
window.BillingModule.activeEstimateId = est1.id;
const html = window.BillingModule.renderEstimatesTab();
console.log('Rendered HTML length:', html.length);
if (!html.includes('Estimate Management') || !html.includes('CIN-000126') || !html.includes('MH12AB1234') || !html.includes('Honda Activa')) {
  throw new Error('Rendered HTML missing core identifiers!');
}
console.log('✓ Rendered HTML contains all required PRD headers and sections!');

console.log('\n--- Testing Lifecycle Actions ---');
// Test 1: Submit Estimate
window.BillingModule.submitEstimate();
console.log('Status after submit:', window.BillingModule.getActiveEstimate().status);
if (window.BillingModule.getActiveEstimate().status !== 'SUBMITTED') {
  throw new Error('Submit failed!');
}
console.log('✓ Submit estimate passed!');

// Test 2: Mark Ready for Customer Approval
window.BillingModule.markReadyForCustomerApproval();
console.log('Status after ready:', window.BillingModule.getActiveEstimate().status);
if (window.BillingModule.getActiveEstimate().status !== 'READY_FOR_APPROVAL') {
  throw new Error('Mark ready failed!');
}
console.log('✓ Mark Ready for Customer Approval passed!');

// Test 3: Customer Approved
window.BillingModule.customerApproveEstimate();
console.log('Status after approve:', window.BillingModule.getActiveEstimate().status);
if (window.BillingModule.getActiveEstimate().status !== 'CUSTOMER_APPROVED') {
  throw new Error('Approve failed!');
}
console.log('✓ Customer Approved passed!');

// Test 4: Convert to Draft Bill
window.BillingModule.convertEstimateToDraftBill();
const convertedEst = window.BillingModule.getActiveEstimate();
console.log('Status after convert to Draft Bill:', convertedEst.status, '| Converted to:', convertedEst.converted_to_no);
if (convertedEst.status !== 'CONVERTED' || convertedEst.converted_to_type !== 'DRAFT_BILL') {
  throw new Error('Convert to Draft Bill failed!');
}
const draftList = window.DB.getAll('draftBills');
console.log('Draft bills in DB:', draftList.length);
const createdDraft = draftList.find(d => d.draft_bill_no === convertedEst.converted_to_no);
if (!createdDraft) throw new Error('Created Draft Bill not found in DB!');
console.log('Created Draft Bill customer:', createdDraft.customer_name, '| vehicle:', createdDraft.vehicle_reg_no, '| items:', createdDraft.items.length);
console.log('✓ Convert to Draft Bill successfully carried over customer, vehicle & items!');

console.log('\n--- All Unit Tests Passed Successfully! ---');
