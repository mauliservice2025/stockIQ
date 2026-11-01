const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9229',
  '--user-data-dir=C:\\temp\\edge-fav-fix-profile',
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
    const listRes = await fetch('http://127.0.0.1:9229/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    if (!pageTab) {
      console.error('Page tab not found');
      proc.kill();
      process.exit(1);
    }

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(res => ws.addEventListener('open', res));
    console.log('Connected to CDP WebSocket');

    // 1. Wait a moment for page init
    await new Promise(r => setTimeout(r, 1200));

    // 2. Open Job Card Modal and open dropdown
    console.log('Opening Job Card modal & dropdown...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        window.BillingModule.showNewJobCardModal();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const input = document.getElementById('new-jc-model-search');
        if (input) {
          input.focus();
        }
        window.BillingModule.renderVehicleModelSearchResults('');
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // 3. Inspect labels in dropdown
    const labelChecks = await sendCdp(ws, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const dropdown = document.getElementById('new-jc-model-dropdown');
          const text = dropdown ? dropdown.innerText : '';
          const html = dropdown ? dropdown.innerHTML : '';
          return {
            hasFavBanner: text.includes('FAVOURITE VEHICLES (QUICK ACCESS)'),
            hasOtherModelsBanner: text.includes('OTHER VEHICLE MODELS'),
            hasFavPill: html.includes('>FAV<'),
            optionsCount: dropdown ? dropdown.querySelectorAll('.jc-model-search-option').length : 0,
            firstOptionText: dropdown && dropdown.querySelector('.jc-model-search-option') ? dropdown.querySelector('.jc-model-search-option').innerText.trim() : ''
          };
        })()
      `
    });
    console.log('Label checks before clicking star:', labelChecks.result.value);

    // 4. Click the star button on the first or second option
    console.log('Clicking the star button to toggle favourite inside the open modal dropdown...');
    const clickStarRes = await sendCdp(ws, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const dropdown = document.getElementById('new-jc-model-dropdown');
          const firstOptionBtn = dropdown ? dropdown.querySelector('.jc-model-search-option button') : null;
          if (!firstOptionBtn) return { error: 'Button not found' };
          firstOptionBtn.click();
          return { clicked: true };
        })()
      `
    });
    console.log('Clicked star:', clickStarRes.result.value);

    // Wait for any events / potential route changes
    await new Promise(r => setTimeout(r, 1000));

    // 5. CRITICAL VERIFICATION: Is the modal STILL OPEN? Did it navigate to main screen?
    const checkAfterClick = await sendCdp(ws, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const overlay = document.getElementById('global-modal-overlay');
          const dropdown = document.getElementById('new-jc-model-dropdown');
          const text = dropdown ? dropdown.innerText : '';
          const html = dropdown ? dropdown.innerHTML : '';
          return {
            isModalStillOpen: overlay && overlay.classList.contains('active'),
            currentHash: window.location.hash,
            hasFavBanner: text.includes('FAVOURITE VEHICLES (QUICK ACCESS)'),
            hasOtherModelsBanner: text.includes('OTHER VEHICLE MODELS'),
            hasFavPill: html.includes('>FAV<'),
            firstOptionText: dropdown && dropdown.querySelector('.jc-model-search-option') ? dropdown.querySelector('.jc-model-search-option').innerText.trim() : ''
          };
        })()
      `
    });
    console.log('Check after clicking star:', checkAfterClick.result.value);

    // Capture screenshot of the modal dropdown
    const snap1 = await sendCdp(ws, 'Page.captureScreenshot');
    const artifactPath = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\job_card_clean_dropdown.png';
    fs.writeFileSync(artifactPath, Buffer.from(snap1.data, 'base64'));
    console.log('Screenshot saved to:', artifactPath);

    // 6. Test Vehicle Compatibility page
    console.log('Testing Vehicle Compatibility page (#/vehicle-compatibility)...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        window.State.closeModal();
        window.location.hash = '#/vehicle-compatibility';
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const checkCompatBefore = await sendCdp(ws, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const rows = document.querySelectorAll('tr[data-vehicle-id]');
          const hasRedundantBadge = document.body.innerHTML.includes('⭐ FAVOURITE</span>');
          const starBtn = document.querySelector('.fav-model-star-btn');
          if (starBtn) starBtn.click();
          return {
            rowCount: rows.length,
            hasRedundantBadge: hasRedundantBadge,
            clickedStar: !!starBtn
          };
        })()
      `
    });
    console.log('Compat page before click:', checkCompatBefore.result.value);

    await new Promise(r => setTimeout(r, 800));

    const checkCompatAfter = await sendCdp(ws, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          return {
            currentHash: window.location.hash,
            isStillOnCompatPage: window.location.hash === '#/vehicle-compatibility',
            hasRedundantBadge: document.body.innerHTML.includes('⭐ FAVOURITE</span>')
          };
        })()
      `
    });
    console.log('Compat page after clicking star in table:', checkCompatAfter.result.value);

    const snap2 = await sendCdp(ws, 'Page.captureScreenshot');
    const compatArtifactPath = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\vehicle_compat_clean.png';
    fs.writeFileSync(compatArtifactPath, Buffer.from(snap2.data, 'base64'));
    console.log('Compat screenshot saved to:', compatArtifactPath);

    ws.close();
    proc.kill();

    const v = checkAfterClick.result.value;
    const c = checkCompatAfter.result.value;
    if (v.isModalStillOpen && !v.hasFavBanner && !v.hasOtherModelsBanner && !v.hasFavPill && c.isStillOnCompatPage && !c.hasRedundantBadge) {
      console.log('SUCCESS: All tests passed with flying colors!');
      process.exit(0);
    } else {
      console.error('FAILED verification criteria.');
      process.exit(1);
    }
  } catch (e) {
    console.error('Error during CDP test:', e);
    proc.kill();
    process.exit(1);
  }
}, 1500);
