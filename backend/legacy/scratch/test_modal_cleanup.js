const fs = require('fs');

const billingJs = fs.readFileSync('js/modules/billing.js', 'utf8');

console.log('Testing billing.js for removed UI controls:');

const checks = [
  { name: 'No new-jc-reg-type', failIf: billingJs.includes('new-jc-reg-type') },
  { name: 'No new-jc-is-unregistered', failIf: billingJs.includes('new-jc-is-unregistered') },
  { name: 'No toggleUnregisteredVehicle', failIf: billingJs.includes('toggleUnregisteredVehicle') },
  { name: 'No onRegTypeChange', failIf: billingJs.includes('onRegTypeChange') },
  { name: 'Has single clean input #new-jc-reg', failIf: !billingJs.includes('id="new-jc-reg"') },
  { name: 'Clean input has placeholder "e.g. MH 12 AB 1234"', failIf: !billingJs.includes('placeholder="e.g. MH 12 AB 1234"') },
  { name: 'Auto-detects vehicle registration type via DB', failIf: !billingJs.includes('window.DB.detectVehicleRegType(rawReg)') }
];

let allPassed = true;
checks.forEach(c => {
  if (c.failIf) {
    console.error(`❌ FAILED: ${c.name}`);
    allPassed = false;
  } else {
    console.log(`✓ PASSED: ${c.name}`);
  }
});

if (allPassed) {
  console.log('\n🎉 ALL MODAL CLEANUP VERIFICATIONS PASSED (100%)');
  process.exit(0);
} else {
  process.exit(1);
}
