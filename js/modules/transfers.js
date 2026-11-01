/* ==========================================================================
   ENTERPRISE ISCM - STAGE 11: STOCK TRANSFERS (INTER-PLANT & WAREHOUSE)
   Material Transfer Requests, Gate-Out Dispatch, In-Transit & Destination Receipt
   ========================================================================== */

window.TransfersModule = {
  search: '',
  statusFilter: 'ALL',
  fromDate: '',
  getTodayDateStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  setTodayFilter() {
    const today = this.getTodayDateStr();
    this.fromDate = today;
    this.toDate = today;
    if (window.PaginationHelper) window.PaginationHelper.reset('transfers');
    this.render();
  },

  setAllDatesFilter() {
    this.fromDate = 'ALL';
    this.toDate = 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('transfers');
    this.render();
  },

  render(container) {
    if (container) this.container = container;
    const target = this.container || document.getElementById('view-container') || document.getElementById('main-content');
    if (!target) return;

    if (!this.fromDate && this.fromDate !== 'ALL') this.fromDate = this.getTodayDateStr();
    if (!this.toDate && this.toDate !== 'ALL') this.toDate = this.getTodayDateStr();
    const displayFrom = this.fromDate === 'ALL' ? '' : this.fromDate;
    const displayTo = this.toDate === 'ALL' ? '' : this.toDate;

    const plantId = window.State.currentPlantId;
    const allTransfers = window.DB.getAll('stockTransfers').filter(t => {
      if (!window.DB.isPlantActive(t.source_plant_id) || !window.DB.isPlantActive(t.dest_plant_id)) return false;
      return plantId === 'ALL' || t.source_plant_id === plantId || t.dest_plant_id === plantId;
    });
    const plants = window.DB.getActivePlants();
    const warehouses = window.DB.getActiveWarehouses();

    const searchLower = (this.search || '').toLowerCase().trim();
    const filtered = allTransfers.filter(t => {
      if (this.statusFilter !== 'ALL' && t.status !== this.statusFilter) return false;
      const rawDate = t.dispatched_at || t.created_at || '';
      let isoDate = '';
      if (rawDate) {
        try { isoDate = new Date(rawDate).toISOString().split('T')[0]; } catch(e) { isoDate = String(rawDate).slice(0, 10); }
      }
      if (this.fromDate && this.fromDate !== 'ALL' && isoDate && isoDate < this.fromDate) return false;
      if (this.toDate && this.toDate !== 'ALL' && isoDate && isoDate > this.toDate) return false;
      if (searchLower) {
        const sPlant = window.DB.getById('plants', t.source_plant_id);
        const dPlant = window.DB.getById('plants', t.dest_plant_id);
        const sWh = window.DB.getById('warehouses', t.source_warehouse_id);
        const dWh = window.DB.getById('warehouses', t.dest_warehouse_id);
        const corpus = `${t.transfer_number || ''} ${sPlant?.name || ''} ${sPlant?.code || ''} ${sWh?.name || ''} ${dPlant?.name || ''} ${dPlant?.code || ''} ${dWh?.name || ''} ${t.vehicle_no || ''} ${t.transporter || ''}`.toLowerCase();
        if (!corpus.includes(searchLower)) return false;
      }
      return true;
    });

    const paged = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'transfers')
      : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    target.innerHTML = `
      ${window.renderInventoryLogisticsTabs ? window.renderInventoryLogisticsTabs('#/transfers') : ''}
      <div class="content-card" style="margin-top: 2px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div class="card-title" style="white-space: nowrap; font-size: 15px; font-weight: 700; color: var(--text-primary);">
            Stock Transfer
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); white-space: nowrap;">From Date:</span>
              <input type="date" id="trf-from-date" class="filter-input" style="height: 32px; font-size: 12px; margin: 0; padding: 2px 8px; width: 130px;" onchange="window.TransfersModule.onFromDateChange(this.value)" title="From Date (Default: Today)" value="${displayFrom}">
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); white-space: nowrap;">To Date:</span>
              <input type="date" id="trf-to-date" class="filter-input" style="height: 32px; font-size: 12px; margin: 0; padding: 2px 8px; width: 130px;" onchange="window.TransfersModule.onToDateChange(this.value)" title="To Date (Default: Today)" value="${displayTo}">
            </div>
            <div style="display: inline-flex; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); overflow: hidden; height: 32px;">
              <button 
                type="button" 
                class="btn btn-xs ${(this.fromDate === this.getTodayDateStr() && this.toDate === this.getTodayDateStr()) ? 'btn-primary' : 'btn-ghost'}" 
                style="padding: 0 8px; font-size: 11px; border-radius: 0; font-weight: 600; height: 30px;"
                onclick="window.TransfersModule.setTodayFilter()"
                title="Show Today's Transfers"
              >Today</button>
              <button 
                type="button" 
                class="btn btn-xs ${(this.fromDate === 'ALL' || (!this.fromDate && !this.toDate)) ? 'btn-primary' : 'btn-ghost'}" 
                style="padding: 0 8px; font-size: 11px; border-radius: 0; font-weight: 600; height: 30px;"
                onclick="window.TransfersModule.setAllDatesFilter()"
                title="Show All Dates"
              >All</button>
            </div>
            <input type="text" id="trf-search" class="filter-input" placeholder="Search transfer #, vehicle, facility, store..." value="${this.search || ''}" oninput="window.TransfersModule.onSearchInput(this.value)" onkeydown="if(event.key==='Enter') window.TransfersModule.filterTable()" style="min-width: 220px; height: 32px; margin: 0;">
            <select id="trf-status-filter" class="filter-select" onchange="window.TransfersModule.onStatusFilterChange(this.value)" style="margin: 0; height: 32px;">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
              <option value="IN_TRANSIT" ${this.statusFilter === 'IN_TRANSIT' ? 'selected' : ''}>In-Transit Between Facilities</option>
              <option value="REQUESTED" ${this.statusFilter === 'REQUESTED' ? 'selected' : ''}>Requested / Pending</option>
              <option value="RECEIVED" ${this.statusFilter === 'RECEIVED' ? 'selected' : ''}>Received & Stocked</option>
            </select>
            <button class="btn btn-primary btn-sm" onclick="window.TransfersModule.showCreateModal()" style="white-space: nowrap; height: 32px;">
              + Initiate Transfer Request
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="trf-table">
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>From Facility</th>
                <th>From Store</th>
                <th>To Facility</th>
                <th>To Store</th>
                <th>Transporter & Vehicle</th>
                <th>Dispatched At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${paged.items.length === 0 ? `
                <tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No stock transfers recorded matching criteria.</td></tr>
              ` : paged.items.map(t => {
                const sPlant = window.DB.getById('plants', t.source_plant_id);
                const dPlant = window.DB.getById('plants', t.dest_plant_id);
                const sWh = window.DB.getById('warehouses', t.source_warehouse_id);
                const dWh = window.DB.getById('warehouses', t.dest_warehouse_id);

                return `
                  <tr data-status="${t.status}">
                    <td class="cell-mono cell-strong">
                      <a href="javascript:void(0)" onclick="window.TransfersModule.viewTransfer('${t.id}')" style="color:var(--primary-300); text-decoration:none;">
                        ${t.transfer_number}
                      </a>
                    </td>
                    <td>
                      <b>${sPlant ? (sPlant.name || sPlant.code) : 'Facility'}</b>
                    </td>
                    <td>
                      <b>${sWh ? sWh.name : 'Main Store'}</b>
                    </td>
                    <td>
                      <b>${dPlant ? (dPlant.name || dPlant.code) : 'Facility'}</b>
                    </td>
                    <td>
                      <b>${dWh ? dWh.name : 'Store'}</b>
                    </td>
                    <td>
                      <span class="cell-strong">${t.transporter || 'Internal Fleet'}</span><br>
                      <span class="cell-mono" style="font-size:11px;">${t.vehicle_no || 'Pending'}</span>
                    </td>
                    <td>${t.dispatched_at ? window.formatDate(t.dispatched_at) : 'Pending'}</td>
                    <td>
                      <span class="status-pill ${
                        t.status === 'RECEIVED' ? 'status-approved' :
                        t.status === 'IN_TRANSIT' ? 'status-in-transit' : 'status-pending'
                      }">
                        ${t.status}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:5px; align-items:center; flex-wrap:nowrap;">
                        <button class="btn btn-secondary btn-sm" onclick="window.TransfersModule.viewTransfer('${t.id}')" title="View Transfer" style="padding: 3px 8px; font-size: 11.5px;">
                          View
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.TransfersModule.editTransfer('${t.id}')" title="Edit Transfer" style="padding: 3px 8px; font-size: 11.5px;">
                          Edit
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.TransfersModule.printTransfer('${t.id}')" title="Print Transfer" style="padding: 3px 8px; font-size: 11.5px;">
                          Print
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="window.TransfersModule.deleteTransfer('${t.id}')" title="Delete Transfer" style="padding: 3px 8px; font-size: 11.5px; background: var(--color-danger, #ef4444); color: #fff; border: none;">
                          Delete
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
          key: 'transfers',
          pagination: paged,
          onPageChange: 'window.TransfersModule.setPage',
          onPageSizeChange: 'window.TransfersModule.setPageSize'
        }) : ''}
      </div>
    `;
  },

  onSearchInput(val) {
    this.search = val;
  },

  onFromDateChange(val) {
    this.fromDate = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('transfers');
    this.render();
  },

  onToDateChange(val) {
    this.toDate = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('transfers');
    this.render();
  },

  onStatusFilterChange(val) {
    this.statusFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('transfers');
    this.render();
  },

  setPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('transfers', page);
    this.render();
  },

  setPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('transfers', size);
    this.render();
  },

  filterTable() {
    this.search = document.getElementById('trf-search')?.value || '';
    this.statusFilter = document.getElementById('trf-status-filter')?.value || 'ALL';
    this.fromDate = document.getElementById('trf-from-date')?.value || '';
    this.toDate = document.getElementById('trf-to-date')?.value || '';
    if (window.PaginationHelper) window.PaginationHelper.reset('transfers');
    this.render();
  },

  viewTransfer(trfId) {
    this.showCreateModal(trfId, true);
  },

  printTransfer(trfId) {
    const t = window.DB.getById('stockTransfers', trfId);
    if (!t) return;
    const facId = t.source_plant_id || t.dest_plant_id || 'PLANT-01';

    const enrichedTransfer = {
      ...t,
      transfer_no: t.transfer_number || t.id,
      document_number: t.transfer_number || t.id,
      document_date: t.dispatched_at || t.created_at || new Date().toISOString(),
      vehicle_reg_no: t.vehicle_no,
      transporter: t.transporter,
      remarks: t.reason || t.remarks || '',
      items: (t.items || []).map((i, idx) => {
        const itemObj = (window.DB && typeof window.DB.getById === 'function') ? window.DB.getById('items', i.item_id) : null;
        return {
          ...i,
          code: itemObj?.code || i.code || i.item_id,
          description: itemObj?.name || i.name || i.description || 'Transfer Line Item',
          name: itemObj?.name || i.name || i.description || 'Transfer Line Item',
          qty: Number(i.dispatched !== undefined ? i.dispatched : (i.requested !== undefined ? i.requested : (i.qty || 1))),
          quantity: Number(i.dispatched !== undefined ? i.dispatched : (i.requested !== undefined ? i.requested : (i.qty || 1))),
          uom: i.uom || itemObj?.stock_uom || itemObj?.base_uom || 'NOS',
          batch_number: i.batch_number || 'DEFAULT'
        };
      })
    };

    let printHtml = '';
    if (window.DocPrintConfigModule && typeof window.DocPrintConfigModule.generatePrintHtml === 'function') {
      printHtml = window.DocPrintConfigModule.generatePrintHtml('TRANSFER', facId, enrichedTransfer);
    }

    if (!printHtml) {
      const sPlant = window.DB.getById('plants', t.source_plant_id);
      const dPlant = window.DB.getById('plants', t.dest_plant_id);
      const sWh = window.DB.getById('warehouses', t.source_warehouse_id);
      const dWh = window.DB.getById('warehouses', t.dest_warehouse_id);
      printHtml = `
        <div class="a4-container configured-print-doc" style="background:#fff; color:#0f172a; max-width:794px; margin:0 auto; padding:20px; font-family:Inter, sans-serif; border:1px solid #cbd5e1; border-radius:6px;">
          <div style="display:flex; justify-content:space-between; border-bottom:2px solid #d97706; padding-bottom:12px; margin-bottom:14px;">
            <div>
              <h2 style="margin:0; font-size:18px; color:#1e293b; font-weight:800;">INTER-STORE TRANSFER PASS</h2>
              <div style="font-size:12px; color:#64748b;">Transfer Pass #${t.transfer_number || t.id}</div>
            </div>
            <div style="text-align:right; font-size:12px;">
              <div><b>Date:</b> ${window.formatDate(t.dispatched_at || Date.now())}</div>
              <div><b>Status:</b> ${t.status}</div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; font-size:12px;">
            <div style="border:1px solid #e2e8f0; padding:10px; border-radius:6px; background:#f8fafc;">
              <div style="font-weight:700; color:#d97706; margin-bottom:4px; text-transform:uppercase; font-size:11px;">From Dispatch Store</div>
              <div><b>Facility:</b> ${sPlant?.name || t.source_plant_id}</div>
              <div><b>Store:</b> ${sWh?.name || 'Main Store'}</div>
            </div>
            <div style="border:1px solid #e2e8f0; padding:10px; border-radius:6px; background:#f8fafc;">
              <div style="font-weight:700; color:#10b981; margin-bottom:4px; text-transform:uppercase; font-size:11px;">To Destination Store</div>
              <div><b>Facility:</b> ${dPlant?.name || t.dest_plant_id}</div>
              <div><b>Store:</b> ${dWh?.name || 'Store'}</div>
            </div>
          </div>
          <div style="margin-bottom:14px; font-size:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; background:#f1f5f9; padding:8px 12px; border-radius:6px;">
            <div><span style="color:#64748b; font-size:11px;">Transporter:</span><br><b>${t.transporter || 'Internal Fleet'}</b></div>
            <div><span style="color:#64748b; font-size:11px;">Vehicle #:</span><br><b style="font-family:monospace;">${t.vehicle_no || '-'}</b></div>
            <div><span style="color:#64748b; font-size:11px;">Dispatched By:</span><br><b>${t.dispatched_by || 'Store Officer'}</b></div>
            <div><span style="color:#64748b; font-size:11px;">Remark:</span><br><b>${t.reason || t.remarks || '-'}</b></div>
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
            <thead>
              <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1;">
                <th style="padding:8px; text-align:center; width:40px;">#</th>
                <th style="padding:8px; text-align:left;">Item Code & Description</th>
                <th style="padding:8px; text-align:left;">Batch / Lot</th>
                <th style="padding:8px; text-align:right;">Transfer Qty</th>
                <th style="padding:8px; text-align:center; width:60px;">UOM</th>
              </tr>
            </thead>
            <tbody>
              ${(t.items || []).map((i, idx) => {
                const item = window.DB.getById('items', i.item_id);
                return `
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:8px; text-align:center;">${idx + 1}</td>
                    <td style="padding:8px;"><b>${item?.code || i.code || i.item_id}</b> - ${item?.name || i.name || ''}</td>
                    <td style="padding:8px; font-family:monospace; color:#d97706;">${i.batch_number || 'DEFAULT'}</td>
                    <td style="padding:8px; text-align:right; font-weight:700;">${i.dispatched || i.requested || 0}</td>
                    <td style="padding:8px; text-align:center;">${i.uom || 'NOS'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div style="display:flex; justify-content:space-between; margin-top:36px; padding-top:12px; border-top:1px dashed #cbd5e1; font-size:11px; color:#64748b;">
            <div>Prepared By: <b>${t.dispatched_by || 'Store Officer'}</b></div>
            <div>Transporter Sign: _________________</div>
            <div>Destination Store Ack: _________________</div>
          </div>
        </div>
      `;
    }

    window.State.showModal({
      title: `Print Format: ${t.transfer_number || t.id}`,
      maxWidth: '840px',
      compactHeader: true,
      bodyPadding: '8px 12px',
      contentHtml: `
        <div id="transfer-print-preview-container" style="max-height: calc(85vh - 120px); overflow-y: auto; padding: 12px; background: #64748b; border-radius: 6px;">
          <div style="box-shadow: 0 8px 24px rgba(0,0,0,0.3); margin: 0 auto; max-width: 794px;">
            ${printHtml}
          </div>
        </div>
      `,
      footerHtml: `
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="font-size:11.5px; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
            <span>📄</span> Print Layout: <b>Document Print Configuration Master (TRANSFER)</b>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.State.closeModal()" style="height:32px; padding:0 14px;">Close</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.TransfersModule.executePrint('${t.id}')" style="height:32px; padding:0 18px; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
              <span>🖨️</span> Print Now
            </button>
          </div>
        </div>
      `
    });
  },

  executePrint(trfId) {
    const t = window.DB.getById('stockTransfers', trfId);
    if (!t) return;
    const facId = t.source_plant_id || t.dest_plant_id || 'PLANT-01';
    const enrichedTransfer = {
      ...t,
      transfer_no: t.transfer_number || t.id,
      document_number: t.transfer_number || t.id,
      document_date: t.dispatched_at || t.created_at || new Date().toISOString(),
      vehicle_reg_no: t.vehicle_no,
      transporter: t.transporter,
      remarks: t.reason || t.remarks || '',
      items: (t.items || []).map((i, idx) => {
        const itemObj = (window.DB && typeof window.DB.getById === 'function') ? window.DB.getById('items', i.item_id) : null;
        return {
          ...i,
          code: itemObj?.code || i.code || i.item_id,
          description: itemObj?.name || i.name || i.description || 'Transfer Line Item',
          name: itemObj?.name || i.name || i.description || 'Transfer Line Item',
          qty: Number(i.dispatched !== undefined ? i.dispatched : (i.requested !== undefined ? i.requested : (i.qty || 1))),
          quantity: Number(i.dispatched !== undefined ? i.dispatched : (i.requested !== undefined ? i.requested : (i.qty || 1))),
          uom: i.uom || itemObj?.stock_uom || itemObj?.base_uom || 'NOS',
          batch_number: i.batch_number || 'DEFAULT'
        };
      })
    };
    if (window.DocPrintConfigModule && typeof window.DocPrintConfigModule.printConfiguredDocument === 'function') {
      const printed = window.DocPrintConfigModule.printConfiguredDocument('TRANSFER', facId, enrichedTransfer);
      if (printed) return;
    }
    window.print();
  },

  printTransferPass(trfId) {
    this.printTransfer(trfId);
  },

  editTransfer(trfId) {
    this.showCreateModal(trfId);
  },

  deleteTransfer(trfId) {
    const t = window.DB.getById('stockTransfers', trfId);
    if (!t) return;
    if (typeof window.confirm === 'function' && !window.confirm(`Are you sure you want to delete Stock Transfer ${t.transfer_number || trfId}?`)) {
      return;
    }

    // Revert stock if in transit
    if (t.status === 'IN_TRANSIT' && Array.isArray(t.items)) {
      t.items.forEach(i => {
        try {
          if (window.DB && typeof window.DB.addStock === 'function') {
            window.DB.addStock({
              plantId: t.source_plant_id,
              warehouseId: t.source_warehouse_id,
              itemId: i.item_id,
              qty: Number(i.dispatched || i.requested || 0),
              batchNumber: i.batch_number,
              reason: `Stock Transfer Cancellation ${t.transfer_number || trfId}`
            });
          }
        } catch (err) {
          console.warn('Could not revert stock:', err);
        }
      });
    }

    if (window.DB && typeof window.DB.delete === 'function') {
      window.DB.delete('stockTransfers', trfId);
    }
    if (window.DB && typeof window.DB.logAudit === 'function') {
      window.DB.logAudit('DELETE_TRANSFER', 'STOCK_TRANSFER', t.transfer_number || trfId, `Deleted stock transfer ${t.transfer_number || trfId}`);
    }
    window.State.showToast(`Stock Transfer ${t.transfer_number || trfId} deleted successfully.`, 'info');
    const viewContainer = document.getElementById('view-container');
    if (viewContainer) {
      window.TransfersModule.render(viewContainer);
    }
  },

  receiveTransfer(trfId) {
    const t = window.DB.getById('stockTransfers', trfId);
    if (!t) return;
    const dPlant = window.DB.getById('plants', t.dest_plant_id);
    const dWh = window.DB.getById('warehouses', t.dest_warehouse_id);

    window.State.showModal({
      title: `📥 Inward Transfer Goods Receipt: ${t.transfer_number}`,
      maxWidth: '650px',
      contentHtml: `
        <form id="receive-trf-form" onsubmit="window.TransfersModule.submitReceipt(event, '${t.id}')">
          <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md); margin-bottom:16px;">
            <div style="font-size:12px; color:var(--text-secondary);">
              Destination Plant: <b>${dPlant?.name}</b><br>
              Receiving Warehouse: <b>${dWh?.name}</b><br>
              Arriving Transporter: <b>${t.transporter} (${t.vehicle_no})</b>
            </div>
          </div>

          <div>
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:8px;">Verify Inward Quantities</div>
            ${(t.items || []).map(i => {
              const item = window.DB.getById('items', i.item_id);
              return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:10px;">
                  <div>
                    <div class="cell-strong">${item?.code} - ${item?.name}</div>
                    <div class="cell-mono" style="font-size:11px; color:var(--text-muted);">Batch: ${i.batch_number} | Dispatched: ${i.dispatched} ${i.uom}</div>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <label class="form-label" style="font-size:11px; margin:0;">Received Qty:</label>
                    <input type="number" class="form-control" id="trf-recv-${i.item_id}" value="${i.dispatched}" min="1" max="${i.dispatched}" style="width:100px; height:32px; font-weight:800;" required>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Receiving Material Officer</label>
            <input type="text" id="trf-officer" class="form-control" value="${window.State.currentUser.name}" required>
          </div>

          <div class="modal-footer" style="padding-right:0; padding-bottom:0; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Confirm Inward Stock Posting</button>
          </div>
        </form>
      `
    });
  },

  submitReceipt(e, trfId) {
    e.preventDefault();
    const t = window.DB.getById('stockTransfers', trfId);
    if (!t) return;
    const officer = document.getElementById('trf-officer').value;

    (t.items || []).forEach(i => {
      const input = document.getElementById(`trf-recv-${i.item_id}`);
      const receivedQty = input ? Number(input.value) : i.dispatched;
      i.received = receivedQty;

      // Add to destination plant stock
      window.DB.addStock({
        plantId: t.dest_plant_id,
        warehouseId: t.dest_warehouse_id,
        binId: 'BIN-RMS-A01-01',
        itemId: i.item_id,
        batchNumber: i.batch_number,
        qty: receivedQty,
        reason: `Inter-Plant Transfer Receipt ${t.transfer_number}`
      });
    });

    window.DB.update('stockTransfers', trfId, {
      status: 'RECEIVED',
      received_by: officer,
      received_at: new Date().toISOString()
    });

    window.DB.logAudit('TRANSFER_RECEIPT', 'STOCK_TRANSFER', t.transfer_number, `Stock transfer received at destination by ${officer}. Stock updated.`);
    window.State.closeModal();
    window.State.showToast(`Transfer ${t.transfer_number} received & posted to stock!`);
    window.TransfersModule.render(document.getElementById('view-container'));
  },

  showCreateModal(editId = null, isReadOnly = false) {
    const editTransfer = editId ? window.DB.getById('stockTransfers', editId) : null;
    this._editingTransferId = isReadOnly ? null : (editId || null);

    const plants = window.DB.getActivePlants();
    const warehouses = window.DB.getActiveWarehouses();
    const initialPlantId = editTransfer ? editTransfer.source_plant_id : (plants[0] ? plants[0].id : 'PLANT-01');
    const items = window.DB.getItemsForFacility(initialPlantId) || [];

    this._currentPlantItems = items;
    this._selectedSearchItem = null;

    if (editTransfer && Array.isArray(editTransfer.items) && editTransfer.items.length > 0) {
      this._transferItems = editTransfer.items.map(i => {
        const itemObj = (items || []).find(it => it.id === i.item_id || it.code === i.code) || window.DB.getById('items', i.item_id);
        const sWhId = editTransfer.source_warehouse_id;
        const avail = this.getAvailableStockForItem(itemObj || i.item_id, sWhId);
        return {
          item_id: i.item_id,
          code: itemObj?.code || i.code || i.item_code || '',
          name: itemObj?.name || i.name || i.item_name || '',
          batch_number: i.batch_number || 'DEFAULT',
          available_stock: avail,
          requested: Number(i.requested || i.dispatched || 1),
          dispatched: Number(i.dispatched || i.requested || 1),
          received: Number(i.received || 0),
          uom: i.uom || itemObj?.base_uom || 'NOS'
        };
      });
    } else {
      this._transferItems = [];
    }

    const sPlantId = editTransfer ? editTransfer.source_plant_id : initialPlantId;
    const sWarehouses = warehouses.filter(w => !w.plant_id || w.plant_id === sPlantId);
    const dPlantId = editTransfer ? editTransfer.dest_plant_id : (plants.find(p => p.id !== sPlantId)?.id || (plants[1] ? plants[1].id : initialPlantId));
    const dWarehouses = warehouses.filter(w => !w.plant_id || w.plant_id === dPlantId);
    const sWhId = editTransfer ? editTransfer.source_warehouse_id : (sWarehouses[0] ? sWarehouses[0].id : '');
    
    // In same facility, destination store must not be the same as source store
    const isSameFacility = Boolean(sPlantId && dPlantId && sPlantId === dPlantId);
    const candidateDWarehouses = (dWarehouses.length ? dWarehouses : warehouses);
    const availableDWarehouses = isSameFacility
      ? candidateDWarehouses.filter(w => w.id !== sWhId)
      : candidateDWarehouses;

    const dWhId = editTransfer ? editTransfer.dest_warehouse_id : (availableDWarehouses[0] ? availableDWarehouses[0].id : '');
    const transporter = editTransfer?.transporter || 'VRL Logistics Fleet';
    const vehicle = editTransfer?.vehicle_no || 'MH-12-PQ-9081';
    const reason = editTransfer ? (editTransfer.reason || editTransfer.remarks || '') : '';
    const modalTitle = isReadOnly
      ? `View Stock Transfer: ${editTransfer?.transfer_number || editTransfer?.id || 'Details'}`
      : (editTransfer ? `Edit Stock Transfer: ${editTransfer.transfer_number}` : 'Stock Transfer');

    const contentHtml = `
      <form id="create-trf-form" onsubmit="${isReadOnly ? 'return false;' : 'window.TransfersModule.submitNewTransfer(event)'}" style="display: flex; flex-direction: column; gap: 6px; padding: 0; height: 100%; flex: 1; min-height: 0;">
        <!-- Transfer Header Details Card -->
        <div style="background: var(--bg-surface, #ffffff); border: 1px solid var(--border-subtle, #e2e8f0); border-radius: 6px; padding: 8px 12px; flex-shrink: 0;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; margin: 0; padding: 0;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 11px; margin-bottom: 2px;">From Facility <span class="required">*</span></label>
              <select id="new-trf-s-plant" class="filter-select" style="width:100%; height: 30px; font-size: 12px;" ${isReadOnly ? 'disabled' : 'onchange="window.TransfersModule.onSourcePlantChange(this.value)"'} required>
                ${plants.map(p => `<option value="${p.id}" ${p.id === sPlantId ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 11px; margin-bottom: 2px;">To Facility <span class="required">*</span></label>
              <select id="new-trf-d-plant" class="filter-select" style="width:100%; height: 30px; font-size: 12px;" ${isReadOnly ? 'disabled' : 'onchange="window.TransfersModule.onDestPlantChange(this.value)"'} required>
                ${plants.map((p, idx) => `<option value="${p.id}" ${p.id === dPlantId ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 11px; margin-bottom: 2px;">From Store <span class="required">*</span></label>
              <select id="new-trf-s-wh" class="filter-select" style="width:100%; height: 30px; font-size: 12px;" ${isReadOnly ? 'disabled' : 'onchange="window.TransfersModule.onStoreChange()"'} required>
                ${(sWarehouses.length ? sWarehouses : warehouses).map(w => `<option value="${w.id}" ${w.id === sWhId ? 'selected' : ''}>${w.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 11px; margin-bottom: 2px;">To Store <span class="required">*</span></label>
              <select id="new-trf-d-wh" class="filter-select" style="width:100%; height: 30px; font-size: 12px;" ${isReadOnly ? 'disabled' : 'onchange="window.TransfersModule.onDestStoreChange()"'} required>
                ${availableDWarehouses.length === 0 ? `
                  <option value="" disabled selected>No other store in this facility (Change facility)</option>
                ` : availableDWarehouses.map(w => `<option value="${w.id}" ${w.id === dWhId ? 'selected' : ''}>${w.name}</option>`).join('')}
              </select>
              <div id="trf-same-store-warning" style="display: ${isSameFacility && availableDWarehouses.length === 0 ? 'block' : 'none'}; color: #ef4444; font-size: 10.5px; font-weight: 600; margin-top: 2px; line-height: 1.2;">
                ⚠️ Cannot transfer between same store in same facility.
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 11px; margin-bottom: 2px;">Transporter / Fleet</label>
              <input type="text" id="new-trf-transporter" class="form-control" style="height: 30px; font-size: 12px;" value="${transporter}" ${isReadOnly ? 'disabled readonly' : 'required'}>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 11px; margin-bottom: 2px;">Vehicle Registration Number</label>
              <input type="text" id="new-trf-vehicle" class="form-control" style="height: 30px; font-size: 12px;" value="${vehicle}" ${isReadOnly ? 'disabled readonly' : 'required'}>
            </div>
          </div>
        </div>

        <!-- Items to Transfer Card -->
        <div style="background: var(--bg-surface, #ffffff); border: 1px solid var(--border-subtle, #e2e8f0); border-radius: 6px; padding: 8px 12px; flex: 1; display: flex; flex-direction: column; min-height: 0;">
          <div style="margin-bottom: 6px; flex-shrink: 0;">
            <div style="font-weight: 700; color: var(--text-primary); font-size: 12.5px;">Items to Transfer</div>
          </div>

          ${isReadOnly ? '' : `
          <!-- Search & Add Item Controls Panel -->
          <div id="trf-search-panel" style="background: rgba(59, 130, 246, 0.04); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; flex-shrink: 0;">
            <div style="display: grid; grid-template-columns: 2.5fr 1fr 1fr auto; gap: 8px; align-items: flex-end;">
              <div style="position: relative;">
                <label class="form-label" style="font-size: 11px; font-weight: 600; margin-bottom: 2px;">Item Search (Code / Name)</label>
                <div style="display: flex; gap: 5px;">
                  <input type="text" id="trf-item-search-query" class="form-control" placeholder="Search item code or description..." autocomplete="off" oninput="window.TransfersModule.onSearchItemInput(this.value)" onfocus="window.TransfersModule.showSearchDropdown()" style="font-size: 12px; height: 30px;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="window.TransfersModule.onSearchItemClick()" title="Search Item" style="height: 30px; padding: 0 10px; font-weight: 600; white-space: nowrap; font-size: 11.5px;">
                    🔍 Search
                  </button>
                </div>
                <!-- Dropdown search results list -->
                <div id="trf-item-search-dropdown" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; min-width: 420px; max-height: 240px; overflow-y: auto; background: var(--bg-surface, #ffffff); border: 1px solid var(--border-subtle, #cbd5e1); border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 1050;">
                </div>
              </div>

              <!-- Backing select for compatibility and fallback -->
              <div style="display: none;">
                <select id="new-trf-item">
                  ${items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 600; margin-bottom: 2px;">
                  Transfer Qty <span id="trf-qty-avail-label" style="font-weight: 600; font-size: 10.5px;"></span>
                </label>
                <input type="number" id="new-trf-qty" class="form-control" value="0" min="0" placeholder="0" style="height: 30px; font-size: 12px;" oninput="window.TransfersModule.onTransferQtyInputChange(this)">
              </div>

              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 600; margin-bottom: 2px;">Batch / Lot</label>
                <input type="text" id="new-trf-batch" list="trf-batch-datalist" class="form-control cell-mono" placeholder="Real-time Batch / Lot" style="height: 30px; font-size: 12px;" autocomplete="off">
                <datalist id="trf-batch-datalist"></datalist>
              </div>

              <div>
                <button type="button" class="btn btn-primary btn-sm" onclick="window.TransfersModule.addItemToTransferList()" style="height: 30px; padding: 0 14px; font-weight: 700; white-space: nowrap; font-size: 11.5px;">
                  + Add to List
                </button>
              </div>
            </div>
          </div>
          `}

          <!-- Items Table -->
          <div class="table-responsive" style="flex: 1; min-height: 0; overflow-y: auto; border: 1px solid var(--border-subtle, #e2e8f0); border-radius: 6px; background: var(--bg-surface, #ffffff); display: flex; flex-direction: column;">
            <table class="data-table" style="width: 100%; table-layout: fixed; font-size: 12px; margin: 0;">
              <thead style="position: sticky; top: 0; z-index: 2; background: var(--bg-surface, #ffffff);">
                <tr style="background: rgba(0,0,0,0.02);">
                  <th style="width: 45px; text-align: center;">#</th>
                  <th style="width: 200px; text-align: left;">Item Code</th>
                  <th style="text-align: left;">Item Description</th>
                  <th style="width: 120px; text-align: right; padding-right: 16px;">Store Stock</th>
                  <th style="width: 140px; text-align: left; padding-left: 16px;">Batch / Lot</th>
                  <th style="width: 120px; text-align: right; padding-right: 16px;">Transfer Qty</th>
                  <th style="width: 75px; text-align: center;">UOM</th>
                  ${isReadOnly ? '' : '<th style="width: 65px; text-align: center;">Action</th>'}
                </tr>
              </thead>
              <tbody id="trf-items-tbody">
                ${this.renderTransferItemsTableHtml(isReadOnly)}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="flex: 1; max-width: 540px; min-width: 260px; display: flex; align-items: center; gap: 8px;">
          <label for="new-trf-reason" style="font-size: 11.5px; font-weight: 600; white-space: nowrap; margin: 0; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
            Remark:
          </label>
          <input type="text" id="new-trf-reason" ${isReadOnly ? 'disabled readonly' : 'form="create-trf-form"'} class="form-control" style="font-size: 12px; height: 32px; padding: 4px 10px; flex: 1;" placeholder="${isReadOnly ? 'No remark' : 'Enter remark'}" value="${reason}">
        </div>
        ${isReadOnly ? `
          <div style="display: flex; gap: 8px; align-items: center; margin-left: auto;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.TransfersModule.printTransfer('${editTransfer?.id}')" style="height: 32px; padding: 0 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
              <span>🖨️</span> Print Pass
            </button>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.State.closeModal()" style="font-weight: 700; height: 32px; padding: 0 18px;">
              Close
            </button>
          </div>
        ` : `
          <div style="display: flex; gap: 8px; align-items: center; margin-left: auto;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.State.closeModal()" style="height: 32px; padding: 0 14px;">Cancel</button>
            <button type="submit" form="create-trf-form" class="btn btn-primary btn-sm" style="font-weight: 700; height: 32px; padding: 0 18px;">Save Stock Transfer</button>
          </div>
        `}
      </div>
    `;

    window.State.showModal({
      title: modalTitle,
      isFullScreen: true,
      maxWidth: '100vw',
      compactHeader: true,
      bodyPadding: '8px 12px',
      bodyFlex: true,
      noScroll: true,
      contentHtml,
      footerHtml
    });

    if (!isReadOnly) {
      this.initSearchDismissListener();
      this.validateTransferEndpoints();
    }
  },

  onSourcePlantChange(plantId) {
    const select = document.getElementById('new-trf-item');
    const items = window.DB.getItemsForFacility(plantId) || [];
    this._currentPlantItems = items;
    if (select) {
      select.innerHTML = items.length === 0
        ? '<option value="">No items mapped to this facility</option>'
        : items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('');
    }

    // Also update From Store warehouses
    const sWhSelect = document.getElementById('new-trf-s-wh');
    if (sWhSelect) {
      const allWh = window.DB.getActiveWarehouses() || [];
      const filteredWh = allWh.filter(w => !w.plant_id || w.plant_id === plantId);
      sWhSelect.innerHTML = (filteredWh.length ? filteredWh : allWh)
        .map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    }

    this._selectedSearchItem = null;
    const bar = document.getElementById('trf-selected-item-bar');
    if (bar) bar.style.display = 'none';

    this.syncDestStoreOptions();
  },

  onDestPlantChange(plantId) {
    this.syncDestStoreOptions();
  },

  onDestStoreChange() {
    this.validateTransferEndpoints();
  },

  syncDestStoreOptions() {
    const sPlant = document.getElementById('new-trf-s-plant')?.value;
    const dPlant = document.getElementById('new-trf-d-plant')?.value;
    const sWhSelect = document.getElementById('new-trf-s-wh');
    const dWhSelect = document.getElementById('new-trf-d-wh');
    if (!dWhSelect) return;

    const sWh = sWhSelect ? sWhSelect.value : '';
    const currentDWh = dWhSelect.value;

    const allWh = window.DB.getActiveWarehouses() || [];
    const facilityWh = allWh.filter(w => !w.plant_id || w.plant_id === dPlant);
    const candidateWh = facilityWh.length ? facilityWh : allWh;

    const isSameFacility = Boolean(sPlant && dPlant && sPlant === dPlant);
    const availableDestWh = isSameFacility
      ? candidateWh.filter(w => w.id !== sWh)
      : candidateWh;

    if (availableDestWh.length === 0) {
      dWhSelect.innerHTML = isSameFacility
        ? '<option value="" disabled selected>No other store in this facility (Change facility)</option>'
        : '<option value="" disabled selected>No active store available in this facility</option>';
    } else {
      const selectedId = availableDestWh.some(w => w.id === currentDWh)
        ? currentDWh
        : availableDestWh[0].id;

      dWhSelect.innerHTML = availableDestWh.map(w => 
        `<option value="${w.id}" ${w.id === selectedId ? 'selected' : ''}>${w.name}</option>`
      ).join('');
    }

    this.validateTransferEndpoints();
  },

  validateTransferEndpoints() {
    const sPlant = document.getElementById('new-trf-s-plant')?.value;
    const dPlant = document.getElementById('new-trf-d-plant')?.value;
    const sWh = document.getElementById('new-trf-s-wh')?.value;
    const dWhSelect = document.getElementById('new-trf-d-wh');
    const dWh = dWhSelect ? dWhSelect.value : '';
    const warningEl = document.getElementById('trf-same-store-warning');
    const submitBtn = (typeof document !== 'undefined' && typeof document.querySelector === 'function')
      ? document.querySelector('button[form="create-trf-form"]')
      : null;

    // Rule: System should not allow transfer between same store in same facility.
    // At least store should be different OR facility should be different.
    const isSameFacilityAndStore = Boolean(sPlant && dPlant && sPlant === dPlant && (!dWh || sWh === dWh));

    if (dWhSelect) {
      if (isSameFacilityAndStore) {
        dWhSelect.style.borderColor = '#ef4444';
        dWhSelect.style.boxShadow = '0 0 0 1px #ef4444';
        if (typeof dWhSelect.setCustomValidity === 'function') {
          dWhSelect.setCustomValidity('Cannot transfer between the same store in the same facility. At least store or facility must be different.');
        }
      } else {
        dWhSelect.style.borderColor = '';
        dWhSelect.style.boxShadow = '';
        if (typeof dWhSelect.setCustomValidity === 'function') {
          dWhSelect.setCustomValidity('');
        }
      }
    }

    if (warningEl) {
      if (isSameFacilityAndStore) {
        warningEl.style.display = 'block';
        if (sPlant === dPlant && sWh === dWh) {
          warningEl.textContent = '⚠️ Cannot transfer between the same store in the same facility. Choose a different store or facility.';
        } else if (!dWh) {
          warningEl.textContent = '⚠️ No other store available in this facility. Please select a different facility.';
        }
      } else {
        warningEl.style.display = 'none';
      }
    }

    if (submitBtn) {
      submitBtn.disabled = isSameFacilityAndStore;
      submitBtn.title = isSameFacilityAndStore ? 'Cannot transfer between same store in same facility' : '';
    }

    return !isSameFacilityAndStore;
  },

  getAvailableStockForItem(item, sWhId = null) {
    if (!item) return 0;
    const finalId = item.id || item.item_id || item;
    const finalCode = item.code || item.item_code || '';
    const sWh = sWhId || document.getElementById('new-trf-s-wh')?.value;
    const balances = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('inventoryBalances') || []) : [];

    let bal = null;
    if (sWh) {
      bal = balances.find(b => (b.item_id === finalId || b.item_id === finalCode || b.item_code === finalCode) && b.warehouse_id === sWh);
    }
    if (!bal) {
      bal = balances.find(b => (b.item_id === finalId || b.item_id === finalCode || b.item_code === finalCode) && ((b.available !== undefined ? b.available : b.on_hand) > 0));
    }
    if (!bal && !sWh) {
      bal = balances.find(b => b.item_id === finalId || b.item_id === finalCode || b.item_code === finalCode);
    }

    if (bal) {
      const avail = bal.available !== undefined ? Number(bal.available) : Number(bal.on_hand);
      return Math.max(0, isNaN(avail) ? 0 : avail);
    }

    const allItems = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('items') || []) : [];
    const itemObj = allItems.find(i => i.id === finalId || i.code === finalCode) || (typeof item === 'object' ? item : null);
    if (itemObj) {
      const s = Number(itemObj.stock !== undefined ? itemObj.stock : (itemObj.current_stock !== undefined ? itemObj.current_stock : (itemObj.available_stock !== undefined ? itemObj.available_stock : 0)));
      return Math.max(0, isNaN(s) ? 0 : s);
    }
    return 0;
  },

  getRemainingAvailableStockForItem(item, sWhId = null) {
    const total = this.getAvailableStockForItem(item, sWhId);
    const itemId = item.id || item.item_id || item;
    const itemCode = item.code || item.item_code || '';
    const alreadyAdded = (this._transferItems || [])
      .filter(i => (i.item_id === itemId || i.code === itemCode))
      .reduce((sum, i) => sum + Number(i.requested || 0), 0);
    return Math.max(0, total - alreadyAdded);
  },

  onStoreChange() {
    const sWhId = document.getElementById('new-trf-s-wh')?.value;
    if (this._selectedSearchItem) {
      this.updateSelectedItemStockDisplay(this._selectedSearchItem);
      this.updateItemBatchOptions(this._selectedSearchItem);
    }
    if (this._transferItems && this._transferItems.length > 0) {
      this._transferItems.forEach(i => {
        i.available_stock = this.getAvailableStockForItem(i, sWhId);
      });
      const tbody = document.getElementById('trf-items-tbody');
      if (tbody) tbody.innerHTML = this.renderTransferItemsTableHtml();

      const overLimit = this._transferItems.some(i => i.requested > i.available_stock);
      if (overLimit) {
        window.State.showToast('Warning: Some items in the list exceed available stock in the newly selected store.', 'warning');
      }
    }
    this.syncDestStoreOptions();
  },

  toggleSearchItemPanel() {
    const panel = document.getElementById('trf-search-panel');
    if (panel) {
      panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
      if (panel.style.display !== 'none') {
        const input = document.getElementById('trf-item-search-query');
        if (input) input.focus();
      }
    }
  },

  onSearchItemClick() {
    const input = document.getElementById('trf-item-search-query');
    this.onSearchItemInput(input ? input.value : '');
    this.showSearchDropdown();
  },

  showSearchDropdown() {
    const dd = document.getElementById('trf-item-search-dropdown');
    if (dd && dd.innerHTML.trim()) {
      dd.style.display = 'block';
    } else {
      const input = document.getElementById('trf-item-search-query');
      this.onSearchItemInput(input ? input.value : '');
    }
  },

  hideSearchDropdown() {
    const dd = document.getElementById('trf-item-search-dropdown');
    if (dd) dd.style.display = 'none';
  },

  initSearchDismissListener() {
    if (this._searchDismissBound) return;
    this._searchDismissBound = true;
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('click', (e) => {
        const panel = document.getElementById('trf-search-panel');
        const dd = document.getElementById('trf-item-search-dropdown');
        if (dd && dd.style.display === 'block' && panel && !panel.contains(e.target)) {
          dd.style.display = 'none';
        }
      });
    }
  },

  onSearchItemInput(query) {
    const q = (query || '').toLowerCase().trim();
    const dd = document.getElementById('trf-item-search-dropdown');
    if (!dd) return;

    const sPlantId = document.getElementById('new-trf-s-plant')?.value;
    const sWhId = document.getElementById('new-trf-s-wh')?.value;
    const items = (this._currentPlantItems && this._currentPlantItems.length)
      ? this._currentPlantItems
      : (window.DB.getItemsForFacility(sPlantId) || window.DB.getAll('items') || []);

    const matches = items.filter(i => {
      if (!q) return true;
      const code = (i.code || i.item_code || '').toLowerCase();
      const name = (i.name || i.item_name || '').toLowerCase();
      const partNo = (i.part_number || '').toLowerCase();
      return code.includes(q) || name.includes(q) || partNo.includes(q);
    });

    if (matches.length === 0) {
      dd.innerHTML = `<div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 11.5px;">No items found matching "${query}".</div>`;
      dd.style.display = 'block';
      return;
    }

    dd.innerHTML = matches.slice(0, 50).map(i => {
      const stock = this.getAvailableStockForItem(i, sWhId);
      const uom = i.stock_uom || i.base_uom || 'NOS';
      const stockColor = stock > 0 ? '#10b981' : '#ef4444';
      return `
        <div class="trf-search-item-row" onclick="window.TransfersModule.selectItemFromSearch('${i.id}')" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border-subtle, rgba(0,0,0,0.06)); display: flex; justify-content: space-between; align-items: center; transition: background 0.15s ease;" onmouseenter="this.style.background='var(--primary-600, #3b82f6)'; this.style.color='#ffffff';" onmouseleave="this.style.background=''; this.style.color='';">
          <div>
            <div style="font-weight: 700; font-size: 12px;">${i.code} <span style="font-weight: 400; font-size: 11px; opacity: 0.85;">(${i.name})</span></div>
            <div style="font-size: 10.5px; opacity: 0.75;">Category: ${i.category || i.item_type || 'General'}</div>
          </div>
          <div style="text-align: right; font-size: 11px;">
            <span style="font-weight: 700; color: ${stockColor};">${stock} ${uom}</span>
          </div>
        </div>
      `;
    }).join('');

    dd.style.display = 'block';
  },

  selectItemFromSearch(itemId) {
    const item = (this._currentPlantItems || window.DB.getAll('items') || []).find(i => i.id === itemId);
    if (!item) return;

    this._selectedSearchItem = item;
    const input = document.getElementById('trf-item-search-query');
    if (input) input.value = `${item.code} - ${item.name}`;

    const select = document.getElementById('new-trf-item');
    if (select) select.value = item.id;

    this.hideSearchDropdown();
    this.updateSelectedItemStockDisplay(item);
    this.updateItemBatchOptions(item);
  },

  fetchItemBatches(item, sWhId = null) {
    if (!item) return [];
    const finalId = item.id || item.item_id || item;
    const finalCode = item.code || item.item_code || '';
    const sWh = sWhId || document.getElementById('new-trf-s-wh')?.value;
    const balances = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('inventoryBalances') || []) : [];
    const grns = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('goodsReceiptNotes') || []) : [];
    const itemBatches = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('itemBatches') || []) : [];

    const foundBatches = [];

    // 1. From Store Balances (real-time inventory batches in selected store)
    balances.forEach(b => {
      const matchItem = (b.item_id === finalId || b.item_id === finalCode || b.item_code === finalCode);
      const matchWh = (!sWh || b.warehouse_id === sWh);
      if (matchItem && matchWh && b.batch_number && b.batch_number.trim()) {
        const batchNum = b.batch_number.trim();
        const qty = Number(b.available !== undefined ? b.available : (b.on_hand || 0));
        const existing = foundBatches.find(x => x.batch_number === batchNum);
        if (existing) {
          existing.available += qty;
        } else {
          foundBatches.push({
            batch_number: batchNum,
            available: qty,
            source: 'Store Stock'
          });
        }
      }
    });

    // 2. From Inward GRNs (goods receipts for this item)
    grns.forEach(grn => {
      if (grn.items && Array.isArray(grn.items)) {
        grn.items.forEach(gi => {
          if ((gi.item_id === finalId || gi.item_code === finalCode) && gi.batch_number && gi.batch_number.trim()) {
            const bNum = gi.batch_number.trim();
            if (!foundBatches.some(fb => fb.batch_number === bNum)) {
              foundBatches.push({
                batch_number: bNum,
                available: Number(gi.received_qty || gi.accepted_qty || 0),
                source: 'Inward GRN'
              });
            }
          }
        });
      }
    });

    // 3. From itemBatches table
    itemBatches.forEach(ib => {
      if ((ib.item_id === finalId || ib.item_code === finalCode) && ib.batch_number && ib.batch_number.trim()) {
        const bNum = ib.batch_number.trim();
        if (!foundBatches.some(fb => fb.batch_number === bNum)) {
          foundBatches.push({
            batch_number: bNum,
            available: Number(ib.current_quantity || ib.initial_quantity || 0),
            source: 'Batch Master'
          });
        }
      }
    });

    return foundBatches;
  },

  updateItemBatchOptions(item) {
    const batchInput = document.getElementById('new-trf-batch');
    const datalist = document.getElementById('trf-batch-datalist');
    if (!batchInput || !item) return;

    const sWhId = document.getElementById('new-trf-s-wh')?.value;
    const actualBatches = this.fetchItemBatches(item, sWhId);

    if (datalist) {
      if (actualBatches.length > 0) {
        datalist.innerHTML = actualBatches.map(b => 
          `<option value="${b.batch_number}">${b.batch_number} (${b.available > 0 ? `${b.available} in ${b.source}` : b.source})</option>`
        ).join('');
      } else {
        datalist.innerHTML = '';
      }
    }

    if (actualBatches.length > 0) {
      // Prioritize active batch with positive available stock
      const activeBatch = actualBatches.find(b => b.available > 0) || actualBatches[0];
      batchInput.value = activeBatch.batch_number;
    } else {
      // Dynamic actual lot formatted per item code and current year
      const cleanCode = (item.code || 'ITM').replace(/[^a-zA-Z0-9]/g, '').slice(-8);
      batchInput.value = `LOT-${cleanCode}-${new Date().getFullYear()}`;
    }
  },

  onTransferQtyInputChange(el) {
    let val = Number(el.value);
    if (isNaN(val) || val < 0) {
      el.value = 0;
      return;
    }

    const item = this._selectedSearchItem;
    if (!item) return;

    const sWhId = document.getElementById('new-trf-s-wh')?.value;
    const remainingStock = this.getRemainingAvailableStockForItem(item, sWhId);
    const uom = item.stock_uom || item.base_uom || 'NOS';

    if (val > remainingStock) {
      el.value = remainingStock;
      window.State.showToast(`Transfer quantity cannot exceed available stock (${remainingStock} ${uom}).`, 'warning');
    }
  },

  updateSelectedItemStockDisplay(item) {
    if (!item) return;
    const qtyInput = document.getElementById('new-trf-qty');
    const availLabel = document.getElementById('trf-qty-avail-label');

    const sWhId = document.getElementById('new-trf-s-wh')?.value;
    const totalStock = this.getAvailableStockForItem(item, sWhId);
    const remainingStock = this.getRemainingAvailableStockForItem(item, sWhId);
    const uom = item.stock_uom || item.base_uom || 'NOS';

    if (availLabel) {
      if (totalStock <= 0) {
        availLabel.textContent = `(0 ${uom} - Out of stock)`;
        availLabel.style.color = '#ef4444';
      } else if (remainingStock < totalStock) {
        availLabel.textContent = `(Avail: ${remainingStock} ${uom} of ${totalStock})`;
        availLabel.style.color = '#10b981';
      } else {
        availLabel.textContent = `(Avail: ${totalStock} ${uom})`;
        availLabel.style.color = '#10b981';
      }
    }

    if (qtyInput) {
      qtyInput.value = '0';
      qtyInput.setAttribute('max', remainingStock);
      qtyInput.setAttribute('min', '0');
    }
  },

  addItemToTransferList() {
    let item = this._selectedSearchItem;
    if (!item) {
      const selectVal = document.getElementById('new-trf-item')?.value;
      if (selectVal) {
        item = (this._currentPlantItems || window.DB.getAll('items') || []).find(i => i.id === selectVal);
      }
    }

    if (!item) {
      const query = (document.getElementById('trf-item-search-query')?.value || '').trim();
      if (query) {
        const matches = (this._currentPlantItems || window.DB.getAll('items') || []).filter(i => 
          (i.code && i.code.toLowerCase().includes(query.toLowerCase())) ||
          (i.name && i.name.toLowerCase().includes(query.toLowerCase()))
        );
        if (matches.length > 0) item = matches[0];
      }
    }

    if (!item) {
      window.State.showToast('Please search and select an item to add.', 'warning');
      return;
    }

    const sWhId = document.getElementById('new-trf-s-wh')?.value;
    const sWh = (window.DB.getActiveWarehouses() || []).find(w => w.id === sWhId);
    const storeName = sWh ? sWh.name : 'From Store';
    const totalAvail = this.getAvailableStockForItem(item, sWhId);
    const remainingAvail = this.getRemainingAvailableStockForItem(item, sWhId);
    const uom = item.stock_uom || item.base_uom || 'NOS';

    if (totalAvail <= 0) {
      window.State.showToast(`Cannot transfer "${item.name}": 0 stock available in ${storeName}.`, 'error');
      return;
    }

    const qtyInput = document.getElementById('new-trf-qty');
    const qty = Number(qtyInput?.value) || 0;

    if (qty <= 0) {
      window.State.showToast('Transfer quantity must be greater than 0. Please enter the quantity to transfer.', 'warning');
      if (qtyInput) qtyInput.focus();
      return;
    }

    if (qty > remainingAvail) {
      window.State.showToast(`Cannot transfer ${qty} ${uom}. Only ${remainingAvail} ${uom} available in ${storeName}.`, 'error');
      if (qtyInput) {
        qtyInput.value = remainingAvail;
        qtyInput.focus();
      }
      return;
    }

    const batchInput = document.getElementById('new-trf-batch');
    const batch = (batchInput?.value || '').trim() || `LOT-${(item.code || 'ITM').replace(/[^a-zA-Z0-9]/g, '').slice(-8)}-${new Date().getFullYear()}`;

    const existing = this._transferItems.find(i => i.item_id === item.id && i.batch_number === batch);
    if (existing) {
      existing.requested += qty;
      existing.dispatched += qty;
      existing.available_stock = totalAvail;
    } else {
      this._transferItems.push({
        item_id: item.id,
        code: item.code,
        name: item.name,
        batch_number: batch,
        available_stock: totalAvail,
        requested: qty,
        dispatched: qty,
        received: 0,
        uom: uom
      });
    }

    const tbody = document.getElementById('trf-items-tbody');
    if (tbody) tbody.innerHTML = this.renderTransferItemsTableHtml();

    // Reset quantity back to default 0 and clear search and batch
    if (qtyInput) {
      qtyInput.value = '0';
      qtyInput.removeAttribute('max');
    }
    const availLabel = document.getElementById('trf-qty-avail-label');
    if (availLabel) availLabel.textContent = '';
    const searchInput = document.getElementById('trf-item-search-query');
    if (searchInput) searchInput.value = '';
    if (batchInput) batchInput.value = '';
    const datalist = document.getElementById('trf-batch-datalist');
    if (datalist) datalist.innerHTML = '';
    this._selectedSearchItem = null;

    window.State.showToast(`Added "${item.name}" (${qty} ${uom}) to transfer list.`, 'success');
  },

  removeTransferItem(index) {
    if (index >= 0 && index < this._transferItems.length) {
      const removed = this._transferItems.splice(index, 1)[0];
      const tbody = document.getElementById('trf-items-tbody');
      if (tbody) tbody.innerHTML = this.renderTransferItemsTableHtml();
      if (removed) {
        window.State.showToast(`Removed "${removed.name || removed.code}" from transfer.`, 'info');
      }
    }
  },

  renderTransferItemsTableHtml(isReadOnly = false) {
    if (!this._transferItems || this._transferItems.length === 0) {
      return `<tr><td colspan="${isReadOnly ? '7' : '8'}" style="text-align: center; color: var(--text-muted); padding: 22px;">No items added yet. ${isReadOnly ? '' : 'Search and select items above to add.'}</td></tr>`;
    }
    return this._transferItems.map((item, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td class="cell-mono cell-strong" style="color: var(--primary-300); text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.code}</td>
        <td style="text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.name}">${item.name}</td>
        <td class="cell-num" style="text-align: right; padding-right: 16px; color: #10b981; font-weight: 600;">${item.available_stock !== undefined ? item.available_stock : '-'}</td>
        <td class="cell-mono" style="text-align: left; padding-left: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.batch_number}</td>
        <td class="cell-num cell-strong" style="text-align: right; padding-right: 16px; color: var(--primary-400);">${item.requested}</td>
        <td style="text-align: center;">${item.uom}</td>
        ${isReadOnly ? '' : `
        <td style="text-align: center;">
          <button type="button" class="btn btn-ghost btn-xs" onclick="window.TransfersModule.removeTransferItem(${idx})" title="Remove item" style="color: var(--color-danger); font-size: 13px; padding: 2px 6px;">
            ✕
          </button>
        </td>`}
      </tr>
    `).join('');
  },

  submitNewTransfer(e) {
    e.preventDefault();
    const sPlant = document.getElementById('new-trf-s-plant')?.value;
    const dPlant = document.getElementById('new-trf-d-plant')?.value;
    if (!window.DB.isPlantActive(sPlant) || !window.DB.isPlantActive(dPlant)) {
      window.State.showToast('Cannot transfer: Source or destination plant is inactive.', 'error');
      return;
    }
    const sWh = document.getElementById('new-trf-s-wh')?.value;
    const dWh = document.getElementById('new-trf-d-wh')?.value;

    // Strict validation: System should not allow transfer between same store in same facility.
    // At least store should be different OR facility should be different.
    if (!dWh) {
      window.State.showToast('Please select a valid destination store. Same facility requires a different store or a different facility.', 'error');
      this.validateTransferEndpoints();
      return;
    }

    if (sPlant === dPlant && sWh === dWh) {
      window.State.showToast('Cannot transfer between the same store in the same facility. At least store or facility must be different.', 'error');
      this.validateTransferEndpoints();
      return;
    }

    const transporter = document.getElementById('new-trf-transporter')?.value;
    const vehicle = document.getElementById('new-trf-vehicle')?.value;
    const reason = document.getElementById('new-trf-reason')?.value;

    if (!this._transferItems || this._transferItems.length === 0) {
      window.State.showToast('Please search and add at least one item to transfer.', 'warning');
      return;
    }

    const sWhObj = (window.DB.getActiveWarehouses() || []).find(w => w.id === sWh);
    const sWhName = sWhObj ? sWhObj.name : 'From Store';

    // If in edit mode, update the existing record
    if (this._editingTransferId) {
      const existing = window.DB.getById('stockTransfers', this._editingTransferId);
      if (existing) {
        const updatedRecord = {
          ...existing,
          source_plant_id: sPlant,
          source_warehouse_id: sWh,
          dest_plant_id: dPlant,
          dest_warehouse_id: dWh,
          reason: reason,
          remarks: reason,
          transporter: transporter,
          vehicle_no: vehicle,
          updated_at: new Date().toISOString(),
          items: this._transferItems.map(i => ({
            item_id: i.item_id || i.id,
            batch_number: i.batch_number || 'DEFAULT',
            requested: Number(i.requested || i.qty || 1),
            dispatched: Number(i.dispatched || i.requested || i.qty || 1),
            received: Number(i.received || 0),
            uom: i.uom || 'NOS'
          }))
        };
        window.DB.update('stockTransfers', this._editingTransferId, updatedRecord);
        window.DB.logAudit('UPDATE_TRANSFER', 'STOCK_TRANSFER', existing.transfer_number, `Updated stock transfer ${existing.transfer_number}`);
        window.State.closeModal();
        window.State.showToast(`Stock Transfer ${existing.transfer_number} updated successfully!`);
        this._editingTransferId = null;
        const viewContainer = document.getElementById('view-container');
        if (viewContainer) {
          window.TransfersModule.render(viewContainer);
        }
        return;
      }
    }
    for (const item of this._transferItems) {
      const avail = this.getAvailableStockForItem(item, sWh);
      const totalRequested = this._transferItems
        .filter(i => (i.item_id === item.item_id || i.code === item.code))
        .reduce((sum, i) => sum + Number(i.requested || 0), 0);

      if (Number(item.requested) <= 0) {
        window.State.showToast(`Transfer quantity for "${item.name || item.code}" must be greater than 0.`, 'error');
        return;
      }

      if (totalRequested > avail) {
        window.State.showToast(`Cannot dispatch transfer: Item "${item.name || item.code}" transfer qty (${totalRequested}) exceeds available stock (${avail} ${item.uom}) in ${sWhName}.`, 'error');
        return;
      }
    }

    const trfNumber = `TRF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const transferRecord = {
      transfer_number: trfNumber,
      source_plant_id: sPlant,
      source_warehouse_id: sWh,
      dest_plant_id: dPlant,
      dest_warehouse_id: dWh,
      reason: reason,
      remarks: reason,
      status: 'IN_TRANSIT',
      transporter: transporter,
      vehicle_no: vehicle,
      dispatched_by: (window.State.currentUser && window.State.currentUser.name) || 'Store Officer',
      dispatched_at: new Date().toISOString(),
      items: this._transferItems.map(i => ({
        item_id: i.item_id || i.id,
        batch_number: i.batch_number || 'DEFAULT',
        requested: Number(i.requested || i.qty || 1),
        dispatched: Number(i.dispatched || i.requested || i.qty || 1),
        received: 0,
        uom: i.uom || 'NOS'
      }))
    };

    window.DB.insert('stockTransfers', transferRecord);

    // Deduct stock from source warehouse
    this._transferItems.forEach(i => {
      try {
        if (window.DB && typeof window.DB.deductItemStock === 'function') {
          window.DB.deductItemStock({
            itemId: i.item_id,
            itemCode: i.code,
            qty: i.requested,
            warehouseId: sWh,
            plantId: sPlant,
            docType: 'STOCK_TRANSFER',
            docNo: trfNumber
          });
        }
      } catch (err) {
        console.warn('Stock ledger deduction note:', err);
      }
    });

    window.DB.logAudit('CREATE_TRANSFER', 'STOCK_TRANSFER', trfNumber, `Dispatched transfer ${trfNumber} (${this._transferItems.length} item(s)) from ${sWhName} to destination facility.`);
    window.State.closeModal();
    window.State.showToast(`Stock Transfer ${trfNumber} dispatched! Marked as In-Transit.`);
    const viewContainer = document.getElementById('view-container');
    if (viewContainer) {
      window.TransfersModule.render(viewContainer);
    }
  }
};
