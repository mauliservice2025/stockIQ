const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, '../js/data/mock-data.js');
let content = fs.readFileSync(mockDataPath, 'utf8');

console.log('Read mock-data.js, length:', content.length);

// 1. Two-Wheeler Stores
const twoWheelerStores = [
  {
    id: 'WH-PUN-MAIN',
    plant_id: 'PLANT-01',
    code: 'STR-PUN-MAIN',
    name: 'Main Store - Central Spare Parts Hub',
    warehouse_type: 'MAIN_STORE',
    store_type_id: 'ST-01',
    store_type: 'Main Store',
    parent_store_id: null,
    parent_store_name: null,
    manager_user_id: 'USR-002',
    manager: 'Rajesh Sharma',
    contact_number: '9822012345',
    email: 'mainstore.pune@patilauto.com',
    status: 'Active',
    effective_from: '2026-01-01',
    effective_to: null,
    capacity_cbm: 4200,
    occupied_cbm: 2850
  },
  {
    id: 'WH-PUN-SPARE',
    plant_id: 'PLANT-01',
    code: 'STR-PUN-SPARE',
    name: 'Spare Parts Sub Store',
    warehouse_type: 'SUB_STORE',
    store_type_id: 'ST-03',
    store_type: 'Spare Parts Sub Store',
    parent_store_id: 'WH-PUN-MAIN',
    parent_store_name: 'Main Store - Central Spare Parts Hub',
    manager_user_id: 'USR-004',
    manager: 'Santosh Shinde',
    contact_number: '9822023456',
    email: 'spareparts.pune@patilauto.com',
    status: 'Active',
    effective_from: '2026-01-01',
    effective_to: null,
    capacity_cbm: 1500,
    occupied_cbm: 920
  },
  {
    id: 'WH-PUN-LUB',
    plant_id: 'PLANT-01',
    code: 'STR-PUN-LUB',
    name: 'Lubricant Store',
    warehouse_type: 'SUB_STORE',
    store_type_id: 'ST-04',
    store_type: 'Lubricant Store',
    parent_store_id: 'WH-PUN-MAIN',
    parent_store_name: 'Main Store - Central Spare Parts Hub',
    manager_user_id: 'USR-002',
    manager: 'Rajesh Sharma',
    contact_number: '9822034567',
    email: 'lubricants.pune@patilauto.com',
    status: 'Active',
    effective_from: '2026-01-01',
    effective_to: null,
    capacity_cbm: 1200,
    occupied_cbm: 680
  },
  {
    id: 'WH-PUN-BAT',
    plant_id: 'PLANT-01',
    code: 'STR-PUN-BAT',
    name: 'Battery Store',
    warehouse_type: 'SUB_STORE',
    store_type_id: 'ST-05',
    store_type: 'Battery Store',
    parent_store_id: 'WH-PUN-MAIN',
    parent_store_name: 'Main Store - Central Spare Parts Hub',
    manager_user_id: 'USR-002',
    manager: 'Rajesh Sharma',
    contact_number: '9822045678',
    email: 'battery.pune@patilauto.com',
    status: 'Active',
    effective_from: '2026-01-01',
    effective_to: null,
    capacity_cbm: 800,
    occupied_cbm: 420
  },
  {
    id: 'WH-PUN-TYRE',
    plant_id: 'PLANT-01',
    code: 'STR-PUN-TYRE',
    name: 'Tyre Store',
    warehouse_type: 'SUB_STORE',
    store_type_id: 'ST-06',
    store_type: 'Tyre Store',
    parent_store_id: 'WH-PUN-MAIN',
    parent_store_name: 'Main Store - Central Spare Parts Hub',
    manager_user_id: 'USR-002',
    manager: 'Rajesh Sharma',
    contact_number: '9822056789',
    email: 'tyres.pune@patilauto.com',
    status: 'Active',
    effective_from: '2026-01-01',
    effective_to: null,
    capacity_cbm: 1600,
    occupied_cbm: 1100
  },
  {
    id: 'WH-PUN-ACC',
    plant_id: 'PLANT-01',
    code: 'STR-PUN-ACC',
    name: 'Accessories Store',
    warehouse_type: 'SUB_STORE',
    store_type_id: 'ST-07',
    store_type: 'Accessories Store',
    parent_store_id: 'WH-PUN-MAIN',
    parent_store_name: 'Main Store - Central Spare Parts Hub',
    manager_user_id: 'USR-002',
    manager: 'Rajesh Sharma',
    contact_number: '9822067890',
    email: 'accessories.pune@patilauto.com',
    status: 'Active',
    effective_from: '2026-01-01',
    effective_to: null,
    capacity_cbm: 950,
    occupied_cbm: 540
  },
  {
    id: 'WH-PUN-WARR',
    plant_id: 'PLANT-01',
    code: 'STR-PUN-WARR',
    name: 'Warranty / Defective Parts Store',
    warehouse_type: 'WARRANTY_STORE',
    store_type_id: 'ST-08',
    store_type: 'Warranty Store',
    parent_store_id: 'WH-PUN-MAIN',
    parent_store_name: 'Main Store - Central Spare Parts Hub',
    manager_user_id: 'USR-002',
    manager: 'Rajesh Sharma',
    contact_number: '9822078901',
    email: 'warranty.pune@patilauto.com',
    status: 'Active',
    effective_from: '2026-01-01',
    effective_to: null,
    capacity_cbm: 600,
    occupied_cbm: 210
  },
  {
    id: 'WH-PUN-SCRAP',
    plant_id: 'PLANT-01',
    code: 'STR-PUN-SCRAP',
    name: 'Scrap & Salvage Disposal Store',
    warehouse_type: 'SCRAP_STORE',
    store_type_id: 'ST-09',
    store_type: 'Scrap Store',
    parent_store_id: 'WH-PUN-MAIN',
    parent_store_name: 'Main Store - Central Spare Parts Hub',
    manager_user_id: 'USR-006',
    manager: 'Suresh Nair',
    contact_number: '9822089012',
    email: 'scrap.pune@patilauto.com',
    status: 'Active',
    effective_from: '2026-01-01',
    effective_to: null,
    capacity_cbm: 850,
    occupied_cbm: 380
  },
  {
    id: 'WH-PUN-WRK',
    plant_id: 'PLANT-01',
    code: 'STR-PUN-WRK',
    name: 'Workshop Floor Bay & Tech Store',
    warehouse_type: 'SUB_STORE',
    store_type_id: 'ST-10',
    store_type: 'Workshop Floor Store',
    parent_store_id: 'WH-PUN-MAIN',
    parent_store_name: 'Main Store - Central Spare Parts Hub',
    manager_user_id: 'USR-004',
    manager: 'Santosh Shinde',
    contact_number: '9822090123',
    email: 'workshop.pune@patilauto.com',
    status: 'Active',
    effective_from: '2026-01-01',
    effective_to: null,
    capacity_cbm: 700,
    occupied_cbm: 310
  }
];

// 2. Storage structure: zones, racks, shelves, bins
const twoWheelerZones = [
  { id: 'ZONE-2W-A', warehouse_id: 'WH-PUN-SPARE', code: 'LOC-2W-A', name: 'Zone A - Fast Moving Service Parts & Brake Wearables', location_type: 'HIGH_DENSITY_RACK', status: 'Active' },
  { id: 'ZONE-2W-B', warehouse_id: 'WH-PUN-LUB', code: 'LOC-2W-B', name: 'Zone B - Engine Oils & Workshop Fluids', location_type: 'BULK_STORAGE', status: 'Active' },
  { id: 'ZONE-2W-C', warehouse_id: 'WH-PUN-BAT', code: 'LOC-2W-C', name: 'Zone C - Battery Staging & Trickle Charge Rack', location_type: 'SHELF_STORAGE', status: 'Active' },
  { id: 'ZONE-2W-D', warehouse_id: 'WH-PUN-TYRE', code: 'LOC-2W-D', name: 'Zone D - Tyre & Tube Vertical Racks', location_type: 'BULK_STORAGE', status: 'Active' },
  { id: 'ZONE-2W-W', warehouse_id: 'WH-PUN-WARR', code: 'LOC-2W-W', name: 'Zone W - OEM Warranty Hold & Inspection', location_type: 'QUARANTINE_HOLD', status: 'Active' },
  { id: 'ZONE-2W-S', warehouse_id: 'WH-PUN-SCRAP', code: 'LOC-2W-S', name: 'Zone S - Salvage Scrap & Metal Bins', location_type: 'BULK_STORAGE', status: 'Active' }
];

const twoWheelerRacks = [
  { id: 'RCK-2W-01', warehouse_id: 'WH-PUN-SPARE', storage_location_id: 'ZONE-2W-A', code: 'R-2W-01', name: 'Brake & Electrical Multi-tier Rack', rack_type: 'Modular Shelf', max_weight_capacity_kg: 2000, total_shelves: 3, status: 'Active' },
  { id: 'RCK-2W-02', warehouse_id: 'WH-PUN-LUB', storage_location_id: 'ZONE-2W-B', code: 'R-2W-02', name: 'Oil Bottle & Fluid Dispensing Rack', rack_type: 'Heavy Duty Bulk', max_weight_capacity_kg: 3500, total_shelves: 2, status: 'Active' },
  { id: 'RCK-2W-03', warehouse_id: 'WH-PUN-WARR', storage_location_id: 'ZONE-2W-W', code: 'R-2W-03', name: 'Warranty Claim Staging Rack', rack_type: 'Secure Lockable', max_weight_capacity_kg: 1000, total_shelves: 2, status: 'Active' }
];

const twoWheelerShelves = [
  { id: 'SHF-2W-01', rack_id: 'RCK-2W-01', code: 'S-2W-01', name: 'Tier 1 - Brake Pads & Shoes', shelf_level: 1, max_weight_capacity_kg: 600, status: 'Active' },
  { id: 'SHF-2W-02', rack_id: 'RCK-2W-01', code: 'S-2W-02', name: 'Tier 2 - Spark Plugs & Filters', shelf_level: 2, max_weight_capacity_kg: 500, status: 'Active' },
  { id: 'SHF-2W-03', rack_id: 'RCK-2W-02', code: 'S-2W-03', name: 'Tier 1 - 10W-30 Bottles & Cans', shelf_level: 1, max_weight_capacity_kg: 1200, status: 'Active' }
];

const twoWheelerBins = [
  { id: 'BIN-PUN-A01', warehouse_id: 'WH-PUN-SPARE', zone_id: 'ZONE-2W-A', rack_id: 'RCK-2W-01', shelf_id: 'SHF-2W-01', rack: 'R-2W-01', shelf: 'S-2W-01', bin: 'B-01', code: 'BIN-2W-A01', max_weight: 200, max_vol: 1.5, occupied_pct: 65, status: 'normal' },
  { id: 'BIN-PUN-A02', warehouse_id: 'WH-PUN-SPARE', zone_id: 'ZONE-2W-A', rack_id: 'RCK-2W-01', shelf_id: 'SHF-2W-02', rack: 'R-2W-01', shelf: 'S-2W-02', bin: 'B-01', code: 'BIN-2W-A02', max_weight: 150, max_vol: 1.2, occupied_pct: 40, status: 'normal' },
  { id: 'BIN-PUN-A03', warehouse_id: 'WH-PUN-SPARE', zone_id: 'ZONE-2W-A', rack_id: 'RCK-2W-01', shelf_id: 'SHF-2W-02', rack: 'R-2W-01', shelf: 'S-2W-02', bin: 'B-02', code: 'BIN-2W-A03', max_weight: 150, max_vol: 1.0, occupied_pct: 35, status: 'normal' },
  { id: 'BIN-PUN-B01', warehouse_id: 'WH-PUN-LUB', zone_id: 'ZONE-2W-B', rack_id: 'RCK-2W-02', shelf_id: 'SHF-2W-03', rack: 'R-2W-02', shelf: 'S-2W-03', bin: 'B-01', code: 'BIN-2W-B01', max_weight: 500, max_vol: 2.5, occupied_pct: 78, status: 'high' },
  { id: 'BIN-PUN-W01', warehouse_id: 'WH-PUN-WARR', zone_id: 'ZONE-2W-W', rack_id: 'RCK-2W-03', shelf_id: 'SHF-2W-03', rack: 'R-2W-03', shelf: 'S-2W-03', bin: 'B-01', code: 'BIN-2W-W01', max_weight: 300, max_vol: 1.8, occupied_pct: 20, status: 'quarantine' }
];

// 3. 20 BRD Standard Categories
const brdCategories = [
  { id: 'CAT-ENG', code: 'ENG-PRT', name: 'Engine Parts' },
  { id: 'CAT-TRANS', code: 'TRN-PRT', name: 'Transmission Parts' },
  { id: 'CAT-BRK', code: 'BRK-PRT', name: 'Brake Parts' },
  { id: 'CAT-ELEC', code: 'ELC-PRT', name: 'Electrical Parts' },
  { id: 'CAT-BAT', code: 'BAT-PRT', name: 'Battery' },
  { id: 'CAT-LUB', code: 'LUB-OIL', name: 'Lubricants' },
  { id: 'CAT-FLT', code: 'FLT-PRT', name: 'Filters' },
  { id: 'CAT-TYR', code: 'TYR-TUB', name: 'Tyres & Tubes' },
  { id: 'CAT-SUSP', code: 'SUS-PRT', name: 'Suspension' },
  { id: 'CAT-STR', code: 'STR-PRT', name: 'Steering Parts' },
  { id: 'CAT-BODY', code: 'BDY-PRT', name: 'Body Parts' },
  { id: 'CAT-CBL', code: 'CBL-PRT', name: 'Cables' },
  { id: 'CAT-CSM', code: 'CSM-MAT', name: 'Consumables' },
  { id: 'CAT-ACC', code: 'ACC-PRT', name: 'Accessories' },
  { id: 'CAT-TLS', code: 'TLS-EQP', name: 'Tools' },
  { id: 'CAT-CLN', code: 'CLN-MAT', name: 'Cleaning Materials' },
  { id: 'CAT-FST', code: 'FST-PRT', name: 'Fasteners' },
  { id: 'CAT-RUB', code: 'RUB-PRT', name: 'Rubber Parts' },
  { id: 'CAT-WARR', code: 'WAR-PRT', name: 'Warranty Parts' },
  { id: 'CAT-SCRP', code: 'SCP-PRT', name: 'Scrap Parts' }
];

// Subcategories (BRD Section 6.7)
const itemSubcategories = [
  { id: 'SUB-BRK-01', category_id: 'CAT-BRK', code: 'BRK-PAD', name: 'Brake Pad' },
  { id: 'SUB-BRK-02', category_id: 'CAT-BRK', code: 'BRK-SHO', name: 'Brake Shoe' },
  { id: 'SUB-BRK-03', category_id: 'CAT-BRK', code: 'BRK-DSC', name: 'Brake Disc' },
  { id: 'SUB-BRK-04', category_id: 'CAT-BRK', code: 'BRK-DRM', name: 'Brake Drum' },
  { id: 'SUB-BRK-05', category_id: 'CAT-BRK', code: 'BRK-CBL', name: 'Brake Cable' },
  { id: 'SUB-BRK-06', category_id: 'CAT-BRK', code: 'BRK-FLD', name: 'Brake Fluid' },

  { id: 'SUB-ELC-01', category_id: 'CAT-ELEC', code: 'ELC-BAT', name: 'Battery' },
  { id: 'SUB-ELC-02', category_id: 'CAT-ELEC', code: 'ELC-BLB', name: 'Bulb' },
  { id: 'SUB-ELC-03', category_id: 'CAT-ELEC', code: 'ELC-FUS', name: 'Fuse' },
  { id: 'SUB-ELC-04', category_id: 'CAT-ELEC', code: 'ELC-RLY', name: 'Relay' },
  { id: 'SUB-ELC-05', category_id: 'CAT-ELEC', code: 'ELC-HRN', name: 'Horn' },
  { id: 'SUB-ELC-06', category_id: 'CAT-ELEC', code: 'ELC-WIR', name: 'Wiring Harness' },
  { id: 'SUB-ELC-07', category_id: 'CAT-ELEC', code: 'ELC-STR', name: 'Starter Motor' },
  { id: 'SUB-ELC-08', category_id: 'CAT-ELEC', code: 'ELC-REC', name: 'Regulator / Rectifier (RR Unit)' },
  { id: 'SUB-ELC-09', category_id: 'CAT-ELEC', code: 'ELC-SPK', name: 'Spark Plug' },

  { id: 'SUB-ENG-01', category_id: 'CAT-ENG', code: 'ENG-PST', name: 'Piston & Rings' },
  { id: 'SUB-ENG-02', category_id: 'CAT-ENG', code: 'ENG-VLV', name: 'Valves & Guides' },
  { id: 'SUB-ENG-03', category_id: 'CAT-ENG', code: 'ENG-GSK', name: 'Gasket Kit' },

  { id: 'SUB-TRN-01', category_id: 'CAT-TRANS', code: 'TRN-CLT', name: 'Clutch Plate' },
  { id: 'SUB-TRN-02', category_id: 'CAT-TRANS', code: 'TRN-CHN', name: 'Drive Chain & Sprocket' },
  { id: 'SUB-TRN-03', category_id: 'CAT-TRANS', code: 'TRN-BLT', name: 'CVT Drive Belt' },

  { id: 'SUB-LUB-01', category_id: 'CAT-LUB', code: 'LUB-4T-10W30', name: 'Engine Oil 4T 10W-30' },
  { id: 'SUB-LUB-02', category_id: 'CAT-LUB', code: 'LUB-4T-20W40', name: 'Engine Oil 4T 20W-40' },
  { id: 'SUB-LUB-03', category_id: 'CAT-LUB', code: 'LUB-FRK', name: 'Front Fork Oil' },
  { id: 'SUB-LUB-04', category_id: 'CAT-LUB', code: 'LUB-GRS', name: 'Chassis & Bearing Grease' },

  { id: 'SUB-FLT-01', category_id: 'CAT-FLT', code: 'FLT-AIR-FOM', name: 'Air Filter (Foam)' },
  { id: 'SUB-FLT-02', category_id: 'CAT-FLT', code: 'FLT-AIR-PPR', name: 'Air Filter (Paper Cartridge)' },
  { id: 'SUB-FLT-03', category_id: 'CAT-FLT', code: 'FLT-OIL', name: 'Engine Oil Filter' },

  { id: 'SUB-TYR-01', category_id: 'CAT-TYR', code: 'TYR-TBL-FRT', name: 'Tubeless Front Tyre 90/90-12' },
  { id: 'SUB-TYR-02', category_id: 'CAT-TYR', code: 'TYR-TBL-RR', name: 'Tubeless Rear Tyre 90/100-10' },

  { id: 'SUB-WAR-01', category_id: 'CAT-WARR', code: 'WAR-CLM', name: 'Warranty Claim Part' },
  { id: 'SUB-SCP-01', category_id: 'CAT-SCRP', code: 'SCP-MTL', name: 'Salvage Metal Scrap' }
];

// Two-Wheeler Items
const twoWheelerItems = [
  {
    id: 'ITEM-2W-001',
    code: '2W-BRK-PAD-01',
    name: 'Front Disc Brake Pad Set - Activa / Jupiter / Access',
    category_id: 'CAT-BRK',
    subcategory_id: 'SUB-BRK-01',
    item_type: 'SPARE_PART',
    base_uom: 'SET',
    valuation_method: 'FIFO',
    standard_cost: 280,
    last_purchase_price: 280,
    sale_price: 380,
    min_stock: 10,
    max_stock: 100,
    reorder_level: 25,
    safety_stock: 10,
    lead_time_days: 2,
    moq: 10,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: '87141090'
  },
  {
    id: 'ITEM-2W-002',
    code: '2W-BRK-SHO-01',
    name: 'Rear Brake Shoe Set - Activa 6G / Splendor Plus',
    category_id: 'CAT-BRK',
    subcategory_id: 'SUB-BRK-02',
    item_type: 'SPARE_PART',
    base_uom: 'SET',
    valuation_method: 'FIFO',
    standard_cost: 180,
    last_purchase_price: 180,
    sale_price: 260,
    min_stock: 15,
    max_stock: 150,
    reorder_level: 30,
    safety_stock: 15,
    lead_time_days: 2,
    moq: 15,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: '87141090'
  },
  {
    id: 'ITEM-2W-003',
    code: '2W-LUB-10W30-01',
    name: '4T 10W-30 Premium Engine Oil (1L Bottle)',
    category_id: 'CAT-LUB',
    subcategory_id: 'SUB-LUB-01',
    item_type: 'CONSUMABLE',
    base_uom: 'BTL',
    valuation_method: 'FIFO',
    standard_cost: 290,
    last_purchase_price: 290,
    sale_price: 395,
    min_stock: 20,
    max_stock: 200,
    reorder_level: 50,
    safety_stock: 20,
    lead_time_days: 3,
    moq: 24,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: true,
    shelf_life_days: 1095,
    hsn_code: '27101981'
  },
  {
    id: 'ITEM-2W-004',
    code: '2W-FLT-AIR-01',
    name: 'Foam Air Filter Element - Activa 6G',
    category_id: 'CAT-FLT',
    subcategory_id: 'SUB-FLT-01',
    item_type: 'SPARE_PART',
    base_uom: 'NOS',
    valuation_method: 'FIFO',
    standard_cost: 95,
    last_purchase_price: 95,
    sale_price: 165,
    min_stock: 15,
    max_stock: 80,
    reorder_level: 20,
    safety_stock: 10,
    lead_time_days: 2,
    moq: 20,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: '84213100'
  },
  {
    id: 'ITEM-2W-005',
    code: '2W-FLT-AIR-02',
    name: 'Paper Air Filter Cartridge - Jupiter 125',
    category_id: 'CAT-FLT',
    subcategory_id: 'SUB-FLT-02',
    item_type: 'SPARE_PART',
    base_uom: 'NOS',
    valuation_method: 'FIFO',
    standard_cost: 120,
    last_purchase_price: 120,
    sale_price: 195,
    min_stock: 10,
    max_stock: 60,
    reorder_level: 15,
    safety_stock: 8,
    lead_time_days: 3,
    moq: 15,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: '84213100'
  },
  {
    id: 'ITEM-2W-006',
    code: '2W-ELC-SPK-01',
    name: 'NGK Resistor Spark Plug CPR8EA-9',
    category_id: 'CAT-ELEC',
    subcategory_id: 'SUB-ELC-09',
    item_type: 'SPARE_PART',
    base_uom: 'NOS',
    valuation_method: 'FIFO',
    standard_cost: 110,
    last_purchase_price: 110,
    sale_price: 175,
    min_stock: 20,
    max_stock: 100,
    reorder_level: 30,
    safety_stock: 15,
    lead_time_days: 2,
    moq: 20,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: '85111000'
  },
  {
    id: 'ITEM-2W-007',
    code: '2W-BAT-VRLA-01',
    name: 'Maintenance-Free VRLA Battery 12V 5Ah',
    category_id: 'CAT-BAT',
    subcategory_id: 'SUB-ELC-01',
    item_type: 'SPARE_PART',
    base_uom: 'NOS',
    valuation_method: 'FIFO',
    standard_cost: 950,
    last_purchase_price: 950,
    sale_price: 1350,
    min_stock: 5,
    max_stock: 40,
    reorder_level: 10,
    safety_stock: 5,
    lead_time_days: 4,
    moq: 5,
    is_batch_controlled: true,
    is_serial_controlled: true,
    has_expiry: true,
    shelf_life_days: 730,
    hsn_code: '85072000'
  },
  {
    id: 'ITEM-2W-008',
    code: '2W-TYR-9090-01',
    name: 'Tubeless Front Tyre 90/90-12 (MRF Zapper)',
    category_id: 'CAT-TYR',
    subcategory_id: 'SUB-TYR-01',
    item_type: 'SPARE_PART',
    base_uom: 'NOS',
    valuation_method: 'FIFO',
    standard_cost: 1100,
    last_purchase_price: 1100,
    sale_price: 1550,
    min_stock: 4,
    max_stock: 30,
    reorder_level: 8,
    safety_stock: 4,
    lead_time_days: 5,
    moq: 4,
    is_batch_controlled: true,
    is_serial_controlled: true,
    has_expiry: false,
    hsn_code: '40114000'
  },
  {
    id: 'ITEM-2W-009',
    code: '2W-TRN-CLT-01',
    name: 'Wet Multi-Plate Clutch Friction Plate Set',
    category_id: 'CAT-TRANS',
    subcategory_id: 'SUB-TRN-01',
    item_type: 'SPARE_PART',
    base_uom: 'SET',
    valuation_method: 'FIFO',
    standard_cost: 380,
    last_purchase_price: 380,
    sale_price: 550,
    min_stock: 8,
    max_stock: 50,
    reorder_level: 15,
    safety_stock: 6,
    lead_time_days: 3,
    moq: 8,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: '87141090'
  },
  {
    id: 'ITEM-2W-010',
    code: '2W-TRN-CHN-01',
    name: 'Heavy Duty Brass Drive Chain & Sprocket Kit',
    category_id: 'CAT-TRANS',
    subcategory_id: 'SUB-TRN-02',
    item_type: 'SPARE_PART',
    base_uom: 'SET',
    valuation_method: 'FIFO',
    standard_cost: 750,
    last_purchase_price: 750,
    sale_price: 1150,
    min_stock: 6,
    max_stock: 40,
    reorder_level: 12,
    safety_stock: 5,
    lead_time_days: 4,
    moq: 6,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: '87141090'
  },
  {
    id: 'ITEM-2W-011',
    code: '2W-TRN-BLT-01',
    name: 'CVT Variator Drive Belt - Activa 6G / Dio',
    category_id: 'CAT-TRANS',
    subcategory_id: 'SUB-TRN-03',
    item_type: 'SPARE_PART',
    base_uom: 'NOS',
    valuation_method: 'FIFO',
    standard_cost: 320,
    last_purchase_price: 320,
    sale_price: 480,
    min_stock: 10,
    max_stock: 60,
    reorder_level: 18,
    safety_stock: 8,
    lead_time_days: 3,
    moq: 10,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: '40103190'
  },
  {
    id: 'ITEM-2W-012',
    code: '2W-LUB-FRK-01',
    name: 'Front Fork Suspension Oil (350ml Can)',
    category_id: 'CAT-LUB',
    subcategory_id: 'SUB-LUB-03',
    item_type: 'CONSUMABLE',
    base_uom: 'CAN',
    valuation_method: 'FIFO',
    standard_cost: 130,
    last_purchase_price: 130,
    sale_price: 190,
    min_stock: 10,
    max_stock: 50,
    reorder_level: 15,
    safety_stock: 6,
    lead_time_days: 3,
    moq: 12,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: true,
    shelf_life_days: 1095,
    hsn_code: '27101981'
  },
  {
    id: 'ITEM-2W-013',
    code: '2W-BRK-FLD-01',
    name: 'DOT 4 Synthetic Disc Brake Fluid (250ml)',
    category_id: 'CAT-BRK',
    subcategory_id: 'SUB-BRK-06',
    item_type: 'CONSUMABLE',
    base_uom: 'BTL',
    valuation_method: 'FIFO',
    standard_cost: 105,
    last_purchase_price: 105,
    sale_price: 160,
    min_stock: 12,
    max_stock: 60,
    reorder_level: 15,
    safety_stock: 8,
    lead_time_days: 2,
    moq: 12,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: true,
    shelf_life_days: 730,
    hsn_code: '38190010'
  },
  {
    id: 'ITEM-2W-014',
    code: '2W-WAR-PAD-01',
    name: 'Defective Brake Pad (Under Warranty Claim Review)',
    category_id: 'CAT-WARR',
    subcategory_id: 'SUB-WAR-01',
    item_type: 'WARRANTY_PART',
    base_uom: 'SET',
    valuation_method: 'STANDARD',
    standard_cost: 0,
    last_purchase_price: 0,
    sale_price: 0,
    min_stock: 0,
    max_stock: 50,
    reorder_level: 0,
    safety_stock: 0,
    lead_time_days: 0,
    moq: 1,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: '87141090'
  },
  {
    id: 'ITEM-2W-015',
    code: '2W-SCP-MET-01',
    name: 'Salvage Workshop Metal Scrap (Drums, Rims, Stanchions)',
    category_id: 'CAT-SCRP',
    subcategory_id: 'SUB-SCP-01',
    item_type: 'SCRAP_PART',
    base_uom: 'KG',
    valuation_method: 'STANDARD',
    standard_cost: 25,
    last_purchase_price: 25,
    sale_price: 35,
    min_stock: 0,
    max_stock: 1000,
    reorder_level: 0,
    safety_stock: 0,
    lead_time_days: 0,
    moq: 10,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: '72044900'
  }
];

// Initial balances for Two-Wheeler inventory
const twoWheelerBalances = [
  {
    id: 'BAL-2W-001',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-SPARE',
    bin_id: 'BIN-PUN-A01',
    item_id: 'ITEM-2W-001',
    batch_number: 'LOT-BRK-2601',
    serial_number: null,
    on_hand: 45,
    reserved: 5,
    available: 40,
    stock_status: 'AVAILABLE',
    valuation_rate: 280,
    mfg_date: '2026-08-10',
    expiry_date: null
  },
  {
    id: 'BAL-2W-002',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-SPARE',
    bin_id: 'BIN-PUN-A01',
    item_id: 'ITEM-2W-002',
    batch_number: 'LOT-SHO-2602',
    serial_number: null,
    on_hand: 60,
    reserved: 3,
    available: 57,
    stock_status: 'AVAILABLE',
    valuation_rate: 180,
    mfg_date: '2026-08-15',
    expiry_date: null
  },
  {
    id: 'BAL-2W-003',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-LUB',
    bin_id: 'BIN-PUN-B01',
    item_id: 'ITEM-2W-003',
    batch_number: 'LOT-OIL-2605',
    serial_number: null,
    on_hand: 120,
    reserved: 10,
    available: 110,
    stock_status: 'AVAILABLE',
    valuation_rate: 290,
    mfg_date: '2026-07-20',
    expiry_date: '2029-07-19'
  },
  {
    id: 'BAL-2W-004',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-SPARE',
    bin_id: 'BIN-PUN-A02',
    item_id: 'ITEM-2W-004',
    batch_number: 'LOT-FLT-2603',
    serial_number: null,
    on_hand: 30,
    reserved: 2,
    available: 28,
    stock_status: 'AVAILABLE',
    valuation_rate: 95,
    mfg_date: '2026-08-01',
    expiry_date: null
  },
  {
    id: 'BAL-2W-005',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-SPARE',
    bin_id: 'BIN-PUN-A03',
    item_id: 'ITEM-2W-006',
    batch_number: 'LOT-SPK-2601',
    serial_number: null,
    on_hand: 40,
    reserved: 4,
    available: 36,
    stock_status: 'AVAILABLE',
    valuation_rate: 110,
    mfg_date: '2026-06-01',
    expiry_date: null
  },
  {
    id: 'BAL-2W-006',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-WARR',
    bin_id: 'BIN-PUN-W01',
    item_id: 'ITEM-2W-014',
    batch_number: 'LOT-WARR-2601',
    serial_number: null,
    on_hand: 4,
    reserved: 0,
    available: 4,
    stock_status: 'QUARANTINE',
    valuation_rate: 0,
    mfg_date: '2026-09-15',
    expiry_date: null
  }
];

// 4. Store Types (BRD Section 6.2)
const storeTypes = [
  { id: 'ST-01', code: 'MAIN_STORE', name: 'Main Store', purpose: 'Central spare parts inventory hub', is_parent_allowed: false, is_sub_store: false, active: true },
  { id: 'ST-02', code: 'SUB_STORE', name: 'Sub Store', purpose: 'Parts used by technicians / branch operations', is_parent_allowed: true, is_sub_store: true, active: true },
  { id: 'ST-03', code: 'SPARE_PARTS', name: 'Spare Parts Sub Store', purpose: 'Dedicated fast-moving mechanical and electrical spare parts', is_parent_allowed: true, is_sub_store: true, active: true },
  { id: 'ST-04', code: 'LUBRICANT_STORE', name: 'Lubricant Store', purpose: 'Engine oils, gear oils, fork oils, coolants and greases', is_parent_allowed: true, is_sub_store: true, active: true },
  { id: 'ST-05', code: 'BATTERY_STORE', name: 'Battery Store', purpose: 'Two-wheeler VRLA and conventional batteries with acid staging', is_parent_allowed: true, is_sub_store: true, active: true },
  { id: 'ST-06', code: 'TYRE_STORE', name: 'Tyre Store', purpose: 'Tubeless tyres, tubed tyres, tubes and rim bands', is_parent_allowed: true, is_sub_store: true, active: true },
  { id: 'ST-07', code: 'ACCESSORIES_STORE', name: 'Accessories Store', purpose: 'Helmets, crash guards, seat covers, grip covers, visors', is_parent_allowed: true, is_sub_store: true, active: true },
  { id: 'ST-08', code: 'WARRANTY_STORE', name: 'Warranty Store', purpose: 'Replaced warranty and defective parts held for OEM inspection/claim', is_parent_allowed: true, is_sub_store: true, active: true },
  { id: 'ST-09', code: 'SCRAP_STORE', name: 'Scrap Store', purpose: 'Disposed, damaged, worn-out salvage metals and scrap materials', is_parent_allowed: true, is_sub_store: true, active: true },
  { id: 'ST-10', code: 'WORKSHOP_FLOOR', name: 'Workshop Floor Store', purpose: 'Technician bay floor stock, shop consumables and common fasteners', is_parent_allowed: true, is_sub_store: true, active: true }
];

// 5. Store Transaction Configuration (22 booleans per store - BRD Section 6.4)
const defaultStoreTransactionMatrix = {
  purchase_requisition: false,
  purchase_order: false,
  grn_receipt: false,
  purchase_return: false,
  material_issue: false,
  material_return: false,
  job_card_issue: false,
  job_card_return: false,
  stock_transfer: false,
  stock_adjustment: false,
  physical_stock_count: false,
  stock_reservation: false,
  walk_in_sale: false,
  counter_sale: false,
  sales_return: false,
  warranty_return: false,
  scrap_disposal: false,
  inter_branch_transfer: false,
  bin_transfer: false,
  opening_stock: false,
  quarantine: false,
  quality_inspection: false
};

const storeTransactionConfigs = [
  // Main Store has procurement, transfers, quality, sales, adjustments
  {
    store_id: 'WH-PUN-MAIN',
    store_code: 'STR-PUN-MAIN',
    store_name: 'Main Store - Central Spare Parts Hub',
    purchase_requisition: true,
    purchase_order: true,
    grn_receipt: true,
    purchase_return: true,
    material_issue: true,
    material_return: true,
    job_card_issue: false,
    job_card_return: false,
    stock_transfer: true,
    stock_adjustment: true,
    physical_stock_count: true,
    stock_reservation: true,
    walk_in_sale: true,
    counter_sale: true,
    sales_return: true,
    warranty_return: false,
    scrap_disposal: false,
    inter_branch_transfer: true,
    bin_transfer: true,
    opening_stock: true,
    quarantine: true,
    quality_inspection: true
  },
  // Spare Parts Sub Store handles Job Card parts issue, returns, reservations, transfers
  {
    store_id: 'WH-PUN-SPARE',
    store_code: 'STR-PUN-SPARE',
    store_name: 'Spare Parts Sub Store',
    purchase_requisition: true,
    purchase_order: false,
    grn_receipt: false,
    purchase_return: false,
    material_issue: true,
    material_return: true,
    job_card_issue: true,
    job_card_return: true,
    stock_transfer: true,
    stock_adjustment: true,
    physical_stock_count: true,
    stock_reservation: true,
    walk_in_sale: true,
    counter_sale: true,
    sales_return: true,
    warranty_return: false,
    scrap_disposal: false,
    inter_branch_transfer: false,
    bin_transfer: true,
    opening_stock: true,
    quarantine: false,
    quality_inspection: false
  },
  // Lubricant Store
  {
    store_id: 'WH-PUN-LUB',
    store_code: 'STR-PUN-LUB',
    store_name: 'Lubricant Store',
    purchase_requisition: true,
    purchase_order: false,
    grn_receipt: false,
    purchase_return: false,
    material_issue: true,
    material_return: true,
    job_card_issue: true,
    job_card_return: true,
    stock_transfer: true,
    stock_adjustment: true,
    physical_stock_count: true,
    stock_reservation: true,
    walk_in_sale: true,
    counter_sale: true,
    sales_return: true,
    warranty_return: false,
    scrap_disposal: false,
    inter_branch_transfer: false,
    bin_transfer: true,
    opening_stock: true,
    quarantine: false,
    quality_inspection: false
  },
  // Warranty Store
  {
    store_id: 'WH-PUN-WARR',
    store_code: 'STR-PUN-WARR',
    store_name: 'Warranty / Defective Parts Store',
    purchase_requisition: false,
    purchase_order: false,
    grn_receipt: false,
    purchase_return: false,
    material_issue: false,
    material_return: false,
    job_card_issue: false,
    job_card_return: false,
    stock_transfer: true,
    stock_adjustment: true,
    physical_stock_count: true,
    stock_reservation: false,
    walk_in_sale: false,
    counter_sale: false,
    sales_return: false,
    warranty_return: true,
    scrap_disposal: true,
    inter_branch_transfer: false,
    bin_transfer: true,
    opening_stock: false,
    quarantine: true,
    quality_inspection: true
  },
  // Scrap Store
  {
    store_id: 'WH-PUN-SCRAP',
    store_code: 'STR-PUN-SCRAP',
    store_name: 'Scrap & Salvage Disposal Store',
    purchase_requisition: false,
    purchase_order: false,
    grn_receipt: false,
    purchase_return: false,
    material_issue: false,
    material_return: false,
    job_card_issue: false,
    job_card_return: false,
    stock_transfer: true,
    stock_adjustment: true,
    physical_stock_count: true,
    stock_reservation: false,
    walk_in_sale: false,
    counter_sale: false,
    sales_return: false,
    warranty_return: false,
    scrap_disposal: true,
    inter_branch_transfer: false,
    bin_transfer: true,
    opening_stock: false,
    quarantine: false,
    quality_inspection: false
  },
  // Workshop Floor Store
  {
    store_id: 'WH-PUN-WRK',
    store_code: 'STR-PUN-WRK',
    store_name: 'Workshop Floor Bay & Tech Store',
    purchase_requisition: false,
    purchase_order: false,
    grn_receipt: false,
    purchase_return: false,
    material_issue: true,
    material_return: true,
    job_card_issue: true,
    job_card_return: true,
    stock_transfer: true,
    stock_adjustment: false,
    physical_stock_count: true,
    stock_reservation: true,
    walk_in_sale: false,
    counter_sale: false,
    sales_return: false,
    warranty_return: false,
    scrap_disposal: false,
    inter_branch_transfer: false,
    bin_transfer: false,
    opening_stock: false,
    quarantine: false,
    quality_inspection: false
  }
];

// 6. Vehicle Manufacturers & Models (BRD Section 6.9)
const vehicleManufacturers = [
  { id: 'VM-01', code: 'HONDA', name: 'Honda Motorcycle & Scooter India (HMSI)', country: 'Japan / India', active: true },
  { id: 'VM-02', code: 'TVS', name: 'TVS Motor Company', country: 'India', active: true },
  { id: 'VM-03', code: 'HERO', name: 'Hero MotoCorp Ltd.', country: 'India', active: true },
  { id: 'VM-04', code: 'YAMAHA', name: 'India Yamaha Motor', country: 'Japan / India', active: true },
  { id: 'VM-05', code: 'BAJAJ', name: 'Bajaj Auto Ltd.', country: 'India', active: true },
  { id: 'VM-06', code: 'ROYAL_ENFIELD', name: 'Royal Enfield (Eicher Motors)', country: 'India', active: true },
  { id: 'VM-07', code: 'SUZUKI', name: 'Suzuki Motorcycle India', country: 'Japan / India', active: true }
];

const vehicleModels = [
  { id: 'MOD-01', manufacturer_id: 'VM-01', code: 'ACTIVA-6G', name: 'Activa 6G', variant: 'Deluxe (BS6)', displacement_cc: 110, year_from: 2020, year_to: 2026, fuel_type: 'Petrol' },
  { id: 'MOD-02', manufacturer_id: 'VM-01', code: 'ACTIVA-125', name: 'Activa 125', variant: 'Disc SmartXonnect', displacement_cc: 125, year_from: 2019, year_to: 2026, fuel_type: 'Petrol' },
  { id: 'MOD-03', manufacturer_id: 'VM-01', code: 'SHINE-125', name: 'Shine 125', variant: 'Disc Brake', displacement_cc: 125, year_from: 2018, year_to: 2026, fuel_type: 'Petrol' },
  { id: 'MOD-04', manufacturer_id: 'VM-02', code: 'JUPITER-125', name: 'Jupiter 125', variant: 'Disc SmartXonnect', displacement_cc: 125, year_from: 2021, year_to: 2026, fuel_type: 'Petrol' },
  { id: 'MOD-05', manufacturer_id: 'VM-02', code: 'APACHE-160', name: 'Apache RTR 160 4V', variant: 'Dual Channel ABS', displacement_cc: 160, year_from: 2020, year_to: 2026, fuel_type: 'Petrol' },
  { id: 'MOD-06', manufacturer_id: 'VM-03', code: 'SPLENDOR-PLUS', name: 'Splendor Plus', variant: 'Self Cast XTEC', displacement_cc: 97, year_from: 2018, year_to: 2026, fuel_type: 'Petrol' },
  { id: 'MOD-07', manufacturer_id: 'VM-04', code: 'FZ-V3', name: 'FZ-S V3', variant: 'Deluxe ABS', displacement_cc: 149, year_from: 2019, year_to: 2026, fuel_type: 'Petrol' },
  { id: 'MOD-08', manufacturer_id: 'VM-05', code: 'PULSAR-150', name: 'Pulsar 150', variant: 'Twin Disc BS6', displacement_cc: 150, year_from: 2018, year_to: 2026, fuel_type: 'Petrol' },
  { id: 'MOD-09', manufacturer_id: 'VM-06', code: 'CLASSIC-350', name: 'Classic 350 (J-Series)', variant: 'Dark Stealth', displacement_cc: 349, year_from: 2021, year_to: 2026, fuel_type: 'Petrol' },
  { id: 'MOD-10', manufacturer_id: 'VM-07', code: 'ACCESS-125', name: 'Access 125', variant: 'Special Edition Ride Connect', displacement_cc: 125, year_from: 2020, year_to: 2026, fuel_type: 'Petrol' }
];

// 7. Item-Vehicle Compatibility (BRD Section 6.9 & Section 23)
const itemVehicleCompatibility = [
  { id: 'IVC-01', item_id: 'ITEM-2W-001', manufacturer_id: 'VM-01', model_id: 'MOD-02', variant: 'Disc SmartXonnect', year_from: 2019, year_to: 2026, notes: 'Direct OEM Fitment' },
  { id: 'IVC-02', item_id: 'ITEM-2W-001', manufacturer_id: 'VM-02', model_id: 'MOD-04', variant: 'Disc SmartXonnect', year_from: 2021, year_to: 2026, notes: 'Direct OEM Fitment' },
  { id: 'IVC-03', item_id: 'ITEM-2W-001', manufacturer_id: 'VM-07', model_id: 'MOD-10', variant: 'Special Edition Ride Connect', year_from: 2020, year_to: 2026, notes: 'Direct OEM Fitment' },
  { id: 'IVC-04', item_id: 'ITEM-2W-002', manufacturer_id: 'VM-01', model_id: 'MOD-01', variant: 'Deluxe (BS6)', year_from: 2020, year_to: 2026, notes: 'Rear 130mm Drum' },
  { id: 'IVC-05', item_id: 'ITEM-2W-002', manufacturer_id: 'VM-03', model_id: 'MOD-06', variant: 'Self Cast XTEC', year_from: 2018, year_to: 2026, notes: 'Rear 130mm Drum' },
  { id: 'IVC-06', item_id: 'ITEM-2W-003', manufacturer_id: 'VM-01', model_id: 'MOD-01', variant: 'All Variants', year_from: 2020, year_to: 2026, notes: 'Capacity 750ml, recommended 10W-30' },
  { id: 'IVC-07', item_id: 'ITEM-2W-003', manufacturer_id: 'VM-02', model_id: 'MOD-04', variant: 'All Variants', year_from: 2021, year_to: 2026, notes: 'Capacity 800ml, recommended 10W-30' },
  { id: 'IVC-08', item_id: 'ITEM-2W-004', manufacturer_id: 'VM-01', model_id: 'MOD-01', variant: 'Deluxe (BS6)', year_from: 2020, year_to: 2026, notes: 'Pre-oiled foam element' },
  { id: 'IVC-09', item_id: 'ITEM-2W-005', manufacturer_id: 'VM-02', model_id: 'MOD-04', variant: 'Disc SmartXonnect', year_from: 2021, year_to: 2026, notes: 'High-flow paper cartridge' },
  { id: 'IVC-10', item_id: 'ITEM-2W-006', manufacturer_id: 'VM-01', model_id: 'MOD-01', variant: 'Deluxe (BS6)', year_from: 2020, year_to: 2026, notes: 'NGK CPR8EA-9 (0.8-0.9mm gap)' },
  { id: 'IVC-11', item_id: 'ITEM-2W-006', manufacturer_id: 'VM-02', model_id: 'MOD-04', variant: 'Disc SmartXonnect', year_from: 2021, year_to: 2026, notes: 'NGK CPR8EA-9' },
  { id: 'IVC-12', item_id: 'ITEM-2W-007', manufacturer_id: 'VM-01', model_id: 'MOD-01', variant: 'Deluxe (BS6)', year_from: 2020, year_to: 2026, notes: '12V 5Ah VRLA Battery' },
  { id: 'IVC-13', item_id: 'ITEM-2W-008', manufacturer_id: 'VM-01', model_id: 'MOD-01', variant: 'Deluxe (BS6)', year_from: 2020, year_to: 2026, notes: '90/90-12 54J Tubeless' },
  { id: 'IVC-14', item_id: 'ITEM-2W-009', manufacturer_id: 'VM-05', model_id: 'MOD-08', variant: 'Twin Disc BS6', year_from: 2018, year_to: 2026, notes: 'Wet multi-plate 5-friction plates' },
  { id: 'IVC-15', item_id: 'ITEM-2W-010', manufacturer_id: 'VM-05', model_id: 'MOD-08', variant: 'Twin Disc BS6', year_from: 2018, year_to: 2026, notes: 'Chain pitch 428 / 124 links' },
  { id: 'IVC-16', item_id: 'ITEM-2W-011', manufacturer_id: 'VM-01', model_id: 'MOD-01', variant: 'Deluxe (BS6)', year_from: 2020, year_to: 2026, notes: 'K0R-V-Belt 18.5x743' }
];

// 8. Store Item Mappings (BRD Section 6.8 & 13)
const storeItemMappings = [
  { id: 'SIM-01', store_id: 'WH-PUN-SPARE', item_id: 'ITEM-2W-001', min_stock: 10, max_stock: 80, reorder_level: 25, reorder_quantity: 30, default_bin_id: 'BIN-PUN-A01', active_yn: 'Y' },
  { id: 'SIM-02', store_id: 'WH-PUN-SPARE', item_id: 'ITEM-2W-002', min_stock: 15, max_stock: 100, reorder_level: 30, reorder_quantity: 40, default_bin_id: 'BIN-PUN-A01', active_yn: 'Y' },
  { id: 'SIM-03', store_id: 'WH-PUN-LUB', item_id: 'ITEM-2W-003', min_stock: 20, max_stock: 200, reorder_level: 50, reorder_quantity: 60, default_bin_id: 'BIN-PUN-B01', active_yn: 'Y' },
  { id: 'SIM-04', store_id: 'WH-PUN-SPARE', item_id: 'ITEM-2W-004', min_stock: 15, max_stock: 80, reorder_level: 20, reorder_quantity: 25, default_bin_id: 'BIN-PUN-A02', active_yn: 'Y' },
  { id: 'SIM-05', store_id: 'WH-PUN-SPARE', item_id: 'ITEM-2W-006', min_stock: 20, max_stock: 100, reorder_level: 30, reorder_quantity: 35, default_bin_id: 'BIN-PUN-A03', active_yn: 'Y' },
  { id: 'SIM-06', store_id: 'WH-PUN-BAT', item_id: 'ITEM-2W-007', min_stock: 5, max_stock: 40, reorder_level: 10, reorder_quantity: 15, default_bin_id: 'BIN-PUN-A01', active_yn: 'Y' },
  { id: 'SIM-07', store_id: 'WH-PUN-TYRE', item_id: 'ITEM-2W-008', min_stock: 4, max_stock: 30, reorder_level: 8, reorder_quantity: 12, default_bin_id: 'BIN-PUN-A01', active_yn: 'Y' },
  { id: 'SIM-08', store_id: 'WH-PUN-WARR', item_id: 'ITEM-2W-014', min_stock: 0, max_stock: 50, reorder_level: 0, reorder_quantity: 0, default_bin_id: 'BIN-PUN-W01', active_yn: 'Y' },
  { id: 'SIM-09', store_id: 'WH-PUN-SCRAP', item_id: 'ITEM-2W-015', min_stock: 0, max_stock: 1000, reorder_level: 0, reorder_quantity: 0, default_bin_id: 'BIN-PUN-W01', active_yn: 'Y' }
];

// 9. Inventory Rules (BRD Section 6.11)
const inventoryRules = {
  allow_negative_stock: false,
  allow_backdated_transactions: false,
  batch_tracking_enabled: true,
  expiry_tracking_enabled: true,
  serial_tracking_enabled: true,
  barcode_scanning_enabled: true,
  auto_reorder_enabled: true,
  stock_reservation_enabled: true,
  bin_mandatory_enabled: true,
  physical_stock_approval_required: true,
  stock_adjustment_approval_required: true,
  scrap_approval_required: true,
  warranty_approval_required: true,
  high_value_approval_threshold: 5000
};

// 10. Job Cards Workflow (BRD Section 6.12 - 6.15 & Section 7.3)
const jobCards = [
  {
    id: 'JC-2026-001',
    job_card_no: 'JC-PUN-26-001',
    date: '2026-09-22',
    customer_name: 'Ramesh Patil',
    customer_mobile: '9822112233',
    vehicle_reg_no: 'MH-12-AB-1234',
    vehicle_manufacturer: 'Honda',
    vehicle_model_id: 'MOD-01',
    vehicle_model: 'Honda Activa 6G',
    vehicle_variant: 'Deluxe (BS6)',
    vehicle_year: 2023,
    odometer_km: 12450,
    technician_id: 'USR-004',
    technician_name: 'Santosh Shinde',
    store_id: 'WH-PUN-SPARE',
    service_type: 'Periodic Maintenance & Brake Overhaul',
    status: 'PARTS_RESERVED',
    diagnosis: 'Front brake grinding noise, engine oil degraded, throttle lag at low RPM',
    parts_required: [
      { item_id: 'ITEM-2W-002', item_code: '2W-BRK-SHO-01', item_name: 'Rear Brake Shoe Set - Activa 6G', qty: 1, reserved_qty: 1, issued_qty: 0, returned_qty: 0, unit_price: 260, status: 'RESERVED', bin_id: 'BIN-PUN-A01' },
      { item_id: 'ITEM-2W-003', item_code: '2W-LUB-10W30-01', item_name: '4T 10W-30 Premium Engine Oil (1L)', qty: 1, reserved_qty: 1, issued_qty: 0, returned_qty: 0, unit_price: 395, status: 'RESERVED', bin_id: 'BIN-PUN-B01' },
      { item_id: 'ITEM-2W-004', item_code: '2W-FLT-AIR-01', item_name: 'Foam Air Filter Element - Activa 6G', qty: 1, reserved_qty: 1, issued_qty: 0, returned_qty: 0, unit_price: 165, status: 'RESERVED', bin_id: 'BIN-PUN-A02' },
      { item_id: 'ITEM-2W-006', item_code: '2W-ELC-SPK-01', item_name: 'NGK Resistor Spark Plug CPR8EA-9', qty: 1, reserved_qty: 0, issued_qty: 0, returned_qty: 0, unit_price: 175, status: 'PENDING', bin_id: 'BIN-PUN-A03' }
    ],
    created_at: '2026-09-22T09:30:00Z'
  },
  {
    id: 'JC-2026-002',
    job_card_no: 'JC-PUN-26-002',
    date: '2026-09-22',
    customer_name: 'Amit Deshmukh',
    customer_mobile: '9822445566',
    vehicle_reg_no: 'MH-14-EF-5678',
    vehicle_manufacturer: 'TVS',
    vehicle_model_id: 'MOD-04',
    vehicle_model: 'TVS Jupiter 125',
    vehicle_variant: 'Disc SmartXonnect',
    vehicle_year: 2024,
    odometer_km: 8200,
    technician_id: 'USR-004',
    technician_name: 'Santosh Shinde',
    store_id: 'WH-PUN-SPARE',
    service_type: 'Paid Service & Front Disc Brake Inspection',
    status: 'PARTS_ISSUED',
    diagnosis: 'Front disc brake squeal under hard braking, routine oil replacement',
    parts_required: [
      { item_id: 'ITEM-2W-001', item_code: '2W-BRK-PAD-01', item_name: 'Front Brake Pad Set (Disc) - Activa / Jupiter', qty: 1, reserved_qty: 0, issued_qty: 1, returned_qty: 0, unit_price: 380, status: 'ISSUED', bin_id: 'BIN-PUN-A01' },
      { item_id: 'ITEM-2W-003', item_code: '2W-LUB-10W30-01', item_name: '4T 10W-30 Premium Engine Oil (1L)', qty: 1, reserved_qty: 0, issued_qty: 1, returned_qty: 0, unit_price: 395, status: 'ISSUED', bin_id: 'BIN-PUN-B01' }
    ],
    created_at: '2026-09-22T10:15:00Z'
  },
  {
    id: 'JC-2026-003',
    job_card_no: 'JC-PUN-26-003',
    date: '2026-09-22',
    customer_name: 'Sunil Joshi',
    customer_mobile: '9822778899',
    vehicle_reg_no: 'MH-12-PQ-9012',
    vehicle_manufacturer: 'Bajaj',
    vehicle_model_id: 'MOD-08',
    vehicle_model: 'Bajaj Pulsar 150',
    vehicle_variant: 'Twin Disc BS6',
    vehicle_year: 2022,
    odometer_km: 26800,
    technician_id: 'USR-004',
    technician_name: 'Santosh Shinde',
    store_id: 'WH-PUN-SPARE',
    service_type: 'Transmission & Clutch Rebuild',
    status: 'OPEN_DIAGNOSIS',
    diagnosis: 'Clutch slipping on acceleration, excessive chain slack and sprocket tooth wear',
    parts_required: [
      { item_id: 'ITEM-2W-009', item_code: '2W-TRN-CLT-01', item_name: 'Wet Multi-Plate Clutch Friction Plate Set', qty: 1, reserved_qty: 0, issued_qty: 0, returned_qty: 0, unit_price: 550, status: 'PENDING', bin_id: 'BIN-PUN-A01' },
      { item_id: 'ITEM-2W-010', item_code: '2W-TRN-CHN-01', item_name: 'Heavy Duty Brass Drive Chain & Sprocket Kit', qty: 1, reserved_qty: 0, issued_qty: 0, returned_qty: 0, unit_price: 1150, status: 'PENDING', bin_id: 'BIN-PUN-A01' }
    ],
    created_at: '2026-09-22T11:00:00Z'
  }
];

// 11. Warranty Claims (BRD Section 6.16)
const warrantyClaims = [
  {
    id: 'WAR-001',
    claim_no: 'CLM-HONDA-26-091',
    job_card_id: 'JC-2026-001',
    vehicle_reg_no: 'MH-12-AB-1234',
    customer_name: 'Ramesh Patil',
    store_id: 'WH-PUN-WARR',
    oem_manufacturer: 'Honda Motorcycle & Scooter India (HMSI)',
    item_id: 'ITEM-2W-014',
    item_name: 'Defective Brake Pad (Lining Delamination)',
    batch_no: 'LOT-WARR-2601',
    qty: 1,
    claim_amount: 380,
    defect_reason: 'Premature lining friction material separation under 2,000 km',
    claim_date: '2026-09-18',
    status: 'APPROVED',
    resolution: 'OEM Credit Note Issued (CN-HMSI-4491)',
    settlement_date: '2026-09-21'
  },
  {
    id: 'WAR-002',
    claim_no: 'CLM-EXIDE-26-042',
    job_card_id: 'JC-2026-002',
    vehicle_reg_no: 'MH-14-EF-5678',
    customer_name: 'Amit Deshmukh',
    store_id: 'WH-PUN-WARR',
    oem_manufacturer: 'Exide Industries Ltd.',
    item_id: 'ITEM-2W-007',
    item_name: 'VRLA Battery 12V 5Ah',
    batch_no: 'LOT-BAT-2603',
    qty: 1,
    claim_amount: 1350,
    defect_reason: 'Dead cell open circuit within 6 months warranty period',
    claim_date: '2026-09-20',
    status: 'PENDING_INSPECTION',
    resolution: 'Awaiting OEM technical inspection visit',
    settlement_date: null
  }
];

// 12. Scrap Disposals (BRD Section 6.17)
const scrapDisposals = [
  {
    id: 'SCRAP-001',
    disposal_no: 'SCRAP-PUN-26-018',
    store_id: 'WH-PUN-SCRAP',
    scrap_type: 'Worn Brake Drums, Damaged Alloy Rims & Bent Fork Tubes',
    item_id: 'ITEM-2W-015',
    category: 'Scrap Parts',
    qty_kg: 56.5,
    valuation_amount: 1412.50,
    reason: 'Unusable workshop replacement salvage metals',
    authorized_by: 'Branch Manager (Pravin Patil)',
    disposal_method: 'Authorized Scrap Recycler Sale',
    buyer_name: 'Mahalaxmi Metal & Alloy Recyclers',
    gate_pass_no: 'GP-SCRAP-8821',
    disposal_date: '2026-09-16',
    status: 'DISPOSED'
  },
  {
    id: 'SCRAP-002',
    disposal_no: 'SCRAP-PUN-26-019',
    store_id: 'WH-PUN-SCRAP',
    scrap_type: 'Damaged V-Belts, Degraded Rubber Gaskets & Oil Seals',
    item_id: 'ITEM-2W-015',
    category: 'Rubber Parts Scrap',
    qty_kg: 18.0,
    valuation_amount: 270.00,
    reason: 'Perished and worn out rubber parts',
    authorized_by: 'Store Manager (Rajesh Sharma)',
    disposal_method: 'Safe Eco-Incineration & Shredding',
    buyer_name: 'EcoClean Waste Management Services',
    gate_pass_no: 'GP-SCRAP-8835',
    disposal_date: '2026-09-22',
    status: 'PENDING_APPROVAL'
  }
];

// 13. Stock Count Sessions (BRD Section 6.20)
const stockCountSessions = [
  {
    id: 'CNT-2026-001',
    session_no: 'PHY-CNT-PUN-26-09',
    store_id: 'WH-PUN-SPARE',
    store_name: 'Spare Parts Sub Store',
    freeze_timestamp: '2026-09-20T18:00:00Z',
    status: 'FINALIZED',
    auditor: 'Rajesh Sharma',
    items: [
      { item_id: 'ITEM-2W-001', item_name: 'Front Brake Pad Set (Disc)', system_qty: 45, physical_qty: 43, variance: -2, unit_cost: 280, variance_value: -560, status: 'ADJUSTED', reason: 'Physical Shortage / Misplaced' },
      { item_id: 'ITEM-2W-002', item_name: 'Rear Brake Shoe Set', system_qty: 60, physical_qty: 62, variance: 2, unit_cost: 180, variance_value: 360, status: 'ADJUSTED', reason: 'Excess Found / Previous Count Correction' },
      { item_id: 'ITEM-2W-004', item_name: 'Foam Air Filter Element', system_qty: 30, physical_qty: 30, variance: 0, unit_cost: 95, variance_value: 0, status: 'MATCHED', reason: 'Exact Match' }
    ],
    adjustment_posted: true,
    adjustment_id: 'ADJ-2026-001'
  }
];

// Now perform the replacements in content
// A) In warehouses: add twoWheelerStores before the closing bracket of warehouses: [
const whMarker = '  warehouses: [';
const whEndMarker = '  ],\n\n  zones: [';
const whInsertPos = content.indexOf(whEndMarker);
if (whInsertPos !== -1 && !content.includes('WH-PUN-MAIN')) {
  const storeStr = ',\n' + twoWheelerStores.map(s => '    ' + JSON.stringify(s, null, 2).replace(/\n/g, '\n    ')).join(',\n');
  content = content.slice(0, whInsertPos) + storeStr + content.slice(whInsertPos);
  console.log('Appended twoWheelerStores into warehouses');
}

// B) In zones: add twoWheelerZones
const zonesEndMarker = '  ],\n\n  racks: [';
const zonesInsertPos = content.indexOf(zonesEndMarker);
if (zonesInsertPos !== -1 && !content.includes('ZONE-2W-A')) {
  const zonesStr = ',\n' + twoWheelerZones.map(z => '    ' + JSON.stringify(z)).join(',\n');
  content = content.slice(0, zonesInsertPos) + zonesStr + content.slice(zonesInsertPos);
  console.log('Appended twoWheelerZones into zones');
}

// C) In racks: add twoWheelerRacks
const racksEndMarker = '  ],\n\n  shelves: [';
const racksInsertPos = content.indexOf(racksEndMarker);
if (racksInsertPos !== -1 && !content.includes('RCK-2W-01')) {
  const racksStr = ',\n' + twoWheelerRacks.map(r => '    ' + JSON.stringify(r)).join(',\n');
  content = content.slice(0, racksInsertPos) + racksStr + content.slice(racksInsertPos);
  console.log('Appended twoWheelerRacks into racks');
}

// D) In shelves: add twoWheelerShelves
const shelvesEndMarker = '  ],\n\n  bins: [';
const shelvesInsertPos = content.indexOf(shelvesEndMarker);
if (shelvesInsertPos !== -1 && !content.includes('SHF-2W-01')) {
  const shelvesStr = ',\n' + twoWheelerShelves.map(s => '    ' + JSON.stringify(s)).join(',\n');
  content = content.slice(0, shelvesInsertPos) + shelvesStr + content.slice(shelvesInsertPos);
  console.log('Appended twoWheelerShelves into shelves');
}

// E) In bins: add twoWheelerBins
const binsEndMarker = '  ],\n\n  // 2. Item Master (SKUs)';
const binsInsertPos = content.indexOf(binsEndMarker);
if (binsInsertPos !== -1 && !content.includes('BIN-PUN-A01')) {
  const binsStr = ',\n' + twoWheelerBins.map(b => '    ' + JSON.stringify(b)).join(',\n');
  content = content.slice(0, binsInsertPos) + binsStr + content.slice(binsInsertPos);
  console.log('Appended twoWheelerBins into bins');
}

// F) In itemCategories: append the 20 standard BRD categories
const catEndMarker = '  ],\n\n  items: [';
const catInsertPos = content.indexOf(catEndMarker);
if (catInsertPos !== -1 && !content.includes('CAT-BRK')) {
  const catStr = ',\n' + brdCategories.map(c => '    ' + JSON.stringify(c)).join(',\n');
  content = content.slice(0, catInsertPos) + catStr + content.slice(catInsertPos);
  console.log('Appended brdCategories into itemCategories');
}

// G) In items: add twoWheelerItems
const itemsEndMarker = '  ],\n\n  suppliers: [';
const itemsInsertPos = content.indexOf(itemsEndMarker);
if (itemsInsertPos !== -1 && !content.includes('ITEM-2W-001')) {
  const itemsStr = ',\n' + twoWheelerItems.map(it => '    ' + JSON.stringify(it, null, 2).replace(/\n/g, '\n    ')).join(',\n');
  content = content.slice(0, itemsInsertPos) + itemsStr + content.slice(itemsInsertPos);
  console.log('Appended twoWheelerItems into items');
}

// H) In inventoryBalances: add twoWheelerBalances
const balEndMarker = '  ],\n\n  requisitions: [';
const balInsertPos = content.indexOf(balEndMarker);
if (balInsertPos !== -1 && !content.includes('BAL-2W-001')) {
  const balStr = ',\n' + twoWheelerBalances.map(b => '    ' + JSON.stringify(b, null, 2).replace(/\n/g, '\n    ')).join(',\n');
  content = content.slice(0, balInsertPos) + balStr + content.slice(balInsertPos);
  console.log('Appended twoWheelerBalances into inventoryBalances');
}

// I) At the end of INITIAL_DATA (before `};\n\nif (typeof window !== 'undefined')`):
// Add all new collections: itemSubcategories, storeTypes, storeTransactionConfigs, vehicleManufacturers,
// vehicleModels, itemVehicleCompatibility, storeItemMappings, inventoryRules, jobCards, warrantyClaims,
// scrapDisposals, stockCountSessions
const endOfInitialDataMarker = '    }\n  ]\n};';
const endPos = content.lastIndexOf(endOfInitialDataMarker);
if (endPos !== -1 && !content.includes('storeTransactionConfigs:')) {
  const extraCollectionsStr = `    }
  ],

  // 14. Item Subcategories (BRD Section 6.7)
  itemSubcategories: ${JSON.stringify(itemSubcategories, null, 2).replace(/\n/g, '\n  ')},

  // 15. Store Types Master (BRD Section 6.2)
  storeTypes: ${JSON.stringify(storeTypes, null, 2).replace(/\n/g, '\n  ')},

  // 16. Store Transaction Configuration (22 booleans per store - BRD Section 6.4)
  storeTransactionConfigs: ${JSON.stringify(storeTransactionConfigs, null, 2).replace(/\n/g, '\n  ')},

  // 17. Vehicle Manufacturers & Models (BRD Section 6.9)
  vehicleManufacturers: ${JSON.stringify(vehicleManufacturers, null, 2).replace(/\n/g, '\n  ')},
  vehicleModels: ${JSON.stringify(vehicleModels, null, 2).replace(/\n/g, '\n  ')},

  // 18. Item-Vehicle Compatibility Master (BRD Section 6.9 & Section 23)
  itemVehicleCompatibility: ${JSON.stringify(itemVehicleCompatibility, null, 2).replace(/\n/g, '\n  ')},

  // 19. Store Item Mappings (BRD Section 6.8 & 13)
  storeItemMappings: ${JSON.stringify(storeItemMappings, null, 2).replace(/\n/g, '\n  ')},

  // 20. Configurable Inventory Rules (BRD Section 6.11)
  inventoryRules: ${JSON.stringify(inventoryRules, null, 2).replace(/\n/g, '\n  ')},

  // 21. Job Cards Workflow (BRD Section 6.12 - 6.15 & Section 7.3)
  jobCards: ${JSON.stringify(jobCards, null, 2).replace(/\n/g, '\n  ')},

  // 22. Warranty Claims (BRD Section 6.16)
  warrantyClaims: ${JSON.stringify(warrantyClaims, null, 2).replace(/\n/g, '\n  ')},

  // 23. Scrap Disposals (BRD Section 6.17)
  scrapDisposals: ${JSON.stringify(scrapDisposals, null, 2).replace(/\n/g, '\n  ')},

  // 24. Physical Stock Count Sessions (BRD Section 6.20)
  stockCountSessions: ${JSON.stringify(stockCountSessions, null, 2).replace(/\n/g, '\n  ')}
};`;

  content = content.slice(0, endPos) + extraCollectionsStr + content.slice(endPos + endOfInitialDataMarker.length);
  console.log('Appended all new BRD collections to INITIAL_DATA');
}

fs.writeFileSync(mockDataPath, content, 'utf8');
console.log('Successfully written enriched mock-data.js, new length:', content.length);
