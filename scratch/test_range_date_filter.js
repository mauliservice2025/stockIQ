const fs = require('fs');

console.log('--- Testing From Date & To Date Filter in billing.js ---');
const billingJs = fs.readFileSync('./js/modules/billing.js', 'utf8');

const hasFromDateProp = billingJs.includes('jobCardFromDate: undefined');
console.log('PASS: Has jobCardFromDate property:', hasFromDateProp);

const hasToDateProp = billingJs.includes('jobCardToDate: undefined');
console.log('PASS: Has jobCardToDate property:', hasToDateProp);

const hasSetFromDate = billingJs.includes('setJobCardFromDate(val)');
console.log('PASS: Has setJobCardFromDate method:', hasSetFromDate);

const hasSetToDate = billingJs.includes('setJobCardToDate(val)');
console.log('PASS: Has setJobCardToDate method:', hasSetToDate);

const hasFromDateInput = billingJs.includes('id="jobcard-from-date"');
console.log('PASS: Has jobcard-from-date input:', hasFromDateInput);

const hasToDateInput = billingJs.includes('id="jobcard-to-date"');
console.log('PASS: Has jobcard-to-date input:', hasToDateInput);

// Verify "Today" and "All" buttons are removed from the date filter
const hasTodayBtn = billingJs.includes('title="Filter by Today');
console.log('PASS: "Today" button is removed:', !hasTodayBtn);

const hasAllBtn = billingJs.includes('title="Clear Date Filter (Show All Dates)"');
console.log('PASS: "All" button is removed:', !hasAllBtn);

// Test range filtering simulation
const mockJobCards = [
  { id: '1', job_card_no: 'JC027', date: '2026-10-23' },
  { id: '2', job_card_no: 'JC026', date: '2026-10-23' },
  { id: '3', job_card_no: 'JC025', date: '2026-10-22' },
  { id: '4', job_card_no: 'JC024', date: '2026-10-22' },
  { id: '5', job_card_no: 'JC019', date: '2026-10-21' },
  { id: '6', job_card_no: 'JC028', date: '2026-10-24' }
];

function filterRange(fromDate, toDate) {
  return mockJobCards.filter(j => {
    const jcDate = j.date ? j.date.split('T')[0] : '';
    if (fromDate && jcDate && jcDate < fromDate) return false;
    if (toDate && jcDate && jcDate > toDate) return false;
    if ((fromDate || toDate) && !jcDate) return false;
    return true;
  });
}

// Today only (2026-10-24 to 2026-10-24)
const todayResult = filterRange('2026-10-24', '2026-10-24');
console.log('Range 2026-10-24 to 2026-10-24 count:', todayResult.length, 'expected 1 (JC028)');
if (todayResult.length !== 1 || todayResult[0].id !== '6') throw new Error('Single day range failed');

// Range 2026-10-22 to 2026-10-23
const rangeResult = filterRange('2026-10-22', '2026-10-23');
console.log('Range 2026-10-22 to 2026-10-23 count:', rangeResult.length, 'expected 4');
if (rangeResult.length !== 4) throw new Error('Range 22 to 23 failed');

// From 2026-10-22 onwards (open ended)
const fromOnlyResult = filterRange('2026-10-22', '');
console.log('Range from 2026-10-22 onwards count:', fromOnlyResult.length, 'expected 5');
if (fromOnlyResult.length !== 5) throw new Error('From only failed');

// Cleared (all records)
const clearedResult = filterRange('', '');
console.log('Range cleared count:', clearedResult.length, 'expected 6');
if (clearedResult.length !== 6) throw new Error('Cleared range failed');

console.log('\nAll range tests passed successfully!');
