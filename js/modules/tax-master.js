/* ==========================================================================
   ENTERPRISE ISCM - TAX MASTER MODULE (BRD COMPLIANT v1.0)
   Centralized GST Tax Slabs & Taxation Configuration Suite
   Conforming to Business Requirements Document for Two-Wheeler Management System
   ========================================================================== */

window.TaxMasterModule = {
  activeTab: 'ALL',
  classificationFilter: 'ALL',
  searchTerm: '',
  typeFilter: 'ALL',
  rateFilter: 'ALL',
  statusFilter: 'ALL',
  currentPage: 1,
  pageSize: 10,

  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    // Ensure page top bar is hidden so layout is consistent with Masters modules
    const pageTopBar = (typeof document !== 'undefined' && document.getElementById) 
      ? (document.getElementById('page-top-bar') || (document.querySelector && document.querySelector('.page-top-bar'))) 
      : null;
    if (pageTopBar) pageTopBar.style.display = 'none';

    container.innerHTML = `
      <!-- Tax Master Top Row: Title (Left) + Search, Status & Actions (Right) -->
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 4px; margin-bottom: 16px; flex-wrap: wrap;">
        <!-- Left: Page Title -->
        <h2 style="font-size: 20px; font-weight: 700; margin: 0; color: var(--text-primary); font-family: var(--font-sans, 'Inter', sans-serif);">
          Tax Master
        </h2>

        <!-- Right: Clean Toolbar Controls (Search, Status Filter, Calculator, Export, Add) -->
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <!-- Search input -->
          <div style="position: relative; display: inline-flex; align-items: center;">
            <input 
              type="text" 
              id="tax-master-search-input"
              class="form-control form-control-sm" 
              placeholder="Search code, slab name..." 
              value="${this.searchTerm}" 
              oninput="window.TaxMasterModule.setSearch(this.value)" 
              style="width: 240px; height: 32px; font-size: 13px; padding-right: 24px;" 
            />
            <button 
              id="tax-master-search-clear" 
              type="button" 
              onclick="window.TaxMasterModule.clearSearch()" 
              style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: ${this.searchTerm ? 'block' : 'none'}; font-size: 14px;"
            >&times;</button>
          </div>

          <!-- Status filter -->
          <select id="tax-master-status-select" class="form-control form-control-sm" onchange="window.TaxMasterModule.setStatusFilter(this.value)" style="width: 125px; height: 32px; font-size: 13px;">
            <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
            <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>● Active</option>
            <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>○ Inactive</option>
          </select>

          <!-- Quick Action: Tax Calculator Simulator -->
          <button class="btn btn-secondary btn-sm" onclick="window.TaxMasterModule.showCalculatorModal()" title="Open Interactive GST Tax Calculator" style="height: 32px; font-size: 13px; font-weight: 600; color: var(--primary-300);">
            <span>⚡ Tax Calculator</span>
          </button>

          <!-- Actions: Export CSV & Add Tax Slab -->
          <button class="btn btn-secondary btn-sm" onclick="window.TaxMasterModule.exportCsv()" title="Export Tax Slabs to CSV" style="height: 32px; font-size: 13px;">
            <span>Export CSV</span>
          </button>
          <button id="tax-master-add-btn" class="btn btn-primary btn-sm" onclick="window.TaxMasterModule.showAddModal()" style="height: 32px; font-size: 13px;">
            <span>+ Add Tax Slab</span>
          </button>
        </div>
      </div>

      <!-- Simple One Screen Content: Data Table -->
      <div id="tax-master-table-content">
        ${this.renderTableContent()}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab || 'ALL';
    this.currentPage = 1;
    this.refreshTable();
  },

  setClassificationFilter(val) {
    this.classificationFilter = val || 'ALL';
    this.currentPage = 1;
    this.refreshTable();
  },

  setSearch(val) {
    this.searchTerm = val;
    this.currentPage = 1;
    const clearBtn = document.getElementById('tax-master-search-clear');
    if (clearBtn && clearBtn.style) {
      clearBtn.style.display = val ? 'block' : 'none';
    }
    this.refreshTable();
  },

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    const input = document.getElementById('tax-master-search-input');
    if (input) input.value = '';
    const clearBtn = document.getElementById('tax-master-search-clear');
    if (clearBtn && clearBtn.style) clearBtn.style.display = 'none';
    this.refreshTable();
  },

  setTypeFilter(val) {
    this.typeFilter = val;
    this.currentPage = 1;
    this.refreshTable();
  },

  setRateFilter(val) {
    this.rateFilter = val;
    this.currentPage = 1;
    this.refreshTable();
  },

  setStatusFilter(val) {
    this.statusFilter = val;
    this.currentPage = 1;
    this.refreshTable();
  },

  setPageSize(size) {
    this.pageSize = Number(size) || 10;
    this.currentPage = 1;
    this.refreshTable();
  },

  goToPage(page) {
    this.currentPage = Math.max(1, Number(page) || 1);
    this.refreshTable();
  },

  refreshTable() {
    const el = document.getElementById('tax-master-table-content');
    if (el) {
      el.innerHTML = this.renderTableContent();
    } else {
      this.render();
    }
  },

  getFilteredEntries() {
    let list = window.DB.getAll('taxes') || [];

    // Filter by Tab
    if (this.activeTab === 'INTRA') {
      list = list.filter(t => (t.cgst_rate > 0 || t.sgst_rate > 0 || t.rate === 0));
    } else if (this.activeTab === 'INTER') {
      list = list.filter(t => (t.igst_rate > 0 || t.rate === 0));
    } else if (this.activeTab === 'SYSTEM') {
      list = list.filter(t => t.system_default === true);
    } else if (this.activeTab === 'USER') {
      list = list.filter(t => !t.system_default);
    }

    // Filter by Classification dropdown (Standard GST vs Custom Slabs)
    if (this.classificationFilter === 'SYSTEM') {
      list = list.filter(t => t.system_default === true);
    } else if (this.classificationFilter === 'USER') {
      list = list.filter(t => !t.system_default);
    }

    // Filter by Type
    if (this.typeFilter !== 'ALL') {
      list = list.filter(t => t.type === this.typeFilter);
    }

    // Filter by Rate
    if (this.rateFilter !== 'ALL') {
      if (this.rateFilter === 'CUSTOM') {
        list = list.filter(t => ![0, 5, 12, 18, 28].includes(t.rate));
      } else {
        const targetRate = Number(this.rateFilter);
        list = list.filter(t => t.rate === targetRate);
      }
    }

    // Filter by Status
    if (this.statusFilter !== 'ALL') {
      list = list.filter(t => t.status === this.statusFilter);
    }

    // Search term
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      list = list.filter(t => 
        (t.code && t.code.toLowerCase().includes(q)) ||
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.system_default ? 'standard system' : 'custom user').includes(q) ||
        String(t.rate).includes(q)
      );
    }

    // Sort: merged by numerical rate ASC; if rate matches, standard GST first
    list.sort((a, b) => {
      const rateA = typeof a.rate !== 'undefined' ? a.rate : (a.total_gst || 0);
      const rateB = typeof b.rate !== 'undefined' ? b.rate : (b.total_gst || 0);
      if (rateA !== rateB) {
        return rateA - rateB;
      }
      if (a.system_default !== b.system_default) {
        return a.system_default ? -1 : 1;
      }
      return (a.code || '').localeCompare(b.code || '');
    });

    return list;
  },

  renderTableContent() {
    const filtered = this.getFilteredEntries();
    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const paged = filtered.slice(startIndex, startIndex + this.pageSize);

    return `
      <div class="content-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 130px;">Tax Code</th>
                <th style="width: 190px;">Tax Slab Name</th>
                <th style="width: 110px;">Tax Type</th>
                <th class="text-right" style="width: 110px;">Total GST</th>
                <th class="text-right" style="width: 90px;">CGST</th>
                <th class="text-right" style="width: 90px;">SGST</th>
                <th class="text-right" style="width: 90px;">IGST</th>
                <th style="width: 140px;">Classification</th>
                <th style="width: 110px;">Status</th>
                <th style="width: 130px;">Effective From</th>
                <th class="text-right" style="width: 140px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${paged.length === 0 ? `
                <tr>
                  <td colspan="11" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <div style="font-weight: 600; font-size: 14px;">No Tax Slabs Found</div>
                    <div style="font-size: 12px; margin-top: 4px;">Click "+ Add Tax Slab" to configure a new custom tax slab.</div>
                  </td>
                </tr>
              ` : paged.map(item => {
                const isSystem = item.system_default === true;
                const isActive = item.status === 'Active';
                const hasTransactions = (item.transaction_count || 0) > 0;

                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: #60a5fa; font-size: 13px;">${item.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">${item.id}</div>
                    </td>
                    <td>
                      <div class="cell-strong" style="font-size: 13px;">${item.name}</div>
                      ${item.description ? `<div style="font-size: 11px; color: var(--text-muted); max-width: 260px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.description}</div>` : ''}
                    </td>
                    <td>
                      <span class="badge badge-subtle" style="font-weight: 500; font-size: 12px;">
                        ${item.type || 'GST'}
                      </span>
                    </td>
                    <td class="text-right">
                      <span class="cell-mono" style="font-weight: 700; color: #34d399; font-size: 13.5px;">${item.rate}%</span>
                    </td>
                    <td class="text-right">
                      <span class="cell-mono" style="font-size: 12.5px; color: var(--text-secondary);">${item.cgst_rate}%</span>
                    </td>
                    <td class="text-right">
                      <span class="cell-mono" style="font-size: 12.5px; color: var(--text-secondary);">${item.sgst_rate}%</span>
                    </td>
                    <td class="text-right">
                      <span class="cell-mono" style="font-size: 12.5px; color: var(--primary-300); font-weight: 600;">${item.igst_rate}%</span>
                    </td>
                    <td>
                      ${isSystem ? `
                        <span class="badge badge-primary" style="font-size: 11px; padding: 2px 7px;" title="Globally defined system GST slab (Protected)">
                          🔒 Standard GST
                        </span>
                      ` : `
                        <span class="badge badge-subtle" style="font-size: 11px; padding: 2px 7px;" title="Organization-defined custom tax slab">
                          Custom Slab
                        </span>
                      `}
                    </td>
                    <td>
                      <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}">
                        ${isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style="font-size: 12px; color: var(--text-secondary);">${item.effective_from || '01-Jul-2017'}</div>
                      ${item.effective_to ? `<div style="font-size: 10px; color: var(--text-muted);">To: ${item.effective_to}</div>` : ''}
                    </td>
                    <td class="text-right">
                      <div style="display: flex; justify-content: flex-end; gap: 6px;">
                        <!-- 1. View Details Modal -->
                        <button class="btn btn-secondary btn-xs" title="View Tax Slab Details & Calculations" onclick="window.TaxMasterModule.showViewModal('${item.id}')">
                          <span>👁️</span>
                        </button>

                        <!-- 2. Edit Action: Disabled for System Defaults -->
                        ${isSystem ? `
                          <button class="btn btn-icon btn-sm" disabled style="opacity: 0.35; cursor: not-allowed;" title="System-defined GST records are protected and non-editable (BR-TAX-003)">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                        ` : `
                          <button class="btn btn-icon btn-sm" title="${hasTransactions ? 'Edit description & validity (rates locked by historical transactions)' : 'Edit Tax Slab'}" onclick="window.TaxMasterModule.showEditModal('${item.id}')">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                        `}

                        <!-- 3. Toggle Status Action: Disabled for System Defaults -->
                        ${isSystem ? `
                          <button class="btn btn-icon btn-sm" disabled style="opacity: 0.35; cursor: not-allowed;" title="System-defined GST records cannot be deactivated (BR-TAX-005)">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-warning, #f59e0b);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          </button>
                        ` : `
                          <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate Tax Slab' : 'Activate Tax Slab'}" onclick="window.TaxMasterModule.toggleStatus('${item.id}')">
                            ${isActive ? `
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-warning, #f59e0b);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            ` : `
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success, #10b981);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                            `}
                          </button>
                        `}

                        <!-- 4. Delete Action: Disabled for System Defaults and records with transaction history -->
                        ${isSystem ? `
                          <button class="btn btn-icon btn-sm" disabled style="opacity: 0.35; cursor: not-allowed; color: var(--color-danger, #ef4444);" title="System-defined GST records cannot be deleted (BR-TAX-004)">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        ` : hasTransactions ? `
                          <button class="btn btn-icon btn-sm" disabled style="opacity: 0.35; cursor: not-allowed; color: var(--color-danger, #ef4444);" title="Tax record has ${item.transaction_count} historical transactions. Deletion prevented (BR-TAX-012); deactivation is permitted.">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        ` : `
                          <button class="btn btn-icon btn-sm" title="Remove Custom Tax Slab" style="color: var(--color-danger, #ef4444);" onclick="window.TaxMasterModule.deleteEntry('${item.id}')">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        `}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${this.renderPagination(totalRecords, totalPages, startIndex, paged.length)}
      </div>
    `;
  },

  renderPagination(totalRecords, totalPages, startIndex, pageCount) {
    const endIndex = Math.min(startIndex + pageCount, totalRecords);

    return `
      <div class="user-pagination-bar" style="margin-top: 14px; padding: 8px 4px 4px 4px; border-top: 1px solid var(--border-color, #334155); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 13px; font-weight: 400;">
        <div style="font-size: 13px; color: var(--text-secondary); font-weight: 400;">
          Showing <strong style="color: var(--text-primary); font-weight: 600; font-size: 13px;">${totalRecords === 0 ? 0 : startIndex + 1}</strong> to <strong style="color: var(--text-primary); font-weight: 600; font-size: 13px;">${endIndex}</strong> of <strong style="color: var(--text-primary); font-weight: 600; font-size: 13px;">${totalRecords}</strong> entries
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="font-size: 13px; font-weight: 400;">Show</span>
            <select class="form-control form-control-sm" onchange="window.TaxMasterModule.setPageSize(this.value)" style="height: 28px; font-size: 13px; padding: 1px 6px; width: 70px; border-radius: 4px; font-weight: 500;">
              <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10</option>
              <option value="25" ${this.pageSize === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100</option>
            </select>
            <span style="font-size: 13px; font-weight: 400;">entries</span>
          </div>

          <div class="pagination-buttons" style="display: flex; gap: 4px; align-items: center;">
            <button class="btn btn-secondary btn-xs" ${this.currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"'} onclick="window.TaxMasterModule.goToPage(1)" title="First Page">⏮</button>
            <button class="btn btn-secondary btn-xs" ${this.currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"'} onclick="window.TaxMasterModule.goToPage(${this.currentPage - 1})" title="Previous Page">◀ Prev</button>
            ${this.renderPaginationPills(this.currentPage, totalPages)}
            <button class="btn btn-secondary btn-xs" ${this.currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"'} onclick="window.TaxMasterModule.goToPage(${this.currentPage + 1})" title="Next Page">Next ▶</button>
            <button class="btn btn-secondary btn-xs" ${this.currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"'} onclick="window.TaxMasterModule.goToPage(${totalPages})" title="Last Page">⏭</button>
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
      pills.push(`<button class="btn btn-secondary btn-xs" onclick="window.TaxMasterModule.goToPage(1)" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 500;">1</button>`);
      if (startPage > 2) {
        pills.push(`<span style="padding: 0 3px; color: var(--text-muted); line-height: 28px; font-size: 12px;">...</span>`);
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      const isActive = p === current;
      pills.push(`
        <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-xs" 
                onclick="window.TaxMasterModule.goToPage(${p})" 
                style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: ${isActive ? '600' : '500'};">
          ${p}
        </button>
      `);
    }

    if (endPage < total) {
      if (endPage < total - 1) {
        pills.push(`<span style="padding: 0 3px; color: var(--text-muted); line-height: 28px; font-size: 12px;">...</span>`);
      }
      pills.push(`<button class="btn btn-secondary btn-xs" onclick="window.TaxMasterModule.goToPage(${total})" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 500;">${total}</button>`);
    }

    return pills.join('');
  },

  // ==========================================================================
  // ADD MODAL & CRUD
  // ==========================================================================
  showAddModal() {
    const all = window.DB.getAll('taxes') || [];
    const nextId = `TAX-${String(all.length + 1).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const content = `
      <form id="add-tax-slab-form" onsubmit="event.preventDefault(); window.TaxMasterModule.submitCreate();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: rgba(99, 102, 241, 0.07); border-left: 4px solid var(--primary-500); border-radius: 4px; padding: 10px 14px; font-size: 12px; color: var(--text-secondary); line-height: 1.45;">
          Custom tax slabs are identified as <strong>User Defined (System Default = No)</strong>. Ensure CGST + SGST equals Total GST, and IGST equals Total GST as per statutory GST rules.
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Tax Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="new-tax-code" class="form-control" placeholder="e.g. GST03-CUSTOM, CUST-CESS-01" required maxlength="20" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" />
          </div>
          <div>
            <label class="form-label">Tax Type <span style="color: var(--color-danger)">*</span></label>
            <select id="new-tax-type" class="form-control" required style="font-weight: 600;">
              <option value="GST" selected>GST (Goods & Services Tax)</option>
              <option value="Custom Tax">Custom Tax / Cess</option>
              <option value="CGST">CGST</option>
              <option value="SGST">SGST</option>
              <option value="IGST">IGST</option>
              <option value="UTGST">UTGST</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Tax Slab Display Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="new-tax-name" class="form-control" placeholder="e.g. Special GST 3%, Luxury Cess 12%" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 6px;">
          <div>
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 4px;">Total Tax Rate (%) <span style="color: var(--color-danger)">*</span></label>
            <input 
              type="number" 
              id="new-tax-rate" 
              class="form-control" 
              placeholder="e.g. 18" 
              required 
              min="0" 
              max="100" 
              step="0.01" 
              style="font-family: var(--font-mono); font-weight: 700; color: #34d399;"
              oninput="window.TaxMasterModule.onTotalRateChange('new')" 
            />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 4px;">CGST Rate (%)</label>
            <input type="number" id="new-cgst-rate" class="form-control" placeholder="0" min="0" max="100" step="0.01" style="font-family: var(--font-mono);" />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 4px;">SGST Rate (%)</label>
            <input type="number" id="new-sgst-rate" class="form-control" placeholder="0" min="0" max="100" step="0.01" style="font-family: var(--font-mono);" />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 4px;">IGST Rate (%)</label>
            <input type="number" id="new-igst-rate" class="form-control" placeholder="0" min="0" max="100" step="0.01" style="font-family: var(--font-mono); color: var(--primary-300); font-weight: 600;" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Effective From <span style="color: var(--color-danger)">*</span></label>
            <input type="date" id="new-tax-effective-from" class="form-control" value="${todayStr}" required />
          </div>
          <div>
            <label class="form-label">Effective To</label>
            <input type="date" id="new-tax-effective-to" class="form-control" placeholder="End date" />
          </div>
        </div>

        <div>
          <label class="form-label">Applicable Transactions Scope</label>
          <select id="new-tax-applicability" class="form-control">
            <option value="All Transactions" selected>All Transactions (Parts, Labor, Billing)</option>
            <option value="Spare Parts & Materials">Spare Parts, Consumables & Materials</option>
            <option value="Workshop Labor & Services">Workshop Labor & Job Card Services</option>
            <option value="Counter Sales">Over-the-Counter Sales</option>
            <option value="Inter-Facility Transfers">Inter-Facility Stock Transfers</option>
          </select>
        </div>

        <div>
          <label class="form-label">Description / Statutory Reference</label>
          <textarea id="new-tax-desc" class="form-control" rows="2" placeholder="Brief statutory reason, circular reference, or business justification..."></textarea>
        </div>

        <div>
          <label class="form-label">Initial Status</label>
          <select id="new-tax-status" class="form-control">
            <option value="Active" selected>Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <input type="hidden" id="new-tax-id" value="${nextId}" />
      </form>
    `;

    window.State.openModal('Add New Tax Slab', content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('add-tax-slab-form').requestSubmit()">Save Tax Slab</button>
    `);
  },

  onTotalRateChange(prefix) {
    const rateEl = document.getElementById(`${prefix}-tax-rate`);
    const cgstEl = document.getElementById(`${prefix}-cgst-rate`);
    const sgstEl = document.getElementById(`${prefix}-sgst-rate`);
    const igstEl = document.getElementById(`${prefix}-igst-rate`);

    if (!rateEl || !cgstEl || !sgstEl || !igstEl) return;
    const total = parseFloat(rateEl.value) || 0;
    const half = Math.round((total / 2) * 100) / 100;

    cgstEl.value = half;
    sgstEl.value = half;
    igstEl.value = total;
  },

  validateTaxSlab(data, excludeId = null) {
    const code = (data.code || '').trim().toUpperCase();
    const name = (data.name || '').trim();
    const type = data.tax_type || data.type || 'GST';
    const rate = typeof data.total_gst !== 'undefined' ? parseFloat(data.total_gst) : parseFloat(data.rate);
    const cgst = parseFloat(data.cgst_rate) || 0;
    const sgst = parseFloat(data.sgst_rate) || 0;
    const igst = parseFloat(data.igst_rate) || 0;
    const effFrom = data.effective_from;
    const effTo = data.effective_to;

    // TAX-VAL-001 & TAX-VAL-003 & TAX-VAL-004
    if (!code) return { valid: false, error: 'Tax Code is mandatory (TAX-VAL-001).' };
    if (!name) return { valid: false, error: 'Tax Name is mandatory (TAX-VAL-003).' };
    if (isNaN(rate)) return { valid: false, error: 'Tax Rate is mandatory (TAX-VAL-004).' };

    // TAX-VAL-005: Rate cannot be negative
    if (rate < 0) return { valid: false, error: 'Tax Rate cannot be negative (TAX-VAL-005).' };

    // TAX-VAL-002: Unique Tax Code
    const all = (window.DB && window.DB.getAll ? window.DB.getAll('taxes') : []) || [];
    if (all.some(t => t.id !== excludeId && t.code.toUpperCase() === code)) {
      return { valid: false, error: `Tax Code "${code}" already exists (TAX-VAL-002).` };
    }

    // Unique Tax Name
    if (all.some(t => t.id !== excludeId && t.name.toLowerCase() === name.toLowerCase())) {
      return { valid: false, error: `Tax Name "${name}" already exists.` };
    }

    // TAX-VAL-006 & TAX-VAL-007
    if (type === 'GST') {
      const sum = Math.round((cgst + sgst) * 100) / 100;
      if (Math.abs(sum - rate) > 0.01) {
        return { valid: false, error: `CGST (${cgst}%) + SGST (${sgst}%) must equal Total Rate (${rate}%) [TAX-VAL-006].` };
      }
      if (Math.abs(igst - rate) > 0.01) {
        return { valid: false, error: `IGST (${igst}%) must equal Total Rate (${rate}%) [TAX-VAL-007].` };
      }
    }

    // TAX-VAL-008 & TAX-VAL-009: Effective dates
    if (!effFrom) {
      return { valid: false, error: 'Effective From date is mandatory (TAX-VAL-008).' };
    }
    if (effTo && effTo < effFrom) {
      return { valid: false, error: 'Effective To cannot be earlier than Effective From (TAX-VAL-009).' };
    }

    return { valid: true };
  },

  submitCreate() {
    const id = document.getElementById('new-tax-id').value;
    const code = document.getElementById('new-tax-code').value.trim().toUpperCase();
    const name = document.getElementById('new-tax-name').value.trim();
    const type = document.getElementById('new-tax-type').value;
    const rate = parseFloat(document.getElementById('new-tax-rate').value);
    const cgst = parseFloat(document.getElementById('new-cgst-rate').value) || 0;
    const sgst = parseFloat(document.getElementById('new-sgst-rate').value) || 0;
    const igst = parseFloat(document.getElementById('new-igst-rate').value) || 0;
    const effFrom = document.getElementById('new-tax-effective-from').value;
    const effTo = document.getElementById('new-tax-effective-to').value;
    const applicability = document.getElementById('new-tax-applicability').value;
    const desc = document.getElementById('new-tax-desc').value.trim();
    const status = document.getElementById('new-tax-status').value;

    const validation = this.validateTaxSlab({
      code,
      name,
      type,
      rate,
      cgst_rate: cgst,
      sgst_rate: sgst,
      igst_rate: igst,
      effective_from: effFrom,
      effective_to: effTo
    });

    if (!validation.valid) {
      window.State.showToast(validation.error, 'error');
      return;
    }

    const newTax = {
      id,
      code,
      name,
      type,
      rate,
      cgst_rate: cgst,
      sgst_rate: sgst,
      igst_rate: igst,
      system_default: false, // BR-TAX-007 & BR-TAX-016: Always false for user slabs
      editable: true,
      deletable: true,
      status,
      is_global: false,
      effective_from: effFrom,
      effective_to: effTo || '',
      applicable_transactions: applicability,
      description: desc,
      transaction_count: 0,
      created_at: new Date().toISOString()
    };

    window.DB.insert('taxes', newTax);
    window.DB.logAudit('TAX_SLAB_CREATED', 'TAX_MASTER', id, `Created custom tax slab: ${name} (${code}) at ${rate}%`);
    window.State.showToast(`Custom tax slab "${name}" created successfully.`, 'success');
    window.State.closeModal();
    this.render();
  },

  // ==========================================================================
  // EDIT MODAL
  // ==========================================================================
  showEditModal(id) {
    const entry = window.DB.getById('taxes', id);
    if (!entry) return;

    // BR-TAX-003 & TAX-VAL-010: System-defined taxes cannot be edited
    if (entry.system_default) {
      window.State.showToast('System-defined GST records are protected and non-editable (BR-TAX-003).', 'error');
      return;
    }

    const hasTransactions = (entry.transaction_count || 0) > 0;

    const content = `
      <form id="edit-tax-slab-form" onsubmit="event.preventDefault(); window.TaxMasterModule.submitEdit('${id}');" style="display: flex; flex-direction: column; gap: 14px;">
        ${hasTransactions ? `
          <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; border-radius: 4px; padding: 10px 14px; font-size: 12px; color: #fbbf24; line-height: 1.45;">
            <strong>Transaction Lock Active:</strong> This tax slab has been utilized in ${entry.transaction_count} transactions. Tax rates cannot be altered to maintain historical ledger integrity (BR-TAX-012). You may update validity dates, scope, and description.
          </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Tax Code</label>
            <input type="text" id="edit-tax-code" class="form-control" value="${entry.code}" ${hasTransactions ? 'readonly style="opacity: 0.7; font-family: var(--font-mono); font-weight: 700;"' : 'required maxlength="20" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;"'} />
          </div>
          <div>
            <label class="form-label">Tax Type</label>
            <select id="edit-tax-type" class="form-control" ${hasTransactions ? 'disabled' : 'required'}>
              <option value="GST" ${entry.type === 'GST' ? 'selected' : ''}>GST</option>
              <option value="Custom Tax" ${entry.type === 'Custom Tax' ? 'selected' : ''}>Custom Tax</option>
              <option value="CGST" ${entry.type === 'CGST' ? 'selected' : ''}>CGST</option>
              <option value="SGST" ${entry.type === 'SGST' ? 'selected' : ''}>SGST</option>
              <option value="IGST" ${entry.type === 'IGST' ? 'selected' : ''}>IGST</option>
              <option value="UTGST" ${entry.type === 'UTGST' ? 'selected' : ''}>UTGST</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Tax Slab Display Name <span style="color: var(--color-danger)">*</span></label>
          <input type="text" id="edit-tax-name" class="form-control" value="${entry.name}" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 6px;">
          <div>
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 4px;">Total Rate (%)</label>
            <input 
              type="number" 
              id="edit-tax-rate" 
              class="form-control" 
              value="${entry.rate}" 
              ${hasTransactions ? 'readonly style="opacity: 0.7; font-family: var(--font-mono); font-weight: 700; color: #34d399;"' : 'required min="0" max="100" step="0.01" style="font-family: var(--font-mono); font-weight: 700; color: #34d399;" oninput="window.TaxMasterModule.onTotalRateChange(\'edit\')"' }
            />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 4px;">CGST Rate (%)</label>
            <input type="number" id="edit-cgst-rate" class="form-control" value="${entry.cgst_rate}" ${hasTransactions ? 'readonly style="opacity: 0.7; font-family: var(--font-mono);"' : 'min="0" max="100" step="0.01" style="font-family: var(--font-mono);"'} />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 4px;">SGST Rate (%)</label>
            <input type="number" id="edit-sgst-rate" class="form-control" value="${entry.sgst_rate}" ${hasTransactions ? 'readonly style="opacity: 0.7; font-family: var(--font-mono);"' : 'min="0" max="100" step="0.01" style="font-family: var(--font-mono);"'} />
          </div>
          <div>
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 4px;">IGST Rate (%)</label>
            <input type="number" id="edit-igst-rate" class="form-control" value="${entry.igst_rate}" ${hasTransactions ? 'readonly style="opacity: 0.7; font-family: var(--font-mono); color: var(--primary-300);"' : 'min="0" max="100" step="0.01" style="font-family: var(--font-mono); color: var(--primary-300); font-weight: 600;"'} />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Effective From <span style="color: var(--color-danger)">*</span></label>
            <input type="date" id="edit-tax-effective-from" class="form-control" value="${entry.effective_from || ''}" required />
          </div>
          <div>
            <label class="form-label">Effective To</label>
            <input type="date" id="edit-tax-effective-to" class="form-control" value="${entry.effective_to || ''}" />
          </div>
        </div>

        <div>
          <label class="form-label">Applicable Transactions Scope</label>
          <select id="edit-tax-applicability" class="form-control">
            <option value="All Transactions" ${entry.applicable_transactions === 'All Transactions' ? 'selected' : ''}>All Transactions (Parts, Labor, Billing)</option>
            <option value="Spare Parts & Materials" ${entry.applicable_transactions === 'Spare Parts & Materials' ? 'selected' : ''}>Spare Parts, Consumables & Materials</option>
            <option value="Workshop Labor & Services" ${entry.applicable_transactions === 'Workshop Labor & Services' ? 'selected' : ''}>Workshop Labor & Job Card Services</option>
            <option value="Counter Sales" ${entry.applicable_transactions === 'Counter Sales' ? 'selected' : ''}>Over-the-Counter Sales</option>
            <option value="Inter-Facility Transfers" ${entry.applicable_transactions === 'Inter-Facility Transfers' ? 'selected' : ''}>Inter-Facility Stock Transfers</option>
          </select>
        </div>

        <div>
          <label class="form-label">Description / Statutory Remarks</label>
          <textarea id="edit-tax-desc" class="form-control" rows="2">${entry.description || ''}</textarea>
        </div>

        <div>
          <label class="form-label">Status</label>
          <select id="edit-tax-status" class="form-control">
            <option value="Active" ${entry.status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${entry.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      </form>
    `;

    window.State.openModal(`Edit Tax Slab: ${entry.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('edit-tax-slab-form').requestSubmit()">Save Changes</button>
    `);
  },

  submitEdit(id) {
    const entry = window.DB.getById('taxes', id);
    if (!entry) return;

    if (entry.system_default) {
      window.State.showToast('System-defined GST records cannot be edited.', 'error');
      return;
    }

    const hasTransactions = (entry.transaction_count || 0) > 0;
    const name = document.getElementById('edit-tax-name').value.trim();
    const effFrom = document.getElementById('edit-tax-effective-from').value;
    const effTo = document.getElementById('edit-tax-effective-to').value;
    const applicability = document.getElementById('edit-tax-applicability').value;
    const desc = document.getElementById('edit-tax-desc').value.trim();
    const status = document.getElementById('edit-tax-status').value;

    if (!name || !effFrom) {
      window.State.showToast('Tax Name and Effective From are required.', 'error');
      return;
    }

    if (effTo && effTo < effFrom) {
      window.State.showToast('Effective To cannot be earlier than Effective From.', 'error');
      return;
    }

    const updates = {
      name,
      effective_from: effFrom,
      effective_to: effTo || '',
      applicable_transactions: applicability,
      description: desc,
      status
    };

    if (!hasTransactions) {
      const code = document.getElementById('edit-tax-code').value.trim().toUpperCase();
      const type = document.getElementById('edit-tax-type').value;
      const rate = parseFloat(document.getElementById('edit-tax-rate').value);
      const cgst = parseFloat(document.getElementById('edit-cgst-rate').value) || 0;
      const sgst = parseFloat(document.getElementById('edit-sgst-rate').value) || 0;
      const igst = parseFloat(document.getElementById('edit-igst-rate').value) || 0;

      if (!code || isNaN(rate) || rate < 0) {
        window.State.showToast('Please provide valid Tax Code and positive Tax Rate.', 'error');
        return;
      }

      if (type === 'GST') {
        const sum = Math.round((cgst + sgst) * 100) / 100;
        if (Math.abs(sum - rate) > 0.01) {
          window.State.showToast(`CGST (${cgst}%) + SGST (${sgst}%) must equal Total Rate (${rate}%).`, 'error');
          return;
        }
        if (Math.abs(igst - rate) > 0.01) {
          window.State.showToast(`IGST (${igst}%) must equal Total Rate (${rate}%).`, 'error');
          return;
        }
      }

      updates.code = code;
      updates.type = type;
      updates.rate = rate;
      updates.cgst_rate = cgst;
      updates.sgst_rate = sgst;
      updates.igst_rate = igst;
    }

    window.DB.update('taxes', id, updates);
    window.DB.logAudit('TAX_SLAB_UPDATED', 'TAX_MASTER', id, `Updated tax slab: ${name} (${entry.code})`);
    window.State.showToast(`Tax slab "${name}" updated successfully.`, 'success');
    window.State.closeModal();
    this.render();
  },

  // ==========================================================================
  // VIEW MODAL (ADDRESS MASTER STYLE)
  // ==========================================================================
  showViewModal(id) {
    const entry = window.DB.getById('taxes', id);
    if (!entry) return;
    const isSystem = entry.system_default === true;
    const isActive = entry.status === 'Active';

    // Sample computation on Rs 1,000 base
    const baseAmount = 1000;
    const cgstAmt = Math.round((baseAmount * (entry.cgst_rate / 100)) * 100) / 100;
    const sgstAmt = Math.round((baseAmount * (entry.sgst_rate / 100)) * 100) / 100;
    const igstAmt = Math.round((baseAmount * (entry.igst_rate / 100)) * 100) / 100;
    const intraTotal = baseAmount + cgstAmt + sgstAmt;
    const interTotal = baseAmount + igstAmt;

    const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Banner Header matching Address Master -->
        <div style="background: rgba(96, 165, 250, 0.08); border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="font-size: 18px; font-weight: 700; color: #60a5fa;">${entry.name} (${entry.code})</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
              Tax Type: <strong>${entry.type}</strong> &bull; Total Rate: <strong style="color: #34d399;">${entry.rate}%</strong> &bull; ID: ${entry.id}
            </div>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            ${isSystem ? `
              <span class="badge badge-primary" style="font-size: 11px; padding: 3px 8px;">🔒 System Default</span>
            ` : `
              <span class="badge badge-subtle" style="font-size: 11px; padding: 3px 8px;">User Defined</span>
            `}
            <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}">
              ${isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>

        <!-- GST Rate Breakdown Cards -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- Intra-State Breakdown -->
          <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px;">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--primary-300); font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">
              Intra-State Supply (Within State)
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px dashed var(--border-subtle);">
              <span>CGST (Central Tax):</span>
              <strong style="color: var(--text-primary);">${entry.cgst_rate}%</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px dashed var(--border-subtle);">
              <span>SGST / UTGST (State Tax):</span>
              <strong style="color: var(--text-primary);">${entry.sgst_rate}%</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13.5px; padding: 6px 0 0 0; font-weight: 700; color: #34d399;">
              <span>Total Intra-State Tax:</span>
              <span>${entry.cgst_rate + entry.sgst_rate}%</span>
            </div>
          </div>

          <!-- Inter-State Breakdown -->
          <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #a78bfa; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">
              Inter-State Supply (Outside State)
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px dashed var(--border-subtle);">
              <span>IGST (Integrated Tax):</span>
              <strong style="color: var(--text-primary);">${entry.igst_rate}%</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px dashed var(--border-subtle);">
              <span>Export / SEZ Supply:</span>
              <strong style="color: var(--text-primary);">${entry.rate === 0 ? '0% (Exempt)' : `${entry.igst_rate}%`}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13.5px; padding: 6px 0 0 0; font-weight: 700; color: #34d399;">
              <span>Total Inter-State Tax:</span>
              <span>${entry.igst_rate}%</span>
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px;">
          <div><b>Effective Period:</b> ${entry.effective_from || '01-Jul-2017'} ${entry.effective_to ? `to ${entry.effective_to}` : '(Indefinite)'}</div>
          <div><b>Transaction Scope:</b> ${entry.applicable_transactions || 'All Transactions'}</div>
          <div><b>Historical Usage:</b> ${entry.transaction_count || 0} recorded transactions</div>
          <div><b>Statutory Status:</b> ${isSystem ? 'Permanent System Lock' : 'Configurable'}</div>
        </div>

        <!-- Simulation Box for Sample ₹1,000 Base -->
        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px 14px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
            Standard Invoice Simulation (Base Taxable Value: ₹1,000.00)
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px;">
            <div>
              <span style="color: var(--text-secondary);">Intra-State (Local Customer):</span><br/>
              ₹1,000 + CGST (₹${cgstAmt.toFixed(2)}) + SGST (₹${sgstAmt.toFixed(2)}) = <strong style="color: #60a5fa;">₹${intraTotal.toFixed(2)}</strong>
            </div>
            <div>
              <span style="color: var(--text-secondary);">Inter-State (Out-of-State / IGST):</span><br/>
              ₹1,000 + IGST (₹${igstAmt.toFixed(2)}) = <strong style="color: #60a5fa;">₹${interTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div>
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px;">Description & Usage Guidelines</div>
          <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 4px; border: 1px solid var(--border-subtle);">
            ${entry.description || 'Standard GST rate as per statutory notification.'}
          </div>
        </div>
      </div>
    `;

    window.State.openModal(`Tax Slab Details: ${entry.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      ${!isSystem ? `
        <button class="btn btn-primary" onclick="window.State.closeModal(); window.TaxMasterModule.showEditModal('${id}')">Edit Slab</button>
      ` : ''}
    `);
  },

  toggleStatus(id) {
    const entry = window.DB.getById('taxes', id);
    if (!entry) return false;

    if (entry.system_default) {
      window.State.showToast('System-defined GST records cannot be deactivated (BR-TAX-005).', 'error');
      return false;
    }

    const nextStatus = entry.status === 'Active' ? 'Inactive' : 'Active';
    window.DB.update('taxes', id, { status: nextStatus });
    window.DB.logAudit('TAX_SLAB_STATUS_TOGGLE', 'TAX_MASTER', id, `Toggled tax slab ${entry.name} to ${nextStatus}`);
    window.State.showToast(`Tax slab "${entry.name}" is now ${nextStatus}.`, nextStatus === 'Active' ? 'success' : 'warning');
    this.refreshTable();
    return true;
  },

  deleteEntry(id) {
    const entry = window.DB.getById('taxes', id);
    if (!entry) return false;

    if (entry.system_default) {
      window.State.showToast('System-defined GST records cannot be deleted (BR-TAX-004).', 'error');
      return false;
    }

    if ((entry.transaction_count || 0) > 0) {
      window.State.showToast(`Cannot delete tax slab "${entry.name}" with transaction history (BR-TAX-012). Deactivation is permitted.`, 'error');
      return false;
    }

    const doConfirm = typeof confirm !== 'undefined' ? confirm(`Are you sure you want to delete custom tax slab "${entry.name}" (${entry.code})?`) : true;
    if (doConfirm) {
      window.DB.delete('taxes', id);
      window.DB.logAudit('TAX_SLAB_DELETED', 'TAX_MASTER', id, `Deleted custom tax slab ${entry.name} (${entry.code})`);
      window.State.showToast(`Tax slab "${entry.name}" deleted successfully.`, 'success');
      this.render();
      return true;
    }
    return false;
  },

  deleteTax(id) {
    return this.deleteEntry(id);
  },

  // Statutory Calculation Engine conforming to BRD Sections 19, 20, 21
  calculateTax({ amount = 0, tax_rate = 0, calculation_mode = 'EXCLUSIVE', transaction_type = 'INTRA', facility_id = null } = {}) {
    const inputVal = parseFloat(amount) || 0;
    let rate = parseFloat(tax_rate) || 0;
    if (facility_id && window.DB && typeof window.DB.isFacilityGstApplicable === 'function' && !window.DB.isFacilityGstApplicable(facility_id)) {
      rate = 0;
    }
    const isInclusive = calculation_mode === 'INCLUSIVE';
    const isInterState = transaction_type === 'INTER';

    let baseAmount = 0;
    let totalTax = 0;
    let cgstAmt = 0;
    let sgstAmt = 0;
    let igstAmt = 0;
    let invoiceTotal = 0;

    if (isInclusive) {
      // Base = Input / (1 + Rate / 100)
      baseAmount = Math.round((inputVal / (1 + (rate / 100))) * 100) / 100;
      totalTax = Math.round((inputVal - baseAmount) * 100) / 100;
      invoiceTotal = inputVal;
    } else {
      // Base = Input, Tax = Base * Rate / 100
      baseAmount = inputVal;
      totalTax = Math.round((baseAmount * (rate / 100)) * 100) / 100;
      invoiceTotal = Math.round((baseAmount + totalTax) * 100) / 100;
    }

    if (isInterState) {
      igstAmt = totalTax;
      cgstAmt = 0;
      sgstAmt = 0;
    } else {
      cgstAmt = Math.round((totalTax / 2) * 100) / 100;
      sgstAmt = Math.round((totalTax - cgstAmt) * 100) / 100;
      igstAmt = 0;
    }

    return {
      base_amount: baseAmount,
      total_tax: totalTax,
      cgst_amount: cgstAmt,
      sgst_amount: sgstAmt,
      igst_amount: igstAmt,
      invoice_total: invoiceTotal,
      calculation_mode,
      transaction_type
    };
  },

  // ==========================================================================
  // INTERACTIVE GST TAX CALCULATOR HUB (BRD Sections 19, 20, 21)
  // ==========================================================================
  showCalculatorModal() {
    const all = (window.DB.getAll('taxes') || []).filter(t => t.status === 'Active');

    const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: rgba(99, 102, 241, 0.08); border-left: 4px solid var(--primary-500); padding: 10px 14px; border-radius: 4px; font-size: 12px; color: var(--text-secondary); line-height: 1.45;">
          Test and verify statutory tax calculations for <strong>Spare Parts, Workshop Labor, and Billing Invoices</strong> according to BRD Sections 19-21.
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-size: 12px;">Select Tax Slab</label>
            <select id="calc-tax-select" class="form-control" onchange="window.TaxMasterModule.recalculateInteractive()" style="font-weight: 600;">
              ${all.map(t => `
                <option value="${t.id}" ${t.rate === 18 ? 'selected' : ''}>
                  ${t.name} (${t.rate}%) ${t.system_default ? '[System]' : '[Custom]'}
                </option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 12px;">Enter Transaction Amount (₹)</label>
            <input 
              type="number" 
              id="calc-input-amount" 
              class="form-control" 
              value="1000" 
              min="0" 
              step="0.01" 
              oninput="window.TaxMasterModule.recalculateInteractive()" 
              style="font-family: var(--font-mono); font-weight: 700; color: #38bdf8;" 
            />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label" style="font-size: 12px;">Pricing Calculation Method</label>
            <select id="calc-mode-select" class="form-control" onchange="window.TaxMasterModule.recalculateInteractive()">
              <option value="EXCLUSIVE" selected>Tax Exclusive (Base Amount + Tax = Invoice Total)</option>
              <option value="INCLUSIVE">Tax Inclusive (MRP includes Tax = Back-calculate Base)</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 12px;">Transaction Jurisdiction</label>
            <select id="calc-supply-select" class="form-control" onchange="window.TaxMasterModule.recalculateInteractive()">
              <option value="INTRA" selected>Intra-State Supply (CGST + SGST)</option>
              <option value="INTER">Inter-State Supply (IGST)</option>
            </select>
          </div>
        </div>

        <!-- Dynamic Calculation Result Panel -->
        <div id="calc-results-panel" style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px;">
          <!-- Dynamically populated by recalculateInteractive() -->
        </div>
      </div>
    `;

    window.State.openModal('GST Tax Calculation Simulator', content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
    `);

    setTimeout(() => {
      this.recalculateInteractive();
    }, 50);
  },

  recalculateInteractive() {
    const taxSelect = document.getElementById('calc-tax-select');
    const amountInput = document.getElementById('calc-input-amount');
    const modeSelect = document.getElementById('calc-mode-select');
    const supplySelect = document.getElementById('calc-supply-select');
    const panel = document.getElementById('calc-results-panel');

    if (!taxSelect || !amountInput || !modeSelect || !supplySelect || !panel) return;

    const taxId = taxSelect.value;
    const tax = window.DB.getById('taxes', taxId);
    if (!tax) return;

    const inputVal = parseFloat(amountInput.value) || 0;
    const isInclusive = modeSelect.value === 'INCLUSIVE';
    const isInterState = supplySelect.value === 'INTER';

    const result = this.calculateTax({
      amount: inputVal,
      tax_rate: tax.rate,
      calculation_mode: isInclusive ? 'INCLUSIVE' : 'EXCLUSIVE',
      transaction_type: isInterState ? 'INTER' : 'INTRA'
    });

    const { base_amount, total_tax, cgst_amount, sgst_amount, igst_amount, invoice_total } = result;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; margin-bottom: 10px;">
        <span style="font-size: 12.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Statutory Tax Computation</span>
        <span class="badge ${isInclusive ? 'badge-subtle' : 'badge-primary'}" style="font-size: 11px;">
          ${isInclusive ? 'Tax Inclusive (MRP)' : 'Tax Exclusive'}
        </span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-secondary);">Taxable Base Value:</span>
          <strong style="font-family: var(--font-mono); font-size: 14px; color: var(--text-primary);">₹${baseAmount.toFixed(2)}</strong>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-secondary);">Applicable GST Slab:</span>
          <span style="font-family: var(--font-mono); font-weight: 600; color: #34d399;">${tax.name} (${rate}%)</span>
        </div>

        ${!isInterState ? `
          <div style="display: flex; justify-content: space-between; padding-left: 12px; border-left: 2px solid var(--primary-500);">
            <span style="color: var(--text-secondary);">CGST (${tax.cgst_rate}%):</span>
            <span style="font-family: var(--font-mono); font-weight: 600; color: #93c5fd;">₹${cgstAmt.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-left: 12px; border-left: 2px solid var(--primary-500);">
            <span style="color: var(--text-secondary);">SGST / UTGST (${tax.sgst_rate}%):</span>
            <span style="font-family: var(--font-mono); font-weight: 600; color: #93c5fd;">₹${sgstAmt.toFixed(2)}</span>
          </div>
        ` : `
          <div style="display: flex; justify-content: space-between; padding-left: 12px; border-left: 2px solid #a78bfa;">
            <span style="color: var(--text-secondary);">IGST Integrated Tax (${tax.igst_rate}%):</span>
            <span style="font-family: var(--font-mono); font-weight: 600; color: #c4b5fd;">₹${igstAmt.toFixed(2)}</span>
          </div>
        `}

        <div style="display: flex; justify-content: space-between; padding-top: 4px; border-top: 1px dashed var(--border-subtle);">
          <span style="color: var(--text-secondary);">Total GST Component:</span>
          <strong style="font-family: var(--font-mono); color: #34d399;">₹${totalTax.toFixed(2)}</strong>
        </div>

        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--border-subtle); font-size: 15px; margin-top: 4px;">
          <span style="font-weight: 700; color: var(--text-primary);">Total Final Invoice Payable:</span>
          <strong style="font-family: var(--font-mono); font-size: 16px; color: #60a5fa;">₹${invoiceTotal.toFixed(2)}</strong>
        </div>
      </div>
    `;
  },

  exportCsv() {
    const list = this.getFilteredEntries();
    let csv = 'TaxCode,TaxName,TaxType,TotalGSTRate,CGSTRate,SGSTRate,IGSTRate,SystemDefault,Status,EffectiveFrom,EffectiveTo,Applicability,Description,TransactionCount\n';
    list.forEach(t => {
      csv += `"${t.code}","${(t.name || '').replace(/"/g, '""')}","${t.type || 'GST'}",${t.rate || 0},${t.cgst_rate || 0},${t.sgst_rate || 0},${t.igst_rate || 0},${t.system_default ? 'Yes' : 'No'},"${t.status}","${t.effective_from || ''}","${t.effective_to || ''}","${(t.applicable_transactions || '').replace(/"/g, '""')}","${(t.description || '').replace(/"/g, '""')}",${t.transaction_count || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tax_master_slabs.csv';
    link.click();
    window.State.showToast(`Exported ${list.length} tax slab records to CSV.`, 'success');
  },

  // Centralized Tax Master Accessors
  getActiveTaxes() {
    return (window.DB && typeof window.DB.getActiveTaxes === 'function')
      ? window.DB.getActiveTaxes()
      : ((window.DB && window.DB.getAll('taxes')) || []).filter(t => t.status === 'Active');
  },

  getDefaultTax() {
    return (window.DB && typeof window.DB.getDefaultTax === 'function')
      ? window.DB.getDefaultTax()
      : (this.getActiveTaxes().find(t => Number(t.rate) === 0 || t.code === 'GST0') || this.getActiveTaxes().find(t => t.system_default) || this.getActiveTaxes()[0] || { rate: 0, cgst_rate: 0, sgst_rate: 0, igst_rate: 0, name: 'GST 0%' });
  },

  getTaxByRate(rate) {
    return (window.DB && typeof window.DB.getTaxByRate === 'function')
      ? window.DB.getTaxByRate(rate)
      : { rate: parseFloat(rate) || 0, cgst_rate: (parseFloat(rate) || 0) / 2, sgst_rate: (parseFloat(rate) || 0) / 2, igst_rate: parseFloat(rate) || 0 };
  },

  renderTaxSelectOptions(selectedRateOrId, includeBlank = false, blankText = '-- Select Tax Slab --') {
    return (window.DB && typeof window.DB.renderTaxSelectOptions === 'function')
      ? window.DB.renderTaxSelectOptions(selectedRateOrId, includeBlank, blankText)
      : '';
  }
};
