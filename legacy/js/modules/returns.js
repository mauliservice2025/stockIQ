/* ==========================================================================
   ENTERPRISE ISCM - STAGE 13: REVERSE LOGISTICS & RETURNS
   Purchase Returns to Vendor, Production Floor Returns & Customer RMA
   ========================================================================== */

window.ReturnsModule = {
  search: '',
  typeFilter: 'ALL',

  render(container) {
    if (container) this.container = container;
    const target = this.container || document.getElementById('view-container') || document.getElementById('main-content');
    if (!target) return;

    const plantId = window.State.currentPlantId;
    const allReturns = window.DB.getAll('returnsLog').filter(r => {
      const pId = r.plant_id || r.plantId;
      if (pId && !window.DB.isPlantActive(pId)) return false;
      return plantId === 'ALL' || !pId || pId === plantId;
    });

    const searchLower = (this.search || '').toLowerCase().trim();
    const filtered = allReturns.filter(r => {
      if (this.typeFilter !== 'ALL' && r.return_type !== this.typeFilter) return false;
      if (searchLower) {
        const item = window.DB.getById('items', r.item_id);
        const corpus = `${r.return_number || ''} ${item?.code || ''} ${item?.name || ''} ${r.batch_number || ''} ${r.entity_name || ''} ${r.reason || ''}`.toLowerCase();
        if (!corpus.includes(searchLower)) return false;
      }
      return true;
    });

    const paged = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'returns')
      : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    target.innerHTML = `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            Reverse Logistics & Returns Management
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.ReturnsModule.showCreateModal()">
            + Log New Return
          </button>
        </div>

        <div class="toolbar">
          <div class="toolbar-left">
            <input type="text" id="ret-search" class="filter-input" placeholder="Search return #, batch, reason..." value="${this.search || ''}" oninput="window.ReturnsModule.onSearchInput(this.value)" onkeydown="if(event.key==='Enter') window.ReturnsModule.filterTable()">
            <select id="ret-type-filter" class="filter-select" onchange="window.ReturnsModule.onTypeFilterChange(this.value)">
              <option value="ALL" ${this.typeFilter === 'ALL' ? 'selected' : ''}>All Return Types</option>
              <option value="PURCHASE_RETURN_VENDOR" ${this.typeFilter === 'PURCHASE_RETURN_VENDOR' ? 'selected' : ''}>Vendor Purchase Returns</option>
              <option value="PRODUCTION_RETURN_FLOOR" ${this.typeFilter === 'PRODUCTION_RETURN_FLOOR' ? 'selected' : ''}>Production Floor Returns</option>
              <option value="CUSTOMER_RETURN_RMA" ${this.typeFilter === 'CUSTOMER_RETURN_RMA' ? 'selected' : ''}>Customer RMA Returns</option>
            </select>
          </div>
          <div class="toolbar-right">
            <span style="font-size:12px; color:var(--text-muted);">Returns: <b>${filtered.length}</b></span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="ret-table">
            <thead>
              <tr>
                <th>Return #</th>
                <th>Type</th>
                <th>Party / Origin</th>
                <th>Material SKU</th>
                <th>Batch / Lot</th>
                <th class="text-right">Quantity</th>
                <th>Disposition</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${paged.items.length === 0 ? `
                <tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No return records found.</td></tr>
              ` : paged.items.map(r => {
                const item = window.DB.getById('items', r.item_id);
                return `
                  <tr data-type="${r.return_type}">
                    <td class="cell-mono cell-strong">${r.return_number}</td>
                    <td>
                      <span class="status-pill ${
                        r.return_type === 'PURCHASE_RETURN_VENDOR' ? 'status-rejected' :
                        r.return_type === 'CUSTOMER_RETURN_RMA' ? 'status-quarantine' : 'status-draft'
                      }">
                        ${r.return_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td class="cell-strong">${r.entity_name}</td>
                    <td>
                      <span class="cell-mono">${item ? item.code : r.item_id}</span><br>
                      <span style="font-size:11px; color:var(--text-secondary);">${item ? item.name : ''}</span>
                    </td>
                    <td class="cell-mono">${r.batch_number || 'N/A'}</td>
                    <td class="cell-num">${r.quantity || r.qty} ${r.uom}</td>
                    <td><b>${r.action_disposition || r.disposition}</b></td>
                    <td style="max-width:240px; color:var(--text-secondary); font-size:12px;">${r.reason_code || r.reason}</td>
                    <td><span class="status-pill status-approved">${r.approval_status || r.status || 'APPROVED'}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          key: 'returns',
          pagination: paged,
          onPageChange: 'window.ReturnsModule.setPage',
          onPageSizeChange: 'window.ReturnsModule.setPageSize'
        }) : ''}
      </div>
    `;
  },

  onSearchInput(val) {
    this.search = val;
  },

  onTypeFilterChange(val) {
    this.typeFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('returns');
    this.render();
  },

  setPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('returns', page);
    this.render();
  },

  setPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('returns', size);
    this.render();
  },

  filterTable() {
    this.search = document.getElementById('ret-search')?.value || '';
    this.typeFilter = document.getElementById('ret-type-filter')?.value || 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('returns');
    this.render();
  },

  showCreateModal() {
    const items = window.DB.getAll('items');
    const activePlants = window.DB.getActivePlants();
    const defaultPlantId = (window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId))
      ? window.State.currentPlantId
      : (activePlants[0]?.id || 'PLANT-01');

    window.State.showModal({
      title: '↩️ Log Return & Reverse Logistics Movement',
      maxWidth: '700px',
      contentHtml: `
        <form id="create-return-form" onsubmit="window.ReturnsModule.submitReturn(event)">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Facility <span class="required">*</span></label>
              <select id="new-ret-plant" class="filter-select" style="width:100%;" required>
                ${activePlants.map(p => `<option value="${p.id}" ${p.id === defaultPlantId ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Return Type <span class="required">*</span></label>
              <select id="new-ret-type" class="filter-select" style="width:100%;" required>
                <option value="PURCHASE_RETURN_VENDOR">Purchase Return to Supplier (Debit Note)</option>
                <option value="CUSTOMER_RETURN_RMA">Customer Return (RMA / Warranty Claim)</option>
                <option value="PRODUCTION_RETURN_FLOOR">Production Floor Unused Material Return</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Associated Entity / Party <span class="required">*</span></label>
              <input type="text" id="new-ret-party" class="form-control" placeholder="e.g. SKF Bearings or Mahindra" value="Tata Special Steels Ltd." required>
            </div>

            <div class="form-group">
              <label class="form-label">Material SKU <span class="required">*</span></label>
              <select id="new-ret-item" class="filter-select" style="width:100%;" required>
                ${items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Batch / Lot #</label>
              <input type="text" id="new-ret-batch" class="form-control cell-mono" value="LOT-STL-2601-A" required>
            </div>

            <div class="form-group">
              <label class="form-label">Return Quantity <span class="required">*</span></label>
              <input type="number" id="new-ret-qty" class="form-control" value="25" min="1" required>
            </div>

            <div class="form-group">
              <label class="form-label">Action Disposition <span class="required">*</span></label>
              <select id="new-ret-disposition" class="filter-select" style="width:100%;">
                <option value="VENDOR_REPLACEMENT">Vendor Replacement</option>
                <option value="CREDIT_NOTE">Supplier Debit / Credit Note</option>
                <option value="RE_STOCK">Restock to Usable Inventory</option>
                <option value="QUARANTINE">Quarantine for Metallurgical Review</option>
                <option value="SCRAP">Scrap & Write-Off</option>
              </select>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Reason for Return <span class="required">*</span></label>
              <textarea id="new-ret-reason" class="form-control" required>Material outer diameter exceeds upper specification limit; returned for replacement.</textarea>
            </div>
          </div>

          <div class="modal-footer" style="padding-right:0; padding-bottom:0; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Return & Log Reverse Transaction</button>
          </div>
        </form>
      `
    });
  },

  submitReturn(e) {
    e.preventDefault();
    const type = document.getElementById('new-ret-type').value;
    const party = document.getElementById('new-ret-party').value;
    const itemId = document.getElementById('new-ret-item').value;
    const batch = document.getElementById('new-ret-batch').value;
    const qty = Number(document.getElementById('new-ret-qty').value);
    const disp = document.getElementById('new-ret-disposition').value;
    const reason = document.getElementById('new-ret-reason').value;
    const itemObj = window.DB.getById('items', itemId);

    const retNumber = `RET-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const plantId = document.getElementById('new-ret-plant')?.value || (window.DB.isPlantActive(window.State.currentPlantId) ? window.State.currentPlantId : window.DB.getActivePlants()[0]?.id);

    window.DB.insert('returnsLog', {
      return_number: retNumber,
      return_type: type,
      ref_doc_no: `DOC-REF-${Math.floor(1000 + Math.random() * 9000)}`,
      plant_id: plantId,
      entity_name: party,
      item_id: itemId,
      batch_number: batch,
      quantity: qty,
      uom: itemObj?.base_uom || 'NOS',
      reason_code: reason,
      action_disposition: disp,
      status: 'APPROVED',
      logged_by: window.State.currentUser.name
    });

    // If returning to vendor, deduct from stock
    if (type === 'PURCHASE_RETURN_VENDOR') {
      try {
        window.DB.deductStock({
          plantId: plantId,
          warehouseId: 'WH-PUN-WARR',
          itemId: itemId,
          batchNumber: batch,
          qty: qty,
          reason: `Vendor Return ${retNumber}`
        });
      } catch (err) {
        console.warn('Stock deduction note:', err.message);
      }
    }

    window.DB.logAudit('CREATE_RETURN', 'REVERSE_LOGISTICS', retNumber, `Created return ${retNumber} for ${party} (${qty} units ${itemObj?.code}).`);
    window.State.closeModal();
    window.State.showToast(`Return ${retNumber} logged and processed!`);
    window.ReturnsModule.render(document.getElementById('view-container'));
  }
};
