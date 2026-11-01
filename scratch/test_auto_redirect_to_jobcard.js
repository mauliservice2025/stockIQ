const { execFile } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9250',
  '--user-data-dir=C:\\temp\\edge-redirect-jc-profile',
  '--window-size=1600,1050',
  'http://localhost:3000/#/billing-estimates'
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
    const listRes = await fetch('http://127.0.0.1:9250/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    await new Promise(r => setTimeout(r, 1200));

    // Seed ONLY a yesterday's job card (2026-10-28) - 0 job cards for today!
    await evalInPage(ws, `(() => {
      const yesterdayJC = {
        id: 'JC-2026-0051',
        job_card_no: 'JC/MSC1/2026/0051',
        date: '2026-10-28',
        created_at: '2026-10-28T10:00:00.000Z',
        customer_name: 'Rushi Dhiwar',
        customer_mobile: '8965435645',
        customer_cin: 'CIN/MSC1/2026/000043',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        status: 'ESTIMATE_PENDING',
        service_type: 'General Service'
      };
      window.DB.data.jobCards = [yesterdayJC];
      window.DB.data.billingEstimates = [];
      if (window.DB.emitChange) {
        window.DB.emitChange('jobCards');
        window.DB.emitChange('billingEstimates');
      }
      window.BillingModule.activeEstimateId = null;
      window.BillingModule.activeEstimate = null;
      window.BillingModule._explicitNavigationContext = false;
      window.BillingModule.refresh();
    })()`);

    console.log('=== TEST 1: Check Estimate Workspace Screen When No Job Card on Today ===');
    const test1 = await evalInPage(ws, `(() => {
      const today = window.BillingModule.getTodayDateStr();
      const allJCs = window.DB.getAll('jobCards') || [];
      const todayJCs = allJCs.filter(j => window.BillingModule.getRecordDate(j) === today);
      const textNotice = document.querySelector('.estimate-workspace-panel div div[style*="font-size: 13px"]')?.textContent?.replace(/\\s+/g, ' ')?.trim();
      const btn = document.querySelector('button[onclick*="createNewEstimate()"]')?.textContent?.replace(/\\s+/g, ' ')?.trim();

      return {
        today,
        totalJCs: allJCs.length,
        todayJCsCount: todayJCs.length,
        textNotice,
        btnText: btn
      };
    })()`);
    console.log('Test 1 Result:', test1);

    console.log('\n=== TEST 2: Click "+ Create Estimate from Job Card" and Verify Auto Redirect ===');
    await evalInPage(ws, `(() => {
      // Call createNewEstimate directly or click the button
      window.BillingModule.createNewEstimate();
    })()`);

    // Give time for redirect and modal popup
    await new Promise(r => setTimeout(r, 600));

    const test2 = await evalInPage(ws, `(() => {
      const currentHash = window.location.hash;
      const activeTab = window.BillingModule.activeTab;
      const modal = document.querySelector('.modal-content, .modal-dialog, #app-modal, [id*="modal"]');
      const modalTitle = document.querySelector('.modal-title, [class*="modal-title"]')?.textContent?.trim() ||
                         document.querySelector('.modal-header')?.textContent?.replace(/\\s+/g, ' ')?.trim();
      const toastText = document.querySelector('.toast, .alert, [class*="toast"]')?.textContent?.replace(/\\s+/g, ' ')?.trim();
      const isJobCardFormPresent = Boolean(document.getElementById('jc-vehicle-reg') || document.getElementById('jc-customer-mobile') || document.querySelector('[placeholder*="MH 12"]'));

      return {
        currentHash,
        activeTab,
        isRedirectedToJobCards: currentHash === '#/job-cards' && activeTab === 'JOB_CARDS',
        modalTitle,
        isJobCardFormPresent,
        toastText
      };
    })()`);
    console.log('Test 2 Result:', test2);

    console.log('\nCapturing Screenshot for Redirected Job Card Screen with Modal Open...');
    const shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const shotPath = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\estimate_auto_redirect_jobcard_verified.png';
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot to:', shotPath);

    console.log('\n=== TEST 3: When Job Card on Today EXISTS, Estimate is Created Normally ===');
    const test3 = await evalInPage(ws, `(() => {
      // Add a Job Card for TODAY (2026-10-29)
      const todayStr = window.BillingModule.getTodayDateStr();
      const todayJC = {
        id: 'JC-2026-0052',
        job_card_no: 'JC/MSC1/2026/0052',
        date: todayStr,
        created_at: todayStr + 'T09:00:00.000Z',
        customer_name: 'Pravin Patil',
        customer_mobile: '9876543210',
        customer_cin: 'CIN/MSC1/2026/000044',
        vehicle_reg_no: 'MH14DE9999',
        vehicle_model: 'Honda Activa',
        status: 'ESTIMATE_PENDING',
        service_type: 'Periodic Service'
      };
      window.DB.data.jobCards.push(todayJC);
      window.DB.emitChange('jobCards');

      // Close modal and navigate to estimates
      if (window.State && window.State.closeModal) window.State.closeModal();
      window.BillingModule.activeTab = 'ESTIMATES';
      window.BillingModule.activeEstimateId = null;
      window.BillingModule.activeEstimate = null;
      window.BillingModule.refresh();

      // Click createNewEstimate
      window.BillingModule.createNewEstimate();

      const activeEst = window.BillingModule.getActiveEstimate();
      return {
        activeTab: window.BillingModule.activeTab,
        hasActiveEst: Boolean(activeEst),
        estNo: activeEst?.estimate_no,
        linkedJobCard: activeEst?.job_card_no,
        customerName: activeEst?.customer_name
      };
    })()`);
    console.log('Test 3 Result:', test3);

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error running test:', err);
    proc.kill();
    process.exit(1);
  }
}, 1000);

