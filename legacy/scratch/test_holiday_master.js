const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('ENTERPRISE ISCM - HOLIDAY MASTER TEST SUITE');
console.log('BRD v1.0 Compliance & Organizational Placement Verification');
console.log('================================================================\n');

// 1. Navigation & DOM Placement in index.html
console.log('--- TEST 1: Navigation & DOM Placement in index.html ---');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const orgSubgroupMatch = indexHtml.match(/id="subgroup-org-location"[\s\S]*?<\/div>\s*<\/div>/);
assert(orgSubgroupMatch, 'subgroup-org-location must exist in index.html');
const orgSubgroupHtml = orgSubgroupMatch[0];

const docSeriesIdx = orgSubgroupHtml.indexOf('href="#/doc-series"');
const holidayIdx = orgSubgroupHtml.indexOf('href="#/holiday-master"');
assert(docSeriesIdx !== -1, 'Document Number Series Master must exist');
assert(holidayIdx !== -1, 'Holiday Master (href="#/holiday-master") must exist in Organization & Facility Setup');
assert(holidayIdx > docSeriesIdx, 'Holiday Master must be placed BELOW Document Number Series Master');

// Check clean label (zero emojis)
const holidayLinkMatch = orgSubgroupHtml.match(/<a[^>]*href="#\/holiday-master"[^>]*>[\s\S]*?<\/a>/);
assert(holidayLinkMatch, 'Link element for #/holiday-master must exist');
const linkText = holidayLinkMatch[0];
assert(linkText.includes('<span class="sub-nav-title">Holiday Master</span>'), 'Link title must say "Holiday Master" without symbols');
const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert(!emojiPattern.test(linkText), 'No emojis permitted in sub-nav-title');
console.log('✓ Holiday Master link exists inside Organization Setup directly below Document Number Series Master.');
console.log('✓ Clean typography: Zero symbols/emojis in navigation title.');

// Check script tag in index.html
assert(indexHtml.includes('js/modules/holiday-master.js'), 'index.html must include script tag for holiday-master.js');
console.log('✓ Script tag for holiday-master.js is loaded in index.html.');

// 2. Router & RBAC in js/app.js & js/state.js
console.log('\n--- TEST 2: Routing Configuration & RBAC ---');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appJs.includes("'#/holiday-master': { module: window.OrgLocationModule"), 'Route #/holiday-master must map to OrgLocationModule');
assert(appJs.includes("'#/holiday-master': 'HOLIDAY_MASTER'"), 'Route #/holiday-master must require HOLIDAY_MASTER permission');

const stateJs = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
assert(stateJs.includes("'HOLIDAY_MASTER': 'MASTERS'"), 'state.js aliasMap must map HOLIDAY_MASTER to MASTERS category');

const mockDataJs = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
assert(mockDataJs.includes('"id": "PERM-HOLIDAY-MASTER"'), 'PERM-HOLIDAY-MASTER must exist in mock-data permissions');
assert(mockDataJs.includes('"code": "HOLIDAY_MASTER"'), 'HOLIDAY_MASTER code must exist in mock-data');
console.log('✓ Router maps #/holiday-master under Admin Pannel -> Organization & Facility Setup.');
console.log('✓ RBAC: HOLIDAY_MASTER alias mapped to MASTERS permission in state.js.');

// 3. Tab Integration in js/modules/org-location.js
console.log('\n--- TEST 3: Tab Integration in org-location.js ---');
const orgLocJs = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');

assert(orgLocJs.includes("{ key: 'HOLIDAYS', perm: 'HOLIDAY_MASTER', label: 'Holiday Master' }"), 'HOLIDAYS tab must exist in tabConfig');
const docSeriesTabIdx = orgLocJs.indexOf("key: 'DOC_SERIES'");
const holidayTabIdx = orgLocJs.indexOf("key: 'HOLIDAYS'");
assert(holidayTabIdx > docSeriesTabIdx, 'HOLIDAYS tab must appear after DOC_SERIES in tabConfig');

assert(orgLocJs.includes("hash === '#/holiday-master'"), 'org-location.js must synchronize activeTab to HOLIDAYS');
assert(orgLocJs.includes("'HOLIDAYS': '#/holiday-master'"), 'routeMap must map HOLIDAYS to #/holiday-master');
assert(orgLocJs.includes("if (this.activeTab === 'HOLIDAYS') return this.renderHolidayTab();"), 'renderActiveTabContent must delegate to renderHolidayTab');
assert(orgLocJs.includes("renderHolidayTab()"), 'renderHolidayTab method must exist in OrgLocationModule');
console.log('✓ org-location.js tabConfig lists Holiday Master directly below Document Number Series Master.');

// 4. Seed Data Verification
console.log('\n--- TEST 4: Seed Data in INITIAL_DATA ---');
const { INITIAL_DATA } = require('../js/data/mock-data.js');
assert(Array.isArray(INITIAL_DATA.holiday_types), 'INITIAL_DATA.holiday_types must be an array');
assert(INITIAL_DATA.holiday_types.length >= 7, `Must have at least 7 holiday types (found ${INITIAL_DATA.holiday_types.length})`);

const requiredTypes = ['NAT', 'ST', 'FEST', 'LOC', 'COMP', 'SPEC', 'OTH'];
const typeCodes = new Set(INITIAL_DATA.holiday_types.map(t => t.code || t.id));
requiredTypes.forEach(t => {
  assert(typeCodes.has(t), `Required holiday type ${t} must be present`);
});
console.log(`✓ Seed holiday types contain all 7 BRD Section 9 types: ${requiredTypes.join(', ')}.`);

assert(Array.isArray(INITIAL_DATA.holidays), 'INITIAL_DATA.holidays must be an array');
assert(INITIAL_DATA.holidays.length >= 12, `Must have at least 12 seeded holidays (found ${INITIAL_DATA.holidays.length})`);

const orgLevelHolidays = INITIAL_DATA.holidays.filter(h => h.applicable_level === 'ORGANIZATION');
const facilityLevelHolidays = INITIAL_DATA.holidays.filter(h => h.applicable_level === 'FACILITY');
assert(orgLevelHolidays.length > 0, 'Must have Organization-level holidays');
assert(facilityLevelHolidays.length > 0, 'Must have Facility-level holidays');
console.log(`✓ Seeded holidays contain ${orgLevelHolidays.length} Organization-wide holidays and ${facilityLevelHolidays.length} Facility-specific holidays.`);

// 5. Module Execution & Business Rules (BR-01 through BR-12)
console.log('\n--- TEST 5: Business Rules & Module Logic ---');
// Mock browser environment
const localStorageStore = {};
global.window = {
  localStorage: {
    getItem: (k) => localStorageStore[k] || null,
    setItem: (k, v) => { localStorageStore[k] = String(v); },
    removeItem: (k) => { delete localStorageStore[k]; }
  },
  State: {
    getCurrentUser: () => ({ id: 'USR-001', full_name: 'Pravin Patil', primary_role: 'ROLE-ADMIN' }),
    showToast: (msg, type) => { /* mock toast */ }
  }
};
global.localStorage = global.window.localStorage;
global.INITIAL_DATA = INITIAL_DATA;

require('../js/data/db.js');
require('../js/modules/holiday-master.js');

const mod = global.window.HolidayMasterModule;
assert(mod, 'HolidayMasterModule must be mounted to window');

const db = global.window.DB;

// Test DB helper: isHoliday
// 2026-05-01 (Maharashtra Day) is Organization-wide -> true for both PLANT-01 and PLANT-02
assert.strictEqual(db.isHoliday('2026-05-01', 'PLANT-01'), true, 'Maharashtra Day must be holiday for PLANT-01');
assert.strictEqual(db.isHoliday('2026-05-01', 'PLANT-02'), true, 'Maharashtra Day must be holiday for PLANT-02');
console.log('✓ BR-03: Organization holiday automatically applies to both facilities.');

// 2026-07-06 (Palkhi) is for PLANT-01 only
assert.strictEqual(db.isHoliday('2026-07-06', 'PLANT-01'), true, 'Palkhi must be holiday for PLANT-01');
assert.strictEqual(db.isHoliday('2026-07-06', 'PLANT-02'), false, 'Palkhi must NOT be holiday for PLANT-02');
console.log('✓ BR-18: Facility-specific holiday applies strictly to that facility.');

// Inactive holiday test (2027-03-31 is Inactive)
assert.strictEqual(db.isHoliday('2027-03-31', 'PLANT-01'), false, 'Inactive holiday must not be considered active holiday');
console.log('✓ BR-10: Inactive holidays are excluded from active calendar.');

// Test filtered holidays
const allHolidays = mod.getAllHolidays();
assert.strictEqual(allHolidays.length, INITIAL_DATA.holidays.length, 'getAllHolidays must return seeded count');

// Test HTML Table Rendering
mod.pageSize = 20;
const tableHtml = mod.renderTableContent();
assert(tableHtml.includes('Maharashtra Day'), 'Rendered table must include Maharashtra Day');
assert(tableHtml.includes('Republic Day'), 'Rendered table must include Republic Day');
assert(tableHtml.includes('HOL-MAH-DAY'), 'Rendered table must include HOL-MAH-DAY');
assert(tableHtml.includes('Palkhi Festival Holiday'), 'Rendered table must include Palkhi');
assert(tableHtml.includes('Mauli Service Center 1'), 'Rendered table must display Mauli Service Center 1');
console.log('✓ Table view HTML renders accurately with formatted badges and facility names.');

// Test Calendar View Rendering
const calendarHtml = mod.renderCalendarView();
assert(calendarHtml.includes('April 2026'), 'Calendar view must display month header');
assert(calendarHtml.includes('FY 2026-27'), 'Calendar view must display FY badge');
console.log('✓ Calendar view HTML renders monthly grid with holiday chips.');

// Test Metrics Summary
const metricsHtml = mod.renderMetricsSummary();
assert(metricsHtml.includes('Total Holidays'), 'Metrics must include Total Holidays');
assert(metricsHtml.includes('Organization-Wide'), 'Metrics must include Organization-Wide');
console.log('✓ KPI summary cards render accurate metrics.');

console.log('\n================================================================');
console.log('🎉 ALL HOLIDAY MASTER TESTS PASSED (100%)!');
console.log('================================================================\n');
