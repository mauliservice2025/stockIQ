const fs = require('fs');
const path = require('path');

const billingPath = path.join(__dirname, '../js/modules/billing.js');
let code = fs.readFileSync(billingPath, 'utf8');

// 1. Add getStatusWiseActionButton and getStatusWiseActiveBannerButton methods to BillingModule
const helperMethods = `  getStatusWiseActionButton(jc, isModalContext = true) {
    if (!jc) return '';
    const st = (jc.status || 'OPEN').toUpperCase();
    const isBilledNoEst = this.isJobCardBilledWithoutEstimate ? this.isJobCardBilledWithoutEstimate(jc) : false;
    const closePrefix = isModalContext ? 'if (window.State && typeof window.State.closeModal === "function") window.State.closeModal(); ' : '';

    const allEstimates = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('billingEstimates') || []) : [];
    const hasEstimate = allEstimates.some(e => 
      (e.job_card_id && (e.job_card_id === jc.id || e.job_card_id === jc.job_card_no)) ||
      (jc.estimate_id && e.id === jc.estimate_id) ||
      (jc.estimate_no && e.estimate_no === jc.estimate_no)
    );

    // 1. ESTIMATE_PENDING / OPEN: Next step is Estimate
    if (st === 'ESTIMATE_PENDING' || st === 'OPEN') {
      if (isBilledNoEst) {
        return \`<button type="button" class="btn btn-primary btn-sm" onclick="\${closePrefix}window.BillingModule.actionDraftBillFromJobCard('\${jc.id}');" style="height: 22px; font-size: 10px; padding: 1px 8px; font-weight: 700; white-space: nowrap;" title="Billed without estimate - View/Edit Bill">🧾 Bill</button>\`;
      }
      return \`<button type="button" class="btn btn-warning btn-sm" onclick="\${closePrefix}window.BillingModule.actionEstimateFromJobCard('\${jc.id}');" style="height: 22px; font-size: 10px; padding: 1px 8px; font-weight: 700; white-space: nowrap; background: #f59e0b; border-color: #d97706; color: #111827;" title="Create or Open Estimate for \${jc.job_card_no || jc.id}">📝 Estimate</button>\`;
    }

    // 2. ESTIMATE_CREATED / SUBMITTED / PENDING_APPROVAL: Estimate exists, show Estimate option
    if (st === 'ESTIMATE_CREATED' || st === 'SUBMITTED' || st === 'PENDING_APPROVAL') {
      return \`<button type="button" class="btn btn-warning btn-sm" onclick="\${closePrefix}window.BillingModule.viewEstimateForJobCard('\${jc.id}');" style="height: 22px; font-size: 10px; padding: 1px 8px; font-weight: 700; white-space: nowrap; background: #f59e0b; border-color: #d97706; color: #111827;" title="View Estimate for \${jc.job_card_no || jc.id}">📝 Estimate</button>\`;
    }

    // 3. READY_FOR_BILLING / ESTIMATE_APPROVED / PARTS_ISSUED / PARTS_RESERVED: Show Billing option
    if (st === 'READY_FOR_BILLING' || st === 'ESTIMATE_APPROVED' || st === 'PARTS_ISSUED' || st === 'PARTS_RESERVED') {
      return \`<button type="button" class="btn btn-primary btn-sm" onclick="\${closePrefix}window.BillingModule.actionDraftBillFromJobCard('\${jc.id}');" style="height: 22px; font-size: 10px; padding: 1px 8px; font-weight: 700; white-space: nowrap;" title="Generate Customer Bill for \${jc.job_card_no || jc.id}">🧾 Bill</button>\`;
    }

    // 4. BILLED / PARTIALLY_PAID: Show View Bill / Settle Bill option
    if (st === 'BILLED' || st === 'PARTIALLY_PAID') {
      return \`<button type="button" class="btn btn-sm" onclick="\${closePrefix}window.BillingModule.viewBillForJobCard('\${jc.id}');" style="height: 22px; font-size: 10px; padding: 1px 8px; font-weight: 700; white-space: nowrap; background: #7c3aed; border-color: #6d28d9; color: white;" title="View and Settle Bill for \${jc.job_card_no || jc.id}">📑 View Bill</button>\`;
    }

    // 5. READY_FOR_DELIVERY: Show Gate Pass option
    if (st === 'READY_FOR_DELIVERY') {
      return \`<button type="button" class="btn btn-info btn-sm" onclick="\${closePrefix}window.BillingModule.showNewGatePassModal('\${jc.id}');" style="height: 22px; font-size: 10px; padding: 1px 8px; font-weight: 700; white-space: nowrap; background: #06b6d4; border-color: #0891b2; color: white;" title="Issue Gate Pass for \${jc.job_card_no || jc.id}">🛵 Gate Pass</button>\`;
    }

    // 6. DELIVERED / CLOSED: Completed, show View JC
    if (st === 'DELIVERED' || st === 'CLOSED') {
      return \`<button type="button" class="btn btn-secondary btn-sm" onclick="\${closePrefix}window.BillingModule.viewJobCard('\${jc.id}');" style="height: 22px; font-size: 10px; padding: 1px 8px; font-weight: 600; white-space: nowrap;" title="View Full Job Card \${jc.job_card_no || jc.id}">🔍 View JC</button>\`;
    }

    // Fallback: if hasEstimate show Estimate, else View JC
    if (hasEstimate) {
      return \`<button type="button" class="btn btn-warning btn-sm" onclick="\${closePrefix}window.BillingModule.viewEstimateForJobCard('\${jc.id}');" style="height: 22px; font-size: 10px; padding: 1px 8px; font-weight: 700; white-space: nowrap; background: #f59e0b; border-color: #d97706; color: #111827;" title="View Estimate">📝 Estimate</button>\`;
    }
    return \`<button type="button" class="btn btn-secondary btn-sm" onclick="\${closePrefix}window.BillingModule.viewJobCard('\${jc.id}');" style="height: 22px; font-size: 10px; padding: 1px 8px; font-weight: 600; white-space: nowrap;">🔍 View JC</button>\`;
  },

  getStatusWiseActiveBannerButton(jc) {
    if (!jc) return '';
    const st = (jc.status || 'OPEN').toUpperCase();
    const isBilledNoEst = this.isJobCardBilledWithoutEstimate ? this.isJobCardBilledWithoutEstimate(jc) : false;

    if (st === 'ESTIMATE_PENDING' || st === 'OPEN') {
      if (isBilledNoEst) {
        return \`<button type="button" class="btn btn-primary btn-sm" style="font-size: 10.5px; padding: 4px 10px; font-weight: 700; white-space: nowrap;" onclick="if (window.State && typeof window.State.closeModal === 'function') window.State.closeModal(); window.BillingModule.actionDraftBillFromJobCard('\${jc.id}');">🧾 Go to Billing ↗</button>\`;
      }
      return \`<button type="button" class="btn btn-warning btn-sm" style="font-size: 10.5px; padding: 4px 10px; font-weight: 700; white-space: nowrap; background: #f59e0b; border-color: #d97706; color: #111827;" onclick="if (window.State && typeof window.State.closeModal === 'function') window.State.closeModal(); window.BillingModule.actionEstimateFromJobCard('\${jc.id}');">📝 Open Estimate ↗</button>\`;
    }

    if (st === 'ESTIMATE_CREATED' || st === 'SUBMITTED' || st === 'PENDING_APPROVAL') {
      return \`<button type="button" class="btn btn-warning btn-sm" style="font-size: 10.5px; padding: 4px 10px; font-weight: 700; white-space: nowrap; background: #f59e0b; border-color: #d97706; color: #111827;" onclick="if (window.State && typeof window.State.closeModal === 'function') window.State.closeModal(); window.BillingModule.viewEstimateForJobCard('\${jc.id}');">📝 View Estimate ↗</button>\`;
    }

    if (st === 'READY_FOR_BILLING' || st === 'ESTIMATE_APPROVED' || st === 'PARTS_ISSUED' || st === 'PARTS_RESERVED') {
      return \`<button type="button" class="btn btn-primary btn-sm" style="font-size: 10.5px; padding: 4px 10px; font-weight: 700; white-space: nowrap;" onclick="if (window.State && typeof window.State.closeModal === 'function') window.State.closeModal(); window.BillingModule.actionDraftBillFromJobCard('\${jc.id}');">🧾 Go to Billing ↗</button>\`;
    }

    if (st === 'BILLED' || st === 'PARTIALLY_PAID') {
      return \`<button type="button" class="btn btn-sm" style="font-size: 10.5px; padding: 4px 10px; font-weight: 700; white-space: nowrap; background: #7c3aed; border-color: #6d28d9; color: white;" onclick="if (window.State && typeof window.State.closeModal === 'function') window.State.closeModal(); window.BillingModule.viewBillForJobCard('\${jc.id}');">📑 Settle Bill ↗</button>\`;
    }

    if (st === 'READY_FOR_DELIVERY') {
      return \`<button type="button" class="btn btn-info btn-sm" style="font-size: 10.5px; padding: 4px 10px; font-weight: 700; white-space: nowrap; background: #06b6d4; border-color: #0891b2; color: white;" onclick="if (window.State && typeof window.State.closeModal === 'function') window.State.closeModal(); window.BillingModule.showNewGatePassModal('\${jc.id}');">🛵 Issue Gate Pass ↗</button>\`;
    }

    return '';
  },
`;

const toggleHistoryTarget = '  toggleHistoryTableCollapse() {';
if (!code.includes(toggleHistoryTarget)) {
  console.error('toggleHistoryTarget not found!');
  process.exit(1);
}
code = code.replace(toggleHistoryTarget, helperMethods + '\n' + toggleHistoryTarget);

// 2. Update actionEstimateFromJobCard to close modal
const actionEstimateOld = `  actionEstimateFromJobCard(jcId) {
    if (this.isJobCardBilledWithoutEstimate(jcId)) {`;
const actionEstimateNew = `  actionEstimateFromJobCard(jcId) {
    if (window.State && typeof window.State.closeModal === 'function') {
      window.State.closeModal();
    }
    if (this.isJobCardBilledWithoutEstimate(jcId)) {`;
if (!code.includes(actionEstimateOld)) {
  console.error('actionEstimateOld not found!');
  process.exit(1);
}
code = code.replace(actionEstimateOld, actionEstimateNew);

// 3. Update Lock Alert Banner button in showNewJobCardModal / onVehicleRegInput
const oldLockBanner = `            <div style="display: flex; gap: 6px; flex-shrink: 0;">
              <button type="button" class="btn btn-danger btn-sm" style="font-size: 10.5px; padding: 4px 10px; font-weight: 700; white-space: nowrap;" onclick="window.BillingModule.viewJobCard('\${activeUnfinalizedJc.id}'); window.State.closeModal();">
                View Active JC ↗
              </button>
            </div>`;
const newLockBanner = `            <div style="display: flex; gap: 6px; flex-shrink: 0; align-items: center;">
              \${this.getStatusWiseActiveBannerButton(activeUnfinalizedJc)}
              <button type="button" class="btn btn-danger btn-sm" style="font-size: 10.5px; padding: 4px 10px; font-weight: 700; white-space: nowrap;" onclick="if (window.State && typeof window.State.closeModal === 'function') window.State.closeModal(); window.BillingModule.viewJobCard('\${activeUnfinalizedJc.id}');">
                View Active JC ↗
              </button>
            </div>`;

if (!code.includes(oldLockBanner)) {
  console.error('oldLockBanner not found!');
  process.exit(1);
}
code = code.replace(oldLockBanner, newLockBanner);

// 4. Update Previous Service History table row details button
const oldHistoryBtn = `          <td style="padding: 5px 8px; text-align: center; white-space: nowrap;">
            <button type="button" id="past-jc-btn-\${jc.id}" class="btn btn-secondary btn-sm" onclick="window.BillingModule.togglePastJcDetailsRow('\${jc.id}')" style="height: 20px; font-size: 9.5px; padding: 0 6px;" title="View Parts & Labour Summary">🔍 View</button>
          </td>`;
const newHistoryBtn = `          <td style="padding: 4px 8px; text-align: center; white-space: nowrap;">
            <div style="display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
              \${this.getStatusWiseActionButton(jc, true)}
              <button type="button" id="past-jc-btn-\${jc.id}" class="btn btn-secondary btn-sm" onclick="window.BillingModule.togglePastJcDetailsRow('\${jc.id}')" style="height: 22px; font-size: 9.5px; padding: 0 5px;" title="View Parts & Labour Summary">🔍</button>
            </div>
          </td>`;

if (!code.includes(oldHistoryBtn)) {
  console.error('oldHistoryBtn not found!');
  process.exit(1);
}
code = code.replace(oldHistoryBtn, newHistoryBtn);

// 5. Update Previous Service History table header Details -> Action / Details
const oldTh = '<th style="padding: 4px 8px; font-weight: 600; text-align: center;">Details</th>';
const newTh = '<th style="padding: 4px 8px; font-weight: 600; text-align: center;">Action / Details</th>';
if (!code.includes(oldTh)) {
  console.error('oldTh not found!');
  process.exit(1);
}
code = code.replace(oldTh, newTh);

// 6. Update accordion row footer button in Previous Service History
const oldAccordionFooter = `            <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
              <button type="button" class="btn btn-primary btn-sm" onclick="window.BillingModule.viewJobCard('\${jc.id}')" style="height: 20px; font-size: 10px; padding: 0 8px;">Open Full Job Card Record ↗</button>
            </div>`;
const newAccordionFooter = `            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 6px; margin-top: 6px;">
              \${this.getStatusWiseActionButton(jc, true)}
              <button type="button" class="btn btn-secondary btn-sm" onclick="if (window.State && typeof window.State.closeModal === 'function') window.State.closeModal(); window.BillingModule.viewJobCard('\${jc.id}')" style="height: 22px; font-size: 10px; padding: 0 8px;">Open Full Job Card Record ↗</button>
            </div>`;

if (!code.includes(oldAccordionFooter)) {
  console.error('oldAccordionFooter not found!');
  process.exit(1);
}
code = code.replace(oldAccordionFooter, newAccordionFooter);

// Verify syntax
try {
  new Function(code);
  console.log('Syntax check passed!');
} catch (err) {
  console.error('Syntax error:', err);
  process.exit(1);
}

fs.writeFileSync(billingPath, code, 'utf8');
console.log('Successfully updated billing.js with status-wise options!');
