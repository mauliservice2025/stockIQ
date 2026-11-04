const { execFile } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9229',
  '--user-data-dir=C:\\temp\\edge-backdrop-test2',
  '--window-size=1600,1000',
  'http://localhost:3000/#/job-cards'
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

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9229/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    if (!pageTab) return;

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));
    await new Promise(r => setTimeout(r, 1000));

    // Open modal in Dark mode
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: 'window.BillingModule.showNewJobCardModal();'
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture Dark mode modal backdrop
    const snapDark = await sendCdp(ws, 'Page.captureScreenshot');
    fs.writeFileSync('D:\\Projects\\ISCM\\modal_backdrop_dark.png', Buffer.from(snapDark.data, 'base64'));

    // Switch to Light mode
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: "document.documentElement.setAttribute('data-theme', 'light');"
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture Light mode modal backdrop
    const snapLight = await sendCdp(ws, 'Page.captureScreenshot');
    fs.writeFileSync('D:\\Projects\\ISCM\\modal_backdrop_light.png', Buffer.from(snapLight.data, 'base64'));

    console.log('Screenshots captured successfully!');
  } catch (e) {
    console.error(e);
  } finally {
    proc.kill();
  }
}, 2000);

