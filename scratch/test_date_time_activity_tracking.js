const { execFile } = require('child_process');
const fs = require('fs');
const assert = require('assert');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-date-time-tracking-profile';

if (fs.existsSync(profileDir)) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
}

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9270',
  `--user-data-dir=${profileDir}`,
  '--window-size=1600,1050',
  'http://localhost:3000/#/customer-billing'
]);

function sendCdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(ws, expression) {
  const res = await sendCdp(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error('Eval failed: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result ? res.result.value : undefined;
}

setTimeout(async () => {
  try {
    console.log('Connecting to Edge via CDP on port 9270...');
    const listRes = await fetch('http://127.0.0.1:9270/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    for (let i = 0; i < 30; i++) {
      const isReady = await evalInPage(ws, 'Boolean(window.DB && window.DB.data && window.BillingModule)');
      if (isReady) break;
      await new Promise(r => setTimeout(r, 400));
    }

    console.log('Page ready. Setting up initial bill with receipt for date/time tracking test...');

    await evalInPage(ws, `(() => {
      const today = '2026-10-29';

      const initialBill = {
        id: 'INV/MSC1/2026/0090',
        invoice_no: 'INV/MSC1/2026/0090',
        bill_no: 'INV/MSC1/2026/0090',
        bill_date: today,
        created_at: '2026-10-29T09:00:00.000Z',
        created_by: 'Pravin Patil (System Administrator)',
        job_card_no: 'JC/MSC1/2026/0099',
        estimate_no: 'EST/MSC1/2026/0055',
        customer_name: 'Vikas Deshmukh',
        customer_cin: 'CIN/MSC1/2026/000099',
        phone: '9822334455',
        vehicle_reg_no: 'MH12PQ5678',
        vehicle_model: 'Maruti Brezza',
        sub_total: 3500,
        discount: 0,
        tax_total: 0,
        grand_total: 3500,
        net_payable: 3500,
        amount_paid: 1500,
        amount_received: 1500,
        balance_amount: 2000,
        balance_due: 2000,
        status: 'FINAL',
        payment_mode: 'UPI',
        payment_status: 'PARTIALLY_PAID',
        items: [
          { code: 'SRV-10', description: 'Major Service', qty: 1, rate: 2500, total: 2500, type: 'LABOUR' },
          { code: 'PRT-10', description: 'Cabin Filter', qty: 1, rate: 1000, total: 1000, type: 'PART', stock_permanently_deducted: true }
        ],
        payment_history: [
          { receipt_no: 'RCPT/2026/000201', date: today, time: '09:30:00 AM', mode: 'UPI', amount: 1500, reference: 'UPI Advance', status: 'ACTIVE' }
        ],
        audit_history: [
          {
            transaction_number: 'INV/MSC1/2026/0090',
            activity_type: 'Bill Created',
            previous_status: 'ESTIMATE_APPROVED',
            new_status: 'FINAL',
            activity_date_time: '2026-10-29T09:00:00.000Z',
            performed_by: 'USER-001 (Pravin Patil)',
            performed_by_id: 'USER-001',
            performed_by_name: 'Pravin Patil',
            cancellation_reason: '',
            revision_number: 'Base',
            remarks: 'Converted from Job Card JC/MSC1/2026/0099',
            action: 'BILL_CREATED',
            timestamp: '2026-10-29T09:00:00.000Z'
          }
        ]
      };

      const receipt = {
        id: 'RCPT-201',
        receipt_no: 'RCPT/2026/000201',
        receipt_date: today,
        payment_date: today,
        date: today,
        bill_id: 'INV/MSC1/2026/0090',
        invoice_no: 'INV/MSC1/2026/0090',
        customer_name: 'Vikas Deshmukh',
        amount: 1500,
        amount_paid: 1500,
        payment_mode: 'UPI',
        status: 'ACTIVE',
        notes: 'Advance via PhonePe',
        created_at: '2026-10-29T09:30:00.000Z'
      };

      window.DB.upsert('finalBills', initialBill);
      window.DB.upsert('paymentReceipts', receipt);
      window.BillingModule.render();
      return true;
    })()`);

    console.log('Initial setup verified.');

    // ----------------------------------------------------
    // TEST ACTIVITY 1: RECEIPT CANCELLATION
    // ----------------------------------------------------
    console.log('\n--- Activity 1: Cancel Receipt & Verify Date/Time Capture ---');
    await evalInPage(ws, `window.BillingModule.showCancelReceiptModal('RCPT/2026/000201', 'INV/MSC1/2026/0090')`);
    await new Promise(r => setTimeout(r, 400));
    await evalInPage(ws, `(() => {
      document.getElementById('cancel-receipt-reason').value = 'Bill Cancellation / Customer Withdrawal';
      document.getElementById('cancel-receipt-remarks').value = 'Customer withdrew vehicle for budget reasons';
      window.BillingModule.submitCancelReceipt('RCPT/2026/000201', 'INV/MSC1/2026/0090');
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const cancelledReceipt = await evalInPage(ws, `window.DB.getById('paymentReceipts', 'RCPT-201')`);
    console.log('Receipt status:', cancelledReceipt.status);
    console.log('Receipt cancellation date/time:', cancelledReceipt.cancellation_date_time);
    console.log('Receipt cancelled by:', cancelledReceipt.cancelled_by);
    assert.strictEqual(cancelledReceipt.status, 'CANCELLED');
    assert(cancelledReceipt.cancellation_date_time, 'Receipt cancellation date and time must be captured automatically');
    assert(cancelledReceipt.audit_history.length > 0, 'Receipt audit history must have an entry');
    const rcpAudit = cancelledReceipt.audit_history[cancelledReceipt.audit_history.length - 1];
    assert.strictEqual(rcpAudit.activity_type, 'Cancel Receipt');
    assert.strictEqual(rcpAudit.transaction_number, 'RCPT/2026/000201');
    assert.strictEqual(rcpAudit.previous_status, 'ACTIVE');
    assert.strictEqual(rcpAudit.new_status, 'Cancelled');
    assert(rcpAudit.performed_by, 'Performed by user info must be captured');
    assert(rcpAudit.activity_date_time, 'Activity date & time must be captured');
    console.log('✓ PASS: Activity 1 (Receipt Cancellation) correctly captured in receipt audit trail');

    // ----------------------------------------------------
    // TEST ACTIVITY 2: BILL CANCELLATION
    // ----------------------------------------------------
    console.log('\n--- Activity 2: Cancel Bill & Verify Date/Time Capture ---');
    await evalInPage(ws, `window.BillingModule.showBillCancellationReasonModal('INV/MSC1/2026/0090')`);
    await new Promise(r => setTimeout(r, 400));
    await evalInPage(ws, `(() => {
      document.getElementById('cancel-bill-reason').value = 'Customer Dispute / Disagreement';
      document.getElementById('cancel-bill-remarks').value = 'Customer requested revision of labour charges';
      window.BillingModule.submitCancelBill('INV/MSC1/2026/0090');
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const cancelledBill = await evalInPage(ws, `window.DB.getById('finalBills', 'INV/MSC1/2026/0090')`);
    console.log('Bill status:', cancelledBill.status);
    console.log('Bill cancellation date/time:', cancelledBill.cancellation_date_time);
    console.log('Bill cancelled by:', cancelledBill.cancelled_by);
    assert.strictEqual(cancelledBill.status, 'CANCELLED');
    assert(cancelledBill.cancellation_date_time, 'Bill cancellation date & time must be captured automatically');
    const billCancelAudit = cancelledBill.audit_history.find(a => a.activity_type === 'Cancel Bill');
    assert(billCancelAudit, 'Bill audit history must contain Cancel Bill entry');
    assert.strictEqual(billCancelAudit.activity_type, 'Cancel Bill');
    assert.strictEqual(billCancelAudit.previous_status, 'FINAL');
    assert.strictEqual(billCancelAudit.new_status, 'CANCELLED');
    assert.strictEqual(billCancelAudit.cancellation_reason, 'Customer Dispute / Disagreement');
    assert(billCancelAudit.activity_date_time, 'Must have activity_date_time timestamp');
    console.log('✓ PASS: Activity 2 (Bill Cancellation) correctly captured in bill audit trail');

    // ----------------------------------------------------
    // TEST ACTIVITY 3: BILL REOPENING
    // ----------------------------------------------------
    console.log('\n--- Activity 3: Reopen Bill & Verify Date/Time Capture ---');
    await evalInPage(ws, `window.BillingModule.showReopenBillModal('INV/MSC1/2026/0090')`);
    await new Promise(r => setTimeout(r, 400));
    await evalInPage(ws, `(() => {
      document.getElementById('reopen-bill-reason').value = 'Reopened to apply customer requested labour discount and revision';
      window.BillingModule.submitReopenBill('INV/MSC1/2026/0090');
    })()`);
    await new Promise(r => setTimeout(r, 800));

    // Check original bill has Reopen Bill audit record
    const reopenedOriginalBill = await evalInPage(ws, `window.DB.getById('finalBills', 'INV/MSC1/2026/0090')`);
    const reopenAudit = reopenedOriginalBill.audit_history.find(a => a.activity_type === 'Reopen Bill');
    assert(reopenAudit, 'Original bill audit history must contain Reopen Bill entry');
    console.log('Reopen audit date/time:', reopenAudit.activity_date_time);
    assert.strictEqual(reopenAudit.activity_type, 'Reopen Bill');
    assert.strictEqual(reopenAudit.previous_status, 'CANCELLED');
    assert.strictEqual(reopenAudit.new_status, 'DRAFT');
    assert(reopenAudit.revision_number, 'Revision number must be present');
    console.log('✓ PASS: Activity 3 (Bill Reopening) correctly captured');

    // ----------------------------------------------------
    // TEST ACTIVITY 4: BILL REVISION
    // ----------------------------------------------------
    console.log('\n--- Activity 4: Save Revised Bill & Verify Date/Time Capture ---');
    // Find newly created revised draft bill
    const allDrafts = await evalInPage(ws, `window.DB.getAll('draftBills')`);
    const revisedDraft = allDrafts.find(d => d.original_bill_id === 'INV/MSC1/2026/0090' || d.original_bill_no === 'INV/MSC1/2026/0090');
    assert(revisedDraft, 'Revised draft bill must exist in draftBills');
    console.log('Found revised draft bill:', revisedDraft.invoice_no, 'Revision:', revisedDraft.revision_no);

    // Save and finalize revised bill
    await evalInPage(ws, `window.BillingModule.saveRevisedBill('${revisedDraft.id}')`);
    await new Promise(r => setTimeout(r, 800));

    const allFinals = await evalInPage(ws, `window.DB.getAll('finalBills')`);
    const savedRevisedBill = allFinals.find(b => b.invoice_no === revisedDraft.invoice_no);
    assert(savedRevisedBill, 'Saved revised bill must exist in finalBills');
    console.log('Saved revised bill status:', savedRevisedBill.status);
    console.log('Revision date/time:', savedRevisedBill.revision_date_time);
    assert(savedRevisedBill.revision_date_time, 'Revision date & time must be captured automatically');
    const reviseAudit = savedRevisedBill.audit_history.find(a => a.activity_type === 'Revise Bill');
    assert(reviseAudit, 'Revised bill must contain Revise Bill audit entry');
    assert.strictEqual(reviseAudit.activity_type, 'Revise Bill');
    assert.strictEqual(reviseAudit.previous_status, 'DRAFT');
    assert.strictEqual(reviseAudit.new_status, 'REVISED_PAYMENT_PENDING');
    assert(reviseAudit.activity_date_time, 'Must have activity_date_time timestamp');
    console.log('✓ PASS: Activity 4 (Bill Revision) correctly captured in audit trail');

    // ----------------------------------------------------
    // TEST ACTIVITY 5: BILL SETTLEMENT
    // ----------------------------------------------------
    console.log('\n--- Activity 5: Settle Payment on Revised Bill & Verify Date/Time Capture ---');
    await evalInPage(ws, `window.BillingModule.showPaymentModal('${savedRevisedBill.id}')`);
    await new Promise(r => setTimeout(r, 400));
    await evalInPage(ws, `(() => {
      document.getElementById('pay-mode').value = 'UPI';
      document.getElementById('pay-amount').value = String(${savedRevisedBill.net_payable || 3500});
      document.getElementById('pay-ref').value = 'UPI-SETTLE-987654';
      window.BillingModule.submitPayment('${savedRevisedBill.id}');
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const settledBill = await evalInPage(ws, `window.DB.getById('finalBills', '${savedRevisedBill.id}')`);
    console.log('Settled bill status:', settledBill.status);
    console.log('Settled date/time:', settledBill.settlement_date_time);
    assert.strictEqual(settledBill.status, 'PAID');
    assert(settledBill.settlement_date_time, 'Bill settlement date & time must be captured automatically');
    const settleAudit = settledBill.audit_history.find(a => a.activity_type === 'Settle Bill');
    assert(settleAudit, 'Settled bill must contain Settle Bill audit entry');
    assert.strictEqual(settleAudit.activity_type, 'Settle Bill');
    assert.strictEqual(settleAudit.previous_status, 'REVISED_PAYMENT_PENDING');
    assert.strictEqual(settleAudit.new_status, 'PAID');
    assert(settleAudit.activity_date_time, 'Must have activity_date_time timestamp');
    console.log('✓ PASS: Activity 5 (Bill Settlement) correctly captured in audit trail');

    // ----------------------------------------------------
    // TEST UI & SCREENSHOT VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- Step 6: Verify Audit Trail Modal UI with All 5 Activities ---');
    await evalInPage(ws, `window.BillingModule.showBillAuditModal('${settledBill.id}')`);
    await new Promise(r => setTimeout(r, 600));

    const auditModalTitle = await evalInPage(ws, `document.getElementById('global-modal-title')?.innerText`);
    console.log('Audit Modal Title:', auditModalTitle);
    assert(auditModalTitle && auditModalTitle.includes('Audit Trail & History'), 'Expected Audit Trail modal title');

    const auditRowsCount = await evalInPage(ws, `document.querySelectorAll('#global-modal-container .data-table tbody tr').length`);
    console.log('Total audit rows in modal:', auditRowsCount);
    assert(auditRowsCount >= 5, 'Modal table must display at least all 5 recorded activities');

    // Capture screenshot of the Audit Trail Modal displaying all activities
    const ss1 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const ss1Path = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\date_time_tracking_audit_trail_modal.png';
    fs.writeFileSync(ss1Path, Buffer.from(ss1.data, 'base64'));
    console.log('Captured screenshot 1:', ss1Path);

    // Open Bill Overview modal to verify "📋 View Audit Trail" button presence
    console.log('\n--- Step 7: Verify View Bill Overview Modal with Audit Trail Button ---');
    await evalInPage(ws, `window.BillingModule.viewBillDetails('${settledBill.id}')`);
    await new Promise(r => setTimeout(r, 600));

    const ss2 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const ss2Path = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\view_bill_overview_with_audit_btn.png';
    fs.writeFileSync(ss2Path, Buffer.from(ss2.data, 'base64'));
    console.log('Captured screenshot 2:', ss2Path);

    console.log('\n================================================================');
    console.log('ALL 5 ACTIVITIES DATE & TIME TRACKING TESTS PASSED PERFECTLY!');
    console.log('================================================================');

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    if (proc) proc.kill();
    process.exit(1);
  }
}, 2000);

