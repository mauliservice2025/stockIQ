const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = 'C:\\temp\\edge-bill-datetime-profile';
const artifactDir = 'C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb';

if (fs.existsSync(profileDir)) {
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch (e) {}
}

const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9294',
  `--user-data-dir=${profileDir}`,
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

async function captureScreenshot(ws, filePath) {
  const screenshot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot to:', filePath);
}

setTimeout(async () => {
  try {
    console.log('Connecting to Edge CDP on 9294...');
    const listRes = await fetch('http://127.0.0.1:9294/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000')) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    // Wait for BillingModule & DB
    for (let i = 0; i < 30; i++) {
      const isReady = await evalInPage(ws, 'Boolean(window.DB && window.BillingModule)');
      if (isReady) break;
      await new Promise(r => setTimeout(r, 400));
    }

    console.log('BillingModule is ready in page. Setting up test bills...');

    // Set up exact bill records matching user screenshot with specific timestamps
    const setupResult = await evalInPage(ws, `(() => {
      // 1. Original Cancelled Bill (Created at 10:15 on 2026-10-29)
      const origBill = {
        id: 'INV-MSC1-2026-0029',
        invoice_no: 'INV/MSC1/2026/0029',
        bill_no: 'INV/MSC1/2026/0029',
        invoice_date: '2026-10-29',
        bill_date: '2026-10-29',
        date: '2026-10-29',
        created_at: '2026-10-29T10:15:00.000Z',
        job_card_no: 'JC/MSC1/2026/0052',
        estimate_no: 'EST/MSC1/2026/0031-R4',
        customer_name: 'Rushi Dhiwar',
        customer_cin: 'CIN/MSC1/2026/000044',
        customer_mobile: '9876543456',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        net_payable: 649,
        grand_total: 649,
        gross_amount: 649,
        discount_amount: 0,
        total_tax: 0,
        amount_paid: 0,
        amount_received: 0,
        balance_amount: 649,
        balance_due: 649,
        payment_mode: 'UPI + Cash',
        status: 'CANCELLED',
        cancellation_reason: 'Client requested change of parts',
        is_reopened: true,
        has_subsequent_revision: true,
        reopened_to_revision_no: 'INV/MSC1/2026/0029-R1'
      };

      // 2. Revised Final Bill with Payment (Created at 12:45 on 2026-10-29)
      const revisedBill = {
        id: 'INV-DBILL-0029-R1',
        draft_bill_id: 'DBILL-0029-R1',
        draft_bill_no: 'INV/MSC1/2026/0029-R1',
        invoice_no: 'INV/MSC1/2026/0029-R1',
        bill_no: 'INV/MSC1/2026/0029-R1',
        invoice_date: '2026-10-29',
        bill_date: '2026-10-29',
        date: '2026-10-29',
        created_at: '2026-10-29T12:45:00.000Z',
        job_card_no: 'JC/MSC1/2026/0052',
        estimate_no: 'EST/MSC1/2026/0031-R4',
        customer_name: 'Rushi Dhiwar',
        customer_cin: 'CIN/MSC1/2026/000044',
        customer_mobile: '9876543456',
        vehicle_reg_no: 'MH12AC4335',
        vehicle_model: 'Tvs Jupiter',
        net_payable: 549,
        grand_total: 549,
        gross_amount: 549,
        discount_amount: 0,
        total_tax: 0,
        amount_paid: 49,
        amount_received: 49,
        balance_amount: 500,
        balance_due: 500,
        payment_mode: 'Cash + UPI',
        status: 'PARTIALLY_PAID',
        is_revision: true,
        revision_no: 'R1',
        original_bill_id: 'INV-MSC1-2026-0029',
        original_bill_no: 'INV/MSC1/2026/0029'
      };

      // 3. Previous day bill (Created at 16:30 on 2026-10-28)
      const bill0030 = {
        id: 'INV-MSC1-2026-0030',
        invoice_no: 'INV/MSC1/2026/0030',
        bill_no: 'INV/MSC1/2026/0030',
        invoice_date: '2026-10-28',
        bill_date: '2026-10-28',
        date: '2026-10-28',
        created_at: '2026-10-28T16:30:00.000Z',
        job_card_no: 'JC/MSC1/2026/0053',
        estimate_no: 'EST/MSC1/2026/0032',
        customer_name: 'Sagar Sable',
        customer_cin: 'CIN/MSC1/2026/000045',
        customer_mobile: '9865333534',
        vehicle_reg_no: 'MH14BH4335',
        vehicle_model: 'Honda Hornet',
        net_payable: 699,
        grand_total: 699,
        amount_paid: 0,
        amount_received: 0,
        balance_amount: 699,
        balance_due: 699,
        payment_mode: 'UPI',
        status: 'CANCELLED'
      };

      // 4. Latest New Bill today (Created at 15:30 on 2026-10-29 - Latest should be top!)
      const latestBill = {
        id: 'INV-MSC1-2026-0031',
        invoice_no: 'INV/MSC1/2026/0031',
        bill_no: 'INV/MSC1/2026/0031',
        invoice_date: '2026-10-29',
        bill_date: '2026-10-29',
        date: '2026-10-29',
        created_at: '2026-10-29T15:30:00.000Z',
        job_card_no: 'JC/MSC1/2026/0054',
        estimate_no: 'EST/MSC1/2026/0033',
        customer_name: 'Amit Sharma',
        customer_cin: 'CIN/MSC1/2026/000046',
        customer_mobile: '9822001122',
        vehicle_reg_no: 'MH12EF5678',
        vehicle_model: 'Honda Activa 6G',
        net_payable: 1200,
        grand_total: 1200,
        amount_paid: 1200,
        amount_received: 1200,
        balance_amount: 0,
        balance_due: 0,
        payment_mode: 'UPI',
        status: 'PAID'
      };

      window.DB.data.finalBills = [origBill, revisedBill, bill0030, latestBill];
      window.DB.data.draftBills = [];
      window.DB.saveData();

      // Set customer billing date range to include 2026-10-28
      window.BillingModule.setCustomerBillingFromDate('2026-10-28');
      window.BillingModule.setCustomerBillingToDate('2026-10-29');
      window.BillingModule.activeTab = 'CUSTOMER_BILLING';
      window.BillingModule.activeBillingBillId = null;
      window.BillingModule.customerBillingViewMode = 'TABLE';
      window.BillingModule.refresh();

      return true;
    })()`);

    console.log('Setup completed. Inspecting Customer Bills Queue table rows...');
    await new Promise(r => setTimeout(r, 600));

    const tableRows = await evalInPage(ws, `(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr.billing-queue-table-row'));
      return rows.map((r, i) => {
        const text = r.innerText.trim();
        const billNoDateCell = r.querySelector('td:nth-child(2)');
        const billNoEl = billNoDateCell ? billNoDateCell.querySelector('span.cell-mono') : null;
        const dateEl = billNoDateCell ? billNoDateCell.querySelector('div:nth-child(2)') : null;
        return {
          sr: i + 1,
          billNo: billNoEl ? billNoEl.innerText.trim() : '',
          dateText: dateEl ? dateEl.innerText.trim() : ''
        };
      });
    })()`);

    console.log('Table Rows in Customer Bills Queue:');
    console.table(tableRows);

    // Verify Date AND Time in each row
    const dateTimeRegex = /^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}$/;
    let allHaveDateTime = true;
    tableRows.forEach(row => {
      const valid = dateTimeRegex.test(row.dateText);
      console.log('Row ' + row.sr + ': ' + row.billNo + ' | Date/Time: "' + row.dateText + '" | Valid: ' + valid);
      if (!valid) allHaveDateTime = false;
    });

    // Verify Descending Order: Row 1 must be 0031 (15:30), Row 2 must be 0029-R1 (12:45), Row 3 must be 0029 (10:15), Row 4 must be 0030 (2026-10-28)
    const expectedOrder = [
      'INV/MSC1/2026/0031',
      'INV/MSC1/2026/0029-R1',
      'INV/MSC1/2026/0029',
      'INV/MSC1/2026/0030'
    ];
    const actualOrder = tableRows.map(r => r.billNo);
    console.log('Expected Order (Latest on top):', expectedOrder);
    console.log('Actual Order in UI:', actualOrder);

    const isOrderCorrect = JSON.stringify(actualOrder) === JSON.stringify(expectedOrder);
    console.log('Is Descending Order Correct?', isOrderCorrect);

    // Capture screenshot of Customer Bills Queue
    const queueScreenshotPath = path.join(artifactDir, 'customer_bills_queue_time_and_descending_verified.png');
    await captureScreenshot(ws, queueScreenshotPath);

    // Now switch to Bill List screen (#/final-bills)
    console.log('Navigating to Bill List screen...');
    await evalInPage(ws, `(() => {
      window.BillingModule.setFinalBillFromDate('ALL');
      window.BillingModule.setFinalBillToDate('ALL');
      window.location.hash = '#/final-bills';
      window.BillingModule.refresh();
    })()`);

    await new Promise(r => setTimeout(r, 600));

    const billListRows = await evalInPage(ws, `(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map((r, i) => {
        const cells = r.querySelectorAll('td');
        if (cells.length < 3) return null;
        return {
          sr: cells[0] ? cells[0].innerText.trim() : '',
          billNo: cells[1] ? cells[1].innerText.trim() : '',
          billDate: cells[2] ? cells[2].innerText.trim() : ''
        };
      }).filter(Boolean);
    })()`);

    console.log('Bill List Table Rows:');
    console.table(billListRows);

    let billListAllHaveDateTime = true;
    billListRows.forEach(row => {
      const valid = dateTimeRegex.test(row.billDate);
      console.log('Bill List Row ' + row.sr + ': ' + row.billNo + ' | Date/Time: "' + row.billDate + '" | Valid: ' + valid);
      if (!valid) billListAllHaveDateTime = false;
    });

    const billListActualOrder = billListRows.map(r => r.billNo);
    const isBillListOrderCorrect = JSON.stringify(billListActualOrder) === JSON.stringify(expectedOrder);
    console.log('Is Bill List Descending Order Correct?', isBillListOrderCorrect);

    // Capture screenshot of Bill List
    const billListScreenshotPath = path.join(artifactDir, 'bill_list_time_and_descending_verified.png');
    await captureScreenshot(ws, billListScreenshotPath);

    // Test Card View
    await evalInPage(ws, `(() => {
      window.location.hash = '#/customer-billing';
      window.BillingModule.customerBillingViewMode = 'CARDS';
      window.BillingModule.refresh();
    })()`);
    await new Promise(r => setTimeout(r, 600));
    const cardScreenshotPath = path.join(artifactDir, 'customer_bills_queue_cards_time_verified.png');
    await captureScreenshot(ws, cardScreenshotPath);

    console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
    console.log({
      allHaveDateTime,
      isOrderCorrect,
      billListAllHaveDateTime,
      isBillListOrderCorrect
    });

    ws.close();
    proc.kill();
    process.exit((allHaveDateTime && isOrderCorrect && billListAllHaveDateTime && isBillListOrderCorrect) ? 0 : 1);
  } catch (err) {
    console.error('Test execution failed:', err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 2500);
