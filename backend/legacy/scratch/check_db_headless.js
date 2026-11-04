const { execFile } = require('child_process');
const http = require('http');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-temp-check';

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9293',
  `--user-data-dir=${profileDir}`,
  'http://localhost:3000/#/customer-billing'
]);

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  await wait(3500);
  http.get('http://127.0.0.1:9293/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      const list = JSON.parse(data);
      const page = list.find(p => p.type === 'page');
      if (!page) { proc.kill(); process.exit(1); }
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              if (!window.DB) return 'NO_DB';
              const drafts = window.DB.getAll('draftBills') || [];
              const finals = window.DB.getAll('finalBills') || [];
              return JSON.stringify({ drafts, finals });
            })()`,
            returnByValue: true
          }
        }));
      };
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        console.log('DB Result:', msg.result.result.value);
        ws.close();
        proc.kill();
        process.exit(0);
      };
    });
  }).on('error', (err) => {
    console.error('Error:', err);
    proc.kill();
    process.exit(1);
  });
}

run();
