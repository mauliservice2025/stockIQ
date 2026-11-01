const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9230',
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
    const listRes = await fetch('http://127.0.0.1:9230/json');
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

    // Wait for hydration
    await new Promise(r => setTimeout(r, 2000));

    console.log('--- TEST 1: User Roles and Access Permissions ---');
    const perms = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      return {
        canViewBill: B.canViewBill(),
        canCancelBill: B.canCancelBill(),
        canReopenBill: B.canReopenBill(),
        canEditRevisedBill: B.canEditRevisedBill(),
        canSaveRevisedBill: B.canSaveRevisedBill(),
        canCollectPayment: B.canCollectPayment(),
        canShareBill: B.canShareBill()
      };
    })()`);
    console.log('Permissions check for active admin:', perms);
    if (!perms.canCancelBill || !perms.canReopenBill || !perms.canSaveRevisedBill) {
      throw new Error('Permission helper checks failed');
    }

    console.log('--- TEST 2: Create Test Bill BILL001 ---');
    const billCreated = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      // Clean up any residual test revisions from previous runs
      const finals = window.DB.getAll('finalBills') || [];
      finals.filter(f => (f.invoice_no && f.invoice_no.startsWith('BILL001')) || f.id === 'INV-BILL001').forEach(f => window.DB.delete('finalBills', f.id));
      const drafts = window.DB.getAll('draftBills') || [];
      drafts.filter(d => (d.invoice_no && d.invoice_no.startsWith('BILL001')) || (d.draft_bill_no && d.draft_bill_no.startsWith('BILL001')) || d.id === 'DBILL-TEST-001').forEach(d => window.DB.delete('draftBills', d.id));
      // Create initial bill record BILL001
      const testBill = {
        id: 'INV-BILL001',
        invoice_no: 'BILL001',
        bill_no: 'BILL001',
        draft_bill_id: 'DBILL-TEST-001',
        draft_bill_no: 'BILL001',
        job_card_id: 'JC/MSC1/2026/0051',
        job_card_no: 'JC/MSC1/2026/0051',
        customer_cin: 'CIN/MSC/2026/000043',
        customer_name: 'Rushi Dhiwar',
        customer_mobile: '8965435645',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        next_service_due_date: '2026-11-28',
        next_service_after_km: 3000,
        service_type: 'General Service',
        items: [
          {
            id: 'ITM-001',
            item_id: 'PART-001',
            item_code: '2W-SPR-ENGINE-VALVE-SET-007',
            code: '2W-SPR-ENGINE-VALVE-SET-007',
            name: 'Engine Valve Set',
            type: 'PART',
            category: 'PART',
            qty: 2,
            rate: 150,
            amount: 300,
            stock_permanently_deducted: true
          },
          {
            id: 'ITM-002',
            item_id: 'LBR-001',
            item_code: 'LBR-001',
            code: 'LBR-001',
            name: 'General Service Labour',
            type: 'LABOUR',
            category: 'LABOUR',
            qty: 1,
            rate: 399,
            amount: 399,
            stock_permanently_deducted: false
          }
        ],
        subtotal: 699,
        gross_amount: 699,
        discount_amount: 0,
        discount_type: 'AMOUNT',
        discount_value: 0,
        taxable_amount: 699,
        total_tax: 0,
        net_payable: 699,
        grand_total: 699,
        amount_paid: 0,
        amount_received: 0,
        balance_due: 699,
        balance_amount: 699,
        status: 'FINALIZED',
        audit_history: []
      };
      window.DB.upsert('finalBills', testBill);
      window.DB.upsert('draftBills', { ...testBill, id: 'DBILL-TEST-001' });
      return testBill.invoice_no;
    })()`);
    console.log('Created test bill:', billCreated);

    console.log('--- TEST 3: Payment Guard on Bill Cancellation ---');
    const paymentGuardTest = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      const b = window.DB.getById('finalBills', 'INV-BILL001');
      b.amount_paid = 200; // Simulate partial payment collected
      let toastMsg = '';
      const origToast = window.State.showToast;
      window.State.showToast = (msg, type) => { toastMsg = msg; origToast(msg, type); };

      B.submitCancelBill('INV-BILL001');
      window.State.showToast = origToast;

      const updated = window.DB.getById('finalBills', 'INV-BILL001');
      // Reset back to 0 for unpaid test
      b.amount_paid = 0;
      window.DB.upsert('finalBills', b);

      return {
        toastMsg,
        statusWasCancelled: updated.status === 'CANCELLED'
      };
    })()`);
    console.log('Cancellation guard with payments:', paymentGuardTest);
    if (paymentGuardTest.statusWasCancelled) {
      throw new Error('Bill with collected payments must not be cancelled!');
    }

    console.log('--- TEST 4: Bill Cancellation Workflow for Unpaid Bill ---');
    const cancellationResult = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      // Open cancel modal
      B.showCancelBillModal('INV-BILL001');
      const reasonEl = document.getElementById('cancel-bill-reason');
      if (reasonEl) reasonEl.value = 'Pricing / Tax Calculation Error';
      const remarksEl = document.getElementById('cancel-bill-remarks');
      if (remarksEl) remarksEl.value = 'Customer reported rate discrepancy in engine valve set';

      B.submitCancelBill('INV-BILL001');

      const cancelledBill = window.DB.getById('finalBills', 'INV-BILL001');
      return {
        status: cancelledBill.status,
        reason: cancelledBill.cancellation_reason,
        remarks: cancelledBill.cancellation_remarks,
        cancelled_by: cancelledBill.cancelled_by,
        auditCount: (cancelledBill.audit_history || []).length,
        itemsRestocked: cancelledBill.items.every(it => it.type === 'LABOUR' || !it.stock_permanently_deducted)
      };
    })()`);
    console.log('Cancelled bill details:', cancellationResult);
    if (cancellationResult.status !== 'CANCELLED') {
      throw new Error('Bill status was not updated to CANCELLED');
    }

    console.log('--- TEST 5: Payment Block on Cancelled Bill ---');
    const paymentBlockResult = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      let toastMsg = '';
      const origToast = window.State.showToast;
      window.State.showToast = (msg, type) => { toastMsg = msg; origToast(msg, type); };

      B.showPaymentModal('INV-BILL001');
      B.submitPayment('INV-BILL001');

      window.State.showToast = origToast;
      return toastMsg;
    })()`);
    console.log('Payment collection attempt on cancelled bill:', paymentBlockResult);
    if (!paymentBlockResult.includes('prohibited on cancelled bills')) {
      throw new Error('Payment collection was not blocked on cancelled bill!');
    }

    console.log('--- TEST 6: Sequential Bill Revision Numbering ---');
    const revCheck = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      window.DB.data.finalBills = (window.DB.data.finalBills || []).filter(b => !String(b.invoice_no || '').startsWith('BILL001-R'));
      window.DB.data.draftBills = (window.DB.data.draftBills || []).filter(b => !String(b.invoice_no || '').startsWith('BILL001-R'));
      
      const b0 = { invoice_no: 'BILL001' };
      const r1 = B.getNextBillRevisionInfo(b0);

      const b1 = { invoice_no: 'BILL001-R1' };
      window.DB.upsert('finalBills', { id: 'INV-BILL001-R1', invoice_no: 'BILL001-R1' });
      const r2 = B.getNextBillRevisionInfo(b1);

      window.DB.upsert('finalBills', { id: 'INV-BILL001-R2', invoice_no: 'BILL001-R2' });
      const r3 = B.getNextBillRevisionInfo({ invoice_no: 'BILL001-R2' });

      // Clean up mock check entries
      window.DB.delete('finalBills', 'INV-BILL001-R1');
      window.DB.delete('finalBills', 'INV-BILL001-R2');

      return {
        r1: r1.nextRevisionNo,
        r2: r2.nextRevisionNo,
        r3: r3.nextRevisionNo
      };
    })()`);
    console.log('Sequential Revision numbers:', revCheck);
    if (revCheck.r1 !== 'BILL001-R1' || revCheck.r2 !== 'BILL001-R2' || revCheck.r3 !== 'BILL001-R3') {
      throw new Error(`Revision numbering does not match BILL001-R1 -> R2 -> R3! Got: ${JSON.stringify(revCheck)}`);
    }

    console.log('--- TEST 7: Reopen Cancelled Bill Workflow ---');
    const reopenResult = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      B.showReopenBillModal('INV-BILL001');
      const reasonEl = document.getElementById('reopen-bill-reason');
      if (reasonEl) reasonEl.value = 'Customer agreed to revised scope with additional brake shoe';

      B.submitReopenBill('INV-BILL001');

      const originalBill = window.DB.getById('finalBills', 'INV-BILL001');
      const drafts = window.DB.getAll('draftBills') || [];
      const revisedBill = drafts.find(d => d.invoice_no === 'BILL001-R1');

      return {
        originalStatus: originalBill.status,
        originalUnchanged: originalBill.status === 'CANCELLED',
        revisedExists: !!revisedBill,
        revisedNo: revisedBill ? revisedBill.invoice_no : null,
        revisedStatus: revisedBill ? revisedBill.status : null,
        revisedIsRevision: revisedBill ? revisedBill.is_revision : null,
        activeBillId: B.activeBillingBillId,
        activeTab: B.activeTab
      };
    })()`);
    console.log('Reopen result:', reopenResult);
    if (!reopenResult.revisedExists || reopenResult.revisedNo !== 'BILL001-R1' || reopenResult.revisedStatus !== 'DRAFT') {
      throw new Error('Reopened bill was not created properly in editable DRAFT mode');
    }
    if (!reopenResult.originalUnchanged) {
      throw new Error('Original cancelled bill must remain unchanged!');
    }

    console.log('--- TEST 8: Modify Items / Rates / Quantities in Revised Bill ---');
    const editResult = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      const revised = B.getActiveCustomerBillingBill();
      if (!revised) return { error: 'No active revised bill' };

      // 1. Add a new service item
      revised.items.push({
        id: 'ITM-REV-ADD-01',
        item_id: 'PART-004',
        code: '2W-SPR-BRAKE-SHOE-SET-001',
        name: 'Brake Shoe Set',
        type: 'PART',
        category: 'PART',
        qty: 1,
        rate: 220,
        amount: 220
      });

      // 2. Modify rate of labour
      const lbr = revised.items.find(i => i.type === 'LABOUR');
      if (lbr) {
        lbr.rate = 450;
        lbr.amount = 450;
      }

      // 3. Recalculate totals
      B.recalculateBillTotals(revised);
      window.DB.upsert('draftBills', revised);

      return {
        itemCount: revised.items.length,
        subtotal: revised.subtotal,
        grandTotal: revised.grand_total,
        netPayable: revised.net_payable
      };
    })()`);
    console.log('Modified revised bill values:', editResult);
    if (editResult.itemCount !== 3 || editResult.grandTotal !== 970) {
      throw new Error(`Totals recalculation mismatch! Expected 970, got ${editResult.grandTotal}`);
    }

    console.log('--- TEST 9: Save Revised Bill & Regenerate ---');
    const saveRevResult = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      const active = B.getActiveCustomerBillingBill();

      let toastMsg = '';
      const origToast = window.State.showToast;
      window.State.showToast = (msg, type) => { toastMsg = msg; origToast(msg, type); };

      B.saveRevisedBill(active.id);
      window.State.showToast = origToast;

      const savedDraft = window.DB.getById('draftBills', active.id);
      const allFinal = window.DB.getAll('finalBills') || [];
      const savedFinal = allFinal.find(f => f.invoice_no === 'BILL001-R1');

      return {
        toastMsg,
        draftStatus: savedDraft ? savedDraft.status : null,
        finalStatus: savedFinal ? savedFinal.status : null,
        finalNetPayable: savedFinal ? savedFinal.net_payable : null,
        isRevision: savedFinal ? savedFinal.is_revision : null,
        revisionNo: savedFinal ? savedFinal.revision_no : null,
        auditHistoryCount: savedFinal ? (savedFinal.audit_history || []).length : 0
      };
    })()`);
    console.log('Saved revised bill verification:', saveRevResult);
    if (saveRevResult.finalStatus !== 'REVISED_PAYMENT_PENDING' || saveRevResult.finalNetPayable !== 970) {
      throw new Error('Save revised bill failed to set REVISED_PAYMENT_PENDING or net_payable mismatch');
    }

    console.log('--- TEST 10: Collect Payment against Revised Bill BILL001-R1 ---');
    const paymentResult = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      const allFinal = window.DB.getAll('finalBills') || [];
      const savedFinal = allFinal.find(f => f.invoice_no === 'BILL001-R1');

      B.showPaymentModal(savedFinal.id);
      const modeEl = document.getElementById('pay-mode');
      if (modeEl) modeEl.value = 'UPI';
      const amtEl = document.getElementById('pay-amount');
      if (amtEl) amtEl.value = '970';
      const refEl = document.getElementById('pay-ref');
      if (refEl) refEl.value = 'UPI-TXN-REV-987654';

      B.submitPayment(savedFinal.id);

      const settledFinal = (window.DB.getAll('finalBills') || []).find(f => f.invoice_no === 'BILL001-R1');
      const receipts = (window.DB.getAll('paymentReceipts') || []).filter(r => r.invoice_no === 'BILL001-R1');
      const settlement = B.calculateSettlementStatus(settledFinal);

      return {
        invoiceNo: settledFinal.invoice_no,
        amountPaid: settledFinal.amount_paid,
        balanceDue: settledFinal.balance_due,
        settlementCode: settlement.code,
        settlementLabel: settlement.label,
        receiptNo: receipts.length > 0 ? receipts[0].receipt_no : null
      };
    })()`);
    console.log('Payment collection against revised bill:', paymentResult);
    if (paymentResult.amountPaid !== 970 || paymentResult.settlementCode !== 'FULLY_SETTLED') {
      throw new Error('Payment collection against revised bill did not fully settle the bill');
    }

    console.log('--- TEST 11: WhatsApp Share Format Options ---');
    const waShareResult = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      const allFinal = window.DB.getAll('finalBills') || [];
      const savedFinal = allFinal.find(f => f.invoice_no === 'BILL001-R1');

      // Test Text format
      B.shareInvoiceWhatsApp(savedFinal.id, 'TEXT');
      const textMsgEl = document.getElementById('wa-invoice-msg-box');
      const textPreview = textMsgEl ? textMsgEl.innerText : '';

      // Test PDF format
      B.shareInvoiceWhatsApp(savedFinal.id, 'PDF');
      const pdfMsgEl = document.getElementById('wa-invoice-msg-box');
      const pdfPreview = pdfMsgEl ? pdfMsgEl.innerText : '';

      B.recordWhatsAppShareAudit(savedFinal.id, 'PDF');
      const auditRecs = savedFinal.audit_history.filter(a => a.action === 'WHATSAPP_SHARED');

      return {
        hasTextPreview: textPreview.includes('BILL001-R1') && textPreview.includes('LINE ITEMS & CHARGES:'),
        hasPdfPreview: pdfPreview.includes('BILL001-R1') && pdfPreview.includes('Download / View Official PDF Invoice:'),
        auditCount: auditRecs.length
      };
    })()`);
    console.log('WhatsApp share formats:', waShareResult);
    if (!waShareResult.hasTextPreview || !waShareResult.hasPdfPreview || waShareResult.auditCount === 0) {
      throw new Error('WhatsApp sharing format options or audit record failed');
    }

    console.log('--- TEST 12: Document Print Format Configuration Integration ---');
    const docPrintResult = await evalInPage(ws, `(() => {
      const B = window.BillingModule;
      const allFinal = window.DB.getAll('finalBills') || [];
      const savedFinal = allFinal.find(f => f.invoice_no === 'BILL001-R1');
      B.printInvoice(savedFinal.id);
      const printEl = document.getElementById('printable-tax-invoice');
      const title = document.querySelector('.modal-title');
      return {
        printedExists: !!printEl,
        modalTitle: title ? title.innerText : ''
      };
    })()`);
    console.log('Document print output:', docPrintResult);
    if (!docPrintResult.printedExists || !docPrintResult.modalTitle.includes('BILL001-R1')) {
      throw new Error('Document print modal does not render revised invoice BILL001-R1');
    }

    // Capture screenshot of the Bill Overview modal
    console.log('Capturing UI screenshot...');
    await evalInPage(ws, `window.BillingModule.viewBillDetails('INV-BILL001-R1')`);
    await new Promise(r => setTimeout(r, 800));

    const ssResult = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(ssResult.data, 'base64');
    const artifactPath = path.join('C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb', 'bill_cancellation_and_revision_verified.png');
    fs.writeFileSync(artifactPath, buffer);
    console.log('Saved screenshot to:', artifactPath);

    // Clean up test records
    await evalInPage(ws, `(() => {
      window.DB.delete('finalBills', 'INV-BILL001');
      window.DB.delete('draftBills', 'DBILL-TEST-001');
      const allF = window.DB.getAll('finalBills') || [];
      const revFinal = allF.find(f => f.invoice_no === 'BILL001-R1');
      if (revFinal) window.DB.delete('finalBills', revFinal.id);
      const allD = window.DB.getAll('draftBills') || [];
      const revDraft = allD.find(d => d.invoice_no === 'BILL001-R1');
      if (revDraft) window.DB.delete('draftBills', revDraft.id);
      window.State.closeModal();
      window.BillingModule.refresh();
    })()`);

    console.log('✅ ALL BILL CANCELLATION & REOPEN WORKFLOW TESTS PASSED PERFECTLY!');
    ws.close();
    proc.kill();
    process.exit(0);

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    proc.kill();
    process.exit(1);
  }
}, 3000);
