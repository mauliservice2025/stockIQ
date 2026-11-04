/* ==========================================================================
   ENTERPRISE ISCM - MASTER DATA MANAGEMENT (SECTION 14 BRD)
   Items, Suppliers, Customers, Warehouses, Bins, Departments & Users
   ========================================================================== */

window.MastersModule = {
  activeMaster: 'SUPPLIERS',

  render(container) {
    if (!container) container = document.getElementById('view-container') || document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `
      ${this.renderActiveMasterContent()}
    `;
  },

  switchMaster(masterKey) {
    this.activeMaster = masterKey;
    this.render(document.getElementById('view-container'));
  },

  renderActiveMasterContent() {
    return this.renderSuppliersMaster();
  },



  renderSuppliersMaster() {
    const allSuppliers = window.DB.getAll('suppliers') || [];
    const query = (this.vendorSearchQuery || '').toLowerCase().trim();
    const suppliers = query 
      ? allSuppliers.filter(s => 
          (s.name && s.name.toLowerCase().includes(query)) ||
          (s.code && s.code.toLowerCase().includes(query)) ||
          (s.city && s.city.toLowerCase().includes(query)) ||
          (s.phone && s.phone.toLowerCase().includes(query)) ||
          (s.contact && s.contact.toLowerCase().includes(query)) ||
          (s.category && s.category.toLowerCase().includes(query))
        )
      : allSuppliers;

    return `
      <div class="content-card" style="padding: 10px 14px;">
        <div class="card-header" style="margin-bottom: 6px; padding-bottom: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="card-title" style="font-size: 14.5px; font-weight: 700; margin: 0; display: inline-flex; align-items: center; gap: 6px;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Approved Supplier & Vendor Master (SRM)
            </div>
            <span id="vendor-master-count" class="badge badge-subtle" style="font-size: 11px; padding: 2px 7px;">${suppliers.length} Vendors</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div style="position: relative; width: 220px;">
              <input 
                type="text" 
                id="vendor-master-search" 
                class="form-control form-control-sm" 
                placeholder="Search vendor, city, phone..." 
                value="${this.vendorSearchQuery || ''}" 
                oninput="window.MastersModule.handleVendorSearch(this.value)"
                style="padding: 3px 8px 3px 30px !important; font-size: 11.5px; height: 28px; border-radius: var(--radius-sm);"
              />
              <span style="position: absolute; left: 8px; top: 6px; font-size: 11px; opacity: 0.6; pointer-events: none;">🔍</span>
            </div>

            <button class="btn btn-primary btn-sm" onclick="window.MastersModule.showAddSupplierModal()" style="padding: 4px 12px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
              <span>+ Onboard New Vendor</span>
            </button>
          </div>
        </div>

        <div class="table-responsive" style="max-height: calc(100vh - 210px); overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
          <table class="data-table compact-table" style="width: 100%; border-collapse: collapse; margin: 0;">
            <thead style="position: sticky; top: 0; z-index: 2; background: var(--bg-surface-elevated, #0f172a); box-shadow: 0 1px 0 var(--border-subtle);">
              <tr>
                <th style="padding: 6px 8px; font-size: 10.5px; width: 105px;">Vendor Code</th>
                <th style="padding: 6px 8px; font-size: 10.5px;">Company Name</th>
                <th style="padding: 6px 8px; font-size: 10.5px; width: 120px;">Category</th>
                <th style="padding: 6px 8px; font-size: 10.5px; min-width: 140px;">Contact Person & Phone</th>
                <th style="padding: 6px 8px; font-size: 10.5px;">Email</th>
                <th style="padding: 6px 8px; font-size: 10.5px;">Company Address & City</th>
                <th style="padding: 6px 8px; font-size: 10.5px; width: 155px;">Payment Terms & Conditions</th>
                <th style="padding: 6px 8px; font-size: 10.5px; width: 68px; text-align: center;">Rating</th>
                <th style="padding: 6px 8px; font-size: 10.5px; width: 85px; text-align: center;">Status</th>
                <th style="padding: 6px 8px; font-size: 10.5px; width: 95px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody id="vendor-master-tbody">
              ${this.renderSupplierTableRows(suppliers)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderSupplierTableRows(suppliers) {
    if (!suppliers || suppliers.length === 0) {
      return `
        <tr>
          <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 24px 10px; font-size: 12px;">
            No suppliers or vendors found.
          </td>
        </tr>
      `;
    }

    return suppliers.map(s => `
      <tr style="border-bottom: 1px solid var(--border-subtle); cursor: pointer;" onclick="if (!event.target.closest('button')) window.MastersModule.viewSupplierDetails('${s.id || s.code}')">
        <td style="padding: 4px 8px;">
          <span class="cell-mono cell-strong" style="color: var(--primary-300); font-size: 11px; font-weight: 700;">${s.code}</span>
        </td>
        <td style="padding: 4px 8px;">
          <div class="cell-strong" style="font-weight: 700; font-size: 11.5px; color: var(--text-primary); line-height: 1.25;">${s.name}</div>
          ${(s.tax_id || s.gstin) ? `<div class="cell-mono" style="font-size: 9.5px; color: var(--text-muted); line-height: 1.2;">GSTIN: ${s.tax_id || s.gstin}</div>` : ''}
        </td>
        <td style="padding: 4px 8px;">
          <span class="badge badge-subtle" style="font-size: 9.5px; padding: 1px 6px; white-space: nowrap;">${s.category || 'GENERAL'}</span>
        </td>
        <td style="padding: 4px 8px;">
          <div style="font-weight: 600; font-size: 11.5px; color: var(--text-primary); line-height: 1.25;">${s.contact || s.contact_person || '—'}</div>
          <div class="cell-mono" style="font-size: 10.5px; color: var(--primary-300); line-height: 1.2;">${s.phone || s.contact_number || '—'}</div>
        </td>
        <td style="padding: 4px 8px;">
          <a href="mailto:${s.email}" style="color: var(--text-secondary); font-size: 11px; text-decoration: none;" onclick="event.stopPropagation()">${s.email || '—'}</a>
        </td>
        <td style="padding: 4px 8px;">
          <div style="font-weight: 600; font-size: 11.5px; color: var(--text-primary); line-height: 1.25;">${s.city || '—'}</div>
          ${(s.address || s.company_address) ? `<div style="font-size: 10px; color: var(--text-muted); max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;" title="${s.address || s.company_address}">${s.address || s.company_address}</div>` : ''}
        </td>
        <td style="padding: 4px 8px;">
          <div class="cell-mono cell-strong" style="font-size: 11px; font-weight: 700; line-height: 1.25;">${s.payment_terms || s.payment_terms_days || 0} Days</div>
          ${s.payment_conditions ? `<div style="font-size: 9.5px; color: #10b981; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;" title="${s.payment_conditions}">${s.payment_conditions}</div>` : ''}
        </td>
        <td style="padding: 4px 8px; text-align: center;">
          <span style="color: var(--color-warning); font-weight: 800; font-size: 11px; white-space: nowrap;">⭐ ${s.rating || 4.5}</span>
        </td>
        <td style="padding: 4px 8px; text-align: center;">
          <span class="status-pill status-approved" style="font-size: 9.5px; padding: 2px 6px; letter-spacing: 0.2px;">${s.status || 'APPROVED'}</span>
        </td>
        <td style="padding: 4px 8px; text-align: center;" onclick="event.stopPropagation()">
          <div style="display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
            <button 
              type="button" 
              class="btn btn-icon btn-sm" 
              onclick="window.MastersModule.viewSupplierDetails('${s.id || s.code}')" 
              title="View Full Vendor Details" 
            >
              ${window.AppIcons ? window.AppIcons.svgView : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'}
            </button>
            <button 
              type="button" 
              class="btn btn-icon btn-sm" 
              onclick="window.MastersModule.showEditSupplierModal('${s.id || s.code}')" 
              title="Edit Vendor" 
            >
              ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
            </button>
            <button 
              type="button" 
              class="btn btn-icon btn-sm" 
              onclick="window.MastersModule.deleteSupplier('${s.id || s.code}')" 
              title="Delete Vendor" 
              style="color: var(--color-danger);"
            >
              ${window.AppIcons ? window.AppIcons.svgDelete : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'}
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  handleVendorSearch(query) {
    this.vendorSearchQuery = (query || '').toLowerCase().trim();
    const tbody = document.getElementById('vendor-master-tbody');
    if (tbody) {
      const allSuppliers = window.DB.getAll('suppliers') || [];
      const filtered = this.vendorSearchQuery 
        ? allSuppliers.filter(s => 
            (s.name && s.name.toLowerCase().includes(this.vendorSearchQuery)) ||
            (s.code && s.code.toLowerCase().includes(this.vendorSearchQuery)) ||
            (s.city && s.city.toLowerCase().includes(this.vendorSearchQuery)) ||
            (s.phone && s.phone.toLowerCase().includes(this.vendorSearchQuery)) ||
            (s.contact && s.contact.toLowerCase().includes(this.vendorSearchQuery)) ||
            (s.category && s.category.toLowerCase().includes(this.vendorSearchQuery))
          )
        : allSuppliers;
      tbody.innerHTML = this.renderSupplierTableRows(filtered);
      const countEl = document.getElementById('vendor-master-count');
      if (countEl) countEl.innerText = `${filtered.length} Vendors`;
    }
  },

  showAddSupplierModal() {
    window.State.showModal({
      title: 'Onboard Supplier / Vendor',
      isFullScreen: true,
      maxWidth: '1200px',
      contentHtml: `
        <form id="add-sup-form" onsubmit="window.MastersModule.submitNewSupplier(event)" style="display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Datalists for Address Master autocomplete -->
          <datalist id="sup-city-datalist">
            ${(window.DB && typeof window.DB.getAll === 'function' ? window.DB.getAll('cities') : []).map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
          </datalist>
          <datalist id="sup-state-datalist">
            ${(window.DB && typeof window.DB.getAll === 'function' ? window.DB.getAll('states') : []).map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
          </datalist>
          <datalist id="sup-pincode-datalist">
            ${(window.DB && typeof window.DB.getAll === 'function' ? window.DB.getAll('pincodes') : []).map(p => `<option value="${p.pincode}">${p.area_name ? p.area_name : p.pincode}</option>`).join('')}
          </datalist>

          <!-- SECTION 1: Company & Business Profile -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 18px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
              <span>Company & Business Profile</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Vendor Code <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="text" id="new-sup-code" class="form-control cell-mono" placeholder="e.g. BHARAT-FORGE" required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Company / Vendor Name <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="text" id="new-sup-name" class="form-control" placeholder="e.g. Bharat Heavy Forgings Ltd." required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Category</label>
                <select id="new-sup-cat" class="form-control" style="width: 100%;">
                  <option value="" disabled selected>-- Select Category --</option>
                  <option value="RAW_MATERIAL">Raw Materials & Steels</option>
                  <option value="OEM_COMPONENTS">OEM Precision Components</option>
                  <option value="BRAKES_SUSPENSION">Brakes, Chassis & Suspension</option>
                  <option value="LUBRICANTS">Lubricants & Engine Oils</option>
                  <option value="BATTERIES">Batteries & Electricals</option>
                  <option value="TYRES_TUBES">Tyres & Tubes</option>
                  <option value="TRANSMISSION">Transmission & Chains</option>
                  <option value="HYDRAULICS">Hydraulics & Seals</option>
                  <option value="ELECTRONICS">Electronics & PCBAs</option>
                  <option value="CONSUMABLES">Workshop Consumables</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">GSTIN / Tax ID</label>
                <input type="text" id="new-sup-tax" class="form-control cell-mono" placeholder="e.g. 27AAACB2188K1Z5" maxlength="15">
              </div>
            </div>

            <!-- Company Address Row with Address Master Integration -->
            <div style="margin-top: 14px; margin-bottom: 6px;">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Address & Geographic Location</span>
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Company Address <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="text" id="new-sup-address" class="form-control" placeholder="e.g. Plot No. 12, Sector 7, MIDC Industrial Area, Bhosari" value="" required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">City <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="text" id="new-sup-city" list="sup-city-datalist" class="form-control" placeholder="e.g. Pune" value="" required oninput="window.MastersModule.lookupAddressByCity(this.value, 'new')" onchange="window.MastersModule.lookupAddressByCity(this.value, 'new')">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">State</label>
                <input type="text" id="new-sup-state" list="sup-state-datalist" class="form-control" placeholder="e.g. Maharashtra" value="">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">PIN / Postal Code</label>
                <input type="text" id="new-sup-pincode" list="sup-pincode-datalist" class="form-control cell-mono" placeholder="e.g. 411026" value="" maxlength="10" oninput="window.MastersModule.lookupAddressByPin(this.value, 'new')">
              </div>
            </div>
          </div>

          <!-- SECTION 2: Primary Contact Details -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 18px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
              <span>Primary Contact Details</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Contact Person <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="text" id="new-sup-contact" class="form-control" value="" placeholder="Full name of contact person" required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Contact Person Number (Phone/Mobile) <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="tel" id="new-sup-phone" class="form-control cell-mono" value="" placeholder="e.g. 9822011002" required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Email Address</label>
                <input type="email" id="new-sup-email" class="form-control" value="" placeholder="e.g. sales@vendor.com">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Alternate Phone / WhatsApp</label>
                <input type="tel" id="new-sup-alt-phone" class="form-control cell-mono" placeholder="e.g. 9822011003">
              </div>
            </div>
          </div>

          <!-- SECTION 3: Payment Conditions & Commercial Terms -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 18px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
              <span>Commercial & Payment Conditions</span>
            </div>
            <div style="display: grid; grid-template-columns: 180px 1fr 200px; gap: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Payment Terms (Days) <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="number" id="new-sup-terms" class="form-control cell-mono" placeholder="e.g. 30" value="" min="0" max="365" required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Payment Conditions <span class="required" style="color: var(--color-danger);">*</span></label>
                <div style="display: flex; gap: 8px;">
                  <select id="new-sup-conditions-preset" class="form-control" style="max-width: 210px;" onchange="
                    const customInput = document.getElementById('new-sup-conditions');
                    if (this.value !== 'CUSTOM' && this.value !== '') {
                      customInput.value = this.value;
                    } else if (this.value === 'CUSTOM') {
                      customInput.value = '';
                      customInput.focus();
                    }
                  ">
                    <option value="" selected>-- Select Payment Condition --</option>
                    <option value="Net 30 Days from Invoice Date">Net 30 Days from Invoice</option>
                    <option value="Net 15 Days after GRN / QC Verification">Net 15 Days after GRN</option>
                    <option value="Net 45 Days against Accepted Bill">Net 45 Days against Bill</option>
                    <option value="Immediate on Delivery (COD)">Immediate on Delivery (COD)</option>
                    <option value="50% Advance with PO, 50% on Delivery">50% Advance, 50% Delivery</option>
                    <option value="100% Advance against Proforma Invoice">100% Proforma Advance</option>
                    <option value="CUSTOM">Custom Condition...</option>
                  </select>
                  <input type="text" id="new-sup-conditions" class="form-control" value="" placeholder="e.g. Net 30 Days from Invoice date after inspection" required style="flex: 1;">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Vendor Rating</label>
                <select id="new-sup-rating" class="form-control">
                  <option value="5.0">5.0 - Premier</option>
                  <option value="4.5" selected>4.5 - Approved</option>
                  <option value="4.0">4.0 - Standard</option>
                  <option value="3.5">3.5 - Provisional</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Bank Details (A/C & IFSC)</label>
                <input type="text" id="new-sup-bank" class="form-control" placeholder="e.g. HDFC Bank, A/C: 50200012345678, IFSC: HDFC0000123">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Remarks / Onboarding Notes</label>
                <input type="text" id="new-sup-remarks" class="form-control" placeholder="e.g. Authorized OEM supplier, ISO 9001:2015 certified">
              </div>
            </div>
          </div>

          <!-- MODAL ACTIONS -->
          <div class="modal-footer" style="padding: 12px 0 0 0; margin-top: 6px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-subtle);">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()" style="padding: 9px 20px;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="padding: 9px 26px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              <span>Save Vendor</span>
            </button>
          </div>
        </form>
      `
    });
  },

  submitNewSupplier(e) {
    e.preventDefault();
    const code = document.getElementById('new-sup-code').value.trim();
    if (!code) {
      window.State.showToast('Please enter a Vendor Code.', 'warning');
      return;
    }

    // Validate that Vendor Code is unique
    const suppliers = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('suppliers') || []) : [];
    const isDuplicate = suppliers.some(s => 
      (s.code && s.code.trim().toUpperCase() === code.toUpperCase()) ||
      (s.id && s.id.trim().toUpperCase() === code.toUpperCase())
    );
    if (isDuplicate) {
      window.State.showToast(`Vendor code "${code}" already exists. Vendor code must be unique!`, 'danger');
      if (typeof this.checkVendorCodeUnique === 'function') {
        this.checkVendorCodeUnique(code, true);
      }
      const codeInput = document.getElementById('new-sup-code');
      if (codeInput) {
        codeInput.focus();
        codeInput.style.borderColor = 'var(--color-danger, #ef4444)';
      }
      return;
    }

    const name = document.getElementById('new-sup-name').value.trim();
    const cat = document.getElementById('new-sup-cat').value || 'GENERAL';
    const contact = document.getElementById('new-sup-contact').value.trim();
    const phone = document.getElementById('new-sup-phone') ? document.getElementById('new-sup-phone').value.trim() : '';
    const email = document.getElementById('new-sup-email') ? document.getElementById('new-sup-email').value.trim() : '';
    const address = document.getElementById('new-sup-address') ? document.getElementById('new-sup-address').value.trim() : '';
    const city = document.getElementById('new-sup-city') ? document.getElementById('new-sup-city').value.trim() : '';
    const state = document.getElementById('new-sup-state') ? document.getElementById('new-sup-state').value.trim() : '';
    const pincode = document.getElementById('new-sup-pincode') ? document.getElementById('new-sup-pincode').value.trim() : '';
    const taxId = document.getElementById('new-sup-tax') ? document.getElementById('new-sup-tax').value.trim() : '';
    const terms = document.getElementById('new-sup-terms') && document.getElementById('new-sup-terms').value ? Number(document.getElementById('new-sup-terms').value) : 30;
    const conditions = document.getElementById('new-sup-conditions') ? document.getElementById('new-sup-conditions').value.trim() : 'Net 30 Days from Invoice Date';
    const bankDetails = document.getElementById('new-sup-bank') ? document.getElementById('new-sup-bank').value.trim() : '';
    const remarks = document.getElementById('new-sup-remarks') ? document.getElementById('new-sup-remarks').value.trim() : '';
    const rating = document.getElementById('new-sup-rating') ? Number(document.getElementById('new-sup-rating').value) || 4.5 : 4.5;

    window.DB.insert('suppliers', {
      id: code,
      code: code,
      name: name,
      company_name: name,
      category: cat,
      contact: contact,
      contact_person: contact,
      phone: phone,
      contact_number: phone,
      email: email,
      address: address,
      company_address: address,
      city: city,
      state: state,
      pincode: pincode,
      tax_id: taxId,
      gstin: taxId,
      rating: rating,
      payment_terms: terms,
      payment_terms_days: terms,
      payment_conditions: conditions,
      bank_details: bankDetails,
      remarks: remarks,
      is_approved: true,
      status: 'APPROVED',
      created_at: new Date().toISOString()
    });

    window.DB.logAudit('CREATE_SUPPLIER', 'MASTERS', code, `Onboarded vendor ${name} (${code}).`);
    window.State.closeModal();
    window.State.showToast(`Vendor ${name} onboarded!`, 'success');
    this.refreshSupplierMasterView();
  },

  refreshSupplierMasterView() {
    if (window.OrgLocationModule && (window.location.hash === '#/suppliers' || window.location.hash === '#/supplier-master' || window.OrgLocationModule.activeTab === 'SUPPLIERS')) {
      window.OrgLocationModule.render();
    } else if (typeof window.MastersModule.render === 'function') {
      const container = document.getElementById('view-container');
      if (container) window.MastersModule.render(container);
    }
  },

  showEditSupplierModal(id) {
    const suppliers = window.DB.getAll('suppliers') || [];
    const s = suppliers.find(sup => sup.id === id || sup.code === id);
    if (!s) {
      window.State.showToast('Supplier record not found.', 'warning');
      return;
    }

    const categories = [
      { id: 'RAW_MATERIAL', label: 'Raw Materials & Steels' },
      { id: 'OEM_COMPONENTS', label: 'OEM Precision Components' },
      { id: 'BRAKES_SUSPENSION', label: 'Brakes, Chassis & Suspension' },
      { id: 'LUBRICANTS', label: 'Lubricants & Engine Oils' },
      { id: 'BATTERIES', label: 'Batteries & Electricals' },
      { id: 'TYRES_TUBES', label: 'Tyres & Tubes' },
      { id: 'TRANSMISSION', label: 'Transmission & Chains' },
      { id: 'HYDRAULICS', label: 'Hydraulics & Seals' },
      { id: 'ELECTRONICS', label: 'Electronics & PCBAs' },
      { id: 'CONSUMABLES', label: 'Workshop Consumables' },
      { id: 'GENERAL', label: 'General Supplies' }
    ];

    const currentCat = s.category || 'GENERAL';
    const currentRating = s.rating !== undefined ? Number(s.rating).toFixed(1) : '4.5';
    const currentStatus = s.status || 'APPROVED';

    window.State.showModal({
      title: `Edit Supplier / Vendor: ${s.name} (${s.code})`,
      isFullScreen: true,
      maxWidth: '1200px',
      contentHtml: `
        <form id="edit-sup-form" onsubmit="window.MastersModule.submitEditSupplier(event, '${s.id || s.code}')" style="display: flex; flex-direction: column; gap: 16px;">
          
          <!-- SECTION 1: Company & Business Profile -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 18px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
              <span>Company & Business Profile</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Vendor Code</label>
                <input type="text" id="edit-sup-code" class="form-control cell-mono" value="${s.code || s.id}" readonly style="background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: not-allowed;">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Company / Vendor Name <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="text" id="edit-sup-name" class="form-control" value="${s.name || ''}" placeholder="e.g. Bharat Heavy Forgings Ltd." required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Category</label>
                <select id="edit-sup-cat" class="form-control" style="width: 100%;">
                  ${categories.map(c => `<option value="${c.id}" ${c.id === currentCat ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">GSTIN / Tax ID</label>
                <input type="text" id="edit-sup-tax" class="form-control cell-mono" value="${s.tax_id || s.gstin || ''}" placeholder="e.g. 27AAACB2188K1Z5" maxlength="15">
              </div>
            </div>

            <!-- Company Address Row with Address Master Integration -->
            <div style="margin-top: 14px; margin-bottom: 6px;">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Address & Geographic Location</span>
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Company Address <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="text" id="edit-sup-address" class="form-control" placeholder="e.g. Plot No. 12, Sector 7, MIDC Industrial Area" value="${s.address || s.company_address || ''}" required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">City <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="text" id="edit-sup-city" list="sup-city-datalist" class="form-control" placeholder="e.g. Pune" value="${s.city || ''}" required oninput="window.MastersModule.lookupAddressByCity(this.value, 'edit')" onchange="window.MastersModule.lookupAddressByCity(this.value, 'edit')">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">State</label>
                <input type="text" id="edit-sup-state" list="sup-state-datalist" class="form-control" placeholder="e.g. Maharashtra" value="${s.state || ''}">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">PIN / Postal Code</label>
                <input type="text" id="edit-sup-pincode" list="sup-pincode-datalist" class="form-control cell-mono" placeholder="e.g. 411026" value="${s.pincode || ''}" maxlength="10" oninput="window.MastersModule.lookupAddressByPin(this.value, 'edit')">
              </div>
            </div>
          </div>

          <!-- SECTION 2: Primary Contact Details -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 18px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
              <span>Primary Contact Details</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Contact Person <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="text" id="edit-sup-contact" class="form-control" value="${s.contact || s.contact_person || ''}" placeholder="Full name of contact person" required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Contact Person Number (Phone/Mobile) <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="tel" id="edit-sup-phone" class="form-control cell-mono" value="${s.phone || s.contact_number || ''}" placeholder="e.g. 9822011002" required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Email Address</label>
                <input type="email" id="edit-sup-email" class="form-control" value="${s.email || ''}" placeholder="e.g. sales@vendor.com">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Alternate Phone / WhatsApp</label>
                <input type="tel" id="edit-sup-alt-phone" class="form-control cell-mono" value="${s.alt_phone || s.alternate_phone || ''}" placeholder="e.g. 9822011003">
              </div>
            </div>
          </div>

          <!-- SECTION 3: Commercial & Payment Conditions -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 18px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
              <span>Commercial & Payment Conditions</span>
            </div>
            <div style="display: grid; grid-template-columns: 180px 1fr 180px 180px; gap: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Payment Terms (Days) <span class="required" style="color: var(--color-danger);">*</span></label>
                <input type="number" id="edit-sup-terms" class="form-control cell-mono" placeholder="e.g. 30" value="${s.payment_terms || s.payment_terms_days || 30}" min="0" max="365" required>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Payment Conditions <span class="required" style="color: var(--color-danger);">*</span></label>
                <div style="display: flex; gap: 8px;">
                  <select id="edit-sup-conditions-preset" class="form-control" style="max-width: 210px;" onchange="
                    const customInput = document.getElementById('edit-sup-conditions');
                    if (this.value !== 'CUSTOM' && this.value !== '') {
                      customInput.value = this.value;
                    } else if (this.value === 'CUSTOM') {
                      customInput.value = '';
                      customInput.focus();
                    }
                  ">
                    <option value="">-- Condition Presets --</option>
                    <option value="Net 30 Days from Invoice Date">Net 30 Days from Invoice</option>
                    <option value="Net 15 Days after GRN / QC Verification">Net 15 Days after GRN</option>
                    <option value="Net 45 Days against Accepted Bill">Net 45 Days against Bill</option>
                    <option value="Immediate on Delivery (COD)">Immediate on Delivery (COD)</option>
                    <option value="50% Advance with PO, 50% on Delivery">50% Advance, 50% Delivery</option>
                    <option value="100% Advance against Proforma Invoice">100% Proforma Advance</option>
                    <option value="CUSTOM">Custom Condition...</option>
                  </select>
                  <input type="text" id="edit-sup-conditions" class="form-control" value="${s.payment_conditions || 'Net 30 Days from Invoice Date'}" placeholder="e.g. Net 30 Days from Invoice date after inspection" required style="flex: 1;">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Vendor Rating</label>
                <select id="edit-sup-rating" class="form-control">
                  <option value="5.0" ${currentRating === '5.0' ? 'selected' : ''}>5.0 - Premier</option>
                  <option value="4.9" ${currentRating === '4.9' ? 'selected' : ''}>4.9 - Preferred</option>
                  <option value="4.8" ${currentRating === '4.8' ? 'selected' : ''}>4.8 - Excellent</option>
                  <option value="4.5" ${currentRating === '4.5' ? 'selected' : ''}>4.5 - Approved</option>
                  <option value="4.0" ${currentRating === '4.0' ? 'selected' : ''}>4.0 - Standard</option>
                  <option value="3.5" ${currentRating === '3.5' ? 'selected' : ''}>3.5 - Provisional</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Status</label>
                <select id="edit-sup-status" class="form-control">
                  <option value="APPROVED" ${currentStatus === 'APPROVED' ? 'selected' : ''}>APPROVED</option>
                  <option value="PROVISIONAL" ${currentStatus === 'PROVISIONAL' ? 'selected' : ''}>PROVISIONAL</option>
                  <option value="UNDER_REVIEW" ${currentStatus === 'UNDER_REVIEW' ? 'selected' : ''}>UNDER_REVIEW</option>
                  <option value="BLOCKED" ${currentStatus === 'BLOCKED' ? 'selected' : ''}>BLOCKED</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Bank Details (A/C & IFSC)</label>
                <input type="text" id="edit-sup-bank" class="form-control" value="${s.bank_details || ''}" placeholder="e.g. HDFC Bank, A/C: 50200012345678, IFSC: HDFC0000123">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Remarks / Notes</label>
                <input type="text" id="edit-sup-remarks" class="form-control" value="${s.remarks || ''}" placeholder="e.g. Authorized OEM supplier, ISO 9001:2015 certified">
              </div>
            </div>
          </div>

          <!-- MODAL ACTIONS -->
          <div class="modal-footer" style="padding: 12px 0 0 0; margin-top: 6px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle);">
            <button type="button" class="btn btn-ghost" onclick="window.MastersModule.deleteSupplier('${s.id || s.code}')" style="color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px 16px;">
              <span>Delete Vendor</span>
            </button>
            <div style="display: flex; gap: 10px;">
              <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()" style="padding: 9px 20px;">Cancel</button>
              <button type="submit" class="btn btn-primary" style="padding: 9px 26px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
                <span>Update Vendor</span>
              </button>
            </div>
          </div>
        </form>
      `
    });
  },

  submitEditSupplier(e, id) {
    e.preventDefault();
    const suppliers = window.DB.getAll('suppliers') || [];
    const s = suppliers.find(sup => sup.id === id || sup.code === id);
    if (!s) {
      window.State.showToast('Vendor record not found to update.', 'warning');
      return;
    }

    const editCodeEl = document.getElementById('edit-sup-code');
    const newCode = editCodeEl ? editCodeEl.value.trim() : (s.code || s.id);
    if (newCode) {
      const isDuplicate = suppliers.some(sup => 
        sup.id !== s.id && (sup.code || sup.id) !== (s.code || s.id) &&
        ((sup.code && sup.code.trim().toUpperCase() === newCode.toUpperCase()) ||
         (sup.id && sup.id.trim().toUpperCase() === newCode.toUpperCase()))
      );
      if (isDuplicate) {
        window.State.showToast(`Vendor code "${newCode}" is already assigned to another vendor. Vendor code must be unique!`, 'danger');
        return;
      }
    }

    const name = document.getElementById('edit-sup-name').value.trim();
    const cat = document.getElementById('edit-sup-cat').value || s.category || 'GENERAL';
    const contact = document.getElementById('edit-sup-contact').value.trim();
    const phone = document.getElementById('edit-sup-phone') ? document.getElementById('edit-sup-phone').value.trim() : '';
    const email = document.getElementById('edit-sup-email') ? document.getElementById('edit-sup-email').value.trim() : '';
    const altPhone = document.getElementById('edit-sup-alt-phone') ? document.getElementById('edit-sup-alt-phone').value.trim() : '';
    const address = document.getElementById('edit-sup-address') ? document.getElementById('edit-sup-address').value.trim() : '';
    const city = document.getElementById('edit-sup-city') ? document.getElementById('edit-sup-city').value.trim() : '';
    const state = document.getElementById('edit-sup-state') ? document.getElementById('edit-sup-state').value.trim() : '';
    const pincode = document.getElementById('edit-sup-pincode') ? document.getElementById('edit-sup-pincode').value.trim() : '';
    const taxId = document.getElementById('edit-sup-tax') ? document.getElementById('edit-sup-tax').value.trim() : '';
    const terms = document.getElementById('edit-sup-terms') && document.getElementById('edit-sup-terms').value ? Number(document.getElementById('edit-sup-terms').value) : (s.payment_terms || 30);
    const conditions = document.getElementById('edit-sup-conditions') ? document.getElementById('edit-sup-conditions').value.trim() : (s.payment_conditions || 'Net 30 Days from Invoice Date');
    const bankDetails = document.getElementById('edit-sup-bank') ? document.getElementById('edit-sup-bank').value.trim() : '';
    const remarks = document.getElementById('edit-sup-remarks') ? document.getElementById('edit-sup-remarks').value.trim() : '';
    const rating = document.getElementById('edit-sup-rating') ? Number(document.getElementById('edit-sup-rating').value) || s.rating || 4.5 : (s.rating || 4.5);
    const status = document.getElementById('edit-sup-status') ? document.getElementById('edit-sup-status').value : (s.status || 'APPROVED');

    const updatedSupplier = {
      ...s,
      name: name,
      company_name: name,
      category: cat,
      contact: contact,
      contact_person: contact,
      phone: phone,
      contact_number: phone,
      email: email,
      alt_phone: altPhone,
      address: address,
      company_address: address,
      city: city,
      state: state,
      pincode: pincode,
      tax_id: taxId,
      gstin: taxId,
      rating: rating,
      payment_terms: terms,
      payment_terms_days: terms,
      payment_conditions: conditions,
      bank_details: bankDetails,
      remarks: remarks,
      status: status,
      updated_at: new Date().toISOString()
    };

    window.DB.upsert('suppliers', updatedSupplier);
    window.DB.emitChange('suppliers');
    if (typeof window.DB.saveData === 'function') window.DB.saveData();

    window.DB.logAudit('UPDATE_SUPPLIER', 'MASTERS', s.code, `Updated vendor profile ${name} (${s.code}).`);
    window.State.closeModal();
    window.State.showToast(`Vendor ${name} updated successfully!`, 'success');
    this.refreshSupplierMasterView();
  },

  /* -------------------------------------------------------------------------
     VENDOR CODE UNIQUENESS & ADDRESS MASTER INTEGRATION
     ------------------------------------------------------------------------- */

  checkVendorCodeUnique(code, isBlur = false) {
    const feedback = document.getElementById('new-sup-code-feedback');
    const input = document.getElementById('new-sup-code');
    if (!input) return true;

    const trimmed = (code || '').trim();
    if (!trimmed) {
      input.style.borderColor = '';
      if (feedback) {
        feedback.style.display = 'none';
        feedback.innerHTML = '';
      }
      return false;
    }

    const suppliers = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('suppliers') || []) : [];
    const duplicate = suppliers.find(s => 
      (s.code && s.code.trim().toUpperCase() === trimmed.toUpperCase()) ||
      (s.id && s.id.trim().toUpperCase() === trimmed.toUpperCase())
    );

    if (duplicate) {
      if (feedback) {
        feedback.style.display = 'none';
        feedback.innerHTML = '';
      }
      return false;
    } else {
      if (feedback) {
        feedback.style.display = 'none';
        feedback.innerHTML = '';
      }
      return true;
    }
  },

  getAddressFromMaster({ pincode, city }) {
    if (!window.DB || typeof window.DB.getAll !== 'function') return null;

    const allPins = window.DB.getAll('pincodes') || [];
    const allCities = window.DB.getAll('cities') || [];
    const allStates = window.DB.getAll('states') || [];
    const allDistricts = window.DB.getAll('districts') || [];

    // 1. By Pincode
    if (pincode) {
      const cleanPin = String(pincode).trim();
      // Check Address Master table 'pincodes'
      const foundPin = allPins.find(p => String(p.pincode).trim() === cleanPin);
      if (foundPin) {
        const cityObj = allCities.find(c => c.id === foundPin.city_id);
        const distObj = allDistricts.find(d => d.id === (foundPin.district_id || (cityObj ? cityObj.district_id : '')));
        const stateObj = allStates.find(s => s.id === (foundPin.state_id || (distObj ? distObj.state_id : (cityObj ? cityObj.state_id : ''))));
        return {
          city: cityObj ? cityObj.name : (foundPin.area_name || ''),
          state: stateObj ? stateObj.name : 'Maharashtra',
          pincode: cleanPin,
          district: distObj ? distObj.name : '',
          source: 'Address Master'
        };
      }

      // Check BillingModule lookup if available
      if (window.BillingModule && typeof window.BillingModule.lookupPincodeLocal === 'function') {
        const bRes = window.BillingModule.lookupPincodeLocal(cleanPin);
        if (bRes) {
          return {
            city: bRes.city || '',
            state: bRes.state || 'Maharashtra',
            pincode: cleanPin,
            district: bRes.district || '',
            source: 'Address Master'
          };
        }
      }

      if (window.BillingModule && window.BillingModule.PINCODE_DATABASE && window.BillingModule.PINCODE_DATABASE[cleanPin]) {
        const bRes = window.BillingModule.PINCODE_DATABASE[cleanPin];
        return {
          city: bRes.city || '',
          state: bRes.state || 'Maharashtra',
          pincode: cleanPin,
          district: bRes.district || '',
          source: 'Address Master'
        };
      }
    }

    // 2. By City or Area Name
    if (city) {
      const cleanCity = String(city).trim().toLowerCase();
      let foundCity = allCities.find(c => c.name && c.name.trim().toLowerCase() === cleanCity);
      
      let matchedPin = null;
      if (!foundCity) {
        matchedPin = allPins.find(p => p.area_name && p.area_name.toLowerCase().includes(cleanCity));
        if (matchedPin) {
          foundCity = allCities.find(c => c.id === matchedPin.city_id);
        }
      }

      if (foundCity) {
        const distObj = allDistricts.find(d => d.id === foundCity.district_id);
        const stateObj = allStates.find(s => s.id === (foundCity.state_id || (distObj ? distObj.state_id : '')));
        const linkedPin = matchedPin || allPins.find(p => p.city_id === foundCity.id);
        let pin = linkedPin ? linkedPin.pincode : '';

        if (!pin && window.BillingModule && window.BillingModule.PINCODE_DATABASE) {
          const pinEntries = Object.entries(window.BillingModule.PINCODE_DATABASE);
          const match = pinEntries.find(([p, data]) => data.city && data.city.toLowerCase() === foundCity.name.toLowerCase());
          if (match) pin = match[0];
        }

        return {
          city: foundCity.name,
          state: stateObj ? stateObj.name : 'Maharashtra',
          pincode: pin,
          district: distObj ? distObj.name : '',
          source: 'Address Master'
        };
      }
    }

    return null;
  },

  lookupAddressByPin(pin, prefix = 'new') {
    const cleanPin = String(pin || '').replace(/\D/g, '').slice(0, 6);
    const feedback = document.getElementById(`${prefix}-sup-address-feedback`);

    if (cleanPin.length !== 6) {
      if (feedback && cleanPin.length === 0) feedback.style.display = 'none';
      return;
    }

    const res = this.getAddressFromMaster({ pincode: cleanPin });
    if (res && (res.city || res.state)) {
      const cityEl = document.getElementById(`${prefix}-sup-city`);
      const stateEl = document.getElementById(`${prefix}-sup-state`);
      const pinEl = document.getElementById(`${prefix}-sup-pincode`);

      if (cityEl && (!cityEl.value || cityEl.value.trim() === '' || prefix === 'new' || cityEl.dataset.autofilled === 'true')) {
        cityEl.value = res.city || cityEl.value;
        cityEl.dataset.autofilled = 'true';
      }
      if (stateEl) {
        stateEl.value = res.state || stateEl.value;
        stateEl.dataset.autofilled = 'true';
      }
      if (pinEl && pinEl.value !== cleanPin) {
        pinEl.value = cleanPin;
      }
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = 'var(--color-success, #10b981)';
        feedback.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px;">📍 Fetched from Address Master: <strong>${res.city || ''}${res.state ? ', ' + res.state : ''}</strong> (PIN: ${cleanPin})</span>`;
      }
    } else {
      // Async fallback to public postal API if online
      if (typeof fetch === 'function') {
        fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data) && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
              const po = data[0].PostOffice[0];
              const city = (po.Block && po.Block !== 'NA') ? po.Block : (po.District || po.Name);
              const state = po.State || 'Maharashtra';
              const cityEl = document.getElementById(`${prefix}-sup-city`);
              const stateEl = document.getElementById(`${prefix}-sup-state`);
              if (cityEl && (!cityEl.value || cityEl.dataset.autofilled === 'true')) {
                cityEl.value = city;
                cityEl.dataset.autofilled = 'true';
              }
              if (stateEl) {
                stateEl.value = state;
                stateEl.dataset.autofilled = 'true';
              }
              if (feedback) {
                feedback.style.display = 'block';
                feedback.style.color = 'var(--color-success, #10b981)';
                feedback.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px;">📍 Fetched from Address Master: <strong>${city}, ${state}</strong> (PIN: ${cleanPin})</span>`;
              }
            }
          })
          .catch(() => {});
      }
    }
  },

  lookupAddressByCity(cityName, prefix = 'new') {
    if (!cityName || !cityName.trim()) return;
    const cleanName = cityName.trim().toLowerCase();
    const feedback = document.getElementById(`${prefix}-sup-address-feedback`);

    const res = this.getAddressFromMaster({ city: cleanName });
    if (res) {
      const stateEl = document.getElementById(`${prefix}-sup-state`);
      const pinEl = document.getElementById(`${prefix}-sup-pincode`);
      if (stateEl && res.state) {
        stateEl.value = res.state;
        stateEl.dataset.autofilled = 'true';
      }
      if (pinEl && (!pinEl.value || pinEl.dataset.autofilled === 'true') && res.pincode) {
        pinEl.value = res.pincode;
        pinEl.dataset.autofilled = 'true';
      }
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = 'var(--color-success, #10b981)';
        feedback.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px;">📍 Fetched from Address Master: City <strong>${res.city || cityName}</strong>${res.state ? ' → ' + res.state : ''}${res.pincode ? ' (PIN: ' + res.pincode + ')' : ''}</span>`;
      }
    }
  },

  openAddressMasterModal(prefix = 'new') {
    const allCities = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('cities') || []) : [];
    const allStates = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('states') || []) : [];
    const allDistricts = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('districts') || []) : [];
    const allPins = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('pincodes') || []) : [];

    const pinMap = {};
    allPins.forEach(p => {
      const c = allCities.find(x => x.id === p.city_id);
      const d = allDistricts.find(x => x.id === (p.district_id || (c ? c.district_id : '')));
      const s = allStates.find(x => x.id === (p.state_id || (d ? d.state_id : (c ? c.state_id : ''))));
      pinMap[p.pincode] = {
        pincode: p.pincode,
        area: p.area_name || '',
        city: c ? c.name : (p.area_name || ''),
        district: d ? d.name : '',
        state: s ? s.name : 'Maharashtra'
      };
    });

    if (window.BillingModule && window.BillingModule.PINCODE_DATABASE) {
      Object.entries(window.BillingModule.PINCODE_DATABASE).forEach(([pin, info]) => {
        if (!pinMap[pin]) {
          pinMap[pin] = {
            pincode: pin,
            area: info.area || '',
            city: info.city || '',
            district: info.district || '',
            state: info.state || 'Maharashtra'
          };
        }
      });
    }

    allCities.forEach(c => {
      const s = allStates.find(x => x.id === c.state_id);
      const d = allDistricts.find(x => x.id === c.district_id);
      const hasPin = Object.values(pinMap).some(item => item.city && item.city.toLowerCase() === c.name.toLowerCase());
      if (!hasPin) {
        pinMap[`CITY-${c.id}`] = {
          pincode: '',
          area: c.name,
          city: c.name,
          district: d ? d.name : '',
          state: s ? s.name : 'Maharashtra'
        };
      }
    });

    const entries = Object.values(pinMap);
    window._cachedAddressMasterEntries = entries;
    window._activeAddressMasterPrefix = prefix;

    const existingOverlay = document.getElementById('address-master-picker-overlay');
    if (existingOverlay && typeof existingOverlay.remove === 'function') {
      existingOverlay.remove();
    } else if (existingOverlay && existingOverlay.parentNode) {
      existingOverlay.parentNode.removeChild(existingOverlay);
    }

    const modalContainer = document.createElement('div');
    modalContainer.id = 'address-master-picker-overlay';
    modalContainer.style.cssText = 'position: fixed; inset: 0; background: var(--bg-modal-backdrop, rgba(2,6,23,0.72)); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(var(--modal-backdrop-blur, 6px)); -webkit-backdrop-filter: blur(var(--modal-backdrop-blur, 6px)); padding: 16px;';
    
    modalContainer.innerHTML = `
      <div style="background: var(--bg-surface, #1e293b); border: 1px solid var(--border-subtle, #334155); border-radius: var(--radius-lg, 12px); width: 100%; max-width: 780px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--border-subtle); background: rgba(255,255,255,0.02);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">📍</span>
            <div>
              <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">Address Master Location Picker</div>
              <div style="font-size: 11px; color: var(--text-muted);">Select City, State & PIN code to populate into Vendor details</div>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-ghost" onclick="document.getElementById('address-master-picker-overlay').remove()" style="font-size: 18px; line-height: 1; padding: 4px 8px; cursor: pointer;">✕</button>
        </div>

        <div style="padding: 12px 18px; border-bottom: 1px solid var(--border-subtle); background: rgba(0,0,0,0.1);">
          <input type="text" id="addr-picker-search" class="form-control" placeholder="🔍 Search by City, Area, District, State or PIN (e.g. Pune, Walhekarwadi, 411026)..." oninput="window.MastersModule.filterAddressPicker(this.value)" autofocus style="width: 100%;">
        </div>

        <div style="overflow-y: auto; flex: 1; max-height: 50vh; padding: 0 18px;">
          <table class="table" style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12.5px;">
            <thead style="position: sticky; top: 0; background: var(--bg-surface, #1e293b); border-bottom: 2px solid var(--border-subtle); z-index: 1;">
              <tr>
                <th style="padding: 8px; text-align: left;">PIN</th>
                <th style="padding: 8px; text-align: left;">City / Area</th>
                <th style="padding: 8px; text-align: left;">District</th>
                <th style="padding: 8px; text-align: left;">State</th>
                <th style="padding: 8px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="addr-picker-tbody">
              ${this.renderAddressPickerRows(entries.slice(0, 50), prefix)}
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; border-top: 1px solid var(--border-subtle); background: rgba(255,255,255,0.02);">
          <span style="font-size: 11px; color: var(--text-muted);" id="addr-picker-count">Showing top ${Math.min(50, entries.length)} of ${entries.length} locations</span>
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('address-master-picker-overlay').remove()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);
    setTimeout(() => {
      const s = document.getElementById('addr-picker-search');
      if (s) s.focus();
    }, 50);
  },

  selectAddressFromPicker(pincode, city, state, prefix = 'new') {
    const cityEl = document.getElementById(`${prefix}-sup-city`);
    const stateEl = document.getElementById(`${prefix}-sup-state`);
    const pinEl = document.getElementById(`${prefix}-sup-pincode`);
    const feedback = document.getElementById(`${prefix}-sup-address-feedback`);

    if (cityEl) {
      cityEl.value = city || '';
      cityEl.dataset.autofilled = 'true';
    }
    if (stateEl) {
      stateEl.value = state || '';
      stateEl.dataset.autofilled = 'true';
    }
    if (pinEl) {
      pinEl.value = pincode || '';
      pinEl.dataset.autofilled = 'true';
    }

    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.color = 'var(--color-success, #10b981)';
      feedback.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px;">📍 Fetched from Address Master: <strong>${city || ''}${state ? ', ' + state : ''}</strong> (PIN: ${pincode || 'N/A'})</span>`;
    }

    const overlay = document.getElementById('address-master-picker-overlay');
    if (overlay && typeof overlay.remove === 'function') {
      overlay.remove();
    } else if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    if (window.State && typeof window.State.showToast === 'function') {
      window.State.showToast(`Populated ${city || ''}${state ? ', ' + state : ''} from Address Master`, 'success');
    }
  },

  filterAddressPicker(query) {
    const q = (query || '').trim().toLowerCase();
    const entries = window._cachedAddressMasterEntries || [];
    const prefix = window._activeAddressMasterPrefix || 'new';
    const filtered = !q ? entries.slice(0, 50) : entries.filter(e => 
      (e.pincode && e.pincode.toLowerCase().includes(q)) ||
      (e.city && e.city.toLowerCase().includes(q)) ||
      (e.area && e.area.toLowerCase().includes(q)) ||
      (e.district && e.district.toLowerCase().includes(q)) ||
      (e.state && e.state.toLowerCase().includes(q))
    ).slice(0, 50);

    const tbody = document.getElementById('addr-picker-tbody');
    if (tbody) tbody.innerHTML = this.renderAddressPickerRows(filtered, prefix);
    
    const countEl = document.getElementById('addr-picker-count');
    if (countEl) countEl.textContent = `Showing ${filtered.length} locations`;
  },

  renderAddressPickerRows(list, prefix = 'new') {
    if (!list || list.length === 0) {
      return `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No locations found matching search.</td></tr>`;
    }
    return list.map(item => `
      <tr style="border-bottom: 1px solid var(--border-subtle);">
        <td style="padding: 7px 8px; font-family: var(--font-mono); font-weight: 600; color: var(--primary-300);">${item.pincode || '<span style="color:var(--text-muted);font-weight:normal;">—</span>'}</td>
        <td style="padding: 7px 8px; font-weight: 600;">
          ${item.city}
          ${item.area && item.area !== item.city ? `<span style="font-size: 11px; color: var(--text-muted); display: block;">${item.area}</span>` : ''}
        </td>
        <td style="padding: 7px 8px; color: var(--text-muted);">${item.district || '—'}</td>
        <td style="padding: 7px 8px;">${item.state || '—'}</td>
        <td style="padding: 7px 8px; text-align: right;">
          <button type="button" class="btn btn-sm btn-primary" onclick="window.MastersModule.selectAddressFromPicker('${item.pincode || ''}', '${item.city.replace(/'/g, "\\'")}', '${(item.state || '').replace(/'/g, "\\'")}', '${prefix}')" style="padding: 2px 10px; font-size: 11px; cursor: pointer;">
            Select
          </button>
        </td>
      </tr>
    `).join('');
  },

  deleteSupplier(id) {
    const suppliers = window.DB.getAll('suppliers') || [];
    const s = suppliers.find(sup => sup.id === id || sup.code === id);
    if (!s) {
      window.State.showToast('Supplier not found to delete.', 'warning');
      return;
    }

    const allPos = (typeof window.DB.getAll === 'function') ? (window.DB.getAll('purchaseOrders') || []) : [];
    const activePos = allPos.filter(po => (po.supplier_id === s.id || po.supplier_code === s.code) && po.status !== 'CANCELLED');
    if (activePos.length > 0) {
      if (!confirm(`Warning: Vendor "${s.name}" (${s.code}) is referenced in ${activePos.length} Purchase Order(s).\n\nDeleting this vendor may cause historical PO references to show unlinked data.\n\nAre you sure you want to proceed with deleting this vendor?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete vendor "${s.name}" (${s.code})?\n\nThis action cannot be undone.`)) {
        return;
      }
    }

    const deleted = window.DB.delete('suppliers', s.id || s.code);
    if (deleted) {
      window.DB.logAudit('DELETE_SUPPLIER', 'MASTERS', s.code, `Deleted vendor ${s.name} (${s.code}).`);
      window.State.closeModal();
      window.State.showToast(`Vendor "${s.name}" deleted successfully.`, 'success');
      this.refreshSupplierMasterView();
    } else {
      if (window.DB.data && Array.isArray(window.DB.data.suppliers)) {
        window.DB.data.suppliers = window.DB.data.suppliers.filter(x => x.id !== s.id && x.code !== s.code);
        window.DB.saveData();
        window.DB.emitChange('suppliers');
        window.DB.logAudit('DELETE_SUPPLIER', 'MASTERS', s.code, `Deleted vendor ${s.name} (${s.code}).`);
        window.State.closeModal();
        window.State.showToast(`Vendor "${s.name}" deleted successfully.`, 'success');
        this.refreshSupplierMasterView();
      } else {
        window.State.showToast('Failed to delete vendor.', 'danger');
      }
    }
  },

  viewSupplierDetails(id) {
    const suppliers = window.DB.getAll('suppliers') || [];
    const s = suppliers.find(sup => sup.id === id || sup.code === id);
    if (!s) {
      window.State.showToast('Supplier details not found.', 'warning');
      return;
    }

    window.State.showModal({
      title: `🏢 Supplier Profile: ${s.name} (${s.code})`,
      maxWidth: '780px',
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
            <div>
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Company Name</div>
              <div style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${s.name}</div>
              <div class="cell-mono font-bold" style="font-size: 12px; color: var(--primary-300);">${s.code}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Category & Status</div>
              <div style="margin-top: 4px; display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-subtle">${s.category || 'GENERAL'}</span>
                <span style="color: var(--color-warning); font-weight: 700;">⭐ ${s.rating || 4.5}</span>
                <span class="status-pill status-approved">${s.status || 'APPROVED'}</span>
              </div>
              ${s.tax_id || s.gstin ? `<div class="cell-mono" style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">GSTIN: ${s.tax_id || s.gstin}</div>` : ''}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
            <div>
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Primary Contact Person</div>
              <div style="font-size: 13.5px; font-weight: 700; margin-top: 2px;">${s.contact || s.contact_person || '—'}</div>
              <div class="cell-mono" style="font-size: 12px; color: var(--primary-300); margin-top: 3px;">📞 ${s.phone || s.contact_number || '—'}</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">✉️ ${s.email || '—'}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Company Address</div>
              <div style="font-size: 12.5px; line-height: 1.45; margin-top: 2px;">${s.address || s.company_address || s.city || '—'}</div>
              <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">${s.city || ''} ${s.state ? ', ' + s.state : ''} ${s.pincode ? '- ' + s.pincode : ''}</div>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Commercial Terms & Payment Conditions</div>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px;">
              <div>
                <span style="font-size: 11px; color: var(--text-muted);">Payment Terms:</span>
                <div class="cell-mono cell-strong" style="font-size: 14px; margin-top: 2px;">${s.payment_terms || s.payment_terms_days || 0} Days</div>
              </div>
              <div>
                <span style="font-size: 11px; color: var(--text-muted);">Payment Conditions:</span>
                <div style="font-weight: 600; color: #34d399; margin-top: 2px;">${s.payment_conditions || 'Standard Net Terms'}</div>
              </div>
            </div>
            ${s.bank_details ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 10px;"><strong>Bank:</strong> ${s.bank_details}</div>` : ''}
            ${s.remarks ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;"><strong>Remarks:</strong> ${s.remarks}</div>` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <button type="button" class="btn btn-ghost" onclick="window.MastersModule.deleteSupplier('${s.id || s.code}')" style="color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.25); padding: 5px 12px; font-size: 11.5px;">
              <span>Delete Vendor</span>
            </button>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()" style="padding: 5px 14px; font-size: 11.5px;">Close</button>
              <button type="button" class="btn btn-primary" onclick="window.MastersModule.showEditSupplierModal('${s.id || s.code}')" style="padding: 5px 16px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                <span>✏️ Edit Vendor</span>
              </button>
            </div>
          </div>
        </div>
      `
    });
  }
};
