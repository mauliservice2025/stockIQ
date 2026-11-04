const { execFile } = require('child_process');
const fs = require('fs');
const assert = require('assert');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-reopen-revision-profile';

if (fs.existsSync(profileDir)) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
}

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9272',
  `--user-data-dir=${profileDir}`,
  '--window-size=1600,1050',
  'http://localhost:3000/#/billing'
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
    console.log('Connecting to Edge via CDP on port 9272...');
    const listRes = await fetch('http://127.0.0.1:9272/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    for (let i = 0; i < 30; i++) {
      const isReady = await evalInPage(ws, 'Boolean(window.DB && window.DB.data && window.BillingModule)');
      if (isReady) break;
      await new Promise(r => setTimeout(r, 400));
    }

    console.log('Page ready. Setting up base bill for reopen and revision management test...');

    const setupResult = await evalInPage(ws, `(() => {
      const today = '2026-10-29';

      const baseBill = {
        id: 'INV/MSC1/2026/0100',
        invoice_no: 'INV/MSC1/2026/0100',
        bill_no: 'INV/MSC1/2026/0100',
        bill_date: today,
        created_at: '2026-10-29T08:30:00.000Z',
        created_by: 'Pravin Patil (System Administrator)',
        job_card_no: 'JC/MSC1/2026/0100',
        estimate_no: 'EST/MSC1/2026/0060',
        customer_name: 'Anita Sharma',
        customer_cin: 'CIN/MSC1/2026/000100',
        phone: '9890112233',
        vehicle_reg_no: 'MH12CD4321',
        vehicle_model: 'Hyundai i20',
        sub_total: 4000,
        discount: 0,
        tax_total: 0,
        grand_total: 4000,
        net_payable: 4000,
        amount_paid: 0,
        amount_received: 0,
        balance_amount: 4000,
        balance_due: 4000,
        status: 'FINAL',
        payment_mode: 'Cash',
        payment_status: 'UNPAID',
        items: [
          { code: 'SRV-01', description: 'Periodic Maintenance Service', qty: 1, rate: 3000, total: 3000, type: 'LABOUR' },
          { code: 'PRT-01', description: 'Engine Oil Synthetic', qty: 1, rate: 1000, total: 1000, type: 'PART', stock_permanently_deducted: true }
        ],
        receipts: [],
        audit_history: []
      };

      window.DB.upsert('finalBills', baseBill);
      window.BillingModule.refresh();
      return { success: true, billId: baseBill.id };
    })()`);

    console.log('Setup base bill result:', setupResult);

    // Cancel base bill directly to prepare for reopening
    console.log('Cancelling base bill INV/MSC1/2026/0100...');
    const cancelRes = await evalInPage(ws, `(() => {
      const bill = window.DB.getById('finalBills', 'INV/MSC1/2026/0100');
      bill.status = 'CANCELLED';
      bill.cancellation_reason = 'Customer requested revised estimate with add-on brake service';
      bill.cancellation_date_time = new Date().toISOString();
      bill.cancelled_at = new Date().toISOString();
      bill.cancelled_by = 'Pravin Patil (System Administrator)';
      window.DB.upsert('finalBills', bill);
      window.BillingModule.refresh();
      return {
        cancelled: true,
        canReopen: window.BillingModule.canShowReopenBillButton(bill),
        isLatest: window.BillingModule.isLatestBillRevision(bill)
      };
    })()`);

    console.log('Base bill cancelled check:', cancelRes);
    assert.strictEqual(cancelRes.canReopen, true, 'Base bill before reopening must show Reopen button');
    assert.strictEqual(cancelRes.isLatest, true, 'Base bill before reopening must be the latest revision');

    // Reopen base bill to create R1
    console.log('Reopening base bill to create R1 revision...');
    const reopenRes = await evalInPage(ws, `(() => {
      // Mock reopen modal input value
      document.body.innerHTML += '<textarea id="reopen-bill-reason">Customer added front brake disc inspection and brake pads replacement.</textarea>';
      window.BillingModule.submitReopenBill('INV/MSC1/2026/0100');
      
      const origBill = window.DB.getById('finalBills', 'INV/MSC1/2026/0100');
      const allDrafts = window.DB.getAll('draftBills') || [];
      const r1Draft = allDrafts.find(d => d.invoice_no === 'INV/MSC1/2026/0100-R1' || d.original_bill_id === 'INV/MSC1/2026/0100');

      return {
        origIsReopened: origBill.is_reopened,
        origHasSubsequent: origBill.has_subsequent_revision,
        origReopenedToNo: origBill.reopened_to_revision_no,
        origCanReopenNow: window.BillingModule.canShowReopenBillButton(origBill),
        r1DraftExists: Boolean(r1Draft),
        r1DraftStatus: r1Draft ? r1Draft.status : null,
        r1CanReopen: r1Draft ? window.BillingModule.canShowReopenBillButton(r1Draft) : null
      };
    })()`);

    console.log('Reopen result:', reopenRes);
    assert.strictEqual(reopenRes.origIsReopened, true, 'Original bill must be marked is_reopened: true');
    assert.strictEqual(reopenRes.origHasSubsequent, true, 'Original bill must be marked has_subsequent_revision: true');
    assert.strictEqual(reopenRes.origReopenedToNo, 'INV/MSC1/2026/0100-R1', 'Original bill must point to R1');
    assert.strictEqual(reopenRes.origCanReopenNow, false, 'CRITICAL: Original bill Reopen button MUST BE HIDDEN after reopening!');
    assert.strictEqual(reopenRes.r1DraftExists, true, 'R1 draft revision must exist');
    assert.strictEqual(reopenRes.r1DraftStatus, 'DRAFT', 'R1 revision must be in editable DRAFT status');
    assert.strictEqual(reopenRes.r1CanReopen, false, 'Draft revision cannot show reopen button (it is already in draft)');

    // Test Bill Overview modal on original bill
    console.log('Opening Bill Overview modal on original bill...');
    await evalInPage(ws, `window.BillingModule.viewBillDetails('INV/MSC1/2026/0100')`);
    await new Promise(r => setTimeout(r, 600));

    const modalCheck = await evalInPage(ws, `(() => {
      const modal = document.querySelector('.modal-container') || document.querySelector('.modal-content') || document.body;
      const text = modal.innerText;
      const hasReopenBtn = Boolean(modal.querySelector('button[onclick*="showReopenBillModal"]'));
      const hasViewLatestBtn = Boolean(modal.querySelector('button[onclick*="viewLatestRevision"]'));
      const hasSupersededBanner = text.includes('Bill Reopened & Superseded') || text.includes('newer working revision');

      return {
        hasReopenBtn,
        hasViewLatestBtn,
        hasSupersededBanner
      };
    })()`);

    console.log('Modal check on original bill:', modalCheck);
    assert.strictEqual(modalCheck.hasReopenBtn, false, 'Original bill overview modal must NOT show Reopen button');
    assert.strictEqual(modalCheck.hasViewLatestBtn, true, 'Original bill overview modal MUST show "View Latest Revision" button');
    assert.strictEqual(modalCheck.hasSupersededBanner, true, 'Original bill overview modal MUST show superseded banner');

    // Capture screenshot of original bill overview modal
    const shot1 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/reopen_button_hidden_on_original_bill.png', Buffer.from(shot1.data, 'base64'));
    console.log('Captured reopen_button_hidden_on_original_bill.png');

    // Close modal
    await evalInPage(ws, `window.State.closeModal()`);
    await new Promise(r => setTimeout(r, 300));

    // Save R1 as Draft and verify original bill Reopen button is STILL hidden
    console.log('Saving R1 as Draft Revision...');
    const saveDraftCheck = await evalInPage(ws, `(() => {
      const allDrafts = window.DB.getAll('draftBills') || [];
      const r1Draft = allDrafts.find(d => d.invoice_no === 'INV/MSC1/2026/0100-R1');
      window.BillingModule.selectCustomerBillingBill(r1Draft.id);
      window.BillingModule.saveCustomerBillingDraft();

      const origBill = window.DB.getById('finalBills', 'INV/MSC1/2026/0100');
      return {
        origCanReopen: window.BillingModule.canShowReopenBillButton(origBill)
      };
    })()`);
    console.log('After Save as Draft check:', saveDraftCheck);
    assert.strictEqual(saveDraftCheck.origCanReopen, false, 'Saving R1 as draft must NOT restore Reopen button on original bill');

    // Save R1 as Revised Bill
    console.log('Saving R1 as Revised Bill (finalizing revision)...');
    const saveRevisedCheck = await evalInPage(ws, `(() => {
      const allDrafts = window.DB.getAll('draftBills') || [];
      const r1Draft = allDrafts.find(d => d.invoice_no === 'INV/MSC1/2026/0100-R1');
      window.BillingModule.saveRevisedBill(r1Draft.id);

      const origBill = window.DB.getById('finalBills', 'INV/MSC1/2026/0100');
      const r1Final = (window.DB.getAll('finalBills') || []).find(b => b.invoice_no === 'INV/MSC1/2026/0100-R1');

      return {
        r1FinalStatus: r1Final ? r1Final.status : null,
        origCanReopen: window.BillingModule.canShowReopenBillButton(origBill),
        r1CanReopen: r1Final ? window.BillingModule.canShowReopenBillButton(r1Final) : null
      };
    })()`);
    console.log('After Save as Revised Bill check:', saveRevisedCheck);
    assert.strictEqual(saveRevisedCheck.r1FinalStatus, 'REVISED_PAYMENT_PENDING', 'R1 status must be REVISED_PAYMENT_PENDING');
    assert.strictEqual(saveRevisedCheck.origCanReopen, false, 'Saving as revised bill must NOT restore Reopen button on original bill');
    assert.strictEqual(saveRevisedCheck.r1CanReopen, false, 'R1 in REVISED_PAYMENT_PENDING cannot be reopened directly (must be cancelled first)');

    // Settle R1 with payment
    console.log('Settling R1 with full payment...');
    const settleCheck = await evalInPage(ws, `(() => {
      const r1Final = (window.DB.getAll('finalBills') || []).find(b => b.invoice_no === 'INV/MSC1/2026/0100-R1');
      r1Final.amount_paid = r1Final.net_payable;
      r1Final.amount_received = r1Final.net_payable;
      r1Final.balance_amount = 0;
      r1Final.balance_due = 0;
      r1Final.status = 'PAID';
      r1Final.receipts = [{
        receipt_no: 'RCT/MSC1/2026/0888',
        receipt_date: '2026-10-29',
        payment_mode: 'Cash',
        amount: r1Final.net_payable,
        receipt_status: 'ACTIVE'
      }];
      window.DB.upsert('finalBills', r1Final);

      const origBill = window.DB.getById('finalBills', 'INV/MSC1/2026/0100');
      return {
        r1Status: r1Final.status,
        origCanReopen: window.BillingModule.canShowReopenBillButton(origBill),
        r1CanReopen: window.BillingModule.canShowReopenBillButton(r1Final)
      };
    })()`);
    console.log('After Settlement check:', settleCheck);
    assert.strictEqual(settleCheck.origCanReopen, false, 'Settling revision must NOT restore Reopen button on original bill');
    assert.strictEqual(settleCheck.r1CanReopen, false, 'Settled revision cannot show Reopen button while paid');

    // Cancel R1 receipts and then cancel R1 bill
    console.log('Cancelling R1 receipts and cancelling R1 bill...');
    const cancelR1Check = await evalInPage(ws, `(() => {
      const r1Final = (window.DB.getAll('finalBills') || []).find(b => b.invoice_no === 'INV/MSC1/2026/0100-R1');
      // Cancel receipts
      r1Final.receipts.forEach(r => r.receipt_status = 'CANCELLED');
      r1Final.amount_paid = 0;
      r1Final.amount_received = 0;
      r1Final.balance_amount = r1Final.net_payable;
      r1Final.balance_due = r1Final.net_payable;
      r1Final.status = 'CANCELLED';
      r1Final.cancellation_reason = 'Correction requested on R1';
      window.DB.upsert('finalBills', r1Final);
      window.BillingModule.refresh();

      const origBill = window.DB.getById('finalBills', 'INV/MSC1/2026/0100');

      return {
        r1Status: r1Final.status,
        origCanReopen: window.BillingModule.canShowReopenBillButton(origBill),
        r1CanReopen: window.BillingModule.canShowReopenBillButton(r1Final),
        r1IsLatest: window.BillingModule.isLatestBillRevision(r1Final)
      };
    })()`);
    console.log('After cancelling R1 check:', cancelR1Check);
    assert.strictEqual(cancelR1Check.origCanReopen, false, 'Original bill must STILL NOT have Reopen button');
    assert.strictEqual(cancelR1Check.r1CanReopen, true, 'Latest revision R1 when cancelled with 0 payments MUST SHOW Reopen button!');
    assert.strictEqual(cancelR1Check.r1IsLatest, true, 'R1 must be recognized as latest revision in family');

    // Navigate to Bill List and inspect R1 vs Base in UI
    console.log('Navigating to Bill List tab to verify action buttons in table...');
    await evalInPage(ws, `(() => {
      window.BillingModule.activeTab = 'final-bills';
      window.BillingModule.refresh();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // Open R1 Overview modal to capture screenshot showing Reopen button on latest revision
    console.log('Opening Bill Overview on R1 (latest cancelled revision)...');
    const r1Id = await evalInPage(ws, `(() => {
      const r1Final = (window.DB.getAll('finalBills') || []).find(b => b.invoice_no === 'INV/MSC1/2026/0100-R1');
      window.BillingModule.viewBillDetails(r1Final.id);
      return r1Final.id;
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const r1ModalCheck = await evalInPage(ws, `(() => {
      const modal = document.querySelector('.modal-container') || document.querySelector('.modal-content') || document.body;
      const hasReopenBtn = Boolean(modal.querySelector('button[onclick*="showReopenBillModal"]'));
      return { hasReopenBtn };
    })()`);
    console.log('R1 Overview modal check:', r1ModalCheck);
    assert.strictEqual(r1ModalCheck.hasReopenBtn, true, 'R1 Overview modal MUST show Reopen Bill for Revision button');

    const shot2 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/reopen_button_on_latest_revision.png', Buffer.from(shot2.data, 'base64'));
    console.log('Captured reopen_button_on_latest_revision.png');

    // Reopen R1 to create R2 and assert button transfers to R2
    console.log('Reopening R1 to generate R2...');
    await evalInPage(ws, `window.State.closeModal()`);
    await new Promise(r => setTimeout(r, 300));

    const r2ReopenRes = await evalInPage(ws, `(() => {
      document.body.innerHTML += '<textarea id="reopen-bill-reason">Adding emergency coolant flush and thermostat check.</textarea>';
      const r1Final = (window.DB.getAll('finalBills') || []).find(b => b.invoice_no === 'INV/MSC1/2026/0100-R1');
      window.BillingModule.submitReopenBill(r1Final.id);

      const r1Updated = (window.DB.getAll('finalBills') || []).find(b => b.invoice_no === 'INV/MSC1/2026/0100-R1');
      const allDrafts = window.DB.getAll('draftBills') || [];
      const r2Draft = allDrafts.find(d => d.invoice_no === 'INV/MSC1/2026/0100-R2');
      const origBill = window.DB.getById('finalBills', 'INV/MSC1/2026/0100');

      return {
        r1CanReopenNow: window.BillingModule.canShowReopenBillButton(r1Updated),
        origCanReopenNow: window.BillingModule.canShowReopenBillButton(origBill),
        r2DraftExists: Boolean(r2Draft),
        r2RevisionNo: r2Draft ? r2Draft.revision_no : null
      };
    })()`);
    console.log('R2 Reopen result:', r2ReopenRes);
    assert.strictEqual(r2ReopenRes.r1CanReopenNow, false, 'After reopening R1, R1 Reopen button MUST BE GONE');
    assert.strictEqual(r2ReopenRes.origCanReopenNow, false, 'Original bill Reopen button MUST STILL BE GONE');
    assert.strictEqual(r2ReopenRes.r2DraftExists, true, 'R2 Draft revision must exist');

    console.log('ALL ASSERTIONS PASSED SUCCESSFULLY!');
    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 3000);

