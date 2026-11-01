const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9227',
  '--user-data-dir=C:\\temp\\edge-fav-ui-profile',
  '--window-size=1600,1000',
  'http://localhost:3000/#/vehicle-compatibility'
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
    const listRes = await fetch('http://127.0.0.1:9227/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    if (!pageTab) {
      console.error('Page tab not found');
      return;
    }

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(res => ws.addEventListener('open', res));
    console.log('Connected to CDP WebSocket');

    // 1. Wait a moment for page init
    await new Promise(r => setTimeout(r, 1000));

    // 2. Mark Yezdi Scrambler (VM-YEZ-01) and Yamaha Ray ZR 125 (VM-YAM-03) as favourites
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        window.State.toggleVehicleModelFavourite('VM-YEZ-01');
        window.State.toggleVehicleModelFavourite('VM-YAM-03');
        if (window.ItemSetupModule) window.ItemSetupModule.refresh();
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // Capture screenshot: Favourites marked in Vehicle Compatibility list
    const snap1 = await sendCdp(ws, 'Page.captureScreenshot');
    fs.writeFileSync('D:\\Projects\\ISCM\\favourite_models_marked.png', Buffer.from(snap1.data, 'base64'));
    console.log('Saved D:\\Projects\\ISCM\\favourite_models_marked.png');

    // 3. Filter only favourites
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        if (window.ItemSetupModule) window.ItemSetupModule.setVehicleFavFilter('FAV');
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // Capture screenshot: Filtered list showing only favourites
    const snap2 = await sendCdp(ws, 'Page.captureScreenshot');
    fs.writeFileSync('D:\\Projects\\ISCM\\favourite_models_filtered.png', Buffer.from(snap2.data, 'base64'));
    console.log('Saved D:\\Projects\\ISCM\\favourite_models_filtered.png');

    // 4. Reset filter and navigate to Job Cards modal to inspect dropdown
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        window.ItemSetupModule.resetVehicleFilters();
        location.hash = '#/job-cards';
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Open Job Card modal and trigger vehicle model dropdown
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        window.BillingModule.showNewJobCardModal();
        setTimeout(() => {
          const input = document.getElementById('new-jc-model-search');
          if (input) {
            window.BillingModule.openVehicleModelDropdown();
          }
        }, 300);
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture screenshot: Job Card modal with favourites pinned at top of dropdown
    const snap3 = await sendCdp(ws, 'Page.captureScreenshot');
    fs.writeFileSync('D:\\Projects\\ISCM\\job_card_favourite_dropdown.png', Buffer.from(snap3.data, 'base64'));
    console.log('Saved D:\\Projects\\ISCM\\job_card_favourite_dropdown.png');

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('CDP Error:', err);
  } finally {
    proc.kill();
  }
}, 2000);

