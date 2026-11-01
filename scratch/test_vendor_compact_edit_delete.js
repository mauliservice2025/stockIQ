const fs = require('fs');
const assert = require('assert');

let modal = null;
let toast = null;
let auditLogs = [];

const mockSuppliers = [
  {
    id: 'SUP-001',
    code: 'SUP-001',
    name: 'Bharat Forge Ltd',
    category: 'RAW_MATERIAL',
    contact: 'Khushi Mam',
    phone: '9822011002',
    email: 'sales@bharatforge.com',
    city: 'Pune',
    payment_terms: 30,
    payment_conditions: 'Net 30 Days from Invoice Date',
    rating: 4.5,
    status: 'APPROVED'
  },
  {
    id: 'SUP-002',
    code: 'SUP-002',
    name: 'Endurance Technologies',
    category: 'BRAKES_SUSPENSION',
    contact: 'Rajesh Nair',
    phone: '9822011456',
    email: 'sales@endurance.co.in',
    city: 'Waluj, Aurangabad',
    payment_terms: 30,
    payment_conditions: 'Net 30 Days from Invoice Date',
    rating: 4.9,
    status: 'APPROVED'
  }
];

const mockDB = {
  data: {
    suppliers: JSON.parse(JSON.stringify(mockSuppliers)),
    purchaseOrders: []
  },
  getAll: function(tbl) {
    return this.data[tbl] || [];
  },
  upsert: function(tbl, item) {
    const list = this.data[tbl];
    const idx = list.findIndex(x => x.id === item.id || x.code === item.code);
    if (idx >= 0) list[idx] = { ...list[idx], ...item };
    else list.push(item);
    return item;
  },
  delete: function(tbl, id) {
    const prev = this.data[tbl].length;
    this.data[tbl] = this.data[tbl].filter(x => x.id !== id && x.code !== id);
    return this.data[tbl].length < prev;
  },
  emitChange: function(tbl) {},
  saveData: function() {},
  logAudit: function(action, entity, id, desc) {
    auditLogs.push({ action, entity, id, desc });
  }
};

global.window = {
  location: { hash: '#/suppliers' },
  State: {
    showModal: (m) => { modal = m; },
    closeModal: () => { modal = null; },
    showToast: (msg, type) => { toast = { msg, type }; }
  },
  DB: mockDB,
  OrgLocationModule: {
    activeTab: 'SUPPLIERS',
    render: () => {}
  }
};

global.confirm = () => true;

// Load Masters module
eval(fs.readFileSync('js/modules/masters.js', 'utf8'));

console.log('--- 1. TESTING COMPACT TABLE RENDERING ---');
const html = window.MastersModule.renderSuppliersMaster();
assert(html.includes('compact-table'), 'Table must have compact-table class for dense UI');
assert(html.includes('Approved Supplier & Vendor Master (SRM)'), 'Card title must be present');
assert(html.includes('vendor-master-search'), 'Search bar must be present');
assert(html.includes('2 Vendors'), 'Vendor count badge must be present');
assert(html.includes('showEditSupplierModal'), 'Rows must include Edit button action');
assert(html.includes('deleteSupplier'), 'Rows must include Delete button action');
assert(html.includes('viewSupplierDetails'), 'Rows must include View button action');
console.log('Compact table rendered with compact-table class, search bar, and action buttons! ✔');

console.log('\n--- 2. TESTING EDIT SUPPLIER MODAL ---');
window.MastersModule.showEditSupplierModal('SUP-001');
assert(modal !== null, 'Edit modal must be shown');
assert(modal.title.includes('Edit Supplier / Vendor: Bharat Forge Ltd (SUP-001)'), 'Title should reflect vendor name and code');
assert(modal.contentHtml.includes('value="Bharat Forge Ltd"'), 'Name input prefilled');
assert(modal.contentHtml.includes('value="Khushi Mam"'), 'Contact person prefilled');
assert(modal.contentHtml.includes('value="9822011002"'), 'Phone prefilled');
assert(modal.contentHtml.includes('value="sales@bharatforge.com"'), 'Email prefilled');
assert(modal.contentHtml.includes('deleteSupplier(\'SUP-001\')'), 'Delete button should be accessible in edit modal');
assert(modal.contentHtml.includes('submitEditSupplier(event, \'SUP-001\')'), 'Form should submit to submitEditSupplier');
console.log('Edit modal properly displays prefilled values! ✔');

console.log('\n--- 3. TESTING SUBMIT EDIT SUPPLIER ---');
// Mock the form inputs
const mockElements = {
  'edit-sup-name': { value: 'Bharat Forge Precision Ltd' },
  'edit-sup-cat': { value: 'OEM_COMPONENTS' },
  'edit-sup-contact': { value: 'Khushi Sharma' },
  'edit-sup-phone': { value: '9822099999' },
  'edit-sup-email': { value: 'khushi@bharatforge.com' },
  'edit-sup-alt-phone': { value: '' },
  'edit-sup-address': { value: 'Mundhwa Industrial Area' },
  'edit-sup-city': { value: 'Pune' },
  'edit-sup-state': { value: 'Maharashtra' },
  'edit-sup-pincode': { value: '411036' },
  'edit-sup-tax': { value: '27AAACB2188K1Z5' },
  'edit-sup-terms': { value: '45' },
  'edit-sup-conditions': { value: 'Net 45 Days against Accepted Bill' },
  'edit-sup-bank': { value: 'HDFC Bank, Pune' },
  'edit-sup-remarks': { value: 'Top tier OEM component supplier' },
  'edit-sup-rating': { value: '4.8' },
  'edit-sup-status': { value: 'APPROVED' }
};

global.document = {
  getElementById: (id) => mockElements[id] || null
};

window.MastersModule.submitEditSupplier({ preventDefault: () => {} }, 'SUP-001');

const updated = mockDB.getAll('suppliers').find(s => s.code === 'SUP-001');
assert.strictEqual(updated.name, 'Bharat Forge Precision Ltd');
assert.strictEqual(updated.category, 'OEM_COMPONENTS');
assert.strictEqual(updated.contact, 'Khushi Sharma');
assert.strictEqual(updated.phone, '9822099999');
assert.strictEqual(updated.payment_terms, 45);
assert.strictEqual(updated.payment_conditions, 'Net 45 Days against Accepted Bill');
assert.strictEqual(updated.rating, 4.8);
assert(toast !== null && toast.type === 'success', 'Toast notification displayed on update');
console.log('Vendor updated in database successfully! ✔');

console.log('\n--- 4. TESTING DELETE SUPPLIER ---');
assert.strictEqual(mockDB.getAll('suppliers').length, 2);
window.MastersModule.deleteSupplier('SUP-002');
assert.strictEqual(mockDB.getAll('suppliers').length, 1);
assert.strictEqual(mockDB.getAll('suppliers')[0].code, 'SUP-001');
assert(toast !== null && toast.msg.includes('deleted'), 'Toast notification displayed on delete');
console.log('Vendor deleted from database successfully! ✔');

console.log('\n--- 5. ALL COMPACT UI & EDIT/DELETE TESTS PASSED! ✔ ---');
