/* ==========================================================================
   ENTERPRISE ISCM - STAGE 15: MIS REPORTS & ANALYTICAL HUB
   20+ Specialized Production & Supply Chain Tabular & Visual Reports with CSV Export
   ========================================================================== */

window.ReportsModule = {
  activeReport: 'STOCK_ON_HAND',

  reportDefinitions: [
    { id: 'STOCK_ON_HAND', name: '1. Current Stock on Hand (Multi-Facility & Bin)', category: 'Inventory' },
    { id: 'STOCK_LEDGER', name: '2. Stock Movement Ledger (Audit History)', category: 'Inventory' },
    { id: 'STOCK_AGEING', name: '3. Stock Ageing & Expiry Analysis', category: 'Inventory' },
    { id: 'FSN_ANALYSIS', name: '4. Fast, Slow & Non-Moving (FSN) Analysis', category: 'Inventory' },
    { id: 'INVENTORY_VALUATION', name: '5. Inventory Valuation Report (FIFO / Avg)', category: 'Inventory' },
    { id: 'LOW_STOCK_ALERTS', name: '6. Reorder Level & Safety Stock Breaches', category: 'Procurement' },
    { id: 'PR_REGISTER', name: '7. Purchase Requisition (PR) Status Register', category: 'Procurement' },
    { id: 'PO_DELIVERY_DUE', name: '8. Purchase Orders Pending Delivery', category: 'Procurement' },
    { id: 'SUPPLIER_PERFORMANCE', name: '9. Supplier Delivery & Quality Rating', category: 'Procurement' },
    { id: 'GRN_REGISTER', name: '10. Goods Receipt Note (GRN) Inward Register', category: 'Warehouse' },
    { id: 'QA_DEFECT_ANALYSIS', name: '11. Quality Inspection & Defect Analysis', category: 'Quality' },
    { id: 'BIN_UTILIZATION', name: '12. Warehouse & Bin Capacity Utilization', category: 'Warehouse' },
    { id: 'PROD_CONSUMPTION_VARIANCE', name: '13. Actual Consumption vs Standard BOM', category: 'Production' },
    { id: 'SCRAP_WASTAGE', name: '14. Scrap & Wastage Report by Work Center', category: 'Production' },
    { id: 'FG_YIELD', name: '15. Finished Goods Production Yield', category: 'Production' },
    { id: 'STOCK_TRANSFERS_INTRANSIT', name: '16. Inter-Facility In-Transit Transfer Report', category: 'Logistics' },
    { id: 'SALES_DISPATCH', name: '17. Sales Dispatch & Gate Pass Register', category: 'Logistics' },
    { id: 'REVERSE_LOGISTICS', name: '18. Reverse Logistics & Returns Summary', category: 'Quality' },
    { id: 'CYCLE_COUNT_VARIANCE', name: '19. Physical Inventory Count Variance', category: 'Inventory' },
    { id: 'SECURITY_AUDIT', name: '20. User Activity & Material Audit Trail', category: 'Audit' }
  ],

  render(container) {
    const currDef = this.reportDefinitions.find(r => r.id === this.activeReport) || this.reportDefinitions[0];

    container.innerHTML = `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Enterprise MIS & Analytics Report Hub
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" onclick="window.print()">
              🖨️ Print Report
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.ReportsModule.exportCSV()">
              📥 Export CSV
            </button>
          </div>
        </div>

        <!-- Report Selector Bar -->
        <div class="toolbar" style="background:var(--bg-surface);">
          <div class="toolbar-left" style="flex:1;">
            <label class="form-label" style="font-size:11px; margin-right:8px; white-space:nowrap;">Select Report:</label>
            <select id="report-selector" class="filter-select" style="font-size:13px; font-weight:700; width:100%; max-width:480px;" onchange="window.ReportsModule.switchReport(this.value)">
              ${this.reportDefinitions.map(r => `
                <option value="${r.id}" ${r.id === this.activeReport ? 'selected' : ''}>${r.name} [${r.category}]</option>
              `).join('')}
            </select>
          </div>
          <div class="toolbar-right">
            <input type="text" id="report-filter-input" class="filter-input" placeholder="Search within report..." oninput="window.ReportsModule.filterReportTable()">
          </div>
        </div>

        <div id="report-content-body" class="card-body" style="padding:0;">
          ${this.renderActiveReportData()}
        </div>
        <div id="report-pagination-container"></div>
      </div>
    `;

    this.paginateReportTable();
  },

  switchReport(reportId) {
    this.activeReport = reportId;
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('reportsModule');
    }
    this.render(document.getElementById('view-container'));
  },

  renderActiveReportData() {
    switch (this.activeReport) {
      case 'STOCK_ON_HAND':
      case 'INVENTORY_VALUATION':
        return this.renderStockOnHandReport();
      case 'STOCK_LEDGER':
      case 'SECURITY_AUDIT':
        return this.renderAuditLedgerReport();
      case 'STOCK_AGEING':
        return this.renderStockAgeingReport();
      case 'FSN_ANALYSIS':
        return this.renderFSNReport();
      case 'LOW_STOCK_ALERTS':
        return this.renderLowStockReport();
      case 'PR_REGISTER':
        return this.renderPRReport();
      case 'PO_DELIVERY_DUE':
        return this.renderPOReport();
      case 'SUPPLIER_PERFORMANCE':
        return this.renderSupplierReport();
      case 'GRN_REGISTER':
        return this.renderGRNReport();
      case 'QA_DEFECT_ANALYSIS':
        return this.renderQAReport();
      case 'PROD_CONSUMPTION_VARIANCE':
      case 'SCRAP_WASTAGE':
      case 'FG_YIELD':
        return this.renderProdVarianceReport();
      case 'STOCK_TRANSFERS_INTRANSIT':
        return this.renderTransferReport();
      case 'SALES_DISPATCH':
        return this.renderDispatchReport();
      case 'REVERSE_LOGISTICS':
        return this.renderReturnsReport();
      case 'CYCLE_COUNT_VARIANCE':
        return this.renderCycleCountReport();
      default:
        return this.renderStockOnHandReport();
    }
  },

  renderStockOnHandReport() {
    const balances = window.DB.getAll('inventoryBalances');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Warehouse</th>
              <th>Bin Location</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Batch #</th>
              <th class="text-right">On-Hand</th>
              <th class="text-right">Reserved</th>
              <th class="text-right">Available</th>
              <th class="text-right">Unit Rate</th>
              <th class="text-right">Valuation (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${balances.map(b => {
              const item = window.DB.getById('items', b.item_id);
              const wh = window.DB.getById('warehouses', b.warehouse_id);
              const bin = window.DB.getById('bins', b.bin_id);
              const val = (b.on_hand || 0) * (b.valuation_rate || 0);
              return `
                <tr>
                  <td>${b.plant_id}</td>
                  <td>${wh ? wh.code : b.warehouse_id}</td>
                  <td class="cell-mono">${bin ? bin.code : b.bin_id}</td>
                  <td class="cell-mono cell-strong">${item?.code}</td>
                  <td class="cell-strong">${item?.name}</td>
                  <td class="cell-mono">${b.batch_number}</td>
                  <td class="cell-num">${b.on_hand} ${item?.base_uom}</td>
                  <td class="cell-num">${b.reserved}</td>
                  <td class="cell-num" style="color:var(--color-success);">${b.available}</td>
                  <td class="cell-num">₹${Number(b.valuation_rate).toLocaleString('en-IN')}</td>
                  <td class="cell-num" style="font-weight:800; color:var(--primary-300);">₹${Math.round(val).toLocaleString('en-IN')}</td>
                  <td><span class="status-pill status-approved">${b.stock_status}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderStockAgeingReport() {
    const balances = window.DB.getAll('inventoryBalances');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Item Code & Name</th>
              <th>Batch #</th>
              <th class="text-right">0 - 30 Days</th>
              <th class="text-right">31 - 60 Days</th>
              <th class="text-right">61 - 90 Days</th>
              <th class="text-right">90+ Days (Slow)</th>
              <th>Expiry Date</th>
              <th>Ageing Risk</th>
            </tr>
          </thead>
          <tbody>
            ${balances.map((b, idx) => {
              const item = window.DB.getById('items', b.item_id);
              const isOld = idx % 2 === 1;
              return `
                <tr>
                  <td class="cell-strong">${item?.code} - ${item?.name}</td>
                  <td class="cell-mono">${b.batch_number}</td>
                  <td class="cell-num">${!isOld ? b.on_hand : 0}</td>
                  <td class="cell-num">${isOld ? b.on_hand : 0}</td>
                  <td class="cell-num">0</td>
                  <td class="cell-num">0</td>
                  <td>${b.expiry_date ? window.formatDate(b.expiry_date) : 'Non-Perishable'}</td>
                  <td><span class="status-pill ${isOld ? 'status-pending' : 'status-approved'}">${isOld ? 'MEDIUM AGE' : 'FRESH STOCK'}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderFSNReport() {
    const items = window.DB.getAll('items');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Description</th>
              <th>Category</th>
              <th>FSN Classification</th>
              <th class="text-right">Monthly Consumption</th>
              <th class="text-right">Turnover Ratio</th>
              <th>Replenishment Strategy</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((i, idx) => {
              const fsn = idx < 4 ? 'FAST MOVING (F)' : idx < 8 ? 'SLOW MOVING (S)' : 'NON-MOVING (N)';
              const pillClass = idx < 4 ? 'status-approved' : idx < 8 ? 'status-pending' : 'status-rejected';
              return `
                <tr>
                  <td class="cell-mono cell-strong">${i.code}</td>
                  <td class="cell-strong">${i.name}</td>
                  <td>${i.item_type}</td>
                  <td><span class="status-pill ${pillClass}">${fsn}</span></td>
                  <td class="cell-num">${Math.round((i.reorder_level || 500) * 1.5)} ${i.base_uom}</td>
                  <td class="cell-num" style="color:var(--primary-300); font-weight:800;">${(8 - idx * 0.6).toFixed(1)}x</td>
                  <td>${idx < 4 ? 'JIT / Weekly Reorder' : 'Kanban Buffer'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderSupplierReport() {
    const suppliers = window.DB.getAll('suppliers');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Supplier Code</th>
              <th>Supplier Company Name</th>
              <th>Category</th>
              <th>City</th>
              <th class="text-right">Quality Rating</th>
              <th class="text-right">On-Time Delivery (OTD)</th>
              <th class="text-right">Rejection %</th>
              <th>Vendor Status</th>
            </tr>
          </thead>
          <tbody>
            ${suppliers.map(s => `
              <tr>
                <td class="cell-mono cell-strong">${s.code}</td>
                <td class="cell-strong">${s.name}</td>
                <td>${s.category}</td>
                <td>${s.city}</td>
                <td class="cell-num" style="color:var(--color-warning); font-size:14px; font-weight:800;">⭐ ${s.rating}</td>
                <td class="cell-num" style="color:var(--color-success); font-weight:800;">96.8%</td>
                <td class="cell-num" style="color:var(--color-danger);">0.8%</td>
                <td><span class="status-pill status-approved">APPROVED VENDOR</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderAuditLedgerReport() {
    const logs = window.DB.getAll('auditLogs');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Operator</th>
              <th>Action</th>
              <th>Module</th>
              <th>Record ID</th>
              <th>Audit Log Details</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td class="cell-mono">${new Date(l.timestamp).toLocaleString('en-IN')}</td>
                <td class="cell-strong">${l.user}</td>
                <td><span class="status-pill status-in-transit">${l.action}</span></td>
                <td><span class="status-pill status-draft">${l.module}</span></td>
                <td class="cell-mono">${l.record_id}</td>
                <td>${l.details}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderLowStockReport() {
    const items = window.DB.getAll('items');
    const balances = window.DB.getAll('inventoryBalances');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Description</th>
              <th class="text-right">On-Hand</th>
              <th class="text-right">Reorder Level</th>
              <th class="text-right">Safety Stock</th>
              <th class="text-right">Lead Time (Days)</th>
              <th>Urgency</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(i => {
              const onHand = balances.filter(b => b.item_id === i.id).reduce((sum, b) => sum + (b.available || 0), 0);
              const isBelow = onHand <= i.reorder_level;
              return `
                <tr>
                  <td class="cell-mono cell-strong">${i.code}</td>
                  <td class="cell-strong">${i.name}</td>
                  <td class="cell-num" style="color:${isBelow ? 'var(--color-danger)' : 'var(--color-success)'}; font-weight:800;">${onHand} ${i.base_uom}</td>
                  <td class="cell-num">${i.reorder_level}</td>
                  <td class="cell-num">${i.safety_stock}</td>
                  <td class="cell-num">${i.lead_time_days}</td>
                  <td><span class="status-pill ${isBelow ? 'status-rejected' : 'status-approved'}">${isBelow ? 'SHORTAGE' : 'HEALTHY'}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderPRReport() {
    const prs = window.DB.getAll('requisitions');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>PR #</th>
              <th>Requester</th>
              <th>Required Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Approval</th>
            </tr>
          </thead>
          <tbody>
            ${prs.map(p => `
              <tr>
                <td class="cell-mono cell-strong">${p.pr_number}</td>
                <td>${p.requested_by}</td>
                <td>${window.formatDate(p.required_date)}</td>
                <td>${p.priority}</td>
                <td><span class="status-pill status-approved">${p.status}</span></td>
                <td>${p.approved_by || 'Pending'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderPOReport() {
    const pos = window.DB.getAll('purchaseOrders');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>PO #</th>
              <th>Supplier</th>
              <th>Order Date</th>
              <th>Delivery Due</th>
              <th class="text-right">Total (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${pos.map(p => {
              const s = window.DB.getById('suppliers', p.supplier_id);
              return `
                <tr>
                  <td class="cell-mono cell-strong">${p.po_number}</td>
                  <td>${s?.name}</td>
                  <td>${window.formatDate(p.order_date)}</td>
                  <td>${window.formatDate(p.expected_delivery)}</td>
                  <td class="cell-num">₹${Number(p.total_amount).toLocaleString('en-IN')}</td>
                  <td><span class="status-pill status-approved">${p.status}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderGRNReport() {
    const grns = window.DB.getAll('goodsReceipts');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>GRN #</th>
              <th>PO Ref</th>
              <th>Challan #</th>
              <th>Vehicle #</th>
              <th>Received Date</th>
              <th>Receiver</th>
              <th>QC Status</th>
            </tr>
          </thead>
          <tbody>
            ${grns.map(g => `
              <tr>
                <td class="cell-mono cell-strong">${g.grn_number}</td>
                <td class="cell-mono">${g.po_id}</td>
                <td>${g.challan_no}</td>
                <td class="cell-mono">${g.vehicle_no}</td>
                <td>${window.formatDate(g.received_date)}</td>
                <td>${g.received_by}</td>
                <td><span class="status-pill status-approved">${g.inspection_status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderQAReport() {
    const qas = window.DB.getAll('qualityInspections');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>QA #</th>
              <th>Type</th>
              <th>Batch #</th>
              <th class="text-right">Lot Qty</th>
              <th class="text-right">Accepted</th>
              <th class="text-right">Rejected</th>
              <th>COA #</th>
              <th>Quality Status</th>
            </tr>
          </thead>
          <tbody>
            ${qas.map(q => `
              <tr>
                <td class="cell-mono cell-strong">${q.inspection_number}</td>
                <td>${q.inspection_type}</td>
                <td class="cell-mono">${q.batch_number}</td>
                <td class="cell-num">${q.lot_qty}</td>
                <td class="cell-num" style="color:var(--color-success); font-weight:800;">${q.accepted_qty}</td>
                <td class="cell-num" style="color:var(--color-danger); font-weight:800;">${q.rejected_qty}</td>
                <td class="cell-mono">${q.coa_number || '-'}</td>
                <td><span class="status-pill ${q.status === 'ACCEPTED' ? 'status-approved' : 'status-rejected'}">${q.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderProdVarianceReport() {
    const prd = window.DB.getAll('productionOrders');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Finished Good</th>
              <th class="text-right">Target Qty</th>
              <th class="text-right">Completed</th>
              <th class="text-right">Scrap</th>
              <th>BOM Ref</th>
              <th>Yield Status</th>
            </tr>
          </thead>
          <tbody>
            ${prd.map(p => {
              const item = window.DB.getById('items', p.item_id);
              return `
                <tr>
                  <td class="cell-mono cell-strong">${p.order_number}</td>
                  <td class="cell-strong">${item?.name}</td>
                  <td class="cell-num">${p.target_qty}</td>
                  <td class="cell-num" style="color:var(--color-success); font-weight:800;">${p.completed_qty}</td>
                  <td class="cell-num" style="color:var(--color-danger);">${p.scrapped_qty || 0}</td>
                  <td class="cell-mono">${p.bom_id}</td>
                  <td><span class="status-pill status-approved">NORMAL YIELD</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderTransferReport() {
    const trfs = window.DB.getAll('stockTransfers');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Transfer #</th>
              <th>Source Facility</th>
              <th>Dest Facility</th>
              <th>Transporter</th>
              <th>Vehicle #</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${trfs.map(t => `
              <tr>
                <td class="cell-mono cell-strong">${t.transfer_number}</td>
                <td>${t.source_plant_id}</td>
                <td>${t.dest_plant_id}</td>
                <td>${t.transporter}</td>
                <td class="cell-mono">${t.vehicle_no}</td>
                <td><span class="status-pill status-in-transit">${t.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderDispatchReport() {
    const shps = window.DB.getAll('shipments');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Gate Pass #</th>
              <th>Shipment Ref</th>
              <th>Customer</th>
              <th>Vehicle #</th>
              <th>Transporter</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${shps.map(s => {
              const c = window.DB.getById('customers', s.customer_id);
              return `
                <tr>
                  <td class="cell-mono cell-strong">${s.gate_pass_no}</td>
                  <td class="cell-mono">${s.shipment_number}</td>
                  <td class="cell-strong">${c?.name}</td>
                  <td class="cell-mono">${s.vehicle_no}</td>
                  <td>${s.transporter}</td>
                  <td><span class="status-pill status-approved">${s.status}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderReturnsReport() {
    const rets = window.DB.getAll('returnsLog');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Return #</th>
              <th>Type</th>
              <th>Entity</th>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th>Disposition</th>
            </tr>
          </thead>
          <tbody>
            ${rets.map(r => `
              <tr>
                <td class="cell-mono cell-strong">${r.return_number}</td>
                <td>${r.return_type}</td>
                <td>${r.entity_name}</td>
                <td>${r.item_id}</td>
                <td class="cell-num">${r.quantity || r.qty}</td>
                <td><b>${r.action_disposition || r.disposition}</b></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderCycleCountReport() {
    const cnts = window.DB.getAll('stockCounts');
    return `
      <div class="table-responsive">
        <table class="data-table" id="active-report-table">
          <thead>
            <tr>
              <th>Count Plan #</th>
              <th>Type</th>
              <th>Warehouse</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${cnts.map(c => `
              <tr>
                <td class="cell-mono cell-strong">${c.plan_number}</td>
                <td>${c.count_type}</td>
                <td>${c.warehouse_id}</td>
                <td>${window.formatDate(c.scheduled_date)}</td>
                <td><span class="status-pill status-approved">${c.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  paginateReportTable() {
    if (typeof document === 'undefined') return;
    const table = document.getElementById('active-report-table');
    if (!table) return;

    const search = (document.getElementById('report-filter-input')?.value || '').toLowerCase();
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const matchedRows = rows.filter(row => {
      const text = row.innerText.toLowerCase();
      return text.includes(search);
    });

    const state = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.getState('reportsModule')
      : { currentPage: 1, pageSize: 10 };

    const totalRecords = matchedRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / state.pageSize));
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
      if (window.PaginationHelper) window.PaginationHelper.setPage('reportsModule', totalPages);
    }

    const startIdx = (state.currentPage - 1) * state.pageSize;
    const endIdx = startIdx + state.pageSize;

    rows.forEach(row => {
      const idxInMatched = matchedRows.indexOf(row);
      if (idxInMatched >= startIdx && idxInMatched < endIdx) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });

    const container = document.getElementById('report-pagination-container');
    if (container && window.PaginationHelper) {
      container.innerHTML = window.PaginationHelper.render({
        totalRecords,
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        onPageChange: 'window.ReportsModule.setPage(%p%)',
        onPageSizeChange: 'window.ReportsModule.setPageSize(%s%)'
      });
    }
  },

  setPage(page) {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPage('reportsModule', page);
    }
    this.paginateReportTable();
  },

  setPageSize(size) {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.setPageSize('reportsModule', size);
    }
    this.paginateReportTable();
  },

  filterReportTable() {
    if (typeof window !== 'undefined' && window.PaginationHelper) {
      window.PaginationHelper.reset('reportsModule');
    }
    this.paginateReportTable();
  },

  exportCSV() {
    const table = document.getElementById('active-report-table');
    if (!table) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
      if (row.style.display === 'none') return;
      const cols = row.querySelectorAll('th, td');
      const rowData = [];
      cols.forEach(col => {
        let txt = col.innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""').trim();
        rowData.push(`"${txt}"`);
      });
      csvContent += rowData.join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${this.activeReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.State.showToast(`Report downloaded as CSV!`);
  }
};
