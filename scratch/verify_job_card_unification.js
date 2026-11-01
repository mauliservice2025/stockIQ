const fs = require('fs');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING MERGED SINGLE JOB CARD MASTER');
console.log('================================================================\n');

// 1. Verify index.html sidebar
const html = fs.readFileSync('index.html', 'utf8');
const subgroupMatch = html.match(/id="subgroup-billing"[\s\S]*?<\/div>\s*<\/div>\s*<!-- Item Master Setup/);
assert(subgroupMatch, 'Must find subgroup-billing in index.html');
const billingHtml = subgroupMatch[0];

const links = [...billingHtml.matchAll(/href="([^"]+)"[\s\S]*?<span class="sub-nav-title">([^<]+)<\/span>/g)]
  .map(m => ({ href: m[1], title: m[2].trim() }));

console.log('Subgroup Billing Links:');
links.forEach((l, i) => console.log(`  ${i+1}. ${l.title} -> ${l.href}`));

const jobCardLinks = links.filter(l => l.href.includes('job'));
assert.strictEqual(jobCardLinks.length, 1, `Expected exactly 1 Job Card link in sidebar, found ${jobCardLinks.length}`);
assert.strictEqual(jobCardLinks[0].href, '#/job-cards', 'Job card link must point to #/job-cards');
assert.strictEqual(jobCardLinks[0].title, 'Job Card', 'Title must be single master "Job Card"');
assert(!billingHtml.includes('href="#/job-card-parts"'), 'Sidebar must not contain duplicate #/job-card-parts link');
console.log('✓ PASS: Single unified "Job Card" link in sidebar; zero duplicate masters!\n');

// 2. Verify BillingModule top tabs: only "📋 Job Cards", no separate parts tab
const billingJs = fs.readFileSync('js/modules/billing.js', 'utf8');
assert(billingJs.includes('📋 Job Cards'), 'BillingModule top tabs must have "📋 Job Cards"');
assert(!billingJs.includes('⚙️ Parts Workflow</span>\n            </button>'), 'BillingModule must not have separate Parts Workflow top tab button');

// 3. Verify that top switcher pills (the ones circled in red by user) are COMPLETELY REMOVED:
assert(!billingJs.includes('Job Cards Register</span>\n          </button>'), 'Master must NOT contain separate "Job Cards Register" toggle pill');
assert(!billingJs.includes('Job Card Parts Workflow</span>\n          </button>'), 'Master must NOT contain separate "Job Card Parts Workflow" toggle pill');
console.log('✓ PASS: Separate master pills (Job Cards Register vs Parts Workflow) completely removed!\n');

// 4. Mock browser environment and verify single master rendering
global.window = {
  DB: {
    getAll: (table) => {
      if (table === 'jobCards') {
        return [
          {
            id: 'JC-1',
            job_card_no: 'JC-PUN-26-001',
            customer_name: 'Ramesh Patil',
            customer_mobile: '9822112233',
            vehicle_reg_no: 'MH-12-AB-1234',
            vehicle_model: 'Honda Activa 6G',
            status: 'READY_FOR_BILLING',
            technician_name: 'Santosh Shinde',
            diagnosis: 'Front brake overhaul',
            complaints: ['Brake noise'],
            parts_required: [
              {
                item_id: 'ITM-1',
                item_code: '2W-BRK-SHO-01',
                item_name: 'Rear Brake Shoe Set',
                qty: 1,
                reserved_qty: 1,
                issued_qty: 0,
                unit_price: 320,
                status: 'RESERVED'
              }
            ]
          }
        ];
      }
      if (table === 'inventoryBalances') {
        return [{ item_id: 'ITM-1', plant_id: 'PLANT-PUN', on_hand: 50, reserved: 2, available: 48 }];
      }
      return [];
    },
    isWarehouseActive: () => true,
    isPlantActive: () => true,
    getActiveWarehouses: () => [],
    getById: () => null
  },
  State: {
    currentPlantId: 'ALL',
    hasPermission: () => true,
    showToast: () => {}
  },
  location: { hash: '#/job-cards' }
};

eval(billingJs);
const Billing = window.BillingModule;

// Test default Console view of the single unified master
Billing.activeTab = 'JOB_CARDS';
Billing.jobCardViewMode = 'CONSOLE';
const consoleHtml = Billing.renderJobCardsTab();
assert(consoleHtml.includes('Job Card Management'), 'Must have Job Card Management title');
assert(consoleHtml.includes('Active Job Cards'), 'Must render active job cards left list');
assert(consoleHtml.includes('Requisite Spare Parts &amp; Availability Matrix') || consoleHtml.includes('Requisite Spare Parts & Availability Matrix'), 'Must render spare parts matrix');
assert(consoleHtml.includes('+ Add Parts'), 'Must have Add Parts action');
assert(consoleHtml.includes('Issue to Tech'), 'Must have Issue to Tech action');
assert(consoleHtml.includes('Estimate'), 'Must have Estimate action');
assert(consoleHtml.includes('Quick Bill'), 'Must have Quick Bill action');
console.log('✓ PASS: Single master provides Job Card selection, details, and parts workflow operations in one unified screen!');

// Test Table view mode
Billing.toggleJobCardViewMode();
assert.strictEqual(Billing.jobCardViewMode, 'TABLE');
const tableHtml = Billing.renderJobCardsTab();
assert(tableHtml.includes('<table class="data-table">'), 'Must render data table in TABLE view mode');
console.log('✓ PASS: Full table view mode supported cleanly within single master!\n');

console.log('🎉 ALL CHECKS PASSED: Both masters merged into single unified Job Card master!');
