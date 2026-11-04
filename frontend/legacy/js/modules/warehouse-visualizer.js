/* ==========================================================================
   ENTERPRISE ISCM - VISUAL 2D/3D WAREHOUSE & BIN OCCUPANCY HEATMAP
   Visual Rack / Shelf / Bin Navigator, Heatmap Colors & Bin Details
   ========================================================================== */

window.WarehouseVisualizerModule = {
  activeWarehouseId: 'WH-PUN-SPARE',

  render(container) {
    const plantId = window.State.currentPlantId;
    const warehouses = window.DB.getAll('warehouses').filter(w => plantId === 'ALL' || w.plant_id === plantId || w.plantId === plantId);
    const wh = (warehouses.find(w => w.id === this.activeWarehouseId)) || warehouses[0] || {};
    const bins = window.DB.getAll('bins').filter(b => b.warehouse_id === wh.id);
    const zones = window.DB.getAll('zones').filter(z => z.warehouse_id === wh.id);
    const balances = window.DB.getAll('inventoryBalances').filter(b => b.warehouse_id === wh.id);

    // Stats
    const totalBins = bins.length;
    const occupiedBins = bins.filter(b => b.occupied_pct > 0).length;
    const avgUtilization = totalBins > 0 ? Math.round(bins.reduce((acc, b) => acc + (b.occupied_pct || 0), 0) / totalBins) : 0;

    // Group bins by rack and shelf
    const racksMap = {};
    bins.forEach(bin => {
      const rackKey = bin.rack || 'RACK-01';
      const shelfKey = bin.shelf || 'SHELF-01';
      if (!racksMap[rackKey]) racksMap[rackKey] = {};
      if (!racksMap[rackKey][shelfKey]) racksMap[rackKey][shelfKey] = [];
      racksMap[rackKey][shelfKey].push(bin);
    });

    container.innerHTML = `
      <div class="warehouse-visualizer-container">
        <!-- Warehouse Controls & Metrics Bar -->
        <div class="warehouse-header-controls">
          <div style="display:flex; align-items:center; gap:16px;">
            <div>
              <label class="form-label" style="font-size:11px;">Active Storage Facility:</label>
              <select id="wh-visual-select" class="filter-select" style="font-size:13px; font-weight:700;" onchange="window.WarehouseVisualizerModule.switchWarehouse(this.value)">
                ${warehouses.map(w => `<option value="${w.id}" ${w.id === wh.id ? 'selected' : ''}>${w.name} (${w.code})</option>`).join('')}
              </select>
            </div>
            <div class="meta-stat-item">
              <span class="meta-stat-label">Manager</span>
              <span class="meta-stat-value" style="font-size:13px;">${wh.manager || 'Rajesh Sharma'}</span>
            </div>
          </div>

          <div class="warehouse-meta-info">
            <div class="meta-stat-item">
              <span class="meta-stat-label">Total Bins</span>
              <span class="meta-stat-value">${totalBins}</span>
            </div>
            <div class="meta-stat-item">
              <span class="meta-stat-label">Occupied Bins</span>
              <span class="meta-stat-value" style="color:var(--primary-300);">${occupiedBins}</span>
            </div>
            <div class="meta-stat-item">
              <span class="meta-stat-label">Warehouse Utilization</span>
              <span class="meta-stat-value" style="color:${avgUtilization > 80 ? 'var(--color-danger)' : 'var(--color-success)'};">${avgUtilization}%</span>
            </div>
            <div class="meta-stat-item">
              <span class="meta-stat-label">Max Capacity</span>
              <span class="meta-stat-value">${wh.capacity_cbm || 3000} CBM</span>
            </div>
          </div>

          <!-- Color Heatmap Legend -->
          <div class="warehouse-legend">
            <div class="legend-item"><div class="legend-swatch empty"></div> Empty (0%)</div>
            <div class="legend-item"><div class="legend-swatch normal"></div> Normal (<60%)</div>
            <div class="legend-item"><div class="legend-swatch high"></div> High (60-85%)</div>
            <div class="legend-item"><div class="legend-swatch full"></div> Full (>85%)</div>
            <div class="legend-item"><div class="legend-swatch quarantine"></div> Quarantine</div>
          </div>
        </div>

        <!-- Racks & Shelves Visual Layout Grid -->
        <div class="racks-container">
          ${Object.keys(racksMap).length === 0 ? `
            <div class="content-card" style="padding:40px; text-align:center; color:var(--text-muted);">
              No visual bin mapping configured for this warehouse facility.
            </div>
          ` : Object.keys(racksMap).map(rackKey => `
            <div class="rack-section">
              <div class="rack-header">
                <div class="rack-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  Storage Aisle & Rack: <b>${rackKey}</b>
                </div>
                <span style="font-size:11px; color:var(--text-muted);">Heavy Industrial Pallet Racking</span>
              </div>

              <div class="shelves-container">
                ${Object.keys(racksMap[rackKey]).map(shelfKey => `
                  <div class="shelf-row">
                    <div class="shelf-label">${shelfKey}</div>
                    <div class="bins-row">
                      ${racksMap[rackKey][shelfKey].map(bin => {
                        const binBalances = balances.filter(b => b.bin_id === bin.id);
                        const firstBal = binBalances[0];
                        const item = firstBal ? window.DB.getById('items', firstBal.item_id) : null;
                        const totalQty = binBalances.reduce((acc, b) => acc + (b.on_hand || 0), 0);

                        return `
                          <div class="bin-cell ${bin.status || (bin.occupied_pct === 0 ? 'empty' : 'normal')}" onclick="window.WarehouseVisualizerModule.inspectBin('${bin.id}')" title="Click to inspect bin ${bin.code}">
                            <div>
                              <div class="bin-code">${bin.code}</div>
                              <div class="bin-sku">${item ? item.code : (bin.occupied_pct > 0 ? 'Stored Stock' : 'Vacant')}</div>
                            </div>
                            <div>
                              <div class="bin-qty">${totalQty > 0 ? `${totalQty} ${item?.base_uom || ''}` : 'Empty'}</div>
                              <div class="bin-progress-bar">
                                <div class="bin-progress-fill ${bin.status || 'normal'}" style="width: ${bin.occupied_pct || 0}%;"></div>
                              </div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  switchWarehouse(whId) {
    this.activeWarehouseId = whId;
    this.render(document.getElementById('view-container'));
  },

  inspectBin(binId) {
    const bin = window.DB.getById('bins', binId);
    if (!bin) return;
    const balances = window.DB.getAll('inventoryBalances').filter(b => b.bin_id === bin.id);

    window.State.showModal({
      title: `Bin Inspection: ${bin.code}`,
      maxWidth: '700px',
      contentHtml: `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px; background:var(--bg-surface); padding:16px; border-radius:var(--radius-md);">
            <div><span style="font-size:11px; color:var(--text-muted);">Bin Code:</span><br><b class="cell-mono">${bin.code}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Rack & Shelf:</span><br><b>${bin.rack} / ${bin.shelf}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Current Occupancy:</span><br><b style="color:${bin.occupied_pct > 80 ? 'var(--color-danger)' : 'var(--color-success)'};">${bin.occupied_pct || 0}%</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Max Weight:</span><br><b>${bin.max_weight || 1000} KG</b></div>
          </div>

          <div>
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:8px;">Inventory Stored in this Bin</div>
            ${balances.length === 0 ? `
              <div style="padding:20px; text-align:center; color:var(--text-muted); background:var(--bg-input); border-radius:var(--radius-sm);">
                Bin is currently vacant and ready for Putaway.
              </div>
            ` : `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Batch / Lot</th>
                    <th class="text-right">On-Hand</th>
                    <th class="text-right">Available</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${balances.map(b => {
                    const item = window.DB.getById('items', b.item_id);
                    return `
                      <tr>
                        <td class="cell-mono cell-strong">${item?.code}</td>
                        <td class="cell-mono">${b.batch_number}</td>
                        <td class="cell-num">${b.on_hand} ${item?.base_uom}</td>
                        <td class="cell-num" style="color:var(--color-success); font-weight:800;">${b.available}</td>
                        <td><span class="status-pill status-approved">${b.stock_status}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
        <button class="btn btn-primary" onclick="window.State.closeModal(); location.hash='#/putaway'">
          Direct Putaway Here →
        </button>
      `
    });
  }
};
