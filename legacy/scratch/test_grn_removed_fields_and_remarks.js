const fs = require('fs');
const assert = require('assert');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../js/modules/goods-receipt.js'), 'utf8');

// Vehicle and Storekeeper input elements must not exist in the inward modal html
assert(!src.includes('id="grn-po-vehicle"'), 'grn-po-vehicle must be removed');
assert(!src.includes('id="grn-dir-vehicle"'), 'grn-dir-vehicle must be removed');
assert(!src.includes('id="grn-po-receiver"'), 'grn-po-receiver must be removed');
assert(!src.includes('id="grn-dir-receiver"'), 'grn-dir-receiver must be removed');
assert(!src.includes('Delivery Vehicle #'), 'Delivery Vehicle label must be removed');
assert(!src.includes('Receiving Storekeeper'), 'Receiving Storekeeper label must be removed');

// Remarks should exist in the footer area and be moved lowerside alongside buttons
assert(src.includes('id="grn-po-remarks"'), 'grn-po-remarks must exist in With-PO modal');
assert(src.includes('id="grn-dir-remarks"'), 'grn-dir-remarks must exist in Direct-GRN modal');
assert(src.includes('margin-top: auto; border-top: 1px solid var(--border-color)'), 'Footer must be docked at bottom');
assert(src.includes('display: flex; justify-content: space-between; align-items: flex-end'), 'Remarks must be moved lowerside side-by-side with buttons');

// Label size should be minimised to 10px
assert(src.includes('font-size: 10px; font-weight: 600; margin-bottom: 2px;'), 'Label font size must be minimised to 10px');

// Verify Row 2 order: Store Name -> Challan -> Invoice No. -> Invoice Date
const poWhIdx = src.indexOf('id="grn-po-wh-select"');
const poChallanIdx = src.indexOf('id="grn-po-challan"');
const poInvoiceIdx = src.indexOf('id="grn-po-invoice"');
const poDateIdx = src.indexOf('id="grn-po-date"');

assert(poWhIdx !== -1 && poChallanIdx !== -1 && poInvoiceIdx !== -1 && poDateIdx !== -1, 'All fields must be present');
assert(poWhIdx < poChallanIdx, 'Store Name must precede Challan in Row 2');
assert(poChallanIdx < poInvoiceIdx, 'Challan must precede Invoice No. in Row 2');
assert(poInvoiceIdx < poDateIdx, 'Invoice No. must precede Invoice Date in Row 2');

// Verify removed labels and button name update
assert(!src.includes('PO Items Inward & Batch Assignment'), 'PO Items Inward header label must be removed');
assert(!src.includes('Once saved, this GRN will be marked'), 'Pending approval disclaimer text must be removed');
assert(src.includes('Save GRN\n') || src.includes('Save GRN\r\n'), 'Button label must be Save GRN');
assert(!src.includes('Save GRN (Pending Approval)'), 'Old button label must be removed');

// Verify simplified/updated labels and modal title
assert(src.includes("title: 'Create GRN'"), 'Modal title must be Create GRN');
assert(src.includes('>Store Name <span class="required"'), 'Label must be Store Name');
assert(src.includes('>Invoice No.</label>'), 'Label must be Invoice No.');
assert(src.includes('>Invoice Date <span class="required"'), 'Label must be Invoice Date');
assert(src.includes('>Sr. No.</th>'), 'Table header must be Sr. No.');

console.log('✔ All assertions passed: Vehicle & Storekeeper removed, Remarks moved lowerside, Store Name, Invoice No., Invoice Date, and Sr. No. labels updated!');
