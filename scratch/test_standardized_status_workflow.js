// Test script for verifying the standardized 10 workflow stages

function getMockDB() {
  return {
    data: {
      jobCards: [],
      billingEstimates: [],
      draftBills: [],
      finalBills: [],
      vehicleDeliveries: []
    },
    getAll(col) {
      return this.data[col] || [];
    }
  };
}

globalThis.window = {
  DB: getMockDB()
};

const BillingModule = {
  getStandardizedTransactionStatus(record, explicitType = null) {
    if (!record) return { stage: 0, code: 'UNKNOWN', label: 'Unknown', badgeClass: 'badge-subtle', style: '' };

    const allJobCards = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('jobCards') || []) : [];
    const allEstimates = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('billingEstimates') || []) : [];
    const allDraftBills = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('draftBills') || []) : [];
    const allFinalBills = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('finalBills') || []) : [];
    const allDeliveries = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('vehicleDeliveries') || []) : [];

    let jc = null;
    let targetType = explicitType;

    if (record.job_card_no && (record.odometer_km !== undefined || record.service_type !== undefined || record.parts_required !== undefined)) {
      jc = record;
      if (!targetType) targetType = 'JOB_CARD';
    } else if (record.estimate_no || record.estimated_total !== undefined) {
      if (!targetType) targetType = 'ESTIMATE';
      jc = allJobCards.find(j => (record.job_card_id && (j.id === record.job_card_id || j.job_card_no === record.job_card_id)) || (record.job_card_no && (j.job_card_no === record.job_card_no || j.id === record.job_card_no)));
    } else if (record.invoice_no || record.draft_bill_no || record.net_payable !== undefined || record.bill_no) {
      if (!targetType) targetType = 'BILL';
      jc = allJobCards.find(j => (record.job_card_id && (j.id === record.job_card_id || j.job_card_no === record.job_card_id)) || (record.job_card_no && (j.job_card_no === record.job_card_no || j.id === record.job_card_no)));
    } else if (record.gate_pass_no !== undefined || record.delivery_date !== undefined) {
      if (!targetType) targetType = 'DELIVERY';
      jc = allJobCards.find(j => (record.job_card_id && (j.id === record.job_card_id || j.job_card_no === record.job_card_id)) || (record.job_card_no && (j.job_card_no === record.job_card_no || j.id === record.job_card_no)));
    } else {
      jc = record;
    }

    const jcId = jc ? jc.id : (record.job_card_id || record.id || '');
    const jcNo = jc ? jc.job_card_no : (record.job_card_no || '');
    const recId = record.id || '';
    const recNo = record.invoice_no || record.bill_no || record.draft_bill_no || record.estimate_no || '';

    // Match all related artifacts
    const matchedDeliveries = allDeliveries.filter(d => 
      (jcId && (d.job_card_id === jcId || d.job_card_id === jcNo)) ||
      (jcNo && (d.job_card_no === jcNo || d.job_card_no === jcId)) ||
      (recId && (d.invoice_no === recId || d.job_card_id === recId)) ||
      (recNo && (d.invoice_no === recNo || d.job_card_no === recNo))
    );

    const matchedFinalBills = allFinalBills.filter(b => 
      (jcId && (b.job_card_id === jcId || b.job_card_id === jcNo)) ||
      (jcNo && (b.job_card_no === jcNo || b.job_card_no === jcId)) ||
      (recId && b.id === recId) ||
      (recNo && (b.invoice_no === recNo || b.bill_no === recNo))
    );

    const matchedDraftBills = allDraftBills.filter(b => 
      (jcId && (b.job_card_id === jcId || b.job_card_id === jcNo)) ||
      (jcNo && (b.job_card_no === jcNo || b.job_card_no === jcId)) ||
      (recId && b.id === recId) ||
      (recNo && (b.draft_bill_no === recNo || b.invoice_no === recNo))
    );

    const matchedEstimates = allEstimates.filter(e => 
      (jcId && (e.job_card_id === jcId || e.job_card_id === jcNo)) ||
      (jcNo && (e.job_card_no === jcNo || e.job_card_no === jcId)) ||
      (recId && e.id === recId) ||
      (recNo && e.estimate_no === recNo)
    );

    // Latest delivery
    const delivery = matchedDeliveries[matchedDeliveries.length - 1] || null;

    // Stage 10: Vehicle Delivered
    const isDelivered = (delivery && (delivery.status === 'DELIVERED' || (delivery.gate_pass_no && delivery.gate_pass_no !== 'Pending Gate Pass'))) ||
                        (jc && (jc.status === 'DELIVERED' || (jc.status === 'CLOSED' && jc.gate_pass_no && jc.gate_pass_no !== 'Pending Gate Pass')));
    if (isDelivered) {
      return {
        stage: 10,
        code: 'VEHICLE_DELIVERED',
        label: 'Vehicle Delivered',
        badgeClass: 'badge-success',
        style: 'background: #10b981; color: #fff; font-weight: 700;'
      };
    }

    // Bills analysis:
    const revisedFinalBill = matchedFinalBills.filter(b => (b.is_revision || (b.invoice_no && b.invoice_no.includes('-R'))) && b.status !== 'CANCELLED').pop();
    const revisedDraftBill = matchedDraftBills.filter(b => (b.is_revision || (b.draft_bill_no && b.draft_bill_no.includes('-R')) || (b.invoice_no && b.invoice_no.includes('-R')))).pop();

    // Stage 9: Final bill revised -> Bill Revised (R1, R2, etc.)
    if (revisedFinalBill) {
      let revNum = revisedFinalBill.revision_no;
      if (!revNum && revisedFinalBill.invoice_no) {
        const m = revisedFinalBill.invoice_no.match(/-R(\d+)/i);
        if (m) revNum = m[1];
      }
      return {
        stage: 9,
        code: 'BILL_REVISED',
        label: `Bill Revised (R${revNum || 1})`,
        badgeClass: 'badge-primary',
        style: 'background: #6366f1; color: #fff; font-weight: 700;'
      };
    }
    if (revisedDraftBill && revisedDraftBill.status === 'REVISED_PAYMENT_PENDING') {
      let revNum = revisedDraftBill.revision_no;
      if (!revNum && (revisedDraftBill.draft_bill_no || revisedDraftBill.invoice_no)) {
        const m = (revisedDraftBill.draft_bill_no || revisedDraftBill.invoice_no).match(/-R(\d+)/i);
        if (m) revNum = m[1];
      }
      return {
        stage: 9,
        code: 'BILL_REVISED',
        label: `Bill Revised (R${revNum || 1})`,
        badgeClass: 'badge-primary',
        style: 'background: #6366f1; color: #fff; font-weight: 700;'
      };
    }

    // Stage 8: Cancelled bill reopened -> Bill Reopened
    if (revisedDraftBill && (revisedDraftBill.status === 'DRAFT' || revisedDraftBill.reopened_at)) {
      return {
        stage: 8,
        code: 'BILL_REOPENED',
        label: 'Bill Reopened',
        badgeClass: 'badge-warning',
        style: 'background: #f59e0b; color: #fff; font-weight: 700;'
      };
    }

    // Stage 7: Bill cancelled -> Bill Cancelled
    const latestBill = matchedFinalBills.slice().pop() || matchedDraftBills.slice().pop();
    if (latestBill && latestBill.status === 'CANCELLED') {
      return {
        stage: 7,
        code: 'BILL_CANCELLED',
        label: 'Bill Cancelled',
        badgeClass: 'badge-danger',
        style: 'background: #ef4444; color: #fff; font-weight: 700;'
      };
    }

    // Stage 6: Bill finalized -> Bill Final
    const activeFinalBill = matchedFinalBills.filter(b => b.status !== 'CANCELLED').pop();
    if (activeFinalBill || (latestBill && (latestBill.recordType === 'FINAL' || latestBill.status === 'FINALIZED' || latestBill.status === 'PAID' || latestBill.status === 'PARTIALLY_PAID'))) {
      return {
        stage: 6,
        code: 'BILL_FINAL',
        label: 'Bill Final',
        badgeClass: 'badge-success',
        style: 'background: #10b981; color: #fff; font-weight: 700;'
      };
    }

    // Stage 5: Bill created but not finalized -> Bill Draft
    const activeDraftBill = matchedDraftBills.filter(b => b.status === 'DRAFT').pop();
    if (activeDraftBill) {
      return {
        stage: 5,
        code: 'BILL_DRAFT',
        label: 'Bill Draft',
        badgeClass: 'badge-warning',
        style: 'background: #f59e0b; color: #fff; font-weight: 700;'
      };
    }

    // Estimates analysis:
    const activeEstimates = matchedEstimates.filter(e => e.status !== 'VOID');
    const latestEst = activeEstimates.slice().sort((a, b) => {
      const getRev = (x) => {
        if (typeof x.revision_no === 'number') return x.revision_no;
        const m = (x.estimate_no || '').match(/-R(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
      };
      return getRev(a) - getRev(b);
    }).pop();

    if (latestEst) {
      // Stage 4: Estimate submitted/completed -> Estimate Submitted
      if (latestEst.status === 'SUBMITTED' || latestEst.status === 'CUSTOMER_APPROVED' || latestEst.status === 'APPROVED' || latestEst.status === 'READY_FOR_APPROVAL' || latestEst.status === 'CONVERTED') {
        return {
          stage: 4,
          code: 'ESTIMATE_SUBMITTED',
          label: 'Estimate Submitted',
          badgeClass: 'badge-info',
          style: 'background: #3b82f6; color: #fff; font-weight: 700;'
        };
      }

      // Stage 3: Estimate revised -> Estimate Revised (R1, R2, etc.)
      const isEstRevision = latestEst.revision_no > 0 || (latestEst.estimate_no && latestEst.estimate_no.includes('-R')) || latestEst.previous_estimate_no;
      if (isEstRevision && latestEst.status === 'DRAFT') {
        let revNum = latestEst.revision_no;
        if (!revNum && latestEst.estimate_no) {
          const m = latestEst.estimate_no.match(/-R(\d+)/i);
          if (m) revNum = m[1];
        }
        return {
          stage: 3,
          code: 'ESTIMATE_REVISED',
          label: `Estimate Revised (R${revNum || 1})`,
          badgeClass: 'badge-primary',
          style: 'background: #6366f1; color: #fff; font-weight: 700;'
        };
      }

      // Stage 2: Estimate created but not submitted -> Estimate Draft
      if (latestEst.status === 'DRAFT') {
        return {
          stage: 2,
          code: 'ESTIMATE_DRAFT',
          label: 'Estimate Draft',
          badgeClass: 'badge-warning',
          style: 'background: #f59e0b; color: #fff; font-weight: 700;'
        };
      }
    }

    // Stage 1: Job Card created -> Job Card Created
    return {
      stage: 1,
      code: 'JOB_CARD_CREATED',
      label: 'Job Card Created',
      badgeClass: 'badge-subtle',
      style: 'background: rgba(255, 255, 255, 0.08); color: var(--text-primary); border: 1px solid var(--border-subtle); font-weight: 600;'
    };
  }
};

const assert = require('assert');

// 1. Job Card Created
const jc = { id: 'JC-1', job_card_no: 'JC/001', service_type: 'General', date: '2026-10-29' };
window.DB.data.jobCards = [jc];
let st = BillingModule.getStandardizedTransactionStatus(jc);
console.log('Stage 1:', st.label);
assert.strictEqual(st.label, 'Job Card Created');

// 2. Estimate created but not submitted -> Estimate Draft
const est = { id: 'EST-1', estimate_no: 'EST-001', job_card_id: 'JC-1', job_card_no: 'JC/001', status: 'DRAFT' };
window.DB.data.billingEstimates = [est];
st = BillingModule.getStandardizedTransactionStatus(jc);
console.log('Stage 2:', st.label);
assert.strictEqual(st.label, 'Estimate Draft');

// 3. Estimate revised -> Estimate Revised (R1)
const estR1 = { id: 'EST-2', estimate_no: 'EST-001-R1', revision_no: 1, job_card_id: 'JC-1', job_card_no: 'JC/001', status: 'DRAFT', previous_estimate_no: 'EST-001' };
est.status = 'REVISED';
window.DB.data.billingEstimates = [est, estR1];
st = BillingModule.getStandardizedTransactionStatus(jc);
console.log('Stage 3:', st.label);
assert.strictEqual(st.label, 'Estimate Revised (R1)');

// 4. Estimate submitted/completed -> Estimate Submitted
estR1.status = 'SUBMITTED';
st = BillingModule.getStandardizedTransactionStatus(jc);
console.log('Stage 4:', st.label);
assert.strictEqual(st.label, 'Estimate Submitted');

// 5. Bill created but not finalized -> Bill Draft
const db = { id: 'DB-1', draft_bill_no: 'DB-001', job_card_id: 'JC-1', job_card_no: 'JC/001', estimate_id: 'EST-2', status: 'DRAFT' };
window.DB.data.draftBills = [db];
st = BillingModule.getStandardizedTransactionStatus(jc);
console.log('Stage 5:', st.label);
assert.strictEqual(st.label, 'Bill Draft');

// 6. Bill finalized -> Bill Final
const fb = { id: 'INV-1', invoice_no: 'INV-001', job_card_id: 'JC-1', job_card_no: 'JC/001', status: 'FINALIZED', net_payable: 1000, amount_paid: 0, balance_amount: 1000 };
db.status = 'FINALIZED';
window.DB.data.finalBills = [fb];
st = BillingModule.getStandardizedTransactionStatus(jc);
console.log('Stage 6:', st.label);
assert.strictEqual(st.label, 'Bill Final');

// 7. Bill cancelled -> Bill Cancelled
fb.status = 'CANCELLED';
st = BillingModule.getStandardizedTransactionStatus(jc);
console.log('Stage 7:', st.label);
assert.strictEqual(st.label, 'Bill Cancelled');

// 8. Cancelled bill reopened -> Bill Reopened
const reopenedDb = { id: 'DB-2', draft_bill_no: 'INV-001-R1', is_revision: true, revision_no: 1, job_card_id: 'JC-1', job_card_no: 'JC/001', status: 'DRAFT', reopened_at: '2026-10-29T10:00:00.000Z' };
window.DB.data.draftBills.push(reopenedDb);
st = BillingModule.getStandardizedTransactionStatus(jc);
console.log('Stage 8:', st.label);
assert.strictEqual(st.label, 'Bill Reopened');

// 9. Final bill revised -> Bill Revised (R1)
const revisedFb = { id: 'INV-2', invoice_no: 'INV-001-R1', is_revision: true, revision_no: 1, job_card_id: 'JC-1', job_card_no: 'JC/001', status: 'REVISED_PAYMENT_PENDING' };
window.DB.data.finalBills.push(revisedFb);
st = BillingModule.getStandardizedTransactionStatus(jc);
console.log('Stage 9:', st.label);
assert.strictEqual(st.label, 'Bill Revised (R1)');

// 10. Customer's vehicle delivered -> Vehicle Delivered
const del = { id: 'DEL-1', job_card_id: 'JC-1', job_card_no: 'JC/001', gate_pass_no: 'GP-001', status: 'DELIVERED' };
window.DB.data.vehicleDeliveries = [del];
st = BillingModule.getStandardizedTransactionStatus(jc);
console.log('Stage 10:', st.label);
assert.strictEqual(st.label, 'Vehicle Delivered');

// Cross-Screen synchronization check: querying by est, bill, or delivery returns the SAME status!
assert.strictEqual(BillingModule.getStandardizedTransactionStatus(estR1).label, 'Vehicle Delivered');
assert.strictEqual(BillingModule.getStandardizedTransactionStatus(revisedFb).label, 'Vehicle Delivered');
assert.strictEqual(BillingModule.getStandardizedTransactionStatus(del).label, 'Vehicle Delivered');
console.log('Cross-Screen synchronization verified: querying by Job Card, Estimate, Bill, or Delivery returns identical synchronized status!');

console.log('\nAll 10 stages verified successfully!');
