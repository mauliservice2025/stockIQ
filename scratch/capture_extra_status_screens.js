const { execFile } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9254',
  '--user-data-dir=C:\\temp\\edge-status-extra-profile',
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
    const listRes = await fetch('http://127.0.0.1:9254/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    for (let i = 0; i < 30; i++) {
      const isReady = await evalInPage(ws, 'Boolean(window.DB && window.DB.data && window.BillingModule)');
      if (isReady) break;
      await new Promise(r => setTimeout(r, 400));
    }

    // Set sample data with Job Card, Estimate and Draft Bill
    await evalInPage(ws, `(() => {
      const jc = {
        id: 'JC/MSC1/2026/0051',
        job_card_no: 'JC/MSC1/2026/0051',
        date: '2026-10-29',
        customer_name: 'Rushi Dhiwar',
        customer_mobile: '8965435645',
        customer_cin: 'CIN/MSC1/2026/000043',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        service_type: 'General Service',
        status: 'ESTIMATE_PENDING'
      };
      window.DB.upsert('jobCards', jc);

      const db = {
        id: 'INV/MSC1/2026/0028',
        draft_bill_no: 'INV/MSC1/2026/0028',
        job_card_id: 'JC/MSC1/2026/0051',
        job_card_no: 'JC/MSC1/2026/0051',
        customer_name: 'Rushi Dhiwar',
        customer_mobile: '8965435645',
        customer_cin: 'CIN/MSC1/2026/000043',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        bill_date: '2026-10-29',
        status: 'DRAFT',
        net_payable: 1949,
        amount_paid: 0,
        balance_amount: 1949,
        items: [{ id: '1', name: 'General Service Labour', qty: 1, rate: 399, amount: 399 }]
      };
      window.DB.upsert('draftBills', db);

      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.customerBillingFromDate = 'ALL';
      window.BillingModule.customerBillingToDate = 'ALL';
      window.BillingModule.jobCardFromDate = 'ALL';
      window.BillingModule.jobCardToDate = 'ALL';
      window.BillingModule.refresh();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const ssBilling = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/standardized_status_customer_billing_verified.png', Buffer.from(ssBilling.data, 'base64'));

    // Navigate to Job Cards and open Job Card details modal
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/#/job-cards' });
    await new Promise(r => setTimeout(r, 800));
    await evalInPage(ws, `(() => {
      window.BillingModule.viewJobCard('JC/MSC1/2026/0051');
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const ssModal = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/standardized_status_job_card_modal_verified.png', Buffer.from(ssModal.data, 'base64'));

    console.log('Extra screenshots captured successfully!');
    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 1000);
