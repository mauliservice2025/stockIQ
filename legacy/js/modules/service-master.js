/* ==========================================================================
   ENTERPRISE ISCM - SERVICE MASTER MODULE (LABOUR & WORKSHOP SERVICES)
   Centralized management of two-wheeler workshop labour operations, SAC codes,
   standard rates, estimated labor hours, and service categories.
   ========================================================================== */

(function() {
  'use strict';

  const DEFAULT_SERVICES = [
    {
      id: 'LBR-001',
      code: 'LBR-001',
      name: 'General Service Labour',
      sac_code: '998729',
      category: 'Periodic Maintenance',
      rate: 399,
      workshop_sale_price: 399,
      estimated_hours: 1.0,
      stock_uom: 'JOB',
      type: 'LABOUR',
      item_type: 'Labour',
      tax_rate: 18,
      status: 'Active',
      description: 'Complete periodic 2-wheeler general maintenance, multipoint checkup, oil change & adjustments.',
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'LBR-002',
      code: 'LBR-002',
      name: 'Engine Oil & Filter Replacement Labour',
      sac_code: '998729',
      category: 'Engine Service',
      rate: 100,
      workshop_sale_price: 100,
      estimated_hours: 0.5,
      stock_uom: 'JOB',
      type: 'LABOUR',
      item_type: 'Labour',
      tax_rate: 18,
      status: 'Active',
      description: 'Draining engine oil, replacing oil strainer/filter, gasket inspection, and fresh oil filling.',
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'LBR-003',
      code: 'LBR-003',
      name: 'Brake Overhaul & Cleaning Labour',
      sac_code: '998729',
      category: 'Brake Service',
      rate: 250,
      workshop_sale_price: 250,
      estimated_hours: 0.75,
      stock_uom: 'JOB',
      type: 'LABOUR',
      item_type: 'Labour',
      tax_rate: 18,
      status: 'Active',
      description: 'Front & rear brake drum/disc caliper cleaning, pad de-glazing, shoe inspection, and lever play adjustment.',
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'LBR-004',
      code: 'LBR-004',
      name: 'Carburetor / Throttle Body Clean',
      sac_code: '998729',
      category: 'Fuel System',
      rate: 350,
      workshop_sale_price: 350,
      estimated_hours: 1.0,
      stock_uom: 'JOB',
      type: 'LABOUR',
      item_type: 'Labour',
      tax_rate: 18,
      status: 'Active',
      description: 'Ultrasonic/spray cleaning of carburetor jets or EFI throttle body, TPS sensor check and idling RPM tuning.',
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'LBR-005',
      code: 'LBR-005',
      name: 'Electrical & Wiring Check',
      sac_code: '998729',
      category: 'Electrical Service',
      rate: 200,
      workshop_sale_price: 200,
      estimated_hours: 0.5,
      stock_uom: 'JOB',
      type: 'LABOUR',
      item_type: 'Labour',
      tax_rate: 18,
      status: 'Active',
      description: 'Complete inspection of battery voltage, alternator charging current, starter relay, indicators and horn.',
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'LBR-006',
      code: 'LBR-006',
      name: 'Clutch & CVT Overhaul Labour',
      sac_code: '998729',
      category: 'Transmission Service',
      rate: 450,
      workshop_sale_price: 450,
      estimated_hours: 1.5,
      stock_uom: 'JOB',
      type: 'LABOUR',
      item_type: 'Labour',
      tax_rate: 18,
      status: 'Active',
      description: 'Disassembly and cleaning of variator, rollers, clutch bell, shoe deglazing, and drive belt inspection.',
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'LBR-007',
      code: 'LBR-007',
      name: 'Water Wash & Polishing',
      sac_code: '998729',
      category: 'Cleaning & Detailing',
      rate: 200,
      workshop_sale_price: 200,
      estimated_hours: 0.5,
      stock_uom: 'JOB',
      type: 'LABOUR',
      item_type: 'Labour',
      tax_rate: 18,
      status: 'Active',
      description: 'High-pressure foam water wash, underbody degreasing, air drying, and silicone body polish.',
      created_at: '2026-01-01T00:00:00.000Z'
    }
  ];

  window.ServiceMasterModule = {
    _searchTerm: '',
    _statusFilter: 'ALL',
    _categoryFilter: 'ALL',
    _seeded: false,

    init() {
      this.ensureSeedData();
    },

    ensureSeedData() {
      if (!window.DB || !window.DB.data) return;
      if (!Array.isArray(window.DB.data.services)) {
        window.DB.data.services = [];
      }
      const current = window.DB.data.services;
      let modified = false;

      // 1. Repair any corrupted LBR-002 entry where name was mistakenly 'General Service Labour'
      current.forEach(s => {
        if (s.code === 'LBR-002' && (s.name || '').toLowerCase().includes('general service')) {
          s.name = 'Engine Oil & Filter Replacement Labour';
          s.rate = s.rate || 100;
          s.workshop_sale_price = s.workshop_sale_price || 100;
          modified = true;
        }
        if (s.code === 'LBR-001' && (s.name || '').toLowerCase().includes('engine oil')) {
          s.name = 'General Service Labour';
          s.rate = s.rate || 399;
          s.workshop_sale_price = s.workshop_sale_price || 399;
          modified = true;
        }
      });

      // 2. Ensure all 7 DEFAULT_SERVICES exist with correct code, name, and rate
      DEFAULT_SERVICES.forEach(defSrv => {
        let match = current.find(s => s.code && s.code.toUpperCase() === defSrv.code.toUpperCase());
        if (!match) {
          match = current.find(s => s.name && s.name.toLowerCase() === defSrv.name.toLowerCase());
          if (match) {
            match.code = defSrv.code;
            match.id = defSrv.id;
            modified = true;
          }
        }
        if (!match) {
          current.push({ ...defSrv });
          modified = true;
        } else {
          if (match.code === defSrv.code && (defSrv.code === 'LBR-001' || defSrv.code === 'LBR-002')) {
            if (match.name !== defSrv.name) {
              match.name = defSrv.name;
              match.rate = defSrv.rate;
              match.workshop_sale_price = defSrv.workshop_sale_price;
              modified = true;
            }
          }
        }
      });

      // Sort by code (LBR-001 to LBR-007)
      current.sort((a, b) => {
        const numA = parseInt((a.code || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.code || '').replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      current.forEach(existing => {
        if (!existing.sac_code) { existing.sac_code = '998729'; modified = true; }
        if (!existing.type) { existing.type = 'LABOUR'; modified = true; }
        if (!existing.item_type) { existing.item_type = 'Labour'; modified = true; }
        if (existing.workshop_sale_price === undefined) { existing.workshop_sale_price = existing.rate || 0; modified = true; }
        if (!existing.status) { existing.status = 'Active'; modified = true; }
      });

      window.DB.data._services_seeded_v2 = true;
      if (modified && typeof window.DB.saveData === 'function') {
        window.DB.saveData();
      }
      this._seeded = true;
    },

    getAllServices() {
      this.ensureSeedData();
      return (window.DB && typeof window.DB.getAll === 'function') 
        ? (window.DB.getAll('services') || []) 
        : (window.DB && window.DB.data && window.DB.data.services) || [];
    },

    render() {
      this.ensureSeedData();
      const allServices = this.getAllServices();

      const searchLower = (this._searchTerm || '').toLowerCase().trim();
      const filtered = allServices.filter(s => {
        if (this._statusFilter !== 'ALL' && s.status !== this._statusFilter) return false;
        if (this._categoryFilter !== 'ALL' && s.category !== this._categoryFilter) return false;
        if (searchLower) {
          const corpus = `${s.code || ''} ${s.name || ''} ${s.sac_code || ''} ${s.category || ''} ${s.description || ''}`.toLowerCase();
          if (!corpus.includes(searchLower)) return false;
        }
        return true;
      });

      // Extract unique categories for filter dropdown
      const categories = Array.from(new Set(allServices.map(s => s.category).filter(Boolean)));

      const paged = (typeof window !== 'undefined' && window.PaginationHelper)
        ? window.PaginationHelper.paginate(filtered, 'service-master')
        : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

      return `
        <div class="content-card" style="margin-top: 0 !important; padding: 10px 14px;">
          <!-- Filters Toolbar & Action Button -->
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <input 
                type="text" 
                id="srv-master-search" 
                class="filter-input" 
                placeholder="Search service code, name, SAC..." 
                value="${this._searchTerm || ''}" 
                oninput="window.ServiceMasterModule.onSearchInput(this.value)" 
                style="min-width: 260px; height: 32px; font-size: 12px; margin: 0;"
              />
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <select id="srv-status-filter" class="filter-select" onchange="window.ServiceMasterModule.onStatusFilterChange(this.value)" style="height: 32px; font-size: 12px; margin: 0;">
                <option value="ALL" ${this._statusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
                <option value="Active" ${this._statusFilter === 'Active' ? 'selected' : ''}>Active Only</option>
                <option value="Inactive" ${this._statusFilter === 'Inactive' ? 'selected' : ''}>Inactive Only</option>
              </select>

              <select id="srv-category-filter" class="filter-select" onchange="window.ServiceMasterModule.onCategoryFilterChange(this.value)" style="height: 32px; font-size: 12px; margin: 0;">
                <option value="ALL" ${this._categoryFilter === 'ALL' ? 'selected' : ''}>All Categories</option>
                ${categories.map(c => `<option value="${c}" ${this._categoryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>

              <button type="button" class="btn btn-secondary btn-sm" onclick="window.ServiceMasterModule.resetFilters()" title="Reset Filters" style="height: 32px; padding: 0 10px;">
                Reset
              </button>

              <button type="button" class="btn btn-primary btn-sm" onclick="window.ServiceMasterModule.openAddModal()" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; height: 32px; padding: 0 14px; font-size: 12.5px;">
                <span>+ Add New Service</span>
              </button>
            </div>
          </div>

          <!-- 4. Data Table -->
          <div class="table-responsive" style="margin-top: 12px; border: 1px solid var(--border-subtle, #334155); border-radius: 6px; overflow-x: auto;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 0;">
              <thead>
                <tr style="background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--border-subtle, #334155); text-align: left;">
                  <th style="width: 45px; text-align: center; padding: 8px 6px;">#</th>
                  <th style="min-width: 110px; padding: 8px 10px;">Service Code</th>
                  <th style="min-width: 240px; padding: 8px 10px;">Service Name</th>
                  <th style="min-width: 140px; padding: 8px 10px;">Category</th>
                  <th style="width: 110px; text-align: center; padding: 8px 10px;">SAC Code</th>
                  <th style="width: 120px; text-align: right; padding: 8px 10px;">Standard Rate (₹)</th>
                  <th style="width: 100px; text-align: center; padding: 8px 10px;">Est. Time</th>
                  <th style="width: 90px; text-align: center; padding: 8px 10px;">Status</th>
                  <th style="width: 130px; text-align: center; padding: 8px 10px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${paged.items.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align: center; padding: 24px; color: var(--text-muted);">
                      No services found matching current filters. Click <strong>+ Add New Service</strong> to register a labour service.
                    </td>
                  </tr>
                ` : paged.items.map((s, idx) => {
                  const rowNum = (paged.currentPage - 1) * paged.pageSize + idx + 1;
                  const isActive = s.status === 'Active' || !s.status;
                  return `
                    <tr style="border-bottom: 1px solid var(--border-subtle, #334155); height: 38px;">
                      <td style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 4px 6px;">${rowNum}</td>
                      <td style="padding: 4px 10px;">
                        <span class="cell-mono font-bold" style="font-size: 11.5px; color: #3b82f6; background: rgba(59, 130, 246, 0.1); padding: 2px 7px; border-radius: 4px; white-space: nowrap; letter-spacing: 0.3px;">
                          ${s.code}
                        </span>
                      </td>
                      <td style="padding: 4px 10px;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 12.5px;">${s.name}</div>
                      </td>
                        <td style="padding: 4px 10px;">
                          <span class="badge badge-subtle" style="font-size: 10.5px; padding: 2px 7px;">${s.category || 'General Service'}</span>
                        </td>
                        <td style="text-align: center; padding: 4px 10px;">
                          <span class="cell-mono" style="font-size: 11px; color: var(--text-secondary); background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px;">
                            ${s.sac_code || '998729'}
                          </span>
                        </td>
                        <td style="text-align: right; padding: 4px 10px; font-weight: 800; font-size: 13px; color: #10b981;">
                          ₹${Number(s.rate || s.workshop_sale_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style="text-align: center; padding: 4px 10px; color: var(--text-secondary); font-size: 11.5px;">
                          ${s.estimated_hours ? `${s.estimated_hours} hr` : '1.0 hr'}
                        </td>
                        <td style="text-align: center; padding: 4px 10px;">
                          <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 10.5px; padding: 2px 8px;">
                            ${isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style="text-align: center; padding: 4px 10px;">
                          <div style="display: flex; gap: 6px; align-items: center; justify-content: center;">
                            <button type="button" class="btn btn-secondary btn-xs" onclick="window.ServiceMasterModule.openEditModal('${s.id}')" title="Edit Service" style="padding: 2px 8px; font-size: 11px;">
                              ✏️ Edit
                            </button>
                            <button type="button" class="btn btn-ghost btn-xs" onclick="window.ServiceMasterModule.deleteService('${s.id}')" title="Delete Service" style="padding: 2px 8px; font-size: 11px; color: #ef4444;">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- 5. Pagination -->
            ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
              key: 'service-master',
              pagination: paged,
              onPageChange: 'window.ServiceMasterModule.setPage',
              onPageSizeChange: 'window.ServiceMasterModule.setPageSize'
            }) : ''}
          </div>
        `;
      },

    onSearchInput(val) {
      this._searchTerm = val;
      if (window.PaginationHelper) window.PaginationHelper.reset('service-master');
      this.refresh();
    },

    onStatusFilterChange(val) {
      this._statusFilter = val;
      if (window.PaginationHelper) window.PaginationHelper.reset('service-master');
      this.refresh();
    },

    onCategoryFilterChange(val) {
      this._categoryFilter = val;
      if (window.PaginationHelper) window.PaginationHelper.reset('service-master');
      this.refresh();
    },

    resetFilters() {
      this._searchTerm = '';
      this._statusFilter = 'ALL';
      this._categoryFilter = 'ALL';
      if (window.PaginationHelper) window.PaginationHelper.reset('service-master');
      this.refresh();
    },

    setPage(page) {
      if (window.PaginationHelper) window.PaginationHelper.setPage('service-master', page);
      this.refresh();
    },

    setPageSize(size) {
      if (window.PaginationHelper) window.PaginationHelper.setPageSize('service-master', size);
      this.refresh();
    },

    refresh() {
      if (typeof document === 'undefined') return;
      const container = document.getElementById('store-inventory-subview-container') ||
                        document.querySelector('.service-master-screen')?.parentElement ||
                        document.getElementById('main-content');
      if (container) {
        if (window.StoreInventoryModule && window.StoreInventoryModule.activeTab === 'SERVICE_MASTER') {
          container.innerHTML = this.render();
        } else {
          container.innerHTML = this.render();
        }
      }
    },

    openAddModal() {
      const allServices = this.getAllServices();
      // Auto generate next code LBR-xxx
      let maxNum = 0;
      allServices.forEach(s => {
        const m = (s.code || '').match(/LBR-(\d+)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextCode = `LBR-${String(maxNum + 1).padStart(3, '0')}`;

      const contentHtml = `
        <form id="service-master-form" onsubmit="event.preventDefault(); window.ServiceMasterModule.handleSaveSubmit();" style="display: flex; flex-direction: column; gap: 12px;">
          <input type="hidden" id="srv-edit-id" value="" />

          <div style="display: grid; grid-template-columns: 140px 1fr; gap: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Service Code <span style="color: #ef4444;">*</span></label>
              <input type="text" id="srv-input-code" class="form-control cell-mono" value="${nextCode}" style="font-weight: 700; text-transform: uppercase;" required />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Service Name <span style="color: #ef4444;">*</span></label>
              <input type="text" id="srv-input-name" class="form-control" placeholder="e.g. Chain Sprocket Replacement Labour" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Standard Labour Rate (₹) <span style="color: #ef4444;">*</span></label>
              <input type="number" id="srv-input-rate" class="form-control cell-mono" min="0" step="any" placeholder="e.g. 350" required />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">SAC / HSN Code</label>
              <input type="text" id="srv-input-sac" class="form-control cell-mono" value="998729" placeholder="998729" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Service Category</label>
              <select id="srv-input-category" class="form-control">
                <option value="Periodic Maintenance" selected>Periodic Maintenance</option>
                <option value="Engine Service">Engine Service</option>
                <option value="Brake Service">Brake Service</option>
                <option value="Fuel System">Fuel System</option>
                <option value="Electrical Service">Electrical Service</option>
                <option value="Transmission Service">Transmission Service</option>
                <option value="Cleaning & Detailing">Cleaning & Detailing</option>
                <option value="General Labour">General Labour</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Estimated Hours</label>
              <input type="number" id="srv-input-hours" class="form-control cell-mono" min="0.1" step="0.1" value="1.0" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Status</label>
              <select id="srv-input-status" class="form-control">
                <option value="Active" selected>Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Description</label>
            <textarea id="srv-input-desc" class="form-control" rows="2" placeholder="Brief description of service..."></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="font-weight: 700;">Save Service</button>
          </div>
        </form>
      `;

      if (window.State && window.State.showModal) {
        window.State.showModal({
          title: 'Add New Workshop Service (Labour)',
          maxWidth: '520px',
          contentHtml
        });
      }
    },

    openEditModal(serviceId) {
      const allServices = this.getAllServices();
      const s = allServices.find(item => item.id === serviceId || item.code === serviceId);
      if (!s) {
        if (window.State && window.State.showToast) window.State.showToast('Service record not found.', 'error');
        return;
      }

      const contentHtml = `
        <form id="service-master-form" onsubmit="event.preventDefault(); window.ServiceMasterModule.handleSaveSubmit();" style="display: flex; flex-direction: column; gap: 12px;">
          <input type="hidden" id="srv-edit-id" value="${s.id}" />

          <div style="display: grid; grid-template-columns: 140px 1fr; gap: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Service Code <span style="color: #ef4444;">*</span></label>
              <input type="text" id="srv-input-code" class="form-control cell-mono" value="${s.code || ''}" style="font-weight: 700; text-transform: uppercase;" required />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Service Name <span style="color: #ef4444;">*</span></label>
              <input type="text" id="srv-input-name" class="form-control" value="${s.name || ''}" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Standard Labour Rate (₹) <span style="color: #ef4444;">*</span></label>
              <input type="number" id="srv-input-rate" class="form-control cell-mono" min="0" step="any" value="${s.rate || s.workshop_sale_price || 0}" required />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">SAC / HSN Code</label>
              <input type="text" id="srv-input-sac" class="form-control cell-mono" value="${s.sac_code || '998729'}" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Service Category</label>
              <select id="srv-input-category" class="form-control">
                ${['Periodic Maintenance', 'Engine Service', 'Brake Service', 'Fuel System', 'Electrical Service', 'Transmission Service', 'Cleaning & Detailing', 'General Labour'].map(cat => `
                  <option value="${cat}" ${s.category === cat ? 'selected' : ''}>${cat}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Estimated Hours</label>
              <input type="number" id="srv-input-hours" class="form-control cell-mono" min="0.1" step="0.1" value="${s.estimated_hours || 1.0}" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12px; font-weight: 600;">Status</label>
              <select id="srv-input-status" class="form-control">
                <option value="Active" ${s.status === 'Active' || !s.status ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${s.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 12px; font-weight: 600;">Description</label>
            <textarea id="srv-input-desc" class="form-control" rows="2">${s.description || ''}</textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="font-weight: 700;">Update Service</button>
          </div>
        </form>
      `;

      if (window.State && window.State.showModal) {
        window.State.showModal({
          title: `Edit Service: ${s.code} - ${s.name}`,
          maxWidth: '520px',
          contentHtml
        });
      }
    },

    handleSaveSubmit() {
      const editId = (document.getElementById('srv-edit-id')?.value || '').trim();
      const code = (document.getElementById('srv-input-code')?.value || '').trim().toUpperCase();
      const name = (document.getElementById('srv-input-name')?.value || '').trim();
      const rate = parseFloat(document.getElementById('srv-input-rate')?.value || 0);
      const sac_code = (document.getElementById('srv-input-sac')?.value || '998729').trim();
      const category = document.getElementById('srv-input-category')?.value || 'Periodic Maintenance';
      const estimated_hours = parseFloat(document.getElementById('srv-input-hours')?.value || 1.0);
      const taxEl = document.getElementById('srv-input-tax');
      const tax_rate = taxEl ? parseFloat(taxEl.value || 18) : 18;
      const status = document.getElementById('srv-input-status')?.value || 'Active';
      const description = (document.getElementById('srv-input-desc')?.value || '').trim();

      if (!code || !name) {
        if (window.State && window.State.showToast) window.State.showToast('Service Code and Name are required.', 'error');
        return;
      }

      const allServices = this.getAllServices();
      const isNew = !editId;
      const targetId = editId || code || `LBR-${Date.now()}`;

      // Check duplicate code if new
      if (isNew && allServices.some(s => s.code.toUpperCase() === code)) {
        if (window.State && window.State.showToast) window.State.showToast(`Service code "${code}" already exists.`, 'error');
        return;
      }

      const record = {
        id: targetId,
        code: code,
        name: name,
        sac_code: sac_code,
        category: category,
        rate: rate,
        workshop_sale_price: rate,
        estimated_hours: estimated_hours,
        tax_rate: tax_rate,
        stock_uom: 'JOB',
        type: 'LABOUR',
        item_type: 'Labour',
        isService: true,
        status: status,
        description: description,
        updated_at: new Date().toISOString()
      };

      if (isNew) {
        record.created_at = new Date().toISOString();
      }

      if (window.DB && typeof window.DB.upsert === 'function') {
        window.DB.upsert('services', record);
        if (typeof window.DB.emitChange === 'function') {
          window.DB.emitChange('services');
        }
      }

      if (window.State && window.State.closeModal) window.State.closeModal();
      if (window.State && window.State.showToast) {
        window.State.showToast(`Service "${code} - ${name}" ${isNew ? 'created' : 'updated'} successfully!`, 'success');
      }

      this.refresh();
    },

    deleteService(serviceId) {
      const allServices = this.getAllServices();
      const s = allServices.find(item => item.id === serviceId || item.code === serviceId);
      if (!s) return;

      const confirmed = (typeof window !== 'undefined' && typeof window.confirm === 'function') 
        ? window.confirm(`Are you sure you want to delete service "${s.code} - ${s.name}"?`) 
        : (typeof confirm === 'function' ? confirm(`Are you sure you want to delete service "${s.code} - ${s.name}"?`) : true);
      if (!confirmed) return;

      if (window.DB && typeof window.DB.delete === 'function') {
        window.DB.delete('services', s.id);
        if (typeof window.DB.emitChange === 'function') {
          window.DB.emitChange('services');
        }
      }

      if (window.State && window.State.showToast) {
        window.State.showToast(`Service "${s.code}" deleted successfully.`, 'info');
      }

      this.refresh();
    }
  };

  // Auto-init on script evaluation
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      try {
        if (window.ServiceMasterModule && typeof window.ServiceMasterModule.init === 'function') {
          window.ServiceMasterModule.init();
        }
      } catch (e) {}
    }, 100);
  }
})();
