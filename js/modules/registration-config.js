/* ==========================================================================
   ENTERPRISE ISCM - REGISTRATION CONFIGURATION MASTER (BRD v1.0 COMPLIANT)
   Application: Two-Wheeler Garage / Service Center Management System
   Module: Admin Panel → Organization & Facility Setup → Registration Configuration
   Configuration Level: Facility-wise
   Controls:
     - Applicable: Active / Hidden (toggle)
     - Mandatory: Required (*) / Optional (toggle, disabled when Applicable is false)
   Dependent Modules: Customer Registration, Vehicle Registration, Job Card Intake
   ========================================================================== */

window.RegistrationConfigModule = {
  selectedFacilityId: 'PLANT-01',
  activeSection: 'ALL', // 'ALL' | 'CUSTOMER' | 'VEHICLE'
  filterStatus: 'ALL',  // 'ALL' | 'MANDATORY' | 'OPTIONAL' | 'HIDDEN'
  searchTerm: '',
  hasUnsavedChanges: false,
  currentWorkingConfig: null,

  DEFAULT_FACILITIES: [
    { id: 'PLANT-01', code: 'MAULI-01', name: 'Mauli Service Center 1 (Pune Central)', city: 'Pune', is_active: true }
  ],

  getFacilities(onlyActive = true) {
    const plants = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('plants') || []) : [];
    if (plants.length > 0) {
      const mapped = plants.map(p => {
        const isActive = (p.is_active !== false && p.status !== 'Inactive' && p.status !== 'INACTIVE' && (p.status ? String(p.status).toLowerCase() !== 'inactive' : true)) &&
          (!window.DB || typeof window.DB.isPlantActive !== 'function' || window.DB.isPlantActive(p.id, true));
        return {
          id: p.id,
          code: (p.code || p.branch_code || p.id).toUpperCase(),
          name: p.name || `Facility ${p.id}`,
          city: p.city || 'Pune',
          is_active: !!isActive
        };
      });
      return onlyActive ? mapped.filter(f => f.is_active) : mapped;
    }
    return onlyActive ? this.DEFAULT_FACILITIES.filter(f => f.is_active) : this.DEFAULT_FACILITIES;
  },

  getCurrentFacility() {
    const facilities = this.getFacilities(true);
    return facilities.find(f => f.id === this.selectedFacilityId) || facilities[0] || this.DEFAULT_FACILITIES[0];
  },

  loadFacilityConfig(facilityId) {
    if (!facilityId) facilityId = this.selectedFacilityId;
    const cfg = window.DB.getRegistrationConfig(facilityId);
    this.currentWorkingConfig = JSON.parse(JSON.stringify(cfg));
    this.hasUnsavedChanges = false;
    return this.currentWorkingConfig;
  },

  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    if (window.OrgLocationModule && typeof window.OrgLocationModule.render === 'function') {
      window.OrgLocationModule.activeTab = 'REGISTRATION_CONFIG';
      window.OrgLocationModule.render(container);
      return;
    }

    const pageTopBar = (typeof document !== 'undefined' && document.getElementById) 
      ? (document.getElementById('page-top-bar') || (document.querySelector && document.querySelector('.page-top-bar'))) 
      : null;
    if (pageTopBar) pageTopBar.style.display = 'none';

    container.innerHTML = this.renderContentCard();
  },

  renderTab(container) {
    if (!container) container = document.getElementById('org-location-tab-content');
    if (!this.currentWorkingConfig || this.currentWorkingConfig.facility_id !== this.selectedFacilityId) {
      this.loadFacilityConfig(this.selectedFacilityId);
    }
    const html = this.renderContentCard();
    if (container) container.innerHTML = html;
    return html;
  },

  renderContentCard() {
    if (!this.currentWorkingConfig || this.currentWorkingConfig.facility_id !== this.selectedFacilityId) {
      this.loadFacilityConfig(this.selectedFacilityId);
    }
    const facility = this.getCurrentFacility();
    const facilities = this.getFacilities();
    const config = this.currentWorkingConfig;

    const allFields = [
      ...(config.customer_fields || []).map(f => ({ ...f, section: 'CUSTOMER' })),
      ...(config.vehicle_fields || []).map(f => ({ ...f, section: 'VEHICLE' }))
    ];

    const totalCount = allFields.length;
    const applicableCount = allFields.filter(f => f.applicable).length;
    const mandatoryCount = allFields.filter(f => f.applicable && f.mandatory).length;

    return `
      <div class="content-card" id="registration-config-card" style="font-family: var(--font-sans, 'Inter', sans-serif);">
        
        <!-- Clean Header Bar: Title, Facility Selector, & Primary Actions -->
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 14px 20px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface);">
          <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 22px;">⚙️</span>
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 16px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.2px;">Registration Configuration</span>
                </div>
              </div>
            </div>

            <!-- Facility Selector Dropdown -->
            <div style="display: flex; align-items: center; gap: 8px; margin-left: 6px;">
              <select id="reg-facility-select" class="form-control form-control-sm" style="font-weight: 600; min-width: 260px; max-width: 340px; padding: 6px 12px; border-radius: var(--radius-md);" onchange="window.RegistrationConfigModule.onFacilityChange(this.value)">
                ${facilities.map(f => `
                  <option value="${f.id}" ${f.id === this.selectedFacilityId ? 'selected' : ''}>
                    🏢 ${f.code} - ${f.name}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Action Buttons Bar -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${this.hasUnsavedChanges ? `
              <span class="badge badge-warning" style="font-size: 11px; padding: 4px 8px;">
                ● Unsaved Changes
              </span>
            ` : `
              <span style="font-size: 11px; color: var(--color-success); font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px;">
                ✓ Saved
              </span>
            `}

            <button class="btn btn-secondary btn-sm" onclick="window.RegistrationConfigModule.openCopyModal()" title="Copy current configuration to other service facilities" style="padding: 6px 12px; font-size: 12px;">
              📋 Copy Policy
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.RegistrationConfigModule.saveCurrentConfig()" style="padding: 6px 14px; font-size: 12.5px; font-weight: 700; ${this.hasUnsavedChanges ? 'box-shadow: 0 0 10px rgba(99,102,241,0.5);' : ''}">
              💾 Save Configuration
            </button>
          </div>
        </div>

        <!-- Filter Toolbar & Search Bar -->
        <div style="padding: 10px 20px; background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <!-- Section Filter Pills -->
            <div class="perm-cat-pills" style="display: flex; gap: 4px;">
              <button class="perm-cat-pill ${this.activeSection === 'ALL' ? 'active' : ''}" onclick="window.RegistrationConfigModule.setSection('ALL')">
                All Fields (${totalCount})
              </button>
              <button class="perm-cat-pill ${this.activeSection === 'CUSTOMER' ? 'active' : ''}" onclick="window.RegistrationConfigModule.setSection('CUSTOMER')">
                👤 Customer (${(config.customer_fields || []).length})
              </button>
              <button class="perm-cat-pill ${this.activeSection === 'VEHICLE' ? 'active' : ''}" onclick="window.RegistrationConfigModule.setSection('VEHICLE')">
                🏍️ Vehicle (${(config.vehicle_fields || []).length})
              </button>
              <button class="perm-cat-pill ${this.activeSection === 'RULES' ? 'active' : ''}" onclick="window.RegistrationConfigModule.setSection('RULES')">
                ⚖️ Business Rules
              </button>
            </div>

            <!-- Quick Stats Summary -->
            <span style="font-size: 12px; color: var(--text-secondary); margin-left: 6px;">
              <strong style="color: var(--color-success);">${applicableCount}</strong> Active &bull; <strong style="color: var(--color-purple, #a855f7);">${mandatoryCount}</strong> Required
            </span>
          </div>

          <!-- Search Input -->
          <div style="position: relative; width: 240px;">
            <input 
              type="text" 
              class="form-control form-control-sm" 
              placeholder="Search field..." 
              value="${this.searchTerm || ''}"
              oninput="window.RegistrationConfigModule.setSearchTerm(this.value)"
              id="reg-config-search-input"
              style="padding-left: 32px !important; padding-right: 28px !important; border-radius: var(--radius-pill); font-size: 12px;"
            />
            <span style="position: absolute; left: 9px; top: 7px; font-size: 12px; opacity: 0.5;">🔍</span>
            ${this.searchTerm ? `
              <button type="button" onclick="var inp=document.getElementById('reg-config-search-input'); if(inp){ inp.value=''; window.RegistrationConfigModule.setSearchTerm(''); inp.focus(); }" style="position: absolute; right: 8px; top: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer;">✕</button>
            ` : ''}
          </div>
        </div>

        <!-- Field Configuration Tables Container -->
        <div style="padding: 16px 20px; display: flex; flex-direction: column; gap: 20px;">
          ${(this.activeSection === 'ALL' || this.activeSection === 'RULES') ? this.renderBusinessRulesCard(config) : ''}
          ${(this.activeSection === 'ALL' || this.activeSection === 'CUSTOMER') ? this.renderCustomerFieldsTable(config) : ''}
          ${(this.activeSection === 'ALL' || this.activeSection === 'VEHICLE') ? this.renderVehicleFieldsTable(config) : ''}
        </div>

        <!-- Bottom Guidance Strip -->
        <div style="padding: 12px 20px; background: rgba(99, 102, 241, 0.03); border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 12px; color: var(--text-muted);">
          <div>
            💡 Changes apply immediately to Customer Registration, Vehicle Registration, and Job Card Intake for this facility.
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline btn-xs" onclick="window.RegistrationConfigModule.exportConfig()">
              📥 Export JSON
            </button>
          </div>
        </div>

      </div>
    `;
  },

  renderCustomerFieldsTable(config) {
    let fields = config.customer_fields || [];
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      fields = fields.filter(f => f.label.toLowerCase().includes(q) || f.field_key.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q)));
    }
    if (this.filterStatus === 'MANDATORY') fields = fields.filter(f => f.applicable && f.mandatory);
    else if (this.filterStatus === 'OPTIONAL') fields = fields.filter(f => f.applicable && !f.mandatory);
    else if (this.filterStatus === 'HIDDEN') fields = fields.filter(f => !f.applicable);

    return `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden;">
        <div style="padding: 10px 16px; background: rgba(99, 102, 241, 0.04); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">👤</span>
            <span style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">Customer Information</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-xs" onclick="window.RegistrationConfigModule.setBulkApplicable('CUSTOMER', true)" style="font-size: 11px; padding: 3px 8px;" title="Set all customer fields as active">
              ✓ Enable All
            </button>
            <button class="btn btn-outline btn-xs" onclick="window.RegistrationConfigModule.setBulkMandatory('CUSTOMER', false)" style="font-size: 11px; padding: 3px 8px;" title="Make all customer fields optional">
              Clear Required
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" style="font-size: 12.5px; margin-bottom: 0;">
            <thead>
              <tr>
                <th style="padding: 10px 18px; width: 60%;">Field Name & Description</th>
                <th style="width: 20%; text-align: center;">Applicable</th>
                <th style="width: 20%; text-align: center;">Mandatory</th>
              </tr>
            </thead>
            <tbody>
              ${fields.length === 0 ? `
                <tr><td colspan="3" style="text-align: center; padding: 24px; color: var(--text-muted);">No Customer Information fields match the current filter.</td></tr>
              ` : fields.map(f => this.renderFieldRow(f, 'CUSTOMER')).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderVehicleFieldsTable(config) {
    let fields = config.vehicle_fields || [];
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      fields = fields.filter(f => f.label.toLowerCase().includes(q) || f.field_key.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q)));
    }
    if (this.filterStatus === 'MANDATORY') fields = fields.filter(f => f.applicable && f.mandatory);
    else if (this.filterStatus === 'OPTIONAL') fields = fields.filter(f => f.applicable && !f.mandatory);
    else if (this.filterStatus === 'HIDDEN') fields = fields.filter(f => !f.applicable);

    return `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden;">
        <div style="padding: 10px 16px; background: rgba(99, 102, 241, 0.04); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">🏍️</span>
            <span style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">Vehicle Details</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-xs" onclick="window.RegistrationConfigModule.setBulkApplicable('VEHICLE', true)" style="font-size: 11px; padding: 3px 8px;" title="Set all vehicle fields as active">
              ✓ Enable All
            </button>
            <button class="btn btn-outline btn-xs" onclick="window.RegistrationConfigModule.setBulkMandatory('VEHICLE', false)" style="font-size: 11px; padding: 3px 8px;" title="Make all vehicle fields optional">
              Clear Required
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" style="font-size: 12.5px; margin-bottom: 0;">
            <thead>
              <tr>
                <th style="padding: 10px 18px; width: 60%;">Field Name & Description</th>
                <th style="width: 20%; text-align: center;">Applicable</th>
                <th style="width: 20%; text-align: center;">Mandatory</th>
              </tr>
            </thead>
            <tbody>
              ${fields.length === 0 ? `
                <tr><td colspan="3" style="text-align: center; padding: 24px; color: var(--text-muted);">No Vehicle Details fields match the current filter.</td></tr>
              ` : fields.map(f => this.renderFieldRow(f, 'VEHICLE')).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderFieldRow(field, group) {
    const isApplicable = !!field.applicable;
    const isMandatory = isApplicable && !!field.mandatory;
    const radioNameApplicable = `app_${group}_${field.field_key}`;
    const radioNameMandatory = `man_${group}_${field.field_key}`;

    return `
      <tr class="reg-config-row" id="row-${group}-${field.field_key}" style="transition: all 0.2s ease; ${!isApplicable ? 'opacity: 0.55; background: rgba(0,0,0,0.02);' : ''}">
        <td style="padding: 12px 18px;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="font-weight: 600; font-size: 13px; color: var(--text-primary);" title="Key: ${field.field_key}">
              ${field.label}
            </span>
            ${isMandatory ? '<span style="color: var(--color-danger, #ef4444); font-weight: 800; font-size: 14px; line-height: 1;" title="Required Field">*</span>' : ''}
          </div>
          <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px; line-height: 1.35;">
            ${field.description || 'Configurable intake field'}
          </div>
        </td>
        
        <!-- Applicable Toggle Switch -->
        <td style="text-align: center; vertical-align: middle;">
          <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; margin: 0;">
            <input 
              type="checkbox" 
              name="${radioNameApplicable}" 
              ${isApplicable ? 'checked' : ''} 
              onchange="window.RegistrationConfigModule.toggleApplicable('${group}', '${field.field_key}')" 
              style="position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;"
            />
            <span style="
              display: inline-block; 
              width: 38px; 
              height: 22px; 
              background: ${isApplicable ? 'var(--color-success, #10b981)' : 'rgba(148, 163, 184, 0.25)'}; 
              border-radius: 20px; 
              position: relative; 
              transition: background 0.2s ease;
              border: 1px solid ${isApplicable ? 'transparent' : 'var(--border-subtle, rgba(255,255,255,0.1))'};
            ">
              <span style="
                position: absolute; 
                top: 2px; 
                left: ${isApplicable ? '18px' : '2px'}; 
                width: 16px; 
                height: 16px; 
                background: #ffffff; 
                border-radius: 50%; 
                transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              "></span>
            </span>
            <span style="font-size: 12px; font-weight: 600; color: ${isApplicable ? 'var(--color-success, #10b981)' : 'var(--text-muted)'}; min-width: 48px; text-align: left;">
              ${isApplicable ? 'Active' : 'Hidden'}
            </span>
          </label>
        </td>

        <!-- Mandatory Toggle Switch (Disabled when not applicable) -->
        <td style="text-align: center; vertical-align: middle;">
          <label style="display: inline-flex; align-items: center; gap: 8px; cursor: ${isApplicable ? 'pointer' : 'not-allowed'}; user-select: none; margin: 0; opacity: ${isApplicable ? '1' : '0.4'};">
            <input 
              type="checkbox" 
              name="${radioNameMandatory}" 
              ${isMandatory ? 'checked' : ''} 
              ${!isApplicable ? 'disabled' : ''} 
              onchange="window.RegistrationConfigModule.toggleMandatory('${group}', '${field.field_key}')" 
              style="position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;"
            />
            <span style="
              display: inline-block; 
              width: 38px; 
              height: 22px; 
              background: ${isMandatory ? 'var(--color-purple, #8b5cf6)' : 'rgba(148, 163, 184, 0.25)'}; 
              border-radius: 20px; 
              position: relative; 
              transition: background 0.2s ease;
              border: 1px solid ${isMandatory ? 'transparent' : 'var(--border-subtle, rgba(255,255,255,0.1))'};
            ">
              <span style="
                position: absolute; 
                top: 2px; 
                left: ${isMandatory ? '18px' : '2px'}; 
                width: 16px; 
                height: 16px; 
                background: #ffffff; 
                border-radius: 50%; 
                transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              "></span>
            </span>
            <span style="font-size: 12px; font-weight: 600; color: ${isMandatory ? 'var(--color-purple, #8b5cf6)' : 'var(--text-muted)'}; min-width: 60px; text-align: left;">
              ${isMandatory ? 'Required' : 'Optional'}
            </span>
          </label>
        </td>
      </tr>
    `;
  },

  // Handlers for interactive controls
  onFacilityChange(facilityId) {
    if (this.hasUnsavedChanges) {
      if (!confirm('You have unsaved changes for the current facility. Switching facilities will discard unsaved edits. Proceed?')) {
        const sel = document.getElementById('reg-facility-select');
        if (sel) sel.value = this.selectedFacilityId;
        return;
      }
    }
    this.selectedFacilityId = facilityId;
    this.loadFacilityConfig(facilityId);
    this.refreshView();
  },

  setSection(section) {
    this.activeSection = section;
    this.refreshView();
  },

  setStatusFilter(status) {
    this.filterStatus = status;
    this.refreshView();
  },

  setSearchTerm(term) {
    this.searchTerm = term;
    this.refreshView();
  },

  setApplicable(group, fieldKey, isYes) {
    const listKey = group === 'CUSTOMER' ? 'customer_fields' : 'vehicle_fields';
    const field = this.currentWorkingConfig[listKey].find(f => f.field_key === fieldKey);
    if (!field) return;

    if (isYes === undefined) {
      isYes = !field.applicable;
    }
    field.applicable = !!isYes;
    if (!isYes) {
      field.mandatory = false;
    }
    this.hasUnsavedChanges = true;
    this.refreshView();
  },

  setMandatory(group, fieldKey, isYes) {
    const listKey = group === 'CUSTOMER' ? 'customer_fields' : 'vehicle_fields';
    const field = this.currentWorkingConfig[listKey].find(f => f.field_key === fieldKey);
    if (!field) return;

    if (isYes === undefined) {
      isYes = !field.mandatory;
    }
    if (!field.applicable && isYes) {
      field.applicable = true;
    }
    field.mandatory = !!isYes;
    this.hasUnsavedChanges = true;
    this.refreshView();
  },

  toggleApplicable(group, fieldKey, isYes) {
    if (isYes !== undefined) {
      return this.setApplicable(group, fieldKey, isYes);
    }
    const listKey = group === 'CUSTOMER' ? 'customer_fields' : 'vehicle_fields';
    const field = this.currentWorkingConfig && this.currentWorkingConfig[listKey] && this.currentWorkingConfig[listKey].find(f => f.field_key === fieldKey);
    return this.setApplicable(group, fieldKey, field ? !field.applicable : true);
  },

  toggleMandatory(group, fieldKey, isYes) {
    if (isYes !== undefined) {
      return this.setMandatory(group, fieldKey, isYes);
    }
    const listKey = group === 'CUSTOMER' ? 'customer_fields' : 'vehicle_fields';
    const field = this.currentWorkingConfig && this.currentWorkingConfig[listKey] && this.currentWorkingConfig[listKey].find(f => f.field_key === fieldKey);
    return this.setMandatory(group, fieldKey, field ? !field.mandatory : true);
  },

  setBulkApplicable(group, isYes) {
    const listKey = group === 'CUSTOMER' ? 'customer_fields' : 'vehicle_fields';
    this.currentWorkingConfig[listKey].forEach(f => {
      f.applicable = isYes;
      if (!isYes) f.mandatory = false;
    });
    this.hasUnsavedChanges = true;
    this.refreshView();
  },

  setBulkMandatory(group, isYes) {
    const listKey = group === 'CUSTOMER' ? 'customer_fields' : 'vehicle_fields';
    this.currentWorkingConfig[listKey].forEach(f => {
      if (f.applicable) f.mandatory = isYes;
    });
    this.hasUnsavedChanges = true;
    this.refreshView();
  },

  saveCurrentConfig() {
    const saved = window.DB.saveRegistrationConfig(this.selectedFacilityId, this.currentWorkingConfig);
    this.currentWorkingConfig = JSON.parse(JSON.stringify(saved));
    this.hasUnsavedChanges = false;
    const fac = this.getCurrentFacility();
    if (window.State && typeof window.State.showToast === 'function') {
      window.State.showToast(`Registration configuration successfully saved for ${fac.name}!`, 'success');
    }
    this.refreshView();
  },

  resetToDefaults() {
    const fac = this.getCurrentFacility();
    if (!confirm(`Are you sure you want to reset the registration configuration for ${fac.name} to system baseline defaults?`)) {
      return;
    }
    const fresh = window.DB.resetRegistrationConfig(this.selectedFacilityId);
    this.currentWorkingConfig = JSON.parse(JSON.stringify(fresh));
    this.hasUnsavedChanges = false;
    if (window.State && typeof window.State.showToast === 'function') {
      window.State.showToast(`Reset configuration to defaults for ${fac.name}`, 'info');
    }
    this.refreshView();
  },

  openCopyModal() {
    const currentFac = this.getCurrentFacility();
    const otherFacilities = this.getFacilities().filter(f => f.id !== this.selectedFacilityId);

    if (otherFacilities.length === 0) {
      alert('No other facilities found to copy configuration to.');
      return;
    }

    const modalHtml = `
      <div class="modal-backdrop" id="copy-config-modal-backdrop" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div class="modal-content" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); width: 92%; max-width: 520px; box-shadow: var(--shadow-xl); overflow: hidden;">
          <div class="modal-header" style="padding: 14px 18px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">📋</span>
              <strong style="font-size: 14px; color: var(--text-primary);">Copy Configuration to Other Facilities</strong>
            </div>
            <button class="btn btn-outline btn-xs" onclick="document.getElementById('copy-config-modal-backdrop').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 16px 18px; max-height: 400px; overflow-y: auto;">
            <p style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 14px;">
              Replicate current policy from <strong>${currentFac.name}</strong> to the selected facilities below:
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${otherFacilities.map(f => `
                <label style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); cursor: pointer;">
                  <input type="checkbox" class="copy-target-facility-cb" value="${f.id}" checked />
                  <div>
                    <strong style="font-size: 12.5px; color: var(--text-primary);">${f.name}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">${f.code} &bull; ${f.city}</div>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer" style="padding: 12px 18px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: 10px; background: rgba(0,0,0,0.1);">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('copy-config-modal-backdrop').remove()">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="window.RegistrationConfigModule.executeCopy()">✓ Copy Configuration</button>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('copy-config-modal-backdrop');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  executeCopy() {
    const cbs = document.querySelectorAll('.copy-target-facility-cb:checked');
    const targetIds = Array.from(cbs).map(cb => cb.value);
    if (targetIds.length === 0) {
      alert('Please select at least one target facility.');
      return;
    }

    // Save current configuration first if modified
    this.saveCurrentConfig();
    window.DB.copyRegistrationConfig(this.selectedFacilityId, targetIds);

    const modal = document.getElementById('copy-config-modal-backdrop');
    if (modal) modal.remove();

    if (window.State && typeof window.State.showToast === 'function') {
      window.State.showToast(`Configuration successfully replicated to ${targetIds.length} facilities!`, 'success');
    }
  },

  saveConfiguration() {
    return this.saveCurrentConfig();
  },

  executeCopyConfig() {
    return this.executeCopy();
  },

  resetToDefault() {
    return this.resetToDefaults();
  },

  exportConfig() {
    const cfg = this.currentWorkingConfig || window.DB.getRegistrationConfig(this.selectedFacilityId);
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registration_config_${this.selectedFacilityId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  renderBusinessRulesCard(config) {
    const rules = config.business_rules || {
      allow_duplicate_active_registration: false,
      allow_unregistered_vehicles: true,
      supported_formats: ['STANDARD', 'BH_SERIES', 'TEMPORARY', 'UNREGISTERED'],
      enforce_format_validation: true,
      duplicate_scope: 'ORGANIZATION'
    };

    const isDupAllowed = !!rules.allow_duplicate_active_registration;
    const isUnregAllowed = rules.allow_unregistered_vehicles !== false;
    const supported = rules.supported_formats || ['STANDARD', 'BH_SERIES', 'TEMPORARY', 'UNREGISTERED'];
    const dupScope = rules.duplicate_scope || 'ORGANIZATION';

    return `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden;">
        <div style="padding: 12px 18px; background: rgba(99, 102, 241, 0.04); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">⚖️</span>
            <span style="font-size: 14px; font-weight: 700; color: var(--text-primary);">Vehicle Number Validation & Business Rules</span>
          </div>
        </div>

        <div style="padding: 18px 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
          
          <!-- Duplicate Active Registration Rule -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px;">
                  🚫 Duplicate Active Registrations
                </div>
                <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">
                  Prevent duplicate active vehicle registrations within the applicable organization. Auto-normalizes spaces & uppercase prior to duplicate evaluation.
                </div>
              </div>
            </div>
            <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
              <select class="form-control form-control-sm" style="font-size: 12px; font-weight: 600;" onchange="window.RegistrationConfigModule.setBusinessRule('allow_duplicate_active_registration', this.value === 'true')">
                <option value="false" ${!isDupAllowed ? 'selected' : ''}>❌ Prohibit Duplicates (Default - Strictly Enforced)</option>
                <option value="true" ${isDupAllowed ? 'selected' : ''}>⚠️ Allow Authorized Exception (Duplicate Permitted)</option>
              </select>
            </div>
            <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">
              Scope: <b>${dupScope === 'ORGANIZATION' ? 'Entire Organization (All Facilities)' : 'Current Facility Only'}</b>
            </div>
          </div>

          <!-- Unregistered Vehicles Rule -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px;">
                  🏷️ Unregistered / New Two-Wheelers
                </div>
                <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">
                  Do not make standard registration format mandatory for unregistered vehicles if the business permits them.
                </div>
              </div>
            </div>
            <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
              <select class="form-control form-control-sm" style="font-size: 12px; font-weight: 600;" onchange="window.RegistrationConfigModule.setBusinessRule('allow_unregistered_vehicles', this.value === 'true')">
                <option value="true" ${isUnregAllowed ? 'selected' : ''}>✅ Permit Unregistered Vehicles (Chassis / APPLIED FOR)</option>
                <option value="false" ${!isUnregAllowed ? 'selected' : ''}>❌ Require Immediate Valid Registration Number</option>
              </select>
            </div>
            <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">
              Generates distinct internal <b>Vehicle ID</b> separate from registration.
            </div>
          </div>

          <!-- Supported Registration Formats -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; grid-column: 1 / -1;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
              📋 Supported Registration Formats (Configurable Rules)
            </div>
            <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 10px;">
              System validates inputs against active registration format standards:
            </div>
            <div style="display: flex; gap: 18px; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" checked disabled />
                <span><b>Standard State Plate</b> <code style="font-size: 11px;">MH 12 AB 1234</code></span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${supported.includes('BH_SERIES') ? 'checked' : ''} onchange="window.RegistrationConfigModule.toggleSupportedFormat('BH_SERIES', this.checked)" />
                <span><b>BH-Series</b> <code style="font-size: 11px;">22 BH 1234 AA</code></span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${supported.includes('TEMPORARY') ? 'checked' : ''} onchange="window.RegistrationConfigModule.toggleSupportedFormat('TEMPORARY', this.checked)" />
                <span><b>Temporary Registration</b> <code style="font-size: 11px;">MH 12 TR 1234</code></span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" ${supported.includes('UNREGISTERED') ? 'checked' : ''} onchange="window.RegistrationConfigModule.toggleSupportedFormat('UNREGISTERED', this.checked)" />
                <span><b>Unregistered / Applied-For</b></span>
              </label>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  setBusinessRule(key, value) {
    if (!this.currentWorkingConfig.business_rules) {
      this.currentWorkingConfig.business_rules = {};
    }
    this.currentWorkingConfig.business_rules[key] = value;
    this.hasUnsavedChanges = true;
    this.saveCurrentConfig();
  },

  toggleSupportedFormat(format, isChecked) {
    if (!this.currentWorkingConfig.business_rules) {
      this.currentWorkingConfig.business_rules = { supported_formats: ['STANDARD'] };
    }
    const current = this.currentWorkingConfig.business_rules.supported_formats || ['STANDARD'];
    if (isChecked && !current.includes(format)) {
      current.push(format);
    } else if (!isChecked && current.includes(format)) {
      const idx = current.indexOf(format);
      if (idx !== -1) current.splice(idx, 1);
    }
    this.currentWorkingConfig.business_rules.supported_formats = current;
    this.hasUnsavedChanges = true;
    this.saveCurrentConfig();
  },

  refreshView() {
    const card = document.getElementById('registration-config-card');
    if (card) {
      card.outerHTML = this.renderContentCard();
    } else {
      const container = document.getElementById('org-location-tab-content') || document.getElementById('view-container');
      if (container) container.innerHTML = this.renderContentCard();
    }
  }
};
