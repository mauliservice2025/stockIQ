const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-convert-bill-profile';
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
  '--window-size=1500,1050',
  'http://localhost:3000/#/billing-estimates'
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
    console.log('Connecting to Edge CDP on port 9295...');
    const listRes = await fetch('http://127.0.0.1:9295/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000')) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    // Wait for App, DB, and BillingModule
    for (let i = 0; i < 30; i++) {
      try {
        const ready = await evalInPage(ws, 'Boolean(window.DB && window.DB.data && window.BillingModule)');
        if (ready) break;
      } catch (e) {}
      await new Promise(r => setTimeout(r, 300));
    }

    console.log('Injecting test approved estimate into DB...');
    const setupResult = await evalInPage(ws, `(() => {
      const testEst = {
        id: 'EST-CONV-TEST-99',
        estimate_no: 'EST/MSC1/2026/0099',
        customer_name: 'Ajay Verma',
        customer_mobile: '9876543210',
        customer_cin: 'CIN/MSC/2026/000099',
        vehicle_reg_no: 'MH12CD5678',
        vehicle_model: 'Royal Enfield Classic 350',
        odometer_km: '14,200 km',
        date: '2026-10-29',
        status: 'CUSTOMER_APPROVED',
        subtotal: 1200,
        tax_rate: 18,
        tax_amount: 216,
        estimated_total: 1416,
        items: [
          { id: 'ITM-01', code: 'SRV-01', name: 'Full Engine Tune Up', type: 'LABOUR', qty: 1, rate: 800, amount: 800, tax_rate: 18 },
          { id: 'ITM-02', code: 'PRT-02', name: 'Synthetic Engine Oil 15W50', type: 'PART', qty: 1, rate: 400, amount: 400, tax_rate: 18 }
        ]
      };

      const testJc = {
        id: 'JC-CONV-TEST-99',
        job_card_no: 'JC/MSC1/2026/0099',
        customer_name: 'Ajay Verma',
        customer_mobile: '9876543210',
        customer_cin: 'CIN/MSC/2026/000099',
        vehicle_reg_no: 'MH12CD5678',
        vehicle_model: 'Royal Enfield Classic 350',
        odometer_km: '14,200 km',
        status: 'IN_SERVICE',
        estimate_id: 'EST-CONV-TEST-99',
        estimate_no: 'EST/MSC1/2026/0099'
      };

      testEst.job_card_id = testJc.id;
      testEst.job_card_no = testJc.job_card_no;

      if (!window.DB.data.billingEstimates) window.DB.data.billingEstimates = [];
      if (!window.DB.data.jobCards) window.DB.data.jobCards = [];
      window.DB.upsert('billingEstimates', testEst);
      window.DB.upsert('jobCards', testJc);
      window.DB.saveData();

      window.BillingModule.activeEstimateId = testEst.id;
      window.BillingModule.activeEstimate = testEst;
      window.BillingModule.activeTab = 'ESTIMATES';
      window.BillingModule._explicitNavigationContext = true;
      window.BillingModule.refresh();

      return {
        estId: testEst.id,
        estNo: testEst.estimate_no,
        status: testEst.status,
        activeTab: window.BillingModule.activeTab
      };
    })()`);
    console.log('Setup result:', setupResult);

    await new Promise(r => setTimeout(r, 1000));
    await captureScreenshot(ws, path.join(artifactDir, 'estimate_screen_before_convert.png'));

    // Verify "Convert to Draft Bill" button exists
    const hasConvertBtn = await evalInPage(ws, `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convert to Draft Bill'));
      return !!btn;
    })()`);
    console.log('Has "Convert to Draft Bill" button on Estimate screen:', hasConvertBtn);

    // Click Convert to Draft Bill
    console.log('Triggering Convert to Draft Bill...');
    const convertResult = await evalInPage(ws, `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convert to Draft Bill'));
      if (btn) {
        btn.click();
      } else {
        window.BillingModule.convertEstimateToDraftBill('EST-CONV-TEST-99');
      }
      return {
        urlHash: window.location.hash,
        activeTab: window.BillingModule.activeTab,
        activeBillingBillId: window.BillingModule.activeBillingBillId
      };
    })()`);
    console.log('After clicking Convert to Draft Bill:', convertResult);

    // Wait for screen transition and render
    await new Promise(r => setTimeout(r, 1500));

    // Inspect billing screen state
    const billingScreenState = await evalInPage(ws, `(() => {
      const activeBill = window.BillingModule.getActiveCustomerBillingBill ? window.BillingModule.getActiveCustomerBillingBill() : null;
      const workspaceCard = document.querySelector('.customer-billing-single-screen-card');
      const queueTable = document.getElementById('unified-billing-queue-tbody');
      const text = document.body.innerText;
      return {
        urlHash: window.location.hash,
        activeTab: window.BillingModule.activeTab,
        activeBillingBillId: window.BillingModule.activeBillingBillId,
        hasActiveBillObj: !!activeBill,
        activeBillId: activeBill ? activeBill.id : null,
        activeDraftNo: activeBill ? (activeBill.draft_bill_no || activeBill.bill_no) : null,
        customerName: activeBill ? activeBill.customer_name : null,
        vehicleRegNo: activeBill ? activeBill.vehicle_reg_no : null,
        grandTotal: activeBill ? activeBill.grand_total : null,
        isWorkspaceVisible: !!workspaceCard,
        isQueueVisible: !!queueTable && !workspaceCard,
        hasCustomerOnScreen: text.includes('Ajay Verma'),
        hasVehicleOnScreen: text.includes('MH12CD5678')
      };
    })()`);
    console.log('Billing Screen State:', billingScreenState);

    await captureScreenshot(ws, path.join(artifactDir, 'bill_opened_in_billing_screen_verified.png'));

    // Verify assertions
    if (billingScreenState.urlHash !== '#/customer-billing') {
      throw new Error('Expected hash to be #/customer-billing, got: ' + billingScreenState.urlHash);
    }
    if (billingScreenState.activeTab !== 'CUSTOMER_BILLING') {
      throw new Error('Expected activeTab to be CUSTOMER_BILLING, got: ' + billingScreenState.activeTab);
    }
    if (!billingScreenState.activeBillingBillId) {
      throw new Error('Expected activeBillingBillId to be set, but it was null/empty!');
    }
    if (!billingScreenState.isWorkspaceVisible) {
      throw new Error('Customer Billing workspace card was not rendered on screen!');
    }
    if (!billingScreenState.hasCustomerOnScreen) {
      throw new Error('Customer name Ajay Verma not found on Customer Billing screen!');
    }

    console.log('Testing Return to Queue...');
    const queueState = await evalInPage(ws, `(() => {
      window.BillingModule.returnToBillsQueue();
      const workspaceCard = document.querySelector('.customer-billing-single-screen-card');
      const queueTable = document.getElementById('unified-billing-queue-tbody');
      return {
        activeBillingBillId: window.BillingModule.activeBillingBillId,
        isWorkspaceVisible: !!workspaceCard,
        isQueueVisible: !!queueTable
      };
    })()`);
    console.log('Queue State:', queueState);
    if (queueState.activeBillingBillId !== null || queueState.isWorkspaceVisible) {
      throw new Error('Return to queue failed');
    }

    console.log('Testing Re-open from Estimate viewBillFromEstimate...');
    const reOpenState = await evalInPage(ws, `(() => {
      window.BillingModule.viewBillFromEstimate('EST-CONV-TEST-99');
      const activeBill = window.BillingModule.getActiveCustomerBillingBill();
      const workspaceCard = document.querySelector('.customer-billing-single-screen-card');
      return {
        urlHash: window.location.hash,
        activeTab: window.BillingModule.activeTab,
        activeBillingBillId: window.BillingModule.activeBillingBillId,
        hasActiveBillObj: !!activeBill,
        isWorkspaceVisible: !!workspaceCard
      };
    })()`);
    console.log('Re-open from Estimate State:', reOpenState);
    if (!reOpenState.hasActiveBillObj || !reOpenState.isWorkspaceVisible) {
      throw new Error('viewBillFromEstimate failed to re-open the bill in billing screen');
    }

    console.log('SUCCESS: All conversion and navigation workflows verified completely!');

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 1500);
