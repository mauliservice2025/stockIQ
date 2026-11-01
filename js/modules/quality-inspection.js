/* ==========================================================================
   ENTERPRISE ISCM - STAGE 5: QUALITY INSPECTION (QA / QC)
   Sampling, Specification Tolerances, Defect Logging & Stock Release/Quarantine
   ========================================================================== */

window.QualityInspectionModule = {
  search: '',
  statusFilter: 'ALL',

  render(container) {
    if (container) this.container = container;
    const target = this.container || document.getElementById('view-container') || document.getElementById('main-content');
    if (!target) return;

    const plantId = window.State.currentPlantId;
    const allQas = window.DB.getAll('qualityInspections').filter(q => {
      let pId = q.plant_id || q.plantId;
      if (!pId && q.ref_doc_type === 'GRN' && q.ref_doc_no) {
        const grn = window.DB.getAll('goodsReceipts').find(g => g.grn_number === q.ref_doc_no);
        if (grn) pId = grn.plant_id;
      }
      if (pId && !window.DB.isPlantActive(pId)) return false;
      return plantId === 'ALL' || pId === plantId;
    });

    const searchLower = (this.search || '').toLowerCase().trim();
    const filtered = allQas.filter(q => {
      if (this.statusFilter !== 'ALL' && q.status !== this.statusFilter) return false;
      if (searchLower) {
        const item = window.DB.getById('items', q.item_id);
        const corpus = `${q.inspection_number || ''} ${item?.code || ''} ${item?.name || ''} ${q.batch_number || ''} ${q.ref_doc_no || ''}`.toLowerCase();
        if (!corpus.includes(searchLower)) return false;
      }
      return true;
    });

    const paged = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'quality-inspection')
      : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    target.innerHTML = `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Quality Assurance & Material Inspection (QA/QC)
          </div>
          <span class="status-pill status-in-transit">ISO 9001 / IATF 16949 Standards</span>
        </div>

        <div class="toolbar">
          <div class="toolbar-left">
            <input type="text" id="qa-search" class="filter-input" placeholder="Search QA #, Batch #, Item..." value="${this.search || ''}" oninput="window.QualityInspectionModule.onSearchInput(this.value)" onkeydown="if(event.key==='Enter') window.QualityInspectionModule.filterTable()">
            <select id="qa-status-filter" class="filter-select" onchange="window.QualityInspectionModule.onStatusFilterChange(this.value)">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Inspection Statuses</option>
              <option value="PENDING" ${this.statusFilter === 'PENDING' ? 'selected' : ''}>Pending Tests</option>
              <option value="ACCEPTED" ${this.statusFilter === 'ACCEPTED' ? 'selected' : ''}>Accepted / Released</option>
              <option value="REJECTED" ${this.statusFilter === 'REJECTED' ? 'selected' : ''}>Rejected / Quarantined</option>
              <option value="QUARANTINE" ${this.statusFilter === 'QUARANTINE' ? 'selected' : ''}>On Hold / MRB Review</option>
            </select>
          </div>
          <div class="toolbar-right">
            <span style="font-size:12px; color:var(--text-muted);">Inspection Lots: <b>${filtered.length}</b></span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="qa-table">
            <thead>
              <tr>
                <th>Inspection #</th>
                <th>Type</th>
                <th>Item Code & Name</th>
                <th>Batch / Heat #</th>
                <th class="text-right">Lot Qty</th>
                <th class="text-right">Sample Size</th>
                <th>Reference Doc</th>
                <th>Quality Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${paged.items.length === 0 ? `
                <tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No QA records found.</td></tr>
              ` : paged.items.map(q => {
                const item = window.DB.getById('items', q.item_id);
                return `
                  <tr data-status="${q.status}">
                    <td class="cell-mono cell-strong">
                      <a href="javascript:void(0)" onclick="window.QualityInspectionModule.viewQA('${q.id}')" style="color:var(--primary-300); text-decoration:none;">
                        ${q.inspection_number}
                      </a>
                    </td>
                    <td><span class="status-pill status-draft">${q.inspection_type}</span></td>
                    <td class="cell-strong">
                      <span class="cell-mono">${item ? item.code : q.item_id}</span><br>
                      <span style="font-size:11px; color:var(--text-secondary);">${item ? item.name : ''}</span>
                    </td>
                    <td class="cell-mono">${q.batch_number}</td>
                    <td class="cell-num">${q.lot_qty} ${item ? item.base_uom : 'Units'}</td>
                    <td class="cell-num" style="color:var(--primary-300);">${q.sample_size}</td>
                    <td class="cell-mono">${q.ref_doc_no}</td>
                    <td>
                      <span class="status-pill ${
                        q.status === 'ACCEPTED' ? 'status-approved' :
                        q.status === 'REJECTED' ? 'status-rejected' :
                        q.status === 'QUARANTINE' ? 'status-quarantine' : 'status-pending'
                      }">
                        ${q.status}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.QualityInspectionModule.viewQA('${q.id}')">
                          ${q.status === 'PENDING' ? 'Perform Test →' : 'View Report'}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          key: 'quality-inspection',
          pagination: paged,
          onPageChange: 'window.QualityInspectionModule.setPage',
          onPageSizeChange: 'window.QualityInspectionModule.setPageSize'
        }) : ''}
      </div>
    `;
  },

  onSearchInput(val) {
    this.search = val;
  },

  onStatusFilterChange(val) {
    this.statusFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('quality-inspection');
    this.render();
  },

  setPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('quality-inspection', page);
    this.render();
  },

  setPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('quality-inspection', size);
    this.render();
  },

  filterTable() {
    this.search = document.getElementById('qa-search')?.value || '';
    this.statusFilter = document.getElementById('qa-status-filter')?.value || 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('quality-inspection');
    this.render();
  },

  viewQA(qaId) {
    const qa = window.DB.getById('qualityInspections', qaId);
    if (!qa) return;
    const item = window.DB.getById('items', qa.item_id);

    const isPending = qa.status === 'PENDING';

    window.State.showModal({
      title: `Quality Inspection Protocol: ${qa.inspection_number}`,
      maxWidth: '850px',
      contentHtml: `
        <div style="display:flex; flex-direction:column; gap:18px;">
          <!-- Metadata Cards -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; background:var(--bg-surface); padding:16px; border-radius:var(--radius-md);">
            <div><span style="font-size:11px; color:var(--text-muted);">Inspection Type:</span><br><b>${qa.inspection_type}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Material:</span><br><b class="cell-mono">${item?.code}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Batch / Lot #:</span><br><b class="cell-mono" style="color:var(--primary-300);">${qa.batch_number}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Total Lot Size:</span><br><b>${qa.lot_qty} ${item?.base_uom}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Required Sample Size:</span><br><b>${qa.sample_size} Units</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">COA Reference:</span><br><b>${qa.coa_number || 'N/A'}</b></div>
          </div>

          <!-- Parameter Tests Table -->
          <div>
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:8px;">Metrology & Parameter Test Records</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Test Parameter</th>
                  <th>Engineering Specification</th>
                  <th>Observed Value</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                ${(qa.tests || []).map((t, idx) => `
                  <tr>
                    <td class="cell-strong">${t.param}</td>
                    <td class="cell-mono" style="color:var(--text-muted);">${t.spec}</td>
                    <td>
                      ${isPending ? `
                        <input type="text" class="form-control qa-observed-input" value="${t.observed}" style="height:30px; font-size:12px;">
                      ` : `
                        <span class="cell-mono">${t.observed}</span>
                      `}
                    </td>
                    <td>
                      ${isPending ? `
                        <select class="filter-select qa-result-select" style="height:30px; font-size:11px;">
                          <option value="PASS" ${t.result === 'PASS' ? 'selected' : ''}>PASS</option>
                          <option value="FAIL" ${t.result === 'FAIL' ? 'selected' : ''}>FAIL</option>
                        </select>
                      ` : `
                        <span class="status-pill ${t.result === 'PASS' ? 'status-approved' : 'status-rejected'}">${t.result}</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Inspector & Notes -->
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Quality Inspector Name</label>
              <input type="text" id="qa-inspector-name" class="form-control" value="${qa.inspector && qa.inspector !== 'Unassigned (Quality Team)' ? qa.inspector : window.State.currentUser.name}" ${!isPending ? 'readonly' : ''}>
            </div>
            <div class="form-group">
              <label class="form-label">COA / Test Report Number</label>
              <input type="text" id="qa-coa-input" class="form-control" value="${qa.coa_number || 'COA-88190'}" ${!isPending ? 'readonly' : ''}>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Inspection & Metallurgical Observations</label>
              <textarea id="qa-notes-input" class="form-control" ${!isPending ? 'readonly' : ''}>${qa.defect_notes || 'All metallurgical and dimensional tolerances satisfy drawing standards.'}</textarea>
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
        ${isPending ? `
          <button class="btn btn-danger" onclick="window.QualityInspectionModule.processDecision('${qa.id}', 'REJECTED')">
            Reject & Quarantine Lot
          </button>
          <button class="btn btn-success" onclick="window.QualityInspectionModule.processDecision('${qa.id}', 'ACCEPTED')">
            ✓ Accept & Release for Putaway
          </button>
        ` : `
          <span style="font-size:12px; color:var(--text-muted); margin-right:12px;">Decision Logged: <b>${qa.status}</b></span>
        `}
      `
    });
  },

  processDecision(qaId, decision) {
    const qa = window.DB.getById('qualityInspections', qaId);
    if (!qa) return;
    const item = window.DB.getById('items', qa.item_id);
    const inspector = document.getElementById('qa-inspector-name').value;
    const coa = document.getElementById('qa-coa-input').value;
    const notes = document.getElementById('qa-notes-input').value;

    const acceptedQty = decision === 'ACCEPTED' ? qa.lot_qty : 0;
    const rejectedQty = decision === 'REJECTED' ? qa.lot_qty : 0;

    window.DB.update('qualityInspections', qaId, {
      status: decision,
      accepted_qty: acceptedQty,
      rejected_qty: rejectedQty,
      inspector: inspector,
      coa_number: coa,
      defect_notes: notes,
      inspected_at: new Date().toISOString()
    });

    let effectivePlantId = qa.plant_id || qa.plantId;
    if (!effectivePlantId && qa.ref_doc_type === 'GRN' && qa.ref_doc_no) {
      const grn = window.DB.getAll('goodsReceipts').find(g => g.grn_number === qa.ref_doc_no);
      if (grn) effectivePlantId = grn.plant_id;
    }
    if (!effectivePlantId) {
      effectivePlantId = (window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId)) ? window.State.currentPlantId : window.DB.getActivePlants()[0]?.id;
    }

    if (decision === 'ACCEPTED') {
      // Create automated Putaway Task
      const putNumber = `PUT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      
      // Determine suggested optimal bin based on item category
      let suggestedBinId = 'BIN-RMS-A01-02';
      if (item?.category_id === 'CAT-02') suggestedBinId = 'BIN-RMS-B01-01';
      if (item?.category_id === 'CAT-03') suggestedBinId = 'BIN-RMS-B01-02';
      if (item?.category_id === 'CAT-06') suggestedBinId = 'BIN-FGH-F1-01';

      window.DB.insert('putawayTasks', {
        task_number: putNumber,
        inspection_id: qa.id,
        plant_id: effectivePlantId,
        item_id: qa.item_id,
        batch_number: qa.batch_number,
        quantity: qa.lot_qty,
        source_dock: 'RECEIVING_DOCK_1',
        suggested_bin_id: suggestedBinId,
        actual_bin_id: null,
        status: 'PENDING',
        completed_by: null,
        completed_at: null
      });

      window.DB.logAudit('QA_ACCEPT', 'QUALITY', qa.inspection_number, `Lot ${qa.batch_number} of ${item?.code} ACCEPTED. Auto-created Putaway Task ${putNumber}.`);
      window.State.closeModal();
      window.State.showToast(`Batch ${qa.batch_number} accepted! Putaway task generated.`);
      location.hash = '#/putaway';
    } else {
      // Quarantine the rejected lot
      window.DB.addStock({
        plantId: effectivePlantId,
        warehouseId: 'WH-PUN-QAR',
        binId: 'BIN-QAR-01',
        itemId: qa.item_id,
        batchNumber: qa.batch_number,
        qty: qa.lot_qty,
        unitCost: item?.standard_cost || 100,
        reason: 'Quarantined due to QA rejection'
      });

      // Also log return record for reverse logistics
      window.DB.insert('returnsLog', {
        return_number: `RET-${Date.now().toString(36)}`,
        return_type: 'PURCHASE_RETURN_VENDOR',
        ref_doc_no: qa.inspection_number,
        plant_id: effectivePlantId,
        entity_name: 'Vendor Return Quarantine',
        item_id: qa.item_id,
        batch_number: qa.batch_number,
        quantity: qa.lot_qty,
        uom: item?.base_uom || 'NOS',
        reason_code: 'QA Rejection - Dimensional/Material Defect',
        action_disposition: 'VENDOR_REPLACEMENT',
        status: 'PENDING_APPROVAL',
        logged_by: window.State.currentUser.name
      });

      window.DB.logAudit('QA_REJECT', 'QUALITY', qa.inspection_number, `Lot ${qa.batch_number} REJECTED. Transferred to Quarantine Bin BIN-QAR-01.`);
      window.State.closeModal();
      window.State.showToast(`Batch ${qa.batch_number} rejected. Stock sent to Quarantine store.`, 'error');
      window.QualityInspectionModule.render(document.getElementById('view-container'));
    }
  }
};
