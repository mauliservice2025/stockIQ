const assert = require('assert');
const fs = require('fs');

console.log('--- Testing Stock Transfer Layout & Facility Display ---');

global.window = {
  renderInventoryLogisticsTabs: () => '<nav>Tabs</nav>',
  DB: {
    getById: (table, id) => {
      if (table === 'plants') {
        if (id === 'PLANT-1') return { id: 'PLANT-1', code: 'MSC-01', name: 'Mauli Service Center - I' };
        if (id === 'PLANT-2') return { id: 'PLANT-2', code: 'MSC-02', name: 'Mauli Service Center - II' };
      }
      if (table === 'warehouses') {
        return { id, name: id === 'WH-1' ? 'Mauli Store I' : 'Store' };
      }
      return null;
    },
    getAll: (table) => {
      if (table === 'stockTransfers') {
        return [
          {
            id: 'TRF-1',
            transfer_number: 'TRF-2026-144',
            source_plant_id: 'PLANT-1',
            dest_plant_id: 'PLANT-2',
            source_warehouse_id: 'WH-1',
            dest_warehouse_id: 'WH-2',
            transporter: 'VRL Logistics Fleet',
            vehicle_no: 'MH-12-PQ-9081',
            dispatched_at: '2026-10-23T10:00:00.000Z',
            status: 'RECEIVED'
          }
        ];
      }
      return [];
    },
    isPlantActive: () => true,
    getActivePlants: () => [],
    getActiveWarehouses: () => []
  },
  PaginationHelper: {
    paginate: (items) => ({ items, totalRecords: items.length, totalPages: 1, currentPage: 1, pageSize: 10 }),
    render: () => ''
  },
  State: {
    currentPlantId: 'ALL'
  }
};

const transfersCode = fs.readFileSync('d:/Projects/ISCM/js/modules/transfers.js', 'utf8');
eval(transfersCode);

assert(window.TransfersModule, 'TransfersModule must be loaded');

const target = { innerHTML: '' };
window.TransfersModule.render(target);
const html = target.innerHTML;

// 1. Verify SVG transfer icon is removed from Stock Transfer card-title
assert(!html.includes('<svg'), 'SVG icon before Stock Transfer card-title should be removed');
assert(html.includes('Stock Transfer'), 'Stock Transfer title must be present');
console.log('✓ 1. Verified icon before Stock Transfer is removed.');

// 2. Verify MSC-01 facility code is removed and facility name is shown
assert(!html.includes('MSC-01'), 'MSC-01 facility code should be removed');
assert(html.includes('Mauli Service Center - I'), 'Mauli Service Center - I facility name must be displayed');
console.log('✓ 2. Verified MSC-01 code removed and "Mauli Service Center - I" is shown.');

// 3. Verify MSC-02 facility code is removed and facility name is shown
assert(!html.includes('MSC-02'), 'MSC-02 facility code should be removed');
assert(html.includes('Mauli Service Center - II'), 'Mauli Service Center - II facility name must be displayed');
console.log('✓ 3. Verified MSC-02 code removed and "Mauli Service Center - II" is shown.');

console.log('\n🎉 ALL STOCK TRANSFER CHECKS PASSED (100%)!');
