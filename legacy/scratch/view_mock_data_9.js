Created At: 2026-10-19T12:54:58+05:30
Completed At: 2026-10-19T12:54:58+05:30
File Path: `file:///d:/Projects/ISCM/scratch/test_financial_calendar_master.js`
Total Lines: 248
Total Bytes: 15035
Showing lines 1 to 100
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: const fs = require('fs');
2: const path = require('path');
3: const assert = require('assert');
4: 
5: console.log('================================================================');
6: console.log('ENTERPRISE ISCM - FINANCIAL CALENDAR MASTER TEST SUITE');
7: console.log('BRD v1.0 Compliance & Organizational Placement Verification');
8: console.log('================================================================\n');
9: 
10: // 1. Navigation & DOM Placement in index.html
11: console.log('--- TEST 1: Navigation & DOM Placement in index.html ---');
12: const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
13: 
14: // Check that subgroup-org-location contains Facility Master, Financial Calendar Master, and Document Number Series Master
15: const orgSubgroupMatch = indexHtml.match(/id="subgroup-org-location"[\s\S]*?<\/div>\s*<\/div>/);
16: assert(orgSubgroupMatch, 'subgroup-org-location must exist in index.html');
17: const orgSubgroupHtml = orgSubgroupMatch[0];
18: 
19: const branchIdx = orgSubgroupHtml.indexOf('href="#/branches"');
20: const finCalIdx = orgSubgroupHtml.indexOf('href="#/financial-calendar"');
21: const docSeriesIdx = orgSubgroupHtml.indexOf('href="#/doc-series"');
22: 
23: assert(branchIdx !== -1, 'Facility Master (href="#/branches") must exist in Organization & Facility Setup');
24: assert(finCalIdx !== -1, 'Financial Calendar Master (href="#/financial-calendar") must exist in Organization & Facility Setup');
25: assert(finCalIdx > branchIdx, 'Financial Calendar Master must be placed BELOW Facility Master');
26: assert(docSeriesIdx > branchIdx, 'Document Number Series Master must remain below Facility Master');
27: 
28: // Check clean label (zero emojis)
29: const finCalLinkMatch = orgSubgroupHtml.match(/<a[^>]*href="#\/financial-calendar"[^>]*>[\s\S]*?<\/a>/);
30: assert(finCalLinkMatch, 'Link element for #/financial-calendar must exist');
31: const linkText = finCalLinkMatch[0];
32: assert(linkText.includes('<span class="sub-nav-title">Financial Calendar Master</span>'), 'Link title must say "Financial Calendar Master" without symbols');
33: const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
34: assert(!emojiPattern.test(linkText), 'No emojis permitted in sub-nav-title');
35: console.log('✓ Financial Calendar Master link exists inside Organization Setup directly below Facility Master.');
36: console.log('✓ Clean typography: Zero symbols/emojis in navigation title.');
37: 
38: // Check script tag in index.html
39: assert(indexHtml.includes('js/modules/financial-calendar.js'), 'index.html must include script tag for financial-calendar.js');
40: console.log('✓ Script tag for financial-calendar.js is loaded in index.html.');
41: 
42: // 2. Router & RBAC in js/app.js & js/state.js
43: console.log('\n--- TEST 2: Routing Configuration & RBAC ---');
44: const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
45: assert(appJs.includes("'#/financial-calendar': { module: window.OrgLocationModule"), 'Route #/financial-calendar must map to OrgLocationModule');
46: assert(appJs.includes("'#/financial-calendar': 'FINANCIAL_CALENDAR_MASTER'"), 'Route #/financial-calendar must require FINANCIAL_CALENDAR_MASTER permission');
47: 
48: const stateJs = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
49: assert(stateJs.includes("'FINANCIAL_CALENDAR_MASTER': 'MASTERS'"), 'state.js aliasMap must map FINANCIAL_CALENDAR_MASTER to MASTERS category');
50: 
51: const mockDataJs = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
52: assert(mockDataJs.includes('"id": "PERM-FIN-CALENDAR"'), 'PERM-FIN-CALENDAR must exist in mock-data permissions');
53: assert(mockDataJs.includes('"code": "FINANCIAL_CALENDAR_MASTER"'), 'FINANCIAL_CALENDAR_MASTER code must exist in mock-data');
54: console.log('✓ Router maps #/financial-calendar under Admin Pannel -> Organization & Facility Setup.');
55: console.log('✓ RBAC: FINANCIAL_CALENDAR_MASTER alias mapped to MASTERS permission in state.js.');
56: 
57: // 3. Tab Integration in js/modules/org-location.js
58: console.log('\n--- TEST 3: Tab Integration in org-location.js ---');
59: const orgLocJs = fs.readFileSync(path.join(__dirname, '../js/modules/org-location.js'), 'utf8');
60: 
61: // Check tabConfig ordering: ORGANIZATIONS -> BRANCHES -> FINANCIAL_CALENDAR -> DOC_SERIES ...
62: assert(orgLocJs.includes("{ key: 'FINANCIAL_CALENDAR', perm: 'FINANCIAL_CALENDAR_MASTER', label: 'Financial Calendar Master' }"), 'FINANCIAL_CALENDAR tab must exist in tabConfig');
63: const branchTabIdx = orgLocJs.indexOf("key: 'BRANCHES'");
64: const finCalTabIdx = orgLocJs.indexOf("key: 'FINANCIAL_CALENDAR'");
65: assert(finCalTabIdx > branchTabIdx, 'FINANCIAL_CALENDAR tab must appear after BRANCHES (Facility Master) in tabConfig');
66: 
67: // Check hash sync and routeMap
68: assert(orgLocJs.includes("hash === '#/financial-calendar'"), 'org-location.js must synchronize activeTab to FINANCIAL_CALENDAR on #/financial-calendar');
69: assert(orgLocJs.includes("'FINANCIAL_CALENDAR': '#/financial-calendar'"), 'routeMap must map FINANCIAL_CALENDAR to #/financial-calendar');
70: assert(orgLocJs.includes("if (this.activeTab === 'FINANCIAL_CALENDAR') return this.renderFinancialCalendarTab();"), 'renderActiveTabContent must delegate to renderFinancialCalendarTab');
71: assert(orgLocJs.includes("renderFinancialCalendarTab()"), 'renderFinancialCalendarTab method must exist in OrgLocationModule');
72: assert(!orgLocJs.includes('<div class="card-title">'), 'Zero redundant card-title elements in org-location.js');
73: console.log('✓ org-location.js tabConfig lists Financial Calendar Master directly below Facility Master.');
74: console.log('✓ Zero redundant card-title tags in org-location.js.');
75: 
76: // 4. Seed Data Verification
77: console.log('\n--- TEST 4: Seed Data in INITIAL_DATA.financial_calendar ---');
78: const { INITIAL_DATA } = require('../js/data/mock-data.js');
79: assert(Array.isArray(INITIAL_DATA.financial_calendar), 'INITIAL_DATA.financial_calendar must be an array');
80: assert(INITIAL_DATA.financial_calendar.length >= 4, `Must have at least 4 seed records (found ${INITIAL_DATA.financial_calendar.length})`);
81: 
82: const fyCodes = INITIAL_DATA.financial_calendar.map(c => c.financial_year_code);
83: assert(fyCodes.includes('FY 2026-27'), 'Must include active FY 2026-27');
84: assert(fyCodes.includes('FY 2025-26'), 'Must include closed FY 2025-26');
85: assert(fyCodes.includes('FY 2027-28'), 'Must include future FY 2027-28');
86: 
87: const fy2026 = INITIAL_DATA.financial_calendar.find(c => c.financial_year_code === 'FY 2026-27');
88: assert(fy2026 && fy2026.periods && fy2026.periods.length === 12, 'FY 2026-27 must contain 12 monthly accounting periods');
89: assert(Array.isArray(INITIAL_DATA.financial_calendar_audit), 'INITIAL_DATA.financial_calendar_audit must be an array');
90: console.log(`✓ Seed data contains ${INITIAL_DATA.financial_calendar.length} financial years covering past, present, and future periods.`);
91: 
92: // 5. Transaction Date Posting Validation Engine (BRD Section 16, 20, 25, 37, AC-07, AC-08, AC-09)
93: console.log('\n--- TEST 5: Transaction Date Posting Validation Engine ---');
94: global.window = {
95:   DB: {
96:     data: {
97:       financial_calendar: JSON.parse(JSON.stringify(INITIAL_DATA.financial_calendar)),
98:       financial_calendar_audit: JSON.parse(JSON.stringify(INITIAL_DATA.financial_calendar_audit || [])),
99:       plants: [
100:         { id: 'BR-001', code: 'PUN', name: 'Pune Main Workshop' },
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
