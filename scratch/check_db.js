const http = require('http');

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(p => p.type === 'page' && p.url.includes('localhost:3000'));
          if (page) resolve(page.webSocketDebuggerUrl);
          else reject(new Error('No ISCM page found'));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    const wsUrl = await getWsUrl();
    const ws = new WebSocket(wsUrl);
    let id = 1;
    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const curId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === curId) {
            ws.removeEventListener('message', handler);
            if (msg.error) rej(msg.error);
            else res(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    ws.onopen = async () => {
      const evalRes = await send('Runtime.evaluate', {
        expression: `JSON.stringify({
          draftBills: (window.DB.getAll('draftBills') || []).map(b => ({ id: b.id, inv: b.invoice_no, draft: b.draft_bill_no, date: b.date, inv_date: b.invoice_date, created_at: b.created_at, updated_at: b.updated_at })),
          finalBills: (window.DB.getAll('finalBills') || []).map(b => ({ id: b.id, inv: b.invoice_no, date: b.date, inv_date: b.invoice_date, created_at: b.created_at, updated_at: b.updated_at }))
        }, null, 2)`,
        returnByValue: true
      });
      console.log('DB Bills:', evalRes.result.value);
      ws.close();
      process.exit(0);
    };
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
