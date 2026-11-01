const { execFile } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9252',
  '--user-data-dir=C:\\temp\\edge-billing-compact-profile',
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
    const listRes = await fetch('http://127.0.0.1:9252/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    await new Promise(r => setTimeout(r, 1500));

    // Ensure we are viewing Customer Bills Queue
    await evalInPage(ws, `(() => {
      window.BillingModule.activeBillingBillId = null;
      window.BillingModule.activeTab = 'CUSTOMER_BILLING';
      window.BillingModule.refresh();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // Check DOM state
    const domInfo = await evalInPage(ws, `(() => {
      const card = document.querySelector('.customer-billing-queue-card');
      const cardStyle = card ? window.getComputedStyle(card) : null;
      const todayBtn = document.querySelector('button[title="Reset to Today"]');
      const allBtn = document.querySelector('button[title="Show All Dates"]');
      const queueStatusAll = document.getElementById('queue-status-all');
      const secondaryToolbar = document.getElementById('queue-bill-pay-filter');
      const helperTextPresent = card ? card.innerText.includes('adjust the From and To dates above') : false;
      const headerTitle = card ? card.querySelector('.card-header span')?.textContent : null;

      return {
        cardFound: !!card,
        marginTop: cardStyle ? cardStyle.marginTop : null,
        borderTopWidth: cardStyle ? cardStyle.borderTopWidth : null,
        headerTitle,
        hasTodayBtn: !!todayBtn,
        hasAllBtn: !!allBtn,
        hasSecondaryToolbar: !!(queueStatusAll || secondaryToolbar),
        helperTextPresent,
        emptyStateText: card ? card.querySelector('#billing-queue-results-panel')?.innerText.trim() : null
      };
    })()`);

    console.log('DOM check (Today):', JSON.stringify(domInfo, null, 2));

    // Capture screenshot 1: Today's empty state
    const ss1 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/customer_bills_queue_compact_verified.png', Buffer.from(ss1.data, 'base64'));
    console.log('Screenshot 1 saved: customer_bills_queue_compact_verified.png');

    // Change From date to backdate and seed a sample bill to verify table rendering
    await evalInPage(ws, `(() => {
      const sampleBill = {
        id: 'BILL-001',
        invoice_no: 'INV/MSC1/2026/0028',
        recordType: 'FINAL',
        date: '2026-10-28',
        job_card_no: 'JC/MSC1/2026/0051',
        estimate_no: 'EST/MSC1/2026/0030-R4',
        customer_name: 'Rushi Dhiwar',
        customer_cin: 'CIN/MSC1/2026/000043',
        customer_mobile: '8965435645',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        net_amount: 1949,
        paid_amount: 0,
        balance_amount: 1949,
        status: 'CANCELLED',
        payment_mode: 'Cash'
      };
      if (!window.DB.data.finalBills) window.DB.data.finalBills = [];
      window.DB.data.finalBills = [sampleBill];
      if (window.DB.emitChange) window.DB.emitChange('finalBills');

      window.BillingModule.setCustomerBillingFromDate('2026-10-28');
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const domInfoBackdated = await evalInPage(ws, `(() => {
      const rows = document.querySelectorAll('.billing-queue-table-row');
      const statusLabel = document.getElementById('billing-queue-status-label')?.textContent;
      return {
        rowsCount: rows.length,
        statusLabel
      };
    })()`);

    console.log('DOM check (Backdated):', JSON.stringify(domInfoBackdated, null, 2));

    // Capture screenshot 2: Backdated table records
    const ss2 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/customer_bills_queue_with_data_verified.png', Buffer.from(ss2.data, 'base64'));
    console.log('Screenshot 2 saved: customer_bills_queue_with_data_verified.png');

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 1000);
