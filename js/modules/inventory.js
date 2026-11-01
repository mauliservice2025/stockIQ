/* ==========================================================================
   ENTERPRISE ISCM - STAGE 7: CENTRAL INVENTORY CONTROL & STOCK LEDGER
   Multi-Facility Stock on Hand, Batch/Serial Tracking & FIFO/Avg Valuation
   ========================================================================== */

window.InventoryModule = {
  search: '',
  whFilter: 'ALL',
  statusFilter: 'ALL',

  render(container) {
    if (container) this.container = container;
    const target = this.container || document.getElementById('view-container') || document.getElementById('main-content');
    if (!target) return;

    const plantId = window.State.currentPlantId;
    const balances = window.DB.getAll('inventoryBalances').filter(b => {
      if (!window.DB.isPlantActive(b.plant_id)) return false;
      return plantId === 'ALL' || b.plant_id === plantId;
    });
    const items = window.DB.getAll('items');
    const warehouses = window.DB.getActiveWarehouses(plantId === 'ALL' ? undefined : plantId);

    let totalVal = 0;
    let totalOnHand = 0;
    let totalAvail = 0;
    let totalReserved = 0;

    balances.forEach(b => {
      totalVal += (b.on_hand || 0) * (b.valuation_rate || 0);
      totalOnHand += (b.on_hand || 0);
      totalAvail += (b.available || 0);
      totalReserved += (b.reserved || 0);
    });

    const searchLower = (this.search || '').toLowerCase().trim();
    const filteredBalances = balances.filter(b => {
      if (this.whFilter !== 'ALL' && b.warehouse_id !== this.whFilter) return false;
      if (this.statusFilter !== 'ALL' && b.stock_status !== this.statusFilter) return false;
      if (searchLower) {
        const item = window.DB.getById('items', b.item_id);
        const wh = window.DB.getById('warehouses', b.warehouse_id);
        const bin = window.DB.getById('bins', b.bin_id);
        const corpus = `${item?.code || ''} ${item?.name || ''} ${b.batch_number || ''} ${b.serial_number || ''} ${wh?.name || ''} ${wh?.code || ''} ${bin?.code || ''}`.toLowerCase();
        if (!corpus.includes(searchLower)) return false;
      }
      return true;
    });

    const paged = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filteredBalances, 'inventory')
      : { items: filteredBalances, totalRecords: filteredBalances.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    target.innerHTML = `
      ${window.renderInventoryLogisticsTabs ? window.renderInventoryLogisticsTabs('#/inventory') : ''}
      <div class="kpi-grid" style="display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 10px; margin-bottom: 12px; width: 100%;">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Active Stock Valuation</span>
            <div class="kpi-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="kpi-value">₹${totalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div class="kpi-footer">
            <span class="kpi-subtitle">FIFO Lot & Weighted Avg Calculated</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Physical Stock on Hand</span>
            <div class="kpi-icon-wrap cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
          </div>
          <div class="kpi-value">${Math.round(totalOnHand).toLocaleString('en-IN')} <span style="font-size:14px; color:var(--text-muted);">Units</span></div>
          <div class="kpi-footer">
            <span class="kpi-subtitle">Across ${warehouses.length} Warehouses</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Unrestricted Available</span>
            <div class="kpi-icon-wrap success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div class="kpi-value" style="color:var(--color-success);">${Math.round(totalAvail).toLocaleString('en-IN')} <span style="font-size:14px; color:var(--text-muted);">Units</span></div>
          <div class="kpi-footer">
            <span class="kpi-subtitle">Ready for Production & Sales</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Hard Allocated / Reserved</span>
            <div class="kpi-icon-wrap warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
          </div>
          <div class="kpi-value" style="color:var(--color-warning);">${Math.round(totalReserved).toLocaleString('en-IN')}</div>
          <div class="kpi-footer">
            <span class="kpi-subtitle">Committed to active work orders</span>
          </div>
        </div>
      </div>

      <!-- Main Stock Ledger Card -->
      <div class="content-card">
        <div class="card-header" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 10px 16px;">
          <div class="toolbar-left" style="display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; overflow-x: auto;">
            <div class="card-title" style="white-space: nowrap; margin-right: 2px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Stock Balance
            </div>

            <div style="position: relative; width: 220px; min-width: 170px;">
              <input type="text" id="inv-search" class="filter-input" style="width: 100%; height: 32px; padding-left: 28px !important; font-size: 12.5px;" placeholder="Search SKU, name, batch, bin..." value="${this.search || ''}" oninput="window.InventoryModule.onSearchInput(this.value)" onkeydown="if(event.key==='Enter') window.InventoryModule.filterTable()">
              <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 12px; pointer-events: none;">🔍</span>
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.InventoryModule.filterTable()" style="display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 12px; font-weight: 700; white-space: nowrap; font-size: 12px;">
              <span>Search</span>
            </button>
            <select id="inv-wh-filter" class="filter-select" style="width: auto; min-width: 140px; height: 32px; font-size: 12px;" onchange="window.InventoryModule.onWhFilterChange(this.value)">
              <option value="ALL" ${this.whFilter === 'ALL' ? 'selected' : ''}>All Warehouses</option>
              ${warehouses.map(w => `<option value="${w.id}" ${this.whFilter === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
            </select>
            <select id="inv-status-filter" class="filter-select" style="width: auto; min-width: 140px; height: 32px; font-size: 12px;" onchange="window.InventoryModule.onStatusFilterChange(this.value)">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Stock Statuses</option>
              <option value="AVAILABLE" ${this.statusFilter === 'AVAILABLE' ? 'selected' : ''}>Available</option>
              <option value="QUARANTINE" ${this.statusFilter === 'QUARANTINE' ? 'selected' : ''}>Quarantine / Hold</option>
              <option value="RESERVED" ${this.statusFilter === 'RESERVED' ? 'selected' : ''}>Committed / Reserved</option>
            </select>
            <button type="button" class="btn btn-ghost btn-sm" onclick="window.InventoryModule.resetFilters()" title="Reset Filters" style="height: 32px; padding: 0 8px; white-space: nowrap; font-size: 12px; color: var(--text-muted);">
              ✕ Reset
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap;">
            <button class="btn btn-secondary btn-sm" onclick="location.hash='#/warehouse-map'" style="height: 32px; padding: 0 10px; font-size: 12px; white-space: nowrap;">
              Visual Warehouse Map
            </button>
            <button class="btn btn-outline btn-sm" onclick="location.hash='#/opening-balance'" style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; height: 32px; padding: 0 10px; font-size: 12px; white-space: nowrap;">
              <span>⚖️</span> <span>Opening Balance</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="location.hash='#/transfers'" style="height: 32px; padding: 0 10px; font-size: 12px; white-space: nowrap;">
              + Stock Transfer
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="inv-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Warehouse & Bin</th>
                <th>Batch / Lot #</th>
                <th>Serial #</th>
                <th class="text-right">On-Hand</th>
                <th class="text-right">Reserved</th>
                <th class="text-right">Available</th>
                <th class="text-right">Unit Valuation</th>
                <th class="text-right">Total Value</th>
                <th>Condition</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${paged.items.length === 0 ? `
                <tr><td colspan="12" style="text-align:center; padding:30px; color:var(--text-muted);">No stock recorded matching criteria.</td></tr>
              ` : paged.items.map(b => {
                const item = window.DB.getById('items', b.item_id);
                const wh = window.DB.getById('warehouses', b.warehouse_id);
                const bin = window.DB.getById('bins', b.bin_id);
                const lineVal = (b.on_hand || 0) * (b.valuation_rate || 0);

                return `
                  <tr data-wh="${b.warehouse_id}" data-status="${b.stock_status}">
                    <td class="cell-strong" style="white-space: nowrap;">
                      <span class="cell-mono font-bold" style="color: var(--primary-300);">${item ? item.code : b.item_id}</span>
                    </td>
                    <td style="font-weight: 600; color: var(--text-primary); min-width: 180px;">
                      ${item ? item.name : '—'}
                    </td>
                    <td>
                      <b>${wh ? wh.code : 'WH'}</b><br>
                      <span class="cell-mono" style="color:var(--primary-300); font-size:11px;">${bin ? bin.code : b.bin_id}</span>
                    </td>
                    <td class="cell-mono" style="font-weight:700;">${b.batch_number}</td>
                    <td class="cell-mono" style="color:var(--text-muted);">${b.serial_number || 'N/A'}</td>
                    <td class="cell-num" style="font-weight:800; color:var(--text-primary);">${b.on_hand} ${item ? item.base_uom : ''}</td>
                    <td class="cell-num" style="color:var(--color-warning);">${b.reserved}</td>
                    <td class="cell-num" style="font-weight:800; color:var(--color-success);">${b.available}</td>
                    <td class="cell-num">₹${Number(b.valuation_rate || 0).toLocaleString('en-IN')}</td>
                    <td class="cell-num" style="font-weight:700; color:var(--primary-200);">₹${Math.round(lineVal).toLocaleString('en-IN')}</td>
                    <td>
                      <span class="status-pill ${
                        b.stock_status === 'AVAILABLE' ? 'status-approved' :
                        b.stock_status === 'QUARANTINE' ? 'status-quarantine' : 'status-pending'
                      }">
                        ${b.stock_status}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.InventoryModule.printLabel('${b.id}')" title="Print Barcode Tag">
                          🏷️
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
          key: 'inventory',
          pagination: paged,
          onPageChange: 'window.InventoryModule.setPage',
          onPageSizeChange: 'window.InventoryModule.setPageSize'
        }) : ''}
      </div>
    `;
  },

  onSearchInput(val) {
    this.search = val;
  },

  onWhFilterChange(val) {
    this.whFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('inventory');
    this.render();
  },

  onStatusFilterChange(val) {
    this.statusFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('inventory');
    this.render();
  },

  setPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('inventory', page);
    this.render();
  },

  setPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('inventory', size);
    this.render();
  },

  filterTable() {
    this.search = document.getElementById('inv-search')?.value || '';
    this.whFilter = document.getElementById('inv-wh-filter')?.value || 'ALL';
    this.statusFilter = document.getElementById('inv-status-filter')?.value || 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('inventory');
    this.render();
  },

  resetFilters() {
    this.search = '';
    this.whFilter = 'ALL';
    this.statusFilter = 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('inventory');
    this.render();
  },

  printLabel(balanceId) {
    const balance = window.DB.getById('inventoryBalances', balanceId);
    if (!balance) return;
    const item = window.DB.getById('items', balance.item_id);
    const bin = window.DB.getById('bins', balance.bin_id);

    window.State.showModal({
      title: `🏷️ Industrial Barcode & Pallet Identification Label`,
      maxWidth: '500px',
      contentHtml: `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div class="barcode-preview-box" id="print-label-target" style="width:100%; max-width:380px;">
            <div style="display:flex; justify-content:space-between; width:100%; border-bottom:2px solid #000; padding-bottom:6px;">
              <span style="font-weight:900; font-size:14px; color:#4f46e5;">StockIQ</span>
              <span style="font-weight:700; font-size:12px;">PLANT-01</span>
            </div>
            
            <div style="text-align:center; margin:8px 0;">
              <div style="font-size:16px; font-weight:900;">${item?.code}</div>
              <div style="font-size:11px; font-weight:600;">${item?.name}</div>
            </div>

            <div class="barcode-lines"></div>
            <div style="font-size:12px; font-weight:700; letter-spacing:2px;">*${balance.batch_number}*</div>

            <div style="display:grid; grid-template-columns:1fr 1fr; width:100%; font-size:11px; border-top:1px solid #000; margin-top:8px; padding-top:6px;">
              <div><b>BIN:</b> ${bin?.code || balance.bin_id}</div>
              <div><b>QTY:</b> ${balance.on_hand} ${item?.base_uom}</div>
              <div><b>MFG:</b> ${window.formatDate(balance.mfg_date || '2026-08')}</div>
              <div><b>EXP:</b> ${balance.expiry_date ? window.formatDate(balance.expiry_date) : 'N/A'}</div>
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.print()">Print Thermal Label</button>
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      `
    });
  }
};
