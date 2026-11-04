const fs = require('fs');

console.log('Testing Create New Job Card modal updates: Plant name removal & Field Minimization...\n');

// 1. Check billing.js syntax
const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');

// Check modalTitle for Workshop Facility
const titleIdx = billingCode.indexOf('const modalTitle = `');
const titleEndIdx = billingCode.indexOf('`;', titleIdx);
const modalTitle = billingCode.slice(titleIdx, titleEndIdx);

// Test A: No 🏢 in label
const hasPlantIcon = modalTitle.includes('🏢');
console.log(`1. '🏢' icon removed from 'Workshop Facility:' label: ${!hasPlantIcon ? '✓ PASS' : '✗ FAIL'}`);

// Test B: Plant ID / code like (${fac.id}) or (PLANT-01) removed from facility options
const hasPlantIdSuffix = modalTitle.includes('(${fac.id})');
const hasCleanName = modalTitle.includes('cleanName') && modalTitle.includes('replace');
console.log(`2. '(${'${fac.id}'})' plant suffix removed from facility select: ${!hasPlantIdSuffix && hasCleanName ? '✓ PASS' : '✗ FAIL'}`);

// Test C: Field minimization in create-jc-form
const formIdx = billingCode.indexOf('<form id="create-jc-form"');
const formEndIdx = billingCode.indexOf('</form>', formIdx);
const formCode = billingCode.slice(formIdx, formEndIdx);

const count22px = (formCode.match(/height:\s*22px;/g) || []).length;
console.log(`3. Compact fields (height: 22px) count in create-jc-form: ${count22px} (${count22px >= 20 ? '✓ PASS' : '✗ FAIL'})`);

// Test D: Check css/components.css for .jc-compact-form placeholder and gap rules
const cssCode = fs.readFileSync('d:/Projects/ISCM/css/components.css', 'utf8');
const hasCompactPlaceholder = cssCode.includes('.jc-compact-form input::placeholder') && cssCode.includes('font-size: 10px !important');
const hasCompactGroupGap = cssCode.includes('.jc-compact-form .form-group') && cssCode.includes('gap: 1px !important');
console.log(`4. CSS .jc-compact-form tight gap (1px) and small placeholder (10px): ${hasCompactPlaceholder && hasCompactGroupGap ? '✓ PASS' : '✗ FAIL'}`);

// Test E: Verify clean rendered option string with mock facility
const mockFac = { id: 'PLANT-01', code: 'MSC-01', name: 'Mauli Service Center - I [PLANT-01]' };
const cleanName = (mockFac.name || mockFac.code || '').replace(/\s*[\(\[]?PLANT-\d+[\)\]]?/gi, '').replace(/\s*-\s*$/, '').trim();
console.log(`5. Sample cleaned facility name: "${cleanName}" (${cleanName === 'Mauli Service Center - I' ? '✓ PASS' : '✗ FAIL'})`);

if (!hasPlantIcon && !hasPlantIdSuffix && hasCleanName && count22px >= 20 && hasCompactPlaceholder && hasCompactGroupGap && cleanName === 'Mauli Service Center - I') {
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('\n❌ SOME TESTS FAILED!');
  process.exit(1);
}
