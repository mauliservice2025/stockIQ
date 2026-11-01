const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless',
  '--remote-debugging-port=9229',
  '--user-data-dir=C:\\temp\\edge-est-rev-profile',
  '--window-size=1600,1050',
  'http://localhost:3000/#/billing-estimates'
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
    const listRes = await fetch('http://127.0.0.1:9229/json');
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

    // Wait for page hydration
    await new Promise(r => setTimeout(r, 2000));

    // Execute comprehensive test inside browser
    const testResult = await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        (function() {
          const results = [];
          const log = (name, pass, info) => results.push({ name, pass, info });

          // 1. Ensure user is logged in as admin / authorized
          window.State.currentUser = {
            id: 'USR-001',
            username: 'PRAVINP',
            name: 'Pravin Patil',
            role: 'ADMIN',
            primary_role: 'ADMIN',
            permissions: { '*' : true }
          };

          // 2. Switch to billing estimates tab
          window.BillingModule.currentTab = 'estimates';
          window.BillingModule.refresh();

          // Clean up any old EST-001 test records to start fresh
          const existingAll = window.DB.getAll('billingEstimates') || [];
          existingAll.forEach(e => {
            if (String(e.estimate_no || '').startsWith('EST-001')) {
              if (window.DB.delete) window.DB.delete('billingEstimates', e.id);
            }
          });
          if (window.DB.data && window.DB.data.billingEstimates) {
            window.DB.data.billingEstimates = window.DB.data.billingEstimates.filter(e => !String(e.estimate_no || '').startsWith('EST-001'));
          }
          if (window.DB.saveData) window.DB.saveData();

          // 3. Create or prepare a clean base estimate 'EST-001'
          let existingJcs = window.DB.getAll('jobCards') || [];
          let testJc = existingJcs.find(j => j.vehicle_reg_no === 'MH12AC4335' || j.job_card_no === 'JC/MSC1/2026/0051') || existingJcs[0];
          if (!testJc) {
            testJc = {
              id: 'JC-MSC1-2026-0051',
              job_card_no: 'JC/MSC1/2026/0051',
              customer_cin: 'CIN/MSC/2026/000043',
              customer_name: 'Rushi Dhiwar',
              customer_mobile: '8965435645',
              vehicle_reg_no: 'MH12AC4335',
              vehicle_model: 'Tvs Jupiter',
              status: 'ESTIMATE_PENDING',
              created_at: new Date().toISOString()
            };
            window.DB.upsert('jobCards', testJc);
          }

          const baseEstId = 'EST-TEST-001';
          const baseEst = {
            id: baseEstId,
            estimate_no: 'EST-001',
            job_card_id: testJc.id,
            job_card_no: testJc.job_card_no,
            customer_cin: testJc.customer_cin || 'CIN/MSC/2026/000043',
            customer_name: testJc.customer_name || 'Rushi Dhiwar',
            customer_mobile: testJc.customer_mobile || '8965435645',
            vehicle_reg_no: testJc.vehicle_reg_no || 'MH12AC4335',
            vehicle_model: testJc.vehicle_model || 'Tvs Jupiter',
            service_type: 'General Service',
            odometer_km: '78674',
            customer_complaints: 'Engine noise, general servicing',
            terms_and_remarks: 'Estimate valid for 7 days. Genuine OEM parts.',
            items: [
              { id: 'IT-1', code: 'LBR-001', name: 'General Service Labour', type: 'LABOUR', qty: 1, rate: 399, amount: 399 },
              { id: 'IT-2', code: '2W-SPR-001', name: 'Engine Valve Set', type: 'PART', qty: 2, rate: 150, amount: 300 }
            ],
            subtotal: 699,
            discount_type: 'AMOUNT',
            discount_value: 0,
            discount_amount: 0,
            taxable_amount: 699,
            tax_rate: 0,
            tax_amount: 0,
            estimated_total: 699,
            status: 'SUBMITTED',
            submitted_at: new Date().toISOString(),
            submitted_by: 'Pravin Patil',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          window.DB.upsert('billingEstimates', baseEst);
          window.BillingModule.activeEstimateId = baseEst.id;
          window.BillingModule.activeEstimate = baseEst;
          window.BillingModule.refresh();

          // Verify base estimate is locked (read-only)
          const baseIsLocked = window.BillingModule.isEstimateLocked(baseEst);
          log('Base EST-001 locked in SUBMITTED status', baseIsLocked === true, { status: baseEst.status });

          // 4. Test First Revision: Click Revise Estimate on EST-001
          const rev1 = window.BillingModule.reviseEstimate(baseEst.id);
          log('Revise EST-001 generates EST-001-R1', rev1 && rev1.estimate_no === 'EST-001-R1', {
            estimate_no: rev1 ? rev1.estimate_no : null,
            revision_no: rev1 ? rev1.revision_no : null
          });
          log('Rev1 is in editable DRAFT mode', rev1 && rev1.status === 'DRAFT' && window.BillingModule.isEstimateLocked(rev1) === false, {
            status: rev1 ? rev1.status : null,
            isLocked: window.BillingModule.isEstimateLocked(rev1)
          });
          log('Rev1 links to original estimate', rev1 && rev1.original_estimate_id === baseEst.id && rev1.previous_estimate_no === 'EST-001', {
            original_estimate_id: rev1 ? rev1.original_estimate_id : null,
            previous_estimate_no: rev1 ? rev1.previous_estimate_no : null
          });

          // Check original estimate is now REVISED and superseded
          const updatedBase = window.DB.getById('billingEstimates', baseEst.id);
          log('Original EST-001 archived as REVISED', updatedBase && updatedBase.status === 'REVISED' && updatedBase.superseded_by_no === 'EST-001-R1', {
            status: updatedBase ? updatedBase.status : null,
            superseded_by_no: updatedBase ? updatedBase.superseded_by_no : null
          });

          // 5. Test Editing Rev1: Add item and change rate in Rev1
          rev1.items.push({
            id: 'IT-3',
            code: '2W-SPR-002',
            name: 'Disc Brake Pad Set',
            type: 'PART',
            qty: 1,
            rate: 450,
            amount: 450
          });
          window.BillingModule.recalculateEstimateTotals(rev1);
          window.DB.upsert('billingEstimates', rev1);
          window.BillingModule.refresh();

          // Verify original estimate's items were NOT mutated
          const checkBaseAgain = window.DB.getById('billingEstimates', baseEst.id);
          log('Original EST-001 items remain unchanged (2 items)', checkBaseAgain && checkBaseAgain.items.length === 2, {
            baseItemCount: checkBaseAgain ? checkBaseAgain.items.length : 0,
            rev1ItemCount: rev1.items.length
          });

          // 6. Submit Rev1: follows existing submission rules
          window.BillingModule.activeEstimateId = rev1.id;
          window.BillingModule.activeEstimate = rev1;
          window.BillingModule.submitEstimate();

          const submittedRev1 = window.DB.getById('billingEstimates', rev1.id);
          log('Submitted Rev1 keeps EST-001-R1 and locks', submittedRev1 && submittedRev1.status === 'SUBMITTED' && submittedRev1.estimate_no === 'EST-001-R1', {
            status: submittedRev1 ? submittedRev1.status : null,
            estimate_no: submittedRev1 ? submittedRev1.estimate_no : null
          });

          // 7. Test Second Revision: Click Revise Estimate on EST-001-R1 -> Should generate EST-001-R2
          const rev2 = window.BillingModule.reviseEstimate(rev1.id);
          log('Revise EST-001-R1 generates EST-001-R2', rev2 && rev2.estimate_no === 'EST-001-R2' && rev2.revision_no === 2, {
            estimate_no: rev2 ? rev2.estimate_no : null,
            revision_no: rev2 ? rev2.revision_no : null
          });
          log('Rev2 is in editable DRAFT mode', rev2 && rev2.status === 'DRAFT' && window.BillingModule.isEstimateLocked(rev2) === false, {
            status: rev2 ? rev2.status : null
          });

          const checkRev1Superseded = window.DB.getById('billingEstimates', rev1.id);
          log('Rev1 is archived as REVISED superseded by EST-001-R2', checkRev1Superseded && checkRev1Superseded.status === 'REVISED' && checkRev1Superseded.superseded_by_no === 'EST-001-R2', {
            status: checkRev1Superseded ? checkRev1Superseded.status : null,
            superseded_by_no: checkRev1Superseded ? checkRev1Superseded.superseded_by_no : null
          });

          // 8. Test Third Revision: Submit Rev2 and click Revise Estimate -> Should generate EST-001-R3
          window.BillingModule.activeEstimateId = rev2.id;
          window.BillingModule.activeEstimate = rev2;
          window.BillingModule.submitEstimate();

          const rev3 = window.BillingModule.reviseEstimate(rev2.id);
          log('Revise EST-001-R2 generates EST-001-R3', rev3 && rev3.estimate_no === 'EST-001-R3' && rev3.revision_no === 3, {
            estimate_no: rev3 ? rev3.estimate_no : null,
            revision_no: rev3 ? rev3.revision_no : null
          });

          // Refresh UI to display active Rev3
          window.BillingModule.activeEstimateId = rev3.id;
          window.BillingModule.activeEstimate = rev3;
          window.BillingModule.refresh();

          return {
            results,
            allPassed: results.every(r => r.pass)
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Test Evaluation Result:', JSON.stringify(testResult, null, 2));

    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot of the Estimate screen showing the revision chain and editable mode
    const snap1 = await sendCdp(ws, 'Page.captureScreenshot');
    fs.writeFileSync('C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\estimate_revision_workflow.png', Buffer.from(snap1.data, 'base64'));
    console.log('Saved estimate_revision_workflow.png');

    // Also open the Audit Trail modal to verify audit trail & history view
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        window.BillingModule.showEstimateAuditModal(window.BillingModule.activeEstimateId);
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const snap2 = await sendCdp(ws, 'Page.captureScreenshot');
    fs.writeFileSync('C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\estimate_revision_audit_modal.png', Buffer.from(snap2.data, 'base64'));
    console.log('Saved estimate_revision_audit_modal.png');

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error during test execution:', err);
    proc.kill();
    process.exit(1);
  }
}, 3000);
