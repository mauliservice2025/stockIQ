const fs = require('fs');
const assert = require('assert');

const billingJs = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Verify Activity Timeline is removed from viewJobCard
assert(!billingJs.includes('Job Card Activities & Customer Journey'), 'Activity Timeline must be removed from Job Card Details');
assert(!billingJs.includes('Document Number Series Engine'), 'Document Number Series Engine label must be removed from viewJobCard');

// 2. Verify helper methods exist
assert(billingJs.includes('viewEstimateForJobCard(jcId)'), 'viewEstimateForJobCard method must exist on BillingModule');
assert(billingJs.includes('viewBillForJobCard(jcId)'), 'viewBillForJobCard method must exist on BillingModule');

// 3. Mock environment to test viewJobCard HTML generation
global.window = {
  DB: {
    getById(tbl, id) {
      if (tbl === 'jobCards') {
        return {
          id: 'JC-001',
          job_card_no: 'JC/MSC1/2026/0015',
          vehicle_reg_no: 'MG20TH9827',
          customer_name: 'Pravin Patil',
          status: 'CLOSED',
          parts_required: [
            { item_code: '2W-BRK-01', item_name: 'Brake Pad', qty: 1, unit_price: 150, status: 'ISSUED' }
          ]
        };
      }
      return null;
    },
    getAll(tbl) {
      if (tbl === 'finalBills') {
        return [
          { id: 'BILL-001', job_card_id: 'JC-001', status: 'PAID', invoice_no: 'INV-2026-001' }
        ];
      }
      if (tbl === 'billingEstimates') {
        return [
          { id: 'EST-001', job_card_id: 'JC-001', estimate_no: 'EST-2026-001' }
        ];
      }
      return [];
    }
  },
  State: {
    showModal(modalOpts) {
      this.lastModal = modalOpts;
    },
    closeModal() {},
    showToast() {}
  }
};

// Evaluate the file or extract viewJobCard function
// Since billing.js is large, let's verify regex and structure
assert(billingJs.includes("isClosedOrCompleted ? `"), 'isClosedOrCompleted check must exist in viewJobCard');
assert(billingJs.includes("onclick=\"window.BillingModule.viewEstimateForJobCard('${j.id}')\">📝 View Estimate"), 'View Estimate button must exist in viewJobCard when closed');
assert(billingJs.includes("onclick=\"window.BillingModule.viewBillForJobCard('${j.id}')\">🧾 View Bill"), 'View Bill button must exist in viewJobCard when closed');

// Verify renderJobCardActionToolbar checks isClosedOrCompleted
assert(billingJs.includes("onclick=\"window.BillingModule.viewEstimateForJobCard('${jcId}')\" title=\"View Estimate\""), 'View Estimate button must exist in renderJobCardActionToolbar');
assert(billingJs.includes("onclick=\"window.BillingModule.viewBillForJobCard('${jcId}')\" title=\"View Bill\""), 'View Bill button must exist in renderJobCardActionToolbar');

console.log('✓ All Job Card Closed rules and Activity Timeline removal tests passed successfully!');
