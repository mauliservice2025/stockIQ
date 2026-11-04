const assert = require('assert');

function parseIndianVehicleNumber(val) {
  if (!val) return null;
  const clean = String(val).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return null;

  // BH Series: 22 BH 1234 AA
  const bhMatch = clean.match(/^(\d{2})(BH)(\d{1,4})([A-Z]{1,2})$/);
  if (bhMatch) {
    return {
      type: 'BH',
      year: bhMatch[1],
      code: bhMatch[2],
      number: bhMatch[3],
      series: bhMatch[4],
      formatted: `${bhMatch[1]} ${bhMatch[2]} ${bhMatch[3]} ${bhMatch[4]}`
    };
  }

  // Standard: State (2 letters) + RTO (1-2 digits) + Optional Series (1-3 letters) + Number (1-4 digits)
  const stdMatch = clean.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})?(\d{1,4})$/);
  if (stdMatch) {
    return {
      type: 'STANDARD',
      stateCode: stdMatch[1],
      rtoCode: stdMatch[2],
      series: stdMatch[3] || '',
      number: stdMatch[4],
      formatted: [stdMatch[1], stdMatch[2], stdMatch[3], stdMatch[4]].filter(Boolean).join(' ')
    };
  }

  return null;
}

const p1 = parseIndianVehicleNumber('MH 12 AB 1234');
console.log('Parsed MH 12 AB 1234:', p1);
assert.strictEqual(p1.stateCode, 'MH');
assert.strictEqual(p1.rtoCode, '12');
assert.strictEqual(p1.series, 'AB');
assert.strictEqual(p1.number, '1234');
assert.strictEqual(p1.formatted, 'MH 12 AB 1234');

const p2 = parseIndianVehicleNumber('mh12xx1122');
console.log('Parsed mh12xx1122:', p2);
assert.strictEqual(p2.formatted, 'MH 12 XX 1122');

const p3 = parseIndianVehicleNumber('mh121234');
console.log('Parsed mh121234:', p3);
assert.strictEqual(p3.series, '');
assert.strictEqual(p3.formatted, 'MH 12 1234');

const p4 = parseIndianVehicleNumber('22bh1234aa');
console.log('Parsed 22bh1234aa:', p4);
assert.strictEqual(p4.type, 'BH');
assert.strictEqual(p4.formatted, '22 BH 1234 AA');

console.log('✓ All parse tests passed successfully!');
