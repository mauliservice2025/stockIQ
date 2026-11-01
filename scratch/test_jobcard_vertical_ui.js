const fs = require('fs');
const assert = require('assert');

console.log('Testing Create New Job Card Vertical UI...\n');

const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');

// 1. Check showModal maxWidth is 640px (Vertical UI)
assert(billingCode.includes("maxWidth: '640px'"), "Modal maxWidth must be set to '640px' for vertical layout");
console.log("✓ Modal maxWidth configured to 640px for vertical portrait orientation.");

// 2. Check Section 1 grid is 1fr 1fr
const sec1Match = billingCode.match(/<!-- Section 1: Vehicle Details[\s\S]*?grid-template-columns:\s*([^;]+);/);
assert(sec1Match && sec1Match[1].trim() === '1fr 1fr', "Section 1 must use 2-column grid: 1fr 1fr");
console.log("✓ Section 1 (Vehicle Details) converted to 2-column grid layout (1fr 1fr).");

// 3. Check Section 2 grid is 1fr 1fr
const sec2Match = billingCode.match(/<!-- Section 2: Customer Information[\s\S]*?grid-template-columns:\s*([^;]+);/);
assert(sec2Match && sec2Match[1].trim() === '1fr 1fr', "Section 2 must use 2-column grid: 1fr 1fr");
console.log("✓ Section 2 (Customer Information) converted to 2-column grid layout (1fr 1fr).");

// 4. Check City / District / State 3-column subgrid in Section 2
assert(billingCode.includes('grid-template-columns: 1fr 1fr 1fr; gap: 3px 6px;'), "Section 2 must have 3-col subgrid for City, District, State");
console.log("✓ City, District, and State aligned in a compact 3-column subgrid.");

// 5. Check Section 3 grid is 1fr 1fr
const sec3Match = billingCode.match(/<!-- Section 3: Service Scope & Assignment[\s\S]*?grid-template-columns:\s*([^;]+);/);
assert(sec3Match && sec3Match[1].trim() === '1fr 1fr', "Section 3 must use 2-column grid: 1fr 1fr");
console.log("✓ Section 3 (Service Scope & Assignment) converted to 2-column grid layout (1fr 1fr).");

// 6. Check textarea smooth focus expansion in components.css
const cssCode = fs.readFileSync('d:/Projects/ISCM/css/components.css', 'utf8');
assert(cssCode.includes('.jc-compact-form textarea.form-control:focus'), "CSS must include textarea focus expand");
console.log("✓ Textarea focus expansion enabled in css/components.css.");

console.log('\n🎉 ALL VERTICAL UI TESTS PASSED SUCCESSFULLY!\n');
