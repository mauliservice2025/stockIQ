const { execFile } = require('child_process');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9244',
  '--user-data-dir=C:\\temp\\edge-bill-cancel-profile',
  'http://localhost:3000/#/customer-billing'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9244/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    function send(method, params = {}) {
      return new Promise((res) => {
        const id = Math.floor(Math.random() * 1000000);
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            res(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const B = window.BillingModule;
        const ests = (window.DB.getAll('billingEstimates') || []).map(e => ({ id: e.id, no: e.estimate_no, date: e.date, status: e.status }));
        const finals = (window.DB.getAll('finalBills') || []).map(f => ({ id: f.id, no: f.invoice_no, date: f.date || f.invoice_date, status: f.status }));
        const drafts = (window.DB.getAll('draftBills') || []).map(d => ({ id: d.id, no: d.draft_bill_no || d.invoice_no, date: d.date, status: d.status }));
        const activeEst = B.getActiveEstimate();
        const activeBill = B.getActiveCustomerBillingBill();
        return {
          today: B.getTodayDateStr(),
          estimatesCount: ests.length,
          estimates: ests,
          activeEstimateNo: activeEst ? activeEst.estimate_no : null,
          finalsCount: finals.length,
          finals: finals,
          draftsCount: drafts.length,
          drafts: drafts,
          activeBillNo: activeBill ? (activeBill.invoice_no || activeBill.draft_bill_no || activeBill.id) : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Result:', JSON.stringify(r.result.value, null, 2));
    ws.close();
    proc.kill();
    process.exit(0);
  } catch(e) {
    console.error(e);
    proc.kill();
    process.exit(1);
  }
}, 3000);
