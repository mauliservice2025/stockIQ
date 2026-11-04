/* ==========================================================================
   ENTERPRISE ISCM - COMMON MASTER MODULE
   Geographic Hierarchy & Universal Common Masters:
   Country -> State -> District -> City -> Pin Code
   ========================================================================== */

window.CommonMasterModule = {
  activeTab: 'COUNTRIES', // COUNTRIES | STATES | DISTRICTS | CITIES | PINCODES
  searchTerm: '',
  statusFilter: 'ALL',
  countryFilter: 'ALL',
  stateFilter: 'ALL',
  districtFilter: 'ALL',
  cityFilter: 'ALL',
  currentPage: 1,
  pageSize: 10,

  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    // Synchronize activeTab based on current route hash if navigating directly
    const hash = (window.location && window.location.hash) || '';
    if (hash === '#/countries') this.activeTab = 'COUNTRIES';
    else if (hash === '#/states') this.activeTab = 'STATES';
    else if (hash === '#/districts') this.activeTab = 'DISTRICTS';
    else if (hash === '#/cities') this.activeTab = 'CITIES';
    else if (hash === '#/pincodes') this.activeTab = 'PINCODES';
    else if ((hash === '#/address-master' || hash === '#/common-master' || hash === '#/common-masters-2') && !this.activeTab) {
      this.activeTab = 'COUNTRIES';
    }

    container.innerHTML = `
      <!-- Address Master Header: Tabs Navigation (Left) + Search, Filters & Action Buttons (Right) -->
      <div class="tabs-header" style="display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; padding-bottom: 0; border-bottom: 1px solid var(--border-subtle); overflow: visible;">
        <!-- Left: Tab Buttons -->
        <div style="display: flex; align-items: center; gap: 2px; flex-shrink: 0; margin-bottom: -1px;">
          <button class="tab-btn ${this.activeTab === 'COUNTRIES' ? 'active' : ''}" onclick="window.CommonMasterModule.switchTab('COUNTRIES')">
            <span>Country Master</span>
          </button>
          <button class="tab-btn ${this.activeTab === 'STATES' ? 'active' : ''}" onclick="window.CommonMasterModule.switchTab('STATES')">
            <span>State Master</span>
          </button>
          <button class="tab-btn ${this.activeTab === 'DISTRICTS' ? 'active' : ''}" onclick="window.CommonMasterModule.switchTab('DISTRICTS')">
            <span>District Master</span>
          </button>
          <button class="tab-btn ${this.activeTab === 'CITIES' ? 'active' : ''}" onclick="window.CommonMasterModule.switchTab('CITIES')">
            <span>City Master</span>
          </button>
          <button class="tab-btn ${this.activeTab === 'PINCODES' ? 'active' : ''}" onclick="window.CommonMasterModule.switchTab('PINCODES')">
            <span>Pin Code Master</span>
          </button>
        </div>

        <!-- Right: Active Tab Filters & Actions (Moved into top line) -->
        <div id="common-master-tab-toolbar" style="flex: 1; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding-bottom: 8px; min-width: 320px;">
          ${this.renderActiveTabToolbar()}
        </div>
      </div>

      <!-- Active Tab Table Content & Pagination -->
      <div id="common-master-tab-content">
        ${this.renderActiveTabContent()}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.countryFilter = 'ALL';
    this.stateFilter = 'ALL';
    this.districtFilter = 'ALL';
    this.cityFilter = 'ALL';
    this.currentPage = 1;
    const routeMap = {
      'COUNTRIES': '#/countries',
      'STATES': '#/states',
      'DISTRICTS': '#/districts',
      'CITIES': '#/cities',
      'PINCODES': '#/pincodes'
    };
    if (window.location && window.location.hash !== routeMap[tab]) {
      window.location.hash = routeMap[tab];
    } else {
      this.render();
    }
  },

  setSearch(val) {
    this.searchTerm = val;
    this.currentPage = 1;
    const clearBtn = document.getElementById('common-master-search-clear');
    if (clearBtn && clearBtn.style) {
      clearBtn.style.display = val ? 'block' : 'none';
    }
    this.refreshTabContent();
  },

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    const searchInput = document.getElementById('common-master-search-input');
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('common-master-search-clear');
    if (clearBtn && clearBtn.style) clearBtn.style.display = 'none';
    this.refreshTabContent();
  },

  setStatusFilter(val) {
    this.statusFilter = val;
    this.currentPage = 1;
    this.refreshTabContent();
  },

  setCountryFilter(val) {
    this.countryFilter = val;
    this.currentPage = 1;
    this.refreshTabContent();
  },

  setStateFilter(val) {
    this.stateFilter = val;
    this.currentPage = 1;
    this.refreshTabContent();
  },

  setDistrictFilter(val) {
    this.districtFilter = val;
    this.currentPage = 1;
    this.refreshTabContent();
  },

  setCityFilter(val) {
    this.cityFilter = val;
    this.currentPage = 1;
    this.refreshTabContent();
  },

  setPageSize(size) {
    this.pageSize = Number(size) || 10;
    this.currentPage = 1;
    this.refreshTabContent();
  },

  goToPage(page) {
    this.currentPage = Math.max(1, Number(page) || 1);
    this.refreshTabContent();
  },

  refreshTabContent() {
    const container = document.getElementById('common-master-tab-content');
    if (!container) {
      this.render();
      return;
    }
    container.innerHTML = this.renderActiveTabContent();
  },

  refreshToolbar() {
    const toolbar = document.getElementById('common-master-tab-toolbar');
    if (toolbar) {
      toolbar.innerHTML = this.renderActiveTabToolbar();
    }
  },

  renderActiveTabToolbar() {
    switch (this.activeTab) {
      case 'COUNTRIES': return this.renderCountriesToolbar();
      case 'STATES': return this.renderStatesToolbar();
      case 'DISTRICTS': return this.renderDistrictsToolbar();
      case 'CITIES': return this.renderCitiesToolbar();
      case 'PINCODES': return this.renderPincodesToolbar();
      default: return this.renderCountriesToolbar();
    }
  },

  renderCountriesToolbar() {
    return `
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <div style="position: relative; display: inline-flex; align-items: center;">
          <input 
            type="text" 
            id="common-master-search-input"
            class="form-control form-control-sm" 
            placeholder="Search country, code, dial..." 
            value="${this.searchTerm}" 
            oninput="window.CommonMasterModule.setSearch(this.value)" 
            style="width: 240px; height: 32px; padding-right: 24px;" 
          />
          <button id="common-master-search-clear" type="button" onclick="window.CommonMasterModule.clearSearch()" style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: ${this.searchTerm ? 'block' : 'none'}; font-size: 14px;">&times;</button>
        </div>

        <select class="form-control form-control-sm" onchange="window.CommonMasterModule.setStatusFilter(this.value)" style="width: 120px; height: 32px;">
          <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
          <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>● Active</option>
          <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>○ Inactive</option>
        </select>
      </div>

      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="btn btn-secondary btn-sm" onclick="window.CommonMasterModule.exportCountriesCsv()" title="Export CSV" style="height: 32px;">
          <span>Export CSV</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.CommonMasterModule.showAddCountryModal()" style="height: 32px;">
          <span>+ Add Country</span>
        </button>
      </div>
    `;
  },

  renderStatesToolbar() {
    const allCountries = window.DB.getAll('countries') || [];
    return `
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <select class="form-control form-control-sm" onchange="window.CommonMasterModule.setCountryFilter(this.value)" style="width: 155px; height: 32px;">
          <option value="ALL">All Countries</option>
          ${allCountries.map(c => `
            <option value="${c.id}" ${this.countryFilter === c.id ? 'selected' : ''}>${c.name} (${c.code})</option>
          `).join('')}
        </select>

        <div style="position: relative; display: inline-flex; align-items: center;">
          <input 
            type="text" 
            id="common-master-search-input"
            class="form-control form-control-sm" 
            placeholder="Search state, TIN, capital..." 
            value="${this.searchTerm}" 
            oninput="window.CommonMasterModule.setSearch(this.value)" 
            style="width: 240px; height: 32px; padding-right: 24px;" 
          />
          <button id="common-master-search-clear" type="button" onclick="window.CommonMasterModule.clearSearch()" style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: ${this.searchTerm ? 'block' : 'none'}; font-size: 14px;">&times;</button>
        </div>

        <select class="form-control form-control-sm" onchange="window.CommonMasterModule.setStatusFilter(this.value)" style="width: 120px; height: 32px;">
          <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
          <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>● Active</option>
          <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>○ Inactive</option>
        </select>
      </div>

      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="btn btn-secondary btn-sm" onclick="window.CommonMasterModule.exportStatesCsv()" title="Export CSV" style="height: 32px;">
          <span>Export CSV</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.CommonMasterModule.showAddStateModal()" style="height: 32px;">
          <span>+ Add State</span>
        </button>
      </div>
    `;
  },

  renderDistrictsToolbar() {
    const allStates = window.DB.getAll('states') || [];
    return `
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <select class="form-control form-control-sm" onchange="window.CommonMasterModule.setStateFilter(this.value)" style="width: 155px; height: 32px;">
          <option value="ALL">All States</option>
          ${allStates.map(s => `
            <option value="${s.id}" ${this.stateFilter === s.id ? 'selected' : ''}>${s.name} (${s.code})</option>
          `).join('')}
        </select>

        <div style="position: relative; display: inline-flex; align-items: center;">
          <input 
            type="text" 
            id="common-master-search-input"
            class="form-control form-control-sm" 
            placeholder="Search district, code, division..." 
            value="${this.searchTerm}" 
            oninput="window.CommonMasterModule.setSearch(this.value)" 
            style="width: 240px; height: 32px; padding-right: 24px;" 
          />
          <button id="common-master-search-clear" type="button" onclick="window.CommonMasterModule.clearSearch()" style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: ${this.searchTerm ? 'block' : 'none'}; font-size: 14px;">&times;</button>
        </div>

        <select class="form-control form-control-sm" onchange="window.CommonMasterModule.setStatusFilter(this.value)" style="width: 120px; height: 32px;">
          <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
          <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>● Active</option>
          <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>○ Inactive</option>
        </select>
      </div>

      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="btn btn-secondary btn-sm" onclick="window.CommonMasterModule.exportDistrictsCsv()" title="Export CSV" style="height: 32px;">
          <span>Export CSV</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.CommonMasterModule.showAddDistrictModal()" style="height: 32px;">
          <span>+ Add District</span>
        </button>
      </div>
    `;
  },

  renderCitiesToolbar() {
    const allDistricts = window.DB.getAll('districts') || [];
    return `
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <select class="form-control form-control-sm" onchange="window.CommonMasterModule.setDistrictFilter(this.value)" style="width: 155px; height: 32px;">
          <option value="ALL">All Districts</option>
          ${allDistricts.map(d => `
            <option value="${d.id}" ${this.districtFilter === d.id ? 'selected' : ''}>${d.name} (${d.code})</option>
          `).join('')}
        </select>

        <div style="position: relative; display: inline-flex; align-items: center;">
          <input 
            type="text" 
            id="common-master-search-input"
            class="form-control form-control-sm" 
            placeholder="Search city, code, tier..." 
            value="${this.searchTerm}" 
            oninput="window.CommonMasterModule.setSearch(this.value)" 
            style="width: 240px; height: 32px; padding-right: 24px;" 
          />
          <button id="common-master-search-clear" type="button" onclick="window.CommonMasterModule.clearSearch()" style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: ${this.searchTerm ? 'block' : 'none'}; font-size: 14px;">&times;</button>
        </div>

        <select class="form-control form-control-sm" onchange="window.CommonMasterModule.setStatusFilter(this.value)" style="width: 120px; height: 32px;">
          <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
          <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>● Active</option>
          <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>○ Inactive</option>
        </select>
      </div>

      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="btn btn-secondary btn-sm" onclick="window.CommonMasterModule.exportCitiesCsv()" title="Export CSV" style="height: 32px;">
          <span>Export CSV</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.CommonMasterModule.showAddCityModal()" style="height: 32px;">
          <span>+ Add City</span>
        </button>
      </div>
    `;
  },

  renderPincodesToolbar() {
    const allCities = window.DB.getAll('cities') || [];
    return `
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <select class="form-control form-control-sm" onchange="window.CommonMasterModule.setCityFilter(this.value)" style="width: 155px; height: 32px;">
          <option value="ALL">All Cities</option>
          ${allCities.map(c => `
            <option value="${c.id}" ${this.cityFilter === c.id ? 'selected' : ''}>${c.name} (${c.code})</option>
          `).join('')}
        </select>

        <div style="position: relative; display: inline-flex; align-items: center;">
          <input 
            type="text" 
            id="common-master-search-input"
            class="form-control form-control-sm" 
            placeholder="Search pin code, area locality, city..." 
            value="${this.searchTerm}" 
            oninput="window.CommonMasterModule.setSearch(this.value)" 
            style="width: 250px; height: 32px; padding-right: 24px;" 
          />
          <button id="common-master-search-clear" type="button" onclick="window.CommonMasterModule.clearSearch()" style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: ${this.searchTerm ? 'block' : 'none'}; font-size: 14px;">&times;</button>
        </div>

        <select class="form-control form-control-sm" onchange="window.CommonMasterModule.setStatusFilter(this.value)" style="width: 120px; height: 32px;">
          <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
          <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>● Active</option>
          <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>○ Inactive</option>
        </select>
      </div>

      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="btn btn-secondary btn-sm" onclick="window.CommonMasterModule.exportPincodesCsv()" title="Export CSV" style="height: 32px;">
          <span>Export CSV</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.CommonMasterModule.showAddPincodeModal()" style="height: 32px;">
          <span>+ Add Pin Code</span>
        </button>
      </div>
    `;
  },

  renderPaginationControls(totalRecords) {
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalRecords);

    return `
      <div class="user-pagination-bar" style="margin-top: 14px; padding: 8px 4px 4px 4px; border-top: 1px solid var(--border-color, #334155); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 13px; font-weight: 400;">
        <div style="font-size: 13px; color: var(--text-secondary); font-weight: 400;">
          Showing <strong style="color: var(--text-primary);">${totalRecords === 0 ? 0 : startIndex + 1}</strong> to <strong style="color: var(--text-primary);">${endIndex}</strong> of <strong style="color: var(--text-primary);">${totalRecords}</strong> entries
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="font-size: 13px; font-weight: 400;">Show</span>
            <select class="form-control form-control-sm" onchange="window.CommonMasterModule.setPageSize(this.value)" style="height: 28px; font-size: 13px; padding: 1px 6px; width: 70px; border-radius: 4px; font-weight: 500;">
              <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10</option>
              <option value="25" ${this.pageSize === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100</option>
            </select>
            <span style="font-size: 13px; font-weight: 400;">entries</span>
          </div>

          <div class="pagination-buttons" style="display: flex; gap: 4px; align-items: center;">
            <button class="btn btn-secondary btn-xs" ${this.currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"'} onclick="window.CommonMasterModule.goToPage(1)" title="First Page">⏮</button>
            <button class="btn btn-secondary btn-xs" ${this.currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"'} onclick="window.CommonMasterModule.goToPage(${this.currentPage - 1})" title="Previous Page">◀ Prev</button>
            ${this.renderPaginationPills(this.currentPage, totalPages)}
            <button class="btn btn-secondary btn-xs" ${this.currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"'} onclick="window.CommonMasterModule.goToPage(${this.currentPage + 1})" title="Next Page">Next ▶</button>
            <button class="btn btn-secondary btn-xs" ${this.currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"'} onclick="window.CommonMasterModule.goToPage(${totalPages})" title="Last Page">⏭</button>
          </div>
        </div>
      </div>
    `;
  },

  renderPaginationPills(current, total) {
    if (total <= 1) return '';
    const pills = [];
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, current + 2);

    if (current <= 3) {
      startPage = 1;
      endPage = Math.min(5, total);
    } else if (current >= total - 2) {
      startPage = Math.max(1, total - 4);
      endPage = total;
    }

    if (startPage > 1) {
      pills.push(`<button class="btn btn-secondary btn-xs" onclick="window.CommonMasterModule.goToPage(1)" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 500;">1</button>`);
      if (startPage > 2) {
        pills.push(`<span style="padding: 0 3px; color: var(--text-muted); line-height: 28px; font-size: 12px;">...</span>`);
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      const isActive = p === current;
      pills.push(`
        <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-xs" 
                onclick="window.CommonMasterModule.goToPage(${p})" 
                style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: ${isActive ? '600' : '500'};">
          ${p}
        </button>
      `);
    }

    if (endPage < total) {
      if (endPage < total - 1) {
        pills.push(`<span style="padding: 0 3px; color: var(--text-muted); line-height: 28px; font-size: 12px;">...</span>`);
      }
      pills.push(`<button class="btn btn-secondary btn-xs" onclick="window.CommonMasterModule.goToPage(${total})" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 500;">${total}</button>`);
    }

    return pills.join('');
  },

  renderActiveTabContent() {
    switch (this.activeTab) {
      case 'COUNTRIES': return this.renderCountriesTab();
      case 'STATES': return this.renderStatesTab();
      case 'DISTRICTS': return this.renderDistrictsTab();
      case 'CITIES': return this.renderCitiesTab();
      case 'PINCODES': return this.renderPincodesTab();
      default: return this.renderCountriesTab();
    }
  },

  // ==========================================================================
  // TAB 1: COUNTRY MASTER
  // ==========================================================================
  renderCountriesTab() {
    let countries = window.DB.getAll('countries') || [];
    const allStates = window.DB.getAll('states') || [];

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      countries = countries.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.iso2 && c.iso2.toLowerCase().includes(q)) ||
        (c.dial_code && c.dial_code.toLowerCase().includes(q)) ||
        (c.currency_code && c.currency_code.toLowerCase().includes(q)) ||
        (c.capital && c.capital.toLowerCase().includes(q))
      );
    }

    if (this.statusFilter !== 'ALL') {
      countries = countries.filter(c => c.status === this.statusFilter);
    }

    const totalRecords = countries.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pagedCountries = countries.slice(startIndex, startIndex + this.pageSize);

    return `
      <div class="content-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Country Code</th>
                <th>Country Name</th>
                <th>ISO Alpha-2</th>
                <th>Dial Code</th>
                <th>Currency</th>
                <th>Capital City</th>
                <th>Region</th>
                <th class="text-center">States</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${countries.length === 0 ? `
                <tr>
                  <td colspan="10" style="text-align: center; padding: 36px; color: var(--text-muted);">
                    <div style="font-weight: 600; font-size: 14px;">No Countries Found</div>
                    <div style="font-size: 12px; margin-top: 4px;">Click "+ Add Country" to register an international jurisdiction.</div>
                  </td>
                </tr>
              ` : pagedCountries.map(c => {
                const linkedStates = allStates.filter(s => s.country_id === c.id);
                const isActive = c.status === 'Active';
                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: #60a5fa;">${c.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">${c.id}</div>
                    </td>
                    <td>
                      <div class="cell-strong" style="font-size: 13px;">${c.name}</div>
                      ${c.remarks ? `<div style="font-size: 10.5px; color: var(--text-muted);">${c.remarks}</div>` : ''}
                    </td>
                    <td>
                      <span class="badge badge-subtle" style="font-weight: 700; font-family: var(--font-mono);">${c.iso2 || '-'}</span>
                    </td>
                    <td>
                      <span class="cell-mono" style="color: var(--accent-300); font-weight: 600;">${c.dial_code || '-'}</span>
                    </td>
                    <td>
                      <span style="font-weight: 600;">${c.currency_symbol || ''} ${c.currency_code || '-'}</span>
                    </td>
                    <td>${c.capital || '-'}</td>
                    <td>
                      <span style="font-size: 11px; color: var(--text-secondary);">${c.region || 'Global'}</span>
                    </td>
                    <td class="text-center">
                      <span class="badge ${linkedStates.length > 0 ? 'badge-primary' : 'badge-subtle'}">${linkedStates.length}</span>
                    </td>
                    <td>
                      <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}">
                        ${isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: flex; justify-content: flex-end; gap: 4px;">
                        <button class="btn btn-icon btn-sm" title="View Country Details" onclick="window.CommonMasterModule.showCountryDetailsModal('${c.id}')">
                          ${window.AppIcons ? window.AppIcons.svgView : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Edit Country" onclick="window.CommonMasterModule.showEditCountryModal('${c.id}')">
                          ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate' : 'Activate'}" onclick="window.CommonMasterModule.toggleCountryStatus('${c.id}')">
                          ${window.AppIcons ? window.AppIcons.svgLock(isActive) : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Remove Country" onclick="window.CommonMasterModule.deleteCountry('${c.id}')">
                          ${window.AppIcons ? window.AppIcons.svgDelete : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${this.renderPaginationControls(totalRecords)}
      </div>
    `;
  },

  // ==========================================================================
  // TAB 2: STATE MASTER
  // ==========================================================================
  renderStatesTab() {
    let states = window.DB.getAll('states') || [];
    const allCountries = window.DB.getAll('countries') || [];
    const allDistricts = window.DB.getAll('districts') || [];

    if (this.countryFilter !== 'ALL') {
      states = states.filter(s => s.country_id === this.countryFilter);
    }

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      states = states.filter(s => {
        const country = allCountries.find(c => c.id === s.country_id);
        const corpus = [s.code, s.tin, s.name, s.capital, s.zone, s.type, country ? country.name : ''].join(' ').toLowerCase();
        return corpus.includes(q);
      });
    }

    if (this.statusFilter !== 'ALL') {
      states = states.filter(s => s.status === this.statusFilter);
    }

    const totalRecords = states.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pagedStates = states.slice(startIndex, startIndex + this.pageSize);

    return `
      <div class="content-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>State Code & TIN</th>
                <th>State / Province Name</th>
                <th>Country</th>
                <th>Type</th>
                <th>Zone / Region</th>
                <th>Capital City</th>
                <th class="text-center">Districts</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${states.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted);">
                    <div style="font-weight: 600; font-size: 14px;">No States Found</div>
                    <div style="font-size: 12px; margin-top: 4px;">Click "+ Add State" to add states or union territories.</div>
                  </td>
                </tr>
              ` : pagedStates.map(s => {
                const country = allCountries.find(c => c.id === s.country_id);
                const linkedDistricts = allDistricts.filter(d => d.state_id === s.id);
                const isActive = s.status === 'Active';
                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: #a78bfa;">${s.code}</div>
                      ${s.tin ? `<div style="font-size: 10px; color: var(--text-muted);">GST/TIN: <b>${s.tin}</b></div>` : ''}
                    </td>
                    <td>
                      <div class="cell-strong" style="font-size: 13px;">${s.name}</div>
                      <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">${s.id}</div>
                    </td>
                    <td>
                      <span class="badge badge-subtle" style="font-weight: 600;">${country ? country.name : 'Unknown Country'}</span>
                    </td>
                    <td>
                      <span class="badge ${s.type === 'Union Territory' ? 'badge-warning' : 'badge-subtle'}">${s.type || 'State'}</span>
                    </td>
                    <td>${s.zone || '-'}</td>
                    <td>${s.capital || '-'}</td>
                    <td class="text-center">
                      <span class="badge ${linkedDistricts.length > 0 ? 'badge-primary' : 'badge-subtle'}">${linkedDistricts.length}</span>
                    </td>
                    <td>
                      <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}">
                        ${isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: flex; justify-content: flex-end; gap: 4px;">
                        <button class="btn btn-icon btn-sm" title="View State Details" onclick="window.CommonMasterModule.showStateDetailsModal('${s.id}')">
                          ${window.AppIcons ? window.AppIcons.svgView : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Edit State" onclick="window.CommonMasterModule.showEditStateModal('${s.id}')">
                          ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate' : 'Activate'}" onclick="window.CommonMasterModule.toggleStateStatus('${s.id}')">
                          ${window.AppIcons ? window.AppIcons.svgLock(isActive) : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Remove State" onclick="window.CommonMasterModule.deleteState('${s.id}')">
                          ${window.AppIcons ? window.AppIcons.svgDelete : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${this.renderPaginationControls(totalRecords)}
      </div>
    `;
  },

  // ==========================================================================
  // TAB 3: DISTRICT MASTER
  // ==========================================================================
  renderDistrictsTab() {
    let districts = window.DB.getAll('districts') || [];
    const allStates = window.DB.getAll('states') || [];
    const allCountries = window.DB.getAll('countries') || [];
    const allCities = window.DB.getAll('cities') || [];

    if (this.countryFilter !== 'ALL') {
      districts = districts.filter(d => d.country_id === this.countryFilter);
    }
    if (this.stateFilter !== 'ALL') {
      districts = districts.filter(d => d.state_id === this.stateFilter);
    }

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      districts = districts.filter(d => {
        const state = allStates.find(s => s.id === d.state_id);
        const corpus = [d.code, d.name, d.headquarters, d.division, state ? state.name : ''].join(' ').toLowerCase();
        return corpus.includes(q);
      });
    }

    if (this.statusFilter !== 'ALL') {
      districts = districts.filter(d => d.status === this.statusFilter);
    }

    const totalRecords = districts.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pagedDistricts = districts.slice(startIndex, startIndex + this.pageSize);

    return `
      <div class="content-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>District Code</th>
                <th>District Name</th>
                <th>State & Country</th>
                <th>Headquarters</th>
                <th>Administrative Division</th>
                <th class="text-center">Cities</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${districts.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 36px; color: var(--text-muted);">
                    <div style="font-weight: 600; font-size: 14px;">No Districts Found</div>
                    <div style="font-size: 12px; margin-top: 4px;">Click "+ Add District" to define administrative districts.</div>
                  </td>
                </tr>
              ` : pagedDistricts.map(d => {
                const state = allStates.find(s => s.id === d.state_id);
                const country = state ? allCountries.find(c => c.id === state.country_id) : null;
                const linkedCities = allCities.filter(c => c.district_id === d.id);
                const isActive = d.status === 'Active';
                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: #f472b6;">${d.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">${d.id}</div>
                    </td>
                    <td>
                      <div class="cell-strong" style="font-size: 13px;">${d.name}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: #a78bfa;">${state ? state.name : 'Unknown State'}</div>
                      <div style="font-size: 10.5px; color: var(--text-muted);">${country ? country.name : ''}</div>
                    </td>
                    <td>${d.headquarters || '-'}</td>
                    <td>${d.division || '-'}</td>
                    <td class="text-center">
                      <span class="badge ${linkedCities.length > 0 ? 'badge-primary' : 'badge-subtle'}">${linkedCities.length}</span>
                    </td>
                    <td>
                      <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}">
                        ${isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: flex; justify-content: flex-end; gap: 4px;">
                        <button class="btn btn-icon btn-sm" title="View District Details" onclick="window.CommonMasterModule.showDistrictDetailsModal('${d.id}')">
                          ${window.AppIcons ? window.AppIcons.svgView : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Edit District" onclick="window.CommonMasterModule.showEditDistrictModal('${d.id}')">
                          ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate' : 'Activate'}" onclick="window.CommonMasterModule.toggleDistrictStatus('${d.id}')">
                          ${window.AppIcons ? window.AppIcons.svgLock(isActive) : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Remove District" onclick="window.CommonMasterModule.deleteDistrict('${d.id}')">
                          ${window.AppIcons ? window.AppIcons.svgDelete : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${this.renderPaginationControls(totalRecords)}
      </div>
    `;
  },

  // ==========================================================================
  // TAB 4: CITY MASTER
  // ==========================================================================
  renderCitiesTab() {
    let cities = window.DB.getAll('cities') || [];
    const allDistricts = window.DB.getAll('districts') || [];
    const allStates = window.DB.getAll('states') || [];
    const allPincodes = window.DB.getAll('pincodes') || [];

    if (this.districtFilter !== 'ALL') {
      cities = cities.filter(c => c.district_id === this.districtFilter);
    }
    if (this.stateFilter !== 'ALL') {
      cities = cities.filter(c => c.state_id === this.stateFilter);
    }

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      cities = cities.filter(c => {
        const district = allDistricts.find(d => d.id === c.district_id);
        const state = allStates.find(s => s.id === c.state_id);
        const corpus = [c.code, c.name, c.tier, district ? district.name : '', state ? state.name : ''].join(' ').toLowerCase();
        return corpus.includes(q);
      });
    }

    if (this.statusFilter !== 'ALL') {
      cities = cities.filter(c => c.status === this.statusFilter);
    }

    const totalRecords = cities.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pagedCities = cities.slice(startIndex, startIndex + this.pageSize);

    return `
      <div class="content-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>City Code</th>
                <th>City / Town Name</th>
                <th>District</th>
                <th>State</th>
                <th>Tier</th>
                <th>Industrial Hub</th>
                <th class="text-center">Pin Codes</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${cities.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted);">
                    <div style="font-weight: 600; font-size: 14px;">No Cities Found</div>
                    <div style="font-size: 12px; margin-top: 4px;">Click "+ Add City" to add municipal cities and industrial hubs.</div>
                  </td>
                </tr>
              ` : pagedCities.map(c => {
                const district = allDistricts.find(d => d.id === c.district_id);
                const state = allStates.find(s => s.id === c.state_id);
                const linkedPins = allPincodes.filter(p => p.city_id === c.id);
                const isActive = c.status === 'Active';
                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: #34d399;">${c.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">${c.id}</div>
                    </td>
                    <td>
                      <div class="cell-strong" style="font-size: 13px;">${c.name}</div>
                    </td>
                    <td>${district ? district.name : '-'}</td>
                    <td>
                      <span class="badge badge-subtle" style="font-weight: 600;">${state ? state.name : '-'}</span>
                    </td>
                    <td>
                      <span class="badge ${c.tier === 'Metro' ? 'badge-primary' : 'badge-subtle'}">${c.tier || 'Tier 2'}</span>
                    </td>
                    <td>
                      ${c.is_industrial_hub ? '<span class="status-pill status-approved" style="font-size: 10px;">Yes</span>' : '<span style="color: var(--text-muted); font-size: 11px;">Standard</span>'}
                    </td>
                    <td class="text-center">
                      <span class="badge ${linkedPins.length > 0 ? 'badge-primary' : 'badge-subtle'}">${linkedPins.length}</span>
                    </td>
                    <td>
                      <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}">
                        ${isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: flex; justify-content: flex-end; gap: 4px;">
                        <button class="btn btn-icon btn-sm" title="View City Details" onclick="window.CommonMasterModule.showCityDetailsModal('${c.id}')">
                          ${window.AppIcons ? window.AppIcons.svgView : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Edit City" onclick="window.CommonMasterModule.showEditCityModal('${c.id}')">
                          ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate' : 'Activate'}" onclick="window.CommonMasterModule.toggleCityStatus('${c.id}')">
                          ${window.AppIcons ? window.AppIcons.svgLock(isActive) : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Remove City" onclick="window.CommonMasterModule.deleteCity('${c.id}')">
                          ${window.AppIcons ? window.AppIcons.svgDelete : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${this.renderPaginationControls(totalRecords)}
      </div>
    `;
  },

  // ==========================================================================
  // TAB 5: PIN CODE MASTER
  // ==========================================================================
  renderPincodesTab() {
    let pincodes = window.DB.getAll('pincodes') || [];
    const allCities = window.DB.getAll('cities') || [];
    const allDistricts = window.DB.getAll('districts') || [];
    const allStates = window.DB.getAll('states') || [];

    if (this.cityFilter !== 'ALL') {
      pincodes = pincodes.filter(p => p.city_id === this.cityFilter);
    }
    if (this.stateFilter !== 'ALL') {
      pincodes = pincodes.filter(p => p.state_id === this.stateFilter);
    }

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      pincodes = pincodes.filter(p => {
        const city = allCities.find(c => c.id === p.city_id);
        const district = allDistricts.find(d => d.id === p.district_id);
        const state = allStates.find(s => s.id === p.state_id);
        const corpus = [p.pincode, p.area_name, city ? city.name : '', district ? district.name : '', state ? state.name : ''].join(' ').toLowerCase();
        return corpus.includes(q);
      });
    }

    if (this.statusFilter !== 'ALL') {
      pincodes = pincodes.filter(p => p.status === this.statusFilter);
    }

    const totalRecords = pincodes.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pagedPincodes = pincodes.slice(startIndex, startIndex + this.pageSize);

    return `
      <div class="content-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Pin Code</th>
                <th>Area / Locality Name</th>
                <th>City / Town</th>
                <th>District</th>
                <th>State</th>
                <th>Post Office Status</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pincodes.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 36px; color: var(--text-muted);">
                    <div style="font-weight: 600; font-size: 14px;">No Pin Codes Found</div>
                    <div style="font-size: 12px; margin-top: 4px;">Click "+ Add Pin Code" to map postal codes and localities.</div>
                  </td>
                </tr>
              ` : pagedPincodes.map(p => {
                const city = allCities.find(c => c.id === p.city_id);
                const district = allDistricts.find(d => d.id === p.district_id);
                const state = allStates.find(s => s.id === p.state_id);
                const isActive = p.status === 'Active';
                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: #fbbf24; font-size: 14px; letter-spacing: 0.5px;">${p.pincode}</div>
                      <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">${p.id}</div>
                    </td>
                    <td>
                      <div class="cell-strong" style="font-size: 13px;">${p.area_name}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: #34d399;">${city ? city.name : '-'}</div>
                    </td>
                    <td>${district ? district.name : '-'}</td>
                    <td>
                      <span class="badge badge-subtle" style="font-weight: 600;">${state ? state.name : '-'}</span>
                    </td>
                    <td>
                      <span class="badge ${p.delivery_status === 'Delivery' ? 'badge-primary' : 'badge-subtle'}">
                        ${p.delivery_status || 'Delivery'}
                      </span>
                    </td>
                    <td>
                      <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}">
                        ${isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: flex; justify-content: flex-end; gap: 4px;">
                        <button class="btn btn-icon btn-sm" title="View Pin Code Details" onclick="window.CommonMasterModule.showPincodeDetailsModal('${p.id}')">
                          ${window.AppIcons ? window.AppIcons.svgView : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Edit Pin Code" onclick="window.CommonMasterModule.showEditPincodeModal('${p.id}')">
                          ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate' : 'Activate'}" onclick="window.CommonMasterModule.togglePincodeStatus('${p.id}')">
                          ${window.AppIcons ? window.AppIcons.svgLock(isActive) : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Remove Pin Code" onclick="window.CommonMasterModule.deletePincode('${p.id}')">
                          ${window.AppIcons ? window.AppIcons.svgDelete : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${this.renderPaginationControls(totalRecords)}
      </div>
    `;
  },

  // ==========================================================================
  // MODALS & ACTIONS: 1. COUNTRY MASTER
  // ==========================================================================
  showAddCountryModal() {
    const all = window.DB.getAll('countries') || [];
    const nextId = `CTRY-${String(all.length + 1).padStart(2, '0')}`;

    const content = `
      <form id="add-country-form" onsubmit="event.preventDefault(); window.CommonMasterModule.submitCreateCountry();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Country Code (ISO-3) <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-country-code" class="form-control" placeholder="e.g. IND" required maxlength="3" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" />
          </div>
          <div>
            <label class="form-label">ISO Alpha-2 Code</label>
            <input type="text" id="new-country-iso2" class="form-control" placeholder="e.g. IN" maxlength="2" style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
        </div>

        <div>
          <label class="form-label">Country Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="new-country-name" class="form-control" placeholder="e.g. India" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Calling / Dial Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-country-dial" class="form-control" placeholder="e.g. +91" required />
          </div>
          <div>
            <label class="form-label">Capital City</label>
            <input type="text" id="new-country-capital" class="form-control" placeholder="e.g. New Delhi" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Currency Code</label>
            <input type="text" id="new-country-currency" class="form-control" placeholder="e.g. INR" maxlength="3" style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
          <div>
            <label class="form-label">Currency Symbol</label>
            <input type="text" id="new-country-symbol" class="form-control" placeholder="e.g. ₹" />
          </div>
          <div>
            <label class="form-label">Region / Continent</label>
            <input type="text" id="new-country-region" class="form-control" placeholder="e.g. South Asia" />
          </div>
        </div>

        <div>
          <label class="form-label">Remarks / Operational Scope</label>
          <textarea id="new-country-remarks" class="form-control" rows="2" placeholder="Notes..."></textarea>
        </div>

        <input type="hidden" id="new-country-id" value="${nextId}" />
      </form>
    `;

    window.State.openModal('Add New Country Master', content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('add-country-form').requestSubmit()">Save Country</button>
    `);
  },

  submitCreateCountry() {
    const id = document.getElementById('new-country-id').value;
    const code = document.getElementById('new-country-code').value.trim().toUpperCase();
    const iso2 = document.getElementById('new-country-iso2').value.trim().toUpperCase();
    const name = document.getElementById('new-country-name').value.trim();
    const dial = document.getElementById('new-country-dial').value.trim();
    const capital = document.getElementById('new-country-capital').value.trim();
    const currency = document.getElementById('new-country-currency').value.trim().toUpperCase();
    const symbol = document.getElementById('new-country-symbol').value.trim();
    const region = document.getElementById('new-country-region').value.trim();
    const remarks = document.getElementById('new-country-remarks').value.trim();

    const all = window.DB.getAll('countries') || [];
    if (all.some(c => c.code === code || c.name.toLowerCase() === name.toLowerCase())) {
      window.State.showToast(`Country with code "${code}" or name "${name}" already exists.`, 'error');
      return;
    }

    const newCountry = {
      id,
      code,
      iso2,
      name,
      dial_code: dial,
      capital,
      currency_code: currency,
      currency_symbol: symbol,
      region,
      remarks,
      status: 'Active',
      created_at: new Date().toISOString()
    };

    window.DB.insert('countries', newCountry);
    window.DB.logAudit('COUNTRY_CREATED', 'COMMON_MASTER', id, `Added Country: ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`Country "${name}" added successfully.`, 'success');
    this.render();
  },

  showEditCountryModal(countryId) {
    const country = window.DB.getById('countries', countryId);
    if (!country) return;

    const content = `
      <form id="edit-country-form" onsubmit="event.preventDefault(); window.CommonMasterModule.submitEditCountry('${countryId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Country Code (ISO-3) <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-country-code" class="form-control" value="${country.code}" required maxlength="3" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" />
          </div>
          <div>
            <label class="form-label">ISO Alpha-2 Code</label>
            <input type="text" id="edit-country-iso2" class="form-control" value="${country.iso2 || ''}" maxlength="2" style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
        </div>

        <div>
          <label class="form-label">Country Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="edit-country-name" class="form-control" value="${country.name}" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Calling / Dial Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-country-dial" class="form-control" value="${country.dial_code || ''}" required />
          </div>
          <div>
            <label class="form-label">Capital City</label>
            <input type="text" id="edit-country-capital" class="form-control" value="${country.capital || ''}" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Currency Code</label>
            <input type="text" id="edit-country-currency" class="form-control" value="${country.currency_code || ''}" maxlength="3" style="text-transform: uppercase; font-family: var(--font-mono);" />
          </div>
          <div>
            <label class="form-label">Currency Symbol</label>
            <input type="text" id="edit-country-symbol" class="form-control" value="${country.currency_symbol || ''}" />
          </div>
          <div>
            <label class="form-label">Region / Continent</label>
            <input type="text" id="edit-country-region" class="form-control" value="${country.region || ''}" />
          </div>
        </div>

        <div>
          <label class="form-label">Remarks / Operational Scope</label>
          <textarea id="edit-country-remarks" class="form-control" rows="2">${country.remarks || ''}</textarea>
        </div>
      </form>
    `;

    window.State.openModal(`Edit Country: ${country.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('edit-country-form').requestSubmit()">Save Changes</button>
    `);
  },

  submitEditCountry(countryId) {
    const code = document.getElementById('edit-country-code').value.trim().toUpperCase();
    const iso2 = document.getElementById('edit-country-iso2').value.trim().toUpperCase();
    const name = document.getElementById('edit-country-name').value.trim();
    const dial = document.getElementById('edit-country-dial').value.trim();
    const capital = document.getElementById('edit-country-capital').value.trim();
    const currency = document.getElementById('edit-country-currency').value.trim().toUpperCase();
    const symbol = document.getElementById('edit-country-symbol').value.trim();
    const region = document.getElementById('edit-country-region').value.trim();
    const remarks = document.getElementById('edit-country-remarks').value.trim();

    window.DB.update('countries', countryId, {
      code,
      iso2,
      name,
      dial_code: dial,
      capital,
      currency_code: currency,
      currency_symbol: symbol,
      region,
      remarks
    });

    window.DB.logAudit('COUNTRY_UPDATED', 'COMMON_MASTER', countryId, `Updated Country: ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`Country "${name}" updated successfully.`, 'success');
    this.render();
  },

  showCountryDetailsModal(countryId) {
    const country = window.DB.getById('countries', countryId);
    if (!country) return;
    const states = window.DB.getStates(countryId);

    const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: rgba(96, 165, 250, 0.08); border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px;">
          <div style="font-size: 18px; font-weight: 700; color: #60a5fa;">${country.name} (${country.code})</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">ISO: ${country.iso2 || '-'} &bull; Capital: ${country.capital || '-'} &bull; Currency: ${country.currency_symbol || ''} ${country.currency_code || '-'}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px;">
          <div><b>Calling Code:</b> ${country.dial_code || '-'}</div>
          <div><b>Region:</b> ${country.region || '-'}</div>
          <div><b>Status:</b> <span class="status-pill ${country.status === 'Active' ? 'status-approved' : 'status-rejected'}">${country.status}</span></div>
          <div><b>Linked States/UTs:</b> ${states.length} registered</div>
        </div>

        ${country.remarks ? `<div style="font-size: 12px; color: var(--text-muted); background: rgba(255,255,255,0.02); padding: 8px; border-radius: 4px;"><b>Remarks:</b> ${country.remarks}</div>` : ''}

        <div>
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px;">Associated States & Regions (${states.length})</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 160px; overflow-y: auto;">
            ${states.length === 0 ? '<span style="color:var(--text-muted); font-size:12px;">No states registered under this country yet.</span>' : states.map(s => `
              <span class="badge badge-subtle" style="font-size: 11px;">${s.name} (${s.code})</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    window.State.openModal(`Country Details: ${country.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      <button class="btn btn-primary" onclick="window.State.closeModal(); window.CommonMasterModule.showEditCountryModal('${countryId}')">Edit</button>
    `);
  },

  toggleCountryStatus(countryId) {
    const country = window.DB.getById('countries', countryId);
    if (!country) return;
    const newStatus = country.status === 'Active' ? 'Inactive' : 'Active';
    window.DB.update('countries', countryId, { status: newStatus });
    window.DB.logAudit('COUNTRY_STATUS_TOGGLE', 'COMMON_MASTER', countryId, `Toggled Country ${country.name} to ${newStatus}`);
    window.State.showToast(`Country "${country.name}" is now ${newStatus}.`, newStatus === 'Active' ? 'success' : 'warning');
    this.render();
  },

  deleteCountry(countryId) {
    const country = window.DB.getById('countries', countryId);
    if (!country) return;
    const linkedStates = window.DB.getStates(countryId);

    let confirmMsg = `Are you sure you want to remove country "${country.name}" (${country.code})?`;
    if (linkedStates.length > 0) {
      confirmMsg += `\n\nWarning: ${linkedStates.length} linked state(s) exist under this country.`;
    }

    if (confirm(confirmMsg)) {
      window.DB.delete('countries', countryId);
      window.DB.logAudit('COUNTRY_DELETED', 'COMMON_MASTER', countryId, `Removed Country ${country.name}`);
      window.State.showToast(`Country "${country.name}" removed successfully.`, 'success');
      this.render();
    }
  },

  exportCountriesCsv() {
    const list = window.DB.getAll('countries') || [];
    let csv = 'ID,Code,ISO2,Name,DialCode,Currency,Capital,Region,Status\n';
    list.forEach(c => {
      csv += `"${c.id}","${c.code}","${c.iso2 || ''}","${c.name}","${c.dial_code || ''}","${c.currency_code || ''}","${c.capital || ''}","${c.region || ''}","${c.status}"\n`;
    });
    this.downloadCsv('countries_master.csv', csv);
  },

  // ==========================================================================
  // MODALS & ACTIONS: 2. STATE MASTER
  // ==========================================================================
  showAddStateModal() {
    const allStates = window.DB.getAll('states') || [];
    const allCountries = window.DB.getAll('countries') || [];
    const nextId = `ST-${String(allStates.length + 1).padStart(2, '0')}`;

    const content = `
      <form id="add-state-form" onsubmit="event.preventDefault(); window.CommonMasterModule.submitCreateState();" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label">Country <span style="color: var(--color-danger)">*</span></label>
          <select id="new-state-country" class="form-control" required>
            ${allCountries.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join('')}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">State Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-state-code" class="form-control" placeholder="e.g. MH" required maxlength="4" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" />
          </div>
          <div>
            <label class="form-label">GST / TIN Code</label>
            <input type="text" id="new-state-tin" class="form-control" placeholder="e.g. 27" maxlength="2" style="font-family: var(--font-mono);" />
          </div>
        </div>

        <div>
          <label class="form-label">State / Province Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="new-state-name" class="form-control" placeholder="e.g. Maharashtra" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Type</label>
            <select id="new-state-type" class="form-control">
              <option value="State">State</option>
              <option value="Union Territory">Union Territory</option>
              <option value="Province">Province</option>
              <option value="Region">Region</option>
            </select>
          </div>
          <div>
            <label class="form-label">Capital City</label>
            <input type="text" id="new-state-capital" class="form-control" placeholder="e.g. Mumbai" />
          </div>
        </div>

        <div>
          <label class="form-label">Zone / Direction</label>
          <input type="text" id="new-state-zone" class="form-control" placeholder="e.g. Western, Northern, Southern" />
        </div>

        <input type="hidden" id="new-state-id" value="${nextId}" />
      </form>
    `;

    window.State.openModal('Add New State Master', content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('add-state-form').requestSubmit()">Save State</button>
    `);
  },

  submitCreateState() {
    const id = document.getElementById('new-state-id').value;
    const country_id = document.getElementById('new-state-country').value;
    const code = document.getElementById('new-state-code').value.trim().toUpperCase();
    const tin = document.getElementById('new-state-tin').value.trim();
    const name = document.getElementById('new-state-name').value.trim();
    const type = document.getElementById('new-state-type').value;
    const capital = document.getElementById('new-state-capital').value.trim();
    const zone = document.getElementById('new-state-zone').value.trim();

    const all = window.DB.getAll('states') || [];
    if (all.some(s => s.country_id === country_id && (s.code === code || s.name.toLowerCase() === name.toLowerCase()))) {
      window.State.showToast(`State with code "${code}" or name "${name}" already exists in this country.`, 'error');
      return;
    }

    const newState = {
      id,
      country_id,
      code,
      tin,
      name,
      type,
      capital,
      zone,
      status: 'Active',
      created_at: new Date().toISOString()
    };

    window.DB.insert('states', newState);
    window.DB.logAudit('STATE_CREATED', 'COMMON_MASTER', id, `Added State: ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`State "${name}" added successfully.`, 'success');
    this.render();
  },

  showEditStateModal(stateId) {
    const state = window.DB.getById('states', stateId);
    if (!state) return;
    const allCountries = window.DB.getAll('countries') || [];

    const content = `
      <form id="edit-state-form" onsubmit="event.preventDefault(); window.CommonMasterModule.submitEditState('${stateId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label class="form-label">Country <span style="color: var(--color-danger)">*</span></label>
          <select id="edit-state-country" class="form-control" required>
            ${allCountries.map(c => `<option value="${c.id}" ${c.id === state.country_id ? 'selected' : ''}>${c.name} (${c.code})</option>`).join('')}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">State Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-state-code" class="form-control" value="${state.code}" required maxlength="4" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" />
          </div>
          <div>
            <label class="form-label">GST / TIN Code</label>
            <input type="text" id="edit-state-tin" class="form-control" value="${state.tin || ''}" maxlength="2" style="font-family: var(--font-mono);" />
          </div>
        </div>

        <div>
          <label class="form-label">State / Province Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="edit-state-name" class="form-control" value="${state.name}" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Type</label>
            <select id="edit-state-type" class="form-control">
              <option value="State" ${state.type === 'State' ? 'selected' : ''}>State</option>
              <option value="Union Territory" ${state.type === 'Union Territory' ? 'selected' : ''}>Union Territory</option>
              <option value="Province" ${state.type === 'Province' ? 'selected' : ''}>Province</option>
              <option value="Region" ${state.type === 'Region' ? 'selected' : ''}>Region</option>
            </select>
          </div>
          <div>
            <label class="form-label">Capital City</label>
            <input type="text" id="edit-state-capital" class="form-control" value="${state.capital || ''}" />
          </div>
        </div>

        <div>
          <label class="form-label">Zone / Direction</label>
          <input type="text" id="edit-state-zone" class="form-control" value="${state.zone || ''}" />
        </div>
      </form>
    `;

    window.State.openModal(`Edit State: ${state.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('edit-state-form').requestSubmit()">Save Changes</button>
    `);
  },

  submitEditState(stateId) {
    const country_id = document.getElementById('edit-state-country').value;
    const code = document.getElementById('edit-state-code').value.trim().toUpperCase();
    const tin = document.getElementById('edit-state-tin').value.trim();
    const name = document.getElementById('edit-state-name').value.trim();
    const type = document.getElementById('edit-state-type').value;
    const capital = document.getElementById('edit-state-capital').value.trim();
    const zone = document.getElementById('edit-state-zone').value.trim();

    window.DB.update('states', stateId, {
      country_id,
      code,
      tin,
      name,
      type,
      capital,
      zone
    });

    window.DB.logAudit('STATE_UPDATED', 'COMMON_MASTER', stateId, `Updated State: ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`State "${name}" updated successfully.`, 'success');
    this.render();
  },

  showStateDetailsModal(stateId) {
    const state = window.DB.getById('states', stateId);
    if (!state) return;
    const country = window.DB.getById('countries', state.country_id);
    const districts = window.DB.getDistricts(stateId);

    const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: rgba(167, 139, 250, 0.08); border-left: 4px solid #8b5cf6; padding: 12px 16px; border-radius: 4px;">
          <div style="font-size: 18px; font-weight: 700; color: #a78bfa;">${state.name} (${state.code})</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Country: ${country ? country.name : '-'} &bull; TIN/GST: ${state.tin || 'N/A'} &bull; Capital: ${state.capital || '-'}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px;">
          <div><b>Jurisdiction Type:</b> ${state.type || 'State'}</div>
          <div><b>Zone:</b> ${state.zone || '-'}</div>
          <div><b>Status:</b> <span class="status-pill ${state.status === 'Active' ? 'status-approved' : 'status-rejected'}">${state.status}</span></div>
          <div><b>Linked Districts:</b> ${districts.length} registered</div>
        </div>

        <div>
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px;">Districts within ${state.name} (${districts.length})</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 160px; overflow-y: auto;">
            ${districts.length === 0 ? '<span style="color:var(--text-muted); font-size:12px;">No districts created under this state yet.</span>' : districts.map(d => `
              <span class="badge badge-subtle" style="font-size: 11px;">${d.name} (${d.code})</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    window.State.openModal(`State Details: ${state.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      <button class="btn btn-primary" onclick="window.State.closeModal(); window.CommonMasterModule.showEditStateModal('${stateId}')">Edit</button>
    `);
  },

  toggleStateStatus(stateId) {
    const state = window.DB.getById('states', stateId);
    if (!state) return;
    const newStatus = state.status === 'Active' ? 'Inactive' : 'Active';
    window.DB.update('states', stateId, { status: newStatus });
    window.DB.logAudit('STATE_STATUS_TOGGLE', 'COMMON_MASTER', stateId, `Toggled State ${state.name} to ${newStatus}`);
    window.State.showToast(`State "${state.name}" is now ${newStatus}.`, newStatus === 'Active' ? 'success' : 'warning');
    this.render();
  },

  deleteState(stateId) {
    const state = window.DB.getById('states', stateId);
    if (!state) return;
    const linkedDistricts = window.DB.getDistricts(stateId);

    let confirmMsg = `Are you sure you want to remove state "${state.name}" (${state.code})?`;
    if (linkedDistricts.length > 0) {
      confirmMsg += `\n\nWarning: ${linkedDistricts.length} linked district(s) exist under this state.`;
    }

    if (confirm(confirmMsg)) {
      window.DB.delete('states', stateId);
      window.DB.logAudit('STATE_DELETED', 'COMMON_MASTER', stateId, `Removed State ${state.name}`);
      window.State.showToast(`State "${state.name}" removed successfully.`, 'success');
      this.render();
    }
  },

  exportStatesCsv() {
    const list = window.DB.getAll('states') || [];
    const countries = window.DB.getAll('countries') || [];
    let csv = 'ID,CountryCode,CountryName,StateCode,TIN,Name,Type,Zone,Capital,Status\n';
    list.forEach(s => {
      const c = countries.find(x => x.id === s.country_id);
      csv += `"${s.id}","${c ? c.code : ''}","${c ? c.name : ''}","${s.code}","${s.tin || ''}","${s.name}","${s.type || ''}","${s.zone || ''}","${s.capital || ''}","${s.status}"\n`;
    });
    this.downloadCsv('states_master.csv', csv);
  },

  // ==========================================================================
  // MODALS & ACTIONS: 3. DISTRICT MASTER
  // ==========================================================================
  showAddDistrictModal() {
    const allDistricts = window.DB.getAll('districts') || [];
    const allCountries = window.DB.getAll('countries') || [];
    const allStates = window.DB.getAll('states') || [];
    const nextId = `DIST-${String(allDistricts.length + 1).padStart(2, '0')}`;

    const defaultCountry = allCountries[0] ? allCountries[0].id : '';
    const filteredStates = allStates.filter(s => !defaultCountry || s.country_id === defaultCountry);

    const content = `
      <form id="add-district-form" onsubmit="event.preventDefault(); window.CommonMasterModule.submitCreateDistrict();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Country <span style="color: var(--color-danger)">*</span></label>
            <select id="new-district-country" class="form-control" onchange="window.CommonMasterModule.onDistrictModalCountryChange(this.value)" required>
              ${allCountries.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">State <span style="color: var(--color-danger)">*</span></label>
            <select id="new-district-state" class="form-control" required>
              ${filteredStates.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('')}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">District Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-district-code" class="form-control" placeholder="e.g. PUN" required maxlength="6" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" />
          </div>
          <div>
            <label class="form-label">District Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-district-name" class="form-control" placeholder="e.g. Pune" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Headquarters Town/City</label>
            <input type="text" id="new-district-hq" class="form-control" placeholder="e.g. Pune" />
          </div>
          <div>
            <label class="form-label">Administrative Division</label>
            <input type="text" id="new-district-division" class="form-control" placeholder="e.g. Pune Division" />
          </div>
        </div>

        <input type="hidden" id="new-district-id" value="${nextId}" />
      </form>
    `;

    window.State.openModal('Add New District Master', content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('add-district-form').requestSubmit()">Save District</button>
    `);
  },

  onDistrictModalCountryChange(countryId) {
    const states = window.DB.getStates(countryId);
    const select = document.getElementById('new-district-state');
    if (!select) return;
    select.innerHTML = states.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('');
  },

  submitCreateDistrict() {
    const id = document.getElementById('new-district-id').value;
    const country_id = document.getElementById('new-district-country').value;
    const state_id = document.getElementById('new-district-state').value;
    const code = document.getElementById('new-district-code').value.trim().toUpperCase();
    const name = document.getElementById('new-district-name').value.trim();
    const headquarters = document.getElementById('new-district-hq').value.trim();
    const division = document.getElementById('new-district-division').value.trim();

    const all = window.DB.getAll('districts') || [];
    if (all.some(d => d.state_id === state_id && (d.code === code || d.name.toLowerCase() === name.toLowerCase()))) {
      window.State.showToast(`District with code "${code}" or name "${name}" already exists in this state.`, 'error');
      return;
    }

    const newDistrict = {
      id,
      country_id,
      state_id,
      code,
      name,
      headquarters,
      division,
      status: 'Active',
      created_at: new Date().toISOString()
    };

    window.DB.insert('districts', newDistrict);
    window.DB.logAudit('DISTRICT_CREATED', 'COMMON_MASTER', id, `Added District: ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`District "${name}" added successfully.`, 'success');
    this.render();
  },

  showEditDistrictModal(districtId) {
    const district = window.DB.getById('districts', districtId);
    if (!district) return;
    const allCountries = window.DB.getAll('countries') || [];
    const allStates = window.DB.getAll('states') || [];
    const filteredStates = allStates.filter(s => s.country_id === district.country_id);

    const content = `
      <form id="edit-district-form" onsubmit="event.preventDefault(); window.CommonMasterModule.submitEditDistrict('${districtId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Country <span style="color: var(--color-danger)">*</span></label>
            <select id="edit-district-country" class="form-control" onchange="window.CommonMasterModule.onEditDistrictModalCountryChange(this.value)" required>
              ${allCountries.map(c => `<option value="${c.id}" ${c.id === district.country_id ? 'selected' : ''}>${c.name} (${c.code})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">State <span style="color: var(--color-danger)">*</span></label>
            <select id="edit-district-state" class="form-control" required>
              ${filteredStates.map(s => `<option value="${s.id}" ${s.id === district.state_id ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('')}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">District Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-district-code" class="form-control" value="${district.code}" required maxlength="6" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" />
          </div>
          <div>
            <label class="form-label">District Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-district-name" class="form-control" value="${district.name}" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Headquarters Town/City</label>
            <input type="text" id="edit-district-hq" class="form-control" value="${district.headquarters || ''}" />
          </div>
          <div>
            <label class="form-label">Administrative Division</label>
            <input type="text" id="edit-district-division" class="form-control" value="${district.division || ''}" />
          </div>
        </div>
      </form>
    `;

    window.State.openModal(`Edit District: ${district.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('edit-district-form').requestSubmit()">Save Changes</button>
    `);
  },

  onEditDistrictModalCountryChange(countryId) {
    const states = window.DB.getStates(countryId);
    const select = document.getElementById('edit-district-state');
    if (!select) return;
    select.innerHTML = states.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('');
  },

  submitEditDistrict(districtId) {
    const country_id = document.getElementById('edit-district-country').value;
    const state_id = document.getElementById('edit-district-state').value;
    const code = document.getElementById('edit-district-code').value.trim().toUpperCase();
    const name = document.getElementById('edit-district-name').value.trim();
    const headquarters = document.getElementById('edit-district-hq').value.trim();
    const division = document.getElementById('edit-district-division').value.trim();

    window.DB.update('districts', districtId, {
      country_id,
      state_id,
      code,
      name,
      headquarters,
      division
    });

    window.DB.logAudit('DISTRICT_UPDATED', 'COMMON_MASTER', districtId, `Updated District: ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`District "${name}" updated successfully.`, 'success');
    this.render();
  },

  showDistrictDetailsModal(districtId) {
    const district = window.DB.getById('districts', districtId);
    if (!district) return;
    const state = window.DB.getById('states', district.state_id);
    const country = state ? window.DB.getById('countries', state.country_id) : null;
    const cities = window.DB.getCities(districtId);

    const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: rgba(244, 114, 182, 0.08); border-left: 4px solid #ec4899; padding: 12px 16px; border-radius: 4px;">
          <div style="font-size: 18px; font-weight: 700; color: #f472b6;">${district.name} (${district.code})</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
            State: ${state ? state.name : '-'} &bull; Country: ${country ? country.name : '-'} &bull; HQ: ${district.headquarters || '-'}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px;">
          <div><b>Division:</b> ${district.division || '-'}</div>
          <div><b>Status:</b> <span class="status-pill ${district.status === 'Active' ? 'status-approved' : 'status-rejected'}">${district.status}</span></div>
          <div><b>Linked Cities & Towns:</b> ${cities.length}</div>
        </div>

        <div>
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px;">Cities & Localities in ${district.name} (${cities.length})</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 160px; overflow-y: auto;">
            ${cities.length === 0 ? '<span style="color:var(--text-muted); font-size:12px;">No cities created under this district yet.</span>' : cities.map(c => `
              <span class="badge badge-subtle" style="font-size: 11px;">${c.name} (${c.code})</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    window.State.openModal(`District Details: ${district.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      <button class="btn btn-primary" onclick="window.State.closeModal(); window.CommonMasterModule.showEditDistrictModal('${districtId}')">Edit</button>
    `);
  },

  toggleDistrictStatus(districtId) {
    const district = window.DB.getById('districts', districtId);
    if (!district) return;
    const newStatus = district.status === 'Active' ? 'Inactive' : 'Active';
    window.DB.update('districts', districtId, { status: newStatus });
    window.DB.logAudit('DISTRICT_STATUS_TOGGLE', 'COMMON_MASTER', districtId, `Toggled District ${district.name} to ${newStatus}`);
    window.State.showToast(`District "${district.name}" is now ${newStatus}.`, newStatus === 'Active' ? 'success' : 'warning');
    this.render();
  },

  deleteDistrict(districtId) {
    const district = window.DB.getById('districts', districtId);
    if (!district) return;
    const linkedCities = window.DB.getCities(districtId);

    let confirmMsg = `Are you sure you want to remove district "${district.name}" (${district.code})?`;
    if (linkedCities.length > 0) {
      confirmMsg += `\n\nWarning: ${linkedCities.length} linked city/town record(s) exist under this district.`;
    }

    if (confirm(confirmMsg)) {
      window.DB.delete('districts', districtId);
      window.DB.logAudit('DISTRICT_DELETED', 'COMMON_MASTER', districtId, `Removed District ${district.name}`);
      window.State.showToast(`District "${district.name}" removed successfully.`, 'success');
      this.render();
    }
  },

  exportDistrictsCsv() {
    const list = window.DB.getAll('districts') || [];
    const states = window.DB.getAll('states') || [];
    let csv = 'ID,DistrictCode,Name,StateName,Headquarters,Division,Status\n';
    list.forEach(d => {
      const s = states.find(x => x.id === d.state_id);
      csv += `"${d.id}","${d.code}","${d.name}","${s ? s.name : ''}","${d.headquarters || ''}","${d.division || ''}","${d.status}"\n`;
    });
    this.downloadCsv('districts_master.csv', csv);
  },

  // ==========================================================================
  // MODALS & ACTIONS: 4. CITY MASTER
  // ==========================================================================
  showAddCityModal() {
    const allCities = window.DB.getAll('cities') || [];
    const allStates = window.DB.getAll('states') || [];
    const allCountries = window.DB.getAll('countries') || [];
    const allDistricts = window.DB.getAll('districts') || [];
    const nextId = `CITY-${String(allCities.length + 1).padStart(2, '0')}`;

    const defaultState = allStates[0] ? allStates[0].id : '';
    const filteredDistricts = allDistricts.filter(d => !defaultState || d.state_id === defaultState);

    const content = `
      <form id="add-city-form" onsubmit="event.preventDefault(); window.CommonMasterModule.submitCreateCity();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">State <span style="color: var(--color-danger)">*</span></label>
            <select id="new-city-state" class="form-control" onchange="window.CommonMasterModule.onCityModalStateChange(this.value)" required>
              ${allStates.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">District <span style="color: var(--color-danger)">*</span></label>
            <select id="new-city-district" class="form-control" required>
              ${filteredDistricts.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('')}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">City Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-city-code" class="form-control" placeholder="e.g. PUN-CITY" required maxlength="10" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" />
          </div>
          <div>
            <label class="form-label">City / Town Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-city-name" class="form-control" placeholder="e.g. Pune" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">City Tier Classification</label>
            <select id="new-city-tier" class="form-control">
              <option value="Tier 1">Tier 1 (Major Urban)</option>
              <option value="Tier 2">Tier 2 (Emerging Industrial)</option>
              <option value="Tier 3">Tier 3 (Township / Rural)</option>
              <option value="Metro">Metro</option>
            </select>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 24px;">
            <input type="checkbox" id="new-city-hub" style="width: 16px; height: 16px;" checked />
            <label for="new-city-hub" style="margin: 0; font-size: 13px; cursor: pointer;">Major Industrial & Automotive Hub</label>
          </div>
        </div>

        <input type="hidden" id="new-city-id" value="${nextId}" />
      </form>
    `;

    window.State.openModal('Add New City Master', content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('add-city-form').requestSubmit()">Save City</button>
    `);
  },

  onCityModalStateChange(stateId) {
    const districts = window.DB.getDistricts(stateId);
    const select = document.getElementById('new-city-district');
    if (!select) return;
    select.innerHTML = districts.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');
  },

  submitCreateCity() {
    const id = document.getElementById('new-city-id').value;
    const state_id = document.getElementById('new-city-state').value;
    const district_id = document.getElementById('new-city-district').value;
    const code = document.getElementById('new-city-code').value.trim().toUpperCase();
    const name = document.getElementById('new-city-name').value.trim();
    const tier = document.getElementById('new-city-tier').value;
    const is_industrial_hub = document.getElementById('new-city-hub').checked;

    const state = window.DB.getById('states', state_id);
    const country_id = state ? state.country_id : 'CTRY-01';

    const all = window.DB.getAll('cities') || [];
    if (all.some(c => c.district_id === district_id && (c.code === code || c.name.toLowerCase() === name.toLowerCase()))) {
      window.State.showToast(`City with code "${code}" or name "${name}" already exists in this district.`, 'error');
      return;
    }

    const newCity = {
      id,
      country_id,
      state_id,
      district_id,
      code,
      name,
      tier,
      is_industrial_hub,
      status: 'Active',
      created_at: new Date().toISOString()
    };

    window.DB.insert('cities', newCity);
    window.DB.logAudit('CITY_CREATED', 'COMMON_MASTER', id, `Added City: ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`City "${name}" added successfully.`, 'success');
    this.render();
  },

  showEditCityModal(cityId) {
    const city = window.DB.getById('cities', cityId);
    if (!city) return;
    const allStates = window.DB.getAll('states') || [];
    const allDistricts = window.DB.getAll('districts') || [];
    const filteredDistricts = allDistricts.filter(d => d.state_id === city.state_id);

    const content = `
      <form id="edit-city-form" onsubmit="event.preventDefault(); window.CommonMasterModule.submitEditCity('${cityId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">State <span style="color: var(--color-danger)">*</span></label>
            <select id="edit-city-state" class="form-control" onchange="window.CommonMasterModule.onEditCityModalStateChange(this.value)" required>
              ${allStates.map(s => `<option value="${s.id}" ${s.id === city.state_id ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">District <span style="color: var(--color-danger)">*</span></label>
            <select id="edit-city-district" class="form-control" required>
              ${filteredDistricts.map(d => `<option value="${d.id}" ${d.id === city.district_id ? 'selected' : ''}>${d.name} (${d.code})</option>`).join('')}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">City Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-city-code" class="form-control" value="${city.code}" required maxlength="10" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" />
          </div>
          <div>
            <label class="form-label">City / Town Name <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-city-name" class="form-control" value="${city.name}" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">City Tier Classification</label>
            <select id="edit-city-tier" class="form-control">
              <option value="Tier 1" ${city.tier === 'Tier 1' ? 'selected' : ''}>Tier 1 (Major Urban)</option>
              <option value="Tier 2" ${city.tier === 'Tier 2' ? 'selected' : ''}>Tier 2 (Emerging Industrial)</option>
              <option value="Tier 3" ${city.tier === 'Tier 3' ? 'selected' : ''}>Tier 3 (Township / Rural)</option>
              <option value="Metro" ${city.tier === 'Metro' ? 'selected' : ''}>Metro</option>
            </select>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 24px;">
            <input type="checkbox" id="edit-city-hub" style="width: 16px; height: 16px;" ${city.is_industrial_hub ? 'checked' : ''} />
            <label for="edit-city-hub" style="margin: 0; font-size: 13px; cursor: pointer;">Major Industrial & Automotive Hub</label>
          </div>
        </div>
      </form>
    `;

    window.State.openModal(`Edit City: ${city.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('edit-city-form').requestSubmit()">Save Changes</button>
    `);
  },

  onEditCityModalStateChange(stateId) {
    const districts = window.DB.getDistricts(stateId);
    const select = document.getElementById('edit-city-district');
    if (!select) return;
    select.innerHTML = districts.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');
  },

  submitEditCity(cityId) {
    const state_id = document.getElementById('edit-city-state').value;
    const district_id = document.getElementById('edit-city-district').value;
    const code = document.getElementById('edit-city-code').value.trim().toUpperCase();
    const name = document.getElementById('edit-city-name').value.trim();
    const tier = document.getElementById('edit-city-tier').value;
    const is_industrial_hub = document.getElementById('edit-city-hub').checked;

    window.DB.update('cities', cityId, {
      state_id,
      district_id,
      code,
      name,
      tier,
      is_industrial_hub
    });

    window.DB.logAudit('CITY_UPDATED', 'COMMON_MASTER', cityId, `Updated City: ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`City "${name}" updated successfully.`, 'success');
    this.render();
  },

  showCityDetailsModal(cityId) {
    const city = window.DB.getById('cities', cityId);
    if (!city) return;
    const district = window.DB.getById('districts', city.district_id);
    const state = window.DB.getById('states', city.state_id);
    const country = state ? window.DB.getById('countries', state.country_id) : null;
    const pincodes = window.DB.getPincodes(cityId);

    const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: rgba(52, 211, 153, 0.08); border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 4px;">
          <div style="font-size: 18px; font-weight: 700; color: #34d399;">${city.name} (${city.code})</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
            District: ${district ? district.name : '-'} &bull; State: ${state ? state.name : '-'} &bull; Country: ${country ? country.name : '-'}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px;">
          <div><b>Classification Tier:</b> ${city.tier || 'Tier 2'}</div>
          <div><b>Industrial Cluster:</b> ${city.is_industrial_hub ? 'Yes (Key Automotive Hub)' : 'Standard City'}</div>
          <div><b>Status:</b> <span class="status-pill ${city.status === 'Active' ? 'status-approved' : 'status-rejected'}">${city.status}</span></div>
          <div><b>Registered Pin Codes:</b> ${pincodes.length}</div>
        </div>

        <div>
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px;">Pin Codes & Localities in ${city.name} (${pincodes.length})</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 160px; overflow-y: auto;">
            ${pincodes.length === 0 ? '<span style="color:var(--text-muted); font-size:12px;">No pin codes registered under this city yet.</span>' : pincodes.map(p => `
              <span class="badge badge-subtle" style="font-size: 11px;"><b>${p.pincode}</b> - ${p.area_name}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    window.State.openModal(`City Details: ${city.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      <button class="btn btn-primary" onclick="window.State.closeModal(); window.CommonMasterModule.showEditCityModal('${cityId}')">Edit</button>
    `);
  },

  toggleCityStatus(cityId) {
    const city = window.DB.getById('cities', cityId);
    if (!city) return;
    const newStatus = city.status === 'Active' ? 'Inactive' : 'Active';
    window.DB.update('cities', cityId, { status: newStatus });
    window.DB.logAudit('CITY_STATUS_TOGGLE', 'COMMON_MASTER', cityId, `Toggled City ${city.name} to ${newStatus}`);
    window.State.showToast(`City "${city.name}" is now ${newStatus}.`, newStatus === 'Active' ? 'success' : 'warning');
    this.render();
  },

  deleteCity(cityId) {
    const city = window.DB.getById('cities', cityId);
    if (!city) return;
    const linkedPincodes = window.DB.getPincodes(cityId);

    let confirmMsg = `Are you sure you want to remove city "${city.name}" (${city.code})?`;
    if (linkedPincodes.length > 0) {
      confirmMsg += `\n\nWarning: ${linkedPincodes.length} pin code(s) exist under this city.`;
    }

    if (confirm(confirmMsg)) {
      window.DB.delete('cities', cityId);
      window.DB.logAudit('CITY_DELETED', 'COMMON_MASTER', cityId, `Removed City ${city.name}`);
      window.State.showToast(`City "${city.name}" removed successfully.`, 'success');
      this.render();
    }
  },

  exportCitiesCsv() {
    const list = window.DB.getAll('cities') || [];
    const districts = window.DB.getAll('districts') || [];
    const states = window.DB.getAll('states') || [];
    let csv = 'ID,CityCode,Name,District,State,Tier,IndustrialHub,Status\n';
    list.forEach(c => {
      const d = districts.find(x => x.id === c.district_id);
      const s = states.find(x => x.id === c.state_id);
      csv += `"${c.id}","${c.code}","${c.name}","${d ? d.name : ''}","${s ? s.name : ''}","${c.tier || ''}","${c.is_industrial_hub ? 'Yes' : 'No'}","${c.status}"\n`;
    });
    this.downloadCsv('cities_master.csv', csv);
  },

  // ==========================================================================
  // MODALS & ACTIONS: 5. PIN CODE MASTER
  // ==========================================================================
  showAddPincodeModal() {
    const allPins = window.DB.getAll('pincodes') || [];
    const allCities = window.DB.getAll('cities') || [];
    const allStates = window.DB.getAll('states') || [];
    const nextId = `PIN-${String(allPins.length + 1).padStart(2, '0')}`;

    const content = `
      <form id="add-pincode-form" onsubmit="event.preventDefault(); window.CommonMasterModule.submitCreatePincode();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Pin Code (Postal Code) <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-pin-code" class="form-control" placeholder="e.g. 410501" required maxlength="10" style="font-family: var(--font-mono); font-weight: 700; font-size: 14px; letter-spacing: 1px;" />
          </div>
          <div>
            <label class="form-label">City / Town <span style="color: var(--color-danger)">*</span></label>
            <select id="new-pin-city" class="form-control" required>
              ${allCities.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Area / Locality / Post Office Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="new-pin-area" class="form-control" placeholder="e.g. Chakan Auto Cluster Phase II" required />
        </div>

        <div>
          <label class="form-label">Post Office Delivery Status</label>
          <select id="new-pin-delivery" class="form-control">
            <option value="Delivery">Delivery Post Office</option>
            <option value="Non-Delivery">Non-Delivery / Branch Office</option>
          </select>
        </div>

        <input type="hidden" id="new-pin-id" value="${nextId}" />
      </form>
    `;

    window.State.openModal('Add New Pin Code Master', content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('add-pincode-form').requestSubmit()">Save Pin Code</button>
    `);
  },

  submitCreatePincode() {
    const id = document.getElementById('new-pin-id').value;
    const pincode = document.getElementById('new-pin-code').value.trim();
    const city_id = document.getElementById('new-pin-city').value;
    const area_name = document.getElementById('new-pin-area').value.trim();
    const delivery_status = document.getElementById('new-pin-delivery').value;

    if (!pincode) {
      window.State.showToast('Pin code is required.', 'error');
      return;
    }

    const city = window.DB.getById('cities', city_id);
    const district_id = city ? city.district_id : '';
    const state_id = city ? city.state_id : '';
    const country_id = city ? city.country_id : 'CTRY-01';

    const all = window.DB.getAll('pincodes') || [];
    if (all.some(p => p.pincode === pincode && p.area_name.toLowerCase() === area_name.toLowerCase())) {
      window.State.showToast(`Pin code "${pincode}" with area "${area_name}" already exists.`, 'error');
      return;
    }

    const newPin = {
      id,
      pincode,
      area_name,
      country_id,
      state_id,
      district_id,
      city_id,
      delivery_status,
      status: 'Active',
      created_at: new Date().toISOString()
    };

    window.DB.insert('pincodes', newPin);
    window.DB.logAudit('PINCODE_CREATED', 'COMMON_MASTER', id, `Added Pin Code: ${pincode} (${area_name})`);
    window.State.closeModal();
    window.State.showToast(`Pin code "${pincode}" added successfully.`, 'success');
    this.render();
  },

  showEditPincodeModal(pincodeId) {
    const pin = window.DB.getById('pincodes', pincodeId);
    if (!pin) return;
    const allCities = window.DB.getAll('cities') || [];

    const content = `
      <form id="edit-pincode-form" onsubmit="event.preventDefault(); window.CommonMasterModule.submitEditPincode('${pincodeId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Pin Code (Postal Code) <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="edit-pin-code" class="form-control" value="${pin.pincode}" required maxlength="10" style="font-family: var(--font-mono); font-weight: 700; font-size: 14px; letter-spacing: 1px;" />
          </div>
          <div>
            <label class="form-label">City / Town <span style="color: var(--color-danger)">*</span></label>
            <select id="edit-pin-city" class="form-control" required>
              ${allCities.map(c => `<option value="${c.id}" ${c.id === pin.city_id ? 'selected' : ''}>${c.name} (${c.code})</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Area / Locality / Post Office Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="edit-pin-area" class="form-control" value="${pin.area_name}" required />
        </div>

        <div>
          <label class="form-label">Post Office Delivery Status</label>
          <select id="edit-pin-delivery" class="form-control">
            <option value="Delivery" ${pin.delivery_status === 'Delivery' ? 'selected' : ''}>Delivery Post Office</option>
            <option value="Non-Delivery" ${pin.delivery_status === 'Non-Delivery' ? 'selected' : ''}>Non-Delivery / Branch Office</option>
          </select>
        </div>
      </form>
    `;

    window.State.openModal(`Edit Pin Code: ${pin.pincode}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('edit-pincode-form').requestSubmit()">Save Changes</button>
    `);
  },

  submitEditPincode(pincodeId) {
    const pincode = document.getElementById('edit-pin-code').value.trim();
    const city_id = document.getElementById('edit-pin-city').value;
    const area_name = document.getElementById('edit-pin-area').value.trim();
    const delivery_status = document.getElementById('edit-pin-delivery').value;

    const city = window.DB.getById('cities', city_id);
    const district_id = city ? city.district_id : '';
    const state_id = city ? city.state_id : '';
    const country_id = city ? city.country_id : 'CTRY-01';

    window.DB.update('pincodes', pincodeId, {
      pincode,
      area_name,
      city_id,
      district_id,
      state_id,
      country_id,
      delivery_status
    });

    window.DB.logAudit('PINCODE_UPDATED', 'COMMON_MASTER', pincodeId, `Updated Pin Code: ${pincode} (${area_name})`);
    window.State.closeModal();
    window.State.showToast(`Pin code "${pincode}" updated successfully.`, 'success');
    this.render();
  },

  showPincodeDetailsModal(pincodeId) {
    const pin = window.DB.getById('pincodes', pincodeId);
    if (!pin) return;
    const city = window.DB.getById('cities', pin.city_id);
    const district = window.DB.getById('districts', pin.district_id);
    const state = window.DB.getById('states', pin.state_id);
    const country = state ? window.DB.getById('countries', state.country_id) : null;

    const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: rgba(251, 191, 36, 0.08); border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px;">
          <div style="font-size: 20px; font-weight: 700; color: #fbbf24; font-family: var(--font-mono);">${pin.pincode}</div>
          <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-top: 2px;">${pin.area_name}</div>
        </div>

        <!-- Geographic Lineage Breadcrumb -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md); font-size: 12px;">
          <span style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Complete Geographic Lineage</span>
          <span style="color: #60a5fa; font-weight: 600;">${country ? country.name : 'India'}</span> &rarr;
          <span style="color: #a78bfa; font-weight: 600;">${state ? state.name : '-'}</span> &rarr;
          <span style="color: #f472b6; font-weight: 600;">${district ? district.name : '-'}</span> &rarr;
          <span style="color: #34d399; font-weight: 600;">${city ? city.name : '-'}</span> &rarr;
          <span style="color: #fbbf24; font-weight: 700;">${pin.pincode}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px;">
          <div><b>Delivery Type:</b> ${pin.delivery_status || 'Delivery'}</div>
          <div><b>Status:</b> <span class="status-pill ${pin.status === 'Active' ? 'status-approved' : 'status-rejected'}">${pin.status}</span></div>
          <div><b>City Tier:</b> ${city ? city.tier : 'Tier 2'}</div>
          <div><b>Industrial Hub:</b> ${city && city.is_industrial_hub ? 'Yes' : 'Standard'}</div>
        </div>
      </div>
    `;

    window.State.openModal(`Pin Code Details: ${pin.pincode}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      <button class="btn btn-primary" onclick="window.State.closeModal(); window.CommonMasterModule.showEditPincodeModal('${pincodeId}')">Edit</button>
    `);
  },

  togglePincodeStatus(pincodeId) {
    const pin = window.DB.getById('pincodes', pincodeId);
    if (!pin) return;
    const newStatus = pin.status === 'Active' ? 'Inactive' : 'Active';
    window.DB.update('pincodes', pincodeId, { status: newStatus });
    window.DB.logAudit('PINCODE_STATUS_TOGGLE', 'COMMON_MASTER', pincodeId, `Toggled Pin Code ${pin.pincode} to ${newStatus}`);
    window.State.showToast(`Pin code "${pin.pincode}" is now ${newStatus}.`, newStatus === 'Active' ? 'success' : 'warning');
    this.render();
  },

  deletePincode(pincodeId) {
    const pin = window.DB.getById('pincodes', pincodeId);
    if (!pin) return;

    if (confirm(`Are you sure you want to remove pin code "${pin.pincode}" (${pin.area_name})?`)) {
      window.DB.delete('pincodes', pincodeId);
      window.DB.logAudit('PINCODE_DELETED', 'COMMON_MASTER', pincodeId, `Removed Pin Code ${pin.pincode}`);
      window.State.showToast(`Pin code "${pin.pincode}" removed successfully.`, 'success');
      this.render();
    }
  },

  exportPincodesCsv() {
    const list = window.DB.getAll('pincodes') || [];
    const cities = window.DB.getAll('cities') || [];
    const states = window.DB.getAll('states') || [];
    let csv = 'ID,Pincode,AreaName,City,State,DeliveryStatus,Status\n';
    list.forEach(p => {
      const c = cities.find(x => x.id === p.city_id);
      const s = states.find(x => x.id === p.state_id);
      csv += `"${p.id}","${p.pincode}","${p.area_name}","${c ? c.name : ''}","${s ? s.name : ''}","${p.delivery_status || ''}","${p.status}"\n`;
    });
    this.downloadCsv('pincodes_master.csv', csv);
  },

  // ==========================================================================
  // HELPER UTILITIES
  // ==========================================================================
  downloadCsv(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    if (typeof link.click === 'function') {
      link.click();
    }
    document.body.removeChild(link);
  }
};
