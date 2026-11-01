const { execFile } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9249',
  '--user-data-dir=C:\\temp\\edge-date-filter-profile3',
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
    const listRes = await fetch('http://127.0.0.1:9249/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    await new Promise(r => setTimeout(r, 1200));

    // Seed yesterday's bill (matches the user's screenshot: INV/MSC1/2026/0028 dated 28-10-2026)
    await evalInPage(ws, `(() => {
      const yesterdayBill = {
        id: 'INV-2026-0028',
        invoice_no: 'INV/MSC1/2026/0028',
        date: '2026-10-28',
        bill_date: '2026-10-28',
        job_card_no: 'JC/MSC1/2026/0051',
        estimate_no: 'EST/MSC1/2026/0030-R4',
        customer_name: 'Rushi Dhiwar',
        customer_cin: 'CIN/MSC1/2026/000043',
        customer_mobile: '8965435645',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        net_payable: 1949.00,
        amount_paid: 0.00,
        balance_amount: 1949.00,
        status: 'CANCELLED',
        payment_mode: 'Cash',
        recordType: 'FINAL'
      };
      window.DB.upsert('finalBills', yesterdayBill);
      if (window.DB.emitChange) window.DB.emitChange('finalBills');
    })()`);

    console.log('=== TEST 1: Default Date Range in Customer Bills Queue ===');
    const test1 = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      B.activeBillingBillId = null;
      B._explicitNavigationContext = false;
      B.customerBillingFromDate = undefined;
      B.customerBillingToDate = undefined;
      B.refresh();

      const fromVal = document.getElementById('customer-billing-from-date')?.value;
      const toVal = document.getElementById('customer-billing-to-date')?.value;
      const today = B.getTodayDateStr();

      const queueRows = document.querySelectorAll('.billing-queue-table-row');
      const allCountText = document.getElementById('queue-status-all')?.textContent?.replace(/\\s+/g, ' ')?.trim();
      const statusLabel = document.getElementById('billing-queue-status-label')?.textContent?.trim();
      const emptyStateMsg = document.querySelector('#billing-queue-results-panel div')?.textContent?.replace(/\\s+/g, ' ')?.trim();

      return {
        today,
        fromVal,
        toVal,
        isFromToday: fromVal === today,
        isToToday: toVal === today,
        queueRowCount: queueRows.length,
        allCountText,
        statusLabel,
        emptyStateSnippet: emptyStateMsg?.substring(0, 80)
      };
    })()`);
    console.log('Test 1 Result:', test1);

    console.log('Capturing Screenshot for Today (Default: shows 0 records for today, hides yesterday)...');
    const shot1 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const shotPath1 = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\customer_billing_today_filter_verified.png';
    fs.writeFileSync(shotPath1, Buffer.from(shot1.data, 'base64'));
    console.log('Saved screenshot 1 to:', shotPath1);

    console.log('\n=== TEST 2: Changing From Date to Back-dated (2026-10-28) ===');
    const test2 = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      B.setCustomerBillingFromDate('2026-10-28');

      const fromVal = document.getElementById('customer-billing-from-date')?.value;
      const toVal = document.getElementById('customer-billing-to-date')?.value;
      const queueRows = document.querySelectorAll('.billing-queue-table-row');
      const allCountText = document.getElementById('queue-status-all')?.textContent?.replace(/\\s+/g, ' ')?.trim();
      const cancelledCountText = document.getElementById('queue-status-cancelled')?.textContent?.replace(/\\s+/g, ' ')?.trim();
      const statusLabel = document.getElementById('billing-queue-status-label')?.textContent?.trim();
      const firstRowText = queueRows[0]?.textContent?.replace(/\\s+/g, ' ')?.trim();

      return {
        fromVal,
        toVal,
        queueRowCount: queueRows.length,
        allCountText,
        cancelledCountText,
        statusLabel,
        firstRowText
      };
    })()`);
    console.log('Test 2 Result:', test2);

    console.log('Capturing Screenshot for Backdated Range (Shows 28-10-2026 Bill)...');
    const shot2 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const shotPath2 = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\customer_billing_backdated_filter_verified.png';
    fs.writeFileSync(shotPath2, Buffer.from(shot2.data, 'base64'));
    console.log('Saved screenshot 2 to:', shotPath2);

    console.log('\n=== TEST 3: Quick Preset "Today" Button ===');
    const test3 = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      B.setCustomerBillingToday();

      const fromVal = document.getElementById('customer-billing-from-date')?.value;
      const toVal = document.getElementById('customer-billing-to-date')?.value;
      const queueRows = document.querySelectorAll('.billing-queue-table-row');
      const allCountText = document.getElementById('queue-status-all')?.textContent?.replace(/\\s+/g, ' ')?.trim();

      return {
        fromVal,
        toVal,
        today: B.getTodayDateStr(),
        queueRowCount: queueRows.length,
        allCountText
      };
    })()`);
    console.log('Test 3 Result:', test3);

    console.log('\n=== TEST 4: Quick Preset "All" Dates Button ===');
    const test4 = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      B.setCustomerBillingAllDates();

      const fromVal = document.getElementById('customer-billing-from-date')?.value;
      const toVal = document.getElementById('customer-billing-to-date')?.value;
      const queueRows = document.querySelectorAll('.billing-queue-table-row');
      const allCountText = document.getElementById('queue-status-all')?.textContent?.replace(/\\s+/g, ' ')?.trim();

      return {
        fromVal,
        toVal,
        queueRowCount: queueRows.length,
        allCountText,
        fromDateState: B.customerBillingFromDate,
        toDateState: B.customerBillingToDate
      };
    })()`);
    console.log('Test 4 Result:', test4);

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error running test:', err);
    proc.kill();
    process.exit(1);
  }
}, 1000);
