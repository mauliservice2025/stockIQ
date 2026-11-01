/* ==========================================================================
   ENTERPRISE ISCM - TRANSACTIONAL IN-BROWSER DATABASE & STORAGE LAYER
   Provides Atomic CRUD, Inventory Ledger Calculations, Audit Trail & Subscriptions
   ========================================================================== */

class DatabaseLayer {
  constructor() {
    this.storageKey = 'APEX_ISCM_DATABASE_V2';
    this.listeners = new Map();
    this.data = this.loadData();
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      setTimeout(() => {
        this.syncPlantsFromBackend();
        this.syncWarehousesFromBackend();
        this.syncOrganizationsFromBackend();
        this.syncUsersFromBackend();
        this.syncRolesFromBackend();
        this.syncRolePermissionsFromBackend();
      }, 150);
    }
  }

  getDeletedUserIds() {
    try {
      if (typeof localStorage === 'undefined') return new Set();
      const raw = localStorage.getItem('iscm_deleted_user_ids');
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) {
      return new Set();
    }
  }

  addDeletedUserId(userId) {
    if (!userId) return;
    try {
      if (typeof localStorage === 'undefined') return;
      const set = this.getDeletedUserIds();
      set.add(userId);
      localStorage.setItem('iscm_deleted_user_ids', JSON.stringify([...set]));
    } catch (_) {}
  }

  removeDeletedUserId(userId) {
    if (!userId) return;
    try {
      if (typeof localStorage === 'undefined') return;
      const set = this.getDeletedUserIds();
      if (set.has(userId)) {
        set.delete(userId);
        localStorage.setItem('iscm_deleted_user_ids', JSON.stringify([...set]));
      }
    } catch (_) {}
  }

  loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      let parsed = null;
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch (e) {
          parsed = null;
        }
      }
      if (!parsed) {
        const initData = typeof INITIAL_DATA !== 'undefined' ? INITIAL_DATA : (typeof window !== 'undefined' ? window.INITIAL_DATA : null);
        parsed = initData ? JSON.parse(JSON.stringify(initData)) : {};
      }
      let updated = false;

      // Filter out permanently deleted users from initial state
      const deletedUserIds = this.getDeletedUserIds();
      if (parsed.users && Array.isArray(parsed.users) && deletedUserIds.size > 0) {
        const origLen = parsed.users.length;
        parsed.users = parsed.users.filter(u => u && u.id && !deletedUserIds.has(u.id));
        if (parsed.users.length !== origLen) updated = true;
      }

      // Ensure job cards without parts are not marked as PARTS_ISSUED or PARTS_RESERVED
      if (parsed.jobCards && Array.isArray(parsed.jobCards)) {
        parsed.jobCards.forEach(jc => {
          const parts = Array.isArray(jc.parts_required) ? jc.parts_required : [];
          if (parts.length === 0 && (jc.status === 'PARTS_ISSUED' || jc.status === 'PARTS_RESERVED')) {
            if (!jc.invoice_no && jc.status !== 'BILLED' && jc.status !== 'READY_FOR_DELIVERY' && jc.status !== 'CLOSED' && jc.status !== 'ESTIMATE_APPROVED') {
              jc.status = 'ESTIMATE_PENDING';
              updated = true;
            }
          }
        });
      }

      // Auto-heal 7 standard services and repair any corrupted LBR-002 / LBR-001 entries
      const STANDARD_SERVICES = [
        { id: 'LBR-001', code: 'LBR-001', name: 'General Service Labour', rate: 399, workshop_sale_price: 399, sac_code: '998729', category: 'Periodic Maintenance', estimated_hours: 1.0, stock_uom: 'JOB', type: 'LABOUR', item_type: 'Labour', status: 'Active' },
        { id: 'LBR-002', code: 'LBR-002', name: 'Engine Oil & Filter Replacement Labour', rate: 100, workshop_sale_price: 100, sac_code: '998729', category: 'Engine Service', estimated_hours: 0.5, stock_uom: 'JOB', type: 'LABOUR', item_type: 'Labour', status: 'Active' },
        { id: 'LBR-003', code: 'LBR-003', name: 'Brake Overhaul & Cleaning Labour', rate: 250, workshop_sale_price: 250, sac_code: '998729', category: 'Brake Service', estimated_hours: 0.75, stock_uom: 'JOB', type: 'LABOUR', item_type: 'Labour', status: 'Active' },
        { id: 'LBR-004', code: 'LBR-004', name: 'Carburetor / Throttle Body Clean', rate: 350, workshop_sale_price: 350, sac_code: '998729', category: 'Fuel System', estimated_hours: 1.0, stock_uom: 'JOB', type: 'LABOUR', item_type: 'Labour', status: 'Active' },
        { id: 'LBR-005', code: 'LBR-005', name: 'Electrical & Wiring Check', rate: 200, workshop_sale_price: 200, sac_code: '998729', category: 'Electrical Service', estimated_hours: 0.5, stock_uom: 'JOB', type: 'LABOUR', item_type: 'Labour', status: 'Active' },
        { id: 'LBR-006', code: 'LBR-006', name: 'Clutch & CVT Overhaul Labour', rate: 450, workshop_sale_price: 450, sac_code: '998729', category: 'Clutch & Transmission', estimated_hours: 1.25, stock_uom: 'JOB', type: 'LABOUR', item_type: 'Labour', status: 'Active' },
        { id: 'LBR-007', code: 'LBR-007', name: 'Water Wash & Polishing', rate: 200, workshop_sale_price: 200, sac_code: '998729', category: 'Washing & Detailing', estimated_hours: 0.5, stock_uom: 'JOB', type: 'LABOUR', item_type: 'Labour', status: 'Active' }
      ];

      if (!Array.isArray(parsed.services)) parsed.services = [];
      parsed.services.forEach(s => {
        if (s.code === 'LBR-002' && (s.name || '').toLowerCase().includes('general service')) {
          s.name = 'Engine Oil & Filter Replacement Labour';
          s.rate = s.rate || 100;
          s.workshop_sale_price = s.workshop_sale_price || 100;
          updated = true;
        }
      });
      STANDARD_SERVICES.forEach(std => {
        const match = parsed.services.find(s => s.code && s.code.toUpperCase() === std.code);
        if (!match) {
          parsed.services.push({ ...std });
          updated = true;
        } else {
          if (match.code === std.code && (std.code === 'LBR-001' || std.code === 'LBR-002') && match.name !== std.name) {
            match.name = std.name;
            match.rate = std.rate;
            match.workshop_sale_price = std.workshop_sale_price;
            updated = true;
          }
        }
      });

      // Heal existing estimates and draft bills
      ['billingEstimates', 'estimates', 'draftBills'].forEach(col => {
        if (Array.isArray(parsed[col])) {
          parsed[col].forEach(doc => {
            if (Array.isArray(doc.items)) {
              let docChanged = false;
              const lbr2Wrong = doc.items.find(it => it.code === 'LBR-002' && (it.name || '').toLowerCase().includes('general service'));
              if (lbr2Wrong) {
                lbr2Wrong.name = 'Engine Oil & Filter Replacement Labour';
                lbr2Wrong.item_name = 'Engine Oil & Filter Replacement Labour';
                lbr2Wrong.rate = 100;
                if (lbr2Wrong.qty === 9) lbr2Wrong.qty = 1;
                lbr2Wrong.amount = Number(((Number(lbr2Wrong.qty) || 1) * 100).toFixed(2));
                docChanged = true;
              }

              const hasLbr1 = doc.items.some(it => 
                it.code === 'LBR-001' || (it.name || '').toLowerCase() === 'general service labour' || (it.item_name || '').toLowerCase() === 'general service labour'
              );
              const hasMultipleServices = doc.items.filter(it => it.type === 'LABOUR' || (it.code && it.code.startsWith('LBR-'))).length >= 5;
              if (!hasLbr1 && hasMultipleServices) {
                doc.items.unshift({
                  id: `EST-LBR1-${Date.now()}`,
                  code: 'LBR-001',
                  item_code: 'LBR-001',
                  name: 'General Service Labour',
                  item_name: 'General Service Labour',
                  type: 'LABOUR',
                  qty: 1,
                  rate: 399,
                  amount: 399,
                  hsn_sac: '998729',
                  tax_rate: doc.tax_rate !== undefined ? parseFloat(doc.tax_rate) : 0,
                  from_job_card: true
                });
                docChanged = true;
              }

              if (docChanged) {
                const sub = Number(doc.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0).toFixed(2));
                doc.subtotal = sub;
                doc.tax_amount = Number((sub * ((parseFloat(doc.tax_rate) || 0) / 100)).toFixed(2));
                doc.estimated_total = Number((sub + doc.tax_amount - (Number(doc.discount_amount) || 0)).toFixed(2));
                if (doc.total !== undefined) doc.total = doc.estimated_total;
                updated = true;
              }
            }
          });
        }
      });

        // Clear all organizations and facilities per user request
        if (!parsed._orgs_and_facilities_purged_v5) {
          parsed.organizations = [];
          parsed.plants = [];
          if (Array.isArray(parsed.warehouses)) {
            parsed.warehouses.forEach(w => { w.plant_id = ''; });
          }
          if (Array.isArray(parsed.departments)) {
            parsed.departments.forEach(d => { d.plant_id = ''; });
          }
          parsed._orgs_and_facilities_purged_v5 = true;
          updated = true;
        }

        // Purge Customer, Supplier, and Ledger Opening Balances per user request
        if (parsed.openingCustomerBalances || parsed.openingSupplierBalances || parsed.openingLedgerBalances) {
          delete parsed.openingCustomerBalances;
          delete parsed.openingSupplierBalances;
          delete parsed.openingLedgerBalances;
          updated = true;
        }

        // Clear existing branches so Facility Master starts completely empty
        if (!parsed._branches_cleared_v4) {
          parsed.plants = [];
          if (parsed.warehouses && Array.isArray(parsed.warehouses)) {
            parsed.warehouses.forEach(w => { w.plant_id = ''; });
          }
          if (parsed.departments && Array.isArray(parsed.departments)) {
            parsed.departments.forEach(d => { d.plant_id = ''; });
          }
          parsed._branches_cleared_v4 = true;
          updated = true;
        }

        // Clear existing stores so Store Master starts completely empty
        if (!parsed._stores_cleared_v1) {
          parsed.warehouses = [];
          if (parsed.users && Array.isArray(parsed.users)) {
            parsed.users.forEach(u => { u.warehouse_id = ''; });
          }
          parsed._stores_cleared_v1 = true;
          updated = true;
        }

        // Clear total data (customers) from Job Cards, Estimate, Billing, Bill list, Vehicle Delivery screens
        if (!parsed._workshop_all_customers_purged_v3) {
          parsed.jobCards = [];
          parsed.billingEstimates = [];
          parsed.draftBills = [];
          parsed.finalBills = [];
          parsed.vehicleDeliveries = [];
          parsed.customers = [];
          parsed.vehicles = [];
          parsed.creditNotes = [];
          parsed.jobCardParts = [];
          if (parsed.payments) parsed.payments = [];
          parsed._workshop_all_customers_purged_v3 = true;
          parsed._workshop_all_customers_purged_v2 = true;
          parsed._workshop_all_customers_data_cleared_v1 = true;
          parsed._workshop_all_customers_and_vehicles_cleared_v1 = true;
          parsed._deliveries_cleared_by_user_request = true;
          updated = true;
        }

        // Purge data from Job Cards, Estimate, Billing, Bill list, Vehicle Delivery screens per user request
        if (!parsed._jobcards_estimates_billing_deliveries_purged_v6) {
          parsed.jobCards = [];
          parsed.billingEstimates = [];
          parsed.draftBills = [];
          parsed.finalBills = [];
          parsed.vehicleDeliveries = [];
          parsed.creditNotes = [];
          parsed.paymentReceipts = [];
          parsed.jobCardParts = [];
          if (parsed.payments) parsed.payments = [];
          parsed._jobcards_estimates_billing_deliveries_purged_v6 = true;
          updated = true;
        }

        // Purge all customer data from UI, Code and Database from Job Cards, Estimate, Draft bill, Billing, Bill list, Vehicle Delivery screens upto till date per user request
        if (!parsed._jobcards_estimates_billing_deliveries_customers_purged_upto_date_v7) {
          parsed.jobCards = [];
          parsed.billingEstimates = [];
          parsed.draftBills = [];
          parsed.finalBills = [];
          parsed.vehicleDeliveries = [];
          parsed.creditNotes = [];
          parsed.paymentReceipts = [];
          parsed.jobCardParts = [];
          parsed.customers = [];
          parsed.vehicles = [];
          if (parsed.payments) parsed.payments = [];
          if (parsed.warrantyClaims) parsed.warrantyClaims = [];
          parsed._jobcards_estimates_billing_deliveries_customers_purged_upto_date_v7 = true;
          updated = true;
        }

        // Purge all customer data from UI, Code and Database from Job Cards, Estimate, Draft bill, Billing, Bill list, Vehicle Delivery screens per user request
        if (!parsed._workshop_all_customers_purged_v9) {
          parsed.jobCards = [];
          parsed.billingEstimates = [];
          parsed.draftBills = [];
          parsed.finalBills = [];
          parsed.vehicleDeliveries = [];
          parsed.customers = [];
          parsed.vehicles = [];
          parsed.creditNotes = [];
          parsed.paymentReceipts = [];
          parsed.jobCardParts = [];
          if (parsed.payments) parsed.payments = [];
          if (parsed.warrantyClaims) parsed.warrantyClaims = [];
          parsed._workshop_all_customers_purged_v9 = true;
          updated = true;
        }

        // Purge all customers from Job Cards, Estimate, Draft bill, Billing, Bill list, Vehicle Delivery screens as well as database per user request
        if (!parsed._workshop_all_customers_purged_v11) {
          parsed.jobCards = [];
          parsed.billingEstimates = [];
          if (parsed.estimates) parsed.estimates = [];
          parsed.draftBills = [];
          parsed.finalBills = [];
          parsed.vehicleDeliveries = [];
          if (parsed.deliveryPasses) parsed.deliveryPasses = [];
          parsed.customers = [];
          parsed.vehicles = [];
          parsed.creditNotes = [];
          parsed.paymentReceipts = [];
          parsed.jobCardParts = [];
          if (parsed.payments) parsed.payments = [];
          if (parsed.warrantyClaims) parsed.warrantyClaims = [];
          delete parsed.customer_masters;
          parsed._workshop_all_customers_purged_v11 = true;
          parsed._workshop_all_customers_purged_v10 = true;
          parsed._workshop_all_customers_purged_v9 = true;
          parsed._job_cards_cleared_by_user_request = true;
          parsed._estimates_cleared_by_user_request = true;
          parsed._deliveries_cleared_by_user_request = true;
          updated = true;
        }


        // Purge legacy STORE_TX_STOCK_TRANSFER from permissions and role_permissions
        if (parsed.permissions && Array.isArray(parsed.permissions)) {
          const initLen = parsed.permissions.length;
          parsed.permissions = parsed.permissions.filter(p => p.id !== 'PERM-STORE-XFER' && p.code !== 'STORE_TX_STOCK_TRANSFER');
          if (parsed.permissions.length !== initLen) updated = true;
        }
        if (parsed.role_permissions && Array.isArray(parsed.role_permissions)) {
          const initLen = parsed.role_permissions.length;
          parsed.role_permissions = parsed.role_permissions.filter(rp => rp.perm_code !== 'STORE_TX_STOCK_TRANSFER');
          if (parsed.role_permissions.length !== initLen) updated = true;
        }

        if (!Array.isArray(parsed.jobCards)) {
          parsed.jobCards = [];
          updated = true;
        }
        if (!Array.isArray(parsed.billingEstimates)) {
          parsed.billingEstimates = [];
          updated = true;
        } else {
          parsed.billingEstimates.forEach(est => {
            if (est && est.converted_to_type === 'JOB_CARD') {
              delete est.converted_to_type;
              delete est.converted_to_no;
              delete est.converted_to_id;
              if (est.status === 'CONVERTED') {
                est.status = 'CUSTOMER_APPROVED';
              }
              updated = true;
            }
          });
        }
        if (!Array.isArray(parsed.draftBills)) {
          parsed.draftBills = [];
          updated = true;
        }
        if (!Array.isArray(parsed.finalBills)) {
          parsed.finalBills = [];
          updated = true;
        }
        if (!Array.isArray(parsed.vehicleDeliveries)) {
          parsed.vehicleDeliveries = [];
          updated = true;
        }
        if (!Array.isArray(parsed.creditNotes)) {
          parsed.creditNotes = [];
          updated = true;
        }
        if (!Array.isArray(parsed.paymentReceipts)) {
          parsed.paymentReceipts = [];
          updated = true;
        }

        // Ensure Document Print Configurations are fully populated from INITIAL_DATA into localStorage
        if (typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.document_print_configurations)) {
          if (!Array.isArray(parsed.document_print_configurations) || parsed.document_print_configurations.length === 0) {
            parsed.document_print_configurations = JSON.parse(JSON.stringify(INITIAL_DATA.document_print_configurations));
            updated = true;
          } else {
            INITIAL_DATA.document_print_configurations.forEach(cfg => {
              const exists = parsed.document_print_configurations.some(c => c.id === cfg.id || (c.document_type === cfg.document_type && c.facility_id === cfg.facility_id));
              if (!exists) {
                parsed.document_print_configurations.push(JSON.parse(JSON.stringify(cfg)));
                updated = true;
              }
            });
          }
        }

        // Ensure show_next_service_date is active on GP configs
        if (!parsed._doc_print_gp_next_service_v1) {
          if (Array.isArray(parsed.document_print_configurations)) {
            parsed.document_print_configurations.forEach(cfg => {
              if (cfg.document_type === 'GP' && cfg.header_config && cfg.header_config.show_next_service_date === undefined) {
                cfg.header_config.show_next_service_date = true;
                updated = true;
              }
            });
          }
          parsed._doc_print_gp_next_service_v1 = true;
          updated = true;
        }

        // Set 0% GST as default across taxes master
        if (!parsed._gst_default_zero_v1) {
          if (Array.isArray(parsed.taxes)) {
            parsed.taxes.forEach(t => {
              if (Number(t.rate) === 0 || t.code === 'GST0') {
                t.system_default = true;
                t.status = 'Active';
              }
            });
          }
          parsed._gst_default_zero_v1 = true;
          updated = true;
        }

        // Clear all registered vehicles per user request
        if (!parsed._vehicles_cleared_by_user_request_v1) {
          parsed.vehicles = [];
          parsed._vehicles_cleared_by_user_request_v1 = true;
          updated = true;
        }
        if (!Array.isArray(parsed.vehicles)) {
          parsed.vehicles = [];
        }

        // Clear all organizations and facilities/plants per user request
        if (!parsed._orgs_and_facilities_purged_v5) {
          parsed.organizations = [];
          parsed.plants = [];
          if (Array.isArray(parsed.warehouses)) {
            parsed.warehouses.forEach(w => { w.plant_id = ''; });
          }
          if (Array.isArray(parsed.departments)) {
            parsed.departments.forEach(d => { d.plant_id = ''; });
          }
          parsed._orgs_and_facilities_purged_v5 = true;
          updated = true;
        }

        if (!Array.isArray(parsed.plants)) {
          parsed.plants = [];
          updated = true;
        }
        if (!Array.isArray(parsed.organizations)) {
          parsed.organizations = [];
          updated = true;
        }
        if (Array.isArray(parsed.plants)) {
          parsed.plants.forEach(p => {
            if (!p.branch_code) {
              p.branch_code = p.code ? p.code.replace('BRANCH-', '') : (p.id === 'PLANT-02' ? 'MSC2' : 'MSC1');
              updated = true;
            }
            if (p.gstin === '27AABCT2345M1Z9' || p.gstin === '27AABCT2345M2Z8') {
              p.gstin = '';
              updated = true;
            } else {
              p.gstin = p.gstin || '';
            }
          });
        }

        // Explicitly purge Chennai Sriperumbudur and Apex Two-Wheeler Wakad facilities per user request
        const isTargetPlant = (p) => {
          if (!p) return false;
          const pcode = String(p.code || '').toUpperCase();
          const pname = String(p.name || '').toLowerCase();
          return pcode === 'BRANCH-CHE-02' || pcode === 'BRANCH-WAKAD-01' ||
                 pname.includes('chennai sriperumbudur') || pname.includes('apex two-wheeler wakad');
        };

        if (Array.isArray(parsed.plants)) {
          const origLen = parsed.plants.length;
          parsed.plants = parsed.plants.filter(p => !isTargetPlant(p));
          if (parsed.plants.length !== origLen) updated = true;
        }
        if (Array.isArray(parsed.facilities)) {
          const origLen = parsed.facilities.length;
          parsed.facilities = parsed.facilities.filter(p => !isTargetPlant(p));
          if (parsed.facilities.length !== origLen) updated = true;
        }

        // Simplify storeTypes to only 2 types: Main Store, Sub Store
        if (!parsed._store_types_simplified_v1) {
          parsed.storeTypes = [
            {
              id: "ST-01",
              code: "MAIN_STORE",
              name: "Main Store",
              purpose: "Central spare parts inventory hub",
              is_parent_allowed: false,
              is_sub_store: false,
              active: true
            },
            {
              id: "ST-02",
              code: "SUB_STORE",
              name: "Sub Store",
              purpose: "Parts used by technicians / branch operations",
              is_parent_allowed: true,
              is_sub_store: true,
              active: true
            }
          ];
          parsed._store_types_simplified_v1 = true;
          updated = true;
        }

                // Populate all 28 States & 8 Union Territories of India in State Master
        if (!parsed._india_all_states_synced_v2) {
          const existingStates = Array.isArray(parsed.states) ? parsed.states : [];
          const allIndianStates = [
          {
                    "id": "ST-01",
                    "country_id": "CTRY-01",
                    "code": "MH",
                    "tin": "27",
                    "name": "Maharashtra",
                    "type": "State",
                    "zone": "Western",
                    "capital": "Mumbai",
                    "status": "Active"
          },
          {
                    "id": "ST-02",
                    "country_id": "CTRY-01",
                    "code": "TN",
                    "tin": "33",
                    "name": "Tamil Nadu",
                    "type": "State",
                    "zone": "Southern",
                    "capital": "Chennai",
                    "status": "Active"
          },
          {
                    "id": "ST-03",
                    "country_id": "CTRY-01",
                    "code": "KA",
                    "tin": "29",
                    "name": "Karnataka",
                    "type": "State",
                    "zone": "Southern",
                    "capital": "Bengaluru",
                    "status": "Active"
          },
          {
                    "id": "ST-04",
                    "country_id": "CTRY-01",
                    "code": "GJ",
                    "tin": "24",
                    "name": "Gujarat",
                    "type": "State",
                    "zone": "Western",
                    "capital": "Gandhinagar",
                    "status": "Active"
          },
          {
                    "id": "ST-05",
                    "country_id": "CTRY-01",
                    "code": "DL",
                    "tin": "07",
                    "name": "Delhi",
                    "type": "Union Territory",
                    "zone": "Northern",
                    "capital": "New Delhi",
                    "status": "Active"
          },
          {
                    "id": "ST-06",
                    "country_id": "CTRY-01",
                    "code": "TS",
                    "tin": "36",
                    "name": "Telangana",
                    "type": "State",
                    "zone": "Southern",
                    "capital": "Hyderabad",
                    "status": "Active"
          },
          {
                    "id": "ST-07",
                    "country_id": "CTRY-01",
                    "code": "RJ",
                    "tin": "08",
                    "name": "Rajasthan",
                    "type": "State",
                    "zone": "Northern",
                    "capital": "Jaipur",
                    "status": "Active"
          },
          {
                    "id": "ST-08",
                    "country_id": "CTRY-01",
                    "code": "MP",
                    "tin": "23",
                    "name": "Madhya Pradesh",
                    "type": "State",
                    "zone": "Central",
                    "capital": "Bhopal",
                    "status": "Active"
          },
          {
                    "id": "ST-09",
                    "country_id": "CTRY-02",
                    "code": "CA",
                    "tin": "06",
                    "name": "California",
                    "type": "State",
                    "zone": "West Coast",
                    "capital": "Sacramento",
                    "status": "Active"
          },
          {
                    "id": "ST-10",
                    "country_id": "CTRY-03",
                    "code": "BY",
                    "tin": "09",
                    "name": "Bavaria",
                    "type": "State",
                    "zone": "Southern Germany",
                    "capital": "Munich",
                    "status": "Active"
          },
          {
                    "id": "ST-11",
                    "country_id": "CTRY-01",
                    "code": "AP",
                    "tin": "37",
                    "name": "Andhra Pradesh",
                    "type": "State",
                    "zone": "Southern",
                    "capital": "Amaravati",
                    "status": "Active"
          },
          {
                    "id": "ST-12",
                    "country_id": "CTRY-01",
                    "code": "AR",
                    "tin": "12",
                    "name": "Arunachal Pradesh",
                    "type": "State",
                    "zone": "North Eastern",
                    "capital": "Itanagar",
                    "status": "Active"
          },
          {
                    "id": "ST-13",
                    "country_id": "CTRY-01",
                    "code": "AS",
                    "tin": "18",
                    "name": "Assam",
                    "type": "State",
                    "zone": "North Eastern",
                    "capital": "Dispur",
                    "status": "Active"
          },
          {
                    "id": "ST-14",
                    "country_id": "CTRY-01",
                    "code": "BR",
                    "tin": "10",
                    "name": "Bihar",
                    "type": "State",
                    "zone": "Eastern",
                    "capital": "Patna",
                    "status": "Active"
          },
          {
                    "id": "ST-15",
                    "country_id": "CTRY-01",
                    "code": "CG",
                    "tin": "22",
                    "name": "Chhattisgarh",
                    "type": "State",
                    "zone": "Central",
                    "capital": "Raipur",
                    "status": "Active"
          },
          {
                    "id": "ST-16",
                    "country_id": "CTRY-01",
                    "code": "GA",
                    "tin": "30",
                    "name": "Goa",
                    "type": "State",
                    "zone": "Western",
                    "capital": "Panaji",
                    "status": "Active"
          },
          {
                    "id": "ST-17",
                    "country_id": "CTRY-01",
                    "code": "HR",
                    "tin": "06",
                    "name": "Haryana",
                    "type": "State",
                    "zone": "Northern",
                    "capital": "Chandigarh",
                    "status": "Active"
          },
          {
                    "id": "ST-18",
                    "country_id": "CTRY-01",
                    "code": "HP",
                    "tin": "02",
                    "name": "Himachal Pradesh",
                    "type": "State",
                    "zone": "Northern",
                    "capital": "Shimla",
                    "status": "Active"
          },
          {
                    "id": "ST-19",
                    "country_id": "CTRY-01",
                    "code": "JH",
                    "tin": "20",
                    "name": "Jharkhand",
                    "type": "State",
                    "zone": "Eastern",
                    "capital": "Ranchi",
                    "status": "Active"
          },
          {
                    "id": "ST-20",
                    "country_id": "CTRY-01",
                    "code": "KL",
                    "tin": "32",
                    "name": "Kerala",
                    "type": "State",
                    "zone": "Southern",
                    "capital": "Thiruvananthapuram",
                    "status": "Active"
          },
          {
                    "id": "ST-21",
                    "country_id": "CTRY-01",
                    "code": "MN",
                    "tin": "14",
                    "name": "Manipur",
                    "type": "State",
                    "zone": "North Eastern",
                    "capital": "Imphal",
                    "status": "Active"
          },
          {
                    "id": "ST-22",
                    "country_id": "CTRY-01",
                    "code": "ML",
                    "tin": "17",
                    "name": "Meghalaya",
                    "type": "State",
                    "zone": "North Eastern",
                    "capital": "Shillong",
                    "status": "Active"
          },
          {
                    "id": "ST-23",
                    "country_id": "CTRY-01",
                    "code": "MZ",
                    "tin": "15",
                    "name": "Mizoram",
                    "type": "State",
                    "zone": "North Eastern",
                    "capital": "Aizawl",
                    "status": "Active"
          },
          {
                    "id": "ST-24",
                    "country_id": "CTRY-01",
                    "code": "NL",
                    "tin": "13",
                    "name": "Nagaland",
                    "type": "State",
                    "zone": "North Eastern",
                    "capital": "Kohima",
                    "status": "Active"
          },
          {
                    "id": "ST-25",
                    "country_id": "CTRY-01",
                    "code": "OD",
                    "tin": "21",
                    "name": "Odisha",
                    "type": "State",
                    "zone": "Eastern",
                    "capital": "Bhubaneswar",
                    "status": "Active"
          },
          {
                    "id": "ST-26",
                    "country_id": "CTRY-01",
                    "code": "PB",
                    "tin": "03",
                    "name": "Punjab",
                    "type": "State",
                    "zone": "Northern",
                    "capital": "Chandigarh",
                    "status": "Active"
          },
          {
                    "id": "ST-27",
                    "country_id": "CTRY-01",
                    "code": "SK",
                    "tin": "11",
                    "name": "Sikkim",
                    "type": "State",
                    "zone": "North Eastern",
                    "capital": "Gangtok",
                    "status": "Active"
          },
          {
                    "id": "ST-28",
                    "country_id": "CTRY-01",
                    "code": "TR",
                    "tin": "16",
                    "name": "Tripura",
                    "type": "State",
                    "zone": "North Eastern",
                    "capital": "Agartala",
                    "status": "Active"
          },
          {
                    "id": "ST-29",
                    "country_id": "CTRY-01",
                    "code": "UP",
                    "tin": "09",
                    "name": "Uttar Pradesh",
                    "type": "State",
                    "zone": "Northern",
                    "capital": "Lucknow",
                    "status": "Active"
          },
          {
                    "id": "ST-30",
                    "country_id": "CTRY-01",
                    "code": "UK",
                    "tin": "05",
                    "name": "Uttarakhand",
                    "type": "State",
                    "zone": "Northern",
                    "capital": "Dehradun",
                    "status": "Active"
          },
          {
                    "id": "ST-31",
                    "country_id": "CTRY-01",
                    "code": "WB",
                    "tin": "19",
                    "name": "West Bengal",
                    "type": "State",
                    "zone": "Eastern",
                    "capital": "Kolkata",
                    "status": "Active"
          },
          {
                    "id": "ST-32",
                    "country_id": "CTRY-01",
                    "code": "AN",
                    "tin": "35",
                    "name": "Andaman and Nicobar Islands",
                    "type": "Union Territory",
                    "zone": "Southern",
                    "capital": "Port Blair",
                    "status": "Active"
          },
          {
                    "id": "ST-33",
                    "country_id": "CTRY-01",
                    "code": "CH",
                    "tin": "04",
                    "name": "Chandigarh",
                    "type": "Union Territory",
                    "zone": "Northern",
                    "capital": "Chandigarh",
                    "status": "Active"
          },
          {
                    "id": "ST-34",
                    "country_id": "CTRY-01",
                    "code": "DH",
                    "tin": "26",
                    "name": "Dadra and Nagar Haveli and Daman and Diu",
                    "type": "Union Territory",
                    "zone": "Western",
                    "capital": "Daman",
                    "status": "Active"
          },
          {
                    "id": "ST-35",
                    "country_id": "CTRY-01",
                    "code": "JK",
                    "tin": "01",
                    "name": "Jammu and Kashmir",
                    "type": "Union Territory",
                    "zone": "Northern",
                    "capital": "Srinagar",
                    "status": "Active"
          },
          {
                    "id": "ST-36",
                    "country_id": "CTRY-01",
                    "code": "LA",
                    "tin": "38",
                    "name": "Ladakh",
                    "type": "Union Territory",
                    "zone": "Northern",
                    "capital": "Leh",
                    "status": "Active"
          },
          {
                    "id": "ST-37",
                    "country_id": "CTRY-01",
                    "code": "LD",
                    "tin": "31",
                    "name": "Lakshadweep",
                    "type": "Union Territory",
                    "zone": "Southern",
                    "capital": "Kavaratti",
                    "status": "Active"
          },
          {
                    "id": "ST-38",
                    "country_id": "CTRY-01",
                    "code": "PY",
                    "tin": "34",
                    "name": "Puducherry",
                    "type": "Union Territory",
                    "zone": "Southern",
                    "capital": "Puducherry",
                    "status": "Active"
          }
];
          
          allIndianStates.forEach(st => {
            const idx = existingStates.findIndex(s => s.code === st.code || s.id === st.id);
            if (idx >= 0) {
              existingStates[idx] = { ...existingStates[idx], ...st };
            } else {
              existingStates.push(st);
            }
          });
          parsed.states = existingStates;
          parsed._india_all_states_synced_v2 = true;
          updated = true;
        }

        // Populate all 36 Districts of Maharashtra in District Master
        if (!parsed._maharashtra_all_districts_synced_v1) {
          const existingDistricts = Array.isArray(parsed.districts) ? parsed.districts : [];
          const allMaharashtraDistricts = [
            { id: "DIST-01", country_id: "CTRY-01", state_id: "ST-01", code: "PUN", name: "Pune", headquarters: "Pune", division: "Pune Division", status: "Active" },
            { id: "DIST-02", country_id: "CTRY-01", state_id: "ST-01", code: "MUM-SUB", name: "Mumbai Suburban", headquarters: "Bandra", division: "Konkan Division", status: "Active" },
            { id: "DIST-03", country_id: "CTRY-01", state_id: "ST-01", code: "THN", name: "Thane", headquarters: "Thane", division: "Konkan Division", status: "Active" },
            { id: "DIST-04", country_id: "CTRY-01", state_id: "ST-01", code: "NAG", name: "Nagpur", headquarters: "Nagpur", division: "Nagpur Division", status: "Active" },
            { id: "DIST-05", country_id: "CTRY-01", state_id: "ST-01", code: "NSK", name: "Nashik", headquarters: "Nashik", division: "Nashik Division", status: "Active" },
            { id: "DIST-06", country_id: "CTRY-01", state_id: "ST-01", code: "CSN", name: "Chhatrapati Sambhajinagar", headquarters: "Chhatrapati Sambhajinagar", division: "Chhatrapati Sambhajinagar Division", status: "Active" },
            { id: "DIST-13", country_id: "CTRY-01", state_id: "ST-01", code: "MUM-CIT", name: "Mumbai City", headquarters: "Mumbai", division: "Konkan Division", status: "Active" },
            { id: "DIST-14", country_id: "CTRY-01", state_id: "ST-01", code: "PLG", name: "Palghar", headquarters: "Palghar", division: "Konkan Division", status: "Active" },
            { id: "DIST-15", country_id: "CTRY-01", state_id: "ST-01", code: "RGD", name: "Raigad", headquarters: "Alibag", division: "Konkan Division", status: "Active" },
            { id: "DIST-16", country_id: "CTRY-01", state_id: "ST-01", code: "RTG", name: "Ratnagiri", headquarters: "Ratnagiri", division: "Konkan Division", status: "Active" },
            { id: "DIST-17", country_id: "CTRY-01", state_id: "ST-01", code: "SND", name: "Sindhudurg", headquarters: "Oros", division: "Konkan Division", status: "Active" },
            { id: "DIST-18", country_id: "CTRY-01", state_id: "ST-01", code: "STR", name: "Satara", headquarters: "Satara", division: "Pune Division", status: "Active" },
            { id: "DIST-19", country_id: "CTRY-01", state_id: "ST-01", code: "SGL", name: "Sangli", headquarters: "Sangli", division: "Pune Division", status: "Active" },
            { id: "DIST-20", country_id: "CTRY-01", state_id: "ST-01", code: "SLP", name: "Solapur", headquarters: "Solapur", division: "Pune Division", status: "Active" },
            { id: "DIST-21", country_id: "CTRY-01", state_id: "ST-01", code: "KLP", name: "Kolhapur", headquarters: "Kolhapur", division: "Pune Division", status: "Active" },
            { id: "DIST-22", country_id: "CTRY-01", state_id: "ST-01", code: "AHM", name: "Ahilyanagar (Ahmednagar)", headquarters: "Ahilyanagar", division: "Nashik Division", status: "Active" },
            { id: "DIST-23", country_id: "CTRY-01", state_id: "ST-01", code: "DHL", name: "Dhule", headquarters: "Dhule", division: "Nashik Division", status: "Active" },
            { id: "DIST-24", country_id: "CTRY-01", state_id: "ST-01", code: "JLG", name: "Jalgaon", headquarters: "Jalgaon", division: "Nashik Division", status: "Active" },
            { id: "DIST-25", country_id: "CTRY-01", state_id: "ST-01", code: "NDB", name: "Nandurbar", headquarters: "Nandurbar", division: "Nashik Division", status: "Active" },
            { id: "DIST-26", country_id: "CTRY-01", state_id: "ST-01", code: "JLN", name: "Jalna", headquarters: "Jalna", division: "Chhatrapati Sambhajinagar Division", status: "Active" },
            { id: "DIST-27", country_id: "CTRY-01", state_id: "ST-01", code: "BED", name: "Beed", headquarters: "Beed", division: "Chhatrapati Sambhajinagar Division", status: "Active" },
            { id: "DIST-28", country_id: "CTRY-01", state_id: "ST-01", code: "PBN", name: "Parbhani", headquarters: "Parbhani", division: "Chhatrapati Sambhajinagar Division", status: "Active" },
            { id: "DIST-29", country_id: "CTRY-01", state_id: "ST-01", code: "HNG", name: "Hingoli", headquarters: "Hingoli", division: "Chhatrapati Sambhajinagar Division", status: "Active" },
            { id: "DIST-30", country_id: "CTRY-01", state_id: "ST-01", code: "NED", name: "Nanded", headquarters: "Nanded", division: "Chhatrapati Sambhajinagar Division", status: "Active" },
            { id: "DIST-31", country_id: "CTRY-01", state_id: "ST-01", code: "LTR", name: "Latur", headquarters: "Latur", division: "Chhatrapati Sambhajinagar Division", status: "Active" },
            { id: "DIST-32", country_id: "CTRY-01", state_id: "ST-01", code: "DHR", name: "Dharashiv (Osmanabad)", headquarters: "Dharashiv", division: "Chhatrapati Sambhajinagar Division", status: "Active" },
            { id: "DIST-33", country_id: "CTRY-01", state_id: "ST-01", code: "AMR", name: "Amravati", headquarters: "Amravati", division: "Amravati Division", status: "Active" },
            { id: "DIST-34", country_id: "CTRY-01", state_id: "ST-01", code: "AKL", name: "Akola", headquarters: "Akola", division: "Amravati Division", status: "Active" },
            { id: "DIST-35", country_id: "CTRY-01", state_id: "ST-01", code: "BLD", name: "Buldhana", headquarters: "Buldhana", division: "Amravati Division", status: "Active" },
            { id: "DIST-36", country_id: "CTRY-01", state_id: "ST-01", code: "YTL", name: "Yavatmal", headquarters: "Yavatmal", division: "Amravati Division", status: "Active" },
            { id: "DIST-37", country_id: "CTRY-01", state_id: "ST-01", code: "WSM", name: "Washim", headquarters: "Washim", division: "Amravati Division", status: "Active" },
            { id: "DIST-38", country_id: "CTRY-01", state_id: "ST-01", code: "WRD", name: "Wardha", headquarters: "Wardha", division: "Nagpur Division", status: "Active" },
            { id: "DIST-39", country_id: "CTRY-01", state_id: "ST-01", code: "BHD", name: "Bhandara", headquarters: "Bhandara", division: "Nagpur Division", status: "Active" },
            { id: "DIST-40", country_id: "CTRY-01", state_id: "ST-01", code: "GND", name: "Gondia", headquarters: "Gondia", division: "Nagpur Division", status: "Active" },
            { id: "DIST-41", country_id: "CTRY-01", state_id: "ST-01", code: "CND", name: "Chandrapur", headquarters: "Chandrapur", division: "Nagpur Division", status: "Active" },
            { id: "DIST-42", country_id: "CTRY-01", state_id: "ST-01", code: "GDC", name: "Gadchiroli", headquarters: "Gadchiroli", division: "Nagpur Division", status: "Active" }
          ];

          allMaharashtraDistricts.forEach(dst => {
            const idx = existingDistricts.findIndex(d => 
              (d.state_id === 'ST-01' && d.name.toLowerCase() === dst.name.toLowerCase()) || 
              d.id === dst.id || 
              (d.state_id === 'ST-01' && d.code === dst.code)
            );
            if (idx >= 0) {
              existingDistricts[idx] = { ...existingDistricts[idx], ...dst };
            } else {
              existingDistricts.push(dst);
            }
          });
          parsed.districts = existingDistricts;
          parsed._maharashtra_all_districts_synced_v1 = true;
          updated = true;
        }

        // Populate all major cities of Pune, Nashik, and Jalgaon in City Master
        if (!parsed._pune_nashik_jalgaon_cities_synced_v1) {
          const existingCities = Array.isArray(parsed.cities) ? parsed.cities : [];
          const newCities = [
            // Pune (DIST-01) - Comprehensive major cities & municipal councils (14 Total)
            { id: "CITY-01", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "PUN-CITY", name: "Pune", tier: "Tier 1", is_industrial_hub: true, status: "Active" },
            { id: "CITY-02", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "PIMP-CHIN", name: "Pimpri-Chinchwad", tier: "Tier 1", is_industrial_hub: true, status: "Active" },
            { id: "CITY-03", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "CHAKAN", name: "Chakan", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-04", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "TALEGAON", name: "Talegaon Dabhade", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-14", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "BARAMATI", name: "Baramati", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-15", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "SHIRUR", name: "Shirur", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-16", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "DAUND", name: "Daund", tier: "Tier 2", is_industrial_hub: false, status: "Active" },
            { id: "CITY-17", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "LONAVALA", name: "Lonavala", tier: "Tier 2", is_industrial_hub: false, status: "Active" },
            { id: "CITY-18", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "JUNNAR", name: "Junnar", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-19", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "BHOR", name: "Bhor", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-20", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "SASWAD", name: "Saswad", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-21", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "INDAPUR", name: "Indapur", tier: "Tier 3", is_industrial_hub: true, status: "Active" },
            { id: "CITY-22", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "RAJGURU", name: "Rajgurunagar (Khed)", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-23", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", code: "ALANDI", name: "Alandi", tier: "Tier 3", is_industrial_hub: false, status: "Active" },

            // Nashik (DIST-05) - Cities, municipal corporations & industrial hubs
            { id: "CITY-24", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "NSK-CITY", name: "Nashik", tier: "Tier 1", is_industrial_hub: true, status: "Active" },
            { id: "CITY-25", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "MLG-CITY", name: "Malegaon", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-26", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "SINNAR", name: "Sinnar", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-27", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "OZAR", name: "Ozar", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-28", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "IGATPURI", name: "Igatpuri", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-29", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "TRIMBAK", name: "Trimbak (Trimbakeshwar)", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-30", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "YEOLA", name: "Yeola", tier: "Tier 3", is_industrial_hub: true, status: "Active" },
            { id: "CITY-31", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "MANMAD", name: "Manmad", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-32", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "SATANA", name: "Satana", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-33", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "NIPHAD", name: "Niphad", tier: "Tier 3", is_industrial_hub: true, status: "Active" },
            { id: "CITY-34", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "KALWAN", name: "Kalwan", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-35", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", code: "DEOLALI", name: "Deolali", tier: "Tier 2", is_industrial_hub: false, status: "Active" },

            // Jalgaon (DIST-24) - Key cities, municipal councils & trade centers
            { id: "CITY-36", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "JLG-CITY", name: "Jalgaon", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-37", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "BHS-CITY", name: "Bhusawal", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-38", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "CHALISGAON", name: "Chalisgaon", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-39", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "AMALNER", name: "Amalner", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-40", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "CHOPDA", name: "Chopda", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-41", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "PACHORA", name: "Pachora", tier: "Tier 2", is_industrial_hub: true, status: "Active" },
            { id: "CITY-42", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "JAMNER", name: "Jamner", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-43", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "RAVER", name: "Raver", tier: "Tier 3", is_industrial_hub: true, status: "Active" },
            { id: "CITY-44", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "YAWAL", name: "Yawal", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-45", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "ERANDOL", name: "Erandol", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-46", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "PAROLA", name: "Parola", tier: "Tier 3", is_industrial_hub: false, status: "Active" },
            { id: "CITY-47", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", code: "DHARANGAON", name: "Dharangaon", tier: "Tier 3", is_industrial_hub: true, status: "Active" }
          ];

          newCities.forEach(city => {
            const idx = existingCities.findIndex(c => 
              (c.district_id === city.district_id && c.name.toLowerCase() === city.name.toLowerCase()) || 
              c.id === city.id || 
              (c.code === city.code)
            );
            if (idx >= 0) {
              existingCities[idx] = { ...existingCities[idx], ...city };
            } else {
              existingCities.push(city);
            }
          });
          parsed.cities = existingCities;

          // Also populate corresponding pincodes
          const existingPins = Array.isArray(parsed.pincodes) ? parsed.pincodes : [];
          const newPins = [
            { id: "PIN-14", pincode: "422001", area_name: "Nashik Head Post Office / Shalimar", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", city_id: "CITY-24", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-15", pincode: "422010", area_name: "Ambad MIDC Industrial Area", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", city_id: "CITY-24", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-16", pincode: "422103", area_name: "Musalgaon MIDC Sinnar", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", city_id: "CITY-26", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-17", pincode: "423203", area_name: "Malegaon Textile Camp", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-05", city_id: "CITY-25", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-18", pincode: "425001", area_name: "Jalgaon Head Post Office / Station Road", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", city_id: "CITY-36", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-19", pincode: "425003", area_name: "Jalgaon MIDC Industrial Area", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", city_id: "CITY-36", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-20", pincode: "425201", area_name: "Bhusawal Railway Colony / Station", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-24", city_id: "CITY-37", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-21", pincode: "413133", area_name: "Baramati MIDC Industrial Area", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", city_id: "CITY-14", delivery_status: "Delivery", status: "Active" }
          ];

          newPins.forEach(pin => {
            const idx = existingPins.findIndex(p => p.id === pin.id || (p.pincode === pin.pincode && p.area_name === pin.area_name));
            if (idx >= 0) {
              existingPins[idx] = { ...existingPins[idx], ...pin };
            } else {
              existingPins.push(pin);
            }
          });
          parsed.pincodes = existingPins;

          parsed._pune_nashik_jalgaon_cities_synced_v1 = true;
          updated = true;
        }

        // Populate Pune & PCMC pincodes for Address Master
        if (!parsed._pune_pcmc_pincodes_synced_v1) {
          const existingPins = Array.isArray(parsed.pincodes) ? parsed.pincodes : [];
          const pcmcPins = [
            { id: "PIN-01", pincode: "411001", area_name: "Pune Head Post Office / Camp", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", city_id: "CITY-01", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-02", pincode: "411018", area_name: "Pimpri Industrial Colony / PCMC", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", city_id: "CITY-02", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-03", pincode: "411026", area_name: "Bhosari / Walhekarwadi / Chinchwad", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", city_id: "CITY-02", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-04", pincode: "411033", area_name: "Thergaon / Chinchwadgaon / Kalewadi", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", city_id: "CITY-02", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-05", pincode: "410501", area_name: "Chakan Industrial Belt Phase 1 & 2", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", city_id: "CITY-03", delivery_status: "Delivery", status: "Active" },
            { id: "PIN-06", pincode: "410506", area_name: "Talegaon Dabhade MIDC Area", country_id: "CTRY-01", state_id: "ST-01", district_id: "DIST-01", city_id: "CITY-04", delivery_status: "Delivery", status: "Active" }
          ];

          pcmcPins.forEach(pin => {
            const idx = existingPins.findIndex(p => p.id === pin.id || p.pincode === pin.pincode);
            if (idx >= 0) {
              existingPins[idx] = { ...existingPins[idx], ...pin };
            } else {
              existingPins.push(pin);
            }
          });
          parsed.pincodes = existingPins;
          parsed._pune_pcmc_pincodes_synced_v1 = true;
          updated = true;
        }

        // Two-Wheeler BRD: Completely remove Customer & OEM Account Master from database
        if (!parsed._customer_oem_account_master_purged_v1) {
          parsed.customers = [];
          delete parsed.customer_masters;
          parsed._customer_oem_account_master_purged_v1 = true;
          updated = true;
        }

        // Populate Universal Common Master Lookups (Title, Gender, Referral Source, Reasons, etc.)
        if (!parsed._common_lookup_masters_synced_v1) {
          const existingCM = Array.isArray(parsed.common_masters) ? parsed.common_masters : [];
          const seedCM = (typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.common_masters))
            ? INITIAL_DATA.common_masters
            : [];
          
          seedCM.forEach(entry => {
            const idx = existingCM.findIndex(e => e.id === entry.id || (e.type === entry.type && e.code.toUpperCase() === entry.code.toUpperCase()));
            if (idx >= 0) {
              existingCM[idx] = { ...existingCM[idx], ...entry };
            } else {
              existingCM.push(entry);
            }
          });
          parsed.common_masters = existingCM;
          parsed._common_lookup_masters_synced_v1 = true;
          updated = true;
        }

        // Interlink Title Master and Gender Master (e.g. Mr. -> Male fixed)
        if (!parsed._title_gender_interlink_synced_v1) {
          const existingCM = Array.isArray(parsed.common_masters) ? parsed.common_masters : [];
          const titleGenderMap = {
            'MR': { code: 'MALE', name: 'Male', isFixed: true },
            'MRS': { code: 'FEMALE', name: 'Female', isFixed: true },
            'MS': { code: 'FEMALE', name: 'Female', isFixed: true },
            'SHRI': { code: 'MALE', name: 'Male', isFixed: true },
            'SMT': { code: 'FEMALE', name: 'Female', isFixed: true },
            'DR': { code: '', name: 'Any', isFixed: false },
            'PROF': { code: '', name: 'Any', isFixed: false },
            'ADV': { code: '', name: 'Any', isFixed: false }
          };

          existingCM.forEach(entry => {
            if (entry.type === 'TITLE') {
              const rule = titleGenderMap[entry.code ? entry.code.toUpperCase() : ''];
              if (rule) {
                entry.linked_gender_code = rule.code;
                entry.linked_gender_name = rule.name;
                entry.is_gender_fixed = rule.isFixed;
              } else if (entry.linked_gender_code === undefined) {
                entry.linked_gender_code = '';
                entry.linked_gender_name = 'Any';
                entry.is_gender_fixed = false;
              }
            }
          });
          parsed.common_masters = existingCM;
          parsed._title_gender_interlink_synced_v1 = true;
          updated = true;
        }

        // Populate Tax Master (GST Slabs and taxation configuration conforming to BRD)
        if (!parsed._tax_masters_synced_v1) {
          const existingTaxes = Array.isArray(parsed.taxes) ? parsed.taxes : [];
          const seedTaxes = (typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.taxes))
            ? INITIAL_DATA.taxes
            : [];
          
          seedTaxes.forEach(entry => {
            const idx = existingTaxes.findIndex(e => e.id === entry.id || e.code.toUpperCase() === entry.code.toUpperCase());
            if (idx >= 0) {
              existingTaxes[idx] = { ...existingTaxes[idx], ...entry };
            } else {
              existingTaxes.push(entry);
            }
          });
          parsed.taxes = existingTaxes;
          parsed._tax_masters_synced_v1 = true;
          updated = true;
        }

        // Enrich Item Master attributes conforming to Two-Wheeler Service Center BRD v1.0
        if (!parsed._item_master_brd_v1) {
          if (parsed.items && Array.isArray(parsed.items)) {
            const defaults = {
              'ITEM-2W-001': { brand: 'Nissin / OEM', manufacturer: 'Honda Motor Co.', part_number: '06455-KWP-D01', oem_part_number: '06455-KWP-D01', short_name: 'Front Brake Pad Set', mrp: 450, workshop_sale_price: 380, counter_sale_price: 420, gst_rate_pct: 18, warranty_applicable_yn: 'Y', warranty_period_months: 6, barcode: '890123456001', stock_uom: 'SET', purchase_uom: 'BOX (10 Sets)' },
              'ITEM-2W-002': { brand: 'Endurance', manufacturer: 'Endurance Technologies', part_number: '43125-KRP-980', oem_part_number: '43125-KRP-980', short_name: 'Rear Brake Shoe Set', mrp: 320, workshop_sale_price: 260, counter_sale_price: 290, gst_rate_pct: 18, warranty_applicable_yn: 'Y', warranty_period_months: 6, barcode: '890123456002', stock_uom: 'SET', purchase_uom: 'BOX (10 Sets)' },
              'ITEM-2W-003': { brand: 'Castrol Activ', manufacturer: 'Castrol India Ltd', part_number: 'CAS-10W30-1L', oem_part_number: 'CAS-4T-10W30', short_name: 'Engine Oil 10W-30 1L', mrp: 460, workshop_sale_price: 395, counter_sale_price: 430, gst_rate_pct: 18, warranty_applicable_yn: 'N', warranty_period_months: 0, barcode: '890123456003', stock_uom: 'BTL', purchase_uom: 'CARTON (24 Btls)' },
              'ITEM-2W-004': { brand: 'Honda Genuine', manufacturer: 'Honda Motorcycle & Scooter India', part_number: '17210-KWP-D00', oem_part_number: '17210-KWP-D00', short_name: 'Activa 6G Foam Air Filter', mrp: 210, workshop_sale_price: 165, counter_sale_price: 190, gst_rate_pct: 18, warranty_applicable_yn: 'N', warranty_period_months: 0, barcode: '890123456004', stock_uom: 'NOS', purchase_uom: 'BOX (20 Nos)' },
              'ITEM-2W-005': { brand: 'TVS Genuine', manufacturer: 'TVS Motor Company', part_number: '17210-K0W-N00', oem_part_number: 'N6040180', short_name: 'Jupiter 125 Paper Air Filter', mrp: 245, workshop_sale_price: 195, counter_sale_price: 220, gst_rate_pct: 18, warranty_applicable_yn: 'N', warranty_period_months: 0, barcode: '890123456005', stock_uom: 'NOS', purchase_uom: 'BOX (15 Nos)' },
              'ITEM-2W-006': { brand: 'NGK', manufacturer: 'NGK Spark Plugs India', part_number: 'CPR8EA-9', oem_part_number: '31918-KWP-D01', short_name: 'NGK Spark Plug CPR8EA-9', mrp: 220, workshop_sale_price: 175, counter_sale_price: 195, gst_rate_pct: 18, warranty_applicable_yn: 'Y', warranty_period_months: 6, barcode: '890123456006', stock_uom: 'NOS', purchase_uom: 'BOX (20 Nos)' },
              'ITEM-2W-007': { brand: 'Exide Xplore', manufacturer: 'Exide Industries Ltd', part_number: 'FXL0-XLTZ5', oem_part_number: '12V-5AH-MF', short_name: 'VRLA Battery 12V 5Ah', mrp: 1650, workshop_sale_price: 1350, counter_sale_price: 1500, gst_rate_pct: 28, warranty_applicable_yn: 'Y', warranty_period_months: 18, barcode: '890123456007', stock_uom: 'NOS', purchase_uom: 'BOX (5 Nos)' },
              'ITEM-2W-008': { brand: 'MRF Zapper', manufacturer: 'MRF Limited', part_number: '90/90-12-ZAPPER-FG', oem_part_number: 'MRF-9090-12', short_name: 'Front Tyre 90/90-12', mrp: 1850, workshop_sale_price: 1550, counter_sale_price: 1700, gst_rate_pct: 28, warranty_applicable_yn: 'Y', warranty_period_months: 36, barcode: '890123456008', stock_uom: 'NOS', purchase_uom: 'BUNDLE (4 Nos)' },
              'ITEM-2W-009': { brand: 'FCC / Honda', manufacturer: 'FCC Clutch India Ltd', part_number: '22201-KWP-900', oem_part_number: '22201-KWP-900', short_name: 'Clutch Friction Plate Set', mrp: 680, workshop_sale_price: 550, counter_sale_price: 620, gst_rate_pct: 18, warranty_applicable_yn: 'Y', warranty_period_months: 6, barcode: '890123456009', stock_uom: 'SET', purchase_uom: 'BOX (10 Sets)' },
              'ITEM-2W-010': { brand: 'Rolon', manufacturer: 'L.G. Balakrishnan & Bros', part_number: 'ROL-CH-PUN-01', oem_part_number: '06405-KRE-900', short_name: 'Chain & Sprocket Kit', mrp: 1450, workshop_sale_price: 1150, counter_sale_price: 1300, gst_rate_pct: 18, warranty_applicable_yn: 'Y', warranty_period_months: 12, barcode: '890123456010', stock_uom: 'SET', purchase_uom: 'BOX (5 Sets)' },
              'ITEM-2W-011': { brand: 'Bando', manufacturer: 'Bando Chemical Industries', part_number: '23100-KWP-D01', oem_part_number: '23100-KWP-D01', short_name: 'CVT Variator Drive Belt', mrp: 590, workshop_sale_price: 480, counter_sale_price: 540, gst_rate_pct: 18, warranty_applicable_yn: 'Y', warranty_period_months: 6, barcode: '890123456011', stock_uom: 'NOS', purchase_uom: 'BOX (10 Nos)' },
              'ITEM-2W-012': { brand: 'Motul', manufacturer: 'Motul India', part_number: 'MOT-FORK-350', oem_part_number: 'MOT-SUSP-350ML', short_name: 'Front Fork Oil 350ml', mrp: 240, workshop_sale_price: 190, counter_sale_price: 215, gst_rate_pct: 18, warranty_applicable_yn: 'N', warranty_period_months: 0, barcode: '890123456012', stock_uom: 'CAN', purchase_uom: 'CARTON (12 Cans)' },
              'ITEM-2W-013': { brand: 'Bosch', manufacturer: 'Bosch Automotive Aftermarket', part_number: '1987479105', oem_part_number: 'DOT4-SYN-250ML', short_name: 'DOT 4 Brake Fluid 250ml', mrp: 195, workshop_sale_price: 160, counter_sale_price: 180, gst_rate_pct: 18, warranty_applicable_yn: 'N', warranty_period_months: 0, barcode: '890123456013', stock_uom: 'BTL', purchase_uom: 'CARTON (12 Btls)' },
              'ITEM-2W-014': { brand: 'OEM Warranty', manufacturer: 'OEM Warranty Salvage', part_number: 'WAR-PAD-DEF', oem_part_number: 'WARR-DEF-01', short_name: 'Warranty Defective Part', mrp: 0, workshop_sale_price: 0, counter_sale_price: 0, gst_rate_pct: 0, warranty_applicable_yn: 'Y', warranty_period_months: 0, barcode: '890123456014', stock_uom: 'SET', purchase_uom: 'SET' },
              'ITEM-2W-015': { brand: 'Workshop Salvage', manufacturer: 'Workshop Metal Recyclers', part_number: 'SCP-MET-GEN', oem_part_number: 'SCRAP-GEN-01', short_name: 'Workshop Scrap Metal', mrp: 35, workshop_sale_price: 35, counter_sale_price: 35, gst_rate_pct: 18, warranty_applicable_yn: 'N', warranty_period_months: 0, barcode: '890123456015', stock_uom: 'KG', purchase_uom: 'KG' }
            };

            const compatList = parsed.itemVehicleCompatibility || [];

            parsed.items.forEach(item => {
              const def = defaults[item.id] || {};
              item.brand = item.brand || def.brand || 'Standard';
              item.manufacturer = item.manufacturer || def.manufacturer || 'OEM';
              item.part_number = item.part_number || def.part_number || (item.code + '-PT');
              item.oem_part_number = item.oem_part_number || def.oem_part_number || item.code;
              item.short_name = item.short_name || def.short_name || item.name;
              item.stock_uom = item.stock_uom || def.stock_uom || item.base_uom || 'NOS';
              item.purchase_uom = item.purchase_uom || def.purchase_uom || item.stock_uom;
              item.issue_uom = item.issue_uom || item.stock_uom;
              item.sale_uom = item.sale_uom || item.stock_uom;
              item.uom_conversion_factor = item.uom_conversion_factor || 1;
              item.mrp = item.mrp || def.mrp || Math.round((item.sale_price || 200) * 1.2);
              item.workshop_sale_price = item.workshop_sale_price || def.workshop_sale_price || item.sale_price || 150;
              item.counter_sale_price = item.counter_sale_price || def.counter_sale_price || item.mrp;
              item.gst_rate_pct = item.gst_rate_pct !== undefined ? item.gst_rate_pct : (def.gst_rate_pct !== undefined ? def.gst_rate_pct : 0);
              item.warranty_applicable_yn = item.warranty_applicable_yn || def.warranty_applicable_yn || (item.is_serial_controlled ? 'Y' : 'N');
              item.warranty_period_months = item.warranty_period_months !== undefined ? item.warranty_period_months : (def.warranty_period_months !== undefined ? def.warranty_period_months : 6);
              item.status = item.status || 'Active';
              item.barcode = item.barcode || def.barcode || `890123456${String(Math.floor(100 + Math.random() * 900))}`;
              
              if (!item.vehicle_model_ids || !Array.isArray(item.vehicle_model_ids)) {
                item.vehicle_model_ids = compatList.filter(c => c.item_id === item.id).map(c => c.model_id);
              }
            });
          }
          parsed._item_master_brd_v1 = true;
          updated = true;
        }

        // Purge legacy dummy accounts (USR-004 to USR-015 from old demo data) once during initialization
        if (!parsed._legacy_dummy_users_purged_v2) {
          const legacyPurgeIds = ['USR-004', 'USR-005', 'USR-006', 'USR-007', 'USR-008', 'USR-009', 'USR-010', 'USR-011', 'USR-012', 'USR-013', 'USR-014', 'USR-015'];
          if (parsed.users && Array.isArray(parsed.users)) {
            parsed.users = parsed.users.filter(u => !legacyPurgeIds.includes(u.id));
          }
          parsed._legacy_dummy_users_purged_v2 = true;
          updated = true;
        }

        // Ensure allowed baseline users from INITIAL_DATA are present in localStorage
        const allowedUserIds = ['USR-001', 'USR-002', 'USR-003', 'USR-106', 'USR-107', 'USR-108', 'USR-109', 'USR-110', 'USR-111'];
        if (parsed.users && Array.isArray(parsed.users)) {
          const seedUsers = (typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.users)) 
            ? INITIAL_DATA.users 
            : [];
          seedUsers.forEach(su => {
            if (allowedUserIds.includes(su.id) && !parsed.users.some(u => u.id === su.id)) {
              parsed.users.push(JSON.parse(JSON.stringify(su)));
              updated = true;
            }
          });
        }

        if (parsed.users && Array.isArray(parsed.users)) {
          parsed.users.forEach(u => {
            if (u.primary_role === 'ROLE-SUPER-ADMIN' || u.primary_role === 'SUPER_ADMIN') {
              u.primary_role = 'ROLE-001';
              u.primary_role_id = 'ROLE-001';
              updated = true;
            }
            if (u.id === 'USR-111') {
              u.primary_role = 'ROLE-001';
              u.primary_role_id = 'ROLE-001';
              u.user_type = 'Admin';
              updated = true;
            }
            if (!u.primary_role) {
              u.primary_role = u.id === 'USR-001' ? 'ROLE-ADMIN' : 'ROLE-OPERATOR';
              u.primary_role_id = u.primary_role;
              updated = true;
            }
            if (!u.primary_role_id && u.primary_role) {
              u.primary_role_id = u.primary_role;
              updated = true;
            }
            if (!u.status) {
              u.status = 'ACTIVE';
              updated = true;
            }

            // Backfill all 14 mandatory/conditional fields for User Master
            if (!u.employee_id) {
              u.employee_id = `EMP-${9000 + (parseInt(u.id.replace(/\D/g, '') || '42', 10))}`;
              updated = true;
            }
            if (!u.employee_name) {
              u.employee_name = u.full_name || u.display_name || u.username;
              updated = true;
            }
            if (!u.first_name || !u.last_name) {
              const nameParts = String(u.full_name || u.display_name || u.username || 'User').split(' ');
              if (!u.first_name) u.first_name = nameParts[0] || u.username || 'User';
              if (!u.last_name) u.last_name = nameParts.slice(1).join(' ') || nameParts[0] || 'User';
              updated = true;
            }
            if (u.middle_name === undefined) {
              u.middle_name = '';
              updated = true;
            }
            if (!u.display_name) {
              u.display_name = u.full_name || `${u.first_name} ${u.last_name}`.trim();
              updated = true;
            }
            if (!u.full_name) {
              u.full_name = u.display_name;
              updated = true;
            }
            if (!u.user_type) {
              if (u.primary_role === 'ROLE-ADMIN' || u.id === 'USR-001') u.user_type = 'Admin';
              else if ((u.username && u.username.startsWith('dr.')) || (u.designation && u.designation.includes('Surgeon'))) u.user_type = 'Doctor';
              else if (u.designation && u.designation.includes('Nurse')) u.user_type = 'Nurse';
              else if (u.primary_role === 'ROLE-QA-INSPECTOR' || (u.designation && u.designation.includes('Tech'))) u.user_type = 'Technician';
              else u.user_type = 'Employee';
              updated = true;
            }
            if (!u.designation) {
              u.designation = 'Operations Specialist';
              updated = true;
            }
            if (!u.department) {
              u.department = 'General Operations';
              updated = true;
            }
            if (u.specialty === undefined) {
              u.specialty = u.user_type === 'Doctor' ? 'General Medicine & Surgery' : '';
              updated = true;
            }
            // Mobile number: strictly 10 digits only
            const rawMobile = u.mobile_number || u.phone || '9800000000';
            const cleanDigits = String(rawMobile).replace(/\D/g, '').slice(-10).padStart(10, '9');
            if (u.mobile_number !== cleanDigits || u.phone !== cleanDigits) {
              u.mobile_number = cleanDigits;
              u.phone = cleanDigits;
              updated = true;
            }
            if (!u.email) {
              u.email = `${u.username}@apexind.com`;
              updated = true;
            }
            if (!u.status) {
              u.status = 'ACTIVE';
              updated = true;
            }
            if (!u.password_hash) {
              u.password_salt = 'a1b2c3d4e5f67890';
              u.password_hash = 'sha256$a1b2c3d4e5f67890$31d609d6b3258ee2429b14c0e987ddca6558550f014f0824b8a3813fde440ce4';
              u.password_history = [u.password_hash];
              u.must_change_password = false;
              u.password_last_changed = u.created_at || '2025-01-15T09:00:00Z';
              updated = true;
            }
          });
        }

        // Synchronize employees strictly with valid User Master data & purge legacy hospital mock records
        const isLegacyHospitalEmployees = parsed.employees && Array.isArray(parsed.employees) && parsed.employees.some(emp => 
          (emp.full_name && (emp.full_name.includes('Dr.') || emp.full_name.includes('Nurse') || emp.full_name.includes('Suresh Nair') || emp.full_name.includes('Ganesh Jadhav') || emp.full_name.includes('Vikram Rao'))) ||
          emp.department === 'Medical & Clinical Services' ||
          emp.id === 'EMP-9045' || emp.id === 'EMP-9049'
        );
        if (isLegacyHospitalEmployees || !parsed._user_master_synced_employees_v2 || (parsed.employees && parsed.users && parsed.employees.length > parsed.users.length)) {
          const userList = (parsed.users && Array.isArray(parsed.users)) ? parsed.users : [];
          parsed.employees = userList.map(u => ({
            id: u.employee_id || `EMP-${9000 + parseInt(u.id.replace(/\D/g, '') || '0', 10)}`,
            code: u.employee_id || u.id,
            first_name: u.first_name || '',
            middle_name: u.middle_name || '',
            last_name: u.last_name || '',
            full_name: u.full_name || u.display_name || u.username,
            display_name: u.display_name || u.full_name || u.username,
            user_type: u.user_type || 'Employee',
            designation: u.designation || '',
            department: u.department || '',
            specialty: u.specialty || '',
            mobile_number: (u.mobile_number || u.phone || '').replace(/\D/g, '').slice(-10),
            email: u.email || ''
          }));
          parsed._user_master_synced_employees_v2 = true;
          updated = true;
        } else if (parsed.employees && Array.isArray(parsed.employees)) {
          parsed.employees.forEach(emp => {
            if (emp.mobile_number) {
              const cleanDigits = String(emp.mobile_number).replace(/\D/g, '').slice(-10).padStart(10, '9');
              if (emp.mobile_number !== cleanDigits) {
                emp.mobile_number = cleanDigits;
                updated = true;
              }
            }
          });
        }

        // Purge legacy hospital departments if present
        if (parsed.departments && Array.isArray(parsed.departments)) {
          const hadHospitalDepts = parsed.departments.some(d => d.name === 'Medical & Clinical Services' || (d.name && d.name.toLowerCase().includes('patient')));
          if (hadHospitalDepts) {
            parsed.departments = parsed.departments.filter(d => d.name !== 'Medical & Clinical Services' && !(d.name && d.name.toLowerCase().includes('patient')));
            if (!parsed.departments.some(d => d.code === 'LOG-DIST')) {
              parsed.departments.push({
                id: 'DEPT-07',
                plant_id: '',
                code: 'LOG-DIST',
                name: 'Logistics & Distribution',
                cost_center: 'CC-106'
              });
            }
            if (!parsed.departments.some(d => d.code === 'OPS-DIR')) {
              parsed.departments.push({
                id: 'DEPT-08',
                plant_id: '',
                code: 'OPS-DIR',
                name: 'Operations Directorate',
                cost_center: 'CC-107'
              });
            }
            updated = true;
          }
        }

        // Purge deleted ROLE-STORE-EXEC from roles and reassign any legacy users
        if (parsed.roles && Array.isArray(parsed.roles)) {
          const origCount = parsed.roles.length;
          parsed.roles = parsed.roles.filter(r => r.id !== 'ROLE-STORE-EXEC');
          if (parsed.roles.length !== origCount) updated = true;
        }
        if (parsed.role_permissions && Array.isArray(parsed.role_permissions)) {
          const origCount = parsed.role_permissions.length;
          parsed.role_permissions = parsed.role_permissions.filter(rp => rp.role_id !== 'ROLE-STORE-EXEC');
          if (parsed.role_permissions.length !== origCount) updated = true;
        }
        if (parsed.users && Array.isArray(parsed.users)) {
          parsed.users.forEach(u => {
            if (u.primary_role === 'ROLE-STORE-EXEC' || u.primary_role_id === 'ROLE-STORE-EXEC') {
              u.primary_role = 'ROLE-STORE-MGR';
              u.primary_role_id = 'ROLE-STORE-MGR';
              updated = true;
            }
          });
        }

        // Preserve the primary operational roles AND all custom user-created roles
        const coreRoleIds = ['ROLE-ADMIN', 'ROLE-STORE-MGR', 'ROLE-PURCHASE-MGR', 'ROLE-002', 'ROLE-003', 'ROLE-004', 'ROLE-001'];
        if (parsed.roles && Array.isArray(parsed.roles)) {
          const origRoleLen = parsed.roles.length;
          // Keep core operational roles, and preserve ANY custom role created by users (!r.is_system or not in legacy sample list)
          parsed.roles = parsed.roles.filter(r => coreRoleIds.includes(r.id) || r.is_system === false);

          // Seed any missing allowed roles from INITIAL_DATA.roles
          const seedRoles = (typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.roles)) 
            ? INITIAL_DATA.roles 
            : [];
          seedRoles.forEach(sr => {
            if (coreRoleIds.includes(sr.id) && !parsed.roles.some(r => r.id === sr.id)) {
              parsed.roles.push(JSON.parse(JSON.stringify(sr)));
              updated = true;
            }
          });

          if (parsed.roles.length !== origRoleLen) {
            updated = true;
          }
          const adminRole = parsed.roles.find(r => r.id === 'ROLE-ADMIN');
          if (adminRole && adminRole.user_count === 0) {
            adminRole.user_count = 1;
            updated = true;
          }
        }

        // Clean up role_permissions to only keep permissions for valid roles
        if (parsed.role_permissions && Array.isArray(parsed.role_permissions) && parsed.roles) {
          const validRoleIds = new Set(parsed.roles.map(r => r.id));
          const origPermLen = parsed.role_permissions.length;
          parsed.role_permissions = parsed.role_permissions.filter(rp => validRoleIds.has(rp.role_id));
          if (parsed.role_permissions.length !== origPermLen) {
            updated = true;
          }
        }

        const initData = typeof INITIAL_DATA !== 'undefined' ? INITIAL_DATA : (typeof window !== 'undefined' ? window.INITIAL_DATA : null);
        if (initData) {
          for (const key of Object.keys(initData)) {
            if (!parsed[key]) {
              parsed[key] = JSON.parse(JSON.stringify(initData[key]));
              updated = true;
            }
          }
          // Merge any newly introduced seed users (e.g. USR-014..USR-017) if not present
          if (initData.users && parsed.users) {
            initData.users.forEach(initUser => {
              if (!parsed.users.some(pu => pu.id === initUser.id)) {
                parsed.users.push(JSON.parse(JSON.stringify(initUser)));
                updated = true;
              }
            });
          }
          // Ensure permissions are synchronized with Store & Inventory transactions
          if (initData.permissions && parsed.permissions) {
            initData.permissions.forEach(initPerm => {
              if (!parsed.permissions.some(p => p.code === initPerm.code || p.id === initPerm.id)) {
                parsed.permissions.push(JSON.parse(JSON.stringify(initPerm)));
                updated = true;
              }
            });
          }

          // Ensure role_permissions from INITIAL_DATA (including Store & Inventory permissions) are merged
          if (initData.role_permissions && parsed.role_permissions) {
            initData.role_permissions.forEach(initRp => {
              const existingIdx = parsed.role_permissions.findIndex(
                rp => rp.role_id === initRp.role_id && rp.perm_code === initRp.perm_code
              );
              if (existingIdx === -1) {
                parsed.role_permissions.push(JSON.parse(JSON.stringify(initRp)));
                updated = true;
              } else if (initRp.view && !parsed.role_permissions[existingIdx].view && (initRp.role_id === 'ROLE-STORE-EXEC' || initRp.role_id === 'ROLE-STORE-MGR' || initRp.role_id === 'ROLE-002' || initRp.role_id === 'ROLE-003' || initRp.role_id === 'ROLE-001' || initRp.role_id === 'ROLE-004')) {
                parsed.role_permissions[existingIdx] = JSON.parse(JSON.stringify(initRp));
                updated = true;
              }
            });
          }
          // Ensure geographic, lookup, tax, and document number series masters are initialized
          ['countries', 'states', 'districts', 'cities', 'pincodes', 'common_masters', 'taxes', 'document_number_series'].forEach(col => {
            if (initData[col]) {
              if (!parsed[col] || !Array.isArray(parsed[col]) || parsed[col].length === 0) {
                parsed[col] = JSON.parse(JSON.stringify(initData[col]));
                updated = true;
              }
            }
          });

          // Ensure Financial Calendar Master is initialized once
          if (!parsed._fin_cal_seeded_v1) {
            if (initData.financial_calendar && (!parsed.financial_calendar || !Array.isArray(parsed.financial_calendar))) {
              parsed.financial_calendar = JSON.parse(JSON.stringify(initData.financial_calendar));
              updated = true;
            }
            if (initData.financial_calendar_audit && (!parsed.financial_calendar_audit || !Array.isArray(parsed.financial_calendar_audit))) {
              parsed.financial_calendar_audit = JSON.parse(JSON.stringify(initData.financial_calendar_audit));
              updated = true;
            }
            parsed._fin_cal_seeded_v1 = true;
          }

          // Ensure Holiday Master collections are initialized
          if (!parsed._holiday_master_seeded_v1) {
            if (initData.holiday_types && (!parsed.holiday_types || !Array.isArray(parsed.holiday_types) || parsed.holiday_types.length === 0)) {
              parsed.holiday_types = JSON.parse(JSON.stringify(initData.holiday_types));
              updated = true;
            }
            if (initData.holidays && (!parsed.holidays || !Array.isArray(parsed.holidays) || parsed.holidays.length === 0)) {
              parsed.holidays = JSON.parse(JSON.stringify(initData.holidays));
              updated = true;
            }
            if (initData.holiday_audit && (!parsed.holiday_audit || !Array.isArray(parsed.holiday_audit) || parsed.holiday_audit.length === 0)) {
              parsed.holiday_audit = JSON.parse(JSON.stringify(initData.holiday_audit));
              updated = true;
            }
            parsed._holiday_master_seeded_v1 = true;
          }

          // Reset all Document Number Series formats and restart sequence from 1
          if (!parsed._doc_series_reset_v3) {
            if (initData.document_number_series && Array.isArray(initData.document_number_series)) {
              parsed.document_number_series = JSON.parse(JSON.stringify(initData.document_number_series));
              updated = true;
            } else if (parsed.document_number_series && Array.isArray(parsed.document_number_series)) {
              parsed.document_number_series.forEach(item => {
                item.starting_number = 1;
                item.current_number = 0;
                item.next_number = 1;
                item.generated_count = 0;
                item.suffix = '';
                item.separator = '/';
                item.year_format = 'YYYY';
                item.number_length = 6;
                item.reset_frequency = 'Financial Year';
                item.status = 'Active';
              });
              updated = true;
            }
            parsed._doc_series_reset_v3 = true;
          }

          // Migrate Document Number Series to current Facility Master facilities (Mauli Service Center 1 & 2)
          if (!parsed._doc_series_facility_migrated_v5 || (parsed.document_number_series && parsed.document_number_series.some(s => s.branch_name === 'Pune Main Workshop' || s.branch_id === 'BR-001'))) {
            if (initData.document_number_series && Array.isArray(initData.document_number_series)) {
              const existingDns018 = parsed.document_number_series ? parsed.document_number_series.find(s => s.id === 'DNS-018') : null;
              parsed.document_number_series = JSON.parse(JSON.stringify(initData.document_number_series));
              if (existingDns018) {
                const idx = parsed.document_number_series.findIndex(s => s.id === 'DNS-018');
                if (idx !== -1) {
                  parsed.document_number_series[idx] = { ...parsed.document_number_series[idx], ...existingDns018 };
                }
              }
              updated = true;
            }
            parsed._doc_series_facility_migrated_v5 = true;
          }

          // Ensure all transaction document number series (JC, EST, DB, INV, GP) exist in document_number_series
          if (!parsed._doc_series_billing_v6) {
            if (initData.document_number_series && Array.isArray(initData.document_number_series)) {
              if (!Array.isArray(parsed.document_number_series)) parsed.document_number_series = [];
              initData.document_number_series.forEach(seedSeries => {
                const existing = parsed.document_number_series.find(s => 
                  s.id === seedSeries.id || 
                  (s.doc_type_code === seedSeries.doc_type_code && s.branch_id === seedSeries.branch_id)
                );
                if (!existing) {
                  parsed.document_number_series.push(JSON.parse(JSON.stringify(seedSeries)));
                  updated = true;
                } else if (seedSeries.doc_type_name && existing.doc_type_name !== seedSeries.doc_type_name) {
                  existing.doc_type_name = seedSeries.doc_type_name;
                  updated = true;
                }
              });
            }
            parsed._doc_series_billing_v6 = true;
          }

          // Ensure password_policies is synchronized with complete configuration
          if (initData.password_policies) {
            if (!parsed.password_policies) {
              parsed.password_policies = JSON.parse(JSON.stringify(initData.password_policies));
              updated = true;
            } else {
              for (const pk of Object.keys(initData.password_policies)) {
                if (parsed.password_policies[pk] === undefined) {
                  parsed.password_policies[pk] = initData.password_policies[pk];
                  updated = true;
                }
              }
            }
          }

          // Ensure facilities and organizations for Mauli Service Center Pvt. Ltd. are loaded and linked
          if (initData.plants && initData.plants.length > 0) {
            if (!parsed.plants || !Array.isArray(parsed.plants) || parsed.plants.length === 0) {
              parsed.plants = JSON.parse(JSON.stringify(initData.plants));
              updated = true;
            } else {
              initData.plants.forEach(initP => {
                const existing = parsed.plants.find(p => p.id === initP.id || p.code === initP.code);
                if (!existing) {
                  parsed.plants.push(JSON.parse(JSON.stringify(initP)));
                  updated = true;
                } else {
                  if (!existing.organization_id && initP.organization_id) {
                    existing.organization_id = initP.organization_id;
                    updated = true;
                  }
                  if (initP.branch_code && existing.branch_code !== initP.branch_code) {
                    existing.branch_code = initP.branch_code;
                    updated = true;
                  }
                  if (initP.name && existing.name !== initP.name) {
                    existing.name = initP.name;
                    updated = true;
                  }
                  if (initP.code && existing.code !== initP.code) {
                    existing.code = initP.code;
                    updated = true;
                  }
                }
              });
            }
          }

          if (initData.organizations && initData.organizations.length > 0) {
            if (!parsed.organizations || !Array.isArray(parsed.organizations) || parsed.organizations.length === 0) {
              parsed.organizations = JSON.parse(JSON.stringify(initData.organizations));
              updated = true;
            } else {
              initData.organizations.forEach(initO => {
                const existing = parsed.organizations.find(o => o.id === initO.id || o.name === initO.name);
                if (!existing) {
                  parsed.organizations.push(JSON.parse(JSON.stringify(initO)));
                  updated = true;
                }
              });
            }
          }

          if (parsed.plants && Array.isArray(parsed.plants)) {
            parsed.plants.forEach(p => {
              if (!p.branch_code) {
                if (p.city === 'Pune' || (p.code && p.code.includes('PUN'))) p.branch_code = 'PUN';
                else if (p.city === 'Mumbai' || (p.code && p.code.includes('MUM'))) p.branch_code = 'MUM';
                else if (p.city === 'Nagpur' || (p.code && p.code.includes('NAG'))) p.branch_code = 'NAG';
                else if (p.city === 'Chennai' || (p.code && p.code.includes('CHE'))) p.branch_code = 'CHE';
                else p.branch_code = (p.city || p.code || 'PUN').substring(0, 3).toUpperCase();
                updated = true;
              }
              // Link unassigned branches to primary organization (Mauli Service Center Pvt. Ltd.)
              if (!p.organization_id) {
                const defaultOrg = (parsed.organizations && parsed.organizations.find(o => o.id === 'ORG-001' || o.name.includes('Mauli'))) || (parsed.organizations && parsed.organizations[0]);
                if (defaultOrg) {
                  p.organization_id = defaultOrg.id;
                  updated = true;
                }
              }
              if (p.code && p.code.startsWith('GARAGE-')) {
                p.code = p.code.replace('GARAGE-', 'BRANCH-');
                updated = true;
              }
              if (p.name && p.name.includes('Garage')) {
                p.name = p.name.replace(/Garage/g, 'Branch');
                updated = true;
              }
              if (p.plant_type === 'TWO_WHEELER_GARAGE') {
                p.plant_type = 'TWO_WHEELER_WORKSHOP';
                updated = true;
              }
            });
          }

          if (parsed.organizations && Array.isArray(parsed.organizations)) {
            parsed.organizations.forEach(o => {
              if (o.code === 'PATIL-GARAGE') {
                o.code = 'PATIL-AUTO';
                updated = true;
              }
              if (o.email === 'contact@patilgarage.com') {
                o.email = 'contact@patilauto.com';
                updated = true;
              }
              if (o.website === 'https://www.patilgarage.com') {
                o.website = 'https://www.patilauto.com';
                updated = true;
              }
              if (o.business_category === 'Two-Wheeler Garage') {
                o.business_category = 'Two-Wheeler Workshop';
                updated = true;
              }
            });
          }

          // Ensure racks and shelves are initialized
          if (initData.racks && (!parsed.racks || parsed.racks.length === 0)) {
            parsed.racks = JSON.parse(JSON.stringify(initData.racks));
            updated = true;
          }
          if (initData.shelves && (!parsed.shelves || parsed.shelves.length === 0)) {
            parsed.shelves = JSON.parse(JSON.stringify(initData.shelves));
            updated = true;
          }

          // Purge unnecessary non-two-wheeler master data from localStorage
          const non2wItemCodes = [
            'RM-STL-4140', 'RM-ALU-6061', 'RM-BRG-6205', 'RM-SL-VIT', 'RM-ECU-MICRO',
            'RM-OIL-ISO46', 'RM-FAST-M8', 'SA-MTR-04', 'FG-ACT-1000', 'FG-CNC-500', 'PKG-CRTN-01'
          ];
          const non2wWhIds = ['WH-PUN-RMS', 'WH-PUN-WIP', 'WH-PUN-FGH', 'WH-PUN-QAR', 'WH-CHE-RMS'];
          const non2wCatIds = ['CAT-01', 'CAT-02', 'CAT-03', 'CAT-04', 'CAT-05', 'CAT-06', 'CAT-07'];

          if (parsed.items && Array.isArray(parsed.items)) {
            const before = parsed.items.length;
            parsed.items = parsed.items.filter(i => !non2wItemCodes.includes(i.code) && !/^ITEM-0\d\d$/.test(i.id));
            if (parsed.items.length !== before) updated = true;
          }

          if (parsed.itemCategories && Array.isArray(parsed.itemCategories)) {
            const before = parsed.itemCategories.length;
            parsed.itemCategories = parsed.itemCategories.filter(c => !non2wCatIds.includes(c.id));
            if (parsed.itemCategories.length !== before) updated = true;
          }

          if (parsed.warehouses && Array.isArray(parsed.warehouses)) {
            const before = parsed.warehouses.length;
            parsed.warehouses = parsed.warehouses.filter(w => !non2wWhIds.includes(w.id));
            if (parsed.warehouses.length !== before) updated = true;
          }

          if (parsed.zones && Array.isArray(parsed.zones)) {
            const before = parsed.zones.length;
            parsed.zones = parsed.zones.filter(z => !non2wWhIds.includes(z.warehouse_id) && !['ZONE-A', 'ZONE-B', 'ZONE-C', 'ZONE-Q', 'ZONE-F1', 'ZONE-F2'].includes(z.id));
            if (parsed.zones.length !== before) updated = true;
          }

          if (parsed.racks && Array.isArray(parsed.racks)) {
            const before = parsed.racks.length;
            parsed.racks = parsed.racks.filter(r => !non2wWhIds.includes(r.warehouse_id) && !['RCK-01', 'RCK-02', 'RCK-03', 'RCK-Q1', 'RCK-F1'].includes(r.id));
            if (parsed.racks.length !== before) updated = true;
          }

          if (parsed.shelves && Array.isArray(parsed.shelves)) {
            const before = parsed.shelves.length;
            parsed.shelves = parsed.shelves.filter(s => !non2wWhIds.includes(s.warehouse_id) && !s.id.startsWith('SHF-R0') && !s.id.startsWith('SHF-RQ') && !s.id.startsWith('SHF-RF'));
            if (parsed.shelves.length !== before) updated = true;
          }

          if (parsed.bins && Array.isArray(parsed.bins)) {
            const before = parsed.bins.length;
            parsed.bins = parsed.bins.filter(b => !non2wWhIds.includes(b.warehouse_id) && !b.id.startsWith('BIN-RMS') && !b.id.startsWith('BIN-QAR') && !b.id.startsWith('BIN-FGH'));
            if (parsed.bins.length !== before) updated = true;
          }

          if (parsed.boms && Array.isArray(parsed.boms)) {
            const before = parsed.boms.length;
            parsed.boms = parsed.boms.filter(b => !['BOM-001', 'BOM-002'].includes(b.id));
            if (parsed.boms.length !== before) updated = true;
          }

          if (parsed.inventoryBalances && Array.isArray(parsed.inventoryBalances)) {
            const before = parsed.inventoryBalances.length;
            parsed.inventoryBalances = parsed.inventoryBalances.filter(b => !non2wWhIds.includes(b.warehouse_id) && !non2wItemCodes.includes(b.item_id) && !/^ITEM-0\d\d$/.test(b.item_id));
            if (parsed.inventoryBalances.length !== before) updated = true;
          }

          if (parsed.suppliers && Array.isArray(parsed.suppliers) && parsed.suppliers.some(s => s.code === 'TATA-STEEL')) {
            parsed.suppliers = JSON.parse(JSON.stringify(initData.suppliers));
            updated = true;
          }

          if (parsed.customers && Array.isArray(parsed.customers) && parsed.customers.length > 0) {
            parsed.customers = [];
            updated = true;
          }

          // Two-Wheeler BRD: Merge stores into warehouses (only if not cleared)
          if (!parsed._stores_cleared_v1 && initData.warehouses && parsed.warehouses) {
            initData.warehouses.forEach(w => {
              if (!parsed.warehouses.some(pw => pw.id === w.id)) {
                parsed.warehouses.push(JSON.parse(JSON.stringify(w)));
                updated = true;
              }
            });
          }

          // Two-Wheeler BRD: Merge 20 categories into itemCategories
          if (initData.itemCategories && parsed.itemCategories) {
            initData.itemCategories.forEach(cat => {
              if (!parsed.itemCategories.some(pc => pc.id === cat.id)) {
                parsed.itemCategories.push(JSON.parse(JSON.stringify(cat)));
                updated = true;
              }
            });
          }

          // Items / SKU Catalog intentionally purged from mock data

          // Two-Wheeler BRD: Merge storage locations, boms & balances
          ['zones', 'racks', 'shelves', 'bins', 'boms', 'inventoryBalances'].forEach(coll => {
            if (initData[coll] && parsed[coll]) {
              initData[coll].forEach(item => {
                if (!parsed[coll].some(p => p.id === item.id)) {
                  parsed[coll].push(JSON.parse(JSON.stringify(item)));
                  updated = true;
                }
              });
            }
          });

          // Two-Wheeler BRD: Ensure all new collections are loaded if empty or missing
          const extraBrdKeys = [
            'storeTypes',
            'storeTransactionConfigs',
            'vehicleManufacturers',
            'vehicleModels',
            'itemVehicleCompatibility',
            'inventoryRules',
            'jobCards',
            'warrantyClaims',
            'scrapDisposals',
            'stockCountSessions',
            'itemSubcategories',
            'itemBrands',
            'itemManufacturers',
            'uoms',
            'hsnCodes'
          ];
          extraBrdKeys.forEach(k => {
            if (!parsed[k] || (Array.isArray(parsed[k]) && parsed[k].length === 0)) {
              if (initData[k]) {
                parsed[k] = JSON.parse(JSON.stringify(initData[k]));
                updated = true;
              }
            }
          });
        }

        // Ensure ROLE-004 and screen role permissions are initialized
        if (!parsed._role_004_synced_v1) {
          if (Array.isArray(parsed.roles)) {
            if (!parsed.roles.some(r => r.id === 'ROLE-004')) {
              parsed.roles.push({
                id: 'ROLE-004',
                code: 'WORKSHOP_TECH_BILLING',
                name: 'Workshop Technician & Billing Specialist',
                description: 'Two-wheeler garage workshop technician, job cards, parts requisition, estimates, billing, and vehicle delivery handover.',
                role_type: 'OPERATIONAL',
                is_system: false,
                status: 'ACTIVE',
                user_count: 1
              });
              updated = true;
            }
          }
          if (Array.isArray(parsed.role_permissions)) {
            const r004Perms = [
              'DASHBOARD', 'BILLING_DASHBOARD', 'STORE_TX_JOB_CARD_ISSUE', 'JOB_CARDS',
              'BILLING_ESTIMATES', 'CUSTOMER_BILLING', 'DRAFT_BILLS', 'FINAL_BILLS',
              'VEHICLE_DELIVERY', 'INVENTORY'
            ];
            r004Perms.forEach(pCode => {
              if (!parsed.role_permissions.some(rp => rp.role_id === 'ROLE-004' && rp.perm_code === pCode)) {
                parsed.role_permissions.push({
                  role_id: 'ROLE-004',
                  perm_code: pCode,
                  view: true, add: true, edit: true, delete: true, submit: true, approve: true, reject: true, cancel: true, print: true, export: true, import: true, post: true, reverse: false, close: true, reopen: false
                });
                updated = true;
              }
            });
          }
          parsed._role_004_synced_v1 = true;
        }

        // Two-Wheeler BRD / Master Cleanup: Purge seeded mock data from Item Master & Vehicle Compatibility Master
        if (!parsed._item_master_and_vehicle_compat_purged_v1) {
          parsed.items = [];
          parsed.vehicleModels = [];
          parsed.itemVehicleCompatibility = [];
          if (Array.isArray(parsed.inventoryBalances)) parsed.inventoryBalances = [];
          if (Array.isArray(parsed.inventoryTransactions)) parsed.inventoryTransactions = [];
          if (Array.isArray(parsed.storeItemMappings)) parsed.storeItemMappings = [];
          parsed._item_master_and_vehicle_compat_purged_v1 = true;
          updated = true;
        }

        // Cleanup: Purge Material & Product Master (SKU Catalog) from database
        if (!parsed._sku_catalog_purged_v1) {
          parsed.items = [];
          parsed._sku_catalog_purged_v1 = true;
          updated = true;
        }

        // Cleanup: Purge Category & Item Store Mapping from database
        if (!parsed._store_item_mappings_purged_v1) {
          parsed.storeItemMappings = [];
          parsed._store_item_mappings_purged_v1 = true;
          updated = true;
        }

        // Cleanup: Remove standalone Warehouse Access & Department Access master collections
        if (!parsed._access_masters_purged_v1) {
          delete parsed.user_warehouse_access;
          delete parsed.user_department_access;
          parsed._access_masters_purged_v1 = true;
          updated = true;
        }

        // Ensure Store Master BRD Collections
        if (!Array.isArray(parsed.storeScreenMappings)) { parsed.storeScreenMappings = []; updated = true; }
        if (!Array.isArray(parsed.storeCategoryMappings)) { parsed.storeCategoryMappings = []; updated = true; }
        if (!Array.isArray(parsed.storeItemMappings)) { parsed.storeItemMappings = []; updated = true; }
        if (!Array.isArray(parsed.storeReorderLevels)) { parsed.storeReorderLevels = []; updated = true; }
        if (!Array.isArray(parsed.storeAuditLogs)) { parsed.storeAuditLogs = []; updated = true; }
        if (!Array.isArray(parsed.userPinnedSubmodules)) { parsed.userPinnedSubmodules = []; updated = true; }
        if (!Array.isArray(parsed.userPinnedAuditLogs)) { parsed.userPinnedAuditLogs = []; updated = true; }
        if (!Array.isArray(parsed.userFavouriteVehicles)) { parsed.userFavouriteVehicles = []; updated = true; }
        if (typeof parsed.maxPinnedSubmodules !== 'number') { parsed.maxPinnedSubmodules = 7; updated = true; }
        // Auto-heal deduplicate vehicleModels by code / id
        if (parsed.vehicleModels && Array.isArray(parsed.vehicleModels) && parsed.vehicleModels.length > 0) {
          const seen = new Set();
          const deduped = [];
          let hadDupes = false;
          parsed.vehicleModels.forEach(v => {
            const key = String(v.code || v.id || '').toUpperCase().trim();
            if (key) {
              if (!seen.has(key)) {
                seen.add(key);
                deduped.push(v);
              } else {
                hadDupes = true;
              }
            } else {
              deduped.push(v);
            }
          });
          if (hadDupes) {
            console.log(`[DB Auto-Heal] Deduplicated vehicleModels from ${parsed.vehicleModels.length} to ${deduped.length}`);
            parsed.vehicleModels = deduped;
            updated = true;
          }
        }

        if (updated || !stored) {
          this.saveData(parsed);
        }
        return parsed;
    } catch (e) {
      console.warn('Could not read from localStorage, using initial mock data:', e);
    }
    const initData = typeof INITIAL_DATA !== 'undefined' ? INITIAL_DATA : (typeof window !== 'undefined' ? window.INITIAL_DATA : null);
    const cloned = initData ? JSON.parse(JSON.stringify(initData)) : {};
    cloned.items = [];
    cloned.storeItemMappings = [];
    cloned.customers = [];
    cloned.vehicles = [];
    cloned.jobCards = [];
    cloned.billingEstimates = [];
    cloned.draftBills = [];
    cloned.finalBills = [];
    cloned.vehicleDeliveries = [];
    cloned.creditNotes = [];
    cloned.paymentReceipts = [];
    cloned.jobCardParts = [];
    this.saveData(cloned);
    return cloned;
  }

  saveData(data = this.data) {
    try {
      if (data && data.plants) {
        data.facilities = data.plants;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist database state:', e);
    }
  }

  clearAllCustomerWorkshopData() {
    if (!this.data) this.data = {};
    this.data.jobCards = [];
    this.data.billingEstimates = [];
    if (this.data.estimates) this.data.estimates = [];
    this.data.draftBills = [];
    this.data.finalBills = [];
    this.data.vehicleDeliveries = [];
    if (this.data.deliveryPasses) this.data.deliveryPasses = [];
    this.data.customers = [];
    this.data.vehicles = [];
    this.data.creditNotes = [];
    this.data.paymentReceipts = [];
    if (this.data.payments) this.data.payments = [];
    this.data.jobCardParts = [];
    if (this.data.warrantyClaims) this.data.warrantyClaims = [];
    delete this.data.customer_masters;
    this.data._workshop_all_customers_purged_v11 = true;
    this.saveData();
    console.log('[DatabaseLayer] All customer records, job cards, estimates, draft bills, final bills, deliveries cleared.');
  }

  resetToDefaults() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData();
    this.emitChange('*');
    return true;
  }

  subscribe(collection, callback) {
    if (!this.listeners.has(collection)) {
      this.listeners.set(collection, new Set());
    }
    this.listeners.get(collection).add(callback);
    return () => {
      this.listeners.get(collection).delete(callback);
    };
  }

  _resolveCollection(collection) {
    if (collection === 'facilities' || collection === 'branches') {
      return 'plants';
    }
    return collection;
  }

  emitChange(collection) {
    const coll = this._resolveCollection(collection);
    if (this.listeners.has(coll)) {
      this.listeners.get(coll).forEach(cb => cb(this.data[coll]));
    }
    if (coll === 'plants') {
      if (this.listeners.has('facilities')) {
        this.listeners.get('facilities').forEach(cb => cb(this.data.plants));
      }
      if (this.listeners.has('branches')) {
        this.listeners.get('branches').forEach(cb => cb(this.data.plants));
      }
    }
    if (this.listeners.has('*')) {
      if (coll !== 'userFavouriteVehicles' && coll !== 'userPinnedSubmodules') {
        this.listeners.get('*').forEach(cb => cb(coll, this.data[coll]));
      }
    }
  }

  getAll(collection, facilityFilter) {
    const coll = this._resolveCollection(collection);
    const list = this.data[coll] || [];
    if (coll === 'items' && facilityFilter && facilityFilter !== 'ALL') {
      const fId = typeof facilityFilter === 'object' ? facilityFilter.facilityId : facilityFilter;
      if (fId && fId !== 'ALL') {
        return list.filter(item => this.isItemMappedToFacility(item, fId));
      }
    }
    return list;
  }

  isItemMappedToFacility(item, facilityId) {
    if (!item) return false;
    if (!facilityId || facilityId === 'ALL') return true;

    const mapped = Array.isArray(item.facility_ids)
      ? item.facility_ids
      : (item.facility_id ? [item.facility_id] : []);

    if (mapped.length === 0) {
      return false;
    }

    return mapped.includes('ALL') || mapped.includes(facilityId);
  }

  getItemsForFacility(facilityId) {
    const all = this.getAll('items');
    if (!facilityId || facilityId === 'ALL') return all;
    return all.filter(item => this.isItemMappedToFacility(item, facilityId));
  }

  getById(collection, id) {
    if (!id) return null;
    const coll = this._resolveCollection(collection);
    const list = this.getAll(coll);
    const target = String(id).trim().toLowerCase();
    return list.find(item => 
      (item.id && String(item.id).toLowerCase() === target) || 
      (item.code && String(item.code).toLowerCase() === target) ||
      (coll === 'users' && item.username && String(item.username).toLowerCase() === target)
    ) || null;
  }

  isOrgActive(orgId) {
    if (!orgId || orgId === 'ALL') return true;
    const org = this.getById('organizations', orgId);
    if (!org) return true;
    return org.status === 'Active' && org.is_active !== false;
  }

  isPlantActive(plantId, checkOrg = true) {
    if (!plantId || plantId === 'ALL') return true;
    const plant = this.getById('plants', plantId);
    if (!plant) {
      const allPlants = this.getAll('plants');
      if (allPlants && allPlants.length > 0) return false;
      return true;
    }
    if (plant.is_active === false || plant.status === 'Inactive' || plant.status === 'INACTIVE' || (plant.status && String(plant.status).toLowerCase() === 'inactive')) return false;
    if (checkOrg && plant.organization_id) {
      if (!this.isOrgActive(plant.organization_id)) return false;
    }
    return true;
  }

  isWarehouseActive(whId) {
    if (!whId || whId === 'ALL') return true;
    const wh = this.getById('warehouses', whId);
    if (!wh) return true;
    if (wh.is_active === false || wh.status === 'Inactive') return false;
    if (wh.plant_id) {
      return this.isPlantActive(wh.plant_id, true);
    }
    return true;
  }

  getActiveOrganizations() {
    const orgs = this.getAll('organizations') || [];
    return orgs.filter(o => o.status === 'Active' && o.is_active !== false);
  }

  getActivePlants() {
    const plants = this.getAll('plants') || [];
    return plants.filter(p => this.isPlantActive(p.id, true));
  }

  getActiveFacilities() {
    return this.getActivePlants();
  }

  getTodayDateStr(dateObj = new Date()) {
    const d = (dateObj instanceof Date && !isNaN(dateObj.getTime())) ? dateObj : new Date(dateObj || Date.now());
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  isFacilityActive(facilityId, checkOrg = true) {
    return this.isPlantActive(facilityId, checkOrg);
  }

  getActiveWarehouses(plantId, userOrId) {
    const warehouses = this.getAll('warehouses') || [];
    const currentUser = (window.State && typeof window.State.getCurrentUser === 'function') ? window.State.getCurrentUser() : null;
    const targetUser = (userOrId && typeof userOrId === 'object')
      ? userOrId
      : (userOrId ? this.getById('users', userOrId) : currentUser);

    return warehouses.filter(w => {
      if (plantId && plantId !== 'ALL' && w.plant_id !== plantId && (!Array.isArray(w.facility_ids) || !w.facility_ids.includes(plantId))) return false;
      if (!this.isWarehouseActive(w.id)) return false;
      if (targetUser && window.State && typeof window.State.canAccessWarehouse === 'function') {
        if (!window.State.canAccessWarehouse(w.id, targetUser)) return false;
      }
      return true;
    });
  }

  // =========================================================================
  // REGISTRATION CONFIGURATION MASTER (BRD Facility-wise Controls)
  // =========================================================================
  getRegistrationConfig(facilityId) {
    if (!this.data.registration_configurations) {
      this.data.registration_configurations = [];
    }
    const fId = facilityId || 'PLANT-01';
    let cfg = this.data.registration_configurations.find(c => c.facility_id === fId);
    if (!cfg) {
      cfg = this.buildDefaultRegistrationConfig(fId);
      this.data.registration_configurations.push(cfg);
      this.saveData();
    }
    return JSON.parse(JSON.stringify(cfg));
  }

  buildDefaultRegistrationConfig(facilityId) {
    const isMauli2 = facilityId === 'PLANT-02';
    return {
      id: `REG-CFG-${facilityId || 'DEFAULT'}`,
      facility_id: facilityId || 'PLANT-01',
      customer_fields: [
        { field_key: 'customer_name', label: 'Customer Full Name', description: 'Primary vehicle owner / customer name', applicable: true, mandatory: true, default_mandatory: true, group: 'CUSTOMER' },
        { field_key: 'mobile_number', label: 'Mobile Number', description: 'Primary 10-digit customer mobile number for SMS/updates', applicable: true, mandatory: isMauli2 ? false : true, default_mandatory: true, group: 'CUSTOMER' },
        { field_key: 'alt_mobile_number', label: 'Alternate Mobile Number', description: 'Secondary contact number for emergency communication', applicable: true, mandatory: false, default_mandatory: false, group: 'CUSTOMER' },
        { field_key: 'email', label: 'Email ID', description: 'Customer email address for estimates & GST invoices', applicable: true, mandatory: false, default_mandatory: false, group: 'CUSTOMER' },
        { field_key: 'address', label: 'Address / Street', description: 'Residential or garage billing street address', applicable: true, mandatory: false, default_mandatory: false, group: 'CUSTOMER' },
        { field_key: 'city', label: 'City', description: 'Residence or billing city', applicable: true, mandatory: false, default_mandatory: false, group: 'CUSTOMER' },
        { field_key: 'district', label: 'District', description: 'Administrative district', applicable: true, mandatory: false, default_mandatory: false, group: 'CUSTOMER' },
        { field_key: 'state', label: 'State', description: 'State for intra/inter-state taxation determination', applicable: true, mandatory: false, default_mandatory: false, group: 'CUSTOMER' },
        { field_key: 'pincode', label: 'Pin Code', description: 'Postal area PIN code', applicable: true, mandatory: false, default_mandatory: false, group: 'CUSTOMER' },
        { field_key: 'customer_type', label: 'Customer Type', description: 'Customer classification (Individual Retail, Corporate, Fleet)', applicable: true, mandatory: false, default_mandatory: false, group: 'CUSTOMER' },
        { field_key: 'gstin', label: 'GSTIN / Tax ID', description: '15-character GST identification number for B2B billing', applicable: false, mandatory: false, default_mandatory: false, group: 'CUSTOMER' }
      ],
      vehicle_fields: [
        { field_key: 'vehicle_reg_no', label: 'Vehicle Registration No', description: 'Standard Indian motor vehicle license plate number (e.g. MH 12 AB 1234)', applicable: true, mandatory: true, default_mandatory: true, group: 'VEHICLE' },
        { field_key: 'vehicle_model', label: 'Vehicle Make & Model', description: 'Two-wheeler model from Vehicle Compatibility Master', applicable: true, mandatory: true, default_mandatory: true, group: 'VEHICLE' },
        { field_key: 'odometer_km', label: 'Odometer Reading (KM)', description: 'Current odometer mileage recorded at vehicle intake', applicable: true, mandatory: true, default_mandatory: true, group: 'VEHICLE' },
        { field_key: 'fuel_level', label: 'Fuel Level', description: 'Fuel gauge level at intake (25%, 50%, 75%, 100%, Empty)', applicable: true, mandatory: false, default_mandatory: false, group: 'VEHICLE' },
        { field_key: 'mfg_year', label: 'Manufacturing Year', description: 'Vehicle model year of manufacture', applicable: true, mandatory: false, default_mandatory: false, group: 'VEHICLE' },
        { field_key: 'chassis_no', label: 'Chassis / VIN Number', description: '17-character vehicle identification number stamped on frame', applicable: true, mandatory: false, default_mandatory: false, group: 'VEHICLE' },
        { field_key: 'engine_no', label: 'Engine Number', description: 'Unique engine block serial number', applicable: false, mandatory: false, default_mandatory: false, group: 'VEHICLE' },
        { field_key: 'color', label: 'Vehicle Color', description: 'Factory exterior body color', applicable: true, mandatory: false, default_mandatory: false, group: 'VEHICLE' },
        { field_key: 'insurance_company', label: 'Insurance Provider', description: 'Automobile insurance underwriting company', applicable: true, mandatory: false, default_mandatory: false, group: 'VEHICLE' },
        { field_key: 'insurance_policy_no', label: 'Insurance Policy Number', description: 'Active comprehensive or third-party policy number', applicable: true, mandatory: false, default_mandatory: false, group: 'VEHICLE' },
        { field_key: 'insurance_expiry', label: 'Insurance Expiry Date', description: 'Policy expiration date for renewal reminders', applicable: true, mandatory: false, default_mandatory: false, group: 'VEHICLE' }
      ],
      business_rules: {
        allow_duplicate_active_registration: false, // Prevent duplicate active registrations within org
        allow_unregistered_vehicles: true,           // Do not make standard registration format mandatory for unregistered vehicles
        supported_formats: ['STANDARD', 'BH_SERIES', 'TEMPORARY', 'UNREGISTERED'],
        enforce_format_validation: true,
        duplicate_scope: 'ORGANIZATION'              // ORGANIZATION | FACILITY
      },
      updated_at: new Date().toISOString(),
      updated_by: 'System Administrator'
    };
  }

  saveRegistrationConfig(facilityId, config) {
    if (!this.data.registration_configurations) {
      this.data.registration_configurations = [];
    }
    const fId = facilityId || 'PLANT-01';
    const index = this.data.registration_configurations.findIndex(c => c.facility_id === fId);
    const updated = {
      ...config,
      facility_id: fId,
      id: config.id || `REG-CFG-${fId}`,
      updated_at: new Date().toISOString(),
      updated_by: (window.State && window.State.getCurrentUser && window.State.getCurrentUser()?.full_name) || 'Administrator'
    };

    if (index !== -1) {
      this.data.registration_configurations[index] = updated;
    } else {
      this.data.registration_configurations.push(updated);
    }
    this.saveData();
    this.emitChange('registration_configurations');
    return updated;
  }

  resetRegistrationConfig(facilityId) {
    const fId = facilityId || 'PLANT-01';
    const fresh = this.buildDefaultRegistrationConfig(fId);
    return this.saveRegistrationConfig(fId, fresh);
  }

  copyRegistrationConfig(fromFacilityId, targetFacilityIds) {
    const source = this.getRegistrationConfig(fromFacilityId);
    const targets = Array.isArray(targetFacilityIds) ? targetFacilityIds : [targetFacilityIds];
    const results = [];
    targets.forEach(tId => {
      if (tId && tId !== fromFacilityId) {
        const copy = JSON.parse(JSON.stringify(source));
        copy.facility_id = tId;
        copy.id = `REG-CFG-${tId}`;
        results.push(this.saveRegistrationConfig(tId, copy));
      }
    });
    return results;
  }

  // =========================================================================
  // VEHICLE REGISTRATION VALIDATION, NORMALIZATION & BUSINESS RULES
  // =========================================================================

  normalizeVehicleReg(val) {
    if (!val) return '';
    return String(val).toUpperCase().replace(/[\s\-_.]/g, '');
  }

  formatVehicleRegDisplay(val, regType) {
    if (!val) return '';
    const clean = this.normalizeVehicleReg(val);
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

    return val.trim();
  }

  detectVehicleRegType(val) {
    const clean = this.normalizeVehicleReg(val);
    if (!clean) return 'UNREGISTERED';
    if (clean.startsWith('UNREG') || clean === 'APPLIEDFOR' || clean === 'NEW' || clean.startsWith('CHASSIS')) {
      return 'UNREGISTERED';
    }
    if (/^\d{2}BH\d{1,4}[A-Z]{1,2}$/.test(clean)) {
      return 'BH_SERIES';
    }
    if (/^[A-Z]{2}\d{1,2}(?:TR|TEMP|T)\d{1,6}$/.test(clean) || /^(?:TR|CR|TEMP)\d{1,8}$/.test(clean)) {
      return 'TEMPORARY';
    }
    if (/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/.test(clean)) {
      return 'STANDARD';
    }
    return 'CUSTOM';
  }

  checkDuplicateActiveVehicle(rawRegNo, options = {}) {
    const clean = this.normalizeVehicleReg(rawRegNo);
    if (!clean) return { isDuplicate: false };

    // Do not check duplicates for generic unregistered tokens
    if (clean === 'UNREG' || clean === 'APPLIEDFOR' || clean === 'NEW') {
      return { isDuplicate: false };
    }

    const facilityId = options.facilityId || 'PLANT-01';
    const cfg = this.getRegistrationConfig(facilityId);
    const rules = cfg.business_rules || {};

    // If duplicate active registration exception is configured, allow it
    if (rules.allow_duplicate_active_registration === true) {
      return { isDuplicate: false, allowedByException: true };
    }

    const excludeVehicleId = options.excludeVehicleId || null;
    const organizationId = options.organizationId || null;

    const vehicles = this.getAll('vehicles') || [];
    const matchedVehicle = vehicles.find(v => {
      if (excludeVehicleId && (v.id === excludeVehicleId || v.vehicle_id === excludeVehicleId)) {
        return false;
      }
      const vClean = this.normalizeVehicleReg(v.vehicle_reg_no);
      if (vClean !== clean) return false;

      // Active status check
      const isActive = v.status === 'ACTIVE' || !v.status;
      if (!isActive) return false;

      // Organization / Facility scope check
      if (rules.duplicate_scope === 'FACILITY') {
        return v.plant_id === facilityId;
      }
      // Default: Organization-wide
      if (organizationId && v.organization_id && v.organization_id !== organizationId) {
        return false;
      }
      return true;
    });

    if (matchedVehicle) {
      return {
        isDuplicate: true,
        vehicle: matchedVehicle,
        message: `Active vehicle with registration [${matchedVehicle.vehicle_reg_no_display || matchedVehicle.vehicle_reg_no}] already exists in this organization (Vehicle ID: ${matchedVehicle.vehicle_id || matchedVehicle.id}, Owner: ${matchedVehicle.customer_name || 'Customer'}). Duplicate active registrations are prohibited.`
      };
    }

    return { isDuplicate: false };
  }

  updateVehicleRegistration(vehicleId, newRawRegNo, options = {}) {
    const vehicles = this.getAll('vehicles') || [];
    const vehicle = vehicles.find(v => v.id === vehicleId || v.vehicle_id === vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle ${vehicleId} not found`);
    }

    const cleanNew = this.normalizeVehicleReg(newRawRegNo);
    const cleanOld = this.normalizeVehicleReg(vehicle.vehicle_reg_no);

    if (cleanNew === cleanOld) {
      return vehicle; // No change
    }

    // Check duplicate
    const dupCheck = this.checkDuplicateActiveVehicle(cleanNew, {
      facilityId: vehicle.plant_id,
      organizationId: vehicle.organization_id,
      excludeVehicleId: vehicle.vehicle_id || vehicle.id
    });
    if (dupCheck.isDuplicate) {
      throw new Error(dupCheck.message);
    }

    const displayNew = this.formatVehicleRegDisplay(cleanNew, options.regType || this.detectVehicleRegType(cleanNew));
    const currentUser = (typeof window !== 'undefined' && window.State && window.State.currentUser)
      ? window.State.currentUser
      : { id: 'USR-001', name: 'Authorized Administrator' };

    const historyEntry = {
      previous_reg: vehicle.vehicle_reg_no,
      previous_reg_display: vehicle.vehicle_reg_no_display || vehicle.vehicle_reg_no,
      new_reg: cleanNew,
      new_reg_display: displayNew,
      change_date: options.changeDate || new Date().toISOString(),
      authorized_user: options.authorizedUser || currentUser.name || currentUser.full_name || 'Authorized User',
      user_id: options.userId || currentUser.id || 'USR-001',
      reason: options.reason || 'Registration number updated'
    };

    if (!Array.isArray(vehicle.registration_history)) {
      vehicle.registration_history = [];
    }
    vehicle.registration_history.unshift(historyEntry);
    vehicle.vehicle_reg_no = cleanNew;
    vehicle.vehicle_reg_no_display = displayNew;
    vehicle.updated_at = new Date().toISOString();

    this.saveData();
    this.emitChange('vehicles');
    return vehicle;
  }

  getOrCreateVehicle(vehData) {
    if (!vehData) return null;
    const cleanReg = this.normalizeVehicleReg(vehData.vehicle_reg_no);
    const vehicles = this.getAll('vehicles') || [];
    
    // Match by existing vehicle_id, or normalized reg (if registered), or chassis
    let vehicle = null;
    if (vehData.vehicle_id) {
      vehicle = vehicles.find(v => v.id === vehData.vehicle_id || v.vehicle_id === vehData.vehicle_id);
    }
    if (!vehicle && cleanReg && !vehData.is_unregistered) {
      vehicle = vehicles.find(v => this.normalizeVehicleReg(v.vehicle_reg_no) === cleanReg && (v.status === 'ACTIVE' || !v.status));
    }
    if (!vehicle && vehData.chassis_no) {
      vehicle = vehicles.find(v => v.chassis_no && v.chassis_no.toUpperCase() === vehData.chassis_no.toUpperCase());
    }

    if (vehicle) {
      if (vehData.customer_name) vehicle.customer_name = vehData.customer_name;
      if (vehData.customer_mobile) vehicle.customer_mobile = vehData.customer_mobile;
      if (vehData.odometer_km) vehicle.odometer_km = vehData.odometer_km;
      this.saveData();
      return vehicle;
    }

    // Create brand new vehicle entity with separate unique internal Vehicle ID
    const nextVehIndex = vehicles.length + 1;
    const branchPrefix = (vehData.plant_id || 'PUN').replace(/[^A-Z0-9]/g, '').slice(-3) || 'PUN';
    const newVehicleId = `VEH-${branchPrefix}-${nextVehIndex.toString().padStart(3, '0')}`;
    const displayReg = this.formatVehicleRegDisplay(cleanReg || vehData.vehicle_reg_no, vehData.reg_type);

    const newVehicle = {
      id: newVehicleId,
      vehicle_id: newVehicleId, // Separate unique internal vehicle ID!
      vehicle_reg_no: cleanReg || newVehicleId, // Standardized stored format
      vehicle_reg_no_display: displayReg || (vehData.is_unregistered ? 'UNREGISTERED' : newVehicleId),
      reg_type: vehData.reg_type || this.detectVehicleRegType(cleanReg),
      is_unregistered: !!vehData.is_unregistered,
      status: 'ACTIVE',
      plant_id: vehData.plant_id || 'PLANT-01',
      organization_id: vehData.organization_id || 'ORG-01',
      customer_id: vehData.customer_id || '',
      customer_name: vehData.customer_name || '',
      customer_mobile: vehData.customer_mobile || '',
      model_id: vehData.model_id || vehData.vehicle_model_id || '',
      model_name: vehData.model_name || vehData.vehicle_model || '',
      model_variant: vehData.model_variant || '',
      odometer_km: Number(vehData.odometer_km) || 0,
      fuel_level: vehData.fuel_level || '50%',
      mfg_year: vehData.mfg_year || '',
      chassis_no: vehData.chassis_no || '',
      engine_no: vehData.engine_no || '',
      color: vehData.color || '',
      insurance_company: vehData.insurance_company || '',
      insurance_policy_no: vehData.insurance_policy_no || '',
      registration_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    vehicles.push(newVehicle);
    this.saveData();
    this.emitChange('vehicles');
    return newVehicle;
  }

  upsert(collection, item) {
    if (!item) return null;
    collection = this._resolveCollection(collection);
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const list = this.data[collection];
    const targetId = item.id ? String(item.id).toLowerCase() : '';
    const targetCode = item.code ? String(item.code).toLowerCase() : '';
    const targetUser = item.username ? String(item.username).toLowerCase() : '';
    const targetVehReg = (collection === 'vehicles' && (item.vehicle_reg_no || item.reg_no))
      ? String(item.vehicle_reg_no || item.reg_no).replace(/[\s-]/g, '').toUpperCase()
      : '';
    const targetCustCin = (collection === 'customers' && (item.cin_number || item.cin))
      ? String(item.cin_number || item.cin).trim()
      : '';

    const index = list.findIndex(i => 
      (targetId && i.id && String(i.id).toLowerCase() === targetId) ||
      (targetCode && i.code && String(i.code).toLowerCase() === targetCode) ||
      (collection === 'users' && targetUser && i.username && String(i.username).toLowerCase() === targetUser) ||
      (targetVehReg && collection === 'vehicles' && String(i.vehicle_reg_no || i.reg_no || '').replace(/[\s-]/g, '').toUpperCase() === targetVehReg) ||
      (targetCustCin && collection === 'customers' && (i.cin_number === targetCustCin || i.cin === targetCustCin))
    );

    if (index !== -1) {
      this.data[collection][index] = {
        ...this.data[collection][index],
        ...item,
        updated_at: new Date().toISOString()
      };
      this.saveData();
      this.emitChange(collection);
      if (collection === 'organizations') {
        this.emitChange('plants');
        this.emitChange('warehouses');
      }
      return this.data[collection][index];
    } else {
      return this.insert(collection, item);
    }
  }

  insert(collection, item) {
    collection = this._resolveCollection(collection);
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    if (!item.id) {
      item.id = `${collection.toUpperCase().slice(0, 3)}-${Date.now().toString(36)}`;
    }
    if (!item.created_at) {
      item.created_at = new Date().toISOString();
    }
    this.data[collection].unshift(item);
    this.saveData();
    this.emitChange(collection);
    if (collection === 'organizations') {
      this.emitChange('plants');
      this.emitChange('warehouses');
    }
    if (collection === 'users') {
      this.removeDeletedUserId(item.id);
      this.syncUserToBackend(item, 'POST');
      if (this.data.employees && Array.isArray(this.data.employees)) {
        const empId = item.employee_id || item.id;
        const existingEmpIdx = this.data.employees.findIndex(e => e.id === empId || e.id === item.id);
        const empRecord = {
          id: empId,
          code: empId,
          first_name: item.first_name || '',
          middle_name: item.middle_name || '',
          last_name: item.last_name || '',
          full_name: item.full_name || item.display_name || item.username,
          display_name: item.display_name || item.full_name || item.username,
          user_type: item.user_type || 'Employee',
          designation: item.designation || '',
          department: item.department || '',
          specialty: item.specialty || '',
          mobile_number: (item.mobile_number || item.phone || '').replace(/\D/g, '').slice(-10),
          email: item.email || ''
        };
        if (existingEmpIdx === -1) {
          this.data.employees.unshift(empRecord);
        } else {
          this.data.employees[existingEmpIdx] = empRecord;
        }
      }
    } else if (collection === 'plants') {
      this.syncPlantToBackend(item, 'POST');
    } else if (collection === 'organizations') {
      this.syncOrganizationToBackend(item, 'POST');
    } else if (collection === 'warehouses' || collection === 'stores') {
      this.syncWarehouseToBackend(item, 'POST');
    }
    return item;
  }

  update(collection, id, updates) {
    collection = this._resolveCollection(collection);
    const list = this.getAll(collection);
    const index = list.findIndex(item => item.id === id || item.code === id);
    if (index !== -1) {
      this.data[collection][index] = {
        ...this.data[collection][index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.saveData();
      this.emitChange(collection);
      if (collection === 'organizations') {
        this.emitChange('plants');
        this.emitChange('warehouses');
      }
      if (collection === 'users') {
        this.syncUserToBackend(this.data[collection][index], 'PUT');
        if (this.data.employees && Array.isArray(this.data.employees)) {
          const u = this.data.users[index];
          const empId = u.employee_id || u.id;
          const empIdx = this.data.employees.findIndex(e => e.id === empId || e.id === u.id);
          if (empIdx !== -1) {
            this.data.employees[empIdx] = {
              ...this.data.employees[empIdx],
              id: empId,
              code: empId,
              first_name: u.first_name || this.data.employees[empIdx].first_name,
              middle_name: u.middle_name || this.data.employees[empIdx].middle_name,
              last_name: u.last_name || this.data.employees[empIdx].last_name,
              full_name: u.full_name || u.display_name || this.data.employees[empIdx].full_name,
              display_name: u.display_name || u.full_name || this.data.employees[empIdx].display_name,
              user_type: u.user_type || this.data.employees[empIdx].user_type,
              designation: u.designation || this.data.employees[empIdx].designation,
              department: u.department || this.data.employees[empIdx].department,
              specialty: u.specialty || this.data.employees[empIdx].specialty,
              mobile_number: (u.mobile_number || u.phone || '').replace(/\D/g, '').slice(-10) || this.data.employees[empIdx].mobile_number,
              email: u.email || this.data.employees[empIdx].email
            };
          }
        }
      } else if (collection === 'plants') {
        this.syncPlantToBackend(this.data[collection][index], 'PUT');
      } else if (collection === 'organizations') {
        this.syncOrganizationToBackend(this.data[collection][index], 'PUT');
      } else if (collection === 'warehouses' || collection === 'stores') {
        this.syncWarehouseToBackend(this.data[collection][index], 'PUT');
      }
      return this.data[collection][index];
    }
    return null;
  }

  delete(collection, id) {
    collection = this._resolveCollection(collection);
    if (!this.data[collection]) return false;
    const target = String(id).trim().toLowerCase();

    if (collection === 'organizations') {
      const allPlants = this.getAll('plants') || [];
      const hasLinkedPlants = allPlants.some(p => 
        (p.organization_id && (String(p.organization_id).toLowerCase() === target || p.organization_id === id)) ||
        (p.company_id && (String(p.company_id).toLowerCase() === target || p.company_id === id))
      );
      if (hasLinkedPlants) {
        console.warn(`[DB Integrity] Cannot delete organization ${id}: facilities are currently created under it.`);
        return false;
      }
    }

    if (collection === 'plants') {
      const allStores = this.getAll('warehouses') || [];
      const hasLinkedStores = allStores.some(s => 
        (s.plant_id && (String(s.plant_id).toLowerCase() === target || s.plant_id === id)) ||
        (s.facility_id && (String(s.facility_id).toLowerCase() === target || s.facility_id === id))
      );
      if (hasLinkedStores) {
        console.warn(`[DB Integrity] Cannot delete facility ${id}: stores are currently created under it.`);
        return false;
      }
    }

    const initialLen = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(item => 
      !(item.id && String(item.id).toLowerCase() === target) &&
      !(item.code && String(item.code).toLowerCase() === target)
    );
    if (this.data[collection].length !== initialLen) {
      this.saveData();
      this.emitChange(collection);
      if (collection === 'organizations') {
        this.emitChange('plants');
        this.emitChange('warehouses');
        this.syncOrganizationToBackend({ id }, 'DELETE');
      }
      if (collection === 'plants') {
        this.emitChange('warehouses');
        this.syncPlantToBackend({ id }, 'DELETE');
      }
      if (collection === 'warehouses' || collection === 'stores') {
        this.syncWarehouseToBackend({ id }, 'DELETE');
      }
      if (collection === 'users') {
        this.addDeletedUserId(id);
        this.syncUserToBackend({ id }, 'DELETE');
      }
      return true;
    }
    return false;
  }

  remove(collection, id) {
    return this.delete(collection, id);
  }

  clear(collection) {
    collection = this._resolveCollection(collection);
    if (collection === 'organizations') {
      const allPlants = this.getAll('plants') || [];
      const hasLinkedPlants = allPlants.some(p => p.organization_id || p.company_id);
      if (hasLinkedPlants) {
        console.warn('[DB Integrity] Cannot clear organizations: active facilities exist under organizations.');
        return false;
      }
    }
    if (collection === 'plants') {
      const allStores = this.getAll('warehouses') || [];
      const hasLinkedStores = allStores.some(s => s.plant_id || s.facility_id);
      if (hasLinkedStores) {
        console.warn('[DB Integrity] Cannot clear facilities: stores exist under facilities.');
        return false;
      }
    }
    this.data[collection] = [];
    this.saveData();
    this.emitChange(collection);
    if (collection === 'organizations') {
      this.emitChange('plants');
      this.emitChange('warehouses');
    }
    if (collection === 'plants') {
      this.emitChange('warehouses');
    }
    return true;
  }

  async syncPlantToBackend(plant, method = 'PUT') {
    if (!plant || !plant.id || typeof fetch !== 'function') return false;
    try {
      const endpoint = method === 'POST' ? '/api/plants' : `/api/plants/${encodeURIComponent(plant.id)}`;
      const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (method !== 'DELETE') {
        options.body = JSON.stringify(plant);
      }
      const res = await fetch(endpoint, options);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log(`[DB] Successfully synced branch/plant ${plant.id} to PostgreSQL backend (${method}).`);
        return data;
      }
    } catch (err) {
      console.warn(`[DB] Backend sync deferred for plant ${plant.id}:`, err.message);
    }
    return false;
  }

  async syncPlantsFromBackend() {
    if (typeof fetch !== 'function') return false;
    try {
      const res = await fetch('/api/plants');
      if (res.ok) {
        const remotePlants = await res.json();
        if (Array.isArray(remotePlants)) {
          if (!this.data.plants) this.data.plants = [];

          if (remotePlants.length === 0) {
            if (this.data.plants && this.data.plants.length > 0) {
              this.data.plants.forEach(lp => {
                this.syncPlantToBackend(lp, 'POST');
              });
              return true;
            }
          }

          if (remotePlants.length > 0) {
            const isTargetPlant = (p) => {
              if (!p) return false;
              const pcode = String(p.code || '').toUpperCase();
              const pname = String(p.name || '').toLowerCase();
              return pcode === 'BRANCH-CHE-02' || pcode === 'BRANCH-WAKAD-01' ||
                     pname.includes('chennai sriperumbudur') || pname.includes('apex two-wheeler wakad');
            };
            const cleanRemotePlants = remotePlants.filter(p => !isTargetPlant(p));
            const origLocalLen = this.data.plants.length;
            this.data.plants = this.data.plants.filter(p => !isTargetPlant(p));
            let changed = this.data.plants.length !== origLocalLen;

            cleanRemotePlants.forEach(rp => {
              const idx = this.data.plants.findIndex(lp => lp.id === rp.id || (rp.code && lp.code === rp.code));
              const computedBranchCode = rp.branch_code || (rp.code ? rp.code.replace('BRANCH-', '').substring(0, 4) : (rp.city || 'PUN').substring(0, 3)).toUpperCase();
              if (idx !== -1) {
                const current = this.data.plants[idx];
                if (current.name !== rp.name || current.code !== rp.code || current.branch_code !== computedBranchCode || current.is_active !== rp.is_active || current.city !== rp.city || current.address !== rp.address || current.mobile_number !== rp.mobile_number || current.pincode !== rp.pincode || current.gstin !== rp.gstin || current.state !== rp.state) {
                  this.data.plants[idx] = {
                    ...current,
                    ...rp,
                    branch_code: computedBranchCode
                  };
                  changed = true;
                }
              } else {
                this.data.plants.push({
                  ...rp,
                  branch_code: computedBranchCode
                });
                changed = true;
              }
            });

            if (changed) {
              this.saveData();
              this.emitChange('plants');
              console.log(`[DB] Successfully merged ${remotePlants.length} branches/plants from PostgreSQL backend.`);
            }
            return true;
          }
        }
      }
    } catch (err) {
      console.warn('[DB] syncPlantsFromBackend deferred:', err.message);
    }
    return false;
  }

  async syncPlantToBackend(plant, method = 'PUT') {
    if (!plant || !plant.id || typeof fetch !== 'function') return false;
    try {
      const endpoint = method === 'POST' ? '/api/plants' : `/api/plants/${encodeURIComponent(plant.id)}`;
      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plant)
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[DB] Successfully synced branch/plant ${plant.id} (${plant.name}) to PostgreSQL backend (${method}).`);
        return data;
      }
    } catch (err) {
      console.warn(`[DB] Backend sync deferred for plant ${plant.id}:`, err.message);
    }
    return false;
  }

  async updatePlant(id, updates) {
    const updated = this.update('plants', id, updates);
    if (updated) {
      try {
        await this.syncPlantToBackend(updated, 'PUT');
      } catch (_) {}
    }
    return updated;
  }

  async updateFacility(id, updates) {
    return this.updatePlant(id, updates);
  }

  async syncFacilityToBackend(facility, method = 'PUT') {
    return this.syncPlantToBackend(facility, method);
  }

  async syncFacilitiesFromBackend() {
    return this.syncPlantsFromBackend();
  }

  async syncWarehousesFromBackend() {
    if (typeof fetch !== 'function') return false;
    try {
      const res = await fetch('/api/warehouses');
      if (res.ok) {
        const remoteWarehouses = await res.json();
        if (Array.isArray(remoteWarehouses)) {
          if (!this.data.warehouses) this.data.warehouses = [];

          if (remoteWarehouses.length === 0) {
            if (this.data.warehouses && this.data.warehouses.length > 0) {
              this.data.warehouses.forEach(lw => {
                this.syncWarehouseToBackend(lw, 'POST');
              });
              return true;
            }
          }

          if (remoteWarehouses.length > 0) {
            let changed = false;
            remoteWarehouses.forEach(rw => {
              const idx = this.data.warehouses.findIndex(lw => lw.id === rw.id || (rw.code && lw.code === rw.code));
              let facIds = rw.facility_ids;
              if (typeof facIds === 'string') {
                try { facIds = JSON.parse(facIds); } catch (_) { facIds = rw.plant_id ? [rw.plant_id] : []; }
              }
              const normalized = {
                ...rw,
                facility_ids: Array.isArray(facIds) ? facIds : (rw.plant_id ? [rw.plant_id] : []),
                plant_id: rw.plant_id || (Array.isArray(facIds) ? facIds[0] : 'PLANT-01'),
                store_type: rw.store_type || (rw.warehouse_type === 'MAIN_STORE' ? 'Main Store' : 'Sub Store'),
                status: rw.status || (rw.is_active !== false ? 'Active' : 'Inactive')
              };
              if (idx !== -1) {
                const current = this.data.warehouses[idx];
                if (current.name !== normalized.name || current.code !== normalized.code || current.status !== normalized.status || current.plant_id !== normalized.plant_id) {
                  this.data.warehouses[idx] = { ...current, ...normalized };
                  changed = true;
                }
              } else {
                this.data.warehouses.push(normalized);
                changed = true;
              }
            });

            this.data.warehouses.forEach(lw => {
              if (!remoteWarehouses.some(rw => rw.id === lw.id || (lw.code && rw.code === lw.code))) {
                this.syncWarehouseToBackend(lw, 'POST');
              }
            });

            if (changed) {
              this.saveData();
              this.emitChange('warehouses');
              console.log(`[DB] Successfully merged ${remoteWarehouses.length} warehouses/stores from PostgreSQL backend.`);
            }
            return true;
          }
        }
      }
    } catch (err) {
      console.warn('[DB] syncWarehousesFromBackend deferred:', err.message);
    }
    return false;
  }

  async syncWarehouseToBackend(warehouse, method = 'PUT') {
    if (!warehouse || !warehouse.id || typeof fetch !== 'function') return false;
    try {
      const endpoint = method === 'POST' ? '/api/warehouses' : `/api/warehouses/${encodeURIComponent(warehouse.id)}`;
      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warehouse)
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[DB] Successfully synced warehouse ${warehouse.id} (${warehouse.name}) to backend (${method}).`);
        return data;
      }
    } catch (err) {
      console.warn(`[DB] syncWarehouseToBackend failed for ${warehouse.id}:`, err.message);
    }
    return false;
  }

  async syncOrganizationsFromBackend() {
    if (typeof fetch !== 'function') return false;
    try {
      const res = await fetch('/api/organizations');
      if (res.ok) {
        const remoteOrgs = await res.json();
        if (Array.isArray(remoteOrgs) && remoteOrgs.length > 0) {
          if (!this.data.organizations) this.data.organizations = [];
          let changed = false;
          remoteOrgs.forEach(ro => {
            const idx = this.data.organizations.findIndex(lo => lo.id === ro.id || (ro.code && lo.code === ro.code));
            if (idx !== -1) {
              if (this.data.organizations[idx].name !== ro.name || this.data.organizations[idx].status !== ro.status) {
                this.data.organizations[idx] = { ...this.data.organizations[idx], ...ro };
                changed = true;
              }
            } else {
              this.data.organizations.push(ro);
              changed = true;
            }
          });
          if (changed) {
            this.saveData();
            this.emitChange('organizations');
            console.log(`[DB] Successfully merged ${remoteOrgs.length} organizations from backend.`);
          }
          return true;
        }
      }
    } catch (err) {
      console.warn('[DB] syncOrganizationsFromBackend deferred:', err.message);
    }
    return false;
  }

  async syncOrganizationToBackend(org, method = 'PUT') {
    if (!org || !org.id || typeof fetch !== 'function') return false;
    try {
      const endpoint = method === 'POST' ? '/api/organizations' : `/api/organizations/${encodeURIComponent(org.id)}`;
      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(org)
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[DB] Successfully synced organization ${org.id} (${org.name}) to backend (${method}).`);
        return data;
      }
    } catch (err) {
      console.warn(`[DB] syncOrganizationToBackend failed for ${org.id}:`, err.message);
    }
    return false;
  }

  async syncUserToBackend(user, method = 'PUT') {
    if (!user || !user.id || typeof fetch !== 'function') return false;
    try {
      if (method === 'DELETE') {
        const res = await fetch(`/api/users/${encodeURIComponent(user.id)}`, { method: 'DELETE' });
        return res.ok;
      }
      const endpoint = method === 'POST' ? '/api/users' : `/api/users/${encodeURIComponent(user.id)}`;
      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[DB] Successfully synced user ${user.id} (${user.username}) to PostgreSQL backend (${method}).`);
        return data;
      }
    } catch (err) {
      console.warn(`[DB] Backend sync deferred for user ${user.id}:`, err.message);
    }
    return false;
  }

  async updateUser(id, updates) {
    const updated = this.update('users', id, updates);
    if (updated) {
      try {
        await this.syncUserToBackend(updated, 'PUT');
      } catch (_) {}
    }
    return updated;
  }

  async deleteUser(id) {
    if (!id) return false;
    this.addDeletedUserId(id);
    const user = this.getById('users', id) || { id };

    // 1. Delete from users collection
    this.delete('users', id);

    // 2. Cascade cleanup from all related collections:
    // Employees
    if (Array.isArray(this.data.employees)) {
      this.data.employees = this.data.employees.filter(e => e.user_id !== id && (!user.employee_id || e.id !== user.employee_id));
    }
    // Approval delegations
    if (Array.isArray(this.data.approval_delegations)) {
      this.data.approval_delegations = this.data.approval_delegations.filter(d => d.delegator_user_id !== id && d.delegate_user_id !== id && d.user_id !== id);
    }
    // Approval authorities
    if (Array.isArray(this.data.approval_authorities)) {
      this.data.approval_authorities = this.data.approval_authorities.filter(a => a.user_id !== id);
    }
    // Access requests
    if (Array.isArray(this.data.access_requests)) {
      this.data.access_requests = this.data.access_requests.filter(r => r.user_id !== id && r.requested_for_user_id !== id);
    }
    // User sessions
    if (Array.isArray(this.data.user_sessions)) {
      this.data.user_sessions = this.data.user_sessions.filter(s => s.user_id !== id);
    }
    // User warehouse/facility/plant access scoping
    if (Array.isArray(this.data.user_warehouse_access)) {
      this.data.user_warehouse_access = this.data.user_warehouse_access.filter(a => a.user_id !== id);
    }
    if (Array.isArray(this.data.user_plant_access)) {
      this.data.user_plant_access = this.data.user_plant_access.filter(a => a.user_id !== id);
    }
    if (Array.isArray(this.data.user_facility_access)) {
      this.data.user_facility_access = this.data.user_facility_access.filter(a => a.user_id !== id);
    }
    // User pinned submodules
    if (Array.isArray(this.data.userPinnedSubmodules)) {
      this.data.userPinnedSubmodules = this.data.userPinnedSubmodules.filter(p => p.user_id !== id);
    }
    // Decrement role user_count if applicable
    const roleId = user.primary_role || user.primary_role_id;
    if (roleId && Array.isArray(this.data.roles)) {
      const r = this.data.roles.find(role => role.id === roleId);
      if (r && r.user_count > 0) r.user_count--;
    }

    this.saveData();
    this.emitChange('users');
    this.emitChange('user_warehouse_access');
    this.emitChange('employees');
    this.emitChange('roles');

    // 3. Sync deletion to backend
    if (typeof fetch === 'function') {
      try {
        await fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch (_) {}
    }
    return true;
  }

  async syncUsersFromBackend() {
    if (typeof fetch !== 'function') return false;
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return false;
      let remoteUsers = await res.json();
      if (!Array.isArray(remoteUsers)) return false;

      const deletedIds = this.getDeletedUserIds();
      remoteUsers = remoteUsers.filter(u => u && u.id && !deletedIds.has(u.id));

      const remoteUserIds = new Set(remoteUsers.map(u => u.id));
      let updated = false;
      let localUsers = Array.isArray(this.data.users) ? [...this.data.users] : [];

      if (deletedIds.size > 0) {
        const preLen = localUsers.length;
        localUsers = localUsers.filter(u => u && u.id && !deletedIds.has(u.id));
        if (localUsers.length !== preLen) updated = true;
      }

      // 1. Merge remote users into local users
      remoteUsers.forEach(ru => {
        const localIdx = localUsers.findIndex(lu => lu.id === ru.id);
        const mappedRole = ru.primary_role || ru.primary_role_id;
        if (localIdx !== -1) {
          const local = localUsers[localIdx];
          localUsers[localIdx] = {
            ...local,
            ...ru,
            primary_role: mappedRole || local.primary_role || 'ROLE-OPERATOR',
            employee_id: ru.employee_id || local.employee_id || null
          };
          updated = true;
        } else {
          localUsers.push({
            ...ru,
            primary_role: mappedRole || 'ROLE-OPERATOR'
          });
          updated = true;
        }
      });

      // 2. Ensure locally added users are NEVER lost: sync missing local users to backend (excluding deleted users)
      const missingOnRemote = localUsers.filter(lu => !remoteUserIds.has(lu.id) && !deletedIds.has(lu.id));
      if (missingOnRemote.length > 0) {
        missingOnRemote.forEach(localUser => {
          this.syncUserToBackend(localUser, 'POST').catch(() => {});
        });
      }

      if (updated) {
        this.data.users = localUsers;
        this.saveData();
        this.emitChange('users');
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  async syncRolesFromBackend() {
    if (typeof fetch !== 'function') return false;
    try {
      const res = await fetch('/api/roles');
      if (!res.ok) return false;
      const remoteRoles = await res.json();
      if (!Array.isArray(remoteRoles) || remoteRoles.length === 0) return false;
      
      const remoteIds = new Set(remoteRoles.map(r => r.id));
      let localRoles = (this.data.roles || []).filter(lr => lr.id !== 'ROLE-STORE-EXEC' && (!lr.is_system || remoteIds.has(lr.id)));

      remoteRoles.forEach(rr => {
        if (rr.id === 'ROLE-STORE-EXEC') return;
        const localIdx = localRoles.findIndex(lr => lr.id === rr.id);
        if (localIdx !== -1) {
          localRoles[localIdx] = {
            ...localRoles[localIdx],
            ...rr
          };
        } else {
          localRoles.push(rr);
        }
      });

      this.data.roles = localRoles;
      this.saveData();
      this.emitChange('roles');
      return true;
    } catch (_) {
      return false;
    }
  }

  async syncRoleToBackend(role, method = 'POST') {
    if (!role || !role.id || typeof fetch !== 'function') return false;
    try {
      const url = method === 'DELETE' 
        ? `/api/roles?id=${encodeURIComponent(role.id)}`
        : '/api/roles';
      const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (method !== 'DELETE') {
        options.body = JSON.stringify(role);
      }
      const res = await fetch(url, options);
      if (res.ok) {
        console.log(`[DB] Successfully synced role ${role.id} to PostgreSQL backend (${method}).`);
        return true;
      }
    } catch (err) {
      console.warn(`[DB] Role sync deferred for ${role.id}:`, err.message);
    }
    return false;
  }

  async syncRolePermissionsToBackend(permissions) {
    if (!permissions || typeof fetch !== 'function') return false;
    try {
      const payload = Array.isArray(permissions) ? permissions : [permissions];
      if (payload.length === 0) return true;
      const res = await fetch('/api/role-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        console.log(`[DB] Successfully synced ${payload.length} role_permissions to PostgreSQL backend.`);
        return true;
      }
    } catch (err) {
      console.warn('[DB] Role permissions sync deferred:', err.message);
    }
    return false;
  }

  async syncRolePermissionsFromBackend(roleId = null) {
    if (typeof fetch !== 'function') return false;
    try {
      const url = roleId ? `/api/role-permissions?role_id=${encodeURIComponent(roleId)}` : '/api/role-permissions';
      const res = await fetch(url);
      if (!res.ok) return false;
      const remotePerms = await res.json();
      if (!Array.isArray(remotePerms) || remotePerms.length === 0) return false;
      
      let updated = false;
      let localPerms = this.data.role_permissions || [];

      remotePerms.forEach(rp => {
        const localIdx = localPerms.findIndex(lp => lp.role_id === rp.role_id && lp.perm_code === rp.perm_code);
        if (localIdx !== -1) {
          localPerms[localIdx] = { ...localPerms[localIdx], ...rp };
          updated = true;
        } else {
          localPerms.push(rp);
          updated = true;
        }
      });

      if (updated) {
        this.data.role_permissions = localPerms;
        this.saveData();
        this.emitChange('role_permissions');
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // Audit Trail Logger
  // --------------------------------------------------------------------------
  logAudit(action, module, recordId, details, user = 'Pravin Patil') {
    const auditRecord = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: user,
      role: 'Supply Chain Executive',
      ip: '192.168.1.45',
      action: action,
      module: module,
      record_id: recordId,
      details: details
    };
    if (!this.data.auditLogs) {
      this.data.auditLogs = [];
    }
    this.data.auditLogs.unshift(auditRecord);
    this.saveData();
    this.emitChange('auditLogs');
    return auditRecord;
  }

  // --------------------------------------------------------------------------
  // Inventory Atomic Ledger Methods
  // --------------------------------------------------------------------------
  addStock({ plantId, warehouseId, binId, itemId, batchNumber, serialNumber, qty, unitCost, mfgDate, expiryDate, refDoc, reason }) {
    qty = Number(qty);
    const balances = this.getAll('inventoryBalances');
    let record = balances.find(b =>
      b.plant_id === plantId &&
      b.warehouse_id === warehouseId &&
      b.bin_id === binId &&
      b.item_id === itemId &&
      b.batch_number === batchNumber
    );

    if (record) {
      record.on_hand += qty;
      record.available += qty;
      record.valuation_rate = unitCost ? Number(unitCost) : record.valuation_rate;
    } else {
      record = {
        id: `BAL-${Date.now().toString(36)}`,
        plant_id: plantId,
        warehouse_id: warehouseId,
        bin_id: binId,
        item_id: itemId,
        batch_number: batchNumber || 'LOT-GEN',
        serial_number: serialNumber || null,
        on_hand: qty,
        reserved: 0,
        available: qty,
        stock_status: 'AVAILABLE',
        valuation_rate: unitCost ? Number(unitCost) : 100,
        mfg_date: mfgDate || new Date().toISOString().split('T')[0],
        expiry_date: expiryDate || null
      };
      this.data.inventoryBalances.push(record);
    }

    this.saveData();
    this.emitChange('inventoryBalances');

    this.logAudit(
      'STOCK_ADD',
      'INVENTORY',
      itemId,
      `Added ${qty} units of ${itemId} (Batch: ${batchNumber}) to Bin ${binId}. Reason: ${reason || 'Inward Receipt'}`
    );

    return record;
  }

  deductStock({ plantId, warehouseId, binId, itemId, batchNumber, qty, reason }) {
    qty = Number(qty);
    const balances = this.getAll('inventoryBalances');
    const record = balances.find(b =>
      b.plant_id === plantId &&
      b.warehouse_id === warehouseId &&
      b.item_id === itemId &&
      (binId ? b.bin_id === binId : true) &&
      (batchNumber ? b.batch_number === batchNumber : true) &&
      b.available >= qty
    );

    if (!record) {
      throw new Error(`Insufficient available stock for item ${itemId}. Requested: ${qty}`);
    }

    record.on_hand -= qty;
    record.available -= qty;
    if (record.on_hand < 0) record.on_hand = 0;
    if (record.available < 0) record.available = 0;

    this.saveData();
    this.emitChange('inventoryBalances');

    this.logAudit(
      'STOCK_DEDUCT',
      'INVENTORY',
      itemId,
      `Deducted ${qty} units of ${itemId} (Batch: ${record.batch_number}). Reason: ${reason || 'Issue'}`
    );

    return record;
  }

  // Deduct stock for items added in Job Cards, Estimates, or Bills
  deductItemStock({ itemId, itemCode, qty, warehouseId, plantId, docType, docNo, docId, isPermanent = false }) {
    const qtyNum = Number(qty) || 0;
    if (qtyNum <= 0) return null;

    const allBalances = this.getAll('inventoryBalances') || [];
    const allItems = this.getAll('items') || [];

    const matchedItem = allItems.find(it => 
      (itemId && (it.id === itemId || it.code === itemId)) ||
      (itemCode && (it.code === itemCode || it.id === itemCode))
    );

    const finalId = (matchedItem && matchedItem.id) || itemId;
    const finalCode = (matchedItem && matchedItem.code) || itemCode || finalId;

    // Find balance record:
    // 1. Prefer matching warehouseId if specified
    let bal = null;
    if (warehouseId) {
      bal = allBalances.find(b => (b.item_id === finalId || b.item_id === finalCode) && b.warehouse_id === warehouseId);
    }
    // 2. Otherwise find balance with available stock > 0
    if (!bal) {
      bal = allBalances.find(b => (b.item_id === finalId || b.item_id === finalCode) && (b.available > 0 || b.on_hand > 0));
    }
    // 3. Fallback to any balance matching item
    if (!bal) {
      bal = allBalances.find(b => b.item_id === finalId || b.item_id === finalCode);
    }

    const isFinalBill = isPermanent || docType === 'FinalBill' || docType === 'Invoice' || docType === 'TaxInvoice' || (docType === 'Bill' && isPermanent);

    if (bal) {
      if (isFinalBill) {
        // Final bill: Permanently deduct from physical on-hand stock and clear from transit
        bal.on_hand = Math.max(0, (Number(bal.on_hand) || 0) - qtyNum);
        bal.in_transit = Math.max(0, (Number(bal.in_transit) || 0) - qtyNum);
        if (bal.quantity_in_transit !== undefined) bal.quantity_in_transit = bal.in_transit;
      } else {
        // Pre-finalization (JobCard / Estimate / Draft): Hold in transit till bill finalisation, reduce available so not double-allocated
        bal.available = Math.max(0, (Number(bal.available) || 0) - qtyNum);
        bal.in_transit = (Number(bal.in_transit) || 0) + qtyNum;
        if (bal.quantity_in_transit !== undefined) bal.quantity_in_transit = bal.in_transit;
      }
      if (bal.quantity_on_hand !== undefined) bal.quantity_on_hand = bal.on_hand;
      if (bal.quantity_available !== undefined) bal.quantity_available = bal.available;
    }

    // Also update stock on item record directly if properties exist
    if (matchedItem) {
      if (isFinalBill) {
        if (matchedItem.current_stock !== undefined) matchedItem.current_stock = Math.max(0, (Number(matchedItem.current_stock) || 0) - qtyNum);
        if (matchedItem.stock !== undefined) matchedItem.stock = Math.max(0, (Number(matchedItem.stock) || 0) - qtyNum);
        if (matchedItem.quantity_on_hand !== undefined) matchedItem.quantity_on_hand = Math.max(0, (Number(matchedItem.quantity_on_hand) || 0) - qtyNum);
        matchedItem.in_transit = Math.max(0, (Number(matchedItem.in_transit) || 0) - qtyNum);
      } else {
        if (matchedItem.available_stock !== undefined) matchedItem.available_stock = Math.max(0, (Number(matchedItem.available_stock) || 0) - qtyNum);
        matchedItem.in_transit = (Number(matchedItem.in_transit) || 0) + qtyNum;
      }
    }

    this.saveData();
    this.emitChange('inventoryBalances');
    this.emitChange('items');

    if (typeof this.logAudit === 'function') {
      this.logAudit(
        isFinalBill ? 'STOCK_DEDUCT_FINAL' : 'STOCK_HOLD_IN_TRANSIT',
        'INVENTORY',
        finalId || finalCode,
        isFinalBill
          ? `Permanently deducted ${qtyNum} units of ${matchedItem ? matchedItem.name : (finalCode || finalId)} against Final Bill ${docNo || docId || ''}. On-hand: ${bal ? bal.on_hand : 0}`
          : `Held ${qtyNum} units of ${matchedItem ? matchedItem.name : (finalCode || finalId)} in transit against ${docType || 'Estimate/JobCard'} ${docNo || docId || ''}. In-transit: ${bal ? bal.in_transit : qtyNum}`
      );
    }

    // Background sync to backend API only if permanent deduction
    if (isFinalBill && typeof fetch === 'function') {
      try {
        fetch('/api/inventory/deduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: finalId,
            item_code: finalCode,
            qty: qtyNum,
            warehouse_id: warehouseId || (bal && bal.warehouse_id),
            plant_id: plantId || (bal && bal.plant_id),
            doc_type: docType,
            doc_no: docNo,
            doc_id: docId
          })
        }).catch(() => {});
      } catch (_) {}
    }

    return {
      qty: qtyNum,
      on_hand: bal ? bal.on_hand : 0,
      available: bal ? bal.available : 0,
      in_transit: bal ? (bal.in_transit || 0) : 0
    };
  }

  // Restock items when removed or reduced from Job Cards, Estimates, or Bills
  restockItemStock({ itemId, itemCode, qty, warehouseId, plantId, docType, docNo, docId, wasPermanent }) {
    const qtyNum = Number(qty) || 0;
    if (qtyNum <= 0) return null;

    const allBalances = this.getAll('inventoryBalances') || [];
    const allItems = this.getAll('items') || [];

    const matchedItem = allItems.find(it => 
      (itemId && (it.id === itemId || it.code === itemId)) ||
      (itemCode && (it.code === itemCode || it.id === itemCode))
    );

    const finalId = (matchedItem && matchedItem.id) || itemId;
    const finalCode = (matchedItem && matchedItem.code) || itemCode || finalId;

    let bal = null;
    if (warehouseId) {
      bal = allBalances.find(b => (b.item_id === finalId || b.item_id === finalCode) && b.warehouse_id === warehouseId);
    }
    if (!bal) {
      bal = allBalances.find(b => b.item_id === finalId || b.item_id === finalCode);
    }

    const isFinalBill = wasPermanent || docType === 'FinalBill' || docType === 'Invoice';

    if (bal) {
      bal.available = (Number(bal.available) || 0) + qtyNum;
      if (isFinalBill) {
        bal.on_hand = (Number(bal.on_hand) || 0) + qtyNum;
      } else {
        bal.in_transit = Math.max(0, (Number(bal.in_transit) || 0) - qtyNum);
      }
      if (bal.quantity_on_hand !== undefined) bal.quantity_on_hand = bal.on_hand;
      if (bal.quantity_available !== undefined) bal.quantity_available = bal.available;
      if (bal.quantity_in_transit !== undefined) bal.quantity_in_transit = bal.in_transit || 0;
    } else {
      bal = {
        id: `BAL-RESTOCK-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        plant_id: plantId || 'PLANT-01',
        warehouse_id: warehouseId || 'WH-PUN-SPARE',
        bin_id: (matchedItem && matchedItem.bin_id) || 'BIN-PUN-A01',
        item_id: finalId,
        batch_number: 'LOT-RET',
        serial_number: null,
        on_hand: isFinalBill ? qtyNum : 0,
        reserved: 0,
        available: qtyNum,
        in_transit: 0,
        stock_status: 'AVAILABLE',
        valuation_rate: (matchedItem && (matchedItem.cost_price || matchedItem.sale_price)) || 150,
        mfg_date: new Date().toISOString().split('T')[0],
        expiry_date: null
      };
      allBalances.push(bal);
    }

    if (matchedItem) {
      if (matchedItem.available_stock !== undefined) matchedItem.available_stock = (Number(matchedItem.available_stock) || 0) + qtyNum;
      if (isFinalBill) {
        if (matchedItem.current_stock !== undefined) matchedItem.current_stock = (Number(matchedItem.current_stock) || 0) + qtyNum;
        if (matchedItem.stock !== undefined) matchedItem.stock = (Number(matchedItem.stock) || 0) + qtyNum;
        if (matchedItem.quantity_on_hand !== undefined) matchedItem.quantity_on_hand = (Number(matchedItem.quantity_on_hand) || 0) + qtyNum;
      } else {
        matchedItem.in_transit = Math.max(0, (Number(matchedItem.in_transit) || 0) - qtyNum);
      }
    }

    this.saveData();
    this.emitChange('inventoryBalances');
    this.emitChange('items');

    if (typeof this.logAudit === 'function') {
      this.logAudit(
        'STOCK_RESTOCK',
        'INVENTORY',
        finalId || finalCode,
        `Restocked ${qtyNum} units of ${matchedItem ? matchedItem.name : (finalCode || finalId)} against ${docType || 'Transaction'} ${docNo || docId || ''}. Available: ${bal.available}`
      );
    }

    if (isFinalBill && typeof fetch === 'function') {
      try {
        fetch('/api/inventory/restock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: finalId,
            item_code: finalCode,
            qty: qtyNum,
            warehouse_id: warehouseId || (bal && bal.warehouse_id),
            plant_id: plantId || (bal && bal.plant_id),
            doc_type: docType,
            doc_no: docNo,
            doc_id: docId
          })
        }).catch(() => {});
      } catch (_) {}
    }

    return {
      qty: qtyNum,
      on_hand: bal ? bal.on_hand : 0,
      available: bal ? bal.available : 0,
      in_transit: bal ? (bal.in_transit || 0) : 0
    };
  }

  // Unified stock & in-transit evaluation method
  getItemStockDetails({ itemId, itemCode, warehouseId, plantId }) {
    const allBalances = this.getAll('inventoryBalances') || [];
    const allItems = this.getAll('items') || [];
    const allTransfers = this.getAll('stockTransfers') || [];
    const allWarehouses = this.getAll('warehouses') || [];

    const item = allItems.find(it => 
      (itemId && (it.id === itemId || it.code === itemId)) ||
      (itemCode && (it.code === itemCode || it.id === itemCode)) ||
      (itemId && it.name && it.name.toLowerCase() === String(itemId).toLowerCase()) ||
      (itemCode && it.name && it.name.toLowerCase() === String(itemCode).toLowerCase())
    );

    const finalId = (item && item.id) || itemId;
    const finalCode = (item && item.code) || itemCode || finalId;
    const uom = (item && (item.stock_uom || item.base_uom)) || 'NOS';

    // Resolve target warehouse if warehouseId not directly given but plantId is
    let targetWhId = warehouseId;
    if (!targetWhId && plantId) {
      const plantWh = allWarehouses.find(w => w.plant_id === plantId || w.facility_id === plantId);
      if (plantWh) {
        targetWhId = plantWh.id;
      }
    }

    // 1. Available, On Hand, Reserved stock
    const matchingBals = allBalances.filter(b => 
      b && (b.item_id === finalId || b.item_id === finalCode || b.item_code === finalCode)
    );

    let available = 0;
    let onHand = 0;
    let reserved = 0;

    if (targetWhId) {
      const storeBals = matchingBals.filter(b => b.warehouse_id === targetWhId);
      if (storeBals.length > 0) {
        available = storeBals.reduce((sum, b) => sum + (Number(b.available !== undefined && b.available !== null ? b.available : (b.quantity_available !== undefined && b.quantity_available !== null ? b.quantity_available : (b.quantity_on_hand !== undefined && b.quantity_on_hand !== null ? b.quantity_on_hand : b.on_hand))) || 0), 0);
        onHand = storeBals.reduce((sum, b) => sum + (Number(b.on_hand !== undefined && b.on_hand !== null ? b.on_hand : b.quantity_on_hand) || 0), 0);
        reserved = storeBals.reduce((sum, b) => sum + (Number(b.reserved !== undefined && b.reserved !== null ? b.reserved : 0) || 0), 0);
      } else if (matchingBals.length > 0) {
        // Balances exist in other warehouses, but none in this target warehouse!
        available = 0;
        onHand = 0;
        reserved = 0;
      } else if (item) {
        // No warehouse-specific balance records exist in DB at all for this item
        available = Number(item.available_stock !== undefined ? item.available_stock : (item.current_stock !== undefined ? item.current_stock : item.stock)) || 0;
        onHand = Number(item.quantity_on_hand !== undefined ? item.quantity_on_hand : (item.on_hand !== undefined ? item.on_hand : (item.current_stock !== undefined ? item.current_stock : item.stock))) || 0;
      }
    } else if (plantId) {
      const plantBals = matchingBals.filter(b => b.plant_id === plantId);
      if (plantBals.length > 0) {
        available = plantBals.reduce((sum, b) => sum + (Number(b.available !== undefined && b.available !== null ? b.available : (b.quantity_available !== undefined && b.quantity_available !== null ? b.quantity_available : (b.quantity_on_hand !== undefined && b.quantity_on_hand !== null ? b.quantity_on_hand : b.on_hand))) || 0), 0);
        onHand = plantBals.reduce((sum, b) => sum + (Number(b.on_hand !== undefined && b.on_hand !== null ? b.on_hand : b.quantity_on_hand) || 0), 0);
        reserved = plantBals.reduce((sum, b) => sum + (Number(b.reserved !== undefined && b.reserved !== null ? b.reserved : 0) || 0), 0);
      } else if (matchingBals.length > 0) {
        available = 0;
        onHand = 0;
        reserved = 0;
      } else if (item) {
        available = Number(item.available_stock !== undefined ? item.available_stock : (item.current_stock !== undefined ? item.current_stock : item.stock)) || 0;
        onHand = Number(item.quantity_on_hand !== undefined ? item.quantity_on_hand : (item.on_hand !== undefined ? item.on_hand : (item.current_stock !== undefined ? item.current_stock : item.stock))) || 0;
      }
    } else {
      if (matchingBals.length > 0) {
        available = matchingBals.reduce((sum, b) => sum + (Number(b.available !== undefined && b.available !== null ? b.available : (b.quantity_available !== undefined && b.quantity_available !== null ? b.quantity_available : (b.quantity_on_hand !== undefined && b.quantity_on_hand !== null ? b.quantity_on_hand : b.on_hand))) || 0), 0);
        onHand = matchingBals.reduce((sum, b) => sum + (Number(b.on_hand !== undefined && b.on_hand !== null ? b.on_hand : b.quantity_on_hand) || 0), 0);
        reserved = matchingBals.reduce((sum, b) => sum + (Number(b.reserved !== undefined && b.reserved !== null ? b.reserved : 0) || 0), 0);
      } else if (item) {
        available = Number(item.available_stock !== undefined ? item.available_stock : (item.current_stock !== undefined ? item.current_stock : item.stock)) || 0;
        onHand = Number(item.quantity_on_hand !== undefined ? item.quantity_on_hand : (item.on_hand !== undefined ? item.on_hand : (item.current_stock !== undefined ? item.current_stock : item.stock))) || 0;
      }
    }

    // 2. In-Transit stock calculation
    let inTransit = 0;
    const activeTransfers = allTransfers.filter(t => 
      t && (t.status === 'IN_TRANSIT' || t.status === 'PARTIALLY_RECEIVED' || t.status === 'DISPATCHED' || t.status === 'SHIPPED')
    );

    activeTransfers.forEach(t => {
      // Check destination warehouse / plant filter if specified
      if (targetWhId && t.dest_warehouse_id && t.dest_warehouse_id !== targetWhId) {
        return;
      }
      if (plantId && t.dest_plant_id && t.dest_plant_id !== plantId && (!targetWhId || !t.dest_warehouse_id)) {
        return;
      }
      if (Array.isArray(t.items)) {
        t.items.forEach(line => {
          const isMatch = (line.item_id === finalId || line.item_id === finalCode || line.code === finalCode || line.item_code === finalCode || (line.name && line.name.toLowerCase() === (item ? item.name.toLowerCase() : '')));
          if (isMatch) {
            const disp = Number(line.dispatched !== undefined ? line.dispatched : (line.requested !== undefined ? line.requested : line.qty)) || 0;
            const recv = Number(line.received || 0);
            inTransit += Math.max(0, disp - recv);
          }
        });
      }
    });

    // Check direct in-transit properties
    if (inTransit === 0) {
      if (targetWhId) {
        const storeBals = matchingBals.filter(b => b.warehouse_id === targetWhId);
        inTransit = storeBals.reduce((sum, b) => sum + (Number(b.in_transit || b.transit_qty || b.quantity_in_transit) || 0), 0);
      } else {
        inTransit = matchingBals.reduce((sum, b) => sum + (Number(b.in_transit || b.transit_qty || b.quantity_in_transit) || 0), 0);
      }
      if (inTransit === 0 && item) {
        inTransit = Number(item.in_transit || item.transit_stock || item.quantity_in_transit) || 0;
      }
    }

    // If an item has in-transit stock destined for this facility/store and available stock was calculated from generic item fallback, the physical store does not have it yet
    if (inTransit > 0 && available > 0 && matchingBals.length === 0) {
      available = 0;
    }

    available = Math.max(0, isNaN(available) ? 0 : available);
    onHand = Math.max(0, isNaN(onHand) ? 0 : onHand);
    reserved = Math.max(0, isNaN(reserved) ? 0 : reserved);
    inTransit = Math.max(0, isNaN(inTransit) ? 0 : inTransit);

    return {
      available,
      onHand,
      reserved,
      inTransit,
      uom,
      item,
      isInTransit: (available <= 0 && inTransit > 0),
      hasTransitStock: inTransit > 0
    };
  }

  reserveStock({ plantId, warehouseId, itemId, qty }) {
    qty = Number(qty);
    const balances = this.getAll('inventoryBalances');
    const records = balances.filter(b =>
      b.plant_id === plantId &&
      b.warehouse_id === warehouseId &&
      b.item_id === itemId &&
      b.stock_status === 'AVAILABLE' &&
      b.available > 0
    );

    let remaining = qty;
    for (const rec of records) {
      const canReserve = Math.min(rec.available, remaining);
      rec.available -= canReserve;
      rec.reserved += canReserve;
      remaining -= canReserve;
      if (remaining <= 0) break;
    }

    this.saveData();
    this.emitChange('inventoryBalances');
    return remaining === 0;
  }

  // ==========================================================================
  // TWO-WHEELER SERVICE CENTER STORE & INVENTORY TRANSACTION ENGINE (BRD)
  // ==========================================================================

  // 1. Job Card Parts Reservation (BRD Section 6.13: Available = On Hand - Reserved)
  reserveJobCardParts(jobCardId, itemIds) {
    const jc = this.getById('jobCards', jobCardId);
    if (!jc) throw new Error(`Job Card ${jobCardId} not found.`);

    if (!Array.isArray(jc.parts_required) || jc.parts_required.length === 0) {
      throw new Error(`Cannot reserve: No spare parts added to Job Card ${jc.job_card_no}. Please add parts first.`);
    }

    const pendingParts = jc.parts_required.filter(part => {
      if (itemIds && !itemIds.includes(part.item_id)) return false;
      return part.status === 'PENDING' || !part.status;
    });

    if (pendingParts.length === 0) {
      throw new Error(`No pending parts available to reserve for Job Card ${jc.job_card_no}.`);
    }

    const balances = this.getAll('inventoryBalances');
    let count = 0;

    pendingParts.forEach(part => {
      const bal = balances.find(b => b.item_id === part.item_id && b.available >= part.qty);
      if (!bal) {
        throw new Error(`Insufficient stock for ${part.item_name}. Needed: ${part.qty}, Available: 0`);
      }
      bal.reserved += Number(part.qty);
      bal.available -= Number(part.qty);
      part.reserved_qty = Number(part.qty);
      part.status = 'RESERVED';
      count++;
    });

    if (jc.parts_required.length > 0 && jc.parts_required.every(p => p.status === 'RESERVED' || p.status === 'ISSUED')) {
      jc.status = 'PARTS_RESERVED';
    }

    this.saveData();
    this.emitChange('jobCards');
    this.emitChange('inventoryBalances');
    this.logAudit('JOB_CARD_RESERVE', 'JOB_CARD', jobCardId, `Reserved ${count} parts for Job Card ${jc.job_card_no} (${jc.vehicle_reg_no})`);
    return jc;
  }

  // 2. Job Card Parts Issue to Technician (BRD Section 6.14)
  issueJobCardParts(jobCardId, itemIds, storeId, binId, technicianId) {
    const jc = this.getById('jobCards', jobCardId);
    if (!jc) throw new Error(`Job Card ${jobCardId} not found.`);

    if (!Array.isArray(jc.parts_required) || jc.parts_required.length === 0) {
      throw new Error(`Cannot issue: No spare parts added to Job Card ${jc.job_card_no}. Please add parts first.`);
    }

    const issuableParts = jc.parts_required.filter(part => {
      if (itemIds && !itemIds.includes(part.item_id)) return false;
      return part.status === 'RESERVED' || part.status === 'PENDING';
    });

    if (issuableParts.length === 0) {
      throw new Error(`All spare parts have already been issued for Job Card ${jc.job_card_no}.`);
    }

    const balances = this.getAll('inventoryBalances');
    let count = 0;

    issuableParts.forEach(part => {
      const bal = balances.find(b => b.item_id === part.item_id);
      if (!bal) {
        throw new Error(`Stock record not found for item ${part.item_name}`);
      }

      const qtyToIssue = Number(part.qty);
      if (part.status === 'RESERVED') {
        bal.reserved = Math.max(0, bal.reserved - qtyToIssue);
        bal.on_hand = Math.max(0, bal.on_hand - qtyToIssue);
      } else {
        bal.available = Math.max(0, bal.available - qtyToIssue);
        bal.on_hand = Math.max(0, bal.on_hand - qtyToIssue);
      }

      part.issued_qty = (part.issued_qty || 0) + qtyToIssue;
      part.reserved_qty = 0;
      part.status = 'ISSUED';
      count++;

      this.logAudit('JOB_CARD_ISSUE', 'STORE_INVENTORY', part.item_id, `Issued ${qtyToIssue}x ${part.item_name} to Tech ${jc.technician_name} against JC ${jc.job_card_no}`);
    });

    if (jc.parts_required.length > 0 && jc.parts_required.every(p => p.status === 'ISSUED')) {
      jc.status = 'PARTS_ISSUED';
    }
    if (technicianId) jc.technician_id = technicianId;

    this.saveData();
    this.emitChange('jobCards');
    this.emitChange('inventoryBalances');
    return jc;
  }

  // 3. Unused Parts Return (BRD Section 6.15 & 17.2)
  returnJobCardParts(jobCardId, returnItems, storeId, binId, reason) {
    const jc = this.getById('jobCards', jobCardId);
    if (!jc) throw new Error(`Job Card ${jobCardId} not found.`);

    returnItems.forEach(ret => {
      const part = jc.parts_required.find(p => p.item_id === ret.item_id);
      const retQty = Number(ret.qty);
      if (part && (part.issued_qty || 0) >= retQty) {
        part.returned_qty = (part.returned_qty || 0) + retQty;
        part.issued_qty = Math.max(0, (Number(part.issued_qty) || 0) - retQty);
        // Reduce required / applied quantity from parts
        part.qty = Math.max(0, (Number(part.qty) || 0) - retQty);
        if (part.issued_qty <= 0 && part.qty <= 0) {
          part.status = 'RETURNED';
        }

        // Restock inventory in Store & Item Master
        const whId = storeId || jc.store_id || (part && part.store_id) || (jc.plant_id && this.getActiveWarehouses && this.getActiveWarehouses(jc.plant_id)[0]?.id) || 'WH-PUN-SPARE';
        if (typeof this.restockItemStock === 'function') {
          this.restockItemStock({
            itemId: ret.item_id,
            itemCode: part.item_code,
            qty: retQty,
            warehouseId: whId,
            plantId: jc.plant_id || 'PLANT-01',
            docType: 'Job Card Return',
            docNo: jc.job_card_no,
            docId: jc.id
          });
        } else {
          const balances = this.getAll('inventoryBalances');
          let bal = balances.find(b => b.item_id === ret.item_id && (!whId || b.warehouse_id === whId)) || balances.find(b => b.item_id === ret.item_id);
          if (bal) {
            bal.on_hand = (Number(bal.on_hand) || 0) + retQty;
            bal.available = (Number(bal.available) || 0) + retQty;
            if (bal.quantity_on_hand !== undefined) bal.quantity_on_hand = bal.on_hand;
            if (bal.quantity_available !== undefined) bal.quantity_available = bal.available;
          } else {
            balances.push({
              id: `BAL-${Date.now().toString(36)}`,
              plant_id: jc.plant_id || 'PLANT-01',
              warehouse_id: whId,
              bin_id: binId || (part && part.bin_id) || 'BIN-PUN-A01',
              item_id: ret.item_id,
              batch_number: 'LOT-RET',
              serial_number: null,
              on_hand: retQty,
              reserved: 0,
              available: retQty,
              stock_status: 'AVAILABLE',
              valuation_rate: part.unit_price || 150,
              mfg_date: new Date().toISOString().split('T')[0],
              expiry_date: null
            });
          }
        }

        this.logAudit('JOB_CARD_RETURN', 'STORE_INVENTORY', ret.item_id, `Returned ${retQty}x unused ${part.item_name} from JC ${jc.job_card_no}. Reason: ${reason || 'Unused part'}`);
      }
    });

    // Update Job Card status based on remaining active parts
    const remainingActive = (jc.parts_required || []).filter(p => p.status !== 'RETURNED' && p.status !== 'CANCELLED' && (Number(p.qty) > 0 || Number(p.issued_qty) > 0));
    if (remainingActive.length === 0) {
      if (jc.status === 'PARTS_ISSUED' || jc.status === 'PARTS_RESERVED') {
        const estimates = (typeof this.getAll === 'function') ? (this.getAll('billingEstimates') || []) : [];
        const linkedEst = estimates.find(e => (e.job_card_id && e.job_card_id === jc.id) || (e.job_card_no && e.job_card_no === jc.job_card_no));
        if (linkedEst && (linkedEst.status === 'APPROVED' || linkedEst.status === 'CUSTOMER_APPROVED')) {
          jc.status = 'ESTIMATE_APPROVED';
        } else if (linkedEst) {
          jc.status = 'ESTIMATE_CREATED';
        } else {
          jc.status = 'ESTIMATE_PENDING';
        }
      }
    } else if (remainingActive.every(p => p.status === 'ISSUED')) {
      jc.status = 'PARTS_ISSUED';
    } else if (remainingActive.every(p => p.status === 'RESERVED')) {
      jc.status = 'PARTS_RESERVED';
    }

    this.saveData();
    this.emitChange('jobCards');
    this.emitChange('inventoryBalances');
    this.emitChange('items');
    return jc;
  }

  // 4. Job Card Closure
  closeJobCard(jobCardId) {
    const jc = this.getById('jobCards', jobCardId);
    if (!jc) throw new Error(`Job Card ${jobCardId} not found.`);
    jc.status = 'COMPLETED';
    jc.completed_at = new Date().toISOString();
    this.saveData();
    this.emitChange('jobCards');
    this.logAudit('JOB_CARD_CLOSE', 'JOB_CARD', jobCardId, `Completed and closed Job Card ${jc.job_card_no}`);
    return jc;
  }

  // 5. Stock Transfer Workflow (BRD Section 6.18)
  createStockTransfer(transferData) {
    const transfers = this.getAll('stockTransfers');
    const newId = `TRF-${Date.now().toString(36).toUpperCase()}`;
    const qty = Number(transferData.qty);

    const transferRecord = {
      id: newId,
      transfer_number: `TRF-PUN-26-${(transfers.length + 1).toString().padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      source_store_id: transferData.source_store_id,
      source_store_name: transferData.source_store_name,
      dest_store_id: transferData.dest_store_id,
      dest_store_name: transferData.dest_store_name,
      item_id: transferData.item_id,
      item_code: transferData.item_code,
      item_name: transferData.item_name,
      qty: qty,
      reason: transferData.reason || 'Replenishment',
      status: transferData.approval_required ? 'PENDING_APPROVAL' : 'IN_TRANSIT',
      requested_by: transferData.requested_by || 'Storekeeper',
      approved_by: null,
      received_date: null
    };

    const balances = this.getAll('inventoryBalances');
    const srcBal = balances.find(b => b.warehouse_id === transferData.source_store_id && b.item_id === transferData.item_id);
    if (!srcBal || srcBal.available < qty) {
      throw new Error(`Insufficient available stock at source store. Available: ${srcBal ? srcBal.available : 0}`);
    }

    if (!transferData.approval_required) {
      srcBal.on_hand = Math.max(0, srcBal.on_hand - qty);
      srcBal.available = Math.max(0, srcBal.available - qty);
    }

    transfers.unshift(transferRecord);
    this.saveData();
    this.emitChange('stockTransfers');
    this.emitChange('inventoryBalances');
    this.logAudit('STOCK_TRANSFER_CREATE', 'STOCK_TRANSFER', newId, `Transfer ${transferRecord.transfer_number} of ${qty}x ${transferData.item_name} initiated from ${transferData.source_store_name} to ${transferData.dest_store_name}`);
    return transferRecord;
  }

  receiveStockTransfer(transferId) {
    const transfers = this.getAll('stockTransfers');
    const trf = transfers.find(t => t.id === transferId);
    if (!trf) throw new Error(`Transfer ${transferId} not found.`);
    if (trf.status === 'RECEIVED') throw new Error(`Transfer ${trf.transfer_number} already received.`);

    const balances = this.getAll('inventoryBalances');
    let destBal = balances.find(b => b.warehouse_id === trf.dest_store_id && b.item_id === trf.item_id);
    if (destBal) {
      destBal.on_hand += trf.qty;
      destBal.available += trf.qty;
    } else {
      balances.push({
        id: `BAL-${Date.now().toString(36)}`,
        plant_id: 'PLANT-01',
        warehouse_id: trf.dest_store_id,
        bin_id: 'BIN-PUN-A01',
        item_id: trf.item_id,
        batch_number: 'LOT-TRF',
        serial_number: null,
        on_hand: trf.qty,
        reserved: 0,
        available: trf.qty,
        stock_status: 'AVAILABLE',
        valuation_rate: 280,
        mfg_date: new Date().toISOString().split('T')[0],
        expiry_date: null
      });
    }

    trf.status = 'RECEIVED';
    trf.received_date = new Date().toISOString().split('T')[0];

    this.saveData();
    this.emitChange('stockTransfers');
    this.emitChange('inventoryBalances');
    this.logAudit('STOCK_TRANSFER_RECEIVE', 'STOCK_TRANSFER', transferId, `Transfer ${trf.transfer_number} received at ${trf.dest_store_name}`);
    return trf;
  }

  // 6. Physical Stock Count Sessions (BRD Section 6.20)
  createStockCountSession(storeId, countedItems) {
    const sessions = this.getAll('stockCountSessions');
    const store = this.getById('warehouses', storeId) || { name: 'Service Store' };
    const balances = this.getAll('inventoryBalances').filter(b => b.warehouse_id === storeId);
    const items = this.getAll('items');

    const snapItems = countedItems || balances.map(b => {
      const it = items.find(i => i.id === b.item_id) || { name: b.item_id, standard_cost: 100 };
      return {
        item_id: b.item_id,
        item_name: it.name,
        system_qty: b.on_hand,
        physical_qty: b.on_hand,
        variance: 0,
        unit_cost: it.standard_cost || 100,
        variance_value: 0,
        status: 'PENDING_COUNT',
        reason: ''
      };
    });

    const newSession = {
      id: `CNT-${Date.now().toString(36).toUpperCase()}`,
      session_no: `PHY-CNT-${Date.now().toString().slice(-4)}`,
      store_id: storeId,
      store_name: store.name,
      freeze_timestamp: new Date().toISOString(),
      status: 'IN_PROGRESS',
      auditor: 'Rajesh Sharma (Store Manager)',
      items: snapItems,
      adjustment_posted: false
    };

    sessions.unshift(newSession);
    this.saveData();
    this.emitChange('stockCountSessions');
    this.logAudit('PHYSICAL_COUNT_FREEZE', 'PHYSICAL_COUNT', newSession.id, `Snapshot frozen for physical count at ${store.name}`);
    return newSession;
  }

  finalizeStockCount(sessionId, countItems, autoAdjust = true) {
    const sessions = this.getAll('stockCountSessions');
    const session = sessions.find(s => s.id === sessionId);
    if (!session) throw new Error(`Stock count session ${sessionId} not found.`);

    if (countItems) {
      session.items = countItems.map(item => {
        const diff = Number(item.physical_qty) - Number(item.system_qty);
        return {
          ...item,
          variance: diff,
          variance_value: diff * (Number(item.unit_cost) || 100),
          status: diff === 0 ? 'MATCHED' : 'ADJUSTED'
        };
      });
    }

    if (autoAdjust) {
      const balances = this.getAll('inventoryBalances');
      session.items.forEach(it => {
        if (it.variance !== 0) {
          const bal = balances.find(b => b.warehouse_id === session.store_id && b.item_id === it.item_id);
          if (bal) {
            bal.on_hand = Number(it.physical_qty);
            bal.available = Math.max(0, bal.on_hand - bal.reserved);
          }
        }
      });
      session.adjustment_posted = true;
    }

    session.status = 'FINALIZED';
    session.finalized_at = new Date().toISOString();

    this.saveData();
    this.emitChange('stockCountSessions');
    this.emitChange('inventoryBalances');
    this.logAudit('PHYSICAL_COUNT_FINALIZE', 'PHYSICAL_COUNT', sessionId, `Finalized stock count session ${session.session_no}`);
    return session;
  }

  // 7. Store Transaction Matrix Save (BRD Section 6.4)
  saveStoreTransactionConfig(storeId, configMatrix) {
    let configs = this.getAll('storeTransactionConfigs');
    let cfg = configs.find(c => c.store_id === storeId);
    if (cfg) {
      Object.assign(cfg, configMatrix);
    } else {
      const store = this.getById('warehouses', storeId) || {};
      cfg = {
        store_id: storeId,
        store_code: store.code || storeId,
        store_name: store.name || storeId,
        ...configMatrix
      };
      configs.push(cfg);
    }
    this.saveData();
    this.emitChange('storeTransactionConfigs');
    this.logAudit('STORE_CONFIG_SAVE', 'STORE_CONFIG', storeId, `Updated transaction matrix for store ${storeId}`);
    return cfg;
  }

  // 8. Global Inventory Rules (BRD Section 6.11)
  saveInventoryRules(rulesObj) {
    this.data.inventoryRules = { ...this.data.inventoryRules, ...rulesObj };
    this.saveData();
    this.emitChange('inventoryRules');
    this.logAudit('INVENTORY_RULES_SAVE', 'INVENTORY_RULES', 'RULES', 'Updated global inventory policy rules');
    return this.data.inventoryRules;
  }

  // =========================================================================
  // STORE MASTER SUITE (BRD VERSION 1.0 COMPLIANT)
  // Store Screen Mapping, Item Mapping, Reorder Levels, and Audit History
  // =========================================================================

  getStoreFacilities(storeId) {
    const store = this.getById('warehouses', storeId);
    if (!store) return [];
    const allPlants = this.getAll('plants') || [];
    const facilityIds = Array.isArray(store.facility_ids) && store.facility_ids.length > 0 
      ? store.facility_ids 
      : (store.plant_id ? [store.plant_id] : []);
    return allPlants.filter(p => facilityIds.includes(p.id));
  }

  getStoreScreenMapping(storeId) {
    const store = this.getById('warehouses', storeId) || {};
    const mappings = this.getAll('storeScreenMappings') || [];
    const found = mappings.find(m => m.store_id === storeId);
    if (found && found.screens) {
      return { ...found.screens };
    }
    // Default 12-Screen Mapping based on Store Type (BRD §7.2)
    const isSub = store.warehouse_type === 'SUB_STORE' || store.store_type === 'Sub Store';
    return {
      REQUISITIONS: !isSub,
      PURCHASE_ORDERS: !isSub,
      GRN: !isSub,
      OPENING_BALANCE: !isSub,
      STOCK_TRANSFER: true,
      STOCK_ADJUSTMENT: true,
      BATCH_EXPIRY_CHANGE: !isSub,
      WORK_ORDERS: isSub,
      STOCK_ISSUE: isSub,
      STOCK_RETURN: isSub,
      STOCK_CONSUMPTION: isSub,
      PHYSICAL_STOCK_VERIFICATION: true
    };
  }

  saveStoreScreenMapping(storeId, screenMap, user = 'System Administrator') {
    if (!this.data.storeScreenMappings) this.data.storeScreenMappings = [];
    let record = this.data.storeScreenMappings.find(m => m.store_id === storeId);
    const store = this.getById('warehouses', storeId) || {};
    const enabledScreens = Object.keys(screenMap).filter(k => screenMap[k] === true);
    
    if (record) {
      record.screens = { ...screenMap };
      record.updated_at = new Date().toISOString();
      record.updated_by = user;
    } else {
      record = {
        store_id: storeId,
        store_code: store.code || storeId,
        screens: { ...screenMap },
        updated_at: new Date().toISOString(),
        updated_by: user
      };
      this.data.storeScreenMappings.push(record);
    }
    this.saveData();
    this.emitChange('storeScreenMappings');
    this.logStoreAudit(storeId, 'SCREEN_MAPPING_UPDATE', `Configured ${enabledScreens.length} of 12 screens enabled: [${enabledScreens.join(', ')}]`, user);
    return record;
  }

  isScreenMappedToStore(storeId, screenCode) {
    const mapping = this.getStoreScreenMapping(storeId);
    return !!mapping[screenCode];
  }

  getStoreCategoryMappings(storeId) {
    const list = this.getAll('storeCategoryMappings') || [];
    const entry = list.find(m => m.store_id === storeId);
    return (entry && Array.isArray(entry.subcategory_ids)) ? entry.subcategory_ids : [];
  }

  saveStoreCategoryMappings(storeId, subcategoryIds, user = 'System Administrator') {
    if (!this.data.storeCategoryMappings) this.data.storeCategoryMappings = [];
    let record = this.data.storeCategoryMappings.find(m => m.store_id === storeId);
    const store = this.getById('warehouses', storeId) || {};
    
    if (record) {
      record.subcategory_ids = [...subcategoryIds];
      record.updated_at = new Date().toISOString();
      record.updated_by = user;
    } else {
      record = {
        store_id: storeId,
        store_code: store.code || storeId,
        subcategory_ids: [...subcategoryIds],
        updated_at: new Date().toISOString(),
        updated_by: user
      };
      this.data.storeCategoryMappings.push(record);
    }
    this.saveData();
    this.emitChange('storeCategoryMappings');
    this.logStoreAudit(storeId, 'CATEGORY_MAPPING_UPDATE', `Mapped ${subcategoryIds.length} sub-categories to store`, user);
    return record;
  }

  getStoreItemMappings(storeId) {
    const list = this.getAll('storeItemMappings') || [];
    const entry = list.find(m => m.store_id === storeId);
    return (entry && Array.isArray(entry.item_ids)) ? entry.item_ids : [];
  }

  saveStoreItemMappings(storeId, itemIds, user = 'System Administrator') {
    if (!this.data.storeItemMappings) this.data.storeItemMappings = [];
    let record = this.data.storeItemMappings.find(m => m.store_id === storeId);
    const store = this.getById('warehouses', storeId) || {};

    if (record) {
      record.item_ids = [...itemIds];
      record.updated_at = new Date().toISOString();
      record.updated_by = user;
    } else {
      record = {
        store_id: storeId,
        store_code: store.code || storeId,
        item_ids: [...itemIds],
        updated_at: new Date().toISOString(),
        updated_by: user
      };
      this.data.storeItemMappings.push(record);
    }
    this.saveData();
    this.emitChange('storeItemMappings');
    this.logStoreAudit(storeId, 'ITEM_MAPPING_UPDATE', `Mapped ${itemIds.length} individual items to store`, user);
    return record;
  }

  // Union of Mapped Sub-Categories and Individually Mapped Items (BRD §7.3 & §7.3.1)
  getStoreEffectiveItems(storeId) {
    const allItems = this.getAll('items') || [];
    const activeItems = allItems.filter(i => i.status === 'Active' || !i.status);
    const mappedSubcats = this.getStoreCategoryMappings(storeId);
    const mappedItemIds = this.getStoreItemMappings(storeId);
    const allBalances = this.getAll('inventoryBalances') || [];

    const effective = [];
    activeItems.forEach(item => {
      const isSubcatMapped = mappedSubcats.includes(item.subcategory_id) || mappedSubcats.includes(item.category_id);
      const isItemMapped = mappedItemIds.includes(item.id) || mappedItemIds.includes(item.code);

      if (isSubcatMapped || isItemMapped) {
        let source = 'BOTH';
        if (isSubcatMapped && !isItemMapped) source = 'SUBCAT';
        else if (!isSubcatMapped && isItemMapped) source = 'ITEM';

        const storeBalances = allBalances.filter(b => b.warehouse_id === storeId && b.item_id === item.id);
        const onHand = storeBalances.reduce((acc, b) => acc + (Number(b.on_hand) || 0), 0);
        const reserved = storeBalances.reduce((acc, b) => acc + (Number(b.reserved) || 0), 0);
        const available = Math.max(0, onHand - reserved);

        effective.push({
          ...item,
          mapping_source: source,
          is_subcat_mapped: isSubcatMapped,
          is_item_mapped: isItemMapped,
          store_on_hand: onHand,
          store_reserved: reserved,
          store_available: available
        });
      }
    });

    return effective;
  }

  isItemMappedToStore(storeId, itemId) {
    const effective = this.getStoreEffectiveItems(storeId);
    return effective.some(i => i.id === itemId || i.code === itemId);
  }

  getStoreReorderLevels(storeId) {
    const list = this.getAll('storeReorderLevels') || [];
    return list.filter(r => r.store_id === storeId);
  }

  saveStoreReorderLevel(ruleObj, user = 'System Administrator') {
    if (!this.data.storeReorderLevels) this.data.storeReorderLevels = [];
    const list = this.data.storeReorderLevels;

    // BRD §7.4 & STR-BR-25: Min <= Reorder <= Max
    const min = Number(ruleObj.min_stock_level) || 0;
    const reorder = Number(ruleObj.reorder_level) || 0;
    const max = Number(ruleObj.max_stock_level) || 0;
    const reorderQty = Number(ruleObj.reorder_quantity) || 0;

    if (min < 0 || reorder < 0 || max < 0 || reorderQty < 0) {
      throw new Error('STR-BR-27 Violation: Stock levels and reorder quantities cannot be negative.');
    }
    if (max > 0 && (min > reorder || reorder > max)) {
      throw new Error('STR-BR-25 Violation: Minimum Stock Level must be ≤ Reorder Level ≤ Maximum Stock Level.');
    }
    if (ruleObj.effective_from && ruleObj.effective_to && ruleObj.effective_to < ruleObj.effective_from) {
      throw new Error('STR-BR-26 Violation: Effective To must not be earlier than Effective From.');
    }

    let existing = list.find(r => r.store_id === ruleObj.store_id && r.item_id === ruleObj.item_id);
    if (existing) {
      Object.assign(existing, {
        min_stock_level: min,
        reorder_level: reorder,
        reorder_quantity: reorderQty,
        max_stock_level: max,
        lead_time_days: Number(ruleObj.lead_time_days) || 0,
        effective_from: ruleObj.effective_from || new Date().toISOString().split('T')[0],
        effective_to: ruleObj.effective_to || null,
        status: ruleObj.status || 'Active',
        updated_at: new Date().toISOString(),
        updated_by: user
      });
    } else {
      existing = {
        id: `SRL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        store_id: ruleObj.store_id,
        item_id: ruleObj.item_id,
        item_code: ruleObj.item_code || ruleObj.item_id,
        item_name: ruleObj.item_name || ruleObj.item_id,
        min_stock_level: min,
        reorder_level: reorder,
        reorder_quantity: reorderQty,
        max_stock_level: max,
        lead_time_days: Number(ruleObj.lead_time_days) || 0,
        effective_from: ruleObj.effective_from || new Date().toISOString().split('T')[0],
        effective_to: ruleObj.effective_to || null,
        status: ruleObj.status || 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: user
      };
      list.push(existing);
    }
    this.saveData();
    this.emitChange('storeReorderLevels');
    this.logStoreAudit(ruleObj.store_id, 'REORDER_LEVEL_UPDATE', `Configured reorder levels for item ${existing.item_name} (${existing.item_code}): Min=${min}, Reorder=${reorder}, Qty=${reorderQty}, Max=${max}`, user);
    return existing;
  }

  deleteStoreReorderLevel(ruleId, user = 'System Administrator') {
    if (!this.data.storeReorderLevels) return;
    const idx = this.data.storeReorderLevels.findIndex(r => r.id === ruleId);
    if (idx !== -1) {
      const removed = this.data.storeReorderLevels.splice(idx, 1)[0];
      this.saveData();
      this.emitChange('storeReorderLevels');
      this.logStoreAudit(removed.store_id, 'REORDER_LEVEL_DELETE', `Deleted reorder rule for item ${removed.item_name} (${removed.item_code})`, user);
      return removed;
    }
  }

  getStoreReorderAlerts(storeId) {
    const rules = this.getStoreReorderLevels(storeId).filter(r => r.status === 'Active');
    const effectiveItems = this.getStoreEffectiveItems(storeId);
    const alerts = [];

    rules.forEach(rule => {
      const item = effectiveItems.find(i => i.id === rule.item_id || i.code === rule.item_code);
      if (!item) return;

      const available = item.store_available || 0;
      if (available <= rule.reorder_level) {
        alerts.push({
          rule,
          item,
          available_stock: available,
          on_hand_stock: item.store_on_hand || 0,
          reorder_level: rule.reorder_level,
          min_stock_level: rule.min_stock_level,
          suggested_qty: rule.reorder_quantity,
          is_critical: available <= rule.min_stock_level
        });
      }
    });

    return alerts;
  }

  logStoreAudit(storeId, action, details, user = 'System Administrator') {
    if (!this.data.storeAuditLogs) this.data.storeAuditLogs = [];
    const store = this.getById('warehouses', storeId) || {};
    const log = {
      id: `SAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      store_id: storeId,
      store_code: store.code || storeId,
      action: action,
      details: details,
      user: user,
      timestamp: new Date().toISOString()
    };
    this.data.storeAuditLogs.unshift(log);
    // Keep max 500 logs in memory
    if (this.data.storeAuditLogs.length > 500) {
      this.data.storeAuditLogs = this.data.storeAuditLogs.slice(0, 500);
    }
    this.saveData();
    this.emitChange('storeAuditLogs');
    return log;
  }

  getStoreAuditLogs(storeId) {
    const list = this.getAll('storeAuditLogs') || [];
    return list.filter(l => l.store_id === storeId);
  }

  getCountries(activeOnly = false) {
    const list = this.getAll('countries') || [];
    return activeOnly ? list.filter(c => c.status === 'Active') : list;
  }

  getStates(countryId = null, activeOnly = false) {
    let list = this.getAll('states') || [];
    if (countryId && countryId !== 'ALL') {
      list = list.filter(s => s.country_id === countryId);
    }
    return activeOnly ? list.filter(s => s.status === 'Active') : list;
  }

  getDistricts(stateId = null, activeOnly = false) {
    let list = this.getAll('districts') || [];
    if (stateId && stateId !== 'ALL') {
      list = list.filter(d => d.state_id === stateId);
    }
    return activeOnly ? list.filter(d => d.status === 'Active') : list;
  }

  getCities(districtId = null, activeOnly = false) {
    let list = this.getAll('cities') || [];
    if (districtId && districtId !== 'ALL') {
      list = list.filter(c => c.district_id === districtId);
    }
    return activeOnly ? list.filter(c => c.status === 'Active') : list;
  }

  getPincodes(cityId = null, activeOnly = false) {
    let list = this.getAll('pincodes') || [];
    if (cityId && cityId !== 'ALL') {
      list = list.filter(p => p.city_id === cityId);
    }
    return activeOnly ? list.filter(p => p.status === 'Active') : list;
  }

  getCommonMasters(type = null, activeOnly = false) {
    let list = this.getAll('common_masters') || [];
    if (type && type !== 'ALL') {
      list = list.filter(e => e.type === type);
    }
    return activeOnly ? list.filter(e => e.status === 'Active') : list;
  }

  getTitleGenderMapping(title) {
    if (!title) return null;
    const q = String(title).trim().toUpperCase().replace(/\./g, '');
    const titles = this.getCommonMasters('TITLE', false);
    const found = titles.find(t => 
      (t.code && t.code.toUpperCase() === q) || 
      (t.name && t.name.toUpperCase().replace(/\./g, '') === q)
    );
    if (!found) return null;
    return {
      titleCode: found.code,
      titleName: found.name,
      linkedGenderCode: found.linked_gender_code || '',
      linkedGenderName: found.linked_gender_name || 'Any',
      isGenderFixed: !!found.is_gender_fixed
    };
  }

  getLocationMaster() {
    const states = this.getAll('states') || [];
    const districts = this.getAll('districts') || [];
    const cities = this.getAll('cities') || [];

    if (states.length > 0) {
      const master = {};
      states.forEach(st => {
        master[st.name] = {};
        const dists = districts.filter(d => d.state_id === st.id);
        if (dists.length === 0) {
          master[st.name][st.capital || st.name] = [st.capital || st.name];
        } else {
          dists.forEach(dist => {
            const cts = cities.filter(c => c.district_id === dist.id).map(c => c.name);
            master[st.name][dist.name] = cts.length > 0 ? cts : [dist.name];
          });
        }
      });
      return master;
    }

    if (typeof INDIAN_LOCATION_MASTER !== 'undefined') {
      return INDIAN_LOCATION_MASTER;
    }
    if (typeof window !== 'undefined' && window.INDIAN_LOCATION_MASTER) {
      return window.INDIAN_LOCATION_MASTER;
    }
    return {};
  }

  isHoliday(dateStr, facilityId) {
    if (!dateStr) return false;
    const holidays = this.getAll('holidays') || [];
    const targetDate = String(dateStr).split('T')[0];
    return holidays.some(h => {
      if (h.active_yn === false || h.status === 'Inactive') return false;
      const hDate = String(h.holiday_date || '').split('T')[0];
      if (hDate !== targetDate) return false;
      if (h.applicable_level === 'ORGANIZATION') return true;
      if (facilityId && (h.facility_id === facilityId || facilityId === 'ALL')) return true;
      return false;
    });
  }

  getHolidaysForFacility(facilityId, financialYearId) {
    const holidays = this.getAll('holidays') || [];
    return holidays.filter(h => {
      if (h.active_yn === false || h.status === 'Inactive') return false;
      if (financialYearId && h.financial_year_id !== financialYearId) return false;
      if (h.applicable_level === 'ORGANIZATION') return true;
      if (facilityId && (h.facility_id === facilityId || facilityId === 'ALL')) return true;
      return false;
    });
  }

  // Centralized Tax Master Accessors
  isFacilityGstApplicable(facilityIdOrSource) {
    if (!facilityIdOrSource) {
      if (typeof window !== 'undefined' && window.State && window.State.currentPlantId && window.State.currentPlantId !== 'ALL') {
        facilityIdOrSource = window.State.currentPlantId;
      } else {
        return true;
      }
    }

    let plant = null;
    const allPlants = (this.getAll && this.getAll('plants')) || (this.data && this.data.plants) || [];

    if (typeof facilityIdOrSource === 'string') {
      const clean = facilityIdOrSource.trim();
      plant = allPlants.find(p => p.id === clean || p.code === clean || (p.branch_code && p.branch_code.toUpperCase() === clean.toUpperCase()));
    } else if (facilityIdOrSource && typeof facilityIdOrSource === 'object') {
      const targetId = facilityIdOrSource.facility_id || facilityIdOrSource.branch_id || facilityIdOrSource.plant_id || facilityIdOrSource.id;
      if (targetId) {
        plant = allPlants.find(p => p.id === targetId || p.code === targetId || (p.branch_code && p.branch_code.toUpperCase() === String(targetId).toUpperCase()));
      }
      if (!plant) {
        plant = facilityIdOrSource.raw || facilityIdOrSource;
      }
    }

    if (plant) {
      if (plant.is_gst_applicable === false || plant.is_gst_applicable === 'false' || plant.is_gst_applicable === 0 || plant.is_gst_applicable === 'NO') return false;
      if (plant.gst_applicable === false || plant.gst_applicable === 'false' || plant.gst_applicable === 0 || plant.gst_applicable === 'NO') return false;
    }

    return true;
  }

  getActiveTaxes() {
    const list = this.getAll('taxes') || [];
    const active = list.filter(t => t.status === 'Active');
    return active.length > 0 ? active : list;
  }

  getDefaultTax(facilityId) {
    if (facilityId && !this.isFacilityGstApplicable(facilityId)) {
      return {
        id: 'TAX-000',
        code: 'GST0',
        name: 'GST 0% (Non-GST Facility)',
        rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0,
        status: 'Active'
      };
    }
    const active = this.getActiveTaxes();
    return active.find(t => Number(t.rate) === 0 || t.code === 'GST0') || 
           active.find(t => t.system_default && Number(t.rate) === 0) || 
           active.find(t => t.code === 'GST0') || 
           active.find(t => t.system_default) || 
           active[0] || {
      id: 'TAX-001',
      code: 'GST0',
      name: 'GST 0%',
      rate: 0,
      cgst_rate: 0,
      sgst_rate: 0,
      igst_rate: 0,
      status: 'Active'
    };
  }

  getTaxByRate(rate, facilityId) {
    if (facilityId && !this.isFacilityGstApplicable(facilityId)) {
      return {
        id: 'TAX-000',
        code: 'GST0',
        name: 'GST 0% (Non-GST Facility)',
        rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0
      };
    }
    const num = parseFloat(rate);
    const taxes = this.getAll('taxes') || [];
    if (!isNaN(num)) {
      const match = taxes.find(t => Number(t.rate) === num && t.status === 'Active') || taxes.find(t => Number(t.rate) === num);
      if (match) return match;
    }
    const safeRate = isNaN(num) ? 0 : num;
    return {
      id: 'TAX-CUSTOM',
      code: `GST${safeRate}`,
      name: `GST ${safeRate}%`,
      rate: safeRate,
      cgst_rate: safeRate / 2,
      sgst_rate: safeRate / 2,
      igst_rate: safeRate
    };
  }

  renderTaxSelectOptions(selectedRateOrId, includeBlank = false, blankText = '-- Select Tax Slab --', facilityId = null) {
    if (facilityId && !this.isFacilityGstApplicable(facilityId)) {
      return `<option value="0" selected>0% (GST Not Applicable for Facility)</option>`;
    }
    const active = this.getActiveTaxes();
    let html = '';
    if (includeBlank) {
      html += `<option value="">${blankText}</option>`;
    }
    const defaultTax = this.getDefaultTax(facilityId);
    const hasSelection = selectedRateOrId !== undefined && selectedRateOrId !== null && selectedRateOrId !== '';
    const selVal = hasSelection ? String(selectedRateOrId) : String(defaultTax.rate);
    active.forEach(t => {
      const isSelected = String(t.rate) === selVal || String(t.id) === selVal || String(t.code) === selVal;
      const cgst = t.cgst_rate !== undefined ? t.cgst_rate : (t.rate / 2);
      const sgst = t.sgst_rate !== undefined ? t.sgst_rate : (t.rate / 2);
      const label = (t.name && t.name.includes('%')) ? t.name : `${t.name || 'GST'} ${t.rate}%`;
      html += `<option value="${t.rate}" data-id="${t.id}" data-cgst="${cgst}" data-sgst="${sgst}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    });
    return html;
  }

  // =========================================================================
  // PINNED SUB-MODULES (PERSONALIZED QUICK ACCESS BAR - BRD v1.0)
  // =========================================================================

  getMaxPinnedSubmodules() {
    return (this.data && typeof this.data.maxPinnedSubmodules === 'number') 
      ? this.data.maxPinnedSubmodules 
      : 7;
  }

  setMaxPinnedSubmodules(limit, user = null) {
    const num = parseInt(limit, 10);
    if (isNaN(num) || num < 1 || num > 20) {
      return { success: false, message: 'Max pinned sub-modules limit must be between 1 and 20.' };
    }
    const oldLimit = this.getMaxPinnedSubmodules();
    this.data.maxPinnedSubmodules = num;
    this.logUserPinnedAudit('SYSTEM', 'UPDATE_MAX_LIMIT', 'CONFIG', { oldLimit, newLimit: num }, user);
    this.saveData();
    this.emitChange('userPinnedSubmodules');
    return { success: true, maxLimit: num };
  }

  getUserPinnedSubmodules(userId) {
    if (!userId) return [];
    if (!Array.isArray(this.data.userPinnedSubmodules)) {
      this.data.userPinnedSubmodules = [];
    }
    return this.data.userPinnedSubmodules
      .filter(p => p.user_id === userId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  pinUserSubmodule(userId, submoduleId, user = null) {
    if (!userId) {
      return { success: false, message: 'User ID is required to pin a sub-module.' };
    }
    if (!submoduleId) {
      return { success: false, message: 'Sub-module ID is required.' };
    }

    if (!Array.isArray(this.data.userPinnedSubmodules)) {
      this.data.userPinnedSubmodules = [];
    }

    // PIN-FR-03 & PIN-BR-03: Cannot pin same sub-module twice
    const existing = this.data.userPinnedSubmodules.find(p => p.user_id === userId && p.submodule_id === submoduleId);
    if (existing) {
      return { success: false, code: 'DUPLICATE', message: 'Sub-module is already pinned.' };
    }

    // PIN-FR-10, PIN-FR-11, PIN-BR-02: Limit to maximum 7
    const currentPins = this.getUserPinnedSubmodules(userId);
    const maxLimit = this.getMaxPinnedSubmodules();
    if (currentPins.length >= maxLimit) {
      return { 
        success: false, 
        code: 'LIMIT_REACHED', 
        message: `You can pin a maximum of ${maxLimit} sub-modules. Unpin one to add another.` 
      };
    }

    const nextOrder = currentPins.length + 1;
    const now = new Date().toISOString();
    const newPin = {
      id: `PIN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: userId,
      submodule_id: submoduleId,
      display_order: nextOrder,
      created_at: now,
      updated_at: now
    };

    this.data.userPinnedSubmodules.push(newPin);
    this.logUserPinnedAudit(userId, 'PIN_SUBMODULE', submoduleId, { display_order: nextOrder }, user);
    this.saveData();
    this.emitChange('userPinnedSubmodules');

    return { 
      success: true, 
      pin: newPin, 
      currentCount: currentPins.length + 1, 
      maxLimit 
    };
  }

  unpinUserSubmodule(userId, submoduleId, user = null) {
    if (!userId || !submoduleId) {
      return { success: false, message: 'User ID and Sub-module ID are required.' };
    }
    if (!Array.isArray(this.data.userPinnedSubmodules)) {
      this.data.userPinnedSubmodules = [];
      return { success: true };
    }

    const initialLen = this.data.userPinnedSubmodules.length;
    this.data.userPinnedSubmodules = this.data.userPinnedSubmodules.filter(p => !(p.user_id === userId && p.submodule_id === submoduleId));
    
    if (this.data.userPinnedSubmodules.length < initialLen) {
      // Re-normalize display_order 1..N
      const userPins = this.data.userPinnedSubmodules
        .filter(p => p.user_id === userId)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      
      userPins.forEach((p, idx) => {
        p.display_order = idx + 1;
        p.updated_at = new Date().toISOString();
      });

      this.logUserPinnedAudit(userId, 'UNPIN_SUBMODULE', submoduleId, {}, user);
      this.saveData();
      this.emitChange('userPinnedSubmodules');
    }

    return { success: true };
  }

  reorderUserPinnedSubmodules(userId, orderedSubmoduleIds, user = null) {
    if (!userId || !Array.isArray(orderedSubmoduleIds)) {
      return { success: false, message: 'Invalid reorder parameters.' };
    }

    if (!Array.isArray(this.data.userPinnedSubmodules)) {
      this.data.userPinnedSubmodules = [];
      return { success: true };
    }

    const userPins = this.data.userPinnedSubmodules.filter(p => p.user_id === userId);
    const now = new Date().toISOString();

    orderedSubmoduleIds.forEach((subId, idx) => {
      const pin = userPins.find(p => p.submodule_id === subId);
      if (pin) {
        pin.display_order = idx + 1;
        pin.updated_at = now;
      }
    });

    this.logUserPinnedAudit(userId, 'REORDER_PINS', 'ALL', { order: orderedSubmoduleIds }, user);
    this.saveData();
    this.emitChange('userPinnedSubmodules');

    return { success: true, count: userPins.length };
  }

  resetUserPinnedSubmodules(userId, user = null) {
    if (!userId) {
      return { success: false, message: 'User ID is required to reset pins.' };
    }

    if (!Array.isArray(this.data.userPinnedSubmodules)) {
      this.data.userPinnedSubmodules = [];
      return { success: true };
    }

    const removedCount = this.data.userPinnedSubmodules.filter(p => p.user_id === userId).length;
    this.data.userPinnedSubmodules = this.data.userPinnedSubmodules.filter(p => p.user_id !== userId);

    this.logUserPinnedAudit(userId, 'RESET_ALL_PINS', 'ALL', { removedCount }, user);
    this.saveData();
    this.emitChange('userPinnedSubmodules');

    return { success: true, removedCount };
  }

  logUserPinnedAudit(userId, action, submoduleId, details = {}, user = null) {
    if (!Array.isArray(this.data.userPinnedAuditLogs)) {
      this.data.userPinnedAuditLogs = [];
    }

    const activeUser = user || (typeof window !== 'undefined' && window.State && typeof window.State.getCurrentUser === 'function' ? window.State.getCurrentUser() : null);
    const username = activeUser ? (activeUser.full_name || activeUser.username || activeUser.id) : (userId || 'System');

    this.data.userPinnedAuditLogs.push({
      id: `PINAUD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId,
      submodule_id: submoduleId,
      action: action,
      details: details,
      performed_by: username,
      timestamp: new Date().toISOString()
    });
  }

  getUserPinnedAuditLogs(userId = null) {
    const logs = Array.isArray(this.data.userPinnedAuditLogs) ? this.data.userPinnedAuditLogs : [];
    if (!userId) return logs;
    return logs.filter(l => l.user_id === userId);
  }

  // =========================================================================
  // FAVOURITE VEHICLE MODELS PREFERENCES (User-Scoped & Master-Safe)
  // Ensures favourite markers are personal to each user and do NOT mutate vehicle master data
  // =========================================================================
  getUserFavouriteVehicleModelIds(userId = null) {
    const targetUserId = userId || (typeof window !== 'undefined' && window.State && typeof window.State.getCurrentUserId === 'function' ? window.State.getCurrentUserId() : 'USR-001');
    if (!targetUserId) return [];

    if (!Array.isArray(this.data.userFavouriteVehicles)) {
      this.data.userFavouriteVehicles = [];
    }

    let localFavs = [];
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`STOCKIQ_FAV_VEHICLES_${targetUserId}`);
        if (raw) localFavs = JSON.parse(raw);
      }
    } catch (_) {}

    const dbFavs = this.data.userFavouriteVehicles
      .filter(f => f && f.user_id === targetUserId)
      .map(f => f.model_id);

    const merged = Array.from(new Set([...dbFavs, ...(Array.isArray(localFavs) ? localFavs : [])]));
    return merged;
  }

  isVehicleModelFavourite(userId, modelId) {
    if (!modelId) return false;
    const favs = this.getUserFavouriteVehicleModelIds(userId);
    return favs.includes(modelId);
  }

  toggleVehicleModelFavourite(userId, modelId, user = null) {
    const targetUserId = userId || (typeof window !== 'undefined' && window.State && typeof window.State.getCurrentUserId === 'function' ? window.State.getCurrentUserId() : 'USR-001');
    if (!targetUserId || !modelId) {
      return { success: false, message: 'User ID and Vehicle Model ID are required.' };
    }

    if (!Array.isArray(this.data.userFavouriteVehicles)) {
      this.data.userFavouriteVehicles = [];
    }

    const existingIdx = this.data.userFavouriteVehicles.findIndex(f => f && f.user_id === targetUserId && f.model_id === modelId);
    let isFav = false;

    if (existingIdx >= 0) {
      // Unmark favourite
      this.data.userFavouriteVehicles.splice(existingIdx, 1);
      isFav = false;
    } else {
      // Mark as favourite (stored strictly in user preference table - NOT in vehicleModels master)
      this.data.userFavouriteVehicles.push({
        id: `FAV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        user_id: targetUserId,
        model_id: modelId,
        created_at: new Date().toISOString()
      });
      isFav = true;
    }

    // Persist immediately in user-specific localStorage key
    try {
      if (typeof localStorage !== 'undefined') {
        const favIds = this.data.userFavouriteVehicles
          .filter(f => f && f.user_id === targetUserId)
          .map(f => f.model_id);
        localStorage.setItem(`STOCKIQ_FAV_VEHICLES_${targetUserId}`, JSON.stringify(favIds));
      }
    } catch (_) {}

    this.saveData();
    this.emitChange('userFavouriteVehicles');

    return {
      success: true,
      isFavourite: isFav,
      modelId: modelId,
      userId: targetUserId
    };
  }

  setVehicleModelFavourite(userId, modelId, isFavourite, user = null) {
    const targetUserId = userId || (typeof window !== 'undefined' && window.State && typeof window.State.getCurrentUserId === 'function' ? window.State.getCurrentUserId() : 'USR-001');
    if (!targetUserId || !modelId) {
      return { success: false, message: 'User ID and Vehicle Model ID are required.' };
    }

    if (!Array.isArray(this.data.userFavouriteVehicles)) {
      this.data.userFavouriteVehicles = [];
    }

    const existingIdx = this.data.userFavouriteVehicles.findIndex(f => f && f.user_id === targetUserId && f.model_id === modelId);

    if (!isFavourite && existingIdx >= 0) {
      this.data.userFavouriteVehicles.splice(existingIdx, 1);
    } else if (isFavourite && existingIdx === -1) {
      this.data.userFavouriteVehicles.push({
        id: `FAV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        user_id: targetUserId,
        model_id: modelId,
        created_at: new Date().toISOString()
      });
    }

    try {
      if (typeof localStorage !== 'undefined') {
        const favIds = this.data.userFavouriteVehicles
          .filter(f => f && f.user_id === targetUserId)
          .map(f => f.model_id);
        localStorage.setItem(`STOCKIQ_FAV_VEHICLES_${targetUserId}`, JSON.stringify(favIds));
      }
    } catch (_) {}

    this.saveData();
    this.emitChange('userFavouriteVehicles');

    return { success: true, isFavourite: !!isFavourite, modelId, userId: targetUserId };
  }
}

// Global Singleton Instance
if (typeof window !== 'undefined') {
  window.DB = new DatabaseLayer();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DatabaseLayer };
}
