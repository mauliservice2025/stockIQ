const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: STOCK TRANSFER EXTEND TILL LAST ===\n');

// 1. Check css/components.css
const css = fs.readFileSync(path.join(__dirname, '../css/components.css'), 'utf8');
if (!css.includes('.modal-container.modal-fullscreen .modal-body') || 
    !css.includes('display: flex;') || 
    !css.includes('flex-direction: column;') ||
    !css.includes('min-height: 0;')) {
  throw new Error('FAIL: components.css does not have display: flex, flex-direction: column, min-height: 0 on modal-body');
}
console.log('✓ 1. css/components.css configured for full-height flex column modal-body.');

// 2. Check js/state.js
const stateJs = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
if (!stateJs.includes('bodyFlex') || !stateJs.includes("bodyEl.style.minHeight = '0'")) {
  throw new Error('FAIL: js/state.js does not apply bodyFlex or minHeight 0 to bodyEl');
}
console.log('✓ 2. js/state.js supports bodyFlex and enforces minHeight 0 on bodyEl.');

// 3. Check js/modules/transfers.js
const transfersJs = fs.readFileSync(path.join(__dirname, '../js/modules/transfers.js'), 'utf8');
if (!transfersJs.includes('id="create-trf-form"') ||
    !transfersJs.includes('height: 100%; flex: 1; min-height: 0;')) {
  throw new Error('FAIL: js/modules/transfers.js form does not have height: 100%; flex: 1; min-height: 0;');
}
console.log('✓ 3. transfers.js form has height: 100%; flex: 1; min-height: 0;');

if (!transfersJs.includes('Items to Transfer Card') ||
    !transfersJs.includes('flex: 1; display: flex; flex-direction: column; min-height: 0;')) {
  throw new Error('FAIL: transfers.js Items to Transfer Card does not have flex: 1; display: flex; flex-direction: column; min-height: 0;');
}
console.log('✓ 4. transfers.js Items to Transfer Card has flex: 1; min-height: 0;');

if (!transfersJs.includes('class="table-responsive" style="flex: 1; min-height: 0; overflow-y: auto;')) {
  throw new Error('FAIL: transfers.js table-responsive container does not have flex: 1; min-height: 0; overflow-y: auto;');
}
console.log('✓ 5. transfers.js table-responsive container has flex: 1; min-height: 0; overflow-y: auto;');

if (!transfersJs.includes('bodyFlex: true') || !transfersJs.includes('noScroll: true')) {
  throw new Error('FAIL: transfers.js showModal call does not pass bodyFlex: true and noScroll: true');
}
console.log('✓ 6. transfers.js passes bodyFlex: true and noScroll: true to showModal.');

console.log('\n================================================================');
console.log('🎉 ALL EXTEND-TILL-LAST CHECKS PASSED (100%)!');
console.log('================================================================');
