const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, '../js/data/mock-data.js');
let { INITIAL_DATA } = require(mockDataPath);

// 1. Clean users
if (Array.isArray(INITIAL_DATA.users)) {
  INITIAL_DATA.users.forEach(u => {
    if (Array.isArray(u.assigned_plants)) {
      u.assigned_plants = u.assigned_plants.filter(p => p !== 'PLANT-02' && p !== 'PLANT-03');
    }
    if (u.plant_id === 'PLANT-02' || u.plant_id === 'PLANT-03') {
      u.plant_id = 'PLANT-01';
    }
  });
}

// 2. Clean document_number_series
if (Array.isArray(INITIAL_DATA.document_number_series)) {
  INITIAL_DATA.document_number_series = INITIAL_DATA.document_number_series.filter(
    s => s.branch_id !== 'PLANT-02' && s.branch_id !== 'PLANT-03'
  );
}

// 3. Clean holidays
if (Array.isArray(INITIAL_DATA.holidays)) {
  INITIAL_DATA.holidays = INITIAL_DATA.holidays.filter(
    h => h.facility_id !== 'PLANT-02' && h.facility_id !== 'PLANT-03'
  );
}

// 4. Clean plants
const forbiddenIds = ['PLANT-02', 'PLANT-03'];
const forbiddenCodes = ['BRANCH-CHE-02', 'BRANCH-WAKAD-01'];
const forbiddenNames = [
  'chennai sriperumbudur commercial branch',
  'apex two-wheeler wakad quick-service branch'
];

if (Array.isArray(INITIAL_DATA.plants)) {
  INITIAL_DATA.plants = INITIAL_DATA.plants.filter(p => {
    if (forbiddenIds.includes(p.id)) return false;
    if (p.code && forbiddenCodes.includes(p.code)) return false;
    if (p.name && forbiddenNames.includes(p.name.toLowerCase().trim())) return false;
    return true;
  });
}

// Clean facilities alias
INITIAL_DATA.facilities = INITIAL_DATA.plants;

// Delete helper/dynamic keys before serialization if they were assigned dynamically
delete INITIAL_DATA.facilities;

const serialized = `const INITIAL_DATA = ${JSON.stringify(INITIAL_DATA, null, 2)};

INITIAL_DATA.facilities = INITIAL_DATA.plants;
INITIAL_DATA.items = [];
INITIAL_DATA.vehicleModels = [];
INITIAL_DATA.itemVehicleCompatibility = [];
INITIAL_DATA.storeItemMappings = [];
INITIAL_DATA.inventoryBalances = [];
INITIAL_DATA.inventoryTransactions = [];

INITIAL_DATA.jobCards = [];
INITIAL_DATA.billingEstimates = [];
INITIAL_DATA.draftBills = [];
INITIAL_DATA.finalBills = [];
INITIAL_DATA.vehicleDeliveries = [];
INITIAL_DATA.creditNotes = [];
INITIAL_DATA.paymentReceipts = [];
INITIAL_DATA.jobCardParts = [];

if (typeof window !== 'undefined') {
  window.INITIAL_DATA = INITIAL_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { INITIAL_DATA };
}
`;

fs.writeFileSync(mockDataPath, serialized, 'utf8');
console.log('Successfully updated js/data/mock-data.js');
