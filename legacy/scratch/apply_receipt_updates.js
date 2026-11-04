const fs = require('fs');
const path = require('path');

const billingPath = path.resolve('js/modules/billing.js');
let code = fs.readFileSync(billingPath, 'utf8');

// 1. In renderBillSearchResults (Search Bill modal table action column):
// Add Receipt button next to print invoice button
const searchBillTarget = `                      <button \n                        type="button" \n                        class="btn btn-ghost btn-sm" \n                        style="font-size: 11px; padding: 3px 6px;"\n                        onclick="window.BillingModule.printInvoice('\${b.id}')"\n                        title="Print Invoice"\n                      >\n                        🖨️\n                      </button>`;

const searchBillReplacement = `                      <button \n                        type="button" \n                        class="btn btn-ghost btn-sm" \n                        style="font-size: 11px; padding: 3px 6px;"\n                        onclick="window.BillingModule.printInvoice('\${b.id}')"\n                        title="Print Invoice"\n                      >\n                        🖨️\n                      </button>\n                      \${(b.amount_paid > 0) ? \`\n                        <button \n                          type="button" \n                          class="btn btn-ghost btn-sm" \n                          style="font-size: 11px; padding: 3px 6px; color: #10b981;" \n                          onclick="window.BillingModule.showBillReceiptsModal('\${b.id}')" \n                          title="View & Print Payment Receipts"\n                        >\n                          🧾\n                        </button>\n                      \` : ''}`;

if (!code.includes(searchBillTarget)) {
  console.error('Failed to find searchBillTarget');
  process.exit(1);
}
code = code.replace(searchBillTarget, searchBillReplacement);
console.log('✓ 1. Search Bill action column updated with Receipt button');

// 2. In renderFinalBillsTab Card View action row:
const cardViewTarget = `                      <button type="button" class="btn btn-sm btn-icon" onclick="window.BillingModule.printInvoice('\${b.id}')" style="font-size: 11px; padding: 4px 6px;" title="Print Tax Invoice">\n                        🖨️\n                      </button>`;

const cardViewReplacement = `                      <button type="button" class="btn btn-sm btn-icon" onclick="window.BillingModule.printInvoice('\${b.id}')" style="font-size: 11px; padding: 4px 6px;" title="Print Tax Invoice">\n                        🖨️\n                      </button>\n                      \${(paid > 0) ? \`\n                        <button type="button" class="btn btn-sm btn-ghost" onclick="window.BillingModule.showBillReceiptsModal('\${b.id}')" style="font-size: 11px; padding: 4px 8px; color: #10b981;" title="View & Print Payment Receipts">\n                          🧾 Receipts\n                        </button>\n                      \` : ''}`;

if (!code.includes(cardViewTarget)) {
  console.error('Failed to find cardViewTarget');
  process.exit(1);
}
code = code.replace(cardViewTarget, cardViewReplacement);
console.log('✓ 2. Card View updated with Receipts button');

// 3. In renderFinalBillsTab Table View action column:
const tableViewTarget = `                          <button type="button" class="btn btn-sm btn-icon" title="Print Tax Invoice" onclick="window.BillingModule.printInvoice('\${b.id}')" style="padding: 3px 6px;">\n                            🖨️\n                          </button>`;

const tableViewReplacement = `                          <button type="button" class="btn btn-sm btn-icon" title="Print Tax Invoice" onclick="window.BillingModule.printInvoice('\${b.id}')" style="padding: 3px 6px;">\n                            🖨️\n                          </button>\n                          \${(paid > 0) ? \`\n                            <button type="button" class="btn btn-sm btn-ghost" title="View & Print Payment Receipts" onclick="window.BillingModule.showBillReceiptsModal('\${b.id}')" style="padding: 3px 6px; color: #10b981;">\n                              🧾\n                            </button>\n                          \` : ''}`;

if (!code.includes(tableViewTarget)) {
  console.error('Failed to find tableViewTarget');
  process.exit(1);
}
code = code.replace(tableViewTarget, tableViewReplacement);
console.log('✓ 3. Table View updated with Receipt button');

// 4. In viewBillDetails footer:
const viewDetailsTarget = `          <button type="button" class="btn btn-secondary btn-sm" onclick="window.BillingModule.printInvoice('\${b.id}');">\n            🖨️ Print Tax Invoice\n          </button>`;

const viewDetailsReplacement = `          \${(paid > 0) ? \`\n            <button type="button" class="btn btn-secondary btn-sm" style="color: #10b981; border: 1px solid #10b981;" onclick="window.BillingModule.showBillReceiptsModal('\${b.id}');">\n              🧾 Payment Receipts\n            </button>\n          \` : ''}\n          <button type="button" class="btn btn-secondary btn-sm" onclick="window.BillingModule.printInvoice('\${b.id}');">\n            🖨️ Print Tax Invoice\n          </button>`;

if (!code.includes(viewDetailsTarget)) {
  console.error('Failed to find viewDetailsTarget');
  process.exit(1);
}
code = code.replace(viewDetailsTarget, viewDetailsReplacement);
console.log('✓ 4. viewBillDetails updated with Payment Receipts button');

// 5. In submitPayment(invId):
// Replace submitPayment implementation to fully comply with Document Number Series Master,
// unique sequential receipt numbers, previous/remaining outstanding balance tracking,
// DB persistence in 'paymentReceipts', and immediate success dialog with print option.
const submitPaymentTarget = `  submitPayment(invId) {
    const inv = this.resolveInvoiceOrBill(invId);
    if (!inv) {
      window.State.showToast('Invoice not found for payment processing.', 'danger');
      return;
    }

    const mode = (document.getElementById('pay-mode') && document.getElementById('pay-mode').value) || 'Cash';
    const amount = Number(document.getElementById('pay-amount') && document.getElementById('pay-amount').value) || 0;
    const ref = (document.getElementById('pay-ref') && document.getElementById('pay-ref').value.trim()) || \`\${mode} Payment\`;

    if (amount <= 0) {
      window.State.showToast('Payment amount must be greater than zero.', 'warning');
      return;
    }

    const netPayable = Number(inv.net_payable !== undefined ? inv.net_payable : (inv.grand_total || 0));
    const previousPaid = Number(inv.amount_paid !== undefined ? inv.amount_paid : (inv.amount_received || 0));
    const newPaid = previousPaid + amount;
    const newBalance = Math.max(0, netPayable - newPaid);
    const newStatus = newBalance <= 0 ? 'PAID' : (newPaid > 0 ? 'PARTIALLY_PAID' : inv.status);

    const receiptNo = \`RCP/MSC1/\${new Date().getFullYear()}/\${String(Date.now()).slice(-6)}\`;

    inv.amount_paid = newPaid;
    inv.amount_received = newPaid;
    inv.balance_amount = newBalance;
    inv.balance_due = newBalance;
    inv.payment_mode = mode;
    inv.payment_ref = ref;
    inv.last_receipt_no = receiptNo;
    inv.payment_date = new Date().toISOString().split('T')[0];
    inv.status = newStatus;
    inv.payment_history = inv.payment_history || [];
    inv.payment_history.push({
      receipt_no: receiptNo,
      amount: amount,
      mode: mode,
      reference: ref,
      date: new Date().toISOString(),
      balance_remaining: newBalance
    });

    window.DB.upsert('finalBills', inv);

    const draftId = inv.draft_bill_id || (inv.id && inv.id.startsWith('INV-') ? inv.id.replace('INV-', 'DBILL-') : null);
    if (draftId) {
      const draft = window.DB.getById('draftBills', draftId);
      if (draft) {
        draft.amount_paid = newPaid;
        draft.amount_received = newPaid;
        draft.balance_amount = newBalance;
        draft.balance_due = newBalance;
        draft.payment_mode = mode;
        draft.payment_ref = ref;
        draft.last_receipt_no = receiptNo;
        draft.status = newStatus;
        window.DB.upsert('draftBills', draft);
      }
    }

    const allJcs = window.DB.getAll('jobCards') || [];
    let jc = (inv.job_card_id && window.DB.getById('jobCards', inv.job_card_id)) ||
             allJcs.find(j => 
               (inv.job_card_id && (j.id === inv.job_card_id || j.job_card_no === inv.job_card_id)) ||
               (inv.job_card_no && (j.job_card_no === inv.job_card_no || j.id === inv.job_card_no)) ||
               (inv.vehicle_reg_no && j.vehicle_reg_no === inv.vehicle_reg_no && j.status !== 'CLOSED')
             ) || null;

    if (jc) {
      if (newBalance <= 0) {
        jc.payment_status = 'PAID';
        if (jc.status !== 'CLOSED' && jc.status !== 'DELIVERED') {
          jc.status = 'READY_FOR_DELIVERY';
        }
      } else {
        if (jc.status !== 'CLOSED' && jc.status !== 'DELIVERED') {
          jc.status = 'BILLED';
        }
      }
      jc.invoice_no = inv.invoice_no || inv.bill_no || jc.invoice_no;
      window.DB.upsert('jobCards', jc);
      window.DB.emitChange('jobCards');
    }

    // Auto-sync into Vehicle Delivery Queue for delivery handover
    if (typeof this.ensureVehicleDeliveryEntry === 'function') {
      this.ensureVehicleDeliveryEntry(inv, jc, inv.invoice_no || inv.bill_no);
    }

    window.DB.emitChange('finalBills');
    window.DB.emitChange('draftBills');
    window.State.closeModal();
    const settledToastMsg = newBalance <= 0
      ? \`Payment of ₹\${amount.toFixed(2)} settled in full! Receipt #\${receiptNo} generated. Vehicle ready for delivery.\`
      : \`Payment of ₹\${amount.toFixed(2)} recorded! Receipt #\${receiptNo}. Remaining Balance: ₹\${newBalance.toFixed(2)}\`;
    window.State.showToast(settledToastMsg, 'success');
    this.refresh();
  },`;

const submitPaymentReplacement = `  submitPayment(invId) {
    const inv = this.resolveInvoiceOrBill(invId);
    if (!inv) {
      window.State.showToast('Invoice not found for payment processing.', 'danger');
      return;
    }

    const mode = (document.getElementById('pay-mode') && document.getElementById('pay-mode').value) || 'Cash';
    const amount = Number(document.getElementById('pay-amount') && document.getElementById('pay-amount').value) || 0;
    const ref = (document.getElementById('pay-ref') && document.getElementById('pay-ref').value.trim()) || \`\${mode} Payment\`;

    if (amount <= 0) {
      window.State.showToast('Payment amount must be greater than zero.', 'warning');
      return;
    }

    const facilityId = inv.branch_id || (window.State && window.State.currentPlantId) || 'PLANT-01';
    const netPayable = Number(inv.net_payable !== undefined ? inv.net_payable : (inv.grand_total || 0));
    const previousPaid = Number(inv.amount_paid !== undefined ? inv.amount_paid : (inv.amount_received || 0));
    const previousBalance = Math.max(0, netPayable - previousPaid);
    const newPaid = previousPaid + amount;
    const newBalance = Math.max(0, netPayable - newPaid);
    const newStatus = newBalance <= 0 ? 'PAID' : (newPaid > 0 ? 'PARTIALLY_PAID' : inv.status);

    // Generate unique sequential receipt number configured through Document Number Series Master
    const receiptNo = this.generateReceiptNumber(facilityId);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const collectedBy = (window.State && window.State.currentUser && (window.State.currentUser.name || window.State.currentUser.full_name)) || 'Santosh Shinde (Cashier)';

    // Find linked job card
    const allJcs = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('jobCards') || []) : [];
    let jc = (inv.job_card_id && window.DB.getById('jobCards', inv.job_card_id)) ||
             allJcs.find(j => 
               (inv.job_card_id && (j.id === inv.job_card_id || j.job_card_no === inv.job_card_id)) ||
               (inv.job_card_no && (j.job_card_no === inv.job_card_no || j.id === inv.job_card_no)) ||
               (inv.vehicle_reg_no && j.vehicle_reg_no === inv.vehicle_reg_no && j.status !== 'CLOSED')
             ) || null;

    // Build Receipt Audit Record (BRD Section 2 #5 & #7)
    const receiptRecord = {
      id: \`RCP-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
      receipt_no: receiptNo,
      bill_id: inv.id,
      invoice_no: inv.invoice_no || inv.bill_no || inv.draft_bill_no || inv.id,
      job_card_id: inv.job_card_id || (jc && jc.id) || '',
      job_card_no: inv.job_card_no || (jc && jc.job_card_no) || '--',
      estimate_no: inv.estimate_no || inv.source_estimate_ref || '--',
      customer_cin: inv.customer_cin || inv.cin_number || inv.cin || '--',
      customer_name: inv.customer_name || 'Customer',
      customer_mobile: inv.customer_mobile || '',
      customer_address: inv.customer_address || 'Pune, Maharashtra',
      vehicle_reg_no: inv.vehicle_reg_no || '--',
      vehicle_model: inv.vehicle_model || '',
      payment_date: dateStr,
      payment_time: timeStr,
      payment_mode: mode,
      payment_ref: ref,
      amount_paid: amount,
      previous_outstanding: previousBalance,
      remaining_outstanding: newBalance,
      total_bill_amount: netPayable,
      total_paid_so_far: newPaid,
      collected_by: collectedBy,
      facility_id: facilityId,
      facility_name: facilityId === 'PLANT-02' ? 'Mauli Service Center 2 (MSC2)' : 'Mauli Service Center 1 (MSC1)',
      status: 'ACTIVE',
      created_at: now.toISOString()
    };

    // Store in window.DB paymentReceipts collection
    if (window.DB) {
      if (typeof window.DB.upsert === 'function') {
        window.DB.upsert('paymentReceipts', receiptRecord);
      } else {
        window.DB.data = window.DB.data || {};
        window.DB.data.paymentReceipts = window.DB.data.paymentReceipts || [];
        window.DB.data.paymentReceipts.push(receiptRecord);
      }
    }

    inv.amount_paid = newPaid;
    inv.amount_received = newPaid;
    inv.balance_amount = newBalance;
    inv.balance_due = newBalance;
    inv.payment_mode = mode;
    inv.payment_ref = ref;
    inv.last_receipt_no = receiptNo;
    inv.payment_date = dateStr;
    inv.status = newStatus;
    inv.payment_history = inv.payment_history || [];
    inv.payment_history.push({
      receipt_id: receiptRecord.id,
      receipt_no: receiptNo,
      amount: amount,
      mode: mode,
      reference: ref,
      date: dateStr,
      time: timeStr,
      previous_outstanding: previousBalance,
      balance_remaining: newBalance,
      collected_by: collectedBy
    });

    window.DB.upsert('finalBills', inv);

    const draftId = inv.draft_bill_id || (inv.id && inv.id.startsWith('INV-') ? inv.id.replace('INV-', 'DBILL-') : null);
    if (draftId) {
      const draft = window.DB.getById('draftBills', draftId);
      if (draft) {
        draft.amount_paid = newPaid;
        draft.amount_received = newPaid;
        draft.balance_amount = newBalance;
        draft.balance_due = newBalance;
        draft.payment_mode = mode;
        draft.payment_ref = ref;
        draft.last_receipt_no = receiptNo;
        draft.status = newStatus;
        window.DB.upsert('draftBills', draft);
      }
    }

    if (jc) {
      if (newBalance <= 0) {
        jc.payment_status = 'PAID';
        if (jc.status !== 'CLOSED' && jc.status !== 'DELIVERED') {
          jc.status = 'READY_FOR_DELIVERY';
        }
      } else {
        if (jc.status !== 'CLOSED' && jc.status !== 'DELIVERED') {
          jc.status = 'BILLED';
        }
      }
      jc.invoice_no = inv.invoice_no || inv.bill_no || jc.invoice_no;
      window.DB.upsert('jobCards', jc);
      window.DB.emitChange('jobCards');
    }

    // Auto-sync into Vehicle Delivery Queue for delivery handover
    if (typeof this.ensureVehicleDeliveryEntry === 'function') {
      this.ensureVehicleDeliveryEntry(inv, jc, inv.invoice_no || inv.bill_no);
    }

    window.DB.emitChange('finalBills');
    window.DB.emitChange('draftBills');
    if (window.DB.emitChange) window.DB.emitChange('paymentReceipts');
    if (window.DB.saveData) window.DB.saveData();

    window.State.closeModal();

    const settledToastMsg = newBalance <= 0
      ? \`Payment of ₹\${amount.toFixed(2)} settled in full! Receipt #\${receiptNo} generated. Vehicle ready for delivery.\`
      : \`Payment of ₹\${amount.toFixed(2)} recorded! Receipt #\${receiptNo}. Remaining Balance: ₹\${newBalance.toFixed(2)}\`;
    window.State.showToast(settledToastMsg, 'success');

    // Immediately present the Payment Collection & Receipt summary modal with Print option (BRD Functional Req 1)
    this.showPaymentSuccessModal(receiptRecord, inv);
    this.refresh();
  },`;

if (!code.includes(submitPaymentTarget)) {
  console.error('Failed to find submitPaymentTarget');
  process.exit(1);
}
code = code.replace(submitPaymentTarget, submitPaymentReplacement);
console.log('✓ 5. submitPayment updated with Doc Series generation & receipt recording');

// 6. Now add the helper methods:
// generateReceiptNumber, numberToWords, showPaymentSuccessModal, printPaymentReceipt,
// showBillReceiptsModal, downloadReceiptHtml
const helperMethods = `
  // =========================================================================
  // PAYMENT RECEIPT ENGINE (BRD: PAYMENT RECEIPT GENERATION & PRINTING)
  // Configured via Document Number Series Master ('RCP')
  // =========================================================================

  generateReceiptNumber(facilityId = 'PLANT-01') {
    if (window.DocSeriesMasterModule && typeof window.DocSeriesMasterModule.generateNextNumber === 'function') {
      const res = window.DocSeriesMasterModule.generateNextNumber('RCP', facilityId);
      if (res && res.success && res.docNumber) {
        return res.docNumber;
      }
    }
    // High-reliability fallback sequence
    const receipts = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('paymentReceipts') || []) : [];
    const count = receipts.length + 1;
    const branchCode = facilityId === 'PLANT-02' ? 'MSC2' : 'MSC1';
    const year = new Date().getFullYear();
    return \`RCP/\${branchCode}/\${year}/\${String(count).padStart(6, '0')}\`;
  },

  numberToWords(num) {
    if (isNaN(num) || num === null || num === undefined) return '';
    const n = Math.floor(Math.abs(Number(num)));
    if (n === 0) return 'Zero Rupees Only';

    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (val) => {
      let str = '';
      if (val > 99) {
        str += a[Math.floor(val / 100)] + ' Hundred ';
        val %= 100;
      }
      if (val > 19) {
        str += b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
      } else if (val > 0) {
        str += a[val];
      }
      return str.trim();
    };

    let result = '';
    const crore = Math.floor(n / 10000000);
    let rem = n % 10000000;
    const lakh = Math.floor(rem / 100000);
    rem %= 100000;
    const thousand = Math.floor(rem / 1000);
    rem %= 1000;
    const hundreds = rem;

    if (crore > 0) result += inWords(crore) + ' Crore ';
    if (lakh > 0) result += inWords(lakh) + ' Lakh ';
    if (thousand > 0) result += inWords(thousand) + ' Thousand ';
    if (hundreds > 0) result += inWords(hundreds);

    const paise = Math.round((Math.abs(Number(num)) - n) * 100);
    let paiseStr = '';
    if (paise > 0) {
      paiseStr = ' and ' + inWords(paise) + ' Paise';
    }

    return (result.trim() + ' Rupees' + paiseStr + ' Only');
  },

  showPaymentSuccessModal(receiptRecord, inv) {
    if (!receiptRecord) return;
    const isSettled = Number(receiptRecord.remaining_outstanding) <= 0;
    const contentHtml = \`
      <div style="display: flex; flex-direction: column; gap: 14px; text-align: center; padding: 10px 6px;">
        <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #10b981; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto; border: 2px solid #10b981;">
          ✓
        </div>
        <div>
          <div style="font-size: 18px; font-weight: 800; color: var(--text-primary);">Payment Collected Successfully!</div>
          <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">
            Receipt <strong class="cell-mono" style="color: #10b981;">#\${receiptRecord.receipt_no}</strong> generated through Document Number Series Master
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; text-align: left; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12.5px;">
          <div><span style="color: var(--text-muted);">Receipt No:</span> <strong class="cell-mono" style="color: #10b981;">\${receiptRecord.receipt_no}</strong></div>
          <div><span style="color: var(--text-muted);">Bill / Invoice:</span> <strong class="cell-mono">\${receiptRecord.invoice_no}</strong></div>
          <div><span style="color: var(--text-muted);">Customer:</span> <strong>\${receiptRecord.customer_name}</strong></div>
          <div><span style="color: var(--text-muted);">Customer CIN:</span> <strong class="cell-mono" style="color: #a78bfa;">\${receiptRecord.customer_cin}</strong></div>
          <div><span style="color: var(--text-muted);">Payment Mode:</span> <span class="badge badge-subtle">\${receiptRecord.payment_mode}</span></div>
          <div><span style="color: var(--text-muted);">Amount Paid Now:</span> <strong class="cell-mono" style="color: #10b981; font-size: 14px;">₹\${Number(receiptRecord.amount_paid).toFixed(2)}</strong></div>
          <div><span style="color: var(--text-muted);">Previous Outstanding:</span> <span class="cell-mono">₹\${Number(receiptRecord.previous_outstanding).toFixed(2)}</span></div>
          <div><span style="color: var(--text-muted);">Remaining Balance:</span> <strong class="cell-mono" style="color: \${isSettled ? '#10b981' : '#ef4444'};">₹\${Number(receiptRecord.remaining_outstanding).toFixed(2)}</strong></div>
        </div>

        <div style="background: \${isSettled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; border: 1px solid \${isSettled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}; padding: 10px; border-radius: 6px; font-size: 12px; color: \${isSettled ? '#10b981' : '#f59e0b'}; font-weight: 600;">
          \${isSettled 
            ? '✓ Bill is now FULLY SETTLED. Gate pass & vehicle handover can be completed.' 
            : \`⏳ Bill is PARTIALLY SETTLED. Remaining balance of ₹\${Number(receiptRecord.remaining_outstanding).toFixed(2)} is due.\`}
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.State.closeModal()">Close</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.BillingModule.showBillReceiptsModal('\${receiptRecord.bill_id}')" title="View all receipts for this bill">
            <span>📑 All Bill Receipts</span>
          </button>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.BillingModule.printPaymentReceipt('\${receiptRecord.id}')" style="font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
            <span>🖨️ Print Receipt</span>
          </button>
        </div>
      </div>
    \`;

    window.State.showModal({ title: \`Payment Receipt: \${receiptRecord.receipt_no}\`, contentHtml, maxWidth: '540px' });
  },

  showBillReceiptsModal(billId) {
    const inv = this.resolveInvoiceOrBill(billId);
    if (!inv) {
      window.State.showToast('Bill not found.', 'warning');
      return;
    }

    const allReceipts = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('paymentReceipts') || []) : [];
    
    // Find all receipts matching this bill
    let billReceipts = allReceipts.filter(r => 
      r.bill_id === inv.id || 
      (inv.invoice_no && r.invoice_no === inv.invoice_no) || 
      (inv.bill_no && r.invoice_no === inv.bill_no) ||
      (inv.id && r.bill_id === inv.id)
    );

    const netTotal = Number(inv.net_payable !== undefined ? inv.net_payable : (inv.grand_total || 0));
    const totalPaid = Number(inv.amount_paid !== undefined ? inv.amount_paid : (inv.amount_received || 0));
    const balanceDue = Number(inv.balance_due !== undefined ? inv.balance_due : Math.max(0, netTotal - totalPaid));

    // If paymentReceipts was empty or partially populated from older sessions, sync from inv.payment_history
    if (billReceipts.length === 0 && Array.isArray(inv.payment_history) && inv.payment_history.length > 0) {
      let cumulativePaid = 0;
      
      inv.payment_history.forEach((ph, idx) => {
        const phAmount = Number(ph.amount || 0);
        const prevBal = (ph.previous_outstanding !== undefined) ? Number(ph.previous_outstanding) : Math.max(0, netTotal - cumulativePaid);
        cumulativePaid += phAmount;
        const remBal = (ph.balance_remaining !== undefined) ? Number(ph.balance_remaining) : Math.max(0, netTotal - cumulativePaid);
        const rcpNo = ph.receipt_no || \`RCP/MSC1/2026/\${String(idx + 1).padStart(6, '0')}\`;
        
        const synchedReceipt = {
          id: ph.receipt_id || \`RCP-HIST-\${inv.id}-\${idx}\`,
          receipt_no: rcpNo,
          bill_id: inv.id,
          invoice_no: inv.invoice_no || inv.bill_no || inv.id,
          job_card_id: inv.job_card_id || '',
          job_card_no: inv.job_card_no || '--',
          estimate_no: inv.estimate_no || inv.source_estimate_ref || '--',
          customer_cin: inv.customer_cin || inv.cin_number || inv.cin || '--',
          customer_name: inv.customer_name || 'Customer',
          customer_mobile: inv.customer_mobile || '',
          customer_address: inv.customer_address || 'Pune, Maharashtra',
          vehicle_reg_no: inv.vehicle_reg_no || '--',
          vehicle_model: inv.vehicle_model || '',
          payment_date: ph.date ? ph.date.split('T')[0] : (inv.payment_date || new Date().toISOString().split('T')[0]),
          payment_time: ph.time || (ph.date && ph.date.includes('T') ? ph.date.split('T')[1].slice(0, 8) : '10:00:00 AM'),
          payment_mode: ph.mode || inv.payment_mode || 'Cash',
          payment_ref: ph.reference || \`\${ph.mode || 'Cash'} Payment\`,
          amount_paid: phAmount,
          previous_outstanding: prevBal,
          remaining_outstanding: remBal,
          total_bill_amount: netTotal,
          total_paid_so_far: cumulativePaid,
          collected_by: ph.collected_by || 'Santosh Shinde (Cashier)',
          facility_id: inv.branch_id || 'PLANT-01',
          facility_name: inv.branch_id === 'PLANT-02' ? 'Mauli Service Center 2 (MSC2)' : 'Mauli Service Center 1 (MSC1)',
          status: 'ACTIVE',
          created_at: ph.date || new Date().toISOString()
        };
        if (window.DB && typeof window.DB.upsert === 'function') {
          window.DB.upsert('paymentReceipts', synchedReceipt);
        }
        billReceipts.push(synchedReceipt);
      });
    }

    // If still empty but amount_paid > 0, generate a historical receipt record
    if (billReceipts.length === 0 && totalPaid > 0) {
      const singleReceipt = {
        id: \`RCP-SINGLE-\${inv.id}\`,
        receipt_no: inv.last_receipt_no || \`RCP/MSC1/2026/000001\`,
        bill_id: inv.id,
        invoice_no: inv.invoice_no || inv.bill_no || inv.id,
        job_card_id: inv.job_card_id || '',
        job_card_no: inv.job_card_no || '--',
        estimate_no: inv.estimate_no || inv.source_estimate_ref || '--',
        customer_cin: inv.customer_cin || inv.cin_number || inv.cin || '--',
        customer_name: inv.customer_name || 'Customer',
        customer_mobile: inv.customer_mobile || '',
        customer_address: inv.customer_address || 'Pune, Maharashtra',
        vehicle_reg_no: inv.vehicle_reg_no || '--',
        vehicle_model: inv.vehicle_model || '',
        payment_date: inv.payment_date || new Date().toISOString().split('T')[0],
        payment_time: '10:00:00 AM',
        payment_mode: inv.payment_mode || 'Cash',
        payment_ref: inv.payment_ref || \`\${inv.payment_mode || 'Cash'} Payment\`,
        amount_paid: totalPaid,
        previous_outstanding: netTotal,
        remaining_outstanding: balanceDue,
        total_bill_amount: netTotal,
        total_paid_so_far: totalPaid,
        collected_by: 'Santosh Shinde (Cashier)',
        facility_id: inv.branch_id || 'PLANT-01',
        facility_name: inv.branch_id === 'PLANT-02' ? 'Mauli Service Center 2 (MSC2)' : 'Mauli Service Center 1 (MSC1)',
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };
      if (window.DB && typeof window.DB.upsert === 'function') {
        window.DB.upsert('paymentReceipts', singleReceipt);
      }
      billReceipts.push(singleReceipt);
    }

    const contentHtml = \`
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Bill Header Strip -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Payment Receipt History for Bill</div>
            <div class="cell-mono font-bold" style="font-size: 17px; color: var(--primary-300);">\${inv.invoice_no || inv.bill_no || inv.id}</div>
            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">
              \${inv.customer_name || 'Customer'} &bull; <span class="cell-mono" style="color: #a78bfa;">\${inv.customer_cin || '--'}</span> &bull; <span class="cell-mono">\${inv.vehicle_reg_no || '--'}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Settlement Status</div>
            <div style="display: flex; gap: 6px; align-items: center; justify-content: flex-end; margin-top: 3px;">
              <span class="badge \${balanceDue <= 0 ? 'badge-success' : (totalPaid > 0 ? 'badge-warning' : 'badge-danger')}" style="font-size: 11.5px; font-weight: 700; padding: 4px 8px;">
                \${balanceDue <= 0 ? '✓ Fully Settled' : (totalPaid > 0 ? '⏳ Partially Settled' : '⚠️ Pending Payment')}
              </span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
              Net: <strong>₹\${netTotal.toFixed(2)}</strong> | Paid: <strong style="color: #10b981;">₹\${totalPaid.toFixed(2)}</strong> | Due: <strong style="color: \${balanceDue > 0 ? '#ef4444' : 'inherit'};">₹\${balanceDue.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <!-- Receipt Table or Empty State -->
        \${billReceipts.length === 0 ? \`
          <div style="text-align: center; padding: 36px 20px; background: rgba(0,0,0,0.15); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 32px; margin-bottom: 6px;">🧾</div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">No Payment Receipts Recorded Yet</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px; max-width: 400px; margin-left: auto; margin-right: auto;">
              Outstanding balance on this bill is ₹\${balanceDue.toFixed(2)}. Record payment to generate an official receipt.
            </div>
            \${balanceDue > 0 ? \`
              <button type="button" class="btn btn-primary btn-sm" style="margin-top: 14px; font-weight: 700;" onclick="window.State.closeModal(); window.BillingModule.showPaymentModal('\${inv.id}');">
                💳 Record Payment Now
              </button>
            \` : ''}
          </div>
        \` : \`
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
                Recorded Payment Transactions (\${billReceipts.length})
              </div>
              <div style="font-size: 11px; color: var(--text-muted);">
                Each installment has an individual sequence-backed receipt
              </div>
            </div>

            <div class="table-responsive" style="border: 1px solid var(--border-subtle); border-radius: var(--radius-md); max-height: 340px; overflow-y: auto;">
              <table class="data-table" style="font-size: 12px; margin: 0; width: 100%;">
                <thead>
                  <tr style="background: rgba(255,255,255,0.03);">
                    <th style="width: 40px; text-align: center;">#</th>
                    <th>Receipt Number</th>
                    <th>Date & Time</th>
                    <th>Payment Mode</th>
                    <th class="text-right">Prev Balance</th>
                    <th class="text-right">Amount Paid</th>
                    <th class="text-right">Remaining Due</th>
                    <th>Collected By</th>
                    <th class="text-right" style="width: 100px;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  \${billReceipts.map((r, idx) => \`
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="text-align: center; color: var(--text-muted); font-size: 11px;">\${idx + 1}</td>
                      <td>
                        <span class="cell-mono font-bold" style="color: #10b981; font-weight: 700;">\${r.receipt_no}</span>
                      </td>
                      <td>
                        <div>\${r.payment_date}</div>
                        \${r.payment_time ? \`<div style="font-size: 10.5px; color: var(--text-muted);">\${r.payment_time}</div>\` : ''}
                      </td>
                      <td>
                        <span class="badge badge-subtle" style="font-size: 11px;">\${r.payment_mode}</span>
                        \${r.payment_ref ? \`<div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">\${r.payment_ref}</div>\` : ''}
                      </td>
                      <td class="text-right cell-mono" style="color: var(--text-muted);">
                        ₹\${Number(r.previous_outstanding || 0).toFixed(2)}
                      </td>
                      <td class="text-right cell-mono font-bold" style="color: #10b981; font-size: 13px;">
                        ₹\${Number(r.amount_paid || 0).toFixed(2)}
                      </td>
                      <td class="text-right cell-mono font-bold" style="color: \${Number(r.remaining_outstanding || 0) > 0 ? '#ef4444' : '#10b981'};">
                        ₹\${Number(r.remaining_outstanding || 0).toFixed(2)}
                      </td>
                      <td style="font-size: 11px; color: var(--text-secondary);">
                        \${r.collected_by || 'Santosh Shinde'}
                      </td>
                      <td class="text-right">
                        <button 
                          type="button" 
                          class="btn btn-primary btn-sm" 
                          style="font-size: 11px; font-weight: 700; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px;"
                          onclick="window.BillingModule.printPaymentReceipt('\${r.id || r.receipt_no}')"
                          title="Print this payment receipt (retains original receipt sequence)"
                        >
                          <span>🖨️ Print</span>
                        </button>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`}

        <!-- Footer Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-top: 4px; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 11px; color: var(--text-muted);">
            🔒 Reprinting retains the original receipt number without generating duplicates per compliance rules.
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.State.closeModal()">Close</button>
            \${balanceDue > 0 ? \`
              <button type="button" class="btn btn-primary btn-sm" style="font-weight: 700;" onclick="window.State.closeModal(); window.BillingModule.showPaymentModal('\${inv.id}');">
                💳 Collect Next Installment (Due: ₹\${balanceDue.toFixed(2)})
              </button>
            \` : ''}
          </div>
        </div>
      </div>
    \`;

    window.State.showModal({ title: \`Payment Receipts: \${inv.invoice_no || inv.bill_no || inv.id}\`, contentHtml, maxWidth: '780px' });
  },

  printPaymentReceipt(receiptIdOrNo) {
    if (!receiptIdOrNo) {
      window.State.showToast('No receipt identifier specified.', 'warning');
      return;
    }

    const allReceipts = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('paymentReceipts') || []) : [];
    let r = allReceipts.find(rec => rec.id === receiptIdOrNo || rec.receipt_no === receiptIdOrNo);

    // If not found in paymentReceipts directly, check if receiptIdOrNo is a bill ID
    if (!r) {
      const inv = this.resolveInvoiceOrBill(receiptIdOrNo);
      if (inv) {
        return this.showBillReceiptsModal(inv.id);
      }
    }

    // Fallback: look into all final bills and draft bills payment_history
    if (!r) {
      const allBills = [...((window.DB && window.DB.getAll('finalBills')) || []), ...((window.DB && window.DB.getAll('draftBills')) || [])];
      for (const bill of allBills) {
        if (Array.isArray(bill.payment_history)) {
          const match = bill.payment_history.find(p => p.receipt_no === receiptIdOrNo || p.receipt_id === receiptIdOrNo);
          if (match) {
            r = {
              id: match.receipt_id || \`RCP-HIST-\${bill.id}\`,
              receipt_no: match.receipt_no || receiptIdOrNo,
              bill_id: bill.id,
              invoice_no: bill.invoice_no || bill.bill_no || bill.id,
              job_card_id: bill.job_card_id || '',
              job_card_no: bill.job_card_no || '--',
              estimate_no: bill.estimate_no || bill.source_estimate_ref || '--',
              customer_cin: bill.customer_cin || bill.cin_number || bill.cin || '--',
              customer_name: bill.customer_name || 'Customer',
              customer_mobile: bill.customer_mobile || '',
              customer_address: bill.customer_address || 'Pune, Maharashtra',
              vehicle_reg_no: bill.vehicle_reg_no || '--',
              vehicle_model: bill.vehicle_model || '',
              payment_date: match.date ? match.date.split('T')[0] : (bill.payment_date || new Date().toISOString().split('T')[0]),
              payment_time: match.time || '10:00:00 AM',
              payment_mode: match.mode || bill.payment_mode || 'Cash',
              payment_ref: match.reference || \`\${match.mode || 'Cash'} Payment\`,
              amount_paid: Number(match.amount || 0),
              previous_outstanding: Number(match.previous_outstanding || bill.net_payable || 0),
              remaining_outstanding: Number(match.balance_remaining || bill.balance_due || 0),
              total_bill_amount: Number(bill.net_payable || bill.grand_total || 0),
              total_paid_so_far: Number(bill.amount_paid || match.amount || 0),
              collected_by: match.collected_by || 'Santosh Shinde (Cashier)',
              facility_id: bill.branch_id || 'PLANT-01',
              facility_name: bill.branch_id === 'PLANT-02' ? 'Mauli Service Center 2 (MSC2)' : 'Mauli Service Center 1 (MSC1)',
              status: 'ACTIVE'
            };
            break;
          }
        }
      }
    }

    if (!r) {
      window.State.showToast(\`Payment receipt "\${receiptIdOrNo}" not found.\`, 'warning');
      return;
    }

    const words = this.numberToWords(r.amount_paid);
    const isSettled = Number(r.remaining_outstanding) <= 0;

    const contentHtml = \`
      <div id="printable-payment-receipt" style="background: var(--bg-surface, #1e293b); padding: 26px; border-radius: var(--radius-md, 8px); border: 2px solid var(--border-medium, #334155); color: var(--text-primary, #f8fafc); font-family: inherit;">
        
        <!-- Header: Workshop Details & Badge -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--border-medium, #334155); padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 19px; font-weight: 800; color: #10b981; letter-spacing: -0.3px;">\${r.facility_name || 'Mauli Service Center 1 (MSC1)'}</div>
            <div style="font-size: 12px; color: var(--text-secondary, #94a3b8); margin-top: 2px;">Authorized Multi-Brand Two-Wheeler Workshop</div>
            <div style="font-size: 11px; color: var(--text-muted, #64748b);">Plot 42, Service Road, Pune Main Workshop, Maharashtra - 411038</div>
            <div style="font-size: 11px; color: var(--text-muted, #64748b); font-family: monospace;">GSTIN: 27AABCT2345M1Z9 &bull; Phone: +91 98220 12345</div>
          </div>
          <div style="text-align: right;">
            <div class="badge" style="font-size: 13px; font-weight: 800; padding: 5px 12px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1.5px solid #10b981; border-radius: 6px; display: inline-block;">
              PAYMENT RECEIPT
            </div>
            <div class="cell-mono font-bold" style="font-size: 15px; font-weight: 800; color: var(--text-primary, #f8fafc); margin-top: 6px;">
              \${r.receipt_no}
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted, #94a3b8); margin-top: 2px;">
              Date: <strong>\${r.payment_date}</strong> \${r.payment_time ? \`<span style="font-size: 10.5px;">(\${r.payment_time})</span>\` : ''}
            </div>
          </div>
        </div>

        <!-- 4-Box Key Context Strip -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; border: 1px solid var(--border-subtle, #334155); margin-bottom: 16px;">
          <div>
            <div style="font-size: 10px; color: var(--text-muted, #94a3b8); text-transform: uppercase; font-weight: 700;">Customer CIN</div>
            <div class="cell-mono font-bold" style="font-size: 12.5px; color: #a78bfa; margin-top: 2px;">\${r.customer_cin || '--'}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: var(--text-muted, #94a3b8); text-transform: uppercase; font-weight: 700;">Bill / Invoice No</div>
            <div class="cell-mono font-bold" style="font-size: 12.5px; color: #38bdf8; margin-top: 2px;">\${r.invoice_no || '--'}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: var(--text-muted, #94a3b8); text-transform: uppercase; font-weight: 700;">Job Card No</div>
            <div class="cell-mono font-bold" style="font-size: 12.5px; margin-top: 2px;">\${r.job_card_no || '--'}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: var(--text-muted, #94a3b8); text-transform: uppercase; font-weight: 700;">Vehicle Reg No</div>
            <div class="cell-mono font-bold" style="font-size: 12.5px; margin-top: 2px;">\${r.vehicle_reg_no || '--'} \${r.vehicle_model ? \`<span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">(\${r.vehicle_model})</span>\` : ''}</div>
          </div>
        </div>

        <!-- Customer & Payer Info -->
        <div style="margin-bottom: 16px; font-size: 12.5px; line-height: 1.6;">
          Received with thanks from <strong style="font-size: 13.5px; color: var(--text-primary);">\${r.customer_name}</strong>
          \${r.customer_mobile ? \` (Mobile: <span class="cell-mono">\${r.customer_mobile}</span>)\` : ''} 
          towards settlement of Bill <strong class="cell-mono">\${r.invoice_no}</strong>.
        </div>

        <!-- Financial Settlement Breakdown Table -->
        <table class="data-table" style="width: 100%; font-size: 12.5px; margin-bottom: 16px; border: 1px solid var(--border-subtle, #334155);">
          <thead>
            <tr style="background: rgba(255,255,255,0.05);">
              <th>Particulars / Transaction Description</th>
              <th style="width: 130px; text-align: center;">Payment Mode</th>
              <th style="width: 180px; text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="color: var(--text-muted);">Total Bill / Invoice Net Amount</td>
              <td style="text-align: center; color: var(--text-muted);">—</td>
              <td style="text-align: right;" class="cell-mono">₹\${Number(r.total_bill_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Previous Outstanding Balance (Before Payment)</td>
              <td style="text-align: center; color: var(--text-muted);">—</td>
              <td style="text-align: right;" class="cell-mono">₹\${Number(r.previous_outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="background: rgba(16, 185, 129, 0.08); font-weight: 700;">
              <td style="color: #10b981; font-size: 13px;">
                ✓ Amount Paid (Current Transaction)
                <div style="font-size: 11px; font-weight: normal; color: var(--text-muted); margin-top: 2px;">
                  Ref / UTR: \${r.payment_ref || \`\${r.payment_mode} Payment\`}
                </div>
              </td>
              <td style="text-align: center;">
                <span class="badge badge-success" style="font-size: 11px; padding: 3px 8px;">\${r.payment_mode}</span>
              </td>
              <td style="text-align: right; font-size: 15px; color: #10b981;" class="cell-mono font-bold">
                ₹\${Number(r.amount_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td style="font-weight: 600;">
                Remaining Outstanding Balance (After Payment)
              </td>
              <td style="text-align: center;">
                <span class="badge \${isSettled ? 'badge-success' : 'badge-warning'}" style="font-size: 10.5px;">
                  \${isSettled ? 'Fully Settled' : 'Partially Settled'}
                </span>
              </td>
              <td style="text-align: right; font-weight: 700; color: \${isSettled ? '#10b981' : '#ef4444'};" class="cell-mono">
                ₹\${Number(r.remaining_outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Amount in Words -->
        <div style="background: rgba(0,0,0,0.2); border-left: 3px solid #10b981; padding: 10px 14px; border-radius: 4px; font-size: 12px; margin-bottom: 20px;">
          <span style="color: var(--text-muted); text-transform: uppercase; font-size: 10px; font-weight: 700;">Amount in Words:</span>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 13px; margin-top: 2px;">
            \${words}
          </div>
        </div>

        <!-- Signatures & Audit Footprint -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 18px; border-top: 1px dashed var(--border-medium, #334155); font-size: 11.5px; color: var(--text-muted);">
          <div>
            <div>Collected By: <strong style="color: var(--text-primary);">\${r.collected_by || 'Santosh Shinde (Cashier)'}</strong></div>
            <div style="font-size: 10.5px; margin-top: 3px;">System Audit Ref: \${r.id}</div>
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 3px;">This is an authenticated computer-generated payment receipt.</div>
          </div>
          <div style="text-align: right;">
            <div style="border-top: 1px solid var(--border-medium, #94a3b8); width: 170px; margin-left: auto; padding-top: 4px; font-weight: 700; color: var(--text-primary);">
              Authorized Cashier Stamp & Signature
            </div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; gap: 8px; flex-wrap: wrap;">
        <div style="font-size: 11.5px; color: var(--text-muted);">
          💡 Click <strong>Print Receipt</strong> to print or save as PDF. Receipt #\${r.receipt_no}
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.State.closeModal()">Close</button>
          \${r.bill_id ? \`
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.BillingModule.showBillReceiptsModal('\${r.bill_id}')" title="View all installment receipts for this bill">
              <span>📑 All Receipts (\${r.invoice_no})</span>
            </button>
          \` : ''}
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.BillingModule.downloadReceiptHtml('\${r.id}')" title="Download standalone HTML receipt">
            <span>📥 Download File</span>
          </button>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.print()" style="font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
            <span>🖨️ Print Receipt</span>
          </button>
        </div>
      </div>
    \`;

    window.State.showModal({ title: \`Payment Receipt: \${r.receipt_no}\`, contentHtml, maxWidth: '640px' });
  },

  downloadReceiptHtml(receiptIdOrNo) {
    const allReceipts = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('paymentReceipts') || []) : [];
    const r = allReceipts.find(rec => rec.id === receiptIdOrNo || rec.receipt_no === receiptIdOrNo);
    if (!r) {
      window.State.showToast('Receipt record not found for download.', 'warning');
      return;
    }
    const words = this.numberToWords(r.amount_paid);
    const htmlContent = \`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Receipt - \${r.receipt_no}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #111; margin: 0; padding: 24px; }
    .receipt-box { max-width: 650px; margin: 0 auto; border: 2px solid #333; padding: 24px; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 14px; }
    .badge { border: 1.5px solid #10b981; color: #10b981; font-weight: bold; padding: 4px 10px; border-radius: 4px; display: inline-block; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #e2e8f0; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; }
    th { background: #f1f5f9; text-align: left; }
    .amount-highlight { font-size: 16px; font-weight: bold; color: #047857; text-align: right; }
    .footer { display: flex; justify-content: space-between; border-top: 1px dashed #64748b; padding-top: 16px; margin-top: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <div>
        <h2 style="margin: 0; color: #047857;">\${r.facility_name || 'Mauli Service Center 1'}</h2>
        <div style="font-size: 12px; color: #64748b; margin-top: 3px;">Authorized Multi-Brand Two-Wheeler Workshop</div>
        <div style="font-size: 11px; color: #64748b;">GSTIN: 27AABCT2345M1Z9 &bull; Phone: +91 98220 12345</div>
      </div>
      <div style="text-align: right;">
        <div class="badge">PAYMENT RECEIPT</div>
        <div style="font-family: monospace; font-weight: bold; font-size: 14px; margin-top: 6px;">\${r.receipt_no}</div>
        <div style="font-size: 12px; color: #64748b;">Date: \${r.payment_date} \${r.payment_time}</div>
      </div>
    </div>

    <div class="grid">
      <div><strong>Customer CIN:</strong><br><span style="font-family: monospace;">\${r.customer_cin}</span></div>
      <div><strong>Bill Number:</strong><br><span style="font-family: monospace;">\${r.invoice_no}</span></div>
      <div><strong>Job Card:</strong><br><span style="font-family: monospace;">\${r.job_card_no}</span></div>
      <div><strong>Vehicle Reg:</strong><br><span style="font-family: monospace;">\${r.vehicle_reg_no}</span></div>
    </div>

    <p style="font-size: 13px;">Received with thanks from <strong>\${r.customer_name}</strong> towards settlement of Bill <strong>\${r.invoice_no}</strong>.</p>

    <table>
      <thead>
        <tr>
          <th>Particulars</th>
          <th style="width: 120px; text-align: center;">Mode</th>
          <th style="width: 150px; text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total Net Bill Amount</td>
          <td style="text-align: center;">—</td>
          <td style="text-align: right; font-family: monospace;">₹\${Number(r.total_bill_amount || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Previous Outstanding Amount</td>
          <td style="text-align: center;">—</td>
          <td style="text-align: right; font-family: monospace;">₹\${Number(r.previous_outstanding || 0).toFixed(2)}</td>
        </tr>
        <tr style="background: #ecfdf5; font-weight: bold;">
          <td>Amount Paid Now (\${r.payment_ref || r.payment_mode})</td>
          <td style="text-align: center;">\${r.payment_mode}</td>
          <td class="amount-highlight">₹\${Number(r.amount_paid || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Remaining Outstanding Balance</td>
          <td style="text-align: center;">\${Number(r.remaining_outstanding) <= 0 ? 'Settled' : 'Due'}</td>
          <td style="text-align: right; font-family: monospace; font-weight: bold;">₹\${Number(r.remaining_outstanding || 0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="background: #f8fafc; border-left: 3px solid #10b981; padding: 8px 12px; font-size: 12px; margin-bottom: 20px;">
      <strong>Amount in Words:</strong> \${words}
    </div>

    <div class="footer">
      <div>
        <div>Collected By: <strong>\${r.collected_by}</strong></div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Computer-generated money receipt &bull; Audit Ref: \${r.id}</div>
      </div>
      <div style="text-align: right; width: 180px; border-top: 1px solid #333; padding-top: 4px;">
        Authorized Signatory
      </div>
    </div>
  </div>
</body>
</html>\`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`Payment_Receipt_\${r.receipt_no.replace(/[/\\\\?%*:|"<>]/g, '_')}.html\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.State.showToast(\`Downloaded payment receipt \${r.receipt_no}\`, 'success');
  },
`;

// Insert helperMethods right before the closing of window.BillingModule
const closingTarget = `  viewGatePass(delId) {
    const d = window.DB.getById('vehicleDeliveries', delId);
    if (!d) return;`;

if (!code.includes(closingTarget)) {
  console.error('Failed to find closingTarget for helper methods');
  process.exit(1);
}

// Insert helpers before viewGatePass
code = code.replace(closingTarget, helperMethods + '\n' + closingTarget);
console.log('✓ 6. Helper methods inserted successfully');

fs.writeFileSync(billingPath, code, 'utf8');
console.log('✅ js/modules/billing.js updated successfully!');
