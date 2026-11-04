const { execFile } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const edgeProfileDir = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\scratch\\edge-profile-test';
const cdpPort = 9299;

const edgeProcess = execFile(edgePath, [
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${edgeProfileDir}`,
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,1000',
  'http://localhost:3000/#/billing-estimates'
]);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  await sleep(1500);
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json`);
      const list = await res.json();
      const page = list.find(p => p.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
    await sleep(500);
  }

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  await sleep(2000);

  await send('Runtime.evaluate', {
    expression: `(function() {
      const testEst = {
        id: 'EST-TEST-0037',
        estimate_no: 'EST/MSC1/2026/0037',
        job_card_id: 'JC/MSC1/2026/0058',
        job_card_no: 'JC/MSC1/2026/0058',
        plant_id: 'PLANT-01',
        customer_name: 'Sanket Patil',
        customer_mobile: '8698431900',
        customer_cin: 'CIN/MSC/2026/000050',
        vehicle_reg_no: 'MH14BH4335',
        vehicle_model: 'Hero Splendor Plus XTEC',
        odometer_km: '0',
        service_type: 'General Service',
        status: 'SUBMITTED',
        complaints: 'Servicing',
        customer_complaints: 'Servicing',
        terms_and_remarks: 'Estimate for Job Card JC/MSC1/2026/0058. Valid for 7 days. Genuine OEM parts. Pending customer approval.',
        subtotal: 549,
        discount_amount: 0,
        tax_rate: 0,
        tax_amount: 0,
        estimated_total: 549,
        items: [
          { item_code: '2W-SPR-ENGINE-VALVE-SET-007', name: 'Engine Valve Set', type: 'Part', qty: 1, rate: 150, amount: 150 },
          { item_code: 'LBR-001', name: 'General Service Labour', type: 'Labour', qty: 1, rate: 399, amount: 399 }
        ]
      };
      window.DB.upsert('billingEstimates', testEst);
      window.BillingModule.showPrintEstimateModal(testEst.id);
    })()`
  });

  await sleep(800);

  const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
  const screenshotPath = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\estimate_pdf_modal_buttons_verified.png';
  fs.writeFileSync(screenshotPath, Buffer.from(screenshotRes.result.data, 'base64'));
  console.log('Saved modal screenshot to:', screenshotPath);

  edgeProcess.kill();
  process.exit(0);
}
main().catch(err => { console.error(err); try { edgeProcess.kill(); } catch (e) {} });

