/* ==========================================================================
   ENTERPRISE ISCM - HOLIDAY MASTER MODULE (BRD v1.0 COMPLIANT)
   Centralized Holiday Calendar Governance for Organization & Facilities
   Hierarchy: Organization → Facility → Financial Year → Holiday Calendar → Holiday
   Applicability: Organization-wide (all facilities) or Facility-specific
   ========================================================================== */

window.HolidayMasterModule = {
  searchTerm: '',
  facilityFilter: 'ALL',
  typeFilter: 'ALL',
  categoryFilter: 'ALL',
  statusFilter: 'ALL',
  fyFilter: 'ALL',
  viewMode: 'TABLE', // 'TABLE' | 'CALENDAR'
  calendarYear: 2026,
  calendarMonth: 3, // 0-indexed, 3 = April (Start of FY 2026-27)
  currentPage: 1,
  pageSize: 10,

  // 7 Configurable Holiday Types (BRD Section 9)
  DEFAULT_TYPES: [
    { code: 'NAT', name: 'National Holiday', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' },
    { code: 'ST', name: 'State Holiday', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
    { code: 'FEST', name: 'Festival Holiday', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
    { code: 'LOC', name: 'Local Holiday', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)' },
    { code: 'COMP', name: 'Company Holiday', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)' },
    { code: 'SPEC', name: 'Special Holiday', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)' },
    { code: 'OTH', name: 'Other', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', border: 'rgba(100, 116, 139, 0.3)' }
  ],

  // Data Access Helpers
  getHolidayTypes() {
    const list = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('holiday_types') || []) : [];
    if (list.length > 0) return list;
    if (typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.holiday_types) && INITIAL_DATA.holiday_types.length > 0) {
      return INITIAL_DATA.holiday_types;
    }
    return this.DEFAULT_TYPES;
  },

  getFacilities() {
    const plants = (window.DB && typeof window.DB.getActivePlants === 'function')
      ? window.DB.getActivePlants()
      : ((window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('plants') : []);
    const active = plants.filter(p => !window.DB || typeof window.DB.isPlantActive !== 'function' || window.DB.isPlantActive(p.id, true));
    if (active.length > 0) {
      return active.map(p => ({
        id: p.id,
        code: (p.branch_code || p.code || p.id).toUpperCase(),
        name: p.name || `Facility ${p.id}`
      }));
    }
    return [
      { id: 'PLANT-01', code: 'MSC1', name: 'Mauli Service Center 1' }
    ];
  },

  getOrganizations() {
    const orgs = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('organizations') || []) : [];
    if (orgs.length > 0) {
      return orgs.map(o => ({ id: o.id, name: o.name || o.organization_name || 'Organization' }));
    }
    return [{ id: 'ORG-001', name: 'Mauli Service Center Pvt. Ltd.' }];
  },

  getFinancialYears() {
    const fcs = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('financial_calendar') || []) : [];
    if (fcs.length > 0) {
      return fcs.map(f => ({
        id: f.id,
        code: f.financial_year_code || 'FY 2026-27',
        name: f.financial_year_name || f.financial_year_code,
        startDate: f.start_date || '2026-04-01',
        endDate: f.end_date || '2027-03-31',
        isCurrent: f.current_year_yn !== false
      }));
    }
    return [
      { id: 'FC-001', code: 'FY 2026-27', name: 'Financial Year 2026-2027', startDate: '2026-04-01', endDate: '2027-03-31', isCurrent: true },
      { id: 'FC-002', code: 'FY 2025-26', name: 'Financial Year 2025-2026', startDate: '2025-04-01', endDate: '2026-03-31', isCurrent: false }
    ];
  },

  getAllHolidays() {
    let list = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('holidays') || []) : [];
    if (list.length === 0 && typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.holidays)) {
      list = JSON.parse(JSON.stringify(INITIAL_DATA.holidays));
      if (window.DB && typeof window.DB.upsert === 'function') {
        list.forEach(item => window.DB.upsert('holidays', item));
      }
    }
    return list;
  },

  getAuditLogs() {
    let list = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('holiday_audit') || []) : [];
    if (list.length === 0 && typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.holiday_audit)) {
      list = JSON.parse(JSON.stringify(INITIAL_DATA.holiday_audit));
    }
    return list;
  },

  // Main UI Render Entry Points
  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    const pageTopBar = (typeof document !== 'undefined' && document.getElementById) 
      ? (document.getElementById('page-top-bar') || (document.querySelector && document.querySelector('.page-top-bar'))) 
      : null;
    if (pageTopBar) pageTopBar.style.display = 'none';

    container.innerHTML = this.renderContentCard();
  },

  renderTab(container) {
    if (!container) container = document.getElementById('org-location-tab-content');
    return this.renderContentCard();
  },

  renderContentCard() {
    return `
      <div class="content-card" id="holiday-master-wrapper" style="font-family: var(--font-sans, 'Inter', sans-serif);">
        ${this.renderMetricsSummary()}
        ${this.renderCardHeader()}
        <div id="holiday-table-container">
          ${this.viewMode === 'CALENDAR' ? this.renderCalendarView() : this.renderTableContent()}
        </div>
      </div>
    `;
  },

  renderMetricsSummary() {
    const list = this.getAllHolidays();
    const total = list.length;
    const orgCount = list.filter(h => h.applicable_level === 'ORGANIZATION').length;
    const facilityCount = list.filter(h => h.applicable_level === 'FACILITY').length;
    const statutoryCount = list.filter(h => ['NAT', 'ST'].includes(h.holiday_type_id)).length;
    const halfDayCount = list.filter(h => h.holiday_category === 'HALF_DAY').length;

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
        <div style="background: var(--surface-card, #1e293b); border: 1px solid var(--border-color, #334155); border-radius: 8px; padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Total Holidays</div>
          <div style="font-size: 22px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${total}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">FY 2026-27 Calendar</div>
        </div>
        <div style="background: var(--surface-card, #1e293b); border: 1px solid var(--border-color, #334155); border-radius: 8px; padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #3b82f6; letter-spacing: 0.5px;">Organization-Wide</div>
          <div style="font-size: 22px; font-weight: 700; color: #3b82f6; margin-top: 4px;">${orgCount}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Applies to All Facilities</div>
        </div>
        <div style="background: var(--surface-card, #1e293b); border: 1px solid var(--border-color, #334155); border-radius: 8px; padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8b5cf6; letter-spacing: 0.5px;">Facility Specific</div>
          <div style="font-size: 22px; font-weight: 700; color: #8b5cf6; margin-top: 4px;">${facilityCount}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Facility Local Holidays</div>
        </div>
        <div style="background: var(--surface-card, #1e293b); border: 1px solid var(--border-color, #334155); border-radius: 8px; padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #10b981; letter-spacing: 0.5px;">National & State</div>
          <div style="font-size: 22px; font-weight: 700; color: #10b981; margin-top: 4px;">${statutoryCount}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Statutory Gazetted</div>
        </div>
        <div style="background: var(--surface-card, #1e293b); border: 1px solid var(--border-color, #334155); border-radius: 8px; padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #f59e0b; letter-spacing: 0.5px;">Half-Day Holidays</div>
          <div style="font-size: 22px; font-weight: 700; color: #f59e0b; margin-top: 4px;">${halfDayCount}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Custom Work Hours</div>
        </div>
      </div>
    `;
  },

  renderCardHeader() {
    const facilities = this.getFacilities();
    const fys = this.getFinancialYears();
    const types = this.getHolidayTypes();

    return `
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;">
        <!-- Left: Search and Filters -->
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <!-- Search box -->
          <div style="position: relative; display: inline-flex; align-items: center;">
            <input 
              type="text" 
              id="holiday-search-input" 
              class="form-control form-control-sm" 
              placeholder="Search code, name, desc..." 
              value="${this.searchTerm}" 
              oninput="window.HolidayMasterModule.setSearch(this.value)" 
              style="width: 200px; height: 32px; font-size: 13px; padding-right: 24px;" 
              autocomplete="off"
            />
            <button 
              id="holiday-search-clear"
              type="button" 
              onclick="window.HolidayMasterModule.clearSearch()" 
              style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: ${this.searchTerm ? 'block' : 'none'}; font-size: 14px; line-height: 1;"
              title="Clear search"
            >&times;</button>
          </div>

          <!-- Scope / Facility Filter -->
          <select 
            id="holiday-facility-filter" 
            class="form-control form-control-sm" 
            onchange="window.HolidayMasterModule.setFacilityFilter(this.value)" 
            style="width: 175px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.facilityFilter === 'ALL' ? 'selected' : ''}>All Scopes & Facilities</option>
            <option value="ORGANIZATION" ${this.facilityFilter === 'ORGANIZATION' ? 'selected' : ''}>Organization-Wide Only</option>
            ${facilities.map(f => `
              <option value="${f.id}" ${this.facilityFilter === f.id ? 'selected' : ''}>${f.name}</option>
            `).join('')}
          </select>

          <!-- Financial Year Filter -->
          <select 
            id="holiday-fy-filter" 
            class="form-control form-control-sm" 
            onchange="window.HolidayMasterModule.setFyFilter(this.value)" 
            style="width: 135px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.fyFilter === 'ALL' ? 'selected' : ''}>All FY</option>
            ${fys.map(f => `
              <option value="${f.id}" ${this.fyFilter === f.id ? 'selected' : ''}>${f.code}</option>
            `).join('')}
          </select>

          <!-- Holiday Type Filter -->
          <select 
            id="holiday-type-filter" 
            class="form-control form-control-sm" 
            onchange="window.HolidayMasterModule.setTypeFilter(this.value)" 
            style="width: 145px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.typeFilter === 'ALL' ? 'selected' : ''}>All Types</option>
            ${types.map(t => `
              <option value="${t.code || t.id}" ${this.typeFilter === (t.code || t.id) ? 'selected' : ''}>${t.name}</option>
            `).join('')}
          </select>

          <!-- Category Filter -->
          <select 
            id="holiday-category-filter" 
            class="form-control form-control-sm" 
            onchange="window.HolidayMasterModule.setCategoryFilter(this.value)" 
            style="width: 125px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.categoryFilter === 'ALL' ? 'selected' : ''}>All Categories</option>
            <option value="FULL_DAY" ${this.categoryFilter === 'FULL_DAY' ? 'selected' : ''}>Full Day</option>
            <option value="HALF_DAY" ${this.categoryFilter === 'HALF_DAY' ? 'selected' : ''}>Half Day</option>
          </select>

          <!-- Status Filter -->
          <select 
            id="holiday-status-filter" 
            class="form-control form-control-sm" 
            onchange="window.HolidayMasterModule.setStatusFilter(this.value)" 
            style="width: 110px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
            <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>

        <!-- Right: View Mode Toggle & Actions -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <!-- View Mode Toggle (Table / Calendar) -->
          <div style="display: inline-flex; border: 1px solid var(--border-color, #334155); border-radius: 6px; overflow: hidden;">
            <button 
              type="button" 
              onclick="window.HolidayMasterModule.setViewMode('TABLE')"
              style="padding: 6px 12px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; background: ${this.viewMode === 'TABLE' ? 'var(--primary-600, #2563eb)' : 'transparent'}; color: ${this.viewMode === 'TABLE' ? '#fff' : 'var(--text-muted)'};"
            >
              📋 Table
            </button>
            <button 
              type="button" 
              onclick="window.HolidayMasterModule.setViewMode('CALENDAR')"
              style="padding: 6px 12px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; background: ${this.viewMode === 'CALENDAR' ? 'var(--primary-600, #2563eb)' : 'transparent'}; color: ${this.viewMode === 'CALENDAR' ? '#fff' : 'var(--text-muted)'};"
            >
              📅 Calendar
            </button>
          </div>

          <button class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.showAuditModal()" title="View Holiday Master Audit Trail" style="height: 32px; font-size: 13px;">
            📜 Audit Log
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.exportCsv()" title="Export Holidays to CSV" style="height: 32px; font-size: 13px;">
            Export CSV
          </button>
          <button id="btn-add-holiday" class="btn btn-primary btn-sm" onclick="window.HolidayMasterModule.showAddModal()" style="height: 32px; font-size: 13px; font-weight: 600;">
            + Add Holiday
          </button>
        </div>
      </div>
    `;
  },

  getFilteredHolidays() {
    let list = this.getAllHolidays();

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      list = list.filter(item => {
        const text = [
          item.id,
          item.holiday_code,
          item.holiday_name,
          item.holiday_date,
          item.day_name,
          item.facility_name,
          item.description
        ].filter(Boolean).join(' ').toLowerCase();
        return text.includes(q);
      });
    }

    if (this.facilityFilter !== 'ALL') {
      if (this.facilityFilter === 'ORGANIZATION') {
        list = list.filter(item => item.applicable_level === 'ORGANIZATION');
      } else {
        list = list.filter(item => item.applicable_level === 'FACILITY' && item.facility_id === this.facilityFilter);
      }
    }

    if (this.fyFilter !== 'ALL') {
      list = list.filter(item => item.financial_year_id === this.fyFilter || item.financial_year_code === this.fyFilter);
    }

    if (this.typeFilter !== 'ALL') {
      list = list.filter(item => item.holiday_type_id === this.typeFilter);
    }

    if (this.categoryFilter !== 'ALL') {
      list = list.filter(item => item.holiday_category === this.categoryFilter);
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter(item => {
        const active = item.active_yn !== false && item.status !== 'Inactive';
        return this.statusFilter === 'Active' ? active : !active;
      });
    }

    return list.sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date));
  },

  renderTableContent() {
    const list = this.getFilteredHolidays();
    const totalFiltered = list.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const pageItems = list.slice(startIdx, startIdx + this.pageSize);

    if (pageItems.length === 0) {
      return `
        <div style="text-align: center; padding: 48px 16px;">
          <div style="font-size: 32px; margin-bottom: 8px;">🗓️</div>
          <div style="font-size: 16px; font-weight: 600; color: var(--text-primary);">No Holidays Configured</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px; max-width: 420px; margin-left: auto; margin-right: auto;">
            No holiday records match your current search query or active filter settings.
          </div>
          <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.resetFilters()">Clear Filters</button>
            <button class="btn btn-primary btn-sm" onclick="window.HolidayMasterModule.showAddModal()">+ Add Holiday</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Holiday Code</th>
              <th>Holiday Name</th>
              <th>Holiday Date & Day</th>
              <th>Type</th>
              <th>Category & Timing</th>
              <th>Applicable Scope</th>
              <th>Financial Year</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pageItems.map(item => this.renderTableRow(item)).join('')}
          </tbody>
        </table>
      </div>
      ${this.renderPagination(totalFiltered, totalPages)}
    `;
  },

  renderTableRow(item) {
    const types = this.getHolidayTypes();
    const typeObj = types.find(t => (t.code || t.id) === item.holiday_type_id) || { name: item.holiday_type_id, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
    const isActive = item.active_yn !== false && item.status !== 'Inactive';
    const isHalfDay = item.holiday_category === 'HALF_DAY';
    const isOrg = item.applicable_level === 'ORGANIZATION';

    // Format date string: DD-MM-YYYY
    const d = new Date(item.holiday_date);
    const dayStr = item.day_name || d.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = (typeof window.formatDate === 'function') 
      ? window.formatDate(item.holiday_date) 
      : item.holiday_date;

    return `
      <tr data-holiday-id="${item.id}">
        <!-- Holiday Code -->
        <td>
          <span class="cell-mono cell-strong" style="color: var(--primary-300, #93c5fd);">${item.holiday_code}</span>
        </td>

        <!-- Holiday Name -->
        <td>
          <div class="cell-strong" style="color: var(--text-primary);">${item.holiday_name}</div>
          ${item.recurring_yn ? `<span style="font-size: 11px; color: #10b981;">🔁 Recurring Annual</span>` : ''}
        </td>

        <!-- Date & Day -->
        <td>
          <div style="font-weight: 600;">${formattedDate}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${dayStr}</div>
        </td>

        <!-- Holiday Type -->
        <td>
          <span class="badge" style="background: ${typeObj.bg || 'rgba(59, 130, 246, 0.15)'}; color: ${typeObj.color || '#3b82f6'}; border: 1px solid ${typeObj.border || 'transparent'}; font-size: 11px; padding: 2px 8px; border-radius: 4px;">
            ${typeObj.name || item.holiday_type_id}
          </span>
        </td>

        <!-- Category & Timing -->
        <td>
          ${isHalfDay ? `
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 11px;">Half Day</span>
              <span style="font-size: 12px; font-mono; color: var(--text-secondary);">${item.from_time || '09:00'} - ${item.to_time || '13:30'}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${item.half_day_type === 'FIRST_HALF' ? 'First Half' : 'Second Half'}</div>
          ` : `
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px;">Full Day</span>
          `}
        </td>

        <!-- Applicable Scope -->
        <td>
          ${isOrg ? `
            <div>
              <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); font-size: 11px;">Organization</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">All Facilities (Mauli 1 & 2)</div>
          ` : `
            <div>
              <span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); font-size: 11px;">Facility</span>
            </div>
            <div style="font-size: 12px; font-weight: 500; color: var(--text-primary); margin-top: 2px;">${item.facility_name || 'Selected Facility'}</div>
          `}
        </td>

        <!-- Financial Year -->
        <td>
          <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">${item.financial_year_code || 'FY 2026-27'}</span>
        </td>

        <!-- Status -->
        <td class="text-center">
          <span class="status-badge ${isActive ? 'active' : 'inactive'}" style="font-size: 11px; padding: 2px 8px;">
            ${isActive ? '● ACTIVE' : '○ INACTIVE'}
          </span>
        </td>

        <!-- Actions -->
        <td class="text-right">
          <div style="display: inline-flex; gap: 4px; align-items: center;">
            <button class="btn btn-icon btn-sm" onclick="window.HolidayMasterModule.showDetailsModal('${item.id}')" title="View Details">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button class="btn btn-icon btn-sm" onclick="window.HolidayMasterModule.showEditModal('${item.id}')" title="Edit Holiday">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn btn-icon btn-sm" onclick="window.HolidayMasterModule.promptToggleStatus('${item.id}')" title="${isActive ? 'Deactivate Holiday' : 'Activate Holiday'}">
              ${isActive ? `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-warning, #f59e0b);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              ` : `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success, #10b981);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
              `}
            </button>
            <button class="btn btn-icon btn-sm" onclick="window.HolidayMasterModule.deleteHoliday('${item.id}')" title="Delete Holiday" style="color: var(--color-danger, #ef4444);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  renderPagination(totalCount, totalPages) {
    if (totalPages <= 1) return '';

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid var(--border-color, #334155); font-size: 13px; color: var(--text-muted);">
        <div>Showing ${(this.currentPage - 1) * this.pageSize + 1} - ${Math.min(this.currentPage * this.pageSize, totalCount)} of ${totalCount} holidays</div>
        <div style="display: flex; gap: 4px;">
          <button class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.setPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
          <span style="display: inline-flex; align-items: center; padding: 0 8px; font-weight: 600;">Page ${this.currentPage} of ${totalPages}</span>
          <button class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.setPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    `;
  },

  // Interactive Calendar View (BRD Section 19.1)
  renderCalendarView() {
    const list = this.getFilteredHolidays();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const curYear = this.calendarYear;
    const curMonth = this.calendarMonth;

    // Days in month calculation
    const firstDayIndex = new Date(curYear, curMonth, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return `
      <div style="padding: 16px; background: var(--surface-card, #1e293b); border-radius: 8px; border: 1px solid var(--border-color, #334155);">
        <!-- Calendar Header Navigation -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--text-primary);">
              ${monthNames[curMonth]} ${curYear}
            </h3>
            <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">FY 2026-27</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.changeCalendarMonth(-1)">
              ◀ Previous
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.jumpCalendarMonth(2026, 3)">
              Current (Apr 2026)
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.changeCalendarMonth(1)">
              Next ▶
            </button>
          </div>
        </div>

        <!-- 7 Days Grid Header -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; font-weight: 600; font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">
          ${dayLabels.map(d => `<div style="padding: 6px;">${d}</div>`).join('')}
        </div>

        <!-- Days Grid -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">
          ${Array(firstDayIndex).fill('').map(() => `
            <div style="min-height: 85px; background: rgba(0,0,0,0.1); border-radius: 6px; border: 1px dashed rgba(255,255,255,0.05);"></div>
          `).join('')}

          ${Array.from({ length: totalDaysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayHolidays = list.filter(h => String(h.holiday_date).split('T')[0] === dateStr);
            const isToday = false;

            return `
              <div style="min-height: 85px; padding: 6px; background: ${dayHolidays.length > 0 ? 'rgba(59, 130, 246, 0.08)' : 'var(--surface-overlay, #0f172a)'}; border: 1px solid ${dayHolidays.length > 0 ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-color, #334155)'}; border-radius: 6px; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 13px; font-weight: ${dayHolidays.length > 0 ? '700' : '500'}; color: ${dayHolidays.length > 0 ? '#3b82f6' : 'var(--text-primary)'};">
                    ${day}
                  </span>
                  ${dayHolidays.length > 0 ? `<span style="font-size: 10px; color: #10b981;">🎉</span>` : ''}
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; overflow-y: auto; max-height: 60px;">
                  ${dayHolidays.map(dh => `
                    <div 
                      onclick="window.HolidayMasterModule.showDetailsModal('${dh.id}')"
                      title="${dh.holiday_name} (${dh.applicable_level === 'ORGANIZATION' ? 'All Facilities' : (dh.facility_name || 'Facility')})"
                      style="font-size: 10px; font-weight: 600; padding: 2px 4px; border-radius: 3px; background: rgba(59, 130, 246, 0.2); color: #93c5fd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; border-left: 2px solid #3b82f6;"
                    >
                      ${dh.holiday_name}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // State Updates & Filter Handlers
  setSearch(val) {
    this.searchTerm = val;
    this.currentPage = 1;
    this.refreshTable();
  },

  clearSearch() {
    this.searchTerm = '';
    const inp = document.getElementById('holiday-search-input');
    if (inp) inp.value = '';
    this.refreshTable();
  },

  setFacilityFilter(val) {
    this.facilityFilter = val;
    this.currentPage = 1;
    this.refreshTable();
  },

  setFyFilter(val) {
    this.fyFilter = val;
    this.currentPage = 1;
    this.refreshTable();
  },

  setTypeFilter(val) {
    this.typeFilter = val;
    this.currentPage = 1;
    this.refreshTable();
  },

  setCategoryFilter(val) {
    this.categoryFilter = val;
    this.currentPage = 1;
    this.refreshTable();
  },

  setStatusFilter(val) {
    this.statusFilter = val;
    this.currentPage = 1;
    this.refreshTable();
  },

  setViewMode(mode) {
    this.viewMode = mode;
    this.refreshTable();
  },

  changeCalendarMonth(delta) {
    let m = this.calendarMonth + delta;
    let y = this.calendarYear;
    if (m > 11) { m = 0; y++; }
    else if (m < 0) { m = 11; y--; }
    this.calendarMonth = m;
    this.calendarYear = y;
    this.refreshTable();
  },

  jumpCalendarMonth(year, month) {
    this.calendarYear = year;
    this.calendarMonth = month;
    this.refreshTable();
  },

  setPage(page) {
    this.currentPage = page;
    this.refreshTable();
  },

  resetFilters() {
    this.searchTerm = '';
    this.facilityFilter = 'ALL';
    this.fyFilter = 'ALL';
    this.typeFilter = 'ALL';
    this.categoryFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
    if (window.OrgLocationModule) {
      window.OrgLocationModule.render();
    } else {
      this.render();
    }
  },

  refreshTable() {
    const container = document.getElementById('holiday-table-container');
    if (container) {
      container.innerHTML = this.viewMode === 'CALENDAR' ? this.renderCalendarView() : this.renderTableContent();
    }
    const clearBtn = document.getElementById('holiday-search-clear');
    if (clearBtn) {
      clearBtn.style.display = this.searchTerm ? 'block' : 'none';
    }
  },

  // Modal Handlers (Add, Edit, View Details, Audit, Confirm Deactivate)
  showAddModal() {
    this.showHolidayModal(null);
  },

  showEditModal(id) {
    const list = this.getAllHolidays();
    const item = list.find(h => h.id === id);
    if (!item) return;
    this.showHolidayModal(item);
  },

  showHolidayModal(existingItem) {
    const isEdit = !!existingItem;
    const orgs = this.getOrganizations();
    const facilities = this.getFacilities();
    const fys = this.getFinancialYears();
    const types = this.getHolidayTypes();

    const currentYear = new Date().getFullYear();
    const nextId = isEdit ? existingItem.id : `HOL-${String(this.getAllHolidays().length + 1).padStart(3, '0')}`;
    const initialCode = isEdit ? existingItem.holiday_code : `HOL-GEN-${String(this.getAllHolidays().length + 1).padStart(2, '0')}`;

    const modalHtml = `
      <div class="modal active" id="holiday-form-modal" style="display: flex;">
        <div class="modal-backdrop" onclick="window.HolidayMasterModule.closeModal('holiday-form-modal')"></div>
        <div class="modal-dialog" style="max-width: 680px; width: 90%; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h3 class="modal-title" style="margin: 0; font-size: 17px; font-weight: 700;">
              ${isEdit ? 'Edit Holiday Configuration' : 'Add New Holiday'}
            </h3>
            <button class="modal-close" onclick="window.HolidayMasterModule.closeModal('holiday-form-modal')">&times;</button>
          </div>
          <form id="holiday-edit-form" onsubmit="window.HolidayMasterModule.saveHoliday(event, '${isEdit ? existingItem.id : ''}')">
            <div class="modal-body" style="padding: 16px 20px;">
              
              <!-- Row 1: Organization & Financial Year -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
                <div>
                  <label class="form-label required" style="font-size: 12px; font-weight: 600;">Organization</label>
                  <select id="modal-holiday-org" class="form-control form-control-sm" required>
                    ${orgs.map(o => `
                      <option value="${o.id}" ${(isEdit && existingItem.organization_id === o.id) ? 'selected' : ''}>${o.name}</option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label required" style="font-size: 12px; font-weight: 600;">Financial Year</label>
                  <select id="modal-holiday-fy" class="form-control form-control-sm" required onchange="window.HolidayMasterModule.onFyChange(this.value)">
                    ${fys.map(f => `
                      <option value="${f.id}" data-start="${f.startDate}" data-end="${f.endDate}" ${(isEdit && existingItem.financial_year_id === f.id) || (!isEdit && f.isCurrent) ? 'selected' : ''}>${f.code} (${f.name})</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <!-- Row 2: Applicable To (Scope) & Facility -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
                <div>
                  <label class="form-label required" style="font-size: 12px; font-weight: 600;">Applicable To</label>
                  <select id="modal-holiday-applicable" class="form-control form-control-sm" required onchange="window.HolidayMasterModule.onApplicableChange(this.value)">
                    <option value="ORGANIZATION" ${(!isEdit || existingItem.applicable_level === 'ORGANIZATION') ? 'selected' : ''}>Organization (All Facilities)</option>
                    <option value="FACILITY" ${(isEdit && existingItem.applicable_level === 'FACILITY') ? 'selected' : ''}>Facility (Facility Specific)</option>
                  </select>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">
                    Organization holiday automatically applies to all facilities
                  </div>
                </div>
                <div id="modal-facility-field-wrap">
                  <label class="form-label" id="modal-facility-label" style="font-size: 12px; font-weight: 600;">Facility</label>
                  <select id="modal-holiday-facility" class="form-control form-control-sm" ${(!isEdit || existingItem.applicable_level === 'ORGANIZATION') ? 'disabled' : ''}>
                    <option value="">-- Select Facility --</option>
                    ${facilities.map(fac => `
                      <option value="${fac.id}" ${(isEdit && existingItem.facility_id === fac.id) ? 'selected' : ''}>${fac.name} (${fac.code})</option>
                    `).join('')}
                  </select>
                  <div id="modal-facility-hint" style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">
                    ${(!isEdit || existingItem.applicable_level === 'ORGANIZATION') ? 'Disabled for Organization scope' : 'Select facility for local holiday'}
                  </div>
                </div>
              </div>

              <!-- Row 3: Holiday Code & Name -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
                <div>
                  <label class="form-label required" style="font-size: 12px; font-weight: 600;">Holiday Code</label>
                  <input 
                    type="text" 
                    id="modal-holiday-code" 
                    class="form-control form-control-sm" 
                    value="${initialCode}" 
                    required 
                    placeholder="e.g. HOL-REP-DAY"
                    style="font-family: var(--font-mono, monospace); text-transform: uppercase;"
                  />
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">Unique holiday code within scope</div>
                </div>
                <div>
                  <label class="form-label required" style="font-size: 12px; font-weight: 600;">Holiday Name</label>
                  <input 
                    type="text" 
                    id="modal-holiday-name" 
                    class="form-control form-control-sm" 
                    value="${isEdit ? existingItem.holiday_name : ''}" 
                    required 
                    placeholder="e.g. Republic Day"
                  />
                </div>
              </div>

              <!-- Row 4: Holiday Date & Day (Auto Calculated) -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
                <div>
                  <label class="form-label required" style="font-size: 12px; font-weight: 600;">Holiday Date</label>
                  <input 
                    type="date" 
                    id="modal-holiday-date" 
                    class="form-control form-control-sm" 
                    value="${isEdit ? String(existingItem.holiday_date).split('T')[0] : '2026-05-01'}" 
                    required 
                    onchange="window.HolidayMasterModule.onDateChange(this.value)"
                  />
                  <div id="modal-date-validation-msg" style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">Must be within selected FY</div>
                </div>
                <div>
                  <label class="form-label" style="font-size: 12px; font-weight: 600;">Day of Week (System Generated)</label>
                  <input 
                    type="text" 
                    id="modal-holiday-day" 
                    class="form-control form-control-sm" 
                    value="${isEdit ? (existingItem.day_name || '') : 'Friday'}" 
                    readonly 
                    style="background: rgba(0,0,0,0.15); color: var(--text-primary); font-weight: 600;"
                  />
                </div>
              </div>

              <!-- Row 5: Holiday Type & Category -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
                <div>
                  <label class="form-label required" style="font-size: 12px; font-weight: 600;">Holiday Type</label>
                  <select id="modal-holiday-type" class="form-control form-control-sm" required>
                    ${types.map(t => `
                      <option value="${t.code || t.id}" ${(isEdit && existingItem.holiday_type_id === (t.code || t.id)) ? 'selected' : ''}>${t.name} (${t.code || t.id})</option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label required" style="font-size: 12px; font-weight: 600;">Holiday Category</label>
                  <select id="modal-holiday-category" class="form-control form-control-sm" required onchange="window.HolidayMasterModule.onCategoryChange(this.value)">
                    <option value="FULL_DAY" ${(!isEdit || existingItem.holiday_category === 'FULL_DAY') ? 'selected' : ''}>Full Day</option>
                    <option value="HALF_DAY" ${(isEdit && existingItem.holiday_category === 'HALF_DAY') ? 'selected' : ''}>Half Day</option>
                  </select>
                </div>
              </div>

              <!-- Row 6: Half-Day Timings (Conditional per BR-08) -->
              <div id="modal-halfday-wrap" style="display: ${(isEdit && existingItem.holiday_category === 'HALF_DAY') ? 'block' : 'none'}; padding: 12px; background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.3); border-radius: 6px; margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: 600; color: #f59e0b; margin-bottom: 8px;">Half-Day Configuration</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                  <div>
                    <label class="form-label" style="font-size: 11px;">Half Period</label>
                    <select id="modal-halfday-period" class="form-control form-control-sm">
                      <option value="FIRST_HALF" ${(isEdit && existingItem.half_day_type === 'FIRST_HALF') ? 'selected' : ''}>First Half</option>
                      <option value="SECOND_HALF" ${(isEdit && existingItem.half_day_type === 'SECOND_HALF') ? 'selected' : ''}>Second Half</option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 11px;">From Time</label>
                    <input type="time" id="modal-holiday-fromtime" class="form-control form-control-sm" value="${isEdit ? (existingItem.from_time || '09:00') : '09:00'}" />
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 11px;">To Time</label>
                    <input type="time" id="modal-holiday-totime" class="form-control form-control-sm" value="${isEdit ? (existingItem.to_time || '13:30') : '13:30'}" />
                  </div>
                </div>
              </div>

              <!-- Row 7: Recurring Checkbox & Status -->
              <div style="display: flex; gap: 24px; align-items: center; margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; user-select: none;">
                  <input type="checkbox" id="modal-holiday-recurring" ${(isEdit && existingItem.recurring_yn) ? 'checked' : ''} />
                  <span>Annual Recurring Holiday (applies each year)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; user-select: none;">
                  <input type="checkbox" id="modal-holiday-active" ${(!isEdit || (existingItem.active_yn !== false && existingItem.status !== 'Inactive')) ? 'checked' : ''} />
                  <span>Active Status</span>
                </label>
              </div>

              <!-- Row 8: Description -->
              <div style="margin-bottom: 8px;">
                <label class="form-label" style="font-size: 12px; font-weight: 600;">Description / Remarks</label>
                <textarea id="modal-holiday-desc" class="form-control form-control-sm" rows="2" placeholder="Notes regarding holiday applicability, gazette order, or celebrations...">${isEdit ? (existingItem.description || '') : ''}</textarea>
              </div>

            </div>
            <div class="modal-footer" style="padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color, #334155);">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.closeModal('holiday-form-modal')">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="font-weight: 600;">${isEdit ? 'Save Changes' : 'Create Holiday'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.injectModal(modalHtml, 'holiday-form-modal');
    this.onDateChange(document.getElementById('modal-holiday-date').value);
  },

  onApplicableChange(val) {
    const facSelect = document.getElementById('modal-holiday-facility');
    const facHint = document.getElementById('modal-facility-hint');
    const facLabel = document.getElementById('modal-facility-label');
    if (!facSelect) return;

    if (val === 'ORGANIZATION') {
      facSelect.disabled = true;
      facSelect.value = '';
      facSelect.required = false;
      if (facLabel) facLabel.classList.remove('required');
      if (facHint) facHint.innerText = 'Disabled for Organization scope';
    } else {
      facSelect.disabled = false;
      facSelect.required = true;
      if (facLabel) facLabel.classList.add('required');
      if (facHint) facHint.innerText = 'Mandatory when Applicable To = Facility (BR-02)';
    }
  },

  onCategoryChange(val) {
    const wrap = document.getElementById('modal-halfday-wrap');
    if (wrap) {
      wrap.style.display = val === 'HALF_DAY' ? 'block' : 'none';
    }
  },

  onDateChange(dateVal) {
    const dayInput = document.getElementById('modal-holiday-day');
    const msg = document.getElementById('modal-date-validation-msg');
    if (!dateVal) return;

    const d = new Date(dateVal);
    if (!isNaN(d.getTime()) && dayInput) {
      dayInput.value = d.toLocaleDateString('en-US', { weekday: 'long' });
    }

    // Check FY bounds
    const fySelect = document.getElementById('modal-holiday-fy');
    if (fySelect && msg) {
      const selectedOpt = fySelect.options[fySelect.selectedIndex];
      const start = selectedOpt.getAttribute('data-start');
      const end = selectedOpt.getAttribute('data-end');
      if (start && end) {
        if (dateVal < start || dateVal > end) {
          msg.innerHTML = `<span style="color: var(--color-danger, #ef4444); font-weight: 600;">⚠️ Date is outside ${selectedOpt.text} (${start} to ${end})</span>`;
        } else {
          msg.innerHTML = `<span style="color: #10b981;">✓ Valid date within ${selectedOpt.text}</span>`;
        }
      }
    }
  },

  onFyChange(fyVal) {
    const dateInput = document.getElementById('modal-holiday-date');
    if (dateInput) {
      this.onDateChange(dateInput.value);
    }
  },

  // Form Submission & Validation (BR-01 through BR-12)
  saveHoliday(e, existingId) {
    if (e && e.preventDefault) e.preventDefault();

    const orgId = document.getElementById('modal-holiday-org').value;
    const fySelect = document.getElementById('modal-holiday-fy');
    const fyId = fySelect.value;
    const fyText = fySelect.options[fySelect.selectedIndex].text.split(' ')[0] + ' ' + fySelect.options[fySelect.selectedIndex].text.split(' ')[1];
    const applicableLevel = document.getElementById('modal-holiday-applicable').value;
    const facilitySelect = document.getElementById('modal-holiday-facility');
    const facilityId = facilitySelect.value;
    const facilityName = facilitySelect.options[facilitySelect.selectedIndex] ? facilitySelect.options[facilitySelect.selectedIndex].text.split(' (')[0] : '';
    const code = document.getElementById('modal-holiday-code').value.trim().toUpperCase();
    const name = document.getElementById('modal-holiday-name').value.trim();
    const dateVal = document.getElementById('modal-holiday-date').value;
    const dayVal = document.getElementById('modal-holiday-day').value;
    const typeSelect = document.getElementById('modal-holiday-type');
    const typeId = typeSelect.value;
    const category = document.getElementById('modal-holiday-category').value;
    const isHalfDay = category === 'HALF_DAY';
    const halfDayPeriod = isHalfDay ? document.getElementById('modal-halfday-period').value : null;
    const fromTime = isHalfDay ? document.getElementById('modal-holiday-fromtime').value : null;
    const toTime = isHalfDay ? document.getElementById('modal-holiday-totime').value : null;
    const recurring = document.getElementById('modal-holiday-recurring').checked;
    const isActive = document.getElementById('modal-holiday-active').checked;
    const desc = document.getElementById('modal-holiday-desc').value.trim();

    // 1. Mandatory Validations
    if (!orgId) {
      window.State.showToast('Validation Error: Organization is mandatory (BR-01).', 'error');
      return;
    }
    if (applicableLevel === 'FACILITY' && !facilityId) {
      window.State.showToast('Validation Error: Facility is mandatory when Applicable To = Facility (BR-02).', 'error');
      return;
    }
    if (!code) {
      window.State.showToast('Validation Error: Holiday Code is mandatory.', 'error');
      return;
    }
    if (!name) {
      window.State.showToast('Validation Error: Holiday Name is mandatory.', 'error');
      return;
    }
    if (!dateVal) {
      window.State.showToast('Validation Error: Holiday Date is mandatory (BR-04).', 'error');
      return;
    }

    // 2. Financial Year date bounds validation (BR-05)
    const selectedFyOpt = fySelect.options[fySelect.selectedIndex];
    const fyStart = selectedFyOpt.getAttribute('data-start');
    const fyEnd = selectedFyOpt.getAttribute('data-end');
    if (fyStart && fyEnd && (dateVal < fyStart || dateVal > fyEnd)) {
      window.State.showToast(`Validation Error: Holiday Date (${dateVal}) does not belong to selected Financial Year (${fyStart} to ${fyEnd}) (BR-05).`, 'error');
      return;
    }

    // 3. Half-Day Timing validation (BR-08, BR-09, Section 16)
    if (isHalfDay) {
      if (!fromTime || !toTime) {
        window.State.showToast('Validation Error: From Time and To Time are required for Half Day holidays (BR-08).', 'error');
        return;
      }
      if (toTime <= fromTime) {
        window.State.showToast('Validation Error: End time must be after start time (Section 16).', 'error');
        return;
      }
    }

    // 4. Duplicate Check (BR-06, BR-07, Section 21)
    const allHolidays = this.getAllHolidays();
    const duplicateCode = allHolidays.find(h => h.id !== existingId && h.holiday_code.toUpperCase() === code && h.organization_id === orgId);
    if (duplicateCode) {
      window.State.showToast(`Validation Error: Holiday Code "${code}" already exists in this organization (BR-07).`, 'error');
      return;
    }

    const duplicateDate = allHolidays.find(h => {
      if (h.id === existingId) return false;
      if (h.active_yn === false && h.status === 'Inactive') return false;
      const hDate = String(h.holiday_date).split('T')[0];
      if (hDate !== dateVal || h.financial_year_id !== fyId) return false;
      // Scope overlap
      if (h.applicable_level === 'ORGANIZATION' || applicableLevel === 'ORGANIZATION') return true;
      if (h.facility_id === facilityId) return true;
      return false;
    });

    if (duplicateDate) {
      window.State.showToast(`Validation Error: An active holiday ("${duplicateDate.holiday_name}") is already scheduled on ${dateVal} for this scope (BR-06).`, 'error');
      return;
    }

    // Construct record
    const id = existingId || `HOL-${String(allHolidays.length + 1).padStart(3, '0')}`;
    const holidayRecord = {
      id: id,
      organization_id: orgId,
      organization_name: orgs.find(o => o.id === orgId)?.name || 'Mauli Service Center Pvt. Ltd.',
      applicable_level: applicableLevel,
      facility_id: applicableLevel === 'FACILITY' ? facilityId : null,
      facility_name: applicableLevel === 'FACILITY' ? facilityName : 'All Facilities',
      financial_year_id: fyId,
      financial_year_code: fyText.trim(),
      holiday_code: code,
      holiday_name: name,
      holiday_date: dateVal,
      day_name: dayVal,
      holiday_type_id: typeId,
      holiday_category: category,
      half_day_type: halfDayPeriod,
      from_time: fromTime,
      to_time: toTime,
      recurring_yn: recurring,
      description: desc,
      active_yn: isActive,
      status: isActive ? 'Active' : 'Inactive',
      created_by: existingId ? (duplicateCode ? duplicateCode.created_by : 'System Administrator') : (window.State.getCurrentUser()?.full_name || 'System Administrator'),
      created_date: existingId ? (allHolidays.find(h => h.id === existingId)?.created_date || new Date().toISOString()) : new Date().toISOString(),
      modified_by: window.State.getCurrentUser()?.full_name || 'System Administrator',
      modified_date: new Date().toISOString()
    };

    // Save to window.DB
    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('holidays', holidayRecord);
    }

    // Record in Audit Trail (BR-12)
    const auditRecord = {
      id: `HA-${Date.now()}`,
      holiday_id: id,
      holiday_code: code,
      holiday_name: name,
      action: existingId ? 'UPDATE' : 'CREATE',
      old_value: existingId ? allHolidays.find(h => h.id === existingId) : null,
      new_value: holidayRecord,
      user_name: window.State.getCurrentUser()?.full_name || 'System Administrator',
      timestamp: new Date().toISOString(),
      reason: existingId ? 'Updated holiday configuration' : 'Created new holiday record'
    };
    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('holiday_audit', auditRecord);
    }

    // Post to Backend REST API asynchronously
    try {
      fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayRecord)
      }).catch(() => {});
    } catch (_) {}

    this.closeModal('holiday-form-modal');
    window.State.showToast(`Success: Holiday "${name}" (${code}) saved successfully.`, 'success');
    this.refreshTable();
  },

  promptToggleStatus(id) {
    const list = this.getAllHolidays();
    const item = list.find(h => h.id === id);
    if (!item) return;

    const isActive = item.active_yn !== false && item.status !== 'Inactive';
    const actionLabel = isActive ? 'deactivate' : 'activate';

    if (isActive) {
      // Conforms to BRD Section 14: Confirmation dialog
      const confirmed = window.confirm(`Are you sure you want to deactivate this holiday ("${item.holiday_name}")?`);
      if (!confirmed) return;
    }

    item.active_yn = !isActive;
    item.status = !isActive ? 'Active' : 'Inactive';
    item.modified_by = window.State.getCurrentUser()?.full_name || 'System Administrator';
    item.modified_date = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('holidays', item);
    }

    // Audit log
    const auditRecord = {
      id: `HA-${Date.now()}`,
      holiday_id: id,
      holiday_code: item.holiday_code,
      holiday_name: item.holiday_name,
      action: !isActive ? 'ACTIVATE' : 'DEACTIVATE',
      old_value: { status: isActive ? 'Active' : 'Inactive', active_yn: isActive },
      new_value: { status: item.status, active_yn: item.active_yn },
      user_name: window.State.getCurrentUser()?.full_name || 'System Administrator',
      timestamp: new Date().toISOString(),
      reason: `Status changed to ${item.status}`
    };
    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('holiday_audit', auditRecord);
    }

    // Sync via REST API
    try {
      fetch(`/api/holidays/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_yn: item.active_yn, status: item.status })
      }).catch(() => {});
    } catch (_) {}

    window.State.showToast(`Holiday "${item.holiday_name}" is now ${item.status}.`, 'info');
    this.refreshTable();
  },

  deleteHoliday(id) {
    const list = this.getAllHolidays();
    const item = list.find(h => h.id === id);
    if (!item) return;

    // BR-11: Historical Data protection check
    const confirmed = window.confirm(`Are you sure you want to remove holiday "${item.holiday_name}" (${item.holiday_code})?`);
    if (!confirmed) return;

    if (window.DB && typeof window.DB.remove === 'function') {
      window.DB.remove('holidays', id);
    }

    // Audit log
    const auditRecord = {
      id: `HA-${Date.now()}`,
      holiday_id: id,
      holiday_code: item.holiday_code,
      holiday_name: item.holiday_name,
      action: 'DELETE',
      old_value: item,
      new_value: null,
      user_name: window.State.getCurrentUser()?.full_name || 'System Administrator',
      timestamp: new Date().toISOString(),
      reason: 'Physical deletion requested'
    };
    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('holiday_audit', auditRecord);
    }

    // Call API delete
    try {
      fetch(`/api/holidays/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch (_) {}

    window.State.showToast(`Holiday "${item.holiday_name}" deleted.`, 'info');
    this.refreshTable();
  },

  showDetailsModal(id) {
    const list = this.getAllHolidays();
    const item = list.find(h => h.id === id);
    if (!item) return;

    const audits = this.getAuditLogs().filter(a => a.holiday_id === id);
    const types = this.getHolidayTypes();
    const typeObj = types.find(t => (t.code || t.id) === item.holiday_type_id) || { name: item.holiday_type_id, color: '#3b82f6' };
    const isActive = item.active_yn !== false && item.status !== 'Inactive';
    const isOrg = item.applicable_level === 'ORGANIZATION';

    const modalHtml = `
      <div class="modal active" id="holiday-details-modal" style="display: flex;">
        <div class="modal-backdrop" onclick="window.HolidayMasterModule.closeModal('holiday-details-modal')"></div>
        <div class="modal-dialog" style="max-width: 650px; width: 90%; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 class="modal-title" style="margin: 0; font-size: 17px; font-weight: 700;">${item.holiday_name}</h3>
              <span class="status-badge ${isActive ? 'active' : 'inactive'}" style="font-size: 11px;">${isActive ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
            <button class="modal-close" onclick="window.HolidayMasterModule.closeModal('holiday-details-modal')">&times;</button>
          </div>
          <div class="modal-body" style="padding: 16px 20px;">
            
            <!-- Summary Info Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px;">
                <div style="font-size: 11px; color: var(--text-muted);">Holiday Code</div>
                <div style="font-size: 14px; font-weight: 700; font-family: monospace; color: var(--primary-300);">${item.holiday_code}</div>
              </div>
              <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px;">
                <div style="font-size: 11px; color: var(--text-muted);">Date & Day</div>
                <div style="font-size: 14px; font-weight: 700;">${window.formatDate(item.holiday_date)} (${item.day_name || 'Day'})</div>
              </div>
              <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px;">
                <div style="font-size: 11px; color: var(--text-muted);">Type</div>
                <div style="font-size: 14px; font-weight: 600; color: ${typeObj.color || '#3b82f6'};">${typeObj.name || item.holiday_type_id}</div>
              </div>
              <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px;">
                <div style="font-size: 11px; color: var(--text-muted);">Category & Timing</div>
                <div style="font-size: 14px; font-weight: 600;">
                  ${item.holiday_category === 'HALF_DAY' ? `Half Day (${item.from_time || '09:00'} - ${item.to_time || '13:30'})` : 'Full Day'}
                </div>
              </div>
              <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px;">
                <div style="font-size: 11px; color: var(--text-muted);">Applicable Scope</div>
                <div style="font-size: 14px; font-weight: 600;">
                  ${isOrg ? 'Organization (All Facilities)' : `Facility: ${item.facility_name}`}
                </div>
              </div>
              <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px;">
                <div style="font-size: 11px; color: var(--text-muted);">Financial Year</div>
                <div style="font-size: 14px; font-weight: 600;">${item.financial_year_code || 'FY 2026-27'}</div>
              </div>
            </div>

            <!-- Applicability Impact Details -->
            <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 6px; padding: 12px; margin-bottom: 16px;">
              <div style="font-size: 12px; font-weight: 600; color: #3b82f6; margin-bottom: 6px;">🏢 Impacted Facilities</div>
              <div style="font-size: 13px; color: var(--text-secondary);">
                ${isOrg ? `
                  Applies to <strong>all active facilities</strong> under Mauli Service Center Pvt. Ltd.:
                  <ul style="margin: 4px 0 0 16px; padding: 0;">
                    <li>Mauli Service Center 1 (PLANT-01 / MSC1)</li>
                    <li>Mauli Service Center 2 (PLANT-02 / MSC2)</li>
                  </ul>
                ` : `
                  Applies strictly to <strong>${item.facility_name}</strong>. Does not impact other facilities.
                `}
              </div>
            </div>

            ${item.description ? `
              <div style="margin-bottom: 16px;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Description</div>
                <div style="font-size: 13px; color: var(--text-secondary); background: rgba(0,0,0,0.1); padding: 8px 12px; border-radius: 6px;">
                  ${item.description}
                </div>
              </div>
            ` : ''}

            <!-- Audit History -->
            <div>
              <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">📜 Audit History</div>
              <div style="max-height: 140px; overflow-y: auto; border: 1px solid var(--border-color, #334155); border-radius: 6px;">
                ${audits.length === 0 ? `
                  <div style="padding: 12px; text-align: center; font-size: 12px; color: var(--text-muted);">Created on ${item.created_date ? window.formatDate(item.created_date) : '01-04-2026'} by ${item.created_by || 'System Administrator'}</div>
                ` : audits.map(a => `
                  <div style="padding: 8px 12px; border-bottom: 1px solid var(--border-color, #334155); font-size: 12px; display: flex; justify-content: space-between;">
                    <div>
                      <span class="badge" style="font-size: 10px; margin-right: 6px;">${a.action}</span>
                      <span>${a.reason || 'Record updated'}</span>
                    </div>
                    <div style="color: var(--text-muted); font-size: 11px;">
                      ${a.user_name} | ${window.formatDate(a.timestamp)}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>
          <div class="modal-footer" style="padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color, #334155);">
            <button class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.closeModal('holiday-details-modal')">Close</button>
            <button class="btn btn-primary btn-sm" onclick="window.HolidayMasterModule.closeModal('holiday-details-modal'); window.HolidayMasterModule.showEditModal('${item.id}');">Edit Holiday</button>
          </div>
        </div>
      </div>
    `;

    this.injectModal(modalHtml, 'holiday-details-modal');
  },

  showAuditModal() {
    const audits = this.getAuditLogs();

    const modalHtml = `
      <div class="modal active" id="holiday-audit-modal" style="display: flex;">
        <div class="modal-backdrop" onclick="window.HolidayMasterModule.closeModal('holiday-audit-modal')"></div>
        <div class="modal-dialog" style="max-width: 750px; width: 90%; max-height: 85vh; overflow-y: auto;">
          <div class="modal-header">
            <h3 class="modal-title" style="margin: 0; font-size: 17px; font-weight: 700;">Holiday Master Audit Trail</h3>
            <button class="modal-close" onclick="window.HolidayMasterModule.closeModal('holiday-audit-modal')">&times;</button>
          </div>
          <div class="modal-body" style="padding: 16px 20px;">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Holiday</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Details / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  ${audits.length === 0 ? `
                    <tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">No audit records logged yet.</td></tr>
                  ` : audits.map(a => `
                    <tr>
                      <td style="font-size: 12px; font-mono;">${a.timestamp ? String(a.timestamp).replace('T', ' ').substring(0, 19) : ''}</td>
                      <td>
                        <div style="font-weight: 600;">${a.holiday_name || a.holiday_code}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${a.holiday_code}</div>
                      </td>
                      <td>
                        <span class="badge" style="font-size: 11px;">${a.action}</span>
                      </td>
                      <td style="font-size: 12px;">${a.user_name}</td>
                      <td style="font-size: 12px; color: var(--text-secondary);">${a.reason || 'Status / Configuration adjustment'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer" style="padding: 12px 20px; display: flex; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="window.HolidayMasterModule.closeModal('holiday-audit-modal')">Close</button>
          </div>
        </div>
      </div>
    `;

    this.injectModal(modalHtml, 'holiday-audit-modal');
  },

  exportCsv() {
    const list = this.getFilteredHolidays();
    if (list.length === 0) {
      window.State.showToast('No holidays available to export.', 'warning');
      return;
    }

    const headers = ['Holiday ID', 'Code', 'Holiday Name', 'Date', 'Day', 'Type', 'Category', 'From Time', 'To Time', 'Applicable Scope', 'Facility', 'Financial Year', 'Recurring', 'Status'];
    const rows = list.map(h => [
      h.id,
      h.holiday_code,
      `"${(h.holiday_name || '').replace(/"/g, '""')}"`,
      h.holiday_date,
      h.day_name,
      h.holiday_type_id,
      h.holiday_category,
      h.from_time || '',
      h.to_time || '',
      h.applicable_level,
      `"${(h.facility_name || '').replace(/"/g, '""')}"`,
      h.financial_year_code || '',
      h.recurring_yn ? 'Yes' : 'No',
      (h.active_yn !== false && h.status !== 'Inactive') ? 'Active' : 'Inactive'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Holiday_Master_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.State.showToast(`Exported ${list.length} holiday records to CSV.`, 'success');
  },

  injectModal(html, id) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.remove();
  }
};
