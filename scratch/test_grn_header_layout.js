// Test script to verify GRN UI layout refinements
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing GRN Screen Layout, Title Refinements & Header Search Filter Positioning...');

const goodsReceiptJs = fs.readFileSync(path.join(__dirname, '../js/modules/goods-receipt.js'), 'utf-8');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
const pinnedJs = fs.readFileSync(path.join(__dirname, '../js/modules/pinned-submodules.js'), 'utf-8');

// 1. Check app.js route configuration
assert(appJs.includes("'#/grn': { module: window.GoodsReceiptModule, title: 'Goods Receipt Notes (GRN)', section: 'Procurement' }"), 'Route title must be Goods Receipt Notes (GRN)');
assert(!appJs.includes("'#/grn': { module: window.GoodsReceiptModule, title: 'Goods Receipt Notes (GRN) / Inward'"), 'Old title with / Inward must be removed');
assert(appJs.includes("if (hash === '#/grn') {\n        breadcrumbsWrap.innerHTML = '';\n        breadcrumbsWrap.style.display = 'none';"), 'Breadcrumbs must be hidden on #/grn route');
console.log('✔ app.js route title and breadcrumb suppression verified.');

// 2. Check pinned-submodules.js header button suppression
assert(pinnedJs.includes("if (hash === '#/login' || hash === '#/grn')"), 'Pin toggle button must not render on #/grn');
console.log('✔ pinned-submodules.js pin toggle suppression verified.');

// 3. Test GoodsReceiptModule.render() output
global.window = {
  State: { currentPlantId: 'ALL' },
  DB: {
    getAll: () => [{ id: 'GRN-1', plant_id: 'PL-1', grn_number: 'GRN-2026-001' }],
    getById: () => null,
    isPlantActive: () => true
  }
};

let breadcrumbsHidden = false;
let pinButtonRemoved = false;
let pageTitleText = '';

global.document = {
  querySelector: (sel) => {
    if (sel === '.breadcrumbs') {
      return {
        style: {
          set display(val) {
            if (val === 'none') breadcrumbsHidden = true;
          }
        }
      };
    }
    return null;
  },
  getElementById: (id) => {
    if (id === 'page-title-text') {
      return {
        set textContent(val) { pageTitleText = val; }
      };
    }
    if (id === 'header-screen-pin-btn') {
      return {
        remove: () => { pinButtonRemoved = true; }
      };
    }
    if (id === 'page-actions-container') {
      return pageActionsMock;
    }
    return null;
  }
};

const pageActionsMock = { innerHTML: '' };
eval(goodsReceiptJs);

const mockContainer = { innerHTML: '' };
window.GoodsReceiptModule.render(mockContainer);

// Assert breadcrumb and pin button suppression
assert.strictEqual(breadcrumbsHidden, true, 'Breadcrumbs must be set to display: none in render()');
assert.strictEqual(pinButtonRemoved, true, 'Pin button must be removed in render()');
assert.strictEqual(pageTitleText, 'Goods Receipt Notes (GRN)', 'Page title must be Goods Receipt Notes (GRN)');

// Assert that filters and + Receive Inward Delivery (GRN) are moved upperside into page-actions-container
const actionsHtml = pageActionsMock.innerHTML;
assert(actionsHtml.includes('id="grn-search"'), 'Search input must be located in page-actions-container');
assert(actionsHtml.includes('id="grn-type-filter"'), 'Type filter must be located in page-actions-container');
assert(actionsHtml.includes('id="grn-status-filter"'), 'Status filter must be located in page-actions-container');
assert(actionsHtml.includes('+ GRN'), 'Inward button must be located in page-actions-container and labeled + GRN');

// Assert that card-level redundant GRN label is completely removed
const cardHtml = mockContainer.innerHTML;
assert(!cardHtml.includes('class="card-title"'), 'Redundant card-title label must be completely removed');
assert(!cardHtml.includes('Goods Receipt Notes (GRN)'), 'Duplicate GRN label inside card must be removed');
assert(!cardHtml.includes('class="card-header"'), 'Card header should not exist when actions are in page-actions-container');
assert(cardHtml.includes('class="table-responsive"'), 'Card starts directly with table');

console.log('✔ Search, filters, and + GRN button moved upperside into page-actions.');
console.log('✔ Redundant GRN card title label completely removed.');
console.log('\n=============================================');
console.log('ALL GRN HEADER LAYOUT TESTS PASSED!');
console.log('=============================================');
