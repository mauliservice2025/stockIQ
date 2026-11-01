const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9232',
  '--user-data-dir=C:\\temp\\edge-jc-edit-profile',
  '--window-size=1600,1000',
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

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9232/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    if (!pageTab) {
      console.error('Page tab not found');
      proc.kill();
      process.exit(1);
    }

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(res => ws.addEventListener('open', res));
    console.log('Connected to CDP');

    await new Promise(r => setTimeout(r, 1500));

    // Ensure we are in Table View, have a Job Card, and reset filters to see all Job Cards
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        if (window.BillingModule) {
          const cards = window.DB.getAll('jobCards') || [];
          if (cards.length === 0) {
            window.DB.upsert('jobCards', {
              id: 'JC-0051',
              job_card_no: 'JC/MSC1/2026/0051',
              date: '2026-10-28',
              customer_name: 'Rushi Dhiwar',
              customer_mobile: '8965435645',
              cin_number: 'CIN/MSC/2026/000043',
              vehicle_reg_no: 'MH 12 AC 4335',
              vehicle_model: 'TVS Jupiter',
              vehicle_variant: 'Standard',
              odometer_km: 70674,
              fuel_level: '25%',
              technician_name: 'Sanket Borole',
              status: 'ESTIMATE_PENDING',
              parts_required: []
            });
          }
          window.BillingModule.jobCardViewMode = 'TABLE';
          window.BillingModule.jobCardFromDate = '';
          window.BillingModule.jobCardToDate = '';
          window.BillingModule.jobCardStatusFilter = 'ALL';
          window.BillingModule.jobCardTypeFilter = 'ALL';
          window.BillingModule.refresh();
        }
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Inspect Job Card table
    const tableCheck = await sendCdp(ws, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const rows = document.querySelectorAll('.data-table tbody tr');
          if (rows.length === 0) return { error: 'No rows' };
          const firstRow = rows[0];
          const cells = firstRow.querySelectorAll('td');
          // Cell 2 is Customer Name & Phone
          const custCell = cells[2];
          const hasEditInCustCell = custCell ? custCell.innerHTML.includes('✏️') : false;

          // Last cell is Actions
          const actionCell = cells[cells.length - 1];
          const hasEditInActionCell = actionCell ? actionCell.innerHTML.includes('✏️') : false;
          const editBtnInAction = actionCell ? actionCell.querySelector('button[title*="Edit"]') : null;

          // Check for any "patient" text in the page
          const pageText = document.body.innerText;
          const hasPatientKeyword = /patient/i.test(pageText);

          return {
            rowCount: rows.length,
            hasEditInCustCell: hasEditInCustCell,
            hasEditInActionCell: hasEditInActionCell,
            editBtnTitle: editBtnInAction ? editBtnInAction.title : null,
            hasPatientKeyword: hasPatientKeyword,
            custCellText: custCell ? custCell.innerText.trim() : '',
            actionButtonsCount: actionCell ? actionCell.querySelectorAll('button').length : 0
          };
        })()
      `
    });
    console.log('Table verification result:', tableCheck.result.value);

    // Capture screenshot of the table with edit button in Actions column
    const snap1 = await sendCdp(ws, 'Page.captureScreenshot');
    const path1 = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\job_card_edit_in_action_column.png';
    fs.writeFileSync(path1, Buffer.from(snap1.data, 'base64'));
    console.log('Saved table screenshot to:', path1);

    // Now click the edit button in the Actions column
    console.log('Clicking edit button in Actions column...');
    const clickEditRes = await sendCdp(ws, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const actionCell = document.querySelector('.data-table tbody tr:first-child td:last-child');
          const editBtn = actionCell ? actionCell.querySelector('button[title*="Edit"]') : null;
          if (!editBtn) return { error: 'Edit button not found in action column' };
          editBtn.click();
          return { clicked: true };
        })()
      `
    });
    console.log('Click edit result:', clickEditRes.result.value);

    await new Promise(r => setTimeout(r, 800));

    // Verify modal opened
    const modalCheck = await sendCdp(ws, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const overlay = document.getElementById('customer-ownership-overlay');
          if (!overlay) return { isOpen: false };
          const modalText = overlay.innerText;
          return {
            isOpen: true,
            hasPatientKeyword: /patient/i.test(modalText),
            modalTitle: overlay.querySelector('span[style*="font-weight: 700"]')?.innerText || '',
            sections: Array.from(overlay.querySelectorAll('div[style*="font-weight: 700"]')).map(d => d.innerText)
          };
        })()
      `
    });
    console.log('Modal verification result:', modalCheck.result.value);

    // Capture screenshot of the edit modal
    const snap2 = await sendCdp(ws, 'Page.captureScreenshot');
    const path2 = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\job_card_customer_edit_modal.png';
    fs.writeFileSync(path2, Buffer.from(snap2.data, 'base64'));
    console.log('Saved modal screenshot to:', path2);

    ws.close();
    proc.kill();

    const t = tableCheck.result.value;
    const m = modalCheck.result.value;
    if (!t.hasEditInCustCell && t.hasEditInActionCell && !t.hasPatientKeyword && m.isOpen && !m.hasPatientKeyword) {
      console.log('=== ALL TESTS PASSED PERFECTLY ===');
      process.exit(0);
    } else {
      console.error('Test criteria failed:', { t, m });
      process.exit(1);
    }
  } catch (err) {
    console.error('Error during test:', err);
    proc.kill();
    process.exit(1);
  }
}, 1500);
