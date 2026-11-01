/* ==========================================================================
   ENTERPRISE ISCM - ITEM SETUP & ITEM MASTER MODULE (BRD v1.0 COMPLIANT)
   Centralized Inventory Management Suite for Two-Wheeler Service Centers
   Hierarchy: Category → Sub-Category → Brand → Manufacturer → Item → Fitment
   Implements 10-Tab Item Setup Architecture (Section 37 BRD):
   [Basic] [Vehicle Compatibility] [UOM] [Tax] [Inventory] [Store/Bin] [Job Card] [Warranty] [Pricing] [Audit]
   ========================================================================== */

window.ItemSetupModule = {
  // Filter and search states
  searchTerm: '',
  categoryFilter: 'ALL',
  subcategoryFilter: 'ALL',
  categorySearchTerm: '',
  categoryViewMode: 'GROUPED',
  expandedCategories: {},
  // Master-specific search and filter states
  brandSearchTerm: '',
  brandCountryFilter: 'ALL',
  brandStatusFilter: 'ALL',

  mfgSearchTerm: '',
  mfgTypeFilter: 'ALL',
  mfgStatusFilter: 'ALL',

  vehicleSearchTerm: '',
  vehicleFuelFilter: 'ALL',
  vehicleStatusFilter: 'ALL',

  uomSearchTerm: '',
  uomTypeFilter: 'ALL',
  uomStatusFilter: 'ALL',

  hsnSearchTerm: '',
  hsnGstFilter: 'ALL',
  hsnStatusFilter: 'ALL',

  brandFilter: 'ALL',
  typeFilter: 'ALL',
  vehicleFilter: 'ALL',
  statusFilter: 'ALL',
  facilityFilter: 'ALL',
  currentPage: 1,
  pageSize: 10,

  // Active modal state for 10-Tab Item Setup screen
  modalActiveTab: 'BASIC',
  editingItemDraft: null,

  _seeded: false,

  // -------------------------------------------------------------------------
  // INITIALIZATION & SEED RECONCILIATION
  // -------------------------------------------------------------------------
  init() {
    this.ensureSeedData();
  },

  ensureSeedData() {
    if (this._seeded) return;
    this._seeded = true;
    if (!window.DB || !window.DB.data) return;

    let modified = false;

    // 1. Ensure 7 Main Categories from BRD Section 7
    if (!Array.isArray(window.DB.data.itemCategories)) {
      window.DB.data.itemCategories = [];
    }
    const currentCats = window.DB.data.itemCategories;
    const defaultCats = [
      { id: 'CAT-SPARE', code: 'SPARE', name: 'Spare Parts', item_type: 'Spare Part', description: 'Mechanical, electrical and body replacement parts for two-wheelers', status: 'Active' },
      { id: 'CAT-CONS', code: 'CONS', name: 'Consumables', item_type: 'Consumable', description: 'Workshop cleaning, greasing, and safety consumables', status: 'Active' },
      { id: 'CAT-ACC', code: 'ACC', name: 'Accessories', item_type: 'Accessory', description: 'Aftermarket and cosmetic two-wheeler accessories', status: 'Active' },
      { id: 'CAT-LUB', code: 'LUB', name: 'Lubricants', item_type: 'Lubricant', description: 'Engine oils, gear oils, fork oils and brake fluids', status: 'Active' },
      { id: 'CAT-BAT', code: 'BAT', name: 'Batteries', item_type: 'Battery', description: '2-Wheeler starter batteries, EV batteries and chargers', status: 'Active' },
      { id: 'CAT-TYR', code: 'TYR', name: 'Tyres', item_type: 'Tyre', description: 'Front, rear tyres, tubes and tubeless tyres', status: 'Active' },
      { id: 'CAT-TOOL', code: 'TOOL', name: 'Tools', item_type: 'Tool', description: 'Garage hand tools, SSTs, diagnostic and electrical tools', status: 'Active' }
    ];

    defaultCats.forEach(cat => {
      const idx = currentCats.findIndex(c => c.id === cat.id);
      if (idx === -1) {
        currentCats.push({ ...cat });
        modified = true;
      } else {
        if (currentCats[idx].name !== cat.name || currentCats[idx].item_type !== cat.item_type) {
          currentCats[idx] = { ...currentCats[idx], name: cat.name, item_type: cat.item_type };
          modified = true;
        }
      }
    });

    // 2. Ensure 58 Subcategories from BRD Section 7.1 - 7.7
    if (!Array.isArray(window.DB.data.itemSubcategories)) {
      window.DB.data.itemSubcategories = [];
    }
    const currentSubcats = window.DB.data.itemSubcategories;
    const defaultSubcats = [
      // 7.1 Spare Parts
      { id: 'SUB-ENG', category_id: 'CAT-SPARE', code: 'ENG-PRT', name: 'Engine Parts', status: 'Active' },
      { id: 'SUB-BRK', category_id: 'CAT-SPARE', code: 'BRK-PRT', name: 'Brake Parts', status: 'Active' },
      { id: 'SUB-CLT', category_id: 'CAT-SPARE', code: 'CLT-PRT', name: 'Clutch Parts', status: 'Active' },
      { id: 'SUB-TRN', category_id: 'CAT-SPARE', code: 'TRN-PRT', name: 'Transmission Parts', status: 'Active' },
      { id: 'SUB-SUS', category_id: 'CAT-SPARE', code: 'SUS-PRT', name: 'Suspension Parts', status: 'Active' },
      { id: 'SUB-STR', category_id: 'CAT-SPARE', code: 'STR-PRT', name: 'Steering Parts', status: 'Active' },
      { id: 'SUB-ELC', category_id: 'CAT-SPARE', code: 'ELC-PRT', name: 'Electrical Parts', status: 'Active' },
      { id: 'SUB-FUL', category_id: 'CAT-SPARE', code: 'FUL-PRT', name: 'Fuel System Parts', status: 'Active' },
      { id: 'SUB-BDY', category_id: 'CAT-SPARE', code: 'BDY-PRT', name: 'Body Parts', status: 'Active' },
      { id: 'SUB-CHS', category_id: 'CAT-SPARE', code: 'CHS-PRT', name: 'Chassis Parts', status: 'Active' },
      { id: 'SUB-COL', category_id: 'CAT-SPARE', code: 'COL-PRT', name: 'Cooling Parts', status: 'Active' },
      { id: 'SUB-FLT', category_id: 'CAT-SPARE', code: 'FLT-PRT', name: 'Filters', status: 'Active' },
      { id: 'SUB-BRG', category_id: 'CAT-SPARE', code: 'BRG-PRT', name: 'Bearings', status: 'Active' },
      { id: 'SUB-CBL', category_id: 'CAT-SPARE', code: 'CBL-PRT', name: 'Cables', status: 'Active' },
      { id: 'SUB-FST', category_id: 'CAT-SPARE', code: 'FST-PRT', name: 'Fasteners', status: 'Active' },

      // 7.2 Consumables
      { id: 'SUB-CLN', category_id: 'CAT-CONS', code: 'CLN-MAT', name: 'Cleaning Materials', status: 'Active' },
      { id: 'SUB-GRS', category_id: 'CAT-CONS', code: 'GRS-MAT', name: 'Grease', status: 'Active' },
      { id: 'SUB-SLT', category_id: 'CAT-CONS', code: 'SLT-MAT', name: 'Sealants', status: 'Active' },
      { id: 'SUB-ADH', category_id: 'CAT-CONS', code: 'ADH-MAT', name: 'Adhesives', status: 'Active' },
      { id: 'SUB-CHM', category_id: 'CAT-CONS', code: 'CHM-MAT', name: 'Workshop Chemicals', status: 'Active' },
      { id: 'SUB-POL', category_id: 'CAT-CONS', code: 'POL-MAT', name: 'Polishing Materials', status: 'Active' },
      { id: 'SUB-WPR', category_id: 'CAT-CONS', code: 'WPR-MAT', name: 'Cloth & Wipers', status: 'Active' },
      { id: 'SUB-GLV', category_id: 'CAT-CONS', code: 'GLV-MAT', name: 'Gloves', status: 'Active' },
      { id: 'SUB-SFT', category_id: 'CAT-CONS', code: 'SFT-MAT', name: 'Safety Consumables', status: 'Active' },

      // 7.3 Accessories
      { id: 'SUB-HLD', category_id: 'CAT-ACC', code: 'ACC-HLD', name: 'Mobile Holder', status: 'Active' },
      { id: 'SUB-STC', category_id: 'CAT-ACC', code: 'ACC-STC', name: 'Seat Cover', status: 'Active' },
      { id: 'SUB-FLM', category_id: 'CAT-ACC', code: 'ACC-FLM', name: 'Floor Mat', status: 'Active' },
      { id: 'SUB-LED', category_id: 'CAT-ACC', code: 'ACC-LED', name: 'LED Accessories', status: 'Active' },
      { id: 'SUB-HRN', category_id: 'CAT-ACC', code: 'ACC-HRN', name: 'Horn', status: 'Active' },
      { id: 'SUB-MIR', category_id: 'CAT-ACC', code: 'ACC-MIR', name: 'Mirrors', status: 'Active' },
      { id: 'SUB-CRG', category_id: 'CAT-ACC', code: 'ACC-CRG', name: 'Crash Guard', status: 'Active' },
      { id: 'SUB-LGG', category_id: 'CAT-ACC', code: 'ACC-LGG', name: 'Leg Guard', status: 'Active' },
      { id: 'SUB-USB', category_id: 'CAT-ACC', code: 'ACC-USB', name: 'USB Charger', status: 'Active' },
      { id: 'SUB-DEC', category_id: 'CAT-ACC', code: 'ACC-DEC', name: 'Decorative Accessories', status: 'Active' },

      // 7.4 Lubricants
      { id: 'SUB-EOIL', category_id: 'CAT-LUB', code: 'LUB-EOIL', name: 'Engine Oil', status: 'Active' },
      { id: 'SUB-GOIL', category_id: 'CAT-LUB', code: 'LUB-GOIL', name: 'Gear Oil', status: 'Active' },
      { id: 'SUB-FOIL', category_id: 'CAT-LUB', code: 'LUB-FOIL', name: 'Fork Oil', status: 'Active' },
      { id: 'SUB-BFLD', category_id: 'CAT-LUB', code: 'LUB-BFLD', name: 'Brake Fluid', status: 'Active' },
      { id: 'SUB-COOL', category_id: 'CAT-LUB', code: 'LUB-COOL', name: 'Coolant', status: 'Active' },
      { id: 'SUB-LGRS', category_id: 'CAT-LUB', code: 'LUB-GRS', name: 'Grease', status: 'Active' },
      { id: 'SUB-CHNL', category_id: 'CAT-LUB', code: 'LUB-CHNL', name: 'Chain Lubricant', status: 'Active' },
      { id: 'SUB-CHNC', category_id: 'CAT-LUB', code: 'LUB-CHNC', name: 'Chain Cleaner', status: 'Active' },

      // 7.5 Batteries
      { id: 'SUB-BAT2W', category_id: 'CAT-BAT', code: 'BAT-2W', name: 'Battery – 2W', status: 'Active' },
      { id: 'SUB-BATEV', category_id: 'CAT-BAT', code: 'BAT-EV', name: 'Battery – Electric Vehicle', status: 'Active' },
      { id: 'SUB-BATACC', category_id: 'CAT-BAT', code: 'BAT-ACC', name: 'Battery Accessories', status: 'Active' },
      { id: 'SUB-BATCHG', category_id: 'CAT-BAT', code: 'BAT-CHG', name: 'Battery Charger', status: 'Active' },

      // 7.6 Tyres
      { id: 'SUB-FTYR', category_id: 'CAT-TYR', code: 'TYR-FRT', name: 'Front Tyre', status: 'Active' },
      { id: 'SUB-RTYR', category_id: 'CAT-TYR', code: 'TYR-RAR', name: 'Rear Tyre', status: 'Active' },
      { id: 'SUB-TUBE', category_id: 'CAT-TYR', code: 'TYR-TUB', name: 'Tube', status: 'Active' },
      { id: 'SUB-TLTYR', category_id: 'CAT-TYR', code: 'TYR-TBL', name: 'Tubeless Tyre', status: 'Active' },
      { id: 'SUB-TYRACC', category_id: 'CAT-TYR', code: 'TYR-ACC', name: 'Tyre Accessories', status: 'Active' },

      // 7.7 Tools
      { id: 'SUB-TOOL-HND', category_id: 'CAT-TOOL', code: 'TOL-HND', name: 'Hand Tools', status: 'Active' },
      { id: 'SUB-TOOL-SST', category_id: 'CAT-TOOL', code: 'TOL-SST', name: 'Special Service Tools', status: 'Active' },
      { id: 'SUB-TOOL-DIA', category_id: 'CAT-TOOL', code: 'TOL-DIA', name: 'Diagnostic Tools', status: 'Active' },
      { id: 'SUB-TOOL-ELC', category_id: 'CAT-TOOL', code: 'TOL-ELC', name: 'Electrical Tools', status: 'Active' },
      { id: 'SUB-TOOL-PNE', category_id: 'CAT-TOOL', code: 'TOL-PNE', name: 'Pneumatic Tools', status: 'Active' },
      { id: 'SUB-TOOL-MSR', category_id: 'CAT-TOOL', code: 'TOL-MSR', name: 'Measuring Tools', status: 'Active' },
      { id: 'SUB-TOOL-EQP', category_id: 'CAT-TOOL', code: 'TOL-EQP', name: 'Workshop Equipment', status: 'Active' }
    ];

    defaultSubcats.forEach(sub => {
      if (!currentSubcats.some(s => s.id === sub.id)) {
        currentSubcats.push({ ...sub });
        modified = true;
      }
    });

    // 3. Ensure Brands
    if (!Array.isArray(window.DB.data.itemBrands)) {
      window.DB.data.itemBrands = [];
    }
    const currentBrands = window.DB.data.itemBrands;
    if (currentBrands.length === 0) {
      const defaultBrands = [
        { id: 'BRD-01', code: 'BOSCH', name: 'Bosch', country: 'Germany', specialization: 'Brakes, Spark Plugs, Horns', status: 'Active' },
        { id: 'BRD-02', code: 'CASTROL', name: 'Castrol', country: 'United Kingdom', specialization: 'Engine Oils, Greases, Fluids', status: 'Active' },
        { id: 'BRD-03', code: 'MOTUL', name: 'Motul', country: 'France', specialization: 'Synthetic Engine Oils, Chain Sprays', status: 'Active' },
        { id: 'BRD-04', code: 'MRF', name: 'MRF', country: 'India', specialization: 'Tyres & Tubes', status: 'Active' },
        { id: 'BRD-05', code: 'CEAT', name: 'CEAT', country: 'India', specialization: 'Tyres & Tubes', status: 'Active' },
        { id: 'BRD-06', code: 'EXIDE', name: 'Exide', country: 'India', specialization: 'Batteries', status: 'Active' },
        { id: 'BRD-07', code: 'AMARON', name: 'Amaron', country: 'India', specialization: 'Batteries', status: 'Active' },
        { id: 'BRD-08', code: 'NGK', name: 'NGK', country: 'Japan', specialization: 'Spark Plugs & Sensors', status: 'Active' },
        { id: 'BRD-09', code: 'BREMBO', name: 'Brembo', country: 'Italy', specialization: 'Brake Calipers & Pads', status: 'Active' },
        { id: 'BRD-10', code: 'ENDURANCE', name: 'Endurance', country: 'India', specialization: 'Suspension & Clutches', status: 'Active' },
        { id: 'BRD-11', code: 'GABRIEL', name: 'Gabriel', country: 'India', specialization: 'Front Forks & Shock Absorbers', status: 'Active' },
        { id: 'BRD-12', code: 'LUMAX', name: 'Lumax', country: 'India', specialization: 'Lighting & Electricals', status: 'Active' },
        { id: 'BRD-13', code: 'MINDA', name: 'Uno Minda', country: 'India', specialization: 'Switches, Horns & Relays', status: 'Active' },
        { id: 'BRD-14', code: 'ROLON', name: 'Rolon', country: 'India', specialization: 'Chain & Sprocket Kits', status: 'Active' },
        { id: 'BRD-15', code: 'VARROC', name: 'Varroc', country: 'India', specialization: 'Electricals & Engine Parts', status: 'Active' }
      ];
      defaultBrands.forEach(b => currentBrands.push({ ...b }));
      modified = true;
    }

    // 4. Ensure Manufacturers
    if (!Array.isArray(window.DB.data.itemManufacturers)) {
      window.DB.data.itemManufacturers = [];
    }
    const currentMfgs = window.DB.data.itemManufacturers;
    if (currentMfgs.length === 0) {
      const defaultMfgs = [
        { id: 'MFG-01', code: 'BOSCH-IN', name: 'Bosch India Limited', type: 'Tier-1', country: 'India', status: 'Active' },
        { id: 'MFG-02', code: 'CASTROL-IN', name: 'Castrol India Ltd.', type: 'Tier-1', country: 'India', status: 'Active' },
        { id: 'MFG-03', code: 'MOTUL-SA', name: 'Motul S.A.', type: 'Tier-1', country: 'France', status: 'Active' },
        { id: 'MFG-04', code: 'MRF-LTD', name: 'MRF Limited', type: 'Tier-1', country: 'India', status: 'Active' },
        { id: 'MFG-05', code: 'CEAT-LTD', name: 'CEAT Limited', type: 'Tier-1', country: 'India', status: 'Active' },
        { id: 'MFG-06', code: 'EXIDE-IND', name: 'Exide Industries Ltd.', type: 'Tier-1', country: 'India', status: 'Active' },
        { id: 'MFG-07', code: 'AMARA-RAJA', name: 'Amara Raja Batteries Ltd.', type: 'Tier-1', country: 'India', status: 'Active' },
        { id: 'MFG-08', code: 'NGK-IN', name: 'NGK Spark Plugs India', type: 'Tier-1', country: 'India', status: 'Active' },
        { id: 'MFG-09', code: 'ENDURANCE-TECH', name: 'Endurance Technologies Ltd.', type: 'Tier-1', country: 'India', status: 'Active' },
        { id: 'MFG-10', code: 'HERO-OEM', name: 'Hero MotoCorp Ltd. (OEM)', type: 'OEM', country: 'India', status: 'Active' },
        { id: 'MFG-11', code: 'HONDA-OEM', name: 'Honda Motorcycle & Scooter India (OEM)', type: 'OEM', country: 'India', status: 'Active' },
        { id: 'MFG-12', code: 'BAJAJ-OEM', name: 'Bajaj Auto Ltd. (OEM)', type: 'OEM', country: 'India', status: 'Active' },
        { id: 'MFG-13', code: 'TVS-OEM', name: 'TVS Motor Company Ltd. (OEM)', type: 'OEM', country: 'India', status: 'Active' },
        { id: 'MFG-14', code: 'YAMAHA-OEM', name: 'India Yamaha Motor Pvt. Ltd. (OEM)', type: 'OEM', country: 'India', status: 'Active' },
        { id: 'MFG-15', code: 'RE-OEM', name: 'Royal Enfield (Eicher Motors) (OEM)', type: 'OEM', country: 'India', status: 'Active' }
      ];
      defaultMfgs.forEach(m => currentMfgs.push({ ...m }));
      modified = true;
    }

    // 5. Ensure UOMs
    if (!Array.isArray(window.DB.data.uoms)) {
      window.DB.data.uoms = [];
    }
    const currentUoms = window.DB.data.uoms;
    if (currentUoms.length === 0) {
      const defaultUoms = [
        { id: 'UOM-01', code: 'NOS', name: 'Numbers', type: 'Count', base_uom: 'NOS', conversion_factor: 1, status: 'Active' },
        { id: 'UOM-02', code: 'PCS', name: 'Pieces', type: 'Count', base_uom: 'NOS', conversion_factor: 1, status: 'Active' },
        { id: 'UOM-03', code: 'SET', name: 'Set / Kit', type: 'Count', base_uom: 'PCS', conversion_factor: 2, status: 'Active' },
        { id: 'UOM-04', code: 'BOX', name: 'Box', type: 'Package', base_uom: 'PCS', conversion_factor: 10, status: 'Active' },
        { id: 'UOM-05', code: 'PACK', name: 'Pack', type: 'Package', base_uom: 'PCS', conversion_factor: 5, status: 'Active' },
        { id: 'UOM-06', code: 'LTR', name: 'Litre', type: 'Volume', base_uom: 'LTR', conversion_factor: 1, status: 'Active' },
        { id: 'UOM-07', code: 'ML', name: 'Millilitre', type: 'Volume', base_uom: 'LTR', conversion_factor: 0.001, status: 'Active' },
        { id: 'UOM-08', code: 'KG', name: 'Kilogram', type: 'Weight', base_uom: 'KG', conversion_factor: 1, status: 'Active' },
        { id: 'UOM-09', code: 'GM', name: 'Gram', type: 'Weight', base_uom: 'KG', conversion_factor: 0.001, status: 'Active' },
        { id: 'UOM-10', code: 'MTR', name: 'Metre', type: 'Length', base_uom: 'MTR', conversion_factor: 1, status: 'Active' },
        { id: 'UOM-11', code: 'PAIR', name: 'Pair', type: 'Count', base_uom: 'NOS', conversion_factor: 2, status: 'Active' }
      ];
      defaultUoms.forEach(u => currentUoms.push({ ...u }));
      modified = true;
    }

    // 6. Ensure HSN Codes
    if (!Array.isArray(window.DB.data.hsnCodes)) {
      window.DB.data.hsnCodes = [];
    }
    const currentHsn = window.DB.data.hsnCodes;
    if (currentHsn.length === 0) {
      const defaultHsn = [
        { id: 'HSN-01', code: '87141000', description: 'Parts and accessories of motorcycles (including mopeds)', gst_rate: 18, cgst_rate: 9, sgst_rate: 9, igst_rate: 18, status: 'Active' },
        { id: 'HSN-02', code: '27101981', description: 'Lubricating engine oils and gear oils for motor vehicles', gst_rate: 18, cgst_rate: 9, sgst_rate: 9, igst_rate: 18, status: 'Active' },
        { id: 'HSN-03', code: '27101990', description: 'Heavy lubricants, brake fluids, hydraulic oil and greases', gst_rate: 18, cgst_rate: 9, sgst_rate: 9, igst_rate: 18, status: 'Active' },
        { id: 'HSN-04', code: '85071000', description: 'Lead-acid accumulators / 2W starter batteries', gst_rate: 28, cgst_rate: 14, sgst_rate: 14, igst_rate: 28, status: 'Active' },
        { id: 'HSN-05', code: '85076000', description: 'Lithium-ion accumulator batteries for Electric Two-Wheelers', gst_rate: 5, cgst_rate: 2.5, sgst_rate: 2.5, igst_rate: 5, status: 'Active' },
        { id: 'HSN-06', code: '40114000', description: 'New pneumatic rubber tyres for motorcycles and scooters', gst_rate: 28, cgst_rate: 14, sgst_rate: 14, igst_rate: 28, status: 'Active' },
        { id: 'HSN-07', code: '40139020', description: 'Inner tubes of rubber for motorcycle and scooter tyres', gst_rate: 18, cgst_rate: 9, sgst_rate: 9, igst_rate: 18, status: 'Active' },
        { id: 'HSN-08', code: '82055900', description: 'Hand tools, spanners and garage special service tools (SST)', gst_rate: 18, cgst_rate: 9, sgst_rate: 9, igst_rate: 18, status: 'Active' },
        { id: 'HSN-09', code: '85122010', description: 'Head lamps, tail lamps and indicators for 2-wheelers', gst_rate: 28, cgst_rate: 14, sgst_rate: 14, igst_rate: 28, status: 'Active' },
        { id: 'HSN-10', code: '85111000', description: 'Spark plugs and ignition coils for two-wheeler engines', gst_rate: 18, cgst_rate: 9, sgst_rate: 9, igst_rate: 18, status: 'Active' },
        { id: 'HSN-11', code: '34031900', description: 'Workshop lubricating preparations, chain sprays, cleaner', gst_rate: 18, cgst_rate: 9, sgst_rate: 9, igst_rate: 18, status: 'Active' },
        { id: 'HSN-12', code: '998729', description: 'Repair and maintenance services of two-wheelers (SAC)', gst_rate: 18, cgst_rate: 9, sgst_rate: 9, igst_rate: 18, status: 'Active' }
      ];
      defaultHsn.forEach(h => currentHsn.push({ ...h }));
      modified = true;
    }

    // 6. Ensure Standard Two-Wheeler Vehicle Models if empty
    if (!Array.isArray(window.DB.data.vehicleModels)) {
      window.DB.data.vehicleModels = [];
    }
    const currentVehicles = window.DB.data.vehicleModels;
    if (currentVehicles.length === 0) {
      const defaultVehicles = [
        { id: 'VM-YEZ-01', code: 'YEZ-SCRAMBLER', name: 'Yezdi Scrambler', variant: 'Standard', displacement_cc: 334, fuel_type: 'Petrol', year_from: 2022, year_to: 2026, status: 'Active' },
        { id: 'VM-YEZ-02', code: 'YEZ-ROADSTER', name: 'Yezdi Roadster', variant: 'Standard', displacement_cc: 334, fuel_type: 'Petrol', year_from: 2022, year_to: 2026, status: 'Active' },
        { id: 'VM-YEZ-03', code: 'YEZ-ADVENTURE', name: 'Yezdi Adventure', variant: 'Standard', displacement_cc: 334, fuel_type: 'Petrol', year_from: 2022, year_to: 2026, status: 'Active' },
        { id: 'VM-YAM-01', code: 'YAM-SALUTO', name: 'Yamaha Saluto', variant: 'Standard', displacement_cc: 125, fuel_type: 'Petrol', year_from: 2018, year_to: 2024, status: 'Active' },
        { id: 'VM-YAM-02', code: 'YAM-SZRR', name: 'Yamaha SZ-RR', variant: 'Standard', displacement_cc: 153, fuel_type: 'Petrol', year_from: 2017, year_to: 2023, status: 'Active' },
        { id: 'VM-YAM-03', code: 'YAM-RAYZR', name: 'Yamaha Ray ZR 125', variant: 'Standard', displacement_cc: 125, fuel_type: 'Petrol', year_from: 2020, year_to: 2026, status: 'Active' },
        { id: 'VM-YAM-04', code: 'YAM-RAYZ', name: 'Yamaha Ray Z', variant: 'Standard', displacement_cc: 113, fuel_type: 'Petrol', year_from: 2016, year_to: 2022, status: 'Active' },
        { id: 'VM-HON-01', code: 'HON-ACTIVA6G', name: 'Honda Activa 6G', variant: 'Standard', displacement_cc: 110, fuel_type: 'Petrol', year_from: 2020, year_to: 2026, status: 'Active' },
        { id: 'VM-HER-01', code: 'HER-SPLENDOR', name: 'Hero Splendor Plus', variant: 'Standard', displacement_cc: 97, fuel_type: 'Petrol', year_from: 2015, year_to: 2026, status: 'Active' },
        { id: 'VM-BAJ-01', code: 'BAJ-PULSAR150', name: 'Bajaj Pulsar 150', variant: 'Standard', displacement_cc: 150, fuel_type: 'Petrol', year_from: 2016, year_to: 2026, status: 'Active' },
        { id: 'VM-TVS-01', code: 'TVS-JUPITER', name: 'TVS Jupiter', variant: 'Standard', displacement_cc: 110, fuel_type: 'Petrol', year_from: 2019, year_to: 2026, status: 'Active' },
        { id: 'VM-ROY-01', code: 'ROY-CLASSIC350', name: 'Royal Enfield Classic 350', variant: 'Standard', displacement_cc: 349, fuel_type: 'Petrol', year_from: 2021, year_to: 2026, status: 'Active' }
      ];
      defaultVehicles.forEach(v => currentVehicles.push(v));
      modified = true;
    }

    if (modified && typeof window.DB.saveData === 'function') {
      window.DB.saveData();
    }
  },

  // Helper to resolve Main Category and Subcategory
  resolveCategoryInfo(item) {
    const categories = (window.DB && window.DB.getAll('itemCategories')) || [];
    const subcategories = (window.DB && window.DB.getAll('itemSubcategories')) || [];

    let mainCat = categories.find(c => c.id === item.category_id || c.code === item.category_id);
    let subCat = subcategories.find(s => s.id === item.subcategory_id || s.code === item.subcategory_id);

    // If item.category_id matches a subcategory directly (legacy data)
    if (!subCat) {
      subCat = subcategories.find(s => s.id === item.category_id || s.code === item.category_id || s.name === item.category_id);
      if (subCat && !mainCat) {
        mainCat = categories.find(c => c.id === subCat.category_id);
      }
    }

    return {
      mainCatName: mainCat ? mainCat.name : (item.category_name || item.category_id || 'General Spare Parts'),
      subCatName: subCat ? subCat.name : (item.subcategory_name || item.subcategory_id || '—')
    };
  },

  // -------------------------------------------------------------------------
  // 1. ITEM MASTER LIST TAB
  // -------------------------------------------------------------------------
  renderItemMasterTab() {
    this.ensureSeedData();
    const allItems = (window.DB && window.DB.getAll('items')) || [];
    const allCategories = (window.DB && window.DB.getAll('itemCategories')) || [];
    const allSubcats = (window.DB && window.DB.getAll('itemSubcategories')) || [];
    const allBrands = (window.DB && window.DB.getAll('itemBrands')) || [];
    const allVehicles = (window.DB && window.DB.getAll('vehicleModels')) || [];
    const allBalances = (window.DB && window.DB.getAll('inventoryBalances')) || [];
    const allPlants = (window.DB && window.DB.getAll('plants')) || [];

    // Calculate Stock mapping
    const itemStockMap = {};
    allBalances.forEach(b => {
      itemStockMap[b.item_id] = (itemStockMap[b.item_id] || 0) + (Number(b.on_hand) || 0);
    });

    // KPI Metrics
    const totalItems = allItems.length;
    const activeItems = allItems.filter(i => i.status === 'Active' || !i.status).length;
    const lowStockItems = allItems.filter(i => {
      const stock = itemStockMap[i.id] || 0;
      return (i.reorder_level && stock <= i.reorder_level && (i.status === 'Active' || !i.status));
    }).length;
    const warrantyItems = allItems.filter(i => i.warranty_applicable_yn === 'Y' || (i.warranty_period_months && i.warranty_period_months > 0)).length;
    const totalValuation = allBalances.reduce((sum, b) => sum + ((Number(b.on_hand) || 0) * (Number(b.valuation_rate) || 0)), 0);

    // Filter Logic
    if (!this.facilityFilter) this.facilityFilter = 'ALL';
    const q = (this.searchTerm || '').toLowerCase().trim();
    const filtered = allItems.filter(item => {
      if (this.statusFilter !== 'ALL' && (item.status || 'Active') !== this.statusFilter) return false;
      if (this.typeFilter !== 'ALL' && item.item_type !== this.typeFilter) return false;
      if (this.categoryFilter !== 'ALL' && item.category_id !== this.categoryFilter) return false;
      if (this.subcategoryFilter !== 'ALL' && item.subcategory_id !== this.subcategoryFilter) return false;
      if (this.brandFilter !== 'ALL' && item.brand !== this.brandFilter) return false;
      if (this.facilityFilter !== 'ALL') {
        if (!window.DB.isItemMappedToFacility(item, this.facilityFilter)) return false;
      }
      if (this.vehicleFilter !== 'ALL') {
        const vIds = item.vehicle_model_ids || [];
        if (!vIds.includes(this.vehicleFilter)) return false;
      }

      if (q) {
        const matchCode = (item.code || '').toLowerCase().includes(q);
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchPart = (item.part_number || '').toLowerCase().includes(q);
        const matchOem = (item.oem_part_number || '').toLowerCase().includes(q);
        const matchBarcode = (item.barcode || '').toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPart && !matchOem && !matchBarcode && !matchBrand) return false;
      }
      return true;
    });

    const pagedItems = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'itemMaster')
      : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    return `
      <!-- Main Content Card with Toolbar & Table -->
      <div class="content-card">
        <!-- Toolbar Controls -->
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <!-- Search -->
            <div style="position: relative; display: inline-flex; align-items: center;">
              <input 
                type="text" 
                id="item-search-input"
                class="form-control form-control-sm" 
                placeholder="Search code, name, part #..." 
                value="${this.searchTerm}" 
                oninput="window.ItemSetupModule.setSearch(this.value)" 
                style="width: 220px;" 
                autocomplete="off"
              />
              ${this.searchTerm ? `
                <button type="button" onclick="window.ItemSetupModule.setSearch('')" style="position: absolute; right: 8px; background: none; border: none; color: var(--text-muted); cursor: pointer;">&times;</button>
              ` : ''}
            </div>

            <!-- Facility Filter -->
            <select class="form-control form-control-sm" onchange="window.ItemSetupModule.setFacilityFilter(this.value)" style="width: 155px;" title="Filter by Facility Mapping">
              <option value="ALL" ${this.facilityFilter === 'ALL' ? 'selected' : ''}>🏢 All Facilities</option>
              ${allPlants.map(p => `<option value="${p.id}" ${this.facilityFilter === p.id ? 'selected' : ''}>${p.name || p.code}</option>`).join('')}
            </select>

            <!-- Category Filter -->
            <select class="form-control form-control-sm" onchange="window.ItemSetupModule.setCategoryFilter(this.value)" style="width: 145px;">
              <option value="ALL" ${this.categoryFilter === 'ALL' ? 'selected' : ''}>All Categories</option>
              ${allCategories.map(c => `<option value="${c.id}" ${this.categoryFilter === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>

            <!-- Brand Filter -->
            <select class="form-control form-control-sm" onchange="window.ItemSetupModule.setBrandFilter(this.value)" style="width: 130px;">
              <option value="ALL" ${this.brandFilter === 'ALL' ? 'selected' : ''}>All Brands</option>
              ${allBrands.map(b => `<option value="${b.name}" ${this.brandFilter === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
            </select>

            <!-- Status Filter -->
            <select class="form-control form-control-sm" onchange="window.ItemSetupModule.setStatusFilter(this.value)" style="width: 110px;">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
              <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>

            <!-- Reset Button -->
            ${(this.searchTerm || this.categoryFilter !== 'ALL' || this.brandFilter !== 'ALL' || this.statusFilter !== 'ALL' || this.facilityFilter !== 'ALL') ? `
              <button class="btn btn-secondary btn-sm" onclick="window.ItemSetupModule.resetFilters()" title="Reset Filters" style="padding: 0 10px; font-size: 11px; height: 31px;">
                Reset
              </button>
            ` : ''}
          </div>

          <!-- Actions: Export, Import & Register New Item -->
          <div style="display: flex; gap: 8px; align-items: center;">
            <!-- Export Items Button -->
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.ItemSetupModule.exportItemsCsv()" title="Export item master records to CSV" style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
              <span>📤 Export</span>
            </button>

            <!-- Import Items Button -->
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.ItemSetupModule.showImportItemsModal()" title="Bulk import items via CSV file or paste" style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
              <span>📥 Import</span>
            </button>

            <!-- Register New Item Button -->
            <button class="btn btn-primary btn-sm" onclick="window.ItemSetupModule.showItemModal(null, 'BASIC')">
              <span>+ Register New Item</span>
            </button>
          </div>
        </div>

        <!-- Data Table -->
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Part #</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Stock UOM</th>
                <th class="text-right">Stock</th>
                <th class="text-right">Price (₹)</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No items match criteria</div>
                    <div style="font-size: 12px;">Adjust your search or register a new item in the catalog.</div>
                  </td>
                </tr>
              ` : pagedItems.items.map(item => {
                const catInfo = this.resolveCategoryInfo(item);
                const stock = itemStockMap[item.id] || 0;
                const isActive = (item.status === 'Active' || !item.status);

                return `
                  <tr>
                    <td>
                      <span class="cell-mono cell-strong" style="color: var(--primary-300); font-weight: 600;">${item.code}</span>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--text-primary); font-size: 13px;">${item.name}</div>
                      ${item.short_name && item.short_name !== item.name ? `<div style="font-size: 11px; color: var(--text-muted);">${item.short_name}</div>` : ''}
                    </td>
                    <td>
                      <span class="cell-mono" style="font-size: 12px;">${item.part_number || item.oem_part_number || '—'}</span>
                    </td>
                    <td>
                      <div style="font-size: 12px; font-weight: 500;">${catInfo.mainCatName}</div>
                      ${catInfo.subCatName !== '—' ? `<div style="font-size: 10.5px; color: var(--text-muted);">${catInfo.subCatName}</div>` : ''}
                    </td>
                    <td>
                      <span style="font-size: 12px;">${item.brand || 'OEM'}</span>
                    </td>
                    <td>
                      <span class="badge badge-subtle" style="font-size: 10px; font-weight: 600;">${item.stock_uom || item.base_uom || 'NOS'}</span>
                    </td>
                    <td class="text-right">
                      <span style="font-weight: 700; font-size: 13px; color: ${item.reorder_level && stock <= item.reorder_level ? 'var(--color-warning)' : 'var(--text-primary)'};">
                        ${stock.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td class="text-right">
                      <span style="font-weight: 600; font-size: 12.5px;">₹${Number(item.workshop_sale_price || item.sale_price || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 10px; padding: 2px 7px;">
                        ${isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 4px; align-items: center;">
                        <button class="btn btn-icon btn-sm" title="Edit Item" onclick="window.ItemSetupModule.showItemModal('${item.id}', 'BASIC')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate Item' : 'Activate Item'}" onclick="window.ItemSetupModule.toggleItemStatus('${item.id}')">
                          ${isActive ? `
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-warning, #f59e0b);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          ` : `
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success, #10b981);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          `}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Delete Item" style="color: var(--color-danger, #ef4444);" onclick="window.ItemSetupModule.deleteItem('${item.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          totalRecords: filtered.length,
          currentPage: pagedItems.currentPage,
          pageSize: pagedItems.pageSize,
          onPageChange: 'window.ItemSetupModule.setPage(%p%)',
          onPageSizeChange: 'window.ItemSetupModule.setPageSize(%s%)'
        }) : ''}
      </div>
    `;
  },

  setPage(page, key = 'itemMaster') {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPage(key, page);
    }
    this.refresh();
  },

  setPageSize(size, key = 'itemMaster') {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPageSize(key, size);
    }
    this.refresh();
  },

  setSearch(val) {
    this.searchTerm = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemMaster');
    }
    this.refresh();
  },

  setCategoryFilter(val) {
    this.categoryFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemMaster');
    }
    this.refresh();
  },

  setBrandFilter(val) {
    this.brandFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemMaster');
    }
    this.refresh();
  },

  setFacilityFilter(val) {
    this.facilityFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemMaster');
    }
    this.refresh();
  },

  setStatusFilter(val) {
    this.statusFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemMaster');
    }
    this.refresh();
  },

  resetFilters() {
    this.searchTerm = '';
    this.categoryFilter = 'ALL';
    this.subcategoryFilter = 'ALL';
    this.brandFilter = 'ALL';
    this.typeFilter = 'ALL';
    this.vehicleFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.facilityFilter = 'ALL';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemMaster');
    }
    this.refresh();
  },

  refresh() {
    const activeEl = (typeof document !== 'undefined') ? document.activeElement : null;
    const activeId = activeEl ? activeEl.id : null;
    const selStart = activeEl && ('selectionStart' in activeEl) ? activeEl.selectionStart : null;
    const selEnd = activeEl && ('selectionEnd' in activeEl) ? activeEl.selectionEnd : null;

    const container = (typeof document !== 'undefined') ? document.getElementById('store-inventory-subview-container') : null;
    if (container && window.StoreInventoryModule && typeof window.StoreInventoryModule.renderActiveSubView === 'function') {
      container.innerHTML = window.StoreInventoryModule.renderActiveSubView();
    } else if (window.StoreInventoryModule && typeof window.StoreInventoryModule.render === 'function') {
      window.StoreInventoryModule.render();
    }

    if (activeId && typeof document !== 'undefined') {
      const restoredEl = document.getElementById(activeId);
      if (restoredEl && typeof restoredEl.focus === 'function') {
        restoredEl.focus();
        if (selStart !== null && selEnd !== null && typeof restoredEl.setSelectionRange === 'function') {
          try { restoredEl.setSelectionRange(selStart, selEnd); } catch (e) {}
        }
      }
    }
  },

  // -------------------------------------------------------------------------
  // 10-TAB ITEM SETUP MODAL (BRD Section 37 & Sections 8–19)
  // -------------------------------------------------------------------------
  showItemModal(itemId = null, initialTab = 'BASIC') {
    this.ensureSeedData();
    const validTabs = ['BASIC', 'COMPAT', 'UOM', 'TAX', 'JOBCARD', 'WARRANTY', 'AUDIT'];
    this.modalActiveTab = validTabs.includes(initialTab) ? initialTab : 'BASIC';

    if (itemId) {
      const item = window.DB.getById('items', itemId);
      if (!item) {
        if (window.State && window.State.showToast) window.State.showToast('Item not found', 'error');
        return;
      }
      this.editingItemDraft = JSON.parse(JSON.stringify(item));
      if (!Array.isArray(this.editingItemDraft.facility_ids)) {
        if (this.editingItemDraft.facility_id) {
          this.editingItemDraft.facility_ids = [this.editingItemDraft.facility_id];
        } else {
          const allPlants = (window.DB && window.DB.getAll('plants')) || [];
          this.editingItemDraft.facility_ids = allPlants.map(p => p.id);
        }
      }
    } else {
      // Auto-generate code
      const allItems = window.DB.getAll('items') || [];
      const nextNum = String(allItems.length + 1).padStart(4, '0');
      const allPlants = (window.DB && window.DB.getAll('plants')) || [];
      const currentPlant = (window.State && window.State.currentPlantId) || (allPlants[0] ? allPlants[0].id : 'PLANT-01');
      const defaultFacilityIds = allPlants.length > 0 ? allPlants.map(p => p.id) : ['PLANT-01'];
      this.editingItemDraft = {
        id: `ITM-${Date.now()}`,
        code: `ITM-2W-${nextNum}`,
        name: '',
        short_name: '',
        description: '',
        item_type: 'Spare Part',
        category_id: 'CAT-SPARE',
        subcategory_id: 'SUB-BRK',
        brand: 'Bosch',
        manufacturer: 'Bosch India Limited',
        part_number: '',
        oem_part_number: '',
        barcode: '',
        status: 'Active',
        // UOM
        stock_uom: 'NOS',
        base_uom: 'NOS',
        purchase_uom: 'BOX',
        alternate_uom: 'BOX',
        conversion_factor: 10,
        // Tax
        hsn_code: '87141000',
        tax_category: 'Standard GST',
        gst_rate_pct: 0,
        tax_inclusive_yn: 'N',
        // Inventory controls
        min_stock: 5,
        max_stock: 50,
        reorder_level: 10,
        safety_stock: 3,
        lead_time_days: 2,
        stockable_yn: 'Y',
        is_batch_controlled: false,
        is_serial_controlled: false,
        has_expiry: false,
        negative_stock_allowed_yn: 'N',
        // Store mapping
        facility_id: currentPlant,
        facility_ids: defaultFacilityIds,
        default_store_id: 'WH-PUN-MAIN',
        zone_id: 'ZONE-A',
        bin_id: '',
        // Job card
        job_card_applicable_yn: 'Y',
        issue_type: 'Direct Stock Issue',
        tech_issue_allowed_yn: 'Y',
        reservation_allowed_yn: 'Y',
        return_allowed_yn: 'Y',
        // Warranty & Scrap
        warranty_applicable_yn: 'Y',
        warranty_period_months: 6,
        defective_return_applicable_yn: 'Y',
        scrap_authorization_applicable_yn: 'Y',
        // Pricing
        last_purchase_price: 0,
        standard_cost: 0,
        workshop_sale_price: 0,
        mrp: 0,
        min_sale_price: 0,
        discount_allowed_yn: 'Y',
        // Vehicle fitments
        vehicle_model_ids: ['MOD-01', 'MOD-02'],
        created_by: 'Store Manager',
        created_date: new Date().toISOString()
      };
    }

    this.renderModalContent();
  },

  switchModalTab(tabKey) {
    this.captureFormFields();
    this.modalActiveTab = tabKey;
    this.renderModalContent();
  },

  captureFormFields() {
    if (!this.editingItemDraft) return;
    const d = this.editingItemDraft;

    // Capture tab 1 fields
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : undefined;
    };
    const getCheck = (id) => {
      const el = document.getElementById(id);
      return el ? el.checked : undefined;
    };

    if (getVal('item-form-code') !== undefined) d.code = getVal('item-form-code').trim();
    if (getVal('item-form-name') !== undefined) d.name = getVal('item-form-name').trim();
    if (getVal('item-form-short-name') !== undefined) d.short_name = getVal('item-form-short-name').trim();
    if (getVal('item-form-desc') !== undefined) d.description = getVal('item-form-desc').trim();
    if (getVal('item-form-type') !== undefined) d.item_type = getVal('item-form-type');
    if (getVal('item-form-cat') !== undefined) d.category_id = getVal('item-form-cat');
    if (getVal('item-form-subcat') !== undefined) d.subcategory_id = getVal('item-form-subcat');
    if (getVal('item-form-brand') !== undefined) d.brand = getVal('item-form-brand').trim();
    if (getVal('item-form-mfg') !== undefined) d.manufacturer = getVal('item-form-mfg').trim();
    if (getVal('item-form-part-no') !== undefined) d.part_number = getVal('item-form-part-no').trim();
    if (getVal('item-form-oem-no') !== undefined) d.oem_part_number = getVal('item-form-oem-no').trim();
    if (getVal('item-form-barcode') !== undefined) d.barcode = getVal('item-form-barcode').trim();
    if (getVal('item-form-status') !== undefined) d.status = getVal('item-form-status');

    // UOM tab
    if (getVal('item-form-uom') !== undefined) {
      d.stock_uom = getVal('item-form-uom');
      d.base_uom = d.stock_uom;
    }
    if (getVal('item-form-purchase-uom') !== undefined) d.purchase_uom = getVal('item-form-purchase-uom');
    if (getVal('item-form-alt-uom') !== undefined) d.alternate_uom = getVal('item-form-alt-uom');
    if (getVal('item-form-uom-conv') !== undefined) d.conversion_factor = Number(getVal('item-form-uom-conv')) || 1;

    // Tax tab
    if (getVal('item-form-hsn') !== undefined) d.hsn_code = getVal('item-form-hsn');
    if (getVal('item-form-gst') !== undefined) d.gst_rate_pct = getVal('item-form-gst') !== '' ? Number(getVal('item-form-gst')) : 0;
    if (getVal('item-form-tax-incl') !== undefined) d.tax_inclusive_yn = getVal('item-form-tax-incl');

    // Inventory tab
    if (getVal('item-form-min-stock') !== undefined) d.min_stock = Number(getVal('item-form-min-stock')) || 0;
    if (getVal('item-form-max-stock') !== undefined) d.max_stock = Number(getVal('item-form-max-stock')) || 0;
    if (getVal('item-form-rop') !== undefined) d.reorder_level = Number(getVal('item-form-rop')) || 0;
    if (getVal('item-form-safety') !== undefined) d.safety_stock = Number(getVal('item-form-safety')) || 0;
    if (getVal('item-form-lead') !== undefined) d.lead_time_days = Number(getVal('item-form-lead')) || 1;
    if (getCheck('item-form-batch') !== undefined) d.is_batch_controlled = getCheck('item-form-batch');
    if (getCheck('item-form-serial') !== undefined) d.is_serial_controlled = getCheck('item-form-serial');
    if (getCheck('item-form-expiry') !== undefined) d.has_expiry = getCheck('item-form-expiry');

    // Store tab
    if (getVal('item-form-fac') !== undefined) d.facility_id = getVal('item-form-fac');
    if (getVal('item-form-store') !== undefined) d.default_store_id = getVal('item-form-store');
    if (getVal('item-form-zone') !== undefined) d.zone_id = getVal('item-form-zone');
    if (getVal('item-form-bin') !== undefined) d.bin_id = getVal('item-form-bin');

    // Job Card tab
    if (getVal('item-form-jc-app') !== undefined) d.job_card_applicable_yn = getVal('item-form-jc-app');
    if (getVal('item-form-jc-issue-type') !== undefined) d.issue_type = getVal('item-form-jc-issue-type');
    if (getCheck('item-form-jc-tech') !== undefined) d.tech_issue_allowed_yn = getCheck('item-form-jc-tech') ? 'Y' : 'N';
    if (getCheck('item-form-jc-res') !== undefined) d.reservation_allowed_yn = getCheck('item-form-jc-res') ? 'Y' : 'N';
    if (getCheck('item-form-jc-ret') !== undefined) d.return_allowed_yn = getCheck('item-form-jc-ret') ? 'Y' : 'N';

    // Warranty tab
    if (getVal('item-form-warranty-app') !== undefined) d.warranty_applicable_yn = getVal('item-form-warranty-app');
    if (getVal('item-form-warranty-months') !== undefined) d.warranty_period_months = Number(getVal('item-form-warranty-months')) || 0;
    if (getCheck('item-form-defect-ret') !== undefined) d.defective_return_applicable_yn = getCheck('item-form-defect-ret') ? 'Y' : 'N';
    if (getCheck('item-form-scrap-auth') !== undefined) d.scrap_authorization_applicable_yn = getCheck('item-form-scrap-auth') ? 'Y' : 'N';

    // Pricing tab
    if (getVal('item-form-cost') !== undefined) {
      d.standard_cost = Number(getVal('item-form-cost')) || 0;
      d.last_purchase_price = d.standard_cost;
    }
    if (getVal('item-form-price') !== undefined) {
      d.workshop_sale_price = Number(getVal('item-form-price')) || 0;
      d.sale_price = d.workshop_sale_price;
    }
    if (getVal('item-form-mrp') !== undefined) d.mrp = Number(getVal('item-form-mrp')) || 0;
    if (getVal('item-form-min-price') !== undefined) d.min_sale_price = Number(getVal('item-form-min-price')) || 0;
    if (getCheck('item-form-discount') !== undefined) d.discount_allowed_yn = getCheck('item-form-discount') ? 'Y' : 'N';

    // Vehicle checkboxes
    const vehicleCheckboxes = document.querySelectorAll('input[name="item-fitment-model"]:checked');
    if (vehicleCheckboxes.length > 0 || document.querySelector('input[name="item-fitment-model"]')) {
      d.vehicle_model_ids = Array.from(vehicleCheckboxes).map(cb => cb.value);
    }

    // Facility Mapping checkboxes
    const facCheckboxes = document.querySelectorAll('input[name="item-facility-mapping"]:checked');
    if (facCheckboxes.length > 0 || document.querySelector('input[name="item-facility-mapping"]')) {
      d.facility_ids = Array.from(facCheckboxes).map(cb => cb.value);
      if (d.facility_ids.length > 0) {
        d.facility_id = d.facility_ids[0];
      }
    }
  },

  onCategoryChange(catId) {
    this.captureFormFields();
    if (this.editingItemDraft) {
      this.editingItemDraft.category_id = catId;
      // Pre-select first valid subcategory
      const subcats = (window.DB && window.DB.getAll('itemSubcategories')) || [];
      const valid = subcats.filter(s => s.category_id === catId);
      if (valid.length > 0) {
        this.editingItemDraft.subcategory_id = valid[0].id;
      }
    }
    this.renderModalContent();
  },

  renderModalContent() {
    const item = this.editingItemDraft;
    if (!item) return;

    const allCats = (window.DB && window.DB.getAll('itemCategories')) || [];
    const allSubcats = (window.DB && window.DB.getAll('itemSubcategories')) || [];
    const allBrands = (window.DB && window.DB.getAll('itemBrands')) || [];
    const allMfgs = (window.DB && window.DB.getAll('itemManufacturers')) || [];
    const allUoms = (window.DB && window.DB.getAll('uoms')) || [];
    const allHsns = (window.DB && window.DB.getAll('hsnCodes')) || [];
    const allVehicles = (window.DB && window.DB.getAll('vehicleModels')) || [];
    const allPlants = (window.DB && window.DB.getAll('plants')) || [];
    const allStores = (window.DB && window.DB.getAll('warehouses')) || [];
    const allZones = (window.DB && window.DB.getAll('zones')) || [];
    const allBins = (window.DB && window.DB.getAll('bins')) || [];

    const activeCatSubcats = allSubcats.filter(s => s.category_id === item.category_id);
    const selectedFacIds = Array.isArray(item.facility_ids)
      ? item.facility_ids
      : (item.facility_id ? [item.facility_id] : (allPlants.length > 0 ? allPlants.map(p => p.id) : ['PLANT-01']));

    const selectedPlants = allPlants.filter(p => selectedFacIds.includes(p.id));
    let initialFacilityLabel = 'Select Mapped Facilities (Required)...';
    if (selectedPlants.length === 1) {
      initialFacilityLabel = `📍 ${selectedPlants[0].name}`;
    } else if (selectedPlants.length === allPlants.length && allPlants.length > 0) {
      initialFacilityLabel = `📍 All ${allPlants.length} Facilities Mapped`;
    } else if (selectedPlants.length > 1) {
      initialFacilityLabel = `📍 ${selectedPlants[0].name} (+${selectedPlants.length - 1} more)`;
    }

    // Tab definitions (Basic, Vehicle Compatibility, UOM, Tax, Job Card, Warranty, Audit)
    const tabs = [
      { key: 'BASIC', label: 'Basic Information' },
      { key: 'COMPAT', label: 'Vehicle Compatibility' },
      { key: 'UOM', label: 'UOM Management' },
      { key: 'TAX', label: 'Tax & GST' },
      { key: 'JOBCARD', label: 'Job Card Applicability' },
      { key: 'WARRANTY', label: 'Warranty & Scrap' },
      { key: 'AUDIT', label: 'Audit History' }
    ];

    const contentHtml = `
      <form id="item-setup-modal-form" onsubmit="event.preventDefault(); window.ItemSetupModule.saveItem();" style="display: flex; flex-direction: column; min-height: 540px;">
        <!-- Top 10-Tab Navigation Bar -->
        <div class="tabs-header modal-tabs-header" style="display: flex; gap: 4px; overflow-x: auto; padding: 4px; background: rgba(0,0,0,0.22); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 16px; white-space: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
          ${tabs.map(t => `
            <button 
              type="button" 
              class="btn btn-sm ${this.modalActiveTab === t.key ? 'btn-primary' : 'btn-ghost'}" 
              onclick="window.ItemSetupModule.switchModalTab('${t.key}')"
              style="font-size: 11.5px; font-weight: 600; padding: 6px 12px; border-radius: 6px;"
            >
              ${t.label}
            </button>
          `).join('')}
        </div>

        <!-- Tab 1: BASIC INFORMATION -->
        <div id="tab-pane-basic" style="display: ${this.modalActiveTab === 'BASIC' ? 'block' : 'none'};">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Item Code <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="item-form-code" class="form-control cell-mono" value="${item.code || ''}" required placeholder="e.g. ITM-2W-001" />
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Item Name <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="item-form-name" class="form-control" value="${item.name || ''}" required placeholder="e.g. Front Brake Shoe (Standard Activa 6G / Deluxe)" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Short Display Name</label>
              <input type="text" id="item-form-short-name" class="form-control" value="${item.short_name || ''}" placeholder="e.g. Fr Brake Shoe" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Item Type <span style="color: var(--color-danger)">*</span></label>
              <select id="item-form-type" class="form-control">
                ${['Spare Part', 'Consumable', 'Accessory', 'Lubricant', 'Battery', 'Tyre', 'Tool', 'Workshop Equipment'].map(tp => `
                  <option value="${tp}" ${item.item_type === tp ? 'selected' : ''}>${tp}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Main Category <span style="color: var(--color-danger)">*</span></label>
              <select id="item-form-cat" class="form-control" onchange="window.ItemSetupModule.onCategoryChange(this.value)" required>
                ${allCats.map(c => `<option value="${c.id}" ${item.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Sub-Category <span style="color: var(--color-danger)">*</span></label>
              <select id="item-form-subcat" class="form-control" required>
                ${activeCatSubcats.length === 0 ? `<option value="">(No subcategories)</option>` : activeCatSubcats.map(s => `
                  <option value="${s.id}" ${item.subcategory_id === s.id ? 'selected' : ''}>${s.name}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Brand</label>
              <select id="item-form-brand" class="form-control">
                <option value="OEM" ${item.brand === 'OEM' ? 'selected' : ''}>OEM Genuine</option>
                ${allBrands.map(b => `<option value="${b.name}" ${item.brand === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Manufacturer</label>
              <select id="item-form-mfg" class="form-control">
                ${allMfgs.map(m => `<option value="${m.name}" ${item.manufacturer === m.name ? 'selected' : ''}>${m.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Manufacturer / Aftermarket Part #</label>
              <input type="text" id="item-form-part-no" class="form-control cell-mono" value="${item.part_number || ''}" placeholder="e.g. BS-ACT-001" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">OEM Part #</label>
              <input type="text" id="item-form-oem-no" class="form-control cell-mono" value="${item.oem_part_number || ''}" placeholder="e.g. 06455-K81-901" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Barcode / EAN</label>
              <input type="text" id="item-form-barcode" class="form-control cell-mono" value="${item.barcode || ''}" placeholder="Scan barcode..." />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Status</label>
              <select id="item-form-status" class="form-control">
                <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
              </select>
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Item Technical Description</label>
              <textarea id="item-form-desc" class="form-control" rows="2" placeholder="Full part specifications, fitment details, compound material...">${item.description || ''}</textarea>
            </div>

            <!-- Facility Mapping Dropdown with Checkbox (Same functionality as Store Master) -->
            <div class="form-group" style="grid-column: span 3; position: relative;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">
                Facility Mapping <span style="color: var(--color-danger)">*</span>
              </label>
              <div style="position: relative;">
                <button 
                  type="button" 
                  id="item-facility-dropdown-btn" 
                  class="form-control" 
                  style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; text-align: left; height: 38px;" 
                  onclick="event.stopPropagation(); window.ItemSetupModule.toggleFacilityDropdown();"
                >
                  <span id="item-facility-dropdown-label" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px;">
                    ${initialFacilityLabel}
                  </span>
                  <span style="font-size: 10px; color: var(--text-muted); margin-left: 6px;">▼</span>
                </button>

                <div 
                  id="item-facility-dropdown-panel" 
                  class="facility-dropdown-panel" 
                  style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 1050; background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); box-shadow: 0 10px 25px rgba(0,0,0,0.4); max-height: 220px; overflow-y: auto; padding: 6px;"
                  onclick="event.stopPropagation();"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 6px 8px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px;">
                    <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Select Facilities</span>
                    <div style="display: flex; gap: 8px;">
                      <a href="javascript:void(0)" onclick="window.ItemSetupModule.bulkSelectFacilities(true)" style="font-size: 11px; color: var(--primary-400); text-decoration: underline;">Select All</a>
                      <a href="javascript:void(0)" onclick="window.ItemSetupModule.bulkSelectFacilities(false)" style="font-size: 11px; color: var(--text-muted); text-decoration: underline;">Clear</a>
                    </div>
                  </div>
                  ${allPlants.length === 0 ? `
                    <div style="color: var(--text-muted); font-size: 12px; padding: 8px;">No facilities available.</div>
                  ` : allPlants.map(plant => {
                    const isChecked = selectedFacIds.includes(plant.id);
                    return `
                      <label style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: background 0.15s;" onmouseover="this.style.background='rgba(99,102,241,0.08)'" onmouseout="this.style.background='transparent'">
                        <input 
                          type="checkbox" 
                          name="item-facility-mapping" 
                          value="${plant.id}" 
                          ${isChecked ? 'checked' : ''} 
                          onchange="window.ItemSetupModule.updateFacilityDropdownLabel()" 
                          style="accent-color: var(--primary-500); width: 15px; height: 15px; cursor: pointer;"
                        />
                        <span>📍 <strong>${plant.name}</strong> ${plant.city ? `<span style="color: var(--text-muted); font-size: 10.5px;">(${plant.city})</span>` : (plant.code ? `<span style="color: var(--text-muted); font-size: 10.5px;">(${plant.code})</span>` : '')}</span>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                The item will be available for inventory, job cards, requisitions and billing only at the mapped facilities.
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: VEHICLE COMPATIBILITY -->
        <div id="tab-pane-compat" style="display: ${this.modalActiveTab === 'COMPAT' ? 'block' : 'none'};">
          <div style="background: rgba(99, 102, 241, 0.05); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 14px;">
            <div style="font-weight: 600; font-size: 13px; color: var(--primary-300);">Two-Wheeler Vehicle Fitment Matrix (BRD Section 11)</div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
              Check all vehicles that this item is certified compatible with. Leave all unchecked if universal fitment.
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; max-height: 380px; overflow-y: auto; padding-right: 6px;">
            ${allVehicles.map(v => {
              const isChecked = (item.vehicle_model_ids || []).includes(v.id);
              return `
                <label style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid ${isChecked ? 'var(--primary-500)' : 'var(--border-subtle)'}; background: ${isChecked ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)'}; cursor: pointer;">
                  <input type="checkbox" name="item-fitment-model" value="${v.id}" ${isChecked ? 'checked' : ''} style="accent-color: var(--primary-500); width: 16px; height: 16px;" />
                  <div>
                    <div style="font-size: 12.5px; font-weight: 600; color: var(--text-primary);">${v.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${v.variant || 'Standard'} &bull; ${v.displacement_cc || 110}cc (${v.fuel_type || 'Petrol'})</div>
                    <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">Years: ${v.year_from || 2020} – ${v.year_to || 2026}</div>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Tab 3: UOM MANAGEMENT -->
        <div id="tab-pane-uom" style="display: ${this.modalActiveTab === 'UOM' ? 'block' : 'none'};">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Primary Stock UOM <span style="color: var(--color-danger)">*</span></label>
              <select id="item-form-uom" class="form-control" required>
                ${allUoms.map(u => `<option value="${u.code}" ${(item.stock_uom || item.base_uom) === u.code ? 'selected' : ''}>${u.code} - ${u.name}</option>`).join('')}
              </select>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Single source of truth for stock ledger and counts</div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Purchase Procurement UOM</label>
              <select id="item-form-purchase-uom" class="form-control">
                ${allUoms.map(u => `<option value="${u.code}" ${item.purchase_uom === u.code ? 'selected' : ''}>${u.code} - ${u.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Alternate Package UOM</label>
              <select id="item-form-alt-uom" class="form-control">
                ${allUoms.map(u => `<option value="${u.code}" ${item.alternate_uom === u.code ? 'selected' : ''}>${u.code} - ${u.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">UOM Conversion Factor (BRD Section 12)</label>
              <input type="number" id="item-form-uom-conv" class="form-control" value="${item.conversion_factor || 1}" min="0.001" step="any" />
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">e.g. 1 ${item.alternate_uom || 'BOX'} = ${item.conversion_factor || 10} ${item.stock_uom || 'PCS'}</div>
            </div>
          </div>
        </div>

        <!-- Tab 4: TAX & GST -->
        <div id="tab-pane-tax" style="display: ${this.modalActiveTab === 'TAX' ? 'block' : 'none'};">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">HSN / SAC Master Code <span style="color: var(--color-danger)">*</span></label>
              <select id="item-form-hsn" class="form-control" required>
                ${allHsns.map(h => `<option value="${h.code}" ${item.hsn_code === h.code ? 'selected' : ''}>${h.code} &mdash; ${h.description} (${h.gst_rate}% GST)</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">GST Rate % <span style="color: var(--color-danger)">*</span></label>
              <select id="item-form-gst" class="form-control">
                ${(window.DB && typeof window.DB.renderTaxSelectOptions === 'function')
                  ? window.DB.renderTaxSelectOptions(item.gst_rate_pct !== undefined ? item.gst_rate_pct : 0)
                  : `<option value="${item.gst_rate_pct !== undefined ? item.gst_rate_pct : 0}" selected>${item.gst_rate_pct !== undefined ? item.gst_rate_pct : 0}% GST</option>`}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Tax Calculation Basis</label>
              <select id="item-form-tax-incl" class="form-control">
                <option value="N" ${item.tax_inclusive_yn === 'N' ? 'selected' : ''}>Tax Exclusive (Base Price + GST)</option>
                <option value="Y" ${item.tax_inclusive_yn === 'Y' ? 'selected' : ''}>Tax Inclusive (MRP incorporates GST)</option>
              </select>
            </div>
          </div>
        </div>



        <!-- Tab 7: JOB CARD APPLICABILITY -->
        <div id="tab-pane-jobcard" style="display: ${this.modalActiveTab === 'JOBCARD' ? 'block' : 'none'};">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Applicable to Job Card (BRD Section 18)</label>
              <select id="item-form-jc-app" class="form-control">
                <option value="Y" ${item.job_card_applicable_yn === 'Y' ? 'selected' : ''}>Yes &mdash; Issuable in Job Card</option>
                <option value="N" ${item.job_card_applicable_yn === 'N' ? 'selected' : ''}>No &mdash; Counter Sale or Internal Only</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Material Issue Classification</label>
              <select id="item-form-jc-issue-type" class="form-control">
                <option value="Direct Stock Issue" ${item.issue_type === 'Direct Stock Issue' ? 'selected' : ''}>Direct Stock Issue (Billed Spare Part)</option>
                <option value="Consumable" ${item.issue_type === 'Consumable' ? 'selected' : ''}>Shop Floor Consumable (Overhead)</option>
              </select>
            </div>

            <div class="form-group" style="grid-column: span 2; padding: 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <div style="font-weight: 600; font-size: 12px; color: var(--text-primary); margin-bottom: 8px;">Workshop Workflow Controls</div>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
                  <input type="checkbox" id="item-form-jc-tech" ${item.tech_issue_allowed_yn !== 'N' ? 'checked' : ''} /> Technician Direct Issue Allowed
                </label>
                <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
                  <input type="checkbox" id="item-form-jc-res" ${item.reservation_allowed_yn !== 'N' ? 'checked' : ''} /> Stock Reservation Permitted
                </label>
                <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
                  <input type="checkbox" id="item-form-jc-ret" ${item.return_allowed_yn !== 'N' ? 'checked' : ''} /> Unused Parts Return Allowed
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 8: WARRANTY & SCRAP -->
        <div id="tab-pane-warranty" style="display: ${this.modalActiveTab === 'WARRANTY' ? 'block' : 'none'};">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Warranty Applicable</label>
              <select id="item-form-warranty-app" class="form-control">
                <option value="Y" ${item.warranty_applicable_yn === 'Y' ? 'selected' : ''}>Yes &mdash; Warranty Eligible</option>
                <option value="N" ${item.warranty_applicable_yn === 'N' ? 'selected' : ''}>No Warranty</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Warranty Period (Months)</label>
              <input type="number" id="item-form-warranty-months" class="form-control" value="${item.warranty_period_months || 0}" min="0" />
            </div>

            <div class="form-group" style="grid-column: span 2; padding: 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <div style="font-weight: 600; font-size: 12px; color: var(--text-primary); margin-bottom: 8px;">Warranty & Scrap Governance</div>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
                  <input type="checkbox" id="item-form-defect-ret" ${item.defective_return_applicable_yn !== 'N' ? 'checked' : ''} /> Defective Replacement Return Required
                </label>
                <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
                  <input type="checkbox" id="item-form-scrap-auth" ${item.scrap_authorization_applicable_yn !== 'N' ? 'checked' : ''} /> Scrap Disposal Authorization Required
                </label>
              </div>
            </div>
          </div>
        </div>



        <!-- Tab 10: AUDIT HISTORY -->
        <div id="tab-pane-audit" style="display: ${this.modalActiveTab === 'AUDIT' ? 'block' : 'none'};">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px;">
            <div style="font-weight: 600; font-size: 13px; color: var(--primary-300); margin-bottom: 8px;">Audit History & Traceability (BRD Section 29)</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
              <div><strong>Created By:</strong> ${item.created_by || 'System Administrator'}</div>
              <div><strong>Created Date:</strong> ${item.created_date ? window.formatDateTime(item.created_date) : 'Baseline Upload'}</div>
              <div><strong>Last Updated By:</strong> ${item.updated_by || '—'}</div>
              <div><strong>Last Updated Date:</strong> ${item.updated_date ? window.formatDateTime(item.updated_date) : '—'}</div>
              <div><strong>Current Status:</strong> <span class="badge ${item.status === 'Active' ? 'badge-success' : 'badge-danger'}">${item.status || 'Active'}</span></div>
            </div>
          </div>
        </div>

        <!-- Modal Bottom Actions (Sticky Bar) -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border-subtle); position: sticky; bottom: 0; background: var(--bg-modal, #111827); z-index: 5;">
          <div style="font-size: 11.5px; color: var(--text-muted);">
            Tab: <strong>${tabs.find(t => t.key === this.modalActiveTab)?.label}</strong>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="padding: 8px 24px; font-weight: 600;">
              <span>Save Item Configuration</span>
            </button>
          </div>
        </div>
      </form>
    `;

    window.State.showModal({
      title: item.name ? `Item Specification: ${item.name} (${item.code})` : `Register New Inventory Item (${item.code})`,
      isFullScreen: true,
      maxWidth: '96vw',
      contentHtml,
      footerHtml: null
    });

  },

  saveItem() {
    this.captureFormFields();
    const item = this.editingItemDraft;
    if (!item) return;

    // Facility validation: At least one facility mapped
    const facIds = Array.isArray(item.facility_ids) ? item.facility_ids : (item.facility_id ? [item.facility_id] : []);
    if (facIds.length === 0) {
      window.State.showToast(`Validation Error: Please map this item to at least one Facility!`, 'error');
      this.switchModalTab('BASIC');
      return;
    }
    item.facility_ids = facIds;
    item.facility_id = facIds[0];

    // BR-01: Item Code must be unique
    const allItems = window.DB.getAll('items') || [];
    const duplicateCode = allItems.find(i => i.id !== item.id && (i.code || '').toLowerCase() === (item.code || '').toLowerCase());
    if (duplicateCode) {
      window.State.showToast(`Validation Error (BR-01): Item code "${item.code}" already exists!`, 'error');
      return;
    }

    // BR-02: Item Name is mandatory
    if (!item.name || !item.name.trim()) {
      window.State.showToast(`Validation Error (BR-02): Item Name is mandatory!`, 'error');
      return;
    }

    // BR-03: Category & Sub-Category are mandatory
    if (!item.category_id || !item.subcategory_id) {
      window.State.showToast(`Validation Error (BR-03): Category and Sub-Category are mandatory!`, 'error');
      return;
    }

    // Section 21 / BR-08: Duplicate Part Number check warning
    if (item.part_number && item.part_number.trim()) {
      const pNo = item.part_number.trim().toLowerCase();
      const duplicatePart = allItems.find(i => i.id !== item.id && (i.part_number || '').trim().toLowerCase() === pNo && (i.brand || '').toLowerCase() === (item.brand || '').toLowerCase());
      if (duplicatePart) {
        window.State.showToast(`Duplicate Warning (BR-08): Part number "${item.part_number}" already registered for brand ${item.brand}. Saved with notice.`, 'warning');
      }
    }

    // Audit stamps
    item.updated_by = window.State && window.State.getCurrentUser ? (window.State.getCurrentUser()?.full_name || 'Store Manager') : 'Store Manager';
    item.updated_date = new Date().toISOString();

    window.DB.upsert('items', item);
    window.DB.emitChange('items');
    window.State.closeModal();
    window.State.showToast(`Item "${item.name}" saved successfully!`, 'success');
    this.refresh();
  },

  toggleFacilityDropdown() {
    const panel = document.getElementById('item-facility-dropdown-panel');
    if (!panel) return;
    const isShown = panel.style.display !== 'none';
    panel.style.display = isShown ? 'none' : 'block';
  },

  updateFacilityDropdownLabel() {
    const labelSpan = document.getElementById('item-facility-dropdown-label');
    if (!labelSpan) return;

    const checkboxes = Array.from(document.querySelectorAll('input[name="item-facility-mapping"]:checked'));
    const allPlants = (window.DB && window.DB.getAll('plants')) || [];

    if (checkboxes.length === 0) {
      labelSpan.innerHTML = '<span style="color: var(--color-danger); font-style: italic;">Select Mapped Facilities (Required) *</span>';
    } else if (checkboxes.length === 1) {
      const p = allPlants.find(x => x.id === checkboxes[0].value);
      labelSpan.innerText = p ? `📍 ${p.name}` : `📍 1 Facility Selected`;
    } else if (checkboxes.length === allPlants.length && allPlants.length > 0) {
      labelSpan.innerText = `📍 All ${allPlants.length} Facilities Mapped`;
    } else {
      const firstP = allPlants.find(x => x.id === checkboxes[0].value);
      const firstName = firstP ? firstP.name : 'Facility';
      labelSpan.innerText = `📍 ${firstName} (+${checkboxes.length - 1} more)`;
    }

    if (this.editingItemDraft) {
      this.editingItemDraft.facility_ids = checkboxes.map(cb => cb.value);
      if (this.editingItemDraft.facility_ids.length > 0) {
        this.editingItemDraft.facility_id = this.editingItemDraft.facility_ids[0];
      }
    }
  },

  bulkSelectFacilities(selectAll) {
    const checkboxes = document.querySelectorAll('input[name="item-facility-mapping"]');
    checkboxes.forEach(cb => { cb.checked = !!selectAll; });
    this.updateFacilityDropdownLabel();
  },

  toggleItemStatus(itemId) {
    const item = window.DB.getById('items', itemId);
    if (!item) return;
    item.status = item.status === 'Active' ? 'Inactive' : 'Active';
    item.updated_date = new Date().toISOString();
    window.DB.upsert('items', item);
    window.DB.emitChange('items');
    window.State.showToast(`Item "${item.name}" status updated to ${item.status}.`);
    this.refresh();
  },

  deleteItem(itemId) {
    const item = window.DB.getById('items', itemId);
    if (!item) return;

    // BR-09: Item cannot be deleted if used in transactions
    const balances = window.DB.getAll('inventoryBalances') || [];
    const hasStock = balances.some(b => b.item_id === itemId && Number(b.on_hand) > 0);
    if (hasStock) {
      window.State.showToast(`Business Rule (BR-09): Item cannot be deleted because it has on-hand stock or transaction history. Deactivate instead.`, 'error');
      return;
    }

    if (confirm(`Are you sure you want to permanently delete item "${item.name}"?`)) {
      window.DB.delete('items', itemId);
      window.DB.emitChange('items');
      window.State.showToast(`Item deleted successfully.`);
      this.refresh();
    }
  },

  // -------------------------------------------------------------------------
  // ITEM MASTER EXPORT & BULK IMPORT HANDLERS
  // -------------------------------------------------------------------------
  exportItemsCsv() {
    this.ensureSeedData();
    const allItems = (window.DB && typeof window.DB.getAll === 'function')
      ? (window.DB.getAll('items') || [])
      : [];

    if (allItems.length === 0) {
      if (window.State && window.State.showToast) {
        window.State.showToast('No items available to export.', 'warning');
      }
      return;
    }

    // Apply active filters if any
    const q = (this.searchTerm || '').toLowerCase().trim();
    const itemsToExport = allItems.filter(item => {
      if (this.statusFilter !== 'ALL' && (item.status || 'Active') !== this.statusFilter) return false;
      if (this.typeFilter !== 'ALL' && item.item_type !== this.typeFilter) return false;
      if (this.categoryFilter !== 'ALL' && item.category_id !== this.categoryFilter) return false;
      if (this.subcategoryFilter !== 'ALL' && item.subcategory_id !== this.subcategoryFilter) return false;
      if (this.brandFilter !== 'ALL' && item.brand !== this.brandFilter) return false;
      if (this.facilityFilter !== 'ALL') {
        if (!window.DB.isItemMappedToFacility(item, this.facilityFilter)) return false;
      }
      if (this.vehicleFilter !== 'ALL') {
        const vIds = item.vehicle_model_ids || [];
        if (!vIds.includes(this.vehicleFilter)) return false;
      }
      if (q) {
        const matchCode = (item.code || '').toLowerCase().includes(q);
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchPart = (item.part_number || '').toLowerCase().includes(q);
        const matchOem = (item.oem_part_number || '').toLowerCase().includes(q);
        const matchBarcode = (item.barcode || '').toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPart && !matchOem && !matchBarcode && !matchBrand) return false;
      }
      return true;
    });

    const list = itemsToExport.length > 0 ? itemsToExport : allItems;
    const allPlants = (window.DB && window.DB.getAll('plants')) || [];

    const headers = [
      'Item Code',
      'Item Name',
      'Short Name',
      'Item Type',
      'Category',
      'Subcategory',
      'Brand',
      'Manufacturer',
      'Part Number',
      'OEM Part Number',
      'Barcode',
      'Stock UOM',
      'Purchase UOM',
      'Facilities',
      'HSN Code',
      'GST Rate (%)',
      'Warranty Applicable',
      'Warranty Months',
      'Status'
    ];

    const rows = list.map(item => {
      const catInfo = this.resolveCategoryInfo(item);
      const facList = Array.isArray(item.facility_ids) ? item.facility_ids : (item.facility_id ? [item.facility_id] : []);
      const facNames = facList.map(fId => {
        const p = allPlants.find(x => x.id === fId);
        return p ? (p.code || p.name) : fId;
      }).join('; ');

      return [
        `"${(item.code || '').replace(/"/g, '""')}"`,
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"${(item.short_name || '').replace(/"/g, '""')}"`,
        `"${(item.item_type || 'Spare Part').replace(/"/g, '""')}"`,
        `"${(catInfo.mainCatName || '').replace(/"/g, '""')}"`,
        `"${(catInfo.subCatName || '').replace(/"/g, '""')}"`,
        `"${(item.brand || '').replace(/"/g, '""')}"`,
        `"${(item.manufacturer || '').replace(/"/g, '""')}"`,
        `"${(item.part_number || '').replace(/"/g, '""')}"`,
        `"${(item.oem_part_number || '').replace(/"/g, '""')}"`,
        `"${(item.barcode || '').replace(/"/g, '""')}"`,
        `"${(item.stock_uom || item.base_uom || 'NOS').replace(/"/g, '""')}"`,
        `"${(item.purchase_uom || item.stock_uom || 'NOS').replace(/"/g, '""')}"`,
        `"${facNames.replace(/"/g, '""')}"`,
        `"${(item.hsn_code || '87141000').replace(/"/g, '""')}"`,
        item.gst_rate_pct !== undefined ? item.gst_rate_pct : (item.gst_rate !== undefined ? item.gst_rate : 18),
        item.warranty_applicable_yn || 'N',
        item.warranty_period_months || 0,
        `"${item.status || 'Active'}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Item_Master_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.State && window.State.showToast) {
      window.State.showToast(`Exported ${list.length} item records to CSV.`, 'success');
    }
  },

  downloadItemSampleCsv() {
    const headers = [
      'Item Code',
      'Item Name',
      'Short Name',
      'Item Type',
      'Category',
      'Subcategory',
      'Brand',
      'Manufacturer',
      'Part Number',
      'OEM Part Number',
      'Stock UOM',
      'Purchase UOM',
      'Facilities',
      'HSN Code',
      'GST Rate (%)',
      'Warranty Applicable',
      'Warranty Months',
      'Status'
    ];

    const sampleRows = [
      ['2W-BRK-PAD-01', 'Front Disc Brake Pad Set - Activa / Jupiter / Access', 'Front Brake Pad Set', 'Spare Part', 'Spare Parts', 'Brake Parts', 'Nissin / OEM', 'Honda Motor Co.', '06455-KWP-D01', '06455-KWP-D01', 'SET', 'BOX', 'PLANT-01; PLANT-02', '87141000', '18', 'Y', '6', 'Active'],
      ['2W-BRK-SHO-01', 'Rear Brake Shoe Set - Activa 6G / Splendor Plus', 'Rear Brake Shoe Set', 'Spare Part', 'Spare Parts', 'Brake Parts', 'Endurance', 'Endurance Technologies', '43125-KRP-980', '43125-KRP-980', 'SET', 'BOX', 'PLANT-01; PLANT-02', '87141000', '18', 'Y', '6', 'Active'],
      ['2W-LUB-10W30-01', '4T 10W-30 Premium Engine Oil (1L Bottle)', 'Engine Oil 10W-30 1L', 'Lubricant', 'Lubricants', 'Engine Oil', 'Castrol Activ', 'Castrol India Ltd', 'CAS-10W30-1L', 'CAS-4T-10W30', 'BTL', 'CARTON', 'PLANT-01; PLANT-02; PLANT-03', '27101981', '18', 'N', '0', 'Active'],
      ['2W-FLT-AIR-01', 'Foam Air Filter Element - Activa 6G', 'Activa 6G Foam Air Filter', 'Spare Part', 'Spare Parts', 'Filters', 'Honda Genuine', 'Honda Motorcycle & Scooter India', '17210-KWP-D00', '17210-KWP-D00', 'NOS', 'BOX', 'PLANT-01', '87141000', '18', 'N', '0', 'Active'],
      ['2W-TRN-BLT-01', 'CVT Variator Drive Belt - Activa 6G / Dio', 'CVT Variator Drive Belt', 'Spare Part', 'Spare Parts', 'Transmission Parts', 'Bando', 'Bando Chemical Industries', '23100-KWP-D01', '23100-KWP-D01', 'NOS', 'BOX', 'PLANT-01; PLANT-02', '87141000', '18', 'Y', '6', 'Active'],
      ['2W-SPK-PLG-01', 'Resistor Spark Plug CPR8EA-9', 'NGK Spark Plug CPR8EA-9', 'Spare Part', 'Spare Parts', 'Engine Parts', 'NGK', 'NGK Spark Plugs India', 'CPR8EA-9', '31918-KWP-D01', 'NOS', 'BOX', 'PLANT-01; PLANT-03', '85111000', '18', 'Y', '6', 'Active'],
      ['2W-BAT-12V5-01', 'Maintenance Free VRLA Battery 12V 5Ah', 'VRLA Battery 12V 5Ah', 'Battery', 'Batteries', 'Battery – 2W', 'Exide Xplore', 'Exide Industries Ltd', 'FXL0-XLTZ5', '12V-5AH-MF', 'NOS', 'BOX', 'PLANT-01; PLANT-02', '85071000', '28', 'Y', '18', 'Active']
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'item_master_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.State && window.State.showToast) {
      window.State.showToast('Sample Item Master import template downloaded.', 'info');
    }
  },

  showImportItemsModal() {
    this._parsedItemImportData = null;

    const contentHtml = `
      <div style="font-size: 13px; line-height: 1.5; color: var(--text-primary);">
        <!-- Instructions & Template Banner -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; gap: 10px; flex-wrap: wrap;">
          <div>
            <div style="font-weight: 700; color: #38bdf8; font-size: 13px;">Upload Item Master Template</div>
            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">
              CSV columns: Item Code, Item Name, Category, Subcategory, Brand, Part #, Stock UOM, HSN, GST %
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.ItemSetupModule.downloadItemSampleCsv()" style="font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <span>📥 Download Sample CSV</span>
          </button>
        </div>

        <!-- Mode Selection Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
          <button type="button" id="item-tab-btn-file" class="btn btn-sm btn-primary" onclick="window.ItemSetupModule.switchItemImportMode('file')" style="font-size: 11.5px; font-weight: 600;">
            📁 Upload CSV File
          </button>
          <button type="button" id="item-tab-btn-paste" class="btn btn-sm btn-secondary" onclick="window.ItemSetupModule.switchItemImportMode('paste')" style="font-size: 11.5px; font-weight: 600;">
            📋 Paste CSV Data
          </button>
        </div>

        <!-- Mode 1: File Upload -->
        <div id="item-import-file-section" style="border: 2px dashed var(--border-medium); border-radius: 6px; padding: 20px; text-align: center; background: rgba(255,255,255,0.015); margin-bottom: 12px;">
          <div style="font-size: 30px; margin-bottom: 6px;">📄</div>
          <div style="font-weight: 600; margin-bottom: 4px;">Choose CSV file or drag and drop</div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 10px;">Accepts .csv files (Comma-delimited text, UTF-8)</div>
          <input type="file" id="item-import-file-input" accept=".csv, text/csv, text/plain" style="display: none;" onchange="window.ItemSetupModule.handleItemImportFile(this)" />
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('item-import-file-input').click()" style="font-weight: 600;">
            Browse File
          </button>
          <div id="item-import-file-name" style="margin-top: 10px; font-size: 12px; color: #10b981; font-weight: 600; display: none;"></div>
        </div>

        <!-- Mode 2: Paste Area -->
        <div id="item-import-paste-section" style="display: none; margin-bottom: 12px;">
          <textarea 
            id="item-import-paste-text" 
            class="form-control" 
            rows="6" 
            placeholder="Paste CSV rows here (including header row)...&#10;e.g.&#10;Item Code,Item Name,Category,Subcategory,Brand,Part Number,Stock UOM,HSN Code,GST Rate (%)&#10;2W-BRK-PAD-01,Front Disc Brake Pad Set,Spare Parts,Brake Parts,Nissin / OEM,06455-KWP-D01,SET,87141000,18"
            style="font-family: monospace; font-size: 11.5px; resize: vertical;"
            oninput="window.ItemSetupModule.handleItemPasteChange(this.value)"
          ></textarea>
        </div>

        <!-- Options -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer; font-size: 12px;">
            <input type="checkbox" id="item-import-upsert-chk" checked style="cursor: pointer;" />
            <span><strong>Upsert mode:</strong> Update existing items if Item Code matches</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer; font-size: 12px;">
            <input type="checkbox" id="item-import-autocreate-chk" checked style="cursor: pointer;" />
            <span><strong>Auto-create:</strong> Automatically register missing Categories, Subcategories, Brands & UOMs</span>
          </label>
        </div>

        <!-- Preview & Validation Area -->
        <div id="item-import-preview-container" style="display: none; margin-top: 8px;">
          <div id="item-import-status-strip" style="font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);"></div>
          
          <div style="max-height: 190px; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: 4px;">
            <table class="data-table" style="font-size: 11px; margin-bottom: 0;">
              <thead>
                <tr>
                  <th style="padding: 6px 8px;">Item Code</th>
                  <th style="padding: 6px 8px;">Item Name</th>
                  <th style="padding: 6px 8px;">Category / Subcat</th>
                  <th style="padding: 6px 8px;">Brand</th>
                  <th style="padding: 6px 8px;">UOM</th>
                  <th style="padding: 6px 8px;">Status</th>
                  <th style="padding: 6px 8px;">Action</th>
                </tr>
              </thead>
              <tbody id="item-import-preview-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.State.closeModal()">
          Cancel
        </button>
        <button type="button" id="item-import-submit-btn" class="btn btn-primary btn-sm" onclick="window.ItemSetupModule.executeItemImport()" disabled style="font-weight: 700;">
          <span>🚀 Confirm & Import Items</span>
        </button>
      </div>
    `;

    if (window.State && typeof window.State.showModal === 'function') {
      window.State.showModal({
        title: '📥 Bulk Import Item Master Records',
        body: contentHtml,
        footer: footerHtml,
        maxWidth: '820px'
      });
    }
  },

  switchItemImportMode(mode) {
    const fileSec = document.getElementById('item-import-file-section');
    const pasteSec = document.getElementById('item-import-paste-section');
    const btnFile = document.getElementById('item-tab-btn-file');
    const btnPaste = document.getElementById('item-tab-btn-paste');

    if (mode === 'file') {
      if (fileSec) fileSec.style.display = 'block';
      if (pasteSec) pasteSec.style.display = 'none';
      if (btnFile) { btnFile.className = 'btn btn-sm btn-primary'; }
      if (btnPaste) { btnPaste.className = 'btn btn-sm btn-secondary'; }
    } else {
      if (fileSec) fileSec.style.display = 'none';
      if (pasteSec) pasteSec.style.display = 'block';
      if (btnFile) { btnFile.className = 'btn btn-sm btn-secondary'; }
      if (btnPaste) { btnPaste.className = 'btn btn-sm btn-primary'; }
      const ta = document.getElementById('item-import-paste-text');
      if (ta) ta.focus();
    }
  },

  handleItemImportFile(input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const nameEl = document.getElementById('item-import-file-name');
    if (nameEl) {
      nameEl.style.display = 'block';
      nameEl.innerHTML = `✓ Selected: <b>${file.name}</b> (${(file.size / 1024).toFixed(1)} KB)`;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result || '';
      this.processItemCsvText(text);
    };
    reader.onerror = () => {
      if (window.State && window.State.showToast) {
        window.State.showToast('Failed to read file.', 'error');
      }
    };
    reader.readAsText(file, 'UTF-8');
  },

  handleItemPasteChange(text) {
    if (!text || !text.trim()) {
      this._parsedItemImportData = null;
      const prev = document.getElementById('item-import-preview-container');
      if (prev) prev.style.display = 'none';
      const btn = document.getElementById('item-import-submit-btn');
      if (btn) btn.disabled = true;
      return;
    }
    this.processItemCsvText(text);
  },

  processItemCsvText(text) {
    const rawLines = this.parseCsv(text).filter(r => r.some(c => String(c).trim() !== ''));
    if (rawLines.length === 0) {
      this._parsedItemImportData = null;
      return;
    }

    let headerRow = rawLines[0].map(c => String(c).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    let dataRows = rawLines.slice(1);

    const hasHeader = headerRow.some(h => 
      h.includes('code') || h.includes('name') || h.includes('part') || h.includes('cat') || h.includes('brand') || h.includes('price') || h.includes('uom')
    );

    let colMap = {
      code: -1,
      name: -1,
      short_name: -1,
      type: -1,
      category: -1,
      subcategory: -1,
      brand: -1,
      manufacturer: -1,
      part_number: -1,
      oem_part_number: -1,
      barcode: -1,
      uom: -1,
      purchase_uom: -1,
      facilities: -1,
      hsn: -1,
      gst: -1,
      mrp: -1,
      cost: -1,
      price: -1,
      min_stock: -1,
      reorder: -1,
      warranty_yn: -1,
      warranty_months: -1,
      status: -1
    };

    if (hasHeader) {
      headerRow.forEach((h, idx) => {
        if (h === 'code' || h === 'item_code' || h === 'itemcode' || (h.includes('code') && !h.includes('hsn') && colMap.code === -1)) colMap.code = idx;
        else if (h === 'name' || h === 'item_name' || h === 'itemname' || (h.includes('name') && !h.includes('short') && !h.includes('cat') && !h.includes('brand') && colMap.name === -1)) colMap.name = idx;
        else if (h.includes('short')) colMap.short_name = idx;
        else if (h.includes('type')) colMap.type = idx;
        else if (h.includes('subcat') || h.includes('sub_cat')) colMap.subcategory = idx;
        else if (h.includes('cat') && colMap.category === -1) colMap.category = idx;
        else if (h.includes('brand')) colMap.brand = idx;
        else if (h.includes('mfg') || h.includes('manuf')) colMap.manufacturer = idx;
        else if (h.includes('oem')) colMap.oem_part_number = idx;
        else if (h.includes('part')) colMap.part_number = idx;
        else if (h.includes('barcode')) colMap.barcode = idx;
        else if (h.includes('purchase_uom') || h.includes('purchase_unit')) colMap.purchase_uom = idx;
        else if (h.includes('uom') || h.includes('unit')) colMap.uom = idx;
        else if (h.includes('facility') || h.includes('facilities') || h.includes('plant') || h === 'branch') colMap.facilities = idx;
        else if (h.includes('hsn') || h.includes('sac')) colMap.hsn = idx;
        else if (h.includes('gst') || h.includes('tax')) colMap.gst = idx;
        else if (h.includes('mrp')) colMap.mrp = idx;
        else if (h.includes('cost')) colMap.cost = idx;
        else if (h.includes('price') || h.includes('rate')) colMap.price = idx;
        else if (h.includes('min')) colMap.min_stock = idx;
        else if (h.includes('reorder') || h.includes('rop')) colMap.reorder = idx;
        else if (h.includes('warranty') && (h.includes('month') || h.includes('period'))) colMap.warranty_months = idx;
        else if (h.includes('warranty')) colMap.warranty_yn = idx;
        else if (h.includes('status') || h.includes('active')) colMap.status = idx;
      });
    } else {
      dataRows = rawLines;
      colMap = {
        code: 0,
        name: 1,
        short_name: 2,
        type: 3,
        category: 4,
        subcategory: 5,
        brand: 6,
        manufacturer: 7,
        part_number: 8,
        oem_part_number: 9,
        uom: 10,
        purchase_uom: 11,
        facilities: 12,
        hsn: 13,
        gst: 14,
        mrp: 15,
        cost: 16,
        price: 17,
        min_stock: 18,
        reorder: 19,
        warranty_yn: 20,
        warranty_months: 21,
        status: 22
      };
    }

    if (colMap.code === -1 && colMap.name !== -1) colMap.code = colMap.name;
    if (colMap.name === -1 && colMap.code !== -1) colMap.name = colMap.code;
    if (colMap.code === -1 && colMap.name === -1) {
      colMap.code = 0;
      colMap.name = 1 < headerRow.length ? 1 : 0;
    }

    const allExisting = (window.DB && typeof window.DB.getAll === 'function') 
      ? (window.DB.getAll('items') || []) 
      : [];
    const existingCodes = new Set();
    allExisting.forEach(i => {
      if (i.code) existingCodes.add(String(i.code).toUpperCase().trim());
      if (i.id) existingCodes.add(String(i.id).toUpperCase().trim());
    });

    const parsedRecords = [];
    let willUpdateCount = 0;
    let willAddCount = 0;

    dataRows.forEach((row, idx) => {
      const rawCode = colMap.code !== -1 && row[colMap.code] !== undefined ? String(row[colMap.code]).trim() : '';
      const rawName = colMap.name !== -1 && row[colMap.name] !== undefined ? String(row[colMap.name]).trim() : '';

      if (!rawCode && !rawName) return;

      const code = (rawCode || rawName.toUpperCase().replace(/\s+/g, '-')).toUpperCase();
      const name = rawName || rawCode;
      const shortName = colMap.short_name !== -1 && row[colMap.short_name] !== undefined ? String(row[colMap.short_name]).trim() : name;
      const itemType = colMap.type !== -1 && row[colMap.type] !== undefined ? String(row[colMap.type]).trim() : 'Spare Part';
      const category = colMap.category !== -1 && row[colMap.category] !== undefined ? String(row[colMap.category]).trim() : 'Spare Parts';
      const subcategory = colMap.subcategory !== -1 && row[colMap.subcategory] !== undefined ? String(row[colMap.subcategory]).trim() : 'General';
      const brand = colMap.brand !== -1 && row[colMap.brand] !== undefined ? String(row[colMap.brand]).trim() : 'OEM';
      const mfg = colMap.manufacturer !== -1 && row[colMap.manufacturer] !== undefined ? String(row[colMap.manufacturer]).trim() : 'OEM';
      const partNo = colMap.part_number !== -1 && row[colMap.part_number] !== undefined ? String(row[colMap.part_number]).trim() : code;
      const oemNo = colMap.oem_part_number !== -1 && row[colMap.oem_part_number] !== undefined ? String(row[colMap.oem_part_number]).trim() : partNo;
      const barcode = colMap.barcode !== -1 && row[colMap.barcode] !== undefined ? String(row[colMap.barcode]).trim() : '';
      const uom = colMap.uom !== -1 && row[colMap.uom] !== undefined ? String(row[colMap.uom]).trim().toUpperCase() : 'NOS';
      const purchaseUom = colMap.purchase_uom !== -1 && row[colMap.purchase_uom] !== undefined ? String(row[colMap.purchase_uom]).trim().toUpperCase() : uom;
      const hsn = colMap.hsn !== -1 && row[colMap.hsn] !== undefined ? String(row[colMap.hsn]).trim() : '87141000';
      
      const rawGst = colMap.gst !== -1 && row[colMap.gst] !== undefined ? parseFloat(String(row[colMap.gst]).replace(/[^0-9.]/g, '')) : 18;
      const gstRate = isNaN(rawGst) ? 18 : rawGst;

      const rawMrp = colMap.mrp !== -1 && row[colMap.mrp] !== undefined ? parseFloat(String(row[colMap.mrp]).replace(/[^0-9.]/g, '')) : 0;
      const mrp = isNaN(rawMrp) ? 0 : rawMrp;

      const rawCost = colMap.cost !== -1 && row[colMap.cost] !== undefined ? parseFloat(String(row[colMap.cost]).replace(/[^0-9.]/g, '')) : 0;
      const cost = isNaN(rawCost) ? 0 : rawCost;

      const rawPrice = colMap.price !== -1 && row[colMap.price] !== undefined ? parseFloat(String(row[colMap.price]).replace(/[^0-9.]/g, '')) : (mrp > 0 ? mrp : 150);
      const price = isNaN(rawPrice) ? 150 : rawPrice;

      const rawMin = colMap.min_stock !== -1 && row[colMap.min_stock] !== undefined ? parseInt(String(row[colMap.min_stock]).replace(/\D/g, ''), 10) : 5;
      const minStock = isNaN(rawMin) ? 5 : rawMin;

      const rawRop = colMap.reorder !== -1 && row[colMap.reorder] !== undefined ? parseInt(String(row[colMap.reorder]).replace(/\D/g, ''), 10) : 10;
      const reorderLevel = isNaN(rawRop) ? 10 : rawRop;

      const rawWarrantyYn = colMap.warranty_yn !== -1 && row[colMap.warranty_yn] !== undefined ? String(row[colMap.warranty_yn]).trim().toUpperCase() : 'N';
      const warrantyYn = (rawWarrantyYn === 'Y' || rawWarrantyYn === 'YES' || rawWarrantyYn === 'TRUE') ? 'Y' : 'N';

      const rawWMonths = colMap.warranty_months !== -1 && row[colMap.warranty_months] !== undefined ? parseInt(String(row[colMap.warranty_months]).replace(/\D/g, ''), 10) : (warrantyYn === 'Y' ? 6 : 0);
      const warrantyMonths = isNaN(rawWMonths) ? 0 : rawWMonths;

      const rawStatus = colMap.status !== -1 && row[colMap.status] !== undefined ? String(row[colMap.status]).trim() : 'Active';
      const status = /inactive|disabled|blocked|no|false/i.test(rawStatus) ? 'Inactive' : 'Active';

      // Parse facilities
      const rawFac = colMap.facilities !== -1 && row[colMap.facilities] !== undefined ? String(row[colMap.facilities]).trim() : '';
      let facIds = [];
      const allPlants = (window.DB && window.DB.getAll('plants')) || [];
      if (rawFac) {
        const parts = rawFac.split(/[;,|]+/).map(p => p.trim()).filter(Boolean);
        parts.forEach(part => {
          const partLow = part.toLowerCase();
          if (partLow === 'all') {
            facIds = allPlants.map(p => p.id);
          } else {
            const found = allPlants.find(p => (p.id || '').toLowerCase() === partLow || (p.code || '').toLowerCase() === partLow || (p.name || '').toLowerCase() === partLow);
            if (found && !facIds.includes(found.id)) {
              facIds.push(found.id);
            }
          }
        });
      }
      if (facIds.length === 0) {
        facIds = allPlants.length > 0 ? allPlants.map(p => p.id) : ['PLANT-01'];
      }

      const isUpdate = existingCodes.has(code);
      if (isUpdate) willUpdateCount++;
      else willAddCount++;

      parsedRecords.push({
        code,
        name,
        short_name: shortName,
        item_type: itemType,
        category,
        subcategory,
        brand,
        manufacturer: mfg,
        part_number: partNo,
        oem_part_number: oemNo,
        barcode,
        stock_uom: uom,
        purchase_uom: purchaseUom,
        facility_ids: facIds,
        hsn_code: hsn,
        gst_rate_pct: gstRate,
        mrp,
        standard_cost: cost,
        workshop_sale_price: price,
        sale_price: price,
        min_stock: minStock,
        reorder_level: reorderLevel,
        warranty_applicable_yn: warrantyYn,
        warranty_period_months: warrantyMonths,
        status,
        isUpdate
      });
    });

    this._parsedItemImportData = parsedRecords;

    const prevContainer = document.getElementById('item-import-preview-container');
    const statusStrip = document.getElementById('item-import-status-strip');
    const tbody = document.getElementById('item-import-preview-tbody');
    const submitBtn = document.getElementById('item-import-submit-btn');

    if (parsedRecords.length > 0) {
      if (prevContainer) prevContainer.style.display = 'block';
      if (statusStrip) {
        statusStrip.innerHTML = `✓ <strong>${parsedRecords.length} items ready to import</strong> (${willAddCount} new, ${willUpdateCount} to update)`;
      }
      if (tbody) {
        tbody.innerHTML = parsedRecords.slice(0, 5).map(r => `
          <tr style="border-bottom: 1px solid var(--border-subtle);">
            <td style="padding: 4px 8px;" class="cell-mono">${r.code}</td>
            <td style="padding: 4px 8px; font-weight: 600;">${r.name}</td>
            <td style="padding: 4px 8px; color: var(--text-muted);">${r.category} / ${r.subcategory}</td>
            <td style="padding: 4px 8px;">${r.brand}</td>
            <td style="padding: 4px 8px;">${r.stock_uom}</td>
            <td style="padding: 4px 8px;"><span class="badge ${r.status === 'Active' ? 'badge-success' : 'badge-secondary'}" style="font-size: 9.5px;">${r.status}</span></td>
            <td style="padding: 4px 8px;"><span class="badge ${r.isUpdate ? 'badge-warning' : 'badge-success'}" style="font-size: 9.5px;">${r.isUpdate ? 'UPDATE' : 'NEW'}</span></td>
          </tr>
        `).join('') + (parsedRecords.length > 5 ? `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 4px;">... and ${parsedRecords.length - 5} more records</td></tr>` : '');
      }
      if (submitBtn) submitBtn.disabled = false;
    } else {
      if (prevContainer) prevContainer.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;
    }
  },

  executeItemImport() {
    const records = this._parsedItemImportData;
    if (!Array.isArray(records) || records.length === 0) {
      if (window.State && window.State.showToast) {
        window.State.showToast('No valid item records found to import.', 'warning');
      }
      return;
    }

    const upsertChk = document.getElementById('item-import-upsert-chk');
    const allowUpsert = upsertChk ? upsertChk.checked : true;

    const autoCreateChk = document.getElementById('item-import-autocreate-chk');
    const allowAutoCreate = autoCreateChk ? autoCreateChk.checked : true;

    const allItems = (window.DB && typeof window.DB.getAll === 'function')
      ? (window.DB.getAll('items') || [])
      : [];
    const allCats = (window.DB && typeof window.DB.getAll === 'function')
      ? (window.DB.getAll('itemCategories') || [])
      : [];
    const allSubcats = (window.DB && typeof window.DB.getAll === 'function')
      ? (window.DB.getAll('itemSubcategories') || [])
      : [];
    const allBrands = (window.DB && typeof window.DB.getAll === 'function')
      ? (window.DB.getAll('itemBrands') || [])
      : [];
    const allUoms = (window.DB && typeof window.DB.getAll === 'function')
      ? (window.DB.getAll('uoms') || [])
      : [];

    let added = 0;
    let updated = 0;
    let skipped = 0;

    const currentUser = (window.State && window.State.getCurrentUser && window.State.getCurrentUser())
      ? (window.State.getCurrentUser().full_name || 'Store Manager')
      : 'Store Manager';
    const nowIso = new Date().toISOString();

    records.forEach((rec, idx) => {
      // 1. Resolve Category
      let catId = 'CAT-SPARE';
      if (rec.category) {
        const catNameClean = rec.category.trim().toLowerCase();
        let matchedCat = allCats.find(c => (c.name || '').toLowerCase() === catNameClean || (c.code || '').toLowerCase() === catNameClean || (c.id || '').toLowerCase() === catNameClean);
        if (!matchedCat && allowAutoCreate) {
          const newCode = rec.category.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'CAT';
          matchedCat = {
            id: `CAT-${newCode}-${Date.now().toString().slice(-4)}`,
            code: newCode,
            name: rec.category.trim(),
            item_type: rec.item_type || 'Spare Part',
            description: `${rec.category.trim()} category auto-created via CSV Import`,
            status: 'Active'
          };
          if (window.DB && typeof window.DB.upsert === 'function') window.DB.upsert('itemCategories', matchedCat);
          else allCats.push(matchedCat);
        }
        if (matchedCat) catId = matchedCat.id;
      }

      // 2. Resolve Subcategory
      let subcatId = 'SUB-ENG';
      if (rec.subcategory) {
        const subNameClean = rec.subcategory.trim().toLowerCase();
        let matchedSub = allSubcats.find(s => (s.name || '').toLowerCase() === subNameClean || (s.code || '').toLowerCase() === subNameClean || (s.id || '').toLowerCase() === subNameClean);
        if (!matchedSub && allowAutoCreate) {
          const newCode = rec.subcategory.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'SUB';
          matchedSub = {
            id: `SUB-${newCode}-${Date.now().toString().slice(-4)}`,
            category_id: catId,
            code: newCode,
            name: rec.subcategory.trim(),
            status: 'Active'
          };
          if (window.DB && typeof window.DB.upsert === 'function') window.DB.upsert('itemSubcategories', matchedSub);
          else allSubcats.push(matchedSub);
        }
        if (matchedSub) subcatId = matchedSub.id;
      }

      // 3. Resolve Brand
      let brandName = rec.brand || 'OEM';
      if (rec.brand && allowAutoCreate) {
        const brdClean = rec.brand.trim().toLowerCase();
        let matchedBrd = allBrands.find(b => (b.name || '').toLowerCase() === brdClean || (b.code || '').toLowerCase() === brdClean);
        if (!matchedBrd) {
          const newCode = rec.brand.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'BRD';
          const newBrd = {
            id: `BRD-${newCode}-${Date.now().toString().slice(-4)}`,
            code: newCode,
            name: rec.brand.trim(),
            country: 'India',
            status: 'Active'
          };
          if (window.DB && typeof window.DB.upsert === 'function') window.DB.upsert('itemBrands', newBrd);
          else allBrands.push(newBrd);
        }
      }

      // 4. Resolve UOM
      let stockUom = (rec.stock_uom || 'NOS').toUpperCase().trim();
      if (stockUom && allowAutoCreate) {
        let matchedUom = allUoms.find(u => (u.code || '').toUpperCase() === stockUom || (u.name || '').toUpperCase() === stockUom);
        if (!matchedUom) {
          const newUom = {
            id: `UOM-${stockUom}`,
            code: stockUom,
            name: stockUom,
            type: 'Count',
            base_uom: stockUom,
            conversion_factor: 1,
            status: 'Active'
          };
          if (window.DB && typeof window.DB.upsert === 'function') window.DB.upsert('uoms', newUom);
          else allUoms.push(newUom);
        }
      }

      // 5. Match existing item
      const existing = allItems.find(i => 
        (i.code && i.code.trim().toUpperCase() === rec.code.trim().toUpperCase()) ||
        (i.id && i.id.trim().toUpperCase() === rec.code.trim().toUpperCase())
      );

      if (existing) {
        if (allowUpsert) {
          existing.name = rec.name || existing.name;
          if (rec.short_name) existing.short_name = rec.short_name;
          if (rec.item_type) existing.item_type = rec.item_type;
          existing.category_id = catId;
          existing.subcategory_id = subcatId;
          if (rec.brand) existing.brand = brandName;
          if (rec.manufacturer) existing.manufacturer = rec.manufacturer;
          if (rec.part_number) existing.part_number = rec.part_number;
          if (rec.oem_part_number) existing.oem_part_number = rec.oem_part_number;
          if (rec.barcode) existing.barcode = rec.barcode;
          if (stockUom) {
            existing.stock_uom = stockUom;
            existing.base_uom = stockUom;
          }
          if (rec.purchase_uom) existing.purchase_uom = rec.purchase_uom;
          if (rec.hsn_code) existing.hsn_code = rec.hsn_code;
          if (rec.gst_rate_pct !== undefined) existing.gst_rate_pct = rec.gst_rate_pct;
          if (rec.mrp !== undefined && rec.mrp > 0) existing.mrp = rec.mrp;
          if (rec.standard_cost !== undefined && rec.standard_cost > 0) {
            existing.standard_cost = rec.standard_cost;
            existing.last_purchase_price = rec.standard_cost;
          }
          if (rec.workshop_sale_price !== undefined && rec.workshop_sale_price > 0) {
            existing.workshop_sale_price = rec.workshop_sale_price;
            existing.sale_price = rec.workshop_sale_price;
          }
          if (rec.min_stock !== undefined) existing.min_stock = rec.min_stock;
          if (rec.reorder_level !== undefined) existing.reorder_level = rec.reorder_level;
          if (rec.warranty_applicable_yn) existing.warranty_applicable_yn = rec.warranty_applicable_yn;
          if (rec.warranty_period_months !== undefined) existing.warranty_period_months = rec.warranty_period_months;
          if (rec.facility_ids && rec.facility_ids.length > 0) {
            existing.facility_ids = rec.facility_ids;
            existing.facility_id = rec.facility_ids[0];
          }
          if (rec.status) existing.status = rec.status;
          existing.updated_by = currentUser;
          existing.updated_date = nowIso;

          if (window.DB && typeof window.DB.upsert === 'function') {
            window.DB.upsert('items', existing);
          }
          updated++;
        } else {
          skipped++;
        }
      } else {
        const newItem = {
          id: `ITEM-2W-${Date.now().toString().slice(-6)}-${idx + 1}`,
          code: rec.code.trim().toUpperCase(),
          name: rec.name.trim(),
          short_name: rec.short_name || rec.name.trim(),
          description: rec.name.trim(),
          item_type: rec.item_type || 'Spare Part',
          category_id: catId,
          subcategory_id: subcatId,
          brand: brandName,
          manufacturer: rec.manufacturer || 'OEM',
          part_number: rec.part_number || rec.code.trim().toUpperCase(),
          oem_part_number: rec.oem_part_number || rec.code.trim().toUpperCase(),
          barcode: rec.barcode || '',
          stock_uom: stockUom || 'NOS',
          base_uom: stockUom || 'NOS',
          purchase_uom: rec.purchase_uom || stockUom || 'NOS',
          alternate_uom: '',
          conversion_factor: 1,
          facility_id: (rec.facility_ids && rec.facility_ids[0]) || (window.State && window.State.currentPlantId) || 'PLANT-01',
          facility_ids: (rec.facility_ids && rec.facility_ids.length > 0) ? rec.facility_ids : (((window.DB && window.DB.getAll('plants')) || []).map(p => p.id)),
          hsn_code: rec.hsn_code || '87141000',
          gst_rate_pct: rec.gst_rate_pct !== undefined ? rec.gst_rate_pct : 18,
          tax_inclusive_yn: 'N',
          mrp: rec.mrp || (rec.workshop_sale_price ? Math.round(rec.workshop_sale_price * 1.2) : 200),
          standard_cost: rec.standard_cost || 100,
          last_purchase_price: rec.standard_cost || 100,
          workshop_sale_price: rec.workshop_sale_price || rec.sale_price || 150,
          sale_price: rec.workshop_sale_price || rec.sale_price || 150,
          min_sale_price: rec.workshop_sale_price || 150,
          min_stock: rec.min_stock || 5,
          max_stock: 100,
          reorder_level: rec.reorder_level || 10,
          safety_stock: 5,
          lead_time_days: 2,
          is_batch_controlled: false,
          is_serial_controlled: false,
          has_expiry: false,
          warranty_applicable_yn: rec.warranty_applicable_yn || 'N',
          warranty_period_months: rec.warranty_period_months || 0,
          vehicle_model_ids: [],
          status: rec.status || 'Active',
          created_by: currentUser,
          created_date: nowIso,
          updated_by: currentUser,
          updated_date: nowIso
        };

        if (window.DB && typeof window.DB.upsert === 'function') {
          window.DB.upsert('items', newItem);
        } else if (window.DB && window.DB.data) {
          window.DB.data.items = window.DB.data.items || [];
          window.DB.data.items.push(newItem);
        }
        added++;
      }
    });

    if (window.DB && typeof window.DB.saveData === 'function') {
      window.DB.saveData();
    }
    if (window.DB && typeof window.DB.emitChange === 'function') {
      window.DB.emitChange('items');
    }

    if (window.State && typeof window.State.closeModal === 'function') {
      window.State.closeModal();
    }

    const toastMsg = `Import completed: ${added} added, ${updated} updated${skipped > 0 ? `, ${skipped} skipped` : ''}.`;
    if (window.State && window.State.showToast) {
      window.State.showToast(toastMsg, 'success');
    }

    this.refresh();
  },

  // -------------------------------------------------------------------------
  // 2. UNIFIED ITEM CATEGORY & SUB-CATEGORY MASTER TAB (#/item-categories)
  // -------------------------------------------------------------------------
  setCategorySearch(val) {
    this.categorySearchTerm = (val || '').toLowerCase().trim();
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemCategories');
      window.PaginationHelper.reset('itemSubcategories');
      window.PaginationHelper.reset('itemCategoriesGrouped');
    }
    this.refresh();
  },

  setCategoryFilter(val) {
    this.categoryFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemMaster');
      window.PaginationHelper.reset('itemCategories');
      window.PaginationHelper.reset('itemSubcategories');
      window.PaginationHelper.reset('itemCategoriesGrouped');
    }
    this.refresh();
  },

  setCategoryViewMode(mode) {
    this.categoryViewMode = mode;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemCategories');
      window.PaginationHelper.reset('itemSubcategories');
      window.PaginationHelper.reset('itemCategoriesGrouped');
    }
    this.refresh();
  },

  toggleCategory(catId) {
    if (!this.expandedCategories) this.expandedCategories = {};
    const current = (this.expandedCategories[catId] !== undefined) ? this.expandedCategories[catId] : (this._allExpanded !== false);
    this.expandedCategories[catId] = !current;
    this.refresh();
  },

  toggleAllCategories() {
    this._allExpanded = !this._allExpanded;
    const categories = window.DB.getAll('itemCategories') || [];
    if (!this.expandedCategories) this.expandedCategories = {};
    categories.forEach(c => {
      this.expandedCategories[c.id] = this._allExpanded;
    });
    this.refresh();
  },

  renderCategoriesTab() {
    this.ensureSeedData();
    const allCategories = window.DB.getAll('itemCategories') || [];
    const allSubcats = window.DB.getAll('itemSubcategories') || [];
    const allItems = window.DB.getAll('items') || [];

    const search = (this.categorySearchTerm || '').toLowerCase().trim();
    const filterCat = this.categoryFilter || 'ALL';
    const viewMode = this.categoryViewMode || 'GROUPED';

    // Filter categories & subcategories
    let filteredCats = allCategories.filter(c => filterCat === 'ALL' || c.id === filterCat);
    let filteredSubs = allSubcats.filter(s => filterCat === 'ALL' || s.category_id === filterCat);

    if (search) {
      filteredSubs = filteredSubs.filter(s => {
        const parent = allCategories.find(c => c.id === s.category_id) || {};
        return (s.name && s.name.toLowerCase().includes(search)) ||
               (s.code && s.code.toLowerCase().includes(search)) ||
               (parent.name && parent.name.toLowerCase().includes(search));
      });

      const parentIdsMatchingSubs = new Set(filteredSubs.map(s => s.category_id));
      filteredCats = filteredCats.filter(c => {
        const matchesCat = (c.name && c.name.toLowerCase().includes(search)) ||
                           (c.code && c.code.toLowerCase().includes(search)) ||
                           (c.item_type && c.item_type.toLowerCase().includes(search)) ||
                           (c.description && c.description.toLowerCase().includes(search));
        return matchesCat || parentIdsMatchingSubs.has(c.id);
      });
    }

    const totalCategoriesCount = allCategories.length;
    const totalSubcategoriesCount = allSubcats.length;

    return `
      <div class="content-card">
        <!-- Header -->
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>Item Category & Sub-Category Master</span>
              <span style="display:none">Item Category Master</span>
              <span class="badge badge-primary" style="font-size: 11px;">${totalCategoriesCount} Categories</span>
              <span class="badge badge-info" style="font-size: 11px;">${totalSubcategoriesCount} Sub-Categories</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              Unified Two-Wheeler Classification Hierarchy &mdash; Categories and Nested Sub-Categories
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            ${viewMode === 'GROUPED' ? `
              <button type="button" class="btn btn-outline-secondary btn-sm" onclick="window.ItemSetupModule.toggleAllCategories()">
                <span>${this._allExpanded !== false ? '◀ Collapse All' : '▼ Expand All'}</span>
              </button>
            ` : ''}
            <button type="button" class="btn btn-primary btn-sm" onclick="window.ItemSetupModule.showAddCategoryModal()">
              <span>+ Add Category</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.ItemSetupModule.showAddSubcategoryModal()">
              <span>+ Add Sub-Category</span>
            </button>
          </div>
        </div>

        <!-- Filter & View Switcher Bar -->
        <div style="padding: 10px 16px; background: var(--bg-card-subtle, rgba(255,255,255,0.02)); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <!-- Search & Category Filter -->
          <div style="display: flex; gap: 10px; align-items: center; flex: 1; min-width: 280px; flex-wrap: wrap;">
            <div style="position: relative; min-width: 220px; flex: 1; max-width: 320px;">
              <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 13px; color: var(--text-muted); pointer-events: none;">🔍</span>
              <input 
                type="text" 
                class="form-control form-control-sm" 
                style="padding-left: 32px !important; padding-right: 28px !important;" 
                placeholder="Search category or sub-category..." 
                value="${this.categorySearchTerm || ''}" 
                oninput="window.ItemSetupModule.setCategorySearch(this.value)"
              />
              ${this.categorySearchTerm ? `
                <button type="button" onclick="window.ItemSetupModule.setCategorySearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px;" title="Clear search">✕</button>
              ` : ''}
            </div>

            <select class="form-control form-control-sm" style="width: auto; min-width: 190px;" onchange="window.ItemSetupModule.setCategoryFilter(this.value)">
              <option value="ALL" ${filterCat === 'ALL' ? 'selected' : ''}>All Categories (${totalCategoriesCount})</option>
              ${allCategories.map(c => {
                const subCount = allSubcats.filter(s => s.category_id === c.id).length;
                return `<option value="${c.id}" ${filterCat === c.id ? 'selected' : ''}>${c.name} (${subCount})</option>`;
              }).join('')}
            </select>
          </div>

          <!-- View Mode Switcher -->
          <div style="display: inline-flex; align-items: center; background: var(--bg-secondary, rgba(0,0,0,0.15)); padding: 2px; border-radius: 6px; border: 1px solid var(--border-color);">
            <button type="button" class="btn btn-sm ${viewMode === 'GROUPED' ? 'btn-primary' : 'btn-ghost'}" style="padding: 4px 10px; font-size: 12px; font-weight: 600;" onclick="window.ItemSetupModule.setCategoryViewMode('GROUPED')">
              🌳 Hierarchical View
            </button>
            <button type="button" class="btn btn-sm ${viewMode === 'CATEGORIES' ? 'btn-primary' : 'btn-ghost'}" style="padding: 4px 10px; font-size: 12px; font-weight: 600;" onclick="window.ItemSetupModule.setCategoryViewMode('CATEGORIES')">
              📦 Main Categories (${totalCategoriesCount})
            </button>
            <button type="button" class="btn btn-sm ${viewMode === 'SUBCATS' ? 'btn-primary' : 'btn-ghost'}" style="padding: 4px 10px; font-size: 12px; font-weight: 600;" onclick="window.ItemSetupModule.setCategoryViewMode('SUBCATS')">
              📑 Sub-Categories (${totalSubcategoriesCount})
            </button>
          </div>
        </div>

        <!-- View Body -->
        <div class="table-responsive">
          ${this.renderCategoryTableContent(viewMode, filteredCats, filteredSubs, allCategories, allSubcats, allItems, search)}
        </div>
      </div>
    `;
  },

  renderCategoryTableContent(viewMode, filteredCats, filteredSubs, allCategories, allSubcats, allItems, search) {
    if (viewMode === 'CATEGORIES') {
      const pagedCats = (typeof window !== 'undefined' && window.PaginationHelper)
        ? window.PaginationHelper.paginate(filteredCats, 'itemCategories')
        : { items: filteredCats, totalRecords: filteredCats.length, currentPage: 1, pageSize: 10 };

      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Category Code</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Default Item Type</th>
              <th>Sub-Categories</th>
              <th>Total Items</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredCats.length === 0 ? `
              <tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No categories match current filters.</td></tr>
            ` : pagedCats.items.map(c => {
              const subCount = allSubcats.filter(s => s.category_id === c.id).length;
              const itemCount = allItems.filter(i => i.category_id === c.id || i.category_id === c.code).length;
              const isActive = (c.status === 'Active' || !c.status);
              return `
                <tr>
                  <td><span class="cell-mono cell-strong" style="color: var(--primary-300);">${c.code || c.id}</span></td>
                  <td><span style="font-weight: 600; font-size: 13px;">${c.name}</span></td>
                  <td><span style="font-size: 12px; color: var(--text-secondary); max-width: 250px; display: inline-block;">${c.description || '&mdash;'}</span></td>
                  <td><span class="badge badge-secondary" style="font-size: 11px;">${c.item_type || 'Spare Part'}</span></td>
                  <td><span class="badge badge-primary" style="font-size: 11px;">${subCount} Sub-Categories</span></td>
                  <td><span style="font-weight: 600; font-size: 12.5px;">${itemCount}</span></td>
                  <td><span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                  <td class="text-right">
                    <div style="display: inline-flex; gap: 4px; align-items: center;">
                      <button type="button" class="btn btn-icon btn-sm" title="Add Sub-Category under ${c.name}" onclick="window.ItemSetupModule.showAddSubcategoryModal('${c.id}')">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                      <button type="button" class="btn btn-icon btn-sm" title="Edit Category" onclick="window.ItemSetupModule.showEditCategoryModal('${c.id}')">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button type="button" class="btn btn-icon btn-sm" title="Delete Category" style="color: var(--color-danger, #ef4444);" onclick="window.ItemSetupModule.deleteCategory('${c.id}')">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          totalRecords: filteredCats.length,
          currentPage: pagedCats.currentPage,
          pageSize: pagedCats.pageSize,
          onPageChange: "window.ItemSetupModule.setPage(%p%, 'itemCategories')",
          onPageSizeChange: "window.ItemSetupModule.setPageSize(%s%, 'itemCategories')"
        }) : ''}
      `;
    }

    if (viewMode === 'SUBCATS') {
      const pagedSubs = (typeof window !== 'undefined' && window.PaginationHelper)
        ? window.PaginationHelper.paginate(filteredSubs, 'itemSubcategories')
        : { items: filteredSubs, totalRecords: filteredSubs.length, currentPage: 1, pageSize: 10 };

      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Sub-Category Code</th>
              <th>Sub-Category Name</th>
              <th>Parent Main Category</th>
              <th>Total Items</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSubs.length === 0 ? `
              <tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">No sub-categories match current filters.</td></tr>
            ` : pagedSubs.items.map(s => {
              const parent = allCategories.find(c => c.id === s.category_id) || { name: 'Spare Parts' };
              const itemCount = allItems.filter(i => i.subcategory_id === s.id || i.subcategory_id === s.code).length;
              const isActive = (s.status === 'Active' || !s.status);
              return `
                <tr>
                  <td><span class="cell-mono cell-strong" style="color: var(--primary-300);">${s.code || s.id}</span></td>
                  <td><span style="font-weight: 600; font-size: 13px;">${s.name}</span></td>
                  <td>
                    <span class="badge badge-secondary" style="font-size: 11px;">${parent.name}</span>
                  </td>
                  <td><span style="font-weight: 600; font-size: 12.5px;">${itemCount}</span></td>
                  <td><span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                  <td class="text-right">
                    <div style="display: inline-flex; gap: 4px; align-items: center;">
                      <button type="button" class="btn btn-icon btn-sm" title="Edit Sub-Category" onclick="window.ItemSetupModule.showEditSubcategoryModal('${s.id}')">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button type="button" class="btn btn-icon btn-sm" title="Delete Sub-Category" style="color: var(--color-danger, #ef4444);" onclick="window.ItemSetupModule.deleteSubcategory('${s.id}')">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          totalRecords: filteredSubs.length,
          currentPage: pagedSubs.currentPage,
          pageSize: pagedSubs.pageSize,
          onPageChange: "window.ItemSetupModule.setPage(%p%, 'itemSubcategories')",
          onPageSizeChange: "window.ItemSetupModule.setPageSize(%s%, 'itemSubcategories')"
        }) : ''}
      `;
    }

    // Default: GROUPED / Hierarchical View
    const pagedGroupedCats = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filteredCats, 'itemCategoriesGrouped')
      : { items: filteredCats, totalRecords: filteredCats.length, currentPage: 1, pageSize: 10 };

    return `
      <table class="data-table" style="border-collapse: separate; border-spacing: 0;">
        <thead>
          <tr>
            <th style="width: 44px; text-align: center;"></th>
            <th style="width: 140px;">Category Code</th>
            <th>Category / Sub-Category Name</th>
            <th style="width: 130px;">Item Type</th>
            <th style="width: 140px;">Sub-Categories</th>
            <th style="width: 110px;">Total Items</th>
            <th style="width: 90px;">Status</th>
            <th class="text-right" style="width: 130px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCats.length === 0 ? `
            <tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No categories or sub-categories match current filters.</td></tr>
          ` : pagedGroupedCats.items.map(c => {
            let catSubs = allSubcats.filter(s => s.category_id === c.id);
            if (search) {
              const matchingSubs = catSubs.filter(s => 
                (s.name && s.name.toLowerCase().includes(search)) ||
                (s.code && s.code.toLowerCase().includes(search))
              );
              if (matchingSubs.length > 0) {
                catSubs = matchingSubs;
              }
            }

            const catItemCount = allItems.filter(i => i.category_id === c.id || i.category_id === c.code).length;
            const isCatActive = (c.status === 'Active' || !c.status);
            
            // Check expansion state (if search active, auto-expand!)
            const isExpanded = search ? true : (this.expandedCategories[c.id] !== undefined ? this.expandedCategories[c.id] : (this._allExpanded !== false));

            return `
              <!-- Category Header Row -->
              <tr class="category-header-row" style="background: var(--table-group-bg, rgba(99,102,241,0.06)); cursor: pointer; border-top: 1px solid var(--border-color);" onclick="window.ItemSetupModule.toggleCategory('${c.id}')">
                <td style="text-align: center;">
                  <button type="button" class="btn btn-icon btn-sm" style="width: 24px; height: 24px; padding: 0; line-height: 1; border: none; background: transparent; color: var(--primary-400);" title="${isExpanded ? 'Collapse' : 'Expand'}">
                    ${isExpanded ? '▼' : '▶'}
                  </button>
                </td>
                <td>
                  <span class="cell-mono cell-strong" style="color: var(--primary-300); font-weight: 700;">${c.code || c.id}</span>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 700; font-size: 13.5px; color: var(--text-primary);">${c.name}</span>
                    ${c.description ? `<span style="font-size: 11px; color: var(--text-muted); font-weight: normal; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">&mdash; ${c.description}</span>` : ''}
                  </div>
                </td>
                <td><span class="badge badge-secondary" style="font-size: 11px;">${c.item_type || 'Spare Part'}</span></td>
                <td><span class="badge badge-primary" style="font-size: 11px; font-weight: 600;">${catSubs.length} Sub-Categories</span></td>
                <td><span style="font-weight: 600; font-size: 12.5px;">${catItemCount}</span></td>
                <td><span class="badge ${isCatActive ? 'badge-success' : 'badge-danger'}">${isCatActive ? 'Active' : 'Inactive'}</span></td>
                <td class="text-right" onclick="event.stopPropagation()">
                  <div style="display: inline-flex; gap: 4px; align-items: center;">
                    <button type="button" class="btn btn-icon btn-sm" title="Add Sub-Category under ${c.name}" onclick="window.ItemSetupModule.showAddSubcategoryModal('${c.id}')">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <button type="button" class="btn btn-icon btn-sm" title="Edit Category" onclick="window.ItemSetupModule.showEditCategoryModal('${c.id}')">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button type="button" class="btn btn-icon btn-sm" title="Delete Category" style="color: var(--color-danger, #ef4444);" onclick="window.ItemSetupModule.deleteCategory('${c.id}')">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Nested Sub-Categories Container -->
              ${isExpanded ? `
                <tr class="category-sub-row">
                  <td colspan="8" style="padding: 0; background: var(--bg-card);">
                    <div style="padding: 6px 14px 12px 42px; border-left: 3px solid var(--primary-500); background: var(--table-sub-bg, rgba(0,0,0,0.08));">
                      <table class="data-table data-table-nested" style="width: 100%; margin: 0; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; background: var(--bg-card);">
                        <thead>
                          <tr style="background: var(--bg-secondary, rgba(255,255,255,0.02)); font-size: 11px;">
                            <th style="width: 150px;">Sub-Category Code</th>
                            <th>Sub-Category Name</th>
                            <th style="width: 120px;">Items Mapped</th>
                            <th style="width: 90px;">Status</th>
                            <th class="text-right" style="width: 100px;">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${catSubs.length === 0 ? `
                            <tr>
                              <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 12px; font-size: 12px;">
                                No sub-categories configured for ${c.name}.
                                <button type="button" class="btn btn-link btn-sm" style="font-size: 12px; padding: 0 4px;" onclick="window.ItemSetupModule.showAddSubcategoryModal('${c.id}')">+ Add First Sub-Category</button>
                              </td>
                            </tr>
                          ` : catSubs.map(s => {
                            const subItemCount = allItems.filter(i => i.subcategory_id === s.id || i.subcategory_id === s.code).length;
                            const isSubActive = (s.status === 'Active' || !s.status);
                            return `
                              <tr>
                                <td>
                                  <span style="color: var(--primary-400); margin-right: 4px; font-weight: bold;">↳</span>
                                  <span class="cell-mono cell-strong" style="color: var(--primary-300); font-size: 11.5px;">${s.code || s.id}</span>
                                </td>
                                <td><span style="font-weight: 500; font-size: 12.5px;">${s.name}</span></td>
                                <td><span style="font-weight: 600; font-size: 12px;">${subItemCount}</span></td>
                                <td><span class="badge ${isSubActive ? 'badge-success' : 'badge-danger'}" style="font-size: 10px;">${isSubActive ? 'Active' : 'Inactive'}</span></td>
                                <td class="text-right">
                                  <div style="display: inline-flex; gap: 4px; align-items: center;">
                                    <button type="button" class="btn btn-icon btn-sm" title="Edit Sub-Category" onclick="window.ItemSetupModule.showEditSubcategoryModal('${s.id}')">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button type="button" class="btn btn-icon btn-sm" title="Delete Sub-Category" style="color: var(--color-danger, #ef4444);" onclick="window.ItemSetupModule.deleteSubcategory('${s.id}')">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            `;
                          }).join('')}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              ` : ''}
            `;
          }).join('')}
        </tbody>
      </table>
      ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
        totalRecords: filteredCats.length,
        currentPage: pagedGroupedCats.currentPage,
        pageSize: pagedGroupedCats.pageSize,
        onPageChange: "window.ItemSetupModule.setPage(%p%, 'itemCategoriesGrouped')",
        onPageSizeChange: "window.ItemSetupModule.setPageSize(%s%, 'itemCategoriesGrouped')"
      }) : ''}
    `;
  },

  renderSubcategoriesTab() {
    this.categoryViewMode = 'SUBCATS';
    const html = this.renderCategoriesTab();
    return html.replace('Item Category & Sub-Category Master', 'Item Category & Sub-Category Master <span style="display:none">Item Sub-Category Master</span>');
  },

  showAddCategoryModal() {
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveCategory(null);">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Category Code <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="cat-code" class="form-control cell-mono" required placeholder="e.g. CAT-EV" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Category Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="cat-name" class="form-control" required placeholder="e.g. Electric Vehicle Powertrain" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Default Item Type</label>
          <select id="cat-type" class="form-control">
            ${['Spare Part', 'Consumable', 'Accessory', 'Lubricant', 'Battery', 'Tyre', 'Tool', 'Workshop Equipment'].map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Description</label>
          <input type="text" id="cat-desc" class="form-control" placeholder="Short description of category..." />
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Status</label>
          <select id="cat-status" class="form-control">
            <option value="Active" selected>Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Category</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: 'Add Main Category', contentHtml });
  },

  showEditCategoryModal(catId) {
    const cat = window.DB.getById('itemCategories', catId);
    if (!cat) return;
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveCategory('${cat.id}');">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Category Code</label>
          <input type="text" id="cat-code" class="form-control cell-mono" value="${cat.code || cat.id}" readonly />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Category Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="cat-name" class="form-control" value="${cat.name}" required />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Default Item Type</label>
          <select id="cat-type" class="form-control">
            ${['Spare Part', 'Consumable', 'Accessory', 'Lubricant', 'Battery', 'Tyre', 'Tool', 'Workshop Equipment'].map(t => `<option value="${t}" ${cat.item_type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Description</label>
          <input type="text" id="cat-desc" class="form-control" value="${cat.description || ''}" />
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Status</label>
          <select id="cat-status" class="form-control">
            <option value="Active" ${(cat.status === 'Active' || !cat.status) ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${cat.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Category</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: `Edit Category: ${cat.name}`, contentHtml });
  },

  saveCategory(catId) {
    const code = document.getElementById('cat-code').value.trim();
    const name = document.getElementById('cat-name').value.trim();
    const status = document.getElementById('cat-status') ? document.getElementById('cat-status').value : 'Active';
    const type = document.getElementById('cat-type') ? document.getElementById('cat-type').value : 'Spare Part';
    const desc = document.getElementById('cat-desc') ? document.getElementById('cat-desc').value.trim() : '';

    const obj = {
      id: catId || `CAT-${Date.now()}`,
      code,
      name,
      item_type: type,
      description: desc,
      status
    };
    window.DB.upsert('itemCategories', obj);
    window.DB.emitChange('itemCategories');
    window.State.closeModal();
    window.State.showToast(`Category "${name}" saved successfully!`);
    this.refresh();
  },

  deleteCategory(catId) {
    const cat = window.DB.getById('itemCategories', catId);
    if (!cat) return;
    const items = window.DB.getAll('items') || [];
    const subcats = window.DB.getAll('itemSubcategories') || [];
    const linkedItems = items.filter(i => i.category_id === catId || i.category_id === cat.code);
    const linkedSubs = subcats.filter(s => s.category_id === catId || s.category_id === cat.code);

    if (linkedItems.length > 0) {
      window.State.showToast(`Cannot delete category "${cat.name}": ${linkedItems.length} items are currently assigned to this category.`, 'error');
      return;
    }
    if (linkedSubs.length > 0) {
      window.State.showToast(`Cannot delete category "${cat.name}": ${linkedSubs.length} sub-categories are linked to it. Delete or reassign them first.`, 'error');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete category "${cat.name}"?`)) {
      window.DB.delete('itemCategories', catId);
      window.DB.emitChange('itemCategories');
      window.State.showToast(`Category "${cat.name}" deleted successfully.`);
      this.refresh();
    }
  },

  setSubcategoryFilter(val) {
    this.categoryFilter = val;
    this.refresh();
  },

  showAddSubcategoryModal(parentCatId = null) {
    const categories = window.DB.getAll('itemCategories') || [];
    const defaultParent = parentCatId || (categories.length > 0 ? categories[0].id : '');
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveSubcategory(null);">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Parent Main Category <span style="color: var(--color-danger)">*</span></label>
          <select id="subcat-parent" class="form-control" required>
            ${categories.map(c => `<option value="${c.id}" ${c.id === defaultParent ? 'selected' : ''}>${c.name} (${c.code || c.id})</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Sub-Category Code <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="subcat-code" class="form-control cell-mono" required placeholder="e.g. SUB-ENG-01" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Sub-Category Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="subcat-name" class="form-control" required placeholder="e.g. Carburetor Components" />
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Status</label>
          <select id="subcat-status" class="form-control">
            <option value="Active" selected>Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Sub-Category</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: 'Add Sub-Category', contentHtml });
  },

  showEditSubcategoryModal(subId) {
    const sub = window.DB.getById('itemSubcategories', subId);
    if (!sub) return;
    const categories = window.DB.getAll('itemCategories') || [];
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveSubcategory('${sub.id}');">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Parent Main Category <span style="color: var(--color-danger)">*</span></label>
          <select id="subcat-parent" class="form-control" required>
            ${categories.map(c => `<option value="${c.id}" ${sub.category_id === c.id ? 'selected' : ''}>${c.name} (${c.code || c.id})</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Sub-Category Code</label>
          <input type="text" id="subcat-code" class="form-control cell-mono" value="${sub.code || sub.id}" readonly />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Sub-Category Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="subcat-name" class="form-control" value="${sub.name}" required />
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Status</label>
          <select id="subcat-status" class="form-control">
            <option value="Active" ${(sub.status === 'Active' || !sub.status) ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${sub.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Sub-Category</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: `Edit Sub-Category: ${sub.name}`, contentHtml });
  },

  saveSubcategory(subId) {
    const parentId = document.getElementById('subcat-parent').value;
    const code = document.getElementById('subcat-code').value.trim();
    const name = document.getElementById('subcat-name').value.trim();
    const status = document.getElementById('subcat-status') ? document.getElementById('subcat-status').value : 'Active';

    const obj = {
      id: subId || `SUB-${Date.now()}`,
      category_id: parentId,
      code,
      name,
      status
    };
    window.DB.upsert('itemSubcategories', obj);
    window.DB.emitChange('itemSubcategories');
    window.State.closeModal();
    window.State.showToast(`Sub-Category "${name}" saved!`);
    this.refresh();
  },

  deleteSubcategory(subId) {
    const sub = window.DB.getById('itemSubcategories', subId);
    if (!sub) return;
    const items = window.DB.getAll('items') || [];
    const linkedItems = items.filter(i => i.subcategory_id === subId || i.subcategory_id === sub.code);

    if (linkedItems.length > 0) {
      window.State.showToast(`Cannot delete sub-category "${sub.name}": ${linkedItems.length} items are currently assigned to it.`, 'error');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete sub-category "${sub.name}"?`)) {
      window.DB.delete('itemSubcategories', subId);
      window.DB.emitChange('itemSubcategories');
      window.State.showToast(`Sub-category "${sub.name}" deleted successfully.`);
      this.refresh();
    }
  },

  // -------------------------------------------------------------------------
  // 4. BRAND MASTER TAB (#/item-brands)
  // -------------------------------------------------------------------------
  setBrandSearch(val) {
    this.brandSearchTerm = val || '';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemBrands');
    }
    this.refresh();
  },

  setBrandCountryFilter(val) {
    this.brandCountryFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemBrands');
    }
    this.refresh();
  },

  setBrandStatusFilter(val) {
    this.brandStatusFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemBrands');
    }
    this.refresh();
  },

  resetBrandFilters() {
    this.brandSearchTerm = '';
    this.brandCountryFilter = 'ALL';
    this.brandStatusFilter = 'ALL';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemBrands');
    }
    this.refresh();
  },

  renderBrandsTab() {
    this.ensureSeedData();
    const allBrands = window.DB.getAll('itemBrands') || [];
    const items = window.DB.getAll('items') || [];

    const search = (this.brandSearchTerm || '').toLowerCase().trim();
    const countryFilter = this.brandCountryFilter || 'ALL';
    const statusFilter = this.brandStatusFilter || 'ALL';

    const countries = Array.from(new Set(allBrands.map(b => b.country).filter(Boolean))).sort();

    const filteredBrands = allBrands.filter(b => {
      if (countryFilter !== 'ALL' && b.country !== countryFilter) return false;
      const isActive = (b.status === 'Active' || !b.status);
      if (statusFilter === 'Active' && !isActive) return false;
      if (statusFilter === 'Inactive' && isActive) return false;
      if (search) {
        const matches = (b.name && b.name.toLowerCase().includes(search)) ||
                        (b.code && b.code.toLowerCase().includes(search)) ||
                        (b.country && b.country.toLowerCase().includes(search)) ||
                        (b.specialization && b.specialization.toLowerCase().includes(search));
        if (!matches) return false;
      }
      return true;
    });

    const pagedBrands = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filteredBrands, 'itemBrands')
      : { items: filteredBrands, totalRecords: filteredBrands.length, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>Brand Master</span>
              <span class="badge badge-primary" style="font-size: 11px;">${filteredBrands.length} of ${allBrands.length} Brands</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">Registered OEM & Aftermarket Brands (BRD Section 24 & 34)</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <!-- Country Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 135px;" onchange="window.ItemSetupModule.setBrandCountryFilter(this.value)">
              <option value="ALL" ${countryFilter === 'ALL' ? 'selected' : ''}>All Countries</option>
              ${countries.map(c => `<option value="${c}" ${countryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>

            <!-- Status Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 105px;" onchange="window.ItemSetupModule.setBrandStatusFilter(this.value)">
              <option value="ALL" ${statusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
              <option value="Active" ${statusFilter === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>

            <!-- Search Input -->
            <div style="position: relative; min-width: 200px; max-width: 260px;">
              <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-muted); pointer-events: none;">🔍</span>
              <input 
                type="text" 
                id="brand-search-input"
                class="form-control form-control-sm" 
                style="padding-left: 32px !important; padding-right: 28px !important;" 
                placeholder="Search brand, origin..." 
                value="${this.brandSearchTerm || ''}" 
                oninput="window.ItemSetupModule.setBrandSearch(this.value)"
              />
              ${this.brandSearchTerm ? `
                <button type="button" onclick="window.ItemSetupModule.setBrandSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px;" title="Clear search">✕</button>
              ` : ''}
            </div>

            <!-- Add Brand Button -->
            <button class="btn btn-primary btn-sm" onclick="window.ItemSetupModule.showAddBrandModal()">
              <span>+ Add Brand</span>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Brand Code</th>
                <th>Brand Name</th>
                <th>Country / Origin</th>
                <th>Specialization</th>
                <th>Total Items</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBrands.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
                  No brands match the current filters.
                  <button type="button" class="btn btn-link btn-sm" style="padding: 0 4px;" onclick="window.ItemSetupModule.resetBrandFilters()">Reset Filters</button>
                </td></tr>
              ` : pagedBrands.items.map(b => {
                const count = items.filter(i => (i.brand || '').toLowerCase() === b.name.toLowerCase()).length;
                const isActive = (b.status === 'Active' || !b.status);
                return `
                  <tr>
                    <td><span class="cell-mono cell-strong" style="color: var(--primary-300);">${b.code || b.id}</span></td>
                    <td><span style="font-weight: 600; font-size: 13px;">${b.name}</span></td>
                    <td><span style="font-size: 12px;">${b.country || 'India'}</span></td>
                    <td><span style="font-size: 12px; color: var(--text-secondary);">${b.specialization || 'Spares'}</span></td>
                    <td><span style="font-weight: 600; font-size: 12.5px;">${count}</span></td>
                    <td><span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 4px; align-items: center;">
                        <button class="btn btn-icon btn-sm" title="Edit Brand" onclick="window.ItemSetupModule.showEditBrandModal('${b.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="Delete Brand" style="color: var(--color-danger, #ef4444);" onclick="window.ItemSetupModule.deleteBrand('${b.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          totalRecords: filteredBrands.length,
          currentPage: pagedBrands.currentPage,
          pageSize: pagedBrands.pageSize,
          onPageChange: "window.ItemSetupModule.setPage(%p%, 'itemBrands')",
          onPageSizeChange: "window.ItemSetupModule.setPageSize(%s%, 'itemBrands')"
        }) : ''}
      </div>
    `;
  },

  showAddBrandModal() {
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveBrand(null);">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Brand Code <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="brand-code" class="form-control cell-mono" required placeholder="e.g. BRD-BREMBO" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Brand Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="brand-name" class="form-control" required placeholder="e.g. Brembo" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Country / Origin</label>
          <input type="text" id="brand-country" class="form-control" value="India" />
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Specialization</label>
          <input type="text" id="brand-spec" class="form-control" placeholder="e.g. High Performance Brakes" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Brand</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: 'Add Brand', contentHtml });
  },

  showEditBrandModal(bId) {
    const brand = window.DB.getById('itemBrands', bId);
    if (!brand) return;
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveBrand('${brand.id}');">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Brand Code</label>
          <input type="text" id="brand-code" class="form-control cell-mono" value="${brand.code || brand.id}" readonly />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Brand Name</label>
          <input type="text" id="brand-name" class="form-control" value="${brand.name}" required />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Country</label>
          <input type="text" id="brand-country" class="form-control" value="${brand.country || 'India'}" />
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Specialization</label>
          <input type="text" id="brand-spec" class="form-control" value="${brand.specialization || ''}" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Brand</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: `Edit Brand: ${brand.name}`, contentHtml });
  },

  saveBrand(bId) {
    const code = document.getElementById('brand-code').value.trim();
    const name = document.getElementById('brand-name').value.trim();
    const country = document.getElementById('brand-country').value.trim();
    const spec = document.getElementById('brand-spec').value.trim();

    const obj = {
      id: bId || `BRD-${Date.now()}`,
      code,
      name,
      country,
      specialization: spec,
      status: 'Active'
    };
    window.DB.upsert('itemBrands', obj);
    window.DB.emitChange('itemBrands');
    window.State.closeModal();
    window.State.showToast(`Brand "${name}" saved!`);
    this.refresh();
  },

  deleteBrand(bId) {
    const brand = window.DB.getById('itemBrands', bId);
    if (!brand) return;
    const items = window.DB.getAll('items') || [];
    const linkedItems = items.filter(i => (i.brand || '').toLowerCase() === (brand.name || '').toLowerCase() || (i.brand || '').toLowerCase() === (brand.code || '').toLowerCase());

    if (linkedItems.length > 0) {
      window.State.showToast(`Cannot delete brand "${brand.name}": ${linkedItems.length} items are currently assigned to this brand.`, 'error');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete brand "${brand.name}"?`)) {
      window.DB.delete('itemBrands', bId);
      window.DB.emitChange('itemBrands');
      window.State.showToast(`Brand "${brand.name}" deleted successfully.`);
      this.refresh();
    }
  },

  // -------------------------------------------------------------------------
  // 5. MANUFACTURER MASTER TAB (#/item-manufacturers)
  // -------------------------------------------------------------------------
  setMfgSearch(val) {
    this.mfgSearchTerm = val || '';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemManufacturers');
    }
    this.refresh();
  },

  setMfgTypeFilter(val) {
    this.mfgTypeFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemManufacturers');
    }
    this.refresh();
  },

  setMfgStatusFilter(val) {
    this.mfgStatusFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemManufacturers');
    }
    this.refresh();
  },

  resetMfgFilters() {
    this.mfgSearchTerm = '';
    this.mfgTypeFilter = 'ALL';
    this.mfgStatusFilter = 'ALL';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('itemManufacturers');
    }
    this.refresh();
  },

  renderManufacturersTab() {
    this.ensureSeedData();
    const allMfgs = window.DB.getAll('itemManufacturers') || [];
    const items = window.DB.getAll('items') || [];

    const search = (this.mfgSearchTerm || '').toLowerCase().trim();
    const typeFilter = this.mfgTypeFilter || 'ALL';
    const statusFilter = this.mfgStatusFilter || 'ALL';

    const filteredMfgs = allMfgs.filter(m => {
      if (typeFilter !== 'ALL' && m.type !== typeFilter) return false;
      const isActive = (m.status === 'Active' || !m.status);
      if (statusFilter === 'Active' && !isActive) return false;
      if (statusFilter === 'Inactive' && isActive) return false;
      if (search) {
        const matches = (m.name && m.name.toLowerCase().includes(search)) ||
                        (m.code && m.code.toLowerCase().includes(search)) ||
                        (m.country && m.country.toLowerCase().includes(search)) ||
                        (m.type && m.type.toLowerCase().includes(search));
        if (!matches) return false;
      }
      return true;
    });

    const pagedMfgs = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filteredMfgs, 'itemManufacturers')
      : { items: filteredMfgs, totalRecords: filteredMfgs.length, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>Manufacturer Master</span>
              <span class="badge badge-primary" style="font-size: 11px;">${filteredMfgs.length} of ${allMfgs.length} Manufacturers</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">Two-Wheeler Spare Parts Manufacturers (BRD Section 24)</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <!-- Classification Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 150px;" onchange="window.ItemSetupModule.setMfgTypeFilter(this.value)">
              <option value="ALL" ${typeFilter === 'ALL' ? 'selected' : ''}>All Classifications</option>
              <option value="OEM" ${typeFilter === 'OEM' ? 'selected' : ''}>OEM (Two-Wheeler)</option>
              <option value="Tier-1" ${typeFilter === 'Tier-1' ? 'selected' : ''}>Tier-1 Component Mfgs</option>
            </select>

            <!-- Status Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 105px;" onchange="window.ItemSetupModule.setMfgStatusFilter(this.value)">
              <option value="ALL" ${statusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
              <option value="Active" ${statusFilter === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>

            <!-- Search Input -->
            <div style="position: relative; min-width: 200px; max-width: 260px;">
              <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-muted); pointer-events: none;">🔍</span>
              <input 
                type="text" 
                id="mfg-search-input"
                class="form-control form-control-sm" 
                style="padding-left: 32px !important; padding-right: 28px !important;" 
                placeholder="Search manufacturer, code..." 
                value="${this.mfgSearchTerm || ''}" 
                oninput="window.ItemSetupModule.setMfgSearch(this.value)"
              />
              ${this.mfgSearchTerm ? `
                <button type="button" onclick="window.ItemSetupModule.setMfgSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px;" title="Clear search">✕</button>
              ` : ''}
            </div>

            <!-- Add Manufacturer Button -->
            <button class="btn btn-primary btn-sm" onclick="window.ItemSetupModule.showAddManufacturerModal()">
              <span>+ Add Manufacturer</span>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Manufacturer Code</th>
                <th>Manufacturer Name</th>
                <th>Classification</th>
                <th>Country</th>
                <th>Items Produced</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMfgs.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
                  No manufacturers match the current filters.
                  <button type="button" class="btn btn-link btn-sm" style="padding: 0 4px;" onclick="window.ItemSetupModule.resetMfgFilters()">Reset Filters</button>
                </td></tr>
              ` : pagedMfgs.items.map(m => {
                const count = items.filter(i => (i.manufacturer || '').toLowerCase() === m.name.toLowerCase()).length;
                const isActive = (m.status === 'Active' || !m.status);
                return `
                  <tr>
                    <td><span class="cell-mono cell-strong" style="color: var(--primary-300);">${m.code || m.id}</span></td>
                    <td><span style="font-weight: 600; font-size: 13px;">${m.name}</span></td>
                    <td><span class="badge ${m.type === 'OEM' ? 'badge-primary' : 'badge-subtle'}">${m.type || 'Tier-1'}</span></td>
                    <td><span style="font-size: 12px;">${m.country || 'India'}</span></td>
                    <td><span style="font-weight: 600; font-size: 12.5px;">${count}</span></td>
                    <td><span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 4px; align-items: center;">
                        <button class="btn btn-icon btn-sm" title="Edit Manufacturer" onclick="window.ItemSetupModule.showEditManufacturerModal('${m.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="Delete Manufacturer" style="color: var(--color-danger, #ef4444);" onclick="window.ItemSetupModule.deleteManufacturer('${m.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          totalRecords: filteredMfgs.length,
          currentPage: pagedMfgs.currentPage,
          pageSize: pagedMfgs.pageSize,
          onPageChange: "window.ItemSetupModule.setPage(%p%, 'itemManufacturers')",
          onPageSizeChange: "window.ItemSetupModule.setPageSize(%s%, 'itemManufacturers')"
        }) : ''}
      </div>
    `;
  },

  showAddManufacturerModal() {
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveManufacturer(null);">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Manufacturer Code <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="mfg-code" class="form-control cell-mono" required placeholder="e.g. MFG-LUMAX" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Manufacturer Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="mfg-name" class="form-control" required placeholder="e.g. Lumax Auto Technologies Ltd." />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Classification</label>
          <select id="mfg-type" class="form-control">
            <option value="Tier-1">Tier-1 OEM Supplier</option>
            <option value="OEM">Vehicle Manufacturer (OEM)</option>
            <option value="Aftermarket">Aftermarket Manufacturer</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Country</label>
          <input type="text" id="mfg-country" class="form-control" value="India" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Manufacturer</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: 'Add Manufacturer', contentHtml });
  },

  showEditManufacturerModal(mId) {
    const m = window.DB.getById('itemManufacturers', mId);
    if (!m) return;
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveManufacturer('${m.id}');">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Manufacturer Code</label>
          <input type="text" id="mfg-code" class="form-control cell-mono" value="${m.code || m.id}" readonly />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Manufacturer Name</label>
          <input type="text" id="mfg-name" class="form-control" value="${m.name}" required />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Classification</label>
          <select id="mfg-type" class="form-control">
            <option value="Tier-1" ${m.type === 'Tier-1' ? 'selected' : ''}>Tier-1 OEM Supplier</option>
            <option value="OEM" ${m.type === 'OEM' ? 'selected' : ''}>Vehicle Manufacturer (OEM)</option>
            <option value="Aftermarket" ${m.type === 'Aftermarket' ? 'selected' : ''}>Aftermarket Manufacturer</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Country</label>
          <input type="text" id="mfg-country" class="form-control" value="${m.country || 'India'}" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Manufacturer</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: `Edit Manufacturer: ${m.name}`, contentHtml });
  },

  saveManufacturer(mId) {
    const code = document.getElementById('mfg-code').value.trim();
    const name = document.getElementById('mfg-name').value.trim();
    const type = document.getElementById('mfg-type').value;
    const country = document.getElementById('mfg-country').value.trim();

    const obj = {
      id: mId || `MFG-${Date.now()}`,
      code,
      name,
      type,
      country,
      status: 'Active'
    };
    window.DB.upsert('itemManufacturers', obj);
    window.DB.emitChange('itemManufacturers');
    window.State.closeModal();
    window.State.showToast(`Manufacturer "${name}" saved!`);
    this.refresh();
  },

  deleteManufacturer(mId) {
    const mfg = window.DB.getById('itemManufacturers', mId);
    if (!mfg) return;
    const items = window.DB.getAll('items') || [];
    const linkedItems = items.filter(i => (i.manufacturer || '').toLowerCase() === (mfg.name || '').toLowerCase() || (i.manufacturer || '').toLowerCase() === (mfg.code || '').toLowerCase());

    if (linkedItems.length > 0) {
      window.State.showToast(`Cannot delete manufacturer "${mfg.name}": ${linkedItems.length} items are currently assigned to this manufacturer.`, 'error');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete manufacturer "${mfg.name}"?`)) {
      window.DB.delete('itemManufacturers', mId);
      window.DB.emitChange('itemManufacturers');
      window.State.showToast(`Manufacturer "${mfg.name}" deleted successfully.`);
      this.refresh();
    }
  },

  // -------------------------------------------------------------------------
  // 6. VEHICLE COMPATIBILITY MASTER TAB (#/vehicle-compatibility)
  // -------------------------------------------------------------------------
  setVehicleSearch(val) {
    this.vehicleSearchTerm = val || '';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('vehicleModels');
    }
    this.refresh();
  },

  setVehicleFuelFilter(val) {
    this.vehicleFuelFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('vehicleModels');
    }
    this.refresh();
  },

  setVehicleStatusFilter(val) {
    this.vehicleStatusFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('vehicleModels');
    }
    this.refresh();
  },

  setVehicleFavFilter(val) {
    this.vehicleFavFilter = val || 'ALL';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('vehicleModels');
    }
    this.refresh();
  },

  toggleVehicleFavFilter() {
    this.vehicleFavFilter = (this.vehicleFavFilter === 'FAV') ? 'ALL' : 'FAV';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('vehicleModels');
    }
    this.refresh();
  },

  toggleVehicleFavourite(modelId, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }
    }
    const user = (window.State && typeof window.State.getCurrentUser === 'function') ? window.State.getCurrentUser() : null;
    if (!user || user.status !== 'ACTIVE') {
      if (window.State && window.State.showToast) {
        window.State.showToast('Please log in with an active account to manage favourite vehicles.', 'warning');
      }
      return;
    }
    const model = (window.DB.getAll('vehicleModels') || []).find(m => m.id === modelId) || {};
    const modelName = model.name ? `${model.name}${model.variant ? ' (' + model.variant + ')' : ''}` : 'Vehicle model';
    const res = (window.State && typeof window.State.toggleVehicleModelFavourite === 'function')
      ? window.State.toggleVehicleModelFavourite(modelId)
      : (window.DB ? window.DB.toggleVehicleModelFavourite(user.id || 'USR-001', modelId, user) : { success: false });

    if (res && res.success) {
      if (window.State && window.State.showToast) {
        if (res.isFavourite) {
          window.State.showToast(`⭐ "${modelName}" marked as favourite vehicle model.`, 'success');
        } else {
          window.State.showToast(`Removed "${modelName}" from favourite vehicle models.`, 'info');
        }
      }
      this.refresh();
    }
  },

  resetVehicleFilters() {
    this.vehicleSearchTerm = '';
    this.vehicleFuelFilter = 'ALL';
    this.vehicleStatusFilter = 'ALL';
    this.vehicleFavFilter = 'ALL';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('vehicleModels');
    }
    this.refresh();
  },

  renderVehicleCompatibilityTab() {
    this.ensureSeedData();

    // Auto-heal deduplicate any duplicate vehicleModels by code / id
    if (window.DB && window.DB.data && Array.isArray(window.DB.data.vehicleModels)) {
      const seen = new Set();
      const deduped = [];
      let hadDuplicates = false;
      window.DB.data.vehicleModels.forEach(v => {
        const key = String(v.code || v.id || '').toUpperCase().trim();
        if (key) {
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(v);
          } else {
            hadDuplicates = true;
          }
        } else {
          deduped.push(v);
        }
      });
      if (hadDuplicates) {
        window.DB.data.vehicleModels = deduped;
        if (typeof window.DB.saveData === 'function') window.DB.saveData();
      }
    }

    const allVehicles = window.DB.getAll('vehicleModels') || [];
    const items = window.DB.getAll('items') || [];

    const userFavIds = (window.State && typeof window.State.getUserFavouriteVehicleModelIds === 'function')
      ? window.State.getUserFavouriteVehicleModelIds()
      : (window.DB ? window.DB.getUserFavouriteVehicleModelIds() : []);
    const userFavSet = new Set(userFavIds);

    const search = (this.vehicleSearchTerm || '').toLowerCase().trim();
    const fuelFilter = this.vehicleFuelFilter || 'ALL';
    const statusFilter = this.vehicleStatusFilter || 'ALL';
    const favFilter = this.vehicleFavFilter || 'ALL';

    const filteredVehicles = allVehicles.filter(v => {
      if (favFilter === 'FAV' && !userFavSet.has(v.id)) return false;
      if (fuelFilter !== 'ALL' && v.fuel_type !== fuelFilter) return false;
      const isActive = (v.status === 'Active' || !v.status);
      if (statusFilter === 'Active' && !isActive) return false;
      if (statusFilter === 'Inactive' && isActive) return false;
      if (search) {
        const matches = (v.name && v.name.toLowerCase().includes(search)) ||
                        (v.code && v.code.toLowerCase().includes(search)) ||
                        (v.variant && v.variant.toLowerCase().includes(search)) ||
                        (String(v.displacement_cc || '').includes(search));
        if (!matches) return false;
      }
      return true;
    });

    const pagedVehicles = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filteredVehicles, 'vehicleModels')
      : { items: filteredVehicles, totalRecords: filteredVehicles.length, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>Vehicle Compatibility Master</span>
              <span class="badge badge-primary" style="font-size: 11px;">${filteredVehicles.length} of ${allVehicles.length} Models</span>
              ${userFavIds.length > 0 ? `<span class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); font-size: 11px;">⭐ ${userFavIds.length} Favourites</span>` : ''}
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">Two-Wheeler Models & Generation Specifications (BRD Section 11)</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <!-- Favourite Vehicles Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 145px;" onchange="window.ItemSetupModule.setVehicleFavFilter(this.value)">
              <option value="ALL" ${favFilter === 'ALL' ? 'selected' : ''}>All Vehicles</option>
              <option value="FAV" ${favFilter === 'FAV' ? 'selected' : ''}>⭐ Favourite Vehicles (${userFavIds.length})</option>
            </select>

            <button type="button" 
              class="btn btn-sm ${favFilter === 'FAV' ? 'btn-primary' : 'btn-secondary'}" 
              onclick="window.ItemSetupModule.toggleVehicleFavFilter()" 
              title="${favFilter === 'FAV' ? 'Show all vehicle models' : 'Filter to show only favourite vehicle models'}" 
              style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; ${favFilter === 'FAV' ? 'background: #f59e0b; border-color: #d97706; color: #111827;' : ''}">
              <span>${favFilter === 'FAV' ? '⭐ Favourites Active' : '⭐ Favourites'}${userFavIds.length ? ` (${userFavIds.length})` : ''}</span>
            </button>

            <!-- Fuel Type Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 130px;" onchange="window.ItemSetupModule.setVehicleFuelFilter(this.value)">
              <option value="ALL" ${fuelFilter === 'ALL' ? 'selected' : ''}>All Fuel Types</option>
              <option value="Petrol" ${fuelFilter === 'Petrol' ? 'selected' : ''}>Petrol</option>
              <option value="EV" ${fuelFilter === 'EV' ? 'selected' : ''}>Electric (EV)</option>
              <option value="Hybrid" ${fuelFilter === 'Hybrid' ? 'selected' : ''}>Hybrid</option>
            </select>

            <!-- Status Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 105px;" onchange="window.ItemSetupModule.setVehicleStatusFilter(this.value)">
              <option value="ALL" ${statusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
              <option value="Active" ${statusFilter === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>

            <!-- Search Input -->
            <div style="position: relative; min-width: 200px; max-width: 260px;">
              <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-muted); pointer-events: none;">🔍</span>
              <input 
                type="text" 
                id="vehicle-search-input"
                class="form-control form-control-sm" 
                style="padding-left: 32px !important; padding-right: 28px !important;" 
                placeholder="Search model, variant, CC..." 
                value="${this.vehicleSearchTerm || ''}" 
                oninput="window.ItemSetupModule.setVehicleSearch(this.value)"
              />
              ${this.vehicleSearchTerm ? `
                <button type="button" onclick="window.ItemSetupModule.setVehicleSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px;" title="Clear search">✕</button>
              ` : ''}
            </div>

            <!-- Export Vehicles Button -->
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.ItemSetupModule.exportVehiclesCsv()" title="Export vehicle models to CSV" style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
              <span>📤 Export</span>
            </button>

            <!-- Import Vehicles Button -->
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.ItemSetupModule.showImportVehiclesModal()" title="Upload vehicles via CSV file" style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
              <span>📥 Import</span>
            </button>

            <!-- Add Vehicle Model Button -->
            <button type="button" class="btn btn-primary btn-sm" onclick="window.ItemSetupModule.showAddVehicleModal()" style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
              <span>+ Add Vehicle Model</span>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 44px; text-align: center;" title="Favourite">⭐</th>
                <th>Model Code</th>
                <th>Model Name</th>
                <th>Variant</th>
                <th>Engine CC</th>
                <th>Fuel Type</th>
                <th>Year Range</th>
                <th>Compatible Spares</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredVehicles.length === 0 ? `
                <tr><td colspan="10" style="text-align: center; padding: 24px; color: var(--text-muted);">
                  ${favFilter === 'FAV'
                    ? 'No favourite vehicle models found. Click the ⭐ icon against any vehicle model in the list to mark it as a favourite.'
                    : 'No vehicle models match the current filters.'}
                  <button type="button" class="btn btn-link btn-sm" style="padding: 0 4px;" onclick="window.ItemSetupModule.resetVehicleFilters()">Reset Filters</button>
                </td></tr>
              ` : pagedVehicles.items.map(v => {
                const compCount = items.filter(i => (i.vehicle_model_ids || []).includes(v.id)).length;
                const isActive = (v.status === 'Active' || !v.status);
                const isFav = userFavSet.has(v.id);
                return `
                  <tr data-vehicle-id="${v.id}" data-is-favourite="${isFav}">
                    <td style="text-align: center; vertical-align: middle;">
                      <button type="button" 
                        class="btn btn-icon btn-sm fav-model-star-btn" 
                        onclick="window.ItemSetupModule.toggleVehicleFavourite('${v.id}', event)" 
                        title="${isFav ? 'Remove from favourites' : 'Mark as favourite'}"
                        style="background: transparent; border: none; cursor: pointer; font-size: 16px; padding: 2px 4px; line-height: 1; transition: transform 0.15s ease;"
                        onmouseover="this.style.transform='scale(1.25)'"
                        onmouseout="this.style.transform='scale(1)'">
                        ${isFav 
                          ? '<span style="color: #f59e0b; filter: drop-shadow(0 0 2px rgba(245,158,11,0.5));">⭐</span>' 
                          : '<span style="color: var(--text-muted, #64748b); opacity: 0.5;">☆</span>'
                        }
                      </button>
                    </td>
                    <td><span class="cell-mono cell-strong" style="color: var(--primary-300);">${v.code || v.id}</span></td>
                    <td>
                      <span style="font-weight: 600; font-size: 13px;">${v.name}</span>
                    </td>
                    <td><span style="font-size: 12px;">${v.variant || 'Standard'}</span></td>
                    <td><span style="font-size: 12px;">${v.displacement_cc || 110} cc</span></td>
                    <td><span class="badge ${v.fuel_type === 'EV' ? 'badge-success' : 'badge-subtle'}">${v.fuel_type || 'Petrol'}</span></td>
                    <td><span style="font-size: 12px;">${v.year_from || 2020} &ndash; ${v.year_to || 2026}</span></td>
                    <td><span class="badge badge-primary" style="font-size: 11px;">${compCount} Parts</span></td>
                    <td><span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 4px; align-items: center;">
                        <button class="btn btn-icon btn-sm" title="Edit Vehicle Model" onclick="window.ItemSetupModule.showEditVehicleModal('${v.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="Delete Vehicle Model" style="color: var(--color-danger, #ef4444);" onclick="window.ItemSetupModule.deleteVehicle('${v.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          totalRecords: filteredVehicles.length,
          currentPage: pagedVehicles.currentPage,
          pageSize: pagedVehicles.pageSize,
          onPageChange: "window.ItemSetupModule.setPage(%p%, 'vehicleModels')",
          onPageSizeChange: "window.ItemSetupModule.setPageSize(%s%, 'vehicleModels')"
        }) : ''}
      </div>
    `;
  },

  showAddVehicleModal() {
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveVehicle(null);">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Model Code <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="veh-code" class="form-control cell-mono" required placeholder="e.g. ACTIVA-7G" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Model Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="veh-name" class="form-control" required placeholder="e.g. Activa 7G" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Variant</label>
          <input type="text" id="veh-variant" class="form-control" placeholder="e.g. Smart Key Disc" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Displacement (CC)</label>
            <input type="number" id="veh-cc" class="form-control" value="110" />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Fuel Type</label>
            <select id="veh-fuel" class="form-control">
              <option value="Petrol">Petrol</option>
              <option value="EV">Electric Vehicle (EV)</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Year From</label>
            <input type="number" id="veh-yfrom" class="form-control" value="2022" />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Year To</label>
            <input type="number" id="veh-yto" class="form-control" value="2026" />
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Vehicle Model</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: 'Add Vehicle Model', contentHtml });
  },

  showEditVehicleModal(vId) {
    const v = window.DB.getById('vehicleModels', vId);
    if (!v) return;
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveVehicle('${v.id}');">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Model Code</label>
          <input type="text" id="veh-code" class="form-control cell-mono" value="${v.code || v.id}" readonly />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Model Name</label>
          <input type="text" id="veh-name" class="form-control" value="${v.name}" required />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Variant</label>
          <input type="text" id="veh-variant" class="form-control" value="${v.variant || ''}" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Year From</label>
            <input type="number" id="veh-yfrom" class="form-control" value="${v.year_from || 2020}" />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Year To</label>
            <input type="number" id="veh-yto" class="form-control" value="${v.year_to || 2026}" />
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Model</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: `Edit Vehicle Model: ${v.name}`, contentHtml });
  },

  saveVehicle(vId) {
    const code = document.getElementById('veh-code').value.trim();
    const name = document.getElementById('veh-name').value.trim();
    const variant = document.getElementById('veh-variant') ? document.getElementById('veh-variant').value.trim() : '';
    const yfrom = document.getElementById('veh-yfrom') ? Number(document.getElementById('veh-yfrom').value) : 2020;
    const yto = document.getElementById('veh-yto') ? Number(document.getElementById('veh-yto').value) : 2026;

    const obj = {
      id: vId || `MOD-${Date.now()}`,
      code,
      name,
      variant,
      year_from: yfrom,
      year_to: yto,
      active: true
    };
    window.DB.upsert('vehicleModels', obj);
    window.DB.emitChange('vehicleModels');
    window.State.closeModal();
    window.State.showToast(`Vehicle model "${name}" saved!`);
    this.refresh();
  },

  deleteVehicle(vId) {
    const veh = window.DB.getById('vehicleModels', vId);
    if (!veh) return;
    const items = window.DB.getAll('items') || [];
    const linkedItems = items.filter(i => (i.vehicle_model_ids || []).includes(vId) || (i.vehicle_model_ids || []).includes(veh.code));

    if (linkedItems.length > 0) {
      window.State.showToast(`Cannot delete vehicle model "${veh.name}": ${linkedItems.length} parts are currently mapped for fitment compatibility.`, 'error');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete vehicle model "${veh.name}"?`)) {
      window.DB.delete('vehicleModels', vId);
      window.DB.emitChange('vehicleModels');
      window.State.showToast(`Vehicle model deleted successfully.`);
      this.refresh();
    }
  },

  // -------------------------------------------------------------------------
  // VEHICLE COMPATIBILITY IMPORT & EXPORT
  // -------------------------------------------------------------------------
  exportVehiclesCsv() {
    const allVehicles = (window.DB && typeof window.DB.getAll === 'function') 
      ? (window.DB.getAll('vehicleModels') || []) 
      : [];

    if (allVehicles.length === 0) {
      if (window.State && window.State.showToast) {
        window.State.showToast('No vehicle models available to export.', 'warning');
      }
      return;
    }

    const headers = ['Model Code', 'Model Name', 'Variant', 'Engine CC', 'Fuel Type', 'Year From', 'Year To', 'Status'];
    const rows = allVehicles.map(v => [
      `"${(v.code || v.id || '').replace(/"/g, '""')}"`,
      `"${(v.name || '').replace(/"/g, '""')}"`,
      `"${(v.variant || '').replace(/"/g, '""')}"`,
      v.displacement_cc !== undefined ? v.displacement_cc : (v.cc || 110),
      `"${v.fuel_type || 'Petrol'}"`,
      v.year_from || 2020,
      v.year_to || 2026,
      `"${v.status || (v.active !== false ? 'Active' : 'Inactive')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vehicle_Compatibility_Master_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.State && window.State.showToast) {
      window.State.showToast(`Exported ${allVehicles.length} vehicle models to CSV.`, 'success');
    }
  },

  downloadVehicleSampleCsv() {
    const headers = ['Model Code', 'Model Name', 'Variant', 'Engine CC', 'Fuel Type', 'Year From', 'Year To', 'Status'];
    const samples = [
      ['ACTIVA-6G', 'Activa 6G', 'Deluxe (BS6)', '110', 'Petrol', '2020', '2026', 'Active'],
      ['JUPITER-125', 'Jupiter 125', 'Disc SmartXonnect', '125', 'Petrol', '2021', '2026', 'Active'],
      ['SPLENDOR-PLUS', 'Splendor Plus', 'Self Cast XTEC', '97', 'Petrol', '2018', '2026', 'Active'],
      ['APACHE-160', 'Apache RTR 160 4V', 'Dual Channel ABS', '160', 'Petrol', '2020', '2026', 'Active'],
      ['ATHER-450X', 'Ather 450X', 'Gen 3 Pro', '0', 'EV', '2022', '2026', 'Active'],
      ['CHETAK-EV', 'Bajaj Chetak', 'Premium Edition', '0', 'EV', '2021', '2026', 'Active'],
      ['PULSAR-150', 'Pulsar 150', 'Twin Disc UG5', '149', 'Petrol', '2019', '2026', 'Active']
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...samples.map(r => r.map(c => `"${c}"`).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vehicle_models_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.State && window.State.showToast) {
      window.State.showToast('Sample Vehicle Import template downloaded.', 'info');
    }
  },

  showImportVehiclesModal() {
    this._parsedVehicleImportData = null;

    const contentHtml = `
      <div style="font-size: 13px; line-height: 1.5; color: var(--text-primary);">
        <!-- Instructions & Template Banner -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; gap: 10px; flex-wrap: wrap;">
          <div>
            <div style="font-weight: 700; color: #38bdf8; font-size: 13px;">Upload Vehicle Models Template</div>
            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">
              CSV columns: Model Code, Model Name, Variant, Engine CC, Fuel Type, Year From, Year To, Status
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.ItemSetupModule.downloadVehicleSampleCsv()" style="font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <span>📥 Download Sample CSV</span>
          </button>
        </div>

        <!-- Mode Selection Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
          <button type="button" id="tab-btn-file" class="btn btn-sm btn-primary" onclick="window.ItemSetupModule.switchVehicleImportMode('file')" style="font-size: 11.5px; font-weight: 600;">
            📁 Upload CSV File
          </button>
          <button type="button" id="tab-btn-paste" class="btn btn-sm btn-secondary" onclick="window.ItemSetupModule.switchVehicleImportMode('paste')" style="font-size: 11.5px; font-weight: 600;">
            📋 Paste CSV Data
          </button>
        </div>

        <!-- Mode 1: File Upload -->
        <div id="veh-import-file-section" style="border: 2px dashed var(--border-medium); border-radius: 6px; padding: 20px; text-align: center; background: rgba(255,255,255,0.015); margin-bottom: 12px;">
          <div style="font-size: 28px; margin-bottom: 6px;">🛵</div>
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 3px;">Select or drop your Vehicle Compatibility CSV file</div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 12px;">Supports UTF-8 CSV files (up to 5,000 models per batch)</div>
          <input type="file" id="veh-import-file-input" accept=".csv, text/csv, text/plain" style="display: none;" onchange="window.ItemSetupModule.handleVehicleImportFile(this)" />
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('veh-import-file-input').click()" style="font-weight: 600;">
            Browse File...
          </button>
          <div id="veh-import-file-name" style="margin-top: 10px; font-size: 12px; color: #10b981; font-weight: 600; display: none;"></div>
        </div>

        <!-- Mode 2: Paste CSV Text -->
        <div id="veh-import-paste-section" style="display: none; margin-bottom: 12px;">
          <textarea 
            id="veh-import-paste-text" 
            class="form-control" 
            style="min-height: 120px; font-family: monospace; font-size: 11.5px; resize: vertical;" 
            placeholder="Model Code,Model Name,Variant,Engine CC,Fuel Type,Year From,Year To,Status&#10;ACTIVA-6G,Activa 6G,Deluxe,110,Petrol,2020,2026,Active&#10;JUPITER-125,Jupiter 125,Disc,125,Petrol,2021,2026,Active"
            oninput="window.ItemSetupModule.handleVehiclePasteChange(this.value)"
          ></textarea>
        </div>

        <!-- Upsert Option Checkbox -->
        <div style="margin-bottom: 12px; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-subtle);">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; margin: 0;">
            <input type="checkbox" id="veh-import-upsert-chk" checked style="cursor: pointer;" />
            <span><strong>Update existing records (Upsert):</strong> Overwrite matching Model Code with new specifications</span>
          </label>
        </div>

        <!-- Real-time Preview Area -->
        <div id="veh-import-preview-container" style="display: none; margin-top: 8px;">
          <div id="veh-import-status-strip" style="font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);"></div>
          <div style="max-height: 160px; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: 4px;">
            <table class="data-table" style="width: 100%; font-size: 11px; margin: 0;">
              <thead>
                <tr style="background: rgba(255,255,255,0.04);">
                  <th style="padding: 4px 8px;">Code</th>
                  <th style="padding: 4px 8px;">Model Name</th>
                  <th style="padding: 4px 8px;">Variant</th>
                  <th style="padding: 4px 8px;">CC</th>
                  <th style="padding: 4px 8px;">Fuel</th>
                  <th style="padding: 4px 8px;">Years</th>
                  <th style="padding: 4px 8px;">Status</th>
                </tr>
              </thead>
              <tbody id="veh-import-preview-tbody"></tbody>
            </table>
          </div>
        </div>

        <!-- Action Footer -->
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="button" id="veh-import-submit-btn" class="btn btn-primary" onclick="window.ItemSetupModule.executeVehicleImport()" disabled style="font-weight: 700;">
            <span>🚀 Confirm & Import Vehicles</span>
          </button>
        </div>
      </div>
    `;

    if (window.State && typeof window.State.showModal === 'function') {
      window.State.showModal({
        title: '📥 Bulk Import Vehicle Models (Vehicle Compatibility Master)',
        contentHtml,
        maxWidth: '680px'
      });
    }
  },

  switchVehicleImportMode(mode) {
    const fileSec = document.getElementById('veh-import-file-section');
    const pasteSec = document.getElementById('veh-import-paste-section');
    const btnFile = document.getElementById('tab-btn-file');
    const btnPaste = document.getElementById('tab-btn-paste');

    if (mode === 'file') {
      if (fileSec) fileSec.style.display = 'block';
      if (pasteSec) pasteSec.style.display = 'none';
      if (btnFile) { btnFile.className = 'btn btn-sm btn-primary'; }
      if (btnPaste) { btnPaste.className = 'btn btn-sm btn-secondary'; }
    } else {
      if (fileSec) fileSec.style.display = 'none';
      if (pasteSec) pasteSec.style.display = 'block';
      if (btnFile) { btnFile.className = 'btn btn-sm btn-secondary'; }
      if (btnPaste) { btnPaste.className = 'btn btn-sm btn-primary'; }
      const ta = document.getElementById('veh-import-paste-text');
      if (ta && ta.value) {
        this.handleVehiclePasteChange(ta.value);
      }
    }
  },

  handleVehicleImportFile(input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const nameEl = document.getElementById('veh-import-file-name');
    if (nameEl) {
      nameEl.style.display = 'block';
      nameEl.innerHTML = `✓ Selected: <b>${file.name}</b> (${(file.size / 1024).toFixed(1)} KB)`;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result || '';
      this.processVehicleCsvText(text);
    };
    reader.onerror = () => {
      if (window.State && window.State.showToast) {
        window.State.showToast('Failed to read file.', 'error');
      }
    };
    reader.readAsText(file, 'UTF-8');
  },

  handleVehiclePasteChange(text) {
    if (!text || !text.trim()) {
      this._parsedVehicleImportData = null;
      const prev = document.getElementById('veh-import-preview-container');
      if (prev) prev.style.display = 'none';
      const btn = document.getElementById('veh-import-submit-btn');
      if (btn) btn.disabled = true;
      return;
    }
    this.processVehicleCsvText(text);
  },

  parseCsv(text) {
    const lines = [];
    let row = [''];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
      lines.push(row);
    }
    return lines;
  },

  processVehicleCsvText(text) {
    const rawLines = this.parseCsv(text).filter(r => r.some(c => String(c).trim() !== ''));
    if (rawLines.length === 0) {
      this._parsedVehicleImportData = null;
      return;
    }

    // Determine header mapping
    let headerRow = rawLines[0].map(c => String(c).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    let dataRows = rawLines.slice(1);

    // Check if first row is actually a header
    const hasHeader = headerRow.some(h => 
      h.includes('code') || h.includes('model') || h.includes('name') || h.includes('variant') || h.includes('fuel')
    );

    let colMap = {
      code: -1,
      name: -1,
      variant: -1,
      cc: -1,
      fuel: -1,
      yfrom: -1,
      yto: -1,
      status: -1
    };

    if (hasHeader) {
      headerRow.forEach((h, idx) => {
        if (h.includes('code') || h === 'model_code' || h === 'id') colMap.code = idx;
        else if (h.includes('name') || h === 'model_name' || h === 'model') colMap.name = idx;
        else if (h.includes('variant') || h.includes('version')) colMap.variant = idx;
        else if (h.includes('cc') || h.includes('displacement') || h.includes('engine')) colMap.cc = idx;
        else if (h.includes('fuel')) colMap.fuel = idx;
        else if (h.includes('from') || h === 'year_from') colMap.yfrom = idx;
        else if (h.includes('to') || h === 'year_to') colMap.yto = idx;
        else if (h.includes('status') || h.includes('active')) colMap.status = idx;
      });
    } else {
      // Positional fallback
      dataRows = rawLines;
      colMap = { code: 0, name: 1, variant: 2, cc: 3, fuel: 4, yfrom: 5, yto: 6, status: 7 };
    }

    // If code and name collided or name is -1, fallback gracefully
    if (colMap.code === -1 && colMap.name !== -1) colMap.code = colMap.name;
    if (colMap.name === -1 && colMap.code !== -1) colMap.name = colMap.code;
    if (colMap.code === -1 && colMap.name === -1) {
      colMap.code = 0;
      colMap.name = 1 < headerRow.length ? 1 : 0;
    }

    const allExisting = (window.DB && typeof window.DB.getAll === 'function') 
      ? (window.DB.getAll('vehicleModels') || []) 
      : [];
    const existingCodes = new Set(allExisting.map(v => String(v.code || v.id).toUpperCase().trim()));

    const parsedRecords = [];
    let willUpdateCount = 0;
    let willAddCount = 0;

    dataRows.forEach((row, idx) => {
      const rawCode = colMap.code !== -1 && row[colMap.code] !== undefined ? String(row[colMap.code]).trim() : '';
      const rawName = colMap.name !== -1 && row[colMap.name] !== undefined ? String(row[colMap.name]).trim() : '';

      if (!rawCode && !rawName) return; // Skip blank rows

      const code = (rawCode || rawName.toUpperCase().replace(/\s+/g, '-')).toUpperCase();
      const name = rawName || rawCode;
      const variant = colMap.variant !== -1 && row[colMap.variant] !== undefined ? String(row[colMap.variant]).trim() : 'Standard';
      
      const rawCc = colMap.cc !== -1 && row[colMap.cc] !== undefined ? parseInt(String(row[colMap.cc]).replace(/\D/g, ''), 10) : 110;
      const cc = isNaN(rawCc) ? 110 : rawCc;

      const rawFuel = colMap.fuel !== -1 && row[colMap.fuel] !== undefined ? String(row[colMap.fuel]).trim() : 'Petrol';
      let fuel = 'Petrol';
      if (/electric|ev/i.test(rawFuel)) fuel = 'EV';
      else if (/hybrid/i.test(rawFuel)) fuel = 'Hybrid';

      const rawYFrom = colMap.yfrom !== -1 && row[colMap.yfrom] !== undefined ? parseInt(String(row[colMap.yfrom]).replace(/\D/g, ''), 10) : 2020;
      const yearFrom = isNaN(rawYFrom) ? 2020 : rawYFrom;

      const rawYTo = colMap.yto !== -1 && row[colMap.yto] !== undefined ? parseInt(String(row[colMap.yto]).replace(/\D/g, ''), 10) : 2026;
      const yearTo = isNaN(rawYTo) ? 2026 : rawYTo;

      const rawStatus = colMap.status !== -1 && row[colMap.status] !== undefined ? String(row[colMap.status]).trim() : 'Active';
      const status = /inactive|disabled|blocked|no|false/i.test(rawStatus) ? 'Inactive' : 'Active';

      const isUpdate = existingCodes.has(code);
      const existingInBatch = parsedRecords.find(p => p.code === code);
      if (existingInBatch) {
        Object.assign(existingInBatch, {
          name, variant, displacement_cc: cc, fuel_type: fuel, year_from: yearFrom, year_to: yearTo, status, active: (status === 'Active')
        });
        return;
      }

      if (isUpdate) willUpdateCount++;
      else willAddCount++;

      parsedRecords.push({
        code,
        name,
        variant,
        displacement_cc: cc,
        fuel_type: fuel,
        year_from: yearFrom,
        year_to: yearTo,
        status,
        active: (status === 'Active'),
        isUpdate
      });
    });

    this._parsedVehicleImportData = parsedRecords;

    // Update UI Preview
    const prevContainer = document.getElementById('veh-import-preview-container');
    const statusStrip = document.getElementById('veh-import-status-strip');
    const tbody = document.getElementById('veh-import-preview-tbody');
    const submitBtn = document.getElementById('veh-import-submit-btn');

    if (parsedRecords.length > 0) {
      if (prevContainer) prevContainer.style.display = 'block';
      if (statusStrip) {
        statusStrip.innerHTML = `✓ <strong>${parsedRecords.length} models ready to import</strong> (${willAddCount} new, ${willUpdateCount} existing to update)`;
      }
      if (tbody) {
        tbody.innerHTML = parsedRecords.slice(0, 5).map(r => `
          <tr style="border-bottom: 1px solid var(--border-subtle);">
            <td style="padding: 4px 8px;" class="cell-mono">${r.code}</td>
            <td style="padding: 4px 8px; font-weight: 600;">${r.name}</td>
            <td style="padding: 4px 8px; color: var(--text-muted);">${r.variant}</td>
            <td style="padding: 4px 8px;">${r.displacement_cc} cc</td>
            <td style="padding: 4px 8px;"><span class="badge ${r.fuel_type === 'EV' ? 'badge-success' : 'badge-subtle'}" style="font-size: 9.5px;">${r.fuel_type}</span></td>
            <td style="padding: 4px 8px;">${r.year_from}–${r.year_to}</td>
            <td style="padding: 4px 8px;"><span class="badge ${r.status === 'Active' ? 'badge-success' : 'badge-danger'}" style="font-size: 9.5px;">${r.status}</span></td>
          </tr>
        `).join('') + (parsedRecords.length > 5 ? `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 4px;">... and ${parsedRecords.length - 5} more records</td></tr>` : '');
      }
      if (submitBtn) submitBtn.disabled = false;
    } else {
      if (prevContainer) prevContainer.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;
    }
  },

  executeVehicleImport() {
    const records = this._parsedVehicleImportData;
    if (!Array.isArray(records) || records.length === 0) {
      if (window.State && window.State.showToast) {
        window.State.showToast('No valid vehicle models found to import.', 'warning');
      }
      return;
    }

    const upsertChk = document.getElementById('veh-import-upsert-chk');
    const allowUpsert = upsertChk ? upsertChk.checked : true;

    // Ensure array exists and deduplicate existing records first
    if (!window.DB.data.vehicleModels) {
      window.DB.data.vehicleModels = [];
    }

    const seenCodes = new Set();
    const cleanList = [];
    (window.DB.data.vehicleModels || []).forEach(v => {
      const key = String(v.code || v.id || '').toUpperCase().trim();
      if (key && !seenCodes.has(key)) {
        seenCodes.add(key);
        cleanList.push(v);
      } else if (!key) {
        cleanList.push(v);
      }
    });

    let added = 0;
    let updated = 0;
    let skipped = 0;

    records.forEach((rec, idx) => {
      const recCode = String(rec.code || '').toUpperCase().trim();
      const existing = cleanList.find(v => 
        (v.code && v.code.toUpperCase().trim() === recCode) || 
        (v.id && v.id.toUpperCase().trim() === recCode) ||
        (v.name && rec.name && v.name.toLowerCase().trim() === rec.name.toLowerCase().trim() && (v.variant || '') === (rec.variant || ''))
      );

      if (existing) {
        if (allowUpsert) {
          existing.name = rec.name;
          existing.variant = rec.variant;
          existing.displacement_cc = rec.displacement_cc;
          existing.fuel_type = rec.fuel_type;
          existing.year_from = rec.year_from;
          existing.year_to = rec.year_to;
          existing.status = rec.status;
          existing.active = rec.active;
          existing.updated_at = new Date().toISOString();
          updated++;
        } else {
          skipped++;
        }
      } else {
        const newVehicle = {
          id: rec.code || `MOD-${Date.now()}-${idx + 1}`,
          code: rec.code,
          name: rec.name,
          variant: rec.variant,
          displacement_cc: rec.displacement_cc,
          fuel_type: rec.fuel_type,
          year_from: rec.year_from,
          year_to: rec.year_to,
          status: rec.status,
          active: rec.active,
          manufacturer_id: 'VM-01',
          created_at: new Date().toISOString()
        };
        cleanList.push(newVehicle);
        if (recCode) seenCodes.add(recCode);
        added++;
      }
    });

    window.DB.data.vehicleModels = cleanList;

    if (window.DB && typeof window.DB.saveData === 'function') {
      window.DB.saveData();
    }
    if (window.DB && typeof window.DB.emitChange === 'function') {
      window.DB.emitChange('vehicleModels');
    }

    if (window.State && typeof window.State.closeModal === 'function') {
      window.State.closeModal();
    }

    const toastMsg = `Import completed: ${added} added, ${updated} updated${skipped > 0 ? `, ${skipped} skipped` : ''}.`;
    if (window.State && window.State.showToast) {
      window.State.showToast(toastMsg, 'success');
    }

    this.refresh();
  },

  // -------------------------------------------------------------------------
  // 7. UOM MASTER TAB (#/uom-master)
  // -------------------------------------------------------------------------
  setUomSearch(val) {
    this.uomSearchTerm = val || '';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('uoms');
    }
    this.refresh();
  },

  setUomTypeFilter(val) {
    this.uomTypeFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('uoms');
    }
    this.refresh();
  },

  setUomStatusFilter(val) {
    this.uomStatusFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('uoms');
    }
    this.refresh();
  },

  resetUomFilters() {
    this.uomSearchTerm = '';
    this.uomTypeFilter = 'ALL';
    this.uomStatusFilter = 'ALL';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('uoms');
    }
    this.refresh();
  },

  renderUomTab() {
    this.ensureSeedData();
    const allUoms = window.DB.getAll('uoms') || [];

    const search = (this.uomSearchTerm || '').toLowerCase().trim();
    const typeFilter = this.uomTypeFilter || 'ALL';
    const statusFilter = this.uomStatusFilter || 'ALL';

    const filteredUoms = allUoms.filter(u => {
      if (typeFilter !== 'ALL' && u.type !== typeFilter) return false;
      const isActive = (u.status === 'Active' || !u.status);
      if (statusFilter === 'Active' && !isActive) return false;
      if (statusFilter === 'Inactive' && isActive) return false;
      if (search) {
        const matches = (u.name && u.name.toLowerCase().includes(search)) ||
                        (u.code && u.code.toLowerCase().includes(search)) ||
                        (u.type && u.type.toLowerCase().includes(search)) ||
                        (u.base_uom && u.base_uom.toLowerCase().includes(search));
        if (!matches) return false;
      }
      return true;
    });

    const pagedUoms = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filteredUoms, 'uoms')
      : { items: filteredUoms, totalRecords: filteredUoms.length, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>Unit of Measurement (UOM) Master</span>
              <span class="badge badge-primary" style="font-size: 11px;">${filteredUoms.length} of ${allUoms.length} Units</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">Standard Units and Alternate Conversion Factors (BRD Section 12)</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <!-- Category Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 140px;" onchange="window.ItemSetupModule.setUomTypeFilter(this.value)">
              <option value="ALL" ${typeFilter === 'ALL' ? 'selected' : ''}>All Categories</option>
              <option value="Count" ${typeFilter === 'Count' ? 'selected' : ''}>Count / Quantity</option>
              <option value="Package" ${typeFilter === 'Package' ? 'selected' : ''}>Package / Carton</option>
              <option value="Volume" ${typeFilter === 'Volume' ? 'selected' : ''}>Volume / Liquid</option>
              <option value="Weight" ${typeFilter === 'Weight' ? 'selected' : ''}>Weight</option>
              <option value="Length" ${typeFilter === 'Length' ? 'selected' : ''}>Length / Distance</option>
            </select>

            <!-- Status Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 105px;" onchange="window.ItemSetupModule.setUomStatusFilter(this.value)">
              <option value="ALL" ${statusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
              <option value="Active" ${statusFilter === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>

            <!-- Search Input -->
            <div style="position: relative; min-width: 200px; max-width: 260px;">
              <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-muted); pointer-events: none;">🔍</span>
              <input 
                type="text" 
                id="uom-search-input"
                class="form-control form-control-sm" 
                style="padding-left: 32px !important; padding-right: 28px !important;" 
                placeholder="Search unit, code..." 
                value="${this.uomSearchTerm || ''}" 
                oninput="window.ItemSetupModule.setUomSearch(this.value)"
              />
              ${this.uomSearchTerm ? `
                <button type="button" onclick="window.ItemSetupModule.setUomSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px;" title="Clear search">✕</button>
              ` : ''}
            </div>

            <!-- Add Unit Button -->
            <button class="btn btn-primary btn-sm" onclick="window.ItemSetupModule.showAddUomModal()">
              <span>+ Add Unit (UOM)</span>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>UOM Code</th>
                <th>Unit Name</th>
                <th>Measurement Category</th>
                <th>Base Reference Unit</th>
                <th>Standard Conversion Factor</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUoms.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
                  No units match the current filters.
                  <button type="button" class="btn btn-link btn-sm" style="padding: 0 4px;" onclick="window.ItemSetupModule.resetUomFilters()">Reset Filters</button>
                </td></tr>
              ` : pagedUoms.items.map(u => {
                const isActive = (u.status === 'Active' || !u.status);
                return `
                  <tr>
                    <td><span class="cell-mono cell-strong" style="color: var(--primary-300);">${u.code}</span></td>
                    <td><span style="font-weight: 600; font-size: 13px;">${u.name}</span></td>
                    <td><span class="badge badge-subtle">${u.type || 'Count'}</span></td>
                    <td><span class="cell-mono" style="font-size: 12px;">${u.base_uom || u.code}</span></td>
                    <td><span style="font-size: 12.5px; font-weight: 500;">1 ${u.code} = ${u.conversion_factor || 1} ${u.base_uom || u.code}</span></td>
                    <td><span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 4px; align-items: center;">
                        <button class="btn btn-icon btn-sm" title="Edit UOM" onclick="window.ItemSetupModule.showEditUomModal('${u.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="Delete UOM" style="color: var(--color-danger, #ef4444);" onclick="window.ItemSetupModule.deleteUom('${u.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          totalRecords: filteredUoms.length,
          currentPage: pagedUoms.currentPage,
          pageSize: pagedUoms.pageSize,
          onPageChange: "window.ItemSetupModule.setPage(%p%, 'uoms')",
          onPageSizeChange: "window.ItemSetupModule.setPageSize(%s%, 'uoms')"
        }) : ''}
      </div>
    `;
  },

  showAddUomModal() {
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveUom(null);">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">UOM Code <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="uom-code" class="form-control cell-mono" required placeholder="e.g. ROLL" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Unit Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="uom-name" class="form-control" required placeholder="e.g. Roll" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Measurement Category</label>
          <select id="uom-type" class="form-control">
            <option value="Count">Count / Quantity</option>
            <option value="Package">Package / Carton</option>
            <option value="Volume">Volume / Liquid</option>
            <option value="Weight">Weight</option>
            <option value="Length">Length / Distance</option>
          </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Base Unit</label>
            <input type="text" id="uom-base" class="form-control cell-mono" value="MTR" />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Conversion Factor</label>
            <input type="number" id="uom-conv" class="form-control" value="10" step="any" />
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save UOM</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: 'Add Unit of Measurement', contentHtml });
  },

  showEditUomModal(uId) {
    const u = window.DB.getById('uoms', uId);
    if (!u) return;
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveUom('${u.id}');">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">UOM Code</label>
          <input type="text" id="uom-code" class="form-control cell-mono" value="${u.code}" readonly />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Unit Name</label>
          <input type="text" id="uom-name" class="form-control" value="${u.name}" required />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Base Unit</label>
            <input type="text" id="uom-base" class="form-control cell-mono" value="${u.base_uom || u.code}" />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Conversion Factor</label>
            <input type="number" id="uom-conv" class="form-control" value="${u.conversion_factor || 1}" step="any" />
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update UOM</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: `Edit UOM: ${u.name}`, contentHtml });
  },

  saveUom(uId) {
    const code = document.getElementById('uom-code').value.trim();
    const name = document.getElementById('uom-name').value.trim();
    const base = document.getElementById('uom-base') ? document.getElementById('uom-base').value.trim() : code;
    const conv = document.getElementById('uom-conv') ? Number(document.getElementById('uom-conv').value) : 1;
    const type = document.getElementById('uom-type') ? document.getElementById('uom-type').value : 'Count';

    const obj = {
      id: uId || `UOM-${Date.now()}`,
      code,
      name,
      base_uom: base,
      conversion_factor: conv,
      type,
      status: 'Active'
    };
    window.DB.upsert('uoms', obj);
    window.DB.emitChange('uoms');
    window.State.closeModal();
    window.State.showToast(`UOM "${name}" saved!`);
    this.refresh();
  },

  deleteUom(uId) {
    const uom = window.DB.getById('uoms', uId);
    if (!uom) return;
    const items = window.DB.getAll('items') || [];
    const linkedItems = items.filter(i => i.stock_uom === uom.code || i.purchase_uom === uom.code || i.alternate_uom === uom.code);

    if (linkedItems.length > 0) {
      window.State.showToast(`Cannot delete UOM "${uom.name}": ${linkedItems.length} items are currently configured with this unit of measure.`, 'error');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete UOM "${uom.name}" (${uom.code})?`)) {
      window.DB.delete('uoms', uId);
      window.DB.emitChange('uoms');
      window.State.showToast(`UOM "${uom.name}" deleted successfully.`);
      this.refresh();
    }
  },

  // -------------------------------------------------------------------------
  // 8. HSN/SAC MASTER TAB (#/hsn-master)
  // -------------------------------------------------------------------------
  setHsnSearch(val) {
    this.hsnSearchTerm = val || '';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('hsnCodes');
    }
    this.refresh();
  },

  setHsnGstFilter(val) {
    this.hsnGstFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('hsnCodes');
    }
    this.refresh();
  },

  setHsnStatusFilter(val) {
    this.hsnStatusFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('hsnCodes');
    }
    this.refresh();
  },

  resetHsnFilters() {
    this.hsnSearchTerm = '';
    this.hsnGstFilter = 'ALL';
    this.hsnStatusFilter = 'ALL';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('hsnCodes');
    }
    this.refresh();
  },

  renderHsnTab() {
    this.ensureSeedData();
    const allHsns = window.DB.getAll('hsnCodes') || [];

    const search = (this.hsnSearchTerm || '').toLowerCase().trim();
    const gstFilter = this.hsnGstFilter || 'ALL';
    const statusFilter = this.hsnStatusFilter || 'ALL';

    const filteredHsns = allHsns.filter(h => {
      if (gstFilter !== 'ALL' && String(h.gst_rate) !== String(gstFilter)) return false;
      const isActive = (h.status === 'Active' || !h.status);
      if (statusFilter === 'Active' && !isActive) return false;
      if (statusFilter === 'Inactive' && isActive) return false;
      if (search) {
        const matches = (h.code && h.code.toLowerCase().includes(search)) ||
                        (h.description && h.description.toLowerCase().includes(search));
        if (!matches) return false;
      }
      return true;
    });

    const pagedHsns = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filteredHsns, 'hsnCodes')
      : { items: filteredHsns, totalRecords: filteredHsns.length, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>HSN / SAC Master</span>
              <span class="badge badge-primary" style="font-size: 11px;">${filteredHsns.length} of ${allHsns.length} HSN Codes</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">Standard Tax Classifications for Two-Wheeler Parts & Services (BRD Section 13)</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <!-- GST Slab Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 130px;" onchange="window.ItemSetupModule.setHsnGstFilter(this.value)">
              <option value="ALL" ${gstFilter === 'ALL' ? 'selected' : ''}>All GST Slabs</option>
              ${((window.DB && typeof window.DB.getActiveTaxes === 'function') ? window.DB.getActiveTaxes() : []).map(t => `<option value="${t.rate}" ${gstFilter === String(t.rate) ? 'selected' : ''}>${t.name} (${t.rate}%)</option>`).join('')}
            </select>

            <!-- Status Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 105px;" onchange="window.ItemSetupModule.setHsnStatusFilter(this.value)">
              <option value="ALL" ${statusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
              <option value="Active" ${statusFilter === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>

            <!-- Search Input -->
            <div style="position: relative; min-width: 200px; max-width: 260px;">
              <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-muted); pointer-events: none;">🔍</span>
              <input 
                type="text" 
                id="hsn-search-input"
                class="form-control form-control-sm" 
                style="padding-left: 32px !important; padding-right: 28px !important;" 
                placeholder="Search HSN code, description..." 
                value="${this.hsnSearchTerm || ''}" 
                oninput="window.ItemSetupModule.setHsnSearch(this.value)"
              />
              ${this.hsnSearchTerm ? `
                <button type="button" onclick="window.ItemSetupModule.setHsnSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px;" title="Clear search">✕</button>
              ` : ''}
            </div>

            <!-- Add HSN Button -->
            <button class="btn btn-primary btn-sm" onclick="window.ItemSetupModule.showAddHsnModal()">
              <span>+ Add HSN/SAC Code</span>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>HSN / SAC Code</th>
                <th>Description</th>
                <th>GST Rate</th>
                <th>CGST %</th>
                <th>SGST %</th>
                <th>IGST %</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredHsns.length === 0 ? `
                <tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">
                  No HSN codes match the current filters.
                  <button type="button" class="btn btn-link btn-sm" style="padding: 0 4px;" onclick="window.ItemSetupModule.resetHsnFilters()">Reset Filters</button>
                </td></tr>
              ` : pagedHsns.items.map(h => {
                const isActive = (h.status === 'Active' || !h.status);
                return `
                  <tr>
                    <td><span class="cell-mono cell-strong" style="color: var(--primary-300); font-weight: 600;">${h.code}</span></td>
                    <td><div style="font-size: 12.5px; font-weight: 500; max-width: 320px;">${h.description}</div></td>
                    <td><span class="badge badge-primary" style="font-weight: 700;">${h.gst_rate}%</span></td>
                    <td><span style="font-size: 12px;">${h.cgst_rate}%</span></td>
                    <td><span style="font-size: 12px;">${h.sgst_rate}%</span></td>
                    <td><span style="font-size: 12px;">${h.igst_rate || h.gst_rate}%</span></td>
                    <td><span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 4px; align-items: center;">
                        <button class="btn btn-icon btn-sm" title="Edit HSN Code" onclick="window.ItemSetupModule.showEditHsnModal('${h.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="Delete HSN Code" style="color: var(--color-danger, #ef4444);" onclick="window.ItemSetupModule.deleteHsn('${h.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          totalRecords: filteredHsns.length,
          currentPage: pagedHsns.currentPage,
          pageSize: pagedHsns.pageSize,
          onPageChange: "window.ItemSetupModule.setPage(%p%, 'hsnCodes')",
          onPageSizeChange: "window.ItemSetupModule.setPageSize(%s%, 'hsnCodes')"
        }) : ''}
      </div>
    `;
  },

  showAddHsnModal() {
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveHsn(null);">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">HSN/SAC Code <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="hsn-code-input" class="form-control cell-mono" required placeholder="e.g. 87141090" />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Description <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="hsn-desc-input" class="form-control" required placeholder="e.g. Other motorcycle accessories" />
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">GST Slab %</label>
          <select id="hsn-gst-input" class="form-control">
            ${(window.DB && typeof window.DB.renderTaxSelectOptions === 'function')
              ? window.DB.renderTaxSelectOptions(0)
              : '<option value="0">GST 0%</option>'}
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save HSN Code</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: 'Add HSN / SAC Code', contentHtml });
  },

  showEditHsnModal(hId) {
    const h = window.DB.getById('hsnCodes', hId);
    if (!h) return;
    const contentHtml = `
      <form onsubmit="event.preventDefault(); window.ItemSetupModule.saveHsn('${h.id}');">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">HSN/SAC Code</label>
          <input type="text" id="hsn-code-input" class="form-control cell-mono" value="${h.code}" readonly />
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Description</label>
          <input type="text" id="hsn-desc-input" class="form-control" value="${h.description}" required />
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">GST Slab %</label>
          <select id="hsn-gst-input" class="form-control">
            ${(window.DB && typeof window.DB.renderTaxSelectOptions === 'function')
              ? window.DB.renderTaxSelectOptions(h.gst_rate)
              : `<option value="${h.gst_rate}">${h.gst_rate}% GST</option>`}
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update HSN Code</button>
        </div>
      </form>
    `;
    window.State.showModal({ title: `Edit HSN Code: ${h.code}`, contentHtml });
  },

  saveHsn(hId) {
    const code = document.getElementById('hsn-code-input').value.trim();
    const desc = document.getElementById('hsn-desc-input').value.trim();
    const rate = document.getElementById('hsn-gst-input').value !== '' ? Number(document.getElementById('hsn-gst-input').value) : 0;
    const taxEntry = (window.DB && typeof window.DB.getTaxByRate === 'function')
      ? window.DB.getTaxByRate(rate)
      : { rate, cgst_rate: rate / 2, sgst_rate: rate / 2, igst_rate: rate };

    const obj = {
      id: hId || `HSN-${Date.now()}`,
      code,
      description: desc,
      gst_rate: taxEntry.rate,
      cgst_rate: taxEntry.cgst_rate !== undefined ? taxEntry.cgst_rate : (taxEntry.rate / 2),
      sgst_rate: taxEntry.sgst_rate !== undefined ? taxEntry.sgst_rate : (taxEntry.rate / 2),
      igst_rate: taxEntry.igst_rate !== undefined ? taxEntry.igst_rate : taxEntry.rate,
      status: 'Active'
    };
    window.DB.upsert('hsnCodes', obj);
    window.DB.emitChange('hsnCodes');
    window.State.closeModal();
    window.State.showToast(`HSN code "${code}" saved!`);
    this.refresh();
  },

  deleteHsn(hId) {
    const hsn = window.DB.getById('hsnCodes', hId);
    if (!hsn) return;
    const items = window.DB.getAll('items') || [];
    const linkedItems = items.filter(i => i.hsn_code === hsn.code);

    if (linkedItems.length > 0) {
      window.State.showToast(`Cannot delete HSN code "${hsn.code}": ${linkedItems.length} items are currently configured with this tax code.`, 'error');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete HSN code "${hsn.code}"?`)) {
      window.DB.delete('hsnCodes', hId);
      window.DB.emitChange('hsnCodes');
      window.State.showToast(`HSN code "${hsn.code}" deleted successfully.`);
      this.refresh();
    }
  }
};
