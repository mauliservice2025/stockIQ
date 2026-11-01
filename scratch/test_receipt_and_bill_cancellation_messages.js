const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-receipt-bill-cancellation-profile';
const artifactDir = 'C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb';

if (fs.existsSync(profileDir)) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
}

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9298',
  `--user-data-dir=${profileDir}`,
  '--window-size=1500,1050',
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

async function captureScreenshot(ws, filePath) {
  const res = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
  console.log(`Saved screenshot: ${filePath}`);
}

setTimeout(async () => {
  try {
    console.log('Connecting to Edge CDP on port 9298...');
    const listRes = await fetch('http://127.0.0.1:9298/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000')) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    for (let i = 0; i < 30; i++) {
      try {
        const ready = await evalInPage(ws, 'Boolean(window.DB && window.DB.data && window.BillingModule)');
        if (ready) break;
      } catch (e) {}
      await new Promise(r => setTimeout(r, 300));
    }

    console.log('Setting up test bill with 2 active payment receipts...');
    const setupData = await evalInPage(ws, `(() => {
      const billId = 'INV/MSC1/2026/0095';
      const testBill = {
        id: billId,
        invoice_no: billId,
        bill_no: billId,
        bill_date: '2026-10-29',
        created_at: '2026-10-29T11:00:00Z',
        job_card_no: 'JC/MSC1/2026/0095',
        estimate_no: 'EST/MSC1/2026/0095',
        customer_name: 'Rushi Dhiwar',
        customer_cin: 'CIN/MSC/2026/000095',
        customer_mobile: '9876543456',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'TVS Jupiter',
        subtotal: 2000,
        discount: 0,
        tax_total: 0,
        grand_total: 2000,
        net_payable: 2000,
        amount_paid: 2000,
        balance_amount: 0,
        balance_due: 0,
        status: 'FINAL',
        payment_status: 'PAID',
        payment_mode: 'SPLIT',
        items: [
          { code: 'SRV-01', name: 'General Service Labour', qty: 1, rate: 1200, amount: 1200, type: 'LABOUR' },
          { code: 'PRT-01', name: 'Engine Oil', qty: 1, rate: 800, amount: 800, type: 'PART', stock_permanently_deducted: true }
        ],
        payment_history: [
          { receipt_no: 'RCP/MSC1/2026/000055', date: '2026-10-29', mode: 'UPI', amount: 1200, status: 'ACTIVE' },
          { receipt_no: 'RCP/MSC1/2026/000056', date: '2026-10-29', mode: 'Cash', amount: 800, status: 'ACTIVE' }
        ]
      };

      const r1 = {
        id: 'RCP-55',
        receipt_no: 'RCP/MSC1/2026/000055',
        receipt_date: '2026-10-29',
        payment_date: '2026-10-29',
        date: '2026-10-29',
        bill_id: billId,
        invoice_no: billId,
        customer_name: 'Rushi Dhiwar',
        customer_cin: 'CIN/MSC/2026/000095',
        vehicle_reg_no: 'MH12AC4335',
        amount: 1200,
        amount_paid: 1200,
        payment_mode: 'UPI',
        status: 'ACTIVE'
      };

      const r2 = {
        id: 'RCP-56',
        receipt_no: 'RCP/MSC1/2026/000056',
        receipt_date: '2026-10-29',
        payment_date: '2026-10-29',
        date: '2026-10-29',
        bill_id: billId,
        invoice_no: billId,
        customer_name: 'Rushi Dhiwar',
        customer_cin: 'CIN/MSC/2026/000095',
        vehicle_reg_no: 'MH12AC4335',
        amount: 800,
        amount_paid: 800,
        payment_mode: 'Cash',
        status: 'ACTIVE'
      };

      if (!window.DB.data.finalBills) window.DB.data.finalBills = [];
      if (!window.DB.data.paymentReceipts) window.DB.data.paymentReceipts = [];
      window.DB.upsert('finalBills', testBill);
      window.DB.upsert('paymentReceipts', r1);
      window.DB.upsert('paymentReceipts', r2);
      window.DB.saveData();

      window.BillingModule.activeTab = 'CUSTOMER_BILLING';
      window.BillingModule.activeBillingBillId = null;
      window.BillingModule.refresh();

      return { billId, r1No: r1.receipt_no, r2No: r2.receipt_no };
    })()`);
    console.log('Setup data:', setupData);

    // 1. User clicks Cancel Bill
    console.log('\n--- Step 1: User clicks Cancel Bill ---');
    await evalInPage(ws, `window.BillingModule.showCancelBillModal('INV/MSC1/2026/0095')`);
    await new Promise(r => setTimeout(r, 600));

    const step1ModalTitle = await evalInPage(ws, `document.getElementById('global-modal-title')?.innerText`);
    console.log('Modal title on clicking Cancel Bill:', step1ModalTitle);
    assert(step1ModalTitle.includes('Receipts Associated with'), 'Expected Receipts Associated modal to appear');

    const displayedReceiptsCount = await evalInPage(ws, `document.querySelectorAll('#global-modal-container .data-table tbody tr').length`);
    console.log('Displayed receipts count:', displayedReceiptsCount);
    assert.strictEqual(displayedReceiptsCount, 2, 'Should display 2 receipts');

    // 2. User selects first receipt and opens Confirm Receipt Cancellation popup
    console.log('\n--- Step 2: Open Cancel Receipt modal for RCP/MSC1/2026/000055 ---');
    await evalInPage(ws, `window.BillingModule.showCancelReceiptModal('RCP/MSC1/2026/000055', 'INV/MSC1/2026/0095')`);
    await new Promise(r => setTimeout(r, 600));

    const receiptModalTitle = await evalInPage(ws, `document.getElementById('global-modal-title')?.innerText`);
    console.log('Receipt Modal Title:', receiptModalTitle);
    assert(receiptModalTitle.includes('Cancel Payment Receipt: RCP/MSC1/2026/000055'), 'Expected Cancel Payment Receipt title');

    const confirmReceiptBtnText = await evalInPage(ws, `(() => {
      const btn = Array.from(document.querySelectorAll('#global-modal-container button[type="submit"]')).find(b => b.textContent.includes('Confirm Receipt Cancellation'));
      return btn ? btn.textContent.trim() : null;
    })()`);
    console.log('Confirm Receipt button text:', confirmReceiptBtnText);
    assert.strictEqual(confirmReceiptBtnText, 'Confirm Receipt Cancellation');

    await captureScreenshot(ws, path.join(artifactDir, 'cancel_receipt_confirmation_modal.png'));

    // 3. Confirm cancellation of first receipt
    console.log('\n--- Step 3: Confirm cancellation of first receipt ---');
    // Hook toast to capture message
    await evalInPage(ws, `(() => {
      window._lastToast = null;
      const origShowToast = window.State.showToast;
      window.State.showToast = function(msg, type) {
        window._lastToast = { msg, type };
        return origShowToast.apply(this, arguments);
      };
    })()`);

    await evalInPage(ws, `(() => {
      document.getElementById('cancel-receipt-reason').value = 'Bill Cancellation / Customer Withdrawal';
      document.getElementById('cancel-receipt-remarks').value = 'Reversed UPI collection for bill cancellation';
      window.BillingModule.submitCancelReceipt('RCP/MSC1/2026/000055', 'INV/MSC1/2026/0095');
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const lastToastStep3 = await evalInPage(ws, `window._lastToast`);
    console.log('Toast message after receipt cancellation:', lastToastStep3);
    assert.strictEqual(lastToastStep3.msg, 'Receipt cancelled successfully.', 'Toast must match: “Receipt cancelled successfully.”');
    assert.strictEqual(lastToastStep3.type, 'success');

    // Verify other active receipt exists -> continues displaying receipts list
    const step3ModalTitle = await evalInPage(ws, `document.getElementById('global-modal-title')?.innerText`);
    console.log('Modal title after first receipt cancellation:', step3ModalTitle);
    assert(step3ModalTitle.includes('Receipts Associated with'), 'Must continue displaying receipts list because 1 active receipt remains');

    const remainingActiveCount = await evalInPage(ws, `(() => {
      const allR = window.BillingModule.getBillReceipts('INV/MSC1/2026/0095');
      return allR.filter(r => r.status !== 'CANCELLED').length;
    })()`);
    console.log('Remaining active receipts count:', remainingActiveCount);
    assert.strictEqual(remainingActiveCount, 1);

    await captureScreenshot(ws, path.join(artifactDir, 'receipts_list_one_active_remaining.png'));

    // 4. Cancel the second (last) active receipt
    console.log('\n--- Step 4: Cancel second (last) active receipt (RCP/MSC1/2026/000056) ---');
    await evalInPage(ws, `window.BillingModule.showCancelReceiptModal('RCP/MSC1/2026/000056', 'INV/MSC1/2026/0095')`);
    await new Promise(r => setTimeout(r, 600));

    await evalInPage(ws, `(() => {
      document.getElementById('cancel-receipt-reason').value = 'Bill Cancellation / Customer Withdrawal';
      document.getElementById('cancel-receipt-remarks').value = 'Refunded cash amount';
      window.BillingModule.submitCancelReceipt('RCP/MSC1/2026/000056', 'INV/MSC1/2026/0095');
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const lastToastStep4 = await evalInPage(ws, `window._lastToast`);
    console.log('Toast message after second receipt cancellation:', lastToastStep4);
    assert.strictEqual(lastToastStep4.msg, 'Receipt cancelled successfully.', 'Toast must match: “Receipt cancelled successfully.”');

    // 5. Automatic navigation to Bill Cancellation screen!
    console.log('\n--- Step 5: Verify Automatic Navigation to Bill Cancellation Screen ---');
    const step5ModalTitle = await evalInPage(ws, `document.getElementById('global-modal-title')?.innerText`);
    console.log('Modal title after all receipts cancelled:', step5ModalTitle);
    assert(step5ModalTitle.includes('Cancel Bill: INV/MSC1/2026/0095'), 'Must automatically navigate to Bill Cancellation screen');

    const confirmBillBtnText = await evalInPage(ws, `(() => {
      const btn = Array.from(document.querySelectorAll('#global-modal-container button[type="submit"]')).find(b => b.textContent.includes('Confirm Bill Cancellation'));
      return btn ? btn.textContent.trim() : null;
    })()`);
    console.log('Confirm Bill Cancellation button text:', confirmBillBtnText);
    assert.strictEqual(confirmBillBtnText, 'Confirm Bill Cancellation', 'Button must be "Confirm Bill Cancellation"');

    await captureScreenshot(ws, path.join(artifactDir, 'bill_cancellation_screen_after_receipts_cancelled.png'));

    // 6. Confirm Bill Cancellation
    console.log('\n--- Step 6: Submit Bill Cancellation ---');
    await evalInPage(ws, `(() => {
      document.getElementById('cancel-bill-reason').value = 'Job Order Cancelled by Customer';
      document.getElementById('cancel-bill-remarks').value = 'Both receipts cancelled and refunded successfully.';
      window.BillingModule.submitCancelBill('INV/MSC1/2026/0095');
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const lastToastStep6 = await evalInPage(ws, `window._lastToast`);
    console.log('Toast message after bill cancellation:', lastToastStep6);
    assert.strictEqual(lastToastStep6.msg, 'Bill cancelled successfully.', 'Toast must match: “Bill cancelled successfully.”');
    assert.strictEqual(lastToastStep6.type, 'success');

    // 7. Verify bill status & audit trail in DB
    console.log('\n--- Step 7: Verify Bill Status & Audit History ---');
    const billState = await evalInPage(ws, `(() => {
      const bill = window.DB.getById('finalBills', 'INV/MSC1/2026/0095');
      return {
        status: bill.status,
        cancellation_reason: bill.cancellation_reason,
        cancellation_date_time: bill.cancellation_date_time,
        cancelled_by: bill.cancelled_by,
        auditCount: (bill.audit_history || []).length,
        hasAuditCancelBill: (bill.audit_history || []).some(a => a.activity_type === 'Cancel Bill'),
        hasAuditCancelReceipt: (bill.audit_history || []).some(a => a.activity_type === 'Cancel Receipt')
      };
    })()`);
    console.log('Bill status in DB:', billState);
    assert.strictEqual(billState.status, 'CANCELLED');
    assert.strictEqual(billState.hasAuditCancelBill, true);
    assert.strictEqual(billState.hasAuditCancelReceipt, true);
    assert.ok(billState.cancellation_date_time, 'Cancellation date time must be present');
    assert.ok(billState.cancelled_by, 'Cancelled by must be present');

    await captureScreenshot(ws, path.join(artifactDir, 'bill_cancelled_queue_screen_verified.png'));

    console.log('\nSUCCESS: All receipt and bill cancellation confirmation messages and workflow verified completely!');

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 1500);

