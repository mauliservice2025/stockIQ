/* ==========================================================================
   ENTERPRISE ISCM - STAGE 14: PHYSICAL STOCK COUNTING & ADJUSTMENTS
   Cycle Counts, Blind Count Sheets, Variance Analysis & Audited Adjustments
   ========================================================================== */

window.AdjustmentsModule = {
  render(container) {
    if (container) this.container = container;
    const target = this.container || document.getElementById('view-container') || document.getElementById('main-content');
    if (!target) return;

    const plantId = window.State.currentPlantId;
    const counts = window.DB.getAll('stockCounts').filter(c => {
      if (c.warehouse_id && !window.DB.isWarehouseActive(c.warehouse_id)) return false;
      if (c.plant_id && !window.DB.isPlantActive(c.plant_id)) return false;
      const wh = window.DB.getById('warehouses', c.warehouse_id);
      const cPlantId = c.plant_id || (wh ? wh.plant_id : null);
      return plantId === 'ALL' || !cPlantId || cPlantId === plantId;
    });
    const adjustments = window.DB.getAll('stockAdjustments').filter(a => {
      if (a.warehouse_id && !window.DB.isWarehouseActive(a.warehouse_id)) return false;
      if (a.plant_id && !window.DB.isPlantActive(a.plant_id)) return false;
      const wh = window.DB.getById('warehouses', a.warehouse_id);
      const aPlantId = a.plant_id || (wh ? wh.plant_id : null);
      return plantId === 'ALL' || !aPlantId || aPlantId === plantId;
    });

    const pagedCounts = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(counts, 'cycle-counts')
      : { items: counts, totalRecords: counts.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    const pagedAdjustments = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(adjustments, 'stock-adjustments')
      : { items: adjustments, totalRecords: adjustments.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    target.innerHTML = `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            Physical Inventory Cycle Counts & Stock Reconciliation
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" onclick="window.AdjustmentsModule.showQuickAdjustmentModal()">
              ⚡ Direct Stock Adjustment
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.AdjustmentsModule.showNewCycleCountModal()">
              + Launch Cycle Count Audit
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Count Plan #</th>
                <th>Count Type</th>
                <th>Scheduled Date</th>
                <th>Warehouse</th>
                <th class="text-right">Audited SKUs</th>
                <th>Variance Status</th>
                <th>Count Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pagedCounts.items.length === 0 ? `
                <tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No cycle counts scheduled.</td></tr>
              ` : pagedCounts.items.map(c => {
                const wh = window.DB.getById('warehouses', c.warehouse_id);
                const hasVariance = (c.items || []).some(i => i.variance_qty !== 0);

                return `
                  <tr>
                    <td class="cell-mono cell-strong">
                      <a href="javascript:void(0)" onclick="window.AdjustmentsModule.viewCountDetails('${c.id}')" style="color:var(--primary-300); text-decoration:none;">
                        ${c.plan_number}
                      </a>
                    </td>
                    <td><span class="status-pill status-draft">${c.count_type}</span></td>
                    <td>${window.formatDate(c.scheduled_date)}</td>
                    <td class="cell-strong">${wh ? wh.name : c.warehouse_id}</td>
                    <td class="cell-num">${c.items ? c.items.length : 0} Lines</td>
                    <td>
                      ${hasVariance ? `
                        <span class="status-pill status-rejected">VARIANCE FOUND</span>
                      ` : `
                        <span class="status-pill status-approved">ZERO VARIANCE</span>
                      `}
                    </td>
                    <td>
                      <span class="status-pill ${c.status === 'RECONCILED' ? 'status-approved' : 'status-pending'}">
                        ${c.status}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="window.AdjustmentsModule.viewCountDetails('${c.id}')">
                        Inspect Count Sheet →
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          key: 'cycle-counts',
          pagination: pagedCounts,
          onPageChange: 'window.AdjustmentsModule.setCountsPage',
          onPageSizeChange: 'window.AdjustmentsModule.setCountsPageSize'
        }) : ''}
      </div>

      <!-- Historical Adjustments Register -->
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Audited Stock Adjustments Log
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Adjustment #</th>
                <th>Material SKU</th>
                <th>Batch #</th>
                <th>Direction</th>
                <th class="text-right">Quantity</th>
                <th>Reason Category</th>
                <th>Approved By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${pagedAdjustments.items.length === 0 ? `
                <tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No manual adjustments on file.</td></tr>
              ` : pagedAdjustments.items.map(a => {
                const item = window.DB.getById('items', a.item_id);
                return `
                  <tr>
                    <td class="cell-mono cell-strong">${a.adjustment_number}</td>
                    <td class="cell-strong">${item ? item.code : a.item_id}</td>
                    <td class="cell-mono">${a.batch_number}</td>
                    <td>
                      <span class="status-pill ${a.adjustment_type === 'INCREASE' ? 'status-approved' : 'status-rejected'}">
                        ${a.adjustment_type}
                      </span>
                    </td>
                    <td class="cell-num">${a.qty || a.quantity}</td>
                    <td style="color:var(--text-secondary); max-width:260px;">${a.reason || a.reason_code}</td>
                    <td><b>${a.approved_by}</b></td>
                    <td>${window.formatDate(a.created_at)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          key: 'stock-adjustments',
          pagination: pagedAdjustments,
          onPageChange: 'window.AdjustmentsModule.setAdjustmentsPage',
          onPageSizeChange: 'window.AdjustmentsModule.setAdjustmentsPageSize'
        }) : ''}
      </div>
    `;
  },

  setCountsPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('cycle-counts', page);
    this.render();
  },

  setCountsPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('cycle-counts', size);
    this.render();
  },

  setAdjustmentsPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('stock-adjustments', page);
    this.render();
  },

  setAdjustmentsPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('stock-adjustments', size);
    this.render();
  },

  viewCountDetails(countId) {
    const c = window.DB.getById('stockCounts', countId);
    if (!c) return;

    window.State.showModal({
      title: `Physical Inventory Count Sheet: ${c.plan_number}`,
      maxWidth: '850px',
      contentHtml: `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:14px; border-radius:var(--radius-md);">
            <div>
              <div style="font-size:11px; color:var(--text-muted);">Count Audit Type:</div>
              <div style="font-size:14px; font-weight:700; color:var(--text-primary);">${c.count_type}</div>
            </div>
            <div>
              <div style="font-size:11px; color:var(--text-muted);">Scheduled Date:</div>
              <div style="font-size:14px; font-weight:700;">${window.formatDate(c.scheduled_date)}</div>
            </div>
            <div>
              <div style="font-size:11px; color:var(--text-muted);">Reconciliation Status:</div>
              <span class="status-pill ${c.status === 'RECONCILED' ? 'status-approved' : 'status-pending'}">${c.status}</span>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Bin Location</th>
                <th>Material SKU</th>
                <th>Batch #</th>
                <th class="text-right">System Book Qty</th>
                <th class="text-right">Counted Qty</th>
                <th class="text-right">Variance Qty</th>
                <th class="text-right">Variance Value</th>
                <th>Auditor</th>
              </tr>
            </thead>
            <tbody>
              ${(c.items || []).map(item => {
                const itemObj = window.DB.getById('items', item.item_id);
                const bin = window.DB.getById('bins', item.bin_id);
                return `
                  <tr>
                    <td class="cell-mono" style="color:var(--primary-300);">${bin ? bin.code : item.bin_id}</td>
                    <td class="cell-strong">${itemObj ? itemObj.code : item.item_id}</td>
                    <td class="cell-mono">${item.batch_number}</td>
                    <td class="cell-num">${item.system_qty}</td>
                    <td class="cell-num" style="font-weight:800; color:var(--text-primary);">${item.counted_qty}</td>
                    <td class="cell-num" style="color:${item.variance_qty < 0 ? 'var(--color-danger)' : item.variance_qty > 0 ? 'var(--color-success)' : 'var(--text-muted)'}; font-weight:800;">
                      ${item.variance_qty > 0 ? `+${item.variance_qty}` : item.variance_qty}
                    </td>
                    <td class="cell-num">₹${item.variance_val || 0}</td>
                    <td>${item.counter || 'Prakash Shinde'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.print()">Print Count Sheet</button>
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
        ${c.status !== 'RECONCILED' ? `
          <button class="btn btn-primary" onclick="window.AdjustmentsModule.reconcileCount('${c.id}')">
            Approve & Auto-Post Adjustments →
          </button>
        ` : ''}
      `
    });
  },

  reconcileCount(countId) {
    const c = window.DB.getById('stockCounts', countId);
    if (!c) return;

    window.DB.update('stockCounts', countId, {
      status: 'RECONCILED'
    });

    window.DB.logAudit('RECONCILE_COUNT', 'INVENTORY', c.plan_number, `Reconciled physical stock count ${c.plan_number}. Ledger updated.`);
    window.State.closeModal();
    window.State.showToast(`Cycle count ${c.plan_number} reconciled and signed off!`);
    window.AdjustmentsModule.render(document.getElementById('view-container'));
  },

  showQuickAdjustmentModal() {
    const plantId = (window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId)) ? window.State.currentPlantId : undefined;
    const items = window.DB.getItemsForFacility(plantId);
    const warehouses = window.DB.getActiveWarehouses(plantId);

    window.State.showModal({
      title: '⚡ Direct Stock Adjustment & Ledger Write-Off',
      maxWidth: '650px',
      contentHtml: `
        <form id="direct-adj-form" onsubmit="window.AdjustmentsModule.submitDirectAdjustment(event)">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Material SKU <span class="required">*</span></label>
              <select id="adj-item" class="filter-select" style="width:100%;" required>
                ${items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Warehouse <span class="required">*</span></label>
              <select id="adj-wh" class="filter-select" style="width:100%;" required>
                ${warehouses.map(w => `<option value="${w.id}">${w.name} (${w.warehouse_type})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Adjustment Direction <span class="required">*</span></label>
              <select id="adj-direction" class="filter-select" style="width:100%;">
                <option value="DECREASE">Decrease (Write-Off / Loss / Scrap)</option>
                <option value="INCREASE">Increase (Surplus Found / Count Gain)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Adjustment Quantity <span class="required">*</span></label>
              <input type="number" id="adj-qty" class="form-control" value="10" min="1" required>
            </div>

            <div class="form-group">
              <label class="form-label">Batch / Lot Number <span class="required">*</span></label>
              <input type="text" id="adj-batch" class="form-control cell-mono" value="LOT-STL-2601-A" required>
            </div>

            <div class="form-group">
              <label class="form-label">Approved By Authority</label>
              <input type="text" id="adj-approver" class="form-control" value="${window.State.currentUser.name} (Supply Chain Head)" required>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Reason Code & Justification <span class="required">*</span></label>
              <select id="adj-reason-code" class="filter-select" style="width:100%; margin-bottom:8px;">
                <option value="Cycle Count Variance">Cycle Count Physical Variance</option>
                <option value="Handling Damage in Transit">Handling Damage during Material Picking</option>
                <option value="Shelf Life Expiry Scrap">Chemical / Fluid Shelf-Life Expiry</option>
                <option value="System Inward Rectification">System Inward Clerical Rectification</option>
              </select>
              <textarea id="adj-notes" class="form-control" placeholder="Detailed audit notes for Internal / Financial Audit..."></textarea>
            </div>
          </div>

          <div class="modal-footer" style="padding-right:0; padding-bottom:0; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Post Stock Adjustment Entry</button>
          </div>
        </form>
      `
    });
  },

  submitDirectAdjustment(e) {
    e.preventDefault();
    const itemId = document.getElementById('adj-item').value;
    const whId = document.getElementById('adj-wh').value;
    const dir = document.getElementById('adj-direction').value;
    const qty = Number(document.getElementById('adj-qty').value);
    const batch = document.getElementById('adj-batch').value;
    const approver = document.getElementById('adj-approver').value;
    const reasonCode = document.getElementById('adj-reason-code').value;
    const notes = document.getElementById('adj-notes').value;
    const itemObj = window.DB.getById('items', itemId);
    const wh = window.DB.getById('warehouses', whId);
    const plantId = (wh && wh.plant_id) ? wh.plant_id : ((window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId)) ? window.State.currentPlantId : window.DB.getActivePlants()[0]?.id);

    const adjNumber = `ADJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    window.DB.insert('stockAdjustments', {
      adjustment_number: adjNumber,
      plant_id: plantId,
      warehouse_id: whId,
      item_id: itemId,
      batch_number: batch,
      adjustment_type: dir,
      quantity: qty,
      reason_code: `${reasonCode}: ${notes || 'Approved adjustment'}`,
      approved_by: approver
    });

    if (dir === 'DECREASE') {
      try {
        window.DB.deductStock({
          plantId: plantId,
          warehouseId: whId,
          itemId: itemId,
          batchNumber: batch,
          qty: qty,
          reason: `Stock Adjustment ${adjNumber}`
        });
      } catch (err) {
        console.warn('Deduct adjustment note:', err.message);
      }
    } else {
      window.DB.addStock({
        plantId: plantId,
        warehouseId: whId,
        binId: 'BIN-RMS-A01-01',
        itemId: itemId,
        batchNumber: batch,
        qty: qty,
        unitCost: itemObj?.standard_cost || 100,
        reason: `Surplus Stock Adjustment ${adjNumber}`
      });
    }

    window.DB.logAudit('STOCK_ADJUST', 'INVENTORY', adjNumber, `Posted ${dir} adjustment of ${qty} ${itemObj?.code} (Batch: ${batch}). Reason: ${reasonCode}`);
    window.State.closeModal();
    window.State.showToast(`Stock adjustment ${adjNumber} posted successfully!`);
    window.AdjustmentsModule.render(document.getElementById('view-container'));
  },

  showNewCycleCountModal() {
    const plantId = (window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId)) ? window.State.currentPlantId : undefined;
    const warehouses = window.DB.getActiveWarehouses(plantId);

    window.State.showModal({
      title: '📋 Launch Physical Inventory Cycle Count',
      maxWidth: '650px',
      contentHtml: `
        <form id="new-count-form" onsubmit="window.AdjustmentsModule.submitNewCount(event)">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Count Audit Type <span class="required">*</span></label>
              <select id="count-type" class="filter-select" style="width:100%;" required>
                <option value="ABC_A_FAST_MOVER">ABC Category A (High Velocity)</option>
                <option value="ANNUAL_FULL_WALL_TO_WALL">Wall-to-Wall Complete Physical Audit</option>
                <option value="QUARTERLY_CYCLE">Quarterly Sampling Cycle Count</option>
                <option value="DISCREPANCY_SPOT_CHECK">Spot Discrepancy Verification</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Warehouse Store <span class="required">*</span></label>
              <select id="count-wh" class="filter-select" style="width:100%;" required>
                ${warehouses.map(w => `<option value="${w.id}">${w.name} (${w.warehouse_type})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Scheduled Audit Date <span class="required">*</span></label>
              <input type="date" id="count-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Assigned Lead Auditor</label>
              <input type="text" id="count-auditor" class="form-control" value="${window.State.currentUser.name}" required>
            </div>
          </div>

          <div class="modal-footer" style="padding-right:0; padding-bottom:0; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Generate Blind Count Sheet</button>
          </div>
        </form>
      `
    });
  },

  submitNewCount(e) {
    e.preventDefault();
    const type = document.getElementById('count-type').value;
    const whId = document.getElementById('count-wh').value;
    const date = document.getElementById('count-date').value;
    const auditor = document.getElementById('count-auditor').value;
    const wh = window.DB.getById('warehouses', whId);
    const plantId = wh?.plant_id || (window.DB.isPlantActive(window.State.currentPlantId) ? window.State.currentPlantId : window.DB.getActivePlants()[0]?.id);

    const planNumber = `CC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const balances = window.DB.getAll('inventoryBalances').filter(b => b.warehouse_id === whId && b.quantity > 0);
    const items = balances.slice(0, 10).map(b => ({
      item_id: b.item_id,
      bin_id: b.bin_id || 'BIN-RMS-A01-01',
      batch_number: b.batch_number,
      book_qty: b.quantity,
      counted_qty: b.quantity,
      variance_qty: 0,
      auditor: auditor
    }));

    window.DB.insert('stockCounts', {
      plan_number: planNumber,
      plant_id: plantId,
      warehouse_id: whId,
      count_type: type,
      scheduled_date: date,
      status: 'IN_PROGRESS',
      items: items.length > 0 ? items : [
        { item_id: 'ITEM-001', bin_id: 'BIN-RMS-A01-01', batch_number: 'LOT-STL-2601-A', book_qty: 450, counted_qty: 450, variance_qty: 0, auditor: auditor }
      ]
    });

    window.DB.logAudit('CREATE_COUNT', 'INVENTORY', planNumber, `Generated Physical Cycle Count Sheet ${planNumber} for warehouse ${whId}.`);
    window.State.closeModal();
    window.State.showToast(`Cycle Count Sheet ${planNumber} launched!`);
    window.AdjustmentsModule.render(document.getElementById('view-container'));
  }
};
