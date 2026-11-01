/* ==========================================================================
   ENTERPRISE ISCM - STAGE 3: PURCHASE ORDERS (PO)
   Vendor Selection, Tax Calculations, Formal PO Approval & Inward Linking
   ========================================================================== */

window.PurchaseOrdersModule = {
  search: '',
  statusFilter: 'ALL',

  render(container) {
    if (container) this.container = container;
    const target = this.container || document.getElementById('view-container') || document.getElementById('main-content');
    if (!target) return;

    const plantId = window.State.currentPlantId;
    const allPos = window.DB.getAll('purchaseOrders').filter(p => {
      if (!window.DB.isPlantActive(p.plant_id)) return false;
      return plantId === 'ALL' || p.plant_id === plantId;
    });

    const searchLower = (this.search || '').toLowerCase().trim();
    const filtered = allPos.filter(po => {
      if (this.statusFilter !== 'ALL' && po.status !== this.statusFilter) return false;
      if (searchLower) {
        const supplier = window.DB.getById('suppliers', po.supplier_id);
        const corpus = `${po.po_number || ''} ${supplier?.name || ''} ${supplier?.city || ''} ${po.incoterms || ''}`.toLowerCase();
        if (!corpus.includes(searchLower)) return false;
      }
      return true;
    });

    const paged = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'purchase-orders')
      : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    target.innerHTML = `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            Purchase Orders (PO) Register
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.PurchaseOrdersModule.showCreateModal()">
            + Create New Purchase Order
          </button>
        </div>

        <div class="toolbar">
          <div class="toolbar-left">
            <input type="text" id="po-search" class="filter-input" placeholder="Search PO #, supplier name..." value="${this.search || ''}" oninput="window.PurchaseOrdersModule.onSearchInput(this.value)" onkeydown="if(event.key==='Enter') window.PurchaseOrdersModule.filterTable()">
            <select id="po-status-filter" class="filter-select" onchange="window.PurchaseOrdersModule.onStatusFilterChange(this.value)">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
              <option value="APPROVED" ${this.statusFilter === 'APPROVED' ? 'selected' : ''}>Approved / Open</option>
              <option value="PARTIALLY_RECEIVED" ${this.statusFilter === 'PARTIALLY_RECEIVED' ? 'selected' : ''}>Partially Received</option>
              <option value="FULLY_RECEIVED" ${this.statusFilter === 'FULLY_RECEIVED' ? 'selected' : ''}>Fully Received</option>
              <option value="PENDING_APPROVAL" ${this.statusFilter === 'PENDING_APPROVAL' ? 'selected' : ''}>Pending Approval</option>
              <option value="DRAFT" ${this.statusFilter === 'DRAFT' ? 'selected' : ''}>Draft</option>
            </select>
          </div>
          <div class="toolbar-right">
            <span style="font-size:12px; color:var(--text-muted);">Active POs: <b>${filtered.length}</b></span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="po-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier / Vendor</th>
                <th>Order Date</th>
                <th>Expected Delivery</th>
                <th>Incoterms</th>
                <th class="text-right">Total Amount (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${paged.items.length === 0 ? `
                <tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No purchase orders found.</td></tr>
              ` : paged.items.map(po => {
                const supplier = window.DB.getById('suppliers', po.supplier_id);
                return `
                  <tr data-status="${po.status}">
                    <td class="cell-mono cell-strong">
                      <a href="javascript:void(0)" onclick="window.PurchaseOrdersModule.viewPO('${po.id}')" style="color:var(--primary-300); text-decoration:none;">
                        ${po.po_number}
                      </a>
                    </td>
                    <td class="cell-strong">
                      ${supplier ? supplier.name : 'Vendor'}<br>
                      <span style="font-size:11px; color:var(--text-muted);">${supplier ? `⭐ ${supplier.rating} | ${supplier.city}` : ''}</span>
                    </td>
                    <td>${window.formatDate(po.order_date)}</td>
                    <td>${window.formatDate(po.expected_delivery)}</td>
                    <td><span class="status-pill status-draft">${po.incoterms || 'FOR'}</span></td>
                    <td class="cell-num" style="font-size:14px; font-weight:800; color:var(--text-primary);">
                      ₹${Number(po.total_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td>
                      <span class="status-pill ${
                        po.status === 'FULLY_RECEIVED' ? 'status-approved' :
                        po.status === 'PARTIALLY_RECEIVED' ? 'status-in-transit' :
                        po.status === 'APPROVED' ? 'status-completed' :
                        po.status === 'PENDING_APPROVAL' ? 'status-pending' : 'status-draft'
                      }">
                        ${po.status}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.PurchaseOrdersModule.viewPO('${po.id}')">
                          View
                        </button>
                        ${po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED' ? `
                          <button class="btn btn-primary btn-sm" onclick="window.GoodsReceiptModule.createGRNFromPO('${po.id}')">
                            Inward (GRN) →
                          </button>
                        ` : ''}
                        ${po.status === 'PENDING_APPROVAL' ? `
                          <button class="btn btn-success btn-sm" onclick="window.PurchaseOrdersModule.approvePO('${po.id}')">
                            Approve
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

        ${(typeof window !== 'undefined' && window.PaginationHelper) ? window.PaginationHelper.render({
          key: 'purchase-orders',
          pagination: paged,
          onPageChange: 'window.PurchaseOrdersModule.setPage',
          onPageSizeChange: 'window.PurchaseOrdersModule.setPageSize'
        }) : ''}
      </div>
    `;
  },

  onSearchInput(val) {
    this.search = val;
  },

  onStatusFilterChange(val) {
    this.statusFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('purchase-orders');
    this.render();
  },

  setPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('purchase-orders', page);
    this.render();
  },

  setPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('purchase-orders', size);
    this.render();
  },

  filterTable() {
    this.search = document.getElementById('po-search')?.value || '';
    this.statusFilter = document.getElementById('po-status-filter')?.value || 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('purchase-orders');
    this.render();
  },

  viewPO(poId) {
    const po = window.DB.getById('purchaseOrders', poId);
    if (!po) return;

    const supplier = window.DB.getById('suppliers', po.supplier_id);
    const plant = window.DB.getById('plants', po.plant_id);
    const facId = po.plant_id || 'PLANT-01';

    // Check Document Print Configuration Master if configured for facility
    if (window.DocPrintConfigModule && typeof window.DocPrintConfigModule.generatePrintHtml === 'function') {
      const configuredHtml = window.DocPrintConfigModule.generatePrintHtml('PO', facId, po);
      if (configuredHtml) {
        window.State.showModal({
          title: `Purchase Order: ${po.po_number}`,
          maxWidth: '850px',
          contentHtml: `
            <div id="printable-po-view">
              ${configuredHtml}
            </div>
          `,
          footerHtml: `
            <button class="btn btn-secondary" onclick="window.PurchaseOrdersModule.printPO('${po.id}')">Print / Export PDF</button>
            <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
            ${po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED' ? `
              <button class="btn btn-primary" onclick="window.State.closeModal(); window.GoodsReceiptModule.createGRNFromPO('${po.id}')">
                Create Goods Receipt Note (GRN) →
              </button>
            ` : ''}
          `
        });
        return;
      }
    }

    window.State.showModal({
      title: `Purchase Order: ${po.po_number}`,
      maxWidth: '850px',
      contentHtml: `
        <div id="printable-po-view" style="display:flex; flex-direction:column; gap:20px;">
          <!-- Enterprise Header -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border-medium); padding-bottom:16px;">
            <div>
              <h2 style="color:var(--text-primary); font-size:20px; font-weight:800;">Apex Industrial & Automotive Dynamics Ltd.</h2>
              <div style="font-size:12px; color:var(--text-muted);">
                Plant: ${plant?.name || 'Pune Unit'}<br>
                GSTIN: 27AABCA1234F1Z5 | CIN: L29100MH2012PLC889012
              </div>
            </div>
            <div style="text-align:right;">
              <div class="cell-mono" style="font-size:18px; font-weight:800; color:var(--primary-400);">${po.po_number}</div>
              <div style="font-size:12px; color:var(--text-secondary);">Date: ${window.formatDate(po.order_date)}</div>
              <span class="status-pill status-approved" style="margin-top:6px;">${po.status}</span>
            </div>
          </div>

          <!-- Parties Grid -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; background:var(--bg-surface); padding:16px; border-radius:var(--radius-md);">
            <div>
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Vendor / Supplier:</span>
              <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin:4px 0;">${supplier?.name}</div>
              <div style="font-size:12px; color:var(--text-secondary);">
                Contact: ${supplier?.contact || 'Sales Team'}<br>
                Email: ${supplier?.email} | Phone: ${supplier?.phone}<br>
                City: ${supplier?.city}
              </div>
            </div>
            <div>
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Delivery & Commercial Terms:</span>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
                <b>Expected Delivery:</b> ${po.expected_delivery}<br>
                <b>Payment Terms:</b> ${po.payment_terms || 'Net 30 Days'}<br>
                <b>Incoterms:</b> ${po.incoterms || 'FOR Destination'}<br>
                <b>Approved By:</b> ${po.approved_by || 'Sunil Deshmukh (VP Operations)'}
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th class="text-right">Ordered Qty</th>
                  <th class="text-right">Received</th>
                  <th class="text-right">Unit Rate</th>
                  <th class="text-right">GST %</th>
                  <th class="text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(po.items || []).map((item, idx) => {
                  const itemObj = window.DB.getById('items', item.item_id);
                  return `
                    <tr>
                      <td>${idx + 1}</td>
                      <td class="cell-mono">${itemObj?.code || item.item_id}</td>
                      <td class="cell-strong">${itemObj?.name || 'Material Item'}</td>
                      <td class="cell-num">${item.ordered_qty} ${item.uom}</td>
                      <td class="cell-num" style="color:var(--color-success);">${item.received_qty || 0}</td>
                      <td class="cell-num">₹${Number(item.unit_price).toLocaleString('en-IN')}</td>
                      <td class="cell-num">${item.tax_pct !== undefined ? item.tax_pct : 0}%</td>
                      <td class="cell-num">₹${Number(item.total).toLocaleString('en-IN')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="7" style="text-align:right; font-weight:700; color:var(--text-muted);">Subtotal:</td>
                  <td class="cell-num">₹${Number(po.subtotal || po.total_amount).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td colspan="7" style="text-align:right; font-weight:700; color:var(--text-muted);">Taxes (GST ${po.tax_pct !== undefined ? po.tax_pct : ((window.DB && typeof window.DB.getDefaultTax === 'function') ? window.DB.getDefaultTax().rate : 0)}%):</td>
                  <td class="cell-num">₹${Number(po.tax_amount || po.total_amount * 0.153).toLocaleString('en-IN')}</td>
                </tr>
                <tr style="border-top:2px solid var(--border-medium); font-size:15px;">
                  <td colspan="7" style="text-align:right; font-weight:800; color:var(--text-primary);">Grand Total:</td>
                  <td class="cell-num" style="font-weight:800; color:var(--primary-300);">₹${Number(po.total_amount).toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.PurchaseOrdersModule.printPO('${po.id}')">Print / Export PDF</button>
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
        ${po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED' ? `
          <button class="btn btn-primary" onclick="window.State.closeModal(); window.GoodsReceiptModule.createGRNFromPO('${po.id}')">
            Create Goods Receipt Note (GRN) →
          </button>
        ` : ''}
      `
    });
  },

  printPO(poId) {
    const po = window.DB.getById('purchaseOrders', poId);
    if (!po) return;
    const facId = po.plant_id || 'PLANT-01';
    if (window.DocPrintConfigModule && typeof window.DocPrintConfigModule.printConfiguredDocument === 'function') {
      const printed = window.DocPrintConfigModule.printConfiguredDocument('PO', facId, po);
      if (printed) return;
    }
    window.print();
  },

  createPOFromPR(prId) {
    const pr = window.DB.getById('requisitions', prId);
    if (!pr || !window.DB.isPlantActive(pr.plant_id)) {
      window.State.showToast('Cannot convert requisition: Associated facility or organization is inactive.', 'error');
      return;
    }

    const suppliers = window.DB.getAll('suppliers');
    const firstItem = pr.items[0];
    const defaultSupplier = firstItem?.suggested_supplier || suppliers[0]?.id;

    let subtotal = 0;
    let totalTax = 0;
    const defaultTax = (window.DB && typeof window.DB.getDefaultTax === 'function') ? window.DB.getDefaultTax() : { rate: 0, cgst_rate: 0, sgst_rate: 0, igst_rate: 0, name: 'GST 0%' };
    const poItems = (pr.items || []).map(i => {
      const itemObj = window.DB.getById('items', i.item_id);
      const itemTaxRate = (itemObj && itemObj.gst_rate_pct !== undefined && itemObj.gst_rate_pct !== null)
        ? Number(itemObj.gst_rate_pct)
        : defaultTax.rate;
      const taxMasterEntry = (window.DB && typeof window.DB.getTaxByRate === 'function')
        ? window.DB.getTaxByRate(itemTaxRate)
        : { rate: itemTaxRate };
      const effectiveRate = Number(taxMasterEntry.rate) || 0;
      const lineTotal = (i.qty || 0) * (i.est_rate || 0);
      const lineTax = lineTotal * (effectiveRate / 100);
      subtotal += lineTotal;
      totalTax += lineTax;
      return {
        item_id: i.item_id,
        ordered_qty: i.qty,
        received_qty: 0,
        uom: i.uom,
        unit_price: i.est_rate,
        tax_pct: effectiveRate,
        total: Number((lineTotal + lineTax).toFixed(2))
      };
    });

    const tax = Number(totalTax.toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const avgTaxPct = subtotal > 0 ? Math.round((tax / subtotal) * 100) : defaultTax.rate;
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newPO = window.DB.insert('purchaseOrders', {
      po_number: poNumber,
      supplier_id: defaultSupplier,
      plant_id: pr.plant_id,
      pr_id: pr.id,
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery: pr.required_date,
      payment_terms: 'Net 30 Days',
      incoterms: 'FOR Destination',
      subtotal: subtotal,
      tax_amount: tax,
      tax_pct: avgTaxPct,
      total_amount: total,
      status: 'APPROVED',
      approved_by: `${window.State.currentUser.name} (Auto-Converted from ${pr.pr_number})`,
      approved_at: new Date().toISOString(),
      items: poItems
    });

    window.DB.update('requisitions', pr.id, { status: 'PO_CREATED' });

    window.DB.logAudit(
      'CONVERT_PR_TO_PO',
      'PROCUREMENT',
      poNumber,
      `Converted Requisition ${pr.pr_number} into Purchase Order ${poNumber}.`
    );

    window.State.showToast(`Purchase Order ${poNumber} generated successfully from ${pr.pr_number}!`);
    location.hash = '#/orders';
  },

  showCreateModal() {
    const suppliers = window.DB.getAll('suppliers');
    const activePlants = window.DB.getActivePlants();
    const defaultPlantId = (window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId))
      ? window.State.currentPlantId
      : (activePlants[0]?.id || 'PLANT-01');
    const items = window.DB.getItemsForFacility(defaultPlantId).filter(i => i.item_type !== 'FINISHED_GOODS');

    window.State.showModal({
      title: '➕ Direct Purchase Order Creation',
      maxWidth: '850px',
      contentHtml: `
        <form id="create-po-form" onsubmit="window.PurchaseOrdersModule.submitDirectPO(event)">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Facility <span class="required">*</span></label>
              <select id="new-po-plant" class="filter-select" style="width:100%;" onchange="window.PurchaseOrdersModule.onPlantChange(this.value)" required>
                ${activePlants.map(p => `<option value="${p.id}" ${p.id === defaultPlantId ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Select Supplier / Vendor <span class="required">*</span></label>
              <select id="new-po-supplier" class="filter-select" style="width:100%;" required>
                ${suppliers.map(s => `<option value="${s.id}">${s.name} (⭐ ${s.rating})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Expected Delivery Date <span class="required">*</span></label>
              <input type="date" id="new-po-delivery-date" class="form-control" value="${new Date(Date.now() + 14*86400000).toISOString().split('T')[0]}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Incoterms</label>
              <select id="new-po-incoterms" class="filter-select" style="width:100%;">
                <option value="FOR Destination">FOR Destination</option>
                <option value="EXW Facility">EXW Ex-Works</option>
                <option value="FOB Mumbai">FOB Mumbai Port</option>
                <option value="CIF Chennai">CIF Chennai Port</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Terms</label>
              <select id="new-po-terms" class="filter-select" style="width:100%;">
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
                <option value="Advance against PI">Advance against PI</option>
              </select>
            </div>
          </div>

          <div style="margin-top:16px; border-top:1px solid var(--border-subtle); padding-top:16px;">
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:10px;">PO Material Items</div>
            <div id="po-lines-container" style="display:flex; flex-direction:column; gap:10px;">
              <div class="po-line-row" style="display:grid; grid-template-columns: 3fr 1.5fr 1.5fr 40px; gap:10px; align-items:center;">
                <div>
                  <label class="form-label" style="font-size:10px;">Material Item</label>
                  <select class="filter-select po-item-select" style="width:100%;" required>
                    ${items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size:10px;">Quantity</label>
                  <input type="number" class="form-control po-qty-input" value="200" min="1" required>
                </div>
                <div>
                  <label class="form-label" style="font-size:10px;">Unit Rate (₹)</label>
                  <input type="number" class="form-control po-rate-input" value="${items[0]?.last_purchase_price || 150}" required>
                </div>
                <div style="padding-top:18px;">
                  <button type="button" class="btn btn-danger btn-sm" style="padding:0 8px;" onclick="this.closest('.po-line-row').remove()">✕</button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="padding-right:0; padding-bottom:0; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create & Approve Purchase Order</button>
          </div>
        </form>
      `
    });
  },

  onPlantChange(plantId) {
    const items = window.DB.getItemsForFacility(plantId).filter(i => i.item_type !== 'FINISHED_GOODS');
    const selects = document.querySelectorAll('.po-item-select');
    selects.forEach(select => {
      select.innerHTML = items.length === 0
        ? '<option value="">No items mapped to this facility</option>'
        : items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('');
    });
  },

  submitDirectPO(e) {
    e.preventDefault();
    const plantId = document.getElementById('new-po-plant')?.value || (window.DB.isPlantActive(window.State.currentPlantId) ? window.State.currentPlantId : window.DB.getActivePlants()[0]?.id);
    const supplierId = document.getElementById('new-po-supplier').value;
    const deliveryDate = document.getElementById('new-po-delivery-date').value;
    const incoterms = document.getElementById('new-po-incoterms').value;
    const terms = document.getElementById('new-po-terms').value;

    const lineRows = document.querySelectorAll('.po-line-row');
    let subtotal = 0;
    const poItems = [];

    lineRows.forEach(row => {
      const select = row.querySelector('.po-item-select');
      const qtyInput = row.querySelector('.po-qty-input');
      const rateInput = row.querySelector('.po-rate-input');

      const itemObj = window.DB.getById('items', select.value);
      const qty = Number(qtyInput.value);
      const rate = Number(rateInput.value);
      const lineTotal = qty * rate;
      subtotal += lineTotal;

      const itemTaxRate = (itemObj && itemObj.gst_rate_pct !== undefined && itemObj.gst_rate_pct !== null)
        ? Number(itemObj.gst_rate_pct)
        : defaultTax.rate;
      const taxMasterEntry = (window.DB && typeof window.DB.getTaxByRate === 'function')
        ? window.DB.getTaxByRate(itemTaxRate)
        : { rate: itemTaxRate };
      const effectiveRate = Number(taxMasterEntry.rate) || 0;
      const lineTax = lineTotal * (effectiveRate / 100);
      totalTax += lineTax;

      poItems.push({
        item_id: select.value,
        ordered_qty: qty,
        received_qty: 0,
        uom: itemObj ? itemObj.base_uom : 'NOS',
        unit_price: rate,
        tax_pct: effectiveRate,
        total: Number((lineTotal + lineTax).toFixed(2))
      });
    });

    const tax = Number(totalTax.toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const avgTaxPct = subtotal > 0 ? Math.round((tax / subtotal) * 100) : defaultTax.rate;
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    window.DB.insert('purchaseOrders', {
      po_number: poNumber,
      supplier_id: supplierId,
      plant_id: plantId,
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery: deliveryDate,
      payment_terms: terms,
      incoterms: incoterms,
      subtotal: subtotal,
      tax_amount: tax,
      tax_pct: avgTaxPct,
      total_amount: total,
      status: 'APPROVED',
      approved_by: `${window.State.currentUser.name} (${window.State.currentUser.role})`,
      approved_at: new Date().toISOString(),
      items: poItems
    });

    window.DB.logAudit('CREATE_PO', 'PROCUREMENT', poNumber, `Created PO ${poNumber} for vendor ${supplierId}.`);
    window.State.closeModal();
    window.State.showToast(`Purchase Order ${poNumber} created and approved!`);
    window.PurchaseOrdersModule.render(document.getElementById('view-container'));
  }
};
