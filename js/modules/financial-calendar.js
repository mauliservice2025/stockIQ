/* ==========================================================================
   ENTERPRISE ISCM - FINANCIAL CALENDAR MASTER MODULE (BRD v1.0 COMPLIANT)
   Centralized Financial Year & Accounting Period Governance
   Hierarchy: Company → Branch → Financial Year → Financial Period → Transactions
   Inheritance: Company-level calendar inherited by all branches unless overridden
   ========================================================================== */

window.FinancialCalendarModule = {
  searchTerm: '',
  branchFilter: 'ALL',
  statusFilter: 'ALL',
  currentPage: 1,
  pageSize: 10,

  DEFAULT_BRANCHES: [
    { id: 'BR-001', code: 'PUN', name: 'Pune Main Workshop' },
    { id: 'BR-002', code: 'MUM', name: 'Mumbai Central Workshop' },
    { id: 'BR-003', code: 'NAS', name: 'Nashik Auto Hub' },
    { id: 'ALL', code: 'ALL', name: 'All Facilities (Company-wide)' }
  ],

  getBranches() {
    const plants = (window.DB && typeof window.DB.getActivePlants === 'function')
      ? window.DB.getActivePlants()
      : ((window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('plants') : []);
    const active = plants.filter(p => !window.DB || typeof window.DB.isPlantActive !== 'function' || window.DB.isPlantActive(p.id, true));
    if (active.length > 0) {
      const mapped = active.map(p => ({
        id: p.id,
        code: (p.code || p.branch_code || p.id.replace('PLANT-', 'BR-')).toUpperCase().slice(0, 4),
        name: p.name || `Facility ${p.id}`
      }));
      if (!mapped.some(m => m.id === 'ALL')) {
        mapped.unshift({ id: 'ALL', code: 'ALL', name: 'All Facilities (Company-wide)' });
      }
      return mapped;
    }
    return [
      { id: 'PLANT-01', code: 'MSC1', name: 'Mauli Service Center 1' },
      { id: 'ALL', code: 'ALL', name: 'All Facilities (Company-wide)' }
    ];
  },

  getAllCalendars() {
    let list = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('financial_calendar') || []) : [];
    if (!this._initialized && list.length === 0 && typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.financial_calendar)) {
      list = JSON.parse(JSON.stringify(INITIAL_DATA.financial_calendar));
      if (window.DB && typeof window.DB.upsert === 'function') {
        list.forEach(item => window.DB.upsert('financial_calendar', item));
      }
    }
    this._initialized = true;
    return list;
  },

  getAllAuditLogs() {
    let list = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('financial_calendar_audit') || []) : [];
    if (list.length === 0 && typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.financial_calendar_audit)) {
      list = JSON.parse(JSON.stringify(INITIAL_DATA.financial_calendar_audit));
      if (window.DB && typeof window.DB.upsert === 'function') {
        list.forEach(item => window.DB.upsert('financial_calendar_audit', item));
      }
    }
    return list;
  },

  renderContentCard() {
    return `
      <div class="content-card" id="financial-calendar-wrapper" style="font-family: var(--font-sans, 'Inter', sans-serif);">
        ${this.renderCardHeader()}
        <div id="financial-calendar-table-container">
          ${this.renderTableContent()}
        </div>
      </div>
    `;
  },

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

  renderCardHeader() {
    const branches = this.getBranches();

    return `
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <!-- Left: Search and Filters -->
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <!-- Search box -->
          <div style="position: relative; display: inline-flex; align-items: center;">
            <input 
              type="text" 
              id="fin-cal-search-input" 
              class="form-control form-control-sm" 
              placeholder="Search year code, name..." 
              value="${this.searchTerm}" 
              oninput="window.FinancialCalendarModule.setSearch(this.value)" 
              style="width: 210px; height: 32px; font-size: 13px; padding-right: 24px;" 
              autocomplete="off"
            />
            <button 
              id="fin-cal-search-clear"
              type="button" 
              onclick="window.FinancialCalendarModule.clearSearch()" 
              style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: ${this.searchTerm ? 'block' : 'none'}; font-size: 14px; line-height: 1;"
              title="Clear search"
            >&times;</button>
          </div>

          <!-- Branch Filter -->
          <select 
            id="fin-cal-branch-filter" 
            class="form-control form-control-sm" 
            onchange="window.FinancialCalendarModule.setBranchFilter(this.value)" 
            style="width: 185px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.branchFilter === 'ALL' ? 'selected' : ''}>All Facilities</option>
            ${branches.filter(b => b.id !== 'ALL').map(b => `
              <option value="${b.id}" ${this.branchFilter === b.id ? 'selected' : ''}>${b.name}</option>
            `).join('')}
          </select>

          <!-- Status Filter -->
          <select 
            id="fin-cal-status-filter" 
            class="form-control form-control-sm" 
            onchange="window.FinancialCalendarModule.setStatusFilter(this.value)" 
            style="width: 115px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
            <option value="Open" ${this.statusFilter === 'Open' ? 'selected' : ''}>Open</option>
            <option value="Closed" ${this.statusFilter === 'Closed' ? 'selected' : ''}>Closed</option>
            <option value="Future" ${this.statusFilter === 'Future' ? 'selected' : ''}>Future</option>
          </select>
        </div>

        <!-- Right: Actions -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <!-- Validate Transaction Date Simulator -->
          <button class="btn btn-secondary btn-sm" onclick="window.FinancialCalendarModule.showValidateDateModal()" title="Validate Transaction Posting Date" style="height: 32px; font-size: 13px; font-weight: 600; color: var(--primary-300);">
            ⚡ Validate Date
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.FinancialCalendarModule.exportCsv()" title="Export Financial Calendars to CSV" style="height: 32px; font-size: 13px;">
            Export CSV
          </button>
          <button id="btn-add-fin-cal" class="btn btn-primary btn-sm" onclick="window.FinancialCalendarModule.showAddModal()" style="height: 32px; font-size: 13px; font-weight: 600;">
            + Add Financial Year
          </button>
        </div>
      </div>
    `;
  },

  renderTableContent() {
    let list = this.getAllCalendars();

    // Filtering
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      list = list.filter(item => {
        const text = [
          item.id,
          item.financial_year_code,
          item.financial_year_name,
          item.branch_name,
          item.start_date,
          item.end_date,
          item.remarks
        ].filter(Boolean).join(' ').toLowerCase();
        return text.includes(q);
      });
    }

    if (this.branchFilter !== 'ALL') {
      list = list.filter(item => item.branch_id === this.branchFilter || (item.branch_id === 'ALL' && this.branchFilter !== 'ALL'));
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter(item => item.status === this.statusFilter);
    }

    if (list.length === 0) {
      return `
        <div style="text-align: center; padding: 48px 16px;">
          <div style="font-size: 32px; margin-bottom: 8px;">📅</div>
          <div style="font-size: 16px; font-weight: 600; color: var(--text-primary);">No Financial Years Found</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px; max-width: 420px; margin-left: auto; margin-right: auto;">
            No financial years match your search query or selected filters. Try broadening your criteria or create a new financial year.
          </div>
          <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-secondary btn-sm" onclick="window.FinancialCalendarModule.resetFilters()">Clear Filters</button>
            <button class="btn btn-primary btn-sm" onclick="window.FinancialCalendarModule.showAddModal()">+ Add Financial Year</button>
          </div>
        </div>
      `;
    }

    const pagedCalendar = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(list, 'financialCalendar')
      : { items: list.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize), totalRecords: list.length, currentPage: this.currentPage, pageSize: this.pageSize };

    const pageItems = pagedCalendar.items;

    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Financial Year</th>
              <th>Facility</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pageItems.map(item => {
              const hasTransactions = (parseInt(item.transaction_count, 10) || 0) > 0 || item.status === 'Closed';
              const branchDisplayName = (!item.branch_id || item.branch_id === 'ALL') 
                ? 'All Facilities' 
                : (item.branch_name || 'All Facilities').replace(' (Company-wide)', '');

              return `
                <tr>
                  <!-- Financial Year -->
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="cell-strong" style="color: var(--primary-300); font-weight: 600;">${item.financial_year_code}</span>
                      ${item.current_year_yn ? '<span class="status-pill status-approved" style="font-size: 10px; padding: 1px 6px;">● Active</span>' : ''}
                    </div>
                  </td>

                  <!-- Facility / Branch -->
                  <td>
                    <span>${branchDisplayName}</span>
                  </td>

                  <!-- Start Date -->
                  <td>
                    <span class="cell-mono">${this.formatDate(item.start_date)}</span>
                  </td>

                  <!-- End Date -->
                  <td>
                    <span class="cell-mono">${this.formatDate(item.end_date)}</span>
                  </td>

                  <!-- Status -->
                  <td class="text-center">
                    <span class="status-pill ${item.status === 'Open' ? 'status-approved' : (item.status === 'Closed' ? 'status-rejected' : 'status-subtle')}">
                      ${item.status}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="text-right">
                    <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                      <!-- Manage Periods Action -->
                      <button 
                        class="btn btn-icon btn-sm" 
                        onclick="window.FinancialCalendarModule.showPeriodsModal('${item.id}')" 
                        title="Manage Monthly Periods"
                        style="color: var(--primary-300);"
                      >
                        📅
                      </button>

                      <!-- Edit Financial Year -->
                      <button 
                        class="btn btn-icon btn-sm" 
                        onclick="window.FinancialCalendarModule.showEditModal('${item.id}')" 
                        title="Edit Financial Year"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>

                      <!-- Delete Financial Year (Guarded by FCR-10 / AC-13) -->
                      <button 
                        class="btn btn-icon btn-sm" 
                        onclick="window.FinancialCalendarModule.deleteCalendar('${item.id}')" 
                        title="${hasTransactions ? 'Cannot delete used or closed financial year' : 'Delete Financial Year'}"
                        style="color: ${hasTransactions ? 'var(--text-muted)' : 'var(--color-danger, #ef4444)'}; opacity: ${hasTransactions ? '0.4' : '1'};"
                      >
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

      <!-- Pagination Bar -->
      ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
        totalRecords: list.length,
        currentPage: pagedCalendar.currentPage,
        pageSize: pagedCalendar.pageSize,
        onPageChange: 'window.FinancialCalendarModule.setPage(%p%)',
        onPageSizeChange: 'window.FinancialCalendarModule.setPageSize(%s%)'
      }) : ''}
    `;
  },

  // State Updaters
  setSearch(val) {
    this.searchTerm = val || '';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('financialCalendar');
    }
    if (typeof document !== 'undefined') {
      const clearBtn = document.getElementById('fin-cal-search-clear');
      if (clearBtn) clearBtn.style.display = this.searchTerm ? 'block' : 'none';
    }
    this.refreshTable();
  },

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('financialCalendar');
    }
    if (typeof document !== 'undefined') {
      const input = document.getElementById('fin-cal-search-input');
      if (input) input.value = '';
      const clearBtn = document.getElementById('fin-cal-search-clear');
      if (clearBtn) clearBtn.style.display = 'none';
    }
    this.refreshTable();
  },

  setBranchFilter(val) {
    this.branchFilter = val || 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('financialCalendar');
    }
    this.refreshTable();
  },

  setStatusFilter(val) {
    this.statusFilter = val || 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('financialCalendar');
    }
    this.refreshTable();
  },

  resetFilters() {
    this.searchTerm = '';
    this.branchFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('financialCalendar');
    }
    const sInput = document.getElementById('fin-cal-search-input');
    if (sInput) sInput.value = '';
    const bSelect = document.getElementById('fin-cal-branch-filter');
    if (bSelect) bSelect.value = 'ALL';
    const stSelect = document.getElementById('fin-cal-status-filter');
    if (stSelect) stSelect.value = 'ALL';
    this.refreshTable();
  },

  setPage(page) {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPage('financialCalendar', page);
      this.currentPage = window.PaginationHelper.getState('financialCalendar').currentPage;
    } else {
      this.currentPage = page;
    }
    this.refreshTable();
  },

  setPageSize(size) {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPageSize('financialCalendar', size);
      this.pageSize = window.PaginationHelper.getState('financialCalendar').pageSize;
      this.currentPage = window.PaginationHelper.getState('financialCalendar').currentPage;
    } else {
      this.pageSize = size;
      this.currentPage = 1;
    }
    this.refreshTable();
  },

  refreshTable() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('financial-calendar-table-container');
    if (container) {
      container.innerHTML = this.renderTableContent();
    } else {
      this.render();
    }
  },

  // ==========================================================================
  // TRANSACTION POSTING DATE VALIDATION CORE ENGINE (FR-16, FCR-05, FCR-06, AC-07, AC-08)
  // ==========================================================================
  validateTransactionDate(txDateStr, branchId = 'ALL') {
    if (!txDateStr) {
      return { allowed: false, status: 'INVALID_DATE', message: 'Transaction date is required.' };
    }

    const txDate = new Date(txDateStr);
    if (isNaN(txDate.getTime())) {
      return { allowed: false, status: 'INVALID_DATE', message: 'Invalid date format.' };
    }

    const calendars = this.getAllCalendars();

    // 1. Check for specific branch calendar first
    let activeCal = calendars.find(c => 
      c.status === 'Open' && 
      c.branch_id === branchId && 
      new Date(c.start_date) <= txDate && 
      txDate <= new Date(c.end_date)
    );

    // 2. Fall back to inherited Company-wide calendar (Section 38 & 38.1)
    if (!activeCal) {
      activeCal = calendars.find(c => 
        c.status === 'Open' && 
        (c.branch_id === 'ALL' || !c.branch_id) && 
        new Date(c.start_date) <= txDate && 
        txDate <= new Date(c.end_date)
      );
    }

    if (!activeCal) {
      return {
        allowed: false,
        status: 'NO_CALENDAR',
        message: `No active financial calendar configured for transaction date ${txDateStr} (Rule FCR-01).`
      };
    }

    // 3. Find matching financial period
    const periods = activeCal.periods || [];
    const period = periods.find(p => {
      const pStart = new Date(p.start_date);
      const pEnd = new Date(p.end_date);
      // Include whole end day
      pEnd.setHours(23, 59, 59, 999);
      return pStart <= txDate && txDate <= pEnd;
    });

    if (!period) {
      return {
        allowed: false,
        status: 'NO_PERIOD',
        fy: activeCal.financial_year_code,
        message: `Date falls inside ${activeCal.financial_year_code}, but no defined accounting period covers ${txDateStr} (Rule FCR-04).`
      };
    }

    // 4. Validate period status
    if (period.status === 'Open') {
      return {
        allowed: true,
        status: 'OPEN',
        fy: activeCal.financial_year_code,
        period: period.period_name,
        periodCode: period.period_code,
        calendarId: activeCal.id,
        message: `Transaction date verified. Accounting period ${period.period_name} is OPEN.`
      };
    } else if (period.status === 'Closed') {
      return {
        allowed: false,
        status: 'CLOSED',
        fy: activeCal.financial_year_code,
        period: period.period_name,
        periodCode: period.period_code,
        calendarId: activeCal.id,
        message: `Transaction cannot be posted because the selected financial period (${period.period_name}) is CLOSED (Rule FCR-05 / AC-08).`
      };
    } else if (period.status === 'Future') {
      return {
        allowed: false,
        status: 'FUTURE',
        fy: activeCal.financial_year_code,
        period: period.period_name,
        periodCode: period.period_code,
        calendarId: activeCal.id,
        message: `Transaction cannot be posted because the financial period (${period.period_name}) is in FUTURE status and not yet open (Rule FCR-06 / AC-09).`
      };
    }

    return {
      allowed: false,
      status: period.status,
      fy: activeCal.financial_year_code,
      period: period.period_name,
      message: `Transaction posting blocked by period status: ${period.status}.`
    };
  },

  // ==========================================================================
  // AUTOMATIC PERIOD GENERATION ENGINE (Section 23, 24, AC-04)
  // ==========================================================================
  generatePeriodsForYear(startDateStr, endDateStr, periodType = 'Monthly') {
    const periods = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return periods;
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    let curr = new Date(start.getFullYear(), start.getMonth(), 1);
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    while (curr <= end) {
      const year = curr.getFullYear();
      const monthIdx = curr.getMonth();
      const monthNumberStr = String(monthIdx + 1).padStart(2, '0');
      const periodCode = `${year}-${monthNumberStr}`;
      const periodName = `${monthNames[monthIdx]} ${year}`;

      // Calculate last day of this month
      const lastDayOfMonth = new Date(year, monthIdx + 1, 0);
      const periodStartDateStr = `${year}-${monthNumberStr}-01`;
      const periodEndDateStr = `${year}-${monthNumberStr}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`;

      // Status determination relative to current month
      let status = 'Future';
      let isCurrent = false;
      if (periodCode === currentYearMonth) {
        status = 'Open';
        isCurrent = true;
      } else if (periodCode < currentYearMonth) {
        status = 'Closed';
      }

      periods.push({
        id: `FP-${periodCode}`,
        period_code: periodCode,
        period_name: periodName,
        start_date: periodStartDateStr,
        end_date: periodEndDateStr,
        status: status,
        is_current: isCurrent,
        transaction_count: 0
      });

      // Move to next month
      curr.setMonth(curr.getMonth() + 1);
    }

    return periods;
  },

  // ==========================================================================
  // PERIOD MANAGEMENT ACTIONS (Section 13, 14, 15, FCR-08, AC-10, AC-11)
  // ==========================================================================
  openPeriod(calendarId, periodId) {
    const list = this.getAllCalendars();
    const cal = list.find(c => c.id === calendarId);
    if (!cal) return;

    const period = (cal.periods || []).find(p => p.id === periodId);
    if (!period) return;

    const oldStatus = period.status;
    period.status = 'Open';
    cal.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('financial_calendar', cal);
    }

    this.recordAudit({
      financial_year_id: cal.id,
      financial_year_code: cal.financial_year_code,
      period_id: period.id,
      period_name: period.period_name,
      action: 'OPEN_PERIOD',
      old_status: oldStatus,
      new_status: 'Open',
      reason: 'Period opened for active transaction posting'
    });

    if (window.State && window.State.showToast) {
      window.State.showToast(`Period ${period.period_name} is now OPEN for transactions.`, 'success');
    }

    this.showPeriodsModal(calendarId);
    this.refreshTable();
  },

  closePeriod(calendarId, periodId) {
    const list = this.getAllCalendars();
    const cal = list.find(c => c.id === calendarId);
    if (!cal) return;

    const period = (cal.periods || []).find(p => p.id === periodId);
    if (!period) return;

    if (!confirm(`Are you sure you want to CLOSE ${period.period_name}?\n\nOnce closed, no new transactions or documents can be posted against this period (Rule FCR-05).`)) {
      return;
    }

    const oldStatus = period.status;
    period.status = 'Closed';
    period.closed_at = new Date().toISOString();
    period.closed_by = (window.State && window.State.getCurrentUser() && window.State.getCurrentUser().full_name) || 'Current User';
    cal.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('financial_calendar', cal);
    }

    this.recordAudit({
      financial_year_id: cal.id,
      financial_year_code: cal.financial_year_code,
      period_id: period.id,
      period_name: period.period_name,
      action: 'CLOSE_PERIOD',
      old_status: oldStatus,
      new_status: 'Closed',
      reason: 'Period closed by authorized manager'
    });

    if (window.State && window.State.showToast) {
      window.State.showToast(`Period ${period.period_name} is now CLOSED. New postings blocked.`, 'warning');
    }

    this.showPeriodsModal(calendarId);
    this.refreshTable();
  },

  showReopenModal(calendarId, periodId) {
    const list = this.getAllCalendars();
    const cal = list.find(c => c.id === calendarId);
    if (!cal) return;

    const period = (cal.periods || []).find(p => p.id === periodId);
    if (!period) return;

    const modalHtml = `
      <div id="fin-cal-reopen-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 500px; max-width: 95vw; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color);">
            <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>🔓</span>
              <span>Reopen Closed Period: ${period.period_name}</span>
            </div>
            <button onclick="document.getElementById('fin-cal-reopen-modal').remove()" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <div style="padding: 20px;">
            <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 6px; padding: 12px; margin-bottom: 16px; font-size: 12.5px; color: var(--text-secondary);">
              <strong>⚠️ Audit Control (BRD Rule FCR-08 & AC-11):</strong><br/>
              Reopening a closed accounting period requires mandatory justification and will generate an immutable audit trail entry.
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                Mandatory Reopen Reason <span style="color: var(--color-danger);">*</span>
              </label>
              <textarea 
                id="fin-cal-reopen-reason" 
                class="form-control" 
                rows="3" 
                placeholder="State specific business justification (e.g. Auditor rectification for warranty credit notes)..."
                style="width: 100%; font-size: 13px; resize: vertical;"
              ></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('fin-cal-reopen-modal').remove()">Cancel</button>
              <button 
                type="button" 
                class="btn btn-primary btn-sm" 
                onclick="window.FinancialCalendarModule.submitReopenPeriod('${calendarId}', '${periodId}')"
              >
                Confirm Reopen Period
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  submitReopenPeriod(calendarId, periodId) {
    const reasonInput = document.getElementById('fin-cal-reopen-reason');
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason || reason.length < 5) {
      alert('Mandatory Requirement: Please provide a valid reason (at least 5 characters) for reopening this closed accounting period (Rule FCR-08).');
      if (reasonInput) reasonInput.focus();
      return;
    }

    const list = this.getAllCalendars();
    const cal = list.find(c => c.id === calendarId);
    if (!cal) return;

    const period = (cal.periods || []).find(p => p.id === periodId);
    if (!period) return;

    const oldStatus = period.status;
    period.status = 'Open';
    period.reopen_reason = reason;
    cal.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('financial_calendar', cal);
    }

    this.recordAudit({
      financial_year_id: cal.id,
      financial_year_code: cal.financial_year_code,
      period_id: period.id,
      period_name: period.period_name,
      action: 'REOPEN_PERIOD',
      old_status: oldStatus,
      new_status: 'Open',
      reason: reason
    });

    const modal = document.getElementById('fin-cal-reopen-modal');
    if (modal) modal.remove();

    if (window.State && window.State.showToast) {
      window.State.showToast(`Period ${period.period_name} reopened successfully.`, 'success');
    }

    this.showPeriodsModal(calendarId);
    this.refreshTable();
  },

  recordAudit(entry) {
    const auditLogs = this.getAllAuditLogs();
    const currentUser = (window.State && window.State.getCurrentUser()) || { full_name: 'System Administrator' };

    const newLog = {
      id: `FCA-${String(auditLogs.length + 1).padStart(3, '0')}`,
      financial_year_id: entry.financial_year_id || '',
      financial_year_code: entry.financial_year_code || '',
      period_id: entry.period_id || '',
      period_name: entry.period_name || '',
      action: entry.action || 'STATUS_CHANGE',
      old_status: entry.old_status || '',
      new_status: entry.new_status || '',
      user_name: currentUser.full_name || currentUser.username || 'System User',
      timestamp: new Date().toISOString(),
      reason: entry.reason || 'Administrative update'
    };

    auditLogs.push(newLog);

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('financial_calendar_audit', newLog);
    }
  },

  // ==========================================================================
  // PERIODS MANAGEMENT MODAL (Section 22)
  // ==========================================================================
  showPeriodsModal(calendarId) {
    const list = this.getAllCalendars();
    const cal = list.find(c => c.id === calendarId);
    if (!cal) return;

    const existing = document.getElementById('fin-cal-periods-modal');
    if (existing) existing.remove();

    const periods = cal.periods || [];

    const modalHtml = `
      <div id="fin-cal-periods-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 850px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          <!-- Modal Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--border-color);">
            <div>
              <div style="font-size: 17px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <span>📅</span>
                <span>Financial Periods: ${cal.financial_year_code}</span>
                <span class="status-pill ${cal.status === 'Open' ? 'status-approved' : (cal.status === 'Closed' ? 'status-rejected' : 'status-subtle')}" style="font-size: 11px;">
                  ${cal.status}
                </span>
              </div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                ${cal.branch_name || 'All Facilities'} | ${this.formatDate(cal.start_date)} to ${this.formatDate(cal.end_date)}
              </div>
            </div>
            <button onclick="document.getElementById('fin-cal-periods-modal').remove()" style="background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <!-- Periods Table -->
          <div style="padding: 20px;">
            <div style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; color: var(--text-secondary);">
              <div>
                Showing <strong>${periods.length}</strong> accounting periods configured for this financial year.
              </div>
              <div style="display: flex; gap: 8px;">
                <span class="badge badge-success">Open = Postings Allowed</span>
                <span class="badge badge-danger">Closed = Blocked</span>
                <span class="badge badge-subtle">Future = Advance</span>
              </div>
            </div>

            <div class="table-responsive" style="max-height: 480px; overflow-y: auto;">
              <table class="data-table" style="font-size: 13px;">
                <thead>
                  <tr>
                    <th>Period Code</th>
                    <th>Period Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th class="text-center">Status</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${periods.map(p => `
                    <tr>
                      <td class="cell-mono cell-strong" style="color: var(--primary-300);">
                        ${p.period_code}
                      </td>
                      <td>
                        <div class="cell-strong">${p.period_name}</div>
                        ${p.is_current ? '<span style="font-size: 10px; color: #10b981; font-weight: 700;">● Current Active Month</span>' : ''}
                      </td>
                      <td class="cell-mono">
                        ${this.formatDate(p.start_date)}
                      </td>
                      <td class="cell-mono">
                        ${this.formatDate(p.end_date)}
                      </td>
                      <td class="text-center">
                        <span class="status-pill ${p.status === 'Open' ? 'status-approved' : (p.status === 'Closed' ? 'status-rejected' : 'status-subtle')}">
                          ${p.status}
                        </span>
                      </td>
                      <td class="text-right">
                        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                          ${p.status === 'Open' ? `
                            <button class="btn btn-secondary btn-sm" onclick="window.FinancialCalendarModule.closePeriod('${cal.id}', '${p.id}')" style="color: var(--color-danger); padding: 2px 8px; font-size: 11px;">
                              🔒 Close Period
                            </button>
                          ` : (p.status === 'Closed' ? `
                            <button class="btn btn-secondary btn-sm" onclick="window.FinancialCalendarModule.showReopenModal('${cal.id}', '${p.id}')" style="color: var(--primary-300); padding: 2px 8px; font-size: 11px;">
                              🔓 Reopen
                            </button>
                          ` : `
                            <button class="btn btn-secondary btn-sm" onclick="window.FinancialCalendarModule.openPeriod('${cal.id}', '${p.id}')" style="color: #10b981; padding: 2px 8px; font-size: 11px;">
                              ⚡ Open Period
                            </button>
                          `)}
                          <button class="btn btn-icon btn-sm" onclick="window.FinancialCalendarModule.showEditPeriodModal('${cal.id}', '${p.id}')" title="Edit Period Details">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px;">
              <button class="btn btn-secondary btn-sm" onclick="window.FinancialCalendarModule.showAuditModal('${cal.id}')">
                📜 View Audit Trail
              </button>
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('fin-cal-periods-modal').remove()">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  // ==========================================================================
  // ADD & EDIT FINANCIAL YEAR MODALS (Section 8, 23, 24)
  // ==========================================================================
  showAddModal() {
    const existing = document.getElementById('fin-cal-add-modal');
    if (existing) existing.remove();

    const branches = this.getBranches();
    const defaultStart = '2027-04-01';
    const defaultEnd = '2028-03-31';

    const modalHtml = `
      <div id="fin-cal-add-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 680px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--border-color);">
            <div style="font-size: 17px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>📅</span>
              <span>Create New Financial Year</span>
            </div>
            <button onclick="document.getElementById('fin-cal-add-modal').remove()" style="background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <form id="fin-cal-add-form" onsubmit="window.FinancialCalendarModule.saveNewCalendar(event)" style="padding: 20px 22px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Financial Year Code <span style="color: var(--color-danger);">*</span>
                </label>
                <input 
                  type="text" 
                  id="fc-code" 
                  class="form-control form-control-sm" 
                  placeholder="e.g. FY 2027-28" 
                  value="FY 2027-28" 
                  required 
                  style="height: 34px;"
                />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Financial Year Name <span style="color: var(--color-danger);">*</span>
                </label>
                <input 
                  type="text" 
                  id="fc-name" 
                  class="form-control form-control-sm" 
                  placeholder="e.g. Financial Year 2027-2028" 
                  value="Financial Year 2027-2028" 
                  required 
                  style="height: 34px;"
                />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Start Date <span style="color: var(--color-danger);">*</span>
                </label>
                <input 
                  type="date" 
                  id="fc-start-date" 
                  class="form-control form-control-sm" 
                  value="${defaultStart}" 
                  required 
                  onchange="window.FinancialCalendarModule.updatePeriodPreview()" 
                  style="height: 34px;"
                />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  End Date <span style="color: var(--color-danger);">*</span>
                </label>
                <input 
                  type="date" 
                  id="fc-end-date" 
                  class="form-control form-control-sm" 
                  value="${defaultEnd}" 
                  required 
                  onchange="window.FinancialCalendarModule.updatePeriodPreview()" 
                  style="height: 34px;"
                />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Facility Applicability (Section 38)
                </label>
                <select id="fc-branch" class="form-control form-control-sm" style="height: 34px;">
                  ${branches.map(b => `
                    <option value="${b.id}" ${b.id === 'ALL' ? 'selected' : ''}>${b.name}</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Period Type (Section 11)
                </label>
                <select id="fc-period-type" class="form-control form-control-sm" style="height: 34px;">
                  <option value="Monthly" selected>Monthly (12 Financial Periods)</option>
                  <option value="Quarterly">Quarterly (4 Periods)</option>
                  <option value="Annual">Annual (Single Period)</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Initial Year Status
                </label>
                <select id="fc-status" class="form-control form-control-sm" style="height: 34px;">
                  <option value="Future" selected>Future (Planning)</option>
                  <option value="Open">Open (Active for Transactions)</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div style="display: flex; align-items: center; margin-top: 22px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer;">
                  <input type="checkbox" id="fc-current" />
                  <span>Mark as Current Operating Financial Year</span>
                </label>
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Remarks / Purpose
              </label>
              <textarea id="fc-remarks" class="form-control form-control-sm" rows="2" placeholder="Notes..."></textarea>
            </div>

            <!-- Auto-Generation Notice -->
            <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 6px; padding: 12px; margin-bottom: 16px; font-size: 12.5px; color: var(--text-secondary);">
              <strong>⚡ Automatic Period Engine (Section 24 / AC-04):</strong><br/>
              Saving will automatically generate 12 monthly financial periods between April and March with precise calendar boundaries.
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('fin-cal-add-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Create Financial Year</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  updatePeriodPreview() {
    // Stub for live dates update if needed
  },

  saveNewCalendar(e) {
    if (e) e.preventDefault();

    const code = document.getElementById('fc-code').value.trim();
    const name = document.getElementById('fc-name').value.trim();
    const start = document.getElementById('fc-start-date').value;
    const end = document.getElementById('fc-end-date').value;
    const branchId = document.getElementById('fc-branch').value;
    const periodType = document.getElementById('fc-period-type').value;
    const status = document.getElementById('fc-status').value;
    const isCurrent = document.getElementById('fc-current').checked;
    const remarks = document.getElementById('fc-remarks').value.trim();

    // Validations (V-01, V-02, V-03)
    if (!code || !start || !end) {
      alert('Validation Error: Code, Start Date, and End Date are mandatory.');
      return;
    }

    if (new Date(start) >= new Date(end)) {
      alert('Validation Error (Rule FCR-03 / V-02): Start Date must be earlier than End Date.');
      return;
    }

    const all = this.getAllCalendars();

    // Check duplicate code for same branch
    const dup = all.find(c => c.financial_year_code.toLowerCase() === code.toLowerCase() && c.branch_id === branchId);
    if (dup) {
      alert(`Validation Error (Rule V-03): Financial Year "${code}" already exists for the selected branch/facility.`);
      return;
    }

    // Check overlapping dates for same branch (V-01)
    const newStart = new Date(start);
    const newEnd = new Date(end);
    const overlap = all.find(c => {
      if (c.branch_id !== branchId) return false;
      const cStart = new Date(c.start_date);
      const cEnd = new Date(c.end_date);
      return (newStart <= cEnd && newEnd >= cStart);
    });

    if (overlap) {
      alert(`Validation Error (Rule FCR-01 / V-01): Date range overlaps with existing financial year ${overlap.financial_year_code} (${overlap.start_date} to ${overlap.end_date}).`);
      return;
    }

    // Generate monthly periods
    const periods = this.generatePeriodsForYear(start, end, periodType);

    const branches = this.getBranches();
    const branchObj = branches.find(b => b.id === branchId) || { name: 'All Facilities (Company-wide)' };

    const newId = `FC-${String(all.length + 1).padStart(3, '0')}`;

    // If marked as current year, clear other current year flags for this branch (FCR-02)
    if (isCurrent) {
      all.forEach(c => {
        if (c.branch_id === branchId) c.current_year_yn = false;
      });
    }

    const newCalendar = {
      id: newId,
      financial_year_code: code,
      financial_year_name: name,
      start_date: start,
      end_date: end,
      organization_id: 'ORG-001',
      organization_name: 'Patil Auto Dynamics Pvt Ltd',
      branch_id: branchId,
      branch_name: branchObj.name,
      period_type: periodType,
      status: status,
      current_year_yn: isCurrent,
      transaction_count: 0,
      remarks: remarks,
      created_by: (window.State && window.State.getCurrentUser() && window.State.getCurrentUser().full_name) || 'System Administrator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      periods: periods
    };

    all.push(newCalendar);

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('financial_calendar', newCalendar);
    }

    this.recordAudit({
      financial_year_id: newCalendar.id,
      financial_year_code: newCalendar.financial_year_code,
      action: 'CREATE_YEAR',
      old_status: '-',
      new_status: status,
      reason: `Financial year ${code} created with ${periods.length} ${periodType} accounting periods`
    });

    const modal = document.getElementById('fin-cal-add-modal');
    if (modal) modal.remove();

    if (window.State && window.State.showToast) {
      window.State.showToast(`Financial Year ${code} created successfully with ${periods.length} periods.`, 'success');
    }

    this.refreshTable();
  },

  showEditModal(calendarId) {
    const list = this.getAllCalendars();
    const cal = list.find(c => c.id === calendarId);
    if (!cal) return;

    const existing = document.getElementById('fin-cal-edit-modal');
    if (existing) existing.remove();

    const branches = this.getBranches();

    const modalHtml = `
      <div id="fin-cal-edit-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 680px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--border-color);">
            <div style="font-size: 17px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>✏️</span>
              <span>Edit Financial Year: ${cal.financial_year_code}</span>
            </div>
            <button onclick="document.getElementById('fin-cal-edit-modal').remove()" style="background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <form onsubmit="window.FinancialCalendarModule.saveEditCalendar(event, '${cal.id}')" style="padding: 20px 22px;">
            <!-- Row 1: Code and Name -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Financial Year Code <span style="color: var(--color-danger);">*</span>
                </label>
                <input type="text" id="fc-edit-code" class="form-control form-control-sm" value="${cal.financial_year_code || ''}" required style="height: 34px;" />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Financial Year Name <span style="color: var(--color-danger);">*</span>
                </label>
                <input type="text" id="fc-edit-name" class="form-control form-control-sm" value="${cal.financial_year_name || ''}" required style="height: 34px;" />
              </div>
            </div>

            <!-- Row 2: Facility Applicability & Period Type (Facility-wise Governance) -->
            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Facility Applicability (Section 38 & 38.1) <span style="color: var(--color-danger);">*</span>
                </label>
                <select id="fc-edit-branch" class="form-control form-control-sm" style="height: 34px;">
                  ${branches.map(b => `
                    <option value="${b.id}" ${b.id === cal.branch_id ? 'selected' : ''}>${b.name}</option>
                  `).join('')}
                </select>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                  Select "All Facilities" for company-wide inheritance, or a specific facility for facility override.
                </div>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Period Type (Section 11)
                </label>
                <select id="fc-edit-period-type" class="form-control form-control-sm" style="height: 34px;">
                  <option value="Monthly" ${(cal.period_type || 'Monthly') === 'Monthly' ? 'selected' : ''}>Monthly (12 Financial Periods)</option>
                  <option value="Quarterly" ${cal.period_type === 'Quarterly' ? 'selected' : ''}>Quarterly (4 Periods)</option>
                  <option value="Annual" ${cal.period_type === 'Annual' ? 'selected' : ''}>Annual (Single Period)</option>
                </select>
              </div>
            </div>

            <!-- Row 3: Dates -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Start Date <span style="color: var(--color-danger);">*</span>
                </label>
                <input type="date" id="fc-edit-start-date" class="form-control form-control-sm" value="${cal.start_date || ''}" required style="height: 34px;" />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  End Date <span style="color: var(--color-danger);">*</span>
                </label>
                <input type="date" id="fc-edit-end-date" class="form-control form-control-sm" value="${cal.end_date || ''}" required style="height: 34px;" />
              </div>
            </div>

            <!-- Row 4: Status and Current Year Checkbox -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Year Status
                </label>
                <select id="fc-edit-status" class="form-control form-control-sm" style="height: 34px;">
                  <option value="Open" ${cal.status === 'Open' ? 'selected' : ''}>Open (Active for Transactions)</option>
                  <option value="Closed" ${cal.status === 'Closed' ? 'selected' : ''}>Closed</option>
                  <option value="Future" ${cal.status === 'Future' ? 'selected' : ''}>Future (Planning)</option>
                </select>
              </div>

              <div style="display: flex; align-items: center; margin-top: 22px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); cursor: pointer;">
                  <input type="checkbox" id="fc-edit-current" ${cal.current_year_yn ? 'checked' : ''} />
                  <span>Mark as Current Operating FY for this Facility</span>
                </label>
              </div>
            </div>

            <!-- Row 5: Remarks -->
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Remarks / Purpose
              </label>
              <textarea id="fc-edit-remarks" class="form-control form-control-sm" rows="2" style="font-size: 13px;">${cal.remarks || ''}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 14px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('fin-cal-edit-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="font-weight: 600;">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  saveEditCalendar(e, calendarId) {
    if (e && e.preventDefault) e.preventDefault();

    const list = this.getAllCalendars();
    const cal = list.find(c => c.id === calendarId);
    if (!cal) return;

    const code = document.getElementById('fc-edit-code').value.trim();
    const name = document.getElementById('fc-edit-name').value.trim();
    const branchId = document.getElementById('fc-edit-branch').value;
    const startDate = document.getElementById('fc-edit-start-date').value;
    const endDate = document.getElementById('fc-edit-end-date').value;
    const periodType = document.getElementById('fc-edit-period-type').value;
    const status = document.getElementById('fc-edit-status').value;
    const isCurrent = document.getElementById('fc-edit-current').checked;
    const remarks = document.getElementById('fc-edit-remarks').value.trim();

    if (!code || !name || !startDate || !endDate) {
      alert('Validation Error: Financial Year Code, Name, Start Date, and End Date are mandatory.');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      alert('Validation Error (Rule FCR-03): Start Date must be earlier than End Date.');
      return;
    }

    // Check duplicate code for target branch
    const dup = list.find(c => c.id !== cal.id && c.financial_year_code.toLowerCase() === code.toLowerCase() && c.branch_id === branchId);
    if (dup) {
      alert(`Validation Error (Rule V-03): Financial Year "${code}" already exists for the selected branch/facility.`);
      return;
    }

    const branches = this.getBranches();
    const branchObj = branches.find(b => b.id === branchId) || { name: (branchId === 'ALL' ? 'All Facilities (Company-wide)' : `Facility ${branchId}`) };

    const oldBranchId = cal.branch_id;
    const oldBranchName = cal.branch_name;
    const oldStatus = cal.status;
    const oldCode = cal.financial_year_code;
    const oldStart = cal.start_date;
    const oldEnd = cal.end_date;

    cal.financial_year_code = code;
    cal.financial_year_name = name;
    cal.branch_id = branchId;
    cal.branch_name = branchObj.name;
    cal.period_type = periodType;
    cal.status = status;
    cal.current_year_yn = isCurrent;
    cal.remarks = remarks;
    cal.updated_at = new Date().toISOString();

    // If dates changed and periods exist, update dates or regenerate if not closed
    if (startDate !== oldStart || endDate !== oldEnd) {
      cal.start_date = startDate;
      cal.end_date = endDate;
      const hasClosedPeriods = (cal.periods || []).some(p => p.status === 'Closed');
      if (!hasClosedPeriods) {
        cal.periods = this.generatePeriodsForYear(startDate, endDate, periodType);
      }
    }

    // If marked as current year, clear other current year flags for this branch (FCR-02)
    if (isCurrent) {
      list.forEach(c => {
        if (c.id !== cal.id && c.branch_id === branchId) {
          c.current_year_yn = false;
          if (window.DB && typeof window.DB.upsert === 'function') {
            window.DB.upsert('financial_calendar', c);
          }
        }
      });
    }

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('financial_calendar', cal);
    }
    if (window.DB && window.DB.data && window.DB.data.financial_calendar) {
      const idx = window.DB.data.financial_calendar.findIndex(c => c.id === cal.id);
      if (idx !== -1) window.DB.data.financial_calendar[idx] = cal;
      if (typeof window.DB.saveData === 'function') window.DB.saveData();
    }

    // Record audit trail
    const auditNotes = [];
    if (oldBranchId !== branchId) auditNotes.push(`Facility changed: "${oldBranchName}" -> "${branchObj.name}"`);
    if (oldStatus !== status) auditNotes.push(`Status changed: "${oldStatus}" -> "${status}"`);
    if (oldCode !== code) auditNotes.push(`Code changed: "${oldCode}" -> "${code}"`);

    this.recordAudit({
      financial_year_id: cal.id,
      financial_year_code: cal.financial_year_code,
      action: 'EDIT_YEAR_CONFIG',
      old_status: oldStatus,
      new_status: status,
      reason: auditNotes.length > 0 ? auditNotes.join('; ') : 'Updated financial year configuration'
    });

    const modal = document.getElementById('fin-cal-edit-modal');
    if (modal) modal.remove();

    if (window.State && window.State.showToast) {
      window.State.showToast(`Financial Year "${cal.financial_year_code}" updated successfully for ${cal.branch_name}.`, 'success');
    }

    this.refreshTable();
  },

  // Edit Period Modal
  showEditPeriodModal(calendarId, periodId) {
    const list = this.getAllCalendars();
    const cal = list.find(c => c.id === calendarId);
    if (!cal) return;
    const period = (cal.periods || []).find(p => p.id === periodId);
    if (!period) return;

    const modalHtml = `
      <div id="fin-cal-period-edit-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10002; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 500px; max-width: 95vw; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 22px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
            <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>✏️</span>
              <span>Edit Period: ${period.period_code} (${cal.branch_name || 'All Facilities'})</span>
            </div>
            <button onclick="document.getElementById('fin-cal-period-edit-modal').remove()" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer;">&times;</button>
          </div>

          <form onsubmit="window.FinancialCalendarModule.saveEditPeriod(event, '${cal.id}', '${period.id}')">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Period Name
              </label>
              <input type="text" id="fc-period-edit-name" class="form-control form-control-sm" value="${period.period_name || ''}" required style="height: 34px;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Start Date
                </label>
                <input type="date" id="fc-period-edit-start" class="form-control form-control-sm" value="${period.start_date || ''}" required style="height: 34px;" />
              </div>
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  End Date
                </label>
                <input type="date" id="fc-period-edit-end" class="form-control form-control-sm" value="${period.end_date || ''}" required style="height: 34px;" />
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Period Status
              </label>
              <select id="fc-period-edit-status" class="form-control form-control-sm" style="height: 34px;">
                <option value="Open" ${period.status === 'Open' ? 'selected' : ''}>Open (Postings Allowed)</option>
                <option value="Closed" ${period.status === 'Closed' ? 'selected' : ''}>Closed (Blocked)</option>
                <option value="Future" ${period.status === 'Future' ? 'selected' : ''}>Future (Advance Planning)</option>
              </select>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 14px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('fin-cal-period-edit-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save Period</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  saveEditPeriod(e, calendarId, periodId) {
    if (e && e.preventDefault) e.preventDefault();
    const list = this.getAllCalendars();
    const cal = list.find(c => c.id === calendarId);
    if (!cal) return;
    const period = (cal.periods || []).find(p => p.id === periodId);
    if (!period) return;

    const name = document.getElementById('fc-period-edit-name').value.trim();
    const start = document.getElementById('fc-period-edit-start').value;
    const end = document.getElementById('fc-period-edit-end').value;
    const status = document.getElementById('fc-period-edit-status').value;

    const oldStatus = period.status;
    period.period_name = name;
    period.start_date = start;
    period.end_date = end;
    period.status = status;
    period.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('financial_calendar', cal);
    }
    if (window.DB && window.DB.data && window.DB.data.financial_calendar) {
      const idx = window.DB.data.financial_calendar.findIndex(c => c.id === cal.id);
      if (idx !== -1) window.DB.data.financial_calendar[idx] = cal;
      if (typeof window.DB.saveData === 'function') window.DB.saveData();
    }

    if (oldStatus !== status) {
      this.recordAudit({
        financial_year_id: cal.id,
        financial_year_code: cal.financial_year_code,
        period_code: period.period_code,
        action: 'EDIT_PERIOD_STATUS',
        old_status: oldStatus,
        new_status: status,
        reason: `Period ${period.period_code} status updated to ${status} for ${cal.branch_name}`
      });
    }

    const modal = document.getElementById('fin-cal-period-edit-modal');
    if (modal) modal.remove();

    if (window.State && window.State.showToast) {
      window.State.showToast(`Period ${period.period_code} updated successfully.`, 'success');
    }

    this.showPeriodsModal(calendarId);
    this.refreshTable();
  },

  // Delete Guarded by BRD Rule FCR-10 / AC-13
  deleteCalendar(calendarId) {
    const list = this.getAllCalendars();
    const cal = list.find(c => c.id === calendarId);
    if (!cal) return;

    const hasTransactions = (parseInt(cal.transaction_count, 10) || 0) > 0 || cal.status === 'Closed';

    if (hasTransactions) {
      alert(`Cannot delete Financial Year ${cal.financial_year_code}!\n\nAs per BRD Section 9 & Business Rule FCR-10 / AC-13:\nFinancial years with transaction history or closed status cannot be deleted.\n\nPlease retain the record for statutory audit and reporting.`);
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete unused Financial Year ${cal.financial_year_code}?`)) {
      return;
    }

    if (window.DB) {
      if (typeof window.DB.delete === 'function') {
        window.DB.delete('financial_calendar', calendarId);
      }
      if (typeof window.DB.remove === 'function') {
        window.DB.remove('financial_calendar', calendarId);
      }
      if (window.DB.data && Array.isArray(window.DB.data.financial_calendar)) {
        window.DB.data.financial_calendar = window.DB.data.financial_calendar.filter(
          item => String(item.id).toLowerCase() !== String(calendarId).toLowerCase()
        );
        if (typeof window.DB.saveData === 'function') {
          window.DB.saveData();
        }
      }
    }

    if (window.State && window.State.showToast) {
      window.State.showToast(`Financial Year ${cal.financial_year_code} deleted successfully.`, 'success');
    }

    this.refreshTable();
  },

  // ==========================================================================
  // TRANSACTION POSTING DATE VALIDATOR MODAL (Section 16, 35, 37)
  // ==========================================================================
  showValidateDateModal() {
    const existing = document.getElementById('fin-cal-validator-modal');
    if (existing) existing.remove();

    const branches = this.getBranches();
    const todayStr = new Date().toISOString().split('T')[0];

    const modalHtml = `
      <div id="fin-cal-validator-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 560px; max-width: 95vw; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--border-color);">
            <div style="font-size: 17px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>⚡</span>
              <span>Transaction Posting Date Validator</span>
            </div>
            <button onclick="document.getElementById('fin-cal-validator-modal').remove()" style="background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <div style="padding: 20px 22px;">
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5;">
              Verify whether an invoice, work order, GRN, or inventory transaction dated on a specific date will be permitted or blocked based on active accounting period rules (Section 16 & 20).
            </p>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Transaction Date to Test
              </label>
              <input type="date" id="test-tx-date" class="form-control form-control-sm" value="${todayStr}" style="height: 34px;" />
            </div>

            <div style="margin-bottom: 18px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Facility Context
              </label>
              <select id="test-tx-branch" class="form-control form-control-sm" style="height: 34px;">
                ${branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
              </select>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 18px;">
              <button 
                type="button" 
                class="btn btn-primary btn-sm" 
                style="flex: 1;" 
                onclick="window.FinancialCalendarModule.runDateValidationTest()"
              >
                ⚡ Validate Transaction Date
              </button>
            </div>

            <!-- Result Box -->
            <div id="test-tx-result" style="display: none; padding: 14px; border-radius: 8px; font-size: 13px;"></div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  runDateValidationTest() {
    const dateInput = document.getElementById('test-tx-date');
    const branchInput = document.getElementById('test-tx-branch');
    const resultBox = document.getElementById('test-tx-result');
    if (!dateInput || !resultBox) return;

    const txDate = dateInput.value;
    const branchId = branchInput ? branchInput.value : 'ALL';

    const result = this.validateTransactionDate(txDate, branchId);

    resultBox.style.display = 'block';
    if (result.allowed) {
      resultBox.style.background = 'rgba(16, 185, 129, 0.12)';
      resultBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
      resultBox.style.color = '#10b981';
      resultBox.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span>✅ TRANSACTION PERMITTED</span>
        </div>
        <div>${result.message}</div>
        <div style="margin-top: 6px; font-size: 11.5px; opacity: 0.9;">
          Financial Year: <strong>${result.fy}</strong> | Period: <strong>${result.period}</strong>
        </div>
      `;
    } else {
      resultBox.style.background = 'rgba(239, 68, 68, 0.12)';
      resultBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      resultBox.style.color = '#ef4444';
      resultBox.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span>🛑 TRANSACTION BLOCKED</span>
        </div>
        <div>${result.message}</div>
        ${result.fy ? `<div style="margin-top: 6px; font-size: 11.5px; opacity: 0.9;">Financial Year: <strong>${result.fy}</strong> ${result.period ? `| Period: <strong>${result.period}</strong>` : ''}</div>` : ''}
      `;
    }
  },

  // ==========================================================================
  // AUDIT TRAIL MODAL (Section 31, AC-14)
  // ==========================================================================
  showAuditModal(calendarId) {
    const logs = this.getAllAuditLogs();
    const filtered = calendarId ? logs.filter(l => l.financial_year_id === calendarId) : logs;

    const existing = document.getElementById('fin-cal-audit-modal');
    if (existing) existing.remove();

    const modalHtml = `
      <div id="fin-cal-audit-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 800px; max-width: 95vw; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--border-color);">
            <div style="font-size: 17px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>📜</span>
              <span>Financial Calendar Audit Trail (Section 31)</span>
            </div>
            <button onclick="document.getElementById('fin-cal-audit-modal').remove()" style="background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <div style="padding: 20px;">
            <div class="table-responsive">
              <table class="data-table" style="font-size: 12.5px;">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Period / Year</th>
                    <th>Status Transition</th>
                    <th>User</th>
                    <th>Reason / Justification</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.length === 0 ? `
                    <tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">No audit entries recorded.</td></tr>
                  ` : filtered.map(l => `
                    <tr>
                      <td class="cell-mono" style="font-size: 11px;">${this.formatDateTime(l.timestamp)}</td>
                      <td><span class="badge badge-primary">${l.action}</span></td>
                      <td><div>${l.period_name || l.financial_year_code}</div></td>
                      <td style="font-size: 11px;">
                        <span style="color: var(--text-muted);">${l.old_status}</span> &rarr; <strong>${l.new_status}</strong>
                      </td>
                      <td>${l.user_name}</td>
                      <td style="color: var(--text-secondary); max-width: 220px;">${l.reason}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('fin-cal-audit-modal').remove()">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  exportCsv() {
    const list = this.getAllCalendars();
    const rows = [
      ['ID', 'Financial Year Code', 'Name', 'Start Date', 'End Date', 'Facility', 'Status', 'Current Year', 'Total Periods']
    ];

    list.forEach(c => {
      rows.push([
        c.id,
        c.financial_year_code,
        c.financial_year_name,
        c.start_date,
        c.end_date,
        c.branch_name,
        c.status,
        c.current_year_yn ? 'YES' : 'NO',
        (c.periods || []).length
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockIQ_Financial_Calendar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  formatDate(dateStr) {
    if (typeof window.formatDate === 'function') {
      return window.formatDate(dateStr);
    }
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}-${month}-${d.getFullYear()}`;
    } catch (_) {
      return dateStr;
    }
  },

  formatDateTime(isoStr) {
    if (typeof window.formatDateTime === 'function') {
      return window.formatDateTime(isoStr);
    }
    if (!isoStr) return '-';
    return String(isoStr);
  }
};
