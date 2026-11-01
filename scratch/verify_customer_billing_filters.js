const { execFile } = require('child_process');
const fs = require('fs');
const assert = require('assert');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9255',
  '--user-data-dir=C:\\temp\\edge-status-queue-filters-profile',
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
    const listRes = await fetch('http://127.0.0.1:9255/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    // Wait until window.DB and window.BillingModule are ready
    let isReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        isReady = await evalInPage(ws, 'Boolean(window.DB && window.DB.data && window.BillingModule)');
        if (isReady) break;
      } catch (e) {}
      await new Promise(r => setTimeout(r, 400));
    }
    if (!isReady) throw new Error('DB or BillingModule failed to initialize');

    console.log('Testing Customer Bills Queue Filters...');

    // Setup realistic sample data matching the user screenshot
    await evalInPage(ws, `(() => {
      window.DB.data.jobCards = [
        {
          id: 'JC/MSC1/2026/0051',
          job_card_no: 'JC/MSC1/2026/0051',
          date: '2026-10-28',
          customer_name: 'Rushi Dhiwar',
          customer_mobile: '8965435645',
          customer_cin: 'CIN/MSC1/2026/000043',
          vehicle_reg_no: 'MH12AC4335',
          vehicle_model: 'Tvs Jupiter',
          status: 'ESTIMATE_PENDING'
        }
      ];

      window.DB.data.draftBills = [];
      window.DB.data.finalBills = [
        {
          id: 'INV/MSC1/2026/0028',
          invoice_no: 'INV/MSC1/2026/0028',
          job_card_id: 'JC/MSC1/2026/0051',
          job_card_no: 'JC/MSC1/2026/0051',
          estimate_no: 'EST/MSC1/2026/0030-R4',
          customer_name: 'Rushi Dhiwar',
          customer_mobile: '8965435645',
          customer_cin: 'CIN/MSC1/2026/000043',
          vehicle_reg_no: 'MH12AC4335',
          vehicle_model: 'Tvs Jupiter',
          date: '2026-10-28',
          invoice_date: '2026-10-28',
          created_at: '2026-10-28T10:00:00.000Z',
          status: 'CANCELLED',
          recordType: 'FINAL',
          net_payable: 1949,
          amount_paid: 0,
          balance_amount: 1949,
          payment_mode: 'Cash'
        }
      ];

      window.BillingModule.customerBillingFromDate = '2026-10-01';
      window.BillingModule.customerBillingToDate = '2026-10-29';
      window.BillingModule.customerBillingStatusFilter = 'ALL';
      window.BillingModule.customerBillingPaymentFilter = 'ALL';
      window.BillingModule.customerBillingSearch = '';
      window.BillingModule.customerBillingViewMode = 'TABLE';
      window.BillingModule.activeTab = 'CUSTOMER_BILLING';
      window.BillingModule.refresh();
    })()`);

    await new Promise(r => setTimeout(r, 600));

    // Verify DOM elements presence
    const domCheck = await evalInPage(ws, `(() => {
      return {
        hasStatusAll: !!document.getElementById('queue-status-all'),
        hasStatusFully: !!document.getElementById('queue-status-fully'),
        hasStatusPartially: !!document.getElementById('queue-status-partially'),
        hasStatusPending: !!document.getElementById('queue-status-pending'),
        hasStatusCancelled: !!document.getElementById('queue-status-cancelled'),
        hasFromDate: !!document.getElementById('customer-billing-from-date'),
        hasToDate: !!document.getElementById('customer-billing-to-date'),
        hasModeFilter: !!document.getElementById('customer-billing-mode-filter'),
        hasSearchInput: !!document.getElementById('customer-billing-search-input'),
        hasTableViewBtn: !!document.getElementById('btn-queue-view-table'),
        hasCardViewBtn: !!document.getElementById('btn-queue-view-cards'),
        tableRowCount: document.querySelectorAll('#billing-queue-results-panel tbody tr').length,
        fromValue: document.getElementById('customer-billing-from-date')?.value,
        toValue: document.getElementById('customer-billing-to-date')?.value
      };
    })()`);

    console.log('DOM Elements check:', domCheck);
    assert.ok(domCheck.hasStatusAll, 'queue-status-all present');
    assert.ok(domCheck.hasStatusFully, 'queue-status-fully present');
    assert.ok(domCheck.hasStatusPartially, 'queue-status-partially present');
    assert.ok(domCheck.hasStatusPending, 'queue-status-pending present');
    assert.ok(domCheck.hasStatusCancelled, 'queue-status-cancelled present');
    assert.ok(domCheck.hasFromDate, 'customer-billing-from-date present');
    assert.ok(domCheck.hasToDate, 'customer-billing-to-date present');
    assert.ok(domCheck.hasModeFilter, 'customer-billing-mode-filter present');
    assert.ok(domCheck.hasSearchInput, 'customer-billing-search-input present');
    assert.ok(domCheck.hasTableViewBtn, 'btn-queue-view-table present');
    assert.ok(domCheck.hasCardViewBtn, 'btn-queue-view-cards present');
    assert.strictEqual(domCheck.tableRowCount, 1, '1 record rendered in table');

    // Capture screenshot matching second image
    const ss = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/customer_bills_queue_with_filters_verified.png', Buffer.from(ss.data, 'base64'));

    console.log('Verification PASSED! Screenshot saved to customer_bills_queue_with_filters_verified.png');

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 1000);

