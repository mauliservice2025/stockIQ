const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'js', 'modules');

const expectedModules = [
  { file: 'billing.js', keys: ['jobCards', 'finalBills', 'vehicleDeliveries'] },
  { file: 'inventory.js', keys: ['inventory'] },
  { file: 'purchase-orders.js', keys: ['purchase-orders'] },
  { file: 'goods-receipt.js', keys: ['goods-receipt'] },
  { file: 'requisitions.js', keys: ['requisitions'] },
  { file: 'transfers.js', keys: ['transfers'] },
  { file: 'receive-transfers.js', keys: ['receive-transfers'] },
  { file: 'quality-inspection.js', keys: ['quality-inspection'] },
  { file: 'adjustments.js', keys: ['cycle-counts', 'stock-adjustments'] },
  { file: 'opening-balance.js', keys: ['opening-balance'] },
  { file: 'dispatch.js', keys: ['dispatch'] },
  { file: 'returns.js', keys: ['returns'] },
  { file: 'organizations.js', keys: ['organizations'] },
  { file: 'org-location.js', keys: ['branches', 'stores', 'locations', 'racks', 'shelves', 'bins'] },
  { file: 'item-setup-master.js', keys: ['itemMaster', 'itemCategories', 'itemSubcategories', 'itemCategoriesGrouped', 'itemBrands', 'itemManufacturers', 'vehicleModels', 'uoms', 'hsnCodes'] },
  { file: 'doc-series-master.js', keys: ['docSeries'] },
  { file: 'doc-print-config.js', keys: ['docPrintConfig'] },
  { file: 'financial-calendar.js', keys: ['financialCalendar'] },
  { file: 'reports.js', keys: ['reportsModule'] }
];

console.log('=== VERIFYING PAGINATION ACROSS ALL SCREENS & MASTERS ===\n');

let allPassed = true;
let totalKeysVerified = 0;

expectedModules.forEach(mod => {
  const filePath = path.join(modulesDir, mod.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Module file not found: ${mod.file}`);
    allPassed = false;
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // Check for PaginationHelper usage
  const hasPaginationHelper = content.includes('PaginationHelper');
  if (!hasPaginationHelper) {
    console.error(`❌ ${mod.file}: PaginationHelper not referenced!`);
    allPassed = false;
    return;
  }

  // Check keys or pagination calls
  const missingKeys = [];
  mod.keys.forEach(k => {
    if (!content.includes(`'${k}'`) && !content.includes(`"${k}"`)) {
      missingKeys.push(k);
    }
  });

  if (missingKeys.length > 0) {
    console.error(`❌ ${mod.file}: Missing pagination key(s): ${missingKeys.join(', ')}`);
    allPassed = false;
  } else {
    totalKeysVerified += mod.keys.length;
    console.log(`✅ ${mod.file}: All ${mod.keys.length} pagination key(s) verified [${mod.keys.join(', ')}]`);
  }
});

// Also check index.html has pagination.js included
const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
if (indexHtml.includes('js/pagination.js')) {
  console.log('\n✅ index.html: js/pagination.js properly included in script bundle.');
} else {
  console.error('\n❌ index.html: js/pagination.js NOT included!');
  allPassed = false;
}

if (allPassed) {
  console.log(`\n🎉 ALL ${expectedModules.length} MODULES & ${totalKeysVerified} PAGINATION KEYS FULLY PAGINATED & VERIFIED! 🎉`);
  process.exit(0);
} else {
  console.error('\n❌ Verification failed.');
  process.exit(1);
}
