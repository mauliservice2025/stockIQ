const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST: GRN Financial Columns (With PO, Without PO, DB) ---');

// 1. Verify schema.sql
const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf-8');
const expectedItemCols = ['unit_price', 'gross_amount', 'discount_amount', 'taxable_amount', 'tax_amount', 'net_amount'];
const expectedNotesCols = ['total_gross_amount', 'total_discount_amount', 'total_taxable_amount', 'total_tax_amount', 'total_net_amount'];

expectedItemCols.forEach(col => {
  assert(schemaSql.includes(col), `schema.sql must contain column ${col}`);
});
expectedNotesCols.forEach(col => {
  assert(schemaSql.includes(col), `schema.sql must contain column ${col}`);
});
console.log('✅ 1. schema.sql includes all 6 item financial columns and GRN total columns.');

// 2. Verify stockiq.db
const initSqlJs = require('sql.js');
initSqlJs().then(SQL => {
  const dbBuffer = fs.readFileSync(path.join(__dirname, '../database/stockiq.db'));
  const db = new SQL.Database(dbBuffer);
  
  const itemCols = db.exec('PRAGMA table_info(grn_items);')[0].values.map(v => v[1]);
  expectedItemCols.forEach(col => {
    assert(itemCols.includes(col), `stockiq.db grn_items must contain column ${col}`);
  });

  const notesCols = db.exec('PRAGMA table_info(goods_receipt_notes);')[0].values.map(v => v[1]);
  expectedNotesCols.forEach(col => {
    assert(notesCols.includes(col), `stockiq.db goods_receipt_notes must contain column ${col}`);
  });
  console.log('✅ 2. SQLite stockiq.db contains all financial columns in grn_items and goods_receipt_notes.');

  // 3. Verify js/modules/goods-receipt.js logic
  const mockDB = {
    getAll(tbl) {
      if (tbl === 'warehouses') return [{ id: 'WH-01', name: 'Main Store', status: 'Active' }];
      if (tbl === 'suppliers') return [{ id: 'SUP-01', name: 'Acme Parts', status: 'Active' }];
      if (tbl === 'items') return [{ id: 'ITEM-1', code: 'ITM-001', name: 'Brake Disc', purchase_price: 250, tax_rate: 18, status: 'Active' }];
      if (tbl === 'purchaseOrders') return [{
        id: 'PO-01',
        po_number: 'PO-2026-001',
        plant_id: 'PLANT-01',
        supplier_id: 'SUP-01',
        status: 'APPROVED',
        items: [{
          item_id: 'ITEM-1',
          item_code: 'ITM-001',
          item_name: 'Brake Disc',
          ordered_quantity: 10,
          pending_quantity: 10,
          unit_price: 250,
          uom: 'PCS',
          tax_rate: 18
        }]
      }];
      if (tbl === 'inventoryBalances') return [];
      return [];
    },
    getById(tbl, id) {
      return this.getAll(tbl).find(x => x.id === id);
    },
    getActiveWarehouses() {
      return this.getAll('warehouses');
    },
    isPlantActive() {
      return true;
    },
    insert(tbl, record) {
      record.id = 'GRN-TEST-1';
      return record;
    },
    logAudit() {}
  };

  const mockState = {
    currentPlantId: 'ALL',
    currentUser: { name: 'Test User' },
    showToast() {},
    showModal(config) {
      this.lastModal = config;
    },
    closeModal() {}
  };

  global.window = {
    DB: mockDB,
    State: mockState
  };

  const code = fs.readFileSync(path.join(__dirname, '../js/modules/goods-receipt.js'), 'utf-8');
  eval(code);

  const mod = window.GoodsReceiptModule;
  assert(mod, 'GoodsReceiptModule must be initialized on window');

  // Test With PO table HTML
  mod.currentInwardTab = 'WITH_PO';
  const withPOHtml = mod.renderWithPOSection();
  const headers = ['Unit Price', 'Gross Amount', 'Discount Amount', 'Taxable Amount', 'Tax Amount', 'Net Amount'];
  headers.forEach(h => {
    assert(withPOHtml.includes(h), `With PO section must contain header ${h}`);
  });
  assert(withPOHtml.includes('id="grn-po-total-gross"'), 'With PO section must have grn-po-total-gross');
  assert(withPOHtml.includes('id="grn-po-total-net"'), 'With PO section must have grn-po-total-net');
  console.log('✅ 3. renderWithPOSection() includes all 6 financial headers and footer totals.');

  // Test Without PO table HTML
  mod.currentInwardTab = 'DIRECT';
  const directHtml = mod.renderDirectGRNSection();
  headers.forEach(h => {
    assert(directHtml.includes(h), `Direct GRN section must contain header ${h}`);
  });
  assert(directHtml.includes('id="direct-grn-total-gross"'), 'Direct GRN section must have direct-grn-total-gross');
  assert(directHtml.includes('id="direct-grn-total-net"'), 'Direct GRN section must have direct-grn-total-net');
  assert(directHtml.includes('direct-row-price'), 'Direct GRN table rows must have direct-row-price');
  assert(directHtml.includes('direct-row-gross'), 'Direct GRN table rows must have direct-row-gross');
  assert(directHtml.includes('direct-row-discount'), 'Direct GRN table rows must have direct-row-discount');
  assert(directHtml.includes('direct-row-taxable'), 'Direct GRN table rows must have direct-row-taxable');
  assert(directHtml.includes('direct-row-tax'), 'Direct GRN table rows must have direct-row-tax');
  assert(directHtml.includes('direct-row-net'), 'Direct GRN table rows must have direct-row-net');
  console.log('✅ 4. renderDirectGRNSection() and renderDirectGRNTableRows() include all 6 financial columns.');

  // Test Direct GRN Calculation Logic
  assert.strictEqual(mod.directGRNItems.length, 1);
  const row = mod.directGRNItems[0];
  mod.onDirectFinancialChange(row.id, 'received_qty', 2);
  mod.onDirectFinancialChange(row.id, 'unit_price', 100);
  mod.onDirectFinancialChange(row.id, 'discount_amount', 20);
  // gross = 2 * 100 = 200
  // taxable = 200 - 20 = 180
  // tax = 180 * 18% = 32.40
  // net = 180 + 32.40 = 212.40
  assert.strictEqual(row.gross_amount, 200, 'Gross amount must be 200');
  assert.strictEqual(row.taxable_amount, 180, 'Taxable amount must be 180');
  assert.strictEqual(row.tax_amount, 32.4, 'Tax amount must be 32.40');
  assert.strictEqual(row.net_amount, 212.4, 'Net amount must be 212.40');
  console.log('✅ 5. onDirectFinancialChange computes gross, discount, taxable, tax, and net accurately.');

  // Test viewGRN() modal columns
  const testGRN = {
    id: 'GRN-001',
    grn_number: 'GRN-2026-999',
    grn_type: 'DIRECT',
    warehouse_id: 'WH-01',
    items: [{
      item_id: 'ITEM-1',
      item_code: 'ITM-001',
      item_name: 'Brake Disc',
      uom: 'PCS',
      received_qty: 2,
      unit_price: 100,
      gross_amount: 200,
      discount_amount: 20,
      taxable_amount: 180,
      tax_amount: 32.4,
      net_amount: 212.4,
      batch_number: 'LOT-123'
    }],
    total_gross_amount: 200,
    total_discount_amount: 20,
    total_taxable_amount: 180,
    total_tax_amount: 32.4,
    total_net_amount: 212.4
  };
  mockDB.getById = function(tbl, id) {
    if (tbl === 'goodsReceipts') return testGRN;
    return mockDB.getAll(tbl).find(x => x.id === id);
  };

  mod.viewGRN('GRN-001');
  const viewHtml = mockState.lastModal.contentHtml;
  headers.forEach(h => {
    assert(viewHtml.includes(h), `viewGRN modal must contain column header ${h}`);
  });
  console.log('✅ 6. viewGRN() modal displays all 6 financial columns and totals.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
});
