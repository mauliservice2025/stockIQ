const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9246',
  '--user-data-dir=C:\\temp\\edge-bill-cancel-profile',
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
    const listRes = await fetch('http://127.0.0.1:9246/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    if (!pageTab) {
      console.error('Page tab not found');
      proc.kill();
      process.exit(1);
    }

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    console.log('--- TEST 1: Customer Billing Root Screen Shows Queue (Not Yesterday\'s Bill) ---');
    const screen1 = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      B.activeBillingBillId = null;
      B._explicitNavigationContext = false;
      B.activeTab = 'CUSTOMER_BILLING';
      B.refresh();

      const queueCard = document.querySelector('.customer-billing-queue-card');
      const activeBillEditor = document.getElementById('billing-items-tbody');
      const title = document.querySelector('.customer-billing-queue-card span');

      return {
        hasQueueCard: !!queueCard,
        queueTitle: title ? title.innerText : null,
        activeBillEditorShown: !!activeBillEditor,
        activeBill: B.getActiveCustomerBillingBill()
      };
    })()`);
    console.log('Customer Billing Screen State:', screen1);

    if (!screen1.hasQueueCard || screen1.activeBillEditorShown || screen1.activeBill !== null) {
      throw new Error('Customer Billing should show Queue list and active bill should be null!');
    }

    // Capture screenshot of Customer Bills Queue
    await new Promise(r => setTimeout(r, 600));
    let ss = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\customer_billing_queue_verified.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved screenshot: customer_billing_queue_verified.png');

    console.log('--- TEST 2A: Search from List & Open Specific Bill ---');
    const openRes = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      B.setCustomerBillingSearch('BILL001');
      const filtered = B.getFilteredCustomerBillingQueue();
      if (filtered.length > 0) {
        B.selectCustomerBillingBill(filtered[0].id);
      }
      return {
        matchedCount: filtered.length,
        activeBill: B.getActiveCustomerBillingBill() ? B.getActiveCustomerBillingBill().invoice_no : null
      };
    })()`);
    console.log('Opened bill via search selection:', openRes);

    await new Promise(r => setTimeout(r, 500));
    const editorCheck = await evalInPage(ws, `(() => {
      return {
        editorShown: !!document.querySelector('.customer-billing-single-screen-card')
      };
    })()`);
    console.log('Editor rendered:', editorCheck);
    if (!editorCheck.editorShown) {
      throw new Error('Selected bill did not render editor!');
    }

    console.log('--- TEST 2B: Return to Queue from Open Bill ---');
    await evalInPage(ws, `window.BillingModule.returnToBillsQueue()`);
    await new Promise(r => setTimeout(r, 500));
    const returnCheck = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      return {
        activeBillIsNull: B.getActiveCustomerBillingBill() === null,
        queueCardShown: !!document.querySelector('.customer-billing-queue-card')
      };
    })()`);
    console.log('Returned to queue:', returnCheck);
    if (!returnCheck.activeBillIsNull || !returnCheck.queueCardShown) {
      throw new Error('Return to queue failed!');
    }

    console.log('--- TEST 3: Estimates Screen Shows "No Estimate Selected" Overview ---');
    // Populate mock past estimate to verify it does NOT auto-load
    await evalInPage(ws, `(() => {
      const pastEst = {
        id: 'EST-PAST-001',
        estimate_no: 'EST/MSC1/2026/0051',
        customer_name: 'Rushi Dhiwar',
        vehicle_reg_no: 'MH12AC4335',
        date: '2026-10-28',
        estimated_total: 949,
        grand_total: 949,
        status: 'SUBMITTED',
        items: [{ id: '1', name: 'General Service Labour', rate: 399, qty: 1, type: 'LABOUR' }]
      };
      window.DB.upsert('billingEstimates', pastEst);
      const B = window.BillingModule;
      B.activeEstimateId = null;
      B.activeEstimate = null;
      B.activeTab = 'ESTIMATES';
      B.refresh();
    })()`);

    const estScreen = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      const activeEst = B.getActiveEstimate();
      const noEstHeader = document.querySelector('.estimate-workspace-panel div');
      const selectBtn = document.querySelector('button[onclick*="showSelectEstimateModal"]');

      return {
        activeEstimate: activeEst ? activeEst.estimate_no : null,
        panelText: noEstHeader ? noEstHeader.innerText : null,
        hasSelectBtn: !!selectBtn
      };
    })()`);
    console.log('Estimate screen check:', estScreen);
    if (estScreen.activeEstimate !== null || !estScreen.hasSelectBtn) {
      throw new Error('Estimate screen should show No Estimate Selected and provide Select Existing Estimate button!');
    }

    // Capture screenshot of Estimates Overview screen
    await new Promise(r => setTimeout(r, 600));
    ss = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\estimate_no_selection_overview_verified.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved screenshot: estimate_no_selection_overview_verified.png');

    console.log('--- TEST 4: Open Select Existing Estimate Search Modal ---');
    await evalInPage(ws, `window.BillingModule.showSelectEstimateModal()`);
    await new Promise(r => setTimeout(r, 600));
    ss = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\select_estimate_search_modal_verified.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved screenshot: select_estimate_search_modal_verified.png');

    // Clean up test estimate
    await evalInPage(ws, `(() => {
      window.DB.delete('billingEstimates', 'EST-PAST-001');
      window.State.closeModal();
      window.BillingModule.refresh();
    })()`);

    console.log('✅ ALL TESTS PASSED: System no longer shows yesterday\'s bill or estimate on main screen!');
    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    proc.kill();
    process.exit(1);
  }
}, 3000);
