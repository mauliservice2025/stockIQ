/* ==========================================================================
   ENTERPRISE ISCM - STAGES 8, 9, 10: PRODUCTION, BOM & MANUFACTURING EXECUTION
   BOM Explosion, Work Orders, Material Reservation, Actual vs BOM & FG Receipt
   ========================================================================== */

window.ProductionModule = {
  activeTab: 'ORDERS', // 'ORDERS' or 'BOM'

  render(container) {
    const plantId = window.State.currentPlantId;
    const orders = window.DB.getAll('productionOrders').filter(p => {
      if (!window.DB.isPlantActive(p.plant_id)) return false;
      return plantId === 'ALL' || p.plant_id === plantId;
    });
    const boms = window.DB.getAll('boms');

    container.innerHTML = `
      <div class="tabs-header">
        <button class="tab-btn ${this.activeTab === 'ORDERS' ? 'active' : ''}" onclick="window.ProductionModule.switchTab('ORDERS')">
          <span>Production Orders & Work in Progress</span>
        </button>
        <button class="tab-btn ${this.activeTab === 'BOM' ? 'active' : ''}" onclick="window.ProductionModule.switchTab('BOM')">
          <span>Multi-Level Bills of Materials (BOM)</span>
        </button>
      </div>

      ${this.activeTab === 'ORDERS' ? this.renderOrders(orders) : this.renderBOMs(boms)}
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.render(document.getElementById('view-container'));
  },

  renderOrders(orders) {
    return `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Production Work Orders (Shop Floor)
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.ProductionModule.showCreateOrderModal()">
            + Create Production Order
          </button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Finished Good (FG)</th>
                <th>BOM Ref</th>
                <th class="text-right">Target Qty</th>
                <th class="text-right">Completed</th>
                <th class="text-right">Yield %</th>
                <th>Planned Schedule</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orders.length === 0 ? `
                <tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No active production orders.</td></tr>
              ` : orders.map(ord => {
                const item = window.DB.getById('items', ord.item_id);
                const bom = window.DB.getById('boms', ord.bom_id);
                const yieldPct = ord.target_qty > 0 ? Math.round((ord.completed_qty / ord.target_qty) * 100) : 0;

                return `
                  <tr>
                    <td class="cell-mono cell-strong">
                      <a href="javascript:void(0)" onclick="window.ProductionModule.viewOrderDetails('${ord.id}')" style="color:var(--primary-300); text-decoration:none;">
                        ${ord.order_number}
                      </a>
                    </td>
                    <td class="cell-strong">
                      <span class="cell-mono">${item?.code}</span><br>
                      <span style="font-size:11px; color:var(--text-secondary);">${item?.name}</span>
                    </td>
                    <td class="cell-mono">${bom ? bom.bom_number : ord.bom_id}</td>
                    <td class="cell-num">${ord.target_qty} Units</td>
                    <td class="cell-num" style="color:var(--color-success); font-weight:800;">${ord.completed_qty}</td>
                    <td class="cell-num">
                      <span class="trend-badge positive">${yieldPct}%</span>
                    </td>
                    <td>${ord.planned_start} to ${ord.planned_end}</td>
                    <td>
                      <span class="status-pill ${
                        ord.status === 'COMPLETED' ? 'status-approved' :
                        ord.status === 'IN_PROGRESS' ? 'status-in-transit' : 'status-pending'
                      }">
                        ${ord.status}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.ProductionModule.viewOrderDetails('${ord.id}')">
                          Material Pick / WIP
                        </button>
                        ${ord.status === 'IN_PROGRESS' || ord.status === 'RELEASED' ? `
                          <button class="btn btn-success btn-sm" onclick="window.ProductionModule.showFGReceiptModal('${ord.id}')">
                            FG Receipt →
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
      </div>
    `;
  },

  renderBOMs(boms) {
    return `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Engineering Bills of Materials (BOM)
          </div>
        </div>

        <div class="card-body">
          ${boms.map(bom => {
            const fgItem = window.DB.getById('items', bom.item_id);
            return `
              <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px; margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                  <div>
                    <span class="cell-mono" style="font-size:16px; font-weight:800; color:var(--primary-400);">${bom.bom_number}</span>
                    <span class="status-pill status-draft" style="margin-left:8px;">Version ${bom.version}</span>
                    <div style="font-size:15px; font-weight:700; color:var(--text-primary); margin-top:4px;">
                      Parent Finished Good: ${fgItem?.code} - ${fgItem?.name}
                    </div>
                    <div style="font-size:12px; color:var(--text-muted);">${bom.description}</div>
                  </div>
                  <button class="btn btn-primary btn-sm" onclick="window.ProductionModule.createOrderFromBOM('${bom.id}')">
                    Launch Production Order →
                  </button>
                </div>

                <table class="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Component SKU</th>
                      <th>Description</th>
                      <th class="text-right">Qty per Parent Unit</th>
                      <th class="text-right">Scrap Allowance</th>
                      <th>Process / Operation Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(bom.components || []).map((comp, idx) => {
                      const cItem = window.DB.getById('items', comp.item_id);
                      return `
                        <tr>
                          <td>${idx + 1}</td>
                          <td class="cell-mono cell-strong">${cItem?.code}</td>
                          <td class="cell-strong">${cItem?.name}</td>
                          <td class="cell-num" style="color:var(--primary-300); font-weight:700;">${comp.qty} ${comp.uom}</td>
                          <td class="cell-num">${comp.scrap_pct}%</td>
                          <td style="color:var(--text-secondary);">${comp.remarks}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  viewOrderDetails(orderId) {
    const order = window.DB.getById('productionOrders', orderId);
    if (!order) return;
    const item = window.DB.getById('items', order.item_id);
    const bom = window.DB.getById('boms', order.bom_id);

    window.State.showModal({
      title: `Production Work Order: ${order.order_number}`,
      maxWidth: '850px',
      contentHtml: `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; background:var(--bg-surface); padding:16px; border-radius:var(--radius-md);">
            <div><span style="font-size:11px; color:var(--text-muted);">Target Finished Good:</span><br><b>${item?.code}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Target Lot Size:</span><br><b>${order.target_qty} Units</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Units Completed:</span><br><b style="color:var(--color-success);">${order.completed_qty} Units</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Scrapped Units:</span><br><b style="color:var(--color-danger);">${order.scrapped_qty || 0} Units</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Schedule:</span><br><b>${order.planned_start} to ${order.planned_end}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Order Status:</span><br><span class="status-pill status-in-transit">${order.status}</span></div>
          </div>

          <div>
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:8px;">Material Reservation & Actual Consumption vs Standard</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th class="text-right">BOM Standard</th>
                  <th class="text-right">Issued to Floor</th>
                  <th class="text-right">Consumed</th>
                  <th class="text-right">Variance</th>
                </tr>
              </thead>
              <tbody>
                ${(order.materials || []).map(mat => {
                  const cItem = window.DB.getById('items', mat.item_id);
                  const variance = Math.round((mat.consumed - (mat.required * (order.completed_qty / order.target_qty))) * 10) / 10;
                  return `
                    <tr>
                      <td class="cell-strong">
                        <span class="cell-mono">${cItem?.code}</span><br>
                        <span style="font-size:11px; color:var(--text-secondary);">${cItem?.name}</span>
                      </td>
                      <td class="cell-num">${mat.required} ${mat.uom}</td>
                      <td class="cell-num" style="color:var(--primary-300);">${mat.issued}</td>
                      <td class="cell-num" style="font-weight:700;">${mat.consumed}</td>
                      <td class="cell-num" style="color:${variance > 0 ? 'var(--color-danger)' : 'var(--color-success)'}; font-weight:700;">
                        ${variance > 0 ? `+${variance}` : variance} ${mat.uom}
                      </td>
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
        ${order.status === 'IN_PROGRESS' || order.status === 'RELEASED' ? `
          <button class="btn btn-success" onclick="window.State.closeModal(); window.ProductionModule.showFGReceiptModal('${order.id}')">
            Receive Finished Goods (FG Receipt) →
          </button>
        ` : ''}
      `
    });
  },

  showFGReceiptModal(orderId) {
    const order = window.DB.getById('productionOrders', orderId);
    if (!order) return;
    const item = window.DB.getById('items', order.item_id);
    const remainingToBuild = Math.max(1, order.target_qty - order.completed_qty);
    const suggestedBatch = `LOT-FG-${item?.code?.replace('FG-', '') || 'ACT'}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    window.State.showModal({
      title: `🏭 Finished Goods Receipt: ${order.order_number}`,
      maxWidth: '650px',
      contentHtml: `
        <form id="fg-receipt-form" onsubmit="window.ProductionModule.submitFGReceipt(event, '${order.id}')">
          <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md); margin-bottom:16px;">
            <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Finished Product:</div>
            <div style="font-size:16px; font-weight:800; color:var(--text-primary); margin:4px 0;">
              ${item?.code} - ${item?.name}
            </div>
            <div style="font-size:12px; color:var(--text-secondary);">
              Target: <b>${order.target_qty}</b> | Already Produced: <b style="color:var(--color-success);">${order.completed_qty}</b> | Pending: <b>${remainingToBuild}</b>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Quantity Completed in this Run <span class="required">*</span></label>
              <input type="number" id="fg-qty-completed" class="form-control" value="${remainingToBuild}" min="1" max="${remainingToBuild * 1.5}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Generated Finished Batch / Lot # <span class="required">*</span></label>
              <input type="text" id="fg-batch-no" class="form-control cell-mono" value="${suggestedBatch}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Serial Number Range</label>
              <input type="text" id="fg-serial-range" class="form-control cell-mono" value="SN-ACT-99${order.completed_qty + 1} to SN-ACT-99${order.completed_qty + remainingToBuild}">
            </div>

            <div class="form-group">
              <label class="form-label">Target Warehouse</label>
              <select id="fg-wh-select" class="filter-select" style="width:100%;">
                <option value="WH-PUN-FGH">Finished Goods Logistics Hub (FGH-01)</option>
              </select>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Assembly Floor Operator / Supervisor</label>
              <input type="text" id="fg-supervisor" class="form-control" value="${window.State.currentUser.name}" required>
            </div>
          </div>

          <div class="modal-footer" style="padding-right:0; padding-bottom:0; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Complete FG Receipt & Trigger QA</button>
          </div>
        </form>
      `
    });
  },

  submitFGReceipt(e, orderId) {
    e.preventDefault();
    const order = window.DB.getById('productionOrders', orderId);
    if (!order) return;
    const item = window.DB.getById('items', order.item_id);

    const completedRun = Number(document.getElementById('fg-qty-completed').value);
    const batchNo = document.getElementById('fg-batch-no').value;
    const serials = document.getElementById('fg-serial-range').value;
    const whId = document.getElementById('fg-wh-select').value;

    // 1. Add finished goods to warehouse stock (Available/Inspected)
    window.DB.addStock({
      plantId: order.plant_id,
      warehouseId: whId,
      binId: 'BIN-FGH-F1-01',
      itemId: order.item_id,
      batchNumber: batchNo,
      serialNumber: serials,
      qty: completedRun,
      unitCost: item?.standard_cost || 26500,
      reason: `Production Order ${order.order_number} Finished Goods Receipt`
    });

    // 2. Update Production Order progress
    const newCompletedTotal = order.completed_qty + completedRun;
    const isFinished = newCompletedTotal >= order.target_qty;

    window.DB.update('productionOrders', orderId, {
      completed_qty: newCompletedTotal,
      status: isFinished ? 'COMPLETED' : 'IN_PROGRESS'
    });

    // 3. Log QA Final Inspection
    const qaNumber = `QA-FG-${Date.now().toString(36).toUpperCase()}`;
    window.DB.insert('qualityInspections', {
      inspection_number: qaNumber,
      inspection_type: 'FINAL_FG',
      ref_doc_type: 'PRODUCTION_ORDER',
      ref_doc_no: order.order_number,
      item_id: order.item_id,
      batch_number: batchNo,
      lot_qty: completedRun,
      sample_size: Math.max(1, Math.ceil(completedRun * 0.1)),
      accepted_qty: completedRun,
      rejected_qty: 0,
      quarantine_qty: 0,
      status: 'ACCEPTED',
      inspector: window.State.currentUser.name,
      inspected_at: new Date().toISOString(),
      coa_number: `COA-FG-${Math.floor(1000 + Math.random() * 9000)}`,
      tests: [
        { param: 'Full Actuator Pressure Cycle Test', spec: '210 Bar Static Pressure', observed: '212 Bar', result: 'PASS' },
        { param: 'Electrical Insulation Resistance', spec: '> 50 MΩ @ 500V', observed: '180 MΩ', result: 'PASS' },
        { param: 'Torque Output Rating', spec: '1000 Nm ± 5%', observed: '1024 Nm', result: 'PASS' }
      ]
    });

    window.DB.logAudit(
      'FG_RECEIPT',
      'PRODUCTION',
      order.order_number,
      `Received ${completedRun} units of ${item?.code} (Batch: ${batchNo}). Finished goods stored in FGH-01.`
    );

    window.State.closeModal();
    window.State.showToast(`Completed ${completedRun} units of ${item?.code}! Stored in Finished Goods Hub.`);
    window.ProductionModule.render(document.getElementById('view-container'));
  },

  showCreateOrderModal() {
    this.switchTab('BOM');
    window.State.showToast('Select a BOM below and click "Launch Production Order" to initiate manufacturing.', 'info');
  },

  createOrderFromBOM(bomId) {
    const bom = window.DB.getById('boms', bomId);
    if (!bom) return;
    const item = window.DB.getById('items', bom.item_id);

    const targetPlantId = (window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId))
      ? window.State.currentPlantId
      : (window.DB.getActivePlants()[0]?.id || 'PLANT-01');

    const orderNumber = `PRD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const materials = (bom.components || []).map(c => ({
      item_id: c.item_id,
      required: c.qty * 10,
      issued: c.qty * 10,
      consumed: c.qty * 10,
      uom: c.uom
    }));

    window.DB.insert('productionOrders', {
      order_number: orderNumber,
      plant_id: targetPlantId,
      item_id: bom.item_id,
      bom_id: bom.id,
      target_qty: 10,
      completed_qty: 0,
      scrapped_qty: 0,
      planned_start: new Date().toISOString().split('T')[0],
      planned_end: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      status: 'RELEASED',
      priority: 'HIGH',
      materials: materials
    });

    window.DB.logAudit('CREATE_PROD_ORDER', 'PRODUCTION', orderNumber, `Launched Production Order ${orderNumber} for 10 units ${item?.code}.`);
    window.State.showToast(`Production Order ${orderNumber} created!`);
    this.switchTab('ORDERS');
  }
};
