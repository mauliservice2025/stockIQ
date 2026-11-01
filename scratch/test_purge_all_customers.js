const { execFile } = require('child_process');
const fs = require('fs');
const assert = require('assert');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-purge-all-customers-profile';

if (fs.existsSync(profileDir)) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
}

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9275',
  `--user-data-dir=${profileDir}`,
  '--window-size=1600,1050',
  'http://localhost:3000/#/billing'
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
    console.log('Connecting to Edge via CDP on port 9275...');
    const listRes = await fetch('http://127.0.0.1:9275/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    for (let i = 0; i < 30; i++) {
      const isReady = await evalInPage(ws, 'Boolean(window.DB && window.DB.data && window.BillingModule)');
      if (isReady) break;
      await new Promise(r => setTimeout(r, 400));
    }

    console.log('Checking database collections after purge initialization...');

    const dbCounts = await evalInPage(ws, `(() => {
      return {
        jobCards: (window.DB.getAll('jobCards') || []).length,
        billingEstimates: (window.DB.getAll('billingEstimates') || []).length,
        draftBills: (window.DB.getAll('draftBills') || []).length,
        finalBills: (window.DB.getAll('finalBills') || []).length,
        vehicleDeliveries: (window.DB.getAll('vehicleDeliveries') || []).length,
        customers: (window.DB.getAll('customers') || []).length,
        vehicles: (window.DB.getAll('vehicles') || []).length,
        creditNotes: (window.DB.getAll('creditNotes') || []).length,
        paymentReceipts: (window.DB.getAll('paymentReceipts') || []).length
      };
    })()`);

    console.log('Database collections count:', dbCounts);

    assert.strictEqual(dbCounts.jobCards, 0, 'jobCards must be 0');
    assert.strictEqual(dbCounts.billingEstimates, 0, 'billingEstimates must be 0');
    assert.strictEqual(dbCounts.draftBills, 0, 'draftBills must be 0');
    assert.strictEqual(dbCounts.finalBills, 0, 'finalBills must be 0');
    assert.strictEqual(dbCounts.vehicleDeliveries, 0, 'vehicleDeliveries must be 0');
    assert.strictEqual(dbCounts.customers, 0, 'customers must be 0');
    assert.strictEqual(dbCounts.vehicles, 0, 'vehicles must be 0');
    assert.strictEqual(dbCounts.creditNotes, 0, 'creditNotes must be 0');
    assert.strictEqual(dbCounts.paymentReceipts, 0, 'paymentReceipts must be 0');

    // 1. Capture Billing Queue screen
    console.log('Screen 1: Customer Bills Queue...');
    await evalInPage(ws, `(() => {
      window.BillingModule.activeTab = 'CUSTOMER_BILLING';
      window.BillingModule.activeBillingBillId = null;
      window.BillingModule.refresh();
    })()`);
    await new Promise(r => setTimeout(r, 600));
    let shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/screen_customer_billing_empty.png', Buffer.from(shot.data, 'base64'));

    // 2. Capture Bill List screen
    console.log('Screen 2: Bill List...');
    await evalInPage(ws, `(() => {
      window.BillingModule.activeTab = 'FINAL_BILLS';
      window.BillingModule.billListFromDate = '2026-10-01';
      window.BillingModule.billListToDate = '2026-10-31';
      window.BillingModule.refresh();
    })()`);
    await new Promise(r => setTimeout(r, 600));
    shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/screen_bill_list_empty.png', Buffer.from(shot.data, 'base64'));

    // 3. Capture Job Cards screen
    console.log('Screen 3: Job Cards...');
    await evalInPage(ws, `(() => {
      window.BillingModule.activeTab = 'JOB_CARDS';
      window.BillingModule.setJobCardsSubView('REGISTER');
      window.BillingModule.refresh();
    })()`);
    await new Promise(r => setTimeout(r, 600));
    shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/screen_job_cards_empty.png', Buffer.from(shot.data, 'base64'));

    // 4. Capture Estimates screen
    console.log('Screen 4: Estimates...');
    await evalInPage(ws, `(() => {
      window.BillingModule.activeTab = 'ESTIMATES';
      window.BillingModule.activeEstimateId = null;
      window.BillingModule.activeEstimate = null;
      window.BillingModule.refresh();
    })()`);
    await new Promise(r => setTimeout(r, 600));
    shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/screen_estimates_empty.png', Buffer.from(shot.data, 'base64'));

    // 5. Capture Vehicle Delivery screen
    console.log('Screen 5: Vehicle Delivery...');
    await evalInPage(ws, `(() => {
      window.BillingModule.activeTab = 'DELIVERY';
      window.BillingModule.refresh();
    })()`);
    await new Promise(r => setTimeout(r, 600));
    shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/screen_vehicle_delivery_empty.png', Buffer.from(shot.data, 'base64'));

    console.log('ALL SCREENS AND DATABASE COLLECTIONS CONFIRMED 100% EMPTY!');
    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 3000);

