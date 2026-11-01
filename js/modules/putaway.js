/* ==========================================================================
   ENTERPRISE ISCM - STAGE 6: PUTAWAY & BIN ALLOCATION
   Dynamic Warehouse Bin Optimization, Capacity Validation & Stock Inward
   ========================================================================== */

window.PutawayModule = {
  render(container) {
    const plantId = window.State.currentPlantId;
    const tasks = window.DB.getAll('putawayTasks').filter(t => {
      let pId = t.plant_id || t.plantId;
      if (!pId && t.inspection_id) {
        const qa = window.DB.getById('qualityInspections', t.inspection_id);
        if (qa) {
          pId = qa.plant_id || qa.plantId;
          if (!pId && qa.ref_doc_no) {
            const grn = window.DB.getAll('goodsReceipts').find(g => g.grn_number === qa.ref_doc_no);
            if (grn) pId = grn.plant_id;
          }
        }
      }
      if (pId && !window.DB.isPlantActive(pId)) return false;
      return plantId === 'ALL' || pId === plantId;
    });
    const bins = window.DB.getAll('bins');

    container.innerHTML = `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
            Warehouse Putaway & Bin Allocation Tasks
          </div>
          <button class="btn btn-secondary btn-sm" onclick="location.hash='#/warehouse-map'">
            Visual Warehouse Map ↗
          </button>
        </div>

        <div class="toolbar">
          <div class="toolbar-left">
            <input type="text" id="put-search" class="filter-input" placeholder="Search task #, SKU, batch..." oninput="window.PutawayModule.filterTable()">
            <select id="put-status-filter" class="filter-select" onchange="window.PutawayModule.filterTable()">
              <option value="ALL">All Statuses</option>
              <option value="PENDING" selected>Pending Putaway</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div class="toolbar-right">
            <span style="font-size:12px; color:var(--text-muted);">Putaway Tasks: <b>${tasks.length}</b></span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="put-table">
            <thead>
              <tr>
                <th>Task #</th>
                <th>Material SKU</th>
                <th>Batch / Lot #</th>
                <th class="text-right">Quantity</th>
                <th>Source Staging Dock</th>
                <th>Suggested Bin</th>
                <th>Actual Bin</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.length === 0 ? `
                <tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No putaway tasks active.</td></tr>
              ` : tasks.map(t => {
                const item = window.DB.getById('items', t.item_id);
                const suggestedBin = window.DB.getById('bins', t.suggested_bin_id);
                const actualBin = t.actual_bin_id ? window.DB.getById('bins', t.actual_bin_id) : null;
                const isPending = t.status === 'PENDING';

                return `
                  <tr data-status="${t.status}" data-search="${(t.task_number + ' ' + (item?.code || '') + ' ' + (item?.name || '') + ' ' + t.batch_number).toLowerCase()}">
                    <td class="cell-mono cell-strong">${t.task_number}</td>
                    <td class="cell-strong">
                      <span class="cell-mono">${item?.code || t.item_id}</span><br>
                      <span style="font-size:11px; color:var(--text-secondary);">${item?.name || ''}</span>
                    </td>
                    <td class="cell-mono">${t.batch_number}</td>
                    <td class="cell-num">${t.quantity} ${item?.base_uom || 'Units'}</td>
                    <td><span class="status-pill status-draft">${t.source_dock}</span></td>
                    <td class="cell-mono" style="color:var(--color-info); font-weight:700;">
                      ${suggestedBin ? suggestedBin.code : t.suggested_bin_id}
                    </td>
                    <td class="cell-mono" style="color:var(--color-success); font-weight:700;">
                      ${actualBin ? actualBin.code : (isPending ? 'Pending Assignment' : '-')}
                    </td>
                    <td>
                      <span class="status-pill ${isPending ? 'status-pending' : 'status-approved'}">
                        ${t.status}
                      </span>
                    </td>
                    <td>
                      ${isPending ? `
                        <button class="btn btn-primary btn-sm" onclick="window.PutawayModule.showConfirmModal('${t.id}')">
                          Confirm Putaway →
                        </button>
                      ` : `
                        <span style="font-size:11px; color:var(--text-muted);">✓ Stored</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.filterTable();
  },

  filterTable() {
    const search = (document.getElementById('put-search')?.value || '').toLowerCase();
    const filter = document.getElementById('put-status-filter')?.value || 'ALL';
    const rows = document.querySelectorAll('#put-table tbody tr');

    rows.forEach(row => {
      const status = row.getAttribute('data-status');
      const text = row.getAttribute('data-search') || '';
      const matchSearch = text.includes(search);
      const matchFilter = filter === 'ALL' || status === filter;
      row.style.display = matchSearch && matchFilter ? '' : 'none';
    });
  },

  showConfirmModal(taskId) {
    const task = window.DB.getById('putawayTasks', taskId);
    if (!task) return;
    let taskPlantId = task.plant_id || task.plantId;
    if (!taskPlantId && task.inspection_id) {
      const qa = window.DB.getById('qualityInspections', task.inspection_id);
      if (qa) taskPlantId = qa.plant_id;
    }
    const activeWarehouses = window.DB.getActiveWarehouses(taskPlantId);
    const activeWhIds = new Set(activeWarehouses.map(w => w.id));
    const bins = window.DB.getAll('bins').filter(b => b.status !== 'quarantine' && activeWhIds.has(b.warehouse_id));

    window.State.showModal({
      title: `📦 Confirm Putaway: Task ${task.task_number}`,
      maxWidth: '650px',
      contentHtml: `
        <form id="confirm-putaway-form" onsubmit="window.PutawayModule.submitPutaway(event, '${task.id}')">
          <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md); margin-bottom:16px;">
            <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Material to Store:</div>
            <div style="font-size:16px; font-weight:700; color:var(--text-primary); margin:4px 0;">
              ${item?.code} - ${item?.name}
            </div>
            <div style="display:flex; gap:18px; margin-top:8px; font-size:12px;">
              <div>Batch / Lot: <b class="cell-mono" style="color:var(--primary-300);">${task.batch_number}</b></div>
              <div>Quantity: <b class="cell-mono" style="color:var(--color-success);">${task.quantity} ${item?.base_uom}</b></div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">Select Target Storage Bin <span class="required">*</span></label>
              <select id="put-actual-bin" class="filter-select" style="width:100%; height:42px; font-size:13px;" required>
                ${bins.map(b => {
                  const isSuggested = b.id === task.suggested_bin_id;
                  return `
                    <option value="${b.id}" ${isSuggested ? 'selected' : ''}>
                      ${b.code} (Rack: ${b.rack}, Shelf: ${b.shelf} | Occupancy: ${b.occupied_pct}%) ${isSuggested ? '★ [AI Recommended]' : ''}
                    </option>
                  `;
                }).join('')}
              </select>
              <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
                💡 System prioritizes bins based on item turnover, weight limits, and current vacant slots.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Forklift / Material Handler</label>
              <input type="text" id="put-operator" class="form-control" value="${window.State.currentUser.name}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Storage Verification Scan</label>
              <input type="text" class="form-control cell-mono" placeholder="Scan bin barcode / QR label..." value="VERIFIED-BY-PALLET-TAG">
            </div>
          </div>

          <div class="modal-footer" style="padding-right:0; padding-bottom:0; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Complete Putaway & Update Stock</button>
          </div>
        </form>
      `
    });
  },

  submitPutaway(e, taskId) {
    e.preventDefault();
    const task = window.DB.getById('putawayTasks', taskId);
    if (!task) return;
    const item = window.DB.getById('items', task.item_id);
    const binId = document.getElementById('put-actual-bin').value;
    const operator = document.getElementById('put-operator').value;
    const bin = window.DB.getById('bins', binId);

    let taskPlantId = task.plant_id || task.plantId;
    if (!taskPlantId && task.inspection_id) {
      const qa = window.DB.getById('qualityInspections', task.inspection_id);
      if (qa) taskPlantId = qa.plant_id;
    }
    if (!taskPlantId) {
      taskPlantId = (window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId)) ? window.State.currentPlantId : window.DB.getActivePlants()[0]?.id;
    }

    // 1. Atomically add stock into selected bin
    window.DB.addStock({
      plantId: taskPlantId,
      warehouseId: bin ? bin.warehouse_id : 'WH-PUN-SPARE',
      binId: binId,
      itemId: task.item_id,
      batchNumber: task.batch_number,
      qty: task.quantity,
      unitCost: item?.standard_cost || 100,
      reason: `Putaway Task ${task.task_number} completed`
    });

    // 2. Update bin occupancy
    if (bin) {
      bin.occupied_pct = Math.min(100, (bin.occupied_pct || 0) + 20);
      bin.status = bin.occupied_pct > 85 ? 'full' : bin.occupied_pct > 60 ? 'high' : 'normal';
      window.DB.update('bins', bin.id, bin);
    }

    // 3. Mark putaway task completed
    window.DB.update('putawayTasks', taskId, {
      actual_bin_id: binId,
      status: 'COMPLETED',
      completed_by: operator,
      completed_at: new Date().toISOString()
    });

    window.DB.logAudit(
      'PUTAWAY_CONFIRM',
      'WAREHOUSE',
      task.task_number,
      `Stored ${task.quantity} units of ${item?.code} into Bin ${bin?.code || binId}.`
    );

    window.State.closeModal();
    window.State.showToast(`Putaway completed! Stock is now active in Bin ${bin?.code}.`);
    window.PutawayModule.render(document.getElementById('view-container'));
  }
};
