/* ==========================================================================
   ENTERPRISE ISCM - DOCUMENT NUMBER SERIES MASTER MODULE (BRD v1.0 COMPLIANT)
   Centralized Document Numbering Engine for Two-Wheeler Management System
   Hierarchy: Company → Branch → Document Type → Number Series → FY → Sequence
   Standard Format: PREFIX/BRANCH/YYYY/###### (e.g. WO/PUN/2026/000001)
   ========================================================================== */

window.DocSeriesMasterModule = {
  searchTerm: '',
  docTypeFilter: 'ALL',
  branchFilter: 'ALL',
  statusFilter: 'ALL',
  currentPage: 1,
  pageSize: 10,
  recentGenerations: [],

  // System-supported Transaction Document Types (BRD Section 7 & 45)
  DOC_TYPES: [
    { code: 'WO', name: 'Work Order', module: 'Workshop', defaultPrefix: 'WO', color: '#3b82f6' },
    { code: 'JC', name: 'Job Card', module: 'Workshop', defaultPrefix: 'JC', color: '#06b6d4' },
    { code: 'EST', name: 'Customer Estimate', module: 'Workshop', defaultPrefix: 'EST', color: '#f59e0b' },
    { code: 'CIN', name: 'Customer Identification Number (CIN)', module: 'Customer / Journey', defaultPrefix: 'CIN', color: '#8b5cf6' },
    { code: 'DB', name: 'Draft Bill', module: 'Sales / Billing', defaultPrefix: 'DB', color: '#6366f1' },
    { code: 'INV', name: 'Tax Invoice / Bill', module: 'Sales / Billing', defaultPrefix: 'INV', color: '#10b981' },
    { code: 'GP', name: 'Delivery Gate Pass', module: 'Vehicle Delivery', defaultPrefix: 'GP', color: '#0ea5e9' },
    { code: 'CS', name: 'Counter Sale', module: 'Sales / Retail', defaultPrefix: 'CS', color: '#14b8a6' },
    { code: 'PO', name: 'Purchase Order', module: 'Purchase', defaultPrefix: 'PO', color: '#8b5cf6' },
    { code: 'GRN', name: 'Goods Receipt Note (GRN)', module: 'Purchase / Warehouse', defaultPrefix: 'GRN', color: '#6366f1' },
    { code: 'PR', name: 'Purchase Return', module: 'Purchase', defaultPrefix: 'PR', color: '#ec4899' },
    { code: 'SR', name: 'Sales Return', module: 'Sales', defaultPrefix: 'SR', color: '#f43f5e' },
    { code: 'ST', name: 'Stock Transfer', module: 'Inventory', defaultPrefix: 'ST', color: '#f59e0b' },
    { code: 'MI', name: 'Material Issue', module: 'Inventory', defaultPrefix: 'MI', color: '#d97706' },
    { code: 'MR', name: 'Material Return', module: 'Inventory', defaultPrefix: 'MR', color: '#eab308' },
    { code: 'CN', name: 'Credit Note', module: 'Accounts', defaultPrefix: 'CN', color: '#a855f7' },
    { code: 'DN', name: 'Debit Note', module: 'Accounts', defaultPrefix: 'DN', color: '#9333ea' },
    { code: 'WC', name: 'Warranty Claim', module: 'Warranty', defaultPrefix: 'WC', color: '#0ea5e9' },
    { code: 'RCP', name: 'Payment Receipt', module: 'Accounts / Billing', defaultPrefix: 'RCP', color: '#10b981' }
  ],

  // Fallback branches if plants are empty in DB
  DEFAULT_BRANCHES: [
    { id: 'BR-001', code: 'PUN', name: 'Pune Main Workshop' },
    { id: 'BR-002', code: 'MUM', name: 'Mumbai Central Workshop' },
    { id: 'BR-003', code: 'NAS', name: 'Nashik Auto Hub' },
    { id: 'ALL', code: 'ALL', name: 'All Facilities (Global Series)' }
  ],

  getBranches() {
    const plants = (window.DB && typeof window.DB.getActivePlants === 'function')
      ? window.DB.getActivePlants()
      : ((window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('plants') : []);
    const active = plants.filter(p => !window.DB || typeof window.DB.isPlantActive !== 'function' || window.DB.isPlantActive(p.id, true));
    if (active.length > 0) {
      const mapped = active.map(p => {
        let code = '';
        if (p.branch_code && !/^\d+$/.test(p.branch_code)) {
          code = p.branch_code;
        } else if (p.name && /Mauli Service Center 1/i.test(p.name)) {
          code = 'MSC1';
        } else if (p.name && /Mauli Service Center 2/i.test(p.name)) {
          code = 'MSC2';
        } else if (p.name) {
          const parts = p.name.trim().split(/\s+/);
          code = parts.map(w => /^\d+$/.test(w) ? w : w[0].toUpperCase()).join('').slice(0, 5);
        } else {
          code = (p.code ? p.code.replace('BRANCH-', 'BR') : p.id).toUpperCase().slice(0, 5);
        }
        return {
          id: p.id,
          code: code.toUpperCase(),
          name: p.name || `Facility ${p.id}`
        };
      });
      if (!mapped.some(m => m.id === 'ALL')) {
        mapped.push({ id: 'ALL', code: 'ALL', name: 'All Facilities (Global Series)' });
      }
      return mapped;
    }
    return [
      { id: 'PLANT-01', code: 'MSC1', name: 'Mauli Service Center 1' },
      { id: 'ALL', code: 'ALL', name: 'All Facilities (Global Series)' }
    ];
  },

  getDeletedSeriesIds() {
    let deleted = [];
    try {
      deleted = JSON.parse(localStorage.getItem('iscm_deleted_doc_series') || '[]');
    } catch (e) {
      deleted = [];
    }
    if (window.DB && window.DB.data && Array.isArray(window.DB.data.deleted_doc_series)) {
      window.DB.data.deleted_doc_series.forEach(id => {
        if (!deleted.includes(id)) deleted.push(id);
      });
    }
    return deleted;
  },

  markSeriesDeleted(seriesId) {
    let deleted = this.getDeletedSeriesIds();
    if (!deleted.includes(seriesId)) {
      deleted.push(seriesId);
    }
    try {
      localStorage.setItem('iscm_deleted_doc_series', JSON.stringify(deleted));
    } catch (e) {}
    if (window.DB && window.DB.data) {
      if (!Array.isArray(window.DB.data.deleted_doc_series)) window.DB.data.deleted_doc_series = [];
      if (!window.DB.data.deleted_doc_series.includes(seriesId)) {
        window.DB.data.deleted_doc_series.push(seriesId);
      }
    }
  },

  hasActiveTransactions(item) {
    if (!item) return false;
    const currentSeq = parseInt(item.current_number, 10) || 0;
    if (currentSeq === 0) return false;

    // Check if actual active documents exist in DB for this series
    if (window.DB && typeof window.DB.getAll === 'function') {
      const code = String(item.doc_type_code || item.prefix || '').toUpperCase();
      if (code === 'CIN') {
        const customers = window.DB.getAll('customers') || [];
        return customers.length > 0 && customers.some(c => {
          const cin = String(c.cin || c.cin_number || '').toUpperCase();
          const pfx = String(item.prefix || 'CIN').toUpperCase();
          const bCode = String(item.branch_code || '').toUpperCase();
          return cin.includes(pfx) && (!bCode || bCode === 'ALL' || cin.includes(bCode));
        });
      }
      if (code === 'JC') {
        const jcs = window.DB.getAll('jobCards') || [];
        return jcs.length > 0;
      }
      if (code === 'EST') {
        const ests = window.DB.getAll('estimates') || [];
        return ests.length > 0;
      }
      if (code === 'INV' || code === 'DB') {
        const bills = window.DB.getAll('bills') || [];
        return bills.length > 0;
      }
    }
    return currentSeq > 0;
  },

  getAllSeries() {
    let list = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('document_number_series') || []) : [];
    if (list.length === 0 && typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.document_number_series)) {
      list = JSON.parse(JSON.stringify(INITIAL_DATA.document_number_series));
      if (window.DB && typeof window.DB.upsert === 'function') {
        list.forEach(item => window.DB.upsert('document_number_series', item));
      }
    }

    // Filter out any explicitly deleted series
    const deletedIds = this.getDeletedSeriesIds();
    if (deletedIds.length > 0) {
      list = list.filter(s => !deletedIds.includes(s.id));
    }

    // Remap any old seed facilities (Pune Main Workshop, Mumbai Central, Nashik) to current Facility Master facilities
    let hasRemapped = false;
    list.forEach(item => {
      if (item.branch_id === 'BR-001' || item.branch_name === 'Pune Main Workshop' || item.branch_code === 'PUN') {
        item.branch_id = 'PLANT-01';
        item.branch_name = 'Mauli Service Center 1';
        item.branch_code = 'MSC1';
        hasRemapped = true;
      } else if (item.branch_id === 'BR-002' || item.branch_name === 'Mumbai Central Workshop' || item.branch_code === 'MUM') {
        item.branch_id = 'PLANT-02';
        item.branch_name = 'Mauli Service Center 2';
        item.branch_code = 'MSC2';
        hasRemapped = true;
      } else if (item.branch_id === 'BR-003' || item.branch_name === 'Nashik Auto Hub' || item.branch_code === 'NAS') {
        item.branch_id = 'PLANT-02';
        item.branch_name = 'Mauli Service Center 2';
        item.branch_code = 'MSC2';
        hasRemapped = true;
      }
    });

    // Ensure DNS-018 (Purchase Order for Mauli Service Center 1) is present
    let dns018 = list.find(s => s.id === 'DNS-018');
    if (!dns018) {
      dns018 = {
        id: 'DNS-018',
        doc_type_code: 'PO',
        doc_type_name: 'Purchase Order',
        module_name: 'Purchase',
        branch_id: 'PLANT-01',
        branch_name: 'Mauli Service Center 1',
        branch_code: 'MSC1',
        prefix: 'PO',
        suffix: '',
        separator: '/',
        year_format: 'FY',
        number_length: 4,
        starting_number: 1,
        current_number: 0,
        next_number: 1,
        reset_frequency: 'Financial Year',
        effective_from: '2026-04-01',
        effective_to: '2027-03-31',
        status: 'Active',
        description: 'Purchase Order series for Mauli Service Center 1',
        generated_count: 0,
        created_by: 'System Administrator',
        created_at: '2026-04-01T09:00:00Z',
        updated_at: '2026-10-07T00:00:00Z'
      };
      list.unshift(dns018);
      hasRemapped = true;
    } else {
      const idx = list.indexOf(dns018);
      if (idx > 0) {
        list.splice(idx, 1);
        list.unshift(dns018);
      }
    }

    // Helper to ensure standard series for all workshop facilities (PLANT-01, PLANT-02, ALL)
    const ensureStandardSeries = (code, name, module, prefix) => {
      const branches = [
        { id: `DNS-${prefix}-001`, branchId: 'PLANT-01', branchName: 'Mauli Service Center 1', branchCode: 'MSC1' },
        { id: `DNS-${prefix}-002`, branchId: 'PLANT-02', branchName: 'Mauli Service Center 2', branchCode: 'MSC2' },
        { id: `DNS-${prefix}-ALL`, branchId: 'ALL', branchName: 'All Facilities (Global Series)', branchCode: 'ALL' }
      ];
      branches.forEach(b => {
        if (deletedIds.includes(b.id)) return; // Never recreate explicitly deleted series
        let existing = list.find(s => (s.doc_type_code === code || s.prefix === prefix) && (s.branch_id === b.branchId || s.id === b.id));
        if (!existing) {
          existing = {
            id: b.id,
            doc_type_code: code,
            doc_type_name: name,
            module_name: module,
            branch_id: b.branchId,
            branch_name: b.branchName,
            branch_code: b.branchCode,
            prefix: prefix,
            suffix: '',
            separator: '/',
            year_format: 'YYYY',
            number_length: 6,
            starting_number: 1,
            current_number: 0,
            next_number: 1,
            reset_frequency: 'Financial Year',
            effective_from: '2026-04-01',
            effective_to: '2030-03-31',
            status: 'Active',
            description: `${name} series for ${b.branchName}`,
            generated_count: 0,
            created_by: 'System Administrator',
            created_at: '2026-04-01T09:00:00Z',
            updated_at: '2026-10-12T00:00:00Z'
          };
          list.push(existing);
          hasRemapped = true;
        } else {
          if (existing.doc_type_name !== name) {
            existing.doc_type_name = name;
            hasRemapped = true;
          }
        }
      });
    };

    // Note: CIN is managed as a unified global document number series or user-customized series, not forced per branch
    ensureStandardSeries('JC', 'Job Card', 'Workshop', 'JC');
    ensureStandardSeries('EST', 'Customer Estimate', 'Workshop', 'EST');
    ensureStandardSeries('DB', 'Draft Bill', 'Sales / Billing', 'DB');
    ensureStandardSeries('INV', 'Tax Invoice / Bill', 'Sales / Billing', 'INV');
    ensureStandardSeries('GP', 'Delivery Gate Pass', 'Vehicle Delivery', 'GP');
    ensureStandardSeries('CN', 'Credit Note', 'Accounts', 'CN');
    ensureStandardSeries('PO', 'Purchase Order', 'Purchase', 'PO');
    ensureStandardSeries('GRN', 'Goods Receipt Note (GRN)', 'Purchase / Warehouse', 'GRN');
    ensureStandardSeries('CS', 'Counter Sale', 'Sales / Retail', 'CS');
    ensureStandardSeries('WO', 'Work Order', 'Workshop', 'WO');
    ensureStandardSeries('PR', 'Purchase Return', 'Purchase', 'PR');
    ensureStandardSeries('SR', 'Sales Return', 'Sales', 'SR');
    ensureStandardSeries('ST', 'Stock Transfer', 'Inventory', 'ST');
    ensureStandardSeries('MI', 'Material Issue', 'Inventory', 'MI');
    ensureStandardSeries('MR', 'Material Return', 'Inventory', 'MR');
    ensureStandardSeries('DN', 'Debit Note', 'Accounts', 'DN');
    ensureStandardSeries('WC', 'Warranty Claim', 'Warranty', 'WC');
    ensureStandardSeries('RCP', 'Payment Receipt', 'Accounts / Billing', 'RCP');

    if (hasRemapped && window.DB) {
      if (window.DB.data) {
        window.DB.data.document_number_series = list;
        if (typeof window.DB.saveData === 'function') window.DB.saveData();
      }
    }

    return list;
  },

  formatDocumentNumber(config, seqNumber) {
    if (!config) return '';
    const prefix = (config.prefix || 'DOC').toUpperCase().trim();
    const branchCode = (config.branch_code || 'HQ').toUpperCase().trim();
    const separator = (config.separator !== undefined && config.separator !== null) ? config.separator : '/';
    const numLen = parseInt(config.number_length, 10) || 6;
    const seq = String(seqNumber || config.starting_number || 1).padStart(numLen, '0');
    
    // Resolve Year based on year_format
    const now = new Date();
    const yyyy = now.getFullYear();
    const yy = String(yyyy).slice(-2);
    let yearPart = '';

    const yf = (config.year_format || 'YYYY').toUpperCase();
    if (yf === 'YYYY') {
      yearPart = String(yyyy);
    } else if (yf === 'YY') {
      yearPart = yy;
    } else if (yf === 'FY' || yf === 'FINANCIAL_YEAR') {
      // In India FY is Apr 1 to Mar 31
      const month = now.getMonth() + 1;
      const startYear = (month >= 4) ? yyyy : yyyy - 1;
      const endYearShort = String(startYear + 1).slice(-2);
      yearPart = `${String(startYear).slice(-2)}-${endYearShort}`;
    } else if (yf === 'NONE' || yf === 'NO_YEAR') {
      yearPart = '';
    } else {
      yearPart = String(yyyy);
    }

    const parts = [];
    if (prefix) parts.push(prefix);
    if (branchCode && branchCode !== 'NONE') parts.push(branchCode);
    if (yearPart) parts.push(yearPart);
    if (seq) parts.push(seq);

    let formatted = parts.join(separator);
    if (config.suffix && config.suffix.trim()) {
      formatted += (separator + config.suffix.trim());
    }
    return formatted;
  },

  formatPatternMask(config) {
    if (!config) return '';
    const prefix = (config.prefix || 'DOC').toUpperCase().trim();
    const branchCode = (config.branch_code || 'BRANCH').toUpperCase().trim();
    const separator = (config.separator !== undefined && config.separator !== null) ? config.separator : '/';
    const numLen = parseInt(config.number_length, 10) || 6;
    const maskSeq = '#'.repeat(numLen);
    
    const now = new Date();
    const yyyy = now.getFullYear();
    let yearPart = String(yyyy);
    const yf = (config.year_format || 'YYYY').toUpperCase();
    if (yf === 'YY') yearPart = String(yyyy).slice(-2);
    else if (yf === 'FY' || yf === 'FINANCIAL_YEAR') yearPart = `${String(yyyy).slice(-2)}-${String(yyyy + 1).slice(-2)}`;
    else if (yf === 'NONE') yearPart = '';

    const parts = [];
    if (prefix) parts.push(prefix);
    if (branchCode && branchCode !== 'NONE') parts.push(branchCode);
    if (yearPart) parts.push(yearPart);
    parts.push(maskSeq);

    let pattern = parts.join(separator);
    if (config.suffix && config.suffix.trim()) {
      pattern += (separator + config.suffix.trim());
    }
    return pattern;
  },

  renderContentCard() {
    return `
      <div class="content-card" id="doc-series-wrapper" style="font-family: var(--font-sans, 'Inter', sans-serif);">
        ${this.renderCardHeader()}
        <div id="doc-series-table-container">
          ${this.renderTableContent()}
        </div>
      </div>
    `;
  },

  // Main render entry point (works standalone or inside OrgLocationModule tabs)
  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    // Hide breadcrumb bar if present to maintain master layout standards
    const pageTopBar = (typeof document !== 'undefined' && document.getElementById) 
      ? (document.getElementById('page-top-bar') || (document.querySelector && document.querySelector('.page-top-bar'))) 
      : null;
    if (pageTopBar) pageTopBar.style.display = 'none';

    container.innerHTML = this.renderContentCard();
  },

  // Delegation from OrgLocationModule tab
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
              id="doc-series-search-input" 
              class="form-control form-control-sm" 
              placeholder="Search code, prefix, facility..." 
              value="${this.searchTerm}" 
              oninput="window.DocSeriesMasterModule.setSearch(this.value)" 
              style="width: 210px; height: 32px; font-size: 13px; padding-right: 24px;" 
              autocomplete="off"
            />
            <button 
              id="doc-series-search-clear"
              type="button" 
              onclick="window.DocSeriesMasterModule.clearSearch()" 
              style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: ${this.searchTerm ? 'block' : 'none'}; font-size: 14px; line-height: 1;"
              title="Clear search"
            >&times;</button>
          </div>

          <!-- Document Type Filter -->
          <select 
            id="doc-series-type-filter" 
            class="form-control form-control-sm" 
            onchange="window.DocSeriesMasterModule.setDocTypeFilter(this.value)" 
            style="width: 175px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.docTypeFilter === 'ALL' ? 'selected' : ''}>All Document Types</option>
            ${this.DOC_TYPES.map(dt => `
              <option value="${dt.code}" ${this.docTypeFilter === dt.code ? 'selected' : ''}>${dt.name} (${dt.code})</option>
            `).join('')}
          </select>

          <!-- Facility Filter -->
          <select 
            id="doc-series-branch-filter" 
            class="form-control form-control-sm" 
            onchange="window.DocSeriesMasterModule.setBranchFilter(this.value)" 
            style="width: 155px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.branchFilter === 'ALL' ? 'selected' : ''}>All Facilities</option>
            ${branches.map(b => `
              <option value="${b.id}" ${this.branchFilter === b.id ? 'selected' : ''}>${b.name}</option>
            `).join('')}
          </select>

          <!-- Status Filter -->
          <select 
            id="doc-series-status-filter" 
            class="form-control form-control-sm" 
            onchange="window.DocSeriesMasterModule.setStatusFilter(this.value)" 
            style="width: 115px; height: 32px; font-size: 13px;"
          >
            <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Status</option>
            <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>

        <!-- Right: Actions -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="btn-reset-all-series" class="btn btn-secondary btn-sm" onclick="window.DocSeriesMasterModule.promptResetAll()" title="Reset All Series Sequences to Start from 1" style="height: 32px; font-size: 13px; font-weight: 600; color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);">
            🔄 Reset to 1
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.DocSeriesMasterModule.showSimulatorModal()" title="Open Sequential Number Generator Simulator" style="height: 32px; font-size: 13px; font-weight: 600; color: var(--primary-300);">
            ⚡ Test Generator
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.DocSeriesMasterModule.exportCsv()" title="Export Series to CSV" style="height: 32px; font-size: 13px;">
            Export CSV
          </button>
          <button id="btn-add-doc-series" class="btn btn-primary btn-sm" onclick="window.DocSeriesMasterModule.showAddModal()" style="height: 32px; font-size: 13px; font-weight: 600;">
            + Add Number Series
          </button>
        </div>
      </div>
    `;
  },

  // Backward compatibility alias
  renderTopToolbar() {
    return this.renderCardHeader();
  },

  renderTableContent() {
    let list = this.getAllSeries();

    // Filtering
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase().trim();
      list = list.filter(item => {
        const text = [
          item.id,
          item.doc_type_code,
          item.doc_type_name,
          item.branch_code,
          item.branch_name,
          item.prefix,
          item.suffix,
          item.description,
          this.formatPatternMask(item),
          this.formatDocumentNumber(item, (item.current_number || 0) + 1)
        ].filter(Boolean).join(' ').toLowerCase();
        return text.includes(q);
      });
    }

    if (this.docTypeFilter !== 'ALL') {
      list = list.filter(item => item.doc_type_code === this.docTypeFilter || item.prefix === this.docTypeFilter);
    }

    if (this.branchFilter !== 'ALL') {
      list = list.filter(item => item.branch_id === this.branchFilter);
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter(item => item.status === this.statusFilter);
    }

    if (list.length === 0) {
      return `
        <div style="text-align: center; padding: 48px 16px;">
          <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
          <div style="font-size: 16px; font-weight: 600; color: var(--text-primary);">No Number Series Found</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px; max-width: 420px; margin-left: auto; margin-right: auto;">
            No records matched your search query or selected filters. Try broadening your criteria or create a new series.
          </div>
          <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-secondary btn-sm" onclick="window.DocSeriesMasterModule.resetFilters()">Clear Filters</button>
            <button class="btn btn-primary btn-sm" onclick="window.DocSeriesMasterModule.showAddModal()">+ Add Number Series</button>
          </div>
        </div>
      `;
    }

    const pagedSeries = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(list, 'docSeries')
      : { items: list.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize), totalRecords: list.length, currentPage: this.currentPage, pageSize: this.pageSize };

    const pageItems = pagedSeries.items;

    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Series ID</th>
              <th>Document Type</th>
              <th>Facility</th>
              <th>Format Pattern</th>
              <th class="text-center">Current Seq</th>
              <th>Next Document Number</th>
              <th>Reset Rule</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pageItems.map(item => {
              const startingNum = parseInt(item.starting_number, 10) || 1;
              const currentSeq = parseInt(item.current_number, 10) || 0;
              const nextSeq = (currentSeq >= startingNum) ? (currentSeq + 1) : startingNum;
              const nextFormatted = this.formatDocumentNumber(item, nextSeq);
              const pattern = this.formatPatternMask(item);
              const hasTransactions = this.hasActiveTransactions(item);

              return `
                <tr>
                  <!-- Series ID -->
                  <td>
                    <span class="cell-mono cell-strong" style="color: var(--primary-300);">${item.id}</span>
                  </td>

                  <!-- Document Type -->
                  <td>
                    <div class="cell-strong">${item.doc_type_name || item.doc_type_code}</div>
                  </td>

                  <!-- Facility / Branch -->
                  <td>
                    <div>${item.branch_name || 'All Facilities'}</div>
                  </td>

                  <!-- Prefix & Pattern Mask -->
                  <td>
                    <code class="cell-mono" style="font-size: 12px; font-weight: 600; color: #a78bfa; background: rgba(139, 92, 246, 0.12); padding: 2px 6px; border-radius: 4px;">
                      ${pattern}
                    </code>
                  </td>

                  <!-- Current Sequence -->
                  <td class="text-center">
                    <span class="cell-strong">${currentSeq}</span>
                  </td>

                  <!-- Next Document Number -->
                  <td>
                    <span class="cell-mono cell-strong" style="font-size: 12px; color: #10b981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); padding: 2px 7px; border-radius: 4px;">
                      ${nextFormatted}
                    </span>
                  </td>

                  <!-- Reset Rule -->
                  <td style="color: var(--text-secondary); font-size: 12px;">
                    ${item.reset_frequency || 'Financial Year'}
                  </td>

                  <!-- Status -->
                  <td class="text-center">
                    <span class="status-pill ${item.status === 'Active' ? 'status-approved' : 'status-rejected'}">
                      ${item.status}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="text-right">
                    <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                      <!-- Quick Generate Next Number -->
                      <button 
                        class="btn btn-icon btn-sm" 
                        onclick="window.DocSeriesMasterModule.triggerQuickGenerate('${item.id}')" 
                        title="Generate Next Number"
                        style="color: #10b981; border-color: rgba(16, 185, 129, 0.3);"
                      >
                        ⚡
                      </button>

                      <!-- Edit Series -->
                      <button 
                        class="btn btn-icon btn-sm" 
                        onclick="window.DocSeriesMasterModule.showEditModal('${item.id}')" 
                        title="Edit Series"
                      >
                        ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
                      </button>

                      <!-- Delete Series -->
                      <button 
                        class="btn btn-icon btn-sm" 
                        onclick="window.DocSeriesMasterModule.deleteSeries('${item.id}')" 
                        title="${hasTransactions ? 'Cannot delete used series (Deactivate instead)' : 'Delete Series'}"
                        style="color: ${hasTransactions ? 'var(--text-muted)' : 'var(--color-danger)'}; opacity: ${hasTransactions ? '0.4' : '1'};"
                      >
                        ${window.AppIcons ? window.AppIcons.svgDelete : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'}
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
        currentPage: pagedSeries.currentPage,
        pageSize: pagedSeries.pageSize,
        onPageChange: 'window.DocSeriesMasterModule.setPage(%p%)',
        onPageSizeChange: 'window.DocSeriesMasterModule.setPageSize(%s%)'
      }) : ''}
    `;
  },

  // State updaters
  setSearch(val) {
    this.searchTerm = val || '';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docSeries');
    }
    if (typeof document !== 'undefined') {
      const clearBtn = document.getElementById('doc-series-search-clear');
      if (clearBtn) clearBtn.style.display = this.searchTerm ? 'block' : 'none';
    }
    this.refreshTable();
  },

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docSeries');
    }
    if (typeof document !== 'undefined') {
      const input = document.getElementById('doc-series-search-input');
      if (input) input.value = '';
      const clearBtn = document.getElementById('doc-series-search-clear');
      if (clearBtn) clearBtn.style.display = 'none';
    }
    this.refreshTable();
  },

  setDocTypeFilter(val) {
    this.docTypeFilter = val || 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docSeries');
    }
    this.refreshTable();
  },

  setBranchFilter(val) {
    this.branchFilter = val || 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docSeries');
    }
    this.refreshTable();
  },

  setStatusFilter(val) {
    this.statusFilter = val || 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docSeries');
    }
    this.refreshTable();
  },

  resetFilters() {
    this.searchTerm = '';
    this.docTypeFilter = 'ALL';
    this.branchFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('docSeries');
    }
    const sInput = document.getElementById('doc-series-search-input');
    if (sInput) sInput.value = '';
    const dtSelect = document.getElementById('doc-series-type-filter');
    if (dtSelect) dtSelect.value = 'ALL';
    const brSelect = document.getElementById('doc-series-branch-filter');
    if (brSelect) brSelect.value = 'ALL';
    const stSelect = document.getElementById('doc-series-status-filter');
    if (stSelect) stSelect.value = 'ALL';
    this.refreshTable();
  },

  setPage(page) {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPage('docSeries', page);
      this.currentPage = window.PaginationHelper.getState('docSeries').currentPage;
    } else {
      this.currentPage = page;
    }
    this.refreshTable();
  },

  setPageSize(size) {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPageSize('docSeries', size);
      this.pageSize = window.PaginationHelper.getState('docSeries').pageSize;
      this.currentPage = window.PaginationHelper.getState('docSeries').currentPage;
    } else {
      this.pageSize = size;
      this.currentPage = 1;
    }
    this.refreshTable();
  },

  refreshTable() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('doc-series-table-container');
    if (container) {
      container.innerHTML = this.renderTableContent();
    } else {
      this.render();
    }
  },

  // Unified, robust finder for active document number series across all document types & branch aliases
  findSeries(docTypeCode, branchId) {
    const all = this.getAllSeries();
    const dt = String(docTypeCode || '').trim().toUpperCase();
    const targetBranch = String(branchId || (window.State && window.State.currentPlantId) || 'PLANT-01').trim().toUpperCase();

    // Helper to test if a series branch matches target branch or facility aliases
    const matchesBranch = (s, bTarget) => {
      if (!bTarget) return false;
      const sBid = String(s.branch_id || '').toUpperCase();
      const sBcode = String(s.branch_code || '').toUpperCase();
      const sBname = String(s.branch_name || '').toUpperCase();

      if (sBid === bTarget || sBcode === bTarget) return true;
      if (bTarget === 'PLANT-01' && (sBcode === 'MSC1' || sBcode === 'PUN' || sBid === 'BR-001' || sBname.includes('MAULI SERVICE CENTER 1') || sBname.includes('PUNE'))) return true;
      if (bTarget === 'PLANT-02' && (sBcode === 'MSC2' || sBcode === 'MUM' || sBid === 'BR-002' || sBname.includes('MAULI SERVICE CENTER 2') || sBname.includes('MUMBAI') || sBname.includes('WAKAD'))) return true;
      if (bTarget === 'MAULI-01' && (sBid === 'PLANT-01' || sBcode === 'MSC1' || sBid === 'BR-001')) return true;
      if (bTarget === 'MAULI-02' && (sBid === 'PLANT-02' || sBcode === 'MSC2' || sBid === 'BR-002')) return true;
      if (bTarget === 'MSC1' && (sBid === 'PLANT-01' || sBcode === 'MAULI-01')) return true;
      if (bTarget === 'MSC2' && (sBid === 'PLANT-02' || sBcode === 'MAULI-02')) return true;
      return false;
    };

    // 1. Direct active branch series match
    let series = all.find(s => 
      s.status === 'Active' && 
      (String(s.doc_type_code || '').toUpperCase() === dt || String(s.prefix || '').toUpperCase() === dt) && 
      matchesBranch(s, targetBranch)
    );

    // 2. Fallback to Global All Branches series
    if (!series) {
      series = all.find(s => 
        s.status === 'Active' && 
        (String(s.doc_type_code || '').toUpperCase() === dt || String(s.prefix || '').toUpperCase() === dt) && 
        (String(s.branch_id || '').toUpperCase() === 'ALL' || String(s.branch_code || '').toUpperCase() === 'ALL')
      );
    }

    // 3. Fallback to ANY active series for this document type (e.g. user customized single facility series)
    if (!series) {
      series = all.find(s => 
        s.status === 'Active' && 
        (String(s.doc_type_code || '').toUpperCase() === dt || String(s.prefix || '').toUpperCase() === dt)
      );
    }

    // 4. Fallback: create dynamic series if none configured yet
    if (!series) {
      const dtInfo = this.DOC_TYPES.find(d => String(d.code).toUpperCase() === dt) || { name: docTypeCode, module: 'Transaction', defaultPrefix: docTypeCode };
      const branchCode = (targetBranch === 'PLANT-02' || targetBranch === 'MSC2' || targetBranch === 'MAULI-02') ? 'MSC2' : ((targetBranch === 'ALL') ? 'ALL' : 'MSC1');
      const branchName = (branchCode === 'MSC2') ? 'Mauli Service Center 2' : ((branchCode === 'ALL') ? 'All Branches (Global Series)' : 'Mauli Service Center 1');
      const prefix = dtInfo.defaultPrefix || docTypeCode;

      series = {
        id: `DNS-${prefix}-${branchCode}`,
        doc_type_code: docTypeCode,
        doc_type_name: dtInfo.name,
        module_name: dtInfo.module,
        branch_id: branchId || 'PLANT-01',
        branch_name: branchName,
        branch_code: branchCode,
        prefix: prefix,
        suffix: '',
        separator: '/',
        year_format: 'YYYY',
        number_length: 6,
        starting_number: 1,
        current_number: 0,
        next_number: 1,
        reset_frequency: 'Financial Year',
        effective_from: '2026-04-01',
        effective_to: '2030-03-31',
        status: 'Active',
        description: `${dtInfo.name} series for ${branchName}`,
        generated_count: 0,
        created_by: 'System Administrator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      all.push(series);
      if (window.DB && typeof window.DB.upsert === 'function') {
        window.DB.upsert('document_number_series', series);
        if (typeof window.DB.saveData === 'function') window.DB.saveData();
      }
    }

    return series;
  },

  // Broadcast doc-series updates to all modules and reactive UI components
  notifySeriesUpdated(series) {
    if (window.DB) {
      if (typeof window.DB.saveData === 'function') window.DB.saveData();
      if (typeof window.DB.emitChange === 'function') window.DB.emitChange('document_number_series');
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('doc-series-updated', { detail: series }));
    }
    if (window.BillingModule && typeof window.BillingModule.onDocSeriesUpdated === 'function') {
      try { window.BillingModule.onDocSeriesUpdated(series); } catch (e) { console.warn(e); }
    }
    if (window.StoreInventoryModule && typeof window.StoreInventoryModule.onDocSeriesUpdated === 'function') {
      try { window.StoreInventoryModule.onDocSeriesUpdated(series); } catch (e) { console.warn(e); }
    }
  },

  // Preview next number without incrementing or saving counter
  previewNextNumber(docTypeCode, branchId = 'PLANT-01') {
    const series = this.findSeries(docTypeCode, branchId);
    if (!series) return '';
    const startingNum = parseInt(series.starting_number, 10) || 1;
    const currentNum = parseInt(series.current_number, 10) || 0;
    const nextSeq = (currentNum >= startingNum) ? (currentNum + 1) : startingNum;
    return this.formatDocumentNumber(series, nextSeq);
  },

  // ==========================================================================
  // NUMBER GENERATION CORE ENGINE (BRD Section 40, FR-40)
  // ==========================================================================
  generateNextNumber(docTypeCode, branchId) {
    // 1. Identify Applicable Series (with robust branch resolution)
    const series = this.findSeries(docTypeCode, branchId);
    if (!series) {
      return { success: false, error: `No active series found for document type ${docTypeCode}` };
    }

    // 2. Lock & Reserve Next Sequence Atomically
    const startingNum = parseInt(series.starting_number, 10) || 1;
    const currentNum = parseInt(series.current_number, 10) || 0;
    const nextSeq = (currentNum >= startingNum) ? (currentNum + 1) : startingNum;

    // Check Sequence Overflow (V-07)
    const numLen = parseInt(series.number_length, 10) || 6;
    const maxSeq = Math.pow(10, numLen) - 1;
    if (nextSeq > maxSeq) {
      return {
        success: false,
        error: `Sequence overflow for ${series.id}: Sequence (${nextSeq}) exceeds configured number length of ${numLen} digits (${maxSeq}). Please adjust series length or reset sequence.`
      };
    }

    // 3. Format Number
    const generatedNumber = this.formatDocumentNumber(series, nextSeq);

    // 4. Increment and Save
    series.current_number = nextSeq;
    series.next_number = nextSeq + 1;
    series.generated_count = (parseInt(series.generated_count, 10) || 0) + 1;
    series.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_number_series', series);
      if (typeof window.DB.saveData === 'function') window.DB.saveData();
      if (typeof window.DB.emitChange === 'function') window.DB.emitChange('document_number_series');
    }

    // 5. Append to recent generations log
    const logItem = {
      timestamp: new Date().toLocaleTimeString(),
      seriesId: series.id,
      docType: series.doc_type_name || series.doc_type_code,
      branch: series.branch_name || series.branch_code,
      docNumber: generatedNumber,
      sequence: nextSeq
    };
    this.recentGenerations.unshift(logItem);
    if (this.recentGenerations.length > 20) this.recentGenerations.pop();

    this.notifySeriesUpdated(series);

    return {
      success: true,
      docNumber: generatedNumber,
      seriesId: series.id,
      sequence: nextSeq,
      series
    };
  },

  // Fast One-Click Test Generator from Table Row
  triggerQuickGenerate(seriesId) {
    const all = this.getAllSeries();
    const series = all.find(s => s.id === seriesId);
    if (!series) return;

    if (series.status !== 'Active') {
      if (window.State && window.State.showToast) {
        window.State.showToast(`Cannot generate number: Series ${series.id} is currently Inactive. Please activate it first.`, 'warning');
      } else {
        alert(`Cannot generate number: Series ${series.id} is currently Inactive.`);
      }
      return;
    }

    const result = this.generateNextNumber(series.doc_type_code, series.branch_id);
    if (result.success) {
      if (window.State && window.State.showToast) {
        window.State.showToast(`⚡ Generated Document Number: ${result.docNumber} (Sequence #${result.sequence})`, 'success');
      } else {
        alert(`Generated Document Number: ${result.docNumber}`);
      }
      this.refreshTable();
    } else {
      if (window.State && window.State.showToast) {
        window.State.showToast(result.error, 'error');
      } else {
        alert(result.error);
      }
    }
  },

  // ==========================================================================
  // REAL-TIME MODAL & LIVE PREVIEW ENGINE (FR-27, FR-28)
  // ==========================================================================
  updateModalPreview() {
    const docTypeSelect = document.getElementById('dns-modal-doc-type');
    const branchSelect = document.getElementById('dns-modal-branch');
    const prefixInput = document.getElementById('dns-modal-prefix');
    const branchCodeInput = document.getElementById('dns-modal-branch-code');
    const separatorSelect = document.getElementById('dns-modal-separator');
    const yearFormatSelect = document.getElementById('dns-modal-year-format');
    const lengthSelect = document.getElementById('dns-modal-length');
    const startNumInput = document.getElementById('dns-modal-start-num');
    const suffixInput = document.getElementById('dns-modal-suffix');

    if (!prefixInput || !lengthSelect) return;

    const prefix = (prefixInput.value || 'DOC').toUpperCase().trim();
    const branchCode = (branchCodeInput ? branchCodeInput.value : 'PUN').toUpperCase().trim();
    const separator = separatorSelect ? separatorSelect.value : '/';
    const yearFormat = yearFormatSelect ? yearFormatSelect.value : 'YYYY';
    const numLen = parseInt(lengthSelect.value, 10) || 6;
    const startNum = parseInt(startNumInput ? startNumInput.value : 1, 10) || 1;
    const suffix = suffixInput ? suffixInput.value.trim() : '';

    const modalId = document.getElementById('dns-modal-id') ? document.getElementById('dns-modal-id').value : null;
    let seqToPreview = startNum;
    if (modalId) {
      const all = this.getAllSeries();
      const existing = all.find(s => s.id === modalId);
      if (existing && (existing.current_number !== undefined || existing.generated_count !== undefined)) {
        seqToPreview = (parseInt(existing.current_number || existing.generated_count, 10) || 0) + 1;
      }
    }

    const tempConfig = {
      prefix,
      branch_code: branchCode,
      separator,
      year_format: yearFormat,
      number_length: numLen,
      starting_number: startNum,
      suffix
    };

    const sampleNumber = this.formatDocumentNumber(tempConfig, seqToPreview);
    const patternMask = this.formatPatternMask(tempConfig);

    const previewDisplay = document.getElementById('dns-preview-display');
    const patternDisplay = document.getElementById('dns-pattern-display');
    if (previewDisplay) previewDisplay.innerText = sampleNumber;
    if (patternDisplay) patternDisplay.innerText = patternMask;
  },

  onDocTypeChange(docTypeCode) {
    const dt = this.DOC_TYPES.find(d => d.code === docTypeCode);
    const prefixInput = document.getElementById('dns-modal-prefix');
    if (dt && prefixInput && (!prefixInput.dataset.manual || prefixInput.dataset.manual === 'false')) {
      prefixInput.value = dt.defaultPrefix;
    }
    this.updateModalPreview();
  },

  onBranchChange(branchId) {
    const branches = this.getBranches();
    const b = branches.find(item => item.id === branchId);
    const branchCodeInput = document.getElementById('dns-modal-branch-code');
    if (b && branchCodeInput) {
      branchCodeInput.value = b.code;
    }
    this.updateModalPreview();
  },

  // Add Number Series Modal
  showAddModal() {
    const branches = this.getBranches();
    const all = this.getAllSeries();
    const nextIdNum = all.length + 1;
    const newId = `DNS-${String(nextIdNum).padStart(3, '0')}`;

    const defaultDoc = this.DOC_TYPES[0];
    const defaultBranch = branches[0];

    const modalHtml = `
      <div id="doc-series-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 720px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          
          <!-- Modal Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; border-bottom: 1px solid var(--border-color); background: rgba(255, 255, 255, 0.02);">
            <div>
              <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: var(--text-primary);">
                Add Document Number Series
              </h3>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-secondary);">
                Configure automatic sequential numbering rules for transaction documents
              </p>
            </div>
            <button onclick="window.DocSeriesMasterModule.closeModal()" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <!-- Live Reactive Preview Card (BRD Section 28) -->
          <div style="padding: 16px 22px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08)); border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a78bfa; letter-spacing: 0.5px;">
                ⚡ Live Real-time Number Preview
              </span>
              <span style="font-size: 11px; color: var(--text-muted); font-family: monospace;">
                Pattern: <strong id="dns-pattern-display" style="color: var(--text-primary);">${defaultDoc.defaultPrefix}/${defaultBranch.code}/2026/######</strong>
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div id="dns-preview-display" style="font-family: monospace; font-size: 20px; font-weight: 800; color: #34d399; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 16px; border-radius: 6px; letter-spacing: 1px;">
                ${defaultDoc.defaultPrefix}/${defaultBranch.code}/2026/000001
              </div>
              <span style="font-size: 12px; color: var(--text-secondary); max-width: 240px; line-height: 1.3;">
                This exact format will be generated when transactions are saved.
              </span>
            </div>
          </div>

          <!-- Form Fields -->
          <form id="dns-form" onsubmit="window.DocSeriesMasterModule.saveNewSeries(event)" style="padding: 20px 22px;">
            <input type="hidden" id="dns-modal-id" value="${newId}" />

            <!-- Row 1: Document Type & Branch -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Document Type <span style="color: var(--color-danger);">*</span>
                </label>
                <select 
                  id="dns-modal-doc-type" 
                  class="form-control form-control-sm" 
                  required 
                  onchange="window.DocSeriesMasterModule.onDocTypeChange(this.value)"
                  style="height: 34px; font-size: 13px;"
                >
                  ${this.DOC_TYPES.map(dt => `
                    <option value="${dt.code}">${dt.name} (${dt.code}) - ${dt.module}</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Applicable Facility <span style="color: var(--color-danger);">*</span>
                </label>
                <select 
                  id="dns-modal-branch" 
                  class="form-control form-control-sm" 
                  required 
                  onchange="window.DocSeriesMasterModule.onBranchChange(this.value)"
                  style="height: 34px; font-size: 13px;"
                >
                  ${branches.map(b => `
                    <option value="${b.id}">${b.name} (${b.code})</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Row 2: Prefix, Branch Code & Suffix -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Prefix <span style="color: var(--color-danger);">*</span>
                </label>
                <input 
                  type="text" 
                  id="dns-modal-prefix" 
                  class="form-control form-control-sm" 
                  required 
                  value="${defaultDoc.defaultPrefix}" 
                  maxlength="8"
                  oninput="this.dataset.manual='true'; window.DocSeriesMasterModule.updateModalPreview()" 
                  style="text-transform: uppercase; font-family: monospace; font-weight: 600; height: 34px;"
                />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Branch Code in Series <span style="color: var(--color-danger);">*</span>
                </label>
                <input 
                  type="text" 
                  id="dns-modal-branch-code" 
                  class="form-control form-control-sm" 
                  required 
                  value="${defaultBranch.code}" 
                  maxlength="6"
                  oninput="window.DocSeriesMasterModule.updateModalPreview()" 
                  style="text-transform: uppercase; font-family: monospace; font-weight: 600; height: 34px;"
                />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Suffix
                </label>
                <input 
                  type="text" 
                  id="dns-modal-suffix" 
                  class="form-control form-control-sm" 
                  placeholder="e.g. GAR, HQ" 
                  maxlength="8"
                  oninput="window.DocSeriesMasterModule.updateModalPreview()" 
                  style="text-transform: uppercase; font-family: monospace; height: 34px;"
                />
              </div>
            </div>

            <!-- Row 3: Separator, Year Format, Number Length -->
            <div style="display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Separator
                </label>
                <select 
                  id="dns-modal-separator" 
                  class="form-control form-control-sm" 
                  onchange="window.DocSeriesMasterModule.updateModalPreview()"
                  style="height: 34px; font-size: 13px;"
                >
                  <option value="/" selected>Slash (/)</option>
                  <option value="-">Hyphen (-)</option>
                  <option value=".">Dot (.)</option>
                  <option value="">None (Concatenated)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Year Format <span style="color: var(--color-danger);">*</span>
                </label>
                <select 
                  id="dns-modal-year-format" 
                  class="form-control form-control-sm" 
                  onchange="window.DocSeriesMasterModule.updateModalPreview()"
                  style="height: 34px; font-size: 13px;"
                >
                  <option value="YYYY" selected>YYYY (e.g. 2026)</option>
                  <option value="YY">YY (e.g. 26)</option>
                  <option value="FY">Financial Year (e.g. 26-27)</option>
                  <option value="NONE">No Year in Number</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Number Length <span style="color: var(--color-danger);">*</span>
                </label>
                <select 
                  id="dns-modal-length" 
                  class="form-control form-control-sm" 
                  onchange="window.DocSeriesMasterModule.updateModalPreview()"
                  style="height: 34px; font-size: 13px;"
                >
                  <option value="4">4 Digits (0001)</option>
                  <option value="5">5 Digits (00001)</option>
                  <option value="6" selected>6 Digits (000001)</option>
                  <option value="7">7 Digits (0000001)</option>
                  <option value="8">8 Digits (00000001)</option>
                </select>
              </div>
            </div>

            <!-- Row 4: Sequence Rules -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Starting Number <span style="color: var(--color-danger);">*</span>
                </label>
                <input 
                  type="number" 
                  id="dns-modal-start-num" 
                  class="form-control form-control-sm" 
                  min="1" 
                  value="1" 
                  required 
                  oninput="window.DocSeriesMasterModule.updateModalPreview()" 
                  style="height: 34px;"
                />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Reset Frequency <span style="color: var(--color-danger);">*</span>
                </label>
                <select 
                  id="dns-modal-reset" 
                  class="form-control form-control-sm" 
                  style="height: 34px; font-size: 13px;"
                >
                  <option value="Financial Year" selected>Financial Year (Apr-Mar)</option>
                  <option value="Calendar Year">Calendar Year (Jan-Dec)</option>
                  <option value="Never">Never (Continuous)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Status <span style="color: var(--color-danger);">*</span>
                </label>
                <select 
                  id="dns-modal-status" 
                  class="form-control form-control-sm" 
                  style="height: 34px; font-size: 13px;"
                >
                  <option value="Active" selected>Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <!-- Row 5: Effective Dates -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Effective From <span style="color: var(--color-danger);">*</span>
                </label>
                <input 
                  type="date" 
                  id="dns-modal-eff-from" 
                  class="form-control form-control-sm" 
                  required 
                  value="${new Date().toISOString().slice(0, 10)}" 
                  style="height: 34px;"
                />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Effective To
                </label>
                <input 
                  type="date" 
                  id="dns-modal-eff-to" 
                  class="form-control form-control-sm" 
                  style="height: 34px;"
                />
              </div>
            </div>

            <!-- Row 6: Remarks -->
            <div style="margin-bottom: 18px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Description & Purpose Notes
              </label>
              <textarea 
                id="dns-modal-desc" 
                class="form-control form-control-sm" 
                rows="2" 
                placeholder="Specify purpose of this document number series..."
                style="resize: vertical; font-size: 13px;"
              ></textarea>
            </div>

            <!-- Modal Footer -->
            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 14px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.DocSeriesMasterModule.closeModal()" style="height: 32px;">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary btn-sm" style="height: 32px; font-weight: 600;">
                Save Number Series
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  // Edit Number Series Modal
  showEditModal(seriesId) {
    const all = this.getAllSeries();
    const series = all.find(s => s.id === seriesId);
    if (!series) return;

    const branches = this.getBranches();
    const hasTransactions = (parseInt(series.generated_count, 10) || parseInt(series.current_number, 10) || 0) > 0;

    const modalHtml = `
      <div id="doc-series-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 720px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          
          <!-- Modal Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; border-bottom: 1px solid var(--border-color); background: rgba(255, 255, 255, 0.02);">
            <div>
              <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: var(--text-primary);">
                Edit Number Series: ${series.id}
              </h3>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-secondary);">
                ${series.doc_type_name} (${series.branch_name})
              </p>
            </div>
            <button onclick="window.DocSeriesMasterModule.closeModal()" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <!-- Live Reactive Preview Card -->
          <div style="padding: 16px 22px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08)); border-bottom: 1px solid var(--border-color); margin-top: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a78bfa; letter-spacing: 0.5px;">
                ⚡ Live Real-time Number Preview
              </span>
              <span style="font-size: 11px; color: var(--text-muted); font-family: monospace;">
                Pattern: <strong id="dns-pattern-display" style="color: var(--text-primary);">${this.formatPatternMask(series)}</strong>
              </span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div id="dns-preview-display" style="font-family: monospace; font-size: 20px; font-weight: 800; color: #34d399; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 16px; border-radius: 6px; letter-spacing: 1px;">
                  ${this.formatDocumentNumber(series, (series.current_number >= (series.starting_number || 1)) ? ((series.current_number || 0) + 1) : (series.starting_number || 1))}
                </div>
                <span style="font-size: 12px; color: var(--text-secondary); line-height: 1.3;">
                  Current: <strong id="dns-current-num-display">${series.current_number || 0}</strong> | Next: <strong id="dns-next-num-display">${(series.current_number >= (series.starting_number || 1)) ? ((series.current_number || 0) + 1) : (series.starting_number || 1)}</strong>
                </span>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.DocSeriesMasterModule.resetCounterInModal('${series.id}')" style="font-size: 11px; padding: 4px 10px;" title="Reset counter to sequence starting number">
                🔄 Reset Counter
              </button>
            </div>
          </div>

          <!-- Form Fields -->
          <form id="dns-form" onsubmit="window.DocSeriesMasterModule.saveEditSeries(event, '${series.id}')" style="padding: 20px 22px;">
            <input type="hidden" id="dns-modal-id" value="${series.id}" />

            <!-- Row 1: Document Type & Branch -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Document Type
                </label>
                <select 
                  id="dns-modal-doc-type" 
                  class="form-control form-control-sm" 
                  ${hasTransactions ? 'disabled' : ''}
                  onchange="window.DocSeriesMasterModule.onDocTypeChange(this.value)"
                  style="height: 34px; font-size: 13px;"
                >
                  ${this.DOC_TYPES.map(dt => `
                    <option value="${dt.code}" ${series.doc_type_code === dt.code ? 'selected' : ''}>${dt.name} (${dt.code})</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Facility
                </label>
                <select 
                  id="dns-modal-branch" 
                  class="form-control form-control-sm" 
                  ${hasTransactions ? 'disabled' : ''}
                  onchange="window.DocSeriesMasterModule.onBranchChange(this.value)"
                  style="height: 34px; font-size: 13px;"
                >
                  ${branches.map(b => `
                    <option value="${b.id}" ${series.branch_id === b.id ? 'selected' : ''}>${b.name} (${b.code})</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Row 2: Prefix, Facility Code & Suffix -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Prefix
                </label>
                <input 
                  type="text" 
                  id="dns-modal-prefix" 
                  class="form-control form-control-sm" 
                  value="${series.prefix || ''}" 
                  oninput="window.DocSeriesMasterModule.updateModalPreview()" 
                  style="text-transform: uppercase; font-family: monospace; font-weight: 600; height: 34px;"
                />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Facility Code
                </label>
                <input 
                  type="text" 
                  id="dns-modal-branch-code" 
                  class="form-control form-control-sm" 
                  value="${series.branch_code || ''}" 
                  oninput="window.DocSeriesMasterModule.updateModalPreview()" 
                  style="text-transform: uppercase; font-family: monospace; font-weight: 600; height: 34px;"
                />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Suffix
                </label>
                <input 
                  type="text" 
                  id="dns-modal-suffix" 
                  class="form-control form-control-sm" 
                  value="${series.suffix || ''}" 
                  oninput="window.DocSeriesMasterModule.updateModalPreview()" 
                  style="text-transform: uppercase; font-family: monospace; height: 34px;"
                />
              </div>
            </div>

            <!-- Row 3: Separator, Year Format, Number Length -->
            <div style="display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Separator
                </label>
                <select 
                  id="dns-modal-separator" 
                  class="form-control form-control-sm" 
                  onchange="window.DocSeriesMasterModule.updateModalPreview()"
                  style="height: 34px; font-size: 13px;"
                >
                  <option value="/" ${series.separator === '/' ? 'selected' : ''}>Slash (/)</option>
                  <option value="-" ${series.separator === '-' ? 'selected' : ''}>Hyphen (-)</option>
                  <option value="." ${series.separator === '.' ? 'selected' : ''}>Dot (.)</option>
                  <option value="" ${series.separator === '' ? 'selected' : ''}>None (Concatenated)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Year Format
                </label>
                <select 
                  id="dns-modal-year-format" 
                  class="form-control form-control-sm" 
                  onchange="window.DocSeriesMasterModule.updateModalPreview()"
                  style="height: 34px; font-size: 13px;"
                >
                  <option value="YYYY" ${series.year_format === 'YYYY' ? 'selected' : ''}>YYYY (e.g. 2026)</option>
                  <option value="YY" ${series.year_format === 'YY' ? 'selected' : ''}>YY (e.g. 26)</option>
                  <option value="FY" ${series.year_format === 'FY' ? 'selected' : ''}>Financial Year (e.g. 26-27)</option>
                  <option value="NONE" ${series.year_format === 'NONE' ? 'selected' : ''}>No Year in Number</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Number Length
                </label>
                <select 
                  id="dns-modal-length" 
                  class="form-control form-control-sm" 
                  onchange="window.DocSeriesMasterModule.updateModalPreview()"
                  style="height: 34px; font-size: 13px;"
                >
                  <option value="3" ${series.number_length == 3 ? 'selected' : ''}>3 Digits (001)</option>
                  <option value="4" ${series.number_length == 4 ? 'selected' : ''}>4 Digits (0001)</option>
                  <option value="5" ${series.number_length == 5 ? 'selected' : ''}>5 Digits (00001)</option>
                  <option value="6" ${series.number_length == 6 ? 'selected' : ''}>6 Digits (000001)</option>
                  <option value="7" ${series.number_length == 7 ? 'selected' : ''}>7 Digits (0000001)</option>
                  <option value="8" ${series.number_length == 8 ? 'selected' : ''}>8 Digits (00000001)</option>
                  <option value="9" ${series.number_length == 9 ? 'selected' : ''}>9 Digits (000000001)</option>
                  <option value="10" ${series.number_length == 10 ? 'selected' : ''}>10 Digits (0000000001)</option>
                </select>
              </div>
            </div>

            <!-- Row 4: Sequence Rules -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Starting Number
                </label>
                <input 
                  type="number" 
                  id="dns-modal-start-num" 
                  class="form-control form-control-sm" 
                  min="1" 
                  value="${series.starting_number || 1}" 
                  oninput="window.DocSeriesMasterModule.updateModalPreview()" 
                  style="height: 34px;"
                />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Reset Frequency
                </label>
                <select 
                  id="dns-modal-reset" 
                  class="form-control form-control-sm" 
                  style="height: 34px; font-size: 13px;"
                >
                  <option value="Financial Year" ${series.reset_frequency === 'Financial Year' ? 'selected' : ''}>Financial Year (Apr-Mar)</option>
                  <option value="Calendar Year" ${series.reset_frequency === 'Calendar Year' ? 'selected' : ''}>Calendar Year (Jan-Dec)</option>
                  <option value="Never" ${series.reset_frequency === 'Never' ? 'selected' : ''}>Never (Continuous)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Status
                </label>
                <select 
                  id="dns-modal-status" 
                  class="form-control form-control-sm" 
                  style="height: 34px; font-size: 13px;"
                >
                  <option value="Active" ${series.status === 'Active' ? 'selected' : ''}>Active</option>
                  <option value="Inactive" ${series.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              </div>
            </div>

            <!-- Row 5: Effective Dates -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Effective From
                </label>
                <input 
                  type="date" 
                  id="dns-modal-eff-from" 
                  class="form-control form-control-sm" 
                  required 
                  value="${series.effective_from || ''}" 
                  style="height: 34px;"
                />
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Effective To
                </label>
                <input 
                  type="date" 
                  id="dns-modal-eff-to" 
                  class="form-control form-control-sm" 
                  value="${series.effective_to || ''}" 
                  style="height: 34px;"
                />
              </div>
            </div>

            <!-- Row 6: Remarks -->
            <div style="margin-bottom: 18px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                Description & Purpose Notes
              </label>
              <textarea 
                id="dns-modal-desc" 
                class="form-control form-control-sm" 
                rows="2" 
                style="resize: vertical; font-size: 13px;"
              >${series.description || ''}</textarea>
            </div>

            <!-- Modal Footer -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 14px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.DocSeriesMasterModule.resetSingleSeries('${series.id}')" style="height: 32px; color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);">
                🔄 Reset Sequence to 1
              </button>
              <div style="display: flex; gap: 10px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.DocSeriesMasterModule.closeModal()" style="height: 32px;">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary btn-sm" style="height: 32px; font-weight: 600;">
                  Update Series
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  // Save new series with validations
  saveNewSeries(e) {
    if (e && e.preventDefault) e.preventDefault();

    const id = document.getElementById('dns-modal-id').value;
    const docTypeCode = document.getElementById('dns-modal-doc-type').value;
    const branchId = document.getElementById('dns-modal-branch').value;
    const prefix = document.getElementById('dns-modal-prefix').value.trim().toUpperCase();
    const branchCode = document.getElementById('dns-modal-branch-code').value.trim().toUpperCase();
    const suffix = document.getElementById('dns-modal-suffix').value.trim().toUpperCase();
    const separator = document.getElementById('dns-modal-separator').value;
    const yearFormat = document.getElementById('dns-modal-year-format').value;
    const numberLength = parseInt(document.getElementById('dns-modal-length').value, 10) || 6;
    const startingNumber = parseInt(document.getElementById('dns-modal-start-num').value, 10) || 1;
    const resetFrequency = document.getElementById('dns-modal-reset').value;
    const status = document.getElementById('dns-modal-status').value;
    const effFrom = document.getElementById('dns-modal-eff-from').value;
    const effTo = document.getElementById('dns-modal-eff-to').value;
    const desc = document.getElementById('dns-modal-desc').value.trim();

    // Validation V-01: Mandatory checks
    if (!docTypeCode || !branchId || !prefix || !startingNumber || !effFrom) {
      alert('Please fill in all mandatory fields.');
      return;
    }

    // Validation V-06: Date logic
    if (effTo && effFrom && new Date(effTo) < new Date(effFrom)) {
      alert('Effective To date cannot be earlier than Effective From date.');
      return;
    }

    const all = this.getAllSeries();

    // Validation V-02: Duplicate Active Series Prevention
    const duplicate = all.find(s => 
      s.status === 'Active' && 
      status === 'Active' && 
      s.doc_type_code === docTypeCode && 
      s.branch_id === branchId && 
      s.year_format === yearFormat
    );
    if (duplicate) {
      alert(`Conflict: An active number series already exists for Document Type '${docTypeCode}', Facility '${branchId}', and Year Format '${yearFormat}' (${duplicate.id}). Please deactivate the previous series first.`);
      return;
    }

    const dt = this.DOC_TYPES.find(d => d.code === docTypeCode) || { name: docTypeCode, module: 'Transaction' };
    const branches = this.getBranches();
    const branch = branches.find(b => b.id === branchId) || { name: 'Facility', code: branchCode };

    const newSeries = {
      id,
      doc_type_code: docTypeCode,
      doc_type_name: dt.name,
      module_name: dt.module,
      branch_id: branchId,
      branch_name: branch.name,
      branch_code: branchCode || branch.code,
      prefix,
      suffix,
      separator,
      year_format: yearFormat,
      number_length: numberLength,
      starting_number: startingNumber,
      current_number: 0,
      next_number: startingNumber,
      reset_frequency: resetFrequency,
      effective_from: effFrom,
      effective_to: effTo,
      status,
      description: desc || `Number series for ${dt.name} (${branch.name})`,
      generated_count: 0,
      created_by: (window.State && window.State.currentUser && window.State.currentUser.full_name) || 'Administrator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_number_series', newSeries);
      if (typeof window.DB.saveData === 'function') window.DB.saveData();
      if (typeof window.DB.emitChange === 'function') window.DB.emitChange('document_number_series');
    }

    this.notifySeriesUpdated(newSeries);

    this.closeModal();
    if (window.State && window.State.showToast) {
      window.State.showToast(`Number Series ${id} created successfully!`, 'success');
    }
    this.refreshTable();
  },

  // Reset counter inline from Edit Modal
  resetCounterInModal(seriesId) {
    const all = this.getAllSeries();
    const series = all.find(s => s.id === seriesId);
    if (!series) return;

    const startNum = parseInt(series.starting_number, 10) || 1;
    if (!confirm(`Are you sure you want to reset this series counter to starting sequence (#${startNum})? Next generated document will start from sequence #${startNum}.`)) {
      return;
    }

    series.current_number = 0;
    series.next_number = startNum;
    series.generated_count = 0;
    series.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_number_series', series);
      if (typeof window.DB.saveData === 'function') window.DB.saveData();
      if (typeof window.DB.emitChange === 'function') window.DB.emitChange('document_number_series');
    }

    this.notifySeriesUpdated(series);
    const curDisplay = document.getElementById('dns-current-num-display');
    const nextDisplay = document.getElementById('dns-next-num-display');
    if (curDisplay) curDisplay.textContent = '0';
    if (nextDisplay) nextDisplay.textContent = String(startNum);
    this.updateModalPreview();

    if (window.State && window.State.showToast) {
      window.State.showToast(`Series ${series.id} counter reset to #${startNum}.`, 'info');
    }
  },

  // Save edits to existing series
  saveEditSeries(e, seriesId) {
    if (e && e.preventDefault) e.preventDefault();

    const all = this.getAllSeries();
    const existing = all.find(s => s.id === seriesId);
    if (!existing) return;

    const hasTransactions = (parseInt(existing.generated_count, 10) || parseInt(existing.current_number, 10) || 0) > 0;

    // Always editable: Number Length, Prefix, Branch Code, Suffix, Separator, Year Format, Reset, Status, Dates, Desc
    const lengthEl = document.getElementById('dns-modal-length');
    if (lengthEl) {
      existing.number_length = parseInt(lengthEl.value, 10) || 6;
    }
    const prefixEl = document.getElementById('dns-modal-prefix');
    if (prefixEl && prefixEl.value) {
      existing.prefix = prefixEl.value.trim().toUpperCase();
    }
    const branchCodeEl = document.getElementById('dns-modal-branch-code');
    if (branchCodeEl && branchCodeEl.value) {
      existing.branch_code = branchCodeEl.value.trim().toUpperCase();
    }

    existing.suffix = document.getElementById('dns-modal-suffix').value.trim().toUpperCase();
    existing.separator = document.getElementById('dns-modal-separator').value;
    existing.year_format = document.getElementById('dns-modal-year-format').value;
    existing.reset_frequency = document.getElementById('dns-modal-reset').value;
    existing.status = document.getElementById('dns-modal-status').value;
    existing.effective_from = document.getElementById('dns-modal-eff-from').value;
    existing.effective_to = document.getElementById('dns-modal-eff-to').value;
    existing.description = document.getElementById('dns-modal-desc').value.trim();

    // Starting number is always editable to give administrator full sequence authority
    const startNumEl = document.getElementById('dns-modal-start-num');
    if (startNumEl) {
      const newStart = parseInt(startNumEl.value, 10) || 1;
      existing.starting_number = newStart;
      const cur = parseInt(existing.current_number || 0, 10);
      if (!hasTransactions || cur < newStart) {
        existing.next_number = newStart;
      }
    }

    // If never used, allow updating doc_type & branch
    if (!hasTransactions) {
      const docTypeEl = document.getElementById('dns-modal-doc-type');
      if (docTypeEl) {
        existing.doc_type_code = docTypeEl.value;
        const dt = this.DOC_TYPES.find(d => d.code === existing.doc_type_code);
        if (dt) {
          existing.doc_type_name = dt.name;
          existing.module_name = dt.module;
        }
      }
      const branchEl = document.getElementById('dns-modal-branch');
      if (branchEl) {
        existing.branch_id = branchEl.value;
        const branches = this.getBranches();
        const b = branches.find(item => item.id === existing.branch_id);
        if (b) {
          existing.branch_name = b.name;
        }
      }
    }

    existing.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_number_series', existing);
      if (typeof window.DB.saveData === 'function') window.DB.saveData();
      if (typeof window.DB.emitChange === 'function') window.DB.emitChange('document_number_series');
    }

    this.notifySeriesUpdated(existing);

    this.closeModal();
    if (window.State && window.State.showToast) {
      window.State.showToast(`Number Series ${seriesId} updated successfully.`, 'success');
    }
    this.refreshTable();
  },

  // Toggle status (Active / Inactive)
  toggleStatus(seriesId) {
    const all = this.getAllSeries();
    const item = all.find(s => s.id === seriesId);
    if (!item) return;

    item.status = (item.status === 'Active') ? 'Inactive' : 'Active';
    item.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_number_series', item);
      if (typeof window.DB.saveData === 'function') window.DB.saveData();
      if (typeof window.DB.emitChange === 'function') window.DB.emitChange('document_number_series');
    }

    this.notifySeriesUpdated(item);

    if (window.State && window.State.showToast) {
      window.State.showToast(`Series ${item.id} status set to ${item.status}.`, 'info');
    }
    this.refreshTable();
  },

  // Delete Guarded by BRD Section 25 (BNR-05, AC-12)
  deleteSeries(seriesId) {
    const all = this.getAllSeries();
    const item = all.find(s => s.id === seriesId);
    if (!item) return;

    const hasTransactions = this.hasActiveTransactions(item);

    if (hasTransactions) {
      alert(`Cannot delete series ${item.id}!\n\nAs per BRD Section 25 & Business Rule BNR-05:\nUsed number series cannot be deleted once active documents have been generated in the system (${item.current_number} active transactions exist).\n\nPlease Deactivate the series instead using the ⏸️ toggle button.`);
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete unused Number Series ${item.id} (${item.doc_type_name} - ${item.branch_name})?`)) {
      return;
    }

    this.markSeriesDeleted(seriesId);

    if (window.DB) {
      if (typeof window.DB.delete === 'function') {
        window.DB.delete('document_number_series', seriesId);
      }
      if (typeof window.DB.remove === 'function') {
        window.DB.remove('document_number_series', seriesId);
      }
      if (window.DB.data && Array.isArray(window.DB.data.document_number_series)) {
        window.DB.data.document_number_series = window.DB.data.document_number_series.filter(
          s => String(s.id).toLowerCase() !== String(seriesId).toLowerCase()
        );
        if (typeof window.DB.saveData === 'function') {
          window.DB.saveData();
        }
      }
    }

    this.notifySeriesUpdated({ id: seriesId, deleted: true });

    if (window.State && window.State.showToast) {
      window.State.showToast(`Number series ${seriesId} deleted successfully.`, 'success');
    }
    this.refreshTable();
  },

  // Show Details Specification Modal
  showDetailsModal(seriesId) {
    const all = this.getAllSeries();
    const item = all.find(s => s.id === seriesId);
    if (!item) return;

    const nextSeq = (parseInt(item.current_number, 10) || 0) + 1;
    const nextFormatted = this.formatDocumentNumber(item, nextSeq);
    const pattern = this.formatPatternMask(item);

    const modalHtml = `
      <div id="doc-series-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 640px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: rgba(255, 255, 255, 0.02);">
            <div>
              <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: var(--text-primary);">
                Series Specification: ${item.id}
              </h3>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-secondary);">
                ${item.doc_type_name} - ${item.branch_name}
              </p>
            </div>
            <button onclick="window.DocSeriesMasterModule.closeModal()" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <div style="padding: 20px;">
            <!-- Next document badge -->
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #34d399;">Next Scheduled Document Number</div>
                <div style="font-family: monospace; font-size: 20px; font-weight: 800; color: #34d399; margin-top: 2px;">${nextFormatted}</div>
              </div>
              <div style="text-align: right;">
                <span class="status-pill ${item.status === 'Active' ? 'status-approved' : 'status-rejected'}">${item.status}</span>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Sequence #${nextSeq}</div>
              </div>
            </div>

            <!-- Parameters Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; margin-bottom: 18px;">
              <div style="background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); font-size: 11px; display: block;">Format Mask</span>
                <code style="font-size: 13px; color: #a78bfa; font-weight: 600;">${pattern}</code>
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); font-size: 11px; display: block;">Document Type & Module</span>
                <strong style="color: var(--text-primary);">${item.doc_type_name}</strong> (${item.module_name || 'System'})
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); font-size: 11px; display: block;">Facility Code</span>
                <strong style="color: var(--text-primary);">${item.branch_name}</strong> [${item.branch_code}]
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); font-size: 11px; display: block;">Sequence Progress</span>
                Start: <strong>${item.starting_number || 1}</strong> | Current: <strong>${item.current_number || 0}</strong>
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); font-size: 11px; display: block;">Number Length & Padding</span>
                <strong>${item.number_length || 6}</strong> digits (Padded with leading zeros)
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); font-size: 11px; display: block;">Reset Frequency Rule</span>
                <strong>${item.reset_frequency || 'Financial Year'}</strong>
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); font-size: 11px; display: block;">Effective Period</span>
                From: <strong>${item.effective_from || 'Always'}</strong> | To: <strong>${item.effective_to || 'Open'}</strong>
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted); font-size: 11px; display: block;">Documents Generated</span>
                <strong style="color: #3b82f6;">${item.generated_count || item.current_number || 0}</strong> transactions issued
              </div>
            </div>

            <!-- Description -->
            <div style="background: rgba(255,255,255,0.02); padding: 12px 14px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 12.5px; color: var(--text-secondary); margin-bottom: 16px;">
              <span style="font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 2px;">Description / Purpose:</span>
              ${item.description || 'Standard centralized document numbering configuration.'}
            </div>

            <!-- Audit Trail (FR-36) -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 12px; font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
              <span>Created by: ${item.created_by || 'Admin'} on ${item.created_at ? window.formatDate(item.created_at) : 'System'}</span>
              <span>Last updated: ${item.updated_at ? window.formatDateTime(item.updated_at) : 'N/A'}</span>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color); padding: 12px 20px; background: rgba(255,255,255,0.01);">
            <button class="btn btn-secondary btn-sm" onclick="window.DocSeriesMasterModule.closeModal()">Close</button>
            <button class="btn btn-primary btn-sm" onclick="window.DocSeriesMasterModule.closeModal(); window.DocSeriesMasterModule.showEditModal('${item.id}');">Edit Series</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  // Interactive Number Generator Simulator Modal (FR-40, FR-44)
  showSimulatorModal() {
    const branches = this.getBranches();

    const modalHtml = `
      <div id="doc-series-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 680px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: rgba(255, 255, 255, 0.02);">
            <div>
              <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: var(--text-primary);">
                ⚡ Document Number Generator Simulator
              </h3>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-secondary);">
                Simulate transactional document numbering issuance and test duplicate-prevention
              </p>
            </div>
            <button onclick="window.DocSeriesMasterModule.closeModal()" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
          </div>

          <div style="padding: 20px;">
            <!-- Selector controls -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Select Transaction Document Type
                </label>
                <select id="sim-doc-type" class="form-control form-control-sm" style="height: 34px; font-size: 13px;">
                  ${this.DOC_TYPES.map(dt => `
                    <option value="${dt.code}">${dt.name} (${dt.code})</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                  Select Service Center / Facility
                </label>
                <select id="sim-branch" class="form-control form-control-sm" style="height: 34px; font-size: 13px;">
                  ${branches.map(b => `
                    <option value="${b.id}">${b.name} (${b.code})</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin-bottom: 20px;">
              <button 
                type="button" 
                class="btn btn-primary" 
                onclick="window.DocSeriesMasterModule.runSimulation()"
                style="padding: 9px 24px; font-size: 14px; font-weight: 700; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border: none;"
              >
                ⚡ Issue Next Document Number
              </button>
            </div>

            <!-- Live Output Banner -->
            <div id="sim-result-box" style="display: none; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; text-align: center;">
              <div style="font-size: 12px; font-weight: 600; color: #34d399; text-transform: uppercase;">Generated Official Transaction Number</div>
              <div id="sim-doc-number" style="font-family: monospace; font-size: 24px; font-weight: 800; color: #34d399; margin: 4px 0;"></div>
              <div id="sim-details" style="font-size: 12px; color: var(--text-secondary);"></div>
            </div>

            <!-- Recent Generations Audit Log -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 14px;">
              <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">
                Session Generation Audit Trail (${this.recentGenerations.length} issued)
              </div>
              <div style="max-height: 160px; overflow-y: auto; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 6px;">
                ${this.recentGenerations.length === 0 ? `
                  <div style="padding: 16px; text-align: center; font-size: 12px; color: var(--text-muted);">
                    No document numbers generated in this session yet. Click the button above to simulate.
                  </div>
                ` : `
                  <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted);">
                        <th style="padding: 6px 10px; text-align: left;">Time</th>
                        <th style="padding: 6px 10px; text-align: left;">Document Type</th>
                        <th style="padding: 6px 10px; text-align: left;">Generated Document No</th>
                        <th style="padding: 6px 10px; text-align: right;">Seq #</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.recentGenerations.map(g => `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                          <td style="padding: 6px 10px; color: var(--text-muted);">${g.timestamp}</td>
                          <td style="padding: 6px 10px; color: var(--text-primary);">${g.docType}</td>
                          <td style="padding: 6px 10px; font-family: monospace; font-weight: 700; color: #34d399;">${g.docNumber}</td>
                          <td style="padding: 6px 10px; text-align: right; color: var(--text-secondary);">${g.sequence}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `}
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--border-color); padding: 12px 20px;">
            <button class="btn btn-secondary btn-sm" onclick="window.DocSeriesMasterModule.closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  runSimulation() {
    const docTypeCode = document.getElementById('sim-doc-type').value;
    const branchId = document.getElementById('sim-branch').value;

    const res = this.generateNextNumber(docTypeCode, branchId);
    const box = document.getElementById('sim-result-box');
    const numDisplay = document.getElementById('sim-doc-number');
    const detailsDisplay = document.getElementById('sim-details');

    if (res.success) {
      if (box && numDisplay && detailsDisplay) {
        box.style.display = 'block';
        box.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        box.style.background = 'rgba(16, 185, 129, 0.1)';
        numDisplay.style.color = '#34d399';
        numDisplay.innerText = res.docNumber;
        detailsDisplay.innerText = `Series ID: ${res.seriesId} | Sequence: ${res.sequence} | Status: Assigned & Locked`;
      }
      this.refreshTable();
      // Re-render audit trail in simulator modal
      const trailBox = document.querySelector('#doc-series-modal tbody');
      if (trailBox) {
        trailBox.innerHTML = this.recentGenerations.map(g => `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 6px 10px; color: var(--text-muted);">${g.timestamp}</td>
            <td style="padding: 6px 10px; color: var(--text-primary);">${g.docType}</td>
            <td style="padding: 6px 10px; font-family: monospace; font-weight: 700; color: #34d399;">${g.docNumber}</td>
            <td style="padding: 6px 10px; text-align: right; color: var(--text-secondary);">${g.sequence}</td>
          </tr>
        `).join('');
      }
    } else {
      if (box && numDisplay && detailsDisplay) {
        box.style.display = 'block';
        box.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        box.style.background = 'rgba(239, 68, 68, 0.1)';
        numDisplay.style.color = '#ef4444';
        numDisplay.innerText = 'Generation Failed';
        detailsDisplay.innerText = res.error;
      }
    }
  },

  closeModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('doc-series-modal');
    if (modal) modal.remove();
  },

  // Export configured series to CSV
  exportCsv() {
    const all = this.getAllSeries();
    if (all.length === 0) {
      alert('No number series to export.');
      return;
    }

    const headers = [
      'Series ID', 'Doc Type Code', 'Doc Type Name', 'Facility Code', 'Facility Name',
      'Prefix', 'Suffix', 'Separator', 'Year Format', 'Number Length',
      'Starting Number', 'Current Number', 'Next Number', 'Reset Frequency',
      'Status', 'Effective From', 'Effective To', 'Generated Count'
    ];

    const rows = all.map(s => [
      `"${s.id || ''}"`,
      `"${s.doc_type_code || ''}"`,
      `"${s.doc_type_name || ''}"`,
      `"${s.branch_code || ''}"`,
      `"${s.branch_name || ''}"`,
      `"${s.prefix || ''}"`,
      `"${s.suffix || ''}"`,
      `"${s.separator || '/'}"`,
      `"${s.year_format || 'YYYY'}"`,
      s.number_length || 6,
      s.starting_number || 1,
      s.current_number || 0,
      (s.current_number || 0) + 1,
      `"${s.reset_frequency || 'Financial Year'}"`,
      `"${s.status || 'Active'}"`,
      `"${s.effective_from || ''}"`,
      `"${s.effective_to || ''}"`,
      s.generated_count || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `document_number_series_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // ==========================================================================
  // RESET ALL SERIES SEQUENCES TO START FROM 1 (PRESERVES FORMAT PATTERNS)
  // ==========================================================================
  promptResetAll() {
    const modalHtml = `
      <div id="dns-reset-confirm-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="modal-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 500px; max-width: 92vw; box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 22px;">
          <div style="display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px;">
            <div style="width: 42px; height: 42px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
              🔄
            </div>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">
                Reset All Series Sequences to Start from 1?
              </h3>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
                This action will reset the sequence counter on all document number series:
              </p>
              <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 12px; color: var(--text-muted); line-height: 1.6;">
                <li>Sequences reset to 0 (Next sequence number will start from #1 / configured starting sequence)</li>
                <li>Document number format patterns, number lengths, prefixes, separators, and suffixes are preserved unchanged</li>
                <li>Generated transaction counters reset to 0</li>
              </ul>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 14px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('dns-reset-confirm-modal').remove()" style="height: 32px;">
              Cancel
            </button>
            <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('dns-reset-confirm-modal').remove(); window.DocSeriesMasterModule.resetAllToStartFromOne();" style="height: 32px; font-weight: 600; background: #f59e0b; border-color: #f59e0b; color: #111;">
              Confirm Reset to 1
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  resetAllToStartFromOne(silent = false) {
    let list = this.getAllSeries();
    if (list.length === 0 && typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.document_number_series)) {
      list = JSON.parse(JSON.stringify(INITIAL_DATA.document_number_series));
    }
    list.forEach(item => {
      const startNum = parseInt(item.starting_number, 10) || 1;
      item.current_number = 0;
      item.next_number = startNum;
      item.generated_count = 0;
      item.updated_at = new Date().toISOString();
      if (window.DB && typeof window.DB.upsert === 'function') {
        window.DB.upsert('document_number_series', item);
      }
    });
    if (window.DB && window.DB.data) {
      window.DB.data.document_number_series = list;
      if (typeof window.DB.saveData === 'function') {
        window.DB.saveData();
      }
      if (typeof window.DB.emitChange === 'function') {
        window.DB.emitChange('document_number_series');
      }
    }
    this.notifySeriesUpdated({ resetAll: true });
    this.refreshTable();
    if (!silent && window.State && typeof window.State.showToast === 'function') {
      window.State.showToast('All series sequences reset to 1. Document number format patterns preserved.', 'success');
    }
    return list;
  },

  resetSingleSeries(id, silent = false) {
    const all = this.getAllSeries();
    const item = all.find(s => s.id === id);
    if (!item) return;

    const startNum = parseInt(item.starting_number, 10) || 1;
    item.current_number = 0;
    item.next_number = startNum;
    item.generated_count = 0;
    item.updated_at = new Date().toISOString();

    if (window.DB && typeof window.DB.upsert === 'function') {
      window.DB.upsert('document_number_series', item);
      if (typeof window.DB.saveData === 'function') window.DB.saveData();
      if (typeof window.DB.emitChange === 'function') window.DB.emitChange('document_number_series');
    }
    this.notifySeriesUpdated(item);
    this.closeModal();
    this.refreshTable();
    if (!silent && window.State && typeof window.State.showToast === 'function') {
      window.State.showToast(`Series ${item.id} sequence reset to start from #${startNum}. Format pattern preserved.`, 'success');
    }
  }
};
