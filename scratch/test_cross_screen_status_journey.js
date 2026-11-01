const { execFile } = require('child_process');
const fs = require('fs');
const assert = require('assert');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9253',
  '--user-data-dir=C:\\temp\\edge-status-journey-profile',
  '--window-size=1600,1050',
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
    const listRes = await fetch('http://127.0.0.1:9253/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    await new Promise(r => setTimeout(r, 1200));

    console.log('Testing 10-stage Cross-Screen Status Synchronization...');

    // Wait until window.DB and window.BillingModule are fully initialized
    let isReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        isReady = await evalInPage(ws, `Boolean(window.DB && window.DB.data && window.BillingModule)`);
        if (isReady) break;
      } catch (e) {}
      await new Promise(r => setTimeout(r, 500));
    }
    if (!isReady) throw new Error('DB or BillingModule failed to initialize in page');

    // Setup a clean state in browser
    await evalInPage(ws, `(() => {
      window.DB.data.jobCards = [];
      window.DB.data.billingEstimates = [];
      window.DB.data.draftBills = [];
      window.DB.data.finalBills = [];
      window.DB.data.vehicleDeliveries = [];
      window.BillingModule.jobCardFromDate = 'ALL';
      window.BillingModule.jobCardToDate = 'ALL';
      window.BillingModule.customerBillingFromDate = 'ALL';
      window.BillingModule.customerBillingToDate = 'ALL';
      window.BillingModule.finalBillFromDate = 'ALL';
      window.BillingModule.finalBillToDate = 'ALL';
    })()`);

    // ==========================================
    // STAGE 1: Job Card Created
    // ==========================================
    const stage1Result = await evalInPage(ws, `(() => {
      const jc = {
        id: 'JC-TEST-001',
        job_card_no: 'JC/TEST/001',
        date: '2026-10-29',
        customer_name: 'Pravin Test Customer',
        customer_mobile: '9876543210',
        customer_cin: 'CIN/TEST/001',
        vehicle_reg_no: 'MH12AB1234',
        vehicle_model: 'Activa 6G',
        service_type: 'General Service',
        status: 'OPEN'
      };
      window.DB.upsert('jobCards', jc);
      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.activeTab = 'JOB_CARDS';
      window.BillingModule.refresh();

      const st = window.BillingModule.getStandardizedTransactionStatus(jc);
      const rowStatus = document.querySelector('tbody td.col-status')?.innerText.trim();
      return { stLabel: st.label, rowStatus };
    })()`);
    console.log('Stage 1 (Job Card Created):', stage1Result);
    assert.strictEqual(stage1Result.stLabel, 'Job Card Created');
    assert.strictEqual(stage1Result.rowStatus, 'Job Card Created');

    // ==========================================
    // STAGE 2: Estimate Draft
    // ==========================================
    const stage2Result = await evalInPage(ws, `(() => {
      const est = {
        id: 'EST-TEST-001',
        estimate_no: 'EST/TEST/001',
        job_card_id: 'JC-TEST-001',
        job_card_no: 'JC/TEST/001',
        customer_name: 'Pravin Test Customer',
        customer_mobile: '9876543210',
        customer_cin: 'CIN/TEST/001',
        vehicle_reg_no: 'MH12AB1234',
        vehicle_model: 'Activa 6G',
        status: 'DRAFT',
        estimated_total: 1500,
        items: [{ id: '1', code: 'LBR-001', name: 'General Labour', qty: 1, rate: 500, amount: 500 }]
      };
      window.DB.upsert('billingEstimates', est);
      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.refresh();

      const jc = window.DB.getById('jobCards', 'JC-TEST-001');
      const jcStatus = window.BillingModule.getStandardizedTransactionStatus(jc).label;
      const estStatus = window.BillingModule.getStandardizedTransactionStatus(est).label;
      return { jcStatus, estStatus };
    })()`);
    console.log('Stage 2 (Estimate Draft):', stage2Result);
    assert.strictEqual(stage2Result.jcStatus, 'Estimate Draft');
    assert.strictEqual(stage2Result.estStatus, 'Estimate Draft');

    // ==========================================
    // STAGE 3: Estimate Revised (R1)
    // ==========================================
    const stage3Result = await evalInPage(ws, `(() => {
      const est1 = window.DB.getById('billingEstimates', 'EST-TEST-001');
      est1.status = 'REVISED';
      est1.superseded_by_no = 'EST/TEST/001-R1';

      const estR1 = {
        ...JSON.parse(JSON.stringify(est1)),
        id: 'EST-TEST-001-R1',
        estimate_no: 'EST/TEST/001-R1',
        base_estimate_no: 'EST/TEST/001',
        revision_no: 1,
        status: 'DRAFT',
        previous_estimate_no: 'EST/TEST/001'
      };
      window.DB.upsert('billingEstimates', est1);
      window.DB.upsert('billingEstimates', estR1);
      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.refresh();

      const jc = window.DB.getById('jobCards', 'JC-TEST-001');
      const jcStatus = window.BillingModule.getStandardizedTransactionStatus(jc).label;
      const estStatus = window.BillingModule.getStandardizedTransactionStatus(estR1).label;
      return { jcStatus, estStatus };
    })()`);
    console.log('Stage 3 (Estimate Revised R1):', stage3Result);
    assert.strictEqual(stage3Result.jcStatus, 'Estimate Revised (R1)');
    assert.strictEqual(stage3Result.estStatus, 'Estimate Revised (R1)');

    // ==========================================
    // STAGE 4: Estimate Submitted
    // ==========================================
    const stage4Result = await evalInPage(ws, `(() => {
      const estR1 = window.DB.getById('billingEstimates', 'EST-TEST-001-R1');
      estR1.status = 'SUBMITTED';
      window.DB.upsert('billingEstimates', estR1);
      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.refresh();

      const jc = window.DB.getById('jobCards', 'JC-TEST-001');
      const jcStatus = window.BillingModule.getStandardizedTransactionStatus(jc).label;
      const estStatus = window.BillingModule.getStandardizedTransactionStatus(estR1).label;
      return { jcStatus, estStatus };
    })()`);
    console.log('Stage 4 (Estimate Submitted):', stage4Result);
    assert.strictEqual(stage4Result.jcStatus, 'Estimate Submitted');
    assert.strictEqual(stage4Result.estStatus, 'Estimate Submitted');

    // ==========================================
    // STAGE 5: Bill Draft
    // ==========================================
    const stage5Result = await evalInPage(ws, `(() => {
      const db = {
        id: 'DBILL-TEST-001',
        draft_bill_no: 'DB/TEST/001',
        job_card_id: 'JC-TEST-001',
        job_card_no: 'JC/TEST/001',
        estimate_id: 'EST-TEST-001-R1',
        estimate_no: 'EST/TEST/001-R1',
        customer_name: 'Pravin Test Customer',
        customer_mobile: '9876543210',
        customer_cin: 'CIN/TEST/001',
        vehicle_reg_no: 'MH12AB1234',
        vehicle_model: 'Activa 6G',
        status: 'DRAFT',
        net_payable: 1500,
        amount_paid: 0,
        balance_amount: 1500,
        items: [{ id: '1', name: 'General Labour', qty: 1, rate: 500, amount: 500 }]
      };
      window.DB.upsert('draftBills', db);
      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.refresh();

      const jc = window.DB.getById('jobCards', 'JC-TEST-001');
      const jcStatus = window.BillingModule.getStandardizedTransactionStatus(jc).label;
      const billStatus = window.BillingModule.getStandardizedTransactionStatus(db).label;
      return { jcStatus, billStatus };
    })()`);
    console.log('Stage 5 (Bill Draft):', stage5Result);
    assert.strictEqual(stage5Result.jcStatus, 'Bill Draft');
    assert.strictEqual(stage5Result.billStatus, 'Bill Draft');

    // ==========================================
    // STAGE 6: Bill Final
    // ==========================================
    const stage6Result = await evalInPage(ws, `(() => {
      const db = window.DB.getById('draftBills', 'DBILL-TEST-001');
      db.status = 'FINALIZED';
      window.DB.upsert('draftBills', db);

      const fb = {
        id: 'INV-TEST-001',
        invoice_no: 'INV/TEST/001',
        draft_bill_id: 'DBILL-TEST-001',
        job_card_id: 'JC-TEST-001',
        job_card_no: 'JC/TEST/001',
        estimate_no: 'EST/TEST/001-R1',
        customer_name: 'Pravin Test Customer',
        customer_mobile: '9876543210',
        customer_cin: 'CIN/TEST/001',
        vehicle_reg_no: 'MH12AB1234',
        vehicle_model: 'Activa 6G',
        status: 'FINALIZED',
        recordType: 'FINAL',
        net_payable: 1500,
        amount_paid: 0,
        balance_amount: 1500
      };
      window.DB.upsert('finalBills', fb);
      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.refresh();

      const jc = window.DB.getById('jobCards', 'JC-TEST-001');
      const jcStatus = window.BillingModule.getStandardizedTransactionStatus(jc).label;
      const billStatus = window.BillingModule.getStandardizedTransactionStatus(fb).label;
      const payBadge = window.BillingModule.renderPaymentStatusBadge(fb);
      return { jcStatus, billStatus, payBadge };
    })()`);
    console.log('Stage 6 (Bill Final):', stage6Result);
    assert.strictEqual(stage6Result.jcStatus, 'Bill Final');
    assert.strictEqual(stage6Result.billStatus, 'Bill Final');
    assert.ok(stage6Result.payBadge.includes('Pending'), 'Payment status is separate and marked Pending');

    // Capture screenshot on Job Cards showing Bill Final
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/#/job-cards' });
    await new Promise(r => setTimeout(r, 600));
    const ssJc = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/standardized_status_job_cards_verified.png', Buffer.from(ssJc.data, 'base64'));

    // ==========================================
    // STAGE 7: Bill Cancelled
    // ==========================================
    const stage7Result = await evalInPage(ws, `(() => {
      const fb = window.DB.getById('finalBills', 'INV-TEST-001');
      fb.status = 'CANCELLED';
      fb.cancellation_reason = 'Customer requested changes';
      window.DB.upsert('finalBills', fb);
      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.refresh();

      const jc = window.DB.getById('jobCards', 'JC-TEST-001');
      const jcStatus = window.BillingModule.getStandardizedTransactionStatus(jc).label;
      const billStatus = window.BillingModule.getStandardizedTransactionStatus(fb).label;
      return { jcStatus, billStatus };
    })()`);
    console.log('Stage 7 (Bill Cancelled):', stage7Result);
    assert.strictEqual(stage7Result.jcStatus, 'Bill Cancelled');
    assert.strictEqual(stage7Result.billStatus, 'Bill Cancelled');

    // ==========================================
    // STAGE 8: Cancelled Bill Reopened -> Bill Reopened
    // ==========================================
    const stage8Result = await evalInPage(ws, `(() => {
      const reopenedDb = {
        id: 'DBILL-TEST-001-R1',
        draft_bill_no: 'INV/TEST/001-R1',
        invoice_no: 'INV/TEST/001-R1',
        original_bill_id: 'INV-TEST-001',
        original_bill_no: 'INV/TEST/001',
        job_card_id: 'JC-TEST-001',
        job_card_no: 'JC/TEST/001',
        customer_name: 'Pravin Test Customer',
        customer_mobile: '9876543210',
        customer_cin: 'CIN/TEST/001',
        vehicle_reg_no: 'MH12AB1234',
        vehicle_model: 'Activa 6G',
        status: 'DRAFT',
        is_revision: true,
        revision_no: 1,
        reopened_at: new Date().toISOString(),
        net_payable: 1800,
        amount_paid: 0,
        balance_amount: 1800,
        items: [{ id: '1', name: 'General Labour', qty: 1, rate: 500, amount: 500 }]
      };
      window.DB.upsert('draftBills', reopenedDb);
      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.refresh();

      const jc = window.DB.getById('jobCards', 'JC-TEST-001');
      const jcStatus = window.BillingModule.getStandardizedTransactionStatus(jc).label;
      const billStatus = window.BillingModule.getStandardizedTransactionStatus(reopenedDb).label;
      return { jcStatus, billStatus };
    })()`);
    console.log('Stage 8 (Bill Reopened):', stage8Result);
    assert.strictEqual(stage8Result.jcStatus, 'Bill Reopened');
    assert.strictEqual(stage8Result.billStatus, 'Bill Reopened');

    // ==========================================
    // STAGE 9: Final Bill Revised -> Bill Revised (R1)
    // ==========================================
    const stage9Result = await evalInPage(ws, `(() => {
      const revisedFb = {
        id: 'INV-TEST-001-R1',
        invoice_no: 'INV/TEST/001-R1',
        original_bill_id: 'INV-TEST-001',
        original_bill_no: 'INV/TEST/001',
        job_card_id: 'JC-TEST-001',
        job_card_no: 'JC/TEST/001',
        customer_name: 'Pravin Test Customer',
        customer_mobile: '9876543210',
        customer_cin: 'CIN/TEST/001',
        vehicle_reg_no: 'MH12AB1234',
        vehicle_model: 'Activa 6G',
        status: 'REVISED_PAYMENT_PENDING',
        is_revision: true,
        revision_no: 1,
        recordType: 'FINAL',
        net_payable: 1800,
        amount_paid: 0,
        balance_amount: 1800
      };
      window.DB.upsert('finalBills', revisedFb);
      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.refresh();

      const jc = window.DB.getById('jobCards', 'JC-TEST-001');
      const jcStatus = window.BillingModule.getStandardizedTransactionStatus(jc).label;
      const billStatus = window.BillingModule.getStandardizedTransactionStatus(revisedFb).label;
      return { jcStatus, billStatus };
    })()`);
    console.log('Stage 9 (Bill Revised R1):', stage9Result);
    assert.strictEqual(stage9Result.jcStatus, 'Bill Revised (R1)');
    assert.strictEqual(stage9Result.billStatus, 'Bill Revised (R1)');

    // ==========================================
    // STAGE 10: Customer's Vehicle Delivered -> Vehicle Delivered
    // ==========================================
    const stage10Result = await evalInPage(ws, `(() => {
      const del = {
        id: 'DEL-TEST-001',
        job_card_id: 'JC-TEST-001',
        job_card_no: 'JC/TEST/001',
        invoice_no: 'INV/TEST/001-R1',
        customer_name: 'Pravin Test Customer',
        vehicle_reg_no: 'MH12AB1234',
        gate_pass_no: 'GP/TEST/001',
        delivery_date: '2026-10-29 11:30',
        status: 'DELIVERED'
      };
      window.DB.upsert('vehicleDeliveries', del);
      window.BillingModule.syncAllJobCardStatuses();
      window.BillingModule.refresh();

      const jc = window.DB.getById('jobCards', 'JC-TEST-001');
      const jcStatus = window.BillingModule.getStandardizedTransactionStatus(jc).label;
      const delStatus = window.BillingModule.getStandardizedTransactionStatus(del).label;
      return { jcStatus, delStatus };
    })()`);
    console.log('Stage 10 (Vehicle Delivered):', stage10Result);
    assert.strictEqual(stage10Result.jcStatus, 'Vehicle Delivered');
    assert.strictEqual(stage10Result.delStatus, 'Vehicle Delivered');

    // Capture screenshot on Job Cards showing Vehicle Delivered
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/#/job-cards' });
    await new Promise(r => setTimeout(r, 600));
    const ssDel = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/standardized_status_vehicle_delivered_verified.png', Buffer.from(ssDel.data, 'base64'));

    // Capture screenshot on Bill List
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/#/bill-list' });
    await new Promise(r => setTimeout(r, 600));
    const ssBillList = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/standardized_status_bill_list_verified.png', Buffer.from(ssBillList.data, 'base64'));

    console.log('\nALL 10 WORKFLOW STAGES & CROSS-SCREEN SYNCHRONIZATION TESTS PASSED 100%!');

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 1000);
