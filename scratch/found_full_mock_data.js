/* ==========================================================================
   ENTERPRISE ISCM - MOCK MASTER DATA & INITIAL SEED DATA
   Realistic Manufacturing Production & Multi-Plant Supply Chain
   ========================================================================== */

const INITIAL_DATA = {
  // 1. Companies & Plants
  companies: [
    {
      id: 'COMP-01',
      code: 'APEX-IND',
      name: 'Apex Industrial & Automotive Dynamics Ltd.',
      tax_id: '27AABCA1234F1Z5',
      currency: 'INR',
      currency_symbol: '₹',
      is_active: true
    }
  ],

  plants: [
    {
      id: 'PLANT-01',
      company_id: 'COMP-01',
      code: 'PLANT-PUN-01',
      name: 'Pune Assembly & High-Precision Unit',
      plant_type: 'ASSEMBLY_MANUFACTURING',
      address: 'Plot 42, Chakan Industrial Area Phase II',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      is_active: true
    },
    {
      id: 'PLANT-02',
      company_id: 'COMP-01',
      code: 'PLANT-CHE-02',
      name: 'Chennai Forging & Foundry Plant',
      plant_type: 'FOUNDRY_FORGING',
      address: 'Survey 108, Sriperumbudur Industrial Corridor',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      is_active: true
    }
  ],

  departments: [
    { id: 'DEPT-01', plant_id: 'PLANT-01', code: 'PROD-HYD', name: 'Hydraulics Assembly Dept', cost_center: 'CC-101' },
    { id: 'DEPT-02', plant_id: 'PLANT-01', code: 'MAINT', name: 'Plant Engineering & Maintenance', cost_center: 'CC-102' },
    { id: 'DEPT-03', plant_id: 'PLANT-01', code: 'QA-QC', name: 'Quality Assurance & Metallurgy', cost_center: 'CC-103' },
    { id: 'DEPT-04', plant_id: 'PLANT-02', code: 'FORGE-HVY', name: 'Heavy Forging Line 1', cost_center: 'CC-201' }
  ],

  warehouses: [
    {
      id: 'WH-PUN-RMS',
      plant_id: 'PLANT-01',
      code: 'RMS-01',
      name: 'Raw Materials & Hardware Store',
      warehouse_type: 'RAW_MATERIAL',
      capacity_cbm: 3200,
      occupied_cbm: 2150,
      manager: 'Rajesh Sharma'
    },
    {
      id: 'WH-PUN-WIP',
      plant_id: 'PLANT-01',
      code: 'WIP-01',
      name: 'Shop Floor WIP Buffer',
      warehouse_type: 'WIP_STORE',
      capacity_cbm: 1200,
      occupied_cbm: 680,
      manager: 'Vikas Patil'
    },
    {
      id: 'WH-PUN-FGH',
      plant_id: 'PLANT-01',
      code: 'FGH-01',
      name: 'Finished Goods Logistics Hub',
      warehouse_type: 'FINISHED_GOODS',
      capacity_cbm: 4500,
      occupied_cbm: 3100,
      manager: 'Sunil Deshmukh'
    },
    {
      id: 'WH-PUN-QAR',
      plant_id: 'PLANT-01',
      code: 'QAR-01',
      name: 'Central Quarantine & Hold Store',
      warehouse_type: 'QUARANTINE',
      capacity_cbm: 800,
      occupied_cbm: 240,
      manager: 'Dr. Anita Joshi'
    },
    {
      id: 'WH-CHE-RMS',
      plant_id: 'PLANT-02',
      code: 'CHE-RMS-01',
      name: 'Chennai Ingot & Billet Yard',
      warehouse_type: 'RAW_MATERIAL',
      capacity_cbm: 5000,
      occupied_cbm: 3800,
      manager: 'K. Srinivasan'
    }
  ],

  zones: [
    { id: 'ZONE-A', warehouse_id: 'WH-PUN-RMS', code: 'Z-A', name: 'Zone A - Steels & Heavy Billets' },
    { id: 'ZONE-B', warehouse_id: 'WH-PUN-RMS', code: 'Z-B', name: 'Zone B - Bearings & Precision Parts' },
    { id: 'ZONE-C', warehouse_id: 'WH-PUN-RMS', code: 'Z-C', name: 'Zone C - Seals, Fasteners & Hardware' },
    { id: 'ZONE-Q', warehouse_id: 'WH-PUN-QAR', code: 'Z-Q', name: 'Zone Q - Quarantine Inspection Dock' },
    { id: 'ZONE-F1', warehouse_id: 'WH-PUN-FGH', code: 'Z-F1', name: 'Zone F1 - Domestic Dispatch Staging' },
    { id: 'ZONE-F2', warehouse_id: 'WH-PUN-FGH', code: 'Z-F2', name: 'Zone F2 - Export Heavy Pallets' }
  ],

  bins: [
    { id: 'BIN-RMS-A01-01', warehouse_id: 'WH-PUN-RMS', zone_id: 'ZONE-A', code: 'RMS-A01-S1-B1', rack: 'R-01', shelf: 'S-01', bin: 'B-01', max_weight: 2000, max_vol: 8, occupied_pct: 85, status: 'high' },
    { id: 'BIN-RMS-A01-02', warehouse_id: 'WH-PUN-RMS', zone_id: 'ZONE-A', code: 'RMS-A01-S1-B2', rack: 'R-01', shelf: 'S-01', bin: 'B-02', max_weight: 2000, max_vol: 8, occupied_pct: 45, status: 'normal' },
    { id: 'BIN-RMS-A01-03', warehouse_id: 'WH-PUN-RMS', zone_id: 'ZONE-A', code: 'RMS-A01-S2-B1', rack: 'R-01', shelf: 'S-02', bin: 'B-01', max_weight: 2000, max_vol: 8, occupied_pct: 0, status: 'empty' },
    { id: 'BIN-RMS-B01-01', warehouse_id: 'WH-PUN-RMS', zone_id: 'ZONE-B', code: 'RMS-B01-S1-B1', rack: 'R-02', shelf: 'S-01', bin: 'B-01', max_weight: 500, max_vol: 3, occupied_pct: 60, status: 'normal' },
    { id: 'BIN-RMS-B01-02', warehouse_id: 'WH-PUN-RMS', zone_id: 'ZONE-B', code: 'RMS-B01-S1-B2', rack: 'R-02', shelf: 'S-01', bin: 'B-02', max_weight: 500, max_vol: 3, occupied_pct: 92, status: 'full' },
    { id: 'BIN-RMS-C01-01', warehouse_id: 'WH-PUN-RMS', zone_id: 'ZONE-C', code: 'RMS-C01-S1-B1', rack: 'R-03', shelf: 'S-01', bin: 'B-01', max_weight: 300, max_vol: 2, occupied_pct: 30, status: 'normal' },
    { id: 'BIN-QAR-01', warehouse_id: 'WH-PUN-QAR', zone_id: 'ZONE-Q', code: 'QAR-Z01-S1-B1', rack: 'Q-01', shelf: 'S-01', bin: 'B-01', max_weight: 1000, max_vol: 6, occupied_pct: 35, status: 'quarantine' },
    { id: 'BIN-FGH-F1-01', warehouse_id: 'WH-PUN-FGH', zone_id: 'ZONE-F1', code: 'FGH-F1-S1-B1', rack: 'F-01', shelf: 'S-01', bin: 'B-01', max_weight: 1500, max_vol: 10, occupied_pct: 75, status: 'high' },
    { id: 'BIN-FGH-F1-02', warehouse_id: 'WH-PUN-FGH', zone_id: 'ZONE-F1', code: 'FGH-F1-S1-B2', rack: 'F-01', shelf: 'S-01', bin: 'B-02', max_weight: 1500, max_vol: 10, occupied_pct: 0, status: 'empty' }
  ],

  // 2. Item Master (SKUs)
  itemCategories: [
    { id: 'CAT-01', code: 'RAW-MTL', name: 'Raw Materials & Alloys' },
    { id: 'CAT-02', code: 'MEC-PRT', name: 'Mechanical & Precision Components' },
    { id: 'CAT-03', code: 'ELC-SYS', name: 'Electronics & Controllers' },
    { id: 'CAT-04', code: 'HYD-FLD', name: 'Hydraulic Oils & Fluids' },
    { id: 'CAT-05', code: 'SUB-ASM', name: 'Sub-Assemblies' },
    { id: 'CAT-06', code: 'FIN-GDS', name: 'Finished Heavy Equipment' },
    { id: 'CAT-07', code: 'PKG-MAT', name: 'Industrial Packaging' }
  ],

  items: [
    {
      id: 'ITEM-001',
      code: 'RM-STL-4140',
      name: 'Chromoly Steel Round Bar 4140 (Dia 50mm)',
      category_id: 'CAT-01',
      item_type: 'RAW_MATERIAL',
      base_uom: 'KG',
      valuation_method: 'FIFO',
      standard_cost: 145.00,
      last_purchase_price: 148.50,
      min_stock: 500,
      max_stock: 5000,
      reorder_level: 1200,
      safety_stock: 400,
      lead_time_days: 10,
      moq: 500,
      is_batch_controlled: true,
      is_serial_controlled: false,
      has_expiry: false,
      shelf_life_days: 0,
      hsn_code: '72283029'
    },
    {
      id: 'ITEM-002',
      code: 'RM-ALU-6061',
      name: 'Aerospace Grade Aluminum Billet 6061-T6',
      category_id: 'CAT-01',
      item_type: 'RAW_MATERIAL',
      base_uom: 'KG',
      valuation_method: 'FIFO',
      standard_cost: 290.00,
      last_purchase_price: 295.00,
      min_stock: 300,
      max_stock: 3000,
      reorder_level: 800,
      safety_stock: 250,
      lead_time_days: 14,
      moq: 300,
      is_batch_controlled: true,
      is_serial_controlled: false,
      has_expiry: false,
      shelf_life_days: 0,
      hsn_code: '76042910'
    },
    {
      id: 'ITEM-003',
      code: 'RM-BRG-6205',
      name: 'SKF Precision Deep Groove Ball Bearing 6205-2RS',
      category_id: 'CAT-02',
      item_type: 'RAW_MATERIAL',
      base_uom: 'NOS',
      valuation_method: 'WEIGHTED_AVG',
      standard_cost: 420.00,
      last_purchase_price: 435.00,
      min_stock: 100,
      max_stock: 1200,
      reorder_level: 350,
      safety_stock: 100,
      lead_time_days: 7,
      moq: 100,
      is_batch_controlled: true,
      is_serial_controlled: true,
      has_expiry: false,
      shelf_life_days: 0,
      hsn_code: '84821011'
    },
    {
      id: 'ITEM-004',
      code: 'RM-SL-VIT',
      name: 'Viton High-Temperature Radial Oil Seal Set',
      category_id: 'CAT-02',
      item_type: 'RAW_MATERIAL',
      base_uom: 'SET',
      valuation_method: 'FIFO',
      standard_cost: 180.00,
      last_purchase_price: 185.00,
      min_stock: 200,
      max_stock: 1500,
      reorder_level: 400,
      safety_stock: 150,
      lead_time_days: 5,
      moq: 200,
      is_batch_controlled: true,
      is_serial_controlled: false,
      has_expiry: true,
      shelf_life_days: 730,
      hsn_code: '84841090'
    },
    {
      id: 'ITEM-005',
      code: 'RM-ECU-MICRO',
      name: 'Automotive 32-bit MCU Servo Drive Controller Board',
      category_id: 'CAT-03',
      item_type: 'RAW_MATERIAL',
      base_uom: 'NOS',
      valuation_method: 'FIFO',
      standard_cost: 3800.00,
      last_purchase_price: 3950.00,
      min_stock: 50,
      max_stock: 400,
      reorder_level: 120,
      safety_stock: 40,
      lead_time_days: 21,
      moq: 50,
      is_batch_controlled: true,
      is_serial_controlled: true,
      has_expiry: false,
      shelf_life_days: 0,
      hsn_code: '85371090'
    },
    {
      id: 'ITEM-006',
      code: 'RM-OIL-ISO46',
      name: 'Mobil DTE 25 ISO VG 46 Anti-Wear Hydraulic Fluid',
      category_id: 'CAT-04',
      item_type: 'RAW_MATERIAL',
      base_uom: 'LTR',
      valuation_method: 'WEIGHTED_AVG',
      standard_cost: 260.00,
      last_purchase_price: 265.00,
      min_stock: 500,
      max_stock: 4000,
      reorder_level: 1000,
      safety_stock: 350,
      lead_time_days: 4,
      moq: 500,
      is_batch_controlled: true,
      is_serial_controlled: false,
      has_expiry: true,
      shelf_life_days: 1095,
      hsn_code: '27101981'
    },
    {
      id: 'ITEM-007',
      code: 'RM-FAST-M8',
      name: 'High-Tensile Grade 10.9 M8x40 Hex Flange Bolt',
      category_id: 'CAT-02',
      item_type: 'RAW_MATERIAL',
      base_uom: 'NOS',
      valuation_method: 'FIFO',
      standard_cost: 14.50,
      last_purchase_price: 15.00,
      min_stock: 1000,
      max_stock: 10000,
      reorder_level: 2500,
      safety_stock: 800,
      lead_time_days: 3,
      moq: 1000,
      is_batch_controlled: true,
      is_serial_controlled: false,
      has_expiry: false,
      shelf_life_days: 0,
      hsn_code: '73181500'
    },
    {
      id: 'ITEM-008',
      code: 'SA-MTR-04',
      name: 'Brushless Actuator Stator & Rotor Core Sub-Assembly',
      category_id: 'CAT-05',
      item_type: 'SUB_ASSEMBLY',
      base_uom: 'NOS',
      valuation_method: 'STANDARD',
      standard_cost: 8450.00,
      last_purchase_price: 0,
      min_stock: 20,
      max_stock: 150,
      reorder_level: 40,
      safety_stock: 15,
      lead_time_days: 5,
      moq: 10,
      is_batch_controlled: true,
      is_serial_controlled: true,
      has_expiry: false,
      shelf_life_days: 0,
      hsn_code: '85013119'
    },
    {
      id: 'ITEM-009',
      code: 'FG-ACT-1000',
      name: 'High-Torque Electro-Hydraulic Actuator 24V (Model H-1000)',
      category_id: 'CAT-06',
      item_type: 'FINISHED_GOODS',
      base_uom: 'NOS',
      valuation_method: 'STANDARD',
      standard_cost: 26500.00,
      last_purchase_price: 0,
      min_stock: 15,
      max_stock: 100,
      reorder_level: 30,
      safety_stock: 10,
      lead_time_days: 10,
      moq: 5,
      is_batch_controlled: true,
      is_serial_controlled: true,
      has_expiry: false,
      shelf_life_days: 0,
      hsn_code: '84122100'
    },
    {
      id: 'ITEM-010',
      code: 'FG-CNC-500',
      name: 'CNC 15,000 RPM Motorized High-Speed Spindle Head',
      category_id: 'CAT-06',
      item_type: 'FINISHED_GOODS',
      base_uom: 'NOS',
      valuation_method: 'STANDARD',
      standard_cost: 64000.00,
      last_purchase_price: 0,
      min_stock: 8,
      max_stock: 50,
      reorder_level: 15,
      safety_stock: 5,
      lead_time_days: 15,
      moq: 2,
      is_batch_controlled: true,
      is_serial_controlled: true,
      has_expiry: false,
      shelf_life_days: 0,
      hsn_code: '84669390'
    },
    {
      id: 'ITEM-011',
      code: 'PKG-CRTN-01',
      name: 'Heavy-Duty 7-Ply Corrugated Wooden Base Export Box',
      category_id: 'CAT-07',
      item_type: 'CONSUMABLE',
      base_uom: 'NOS',
      valuation_method: 'FIFO',
      standard_cost: 450.00,
      last_purchase_price: 460.00,
      min_stock: 50,
      max_stock: 500,
      reorder_level: 120,
      safety_stock: 40,
      lead_time_days: 3,
      moq: 50,
      is_batch_controlled: false,
      is_serial_controlled: false,
      has_expiry: false,
      shelf_life_days: 0,
      hsn_code: '48191010'
    }
  ],

  // 3. Suppliers & Customers
  suppliers: [
    {
      id: 'SUP-001',
      code: 'TATA-STEEL',
      name: 'Tata Special Alloy Steels Ltd.',
      category: 'RAW_MATERIAL',
      contact: 'Sunil Rao',
      email: 'srao@tatasteel.com',
      phone: '+91 98230 11223',
      city: 'Jamshedpur',
      rating: 4.9,
      payment_terms: 30,
      is_approved: true
    },
    {
      id: 'SUP-002',
      code: 'SKF-IND',
      name: 'SKF Bearings India Pvt Ltd.',
      category: 'OEM_COMPONENTS',
      contact: 'Pooja Nair',
      email: 'pooja.nair@skf.com',
      phone: '+91 98401 55667',
      city: 'Pune',
      rating: 4.8,
      payment_terms: 45,
      is_approved: true
    },
    {
      id: 'SUP-003',
      code: 'PARKER-HYD',
      name: 'Parker Hannifin Fluid Systems',
      category: 'HYDRAULICS',
      contact: 'David D’Souza',
      email: 'dsouza@parker.com',
      phone: '+91 99304 88771',
      city: 'Navi Mumbai',
      rating: 4.7,
      payment_terms: 30,
      is_approved: true
    },
    {
      id: 'SUP-004',
      code: 'BOSCH-SEN',
      name: 'Bosch Automotive Electronics India',
      category: 'ELECTRONICS',
      contact: 'Arun Varma',
      email: 'arun.varma@bosch.com',
      phone: '+91 98800 22334',
      city: 'Bengaluru',
      rating: 4.9,
      payment_terms: 60,
      is_approved: true
    },
    {
      id: 'SUP-005',
      code: 'BHARAT-FAST',
      name: 'Bharat High-Tensile Fasteners Corp',
      category: 'HARDWARE',
      contact: 'Mukesh Patel',
      email: 'mpatel@bharatfasteners.com',
      phone: '+91 97123 44556',
      city: 'Ludhiana',
      rating: 4.3,
      payment_terms: 15,
      is_approved: true
    }
  ],

  customers: [
    {
      id: 'CUST-001',
      code: 'MAHINDRA-AUTO',
      name: 'Mahindra & Mahindra Heavy Vehicle Division',
      category: 'TIER1_OEM',
      contact: 'Vikram Sengupta',
      email: 'sengupta.vikram@mahindra.com',
      phone: '+91 98220 99881',
      city: 'Chakan, Pune',
      credit_limit: 15000000,
      payment_terms: 45
    },
    {
      id: 'CUST-002',
      code: 'CAT-IND',
      name: 'Caterpillar Heavy Machinery India',
      category: 'TIER1_OEM',
      contact: 'Eileen Cooper',
      email: 'cooper_e@cat.com',
      phone: '+91 98410 77665',
      city: 'Tiruvallur, Chennai',
      credit_limit: 25000000,
      payment_terms: 60
    },
    {
      id: 'CUST-003',
      code: 'LT-HEAVY',
      name: 'Larsen & Toubro Heavy Engineering Ltd.',
      category: 'DEFENSE_HEAVY',
      contact: 'Capt. R. K. Saxena',
      email: 'rk.saxena@lnteng.com',
      phone: '+91 99201 33221',
      city: 'Hazira, Surat',
      credit_limit: 30000000,
      payment_terms: 60
    }
  ],

  // 4. Bills of Materials (BOM)
  boms: [
    {
      id: 'BOM-001',
      bom_number: 'BOM-FG-ACT-1000-V1',
      item_id: 'ITEM-009',
      version: '1.2',
      description: 'Master Production BOM for Electro-Hydraulic Actuator 24V',
      base_qty: 1,
      components: [
        { item_id: 'ITEM-001', qty: 4.8, uom: 'KG', scrap_pct: 3.5, remarks: 'Housing & Rod Turning' },
        { item_id: 'ITEM-002', qty: 2.2, uom: 'KG', scrap_pct: 2.0, remarks: 'Endcap Manifold' },
        { item_id: 'ITEM-003', qty: 2, uom: 'NOS', scrap_pct: 0.0, remarks: 'Drive Bearings' },
        { item_id: 'ITEM-004', qty: 1, uom: 'SET', scrap_pct: 0.0, remarks: 'Pressure Sealing Kit' },
        { item_id: 'ITEM-005', qty: 1, uom: 'NOS', scrap_pct: 0.0, remarks: 'Internal Controller Board' },
        { item_id: 'ITEM-006', qty: 1.5, uom: 'LTR', scrap_pct: 1.0, remarks: 'Factory Hydraulic Charge' },
        { item_id: 'ITEM-007', qty: 8, uom: 'NOS', scrap_pct: 0.0, remarks: 'Casing Flange Bolts' },
        { item_id: 'ITEM-011', qty: 1, uom: 'NOS', scrap_pct: 0.0, remarks: 'Export Packaging Box' }
      ]
    },
    {
      id: 'BOM-002',
      bom_number: 'BOM-FG-CNC-500-V1',
      item_id: 'ITEM-010',
      version: '2.0',
      description: 'High-Speed CNC Spindle Head Core BOM',
      base_qty: 1,
      components: [
        { item_id: 'ITEM-001', qty: 14.5, uom: 'KG', scrap_pct: 4.0, remarks: 'Main Spindle Shaft' },
        { item_id: 'ITEM-002', qty: 8.0, uom: 'KG', scrap_pct: 2.5, remarks: 'Cooling Jacket Body' },
        { item_id: 'ITEM-003', qty: 4, uom: 'NOS', scrap_pct: 0.0, remarks: 'High-Precision Angular Bearings' },
        { item_id: 'ITEM-005', qty: 1, uom: 'NOS', scrap_pct: 0.0, remarks: 'Encoder & Drive Unit' },
        { item_id: 'ITEM-007', qty: 16, uom: 'NOS', scrap_pct: 0.0, remarks: 'Assembly Fasteners' },
        { item_id: 'ITEM-011', qty: 1, uom: 'NOS', scrap_pct: 0.0, remarks: 'Export Shockproof Crate' }
      ]
    }
  ],

  // 5. Initial Inventory Balances
  inventoryBalances: [
    {
      id: 'BAL-001',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-RMS',
      bin_id: 'BIN-RMS-A01-01',
      item_id: 'ITEM-001',
      batch_number: 'LOT-STL-2601-A',
      serial_number: null,
      on_hand: 2450.00,
      reserved: 350.00,
      available: 2100.00,
      stock_status: 'AVAILABLE',
      valuation_rate: 147.50,
      mfg_date: '2026-07-15',
      expiry_date: null
    },
    {
      id: 'BAL-002',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-RMS',
      bin_id: 'BIN-RMS-A01-02',
      item_id: 'ITEM-002',
      batch_number: 'LOT-ALU-2602-B',
      serial_number: null,
      on_hand: 920.00,
      reserved: 120.00,
      available: 800.00,
      stock_status: 'AVAILABLE',
      valuation_rate: 294.00,
      mfg_date: '2026-08-01',
      expiry_date: null
    },
    {
      id: 'BAL-003',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-RMS',
      bin_id: 'BIN-RMS-B01-01',
      item_id: 'ITEM-003',
      batch_number: 'LOT-SKF-2604',
      serial_number: 'SN-BRG-8890',
      on_hand: 480.00,
      reserved: 80.00,
      available: 400.00,
      stock_status: 'AVAILABLE',
      valuation_rate: 425.00,
      mfg_date: '2026-06-20',
      expiry_date: null
    },
    {
      id: 'BAL-004',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-RMS',
      bin_id: 'BIN-RMS-C01-01',
      item_id: 'ITEM-004',
      batch_number: 'LOT-VIT-2608',
      serial_number: null,
      on_hand: 550.00,
      reserved: 50.00,
      available: 500.00,
      stock_status: 'AVAILABLE',
      valuation_rate: 182.00,
      mfg_date: '2026-05-10',
      expiry_date: '2028-05-10'
    },
    {
      id: 'BAL-005',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-RMS',
      bin_id: 'BIN-RMS-B01-02',
      item_id: 'ITEM-005',
      batch_number: 'LOT-MCU-2603',
      serial_number: 'SN-MCU-0104',
      on_hand: 140.00,
      reserved: 40.00,
      available: 100.00,
      stock_status: 'AVAILABLE',
      valuation_rate: 3900.00,
      mfg_date: '2026-07-20',
      expiry_date: null
    },
    {
      id: 'BAL-006',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-RMS',
      bin_id: 'BIN-RMS-A01-01',
      item_id: 'ITEM-006',
      batch_number: 'LOT-OIL-2601',
      serial_number: null,
      on_hand: 1800.00,
      reserved: 200.00,
      available: 1600.00,
      stock_status: 'AVAILABLE',
      valuation_rate: 262.00,
      mfg_date: '2026-04-10',
      expiry_date: '2029-04-10'
    },
    {
      id: 'BAL-007',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-RMS',
      bin_id: 'BIN-RMS-C01-01',
      item_id: 'ITEM-007',
      batch_number: 'LOT-FST-2602',
      serial_number: null,
      on_hand: 4500.00,
      reserved: 500.00,
      available: 4000.00,
      stock_status: 'AVAILABLE',
      valuation_rate: 14.80,
      mfg_date: '2026-06-01',
      expiry_date: null
    },
    {
      id: 'BAL-008',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-FGH',
      bin_id: 'BIN-FGH-F1-01',
      item_id: 'ITEM-009',
      batch_number: 'LOT-FG-ACT-001',
      serial_number: 'SN-ACT-9901',
      on_hand: 32.00,
      reserved: 12.00,
      available: 20.00,
      stock_status: 'AVAILABLE',
      valuation_rate: 26500.00,
      mfg_date: '2026-08-20',
      expiry_date: null
    },
    {
      id: 'BAL-009',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-QAR',
      bin_id: 'BIN-QAR-01',
      item_id: 'ITEM-003',
      batch_number: 'LOT-SKF-REJ-01',
      serial_number: 'SN-BRG-REJ-01',
      on_hand: 20.00,
      reserved: 0.00,
      available: 0.00,
      stock_status: 'QUARANTINE',
      valuation_rate: 420.00,
      mfg_date: '2026-08-10',
      expiry_date: null
    }
  ],

  // 6. Pre-seeded Transactions Across All Stages
  requisitions: [
    {
      id: 'PR-001',
      pr_number: 'PR-2026-001',
      plant_id: 'PLANT-01',
      department_id: 'DEPT-01',
      requested_by: 'Vikas Patil',
      required_date: '2026-09-20',
      priority: 'HIGH',
      status: 'APPROVED',
      justification: 'Quarterly assembly line replenishment for Actuator Model H-1000 production order.',
      items: [
        { item_id: 'ITEM-001', qty: 1500, uom: 'KG', est_rate: 148, suggested_supplier: 'SUP-001' },
        { item_id: 'ITEM-003', qty: 250, uom: 'NOS', est_rate: 430, suggested_supplier: 'SUP-002' }
      ],
      created_at: '2026-08-28T09:30:00Z',
      approved_by: 'Rajesh Sharma (Supply Chain Head)',
      approved_at: '2026-08-29T14:10:00Z'
    },
    {
      id: 'PR-002',
      pr_number: 'PR-2026-002',
      plant_id: 'PLANT-01',
      department_id: 'DEPT-01',
      requested_by: 'Sanjay Deshmukh',
      required_date: '2026-09-25',
      priority: 'URGENT',
      status: 'PENDING_APPROVAL',
      justification: 'Emergency top-up for 32-bit MCU Controller boards due to unexpected export surge.',
      items: [
        { item_id: 'ITEM-005', qty: 100, uom: 'NOS', est_rate: 3950, suggested_supplier: 'SUP-004' }
      ],
      created_at: '2026-09-08T11:45:00Z'
    }
  ],

  purchaseOrders: [
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
      subtotal: 222000.00,
      tax_amount: 39960.00,
      total_amount: 261960.00,
      status: 'APPROVED',
      approved_by: 'Sunil Deshmukh (VP Operations)',
      approved_at: '2026-08-31T10:00:00Z',
      items: [
        { item_id: 'ITEM-001', ordered_qty: 1500, received_qty: 1500, uom: 'KG', unit_price: 148.00, tax_pct: 18, total: 261960.00 }
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
      payment_terms: 'Net 45 Days',
      incoterms: 'EXW Pune',
      subtotal: 108750.00,
      tax_amount: 19575.00,
      total_amount: 128325.00,
      status: 'APPROVED',
      approved_by: 'Sunil Deshmukh (VP Operations)',
      approved_at: '2026-09-01T15:30:00Z',
      items: [
        { item_id: 'ITEM-003', ordered_qty: 250, received_qty: 0, uom: 'NOS', unit_price: 435.00, tax_pct: 18, total: 128325.00 }
      ]
    }
  ],

  goodsReceipts: [
    {
      id: 'GRN-001',
      grn_number: 'GRN-2026-501',
      po_id: 'PO-001',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-RMS',
      supplier_id: 'SUP-001',
      challan_no: 'DC-TATA-9941',
      invoice_no: 'INV-TATA-8812',
      vehicle_no: 'MH-12-RN-8890',
      received_date: '2026-09-05T11:20:00Z',
      received_by: 'Ramesh Khot (Receiving Storekeeper)',
      inspection_status: 'INSPECTED',
      remarks: 'Full delivery received in sound bundle condition. Mill test certificates verified.',
      items: [
        {
          item_id: 'ITEM-001',
          received_qty: 1500,
          accepted_qty: 1500,
          rejected_qty: 0,
          quarantine_qty: 0,
          uom: 'KG',
          batch_number: 'LOT-STL-2601-A',
          heat_number: 'HT-77401-TATA',
          mfg_date: '2026-07-15'
        }
      ]
    }
  ],

  qualityInspections: [
    {
      id: 'QA-001',
      inspection_number: 'QA-2026-801',
      inspection_type: 'INCOMING',
      ref_doc_type: 'GRN',
      ref_doc_no: 'GRN-2026-501',
      item_id: 'ITEM-001',
      batch_number: 'LOT-STL-2601-A',
      lot_qty: 1500,
      sample_size: 20,
      accepted_qty: 1500,
      rejected_qty: 0,
      quarantine_qty: 0,
      status: 'ACCEPTED',
      inspector: 'Dr. Anita Joshi',
      inspected_at: '2026-09-05T14:30:00Z',
      coa_number: 'COA-TATA-44109',
      tests: [
        { param: 'Outer Diameter Tolerance', spec: '50.00 ± 0.15 mm', observed: '50.08 mm', result: 'PASS' },
        { param: 'Hardness (Rockwell C)', spec: '28 - 32 HRC', observed: '30.5 HRC', result: 'PASS' },
        { param: 'Chemical Carbon Content', spec: '0.38 - 0.43 %', observed: '0.41 %', result: 'PASS' }
      ]
    },
    {
      id: 'QA-002',
      inspection_number: 'QA-2026-802',
      inspection_type: 'INCOMING',
      ref_doc_type: 'GRN',
      ref_doc_no: 'GRN-2026-490',
      item_id: 'ITEM-003',
      batch_number: 'LOT-SKF-REJ-01',
      lot_qty: 100,
      sample_size: 15,
      accepted_qty: 80,
      rejected_qty: 20,
      quarantine_qty: 20,
      status: 'REJECTED',
      inspector: 'Nitin Gore',
      inspected_at: '2026-08-25T11:00:00Z',
      defect_type: 'Radial Play Out of Spec',
      defect_notes: 'Excessive radial clearance beyond ISO Class 6 tolerance on 20 units. Transferred to quarantine for vendor return.',
      tests: [
        { param: 'Bore Diameter', spec: '25.000 ± 0.005 mm', observed: '25.002 mm', result: 'PASS' },
        { param: 'Radial Internal Clearance', spec: '5 - 15 µm', observed: '24 µm', result: 'FAIL' }
      ]
    }
  ],

  putawayTasks: [
    {
      id: 'PUT-001',
      task_number: 'PUT-2026-01',
      inspection_id: 'QA-001',
      item_id: 'ITEM-001',
      batch_number: 'LOT-STL-2601-A',
      quantity: 1500,
      source_dock: 'DOCK-1-RECEIVING',
      suggested_bin_id: 'BIN-RMS-A01-01',
      actual_bin_id: 'BIN-RMS-A01-01',
      status: 'COMPLETED',
      completed_by: 'Ganesh Shinde (Forklift Operator)',
      completed_at: '2026-09-05T16:00:00Z'
    }
  ],

  productionOrders: [
    {
      id: 'PRD-001',
      order_number: 'PRD-2026-901',
      plant_id: 'PLANT-01',
      item_id: 'ITEM-009',
      bom_id: 'BOM-001',
      target_qty: 25,
      completed_qty: 20,
      scrapped_qty: 1,
      planned_start: '2026-09-01',
      planned_end: '2026-09-15',
      actual_start: '2026-09-02T08:00:00Z',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      materials: [
        { item_id: 'ITEM-001', required: 120.0, issued: 120.0, consumed: 100.8, uom: 'KG' },
        { item_id: 'ITEM-002', required: 55.0, issued: 55.0, consumed: 46.2, uom: 'KG' },
        { item_id: 'ITEM-003', required: 50, issued: 50, consumed: 42, uom: 'NOS' },
        { item_id: 'ITEM-004', required: 25, issued: 25, consumed: 21, uom: 'SET' },
        { item_id: 'ITEM-005', required: 25, issued: 25, consumed: 21, uom: 'NOS' },
        { item_id: 'ITEM-006', required: 37.5, issued: 37.5, consumed: 31.5, uom: 'LTR' },
        { item_id: 'ITEM-007', required: 200, issued: 200, consumed: 168, uom: 'NOS' },
        { item_id: 'ITEM-011', required: 25, issued: 25, consumed: 20, uom: 'NOS' }
      ]
    }
  ],

  stockTransfers: [
    {
      id: 'TRF-001',
      transfer_number: 'TRF-2026-301',
      source_plant_id: 'PLANT-02',
      source_warehouse_id: 'WH-CHE-RMS',
      dest_plant_id: 'PLANT-01',
      dest_warehouse_id: 'WH-PUN-RMS',
      reason: 'Raw stock rebalancing for urgent actuator build schedule.',
      status: 'IN_TRANSIT',
      transporter: 'VRL Logistics Fleet 4',
      vehicle_no: 'TN-04-AB-5512',
      dispatched_by: 'K. Srinivasan',
      dispatched_at: '2026-09-08T06:30:00Z',
      items: [
        { item_id: 'ITEM-001', batch_number: 'LOT-STL-CHE-89', requested: 2000, dispatched: 2000, received: 0, uom: 'KG' }
      ]
    }
  ],

  salesOrders: [
    {
      id: 'SO-001',
      so_number: 'SO-2026-401',
      customer_id: 'CUST-001',
      plant_id: 'PLANT-01',
      order_date: '2026-08-25',
      delivery_due_date: '2026-09-18',
      total_amount: 371700.00,
      status: 'DISPATCHED',
      items: [
        { item_id: 'ITEM-009', ordered_qty: 12, unit_price: 30975.00, total_price: 371700.00 }
      ]
    }
  ],

  shipments: [
    {
      id: 'SHP-001',
      shipment_number: 'SHP-2026-701',
      so_id: 'SO-001',
      customer_id: 'CUST-001',
      transporter: 'Gati KWE Express Fleet',
      vehicle_no: 'MH-14-EA-4419',
      driver_name: 'Balwant Singh',
      driver_phone: '+91 98231 44552',
      gate_pass_no: 'GP-2026-9041',
      eway_bill_no: '241088921045',
      total_boxes: 12,
      total_weight_kg: 420.0,
      status: 'IN_TRANSIT',
      dispatched_at: '2026-09-09T14:30:00Z',
      items: [
        { item_id: 'ITEM-009', batch_number: 'LOT-FG-ACT-001', qty: 12, boxes: 'BOX-01 to BOX-12' }
      ]
    }
  ],

  returnsLog: [
    {
      id: 'RET-001',
      return_number: 'RET-2026-01',
      return_type: 'PURCHASE_RETURN_VENDOR',
      ref_doc_no: 'QA-2026-802',
      entity_name: 'SKF Bearings India Pvt Ltd.',
      item_id: 'ITEM-003',
      batch_number: 'LOT-SKF-REJ-01',
      qty: 20,
      uom: 'NOS',
      reason: 'Rejected during incoming QC - excessive radial internal clearance.',
      disposition: 'VENDOR_REPLACEMENT',
      status: 'APPROVED',
      logged_by: 'Dr. Anita Joshi',
      created_at: '2026-08-26T10:00:00Z'
    },
    {
      id: 'RET-002',
      return_number: 'RET-2026-02',
      return_type: 'CUSTOMER_RETURN_RMA',
      ref_doc_no: 'RMA-CUST-104',
      entity_name: 'Mahindra Heavy Vehicle Division',
      item_id: 'ITEM-009',
      batch_number: 'LOT-FG-ACT-PREV',
      qty: 1,
      uom: 'NOS',
      reason: 'Transit vibration seal damage observed at customer pre-fitment test.',
      disposition: 'QUARANTINE',
      status: 'APPROVED',
      logged_by: 'Sanjay Deshmukh',
      created_at: '2026-09-02T16:00:00Z'
    }
  ],

  stockCounts: [
    {
      id: 'CNT-001',
      plan_number: 'CNT-2026-01',
      count_type: 'CYCLE_COUNT',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-RMS',
      scheduled_date: '2026-09-01',
      status: 'RECONCILED',
      items: [
        {
          bin_id: 'BIN-RMS-C01-01',
          item_id: 'ITEM-007',
          batch_number: 'LOT-FST-2602',
          system_qty: 4500,
          counted_qty: 4490,
          variance_qty: -10,
          variance_val: -148.00,
          reconciled: true,
          counter: 'Prakash Shinde'
        }
      ]
    }
  ],

  stockAdjustments: [
    {
      id: 'ADJ-001',
      adjustment_number: 'ADJ-2026-01',
      plant_id: 'PLANT-01',
      warehouse_id: 'WH-PUN-RMS',
      bin_id: 'BIN-RMS-C01-01',
      item_id: 'ITEM-007',
      batch_number: 'LOT-FST-2602',
      adjustment_type: 'DECREASE',
      qty: 10,
      reason: 'Cycle count variance write-off (Minor floor handling loss during picking).',
      approved_by: 'Rajesh Sharma (Supply Chain Head)',
      created_at: '2026-09-02T11:00:00Z'
    }
  ],

  auditLogs: [
    {
      id: 'AUD-001',
      timestamp: '2026-09-09T14:30:00Z',
      user: 'Pravin Patil',
      role: 'Supply Chain Manager',
      ip: '192.168.1.45',
      action: 'DISPATCH',
      module: 'LOGISTICS',
      record_id: 'SHP-2026-701',
      details: 'Gate Pass GP-2026-9041 issued for Gati KWE Vehicle MH-14-EA-4419 carrying 12 units FG-ACT-1000.'
    },
    {
      id: 'AUD-002',
      timestamp: '2026-09-08T06:30:00Z',
      user: 'K. Srinivasan',
      role: 'Chennai Warehouse Head',
      ip: '192.168.2.110',
      action: 'TRANSFER_DISPATCH',
      module: 'STOCK_TRANSFER',
      record_id: 'TRF-2026-301',
      details: 'Dispatched 2000 KG Chromoly 4140 to Pune Assembly Plant via VRL Fleet 4.'
    },
    {
      id: 'AUD-003',
      timestamp: '2026-09-05T16:00:00Z',
      user: 'Ganesh Shinde',
      role: 'Storekeeper',
      ip: '192.168.1.72',
      action: 'PUTAWAY',
      module: 'WAREHOUSE',
      record_id: 'PUT-2026-01',
      details: 'Putaway completed for 1500 KG steel into Bin RMS-A01-S1-B1.'
    },
    {
      id: 'AUD-004',
      timestamp: '2026-09-05T14:30:00Z',
      user: 'Dr. Anita Joshi',
      role: 'Quality Lead',
      ip: '192.168.1.18',
      action: 'QUALITY_APPROVE',
      module: 'QUALITY_ASSURANCE',
      record_id: 'QA-2026-801',
      details: 'Incoming batch LOT-STL-2601-A accepted with COA-TATA-44109.'
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = INITIAL_DATA;
}
