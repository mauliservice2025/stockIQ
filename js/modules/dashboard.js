/* ==========================================================================
   ENTERPRISE ISCM - EXECUTIVE MANAGEMENT KPI DASHBOARD
   Real-Time Stock Health, Procurement Pipeline, Production Yield & SVG Analytics
   ========================================================================== */

window.DashboardModule = {
  render(container) {
    const plantId = window.State.currentPlantId;
    const balances = window.DB.getAll('inventoryBalances').filter(b => {
      if (!window.DB.isPlantActive(b.plant_id)) return false;
      return plantId === 'ALL' || b.plant_id === plantId;
    });
    const items = window.DB.getAll('items');
    const pos = window.DB.getAll('purchaseOrders').filter(p => {
      if (!window.DB.isPlantActive(p.plant_id)) return false;
      return plantId === 'ALL' || p.plant_id === plantId;
    });
    const prs = window.DB.getAll('requisitions').filter(r => {
      if (!window.DB.isPlantActive(r.plant_id)) return false;
      return plantId === 'ALL' || r.plant_id === plantId;
    });
    const prdOrders = window.DB.getAll('productionOrders').filter(p => {
      if (!window.DB.isPlantActive(p.plant_id)) return false;
      return plantId === 'ALL' || p.plant_id === plantId;
    });
    const qas = window.DB.getAll('qualityInspections').filter(q => {
      let pId = q.plant_id || q.plantId;
      if (!pId && q.ref_doc_type === 'GRN' && q.ref_doc_no) {
        const grn = window.DB.getAll('goodsReceipts').find(g => g.grn_number === q.ref_doc_no);
        if (grn) pId = grn.plant_id;
      }
      if (pId && !window.DB.isPlantActive(pId)) return false;
      return plantId === 'ALL' || !pId || pId === plantId;
    });
    const auditLogs = window.DB.getAll('auditLogs');

    // Calculations
    let totalStockValuation = 0;
    let availableUnits = 0;
    let reservedUnits = 0;
    let quarantineUnits = 0;

    balances.forEach(b => {
      const val = (b.on_hand || 0) * (b.valuation_rate || 0);
      totalStockValuation += val;
      if (b.stock_status === 'AVAILABLE') availableUnits += (b.available || 0);
      if (b.stock_status === 'QUARANTINE') quarantineUnits += (b.on_hand || 0);
      reservedUnits += (b.reserved || 0);
    });

    const pendingPRCount = prs.filter(p => p.status === 'PENDING_APPROVAL').length;
    const activePOCount = pos.filter(p => p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED').length;
    const pendingQACount = qas.filter(q => q.status === 'PENDING').length;
    const activeProdCount = prdOrders.filter(p => p.status === 'IN_PROGRESS' || p.status === 'RELEASED').length;

    // Low stock items
    const lowStockItems = [];
    items.forEach(item => {
      const itemBalances = balances.filter(b => b.item_id === item.id);
      const onHand = itemBalances.reduce((acc, b) => acc + (b.available || 0), 0);
      if (onHand <= item.reorder_level) {
        lowStockItems.push({
          ...item,
          currentStock: onHand,
          shortfall: Math.max(0, item.reorder_level - onHand)
        });
      }
    });

    container.innerHTML = `
      <!-- Lifecycle Stepper Process Navigation -->
      <div class="lifecycle-stepper">
        <div class="step-node completed" onclick="location.hash='#/purchase-planning'" style="cursor:pointer;" title="Click to view Planning">
          <div class="step-index">1</div>
          <div class="step-label">Planning</div>
        </div>
        <div class="step-divider completed"></div>
        <div class="step-node completed" onclick="location.hash='#/requisitions'" style="cursor:pointer;" title="Requisitions">
          <div class="step-index">2</div>
          <div class="step-label">PR</div>
        </div>
        <div class="step-divider completed"></div>
        <div class="step-node completed" onclick="location.hash='#/orders'" style="cursor:pointer;" title="Purchase Orders">
          <div class="step-index">3</div>
          <div class="step-label">PO</div>
        </div>
        <div class="step-divider completed"></div>
        <div class="step-node completed" onclick="location.hash='#/grn'" style="cursor:pointer;" title="Goods Receipt">
          <div class="step-index">4</div>
          <div class="step-label">GRN</div>
        </div>
        <div class="step-divider completed"></div>
        <div class="step-node active" onclick="location.hash='#/quality'" style="cursor:pointer;" title="Quality QA/QC">
          <div class="step-index">5</div>
          <div class="step-label">QA/QC</div>
        </div>
        <div class="step-divider"></div>
        <div class="step-node" onclick="location.hash='#/putaway'" style="cursor:pointer;" title="Putaway">
          <div class="step-index">6</div>
          <div class="step-label">Putaway</div>
        </div>
        <div class="step-divider"></div>
        <div class="step-node" onclick="location.hash='#/inventory'" style="cursor:pointer;" title="Inventory Stock">
          <div class="step-index">7</div>
          <div class="step-label">Inventory</div>
        </div>
        <div class="step-divider"></div>
        <div class="step-node" onclick="location.hash='#/production'" style="cursor:pointer;" title="Manufacturing WIP">
          <div class="step-index">8</div>
          <div class="step-label">Production</div>
        </div>
        <div class="step-divider"></div>
        <div class="step-node" onclick="location.hash='#/transfers'" style="cursor:pointer;" title="Stock Transfers">
          <div class="step-index">9</div>
          <div class="step-label">Transfer</div>
        </div>
        <div class="step-divider"></div>
        <div class="step-node" onclick="location.hash='#/dispatch'" style="cursor:pointer;" title="Dispatch & Gate Pass">
          <div class="step-index">10</div>
          <div class="step-label">Dispatch</div>
        </div>
        <div class="step-divider"></div>
        <div class="step-node" onclick="location.hash='#/reports'" style="cursor:pointer;" title="MIS Reports">
          <div class="step-index">11</div>
          <div class="step-label">Reports</div>
        </div>
      </div>

      <!-- Top KPI Row -->
      <div class="kpi-grid" style="display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 10px; margin-bottom: 12px; width: 100%;">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Total Inventory Valuation</span>
            <div class="kpi-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="kpi-value">₹${totalStockValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div class="kpi-footer">
            <span class="trend-badge positive">↑ +4.8%</span>
            <span class="kpi-subtitle">Weighted Average Valuation</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Active Materials On Hand</span>
            <div class="kpi-icon-wrap cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
          </div>
          <div class="kpi-value">${Math.round(availableUnits).toLocaleString('en-IN')} <span style="font-size:14px; color:var(--text-muted);">Units</span></div>
          <div class="kpi-footer">
            <span style="color:var(--primary-400); font-weight:600;">${Math.round(reservedUnits)}</span>
            <span class="kpi-subtitle">Reserved for Production Orders</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Critical Shortages / Reorder</span>
            <div class="kpi-icon-wrap ${lowStockItems.length > 0 ? 'danger' : 'success'}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div class="kpi-value">${lowStockItems.length} <span style="font-size:14px; color:var(--text-muted);">SKUs</span></div>
          <div class="kpi-footer">
            <a href="#/purchase-planning" style="color:var(--color-danger); font-weight:700; text-decoration:none;">View Replenishment Plan →</a>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Pending Inward / QA</span>
            <div class="kpi-icon-wrap warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
            </div>
          </div>
          <div class="kpi-value">${pendingQACount + pendingPRCount} <span style="font-size:14px; color:var(--text-muted);">Tasks</span></div>
          <div class="kpi-footer">
            <span class="kpi-subtitle">${pendingPRCount} PR Approvals, ${pendingQACount} QA Holds</span>
          </div>
        </div>
      </div>

      <!-- Mid Section: Analytics SVG Visualizations & Low Stock Matrix -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
        
        <!-- Inventory Category Breakdown (Clean Responsive SVG Donut) -->
        <div class="content-card">
          <div class="card-header">
            <div class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10h-10z"/></svg>
              Inventory Valuation by Category
            </div>
            <span class="status-pill status-approved">Real-Time</span>
          </div>
          <div class="card-body" style="display:flex; align-items:center; justify-content:space-around; flex-wrap:wrap; gap:20px;">
            <div style="position:relative; width:160px; height:160px;">
              <svg viewBox="0 0 36 36" style="width:100%; height:100%; transform: rotate(-90deg);">
                <!-- Ring 1: Raw Steels & Billets (42%) -->
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#4f46e5" stroke-width="3.5" stroke-dasharray="42 58" stroke-dashoffset="0"></circle>
                <!-- Ring 2: Precision Components (28%) -->
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#06b6d4" stroke-width="3.5" stroke-dasharray="28 72" stroke-dashoffset="-42"></circle>
                <!-- Ring 3: Finished Actuators (18%) -->
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#10b981" stroke-width="3.5" stroke-dasharray="18 82" stroke-dashoffset="-70"></circle>
                <!-- Ring 4: Electronics & Controllers (12%) -->
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f59e0b" stroke-width="3.5" stroke-dasharray="12 88" stroke-dashoffset="-88"></circle>
              </svg>
              <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center;">
                <div style="font-size:18px; font-weight:800; color:var(--text-primary);">₹${(totalStockValuation/100000).toFixed(1)}L</div>
                <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">Total Value</div>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px; min-width:180px;">
              <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px;">
                <span style="display:flex; align-items:center; gap:8px;">
                  <span style="width:10px; height:10px; border-radius:2px; background:#4f46e5;"></span>
                  Raw Alloys & Steels
                </span>
                <span style="font-weight:700; font-family:var(--font-mono); color:var(--text-primary);">42%</span>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px;">
                <span style="display:flex; align-items:center; gap:8px;">
                  <span style="width:10px; height:10px; border-radius:2px; background:#06b6d4;"></span>
                  Mechanical & Bearings
                </span>
                <span style="font-weight:700; font-family:var(--font-mono); color:var(--text-primary);">28%</span>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px;">
                <span style="display:flex; align-items:center; gap:8px;">
                  <span style="width:10px; height:10px; border-radius:2px; background:#10b981;"></span>
                  Finished Actuators & FG
                </span>
                <span style="font-weight:700; font-family:var(--font-mono); color:var(--text-primary);">18%</span>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px;">
                <span style="display:flex; align-items:center; gap:8px;">
                  <span style="width:10px; height:10px; border-radius:2px; background:#f59e0b;"></span>
                  Controller Boards
                </span>
                <span style="font-weight:700; font-family:var(--font-mono); color:var(--text-primary);">12%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Supply Chain Operational Inflow & Outflow Trend -->
        <div class="content-card">
          <div class="card-header">
            <div class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Weekly Material Flow (MT/Units)
            </div>
            <div style="display:flex; gap:12px; font-size:11px;">
              <span style="display:flex; align-items:center; gap:4px; color:var(--color-info);">
                <span style="width:8px; height:8px; border-radius:50%; background:var(--color-info);"></span> Inward GRN
              </span>
              <span style="display:flex; align-items:center; gap:4px; color:var(--primary-400);">
                <span style="width:8px; height:8px; border-radius:50%; background:var(--primary-400);"></span> Production Issue
              </span>
            </div>
          </div>
          <div class="card-body" style="padding-top:10px;">
            <!-- SVG Bar Comparison Chart -->
            <svg viewBox="0 0 380 140" style="width:100%; height:140px;">
              <line x1="30" y1="120" x2="370" y2="120" stroke="var(--border-medium)" stroke-width="1"/>
              <line x1="30" y1="70" x2="370" y2="70" stroke="var(--border-subtle)" stroke-dasharray="3 3"/>
              <line x1="30" y1="20" x2="370" y2="20" stroke="var(--border-subtle)" stroke-dasharray="3 3"/>

              <!-- Week 1 -->
              <rect x="50" y="45" width="16" height="75" rx="3" fill="#06b6d4"></rect>
              <rect x="70" y="55" width="16" height="65" rx="3" fill="#6366f1"></rect>
              <text x="68" y="135" fill="var(--text-muted)" font-size="10" text-anchor="middle">W-33</text>

              <!-- Week 2 -->
              <rect x="120" y="30" width="16" height="90" rx="3" fill="#06b6d4"></rect>
              <rect x="140" y="40" width="16" height="80" rx="3" fill="#6366f1"></rect>
              <text x="138" y="135" fill="var(--text-muted)" font-size="10" text-anchor="middle">W-34</text>

              <!-- Week 3 -->
              <rect x="190" y="50" width="16" height="70" rx="3" fill="#06b6d4"></rect>
              <rect x="210" y="35" width="16" height="85" rx="3" fill="#6366f1"></rect>
              <text x="208" y="135" fill="var(--text-muted)" font-size="10" text-anchor="middle">W-35</text>

              <!-- Week 4 (Current) -->
              <rect x="260" y="25" width="16" height="95" rx="3" fill="#06b6d4"></rect>
              <rect x="280" y="30" width="16" height="90" rx="3" fill="#6366f1"></rect>
              <text x="278" y="135" fill="var(--primary-300)" font-weight="700" font-size="10" text-anchor="middle">W-36 (Curr)</text>

              <!-- Projected -->
              <rect x="330" y="40" width="14" height="80" rx="3" fill="#06b6d4" opacity="0.4"></rect>
              <rect x="348" y="45" width="14" height="75" rx="3" fill="#6366f1" opacity="0.4"></rect>
              <text x="345" y="135" fill="var(--text-muted)" font-size="10" text-anchor="middle">W-37 (Fcst)</text>
            </svg>
          </div>
        </div>

      </div>

      <!-- Critical Shortage & Immediate Action Table -->
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Critical Production Shortage & Replenishment Queue
          </div>
          <button class="btn btn-primary btn-sm" onclick="location.hash='#/purchase-planning'">
            Open Automated Planning Engine →
          </button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item Code & Description</th>
                <th>Category</th>
                <th class="text-right">Current Available</th>
                <th class="text-right">Reorder Level</th>
                <th class="text-right">Safety Stock</th>
                <th>Lead Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${lowStockItems.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center; padding:30px; color:var(--color-success);">
                    ✓ All inventory levels are safely above reorder thresholds!
                  </td>
                </tr>
              ` : lowStockItems.map(item => `
                <tr>
                  <td class="cell-strong">
                    <span class="cell-mono">${item.code}</span><br>
                    <span style="font-size:12px; color:var(--text-secondary);">${item.name}</span>
                  </td>
                  <td>${window.DB.getById('itemCategories', item.category_id)?.name || 'General'}</td>
                  <td class="cell-num" style="color:var(--color-danger); font-size:14px;">${item.currentStock} ${item.base_uom}</td>
                  <td class="cell-num">${item.reorder_level} ${item.base_uom}</td>
                  <td class="cell-num">${item.safety_stock} ${item.base_uom}</td>
                  <td><span class="status-pill status-draft">${item.lead_time_days} Days</span></td>
                  <td><span class="status-pill status-rejected">BELOW REORDER</span></td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="window.DashboardModule.createQuickPR('${item.id}')">
                      + Quick PR
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Audit & System Activity -->
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Live Material Movement & Audit Stream
          </div>
          <a href="#/audit" class="btn btn-secondary btn-sm">Full Audit Trail →</a>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / Operator</th>
                <th>Action Type</th>
                <th>Module</th>
                <th>Reference ID</th>
                <th>Transaction Details</th>
              </tr>
            </thead>
            <tbody>
              ${auditLogs.slice(0, 5).map(log => `
                <tr>
                  <td class="cell-mono">${new Date(log.timestamp).toLocaleString('en-IN', { hour12: false })}</td>
                  <td class="cell-strong">${log.user}</td>
                  <td><span class="status-pill status-in-transit">${log.action}</span></td>
                  <td><span class="status-pill status-draft">${log.module}</span></td>
                  <td class="cell-mono">${log.record_id}</td>
                  <td style="color:var(--text-secondary); max-width:340px;">${log.details}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  createQuickPR(itemId) {
    const item = window.DB.getById('items', itemId);
    if (!item) return;

    window.State.showModal({
      title: `⚡ Quick Purchase Requisition: ${item.code}`,
      contentHtml: `
        <form id="quick-pr-form" onsubmit="window.DashboardModule.submitQuickPR(event, '${item.id}')">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Material SKU</label>
              <input type="text" class="form-control" value="${item.code} - ${item.name}" disabled>
            </div>
            <div class="form-group">
              <label class="form-label">Suggested Order Qty (${item.base_uom}) <span class="required">*</span></label>
              <input type="number" id="quick-pr-qty" class="form-control" value="${item.moq || 100}" min="1" required>
            </div>
            <div class="form-group">
              <label class="form-label">Required By Date <span class="required">*</span></label>
              <input type="date" id="quick-pr-date" class="form-control" value="${new Date(Date.now() + 7*86400000).toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select id="quick-pr-priority" class="filter-select" style="width:100%;">
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Line Stop</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Requisition Justification</label>
              <textarea id="quick-pr-justification" class="form-control">Automated critical replenishment trigger: stock fell below reorder level ${item.reorder_level} ${item.base_uom}.</textarea>
            </div>
          </div>
          <div class="modal-footer" style="padding-right:0; padding-bottom:0;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Generate Purchase Requisition</button>
          </div>
        </form>
      `
    });
  },

  submitQuickPR(e, itemId) {
    e.preventDefault();
    const item = window.DB.getById('items', itemId);
    const qty = Number(document.getElementById('quick-pr-qty').value);
    const reqDate = document.getElementById('quick-pr-date').value;
    const priority = document.getElementById('quick-pr-priority').value;
    const just = document.getElementById('quick-pr-justification').value;

    const prNumber = `PR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const targetPlantId = (window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId)) ? window.State.currentPlantId : (window.DB.getActivePlants()[0]?.id || 'PLANT-01');

    window.DB.insert('requisitions', {
      pr_number: prNumber,
      plant_id: targetPlantId,
      department_id: 'DEPT-01',
      requested_by: window.State.currentUser.name,
      required_date: reqDate,
      priority: priority,
      status: 'PENDING_APPROVAL',
      justification: just,
      items: [
        {
          item_id: item.id,
          qty: qty,
          uom: item.base_uom,
          est_rate: item.last_purchase_price || item.standard_cost,
          suggested_supplier: 'SUP-001'
        }
      ]
    });

    window.DB.logAudit(
      'CREATE_PR',
      'PROCUREMENT',
      prNumber,
      `Quick Purchase Requisition generated for ${qty} ${item.base_uom} of ${item.code}.`
    );

    window.State.closeModal();
    window.State.showToast(`Requisition ${prNumber} created successfully! Pending manager sign-off.`);
    location.hash = '#/requisitions';
  }
};
