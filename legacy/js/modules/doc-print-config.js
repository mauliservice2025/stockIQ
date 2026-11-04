/* ==========================================================================
   ENTERPRISE ISCM - DOCUMENT PRINT CONFIGURATION MASTER MODULE (BRD v1.0 COMPLIANT)
   Centralized Document Design, Layout Configuration, Preview & Publishing Engine
   Hierarchy: Organization → Company → Facility / Branch → Doc Type → Template Version
   Supported Documents: Job Card, Estimate Quotation, Draft Bill, Final Bill, Vehicle Delivery Receipt
   ========================================================================== */

window.DocPrintConfigModule = {
  searchTerm: '',
  facilityFilter: 'ALL',
  docTypeFilter: 'ALL',
  statusFilter: 'ALL',
  currentPage: 1,
  pageSize: 10,
  activeConfigId: null,
  activeDesignerTab: 'page', // page | header | body | columns | footer | preview
  previewSampleMode: 'sample', // sample | live
  selectedLiveTxId: null,

  // 1. Supported Document Types (BRD Section 7)
  DOC_TYPES: [
    { code: 'JC', name: 'Job Card', defaultTitle: 'WORKSHOP JOB CARD', color: '#0284c7', icon: '📋', description: 'Customer, vehicle, complaint, inspection and job details' },
    { code: 'EST', name: 'Estimate Quotation', defaultTitle: 'ESTIMATE QUOTATION', color: '#d97706', icon: '📊', description: 'Proposed work, parts, labour, taxes and estimated amount' },
    { code: 'DB', name: 'Draft Bill', defaultTitle: 'DRAFT BILL (PRE-INVOICE REVIEW)', color: '#6366f1', icon: '📑', description: 'Preliminary bill for review before final tax invoice' },
    { code: 'INV', name: 'Final Bill', defaultTitle: 'TAX INVOICE / FINAL BILL', color: '#059669', icon: '🧾', description: 'Finalized billing details, taxes, charges and payment info' },
    { code: 'RCPT', name: 'Payment Receipt', defaultTitle: 'PAYMENT RECEIPT', color: '#10b981', icon: '🧾', description: 'Payment acknowledgment, settlement details, mode and balance due' },
    { code: 'GP', name: 'Vehicle Delivery Receipt', defaultTitle: 'VEHICLE DELIVERY RECEIPT & GATE PASS', color: '#7c3aed', icon: '🚚', description: 'Vehicle handover and delivery gate pass acknowledgement' },
    { code: 'PO', name: 'Purchase Order', defaultTitle: 'PURCHASE ORDER', color: '#0284c7', icon: '📦', description: 'Official supplier purchase order and procurement contract' },
    { code: 'GRN', name: 'Goods Receipt Note', defaultTitle: 'GOODS RECEIPT NOTE (GRN)', color: '#16a34a', icon: '📥', description: 'Warehouse inward inspection and material receipt acknowledgement' },
    { code: 'TRANSFER', name: 'Stock Transfer Pass', defaultTitle: 'INTER-STORE TRANSFER PASS', color: '#d97706', icon: '🔄', description: 'Facility-to-facility stock transfer note and transit authorization' },
    { code: 'DISPATCH', name: 'Dispatch Gate Pass', defaultTitle: 'OUTWARD DISPATCH GATE PASS', color: '#9333ea', icon: '🚚', description: 'Outbound shipment delivery note and gate pass security clearance' }
  ],

  // 2. Default Facility List Provider
  getFacilities() {
    const plants = (window.DB && typeof window.DB.getActivePlants === 'function')
      ? window.DB.getActivePlants()
      : ((window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('plants') : []);
    const active = plants.filter(p => !window.DB || typeof window.DB.isPlantActive !== 'function' || window.DB.isPlantActive(p.id, true));
    const mapped = active.map(p => ({
      id: p.id,
      code: (p.code || p.branch_code || p.id).toUpperCase(),
      name: p.name || `Facility ${p.id}`
    }));
    if (!mapped.some(m => m.id === 'ALL')) {
      mapped.unshift({ id: 'ALL', code: 'ALL', name: 'All Facilities' });
    }
    return mapped.length > 0 ? mapped : [
      { id: 'ALL', code: 'ALL', name: 'All Facilities' },
      { id: 'PLANT-01', code: 'MSC-01', name: 'Mauli Service Center - I' }
    ];
  },

  // 3. Data Retrieval
  getAllConfigs() {
    let list = (window.DB && typeof window.DB.getAll === 'function')
      ? (window.DB.getAll('document_print_configurations') || [])
      : [];

    if (list.length === 0 && typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.document_print_configurations)) {
      list = JSON.parse(JSON.stringify(INITIAL_DATA.document_print_configurations));
      if (window.DB && typeof window.DB.upsert === 'function') {
        list.forEach(c => window.DB.upsert('document_print_configurations', c));
      }
    }

    // Ensure published default Payment Receipt configuration exists
    if (!list.some(c => c.document_type === 'RCPT')) {
      const defRcpt = this.getDefaultRcptConfig();
      list.push(defRcpt);
      if (window.DB && typeof window.DB.upsert === 'function') {
        window.DB.upsert('document_print_configurations', defRcpt);
      }
    }

    return list;
  },

  getDefaultRcptConfig() {
    return {
      id: 'DPC-RCPT-STD',
      code: 'DPC-RCPT-001',
      name: 'Official Payment Receipt',
      facility_id: 'ALL',
      document_type: 'RCPT',
      version: '1.0',
      status: 'Published',
      effective_from: '2026-04-01',
      remarks: 'Standard customer payment receipt, settlement voucher and balance breakdown',
      created_by: 'Administrator',
      created_at: '2026-04-01T09:00:00Z',
      updated_by: 'Administrator',
      updated_at: '2026-04-01T09:00:00Z',
      page_settings: {
        page_size: 'A4',
        orientation: 'portrait',
        margin_top: 8,
        margin_bottom: 8,
        margin_left: 10,
        margin_right: 10,
        font_family: 'Inter, sans-serif',
        font_size: '11px',
        line_spacing: '1.3',
        primary_color: '#059669'
      },
      header_config: {
        doc_title: 'PAYMENT RECEIPT',
        show_company_name: true,
        show_facility_name: true,
        show_facility_address: true,
        show_contact_number: true,
        show_email: true,
        show_gstin: true,
        logo_position: 'left',
        alignment: 'center',
        show_separator_border: true
      },
      body_config: {
        show_customer_name: true,
        show_customer_mobile: true,
        show_customer_cin: true,
        show_customer_address: true,
        show_vehicle_reg: true,
        show_vehicle_model: true,
        show_odometer: true,
        show_chassis: true,
        show_complaints: false,
        show_technician: false,
        show_advisor: true,
        show_delivery_date: false,
        show_tax_breakup: false,
        show_discount: false,
        show_amount_in_words: true,
        show_payment_mode: true
      },
      columns_config: [
        { field: 'sr_no', label: 'Sr.', visible: true, width: 8, align: 'center' },
        { field: 'description', label: 'Particulars / Reference Details', visible: true, width: 44, align: 'left' },
        { field: 'payment_mode', label: 'Payment Mode', visible: true, width: 20, align: 'center' },
        { field: 'total', label: 'Amount (₹)', visible: true, width: 28, align: 'right' }
      ],
      footer_config: {
        terms_conditions: '1. Payment received against stated invoice number. 2. Cheque / Digital payments are subject to bank realization. 3. Retain this receipt for vehicle handover and gate pass clearance.',
        customer_declaration: 'I acknowledge the payment towards service and spare components as indicated above.',
        show_customer_sign: true,
        show_advisor_sign: true,
        show_tech_sign: false,
        show_auth_sign: true,
        thank_you_msg: 'Thank you for your payment! Drive safe.',
        show_timestamp: true,
        show_page_number: true
      },
      conditional_rules: []
    };
  },

  getAllAuditLogs() {
    let list = (window.DB && typeof window.DB.getAll === 'function')
      ? (window.DB.getAll('document_print_audit_logs') || [])
      : [];
    if (list.length === 0 && typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.document_print_audit_logs)) {
      list = JSON.parse(JSON.stringify(INITIAL_DATA.document_print_audit_logs));
      if (window.DB && typeof window.DB.upsert === 'function') {
        list.forEach(a => window.DB.upsert('document_print_audit_logs', a));
      }
    }
    return list;
  },

  getAllVersions() {
    let list = (window.DB && typeof window.DB.getAll === 'function')
      ? (window.DB.getAll('document_print_template_versions') || [])
      : [];
    return list;
  },

  // 4. Main Rendering Methods
  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    const pageTopBar = document.getElementById('page-top-bar') || (document.querySelector && document.querySelector('.page-top-bar'));
    if (pageTopBar) pageTopBar.style.display = 'none';

    container.innerHTML = this.renderContentCard();
  },

  renderTab(container) {
    if (!container) container = document.getElementById('org-location-tab-content');
    return this.renderContentCard();
  },

  renderContentCard() {
    return `
      <div class="content-card" id="doc-print-config-wrapper" style="font-family: var(--font-sans, 'Inter', sans-serif);">
        
        <!-- Header Banner: Title, Upper Filters & Action Buttons -->
        ${this.renderHeaderWithFilters()}

        <!-- Data Table Container -->
        <div id="doc-print-config-table-container">
          ${this.renderTableContent()}
        </div>
      </div>
    `;
  },

  renderHeaderWithFilters() {
    const facilities = this.getFacilities();

    return `
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; border-bottom: 1px solid var(--border-subtle); padding: 8px 12px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <span style="font-size: 16px;">🖨️</span>
          <h2 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; white-space: nowrap;">
            Document Print Configuration Master
          </h2>
        </div>

        <!-- Upper Side Filters -->
        <div id="doc-print-config-filters" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <!-- Search input -->
          <div style="position: relative; width: 190px; flex-shrink: 0;">
            <input 
              type="text" 
              class="form-control form-control-sm"
              placeholder="Search name, remarks..."
              value="${this.escapeHtml(this.searchTerm)}"
              oninput="window.DocPrintConfigModule.setSearch(this.value)"
              style="padding-left: 30px !important; padding-right: 26px !important; width: 100%; height: 28px; font-size: 11px;"
            />
            <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 11px; color: var(--text-muted); pointer-events: none;">🔍</span>
            ${this.searchTerm ? `
              <button type="button" onclick="window.DocPrintConfigModule.setSearch('')" style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px;">&times;</button>
            ` : ''}
          </div>

          <!-- Facility Filter -->
          <select class="form-control form-control-sm" onchange="window.DocPrintConfigModule.setFacilityFilter(this.value)" style="width: 155px; height: 28px; font-size: 11px; flex-shrink: 0;">
            <option value="ALL" ${this.facilityFilter === 'ALL' ? 'selected' : ''}>🏢 All Facilities</option>
            ${facilities.filter(f => f.id !== 'ALL').map(f => `
              <option value="${f.id}" ${this.facilityFilter === f.id ? 'selected' : ''}>📍 ${this.escapeHtml(f.name)}</option>
            `).join('')}
          </select>

          <!-- Document Type Filter -->
          <select class="form-control form-control-sm" onchange="window.DocPrintConfigModule.setDocTypeFilter(this.value)" style="width: 150px; height: 28px; font-size: 11px; flex-shrink: 0;">
            <option value="ALL" ${this.docTypeFilter === 'ALL' ? 'selected' : ''}>📑 All Document Types</option>
            ${this.DOC_TYPES.map(d => `
              <option value="${d.code}" ${this.docTypeFilter === d.code ? 'selected' : ''}>${d.icon} ${d.name}</option>
            `).join('')}
          </select>

          <!-- Status Filter -->
          <select class="form-control form-control-sm" onchange="window.DocPrintConfigModule.setStatusFilter(this.value)" style="width: 110px; height: 28px; font-size: 11px; flex-shrink: 0;">
            <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
            <option value="Published" ${this.statusFilter === 'Published' ? 'selected' : ''}>Published</option>
            <option value="Draft" ${this.statusFilter === 'Draft' ? 'selected' : ''}>Draft</option>
            <option value="Pending Approval" ${this.statusFilter === 'Pending Approval' ? 'selected' : ''}>Pending Approval</option>
            <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>

          ${(this.searchTerm || this.facilityFilter !== 'ALL' || this.docTypeFilter !== 'ALL' || this.statusFilter !== 'ALL') ? `
            <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.resetFilters()" title="Reset all search & filter controls" style="height: 28px; font-size: 11px; line-height: 1; padding: 0 8px;">
              Clear
            </button>
          ` : ''}
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex-shrink: 0;">
          <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.showCopyModal()" title="Clone an existing configuration" style="height: 28px; font-size: 11px; padding: 0 8px;">
            📋 Copy Template
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.showAuditTrailModal()" title="View system audit trail" style="height: 28px; font-size: 11px; padding: 0 8px;">
            📜 Audit Trail
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.DocPrintConfigModule.showCreateModal()" style="font-weight: 600; height: 28px; font-size: 11px; padding: 0 10px;">
            + Create Configuration
          </button>
        </div>
      </div>
    `;
  },

  renderToolbar() {
    return '';
  },

  renderTableContent() {
    const allConfigs = this.getAllConfigs();
    const facilities = this.getFacilities();

    // Filter configs
    let filtered = allConfigs.filter(c => {
      if (this.docTypeFilter !== 'ALL' && c.document_type !== this.docTypeFilter) return false;
      if (this.facilityFilter !== 'ALL') {
        const appFacs = this.getApplicableFacilities(c);
        if (!appFacs.includes('ALL') && !appFacs.includes(this.facilityFilter)) return false;
      }
      if (this.statusFilter !== 'ALL' && c.status !== this.statusFilter) return false;
      if (this.searchTerm) {
        const q = this.searchTerm.toLowerCase();
        const facObj = facilities.find(f => f.id === c.facility_id);
        const facName = facObj ? facObj.name.toLowerCase() : '';
        const docObj = this.DOC_TYPES.find(d => d.code === c.document_type);
        const docName = docObj ? docObj.name.toLowerCase() : '';
        const match = (c.code && c.code.toLowerCase().includes(q)) ||
                      (c.name && c.name.toLowerCase().includes(q)) ||
                      (c.remarks && c.remarks.toLowerCase().includes(q)) ||
                      facName.includes(q) ||
                      docName.includes(q);
        if (!match) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      return `
        <div style="text-align: center; padding: 48px 16px; border: 1px dashed var(--border-subtle); border-radius: var(--radius-md, 8px); background: rgba(0,0,0,0.01);">
          <div style="font-size: 32px; margin-bottom: 8px;">🖨️</div>
          <h4 style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 6px 0;">No Print Configurations Found</h4>
          <p style="font-size: 12.5px; color: var(--text-muted); max-width: 440px; margin: 0 auto 16px auto;">
            No templates match your selected filters. Create a new print configuration or reset filters to display existing templates.
          </p>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.resetFilters()">Clear Filters</button>
            <button class="btn btn-primary btn-sm" onclick="window.DocPrintConfigModule.showCreateModal()">+ Create Configuration</button>
          </div>
        </div>
      `;
    }

    const pagedConfigs = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'docPrintConfig')
      : { items: filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize), totalRecords: filtered.length, currentPage: this.currentPage, pageSize: this.pageSize };

    const paginated = pagedConfigs.items;
    const startIndex = (pagedConfigs.currentPage - 1) * pagedConfigs.pageSize;

    return `
      <div class="table-responsive" style="border: 1px solid var(--border-subtle); border-radius: var(--radius-md, 6px); overflow: hidden;">
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
          <thead style="background: var(--bg-surface-secondary, #f8fafc); border-bottom: 1px solid var(--border-subtle);">
            <tr>
              <th style="padding: 6px 8px; width: 36px; text-align: center; font-size: 11px;">Sr.</th>
              <th style="padding: 6px 10px; text-align: left; font-size: 11px;">Name</th>
              <th style="padding: 6px 10px; text-align: left; font-size: 11px;">Facility Applicability</th>
              <th style="padding: 6px 10px; text-align: left; font-size: 11px;">Document Type</th>
              <th style="padding: 6px 8px; text-align: center; width: 65px; font-size: 11px;">Version</th>
              <th style="padding: 6px 8px; text-align: center; width: 90px; font-size: 11px;">Status</th>
              <th style="padding: 6px 8px; text-align: left; width: 95px; font-size: 11px;">Effective From</th>
              <th style="padding: 6px 8px; text-align: left; width: 110px; font-size: 11px;">Last Modified</th>
              <th style="padding: 6px 10px; text-align: right; width: 270px; font-size: 11px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paginated.map((cfg, idx) => {
              const srNo = startIndex + idx + 1;
              const docTypeObj = this.DOC_TYPES.find(d => d.code === cfg.document_type) || { name: cfg.document_type, color: '#64748b', icon: '📄' };
              const appFacs = this.getApplicableFacilities(cfg);
              const isGlobal = appFacs.includes('ALL');
              let facilityLabel = '';
              if (isGlobal) {
                facilityLabel = '🏢 All Facilities';
              } else if (appFacs.length === 1) {
                const facObj = facilities.find(f => f.id === appFacs[0]);
                facilityLabel = facObj ? `📍 ${facObj.name}` : `📍 Facility ${appFacs[0]}`;
              } else {
                facilityLabel = `🏢 ${appFacs.length} Facilities (${appFacs.map(id => {
                  const f = facilities.find(x => x.id === id);
                  return f ? (f.code || f.name) : id;
                }).join(', ')})`;
              }

              let statusBadge = '';
              if (cfg.status === 'Published') {
                statusBadge = `<span style="background: rgba(5, 150, 105, 0.12); color: #059669; border: 1px solid rgba(5, 150, 105, 0.3); padding: 1px 6px; border-radius: 999px; font-size: 10.5px; font-weight: 600;">Published</span>`;
              } else if (cfg.status === 'Draft') {
                statusBadge = `<span style="background: rgba(217, 119, 6, 0.12); color: #d97706; border: 1px solid rgba(217, 119, 6, 0.3); padding: 1px 6px; border-radius: 999px; font-size: 10.5px; font-weight: 600;">Draft</span>`;
              } else if (cfg.status === 'Pending Approval') {
                statusBadge = `<span style="background: rgba(37, 99, 235, 0.12); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.3); padding: 1px 6px; border-radius: 999px; font-size: 10.5px; font-weight: 600;">Pending</span>`;
              } else {
                statusBadge = `<span style="background: rgba(100, 116, 139, 0.12); color: #64748b; border: 1px solid rgba(100, 116, 139, 0.3); padding: 1px 6px; border-radius: 999px; font-size: 10.5px; font-weight: 600;">Inactive</span>`;
              }

              const canDelete = this.canDeleteConfiguration(cfg);

              return `
                <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.15s ease;">
                  <td style="padding: 6px 8px; text-align: center; color: var(--text-muted); font-size: 11px;">${srNo}</td>
                  <td style="padding: 6px 10px;">
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 12px;">${this.escapeHtml(cfg.name)}</div>
                  </td>
                  <td style="padding: 6px 10px;">
                    <div style="font-weight: 500; color: var(--text-secondary); font-size: 11.5px;">${facilityLabel}</div>
                  </td>
                  <td style="padding: 6px 10px;">
                    <div style="display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.03); border: 1px solid var(--border-subtle); padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                      <span>${docTypeObj.icon}</span>
                      <span style="font-weight: 600; color: ${docTypeObj.color};">${docTypeObj.name}</span>
                    </div>
                  </td>
                  <td style="padding: 6px 8px; text-align: center;">
                    <span style="font-family: monospace; font-weight: 600; font-size: 11px; color: var(--text-secondary);">v${cfg.version || '1.0'}</span>
                  </td>
                  <td style="padding: 6px 8px; text-align: center;">
                    ${statusBadge}
                  </td>
                  <td style="padding: 6px 8px; font-size: 11px; color: var(--text-secondary);">
                    ${cfg.effective_from || 'Immediate'}
                  </td>
                  <td style="padding: 6px 8px; font-size: 10.5px; color: var(--text-muted); line-height: 1.2;">
                    <div>${this.escapeHtml(cfg.updated_by || 'System Admin')}</div>
                    <div>${cfg.updated_at ? (window.formatDate ? window.formatDate(cfg.updated_at) : String(cfg.updated_at).split('T')[0]) : '28-10-2026'}</div>
                  </td>
                  <td style="padding: 6px 10px; text-align: right;">
                    <div style="display: inline-flex; gap: 4px; align-items: center; justify-content: flex-end;">
                      <button 
                        class="btn btn-outline btn-sm" 
                        onclick="window.DocPrintConfigModule.showDesignerModal('${cfg.id}')"
                        title="Configure layout & field designer"
                      >
                        Configure
                      </button>

                      <button 
                        class="btn btn-icon btn-sm" 
                        onclick="window.DocPrintConfigModule.showPreviewModal('${cfg.id}')"
                        title="Preview & test print"
                      >
                        ${window.AppIcons ? window.AppIcons.svgView : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'}
                      </button>

                      <button 
                        class="btn btn-icon btn-sm" 
                        onclick="window.DocPrintConfigModule.showVersionHistoryModal('${cfg.id}')"
                        title="Version history & restore"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      </button>

                      ${cfg.status !== 'Published' ? `
                        <button 
                          class="btn btn-primary btn-sm" 
                          style="padding: 2px 6px; font-size: 10.5px; height: 26px; font-weight: 600; background: #059669; border-color: #059669;"
                          onclick="window.DocPrintConfigModule.publishConfiguration('${cfg.id}')"
                          title="Publish this template for live printing"
                        >
                          🚀 Publish
                        </button>
                      ` : `
                        <button 
                          class="btn btn-icon btn-sm" 
                          style="color: #f59e0b;"
                          onclick="window.DocPrintConfigModule.toggleStatus('${cfg.id}')"
                          title="Deactivate template"
                        >
                          ${window.AppIcons ? window.AppIcons.svgLock(true) : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}
                        </button>
                      `}

                      <button 
                        class="btn btn-icon btn-sm" 
                        style="color: ${canDelete ? '#ef4444' : 'var(--text-muted)'}; ${canDelete ? '' : 'opacity: 0.45; cursor: not-allowed;'}"
                        ${canDelete ? `onclick="window.DocPrintConfigModule.confirmDelete('${cfg.id}')"` : `disabled title="Access Denied: Delete permission required"`}
                        title="${canDelete ? 'Delete configuration' : 'Access Denied: Delete permission required'}"
                      >
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

      <!-- Pagination Footer -->
      ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
        totalRecords: filtered.length,
        currentPage: pagedConfigs.currentPage,
        pageSize: pagedConfigs.pageSize,
        onPageChange: 'window.DocPrintConfigModule.setPage(%p%)',
        onPageSizeChange: 'window.DocPrintConfigModule.setPageSize(%s%)'
      }) : ''}
    `;
  },

  // 5. State Setters
  setSearch(val) {
    this.searchTerm = val || '';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docPrintConfig');
    }
    this.refreshTable();
  },

  setFacilityFilter(val) {
    this.facilityFilter = val || 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docPrintConfig');
    }
    this.refreshTable();
  },

  setDocTypeFilter(val) {
    this.docTypeFilter = val || 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docPrintConfig');
    }
    this.refreshTable();
  },

  setStatusFilter(val) {
    this.statusFilter = val || 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docPrintConfig');
    }
    this.refreshTable();
  },

  resetFilters() {
    this.searchTerm = '';
    this.facilityFilter = 'ALL';
    this.docTypeFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docPrintConfig');
    }
    this.render();
  },

  setPage(page) {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPage('docPrintConfig', page);
      this.currentPage = window.PaginationHelper.getState('docPrintConfig').currentPage;
    } else {
      this.currentPage = page;
    }
    this.refreshTable();
  },

  setPageSize(size) {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPageSize('docPrintConfig', size);
      this.pageSize = window.PaginationHelper.getState('docPrintConfig').pageSize;
      this.currentPage = window.PaginationHelper.getState('docPrintConfig').currentPage;
    } else {
      this.pageSize = size;
      this.currentPage = 1;
    }
    this.refreshTable();
  },

  refreshTable() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('doc-print-config-table-container');
    if (container) {
      container.innerHTML = this.renderTableContent();
    } else {
      this.render();
    }
  },

  // 6. Create Configuration Modal (BRD 8.2)
  showCreateModal(copyFromId = null) {
    const facilities = this.getFacilities();
    const sourceConfig = copyFromId ? this.getAllConfigs().find(c => c.id === copyFromId) : null;
    const defaultDocType = sourceConfig ? sourceConfig.document_type : 'JC';
    const autoCode = this.generateNextConfigCode(defaultDocType);

    const modalHtml = `
      <div class="modal-backdrop" id="doc-print-create-modal" style="display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 1050; align-items: center; justify-content: center; padding: 16px;">
        <div class="modal-dialog" style="background: var(--bg-surface, #ffffff); border: 1px solid var(--border-medium); border-radius: var(--radius-lg, 10px); width: 100%; max-width: 600px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4); max-height: 90vh; overflow-y: auto;">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">➕</span>
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">
                ${sourceConfig ? 'Copy Print Configuration' : 'Create New Document Print Configuration'}
              </h3>
            </div>
            <button type="button" onclick="window.DocPrintConfigModule.closeModal('doc-print-create-modal')" style="background: none; border: none; font-size: 18px; color: var(--text-muted); cursor: pointer;">&times;</button>
          </div>

          <form id="doc-print-create-form" onsubmit="window.DocPrintConfigModule.handleCreateSubmit(event)" style="padding: 20px;">
            <input type="hidden" name="copy_from_id" value="${sourceConfig ? sourceConfig.id : ''}" />

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Document Type <span style="color: var(--color-danger);">*</span>
                </label>
                <select 
                  name="document_type" 
                  class="form-control" 
                  required
                  onchange="window.DocPrintConfigModule.handleDocTypeChangeInCreate(this.value)"
                  ${sourceConfig ? 'disabled' : ''}
                >
                  ${this.DOC_TYPES.map(d => `
                    <option value="${d.code}" ${d.code === defaultDocType ? 'selected' : ''}>${d.icon} ${d.name} (${d.code})</option>
                  `).join('')}
                </select>
                ${sourceConfig ? `<input type="hidden" name="document_type" value="${sourceConfig.document_type}" />` : ''}
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Target Facility <span style="color: var(--color-danger);">*</span>
                </label>
                <select name="facility_id" class="form-control" required>
                  ${facilities.map(f => `
                    <option value="${f.id}" ${sourceConfig && sourceConfig.facility_id === f.id ? 'selected' : ''}>
                      ${f.id === 'ALL' ? '🏢 All Facilities (Company-wide Default)' : `📍 ${f.name}`}
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Configuration Code <span style="color: var(--color-danger);">*</span>
              </label>
              <input 
                type="text" 
                id="doc-print-create-code"
                name="code" 
                class="form-control cell-mono" 
                required 
                value="${autoCode}" 
                placeholder="e.g. DPC-JC-002"
              />
              <span style="font-size: 11px; color: var(--text-muted);">Unique identifier scoped per document type and organization</span>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Configuration Name <span style="color: var(--color-danger);">*</span>
              </label>
              <input 
                type="text" 
                name="name" 
                class="form-control" 
                required 
                value="${sourceConfig ? `Copy of ${sourceConfig.name}` : 'Custom Print Template'}" 
                placeholder="e.g. Standard Two-Wheeler Workshop Job Card"
              />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Page Size
                </label>
                <select name="page_size" class="form-control">
                  <option value="A4" selected>A4 (210 × 297 mm)</option>
                  <option value="A5">A5 (148 × 210 mm)</option>
                  <option value="Letter">Letter (8.5 × 11 in)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Orientation
                </label>
                <select name="orientation" class="form-control">
                  <option value="portrait" selected>Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Effective From
                </label>
                <input type="date" name="effective_from" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Template Source
                </label>
                <select name="template_source" class="form-control">
                  <option value="STANDARD" selected>Standard Two-Wheeler Service Preset</option>
                  <option value="BLANK">Minimal Blank Layout</option>
                  ${sourceConfig ? `<option value="COPY" selected>Copy from ${this.escapeHtml(sourceConfig.code)}</option>` : ''}
                </select>
              </div>
            </div>

            <div style="margin-bottom: 18px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Configuration Remarks / Notes
              </label>
              <textarea name="remarks" class="form-control" rows="2" placeholder="Brief note on applicability or design changes..."></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
              <button type="button" class="btn btn-secondary" onclick="window.DocPrintConfigModule.closeModal('doc-print-create-modal')">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" style="font-weight: 600;">
                Create & Open Designer
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  },

  handleDocTypeChangeInCreate(docType) {
    const codeInput = document.getElementById('doc-print-create-code');
    if (codeInput) {
      codeInput.value = this.generateNextConfigCode(docType);
    }
  },

  generateNextConfigCode(docType) {
    const all = this.getAllConfigs().filter(c => c.document_type === docType);
    const num = all.length + 1;
    return `DPC-${docType}-${String(num).padStart(3, '0')}`;
  },

  handleCreateSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);

    const docType = fd.get('document_type');
    const code = (fd.get('code') || '').trim().toUpperCase();
    const name = (fd.get('name') || '').trim();
    const facilityId = fd.get('facility_id') || 'ALL';
    const pageSize = fd.get('page_size') || 'A4';
    const orientation = fd.get('orientation') || 'portrait';
    const effectiveFrom = fd.get('effective_from') || new Date().toISOString().split('T')[0];
    const remarks = (fd.get('remarks') || '').trim();
    const copyFromId = fd.get('copy_from_id');
    const templateSource = fd.get('template_source');

    // Validation (BRD Section 11: BR-001, BR-002, BR-003)
    if (!code || !name) {
      window.State.showToast('Please provide Configuration Code and Name.', 'error');
      return;
    }

    const allConfigs = this.getAllConfigs();
    if (allConfigs.some(c => c.code.toUpperCase() === code)) {
      window.State.showToast(`Configuration Code "${code}" is already in use. Please enter a unique code.`, 'error');
      return;
    }

    let baseConfig = null;
    if (copyFromId) {
      baseConfig = allConfigs.find(c => c.id === copyFromId);
    }
    if (!baseConfig) {
      baseConfig = this.getDefaultTemplateConfig(docType, templateSource === 'BLANK');
    }

    const newId = `DPC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`;
    const newConfig = {
      id: newId,
      code: code,
      name: name,
      facility_id: facilityId,
      document_type: docType,
      version: '1.0',
      status: 'Draft',
      effective_from: effectiveFrom,
      remarks: remarks,
      created_by: window.State ? (window.State.getCurrentUser()?.name || 'Administrator') : 'Administrator',
      created_at: new Date().toISOString(),
      updated_by: window.State ? (window.State.getCurrentUser()?.name || 'Administrator') : 'Administrator',
      updated_at: new Date().toISOString(),
      page_settings: {
        page_size: pageSize,
        orientation: orientation,
        margin_top: 8,
        margin_bottom: 8,
        margin_left: 10,
        margin_right: 10,
        font_family: 'Inter, sans-serif',
        font_size: '11px',
        line_spacing: '1.3',
        primary_color: '#1e3a8a'
      },
      header_config: JSON.parse(JSON.stringify(baseConfig.header_config || {})),
      body_config: JSON.parse(JSON.stringify(baseConfig.body_config || {})),
      columns_config: JSON.parse(JSON.stringify(baseConfig.columns_config || [])),
      footer_config: JSON.parse(JSON.stringify(baseConfig.footer_config || {})),
      conditional_rules: JSON.parse(JSON.stringify(baseConfig.conditional_rules || []))
    };

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_configurations', newConfig);
    }

    // Add Audit Log
    this.addAuditLog(newId, 'CREATE', `Created new print configuration ${code} (${name}) as Draft.`);

    this.closeModal('doc-print-create-modal');
    window.State.showToast(`Configuration ${code} created successfully! Opening designer...`, 'success');

    // Immediately open full visual designer
    this.showDesignerModal(newId);
  },

  // 7. Template Designer Modal & Facility Selection Helpers
  getApplicableFacilities(config) {
    if (!config) return ['ALL'];
    if (Array.isArray(config.applicable_facilities) && config.applicable_facilities.length > 0) {
      return config.applicable_facilities;
    }
    if (typeof config.facility_id === 'string' && config.facility_id.includes(',')) {
      return config.facility_id.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [config.facility_id || 'ALL'];
  },

  getFacilityButtonLabel(selectedFacilities, facilities) {
    const plants = facilities.filter(f => f.id !== 'ALL');
    if (selectedFacilities.includes('ALL') || (plants.length > 0 && selectedFacilities.length >= plants.length)) {
      return 'All Facilities (Default)';
    }
    if (selectedFacilities.length === 0) {
      return 'Select Facilities';
    }
    if (selectedFacilities.length === 1) {
      const f = facilities.find(x => x.id === selectedFacilities[0]);
      return f ? (f.code ? `${f.code} (1 Fac)` : f.name) : selectedFacilities[0];
    }
    return `${selectedFacilities.length} Facilities Selected`;
  },

  getFacilitySubtitle(selectedFacilities, facilities) {
    const plants = facilities.filter(f => f.id !== 'ALL');
    if (selectedFacilities.includes('ALL') || (plants.length > 0 && selectedFacilities.length >= plants.length)) {
      return 'Company Default (All Facilities)';
    }
    return selectedFacilities.map(id => {
      const f = facilities.find(x => x.id === id);
      return f ? (f.code || f.name) : id;
    }).join(', ');
  },

  toggleFacilityDropdown(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('designer-facility-dropdown-menu');
    if (menu) {
      const isVisible = menu.style.display === 'block';
      menu.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        const closeHandler = (e) => {
          if (!menu.contains(e.target) && !e.target.closest('#designer-facility-dropdown-btn')) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeHandler);
          }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
      }
    }
  },

  handleFacilityCheckboxChange(facilityId, isChecked) {
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (!config) return;

    const facilities = this.getFacilities();
    const plantFacilities = facilities.filter(f => f.id !== 'ALL');
    let selected = this.getApplicableFacilities(config).slice();

    if (facilityId === 'ALL') {
      if (isChecked) {
        selected = ['ALL', ...plantFacilities.map(f => f.id)];
      } else {
        selected = [];
      }
    } else {
      if (isChecked) {
        if (!selected.includes(facilityId)) selected.push(facilityId);
        const allPlantsSelected = plantFacilities.length > 0 && plantFacilities.every(f => selected.includes(f.id));
        if (allPlantsSelected && !selected.includes('ALL')) {
          selected.push('ALL');
        }
      } else {
        selected = selected.filter(id => id !== facilityId && id !== 'ALL');
      }
    }

    if (selected.length === 0) {
      selected = ['ALL'];
    }

    config.applicable_facilities = selected;
    if (selected.includes('ALL')) {
      config.facility_id = 'ALL';
    } else {
      config.facility_id = selected.join(',');
    }
    config.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_configurations', config);
    }

    const labelEl = document.getElementById('designer-facility-btn-label');
    if (labelEl) {
      labelEl.textContent = this.getFacilityButtonLabel(selected, facilities);
    }

    const subTitleFacEl = document.getElementById('designer-header-facility-subtitle');
    if (subTitleFacEl) {
      subTitleFacEl.textContent = this.getFacilitySubtitle(selected, facilities);
    }

    const checkboxes = document.querySelectorAll('.designer-fac-checkbox');
    checkboxes.forEach(cb => {
      if (cb.value === 'ALL') {
        cb.checked = selected.includes('ALL');
      } else {
        cb.checked = selected.includes(cb.value) || selected.includes('ALL');
      }
    });

    this.refreshLivePreview();
    this.refreshTable();
  },

  handleDocNameChange(val) {
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (!config) return;
    config.name = val.trim() || 'Untitled Document';
    if (!config.header_config) config.header_config = {};
    config.header_config.doc_title = config.name;
    config.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_configurations', config);
    }

    const pageTabInput = document.getElementById('designer-metadata-template-name');
    if (pageTabInput && pageTabInput.value !== config.name) {
      pageTabInput.value = config.name;
    }
    const headerInput = document.getElementById('designer-header-doc-name');
    if (headerInput && headerInput.value !== config.name) {
      headerInput.value = config.name;
    }

    this.refreshLivePreview();
    this.refreshTable();
  },

  showDesignerModal(configId) {
    this.activeConfigId = configId;
    this.activeDesignerTab = 'page';
    this.renderDesignerModal();
  },

  renderDesignerModal() {
    if (typeof document === 'undefined') return;
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (!config) {
      if (window.State && typeof window.State.showToast === 'function') {
        window.State.showToast('Configuration record not found.', 'error');
      }
      return;
    }

    const facilities = this.getFacilities();
    const docTypeObj = this.DOC_TYPES.find(d => d.code === config.document_type) || { name: config.document_type, icon: '📄', color: '#2563eb' };
    const selectedFacilities = this.getApplicableFacilities(config);
    const facilityButtonLabel = this.getFacilityButtonLabel(selectedFacilities, facilities);
    const selectedFacilitySubtitle = this.getFacilitySubtitle(selectedFacilities, facilities);

    const modalTitle = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">🖨️</span>
        <span style="font-weight: 700; font-size: 14.5px; color: var(--text-primary);">Document Print Configuration Designer</span>
        <span class="cell-mono" style="font-size: 11px; background: rgba(0,0,0,0.06); padding: 2px 7px; border-radius: 4px; color: var(--primary-300); font-weight: 600; margin-left: 4px;">
          ${this.escapeHtml(config.code)}
        </span>
        <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: ${config.status === 'Published' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)'}; color: ${config.status === 'Published' ? '#059669' : '#d97706'}; border: 1px solid ${config.status === 'Published' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(217, 119, 6, 0.3)'};">
          ${config.status} (v${config.version || '1.0'})
        </span>
      </div>
    `;

    const contentHtml = `
      <div id="doc-print-designer-modal" style="display: flex; flex-direction: column; height: 100%; flex: 1; min-height: 0; background: var(--bg-surface, #ffffff);">
        
        <!-- Designer Top Control Subheader -->
        <div style="padding: 8px 16px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-secondary, #f8fafc); flex-wrap: wrap; gap: 10px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; position: relative;">
              <input 
                type="text" 
                id="designer-header-doc-name" 
                class="form-control form-control-sm" 
                value="${this.escapeHtml(config.name)}" 
                title="Click to edit document name"
                placeholder="Enter Document Name..." 
                style="font-size: 13.5px; font-weight: 700; width: 320px; height: 30px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 2px 26px 2px 8px; color: var(--text-primary);"
                oninput="window.DocPrintConfigModule.handleDocNameChange(this.value)"
              />
              <span style="position: absolute; right: 8px; font-size: 11px; color: var(--text-muted); pointer-events: none;" title="Editable Document Name">✏️</span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              Document Type: <b style="color: ${docTypeObj.color || 'var(--text-primary)'};">${docTypeObj.name}</b> &nbsp;|&nbsp; Applicable: <b id="designer-header-facility-subtitle" style="color: var(--text-secondary);">${selectedFacilitySubtitle}</b>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <!-- Facility Multi-Select Dropdown with Checkbox -->
            <div class="dropdown" style="position: relative; display: inline-block;">
              <button 
                type="button" 
                id="designer-facility-dropdown-btn" 
                class="btn btn-secondary btn-sm" 
                onclick="window.DocPrintConfigModule.toggleFacilityDropdown(event)" 
                style="height: 30px; font-size: 11.5px; font-weight: 600; display: flex; align-items: center; gap: 6px; padding: 2px 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); color: var(--text-primary);"
                title="Select applicable facilities for this document template"
              >
                <span style="font-size: 13px;">🏢</span>
                <span id="designer-facility-btn-label">${facilityButtonLabel}</span>
                <span style="font-size: 9px; opacity: 0.7;">▼</span>
              </button>
              
              <div 
                id="designer-facility-dropdown-menu" 
                style="display: none; position: absolute; top: calc(100% + 4px); right: 0; min-width: 300px; max-height: 290px; overflow-y: auto; background: var(--bg-surface, #ffffff); border: 1px solid var(--border-medium); border-radius: var(--radius-md, 6px); box-shadow: 0 10px 25px rgba(0,0,0,0.25); z-index: 1080; padding: 8px;"
              >
                <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 8px; margin-bottom: 4px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                  <span>Applicable Facilities</span>
                  <span style="font-size: 10px; font-weight: 500; color: var(--primary-300);">Select with checkbox</span>
                </div>

                ${facilities.map(f => {
                  const isChecked = selectedFacilities.includes(f.id) || (f.id !== 'ALL' && selectedFacilities.includes('ALL'));
                  return `
                    <label style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; margin-bottom: 2px;" onmouseover="this.style.background='var(--bg-hover, rgba(0,0,0,0.04))'" onmouseout="this.style.background='transparent'">
                      <input 
                        type="checkbox" 
                        class="designer-fac-checkbox" 
                        value="${f.id}" 
                        ${isChecked ? 'checked' : ''} 
                        onchange="window.DocPrintConfigModule.handleFacilityCheckboxChange('${f.id}', this.checked)"
                        style="accent-color: var(--primary-500, #3b82f6); cursor: pointer;"
                      />
                      <span style="flex: 1; color: var(--text-primary);">
                        ${f.id === 'ALL' ? '<strong>🏢 All Facilities</strong>' : `📍 ${f.name} <span class="cell-mono" style="font-size: 10px; color: var(--text-muted);">(${f.code})</span>`}
                      </span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.triggerDesignerPrintTest()" title="Send test page to printer" style="height: 30px; font-size: 11.5px; padding: 0 10px;">
              🖨️ Test Print
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.triggerDesignerPdfDownload()" title="Export PDF using html2pdf" style="height: 30px; font-size: 11.5px; padding: 0 10px;">
              📥 Export PDF
            </button>
          </div>
        </div>

        <!-- Designer Tabs Navigation -->
        <div style="display: flex; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface, #ffffff); padding: 0 14px; overflow-x: auto; gap: 4px; flex-shrink: 0;">
          <button class="tab-btn ${this.activeDesignerTab === 'page' ? 'active' : ''}" onclick="window.DocPrintConfigModule.switchDesignerTab('page')">
            ⚙️ Page & Typography
          </button>
          <button class="tab-btn ${this.activeDesignerTab === 'header' ? 'active' : ''}" onclick="window.DocPrintConfigModule.switchDesignerTab('header')">
            🏢 Header & Logo
          </button>
          <button class="tab-btn ${this.activeDesignerTab === 'body' ? 'active' : ''}" onclick="window.DocPrintConfigModule.switchDesignerTab('body')">
            📄 Body & Data Fields
          </button>
          <button class="tab-btn ${this.activeDesignerTab === 'columns' ? 'active' : ''}" onclick="window.DocPrintConfigModule.switchDesignerTab('columns')">
            📊 Table Columns
          </button>
          <button class="tab-btn ${this.activeDesignerTab === 'footer' ? 'active' : ''}" onclick="window.DocPrintConfigModule.switchDesignerTab('footer')">
            📝 Footer & Signatures
          </button>
          <button class="tab-btn ${this.activeDesignerTab === 'preview' ? 'active' : ''}" onclick="window.DocPrintConfigModule.switchDesignerTab('preview')">
            👁️ Full Live Preview
          </button>
        </div>

        <!-- Designer Main Work Area (Split: Left Config Controls, Right Real-Time Render Preview) -->
        <div style="display: flex; flex: 1; min-height: 0; overflow: hidden;">
          <!-- Left Controls Panel -->
          <div id="designer-controls-panel" style="width: 48%; min-width: 380px; border-right: 1px solid var(--border-subtle); overflow-y: auto; padding: 14px 18px;">
            ${this.renderDesignerTabContent(config)}
          </div>

          <!-- Right Live Preview Panel -->
          <div style="width: 52%; flex: 1; overflow-y: auto; background: #e2e8f0; padding: 16px; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 100%; max-width: 800px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">
                Real-Time Print Preview (${config.page_settings?.page_size || 'A4'} ${config.page_settings?.orientation || 'Portrait'})
              </span>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button 
                  class="btn btn-sm ${this.previewSampleMode === 'sample' ? 'btn-primary' : 'btn-secondary'}" 
                  style="padding: 2px 8px; font-size: 11px; height: 26px;"
                  onclick="window.DocPrintConfigModule.setPreviewSampleMode('sample')"
                >
                  Sample 2W Data
                </button>
                <button 
                  class="btn btn-sm ${this.previewSampleMode === 'live' ? 'btn-primary' : 'btn-secondary'}" 
                  style="padding: 2px 8px; font-size: 11px; height: 26px;"
                  onclick="window.DocPrintConfigModule.setPreviewSampleMode('live')"
                >
                  Live Database Record
                </button>
              </div>
            </div>

            <!-- Paper Sheet Simulator -->
            <div id="designer-preview-target" style="width: 100%; max-width: 794px; background: #ffffff; color: #0f172a; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border-radius: 2px; padding: ${(config.page_settings?.margin_top || 8)}mm ${(config.page_settings?.margin_right || 10)}mm ${(config.page_settings?.margin_bottom || 8)}mm ${(config.page_settings?.margin_left || 10)}mm; font-family: ${config.page_settings?.font_family || 'Inter, sans-serif'}; font-size: ${config.page_settings?.font_size || '11px'}; line-height: ${config.page_settings?.line_spacing || '1.3'};">
              ${this.renderDocumentHtml(config, this.getPreviewData(config))}
            </div>
          </div>
        </div>
      </div>
    `;

    const footerHtml = `
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
        <div style="font-size: 11.5px; color: var(--text-muted);">
          Changes saved in local browser state and PostgreSQL backend.
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.closeModal('doc-print-designer-modal')" style="height: 30px; font-size: 11.5px; padding: 0 14px;">
            Close
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.saveDraft()" style="height: 30px; font-size: 11.5px; padding: 0 14px;">
            💾 Save as Draft
          </button>
          ${config.status === 'Draft' ? `
            <button class="btn btn-secondary btn-sm" style="color: #2563eb; border-color: rgba(37, 99, 235, 0.4); height: 30px; font-size: 11.5px; padding: 0 14px;" onclick="window.DocPrintConfigModule.submitForApproval()">
              📤 Submit for Approval
            </button>
          ` : ''}
          ${(config.status === 'Pending Approval' || config.status === 'Draft') ? `
            <button class="btn btn-primary btn-sm" style="background: #059669; border-color: #059669; height: 30px; font-size: 11.5px; padding: 0 16px; font-weight: 600;" onclick="window.DocPrintConfigModule.publishFromDesigner()">
              🚀 Publish Live Template
            </button>
          ` : `
            <button class="btn btn-primary btn-sm" style="height: 30px; font-size: 11.5px; padding: 0 16px; font-weight: 600;" onclick="window.DocPrintConfigModule.republishFromDesigner()">
              🔄 Republish New Version
            </button>
          `}
        </div>
      </div>
    `;

    if (window.State && typeof window.State.showModal === 'function') {
      window.State.showModal({
        title: modalTitle,
        isFullScreen: true,
        maxWidth: '100vw',
        compactHeader: true,
        bodyPadding: '0',
        bodyFlex: true,
        noScroll: true,
        contentHtml,
        footerHtml
      });
    } else {
      this.mountModal(contentHtml);
    }
  },

  switchDesignerTab(tabKey) {
    this.activeDesignerTab = tabKey;
    const controlsPanel = document.getElementById('designer-controls-panel');
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (controlsPanel && config) {
      controlsPanel.innerHTML = this.renderDesignerTabContent(config);
    }
    const tabBtns = document.querySelectorAll('#doc-print-designer-modal .tab-btn');
    tabBtns.forEach(btn => {
      const isMatch = btn.getAttribute('onclick')?.includes(`'${tabKey}'`);
      if (isMatch) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  },

  renderDesignerTabContent(config) {
    const ps = config.page_settings || {};
    const hc = config.header_config || {};
    const bc = config.body_config || {};
    const cc = config.columns_config || [];
    const fc = config.footer_config || {};

    if (this.activeDesignerTab === 'page') {
      return `
        <div>
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: var(--text-primary);">
            Page Setup, Layout & Typography (BRD §8.10)
          </h4>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Page Size</label>
              <select class="form-control form-control-sm" onchange="window.DocPrintConfigModule.updateSetting('page_settings', 'page_size', this.value)">
                <option value="A4" ${ps.page_size === 'A4' ? 'selected' : ''}>A4 (210 × 297 mm)</option>
                <option value="A5" ${ps.page_size === 'A5' ? 'selected' : ''}>A5 (148 × 210 mm)</option>
                <option value="Letter" ${ps.page_size === 'Letter' ? 'selected' : ''}>Letter (8.5 × 11 in)</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Orientation</label>
              <select class="form-control form-control-sm" onchange="window.DocPrintConfigModule.updateSetting('page_settings', 'orientation', this.value)">
                <option value="portrait" ${ps.orientation === 'portrait' ? 'selected' : ''}>Portrait</option>
                <option value="landscape" ${ps.orientation === 'landscape' ? 'selected' : ''}>Landscape</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Page Margins (mm)</label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              <div>
                <span style="font-size: 10px; color: var(--text-muted);">Top</span>
                <input type="number" class="form-control form-control-sm" value="${ps.margin_top || 8}" onchange="window.DocPrintConfigModule.updateSetting('page_settings', 'margin_top', parseInt(this.value, 10))" />
              </div>
              <div>
                <span style="font-size: 10px; color: var(--text-muted);">Bottom</span>
                <input type="number" class="form-control form-control-sm" value="${ps.margin_bottom || 8}" onchange="window.DocPrintConfigModule.updateSetting('page_settings', 'margin_bottom', parseInt(this.value, 10))" />
              </div>
              <div>
                <span style="font-size: 10px; color: var(--text-muted);">Left</span>
                <input type="number" class="form-control form-control-sm" value="${ps.margin_left || 10}" onchange="window.DocPrintConfigModule.updateSetting('page_settings', 'margin_left', parseInt(this.value, 10))" />
              </div>
              <div>
                <span style="font-size: 10px; color: var(--text-muted);">Right</span>
                <input type="number" class="form-control form-control-sm" value="${ps.margin_right || 10}" onchange="window.DocPrintConfigModule.updateSetting('page_settings', 'margin_right', parseInt(this.value, 10))" />
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Font Family</label>
              <select class="form-control form-control-sm" onchange="window.DocPrintConfigModule.updateSetting('page_settings', 'font_family', this.value)">
                <option value="Inter, sans-serif" ${ps.font_family === 'Inter, sans-serif' ? 'selected' : ''}>Inter (Modern Sans)</option>
                <option value="Roboto, sans-serif" ${ps.font_family === 'Roboto, sans-serif' ? 'selected' : ''}>Roboto</option>
                <option value="Arial, sans-serif" ${ps.font_family === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
                <option value="'Courier New', monospace" ${ps.font_family === "'Courier New', monospace" ? 'selected' : ''}>Courier New (Draft)</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Base Font Size</label>
              <select class="form-control form-control-sm" onchange="window.DocPrintConfigModule.updateSetting('page_settings', 'font_size', this.value)">
                <option value="10px" ${ps.font_size === '10px' ? 'selected' : ''}>10px (Compact)</option>
                <option value="11px" ${ps.font_size === '11px' ? 'selected' : ''}>11px (Standard)</option>
                <option value="12px" ${ps.font_size === '12px' ? 'selected' : ''}>12px (Readable)</option>
                <option value="13px" ${ps.font_size === '13px' ? 'selected' : ''}>13px (Large)</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Primary Branding Color</label>
              <input type="color" class="form-control form-control-sm" value="${ps.primary_color || '#1e3a8a'}" onchange="window.DocPrintConfigModule.updateSetting('page_settings', 'primary_color', this.value)" style="height: 34px; padding: 2px;" />
            </div>

            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Line Spacing</label>
              <select class="form-control form-control-sm" onchange="window.DocPrintConfigModule.updateSetting('page_settings', 'line_spacing', this.value)">
                <option value="1.2" ${ps.line_spacing === '1.2' ? 'selected' : ''}>1.2 (Tight)</option>
                <option value="1.3" ${ps.line_spacing === '1.3' ? 'selected' : ''}>1.3 (Normal)</option>
                <option value="1.5" ${ps.line_spacing === '1.5' ? 'selected' : ''}>1.5 (Relaxed)</option>
              </select>
            </div>
          </div>

          <div style="margin-top: 18px; padding: 12px; background: rgba(0,0,0,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md, 6px);">
            <div style="font-weight: 600; font-size: 12px; color: var(--text-primary); margin-bottom: 6px;">Configuration Metadata</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <span style="font-size: 11px; color: var(--text-muted);">Template Name</span>
                <input type="text" id="designer-metadata-template-name" class="form-control form-control-sm" value="${this.escapeHtml(config.name)}" oninput="window.DocPrintConfigModule.handleDocNameChange(this.value)" />
              </div>
              <div>
                <span style="font-size: 11px; color: var(--text-muted);">Effective Date</span>
                <input type="date" class="form-control form-control-sm" value="${config.effective_from || ''}" onchange="window.DocPrintConfigModule.updateRootField('effective_from', this.value)" />
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeDesignerTab === 'header') {
      return `
        <div>
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: var(--text-primary);">
            Header & Branding Configuration (BRD §8.4)
          </h4>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Document Main Title</label>
            <input type="text" class="form-control form-control-sm" value="${this.escapeHtml(hc.doc_title || '')}" onchange="window.DocPrintConfigModule.updateSetting('header_config', 'doc_title', this.value)" placeholder="e.g. WORKSHOP JOB CARD" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Logo Placement</label>
              <select class="form-control form-control-sm" onchange="window.DocPrintConfigModule.updateSetting('header_config', 'logo_position', this.value)">
                <option value="left" ${hc.logo_position === 'left' ? 'selected' : ''}>Left (Beside Details)</option>
                <option value="center" ${hc.logo_position === 'center' ? 'selected' : ''}>Center (Above Details)</option>
                <option value="right" ${hc.logo_position === 'right' ? 'selected' : ''}>Right</option>
                <option value="none" ${hc.logo_position === 'none' ? 'selected' : ''}>Do Not Print Logo</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Header Alignment</label>
              <select class="form-control form-control-sm" onchange="window.DocPrintConfigModule.updateSetting('header_config', 'alignment', this.value)">
                <option value="left" ${hc.alignment === 'left' ? 'selected' : ''}>Left Aligned</option>
                <option value="center" ${hc.alignment === 'center' ? 'selected' : ''}>Center Aligned</option>
                <option value="right" ${hc.alignment === 'right' ? 'selected' : ''}>Right Aligned</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">Facility & Organization Details Visibility</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${hc.show_company_name !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('header_config', 'show_company_name', this.checked)" />
                Show Company Name
              </label>

              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${hc.show_facility_name !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('header_config', 'show_facility_name', this.checked)" />
                Show Facility Name
              </label>

              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${hc.show_facility_address !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('header_config', 'show_facility_address', this.checked)" />
                Show Facility Address
              </label>

              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${hc.show_contact_number !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('header_config', 'show_contact_number', this.checked)" />
                Show Contact Phone
              </label>

              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${hc.show_email !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('header_config', 'show_email', this.checked)" />
                Show Email Address
              </label>

              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${hc.show_gstin !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('header_config', 'show_gstin', this.checked)" />
                Show GSTIN & State Code
              </label>
            </div>

            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-subtle);">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; font-weight: 600; color: var(--text-primary);">
                <input type="checkbox" id="chk-show-next-service-date" ${hc.show_next_service_date ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('header_config', 'show_next_service_date', this.checked)" />
                Show Next Service Date
              </label>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
              <input type="checkbox" ${hc.show_separator_border !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('header_config', 'show_separator_border', this.checked)" />
              Print Header Separator Border Line
            </label>
          </div>
        </div>
      `;
    }

    if (this.activeDesignerTab === 'body') {
      return `
        <div>
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: var(--text-primary);">
            Body Sections & Dynamic Field Mapping (BRD §8.5, §8.7, §8.8)
          </h4>

          <div style="margin-bottom: 14px; padding: 10px; background: rgba(0,0,0,0.02); border-radius: 6px; border: 1px solid var(--border-subtle);">
            <div style="font-weight: 600; font-size: 12px; color: var(--text-primary); margin-bottom: 6px;">Customer Information Section</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_customer_name !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_customer_name', this.checked)" /> Customer Name
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_customer_mobile !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_customer_mobile', this.checked)" /> Mobile Number
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_customer_cin !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_customer_cin', this.checked)" /> CIN / Customer ID
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_customer_address !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_customer_address', this.checked)" /> Address & City
              </label>
            </div>
          </div>

          <div style="margin-bottom: 14px; padding: 10px; background: rgba(0,0,0,0.02); border-radius: 6px; border: 1px solid var(--border-subtle);">
            <div style="font-weight: 600; font-size: 12px; color: var(--text-primary); margin-bottom: 6px;">Vehicle Information Section</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_vehicle_reg !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_vehicle_reg', this.checked)" /> Registration No
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_vehicle_model !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_vehicle_model', this.checked)" /> Make & Model
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_odometer !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_odometer', this.checked)" /> Odometer Reading (km)
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_chassis !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_chassis', this.checked)" /> Chassis / VIN Number
              </label>
            </div>
          </div>

          <div style="margin-bottom: 14px; padding: 10px; background: rgba(0,0,0,0.02); border-radius: 6px; border: 1px solid var(--border-subtle);">
            <div style="font-weight: 600; font-size: 12px; color: var(--text-primary); margin-bottom: 6px;">Workshop & Operational Fields</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_complaints !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_complaints', this.checked)" /> Customer Complaints
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_technician !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_technician', this.checked)" /> Assigned Technician
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_advisor !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_advisor', this.checked)" /> Service Advisor
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_delivery_date !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_delivery_date', this.checked)" /> Promised Delivery Date
              </label>
            </div>
          </div>

          <div style="padding: 10px; background: rgba(0,0,0,0.02); border-radius: 6px; border: 1px solid var(--border-subtle);">
            <div style="font-weight: 600; font-size: 12px; color: var(--text-primary); margin-bottom: 6px;">Financial & Tax Summary Display</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_tax_breakup !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_tax_breakup', this.checked)" /> CGST & SGST Breakup
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_discount !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_discount', this.checked)" /> Conditional Discount Row
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_amount_in_words !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_amount_in_words', this.checked)" /> Amount in Words
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; cursor: pointer;">
                <input type="checkbox" ${bc.show_payment_mode !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('body_config', 'show_payment_mode', this.checked)" /> Payment Mode & Settlement
              </label>
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeDesignerTab === 'columns') {
      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--text-primary);">
              Table / Column Configuration (BRD §8.9)
            </h4>
            <span style="font-size: 11px; color: var(--text-muted);">Enable, rename, and align line-item columns</span>
          </div>

          <div style="border: 1px solid var(--border-subtle); border-radius: 6px; overflow: hidden;">
            <table class="data-table" style="width: 100%; font-size: 11.5px;">
              <thead style="background: var(--bg-surface-secondary, #f8fafc);">
                <tr>
                  <th style="width: 32px; text-align: center;">Show</th>
                  <th>Source Field</th>
                  <th>Display Label</th>
                  <th style="width: 90px;">Align</th>
                  <th style="width: 70px;">Width %</th>
                </tr>
              </thead>
              <tbody>
                ${cc.map((col, idx) => `
                  <tr>
                    <td style="text-align: center;">
                      <input 
                        type="checkbox" 
                        ${col.visible !== false ? 'checked' : ''} 
                        onchange="window.DocPrintConfigModule.updateColumn(${idx}, 'visible', this.checked)" 
                      />
                    </td>
                    <td style="font-family: monospace; color: var(--text-muted); font-size: 11px;">
                      ${col.field}
                    </td>
                    <td>
                      <input 
                        type="text" 
                        class="form-control form-control-sm" 
                        value="${this.escapeHtml(col.label || col.field)}" 
                        onchange="window.DocPrintConfigModule.updateColumn(${idx}, 'label', this.value)" 
                        style="padding: 2px 6px;"
                      />
                    </td>
                    <td>
                      <select class="form-control form-control-sm" style="padding: 2px 4px;" onchange="window.DocPrintConfigModule.updateColumn(${idx}, 'align', this.value)">
                        <option value="left" ${col.align === 'left' ? 'selected' : ''}>Left</option>
                        <option value="center" ${col.align === 'center' ? 'selected' : ''}>Center</option>
                        <option value="right" ${col.align === 'right' ? 'selected' : ''}>Right</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        class="form-control form-control-sm" 
                        value="${col.width || 10}" 
                        onchange="window.DocPrintConfigModule.updateColumn(${idx}, 'width', parseInt(this.value, 10))" 
                        style="padding: 2px 4px; text-align: center;"
                      />
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    if (this.activeDesignerTab === 'footer') {
      return `
        <div>
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: var(--text-primary);">
            Footer, Signatures & Legal Terms (BRD §8.6)
          </h4>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Terms & Conditions Text</label>
            <textarea class="form-control form-control-sm" rows="3" onchange="window.DocPrintConfigModule.updateSetting('footer_config', 'terms_conditions', this.value)">${this.escapeHtml(fc.terms_conditions || '')}</textarea>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Customer Declaration & Handover Statement</label>
            <textarea class="form-control form-control-sm" rows="2" onchange="window.DocPrintConfigModule.updateSetting('footer_config', 'customer_declaration', this.value)">${this.escapeHtml(fc.customer_declaration || '')}</textarea>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Signatory & Authorization Blocks</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${fc.show_customer_sign !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('footer_config', 'show_customer_sign', this.checked)" /> Customer Signature
              </label>

              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${fc.show_advisor_sign !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('footer_config', 'show_advisor_sign', this.checked)" /> Service Advisor Signature
              </label>

              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${fc.show_tech_sign !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('footer_config', 'show_tech_sign', this.checked)" /> Technician Signature
              </label>

              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${fc.show_auth_sign !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('footer_config', 'show_auth_sign', this.checked)" /> Authorized Signatory & Stamp
              </label>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">Thank You Greeting</label>
              <input type="text" class="form-control form-control-sm" value="${this.escapeHtml(fc.thank_you_msg || 'Thank you for choosing us! Ride safe.')}" onchange="window.DocPrintConfigModule.updateSetting('footer_config', 'thank_you_msg', this.value)" />
            </div>

            <div style="padding-top: 18px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${fc.show_timestamp !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('footer_config', 'show_timestamp', this.checked)" />
                Print Generation Timestamp
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; margin-top: 4px;">
                <input type="checkbox" ${fc.show_page_number !== false ? 'checked' : ''} onchange="window.DocPrintConfigModule.updateSetting('footer_config', 'show_page_number', this.checked)" />
                Print Page Number (e.g. Page 1 of 1)
              </label>
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeDesignerTab === 'preview') {
      return `
        <div>
          <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: var(--text-primary);">
            Document Print Preview & Inspection
          </h4>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
            Inspect dynamic formatting and line wrapping. The panel on the right renders exact paper layout with applied fonts and borders.
          </p>

          <div style="padding: 12px; background: rgba(0,0,0,0.02); border: 1px solid var(--border-subtle); border-radius: 6px; margin-bottom: 14px;">
            <div style="font-weight: 600; font-size: 12px; color: var(--text-primary); margin-bottom: 4px;">Quick Actions</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.triggerDesignerPrintTest()">🖨️ Send to Printer</button>
              <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.triggerDesignerPdfDownload()">📥 Download PDF</button>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  },

  // 8. Updating In-Memory Designer Settings
  updateSetting(section, key, value) {
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (!config) return;
    if (!config[section]) config[section] = {};
    config[section][key] = value;
    config.updated_at = new Date().toISOString();
    this.refreshLivePreview();
  },

  updateRootField(key, value) {
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (!config) return;
    config[key] = value;
    config.updated_at = new Date().toISOString();
    this.refreshLivePreview();
  },

  updateColumn(index, prop, value) {
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (!config || !Array.isArray(config.columns_config) || !config.columns_config[index]) return;
    config.columns_config[index][prop] = value;
    config.updated_at = new Date().toISOString();
    this.refreshLivePreview();
  },

  setPreviewSampleMode(mode) {
    this.previewSampleMode = mode;
    this.refreshLivePreview();
  },

  refreshLivePreview() {
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    const target = document.getElementById('designer-preview-target');
    if (config && target) {
      target.style.padding = `${(config.page_settings?.margin_top || 8)}mm ${(config.page_settings?.margin_right || 10)}mm ${(config.page_settings?.margin_bottom || 8)}mm ${(config.page_settings?.margin_left || 10)}mm`;
      target.style.fontFamily = config.page_settings?.font_family || 'Inter, sans-serif';
      target.style.fontSize = config.page_settings?.font_size || '11px';
      target.style.lineHeight = config.page_settings?.line_spacing || '1.3';
      target.innerHTML = this.renderDocumentHtml(config, this.getPreviewData(config));
    }
  },

  // 9. Document HTML Rendering Engine (BRD Section 8.4 - 8.10, 8.17)
  renderDocumentHtml(config, data) {
    if (!config) return '<div>No template configuration found.</div>';
    if (!data) data = this.getSampleData(config.document_type);

    const ps = config.page_settings || {};
    const hc = config.header_config || {};
    const bc = config.body_config || {};
    const cc = (config.columns_config || []).filter(c => c.visible !== false);
    const fc = config.footer_config || {};
    const primaryColor = ps.primary_color || '#1e3a8a';

    // 1. Header Section
    const facilityName = data.facility_name || 'Mauli Service Center 1';
    const facilityAddress = data.facility_address || 'Plot No. 12, Sector 3, Pune Main Road, Pune - 411001';
    const facilityContact = data.facility_mobile || '9822012345';
    const facilityEmail = data.facility_email || 'service@mauliservice.com';
    const facilityGstin = data.facility_gstin || '';

    const headerHtml = `
      <div style="border-bottom: ${hc.show_separator_border !== false ? `2px solid ${primaryColor}` : 'none'}; padding-bottom: 8px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px;">
          ${hc.logo_position === 'left' ? `
            <div style="display: flex; align-items: center; justify-content: center; width: 70px; height: 70px; border-radius: 6px; background: rgba(30, 58, 138, 0.08); border: 1px solid rgba(30, 58, 138, 0.2); flex-shrink: 0;">
              <span style="font-size: 32px;">🏍️</span>
            </div>
          ` : ''}

          <div style="flex: 1; text-align: ${hc.alignment || 'left'};">
            ${hc.show_company_name !== false ? `
              <div style="font-size: 16px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                ${this.escapeHtml(data.company_name || 'Mauli Auto Enterprises Pvt Ltd')}
              </div>
            ` : ''}

            ${hc.show_facility_name !== false ? `
              <div style="font-size: 13px; font-weight: 700; color: #111827; margin-top: 1px;">
                ${this.escapeHtml(facilityName)}
              </div>
            ` : ''}

            ${hc.show_facility_address !== false ? `
              <div style="font-size: 10.5px; color: #4b5563; margin-top: 1px;">
                ${this.escapeHtml(facilityAddress)}
              </div>
            ` : ''}

            <div style="font-size: 10.5px; color: #4b5563; margin-top: 1px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: ${hc.alignment === 'center' ? 'center' : (hc.alignment === 'right' ? 'flex-end' : 'flex-start')};">
              ${hc.show_contact_number !== false ? `<span><b>Tel:</b> ${facilityContact}</span>` : ''}
              ${hc.show_email !== false ? `<span><b>Email:</b> ${facilityEmail}</span>` : ''}
              ${(hc.show_gstin !== false && facilityGstin) ? `<span><b>GSTIN:</b> ${this.escapeHtml(facilityGstin)}</span>` : ''}
            </div>
          </div>

          <div style="text-align: right; flex-shrink: 0; min-width: 170px;">
            <div style="font-size: 13.5px; font-weight: 800; color: ${primaryColor}; border: 1px solid ${primaryColor}; padding: 3px 8px; border-radius: 4px; display: inline-block; background: rgba(30,58,138,0.04);">
              ${this.escapeHtml(hc.doc_title || 'DOCUMENT')}
            </div>
            <div style="font-size: 11px; margin-top: 4px;">
              <b>No:</b> <span style="font-family: monospace; font-weight: 700;">${data.document_number || 'DOC/2026/001'}</span>
            </div>
            <div style="font-size: 11px; color: #4b5563;">
              <b>Date:</b> ${data.document_date ? (window.formatDate ? window.formatDate(data.document_date) : data.document_date) : '28-10-2026'}
            </div>
            ${hc.show_next_service_date ? `
              <div style="font-size: 11px; color: #1e40af; font-weight: 700; margin-top: 2px;">
                <b>Next Service Date:</b> ${data.next_service_date || data.next_service_due_date ? (window.formatDate ? window.formatDate(data.next_service_date || data.next_service_due_date) : (data.next_service_date || data.next_service_due_date)) : '19-01-2027'}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // 2. Body Details (Context-aware: Customer & Vehicle for Workshop/Billing, Vendor & Order for PO/GRN, Transit for Transfer/Dispatch)
    let bodyDetailsHtml = '';
    const isProcurement = config.document_type === 'PO' || config.document_type === 'GRN';
    const isLogistics = config.document_type === 'TRANSFER' || config.document_type === 'DISPATCH';

    if (isProcurement) {
      bodyDetailsHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; font-size: 11px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 10px;">
          <div>
            <div style="font-weight: 700; color: #1e293b; text-transform: uppercase; font-size: 10.5px; margin-bottom: 3px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;">
              Vendor / Supplier Particulars
            </div>
            <div><b>Supplier:</b> ${this.escapeHtml(data.customer_name || 'Vendor')}</div>
            ${data.customer_mobile ? `<div><b>Contact:</b> ${this.escapeHtml(data.customer_mobile)}</div>` : ''}
            ${data.customer_address ? `<div><b>Address:</b> ${this.escapeHtml(data.customer_address)}</div>` : ''}
          </div>
          <div>
            <div style="font-weight: 700; color: #1e293b; text-transform: uppercase; font-size: 10.5px; margin-bottom: 3px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;">
              Order & Commercial Terms
            </div>
            <div><b>Expected Date:</b> ${data.delivery_date || data.document_date ? (window.formatDate ? window.formatDate(data.delivery_date || data.document_date) : this.escapeHtml(data.delivery_date || data.document_date)) : '—'}</div>
            <div><b>Payment Terms:</b> ${this.escapeHtml(data.payment_mode || 'Net 30 Days')}</div>
            <div><b>Authorized By:</b> ${this.escapeHtml(data.advisor_name || 'Procurement Head')}</div>
          </div>
        </div>
      `;
    } else if (isLogistics) {
      bodyDetailsHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; font-size: 11px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 10px;">
          <div>
            <div style="font-weight: 700; color: #1e293b; text-transform: uppercase; font-size: 10.5px; margin-bottom: 3px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;">
              Movement & Destination Info
            </div>
            <div><b>Consignee / Dest:</b> ${this.escapeHtml(data.customer_name || data.facility_name || 'Destination Store')}</div>
            ${data.customer_address ? `<div><b>Route / Address:</b> ${this.escapeHtml(data.customer_address)}</div>` : ''}
          </div>
          <div>
            <div style="font-weight: 700; color: #1e293b; text-transform: uppercase; font-size: 10.5px; margin-bottom: 3px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;">
              Security & Transit Authorization
            </div>
            <div><b>Gate Pass Date:</b> ${data.document_date ? (window.formatDate ? window.formatDate(data.document_date) : this.escapeHtml(data.document_date)) : '—'}</div>
            ${data.vehicle_reg ? `<div><b>Vehicle Reg:</b> <span style="font-family: monospace; font-weight: 700;">${this.escapeHtml(data.vehicle_reg)}</span></div>` : ''}
            <div><b>Status:</b> <span style="color: #059669; font-weight: 700;">AUTHORIZED EXIT</span></div>
          </div>
        </div>
      `;
    } else {
      bodyDetailsHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; font-size: 11px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 10px;">
          <!-- Left: Customer info -->
          <div>
            <div style="font-weight: 700; color: #1e293b; text-transform: uppercase; font-size: 10.5px; margin-bottom: 3px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;">
              Customer Particulars
            </div>
            ${bc.show_customer_name !== false ? `<div><b>Name:</b> ${this.escapeHtml(data.customer_name || 'Suresh Patil')}</div>` : ''}
            ${bc.show_customer_mobile !== false ? `<div><b>Mobile:</b> ${this.escapeHtml(data.customer_mobile || '9890123456')}</div>` : ''}
            ${bc.show_customer_cin !== false ? `<div><b>CIN:</b> ${this.escapeHtml(data.customer_cin || 'CIN-MH-1234')}</div>` : ''}
            ${bc.show_customer_address !== false ? `<div><b>Address:</b> ${this.escapeHtml(data.customer_address || 'Kothrud, Pune - 411038')}</div>` : ''}
          </div>

          <!-- Right: Vehicle Info -->
          <div>
            <div style="font-weight: 700; color: #1e293b; text-transform: uppercase; font-size: 10.5px; margin-bottom: 3px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;">
              Vehicle Details
            </div>
            ${bc.show_vehicle_reg !== false ? `<div><b>Reg No:</b> <span style="font-family: monospace; font-weight: 700;">${this.escapeHtml(data.vehicle_reg || 'MH-12-AB-1234')}</span></div>` : ''}
            ${bc.show_vehicle_model !== false ? `<div><b>Model:</b> ${this.escapeHtml(data.vehicle_model || 'Honda Activa 6G (Matte Black)')}</div>` : ''}
            ${bc.show_odometer !== false ? `<div><b>Odometer:</b> ${this.escapeHtml(data.odometer || '0 km')}</div>` : ''}
            ${bc.show_chassis !== false ? `<div><b>Chassis:</b> ${this.escapeHtml(data.chassis_no || 'ME4JF50XXXXX987')}</div>` : ''}
          </div>
        </div>

        ${bc.show_complaints !== false && data.complaints ? `
          <div style="margin-bottom: 10px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; background: #ffffff;">
            <div style="font-weight: 700; color: #1e293b; font-size: 10.5px; margin-bottom: 2px;">Customer Reported Complaints / Scope of Work:</div>
            <div style="color: #334155;">${this.escapeHtml(data.complaints)}</div>
          </div>
        ` : ''}
      `;
    }

    // Specialized Vehicle Handover Details for Delivery Gate Pass (GP)
    if (config.document_type === 'GP') {
      const isReprint = Number(data.reprint_count || 0) > 0;
      const lastReprint = isReprint && Array.isArray(data.reprint_history) && data.reprint_history.length > 0
        ? data.reprint_history[data.reprint_history.length - 1]
        : null;

      bodyDetailsHtml += `
        ${isReprint ? `
          <div style="background: #fef3c7; border: 1.5px solid #f59e0b; border-radius: 4px; padding: 5px 10px; margin-bottom: 10px; font-size: 10.5px; color: #92400e; font-weight: 700; display: flex; justify-content: space-between; align-items: center;">
            <span>⚠️ REPRINT / DUPLICATE COPY #${data.reprint_count} (Original Gate Pass: ${this.escapeHtml(data.document_number)})</span>
            <span>Reprinted: ${lastReprint ? (lastReprint.date_display || lastReprint.date_time) : ''} by ${lastReprint ? (lastReprint.reprinted_by || '') : ''}</span>
          </div>
        ` : ''}

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; font-size: 11px;">
          <div style="font-weight: 700; color: #166534; text-transform: uppercase; font-size: 10.5px; margin-bottom: 6px; border-bottom: 1px dashed #bbf7d0; padding-bottom: 3px; display: flex; justify-content: space-between;">
            <span>Vehicle Handover Details</span>
            <span style="color: #15803d; font-weight: 800;">✓ STATUS: VEHICLE DELIVERED</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px;">
            <div><b>Delivered To:</b> ${this.escapeHtml(data.delivered_to || 'Customer')}</div>
            <div><b>Receiver Name:</b> <strong>${this.escapeHtml(data.receiver_name || data.customer_name || 'Customer')}</strong></div>
            <div><b>Receiver Mobile:</b> ${this.escapeHtml(data.receiver_mobile || data.customer_mobile || '—')}</div>
            <div><b>Relationship:</b> ${this.escapeHtml(data.relationship || 'Self')}</div>
            ${data.id_proof_type && data.id_proof_type !== 'None / Not Required' ? `
              <div><b>ID Proof:</b> ${this.escapeHtml(data.id_proof_type)}${data.id_proof_number ? ` (${this.escapeHtml(data.id_proof_number)})` : ''}</div>
            ` : '<div><b>ID Proof:</b> Verified at Handover</div>'}
            <div><b>Handover Date & Time:</b> ${this.escapeHtml(data.handover_datetime || data.delivery_date || data.document_date || '—')}</div>
            <div><b>Delivered By (Officer):</b> ${this.escapeHtml(data.delivered_by || data.advisor_name || 'Service Staff')}</div>
            <div><b>Security Verified By:</b> ${this.escapeHtml(data.security_verified_by || 'Gate Security Guard')}</div>
            <div><b>Linked Job Card:</b> <span style="font-family: monospace; font-weight: 700;">${this.escapeHtml(data.job_card_no || '—')}</span></div>
            <div><b>Latest Bill Revision Ref:</b> <span style="font-family: monospace; font-weight: 700; color: #2563eb;">${this.escapeHtml(data.invoice_no || '—')}${data.bill_revision_no ? ` (Rev R${data.bill_revision_no})` : ''}</span></div>
          </div>
          ${data.delivery_remarks ? `
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #bbf7d0; color: #374151; font-size: 10.5px;">
              <b>Delivery Remarks:</b> ${this.escapeHtml(data.delivery_remarks)}
            </div>
          ` : ''}
          ${data.credit_authorized_by ? `
            <div style="margin-top: 6px; padding: 4px 8px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 4px; font-size: 10px; color: #b45309;">
              ⚠️ <b>Credit Release Authorized by:</b> ${this.escapeHtml(data.credit_authorized_by)} &bull; <b>Reason:</b> ${this.escapeHtml(data.credit_authorization_reason || 'Approved credit handover')}
            </div>
          ` : ''}
        </div>
      `;
    }

    // 3. Line Items Table
    const items = data.items || [];
    const tableHtml = `
      <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
          <thead style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
            <tr>
              ${cc.map(c => `
                <th style="padding: 6px 8px; text-align: ${c.align || 'left'}; font-weight: 700; color: #1e293b; width: ${c.width ? c.width + '%' : 'auto'}; border-right: 1px solid #e2e8f0;">
                  ${this.escapeHtml(c.label || c.field)}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${items.length === 0 ? `
              <tr><td colspan="${cc.length}" style="text-align: center; padding: 12px; color: #64748b;">No line items recorded.</td></tr>
            ` : items.map((it, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                ${cc.map(c => {
                  let val = '';
                  if (c.field === 'sr_no') val = idx + 1;
                  else if (c.field === 'item_code') val = `<span style="font-family: monospace;">${it.code || '-'}</span>`;
                  else if (c.field === 'description') val = `<b>${it.description || it.name || '-'}</b>`;
                  else if (c.field === 'type') val = it.type || 'Part';
                  else if (c.field === 'hsn_sac') val = it.hsn || '8714';
                  else if (c.field === 'qty') val = it.qty || 1;
                  else if (c.field === 'uom') val = it.uom || 'NOS';
                  else if (c.field === 'rate') val = (parseFloat(it.rate || 0)).toFixed(2);
                  else if (c.field === 'discount') val = (parseFloat(it.discount || 0)).toFixed(2);
                  else if (c.field === 'taxable') val = (parseFloat(it.taxable || (it.qty * it.rate))).toFixed(2);
                  else if (c.field === 'tax_pct') {
                    const itemTax = it.tax_pct !== undefined ? it.tax_pct : (it.tax_rate !== undefined ? it.tax_rate : (data.tax_rate !== undefined ? data.tax_rate : 0));
                    val = `${itemTax}%`;
                  }
                  else if (c.field === 'payment_mode') val = it.payment_mode || it.type || data.payment_mode || 'Cash';
                  else if (c.field === 'total') val = `<b>${(parseFloat(it.total || (it.qty * it.rate))).toFixed(2)}</b>`;
                  else val = it[c.field] !== undefined ? it[c.field] : '-';

                  return `
                    <td style="padding: 5px 8px; text-align: ${c.align || 'left'}; border-right: 1px solid #e2e8f0; color: #334155;">
                      ${val}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // 4. Totals and Tax Summary
    let totalsHtml = '';
    if (config.document_type === 'RCPT') {
      const isSettled = Number(data.remaining_outstanding || 0) <= 0;
      totalsHtml = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
          <div style="width: 320px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 12px; font-size: 11px; background: #ffffff;">
            ${data.total_bill_amount !== undefined ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #64748b;">Total Bill Net Amount:</span>
                <span class="cell-mono font-bold">₹${Number(data.total_bill_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            ${data.previous_outstanding !== undefined ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #64748b;">Previous Outstanding:</span>
                <span class="cell-mono">₹${Number(data.previous_outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 5px; margin-top: 4px; font-weight: 800; font-size: 13px; color: ${primaryColor};">
              <span>Amount Paid:</span>
              <span class="cell-mono font-bold">₹${Number(data.amount_paid !== undefined ? data.amount_paid : (data.grand_total || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            ${data.remaining_outstanding !== undefined ? `
              <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; font-weight: 600; color: ${isSettled ? '#059669' : '#dc2626'};">
                <span>Remaining Balance Due:</span>
                <span class="cell-mono">₹${Number(data.remaining_outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${isSettled ? 'Fully Settled' : 'Outstanding'})</span>
              </div>
            ` : ''}
            ${bc.show_amount_in_words !== false ? `
              <div style="font-size: 9.5px; color: #64748b; font-style: italic; margin-top: 4px; text-align: right; border-top: 1px dashed #e2e8f0; padding-top: 3px;">
                ${this.numberToWords(data.amount_paid !== undefined ? data.amount_paid : (data.grand_total || 0))}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } else if (config.document_type === 'GP') {
      const isSettled = Number(data.balance_due || 0) <= 0;
      totalsHtml = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
          <div style="width: 320px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 12px; font-size: 11px; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748b;">Job Card Status:</span>
              <span style="color: #059669; font-weight: 700;">✓ Repairs Completed &amp; QC Passed</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748b;">Commercial Settlement:</span>
              <span style="font-weight: 700; color: ${isSettled ? '#059669' : '#d97706'};">
                ${isSettled ? '✓ Fully Settled (₹0.00 Due)' : `⚠️ Credit Delivery (Due: ₹${Number(data.balance_due).toFixed(2)})`}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 5px; margin-top: 4px; font-weight: 800; font-size: 12px; color: ${primaryColor};">
              <span>Exit Clearance:</span>
              <span style="color: #059669; font-weight: 800;">AUTHORIZED FOR EXIT</span>
            </div>
          </div>
        </div>
      `;
    } else {
      const partsVal = parseFloat(data.parts_total !== undefined && data.parts_total !== null ? data.parts_total : 0);
      const labourVal = parseFloat(data.labour_total !== undefined && data.labour_total !== null ? data.labour_total : 0);
      const discountVal = parseFloat(data.discount_total !== undefined && data.discount_total !== null ? data.discount_total : 0);
      const taxableVal = parseFloat(data.taxable_amount !== undefined && data.taxable_amount !== null ? data.taxable_amount : Math.max(0, partsVal + labourVal - discountVal));
      
      const taxRate = parseFloat(data.tax_rate !== undefined && data.tax_rate !== null ? data.tax_rate : 0);
      const cgstRate = parseFloat(data.cgst_rate !== undefined && data.cgst_rate !== null ? data.cgst_rate : (taxRate / 2));
      const sgstRate = parseFloat(data.sgst_rate !== undefined && data.sgst_rate !== null ? data.sgst_rate : (taxRate / 2));
      const cgstAmt = parseFloat(data.cgst_amount !== undefined && data.cgst_amount !== null ? data.cgst_amount : (taxableVal * (cgstRate / 100)));
      const sgstAmt = parseFloat(data.sgst_amount !== undefined && data.sgst_amount !== null ? data.sgst_amount : (taxableVal * (sgstRate / 100)));
      const totalTax = parseFloat(data.tax_amount !== undefined && data.tax_amount !== null ? data.tax_amount : (cgstAmt + sgstAmt));
      const grandTotalVal = parseFloat(data.grand_total !== undefined && data.grand_total !== null ? data.grand_total : (taxableVal + totalTax));

      const docTotalLabel = config.document_type === 'EST' ? 'Estimated Total:' : (
        config.document_type === 'INV' ? 'Net Invoice Total:' : (
        config.document_type === 'DB' ? 'Draft Bill Total:' : 'Grand Total:'
      ));

      totalsHtml = `
      <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
        <div style="width: 290px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 12px; font-size: 11px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748b;">Parts Subtotal:</span>
            <span>₹${partsVal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748b;">Labour Subtotal:</span>
            <span>₹${labourVal.toFixed(2)}</span>
          </div>
          ${bc.show_discount !== false && discountVal > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #d97706;">
              <span>Discount Allowed:</span>
              <span>-₹${discountVal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #334155; font-weight: 600;">
              <span>Taxable Value:</span>
              <span>₹${taxableVal.toFixed(2)}</span>
            </div>
          ` : ''}
          ${bc.show_tax_breakup !== false ? `
            ${(taxRate > 0 || totalTax > 0) ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px; color: #64748b;">
                <span>CGST (${cgstRate}%):</span>
                <span>₹${cgstAmt.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 10px; color: #64748b;">
                <span>SGST (${sgstRate}%):</span>
                <span>₹${sgstAmt.toFixed(2)}</span>
              </div>
            ` : `
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 10px; color: #64748b;">
                <span>Tax Rate (0% GST):</span>
                <span>₹0.00</span>
              </div>
            `}
          ` : ''}
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 4px; font-weight: 800; font-size: 12.5px; color: ${primaryColor};">
            <span>${docTotalLabel}</span>
            <span>₹${grandTotalVal.toFixed(2)}</span>
          </div>
          ${(config.document_type === 'INV' || config.document_type === 'DB') && (data.amount_paid !== undefined && Number(data.amount_paid) > 0) ? `
            <div style="display: flex; justify-content: space-between; margin-top: 3px; color: #10b981; font-weight: 600; font-size: 10.5px;">
              <span>Amount Paid:</span>
              <span>₹${parseFloat(data.amount_paid).toFixed(2)}</span>
            </div>
          ` : ''}
          ${(config.document_type === 'INV' || config.document_type === 'DB') && (data.balance_due !== undefined && Number(data.balance_due) > 0) ? `
            <div style="display: flex; justify-content: space-between; margin-top: 2px; color: #ef4444; font-weight: 700; font-size: 10.5px;">
              <span>Balance Due:</span>
              <span>₹${parseFloat(data.balance_due).toFixed(2)}</span>
            </div>
          ` : ''}
          ${bc.show_amount_in_words !== false ? `
            <div style="font-size: 9.5px; color: #64748b; font-style: italic; margin-top: 3px; text-align: right;">
              ${this.numberToWords(grandTotalVal)}
            </div>
          ` : ''}
        </div>
      </div>
      `;
    }

    // 5. Footer & Signatures Section
    const footerHtml = `
      <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: auto; font-size: 10px;">
        ${fc.terms_conditions ? `
          <div style="margin-bottom: 8px; color: #64748b;">
            <b>Terms & Conditions:</b> ${this.escapeHtml(fc.terms_conditions)}
          </div>
        ` : ''}

        ${fc.customer_declaration ? `
          <div style="margin-bottom: 8px; color: #64748b;">
            <b>Declaration:</b> ${this.escapeHtml(fc.customer_declaration)}
          </div>
        ` : ''}

        ${config.document_type === 'GP' ? `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 24px; text-align: center; font-size: 10.5px;">
            <div style="border-top: 1px dashed #94a3b8; padding-top: 4px;">
              <b>Customer / Receiver Signature</b>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${this.escapeHtml(data.receiver_name || data.customer_name || 'Receiver')} (${this.escapeHtml(data.customer_signature_type || 'Digital / Physical')})</div>
            </div>
            <div style="border-top: 1px dashed #94a3b8; padding-top: 4px;">
              <b>Delivered By (Workshop Staff)</b>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${this.escapeHtml(data.delivered_by || 'Delivered By')}</div>
            </div>
            <div style="border-top: 1px dashed #94a3b8; padding-top: 4px;">
              <b>Security Gate Clearance</b>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${this.escapeHtml(data.security_verified_by || 'Gate Security Guard')}</div>
            </div>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 24px; text-align: center; font-size: 10.5px;">
            ${fc.show_customer_sign !== false ? `
              <div style="border-top: 1px dashed #94a3b8; padding-top: 4px;">
                <b>Customer Signature</b>
              </div>
            ` : '<div></div>'}

            ${fc.show_advisor_sign !== false ? `
              <div style="border-top: 1px dashed #94a3b8; padding-top: 4px;">
                <b>Service Advisor</b>
              </div>
            ` : '<div></div>'}

            ${fc.show_auth_sign !== false ? `
              <div style="border-top: 1px dashed #94a3b8; padding-top: 4px;">
                <b>Authorized Signatory</b>
              </div>
            ` : '<div></div>'}
          </div>
        `}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; color: #94a3b8; font-size: 9.5px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
          <div>${fc.thank_you_msg || 'Thank you for choosing us! Ride safe.'}</div>
          ${fc.show_timestamp !== false ? `<div>Generated: ${window.formatDateTime ? window.formatDateTime(new Date()) : new Date().toLocaleString()}</div>` : ''}
          ${fc.show_page_number !== false ? `<div>Page 1 of 1</div>` : ''}
        </div>
      </div>
    `;

    return `
      <div class="print-document-root" style="color: #0f172a; width: 100%;">
        ${headerHtml}
        ${bodyDetailsHtml}
        ${tableHtml}
        ${totalsHtml}
        ${footerHtml}
      </div>
    `;
  },

  // 10. Preview Data Generator
  getPreviewData(config) {
    let data;
    if (this.previewSampleMode === 'live') {
      data = this.getLiveDbTransactionData(config.document_type);
    }
    if (!data) {
      data = JSON.parse(JSON.stringify(this.getSampleData(config.document_type)));
    }
    const appFacs = this.getApplicableFacilities(config);
    const targetFacId = appFacs.find(id => id !== 'ALL') || (config.facility_id !== 'ALL' ? config.facility_id : null);
    if (targetFacId && window.DB && typeof window.DB.getById === 'function') {
      const plant = window.DB.getById('plants', targetFacId);
      if (plant) {
        data.facility_name = plant.name;
        data.facility_address = `${plant.address || ''}, ${plant.city || 'Pune'}${plant.pincode ? ` - ${plant.pincode}` : ''}`;
        if (plant.mobile || plant.mobile_number) data.facility_mobile = plant.mobile || plant.mobile_number;
        if (plant.email) data.facility_email = plant.email;
        if (plant.gstin) data.facility_gstin = plant.gstin;
      }
    }
    return data;
  },

  getSampleData(docType) {
    if (docType === 'JC') {
      return {
        company_name: 'Mauli Auto Enterprises Pvt Ltd',
        facility_name: 'Mauli Service Center 1 - Pune Main',
        facility_address: 'Plot No. 12, Sector 3, Pune Main Road, Pune - 411001',
        facility_mobile: '9822012345',
        facility_email: 'pune.service@mauliservice.com',
        facility_gstin: '27AABCT2345M1Z9',
        document_number: 'JC/PUN/2026/000108',
        document_date: '19-Oct-2026',
        customer_name: 'Suresh M. Patil',
        customer_mobile: '9890123456',
        customer_cin: 'CIN-PUN-0982',
        customer_address: 'Flat 402, Shivajinagar, Pune - 411005',
        vehicle_reg: 'MH-12-AB-1234',
        vehicle_model: 'Honda Activa 6G (Matte Steel Black)',
        odometer: '12,480 km',
        chassis_no: 'ME4JF5048NXXXX876',
        complaints: '1. Periodic 12,000 km general service. 2. Front disc brake squeaking noise. 3. Engine oil replacement and throttle body cleaning.',
        parts_total: 680.00,
        labour_total: 450.00,
        discount_total: 0.00,
        taxable_amount: 1130.00,
        tax_rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        cgst_amount: 0.00,
        sgst_amount: 0.00,
        grand_total: 1130.00,
        items: [
          { code: 'OIL-4T-10W30', description: 'Engine Oil 4T 10W-30 (800ml)', type: 'Part', hsn: '2710', qty: 1, uom: 'BTL', rate: 420.00, tax_pct: 0, total: 420.00 },
          { code: 'PAD-BRK-FRT', description: 'Front Disc Brake Pad Set', type: 'Part', hsn: '8714', qty: 1, uom: 'SET', rate: 260.00, tax_pct: 0, total: 260.00 },
          { code: 'LBR-GEN-SRV', description: 'General Periodic Maintenance Labour', type: 'Labour', hsn: '9987', qty: 1, uom: 'JOB', rate: 350.00, tax_pct: 0, total: 350.00 },
          { code: 'LBR-BRK-CLN', description: 'Brake Caliper Servicing & Cleaning', type: 'Labour', hsn: '9987', qty: 1, uom: 'JOB', rate: 100.00, tax_pct: 0, total: 100.00 }
        ]
      };
    } else if (docType === 'EST') {
      return {
        company_name: 'Mauli Auto Enterprises Pvt Ltd',
        facility_name: 'Mauli Service Center 1 - Pune Main',
        facility_address: 'Plot No. 12, Sector 3, Pune Main Road, Pune - 411001',
        facility_mobile: '9822012345',
        facility_email: 'pune.service@mauliservice.com',
        facility_gstin: '27AABCT2345M1Z9',
        document_number: 'EST/PUN/2026/000045',
        document_date: '19-Oct-2026',
        customer_name: 'Amit Sharma',
        customer_mobile: '9822998877',
        customer_cin: 'CIN-PUN-0412',
        customer_address: 'Kalyani Nagar, Pune - 411006',
        vehicle_reg: 'MH-14-GH-5566',
        vehicle_model: 'Bajaj Pulsar 150 Dtsi',
        odometer: '28,140 km',
        chassis_no: 'MD2DS150BXXXX990',
        complaints: 'Clutch slip and chain sprocket worn out. Request estimate before starting work.',
        parts_total: 1850.00,
        labour_total: 600.00,
        discount_total: 100.00,
        taxable_amount: 2350.00,
        tax_rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        cgst_amount: 0.00,
        sgst_amount: 0.00,
        grand_total: 2350.00,
        items: [
          { code: 'PLT-CLT-SET', description: 'Clutch Plate & Friction Disc Set', type: 'Part', hsn: '8714', qty: 1, uom: 'SET', rate: 950.00, tax_pct: 0, total: 950.00 },
          { code: 'SPK-KIT-CH', description: 'Chain & Sprocket Complete Kit', type: 'Part', hsn: '8714', qty: 1, uom: 'KIT', rate: 900.00, tax_pct: 0, total: 900.00 },
          { code: 'LBR-CLT-OVR', description: 'Clutch Overhaul & Adjustment Labour', type: 'Labour', hsn: '9987', qty: 1, uom: 'JOB', rate: 350.00, tax_pct: 0, total: 350.00 },
          { code: 'LBR-SPK-REP', description: 'Chain Sprocket Replacement Labour', type: 'Labour', hsn: '9987', qty: 1, uom: 'JOB', rate: 250.00, tax_pct: 0, total: 250.00 }
        ]
      };
    } else if (docType === 'DB' || docType === 'INV') {
      return {
        company_name: 'Mauli Auto Enterprises Pvt Ltd',
        facility_name: 'Mauli Service Center 1 - Pune Main',
        facility_address: 'Plot No. 12, Sector 3, Pune Main Road, Pune - 411001',
        facility_mobile: '9822012345',
        facility_email: 'pune.service@mauliservice.com',
        facility_gstin: '27AABCT2345M1Z9',
        document_number: docType === 'INV' ? 'INV/PUN/2026/000215' : 'DB/PUN/2026/000215',
        document_date: '19-Oct-2026',
        customer_name: 'Ganesh Shinde',
        customer_mobile: '9822001122',
        customer_cin: 'CIN-PUN-0119',
        customer_address: 'Hadapsar, Pune - 411028',
        vehicle_reg: 'MH-12-PQ-9080',
        vehicle_model: 'TVS Jupiter 125cc',
        odometer: '18,500 km',
        chassis_no: 'MD625EJ1XXXX123',
        complaints: 'Paid full service completed with spark plug change and drive belt check.',
        parts_total: 1120.00,
        labour_total: 550.00,
        discount_total: 50.00,
        taxable_amount: 1620.00,
        tax_rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        cgst_amount: 0.00,
        sgst_amount: 0.00,
        grand_total: 1620.00,
        amount_paid: 1620.00,
        balance_due: 0.00,
        items: [
          { code: 'OIL-SYN-10W30', description: 'Synthetic Engine Oil 10W-30', type: 'Part', hsn: '2710', qty: 1, uom: 'BTL', rate: 580.00, tax_pct: 0, total: 580.00 },
          { code: 'PLG-SPK-NGK', description: 'NGK Spark Plug CPR8EA-9', type: 'Part', hsn: '8511', qty: 1, uom: 'NOS', rate: 190.00, tax_pct: 0, total: 190.00 },
          { code: 'FLT-AIR-JUP', description: 'Air Filter Element', type: 'Part', hsn: '8421', qty: 1, uom: 'NOS', rate: 350.00, tax_pct: 0, total: 350.00 },
          { code: 'LBR-MAJ-SRV', description: 'Major Periodic Service Labour', type: 'Labour', hsn: '9987', qty: 1, uom: 'JOB', rate: 550.00, tax_pct: 0, total: 550.00 }
        ]
      };
    } else if (docType === 'RCPT') {
      // RCPT - Official Payment Receipt & Settlement
      return {
        company_name: 'Mauli Auto Enterprises Pvt Ltd',
        facility_name: 'Mauli Service Center 1 - Pune Main',
        facility_address: 'Plot No. 12, Sector 3, Pune Main Road, Pune - 411001',
        facility_mobile: '9822012345',
        facility_email: 'pune.service@mauliservice.com',
        facility_gstin: '27AABCT2345M1Z9',
        document_number: 'RCPT/PUN/2026/000108',
        document_date: '19-Oct-2026',
        customer_name: 'Suresh M. Patil',
        customer_mobile: '9890123456',
        customer_cin: 'CIN-PUN-0982',
        customer_address: 'Flat 402, Shivajinagar, Pune - 411005',
        vehicle_reg: 'MH-12-AB-1234',
        vehicle_model: 'Honda Activa 6G',
        odometer: '12,482 km',
        chassis_no: 'ME4JF5048NXXXX876',
        complaints: 'Payment received against Tax Invoice INV/PUN/2026/000215.',
        payment_mode: 'UPI',
        payment_ref: 'UPI/6293810293/GPay',
        total_bill_amount: 1911.60,
        previous_outstanding: 1911.60,
        amount_paid: 1911.60,
        remaining_outstanding: 0.00,
        parts_total: 0.00,
        labour_total: 0.00,
        discount_total: 0.00,
        cgst_amount: 0.00,
        sgst_amount: 0.00,
        grand_total: 1911.60,
        items: [
          { sr_no: 1, code: 'BILL-TOTAL', description: 'Total Bill Net Amount (Tax Invoice: INV/PUN/2026/000215)', type: 'Bill Net', payment_mode: '—', hsn: 'NA', qty: 1, uom: 'DOC', rate: 1911.60, total: 1911.60 },
          { sr_no: 2, code: 'RCPT-PMT', description: 'Current Installment / Settlement via UPI (Ref: UPI/6293810293/GPay)', type: 'Paid', payment_mode: 'UPI', hsn: 'NA', qty: 1, uom: 'TXN', rate: 1911.60, total: 1911.60 }
        ]
      };
    } else {
      // GP - Delivery Gate Pass
      return {
        company_name: 'Mauli Auto Enterprises Pvt Ltd',
        facility_name: 'Mauli Service Center 1 - Pune Main',
        facility_address: 'Plot No. 12, Sector 3, Pune Main Road, Pune - 411001',
        facility_mobile: '9822012345',
        facility_email: 'pune.service@mauliservice.com',
        facility_gstin: '27AABCT2345M1Z9',
        document_number: 'GP/PUN/2026/000108',
        document_date: '19-Oct-2026',
        next_service_date: '19-Jan-2027',
        next_service_due_date: '19-Jan-2027',
        customer_name: 'Suresh M. Patil',
        customer_mobile: '9890123456',
        customer_cin: 'CIN-PUN-0982',
        customer_address: 'Flat 402, Shivajinagar, Pune - 411005',
        vehicle_reg: 'MH-12-AB-1234',
        vehicle_model: 'Honda Activa 6G',
        odometer: '12,482 km',
        chassis_no: 'ME4JF5048NXXXX876',
        complaints: 'Service completed satisfactorily. Vehicle road tested and washed. Replaced parts handed over.',
        job_card_no: 'JC/PUN/2026/000108',
        invoice_no: 'INV/PUN/2026/000108',
        bill_revision_no: '0',
        delivered_to: 'Customer',
        receiver_name: 'Suresh M. Patil',
        receiver_mobile: '9890123456',
        relationship: 'Self',
        id_proof_type: 'Driving Licence',
        id_proof_number: 'MH-12-2015-0012345',
        handover_datetime: '19-Oct-2026 16:30',
        delivered_by: 'Santosh Shinde (Service Advisor)',
        security_verified_by: 'Ramesh Patil (Gate Security)',
        customer_signature_type: 'Physical Signature on Gate Pass Copy',
        delivery_remarks: 'Vehicle inspected, washed, and delivered in good running order. Old replaced parts handed over in customer bag.',
        reprint_count: 0,
        reprint_history: [],
        parts_total: 680.00,
        labour_total: 450.00,
        grand_total: 1333.40,
        items: [
          { code: 'JC-REF', description: 'Associated Job Card: JC/PUN/2026/000108', type: 'Reference', hsn: 'NA', qty: 1, uom: 'JOB', rate: 0, total: 0 },
          { code: 'INV-REF', description: 'Tax Invoice: INV/PUN/2026/000108 (Settled in Full)', type: 'Settlement', hsn: 'NA', qty: 1, uom: 'DOC', rate: 1333.40, total: 1333.40 }
        ]
      };
    }
  },

  getLiveDbTransactionData(docType) {
    if (!window.DB) return null;

    if (docType === 'RCPT') {
      const receipts = (typeof window.DB.getAll === 'function') 
        ? (window.DB.getAll('payment_receipts') || window.DB.getAll('billing_payment_receipts') || []) 
        : [];
      if (receipts.length > 0) {
        const r = receipts[0];
        return this.normalizeTransactionData('RCPT', r.facility_id || 'ALL', r);
      }
    }
    const jcList = window.DB.getAll('jobCards') || [];
    if (jcList.length === 0) return null;
    const jc = jcList[0];

    return {
      company_name: 'Mauli Auto Enterprises Pvt Ltd',
      facility_name: jc.plant_name || 'Mauli Service Center 1',
      facility_address: 'Plot No. 12, Sector 3, Pune Main Road, Pune',
      facility_mobile: '9822012345',
      facility_email: 'service@mauliservice.com',
      facility_gstin: '27AABCT2345M1Z9',
      document_number: jc.job_card_no || jc.id,
      document_date: jc.job_card_date || '19-Oct-2026',
      customer_name: jc.customer_name || 'Walk-in Customer',
      customer_mobile: jc.customer_mobile || jc.customer_phone || '-',
      customer_cin: jc.cin || 'CIN-MH-001',
      customer_address: jc.customer_address || 'Pune, Maharashtra',
      vehicle_reg: jc.vehicle_reg_no || jc.reg_no || 'MH-12-XX-0000',
      vehicle_model: jc.vehicle_model || jc.model_name || 'Two Wheeler',
      odometer: (jc.odometer_km || jc.odometer_reading) ? (String(jc.odometer_km || jc.odometer_reading).includes('km') ? String(jc.odometer_km || jc.odometer_reading) : `${jc.odometer_km || jc.odometer_reading} km`) : '0 km',
      chassis_no: jc.chassis_no || 'CHAS998877',
      complaints: Array.isArray(jc.complaints) ? jc.complaints.join(', ') : (jc.complaints || 'Routine service'),
      parts_total: jc.parts_total || 500,
      labour_total: jc.labour_total || 400,
      grand_total: jc.grand_total || 900,
      items: Array.isArray(jc.parts_required) && jc.parts_required.length > 0 ? jc.parts_required.map(p => ({
        code: p.part_number || p.item_id || 'PART',
        description: p.part_name || p.name || 'Spare Part',
        type: 'Part',
        hsn: '8714',
        qty: p.qty || 1,
        uom: 'NOS',
        rate: p.unit_price || 200,
        total: (p.qty || 1) * (p.unit_price || 200)
      })) : [
        { code: 'PART-01', description: 'Engine Oil', type: 'Part', hsn: '2710', qty: 1, uom: 'BTL', rate: 450, total: 450 },
        { code: 'LBR-01', description: 'General Service', type: 'Labour', hsn: '9987', qty: 1, uom: 'JOB', rate: 350, total: 350 }
      ]
    };
  },

  // 11. Designer Print & Export Triggers
  triggerDesignerPrintTest() {
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (!config) return;

    const data = this.getPreviewData(config);
    const contentHtml = this.renderDocumentHtml(config, data);

    let iframe = document.getElementById('iscm-doc-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'iscm-doc-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${config.name} - Test Print</title>
  <style>
    @page {
      size: ${config.page_settings?.page_size || 'A4'} ${config.page_settings?.orientation || 'portrait'};
      margin: ${(config.page_settings?.margin_top || 8)}mm ${(config.page_settings?.margin_right || 10)}mm ${(config.page_settings?.margin_bottom || 8)}mm ${(config.page_settings?.margin_left || 10)}mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: ${config.page_settings?.font_family || 'Inter, sans-serif'};
      font-size: ${config.page_settings?.font_size || '11px'};
      line-height: ${config.page_settings?.line_spacing || '1.3'};
      color: #0f172a;
      background: #ffffff;
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print iframe failed:', err);
      }
    }, 250);
  },

  triggerDesignerPdfDownload() {
    const target = document.getElementById('designer-preview-target');
    if (!target) return;
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId) || { code: 'DPC' };

    if (typeof html2pdf === 'function') {
      const opt = {
        margin: [8, 10, 8, 10],
        filename: `${config.code}_Preview.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: config.page_settings?.page_size?.toLowerCase() || 'a4', orientation: config.page_settings?.orientation || 'portrait' }
      };
      html2pdf().set(opt).from(target).save();
      window.State.showToast('Generating PDF download...', 'info');
    } else {
      window.State.showToast('html2pdf library loading... Triggering standard print dialog instead.', 'warning');
      this.triggerDesignerPrintTest();
    }
  },

  // 12. Save Draft, Submit, Approve & Publish Workflow (BRD 8.14)
  saveDraft() {
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (!config) return;

    config.updated_at = new Date().toISOString();
    config.updated_by = window.State ? (window.State.getCurrentUser()?.name || 'Administrator') : 'Administrator';

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_configurations', config);
    }
    this.addAuditLog(config.id, 'UPDATE', `Saved changes for ${config.code} (${config.name}) as ${config.status}.`);
    window.State.showToast(`Draft for ${config.code} saved successfully.`, 'success');
  },

  submitForApproval() {
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (!config) return;

    config.status = 'Pending Approval';
    config.updated_at = new Date().toISOString();
    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_configurations', config);
    }
    this.addAuditLog(config.id, 'SUBMIT', `Submitted template ${config.code} for Facility Head approval.`);
    window.State.showToast(`Template ${config.code} submitted for approval.`, 'info');
    this.renderDesignerModal();
    this.refreshTable();
  },

  publishFromDesigner() {
    this.publishConfiguration(this.activeConfigId);
    this.renderDesignerModal();
  },

  republishFromDesigner() {
    const config = this.getAllConfigs().find(c => c.id === this.activeConfigId);
    if (!config) return;

    // Increment version (e.g. 1.0 -> 1.1)
    const curVer = parseFloat(config.version || '1.0');
    const nextVer = (curVer + 0.1).toFixed(1);

    // Save snapshot of previous version to version history
    this.createVersionSnapshot(config, `Republished as v${nextVer}`);

    config.version = nextVer;
    config.status = 'Published';
    config.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_configurations', config);
    }
    this.addAuditLog(config.id, 'PUBLISH', `Republished template ${config.code} as version v${nextVer}.`);
    window.State.showToast(`Template ${config.code} successfully published as v${nextVer}!`, 'success');
    this.renderDesignerModal();
    this.refreshTable();
  },

  publishConfiguration(configId) {
    const config = this.getAllConfigs().find(c => c.id === configId);
    if (!config) return;

    // Check if there is already a published configuration for same facility & doc type
    const allConfigs = this.getAllConfigs();
    allConfigs.forEach(other => {
      if (other.id !== config.id && other.facility_id === config.facility_id && other.document_type === config.document_type && other.status === 'Published') {
        other.status = 'Inactive';
        if (window.DB && typeof window.DB.upsert === 'function') {
          window.DB.upsert('document_print_configurations', other);
        }
      }
    });

    config.status = 'Published';
    config.updated_at = new Date().toISOString();
    config.updated_by = window.State ? (window.State.getCurrentUser()?.name || 'Administrator') : 'Administrator';

    // Store version snapshot
    this.createVersionSnapshot(config, 'Initial Publication');

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_configurations', config);
    }

    this.addAuditLog(config.id, 'PUBLISH', `Published template ${config.code} for live printing.`);
    window.State.showToast(`Template ${config.code} is now PUBLISHED and active in live printing.`, 'success');
    this.refreshTable();
  },

  toggleStatus(configId) {
    const config = this.getAllConfigs().find(c => c.id === configId);
    if (!config) return;

    const nextStatus = config.status === 'Published' ? 'Inactive' : 'Published';
    config.status = nextStatus;
    config.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_configurations', config);
    }
    this.addAuditLog(config.id, nextStatus === 'Published' ? 'ACTIVATE' : 'DEACTIVATE', `Status changed to ${nextStatus}.`);
    window.State.showToast(`Configuration status set to ${nextStatus}.`, 'info');
    this.refreshTable();
  },

  // Delete Configuration (RBAC Access-Controlled)
  canDeleteConfiguration(cfg) {
    if (!window.State || typeof window.State.hasPermission !== 'function') return true;
    return window.State.hasPermission('DOC_PRINT_CONFIG_MASTER', 'DELETE') ||
           window.State.hasPermission('DOC_PRINT_CONFIG', 'DELETE') ||
           window.State.hasPermission('PRINT_CONFIG', 'DELETE');
  },

  confirmDelete(configId) {
    const config = this.getAllConfigs().find(c => c.id === configId);
    if (!config) return;
    if (!this.canDeleteConfiguration(config)) {
      if (window.State && typeof window.State.showToast === 'function') {
        window.State.showToast('Access Denied: You do not have permission to delete document print configurations.', 'error');
      }
      return;
    }
    const isPublished = config.status === 'Published';
    const warningText = isPublished 
      ? '<div style="color: #ef4444; font-weight: 600; font-size: 11px; margin-top: 6px; padding: 6px 10px; background: rgba(239,68,68,0.08); border-radius: 4px; border: 1px solid rgba(239,68,68,0.2);">⚠️ Warning: This template is currently Published. Deleting it will remove the active print template for this document type.</div>'
      : '';

    const modalHtml = `
      <div class="modal-backdrop" id="doc-print-delete-modal" style="display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 1060; align-items: center; justify-content: center; padding: 16px;">
        <div class="modal-dialog" style="background: var(--bg-surface, #ffffff); border: 1px solid var(--border-medium, #cbd5e1); border-radius: 8px; width: 100%; max-width: 440px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); overflow: hidden;">
          <div style="padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: rgba(239,68,68,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 15px;">🗑️</span>
              <h3 style="margin: 0; font-size: 13.5px; font-weight: 700; color: #ef4444;">Confirm Delete Configuration</h3>
            </div>
            <button type="button" onclick="window.DocPrintConfigModule.closeModal('doc-print-delete-modal')" style="background: none; border: none; font-size: 18px; color: var(--text-muted); cursor: pointer;">&times;</button>
          </div>
          <div style="padding: 12px 14px; font-size: 12px; color: var(--text-primary);">
            Are you sure you want to delete print configuration <b>${this.escapeHtml(config.name)}</b>?
            ${warningText}
            <p style="margin: 8px 0 0 0; font-size: 11px; color: var(--text-muted);">This action is irreversible and will remove this template layout from the system.</p>
          </div>
          <div style="padding: 8px 14px; background: var(--bg-surface-secondary, #f8fafc); border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" style="height: 28px; font-size: 11.5px; padding: 0 12px;" onclick="window.DocPrintConfigModule.closeModal('doc-print-delete-modal')">Cancel</button>
            <button type="button" class="btn btn-primary btn-sm" style="height: 28px; font-size: 11.5px; padding: 0 14px; background: #ef4444; border-color: #ef4444; font-weight: 600;" onclick="window.DocPrintConfigModule.deleteConfiguration('${config.id}')">Delete Configuration</button>
          </div>
        </div>
      </div>
    `;
    this.mountModal(modalHtml);
  },

  async deleteConfiguration(configId) {
    const config = this.getAllConfigs().find(c => c.id === configId);
    if (!config) return;
    if (!this.canDeleteConfiguration(config)) {
      if (window.State && typeof window.State.showToast === 'function') {
        window.State.showToast('Access Denied: You do not have permission to delete document print configurations.', 'error');
      }
      return;
    }
    this.closeModal('doc-print-delete-modal');
    this.addAuditLog(config.id, 'DELETE', `Deleted configuration: ${config.name} (${config.code})`);
    if (window.DB && typeof window.DB.delete === 'function') {
      window.DB.delete('document_print_configurations', configId);
    }
    if (typeof fetch === 'function') {
      try {
        await fetch(`/api/document-print-configurations/${encodeURIComponent(configId)}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('[DocPrintConfig] Backend delete deferred:', err.message);
      }
    }
    if (window.State && typeof window.State.showToast === 'function') {
      window.State.showToast(`Configuration "${config.name}" deleted successfully.`, 'success');
    }
    this.refreshTable();
  },

  // 13. Version Management Engine (BRD 8.15)
  createVersionSnapshot(config, remarks) {
    const newVersionRecord = {
      id: `VER-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
      configuration_id: config.id,
      version_number: config.version || '1.0',
      configuration_name: config.name,
      facility_id: config.facility_id,
      document_type: config.document_type,
      template_snapshot: JSON.parse(JSON.stringify(config)),
      status: config.status,
      publication_date: new Date().toISOString(),
      change_remarks: remarks || 'Version snapshot recorded',
      created_by: window.State ? (window.State.getCurrentUser()?.name || 'Administrator') : 'Administrator',
      created_at: new Date().toISOString()
    };

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_template_versions', newVersionRecord);
    }
  },

  showVersionHistoryModal(configId) {
    const config = this.getAllConfigs().find(c => c.id === configId);
    if (!config) return;

    const allVersions = this.getAllVersions().filter(v => v.configuration_id === configId);

    const modalHtml = `
      <div class="modal-backdrop" id="doc-print-versions-modal" style="display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 1060; align-items: center; justify-content: center; padding: 16px;">
        <div class="modal-dialog" style="background: var(--bg-surface, #ffffff); border: 1px solid var(--border-medium); border-radius: var(--radius-lg, 10px); width: 100%; max-width: 800px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-secondary, #f8fafc);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">📜</span>
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">
                Version History: ${this.escapeHtml(config.name)} (${this.escapeHtml(config.code)})
              </h3>
            </div>
            <button type="button" onclick="window.DocPrintConfigModule.closeModal('doc-print-versions-modal')" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer;">&times;</button>
          </div>

          <div style="padding: 18px 20px; overflow-y: auto; flex: 1;">
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              BR-020 Compliance: Restoring an earlier version creates an audit-logged new active version without altering past immutable records.
            </div>

            <div style="border: 1px solid var(--border-subtle); border-radius: 6px; overflow: hidden;">
              <table class="data-table" style="width: 100%; font-size: 12px;">
                <thead style="background: var(--bg-surface-secondary, #f8fafc);">
                  <tr>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Published At</th>
                    <th>Published By</th>
                    <th>Remarks</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${allVersions.length === 0 ? `
                    <tr>
                      <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
                        No historical versions archived yet. Active version is v${config.version || '1.0'}.
                      </td>
                    </tr>
                  ` : allVersions.map(v => `
                    <tr>
                      <td style="font-weight: 700; font-family: monospace;">v${v.version_number}</td>
                      <td>
                        <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(5,150,105,0.1); color: #059669;">
                          ${v.status}
                        </span>
                      </td>
                      <td>${v.publication_date ? (window.formatDateTime ? window.formatDateTime(v.publication_date) : String(v.publication_date).replace('T', ' ').slice(0, 16)) : '-'}</td>
                      <td>${this.escapeHtml(v.created_by || 'Admin')}</td>
                      <td>${this.escapeHtml(v.change_remarks || '-')}</td>
                      <td style="text-align: right;">
                        <button 
                          class="btn btn-secondary btn-sm" 
                          style="padding: 2px 8px; font-size: 11px;"
                          onclick="window.DocPrintConfigModule.restoreVersion('${v.id}')"
                        >
                          🔄 Restore
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div style="padding: 12px 20px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; background: var(--bg-surface-secondary, #f8fafc);">
            <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.closeModal('doc-print-versions-modal')">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  },

  restoreVersion(versionRecordId) {
    const versionRecord = this.getAllVersions().find(v => v.id === versionRecordId);
    if (!versionRecord || !versionRecord.template_snapshot) {
      window.State.showToast('Version snapshot data missing.', 'error');
      return;
    }

    const config = this.getAllConfigs().find(c => c.id === versionRecord.configuration_id);
    if (!config) return;

    // Increment version
    const curVer = parseFloat(config.version || '1.0');
    const restoredVer = (curVer + 0.1).toFixed(1);

    // Apply snapshot settings
    const snap = versionRecord.template_snapshot;
    config.page_settings = JSON.parse(JSON.stringify(snap.page_settings || {}));
    config.header_config = JSON.parse(JSON.stringify(snap.header_config || {}));
    config.body_config = JSON.parse(JSON.stringify(snap.body_config || {}));
    config.columns_config = JSON.parse(JSON.stringify(snap.columns_config || []));
    config.footer_config = JSON.parse(JSON.stringify(snap.footer_config || {}));
    config.version = restoredVer;
    config.status = 'Draft';
    config.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_configurations', config);
    }

    this.addAuditLog(config.id, 'RESTORE', `Restored layout from historical version v${versionRecord.version_number} as new version v${restoredVer}.`);
    this.closeModal('doc-print-versions-modal');
    window.State.showToast(`Restored layout from v${versionRecord.version_number} into active draft v${restoredVer}.`, 'success');
    this.showDesignerModal(config.id);
  },

  // 14. Copy Configuration Modal (BRD 8.16)
  showCopyModal(copyFromId = null) {
    const allConfigs = this.getAllConfigs();
    if (allConfigs.length === 0) {
      window.State.showToast('No configurations available to copy.', 'warning');
      return;
    }

    const targetId = copyFromId || allConfigs[0].id;
    this.showCreateModal(targetId);
  },

  // 15. Preview Modal (Standalone)
  showPreviewModal(configId) {
    const config = this.getAllConfigs().find(c => c.id === configId);
    if (!config) return;

    const data = this.getPreviewData(config);
    const contentHtml = this.renderDocumentHtml(config, data);

    const modalHtml = `
      <div class="modal-backdrop" id="doc-print-preview-modal" style="display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1060; align-items: center; justify-content: center; padding: 16px;">
        <div class="modal-dialog" style="background: var(--bg-surface, #ffffff); border: 1px solid var(--border-medium); border-radius: var(--radius-lg, 10px); width: 100%; max-width: 880px; max-height: 94vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
          
          <div style="padding: 12px 18px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-secondary, #f8fafc);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">👁️</span>
              <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary);">
                Print Preview: ${this.escapeHtml(config.name)} (${config.code})
              </h3>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.triggerPreviewModalPrint('${config.id}')">
                🖨️ Print
              </button>
              <button type="button" onclick="window.DocPrintConfigModule.closeModal('doc-print-preview-modal')" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer;">&times;</button>
            </div>
          </div>

          <div style="padding: 24px; overflow-y: auto; flex: 1; background: #e2e8f0; display: flex; justify-content: center;">
            <div id="preview-modal-paper" style="background: #ffffff; width: 100%; max-width: 794px; padding: ${(config.page_settings?.margin_top || 8)}mm ${(config.page_settings?.margin_right || 10)}mm ${(config.page_settings?.margin_bottom || 8)}mm ${(config.page_settings?.margin_left || 10)}mm; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); font-family: ${config.page_settings?.font_family || 'Inter, sans-serif'}; font-size: ${config.page_settings?.font_size || '11px'}; line-height: ${config.page_settings?.line_spacing || '1.3'};">
              ${contentHtml}
            </div>
          </div>

          <div style="padding: 10px 18px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-secondary, #f8fafc); font-size: 12px;">
            <span style="color: var(--text-muted);">Paper Size: ${config.page_settings?.page_size || 'A4'} | Orientation: ${config.page_settings?.orientation || 'Portrait'}</span>
            <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.closeModal('doc-print-preview-modal')">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  },

  triggerPreviewModalPrint(configId) {
    this.activeConfigId = configId;
    this.triggerDesignerPrintTest();
  },

  // 16. Audit Trail Modal (BRD Section 15)
  showAuditTrailModal() {
    const logs = this.getAllAuditLogs();

    const modalHtml = `
      <div class="modal-backdrop" id="doc-print-audit-modal" style="display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 1060; align-items: center; justify-content: center; padding: 16px;">
        <div class="modal-dialog" style="background: var(--bg-surface, #ffffff); border: 1px solid var(--border-medium); border-radius: var(--radius-lg, 10px); width: 100%; max-width: 850px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-secondary, #f8fafc);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">📜</span>
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">
                Document Print Configuration Audit Log
              </h3>
            </div>
            <button type="button" onclick="window.DocPrintConfigModule.closeModal('doc-print-audit-modal')" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer;">&times;</button>
          </div>

          <div style="padding: 16px 20px; overflow-y: auto; flex: 1;">
            <table class="data-table" style="width: 100%; font-size: 12px;">
              <thead style="background: var(--bg-surface-secondary, #f8fafc);">
                <tr>
                  <th style="width: 130px;">Timestamp</th>
                  <th style="width: 90px;">Action</th>
                  <th>User</th>
                  <th>Configuration & Details</th>
                </tr>
              </thead>
              <tbody>
                ${logs.length === 0 ? `
                  <tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">No audit events recorded yet.</td></tr>
                ` : logs.map(l => `
                  <tr>
                    <td style="font-size: 11px; color: var(--text-muted);">${l.created_at ? (window.formatDateTime ? window.formatDateTime(l.created_at) : String(l.created_at).replace('T', ' ').slice(0, 16)) : '-'}</td>
                    <td>
                      <span class="cell-mono" style="font-size: 10.5px; font-weight: 700; background: rgba(0,0,0,0.06); padding: 1px 6px; border-radius: 4px;">
                        ${l.action}
                      </span>
                    </td>
                    <td><b>${this.escapeHtml(l.user_name || 'Admin')}</b></td>
                    <td style="color: var(--text-secondary);">${this.escapeHtml(l.remarks || '-')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="padding: 12px 20px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; background: var(--bg-surface-secondary, #f8fafc);">
            <button class="btn btn-secondary btn-sm" onclick="window.DocPrintConfigModule.closeModal('doc-print-audit-modal')">Close</button>
          </div>
        </div>
      </div>
    `;

    this.mountModal(modalHtml);
  },

  addAuditLog(configId, action, remarks) {
    const config = this.getAllConfigs().find(c => c.id === configId);
    const newLog = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
      configuration_id: configId,
      action: action,
      facility_id: config ? config.facility_id : 'ALL',
      document_type: config ? config.document_type : '',
      version_number: config ? config.version : '1.0',
      user_id: window.State ? (window.State.getCurrentUser()?.id || 'USR-001') : 'USR-001',
      user_name: window.State ? (window.State.getCurrentUser()?.name || 'Administrator') : 'Administrator',
      remarks: remarks,
      created_at: new Date().toISOString()
    };

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_print_audit_logs', newLog);
    }
  },

  // Helper to match a document configuration with a target facility ID, code, or name
  isFacilityMatch(config, facilityId) {
    if (!config) return false;
    const appFacs = this.getApplicableFacilities(config);
    if (appFacs.includes('ALL') || config.facility_id === 'ALL' || !config.facility_id) return true;
    if (!facilityId || facilityId === 'ALL') return true;

    // Direct check
    if (appFacs.includes(facilityId) || config.facility_id === facilityId) return true;

    // Match case-insensitively
    const facUpper = String(facilityId).trim().toUpperCase();
    if (appFacs.some(f => String(f).trim().toUpperCase() === facUpper)) return true;

    // Check against Plant / Facility Master resolution
    const plants = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('plants') || []) : [];
    const matchedPlant = plants.find(p => 
      (p.id && p.id.toUpperCase() === facUpper) || 
      (p.code && p.code.toUpperCase() === facUpper) || 
      (p.branch_code && p.branch_code.toUpperCase() === facUpper) || 
      (p.name && p.name.trim().toLowerCase() === String(facilityId).trim().toLowerCase())
    );

    if (matchedPlant) {
      const identifiers = [matchedPlant.id, matchedPlant.code, matchedPlant.branch_code, matchedPlant.name]
        .filter(Boolean)
        .map(x => String(x).trim().toUpperCase());
      for (const id of identifiers) {
        if (appFacs.some(f => String(f).trim().toUpperCase() === id) || (config.facility_id && config.facility_id.toUpperCase() === id)) {
          return true;
        }
      }
    }

    return false;
  },

  // 17. Public API: Retrieve Applicable Published Template for Transactions (BRD 8.17)
  getPublishedTemplate(docType, facilityId) {
    const allConfigs = this.getAllConfigs().filter(c => c.document_type === docType);
    if (allConfigs.length === 0) return null;

    // 1. Check facility-specific published template first
    if (facilityId && facilityId !== 'ALL') {
      const facPublished = allConfigs.find(c => {
        if (c.status !== 'Published') return false;
        const appFacs = this.getApplicableFacilities(c);
        if (appFacs.includes('ALL') || c.facility_id === 'ALL') return false;
        return this.isFacilityMatch(c, facilityId);
      });
      if (facPublished) return facPublished;

      // 1b. Check facility-specific active or draft template
      const facConfigured = allConfigs.find(c => {
        const appFacs = this.getApplicableFacilities(c);
        if (appFacs.includes('ALL') || c.facility_id === 'ALL') return false;
        return this.isFacilityMatch(c, facilityId);
      });
      if (facConfigured) return facConfigured;
    }

    // 2. Fall back to organization / company default template (configured for ALL facilities, Published first)
    const globalPublished = allConfigs.find(c => {
      if (c.status !== 'Published') return false;
      const appFacs = this.getApplicableFacilities(c);
      return appFacs.includes('ALL') || !c.facility_id || c.facility_id === 'ALL';
    });
    if (globalPublished) return globalPublished;

    const globalAny = allConfigs.find(c => {
      const appFacs = this.getApplicableFacilities(c);
      return appFacs.includes('ALL') || !c.facility_id || c.facility_id === 'ALL';
    });
    if (globalAny) return globalAny;

    // 3. Fall back to any template matching the facility
    const anyFacTemplate = allConfigs.find(c => this.isFacilityMatch(c, facilityId));
    if (anyFacTemplate) return anyFacTemplate;

    // 4. Default to first template only if facility is ALL or not specified
    if (!facilityId || facilityId === 'ALL') {
      return allConfigs.find(c => c.status === 'Published') || allConfigs[0] || null;
    }

    return null;
  },

  // 17b. Universal Facility Print Generator & Dispatcher (BRD Section 8.17)
  generatePrintHtml(docType, facilityId, transactionObj) {
    if (!docType) return null;
    const template = this.getPublishedTemplate(docType, facilityId);
    if (!template) return null;

    const data = this.normalizeTransactionData(docType, facilityId, transactionObj, template);
    const docHtml = this.renderDocumentHtml(template, data);

    const ps = template.page_settings || {};
    const marginTop = ps.margin_top !== undefined ? ps.margin_top : 8;
    const marginRight = ps.margin_right !== undefined ? ps.margin_right : 10;
    const marginBottom = ps.margin_bottom !== undefined ? ps.margin_bottom : 8;
    const marginLeft = ps.margin_left !== undefined ? ps.margin_left : 10;
    const fontFamily = ps.font_family || 'Inter, sans-serif';
    const fontSize = ps.font_size || '11px';
    const lineSpacing = ps.line_spacing || '1.3';

    return `
      <div class="a4-container configured-print-doc" style="background: #ffffff; color: #0f172a; width: 100%; max-width: 794px; margin: 0 auto; padding: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm; font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineSpacing}; box-sizing: border-box; border: 1px solid var(--border-medium); border-radius: var(--radius-md);">
        ${docHtml}
      </div>
    `;
  },

  printConfiguredDocument(docType, facilityId, transactionObj, fallbackFn) {
    if (!docType) {
      if (typeof fallbackFn === 'function') fallbackFn();
      return false;
    }
    const template = this.getPublishedTemplate(docType, facilityId);
    if (!template) {
      if (typeof fallbackFn === 'function') fallbackFn();
      return false;
    }

    const data = this.normalizeTransactionData(docType, facilityId, transactionObj, template);
    const contentHtml = this.renderDocumentHtml(template, data);
    const docTitle = `${(template.header_config && template.header_config.doc_title) || template.name} - ${data.document_number}`;
    this.printHtmlDocument(contentHtml, template, docTitle);
    return true;
  },

  printHtmlDocument(contentHtml, config, title) {
    if (typeof document === 'undefined') return;
    const ps = (config && config.page_settings) || {};
    const pageSize = ps.page_size || 'A4';
    const orientation = ps.orientation || 'portrait';
    const marginTop = ps.margin_top !== undefined ? ps.margin_top : 8;
    const marginRight = ps.margin_right !== undefined ? ps.margin_right : 10;
    const marginBottom = ps.margin_bottom !== undefined ? ps.margin_bottom : 8;
    const marginLeft = ps.margin_left !== undefined ? ps.margin_left : 10;
    const fontFamily = ps.font_family || 'Inter, sans-serif';
    const fontSize = ps.font_size || '11px';
    const lineSpacing = ps.line_spacing || '1.3';

    let iframe = document.getElementById('iscm-doc-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'iscm-doc-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title || (config ? config.name : 'Print Document')}</title>
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: ${fontFamily};
      font-size: ${fontSize};
      line-height: ${lineSpacing};
      color: #0f172a;
      background: #ffffff;
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print iframe failed:', err);
        if (typeof window !== 'undefined' && typeof window.print === 'function') {
          window.print();
        }
      }
    }, 250);
  },

  normalizeTransactionData(docType, facilityId, transactionObj, template) {
    if (!transactionObj) transactionObj = {};

    // 1. Resolve Plant / Facility details
    let plant = null;
    const resolvedFacId = facilityId || transactionObj.plant_id || transactionObj.facility_id || transactionObj.branch_id || (transactionObj.facility && transactionObj.facility.id);
    if (resolvedFacId && resolvedFacId !== 'ALL' && window.DB && typeof window.DB.getById === 'function') {
      plant = window.DB.getById('plants', resolvedFacId);
    }
    if (!plant && window.BillingModule && typeof window.BillingModule.getFacilityDetails === 'function') {
      const facDet = window.BillingModule.getFacilityDetails(transactionObj);
      if (facDet && facDet.raw) plant = facDet.raw;
    }
    if (!plant && window.DB && typeof window.DB.getAll === 'function') {
      const allPlants = window.DB.getAll('plants') || [];
      plant = allPlants[0] || null;
    }

    const companyName = (plant && (plant.company_name || plant.parent_organization_name)) || 'Mauli Auto Enterprises Pvt Ltd';
    const facilityName = plant ? (plant.print_name || plant.name || plant.branch_name) : 'Mauli Service Center 1';
    const fullAddress = plant ? (plant.address ? `${plant.address}, ${plant.city || ''} ${plant.pincode ? plant.pincode : ''}`.trim() : '') : 'Plot No. 12, Sector 3, Pune Main Road, Pune - 411001';
    const facilityPhone = plant ? (plant.mobile || plant.phone || plant.contact_number || plant.mobile_number || '') : '9822012345';
    const facilityEmail = plant ? (plant.email || plant.contact_email || '') : 'service@mauliservice.com';
    const facilityGstin = plant ? (plant.gstin || plant.tax_id || '') : '27AABCT2345M1Z9';

    // 2. Resolve Document Number & Date according to Document Type
    let docNo = '';
    if (docType === 'GP') {
      docNo = transactionObj.gate_pass_no || transactionObj.document_number || transactionObj.id || 'GP-001';
    } else if (docType === 'RCPT') {
      docNo = transactionObj.receipt_no || transactionObj.document_number || transactionObj.id || 'RCP-001';
    } else if (docType === 'EST') {
      docNo = transactionObj.estimate_no || transactionObj.quotation_no || transactionObj.document_number || transactionObj.id || 'EST-001';
    } else if (docType === 'JC') {
      docNo = transactionObj.job_card_no || transactionObj.document_number || transactionObj.id || 'JC-001';
    } else {
      docNo = transactionObj.invoice_no || transactionObj.bill_no || transactionObj.receipt_no || transactionObj.document_number || 
              transactionObj.estimate_no || transactionObj.job_card_no || transactionObj.draft_bill_no || transactionObj.gate_pass_no || 
              transactionObj.po_number || transactionObj.grn_no || transactionObj.transfer_number || transactionObj.transfer_no || 
              transactionObj.dispatch_no || transactionObj.id || 'DOC-001';
    }

    const rawDate = (docType === 'GP' ? (transactionObj.handover_datetime || transactionObj.delivery_date) : null) ||
                    transactionObj.payment_date || transactionObj.document_date || transactionObj.invoice_date || transactionObj.estimate_date || 
                    transactionObj.job_card_date || transactionObj.delivery_date || transactionObj.po_date || 
                    transactionObj.grn_date || transactionObj.dispatched_at || transactionObj.created_at;
    let docDate = '28-10-2026';
    if (rawDate) {
      docDate = (window.formatDate ? window.formatDate(rawDate) : String(rawDate));
    }

    let nextServiceDate = transactionObj.next_service_date || transactionObj.next_service_due_date || transactionObj.next_servicing_date || '';
    if (nextServiceDate) {
      nextServiceDate = (window.formatDate ? window.formatDate(nextServiceDate) : String(nextServiceDate));
    }

    // 3. Customer Info
    const custName = transactionObj.customer_name || transactionObj.supplier_name || transactionObj.vendor_name || 'Walk-in Customer';
    const custMobile = transactionObj.customer_mobile || transactionObj.customer_phone || transactionObj.phone || transactionObj.mobile || '';
    const custCin = transactionObj.customer_cin || transactionObj.cin || transactionObj.cin_number || '';
    const custAddress = transactionObj.customer_address || [transactionObj.customer_address, transactionObj.customer_city, transactionObj.customer_state].filter(Boolean).join(', ') || transactionObj.supplier_address || '';

    // 4. Vehicle Info
    const vehicleReg = transactionObj.vehicle_reg_no_display || transactionObj.vehicle_reg_no || transactionObj.vehicle_no || transactionObj.vehicle_reg || transactionObj.reg_no || '';
    const vehicleModel = transactionObj.vehicle_model || transactionObj.model_name || '';
    let odometer = '';
    const rawOdo = transactionObj.odometer_km !== undefined ? transactionObj.odometer_km : 
                   (transactionObj.odometer !== undefined ? transactionObj.odometer : transactionObj.odometer_reading);
    if (rawOdo !== undefined && rawOdo !== null && rawOdo !== '' && rawOdo !== '—' && rawOdo !== '-') {
      const cleanOdo = String(rawOdo).replace(/km/gi, '').replace(/,/g, '').trim();
      const oNum = Number(cleanOdo);
      odometer = (isNaN(oNum) || oNum <= 0) ? '0 km' : `${oNum.toLocaleString('en-IN')} km`;
    } else {
      let linkedOdo = null;
      if (typeof window !== 'undefined' && window.DB && typeof window.DB.getAll === 'function') {
        const jcs = window.DB.getAll('jobCards') || [];
        const linkedJc = jcs.find(j => (transactionObj.job_card_id && j.id === transactionObj.job_card_id) || (transactionObj.job_card_no && j.job_card_no === transactionObj.job_card_no));
        if (linkedJc && (linkedJc.odometer_km !== undefined || linkedJc.odometer_reading !== undefined)) {
          linkedOdo = linkedJc.odometer_km !== undefined ? linkedJc.odometer_km : linkedJc.odometer_reading;
        }
      }
      if (linkedOdo !== null && linkedOdo !== undefined && linkedOdo !== '' && linkedOdo !== '—') {
        const cleanOdo = String(linkedOdo).replace(/km/gi, '').replace(/,/g, '').trim();
        const oNum = Number(cleanOdo);
        odometer = (isNaN(oNum) || oNum <= 0) ? '0 km' : `${oNum.toLocaleString('en-IN')} km`;
      } else {
        odometer = '0 km';
      }
    }
    const chassis = transactionObj.chassis_no || transactionObj.chassis || '';

    // 5. Complaints / Scope
    let complaints = '';
    if (Array.isArray(transactionObj.complaints)) {
      complaints = transactionObj.complaints.join('; ');
    } else {
      complaints = transactionObj.complaints || transactionObj.customer_voice || transactionObj.complaint || 
                   transactionObj.scope_of_work || transactionObj.delivery_remarks || transactionObj.remarks || transactionObj.reason || '';
    }

    // 6. Normalized Line Items
    const txTaxRate = transactionObj.tax_rate !== undefined && transactionObj.tax_rate !== null ? Number(transactionObj.tax_rate) : (
      (transactionObj.tax_pct !== undefined && transactionObj.tax_pct !== null ? Number(transactionObj.tax_pct) : 0)
    );
    const rawItems = transactionObj.items || transactionObj.parts_required || transactionObj.parts || transactionObj.services || transactionObj.line_items || [];
    const items = rawItems.map((it, idx) => {
      const qty = Number(it.qty !== undefined ? it.qty : (it.quantity !== undefined ? it.quantity : (it.dispatched !== undefined ? it.dispatched : (it.requested !== undefined ? it.requested : 1))));
      const rate = Number(it.rate || it.unit_price || it.price || 0);
      const discount = Number(it.discount || it.discount_amount || 0);
      const total = Number(it.total !== undefined ? it.total : (it.amount !== undefined ? it.amount : (it.total_amount !== undefined ? it.total_amount : (qty * rate - discount))));
      const taxable = Number(it.taxable || it.taxable_value || (qty * rate - discount));
      const itemTaxRate = it.tax_pct !== undefined && it.tax_pct !== null ? Number(it.tax_pct) : (
        it.tax_rate !== undefined && it.tax_rate !== null ? Number(it.tax_rate) : txTaxRate
      );
      return {
        sr_no: idx + 1,
        code: it.code || it.part_number || it.item_id || it.sku || it.item_code || `ITEM-${idx + 1}`,
        description: it.description || it.part_name || it.item_name || it.name || it.service_name || 'Service / Spare Part',
        type: it.type || (it.is_labour ? 'Labour' : 'Part'),
        payment_mode: it.payment_mode || transactionObj.payment_mode || 'Cash',
        hsn: it.hsn_sac || it.hsn || it.sac || '8714',
        qty: qty,
        uom: it.uom || it.unit || 'NOS',
        rate: rate,
        discount: discount,
        taxable: taxable,
        tax_pct: itemTaxRate,
        total: total
      };
    });

    if (docType === 'RCPT' && items.length === 0) {
      if (transactionObj.total_bill_amount || transactionObj.bill_total) {
        items.push({
          sr_no: items.length + 1,
          code: 'BILL-TOTAL',
          description: `Total Bill Net Amount (${transactionObj.invoice_no || transactionObj.bill_no || 'Tax Invoice'})`,
          type: 'Bill Net',
          payment_mode: '—',
          hsn: 'NA',
          qty: 1,
          uom: 'DOC',
          rate: Number(transactionObj.total_bill_amount || transactionObj.bill_total || 0),
          discount: 0,
          taxable: 0,
          tax_pct: 0,
          total: Number(transactionObj.total_bill_amount || transactionObj.bill_total || 0)
        });
      }
      items.push({
        sr_no: items.length + 1,
        code: 'RCPT-PMT',
        description: `Amount Paid via ${transactionObj.payment_mode || 'Cash/UPI'}${transactionObj.payment_ref ? ` (Ref: ${transactionObj.payment_ref})` : ''}`,
        type: 'Paid',
        payment_mode: transactionObj.payment_mode || 'Cash/UPI',
        hsn: 'NA',
        qty: 1,
        uom: 'TXN',
        rate: Number(transactionObj.amount_paid !== undefined ? transactionObj.amount_paid : (transactionObj.grand_total || 0)),
        discount: 0,
        taxable: 0,
        tax_pct: 0,
        total: Number(transactionObj.amount_paid !== undefined ? transactionObj.amount_paid : (transactionObj.grand_total || 0))
      });
      if (Number(transactionObj.remaining_outstanding || 0) > 0) {
        items.push({
          sr_no: items.length + 1,
          code: 'OUTSTANDING',
          description: 'Remaining Balance Due',
          type: 'Balance Due',
          payment_mode: 'Pending',
          hsn: 'NA',
          qty: 1,
          uom: 'DUE',
          rate: Number(transactionObj.remaining_outstanding || 0),
          discount: 0,
          taxable: 0,
          tax_pct: 0,
          total: Number(transactionObj.remaining_outstanding || 0)
        });
      }
    }

    if (docType === 'GP' && items.length === 0) {
      const totalVal = Number(transactionObj.grand_total || transactionObj.net_payable || transactionObj.total_amount || 0);
      items.push({
        sr_no: 1,
        code: transactionObj.job_card_no || 'JC-DELIVERY',
        description: `Vehicle Delivery Clearance: ${vehicleModel || 'Two Wheeler'} (${vehicleReg || '—'}) - All repairs inspected, QC approved, and vehicle cleared for exit.`,
        type: 'Vehicle Handover',
        payment_mode: transactionObj.payment_mode || 'Settled',
        hsn: '998729',
        qty: 1,
        uom: 'UNIT',
        rate: totalVal,
        discount: 0,
        taxable: totalVal,
        tax_pct: 0,
        total: totalVal
      });
    }

    // 7. Totals
    const partsTotal = Number(transactionObj.parts_total !== undefined ? transactionObj.parts_total : 
                       (transactionObj.parts_subtotal !== undefined ? transactionObj.parts_subtotal : 
                       items.filter(i => i.type !== 'Labour').reduce((sum, i) => sum + i.total, 0)));
    const labourTotal = Number(transactionObj.labour_total !== undefined ? transactionObj.labour_total : 
                        (transactionObj.labour_subtotal !== undefined ? transactionObj.labour_subtotal : 
                        items.filter(i => i.type === 'Labour').reduce((sum, i) => sum + i.total, 0)));
    const discountTotal = Number(transactionObj.discount_total !== undefined ? transactionObj.discount_total : 
                          (transactionObj.discount_amount !== undefined ? transactionObj.discount_amount : 
                          (transactionObj.discount || 0)));
    const taxableAmount = Number(transactionObj.taxable_amount !== undefined ? transactionObj.taxable_amount : 
                          Math.max(0, partsTotal + labourTotal - discountTotal));

    const taxRate = transactionObj.tax_rate !== undefined && transactionObj.tax_rate !== null ? Number(transactionObj.tax_rate) : txTaxRate;
    const cgstRate = transactionObj.cgst_rate !== undefined && transactionObj.cgst_rate !== null ? Number(transactionObj.cgst_rate) : (taxRate / 2);
    const sgstRate = transactionObj.sgst_rate !== undefined && transactionObj.sgst_rate !== null ? Number(transactionObj.sgst_rate) : (taxRate / 2);

    const cgst = Number(transactionObj.cgst_amount !== undefined && transactionObj.cgst_amount !== null ? transactionObj.cgst_amount : 
                 (transactionObj.cgst !== undefined && transactionObj.cgst !== null ? transactionObj.cgst : (taxableAmount * (cgstRate / 100))));
    const sgst = Number(transactionObj.sgst_amount !== undefined && transactionObj.sgst_amount !== null ? transactionObj.sgst_amount : 
                 (transactionObj.sgst !== undefined && transactionObj.sgst !== null ? transactionObj.sgst : (taxableAmount * (sgstRate / 100))));
    const taxAmount = Number(transactionObj.tax_amount !== undefined && transactionObj.tax_amount !== null ? transactionObj.tax_amount : 
                      (transactionObj.total_tax !== undefined && transactionObj.total_tax !== null ? transactionObj.total_tax : (cgst + sgst)));

    const grandTotal = Number(transactionObj.grand_total !== undefined ? transactionObj.grand_total : 
                       (transactionObj.estimated_total !== undefined ? transactionObj.estimated_total : 
                       (transactionObj.net_payable !== undefined ? transactionObj.net_payable :
                       (transactionObj.total_amount !== undefined ? transactionObj.total_amount : 
                       (taxableAmount + taxAmount)))));

    const amountPaid = Number(transactionObj.amount_paid !== undefined ? transactionObj.amount_paid : 
                       (transactionObj.amount_received !== undefined ? transactionObj.amount_received : grandTotal));
    const balanceDue = Number(transactionObj.balance_due !== undefined ? transactionObj.balance_due : 
                       (transactionObj.balance_amount !== undefined ? transactionObj.balance_amount : Math.max(0, grandTotal - amountPaid)));

    return {
      company_name: companyName,
      facility_name: facilityName,
      facility_address: fullAddress,
      facility_mobile: facilityPhone,
      facility_email: facilityEmail,
      facility_gstin: facilityGstin,
      document_number: docNo,
      document_date: docDate,
      next_service_date: nextServiceDate || '19-Jan-2027',
      next_service_due_date: nextServiceDate || '19-Jan-2027',
      customer_name: custName,
      customer_mobile: custMobile,
      customer_cin: custCin,
      customer_address: custAddress,
      vehicle_reg: vehicleReg,
      vehicle_model: vehicleModel,
      odometer: odometer,
      chassis_no: chassis,
      complaints: complaints,
      technician_name: transactionObj.technician_name || 'Santosh Shinde',
      advisor_name: transactionObj.advisor_name || transactionObj.service_advisor || 'Supervisor',
      delivery_date: transactionObj.promised_delivery || transactionObj.delivery_date || '',
      items: items,
      parts_total: partsTotal,
      labour_total: labourTotal,
      discount_total: discountTotal,
      taxable_amount: taxableAmount,
      tax_rate: taxRate,
      cgst_rate: cgstRate,
      sgst_rate: sgstRate,
      tax_amount: taxAmount,
      cgst_amount: cgst,
      sgst_amount: sgst,
      grand_total: grandTotal,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      previous_outstanding: transactionObj.previous_outstanding,
      remaining_outstanding: transactionObj.remaining_outstanding,
      total_bill_amount: transactionObj.total_bill_amount || transactionObj.bill_total,
      payment_ref: transactionObj.payment_ref,
      invoice_no: transactionObj.invoice_no || transactionObj.bill_no,
      payment_mode: transactionObj.payment_mode || (transactionObj.payment_receipts && transactionObj.payment_receipts[0]?.payment_mode) || 'Cash / UPI',
      job_card_no: transactionObj.job_card_no || transactionObj.jobCardNo || '',
      bill_revision_no: transactionObj.bill_revision_no !== undefined ? transactionObj.bill_revision_no : (transactionObj.revision || ''),
      delivered_to: transactionObj.delivered_to || 'Customer',
      receiver_name: transactionObj.receiver_name || custName,
      receiver_mobile: transactionObj.receiver_mobile || custMobile,
      relationship: transactionObj.relationship || 'Self',
      id_proof_type: transactionObj.id_proof_type || 'None / Verified Customer',
      id_proof_number: transactionObj.id_proof_number || '',
      handover_datetime: transactionObj.handover_datetime || transactionObj.delivery_date || '',
      delivered_by: transactionObj.delivered_by || transactionObj.advisor_name || 'Santosh Shinde',
      security_verified_by: transactionObj.security_verified_by || 'Ramesh Patil (Gate Security)',
      customer_signature_type: transactionObj.customer_signature_type || 'Physical Signature on Gate Pass Copy',
      delivery_remarks: transactionObj.delivery_remarks || transactionObj.remarks || '',
      reprint_count: Number(transactionObj.reprint_count || 0),
      reprint_history: Array.isArray(transactionObj.reprint_history) ? transactionObj.reprint_history : [],
      is_locked: transactionObj.is_locked || false,
      credit_authorized_by: transactionObj.credit_authorized_by || '',
      credit_authorization_reason: transactionObj.credit_authorization_reason || ''
    };
  },

  // 18. Default Preset Generators
  getDefaultTemplateConfig(docType, isBlank = false) {
    const docObj = this.DOC_TYPES.find(d => d.code === docType) || { defaultTitle: 'DOCUMENT' };

    let baseCols = [
      { field: 'sr_no', label: 'Sr.', visible: true, width: 6, align: 'center' },
      { field: 'description', label: 'Item / Labour Description', visible: true, width: 44, align: 'left' },
      { field: 'hsn_sac', label: 'HSN/SAC', visible: !isBlank, width: 10, align: 'center' },
      { field: 'qty', label: 'Qty', visible: true, width: 8, align: 'center' },
      { field: 'uom', label: 'UOM', visible: !isBlank, width: 8, align: 'center' },
      { field: 'rate', label: 'Rate (₹)', visible: true, width: 12, align: 'right' },
      { field: 'total', label: 'Amount (₹)', visible: true, width: 12, align: 'right' }
    ];

    if (docType === 'RCPT') {
      baseCols = [
        { field: 'sr_no', label: 'Sr.', visible: true, width: 8, align: 'center' },
        { field: 'description', label: 'Particulars / Reference Details', visible: true, width: 44, align: 'left' },
        { field: 'payment_mode', label: 'Payment Mode', visible: true, width: 20, align: 'center' },
        { field: 'total', label: 'Amount (₹)', visible: true, width: 28, align: 'right' }
      ];
    }

    return {
      header_config: {
        doc_title: docObj.defaultTitle,
        show_company_name: true,
        show_facility_name: true,
        show_facility_address: true,
        show_contact_number: true,
        show_email: true,
        show_gstin: true,
        logo_position: isBlank ? 'none' : 'left',
        alignment: 'center',
        show_separator_border: true
      },
      body_config: {
        show_customer_name: true,
        show_customer_mobile: true,
        show_customer_cin: true,
        show_customer_address: true,
        show_vehicle_reg: true,
        show_vehicle_model: true,
        show_odometer: true,
        show_chassis: !isBlank,
        show_complaints: docType !== 'RCPT',
        show_technician: docType !== 'RCPT',
        show_advisor: true,
        show_delivery_date: docType !== 'RCPT',
        show_tax_breakup: docType !== 'RCPT',
        show_discount: docType !== 'RCPT',
        show_amount_in_words: true,
        show_payment_mode: true
      },
      columns_config: baseCols,
      footer_config: {
        terms_conditions: docType === 'RCPT'
          ? '1. Payment received against stated invoice number. 2. Cheque / Digital payments are subject to bank realization. 3. Retain this receipt for vehicle handover and gate pass clearance.'
          : '1. All repairs and parts are guaranteed for 30 days or 1,000 km. 2. Storage charges apply 48 hrs after ready intimation. 3. Vehicle delivered only on settlement of bill.',
        customer_declaration: docType === 'RCPT'
          ? 'I acknowledge the payment towards service and spare components as indicated above.'
          : 'I hereby acknowledge receipt of the vehicle in good running condition along with all replaced old parts.',
        show_customer_sign: true,
        show_advisor_sign: true,
        show_tech_sign: docType === 'JC',
        show_auth_sign: true,
        thank_you_msg: docType === 'RCPT' ? 'Thank you for your payment! Drive safe.' : 'Thank you for choosing us! Ride safe.',
        show_timestamp: true,
        show_page_number: true
      },
      conditional_rules: []
    };
  },

  // 19. Utilities & Modal Management
  mountModal(html) {
    if (typeof document === 'undefined') return;
    let root = document.getElementById('doc-print-config-modal-root');
    if (!root || root.parentElement !== document.body) {
      if (root) root.remove();
      root = document.createElement('div');
      root.id = 'doc-print-config-modal-root';
      document.body.appendChild(root);
    }
    root.innerHTML = html;
  },

  closeModal(modalId) {
    if (typeof document === 'undefined') return;
    if (modalId === 'doc-print-designer-modal' || !modalId) {
      if (window.State && typeof window.State.closeModal === 'function') {
        window.State.closeModal();
      }
    }
    const el = document.getElementById(modalId);
    if (el) el.remove();
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  numberToWords(num) {
    if (isNaN(num) || num === null || num === undefined) return '';
    const n = Math.floor(Math.abs(Number(num)));
    if (n === 0) return 'Zero Rupees Only';

    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (val) => {
      let str = '';
      if (val > 99) {
        str += a[Math.floor(val / 100)] + ' Hundred ';
        val %= 100;
      }
      if (val > 19) {
        str += b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
      } else if (val > 0) {
        str += a[val];
      }
      return str.trim();
    };

    let result = '';
    const crore = Math.floor(n / 10000000);
    let rem = n % 10000000;
    const lakh = Math.floor(rem / 100000);
    rem %= 100000;
    const thousand = Math.floor(rem / 1000);
    rem %= 1000;
    const hundreds = rem;

    if (crore > 0) result += inWords(crore) + ' Crore ';
    if (lakh > 0) result += inWords(lakh) + ' Lakh ';
    if (thousand > 0) result += inWords(thousand) + ' Thousand ';
    if (hundreds > 0) result += inWords(hundreds);

    const paise = Math.round((Math.abs(Number(num)) - n) * 100);
    let paiseStr = '';
    if (paise > 0) {
      paiseStr = ' and ' + inWords(paise) + ' Paise';
    }

    return (result.trim() + ' Rupees' + paiseStr + ' Only');
  }
};
