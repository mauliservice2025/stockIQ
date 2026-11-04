/* ==========================================================================
   ENTERPRISE ISCM - STAGE 2: PURCHASE REQUISITIONS (PR)
   Multi-Line Demand Requisitions, Approval Workflows & PO Conversion
   ========================================================================== */

window.RequisitionsModule = {
  search: '',
  statusFilter: 'ALL',

  render(container) {
    if (container) this.container = container;
    const target = this.container || document.getElementById('view-container') || document.getElementById('main-content');
    if (!target) return;

    const plantId = window.State.currentPlantId;
    const allPrs = window.DB.getAll('requisitions').filter(p => {
      if (!window.DB.isPlantActive(p.plant_id)) return false;
      return plantId === 'ALL' || p.plant_id === plantId;
    });
    const items = window.DB.getAll('items');

    const searchLower = (this.search || '').toLowerCase().trim();
    const filtered = allPrs.filter(pr => {
      if (this.statusFilter !== 'ALL' && pr.status !== this.statusFilter) return false;
      if (searchLower) {
        const dept = window.DB.getById('departments', pr.department_id);
        const corpus = `${pr.pr_number || ''} ${pr.requested_by || ''} ${dept?.name || ''} ${pr.priority || ''}`.toLowerCase();
        if (!corpus.includes(searchLower)) return false;
      }
      return true;
    });

    const paged = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'requisitions')
      : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    target.innerHTML = `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Purchase Requisitions (PR) Register
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.RequisitionsModule.showCreateModal()">
            + Create New Requisition
          </button>
        </div>

        <div class="toolbar">
          <div class="toolbar-left">
            <input type="text" id="pr-search" class="filter-input" placeholder="Search PR number, requester..." value="${this.search || ''}" oninput="window.RequisitionsModule.onSearchInput(this.value)" onkeydown="if(event.key==='Enter') window.RequisitionsModule.filterTable()">
            <select id="pr-status-filter" class="filter-select" onchange="window.RequisitionsModule.onStatusFilterChange(this.value)">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
              <option value="PENDING_APPROVAL" ${this.statusFilter === 'PENDING_APPROVAL' ? 'selected' : ''}>Pending Approval</option>
              <option value="APPROVED" ${this.statusFilter === 'APPROVED' ? 'selected' : ''}>Approved</option>
              <option value="REJECTED" ${this.statusFilter === 'REJECTED' ? 'selected' : ''}>Rejected</option>
              <option value="PO_CREATED" ${this.statusFilter === 'PO_CREATED' ? 'selected' : ''}>PO Created</option>
            </select>
          </div>
          <div class="toolbar-right">
            <span style="font-size:12px; color:var(--text-muted);">Total Requisitions: <b>${filtered.length}</b></span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="pr-table">
            <thead>
              <tr>
                <th>PR Number</th>
                <th>Requested By</th>
                <th>Department</th>
                <th>Required Date</th>
                <th>Priority</th>
                <th class="text-right">Line Items</th>
                <th class="text-right">Est. Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${paged.items.length === 0 ? `
                <tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No requisitions found.</td></tr>
              ` : paged.items.map(pr => {
                const totalEst = (pr.items || []).reduce((acc, i) => acc + ((i.qty || 0) * (i.est_rate || 0)), 0);
                const dept = window.DB.getById('departments', pr.department_id);
                return `
                  <tr data-status="${pr.status}">
                    <td class="cell-mono cell-strong">
                      <a href="javascript:void(0)" onclick="window.RequisitionsModule.viewPR('${pr.id}')" style="color:var(--primary-300); text-decoration:none;">
                        ${pr.pr_number}
                      </a>
                    </td>
                    <td class="cell-strong">${pr.requested_by}</td>
                    <td>${dept ? dept.name : 'Manufacturing'}</td>
                    <td>${window.formatDate(pr.required_date)}</td>
                    <td>
                      <span class="status-pill ${pr.priority === 'URGENT' ? 'status-rejected' : pr.priority === 'HIGH' ? 'status-pending' : 'status-draft'}">
                        ${pr.priority}
                      </span>
                    </td>
                    <td class="cell-num">${pr.items ? pr.items.length : 0}</td>
                    <td class="cell-num">₹${totalEst.toLocaleString('en-IN')}</td>
                    <td>
                      <span class="status-pill ${
                        pr.status === 'APPROVED' ? 'status-approved' :
                        pr.status === 'PENDING_APPROVAL' ? 'status-pending' :
                        pr.status === 'PO_CREATED' ? 'status-in-transit' : 'status-rejected'
                      }">
                        ${pr.status}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.RequisitionsModule.viewPR('${pr.id}')">
                          View
                        </button>
                        ${pr.status === 'PENDING_APPROVAL' ? `
                          <button class="btn btn-primary btn-sm" onclick="window.RequisitionsModule.approvePR('${pr.id}')">
                            Approve
                          </button>
                        ` : ''}
                        ${pr.status === 'APPROVED' ? `
                          <button class="btn btn-success btn-sm" onclick="window.PurchaseOrdersModule.createPOFromPR('${pr.id}')">
                            Convert to PO →
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
          key: 'requisitions',
          pagination: paged,
          onPageChange: 'window.RequisitionsModule.setPage',
          onPageSizeChange: 'window.RequisitionsModule.setPageSize'
        }) : ''}
      </div>
    `;
  },

  onSearchInput(val) {
    this.search = val;
  },

  onStatusFilterChange(val) {
    this.statusFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('requisitions');
    this.render();
  },

  setPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('requisitions', page);
    this.render();
  },

  setPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('requisitions', size);
    this.render();
  },

  filterTable() {
    this.search = document.getElementById('pr-search')?.value || '';
    this.statusFilter = document.getElementById('pr-status-filter')?.value || 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('requisitions');
    this.render();
  },

  viewPR(prId) {
    const pr = window.DB.getById('requisitions', prId);
    if (!pr) return;

    const dept = window.DB.getById('departments', pr.department_id);

    window.State.showModal({
      title: `Purchase Requisition: ${pr.pr_number}`,
      contentHtml: `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; background:var(--bg-surface); padding:16px; border-radius:var(--radius-md);">
            <div><span style="font-size:11px; color:var(--text-muted);">Requester:</span><br><b>${pr.requested_by}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Department:</span><br><b>${dept?.name || 'Operations'}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Required Date:</span><br><b>${window.formatDate(pr.required_date)}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Priority:</span><br><b>${pr.priority}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Status:</span><br><b>${pr.status}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Approved By:</span><br><b>${pr.approved_by || 'Pending'}</b></div>
          </div>

          <div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Business Justification:</div>
            <div style="background:var(--bg-input); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); color:var(--text-primary);">
              ${pr.justification || 'Standard production requirement.'}
            </div>
          </div>

          <div>
            <div style="font-size:13px; font-weight:700; margin-bottom:8px; color:var(--text-primary);">Requested Line Items</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Est. Rate</th>
                  <th class="text-right">Est. Total</th>
                </tr>
              </thead>
              <tbody>
                ${(pr.items || []).map(i => {
                  const item = window.DB.getById('items', i.item_id);
                  const lineTotal = (i.qty || 0) * (i.est_rate || 0);
                  return `
                    <tr>
                      <td class="cell-mono">${item?.code || i.item_id}</td>
                      <td class="cell-strong">${item?.name || 'Raw Material'}</td>
                      <td class="cell-num">${i.qty} ${i.uom}</td>
                      <td class="cell-num">₹${Number(i.est_rate).toLocaleString('en-IN')}</td>
                      <td class="cell-num">₹${lineTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
        ${pr.status === 'PENDING_APPROVAL' ? `
          <button class="btn btn-danger" onclick="window.RequisitionsModule.rejectPR('${pr.id}')">Reject</button>
          <button class="btn btn-primary" onclick="window.RequisitionsModule.approvePR('${pr.id}')">Approve Requisition</button>
        ` : ''}
        ${pr.status === 'APPROVED' ? `
          <button class="btn btn-success" onclick="window.State.closeModal(); window.PurchaseOrdersModule.createPOFromPR('${pr.id}')">
            Convert to Purchase Order →
          </button>
        ` : ''}
      `
    });
  },

  approvePR(prId) {
    const pr = window.DB.getById('requisitions', prId);
    if (!pr) return;

    window.DB.update('requisitions', prId, {
      status: 'APPROVED',
      approved_by: `${window.State.currentUser.name} (${window.State.currentUser.role})`,
      approved_at: new Date().toISOString()
    });

    window.DB.logAudit('APPROVE_PR', 'PROCUREMENT', pr.pr_number, `Requisition ${pr.pr_number} approved for procurement.`);
    window.State.closeModal();
    window.State.showToast(`Requisition ${pr.pr_number} approved! Ready for PO issuance.`);
    window.RequisitionsModule.render(document.getElementById('view-container'));
  },

  rejectPR(prId) {
    const pr = window.DB.getById('requisitions', prId);
    if (!pr) return;

    window.DB.update('requisitions', prId, {
      status: 'REJECTED',
      approved_by: `${window.State.currentUser.name} (Rejected)`,
      approved_at: new Date().toISOString()
    });

    window.DB.logAudit('REJECT_PR', 'PROCUREMENT', pr.pr_number, `Requisition ${pr.pr_number} rejected.`);
    window.State.closeModal();
    window.State.showToast(`Requisition ${pr.pr_number} was rejected.`, 'error');
    window.RequisitionsModule.render(document.getElementById('view-container'));
  },

  showCreateModal() {
    const activePlants = window.DB.getActivePlants();
    const defaultPlantId = (window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId))
      ? window.State.currentPlantId
      : (activePlants[0]?.id || 'PLANT-01');
    const items = window.DB.getItemsForFacility(defaultPlantId).filter(i => i.item_type !== 'FINISHED_GOODS');
    const depts = window.DB.getAll('departments').filter(d => !d.plant_id || window.DB.isPlantActive(d.plant_id));

    window.State.showModal({
      title: '➕ Create Purchase Requisition',
      maxWidth: '850px',
      contentHtml: `
        <form id="create-pr-form" onsubmit="window.RequisitionsModule.submitNewPR(event)">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Facility <span class="required">*</span></label>
              <select id="new-pr-plant" class="filter-select" style="width:100%;" onchange="window.RequisitionsModule.onPlantChange(this.value)" required>
                ${activePlants.map(p => `<option value="${p.id}" ${p.id === defaultPlantId ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Department <span class="required">*</span></label>
              <select id="new-pr-dept" class="filter-select" style="width:100%;" required>
                ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Required Date <span class="required">*</span></label>
              <input type="date" id="new-pr-date" class="form-control" value="${new Date(Date.now() + 10*86400000).toISOString().split('T')[0]}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Priority</label>
              <select id="new-pr-priority" class="filter-select" style="width:100%;">
                <option value="MEDIUM">Medium Normal</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Critical</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Business Justification <span class="required">*</span></label>
              <textarea id="new-pr-justification" class="form-control" required placeholder="State manufacturing reason, production order link, or department replenishment demand..."></textarea>
            </div>
          </div>

          <div style="margin-top:16px; border-top:1px solid var(--border-subtle); padding-top:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span style="font-weight:700; color:var(--text-primary);">Line Items</span>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.RequisitionsModule.addNewLineRow()">
                + Add Another Material Line
              </button>
            </div>

            <div id="pr-lines-container" style="display:flex; flex-direction:column; gap:10px;">
              <div class="pr-line-row" style="display:grid; grid-template-columns: 3fr 1.5fr 1.5fr 40px; gap:10px; align-items:center;">
                <div>
                  <label class="form-label" style="font-size:10px;">Material Item</label>
                  <select class="filter-select pr-item-select" style="width:100%;" onchange="window.RequisitionsModule.updateLineRate(this)" required>
                    ${items.map(i => `<option value="${i.id}" data-rate="${i.last_purchase_price || i.standard_cost}" data-uom="${i.base_uom}">${i.code} - ${i.name}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size:10px;">Quantity</label>
                  <input type="number" class="form-control pr-qty-input" value="100" min="1" required>
                </div>
                <div>
                  <label class="form-label" style="font-size:10px;">Est. Rate (₹)</label>
                  <input type="number" class="form-control pr-rate-input" value="${items[0]?.last_purchase_price || 150}" required>
                </div>
                <div style="padding-top:18px;">
                  <button type="button" class="btn btn-danger btn-sm" style="padding:0 8px;" onclick="this.closest('.pr-line-row').remove()">✕</button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="padding-right:0; padding-bottom:0; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Purchase Requisition</button>
          </div>
        </form>
      `
    });
  },

  onPlantChange(plantId) {
    const items = window.DB.getItemsForFacility(plantId).filter(i => i.item_type !== 'FINISHED_GOODS');
    const selects = document.querySelectorAll('.pr-item-select');
    selects.forEach(select => {
      select.innerHTML = items.length === 0
        ? '<option value="">No items mapped to this facility</option>'
        : items.map(i => `<option value="${i.id}" data-rate="${i.last_purchase_price || i.standard_cost}" data-uom="${i.base_uom}">${i.code} - ${i.name}</option>`).join('');
      if (typeof window.RequisitionsModule.updateLineRate === 'function') {
        window.RequisitionsModule.updateLineRate(select);
      }
    });
  },

  addNewLineRow() {
    const plantEl = document.getElementById('new-pr-plant');
    const plantId = plantEl ? plantEl.value : window.State.currentPlantId;
    const items = window.DB.getItemsForFacility(plantId).filter(i => i.item_type !== 'FINISHED_GOODS');
    const container = document.getElementById('pr-lines-container');
    const row = document.createElement('div');
    row.className = 'pr-line-row';
    row.style.cssText = 'display:grid; grid-template-columns: 3fr 1.5fr 1.5fr 40px; gap:10px; align-items:center;';
    row.innerHTML = `
      <div>
        <select class="filter-select pr-item-select" style="width:100%;" onchange="window.RequisitionsModule.updateLineRate(this)" required>
          ${items.map(i => `<option value="${i.id}" data-rate="${i.last_purchase_price || i.standard_cost}" data-uom="${i.base_uom}">${i.code} - ${i.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <input type="number" class="form-control pr-qty-input" value="100" min="1" required>
      </div>
      <div>
        <input type="number" class="form-control pr-rate-input" value="${items[0]?.last_purchase_price || 150}" required>
      </div>
      <div>
        <button type="button" class="btn btn-danger btn-sm" style="padding:0 8px;" onclick="this.closest('.pr-line-row').remove()">✕</button>
      </div>
    `;
    container.appendChild(row);
  },

  updateLineRate(selectEl) {
    const opt = selectEl.options[selectEl.selectedIndex];
    const rate = opt.getAttribute('data-rate');
    const row = selectEl.closest('.pr-line-row');
    const rateInput = row.querySelector('.pr-rate-input');
    if (rateInput && rate) {
      rateInput.value = rate;
    }
  },

  submitNewPR(e) {
    e.preventDefault();
    const deptId = document.getElementById('new-pr-dept').value;
    const reqDate = document.getElementById('new-pr-date').value;
    const priority = document.getElementById('new-pr-priority').value;
    const just = document.getElementById('new-pr-justification').value;

    const lineRows = document.querySelectorAll('.pr-line-row');
    const items = [];
    lineRows.forEach(row => {
      const select = row.querySelector('.pr-item-select');
      const qtyInput = row.querySelector('.pr-qty-input');
      const rateInput = row.querySelector('.pr-rate-input');

      const itemObj = window.DB.getById('items', select.value);
      items.push({
        item_id: select.value,
        qty: Number(qtyInput.value),
        uom: itemObj ? itemObj.base_uom : 'NOS',
        est_rate: Number(rateInput.value)
      });
    });

    if (items.length === 0) {
      window.State.showToast('Please add at least one material line item!', 'error');
      return;
    }

    const prNumber = `PR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const plantId = document.getElementById('new-pr-plant')?.value || (window.DB.isPlantActive(window.State.currentPlantId) ? window.State.currentPlantId : window.DB.getActivePlants()[0]?.id);

    window.DB.insert('requisitions', {
      pr_number: prNumber,
      plant_id: plantId,
      department_id: deptId,
      requested_by: window.State.currentUser.name,
      required_date: reqDate,
      priority: priority,
      status: 'PENDING_APPROVAL',
      justification: just,
      items: items
    });

    window.DB.logAudit('CREATE_PR', 'PROCUREMENT', prNumber, `Created PR ${prNumber} with ${items.length} lines.`);
    window.State.closeModal();
    window.State.showToast(`Purchase Requisition ${prNumber} submitted!`);
    window.RequisitionsModule.render(document.getElementById('view-container'));
  }
};
