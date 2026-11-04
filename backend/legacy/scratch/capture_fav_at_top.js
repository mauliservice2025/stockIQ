const { execFile } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9230',
  '--user-data-dir=C:\\temp\\edge-fav-top-profile',
  '--window-size=1600,1000',
  'http://localhost:3000/#/dashboard'
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
    const listRes = await fetch('http://127.0.0.1:9230/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    if (!pageTab) {
      proc.kill();
      process.exit(1);
    }

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(res => ws.addEventListener('open', res));

    await new Promise(r => setTimeout(r, 1200));

    // Mark Honda Activa 6G as favourite
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        // Ensure Honda Activa 6G is favourite
        const all = window.DB.getAll('vehicleModels') || [];
        const activa = all.find(m => (m.name || '').includes('Activa'));
        if (activa) {
          window.DB.setVehicleModelFavourite('USR-001', activa.id, true);
        }
        window.BillingModule.showNewJobCardModal();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const input = document.getElementById('new-jc-model-search');
        if (input) input.focus();
        window.BillingModule.renderVehicleModelSearchResults('');
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot
    const snap = await sendCdp(ws, 'Page.captureScreenshot');
    const artifactPath = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\job_card_clean_with_favourite.png';
    fs.writeFileSync(artifactPath, Buffer.from(snap.data, 'base64'));
    console.log('Saved screenshot to:', artifactPath);

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (e) {
    console.error(e);
    proc.kill();
    process.exit(1);
  }
}, 1500);

