/* ==========================================================================
   ENTERPRISE ISCM - ORGANIZATION MASTER MODULE (BRD COMPLIANT)
   Root Enterprise Entity in the Physical Hierarchy:
   Organization -> Branch -> Store -> Rack -> Shelf -> Bin
   ========================================================================== */

window.OrganizationModule = {
  searchTerm: '',
  statusFilter: 'ALL',
  typeFilter: 'ALL',
  categoryFilter: 'ALL',

  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    const orgs = this.getFilteredOrgs();
    const pagedOrgs = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(orgs, 'organizations')
      : { items: orgs, totalRecords: orgs.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    const allOrgs = window.DB.getAll('organizations') || [];
    const allPlants = window.DB.getAll('plants') || [];

    // Summary Metrics
    const totalCount = allOrgs.length;
    const activeCount = allOrgs.filter(o => o.status === 'Active').length;
    const multiBrandCount = allOrgs.filter(o => o.business_category === 'Multi-Brand Service Center' || o.business_category === 'Automobile Workshop').length;
    const totalBranches = allPlants.length;

    container.innerHTML = `
      <!-- Navigation Tabs Header -->
      <div class="tabs-header" style="margin-bottom: 20px;">
        <button class="tab-btn active">
          <span>Organization Master</span>
        </button>
        <button class="tab-btn" onclick="window.location.hash = '#/masters'">
          <span>SKU, Supplier & Facility Masters</span>
        </button>
        <button class="tab-btn" onclick="window.location.hash = '#/warehouse-map'">
          <span>Visual Warehouse Map</span>
        </button>
      </div>

      <!-- 1. Master Table Card -->
      <div class="content-card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Search across code, name, city, tax, contact -->
            <div style="position: relative; display: inline-flex; align-items: center;">
              <input 
                type="text" 
                id="org-standalone-search"
                class="form-control form-control-sm org-search-input" 
                placeholder="Search code, name, GSTIN, PAN, city, contact..." 
                value="${this.searchTerm}" 
                oninput="window.OrganizationModule.setSearch(this.value)" 
                style="width: 270px; padding-right: ${this.searchTerm ? '26px' : '10px'};" 
                autocomplete="off"
              />
              ${this.searchTerm ? `
                <button 
                  type="button" 
                  onclick="window.OrganizationModule.setSearch('')" 
                  style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; line-height: 1; padding: 2px;"
                  title="Clear search"
                >&times;</button>
              ` : ''}
            </div>

            <!-- Status Filter -->
            <select class="form-control form-control-sm" onchange="window.OrganizationModule.setStatusFilter(this.value)" style="width: 130px;">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
              <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>● Active Only</option>
              <option value="Inactive" ${this.statusFilter === 'Inactive' ? 'selected' : ''}>○ Inactive Only</option>
            </select>

            <!-- Category Filter -->
            <select class="form-control form-control-sm" onchange="window.OrganizationModule.setCategoryFilter(this.value)" style="width: 170px;">
              <option value="ALL" ${this.categoryFilter === 'ALL' ? 'selected' : ''}>All Categories</option>
              <option value="Two-Wheeler Workshop" ${this.categoryFilter === 'Two-Wheeler Workshop' || this.categoryFilter === 'Two-Wheeler Garage' ? 'selected' : ''}>🏍️ Two-Wheeler Workshop</option>
              <option value="Automobile Workshop" ${this.categoryFilter === 'Automobile Workshop' ? 'selected' : ''}>🚗 Automobile Workshop</option>
              <option value="Multi-Brand Service Center" ${this.categoryFilter === 'Multi-Brand Service Center' ? 'selected' : ''}>🛠️ Multi-Brand Center</option>
              <option value="Authorized Service Center" ${this.categoryFilter === 'Authorized Service Center' ? 'selected' : ''}>🏅 Authorized Center</option>
              <option value="Spare Parts & Service" ${this.categoryFilter === 'Spare Parts & Service' ? 'selected' : ''}>⚙️ Spare Parts & Service</option>
            </select>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <!-- Add Organization Primary Button -->
            <button class="btn btn-primary btn-sm" onclick="window.OrganizationModule.showAddOrganizationModal()">
              <span>+ Add Organization</span>
            </button>
          </div>
        </div>

        <!-- Hierarchy Banner Guide -->
        <div style="background: rgba(99, 102, 241, 0.05); border-left: 3px solid var(--primary-500); padding: 8px 14px; margin-bottom: 14px; font-size: 11.5px; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <strong>Organizational Hierarchy:</strong>
            <span style="color: var(--primary-300); font-weight: 600;"> Organization </span> &rarr;
            <span style="color: var(--accent-300); font-weight: 600;"> Facility </span> &rarr;
            <span style="color: var(--color-success); font-weight: 600;"> Store </span> &rarr;
            <span style="color: var(--color-warning); font-weight: 600;"> Rack &rarr; Shelf &rarr; Bin </span>
          </div>
          <span style="color: var(--text-muted); font-size: 11px;">Inactive organizations automatically restrict new POs, GRNs & job cards.</span>
        </div>

        <!-- Data Table -->
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Org Code & Identity</th>
                <th>Organization / Legal Name</th>
                <th>Type & Category</th>
                <th>GSTIN / PAN</th>
                <th>Primary Contact & Mobile</th>
                <th>Location / State</th>
                <th class="text-center">Facilities</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orgs.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted);">
                    <div style="font-size: 32px; margin-bottom: 8px;">🏢</div>
                    <div style="font-weight: 600; font-size: 14px;">No Organizations Found</div>
                    <div style="font-size: 12px; margin-top: 4px;">Try modifying search terms or filters, or add a new organization.</div>
                  </td>
                </tr>
              ` : pagedOrgs.items.map(o => {
                const linkedPlants = allPlants.filter(p => p.organization_id === o.id || p.company_id === o.id);
                const isActive = o.status === 'Active';

                return `
                  <tr>
                    <!-- Code & ID -->
                    <td>
                      <div class="cell-mono cell-strong" style="color: var(--primary-300);">${o.code}</div>
                      <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${o.id}</div>
                    </td>

                    <!-- Name & Legal Name -->
                    <td>
                      <div class="cell-strong" style="font-size: 12.5px; color: var(--text-primary);">${o.name}</div>
                      ${o.legal_name && o.legal_name !== o.name ? `
                        <div style="font-size: 11px; color: var(--text-muted);">Legal: ${o.legal_name}</div>
                      ` : ''}
                    </td>

                    <!-- Type & Category -->
                    <td>
                      <span class="badge badge-subtle" style="font-size: 10.5px;">${o.org_type || 'Private Limited'}</span>
                      <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">${o.business_category}</div>
                    </td>

                    <!-- GSTIN & PAN -->
                    <td>
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <span class="cell-mono" style="font-size: 11px; font-weight: 600;">${o.gstin || 'N/A (Unregistered)'}</span>
                        <span class="badge ${o.gst_status === 'Registered' ? 'badge-primary' : (o.gst_status === 'Composition' ? 'badge-warning' : 'badge-subtle')}" style="font-size: 9px; padding: 1px 4px;">
                          ${o.gst_status}
                        </span>
                      </div>
                      ${o.pan ? `
                        <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">PAN: ${o.pan}</div>
                      ` : ''}
                    </td>

                    <!-- Contact & 10-Digit Mobile -->
                    <td>
                      <div style="font-weight: 600; font-size: 12px;">${o.primary_contact_person}</div>
                      <div class="cell-mono" style="font-size: 11.5px; color: var(--primary-300);">📱 ${o.mobile_number}</div>
                      ${o.email ? `<div style="font-size: 10.5px; color: var(--text-muted);">${o.email}</div>` : ''}
                    </td>

                    <!-- Location -->
                    <td>
                      <div style="font-size: 12px; font-weight: 500;">${o.city}, ${o.district}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${o.state} &bull; ${o.pincode}</div>
                    </td>

                    <!-- Linked Branches Count -->
                    <td class="text-center">
                      <span class="badge ${linkedPlants.length > 0 ? 'badge-primary' : 'badge-subtle'}" style="font-weight: 700; font-size: 11px; padding: 3px 8px;">
                        ${linkedPlants.length} Branches
                      </span>
                    </td>

                    <!-- Status -->
                    <td>
                      <span class="status-pill ${isActive ? 'status-approved' : 'status-rejected'}" style="font-weight: 600;">
                        ${isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="text-right">
                      <div style="display: flex; justify-content: flex-end; gap: 6px; align-items: center;">
                        <button class="btn btn-icon btn-sm" title="View Hierarchy & Full Details" onclick="window.OrganizationModule.showOrgDetailsModal('${o.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="Edit Organization" onclick="window.OrganizationModule.showEditOrganizationModal('${o.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="${isActive ? 'Deactivate Organization' : 'Activate Organization'}" onclick="window.OrganizationModule.toggleOrgStatus('${o.id}')">
                          ${isActive ? `
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-warning, #f59e0b);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          ` : `
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success, #10b981);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          `}
                        </button>
                        ${linkedPlants.length === 0 ? `
                        <button class="btn btn-icon btn-sm" title="Remove Organization" style="color: var(--color-danger, #ef4444);" onclick="window.OrganizationModule.deleteOrganization('${o.id}')">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          totalRecords: orgs.length,
          currentPage: pagedOrgs.currentPage,
          pageSize: pagedOrgs.pageSize,
          onPageChange: 'window.OrganizationModule.setPage(%p%)',
          onPageSizeChange: 'window.OrganizationModule.setPageSize(%s%)'
        }) : ''}
      </div>
    `;
  },

  getFilteredOrgs() {
    let list = window.DB.getAll('organizations') || [];

    if (this.searchTerm) {
      const tokens = this.searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      list = list.filter(o => {
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
      list = list.filter(o => o.status === this.statusFilter);
    }

    if (this.categoryFilter !== 'ALL') {
      list = list.filter(o => o.business_category === this.categoryFilter);
    }

    if (this.typeFilter !== 'ALL') {
      list = list.filter(o => o.org_type === this.typeFilter);
    }

    return list;
  },

  setPage(page) {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPage('organizations', page);
    }
    this.render();
  },

  setPageSize(size) {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPageSize('organizations', size);
    }
    this.render();
  },

  setSearch(val) {
    this.searchTerm = val !== undefined && val !== null ? val : '';
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('organizations');
    }
    const activeEl = document.activeElement;
    const isSearchInput = activeEl && (
      activeEl.id === 'org-standalone-search' || 
      activeEl.classList.contains('org-search-input') || 
      activeEl.tagName === 'INPUT'
    );
    const selStart = isSearchInput ? activeEl.selectionStart : null;
    const selEnd = isSearchInput ? activeEl.selectionEnd : null;

    this.render();

    if (isSearchInput) {
      const input = document.getElementById('org-standalone-search') || 
                    document.querySelector('.org-search-input') || 
                    document.querySelector('.content-card input[type="text"]');
      if (input && typeof input.focus === 'function') {
        input.focus();
        if (selStart !== null && selEnd !== null && typeof input.setSelectionRange === 'function') {
          try { input.setSelectionRange(selStart, selEnd); } catch (e) {}
        }
      }
    }
  },

  setStatusFilter(val) {
    this.statusFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('organizations');
    }
    this.render();
  },

  setCategoryFilter(val) {
    this.categoryFilter = val;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('organizations');
    }
    this.render();
  },

  // ==========================================================================
  // ADD ORGANIZATION MODAL (FULLSCREEN 5-CARD ZERO-SCROLL LAYOUT)
  // ==========================================================================
  showAddOrganizationModal() {
    const allOrgs = window.DB.getAll('organizations') || [];
    let maxNum = 0;
    allOrgs.forEach(o => {
      const match = o.id && o.id.match(/^ORG-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextSuggestedId = `ORG-${String(maxNum + 1).padStart(3, '0')}`;

    const locMaster = window.DB.getLocationMaster ? window.DB.getLocationMaster() : (typeof INDIAN_LOCATION_MASTER !== 'undefined' ? INDIAN_LOCATION_MASTER : {});
    const stateNames = Object.keys(locMaster);
    const defaultState = stateNames.includes('Maharashtra') ? 'Maharashtra' : stateNames[0];
    const defaultDistricts = locMaster[defaultState] ? Object.keys(locMaster[defaultState]) : [];
    const defaultDistrict = defaultDistricts[0] || '';
    const defaultCities = (locMaster[defaultState] && locMaster[defaultState][defaultDistrict]) ? locMaster[defaultState][defaultDistrict] : [];

    const contentHtml = `
      <form id="add-org-form" onsubmit="event.preventDefault(); window.OrganizationModule.submitCreateOrg();" style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Fullscreen 3-Column Zero-Scroll Dashboard Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; align-items: stretch;">

          <!-- COLUMN 1: Basic Entity Profile & Tax Information -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Card 1: Basic Information -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>🏢</span> 1. Basic Details
                </span>
                <span class="badge badge-subtle" style="font-size: 9.5px;">Identity</span>
              </div>

              <!-- Org ID & Org Code (Side by Side) -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Organization ID <span style="color: var(--color-danger)">*</span></label>
                  <input type="text" id="new-org-id" class="form-control" value="${nextSuggestedId}" disabled style="height: 30px; font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: var(--primary-300); opacity: 0.8;" />
                  <small style="font-size: 9.5px; color: var(--text-muted);">System unique</small>
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Organization Code <span style="color: var(--color-danger)">*</span></label>
                  <input type="text" id="new-org-code" class="form-control" placeholder="e.g. PATIL-AUTO" maxlength="20" required style="height: 30px; font-size: 12px; font-family: var(--font-mono); text-transform: uppercase;" oninput="this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')" />
                  <small style="font-size: 9.5px; color: var(--text-muted);">3–20 chars, hyphens ok</small>
                </div>
              </div>

              <!-- Org Name -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Organization Name <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="new-org-name" class="form-control" placeholder="e.g. Patil Auto Dynamics & Service Network" maxlength="150" required style="height: 30px; font-size: 12px;" />
                <small style="font-size: 9.5px; color: var(--text-muted);">3–150 chars, system-wide unique</small>
              </div>

              <!-- Legal Name -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Legal Name</label>
                <input type="text" id="new-org-legalname" class="form-control" placeholder="e.g. Patil Automotive Dynamics Pvt Ltd" maxlength="200" style="height: 30px; font-size: 12px;" />
              </div>

              <!-- Org Type -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Organization Type <span style="color: var(--color-danger)">*</span></label>
                <select id="new-org-type" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;" onchange="window.OrganizationModule.onOrgTypeChange(this.value, 'new')">
                  <option value="Proprietorship" selected>Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLP">LLP</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="Trust">Trust</option>
                  <option value="Society">Society</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <!-- Other Org Type (Conditional) -->
              <div id="new-org-other-type-wrap" style="display: none;">
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Other Organization Type <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="new-org-other-type" class="form-control" placeholder="Specify organization type" style="height: 30px; font-size: 12px;" />
              </div>

              <!-- Business Category -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Business Category <span style="color: var(--color-danger)">*</span></label>
                <select id="new-org-category" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;">
                  <option value="Two-Wheeler Workshop">🏍️ Two-Wheeler Workshop</option>
                  <option value="Automobile Workshop">🚗 Automobile Workshop</option>
                  <option value="Multi-Brand Service Center" selected>🛠️ Multi-Brand Service Center</option>
                  <option value="Authorized Service Center">🏅 Authorized Service Center</option>
                  <option value="Spare Parts & Service">⚙️ Spare Parts & Service</option>
                  <option value="Other">🏷️ Other</option>
                </select>
              </div>
            </div>

            <!-- Card 2: Tax Information -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>📑</span> 2. Tax & Legal
                </span>
                <span class="badge badge-subtle" style="font-size: 9.5px;">GST & PAN</span>
              </div>

              <!-- GST Status -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">GST Registration Status <span style="color: var(--color-danger)">*</span></label>
                <select id="new-org-gst-status" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;" onchange="window.OrganizationModule.onGstStatusChange(this.value, 'new')">
                  <option value="Registered" selected>Registered (Regular)</option>
                  <option value="Unregistered">Unregistered</option>
                  <option value="Composition">Composition Scheme</option>
                </select>
              </div>

              <!-- GSTIN (Conditional) -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">
                  GSTIN <span id="new-org-gstin-req" style="color: var(--color-danger)">*</span>
                </label>
                <input type="text" id="new-org-gstin" class="form-control" placeholder="e.g. 27AABCP1234F1Z5" maxlength="15" required style="height: 30px; font-size: 12px; font-family: var(--font-mono); text-transform: uppercase;" oninput="this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)" />
                <small style="font-size: 9.5px; color: var(--text-muted);" id="new-org-gstin-hint">Standard 15-char Indian GSTIN</small>
              </div>

              <!-- PAN -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">PAN (Permanent Account Number)</label>
                <input type="text" id="new-org-pan" class="form-control" placeholder="e.g. AABCP1234F" maxlength="10" style="height: 30px; font-size: 12px; font-family: var(--font-mono); text-transform: uppercase;" oninput="this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)" />
                <small style="font-size: 9.5px; color: var(--text-muted);">10-char PAN format</small>
              </div>
            </div>
          </div>

          <!-- COLUMN 2: Contact Details & Address Master -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Card 3: Contact Information -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>👤</span> 3. Contact Information
                </span>
                <span class="badge badge-subtle" style="font-size: 9.5px;">10-Digit Phone</span>
              </div>

              <!-- Primary Contact Person -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Primary Contact Person <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="new-org-contact" class="form-control" placeholder="e.g. Pravin R. Patil" maxlength="100" required style="height: 30px; font-size: 12px;" />
              </div>

              <!-- Primary Mobile (Strict 10 Digits) -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Mobile Number <span style="color: var(--color-danger)">*</span></label>
                <input type="tel" id="new-org-mobile" class="form-control" placeholder="98XXXXXXXX" maxlength="10" minlength="10" pattern="[0-9]{10}" required style="height: 30px; font-size: 12px; font-family: var(--font-mono);" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 10)" />
                <small style="font-size: 9.5px; color: var(--text-muted);">10-digit Indian mobile number</small>
              </div>

              <!-- Alternate Mobile -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Alternate Mobile Number</label>
                <input type="tel" id="new-org-alt-mobile" class="form-control" placeholder="98XXXXXXXX" maxlength="10" pattern="[0-9]{10}" style="height: 30px; font-size: 12px; font-family: var(--font-mono);" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 10)" />
                <small style="font-size: 9.5px; color: var(--text-muted);">Cannot be same as primary mobile</small>
              </div>

              <!-- Email -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Official Email</label>
                <input type="email" id="new-org-email" class="form-control" placeholder="contact@patilauto.com" maxlength="150" style="height: 30px; font-size: 12px;" />
              </div>

              <!-- Website -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Website</label>
                <input type="url" id="new-org-website" class="form-control" placeholder="https://www.patilauto.com" style="height: 30px; font-size: 12px;" />
              </div>
            </div>

            <!-- Card 4: Address Master (Cascading) -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  4. Address & Location
                </span>
                <span class="badge badge-subtle" style="font-size: 9.5px;">Dependent Dropdowns</span>
              </div>

              <!-- Address Line 1 -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Address Line 1 <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="new-org-addr1" class="form-control" placeholder="Building, Plot, Industrial Area / Street" maxlength="150" required style="height: 30px; font-size: 12px;" />
              </div>

              <!-- Address Line 2 -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Address Line 2</label>
                <input type="text" id="new-org-addr2" class="form-control" placeholder="Near Landmark, Sector, Taluka" maxlength="150" style="height: 30px; font-size: 12px;" />
              </div>

              <!-- Country & State (Side by Side) -->
              <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Country <span style="color: var(--color-danger)">*</span></label>
                  <select id="new-org-country" class="form-control" disabled style="height: 30px; font-size: 12px; padding: 2px 8px; opacity: 0.85;">
                    <option value="India" selected>India</option>
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">State / UT <span style="color: var(--color-danger)">*</span></label>
                  <select id="new-org-state" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;" onchange="window.OrganizationModule.onStateChange(this.value, 'new')">
                    ${stateNames.map(s => `<option value="${s}" ${s === defaultState ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- District & City (Side by Side) -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">District <span style="color: var(--color-danger)">*</span></label>
                  <select id="new-org-district" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;" onchange="window.OrganizationModule.onDistrictChange(this.value, 'new')">
                    ${defaultDistricts.map(d => `<option value="${d}" ${d === defaultDistrict ? 'selected' : ''}>${d}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">City <span style="color: var(--color-danger)">*</span></label>
                  <select id="new-org-city" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;">
                    ${defaultCities.map(c => `<option value="${c}">${c}</option>`).join('')}
                    <option value="CUSTOM">+ Other City</option>
                  </select>
                </div>
              </div>

              <!-- Custom City Input (Hidden by default) & Pincode -->
              <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Custom City Name</label>
                  <input type="text" id="new-org-custom-city" class="form-control" placeholder="Enter if not in list" style="height: 30px; font-size: 12px;" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Pincode <span style="color: var(--color-danger)">*</span></label>
                  <input type="text" id="new-org-pincode" class="form-control" placeholder="410501" maxlength="6" minlength="6" required style="height: 30px; font-size: 12px; font-family: var(--font-mono);" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 6)" />
                  <small style="font-size: 9.5px; color: var(--text-muted);">6 digits</small>
                </div>
              </div>
            </div>
          </div>

          <!-- COLUMN 3: Configuration, System Governance & Hierarchy -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Card 5: Configuration & Operational Rules -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>⚙️</span> 5. Configuration & Governance
                </span>
                <span class="badge badge-subtle" style="font-size: 9.5px;">Fiscal & Status</span>
              </div>

              <!-- Financial Year -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Financial Year Start <span style="color: var(--color-danger)">*</span></label>
                <select id="new-org-fy" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;">
                  <option value="April - March" selected>01 April – 31 March (India Standard FY)</option>
                  <option value="January - December">01 January – 31 December (Calendar Year)</option>
                </select>
              </div>

              <!-- Currency & Time Zone (Side by Side) -->
              <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Currency <span style="color: var(--color-danger)">*</span></label>
                  <select id="new-org-currency" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;">
                    <option value="INR" selected>INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Time Zone <span style="color: var(--color-danger)">*</span></label>
                  <select id="new-org-timezone" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;">
                    <option value="Asia/Kolkata" selected>Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <!-- Status -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Operational Status <span style="color: var(--color-danger)">*</span></label>
                <select id="new-org-status" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;">
                  <option value="Active" selected>● Active</option>
                  <option value="Inactive">○ Inactive (Restricted operations)</option>
                </select>
                <small style="font-size: 9.5px; color: var(--text-muted);">Inactive blocks new POs, GRNs, job cards & user creation</small>
              </div>

              <!-- Remarks -->
              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Remarks / Notes</label>
                <textarea id="new-org-remarks" class="form-control" rows="2" maxlength="500" placeholder="Operational notes or internal governance remarks..." style="font-size: 12px; resize: vertical;"></textarea>
              </div>
            </div>

            <!-- Hierarchy Visualization Card -->
            <div style="background: rgba(99, 102, 241, 0.04); border: 1px dashed rgba(99, 102, 241, 0.3); border-radius: var(--radius-md); padding: 12px; font-size: 11.5px;">
              <div style="font-weight: 700; color: var(--primary-300); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                <span>🌳 Physical Hierarchy Placement</span>
              </div>
              <div style="color: var(--text-secondary); line-height: 1.5;">
                This Organization will establish the master root node. Once registered, you can assign 
                <strong>Facilities</strong>, attach <strong>Stores & Warehouses</strong>, and map granular 
                <strong>Racks, Shelves, and Bins</strong> under its operational scope.
              </div>
            </div>
          </div>

        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="font-size: 11px; color: var(--text-muted);">
          <span>💡 Full screen view active with 3-column zero-scroll layout (31 BRD Fields)</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="window.OrganizationModule.submitCreateOrg()">Save Organization</button>
        </div>
      </div>
    `;

    window.State.showModal({
      title: '🏢 Add Organization (Enterprise Master)',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '96vw',
      isFullScreen: true
    });
  },

  // State Change Event -> Updates Districts
  onStateChange(selectedState, prefix = 'new') {
    const locMaster = window.DB.getLocationMaster ? window.DB.getLocationMaster() : (typeof INDIAN_LOCATION_MASTER !== 'undefined' ? INDIAN_LOCATION_MASTER : {});
    const distEl = document.getElementById(`${prefix}-org-district`);
    const cityEl = document.getElementById(`${prefix}-org-city`);
    if (!distEl) return;

    const districts = locMaster[selectedState] ? Object.keys(locMaster[selectedState]) : [];
    distEl.innerHTML = districts.map(d => `<option value="${d}">${d}</option>`).join('');

    const firstDist = districts[0] || '';
    if (cityEl) {
      const cities = (locMaster[selectedState] && locMaster[selectedState][firstDist]) ? locMaster[selectedState][firstDist] : [];
      cityEl.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('') + `<option value="CUSTOM">+ Other City</option>`;
    }
  },

  // District Change Event -> Updates Cities
  onDistrictChange(selectedDistrict, prefix = 'new') {
    const stateEl = document.getElementById(`${prefix}-org-state`);
    const cityEl = document.getElementById(`${prefix}-org-city`);
    if (!stateEl || !cityEl) return;

    const selectedState = stateEl.value;
    const locMaster = window.DB.getLocationMaster ? window.DB.getLocationMaster() : (typeof INDIAN_LOCATION_MASTER !== 'undefined' ? INDIAN_LOCATION_MASTER : {});
    const cities = (locMaster[selectedState] && locMaster[selectedState][selectedDistrict]) ? locMaster[selectedState][selectedDistrict] : [];
    cityEl.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('') + `<option value="CUSTOM">+ Other City</option>`;
  },

  // Dynamic GST Status Handler
  onGstStatusChange(status, prefix = 'new') {
    const gstinInput = document.getElementById(`${prefix}-org-gstin`);
    const gstinReq = document.getElementById(`${prefix}-org-gstin-req`);
    const gstinHint = document.getElementById(`${prefix}-org-gstin-hint`);

    if (!gstinInput) return;

    if (status === 'Registered' || status === 'Composition') {
      gstinInput.removeAttribute('disabled');
      gstinInput.setAttribute('required', 'required');
      gstinInput.style.opacity = '1';
      if (gstinReq) gstinReq.style.display = 'inline';
      if (gstinHint) gstinHint.textContent = status === 'Composition' ? 'Mandatory for Composition Scheme' : 'Standard 15-char Indian GSTIN';
    } else {
      gstinInput.setAttribute('disabled', 'disabled');
      gstinInput.removeAttribute('required');
      gstinInput.value = '';
      gstinInput.style.opacity = '0.5';
      if (gstinReq) gstinReq.style.display = 'none';
      if (gstinHint) gstinHint.textContent = 'Disabled / Not Applicable for Unregistered';
    }
  },

  // Dynamic Org Type Handler
  onOrgTypeChange(type, prefix = 'new') {
    const wrap = document.getElementById(`${prefix}-org-other-type-wrap`);
    const input = document.getElementById(`${prefix}-org-other-type`);
    if (!wrap) return;

    if (type === 'Other') {
      wrap.style.display = 'block';
      if (input) input.setAttribute('required', 'required');
    } else {
      wrap.style.display = 'none';
      if (input) {
        input.removeAttribute('required');
        input.value = '';
      }
    }
  },

  // ==========================================================================
  // CREATE SUBMIT HANDLER & VALIDATION
  // ==========================================================================
  submitCreateOrg() {
    const id = (document.getElementById('new-org-id')?.value || '').trim();
    const code = (document.getElementById('new-org-code')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('new-org-name')?.value || '').trim();
    const legalName = (document.getElementById('new-org-legalname')?.value || '').trim();
    const orgType = document.getElementById('new-org-type')?.value || 'Proprietorship';
    const otherOrgType = (document.getElementById('new-org-other-type')?.value || '').trim();
    const category = document.getElementById('new-org-category')?.value || 'Multi-Brand Service Center';

    const gstStatus = document.getElementById('new-org-gst-status')?.value || 'Registered';
    let gstin = (document.getElementById('new-org-gstin')?.value || '').trim().toUpperCase();
    let pan = (document.getElementById('new-org-pan')?.value || '').trim().toUpperCase();

    const contactPerson = (document.getElementById('new-org-contact')?.value || '').trim();
    let mobile = (document.getElementById('new-org-mobile')?.value || '').trim().replace(/\D/g, '');
    let altMobile = (document.getElementById('new-org-alt-mobile')?.value || '').trim().replace(/\D/g, '');
    const email = (document.getElementById('new-org-email')?.value || '').trim();
    const website = (document.getElementById('new-org-website')?.value || '').trim();

    const addr1 = (document.getElementById('new-org-addr1')?.value || '').trim();
    const addr2 = (document.getElementById('new-org-addr2')?.value || '').trim();
    const country = 'India';
    const state = document.getElementById('new-org-state')?.value || '';
    const district = document.getElementById('new-org-district')?.value || '';
    let city = document.getElementById('new-org-city')?.value || '';
    const customCity = (document.getElementById('new-org-custom-city')?.value || '').trim();
    if (city === 'CUSTOM' || !city) {
      city = customCity || district || 'Pune';
    }

    const pincode = (document.getElementById('new-org-pincode')?.value || '').trim().replace(/\D/g, '');
    const fy = document.getElementById('new-org-fy')?.value || 'April - March';
    const currency = document.getElementById('new-org-currency')?.value || 'INR';
    const timezone = document.getElementById('new-org-timezone')?.value || 'Asia/Kolkata';
    const status = document.getElementById('new-org-status')?.value || 'Active';
    const remarks = (document.getElementById('new-org-remarks')?.value || '').trim();

    // 1. Organization Code Validations
    if (!code) {
      window.State.showToast('Organization Code is mandatory.', 'error');
      document.getElementById('new-org-code')?.focus();
      return;
    }
    if (code.length < 3 || code.length > 20) {
      window.State.showToast('Organization Code must be between 3 and 20 characters.', 'error');
      document.getElementById('new-org-code')?.focus();
      return;
    }
    if (!/^[A-Z0-9-]+$/.test(code)) {
      window.State.showToast('Organization Code must contain only alphanumeric characters and hyphens (-).', 'error');
      document.getElementById('new-org-code')?.focus();
      return;
    }

    // 2. Organization Name Validations
    if (!name || name.length < 3 || name.length > 150) {
      window.State.showToast('Please enter a valid Organization Name (3–150 characters).', 'error');
      document.getElementById('new-org-name')?.focus();
      return;
    }

    // 3. Organization Type Validation
    if (orgType === 'Other' && !otherOrgType) {
      window.State.showToast('Other Organization Type is mandatory when "Other" is selected.', 'error');
      document.getElementById('new-org-other-type')?.focus();
      return;
    }

    // 4. GSTIN Validations
    if (gstStatus === 'Registered' || gstStatus === 'Composition') {
      if (!gstin) {
        window.State.showToast(`GSTIN is mandatory for ${gstStatus} organizations.`, 'error');
        document.getElementById('new-org-gstin')?.focus();
        return;
      }
      if (gstin.length !== 15 || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
        window.State.showToast('Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 27AABCP1234F1Z5).', 'error');
        document.getElementById('new-org-gstin')?.focus();
        return;
      }
    } else {
      gstin = '';
    }

    // 5. PAN Validations
    if (pan) {
      if (pan.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        window.State.showToast('Please enter a valid PAN number (e.g. AABCP1234F).', 'error');
        document.getElementById('new-org-pan')?.focus();
        return;
      }
    }

    // 6. Contact Validations
    if (!contactPerson || contactPerson.length < 2 || contactPerson.length > 100) {
      window.State.showToast('Primary Contact Person is mandatory (2–100 characters).', 'error');
      document.getElementById('new-org-contact')?.focus();
      return;
    }

    // 7. Mobile Validations (10 digits app-wide rule)
    if (!mobile || mobile.length !== 10) {
      window.State.showToast('Mobile Number must be exactly 10 digits.', 'error');
      document.getElementById('new-org-mobile')?.focus();
      return;
    }
    if (altMobile) {
      if (altMobile.length !== 10) {
        window.State.showToast('Alternate Mobile Number must be exactly 10 digits.', 'error');
        document.getElementById('new-org-alt-mobile')?.focus();
        return;
      }
      if (altMobile === mobile) {
        window.State.showToast('Alternate Mobile Number cannot be the same as Primary Mobile.', 'error');
        document.getElementById('new-org-alt-mobile')?.focus();
        return;
      }
    }

    // 8. Email format check
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      window.State.showToast('Please enter a valid email address.', 'error');
      document.getElementById('new-org-email')?.focus();
      return;
    }

    // 9. Address Validations
    if (!addr1 || addr1.length < 5 || addr1.length > 150) {
      window.State.showToast('Address Line 1 is mandatory (5–150 characters).', 'error');
      document.getElementById('new-org-addr1')?.focus();
      return;
    }
    if (!state) {
      window.State.showToast('State is mandatory.', 'error');
      return;
    }
    if (!district) {
      window.State.showToast('District is mandatory.', 'error');
      return;
    }
    if (!city) {
      window.State.showToast('City is mandatory.', 'error');
      return;
    }
    if (!pincode || pincode.length !== 6) {
      window.State.showToast('Pincode must be exactly 6 digits.', 'error');
      document.getElementById('new-org-pincode')?.focus();
      return;
    }

    // 10. Duplicate Checks
    const allOrgs = window.DB.getAll('organizations') || [];

    // Duplicate Code check
    if (allOrgs.some(o => o.code.toLowerCase() === code.toLowerCase())) {
      window.State.showToast(`Organization Code "${code}" is already in use. Please enter a unique Organization Code.`, 'error');
      document.getElementById('new-org-code')?.focus();
      return;
    }

    // Duplicate Name check
    if (allOrgs.some(o => o.name.toLowerCase() === name.toLowerCase())) {
      window.State.showToast(`Organization Name "${name}" already exists. Please enter a unique Organization Name.`, 'error');
      document.getElementById('new-org-name')?.focus();
      return;
    }

    // Duplicate GSTIN check
    if (gstin && allOrgs.some(o => o.gstin && o.gstin.toUpperCase() === gstin)) {
      window.State.showToast(`GSTIN "${gstin}" is already registered with another organization.`, 'error');
      document.getElementById('new-org-gstin')?.focus();
      return;
    }

    // Duplicate PAN check
    if (pan && allOrgs.some(o => o.pan && o.pan.toUpperCase() === pan)) {
      window.State.showToast(`PAN "${pan}" is already associated with another organization.`, 'error');
      document.getElementById('new-org-pan')?.focus();
      return;
    }

    // Warning on duplicate mobile
    const existingWithMobile = allOrgs.find(o => o.mobile_number === mobile);
    if (existingWithMobile) {
      window.State.showToast(`Notice: Mobile number ${mobile} is also used by "${existingWithMobile.name}".`, 'info');
    }

    const currentUserName = window.State.currentUser ? (window.State.currentUser.full_name || window.State.currentUser.username) : 'Pravin Patil';
    const nowIso = new Date().toISOString();

    const newOrg = {
      id: id,
      code: code,
      name: name,
      legal_name: legalName || name,
      org_type: orgType,
      other_org_type: otherOrgType,
      business_category: category,
      gst_status: gstStatus,
      gstin: gstin,
      pan: pan,
      primary_contact_person: contactPerson,
      mobile_number: mobile,
      alternate_mobile: altMobile,
      email: email,
      address_line1: addr1,
      address_line2: addr2,
      country: country,
      state: state,
      district: district,
      city: city,
      pincode: pincode,
      website: website,
      logo: '',
      fy_start: fy,
      currency: currency,
      time_zone: timezone,
      status: status,
      remarks: remarks,
      created_by: currentUserName,
      created_at: nowIso,
      modified_by: currentUserName,
      modified_at: nowIso
    };

    window.DB.insert('organizations', newOrg);
    window.DB.logAudit('ORG_CREATED', 'ORGANIZATION', id, `Created Organization ${name} (${code}) with Type ${orgType}`);
    window.State.closeModal();
    window.State.showToast(`Organization "${name}" (${code}) created successfully!`, 'success');
    this.render();
  },

  // ==========================================================================
  // EDIT ORGANIZATION MODAL
  // ==========================================================================
  showEditOrganizationModal(orgId) {
    const org = window.DB.getById('organizations', orgId);
    if (!org) return;

    const locMaster = window.DB.getLocationMaster ? window.DB.getLocationMaster() : (typeof INDIAN_LOCATION_MASTER !== 'undefined' ? INDIAN_LOCATION_MASTER : {});
    const stateNames = Object.keys(locMaster);
    const orgState = org.state && stateNames.includes(org.state) ? org.state : (stateNames.includes('Maharashtra') ? 'Maharashtra' : stateNames[0]);
    const districts = locMaster[orgState] ? Object.keys(locMaster[orgState]) : [];
    const orgDistrict = org.district && districts.includes(org.district) ? org.district : (districts[0] || '');
    const cities = (locMaster[orgState] && locMaster[orgState][orgDistrict]) ? locMaster[orgState][orgDistrict] : [];

    const contentHtml = `
      <form id="edit-org-form" onsubmit="event.preventDefault(); window.OrganizationModule.submitEditOrg('${org.id}');" style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; align-items: stretch;">

          <!-- COLUMN 1: Basic Entity & Tax -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary);">🏢 1. Basic Details</span>
                <span class="badge badge-subtle" style="font-size: 9.5px;">Permanent Key</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Organization ID</label>
                  <input type="text" class="form-control" value="${org.id}" disabled style="height: 30px; font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: var(--primary-300); opacity: 0.8;" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Organization Code <span style="color: var(--color-danger)">*</span></label>
                  <input type="text" id="edit-org-code" class="form-control" value="${org.code}" maxlength="20" required style="height: 30px; font-size: 12px; font-family: var(--font-mono); text-transform: uppercase;" oninput="this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')" />
                </div>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Organization Name <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="edit-org-name" class="form-control" value="${org.name}" maxlength="150" required style="height: 30px; font-size: 12px;" />
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Legal Name</label>
                <input type="text" id="edit-org-legalname" class="form-control" value="${org.legal_name || org.name}" maxlength="200" style="height: 30px; font-size: 12px;" />
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Organization Type <span style="color: var(--color-danger)">*</span></label>
                <select id="edit-org-type" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;" onchange="window.OrganizationModule.onOrgTypeChange(this.value, 'edit')">
                  <option value="Proprietorship" ${org.org_type === 'Proprietorship' ? 'selected' : ''}>Proprietorship</option>
                  <option value="Partnership" ${org.org_type === 'Partnership' ? 'selected' : ''}>Partnership</option>
                  <option value="LLP" ${org.org_type === 'LLP' ? 'selected' : ''}>LLP</option>
                  <option value="Private Limited" ${org.org_type === 'Private Limited' ? 'selected' : ''}>Private Limited</option>
                  <option value="Public Limited" ${org.org_type === 'Public Limited' ? 'selected' : ''}>Public Limited</option>
                  <option value="Trust" ${org.org_type === 'Trust' ? 'selected' : ''}>Trust</option>
                  <option value="Society" ${org.org_type === 'Society' ? 'selected' : ''}>Society</option>
                  <option value="Other" ${org.org_type === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>

              <div id="edit-org-other-type-wrap" style="display: ${org.org_type === 'Other' ? 'block' : 'none'};">
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Other Organization Type <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="edit-org-other-type" class="form-control" value="${org.other_org_type || ''}" style="height: 30px; font-size: 12px;" />
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Business Category <span style="color: var(--color-danger)">*</span></label>
                <select id="edit-org-category" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;">
                  <option value="Two-Wheeler Workshop" ${org.business_category === 'Two-Wheeler Workshop' || org.business_category === 'Two-Wheeler Garage' ? 'selected' : ''}>🏍️ Two-Wheeler Workshop</option>
                  <option value="Automobile Workshop" ${org.business_category === 'Automobile Workshop' ? 'selected' : ''}>🚗 Automobile Workshop</option>
                  <option value="Multi-Brand Service Center" ${org.business_category === 'Multi-Brand Service Center' ? 'selected' : ''}>🛠️ Multi-Brand Service Center</option>
                  <option value="Authorized Service Center" ${org.business_category === 'Authorized Service Center' ? 'selected' : ''}>🏅 Authorized Service Center</option>
                  <option value="Spare Parts & Service" ${org.business_category === 'Spare Parts & Service' ? 'selected' : ''}>⚙️ Spare Parts & Service</option>
                  <option value="Other" ${org.business_category === 'Other' ? 'selected' : ''}>🏷️ Other</option>
                </select>
              </div>
            </div>

            <!-- Card 2: Tax -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary);">📑 2. Tax Information</span>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">GST Registration Status <span style="color: var(--color-danger)">*</span></label>
                <select id="edit-org-gst-status" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;" onchange="window.OrganizationModule.onGstStatusChange(this.value, 'edit')">
                  <option value="Registered" ${org.gst_status === 'Registered' ? 'selected' : ''}>Registered (Regular)</option>
                  <option value="Unregistered" ${org.gst_status === 'Unregistered' ? 'selected' : ''}>Unregistered</option>
                  <option value="Composition" ${org.gst_status === 'Composition' ? 'selected' : ''}>Composition Scheme</option>
                </select>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">
                  GSTIN <span id="edit-org-gstin-req" style="color: var(--color-danger); display: ${org.gst_status === 'Unregistered' ? 'none' : 'inline'};">*</span>
                </label>
                <input type="text" id="edit-org-gstin" class="form-control" value="${org.gstin || ''}" maxlength="15" ${org.gst_status === 'Unregistered' ? 'disabled style="opacity:0.5; height:30px; font-size:12px;"' : 'style="height: 30px; font-size: 12px; font-family: var(--font-mono); text-transform: uppercase;"'} oninput="this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)" />
                <small style="font-size: 9.5px; color: var(--text-muted);" id="edit-org-gstin-hint">${org.gst_status === 'Unregistered' ? 'Disabled for Unregistered' : '15-char Indian GSTIN'}</small>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">PAN</label>
                <input type="text" id="edit-org-pan" class="form-control" value="${org.pan || ''}" maxlength="10" style="height: 30px; font-size: 12px; font-family: var(--font-mono); text-transform: uppercase;" oninput="this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)" />
              </div>
            </div>
          </div>

          <!-- COLUMN 2: Contact & Location -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary);">👤 3. Contact Details</span>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Primary Contact Person <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="edit-org-contact" class="form-control" value="${org.primary_contact_person || ''}" maxlength="100" required style="height: 30px; font-size: 12px;" />
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Mobile Number <span style="color: var(--color-danger)">*</span></label>
                <input type="tel" id="edit-user-mobile" class="form-control" value="${(org.mobile_number || '').replace(/\D/g, '').slice(-10)}" maxlength="10" minlength="10" pattern="[0-9]{10}" required style="height: 30px; font-size: 12px; font-family: var(--font-mono);" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 10)" />
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Alternate Mobile</label>
                <input type="tel" id="edit-org-alt-mobile" class="form-control" value="${(org.alternate_mobile || '').replace(/\D/g, '').slice(-10)}" maxlength="10" style="height: 30px; font-size: 12px; font-family: var(--font-mono);" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 10)" />
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Official Email</label>
                <input type="email" id="edit-org-email" class="form-control" value="${org.email || ''}" maxlength="150" style="height: 30px; font-size: 12px;" />
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Website</label>
                <input type="url" id="edit-org-website" class="form-control" value="${org.website || ''}" style="height: 30px; font-size: 12px;" />
              </div>
            </div>

            <!-- Address -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary);">4. Location</span>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Address Line 1 <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="edit-org-addr1" class="form-control" value="${org.address_line1 || ''}" maxlength="150" required style="height: 30px; font-size: 12px;" />
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Address Line 2</label>
                <input type="text" id="edit-org-addr2" class="form-control" value="${org.address_line2 || ''}" maxlength="150" style="height: 30px; font-size: 12px;" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Country</label>
                  <input type="text" class="form-control" value="India" disabled style="height: 30px; font-size: 12px; opacity: 0.85;" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">State <span style="color: var(--color-danger)">*</span></label>
                  <select id="edit-org-state" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;" onchange="window.OrganizationModule.onStateChange(this.value, 'edit')">
                    ${stateNames.map(s => `<option value="${s}" ${s === orgState ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">District <span style="color: var(--color-danger)">*</span></label>
                  <select id="edit-org-district" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;" onchange="window.OrganizationModule.onDistrictChange(this.value, 'edit')">
                    ${districts.map(d => `<option value="${d}" ${d === orgDistrict ? 'selected' : ''}>${d}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">City <span style="color: var(--color-danger)">*</span></label>
                  <select id="edit-org-city" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;">
                    ${cities.map(c => `<option value="${c}">${c}</option>`).join('')}
                    <option value="${org.city}" ${!cities.includes(org.city) ? 'selected' : ''}>${org.city}</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Pincode <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="edit-org-pincode" class="form-control" value="${org.pincode || ''}" maxlength="6" minlength="6" required style="height: 30px; font-size: 12px; font-family: var(--font-mono);" oninput="this.value = this.value.replace(/\D/g, '').slice(0, 6)" />
              </div>
            </div>
          </div>

          <!-- COLUMN 3: Config & Audit Metadata -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary);">⚙️ 5. Settings & Governance</span>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Financial Year Start</label>
                <select id="edit-org-fy" class="form-control" style="height: 30px; font-size: 12px; padding: 2px 8px;">
                  <option value="April - March" ${org.fy_start === 'April - March' ? 'selected' : ''}>01 April – 31 March (India FY)</option>
                  <option value="January - December" ${org.fy_start === 'January - December' ? 'selected' : ''}>01 January – 31 December</option>
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Currency</label>
                  <select id="edit-org-currency" class="form-control" style="height: 30px; font-size: 12px; padding: 2px 8px;">
                    <option value="INR" ${org.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                    <option value="USD" ${org.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Time Zone</label>
                  <select id="edit-org-timezone" class="form-control" style="height: 30px; font-size: 12px; padding: 2px 8px;">
                    <option value="Asia/Kolkata" ${org.time_zone === 'Asia/Kolkata' ? 'selected' : ''}>Asia/Kolkata</option>
                    <option value="UTC" ${org.time_zone === 'UTC' ? 'selected' : ''}>UTC</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Status <span style="color: var(--color-danger)">*</span></label>
                <select id="edit-org-status" class="form-control" required style="height: 30px; font-size: 12px; padding: 2px 8px;">
                  <option value="Active" ${org.status === 'Active' ? 'selected' : ''}>● Active</option>
                  <option value="Inactive" ${org.status === 'Inactive' ? 'selected' : ''}>○ Inactive</option>
                </select>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; margin-bottom: 2px;">Remarks</label>
                <textarea id="edit-org-remarks" class="form-control" rows="3" maxlength="500" style="font-size: 12px; resize: vertical;">${org.remarks || ''}</textarea>
              </div>
            </div>

            <!-- Audit Trail Box -->
            <div style="background: rgba(255, 255, 255, 0.015); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; font-size: 11px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
              <div style="font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">📜 Audit Metadata</div>
              <div>Created By: <strong>${org.created_by || 'System'}</strong> on ${window.formatDate(org.created_at || Date.now())}</div>
              <div>Last Modified By: <strong>${org.modified_by || org.created_by || 'System'}</strong> on ${window.formatDate(org.modified_at || Date.now())}</div>
            </div>
          </div>

        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="font-size: 11px; color: var(--text-muted);">
          <span>💡 Full screen view active with 3-column zero-scroll layout</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="window.OrganizationModule.submitEditOrg('${org.id}')">Save Changes</button>
        </div>
      </div>
    `;

    window.State.showModal({
      title: `✏️ Edit Organization: ${org.name} (${org.code})`,
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '96vw',
      isFullScreen: true
    });
  },

  submitEditOrg(orgId) {
    const org = window.DB.getById('organizations', orgId);
    if (!org) return;

    const code = (document.getElementById('edit-org-code')?.value || '').trim().toUpperCase();
    const name = (document.getElementById('edit-org-name')?.value || '').trim();
    const legalName = (document.getElementById('edit-org-legalname')?.value || '').trim();
    const orgType = document.getElementById('edit-org-type')?.value || 'Proprietorship';
    const otherOrgType = (document.getElementById('edit-org-other-type')?.value || '').trim();
    const category = document.getElementById('edit-org-category')?.value || 'Multi-Brand Service Center';

    const gstStatus = document.getElementById('edit-org-gst-status')?.value || 'Registered';
    let gstin = (document.getElementById('edit-org-gstin')?.value || '').trim().toUpperCase();
    let pan = (document.getElementById('edit-org-pan')?.value || '').trim().toUpperCase();

    const contactPerson = (document.getElementById('edit-org-contact')?.value || '').trim();
    let mobile = (document.getElementById('edit-user-mobile')?.value || '').trim().replace(/\D/g, '');
    let altMobile = (document.getElementById('edit-org-alt-mobile')?.value || '').trim().replace(/\D/g, '');
    const email = (document.getElementById('edit-org-email')?.value || '').trim();
    const website = (document.getElementById('edit-org-website')?.value || '').trim();

    const addr1 = (document.getElementById('edit-org-addr1')?.value || '').trim();
    const addr2 = (document.getElementById('edit-org-addr2')?.value || '').trim();
    const state = document.getElementById('edit-org-state')?.value || '';
    const district = document.getElementById('edit-org-district')?.value || '';
    const city = document.getElementById('edit-org-city')?.value || '';
    const pincode = (document.getElementById('edit-org-pincode')?.value || '').trim().replace(/\D/g, '');

    const fy = document.getElementById('edit-org-fy')?.value || 'April - March';
    const currency = document.getElementById('edit-org-currency')?.value || 'INR';
    const timezone = document.getElementById('edit-org-timezone')?.value || 'Asia/Kolkata';
    const status = document.getElementById('edit-org-status')?.value || 'Active';
    const remarks = (document.getElementById('edit-org-remarks')?.value || '').trim();

    // Validations
    if (!code || code.length < 3 || code.length > 20 || !/^[A-Z0-9-]+$/.test(code)) {
      window.State.showToast('Invalid Organization Code. 3–20 characters, alphanumeric and hyphens only.', 'error');
      return;
    }
    if (!name || name.length < 3 || name.length > 150) {
      window.State.showToast('Please enter a valid Organization Name (3–150 characters).', 'error');
      return;
    }
    if (orgType === 'Other' && !otherOrgType) {
      window.State.showToast('Other Organization Type is mandatory.', 'error');
      return;
    }
    if (gstStatus === 'Registered' || gstStatus === 'Composition') {
      if (!gstin || gstin.length !== 15 || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
        window.State.showToast('Invalid GSTIN format. Must be 15 alphanumeric characters.', 'error');
        return;
      }
    } else {
      gstin = '';
    }
    if (pan && (pan.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan))) {
      window.State.showToast('Please enter a valid PAN number.', 'error');
      return;
    }
    if (!contactPerson || contactPerson.length < 2) {
      window.State.showToast('Primary Contact Person is mandatory.', 'error');
      return;
    }
    if (!mobile || mobile.length !== 10) {
      window.State.showToast('Mobile Number must be exactly 10 digits.', 'error');
      return;
    }
    if (altMobile && (altMobile.length !== 10 || altMobile === mobile)) {
      window.State.showToast('Alternate Mobile must be 10 digits and cannot match Primary Mobile.', 'error');
      return;
    }
    if (!addr1 || addr1.length < 5) {
      window.State.showToast('Address Line 1 is mandatory.', 'error');
      return;
    }
    if (!pincode || pincode.length !== 6) {
      window.State.showToast('Pincode must be exactly 6 digits.', 'error');
      return;
    }

    // Duplicate checks excluding self
    const allOrgs = window.DB.getAll('organizations') || [];
    if (allOrgs.some(o => o.id !== orgId && o.code.toLowerCase() === code.toLowerCase())) {
      window.State.showToast(`Organization Code "${code}" is already in use.`, 'error');
      return;
    }
    if (allOrgs.some(o => o.id !== orgId && o.name.toLowerCase() === name.toLowerCase())) {
      window.State.showToast(`Organization Name "${name}" is already in use.`, 'error');
      return;
    }
    if (gstin && allOrgs.some(o => o.id !== orgId && o.gstin && o.gstin.toUpperCase() === gstin)) {
      window.State.showToast(`GSTIN "${gstin}" is already registered with another organization.`, 'error');
      return;
    }
    if (pan && allOrgs.some(o => o.id !== orgId && o.pan && o.pan.toUpperCase() === pan)) {
      window.State.showToast(`PAN "${pan}" is already associated with another organization.`, 'error');
      return;
    }

    const currentUserName = window.State.currentUser ? (window.State.currentUser.full_name || window.State.currentUser.username) : 'Pravin Patil';

    window.DB.update('organizations', orgId, {
      code: code,
      name: name,
      legal_name: legalName || name,
      org_type: orgType,
      other_org_type: otherOrgType,
      business_category: category,
      gst_status: gstStatus,
      gstin: gstin,
      pan: pan,
      primary_contact_person: contactPerson,
      mobile_number: mobile,
      alternate_mobile: altMobile,
      email: email,
      website: website,
      address_line1: addr1,
      address_line2: addr2,
      state: state,
      district: district,
      city: city,
      pincode: pincode,
      fy_start: fy,
      currency: currency,
      time_zone: timezone,
      status: status,
      remarks: remarks,
      modified_by: currentUserName,
      modified_at: new Date().toISOString()
    });

    window.DB.logAudit('ORG_UPDATED', 'ORGANIZATION', orgId, `Updated Organization details for ${name} (${code})`);

    // If deactivated, ensure working facility is switched away from this organization
    if (status === 'Inactive') {
      if (window.State && window.State.currentPlantId && window.State.currentPlantId !== 'ALL') {
        const currentPlant = window.DB.getById('plants', window.State.currentPlantId);
        if (currentPlant && currentPlant.organization_id === orgId) {
          const activePlants = window.DB.getActivePlants();
          const fallbackPlant = activePlants.length > 0 ? activePlants[0].id : 'ALL';
          window.State.setPlant(fallbackPlant);
          window.State.showToast(`Working facility switched away from inactive organization to: ${activePlants[0]?.name || 'Consolidated'}`, 'info');
        }
      }
      if (window.App && typeof window.App.initFacilityDropdowns === 'function') {
        window.App.initFacilityDropdowns();
      }
      if (window.AuthModule && typeof window.AuthModule.populateBranchDropdown === 'function') {
        window.AuthModule.populateBranchDropdown();
      }
    }

    window.State.closeModal();
    window.State.showToast(`Organization "${name}" updated successfully!`, 'success');
    this.render();
  },

  // ==========================================================================
  // VIEW HIERARCHY & PROFILE DRAWER MODAL
  // ==========================================================================
  showOrgDetailsModal(orgId) {
    const org = window.DB.getById('organizations', orgId);
    if (!org) return;

    const allPlants = window.DB.getAll('plants') || [];
    const allWarehouses = window.DB.getAll('warehouses') || [];
    const allBins = window.DB.getAll('bins') || [];
    const allUsers = window.DB.getAll('users') || [];

    const linkedPlants = allPlants.filter(p => p.organization_id === org.id || p.company_id === org.id);
    const linkedUsers = allUsers.filter(u => u.company_id === org.id || linkedPlants.some(p => p.id === u.plant_id));

    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Header Ribbon -->
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-md); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">🏢</span>
              <span style="font-size: 16px; font-weight: 700; color: var(--text-primary);">${org.name}</span>
              <span class="cell-mono badge badge-primary">${org.code}</span>
              <span class="status-pill ${org.status === 'Active' ? 'status-approved' : 'status-rejected'}">${org.status}</span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
              ${org.org_type} &bull; ${org.business_category} &bull; Legal: <em>${org.legal_name || org.name}</em>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.OrganizationModule.showEditOrganizationModal('${org.id}')" style="display: inline-flex; align-items: center; gap: 6px;">
              ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
              Edit Profile
            </button>
          </div>
        </div>

        <!-- 2 Columns: Left = Visual Hierarchy Tree; Right = Profile Details -->
        <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; align-items: start;">
          
          <!-- LEFT: Physical Hierarchy Visual Tree -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px;">
            <h4 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; color: var(--primary-300); display: flex; align-items: center; gap: 6px;">
              <span>🌳</span> Physical Hierarchy Structure (BRD §1)
            </h4>

            <!-- Interactive Tree View -->
            <div style="font-family: var(--font-mono); font-size: 12px; line-height: 1.8; color: var(--text-secondary); background: rgba(0,0,0,0.2); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
              <div style="font-weight: 700; color: var(--primary-300);">
                🏢 [Organization]: ${org.code} - ${org.name}
              </div>

              ${linkedPlants.length === 0 ? `
                <div style="padding-left: 20px; color: var(--text-muted); font-style: italic;">
                  └── (No branches currently linked)
                </div>
              ` : linkedPlants.map((plant, pIdx) => {
                const isLastPlant = pIdx === linkedPlants.length - 1;
                const plantWhs = allWarehouses.filter(w => w.plant_id === plant.id);

                return `
                  <div style="padding-left: 16px; margin-top: 6px;">
                    <div style="color: var(--accent-300); font-weight: 600;">
                      ${isLastPlant ? '└──' : '├──'} [Branch]: ${plant.code} - ${plant.name} (${plant.city})
                    </div>

                    ${plantWhs.length === 0 ? `
                      <div style="padding-left: 32px; color: var(--text-muted);">
                        └── 🏬 [Store]: Central Storage Area
                      </div>
                    ` : plantWhs.map((wh, wIdx) => {
                      const isLastWh = wIdx === plantWhs.length - 1;
                      const whBins = allBins.filter(b => b.warehouse_id === wh.id);

                      return `
                        <div style="padding-left: 32px;">
                          <div style="color: var(--color-success); font-weight: 500;">
                            ${isLastWh ? '└──' : '├──'} 🏬 [Store / WH]: ${wh.code} - ${wh.name}
                          </div>
                          <div style="padding-left: 28px; color: var(--color-warning); font-size: 11px;">
                            └── 📦 [Rack &rarr; Shelf &rarr; Bin Matrix]: ${whBins.length > 0 ? `${whBins.length} active bin slots (e.g. ${whBins[0]?.code || 'BIN-A-01'})` : 'Default Standard Bin Allocation'}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Hierarchy Stats Banner -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px;">
              <div style="padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); text-align: center;">
                <div style="font-size: 18px; font-weight: 700; color: var(--accent-300);">${linkedPlants.length}</div>
                <div style="font-size: 10.5px; color: var(--text-muted);">Branches</div>
              </div>
              <div style="padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); text-align: center;">
                <div style="font-size: 18px; font-weight: 700; color: var(--color-success);">${allWarehouses.filter(w => linkedPlants.some(p => p.id === w.plant_id)).length || 1}</div>
                <div style="font-size: 10.5px; color: var(--text-muted);">Stores & Warehouses</div>
              </div>
              <div style="padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); text-align: center;">
                <div style="font-size: 18px; font-weight: 700; color: var(--primary-300);">${linkedUsers.length}</div>
                <div style="font-size: 10.5px; color: var(--text-muted);">Associated Users</div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Detailed Master Attributes Profile -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Tax & Legal Details Card -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
              <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-primary); margin: 0 0 10px 0; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">
                📑 Tax & Legal Status
              </h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                <div>
                  <div style="color: var(--text-muted); font-size: 10.5px;">GST Registration Status</div>
                  <div style="font-weight: 600;">${org.gst_status}</div>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 10.5px;">GSTIN</div>
                  <div class="cell-mono" style="font-weight: 600; color: var(--primary-300);">${org.gstin || 'Not Applicable'}</div>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 10.5px;">PAN Number</div>
                  <div class="cell-mono" style="font-weight: 600;">${org.pan || 'Not Maintained'}</div>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 10.5px;">Currency / Timezone</div>
                  <div>${org.currency} (${org.time_zone})</div>
                </div>
              </div>
            </div>

            <!-- Contact & Location Card -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
              <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-primary); margin: 0 0 10px 0; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">
                Contact & Location Details
              </h4>
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
                <div>
                  <div style="color: var(--text-muted); font-size: 10.5px;">Primary Contact Person</div>
                  <div style="font-weight: 600;">${org.primary_contact_person}</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <div style="color: var(--text-muted); font-size: 10.5px;">Primary Mobile (10 Digits)</div>
                    <div class="cell-mono" style="font-weight: 600; color: var(--primary-300);">📱 ${org.mobile_number}</div>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 10.5px;">Alternate Mobile</div>
                    <div class="cell-mono">${org.alternate_mobile ? `📱 ${org.alternate_mobile}` : 'None'}</div>
                  </div>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 10.5px;">Official Email & Website</div>
                  <div>${org.email || 'None'} ${org.website ? `&bull; <a href="${org.website}" target="_blank" style="color: var(--primary-400); text-decoration: underline;">${org.website}</a>` : ''}</div>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 10.5px;">Registered Address</div>
                  <div style="line-height: 1.4;">
                    ${org.address_line1}${org.address_line2 ? `, ${org.address_line2}` : ''}<br>
                    ${org.city}, ${org.district}, ${org.state} - <strong>${org.pincode}</strong> (${org.country})
                  </div>
                </div>
              </div>
            </div>

            <!-- Remarks & Governance Card -->
            ${org.remarks ? `
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; font-size: 11.5px; color: var(--text-secondary);">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">📝 Remarks:</div>
                ${org.remarks}
              </div>
            ` : ''}
          </div>

        </div>
      </div>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="font-size: 11px; color: var(--text-muted);">
          Created By ${org.created_by || 'System'} on ${window.formatDate(org.created_at || Date.now())}
        </div>
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      </div>
    `;

    window.State.showModal({
      title: `🏢 Organization Profile: ${org.name}`,
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '96vw',
      isFullScreen: true
    });
  },

  // ==========================================================================
  // SAFE STATUS TOGGLE & TRANSACTION GUARD
  // ==========================================================================
  toggleOrgStatus(orgId) {
    const org = window.DB.getById('organizations', orgId);
    if (!org) return;

    const newStatus = org.status === 'Active' ? 'Inactive' : 'Active';

    if (newStatus === 'Inactive') {
      const confirmDeactivate = confirm(
        `Are you sure you want to deactivate Organization "${org.name}" (${org.code})?\n\n` +
        `BRD Business Rule:\n` +
        `• Organizations cannot be deleted if transactions exist.\n` +
        `• When Inactive: Cannot create new Purchase Orders, GRNs, Sales, Job Cards, or Users under this organization.\n` +
        `• Inactive status will be reflected across all master screens.\n` +
        `• Inactive organization & its branches will be completely hidden from all transactional screens.\n` +
        `• Historical records and audit reports remain accessible.\n\n` +
        `Proceed with deactivation?`
      );
      if (!confirmDeactivate) return;
    }

    const currentUserName = window.State.currentUser ? (window.State.currentUser.full_name || window.State.currentUser.username) : 'Pravin Patil';

    window.DB.update('organizations', orgId, {
      status: newStatus,
      modified_by: currentUserName,
      modified_at: new Date().toISOString()
    });

    // If deactivated, switch active working facility away from this organization
    if (newStatus === 'Inactive') {
      if (window.State && window.State.currentPlantId && window.State.currentPlantId !== 'ALL') {
        const currentPlant = window.DB.getById('plants', window.State.currentPlantId);
        if (currentPlant && currentPlant.organization_id === orgId) {
          const activePlants = window.DB.getActivePlants();
          const fallbackPlant = activePlants.length > 0 ? activePlants[0].id : 'ALL';
          window.State.setPlant(fallbackPlant);
          window.State.showToast(`Working branch switched away from inactive organization to: ${activePlants[0]?.name || 'Consolidated'}`, 'info');
        }
      }
      if (window.App && typeof window.App.initFacilityDropdowns === 'function') {
        window.App.initFacilityDropdowns();
      }
      if (window.AuthModule && typeof window.AuthModule.populateBranchDropdown === 'function') {
        window.AuthModule.populateBranchDropdown();
      }
    }

    window.DB.logAudit('ORG_STATUS_CHANGE', 'ORGANIZATION', orgId, `Changed status of Organization ${org.name} (${org.code}) to ${newStatus}`);
    window.State.showToast(`Organization "${org.name}" is now ${newStatus}.`, newStatus === 'Active' ? 'success' : 'warning');
    this.render();
  },

  deleteOrganization(orgId) {
    const org = window.DB.getById('organizations', orgId);
    if (!org) return;

    const allPlants = window.DB.getAll('plants') || [];
    const linkedPlants = allPlants.filter(p => p.organization_id === org.id || p.company_id === org.id);

    if (linkedPlants.length > 0) {
      const facilityNames = linkedPlants.map(p => `• ${p.name || p.code || p.id}`).slice(0, 5).join('\n');
      const extraCount = linkedPlants.length > 5 ? `\n...and ${linkedPlants.length - 5} more` : '';
      const msg = `Cannot delete organization "${org.name}" (${org.code}).\n\nThere are ${linkedPlants.length} facility(ies) created under this organization:\n${facilityNames}${extraCount}\n\nPlease delete or reassign all associated facilities in Facility Master before deleting this organization.`;

      if (window.State && window.State.showToast) {
        window.State.showToast(`Cannot delete organization: ${linkedPlants.length} facility(ies) are currently created under it.`, 'error');
      }
      alert(msg);
      return;
    }

    if (confirm(`Are you sure you want to remove organization "${org.name}" (${org.code})?\n\nThis action cannot be undone.`)) {
      window.DB.delete('organizations', orgId);

      // If active working facility belongs to this organization, switch away
      if (window.State && window.State.currentPlantId && window.State.currentPlantId !== 'ALL') {
        const currentPlant = window.DB.getById('plants', window.State.currentPlantId);
        if (currentPlant && currentPlant.organization_id === orgId) {
          const activePlants = window.DB.getActivePlants();
          const fallbackPlant = activePlants.length > 0 ? activePlants[0].id : 'ALL';
          window.State.setPlant(fallbackPlant);
        }
      }

      if (window.DB.logAudit) {
        window.DB.logAudit('ORG_DELETED', 'ORGANIZATION', orgId, `Removed organization ${org.name} (${org.code})`);
      }
      if (window.State && window.State.showToast) {
        window.State.showToast(`Organization "${org.name}" removed successfully.`, 'success');
      }
      this.render();
      if (window.OrgLocationModule && typeof window.OrgLocationModule.render === 'function') {
        window.OrgLocationModule.render();
      }
    }
  },

  clearAllOrganizations() {
    const allOrgs = window.DB.getAll('organizations') || [];
    if (allOrgs.length === 0) {
      if (window.State && window.State.showToast) {
        window.State.showToast('No organizations to remove.', 'info');
      }
      return;
    }

    const allPlants = window.DB.getAll('plants') || [];
    const orgsWithPlants = allOrgs.filter(o => allPlants.some(p => p.organization_id === o.id || p.company_id === o.id));
    if (orgsWithPlants.length > 0) {
      const msg = `Cannot remove organizations: ${orgsWithPlants.length} organization(s) have active facilities created under them. Please delete or reassign all facilities first.`;
      if (window.State && window.State.showToast) {
        window.State.showToast(msg, 'error');
      }
      alert(msg);
      return;
    }

    if (confirm(`Are you sure you want to remove ALL ${allOrgs.length} organization(s) from the organization master?\n\nThis will remove all organizations from the master list.`)) {
      window.DB.clear('organizations');

      if (window.DB.logAudit) {
        window.DB.logAudit('ALL_ORGS_DELETED', 'ORGANIZATION', 'ALL', 'Removed all organizations from organization master');
      }
      if (window.State && window.State.showToast) {
        window.State.showToast('All organizations have been removed.', 'success');
      }
      this.render();
      if (window.OrgLocationModule && typeof window.OrgLocationModule.render === 'function') {
        window.OrgLocationModule.render();
      }
    }
  }
};
