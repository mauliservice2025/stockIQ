const assert = require('assert');

// 1. Normalization function
function normalizeVehicleReg(val) {
  if (!val) return '';
  return String(val).toUpperCase().replace(/[\s\-_.]/g, '');
}

// 2. Display formatter
function formatVehicleRegDisplay(val, regType) {
  if (!val) return '';
  const clean = normalizeVehicleReg(val);
  if (!clean) return '';

  if (regType === 'UNREGISTERED' || clean.startsWith('UNREG') || clean === 'APPLIEDFOR' || clean === 'NEW') {
    return val.trim();
  }

  // BH Series: 22 BH 1234 AA
  const bhMatch = clean.match(/^(\d{2})(BH)(\d{1,4})([A-Z]{1,2})$/);
  if (bhMatch) {
    return `${bhMatch[1]} ${bhMatch[2]} ${bhMatch[3]} ${bhMatch[4]}`;
  }

  // Standard Format: State (2) + RTO (1-2) + Series (0-3) + Number (1-4)
  const stdMatch = clean.match(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/);
  if (stdMatch) {
    return [stdMatch[1], stdMatch[2], stdMatch[3], stdMatch[4]].filter(Boolean).join(' ');
  }

  // Temporary Registration: e.g. MH 12 TR 1234
  const tempMatch = clean.match(/^([A-Z]{2})(\d{1,2})(TR|TEMP|T)(\d{1,6})$/);
  if (tempMatch) {
    return `${tempMatch[1]} ${tempMatch[2]} ${tempMatch[3]} ${tempMatch[4]}`;
  }

  return clean;
}

// 3. Test normalization & display
console.log('--- Test 1: Normalization and Display ---');
assert.strictEqual(normalizeVehicleReg('mh 12 ab 1234'), 'MH12AB1234');
assert.strictEqual(normalizeVehicleReg('MH-12-AB-1234'), 'MH12AB1234');
assert.strictEqual(normalizeVehicleReg('  mh.12.ab.1234  '), 'MH12AB1234');
assert.strictEqual(normalizeVehicleReg('22 BH 1234 AA'), '22BH1234AA');
assert.strictEqual(formatVehicleRegDisplay('MH12AB1234'), 'MH 12 AB 1234');
assert.strictEqual(formatVehicleRegDisplay('22BH1234AA'), '22 BH 1234 AA');
assert.strictEqual(formatVehicleRegDisplay('MH12TR5678'), 'MH 12 TR 5678');
console.log('✓ Normalization and display format tests passed');

// 4. Test Duplicate Active Vehicle Validation
console.log('--- Test 2: Duplicate Active Validation ---');
const mockVehicles = [
  {
    id: 'VEH-001',
    vehicle_id: 'VEH-001',
    vehicle_reg_no: 'MH12AB1234',
    vehicle_reg_no_display: 'MH 12 AB 1234',
    status: 'ACTIVE',
    organization_id: 'ORG-01',
    plant_id: 'PLANT-01',
    customer_name: 'Anand Kulkarni',
    registration_history: []
  },
  {
    id: 'VEH-002',
    vehicle_id: 'VEH-002',
    vehicle_reg_no: 'MH12XX9999',
    vehicle_reg_no_display: 'MH 12 XX 9999',
    status: 'INACTIVE', // Inactive vehicle!
    organization_id: 'ORG-01',
    plant_id: 'PLANT-01',
    customer_name: 'Old User',
    registration_history: []
  }
];

function checkDuplicateActiveVehicle(rawRegNo, options, vehiclesList, rules) {
  const clean = normalizeVehicleReg(rawRegNo);
  if (!clean) return { isDuplicate: false };
  if (clean === 'UNREG' || clean === 'APPLIEDFOR' || clean === 'NEW') {
    return { isDuplicate: false };
  }

  if (rules && rules.allow_duplicate_active_registration === true) {
    return { isDuplicate: false, allowedByException: true };
  }

  const excludeVehicleId = options.excludeVehicleId || null;
  const organizationId = options.organizationId || null;

  const matched = vehiclesList.find(v => {
    if (excludeVehicleId && (v.id === excludeVehicleId || v.vehicle_id === excludeVehicleId)) {
      return false;
    }
    if (normalizeVehicleReg(v.vehicle_reg_no) !== clean) return false;
    if (v.status !== 'ACTIVE') return false;
    if (organizationId && v.organization_id && v.organization_id !== organizationId) return false;
    return true;
  });

  if (matched) {
    return {
      isDuplicate: true,
      vehicle: matched,
      message: `Active vehicle with registration [${matched.vehicle_reg_no_display}] already exists in this organization.`
    };
  }
  return { isDuplicate: false };
}

// Should detect duplicate of active vehicle even if entered with spaces/hyphens
const dupCheck1 = checkDuplicateActiveVehicle('mh-12-ab-1234', { organizationId: 'ORG-01' }, mockVehicles, { allow_duplicate_active_registration: false });
assert.strictEqual(dupCheck1.isDuplicate, true, 'Should detect duplicate for active vehicle');
console.log('✓ Detected duplicate for active vehicle:', dupCheck1.message);

// Should allow if duplicate exception is configured
const dupCheckAllowed = checkDuplicateActiveVehicle('mh 12 ab 1234', { organizationId: 'ORG-01' }, mockVehicles, { allow_duplicate_active_registration: true });
assert.strictEqual(dupCheckAllowed.isDuplicate, false, 'Should allow when exception configured');
assert.strictEqual(dupCheckAllowed.allowedByException, true);
console.log('✓ Allowed duplicate when configured as authorized exception');

// Should not block inactive vehicle
const dupCheckInactive = checkDuplicateActiveVehicle('mh 12 xx 9999', { organizationId: 'ORG-01' }, mockVehicles, { allow_duplicate_active_registration: false });
assert.strictEqual(dupCheckInactive.isDuplicate, false, 'Should allow inactive vehicle duplicate');
console.log('✓ Inactive vehicle is not blocked as duplicate');

// 5. Test Registration Change History
console.log('--- Test 3: Registration History Retention ---');
function updateVehicleRegistration(vehicle, newRawRegNo, options) {
  const cleanNew = normalizeVehicleReg(newRawRegNo);
  const cleanOld = normalizeVehicleReg(vehicle.vehicle_reg_no);
  if (cleanNew === cleanOld) return vehicle;

  const displayNew = formatVehicleRegDisplay(cleanNew, options.regType);
  const entry = {
    previous_reg: vehicle.vehicle_reg_no,
    previous_reg_display: vehicle.vehicle_reg_no_display || vehicle.vehicle_reg_no,
    new_reg: cleanNew,
    new_reg_display: displayNew,
    change_date: options.changeDate || '2026-10-09T12:00:00.000Z',
    authorized_user: options.authorizedUser || 'Pravin Patil',
    user_id: options.userId || 'USR-001',
    reason: options.reason || 'Re-registration after interstate transfer'
  };

  vehicle.registration_history.unshift(entry);
  vehicle.vehicle_reg_no = cleanNew;
  vehicle.vehicle_reg_no_display = displayNew;
  return vehicle;
}

const v1 = mockVehicles[0];
updateVehicleRegistration(v1, 'MH 12 CD 5678', {
  authorizedUser: 'Santosh Shinde',
  userId: 'USR-108',
  reason: 'Transferred from Mumbai to Pune RTO'
});

assert.strictEqual(v1.vehicle_reg_no, 'MH12CD5678', 'Stored format should be standardized compact');
assert.strictEqual(v1.vehicle_reg_no_display, 'MH 12 CD 5678', 'Display format should have spaces');
assert.strictEqual(v1.registration_history.length, 1);
assert.strictEqual(v1.registration_history[0].previous_reg, 'MH12AB1234');
assert.strictEqual(v1.registration_history[0].previous_reg_display, 'MH 12 AB 1234');
assert.strictEqual(v1.registration_history[0].new_reg, 'MH12CD5678');
assert.strictEqual(v1.registration_history[0].authorized_user, 'Santosh Shinde');
assert.strictEqual(v1.registration_history[0].reason, 'Transferred from Mumbai to Pune RTO');
console.log('✓ Registration history correctly retains previous registration number, date, user, and reason');

// 6. Test Unregistered vehicles
console.log('--- Test 4: Unregistered / New vehicles ---');
const unregDisplay = formatVehicleRegDisplay('APPLIED FOR', 'UNREGISTERED');
assert.strictEqual(unregDisplay, 'APPLIED FOR');
const dupCheckUnreg = checkDuplicateActiveVehicle('APPLIED FOR', {}, mockVehicles, { allow_duplicate_active_registration: false });
assert.strictEqual(dupCheckUnreg.isDuplicate, false);
console.log('✓ Unregistered vehicles handled cleanly');

console.log('=====================================================');
console.log('ALL BUSINESS RULES TESTS PASSED (100%)');
console.log('=====================================================');
