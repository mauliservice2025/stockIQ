const { execFile } = require('child_process');
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
  'http://localhost:3000/#/billing-estimates'
]);

async function main() {
  await new Promise(r => setTimeout(r, 1500));
  const res = await fetch(`http://127.0.0.1:${cdpPort}/json`);
  const list = await res.json();
  const page = list.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, p = {}) => new Promise(resolve => {
    const cur = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === cur) { ws.removeEventListener('message', handler); resolve(d); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  const check = await send('Runtime.evaluate', {
    expression: `({
      hasNavigatorShare: typeof navigator.share === 'function',
      hasCanShare: typeof navigator.canShare === 'function'
    })`,
    returnByValue: true
  });
  console.log('Navigator share check:', check.result.result ? check.result.result.value : check);
  edgeProcess.kill();
}
main().catch(e => { console.error(e); try { edgeProcess.kill(); } catch(err){} process.exit(1); });

