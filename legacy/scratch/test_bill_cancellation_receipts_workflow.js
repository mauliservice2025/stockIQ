const { execFile } = require('child_process');
const fs = require('fs');
const assert = require('assert');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-cancel-bill-receipts-profile';

if (fs.existsSync(profileDir)) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
}

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9258',
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
    console.log('Connecting to Edge via CDP on port 9258...');
    const listRes = await fetch('http://127.0.0.1:9258/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    for (let i = 0; i < 30; i++) {
      const isReady = await evalInPage(ws, 'Boolean(window.DB && window.DB.data && window.BillingModule)');
      if (isReady) break;
      await new Promise(r => setTimeout(r, 400));
    }

    console.log('Page ready. Setting up test data for Bill Cancellation with Receipts...');

    await evalInPage(ws, `(() => {
      const today = '2026-10-29';

      // 1. Paid Bill with 2 Active Receipts
      const billWithReceipts = {
        id: 'INV/MSC1/2026/0070',
        invoice_no: 'INV/MSC1/2026/0070',
        bill_no: 'INV/MSC1/2026/0070',
        bill_date: today,
        created_at: today + 'T10:00:00Z',
        job_card_no: 'JC/MSC1/2026/0088',
        estimate_no: 'EST/MSC1/2026/0045',
        customer_name: 'Rajesh Sharma',
        customer_cin: 'CIN/MSC1/2026/000088',
        phone: '9876543210',
        vehicle_reg_no: 'MH12AB1234',
        vehicle_model: 'Honda City',
        sub_total: 2500,
        discount: 0,
        tax_total: 0,
        grand_total: 2500,
        net_payable: 2500,
        amount_paid: 2500,
        amount_received: 2500,
        balance_amount: 0,
        status: 'FINAL',
        payment_mode: 'SPLIT',
        payment_status: 'PAID',
        items: [
          { code: 'SRV-01', description: 'Major Engine Service', qty: 1, rate: 1500, total: 1500, type: 'LABOUR' },
          { code: 'PRT-02', description: 'Engine Oil Synth', qty: 1, rate: 1000, total: 1000, type: 'PART', stock_permanently_deducted: true }
        ],
        payment_history: [
          { receipt_no: 'RCPT/2026/000101', date: today, mode: 'UPI', amount: 1500, notes: 'Advance via GPay' },
          { receipt_no: 'RCPT/2026/000102', date: today, mode: 'Cash', amount: 1000, notes: 'Balance in cash' }
        ]
      };

      // 2. Receipts in paymentReceipts collection
      const receipt1 = {
        id: 'RCPT-101',
        receipt_no: 'RCPT/2026/000101',
        receipt_date: today,
        payment_date: today,
        date: today,
        bill_id: 'INV/MSC1/2026/0070',
        invoice_no: 'INV/MSC1/2026/0070',
        customer_name: 'Rajesh Sharma',
        amount: 1500,
        amount_paid: 1500,
        payment_mode: 'UPI',
        status: 'ACTIVE',
        notes: 'Advance via GPay'
      };

      const receipt2 = {
        id: 'RCPT-102',
        receipt_no: 'RCPT/2026/000102',
        receipt_date: today,
        payment_date: today,
        date: today,
        bill_id: 'INV/MSC1/2026/0070',
        invoice_no: 'INV/MSC1/2026/0070',
        customer_name: 'Rajesh Sharma',
        amount: 1000,
        amount_paid: 1000,
        payment_mode: 'Cash',
        status: 'ACTIVE',
        notes: 'Balance in cash'
      };

      // 3. Unpaid Bill with 0 Receipts
      const billZeroReceipts = {
        id: 'INV/MSC1/2026/0071',
        invoice_no: 'INV/MSC1/2026/0071',
        bill_no: 'INV/MSC1/2026/0071',
        bill_date: today,
        created_at: today + 'T10:30:00Z',
        job_card_no: 'JC/MSC1/2026/0089',
        estimate_no: 'EST/MSC1/2026/0046',
        customer_name: 'Amit Verma',
        customer_cin: 'CIN/MSC1/2026/000089',
        phone: '9811122233',
        vehicle_reg_no: 'MH14XY9999',
        vehicle_model: 'Hyundai Creta',
        sub_total: 1200,
        discount: 0,
        tax_total: 0,
        grand_total: 1200,
        net_payable: 1200,
        amount_paid: 0,
        amount_received: 0,
        balance_amount: 1200,
        status: 'FINAL',
        payment_mode: 'Cash',
        payment_status: 'PENDING',
        items: [
          { code: 'SRV-02', description: 'General Inspection', qty: 1, rate: 1200, total: 1200, type: 'LABOUR' }
        ],
        payment_history: []
      };

      window.DB.upsert('finalBills', billWithReceipts);
      window.DB.upsert('finalBills', billZeroReceipts);
      window.DB.upsert('paymentReceipts', receipt1);
      window.DB.upsert('paymentReceipts', receipt2);

      window.BillingModule.render();
      return true;
    })()`);

    console.log('Test data initialized.');

    // TEST 1: Open cancel bill on bill with 2 active receipts
    console.log('\n--- Step 1: Open Cancel Bill Modal on Paid Bill ---');
    await evalInPage(ws, `window.BillingModule.showCancelBillModal('INV/MSC1/2026/0070')`);
    await new Promise(r => setTimeout(r, 600));

    const modalTitle = await evalInPage(ws, `document.getElementById('global-modal-title')?.innerText`);
    console.log('Modal title:', modalTitle);
    assert(modalTitle && modalTitle.includes('Receipts Associated with'), 'Expected Receipts modal to be shown');

    // Check table headers & contents
    const receiptRowsCount = await evalInPage(ws, `document.querySelectorAll('#global-modal-container .data-table tbody tr').length`);
    console.log('Number of receipts displayed in modal:', receiptRowsCount);
    assert.strictEqual(receiptRowsCount, 2, 'Should display exactly 2 receipts in modal table');

    const proceedBtnDisabled = await evalInPage(ws, `document.getElementById('btn-proceed-cancel-bill').disabled`);
    console.log('Is "Proceed to Cancel Bill" disabled while receipts active?:', proceedBtnDisabled);
    assert.strictEqual(proceedBtnDisabled, true, 'Proceed button MUST be disabled when active receipts exist');

    // Capture screenshot 1: Receipts modal with active receipts
    const ss1 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const ss1Path = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\bill_cancel_receipts_modal_active.png';
    fs.writeFileSync(ss1Path, Buffer.from(ss1.data, 'base64'));
    console.log('Captured screenshot 1:', ss1Path);

    // TEST 2: Cancel first receipt
    console.log('\n--- Step 2: Cancel First Receipt (RCPT/2026/000101) ---');
    await evalInPage(ws, `window.BillingModule.showCancelReceiptModal('RCPT/2026/000101', 'INV/MSC1/2026/0070')`);
    await new Promise(r => setTimeout(r, 400));
    await evalInPage(ws, `(() => {
      document.getElementById('cancel-receipt-reason').value = 'Bill Cancellation / Customer Withdrawal';
      document.getElementById('cancel-receipt-remarks').value = 'Reversed UPI collection';
      window.BillingModule.submitCancelReceipt('RCPT/2026/000101', 'INV/MSC1/2026/0070');
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const proceedBtnStillDisabled = await evalInPage(ws, `document.getElementById('btn-proceed-cancel-bill').disabled`);
    console.log('Is "Proceed to Cancel Bill" disabled after cancelling 1 of 2 receipts?:', proceedBtnStillDisabled);
    assert.strictEqual(proceedBtnStillDisabled, true, 'Proceed button MUST remain disabled when 1 active receipt remains');

    // TEST 3: Cancel second receipt
    console.log('\n--- Step 3: Cancel Second Receipt (RCPT/2026/000102) ---');
    await evalInPage(ws, `window.BillingModule.showCancelReceiptModal('RCPT/2026/000102', 'INV/MSC1/2026/0070')`);
    await new Promise(r => setTimeout(r, 400));
    await evalInPage(ws, `(() => {
      document.getElementById('cancel-receipt-reason').value = 'Payment Reversed / Refunded to Customer';
      document.getElementById('cancel-receipt-remarks').value = 'Cash refunded to customer';
      window.BillingModule.submitCancelReceipt('RCPT/2026/000102', 'INV/MSC1/2026/0070');
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const proceedBtnNowEnabled = !(await evalInPage(ws, `document.getElementById('btn-proceed-cancel-bill').disabled`));
    console.log('Is "Proceed to Cancel Bill" enabled after cancelling ALL receipts?:', proceedBtnNowEnabled);
    assert.strictEqual(proceedBtnNowEnabled, true, 'Proceed button MUST be ENABLED once all receipts are cancelled');

    // Capture screenshot 2: Receipts modal with all receipts cancelled
    const ss2 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const ss2Path = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\bill_cancel_receipts_modal_all_cancelled.png';
    fs.writeFileSync(ss2Path, Buffer.from(ss2.data, 'base64'));
    console.log('Captured screenshot 2:', ss2Path);

    // TEST 4: Proceed to Cancel Bill Reason Modal
    console.log('\n--- Step 4: Proceed to Bill Cancellation Reason Modal ---');
    await evalInPage(ws, `document.getElementById('btn-proceed-cancel-bill').click()`);
    await new Promise(r => setTimeout(r, 600));

    const reasonModalHeader = await evalInPage(ws, `document.getElementById('global-modal-title')?.innerText`);
    console.log('Cancellation Reason Modal Header:', reasonModalHeader);
    assert(reasonModalHeader && reasonModalHeader.includes('Cancel Bill'), 'Expected Cancel Bill modal');

    // Capture screenshot 3: Bill Cancellation Reason modal
    const ss3 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const ss3Path = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\bill_cancel_reason_modal.png';
    fs.writeFileSync(ss3Path, Buffer.from(ss3.data, 'base64'));
    console.log('Captured screenshot 3:', ss3Path);

    // TEST 5: Submit Bill Cancellation with mandatory reason
    console.log('\n--- Step 5: Submit Bill Cancellation ---');
    await evalInPage(ws, `(() => {
      document.getElementById('cancel-bill-reason').value = 'Job Order Cancelled by Customer';
      document.getElementById('cancel-bill-remarks').value = 'All linked receipts successfully cancelled and refunded.';
      window.BillingModule.submitCancelBill('INV/MSC1/2026/0070');
    })()`);
    await new Promise(r => setTimeout(r, 800));

    // Verify bill is now CANCELLED in DB
    const cancelledBill = await evalInPage(ws, `window.DB.getById('finalBills', 'INV/MSC1/2026/0070')`);
    console.log('Bill status in DB:', cancelledBill.status);
    assert.strictEqual(cancelledBill.status, 'CANCELLED', 'Bill status must be CANCELLED');
    console.log('Bill cancellation reason:', cancelledBill.cancellation_reason);
    console.log('Bill audit action:', cancelledBill.audit_history[cancelledBill.audit_history.length - 1].action);

    // Open Bill List tab to view cancelled bill
    await evalInPage(ws, `(() => {
      window.BillingModule.activeSubTab = 'BILL_LIST';
      window.BillingModule.render();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot 4: Bill List showing status Bill Cancelled
    const ss4 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const ss4Path = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\bill_cancelled_status_verified.png';
    fs.writeFileSync(ss4Path, Buffer.from(ss4.data, 'base64'));
    console.log('Captured screenshot 4:', ss4Path);

    // TEST 6: Test Unpaid Bill with 0 Receipts - routes directly to Reason modal
    console.log('\n--- Step 6: Test Bill with 0 Receipts (INV/MSC1/2026/0071) ---');
    await evalInPage(ws, `window.BillingModule.showCancelBillModal('INV/MSC1/2026/0071')`);
    await new Promise(r => setTimeout(r, 500));
    const zeroModalHeader = await evalInPage(ws, `document.getElementById('global-modal-title')?.innerText`);
    console.log('Direct Reason Modal Header for zero-receipt bill:', zeroModalHeader);
    assert(zeroModalHeader && zeroModalHeader.includes('Cancel Bill'), 'Should directly open Reason modal for bill with 0 receipts');

    console.log('\n================================================================');
    console.log('ALL BILL CANCELLATION WITH RECEIPTS WORKFLOW TESTS PASSED!');
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
