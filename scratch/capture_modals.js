const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9231',
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
    const listRes = await fetch('http://127.0.0.1:9231/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('3000'));
    if (!pageTab) {
      console.error('Page tab not found');
      proc.kill();
      process.exit(1);
    }

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    // 1. Create Mock and open Cancellation Modal
    await evalInPage(ws, `(() => {
      const testBill = {
        id: 'INV-DEMO-001',
        invoice_no: 'BILL001',
        bill_no: 'BILL001',
        customer_name: 'Rushi Dhiwar',
        vehicle_reg_no: 'MH12AC4335',
        grand_total: 949,
        net_payable: 949,
        amount_paid: 0,
        status: 'FINALIZED',
        items: [{ id: '1', name: 'General Service Labour', rate: 399, qty: 1, type: 'LABOUR' }]
      };
      window.DB.upsert('finalBills', testBill);
      window.BillingModule.showCancelBillModal('INV-DEMO-001');
    })()`);
    await new Promise(r => setTimeout(r, 600));
    let ss = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\bill_cancellation_modal_verified.png', Buffer.from(ss.data, 'base64'));

    // 2. Open Reopen Modal
    await evalInPage(ws, `(() => {
      const b = window.DB.getById('finalBills', 'INV-DEMO-001');
      b.status = 'CANCELLED';
      b.cancellation_reason = 'Pricing / Tax Calculation Error';
      window.DB.upsert('finalBills', b);
      window.BillingModule.showReopenBillModal('INV-DEMO-001');
    })()`);
    await new Promise(r => setTimeout(r, 600));
    ss = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\bill_reopen_modal_verified.png', Buffer.from(ss.data, 'base64'));

    // 3. Open WhatsApp Share Modal
    await evalInPage(ws, `(() => {
      const b = window.DB.getById('finalBills', 'INV-DEMO-001');
      b.status = 'REVISED_PAYMENT_PENDING';
      b.invoice_no = 'BILL001-R1';
      window.DB.upsert('finalBills', b);
      window.BillingModule.shareInvoiceWhatsApp('INV-DEMO-001', 'TEXT');
    })()`);
    await new Promise(r => setTimeout(r, 600));
    ss = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\bill_whatsapp_share_modal_verified.png', Buffer.from(ss.data, 'base64'));

    // Cleanup
    await evalInPage(ws, `(() => {
      window.DB.delete('finalBills', 'INV-DEMO-001');
      window.State.closeModal();
    })()`);

    console.log('Modals captured successfully!');
    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    proc.kill();
    process.exit(1);
  }
}, 3000);
