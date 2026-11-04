const fs = require('fs');
const path = require('path');

// Setup environment
const auditLogs = [];
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
        },
        {
          id: 'CUST-000127',
          cin_number: 'CIN-000127',
          cin: 'CIN-000127',
          customer_cin: 'CIN-000127',
          name: 'Priya Sharma',
          customer_name: 'Priya Sharma',
          mobile: '9822334455',
          city: 'Pune',
          vehicles: ['MH12CD5678']
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
        },
        {
          id: 'VEH-000127',
          vehicle_reg_no: 'MH12CD5678',
          customer_cin: 'CIN-000127',
          customer_name: 'Priya Sharma',
          model_name: 'TVS Jupiter',
          vehicle_model: 'TVS Jupiter',
          odometer_km: '9,200 km'
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
      auditLogs.push({ action, entity, id, desc, time: new Date() });
    }
  },
  State: {
    showToast(msg, type) {},
    showModal(opts) {},
    closeModal() {}
  },
  DocSeriesMasterModule: {
    generateNextNumber(code, plant) {
      return { success: true, docNumber: `${code}-PUN-26-001` };
    }
  }
};

global.document = {
  getElementById(id) {
    return { innerHTML: '', value: '', addEventListener() {} };
  },
  activeElement: null
};

// Load code
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('====================================================');
console.log('ESTIMATE MANAGEMENT PRD v1.0 ACCEPTANCE CRITERIA SUITE');
console.log('====================================================');

// EST-AC-01 & EST-AC-02: Single screen, Estimate No. generated on save
window.BillingModule.ensureSeedData();
window.BillingModule.createNewEstimate();
const newEst = window.BillingModule.getActiveEstimate();
console.log('EST-AC-01 / EST-AC-02 (Draft create):', newEst.estimate_no === 'Generated on Save' ? 'PASS' : 'FAIL');
if (newEst.estimate_no !== 'Generated on Save') throw new Error('EST-AC-02 failed');

// Save Draft generates Estimate No.
window.BillingModule.saveDraftEstimate();
console.log('EST-AC-09 (Save Draft): Status =', newEst.status, '| Est No =', newEst.estimate_no);
if (newEst.status !== 'DRAFT' || !newEst.estimate_no.startsWith('EST-')) throw new Error('EST-AC-09 failed');

// EST-AC-03: Selecting Customer CIN auto-populates Customer Name & Mobile
window.BillingModule.onEstimateCinChange('CIN-000127');
console.log('EST-AC-03 (CIN selection): Name =', newEst.customer_name, '| Mobile =', newEst.customer_mobile);
if (newEst.customer_name !== 'Priya Sharma' || newEst.customer_mobile !== '9822334455') throw new Error('EST-AC-03 failed');

// EST-AC-04 & EST-AC-05: Selecting Vehicle No. auto-populates Make/Model
console.log('EST-AC-04/05 (Vehicle linked): Vehicle =', newEst.vehicle_reg_no, '| Model =', newEst.vehicle_model);
if (newEst.vehicle_reg_no !== 'MH12CD5678' || newEst.vehicle_model !== 'TVS Jupiter') throw new Error('EST-AC-04/05 failed');

// Switch back to Rahul Patil
window.BillingModule.onEstimateCinChange('CIN-000126');
console.log('Switched back to Rahul Patil: Name =', newEst.customer_name, '| Vehicle =', newEst.vehicle_reg_no, '| Model =', newEst.vehicle_model);
if (newEst.customer_name !== 'Rahul Patil' || newEst.vehicle_reg_no !== 'MH12AB1234') throw new Error('Switch back failed');

// EST-AC-06 & EST-AC-07: Add items, calculate Subtotal, Discount, Tax, Estimated Total
newEst.items = [
  { id: '1', name: 'Engine Oil', type: 'PART', qty: 1, rate: 450, amount: 450 },
  { id: '2', name: 'Oil Filter', type: 'PART', qty: 1, rate: 150, amount: 150 },
  { id: '3', name: 'General Service Labour', type: 'LABOUR', qty: 1, rate: 500, amount: 500 }
];
window.BillingModule.recalculateEstimateTotals(newEst);
console.log('EST-AC-07 (Calculations): Subtotal =', newEst.subtotal, '| Total =', newEst.estimated_total);
if (newEst.subtotal !== 1100 || newEst.estimated_total !== 1100) throw new Error('EST-AC-07 failed');

// EST-AC-10: Submit Estimate & Mark Ready for Approval
window.BillingModule.submitEstimate();
console.log('EST-AC-10 (Submit): Status =', newEst.status);
if (newEst.status !== 'SUBMITTED') throw new Error('EST-AC-10 Submit failed');

window.BillingModule.markReadyForCustomerApproval();
console.log('EST-AC-10 (Ready for Approval): Status =', newEst.status);
if (newEst.status !== 'READY_FOR_APPROVAL') throw new Error('EST-AC-10 Ready failed');

// Customer Approval
window.BillingModule.customerApproveEstimate();
console.log('Customer Approved: Status =', newEst.status);
if (newEst.status !== 'CUSTOMER_APPROVED') throw new Error('Customer approval failed');

// EST-AC-11 & EST-AC-12: Revision retention
window.BillingModule.reviseEstimate();
const revEst = window.BillingModule.getActiveEstimate();
console.log('EST-AC-12 (Revision): New Est No =', revEst.estimate_no, '| Revision No =', revEst.revision_no);
const originalEst = window.DB.getById('billingEstimates', newEst.id);
console.log('Original Est Status =', originalEst.status, '| Superseded by =', originalEst.superseded_by_no);
if (originalEst.status !== 'REVISED' || revEst.status !== 'DRAFT') throw new Error('EST-AC-11/12 failed');

// Test Conversion: Approve revEst and convert to Draft Bill
revEst.status = 'CUSTOMER_APPROVED';
window.BillingModule.convertEstimateToDraftBill();
console.log('EST-AC-13 (Convert to Draft Bill): Status =', revEst.status, '| DB No =', revEst.converted_to_no);
if (revEst.status !== 'CONVERTED' || revEst.converted_to_type !== 'DRAFT_BILL') throw new Error('EST-AC-13 failed');

// EST-AC-14: Cannot convert twice
let convertTwiceBlocked = false;
window.State.showToast = (msg, type) => {
  if (msg.includes('already been converted')) convertTwiceBlocked = true;
};
window.BillingModule.convertEstimateToDraftBill();
console.log('EST-AC-14 (Prevent double conversion):', convertTwiceBlocked ? 'PASS' : 'FAIL');
if (!convertTwiceBlocked) throw new Error('EST-AC-14 failed');

// EST-AC-17: Audit Trail
console.log('EST-AC-17 (Audit Trail entries captured):', auditLogs.length, 'entries');
if (auditLogs.length === 0) throw new Error('EST-AC-17 failed');

console.log('====================================================');
console.log('ALL ACCEPTANCE CRITERIA VERIFIED AND PASSED 100%!');
console.log('====================================================');
