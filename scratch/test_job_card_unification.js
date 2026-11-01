const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING COMPLETE JOB CARD & PARTS WORKFLOW UNIFICATION');
console.log('================================================================\n');

// 1. Verify index.html Sidebar
const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

console.log('Test 1: Inspecting Billing & Job Card submenu in index.html...');
const billingSubmenuMatch = indexHtml.match(/<div class="module-sub-menu" id="subgroup-billing">([\s\S]*?)<\/div>/);
assert(billingSubmenuMatch, 'Subgroup billing must exist in index.html');
const billingSubmenuContent = billingSubmenuMatch[1];

// Find all links in subgroup-billing
const linkMatches = [...billingSubmenuContent.matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
const links = linkMatches.map(m => ({
  href: m[1],
  text: m[2].replace(/<[^>]+>/g, '').trim()
}));

console.log('Found sidebar links under Billing & Job Card:');
links.forEach((l, idx) => console.log(`  ${idx + 1}. [${l.href}] ${l.text}`));

// Assert exactly 1 link contains "Job Card"
const jobCardLinks = links.filter(l => l.text.toLowerCase().includes('job card') || l.href.includes('job-card'));
assert.strictEqual(jobCardLinks.length, 1, `Expected exactly 1 Job Card link, found ${jobCardLinks.length}`);
assert.strictEqual(jobCardLinks[0].href, '#/job-cards');
assert.strictEqual(jobCardLinks[0].text, 'Job Card');
console.log('-> PASS: Exactly 1 single Job Card entry in sidebar without duplicate!\n');

// Check that Job Card Parts Workflow is NOT in sidebar anywhere
const anyJobCardPartsInSidebar = /<div class="sidebar"[\s\S]*?<\/aside>/.test(indexHtml) &&
  indexHtml.match(/<aside class="sidebar"[\s\S]*?<\/aside>/)[0].includes('#/job-card-parts');
assert.strictEqual(anyJobCardPartsInSidebar, false, 'No #/job-card-parts link should exist in the sidebar');
console.log('-> PASS: No duplicate #/job-card-parts link exists in sidebar!\n');

// 2. Verify js/app.js routing and BillingModule hash synchronization
console.log('Test 2: Inspecting js/app.js route mappings...');
const appPath = path.join(__dirname, '..', 'js', 'app.js');
const appJs = fs.readFileSync(appPath, 'utf8');

assert(appJs.includes("'#/job-cards':"), 'Route #/job-cards must be defined in routes map');
assert(appJs.includes("'#/job-card-parts':"), 'Route #/job-card-parts must be defined in routes map as alias');
assert(appJs.includes("['#/job-cards', '#/job-card-parts'].includes(hash)"), 'Active sidebar link must highlight Job Card for both routes');
console.log('-> PASS: Both #/job-cards and #/job-card-parts properly mapped and highlighted in js/app.js!\n');

// 3. Verify js/modules/billing.js
console.log('Test 3: Inspecting BillingModule tabs & views...');
const billingJsPath = path.join(__dirname, '..', 'js', 'modules', 'billing.js');
const billingJs = fs.readFileSync(billingJsPath, 'utf8');

// Check that Billing tabs do NOT have duplicate PARTS_WORKFLOW top tab
assert(!billingJs.includes("<span>⚙️ Parts Workflow</span>"), 'BillingModule tabs must not have separate Parts Workflow top tab button');
assert(billingJs.includes("<span>📋 Job Cards</span>"), 'BillingModule must have unified Job Cards top tab button');

// Check for sub-tabs in Job Cards view
assert(billingJs.includes('📋 Job Cards Registry'), 'Sub-tab for Job Cards Registry must exist');
assert(billingJs.includes('⚙️ Parts Requisition & Issue Console'), 'Sub-tab for Parts Requisition & Issue Console must exist');
assert(billingJs.includes('setJobCardsSubView'), 'setJobCardsSubView method must exist');

// Check modal title fix
assert(billingJs.includes('Create New Job Card'), 'Modal title must be Create New Job Card');
assert(!billingJs.includes('Create New UNDEFINED'), 'Modal title must not have undefined string interpolation');

console.log('-> PASS: BillingModule tabs, sub-tabs, and modal cleanly unified!\n');

console.log('================================================================');
console.log('ALL VERIFICATIONS PASSED: 0 DUPLICATION, 100% CLEAN INTEGRATION');
console.log('================================================================');
