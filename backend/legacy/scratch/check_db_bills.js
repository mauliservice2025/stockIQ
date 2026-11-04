const { execFile } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9248',
  '--user-data-dir=C:\\temp\\edge-date-filter-profile2',
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
    const listRes = await fetch('http://127.0.0.1:9248/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    await new Promise(r => setTimeout(r, 1200));

    const debugInfo = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      const allDrafts = window.DB.getAll('draftBills') || [];
      const allFinal = window.DB.getAll('finalBills') || [];
      const allSearch = B.getAllBillsForSearch();
      return {
        draftCount: allDrafts.length,
        finalCount: allFinal.length,
        searchCount: allSearch.length,
        searchDates: allSearch.map(b => ({ id: b.id, date: b.date, recDate: B.getRecordDate(b) }))
      };
    })()`);
    console.log('DB Bills Info:', debugInfo);

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    proc.kill();
    process.exit(1);
  }
}, 1000);

