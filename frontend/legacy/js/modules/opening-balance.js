/* ==========================================================================
   ENTERPRISE ISCM - OPENING BALANCE MANAGEMENT MODULE
   Conforming to Business Requirements Document (BRD Version 1.0)
   Multi-Company | Multi-Facility | Multi-Store | Multi-Year Migration
   ========================================================================== */

window.OpeningBalanceModule = {
  activeTab: 'INVENTORY', // INVENTORY | CONFIG
  selectedCompany: 'COMP-01',
  selectedPlant: 'ALL',
  selectedStore: 'ALL',
  selectedYear: '2026-2027',
  searchQuery: '',
  statusFilter: 'ALL',

  /* -------------------------------------------------------------------------
     INITIALIZATION & SEEDING
     ------------------------------------------------------------------------- */
  initDefaults() {
    if (!window.DB || typeof window.DB.getAll !== 'function') return;

    // Purge removed domains from memory and storage
    if (window.DB.data) {
      delete window.DB.data.openingCustomerBalances;
      delete window.DB.data.openingSupplierBalances;
      delete window.DB.data.openingLedgerBalances;
      if (typeof window.DB.saveData === 'function') {
        window.DB.saveData();
      }
    }

    // 1. Inventory Batches
    if (!window.DB.getAll('openingInventoryBatches') || window.DB.getAll('openingInventoryBatches').length === 0) {
      const defaultBatches = [
        {
          id: 'OB-INV-001',
          batch_no: 'OB/INV/2026/0001',
          company_id: 'COMP-01',
          company_name: 'Mauli Service Center Pvt. Ltd.',
          plant_id: 'PLANT-01',
          plant_name: 'Mauli Service Center 1 – Ravet',
          warehouse_id: 'WH-PUN-MAIN',
          store_name: 'Ravet Main Store',
          financial_year: '2026-2027',
          opening_date: '2026-04-01',
          ref_no: 'LEGACY-SAP-MIG-01',
          source_system: 'Excel / Legacy ERP',
          status: 'POSTED',
          remarks: 'Baseline opening stock migrated at system cutover',
          created_by: 'Pravin Patil',
          created_at: '2026-04-01T09:00:00.000Z',
          posted_at: '2026-04-01T11:30:00.000Z',
          posted_by: 'Pravin Patil',
          items: [
            {
              item_code: '2W-ENG-OIL-10W30',
              item_name: 'Engine Oil 10W-30 (Synthetic)',
              category: 'LUBRICANTS',
              uom: 'LTR',
              store_id: 'WH-PUN-MAIN',
              bin_id: 'BIN-PUN-L01',
              batch_no: 'LOT-2026-001',
              serial_no: '',
              mfg_date: '2026-01-15',
              expiry_date: '2029-01-15',
              opening_qty: 120,
              unit_cost: 280,
              gross_value: 33600,
              net_value: 33600
            },
            {
              item_code: '2W-BRK-PAD-01',
              item_name: 'Front Disc Brake Pad Set',
              category: 'BRAKES',
              uom: 'SET',
              store_id: 'WH-PUN-MAIN',
              bin_id: 'BIN-PUN-A01',
              batch_no: 'LOT-2026-002',
              serial_no: '',
              mfg_date: '2026-02-10',
              expiry_date: '2031-02-10',
              opening_qty: 45,
              unit_cost: 150,
              gross_value: 6750,
              net_value: 6750
            },
            {
              item_code: '2W-SPR-ENGINE-GASKET-KIT-006',
              item_name: 'Engine Overhaul Gasket Kit',
              category: 'ENGINE_PARTS',
              uom: 'KIT',
              store_id: 'WH-PUN-MAIN',
              bin_id: 'BIN-PUN-A02',
              batch_no: 'LOT-2026-003',
              serial_no: '',
              mfg_date: '2026-01-20',
              expiry_date: '2030-01-20',
              opening_qty: 25,
              unit_cost: 450,
              gross_value: 11250,
              net_value: 11250
            },
            {
              item_code: '2W-SPK-PLUG-NGK',
              item_name: 'NGK Spark Plug Copper Core',
              category: 'ELECTRICALS',
              uom: 'NOS',
              store_id: 'WH-PUN-MAIN',
              bin_id: 'BIN-PUN-E01',
              batch_no: 'LOT-2026-004',
              serial_no: '',
              mfg_date: '2026-03-01',
              expiry_date: '2031-03-01',
              opening_qty: 80,
              unit_cost: 95,
              gross_value: 7600,
              net_value: 7600
            }
          ]
        },
        {
          id: 'OB-INV-002',
          batch_no: 'OB/INV/2026/0002',
          company_id: 'COMP-01',
          company_name: 'Mauli Service Center Pvt. Ltd.',
          plant_id: 'PLANT-01',
          plant_name: 'Mauli Service Center 1 – Ravet',
          warehouse_id: 'WH-STR-WORKSHOP',
          store_name: 'Ravet Workshop Store',
          financial_year: '2026-2027',
          opening_date: '2026-04-02',
          ref_no: 'WORKSHOP-FLOOR-CUTOVER',
          source_system: 'Store Physical Count',
          status: 'APPROVED',
          remarks: 'Approved by Store Manager, pending final posting',
          created_by: 'Sanket Borole',
          created_at: '2026-04-02T10:15:00.000Z',
          approved_by: 'Pravin Patil',
          approved_at: '2026-04-02T14:00:00.000Z',
          items: [
            {
              item_code: '2W-CHN-LUBE-SPRAY',
              item_name: 'Drive Chain Lube Spray (500ml)',
              category: 'CONSUMABLES',
              uom: 'CAN',
              store_id: 'WH-STR-WORKSHOP',
              bin_id: 'BIN-WRK-B01',
              batch_no: 'LOT-2026-005',
              serial_no: '',
              mfg_date: '2026-02-01',
              expiry_date: '2028-02-01',
              opening_qty: 30,
              unit_cost: 165,
              gross_value: 4950,
              net_value: 4950
            },
            {
              item_code: '2W-COOL-FLUID-1L',
              item_name: 'Radiator Coolant Fluid 1L Premix',
              category: 'CONSUMABLES',
              uom: 'BTL',
              store_id: 'WH-STR-WORKSHOP',
              bin_id: 'BIN-WRK-C01',
              batch_no: 'LOT-2026-006',
              serial_no: '',
              mfg_date: '2026-01-10',
              expiry_date: '2028-01-10',
              opening_qty: 20,
              unit_cost: 130,
              gross_value: 2600,
              net_value: 2600
            }
          ]
        }
      ];
      defaultBatches.forEach(b => window.DB.insert('openingInventoryBatches', b));
    }

    // 5. Configuration Master
    if (!window.DB.getAll('openingBalanceConfig') || window.DB.getAll('openingBalanceConfig').length === 0) {
      window.DB.insert('openingBalanceConfig', {
        id: 'OBC-001',
        config_code: 'OBC-2026-01',
        config_name: 'Standard Financial Opening Policy',
        company_id: 'COMP-01',
        company_name: 'Mauli Service Center Pvt. Ltd.',
        plant_id: 'PLANT-01',
        effective_from: '2026-04-01',
        effective_to: '2027-03-31',
        approval_required: true,
        excel_import_allowed: true,
        negative_stock_allowed: false,
        backdated_entry_allowed: true,
        edit_after_posting: false,
        active_status: 'ACTIVE'
      });
    }
  },

  /* -------------------------------------------------------------------------
     RENDER MAIN VIEW
     ------------------------------------------------------------------------- */
  /* -------------------------------------------------------------------------
     HEADER ACTIONS & HIERARCHY FILTERS (BRD §5)
     ------------------------------------------------------------------------- */
  getFiltersHtml() {
    return `
      <div class="ob-header-filters" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 9.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px;">Company</span>
          <select id="ob-company-sel" class="form-control" style="font-size: 11.5px; height: 32px; padding: 2px 8px; width: auto; min-width: 170px;" onchange="window.OpeningBalanceModule.setCompany(this.value)">
            <option value="COMP-01" selected>Mauli Service Center Pvt. Ltd.</option>
          </select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 9.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px;">Facility / Branch</span>
          <select id="ob-plant-sel" class="form-control" style="font-size: 11.5px; height: 32px; padding: 2px 8px; width: auto; min-width: 170px;" onchange="window.OpeningBalanceModule.setPlant(this.value)">
            <option value="ALL">All Facilities</option>
            ${(window.DB.getAll('plants') || []).map(p => `<option value="${p.id}" ${this.selectedPlant === p.id ? 'selected' : ''}>${p.name || p.id}</option>`).join('')}
          </select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 9.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px;">Financial Year</span>
          <select id="ob-year-sel" class="form-control" style="font-size: 11.5px; height: 32px; padding: 2px 8px; width: auto; min-width: 110px;" onchange="window.OpeningBalanceModule.setYear(this.value)">
            <option value="2026-2027" ${this.selectedYear === '2026-2027' ? 'selected' : ''}>2026–2027</option>
            <option value="2025-2026" ${this.selectedYear === '2025-2026' ? 'selected' : ''}>2025–2026</option>
          </select>
        </div>
      </div>
    `;
  },

  /* -------------------------------------------------------------------------
     RENDER MAIN VIEW
     ------------------------------------------------------------------------- */
  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    this.initDefaults();

    // Auto-sync tab with URL route hash if navigated via dedicated route
    const hash = (typeof window !== 'undefined' && window.location && window.location.hash) ? window.location.hash : '';
    if (hash.startsWith('#/opening-balance-config')) this.activeTab = 'CONFIG';
    else this.activeTab = 'INVENTORY';

    // Hide breadcrumbs (clean header without redundant path tags)
    const breadcrumbsWrap = (typeof document !== 'undefined') ? document.querySelector('.breadcrumbs') : null;
    if (breadcrumbsWrap) {
      breadcrumbsWrap.innerHTML = '';
      breadcrumbsWrap.style.display = 'none';
    }

    // Check if page top bar actions container is available
    const pageActions = (typeof document !== 'undefined') ? document.getElementById('page-actions-container') : null;
    const pageTopBar = (typeof document !== 'undefined') ? document.getElementById('page-top-bar') : null;
    const isTopBarVisible = pageTopBar && pageTopBar.style && pageTopBar.style.display !== 'none';
    if (pageActions) {
      pageActions.innerHTML = this.getFiltersHtml();
      if (typeof window !== 'undefined' && window.PinnedSubmodulesModule && typeof window.PinnedSubmodulesModule.updateScreenHeaderPinButton === 'function') {
        window.PinnedSubmodulesModule.updateScreenHeaderPinButton();
      }
    }

    container.innerHTML = `
      ${window.renderInventoryLogisticsTabs ? window.renderInventoryLogisticsTabs('#/opening-balance') : ''}
      <div class="opening-balance-module" style="display: flex; flex-direction: column; gap: 14px; padding-bottom: 30px;">
        
        <!-- Navigation Tabs & Hierarchy Filters (Compact Single Row) -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-subtle); padding-bottom: 6px; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; gap: 6px; overflow-x: auto; flex-wrap: nowrap;">
            <button type="button" class="btn ${this.activeTab === 'INVENTORY' ? 'btn-primary' : 'btn-ghost'} ob-nav-tab-btn" data-tab="INVENTORY" onclick="window.OpeningBalanceModule.switchTab('INVENTORY')" style="font-size: 12.5px; padding: 6px 16px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">
              <span>📦</span> <span>Inventory Opening Balance</span>
            </button>
            <button type="button" class="btn ${this.activeTab === 'CONFIG' ? 'btn-primary' : 'btn-ghost'} ob-nav-tab-btn" data-tab="CONFIG" onclick="window.OpeningBalanceModule.switchTab('CONFIG')" style="font-size: 12.5px; padding: 6px 16px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">
              <span>⚙️</span> <span>Policy & Configuration</span>
            </button>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${this.getFiltersHtml()}
          </div>
        </div>

        <!-- Dynamic Tab Body Container -->
        <div id="ob-tab-body">
          ${this.renderActiveTabContent()}
        </div>

      </div>
    `;
  },

  switchTab(tabKey) {
    this.activeTab = tabKey;
    const body = document.getElementById('ob-tab-body');
    if (body) {
      body.innerHTML = this.renderActiveTabContent();
      const tabBtns = document.querySelectorAll('.ob-nav-tab-btn');
      tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabKey) {
          btn.className = 'btn btn-primary ob-nav-tab-btn';
        } else {
          btn.className = 'btn btn-ghost ob-nav-tab-btn';
        }
      });
    } else {
      this.render();
    }
  },

  setCompany(comp) {
    this.selectedCompany = comp;
    this.render();
  },

  setPlant(plant) {
    this.selectedPlant = plant;
    this.render();
  },

  setYear(yr) {
    this.selectedYear = yr;
    this.render();
  },

  renderActiveTabContent() {
    switch (this.activeTab) {
      case 'CONFIG': return this.renderConfigTab();
      case 'INVENTORY':
      default:
        return this.renderInventoryTab();
    }
  },

  /* -------------------------------------------------------------------------
     TAB 2: INVENTORY OPENING BALANCE (BRD §9)
     ------------------------------------------------------------------------- */
  renderInventoryTab() {
    const allBatches = window.DB.getAll('openingInventoryBatches') || [];
    const stores = window.DB.getAll('warehouses') || [];

    const filtered = allBatches.filter(b => {
      if (this.selectedPlant !== 'ALL' && b.plant_id !== this.selectedPlant) return false;
      if (this.selectedStore !== 'ALL' && b.warehouse_id !== this.selectedStore) return false;
      if (this.statusFilter !== 'ALL' && b.status !== this.statusFilter) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchBatch = (b.batch_no || '').toLowerCase().includes(q);
        const matchStore = (b.store_name || '').toLowerCase().includes(q);
        const matchRef = (b.ref_no || '').toLowerCase().includes(q);
        const matchItem = (b.items || []).some(it => (it.item_code || '').toLowerCase().includes(q) || (it.item_name || '').toLowerCase().includes(q));
        if (!matchBatch && !matchStore && !matchRef && !matchItem) return false;
      }
      return true;
    });

    const paged = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'opening-balance')
      : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    return `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        
        <!-- Toolbar & Filter Row -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; flex: 1;">
            <div style="position: relative; width: 260px;">
              <input type="text" class="form-control" placeholder="Search batch, store, item code..." value="${this.searchQuery}" oninput="window.OpeningBalanceModule.setSearch(this.value)" style="height: 33px; font-size: 12px; padding-left: 32px !important;">
              <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 13px; color: var(--text-muted); pointer-events: none;">🔍</span>
            </div>
            <select class="form-control" style="width: auto; min-width: 160px; height: 33px; font-size: 12px;" onchange="window.OpeningBalanceModule.setStoreFilter(this.value)">
              <option value="ALL">All Stores</option>
              ${stores.map(s => `<option value="${s.id}" ${this.selectedStore === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
            <select class="form-control" style="width: auto; min-width: 140px; height: 33px; font-size: 12px;" onchange="window.OpeningBalanceModule.setStatusFilter(this.value)">
              <option value="ALL">All Statuses</option>
              <option value="DRAFT" ${this.statusFilter === 'DRAFT' ? 'selected' : ''}>Draft</option>
              <option value="SUBMITTED" ${this.statusFilter === 'SUBMITTED' ? 'selected' : ''}>Submitted</option>
              <option value="APPROVED" ${this.statusFilter === 'APPROVED' ? 'selected' : ''}>Approved</option>
              <option value="POSTED" ${this.statusFilter === 'POSTED' ? 'selected' : ''}>Posted</option>
            </select>
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.OpeningBalanceModule.showImportExcelModal()" style="display: inline-flex; align-items: center; gap: 5px;">
              <span>📥</span> <span>Import Template</span>
            </button>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.OpeningBalanceModule.showNewInventoryBatchModal()" style="display: inline-flex; align-items: center; gap: 5px; font-weight: 700;">
              <span>+ Record Opening Stock</span>
            </button>
          </div>
        </div>

        <!-- Inventory Batches Table -->
        <div class="content-card" style="margin: 0; padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
          <div class="table-responsive">
            <table class="data-table" style="width: 100%; font-size: 12px; margin: 0;">
              <thead>
                <tr>
                  <th>Batch Number</th>
                  <th>Store / Facility</th>
                  <th>Opening Date</th>
                  <th>Source & Reference</th>
                  <th class="text-center">Items</th>
                  <th class="text-right">Total Quantity</th>
                  <th class="text-right">Total Net Valuation</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${paged.items.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align: center; padding: 30px; color: var(--text-muted);">
                      No inventory opening balance batches found matching your criteria.
                      <div style="margin-top: 8px;">
                        <button type="button" class="btn btn-primary btn-sm" onclick="window.OpeningBalanceModule.showNewInventoryBatchModal()">+ Record Opening Stock Batch</button>
                      </div>
                    </td>
                  </tr>
                ` : paged.items.map(b => {
                  const totalQty = (b.items || []).reduce((sum, it) => sum + Number(it.opening_qty || 0), 0);
                  const totalVal = (b.items || []).reduce((sum, it) => sum + Number(it.net_value || (it.opening_qty * it.unit_cost) || 0), 0);
                  return `
                    <tr>
                      <td>
                        <div class="cell-mono cell-strong" style="color: var(--primary-300); font-weight: 700;">${b.batch_no}</div>
                        <div style="font-size: 10.5px; color: var(--text-muted);">FY: ${b.financial_year || '2026-2027'}</div>
                      </td>
                      <td>
                        <div style="font-weight: 600; color: var(--text-primary);">${b.store_name}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${b.plant_name || b.plant_id}</div>
                      </td>
                      <td>${window.formatDate(b.opening_date)}</td>
                      <td>
                        <div style="font-weight: 500;">${b.source_system || 'Manual Entry'}</div>
                        <div class="cell-mono" style="font-size: 10.5px; color: var(--text-muted);">${b.ref_no || '—'}</div>
                      </td>
                      <td class="text-center font-mono font-bold">${(b.items || []).length}</td>
                      <td class="text-right cell-mono font-bold">${totalQty.toLocaleString('en-IN')}</td>
                      <td class="text-right cell-mono font-bold" style="color: var(--color-success); font-size: 13px;">₹${totalVal.toLocaleString('en-IN')}</td>
                      <td>${this.getStatusBadge(b.status)}</td>
                      <td class="text-right" style="white-space: nowrap;">
                        <button type="button" class="btn btn-icon btn-sm" onclick="window.OpeningBalanceModule.viewInventoryBatch('${b.id}')" title="View Batch Details">
                          ${window.AppIcons ? window.AppIcons.svgView : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'}
                        </button>
                        ${b.status === 'DRAFT' ? `
                          <button type="button" class="btn btn-primary btn-xs" onclick="window.OpeningBalanceModule.submitInventoryBatch('${b.id}')" title="Submit for Approval" style="height: 26px; padding: 0 8px;">📤 Submit</button>
                          <button type="button" class="btn btn-icon btn-sm" onclick="window.OpeningBalanceModule.showNewInventoryBatchModal('${b.id}')" title="Edit Batch">
                            ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
                          </button>
                        ` : ''}
                        ${b.status === 'SUBMITTED' ? `
                          <button type="button" class="btn btn-warning btn-xs" onclick="window.OpeningBalanceModule.approveInventoryBatch('${b.id}')" title="Approve Batch">✓ Approve</button>
                        ` : ''}
                        ${b.status === 'APPROVED' ? `
                          <button type="button" class="btn btn-success btn-xs" onclick="window.OpeningBalanceModule.postInventoryBatch('${b.id}')" title="Post to Live Stock Ledger">🚀 Post Stock</button>
                        ` : ''}
                        ${b.status === 'POSTED' ? `
                          <span class="badge badge-subtle" style="font-size: 10px; color: var(--color-success);" title="Posted to Live Stock Ledger">✓ Locked</span>
                        ` : ''}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          key: 'opening-balance',
          pagination: paged,
          onPageChange: 'window.OpeningBalanceModule.setPage',
          onPageSizeChange: 'window.OpeningBalanceModule.setPageSize'
        }) : ''}

      </div>
    `;
  },



  /* -------------------------------------------------------------------------
     TAB 6: POLICY & CONFIGURATION (BRD §8)
     ------------------------------------------------------------------------- */
  renderConfigTab() {
    const config = (window.DB.getAll('openingBalanceConfig') || [])[0] || {};

    return `
      <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 20px; max-width: 800px;">
        <div style="font-size: 14px; font-weight: 700; color: var(--primary-300); margin-bottom: 14px; text-transform: uppercase;">
          ⚙️ Opening Balance Configuration Master (BRD §8)
        </div>
        
        <form onsubmit="window.OpeningBalanceModule.saveConfig(event)" style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Configuration Code</label>
              <input type="text" id="cfg-code" class="form-control cell-mono" value="${config.config_code || 'OBC-2026-01'}" readonly>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Configuration Name</label>
              <input type="text" id="cfg-name" class="form-control" value="${config.config_name || 'Standard Financial Opening Policy'}" required>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Effective From Date</label>
              <input type="date" id="cfg-from" class="form-control" value="${config.effective_from || '2026-04-01'}" required>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Effective To Date</label>
              <input type="date" id="cfg-to" class="form-control" value="${config.effective_to || '2027-03-31'}">
            </div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.15); border-radius: 6px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12.5px; font-weight: 600;">
              <input type="checkbox" id="cfg-approval" ${config.approval_required !== false ? 'checked' : ''}>
              <span>Requires Two-Step Review & Approval before Posting (Maker-Checker)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12.5px; font-weight: 600;">
              <input type="checkbox" id="cfg-excel" ${config.excel_import_allowed !== false ? 'checked' : ''}>
              <span>Allow Bulk Excel / CSV Import of Opening Balances</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12.5px; font-weight: 600;">
              <input type="checkbox" id="cfg-negative" ${config.negative_stock_allowed ? 'checked' : ''}>
              <span>Allow Negative Opening Stock (Strictly Blocked by Default)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12.5px; font-weight: 600;">
              <input type="checkbox" id="cfg-backdated" ${config.backdated_entry_allowed !== false ? 'checked' : ''}>
              <span>Allow Backdated Opening Effective Cutover Date</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12.5px; font-weight: 600; color: #f59e0b;">
              <input type="checkbox" id="cfg-edit-after" ${config.edit_after_posting ? 'checked' : ''}>
              <span>Allow Editing After Posting (Caution: Disabled by default for audit safety)</span>
            </label>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
            <button type="submit" class="btn btn-primary" style="padding: 8px 24px; font-weight: 700;">Save Configuration</button>
          </div>
        </form>
      </div>
    `;
  },

  /* -------------------------------------------------------------------------
     MODALS: INVENTORY OPENING BATCH (BRD §9)
     ------------------------------------------------------------------------- */
  showNewInventoryBatchModal(editBatchId = null) {
    const existing = editBatchId ? (window.DB.getAll('openingInventoryBatches') || []).find(b => b.id === editBatchId) : null;
    const allPlants = window.DB.getAll('plants') || [];
    const allStores = window.DB.getAll('warehouses') || [];
    const allItems = window.DB.getAll('items') || [];

    const batchNo = existing ? existing.batch_no : `OB/INV/2026/${String((window.DB.getAll('openingInventoryBatches') || []).length + 1).padStart(4, '0')}`;
    const initialItems = existing ? existing.items : [
      { item_code: '', item_name: '', category: '', uom: 'NOS', store_id: (allStores[0] || {}).id || 'WH-PUN-MAIN', bin_id: 'BIN-PUN-A01', batch_no: '', serial_no: '', mfg_date: '', expiry_date: '', opening_qty: 1, unit_cost: 0, gross_value: 0, net_value: 0 }
    ];

    window._obBatchItemRows = JSON.parse(JSON.stringify(initialItems));

    const contentHtml = `
      <form id="ob-batch-form" class="ob-compact-form" onsubmit="window.OpeningBalanceModule.saveInventoryBatch(event, '${editBatchId || ''}')">
        
        <!-- Header Grid: Compact 5-column layout -->
        <div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; background: rgba(255, 255, 255, 0.02); padding: 8px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div class="form-group">
            <label class="form-label">Opening Batch No</label>
            <input type="text" id="batch-no" class="form-control cell-mono" value="${batchNo}" readonly>
          </div>
          <div class="form-group">
            <label class="form-label">Facility / Branch <span style="color: var(--color-danger);">*</span></label>
            <select id="batch-plant" class="form-control" required onchange="window.OpeningBalanceModule.updateStoreOptionsInModal(this.value)">
              ${allPlants.map(p => `<option value="${p.id}" ${existing && existing.plant_id === p.id ? 'selected' : ''}>${p.name || p.id}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Store <span style="color: var(--color-danger);">*</span></label>
            <select id="batch-store" class="form-control" required>
              ${allStores.map(s => `<option value="${s.id}" ${existing && existing.warehouse_id === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Opening Date <span style="color: var(--color-danger);">*</span></label>
            <input type="date" id="batch-date" class="form-control" value="${existing ? existing.opening_date : '2026-04-01'}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Reference / Note</label>
            <input type="text" id="batch-ref" class="form-control" placeholder="e.g. Count Sheet #12" value="${existing ? (existing.ref_no || '') : ''}">
          </div>
        </div>

        <!-- Line Items Section -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
            <span style="font-size: 11.5px; font-weight: 700; color: var(--primary-300); text-transform: uppercase; letter-spacing: 0.3px;">Spare Parts & Inventory Lines</span>
            <button type="button" class="btn btn-outline btn-xs" onclick="window.OpeningBalanceModule.addBatchItemRow()" style="height: 26px; padding: 0 10px; font-size: 11px; font-weight: 600;">+ Add Line Item</button>
          </div>

          <div class="table-responsive ob-modal-table-wrap" style="max-height: 48vh; overflow-y: auto; overflow-x: auto; border: 1px solid var(--border-subtle); border-radius: 6px;">
            <table class="data-table" style="font-size: 11px; width: 100%; margin: 0; table-layout: fixed;">
              <thead style="position: sticky; top: 0; background: #0f172a; z-index: 2;">
                <tr>
                  <th style="width: 32%; min-width: 170px;">Item Code & Name</th>
                  <th style="width: 15%; min-width: 95px;">Bin Location</th>
                  <th style="width: 15%; min-width: 95px;">Batch / Lot No</th>
                  <th class="text-right" style="width: 12%; min-width: 70px;">Opening Qty</th>
                  <th class="text-right" style="width: 12%; min-width: 80px;">Unit Cost (₹)</th>
                  <th class="text-right" style="width: 14%; min-width: 90px;">Net Value (₹)</th>
                  <th class="text-center" style="width: 34px;"></th>
                </tr>
              </thead>
              <tbody id="ob-batch-items-tbody">
                ${this.renderBatchItemRowsHtml(allItems)}
              </tbody>
              <tfoot style="background: rgba(0,0,0,0.25); font-weight: 700;">
                <tr>
                  <td colspan="3" style="text-align: right; padding: 6px 8px; font-size: 11px;">Batch Totals:</td>
                  <td class="text-right cell-mono font-bold" id="batch-total-qty" style="padding: 6px 8px; font-size: 11px;">0</td>
                  <td></td>
                  <td class="text-right cell-mono font-bold" style="color: var(--color-success); padding: 6px 8px; font-size: 11.5px;" id="batch-total-val">₹0.00</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 8px; margin-top: 2px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.State.closeModal()" style="height: 30px; font-size: 11.5px; padding: 0 14px;">Cancel</button>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.OpeningBalanceModule.saveInventoryBatch(event, '${editBatchId || ''}', 'DRAFT')" style="height: 30px; font-size: 11.5px; padding: 0 14px;">Save as Draft</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.OpeningBalanceModule.saveInventoryBatch(event, '${editBatchId || ''}', 'SUBMITTED')" style="height: 30px; font-size: 11.5px; padding: 0 16px; font-weight: 700;">Save Opening Balance</button>
          </div>
        </div>
      </form>
    `;

    window.State.showModal({
      title: editBatchId ? `Edit Opening Stock Batch: ${batchNo}` : `Record Inventory Opening Balance`,
      contentHtml,
      maxWidth: '960px'
    });

    setTimeout(() => this.recalculateBatchTotals(), 50);
  },

  renderBatchItemRowsHtml(allItems = null) {
    if (!allItems) allItems = window.DB.getAll('items') || [];
    const rows = window._obBatchItemRows || [];

    return rows.map((r, idx) => `
      <tr data-row-idx="${idx}">
        <td style="padding: 4px 6px;">
          <select class="form-control" style="font-size: 11px; height: 26px; padding: 2px 4px;" onchange="window.OpeningBalanceModule.onBatchItemSelect(${idx}, this.value)">
            <option value="">-- Select SKU / Part --</option>
            ${allItems.map(it => `<option value="${it.item_code || it.code}" ${(r.item_code === (it.item_code || it.code)) ? 'selected' : ''}>${it.item_code || it.code} - ${it.item_name || it.name}</option>`).join('')}
          </select>
          <div style="font-size: 9.5px; color: var(--text-muted); margin-top: 1px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.item_name || ''}">${r.item_name || 'Select spare part'}</div>
        </td>
        <td style="padding: 4px 6px;">
          <input type="text" class="form-control cell-mono" style="font-size: 11px; height: 26px; padding: 2px 6px;" value="${r.bin_id || 'BIN-PUN-A01'}" oninput="window._obBatchItemRows[${idx}].bin_id = this.value">
        </td>
        <td style="padding: 4px 6px;">
          <input type="text" class="form-control cell-mono" style="font-size: 11px; height: 26px; padding: 2px 6px;" placeholder="LOT-2026-001" value="${r.batch_no || ''}" oninput="window._obBatchItemRows[${idx}].batch_no = this.value">
        </td>
        <td style="padding: 4px 6px;">
          <input type="number" min="0.01" step="any" class="form-control cell-mono text-right" style="font-size: 11px; height: 26px; padding: 2px 6px;" value="${r.opening_qty || 1}" oninput="window.OpeningBalanceModule.updateBatchRowMath(${idx}, 'qty', this.value)">
        </td>
        <td style="padding: 4px 6px;">
          <input type="number" min="0" step="0.01" class="form-control cell-mono text-right" style="font-size: 11px; height: 26px; padding: 2px 6px;" value="${r.unit_cost || 0}" oninput="window.OpeningBalanceModule.updateBatchRowMath(${idx}, 'cost', this.value)">
        </td>
        <td class="text-right cell-mono font-bold" id="row-net-${idx}" style="color: var(--color-success); font-size: 11.5px; padding: 4px 6px;">
          ₹${((r.opening_qty || 0) * (r.unit_cost || 0)).toFixed(2)}
        </td>
        <td class="text-center" style="padding: 4px;">
          <button type="button" class="btn btn-ghost btn-xs" style="color: var(--color-danger); padding: 1px 4px; font-size: 11px;" onclick="window.OpeningBalanceModule.removeBatchItemRow(${idx})" title="Remove row">✕</button>
        </td>
      </tr>
    `).join('');
  },

  addBatchItemRow() {
    if (!window._obBatchItemRows) window._obBatchItemRows = [];
    window._obBatchItemRows.push({
      item_code: '',
      item_name: '',
      category: '',
      uom: 'NOS',
      store_id: 'WH-PUN-MAIN',
      bin_id: 'BIN-PUN-A01',
      batch_no: '',
      serial_no: '',
      mfg_date: '',
      expiry_date: '',
      opening_qty: 1,
      unit_cost: 0,
      gross_value: 0,
      net_value: 0
    });
    const tbody = document.getElementById('ob-batch-items-tbody');
    if (tbody) tbody.innerHTML = this.renderBatchItemRowsHtml();
    this.recalculateBatchTotals();
  },

  removeBatchItemRow(idx) {
    if (!window._obBatchItemRows || window._obBatchItemRows.length <= 1) {
      window.State.showToast('Batch must contain at least one line item.', 'info');
      return;
    }
    window._obBatchItemRows.splice(idx, 1);
    const tbody = document.getElementById('ob-batch-items-tbody');
    if (tbody) tbody.innerHTML = this.renderBatchItemRowsHtml();
    this.recalculateBatchTotals();
  },

  onBatchItemSelect(idx, itemCode) {
    const allItems = window.DB.getAll('items') || [];
    const found = allItems.find(it => (it.item_code || it.code) === itemCode);
    if (!window._obBatchItemRows[idx]) return;

    if (found) {
      window._obBatchItemRows[idx].item_code = found.item_code || found.code;
      window._obBatchItemRows[idx].item_name = found.item_name || found.name;
      window._obBatchItemRows[idx].category = found.category || '';
      window._obBatchItemRows[idx].uom = found.uom || 'NOS';
      window._obBatchItemRows[idx].unit_cost = Number(found.standard_cost || found.cost_price || found.purchase_price || found.rate || 100);
      window._obBatchItemRows[idx].net_value = window._obBatchItemRows[idx].opening_qty * window._obBatchItemRows[idx].unit_cost;
    } else {
      window._obBatchItemRows[idx].item_code = '';
      window._obBatchItemRows[idx].item_name = '';
    }
    const tbody = document.getElementById('ob-batch-items-tbody');
    if (tbody) tbody.innerHTML = this.renderBatchItemRowsHtml();
    this.recalculateBatchTotals();
  },

  updateBatchRowMath(idx, field, val) {
    if (!window._obBatchItemRows[idx]) return;
    if (field === 'qty') window._obBatchItemRows[idx].opening_qty = Number(val || 0);
    if (field === 'cost') window._obBatchItemRows[idx].unit_cost = Number(val || 0);

    const net = (window._obBatchItemRows[idx].opening_qty || 0) * (window._obBatchItemRows[idx].unit_cost || 0);
    window._obBatchItemRows[idx].gross_value = net;
    window._obBatchItemRows[idx].net_value = net;

    const cell = document.getElementById(`row-net-${idx}`);
    if (cell) cell.innerText = `₹${net.toFixed(2)}`;
    this.recalculateBatchTotals();
  },

  recalculateBatchTotals() {
    const rows = window._obBatchItemRows || [];
    const totalQty = rows.reduce((sum, r) => sum + Number(r.opening_qty || 0), 0);
    const totalVal = rows.reduce((sum, r) => sum + Number(r.net_value || (r.opening_qty * r.unit_cost) || 0), 0);

    const qtyEl = document.getElementById('batch-total-qty');
    const valEl = document.getElementById('batch-total-val');
    if (qtyEl) qtyEl.innerText = totalQty.toLocaleString('en-IN');
    if (valEl) valEl.innerText = `₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  },

  saveInventoryBatch(e, editId = null, forcedStatus = null) {
    if (e && e.preventDefault) e.preventDefault();

    const rows = (window._obBatchItemRows || []).filter(r => r.item_code);
    if (rows.length === 0) {
      window.State.showToast('Please select at least one valid spare part SKU.', 'warning');
      return;
    }

    // Check duplicate SKU/bin within same batch
    const seen = new Set();
    for (const r of rows) {
      const key = `${r.item_code}_${r.bin_id}_${r.batch_no || 'NA'}`;
      if (seen.has(key)) {
        window.State.showToast(`Duplicate entry found for ${r.item_code} in bin ${r.bin_id}. Please consolidate quantity into one line.`, 'warning');
        return;
      }
      seen.add(key);
    }

    const plantId = document.getElementById('batch-plant') ? document.getElementById('batch-plant').value : 'PLANT-01';
    const storeId = document.getElementById('batch-store') ? document.getElementById('batch-store').value : 'WH-PUN-MAIN';
    const dateVal = document.getElementById('batch-date') ? document.getElementById('batch-date').value : '2026-04-01';
    const refVal = document.getElementById('batch-ref') ? document.getElementById('batch-ref').value.trim() : '';

    const plantObj = (window.DB.getAll('plants') || []).find(p => p.id === plantId);
    const storeObj = (window.DB.getAll('warehouses') || []).find(s => s.id === storeId);

    const status = forcedStatus || 'DRAFT';

    const batchData = {
      id: editId || `OB-INV-${Date.now()}`,
      batch_no: document.getElementById('batch-no') ? document.getElementById('batch-no').value : `OB/INV/2026/${Date.now()}`,
      company_id: 'COMP-01',
      company_name: 'Mauli Service Center Pvt. Ltd.',
      plant_id: plantId,
      plant_name: plantObj ? plantObj.name : plantId,
      warehouse_id: storeId,
      store_name: storeObj ? storeObj.name : storeId,
      financial_year: this.selectedYear,
      opening_date: dateVal,
      ref_no: refVal,
      source_system: 'Manual Entry',
      status: status,
      items: rows,
      updated_at: new Date().toISOString()
    };

    if (editId) {
      window.DB.upsert('openingInventoryBatches', batchData);
      window.State.showToast(`Opening stock batch ${batchData.batch_no} updated (${status}).`, 'success');
    } else {
      batchData.created_at = new Date().toISOString();
      batchData.created_by = (window.State && window.State.currentUser && window.State.currentUser.display_name) || 'Pravin Patil';
      window.DB.insert('openingInventoryBatches', batchData);
      window.State.showToast(`Opening stock batch ${batchData.batch_no} created successfully (${status})!`, 'success');
    }

    window.State.closeModal();
    this.render();
  },

  viewInventoryBatch(batchId) {
    const b = (window.DB.getAll('openingInventoryBatches') || []).find(x => x.id === batchId);
    if (!b) return;

    const totalQty = (b.items || []).reduce((sum, it) => sum + Number(it.opening_qty || 0), 0);
    const totalVal = (b.items || []).reduce((sum, it) => sum + Number(it.net_value || (it.opening_qty * it.unit_cost) || 0), 0);

    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div>
            <div style="font-size: 11px; color: var(--text-muted);">Batch Number</div>
            <div class="cell-mono" style="font-size: 14px; font-weight: 800; color: var(--primary-300);">${b.batch_no}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--text-muted);">Store & Branch</div>
            <div style="font-size: 13px; font-weight: 700;">${b.store_name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${b.plant_name}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--text-muted);">Opening Date & FY</div>
            <div style="font-size: 13px;">${window.formatDate(b.opening_date)} &bull; ${b.financial_year}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--text-muted);">Status</div>
            <div>${this.getStatusBadge(b.status)}</div>
          </div>
        </div>

        <div class="table-responsive" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: 6px;">
          <table class="data-table" style="font-size: 12px; width: 100%; margin: 0;">
            <thead>
              <tr>
                <th>Item Code & Description</th>
                <th>Category</th>
                <th>Bin</th>
                <th>Batch / Serial</th>
                <th class="text-right">Opening Qty</th>
                <th class="text-right">Unit Cost</th>
                <th class="text-right">Net Value</th>
              </tr>
            </thead>
            <tbody>
              ${(b.items || []).map(it => `
                <tr>
                  <td>
                    <div class="cell-mono cell-strong" style="color: var(--primary-300);">${it.item_code}</div>
                    <div style="font-size: 11.5px;">${it.item_name}</div>
                  </td>
                  <td><span class="badge badge-subtle" style="font-size: 10px;">${it.category || 'GENERAL'}</span></td>
                  <td class="cell-mono">${it.bin_id || '—'}</td>
                  <td class="cell-mono">${it.batch_no || it.serial_no || '—'}</td>
                  <td class="text-right cell-mono font-bold">${it.opening_qty} ${it.uom || 'NOS'}</td>
                  <td class="text-right cell-mono">₹${Number(it.unit_cost || 0).toFixed(2)}</td>
                  <td class="text-right cell-mono font-bold" style="color: var(--color-success);">₹${Number(it.net_value || (it.opening_qty * it.unit_cost) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot style="background: rgba(0,0,0,0.25); font-weight: 700;">
              <tr>
                <td colspan="4" style="text-align: right;">Totals:</td>
                <td class="text-right cell-mono font-bold">${totalQty} Units</td>
                <td></td>
                <td class="text-right cell-mono font-bold" style="color: var(--color-success); font-size: 13px;">₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
          <div style="display: flex; gap: 8px;">
            ${b.status === 'SUBMITTED' ? `
              <button type="button" class="btn btn-warning" onclick="window.State.closeModal(); window.OpeningBalanceModule.approveInventoryBatch('${b.id}')">✓ Approve Batch</button>
            ` : ''}
            ${b.status === 'APPROVED' ? `
              <button type="button" class="btn btn-success" onclick="window.State.closeModal(); window.OpeningBalanceModule.postInventoryBatch('${b.id}')">🚀 Post to Live Stock Ledger</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    window.State.showModal({
      title: `Batch Details: ${b.batch_no}`,
      contentHtml,
      maxWidth: '850px'
    });
  },

  submitInventoryBatch(batchId) {
    const batches = window.DB.getAll('openingInventoryBatches') || [];
    const b = batches.find(x => x.id === batchId);
    if (!b) return;

    b.status = 'SUBMITTED';
    b.submitted_at = new Date().toISOString();
    b.submitted_by = (window.State && window.State.currentUser && window.State.currentUser.display_name) || 'Store User';
    window.DB.upsert('openingInventoryBatches', b);
    window.State.showToast(`Batch ${b.batch_no} submitted for approval.`, 'success');
    this.render();
  },

  approveInventoryBatch(batchId) {
    const batches = window.DB.getAll('openingInventoryBatches') || [];
    const b = batches.find(x => x.id === batchId);
    if (!b) return;

    b.status = 'APPROVED';
    b.approved_at = new Date().toISOString();
    b.approved_by = (window.State && window.State.currentUser && window.State.currentUser.display_name) || 'Pravin Patil';
    window.DB.upsert('openingInventoryBatches', b);
    window.State.showToast(`Batch ${b.batch_no} approved. Ready to post.`, 'success');
    this.render();
  },

  postInventoryBatch(batchId) {
    const batches = window.DB.getAll('openingInventoryBatches') || [];
    const b = batches.find(x => x.id === batchId);
    if (!b) return;

    if (b.status === 'POSTED') {
      window.State.showToast('This batch has already been posted.', 'info');
      return;
    }

    // 1. Post stock quantities into live inventory balances table (BRD §9.4 Rule 11)
    const balances = window.DB.getAll('inventoryBalances') || [];
    let updatedBalances = 0;

    const allItems = window.DB.getAll('items') || [];

    (b.items || []).forEach(it => {
      const matchedItem = allItems.find(m => m.code === it.item_code || m.id === it.item_code);
      const matchedItemId = matchedItem ? matchedItem.id : null;

      // Find matching item record in inventoryBalances
      let existingBal = balances.find(bal => 
        (bal.item_code === it.item_code || bal.item_sku === it.item_code || (matchedItemId && bal.item_id === matchedItemId)) &&
        (bal.warehouse_id === b.warehouse_id || bal.plant_id === b.plant_id) &&
        (bal.batch_no === it.batch_no || !it.batch_no || !bal.batch_no)
      );

      if (existingBal) {
        existingBal.on_hand = (existingBal.on_hand || 0) + Number(it.opening_qty);
        existingBal.available = (existingBal.available || 0) + Number(it.opening_qty);
        if (it.unit_cost > 0) {
          existingBal.valuation_rate = Number(it.unit_cost);
        }
        window.DB.upsert('inventoryBalances', existingBal);
        updatedBalances++;
      } else {
        const newBal = {
          id: `BAL-OB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          item_id: matchedItemId || it.item_code,
          item_code: it.item_code,
          item_sku: it.item_code,
          item_name: it.item_name,
          plant_id: b.plant_id || 'PLANT-01',
          warehouse_id: b.warehouse_id || 'WH-PUN-MAIN',
          bin_id: it.bin_id || 'BIN-PUN-A01',
          batch_no: it.batch_no || 'LOT-2026-OB',
          serial_no: it.serial_no || '',
          on_hand: Number(it.opening_qty),
          reserved: 0,
          available: Number(it.opening_qty),
          valuation_rate: Number(it.unit_cost || 100),
          status: 'AVAILABLE',
          condition: 'NEW',
          last_updated: new Date().toISOString()
        };
        window.DB.insert('inventoryBalances', newBal);
        updatedBalances++;
      }
    });

    // 2. Mark batch as POSTED
    b.status = 'POSTED';
    b.posted_at = new Date().toISOString();
    b.posted_by = (window.State && window.State.currentUser && window.State.currentUser.display_name) || (window.State && window.State.currentUser && window.State.currentUser.name) || 'Pravin Patil';
    window.DB.upsert('openingInventoryBatches', b);

    // 3. Log Audit Trail (BRD §9.4 Rule 12)
    if (window.DB.logAudit) {
      window.DB.logAudit('POST_OPENING_BALANCE', 'OPENING_BALANCE', b.id, `Posted opening balance batch ${b.batch_no} with ${b.items.length} items to ${b.store_name}.`);
    }

    window.State.showToast(`Batch ${b.batch_no} posted successfully! ${updatedBalances} inventory balances updated.`, 'success');
    this.render();
  },

  /* -------------------------------------------------------------------------
     MODALS: BULK EXCEL / CSV IMPORT (BRD §7.1 & §8)
     ------------------------------------------------------------------------- */
  showImportExcelModal() {
    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-md); padding: 12px 14px; font-size: 12px;">
          <strong>Bulk Excel Import Guidelines (BRD §8 & §9):</strong>
          <ul style="margin: 6px 0 0 18px; padding: 0; line-height: 1.5;">
            <li>Format: Item Code, Store ID, Bin, Batch No, Opening Quantity, Unit Cost.</li>
            <li>Item codes must exist in Item Master and quantities must be greater than zero.</li>
            <li>Downloaded template contains standard headers and sample two-wheeler parts.</li>
          </ul>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button type="button" class="btn btn-outline btn-sm" onclick="window.OpeningBalanceModule.downloadSampleCsv()" style="display: inline-flex; align-items: center; gap: 6px;">
            <span>📄</span> <span>Download CSV Template (.csv)</span>
          </button>
          <span style="font-size: 11.5px; color: var(--text-muted);">Standard Excel / CSV UTF-8</span>
        </div>

        <!-- File Upload Area -->
        <div style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 25px; text-align: center; background: rgba(0,0,0,0.15); cursor: pointer;" onclick="document.getElementById('ob-file-input').click()">
          <span style="font-size: 32px;">📊</span>
          <div style="font-weight: 700; margin-top: 6px;">Click or Drag & Drop Opening Stock Spreadsheet</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Supported file types: .csv, .xlsx (Simulated parse)</div>
          <input type="file" id="ob-file-input" accept=".csv,.txt" style="display: none;" onchange="window.OpeningBalanceModule.handleFileSelected(event)">
        </div>

        <!-- Preview Container -->
        <div id="ob-import-preview" style="display: none;"></div>

        <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
        </div>
      </div>
    `;

    window.State.showModal({
      title: 'Bulk Excel / CSV Opening Stock Import',
      contentHtml,
      maxWidth: '750px'
    });
  },

  downloadSampleCsv() {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "item_code,item_name,store_id,bin_id,batch_no,opening_qty,unit_cost\n" +
      "2W-ENG-OIL-10W30,Engine Oil 10W-30 Synthetic,WH-PUN-MAIN,BIN-PUN-L01,LOT-2026-001,100,280\n" +
      "2W-BRK-PAD-01,Front Disc Brake Pad,WH-PUN-MAIN,BIN-PUN-A01,LOT-2026-002,50,150\n" +
      "2W-SPR-ENGINE-GASKET-KIT-006,Engine Gasket Kit,WH-PUN-MAIN,BIN-PUN-A02,LOT-2026-003,20,450\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ISCM_Opening_Stock_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.State.showToast('Sample CSV template downloaded successfully.', 'success');
  },

  handleFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      this.parseAndPreviewCsv(text);
    };
    reader.readAsText(file);
  },

  parseAndPreviewCsv(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      window.State.showToast('CSV file is empty or invalid format.', 'warning');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length >= 5) {
        parsedRows.push({
          item_code: cols[0],
          item_name: cols[1] || cols[0],
          store_id: cols[2] || 'WH-PUN-MAIN',
          bin_id: cols[3] || 'BIN-PUN-A01',
          batch_no: cols[4] || 'LOT-2026-CSV',
          opening_qty: Number(cols[5] || 1),
          unit_cost: Number(cols[6] || 100),
          net_value: Number(cols[5] || 1) * Number(cols[6] || 100)
        });
      }
    }

    const preview = document.getElementById('ob-import-preview');
    if (!preview) return;

    preview.style.display = 'block';
    preview.innerHTML = `
      <div style="margin-top: 10px;">
        <div style="font-weight: 700; font-size: 13px; color: var(--color-success); margin-bottom: 6px;">
          ✓ Found ${parsedRows.length} valid items in file:
        </div>
        <div class="table-responsive" style="max-height: 180px; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: 4px;">
          <table class="data-table" style="font-size: 11px; width: 100%;">
            <thead><tr><th>Item Code</th><th>Store</th><th>Bin</th><th>Qty</th><th>Cost</th><th class="text-right">Valuation</th></tr></thead>
            <tbody>
              ${parsedRows.map(r => `
                <tr>
                  <td class="cell-mono font-bold">${r.item_code}</td>
                  <td>${r.store_id}</td>
                  <td class="cell-mono">${r.bin_id}</td>
                  <td class="cell-mono font-bold">${r.opening_qty}</td>
                  <td class="cell-mono">₹${r.unit_cost}</td>
                  <td class="text-right cell-mono font-bold" style="color: var(--color-success);">₹${r.net_value}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 10px; text-align: right;">
          <button type="button" class="btn btn-primary btn-sm" onclick="window.OpeningBalanceModule.importParsedRows(${JSON.stringify(parsedRows).replace(/"/g, '&quot;')})">
            🚀 Create Batch from ${parsedRows.length} Imported Rows
          </button>
        </div>
      </div>
    `;
  },

  importParsedRows(rows) {
    if (!rows || rows.length === 0) return;

    const newBatch = {
      id: `OB-INV-${Date.now()}`,
      batch_no: `OB/INV/2026/${String((window.DB.getAll('openingInventoryBatches') || []).length + 1).padStart(4, '0')}`,
      company_id: 'COMP-01',
      company_name: 'Mauli Service Center Pvt. Ltd.',
      plant_id: 'PLANT-01',
      plant_name: 'Mauli Service Center 1 – Ravet',
      warehouse_id: rows[0].store_id || 'WH-PUN-MAIN',
      store_name: 'Ravet Main Store',
      financial_year: this.selectedYear,
      opening_date: '2026-04-01',
      ref_no: 'CSV-BULK-IMPORT',
      source_system: 'Bulk CSV Upload',
      status: 'DRAFT',
      created_by: (window.State && window.State.currentUser && window.State.currentUser.display_name) || 'Pravin Patil',
      created_at: new Date().toISOString(),
      items: rows
    };

    window.DB.insert('openingInventoryBatches', newBatch);
    window.State.closeModal();
    window.State.showToast(`Batch ${newBatch.batch_no} created with ${rows.length} imported items (Draft).`, 'success');
    this.render();
  },


  saveConfig(e) {
    e.preventDefault();
    const config = {
      id: 'OBC-001',
      config_code: document.getElementById('cfg-code').value,
      config_name: document.getElementById('cfg-name').value,
      company_id: 'COMP-01',
      effective_from: document.getElementById('cfg-from').value,
      effective_to: document.getElementById('cfg-to').value,
      approval_required: document.getElementById('cfg-approval').checked,
      excel_import_allowed: document.getElementById('cfg-excel').checked,
      negative_stock_allowed: document.getElementById('cfg-negative').checked,
      backdated_entry_allowed: document.getElementById('cfg-backdated').checked,
      edit_after_posting: document.getElementById('cfg-edit-after').checked,
      active_status: 'ACTIVE'
    };

    window.DB.upsert('openingBalanceConfig', config);
    window.State.showToast('Opening balance configuration saved.', 'success');
    this.render();
  },

  /* -------------------------------------------------------------------------
     HELPERS & UTILS
     ------------------------------------------------------------------------- */
  getStatusBadge(status) {
    switch (status) {
      case 'DRAFT': return '<span class="badge badge-subtle" style="font-size: 10.5px;">Draft</span>';
      case 'SUBMITTED': return '<span class="badge badge-primary" style="font-size: 10.5px;">Submitted</span>';
      case 'APPROVED': return '<span class="badge badge-warning" style="font-size: 10.5px;">Approved</span>';
      case 'POSTED': return '<span class="badge badge-success" style="font-size: 10.5px; font-weight: 700;">✓ Posted</span>';
      case 'REJECTED': return '<span class="badge badge-danger" style="font-size: 10.5px;">Rejected</span>';
      default: return `<span class="badge badge-subtle">${status || 'Draft'}</span>`;
    }
  },

  setPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('opening-balance', page);
    const body = document.getElementById('ob-tab-body');
    if (body) body.innerHTML = this.renderActiveTabContent();
    else this.render();
  },

  setPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('opening-balance', size);
    const body = document.getElementById('ob-tab-body');
    if (body) body.innerHTML = this.renderActiveTabContent();
    else this.render();
  },

  setSearch(q) {
    this.searchQuery = q;
    if (window.PaginationHelper) window.PaginationHelper.reset('opening-balance');
    const body = document.getElementById('ob-tab-body');
    if (body) body.innerHTML = this.renderActiveTabContent();
  },

  setStoreFilter(st) {
    this.selectedStore = st;
    if (window.PaginationHelper) window.PaginationHelper.reset('opening-balance');
    const body = document.getElementById('ob-tab-body');
    if (body) body.innerHTML = this.renderActiveTabContent();
  },

  setStatusFilter(stat) {
    this.statusFilter = stat;
    if (window.PaginationHelper) window.PaginationHelper.reset('opening-balance');
    const body = document.getElementById('ob-tab-body');
    if (body) body.innerHTML = this.renderActiveTabContent();
  }
};
