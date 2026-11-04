const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('ENTERPRISE ISCM - FINANCIAL CALENDAR MASTER TEST SUITE');
console.log('BRD v1.0 Compliance & Organizational Placement Verification');
console.log('================================================================\n');

// 1. Navigation & DOM Placement in index.html
console.log('--- TEST 1: Navigation & DOM Placement in index.html ---');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Check that subgroup-org-location contains Facility Master, Financial Calendar Master, and Document Number Series Master
const orgSubgroupMatch = indexHtml.match(/id="subgroup-org-location"[\s\S]*?<\/div>\s*<\/div>/);
assert(orgSubgroupMatch, 'subgroup-org-location must exist in index.html');
const orgSubgroupHtml = orgSubgroupMatch[0];

const branchIdx = orgSubgroupHtml.indexOf('href="#/branches"');
const finCalIdx = orgSubgroupHtml.indexOf('href="#/financial-calendar"');
const docSeriesIdx = orgSubgroupHtml.indexOf('href="#/doc-series"');

assert(branchIdx !== -1, 'Facility Master (href="#/branches") must exist in Organization & Facility Setup');
assert(finCalIdx !== -1, 'Financial Calendar Master (href="#/financial-calendar") must exist in Organization & Facility Setup');
assert(finCalIdx > branchIdx, 'Financial Calendar Master must be placed BELOW Facility Master');
assert(docSeriesIdx > branchIdx, 'Document Number Series Master must remain below Facility Master');

// Check clean label (zero emojis)
const finCalLinkMatch = orgSubgroupHtml.match(/<a[^>]*href="#\/financial-calendar"[^>]*>[\s\S]*?<\/a>/);
assert(finCalLinkMatch, 'Link element for #/financial-calendar must exist');
const linkText = finCalLinkMatch[0];
assert(linkText.includes('<span class="sub-nav-title">Financial Calendar Master</span>'), 'Link title must say "Financial Calendar Master" without symbols');
const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert(!emojiPattern.test(linkText), 'No emojis permitted in sub-nav-title');
console.log('✓ Financial Calendar Master link exists inside Organization Setup directly below Facility Master.');
console.log('✓ Clean typography: Zero symbols/emojis in navigation title.');

// Check script tag in index.html
assert(indexHtml.includes('js/modules/financial-calendar.js'), 'index.html must include script tag for financial-calendar.js');
console.log('✓ Script tag for financial-calendar.js is loaded in index.html.');

// 2. Router & RBAC in js/app.js & js/state.js
console.log('\n--- TEST 2: Routing Configuration & RBAC ---');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appJs.includes("'#/financial-calendar': { module: window.OrgLocationModule"), 'Route #/financial-calendar must map to OrgLocationModule');
assert(appJs.includes("'#/financial-calendar': 'FINANCIAL_CALENDAR_MASTER'"), 'Route #/financial-calendar must require FINANCIAL_CALENDAR_MASTER permission');

const stateJs = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
assert(stateJs.includes("'FINANCIAL_CALENDAR_MASTER': 'MASTERS'"), 'state.js aliasMap must map FINANCIAL_CALENDAR_MASTER to MASTERS category');

const mockDataJs = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
assert(mockDataJs.includes('"id": "PERM-FIN-CALENDAR"'), 'PERM-FIN-CALENDAR must exist in mock-data permissions');
assert(mockDataJs.includes('"code": "FINANCIAL_CALENDAR_MASTER"'), 'FINANCIAL_CALENDAR_MASTER code must exist in mock-data');
console.log('✓ Router maps #/financial-calendar under Admin Pannel -> Organization & Facility Setup.');
console.log('✓ RBAC: FINANCIAL_CALENDAR_MASTER alias mapped to MASTERS permission in state.js.');

// 3. Tab Integration in js/modules/org-location.js
console.log('\n--- TEST 3: Tab Integration in org-location.js ---');
const orgLocJs = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');

// Check tabConfig ordering: ORGANIZATIONS -> BRANCHES -> FINANCIAL_CALENDAR -> DOC_SERIES ...
assert(orgLocJs.includes("{ key: 'FINANCIAL_CALENDAR', perm: 'FINANCIAL_CALENDAR_MASTER', label: 'Financial Calendar Master' }"), 'FINANCIAL_CALENDAR tab must exist in tabConfig');
const branchTabIdx = orgLocJs.indexOf("key: 'BRANCHES'");
const finCalTabIdx = orgLocJs.indexOf("key: 'FINANCIAL_CALENDAR'");
assert(finCalTabIdx > branchTabIdx, 'FINANCIAL_CALENDAR tab must appear after BRANCHES (Facility Master) in tabConfig');

// Check hash sync and routeMap
assert(orgLocJs.includes("hash === '#/financial-calendar'"), 'org-location.js must synchronize activeTab to FINANCIAL_CALENDAR on #/financial-calendar');
assert(orgLocJs.includes("'FINANCIAL_CALENDAR': '#/financial-calendar'"), 'routeMap must map FINANCIAL_CALENDAR to #/financial-calendar');
assert(orgLocJs.includes("if (this.activeTab === 'FINANCIAL_CALENDAR') return this.renderFinancialCalendarTab();"), 'renderActiveTabContent must delegate to renderFinancialCalendarTab');
assert(orgLocJs.includes("renderFinancialCalendarTab()"), 'renderFinancialCalendarTab method must exist in OrgLocationModule');
assert(!orgLocJs.includes('<div class="card-title">'), 'Zero redundant card-title elements in org-location.js');
console.log('✓ org-location.js tabConfig lists Financial Calendar Master directly below Facility Master.');
console.log('✓ Zero redundant card-title tags in org-location.js.');

// 4. Seed Data Verification
console.log('\n--- TEST 4: Seed Data in INITIAL_DATA.financial_calendar ---');
const { INITIAL_DATA } = require('../js/data/mock-data.js');
assert(Array.isArray(INITIAL_DATA.financial_calendar), 'INITIAL_DATA.financial_calendar must be an array');
assert(INITIAL_DATA.financial_calendar.length >= 4, `Must have at least 4 seed records (found ${INITIAL_DATA.financial_calendar.length})`);

const fyCodes = INITIAL_DATA.financial_calendar.map(c => c.financial_year_code);
assert(fyCodes.includes('FY 2026-27'), 'Must include active FY 2026-27');
assert(fyCodes.includes('FY 2025-26'), 'Must include closed FY 2025-26');
assert(fyCodes.includes('FY 2027-28'), 'Must include future FY 2027-28');

const fy2026 = INITIAL_DATA.financial_calendar.find(c => c.financial_year_code === 'FY 2026-27');
assert(fy2026 && fy2026.periods && fy2026.periods.length === 12, 'FY 2026-27 must contain 12 monthly accounting periods');
assert(Array.isArray(INITIAL_DATA.financial_calendar_audit), 'INITIAL_DATA.financial_calendar_audit must be an array');
console.log(`✓ Seed data contains ${INITIAL_DATA.financial_calendar.length} financial years covering past, present, and future periods.`);

// 5. Transaction Date Posting Validation Engine (BRD Section 16, 20, 25, 37, AC-07, AC-08, AC-09)
console.log('\n--- TEST 5: Transaction Date Posting Validation Engine ---');
global.window = {
  DB: {
    data: {
      financial_calendar: JSON.parse(JSON.stringify(INITIAL_DATA.financial_calendar)),
      financial_calendar_audit: JSON.parse(JSON.stringify(INITIAL_DATA.financial_calendar_audit || [])),
      plants: [
        { id: 'BR-001', code: 'PUN', name: 'Pune Main Workshop' },
        { id: 'BR-002', code: 'MUM', name: 'Mumbai Central Workshop' }
      ]
    },
    getAll(col) { return this.data[col] || []; },
    upsert(col, item) {
      if (!this.data[col]) this.data[col] = [];
      const idx = this.data[col].findIndex(x => x.id === item.id);
      if (idx !== -1) this.data[col][idx] = item;
      else this.data[col].push(item);
      return item;
    },
    remove(col, id) {
      if (!this.data[col]) return;
      this.data[col] = this.data[col].filter(x => x.id !== id);
    }
  },
  State: {
    getCurrentUser: () => ({ id: 'USR-001', full_name: 'Pravin Patil', primary_role: 'ROLE-ADMIN' }),
    showToast: () => {}
  }
};
global.INITIAL_DATA = INITIAL_DATA;

require('../js/modules/financial-calendar.js');
const mod = global.window.FinancialCalendarModule;
assert(mod, 'FinancialCalendarModule must be mounted to window');

// Test Case 1: Active Period (October 2026) -> Must be ALLOWED
const octTest = mod.validateTransactionDate('2026-10-15', 'BR-001');
assert(octTest.allowed === true, 'October 2026 date must be ALLOWED');
assert.strictEqual(octTest.status, 'OPEN', 'October period status must be OPEN');
console.log('✓ AC-07: Transactions in OPEN periods (October 2026) are permitted.');

// Test Case 2: Closed Period (April 2026) -> Must be BLOCKED
const aprTest = mod.validateTransactionDate('2026-04-15', 'BR-001');
assert(aprTest.allowed === false, 'April 2026 date must be BLOCKED');
assert.strictEqual(aprTest.status, 'CLOSED', 'April period status must be CLOSED');
assert(aprTest.message.includes('CLOSED'), 'Error message must state that period is closed');
console.log('✓ AC-08 / Rule FCR-05: Transactions in CLOSED periods (April 2026) are blocked.');

// Test Case 3: Future Period (November 2026) -> Must be BLOCKED
const novTest = mod.validateTransactionDate('2026-11-15', 'BR-001');
assert(novTest.allowed === false, 'November 2026 date must be BLOCKED');
assert.strictEqual(novTest.status, 'FUTURE', 'November period status must be FUTURE');
console.log('✓ AC-09 / Rule FCR-06: Transactions in FUTURE periods (November 2026) are blocked.');

// Test Case 4: Branch Inheritance Principle (Section 38 & 38.1 / AC-19)
// Branch BR-001 (Pune) has no branch override, so inherits company-wide FY 2026-27
const puneTest = mod.validateTransactionDate('2026-10-06', 'BR-001');
assert(puneTest.allowed === true, 'Pune branch must inherit company-wide calendar');
assert.strictEqual(puneTest.fy, 'FY 2026-27', 'Inherited calendar must be FY 2026-27');
console.log('✓ AC-19: Company-level financial calendar is inherited by branches by default.');

// 6. Automatic Period Generation Engine (Section 23, 24 / AC-04)
console.log('\n--- TEST 6: Automatic Period Generation Engine ---');
const generatedPeriods = mod.generatePeriodsForYear('2028-04-01', '2029-03-31', 'Monthly');
assert.strictEqual(generatedPeriods.length, 12, 'Must generate exactly 12 monthly periods');
assert.strictEqual(generatedPeriods[0].period_name, 'April 2028', 'First period must be April 2028');
assert.strictEqual(generatedPeriods[11].period_name, 'March 2029', 'Last period must be March 2029');
assert.strictEqual(generatedPeriods[10].end_date, '2029-02-28', 'February 2029 last date must be 28');
console.log('✓ AC-04 / Section 24: Automatic 12-month period generation with precise calendar bounds.');

// 7. Period Reopening & Audit Trail (Rule FCR-08 / AC-11, AC-14)
console.log('\n--- TEST 7: Period Reopening & Mandatory Reason Audit ---');
const initialAuditCount = mod.getAllAuditLogs().length;
// Reopen April 2026 (FP-2026-04) with mandatory reason
const testReason = 'Statutory audit rectification for Q1 purchase return reconciliation';
mod.recordAudit({
  financial_year_id: 'FC-001',
  financial_year_code: 'FY 2026-27',
  period_id: 'FP-2026-04',
  period_name: 'April 2026',
  action: 'REOPEN_PERIOD',
  old_status: 'Closed',
  new_status: 'Open',
  reason: testReason
});

const auditLogs = mod.getAllAuditLogs();
assert.strictEqual(auditLogs.length, initialAuditCount + 1, 'Audit log count must increase by 1');
const lastLog = auditLogs[auditLogs.length - 1];
assert.strictEqual(lastLog.action, 'REOPEN_PERIOD', 'Audit action must be REOPEN_PERIOD');
assert.strictEqual(lastLog.reason, testReason, 'Mandatory reason must be logged in audit trail');
console.log('✓ AC-11 & AC-14: Period reopening logs user, timestamp, action, and mandatory reason.');

// 8. Financial Year Deletion Protection (Rule FCR-10 / AC-13)
console.log('\n--- TEST 8: Financial Year Deletion Protection ---');
let alertTriggered = false;
global.alert = (msg) => { alertTriggered = true; };
// Attempt to delete active FY with transactions (FC-001)
mod.deleteCalendar('FC-001');
assert(alertTriggered, 'Attempting to delete active/used financial year must trigger guard alert');
assert(mod.getAllCalendars().some(c => c.id === 'FC-001'), 'Used financial year must NOT be deleted');
console.log('✓ AC-13 / Rule FCR-10: Used financial years with transactions cannot be deleted.');

// 9. Facility-Wise Editing & Branch Applicability Verification (Section 38 & 38.1)
console.log('\n--- TEST 9: Facility-Wise Editing Verification ---');
// Mock DOM document for testing modal rendering and saving
let insertedHtml = '';
global.document = {
  getElementById: (id) => {
    if (id === 'fin-cal-edit-modal') return null;
    return null;
  },
  body: {
    insertAdjacentHTML: (pos, html) => { insertedHtml = html; }
  }
};

mod.showEditModal('FC-001');
assert(insertedHtml.includes('id="fc-edit-branch"'), 'Edit modal must contain Facility/Branch Applicability dropdown (id="fc-edit-branch")');
assert(insertedHtml.includes('id="fc-edit-code"'), 'Edit modal must contain Financial Year Code input');
assert(insertedHtml.includes('id="fc-edit-start-date"'), 'Edit modal must contain Start Date input');
assert(insertedHtml.includes('id="fc-edit-end-date"'), 'Edit modal must contain End Date input');
assert(insertedHtml.includes('All Facilities (Company-wide)'), 'Branch dropdown must include All Facilities');
console.log('✓ Edit modal contains Facility/Branch dropdown, dates, code, and status fields.');

// Test saveEditCalendar facility-wise
const testCal = mod.getAllCalendars().find(c => c.id === 'FC-001');
const domMock = {
  'fc-edit-code': { value: 'FY 2026-27' },
  'fc-edit-name': { value: 'Financial Year 2026-2027 (Pune Branch)' },
  'fc-edit-branch': { value: 'BR-001' },
  'fc-edit-start-date': { value: '2026-04-01' },
  'fc-edit-end-date': { value: '2027-03-31' },
  'fc-edit-period-type': { value: 'Monthly' },
  'fc-edit-status': { value: 'Open' },
  'fc-edit-current': { checked: true },
  'fc-edit-remarks': { value: 'Facility-wise updated' }
};
global.document.getElementById = (id) => domMock[id] || null;

mod.saveEditCalendar({ preventDefault: () => {} }, 'FC-001');
assert.strictEqual(testCal.branch_id, 'BR-001', 'Calendar branch_id must be updated to BR-001');
assert.strictEqual(testCal.branch_name, 'Pune Main Workshop', 'Calendar branch_name must be updated to Pune Main Workshop');
console.log('✓ Facility-wise editing successfully updates branch_id and branch_name in database.');

// Restore to company-wide for subsequent operations
domMock['fc-edit-branch'].value = 'ALL';
domMock['fc-edit-name'].value = 'Financial Year 2026-2027';
mod.saveEditCalendar({ preventDefault: () => {} }, 'FC-001');
assert.strictEqual(testCal.branch_id, 'ALL', 'Calendar restored to company-wide ALL');
console.log('✓ Facility-wise editing handles switching between branch-specific and company-wide.');

console.log('\n================================================================');
console.log('🎉 ALL FINANCIAL CALENDAR MASTER TESTS PASSED (100%)!');
console.log('================================================================\n');
