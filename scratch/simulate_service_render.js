const fs = require('fs');

global.window = {
  location: { hash: '#/service-master' },
  DB: {
    data: { services: [{ id: 'LBR-001', code: 'LBR-001', name: 'General Service Labour', rate: 399, status: 'Active', category: 'Periodic Maintenance', sac_code: '998729' }] },
    getAll: (table) => {
      if (table === 'services') return window.DB.data.services;
      return [];
    },
    saveData: () => {}
  },
  State: {
    hasPermission: () => true,
    currentPlantId: 'MSC-01',
    showToast: () => {}
  },
  PaginationHelper: {
    paginate: (items) => ({ items, totalRecords: items.length, totalPages: 1, currentPage: 1, pageSize: 10 }),
    render: () => '<div id="pagination">Pagination</div>'
  }
};

const mockContainer = { innerHTML: '' };
global.document = {
  getElementById: (id) => {
    if (id === 'view-container') return mockContainer;
    if (id === 'page-top-bar') return { style: { setProperty: () => {}, removeProperty: () => {} }, classList: { add: () => {}, remove: () => {} } };
    return null;
  },
  querySelector: () => null
};

eval(fs.readFileSync('js/modules/service-master.js', 'utf8'));
eval(fs.readFileSync('js/modules/store-inventory.js', 'utf8'));

window.StoreInventoryModule.render(mockContainer);
const full = mockContainer.innerHTML;
const start = full.indexOf('<!-- Filters Toolbar & Action Button -->');
const end = full.indexOf('<!-- 4. Data Table -->');
console.log('=== TOOLBAR HTML ===');
console.log(full.substring(start, end));
