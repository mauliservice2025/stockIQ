const { execFile } = require('child_process');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9291',
  'http://localhost:3000/#/customer-billing'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9291/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000')) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    const sendCdp = (method, params = {}) => new Promise((resolve, reject) => {
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

    const evalInPage = async (exp) => {
      const res = await sendCdp('Runtime.evaluate', { expression: exp, returnByValue: true, awaitPromise: true });
      return res.result ? res.result.value : undefined;
    };

    for (let i = 0; i < 20; i++) {
      const ok = await evalInPage('Boolean(window.DB && window.DB.data && window.BillingModule)');
      if (ok) break;
      await new Promise(r => setTimeout(r, 300));
    }

    const info = await evalInPage(`(() => {
      const fb = (window.DB.data.finalBills || []);
      const db = (window.DB.data.draftBills || []);
      const allQueued = window.BillingModule.getAllBillsForSearch();
      return {
        finalBills: fb.map(b => ({
          id: b.id,
          invoice_no: b.invoice_no,
          bill_no: b.bill_no,
          draft_bill_id: b.draft_bill_id,
          draft_bill_no: b.draft_bill_no,
          status: b.status,
          amount_paid: b.amount_paid,
          balance_due: b.balance_due,
          payment_mode: b.payment_mode
        })),
        draftBills: db.map(b => ({
          id: b.id,
          invoice_no: b.invoice_no,
          bill_no: b.bill_no,
          draft_bill_id: b.draft_bill_id,
          draft_bill_no: b.draft_bill_no,
          final_bill_id: b.final_bill_id,
          status: b.status,
          amount_paid: b.amount_paid,
          balance_due: b.balance_due,
          payment_mode: b.payment_mode
        })),
        allQueued: allQueued.map(b => ({
          id: b.id,
          recordType: b.recordType,
          invoice_no: b.invoice_no,
          bill_no: b.bill_no,
          draft_bill_id: b.draft_bill_id,
          status: b.status,
          amount_paid: b.amount_paid,
          balance_amount: b.balance_amount,
          payment_mode: b.payment_mode
        }))
      };
    })()`);

    console.log('DB INFO:', JSON.stringify(info, null, 2));

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    try { proc.kill(); } catch (err) {}
    process.exit(1);
  }
}, 3000);

