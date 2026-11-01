/* ==========================================================================
   ENTERPRISE ISCM - ORGANIZATION & FACILITY SETUP SUITE
   Hierarchy Root & Physical Storage Structure:
   Organization
       ↓
   Facility Master (Plants / Workshops / Facilities)
       ↓
   Store Master (Warehouses / Parts Stores)
       ↓
   Storage Structure:
       ├── Storage Location Master (Zones / Docks / Staging)
       ├── Rack Master (Storage Racks / Cantilevers)
       ├── Shelf Master (Tier Levels)
       └── Bin Master (Granular Storage Bins)
   ========================================================================== */

window.OrgLocationModule = {
  activeTab: 'ORGANIZATIONS', // ORGANIZATIONS | BRANCHES | STORES | LOCATIONS | RACKS | SHELVES | BINS
  searchTerm: '',
  statusFilter: 'ALL',
  parentFilter: 'ALL',

  tabConfig: [
    { key: 'ORGANIZATIONS', perm: 'ORG_MASTER', label: 'Organization Master' },
    { key: 'BRANCHES', perm: 'BRANCH_MASTER', label: 'Facility Master' },
    { key: 'DOC_PRINT_CONFIG', perm: 'DOC_PRINT_CONFIG_MASTER', label: 'Document Print Configuration Master' },
    { key: 'FINANCIAL_CALENDAR', perm: 'FINANCIAL_CALENDAR_MASTER', label: 'Financial Calendar Master' },
    { key: 'DOC_SERIES', perm: 'DOC_SERIES_MASTER', label: 'Document Number Series Master' },
    { key: 'HOLIDAYS', perm: 'HOLIDAY_MASTER', label: 'Holiday Master' },
    { key: 'REGISTRATION_CONFIG', perm: 'CONFIG_REGISTRATION', label: 'Registration Configuration' }
  ],

  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    // Ensure page top bar is hidden so list of masters sits on top and eliminates duplicates
    const pageTopBar = (typeof document !== 'undefined' && document.getElementById) 
      ? (document.getElementById('page-top-bar') || (document.querySelector && document.querySelector('.page-top-bar'))) 
      : null;
    if (pageTopBar) pageTopBar.style.display = 'none';

    // If current route belongs to Store & Inventory Master, delegate to StoreInventoryModule
    const currentHash = (window.location && window.location.hash) || '';
    if (['#/stores', '#/store-master', '#/storage-locations', '#/racks', '#/shelves', '#/bins'].includes(currentHash)) {
      if (window.StoreInventoryModule && typeof window.StoreInventoryModule.render === 'function') {
        window.StoreInventoryModule.render(container);
        return;
      }
    }

    const storeContainer = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById('store-inventory-subview-container') : null;
    if (storeContainer && window.StoreInventoryModule && typeof window.StoreInventoryModule.renderActiveSubView === 'function') {
      storeContainer.innerHTML = window.StoreInventoryModule.renderActiveSubView();
      return;
    }

    // Synchronize activeTab based on current window location hash if applicable
    const hash = (window.location && window.location.hash) || '';
    if (hash === '#/branches' || hash === '#/facilities') this.activeTab = 'BRANCHES';
    else if (hash === '#/doc-print-config' || hash === '#/document-print-configuration' || hash === '#/document-print-config') this.activeTab = 'DOC_PRINT_CONFIG';
    else if (hash === '#/financial-calendar') this.activeTab = 'FINANCIAL_CALENDAR';
    else if (hash === '#/doc-series' || hash === '#/document-series') this.activeTab = 'DOC_SERIES';
    else if (hash === '#/holiday-master' || hash === '#/holidays') this.activeTab = 'HOLIDAYS';
    else if (hash === '#/registration-config' || hash === '#/registration-configuration') this.activeTab = 'REGISTRATION_CONFIG';
    else if (hash === '#/organizations' || hash === '#/org-location') this.activeTab = 'ORGANIZATIONS';

    const allOrgs = window.DB.getAll('organizations') || [];
    const allBranches = window.DB.getAll('plants') || [];
    const allStores = window.DB.getAll('warehouses') || [];
    const allLocations = window.DB.getAll('zones') || [];
    const allRacks = window.DB.getAll('racks') || [];
    const allShelves = window.DB.getAll('shelves') || [];
    const allBins = window.DB.getAll('bins') || [];

    // Tab definitions with RBAC permission codes
    this.tabConfig = [
      { key: 'ORGANIZATIONS', perm: 'ORG_MASTER', label: 'Organization Master' },
      { key: 'BRANCHES', perm: 'BRANCH_MASTER', label: 'Facility Master' },
      { key: 'DOC_PRINT_CONFIG', perm: 'DOC_PRINT_CONFIG_MASTER', label: 'Document Print Configuration Master' },
      { key: 'FINANCIAL_CALENDAR', perm: 'FINANCIAL_CALENDAR_MASTER', label: 'Financial Calendar Master' },
      { key: 'DOC_SERIES', perm: 'DOC_SERIES_MASTER', label: 'Document Number Series Master' },
      { key: 'HOLIDAYS', perm: 'HOLIDAY_MASTER', label: 'Holiday Master' },
      { key: 'REGISTRATION_CONFIG', perm: 'CONFIG_REGISTRATION', label: 'Registration Configuration' }
    ];

    const visibleTabs = this.tabConfig.filter(t => {
      if (!window.State || typeof window.State.hasPermission !== 'function') return true;
      if (t.key === 'REGISTRATION_CONFIG') {
        return window.State.hasPermission('CONFIG_REGISTRATION', 'VIEW') || window.State.hasPermission('ORG_MASTER', 'VIEW');
      }
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

    container.innerHTML = `
      <!-- 1. Tabs Header for All Permitted Masters -->
      <div class="tabs-header" style="margin-top: 0 !important; margin-bottom: 6px !important; overflow-x: auto;">
        ${visibleTabs.map(t => `
          <button class="tab-btn ${this.activeTab === t.key ? 'active' : ''}" onclick="window.OrgLocationModule.switchTab('${t.key}')">
            <span>${t.label}</span>
          </button>
        `).join('')}
      </div>

      <!-- 2. Active Tab Content -->
      <div id="org-location-tab-content">
        ${this.renderActiveTabContent()}
      </div>
    `;
  },

  switchTab(tabKey) {
    if (this.tabConfig && window.State && typeof window.State.hasPermission === 'function') {
      const tabItem = this.tabConfig.find(t => t.key === tabKey);
      if (tabItem) {
        const hasPerm = tabItem.key === 'REGISTRATION_CONFIG'
          ? (window.State.hasPermission('CONFIG_REGISTRATION', 'VIEW') || window.State.hasPermission('ORG_MASTER', 'VIEW'))
          : window.State.hasPermission(tabItem.perm, 'VIEW');
        if (!hasPerm) {
          window.State.showToast(`Access Restricted: Missing permission (${tabItem.perm}) for this sub-module.`, 'warning');
          return;
        }
      }
    }
    this.activeTab = tabKey;
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.parentFilter = 'ALL';

    const routeMap = {
      'ORGANIZATIONS': '#/organizations',
      'BRANCHES': '#/facilities',
      'DOC_PRINT_CONFIG': '#/doc-print-config',
      'FINANCIAL_CALENDAR': '#/financial-calendar',
      'DOC_SERIES': '#/doc-series',
      'HOLIDAYS': '#/holiday-master',
      'REGISTRATION_CONFIG': '#/registration-config'
    };
    if (routeMap[tabKey] && window.location.hash !== routeMap[tabKey]) {
      window.location.hash = routeMap[tabKey];
    } else {
      this.render();
    }
  },

  renderActiveTabContent() {
    if (this.activeTab === 'ORGANIZATIONS') return this.renderOrganizationsTab();
    if (this.activeTab === 'BRANCHES') return this.renderBranchesTab();
    if (this.activeTab === 'DOC_PRINT_CONFIG') return this.renderDocPrintConfigTab();
    if (this.activeTab === 'FINANCIAL_CALENDAR') return this.renderFinancialCalendarTab();
    if (this.activeTab === 'DOC_SERIES') return this.renderDocSeriesTab();
    if (this.activeTab === 'HOLIDAYS') return this.renderHolidayTab();
    if (this.activeTab === 'REGISTRATION_CONFIG') return this.renderRegistrationConfigTab();
    if (this.activeTab === 'STORES') return this.renderStoresTab();
    if (this.activeTab === 'LOCATIONS') return this.renderStorageLocationsTab();
    if (this.activeTab === 'RACKS') return this.renderRacksTab();
    if (this.activeTab === 'SHELVES') return this.renderShelvesTab();
    if (this.activeTab === 'BINS') return this.renderBinsTab();
    return this.renderOrganizationsTab();
  },

  // ==========================================================================
  // TAB 1: ORGANIZATION MASTER (Delegated to OrganizationModule)
  // ==========================================================================
  renderOrganizationsTab() {
    if (window.OrganizationModule && typeof window.OrganizationModule.render === 'function') {
      const allOrgs = window.DB.getAll('organizations') || [];
      const allPlants = window.DB.getAll('plants') || [];
      const totalCount = allOrgs.length;
      const activeCount = allOrgs.filter(o => o.status === 'Active').length;
      const multiBrandCount = allOrgs.filter(o => o.business_category === 'Multi-Brand Service Center' || o.business_category === 'Automobile Workshop').length;
      const totalBranches = allPlants.length;

      let orgs = allOrgs;
      if (this.searchTerm) {
        const tokens = this.searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
        orgs = orgs.filter(o => {
          const corpus = [
            o.id,
            o.code,
            o.name,
            o.legal_name,
            o.org_type,
            o.other_org_type,
            o.business_category,
            o.gstin,
            o.pan,
            o.gst_status,
            o.primary_contact_person,
            o.contact_person,
            o.mobile_number,
            o.mobile,
            o.alternate_mobile,
            o.email,
            o.city,
            o.district,
            o.state,
            o.pincode,
            o.address_line1,
            o.address_line2,
            o.remarks,
            o.status
          ].filter(Boolean).join(' ').toLowerCase();

          return tokens.every(token => corpus.includes(token));
        });
      }
      if (this.statusFilter !== 'ALL') {
        orgs = orgs.filter(o => o.status === this.statusFilter);
      }

      return `
        <div class="content-card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <div style="position: relative; display: inline-flex; align-items: center;">
                <input 
                  type="text" 
                  id="org-search-input"
                  class="form-control form-control-sm org-search-input" 
                  placeholder="Search code, name, contact, city, tax..." 
                  value="${this.searchTerm}" 
                  oninput="window.OrgLocationModule.setSearch(this.value)" 
                  style="width: 280px; padding-right: ${this.searchTerm ? '26px' : '10px'};" 
                  autocomplete="off"
                />
                ${this.searchTerm ? `
                  <button 
                    type="button" 
                    onclick="window.OrgLocationModule.setSearch('')" 
                    style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; line-height: 1; padding: 2px;"
                    title="Clear search"
                  >&times;</button>
                ` : ''}
              </div>
              <select class="form-control form-control-sm" onchange="window.OrgLocationModule.setStatus(this.value)" style="width: 130px;">
                <option value="ALL">All Statuses</option>
                <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-primary btn-sm" onclick="window.OrganizationModule.showAddOrganizationModal()">
                + Add Organization
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Code & ID</th>
                  <th>Organization Name</th>
                  <th>Type & Category</th>
                  <th>GSTIN / PAN</th>
                  <th>Contact Person & Mobile</th>
                  <th>State & City</th>
                  <th class="text-center">Facilities</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${orgs.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
                      <div style="font-size: 28px; margin-bottom: 6px;">🔍</div>
                      <div style="font-weight: 600; font-size: 14px; color: var(--text-secondary);">No Organizations Found</div>
                      <div style="font-size: 12px; margin-top: 4px;">No records match "${this.searchTerm}". Try searching by code, name, contact, city, or tax identity.</div>
                      ${this.searchTerm ? `<button class="btn btn-secondary btn-sm" style="margin-top: 10px;" onclick="window.OrgLocationModule.setSearch('')">Clear Search Filter</button>` : ''}
                    </td>
                  </tr>
                ` : orgs.map(o => {
                  const linkedBranches = allPlants.filter(p => p.organization_id === o.id || p.company_id === o.id);
                  return `
                    <tr>
                      <td>
                        <div class="cell-mono cell-strong" style="color: var(--primary-300);">${o.code}</div>
                        <div style="font-size: 10px; color: var(--text-muted);">${o.id}</div>
                      </td>
                      <td>
                        <div class="cell-strong">${o.name}</div>
                        ${o.legal_name && o.legal_name !== o.name ? `<div style="font-size: 10.5px; color: var(--text-muted);">Legal: ${o.legal_name}</div>` : ''}
                      </td>
                      <td>
                        <div><b>${o.org_type || 'Private Limited'}</b></div>
                        <div style="font-size: 10.5px; color: var(--text-muted);">${o.business_category}</div>
                      </td>
                      <td class="cell-mono" style="font-size: 11px;">
                        <div>${o.gstin || '<span style="color:var(--text-muted)">Unregistered</span>'}</div>
                        <div style="color: var(--text-muted); font-size: 10px;">${o.pan || '-'}</div>
                      </td>
                      <td>
                        <div>${o.primary_contact_person || o.contact_person || '-'}</div>
                        <div class="cell-mono" style="font-size: 11px; color: var(--accent-300);">${o.mobile_number || o.mobile || '-'}</div>
                      </td>
                      <td>
                        <div>${o.city || '-'}, ${o.state || '-'}</div>
                        <div style="font-size: 10px; color: var(--text-muted);">Pin: ${o.pincode || '-'}</div>
                      </td>
                      <td class="text-center">
                        <span class="badge ${linkedBranches.length > 0 ? 'badge-primary' : 'badge-subtle'}">${linkedBranches.length}</span>
                      </td>
                      <td>
                        <span class="status-pill ${o.status === 'Active' ? 'status-approved' : 'status-rejected'}">${o.status}</span>
                      </td>
                      <td class="text-right">
                        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                          <button class="btn btn-icon btn-sm" onclick="window.OrganizationModule.showOrgDetailsModal('${o.id}')" title="View Full Hierarchy">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          </button>
                          <button class="btn btn-icon btn-sm" onclick="window.OrganizationModule.showEditOrganizationModal('${o.id}')" title="Edit Organization">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button class="btn btn-icon btn-sm" onclick="window.OrganizationModule.toggleOrgStatus('${o.id}')" title="Toggle Status">
                            ${o.status === 'Active' ? `
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-warning, #f59e0b);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            ` : `
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success, #10b981);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                            `}
                          </button>
                          <button class="btn btn-icon btn-sm" onclick="window.OrganizationModule.deleteOrganization('${o.id}')" title="${linkedBranches.length > 0 ? `Cannot delete: ${linkedBranches.length} facility(ies) created under this organization` : 'Remove Organization'}" style="color: var(--color-danger, #ef4444); ${linkedBranches.length > 0 ? 'opacity: 0.45; cursor: not-allowed;' : ''}">
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
    }
    return '<div>Organization Master</div>';
  },

  // ==========================================================================
  // TAB 2: FACILITY MASTER (Governs Plants, Facilities & Workshops)
  // ==========================================================================
  renderBranchesTab() {
    const allBranches = window.DB.getAll('plants') || [];
    const allOrgs = window.DB.getAll('organizations') || [];
    const allStores = window.DB.getAll('warehouses') || [];

    let branches = allBranches;
    if (this.searchTerm) {
      const tokens = this.searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      branches = branches.filter(b => {
        const parentOrg = allOrgs.find(o => o.id === b.organization_id) || allOrgs.find(o => o.name && o.name.includes('Mauli')) || allOrgs[0];
        const corpus = [
          b.id, b.code, b.name, b.plant_type, b.city, b.state, b.address,
          b.contact_person, b.mobile, b.mobile_number, b.pincode, parentOrg ? parentOrg.name : '', parentOrg ? parentOrg.code : ''
        ].filter(Boolean).join(' ').toLowerCase();
        return tokens.every(t => corpus.includes(t));
      });
    }
    if (this.statusFilter !== 'ALL') {
      const wantActive = this.statusFilter === 'Active';
      branches = branches.filter(b => {
        const parentOrg = allOrgs.find(o => o.id === b.organization_id) || allOrgs.find(o => o.name && o.name.includes('Mauli')) || allOrgs[0];
        const isOrgActive = parentOrg ? (parentOrg.status === 'Active' && parentOrg.is_active !== false) : true;
        const effectiveActive = (b.is_active !== false) && isOrgActive;
        return wantActive ? effectiveActive : !effectiveActive;
      });
    }
    if (this.parentFilter !== 'ALL') {
      branches = branches.filter(b => b.organization_id === this.parentFilter || (!b.organization_id && allOrgs[0] && allOrgs[0].id === this.parentFilter));
    }

    const pagedBranches = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(branches, 'branches')
      : { items: branches, totalRecords: branches.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Filter by Parent Organization -->
            <select class="form-control form-control-sm" onchange="window.OrgLocationModule.setParent(this.value)" style="width: 200px;">
              <option value="ALL">All Organizations</option>
              ${allOrgs.map(o => {
                const isInactive = o.status !== 'Active' || o.is_active === false;
                return `<option value="${o.id}" ${this.parentFilter === o.id ? 'selected' : ''}>${o.code ? o.code + ' - ' : ''}${o.name} ${isInactive ? '(Inactive)' : ''}</option>`;
              }).join('')}
            </select>

            <div style="position: relative; display: inline-flex; align-items: center;">
              <input 
                type="text" 
                id="org-search-input"
                class="form-control form-control-sm org-search-input" 
                placeholder="Search facility, city..." 
                value="${this.searchTerm}" 
                oninput="window.OrgLocationModule.setSearch(this.value)" 
                style="width: 220px; padding-right: ${this.searchTerm ? '26px' : '10px'};" 
                autocomplete="off"
              />
              ${this.searchTerm ? `
                <button 
                  type="button" 
                  onclick="window.OrgLocationModule.setSearch('')" 
                  style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; line-height: 1; padding: 2px;"
                  title="Clear search"
                >&times;</button>
              ` : ''}
            </div>

            <select class="form-control form-control-sm" onchange="window.OrgLocationModule.setStatus(this.value)" style="width: 120px;">
              <option value="ALL">All Status</option>
              <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-primary btn-sm" onclick="window.OrgLocationModule.showAddBranchModal()">
              + Register Facility
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Facility Code</th>
                <th>Facility Name & Type</th>
                <th>Parent Organization</th>
                <th>City & Address</th>
                <th>Contact & Mobile</th>
                <th class="text-center">Stores</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${branches.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                    <div style="font-size: 15px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">No Facilities Found</div>
                    <div style="font-size: 12px; margin-bottom: 16px;">The facility master has no registered facilities. Click "+ Register Facility" to register a facility.</div>
                    <button class="btn btn-primary btn-sm" onclick="window.OrgLocationModule.showAddBranchModal()">+ Register Facility</button>
                  </td>
                </tr>
              ` : pagedBranches.items.map(b => {
                const parentOrg = allOrgs.find(o => o.id === b.organization_id) || allOrgs.find(o => o.name && o.name.includes('Mauli')) || allOrgs[0];
                const storesInBranch = allStores.filter(s => s.plant_id === b.id || s.facility_id === b.id || (b.code && (s.plant_id === b.code || s.facility_id === b.code)));
                const isOrgActive = parentOrg ? (parentOrg.status === 'Active' && parentOrg.is_active !== false) : true;
                const isBranchExplicitlyActive = b.is_active !== false;
                const isEffectiveActive = isBranchExplicitlyActive && isOrgActive;

                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: var(--color-info);">${b.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">${b.id}</div>
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        ${(b.logo || b.logo_url) ? `
                          <img src="${b.logo || b.logo_url}" alt="Logo" style="width: 28px; height: 28px; object-fit: contain; border-radius: 4px; border: 1px solid var(--border-subtle); flex-shrink: 0;" />
                        ` : ''}
                        <div>
                          <div class="cell-strong">${b.name}</div>
                          <div style="font-size: 10.5px; color: var(--text-muted);">${(b.plant_type || 'WORKSHOP').replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--primary-300);">${parentOrg ? parentOrg.name : '<span style="color: var(--text-muted)">Unassigned</span>'}</div>
                      <div style="display: flex; gap: 4px; align-items: center; margin-top: 2px;">
                        <span class="cell-mono" style="font-size: 10px; color: var(--text-muted);">${parentOrg ? parentOrg.code : (b.organization_id || '-')}</span>
                        ${!isOrgActive ? '<span class="status-pill status-rejected" style="font-size: 9px; padding: 1px 6px;">Org Inactive</span>' : ''}
                      </div>
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span>${b.city || 'Pune'}, ${b.state || 'Maharashtra'}${b.pincode ? ` - ${b.pincode}` : ''}</span>
                        ${(b.is_gst_applicable === false || b.is_gst_applicable === 'false' || b.is_gst_applicable === 'NO' || b.gst_applicable === false || b.gst_applicable === 'NO')
                          ? '<span class="badge badge-subtle" style="font-size: 9px; padding: 1px 5px; color: #94a3b8; border-color: rgba(148, 163, 184, 0.3);">Non-GST</span>'
                          : '<span class="badge badge-success" style="font-size: 9px; padding: 1px 5px;">GST</span>'
                        }
                      </div>
                      <div style="font-size: 10px; color: var(--text-muted);">${b.address || '-'}${b.gstin ? ` &bull; GSTIN: <span class="cell-mono font-bold" style="color: var(--text-primary);">${b.gstin}</span>` : ''}</div>
                    </td>
                    <td>
                      <div>${b.contact_person || 'Facility Head'}</div>
                      <div class="cell-mono" style="font-size: 11px; color: var(--accent-300);">${b.mobile_number || '9876543210'}</div>
                    </td>
                    <td class="text-center">
                      <span class="badge ${storesInBranch.length > 0 ? 'badge-primary' : 'badge-subtle'}">${storesInBranch.length}</span>
                    </td>
                    <td>
                      ${!isOrgActive ? `
                        <span class="status-pill status-rejected" title="Parent Organization is Inactive">Inactive (Org Inactive)</span>
                      ` : `
                        <span class="status-pill ${isBranchExplicitlyActive ? 'status-approved' : 'status-rejected'}">
                          ${isBranchExplicitlyActive ? 'Active' : 'Inactive'}
                        </span>
                      `}
                    </td>
                    <td class="text-right">
                      <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.showEditBranchModal('${b.id}')" title="Edit Facility">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.toggleBranchStatus('${b.id}')" title="Toggle Status">
                          ${isEffectiveActive ? `
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-warning, #f59e0b);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          ` : `
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success, #10b981);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          `}
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.deleteBranch('${b.id}')" title="${storesInBranch.length > 0 ? `Cannot delete: ${storesInBranch.length} store(s) created under this facility` : 'Delete Facility'}" style="color: var(--color-danger, #ef4444); ${storesInBranch.length > 0 ? 'opacity: 0.45; cursor: not-allowed;' : ''}">
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
          totalRecords: branches.length,
          currentPage: pagedBranches.currentPage,
          pageSize: pagedBranches.pageSize,
          onPageChange: 'window.OrgLocationModule.setPage(%p%)',
          onPageSizeChange: 'window.OrgLocationModule.setPageSize(%s%)'
        }) : ''}
      </div>
    `;
  },

  // ==========================================================================
  // TAB: SUPPLIER & VENDOR MASTER (SRM)
  // ==========================================================================
  renderSuppliersTab() {
    if (window.MastersModule && typeof window.MastersModule.renderSuppliersMaster === 'function') {
      return window.MastersModule.renderSuppliersMaster();
    }
    return '<div>Supplier & Vendor Master</div>';
  },

  // ==========================================================================
  // TAB: DOCUMENT PRINT CONFIGURATION MASTER (BRD v1.0 Compliant)
  // ==========================================================================
  renderDocPrintConfigTab() {
    if (window.DocPrintConfigModule && typeof window.DocPrintConfigModule.renderTab === 'function') {
      const container = document.getElementById('org-location-tab-content');
      return window.DocPrintConfigModule.renderTab(container);
    }
    return '<div>Document Print Configuration Master</div>';
  },

  // ==========================================================================
  // TAB: FINANCIAL CALENDAR MASTER (Governs Financial Years & Period Posting)
  // ==========================================================================
  renderFinancialCalendarTab() {
    if (window.FinancialCalendarModule && typeof window.FinancialCalendarModule.renderTab === 'function') {
      const container = document.getElementById('org-location-tab-content');
      return window.FinancialCalendarModule.renderTab(container);
    }
    return '<div>Financial Calendar Master</div>';
  },

  // ==========================================================================
  // TAB: DOCUMENT NUMBER SERIES MASTER (Governs Transaction Numbering)
  // ==========================================================================
  renderDocSeriesTab() {
    if (window.DocSeriesMasterModule && typeof window.DocSeriesMasterModule.renderTab === 'function') {
      const container = document.getElementById('org-location-tab-content');
      return window.DocSeriesMasterModule.renderTab(container);
    }
    return '<div>Document Number Series Master</div>';
  },

  // ==========================================================================
  // TAB: HOLIDAY MASTER (Governs Organization & Facility Holiday Calendars)
  // ==========================================================================
  renderHolidayTab() {
    if (window.HolidayMasterModule && typeof window.HolidayMasterModule.renderTab === 'function') {
      const container = document.getElementById('org-location-tab-content');
      return window.HolidayMasterModule.renderTab(container);
    }
    return '<div>Holiday Master</div>';
  },

  // ==========================================================================
  // TAB: REGISTRATION CONFIGURATION MASTER (Facility-wise Registration Controls)
  // ==========================================================================
  renderRegistrationConfigTab() {
    if (window.RegistrationConfigModule && typeof window.RegistrationConfigModule.renderTab === 'function') {
      const container = document.getElementById('org-location-tab-content');
      return window.RegistrationConfigModule.renderTab(container);
    }
    return '<div>Registration Configuration Master</div>';
  },

  // ==========================================================================
  // TAB 3: STORE MASTER (Governs Warehouses, Buffer Stores, Quarantine)
  // ==========================================================================
  renderStoresTab() {
    const allStores = window.DB.getAll('warehouses') || [];
    const allBranches = window.DB.getAll('plants') || [];
    const allOrgs = window.DB.getAll('organizations') || [];
    const allLocations = window.DB.getAll('zones') || [];

    let stores = allStores;
    if (this.searchTerm) {
      const tokens = this.searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      stores = stores.filter(s => {
        const branch = allBranches.find(b => b.id === s.plant_id);
        const corpus = [
          s.id, s.code, s.name, s.store_type, s.warehouse_type, s.manager, s.contact_mobile,
          branch ? branch.name : '', branch ? branch.code : ''
        ].filter(Boolean).join(' ').toLowerCase();
        return tokens.every(t => corpus.includes(t));
      });
    }
    if (this.parentFilter !== 'ALL') {
      stores = stores.filter(s => s.plant_id === this.parentFilter);
    }

    const pagedStores = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(stores, 'stores')
      : { items: stores, totalRecords: stores.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Filter by Parent Facility -->
            <select class="form-control form-control-sm" onchange="window.OrgLocationModule.setParent(this.value)" style="width: 200px;">
              <option value="ALL">All Facilities</option>
              ${allBranches.map(b => {
                const isBranchActive = window.DB.isPlantActive(b.id);
                return `<option value="${b.id}" ${this.parentFilter === b.id ? 'selected' : ''}>${b.code} - ${b.name} ${!isBranchActive ? '(Inactive Org)' : ''}</option>`;
              }).join('')}
            </select>

            <div style="position: relative; display: inline-flex; align-items: center;">
              <input 
                type="text" 
                id="org-search-input"
                class="form-control form-control-sm org-search-input" 
                placeholder="Search store name, manager..." 
                value="${this.searchTerm}" 
                oninput="window.OrgLocationModule.setSearch(this.value)" 
                style="width: 220px; padding-right: ${this.searchTerm ? '26px' : '10px'};" 
                autocomplete="off"
              />
              ${this.searchTerm ? `
                <button 
                  type="button" 
                  onclick="window.OrgLocationModule.setSearch('')" 
                  style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; line-height: 1; padding: 2px;"
                  title="Clear search"
                >&times;</button>
              ` : ''}
            </div>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" onclick="window.OrgLocationModule.showAddStoreModal()">
              + Register Store
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Store Code</th>
                <th>Store / Warehouse Name</th>
                <th>Parent Facility</th>
                <th>Store Type</th>
                <th>Capacity (CBM)</th>
                <th>Occupancy %</th>
                <th>Store Manager</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pagedStores.items.length === 0 ? `
                <tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--text-muted);">No Stores found.</td></tr>
              ` : pagedStores.items.map(s => {
                const branch = allBranches.find(b => b.id === s.plant_id);
                const parentOrg = branch ? allOrgs.find(o => o.id === branch.organization_id) : null;
                const isOrgActive = parentOrg ? (parentOrg.status === 'Active' && parentOrg.is_active !== false) : true;
                const isBranchActive = branch ? (branch.is_active !== false && isOrgActive) : true;
                const occPct = s.capacity_cbm ? Math.round(((s.occupied_cbm || 0) / s.capacity_cbm) * 100) : 50;

                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: var(--color-success);">${s.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">${s.id}</div>
                    </td>
                    <td>
                      <div class="cell-strong">${s.name}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--color-info);">${branch ? branch.name : 'Pune Workshop'}</div>
                      <div style="display: flex; gap: 4px; align-items: center; margin-top: 2px;">
                        <span class="cell-mono" style="font-size: 10px; color: var(--text-muted);">${branch ? branch.code : 'FACILITY-01'}</span>
                        ${!isOrgActive ? '<span class="status-pill status-rejected" style="font-size: 9px; padding: 1px 6px;">Org Inactive</span>' : (!isBranchActive ? '<span class="status-pill status-rejected" style="font-size: 9px; padding: 1px 6px;">Facility Inactive</span>' : '')}
                      </div>
                    </td>
                    <td>
                      <span class="status-pill status-draft">${(s.warehouse_type || 'GENERAL').replace(/_/g, ' ')}</span>
                    </td>
                    <td class="cell-num">
                      <b>${(s.capacity_cbm || 0).toLocaleString()}</b> m³
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; width: 60px;">
                          <div style="width: ${occPct}%; height: 100%; background: ${occPct > 85 ? 'var(--color-danger)' : (occPct > 60 ? 'var(--color-warning)' : 'var(--color-success)')};"></div>
                        </div>
                        <span style="font-size: 11px; font-weight: 600;">${occPct}%</span>
                      </div>
                    </td>
                    <td>${s.manager || 'Sunil Deshmukh'}</td>
                    <td>
                      <span class="status-pill ${isBranchActive ? 'status-approved' : 'status-rejected'}">
                        ${isBranchActive ? 'Active' : (!isOrgActive ? 'Inactive (Org Inactive)' : 'Inactive')}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                        <button class="btn btn-outline btn-sm" title="Configure Store" onclick="if(window.StoreInventoryModule){window.StoreInventoryModule.showStoreConfigurationModal('${s.id}')}else{window.OrgLocationModule.showEditStoreModal('${s.id}')}" style="padding: 3px 8px; font-size: 11.5px; font-weight: 600;">
                          Configure
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.showEditStoreModal('${s.id}')" title="Edit Store">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
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
          key: 'stores',
          pagination: pagedStores,
          onPageChange: "window.OrgLocationModule.setPage(%p%, 'stores')",
          onPageSizeChange: "window.OrgLocationModule.setPageSize(%s%, 'stores')"
        }) : ''}
      </div>
    `;
  },

  // ==========================================================================
  // TAB 4: STORAGE LOCATION MASTER (Zones, Inward Docks, Staging Bays)
  // ==========================================================================
  renderStorageLocationsTab() {
    const allLocations = window.DB.getAll('zones') || [];
    const allStores = window.DB.getAll('warehouses') || [];
    const allRacks = window.DB.getAll('racks') || [];

    let locations = allLocations;
    if (this.searchTerm) {
      const tokens = this.searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      locations = locations.filter(l => {
        const store = allStores.find(s => s.id === l.warehouse_id);
        const corpus = [
          l.id, l.code, l.name, l.type, l.zone_type, l.aisle,
          store ? store.name : '', store ? store.code : ''
        ].filter(Boolean).join(' ').toLowerCase();
        return tokens.every(t => corpus.includes(t));
      });
    }
    if (this.parentFilter !== 'ALL') {
      locations = locations.filter(l => l.warehouse_id === this.parentFilter);
    }

    const pagedLocations = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(locations, 'locations')
      : { items: locations, totalRecords: locations.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Filter by Parent Store -->
            <select class="form-control form-control-sm" onchange="window.OrgLocationModule.setParent(this.value)" style="width: 200px;">
              <option value="ALL">All Stores</option>
              ${allStores.map(s => `<option value="${s.id}" ${this.parentFilter === s.id ? 'selected' : ''}>${s.code} - ${s.name}</option>`).join('')}
            </select>

            <div style="position: relative; display: inline-flex; align-items: center;">
              <input 
                type="text" 
                id="org-search-input"
                class="form-control form-control-sm org-search-input" 
                placeholder="Search location..." 
                value="${this.searchTerm}" 
                oninput="window.OrgLocationModule.setSearch(this.value)" 
                style="width: 220px; padding-right: ${this.searchTerm ? '26px' : '10px'};" 
                autocomplete="off"
              />
              ${this.searchTerm ? `
                <button 
                  type="button" 
                  onclick="window.OrgLocationModule.setSearch('')" 
                  style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; line-height: 1; padding: 2px;"
                  title="Clear search"
                >&times;</button>
              ` : ''}
            </div>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" onclick="window.OrgLocationModule.showAddStorageLocationModal()">
              + Register Location
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Location Code</th>
                <th>Storage Location Name</th>
                <th>Parent Store</th>
                <th>Classification</th>
                <th class="text-center">Mounted Racks</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pagedLocations.items.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No Storage Locations found.</td></tr>
              ` : pagedLocations.items.map(l => {
                const store = allStores.find(s => s.id === l.warehouse_id);
                const racksCount = allRacks.filter(r => r.storage_location_id === l.id).length;

                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: var(--color-warning);">${l.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">${l.id}</div>
                    </td>
                    <td>
                      <div class="cell-strong">${l.name}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--color-success);">${store ? store.name : 'Main Store'}</div>
                      <div class="cell-mono" style="font-size: 10px; color: var(--text-muted);">${store ? store.code : 'STORE-01'}</div>
                    </td>
                    <td>
                      <span class="status-pill status-draft">${(l.location_type || 'ZONE').replace(/_/g, ' ')}</span>
                    </td>
                    <td class="text-center">
                      <span class="badge ${racksCount > 0 ? 'badge-primary' : 'badge-subtle'}">${racksCount}</span>
                    </td>
                    <td>
                      <span class="status-pill ${l.status !== 'Inactive' ? 'status-approved' : 'status-rejected'}">${l.status || 'Active'}</span>
                    </td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 5px; justify-content: flex-end; align-items: center;">
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.showEditStorageLocationModal('${l.id}')" title="Edit Location">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.deleteStorageLocation('${l.id}')" title="Delete Storage Location" style="color: var(--color-danger, #ef4444);">
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
          key: 'locations',
          pagination: pagedLocations,
          onPageChange: "window.OrgLocationModule.setPage(%p%, 'locations')",
          onPageSizeChange: "window.OrgLocationModule.setPageSize(%s%, 'locations')"
        }) : ''}
      </div>
    `;
  },

  // ==========================================================================
  // TAB 5: RACK MASTER
  // ==========================================================================
  renderRacksTab() {
    const allRacks = window.DB.getAll('racks') || [];
    const allStores = window.DB.getAll('warehouses') || [];
    const allLocations = window.DB.getAll('zones') || [];
    const allShelves = window.DB.getAll('shelves') || [];

    let racks = allRacks;
    if (this.searchTerm) {
      const tokens = this.searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      racks = racks.filter(r => {
        const store = allStores.find(s => s.id === r.warehouse_id);
        const corpus = [
          r.id, r.code, r.name, r.rack_type, r.aisle,
          store ? store.name : '', store ? store.code : ''
        ].filter(Boolean).join(' ').toLowerCase();
        return tokens.every(t => corpus.includes(t));
      });
    }
    if (this.parentFilter !== 'ALL') {
      racks = racks.filter(r => r.warehouse_id === this.parentFilter);
    }

    const pagedRacks = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(racks, 'racks')
      : { items: racks, totalRecords: racks.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Filter by Store -->
            <select class="form-control form-control-sm" onchange="window.OrgLocationModule.setParent(this.value)" style="width: 200px;">
              <option value="ALL">All Stores</option>
              ${allStores.map(s => `<option value="${s.id}" ${this.parentFilter === s.id ? 'selected' : ''}>${s.code} - ${s.name}</option>`).join('')}
            </select>

            <div style="position: relative; display: inline-flex; align-items: center;">
              <input 
                type="text" 
                id="org-search-input"
                class="form-control form-control-sm org-search-input" 
                placeholder="Search rack code, type..." 
                value="${this.searchTerm}" 
                oninput="window.OrgLocationModule.setSearch(this.value)" 
                style="width: 220px; padding-right: ${this.searchTerm ? '26px' : '10px'};" 
                autocomplete="off"
              />
              ${this.searchTerm ? `
                <button 
                  type="button" 
                  onclick="window.OrgLocationModule.setSearch('')" 
                  style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; line-height: 1; padding: 2px;"
                  title="Clear search"
                >&times;</button>
              ` : ''}
            </div>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" onclick="window.OrgLocationModule.showAddRackModal()">
              + Register Rack
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rack Code</th>
                <th>Rack Specification / Name</th>
                <th>Parent Location & Store</th>
                <th>Rack Type</th>
                <th class="text-right">Max Capacity (kg)</th>
                <th class="text-center">Shelves</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pagedRacks.items.length === 0 ? `
                <tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No Racks registered.</td></tr>
              ` : pagedRacks.items.map(r => {
                const store = allStores.find(s => s.id === r.warehouse_id);
                const loc = allLocations.find(l => l.id === r.storage_location_id);
                const shelvesInRack = allShelves.filter(sh => sh.rack_id === r.id);

                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: #f472b6;">${r.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">${r.id}</div>
                    </td>
                    <td>
                      <div class="cell-strong">${r.name}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--color-warning);">${loc ? loc.name : 'General Storage'}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">${store ? store.name : 'Store'}</div>
                    </td>
                    <td>
                      <span class="status-pill status-draft">${r.rack_type || 'Selective Pallet'}</span>
                    </td>
                    <td class="cell-num">
                      <b>${(r.max_weight_capacity_kg || 2000).toLocaleString()}</b> kg
                    </td>
                    <td class="text-center">
                      <span class="badge ${shelvesInRack.length > 0 ? 'badge-primary' : 'badge-subtle'}">${shelvesInRack.length || r.total_shelves || 2}</span>
                    </td>
                    <td>
                      <span class="status-pill ${r.status !== 'Inactive' ? 'status-approved' : 'status-rejected'}">${r.status || 'Active'}</span>
                    </td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 5px; justify-content: flex-end; align-items: center;">
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.showEditRackModal('${r.id}')" title="Edit Rack">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.deleteRack('${r.id}')" title="Delete Rack" style="color: var(--color-danger, #ef4444);">
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
          key: 'racks',
          pagination: pagedRacks,
          onPageChange: "window.OrgLocationModule.setPage(%p%, 'racks')",
          onPageSizeChange: "window.OrgLocationModule.setPageSize(%s%, 'racks')"
        }) : ''}
      </div>
    `;
  },

  // ==========================================================================
  // TAB 6: SHELF MASTER
  // ==========================================================================
  renderShelvesTab() {
    const allShelves = window.DB.getAll('shelves') || [];
    const allRacks = window.DB.getAll('racks') || [];
    const allBins = window.DB.getAll('bins') || [];

    let shelves = allShelves;
    if (this.searchTerm) {
      const tokens = this.searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      shelves = shelves.filter(s => {
        const rack = allRacks.find(r => r.id === s.rack_id);
        const corpus = [
          s.id, s.code, s.level, rack ? rack.name : '', rack ? rack.code : ''
        ].filter(Boolean).join(' ').toLowerCase();
        return tokens.every(t => corpus.includes(t));
      });
    }
    if (this.parentFilter !== 'ALL') {
      shelves = shelves.filter(s => s.rack_id === this.parentFilter);
    }

    const pagedShelves = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(shelves, 'shelves')
      : { items: shelves, totalRecords: shelves.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Filter by Parent Rack -->
            <select class="form-control form-control-sm" onchange="window.OrgLocationModule.setParent(this.value)" style="width: 200px;">
              <option value="ALL">All Racks</option>
              ${allRacks.map(r => `<option value="${r.id}" ${this.parentFilter === r.id ? 'selected' : ''}>${r.code} - ${r.name}</option>`).join('')}
            </select>

            <div style="position: relative; display: inline-flex; align-items: center;">
              <input 
                type="text" 
                id="org-search-input"
                class="form-control form-control-sm org-search-input" 
                placeholder="Search shelf code..." 
                value="${this.searchTerm}" 
                oninput="window.OrgLocationModule.setSearch(this.value)" 
                style="width: 220px; padding-right: ${this.searchTerm ? '26px' : '10px'};" 
                autocomplete="off"
              />
              ${this.searchTerm ? `
                <button 
                  type="button" 
                  onclick="window.OrgLocationModule.setSearch('')" 
                  style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; line-height: 1; padding: 2px;"
                  title="Clear search"
                >&times;</button>
              ` : ''}
            </div>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" onclick="window.OrgLocationModule.showAddShelfModal()">
              + Register Shelf
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Shelf Code</th>
                <th>Parent Rack</th>
                <th>Level Number</th>
                <th class="text-right">Max Weight Limit (kg)</th>
                <th class="text-center">Assigned Bins</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pagedShelves.items.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No Shelves found.</td></tr>
              ` : pagedShelves.items.map(s => {
                const rack = allRacks.find(r => r.id === s.rack_id);
                const binsCount = allBins.filter(b => b.shelf_id === s.id || (b.rack === (rack ? rack.code : '') && b.shelf === s.code)).length;

                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: #c084fc;">${s.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">${s.id}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: #f472b6;">${rack ? rack.name : 'Rack R-01'}</div>
                      <div class="cell-mono" style="font-size: 10px; color: var(--text-muted);">${rack ? rack.code : 'R-01'}</div>
                    </td>
                    <td>
                      <span class="badge badge-subtle">Tier Level ${s.level_number || 1}</span>
                    </td>
                    <td class="cell-num">
                      <b>${(s.weight_limit_kg || 1500).toLocaleString()}</b> kg
                    </td>
                    <td class="text-center">
                      <span class="badge ${binsCount > 0 ? 'badge-primary' : 'badge-subtle'}">${binsCount}</span>
                    </td>
                    <td>
                      <span class="status-pill ${s.status !== 'Inactive' ? 'status-approved' : 'status-rejected'}">${s.status || 'Active'}</span>
                    </td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 5px; justify-content: flex-end; align-items: center;">
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.showEditShelfModal('${s.id}')" title="Edit Shelf">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.deleteShelf('${s.id}')" title="Delete Shelf" style="color: var(--color-danger, #ef4444);">
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
          key: 'shelves',
          pagination: pagedShelves,
          onPageChange: "window.OrgLocationModule.setPage(%p%, 'shelves')",
          onPageSizeChange: "window.OrgLocationModule.setPageSize(%s%, 'shelves')"
        }) : ''}
      </div>
    `;
  },

  // ==========================================================================
  // TAB 7: BIN MASTER
  // ==========================================================================
  renderBinsTab() {
    const allBins = window.DB.getAll('bins') || [];
    const allStores = window.DB.getAll('warehouses') || [];
    const allRacks = window.DB.getAll('racks') || [];

    let bins = allBins;
    if (this.searchTerm) {
      const tokens = this.searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      bins = bins.filter(b => {
        const store = allStores.find(s => s.id === b.warehouse_id);
        const corpus = [
          b.id, b.code, b.rack, b.shelf, b.bin, b.status,
          store ? store.name : '', store ? store.code : ''
        ].filter(Boolean).join(' ').toLowerCase();
        return tokens.every(t => corpus.includes(t));
      });
    }
    if (this.parentFilter !== 'ALL') {
      bins = bins.filter(b => b.warehouse_id === this.parentFilter);
    }

    const pagedBins = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(bins, 'bins')
      : { items: bins, totalRecords: bins.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    return `
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Filter by Store -->
            <select class="form-control form-control-sm" onchange="window.OrgLocationModule.setParent(this.value)" style="width: 200px;">
              <option value="ALL">All Stores</option>
              ${allStores.map(s => `<option value="${s.id}" ${this.parentFilter === s.id ? 'selected' : ''}>${s.code} - ${s.name}</option>`).join('')}
            </select>

            <div style="position: relative; display: inline-flex; align-items: center;">
              <input 
                type="text" 
                id="org-search-input"
                class="form-control form-control-sm org-search-input" 
                placeholder="Search bin code..." 
                value="${this.searchTerm}" 
                oninput="window.OrgLocationModule.setSearch(this.value)" 
                style="width: 220px; padding-right: ${this.searchTerm ? '26px' : '10px'};" 
                autocomplete="off"
              />
              ${this.searchTerm ? `
                <button 
                  type="button" 
                  onclick="window.OrgLocationModule.setSearch('')" 
                  style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; line-height: 1; padding: 2px;"
                  title="Clear search"
                >&times;</button>
              ` : ''}
            </div>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" onclick="window.OrgLocationModule.showAddBinModal()">
              + Register Bin
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Bin Code</th>
                <th>Storage Matrix (Rack &rarr; Shelf &rarr; Bin)</th>
                <th>Parent Store</th>
                <th class="text-right">Max Vol (CBM)</th>
                <th class="text-right">Max Weight (kg)</th>
                <th>Occupancy %</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pagedBins.items.length === 0 ? `
                <tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No Bins found.</td></tr>
              ` : pagedBins.items.map(b => {
                const store = allStores.find(s => s.id === b.warehouse_id);

                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: #60a5fa;">${b.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">${b.id}</div>
                    </td>
                    <td>
                      <div class="cell-mono" style="font-size: 11px;">
                        <span style="color:#f472b6;">Rack: ${b.rack || 'R-01'}</span> &bull; 
                        <span style="color:#c084fc;">Shelf: ${b.shelf || 'S-01'}</span> &bull; 
                        <span style="color:#60a5fa;">Slot: ${b.bin || 'B-01'}</span>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--color-success);">${store ? store.name : 'Store'}</div>
                      <div class="cell-mono" style="font-size: 10px; color: var(--text-muted);">${store ? store.code : ''}</div>
                    </td>
                    <td class="cell-num">${b.max_vol || 5} m³</td>
                    <td class="cell-num">${b.max_weight || 1000} kg</td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; width: 50px;">
                          <div style="width: ${b.occupied_pct || 0}%; height: 100%; background: ${(b.occupied_pct || 0) > 85 ? 'var(--color-danger)' : ((b.occupied_pct || 0) > 40 ? 'var(--color-warning)' : 'var(--color-success)')};"></div>
                        </div>
                        <span style="font-size: 11px; font-weight: 600;">${b.occupied_pct || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <span class="status-pill ${b.status === 'full' ? 'status-rejected' : (b.status === 'quarantine' ? 'status-draft' : 'status-approved')}">${(b.status || 'Active').toUpperCase()}</span>
                    </td>
                    <td class="text-right">
                      <div style="display: inline-flex; gap: 5px; justify-content: flex-end; align-items: center;">
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.showEditBinModal('${b.id}')" title="Edit Bin">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="window.OrgLocationModule.deleteBin('${b.id}')" title="Delete Bin" style="color: var(--color-danger, #ef4444);">
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
          key: 'bins',
          pagination: pagedBins,
          onPageChange: "window.OrgLocationModule.setPage(%p%, 'bins')",
          onPageSizeChange: "window.OrgLocationModule.setPageSize(%s%, 'bins')"
        }) : ''}
      </div>
    `;
  },

  getCurrentTabPaginationKey() {
    switch (this.activeTab) {
      case 'BRANCHES': return 'branches';
      case 'STORES': return 'stores';
      case 'LOCATIONS': return 'locations';
      case 'RACKS': return 'racks';
      case 'SHELVES': return 'shelves';
      case 'BINS': return 'bins';
      default: return 'branches';
    }
  },

  setPage(page, key) {
    const k = key || this.getCurrentTabPaginationKey();
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPage(k, page);
    }
    const storeContainer = document.getElementById('store-inventory-subview-container');
    const container = storeContainer || document.getElementById('org-location-tab-content');
    if (storeContainer && window.StoreInventoryModule && typeof window.StoreInventoryModule.renderActiveSubView === 'function') {
      storeContainer.innerHTML = window.StoreInventoryModule.renderActiveSubView();
    } else if (container) {
      container.innerHTML = this.renderActiveTabContent();
    } else {
      this.render();
    }
  },

  setPageSize(size, key) {
    const k = key || this.getCurrentTabPaginationKey();
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPageSize(k, size);
    }
    const storeContainer = document.getElementById('store-inventory-subview-container');
    const container = storeContainer || document.getElementById('org-location-tab-content');
    if (storeContainer && window.StoreInventoryModule && typeof window.StoreInventoryModule.renderActiveSubView === 'function') {
      storeContainer.innerHTML = window.StoreInventoryModule.renderActiveSubView();
    } else if (container) {
      container.innerHTML = this.renderActiveTabContent();
    } else {
      this.render();
    }
  },

  // Filters & State Handlers
  setSearch(val) {
    this.searchTerm = val !== undefined && val !== null ? val : '';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('branches');
    }
    if (window.StoreInventoryModule) {
      window.StoreInventoryModule.searchTerm = (this.searchTerm || '').toLowerCase().trim();
    }
    const storeContainer = document.getElementById('store-inventory-subview-container');
    const container = storeContainer || document.getElementById('org-location-tab-content');
    if (!container) return;

    // Track active search input & cursor selection range before replacing DOM
    const activeEl = document.activeElement;
    const isSearchInput = activeEl && (
      activeEl.classList.contains('org-search-input') || 
      activeEl.id === 'org-search-input' ||
      activeEl.id === 'store-sub-search' ||
      activeEl.tagName === 'INPUT'
    );
    const selStart = isSearchInput ? activeEl.selectionStart : null;
    const selEnd = isSearchInput ? activeEl.selectionEnd : null;

    if (storeContainer && window.StoreInventoryModule && typeof window.StoreInventoryModule.renderActiveSubView === 'function') {
      storeContainer.innerHTML = window.StoreInventoryModule.renderActiveSubView();
    } else {
      container.innerHTML = this.renderActiveTabContent();
    }

    // Seamlessly restore focus and cursor position so typing is uninterrupted
    if (isSearchInput) {
      const newSearchInput = container.querySelector('#org-search-input') || 
                             container.querySelector('#store-sub-search') || 
                             container.querySelector('.org-search-input') || 
                             container.querySelector('input[type="text"]');
      if (newSearchInput && typeof newSearchInput.focus === 'function') {
        newSearchInput.focus();
        if (selStart !== null && selEnd !== null && typeof newSearchInput.setSelectionRange === 'function') {
          try {
            newSearchInput.setSelectionRange(selStart, selEnd);
          } catch (e) {}
        }
      }
    }
  },

  setStatus(val) {
    this.statusFilter = val;
    const storeContainer = document.getElementById('store-inventory-subview-container');
    if (storeContainer && window.StoreInventoryModule && typeof window.StoreInventoryModule.renderActiveSubView === 'function') {
      storeContainer.innerHTML = window.StoreInventoryModule.renderActiveSubView();
      return;
    }
    const container = document.getElementById('org-location-tab-content');
    if (container) container.innerHTML = this.renderActiveTabContent();
  },

  setParent(val) {
    this.parentFilter = val;
    const storeContainer = document.getElementById('store-inventory-subview-container');
    if (storeContainer && window.StoreInventoryModule && typeof window.StoreInventoryModule.renderActiveSubView === 'function') {
      storeContainer.innerHTML = window.StoreInventoryModule.renderActiveSubView();
      return;
    }
    const container = document.getElementById('org-location-tab-content');
    if (container) container.innerHTML = this.renderActiveTabContent();
  },

  // ==========================================================================
  // ADD & EDIT MODALS FOR ALL SUB-MASTERS
  // ==========================================================================

  // --- 2. Branch Modal ---
  showAddBranchModal() {
    const allOrgs = window.DB.getAll('organizations') || [];
    const allBranches = window.DB.getAll('plants') || [];
    const nextCode = `FACILITY-${String(allBranches.length + 1).padStart(2, '0')}`;

    const contentHtml = `
      <form id="add-branch-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitCreateBranch();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Parent Organization ${allOrgs.length > 0 ? '<span style="color: var(--color-danger)">*</span>' : ''}</label>
            <select id="branch-org-id" class="form-control" ${allOrgs.length === 0 ? '' : 'required'}>
              ${allOrgs.length === 0 
                ? '<option value="">No Organizations Available (Unassigned)</option>' 
                : allOrgs.map(o => {
                    const isInactive = o.status !== 'Active' || o.is_active === false;
                    return `<option value="${o.id}">${o.code} - ${o.name} ${isInactive ? '(Inactive)' : ''}</option>`;
                  }).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Facility Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="branch-code" class="form-control" value="${nextCode}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Facility Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="branch-name" class="form-control" placeholder="e.g. Pune Wakad Quick-Service Facility" required />
          </div>
          <div>
            <label class="form-label">Facility Type <span style="color: var(--color-danger)">*</span></label>
            <select id="branch-type" class="form-control" required>
              <option value="AUTOMOBILE_WORKSHOP" selected>Automobile Workshop</option>
              <option value="TWO_WHEELER_WORKSHOP">Two-Wheeler Workshop</option>
              <option value="MULTI_BRAND_CENTER">Multi-Brand Service Center</option>
              <option value="COMMERCIAL_BRANCH">Commercial Logistics Facility</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Contact Person <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="branch-contact" class="form-control" placeholder="Facility Manager" required />
          </div>
          <div>
            <label class="form-label">Mobile Number (10 Digits) <span style="color: var(--color-danger)">*</span></label>
            <input type="tel" id="branch-mobile" class="form-control" maxlength="10" minlength="10" placeholder="98XXXXXXXX" required oninput="this.value = this.value.replace(/\\D/g, '').slice(0,10)" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Physical Address <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="branch-address" class="form-control" placeholder="Plot / Street / Area" required />
          </div>
          <div>
            <label class="form-label">City <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="branch-city" class="form-control" value="Pune" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">State <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="branch-state" class="form-control" value="Maharashtra" required />
          </div>
          <div>
            <label class="form-label">Pincode</label>
            <input type="text" id="branch-pincode" class="form-control" maxlength="6" placeholder="411001" oninput="this.value = this.value.replace(/\\D/g, '').slice(0,6)" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; background: rgba(0,0,0,0.02); padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-subtle);">
          <div>
            <label class="form-label" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span><strong>GST Applicable</strong> <span style="color: var(--color-danger)">*</span></span>
              <span id="branch-gst-badge" class="badge badge-success" style="font-size: 10px; padding: 1.5px 7px;">✓ GST Applicable</span>
            </label>
            <select id="branch-gst-applicable" class="form-control" onchange="window.OrgLocationModule.onGstApplicableChange(this.value, 'branch-gstin', 'branch-gst-badge')">
              <option value="YES" selected>Yes (GST Applicable for this Facility)</option>
              <option value="NO">No (GST Not Applicable for this Facility)</option>
            </select>
            <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px; line-height: 1.3;">
              If No, system will not apply GST for this facility across billing & estimates.
            </div>
          </div>
          <div>
            <label class="form-label" style="margin-bottom: 4px;">GSTIN (Optional)</label>
            <input type="text" id="branch-gstin" class="form-control" maxlength="15" style="text-transform: uppercase; font-family: var(--font-mono);" placeholder="Optional (e.g. 27AAAAA0000A1Z5)" />
            <div id="branch-gstin-hint" style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px; line-height: 1.3;">
              15-character GST identification number if registered.
            </div>
          </div>
        </div>

        <!-- Facility Logo Upload -->
        <div>
          <label class="form-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span>Facility Logo (Optional)</span>
            <span style="font-size: 11px; color: var(--text-muted);">PNG, JPG, SVG or WEBP (Max 2MB)</span>
          </label>
          <div style="display: flex; align-items: center; gap: 14px; background: rgba(0,0,0,0.02); border: 1.5px dashed var(--border-medium); border-radius: 6px; padding: 10px 14px;">
            <div id="add-facility-logo-preview-container" style="width: 52px; height: 52px; border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; background: #fff; overflow: hidden; flex-shrink: 0;">
              <span id="facility-logo-placeholder" style="font-size: 24px;">🏢</span>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="file" id="add-facility-logo-file" accept="image/*" style="display: none;" onchange="window.OrgLocationModule.handleFacilityLogoUpload(event, 'branch-logo-data', 'add-facility-logo-preview-container')" />
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('add-facility-logo-file').click()">
                  📁 Choose Logo Image
                </button>
                <button type="button" id="facility-logo-remove-btn" class="btn btn-sm" style="color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.3); background: transparent; display: none;" onclick="window.OrgLocationModule.removeFacilityLogo('branch-logo-data', 'add-facility-logo-preview-container')">
                  ✕ Remove
                </button>
              </div>
              <input type="hidden" id="branch-logo-data" value="" />
              <div style="font-size: 11px; color: var(--text-muted);">This logo will appear on Tax Invoices, Receipts, and Estimate Quotations.</div>
            </div>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitCreateBranch()">Save Facility</button>
      </div>
    `;

    window.State.showModal({
      title: 'Register New Facility (Facility Master)',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '650px'
    });
  },

  submitCreateBranch() {
    const orgId = document.getElementById('branch-org-id')?.value;
    const allOrgs = window.DB.getAll('organizations') || [];
    const code = (document.getElementById('branch-code')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('branch-name')?.value || '').trim();
    const type = document.getElementById('branch-type')?.value || 'AUTOMOBILE_WORKSHOP';
    const contact = (document.getElementById('branch-contact')?.value || '').trim();
    const mobile = (document.getElementById('branch-mobile')?.value || '').trim().replace(/\D/g, '');
    const address = (document.getElementById('branch-address')?.value || '').trim();
    const city = (document.getElementById('branch-city')?.value || '').trim();
    const state = (document.getElementById('branch-state')?.value || '').trim();
    const pincode = (document.getElementById('branch-pincode')?.value || '').trim();
    const gstApplicableVal = document.getElementById('branch-gst-applicable')?.value;
    const isGstApplicable = gstApplicableVal !== 'NO';
    const gstin = (document.getElementById('branch-gstin')?.value || '').trim().toUpperCase();
    const logo = (document.getElementById('branch-logo-data')?.value || '').trim();

    if (!code || !name) {
      window.State.showToast('Facility Code and Name are mandatory.', 'error');
      return;
    }
    if (mobile.length !== 10) {
      window.State.showToast('Mobile Number must be exactly 10 digits.', 'error');
      return;
    }

    if (allOrgs.length === 0) {
      alert('❌ Cannot Create Facility:\n\nNo active Organization found in Organisation Master.\n\nPlease create an Organization first in Organisation Master before creating a Facility.');
      return;
    }
    if (!orgId) {
      alert('❌ Cannot Create Facility:\n\nPlease select a Parent Organization. Facilities must be created under an Organization.');
      return;
    }

    const allBranches = window.DB.getAll('plants') || [];
    if (allBranches.some(b => b.code.toUpperCase() === code)) {
      window.State.showToast(`Facility Code "${code}" already exists.`, 'error');
      return;
    }

    const branchCode = code.startsWith('BRANCH-') ? code.replace('BRANCH-', '') : (code.startsWith('FACILITY-') ? code.replace('FACILITY-', 'FAC') : code);
    const cleanBranchCode = (branchCode.substring(0, 4) || (city || 'PUN').substring(0, 3)).toUpperCase();

    const newBranch = {
      id: `PLANT-${String(allBranches.length + 1).padStart(2, '0')}`,
      organization_id: orgId || (allOrgs[0] ? allOrgs[0].id : 'ORG-001'),
      company_id: 'COMP-01',
      code: code,
      branch_code: cleanBranchCode,
      name: name,
      plant_type: type,
      contact_person: contact,
      mobile_number: mobile,
      address: address,
      city: city,
      state: state,
      country: 'India',
      pincode: pincode,
      is_gst_applicable: isGstApplicable,
      gst_applicable: isGstApplicable,
      gstin: gstin,
      logo: logo,
      is_active: true,
      created_at: new Date().toISOString()
    };

    window.DB.insert('plants', newBranch);
    if (window.DB && typeof window.DB.syncPlantToBackend === 'function') {
      window.DB.syncPlantToBackend(newBranch, 'POST').catch(() => {});
    }
    window.DB.logAudit('FACILITY_CREATED', 'FACILITY', newBranch.id, `Created Facility ${name} (${code})`);
    if (window.App && typeof window.App.initFacilityDropdowns === 'function') {
      window.App.initFacilityDropdowns();
    }
    if (window.AuthModule && typeof window.AuthModule.populateBranchDropdown === 'function') {
      window.AuthModule.populateBranchDropdown();
    }
    window.State.closeModal();
    window.State.showToast(`Facility "${name}" created successfully!`, 'success');
    this.render();
  },

  showEditBranchModal(branchId) {
    const branch = window.DB.getById('plants', branchId);
    if (!branch) return;
    const allOrgs = window.DB.getAll('organizations') || [];
    const isGstApplicable = (branch.is_gst_applicable !== false && branch.is_gst_applicable !== 'false' && branch.is_gst_applicable !== 0 && branch.is_gst_applicable !== 'NO' && branch.gst_applicable !== false && branch.gst_applicable !== 'false' && branch.gst_applicable !== 0 && branch.gst_applicable !== 'NO');

    const contentHtml = `
      <form id="edit-branch-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitEditBranch('${branchId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Parent Organization ${allOrgs.length > 0 ? '<span style="color: var(--color-danger)">*</span>' : ''}</label>
            <select id="edit-branch-org-id" class="form-control" ${allOrgs.length === 0 ? '' : 'required'}>
              ${allOrgs.length === 0 
                ? '<option value="">No Organizations Available (Unassigned)</option>' 
                : allOrgs.map(o => {
                    const isInactive = o.status !== 'Active' || o.is_active === false;
                    return `<option value="${o.id}" ${o.id === branch.organization_id ? 'selected' : ''}>${o.code} - ${o.name} ${isInactive ? '(Inactive)' : ''}</option>`;
                  }).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Facility Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-branch-code" class="form-control" value="${branch.code}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Facility Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-branch-name" class="form-control" value="${branch.name}" required />
          </div>
          <div>
            <label class="form-label">Facility Type <span style="color: var(--color-danger)">*</span></label>
            <select id="edit-branch-type" class="form-control" required>
              <option value="AUTOMOBILE_WORKSHOP" ${branch.plant_type === 'AUTOMOBILE_WORKSHOP' ? 'selected' : ''}>Automobile Workshop</option>
              <option value="TWO_WHEELER_WORKSHOP" ${branch.plant_type === 'TWO_WHEELER_WORKSHOP' ? 'selected' : ''}>Two-Wheeler Workshop</option>
              <option value="MULTI_BRAND_CENTER" ${branch.plant_type === 'MULTI_BRAND_CENTER' ? 'selected' : ''}>Multi-Brand Service Center</option>
              <option value="COMMERCIAL_BRANCH" ${branch.plant_type === 'COMMERCIAL_BRANCH' ? 'selected' : ''}>Commercial Logistics Facility</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Contact Person</label>
            <input type="text" id="edit-branch-contact" class="form-control" value="${branch.contact_person || ''}" />
          </div>
          <div>
            <label class="form-label">Mobile Number (10 Digits)</label>
            <input type="tel" id="edit-branch-mobile" class="form-control" maxlength="10" value="${branch.mobile_number || ''}" oninput="this.value = this.value.replace(/\\D/g, '').slice(0,10)" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Address (Plot / Street / Area)</label>
            <input type="text" id="edit-branch-address" class="form-control" value="${branch.address || ''}" />
          </div>
          <div>
            <label class="form-label">City</label>
            <input type="text" id="edit-branch-city" class="form-control" value="${branch.city || 'Pune'}" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">State</label>
            <input type="text" id="edit-branch-state" class="form-control" value="${branch.state || 'Maharashtra'}" />
          </div>
          <div>
            <label class="form-label">Pincode</label>
            <input type="text" id="edit-branch-pincode" class="form-control" maxlength="6" value="${branch.pincode || ''}" placeholder="411001" oninput="this.value = this.value.replace(/\\D/g, '').slice(0,6)" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; background: rgba(0,0,0,0.02); padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-subtle);">
          <div>
            <label class="form-label" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span><strong>GST Applicable</strong> <span style="color: var(--color-danger)">*</span></span>
              <span id="edit-branch-gst-badge" class="badge ${isGstApplicable ? 'badge-success' : 'badge-subtle'}" style="font-size: 10px; padding: 1.5px 7px;">
                ${isGstApplicable ? '✓ GST Applicable' : '✕ Non-GST Facility'}
              </span>
            </label>
            <select id="edit-branch-gst-applicable" class="form-control" onchange="window.OrgLocationModule.onGstApplicableChange(this.value, 'edit-branch-gstin', 'edit-branch-gst-badge')">
              <option value="YES" ${isGstApplicable ? 'selected' : ''}>Yes (GST Applicable for this Facility)</option>
              <option value="NO" ${!isGstApplicable ? 'selected' : ''}>No (GST Not Applicable for this Facility)</option>
            </select>
            <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px; line-height: 1.3;">
              ${isGstApplicable ? 'GST rates & taxes will apply to all transactions in this facility.' : 'System will not apply GST for this facility (all bills/estimates 0% tax).'}
            </div>
          </div>
          <div>
            <label class="form-label" style="margin-bottom: 4px;">GSTIN (Optional)</label>
            <input type="text" id="edit-branch-gstin" class="form-control" maxlength="15" value="${branch.gstin || ''}" style="text-transform: uppercase; font-family: var(--font-mono); ${!isGstApplicable ? 'opacity: 0.6;' : ''}" placeholder="${isGstApplicable ? 'Optional (e.g. 27AAAAA0000A1Z5)' : 'Not applicable when GST is No'}" />
            <div id="edit-branch-gstin-hint" style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px; line-height: 1.3;">
              ${isGstApplicable ? '15-character GST identification number if registered.' : 'Ignored when GST Applicable is set to No.'}
            </div>
          </div>
        </div>

        <!-- Facility Logo Upload Section -->
        <div>
          <label class="form-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span>Facility Logo (Optional)</span>
            <span style="font-size: 11px; color: var(--text-muted);">PNG, JPG, SVG or WEBP (Max 2MB)</span>
          </label>
          <div style="display: flex; align-items: center; gap: 14px; background: rgba(0,0,0,0.02); border: 1.5px dashed var(--border-medium); border-radius: 6px; padding: 10px 14px;">
            <div id="facility-logo-preview-container" style="width: 52px; height: 52px; border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; background: #fff; overflow: hidden; flex-shrink: 0;">
              ${(branch.logo || branch.logo_url) ? `
                <img id="facility-logo-preview" src="${branch.logo || branch.logo_url}" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo" />
              ` : `
                <span id="facility-logo-placeholder" style="font-size: 24px;">🏢</span>
              `}
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="file" id="facility-logo-file" accept="image/*" style="display: none;" onchange="window.OrgLocationModule.handleFacilityLogoUpload(event, 'edit-branch-logo-data', 'facility-logo-preview-container')" />
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('facility-logo-file').click()">
                  📁 Choose Logo Image
                </button>
                <button type="button" id="facility-logo-remove-btn" class="btn btn-sm" style="color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.3); background: transparent; display: ${(branch.logo || branch.logo_url) ? 'inline-flex' : 'none'};" onclick="window.OrgLocationModule.removeFacilityLogo('edit-branch-logo-data', 'facility-logo-preview-container')">
                  ✕ Remove
                </button>
              </div>
              <input type="hidden" id="edit-branch-logo-data" value="${branch.logo || branch.logo_url || ''}" />
              <div style="font-size: 11px; color: var(--text-muted);">This logo will appear on Tax Invoices, Receipts, and Estimate Quotations.</div>
            </div>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitEditBranch('${branchId}')">Update Facility</button>
      </div>
    `;

    window.State.showModal({
      title: `Edit Facility: ${branch.name}`,
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '650px'
    });
  },

  onGstApplicableChange(val, gstinInputId, badgeId) {
    const isYes = val === 'YES';
    const gstinEl = document.getElementById(gstinInputId);
    const badgeEl = document.getElementById(badgeId);
    if (badgeEl) {
      badgeEl.className = `badge ${isYes ? 'badge-success' : 'badge-subtle'}`;
      badgeEl.innerText = isYes ? '✓ GST Applicable' : '✕ Non-GST Facility';
    }
    if (gstinEl) {
      if (!isYes) {
        gstinEl.placeholder = 'Not applicable when GST is No';
        gstinEl.style.opacity = '0.6';
      } else {
        gstinEl.placeholder = 'Optional (e.g. 27AAAAA0000A1Z5)';
        gstinEl.style.opacity = '1';
      }
    }
    const hintEl = document.getElementById(`${gstinInputId}-hint`);
    if (hintEl) {
      hintEl.innerText = isYes 
        ? '15-character GST identification number if registered.' 
        : 'Ignored when GST Applicable is set to No.';
    }
  },

  handleFacilityLogoUpload(event, targetHiddenId = 'edit-branch-logo-data', targetPreviewId = 'facility-logo-preview-container') {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.State.showToast('Please select a valid image file (PNG, JPG, SVG, WEBP).', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      window.State.showToast('Image size exceeds 2MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const hiddenInput = document.getElementById(targetHiddenId);
      if (hiddenInput) hiddenInput.value = dataUrl;

      const previewContainer = document.getElementById(targetPreviewId);
      if (previewContainer) {
        previewContainer.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px;" alt="Logo" />`;
      }

      const removeBtn = document.getElementById('facility-logo-remove-btn');
      if (removeBtn) removeBtn.style.display = 'inline-flex';
    };
    reader.readAsDataURL(file);
  },

  removeFacilityLogo(targetHiddenId = 'edit-branch-logo-data', targetPreviewId = 'facility-logo-preview-container') {
    const hiddenInput = document.getElementById(targetHiddenId);
    if (hiddenInput) hiddenInput.value = '';

    const previewContainer = document.getElementById(targetPreviewId);
    if (previewContainer) {
      previewContainer.innerHTML = '<span style="font-size: 24px;">🏢</span>';
    }

    const fileInput = document.getElementById('facility-logo-file') || document.getElementById('add-facility-logo-file');
    if (fileInput) fileInput.value = '';

    const removeBtn = document.getElementById('facility-logo-remove-btn');
    if (removeBtn) removeBtn.style.display = 'none';
  },

  submitEditBranch(branchId) {
    const orgId = document.getElementById('edit-branch-org-id')?.value;
    const code = (document.getElementById('edit-branch-code')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('edit-branch-name')?.value || '').trim();
    const type = document.getElementById('edit-branch-type')?.value;
    const contact = (document.getElementById('edit-branch-contact')?.value || '').trim();
    const mobile = (document.getElementById('edit-branch-mobile')?.value || '').trim().replace(/\D/g, '');
    const address = (document.getElementById('edit-branch-address')?.value || '').trim();
    const city = (document.getElementById('edit-branch-city')?.value || '').trim();
    const state = (document.getElementById('edit-branch-state')?.value || '').trim();
    const pincode = (document.getElementById('edit-branch-pincode')?.value || '').trim();
    const gstApplicableVal = document.getElementById('edit-branch-gst-applicable')?.value;
    const isGstApplicable = gstApplicableVal !== 'NO';
    const gstin = (document.getElementById('edit-branch-gstin')?.value || '').trim().toUpperCase();
    const logo = (document.getElementById('edit-branch-logo-data')?.value || '').trim();

    if (!orgId) {
      alert('❌ Cannot Update Facility:\n\nPlease select a Parent Organization. Facilities must be created and linked under an Organization.');
      return;
    }
    if (!code || !name) {
      window.State.showToast('Facility Code and Name are mandatory.', 'error');
      return;
    }
    if (mobile && mobile.length !== 10) {
      window.State.showToast('Mobile Number must be 10 digits.', 'error');
      return;
    }

    const branchCode = code.startsWith('BRANCH-') ? code.replace('BRANCH-', '') : (code.startsWith('FACILITY-') ? code.replace('FACILITY-', 'FAC') : code);
    const cleanBranchCode = (branchCode.substring(0, 4) || (city || 'PUN').substring(0, 3)).toUpperCase();

    const updatedData = {
      organization_id: orgId,
      code: code,
      branch_code: cleanBranchCode,
      name: name,
      plant_type: type,
      contact_person: contact,
      mobile_number: mobile,
      address: address,
      city: city,
      state: state,
      pincode: pincode,
      is_gst_applicable: isGstApplicable,
      gst_applicable: isGstApplicable,
      gstin: gstin,
      logo: logo,
      modified_at: new Date().toISOString()
    };

    if (window.DB && typeof window.DB.updatePlant === 'function') {
      window.DB.updatePlant(branchId, updatedData);
    } else {
      window.DB.update('plants', branchId, updatedData);
    }

    window.DB.logAudit('FACILITY_UPDATED', 'FACILITY', branchId, `Updated Facility ${name}`);
    if (window.App && typeof window.App.initFacilityDropdowns === 'function') {
      window.App.initFacilityDropdowns();
    }
    if (window.AuthModule && typeof window.AuthModule.populateBranchDropdown === 'function') {
      window.AuthModule.populateBranchDropdown();
    }
    window.State.closeModal();
    window.State.showToast(`Facility "${name}" updated successfully!`, 'success');
    this.render();
  },

  toggleBranchStatus(branchId) {
    const branch = window.DB.getById('plants', branchId);
    if (!branch) return;
    const newStatus = !branch.is_active;
    window.DB.update('plants', branchId, { is_active: newStatus });
    if (window.AuthModule && typeof window.AuthModule.populateBranchDropdown === 'function') {
      window.AuthModule.populateBranchDropdown();
    }
    window.DB.logAudit('FACILITY_STATUS_TOGGLED', 'FACILITY', branchId, `Set status to ${newStatus ? 'Active' : 'Inactive'}`);
    window.State.showToast(`Facility "${branch.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`, 'info');
    this.render();
  },

  deleteBranch(branchId) {
    const branch = window.DB.getById('plants', branchId);
    if (!branch) return;

    const allStores = (window.DB.getAll('warehouses') || []).filter(s => 
      s.plant_id === branch.id || s.facility_id === branch.id ||
      (branch.code && (s.plant_id === branch.code || s.facility_id === branch.code))
    );

    if (allStores.length > 0) {
      const storeNames = allStores.map(s => `• ${s.name || s.code || s.id} (${s.code || s.id})`).slice(0, 5).join('\n');
      const extraCount = allStores.length > 5 ? `\n...and ${allStores.length - 5} more` : '';
      const msg = `Cannot delete facility "${branch.name}" (${branch.code}).\n\nThere are ${allStores.length} store(s) created under this facility:\n${storeNames}${extraCount}\n\nPlease delete or reassign all associated stores in Store Master before deleting this facility.`;

      if (window.State && window.State.showToast) {
        window.State.showToast(`Cannot delete facility: ${allStores.length} store(s) are currently created under it.`, 'error');
      }
      alert(msg);
      return;
    }

    if (!confirm(`Are you sure you want to delete facility "${branch.name}" (${branch.code})?`)) return;

    window.DB.delete('plants', branchId);
    if (window.DB.syncPlantToBackend) {
      window.DB.syncPlantToBackend({ id: branchId }, 'DELETE');
    }
    if (window.DB.logAudit) {
      window.DB.logAudit('FACILITY_DELETED', 'FACILITY', branchId, `Deleted facility ${branch.name}`);
    }
    if (window.AuthModule && typeof window.AuthModule.populateBranchDropdown === 'function') {
      window.AuthModule.populateBranchDropdown();
    }
    if (window.State && window.State.showToast) {
      window.State.showToast(`Facility ${branch.code} removed successfully.`, 'success');
    }
    this.render();
  },

  clearAllBranches() {
    const allBranches = window.DB.getAll('plants') || [];
    if (allBranches.length === 0) {
      if (window.State && window.State.showToast) {
        window.State.showToast('No facilities to remove.', 'info');
      }
      return;
    }

    const allStores = window.DB.getAll('warehouses') || [];
    const branchesWithStores = allBranches.filter(b => 
      allStores.some(s => s.plant_id === b.id || s.facility_id === b.id || (b.code && (s.plant_id === b.code || s.facility_id === b.code)))
    );

    if (branchesWithStores.length > 0) {
      const facilityNames = branchesWithStores.map(b => `• ${b.name} (${b.code})`).slice(0, 5).join('\n');
      const extraCount = branchesWithStores.length > 5 ? `\n...and ${branchesWithStores.length - 5} more` : '';
      const msg = `Cannot remove facilities: ${branchesWithStores.length} facility(ies) have store(s) created under them:\n${facilityNames}${extraCount}\n\nPlease delete or reassign all associated stores in Store Master before deleting facilities.`;

      if (window.State && window.State.showToast) {
        window.State.showToast(`Cannot delete facilities: stores are created under them.`, 'error');
      }
      alert(msg);
      return;
    }

    if (confirm(`Are you sure you want to remove ALL ${allBranches.length} facility(ies) from the facility master?\n\nThis will remove all facilities from the facility master.`)) {
      window.DB.clear('plants');
      if (typeof fetch === 'function') {
        fetch('/api/plants', { method: 'DELETE' }).catch(() => {});
      }

      if (window.DB.logAudit) {
        window.DB.logAudit('ALL_FACILITIES_DELETED', 'FACILITY', 'ALL', 'Removed all facilities from facility master');
      }
      if (window.AuthModule && typeof window.AuthModule.populateBranchDropdown === 'function') {
        window.AuthModule.populateBranchDropdown();
      }
      if (window.State && window.State.showToast) {
        window.State.showToast('All facilities have been removed from facility master.', 'success');
      }
      this.render();
    }
  },

  // --- 3. Store Modal ---
  showAddStoreModal() {
    const allBranches = window.DB.getAll('plants') || [];
    const allStores = window.DB.getAll('warehouses') || [];
    const nextCode = `STR-${String(allStores.length + 1).padStart(2, '0')}`;

    const contentHtml = `
      <form id="add-store-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitCreateStore();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Parent Facility <span style="color: var(--color-danger)">*</span></label>
            <select id="store-branch-id" class="form-control" required>
              ${allBranches.map(b => {
                const isBranchActive = window.DB.isPlantActive(b.id);
                return `<option value="${b.id}">${b.code} - ${b.name} ${!isBranchActive ? '(Inactive Org)' : ''}</option>`;
              }).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Store Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="store-code" class="form-control" value="${nextCode}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Store / Warehouse Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="store-name" class="form-control" placeholder="e.g. Spare Parts & Quick Service Store" required />
          </div>
          <div>
            <label class="form-label">Store Type <span style="color: var(--color-danger)">*</span></label>
            <select id="store-type" class="form-control" required>
              <option value="SPARE_PARTS" selected>Spare Parts Store</option>
              <option value="RAW_MATERIAL">Raw Materials Store</option>
              <option value="WIP_STORE">WIP Buffer Store</option>
              <option value="FINISHED_GOODS">Finished Goods Hub</option>
              <option value="QUARANTINE">Quarantine & Hold Bay</option>
              <option value="TOOL_CRIB">Tool Crib & Equipment</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Volumetric Capacity (CBM)</label>
            <input type="number" id="store-capacity" class="form-control" value="2500" min="1" required />
          </div>
          <div>
            <label class="form-label">Store Manager / Supervisor</label>
            <input type="text" id="store-manager" class="form-control" placeholder="Manager Name" />
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitCreateStore()">Save Store</button>
      </div>
    `;

    window.State.showModal({
      title: '🏬 Register New Store (Store Master)',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '620px'
    });
  },

  submitCreateStore() {
    const branchId = document.getElementById('store-branch-id')?.value;
    const code = (document.getElementById('store-code')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('store-name')?.value || '').trim();
    const type = document.getElementById('store-type')?.value || 'SPARE_PARTS';
    const capacity = parseInt(document.getElementById('store-capacity')?.value, 10) || 2000;
    const manager = (document.getElementById('store-manager')?.value || '').trim() || 'Store Lead';

    if (!code || !name) {
      window.State.showToast('Store Code and Name are mandatory.', 'error');
      return;
    }

    const allStores = window.DB.getAll('warehouses') || [];
    if (allStores.some(s => s.code.toUpperCase() === code)) {
      window.State.showToast(`Store Code "${code}" already exists.`, 'error');
      return;
    }

    const newStore = {
      id: `WH-${code}`,
      plant_id: branchId,
      code: code,
      name: name,
      warehouse_type: type,
      capacity_cbm: capacity,
      occupied_cbm: 0,
      manager: manager,
      status: 'Active',
      created_at: new Date().toISOString()
    };

    window.DB.insert('warehouses', newStore);
    window.DB.logAudit('STORE_CREATED', 'WAREHOUSE', newStore.id, `Created Store ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`Store "${name}" created successfully!`, 'success');
    this.render();
  },

  showEditStoreModal(storeId) {
    const store = window.DB.getById('warehouses', storeId);
    if (!store) return;
    const allBranches = window.DB.getAll('plants') || [];

    const contentHtml = `
      <form id="edit-store-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitEditStore('${storeId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Parent Facility <span style="color: var(--color-danger)">*</span></label>
            <select id="edit-store-branch-id" class="form-control" required>
              ${allBranches.map(b => {
                const isBranchActive = window.DB.isPlantActive(b.id);
                return `<option value="${b.id}" ${b.id === store.plant_id ? 'selected' : ''}>${b.code} - ${b.name} ${!isBranchActive ? '(Inactive Org)' : ''}</option>`;
              }).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Store Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-store-code" class="form-control" value="${store.code}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Store Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-store-name" class="form-control" value="${store.name}" required />
          </div>
          <div>
            <label class="form-label">Store Type <span style="color: var(--color-danger)">*</span></label>
            <select id="edit-store-type" class="form-control" required>
              <option value="SPARE_PARTS" ${store.warehouse_type === 'SPARE_PARTS' ? 'selected' : ''}>Spare Parts Store</option>
              <option value="RAW_MATERIAL" ${store.warehouse_type === 'RAW_MATERIAL' ? 'selected' : ''}>Raw Materials Store</option>
              <option value="WIP_STORE" ${store.warehouse_type === 'WIP_STORE' ? 'selected' : ''}>WIP Buffer Store</option>
              <option value="FINISHED_GOODS" ${store.warehouse_type === 'FINISHED_GOODS' ? 'selected' : ''}>Finished Goods Hub</option>
              <option value="QUARANTINE" ${store.warehouse_type === 'QUARANTINE' ? 'selected' : ''}>Quarantine & Hold Bay</option>
              <option value="TOOL_CRIB" ${store.warehouse_type === 'TOOL_CRIB' ? 'selected' : ''}>Tool Crib & Equipment</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Capacity (CBM)</label>
            <input type="number" id="edit-store-capacity" class="form-control" value="${store.capacity_cbm || 2000}" min="1" required />
          </div>
          <div>
            <label class="form-label">Store Manager</label>
            <input type="text" id="edit-store-manager" class="form-control" value="${store.manager || ''}" />
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitEditStore('${storeId}')">Update Store</button>
      </div>
    `;

    window.State.showModal({
      title: `🏬 Edit Store: ${store.name}`,
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '620px'
    });
  },

  submitEditStore(storeId) {
    const branchId = document.getElementById('edit-store-branch-id')?.value;
    const code = (document.getElementById('edit-store-code')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('edit-store-name')?.value || '').trim();
    const type = document.getElementById('edit-store-type')?.value;
    const capacity = parseInt(document.getElementById('edit-store-capacity')?.value, 10) || 2000;
    const manager = (document.getElementById('edit-store-manager')?.value || '').trim();

    if (!code || !name) {
      window.State.showToast('Store Code and Name are mandatory.', 'error');
      return;
    }

    window.DB.update('warehouses', storeId, {
      plant_id: branchId,
      code: code,
      name: name,
      warehouse_type: type,
      capacity_cbm: capacity,
      manager: manager
    });

    window.DB.logAudit('STORE_UPDATED', 'WAREHOUSE', storeId, `Updated Store ${name}`);
    window.State.closeModal();
    window.State.showToast(`Store "${name}" updated successfully!`, 'success');
    this.render();
  },

  // --- 4. Storage Location Modal ---
  showAddStorageLocationModal() {
    const allStores = window.DB.getAll('warehouses') || [];
    const allLocations = window.DB.getAll('zones') || [];
    const nextCode = `LOC-Z-${String(allLocations.length + 1).padStart(2, '0')}`;

    const contentHtml = `
      <form id="add-location-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitCreateStorageLocation();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Parent Store <span style="color: var(--color-danger)">*</span></label>
            <select id="loc-store-id" class="form-control" required>
              ${allStores.map(s => `<option value="${s.id}">${s.code} - ${s.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Location Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="loc-code" class="form-control" value="${nextCode}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
        </div>

        <div>
          <label class="form-label">Storage Location Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="loc-name" class="form-control" placeholder="e.g. Zone D - High-Velocity Fast Pick Staging" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Location Classification</label>
            <select id="loc-type" class="form-control">
              <option value="HIGH_DENSITY_RACK">High-Density Rack Storage</option>
              <option value="BULK_STORAGE">Bulk Floor Pallet Storage</option>
              <option value="SHELF_STORAGE">Small Parts Multi-Tier Shelf</option>
              <option value="DISPATCH_STAGING">Outbound Staging Bay</option>
              <option value="QUARANTINE_HOLD">Quarantine & Inspection Bay</option>
            </select>
          </div>
          <div>
            <label class="form-label">Status</label>
            <select id="loc-status" class="form-control">
              <option value="Active" selected>Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitCreateStorageLocation()">Save Location</button>
      </div>
    `;

    window.State.showModal({
      title: '🌐 Register Storage Location (Storage Location Master)',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '580px'
    });
  },

  submitCreateStorageLocation() {
    const storeId = document.getElementById('loc-store-id')?.value;
    const code = (document.getElementById('loc-code')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('loc-name')?.value || '').trim();
    const type = document.getElementById('loc-type')?.value;
    const status = document.getElementById('loc-status')?.value || 'Active';

    if (!code || !name) {
      window.State.showToast('Location Code and Name are mandatory.', 'error');
      return;
    }

    const allLocations = window.DB.getAll('zones') || [];
    const newLoc = {
      id: `ZONE-${Date.now().toString(36).toUpperCase()}`,
      warehouse_id: storeId,
      code: code,
      name: name,
      location_type: type,
      status: status,
      created_at: new Date().toISOString()
    };

    window.DB.insert('zones', newLoc);
    window.DB.logAudit('LOCATION_CREATED', 'ZONE', newLoc.id, `Created Storage Location ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`Storage Location "${name}" created successfully!`, 'success');
    this.render();
  },

  showEditStorageLocationModal(locId) {
    const loc = window.DB.getById('zones', locId);
    if (!loc) return;
    const allStores = window.DB.getAll('warehouses') || [];

    const contentHtml = `
      <form id="edit-location-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitEditStorageLocation('${locId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Parent Store <span style="color: var(--color-danger)">*</span></label>
            <select id="edit-loc-store-id" class="form-control" required>
              ${allStores.map(s => `<option value="${s.id}" ${s.id === loc.warehouse_id ? 'selected' : ''}>${s.code} - ${s.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Location Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-loc-code" class="form-control" value="${loc.code}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
        </div>

        <div>
          <label class="form-label">Storage Location Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="edit-loc-name" class="form-control" value="${loc.name}" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Classification</label>
            <select id="edit-loc-type" class="form-control">
              <option value="HIGH_DENSITY_RACK" ${loc.location_type === 'HIGH_DENSITY_RACK' ? 'selected' : ''}>High-Density Rack Storage</option>
              <option value="BULK_STORAGE" ${loc.location_type === 'BULK_STORAGE' ? 'selected' : ''}>Bulk Floor Pallet Storage</option>
              <option value="SHELF_STORAGE" ${loc.location_type === 'SHELF_STORAGE' ? 'selected' : ''}>Small Parts Multi-Tier Shelf</option>
              <option value="DISPATCH_STAGING" ${loc.location_type === 'DISPATCH_STAGING' ? 'selected' : ''}>Outbound Staging Bay</option>
              <option value="QUARANTINE_HOLD" ${loc.location_type === 'QUARANTINE_HOLD' ? 'selected' : ''}>Quarantine & Inspection Bay</option>
            </select>
          </div>
          <div>
            <label class="form-label">Status</label>
            <select id="edit-loc-status" class="form-control">
              <option value="Active" ${loc.status !== 'Inactive' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${loc.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitEditStorageLocation('${locId}')">Update Location</button>
      </div>
    `;

    window.State.showModal({
      title: `🌐 Edit Storage Location: ${loc.name}`,
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '580px'
    });
  },

  submitEditStorageLocation(locId) {
    const storeId = document.getElementById('edit-loc-store-id')?.value;
    const code = (document.getElementById('edit-loc-code')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('edit-loc-name')?.value || '').trim();
    const type = document.getElementById('edit-loc-type')?.value;
    const status = document.getElementById('edit-loc-status')?.value;

    window.DB.update('zones', locId, {
      warehouse_id: storeId,
      code: code,
      name: name,
      location_type: type,
      status: status
    });

    window.DB.logAudit('LOCATION_UPDATED', 'ZONE', locId, `Updated Location ${name}`);
    window.State.closeModal();
    window.State.showToast(`Storage Location "${name}" updated!`, 'success');
    this.render();
  },

  // --- 5. Rack Modal ---
  showAddRackModal() {
    const allStores = window.DB.getAll('warehouses') || [];
    const allLocations = window.DB.getAll('zones') || [];
    const allRacks = window.DB.getAll('racks') || [];
    const nextCode = `R-${String(allRacks.length + 1).padStart(2, '0')}`;

    const contentHtml = `
      <form id="add-rack-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitCreateRack();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Parent Store <span style="color: var(--color-danger)">*</span></label>
            <select id="rack-store-id" class="form-control" required onchange="window.OrgLocationModule.onRackStoreChange(this.value)">
              ${allStores.map(s => `<option value="${s.id}">${s.code} - ${s.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Storage Location / Zone <span style="color: var(--color-danger)">*</span></label>
            <select id="rack-location-id" class="form-control" required>
              ${allLocations.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 12px;">
          <div>
            <label class="form-label">Rack Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="rack-code" class="form-control" value="${nextCode}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
          <div>
            <label class="form-label">Rack Name / Identifier <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="rack-name" class="form-control" placeholder="e.g. Heavy Duty Pallet Rack 04" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Rack Type</label>
            <select id="rack-type" class="form-control">
              <option value="Selective Pallet" selected>Selective Pallet Rack</option>
              <option value="Cantilever">Cantilever Heavy Bar Rack</option>
              <option value="Bin Shelving">Multi-Tier Bin Shelving</option>
              <option value="Drive-In">Drive-In High Density</option>
            </select>
          </div>
          <div>
            <label class="form-label">Max Load (kg)</label>
            <input type="number" id="rack-weight" class="form-control" value="3000" min="100" />
          </div>
          <div>
            <label class="form-label">Total Shelves</label>
            <input type="number" id="rack-shelves" class="form-control" value="2" min="1" max="10" />
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitCreateRack()">Save Rack</button>
      </div>
    `;

    window.State.showModal({
      title: '🗄️ Register New Rack (Rack Master)',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '620px'
    });
  },

  onRackStoreChange(storeId) {
    const allLocations = window.DB.getAll('zones') || [];
    const filtered = allLocations.filter(l => l.warehouse_id === storeId);
    const sel = document.getElementById('rack-location-id');
    if (sel) {
      sel.innerHTML = filtered.length > 0 
        ? filtered.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('')
        : allLocations.map(l => `<option value="${l.id}">${l.code} - ${l.name}</option>`).join('');
    }
  },

  submitCreateRack() {
    const storeId = document.getElementById('rack-store-id')?.value;
    const locId = document.getElementById('rack-location-id')?.value;
    const code = (document.getElementById('rack-code')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('rack-name')?.value || '').trim();
    const type = document.getElementById('rack-type')?.value;
    const weight = parseInt(document.getElementById('rack-weight')?.value, 10) || 3000;
    const shelvesCount = parseInt(document.getElementById('rack-shelves')?.value, 10) || 2;

    if (!code || !name) {
      window.State.showToast('Rack Code and Name are mandatory.', 'error');
      return;
    }

    const allRacks = window.DB.getAll('racks') || [];
    const newRack = {
      id: `RCK-${Date.now().toString(36).toUpperCase()}`,
      warehouse_id: storeId,
      storage_location_id: locId,
      code: code,
      name: name,
      rack_type: type,
      max_weight_capacity_kg: weight,
      total_shelves: shelvesCount,
      status: 'Active',
      created_at: new Date().toISOString()
    };

    window.DB.insert('racks', newRack);

    // Auto-create initial shelves for the rack
    for (let s = 1; s <= shelvesCount; s++) {
      const shelfCode = `S-${String(s).padStart(2, '0')}`;
      window.DB.insert('shelves', {
        id: `SHF-${newRack.id}-${s}`,
        rack_id: newRack.id,
        warehouse_id: storeId,
        code: shelfCode,
        level_number: s,
        weight_limit_kg: Math.round(weight / shelvesCount),
        status: 'Active',
        created_at: new Date().toISOString()
      });
    }

    window.DB.logAudit('RACK_CREATED', 'RACK', newRack.id, `Created Rack ${name} (${code}) with ${shelvesCount} shelves`);
    window.State.closeModal();
    window.State.showToast(`Rack "${name}" and ${shelvesCount} shelves created successfully!`, 'success');
    this.render();
  },

  showEditRackModal(rackId) {
    const rack = window.DB.getById('racks', rackId);
    if (!rack) return;
    const allStores = window.DB.getAll('warehouses') || [];
    const allLocations = window.DB.getAll('zones') || [];

    const contentHtml = `
      <form id="edit-rack-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitEditRack('${rackId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Parent Store</label>
            <select id="edit-rack-store-id" class="form-control">
              ${allStores.map(s => `<option value="${s.id}" ${s.id === rack.warehouse_id ? 'selected' : ''}>${s.code} - ${s.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Rack Code</label>
            <input type="text" id="edit-rack-code" class="form-control" value="${rack.code}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
        </div>

        <div>
          <label class="form-label">Rack Name</label>
          <input type="text" id="edit-rack-name" class="form-control" value="${rack.name}" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Max Load (kg)</label>
            <input type="number" id="edit-rack-weight" class="form-control" value="${rack.max_weight_capacity_kg || 3000}" />
          </div>
          <div>
            <label class="form-label">Status</label>
            <select id="edit-rack-status" class="form-control">
              <option value="Active" ${rack.status !== 'Inactive' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${rack.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitEditRack('${rackId}')">Update Rack</button>
      </div>
    `;

    window.State.showModal({
      title: `🗄️ Edit Rack: ${rack.name}`,
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '580px'
    });
  },

  submitEditRack(rackId) {
    const code = (document.getElementById('edit-rack-code')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('edit-rack-name')?.value || '').trim();
    const weight = parseInt(document.getElementById('edit-rack-weight')?.value, 10) || 3000;
    const status = document.getElementById('edit-rack-status')?.value;

    window.DB.update('racks', rackId, {
      code: code,
      name: name,
      max_weight_capacity_kg: weight,
      status: status
    });

    window.DB.logAudit('RACK_UPDATED', 'RACK', rackId, `Updated Rack ${name}`);
    window.State.closeModal();
    window.State.showToast(`Rack "${name}" updated!`, 'success');
    this.render();
  },

  // --- 6. Shelf Modal ---
  showAddShelfModal() {
    const allRacks = window.DB.getAll('racks') || [];
    const allShelves = window.DB.getAll('shelves') || [];
    const nextCode = `S-${String(allShelves.length + 1).padStart(2, '0')}`;

    const contentHtml = `
      <form id="add-shelf-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitCreateShelf();" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label">Parent Rack <span style="color: var(--color-danger)">*</span></label>
          <select id="shelf-rack-id" class="form-control" required>
            ${allRacks.map(r => `<option value="${r.id}">${r.code} - ${r.name}</option>`).join('')}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Shelf Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="shelf-code" class="form-control" value="${nextCode}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
          <div>
            <label class="form-label">Level Number <span style="color: var(--color-danger)">*</span></label>
            <input type="number" id="shelf-level" class="form-control" value="1" min="1" max="10" required />
          </div>
        </div>

        <div>
          <label class="form-label">Weight Limit (kg)</label>
          <input type="number" id="shelf-weight" class="form-control" value="1500" min="10" />
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitCreateShelf()">Save Shelf</button>
      </div>
    `;

    window.State.showModal({
      title: '📑 Register New Shelf (Shelf Master)',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '520px'
    });
  },

  submitCreateShelf() {
    const rackId = document.getElementById('shelf-rack-id')?.value;
    const code = (document.getElementById('shelf-code')?.value || '').trim().toUpperCase();
    const level = parseInt(document.getElementById('shelf-level')?.value, 10) || 1;
    const weight = parseInt(document.getElementById('shelf-weight')?.value, 10) || 1500;

    const rack = window.DB.getById('racks', rackId);
    const newShelf = {
      id: `SHF-${Date.now().toString(36).toUpperCase()}`,
      rack_id: rackId,
      warehouse_id: rack ? rack.warehouse_id : 'WH-PUN-MAIN',
      code: code,
      level_number: level,
      weight_limit_kg: weight,
      status: 'Active',
      created_at: new Date().toISOString()
    };

    window.DB.insert('shelves', newShelf);
    window.DB.logAudit('SHELF_CREATED', 'SHELF', newShelf.id, `Created Shelf ${code} under Rack ${rack ? rack.code : ''}`);
    window.State.closeModal();
    window.State.showToast(`Shelf "${code}" registered successfully!`, 'success');
    this.render();
  },

  showEditShelfModal(shelfId) {
    const shelf = window.DB.getById('shelves', shelfId);
    if (!shelf) return;

    const contentHtml = `
      <form id="edit-shelf-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitEditShelf('${shelfId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Shelf Code</label>
            <input type="text" id="edit-shelf-code" class="form-control" value="${shelf.code}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
          <div>
            <label class="form-label">Level Number</label>
            <input type="number" id="edit-shelf-level" class="form-control" value="${shelf.level_number || 1}" min="1" max="10" />
          </div>
        </div>
        <div>
          <label class="form-label">Weight Limit (kg)</label>
          <input type="number" id="edit-shelf-weight" class="form-control" value="${shelf.weight_limit_kg || 1500}" />
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitEditShelf('${shelfId}')">Update Shelf</button>
      </div>
    `;

    window.State.showModal({
      title: `📑 Edit Shelf: ${shelf.code}`,
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '520px'
    });
  },

  submitEditShelf(shelfId) {
    const code = (document.getElementById('edit-shelf-code')?.value || '').trim().toUpperCase();
    const level = parseInt(document.getElementById('edit-shelf-level')?.value, 10) || 1;
    const weight = parseInt(document.getElementById('edit-shelf-weight')?.value, 10) || 1500;

    window.DB.update('shelves', shelfId, {
      code: code,
      level_number: level,
      weight_limit_kg: weight
    });

    window.DB.logAudit('SHELF_UPDATED', 'SHELF', shelfId, `Updated Shelf ${code}`);
    window.State.closeModal();
    window.State.showToast(`Shelf "${code}" updated!`, 'success');
    this.render();
  },

  // --- 7. Bin Modal ---
  showAddBinModal() {
    const allRacks = window.DB.getAll('racks') || [];
    const allShelves = window.DB.getAll('shelves') || [];
    const allStores = window.DB.getAll('warehouses') || [];
    const allBins = window.DB.getAll('bins') || [];
    const nextCode = `BIN-${String(allBins.length + 1).padStart(3, '0')}`;

    const contentHtml = `
      <form id="add-bin-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitCreateBin();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Parent Store <span style="color: var(--color-danger)">*</span></label>
            <select id="bin-store-id" class="form-control" required>
              ${allStores.map(s => `<option value="${s.id}">${s.code} - ${s.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Bin Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="bin-code" class="form-control" value="${nextCode}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Mounted Rack</label>
            <select id="bin-rack-id" class="form-control">
              ${allRacks.map(r => `<option value="${r.code}">${r.code} - ${r.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Shelf Level</label>
            <select id="bin-shelf-id" class="form-control">
              ${allShelves.map(s => `<option value="${s.code}">${s.code} (Tier ${s.level_number})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Slot ID</label>
            <input type="text" id="bin-slot" class="form-control" value="B-01" required style="text-transform: uppercase;" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Max Volumetric Capacity (CBM)</label>
            <input type="number" id="bin-vol" class="form-control" value="5" min="1" />
          </div>
          <div>
            <label class="form-label">Max Weight (kg)</label>
            <input type="number" id="bin-weight" class="form-control" value="1000" min="1" />
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitCreateBin()">Save Bin</button>
      </div>
    `;

    window.State.showModal({
      title: '📦 Register Storage Bin (Bin Master)',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '600px'
    });
  },

  submitCreateBin() {
    const storeId = document.getElementById('bin-store-id')?.value;
    const code = (document.getElementById('bin-code')?.value || '').trim().toUpperCase();
    const rack = document.getElementById('bin-rack-id')?.value || 'R-01';
    const shelf = document.getElementById('bin-shelf-id')?.value || 'S-01';
    const slot = (document.getElementById('bin-slot')?.value || 'B-01').trim().toUpperCase();
    const vol = parseFloat(document.getElementById('bin-vol')?.value) || 5;
    const weight = parseInt(document.getElementById('bin-weight')?.value, 10) || 1000;

    if (!code) {
      window.State.showToast('Bin Code is mandatory.', 'error');
      return;
    }

    const allBins = window.DB.getAll('bins') || [];
    if (allBins.some(b => b.code.toUpperCase() === code)) {
      window.State.showToast(`Bin Code "${code}" already exists.`, 'error');
      return;
    }

    const newBin = {
      id: `BIN-${Date.now().toString(36).toUpperCase()}`,
      warehouse_id: storeId,
      rack: rack,
      shelf: shelf,
      bin: slot,
      code: code,
      max_vol: vol,
      max_weight: weight,
      occupied_pct: 0,
      status: 'empty',
      created_at: new Date().toISOString()
    };

    window.DB.insert('bins', newBin);
    window.DB.logAudit('BIN_CREATED', 'BIN', newBin.id, `Created Bin ${code}`);
    window.State.closeModal();
    window.State.showToast(`Bin "${code}" created successfully!`, 'success');
    this.render();
  },

  showEditBinModal(binId) {
    const bin = window.DB.getById('bins', binId);
    if (!bin) return;

    const contentHtml = `
      <form id="edit-bin-form" onsubmit="event.preventDefault(); window.OrgLocationModule.submitEditBin('${binId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Bin Code</label>
            <input type="text" id="edit-bin-code" class="form-control" value="${bin.code}" required style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
          <div>
            <label class="form-label">Operational Status</label>
            <select id="edit-bin-status" class="form-control">
              <option value="empty" ${bin.status === 'empty' ? 'selected' : ''}>Empty</option>
              <option value="normal" ${bin.status === 'normal' ? 'selected' : ''}>Normal Occupancy</option>
              <option value="high" ${bin.status === 'high' ? 'selected' : ''}>High Occupancy</option>
              <option value="full" ${bin.status === 'full' ? 'selected' : ''}>Full</option>
              <option value="quarantine" ${bin.status === 'quarantine' ? 'selected' : ''}>Quarantine Hold</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Max Vol (CBM)</label>
            <input type="number" id="edit-bin-vol" class="form-control" value="${bin.max_vol || 5}" />
          </div>
          <div>
            <label class="form-label">Max Weight (kg)</label>
            <input type="number" id="edit-bin-weight" class="form-control" value="${bin.max_weight || 1000}" />
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.OrgLocationModule.submitEditBin('${binId}')">Update Bin</button>
      </div>
    `;

    window.State.showModal({
      title: `📦 Edit Bin: ${bin.code}`,
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '520px'
    });
  },

  submitEditBin(binId) {
    const code = (document.getElementById('edit-bin-code')?.value || '').trim().toUpperCase();
    const status = document.getElementById('edit-bin-status')?.value;
    const vol = parseFloat(document.getElementById('edit-bin-vol')?.value) || 5;
    const weight = parseInt(document.getElementById('edit-bin-weight')?.value, 10) || 1000;

    window.DB.update('bins', binId, {
      code: code,
      status: status,
      max_vol: vol,
      max_weight: weight
    });

    window.DB.logAudit('BIN_UPDATED', 'BIN', binId, `Updated Bin ${code}`);
    window.State.closeModal();
    window.State.showToast(`Bin "${code}" updated!`, 'success');
    this.render();
  },

  // ==========================================================================
  // FULL ENTERPRISE PHYSICAL HIERARCHY TREE MODAL
  // ==========================================================================
  showHierarchyTreeModal() {
    let allOrgs = window.DB.getAll('organizations') || [];
    if (allOrgs.length === 0) {
      const allCompanies = window.DB.getAll('companies') || [];
      if (allCompanies.length > 0) {
        allOrgs = allCompanies.map(c => ({
          id: c.id,
          code: c.code || 'COMP-01',
          name: c.name,
          status: c.is_active ? 'Active' : 'Inactive'
        }));
      } else {
        allOrgs = [{
          id: 'ORG-001',
          code: 'PAD-GRP',
          name: 'Patil Auto Dynamics & Multi-Brand Service Network Ltd.',
          status: 'Active'
        }];
      }
    }
    const allBranches = window.DB.getAll('plants') || [];
    const allStores = window.DB.getAll('warehouses') || [];
    const allLocations = window.DB.getAll('zones') || [];
    const allRacks = window.DB.getAll('racks') || [];
    const allShelves = window.DB.getAll('shelves') || [];
    const allBins = window.DB.getAll('bins') || [];

    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
          Interactive physical tree view showing the comprehensive multi-echelon layout from Enterprise Organization down to individual Storage Bins:
        </div>

        <div style="font-family: var(--font-mono); font-size: 11.5px; line-height: 1.8; color: var(--text-secondary); background: rgba(0,0,0,0.3); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; max-height: 65vh; overflow-y: auto;">
          ${allOrgs.map(org => {
            let orgBranches = allBranches.filter(b => b.organization_id === org.id || b.company_id === org.id);
            if (orgBranches.length === 0 && allBranches.length > 0) {
              orgBranches = allBranches;
            }

            return `
              <div style="margin-bottom: 12px;">
                <div style="font-weight: 700; color: var(--primary-300); font-size: 12.5px;">
                  🏢 [Organization]: ${org.code} - ${org.name} (${org.status})
                </div>

                ${orgBranches.length === 0 ? `
                  <div style="padding-left: 20px; color: var(--text-muted); font-style: italic;">
                    └── (No facilities assigned)
                  </div>
                ` : orgBranches.map((branch, bIdx) => {
                  const isLastBranch = bIdx === orgBranches.length - 1;
                  const branchStores = allStores.filter(s => s.plant_id === branch.id);

                  return `
                    <div style="padding-left: 18px; margin-top: 4px;">
                      <div style="color: var(--color-info); font-weight: 600;">
                        ${isLastBranch ? '└──' : '├──'} [Facility]: ${branch.code} - ${branch.name} (${branch.city})
                      </div>

                      ${branchStores.length === 0 ? `
                        <div style="padding-left: 24px; color: var(--text-muted); font-style: italic;">
                          └── (No stores created)
                        </div>
                      ` : branchStores.map((store, sIdx) => {
                        const isLastStore = sIdx === branchStores.length - 1;
                        const storeLocs = allLocations.filter(l => l.warehouse_id === store.id);

                        return `
                          <div style="padding-left: 24px; margin-top: 2px;">
                            <div style="color: var(--color-success); font-weight: 600;">
                              ${isLastStore ? '└──' : '├──'} 🏬 [Store]: ${store.code} - ${store.name}
                            </div>

                            ${storeLocs.length === 0 ? `
                              <div style="padding-left: 24px; color: var(--text-muted); font-style: italic;">
                                └── 🌐 [Storage Location]: General Open Area
                              </div>
                            ` : storeLocs.map((loc, lIdx) => {
                              const isLastLoc = lIdx === storeLocs.length - 1;
                              const locRacks = allRacks.filter(r => r.storage_location_id === loc.id);

                              return `
                                <div style="padding-left: 24px;">
                                  <div style="color: var(--color-warning);">
                                    ${isLastLoc ? '└──' : '├──'} 🌐 [Location]: ${loc.code} - ${loc.name}
                                  </div>

                                  ${locRacks.length === 0 ? `
                                    <div style="padding-left: 20px; color: var(--text-muted); font-size: 10.5px;">
                                      └── 🗄️ Standard Floor Matrix
                                    </div>
                                  ` : locRacks.map((rack, rIdx) => {
                                    const isLastRack = rIdx === locRacks.length - 1;
                                    const rackShelves = allShelves.filter(sh => sh.rack_id === rack.id);

                                    return `
                                      <div style="padding-left: 20px;">
                                        <div style="color: #f472b6;">
                                          ${isLastRack ? '└──' : '├──'} 🗄️ [Rack]: ${rack.code} - ${rack.name}
                                        </div>

                                        ${rackShelves.map((shelf, shIdx) => {
                                          const isLastShelf = shIdx === rackShelves.length - 1;
                                          const shelfBins = allBins.filter(b => b.shelf_id === shelf.id || (b.rack === rack.code && b.shelf === shelf.code));

                                          return `
                                            <div style="padding-left: 20px;">
                                              <div style="color: #c084fc;">
                                                ${isLastShelf ? '└──' : '├──'} 📑 [Shelf]: Level ${shelf.level_number} (${shelf.code})
                                              </div>
                                              <div style="padding-left: 20px; color: #60a5fa; font-size: 10.5px;">
                                                └── 📦 [Bins]: ${shelfBins.map(b => b.code).join(', ') || 'No bins assigned'}
                                              </div>
                                            </div>
                                          `;
                                        }).join('')}
                                      </div>
                                    `;
                                  }).join('')}
                                </div>
                              `;
                            }).join('')}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; width: 100%;">
        <button type="button" class="btn btn-primary" onclick="window.State.closeModal()">Close Hierarchy</button>
      </div>
    `;

    window.State.showModal({
      title: '🌳 Enterprise Physical Hierarchy Structure (Organization & Location)',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '850px'
    });
  },

  // ==========================================================================
  // DELETE ACTIONS & REFRESH (Storage Location, Rack, Shelf, Bin)
  // ==========================================================================
  refresh() {
    if (window.StoreInventoryModule && (
      window.location.hash.includes('storage-locations') || 
      window.location.hash.includes('racks') || 
      window.location.hash.includes('shelves') || 
      window.location.hash.includes('bins') || 
      window.location.hash.includes('store-inventory') || 
      window.location.hash.includes('store-master')
    )) {
      window.StoreInventoryModule.render();
      return;
    }
    const container = document.getElementById('view-container');
    if (typeof this.render === 'function') {
      this.render(container);
    }
  },

  deleteStorageLocation(locId) {
    const loc = window.DB.getById('zones', locId);
    if (!loc) return;

    const mountedRacks = (window.DB.getAll('racks') || []).filter(r => r.storage_location_id === locId);
    let confirmMsg = `Are you sure you want to delete Storage Location "${loc.name}" (${loc.code || loc.id})?`;
    if (mountedRacks.length > 0) {
      confirmMsg += `\n\nNotice: ${mountedRacks.length} rack(s) are currently mounted to this location. Deleting will unlink these racks.`;
    }

    if (!confirm(confirmMsg)) return;

    // Unlink mounted racks if any
    mountedRacks.forEach(r => {
      window.DB.update('racks', r.id, { storage_location_id: '' });
    });

    window.DB.delete('zones', locId);
    if (window.DB.logAudit) {
      window.DB.logAudit('LOCATION_DELETED', 'ZONE', locId, `Deleted Storage Location ${loc.name} (${loc.code})`);
    }
    if (window.State && window.State.showToast) {
      window.State.showToast(`Storage Location "${loc.name}" deleted successfully.`, 'success');
    }
    this.refresh();
  },

  deleteRack(rackId) {
    const rack = window.DB.getById('racks', rackId);
    if (!rack) return;

    const allShelves = (window.DB.getAll('shelves') || []).filter(s => s.rack_id === rackId);
    let confirmMsg = `Are you sure you want to delete Rack "${rack.name || rack.code}" (${rack.code || rack.id})?`;
    if (allShelves.length > 0) {
      confirmMsg += `\n\nNotice: ${allShelves.length} shelf/shelves belong to this rack. Deleting will unlink these shelves.`;
    }

    if (!confirm(confirmMsg)) return;

    // Unlink shelves if any
    allShelves.forEach(s => {
      window.DB.update('shelves', s.id, { rack_id: '' });
    });

    window.DB.delete('racks', rackId);
    if (window.DB.logAudit) {
      window.DB.logAudit('RACK_DELETED', 'RACK', rackId, `Deleted Rack ${rack.name || rack.code} (${rack.code})`);
    }
    if (window.State && window.State.showToast) {
      window.State.showToast(`Rack "${rack.name || rack.code}" deleted successfully.`, 'success');
    }
    this.refresh();
  },

  deleteShelf(shelfId) {
    const shelf = window.DB.getById('shelves', shelfId);
    if (!shelf) return;

    const allBins = (window.DB.getAll('bins') || []).filter(b => b.shelf_id === shelfId || b.shelf === shelf.code);
    let confirmMsg = `Are you sure you want to delete Shelf "${shelf.code}" (${shelf.id})?`;
    if (allBins.length > 0) {
      confirmMsg += `\n\nNotice: ${allBins.length} bin(s) are assigned to this shelf. Deleting will unlink these bins.`;
    }

    if (!confirm(confirmMsg)) return;

    // Unlink bins if any
    allBins.forEach(b => {
      window.DB.update('bins', b.id, { shelf_id: '' });
    });

    window.DB.delete('shelves', shelfId);
    if (window.DB.logAudit) {
      window.DB.logAudit('SHELF_DELETED', 'SHELF', shelfId, `Deleted Shelf ${shelf.code}`);
    }
    if (window.State && window.State.showToast) {
      window.State.showToast(`Shelf "${shelf.code}" deleted successfully.`, 'success');
    }
    this.refresh();
  },

  deleteBin(binId) {
    const bin = window.DB.getById('bins', binId);
    if (!bin) return;

    // Check if on-hand stock exists in this bin
    const balances = (window.DB.getAll('inventoryBalances') || []).filter(b => 
      (b.bin_id === binId || b.bin === bin.code) && Number(b.on_hand) > 0
    );
    if (balances.length > 0) {
      if (window.State && window.State.showToast) {
        window.State.showToast(`Cannot delete Bin "${bin.code}": currently holds on-hand stock for ${balances.length} inventory item(s). Move or issue stock first.`, 'error');
      }
      return;
    }

    if (!confirm(`Are you sure you want to delete Bin "${bin.code}" (${bin.rack || ''} / ${bin.shelf || ''} / ${bin.bin || ''})?`)) return;

    window.DB.delete('bins', binId);
    if (window.DB.logAudit) {
      window.DB.logAudit('BIN_DELETED', 'BIN', binId, `Deleted Bin ${bin.code}`);
    }
    if (window.State && window.State.showToast) {
      window.State.showToast(`Bin "${bin.code}" deleted successfully.`, 'success');
    }
    this.refresh();
  },

  // Facility Aliases
  showAddFacilityModal() { return this.showAddBranchModal(); },
  showEditFacilityModal(id) { return this.showEditBranchModal(id); },
  submitCreateFacility() { return this.submitCreateBranch(); },
  submitEditFacility(id) { return this.submitEditBranch(id); },
  deleteFacility(id) { return this.deleteBranch(id); },
  clearAllFacilities() { return this.clearAllBranches(); },
  renderFacilitiesTab() { return this.renderBranchesTab(); }
};
