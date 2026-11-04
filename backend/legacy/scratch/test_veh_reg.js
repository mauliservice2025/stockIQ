const assert = require('assert');

function formatIndianVehicleNumber(val) {
  if (!val) return '';
  let clean = String(val).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return '';

  // Check BH Series (e.g. 22 BH 1234 AA)
  const bhMatch = clean.match(/^(\d{2})(BH)(\d{0,4})([A-Z]{0,2})$/);
  if (bhMatch) {
    return [bhMatch[1], bhMatch[2], bhMatch[3], bhMatch[4]].filter(Boolean).join(' ');
  }

  // Standard Format: State(2 letters) + RTO(2 digits) + Series(1-3 letters) + Number(1-4 digits)
  // or older Format: State(2 letters) + RTO(2 digits) + Number(1-4 digits)
  const stdMatch = clean.match(/^([A-Z]{0,2})(\d{0,2})([A-Z]{0,3})(\d{0,4})/);
  if (stdMatch) {
    const parts = [stdMatch[1], stdMatch[2], stdMatch[3], stdMatch[4]].filter(Boolean);
    return parts.join(' ');
  }
  return clean;
}

function validateIndianVehicleNumber(val) {
  if (!val) return { valid: false, error: 'Vehicle registration number is required' };
  const formatted = formatIndianVehicleNumber(val);
  const clean = formatted.replace(/\s+/g, '');

  // Standard format: 2 letters, 2 digits, 1-3 letters, 1-4 digits (e.g. MH 12 AB 1234)
  const stdRegex = /^[A-Z]{2}\s\d{2}\s[A-Z]{1,3}\s\d{1,4}$/;
  // Older format: 2 letters, 2 digits, 1-4 digits (e.g. MH 12 1234)
  const oldRegex = /^[A-Z]{2}\s\d{2}\s\d{1,4}$/;
  // BH format: 2 digits, BH, 4 digits, 2 letters (e.g. 22 BH 1234 AA)
  const bhRegex = /^\d{2}\sBH\s\d{4}\s[A-Z]{2}$/;

  const isValid = stdRegex.test(formatted) || oldRegex.test(formatted) || bhRegex.test(formatted);
  return {
    valid: isValid,
    formatted,
    clean
  };
}

const tests = [
  'mh12ab1234',
  'MH 12 AB 1234',
  'MH-12-XX-1122',
  'mh12xx1122',
  'dl01a9999',
  'ka04mb5678',
  'mh121234',
  '22bh1234aa'
];

console.log('Vehicle formatting test:');
for (const t of tests) {
  const v = validateIndianVehicleNumber(t);
  console.log(`"${t}" -> Formatted: "${v.formatted}" | Valid: ${v.valid}`);
  assert(v.valid, `Expected "${t}" to be valid`);
}
console.log('✓ All vehicle number formatting and validation tests passed!');
