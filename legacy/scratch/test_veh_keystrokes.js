const assert = require('assert');

function formatIndianVehicleNumber(val) {
  if (!val) return '';
  let clean = String(val).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return '';

  // BH Series: 22 BH 1234 AA
  const bhMatch = clean.match(/^(\d{2})(BH)(\d{0,4})([A-Z]{0,2})$/);
  if (bhMatch) {
    return [bhMatch[1], bhMatch[2], bhMatch[3], bhMatch[4]].filter(Boolean).join(' ');
  }

  // Standard Format: State (2 letters) + RTO (2 digits) + Series (1-3 letters) + Number (1-4 digits)
  const stdMatch = clean.match(/^([A-Z]{0,2})(\d{0,2})([A-Z]{0,3})(\d{0,4})/);
  if (stdMatch) {
    const parts = [stdMatch[1], stdMatch[2], stdMatch[3], stdMatch[4]].filter(Boolean);
    return parts.join(' ');
  }
  return clean;
}

// Keystroke typing simulation
let currentVal = '';
const sequence = ['m', 'h', '1', '2', 'a', 'b', '1', '2', '3', '4'];
console.log('--- Keystroke simulation ---');
for (const ch of sequence) {
  currentVal += ch;
  currentVal = formatIndianVehicleNumber(currentVal);
  console.log(`Typed '${ch}' -> "${currentVal}"`);
}
assert.strictEqual(currentVal, 'MH 12 AB 1234');

// Paste simulation
console.log('--- Paste simulation ---');
const pasteInputs = [
  'mh-12-ab-1234',
  'MH12AB1234',
  'mh 12 ab 1234',
  'mh.12.ab.1234',
  '22bh1234aa',
  'dl01a1'
];
for (const p of pasteInputs) {
  const res = formatIndianVehicleNumber(p);
  console.log(`Pasted '${p}' -> "${res}"`);
}
assert.strictEqual(formatIndianVehicleNumber('mh-12-ab-1234'), 'MH 12 AB 1234');
assert.strictEqual(formatIndianVehicleNumber('MH12AB1234'), 'MH 12 AB 1234');
assert.strictEqual(formatIndianVehicleNumber('dl01a1'), 'DL 01 A 1');

console.log('✓ Keystroke and paste simulations passed!');
