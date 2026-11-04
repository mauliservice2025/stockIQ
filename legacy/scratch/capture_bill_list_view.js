const { execFile } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-bill-list-visual-profile-2';

if (fs.existsSync(profileDir)) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
}

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9274',
  `--user-data-dir=${profileDir}`,
  '--window-size=1600,1050',
  'http://localhost:3000/#/bill-list'
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
    const listRes = await fetch('http://127.0.0.1:9274/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    for (let i = 0; i < 30; i++) {
      const isReady = await evalInPage(ws, 'Boolean(window.DB && window.DB.data && window.BillingModule)');
      if (isReady) break;
      await new Promise(r => setTimeout(r, 400));
    }

    await evalInPage(ws, `(() => {
      const today = '2026-10-29';

      // Base bill: cancelled and superseded
      const baseBill = {
        id: 'INV/MSC1/2026/0100',
        invoice_no: 'INV/MSC1/2026/0100',
        bill_no: 'INV/MSC1/2026/0100',
        bill_date: today,
        created_at: '2026-10-29T08:30:00.000Z',
        created_by: 'Pravin Patil (System Administrator)',
        job_card_no: 'JC/MSC1/2026/0100',
        estimate_no: 'EST/MSC1/2026/0060',
        customer_name: 'Anita Sharma',
        customer_cin: 'CIN/MSC1/2026/000100',
        phone: '9890112233',
        vehicle_reg_no: 'MH12CD4321',
        vehicle_model: 'Hyundai i20',
        sub_total: 4000,
        discount: 0,
        tax_total: 0,
        grand_total: 4000,
        net_payable: 4000,
        amount_paid: 0,
        amount_received: 0,
        balance_amount: 4000,
        balance_due: 4000,
        status: 'CANCELLED',
        cancellation_reason: 'Client requested major revisions',
        payment_mode: 'Cash',
        payment_status: 'UNPAID',
        is_reopened: true,
        has_subsequent_revision: true,
        reopened_to_revision_no: 'INV/MSC1/2026/0100-R1',
        items: [
          { code: 'SRV-01', description: 'Periodic Maintenance Service', qty: 1, rate: 3000, total: 3000, type: 'LABOUR' }
        ]
      };

      // R1 revision: cancelled, eligible for reopening
      const r1Bill = {
        id: 'INV/MSC1/2026/0100-R1',
        invoice_no: 'INV/MSC1/2026/0100-R1',
        bill_no: 'INV/MSC1/2026/0100-R1',
        original_bill_id: 'INV/MSC1/2026/0100',
        original_bill_no: 'INV/MSC1/2026/0100',
        revision_no: 1,
        is_revision: true,
        bill_date: today,
        created_at: '2026-10-29T09:15:00.000Z',
        created_by: 'Pravin Patil (System Administrator)',
        job_card_no: 'JC/MSC1/2026/0100',
        estimate_no: 'EST/MSC1/2026/0060',
        customer_name: 'Anita Sharma',
        customer_cin: 'CIN/MSC1/2026/000100',
        phone: '9890112233',
        vehicle_reg_no: 'MH12CD4321',
        vehicle_model: 'Hyundai i20',
        sub_total: 4800,
        discount: 0,
        tax_total: 0,
        grand_total: 4800,
        net_payable: 4800,
        amount_paid: 0,
        amount_received: 0,
        balance_amount: 4800,
        balance_due: 4800,
        status: 'CANCELLED',
        cancellation_reason: 'Add-on AC condenser flush required',
        payment_mode: 'Cash',
        payment_status: 'UNPAID',
        is_reopened: false,
        has_subsequent_revision: false,
        items: [
          { code: 'SRV-01', description: 'Periodic Maintenance Service', qty: 1, rate: 3000, total: 3000, type: 'LABOUR' },
          { code: 'PRT-02', description: 'Brake Pads Set Front', qty: 1, rate: 1800, total: 1800, type: 'PART', stock_permanently_deducted: false }
        ]
      };

      window.DB.upsert('finalBills', baseBill);
      window.DB.upsert('finalBills', r1Bill);

      window.BillingModule.activeTab = 'FINAL_BILLS';
      window.BillingModule.billListFromDate = '2026-10-01';
      window.BillingModule.billListToDate = '2026-10-31';
      window.BillingModule.billListSearchTerm = '';
      window.BillingModule.billListStatusFilter = 'ALL';
      window.BillingModule.refresh();
    })()`);

    await new Promise(r => setTimeout(r, 600));

    await evalInPage(ws, `(() => {
      const container = document.querySelector('.table-responsive') || document.querySelector('div[style*="overflow-x: auto"]');
      if (container) container.scrollLeft = 9999;
    })()`);

    await new Promise(r => setTimeout(r, 200));

    const shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/reopen_button_bill_list_view.png', Buffer.from(shot.data, 'base64'));
    console.log('Captured reopen_button_bill_list_view.png');

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 3000);
