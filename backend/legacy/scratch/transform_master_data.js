const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, '../js/data/mock-data.js');
const rawMock = require(mockDataPath);
const d = rawMock.INITIAL_DATA;
const locMaster = rawMock.INDIAN_LOCATION_MASTER;

console.log('Original items count:', d.items.length);
console.log('Original categories count:', d.itemCategories.length);
console.log('Original warehouses count:', d.warehouses.length);

// 1. Two-Wheeler Warehouses
const twoWWarehouses = d.warehouses.filter(w => !['WH-PUN-RMS', 'WH-PUN-WIP', 'WH-PUN-FGH', 'WH-PUN-QAR', 'WH-CHE-RMS'].includes(w.id));

// 2. Two-Wheeler Zones
const twoWZones = [
  { id: 'ZONE-2W-M1', warehouse_id: 'WH-PUN-MAIN', code: 'LOC-2W-M1', name: 'Zone M1 - Central Spare Inventory Staging', location_type: 'HIGH_DENSITY_RACK', status: 'Active' },
  { id: 'ZONE-2W-A', warehouse_id: 'WH-PUN-SPARE', code: 'LOC-2W-A', name: 'Zone A - Fast Moving Service Parts & Brake Wearables', location_type: 'HIGH_DENSITY_RACK', status: 'Active' },
  { id: 'ZONE-2W-B', warehouse_id: 'WH-PUN-LUB', code: 'LOC-2W-B', name: 'Zone B - Engine Oils & Workshop Fluids', location_type: 'BULK_STORAGE', status: 'Active' },
  { id: 'ZONE-2W-C', warehouse_id: 'WH-PUN-BAT', code: 'LOC-2W-C', name: 'Zone C - Battery Staging & Trickle Charge Rack', location_type: 'SHELF_STORAGE', status: 'Active' },
  { id: 'ZONE-2W-D', warehouse_id: 'WH-PUN-TYRE', code: 'LOC-2W-D', name: 'Zone D - Tyre & Tube Vertical Racks', location_type: 'BULK_STORAGE', status: 'Active' },
  { id: 'ZONE-2W-W', warehouse_id: 'WH-PUN-WARR', code: 'LOC-2W-W', name: 'Zone W - OEM Warranty Hold & Inspection', location_type: 'QUARANTINE_HOLD', status: 'Active' },
  { id: 'ZONE-2W-S', warehouse_id: 'WH-PUN-SCRAP', code: 'LOC-2W-S', name: 'Zone S - Salvage Scrap & Metal Bins', location_type: 'BULK_STORAGE', status: 'Active' },
  { id: 'ZONE-2W-K1', warehouse_id: 'WH-PUN-WRK', code: 'LOC-2W-K1', name: 'Zone K1 - Workshop Bay Quick Issue Staging', location_type: 'SHELF_STORAGE', status: 'Active' }
];

// 3. Two-Wheeler Racks
const twoWRacks = [
  { id: 'RCK-2W-M01', warehouse_id: 'WH-PUN-MAIN', storage_location_id: 'ZONE-2W-M1', code: 'R-2W-M01', name: 'Main Store High-Density Rack M1', rack_type: 'High-Bay Pallet', max_weight_capacity_kg: 5000, total_shelves: 4, status: 'Active' },
  { id: 'RCK-2W-01', warehouse_id: 'WH-PUN-SPARE', storage_location_id: 'ZONE-2W-A', code: 'R-2W-01', name: 'Brake & Electrical Multi-tier Rack', rack_type: 'Modular Shelf', max_weight_capacity_kg: 2000, total_shelves: 3, status: 'Active' },
  { id: 'RCK-2W-02', warehouse_id: 'WH-PUN-LUB', storage_location_id: 'ZONE-2W-B', code: 'R-2W-02', name: 'Oil Bottle & Fluid Dispensing Rack', rack_type: 'Heavy Duty Bulk', max_weight_capacity_kg: 3500, total_shelves: 2, status: 'Active' },
  { id: 'RCK-2W-03', warehouse_id: 'WH-PUN-WARR', storage_location_id: 'ZONE-2W-W', code: 'R-2W-03', name: 'Warranty Claim Staging Rack', rack_type: 'Secure Lockable', max_weight_capacity_kg: 1000, total_shelves: 2, status: 'Active' },
  { id: 'RCK-2W-04', warehouse_id: 'WH-PUN-BAT', storage_location_id: 'ZONE-2W-C', code: 'R-2W-04', name: 'Battery Trickle Charging Rack', rack_type: 'Ventilated Shelf', max_weight_capacity_kg: 1500, total_shelves: 3, status: 'Active' },
  { id: 'RCK-2W-05', warehouse_id: 'WH-PUN-TYRE', storage_location_id: 'ZONE-2W-D', code: 'R-2W-05', name: 'Tyre Vertical Stacking Bay Rack', rack_type: 'Tyre Cradle', max_weight_capacity_kg: 2500, total_shelves: 3, status: 'Active' }
];

// 4. Two-Wheeler Shelves
const twoWShelves = [
  { id: 'SHF-2W-M01', rack_id: 'RCK-2W-M01', code: 'S-2W-M01', name: 'Level 1 - Fast Moving Spares Bulk', shelf_level: 1, max_weight_capacity_kg: 1500, status: 'Active' },
  { id: 'SHF-2W-01', rack_id: 'RCK-2W-01', code: 'S-2W-01', name: 'Tier 1 - Brake Pads & Shoes', shelf_level: 1, max_weight_capacity_kg: 600, status: 'Active' },
  { id: 'SHF-2W-02', rack_id: 'RCK-2W-01', code: 'S-2W-02', name: 'Tier 2 - Spark Plugs & Filters', shelf_level: 2, max_weight_capacity_kg: 500, status: 'Active' },
  { id: 'SHF-2W-03', rack_id: 'RCK-2W-02', code: 'S-2W-03', name: 'Tier 1 - 10W-30 Bottles & Cans', shelf_level: 1, max_weight_capacity_kg: 1200, status: 'Active' },
  { id: 'SHF-2W-04', rack_id: 'RCK-2W-04', code: 'S-2W-04', name: 'Tier 1 - 12V 5Ah VRLA Batteries', shelf_level: 1, max_weight_capacity_kg: 500, status: 'Active' },
  { id: 'SHF-2W-05', rack_id: 'RCK-2W-05', code: 'S-2W-05', name: 'Tier 1 - Scooter 90/90-12 Tyres', shelf_level: 1, max_weight_capacity_kg: 800, status: 'Active' }
];

// 5. Two-Wheeler Bins
const twoWBins = [
  { id: 'BIN-PUN-M01', warehouse_id: 'WH-PUN-MAIN', zone_id: 'ZONE-2W-M1', rack_id: 'RCK-2W-M01', shelf_id: 'SHF-2W-M01', rack: 'R-2W-M01', shelf: 'S-2W-M01', bin: 'B-01', code: 'BIN-2W-M01', max_weight: 500, max_vol: 3.0, occupied_pct: 60, status: 'normal' },
  { id: 'BIN-PUN-A01', warehouse_id: 'WH-PUN-SPARE', zone_id: 'ZONE-2W-A', rack_id: 'RCK-2W-01', shelf_id: 'SHF-2W-01', rack: 'R-2W-01', shelf: 'S-2W-01', bin: 'B-01', code: 'BIN-2W-A01', max_weight: 200, max_vol: 1.5, occupied_pct: 65, status: 'normal' },
  { id: 'BIN-PUN-A02', warehouse_id: 'WH-PUN-SPARE', zone_id: 'ZONE-2W-A', rack_id: 'RCK-2W-01', shelf_id: 'SHF-2W-02', rack: 'R-2W-01', shelf: 'S-2W-02', bin: 'B-01', code: 'BIN-2W-A02', max_weight: 150, max_vol: 1.2, occupied_pct: 40, status: 'normal' },
  { id: 'BIN-PUN-A03', warehouse_id: 'WH-PUN-SPARE', zone_id: 'ZONE-2W-A', rack_id: 'RCK-2W-01', shelf_id: 'SHF-2W-02', rack: 'R-2W-01', shelf: 'S-2W-02', bin: 'B-02', code: 'BIN-2W-A03', max_weight: 150, max_vol: 1, occupied_pct: 35, status: 'normal' },
  { id: 'BIN-PUN-B01', warehouse_id: 'WH-PUN-LUB', zone_id: 'ZONE-2W-B', rack_id: 'RCK-2W-02', shelf_id: 'SHF-2W-03', rack: 'R-2W-02', shelf: 'S-2W-03', bin: 'B-01', code: 'BIN-2W-B01', max_weight: 500, max_vol: 2.5, occupied_pct: 78, status: 'high' },
  { id: 'BIN-PUN-C01', warehouse_id: 'WH-PUN-BAT', zone_id: 'ZONE-2W-C', rack_id: 'RCK-2W-04', shelf_id: 'SHF-2W-04', rack: 'R-2W-04', shelf: 'S-2W-04', bin: 'B-01', code: 'BIN-2W-C01', max_weight: 400, max_vol: 2.0, occupied_pct: 45, status: 'normal' },
  { id: 'BIN-PUN-D01', warehouse_id: 'WH-PUN-TYRE', zone_id: 'ZONE-2W-D', rack_id: 'RCK-2W-05', shelf_id: 'SHF-2W-05', rack: 'R-2W-05', shelf: 'S-2W-05', bin: 'B-01', code: 'BIN-2W-D01', max_weight: 600, max_vol: 3.5, occupied_pct: 55, status: 'normal' },
  { id: 'BIN-PUN-W01', warehouse_id: 'WH-PUN-WARR', zone_id: 'ZONE-2W-W', rack_id: 'RCK-2W-03', shelf_id: 'SHF-2W-03', rack: 'R-2W-03', shelf: 'S-2W-03', bin: 'B-01', code: 'BIN-2W-W01', max_weight: 300, max_vol: 1.8, occupied_pct: 20, status: 'quarantine' },
  { id: 'BIN-PUN-S01', warehouse_id: 'WH-PUN-SCRAP', zone_id: 'ZONE-2W-S', rack_id: 'RCK-2W-03', shelf_id: 'SHF-2W-03', rack: 'R-2W-03', shelf: 'S-2W-03', bin: 'B-02', code: 'BIN-2W-S01', max_weight: 800, max_vol: 4.0, occupied_pct: 35, status: 'normal' }
];

// 6. Two-Wheeler Categories (Only the 20 2W categories, removing CAT-01..CAT-07)
const twoWCategories = d.itemCategories.filter(c => !c.id.startsWith('CAT-0'));

// 7. Two-Wheeler Items (15 existing + 14 additional comprehensive 2W items)
const existing2WItems = d.items.filter(i => i.code.startsWith('2W-') || i.id.includes('2W'));

const additional2WItems = [
  {
    id: "ITEM-2W-016",
    code: "2W-ENG-PST-01",
    name: "Piston & Ring Assembly Std 50mm - Activa 6G / Dio",
    category_id: "CAT-ENG",
    subcategory_id: "SUB-ENG-01",
    item_type: "SPARE_PART",
    base_uom: "SET",
    valuation_method: "FIFO",
    standard_cost: 650,
    last_purchase_price: 650,
    sale_price: 950,
    min_stock: 4,
    max_stock: 25,
    reorder_level: 8,
    safety_stock: 3,
    lead_time_days: 3,
    moq: 4,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "84099199"
  },
  {
    id: "ITEM-2W-017",
    code: "2W-ENG-GSK-01",
    name: "Cylinder Head & Crankcase Complete Gasket Kit",
    category_id: "CAT-ENG",
    subcategory_id: "SUB-ENG-02",
    item_type: "SPARE_PART",
    base_uom: "SET",
    valuation_method: "FIFO",
    standard_cost: 160,
    last_purchase_price: 160,
    sale_price: 260,
    min_stock: 8,
    max_stock: 50,
    reorder_level: 15,
    safety_stock: 6,
    lead_time_days: 2,
    moq: 8,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "84841090"
  },
  {
    id: "ITEM-2W-018",
    code: "2W-SUS-SHK-01",
    name: "Rear Hydraulic Shock Absorber Assembly (Step-Adjustable)",
    category_id: "CAT-SUSP",
    subcategory_id: "SUB-SUS-01",
    item_type: "SPARE_PART",
    base_uom: "NOS",
    valuation_method: "FIFO",
    standard_cost: 850,
    last_purchase_price: 850,
    sale_price: 1250,
    min_stock: 4,
    max_stock: 30,
    reorder_level: 8,
    safety_stock: 4,
    lead_time_days: 4,
    moq: 4,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "87141090"
  },
  {
    id: "ITEM-2W-019",
    code: "2W-STR-BRG-01",
    name: "Steering Race & Cone Ball Bearing Set",
    category_id: "CAT-STR",
    subcategory_id: "SUB-STR-01",
    item_type: "SPARE_PART",
    base_uom: "SET",
    valuation_method: "FIFO",
    standard_cost: 210,
    last_purchase_price: 210,
    sale_price: 340,
    min_stock: 6,
    max_stock: 40,
    reorder_level: 12,
    safety_stock: 5,
    lead_time_days: 3,
    moq: 6,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "84821011"
  },
  {
    id: "ITEM-2W-020",
    code: "2W-CBL-ACL-01",
    name: "High-Flex Accelerator Throttle Cable - Activa / Jupiter",
    category_id: "CAT-CBL",
    subcategory_id: "SUB-CBL-01",
    item_type: "SPARE_PART",
    base_uom: "NOS",
    valuation_method: "FIFO",
    standard_cost: 120,
    last_purchase_price: 120,
    sale_price: 190,
    min_stock: 8,
    max_stock: 60,
    reorder_level: 16,
    safety_stock: 6,
    lead_time_days: 2,
    moq: 8,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "87141090"
  },
  {
    id: "ITEM-2W-021",
    code: "2W-CBL-CLT-01",
    name: "Heavy-Duty Inner Clutch Cable Assembly - Splendor Plus",
    category_id: "CAT-CBL",
    subcategory_id: "SUB-CBL-02",
    item_type: "SPARE_PART",
    base_uom: "NOS",
    valuation_method: "FIFO",
    standard_cost: 110,
    last_purchase_price: 110,
    sale_price: 175,
    min_stock: 10,
    max_stock: 60,
    reorder_level: 18,
    safety_stock: 8,
    lead_time_days: 2,
    moq: 10,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "87141090"
  },
  {
    id: "ITEM-2W-022",
    code: "2W-CSM-CHN-01",
    name: "High-Performance Synthetic Chain Lube Spray (500ml)",
    category_id: "CAT-CSM",
    subcategory_id: "SUB-CSM-01",
    item_type: "CONSUMABLE",
    base_uom: "CAN",
    valuation_method: "FIFO",
    standard_cost: 190,
    last_purchase_price: 190,
    sale_price: 290,
    min_stock: 12,
    max_stock: 80,
    reorder_level: 20,
    safety_stock: 10,
    lead_time_days: 2,
    moq: 12,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: true,
    shelf_life_days: 1095,
    hsn_code: "34031900"
  },
  {
    id: "ITEM-2W-023",
    code: "2W-CSM-CLN-01",
    name: "Fast-Drying Carburetor & Throttle Body Cleaner (400ml)",
    category_id: "CAT-CSM",
    subcategory_id: "SUB-CSM-02",
    item_type: "CONSUMABLE",
    base_uom: "CAN",
    valuation_method: "FIFO",
    standard_cost: 145,
    last_purchase_price: 145,
    sale_price: 230,
    min_stock: 10,
    max_stock: 60,
    reorder_level: 18,
    safety_stock: 8,
    lead_time_days: 2,
    moq: 10,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: true,
    shelf_life_days: 730,
    hsn_code: "34029099"
  },
  {
    id: "ITEM-2W-024",
    code: "2W-FST-KIT-01",
    name: "Two-Wheeler Zinc Flange Hex Bolt & Nut Assortment (150 Pcs)",
    category_id: "CAT-FST",
    subcategory_id: "SUB-FST-01",
    item_type: "CONSUMABLE",
    base_uom: "BOX",
    valuation_method: "FIFO",
    standard_cost: 320,
    last_purchase_price: 320,
    sale_price: 490,
    min_stock: 5,
    max_stock: 30,
    reorder_level: 10,
    safety_stock: 4,
    lead_time_days: 2,
    moq: 5,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "73181500"
  },
  {
    id: "ITEM-2W-025",
    code: "2W-RUB-DMP-01",
    name: "Rear Hub Wheel Cush Drive Rubber Damper Set (4 Pcs)",
    category_id: "CAT-RUB",
    subcategory_id: "SUB-RUB-01",
    item_type: "SPARE_PART",
    base_uom: "SET",
    valuation_method: "FIFO",
    standard_cost: 90,
    last_purchase_price: 90,
    sale_price: 150,
    min_stock: 10,
    max_stock: 70,
    reorder_level: 20,
    safety_stock: 8,
    lead_time_days: 2,
    moq: 10,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "40169990"
  },
  {
    id: "ITEM-2W-026",
    code: "2W-ACC-MIR-01",
    name: "Rear View Mirror Set (Left & Right - M10 Standard Thread)",
    category_id: "CAT-ACC",
    subcategory_id: "SUB-ACC-01",
    item_type: "ACCESSORY",
    base_uom: "PAIR",
    valuation_method: "FIFO",
    standard_cost: 175,
    last_purchase_price: 175,
    sale_price: 280,
    min_stock: 6,
    max_stock: 40,
    reorder_level: 12,
    safety_stock: 5,
    lead_time_days: 3,
    moq: 6,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "87141090"
  },
  {
    id: "ITEM-2W-027",
    code: "2W-TLS-SPK-01",
    name: "Magnetic Spark Plug Socket Tool 16mm (Workshop Grade)",
    category_id: "CAT-TLS",
    subcategory_id: "SUB-TLS-01",
    item_type: "TOOL",
    base_uom: "NOS",
    valuation_method: "STANDARD",
    standard_cost: 220,
    last_purchase_price: 220,
    sale_price: 350,
    min_stock: 2,
    max_stock: 15,
    reorder_level: 4,
    safety_stock: 2,
    lead_time_days: 5,
    moq: 2,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "82041100"
  },
  {
    id: "ITEM-2W-028",
    code: "2W-CLN-WSH-01",
    name: "Two-Wheeler pH-Neutral Foam Wash Shampoo (5L Can)",
    category_id: "CAT-CLN",
    subcategory_id: "SUB-CLN-01",
    item_type: "CONSUMABLE",
    base_uom: "CAN",
    valuation_method: "FIFO",
    standard_cost: 450,
    last_purchase_price: 450,
    sale_price: 680,
    min_stock: 3,
    max_stock: 20,
    reorder_level: 6,
    safety_stock: 3,
    lead_time_days: 2,
    moq: 3,
    is_batch_controlled: true,
    is_serial_controlled: false,
    has_expiry: true,
    shelf_life_days: 730,
    hsn_code: "34022090"
  },
  {
    id: "ITEM-2W-029",
    code: "2W-BDY-LVR-01",
    name: "Forged Alloy Front Brake & Clutch Lever Pair (Black Finish)",
    category_id: "CAT-BODY",
    subcategory_id: "SUB-BDY-01",
    item_type: "SPARE_PART",
    base_uom: "PAIR",
    valuation_method: "FIFO",
    standard_cost: 140,
    last_purchase_price: 140,
    sale_price: 230,
    min_stock: 8,
    max_stock: 50,
    reorder_level: 15,
    safety_stock: 6,
    lead_time_days: 3,
    moq: 8,
    is_batch_controlled: false,
    is_serial_controlled: false,
    has_expiry: false,
    hsn_code: "87141090"
  }
];

const itemsMap = new Map();
[...existing2WItems, ...additional2WItems].forEach(it => {
  if (!itemsMap.has(it.id)) itemsMap.set(it.id, it);
});
const twoWItems = Array.from(itemsMap.values());

// 8. Two-Wheeler Suppliers
const twoWSuppliers = [
  {
    id: 'SUP-001',
    code: 'ENDURANCE-TECH',
    name: 'Endurance Technologies Ltd.',
    category: 'BRAKES_SUSPENSION',
    contact: 'Rajesh Nair',
    email: 'sales@endurance.co.in',
    phone: '9822011456',
    city: 'Waluj, Aurangabad',
    rating: 4.9,
    payment_terms: 30,
    is_approved: true
  },
  {
    id: 'SUP-002',
    code: 'CASTROL-IND',
    name: 'Castrol India Ltd. - Automotive Spares',
    category: 'LUBRICANTS',
    contact: 'Sunita Deshmukh',
    email: 'orders@castrol.co.in',
    phone: '9823022567',
    city: 'Mumbai',
    rating: 4.8,
    payment_terms: 30,
    is_approved: true
  },
  {
    id: 'SUP-003',
    code: 'EXIDE-IND',
    name: 'Exide Industries Ltd. (Two-Wheeler Div)',
    category: 'BATTERIES',
    contact: 'Amit Sengupta',
    email: 'care@exide.co.in',
    phone: '9840133678',
    city: 'Pune',
    rating: 4.7,
    payment_terms: 45,
    is_approved: true
  },
  {
    id: 'SUP-004',
    code: 'NGK-SPARK',
    name: 'NGK Spark Plugs India Pvt Ltd.',
    category: 'ELECTRICALS',
    contact: 'Vikram Joshi',
    email: 'support@ngkindia.com',
    phone: '9822044789',
    city: 'Bawal, Haryana',
    rating: 4.9,
    payment_terms: 30,
    is_approved: true
  },
  {
    id: 'SUP-005',
    code: 'MRF-TYRES',
    name: 'MRF Tyres & Rubber Ltd.',
    category: 'TYRES_TUBES',
    contact: 'K. Ramanathan',
    email: 'dealers@mrfmail.com',
    phone: '9841055890',
    city: 'Chennai',
    rating: 4.8,
    payment_terms: 30,
    is_approved: true
  },
  {
    id: 'SUP-006',
    code: 'ROLON-LGB',
    name: 'L.G. Balakrishnan & Bros (Rolon Chains)',
    category: 'TRANSMISSION',
    contact: 'S. Chandrasekar',
    email: 'rolon@lgb.co.in',
    phone: '9842266901',
    city: 'Coimbatore',
    rating: 4.8,
    payment_terms: 30,
    is_approved: true
  },
  {
    id: 'SUP-007',
    code: 'BOSCH-2W',
    name: 'Bosch Automotive Aftermarket India',
    category: 'OEM_COMPONENTS',
    contact: 'Arun Kulkarni',
    email: 'aftermarket@in.bosch.com',
    phone: '9822077012',
    city: 'Bengaluru',
    rating: 4.9,
    payment_terms: 45,
    is_approved: true
  }
];

// 9. Two-Wheeler Customers
const twoWCustomers = [
  {
    id: 'CUST-001',
    code: 'RETAIL-WALKIN',
    name: 'Patil Auto Retail & Walk-in Workshop Clients',
    category: 'RETAIL_WORKSHOP',
    contact: 'Santosh Shinde (Bay Supervisor)',
    email: 'service@patilauto.com',
    phone: '9822011234',
    city: 'Pune',
    credit_limit: 500000,
    payment_terms: 0
  },
  {
    id: 'CUST-002',
    code: 'QUICKRIDE-FLEET',
    name: 'QuickRide Two-Wheeler Mobility Fleet Pvt Ltd.',
    category: 'FLEET_OPERATOR',
    contact: 'Mahesh Vernekar',
    email: 'fleet@quickride.in',
    phone: '9822088334',
    city: 'Pune',
    credit_limit: 2500000,
    payment_terms: 30
  },
  {
    id: 'CUST-003',
    code: 'DELIVERY-EXPRESS',
    name: 'Delivery Express 2-Wheeler Fleet Network',
    category: 'DELIVERY_FLEET',
    contact: 'Pooja Agarwal',
    email: 'ops@deliveryexpress.in',
    phone: '9822099445',
    city: 'Pimpri-Chinchwad',
    credit_limit: 1500000,
    payment_terms: 15
  },
  {
    id: 'CUST-004',
    code: 'APEX-WAKAD-DESK',
    name: 'Apex Two-Wheeler Wakad Branch Quick-Desk',
    category: 'INTERNAL_BRANCH',
    contact: 'Rajesh K. Sharma',
    email: 'support@apex2w.in',
    phone: '9833022345',
    city: 'Pimpri-Chinchwad',
    credit_limit: 1000000,
    payment_terms: 30
  }
];

// 10. Two-Wheeler Bills of Materials
const twoWBOMs = [
  {
    id: 'BOM-2W-001',
    bom_number: 'BOM-2W-SRV-KIT-01',
    item_id: 'ITEM-2W-003',
    version: '1.0',
    description: 'Periodic General Service Kit (Activa 6G / Dio / Jupiter)',
    base_qty: 1,
    components: [
      { item_id: 'ITEM-2W-003', qty: 1, uom: 'BTL', scrap_pct: 0.0, remarks: '4T 10W-30 Premium Engine Oil 1L' },
      { item_id: 'ITEM-2W-004', qty: 1, uom: 'NOS', scrap_pct: 0.0, remarks: 'Foam Air Filter Element' },
      { item_id: 'ITEM-2W-006', qty: 1, uom: 'NOS', scrap_pct: 0.0, remarks: 'NGK Resistor Spark Plug CPR8EA-9' },
      { item_id: 'ITEM-2W-023', qty: 0.25, uom: 'CAN', scrap_pct: 0.0, remarks: 'Carburetor & Throttle Cleaner Dose' }
    ]
  },
  {
    id: 'BOM-2W-002',
    bom_number: 'BOM-2W-BRK-CHN-01',
    item_id: 'ITEM-2W-010',
    version: '1.0',
    description: 'Complete Brake & Drive Overhaul Kit (Splendor Plus / Passion)',
    base_qty: 1,
    components: [
      { item_id: 'ITEM-2W-001', qty: 1, uom: 'SET', scrap_pct: 0.0, remarks: 'Front Disc Brake Pad Set' },
      { item_id: 'ITEM-2W-002', qty: 1, uom: 'SET', scrap_pct: 0.0, remarks: 'Rear Brake Shoe Set' },
      { item_id: 'ITEM-2W-010', qty: 1, uom: 'SET', scrap_pct: 0.0, remarks: 'Heavy Duty Brass Drive Chain Kit' },
      { item_id: 'ITEM-2W-013', qty: 0.25, uom: 'BTL', scrap_pct: 0.0, remarks: 'DOT 4 Disc Brake Fluid 250ml' }
    ]
  }
];

// 11. Two-Wheeler Balances
const twoWBalances = [
  { id: 'BAL-2W-001', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-SPARE', bin_id: 'BIN-PUN-A01', item_id: 'ITEM-2W-001', batch_number: 'LOT-BRK-2601', serial_number: null, on_hand: 45, reserved: 5, available: 40, stock_status: 'AVAILABLE', valuation_rate: 280, mfg_date: '2026-08-10', expiry_date: null },
  { id: 'BAL-2W-002', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-SPARE', bin_id: 'BIN-PUN-A01', item_id: 'ITEM-2W-002', batch_number: 'LOT-SHO-2602', serial_number: null, on_hand: 60, reserved: 3, available: 57, stock_status: 'AVAILABLE', valuation_rate: 180, mfg_date: '2026-08-15', expiry_date: null },
  { id: 'BAL-2W-003', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-LUB', bin_id: 'BIN-PUN-B01', item_id: 'ITEM-2W-003', batch_number: 'LOT-OIL-2605', serial_number: null, on_hand: 120, reserved: 10, available: 110, stock_status: 'AVAILABLE', valuation_rate: 290, mfg_date: '2026-07-20', expiry_date: '2029-07-19' },
  { id: 'BAL-2W-004', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-SPARE', bin_id: 'BIN-PUN-A02', item_id: 'ITEM-2W-004', batch_number: 'LOT-FLT-2603', serial_number: null, on_hand: 30, reserved: 2, available: 28, stock_status: 'AVAILABLE', valuation_rate: 95, mfg_date: '2026-08-01', expiry_date: null },
  { id: 'BAL-2W-005', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-SPARE', bin_id: 'BIN-PUN-A03', item_id: 'ITEM-2W-006', batch_number: 'LOT-SPK-2601', serial_number: null, on_hand: 40, reserved: 4, available: 36, stock_status: 'AVAILABLE', valuation_rate: 110, mfg_date: '2026-06-01', expiry_date: null },
  { id: 'BAL-2W-006', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-BAT', bin_id: 'BIN-PUN-C01', item_id: 'ITEM-2W-007', batch_number: 'LOT-BAT-2601', serial_number: 'SN-BAT-7701', on_hand: 18, reserved: 2, available: 16, stock_status: 'AVAILABLE', valuation_rate: 950, mfg_date: '2026-08-05', expiry_date: '2028-08-05' },
  { id: 'BAL-2W-007', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-TYRE', bin_id: 'BIN-PUN-D01', item_id: 'ITEM-2W-008', batch_number: 'LOT-TYR-2601', serial_number: null, on_hand: 22, reserved: 2, available: 20, stock_status: 'AVAILABLE', valuation_rate: 1100, mfg_date: '2026-07-10', expiry_date: null },
  { id: 'BAL-2W-008', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-MAIN', bin_id: 'BIN-PUN-M01', item_id: 'ITEM-2W-010', batch_number: 'LOT-CHN-2601', serial_number: null, on_hand: 35, reserved: 5, available: 30, stock_status: 'AVAILABLE', valuation_rate: 750, mfg_date: '2026-07-15', expiry_date: null },
  { id: 'BAL-2W-009', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-MAIN', bin_id: 'BIN-PUN-M01', item_id: 'ITEM-2W-011', batch_number: 'LOT-BLT-2601', serial_number: null, on_hand: 40, reserved: 4, available: 36, stock_status: 'AVAILABLE', valuation_rate: 320, mfg_date: '2026-08-01', expiry_date: null },
  { id: 'BAL-2W-010', plant_id: 'PLANT-01', warehouse_id: 'WH-PUN-WARR', bin_id: 'BIN-PUN-W01', item_id: 'ITEM-2W-014', batch_number: 'LOT-WARR-2601', serial_number: null, on_hand: 4, reserved: 0, available: 4, stock_status: 'QUARANTINE', valuation_rate: 0, mfg_date: '2026-09-15', expiry_date: null }
];

// 12. Clean Transactions
const twoWRequisitions = [
  {
    id: 'PR-001',
    pr_number: 'PR-2026-001',
    plant_id: 'PLANT-01',
    department_id: 'DEPT-01',
    requested_by: 'Santosh Shinde',
    required_date: '2026-09-20',
    priority: 'HIGH',
    status: 'APPROVED',
    justification: 'Quarterly workshop replenishment for high-frequency brake pads & engine oil for service bay.',
    items: [
      { item_id: 'ITEM-2W-001', qty: 50, uom: 'SET', est_rate: 280, suggested_supplier: 'SUP-001' },
      { item_id: 'ITEM-2W-003', qty: 100, uom: 'BTL', est_rate: 290, suggested_supplier: 'SUP-002' }
    ],
    created_at: '2026-08-28T09:30:00Z',
    approved_by: 'Pravin Patil (System Admin)',
    approved_at: '2026-08-29T14:10:00Z'
  },
  {
    id: 'PR-002',
    pr_number: 'PR-2026-002',
    plant_id: 'PLANT-01',
    department_id: 'DEPT-01',
    requested_by: 'Suresh Nair',
    required_date: '2026-09-25',
    priority: 'URGENT',
    status: 'PENDING_APPROVAL',
    justification: 'Emergency top-up for 12V 5Ah VRLA Batteries due to festival service surge.',
    items: [
      { item_id: 'ITEM-2W-007', qty: 25, uom: 'NOS', est_rate: 950, suggested_supplier: 'SUP-003' }
    ],
    created_at: '2026-09-08T11:45:00Z'
  }
];

const twoWPurchaseOrders = [
  {
    id: 'PO-001',
    po_number: 'PO-2026-101',
    supplier_id: 'SUP-001',
    plant_id: 'PLANT-01',
    pr_id: 'PR-001',
    order_date: '2026-08-30',
    expected_delivery: '2026-09-12',
    payment_terms: 'Net 30 Days',
    incoterms: 'FOR Destination',
    subtotal: 14000.00,
    tax_amount: 2520.00,
    total_amount: 16520.00,
    status: 'APPROVED',
    approved_by: 'Pravin Patil',
    approved_at: '2026-08-31T10:00:00Z',
    items: [
      { item_id: 'ITEM-2W-001', ordered_qty: 50, received_qty: 50, uom: 'SET', unit_price: 280.00, tax_pct: 18, total: 16520.00 }
    ]
  },
  {
    id: 'PO-002',
    po_number: 'PO-2026-102',
    supplier_id: 'SUP-002',
    plant_id: 'PLANT-01',
    pr_id: 'PR-001',
    order_date: '2026-09-01',
    expected_delivery: '2026-09-15',
    payment_terms: 'Net 30 Days',
    incoterms: 'FOR Destination',
    subtotal: 29000.00,
    tax_amount: 5220.00,
    total_amount: 34220.00,
    status: 'APPROVED',
    approved_by: 'Pravin Patil',
    approved_at: '2026-09-01T15:30:00Z',
    items: [
      { item_id: 'ITEM-2W-003', ordered_qty: 100, received_qty: 100, uom: 'BTL', unit_price: 290.00, tax_pct: 18, total: 34220.00 }
    ]
  }
];

const twoWGoodsReceipts = [
  {
    id: 'GRN-001',
    grn_number: 'GRN-2026-501',
    po_id: 'PO-001',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-SPARE',
    supplier_id: 'SUP-001',
    challan_no: 'DC-ENDUR-9941',
    invoice_no: 'INV-ENDUR-8812',
    vehicle_no: 'MH-12-RN-8890',
    received_date: '2026-09-05T11:20:00Z',
    received_by: 'Santosh Shinde',
    inspection_status: 'INSPECTED',
    remarks: 'Full delivery received in sound condition. OEM brake pads batch verified.',
    items: [
      {
        item_id: 'ITEM-2W-001',
        received_qty: 50,
        accepted_qty: 50,
        rejected_qty: 0,
        quarantine_qty: 0,
        uom: 'SET',
        batch_number: 'LOT-BRK-2601',
        heat_number: null,
        mfg_date: '2026-08-10'
      }
    ]
  }
];

const twoWQualityInspections = [
  {
    id: 'QA-001',
    inspection_number: 'QA-2026-801',
    inspection_type: 'INCOMING',
    ref_doc_type: 'GRN',
    ref_doc_no: 'GRN-2026-501',
    item_id: 'ITEM-2W-001',
    batch_number: 'LOT-BRK-2601',
    lot_qty: 50,
    sample_size: 5,
    accepted_qty: 50,
    rejected_qty: 0,
    quarantine_qty: 0,
    status: 'ACCEPTED',
    inspector: 'Santosh Shinde',
    inspected_at: '2026-09-05T14:30:00Z',
    coa_number: 'COA-ENDUR-44109',
    tests: [
      { param: 'Friction Material Thickness', spec: '7.5 ± 0.2 mm', observed: '7.52 mm', result: 'PASS' },
      { param: 'Backing Plate Flatness', spec: '< 0.1 mm', observed: '0.04 mm', result: 'PASS' },
      { param: 'Bond Shear Strength', spec: '> 3.5 MPa', observed: '4.2 MPa', result: 'PASS' }
    ]
  },
  {
    id: 'QA-002',
    inspection_number: 'QA-2026-802',
    inspection_type: 'INCOMING',
    ref_doc_type: 'GRN',
    ref_doc_no: 'GRN-2026-490',
    item_id: 'ITEM-2W-014',
    batch_number: 'LOT-WARR-2601',
    lot_qty: 4,
    sample_size: 4,
    accepted_qty: 0,
    rejected_qty: 4,
    quarantine_qty: 4,
    status: 'REJECTED',
    inspector: 'Rajesh Sharma',
    inspected_at: '2026-09-15T11:00:00Z',
    defect_type: 'Delamination during service',
    defect_notes: 'Friction lining separation submitted for manufacturer warranty reimbursement.',
    tests: [
      { param: 'Lining Integrity', spec: 'Zero Cracks', observed: 'Edge separation detected', result: 'FAIL' }
    ]
  }
];

const twoWPutawayTasks = [
  {
    id: 'PUT-001',
    task_number: 'PUT-2026-01',
    inspection_id: 'QA-001',
    item_id: 'ITEM-2W-001',
    batch_number: 'LOT-BRK-2601',
    quantity: 50,
    source_dock: 'DOCK-1-RECEIVING',
    suggested_bin_id: 'BIN-PUN-A01',
    actual_bin_id: 'BIN-PUN-A01',
    status: 'COMPLETED',
    completed_by: 'Santosh Shinde',
    completed_at: '2026-09-05T16:00:00Z'
  }
];

const twoWProductionOrders = [
  {
    id: 'PRD-001',
    order_number: 'PRD-2026-901',
    plant_id: 'PLANT-01',
    item_id: 'ITEM-2W-003',
    bom_id: 'BOM-2W-001',
    target_qty: 20,
    completed_qty: 15,
    scrapped_qty: 0,
    planned_start: '2026-09-01',
    planned_end: '2026-09-15',
    actual_start: '2026-09-02T08:00:00Z',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    materials: [
      { item_id: 'ITEM-2W-003', required: 20, issued: 20, consumed: 15, uom: 'BTL' },
      { item_id: 'ITEM-2W-004', required: 20, issued: 20, consumed: 15, uom: 'NOS' },
      { item_id: 'ITEM-2W-006', required: 20, issued: 20, consumed: 15, uom: 'NOS' },
      { item_id: 'ITEM-2W-023', required: 5, issued: 5, consumed: 3.75, uom: 'CAN' }
    ]
  }
];

const twoWStockTransfers = [
  {
    id: 'TRF-001',
    transfer_number: 'TRF-2026-301',
    source_plant_id: 'PLANT-01',
    source_warehouse_id: 'WH-PUN-MAIN',
    dest_plant_id: 'PLANT-01',
    dest_warehouse_id: 'WH-PUN-SPARE',
    reason: 'Stock replenishment from Main Hub to Spare Parts Workshop Sub-Store.',
    status: 'IN_TRANSIT',
    transporter: 'Internal Store Runner',
    vehicle_no: 'MH-12-PA-101',
    dispatched_by: 'Rajesh Sharma',
    dispatched_at: '2026-09-08T06:30:00Z',
    items: [
      { item_id: 'ITEM-2W-001', batch_number: 'LOT-BRK-2601', requested: 20, dispatched: 20, received: 0, uom: 'SET' }
    ]
  }
];

const twoWSalesOrders = [
  {
    id: 'SO-001',
    so_number: 'SO-2026-401',
    customer_id: 'CUST-002',
    plant_id: 'PLANT-01',
    order_date: '2026-08-25',
    delivery_due_date: '2026-09-18',
    total_amount: 14750.00,
    status: 'DISPATCHED',
    items: [
      { item_id: 'ITEM-2W-001', ordered_qty: 25, unit_price: 420.00, total_price: 10500.00 },
      { item_id: 'ITEM-2W-004', ordered_qty: 25, unit_price: 170.00, total_price: 4250.00 }
    ]
  }
];

const twoWShipments = [
  {
    id: 'SHP-001',
    shipment_number: 'SHP-2026-701',
    so_id: 'SO-001',
    customer_id: 'CUST-002',
    transporter: 'Apex Quick Delivery Fleet',
    vehicle_no: 'MH-12-EF-4419',
    driver_name: 'Santosh Jadhav',
    driver_phone: '9823144552',
    gate_pass_no: 'GP-2026-9041',
    eway_bill_no: '241088921045',
    total_boxes: 3,
    total_weight_kg: 35.0,
    status: 'IN_TRANSIT',
    dispatched_at: '2026-09-09T14:30:00Z',
    items: [
      { item_id: 'ITEM-2W-001', batch_number: 'LOT-BRK-2601', qty: 25, boxes: 'BOX-01 to BOX-02' }
    ]
  }
];

const twoWReturnsLog = [
  {
    id: 'RET-001',
    return_number: 'RET-2026-01',
    return_type: 'PURCHASE_RETURN_VENDOR',
    ref_doc_no: 'QA-2026-802',
    entity_name: 'Endurance Technologies Ltd.',
    item_id: 'ITEM-2W-014',
    batch_number: 'LOT-WARR-2601',
    qty: 4,
    uom: 'SET',
    reason: 'Defective lining returned to OEM for credit note and warranty settlement.',
    disposition: 'VENDOR_REPLACEMENT',
    status: 'APPROVED',
    logged_by: 'Rajesh Sharma',
    created_at: '2026-09-16T10:00:00Z'
  }
];

const twoWStockCounts = [
  {
    id: 'CNT-001',
    plan_number: 'CNT-2026-01',
    count_type: 'CYCLE_COUNT',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-SPARE',
    scheduled_date: '2026-09-01',
    status: 'RECONCILED',
    items: [
      {
        bin_id: 'BIN-PUN-A01',
        item_id: 'ITEM-2W-001',
        batch_number: 'LOT-BRK-2601',
        system_qty: 45,
        counted_qty: 45,
        variance_qty: 0,
        variance_val: 0.00,
        reconciled: true,
        counter: 'Santosh Shinde'
      }
    ]
  }
];

const twoWStockAdjustments = [
  {
    id: 'ADJ-001',
    adjustment_number: 'ADJ-2026-01',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-SPARE',
    bin_id: 'BIN-PUN-A02',
    item_id: 'ITEM-2W-004',
    batch_number: 'LOT-FLT-2603',
    adjustment_type: 'INCREASE',
    qty: 2,
    reason: 'Physical count adjustment (Found unrecorded sealed pack during shelf audit).',
    approved_by: 'Rajesh Sharma',
    created_at: '2026-09-02T11:00:00Z'
  }
];

const twoWAuditLogs = [
  {
    id: 'AUD-001',
    timestamp: '2026-09-09T14:30:00Z',
    user: 'Pravin Patil',
    role: 'Supply Chain Manager',
    ip: '192.168.1.45',
    action: 'DISPATCH',
    module: 'LOGISTICS',
    record_id: 'SHP-2026-701',
    details: 'Gate Pass GP-2026-9041 issued for Two-Wheeler spare parts delivery to QuickRide Fleet.'
  },
  {
    id: 'AUD-002',
    timestamp: '2026-09-08T06:30:00Z',
    user: 'Rajesh Sharma',
    role: 'Store Manager',
    ip: '192.168.1.110',
    action: 'TRANSFER_DISPATCH',
    module: 'STOCK_TRANSFER',
    record_id: 'TRF-2026-301',
    details: 'Dispatched 20 sets Front Brake Pads from Main Hub to Spare Parts Sub-Store.'
  }
];

const twoWUserWarehouseAccess = [
  { user_id: 'USR-001', warehouse_id: 'WH-PUN-MAIN', access_type: 'FULL_CONTROL', is_default: true },
  { user_id: 'USR-001', warehouse_id: 'WH-PUN-SPARE', access_type: 'FULL_CONTROL', is_default: false },
  { user_id: 'USR-001', warehouse_id: 'WH-PUN-LUB', access_type: 'FULL_CONTROL', is_default: false },
  { user_id: 'USR-002', warehouse_id: 'WH-PUN-MAIN', access_type: 'FULL_CONTROL', is_default: true },
  { user_id: 'USR-002', warehouse_id: 'WH-PUN-SPARE', access_type: 'FULL_CONTROL', is_default: false },
  { user_id: 'USR-003', warehouse_id: 'WH-PUN-SPARE', access_type: 'VIEW_ONLY', is_default: true },
  { user_id: 'USR-004', warehouse_id: 'WH-PUN-WRK', access_type: 'MATERIAL_ISSUE', is_default: true },
  { user_id: 'USR-005', warehouse_id: 'WH-PUN-SPARE', access_type: 'MATERIAL_ISSUE', is_default: true },
  { user_id: 'USR-006', warehouse_id: 'WH-PUN-SCRAP', access_type: 'FULL_CONTROL', is_default: true },
  { user_id: 'USR-008', warehouse_id: 'WH-PUN-MAIN', access_type: 'FULL_CONTROL', is_default: true },
  { user_id: 'USR-009', warehouse_id: 'WH-PUN-SPARE', access_type: 'VIEW_ONLY', is_default: true },
  { user_id: 'USR-010', warehouse_id: 'WH-PUN-MAIN', access_type: 'FULL_CONTROL', is_default: true }
];

// Update d object
d.warehouses = twoWWarehouses;
d.zones = twoWZones;
d.racks = twoWRacks;
d.shelves = twoWShelves;
d.bins = twoWBins;
d.itemCategories = twoWCategories;
d.items = twoWItems;
d.suppliers = twoWSuppliers;
d.customers = twoWCustomers;
d.boms = twoWBOMs;
d.inventoryBalances = twoWBalances;
d.requisitions = twoWRequisitions;
d.purchaseOrders = twoWPurchaseOrders;
d.goodsReceipts = twoWGoodsReceipts;
d.qualityInspections = twoWQualityInspections;
d.putawayTasks = twoWPutawayTasks;
d.productionOrders = twoWProductionOrders;
d.stockTransfers = twoWStockTransfers;
d.salesOrders = twoWSalesOrders;
d.shipments = twoWShipments;
d.returnsLog = twoWReturnsLog;
d.stockCounts = twoWStockCounts;
d.stockAdjustments = twoWStockAdjustments;
d.auditLogs = twoWAuditLogs;
d.user_warehouse_access = twoWUserWarehouseAccess;

// Normalize users warehouse_id and plant_id references to valid Two-Wheeler stores and plants
d.users.forEach(u => {
  if (!twoWWarehouses.some(w => w.id === u.warehouse_id)) {
    u.warehouse_id = 'WH-PUN-MAIN';
  }
  if (!d.plants.some(p => p.id === u.plant_id)) {
    u.plant_id = 'PLANT-01';
  }
});

console.log('--- After Clean-up ---');
console.log('Cleaned items count:', d.items.length);
console.log('Cleaned categories count:', d.itemCategories.length);
console.log('Cleaned warehouses count:', d.warehouses.length);
console.log('All item codes:', d.items.map(i => i.code));
console.log('All category codes:', d.itemCategories.map(c => c.code));

// Generate mock-data.js code
const outputContent = `/* ==========================================================================
   ENTERPRISE ISCM - MOCK MASTER DATA & INITIAL SEED DATA
   Two-Wheeler Manufacturing, Spare Parts & Multi-Store Supply Chain Network
   ========================================================================== */

const INDIAN_LOCATION_MASTER = ${JSON.stringify(locMaster, null, 2)};

const INITIAL_DATA = ${JSON.stringify(d, null, 2)};

if (typeof window !== 'undefined') {
  window.INITIAL_DATA = INITIAL_DATA;
  window.INDIAN_LOCATION_MASTER = INDIAN_LOCATION_MASTER;
}

if (typeof global !== 'undefined') {
  global.INITIAL_DATA = INITIAL_DATA;
  global.INDIAN_LOCATION_MASTER = INDIAN_LOCATION_MASTER;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { INITIAL_DATA, INDIAN_LOCATION_MASTER };
}
`;

fs.writeFileSync(mockDataPath, outputContent, 'utf-8');
console.log('Successfully wrote cleaned mock-data.js!');
