const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-dedup-profile';
const artifactDir = 'C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb';

if (fs.existsSync(profileDir)) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
}

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9292',
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
    console.log('Connecting to Edge CDP on 9292...');
    const listRes = await fetch('http://127.0.0.1:9292/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000')) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    // Wait for BillingModule & DB
    for (let i = 0; i < 30; i++) {
      const isReady = await evalInPage(ws, 'Boolean(window.DB && window.BillingModule)');
      if (isReady) break;
      await new Promise(r => setTimeout(r, 400));
    }

    // Set up the exact records from user's screenshot
    const setupResult = await evalInPage(ws, `(() => {
      const today = '2026-10-29';

      // 1. Original Cancelled Bill (Row 2 in user's image)
      const origBill = {
        id: 'INV/MSC1/2026/0029',
        invoice_no: 'INV/MSC1/2026/0029',
        bill_no: 'INV/MSC1/2026/0029',
        invoice_date: today,
        bill_date: today,
        date: today,
        job_card_no: 'JC/MSC1/2026/0052',
        estimate_no: 'EST/MSC1/2026/0031-R4',
        customer_name: 'Rushi Dhiwar',
        customer_cin: 'CIN/MSC1/2026/000044',
        customer_mobile: '9876543456',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        net_payable: 649,
        grand_total: 649,
        gross_amount: 649,
        discount_amount: 0,
        total_tax: 0,
        amount_paid: 0,
        amount_received: 0,
        balance_amount: 649,
        balance_due: 649,
        payment_mode: 'UPI + Cash',
        status: 'CANCELLED',
        cancellation_reason: 'Client requested change of parts',
        is_reopened: true,
        has_subsequent_revision: true,
        reopened_to_revision_no: 'INV/MSC1/2026/0029-R1'
      };

      // 2. Revised Final Bill with Payment of 49.00 (Row 1 in user's image)
      const revisedFinalBill = {
        id: 'INV-DBILL-0029-R1',
        draft_bill_id: 'DBILL-0029-R1',
        draft_bill_no: 'INV/MSC1/2026/0029-R1',
        invoice_no: 'INV/MSC1/2026/0029-R1',
        bill_no: 'INV/MSC1/2026/0029-R1',
        invoice_date: today,
        bill_date: today,
        date: today,
        job_card_no: 'JC/MSC1/2026/0052',
        estimate_no: 'EST/MSC1/2026/0031-R4',
        customer_name: 'Rushi Dhiwar',
        customer_cin: 'CIN/MSC1/2026/000044',
        customer_mobile: '9876543456',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        net_payable: 549,
        grand_total: 549,
        gross_amount: 549,
        discount_amount: 0,
        total_tax: 0,
        amount_paid: 49,
        amount_received: 49,
        balance_amount: 500,
        balance_due: 500,
        payment_mode: 'Cash + UPI',
        status: 'REVISED_PAYMENT_PENDING',
        is_revision: true,
        revision_no: 'R1',
        original_bill_id: 'INV/MSC1/2026/0029',
        original_bill_no: 'INV/MSC1/2026/0029'
      };

      // 3. Draft Bill that was created during Reopening (Row 3 in user's image)
      const revisedDraftBill = {
        id: 'DBILL-0029-R1',
        draft_bill_no: 'INV/MSC1/2026/0029-R1',
        invoice_no: 'INV/MSC1/2026/0029-R1',
        bill_no: 'INV/MSC1/2026/0029-R1',
        final_bill_id: 'INV-DBILL-0029-R1',
        date: today,
        draft_date: today,
        job_card_no: 'JC/MSC1/2026/0052',
        estimate_no: 'EST/MSC1/2026/0031-R4',
        customer_name: 'Rushi Dhiwar',
        customer_cin: 'CIN/MSC1/2026/000044',
        customer_mobile: '9876543456',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        net_payable: 549,
        grand_total: 549,
        gross_amount: 549,
        discount_amount: 0,
        total_tax: 0,
        amount_paid: 0,
        amount_received: 0,
        balance_amount: 549,
        balance_due: 549,
        payment_mode: 'UPI + Cash',
        status: 'REVISED_PAYMENT_PENDING',
        is_revision: true,
        revision_no: 'R1',
        original_bill_id: 'INV/MSC1/2026/0029',
        original_bill_no: 'INV/MSC1/2026/0029'
      };

      window.DB.upsert('finalBills', origBill);
      window.DB.upsert('finalBills', revisedFinalBill);
      window.DB.upsert('draftBills', revisedDraftBill);

      window.BillingModule.activeTab = 'CUSTOMER_BILLING';
      window.BillingModule.activeBillingBillId = null;
      window.BillingModule.customerBillingSearch = '';
      window.BillingModule.customerBillingStatusFilter = 'ALL';
      window.BillingModule.customerBillingFromDate = today;
      window.BillingModule.customerBillingToDate = today;
      window.BillingModule.customerBillingViewMode = 'TABLE';
      window.BillingModule.refresh();

      const queue = window.BillingModule.getFilteredCustomerBillingQueue();
      return {
        queueCount: queue.length,
        items: queue.map(b => ({
          id: b.id,
          invoice_no: b.invoice_no,
          bill_no: b.bill_no,
          draft_bill_no: b.draft_bill_no,
          amount_paid: b.amount_paid,
          balance_amount: b.balance_amount,
          status: b.status,
          recordType: b.recordType
        }))
      };
    })()`);

    console.log('Customer Bills Queue Setup Result:', JSON.stringify(setupResult, null, 2));

    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot
    const shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'customer_bills_queue_no_double_entry_verified.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved customer_bills_queue_no_double_entry_verified.png');

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error during CDP verification:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 3000);

