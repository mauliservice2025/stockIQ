const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb';

(async () => {
  console.log('Starting verification of Estimate PDF features...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/#/billing-estimates', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Ensure test estimate exists in DB
  const testEst = await page.evaluate(() => {
    let ests = window.DB.getAll('billingEstimates') || [];
    let est = ests.find(e => e.estimate_no === 'EST/MSC1/2026/0099');
    if (!est) {
      est = {
        id: 'est-test-pdf-001',
        estimate_no: 'EST/MSC1/2026/0099',
        job_card_id: 'jc-test-01',
        job_card_no: 'JC/MSC1/2026/0099',
        customer_name: 'Vikram Malhotra',
        customer_cin: 'CIN/MSC1/2026/000088',
        customer_mobile: '9876543210',
        vehicle_reg_no: 'MH12AB9999',
        vehicle_model: 'Honda Activa 6G',
        odometer_km: 12500,
        date: new Date().toISOString().split('T')[0],
        status: 'READY_FOR_APPROVAL',
        customer_complaints: 'Engine oil service, rear brake screeching, general checkup',
        items: [
          { type: 'PART', name: 'Engine Oil 10W-30 (1L)', qty: 1, rate: 450, amount: 450 },
          { type: 'LABOUR', name: 'General Service Labour', qty: 1, rate: 600, amount: 600 },
          { type: 'LABOUR', name: 'Brake Overhaul & Cleaning Labour', qty: 1, rate: 350, amount: 350 },
          { type: 'CONSUMABLE', name: 'Brake Cleaner Spray', qty: 1, rate: 150, amount: 150 }
        ],
        subtotal: 1550,
        discount_amount: 50,
        tax_rate: 18,
        tax_amount: 270,
        estimated_total: 1770,
        terms_and_remarks: 'Estimate valid for 7 days. Genuine Honda spares only.',
        audit_history: []
      };
      window.DB.insert('billingEstimates', est);
    }
    // Select this estimate
    window.BillingModule.selectEstimate(est.id);
    return est;
  });

  console.log('Test estimate selected:', testEst.estimate_no);
  await new Promise(r => setTimeout(r, 600));

  // Capture workspace with buttons
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'estimate_workspace_with_pdf_buttons.png') });
  console.log('Saved estimate_workspace_with_pdf_buttons.png');

  // 2. Test Share Modal (PDF option)
  await page.evaluate((estId) => {
    window.BillingModule.shareEstimateWhatsApp(estId, 'PDF');
  }, testEst.id);
  await new Promise(r => setTimeout(r, 600));

  const modalInfo = await page.evaluate(() => {
    const title = document.querySelector('.modal-title, .modal-header h3, .modal-header h4, .modal-header')?.innerText || '';
    const msgBox = document.getElementById('wa-estimate-msg-box')?.innerText || '';
    const hasDownloadPdf = Array.from(document.querySelectorAll('.modal button')).some(b => b.innerText.includes('Download PDF'));
    const hasPdfFormatTab = Array.from(document.querySelectorAll('.modal button')).some(b => b.innerText.includes('PDF Document Format'));
    return { title, hasDownloadPdf, hasPdfFormatTab, msgPreview: msgBox.slice(0, 150) };
  });
  console.log('Share Modal Info:', modalInfo);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'estimate_share_pdf_modal.png') });
  console.log('Saved estimate_share_pdf_modal.png');

  // 3. Test triggering PDF download directly & audit trail
  const downloadResult = await page.evaluate((estId) => {
    try {
      window.BillingModule.downloadEstimatePdf(estId);
      const updated = window.DB.getById('billingEstimates', estId);
      const audit = (updated.audit_history || []).filter(a => a.action === 'ESTIMATE_PDF_DOWNLOADED');
      return { success: true, auditCount: audit.length, lastAudit: audit[audit.length - 1] };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  console.log('Download PDF execution result:', downloadResult);

  // Close modal
  await page.evaluate(() => window.State.closeModal());
  await new Promise(r => setTimeout(r, 400));

  // 4. Test Print Estimate Modal with PDF button
  await page.evaluate((estId) => {
    window.BillingModule.showPrintEstimateModal(estId);
  }, testEst.id);
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'estimate_print_modal_with_pdf_btn.png') });
  console.log('Saved estimate_print_modal_with_pdf_btn.png');

  // Close modal
  await page.evaluate(() => window.State.closeModal());
  await new Promise(r => setTimeout(r, 400));

  // 5. Test Select Estimate Modal with PDF buttons
  await page.evaluate(() => {
    window.BillingModule.showSelectEstimateModal();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'estimate_select_modal_with_pdf_actions.png') });
  console.log('Saved estimate_select_modal_with_pdf_actions.png');

  await browser.close();
  console.log('Verification completed successfully!');
})();

