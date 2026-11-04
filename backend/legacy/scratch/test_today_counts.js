const fs = require('fs');
const mockDataCode = fs.readFileSync('d:/Projects/ISCM/js/data/mock-data.js', 'utf8');

// evaluate with const replaced by var
const code = mockDataCode.replace('const INITIAL_DATA', 'var INITIAL_DATA');
const vm = require('vm');
const sandbox = {};
vm.runInNewContext(code, sandbox);
const data = sandbox.INITIAL_DATA;

const todayStr = '2026-10-25';
console.log('Today:', todayStr);

const jc = (data.jobCards || []);
console.log('Total job cards:', jc.length);
console.log('Today job cards count:', jc.filter(j => (j.date || '').startsWith(todayStr)).length);
console.log('Job card dates:', jc.map(j => ({ no: j.job_card_no, date: j.date, plant: j.plant_id || j.branch_id || j.facility_id })));

const est = (data.billingEstimates || []);
console.log('Total estimates:', est.length);
console.log('Today estimates count:', est.filter(e => (e.date || e.estimate_date || '').startsWith(todayStr)).length);
console.log('Estimate dates:', est.map(e => ({ no: e.estimate_no, date: e.date || e.estimate_date })));

const drafts = (data.draftBills || []);
console.log('Total draft bills:', drafts.length);
console.log('Today draft bills count:', drafts.filter(d => (d.date || d.bill_date || '').startsWith(todayStr)).length);

const fb = (data.finalBills || []);
console.log('Total final bills:', fb.length);
console.log('Today final bills count:', fb.filter(b => (b.date || b.bill_date || b.invoice_date || '').startsWith(todayStr)).length);

const del = (data.vehicleDeliveries || []);
console.log('Total deliveries:', del.length);
console.log('Today deliveries count:', del.filter(d => (d.date || d.delivery_date || '').startsWith(todayStr)).length);
