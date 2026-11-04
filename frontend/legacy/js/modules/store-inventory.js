/* ==========================================================================
   ENTERPRISE ISCM - STORE MASTER & INVENTORY MANAGEMENT MODULE (BRD COMPLIANT)
   Two-Wheeler Garage / Service Center Management System (BRD Version 1.0)
   4 Fundamental Pillars:
   1. WHERE: Store -> Zone -> Rack -> Shelf -> Bin
   2. WHAT: Category -> Subcategory -> Item
   3. WHICH VEHICLE: Manufacturer -> Model -> Variant -> Year
   4. WHAT CAN BE DONE: 22-Transaction Matrix, Job Card, Transfers, Count, Warranty, Scrap
   ========================================================================== */

window.StoreInventoryModule = {
  activeTab: 'STORE_MASTER', // STORE_MASTER | CATEGORY_MAPPING | VEHICLE_COMPATIBILITY | JOB_CARD_WORKFLOW | STOCK_TRANSFERS | PHYSICAL_COUNT | WARRANTY_SCRAP | INVENTORY_RULES | STOCK_LEDGER
  searchTerm: '',
  storeFilter: 'ALL',
  statusFilter: 'ALL',
  categoryFilter: 'ALL',
  vehicleFilter: 'ALL',
  selectedJobCardId: 'JC-2026-001',
  selectedConfigStoreId: 'WH-PUN-MAIN',
  warrantySubTab: 'WARRANTY', // WARRANTY | SCRAP

  tabConfig: [
    { key: 'STORE_MASTER', perm: 'STORE_MASTER', label: 'Store Master', subModule: 'STORE_SETUP' },
    { key: 'LOCATIONS', perm: 'LOC_MASTER', label: 'Storage Location Master', subModule: 'STORE_SETUP' },
    { key: 'RACKS', perm: 'RACK_MASTER', label: 'Rack Master', subModule: 'STORE_SETUP' },
    { key: 'SHELVES', perm: 'SHELF_MASTER', label: 'Shelf Master', subModule: 'STORE_SETUP' },
    { key: 'BINS', perm: 'BIN_MASTER', label: 'Bin Master', subModule: 'STORE_SETUP' },
    { key: 'ITEM_DASHBOARD', perm: 'STORE_MASTER', label: 'Item Dashboard', subModule: 'ITEM_SETUP' },
    { key: 'ITEM_MASTER', perm: 'STORE_MASTER', label: 'Item Master', subModule: 'ITEM_SETUP' },
    { key: 'ITEM_CATEGORIES', perm: 'STORE_MASTER', label: 'Item Category & Sub-Category', subModule: 'ITEM_SETUP' },
    { key: 'ITEM_BRANDS', perm: 'STORE_MASTER', label: 'Brand Master', subModule: 'ITEM_SETUP' },
    { key: 'ITEM_MANUFACTURERS', perm: 'STORE_MASTER', label: 'Manufacturer Master', subModule: 'ITEM_SETUP' },
    { key: 'VEHICLE_COMPATIBILITY', perm: 'STORE_VEHICLE_COMPAT', label: 'Vehicle Compatibility', subModule: 'ITEM_SETUP' },
    { key: 'UOM_MASTER', perm: 'STORE_MASTER', label: 'UOM Master', subModule: 'ITEM_SETUP' },
    { key: 'HSN_MASTER', perm: 'STORE_MASTER', label: 'HSN/SAC Master', subModule: 'ITEM_SETUP' },
    { key: 'PHYSICAL_COUNT', perm: 'STORE_TX_PHYSICAL_COUNT', label: 'Physical Count & Adjust', subModule: 'ITEM_SETUP' },
    { key: 'WARRANTY_SCRAP', perm: 'STORE_TX_WARRANTY_RETURN', label: 'Warranty & Scrap Stores', subModule: 'ITEM_SETUP' },
    { key: 'INVENTORY_RULES', perm: 'STORE_INVENTORY_RULES', label: 'Inventory Rules & Access', subModule: 'ITEM_SETUP' },
    { key: 'STOCK_LEDGER', perm: 'STORE_STOCK_LEDGER', label: 'Stock Ledger & Valuation', subModule: 'ITEM_SETUP' }
  ],

  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    // Ensure page top bar is hidden so list of masters sits on top and eliminates duplicates
    const pageTopBar = (typeof document !== 'undefined' && document.getElementById) 
      ? (document.getElementById('page-top-bar') || (document.querySelector && document.querySelector('.page-top-bar'))) 
      : null;
    if (pageTopBar) pageTopBar.style.display = 'none';

    // Synchronize activeTab based on current window location hash if applicable
    const hash = (typeof window !== 'undefined' && window.location && window.location.hash) ? window.location.hash : '';
    if (hash === '#/store-transactions') {
      window.location.hash = '#/permissions';
      return;
    }
    else if (hash === '#/item-dashboard' || hash === '#/item-master-dashboard') this.activeTab = 'ITEM_DASHBOARD';
    else if (hash === '#/item-master-setup') this.activeTab = 'ITEM_MASTER';
    else if (hash === '#/stores' || hash === '#/store-master' || hash === '#/store-inventory' || hash === '#/store-master-setup') this.activeTab = 'STORE_MASTER';
    else if (hash === '#/storage-locations') this.activeTab = 'LOCATIONS';
    else if (hash === '#/racks') this.activeTab = 'RACKS';
    else if (hash === '#/shelves') this.activeTab = 'SHELVES';
    else if (hash === '#/bins') this.activeTab = 'BINS';
    else if (hash === '#/item-master') this.activeTab = 'ITEM_MASTER';
    else if (hash === '#/service-master') this.activeTab = 'SERVICE_MASTER';
    else if (hash === '#/item-categories') this.activeTab = 'ITEM_CATEGORIES';
    else if (hash === '#/item-subcategories') {
      this.activeTab = 'ITEM_CATEGORIES';
      if (window.ItemSetupModule) window.ItemSetupModule.categoryViewMode = 'SUBCATS';
    }
    else if (hash === '#/item-brands') this.activeTab = 'ITEM_BRANDS';
    else if (hash === '#/item-manufacturers') this.activeTab = 'ITEM_MANUFACTURERS';
    else if (hash === '#/vehicle-compatibility') this.activeTab = 'VEHICLE_COMPATIBILITY';
    else if (hash === '#/uom-master') this.activeTab = 'UOM_MASTER';
    else if (hash === '#/hsn-master') this.activeTab = 'HSN_MASTER';
    else if (hash === '#/store-mapping') this.activeTab = 'STORE_MASTER';
    else if (hash === '#/job-card-parts') this.activeTab = 'JOB_CARD_WORKFLOW';
    else if (hash === '#/stock-transfers') { window.location.hash = '#/transfers'; return; }
    else if (hash === '#/stock-counts') this.activeTab = 'PHYSICAL_COUNT';
    else if (hash === '#/warranty-scrap') this.activeTab = 'WARRANTY_SCRAP';
    else if (hash === '#/inventory-rules') this.activeTab = 'INVENTORY_RULES';
    else if (hash === '#/stock-ledger') this.activeTab = 'STOCK_LEDGER';

    const allStores = window.DB.getAll('warehouses') || [];
    const allBranches = window.DB.getAll('plants') || [];
    const allCategories = window.DB.getAll('itemCategories') || [];
    const allItems = window.DB.getAll('items') || [];
    const allBalances = window.DB.getAll('inventoryBalances') || [];
    const allJobCards = window.DB.getAll('jobCards') || [];

    // Summary calculation for header
    const totalStores = allStores.length;
    const activeStores = allStores.filter(s => s.status === 'Active' || !s.status).length;
    const totalItems = allItems.length;
    const totalInventoryValue = allBalances.reduce((sum, b) => sum + ((b.on_hand || 0) * (b.valuation_rate || 0)), 0);

    // Tab definitions with RBAC permission codes
    this.tabConfig = [
      { key: 'STORE_MASTER', perm: 'STORE_MASTER', label: 'Store Master', subModule: 'STORE_SETUP' },
      { key: 'LOCATIONS', perm: 'LOC_MASTER', label: 'Storage Location Master', subModule: 'STORE_SETUP' },
      { key: 'RACKS', perm: 'RACK_MASTER', label: 'Rack Master', subModule: 'STORE_SETUP' },
      { key: 'SHELVES', perm: 'SHELF_MASTER', label: 'Shelf Master', subModule: 'STORE_SETUP' },
      { key: 'BINS', perm: 'BIN_MASTER', label: 'Bin Master', subModule: 'STORE_SETUP' },
      { key: 'ITEM_DASHBOARD', perm: 'STORE_MASTER', label: 'Item Dashboard', subModule: 'ITEM_SETUP' },
      { key: 'ITEM_MASTER', perm: 'STORE_MASTER', label: 'Item Master', subModule: 'ITEM_SETUP' },
      { key: 'SERVICE_MASTER', perm: 'STORE_MASTER', label: 'Service Master', subModule: 'ITEM_SETUP' },
      { key: 'ITEM_CATEGORIES', perm: 'STORE_MASTER', label: 'Item Category & Sub-Category', subModule: 'ITEM_SETUP' },
      { key: 'ITEM_BRANDS', perm: 'STORE_MASTER', label: 'Brand Master', subModule: 'ITEM_SETUP' },
      { key: 'ITEM_MANUFACTURERS', perm: 'STORE_MASTER', label: 'Manufacturer Master', subModule: 'ITEM_SETUP' },
      { key: 'VEHICLE_COMPATIBILITY', perm: 'STORE_VEHICLE_COMPAT', label: 'Vehicle Compatibility', subModule: 'ITEM_SETUP' },
      { key: 'UOM_MASTER', perm: 'STORE_MASTER', label: 'UOM Master', subModule: 'ITEM_SETUP' },
      { key: 'HSN_MASTER', perm: 'STORE_MASTER', label: 'HSN/SAC Master', subModule: 'ITEM_SETUP' },
      { key: 'PHYSICAL_COUNT', perm: 'STORE_TX_PHYSICAL_COUNT', label: 'Physical Count & Adjust', subModule: 'ITEM_SETUP' },
      { key: 'WARRANTY_SCRAP', perm: 'STORE_TX_WARRANTY_RETURN', label: 'Warranty & Scrap Stores', subModule: 'ITEM_SETUP' },
      { key: 'INVENTORY_RULES', perm: 'STORE_INVENTORY_RULES', label: 'Inventory Rules & Access', subModule: 'ITEM_SETUP' },
      { key: 'STOCK_LEDGER', perm: 'STORE_STOCK_LEDGER', label: 'Stock Ledger & Valuation', subModule: 'ITEM_SETUP' }
    ];

    const visibleTabs = this.tabConfig.filter(t => {
      if (!window.State || typeof window.State.hasPermission !== 'function') return true;
      return window.State.hasPermission(t.perm, 'VIEW');
    });

    if (visibleTabs.length === 0) {
      if (window.App && typeof window.App.navigateToFirstAuthorizedRoute === 'function') {
        window.App.navigateToFirstAuthorizedRoute();
      }
      return;
    }

    if (!visibleTabs.some(t => t.key === this.activeTab)) {
      this.activeTab = visibleTabs[0].key;
    }

    // Determine active sub-module from current activeTab
    const currentTabItem = this.tabConfig.find(t => t.key === this.activeTab);
    const activeSubModule = (currentTabItem && currentTabItem.subModule) ? currentTabItem.subModule : 'STORE_SETUP';
    const subModuleTabs = visibleTabs.filter(t => t.subModule === activeSubModule);

    container.innerHTML = `
      <!-- Tabs Header for Active Sub-Module Masters -->
      <div class="tabs-header" style="margin-top: 0 !important; margin-bottom: 6px !important; overflow-x: auto; white-space: nowrap;">
        ${subModuleTabs.map(t => `
          <button class="tab-btn ${this.activeTab === t.key ? 'active' : ''}" onclick="window.StoreInventoryModule.switchTab('${t.key}')">
            <span>${t.label}</span>
          </button>
        `).join('')}
      </div>

      <!-- 3. Active Tab Sub-View Container -->
      <div id="store-inventory-subview-container">
        ${this.renderActiveSubView()}
      </div>
    `;

    // Initialize interactive handlers if needed
    this.postRender();
  },

  switchSubModule(subModuleKey) {
    const candidates = this.tabConfig.filter(t => t.subModule === subModuleKey);
    const authorized = candidates.filter(t => {
      if (!window.State || typeof window.State.hasPermission !== 'function') return true;
      return window.State.hasPermission(t.perm, 'VIEW');
    });
    if (authorized.length === 0) {
      if (window.State && window.State.showToast) {
        window.State.showToast(`Access Restricted: No permitted masters found under ${subModuleKey === 'STORE_SETUP' ? 'Store Setup' : 'Item Setup'}.`, 'warning');
      }
      return;
    }
    this.switchTab(authorized[0].key);
  },

  switchTab(tab) {
    if (this.tabConfig && window.State && typeof window.State.hasPermission === 'function') {
      const tabItem = this.tabConfig.find(t => t.key === tab);
      if (tabItem && !window.State.hasPermission(tabItem.perm, 'VIEW')) {
        window.State.showToast(`Access Restricted: Missing permission (${tabItem.perm}) for this sub-module.`, 'warning');
        return;
      }
    }
    this.activeTab = tab;
    this.searchTerm = '';
    const hashRouteMap = {
      STORE_MASTER: '#/store-master',
      LOCATIONS: '#/storage-locations',
      RACKS: '#/racks',
      SHELVES: '#/shelves',
      BINS: '#/bins',
      ITEM_DASHBOARD: '#/item-dashboard',
      ITEM_MASTER: '#/item-master',
      SERVICE_MASTER: '#/service-master',
      ITEM_CATEGORIES: '#/item-categories',
      ITEM_SUBCATEGORIES: '#/item-categories',
      ITEM_BRANDS: '#/item-brands',
      ITEM_MANUFACTURERS: '#/item-manufacturers',
      VEHICLE_COMPATIBILITY: '#/vehicle-compatibility',
      UOM_MASTER: '#/uom-master',
      HSN_MASTER: '#/hsn-master',
      JOB_CARD_WORKFLOW: '#/job-card-parts',
      PHYSICAL_COUNT: '#/stock-counts',
      WARRANTY_SCRAP: '#/warranty-scrap',
      INVENTORY_RULES: '#/inventory-rules',
      STOCK_LEDGER: '#/stock-ledger'
    };
    if (hashRouteMap[tab] && window.location.hash !== hashRouteMap[tab]) {
      window.location.hash = hashRouteMap[tab];
    } else {
      this.render();
    }
  },

  setSearch(val) {
    this.searchTerm = (val || '').toLowerCase().trim();
    if (window.OrgLocationModule) {
      window.OrgLocationModule.searchTerm = val !== undefined && val !== null ? val : '';
    }
    const container = document.getElementById('store-inventory-subview-container');
    if (container) {
      container.innerHTML = this.renderActiveSubView();
      this.postRender();
    }
  },

  setStoreFilter(val) {
    this.storeFilter = val;
    this.render();
  },

  setStatusFilter(val) {
    this.statusFilter = val;
    this.render();
  },

  setParent(val) {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.setParent === 'function') {
      window.OrgLocationModule.setParent(val);
    }
  },

  postRender() {
    // Keep search input focused if typing
    const searchInput = document.getElementById('store-sub-search') || 
                        document.getElementById('org-search-input') || 
                        document.querySelector('.org-search-input');
    if (searchInput && (this.searchTerm || (window.OrgLocationModule && window.OrgLocationModule.searchTerm))) {
      searchInput.focus();
      const len = searchInput.value.length;
      try {
        searchInput.setSelectionRange(len, len);
      } catch (e) {}
    }
  },

  renderActiveSubView() {
    switch (this.activeTab) {
      case 'STORE_MASTER':
        return this.renderStoreMasterTab();
      case 'LOCATIONS':
        return this.renderStorageLocationsTab();
      case 'RACKS':
        return this.renderRacksTab();
      case 'SHELVES':
        return this.renderShelvesTab();
      case 'BINS':
        return this.renderBinsTab();
      case 'ITEM_DASHBOARD':
        if (window.ItemDashboardModule && typeof window.ItemDashboardModule.render === 'function') {
          return window.ItemDashboardModule.render();
        }
        return '<div>Item Master Dashboard</div>';
      case 'ITEM_MASTER':
        if (window.ItemSetupModule && typeof window.ItemSetupModule.renderItemMasterTab === 'function') {
          return window.ItemSetupModule.renderItemMasterTab();
        }
        return this.renderItemMasterTab();
      case 'SERVICE_MASTER':
        if (window.ServiceMasterModule && typeof window.ServiceMasterModule.render === 'function') {
          return window.ServiceMasterModule.render();
        }
        return '<div>Service Master</div>';
      case 'ITEM_CATEGORIES':
      case 'ITEM_SUBCATEGORIES':
        if (window.ItemSetupModule && typeof window.ItemSetupModule.renderCategoriesTab === 'function') {
          return window.ItemSetupModule.renderCategoriesTab();
        }
        return '<div>Item Category & Sub-Category Master</div>';
      case 'ITEM_BRANDS':
        if (window.ItemSetupModule && typeof window.ItemSetupModule.renderBrandsTab === 'function') {
          return window.ItemSetupModule.renderBrandsTab();
        }
        return '<div>Brand Master</div>';
      case 'ITEM_MANUFACTURERS':
        if (window.ItemSetupModule && typeof window.ItemSetupModule.renderManufacturersTab === 'function') {
          return window.ItemSetupModule.renderManufacturersTab();
        }
        return '<div>Manufacturer Master</div>';
      case 'VEHICLE_COMPATIBILITY':
        if (window.ItemSetupModule && typeof window.ItemSetupModule.renderVehicleCompatibilityTab === 'function') {
          return window.ItemSetupModule.renderVehicleCompatibilityTab();
        }
        return this.renderVehicleCompatibilityTab();
      case 'UOM_MASTER':
        if (window.ItemSetupModule && typeof window.ItemSetupModule.renderUomTab === 'function') {
          return window.ItemSetupModule.renderUomTab();
        }
        return '<div>UOM Master</div>';
      case 'HSN_MASTER':
        if (window.ItemSetupModule && typeof window.ItemSetupModule.renderHsnTab === 'function') {
          return window.ItemSetupModule.renderHsnTab();
        }
        return '<div>HSN/SAC Master</div>';
      case 'JOB_CARD_WORKFLOW':
        return this.renderJobCardWorkflowTab();
      case 'PHYSICAL_COUNT':
        return this.renderPhysicalCountTab();
      case 'WARRANTY_SCRAP':
        return this.renderWarrantyScrapTab();
      case 'INVENTORY_RULES':
        return this.renderInventoryRulesTab();
      case 'STOCK_LEDGER':
        return this.renderStockLedgerTab();
      default:
        return this.renderStoreMasterTab();
    }
  },

  // =========================================================================
  // STORAGE HIERARCHY SUB-MASTERS (Storage Location, Rack, Shelf, Bin)
  // =========================================================================
  renderStorageLocationsTab() {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.renderStorageLocationsTab === 'function') {
      return window.OrgLocationModule.renderStorageLocationsTab();
    }
    return '<div>Storage Location Master</div>';
  },

  renderRacksTab() {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.renderRacksTab === 'function') {
      return window.OrgLocationModule.renderRacksTab();
    }
    return '<div>Rack Master</div>';
  },

  renderShelvesTab() {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.renderShelvesTab === 'function') {
      return window.OrgLocationModule.renderShelvesTab();
    }
    return '<div>Shelf Master</div>';
  },

  renderBinsTab() {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.renderBinsTab === 'function') {
      return window.OrgLocationModule.renderBinsTab();
    }
    return '<div>Bin Master</div>';
  },

  showAddStorageLocationModal() {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.showAddStorageLocationModal === 'function') {
      window.OrgLocationModule.showAddStorageLocationModal();
    }
  },

  showEditStorageLocationModal(id) {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.showEditStorageLocationModal === 'function') {
      window.OrgLocationModule.showEditStorageLocationModal(id);
    }
  },

  showAddRackModal() {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.showAddRackModal === 'function') {
      window.OrgLocationModule.showAddRackModal();
    }
  },

  showEditRackModal(id) {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.showEditRackModal === 'function') {
      window.OrgLocationModule.showEditRackModal(id);
    }
  },

  showAddShelfModal() {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.showAddShelfModal === 'function') {
      window.OrgLocationModule.showAddShelfModal();
    }
  },

  showEditShelfModal(id) {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.showEditShelfModal === 'function') {
      window.OrgLocationModule.showEditShelfModal(id);
    }
  },

  showAddBinModal() {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.showAddBinModal === 'function') {
      window.OrgLocationModule.showAddBinModal();
    }
  },

  showEditBinModal(id) {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.showEditBinModal === 'function') {
      window.OrgLocationModule.showEditBinModal(id);
    }
  },

  // =========================================================================
  // TAB 1: STORE MASTER
  // =========================================================================
  renderStoreMasterTab() {
    const allStores = window.DB.getAll('warehouses') || [];
    const allPlants = window.DB.getAll('plants') || [];
    const allStoreTypes = window.DB.getAll('storeTypes') || [];

    if (!this.storeTypeFilter) this.storeTypeFilter = 'ALL';

    const filtered = allStores.filter(s => {
      if (this.statusFilter !== 'ALL' && s.status !== this.statusFilter) return false;
      if (this.storeTypeFilter !== 'ALL') {
        const isMain = !s.parent_store_id || s.warehouse_type === 'MAIN_STORE';
        if (this.storeTypeFilter === 'MAIN_STORE' && !isMain) return false;
        if (this.storeTypeFilter === 'SUB_STORE' && isMain) return false;
      }
      if (this.storeFilter !== 'ALL') {
        const facIds = Array.isArray(s.facility_ids) && s.facility_ids.length > 0 ? s.facility_ids : (s.plant_id ? [s.plant_id] : []);
        if (!facIds.includes(this.storeFilter)) return false;
      }
      if (this.searchTerm) {
        const q = this.searchTerm.toLowerCase();
        const matchCode = (s.code || '').toLowerCase().includes(q);
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchManager = (s.manager || '').toLowerCase().includes(q);
        const matchGst = (s.gstin || '').toLowerCase().includes(q);
        const matchType = (s.store_type || s.warehouse_type || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchManager && !matchGst && !matchType) return false;
      }
      return true;
    });

    return `
      <!-- Toolbar & Filters (BRD §9.1) -->
      <div class="content-card" style="margin-bottom: 16px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Search Filter -->
            <div style="position: relative; display: inline-flex; align-items: center;">
              <input 
                type="text" 
                id="store-sub-search"
                class="form-control form-control-sm" 
                placeholder="Search code, name, manager, GST..." 
                value="${this.searchTerm}" 
                oninput="window.StoreInventoryModule.setSearch(this.value)" 
                style="width: 250px;" 
                autocomplete="off"
              />
              ${this.searchTerm ? `
                <button type="button" onclick="window.StoreInventoryModule.setSearch('')" style="position: absolute; right: 8px; background: none; border: none; color: var(--text-muted); cursor: pointer;">&times;</button>
              ` : ''}
            </div>

            <!-- Store Type Filter -->
            <select class="form-control form-control-sm" onchange="window.StoreInventoryModule.setStoreTypeFilter(this.value)" style="width: 140px;">
              <option value="ALL" ${this.storeTypeFilter === 'ALL' ? 'selected' : ''}>All Types</option>
              <option value="MAIN_STORE" ${this.storeTypeFilter === 'MAIN_STORE' ? 'selected' : ''}>Main Store</option>
              <option value="SUB_STORE" ${this.storeTypeFilter === 'SUB_STORE' ? 'selected' : ''}>Sub Store</option>
            </select>

            <!-- Facility Filter -->
            <select class="form-control form-control-sm" onchange="window.StoreInventoryModule.setStoreFilter(this.value)" style="width: 180px;">
              <option value="ALL" ${this.storeFilter === 'ALL' ? 'selected' : ''}>All Facilities</option>
              ${allPlants.map(p => `<option value="${p.id}" ${this.storeFilter === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>

            <!-- Status Filter -->
            <select class="form-control form-control-sm" onchange="window.StoreInventoryModule.setStatusFilter(this.value)" style="width: 130px;">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
              <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>● Active</option>
              <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>○ Inactive</option>
            </select>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-outline btn-sm" onclick="window.StoreInventoryModule.showStoreHierarchyModal()">
              <span>Visual Hierarchy Tree</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.StoreInventoryModule.showAddStoreModal()">
              <span>+ Create Store</span>
            </button>
          </div>
        </div>

        <!-- 3. Store Master Data Table (BRD §9.1) -->
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Store Code</th>
                <th>Store Name & Details</th>
                <th>Store Type</th>
                <th>Parent Store</th>
                <th>Mapped Facilities</th>
                <th>Validity (Dates)</th>
                <th>Config Overview</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">No Stores Found</div>
                    <div style="font-size: 12px; margin-top: 4px; color: var(--text-secondary);">Click "+ Create Store" above to register and configure your first store.</div>
                  </td>
                </tr>
              ` : filtered.map(s => {
                const isMain = !s.parent_store_id || s.warehouse_type === 'MAIN_STORE';
                const parent = allStores.find(ps => ps.id === s.parent_store_id);
                const isActive = s.status === 'Active' || !s.status;

                // Facility resolution (one or multiple)
                const fIds = Array.isArray(s.facility_ids) && s.facility_ids.length > 0 ? s.facility_ids : (s.plant_id ? [s.plant_id] : []);
                const mappedPlants = allPlants.filter(p => fIds.includes(p.id));
                const plantLabel = mappedPlants.length > 0 
                  ? mappedPlants.map(p => p.name).join(', ') 
                  : (s.plant_id || 'Not Assigned');

                // Configuration stats
                const screenMap = window.DB ? window.DB.getStoreScreenMapping(s.id) : {};
                const enabledScreens = Object.values(screenMap).filter(Boolean).length;
                const effectiveItems = window.DB ? window.DB.getStoreEffectiveItems(s.id) : [];
                const reorderRules = window.DB ? window.DB.getStoreReorderLevels(s.id) : [];
                const alerts = window.DB ? window.DB.getStoreReorderAlerts(s.id) : [];

                return `
                  <tr>
                    <td>
                      <span class="cell-mono cell-strong" style="color: var(--primary-300); font-weight: 700; font-size: 13px;">${s.code || s.id}</span>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--text-primary);">${s.name}</div>
                      ${s.gstin ? `<div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">GSTIN: <span style="color: var(--text-secondary);">${s.gstin}</span></div>` : ''}
                      ${s.manager ? `<div style="font-size: 11px; color: var(--text-secondary);">${s.manager}${s.contact_number ? ` • ${s.contact_number}` : ''}</div>` : ''}
                    </td>
                    <td>
                      <span class="badge ${isMain ? 'badge-primary' : 'badge-subtle'}" style="font-size: 11px; padding: 3px 8px; font-weight: 600;">
                        ${isMain ? 'Main Store' : 'Sub Store'}
                      </span>
                    </td>
                    <td>
                      ${parent ? `
                        <div style="font-weight: 600; color: var(--text-primary);">${parent.name}</div>
                        <div class="cell-mono" style="font-size: 10px; color: var(--text-muted);">${parent.code || parent.id}</div>
                      ` : `
                        <span class="badge badge-subtle" style="font-size: 10px; color: var(--color-success); background: rgba(34, 197, 94, 0.1); padding: 2px 7px;">
                          Root (Main)
                        </span>
                      `}
                    </td>
                    <td>
                      <div style="display: flex; gap: 4px; flex-wrap: wrap; max-width: 220px;">
                        ${mappedPlants.length === 0 ? `<span style="color: var(--text-muted); font-size: 11px;">None</span>` : mappedPlants.map(p => `
                          <span class="badge badge-subtle" style="font-size: 10px; padding: 2px 6px;" title="${p.name} (${p.city || ''})">
                            ${p.name.length > 20 ? p.name.substring(0, 18) + '...' : p.name}
                          </span>
                        `).join('')}
                      </div>
                    </td>
                    <td>
                      <div style="font-size: 11px; color: var(--text-primary); font-family: var(--font-mono);">
                        ${s.effective_from || '—'}
                      </div>
                      <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">
                        to ${s.effective_to || 'Open'}
                      </div>
                    </td>
                    <td>
                      <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span class="badge badge-subtle" style="font-size: 9.5px; padding: 1px 6px; width: fit-content;">
                          ${enabledScreens}/12 Screens
                        </span>
                        <span class="badge badge-subtle" style="font-size: 9.5px; padding: 1px 6px; width: fit-content;">
                          ${effectiveItems.length} Items Mapped
                        </span>
                        ${alerts.length > 0 ? `
                          <span class="badge badge-danger" style="font-size: 9.5px; padding: 1px 6px; width: fit-content; background: rgba(239, 68, 68, 0.15); color: #ef4444; font-weight: 700;">
                            ${alerts.length} Reorder Alerts
                          </span>
                        ` : `
                          <span class="badge badge-subtle" style="font-size: 9.5px; padding: 1px 6px; width: fit-content; color: var(--text-muted);">
                            ${reorderRules.length} Reorder Rules
                          </span>
                        `}
                      </div>
                    </td>
                    <td>
                      <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 10px; padding: 3px 8px; font-weight: 600;">
                        ${isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 4px; justify-content: flex-end; align-items: center;">
                        <button class="btn btn-outline btn-sm" title="Configure Store" onclick="window.StoreInventoryModule.showStoreConfigurationModal('${s.id}')" style="padding: 3px 8px; font-size: 11.5px; font-weight: 600;">
                          Configure
                        </button>
                        <button class="btn btn-icon btn-sm" title="Edit Store Details" onclick="window.StoreInventoryModule.showEditStoreModal('${s.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate Store' : 'Activate Store'}" onclick="window.StoreInventoryModule.toggleStoreStatus('${s.id}')">
                          ${isActive ? `
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-warning);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          ` : `
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          `}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Delete Store" style="color: var(--color-danger);" onclick="window.StoreInventoryModule.deleteStore('${s.id}')">
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
      </div>
    `;
  },

  // =========================================================================
  // TAB: ITEM MASTER (Two-Wheeler Service Center BRD v1.0)
  // =========================================================================
  setItemSearch(val) {
    this.itemSearchTerm = (val || '').toLowerCase().trim();
    const container = document.getElementById('store-inventory-subview-container');
    if (container) {
      container.innerHTML = this.renderActiveSubView();
      const input = document.getElementById('item-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  },

  setItemCategoryFilter(val) {
    this.itemCategoryFilter = val;
    this.render();
  },

  setItemTypeFilter(val) {
    this.itemTypeFilter = val;
    this.render();
  },

  setItemVehicleFilter(val) {
    this.itemVehicleFilter = val;
    this.render();
  },

  setItemStatusFilter(val) {
    this.itemStatusFilter = val;
    this.render();
  },

  resetItemFilters() {
    this.itemSearchTerm = '';
    this.itemCategoryFilter = 'ALL';
    this.itemTypeFilter = 'ALL';
    this.itemVehicleFilter = 'ALL';
    this.itemStatusFilter = 'ALL';
    this.render();
  },

  renderItemMasterTab() {
    const allItems = window.DB.getAll('items') || [];
    const allCategories = window.DB.getAll('itemCategories') || [];
    const allVehicleModels = window.DB.getAll('vehicleModels') || [];
    const allBalances = window.DB.getAll('inventoryBalances') || [];

    // Filter state defaults
    if (!this.itemSearchTerm) this.itemSearchTerm = '';
    if (!this.itemCategoryFilter) this.itemCategoryFilter = 'ALL';
    if (!this.itemTypeFilter) this.itemTypeFilter = 'ALL';
    if (!this.itemVehicleFilter) this.itemVehicleFilter = 'ALL';
    if (!this.itemStatusFilter) this.itemStatusFilter = 'ALL';

    // Summary calculations (BRD §38)
    const totalItems = allItems.length;
    const activeItems = allItems.filter(i => i.status === 'Active' || !i.status).length;
    const warrantyItems = allItems.filter(i => i.warranty_applicable_yn === 'Y').length;

    // Calculate total on-hand per item
    const itemStockMap = {};
    allBalances.forEach(b => {
      itemStockMap[b.item_id] = (itemStockMap[b.item_id] || 0) + (Number(b.on_hand) || 0);
    });

    const lowStockCount = allItems.filter(i => {
      const stock = itemStockMap[i.id] || 0;
      return (i.reorder_level && stock <= i.reorder_level && (i.status === 'Active' || !i.status));
    }).length;

    // Filtering logic (BRD §32)
    const filtered = allItems.filter(item => {
      if (this.itemStatusFilter !== 'ALL' && (item.status || 'Active') !== this.itemStatusFilter) return false;
      if (this.itemCategoryFilter !== 'ALL' && item.category_id !== this.itemCategoryFilter) return false;
      if (this.itemTypeFilter !== 'ALL' && item.item_type !== this.itemTypeFilter) return false;
      if (this.itemVehicleFilter !== 'ALL') {
        const vIds = item.vehicle_model_ids || [];
        if (!vIds.includes(this.itemVehicleFilter)) return false;
      }
      if (this.itemSearchTerm) {
        const q = this.itemSearchTerm.toLowerCase();
        const matchCode = (item.code || '').toLowerCase().includes(q);
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        const matchPart = (item.part_number || '').toLowerCase().includes(q);
        const matchOem = (item.oem_part_number || '').toLowerCase().includes(q);
        const matchBarcode = (item.barcode || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchBrand && !matchPart && !matchOem && !matchBarcode) return false;
      }
      return true;
    });

    return `
      <!-- Main Content Card -->
      <div class="content-card">
        <!-- Toolbar: Search, Filters & Action -->
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="position: relative; display: inline-flex; align-items: center;">
              <input 
                type="text" 
                id="item-search-input"
                class="form-control form-control-sm" 
                placeholder="Search items..." 
                value="${this.itemSearchTerm}" 
                oninput="window.StoreInventoryModule.setItemSearch(this.value)" 
                style="width: 240px;" 
                autocomplete="off"
              />
              ${this.itemSearchTerm ? `
                <button type="button" onclick="window.StoreInventoryModule.setItemSearch('')" style="position: absolute; right: 8px; background: none; border: none; color: var(--text-muted); cursor: pointer;">&times;</button>
              ` : ''}
            </div>

            <select class="form-control form-control-sm" onchange="window.StoreInventoryModule.setItemCategoryFilter(this.value)" style="width: 160px;">
              <option value="ALL" ${this.itemCategoryFilter === 'ALL' ? 'selected' : ''}>All Categories</option>
              ${allCategories.map(c => `<option value="${c.id}" ${this.itemCategoryFilter === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>

            <select class="form-control form-control-sm" onchange="window.StoreInventoryModule.setItemVehicleFilter(this.value)" style="width: 170px;">
              <option value="ALL" ${this.itemVehicleFilter === 'ALL' ? 'selected' : ''}>All Vehicles</option>
              ${allVehicleModels.map(m => `<option value="${m.id}" ${this.itemVehicleFilter === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
            </select>

            <select class="form-control form-control-sm" onchange="window.StoreInventoryModule.setItemStatusFilter(this.value)" style="width: 120px;">
              <option value="ALL" ${this.itemStatusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
              <option value="Active" ${this.itemStatusFilter === 'Active' ? 'selected' : ''}>● Active</option>
              <option value="Inactive" ${this.itemStatusFilter === 'Inactive' ? 'selected' : ''}>○ Inactive</option>
            </select>

            ${(this.itemSearchTerm || this.itemCategoryFilter !== 'ALL' || this.itemVehicleFilter !== 'ALL' || this.itemStatusFilter !== 'ALL') ? `
              <button class="btn btn-secondary btn-sm" onclick="window.StoreInventoryModule.resetItemFilters()" title="Reset Filters" style="padding: 0 10px; font-size: 12px; height: 31px;">
                ✕ Reset
              </button>
            ` : ''}
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="if (window.ItemSetupModule) { window.ItemSetupModule.exportItemsCsv(); } else { window.StoreInventoryModule.exportItemsCsv(); }" title="Export items to CSV" style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
              <span>📤 Export</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="if (window.ItemSetupModule) { window.ItemSetupModule.showImportItemsModal(); } else { window.StoreInventoryModule.showImportItemsModal(); }" title="Bulk import items via CSV" style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
              <span>📥 Import</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.StoreInventoryModule.showAddItemModal()">
              <span>+ Register New Item</span>
            </button>
          </div>
        </div>

        <!-- Data Table (BRD §32 List Columns) -->
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Part #</th>
                <th>Category</th>
                <th>UOM</th>
                <th class="text-right">Stock</th>
                <th class="text-right">Price (₹)</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted);">
                    <div style="font-size: 28px; margin-bottom: 6px;">📦</div>
                    <div style="font-weight: 600; font-size: 13px;">No items found</div>
                  </td>
                </tr>
              ` : filtered.map(item => {
                const cat = allCategories.find(c => c.id === item.category_id) || { name: item.category_id || 'General' };
                const stock = itemStockMap[item.id] || 0;
                const isActive = (item.status === 'Active' || !item.status);

                return `
                  <tr>
                    <td>
                      <span class="cell-mono cell-strong" style="color: var(--primary-300); font-weight: 600;">${item.code}</span>
                    </td>
                    <td>
                      <div style="font-weight: 500; color: var(--text-primary); font-size: 13px;">${item.name}</div>
                    </td>
                    <td>
                      <span class="cell-mono" style="font-size: 12px;">${item.part_number || item.oem_part_number || '—'}</span>
                    </td>
                    <td>
                      <span style="font-size: 12px;">${cat.name}</span>
                    </td>
                    <td>
                      <span class="badge badge-subtle" style="font-size: 10px; font-weight: 600;">${item.stock_uom || item.base_uom || 'NOS'}</span>
                    </td>
                    <td class="text-right">
                      <span style="font-weight: 600; font-size: 13px;">${stock.toLocaleString('en-IN')}</span>
                    </td>
                    <td class="text-right">
                      <span style="font-weight: 600; font-size: 12.5px;">₹${Number(item.workshop_sale_price || item.sale_price || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 10px; padding: 2px 7px;">
                        ${isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 4px; align-items: center;">
                        <button class="btn btn-icon btn-sm" title="Edit Item" onclick="window.StoreInventoryModule.showEditItemModal('${item.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate' : 'Activate'}" onclick="window.StoreInventoryModule.toggleItemStatus('${item.id}')">
                          ${isActive ? `
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-warning, #f59e0b);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          ` : `
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success, #10b981);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          `}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Delete Item" style="color: var(--color-danger, #ef4444);" onclick="window.StoreInventoryModule.deleteItem('${item.id}')">
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
      </div>
    `;
  },

  exportItemsCsv() {
    if (window.ItemSetupModule && typeof window.ItemSetupModule.exportItemsCsv === 'function') {
      return window.ItemSetupModule.exportItemsCsv();
    }
  },

  showImportItemsModal() {
    if (window.ItemSetupModule && typeof window.ItemSetupModule.showImportItemsModal === 'function') {
      return window.ItemSetupModule.showImportItemsModal();
    }
  },
  // =========================================================================
  renderTransactionMatrixTab() {
    const allStores = window.DB.getAll('warehouses') || [];
    if (allStores.length === 0) {
      return `
        <div class="content-card" style="padding: 40px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 10px;">🏬</div>
          <div style="font-weight: 700; font-size: 15px; color: var(--text-primary); margin-bottom: 6px;">No Stores Available</div>
          <div style="font-size: 12px; max-width: 440px; margin: 0 auto 16px auto; line-height: 1.5;">
            Configure transaction permissions after creating stores. Create your main store or sub-stores in Store Master to begin.
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.location.hash = '#/store-master';">
            + Create Store in Store Master
          </button>
        </div>
      `;
    }
    const configs = window.DB.getAll('storeTransactionConfigs') || [];
    const currentStoreId = this.selectedConfigStoreId || (allStores[0] ? allStores[0].id : 'WH-PUN-MAIN');
    const currentStore = allStores.find(s => s.id === currentStoreId) || allStores[0] || {};
    let storeConfig = configs.find(c => c.store_id === currentStoreId);

    if (!storeConfig) {
      storeConfig = {
        store_id: currentStoreId,
        store_code: currentStore.code,
        store_name: currentStore.name,
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
        scrap_disposal: false,
        inter_branch_transfer: false,
        bin_transfer: true,
        opening_stock: false,
        quarantine: false,
        quality_inspection: false
      };
    }

    // 22 Checkbox definitions from BRD Section 6.4
    const transactionList = [
      { key: 'purchase_requisition', label: 'Purchase Requisition (PR)', category: 'Procurement', desc: 'Raise replenishment demand for stock replenishment' },
      { key: 'purchase_order', label: 'Purchase Order (PO)', category: 'Procurement', desc: 'Issue direct vendor purchase orders' },
      { key: 'grn_receipt', label: 'GRN / Parts Receipt', category: 'Inward', desc: 'Inward physical spare parts shipments from suppliers' },
      { key: 'purchase_return', label: 'Purchase Return (RTV)', category: 'Inward', desc: 'Return defective/excess items back to suppliers' },
      { key: 'material_issue', label: 'General Material Issue', category: 'Internal Issue', desc: 'General consumption issue across workshop floors' },
      { key: 'material_return', label: 'General Material Return', category: 'Internal Issue', desc: 'Return of unused departmental parts' },
      { key: 'job_card_issue', label: 'Job Card Parts Issue', category: 'Workshop Integration', desc: 'Issue parts to technicians referenced to a Job Card (BRD §6.14)' },
      { key: 'job_card_return', label: 'Job Card Parts Return', category: 'Workshop Integration', desc: 'Accept unused parts returned by technician with stock auto-increase (BRD §6.15)' },
      { key: 'stock_transfer', label: 'Store-to-Store Stock Transfer', category: 'Transfers', desc: 'Permit outbound/inbound transfer between main & sub stores (BRD §6.18)' },
      { key: 'stock_adjustment', label: 'Stock Adjustment', category: 'Inventory Governance', desc: 'Post ad-hoc stock adjustments with mandatory audit reason (BRD §6.19)' },
      { key: 'physical_stock_count', label: 'Physical Stock Count', category: 'Inventory Governance', desc: 'Freeze snapshot & calculate physical variances (BRD §6.20)' },
      { key: 'stock_reservation', label: 'Stock Reservation', category: 'Workshop Integration', desc: 'Lock available stock for job card allocation (Available = On Hand - Reserved)' },
      { key: 'walk_in_sale', label: 'Walk-in Retail Sale', category: 'Commercial Sales', desc: 'Direct counter spare part sale to walk-in customers' },
      { key: 'counter_sale', label: 'Over-the-Counter (OTC) Sale', category: 'Commercial Sales', desc: 'Trade invoice parts issue without vehicle job card' },
      { key: 'sales_return', label: 'Sales Return (Customer)', category: 'Commercial Sales', desc: 'Customer return of counter sold items' },
      { key: 'warranty_return', label: 'Warranty Parts Return', category: 'Warranty & Scrap', desc: 'Permit receiving replaced warranty defective items (BRD §6.16)' },
      { key: 'scrap_disposal', label: 'Scrap / Salvage Disposal', category: 'Warranty & Scrap', desc: 'Authorize transfer and disposal of metal/rubber scrap (BRD §6.17)' },
      { key: 'inter_branch_transfer', label: 'Inter-Facility Transfer', category: 'Transfers', desc: 'Permit movement between Pune, Chennai or regional service facilities' },
      { key: 'bin_transfer', label: 'Bin-to-Bin Transfer', category: 'Storage Management', desc: 'Permit re-slotting inventory across internal storage bins' },
      { key: 'opening_stock', label: 'Opening Stock Entry', category: 'Inventory Governance', desc: 'Initial baseline stock upload and opening reconciliation' },
      { key: 'quarantine', label: 'Quarantine & Hold', category: 'Quality & Storage', desc: 'Hold suspect batches or transit-damaged items' },
      { key: 'quality_inspection', label: 'Quality Inspection (QA)', category: 'Quality & Storage', desc: 'Gate parts through technical QA check before storage' }
    ];

    const enabledCount = transactionList.filter(t => storeConfig[t.key] === true).length;

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin: 0;">Select Store to Configure:</label>
            <select 
              id="matrix-store-select" 
              class="form-control form-control-sm" 
              style="width: 320px; font-weight: 600;" 
              onchange="window.StoreInventoryModule.changeMatrixStore(this.value)"
            >
              ${allStores.map(s => `
                <option value="${s.id}" ${s.id === currentStoreId ? 'selected' : ''}>
                  🏬 ${s.name} (${s.code})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-outline btn-sm" onclick="window.StoreInventoryModule.applyPreset('MAIN')">Apply Main Store Preset</button>
            <button class="btn btn-outline btn-sm" onclick="window.StoreInventoryModule.applyPreset('SUB')">Apply Workshop Sub Store Preset</button>
            <button class="btn btn-primary btn-sm" onclick="window.StoreInventoryModule.saveMatrixForm('${currentStoreId}')">
              <span>💾 Save Store Transaction Rules</span>
            </button>
          </div>
        </div>

        <!-- Banner -->
        <div style="background: rgba(99, 102, 241, 0.05); border-left: 3px solid var(--primary-500); padding: 8px 14px; margin-bottom: 16px; font-size: 11.5px; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <strong>Configuration-Driven Enforcement (BRD §6.4 & BR-006):</strong>
            Transactions with unchecked boxes are strictly prohibited from initiating against <strong>${currentStore.name}</strong>.
          </div>
          <span style="font-weight: 600; color: var(--primary-300);">${enabledCount} of 22 Transactions Enabled</span>
        </div>

        <!-- 22 Checkboxes Matrix Grid -->
        <form id="store-transaction-matrix-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.saveMatrixForm('${currentStoreId}');">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 12px;">
            ${transactionList.map(t => {
              const isChecked = storeConfig[t.key] === true;
              return `
                <div style="background: var(--bg-surface); border: 1px solid ${isChecked ? 'var(--primary-500)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); padding: 12px 14px; display: flex; align-items: flex-start; gap: 12px; transition: all 0.2s;">
                  <input 
                    type="checkbox" 
                    id="tx-${t.key}" 
                    name="${t.key}" 
                    ${isChecked ? 'checked' : ''} 
                    style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer; accent-color: var(--primary-500);" 
                    onchange="this.closest('div').style.borderColor = this.checked ? 'var(--primary-500)' : 'var(--border-subtle)';"
                  />
                  <div style="flex: 1;">
                    <label for="tx-${t.key}" style="font-size: 13px; font-weight: 600; color: var(--text-primary); cursor: pointer; margin-bottom: 2px; display: block;">
                      ${t.label}
                    </label>
                    <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">${t.desc}</div>
                    <span class="badge badge-subtle" style="font-size: 9px; margin-top: 4px; display: inline-block;">${t.category}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="margin-top: 18px; text-align: right;">
            <button type="submit" class="btn btn-primary">
              <span>💾 Commit Store Transaction Matrix</span>
            </button>
          </div>
        </form>
      </div>
    `;
  },

  changeMatrixStore(storeId) {
    this.selectedConfigStoreId = storeId;
    this.render();
  },

  applyPreset(type) {
    const form = document.getElementById('store-transaction-matrix-form');
    if (!form) return;

    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    if (type === 'MAIN') {
      const mainAllowed = ['purchase_requisition', 'purchase_order', 'grn_receipt', 'purchase_return', 'material_issue', 'material_return', 'stock_transfer', 'stock_adjustment', 'physical_stock_count', 'stock_reservation', 'walk_in_sale', 'counter_sale', 'sales_return', 'inter_branch_transfer', 'bin_transfer', 'opening_stock', 'quarantine', 'quality_inspection'];
      checkboxes.forEach(cb => {
        cb.checked = mainAllowed.includes(cb.name);
        cb.closest('div').style.borderColor = cb.checked ? 'var(--primary-500)' : 'var(--border-subtle)';
      });
      window.State.showToast('Applied Main Store configuration preset');
    } else if (type === 'SUB') {
      const subAllowed = ['purchase_requisition', 'material_issue', 'material_return', 'job_card_issue', 'job_card_return', 'stock_transfer', 'stock_adjustment', 'physical_stock_count', 'stock_reservation', 'walk_in_sale', 'counter_sale', 'sales_return', 'bin_transfer', 'opening_stock'];
      checkboxes.forEach(cb => {
        cb.checked = subAllowed.includes(cb.name);
        cb.closest('div').style.borderColor = cb.checked ? 'var(--primary-500)' : 'var(--border-subtle)';
      });
      window.State.showToast('Applied Workshop Sub Store configuration preset');
    }
  },

  saveMatrixForm(storeId) {
    const form = document.getElementById('store-transaction-matrix-form');
    if (!form) return;

    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    const matrix = {};
    checkboxes.forEach(cb => {
      matrix[cb.name] = cb.checked;
    });

    window.DB.saveStoreTransactionConfig(storeId, matrix);
    window.State.showToast('Store Transaction Matrix successfully saved and enforced!');
    this.render();
  },

  // =========================================================================
  // TAB 4: VEHICLE MODEL COMPATIBILITY MASTER
  // =========================================================================
  renderVehicleCompatibilityTab() {
    const manufacturers = window.DB.getAll('vehicleManufacturers') || [];
    const models = window.DB.getAll('vehicleModels') || [];
    const compatibilities = window.DB.getAll('itemVehicleCompatibility') || [];
    const items = window.DB.getAll('items') || [];
    const balances = window.DB.getAll('inventoryBalances') || [];

    const filtered = compatibilities.filter(c => {
      if (this.vehicleFilter !== 'ALL' && c.model_id !== this.vehicleFilter) return false;
      if (this.searchTerm) {
        const it = items.find(i => i.id === c.item_id) || {};
        const mod = models.find(m => m.id === c.model_id) || {};
        const q = this.searchTerm;
        const matchItem = (it.name || '').toLowerCase().includes(q) || (it.code || '').toLowerCase().includes(q);
        const matchModel = (mod.name || '').toLowerCase().includes(q);
        if (!matchItem && !matchModel) return false;
      }
      return true;
    });

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <input 
              type="text" 
              id="store-sub-search"
              class="form-control form-control-sm" 
              placeholder="Search part name, bike model, variant..." 
              value="${this.searchTerm}" 
              oninput="window.StoreInventoryModule.setSearch(this.value)" 
              style="width: 280px;" 
            />
            <select class="form-control form-control-sm" onchange="window.StoreInventoryModule.setVehicleFilter(this.value)" style="width: 220px;">
              <option value="ALL" ${this.vehicleFilter === 'ALL' ? 'selected' : ''}>All Two-Wheeler Models</option>
              ${models.map(m => `<option value="${m.id}" ${this.vehicleFilter === m.id ? 'selected' : ''}>🏍️ ${m.name} (${m.variant})</option>`).join('')}
            </select>
          </div>

          <div>
            <button class="btn btn-primary btn-sm" onclick="window.StoreInventoryModule.showAddCompatibilityModal()">
              <span>+ Add Compatibility Rule</span>
            </button>
          </div>
        </div>

        <div style="background: rgba(99, 102, 241, 0.05); border-left: 3px solid var(--primary-500); padding: 8px 14px; margin-bottom: 12px; font-size: 11.5px; color: var(--text-secondary);">
          <strong>Two-Wheeler Compatibility Architecture (BRD §6.9):</strong> Spare Part Item &rarr; Vehicle Manufacturer &rarr; Model &rarr; Variant &rarr; Year Range. Automatically feeds smart compatible part recommendations during Job Card creation.
        </div>

        <!-- Compatibility Grid -->
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Spare Part Item</th>
                <th>Vehicle Manufacturer</th>
                <th>Bike Model & Variant</th>
                <th>Year Range</th>
                <th>Fitment Specification</th>
                <th class="text-center">Live Stock Available</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">
                    <div>No vehicle compatibility records match your filter criteria.</div>
                  </td>
                </tr>
              ` : filtered.map(c => {
                const it = items.find(i => i.id === c.item_id) || { code: c.item_id, name: c.item_id };
                const mfg = manufacturers.find(m => m.id === c.manufacturer_id) || { name: 'OEM' };
                const mod = models.find(m => m.id === c.model_id) || { name: 'Universal Model' };

                // Calculate total available stock across all stores
                const totalAvail = balances
                  .filter(b => b.item_id === c.item_id)
                  .reduce((acc, b) => acc + (b.available || 0), 0);

                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: var(--primary-300);">${it.code}</div>
                      <div style="font-weight: 600; font-size: 12.5px; color: var(--text-primary);">${it.name}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; font-size: 12px;">${mfg.name}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">${mfg.country}</div>
                    </td>
                    <td>
                      <div style="font-weight: 700; font-size: 13px; color: var(--accent-300);">🏍️ ${mod.name}</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">${c.variant || mod.variant}</div>
                    </td>
                    <td>
                      <div class="cell-mono" style="font-size: 11.5px; font-weight: 600;">${c.year_from} - ${c.year_to}</div>
                    </td>
                    <td>
                      <div style="font-size: 11px; color: var(--text-secondary);">${c.notes || 'Direct OEM Fitment'}</div>
                    </td>
                    <td class="text-center">
                      <span class="badge ${totalAvail > 10 ? 'badge-success' : (totalAvail > 0 ? 'badge-warning' : 'badge-danger')}" style="font-size: 11px; padding: 2px 8px; font-family: var(--font-mono);">
                        ${totalAvail} units
                      </span>
                    </td>
                    <td class="text-right">
                      <button class="btn btn-icon btn-sm" onclick="window.StoreInventoryModule.deleteCompatibility('${c.id}')" title="Delete Rule" style="color: var(--color-danger, #ef4444);">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setVehicleFilter(val) {
    this.vehicleFilter = val;
    this.render();
  },

  // =========================================================================
  // TAB 5: WORKSHOP & JOB CARD PARTS WORKFLOW
  // =========================================================================
  renderJobCardWorkflowTab() {
    const plantId = window.State.currentPlantId;
    const allJobCards = window.DB.getAll('jobCards') || [];
    const jobCards = allJobCards.filter(jc => {
      if (jc.store_id && !window.DB.isWarehouseActive(jc.store_id)) return false;
      const wh = window.DB.getById('warehouses', jc.store_id);
      const jcPlantId = jc.plant_id || (wh ? wh.plant_id : null);
      if (jcPlantId && !window.DB.isPlantActive(jcPlantId)) return false;
      return plantId === 'ALL' || !jcPlantId || jcPlantId === plantId;
    });
    const items = window.DB.getAll('items') || [];
    const balances = (window.DB.getAll('inventoryBalances') || []).filter(b => window.DB.isPlantActive(b.plant_id));
    const stores = window.DB.getActiveWarehouses(plantId === 'ALL' ? undefined : plantId);

    const activeJCId = this.selectedJobCardId || (jobCards[0] ? jobCards[0].id : null);
    const currentJC = jobCards.find(j => j.id === activeJCId) || jobCards[0];

    return `
      <div style="display: grid; grid-template-columns: 320px 1fr; gap: 16px; align-items: start;">
        <!-- Left: Job Card Selector List -->
        <div class="content-card" style="padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Two-Wheeler Job Cards</div>
            <button class="btn btn-primary btn-sm" onclick="window.BillingModule ? window.BillingModule.showNewJobCardModal() : window.StoreInventoryModule.showCreateJobCardModal()" style="font-size: 11px; padding: 3px 8px;">
              + New Job Card
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${jobCards.length === 0 ? `
              <div style="text-align: center; padding: 36px 10px; color: var(--text-muted); font-size: 12px; display: flex; flex-direction: column; gap: 8px; align-items: center;">
                <div style="font-size: 24px;">📭</div>
                <div style="font-weight: 600; color: var(--text-primary);">No Job Cards Available</div>
                <div style="font-size: 11px;">Create a Job Card to requisition parts.</div>
              </div>
            ` : jobCards.map(jc => {
              const isSelected = jc.id === (currentJC ? currentJC.id : '');
              const statusColors = {
                PARTS_RESERVED: 'badge-warning',
                PARTS_ISSUED: 'badge-primary',
                COMPLETED: 'badge-success',
                OPEN_DIAGNOSIS: 'badge-subtle'
              };
              return `
                <div 
                  onclick="window.StoreInventoryModule.selectJobCard('${jc.id}')"
                  style="background: ${isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-surface)'}; border: 1px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); padding: 10px 12px; cursor: pointer; transition: all 0.2s;"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span class="cell-mono" style="font-weight: 700; font-size: 12px; color: var(--primary-300);">${jc.job_card_no}</span>
                    <span class="badge ${statusColors[jc.status] || 'badge-subtle'}" style="font-size: 9px; padding: 1px 6px;">
                      ${jc.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style="font-size: 12.5px; font-weight: 600; color: var(--text-primary);">🏍️ ${jc.vehicle_reg_no}</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">${jc.vehicle_model} &bull; ${jc.customer_name}</div>
                  <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 3px;">Tech: ${jc.technician_name}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right: Active Job Card Parts Issue / Return Operations Console -->
        ${currentJC ? `
          <div class="content-card">
            <!-- Job Card Banner Header -->
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <h3 style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0;">${currentJC.job_card_no}</h3>
                    <span class="badge badge-primary" style="font-size: 10.5px;">${currentJC.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
                    <strong>Vehicle:</strong> <span style="color: var(--accent-300); font-weight: 700;">${currentJC.vehicle_reg_no}</span> (${currentJC.vehicle_model} - ${currentJC.vehicle_variant}) &bull; <strong>Customer:</strong> ${currentJC.customer_name} (📱 ${currentJC.customer_mobile})
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                    <strong>Service Type:</strong> ${currentJC.service_type} &bull; <strong>Technician Assigned:</strong> ${currentJC.technician_name} &bull; <strong>Store:</strong> ${currentJC.store_id}
                  </div>
                </div>

                <!-- Action Controls -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button class="btn btn-outline btn-sm" onclick="window.StoreInventoryModule.showAddPartsToJobCardModal('${currentJC.id}')">
                    + Add Parts
                  </button>
                </div>
              </div>

              <!-- Diagnosis Note -->
              <div style="margin-top: 10px; padding: 6px 10px; background: rgba(0,0,0,0.15); border-radius: 4px; font-size: 11px; color: var(--text-secondary);">
                <strong>Technician Diagnosis:</strong> ${currentJC.diagnosis}
              </div>
            </div>

            <!-- Parts Bill of Materials Table -->
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
              Requisite Spare Parts & Availability Matrix (BRD §6.13 - §6.15)
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item Code & Description</th>
                    <th class="text-center">Required Qty</th>
                    <th class="text-center">Reserved Qty</th>
                    <th class="text-center">Issued Qty</th>
                    <th class="text-center">Returned Qty</th>
                    <th>Storage Bin</th>
                    <th>Stock Status (Live)</th>
                    <th>Part Status</th>
                    <th class="text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${currentJC.parts_required.map(p => {
                    // Look up stock balance for this item
                    const bal = balances.find(b => b.item_id === p.item_id && b.warehouse_id === (currentJC.store_id || 'WH-PUN-SPARE')) 
                      || balances.find(b => b.item_id === p.item_id) 
                      || { on_hand: 0, reserved: 0, available: 0 };

                    const statusPill = {
                      RESERVED: '<span class="badge badge-warning" style="font-size: 9.5px;">Reserved</span>',
                      ISSUED: '<span class="badge badge-primary" style="font-size: 9.5px;">Issued to Tech</span>',
                      RETURNED: '<span class="badge badge-subtle" style="font-size: 9.5px;">Returned</span>',
                      PENDING: '<span class="badge badge-danger" style="font-size: 9.5px;">Pending Reserve</span>'
                    };

                    return `
                      <tr>
                        <td>
                          <div class="cell-mono cell-strong" style="color: var(--primary-300);">${p.item_code}</div>
                          <div style="font-size: 12px; font-weight: 600;">${p.item_name}</div>
                        </td>
                        <td class="text-center cell-mono" style="font-weight: 700; font-size: 13px;">${p.qty}</td>
                        <td class="text-center cell-mono" style="color: var(--color-warning); font-weight: 600;">${p.reserved_qty || 0}</td>
                        <td class="text-center cell-mono" style="color: var(--primary-300); font-weight: 600;">${p.issued_qty || 0}</td>
                        <td class="text-center cell-mono" style="color: var(--color-success); font-weight: 600;">${p.returned_qty || 0}</td>
                        <td>
                          <span class="cell-mono" style="font-size: 11px; font-weight: 600; color: var(--accent-300);">${p.bin_id || 'BIN-PUN-A01'}</span>
                        </td>
                        <td>
                          <div style="font-size: 11px; font-family: var(--font-mono);">
                            On Hand: <strong>${bal.on_hand}</strong> &bull; Reserved: <strong>${bal.reserved}</strong>
                          </div>
                          <div style="font-size: 11px; color: ${bal.available > 0 ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: 600;">
                            Available: ${bal.available}
                          </div>
                        </td>
                        <td>
                          ${statusPill[p.status] || '<span class="badge badge-subtle">Pending</span>'}
                        </td>
                        <td class="text-right cell-mono" style="font-weight: 600;">
                          ₹${p.unit_price}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div class="content-card" style="padding: 60px 20px; text-align: center; color: var(--text-muted);">
            <div style="font-size: 38px; margin-bottom: 12px;">⚙️</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">Parts Requisition & Issue Console</div>
            <div style="font-size: 12.5px; color: var(--text-secondary); max-width: 440px; margin: 0 auto 16px auto;">
              No Job Card is currently selected. Create a new Job Card or select one from the list to requisition and issue workshop parts.
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.BillingModule ? window.BillingModule.showNewJobCardModal() : window.StoreInventoryModule.showCreateJobCardModal()" style="padding: 6px 18px; font-weight: 600;">
              + Create New Job Card
            </button>
          </div>
        `}
      </div>
    `;
  },

  selectJobCard(jcId) {
    this.selectedJobCardId = jcId;
    if (window.BillingModule && (window.location.hash === '#/job-card-parts' || window.location.hash === '#/job-cards')) {
      window.BillingModule.refresh();
    } else {
      this.render();
    }
  },

  reservePartsAction(jcId) {
    const jc = window.DB.getById('jobCards', jcId);
    if (!jc) {
      window.State.showToast('Job Card not found.', 'error');
      return;
    }
    const parts = Array.isArray(jc.parts_required) ? jc.parts_required : [];
    if (parts.length === 0) {
      window.State.showToast(`Cannot reserve parts: No spare parts have been added to Job Card ${jc.job_card_no} yet. Please add parts first.`, 'warning');
      return;
    }
    const hasPending = parts.some(p => p.status === 'PENDING' || !p.status);
    if (!hasPending) {
      window.State.showToast(`All spare parts are already reserved or issued for Job Card ${jc.job_card_no}.`, 'info');
      return;
    }
    try {
      window.DB.reserveJobCardParts(jcId);
      window.State.showToast('Parts successfully reserved for Job Card (Stock: Available = On Hand - Reserved)');
      if (window.BillingModule && (window.location.hash === '#/job-card-parts' || window.location.hash === '#/job-cards')) {
        window.BillingModule.refresh();
      } else {
        this.render();
      }
    } catch (e) {
      window.State.showToast(e.message, 'error');
    }
  },

  issuePartsAction(jcId) {
    const jc = window.DB.getById('jobCards', jcId);
    if (!jc) {
      window.State.showToast('Job Card not found.', 'error');
      return;
    }
    const parts = Array.isArray(jc.parts_required) ? jc.parts_required : [];
    if (parts.length === 0) {
      window.State.showToast(`Cannot issue parts: No spare parts have been added to Job Card ${jc.job_card_no} yet. Please add parts first.`, 'warning');
      return;
    }
    const hasIssuable = parts.some(p => p.status === 'RESERVED' || p.status === 'PENDING');
    if (!hasIssuable) {
      window.State.showToast(`All spare parts have already been issued for Job Card ${jc.job_card_no}.`, 'info');
      return;
    }
    try {
      window.DB.issueJobCardParts(jcId);
      window.State.showToast('Parts successfully issued to Technician and deducted from Store stock!');
      if (window.BillingModule && (window.location.hash === '#/job-card-parts' || window.location.hash === '#/job-cards')) {
        window.BillingModule.refresh();
      } else {
        this.render();
      }
    } catch (e) {
      window.State.showToast(e.message, 'error');
    }
  },

  closeJobCardAction(jcId) {
    try {
      window.DB.closeJobCard(jcId);
      window.State.showToast('Job Card closed and completed successfully!');
      if (window.BillingModule && (window.location.hash === '#/job-card-parts' || window.location.hash === '#/job-cards')) {
        window.BillingModule.refresh();
      } else {
        this.render();
      }
    } catch (e) {
      window.State.showToast(e.message, 'error');
    }
  },



  // =========================================================================
  // TAB 7: PHYSICAL STOCK COUNT & VARIANCE ADJUSTMENTS
  // =========================================================================
  renderPhysicalCountTab() {
    const plantId = window.State.currentPlantId;
    const allSessions = window.DB.getAll('stockCountSessions') || [];
    const sessions = allSessions.filter(s => {
      if (s.store_id && !window.DB.isWarehouseActive(s.store_id)) return false;
      const wh = window.DB.getById('warehouses', s.store_id);
      const sPlantId = wh ? wh.plant_id : null;
      if (sPlantId && !window.DB.isPlantActive(sPlantId)) return false;
      return plantId === 'ALL' || !sPlantId || sPlantId === plantId;
    });
    const stores = window.DB.getActiveWarehouses(plantId === 'ALL' ? undefined : plantId);

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">
            Physical Stock Counting & Discrepancy Reconciliation (BRD §6.20)
          </div>

          <div>
            <button class="btn btn-primary btn-sm" onclick="window.StoreInventoryModule.showStartCountSessionModal()">
              <span>📸 Freeze & Start New Stock Count</span>
            </button>
          </div>
        </div>

        <div style="background: rgba(99, 102, 241, 0.05); border-left: 3px solid var(--primary-500); padding: 8px 14px; margin-bottom: 14px; font-size: 11.5px; color: var(--text-secondary);">
          <strong>Physical Count Workflow (BRD §6.20):</strong> Snapshot Freeze &rarr; Physical Counting &rarr; Enter Count &rarr; Real-Time Variance Calculation (Variance = Physical Qty - System Qty) &rarr; Final Approval & Auto-Adjust.
        </div>

        ${sessions.map(s => {
          const isFinal = s.status === 'FINALIZED';
          return `
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                <div>
                  <span class="cell-mono cell-strong" style="font-size: 13px; color: var(--primary-300);">${s.session_no}</span>
                  <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-left: 8px;">🏬 ${s.store_name}</span>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                    Frozen: ${window.formatDateTime(s.freeze_timestamp)} &bull; Auditor: ${s.auditor}
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge ${isFinal ? 'badge-success' : 'badge-warning'}" style="font-size: 10px;">${s.status}</span>
                  ${!isFinal ? `
                    <button class="btn btn-sm btn-primary" onclick="window.StoreInventoryModule.finalizeCountAction('${s.id}')">
                      ⚖️ Finalize & Post Adjustments
                    </button>
                  ` : `
                    <span style="font-size: 11px; color: var(--color-success); font-weight: 600;">✓ Adjustments Posted</span>
                  `}
                </div>
              </div>

              <!-- Item Count Variance Table -->
              <div class="table-responsive">
                <table class="data-table" style="font-size: 11.5px;">
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th class="text-center">System Snapshot Qty</th>
                      <th class="text-center">Physical Counted Qty</th>
                      <th class="text-center">Variance (Diff)</th>
                      <th class="text-right">Unit Valuation</th>
                      <th class="text-right">Variance Value</th>
                      <th>Variance Analysis & Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${s.items.map(it => {
                      const isShort = it.variance < 0;
                      const isExcess = it.variance > 0;
                      return `
                        <tr>
                          <td style="font-weight: 600;">${it.item_name}</td>
                          <td class="text-center cell-mono">${it.system_qty}</td>
                          <td class="text-center cell-mono" style="font-weight: 700;">${it.physical_qty}</td>
                          <td class="text-center cell-mono" style="font-weight: 700; color: ${isShort ? 'var(--color-danger)' : (isExcess ? 'var(--color-success)' : 'var(--text-muted)')};">
                            ${it.variance > 0 ? '+' + it.variance : it.variance}
                          </td>
                          <td class="text-right cell-mono">₹${it.unit_cost}</td>
                          <td class="text-right cell-mono" style="font-weight: 700; color: ${it.variance_value < 0 ? 'var(--color-danger)' : (it.variance_value > 0 ? 'var(--color-success)' : 'var(--text-muted)')};">
                            ${it.variance_value !== 0 ? '₹' + it.variance_value : '₹0'}
                          </td>
                          <td style="font-size: 11px; color: var(--text-secondary);">${it.reason || 'Variance recorded'}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  finalizeCountAction(sessionId) {
    try {
      window.DB.finalizeStockCount(sessionId, null, true);
      window.State.showToast('Physical count finalized and stock adjustments automatically posted to inventory balances!');
      this.render();
    } catch (e) {
      window.State.showToast(e.message, 'error');
    }
  },

  // =========================================================================
  // TAB 8: WARRANTY & SCRAP STORES MANAGEMENT
  // =========================================================================
  renderWarrantyScrapTab() {
    const plantId = window.State.currentPlantId;
    const allClaims = window.DB.getAll('warrantyClaims') || [];
    const claims = allClaims.filter(c => {
      if (c.store_id && !window.DB.isWarehouseActive(c.store_id)) return false;
      const wh = window.DB.getById('warehouses', c.store_id);
      const cPlantId = c.plant_id || (wh ? wh.plant_id : null);
      if (cPlantId && !window.DB.isPlantActive(cPlantId)) return false;
      return plantId === 'ALL' || !cPlantId || cPlantId === plantId;
    });
    const allScraps = window.DB.getAll('scrapDisposals') || [];
    const scraps = allScraps.filter(s => {
      if (s.store_id && !window.DB.isWarehouseActive(s.store_id)) return false;
      const wh = window.DB.getById('warehouses', s.store_id);
      const sPlantId = s.plant_id || (wh ? wh.plant_id : null);
      if (sPlantId && !window.DB.isPlantActive(sPlantId)) return false;
      return plantId === 'ALL' || !sPlantId || sPlantId === plantId;
    });

    return `
      <div class="content-card">
        <!-- Sub-Tabs: Warranty vs Scrap -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
          <button 
            class="btn ${this.warrantySubTab === 'WARRANTY' ? 'btn-primary' : 'btn-outline'} btn-sm" 
            onclick="window.StoreInventoryModule.setWarrantySubTab('WARRANTY')"
          >
            🛡️ OEM Warranty Store (Defective Parts & Claims)
          </button>
          <button 
            class="btn ${this.warrantySubTab === 'SCRAP' ? 'btn-primary' : 'btn-outline'} btn-sm" 
            onclick="window.StoreInventoryModule.setWarrantySubTab('SCRAP')"
          >
            ♻️ Scrap & Salvage Disposal Store
          </button>
        </div>

        ${this.warrantySubTab === 'WARRANTY' ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
              Dedicated Warranty Store & OEM Settlement Claims (BRD §6.16)
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.StoreInventoryModule.showRaiseWarrantyClaimModal()">
              + Raise Warranty Claim
            </button>
          </div>

          <div style="background: rgba(99, 102, 241, 0.05); border-left: 3px solid var(--primary-500); padding: 8px 14px; margin-bottom: 12px; font-size: 11.5px; color: var(--text-secondary);">
            <strong>Warranty Tracking Flow (BRD §17.3):</strong> Job Card Part Replaced &rarr; Defective Part &rarr; Warranty Store &rarr; OEM Claim &rarr; Inspection &rarr; Replacement / Credit Note.
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Claim # & Date</th>
                  <th>Job Card & Vehicle</th>
                  <th>Defective Part Description</th>
                  <th>OEM Manufacturer</th>
                  <th class="text-right">Claim Value</th>
                  <th>Defect Diagnostic Reason</th>
                  <th>Claim Status</th>
                  <th>Resolution</th>
                </tr>
              </thead>
              <tbody>
                ${claims.map(c => `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: var(--primary-300);">${c.claim_no}</div>
                      <div style="font-size: 10.5px; color: var(--text-muted);">${window.formatDate(c.claim_date)}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; font-size: 12px;">${c.vehicle_reg_no}</div>
                      <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${c.job_card_id} &bull; ${c.customer_name}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; font-size: 12px;">${c.item_name}</div>
                      <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">Batch: ${c.batch_no}</div>
                    </td>
                    <td>
                      <div style="font-size: 12px; font-weight: 500;">${c.oem_manufacturer}</div>
                    </td>
                    <td class="text-right cell-mono" style="font-weight: 600;">₹${c.claim_amount}</td>
                    <td>
                      <div style="font-size: 11px; color: var(--text-secondary); max-width: 220px;">${c.defect_reason}</div>
                    </td>
                    <td>
                      <span class="badge ${c.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}" style="font-size: 10px;">
                        ${c.status}
                      </span>
                    </td>
                    <td>
                      <div style="font-size: 11px; color: var(--color-success); font-weight: 600;">${c.resolution}</div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <!-- SCRAP STORE VIEW -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
              Scrap Management & Authorized Disposal Ledger (BRD §6.17 & §17.4)
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.StoreInventoryModule.showCreateScrapDisposalModal()">
              + Record Scrap Disposal
            </button>
          </div>

          <div style="background: rgba(99, 102, 241, 0.05); border-left: 3px solid var(--primary-500); padding: 8px 14px; margin-bottom: 12px; font-size: 11.5px; color: var(--text-secondary);">
            <strong>Scrap Disposal Workflow (BRD §17.4):</strong> Workshop Defective Part &rarr; Scrap Store &rarr; Authorizing Gate Pass &rarr; Recycler Weigh-in & Settlement.
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Disposal Gate Pass #</th>
                  <th>Scrap Description</th>
                  <th>Category</th>
                  <th class="text-center">Weight / Qty</th>
                  <th class="text-right">Valuation Amount</th>
                  <th>Authorized By</th>
                  <th>Recycler / Buyer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${scraps.map(s => `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: var(--primary-300);">${s.disposal_no}</div>
                      <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${s.gate_pass_no} &bull; ${window.formatDate(s.disposal_date)}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; font-size: 12px;">${s.scrap_type}</div>
                      <div style="font-size: 10.5px; color: var(--text-muted);">${s.reason}</div>
                    </td>
                    <td>
                      <span class="badge badge-subtle" style="font-size: 10px;">${s.category}</span>
                    </td>
                    <td class="text-center cell-mono" style="font-weight: 700;">${s.qty_kg} kg</td>
                    <td class="text-right cell-mono" style="font-weight: 600; color: var(--color-success);">₹${s.valuation_amount}</td>
                    <td>
                      <div style="font-size: 11.5px;">${s.authorized_by}</div>
                    </td>
                    <td>
                      <div style="font-weight: 500; font-size: 11.5px;">${s.buyer_name}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">${s.disposal_method}</div>
                    </td>
                    <td>
                      <span class="badge ${s.status === 'DISPOSED' ? 'badge-success' : 'badge-warning'}" style="font-size: 10px;">
                        ${s.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  setWarrantySubTab(tab) {
    this.warrantySubTab = tab;
    this.render();
  },

  // =========================================================================
  // TAB 9: CONFIGURABLE INVENTORY RULES & STORE ACCESS
  // =========================================================================
  renderInventoryRulesTab() {
    const rules = window.DB.getAll('inventoryRules') || {};
    const users = window.DB.getAll('users') || [];
    const stores = window.DB.getAll('warehouses') || [];

    return `
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; align-items: start;">
        <!-- Left: Global System Inventory Rules Form -->
        <div class="content-card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">
              Global Store & Inventory Master Policy Rules (BRD §6.11)
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.StoreInventoryModule.saveRulesForm()">
              💾 Save Global Rules
            </button>
          </div>

          <form id="global-inventory-rules-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.saveRulesForm();">
            <div style="display: flex; flex-direction: column; gap: 14px;">
              
              <!-- Rule: Negative Stock -->
              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Allow Negative Stock (Rule BR-010)</div>
                  <div style="font-size: 11px; color: var(--text-muted);">When disabled, system strictly prevents issuing parts exceeding available inventory.</div>
                </div>
                <input type="checkbox" name="allow_negative_stock" ${rules.allow_negative_stock ? 'checked' : ''} style="width: 20px; height: 20px;" />
              </div>

              <!-- Rule: Backdated Transactions -->
              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Allow Backdated Transactions</div>
                  <div style="font-size: 11px; color: var(--text-muted);">Restrict transactions dated prior to current business day.</div>
                </div>
                <input type="checkbox" name="allow_backdated_transactions" ${rules.allow_backdated_transactions ? 'checked' : ''} style="width: 20px; height: 20px;" />
              </div>

              <!-- Rule: Stock Reservation -->
              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Enforce Job Card Stock Reservation</div>
                  <div style="font-size: 11px; color: var(--text-muted);">Exclude reserved parts from available-to-use balance (BRD §6.13).</div>
                </div>
                <input type="checkbox" name="stock_reservation_enabled" ${rules.stock_reservation_enabled ? 'checked' : ''} style="width: 20px; height: 20px;" />
              </div>

              <!-- Rule: Bin Mandatory -->
              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Mandatory Bin Location for Storage (Rule BR-018)</div>
                  <div style="font-size: 11px; color: var(--text-muted);">Require physical Bin/Rack selection during receipt, transfer, and issue.</div>
                </div>
                <input type="checkbox" name="bin_mandatory_enabled" ${rules.bin_mandatory_enabled ? 'checked' : ''} style="width: 20px; height: 20px;" />
              </div>

              <!-- Rule: Batch & Serial Tracking -->
              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Serial & Battery Tracking</div>
                  <div style="font-size: 11px; color: var(--text-muted);">Enforce serial number recording for batteries and high-value components.</div>
                </div>
                <input type="checkbox" name="serial_tracking_enabled" ${rules.serial_tracking_enabled ? 'checked' : ''} style="width: 20px; height: 20px;" />
              </div>

              <!-- Rule: Approvals -->
              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Require Scrap & Adjustment Manager Approval</div>
                  <div style="font-size: 11px; color: var(--text-muted);">Enforce tiered approval workflow before ledger posting (Rule BR-011).</div>
                </div>
                <input type="checkbox" name="scrap_approval_required" ${rules.scrap_approval_required ? 'checked' : ''} style="width: 20px; height: 20px;" />
              </div>

            </div>
          </form>
        </div>

        <!-- Right: Store User & Technician Scoping Matrix -->
        <div class="content-card">
          <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
            User & Technician Store Authorization (BRD §6.21 & BR-012)
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">
            Store operators and technicians can only transact against permitted stores.
          </div>

          <div class="table-responsive">
            <table class="data-table" style="font-size: 11.5px;">
              <thead>
                <tr>
                  <th>User / Technician</th>
                  <th>Role</th>
                  <th>Permitted Stores</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style="font-weight: 600;">Rajesh Sharma</div>
                    <div style="font-size: 10px; color: var(--text-muted);">USR-002</div>
                  </td>
                  <td><span class="badge badge-primary" style="font-size: 9.5px;">Store Manager</span></td>
                  <td><span class="badge badge-subtle">Main Store, Spare Parts</span></td>
                </tr>
                <tr>
                  <td>
                    <div style="font-weight: 600;">Santosh Shinde</div>
                    <div style="font-size: 10px; color: var(--text-muted);">USR-004</div>
                  </td>
                  <td><span class="badge badge-warning" style="font-size: 9.5px;">Technician</span></td>
                  <td><span class="badge badge-subtle">Workshop Floor, Spare Parts</span></td>
                </tr>
                <tr>
                  <td>
                    <div style="font-weight: 600;">Suresh Nair</div>
                    <div style="font-size: 10px; color: var(--text-muted);">USR-006</div>
                  </td>
                  <td><span class="badge badge-subtle" style="font-size: 9.5px;">Yard In-Charge</span></td>
                  <td><span class="badge badge-subtle">Scrap Store, Warranty Store</span></td>
                </tr>
                <tr>
                  <td>
                    <div style="font-weight: 600;">Pravin Patil</div>
                    <div style="font-size: 10px; color: var(--text-muted);">USR-001</div>
                  </td>
                  <td><span class="badge badge-success" style="font-size: 9.5px;">System Administrator</span></td>
                  <td><span class="badge badge-success">All Stores (Global Access)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  saveRulesForm() {
    const form = document.getElementById('global-inventory-rules-form');
    if (!form) return;

    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    const updated = {};
    checkboxes.forEach(cb => {
      updated[cb.name] = cb.checked;
    });

    window.DB.saveInventoryRules(updated);
    window.State.showToast('Global inventory policy rules successfully saved and activated!');
    this.render();
  },

  // =========================================================================
  // TAB 10: LIVE STOCK LEDGER & VALUATION
  // =========================================================================
  renderStockLedgerTab() {
    const plantId = window.State.currentPlantId;
    const allBalances = window.DB.getAll('inventoryBalances') || [];
    const balances = allBalances.filter(b => {
      if (!window.DB.isPlantActive(b.plant_id)) return false;
      return plantId === 'ALL' || b.plant_id === plantId;
    });
    const items = window.DB.getAll('items') || [];
    const stores = window.DB.getActiveWarehouses(plantId === 'ALL' ? undefined : plantId);
    const bins = window.DB.getAll('bins') || [];
    const auditLogs = window.DB.getAll('auditLogs') || [];

    const totalValuation = balances.reduce((sum, b) => sum + ((b.on_hand || 0) * (b.valuation_rate || 0)), 0);
    const totalQty = balances.reduce((sum, b) => sum + (b.on_hand || 0), 0);
    const totalReserved = balances.reduce((sum, b) => sum + (b.reserved || 0), 0);
    const totalAvailable = balances.reduce((sum, b) => sum + (b.available || 0), 0);

    const filtered = balances.filter(b => {
      if (this.storeFilter !== 'ALL' && b.warehouse_id !== this.storeFilter) return false;
      if (this.searchTerm) {
        const it = items.find(i => i.id === b.item_id) || {};
        const q = this.searchTerm;
        if (!(it.code || '').toLowerCase().includes(q) && !(it.name || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });

    return `
      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
        <div class="content-card" style="margin: 0; padding: 14px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Total Stock Valuation</div>
          <div class="cell-mono" style="font-size: 22px; font-weight: 700; color: var(--color-success); margin-top: 4px;">
            ₹${totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div class="content-card" style="margin: 0; padding: 14px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Total Physical On-Hand</div>
          <div class="cell-mono" style="font-size: 22px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">
            ${totalQty.toLocaleString('en-IN')} units
          </div>
        </div>

        <div class="content-card" style="margin: 0; padding: 14px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Job Card Reserved Stock</div>
          <div class="cell-mono" style="font-size: 22px; font-weight: 700; color: var(--color-warning); margin-top: 4px;">
            ${totalReserved.toLocaleString('en-IN')} units
          </div>
        </div>

        <div class="content-card" style="margin: 0; padding: 14px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Available to Allocate</div>
          <div class="cell-mono" style="font-size: 22px; font-weight: 700; color: var(--primary-300); margin-top: 4px;">
            ${totalAvailable.toLocaleString('en-IN')} units
          </div>
        </div>
      </div>

      <!-- Ledger Table -->
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <input 
              type="text" 
              id="store-sub-search"
              class="form-control form-control-sm" 
              placeholder="Filter stock by SKU code or description..." 
              value="${this.searchTerm}" 
              oninput="window.StoreInventoryModule.setSearch(this.value)" 
              style="width: 280px;" 
            />
            <select class="form-control form-control-sm" onchange="window.StoreInventoryModule.setStoreFilter(this.value)" style="width: 220px;">
              <option value="ALL" ${this.storeFilter === 'ALL' ? 'selected' : ''}>All Stores</option>
              ${stores.map(s => `<option value="${s.id}" ${this.storeFilter === s.id ? 'selected' : ''}>🏬 ${s.name}</option>`).join('')}
            </select>
          </div>

          <div style="font-size: 11.5px; color: var(--text-muted);">
            Real-Time Valuation: FIFO / Standard Weighted Average (BRD §11 & §13)
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Store & Facility</th>
                <th>Storage Bin</th>
                <th>Item Code & Name</th>
                <th>Batch / Serial #</th>
                <th class="text-center">On-Hand Stock</th>
                <th class="text-center">Reserved</th>
                <th class="text-center">Available Stock</th>
                <th class="text-right">Valuation Rate</th>
                <th class="text-right">Total Line Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(b => {
                const st = stores.find(s => s.id === b.warehouse_id) || { name: b.warehouse_id };
                const it = items.find(i => i.id === b.item_id) || { code: b.item_id, name: b.item_id };
                const bn = bins.find(bin => bin.id === b.bin_id) || { code: b.bin_id || 'BIN-01' };
                const lineVal = (b.on_hand || 0) * (b.valuation_rate || 0);

                return `
                  <tr>
                    <td>
                      <div style="font-weight: 600; font-size: 12px;">${st.name}</div>
                      <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">${st.code || st.id}</div>
                    </td>
                    <td>
                      <div class="cell-mono cell-strong" style="color: var(--accent-300); font-size: 11px;">${bn.code || b.bin_id}</div>
                    </td>
                    <td>
                      <div class="cell-mono cell-strong" style="color: var(--primary-300);">${it.code}</div>
                      <div style="font-size: 12px; font-weight: 500;">${it.name}</div>
                    </td>
                    <td>
                      <div class="cell-mono" style="font-size: 11px;">${b.batch_number || 'LOT-GEN'}</div>
                      ${b.serial_number ? `<div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">SN: ${b.serial_number}</div>` : ''}
                    </td>
                    <td class="text-center cell-mono" style="font-weight: 700;">${b.on_hand}</td>
                    <td class="text-center cell-mono" style="color: var(--color-warning); font-weight: 600;">${b.reserved}</td>
                    <td class="text-center cell-mono" style="color: ${b.available > 0 ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: 700;">
                      ${b.available}
                    </td>
                    <td class="text-right cell-mono">₹${b.valuation_rate}</td>
                    <td class="text-right cell-mono" style="font-weight: 700; color: var(--color-success);">
                      ₹${lineVal.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span class="badge ${b.stock_status === 'AVAILABLE' ? 'badge-success' : 'badge-warning'}" style="font-size: 9.5px;">
                        ${b.stock_status}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // STORE MASTER MODALS & CONFIGURATION SUITE (BRD VERSION 1.0 COMPLIANT)
  // Section 7.1: Create Store | Section 7.2: Screen Mapping | Section 7.3: Item Mapping
  // Section 7.4: Reorder Levels | Section 9.2: Configuration Tabs | Section 17: Audit
  // =========================================================================

  setStoreTypeFilter(val) {
    this.storeTypeFilter = val;
    this.render();
  },

  // Modal: Create New Store (BRD §7.1 & STR-BR-01 to 07)
  showAddStoreModal() {
    const branches = (window.DB && typeof window.DB.getActivePlants === 'function') 
      ? window.DB.getActivePlants() 
      : ((window.DB && window.DB.getAll('plants')) || []).filter(p => p.is_active !== false && p.status !== 'Inactive');
    const allStores = window.DB.getAll('warehouses') || [];
    const mainStores = allStores.filter(s => !s.parent_store_id || s.warehouse_type === 'MAIN_STORE');
    const today = (window.DB && typeof window.DB.getTodayDateStr === 'function') ? window.DB.getTodayDateStr() : new Date().toLocaleDateString('en-CA');

    const contentHtml = `
      <form id="add-store-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitAddStore();" style="margin: 0; padding: 0;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 14px; margin-top: 4px;">
          
          <!-- Row 1 -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Store Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-store-code" class="form-control cell-mono" placeholder="e.g. STR-MAIN-01" style="height: 35px; font-size: 12px; text-transform: uppercase; max-width: 220px;" required />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Store Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-store-name" class="form-control" placeholder="Central Spare Parts Store" style="height: 35px; font-size: 12px;" required />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Store Address</label>
            <input type="text" id="new-store-address" class="form-control" placeholder="Complete address..." style="height: 35px; font-size: 12px;" />
          </div>

          <!-- Row 2 -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Store Type <span style="color: var(--color-danger)">*</span></label>
            <select id="new-store-type" class="form-control" onchange="window.StoreInventoryModule.onStoreTypeChange(this.value)" style="height: 35px; font-size: 12px; max-width: 220px;" required>
              <option value="MAIN_STORE">Main Store</option>
              <option value="SUB_STORE">Sub Store</option>
            </select>
          </div>

          <div class="form-group" id="parent-store-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Parent Store <span id="parent-store-req" style="color: var(--color-danger); display: none;">*</span></label>
            <select id="new-store-parent" class="form-control" disabled style="height: 35px; font-size: 12px; max-width: 220px;">
              <option value="">None (Root Main Store)</option>
              ${mainStores.map(s => `<option value="${s.id}">${s.name} (${s.code || s.id})</option>`).join('')}
            </select>
          </div>

          <!-- GST Number -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">GST Number</label>
            <input type="text" id="new-store-gstin" class="form-control cell-mono" placeholder="27AABCT2345M1Z9" maxlength="15" style="height: 35px; font-size: 12px; text-transform: uppercase; max-width: 220px;" />
          </div>

          <!-- Row 3 -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Store Manager / Custodian</label>
            <input type="text" id="new-store-manager" class="form-control" placeholder="Manager name" style="height: 35px; font-size: 12px;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Contact Number</label>
            <input type="tel" id="new-store-contact" class="form-control cell-mono" placeholder="e.g. 9822000000" maxlength="10" style="height: 35px; font-size: 12px; max-width: 220px;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Email Address</label>
            <input type="email" id="new-store-email" class="form-control" placeholder="store@example.com" style="height: 35px; font-size: 12px;" />
          </div>

          <!-- Row 4 -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Effective From <span style="color: var(--color-danger)">*</span></label>
            <input type="date" id="new-store-from" class="form-control" value="${today}" style="height: 35px; font-size: 12px; max-width: 200px;" required />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Effective To (Optional)</label>
            <input type="date" id="new-store-to" class="form-control" style="height: 35px; font-size: 12px; max-width: 200px;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Status</label>
            <div style="display: flex; align-items: center; height: 35px;">
              <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; height: 35px; padding: 0 14px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-surface-elevated, rgba(255,255,255,0.03)); font-size: 12px; font-weight: 600; user-select: none;">
                <input 
                  type="checkbox" 
                  id="new-store-status-cb" 
                  checked 
                  onchange="const val = this.checked ? 'Active' : 'Inactive'; document.getElementById('new-store-status-text').innerText = val; document.getElementById('new-store-status').value = val;"
                  style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--primary-500); margin: 0;" 
                />
                <span id="new-store-status-text" style="color: var(--text-primary);">Active</span>
              </label>
              <input type="hidden" id="new-store-status" value="Active" />
            </div>
          </div>

          <!-- Row 5: Facility (Compressed to Column 1) -->
          <div class="form-group" style="margin-bottom: 0; position: relative;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">
              Facility <span style="color: var(--color-danger)">*</span>
            </label>
            <div style="position: relative;">
              <button 
                type="button" 
                id="new-facility-dropdown-btn" 
                class="form-control" 
                style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; text-align: left; height: 35px; font-size: 12px; padding: 0 10px;" 
                onclick="event.stopPropagation(); window.StoreInventoryModule.toggleFacilityDropdown('new');"
              >
                <span id="new-facility-dropdown-label" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px;">
                  All ${branches.length} Facilities Selected
                </span>
                <span style="font-size: 9px; color: var(--text-muted); margin-left: 4px;">▼</span>
              </button>

              <div 
                id="new-facility-dropdown-panel" 
                class="facility-dropdown-panel" 
                style="display: none; position: absolute; bottom: calc(100% + 4px); left: 0; right: 0; z-index: 1050; background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); box-shadow: 0 -10px 25px rgba(0,0,0,0.4); max-height: 200px; overflow-y: auto; padding: 6px;"
                onclick="event.stopPropagation();"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 6px 8px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px;">
                  <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Select Facilities</span>
                  <div style="display: flex; gap: 8px;">
                    <a href="javascript:void(0)" onclick="window.StoreInventoryModule.bulkSelectFacilities('new', true)" style="font-size: 11px; color: var(--primary-400); text-decoration: underline;">Select All</a>
                    <a href="javascript:void(0)" onclick="window.StoreInventoryModule.bulkSelectFacilities('new', false)" style="font-size: 11px; color: var(--text-muted); text-decoration: underline;">Clear</a>
                  </div>
                </div>
                ${branches.length === 0 ? `
                  <div style="color: var(--text-muted); font-size: 12px; padding: 8px;">No active facilities registered. Please add a facility in Facility Master first.</div>
                ` : branches.map(b => `
                  <label style="display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 11.5px; transition: background 0.15s;" onmouseover="this.style.background='rgba(99,102,241,0.08)'" onmouseout="this.style.background='transparent'">
                    <input type="checkbox" name="new-store-facility" value="${b.id}" onchange="window.StoreInventoryModule.updateFacilityDropdownLabel('new')" checked style="accent-color: var(--primary-500);" />
                    <span><strong>${b.name}</strong> ${b.city ? `<span style="color: var(--text-muted); font-size: 10px;">(${b.city})</span>` : ''}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>

        </div>

        <!-- Bottom Action Row: Right-aligned at bottom right as indicated by arrow -->
        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary" style="height: 35px; font-weight: 700; padding: 0 24px; font-size: 12.5px;">
            Create Store
          </button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: 'Create New Store',
      maxWidth: '98vw',
      isFullScreen: true,
      noScroll: true,
      bodyPadding: '14px 20px',
      contentHtml,
      footerHtml: null
    });
  },

  onStoreTypeChange(typeCode) {
    const parentSelect = document.getElementById('new-store-parent');
    const parentReq = document.getElementById('parent-store-req');
    const parentHint = document.getElementById('parent-store-hint');
    if (!parentSelect) return;

    if (typeCode === 'MAIN_STORE') {
      parentSelect.value = '';
      parentSelect.disabled = true;
      parentSelect.required = false;
      if (parentReq) parentReq.style.display = 'none';
      if (parentHint) parentHint.innerText = 'Main Stores do not have a parent store (STR-BR-04)';
    } else {
      parentSelect.disabled = false;
      parentSelect.required = true;
      if (parentReq) parentReq.style.display = 'inline';
      if (parentHint) parentHint.innerText = 'Select eligible Main Store mapped to the same facility (STR-BR-03)';
      this.refreshParentStoreOptions();
    }
  },

  refreshParentStoreOptions() {
    const parentSelect = document.getElementById('new-store-parent');
    if (!parentSelect) return;

    const checkedFacs = Array.from(document.querySelectorAll('input[name="new-store-facility"]:checked')).map(el => el.value);
    const allStores = window.DB.getAll('warehouses') || [];
    
    // Eligible main stores sharing at least one common mapped facility
    const eligibleMainStores = allStores.filter(s => {
      if (s.parent_store_id || s.warehouse_type === 'SUB_STORE') return false;
      const sFacs = Array.isArray(s.facility_ids) && s.facility_ids.length > 0 ? s.facility_ids : (s.plant_id ? [s.plant_id] : []);
      return checkedFacs.length === 0 || checkedFacs.some(f => sFacs.includes(f));
    });

    const currentVal = parentSelect.value;
    parentSelect.innerHTML = `
      <option value="">-- Select Eligible Parent Main Store --</option>
      ${eligibleMainStores.map(s => `<option value="${s.id}" ${s.id === currentVal ? 'selected' : ''}>${s.name} (${s.code || s.id})</option>`).join('')}
    `;
  },

  submitAddStore() {
    const code = document.getElementById('new-store-code').value.trim().toUpperCase();
    const name = document.getElementById('new-store-name').value.trim();
    const type = document.getElementById('new-store-type').value;
    const parent = document.getElementById('new-store-parent') ? document.getElementById('new-store-parent').value : '';
    const gstin = document.getElementById('new-store-gstin') ? document.getElementById('new-store-gstin').value.trim().toUpperCase() : '';
    const address = document.getElementById('new-store-address') ? document.getElementById('new-store-address').value.trim() : '';
    const manager = document.getElementById('new-store-manager').value.trim();
    const contact = document.getElementById('new-store-contact').value.trim();
    const email = document.getElementById('new-store-email').value.trim();
    const fromDate = document.getElementById('new-store-from').value;
    const toDate = document.getElementById('new-store-to').value;
    const status = document.getElementById('new-store-status') ? document.getElementById('new-store-status').value : 'Active';

    const facilityCheckboxes = Array.from(document.querySelectorAll('input[name="new-store-facility"]:checked'));
    const selectedFacilities = facilityCheckboxes.map(cb => cb.value);

    // Rule STR-BR-01: Store Code unique within organization
    const allStores = window.DB.getAll('warehouses') || [];
    if (allStores.some(s => (s.code || '').toUpperCase() === code)) {
      window.State.showToast(`Store code "${code}" already exists. Store Code must be unique (STR-BR-01).`, 'error');
      return;
    }

    // Rule STR-BR-07: At least one facility must be mapped to store
    if (selectedFacilities.length === 0) {
      window.State.showToast('At least one facility must be mapped to the store (STR-BR-07).', 'error');
      return;
    }

    // Rule STR-BR-02 & 03: If Sub Store, Parent Store mandatory
    if (type === 'SUB_STORE' && !parent) {
      window.State.showToast('Sub Store must be mapped to an active Parent Main Store (STR-BR-02).', 'error');
      return;
    }

    // Rule STR-BR-06: Effective To must not be earlier than Effective From
    if (toDate && fromDate && toDate < fromDate) {
      window.State.showToast('Effective To date must not be earlier than Effective From date (STR-BR-06).', 'error');
      return;
    }

    // Optional GST format check (15 chars)
    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      if (!confirm(`GSTIN format for "${gstin}" does not strictly match standard 15-character GST pattern. Proceed anyway?`)) {
        return;
      }
    }

    const newStore = {
      id: `WH-${code.replace(/[^A-Z0-9]/g, '-')}`,
      code: code,
      name: name,
      warehouse_type: type,
      store_type: type === 'MAIN_STORE' ? 'Main Store' : 'Sub Store',
      parent_store_id: type === 'MAIN_STORE' ? null : parent,
      facility_ids: selectedFacilities,
      plant_id: selectedFacilities[0] || 'PLANT-01',
      gstin: gstin || '',
      address: address || '',
      manager: manager,
      contact_number: contact,
      email: email,
      status: status,
      effective_from: fromDate,
      effective_to: toDate || null,
      capacity_cbm: 1000,
      occupied_cbm: 0,
      created_at: new Date().toISOString(),
      created_by: (window.State && window.State.currentUser && window.State.currentUser.display_name) || 'Administrator'
    };

    allStores.push(newStore);
    window.DB.saveData();
    window.DB.emitChange('warehouses');
    if (window.DB && typeof window.DB.syncWarehouseToBackend === 'function') {
      window.DB.syncWarehouseToBackend(newStore, 'POST');
    }

    // Initialize Default Screen Mapping for new store (BRD §7.2)
    window.DB.saveStoreScreenMapping(newStore.id, window.DB.getStoreScreenMapping(newStore.id));

    // Audit Log (BRD §17)
    window.DB.logStoreAudit(newStore.id, 'STORE_CREATE', `Created store ${newStore.name} (${newStore.code}) mapped to ${selectedFacilities.length} facility(ies)`);

    window.State.closeModal();
    window.State.showToast(`Store "${name}" created successfully! Opening configuration...`);
    this.render();

    // Automatically open configuration modal to complete mapping (BRD §8)
    setTimeout(() => {
      this.showStoreConfigurationModal(newStore.id, 'SCREENS');
    }, 200);
  },

  // Modal: Store Configuration Screen (BRD §9.2 Tabs: Details, Screen Mapping, Item Mapping, Reorder, Audit)
  showStoreConfigurationModal(storeId, initialTab = 'DETAILS') {
    const store = window.DB.getById('warehouses', storeId);
    if (!store) {
      window.State.showToast('Store record not found.', 'error');
      return;
    }

    this.currentConfigStoreId = storeId;
    this.activeConfigTab = initialTab;
    if (!this.itemMappingSubView) this.itemMappingSubView = 'SUBCATS';

    const isMain = !store.parent_store_id || store.warehouse_type === 'MAIN_STORE';
    const allPlants = window.DB.getAll('plants') || [];
    const fIds = Array.isArray(store.facility_ids) && store.facility_ids.length > 0 ? store.facility_ids : (store.plant_id ? [store.plant_id] : []);
    const mappedPlants = allPlants.filter(p => fIds.includes(p.id));

    const contentHtml = `
      <div id="store-config-container" style="display: flex; flex-direction: column; height: 100%; gap: 10px;">
        
        <!-- 5 Tabs Header (BRD §9.2) -->
        <div class="tabs-header" style="margin: 0; padding-bottom: 0; border-bottom: 1px solid var(--border-color); flex-shrink: 0; overflow-x: auto;">
          <button class="tab-btn ${this.activeConfigTab === 'DETAILS' ? 'active' : ''}" onclick="window.StoreInventoryModule.switchConfigTab('DETAILS')">
            <span>Store Details</span>
          </button>
          <button class="tab-btn ${this.activeConfigTab === 'SCREENS' ? 'active' : ''}" onclick="window.StoreInventoryModule.switchConfigTab('SCREENS')">
            <span>Transactions</span>
          </button>
          <button class="tab-btn ${this.activeConfigTab === 'ITEMS' ? 'active' : ''}" onclick="window.StoreInventoryModule.switchConfigTab('ITEMS')">
            <span>Item Mapping</span>
          </button>
          <button class="tab-btn ${this.activeConfigTab === 'REORDER' ? 'active' : ''}" onclick="window.StoreInventoryModule.switchConfigTab('REORDER')">
            <span>Reorder Levels</span>
          </button>
          <button class="tab-btn ${this.activeConfigTab === 'AUDIT' ? 'active' : ''}" onclick="window.StoreInventoryModule.switchConfigTab('AUDIT')">
            <span>Audit History</span>
          </button>
        </div>

        <!-- Tab Body Content (No scrollbar needed for Details tab) -->
        <div id="store-config-tab-body" style="flex: 1; padding: 4px 2px; overflow-y: auto;">
          ${this.renderActiveConfigTabContent(store)}
        </div>

      </div>
    `;

    window.State.showModal({
      title: `Store Master Configuration: ${store.name}`,
      maxWidth: '98vw',
      isFullScreen: true,
      noScroll: true,
      bodyPadding: '14px 20px',
      contentHtml,
      footerHtml: null
    });
  },

  switchConfigTab(tabKey) {
    this.activeConfigTab = tabKey;
    const body = document.getElementById('store-config-tab-body');
    const store = window.DB.getById('warehouses', this.currentConfigStoreId);
    if (!body || !store) return;

    // Update active tab styles
    const tabBtns = document.querySelectorAll('#store-config-container .tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(tabBtns).find(b => b.innerText.toLowerCase().includes(tabKey.toLowerCase()) || 
      (tabKey === 'DETAILS' && b.innerText.includes('Details')) ||
      (tabKey === 'SCREENS' && (b.innerText.includes('Screen') || b.innerText.includes('Transactions'))) ||
      (tabKey === 'ITEMS' && b.innerText.includes('Item')) ||
      (tabKey === 'REORDER' && b.innerText.includes('Reorder')) ||
      (tabKey === 'AUDIT' && b.innerText.includes('Audit'))
    );
    if (activeBtn) activeBtn.classList.add('active');

    body.innerHTML = this.renderActiveConfigTabContent(store);
  },

  renderActiveConfigTabContent(store) {
    if (this.activeConfigTab === 'DETAILS') return this.renderStoreConfigDetails(store);
    if (this.activeConfigTab === 'SCREENS') return this.renderStoreConfigScreens(store);
    if (this.activeConfigTab === 'ITEMS') return this.renderStoreConfigItems(store);
    if (this.activeConfigTab === 'REORDER') return this.renderStoreConfigReorder(store);
    if (this.activeConfigTab === 'AUDIT') return this.renderStoreConfigAudit(store);
    return this.renderStoreConfigDetails(store);
  },

  // Configuration Tab 1: Store Details (BRD §7.1)
  renderStoreConfigDetails(store) {
    const branches = (window.DB && typeof window.DB.getActivePlants === 'function') 
      ? window.DB.getActivePlants() 
      : ((window.DB && window.DB.getAll('plants')) || []).filter(p => p.is_active !== false && p.status !== 'Inactive');
    const allStores = window.DB.getAll('warehouses') || [];
    const isMain = !store.parent_store_id || store.warehouse_type === 'MAIN_STORE';
    const mainStores = allStores.filter(s => s.id !== store.id && (!s.parent_store_id || s.warehouse_type === 'MAIN_STORE'));
    const fIds = Array.isArray(store.facility_ids) && store.facility_ids.length > 0 ? store.facility_ids : (store.plant_id ? [store.plant_id] : []);

    const selectedBranchNames = branches.filter(b => fIds.includes(b.id)).map(b => b.name);
    let initialFacilityLabel = 'Select Facilities (Required)...';
    if (selectedBranchNames.length === 1) {
      initialFacilityLabel = selectedBranchNames[0];
    } else if (selectedBranchNames.length === branches.length && branches.length > 0) {
      initialFacilityLabel = `All ${branches.length} Facilities Selected`;
    } else if (selectedBranchNames.length > 1) {
      initialFacilityLabel = `${selectedBranchNames[0]} (+${selectedBranchNames.length - 1} more)`;
    }

    return `
      <form id="edit-store-details-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.saveStoreDetailsConfig('${store.id}');" style="margin: 0; padding: 0;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 14px; margin-top: 4px;">
          
          <!-- Row 1: Store Code, Store Name, Store Address -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Store Code</label>
            <input type="text" class="form-control cell-mono" value="${store.code || store.id}" disabled style="height: 35px; font-size: 12px; max-width: 220px;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Store Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="cfg-store-name" class="form-control" value="${store.name}" style="height: 35px; font-size: 12px;" required />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Store Address</label>
            <input type="text" id="cfg-store-address" class="form-control" value="${store.address || ''}" placeholder="Complete address..." style="height: 35px; font-size: 12px;" />
          </div>

          <!-- Row 2 -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Store Type</label>
            <input type="text" class="form-control" value="${isMain ? 'Main Store' : 'Sub Store'}" disabled style="height: 35px; font-size: 12px; max-width: 220px;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Parent Store</label>
            ${isMain ? `
              <input type="text" class="form-control" value="None (Root Main Store)" disabled style="height: 35px; font-size: 12px; max-width: 220px;" />
            ` : `
              <select id="cfg-store-parent" class="form-control" required style="height: 35px; font-size: 12px; max-width: 220px;">
                ${mainStores.map(ms => `<option value="${ms.id}" ${ms.id === store.parent_store_id ? 'selected' : ''}>${ms.name} (${ms.code || ms.id})</option>`).join('')}
              </select>
            `}
          </div>

          <!-- GST Number -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">GST Number</label>
            <input type="text" id="cfg-store-gstin" class="form-control cell-mono" value="${store.gstin || ''}" placeholder="27AABCT2345M1Z9" maxlength="15" style="height: 35px; font-size: 12px; text-transform: uppercase; max-width: 220px;" />
          </div>

          <!-- Row 3 -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Store Manager / Custodian</label>
            <input type="text" id="cfg-store-manager" class="form-control" value="${store.manager || ''}" placeholder="Manager name" style="height: 35px; font-size: 12px;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Contact Number</label>
            <input type="tel" id="cfg-store-contact" class="form-control cell-mono" value="${store.contact_number || ''}" maxlength="10" placeholder="e.g. 9822000000" style="height: 35px; font-size: 12px; max-width: 220px;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Email Address</label>
            <input type="email" id="cfg-store-email" class="form-control" value="${store.email || ''}" placeholder="store@example.com" style="height: 35px; font-size: 12px;" />
          </div>

          <!-- Row 4 -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Effective From <span style="color: var(--color-danger)">*</span></label>
            <input type="date" id="cfg-store-from" class="form-control" value="${store.effective_from || '2026-01-01'}" style="height: 35px; font-size: 12px; max-width: 200px;" required />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Effective To (Optional)</label>
            <input type="date" id="cfg-store-to" class="form-control" value="${store.effective_to || ''}" style="height: 35px; font-size: 12px; max-width: 200px;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">Status</label>
            <div style="display: flex; align-items: center; height: 35px;">
              <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; height: 35px; padding: 0 14px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-surface-elevated, rgba(255,255,255,0.03)); font-size: 12px; font-weight: 600; user-select: none;">
                <input 
                  type="checkbox" 
                  id="cfg-store-status-cb" 
                  ${store.status === 'Active' || !store.status ? 'checked' : ''} 
                  onchange="const val = this.checked ? 'Active' : 'Inactive'; document.getElementById('cfg-store-status-text').innerText = val; document.getElementById('cfg-store-status').value = val;"
                  style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--primary-500); margin: 0;" 
                />
                <span id="cfg-store-status-text" style="color: var(--text-primary);">${store.status === 'Inactive' ? 'Inactive' : 'Active'}</span>
              </label>
              <input type="hidden" id="cfg-store-status" value="${store.status === 'Inactive' ? 'Inactive' : 'Active'}" />
            </div>
          </div>

          <!-- Row 5: Facility (Compressed to Column 1) -->
          <div class="form-group" style="margin-bottom: 0; position: relative;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 3px;">
              Facility <span style="color: var(--color-danger)">*</span>
            </label>
            <div style="position: relative;">
              <button 
                type="button" 
                id="cfg-facility-dropdown-btn" 
                class="form-control" 
                style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; text-align: left; height: 35px; font-size: 12px; padding: 0 10px;" 
                onclick="event.stopPropagation(); window.StoreInventoryModule.toggleFacilityDropdown('cfg');"
              >
                <span id="cfg-facility-dropdown-label" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px;">
                  ${initialFacilityLabel}
                </span>
                <span style="font-size: 9px; color: var(--text-muted); margin-left: 4px;">▼</span>
              </button>

              <div 
                id="cfg-facility-dropdown-panel" 
                class="facility-dropdown-panel" 
                style="display: none; position: absolute; bottom: calc(100% + 4px); left: 0; right: 0; z-index: 1050; background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); box-shadow: 0 -10px 25px rgba(0,0,0,0.4); max-height: 200px; overflow-y: auto; padding: 6px;"
                onclick="event.stopPropagation();"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 6px 8px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px;">
                  <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Select Facilities</span>
                  <div style="display: flex; gap: 8px;">
                    <a href="javascript:void(0)" onclick="window.StoreInventoryModule.bulkSelectFacilities('cfg', true)" style="font-size: 11px; color: var(--primary-400); text-decoration: underline;">Select All</a>
                    <a href="javascript:void(0)" onclick="window.StoreInventoryModule.bulkSelectFacilities('cfg', false)" style="font-size: 11px; color: var(--text-muted); text-decoration: underline;">Clear</a>
                  </div>
                </div>
                ${branches.length === 0 ? `
                  <div style="color: var(--text-muted); font-size: 12px; padding: 8px;">No facilities available.</div>
                ` : branches.map(b => {
                  const checked = fIds.includes(b.id);
                  return `
                    <label style="display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 11.5px; transition: background 0.15s;" onmouseover="this.style.background='rgba(99,102,241,0.08)'" onmouseout="this.style.background='transparent'">
                      <input type="checkbox" name="cfg-store-facility" value="${b.id}" ${checked ? 'checked' : ''} onchange="window.StoreInventoryModule.updateFacilityDropdownLabel('cfg')" style="accent-color: var(--primary-500);" />
                      <span><strong>${b.name}</strong> ${b.city ? `<span style="color: var(--text-muted); font-size: 10px;">(${b.city})</span>` : ''}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

        </div>

        <!-- Bottom Action Row: Right-aligned at bottom right -->
        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <button type="submit" class="btn btn-primary" style="height: 35px; font-weight: 700; padding: 0 24px; font-size: 12.5px;">
            Save Store Details
          </button>
        </div>
      </form>
    `;
  },

  toggleFacilityDropdown(prefix) {
    const panel = document.getElementById(`${prefix}-facility-dropdown-panel`);
    if (!panel) return;
    const isShown = panel.style.display !== 'none';
    panel.style.display = isShown ? 'none' : 'block';
  },

  updateFacilityDropdownLabel(prefix) {
    const labelSpan = document.getElementById(`${prefix}-facility-dropdown-label`);
    if (!labelSpan) return;

    const checkboxes = Array.from(document.querySelectorAll(`input[name="${prefix}-store-facility"]:checked`));
    const branches = (window.DB && typeof window.DB.getActivePlants === 'function') 
      ? window.DB.getActivePlants() 
      : ((window.DB && window.DB.getAll('plants')) || []).filter(p => p.is_active !== false && p.status !== 'Inactive');

    if (checkboxes.length === 0) {
      labelSpan.innerHTML = '<span style="color: var(--color-danger); font-style: italic;">Select Facilities (Required) *</span>';
    } else if (checkboxes.length === 1) {
      const b = branches.find(br => br.id === checkboxes[0].value);
      labelSpan.innerText = b ? b.name : '1 Facility Selected';
    } else if (checkboxes.length === branches.length && branches.length > 0) {
      labelSpan.innerText = `All ${branches.length} Facilities Selected`;
    } else {
      const firstB = branches.find(br => br.id === checkboxes[0].value);
      const firstName = firstB ? firstB.name : 'Facility';
      labelSpan.innerText = `${firstName} (+${checkboxes.length - 1} more)`;
    }

    if (prefix === 'new') {
      this.refreshParentStoreOptions();
    }
  },

  bulkSelectFacilities(prefix, selectAll) {
    const checkboxes = document.querySelectorAll(`input[name="${prefix}-store-facility"]`);
    checkboxes.forEach(cb => { cb.checked = !!selectAll; });
    this.updateFacilityDropdownLabel(prefix);
  },

  saveStoreDetailsConfig(storeId) {
    const store = window.DB.getById('warehouses', storeId);
    if (!store) return;

    const name = document.getElementById('cfg-store-name').value.trim();
    const gstin = document.getElementById('cfg-store-gstin') ? document.getElementById('cfg-store-gstin').value.trim().toUpperCase() : '';
    const manager = document.getElementById('cfg-store-manager').value.trim();
    const contact = document.getElementById('cfg-store-contact').value.trim();
    const email = document.getElementById('cfg-store-email').value.trim();
    const address = document.getElementById('cfg-store-address') ? document.getElementById('cfg-store-address').value.trim() : '';
    const fromDate = document.getElementById('cfg-store-from').value;
    const toDate = document.getElementById('cfg-store-to').value;
    const status = document.getElementById('cfg-store-status').value;

    const checkedFacs = Array.from(document.querySelectorAll('input[name="cfg-store-facility"]:checked')).map(el => el.value);
    if (checkedFacs.length === 0) {
      window.State.showToast('At least one facility must be mapped to the store (STR-BR-07).', 'error');
      return;
    }

    if (toDate && fromDate && toDate < fromDate) {
      window.State.showToast('Effective To date must not be earlier than Effective From date (STR-BR-06).', 'error');
      return;
    }

    // Validation on deactivation: cannot deactivate store if it has active stock
    if (status === 'Inactive' && (store.status === 'Active' || !store.status)) {
      if (this.hasStoreStock(storeId)) {
        window.State.showToast(`Cannot deactivate store "${store.name}". Store contains active inventory stock.`, 'error');
        alert(`Cannot deactivate store "${store.name}".\n\nThis store currently contains active inventory stock balances.\nPlease transfer or clear stock before deactivating this store.`);
        return;
      }

      // STR-BR-30 Validation on deactivation
      const allStores = window.DB.getAll('warehouses') || [];
      const dependentSubs = allStores.filter(s => s.parent_store_id === storeId && (s.status === 'Active' || !s.status));
      if (dependentSubs.length > 0) {
        window.State.showToast(`Cannot deactivate Main Store. ${dependentSubs.length} active Sub Store(s) depend on it (STR-BR-30).`, 'error');
        return;
      }
    }

    const parentEl = document.getElementById('cfg-store-parent');
    if (parentEl) {
      store.parent_store_id = parentEl.value || null;
    }

    store.name = name;
    store.facility_ids = checkedFacs;
    store.plant_id = checkedFacs[0] || 'PLANT-01';
    store.gstin = gstin;
    store.manager = manager;
    store.contact_number = contact;
    store.email = email;
    store.address = address;
    store.effective_from = fromDate;
    store.effective_to = toDate || null;
    store.status = status;
    store.updated_at = new Date().toISOString();

    window.DB.saveData();
    window.DB.emitChange('warehouses');
    if (window.DB && typeof window.DB.syncWarehouseToBackend === 'function') {
      window.DB.syncWarehouseToBackend(store, 'PUT');
    }
    window.DB.logStoreAudit(storeId, 'STORE_UPDATE', `Updated store details, facility mapping (${checkedFacs.length} facilities), and status to ${status}`);

    window.State.showToast(`Store details for "${name}" updated successfully!`);
    this.render();
    this.switchConfigTab('DETAILS');
  },

  // Configuration Tab 2: Transactions (BRD §7.2: 12 Screens)
  renderStoreConfigScreens(store) {
    const screenMap = window.DB.getStoreScreenMapping(store.id);

    const SCREENS_CONFIG = [
      { code: 'REQUISITIONS', name: 'Requisitions', icon: '📝', domain: 'Procurement', desc: 'Raise replenishment demand for stock replenishment' },
      { code: 'PURCHASE_ORDERS', name: 'Purchase Orders (PO)', icon: '🛒', domain: 'Procurement', desc: 'Issue direct vendor purchase orders' },
      { code: 'GRN', name: 'Goods Receipt Notes (GRN)', icon: '📥', domain: 'Procurement', desc: 'Inward physical spare parts shipments from suppliers' },
      { code: 'OPENING_BALANCE', name: 'Opening Balance', icon: '⚖️', domain: 'Procurement', desc: 'Initial baseline stock upload and opening reconciliation' },
      { code: 'STOCK_TRANSFER', name: 'Stock Transfer', icon: '🔄', domain: 'Transfers & Governance', desc: 'Store-to-Store and Inter-Branch stock transfers' },
      { code: 'STOCK_ADJUSTMENT', name: 'Stock Adjustment', icon: '⚖️', domain: 'Transfers & Governance', desc: 'Physical write-offs, scrap adjustments & variance posting' },
      { code: 'BATCH_EXPIRY_CHANGE', name: 'Item Batch and Expiry Change', icon: '🏷️', domain: 'Transfers & Governance', desc: 'Modify batch numbers, serials, and expiration dates' },
      { code: 'PHYSICAL_STOCK_VERIFICATION', name: 'Physical Stock Verification', icon: '🔍', domain: 'Transfers & Governance', desc: 'Cycle count snapshot freeze, barcode scan & variance approval' },
      { code: 'WORK_ORDERS', name: 'Work Orders', icon: '📋', domain: 'Workshop Operations', desc: 'Job Card parts requisition & reservation allocation' },
      { code: 'STOCK_ISSUE', name: 'Stock Issue', icon: '📤', domain: 'Workshop Operations', desc: 'Issue parts to technicians referenced to service jobs' },
      { code: 'STOCK_RETURN', name: 'Stock Return', icon: '↩️', domain: 'Workshop Operations', desc: 'Return of unused departmental parts back to store inventory' },
      { code: 'STOCK_CONSUMPTION', name: 'Stock Consumption', icon: '⛽', domain: 'Workshop Operations', desc: 'Direct floor expensing of lubricants, fluids & consumables' }
    ];

    return `
      <div style="margin-top: 4px;">
        <!-- Presets & Actions Toolbar -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button type="button" class="btn btn-outline btn-sm" onclick="window.StoreInventoryModule.applyScreenPreset('MAIN', '${store.id}')">Apply Main Store Preset</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.StoreInventoryModule.applyScreenPreset('SUB', '${store.id}')">Apply Workshop Sub-Store Preset</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.StoreInventoryModule.toggleAllScreens(true, '${store.id}')">Select All</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.StoreInventoryModule.toggleAllScreens(false, '${store.id}')">Deselect All</button>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.StoreInventoryModule.saveStoreScreensConfig('${store.id}')">
            Save Transactions
          </button>
        </div>

        <!-- Transactions List (All screens in one column on one side) -->
        <form id="store-screens-form" style="max-width: 480px;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${SCREENS_CONFIG.map(s => {
              const isChecked = !!screenMap[s.code];
              return `
                <label for="scr-${s.code}" style="display: flex; align-items: center; gap: 10px; padding: 9px 14px; border: 1px solid var(--border-color); background: var(--bg-surface, #ffffff); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12.5px; color: var(--text-primary); margin: 0; transition: background 0.15s, border-color 0.15s;" onmouseover="this.style.background='rgba(99,102,241,0.06)'" onmouseout="this.style.background='var(--bg-surface, #ffffff)'">
                  <input 
                    type="checkbox" 
                    id="scr-${s.code}" 
                    name="store_screen" 
                    value="${s.code}" 
                    ${isChecked ? 'checked' : ''} 
                    onchange="window.StoreInventoryModule.autoSaveStoreScreensConfig('${store.id}')"
                    style="cursor: pointer; transform: scale(1.15); accent-color: var(--primary-500); margin: 0;" 
                  />
                  <span>${s.name}</span>
                </label>
              `;
            }).join('')}
          </div>
        </form>
      </div>
    `;
  },

  applyScreenPreset(type, storeId) {
    const checkboxes = document.querySelectorAll('input[name="store_screen"]');
    checkboxes.forEach(cb => {
      const code = cb.value;
      if (type === 'MAIN') {
        cb.checked = ['REQUISITIONS', 'PURCHASE_ORDERS', 'GRN', 'OPENING_BALANCE', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT', 'BATCH_EXPIRY_CHANGE', 'PHYSICAL_STOCK_VERIFICATION'].includes(code);
      } else if (type === 'SUB') {
        cb.checked = ['WORK_ORDERS', 'STOCK_ISSUE', 'STOCK_RETURN', 'STOCK_CONSUMPTION', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT', 'PHYSICAL_STOCK_VERIFICATION'].includes(code);
      }
    });
    const sId = storeId || this.currentConfigStoreId;
    if (sId) this.autoSaveStoreScreensConfig(sId, false);
  },

  toggleAllScreens(status, storeId) {
    const checkboxes = document.querySelectorAll('input[name="store_screen"]');
    checkboxes.forEach(cb => { cb.checked = !!status; });
    const sId = storeId || this.currentConfigStoreId;
    if (sId) this.autoSaveStoreScreensConfig(sId, false);
  },

  autoSaveStoreScreensConfig(storeId, showToast = false) {
    const sId = storeId || this.currentConfigStoreId;
    if (!sId) return;
    const checkboxes = document.querySelectorAll('input[name="store_screen"]');
    const newMap = {};
    checkboxes.forEach(cb => {
      newMap[cb.value] = cb.checked;
    });

    window.DB.saveStoreScreenMapping(sId, newMap);
    if (showToast) {
      window.State.showToast('Transactions configuration saved.');
    }
  },

  saveStoreScreensConfig(storeId) {
    this.autoSaveStoreScreensConfig(storeId, true);
  },

  // Configuration Tab 3: Store–Item Category, Sub-Category & Item Mapping (BRD §7.3 & §7.3.1)
  renderStoreConfigItems(store) {
    const subView = (this.itemMappingSubView === 'ITEMS') ? 'ITEMS' : 'SUBCATS';

    return `
      <div style="margin-top: 2px;">
        <!-- Sub-Nav Buttons -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; gap: 8px;">
            <button class="btn ${subView === 'SUBCATS' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="window.StoreInventoryModule.switchItemMappingSubView('SUBCATS')">
              Category & Sub-Category Mapping
            </button>
            <button class="btn ${subView === 'ITEMS' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="window.StoreInventoryModule.switchItemMappingSubView('ITEMS')">
              Individual Item Mapping
            </button>
          </div>
        </div>

        ${subView === 'SUBCATS' ? this.renderCategorySubcatMappingSection(store) : ''}
        ${subView === 'ITEMS' ? this.renderIndividualItemMappingSection(store) : ''}
      </div>
    `;
  },

  switchItemMappingSubView(view) {
    this.itemMappingSubView = view;
    const store = window.DB.getById('warehouses', this.currentConfigStoreId);
    if (!store) return;
    const body = document.getElementById('store-config-tab-body');
    if (body) {
      body.innerHTML = this.renderActiveConfigTabContent(store);
    }
  },

  // Option A: Category and Sub-Category Mapping (BRD §7.3 Option A)
  renderCategorySubcatMappingSection(store) {
    const allCategories = window.DB.getAll('itemCategories') || [];
    const allSubcats = window.DB.getAll('itemSubcategories') || [];
    const mappedSubcatIds = window.DB.getStoreCategoryMappings(store.id);

    // Initial grouping for Box 2 preview
    const initialGrouped = {};
    allCategories.forEach(cat => {
      const subcats = allSubcats.filter(sc => sc.category_id === cat.id || sc.category_id === cat.code);
      const mappedInThisCat = subcats.filter(sc => mappedSubcatIds.includes(sc.id));
      if (mappedInThisCat.length > 0) {
        initialGrouped[cat.id] = {
          id: cat.id,
          name: cat.name,
          subcats: mappedInThisCat
        };
      }
    });
    const initialMappedCats = Object.values(initialGrouped);

    setTimeout(() => {
      // Set initial indeterminate states
      allCategories.forEach(cat => {
        const subcats = allSubcats.filter(sc => sc.category_id === cat.id || sc.category_id === cat.code);
        const mappedInCat = subcats.filter(sc => mappedSubcatIds.includes(sc.id));
        const catCb = document.querySelector(`input.cat-header-cb[data-cat-id="${cat.id}"]`);
        if (catCb) {
          catCb.checked = (mappedInCat.length === subcats.length && subcats.length > 0);
          catCb.indeterminate = (mappedInCat.length > 0 && mappedInCat.length < subcats.length);
        }
      });
    }, 50);

    return `
      <div>
        <!-- 2-Box Layout -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 0;">
          
          <!-- Box 1 (Left Box): All Categories & Sub-Categories (Selection Box) -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface, #ffffff); display: flex; flex-direction: column; height: calc(100vh - 200px); min-height: 480px; max-height: 750px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
            
            <!-- Box 1 Header with Integrated Search -->
            <div style="padding: 8px 12px; background: var(--bg-surface-elevated, #f8fafc); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 46px;">
              <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); white-space: nowrap;">
                Categories & Sub-Categories
              </span>
              <div style="flex: 1; max-width: 230px; min-width: 130px; margin: 0 6px;">
                <input 
                  type="text" 
                  id="cat-search-filter" 
                  class="form-control form-control-sm" 
                  placeholder="Search category or sub-category..." 
                  oninput="window.StoreInventoryModule.filterCategorySubcatList(this.value)" 
                  style="height: 28px; font-size: 11.5px; width: 100%; border-radius: 4px;" 
                />
              </div>
              <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                <button type="button" class="btn btn-outline btn-xs" style="font-size: 10.5px; padding: 3px 6px;" onclick="window.StoreInventoryModule.toggleAllCategoriesAndSubcats(true)">Select All</button>
                <button type="button" class="btn btn-outline btn-xs" style="font-size: 10.5px; padding: 3px 6px;" onclick="window.StoreInventoryModule.toggleAllCategoriesAndSubcats(false)">Deselect All</button>
                <button type="button" class="btn btn-ghost btn-xs" style="font-size: 10.5px; padding: 3px 6px;" onclick="window.StoreInventoryModule.expandAllCategories(true)">Expand All</button>
                <button type="button" class="btn btn-ghost btn-xs" style="font-size: 10.5px; padding: 3px 6px;" onclick="window.StoreInventoryModule.expandAllCategories(false)">Collapse All</button>
              </div>
            </div>

            <!-- Box 1 Body: Scrollable Category Blocks -->
            <div id="cat-subcat-list-container" style="flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; background: var(--bg-surface-elevated, #f8fafc);">
              ${allCategories.map(cat => {
                const subcats = allSubcats.filter(sc => sc.category_id === cat.id || sc.category_id === cat.code);
                const checkedCount = subcats.filter(sc => mappedSubcatIds.includes(sc.id)).length;
                const isAllChecked = (subcats.length > 0 && checkedCount === subcats.length);
                return `
                  <div class="category-card-block" data-cat-id="${cat.id}" data-cat-name="${cat.name.toLowerCase()}" style="flex-shrink: 0; min-height: fit-content; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-surface, #ffffff); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    
                    <!-- Category Header with Checkbox and Collapse Toggle -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 9px 12px; background: rgba(99,102,241,0.08); border-bottom: 1px solid var(--border-subtle, var(--border-color)); cursor: pointer; user-select: none;" onclick="window.StoreInventoryModule.toggleCategoryCardCollapse('${cat.id}')">
                      <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 12.5px; color: var(--text-primary); cursor: pointer; margin: 0; user-select: none;" onclick="event.stopPropagation();">
                        <input 
                          type="checkbox" 
                          class="cat-header-cb" 
                          data-cat-id="${cat.id}" 
                          ${isAllChecked ? 'checked' : ''} 
                          onchange="window.StoreInventoryModule.onCategoryCheckboxChange('${cat.id}', this.checked)"
                          style="cursor: pointer; width: 15px; height: 15px; accent-color: var(--primary-500); margin: 0;" 
                        />
                        <span>${cat.name}</span>
                      </label>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span id="cat-badge-${cat.id}" class="badge ${checkedCount > 0 ? 'badge-primary' : 'badge-subtle'}" style="font-size: 10px;">
                          ${checkedCount} / ${subcats.length}
                        </span>
                        <span class="cat-collapse-chevron" style="font-size: 10px; color: var(--text-muted); transition: transform 0.2s;">▼</span>
                      </div>
                    </div>

                    <!-- Sub-Categories List -->
                    <div class="subcat-list-container" style="padding: 8px 12px 10px 28px; display: flex; flex-direction: column; gap: 7px; background: var(--bg-surface, #ffffff);">
                      ${subcats.length === 0 ? `
                        <span style="font-size: 11px; color: var(--text-muted); font-style: italic;">No sub-categories defined</span>
                      ` : subcats.map(sc => {
                        const isChecked = mappedSubcatIds.includes(sc.id);
                        return `
                          <label class="subcat-row-label" data-subcat-name="${sc.name.toLowerCase()}" style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; color: var(--text-primary); margin: 0; user-select: none; padding: 2px 4px; border-radius: 4px; transition: background 0.15s;" onmouseover="this.style.background='rgba(99,102,241,0.06)'" onmouseout="this.style.background='transparent'">
                            <input 
                              type="checkbox" 
                              name="store_subcat" 
                              value="${sc.id}" 
                              data-cat-id="${cat.id}" 
                              data-subcat-name="${sc.name}" 
                              data-cat-name="${cat.name}" 
                              ${isChecked ? 'checked' : ''} 
                              onchange="window.StoreInventoryModule.onSubcategoryCheckboxChange('${cat.id}')"
                              style="cursor: pointer; width: 14px; height: 14px; accent-color: var(--primary-500); margin: 0;" 
                            />
                            <span>${sc.name}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>

                  </div>
                `;
              }).join('')}
            </div>

            <!-- Box 1 Footer (Save Button at Bottom!) -->
            <div style="padding: 10px 14px; background: var(--bg-surface-elevated, #f8fafc); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
              <span id="cat-selection-summary" style="font-size: 11.5px; font-weight: 600; color: var(--text-muted);">
                Selected: <strong style="color: var(--primary-400);">${mappedSubcatIds.length}</strong> of ${allSubcats.length} Sub-Categories
              </span>
              <button type="button" class="btn btn-primary btn-sm" style="font-weight: 700; padding: 6px 18px; font-size: 12px;" onclick="window.StoreInventoryModule.saveStoreCategoryMappingConfig('${store.id}')">
                Save Sub-Category Mapping
              </button>
            </div>

          </div>

          <!-- Box 2 (Right Box): Mapped Categories & Sub-Categories (Visible in Another Box) -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface, #ffffff); display: flex; flex-direction: column; height: calc(100vh - 200px); min-height: 480px; max-height: 750px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
            
            <!-- Box 2 Header -->
            <div style="padding: 8px 12px; background: var(--bg-surface-elevated, #f8fafc); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 46px;">
              <span style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
                Mapped Categories & Sub-Categories
              </span>
              <span id="mapped-counter-badge" class="badge badge-primary" style="font-size: 11px;">
                ${initialMappedCats.length} Categories, ${mappedSubcatIds.length} Sub-Categories
              </span>
            </div>

            <!-- Box 2 Body: Mapped Categories & Sub-Categories Preview -->
            <div id="mapped-categories-preview" style="flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; background: var(--bg-surface-elevated, #f8fafc);">
              ${initialMappedCats.length === 0 ? `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--text-muted); padding: 30px;">
                  <div style="font-size: 13.5px; font-weight: 600; margin-bottom: 4px; color: var(--text-secondary);">No Sub-Categories Mapped</div>
                  <div style="font-size: 11.5px; max-width: 280px; line-height: 1.5;">Tick any category or sub-category in the left box to map them to this store.</div>
                </div>
              ` : initialMappedCats.map(cat => `
                <div class="mapped-cat-card" style="flex-shrink: 0; min-height: fit-content; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-surface, #ffffff); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                  <div style="padding: 8px 12px; background: rgba(99,102,241,0.08); border-bottom: 1px solid var(--border-subtle, var(--border-color)); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">
                      ${cat.name}
                    </span>
                    <span class="badge badge-primary" style="font-size: 10px;">${cat.subcats.length} mapped</span>
                  </div>
                  <div style="padding: 10px 12px; display: flex; flex-wrap: wrap; gap: 6px; background: var(--bg-surface, #ffffff);">
                    ${cat.subcats.map(sc => `
                      <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; background: rgba(99,102,241,0.1); color: var(--text-primary); border: 1px solid rgba(99,102,241,0.25); border-radius: 4px; padding: 3px 8px;">
                        <span>${sc.name}</span>
                        <button type="button" onclick="window.StoreInventoryModule.uncheckSingleSubcat('${sc.id}', '${cat.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0 0 0 4px; margin: 0; font-size: 12px; line-height: 1;" title="Remove this sub-category">✕</button>
                      </span>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Box 2 Footer -->
            <div style="padding: 10px 14px; background: var(--bg-surface-elevated, #f8fafc); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11.5px; color: var(--text-muted);">
                Live preview for <strong>${store.name}</strong>
              </span>
              <button type="button" class="btn btn-outline btn-xs" style="font-size: 11px; padding: 4px 10px;" onclick="window.StoreInventoryModule.toggleAllCategoriesAndSubcats(false)">
                Clear All
              </button>
            </div>

          </div>

        </div>
      </div>
    `;
  },

  toggleCategoryCardCollapse(catId) {
    const block = document.querySelector(`.category-card-block[data-cat-id="${catId}"]`);
    if (!block) return;
    const list = block.querySelector('.subcat-list-container');
    const chevron = block.querySelector('.cat-collapse-chevron');
    if (!list) return;
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'flex' : 'none';
    if (chevron) chevron.innerText = isHidden ? '▼' : '▶';
  },

  expandAllCategories(expand) {
    const blocks = document.querySelectorAll('.category-card-block');
    blocks.forEach(block => {
      const list = block.querySelector('.subcat-list-container');
      const chevron = block.querySelector('.cat-collapse-chevron');
      if (list) list.style.display = expand ? 'flex' : 'none';
      if (chevron) chevron.innerText = expand ? '▼' : '▶';
    });
  },

  onCategoryCheckboxChange(catId, isChecked) {
    const subcatCbs = document.querySelectorAll(`input[name="store_subcat"][data-cat-id="${catId}"]`);
    subcatCbs.forEach(cb => { cb.checked = isChecked; });
    this.updateCategoryCardBadge(catId);
    this.updateMappedCategoriesView();
  },

  onSubcategoryCheckboxChange(catId) {
    const subcatCbs = Array.from(document.querySelectorAll(`input[name="store_subcat"][data-cat-id="${catId}"]`));
    const total = subcatCbs.length;
    const checked = subcatCbs.filter(cb => cb.checked).length;
    const catCb = document.querySelector(`input.cat-header-cb[data-cat-id="${catId}"]`);
    if (catCb) {
      catCb.checked = (checked === total && total > 0);
      catCb.indeterminate = (checked > 0 && checked < total);
    }
    this.updateCategoryCardBadge(catId);
    this.updateMappedCategoriesView();
  },

  updateCategoryCardBadge(catId) {
    const subcatCbs = Array.from(document.querySelectorAll(`input[name="store_subcat"][data-cat-id="${catId}"]`));
    const total = subcatCbs.length;
    const checked = subcatCbs.filter(cb => cb.checked).length;
    const badge = document.getElementById(`cat-badge-${catId}`);
    if (badge) {
      badge.innerText = `${checked} / ${total}`;
      badge.className = `badge ${checked > 0 ? 'badge-primary' : 'badge-subtle'}`;
    }
  },

  toggleAllCategoriesAndSubcats(status) {
    const catCbs = document.querySelectorAll('input.cat-header-cb');
    catCbs.forEach(cb => {
      cb.checked = !!status;
      cb.indeterminate = false;
    });
    const subcatCbs = document.querySelectorAll('input[name="store_subcat"]');
    subcatCbs.forEach(cb => { cb.checked = !!status; });

    const allCatBlocks = document.querySelectorAll('.category-card-block');
    allCatBlocks.forEach(block => {
      const catId = block.getAttribute('data-cat-id');
      if (catId) this.updateCategoryCardBadge(catId);
    });
    this.updateMappedCategoriesView();
  },

  toggleAllSubcats(status) {
    this.toggleAllCategoriesAndSubcats(status);
  },

  uncheckSingleSubcat(subcatId, catId) {
    const cb = document.querySelector(`input[name="store_subcat"][value="${subcatId}"]`);
    if (cb) {
      cb.checked = false;
    }
    this.onSubcategoryCheckboxChange(catId);
  },

  filterCategorySubcatList(query) {
    const q = (query || '').trim().toLowerCase();
    const blocks = document.querySelectorAll('.category-card-block');
    blocks.forEach(b => {
      const catName = (b.getAttribute('data-cat-name') || '').toLowerCase();
      const subcatRows = b.querySelectorAll('.subcat-row-label');
      let anySubcatMatch = false;
      subcatRows.forEach(row => {
        const scName = (row.getAttribute('data-subcat-name') || '').toLowerCase();
        if (!q || catName.includes(q) || scName.includes(q)) {
          row.style.display = 'flex';
          anySubcatMatch = true;
        } else {
          row.style.display = 'none';
        }
      });
      if (!q || catName.includes(q) || anySubcatMatch) {
        b.style.display = 'block';
      } else {
        b.style.display = 'none';
      }
    });
  },

  updateMappedCategoriesView() {
    const checkedSubcats = Array.from(document.querySelectorAll('input[name="store_subcat"]:checked'));
    const totalSubcats = document.querySelectorAll('input[name="store_subcat"]').length;

    // Update summary in Box 1
    const summaryText = document.getElementById('cat-selection-summary');
    if (summaryText) {
      summaryText.innerHTML = `Selected: <strong style="color: var(--primary-400);">${checkedSubcats.length}</strong> of ${totalSubcats} Sub-Categories`;
    }

    // Group by category
    const grouped = {};
    checkedSubcats.forEach(cb => {
      const catId = cb.getAttribute('data-cat-id');
      const catName = cb.getAttribute('data-cat-name') || 'Category';
      const scId = cb.value;
      const scName = cb.getAttribute('data-subcat-name') || scId;
      if (!grouped[catId]) {
        grouped[catId] = { id: catId, name: catName, subcats: [] };
      }
      grouped[catId].subcats.push({ id: scId, name: scName });
    });

    const mappedCats = Object.values(grouped);

    // Update counter badge in Box 2
    const counterBadge = document.getElementById('mapped-counter-badge');
    if (counterBadge) {
      counterBadge.innerText = `${mappedCats.length} Categories, ${checkedSubcats.length} Sub-Categories`;
    }

    // Update preview container in Box 2
    const container = document.getElementById('mapped-categories-preview');
    if (!container) return;

    if (mappedCats.length === 0) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--text-muted); padding: 30px;">
          <div style="font-size: 13.5px; font-weight: 600; margin-bottom: 4px; color: var(--text-secondary);">No Sub-Categories Mapped</div>
          <div style="font-size: 11.5px; max-width: 280px; line-height: 1.5;">Tick any category or sub-category in the left box to map them to this store.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = mappedCats.map(cat => `
      <div class="mapped-cat-card" style="flex-shrink: 0; min-height: fit-content; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-surface, #ffffff); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <div style="padding: 8px 12px; background: rgba(99,102,241,0.08); border-bottom: 1px solid var(--border-subtle, var(--border-color)); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">
            ${cat.name}
          </span>
          <span class="badge badge-primary" style="font-size: 10px;">${cat.subcats.length} mapped</span>
        </div>
        <div style="padding: 10px 12px; display: flex; flex-wrap: wrap; gap: 6px; background: var(--bg-surface, #ffffff);">
          ${cat.subcats.map(sc => `
            <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; background: rgba(99,102,241,0.1); color: var(--text-primary); border: 1px solid rgba(99,102,241,0.25); border-radius: 4px; padding: 3px 8px;">
              <span>${sc.name}</span>
              <button type="button" onclick="window.StoreInventoryModule.uncheckSingleSubcat('${sc.id}', '${cat.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0 0 0 4px; margin: 0; font-size: 12px; line-height: 1;" title="Remove this sub-category">✕</button>
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');
  },

  saveStoreCategoryMappingConfig(storeId) {
    const cbs = document.querySelectorAll('input[name="store_subcat"]:checked');
    const selectedIds = Array.from(cbs).map(cb => cb.value);

    window.DB.saveStoreCategoryMappings(storeId, selectedIds);
    window.State.showToast(`Saved ${selectedIds.length} sub-category mappings for store.`);
    this.render();
    this.switchConfigTab('ITEMS');
  },

  // Individual Item Mapping (BRD §7.3 Option B - 2-Box Dual Layout)
  renderIndividualItemMappingSection(store) {
    const allItems = window.DB.getAll('items') || [];
    const activeItems = allItems.filter(i => i.status === 'Active' || !i.status);
    const mappedItemIds = window.DB.getStoreItemMappings(store.id);
    const allCategories = window.DB.getAll('itemCategories') || [];
    const allSubcats = window.DB.getAll('itemSubcategories') || [];

    const getCatName = (item) => {
      if (item.category_name) return item.category_name;
      const cat = allCategories.find(c => c.id === item.category_id || c.code === item.category_id);
      if (cat) return cat.name;
      const sub = allSubcats.find(s => s.id === item.subcategory_id || s.code === item.subcategory_id);
      if (sub) return sub.name;
      return item.category_id || 'General';
    };

    const initialMappedItems = activeItems.filter(item => mappedItemIds.includes(item.id) || mappedItemIds.includes(item.code));
    const initialGrouped = {};
    initialMappedItems.forEach(item => {
      const cat = getCatName(item);
      if (!initialGrouped[cat]) initialGrouped[cat] = [];
      initialGrouped[cat].push(item);
    });

    return `
      <div>
        <!-- 2-Box Layout -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 0;">
          
          <!-- Box 1 (Left Box): All Available Items (Selection Box) -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface, #ffffff); display: flex; flex-direction: column; height: calc(100vh - 200px); min-height: 480px; max-height: 750px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
            
            <!-- Box 1 Header with Integrated Search -->
            <div style="padding: 8px 12px; background: var(--bg-surface-elevated, #f8fafc); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 46px;">
              <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); white-space: nowrap;">
                Available Items
              </span>
              <div style="flex: 1; max-width: 230px; min-width: 130px; margin: 0 6px;">
                <input 
                  type="text" 
                  id="item-cfg-search" 
                  class="form-control form-control-sm" 
                  placeholder="Search item code or name..." 
                  oninput="window.StoreInventoryModule.filterIndividualItemMappingList(this.value)" 
                  style="height: 28px; font-size: 11.5px; width: 100%; border-radius: 4px;" 
                />
              </div>
              <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                <button type="button" class="btn btn-outline btn-xs" style="font-size: 10.5px; padding: 3px 8px;" onclick="window.StoreInventoryModule.toggleAllFilteredItems(true)">Select All</button>
                <button type="button" class="btn btn-outline btn-xs" style="font-size: 10.5px; padding: 3px 8px;" onclick="window.StoreInventoryModule.toggleAllFilteredItems(false)">Deselect All</button>
              </div>
            </div>

            <!-- Box 1 Body: Scrollable Item Cards -->
            <div id="individual-items-list-container" style="flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; background: var(--bg-surface-elevated, #f8fafc);">
              ${activeItems.length === 0 ? `
                <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 12.5px;">No active items registered in Item Master</div>
              ` : activeItems.map(item => {
                const isItemChecked = mappedItemIds.includes(item.id) || mappedItemIds.includes(item.code);
                const catName = getCatName(item);
                return `
                  <label class="item-mapping-row individual-item-row" data-search="${(item.code + ' ' + item.name + ' ' + catName).toLowerCase()}" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 12px; border: 1px solid var(--border-color); background: var(--bg-surface, #ffffff); border-radius: 6px; cursor: pointer; margin: 0; transition: background 0.15s, border-color 0.15s; flex-shrink: 0;" onmouseover="this.style.background='rgba(99,102,241,0.05)'" onmouseout="this.style.background='var(--bg-surface, #ffffff)'">
                    <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
                      <input 
                        type="checkbox" 
                        name="store_item_id" 
                        value="${item.id}" 
                        data-item-code="${item.code}"
                        data-item-name="${item.name}"
                        data-cat-name="${catName}"
                        ${isItemChecked ? 'checked' : ''} 
                        onchange="window.StoreInventoryModule.onIndividualItemCheckboxChange()"
                        style="cursor: pointer; transform: scale(1.15); accent-color: var(--primary-500); margin: 0; flex-shrink: 0;" 
                      />
                      <span class="cell-mono cell-strong" style="font-size: 11.5px; background: rgba(99,102,241,0.08); padding: 2px 6px; border-radius: 4px; flex-shrink: 0;">${item.code}</span>
                      <span style="font-size: 12.5px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</span>
                    </div>
                    <span style="font-size: 11px; color: var(--text-secondary); background: var(--bg-surface-elevated, #f1f5f9); padding: 2px 8px; border-radius: 12px; white-space: nowrap; flex-shrink: 0;">
                      ${catName}
                    </span>
                  </label>
                `;
              }).join('')}
            </div>

            <!-- Box 1 Footer (Save Button at Bottom!) -->
            <div style="padding: 10px 14px; background: var(--bg-surface-elevated, #f8fafc); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
              <span id="item-selection-summary" style="font-size: 11.5px; font-weight: 600; color: var(--text-muted);">
                Selected: <strong style="color: var(--primary-400);">${initialMappedItems.length}</strong> of ${activeItems.length} Items
              </span>
              <button type="button" class="btn btn-primary btn-sm" style="font-weight: 700; padding: 6px 18px; font-size: 12px;" onclick="window.StoreInventoryModule.saveStoreItemMappingConfig('${store.id}')">
                Save Individual Item Mapping
              </button>
            </div>

          </div>

          <!-- Box 2 (Right Box): Mapped Items (Live Preview in Another Box) -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface, #ffffff); display: flex; flex-direction: column; height: calc(100vh - 200px); min-height: 480px; max-height: 750px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
            
            <!-- Box 2 Header -->
            <div style="padding: 8px 12px; background: var(--bg-surface-elevated, #f8fafc); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 46px;">
              <span style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
                Mapped Individual Items
              </span>
              <span id="mapped-items-counter-badge" class="badge badge-primary" style="font-size: 11px;">
                ${Object.keys(initialGrouped).length} Categories, ${initialMappedItems.length} Items
              </span>
            </div>

            <!-- Box 2 Body: Mapped Items Preview Cards & Removable Chips -->
            <div id="mapped-individual-items-preview" style="flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; background: var(--bg-surface-elevated, #f8fafc);">
              ${initialMappedItems.length === 0 ? `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--text-muted); padding: 30px;">
                  <div style="font-size: 13.5px; font-weight: 600; margin-bottom: 4px; color: var(--text-secondary);">No Items Mapped</div>
                  <div style="font-size: 11.5px; max-width: 280px; line-height: 1.5;">Tick any item in the left box to map it individually to this store.</div>
                </div>
              ` : Object.entries(initialGrouped).map(([catName, items]) => `
                <div class="mapped-cat-card" style="flex-shrink: 0; min-height: fit-content; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-surface, #ffffff); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                  <div style="padding: 8px 12px; background: rgba(99,102,241,0.08); border-bottom: 1px solid var(--border-subtle, var(--border-color)); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">${catName}</span>
                    <span class="badge badge-primary" style="font-size: 10px;">${items.length} mapped</span>
                  </div>
                  <div style="padding: 10px 12px; display: flex; flex-wrap: wrap; gap: 6px; background: var(--bg-surface, #ffffff);">
                    ${items.map(item => `
                      <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; background: rgba(99,102,241,0.1); color: var(--text-primary); border: 1px solid rgba(99,102,241,0.25); border-radius: 4px; padding: 3px 8px;">
                        <span><strong style="font-family: monospace;">${item.code}</strong> ${item.name}</span>
                        <button type="button" onclick="window.StoreInventoryModule.uncheckSingleIndividualItem('${item.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0 0 0 4px; margin: 0; font-size: 12px; line-height: 1;" title="Remove this item">✕</button>
                      </span>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Box 2 Footer -->
            <div style="padding: 10px 14px; background: var(--bg-surface-elevated, #f8fafc); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11.5px; color: var(--text-muted);">
                Live preview for <strong>${store.name}</strong>
              </span>
              <button type="button" class="btn btn-outline btn-xs" style="font-size: 11px; padding: 4px 10px;" onclick="window.StoreInventoryModule.toggleAllFilteredItems(false)">
                Clear All
              </button>
            </div>

          </div>

        </div>
      </div>
    `;
  },

  onIndividualItemCheckboxChange() {
    const checkedBoxes = Array.from(document.querySelectorAll('input[name="store_item_id"]:checked'));
    const allBoxes = document.querySelectorAll('input[name="store_item_id"]');

    // Update summary in Box 1
    const summaryText = document.getElementById('item-selection-summary');
    if (summaryText) {
      summaryText.innerHTML = `Selected: <strong style="color: var(--primary-400);">${checkedBoxes.length}</strong> of ${allBoxes.length} Items`;
    }

    // Group checked items by category
    const grouped = {};
    checkedBoxes.forEach(cb => {
      const catName = cb.getAttribute('data-cat-name') || 'General';
      const itemCode = cb.getAttribute('data-item-code') || '';
      const itemName = cb.getAttribute('data-item-name') || '';
      const itemId = cb.value;

      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push({ id: itemId, code: itemCode, name: itemName });
    });

    // Update badge in Box 2
    const badge = document.getElementById('mapped-items-counter-badge');
    const catKeys = Object.keys(grouped);
    if (badge) {
      badge.innerText = `${catKeys.length} Categories, ${checkedBoxes.length} Items`;
    }

    // Update preview in Box 2
    const previewContainer = document.getElementById('mapped-individual-items-preview');
    if (!previewContainer) return;

    if (checkedBoxes.length === 0) {
      previewContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--text-muted); padding: 30px;">
          <div style="font-size: 13.5px; font-weight: 600; margin-bottom: 4px; color: var(--text-secondary);">No Items Mapped</div>
          <div style="font-size: 11.5px; max-width: 280px; line-height: 1.5;">Tick any item in the left box to map it individually to this store.</div>
        </div>
      `;
      return;
    }

    previewContainer.innerHTML = Object.entries(grouped).map(([catName, items]) => `
      <div class="mapped-cat-card" style="flex-shrink: 0; min-height: fit-content; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-surface, #ffffff); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <div style="padding: 8px 12px; background: rgba(99,102,241,0.08); border-bottom: 1px solid var(--border-subtle, var(--border-color)); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">${catName}</span>
          <span class="badge badge-primary" style="font-size: 10px;">${items.length} mapped</span>
        </div>
        <div style="padding: 10px 12px; display: flex; flex-wrap: wrap; gap: 6px; background: var(--bg-surface, #ffffff);">
          ${items.map(item => `
            <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; background: rgba(99,102,241,0.1); color: var(--text-primary); border: 1px solid rgba(99,102,241,0.25); border-radius: 4px; padding: 3px 8px;">
              <span><strong style="font-family: monospace;">${item.code}</strong> ${item.name}</span>
              <button type="button" onclick="window.StoreInventoryModule.uncheckSingleIndividualItem('${item.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0 0 0 4px; margin: 0; font-size: 12px; line-height: 1;" title="Remove this item">✕</button>
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');
  },

  uncheckSingleIndividualItem(itemId) {
    const cb = document.querySelector(`input[name="store_item_id"][value="${itemId}"]`);
    if (cb) {
      cb.checked = false;
    }
    this.onIndividualItemCheckboxChange();
  },

  filterIndividualItemMappingList(val) {
    const q = (val || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.item-mapping-row');
    rows.forEach(r => {
      const match = (r.getAttribute('data-search') || '').includes(q);
      r.style.display = match ? 'flex' : 'none';
    });
  },

  toggleAllFilteredItems(status) {
    const rows = document.querySelectorAll('.item-mapping-row');
    rows.forEach(r => {
      if (r.style.display !== 'none') {
        const cb = r.querySelector('input[name="store_item_id"]');
        if (cb) cb.checked = !!status;
      }
    });
    this.onIndividualItemCheckboxChange();
  },

  saveStoreItemMappingConfig(storeId) {
    const cbs = document.querySelectorAll('input[name="store_item_id"]:checked');
    const selectedIds = Array.from(cbs).map(cb => cb.value);

    window.DB.saveStoreItemMappings(storeId, selectedIds);
    window.State.showToast(`Saved ${selectedIds.length} individually mapped items for store.`);
    this.itemMappingSubView = 'ITEMS';
    this.render();
    this.switchConfigTab('ITEMS');
  },


  // Configuration Tab 4: Store-Wise Reorder Levels (BRD §7.4 & STR-BR-20 to 27)
  renderStoreConfigReorder(store) {
    const rules = window.DB.getStoreReorderLevels(store.id);
    const alerts = window.DB.getStoreReorderAlerts(store.id);

    return `
      <div style="margin-top: 8px;">
        <!-- Reorder Alert Banner -->
        ${alerts.length > 0 ? `
          <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--color-danger); padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="font-size: 12.5px; font-weight: 700; color: var(--color-danger);">
                🚨 ${alerts.length} Item(s) Below Reorder Level in ${store.name} (STR-BR-21)
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                Replenishment demand should be initiated for critical items listed below.
              </div>
            </div>
            <span class="badge badge-danger" style="font-size: 11px; padding: 4px 8px; font-weight: 700;">Action Required</span>
          </div>
        ` : `
          <div style="background: rgba(34, 197, 94, 0.05); border-left: 3px solid var(--color-success); padding: 10px 14px; margin-bottom: 14px; font-size: 11.5px; color: var(--text-secondary);">
            ✅ Stock levels are healthy across all configured items. Minimum Stock Level ≤ Reorder Level ≤ Maximum Stock Level (STR-BR-25).
          </div>
        `}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">
            Configured Items: <span style="color: var(--primary-300);">${rules.length}</span>
          </span>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.StoreInventoryModule.showAddReorderRuleModal('${store.id}')">
            + Set Item Reorder Level
          </button>
        </div>

        <div class="table-responsive" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item Code & Name</th>
                <th class="text-right">Available</th>
                <th class="text-right">Min Stock</th>
                <th class="text-right">Reorder Level</th>
                <th class="text-right">Suggested Qty</th>
                <th class="text-right">Max Stock</th>
                <th class="text-right">Lead Time</th>
                <th>Alert Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${rules.length === 0 ? `
                <tr>
                  <td colspan="9" class="text-center" style="padding: 30px; color: var(--text-muted);">
                    No reorder levels configured for this store yet. Click "+ Set Item Reorder Level" above.
                  </td>
                </tr>
              ` : rules.map(r => {
                const effectiveItems = window.DB.getStoreEffectiveItems(store.id);
                const item = effectiveItems.find(i => i.id === r.item_id || i.code === r.item_code) || { store_available: 0 };
                const avail = item.store_available || 0;
                const isBelowReorder = avail <= r.reorder_level;
                const isBelowMin = avail <= r.min_stock_level;

                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong">${r.item_code}</div>
                      <div style="font-weight: 600; color: var(--text-primary);">${r.item_name}</div>
                    </td>
                    <td class="text-right cell-num" style="font-weight: 700; color: ${isBelowMin ? 'var(--color-danger)' : (isBelowReorder ? 'var(--color-warning)' : 'var(--text-primary)')};">
                      ${avail}
                    </td>
                    <td class="text-right cell-num">${r.min_stock_level}</td>
                    <td class="text-right cell-num" style="font-weight: 700;">${r.reorder_level}</td>
                    <td class="text-right cell-num" style="color: var(--primary-300); font-weight: 700;">+${r.reorder_quantity}</td>
                    <td class="text-right cell-num">${r.max_stock_level || '—'}</td>
                    <td class="text-right cell-num">${r.lead_time_days || 0}d</td>
                    <td>
                      ${isBelowMin ? `
                        <span class="badge badge-danger" style="font-size: 9.5px; font-weight: 700;">CRITICAL &le; MIN</span>
                      ` : isBelowReorder ? `
                        <span class="badge badge-warning" style="font-size: 9.5px; font-weight: 700;">REORDER ALERT</span>
                      ` : `
                        <span class="badge badge-success" style="font-size: 9.5px;">HEALTHY</span>
                      `}
                    </td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 4px; align-items: center;">
                        <button class="btn btn-icon btn-sm" title="Edit Rule" onclick="window.StoreInventoryModule.showAddReorderRuleModal('${store.id}', '${r.item_id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="Delete Rule" style="color: var(--color-danger, #ef4444);" onclick="window.StoreInventoryModule.deleteReorderRule('${r.id}', '${store.id}')">
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
      </div>
    `;
  },

  showAddReorderRuleModal(storeId, editItemId = null) {
    const effectiveItems = window.DB.getStoreEffectiveItems(storeId);
    if (effectiveItems.length === 0) {
      window.State.showToast('No items mapped to this store. Map items in Tab 3 before configuring reorder levels (STR-BR-23).', 'warning');
      return;
    }

    const rules = window.DB.getStoreReorderLevels(storeId);
    const existingRule = editItemId ? rules.find(r => r.item_id === editItemId) : null;
    const selectedItem = editItemId ? effectiveItems.find(i => i.id === editItemId) : effectiveItems[0];

    const contentHtml = `
      <form id="reorder-rule-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitReorderRule('${storeId}');">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Select Mapped Item <span style="color: var(--color-danger)">*</span></label>
            <select id="rr-item-id" class="form-control" ${existingRule ? 'disabled' : ''} required>
              ${effectiveItems.map(i => `
                <option value="${i.id}" ${existingRule && existingRule.item_id === i.id ? 'selected' : ''}>
                  ${i.code} - ${i.name} (${i.category_name || 'Parts'})
                </option>
              `).join('')}
            </select>
            ${existingRule ? `<input type="hidden" id="rr-item-id-hidden" value="${existingRule.item_id}" />` : ''}
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Minimum Stock Level <span style="color: var(--color-danger)">*</span></label>
            <input type="number" id="rr-min" class="form-control" min="0" value="${existingRule ? existingRule.min_stock_level : 5}" required />
            <small style="color: var(--text-muted); font-size: 10px;">Floor threshold below which safety stock is breached</small>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Reorder Level <span style="color: var(--color-danger)">*</span></label>
            <input type="number" id="rr-reorder" class="form-control" min="0" value="${existingRule ? existingRule.reorder_level : 10}" required />
            <small style="color: var(--text-muted); font-size: 10px;">Trigger point for reorder alerts (STR-BR-21)</small>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Suggested Reorder Quantity <span style="color: var(--color-danger)">*</span></label>
            <input type="number" id="rr-qty" class="form-control" min="1" value="${existingRule ? existingRule.reorder_quantity : 20}" required />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Maximum Stock Level</label>
            <input type="number" id="rr-max" class="form-control" min="0" value="${existingRule ? existingRule.max_stock_level : 50}" />
            <small style="color: var(--text-muted); font-size: 10px;">Min &le; Reorder &le; Max (STR-BR-25)</small>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Lead Time (Days)</label>
            <input type="number" id="rr-lead" class="form-control" min="0" value="${existingRule ? existingRule.lead_time_days : 3}" />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Status</label>
            <select id="rr-status" class="form-control">
              <option value="Active" ${!existingRule || existingRule.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${existingRule && existingRule.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>

        </div>

        <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm">Save Reorder Level</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: `🎯 Configure Reorder Level: ${selectedItem ? selectedItem.name : ''}`,
      maxWidth: '540px',
      contentHtml,
      footerHtml: null
    });
  },

  submitReorderRule(storeId) {
    const itemSelect = document.getElementById('rr-item-id');
    const itemHidden = document.getElementById('rr-item-id-hidden');
    const itemId = itemHidden ? itemHidden.value : (itemSelect ? itemSelect.value : '');

    const min = Number(document.getElementById('rr-min').value) || 0;
    const reorder = Number(document.getElementById('rr-reorder').value) || 0;
    const qty = Number(document.getElementById('rr-qty').value) || 0;
    const max = Number(document.getElementById('rr-max').value) || 0;
    const lead = Number(document.getElementById('rr-lead').value) || 0;
    const status = document.getElementById('rr-status').value;

    const allItems = window.DB.getAll('items') || [];
    const item = allItems.find(i => i.id === itemId);

    try {
      window.DB.saveStoreReorderLevel({
        store_id: storeId,
        item_id: itemId,
        item_code: item ? item.code : itemId,
        item_name: item ? item.name : itemId,
        min_stock_level: min,
        reorder_level: reorder,
        reorder_quantity: qty,
        max_stock_level: max,
        lead_time_days: lead,
        status: status
      });

      window.State.closeModal();
      window.State.showToast(`Reorder levels saved for ${item ? item.name : itemId}`);
      this.render();
      this.showStoreConfigurationModal(storeId, 'REORDER');
    } catch (err) {
      window.State.showToast(err.message, 'error');
    }
  },

  deleteReorderRule(ruleId, storeId) {
    if (!confirm('Are you sure you want to delete this reorder rule?')) return;
    window.DB.deleteStoreReorderLevel(ruleId);
    window.State.showToast('Reorder rule deleted.');
    this.render();
    this.switchConfigTab('REORDER');
  },

  // Configuration Tab 5: Audit History (BRD §17)
  renderStoreConfigAudit(store) {
    const logs = window.DB.getStoreAuditLogs(store.id);

    return `
      <div style="margin-top: 8px;">
        <div style="background: rgba(255,255,255,0.03); border-left: 3px solid var(--primary-400); padding: 8px 14px; margin-bottom: 14px; font-size: 11.5px; color: var(--text-secondary);">
          <strong>Immutable Configuration Audit Trail (BRD §17):</strong>
          Records all store setup changes, status toggles, screen permissions, item mapping revisions, and replenishment thresholds.
        </div>

        <div class="table-responsive" style="max-height: 320px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User / Actor</th>
                <th>Action</th>
                <th>Change Details</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `
                <tr><td colspan="4" class="text-center" style="padding: 30px; color: var(--text-muted);">No audit events recorded for this store yet</td></tr>
              ` : logs.map(l => `
                <tr>
                  <td class="cell-mono" style="font-size: 11px; color: var(--text-muted);">${window.formatDateTime(l.timestamp)}</td>
                  <td style="font-weight: 600; color: var(--text-primary); font-size: 11.5px;">${l.user || 'System'}</td>
                  <td>
                    <span class="badge badge-subtle" style="font-size: 9.5px; font-family: var(--font-mono);">${l.action}</span>
                  </td>
                  <td style="font-size: 12px; color: var(--text-secondary);">${l.details}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // Visual Hierarchy Tree Modal (BRD §5)
  showStoreHierarchyModal() {
    const orgs = window.DB.getAll('organizations') || [{ id: 'ORG-01', name: 'Mauli Service Center Pvt. Ltd.' }];
    const plants = window.DB.getAll('plants') || [];
    const stores = window.DB.getAll('warehouses') || [];

    const contentHtml = `
      <div style="padding: 10px 4px;">
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
          <strong>Organizational & Physical Store Hierarchy (BRD §5):</strong> Organization &rarr; Facility &rarr; Main Store &rarr; Sub Store &rarr; Mappings
        </div>

        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; max-height: 400px; overflow-y: auto;">
          ${orgs.map(org => `
            <div style="margin-bottom: 16px;">
              <div style="font-weight: 700; font-size: 14px; color: var(--primary-300); display: flex; align-items: center; gap: 8px;">
                <span>🏢</span>
                <span>${org.name}</span>
                <span class="badge badge-subtle" style="font-size: 10px;">Organization</span>
              </div>

              <!-- Facilities under Organization -->
              <div style="margin-left: 20px; border-left: 2px dashed rgba(255,255,255,0.15); padding-left: 14px; margin-top: 8px; display: flex; flex-direction: column; gap: 12px;">
                ${plants.length === 0 ? `
                  <div style="color: var(--text-muted); font-size: 11px;">No facilities registered under this organization</div>
                ` : plants.map(plant => {
                  // Find main stores mapped to this plant
                  const plantStores = stores.filter(s => {
                    const fIds = Array.isArray(s.facility_ids) && s.facility_ids.length > 0 ? s.facility_ids : (s.plant_id ? [s.plant_id] : []);
                    return fIds.includes(plant.id);
                  });
                  const mainStores = plantStores.filter(s => !s.parent_store_id || s.warehouse_type === 'MAIN_STORE');

                  return `
                    <div>
                      <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                        <span>📍</span>
                        <span>${plant.name}</span>
                        <span class="badge badge-subtle" style="font-size: 9.5px;">Facility / Service Center</span>
                      </div>

                      <!-- Stores under Facility -->
                      <div style="margin-left: 18px; border-left: 2px dotted rgba(255,255,255,0.1); padding-left: 12px; margin-top: 6px; display: flex; flex-direction: column; gap: 8px;">
                        ${mainStores.length === 0 ? `
                          <div style="color: var(--text-muted); font-size: 11px; font-style: italic;">No stores mapped to this facility</div>
                        ` : mainStores.map(ms => {
                          const subStores = plantStores.filter(s => s.parent_store_id === ms.id);
                          return `
                            <div>
                              <div style="font-weight: 600; font-size: 12px; color: var(--color-success); display: flex; align-items: center; gap: 6px;">
                                <span>🏬</span>
                                <span>${ms.name} (${ms.code || ms.id})</span>
                                <span class="badge badge-primary" style="font-size: 9px;">Main Store</span>
                              </div>

                              <!-- Sub Stores under Main Store -->
                              ${subStores.length > 0 ? `
                                <div style="margin-left: 16px; border-left: 2px solid rgba(255,255,255,0.06); padding-left: 10px; margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
                                  ${subStores.map(ss => `
                                    <div style="font-size: 11.5px; color: var(--accent-300); display: flex; align-items: center; gap: 6px;">
                                      <span>📦</span>
                                      <span>${ss.name} (${ss.code || ss.id})</span>
                                      <span class="badge badge-subtle" style="font-size: 8.5px;">Sub Store</span>
                                    </div>
                                  `).join('')}
                                </div>
                              ` : ''}
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    window.State.showModal({
      title: '🌳 Organizational & Store Hierarchy Tree',
      maxWidth: '680px',
      contentHtml,
      footerHtml: null
    });
  },

  // Edit Store Details Modal
  showEditStoreModal(storeId) {
    this.showStoreConfigurationModal(storeId, 'DETAILS');
  },

  hasStoreStock(storeId) {
    const allBalances = (window.DB && typeof window.DB.getAll === 'function') 
      ? (window.DB.getAll('inventoryBalances') || []) 
      : [];
    return allBalances.some(b => 
      (b.warehouse_id === storeId || b.store_id === storeId) && 
      ((Number(b.on_hand) || 0) > 0 || (Number(b.reserved) || 0) > 0)
    );
  },

  toggleStoreStatus(storeId) {
    const store = window.DB.getById('warehouses', storeId);
    if (!store) return;
    const isCurrentlyActive = store.status === 'Active' || !store.status;
    
    // Check if store has stock: cannot deactivate a store with active stock
    if (isCurrentlyActive && this.hasStoreStock(storeId)) {
      alert(`Cannot deactivate store "${store.name}" (${store.code || store.id}).\n\nThis store currently contains active inventory stock balances.\nYou cannot deactivate a store with physical stock on-hand. Please transfer or adjust the stock to zero before deactivating.`);
      return;
    }

    // STR-BR-30: A Main Store with active Sub Stores cannot be deactivated
    if (isCurrentlyActive && (!store.parent_store_id || store.warehouse_type === 'MAIN_STORE')) {
      const allStores = window.DB.getAll('warehouses') || [];
      const dependentSubs = allStores.filter(s => s.parent_store_id === storeId && (s.status === 'Active' || !s.status));
      if (dependentSubs.length > 0) {
        const subNames = dependentSubs.map(s => `"${s.name}" (${s.code || s.id})`).join(', ');
        alert(`STR-BR-30 VIOLATION:\n\nCannot deactivate Main Store "${store.name}".\n\nThere are ${dependentSubs.length} active Sub Store(s) dependent on it:\n${subNames}\n\nPlease reassign or deactivate dependent Sub Stores before deactivating this Main Store.`);
        return;
      }
    }

    const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    store.status = newStatus;
    store.updated_at = new Date().toISOString();
    window.DB.saveData();
    window.DB.emitChange('warehouses');
    if (window.DB && typeof window.DB.syncWarehouseToBackend === 'function') {
      window.DB.syncWarehouseToBackend(store, 'PUT');
    }
    window.DB.logStoreAudit(storeId, 'STORE_STATUS_TOGGLE', `Store status changed to ${newStatus}`);
    window.State.showToast(`Store "${store.name}" is now marked ${newStatus}`);
    this.render();
  },

  deleteStore(storeId) {
    const store = window.DB.getById('warehouses', storeId);
    if (!store) return;

    // Cannot delete store if it has active stock
    if (this.hasStoreStock(storeId)) {
      alert(`Cannot delete store "${store.name}" (${store.code || store.id}).\n\nThis store currently contains active inventory stock balances.\nYou cannot delete a store with physical stock. Please transfer, issue, or adjust the stock to zero before deleting.`);
      return;
    }

    // STR-BR-29: A store with transactions cannot be deleted; it can only be deactivated.
    const allTx = window.DB.getAll('inventoryTransactions') || [];
    const hasTx = allTx.some(t => t.warehouse_id === storeId || t.source_warehouse_id === storeId || t.destination_warehouse_id === storeId);

    if (hasTx) {
      alert(`STR-BR-29 VIOLATION:\n\nStore "${store.name}" (${store.code || store.id}) cannot be deleted because it has historical transactions.\n\nUnder BRD business rules, stores with historical transactions can only be marked Inactive (deactivated), preserving data integrity and audit trails.`);
      return;
    }

    // STR-BR-30 check if main store has sub stores
    const allStores = window.DB.getAll('warehouses') || [];
    const dependentSubs = allStores.filter(s => s.parent_store_id === storeId);
    if (dependentSubs.length > 0) {
      alert(`Cannot delete Main Store "${store.name}". It has ${dependentSubs.length} dependent Sub Store(s). Reassign or delete dependent sub stores first.`);
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete store "${store.name}" (${store.code || store.id})?`)) return;

    window.DB.delete('warehouses', storeId);
    if (window.DB && typeof window.DB.syncWarehouseToBackend === 'function') {
      window.DB.syncWarehouseToBackend({ id: storeId }, 'DELETE');
    }
    window.DB.logStoreAudit(storeId, 'STORE_DELETE', `Deleted store ${store.name} (${store.code || store.id})`);
    window.State.showToast(`Store "${store.name}" removed successfully.`);
    this.render();
  },

  deleteStorageLocation(locId) {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.deleteStorageLocation === 'function') {
      return window.OrgLocationModule.deleteStorageLocation(locId);
    }
  },

  deleteRack(rackId) {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.deleteRack === 'function') {
      return window.OrgLocationModule.deleteRack(rackId);
    }
  },

  deleteShelf(shelfId) {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.deleteShelf === 'function') {
      return window.OrgLocationModule.deleteShelf(shelfId);
    }
  },

  deleteBin(binId) {
    if (window.OrgLocationModule && typeof window.OrgLocationModule.deleteBin === 'function') {
      return window.OrgLocationModule.deleteBin(binId);
    }
  },

  clearAllStores() {
    if (!confirm('Are you sure you want to remove ALL stores from Store Master? This action cannot be undone.')) return;
    window.DB.clear('warehouses');
    window.State.showToast('All stores removed successfully from Store Master.');
    this.render();
  },

  // =========================================================================
  // ITEM MASTER ACTIONS & MODALS (Two-Wheeler Service Center BRD v1.0)
  // =========================================================================
  toggleItemStatus(itemId) {
    const item = window.DB.getById('items', itemId);
    if (!item) return;
    const newStatus = (item.status === 'Active' || !item.status) ? 'Inactive' : 'Active';
    item.status = newStatus;
    window.DB.saveData();
    window.DB.emitChange('items');
    window.State.showToast(`Item "${item.name}" marked ${newStatus}`);
    this.render();
  },

  deleteItem(itemId) {
    const item = window.DB.getById('items', itemId);
    if (!item) return;

    // BR-009: Prevent deletion if item has historical stock or transactions
    const balances = window.DB.getAll('inventoryBalances') || [];
    const hasStock = balances.some(b => b.item_id === itemId && ((Number(b.on_hand) || 0) > 0 || (Number(b.reserved) || 0) > 0));
    const jobCards = window.DB.getAll('jobCards') || [];
    const hasJobCards = jobCards.some(jc => (jc.parts_required || []).some(p => p.item_id === itemId));

    if (hasStock || hasJobCards) {
      window.State.showToast(`BR-009: Cannot delete "${item.name}" - Item has stock balances or service transaction history. Deactivate item instead.`, 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete item "${item.name}" (${item.code})?`)) return;
    window.DB.delete('items', itemId);
    window.State.showToast(`Item "${item.name}" deleted successfully.`);
    this.render();
  },

  showAddItemModal() {
    if (window.ItemSetupModule && typeof window.ItemSetupModule.showItemModal === 'function') {
      window.ItemSetupModule.showItemModal();
      return;
    }
    const categories = window.DB.getAll('itemCategories') || [];
    const vehicleModels = window.DB.getAll('vehicleModels') || [];
    const nextNum = (window.DB.getAll('items') || []).length + 1;
    const defaultCode = `SP-2W-${String(nextNum).padStart(3, '0')}`;

    const contentHtml = `
      <form id="add-item-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitAddItem();" style="display: flex; flex-direction: column; gap: 14px;">
        
        <!-- Section 1: Item Classification & General Details -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>📦 1. Item Classification & General Information</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(BRD §6, §7, §9)</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            
            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Item Code <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="new-item-code" class="form-control cell-mono" value="${defaultCode}" required style="text-transform: uppercase;" />
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Unique code within organization (Rule BR-001)</div>
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Item Name <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="new-item-name" class="form-control" placeholder="e.g. Front Disc Brake Pad Set" required />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Short Display Name</label>
              <input type="text" id="new-item-short-name" class="form-control" placeholder="e.g. Front Brake Pad" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Item Type <span style="color: var(--color-danger)">*</span></label>
              <select id="new-item-type" class="form-control" required>
                <option value="SPARE_PART">Spare Part</option>
                <option value="CONSUMABLE">Consumable</option>
                <option value="LUBRICANT">Lubricant</option>
                <option value="BATTERY">Battery</option>
                <option value="TYRE">Tyre / Tube</option>
                <option value="ACCESSORY">Accessory</option>
                <option value="WORKSHOP_MATERIAL">Workshop Material</option>
                <option value="TOOL">Tool</option>
                <option value="WARRANTY_PART">Warranty Part</option>
                <option value="SCRAP_PART">Scrap Item</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Category <span style="color: var(--color-danger)">*</span></label>
              <select id="new-item-category" class="form-control" required>
                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Brand</label>
              <input type="text" id="new-item-brand" class="form-control" placeholder="e.g. Honda Genuine, Castrol, NGK" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Manufacturer</label>
              <input type="text" id="new-item-mfg" class="form-control" placeholder="e.g. Honda Motor Co., Castrol India" />
            </div>

          </div>
        </div>

        <!-- Section 2: Part Numbers, Barcode & Identification -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>🏷️ 2. Part Identification & Tax Codes</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(BRD §11, §19, §20)</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Manufacturer Part #</label>
              <input type="text" id="new-item-part-no" class="form-control cell-mono" placeholder="e.g. 06455-KWP-D01" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">OEM Part #</label>
              <input type="text" id="new-item-oem-no" class="form-control cell-mono" placeholder="e.g. 06455-KWP-D01" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Barcode / EAN</label>
              <input type="text" id="new-item-barcode" class="form-control cell-mono" placeholder="e.g. 890123456001" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">HSN / SAC Code</label>
              <input type="text" id="new-item-hsn" class="form-control cell-mono" placeholder="e.g. 87141090" />
            </div>

          </div>
        </div>

        <!-- Section 3: Pricing & Cost -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>💰 3. Pricing & Taxation</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(BRD §18 & §19)</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">MRP (₹) <span style="color: var(--color-danger)">*</span></label>
              <input type="number" id="new-item-mrp" class="form-control" placeholder="0.00" min="0" step="0.5" required />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Workshop Sale Price (₹) <span style="color: var(--color-danger)">*</span></label>
              <input type="number" id="new-item-price" class="form-control" placeholder="0.00" min="0" step="0.5" required />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Last Purchase Price (₹)</label>
              <input type="number" id="new-item-cost" class="form-control" placeholder="0.00" min="0" step="0.5" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">GST Rate %</label>
              <select id="new-item-gst" class="form-control">
                ${(window.DB && typeof window.DB.renderTaxSelectOptions === 'function')
                  ? window.DB.renderTaxSelectOptions(0)
                  : '<option value="0" selected>0% GST</option>'}
              </select>
            </div>

          </div>
        </div>

        <!-- Section 4: UOM & Inventory Controls -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>📊 4. UOM, Stock Levels & Controls</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(BRD §13, §14, §21, §22)</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; align-items: end;">

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Stock UOM <span style="color: var(--color-danger)">*</span></label>
              <select id="new-item-uom" class="form-control" required>
                <option value="NOS">NOS (Single Unit)</option>
                <option value="SET">SET (Pair / Kit)</option>
                <option value="BTL">BTL (Bottle)</option>
                <option value="CAN">CAN (Canister)</option>
                <option value="LTR">LTR (Litre)</option>
                <option value="KG">KG (Kilogram)</option>
                <option value="MTR">MTR (Metre)</option>
                <option value="BOX">BOX (Pack)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Purchase UOM</label>
              <input type="text" id="new-item-purchase-uom" class="form-control" placeholder="e.g. BOX (10 Nos), CARTON" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Reorder Level (ROP)</label>
              <input type="number" id="new-item-rop" class="form-control" value="10" min="0" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Minimum Stock</label>
              <input type="number" id="new-item-min-stock" class="form-control" value="5" min="0" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Warranty (Months)</label>
              <input type="number" id="new-item-warranty-months" class="form-control" value="6" min="0" />
            </div>

            <div class="form-group" style="padding-bottom: 6px;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Inventory Controls</label>
              <div style="display: flex; gap: 14px; margin-top: 6px; font-size: 12px;">
                <label style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
                  <input type="checkbox" id="new-item-serial" /> Serial Track
                </label>
                <label style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
                  <input type="checkbox" id="new-item-batch" checked /> Batch Track
                </label>
                <label style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
                  <input type="checkbox" id="new-item-expiry" /> Has Expiry
                </label>
              </div>
            </div>

          </div>
        </div>

        <!-- Section 5: Vehicle Applicability (BRD §12) -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>🏍️ 5. Two-Wheeler Vehicle Compatibility</span>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(BRD §12)</span>
            </div>
            <span style="font-size: 11px; color: var(--text-muted);">Leave all unchecked if universal fitment across all vehicles</span>
          </div>
          <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; background: rgba(0, 0, 0, 0.15); display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            ${vehicleModels.map(m => `
              <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; padding: 4px 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.03);">
                <input type="checkbox" name="new-item-models" value="${m.id}" />
                <span>🏍️ <strong>${m.name}</strong> <span style="color: var(--text-muted); font-size: 11px;">(${m.variant || 'Standard'})</span></span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Modal Action Buttons (Fixed Bottom Bar) -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; padding-top: 14px; border-top: 1px solid var(--border-subtle); position: sticky; bottom: 0; background: var(--bg-modal, #111827); z-index: 5;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="padding: 8px 24px; font-weight: 600;">Register Item Master</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '📦 Register New Item (Item Master)',
      isFullScreen: true,
      maxWidth: '98vw',
      contentHtml,
      footerHtml: null
    });
  },

  submitAddItem() {
    const code = document.getElementById('new-item-code').value.trim().toUpperCase();
    const name = document.getElementById('new-item-name').value.trim();
    const shortName = document.getElementById('new-item-short-name').value.trim();
    const type = document.getElementById('new-item-type').value;
    const catId = document.getElementById('new-item-category').value;
    const brand = document.getElementById('new-item-brand').value.trim();
    const mfg = document.getElementById('new-item-mfg').value.trim();
    const partNo = document.getElementById('new-item-part-no').value.trim();
    const oemNo = document.getElementById('new-item-oem-no').value.trim();
    const uom = document.getElementById('new-item-uom').value;
    const purchaseUom = document.getElementById('new-item-purchase-uom').value.trim();
    const mrp = Number(document.getElementById('new-item-mrp').value) || 0;
    const price = Number(document.getElementById('new-item-price').value) || 0;
    const cost = Number(document.getElementById('new-item-cost').value) || 0;
    const gst = document.getElementById('new-item-gst').value !== '' ? Number(document.getElementById('new-item-gst').value) : 0;
    const hsn = document.getElementById('new-item-hsn').value.trim();
    const barcode = document.getElementById('new-item-barcode').value.trim();
    const rop = Number(document.getElementById('new-item-rop').value) || 0;
    const minStock = Number(document.getElementById('new-item-min-stock').value) || 0;
    const warrantyMonths = Number(document.getElementById('new-item-warranty-months').value) || 0;
    const isSerial = document.getElementById('new-item-serial').checked;
    const isBatch = document.getElementById('new-item-batch').checked;
    const hasExpiry = document.getElementById('new-item-expiry').checked;

    // Selected vehicle models
    const modelCheckboxes = document.querySelectorAll('input[name="new-item-models"]:checked');
    const selectedModelIds = Array.from(modelCheckboxes).map(cb => cb.value);

    // BR-001: Uniqueness check
    const allItems = window.DB.getAll('items') || [];
    if (allItems.some(i => (i.code || '').toLowerCase() === code.toLowerCase())) {
      window.State.showToast(`Item code "${code}" already exists. Item Code must be unique (Rule BR-001).`, 'error');
      return;
    }

    const newItem = {
      id: `ITEM-2W-${Date.now().toString(36).toUpperCase()}`,
      code: code,
      name: name,
      short_name: shortName || name,
      category_id: catId,
      item_type: type,
      brand: brand || 'OEM',
      manufacturer: mfg || 'Two-Wheeler OEM',
      part_number: partNo || code,
      oem_part_number: oemNo || partNo || code,
      base_uom: uom,
      stock_uom: uom,
      purchase_uom: purchaseUom || uom,
      issue_uom: uom,
      sale_uom: uom,
      standard_cost: cost,
      last_purchase_price: cost,
      mrp: mrp,
      sale_price: price,
      workshop_sale_price: price,
      counter_sale_price: mrp,
      gst_rate_pct: gst,
      hsn_code: hsn || '87141090',
      barcode: barcode || `890123456${String(Math.floor(100 + Math.random() * 900))}`,
      min_stock: minStock,
      max_stock: minStock * 10 || 100,
      reorder_level: rop,
      safety_stock: minStock,
      lead_time_days: 3,
      moq: 1,
      is_batch_controlled: isBatch,
      is_serial_controlled: isSerial,
      has_expiry: hasExpiry,
      warranty_applicable_yn: warrantyMonths > 0 ? 'Y' : 'N',
      warranty_period_months: warrantyMonths,
      status: 'Active',
      vehicle_model_ids: selectedModelIds
    };

    allItems.unshift(newItem);
    window.DB.saveData();
    window.DB.emitChange('items');

    // Also record compatibility mappings if models were selected
    if (selectedModelIds.length > 0) {
      const compatList = window.DB.getAll('itemVehicleCompatibility') || [];
      selectedModelIds.forEach(mid => {
        compatList.push({
          id: `IVC-${Date.now().toString(36).toUpperCase()}-${mid}`,
          item_id: newItem.id,
          model_id: mid,
          variant: 'Standard',
          year_from: 2020,
          year_to: 2026,
          notes: 'Configured in Item Master'
        });
      });
      window.DB.saveData();
      window.DB.emitChange('itemVehicleCompatibility');
    }

    window.State.closeModal();
    window.State.showToast(`Item "${newItem.name}" (${newItem.code}) registered successfully!`);
    this.render();
  },

  showEditItemModal(itemId) {
    if (window.ItemSetupModule && typeof window.ItemSetupModule.showItemModal === 'function') {
      window.ItemSetupModule.showItemModal(itemId);
      return;
    }
    const item = window.DB.getById('items', itemId);
    if (!item) return;

    const categories = window.DB.getAll('itemCategories') || [];
    const vehicleModels = window.DB.getAll('vehicleModels') || [];
    const itemModels = item.vehicle_model_ids || [];

    const contentHtml = `
      <form id="edit-item-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitEditItem('${itemId}');" style="display: flex; flex-direction: column; gap: 14px;">
        
        <!-- Section 1: Item Classification & General Details -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>📦 1. Item Classification & General Information</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(BRD §6, §7, §9)</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            
            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Item Code</label>
              <input type="text" class="form-control cell-mono" value="${item.code}" disabled />
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Item code is permanent once registered (Rule BR-001)</div>
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Item Name <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="edit-item-name" class="form-control" value="${item.name}" required />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Short Display Name</label>
              <input type="text" id="edit-item-short-name" class="form-control" value="${item.short_name || item.name}" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Item Type <span style="color: var(--color-danger)">*</span></label>
              <select id="edit-item-type" class="form-control" required>
                <option value="SPARE_PART" ${item.item_type === 'SPARE_PART' ? 'selected' : ''}>Spare Part</option>
                <option value="CONSUMABLE" ${item.item_type === 'CONSUMABLE' ? 'selected' : ''}>Consumable</option>
                <option value="LUBRICANT" ${item.item_type === 'LUBRICANT' ? 'selected' : ''}>Lubricant</option>
                <option value="BATTERY" ${item.item_type === 'BATTERY' ? 'selected' : ''}>Battery</option>
                <option value="TYRE" ${item.item_type === 'TYRE' ? 'selected' : ''}>Tyre / Tube</option>
                <option value="ACCESSORY" ${item.item_type === 'ACCESSORY' ? 'selected' : ''}>Accessory</option>
                <option value="WORKSHOP_MATERIAL" ${item.item_type === 'WORKSHOP_MATERIAL' ? 'selected' : ''}>Workshop Material</option>
                <option value="TOOL" ${item.item_type === 'TOOL' ? 'selected' : ''}>Tool</option>
                <option value="WARRANTY_PART" ${item.item_type === 'WARRANTY_PART' ? 'selected' : ''}>Warranty Part</option>
                <option value="SCRAP_PART" ${item.item_type === 'SCRAP_PART' ? 'selected' : ''}>Scrap Item</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Category <span style="color: var(--color-danger)">*</span></label>
              <select id="edit-item-category" class="form-control" required>
                ${categories.map(c => `<option value="${c.id}" ${item.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Brand</label>
              <input type="text" id="edit-item-brand" class="form-control" value="${item.brand || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Manufacturer</label>
              <input type="text" id="edit-item-mfg" class="form-control" value="${item.manufacturer || ''}" />
            </div>

          </div>
        </div>

        <!-- Section 2: Part Numbers, Barcode & Identification -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>🏷️ 2. Part Identification & Tax Codes</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(BRD §11, §19, §20)</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Manufacturer Part #</label>
              <input type="text" id="edit-item-part-no" class="form-control cell-mono" value="${item.part_number || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">OEM Part #</label>
              <input type="text" id="edit-item-oem-no" class="form-control cell-mono" value="${item.oem_part_number || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Barcode / EAN</label>
              <input type="text" id="edit-item-barcode" class="form-control cell-mono" value="${item.barcode || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">HSN / SAC Code</label>
              <input type="text" id="edit-item-hsn" class="form-control cell-mono" value="${item.hsn_code || ''}" />
            </div>

          </div>
        </div>

        <!-- Section 3: Pricing, Cost & Status -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>💰 3. Pricing, Taxation & Status</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(BRD §18, §19, §31)</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Status <span style="color: var(--color-danger)">*</span></label>
              <select id="edit-item-status" class="form-control">
                <option value="Active" ${item.status === 'Active' || !item.status ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                <option value="Blocked" ${item.status === 'Blocked' ? 'selected' : ''}>Blocked</option>
                <option value="Draft" ${item.status === 'Draft' ? 'selected' : ''}>Draft</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">MRP (₹) <span style="color: var(--color-danger)">*</span></label>
              <input type="number" id="edit-item-mrp" class="form-control" value="${item.mrp || item.sale_price || 0}" min="0" step="0.5" required />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Workshop Sale Price (₹) <span style="color: var(--color-danger)">*</span></label>
              <input type="number" id="edit-item-price" class="form-control" value="${item.workshop_sale_price || item.sale_price || 0}" min="0" step="0.5" required />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Last Purchase Price (₹)</label>
              <input type="number" id="edit-item-cost" class="form-control" value="${item.last_purchase_price || item.standard_cost || 0}" min="0" step="0.5" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">GST Rate %</label>
              <select id="edit-item-gst" class="form-control">
                ${(window.DB && typeof window.DB.renderTaxSelectOptions === 'function')
                  ? window.DB.renderTaxSelectOptions(item.gst_rate_pct !== undefined ? item.gst_rate_pct : 0)
                  : `<option value="${item.gst_rate_pct !== undefined ? item.gst_rate_pct : 0}" selected>${item.gst_rate_pct !== undefined ? item.gst_rate_pct : 0}% GST</option>`}
              </select>
            </div>

          </div>
        </div>

        <!-- Section 4: UOM & Inventory Controls -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>📊 4. UOM, Stock Levels & Controls</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(BRD §13, §14, §21, §22)</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; align-items: end;">

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Stock UOM <span style="color: var(--color-danger)">*</span></label>
              <select id="edit-item-uom" class="form-control" required>
                <option value="NOS" ${(item.stock_uom || item.base_uom) === 'NOS' ? 'selected' : ''}>NOS (Single Unit)</option>
                <option value="SET" ${(item.stock_uom || item.base_uom) === 'SET' ? 'selected' : ''}>SET (Pair / Kit)</option>
                <option value="BTL" ${(item.stock_uom || item.base_uom) === 'BTL' ? 'selected' : ''}>BTL (Bottle)</option>
                <option value="CAN" ${(item.stock_uom || item.base_uom) === 'CAN' ? 'selected' : ''}>CAN (Canister)</option>
                <option value="LTR" ${(item.stock_uom || item.base_uom) === 'LTR' ? 'selected' : ''}>LTR (Litre)</option>
                <option value="KG" ${(item.stock_uom || item.base_uom) === 'KG' ? 'selected' : ''}>KG (Kilogram)</option>
                <option value="MTR" ${(item.stock_uom || item.base_uom) === 'MTR' ? 'selected' : ''}>MTR (Metre)</option>
                <option value="BOX" ${(item.stock_uom || item.base_uom) === 'BOX' ? 'selected' : ''}>BOX (Pack)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Purchase UOM</label>
              <input type="text" id="edit-item-purchase-uom" class="form-control" value="${item.purchase_uom || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Reorder Level (ROP)</label>
              <input type="number" id="edit-item-rop" class="form-control" value="${item.reorder_level || 0}" min="0" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Minimum Stock</label>
              <input type="number" id="edit-item-min-stock" class="form-control" value="${item.min_stock || 0}" min="0" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Warranty (Months)</label>
              <input type="number" id="edit-item-warranty-months" class="form-control" value="${item.warranty_period_months !== undefined ? item.warranty_period_months : 6}" min="0" />
            </div>

            <div class="form-group" style="padding-bottom: 6px;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Inventory Controls</label>
              <div style="display: flex; gap: 14px; margin-top: 6px; font-size: 12px;">
                <label style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
                  <input type="checkbox" id="edit-item-serial" ${item.is_serial_controlled ? 'checked' : ''} /> Serial Track
                </label>
                <label style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
                  <input type="checkbox" id="edit-item-batch" ${item.is_batch_controlled ? 'checked' : ''} /> Batch Track
                </label>
                <label style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
                  <input type="checkbox" id="edit-item-expiry" ${item.has_expiry ? 'checked' : ''} /> Has Expiry
                </label>
              </div>
            </div>

          </div>
        </div>

        <!-- Section 5: Vehicle Applicability (BRD §12) -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>🏍️ 5. Two-Wheeler Vehicle Compatibility</span>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(BRD §12)</span>
            </div>
            <span style="font-size: 11px; color: var(--text-muted);">Leave all unchecked if universal fitment across all vehicles</span>
          </div>
          <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; background: rgba(0, 0, 0, 0.15); display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
            ${vehicleModels.map(m => `
              <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; padding: 4px 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.03);">
                <input type="checkbox" name="edit-item-models" value="${m.id}" ${itemModels.includes(m.id) ? 'checked' : ''} />
                <span>🏍️ <strong>${m.name}</strong> <span style="color: var(--text-muted); font-size: 11px;">(${m.variant || 'Standard'})</span></span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Modal Action Buttons (Fixed Bottom Bar) -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; padding-top: 14px; border-top: 1px solid var(--border-subtle); position: sticky; bottom: 0; background: var(--bg-modal, #111827); z-index: 5;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="padding: 8px 24px; font-weight: 600;">Update Item Master</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: `📦 Edit Item Master: ${item.name}`,
      isFullScreen: true,
      maxWidth: '98vw',
      contentHtml,
      footerHtml: null
    });
  },

  submitEditItem(itemId) {
    const item = window.DB.getById('items', itemId);
    if (!item) return;

    item.name = document.getElementById('edit-item-name').value.trim();
    item.short_name = document.getElementById('edit-item-short-name').value.trim() || item.name;
    item.item_type = document.getElementById('edit-item-type').value;
    item.category_id = document.getElementById('edit-item-category').value;
    item.brand = document.getElementById('edit-item-brand').value.trim();
    item.manufacturer = document.getElementById('edit-item-mfg').value.trim();
    item.part_number = document.getElementById('edit-item-part-no').value.trim();
    item.oem_part_number = document.getElementById('edit-item-oem-no').value.trim();
    const uom = document.getElementById('edit-item-uom').value;
    item.stock_uom = uom;
    item.base_uom = uom;
    item.purchase_uom = document.getElementById('edit-item-purchase-uom').value.trim() || uom;
    item.mrp = Number(document.getElementById('edit-item-mrp').value) || 0;
    const price = Number(document.getElementById('edit-item-price').value) || 0;
    item.sale_price = price;
    item.workshop_sale_price = price;
    item.counter_sale_price = item.mrp;
    const cost = Number(document.getElementById('edit-item-cost').value) || 0;
    item.standard_cost = cost;
    item.last_purchase_price = cost;
    item.gst_rate_pct = document.getElementById('edit-item-gst').value !== '' ? Number(document.getElementById('edit-item-gst').value) : 0;
    item.status = document.getElementById('edit-item-status').value;
    item.hsn_code = document.getElementById('edit-item-hsn').value.trim();
    item.barcode = document.getElementById('edit-item-barcode').value.trim();
    item.reorder_level = Number(document.getElementById('edit-item-rop').value) || 0;
    item.min_stock = Number(document.getElementById('edit-item-min-stock').value) || 0;
    const warrantyMonths = Number(document.getElementById('edit-item-warranty-months').value) || 0;
    item.warranty_applicable_yn = warrantyMonths > 0 ? 'Y' : 'N';
    item.warranty_period_months = warrantyMonths;
    item.is_serial_controlled = document.getElementById('edit-item-serial').checked;
    item.is_batch_controlled = document.getElementById('edit-item-batch').checked;
    item.has_expiry = document.getElementById('edit-item-expiry').checked;

    const modelCheckboxes = document.querySelectorAll('input[name="edit-item-models"]:checked');
    item.vehicle_model_ids = Array.from(modelCheckboxes).map(cb => cb.value);

    window.DB.saveData();
    window.DB.emitChange('items');
    window.State.closeModal();
    window.State.showToast(`Item "${item.name}" updated successfully!`);
    this.render();
  },

  // Modal: Visual Store Hierarchy Tree
  toggleHierarchyModal() {
    const allOrgs = window.DB.getAll('organizations') || [];
    const allCompanies = window.DB.getAll('companies') || [];
    const allPlants = window.DB.getAll('plants') || [];
    const stores = window.DB.getAll('warehouses') || [];

    // Dynamically resolve Root Organization
    let rootOrgName = 'Patil Auto Dynamics & Multi-Brand Service Network Ltd.';
    let rootOrgCode = 'Root Org';
    if (allOrgs.length > 0 && allOrgs[0].name) {
      rootOrgName = allOrgs[0].name;
      rootOrgCode = allOrgs[0].code || 'ORG-001';
    } else if (allCompanies.length > 0 && allCompanies[0].name) {
      rootOrgName = allCompanies[0].name;
      rootOrgCode = allCompanies[0].code || 'COMP-01';
    }

    // Dynamically resolve Branches / Plants
    let branches = allPlants.filter(p => p.is_active !== false && p.status !== 'Inactive');
    if (branches.length === 0) {
      branches = allPlants.slice();
    }
    if (branches.length === 0) {
      const uniquePlantIds = [...new Set(stores.map(s => s.plant_id).filter(Boolean))];
      branches = uniquePlantIds.map(pid => ({
        id: pid,
        code: pid,
        name: pid === 'PLANT-01' ? 'Mauli Service Center 1' : (pid === 'PLANT-02' ? 'Mauli Service Center 2' : `Branch (${pid})`),
        city: 'Pune'
      }));
    }
    if (branches.length === 0) {
      branches = [{ id: 'PLANT-01', code: 'BRANCH-01', name: 'Mauli Service Center 1', city: 'Pune' }];
    }

    // Ensure any plant referenced by existing stores is in branches
    stores.forEach(s => {
      if (s.plant_id && !branches.some(b => b.id === s.plant_id || b.code === s.plant_id)) {
        branches.push({
          id: s.plant_id,
          code: s.plant_id,
          name: s.plant_id === 'PLANT-01' ? 'Mauli Service Center 1' : (s.plant_id === 'PLANT-02' ? 'Mauli Service Center 2' : s.plant_id),
          city: 'Pune'
        });
      }
    });

    const treeHtml = `
      <div style="padding: 4px;">
        <div style="font-family: var(--font-mono); font-size: 12.5px; line-height: 1.7;">
          <div style="font-weight: 700; color: var(--primary-300);">🏢 ${rootOrgName} <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">(${rootOrgCode})</span></div>

          ${branches.map((branch, bIdx) => {
            const isLastBranch = bIdx === branches.length - 1;
            const branchStores = stores.filter(s => {
              if (!s.plant_id && bIdx === 0) return true;
              return s.plant_id === branch.id || s.plant_id === branch.code;
            });

            // Identify Main Stores (warehouse_type === 'MAIN_STORE' or stores without parent_store_id)
            const mainStores = branchStores.filter(s => 
              s.warehouse_type === 'MAIN_STORE' || 
              !s.parent_store_id || 
              s.parent_store_id === '' || 
              s.parent_store_id === 'None' ||
              s.parent_store_id === null
            );

            // Track displayed stores
            const displayedStoreIds = new Set();
            mainStores.forEach(m => displayedStoreIds.add(m.id));

            return `
              <div style="margin-left: 16px; margin-top: 6px;">
                <div style="color: var(--text-secondary);">
                  ${isLastBranch ? '└──' : '├──'} <strong style="color: var(--text-primary);">${branch.name}</strong> <span style="color: var(--text-muted); font-size: 11px;">(${branch.code || branch.id})</span>
                </div>

                ${branchStores.length === 0 ? `
                  <div style="margin-left: 22px; color: var(--text-muted); font-size: 11.5px; font-style: italic;">
                    └── (No stores configured)
                  </div>
                ` : `
                  ${mainStores.map(main => {
                    const subStores = branchStores.filter(s => 
                      s.id !== main.id && (
                        s.parent_store_id === main.id || 
                        s.parent_store_id === main.code || 
                        (main.name && s.parent_store_name === main.name)
                      )
                    );
                    subStores.forEach(s => displayedStoreIds.add(s.id));

                    return `
                      <div style="margin-left: 20px; margin-top: 4px;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                          <span style="color: var(--color-success); font-weight: 600;">🏬 ${main.name}</span>
                          <span style="color: var(--text-muted); font-size: 11px;">(${main.code || main.id})</span>
                          <span class="badge badge-success" style="font-size: 9px; padding: 1px 5px;">Main Store</span>
                          ${main.manager ? `<span style="font-size: 11.5px; color: var(--text-secondary);">&bull; Mgr: ${main.manager}</span>` : ''}
                        </div>

                        ${subStores.map((sub, idx) => {
                          const isLast = idx === subStores.length - 1;
                          return `
                            <div style="margin-left: 20px; margin-top: 2px; color: var(--text-primary); font-size: 12px;">
                              ${isLast ? '└──' : '├──'} 📦 <span style="font-weight: 500; color: var(--accent-300);">${sub.name}</span> <span style="color: var(--text-muted); font-size: 11px;">(${sub.code || sub.id})</span> &bull; Mgr: ${sub.manager || 'Unassigned'}
                            </div>
                          `;
                        }).join('')}
                      </div>
                    `;
                  }).join('')}

                  ${branchStores.filter(s => !displayedStoreIds.has(s.id)).map((standAlone, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    return `
                      <div style="margin-left: 20px; margin-top: 2px; color: var(--text-primary); font-size: 12px;">
                        ${isLast ? '└──' : '├──'} 📦 <span style="font-weight: 500; color: var(--accent-300);">${standAlone.name}</span> <span style="color: var(--text-muted); font-size: 11px;">(${standAlone.code || standAlone.id})</span> &bull; Mgr: ${standAlone.manager || 'Unassigned'}
                      </div>
                    `;
                  }).join('')}
                `}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    window.State.showModal({
      title: '🌳 Store Physical Hierarchy',
      maxWidth: '540px',
      contentHtml: treeHtml
    });
  },

  // Modal: 20 BRD Categories & Subcategories View (BRD Section 6.6 & 6.7)
  showCategoryMasterModal() {
    const categories = window.DB.getAll('itemCategories') || [];
    const subcategories = window.DB.getAll('itemSubcategories') || [];

    const contentHtml = `
      <div style="padding: 10px;">
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
          Standard 20 Two-Wheeler Item Categories & Subcategories defined in BRD Section 6.6 & 6.7.
        </div>

        <div style="max-height: 460px; overflow-y: auto;">
          <table class="data-table" style="font-size: 12px;">
            <thead>
              <tr>
                <th>Category Code & ID</th>
                <th>Category Name</th>
                <th>Configured Subcategories</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map(c => {
                const subs = subcategories.filter(s => s.category_id === c.id);
                return `
                  <tr>
                    <td>
                      <span class="cell-mono cell-strong" style="color: var(--primary-300);">${c.code || c.id}</span>
                    </td>
                    <td>
                      <div style="font-weight: 700; color: var(--text-primary);">${c.name}</div>
                    </td>
                    <td>
                      ${subs.length > 0 ? subs.map(s => `
                        <span class="badge badge-subtle" style="font-size: 10px; margin: 2px;">${s.name}</span>
                      `).join('') : '<span style="color: var(--text-muted); font-size: 11px;">Standard subcategory mapping</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 14px; text-align: right;">
          <button class="btn btn-secondary btn-sm" onclick="window.State.closeModal()">Close</button>
        </div>
      </div>
    `;

    window.State.showModal({
      title: '📑 Two-Wheeler Item Categories & Subcategories Master',
      maxWidth: '750px',
      contentHtml
    });
  },



  // Modal: Add Vehicle Compatibility Rule (BRD Section 6.9)
  showAddCompatibilityModal() {
    const manufacturers = window.DB.getAll('vehicleManufacturers') || [];
    const models = window.DB.getAll('vehicleModels') || [];
    const items = window.DB.getAll('items') || [];

    const contentHtml = `
      <form id="add-compat-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitCompatibility();">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Spare Part Item <span style="color: var(--color-danger)">*</span></label>
            <select id="compat-item-id" class="form-control" required>
              ${items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Vehicle Manufacturer <span style="color: var(--color-danger)">*</span></label>
            <select id="compat-mfg-id" class="form-control" required>
              ${manufacturers.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Vehicle Model & Variant <span style="color: var(--color-danger)">*</span></label>
            <select id="compat-model-id" class="form-control" required>
              ${models.map(m => `<option value="${m.id}">🏍️ ${m.name} (${m.variant})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">From Year <span style="color: var(--color-danger)">*</span></label>
            <input type="number" id="compat-year-from" class="form-control" value="2020" min="2000" max="2030" required />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">To Year <span style="color: var(--color-danger)">*</span></label>
            <input type="number" id="compat-year-to" class="form-control" value="2026" min="2000" max="2030" required />
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Fitment Specification / Notes</label>
            <input type="text" id="compat-notes" class="form-control" placeholder="e.g. Front 240mm disc fitment, plug gap 0.8mm" />
          </div>
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Vehicle Compatibility</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '🏍️ Map Item to Two-Wheeler Vehicle Model',
      maxWidth: '650px',
      contentHtml
    });
  },

  submitCompatibility() {
    const itemId = document.getElementById('compat-item-id').value;
    const mfgId = document.getElementById('compat-mfg-id').value;
    const modelId = document.getElementById('compat-model-id').value;
    const yearFrom = Number(document.getElementById('compat-year-from').value);
    const yearTo = Number(document.getElementById('compat-year-to').value);
    const notes = document.getElementById('compat-notes').value.trim();

    const compatibilities = window.DB.getAll('itemVehicleCompatibility') || [];
    compatibilities.push({
      id: `IVC-${Date.now().toString(36).toUpperCase()}`,
      item_id: itemId,
      manufacturer_id: mfgId,
      model_id: modelId,
      variant: 'Configured Variant',
      year_from: yearFrom,
      year_to: yearTo,
      notes: notes || 'OEM Direct Replacement'
    });

    window.DB.saveData();
    window.DB.emitChange('itemVehicleCompatibility');
    window.State.closeModal();
    window.State.showToast('Vehicle model compatibility rule recorded successfully!');
    this.render();
  },

  deleteCompatibility(ruleId) {
    let rules = window.DB.getAll('itemVehicleCompatibility') || [];
    rules = rules.filter(r => r.id !== ruleId);
    window.DB.data.itemVehicleCompatibility = rules;
    window.DB.saveData();
    window.DB.emitChange('itemVehicleCompatibility');
    window.State.showToast('Compatibility rule removed');
    this.render();
  },

  // Modal: Create Stock Transfer (BRD Section 6.18)
  showCreateStockTransferModal() {
    const stores = window.DB.getActiveWarehouses();
    const currentPlant = window.State.currentPlantId;
    const items = window.DB.getItemsForFacility(currentPlant) || [];
    const balances = window.DB.getAll('inventoryBalances') || [];

    const contentHtml = `
      <form id="create-transfer-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitStockTransfer();">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Source Store <span style="color: var(--color-danger)">*</span></label>
            <select id="trf-source-store" class="form-control" required>
              ${stores.map(s => `<option value="${s.id}">🏬 ${s.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Destination Store <span style="color: var(--color-danger)">*</span></label>
            <select id="trf-dest-store" class="form-control" required>
              ${stores.map(s => `<option value="${s.id}">➡️ ${s.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Item to Transfer <span style="color: var(--color-danger)">*</span></label>
            <select id="trf-item-id" class="form-control" required>
              ${items.map(i => {
                const b = balances.find(x => x.item_id === i.id || x.item_id === i.code);
                const stock = b ? (Number(b.available !== undefined ? b.available : (b.quantity_available !== undefined ? b.quantity_available : (b.quantity_on_hand !== undefined ? b.quantity_on_hand : b.on_hand))) || 0) : Number(i.current_stock || i.stock || 0);
                return `<option value="${i.id}">${i.code} - [Stock: ${stock}] ${i.name}</option>`;
              }).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Transfer Quantity <span style="color: var(--color-danger)">*</span></label>
            <input type="number" id="trf-qty" class="form-control" value="5" min="1" required />
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Cannot exceed available quantity (Rule BR-019)</div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Transfer Reason</label>
            <select id="trf-reason" class="form-control">
              <option value="Replenishment of Sub Store">Replenishment of Sub Store</option>
              <option value="Urgent Job Card Part Requirement">Urgent Job Card Part Requirement</option>
              <option value="Inter-Branch Balance Re-alignment">Inter-Branch Balance Re-alignment</option>
              <option value="Defective / Return Movement">Defective / Return Movement</option>
            </select>
          </div>
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Dispatch Transfer</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '🔄 Initiate Multi-Tier Stock Transfer',
      maxWidth: '650px',
      contentHtml
    });
  },

  submitStockTransfer() {
    const srcStoreId = document.getElementById('trf-source-store').value;
    const destStoreId = document.getElementById('trf-dest-store').value;
    const itemId = document.getElementById('trf-item-id').value;
    const qty = Number(document.getElementById('trf-qty').value);
    const reason = document.getElementById('trf-reason').value;

    if (srcStoreId === destStoreId) {
      window.State.showToast('Source and Destination stores cannot be identical.', 'error');
      return;
    }

    const stores = window.DB.getAll('warehouses') || [];
    const items = window.DB.getAll('items') || [];
    const srcStore = stores.find(s => s.id === srcStoreId) || {};
    const destStore = stores.find(s => s.id === destStoreId) || {};
    const item = items.find(i => i.id === itemId) || {};

    try {
      window.DB.createStockTransfer({
        source_store_id: srcStoreId,
        source_store_name: srcStore.name,
        dest_store_id: destStoreId,
        dest_store_name: destStore.name,
        item_id: itemId,
        item_code: item.code,
        item_name: item.name,
        qty: qty,
        reason: reason,
        approval_required: false
      });

      window.State.closeModal();
      window.State.showToast(`Transfer dispatched from ${srcStore.name} to ${destStore.name}!`);
      this.render();
    } catch (e) {
      window.State.showToast(e.message, 'error');
    }
  },

  // Modal: Return Unused Parts (BRD Section 6.15)
  showReturnPartsModal(jcId) {
    const jc = window.DB.getById('jobCards', jcId);
    if (!jc) return;
    const issuedParts = jc.parts_required.filter(p => (p.issued_qty || 0) > 0);

    if (issuedParts.length === 0) {
      window.State.showToast('No parts have been issued to this Job Card yet.', 'warning');
      return;
    }

    const contentHtml = `
      <form id="return-parts-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitReturnParts('${jcId}');">
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
          Select unused spare parts to return to Store stock. Returned quantity automatically increases available inventory (BRD §6.15 & Rule BR-020).
        </div>

        <div class="table-responsive" style="margin-bottom: 14px;">
          <table class="data-table" style="font-size: 12px;">
            <thead>
              <tr>
                <th>Issued Part</th>
                <th class="text-center">Issued Qty</th>
                <th class="text-center">Already Returned</th>
                <th class="text-center">Return Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${issuedParts.map(p => `
                <tr>
                  <td>
                    <div style="font-weight: 600;">${p.item_name}</div>
                    <div class="cell-mono" style="font-size: 10.5px; color: var(--text-muted);">${p.item_code}</div>
                  </td>
                  <td class="text-center cell-mono">${p.issued_qty}</td>
                  <td class="text-center cell-mono">${p.returned_qty || 0}</td>
                  <td class="text-center">
                    <input 
                      type="number" 
                      id="ret-qty-${p.item_id}" 
                      class="form-control form-control-sm cell-mono" 
                      style="width: 80px; text-align: center; margin: 0 auto;" 
                      value="${p.issued_qty}" 
                      min="0" 
                      max="${p.issued_qty}" 
                    />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Return Reason Code</label>
          <select id="ret-reason" class="form-control">
            <option value="Unused / Excess Parts from Job Card">Unused / Excess Parts from Job Card</option>
            <option value="Customer Declined Additional Work">Customer Declined Additional Work</option>
            <option value="Replaced by Alternative Variant">Replaced by Alternative Variant</option>
            <option value="Wrong Part Requisitioned">Wrong Part Requisitioned</option>
          </select>
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Process Parts Return</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: `📥 Return Unused Parts for ${jc.job_card_no} (${jc.vehicle_reg_no})`,
      maxWidth: '650px',
      contentHtml
    });
  },

  submitReturnParts(jcId) {
    const jc = window.DB.getById('jobCards', jcId);
    if (!jc) return;

    const returnItems = [];
    jc.parts_required.forEach(p => {
      const inp = document.getElementById(`ret-qty-${p.item_id}`);
      if (inp) {
        const val = Number(inp.value);
        if (val > 0) {
          returnItems.push({ item_id: p.item_id, qty: val });
        }
      }
    });

    if (returnItems.length === 0) {
      window.State.showToast('Please enter a return quantity greater than 0.', 'warning');
      return;
    }

    const reason = document.getElementById('ret-reason').value;
    try {
      window.DB.returnJobCardParts(jcId, returnItems, jc.store_id, null, reason);
      if (window.BillingModule && typeof window.BillingModule.syncJobCardPartsToEstimateAndBill === 'function') {
        window.BillingModule.syncJobCardPartsToEstimateAndBill(jcId);
      }
      window.State.closeModal();
      window.State.showToast('Unused parts successfully returned and restocked in Store!');
      if (window.BillingModule && typeof window.BillingModule.refresh === 'function') {
        window.BillingModule.selectedJobCardId = jcId;
        window.BillingModule.refresh();
      }
      if (typeof this.render === 'function') {
        this.render();
      }
    } catch (e) {
      window.State.showToast(e.message, 'error');
    }
  },

  // Modal: Start Physical Count Session (BRD Section 6.20)
  showStartCountSessionModal() {
    const stores = window.DB.getActiveWarehouses();

    const contentHtml = `
      <form id="start-count-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitStartCountSession();">
        <div class="form-group">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Select Store to Freeze & Count <span style="color: var(--color-danger)">*</span></label>
          <select id="count-store-id" class="form-control" required>
            ${stores.map(s => `<option value="${s.id}">🏬 ${s.name} (${s.code})</option>`).join('')}
          </select>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            Freezes real-time snapshot of system stock for accurate physical variance calculations.
          </div>
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Freeze Snapshot & Begin Count</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '📊 Freeze Snapshot for Physical Stock Count',
      maxWidth: '520px',
      contentHtml
    });
  },

  submitStartCountSession() {
    const storeId = document.getElementById('count-store-id').value;
    try {
      const session = window.DB.createStockCountSession(storeId);
      window.State.closeModal();
      window.State.showToast(`Stock snapshot frozen for session ${session.session_no}!`);
      this.render();
    } catch (e) {
      window.State.showToast(e.message, 'error');
    }
  },

  // Modal: Raise Warranty Claim (BRD Section 6.16)
  showRaiseWarrantyClaimModal() {
    const jobCards = (window.DB.getAll('jobCards') || []).filter(j => !j.store_id || window.DB.isWarehouseActive(j.store_id));
    const currentPlant = window.State.currentPlantId;
    const items = window.DB.getItemsForFacility(currentPlant) || [];
    const manufacturers = window.DB.getAll('vehicleManufacturers') || [];

    const contentHtml = `
      <form id="raise-warranty-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitRaiseWarrantyClaim();">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Job Card Reference <span style="color: var(--color-danger)">*</span></label>
            <select id="war-jc-id" class="form-control" required>
              ${jobCards.map(j => `<option value="${j.id}">${j.job_card_no} - ${j.vehicle_reg_no} (${j.customer_name})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">OEM Manufacturer <span style="color: var(--color-danger)">*</span></label>
            <select id="war-oem" class="form-control" required>
              ${manufacturers.map(m => `<option value="${m.name}">${m.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Defective Part Replaced <span style="color: var(--color-danger)">*</span></label>
            <select id="war-item-id" class="form-control" required>
              ${items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Claim Amount (₹) <span style="color: var(--color-danger)">*</span></label>
            <input type="number" id="war-amount" class="form-control" value="450" min="1" required />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Defect Batch #</label>
            <input type="text" id="war-batch" class="form-control cell-mono" value="LOT-WARR-26" />
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Diagnostic Failure Reason <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="war-reason" class="form-control" placeholder="e.g. Premature friction material failure under 1,500 km" required />
          </div>
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Submit OEM Warranty Claim</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '🛡️ Raise OEM Warranty Claim for Defective Part',
      maxWidth: '650px',
      contentHtml
    });
  },

  submitRaiseWarrantyClaim() {
    const jcId = document.getElementById('war-jc-id').value;
    const oem = document.getElementById('war-oem').value;
    const itemId = document.getElementById('war-item-id').value;
    const amount = Number(document.getElementById('war-amount').value);
    const batch = document.getElementById('war-batch').value;
    const reason = document.getElementById('war-reason').value;

    const jc = window.DB.getById('jobCards', jcId);
    const item = window.DB.getById('items', itemId);
    const claims = window.DB.getAll('warrantyClaims') || [];

    const newClaim = {
      id: `WAR-${Date.now().toString(36).toUpperCase()}`,
      claim_no: `CLM-OEM-26-${(claims.length + 1).toString().padStart(3, '0')}`,
      job_card_id: jcId,
      vehicle_reg_no: jc ? jc.vehicle_reg_no : 'MH-12',
      customer_name: jc ? jc.customer_name : 'Customer',
      store_id: 'WH-PUN-WARR',
      oem_manufacturer: oem,
      item_id: itemId,
      item_name: item ? item.name : 'Defective Part',
      batch_no: batch,
      qty: 1,
      claim_amount: amount,
      defect_reason: reason,
      claim_date: new Date().toISOString().split('T')[0],
      status: 'PENDING_INSPECTION',
      resolution: 'Awaiting OEM technical inspection report',
      settlement_date: null
    };

    claims.unshift(newClaim);
    window.DB.saveData();
    window.DB.emitChange('warrantyClaims');
    window.State.closeModal();
    window.State.showToast(`Warranty claim ${newClaim.claim_no} registered in Warranty Store!`);
    this.render();
  },

  // Modal: Record Scrap Disposal (BRD Section 6.17)
  showCreateScrapDisposalModal() {
    const contentHtml = `
      <form id="scrap-disposal-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitScrapDisposal();">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Scrap Material Description <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="scp-type" class="form-control" placeholder="e.g. Worn alloy wheel rims, bent fork stanchions" required />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Scrap Category <span style="color: var(--color-danger)">*</span></label>
            <select id="scp-category" class="form-control">
              <option value="Scrap Parts">Scrap Parts (Metals & Castings)</option>
              <option value="Rubber Parts Scrap">Rubber Parts (Tires & Belts)</option>
              <option value="Battery Acid Scrap">Lead Acid Battery Core</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Weight / Quantity (KG) <span style="color: var(--color-danger)">*</span></label>
            <input type="number" id="scp-qty" class="form-control" value="25" min="1" step="0.5" required />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Valuation Amount (₹) <span style="color: var(--color-danger)">*</span></label>
            <input type="number" id="scp-amount" class="form-control" value="625" min="1" required />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Gate Pass Number <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="scp-gatepass" class="form-control cell-mono" value="GP-SCRAP-8850" required />
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Authorized Recycler / Buyer <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="scp-buyer" class="form-control" value="Mahalaxmi Metal & Alloy Recyclers" required />
          </div>
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Authorize & Record Disposal</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '♻️ Record Scrap Disposal & Outward Gate Pass',
      maxWidth: '650px',
      contentHtml
    });
  },

  submitScrapDisposal() {
    const type = document.getElementById('scp-type').value;
    const category = document.getElementById('scp-category').value;
    const qty = Number(document.getElementById('scp-qty').value);
    const amount = Number(document.getElementById('scp-amount').value);
    const gatePass = document.getElementById('scp-gatepass').value;
    const buyer = document.getElementById('scp-buyer').value;

    const scraps = window.DB.getAll('scrapDisposals') || [];
    const newScrap = {
      id: `SCRAP-${Date.now().toString(36).toUpperCase()}`,
      disposal_no: `SCRAP-PUN-26-${(scraps.length + 1).toString().padStart(3, '0')}`,
      store_id: 'WH-PUN-SCRAP',
      scrap_type: type,
      item_id: 'ITEM-2W-015',
      category: category,
      qty_kg: qty,
      valuation_amount: amount,
      reason: 'Workshop salvage disposal',
      authorized_by: 'Branch Manager (Pravin Patil)',
      disposal_method: 'Authorized Scrap Recycler Sale',
      buyer_name: buyer,
      gate_pass_no: gatePass,
      disposal_date: new Date().toISOString().split('T')[0],
      status: 'DISPOSED'
    };

    scraps.unshift(newScrap);
    window.DB.saveData();
    window.DB.emitChange('scrapDisposals');
    window.State.closeModal();
    window.State.showToast(`Scrap disposal ${newScrap.disposal_no} posted with gate pass ${gatePass}!`);
    this.render();
  },

  // Modal: Create New Job Card (BRD Section 6.12)
  showCreateJobCardModal() {
    const models = window.DB.getAll('vehicleModels') || [];
    const stores = window.DB.getActiveWarehouses();
    const allUsers = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('users') || []) : [];
    const technicians = allUsers.filter(u => {
      const isTech = (u.user_type && String(u.user_type).toLowerCase() === 'technician') ||
                     (u.primary_role && (u.primary_role === 'ROLE-TECHNICIAN' || u.primary_role === 'TECHNICIAN')) ||
                     (u.designation && /\b(tech|technician)\b/i.test(u.designation) && !/technology/i.test(u.designation));
      const isActive = u.status === 'ACTIVE' || u.status === 'Active' || !u.status;
      return isTech && isActive;
    });
    const techOptions = technicians.length > 0 ? technicians : [
      { id: 'USR-108', full_name: 'Santosh Shinde', designation: 'Senior Workshop Technician' },
      { id: 'USR-109', full_name: 'Vikram Rathod', designation: 'Electrical Specialist Technician' },
      { id: 'USR-110', full_name: 'Ganesh Jadhav', designation: 'General Mechanic Technician' }
    ];

    const userFavIds = (window.State && typeof window.State.getUserFavouriteVehicleModelIds === 'function')
      ? window.State.getUserFavouriteVehicleModelIds()
      : (window.DB ? window.DB.getUserFavouriteVehicleModelIds() : []);
    const userFavSet = new Set(userFavIds);
    const sortedModels = [...models].sort((a, b) => {
      const aFav = userFavSet.has(a.id) ? 1 : 0;
      const bFav = userFavSet.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return (a.name || '').localeCompare(b.name || '');
    });

    const contentHtml = `
      <form id="create-jc-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitCreateJobCard();">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Vehicle Registration # <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="jc-veh-reg" class="form-control cell-mono" placeholder="e.g. MH 12 AB 1234" maxlength="14" style="text-transform: uppercase; font-weight: 600; letter-spacing: 0.8px;" oninput="window.BillingModule ? window.BillingModule.formatVehicleRegInput(this) : null" onblur="window.BillingModule ? window.BillingModule.formatVehicleRegBlur(this) : null" required />
            <div id="jc-veh-reg-feedback" style="font-size: 10.5px; margin-top: 3px; display: none;"></div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Two-Wheeler Model <span style="color: var(--color-danger)">*</span></label>
            <select id="jc-model-id" class="form-control" required>
              ${sortedModels.map(m => `<option value="${m.id}">${userFavSet.has(m.id) ? '⭐ ' : ''}${m.name} (${m.variant})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Customer Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="jc-cust-name" class="form-control" placeholder="Customer full name" style="text-transform: capitalize;" oninput="window.BillingModule ? window.BillingModule.formatCustomerNameInput(this) : null" onblur="window.BillingModule ? window.BillingModule.formatCustomerNameBlur(this) : null" onpaste="window.BillingModule ? window.BillingModule.formatCustomerNamePaste(event, this) : null" required />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Customer Mobile (10 Digits) <span style="color: var(--color-danger)">*</span></label>
            <input type="tel" id="jc-cust-mobile" class="form-control" placeholder="9822000000" maxlength="10" required />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Current Odometer (KM)</label>
            <input type="number" id="jc-odometer" class="form-control" value="15000" />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Fulfilling Spare Store <span style="color: var(--color-danger)">*</span></label>
            <select id="jc-store-id" class="form-control" required>
              ${stores.filter(s => s.warehouse_type !== 'SCRAP_STORE').map(s => `<option value="${s.id}">🏬 ${s.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Technician Assigned <span style="color: var(--color-danger)">*</span></label>
            <select id="jc-tech-id" class="form-control" required>
              ${techOptions.map(t => {
                const name = t.full_name || t.display_name || t.employee_name || t.username;
                return `<option value="${t.id}" data-name="${name}">🔧 ${name} (${t.designation || 'Technician'})</option>`;
              }).join('')}
            </select>
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Service Type / Scope</label>
            <input type="text" id="jc-service-type" class="form-control" value="Periodic General Service & Brake Checkup" required />
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Customer Complaints & Diagnosis</label>
            <textarea id="jc-diagnosis" class="form-control" rows="2" placeholder="Describe customer reported issues and initial workshop diagnosis"></textarea>
          </div>
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Generate Job Card</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '🔧 Create New Two-Wheeler Workshop Job Card',
      maxWidth: '680px',
      contentHtml
    });
  },

  submitCreateJobCard() {
    const rawReg = document.getElementById('jc-veh-reg').value.trim();
    const normalizedReg = (window.DB && typeof window.DB.normalizeVehicleReg === 'function')
      ? window.DB.normalizeVehicleReg(rawReg)
      : rawReg.toUpperCase().replace(/\s+/g, '');
    const displayReg = (window.DB && typeof window.DB.formatVehicleRegDisplay === 'function')
      ? window.DB.formatVehicleRegDisplay(normalizedReg)
      : ((window.BillingModule && typeof window.BillingModule.formatIndianVehicleNumber === 'function')
          ? window.BillingModule.formatIndianVehicleNumber(rawReg)
          : rawReg.toUpperCase());

    // Duplicate Active Vehicle Registration Check
    if (normalizedReg && window.DB && typeof window.DB.checkDuplicateActiveVehicle === 'function') {
      const dupRes = window.DB.checkDuplicateActiveVehicle(normalizedReg, { facilityId: 'PLANT-01' });
      if (dupRes.isDuplicate) {
        alert(`❌ Duplicate Vehicle Registration Blocked:\n\n${dupRes.message}`);
        return;
      }
    }

    // Vehicle cannot have an active Job Card with unfinalized bill
    if (normalizedReg && window.BillingModule && typeof window.BillingModule.getUnfinalizedJobCardForVehicle === 'function') {
      const activeJc = window.BillingModule.getUnfinalizedJobCardForVehicle(normalizedReg);
      if (activeJc) {
        alert(`🚫 Cannot Create Job Card:\n\nVehicle "${displayReg}" already has an active Job Card "${activeJc.job_card_no || activeJc.id}" (Status: ${(activeJc.status || '').replace(/_/g, ' ')}).\n\nA new Job Card can only be created once the final bill is generated and settled for the existing Job Card.`);
        return;
      }
    }

    const rawCustName = document.getElementById('jc-cust-name').value.trim();
    const custName = (window.BillingModule && typeof window.BillingModule.toTitleCase === 'function')
      ? window.BillingModule.toTitleCase(rawCustName)
      : rawCustName;
    const custMobile = document.getElementById('jc-cust-mobile').value.trim();
    const odo = Number(document.getElementById('jc-odometer').value);
    const storeId = document.getElementById('jc-store-id').value;
    const techElem = document.getElementById('jc-tech-id');
    const techId = techElem ? techElem.value : 'USR-108';
    const techOpt = techElem && techElem.selectedOptions ? techElem.selectedOptions[0] : null;
    const techName = techOpt ? (techOpt.getAttribute('data-name') || techOpt.text) : 'Santosh Shinde';
    const serviceType = document.getElementById('jc-service-type').value.trim();
    const diagnosis = document.getElementById('jc-diagnosis').value.trim() || 'General service';

    const models = window.DB.getAll('vehicleModels') || [];
    const model = models.find(m => m.id === modelId) || {};
    const jobCards = window.DB.getAll('jobCards') || [];

    // Ensure vehicle entity with separate unique internal Vehicle ID
    let vehicleId = `VEH-${Date.now().toString(36).toUpperCase()}`;
    if (window.DB && typeof window.DB.getOrCreateVehicle === 'function') {
      const vehEntity = window.DB.getOrCreateVehicle({
        vehicle_reg_no: normalizedReg,
        vehicle_reg_no_display: displayReg,
        customer_name: custName,
        customer_mobile: custMobile,
        model_id: modelId,
        model_name: model.name,
        model_variant: model.variant,
        odometer_km: odo,
        plant_id: 'PLANT-01'
      });
      if (vehEntity) vehicleId = vehEntity.vehicle_id || vehEntity.id;
    }

    const newJc = {
      id: `JC-${Date.now().toString(36).toUpperCase()}`,
      job_card_no: `JC-PUN-26-${(jobCards.length + 1).toString().padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      customer_name: custName,
      customer_mobile: custMobile,
      vehicle_id: vehicleId,
      vehicle_reg_no: normalizedReg,
      vehicle_reg_no_display: displayReg,
      vehicle_manufacturer: model.manufacturer_id === 'VM-01' ? 'Honda' : (model.manufacturer_id === 'VM-02' ? 'TVS' : 'Two-Wheeler'),
      vehicle_model_id: modelId,
      vehicle_model: model.name || 'Two-Wheeler',
      vehicle_variant: model.variant || 'Standard',
      vehicle_year: 2023,
      odometer_km: odo,
      technician_id: techId,
      technician_name: techName,
      store_id: storeId,
      service_type: serviceType,
      status: 'OPEN_DIAGNOSIS',
      diagnosis: diagnosis,
      parts_required: [
        { item_id: 'ITEM-2W-003', item_code: '2W-LUB-10W30-01', item_name: '4T 10W-30 Premium Engine Oil (1L)', qty: 1, reserved_qty: 0, issued_qty: 0, returned_qty: 0, unit_price: 395, status: 'PENDING', bin_id: 'BIN-PUN-B01' }
      ],
      created_at: new Date().toISOString()
    };

    jobCards.unshift(newJc);
    window.DB.saveData();
    window.DB.emitChange('jobCards');
    this.selectedJobCardId = newJc.id;
    window.State.closeModal();
    window.State.showToast(`Job Card ${newJc.job_card_no} generated successfully!`);
    this.render();
  },

  showAddPartsToJobCardModal(jcId) {
    const jc = window.DB.getById('jobCards', jcId);
    if (!jc) return;
    const jcPlantId = jc.plant_id || (jc.store_id && window.DB.getById('warehouses', jc.store_id)?.plant_id) || window.State.currentPlantId;
    const facilityItems = window.DB.getItemsForFacility ? (window.DB.getItemsForFacility(jcPlantId) || []) : [];
    const items = facilityItems.length > 0 ? facilityItems : (window.DB.getAll('items') || []);
    const compatibilities = window.DB.getAll('itemVehicleCompatibility') || [];
    const balances = window.DB.getAll('inventoryBalances') || [];

    // Helper to calculate live available and in-transit stock for an item
    const getStockDetails = (item) => {
      if (!item) return { available: 0, onHand: 0, reserved: 0, inTransit: 0, isInTransit: false, uom: 'NOS' };
      if (window.DB && typeof window.DB.getItemStockDetails === 'function') {
        return window.DB.getItemStockDetails({
          itemId: item.id,
          itemCode: item.code,
          warehouseId: jc.store_id,
          plantId: jcPlantId
        });
      }
      const directStock = Number(item.available_stock !== undefined ? item.available_stock : (item.current_stock !== undefined ? item.current_stock : (item.stock || 0))) || 0;
      const directTransit = Number(item.in_transit || item.transit_stock || 0) || 0;
      return {
        available: directStock,
        onHand: directStock,
        reserved: 0,
        inTransit: directTransit,
        isInTransit: directStock <= 0 && directTransit > 0,
        uom: item.stock_uom || item.base_uom || 'NOS'
      };
    };

    const formatPartOption = (i, isCompatible = false) => {
      const details = getStockDetails(i);
      const price = i.sale_price || 200;
      const uom = details.uom || i.stock_uom || i.base_uom || 'NOS';
      let stockTag = `[Stock: ${details.available}]`;
      if (details.available <= 0 && details.inTransit > 0) {
        stockTag = `[Stock is in transit: ${details.inTransit}]`;
      } else if (details.available <= 0) {
        stockTag = `[Stock: 0]`;
      }
      const prefix = isCompatible ? '✓ ' : '';
      const label = `${prefix}${i.code} - ${stockTag} ${i.name} (₹${price})`;
      return {
        label,
        stock: details.available,
        inTransit: details.inTransit,
        price,
        uom
      };
    };

    // Filter compatible parts for this bike model
    const compatibleItemIds = compatibilities
      .filter(c => c.model_id === jc.vehicle_model_id)
      .map(c => c.item_id);

    const compatibleItems = items.filter(i => compatibleItemIds.includes(i.id));
    const otherItems = items.filter(i => !compatibleItemIds.includes(i.id));
    const allItemsList = [...compatibleItems, ...otherItems];
    const firstItem = allItemsList[0] || null;
    const firstInfo = firstItem ? formatPartOption(firstItem, compatibleItems.includes(firstItem)) : null;
    const firstLabel = firstInfo ? firstInfo.label : '';
    this._selectedPartLabel = firstLabel;

    const contentHtml = `
      <form id="add-part-to-jc-form" onsubmit="event.preventDefault(); window.StoreInventoryModule.submitAddPartToJobCard('${jcId}');">
        <div class="form-group" style="position: relative;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Select Spare Part Item <span style="color: var(--color-danger)">*</span></label>
          
          <!-- Backing select for form submission, tests and events -->
          <select id="add-jc-part-id" style="display: none;" onchange="window.StoreInventoryModule.onAddPartSelectChange(this)" required>
            <optgroup label="⭐ Compatible Parts for ${jc.vehicle_model}">
              ${compatibleItems.map(i => {
                const info = formatPartOption(i, true);
                return `<option value="${i.id}" data-stock="${info.stock}" data-transit="${info.inTransit}" data-price="${info.price}" data-uom="${info.uom}">${info.label}</option>`;
              }).join('')}
            </optgroup>
            <optgroup label="All Workshop Parts">
              ${otherItems.map(i => {
                const info = formatPartOption(i, false);
                return `<option value="${i.id}" data-stock="${info.stock}" data-transit="${info.inTransit}" data-price="${info.price}" data-uom="${info.uom}">${info.label}</option>`;
              }).join('')}
            </optgroup>
          </select>

          <!-- Type-to-Search Input Container -->
          <div style="position: relative; display: flex; align-items: center;">
            <input 
              type="text" 
              id="add-jc-part-search" 
              class="form-control" 
              placeholder="Search spare part item by code or name..." 
              autocomplete="off" 
              value="${firstLabel.replace(/"/g, '&quot;')}"
              style="padding-right: 32px; font-size: 12px; cursor: text;"
              oninput="window.StoreInventoryModule.filterAddPartDropdown(this.value)"
              onfocus="this.select(); window.StoreInventoryModule.openAddPartDropdown();"
              onclick="window.StoreInventoryModule.openAddPartDropdown();"
            />
            <span 
              id="add-jc-dropdown-arrow" 
              onclick="window.StoreInventoryModule.toggleAddPartDropdown()" 
              style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-muted); font-size: 10px; padding: 4px 6px; user-select: none;"
            >▼</span>
          </div>

          <!-- Searchable Custom Dropdown List matching exact UI and options -->
          <div 
            id="add-jc-part-dropdown" 
            style="display: none; position: absolute; top: calc(100% + 2px); left: 0; right: 0; max-height: 260px; overflow-y: auto; background: var(--bg-surface, #1e293b); border: 1px solid var(--border-color, #334155); border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.35); z-index: 1050; font-size: 12px;"
          >
            ${compatibleItems.length > 0 ? `
              <div class="part-group-header" data-group="compatible" style="padding: 7px 12px; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.08); border-bottom: 1px solid var(--border-subtle, #334155); font-size: 11.5px;">
                ⭐ Compatible Parts for ${jc.vehicle_model}
              </div>
              ${compatibleItems.map(i => {
                const info = formatPartOption(i, true);
                return `
                  <div 
                    class="part-item-option" 
                    data-group="compatible"
                    data-id="${i.id}" 
                    data-code="${i.code.toLowerCase()}" 
                    data-name="${i.name.toLowerCase()}" 
                    data-label="${info.label.replace(/"/g, '&quot;')}"
                    data-stock="${info.stock}"
                    data-transit="${info.inTransit}"
                    data-price="${info.price}"
                    data-uom="${info.uom}"
                    onclick="window.StoreInventoryModule.selectAddPartItem('${i.id}')"
                    style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.05)); color: var(--text-primary); transition: background 0.15s ease;"
                    onmouseenter="this.style.background='var(--primary-600, #3b82f6)'; this.style.color='#ffffff';"
                    onmouseleave="this.style.background=''; this.style.color='var(--text-primary)';"
                  >
                    ${info.label}
                  </div>
                `;
              }).join('')}
            ` : ''}

            <div class="part-group-header" data-group="workshop" style="padding: 7px 12px; font-weight: 700; color: var(--text-primary); background: rgba(255, 255, 255, 0.04); border-bottom: 1px solid var(--border-subtle, #334155); font-size: 11.5px;">
              All Workshop Parts
            </div>
            ${otherItems.map(i => {
              const info = formatPartOption(i, false);
              return `
                <div 
                  class="part-item-option" 
                  data-group="workshop"
                  data-id="${i.id}" 
                  data-code="${i.code.toLowerCase()}" 
                  data-name="${i.name.toLowerCase()}" 
                  data-label="${info.label.replace(/"/g, '&quot;')}"
                  data-stock="${info.stock}"
                  data-transit="${info.inTransit}"
                  data-price="${info.price}"
                  data-uom="${info.uom}"
                  onclick="window.StoreInventoryModule.selectAddPartItem('${i.id}')"
                  style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.05)); color: var(--text-primary); transition: background 0.15s ease;"
                  onmouseenter="this.style.background='var(--primary-600, #3b82f6)'; this.style.color='#ffffff';"
                  onmouseleave="this.style.background=''; this.style.color='var(--text-primary)';"
                >
                  ${info.label}
                </div>
              `;
            }).join('')}

            <div id="add-jc-no-results" style="display: none; padding: 16px; text-align: center; color: var(--text-muted); font-size: 11.5px;">
              No spare parts found matching search.
            </div>
          </div>

          <!-- Live Stock & Price Status Indicator -->
          <div id="add-jc-stock-indicator" style="margin-top: 6px; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 11.5px; display: flex; align-items: center; justify-content: space-between; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25);">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span id="add-jc-stock-icon" style="font-size: 13px;">📦</span>
              <span>Available Store Stock: <strong id="add-jc-selected-stock" class="cell-mono" style="color: #34d399; font-size: 12px;">--</strong></span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              Unit Price: <strong id="add-jc-selected-price" style="color: var(--text-primary);">--</strong>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Quantity Required <span style="color: var(--color-danger)">*</span></label>
          <input type="number" id="add-jc-part-qty" class="form-control" value="1" min="1" max="50" required />
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Part to Job Card</button>
        </div>
      </form>
    `;

    window.State.showModal({
      title: `🔧 Add Spare Part to Job Card ${jc.job_card_no}`,
      maxWidth: '600px',
      contentHtml
    });

    setTimeout(() => {
      const sel = document.getElementById('add-jc-part-id');
      if (sel && typeof this.onAddPartSelectChange === 'function') {
        this.onAddPartSelectChange(sel);
      }
      
      // Outside click listener to close dropdown
      const outsideClick = (e) => {
        const form = document.getElementById('add-part-to-jc-form');
        if (!form) {
          document.removeEventListener('click', outsideClick);
          return;
        }
        const dd = document.getElementById('add-jc-part-dropdown');
        const input = document.getElementById('add-jc-part-search');
        const arrow = document.getElementById('add-jc-dropdown-arrow');
        if (dd && dd.style.display === 'block') {
          if (!dd.contains(e.target) && e.target !== input && e.target !== arrow) {
            dd.style.display = 'none';
          }
        }
      };
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('click', outsideClick);
      }
    }, 40);
  },

  openAddPartDropdown() {
    const dd = document.getElementById('add-jc-part-dropdown');
    if (dd) {
      dd.style.display = 'block';
      const searchInput = document.getElementById('add-jc-part-search');
      if (searchInput && this._selectedPartLabel && searchInput.value === this._selectedPartLabel) {
        this.filterAddPartDropdown('');
      }
    }
  },

  closeAddPartDropdown() {
    const dd = document.getElementById('add-jc-part-dropdown');
    if (dd) dd.style.display = 'none';
  },

  toggleAddPartDropdown() {
    const dd = document.getElementById('add-jc-part-dropdown');
    if (dd && dd.style.display === 'block') {
      this.closeAddPartDropdown();
    } else {
      const searchInput = document.getElementById('add-jc-part-search');
      if (searchInput) searchInput.focus();
      this.openAddPartDropdown();
    }
  },

  filterAddPartDropdown(query) {
    const dd = document.getElementById('add-jc-part-dropdown');
    if (dd) dd.style.display = 'block';
    const q = (query || '').toLowerCase().trim();
    const options = document.querySelectorAll('.part-item-option');
    let visibleCount = 0;
    let compVisible = 0;
    let wkVisible = 0;

    options.forEach(opt => {
      const text = (opt.textContent || '').toLowerCase();
      const code = opt.getAttribute('data-code') || '';
      const name = opt.getAttribute('data-name') || '';
      const matches = !q || text.includes(q) || code.includes(q) || name.includes(q);
      if (matches) {
        opt.style.display = 'block';
        visibleCount++;
        if (opt.getAttribute('data-group') === 'compatible') compVisible++;
        else wkVisible++;
      } else {
        opt.style.display = 'none';
      }
    });

    const compHeader = document.querySelector('.part-group-header[data-group="compatible"]');
    if (compHeader) compHeader.style.display = compVisible > 0 ? 'block' : 'none';

    const wkHeader = document.querySelector('.part-group-header[data-group="workshop"]');
    if (wkHeader) wkHeader.style.display = wkVisible > 0 ? 'block' : 'none';

    const noRes = document.getElementById('add-jc-no-results');
    if (noRes) noRes.style.display = visibleCount === 0 ? 'block' : 'none';
  },

  selectAddPartItem(itemId) {
    const sel = document.getElementById('add-jc-part-id');
    if (sel) {
      sel.value = itemId;
      if (sel.options) {
        for (let i = 0; i < sel.options.length; i++) {
          if (sel.options[i].value === itemId) {
            sel.selectedIndex = i;
            break;
          }
        }
      }
      if (typeof this.onAddPartSelectChange === 'function') {
        this.onAddPartSelectChange(sel);
      }
    }
    const optEl = (typeof document !== 'undefined' && typeof document.querySelector === 'function')
      ? document.querySelector(`.part-item-option[data-id="${itemId}"]`)
      : null;
    const searchInput = document.getElementById('add-jc-part-search');
    if (searchInput) {
      if (optEl) {
        const label = optEl.getAttribute('data-label') || optEl.textContent.trim();
        searchInput.value = label;
        this._selectedPartLabel = label;
      } else if (window.DB && typeof window.DB.getById === 'function') {
        const itm = window.DB.getById('items', itemId);
        if (itm) {
          const lbl = `${itm.code} - ${itm.name}`;
          searchInput.value = lbl;
          this._selectedPartLabel = lbl;
        }
      }
    }
    this.closeAddPartDropdown();
  },

  onAddPartSelectChange(selectEl) {
    if (!selectEl) return;
    const opt = selectEl.selectedOptions && selectEl.selectedOptions[0];
    let stock = 0;
    let transit = 0;
    let price = '0';
    let uom = 'NOS';

    if (opt) {
      stock = Number(opt.getAttribute('data-stock') || 0);
      transit = Number(opt.getAttribute('data-transit') || 0);
      price = opt.getAttribute('data-price') || '0';
      uom = opt.getAttribute('data-uom') || 'NOS';
    } else if (selectEl.value && window.DB && typeof window.DB.getItemStockDetails === 'function') {
      const details = window.DB.getItemStockDetails({ itemId: selectEl.value });
      stock = details.available;
      transit = details.inTransit;
      uom = details.uom;
      const item = window.DB.getById('items', selectEl.value);
      if (item) price = String(item.sale_price || 200);
    } else if (selectEl.value && window.DB && typeof window.DB.getById === 'function') {
      const item = window.DB.getById('items', selectEl.value);
      if (item) {
        price = String(item.sale_price || 200);
        uom = item.stock_uom || item.base_uom || 'NOS';
      }
    }

    const indicator = document.getElementById('add-jc-stock-indicator');
    const iconEl = document.getElementById('add-jc-stock-icon');
    const stockEl = document.getElementById('add-jc-selected-stock');
    const priceEl = document.getElementById('add-jc-selected-price');
    const submitBtn = document.querySelector('#add-part-to-jc-form button[type="submit"]');

    if (stockEl) {
      if (stock > 0 && transit > 0) {
        stockEl.innerHTML = `<span style="color: #34d399; font-weight: 700;">${stock} ${uom}</span> (Available in Stock) • <span style="color: #f59e0b; font-weight: 600;">🚚 ${transit} ${uom} in transit</span>`;
      } else if (stock > 0) {
        stockEl.innerHTML = `<span style="color: #34d399; font-weight: 700;">${stock} ${uom}</span> (Available in Stock)`;
      } else if (transit > 0) {
        stockEl.innerHTML = `<span style="color: #f59e0b; font-weight: 700; font-size: 12px;">Stock is in transit</span> <span style="color: #fbbf24; font-size: 11px;">(${transit} ${uom} pending inward receipt)</span>`;
      } else {
        stockEl.innerHTML = `<span style="color: var(--color-danger); font-weight: 700;">0 ${uom}</span> (Out of Stock)`;
      }
    }
    if (priceEl) {
      priceEl.innerText = `₹${price}`;
    }
    if (indicator) {
      if (stock > 0) {
        indicator.style.background = 'rgba(16, 185, 129, 0.08)';
        indicator.style.borderColor = 'rgba(16, 185, 129, 0.25)';
        if (iconEl) iconEl.innerText = '📦';
      } else if (transit > 0) {
        indicator.style.background = 'rgba(245, 158, 11, 0.12)';
        indicator.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        if (iconEl) iconEl.innerText = '🚚';
      } else {
        indicator.style.background = 'rgba(239, 68, 68, 0.08)';
        indicator.style.borderColor = 'rgba(239, 68, 68, 0.25)';
        if (iconEl) iconEl.innerText = '📦';
      }
    }

    const qtyInput = document.getElementById('add-jc-part-qty');
    if (qtyInput) {
      qtyInput.max = Math.max(1, stock);
      if (stock <= 0) {
        qtyInput.value = '0';
      } else if (Number(qtyInput.value) > stock) {
        qtyInput.value = String(stock);
      } else if (Number(qtyInput.value) <= 0) {
        qtyInput.value = '1';
      }
    }

    if (submitBtn) {
      if (stock <= 0 && transit > 0) {
        submitBtn.title = 'Stock is in transit and not yet received in store';
      } else if (stock <= 0) {
        submitBtn.title = 'Item is out of stock';
      } else {
        submitBtn.title = '';
      }
    }
  },

  submitAddPartToJobCard(jcId) {
    const jc = window.DB.getById('jobCards', jcId);
    if (!jc) return;

    const itemId = document.getElementById('add-jc-part-id').value;
    const qty = Number(document.getElementById('add-jc-part-qty').value);
    const item = window.DB.getById('items', itemId);

    if (!Array.isArray(jc.parts_required)) jc.parts_required = [];

    const targetItemCode = (item && item.code) ? item.code.trim().toLowerCase() : (itemId || '').trim().toLowerCase();
    const existingIndex = jc.parts_required.findIndex(p => {
      const pItemId = (p.item_id || '').toString().trim();
      const pCode = (p.item_code || p.code || '').toString().trim().toLowerCase();
      return pItemId === itemId || (targetItemCode && pCode === targetItemCode);
    });

    if (existingIndex !== -1) {
      const existingPart = jc.parts_required[existingIndex];
      const isPartActive = existingPart.status !== 'CANCELLED' && 
                           existingPart.status !== 'RETURNED' && 
                           !existingPart.cancelled && 
                           Number(existingPart.qty) > 0;
      if (isPartActive) {
        window.State.showToast('Part is already added to this Job Card with active status.', 'warning');
        return;
      }
    }

    const jcPlantId = jc.plant_id || (jc.store_id && window.DB.getById('warehouses', jc.store_id)?.plant_id) || window.State.currentPlantId;
    const stockDetails = (window.DB && typeof window.DB.getItemStockDetails === 'function')
      ? window.DB.getItemStockDetails({
          itemId: itemId,
          itemCode: item ? item.code : itemId,
          warehouseId: jc.store_id,
          plantId: jcPlantId
        })
      : { available: (item ? Number(item.current_stock || item.stock || 0) : 0), inTransit: 0, uom: 'NOS' };

    const availStock = stockDetails.available;
    const inTransitStock = stockDetails.inTransit;
    const uom = stockDetails.uom || (item && (item.stock_uom || item.base_uom)) || 'NOS';
    const itemName = item ? item.name : itemId;

    if (availStock <= 0) {
      if (inTransitStock > 0) {
        window.State.showToast(`Cannot add "${itemName}". Stock is in transit (${inTransitStock} ${uom}) and not yet received in store!`, 'warning');
      } else {
        window.State.showToast(`Cannot add "${itemName}". Available stock is 0!`, 'danger');
      }
      return;
    }
    if (qty > availStock) {
      const transitMsg = inTransitStock > 0 ? ` (${inTransitStock} ${uom} in transit)` : '';
      window.State.showToast(`Cannot add ${qty} units. Only ${availStock} available in stock!${transitMsg}`, 'warning');
      return;
    }

    if (existingIndex !== -1) {
      const existingPart = jc.parts_required[existingIndex];
      existingPart.item_id = itemId;
      existingPart.item_code = item ? item.code : (existingPart.item_code || itemId);
      existingPart.item_name = item ? item.name : (existingPart.item_name || itemId);
      existingPart.qty = qty;
      existingPart.reserved_qty = 0;
      existingPart.issued_qty = 0;
      existingPart.returned_qty = 0;
      existingPart.unit_price = item ? (item.sale_price || 250) : (existingPart.unit_price || 250);
      existingPart.status = 'PENDING';
      existingPart.cancelled = false;
      existingPart.stock_deducted = true;
      existingPart.bin_id = existingPart.bin_id || 'BIN-PUN-A01';
    } else {
      jc.parts_required.push({
        item_id: itemId,
        item_code: item ? item.code : itemId,
        item_name: item ? item.name : itemId,
        qty: qty,
        reserved_qty: 0,
        issued_qty: 0,
        returned_qty: 0,
        unit_price: item ? (item.sale_price || 250) : 250,
        status: 'PENDING',
        bin_id: 'BIN-PUN-A01',
        stock_deducted: true
      });
    }

    // Deduct stock from inventory balance & database
    if (window.DB && typeof window.DB.deductItemStock === 'function') {
      window.DB.deductItemStock({
        itemId: itemId,
        itemCode: item ? item.code : itemId,
        qty: qty,
        warehouseId: jc.store_id,
        plantId: jc.plant_id,
        docType: 'Job Card',
        docNo: jc.job_card_no,
        docId: jc.id
      });
    }

    window.DB.saveData();
    window.DB.emitChange('jobCards');

    // Automatically synchronize newly added parts to linked Estimate and Draft Bill
    if (window.BillingModule && typeof window.BillingModule.syncJobCardPartsToEstimateAndBill === 'function') {
      window.BillingModule.syncJobCardPartsToEstimateAndBill(jcId);
    }

    window.State.closeModal();
    window.State.showToast(`Added ${qty}x ${item ? item.name : 'part'} to Job Card!`, 'success');

    // Ensure system is redirected to Job Card screen only
    if (window.BillingModule) {
      window.BillingModule.activeTab = 'JOB_CARDS';
      window.BillingModule.jobCardSubView = 'REGISTER';
      window.BillingModule.selectedJobCardId = jcId;
    }
    if (typeof window !== 'undefined' && window.location) {
      if (window.location.hash !== '#/job-cards') {
        window.location.hash = '#/job-cards';
      } else {
        if (window.BillingModule && typeof window.BillingModule.refresh === 'function') {
          window.BillingModule.refresh();
        }
      }
    }
    if (window.BillingModule && typeof window.BillingModule.viewJobCard === 'function') {
      setTimeout(() => {
        window.BillingModule.viewJobCard(jcId);
      }, 80);
    }
  },

  removeJobCardPart(jcId, itemIdOrCode) {
    const jc = window.DB.getById('jobCards', jcId);
    if (!jc || !Array.isArray(jc.parts_required)) return;

    const idx = jc.parts_required.findIndex(p => 
      p.item_id === itemIdOrCode || 
      p.item_code === itemIdOrCode || 
      (p.item_id && String(p.item_id) === String(itemIdOrCode))
    );
    if (idx === -1) return;

    const removedPart = jc.parts_required[idx];
    
    // If pending and stock was deducted, restock
    if (removedPart.status === 'PENDING' && removedPart.stock_deducted && Number(removedPart.qty) > 0) {
      if (window.DB && typeof window.DB.restockItemStock === 'function') {
        window.DB.restockItemStock({
          itemId: removedPart.item_id,
          itemCode: removedPart.item_code,
          qty: Number(removedPart.qty),
          warehouseId: jc.store_id,
          plantId: jc.plant_id,
          docType: 'Job Card Removal',
          docNo: jc.job_card_no,
          docId: jc.id
        });
      }
    }

    jc.parts_required.splice(idx, 1);
    window.DB.upsert('jobCards', jc);
    window.DB.saveData();
    window.DB.emitChange('jobCards');

    // Sync to Estimate & Bill
    if (window.BillingModule && typeof window.BillingModule.syncJobCardPartsToEstimateAndBill === 'function') {
      window.BillingModule.syncJobCardPartsToEstimateAndBill(jcId);
    }

    if (window.State && window.State.showToast) {
      window.State.showToast(`Removed "${removedPart.item_name || removedPart.item_code}" from Job Card.`, 'info');
    }

    if (window.BillingModule && typeof window.BillingModule.viewJobCard === 'function') {
      window.BillingModule.viewJobCard(jcId);
    }
  }
};

// Global dismiss for facility dropdowns when clicking outside
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('click', (e) => {
    const panels = document.querySelectorAll('.facility-dropdown-panel');
    panels.forEach(p => {
      if (p.style.display !== 'none') {
        const btn = p.parentElement ? p.parentElement.querySelector('button') : null;
        if (p.contains(e.target) || (btn && btn.contains(e.target))) {
          return;
        }
        p.style.display = 'none';
      }
    });
  });
}

