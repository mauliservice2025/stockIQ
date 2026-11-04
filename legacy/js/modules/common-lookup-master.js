/* ==========================================================================
   ENTERPRISE ISCM - COMMON MASTER MODULE (LOOKUP CATALOGUES)
   Universal Lookup Masters:
   1) Title
   2) Gender
   3) Referral Source
   4) Discount Reason
   5) Concession Reason
   6) Cancellation Reason
   7) Relationship
   8) Marital Status
   9) Write-off Reason
   10) Transfer Reason
   ========================================================================== */

window.CommonLookupMasterModule = {
  typeFilter: 'ALL',
  searchTerm: '',
  statusFilter: 'ALL',
  currentPage: 1,
  pageSize: 10,

  masterTypes: [
    { key: 'TITLE', label: 'Title', icon: '', desc: 'Formal salutations and titles' },
    { key: 'GENDER', label: 'Gender', icon: '', desc: 'Gender classifications' },
    { key: 'REFERRAL_SOURCE', label: 'Referral Source', icon: '', desc: 'Customer acquisition channels' },
    { key: 'DISCOUNT_REASON', label: 'Discount Reason', icon: '', desc: 'Commercial discount justifications' },
    { key: 'CONCESSION_REASON', label: 'Concession Reason', icon: '', desc: 'Policy concessions & welfare benefits' },
    { key: 'CANCELLATION_REASON', label: 'Cancellation Reason', icon: '', desc: 'Audit reasons for cancellations' },
    { key: 'RELATIONSHIP', label: 'Relationship', icon: '', desc: 'Family and representative relations' },
    { key: 'MARITAL_STATUS', label: 'Marital Status', icon: '', desc: 'Marital status classifications' },
    { key: 'WRITE_OFF_REASON', label: 'Write-off Reason', icon: '', desc: 'Inventory and receivable write-offs' },
    { key: 'TRANSFER_REASON', label: 'Transfer Reason', icon: '', desc: 'Inter-facility stock transfer reasons' }
  ],

  getTypeMeta(key) {
    return this.masterTypes.find(t => t.key === key) || { key, label: key, icon: '', desc: '' };
  },

  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    // Ensure page top bar is hidden so tabs sit on top matching Address Master
    const pageTopBar = (typeof document !== 'undefined' && document.getElementById) 
      ? (document.getElementById('page-top-bar') || (document.querySelector && document.querySelector('.page-top-bar'))) 
      : null;
    if (pageTopBar) pageTopBar.style.display = 'none';

    container.innerHTML = `
      <!-- Common Master Top Row: Title (Left) + Search, Filters & Actions (Right - relocated as per user screenshot) -->
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 4px; margin-bottom: 14px; flex-wrap: wrap;">
        <!-- Left: Page Title -->
        <h2 style="font-size: 20px; font-weight: 700; margin: 0; color: var(--text-primary); font-family: var(--font-sans, 'Inter', sans-serif);">
          Common Master
        </h2>

        <!-- Right: Filters & Action Buttons (Moved into top line as requested in user screenshot) -->
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <!-- Type Dropdown -->
          <select 
            id="common-lookup-type-select"
            class="form-control form-control-sm" 
            onchange="window.CommonLookupMasterModule.setTypeFilter(this.value)" 
            style="width: 165px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.typeFilter === 'ALL' ? 'selected' : ''}>All Types</option>
            ${this.masterTypes.map(t => `
              <option value="${t.key}" ${this.typeFilter === t.key ? 'selected' : ''}>
                ${t.label}
              </option>
            `).join('')}
          </select>

          <!-- Search input -->
          <div style="position: relative; display: inline-flex; align-items: center;">
            <input 
              type="text" 
              id="common-lookup-search-input"
              class="form-control form-control-sm" 
              placeholder="Search code, name, description..." 
              value="${this.searchTerm}" 
              oninput="window.CommonLookupMasterModule.setSearch(this.value)" 
              style="width: 240px; height: 32px; font-size: 13px; padding-right: 24px;" 
            />
            <button 
              id="common-lookup-search-clear" 
              type="button" 
              onclick="window.CommonLookupMasterModule.clearSearch()" 
              style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: ${this.searchTerm ? 'block' : 'none'}; font-size: 14px;"
            >&times;</button>
          </div>

          <!-- Status filter -->
          <select class="form-control form-control-sm" onchange="window.CommonLookupMasterModule.setStatusFilter(this.value)" style="width: 120px; height: 32px; font-size: 13px;">
            <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
            <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>● Active</option>
            <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>○ Inactive</option>
          </select>

          <!-- Actions -->
          <button class="btn btn-secondary btn-sm" onclick="window.CommonLookupMasterModule.exportCsv()" title="Export CSV" style="height: 32px; font-size: 13px;">
            <span>Export CSV</span>
          </button>
          <button id="common-lookup-add-btn" class="btn btn-primary btn-sm" onclick="window.CommonLookupMasterModule.showAddModal()" style="height: 32px; font-size: 13px;">
            <span>+ Add ${this.typeFilter !== 'ALL' ? this.getTypeMeta(this.typeFilter).label : 'Common Master'}</span>
          </button>
        </div>
      </div>

      <!-- Line 2: Address Master Style Tabs Navigation -->
      <div class="tabs-header" style="display: flex; gap: 2px; overflow-x: auto; margin-bottom: 16px; padding-bottom: 0; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: 2px; margin-bottom: -1px;">
          <button class="tab-btn ${this.typeFilter === 'ALL' ? 'active' : ''}" onclick="window.CommonLookupMasterModule.setTypeFilter('ALL')">
            <span>All Masters</span>
          </button>
          ${this.masterTypes.map(t => `
            <button class="tab-btn ${this.typeFilter === t.key ? 'active' : ''}" onclick="window.CommonLookupMasterModule.setTypeFilter('${t.key}')" title="${t.desc}">
              <span>${t.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Line 3: Table Content -->
      <div id="common-lookup-table-content">
        ${this.renderTableContent()}
      </div>
    `;
  },

  setTypeFilter(val) {
    this.typeFilter = val;
    this.currentPage = 1;
    this.render();
  },

  setSearch(val) {
    this.searchTerm = val;
    this.currentPage = 1;
    const clearBtn = document.getElementById('common-lookup-search-clear');
    if (clearBtn && clearBtn.style) {
      clearBtn.style.display = val ? 'block' : 'none';
    }
    this.refreshTable();
  },

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    const input = document.getElementById('common-lookup-search-input');
    if (input) input.value = '';
    const clearBtn = document.getElementById('common-lookup-search-clear');
    if (clearBtn && clearBtn.style) clearBtn.style.display = 'none';
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
    const el = document.getElementById('common-lookup-table-content');
    if (el) {
      el.innerHTML = this.renderTableContent();
    } else {
      this.render();
    }
  },

  getFilteredEntries() {
    let list = window.DB.getAll('common_masters') || [];

    if (this.typeFilter !== 'ALL') {
      list = list.filter(e => e.type === this.typeFilter);
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter(e => e.status === this.statusFilter);
    }

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      list = list.filter(e => 
        (e.code && e.code.toLowerCase().includes(q)) ||
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.type_label && e.type_label.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // Sort by type then sort_order then name
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0);
      return (a.name || '').localeCompare(b.name || '');
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
      ${this.typeFilter === 'TITLE' ? `
        <div style="margin-bottom: 12px; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.28); border-left: 4px solid var(--primary-500); border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 280px;">
            <div style="font-size: 13.5px; font-weight: 700; color: var(--primary-300); display: flex; align-items: center; gap: 8px;">
              <span>Title Master & Gender Master Interlinkage</span>
              <span class="badge badge-primary" style="font-size: 10px; padding: 2px 7px;">Active Interlink Rule</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px; line-height: 1.45;">
              Titles are directly interlinked with Gender Master. For example, <strong>Mr.</strong> is fixed as <strong>Male</strong>, while <strong>Mrs.</strong>, <strong>Ms.</strong>, and <strong>Smt.</strong> are fixed as <strong>Female</strong>. Professional titles (Dr., Prof., Adv.) allow flexible gender assignment.
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-subtle); padding: 6px 12px; border-radius: 6px;">
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin: 0; white-space: nowrap;">Test Interlink:</label>
            <select class="form-control form-control-sm" style="width: 130px; height: 30px; font-size: 12px; font-weight: 600;" onchange="window.CommonLookupMasterModule.testTitleGenderInterlink(this.value)">
              <option value="">Choose Title...</option>
              ${filtered.filter(e => e.type === 'TITLE').map(t => `<option value="${t.code}">${t.name} (${t.code})</option>`).join('')}
            </select>
            <div id="common-lookup-interlink-feedback" style="font-size: 12px; font-weight: 600; color: #10b981; white-space: nowrap; min-width: 140px;">
              Select title to test
            </div>
          </div>
        </div>
      ` : ''}

      <div class="content-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 140px;">Entry Code</th>
                <th style="width: 190px;">Master Type</th>
                <th>Name / Label</th>
                <th>Description / Usage Remarks</th>
                <th class="text-center" style="width: 90px;">Order</th>
                <th style="width: 110px;">Status</th>
                <th class="text-right" style="width: 140px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${paged.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <div style="font-weight: 600; font-size: 14px;">No Master Entries Found</div>
                    <div style="font-size: 12px; margin-top: 4px;">Click "+ Add Common Master" to create a new entry for this type.</div>
                  </td>
                </tr>
              ` : paged.map(item => {
                const meta = this.getTypeMeta(item.type);
                const isActive = item.status === 'Active';
                return `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="color: #60a5fa; font-size: 13px;">${item.code}</div>
                      <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">${item.id}</div>
                    </td>
                    <td>
                      <span class="badge badge-subtle" style="font-weight: 500; font-size: 12px;">
                        ${meta.label}
                      </span>
                    </td>
                    <td>
                      <div class="cell-strong" style="font-size: 13px;">${item.name}</div>
                      ${item.type === 'TITLE' ? `
                        <div style="margin-top: 3px; display: inline-flex; align-items: center; gap: 4px;">
                          <span class="badge ${item.is_gender_fixed ? 'badge-primary' : 'badge-subtle'}" style="font-size: 10.5px; padding: 1px 6px;">
                            Gender: <strong>${item.linked_gender_name || 'Any'}</strong> ${item.is_gender_fixed ? '(Fixed)' : '(Flexible)'}
                          </span>
                        </div>
                      ` : ''}
                      ${item.type === 'GENDER' ? `
                        <div style="margin-top: 2px; font-size: 11px; color: var(--text-muted);">
                          ${(() => {
                            const linked = (window.DB.getAll('common_masters') || []).filter(t => t.type === 'TITLE' && t.linked_gender_code === item.code);
                            return linked.length > 0 ? `Linked Titles: <strong style="color: var(--primary-300);">${linked.map(t => t.name).join(', ')}</strong>` : '';
                          })()}
                        </div>
                      ` : ''}
                    </td>
                    <td>
                      <div style="font-size: 13px; color: var(--text-secondary); max-width: 380px;">${item.description || '-'}</div>
                    </td>
                    <td class="text-center">
                      <span class="badge badge-subtle" style="font-family: var(--font-mono); font-weight: 600; font-size: 12px;">${item.sort_order || 0}</span>
                    </td>
                    <td>
                      <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}">
                        ${isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: flex; justify-content: flex-end; gap: 4px;">
                        <button class="btn btn-icon btn-sm" title="View Entry Details" onclick="window.CommonLookupMasterModule.showViewModal('${item.id}')">
                          ${window.AppIcons ? window.AppIcons.svgView : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Edit Entry" onclick="window.CommonLookupMasterModule.showEditModal('${item.id}')">
                          ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate' : 'Activate'}" onclick="window.CommonLookupMasterModule.toggleStatus('${item.id}')">
                          ${window.AppIcons ? window.AppIcons.svgLock(isActive) : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}
                        </button>
                        <button class="btn btn-icon btn-sm" title="Remove Entry" onclick="window.CommonLookupMasterModule.deleteEntry('${item.id}')">
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
            <select class="form-control form-control-sm" onchange="window.CommonLookupMasterModule.setPageSize(this.value)" style="height: 28px; font-size: 13px; padding: 1px 6px; width: 70px; border-radius: 4px; font-weight: 500;">
              <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10</option>
              <option value="25" ${this.pageSize === 25 ? 'selected' : ''}>25</option>
              <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100</option>
            </select>
            <span style="font-size: 13px; font-weight: 400;">entries</span>
          </div>

          <div class="pagination-buttons" style="display: flex; gap: 4px; align-items: center;">
            <button class="btn btn-secondary btn-xs" ${this.currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"'} onclick="window.CommonLookupMasterModule.goToPage(1)" title="First Page">⏮</button>
            <button class="btn btn-secondary btn-xs" ${this.currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"'} onclick="window.CommonLookupMasterModule.goToPage(${this.currentPage - 1})" title="Previous Page">◀ Prev</button>
            ${this.renderPaginationPills(this.currentPage, totalPages)}
            <button class="btn btn-secondary btn-xs" ${this.currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"'} onclick="window.CommonLookupMasterModule.goToPage(${this.currentPage + 1})" title="Next Page">Next ▶</button>
            <button class="btn btn-secondary btn-xs" ${this.currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"'} onclick="window.CommonLookupMasterModule.goToPage(${totalPages})" title="Last Page">⏭</button>
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
      pills.push(`<button class="btn btn-secondary btn-xs" onclick="window.CommonLookupMasterModule.goToPage(1)" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 500;">1</button>`);
      if (startPage > 2) {
        pills.push(`<span style="padding: 0 3px; color: var(--text-muted); line-height: 28px; font-size: 12px;">...</span>`);
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      const isActive = p === current;
      pills.push(`
        <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-xs" 
                onclick="window.CommonLookupMasterModule.goToPage(${p})" 
                style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: ${isActive ? '600' : '500'};">
          ${p}
        </button>
      `);
    }

    if (endPage < total) {
      if (endPage < total - 1) {
        pills.push(`<span style="padding: 0 3px; color: var(--text-muted); line-height: 28px; font-size: 12px;">...</span>`);
      }
      pills.push(`<button class="btn btn-secondary btn-xs" onclick="window.CommonLookupMasterModule.goToPage(${total})" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 500;">${total}</button>`);
    }

    return pills.join('');
  },

  // ==========================================================================
  // MODALS & CRUD OPERATIONS
  // ==========================================================================
  renderGenderLinkSection(selectedGenderCode = '', isFixed = false, prefix = 'cm-new', isVisible = true) {
    const genders = (window.DB.getAll('common_masters') || []).filter(e => e.type === 'GENDER' && e.status === 'Active');
    return `
      <div id="${prefix}-gender-link-section" style="${isVisible ? '' : 'display: none;'} background: rgba(99, 102, 241, 0.07); border: 1px solid rgba(99, 102, 241, 0.28); border-radius: var(--radius-md, 8px); padding: 12px 14px;">
        <div style="font-size: 12.5px; font-weight: 700; color: var(--primary-300, #93c5fd); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
          <span>Title ➔ Gender Master Interlinkage</span>
          <span class="badge badge-primary" style="font-size: 10px; padding: 1px 6px;">Interlink Rule</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center;">
          <div>
            <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">Linked Gender Master</label>
            <select id="${prefix}-linked-gender" class="form-control form-control-sm" style="font-weight: 600;">
              <option value="" ${!selectedGenderCode ? 'selected' : ''}>-- Flexible / Any Gender --</option>
              ${genders.length > 0 ? genders.map(g => `
                <option value="${g.code}" ${g.code === selectedGenderCode ? 'selected' : ''}>
                  ${g.name} (${g.code})
                </option>
              `).join('') : `
                <option value="MALE" ${selectedGenderCode === 'MALE' ? 'selected' : ''}>Male (MALE)</option>
                <option value="FEMALE" ${selectedGenderCode === 'FEMALE' ? 'selected' : ''}>Female (FEMALE)</option>
                <option value="OTHER" ${selectedGenderCode === 'OTHER' ? 'selected' : ''}>Other (OTHER)</option>
              `}
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">Constraint Rule</label>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
              <input type="checkbox" id="${prefix}-gender-fixed" ${isFixed ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary-500, #6366f1);" />
              <label for="${prefix}-gender-fixed" style="margin: 0; font-size: 12.5px; font-weight: 500; cursor: pointer; color: var(--text-primary);">
                Fixed Gender constraint (e.g. Mr. must be Male)
              </label>
            </div>
          </div>
        </div>
        <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 6px; line-height: 1.4;">
          When <strong>Fixed</strong> is checked, any profile or registration form selecting this Title will automatically lock Gender to the linked value.
        </div>
      </div>
    `;
  },

  onModalTypeChange(type, prefix) {
    const section = document.getElementById(`${prefix}-gender-link-section`);
    if (section) {
      section.style.display = type === 'TITLE' ? 'block' : 'none';
    }
  },

  onModalCodeOrNameInput(prefix) {
    const typeSelect = document.getElementById(`${prefix}-type`);
    if (!typeSelect || typeSelect.value !== 'TITLE') return;

    const codeInput = document.getElementById(`${prefix}-code`);
    const nameInput = document.getElementById(`${prefix}-name`);
    const genderSelect = document.getElementById(`${prefix}-linked-gender`);
    const fixedCheckbox = document.getElementById(`${prefix}-gender-fixed`);
    if (!genderSelect || !fixedCheckbox) return;

    const raw = `${codeInput ? codeInput.value : ''} ${nameInput ? nameInput.value : ''}`.toUpperCase().replace(/\./g, '');
    
    // Auto-detect male titles
    if (/\b(MR|SHRI|SHREE|MISTER|SIR)\b/.test(raw) || raw.startsWith('MR') || raw.startsWith('SHRI')) {
      genderSelect.value = 'MALE';
      fixedCheckbox.checked = true;
    } else if (/\b(MRS|MS|SMT|SHRIMATI|MADAM|MISS)\b/.test(raw) || raw.startsWith('MRS') || raw.startsWith('MS') || raw.startsWith('SMT')) {
      genderSelect.value = 'FEMALE';
      fixedCheckbox.checked = true;
    } else if (/\b(DR|PROF|ADV|DOCTOR|PROFESSOR|ADVOCATE)\b/.test(raw)) {
      genderSelect.value = '';
      fixedCheckbox.checked = false;
    }
  },

  testTitleGenderInterlink(titleCode) {
    const feedbackEl = document.getElementById('common-lookup-interlink-feedback');
    if (!feedbackEl) return;
    if (!titleCode) {
      feedbackEl.innerHTML = '<span style="color: var(--text-muted);">Select title to test</span>';
      return;
    }

    const mapping = window.DB.getTitleGenderMapping(titleCode);
    if (!mapping) {
      feedbackEl.innerHTML = '<span style="color: #ef4444;">No mapping found</span>';
      return;
    }

    if (mapping.isGenderFixed) {
      feedbackEl.innerHTML = `<span style="color: #10b981; font-weight: 700;">Fixed: ${mapping.linkedGenderName}</span>`;
    } else {
      feedbackEl.innerHTML = `<span style="color: #60a5fa; font-weight: 600;">Flexible: ${mapping.linkedGenderName || 'Any'}</span>`;
    }
  },

  getGenderForTitle(titleCodeOrName) {
    return window.DB.getTitleGenderMapping(titleCodeOrName);
  },

  getTitlesForGender(genderCodeOrName) {
    if (!genderCodeOrName) return [];
    const g = String(genderCodeOrName).trim().toUpperCase();
    const allTitles = (window.DB.getAll('common_masters') || []).filter(e => e.type === 'TITLE');
    return allTitles.filter(t => (t.linked_gender_code && t.linked_gender_code.toUpperCase() === g) || !t.linked_gender_code);
  },

  showAddModal() {
    const all = window.DB.getAll('common_masters') || [];
    const nextId = `CM-${String(all.length + 1).padStart(3, '0')}`;
    const selectedType = this.typeFilter !== 'ALL' ? this.typeFilter : 'TITLE';

    const content = `
      <form id="add-common-master-form" onsubmit="event.preventDefault(); window.CommonLookupMasterModule.submitCreate();" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Master Type <span style="color: var(--color-danger)">*</span></label>
            <select id="cm-new-type" class="form-control" required style="font-weight: 600;" onchange="window.CommonLookupMasterModule.onModalTypeChange(this.value, 'cm-new')">
              ${this.masterTypes.map(t => `
                <option value="${t.key}" ${t.key === selectedType ? 'selected' : ''}>
                  ${t.label}
                </option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Entry Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="cm-new-code" class="form-control" placeholder="e.g. MR, REF-WALK" required maxlength="15" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" oninput="window.CommonLookupMasterModule.onModalCodeOrNameInput('cm-new')" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Name / Display Label <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="cm-new-name" class="form-control" placeholder="e.g. Mr., Walk-in / Direct Visit" required oninput="window.CommonLookupMasterModule.onModalCodeOrNameInput('cm-new')" />
          </div>
          <div>
            <label class="form-label">Sort Order Sequence</label>
            <input type="number" id="cm-new-order" class="form-control" value="${all.length + 1}" min="1" max="999" />
          </div>
        </div>

        ${this.renderGenderLinkSection('', false, 'cm-new', selectedType === 'TITLE')}

        <div>
          <label class="form-label">Description / Usage Remarks</label>
          <textarea id="cm-new-desc" class="form-control" rows="2" placeholder="Briefly describe the business context or usage guidelines..."></textarea>
        </div>

        <div>
          <label class="form-label">Initial Status</label>
          <select id="cm-new-status" class="form-control">
            <option value="Active" selected>Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <input type="hidden" id="cm-new-id" value="${nextId}" />
      </form>
    `;

    const modalTitle = this.typeFilter !== 'ALL' ? `Add ${this.getTypeMeta(this.typeFilter).label}` : 'Add Common Master Entry';
    window.State.openModal(modalTitle, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('add-common-master-form').requestSubmit()">Save Entry</button>
    `);
  },

  submitCreate() {
    const id = document.getElementById('cm-new-id').value;
    const type = document.getElementById('cm-new-type').value;
    const code = document.getElementById('cm-new-code').value.trim().toUpperCase();
    const name = document.getElementById('cm-new-name').value.trim();
    const order = Number(document.getElementById('cm-new-order').value) || 1;
    const desc = document.getElementById('cm-new-desc').value.trim();
    const status = document.getElementById('cm-new-status').value;

    if (!code || !name) {
      window.State.showToast('Please enter both Code and Name.', 'error');
      return;
    }

    const all = window.DB.getAll('common_masters') || [];
    const dup = all.find(e => e.type === type && e.code.toUpperCase() === code);
    if (dup) {
      window.State.showToast(`Code "${code}" already exists for master type "${this.getTypeMeta(type).label}".`, 'error');
      return;
    }

    const meta = this.getTypeMeta(type);
    const newEntry = {
      id,
      type,
      type_label: meta.label,
      code,
      name,
      description: desc,
      sort_order: order,
      status
    };

    if (type === 'TITLE') {
      const linkedGenderSelect = document.getElementById('cm-new-linked-gender');
      const fixedCheckbox = document.getElementById('cm-new-gender-fixed');
      const genderCode = linkedGenderSelect ? linkedGenderSelect.value : '';
      let genderName = 'Any';
      if (genderCode) {
        const gObj = (window.DB.getAll('common_masters') || []).find(g => g.type === 'GENDER' && g.code === genderCode);
        genderName = gObj ? gObj.name : genderCode;
      }
      newEntry.linked_gender_code = genderCode;
      newEntry.linked_gender_name = genderCode ? genderName : 'Any';
      newEntry.is_gender_fixed = fixedCheckbox ? fixedCheckbox.checked : false;
    }

    window.DB.insert('common_masters', newEntry);
    window.DB.logAudit('COMMON_MASTER_CREATED', 'COMMON_MASTER', id, `Added entry ${name} (${code}) to ${meta.label}`);
    window.State.showToast(`Master entry "${name}" created successfully.`, 'success');
    window.State.closeModal();
    this.render();
  },

  showEditModal(id) {
    const entry = window.DB.getById('common_masters', id);
    if (!entry) return;

    const content = `
      <form id="edit-common-master-form" onsubmit="event.preventDefault(); window.CommonLookupMasterModule.submitEdit('${id}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Master Type <span style="color: var(--color-danger)">*</span></label>
            <select id="cm-edit-type" class="form-control" required style="font-weight: 600;" onchange="window.CommonLookupMasterModule.onModalTypeChange(this.value, 'cm-edit')">
              ${this.masterTypes.map(t => `
                <option value="${t.key}" ${t.key === entry.type ? 'selected' : ''}>
                  ${t.label}
                </option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Entry Code <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="cm-edit-code" class="form-control" value="${entry.code}" required maxlength="15" style="text-transform: uppercase; font-family: var(--font-mono); font-weight: 700;" oninput="window.CommonLookupMasterModule.onModalCodeOrNameInput('cm-edit')" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
          <div>
            <label class="form-label">Name / Display Label <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="cm-edit-name" class="form-control" value="${entry.name}" required oninput="window.CommonLookupMasterModule.onModalCodeOrNameInput('cm-edit')" />
          </div>
          <div>
            <label class="form-label">Sort Order Sequence</label>
            <input type="number" id="cm-edit-order" class="form-control" value="${entry.sort_order || 1}" min="1" max="999" />
          </div>
        </div>

        ${this.renderGenderLinkSection(entry.linked_gender_code || '', !!entry.is_gender_fixed, 'cm-edit', entry.type === 'TITLE')}

        <div>
          <label class="form-label">Description / Usage Remarks</label>
          <textarea id="cm-edit-desc" class="form-control" rows="2">${entry.description || ''}</textarea>
        </div>

        <div>
          <label class="form-label">Status</label>
          <select id="cm-edit-status" class="form-control">
            <option value="Active" ${entry.status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${entry.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      </form>
    `;

    window.State.openModal(`Edit ${entry.name} (${entry.code})`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('edit-common-master-form').requestSubmit()">Save Changes</button>
    `);
  },

  submitEdit(id) {
    const entry = window.DB.getById('common_masters', id);
    if (!entry) return;

    const type = document.getElementById('cm-edit-type').value;
    const code = document.getElementById('cm-edit-code').value.trim().toUpperCase();
    const name = document.getElementById('cm-edit-name').value.trim();
    const order = Number(document.getElementById('cm-edit-order').value) || 1;
    const desc = document.getElementById('cm-edit-desc').value.trim();
    const status = document.getElementById('cm-edit-status').value;

    if (!code || !name) {
      window.State.showToast('Please enter both Code and Name.', 'error');
      return;
    }

    const all = window.DB.getAll('common_masters') || [];
    const dup = all.find(e => e.id !== id && e.type === type && e.code.toUpperCase() === code);
    if (dup) {
      window.State.showToast(`Code "${code}" is already in use by another entry in this type.`, 'error');
      return;
    }

    const meta = this.getTypeMeta(type);
    const updates = {
      type,
      type_label: meta.label,
      code,
      name,
      description: desc,
      sort_order: order,
      status
    };

    if (type === 'TITLE') {
      const linkedGenderSelect = document.getElementById('cm-edit-linked-gender');
      const fixedCheckbox = document.getElementById('cm-edit-gender-fixed');
      const genderCode = linkedGenderSelect ? linkedGenderSelect.value : '';
      let genderName = 'Any';
      if (genderCode) {
        const gObj = (window.DB.getAll('common_masters') || []).find(g => g.type === 'GENDER' && g.code === genderCode);
        genderName = gObj ? gObj.name : genderCode;
      }
      updates.linked_gender_code = genderCode;
      updates.linked_gender_name = genderCode ? genderName : 'Any';
      updates.is_gender_fixed = fixedCheckbox ? fixedCheckbox.checked : false;
    }

    window.DB.update('common_masters', id, updates);

    window.DB.logAudit('COMMON_MASTER_UPDATED', 'COMMON_MASTER', id, `Updated entry ${name} (${code}) in ${meta.label}`);
    window.State.showToast(`Master entry "${name}" updated successfully.`, 'success');
    window.State.closeModal();
    this.render();
  },

  showViewModal(id) {
    const entry = window.DB.getById('common_masters', id);
    if (!entry) return;
    const meta = this.getTypeMeta(entry.type);
    const isActive = entry.status === 'Active';

    let interlinkHtml = '';
    if (entry.type === 'TITLE') {
      interlinkHtml = `
        <div style="background: rgba(99, 102, 241, 0.07); border-left: 4px solid #6366f1; border-radius: 4px; padding: 12px 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #818cf8; font-weight: 700; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: space-between;">
            <span>Interlinked Gender Master</span>
            <span class="badge ${entry.is_gender_fixed ? 'badge-primary' : 'badge-subtle'}" style="font-size: 10.5px;">
              ${entry.is_gender_fixed ? 'Fixed Constraint' : 'Flexible / Any'}
            </span>
          </div>
          <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-top: 6px;">
            ${entry.linked_gender_name || 'Neutral / Any Gender'} ${entry.linked_gender_code ? `(${entry.linked_gender_code})` : ''}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; line-height: 1.45;">
            ${entry.is_gender_fixed ? `Whenever title <strong>"${entry.name}"</strong> is selected, Gender is automatically locked to <strong>${entry.linked_gender_name}</strong>.` : `This title does not restrict gender and can be used with any gender.`}
          </div>
        </div>
      `;
    } else if (entry.type === 'GENDER') {
      const linked = (window.DB.getAll('common_masters') || []).filter(t => t.type === 'TITLE' && t.linked_gender_code === entry.code);
      interlinkHtml = `
        <div style="background: rgba(99, 102, 241, 0.07); border-left: 4px solid #6366f1; border-radius: 4px; padding: 12px 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #818cf8; font-weight: 700; letter-spacing: 0.5px;">
            Interlinked Title Masters
          </div>
          <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">
            ${linked.length > 0 ? linked.map(t => `<span class="badge badge-primary" style="font-size: 11.5px; padding: 3px 8px;">${t.name} (${t.code}) ${t.is_gender_fixed ? '🔒 Fixed' : ''}</span>`).join('') : '<span style="color: var(--text-muted); font-size: 12px;">No titles specifically bound to this gender.</span>'}
          </div>
        </div>
      `;
    }

    const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: rgba(96, 165, 250, 0.08); border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 18px; font-weight: 700; color: #60a5fa;">${entry.name} (${entry.code})</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Master Type: <strong>${meta.label}</strong> &bull; Sequence: ${entry.sort_order || 1}</div>
          </div>
          <div>
            <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}">
              ${isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px;">
          <div><b>Master Type:</b> ${meta.label}</div>
          <div><b>Sort Order:</b> ${entry.sort_order || 1}</div>
          <div><b>Status:</b> <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}">${isActive ? '● Active' : '○ Inactive'}</span></div>
          <div><b>Internal ID:</b> <span style="font-family: var(--font-mono); font-size: 11.5px;">${entry.id}</span></div>
        </div>

        ${interlinkHtml}

        <div>
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px;">Description / Usage Remarks</div>
          <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 4px; border: 1px solid var(--border-subtle);">${entry.description || 'No description provided.'}</div>
        </div>
      </div>
    `;

    window.State.openModal(`Entry Details: ${entry.name}`, content, `
      <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      <button class="btn btn-primary" onclick="window.State.closeModal(); window.CommonLookupMasterModule.showEditModal('${id}')">Edit</button>
    `);
  },

  toggleStatus(id) {
    const entry = window.DB.getById('common_masters', id);
    if (!entry) return;
    const nextStatus = entry.status === 'Active' ? 'Inactive' : 'Active';
    window.DB.update('common_masters', id, { status: nextStatus });
    window.DB.logAudit('COMMON_MASTER_STATUS_TOGGLE', 'COMMON_MASTER', id, `Toggled ${entry.name} status to ${nextStatus}`);
    window.State.showToast(`Entry "${entry.name}" is now ${nextStatus}.`, nextStatus === 'Active' ? 'success' : 'warning');
    this.refreshTable();
  },

  deleteEntry(id) {
    const entry = window.DB.getById('common_masters', id);
    if (!entry) return;

    if (confirm(`Are you sure you want to remove common master entry "${entry.name}" (${entry.code})?`)) {
      window.DB.delete('common_masters', id);
      window.DB.logAudit('COMMON_MASTER_DELETED', 'COMMON_MASTER', id, `Removed entry ${entry.name} (${entry.code})`);
      window.State.showToast(`Entry "${entry.name}" removed successfully.`, 'success');
      this.render();
    }
  },

  exportCsv() {
    const list = this.getFilteredEntries();
    let csv = 'ID,Type,MasterName,Code,Name,LinkedGender,IsGenderFixed,Description,SortOrder,Status\n';
    list.forEach(e => {
      const meta = this.getTypeMeta(e.type);
      csv += `"${e.id}","${e.type}","${meta.label}","${e.code}","${(e.name || '').replace(/"/g, '""')}","${(e.linked_gender_name || '').replace(/"/g, '""')}",${e.is_gender_fixed ? 'Yes' : 'No'},"${(e.description || '').replace(/"/g, '""')}",${e.sort_order || 0},"${e.status}"\n`;
    });

    const filename = this.typeFilter === 'ALL' ? 'common_masters.csv' : `common_master_${this.typeFilter.toLowerCase()}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.State.showToast(`Exported ${list.length} master records.`, 'success');
  }
};
