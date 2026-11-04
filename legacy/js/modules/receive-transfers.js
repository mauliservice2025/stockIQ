/* ==========================================================================
   ENTERPRISE ISCM - STAGE 11.2: RECEIVE STOCK TRANSFER (BRD COMPLIANT)
   Destination Store Stock Inward, Discrepancy Capture, Bin Allocation & Ledger Posting
   ========================================================================== */

window.ReceiveTransfersModule = {
  _activeTab: 'PENDING',
  _editingReceiptId: null,
  _search: '',
  _fromDate: '',
  getTodayDateStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  setTodayFilter() {
    const today = this.getTodayDateStr();
    this._fromDate = today;
    this._toDate = today;
    if (window.PaginationHelper) window.PaginationHelper.reset('receive-transfers');
    this.render();
  },

  setAllDatesFilter() {
    this._fromDate = 'ALL';
    this._toDate = 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('receive-transfers');
    this.render();
  },

  render(container) {
    if (container) this.container = container;
    const target = this.container || document.getElementById('view-container') || document.getElementById('main-content');
    if (!target) return;

    if (!this._fromDate && this._fromDate !== 'ALL') this._fromDate = this.getTodayDateStr();
    if (!this._toDate && this._toDate !== 'ALL') this._toDate = this.getTodayDateStr();
    const displayFrom = this._fromDate === 'ALL' ? '' : this._fromDate;
    const displayTo = this._toDate === 'ALL' ? '' : this._toDate;

    const plantId = window.State.currentPlantId;
    const allTransfers = window.DB.getAll('stockTransfers') || [];
    
    // Filter transfers by destination plant (or source plant if ALL)
    const transfers = allTransfers.filter(t => {
      if (!window.DB.isPlantActive(t.source_plant_id) || !window.DB.isPlantActive(t.dest_plant_id)) return false;
      return plantId === 'ALL' || t.dest_plant_id === plantId || t.source_plant_id === plantId;
    });

    const plants = window.DB.getActivePlants() || [];
    const warehouses = window.DB.getActiveWarehouses() || [];
    const destWarehouses = warehouses.filter(w => plantId === 'ALL' || !w.plant_id || w.plant_id === plantId);

    // Compute summary KPI counts
    const pendingCount = transfers.filter(t => t.status === 'IN_TRANSIT').length;
    const partialCount = transfers.filter(t => t.status === 'PARTIALLY_RECEIVED').length;
    const completedCount = transfers.filter(t => t.status === 'RECEIVED').length;
    const discrepancyCount = transfers.filter(t => t.has_discrepancy || t.status === 'DISCREPANCY_PENDING').length;

    const searchLower = (this._search || '').toLowerCase().trim();
    const filtered = transfers.filter(t => {
      if (this._storeFilter !== 'ALL' && (t.dest_warehouse_id || '') !== this._storeFilter) return false;

      const rawDate = t.dispatched_at || t.created_at || '';
      let isoDate = '';
      if (rawDate) {
        try { isoDate = new Date(rawDate).toISOString().split('T')[0]; } catch(e) { isoDate = String(rawDate).slice(0, 10); }
      }
      if (this._fromDate && this._fromDate !== 'ALL' && isoDate && isoDate < this._fromDate) return false;
      if (this._toDate && this._toDate !== 'ALL' && isoDate && isoDate > this._toDate) return false;

      // Active tab
      if (this._activeTab === 'PENDING' && t.status !== 'IN_TRANSIT') return false;
      if (this._activeTab === 'PARTIAL' && t.status !== 'PARTIALLY_RECEIVED') return false;
      if (this._activeTab === 'COMPLETED' && t.status !== 'RECEIVED') return false;
      if (this._activeTab === 'DISCREPANCY' && !t.has_discrepancy && t.status !== 'DISCREPANCY_PENDING') return false;

      if (searchLower) {
        const sPlant = window.DB.getById('plants', t.source_plant_id);
        const dPlant = window.DB.getById('plants', t.dest_plant_id);
        const sWh = window.DB.getById('warehouses', t.source_warehouse_id);
        const dWh = window.DB.getById('warehouses', t.dest_warehouse_id);
        const items = t.items || [];
        const corpus = `${t.transfer_number || ''} ${sPlant?.name || ''} ${sPlant?.code || ''} ${sWh?.name || ''} ${dPlant?.name || ''} ${dPlant?.code || ''} ${dWh?.name || ''} ${t.vehicle_no || ''} ${t.transporter || ''} ${items.map(i => (i.code || '') + ' ' + (i.name || '')).join(' ')}`.toLowerCase();
        if (!corpus.includes(searchLower)) return false;
      }

      return true;
    });

    const paged = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'receive-transfers')
      : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    target.innerHTML = `
      ${window.renderInventoryLogisticsTabs ? window.renderInventoryLogisticsTabs('#/receive-transfers') : ''}
      
      <div class="content-card">
        <!-- Header Toolbar with Master Name, Count Badge & Filters (Matching Manufacturer Master) -->
        <!-- Header Toolbar with Master Title, Count Badge & Inline Filters on a Single Line -->
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; padding: 10px 16px; border-bottom: 1px solid var(--border-subtle, #e2e8f0);">
          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <span style="font-size: 15px; font-weight: 700; color: var(--text-primary); white-space: nowrap;">Receive Stock Transfer</span>
            <span class="badge badge-primary" style="font-size: 11px; white-space: nowrap;">${filtered.length} of ${transfers.length} Transfers</span>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <!-- Receipt Status Filter Dropdown -->
            <select id="rcv-status-dropdown" class="filter-select form-control form-control-sm" onchange="window.ReceiveTransfersModule.switchTab(this.value)" style="width: auto; height: 32px; font-size: 12px; margin: 0; padding: 2px 8px; cursor: pointer;">
              <option value="PENDING" ${this._activeTab === 'PENDING' ? 'selected' : ''}>Pending Inward (${pendingCount})</option>
              <option value="PARTIAL" ${this._activeTab === 'PARTIAL' ? 'selected' : ''}>Partially Received (${partialCount})</option>
              <option value="COMPLETED" ${this._activeTab === 'COMPLETED' ? 'selected' : ''}>Completed Receipts (${completedCount})</option>
              <option value="DISCREPANCY" ${this._activeTab === 'DISCREPANCY' ? 'selected' : ''}>Discrepancies (${discrepancyCount})</option>
              <option value="ALL" ${this._activeTab === 'ALL' ? 'selected' : ''}>All Transfers (${transfers.length})</option>
            </select>

            <!-- Destination Store Filter -->
            <select id="rcv-store-filter" class="filter-select form-control form-control-sm" onchange="window.ReceiveTransfersModule.onStoreFilterChange(this.value)" style="width: auto; max-width: 150px; height: 32px; font-size: 12px; margin: 0; padding: 2px 8px;">
              <option value="ALL" ${this._storeFilter === 'ALL' ? 'selected' : ''}>All Destination Stores</option>
              ${destWarehouses.map(w => `<option value="${w.id}" ${this._storeFilter === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
            </select>

            <!-- From Date -->
            <div style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
              <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">From Date:</span>
              <input type="date" id="rcv-from-date" class="filter-input form-control form-control-sm" style="height: 32px; font-size: 11.5px; margin: 0; padding: 2px 6px; width: 120px;" value="${displayFrom}" onchange="window.ReceiveTransfersModule.onFromDateChange(this.value)" title="Filter by Dispatch Date From (Default: Today)">
            </div>

            <!-- To Date -->
            <div style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
              <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">To Date:</span>
              <input type="date" id="rcv-to-date" class="filter-input form-control form-control-sm" style="height: 32px; font-size: 11.5px; margin: 0; padding: 2px 6px; width: 120px;" value="${displayTo}" onchange="window.ReceiveTransfersModule.onToDateChange(this.value)" title="Filter by Dispatch Date To (Default: Today)">
            </div>

            <div style="display: inline-flex; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); overflow: hidden; height: 32px;">
              <button 
                type="button" 
                class="btn btn-xs ${(this._fromDate === this.getTodayDateStr() && this._toDate === this.getTodayDateStr()) ? 'btn-primary' : 'btn-ghost'}" 
                style="padding: 0 8px; font-size: 11px; border-radius: 0; font-weight: 600; height: 30px;"
                onclick="window.ReceiveTransfersModule.setTodayFilter()"
                title="Show Today's Transfers"
              >Today</button>
              <button 
                type="button" 
                class="btn btn-xs ${(this._fromDate === 'ALL' || (!this._fromDate && !this._toDate)) ? 'btn-primary' : 'btn-ghost'}" 
                style="padding: 0 8px; font-size: 11px; border-radius: 0; font-weight: 600; height: 30px;"
                onclick="window.ReceiveTransfersModule.setAllDatesFilter()"
                title="Show All Dates"
              >All</button>
            </div>

            <!-- Search Input with Magnifier Icon -->
            <div style="position: relative; width: 180px;">
              <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-muted); pointer-events: none;">🔍</span>
              <input 
                type="text" 
                id="rcv-search" 
                class="form-control form-control-sm" 
                style="padding-left: 28px !important; padding-right: 8px !important; height: 32px; font-size: 12px; margin: 0; width: 100%;" 
                placeholder="Search transfer #, vehicle..." 
                value="${this._search || ''}" 
                oninput="window.ReceiveTransfersModule.onSearchInput(this.value)" 
                onkeydown="if(event.key==='Enter') window.ReceiveTransfersModule.filterTable()"
              />
            </div>

            <!-- Reset Button -->
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.ReceiveTransfersModule.resetFilters()" title="Reset Filters" style="height: 32px; padding: 0 10px; font-size: 12px; white-space: nowrap;">
              Reset
            </button>
          </div>
        </div>

        <!-- Stock Transfer Inward Register Table -->
        <div class="table-responsive" style="min-height: 320px;">
          <table class="data-table" id="rcv-table">
            <thead>
              <tr>
                <th style="width: 45px; text-align: center;">#</th>
                <th style="min-width: 120px;">Transfer #</th>
                <th style="min-width: 100px;">Dispatch Date</th>
                <th>From Facility</th>
                <th>From Store</th>
                <th>To Facility</th>
                <th>To Store</th>
                <th style="text-align: right; width: 80px;">Items</th>
                <th style="text-align: right; width: 95px;">Dispatched</th>
                <th style="text-align: right; width: 95px;">Received</th>
                <th style="text-align: right; width: 95px;">Pending</th>
                <th style="width: 120px; text-align: center;">Status</th>
                <th style="min-width: 160px; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${paged.items.length === 0 ? `
                <tr><td colspan="13" style="text-align:center; padding:36px; color:var(--text-muted);">No stock transfers awaiting receipt matching criteria.</td></tr>
              ` : paged.items.map((t, idx) => {
                const sPlant = window.DB.getById('plants', t.source_plant_id);
                const dPlant = window.DB.getById('plants', t.dest_plant_id);
                const sWh = window.DB.getById('warehouses', t.source_warehouse_id);
                const dWh = window.DB.getById('warehouses', t.dest_warehouse_id);

                const items = t.items || [];
                const totalItems = items.length;
                const totalDispatched = items.reduce((sum, i) => sum + Number(i.dispatched || i.requested || 0), 0);
                const totalReceived = items.reduce((sum, i) => sum + Number(i.received || 0), 0);
                const pendingQty = Math.max(0, totalDispatched - totalReceived);

                const canReceive = t.status === 'IN_TRANSIT' || t.status === 'PARTIALLY_RECEIVED';

                return `
                  <tr data-status="${t.status}">
                    <td style="text-align: center; color: var(--text-muted);">${(paged.currentPage - 1) * paged.pageSize + idx + 1}</td>
                    <td class="cell-mono cell-strong">
                      <a href="javascript:void(0)" onclick="window.ReceiveTransfersModule.viewTransfer('${t.id}')" style="color:var(--primary-400); text-decoration:none; font-weight:700;">
                        ${t.transfer_number}
                      </a>
                    </td>
                    <td>${t.dispatched_at ? window.formatDate(t.dispatched_at) : 'Pending'}</td>
                    <td>
                      <b>${sPlant ? (sPlant.name || sPlant.code) : 'Facility'}</b>
                    </td>
                    <td><b>${sWh ? sWh.name : 'Main Store'}</b></td>
                    <td>
                      <b>${dPlant ? (dPlant.name || dPlant.code) : 'Facility'}</b>
                    </td>
                    <td><b>${dWh ? dWh.name : 'Destination Store'}</b></td>
                    <td class="cell-num text-right" style="font-weight: 600;">${totalItems}</td>
                    <td class="cell-num text-right" style="font-weight: 700; color: var(--primary-400);">${totalDispatched}</td>
                    <td class="cell-num text-right" style="font-weight: 700; color: #10b981;">${totalReceived}</td>
                    <td class="cell-num text-right" style="font-weight: 800; color: ${pendingQty > 0 ? '#ef4444' : '#10b981'};">${pendingQty}</td>
                    <td style="text-align: center;">
                      <span class="status-pill ${
                        t.status === 'RECEIVED' ? 'status-approved' :
                        t.status === 'PARTIALLY_RECEIVED' ? 'status-pending' :
                        t.status === 'IN_TRANSIT' ? 'status-in-transit' : 'status-draft'
                      }">
                        ${t.status === 'IN_TRANSIT' ? 'IN TRANSIT' : t.status.replace(/_/g, ' ')}
                      </span>
                      ${t.has_discrepancy ? `<div style="font-size: 10px; color: #ef4444; font-weight: 700; margin-top: 2px;">⚠️ Discrepancy</div>` : ''}
                    </td>
                    <td>
                      <div style="display:flex; gap:5px; align-items:center; justify-content:center; flex-wrap:nowrap;">
                        ${canReceive ? `
                          <button class="btn btn-success btn-sm" onclick="window.ReceiveTransfersModule.openReceiveModal('${t.id}')" title="Receive Stock into Store" style="padding: 3px 10px; font-size: 11.5px; font-weight: 700;">
                            📥 Receive
                          </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm" onclick="window.ReceiveTransfersModule.viewTransfer('${t.id}')" title="View Transfer Details" style="padding: 3px 8px; font-size: 11.5px;">
                          View
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.ReceiveTransfersModule.viewReceiptHistory('${t.id}')" title="View Inward History & Discrepancies" style="padding: 3px 8px; font-size: 11.5px;">
                          History
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.ReceiveTransfersModule.printTransfer('${t.id}')" title="Print Inward Gate Pass" style="padding: 3px 8px; font-size: 11.5px;">
                          Print
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
          key: 'receive-transfers',
          pagination: paged,
          onPageChange: 'window.ReceiveTransfersModule.setPage',
          onPageSizeChange: 'window.ReceiveTransfersModule.setPageSize'
        }) : ''}
      </div>
    `;
  },

  switchTab(tab) {
    this._activeTab = tab;
    if (window.PaginationHelper) window.PaginationHelper.reset('receive-transfers');
    this.render();
  },

  onSearchInput(val) {
    this._search = val;
  },

  onFromDateChange(val) {
    this._fromDate = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('receive-transfers');
    this.render();
  },

  onToDateChange(val) {
    this._toDate = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('receive-transfers');
    this.render();
  },

  onStoreFilterChange(val) {
    this._storeFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('receive-transfers');
    this.render();
  },

  setPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('receive-transfers', page);
    this.render();
  },

  setPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('receive-transfers', size);
    this.render();
  },

  filterTable() {
    this._search = (document.getElementById('rcv-search')?.value || '').toLowerCase().trim();
    this._fromDate = document.getElementById('rcv-from-date')?.value || '';
    this._toDate = document.getElementById('rcv-to-date')?.value || '';
    this._storeFilter = document.getElementById('rcv-store-filter')?.value || 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('receive-transfers');
    this.render();
  },

  resetFilters() {
    this._search = '';
    this._fromDate = this.getTodayDateStr();
    this._toDate = this.getTodayDateStr();
    this._storeFilter = 'ALL';
    this._activeTab = 'PENDING';
    if (window.PaginationHelper) window.PaginationHelper.reset('receive-transfers');
    this.render();
  },

  openReceiveModal(trfId) {
    const t = window.DB.getById('stockTransfers', trfId);
    if (!t) {
      window.State.showToast('Transfer record not found.', 'error');
      return;
    }

    const sPlant = window.DB.getById('plants', t.source_plant_id);
    const dPlant = window.DB.getById('plants', t.dest_plant_id);
    const sWh = window.DB.getById('warehouses', t.source_warehouse_id);
    const dWh = window.DB.getById('warehouses', t.dest_warehouse_id);
    const currentUser = (window.State.getCurrentUser && window.State.getCurrentUser()) || { name: 'Store Officer' };
    const today = (window.DB && typeof window.DB.getTodayDateStr === 'function') ? window.DB.getTodayDateStr() : new Date().toLocaleDateString('en-CA');
    const receiptNo = `RTS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const items = (t.items || []).map(i => {
      const itemObj = window.DB.getById('items', i.item_id) || {};
      const dispatched = Number(i.dispatched || i.requested || 0);
      const previouslyReceived = Number(i.received || 0);
      const pending = Math.max(0, dispatched - previouslyReceived);
      return {
        ...i,
        name: itemObj.name || i.name || i.item_name || 'Material Item',
        code: itemObj.code || i.code || i.item_code || '',
        category: itemObj.category || 'Spare Part',
        uom: i.uom || itemObj.base_uom || 'PCS',
        dispatched_qty: dispatched,
        prev_received_qty: previouslyReceived,
        pending_qty: pending,
        current_physical_qty: pending,
        accepted_qty: pending,
        short_qty: 0,
        damaged_qty: 0,
        bin_id: 'BIN-RMS-A01-01',
        remarks: ''
      };
    });

    this._activeReceivingItems = items;

    const contentHtml = `
      <form id="receive-trf-form" onsubmit="window.ReceiveTransfersModule.submitReceipt(event, '${t.id}')" style="display:flex; flex-direction:column; gap:8px; padding:0; height:100%; flex:1; min-height:0;">
        <!-- Header Information Card -->
        <div style="background:var(--bg-surface, #ffffff); border:1px solid var(--border-subtle, #e2e8f0); border-radius:6px; padding:8px 12px; flex-shrink:0;">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
            <div>
              <span style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Receipt Number</span><br>
              <b class="cell-mono" style="color:var(--primary-400); font-size:13px;" id="rcv-doc-num">${receiptNo}</b>
            </div>
            <div>
              <span style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Stock Transfer #</span><br>
              <b class="cell-mono" style="font-size:13px;">${t.transfer_number}</b>
            </div>
            <div>
              <span style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">From Facility & Store</span><br>
              <b>${sPlant?.name || 'Facility'}</b><br>
              <span style="font-size:11px; color:var(--text-muted);">${sWh?.name || 'Main Store'}</span>
            </div>
            <div>
              <span style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">To Facility & Store</span><br>
              <b style="color:var(--color-info);">${dPlant?.name || 'Destination'}</b><br>
              <span style="font-size:11px; color:var(--text-muted);">${dWh?.name || 'Receiving Store'}</span>
            </div>
            <div>
              <span style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Dispatch Date</span><br>
              <b>${t.dispatched_at ? window.formatDate(t.dispatched_at) : 'N/A'}</b>
            </div>
            <div>
              <label class="form-label" style="font-size:11px; font-weight:600; margin-bottom:2px;">Receipt Date <span class="required">*</span></label>
              <input type="date" id="rcv-actual-date" class="form-control" value="${today}" style="height:30px; font-size:12px;" required>
            </div>
            <div>
              <label class="form-label" style="font-size:11px; font-weight:600; margin-bottom:2px;">Receiving Officer</label>
              <input type="text" id="rcv-officer" class="form-control" value="${currentUser.display_name || currentUser.name || 'Store Officer'}" style="height:30px; font-size:12px;" required>
            </div>
            <div>
              <label class="form-label" style="font-size:11px; font-weight:600; margin-bottom:2px;">Vehicle / Transport Ref</label>
              <input type="text" id="rcv-vehicle-ref" class="form-control" value="${t.vehicle_no || ''}" placeholder="Vehicle or delivery reference" style="height:30px; font-size:12px;">
            </div>
          </div>
        </div>

        <!-- Verification & Items Detail Table -->
        <div style="background:var(--bg-surface, #ffffff); border:1px solid var(--border-subtle, #e2e8f0); border-radius:6px; padding:8px 12px; flex:1; display:flex; flex-direction:column; min-height:0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-shrink:0;">
            <div style="font-weight:700; font-size:13px; color:var(--text-primary);">Verify Inward Items & Quantities</div>
            <div style="font-size:11.5px; color:var(--text-muted);">
              Enter physical received count. System automatically detects shortages and damages.
            </div>
          </div>

          <div class="table-responsive" style="flex:1; min-height:0; overflow-y:auto; border:1px solid var(--border-subtle, #e2e8f0); border-radius:6px; display:flex; flex-direction:column;">
            <table class="data-table" style="font-size:12px; margin:0; width:100%;">
              <thead>
                <tr style="background:rgba(0,0,0,0.02);">
                  <th style="width:40px; text-align:center;">#</th>
                  <th style="min-width:180px;">Material Item</th>
                  <th style="width:120px;">Batch / Lot</th>
                  <th style="width:65px;">UOM</th>
                  <th style="width:85px; text-align:right;">Dispatched</th>
                  <th style="width:85px; text-align:right;">Prev Recv</th>
                  <th style="width:85px; text-align:right;">Pending</th>
                  <th style="width:95px; text-align:right;">Physical Qty</th>
                  <th style="width:95px; text-align:right;">Accepted Qty</th>
                  <th style="width:80px; text-align:right;">Short Qty</th>
                  <th style="width:85px; text-align:right;">Damaged</th>
                  <th style="width:110px;">Destination Bin</th>
                  <th style="min-width:130px;">Line Remarks</th>
                </tr>
              </thead>
              <tbody id="rcv-items-tbody">
                ${this.renderReceiveItemsRows(items)}
              </tbody>
            </table>
          </div>

          <!-- Real-Time Discrepancy Reconciliation Summary -->
          <div id="rcv-reconciliation-bar" style="margin-top:10px; padding:10px 14px; background:rgba(59, 130, 246, 0.05); border:1px solid rgba(59, 130, 246, 0.2); border-radius:6px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; gap:16px; font-size:12px; align-items:center;">
              <span>Total Dispatched: <strong id="rcv-sum-dispatched">0</strong></span>
              <span>Pending Qty: <strong id="rcv-sum-pending" style="color:#ef4444;">0</strong></span>
              <span>Accepted Now: <strong id="rcv-sum-accepted" style="color:#10b981;">0</strong></span>
              <span>Short Qty: <strong id="rcv-sum-short" style="color:#f59e0b;">0</strong></span>
              <span>Damaged Qty: <strong id="rcv-sum-damaged" style="color:#ef4444;">0</strong></span>
            </div>
            <div id="rcv-discrepancy-badge" style="display:none; font-size:11.5px; font-weight:700; color:#ef4444; background:rgba(239, 68, 68, 0.1); padding:3px 10px; border-radius:4px; border:1px solid rgba(239, 68, 68, 0.3);">
              ⚠️ Discrepancy will be logged to Discrepancy Register
            </div>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="flex: 1; max-width: 560px; min-width: 260px; display: flex; align-items: center; gap: 8px;">
          <label for="rcv-general-remarks" style="font-size: 11.5px; font-weight: 600; white-space: nowrap; margin: 0; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
            <span>📝</span> Inward Remarks:
          </label>
          <input type="text" id="rcv-general-remarks" form="receive-trf-form" class="form-control" style="font-size: 12px; height: 32px; padding: 4px 10px; flex: 1;" placeholder="Optional inward inspection remarks...">
        </div>
        <div style="display: flex; gap: 8px; align-items: center; margin-left: auto;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.State.closeModal()" style="height: 32px; padding: 0 14px;">Cancel</button>
          <button type="submit" form="receive-trf-form" class="btn btn-success btn-sm" style="font-weight: 700; height: 32px; padding: 0 18px;">
            Confirm & Post Stock Receipt
          </button>
        </div>
      </div>
    `;

    window.State.showModal({
      title: `Receive Stock Transfer: ${t.transfer_number}`,
      isFullScreen: true,
      maxWidth: '100vw',
      compactHeader: true,
      bodyPadding: '8px 12px',
      bodyFlex: true,
      noScroll: true,
      contentHtml,
      footerHtml
    });

    this.recalculateTotals();
  },

  renderReceiveItemsRows(items) {
    return items.map((item, idx) => `
      <tr data-index="${idx}">
        <td style="text-align:center; color:var(--text-muted);">${idx + 1}</td>
        <td>
          <b class="cell-strong">${item.code}</b>
          <div style="font-size:11px; color:var(--text-secondary);">${item.name}</div>
        </td>
        <td class="cell-mono">${item.batch_number || 'DEFAULT'}</td>
        <td>${item.uom}</td>
        <td class="cell-num text-right">${item.dispatched_qty}</td>
        <td class="cell-num text-right" style="color:var(--text-muted);">${item.prev_received_qty}</td>
        <td class="cell-num text-right" style="font-weight:700; color:#3b82f6;">${item.pending_qty}</td>
        <td>
          <input 
            type="number" 
            class="form-control rcv-physical-input" 
            value="${item.current_physical_qty}" 
            min="0" 
            max="${item.pending_qty}"
            oninput="window.ReceiveTransfersModule.onPhysicalQtyChange(${idx}, this.value)" 
            style="height:28px; font-size:11.5px; text-align:right; font-weight:700;"
          >
        </td>
        <td>
          <input 
            type="number" 
            class="form-control rcv-accepted-input" 
            id="rcv-acc-${idx}" 
            value="${item.accepted_qty}" 
            min="0" 
            max="${item.pending_qty}"
            oninput="window.ReceiveTransfersModule.onAcceptedQtyChange(${idx}, this.value)" 
            style="height:28px; font-size:11.5px; text-align:right; font-weight:700; color:#10b981;"
          >
        </td>
        <td class="cell-num text-right" style="font-weight:700; color:#f59e0b;" id="rcv-short-${idx}">
          ${item.short_qty}
        </td>
        <td>
          <input 
            type="number" 
            class="form-control" 
            id="rcv-dmg-${idx}" 
            value="${item.damaged_qty}" 
            min="0" 
            max="${item.pending_qty}"
            oninput="window.ReceiveTransfersModule.onDamagedQtyChange(${idx}, this.value)" 
            style="height:28px; font-size:11.5px; text-align:right; font-weight:600; color:#ef4444;"
          >
        </td>
        <td>
          <input 
            type="text" 
            class="form-control cell-mono" 
            id="rcv-bin-${idx}" 
            value="${item.bin_id || 'BIN-RMS-A01-01'}" 
            style="height:28px; font-size:11px;"
          >
        </td>
        <td>
          <input 
            type="text" 
            class="form-control" 
            id="rcv-rem-${idx}" 
            value="${item.remarks || ''}" 
            placeholder="Notes..." 
            style="height:28px; font-size:11px;"
          >
        </td>
      </tr>
    `).join('');
  },

  onPhysicalQtyChange(idx, val) {
    const item = this._activeReceivingItems[idx];
    if (!item) return;
    let num = Number(val);
    if (isNaN(num) || num < 0) num = 0;
    if (num > item.pending_qty) {
      num = item.pending_qty;
      window.State.showToast(`Physical quantity cannot exceed remaining pending transfer quantity (${item.pending_qty} ${item.uom}).`, 'warning');
    }
    item.current_physical_qty = num;
    
    // Auto-compute accepted and short
    item.accepted_qty = Math.max(0, num - item.damaged_qty);
    item.short_qty = Math.max(0, item.pending_qty - num);

    const accInput = document.getElementById(`rcv-acc-${idx}`);
    if (accInput) accInput.value = item.accepted_qty;
    const shortEl = document.getElementById(`rcv-short-${idx}`);
    if (shortEl) shortEl.textContent = item.short_qty;

    this.recalculateTotals();
  },

  onAcceptedQtyChange(idx, val) {
    const item = this._activeReceivingItems[idx];
    if (!item) return;
    let num = Number(val);
    if (isNaN(num) || num < 0) num = 0;
    if (num > item.pending_qty) {
      num = item.pending_qty;
      window.State.showToast(`Accepted quantity cannot exceed pending quantity (${item.pending_qty} ${item.uom}).`, 'warning');
    }
    item.accepted_qty = num;
    item.short_qty = Math.max(0, item.pending_qty - num - item.damaged_qty);

    const shortEl = document.getElementById(`rcv-short-${idx}`);
    if (shortEl) shortEl.textContent = item.short_qty;

    this.recalculateTotals();
  },

  onDamagedQtyChange(idx, val) {
    const item = this._activeReceivingItems[idx];
    if (!item) return;
    let num = Number(val);
    if (isNaN(num) || num < 0) num = 0;
    item.damaged_qty = num;
    
    // Accepted + Damaged cannot exceed physical
    if (item.accepted_qty + num > item.current_physical_qty) {
      item.accepted_qty = Math.max(0, item.current_physical_qty - num);
      const accInput = document.getElementById(`rcv-acc-${idx}`);
      if (accInput) accInput.value = item.accepted_qty;
    }
    item.short_qty = Math.max(0, item.pending_qty - item.current_physical_qty);
    const shortEl = document.getElementById(`rcv-short-${idx}`);
    if (shortEl) shortEl.textContent = item.short_qty;

    this.recalculateTotals();
  },

  recalculateTotals() {
    const items = this._activeReceivingItems || [];
    let totDispatched = 0;
    let totPending = 0;
    let totAccepted = 0;
    let totShort = 0;
    let totDamaged = 0;

    items.forEach(i => {
      totDispatched += Number(i.dispatched_qty || 0);
      totPending += Number(i.pending_qty || 0);
      totAccepted += Number(i.accepted_qty || 0);
      totShort += Number(i.short_qty || 0);
      totDamaged += Number(i.damaged_qty || 0);
    });

    const elDisp = document.getElementById('rcv-sum-dispatched');
    if (elDisp) elDisp.textContent = totDispatched;
    const elPend = document.getElementById('rcv-sum-pending');
    if (elPend) elPend.textContent = totPending;
    const elAcc = document.getElementById('rcv-sum-accepted');
    if (elAcc) elAcc.textContent = totAccepted;
    const elShort = document.getElementById('rcv-sum-short');
    if (elShort) elShort.textContent = totShort;
    const elDmg = document.getElementById('rcv-sum-damaged');
    if (elDmg) elDmg.textContent = totDamaged;

    const badge = document.getElementById('rcv-discrepancy-badge');
    if (badge) {
      badge.style.display = (totShort > 0 || totDamaged > 0) ? 'block' : 'none';
    }
  },

  submitReceipt(e, trfId) {
    e.preventDefault();
    const t = window.DB.getById('stockTransfers', trfId);
    if (!t) {
      window.State.showToast('Transfer not found.', 'error');
      return;
    }

    const items = this._activeReceivingItems || [];
    if (items.length === 0) {
      window.State.showToast('No items to receive.', 'error');
      return;
    }

    const totalAccepted = items.reduce((sum, i) => sum + Number(i.accepted_qty || 0), 0);
    const totalShort = items.reduce((sum, i) => sum + Number(i.short_qty || 0), 0);
    const totalDamaged = items.reduce((sum, i) => sum + Number(i.damaged_qty || 0), 0);

    if (totalAccepted === 0 && totalDamaged === 0 && totalShort === 0) {
      window.State.showToast('Please enter the received quantity to confirm inward receipt.', 'warning');
      return;
    }

    const receiptNo = document.getElementById('rcv-doc-num')?.textContent || `RTS-2026-${Date.now().toString().slice(-5)}`;
    const receiptDate = document.getElementById('rcv-actual-date')?.value || new Date().toISOString().split('T')[0];
    const receivingOfficer = document.getElementById('rcv-officer')?.value || 'Store Officer';
    const vehicleRef = document.getElementById('rcv-vehicle-ref')?.value || t.vehicle_no || '';
    const remarks = document.getElementById('rcv-general-remarks')?.value || '';

    // 1. Post Accepted Stock into Destination Warehouse (Inventory Ledger & Balances)
    items.forEach((item, idx) => {
      const accepted = Number(item.accepted_qty || 0);
      const binId = document.getElementById(`rcv-bin-${idx}`)?.value || item.bin_id || 'BIN-RMS-A01-01';
      const lineRemarks = document.getElementById(`rcv-rem-${idx}`)?.value || '';

      if (accepted > 0) {
        try {
          if (window.DB && typeof window.DB.addStock === 'function') {
            window.DB.addStock({
              plantId: t.dest_plant_id,
              warehouseId: t.dest_warehouse_id,
              binId: binId,
              itemId: item.item_id,
              itemCode: item.code,
              batchNumber: item.batch_number || 'DEFAULT',
              qty: accepted,
              reason: `Transfer Inward Receipt ${receiptNo} for ${t.transfer_number}`
            });
          }
        } catch (err) {
          console.warn('DB.addStock note:', err);
        }

        // Direct sync with inventoryBalances collection for safety
        const balances = (window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('inventoryBalances') : [];
        let bal = balances.find(b => 
          (b.warehouse_id === t.dest_warehouse_id) && 
          (b.item_id === item.item_id || b.item_code === item.code) &&
          (!item.batch_number || b.batch_number === item.batch_number)
        );

        if (bal) {
          bal.on_hand = (Number(bal.on_hand) || 0) + accepted;
          bal.available = (Number(bal.available) || 0) + accepted;
        } else {
          balances.push({
            id: `BAL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            plant_id: t.dest_plant_id,
            warehouse_id: t.dest_warehouse_id,
            bin_id: binId,
            item_id: item.item_id,
            item_code: item.code,
            batch_number: item.batch_number || 'DEFAULT',
            on_hand: accepted,
            available: accepted,
            reserved: 0,
            stock_status: 'AVAILABLE',
            updated_at: new Date().toISOString()
          });
        }
      }

      // Update transfer line item received quantity
      const origItem = (t.items || []).find(x => x.item_id === item.item_id || x.code === item.code);
      if (origItem) {
        origItem.received = (Number(origItem.received) || 0) + accepted;
      }
    });

    // 2. Create Stock Transfer Receipt Document Record
    const receiptRecord = {
      id: receiptNo,
      receipt_number: receiptNo,
      transfer_id: t.id,
      transfer_number: t.transfer_number,
      source_plant_id: t.source_plant_id,
      source_warehouse_id: t.source_warehouse_id,
      dest_plant_id: t.dest_plant_id,
      dest_warehouse_id: t.dest_warehouse_id,
      receipt_date: receiptDate,
      received_by: receivingOfficer,
      vehicle_no: vehicleRef,
      remarks: remarks,
      total_accepted: totalAccepted,
      total_short: totalShort,
      total_damaged: totalDamaged,
      created_at: new Date().toISOString(),
      items: items.map(i => ({
        item_id: i.item_id,
        code: i.code,
        name: i.name,
        batch_number: i.batch_number,
        uom: i.uom,
        dispatched_qty: i.dispatched_qty,
        accepted_qty: Number(i.accepted_qty || 0),
        short_qty: Number(i.short_qty || 0),
        damaged_qty: Number(i.damaged_qty || 0),
        bin_id: i.bin_id
      }))
    };

    if (window.DB && typeof window.DB.insert === 'function') {
      window.DB.insert('stockTransferReceipts', receiptRecord);
    }

    // 3. Log Discrepancies if shortages or damages exist
    if (totalShort > 0 || totalDamaged > 0) {
      items.forEach(i => {
        if (i.short_qty > 0) {
          const disc = {
            id: `DISC-${Date.now().toString(36)}-S`,
            discrepancy_number: `DISC-S-${receiptNo}`,
            transfer_number: t.transfer_number,
            receipt_number: receiptNo,
            item_code: i.code,
            item_name: i.name,
            discrepancy_type: 'SHORTAGE',
            expected_qty: i.pending_qty,
            actual_qty: i.current_physical_qty,
            discrepancy_qty: i.short_qty,
            uom: i.uom,
            reported_by: receivingOfficer,
            reported_date: receiptDate,
            status: 'OPEN'
          };
          if (window.DB && typeof window.DB.insert === 'function') {
            window.DB.insert('stockTransferDiscrepancies', disc);
          }
        }
        if (i.damaged_qty > 0) {
          const disc = {
            id: `DISC-${Date.now().toString(36)}-D`,
            discrepancy_number: `DISC-D-${receiptNo}`,
            transfer_number: t.transfer_number,
            receipt_number: receiptNo,
            item_code: i.code,
            item_name: i.name,
            discrepancy_type: 'DAMAGED_STOCK',
            expected_qty: i.current_physical_qty,
            actual_qty: i.accepted_qty,
            discrepancy_qty: i.damaged_qty,
            uom: i.uom,
            reported_by: receivingOfficer,
            reported_date: receiptDate,
            status: 'OPEN'
          };
          if (window.DB && typeof window.DB.insert === 'function') {
            window.DB.insert('stockTransferDiscrepancies', disc);
          }
        }
      });
      t.has_discrepancy = true;
    }

    // 4. Update Original Stock Transfer Status
    const allDispatched = (t.items || []).reduce((sum, i) => sum + Number(i.dispatched || i.requested || 0), 0);
    const allReceived = (t.items || []).reduce((sum, i) => sum + Number(i.received || 0), 0);

    if (allReceived >= allDispatched) {
      t.status = 'RECEIVED';
      t.received_at = new Date().toISOString();
      t.received_by = receivingOfficer;
    } else {
      t.status = (totalShort > 0 || totalDamaged > 0) ? 'DISCREPANCY_PENDING' : 'PARTIALLY_RECEIVED';
    }

    if (window.DB && typeof window.DB.update === 'function') {
      window.DB.update('stockTransfers', t.id, t);
    }

    // 5. Audit Logging & Notification
    if (window.DB && typeof window.DB.logAudit === 'function') {
      window.DB.logAudit(
        'STOCK_TRANSFER_RECEIPT', 
        'STOCK_TRANSFER', 
        t.transfer_number, 
        `Receipt ${receiptNo} confirmed: Accepted ${totalAccepted} units into store ${t.dest_warehouse_id}. Short: ${totalShort}, Damaged: ${totalDamaged}.`
      );
    }

    window.State.closeModal();
    window.State.showToast(`Receipt ${receiptNo} successfully posted! Stock updated in destination store.`, 'success');

    const container = document.getElementById('view-container');
    if (container) {
      window.ReceiveTransfersModule.render(container);
    }
  },

  viewTransfer(trfId) {
    if (window.TransfersModule && typeof window.TransfersModule.viewTransfer === 'function') {
      window.TransfersModule.viewTransfer(trfId);
    }
  },

  viewReceiptHistory(trfId) {
    const t = window.DB.getById('stockTransfers', trfId);
    if (!t) return;

    const receipts = (window.DB.getAll('stockTransferReceipts') || []).filter(r => r.transfer_id === trfId || r.transfer_number === t.transfer_number);
    const discrepancies = (window.DB.getAll('stockTransferDiscrepancies') || []).filter(d => d.transfer_number === t.transfer_number);

    window.State.showModal({
      title: `📜 Inward Receipt History: ${t.transfer_number}`,
      maxWidth: '750px',
      contentHtml: `
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="background:var(--bg-surface); padding:12px 16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-size:12px;">
              <div>Transfer Number: <b class="cell-mono">${t.transfer_number}</b></div>
              <div>Current Status: <span class="status-pill status-in-transit">${t.status}</span></div>
              <div>Total Receipts Logged: <b>${receipts.length}</b></div>
              <div>Discrepancies Noted: <b style="color:${discrepancies.length > 0 ? '#ef4444' : '#10b981'};">${discrepancies.length}</b></div>
            </div>
          </div>

          <div>
            <div style="font-weight:700; font-size:13px; margin-bottom:8px;">Receipt Transactions (RTS)</div>
            ${receipts.length === 0 ? `
              <div style="color:var(--text-muted); padding:14px; text-align:center; background:rgba(0,0,0,0.02); border-radius:6px;">No receipts have been posted yet for this transfer.</div>
            ` : `
              <table class="data-table" style="font-size:12px; margin:0;">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Receipt Date</th>
                    <th>Received By</th>
                    <th class="text-right">Accepted Qty</th>
                    <th class="text-right">Short</th>
                    <th class="text-right">Damaged</th>
                    <th style="text-align:center;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${receipts.map(r => `
                    <tr>
                      <td class="cell-mono cell-strong" style="color:var(--primary-400);">${r.receipt_number}</td>
                      <td>${window.formatDate(r.receipt_date)}</td>
                      <td>${r.received_by}</td>
                      <td class="cell-num text-right" style="color:#10b981; font-weight:700;">${r.total_accepted}</td>
                      <td class="cell-num text-right" style="color:#f59e0b;">${r.total_short || 0}</td>
                      <td class="cell-num text-right" style="color:#ef4444;">${r.total_damaged || 0}</td>
                      <td style="text-align:center;">
                        <button class="btn btn-secondary btn-sm" onclick="window.ReceiveTransfersModule.printReceiptDoc('${r.id}')" style="padding:2px 8px; font-size:11px;">Print</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>

          ${discrepancies.length > 0 ? `
            <div>
              <div style="font-weight:700; font-size:13px; margin-bottom:8px; color:#ef4444;">Logged Discrepancies</div>
              <table class="data-table" style="font-size:12px; margin:0;">
                <thead>
                  <tr>
                    <th>Discrepancy #</th>
                    <th>Type</th>
                    <th>Item Code</th>
                    <th class="text-right">Qty</th>
                    <th>Reported Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${discrepancies.map(d => `
                    <tr>
                      <td class="cell-mono">${d.discrepancy_number}</td>
                      <td><span class="status-pill status-danger" style="background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.3);">${d.discrepancy_type}</span></td>
                      <td class="cell-mono">${d.item_code}</td>
                      <td class="cell-num text-right" style="font-weight:700;">${d.discrepancy_qty} ${d.uom}</td>
                      <td>${window.formatDate(d.reported_date)}</td>
                      <td><b>${d.status}</b></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      `
    });
  },

  printTransfer(trfId) {
    if (window.TransfersModule && typeof window.TransfersModule.printTransfer === 'function') {
      window.TransfersModule.printTransfer(trfId);
    } else {
      window.print();
    }
  },

  printReceiptDoc(receiptId) {
    const receipts = window.DB.getAll('stockTransferReceipts') || [];
    const r = receipts.find(x => x.id === receiptId || x.receipt_number === receiptId);
    if (!r) return;

    window.State.showModal({
      title: `Inward Goods Receipt Voucher: ${r.receipt_number}`,
      maxWidth: '680px',
      contentHtml: `
        <div id="printable-receipt" style="font-family: var(--font-sans); padding: 10px;">
          <div style="text-align: center; border-bottom: 2px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 14px;">
            <h2 style="margin: 0; font-size: 18px;">STOCK TRANSFER RECEIPT VOUCHER</h2>
            <div style="font-size: 12px; color: var(--text-muted);">Destination Store Stock Inward & Verification Note</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; margin-bottom: 16px;">
            <div><b>Receipt Number:</b> <span class="cell-mono">${r.receipt_number}</span></div>
            <div><b>Receipt Date:</b> ${window.formatDate(r.receipt_date)}</div>
            <div><b>Transfer Number:</b> <span class="cell-mono">${r.transfer_number}</span></div>
            <div><b>Receiving Officer:</b> ${r.received_by}</div>
            <div><b>Vehicle Ref:</b> ${r.vehicle_no || 'N/A'}</div>
            <div><b>Total Accepted:</b> <b style="color: #10b981;">${r.total_accepted} Units</b></div>
          </div>

          <table class="data-table" style="font-size: 11.5px; width: 100%; margin-bottom: 16px;">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Item Description</th>
                <th>Batch</th>
                <th class="text-right">Dispatched</th>
                <th class="text-right">Accepted</th>
                <th class="text-right">Short</th>
                <th class="text-right">Damaged</th>
              </tr>
            </thead>
            <tbody>
              ${(r.items || []).map((it, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="cell-mono">${it.code}</td>
                  <td>${it.name}</td>
                  <td class="cell-mono">${it.batch_number}</td>
                  <td class="cell-num text-right">${it.dispatched_qty}</td>
                  <td class="cell-num text-right" style="color: #10b981; font-weight: 700;">${it.accepted_qty}</td>
                  <td class="cell-num text-right" style="color: #f59e0b;">${it.short_qty || 0}</td>
                  <td class="cell-num text-right" style="color: #ef4444;">${it.damaged_qty || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed var(--border-subtle); font-size: 12px;">
            <div>
              Verified By: ___________________<br>
              <span style="font-size: 11px; color: var(--text-muted);">Receiving Storekeeper</span>
            </div>
            <div style="text-align: right;">
              Approved By: ___________________<br>
              <span style="font-size: 11px; color: var(--text-muted);">Store Manager / Auditor</span>
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-primary" onclick="window.print()">Print Receipt</button>
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      `
    });
  }
};
