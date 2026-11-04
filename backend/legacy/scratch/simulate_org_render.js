const fs = require('fs');
global.window = {
  location: { hash: '#/facilities' },
  DB: {
    data: {
      plants: [
        { id: 'MSC-01', code: 'MSC-01', name: 'Mauli Service Center - I', plant_type: 'TWO WHEELER WORKSHOP', city: 'Ravet', state: 'Maharashtra', pincode: '412101', address: 'Chintamani chowk, Ravet', contact_person: 'Sanket', mobile: '7888010210', is_active: true },
        { id: 'MSC-02', code: 'MSC-02', name: 'Mauli Service Center - II', plant_type: 'AUTOMOBILE WORKSHOP', city: 'Pune', state: 'Maharashtra', pincode: '425001', address: '-', contact_person: 'Chetan', mobile: '8765456789', is_active: true }
      ],
      organizations: [{ id: 'ORG-01', code: 'MSC', name: 'Mauli Service Center Pvt. Ltd.', status: 'Active' }],
      warehouses: [{ id: 'WH-01', plant_id: 'MSC-01' }, { id: 'WH-02', plant_id: 'MSC-02' }]
    },
    getAll: (table) => window.DB.data[table] || [],
    saveData: () => {}
  },
  State: {
    hasPermission: () => true,
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

eval(fs.readFileSync('js/modules/org-location.js', 'utf8'));

window.OrgLocationModule.render(mockContainer);
const full = mockContainer.innerHTML;
const sub = full.substring(full.indexOf('org-location-tab-content'));
console.log('=== TAB CONTENT START ===');
console.log(sub.substring(0, 800));
