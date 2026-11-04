const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-live-bill-profile';
const artifactDir = 'C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb';

if (fs.existsSync(profileDir)) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
}

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9295',
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
    const listRes = await fetch('http://127.0.0.1:9295/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000')) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    for (let i = 0; i < 30; i++) {
      const isReady = await evalInPage(ws, 'Boolean(window.DB && window.BillingModule)');
      if (isReady) break;
      await new Promise(r => setTimeout(r, 400));
    }

    // Create an estimate and approved Job Card, convert to draft bill, and verify timestamp and position
    const creationResult = await evalInPage(ws, `(() => {
      const jc = {
        id: 'JC-LIVE-001',
        job_card_no: 'JC/MSC1/2026/0099',
        date: window.BillingModule.getTodayDateStr(),
        customer_name: 'Pooja Kulkarni',
        customer_cin: 'CIN/MSC1/2026/000099',
        customer_mobile: '9822334455',
        vehicle_reg_no: 'MH12PQ9999',
        vehicle_model: 'Hero Splendor Plus',
        status: 'READY_FOR_BILLING'
      };
      window.DB.upsert('jobCards', jc);

      const est = {
        id: 'EST-LIVE-001',
        estimate_no: 'EST/MSC1/2026/0099',
        job_card_id: jc.id,
        job_card_no: jc.job_card_no,
        customer_name: jc.customer_name,
        customer_cin: jc.customer_cin,
        customer_mobile: jc.customer_mobile,
        vehicle_reg_no: jc.vehicle_reg_no,
        vehicle_model: jc.vehicle_model,
        status: 'CUSTOMER_APPROVED',
        subtotal: 1500,
        estimated_total: 1500,
        items: [{ id: 'ITM-1', name: 'General Service', type: 'LABOUR', qty: 1, rate: 1500, amount: 1500 }]
      };
      window.DB.upsert('billingEstimates', est);

      // Convert estimate to draft bill
      window.BillingModule.convertEstimateToDraftBill(est);
      window.BillingModule.refresh();

      const queue = window.BillingModule.getFilteredCustomerBillingQueue();
      const topBill = queue[0];
      return {
        topBillId: topBill ? topBill.id : null,
        topBillNo: topBill ? (topBill.invoice_no || topBill.draft_bill_no) : null,
        topCreatedAt: topBill ? topBill.created_at : null,
        topFormattedDateTime: topBill ? window.BillingModule.formatBillDateTime(topBill) : null
      };
    })()`);

    console.log('Live Bill Creation Result:', creationResult);
    if (!creationResult.topCreatedAt || !creationResult.topFormattedDateTime) {
      throw new Error('Newly created bill is missing created_at or formatted date/time!');
    }

    console.log('LIVE CREATION TEST PASSED!');
    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 2500);

