const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-estimate-pdf-profile-2';
const artifactDir = 'C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb';

if (fs.existsSync(profileDir)) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
}

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9289',
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

setTimeout(async () => {
  try {
    console.log('Connecting to Edge CDP on 9289...');
    const listRes = await fetch('http://127.0.0.1:9289/json');
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

    // 1. Setup sample estimate
    const estId = await evalInPage(ws, `(() => {
      let ests = window.DB.getAll('billingEstimates') || [];
      let est = ests.find(e => e.estimate_no === 'EST/MSC1/2026/0099');
      if (!est) {
        est = {
          id: 'est-pdf-demo-001',
          estimate_no: 'EST/MSC1/2026/0099',
          job_card_id: 'jc-demo-01',
          job_card_no: 'JC/MSC1/2026/0099',
          customer_name: 'Vikram Malhotra',
          customer_cin: 'CIN/MSC1/2026/000088',
          customer_mobile: '9876543210',
          vehicle_reg_no: 'MH12AB9999',
          vehicle_model: 'Honda Activa 6G',
          odometer_km: 12500,
          date: '2026-10-29',
          date_display: '29-10-2026',
          status: 'READY_FOR_APPROVAL',
          customer_complaints: 'Engine oil service, rear brake screeching, general checkup',
          items: [
            { type: 'PART', name: 'Engine Oil 10W-30 (1L)', qty: 1, rate: 450, amount: 450 },
            { type: 'LABOUR', name: 'General Service Labour', qty: 1, rate: 600, amount: 600 },
            { type: 'LABOUR', name: 'Brake Overhaul & Cleaning Labour', qty: 1, rate: 350, amount: 350 },
            { type: 'CONSUMABLE', name: 'Brake Cleaner Spray', qty: 1, rate: 150, amount: 150 }
          ],
          subtotal: 1550,
          discount_amount: 50,
          tax_rate: 18,
          tax_amount: 270,
          estimated_total: 1770,
          terms_and_remarks: 'Estimate valid for 7 days. Genuine Honda spares only.',
          audit_history: []
        };
        window.DB.insert('billingEstimates', est);
      }
      window.BillingModule.activeTab = 'ESTIMATES';
      window.BillingModule.selectEstimate(est.id);
      return est.id;
    })()`);

    await new Promise(r => setTimeout(r, 600));

    // Scroll down to action buttons
    await evalInPage(ws, `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })`);
    await new Promise(r => setTimeout(r, 300));

    // Capture 1: Workspace footer with PDF buttons
    let shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'estimate_workspace_with_pdf_buttons.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved estimate_workspace_with_pdf_buttons.png');

    // Capture 2: Print Quotation Modal with PDF button
    await evalInPage(ws, `window.BillingModule.showPrintEstimateModal('${estId}')`);
    await new Promise(r => setTimeout(r, 600));
    shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'estimate_print_modal_with_pdf_btn.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved estimate_print_modal_with_pdf_btn.png');

    // Close modal
    await evalInPage(ws, `window.State.closeModal()`);

    console.log('Updated screenshots completed successfully!');
    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error during CDP verification:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 3000);
