/* ==========================================================================
   ENTERPRISE ISCM - STAGE 1: PURCHASE PLANNING & REPLENISHMENT (MRP)
   Calculates Net Available Stock vs Reorder Points & Generates Purchase Demands
   ========================================================================== */

window.PurchasePlanningModule = {
  render(container) {
    const plantId = window.State.currentPlantId;
    const items = window.DB.getAll('items').filter(i => i.item_type !== 'FINISHED_GOODS');
    const balances = window.DB.getAll('inventoryBalances').filter(b => plantId === 'ALL' || b.plant_id === plantId);
    const pos = window.DB.getAll('purchaseOrders').filter(p => (plantId === 'ALL' || p.plant_id === plantId) && (p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED'));

    // Compute planning status for each item
    const planningData = items.map(item => {
      const itemBalances = balances.filter(b => b.item_id === item.id);
      const onHand = itemBalances.reduce((sum, b) => sum + (b.on_hand || 0), 0);
      const reserved = itemBalances.reduce((sum, b) => sum + (b.reserved || 0), 0);

      // Calculate On-Order quantity from active POs
      let onOrder = 0;
      pos.forEach(po => {
        po.items.forEach(poi => {
          if (poi.item_id === item.id) {
            onOrder += Math.max(0, (poi.ordered_qty || 0) - (poi.received_qty || 0));
          }
        });
      });

      const netAvailable = onHand + onOrder - reserved;
      const isShortage = netAvailable <= item.reorder_level;
      const isCritical = netAvailable <= item.safety_stock;

      // Recommended Reorder Qty = Max(MOQ, MaxStock - NetAvailable)
      let suggestedOrder = 0;
      if (isShortage) {
        const gap = (item.max_stock || (item.reorder_level * 2)) - netAvailable;
        suggestedOrder = Math.max(item.moq || 1, gap);
        // Round to nearest MOQ multiple
        if (item.moq && item.moq > 1) {
          suggestedOrder = Math.ceil(suggestedOrder / item.moq) * item.moq;
        }
      }

      const estimatedCost = suggestedOrder * (item.last_purchase_price || item.standard_cost || 0);

      return {
        ...item,
        onHand,
        reserved,
        onOrder,
        netAvailable,
        isShortage,
        isCritical,
        suggestedOrder,
        estimatedCost
      };
    });

    const shortageItems = planningData.filter(p => p.isShortage);
    const criticalItems = planningData.filter(p => p.isCritical);
    const totalReplenishSpend = shortageItems.reduce((sum, p) => sum + p.estimatedCost, 0);

    container.innerHTML = `
      <div class="kpi-grid" style="display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 10px; margin-bottom: 12px; width: 100%;">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Monitored Billable Materials</span>
            <div class="kpi-icon-wrap cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
          </div>
          <div class="kpi-value">${planningData.length} <span style="font-size:14px; color:var(--text-muted);">SKUs</span></div>
          <div class="kpi-footer">
            <span class="kpi-subtitle">Dynamic Reorder Point Algorithm</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Replenishment Triggered</span>
            <div class="kpi-icon-wrap warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
          <div class="kpi-value" style="color:var(--color-warning);">${shortageItems.length} <span style="font-size:14px; color:var(--text-muted);">SKUs</span></div>
          <div class="kpi-footer">
            <span class="kpi-subtitle">${criticalItems.length} below Safety Stock reserve</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Safety Buffer Breaches</span>
            <div class="kpi-icon-wrap danger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
          <div class="kpi-value" style="color:var(--color-danger);">${criticalItems.length}</div>
          <div class="kpi-footer">
            <span class="trend-badge negative">High Line-Stop Risk</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Projected Procurement Capital</span>
            <div class="kpi-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="kpi-value">₹${totalReplenishSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div class="kpi-footer">
            <span class="kpi-subtitle">Estimated cost for suggested orders</span>
          </div>
        </div>
      </div>

      <!-- Planning Table & Batch Actions -->
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Material Replenishment Plan & Safety Stock Simulation
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" onclick="window.PurchasePlanningModule.render(document.getElementById('view-container'))">
              ↻ Recalculate MRP
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.PurchasePlanningModule.batchCreatePR()">
              ⚡ 1-Click Generate PRs (${shortageItems.length} Items)
            </button>
          </div>
        </div>

        <div class="toolbar">
          <div class="toolbar-left">
            <input type="text" id="planning-search" class="filter-input" placeholder="Search by SKU code or name..." oninput="window.PurchasePlanningModule.filterTable()">
            <select id="planning-filter-status" class="filter-select" onchange="window.PurchasePlanningModule.filterTable()">
              <option value="ALL">All Items</option>
              <option value="SHORTAGE" selected>Shortage / Action Required (${shortageItems.length})</option>
              <option value="CRITICAL">Critical Safety Breach (${criticalItems.length})</option>
              <option value="HEALTHY">Sufficient Stock</option>
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="planning-table">
            <thead>
              <tr>
                <th>Item Code & Description</th>
                <th class="text-right">On-Hand</th>
                <th class="text-right">Reserved</th>
                <th class="text-right">On-Order</th>
                <th class="text-right">Net Available</th>
                <th class="text-right">Reorder Pt</th>
                <th class="text-right">Safety Stk</th>
                <th class="text-right">Suggested Order</th>
                <th class="text-right">Est. Cost</th>
                <th>Planning Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${planningData.map(p => `
                <tr data-status="${p.isCritical ? 'CRITICAL' : p.isShortage ? 'SHORTAGE' : 'HEALTHY'}" data-name="${(p.code + ' ' + p.name).toLowerCase()}">
                  <td class="cell-strong">
                    <span class="cell-mono">${p.code}</span><br>
                    <span style="font-size:12px; color:var(--text-secondary);">${p.name}</span>
                  </td>
                  <td class="cell-num">${p.onHand} ${p.base_uom}</td>
                  <td class="cell-num" style="color:var(--text-muted);">${p.reserved}</td>
                  <td class="cell-num" style="color:var(--color-info);">${p.onOrder}</td>
                  <td class="cell-num" style="font-weight:800; color:${p.isCritical ? 'var(--color-danger)' : p.isShortage ? 'var(--color-warning)' : 'var(--color-success)'};">
                    ${p.netAvailable} ${p.base_uom}
                  </td>
                  <td class="cell-num">${p.reorder_level}</td>
                  <td class="cell-num">${p.safety_stock}</td>
                  <td class="cell-num" style="font-weight:700; color:var(--primary-300);">
                    ${p.suggestedOrder > 0 ? `${p.suggestedOrder} ${p.base_uom}` : '-'}
                  </td>
                  <td class="cell-num">
                    ${p.estimatedCost > 0 ? `₹${p.estimatedCost.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td>
                    ${p.isCritical
                      ? '<span class="status-pill status-rejected">SAFETY BREACH</span>'
                      : p.isShortage
                        ? '<span class="status-pill status-pending">REORDER DUE</span>'
                        : '<span class="status-pill status-approved">HEALTHY</span>'
                    }
                  </td>
                  <td>
                    ${p.suggestedOrder > 0 ? `
                      <button class="btn btn-primary btn-sm" onclick="window.DashboardModule.createQuickPR('${p.id}')">
                        Raise PR
                      </button>
                    ` : `
                      <span style="color:var(--text-muted); font-size:11px;">Optimal</span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Apply default filter to show shortages
    this.filterTable();
  },

  filterTable() {
    const search = (document.getElementById('planning-search')?.value || '').toLowerCase();
    const filter = document.getElementById('planning-filter-status')?.value || 'ALL';
    const rows = document.querySelectorAll('#planning-table tbody tr');

    rows.forEach(row => {
      const status = row.getAttribute('data-status');
      const name = row.getAttribute('data-name');
      const matchSearch = name.includes(search);
      const matchFilter = filter === 'ALL' ||
        (filter === 'SHORTAGE' && (status === 'SHORTAGE' || status === 'CRITICAL')) ||
        (filter === 'CRITICAL' && status === 'CRITICAL') ||
        (filter === 'HEALTHY' && status === 'HEALTHY');

      row.style.display = matchSearch && matchFilter ? '' : 'none';
    });
  },

  batchCreatePR() {
    const plantId = window.State.currentPlantId === 'ALL' ? 'PLANT-01' : window.State.currentPlantId;
    const items = window.DB.getAll('items');
    const balances = window.DB.getAll('inventoryBalances').filter(b => plantId === 'ALL' || b.plant_id === plantId);

    const shortageItems = [];
    items.forEach(item => {
      const itemBalances = balances.filter(b => b.item_id === item.id);
      const onHand = itemBalances.reduce((sum, b) => sum + (b.available || 0), 0);
      if (onHand <= item.reorder_level) {
        shortageItems.push({
          item_id: item.id,
          qty: Math.max(item.moq || 100, item.reorder_level * 2 - onHand),
          uom: item.base_uom,
          est_rate: item.last_purchase_price || item.standard_cost,
          suggested_supplier: 'SUP-001'
        });
      }
    });

    if (shortageItems.length === 0) {
      window.State.showToast('No items currently require replenishment!', 'info');
      return;
    }

    const prNumber = `PR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    window.DB.insert('requisitions', {
      pr_number: prNumber,
      plant_id: plantId,
      department_id: 'DEPT-01',
      requested_by: 'MRP Auto-Planner',
      required_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      priority: 'HIGH',
      status: 'PENDING_APPROVAL',
      justification: `Consolidated MRP replenishment trigger for ${shortageItems.length} critical raw materials below reorder thresholds.`,
      items: shortageItems
    });

    window.DB.logAudit(
      'MRP_BATCH_PR',
      'PLANNING',
      prNumber,
      `Generated consolidated Requisition ${prNumber} containing ${shortageItems.length} line items.`
    );

    window.State.showToast(`Batch Requisition ${prNumber} generated with ${shortageItems.length} lines!`);
    location.hash = '#/requisitions';
  }
};
