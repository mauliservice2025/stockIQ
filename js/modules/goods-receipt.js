/* ==========================================================================
   ENTERPRISE ISCM - STAGE 4: GOODS RECEIPT NOTE (GRN) / INWARD
   With PO & Direct GRN Inward, Authorization Approval & Stock Ledger Posting
   ========================================================================== */

window.GoodsReceiptModule = {
  currentInwardTab: 'WITH_PO',
  activePOId: null,
  directGRNItems: [],
  search: '',
  typeFilter: 'ALL',
  statusFilter: 'ALL',

  render(container) {
    if (container) this.container = container;
    const target = this.container || document.getElementById('view-container') || document.getElementById('main-content');
    if (!target) return;

    const plantId = window.State.currentPlantId;
    const allGrns = (window.DB.getAll('goodsReceipts') || []).filter(g => {
      if (!window.DB.isPlantActive(g.plant_id)) return false;
      return plantId === 'ALL' || g.plant_id === plantId;
    });

    const searchLower = (this.search || '').toLowerCase().trim();
    const filtered = allGrns.filter(g => {
      const isDirect = (g.grn_type === 'DIRECT' || !g.po_id);
      const effectiveType = isDirect ? 'DIRECT' : 'WITH_PO';
      if (this.typeFilter !== 'ALL' && effectiveType !== this.typeFilter) return false;
      if (this.statusFilter !== 'ALL' && (g.status || 'PENDING_APPROVAL') !== this.statusFilter) return false;
      if (searchLower) {
        const supplier = window.DB.getById('suppliers', g.supplier_id);
        const po = g.po_id ? window.DB.getById('purchaseOrders', g.po_id) : null;
        const store = window.DB.getById('warehouses', g.warehouse_id);
        const corpus = `${g.grn_number || ''} ${po?.po_number || g.po_number || ''} ${supplier?.name || g.supplier_name || ''} ${store?.name || ''} ${g.challan_no || ''} ${g.invoice_no || ''}`.toLowerCase();
        if (!corpus.includes(searchLower)) return false;
      }
      return true;
    });

    const paged = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'goods-receipt')
      : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    // Remove breadcrumbs, fix page title, and remove pin button on GRN screen
    const breadcrumbsWrap = (typeof document !== 'undefined') ? document.querySelector('.breadcrumbs') : null;
    if (breadcrumbsWrap) breadcrumbsWrap.style.display = 'none';

    const pageTitle = (typeof document !== 'undefined') ? document.getElementById('page-title-text') : null;
    if (pageTitle) pageTitle.textContent = 'Goods Receipt Notes (GRN)';

    const pinBtn = (typeof document !== 'undefined') ? document.getElementById('header-screen-pin-btn') : null;
    if (pinBtn) pinBtn.remove();

    const actionsHtml = `
      <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <input type="text" id="grn-search" class="filter-input" placeholder="Search GRN, PO, vendor..." value="${this.search || ''}" oninput="window.GoodsReceiptModule.onSearchInput(this.value)" onkeydown="if(event.key==='Enter') window.GoodsReceiptModule.filterTable()" style="width: 180px; height: 30px; font-size: 11.5px;">
        <select id="grn-type-filter" class="filter-select" onchange="window.GoodsReceiptModule.onTypeFilterChange(this.value)" style="width: 110px; height: 30px; font-size: 11.5px;">
          <option value="ALL" ${this.typeFilter === 'ALL' ? 'selected' : ''}>All Types</option>
          <option value="WITH_PO" ${this.typeFilter === 'WITH_PO' ? 'selected' : ''}>With PO</option>
          <option value="DIRECT" ${this.typeFilter === 'DIRECT' ? 'selected' : ''}>Without PO</option>
        </select>
        <select id="grn-status-filter" class="filter-select" onchange="window.GoodsReceiptModule.onStatusFilterChange(this.value)" style="width: 130px; height: 30px; font-size: 11.5px;">
          <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
          <option value="PENDING_APPROVAL" ${this.statusFilter === 'PENDING_APPROVAL' ? 'selected' : ''}>Pending Approval</option>
          <option value="APPROVED" ${this.statusFilter === 'APPROVED' ? 'selected' : ''}>Approved / In Stock</option>
          <option value="REJECTED" ${this.statusFilter === 'REJECTED' ? 'selected' : ''}>Rejected</option>
        </select>
        <button class="btn btn-primary btn-sm" onclick="window.GoodsReceiptModule.showInwardModal()" style="height: 30px; font-size: 11.5px; font-weight: 600; padding: 0 14px; white-space: nowrap;">
          + GRN
        </button>
      </div>
    `;

    const pageActions = (typeof document !== 'undefined') ? document.getElementById('page-actions-container') : null;
    if (pageActions) {
      pageActions.innerHTML = actionsHtml;
    }

    target.innerHTML = `
      <div class="content-card">
        ${!pageActions ? `
          <div class="card-header" style="display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; padding: 10px 16px;">
            ${actionsHtml}
          </div>
        ` : ''}

        <div class="table-responsive">
          <table class="data-table" id="grn-table">
            <thead>
              <tr>
                <th>GRN Number</th>
                <th>Type</th>
                <th>PO Reference</th>
                <th>Supplier / Vendor</th>
                <th>Receiving Store</th>
                <th>Challan / Invoice</th>
                <th>Received Date</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${paged.items.length === 0 ? `
                <tr><td colspan="9" style="text-align:center; padding:35px; color:var(--text-muted);">No Goods Receipt Notes (GRN) recorded matching criteria.</td></tr>
              ` : paged.items.map(g => {
                const supplier = window.DB.getById('suppliers', g.supplier_id);
                const po = g.po_id ? window.DB.getById('purchaseOrders', g.po_id) : null;
                const store = window.DB.getById('warehouses', g.warehouse_id);
                const isPending = (g.status === 'PENDING_APPROVAL' || g.inspection_status === 'PENDING_APPROVAL');
                const isApproved = (g.status === 'APPROVED' || g.status === 'COMPLETED');
                const isRejected = (g.status === 'REJECTED');
                const isDirect = (g.grn_type === 'DIRECT' || !g.po_id);

                return `
                  <tr data-type="${g.grn_type || (isDirect ? 'DIRECT' : 'WITH_PO')}" data-status="${g.status || 'PENDING_APPROVAL'}">
                    <td class="cell-mono cell-strong">
                      <a href="javascript:void(0)" onclick="window.GoodsReceiptModule.viewGRN('${g.id}')" style="color:var(--primary-300); text-decoration:none; font-weight:700;">
                        ${g.grn_number}
                      </a>
                    </td>
                    <td>
                      <span class="badge ${isDirect ? 'badge-subtle' : 'badge-primary'}" style="font-size: 10px; padding: 2px 7px;">
                        ${isDirect ? 'Without PO' : 'With PO'}
                      </span>
                    </td>
                    <td class="cell-mono">${po ? po.po_number : (g.po_number || 'Direct Inward')}</td>
                    <td class="cell-strong">${supplier ? supplier.name : (g.supplier_name || 'Vendor')}</td>
                    <td>${store ? store.name : (g.warehouse_id || 'Main Store')}</td>
                    <td>
                      <div style="font-size: 11.5px; font-weight: 600;">${g.challan_no || '—'}</div>
                      ${g.invoice_no ? `<div style="font-size: 10px; color: var(--text-muted);">Inv: ${g.invoice_no}</div>` : ''}
                    </td>
                    <td>${window.formatDate(g.received_date || g.created_at)}</td>
                    <td>
                      ${isPending ? `
                        <span class="badge badge-warning" style="font-size: 10px; padding: 3px 8px; font-weight: 600;">
                          ⏳ Pending Approval
                        </span>
                      ` : isApproved ? `
                        <span class="badge badge-success" style="font-size: 10px; padding: 3px 8px; font-weight: 600;">
                          ✓ Approved / In Stock
                        </span>
                      ` : isRejected ? `
                        <span class="badge badge-danger" style="font-size: 10px; padding: 3px 8px; font-weight: 600;">
                          ✕ Rejected
                        </span>
                      ` : `
                        <span class="status-pill status-approved">${g.inspection_status || g.status}</span>
                      `}
                    </td>
                    <td class="text-right">
                      <div style="display:inline-flex; gap:6px; justify-content: flex-end; align-items:center;">
                        <button class="btn btn-secondary btn-sm" onclick="window.GoodsReceiptModule.viewGRN('${g.id}')">
                          View
                        </button>
                        ${isPending ? `
                          <button class="btn btn-primary btn-sm" title="Authorize GRN & Add Stock to Store" onclick="window.GoodsReceiptModule.approveGRN('${g.id}')" style="font-weight: 600;">
                            Approve GRN
                          </button>
                          <button class="btn btn-outline btn-sm" title="Edit this GRN" onclick="window.GoodsReceiptModule.editGRN('${g.id}')" style="color: var(--color-info, #0ea5e9);">
                            ✎ Edit
                          </button>
                          <button class="btn btn-outline btn-sm" title="Delete this GRN" onclick="window.GoodsReceiptModule.deleteGRN('${g.id}')" style="color: var(--color-danger);">
                            🗑 Delete
                          </button>
                        ` : ''}
                        <button class="btn btn-outline btn-sm" onclick="window.GoodsReceiptModule.printGRN('${g.id}')">
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
          key: 'goods-receipt',
          pagination: paged,
          onPageChange: 'window.GoodsReceiptModule.setPage',
          onPageSizeChange: 'window.GoodsReceiptModule.setPageSize'
        }) : ''}
      </div>
    `;
  },

  onSearchInput(val) {
    this.search = val;
  },

  onTypeFilterChange(val) {
    this.typeFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('goods-receipt');
    this.render();
  },

  onStatusFilterChange(val) {
    this.statusFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('goods-receipt');
    this.render();
  },

  setPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('goods-receipt', page);
    this.render();
  },

  setPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('goods-receipt', size);
    this.render();
  },

  filterTable() {
    this.search = document.getElementById('grn-search')?.value || '';
    this.typeFilter = document.getElementById('grn-type-filter')?.value || 'ALL';
    this.statusFilter = document.getElementById('grn-status-filter')?.value || 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('goods-receipt');
    this.render();
  },

  createGRNFromPO(poId) {
    const po = window.DB.getById('purchaseOrders', poId);
    if (!po || !window.DB.isPlantActive(po.plant_id)) {
      window.State.showToast('Cannot receive material: Associated branch or organization is inactive.', 'error');
      return;
    }
    this.showInwardModal(po, 'WITH_PO');
  },

  showInwardModal(preselectedPO = null, activeTab = 'WITH_PO') {
    this.currentInwardTab = (activeTab === 'WITHOUT_PO' || activeTab === 'DIRECT') ? 'DIRECT' : 'WITH_PO';
    this.activePOId = preselectedPO ? preselectedPO.id : null;

    if (!this.directGRNItems || this.directGRNItems.length === 0) {
      this.directGRNItems = [{
        id: Date.now(),
        item_id: '',
        item_code: '',
        item_name: '',
        category: '',
        uom: 'NOS',
        received_qty: 1,
        unit_cost: 0,
        batch_number: `LOT-DIR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        mfg_date: new Date().toISOString().split('T')[0],
        expiry_date: ''
      }];
    }

    const contentHtml = `
      <div id="grn-modal-container" style="display: flex; flex-direction: column; height: 100%;">
        <div id="grn-modal-tab-body" style="flex: 1; overflow-y: auto; padding: 2px 2px;">
          ${this.renderInwardTabContent()}
        </div>
      </div>
    `;

    this.poGRNExtraItems = [];
    this.initItemSearchDismiss();

    window.State.showModal({
      title: 'Create GRN',
      maxWidth: '96vw',
      isFullScreen: true,
      noScroll: true,
      bodyPadding: '14px 20px',
      contentHtml,
      footerHtml: null
    });
  },

  switchInwardMode(mode) {
    this.currentInwardTab = (mode === 'WITHOUT_PO' || mode === 'DIRECT') ? 'DIRECT' : 'WITH_PO';
    const body = document.getElementById('grn-modal-tab-body');
    if (body) {
      body.innerHTML = this.renderInwardTabContent();
    }
  },

  switchInwardTab(tab) {
    this.switchInwardMode(tab);
  },

  renderInwardTabContent() {
    if (this.currentInwardTab === 'DIRECT') {
      return this.renderDirectGRNSection();
    }
    return this.renderWithPOSection();
  },

  // --------------------------------------------------------------------------
  // Tab 1: With Purchase Order (With PO)
  // --------------------------------------------------------------------------
  renderWithPOSection() {
    const plantId = window.State.currentPlantId;
    const allPOs = (window.DB.getAll('purchaseOrders') || []).filter(p => {
      if (!window.DB.isPlantActive(p.plant_id)) return false;
      return (plantId === 'ALL' || p.plant_id === plantId) && (p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED');
    });

    if (allPOs.length === 0) {
      return `
        <!-- Header Grid with GRN Type Dropdown -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: var(--bg-surface-elevated, #f8fafc); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11.5px; font-weight: 600; margin-bottom: 4px;">GRN Type <span class="required" style="color:var(--color-danger);">*</span></label>
            <select id="grn-mode-select" class="form-control" style="height: 35px; font-size: 12px; font-weight: 600; background: var(--bg-surface, #ffffff);" onchange="window.GoodsReceiptModule.switchInwardMode(this.value)">
              <option value="WITH_PO" selected>With PO</option>
              <option value="WITHOUT_PO">Without PO</option>
            </select>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 20px; text-align: center; color: var(--text-muted); background: var(--bg-surface, #ffffff); border: 1px dashed var(--border-color); border-radius: 8px;">
          <div style="font-weight: 700; font-size: 15px; color: var(--text-primary); margin-bottom: 6px;">No Open Purchase Orders Found</div>
          <div style="font-size: 12.5px; max-width: 480px; line-height: 1.5; margin-bottom: 16px;">
            There are currently no approved purchase orders awaiting receipt. You can select <strong>Without PO</strong> in the dropdown above to inward goods directly without a PO, or approve a pending PO in the Purchase Orders register.
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.GoodsReceiptModule.switchInwardMode('WITHOUT_PO')">
            Switch to Without PO Inward →
          </button>
        </div>
      `;
    }

    const activePO = allPOs.find(p => p.id === this.activePOId) || allPOs[0];
    const supplier = window.DB.getById('suppliers', activePO.supplier_id);
    const targetPlantId = activePO.plant_id || (plantId === 'ALL' ? undefined : plantId);
    const warehouses = window.DB.getActiveWarehouses(targetPlantId);

    return `
      <form id="create-po-grn-form" style="display: flex; flex-direction: column; flex: 1; min-height: 100%;" onsubmit="window.GoodsReceiptModule.submitWithPOGRN(event)">
        
        <!-- Header Grid: Row 1 (PO/Supplier), Row 2 (Store, Challan, Invoice, Date moved left + Item Search) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1.6fr; gap: 6px 12px; background: var(--bg-surface-elevated, #f8fafc); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px; margin-bottom: 10px;">
          
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">GRN Type <span class="required" style="color:var(--color-danger);">*</span></label>
            <select id="grn-mode-select" class="form-control" style="height: 30px; font-size: 11.5px; font-weight: 600; background: var(--bg-surface, #ffffff);" onchange="window.GoodsReceiptModule.switchInwardMode(this.value)">
              <option value="WITH_PO" selected>With PO</option>
              <option value="WITHOUT_PO">Without PO</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0; grid-column: span 2;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Select Open Purchase Order <span class="required" style="color:var(--color-danger);">*</span></label>
            <select id="grn-po-select" class="form-control" style="height: 30px; font-size: 11.5px;" onchange="window.GoodsReceiptModule.onPOSelect(this)" required>
              ${allPOs.map(p => {
                const s = window.DB.getById('suppliers', p.supplier_id);
                return `<option value="${p.id}" ${activePO && activePO.id === p.id ? 'selected' : ''}>${p.po_number} - ${s?.name || 'Vendor'}</option>`;
              }).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0; grid-column: span 2;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Supplier / Vendor</label>
            <input type="text" class="form-control" value="${supplier ? supplier.name : 'Supplier'}" disabled style="height: 30px; font-size: 11.5px; background: var(--bg-surface, #ffffff);" />
          </div>

          <!-- Row 2: Store, Challan, Invoice, Date compacted to left as per arrows, followed by Item Search -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Store Name <span class="required" style="color:var(--color-danger);">*</span></label>
            <select id="grn-po-wh-select" class="form-control" style="height: 30px; font-size: 11.5px;" onchange="window.GoodsReceiptModule.onStoreChange()" required>
              ${warehouses.map(w => `<option value="${w.id}">${w.name} (${w.warehouse_type || w.store_type || 'Store'})</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Delivery Challan # <span class="required" style="color:var(--color-danger);">*</span></label>
            <input type="text" id="grn-po-challan" class="form-control" placeholder="e.g. DC-TATA-9942" style="height: 30px; font-size: 11.5px;" required />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Invoice No.</label>
            <input type="text" id="grn-po-invoice" class="form-control" placeholder="e.g. INV-88192" style="height: 30px; font-size: 11.5px;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Invoice Date <span class="required" style="color:var(--color-danger);">*</span></label>
            <input type="date" id="grn-po-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="height: 30px; font-size: 11.5px;" required />
          </div>

          <!-- Item Search component with Code, Name & Current Stock -->
          <div class="form-group" id="grn-item-search-container" style="margin-bottom: 0; position: relative;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Search & Add Item</label>
            <div style="position: relative; display: flex; align-items: center;">
              <input type="text" id="grn-item-search-input" class="form-control" placeholder="-- Select Item --" autocomplete="off" style="height: 30px; font-size: 11.5px; padding-right: 44px; background: var(--bg-surface, #ffffff); cursor: pointer;" oninput="window.GoodsReceiptModule.onItemSearchInput(this.value)" onfocus="window.GoodsReceiptModule.openItemDropdown()" onclick="window.GoodsReceiptModule.openItemDropdown()" />
              <span id="grn-item-search-clear" style="position: absolute; right: 24px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-muted); display: none; font-size: 11px; font-weight: 700; padding: 2px 4px;" onclick="window.GoodsReceiptModule.clearItemSearch()">✕</span>
              <span id="grn-item-search-arrow" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: auto; cursor: pointer; color: var(--text-muted); font-size: 10px;" onclick="window.GoodsReceiptModule.toggleItemDropdown()">▼</span>
            </div>
            <div id="grn-item-search-results" style="display: none; position: absolute; top: calc(100% + 2px); right: 0; min-width: 440px; max-width: 520px; width: 100%; max-height: 280px; overflow-y: auto; background: var(--bg-surface, #ffffff); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); z-index: 1050;"></div>
          </div>

        </div>

        <!-- Items Inward Table -->
        <div style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface, #ffffff); overflow: hidden; margin-bottom: 12px; flex: 1; display: flex; flex-direction: column; min-height: 180px;">
          <div class="table-responsive" style="flex: 1; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 45px;">Sr. No.</th>
                  <th style="min-width: 170px;">Item Code & Description</th>
                  <th class="text-right" style="width: 80px;">Ordered Qty</th>
                  <th class="text-right" style="width: 80px;">Remaining Qty</th>
                  <th style="width: 85px;">Received Qty *</th>
                  <th style="width: 95px;">Unit Price (₹)</th>
                  <th style="width: 95px;" class="text-right">Gross Amount (₹)</th>
                  <th style="width: 90px;">Discount Amount (₹)</th>
                  <th style="width: 95px;" class="text-right">Taxable Amount (₹)</th>
                  <th style="width: 90px;">Tax Amount (₹)</th>
                  <th style="width: 95px;" class="text-right">Net Amount (₹)</th>
                  <th style="width: 28px; text-align: center;" title="Expand to fill Batch / Mfg / Expiry">📋</th>
                  <th style="width: 35px; text-align: center;"></th>
                </tr>
              </thead>
              <tbody id="grn-po-items-tbody">
                ${this.renderWithPOItemsRows(activePO)}
              </tbody>
              <tfoot>
                <tr style="background: var(--bg-surface-elevated, #f8fafc); font-weight: 700;">
                  <td colspan="4" style="text-align: right; color: var(--text-muted);">Totals:</td>
                  <td id="grn-po-total-qty" class="cell-num" style="text-align: right;">0</td>
                  <td></td>
                  <td id="grn-po-total-gross" class="text-right cell-num">₹0.00</td>
                  <td id="grn-po-total-discount" class="text-right cell-num">₹0.00</td>
                  <td id="grn-po-total-taxable" class="text-right cell-num">₹0.00</td>
                  <td id="grn-po-total-tax" class="text-right cell-num">₹0.00</td>
                  <td id="grn-po-total-net" class="text-right cell-num" style="color: var(--primary-300);">₹0.00</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Footer Actions with Remarks moved lowerside alongside buttons -->
        <div style="margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 10px; flex-shrink: 0; display: flex; justify-content: space-between; align-items: flex-end; gap: 20px;">
          <div style="flex: 1; max-width: 700px;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Remarks / Inward Notes</label>
            <input type="text" id="grn-po-remarks" class="form-control" placeholder="e.g. Received in good condition" style="height: 30px; font-size: 11.5px;" />
          </div>

          <div style="display: flex; gap: 8px; flex-shrink: 0;">
            <button type="button" class="btn btn-outline" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="font-weight: 700; padding: 6px 20px;">
              Save GRN
            </button>
          </div>
        </div>

      </form>
    `;
  },

  onPOSelect(selectEl) {
    this.activePOId = selectEl.value;
    this.poGRNExtraItems = [];
    const body = document.getElementById('grn-modal-tab-body');
    if (body) {
      body.innerHTML = this.renderInwardTabContent();
    }
    setTimeout(() => this.calcWithPOGRNTotals(), 0);
  },

  renderWithPOItemsRows(activePO) {
    if (!activePO) return '';
    const items = activePO.items || [];
    let rowsHtml = '';
    let rowIdx = 1;

    setTimeout(() => this.calcWithPOGRNTotals(), 0);

    // 1. PO defined items
    items.forEach((it) => {
      const pendingQty = Number(it.pending_quantity !== undefined ? it.pending_quantity : (it.ordered_quantity - (it.received_quantity || 0))) || 0;
      const defaultRecv = Math.max(0, pendingQty);
      const batchNo = `LOT-${(it.item_code || 'GEN').replace(/[^a-zA-Z0-9]/g, '')}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const mfgDate = new Date().toISOString().split('T')[0];
      const uom = it.uom || it.base_uom || 'NOS';
      const rate = Number(it.unit_price !== undefined ? it.unit_price : (it.unit_cost || 0)) || 0;
      const disc = Number(it.discount_amount || 0);
      const taxRate = Number(it.tax_rate !== undefined ? it.tax_rate : (it.gst_rate !== undefined ? it.gst_rate : 18));
      const gross = defaultRecv * rate;
      const taxable = Math.max(0, gross - disc);
      const tax = Number(it.tax_amount !== undefined ? it.tax_amount : Math.round((taxable * taxRate / 100) * 100) / 100);
      const net = Math.round((taxable + tax) * 100) / 100;

      const poRowId = `po-row-${it.item_id}-${rowIdx}`;
      rowsHtml += `
        <tr class="grn-po-line-row" data-item-id="${it.item_id}" data-item-code="${it.item_code || it.item_id}" data-item-name="${it.item_name || 'Material Item'}" data-uom="${uom}" data-rate="${rate}" data-tax-rate="${taxRate}" data-expand-id="${poRowId}" style="cursor: pointer;" onclick="window.GoodsReceiptModule.toggleGRNBatchRow('${poRowId}', event)">
          <td style="width: 40px;">${rowIdx++}</td>
          <td>
            <div style="font-weight: 600; color: var(--primary-300); font-family: monospace;">${it.item_code || it.item_id}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${it.item_name || 'Material Item'}</div>
          </td>
          <td class="text-right cell-num" style="font-weight: 600;">${it.ordered_quantity || 0} ${uom}</td>
          <td class="text-right cell-num" style="color: ${pendingQty > 0 ? 'var(--color-primary, #2563eb)' : 'var(--text-muted)'}; font-weight: 600;">
            ${pendingQty} ${uom}
          </td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm grn-po-recv-qty" value="${defaultRecv}" min="0" max="${pendingQty > 0 ? pendingQty : ''}" step="1" required style="height: 30px; font-weight: 700; text-align: right;" oninput="window.GoodsReceiptModule.onWithPOFinancialChange(this)" />
          </td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm grn-po-price" value="${rate}" min="0" step="any" required style="height: 30px; text-align: right;" oninput="window.GoodsReceiptModule.onWithPOFinancialChange(this)" />
          </td>
          <td class="text-right cell-num grn-po-gross" style="font-weight: 600;">₹${gross.toFixed(2)}</td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm grn-po-discount" value="${disc}" min="0" step="any" style="height: 30px; text-align: right;" oninput="window.GoodsReceiptModule.onWithPOFinancialChange(this)" />
          </td>
          <td class="text-right cell-num grn-po-taxable" style="font-weight: 600;">₹${taxable.toFixed(2)}</td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm grn-po-tax" value="${tax.toFixed(2)}" min="0" step="any" style="height: 30px; text-align: right;" oninput="window.GoodsReceiptModule.onWithPOFinancialChange(this, true)" />
          </td>
          <td class="text-right cell-num grn-po-net" style="font-weight: 700; color: var(--primary-color, #2563eb);">₹${net.toFixed(2)}</td>
          <td style="width: 28px; text-align: center;">
            <span class="grn-expand-arrow" data-expand-id="${poRowId}" style="font-size: 11px; color: var(--text-muted); cursor: pointer; user-select: none;">▶</span>
          </td>
          <td style="width: 35px; text-align: center;"></td>
        </tr>
        <tr id="${poRowId}" class="grn-batch-subrow" style="display: none; background: var(--bg-surface-elevated, #f0f4ff);">
          <td colspan="13" style="padding: 8px 14px;">
            <div style="display: flex; align-items: center; gap: 18px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap; min-width: 90px;">Batch / Lot # <span style="color:var(--color-danger);">*</span></label>
                <input type="text" class="form-control form-control-sm grn-po-batch" value="${batchNo}" required style="height: 28px; font-family: monospace; font-size: 11.5px; width: 170px;" />
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap;">Mfg. Date</label>
                <input type="date" class="form-control form-control-sm grn-po-mfg" value="${mfgDate}" style="height: 28px; font-size: 11px; width: 140px;" />
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap;">Expiry Date</label>
                <input type="date" class="form-control form-control-sm grn-po-exp" style="height: 28px; font-size: 11px; width: 140px;" />
              </div>
            </div>
          </td>
        </tr>
      `;
    });

    // 2. Extra ad-hoc items added via search in With PO mode
    (this.poGRNExtraItems || []).forEach((it) => {
      const uom = it.uom || 'NOS';
      const batchNo = it.batch_number || `LOT-${(it.item_code || 'GEN').replace(/[^a-zA-Z0-9]/g, '')}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const mfgDate = it.mfg_date || new Date().toISOString().split('T')[0];
      const rate = Number(it.unit_price !== undefined ? it.unit_price : (it.unit_cost || 0)) || 0;
      const recvQty = Number(it.received_qty) || 1;
      const disc = Number(it.discount_amount || 0);
      const taxRate = Number(it.tax_rate !== undefined ? it.tax_rate : (it.gst_rate !== undefined ? it.gst_rate : 18));
      const gross = recvQty * rate;
      const taxable = Math.max(0, gross - disc);
      const tax = Number(it.tax_amount !== undefined ? it.tax_amount : Math.round((taxable * taxRate / 100) * 100) / 100);
      const net = Math.round((taxable + tax) * 100) / 100;

      const extraRowId = `po-extra-${it.id}`;
      rowsHtml += `
        <tr class="grn-po-line-row" data-extra-id="${it.id}" data-item-id="${it.item_id}" data-item-code="${it.item_code}" data-item-name="${it.item_name}" data-uom="${uom}" data-rate="${rate}" data-tax-rate="${taxRate}" data-expand-id="${extraRowId}" style="background: rgba(37, 99, 235, 0.03); cursor: pointer;" onclick="window.GoodsReceiptModule.toggleGRNBatchRow('${extraRowId}', event)">
          <td style="width: 40px;">${rowIdx++}</td>
          <td>
            <div style="font-weight: 600; color: var(--primary-300); font-family: monospace;">${it.item_code}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${it.item_name}</div>
            <span class="badge badge-subtle" style="font-size: 9.5px; padding: 1px 5px; margin-top: 2px;">+ Added Item</span>
          </td>
          <td class="text-right cell-num" style="color: var(--text-muted);">—</td>
          <td class="text-right cell-num" style="color: var(--text-muted);">—</td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm grn-po-recv-qty" value="${recvQty}" min="1" step="1" required style="height: 30px; font-weight: 700; text-align: right;" oninput="window.GoodsReceiptModule.onWithPOFinancialChange(this)" />
          </td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm grn-po-price" value="${rate}" min="0" step="any" required style="height: 30px; text-align: right;" oninput="window.GoodsReceiptModule.onWithPOFinancialChange(this)" />
          </td>
          <td class="text-right cell-num grn-po-gross" style="font-weight: 600;">₹${gross.toFixed(2)}</td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm grn-po-discount" value="${disc}" min="0" step="any" style="height: 30px; text-align: right;" oninput="window.GoodsReceiptModule.onWithPOFinancialChange(this)" />
          </td>
          <td class="text-right cell-num grn-po-taxable" style="font-weight: 600;">₹${taxable.toFixed(2)}</td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm grn-po-tax" value="${tax.toFixed(2)}" min="0" step="any" style="height: 30px; text-align: right;" oninput="window.GoodsReceiptModule.onWithPOFinancialChange(this, true)" />
          </td>
          <td class="text-right cell-num grn-po-net" style="font-weight: 700; color: var(--primary-color, #2563eb);">₹${net.toFixed(2)}</td>
          <td style="width: 28px; text-align: center;">
            <span class="grn-expand-arrow" data-expand-id="${extraRowId}" style="font-size: 11px; color: var(--text-muted); cursor: pointer; user-select: none;">▶</span>
          </td>
          <td style="width: 35px; text-align: center;" onclick="event.stopPropagation()">
            <button type="button" class="btn btn-icon btn-sm" style="color: var(--color-danger); padding: 2px 6px;" title="Remove Added Item" onclick="window.GoodsReceiptModule.removePOExtraItem('${it.id}')">
              ✕
            </button>
          </td>
        </tr>
        <tr id="${extraRowId}" class="grn-batch-subrow" style="display: none; background: rgba(37, 99, 235, 0.06);">
          <td colspan="13" style="padding: 8px 14px;">
            <div style="display: flex; align-items: center; gap: 18px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap; min-width: 90px;">Batch / Lot # <span style="color:var(--color-danger);">*</span></label>
                <input type="text" class="form-control form-control-sm grn-po-batch" value="${batchNo}" required style="height: 28px; font-family: monospace; font-size: 11.5px; width: 170px;" oninput="window.GoodsReceiptModule.onPOExtraFieldChange('${it.id}', 'batch_number', this.value)" />
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap;">Mfg. Date</label>
                <input type="date" class="form-control form-control-sm grn-po-mfg" value="${mfgDate}" style="height: 28px; font-size: 11px; width: 140px;" oninput="window.GoodsReceiptModule.onPOExtraFieldChange('${it.id}', 'mfg_date', this.value)" />
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap;">Expiry Date</label>
                <input type="date" class="form-control form-control-sm grn-po-exp" value="${it.expiry_date || ''}" style="height: 28px; font-size: 11px; width: 140px;" oninput="window.GoodsReceiptModule.onPOExtraFieldChange('${it.id}', 'expiry_date', this.value)" />
              </div>
            </div>
          </td>
        </tr>
      `;
    });

    if (!rowsHtml) {
      return `<tr><td colspan="13" style="text-align: center; color: var(--text-muted); padding: 24px;">No items found. Search and add items using the search bar above.</td></tr>`;
    }

    return rowsHtml;
  },

  getItemStock(itemId, storeId) {
    if (!itemId) return 0;
    const item = (window.DB && typeof window.DB.getById === 'function') ? window.DB.getById('items', itemId) : null;
    const allBalances = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('inventoryBalances') || []) : [];

    let totalStock = 0;
    allBalances.forEach(b => {
      const matchItem = (b.item_id === itemId || (item && item.code && b.item_code === item.code));
      if (!matchItem) return;
      if (storeId) {
        if (b.warehouse_id === storeId || b.store_id === storeId) {
          totalStock += (Number(b.available) || Number(b.on_hand) || Number(b.quantity) || 0);
        }
      } else {
        totalStock += (Number(b.available) || Number(b.on_hand) || Number(b.quantity) || 0);
      }
    });
    return totalStock;
  },

  onStoreChange() {
    const input = document.getElementById('grn-item-search-input');
    if (input && input.value.trim().length > 0) {
      this.onItemSearchInput(input.value);
    }
  },

  initItemSearchDismiss() {
    if (this._itemSearchDismissBound) return;
    this._itemSearchDismissBound = true;
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('click', (e) => {
        const container = document.getElementById('grn-item-search-container');
        if (container && e.target && !container.contains(e.target)) {
          const res = document.getElementById('grn-item-search-results');
          if (res) res.style.display = 'none';
        }

        const openRowDropdowns = document.querySelectorAll('.direct-item-row-results');
        openRowDropdowns.forEach(dropdown => {
          if (dropdown.style.display !== 'none' && !dropdown.parentElement.contains(e.target)) {
            dropdown.style.display = 'none';
          }
        });
      });
    }
  },

  clearItemSearch() {
    const input = document.getElementById('grn-item-search-input');
    if (input) input.value = '';
    const clearBtn = document.getElementById('grn-item-search-clear');
    if (clearBtn) clearBtn.style.display = 'none';
    const res = document.getElementById('grn-item-search-results');
    if (res) res.style.display = 'none';
  },

  openItemDropdown() {
    const input = document.getElementById('grn-item-search-input');
    this.onItemSearchInput(input ? input.value : '');
  },

  toggleItemDropdown() {
    const resultsEl = document.getElementById('grn-item-search-results');
    if (resultsEl && resultsEl.style.display === 'block') {
      resultsEl.style.display = 'none';
    } else {
      const input = document.getElementById('grn-item-search-input');
      if (input) input.focus();
      this.openItemDropdown();
    }
  },

  onItemSearchInput(query) {
    const q = (query || '').trim().toLowerCase();
    const clearBtn = document.getElementById('grn-item-search-clear');
    if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

    const resultsEl = document.getElementById('grn-item-search-results');
    if (!resultsEl) return;

    const storeId = (this.currentInwardTab === 'DIRECT') 
      ? document.getElementById('grn-dir-wh-select')?.value 
      : document.getElementById('grn-po-wh-select')?.value;

    const allItems = (window.DB.getAll('items') || []).filter(i => {
      const s = (i.status || '').toLowerCase();
      return !s || s === 'active';
    });

    let matches = allItems;
    if (q) {
      matches = allItems.filter(i => {
        const code = (i.code || '').toLowerCase();
        const name = (i.name || '').toLowerCase();
        const cat = (i.category_name || i.category || '').toLowerCase();
        return code.includes(q) || name.includes(q) || cat.includes(q);
      });
    }

    resultsEl.innerHTML = this.renderItemSearchResultsHtml(matches.slice(0, 50), q, storeId);
    resultsEl.style.display = 'block';
  },

  renderItemSearchResultsHtml(matches, q, storeId) {
    let html = `
      <div 
        style="padding: 7px 10px; font-size: 11.5px; color: var(--text-muted); border-bottom: 1px solid var(--border-color); cursor: pointer; background: var(--bg-surface-elevated, #f8fafc);"
        onclick="window.GoodsReceiptModule.clearItemSearch()"
      >
        -- Select Item --
      </div>
    `;

    if (matches.length === 0) {
      html += `
        <div style="padding: 10px 12px; font-size: 11.5px; color: var(--text-muted); text-align: center;">
          No matching items found for "<strong>${q}</strong>"
        </div>
      `;
      return html;
    }

    html += matches.map(it => {
      const stock = this.getItemStock(it.id, storeId);
      const uom = it.base_uom || it.unit_of_measure || 'NOS';
      const stockBadge = stock > 0 
        ? `<span style="color: #16a34a; font-weight: 600; font-size: 11px; margin-left: auto; padding-left: 10px; flex-shrink: 0;">Stock: ${stock.toLocaleString('en-IN')} ${uom}</span>`
        : `<span style="color: var(--text-muted); font-size: 11px; margin-left: auto; padding-left: 10px; flex-shrink: 0;">Stock: 0 ${uom}</span>`;

      return `
        <div 
          class="grn-search-item-option"
          style="padding: 6px 10px; font-size: 11.5px; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.04); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: background 0.1s ease;"
          onmouseover="this.style.background='var(--primary-light, #e0e7ff)'; this.style.color='var(--primary-color, #1d4ed8)';"
          onmouseout="this.style.background='transparent'; this.style.color='var(--text-primary)';"
          onclick="window.GoodsReceiptModule.onSelectItemFromSearch('${it.id}')"
          title="${it.code} - ${it.name} (${stock} ${uom})"
        >
          <span style="font-family: monospace; font-weight: 600;">${it.code}</span>
          <span style="margin: 0 4px; color: var(--text-muted);">-</span>
          <span style="overflow: hidden; text-overflow: ellipsis;">${it.name}</span>
          ${stockBadge}
        </div>
      `;
    }).join('');

    return html;
  },

  onSelectItemFromSearch(itemId) {
    const item = window.DB.getById('items', itemId);
    if (!item) return;

    if (this.currentInwardTab === 'WITH_PO') {
      const existingRow = document.querySelector(`.grn-po-line-row[data-item-id="${itemId}"]`);
      if (existingRow) {
        const qtyInput = existingRow.querySelector('.grn-po-recv-qty');
        if (qtyInput) {
          qtyInput.focus();
          if (typeof qtyInput.select === 'function') qtyInput.select();
        }
        existingRow.style.backgroundColor = 'rgba(37, 99, 235, 0.15)';
        setTimeout(() => { existingRow.style.backgroundColor = ''; }, 1500);
        window.State.showToast(`Item ${item.code} is already in the list. Focused on Received Qty.`, 'info');
      } else {
        const unitPrice = Number(item.purchase_price) || Number(item.standard_cost) || 0;
        const taxRate = Number(item.tax_rate !== undefined ? item.tax_rate : (item.gst_rate !== undefined ? item.gst_rate : 18));
        const gross = 1 * unitPrice;
        const taxable = gross;
        const tax = Math.round((taxable * taxRate / 100) * 100) / 100;
        const net = Math.round((taxable + tax) * 100) / 100;

        this.poGRNExtraItems = this.poGRNExtraItems || [];
        this.poGRNExtraItems.push({
          id: 'EXTRA-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          item_id: item.id,
          item_code: item.code,
          item_name: item.name,
          uom: item.base_uom || item.unit_of_measure || 'NOS',
          unit_price: unitPrice,
          unit_cost: unitPrice,
          tax_rate: taxRate,
          received_qty: 1,
          gross_amount: gross,
          discount_amount: 0,
          taxable_amount: taxable,
          tax_amount: tax,
          net_amount: net,
          batch_number: `LOT-${(item.code || 'GEN').replace(/[^a-zA-Z0-9]/g, '')}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          mfg_date: new Date().toISOString().split('T')[0],
          expiry_date: (item.has_expiry && item.shelf_life_days) ? new Date(Date.now() + item.shelf_life_days * 86400000).toISOString().split('T')[0] : ''
        });

        const tbody = document.getElementById('grn-po-items-tbody');
        if (tbody) {
          const allPOs = (window.DB.getAll('purchaseOrders') || []);
          const activePO = allPOs.find(p => p.id === this.activePOId) || allPOs[0];
          tbody.innerHTML = this.renderWithPOItemsRows(activePO);
          this.calcWithPOGRNTotals();
        }
        window.State.showToast(`Item ${item.code} - ${item.name} added to GRN items.`, 'success');
      }
    } else {
      this.directGRNItems = this.directGRNItems || [];
      const emptyRow = this.directGRNItems.find(r => !r.item_id);
      if (emptyRow) {
        this.onDirectItemChange(emptyRow.id, item.id);
      } else {
        const existingDirect = this.directGRNItems.find(r => r.item_id === item.id);
        if (existingDirect) {
          existingDirect.received_qty = (Number(existingDirect.received_qty) || 0) + 1;
          const tr = document.querySelector(`.direct-grn-row[data-row-id="${existingDirect.id}"]`);
          if (tr) {
            const qInput = tr.querySelector('.direct-row-qty');
            if (qInput) qInput.value = existingDirect.received_qty;
            this.onDirectFinancialChange(existingDirect.id, 'received_qty', existingDirect.received_qty);
          } else {
            this.calcDirectGRNTotals();
          }
          window.State.showToast(`Item ${item.code} quantity incremented to ${existingDirect.received_qty}.`, 'info');
        } else {
          const unitPrice = Number(item.purchase_price) || Number(item.standard_cost) || 100;
          const taxRate = Number(item.tax_rate !== undefined ? item.tax_rate : (item.gst_rate !== undefined ? item.gst_rate : 18));
          const gross = 1 * unitPrice;
          const taxable = gross;
          const tax = Math.round((taxable * taxRate / 100) * 100) / 100;
          const net = Math.round((taxable + tax) * 100) / 100;

          this.directGRNItems.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            item_id: item.id,
            item_code: item.code,
            item_name: item.name,
            category: item.category_name || item.category || 'General',
            uom: item.base_uom || item.unit_of_measure || 'NOS',
            received_qty: 1,
            unit_price: unitPrice,
            unit_cost: unitPrice,
            tax_rate: taxRate,
            gross_amount: gross,
            discount_amount: 0,
            taxable_amount: taxable,
            tax_amount: tax,
            net_amount: net,
            batch_number: `LOT-${(item.code || 'GEN').replace(/[^a-zA-Z0-9]/g, '')}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
            mfg_date: new Date().toISOString().split('T')[0],
            expiry_date: (item.has_expiry && item.shelf_life_days) ? new Date(Date.now() + item.shelf_life_days * 86400000).toISOString().split('T')[0] : ''
          });
          const tbody = document.getElementById('direct-grn-items-tbody');
          if (tbody) {
            tbody.innerHTML = this.renderDirectGRNTableRows();
            this.calcDirectGRNTotals();
          }
          window.State.showToast(`Item ${item.code} - ${item.name} added to Direct GRN.`, 'success');
        }
      }
    }

    this.clearItemSearch();
  },

  removePOExtraItem(extraId) {
    this.poGRNExtraItems = (this.poGRNExtraItems || []).filter(it => it.id !== extraId);
    const tbody = document.getElementById('grn-po-items-tbody');
    if (tbody) {
      const allPOs = (window.DB.getAll('purchaseOrders') || []);
      const activePO = allPOs.find(p => p.id === this.activePOId) || allPOs[0];
      tbody.innerHTML = this.renderWithPOItemsRows(activePO);
      this.calcWithPOGRNTotals();
    }
  },

  onPOExtraQtyChange(extraId, val) {
    const item = (this.poGRNExtraItems || []).find(it => it.id === extraId);
    if (item) {
      item.received_qty = Number(val) || 0;
      this.calcWithPOGRNTotals();
    }
  },

  onPOExtraFieldChange(extraId, field, val) {
    const item = (this.poGRNExtraItems || []).find(it => it.id === extraId);
    if (item) {
      item[field] = val;
    }
  },

  onWithPOFinancialChange(inputEl, isTaxDirectEdit = false) {
    const tr = inputEl ? inputEl.closest('.grn-po-line-row') : null;
    if (!tr) return;

    const qty = Number(tr.querySelector('.grn-po-recv-qty')?.value) || 0;
    const price = Number(tr.querySelector('.grn-po-price')?.value) || 0;
    const discount = Number(tr.querySelector('.grn-po-discount')?.value) || 0;
    const taxRate = Number(tr.getAttribute('data-tax-rate')) || 18;

    const gross = qty * price;
    const taxable = Math.max(0, gross - discount);

    let tax = 0;
    const taxInput = tr.querySelector('.grn-po-tax');
    if (isTaxDirectEdit && taxInput) {
      tax = Number(taxInput.value) || 0;
    } else {
      tax = Math.round((taxable * taxRate / 100) * 100) / 100;
      if (taxInput) taxInput.value = tax.toFixed(2);
    }

    const net = Math.round((taxable + tax) * 100) / 100;

    const grossEl = tr.querySelector('.grn-po-gross');
    if (grossEl) grossEl.innerText = `₹${gross.toFixed(2)}`;

    const taxableEl = tr.querySelector('.grn-po-taxable');
    if (taxableEl) taxableEl.innerText = `₹${taxable.toFixed(2)}`;

    const netEl = tr.querySelector('.grn-po-net');
    if (netEl) netEl.innerText = `₹${net.toFixed(2)}`;

    // Sync extra item if applicable
    const extraId = tr.getAttribute('data-extra-id');
    if (extraId) {
      const extra = (this.poGRNExtraItems || []).find(it => it.id === extraId);
      if (extra) {
        extra.received_qty = qty;
        extra.unit_price = price;
        extra.unit_cost = price;
        extra.gross_amount = gross;
        extra.discount_amount = discount;
        extra.taxable_amount = taxable;
        extra.tax_amount = tax;
        extra.net_amount = net;
      }
    }

    this.calcWithPOGRNTotals();
  },

  calcWithPOGRNTotals() {
    let totalQty = 0;
    let totalGross = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalTax = 0;
    let totalNet = 0;

    const rows = document.querySelectorAll('.grn-po-line-row');
    rows.forEach(tr => {
      const qty = Number(tr.querySelector('.grn-po-recv-qty')?.value) || 0;
      const price = Number(tr.querySelector('.grn-po-price')?.value) || 0;
      const discount = Number(tr.querySelector('.grn-po-discount')?.value) || 0;
      const tax = Number(tr.querySelector('.grn-po-tax')?.value) || 0;

      const gross = qty * price;
      const taxable = Math.max(0, gross - discount);
      const net = Math.round((taxable + tax) * 100) / 100;

      totalQty += qty;
      totalGross += gross;
      totalDiscount += discount;
      totalTaxable += taxable;
      totalTax += tax;
      totalNet += net;
    });

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };

    setEl('grn-po-total-qty', totalQty);
    setEl('grn-po-total-gross', `₹${totalGross.toFixed(2)}`);
    setEl('grn-po-total-discount', `₹${totalDiscount.toFixed(2)}`);
    setEl('grn-po-total-taxable', `₹${totalTaxable.toFixed(2)}`);
    setEl('grn-po-total-tax', `₹${totalTax.toFixed(2)}`);
    setEl('grn-po-total-net', `₹${totalNet.toFixed(2)}`);
  },

  // --------------------------------------------------------------------------
  // Tab 2: Direct GRN (Inward Without PO)
  // --------------------------------------------------------------------------
  renderDirectGRNSection() {
    const allStores = (window.DB.getAll('warehouses') || []).filter(w => w.status !== 'Inactive');
    const allSuppliers = (window.DB.getAll('suppliers') || []).filter(s => s.status !== 'Inactive');

    return `
      <form id="create-direct-grn-form" style="display: flex; flex-direction: column; flex: 1; min-height: 100%;" onsubmit="window.GoodsReceiptModule.submitDirectGRN(event)">
        
        <!-- Header Grid: Row 1 (Supplier/Purpose), Row 2 (Store, Challan, Invoice, Date moved left + Item Search) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1.6fr; gap: 6px 12px; background: var(--bg-surface-elevated, #f8fafc); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px; margin-bottom: 10px;">
          
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">GRN Type <span class="required" style="color:var(--color-danger);">*</span></label>
            <select id="grn-mode-select" class="form-control" style="height: 30px; font-size: 11.5px; font-weight: 600; background: var(--bg-surface, #ffffff);" onchange="window.GoodsReceiptModule.switchInwardMode(this.value)">
              <option value="WITH_PO">With PO</option>
              <option value="WITHOUT_PO" selected>Without PO</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0; grid-column: span 2;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Supplier / Vendor <span class="required" style="color:var(--color-danger);">*</span></label>
            <select id="grn-dir-supplier-select" class="form-control" style="height: 30px; font-size: 11.5px;" required>
              <option value="DIR-SUP-LOCAL">Direct / Local Spot Purchase</option>
              ${allSuppliers.map(s => `<option value="${s.id}">${s.name} (${s.code || s.id})</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0; grid-column: span 2;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Inward Purpose</label>
            <select id="grn-dir-purpose" class="form-control" style="height: 30px; font-size: 11.5px;">
              <option value="DIRECT_PURCHASE">Direct Spot Purchase</option>
              <option value="SAMPLE_STOCK">Sample / Trial Stock</option>
              <option value="OPENING_BALANCE">Opening Stock Baseline</option>
              <option value="EMERGENCY_INWARD">Emergency Sourcing</option>
              <option value="OTHER">Other Ad-hoc Inward</option>
            </select>
          </div>

          <!-- Row 2: Store, Challan, Invoice, Date compacted to left as per arrows, followed by Item Search -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Store Name <span class="required" style="color:var(--color-danger);">*</span></label>
            <select id="grn-dir-wh-select" class="form-control" style="height: 30px; font-size: 11.5px;" onchange="window.GoodsReceiptModule.onStoreChange()" required>
              ${allStores.map(w => `<option value="${w.id}">${w.name} (${w.store_type || w.warehouse_type || 'Store'})</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Delivery Challan # <span class="required" style="color:var(--color-danger);">*</span></label>
            <input type="text" id="grn-dir-challan" class="form-control" placeholder="e.g. DC-DIR-9021" style="height: 30px; font-size: 11.5px;" required />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Invoice No.</label>
            <input type="text" id="grn-dir-invoice" class="form-control" placeholder="e.g. INV-44910" style="height: 30px; font-size: 11.5px;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Invoice Date <span class="required" style="color:var(--color-danger);">*</span></label>
            <input type="date" id="grn-dir-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="height: 30px; font-size: 11.5px;" required />
          </div>

          <!-- Item Search component with Code, Name & Current Stock -->
          <div class="form-group" id="grn-item-search-container" style="margin-bottom: 0; position: relative;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Search & Add Item</label>
            <div style="position: relative; display: flex; align-items: center;">
              <input type="text" id="grn-item-search-input" class="form-control" placeholder="-- Select Item --" autocomplete="off" style="height: 30px; font-size: 11.5px; padding-right: 44px; background: var(--bg-surface, #ffffff); cursor: pointer;" oninput="window.GoodsReceiptModule.onItemSearchInput(this.value)" onfocus="window.GoodsReceiptModule.openItemDropdown()" onclick="window.GoodsReceiptModule.openItemDropdown()" />
              <span id="grn-item-search-clear" style="position: absolute; right: 24px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-muted); display: none; font-size: 11px; font-weight: 700; padding: 2px 4px;" onclick="window.GoodsReceiptModule.clearItemSearch()">✕</span>
              <span id="grn-item-search-arrow" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: auto; cursor: pointer; color: var(--text-muted); font-size: 10px;" onclick="window.GoodsReceiptModule.toggleItemDropdown()">▼</span>
            </div>
            <div id="grn-item-search-results" style="display: none; position: absolute; top: calc(100% + 2px); right: 0; min-width: 440px; max-width: 520px; width: 100%; max-height: 280px; overflow-y: auto; background: var(--bg-surface, #ffffff); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); z-index: 1050;"></div>
          </div>

        </div>

        <!-- Items Table -->
        <div style="border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-surface, #ffffff); overflow: hidden; margin-bottom: 12px; flex: 1; display: flex; flex-direction: column; min-height: 180px;">
          <div style="padding: 6px 14px; background: var(--bg-surface-elevated, #f8fafc); border-bottom: 1px solid var(--border-color); display: flex; justify-content: flex-end; align-items: center; flex-shrink: 0;">
            <button type="button" class="btn btn-outline btn-xs" style="font-size: 11px; padding: 4px 10px;" onclick="window.GoodsReceiptModule.addDirectGRNRow()">
              + Add Item
            </button>
          </div>

          <div class="table-responsive" style="flex: 1; overflow-y: auto;">
            <table class="data-table" id="direct-grn-items-table">
              <thead>
                <tr>
                  <th style="width: 45px;">Sr. No.</th>
                  <th style="min-width: 190px;">Item (Code & Name) *</th>
                  <th>Category</th>
                  <th style="width: 60px;">UOM</th>
                  <th style="width: 85px;">Received Qty *</th>
                  <th style="width: 95px;">Unit Price (₹)</th>
                  <th style="width: 95px;" class="text-right">Gross Amount (₹)</th>
                  <th style="width: 90px;">Discount Amount (₹)</th>
                  <th style="width: 95px;" class="text-right">Taxable Amount (₹)</th>
                  <th style="width: 90px;">Tax Amount (₹)</th>
                  <th style="width: 95px;" class="text-right">Net Amount (₹)</th>
                  <th style="width: 28px; text-align: center;" title="Expand to fill Batch / Mfg / Expiry">📋</th>
                  <th style="width: 35px; text-align: center;"></th>
                </tr>
              </thead>
              <tbody id="direct-grn-items-tbody">
                ${this.renderDirectGRNTableRows()}
              </tbody>
              <tfoot>
                <tr style="background: var(--bg-surface-elevated, #f8fafc); font-weight: 700;">
                  <td colspan="4" style="text-align: right; color: var(--text-muted);">Totals:</td>
                  <td id="direct-grn-total-qty" class="cell-num" style="text-align: right;">0</td>
                  <td></td>
                  <td id="direct-grn-total-gross" class="text-right cell-num">₹0.00</td>
                  <td id="direct-grn-total-discount" class="text-right cell-num">₹0.00</td>
                  <td id="direct-grn-total-taxable" class="text-right cell-num">₹0.00</td>
                  <td id="direct-grn-total-tax" class="text-right cell-num">₹0.00</td>
                  <td id="direct-grn-total-net" class="text-right cell-num" style="color: var(--primary-300);">₹0.00</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Footer Actions with Remarks moved lowerside alongside buttons -->
        <div style="margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 10px; flex-shrink: 0; display: flex; justify-content: space-between; align-items: flex-end; gap: 20px;">
          <div style="flex: 1; max-width: 700px;">
            <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 2px;">Remarks / Notes</label>
            <input type="text" id="grn-dir-remarks" class="form-control" placeholder="e.g. Urgent floor replacement parts" style="height: 30px; font-size: 11.5px;" />
          </div>

          <div style="display: flex; gap: 8px; flex-shrink: 0;">
            <button type="button" class="btn btn-outline" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="font-weight: 700; padding: 6px 20px;">
              Save GRN
            </button>
          </div>
        </div>

      </form>
    `;
  },

  renderDirectGRNTableRows() {
    const allItems = (window.DB.getAll('items') || []).filter(i => {
      const s = (i.status || '').toLowerCase();
      return !s || s === 'active';
    });
    const storeId = document.getElementById('grn-dir-wh-select')?.value;

    if (!this.directGRNItems || this.directGRNItems.length === 0) {
      const firstItem = allItems[0];
      const price = firstItem ? (Number(firstItem.purchase_price) || Number(firstItem.standard_cost) || 100) : 100;
      const taxRate = Number(firstItem?.tax_rate !== undefined ? firstItem.tax_rate : (firstItem?.gst_rate !== undefined ? firstItem.gst_rate : 18));
      const gross = 1 * price;
      const taxable = gross;
      const tax = Math.round((taxable * taxRate / 100) * 100) / 100;
      const net = Math.round((taxable + tax) * 100) / 100;

      this.directGRNItems = [{
        id: Date.now(),
        item_id: firstItem?.id || '',
        item_code: firstItem?.code || '',
        item_name: firstItem?.name || '',
        category: firstItem?.category_name || 'General',
        uom: firstItem?.base_uom || 'NOS',
        received_qty: 1,
        unit_price: price,
        unit_cost: price,
        gross_amount: gross,
        discount_amount: 0,
        taxable_amount: taxable,
        tax_rate: taxRate,
        tax_amount: tax,
        net_amount: net,
        batch_number: `LOT-DIR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        mfg_date: new Date().toISOString().split('T')[0],
        expiry_date: ''
      }];
    }

    setTimeout(() => this.calcDirectGRNTotals(), 0);

    return this.directGRNItems.map((row, idx) => {
      const price = Number(row.unit_price !== undefined ? row.unit_price : (row.unit_cost !== undefined ? row.unit_cost : 100)) || 0;
      const qty = Number(row.received_qty) || 0;
      const disc = Number(row.discount_amount || 0);
      const taxRate = Number(row.tax_rate !== undefined ? row.tax_rate : 18);
      const gross = qty * price;
      const taxable = Math.max(0, gross - disc);
      const tax = Number(row.tax_amount !== undefined ? row.tax_amount : Math.round((taxable * taxRate / 100) * 100) / 100);
      const net = Math.round((taxable + tax) * 100) / 100;

      row.unit_price = price;
      row.unit_cost = price;
      row.gross_amount = gross;
      row.discount_amount = disc;
      row.taxable_amount = taxable;
      row.tax_rate = taxRate;
      row.tax_amount = tax;
      row.net_amount = net;

      const dirRowSubId = `dir-batch-${row.id}`;
      return `
        <tr class="direct-grn-row" data-row-id="${row.id}" data-expand-id="${dirRowSubId}" style="cursor: pointer;" onclick="window.GoodsReceiptModule.toggleGRNBatchRow('${dirRowSubId}', event)">
          <td>${idx + 1}</td>
          <td style="position: relative;" onclick="event.stopPropagation()">
            <div class="direct-item-search-wrap" style="position: relative;">
              <input 
                type="text" 
                class="form-control form-control-sm direct-item-search-input" 
                data-row-id="${row.id}"
                placeholder="-- Type code or name --" 
                value="${row.item_id ? `${row.item_code} - ${row.item_name}` : ''}"
                autocomplete="off" 
                style="height: 30px; font-size: 11.5px; padding-right: 20px; background: var(--bg-surface, #ffffff); cursor: text;"
                oninput="window.GoodsReceiptModule.onDirectItemRowSearchInput(${row.id}, this.value)"
                onfocus="window.GoodsReceiptModule.onDirectItemRowSearchFocus(${row.id})"
                onclick="window.GoodsReceiptModule.onDirectItemRowSearchFocus(${row.id})"
              />
              <span style="position: absolute; right: 7px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-muted); font-size: 9px;">▼</span>
              <div 
                id="direct-item-row-results-${row.id}" 
                class="direct-item-row-results" 
                style="display: none; position: absolute; top: calc(100% + 2px); left: 0; min-width: 380px; max-width: 500px; max-height: 240px; overflow-y: auto; background: var(--bg-surface, #ffffff); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); z-index: 1060;"
              ></div>
            </div>
            <select class="direct-item-select" data-row-id="${row.id}" style="display: none;">
              <option value="${row.item_id || ''}">${row.item_code || ''}</option>
            </select>
          </td>
          <td>
            <span class="direct-row-cat" style="font-size: 11px; color: var(--text-secondary);">${row.category || '—'}</span>
          </td>
          <td>
            <span class="direct-row-uom cell-mono" style="font-size: 11px;">${row.uom || 'NOS'}</span>
          </td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm direct-row-qty" value="${row.received_qty || 1}" min="1" step="1" required style="height: 30px; font-weight: 700; text-align: right;" oninput="window.GoodsReceiptModule.onDirectFinancialChange(${row.id}, 'received_qty', this.value)" />
          </td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm direct-row-price" value="${price}" min="0" step="any" required style="height: 30px; text-align: right;" oninput="window.GoodsReceiptModule.onDirectFinancialChange(${row.id}, 'unit_price', this.value)" />
          </td>
          <td class="text-right cell-num direct-row-gross" style="font-weight: 600;">₹${gross.toFixed(2)}</td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm direct-row-discount" value="${disc}" min="0" step="any" style="height: 30px; text-align: right;" oninput="window.GoodsReceiptModule.onDirectFinancialChange(${row.id}, 'discount_amount', this.value)" />
          </td>
          <td class="text-right cell-num direct-row-taxable" style="font-weight: 600;">₹${taxable.toFixed(2)}</td>
          <td onclick="event.stopPropagation()">
            <input type="number" class="form-control form-control-sm direct-row-tax" value="${tax.toFixed(2)}" min="0" step="any" style="height: 30px; text-align: right;" oninput="window.GoodsReceiptModule.onDirectFinancialChange(${row.id}, 'tax_amount', this.value)" />
          </td>
          <td class="text-right cell-num direct-row-net" style="font-weight: 700; color: var(--primary-color, #2563eb);">₹${net.toFixed(2)}</td>
          <td style="width: 28px; text-align: center;">
            <span class="grn-expand-arrow" data-expand-id="${dirRowSubId}" style="font-size: 11px; color: var(--text-muted); cursor: pointer; user-select: none;">▶</span>
          </td>
          <td style="text-align: center;" onclick="event.stopPropagation()">
            <button type="button" class="btn btn-icon btn-sm" style="color: var(--color-danger); padding: 2px 6px;" title="Remove Item" onclick="window.GoodsReceiptModule.removeDirectGRNRow(${row.id})">
              ✕
            </button>
          </td>
        </tr>
        <tr id="${dirRowSubId}" class="grn-batch-subrow" style="display: none; background: var(--bg-surface-elevated, #f0f4ff);">
          <td colspan="13" style="padding: 8px 14px;">
            <div style="display: flex; align-items: center; gap: 18px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap; min-width: 90px;">Batch / Lot # <span style="color:var(--color-danger);">*</span></label>
                <input type="text" class="form-control form-control-sm direct-row-batch" value="${row.batch_number || ''}" required style="height: 28px; font-family: monospace; font-size: 11.5px; width: 170px;" oninput="window.GoodsReceiptModule.onDirectFieldChange(${row.id}, 'batch_number', this.value)" />
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap;">Mfg. Date</label>
                <input type="date" class="form-control form-control-sm direct-row-mfg" value="${row.mfg_date || ''}" style="height: 28px; font-size: 11px; width: 140px;" oninput="window.GoodsReceiptModule.onDirectFieldChange(${row.id}, 'mfg_date', this.value)" />
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap;">Expiry Date</label>
                <input type="date" class="form-control form-control-sm direct-row-exp" value="${row.expiry_date || ''}" style="height: 28px; font-size: 11px; width: 140px;" oninput="window.GoodsReceiptModule.onDirectFieldChange(${row.id}, 'expiry_date', this.value)" />
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  addDirectGRNRow() {
    const allItems = (window.DB.getAll('items') || []).filter(i => i.status === 'Active' || !i.status);
    const firstItem = allItems[0];
    const price = firstItem ? (Number(firstItem.purchase_price) || Number(firstItem.standard_cost) || 100) : 100;
    const taxRate = Number(firstItem?.tax_rate !== undefined ? firstItem.tax_rate : (firstItem?.gst_rate !== undefined ? firstItem.gst_rate : 18));
    const gross = 1 * price;
    const taxable = gross;
    const tax = Math.round((taxable * taxRate / 100) * 100) / 100;
    const net = Math.round((taxable + tax) * 100) / 100;

    const newRow = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      item_id: firstItem ? firstItem.id : '',
      item_code: firstItem ? firstItem.code : '',
      item_name: firstItem ? firstItem.name : '',
      category: firstItem ? (firstItem.category_name || 'General') : 'General',
      uom: firstItem ? (firstItem.base_uom || 'NOS') : 'NOS',
      received_qty: 1,
      unit_price: price,
      unit_cost: price,
      tax_rate: taxRate,
      gross_amount: gross,
      discount_amount: 0,
      taxable_amount: taxable,
      tax_amount: tax,
      net_amount: net,
      batch_number: `LOT-DIR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      mfg_date: new Date().toISOString().split('T')[0],
      expiry_date: ''
    };

    this.directGRNItems.push(newRow);
    const tbody = document.getElementById('direct-grn-items-tbody');
    if (tbody) {
      tbody.innerHTML = this.renderDirectGRNTableRows();
      this.calcDirectGRNTotals();
    }
  },

  removeDirectGRNRow(rowId) {
    if (this.directGRNItems.length <= 1) {
      window.State.showToast('At least one item line is required for Direct GRN.', 'warning');
      return;
    }
    this.directGRNItems = this.directGRNItems.filter(r => r.id !== rowId);
    const tbody = document.getElementById('direct-grn-items-tbody');
    if (tbody) {
      tbody.innerHTML = this.renderDirectGRNTableRows();
      this.calcDirectGRNTotals();
    }
  },

  onDirectItemChange(rowId, itemId) {
    const row = this.directGRNItems.find(r => r.id === rowId);
    if (!row) return;

    const item = window.DB.getById('items', itemId);
    if (item) {
      const price = Number(item.purchase_price) || Number(item.standard_cost) || 100;
      const taxRate = Number(item.tax_rate !== undefined ? item.tax_rate : (item.gst_rate !== undefined ? item.gst_rate : 18));
      const qty = Number(row.received_qty) || 1;
      const disc = Number(row.discount_amount || 0);
      const gross = qty * price;
      const taxable = Math.max(0, gross - disc);
      const tax = Math.round((taxable * taxRate / 100) * 100) / 100;
      const net = Math.round((taxable + tax) * 100) / 100;

      row.item_id = item.id;
      row.item_code = item.code;
      row.item_name = item.name;
      row.category = item.category_name || 'General';
      row.uom = item.base_uom || 'NOS';
      row.unit_price = price;
      row.unit_cost = price;
      row.tax_rate = taxRate;
      row.gross_amount = gross;
      row.taxable_amount = taxable;
      row.tax_amount = tax;
      row.net_amount = net;
      row.batch_number = `LOT-${(item.code || 'GEN').replace(/[^a-zA-Z0-9]/g, '')}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      if (item.has_expiry && item.shelf_life_days) {
        row.expiry_date = new Date(Date.now() + (item.shelf_life_days * 86400000)).toISOString().split('T')[0];
      }
    }

    const tbody = document.getElementById('direct-grn-items-tbody');
    if (tbody) {
      tbody.innerHTML = this.renderDirectGRNTableRows();
      this.calcDirectGRNTotals();
    }
  },

  onDirectItemRowSearchInput(rowId, query) {
    const q = (query || '').trim().toLowerCase();
    const resultsEl = document.getElementById(`direct-item-row-results-${rowId}`);
    if (!resultsEl) return;

    const storeId = document.getElementById('grn-dir-wh-select')?.value;
    const allItems = (window.DB.getAll('items') || []).filter(i => {
      const s = (i.status || '').toLowerCase();
      return !s || s === 'active';
    });

    let matches = allItems;
    if (q) {
      matches = allItems.filter(i => {
        const code = (i.code || '').toLowerCase();
        const name = (i.name || '').toLowerCase();
        const cat = (i.category_name || i.category || '').toLowerCase();
        return code.includes(q) || name.includes(q) || cat.includes(q);
      });
    }

    if (matches.length === 0) {
      resultsEl.innerHTML = `
        <div style="padding: 8px 12px; font-size: 11.5px; color: var(--text-muted); text-align: center;">
          No matching items found for "<strong>${query}</strong>"
        </div>
      `;
      resultsEl.style.display = 'block';
      return;
    }

    resultsEl.innerHTML = `
      <div style="padding: 5px 10px; font-size: 10px; font-weight: 700; color: var(--text-muted); background: var(--bg-surface-elevated, #f8fafc); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
        <span>SELECT ITEM (TYPE TO FILTER)</span>
        <span style="font-weight: normal;">Matches: ${matches.length}</span>
      </div>
      <div style="display: flex; flex-direction: column;">
        ${matches.slice(0, 50).map(it => {
          const stock = this.getItemStock(it.id, storeId);
          const uom = it.base_uom || it.unit_of_measure || 'NOS';
          const stockColor = stock > 0 ? '#16a34a' : 'var(--text-muted)';
          return `
            <div 
              style="padding: 6px 10px; font-size: 11.5px; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.04); gap: 8px; transition: background 0.1s ease;"
              onmouseover="this.style.background='var(--primary-light, #e0e7ff)';"
              onmouseout="this.style.background='transparent';"
              onclick="window.GoodsReceiptModule.selectDirectItemFromRow(${rowId}, '${it.id}')"
            >
              <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span style="font-family: monospace; font-weight: 700; color: var(--primary-color, #2563eb);">${it.code}</span>
                <span style="margin: 0 4px; color: var(--text-muted);">-</span>
                <span>${it.name}</span>
              </div>
              <span style="font-size: 10.5px; font-weight: 600; color: ${stockColor}; flex-shrink: 0;">
                Stock: ${stock.toLocaleString('en-IN')} ${uom}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    resultsEl.style.display = 'block';
  },

  onDirectItemRowSearchFocus(rowId) {
    const input = document.querySelector(`.direct-item-search-input[data-row-id="${rowId}"]`);
    this.onDirectItemRowSearchInput(rowId, input ? input.value : '');
  },

  selectDirectItemFromRow(rowId, itemId) {
    this.onDirectItemChange(rowId, itemId);
    const resultsEl = document.getElementById(`direct-item-row-results-${rowId}`);
    if (resultsEl) resultsEl.style.display = 'none';
  },

  onDirectFinancialChange(rowId, field, val) {
    const row = this.directGRNItems.find(r => r.id === rowId);
    if (!row) return;

    if (field === 'received_qty') {
      row.received_qty = Number(val) || 0;
    } else if (field === 'unit_price' || field === 'unit_cost') {
      row.unit_price = Number(val) || 0;
      row.unit_cost = row.unit_price;
    } else if (field === 'discount_amount') {
      row.discount_amount = Number(val) || 0;
    } else if (field === 'tax_amount') {
      row.tax_amount = Number(val) || 0;
    }

    const price = Number(row.unit_price !== undefined ? row.unit_price : (row.unit_cost || 0)) || 0;
    const qty = Number(row.received_qty) || 0;
    const disc = Number(row.discount_amount || 0);
    const taxRate = Number(row.tax_rate !== undefined ? row.tax_rate : 18);

    const gross = qty * price;
    const taxable = Math.max(0, gross - disc);
    let tax = 0;
    if (field === 'tax_amount') {
      tax = row.tax_amount;
    } else {
      tax = Math.round((taxable * taxRate / 100) * 100) / 100;
      row.tax_amount = tax;
    }
    const net = Math.round((taxable + tax) * 100) / 100;

    row.gross_amount = gross;
    row.taxable_amount = taxable;
    row.net_amount = net;

    // Update row DOM
    const tr = document.querySelector(`.direct-grn-row[data-row-id="${rowId}"]`);
    if (tr) {
      const grossEl = tr.querySelector('.direct-row-gross');
      if (grossEl) grossEl.innerText = `₹${gross.toFixed(2)}`;

      const taxableEl = tr.querySelector('.direct-row-taxable');
      if (taxableEl) taxableEl.innerText = `₹${taxable.toFixed(2)}`;

      if (field !== 'tax_amount') {
        const taxInput = tr.querySelector('.direct-row-tax');
        if (taxInput) taxInput.value = tax.toFixed(2);
      }

      const netEl = tr.querySelector('.direct-row-net');
      if (netEl) netEl.innerText = `₹${net.toFixed(2)}`;
    }

    this.calcDirectGRNTotals();
  },

  onDirectFieldChange(rowId, field, val) {
    if (field === 'received_qty' || field === 'unit_cost' || field === 'unit_price' || field === 'discount_amount' || field === 'tax_amount') {
      this.onDirectFinancialChange(rowId, field, val);
      return;
    }
    const row = this.directGRNItems.find(r => r.id === rowId);
    if (row) {
      row[field] = val;
    }
  },

  // --------------------------------------------------------------------------
  // Row expand / collapse for Batch / Mfg / Expiry sub-row
  // --------------------------------------------------------------------------
  toggleGRNBatchRow(expandId, event) {
    // Don't toggle if the click was on an input, select, button or their children
    if (event && event.target) {
      const tag = event.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'button' || tag === 'textarea') return;
      if (event.target.closest('input, select, button, textarea, .direct-item-search-wrap, .direct-item-row-results, #grn-item-search-results')) return;
    }

    const subRow = document.getElementById(expandId);
    if (!subRow) return;

    const isOpen = subRow.style.display !== 'none';
    subRow.style.display = isOpen ? 'none' : '';

    // Rotate the arrow icon
    const arrows = document.querySelectorAll(`.grn-expand-arrow[data-expand-id="${expandId}"]`);
    arrows.forEach(a => { a.textContent = isOpen ? '▶' : '▼'; a.style.color = isOpen ? 'var(--text-muted)' : 'var(--primary-300)'; });

    // Highlight the main row
    const mainRow = subRow.previousElementSibling;
    if (mainRow) {
      mainRow.style.background = isOpen ? '' : 'rgba(37, 99, 235, 0.06)';
    }

    // Auto-focus first input in the sub-row when opening
    if (!isOpen) {
      const firstInput = subRow.querySelector('input');
      if (firstInput) setTimeout(() => firstInput.focus(), 50);
    }
  },

  calcDirectGRNTotals() {
    let totalQty = 0;
    let totalGross = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalTax = 0;
    let totalNet = 0;

    (this.directGRNItems || []).forEach(r => {
      const q = Number(r.received_qty) || 0;
      const price = Number(r.unit_price !== undefined ? r.unit_price : (r.unit_cost || 0)) || 0;
      const disc = Number(r.discount_amount || 0);
      const gross = q * price;
      const taxable = Math.max(0, gross - disc);
      const tax = Number(r.tax_amount !== undefined ? r.tax_amount : (taxable * (r.tax_rate || 18) / 100)) || 0;
      const net = Math.round((taxable + tax) * 100) / 100;

      totalQty += q;
      totalGross += gross;
      totalDiscount += disc;
      totalTaxable += taxable;
      totalTax += tax;
      totalNet += net;
    });

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };

    setEl('direct-grn-total-qty', totalQty);
    setEl('direct-grn-total-gross', `₹${totalGross.toFixed(2)}`);
    setEl('direct-grn-total-discount', `₹${totalDiscount.toFixed(2)}`);
    setEl('direct-grn-total-taxable', `₹${totalTaxable.toFixed(2)}`);
    setEl('direct-grn-total-tax', `₹${totalTax.toFixed(2)}`);
    setEl('direct-grn-total-net', `₹${totalNet.toFixed(2)}`);
  },

  // --------------------------------------------------------------------------
  // Submit Handlers
  // --------------------------------------------------------------------------
  submitWithPOGRN(e) {
    e.preventDefault();
    const poId = document.getElementById('grn-po-select')?.value;
    const whId = document.getElementById('grn-po-wh-select')?.value;
    const challan = document.getElementById('grn-po-challan')?.value?.trim() || '';
    const invoice = document.getElementById('grn-po-invoice')?.value?.trim() || '';
    const inwardDate = document.getElementById('grn-po-date')?.value || new Date().toISOString().split('T')[0];
    const receiver = document.getElementById('grn-po-receiver')?.value || (window.State.currentUser ? window.State.currentUser.name : 'Storekeeper');
    const remarks = document.getElementById('grn-po-remarks')?.value?.trim() || '';

    const po = window.DB.getById('purchaseOrders', poId);
    if (!po) {
      window.State.showToast('Selected purchase order not found.', 'error');
      return;
    }

    const rows = document.querySelectorAll('.grn-po-line-row');
    const grnItems = [];
    let totalReceived = 0;
    let totalGross = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalTax = 0;
    let totalNet = 0;

    rows.forEach(tr => {
      const itemId = tr.getAttribute('data-item-id');
      const itemCode = tr.getAttribute('data-item-code');
      const itemName = tr.getAttribute('data-item-name');
      const uom = tr.getAttribute('data-uom');
      const defaultRate = Number(tr.getAttribute('data-rate')) || 0;

      const qty = Number(tr.querySelector('.grn-po-recv-qty')?.value) || 0;
      const unitPrice = tr.querySelector('.grn-po-price') ? (Number(tr.querySelector('.grn-po-price').value) || 0) : defaultRate;
      const discount = tr.querySelector('.grn-po-discount') ? (Number(tr.querySelector('.grn-po-discount').value) || 0) : 0;
      const gross = qty * unitPrice;
      const taxable = Math.max(0, gross - discount);
      const taxRate = Number(tr.getAttribute('data-tax-rate')) || 18;
      const tax = tr.querySelector('.grn-po-tax') ? (Number(tr.querySelector('.grn-po-tax').value) || 0) : (Math.round((taxable * taxRate / 100) * 100) / 100);
      const net = Math.round((taxable + tax) * 100) / 100;

      const batch = tr.querySelector('.grn-po-batch')?.value.trim();
      const mfg = tr.querySelector('.grn-po-mfg')?.value;
      const exp = tr.querySelector('.grn-po-exp')?.value;

      if (qty > 0) {
        totalReceived += qty;
        totalGross += gross;
        totalDiscount += discount;
        totalTaxable += taxable;
        totalTax += tax;
        totalNet += net;

        grnItems.push({
          item_id: itemId,
          item_code: itemCode,
          item_name: itemName,
          uom: uom,
          received_qty: qty,
          accepted_qty: qty,
          unit_price: unitPrice,
          unit_cost: unitPrice,
          gross_amount: gross,
          discount_amount: discount,
          taxable_amount: taxable,
          tax_amount: tax,
          net_amount: net,
          total_amount: net,
          batch_number: batch,
          mfg_date: mfg,
          expiry_date: exp || null
        });
      }
    });

    if (grnItems.length === 0 || totalReceived <= 0) {
      window.State.showToast('Please enter received quantity for at least one item.', 'warning');
      return;
    }

    const grnNumber = `GRN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newGRN = window.DB.insert('goodsReceipts', {
      grn_number: grnNumber,
      grn_type: 'WITH_PO',
      po_id: poId,
      po_number: po.po_number,
      plant_id: po.plant_id || 'PLANT-01',
      warehouse_id: whId,
      supplier_id: po.supplier_id,
      supplier_name: (window.DB.getById('suppliers', po.supplier_id)?.name) || 'Supplier',
      challan_no: challan,
      invoice_no: invoice,
      received_date: inwardDate || new Date().toISOString(),
      received_by: receiver,
      total_gross_amount: totalGross,
      total_discount_amount: totalDiscount,
      total_taxable_amount: totalTaxable,
      total_tax_amount: totalTax,
      total_net_amount: totalNet,
      total_amount: totalNet,
      status: 'PENDING_APPROVAL',
      inspection_status: 'PENDING_APPROVAL',
      remarks: remarks,
      items: grnItems
    });

    window.DB.logAudit(
      'CREATE_GRN',
      'INWARD',
      grnNumber,
      `Received material inward under Challan ${challan} against PO ${po.po_number}. Awaiting approval.`
    );

    window.State.closeModal();
    window.State.showToast(`GRN ${grnNumber} generated! Awaiting authorization by authorized user.`);
    
    // Refresh table
    const container = document.getElementById('view-container');
    if (container) this.render(container);
  },

  submitDirectGRN(e) {
    e.preventDefault();
    const whId = document.getElementById('grn-dir-wh-select')?.value;
    const supplierId = document.getElementById('grn-dir-supplier-select')?.value;
    const challan = document.getElementById('grn-dir-challan')?.value?.trim() || '';
    const invoice = document.getElementById('grn-dir-invoice')?.value?.trim() || '';
    const inwardDate = document.getElementById('grn-dir-date')?.value || new Date().toISOString().split('T')[0];
    const receiver = document.getElementById('grn-dir-receiver')?.value || (window.State.currentUser ? window.State.currentUser.name : 'Storekeeper');
    const purpose = document.getElementById('grn-dir-purpose')?.value || 'DIRECT_PURCHASE';
    const remarks = document.getElementById('grn-dir-remarks')?.value?.trim() || '';

    const supplierObj = window.DB.getById('suppliers', supplierId);
    const supplierName = supplierObj ? supplierObj.name : 'Direct / Local Spot Purchase';

    const validItems = (this.directGRNItems || []).filter(r => r.item_id && Number(r.received_qty) > 0);
    if (validItems.length === 0) {
      window.State.showToast('Please add at least one valid item with quantity for Direct GRN.', 'warning');
      return;
    }

    let totalGross = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalTax = 0;
    let totalNet = 0;

    const grnItems = validItems.map(r => {
      const qty = Number(r.received_qty) || 0;
      const price = Number(r.unit_price !== undefined ? r.unit_price : (r.unit_cost || 0)) || 0;
      const disc = Number(r.discount_amount || 0);
      const gross = qty * price;
      const taxable = Math.max(0, gross - disc);
      const taxRate = Number(r.tax_rate !== undefined ? r.tax_rate : 18);
      const tax = Number(r.tax_amount !== undefined ? r.tax_amount : Math.round((taxable * taxRate / 100) * 100) / 100);
      const net = Math.round((taxable + tax) * 100) / 100;

      totalGross += gross;
      totalDiscount += disc;
      totalTaxable += taxable;
      totalTax += tax;
      totalNet += net;

      return {
        item_id: r.item_id,
        item_code: r.item_code,
        item_name: r.item_name,
        uom: r.uom || 'NOS',
        received_qty: qty,
        accepted_qty: qty,
        unit_price: price,
        unit_cost: price,
        gross_amount: gross,
        discount_amount: disc,
        taxable_amount: taxable,
        tax_amount: tax,
        net_amount: net,
        total_amount: net,
        batch_number: r.batch_number || `LOT-DIR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        mfg_date: r.mfg_date || new Date().toISOString().split('T')[0],
        expiry_date: r.expiry_date || null
      };
    });

    const grnNumber = `GRN-DIR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const store = window.DB.getById('warehouses', whId);
    const plantId = (store && store.plant_id) ? store.plant_id : (window.State.currentPlantId !== 'ALL' ? window.State.currentPlantId : 'PLANT-01');

    const newGRN = window.DB.insert('goodsReceipts', {
      grn_number: grnNumber,
      grn_type: 'DIRECT',
      po_id: null,
      po_number: 'Direct Inward',
      plant_id: plantId,
      warehouse_id: whId,
      supplier_id: supplierId,
      supplier_name: supplierName,
      challan_no: challan,
      invoice_no: invoice,
      received_date: inwardDate || new Date().toISOString(),
      received_by: receiver,
      purpose: purpose,
      total_gross_amount: totalGross,
      total_discount_amount: totalDiscount,
      total_taxable_amount: totalTaxable,
      total_tax_amount: totalTax,
      total_net_amount: totalNet,
      total_amount: totalNet,
      status: 'PENDING_APPROVAL',
      inspection_status: 'PENDING_APPROVAL',
      remarks: remarks,
      items: grnItems
    });

    window.DB.logAudit(
      'CREATE_DIRECT_GRN',
      'INWARD',
      grnNumber,
      `Generated Direct GRN inward under Challan ${challan} without PO. Awaiting approval.`
    );

    window.State.closeModal();
    window.State.showToast(`Direct GRN ${grnNumber} generated! Awaiting authorization by authorized user.`);
    
    // Refresh table
    const container = document.getElementById('view-container');
    if (container) this.render(container);
  },

  // --------------------------------------------------------------------------
  // Authorization & Stock Posting Workflow
  // --------------------------------------------------------------------------
  approveGRN(grnId) {
    const grn = window.DB.getById('goodsReceipts', grnId);
    if (!grn) return;

    if (grn.status === 'APPROVED' || grn.status === 'COMPLETED') {
      window.State.showToast('This GRN is already approved and stock has been posted.', 'info');
      return;
    }

    const store = window.DB.getById('warehouses', grn.warehouse_id) || { name: 'Store' };
    const totalQty = (grn.items || []).reduce((sum, it) => sum + (Number(it.received_qty) || 0), 0);

    if (!confirm(`Are you sure you want to authorize & approve GRN "${grn.grn_number}"?\n\nThis will add ${totalQty} units across ${grn.items.length} item(s) directly into "${store.name}".\n\nThe added stock will immediately be visible across all screens.`)) {
      return;
    }

    const approverName = (window.State.currentUser && window.State.currentUser.name) ? window.State.currentUser.name : 'Authorized Manager';
    const approvedDate = new Date().toISOString();

    // 1. Update GRN status
    grn.status = 'APPROVED';
    grn.inspection_status = 'APPROVED';
    grn.approved_by = approverName;
    grn.approved_at = approvedDate;

    // 2. Post Stock into inventoryBalances and inventoryTransactions
    const allBalances = window.DB.getAll('inventoryBalances') || [];
    
    (grn.items || []).forEach(item => {
      const qty = Number(item.received_qty) || 0;
      if (qty <= 0) return;

      // Find matching balance record in store
      let bal = allBalances.find(b => 
        (b.warehouse_id === grn.warehouse_id || b.store_id === grn.warehouse_id) && 
        (b.item_id === item.item_id || b.item_code === item.item_code)
      );

      if (bal) {
        bal.on_hand = (Number(bal.on_hand) || 0) + qty;
        bal.available = Math.max(0, (Number(bal.on_hand) || 0) - (Number(bal.reserved) || 0));
        bal.updated_at = approvedDate;
        if (item.batch_number) bal.batch_number = item.batch_number;
        if (item.unit_cost) bal.valuation_rate = Number(item.unit_cost);
      } else {
        const itemObj = window.DB.getById('items', item.item_id);
        const newBal = {
          id: `BAL-${Date.now().toString(36)}-${Math.floor(Math.random()*1000)}`,
          plant_id: grn.plant_id || 'PLANT-01',
          warehouse_id: grn.warehouse_id,
          store_id: grn.warehouse_id,
          bin_id: null,
          item_id: item.item_id,
          item_code: item.item_code || itemObj?.code || item.item_id,
          item_name: item.item_name || itemObj?.name || 'Item',
          batch_number: item.batch_number || 'LOT-GEN',
          on_hand: qty,
          reserved: 0,
          allocated: 0,
          available: qty,
          stock_status: 'AVAILABLE',
          valuation_rate: item.unit_cost ? Number(item.unit_cost) : (itemObj?.purchase_price || 100),
          reorder_level: itemObj?.reorder_level || 10,
          mfg_date: item.mfg_date || approvedDate.split('T')[0],
          expiry_date: item.expiry_date || null,
          created_at: approvedDate,
          updated_at: approvedDate
        };
        allBalances.push(newBal);
      }

      // Add audit stock record in DB
      if (typeof window.DB.logAudit === 'function') {
        window.DB.logAudit(
          'STOCK_ADD',
          'INVENTORY',
          item.item_id,
          `Inward stock added ${qty} units of ${item.item_code || item.item_id} (Batch: ${item.batch_number}) to Store ${store.name} via approved GRN ${grn.grn_number}`
        );
      }

      // Insert transaction history record
      window.DB.insert('inventoryTransactions', {
        id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        transaction_type: 'GRN_INWARD',
        transaction_date: approvedDate,
        ref_doc_type: 'GRN',
        ref_doc_no: grn.grn_number,
        warehouse_id: grn.warehouse_id,
        store_id: grn.warehouse_id,
        item_id: item.item_id,
        item_code: item.item_code,
        batch_number: item.batch_number,
        quantity: qty,
        unit_cost: Number(item.unit_cost) || 0,
        created_by: approverName,
        notes: `Approved GRN ${grn.grn_number} inward (${grn.grn_type || 'INWARD'}) into ${store.name}`
      });
    });

    // 3. If With PO, update PO received quantities
    if (grn.po_id) {
      const po = window.DB.getById('purchaseOrders', grn.po_id);
      if (po && Array.isArray(po.items)) {
        let allFulfilled = true;
        po.items.forEach(poItem => {
          const recItem = grn.items.find(gi => gi.item_id === poItem.item_id);
          if (recItem) {
            poItem.received_qty = (Number(poItem.received_qty) || 0) + (Number(recItem.received_qty) || 0);
          }
          if ((Number(poItem.received_qty) || 0) < (Number(poItem.ordered_qty) || 0)) {
            allFulfilled = false;
          }
        });
        po.status = allFulfilled ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED';
        window.DB.update('purchaseOrders', po.id, {
          items: po.items,
          status: po.status
        });
      }
    }

    // 4. Save DB and broadcast changes
    window.DB.saveData();
    window.DB.emitChange('inventoryBalances');
    window.DB.emitChange('goodsReceipts');
    window.DB.emitChange('inventoryTransactions');
    window.DB.emitChange('purchaseOrders');

    if (typeof window.DB.logStoreAudit === 'function') {
      window.DB.logStoreAudit(
        grn.warehouse_id,
        'GRN_STOCK_POSTED',
        `Authorized GRN ${grn.grn_number}: Added ${totalQty} units into store stock by ${approverName}`
      );
    }

    window.State.showToast(`GRN ${grn.grn_number} approved! ${totalQty} units added to ${store.name}.`);

    // If modal is currently showing this GRN, close or re-render
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle && modalTitle.innerText.includes(grn.grn_number)) {
      window.State.closeModal();
    }

    // Refresh register table
    const container = document.getElementById('view-container');
    if (container) this.render(container);
  },

  rejectGRN(grnId) {
    const grn = window.DB.getById('goodsReceipts', grnId);
    if (!grn) return;

    if (!confirm(`Are you sure you want to reject GRN "${grn.grn_number}"? Stock will NOT be added to store.`)) {
      return;
    }

    grn.status = 'REJECTED';
    grn.inspection_status = 'REJECTED';
    grn.rejected_by = window.State.currentUser ? window.State.currentUser.name : 'Authorized Manager';
    grn.rejected_at = new Date().toISOString();

    window.DB.saveData();
    window.DB.emitChange('goodsReceipts');
    window.State.showToast(`GRN ${grn.grn_number} has been rejected.`);

    const modalTitle = document.getElementById('modal-title');
    if (modalTitle && modalTitle.innerText.includes(grn.grn_number)) {
      window.State.closeModal();
    }

    const container = document.getElementById('view-container');
    if (container) this.render(container);
  },

  // --------------------------------------------------------------------------
  // View & Print GRN
  // --------------------------------------------------------------------------
  viewGRN(grnId) {
    const grn = window.DB.getById('goodsReceipts', grnId) || window.DB.getById('goodsReceiptNotes', grnId);
    if (!grn) return;
    const po = grn.po_id ? window.DB.getById('purchaseOrders', grn.po_id) : null;
    const supplier = window.DB.getById('suppliers', grn.supplier_id);
    const store = window.DB.getById('warehouses', grn.warehouse_id);
    const facId = grn.plant_id || (po && po.plant_id) || 'PLANT-01';

    const isPending = (grn.status === 'PENDING_APPROVAL' || grn.inspection_status === 'PENDING_APPROVAL');
    const isApproved = (grn.status === 'APPROVED' || grn.status === 'COMPLETED');
    const isRejected = (grn.status === 'REJECTED');

    window.State.showModal({
      title: `Goods Receipt Note: ${grn.grn_number}`,
      maxWidth: '1100px',
      contentHtml: `
        <div style="display:flex; flex-direction:column; gap:14px;">
          
          <!-- Status Banner -->
          ${isPending ? `
            <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid var(--color-warning); padding: 10px 14px; border-radius: 4px; font-size: 12px; color: var(--text-primary);">
              <strong>Pending Authorization:</strong> This GRN has been saved and is awaiting approval by an authorized user. Stock has <strong>not</strong> been added to <strong>${store ? store.name : 'Store'}</strong> yet. Click "Approve & Post Stock" below to authorize.
            </div>
          ` : isApproved ? `
            <div style="background: rgba(34, 197, 94, 0.1); border-left: 4px solid var(--color-success); padding: 10px 14px; border-radius: 4px; font-size: 12px; color: var(--text-primary);">
              <strong>Stock Inward Completed:</strong> Approved by <strong>${grn.approved_by || 'Store Manager'}</strong> on ${window.formatDate(grn.approved_at || grn.created_at)}. Stock has been added to <strong>${store ? store.name : 'Store'}</strong> and is available across all screens.
            </div>
          ` : isRejected ? `
            <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--color-danger); padding: 10px 14px; border-radius: 4px; font-size: 12px; color: var(--text-primary);">
              <strong>Inward Rejected:</strong> This GRN was rejected by <strong>${grn.rejected_by || 'Store Manager'}</strong>. No stock was posted.
            </div>
          ` : ''}

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; background:var(--bg-surface-elevated, #f8fafc); padding:16px; border: 1px solid var(--border-color); border-radius:var(--radius-md);">
            <div><span style="font-size:11px; color:var(--text-muted);">Inward Type:</span><br><b class="badge ${grn.grn_type === 'DIRECT' ? 'badge-subtle' : 'badge-primary'}" style="font-size:10px;">${grn.grn_type === 'DIRECT' ? 'Direct GRN' : 'With PO'}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Supplier:</span><br><b>${supplier ? supplier.name : (grn.supplier_name || 'Vendor')}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Receiving Store:</span><br><b>${store ? store.name : (grn.warehouse_id || 'Main Store')}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">PO Number:</span><br><b class="cell-mono">${po ? po.po_number : (grn.po_number || 'Direct Inward')}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Challan No:</span><br><b>${grn.challan_no || '—'}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Invoice No:</span><br><b>${grn.invoice_no || '—'}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Received Date:</span><br><b>${window.formatDate(grn.received_date || grn.created_at)}</b></div>
            <div><span style="font-size:11px; color:var(--text-muted);">Storekeeper:</span><br><b>${grn.received_by || 'Storekeeper'}</b></div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 45px;">Sr. No.</th>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th>Batch / Lot #</th>
                  <th class="text-right">Received Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Gross Amount</th>
                  <th class="text-right">Discount Amount</th>
                  <th class="text-right">Taxable Amount</th>
                  <th class="text-right">Tax Amount</th>
                  <th class="text-right">Net Amount</th>
                  <th>Mfg Date</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                ${(grn.items || []).map((i, idx) => {
                  const item = window.DB.getById('items', i.item_id);
                  const price = Number(i.unit_price !== undefined ? i.unit_price : (i.unit_cost || 0));
                  const gross = Number(i.gross_amount !== undefined ? i.gross_amount : ((Number(i.received_qty) || 0) * price));
                  const disc = Number(i.discount_amount || 0);
                  const taxable = Number(i.taxable_amount !== undefined ? i.taxable_amount : Math.max(0, gross - disc));
                  const tax = Number(i.tax_amount !== undefined ? i.tax_amount : 0);
                  const net = Number(i.net_amount !== undefined ? i.net_amount : (taxable + tax || i.total_amount || 0));
                  return `
                    <tr>
                      <td>${idx + 1}</td>
                      <td class="cell-mono">${item?.code || i.item_code || i.item_id}</td>
                      <td class="cell-strong">${item?.name || i.item_name || 'Material Item'}</td>
                      <td class="cell-mono" style="color:var(--primary-300);">${i.batch_number}</td>
                      <td class="cell-num text-right">${i.received_qty} ${i.uom}</td>
                      <td class="cell-num text-right">₹${price.toFixed(2)}</td>
                      <td class="cell-num text-right">₹${gross.toFixed(2)}</td>
                      <td class="cell-num text-right">₹${disc.toFixed(2)}</td>
                      <td class="cell-num text-right">₹${taxable.toFixed(2)}</td>
                      <td class="cell-num text-right">₹${tax.toFixed(2)}</td>
                      <td class="cell-num text-right" style="font-weight: 700; color: var(--primary-color, #2563eb);">₹${net.toFixed(2)}</td>
                      <td>${window.formatDate(i.mfg_date)}</td>
                      <td>${window.formatDate(i.expiry_date)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr style="background: var(--bg-surface-elevated, #f8fafc); font-weight: 700;">
                  <td colspan="4" style="text-align: right; color: var(--text-muted);">Totals:</td>
                  <td class="text-right cell-num">${(grn.items || []).reduce((s, it) => s + (Number(it.received_qty) || 0), 0)}</td>
                  <td></td>
                  <td class="text-right cell-num">₹${Number(grn.total_gross_amount || (grn.items || []).reduce((s, it) => s + (Number(it.gross_amount) || ((Number(it.received_qty) || 0) * (Number(it.unit_price || it.unit_cost) || 0))), 0)).toFixed(2)}</td>
                  <td class="text-right cell-num">₹${Number(grn.total_discount_amount || (grn.items || []).reduce((s, it) => s + (Number(it.discount_amount) || 0), 0)).toFixed(2)}</td>
                  <td class="text-right cell-num">₹${Number(grn.total_taxable_amount || (grn.items || []).reduce((s, it) => s + (Number(it.taxable_amount) || 0), 0)).toFixed(2)}</td>
                  <td class="text-right cell-num">₹${Number(grn.total_tax_amount || (grn.items || []).reduce((s, it) => s + (Number(it.tax_amount) || 0), 0)).toFixed(2)}</td>
                  <td class="text-right cell-num" style="color: var(--primary-300);">₹${Number(grn.total_net_amount || grn.total_amount || (grn.items || []).reduce((s, it) => s + (Number(it.net_amount) || Number(it.total_amount) || 0), 0)).toFixed(2)}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `,
      footerHtml: `
        ${isPending ? `
          <button class="btn btn-primary" onclick="window.GoodsReceiptModule.approveGRN('${grn.id}')" style="font-weight: 700;">
            ✓ Approve & Add Stock to Store
          </button>
          <button class="btn btn-outline" style="color: var(--color-danger);" onclick="window.GoodsReceiptModule.rejectGRN('${grn.id}')">
            Reject GRN
          </button>
        ` : ''}
        <button class="btn btn-secondary" onclick="window.GoodsReceiptModule.printGRN('${grn.id}')">Print GRN</button>
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      `
    });
  },

  printGRN(grnId) {
    const grn = window.DB.getById('goodsReceipts', grnId) || window.DB.getById('goodsReceiptNotes', grnId);
    if (!grn) return;
    const facId = grn.plant_id || 'PLANT-01';
    if (window.DocPrintConfigModule && typeof window.DocPrintConfigModule.printConfiguredDocument === 'function') {
      const printed = window.DocPrintConfigModule.printConfiguredDocument('GRN', facId, grn);
      if (printed) return;
    }
    window.print();
  },

  // --------------------------------------------------------------------------
  // Edit & Delete GRN (only allowed before approval)
  // --------------------------------------------------------------------------
  editGRN(grnId) {
    const grn = window.DB.getById('goodsReceipts', grnId);
    if (!grn) return;

    if (grn.status !== 'PENDING_APPROVAL' && grn.inspection_status !== 'PENDING_APPROVAL') {
      window.State.showToast('Only Pending Approval GRNs can be edited.', 'warning');
      return;
    }

    // For With PO GRNs, pre-select the PO and open the modal
    if (grn.grn_type === 'WITH_PO' && grn.po_id) {
      const po = window.DB.getById('purchaseOrders', grn.po_id);
      if (po) {
        // Pre-load items back from saved GRN into PO items for editing
        this.activePOId = grn.po_id;
        this.poGRNExtraItems = [];
        this.directGRNItems = [];
        this._editingGRNId = grnId;
        this.showInwardModal(po, 'WITH_PO');
        setTimeout(() => {
          // Pre-fill header fields
          const challanEl = document.getElementById('grn-po-challan');
          if (challanEl) challanEl.value = grn.challan_no || '';
          const invoiceEl = document.getElementById('grn-po-invoice');
          if (invoiceEl) invoiceEl.value = grn.invoice_no || '';
          const dateEl = document.getElementById('grn-po-date');
          if (dateEl) dateEl.value = (grn.received_date || '').split('T')[0] || new Date().toISOString().split('T')[0];
          const remarksEl = document.getElementById('grn-po-remarks');
          if (remarksEl) remarksEl.value = grn.remarks || '';
          // Pre-fill received quantities from saved GRN items
          (grn.items || []).forEach(gi => {
            const row = document.querySelector(`.grn-po-line-row[data-item-id="${gi.item_id}"]`);
            if (row) {
              const qtyInput = row.querySelector('.grn-po-recv-qty');
              if (qtyInput) { qtyInput.value = gi.received_qty; }
              const priceInput = row.querySelector('.grn-po-price');
              if (priceInput) { priceInput.value = gi.unit_price || gi.unit_cost || 0; }
              const discInput = row.querySelector('.grn-po-discount');
              if (discInput) { discInput.value = gi.discount_amount || 0; }
              const taxInput = row.querySelector('.grn-po-tax');
              if (taxInput) { taxInput.value = (gi.tax_amount || 0).toFixed(2); }
              const batchInput = row.querySelector('.grn-po-batch');
              if (batchInput) { batchInput.value = gi.batch_number || ''; }
              const mfgInput = row.querySelector('.grn-po-mfg');
              if (mfgInput) { mfgInput.value = gi.mfg_date || ''; }
              const expInput = row.querySelector('.grn-po-exp');
              if (expInput) { expInput.value = gi.expiry_date || ''; }
              this.onWithPOFinancialChange(qtyInput);
            }
          });
          this.calcWithPOGRNTotals();
          // Change Save button label
          const saveBtn = document.querySelector('#create-po-grn-form button[type="submit"]');
          if (saveBtn) saveBtn.textContent = 'Update GRN';
        }, 80);
        return;
      }
    }

    // For Direct / Without PO GRNs
    const allItems = window.DB.getAll('items') || [];
    this._editingGRNId = grnId;
    this.directGRNItems = (grn.items || []).map(gi => {
      const itemObj = window.DB.getById('items', gi.item_id);
      return {
        id: Date.now() + Math.floor(Math.random() * 10000),
        item_id: gi.item_id,
        item_code: gi.item_code || itemObj?.code || '',
        item_name: gi.item_name || itemObj?.name || '',
        category: itemObj?.category_name || 'General',
        uom: gi.uom || 'NOS',
        received_qty: gi.received_qty || 1,
        unit_price: gi.unit_price || gi.unit_cost || 0,
        unit_cost: gi.unit_price || gi.unit_cost || 0,
        tax_rate: gi.tax_rate || 18,
        gross_amount: gi.gross_amount || 0,
        discount_amount: gi.discount_amount || 0,
        taxable_amount: gi.taxable_amount || 0,
        tax_amount: gi.tax_amount || 0,
        net_amount: gi.net_amount || 0,
        batch_number: gi.batch_number || '',
        mfg_date: gi.mfg_date || '',
        expiry_date: gi.expiry_date || ''
      };
    });

    this.showInwardModal(null, 'WITHOUT_PO');
    setTimeout(() => {
      const supplierEl = document.getElementById('grn-dir-supplier-select');
      if (supplierEl) supplierEl.value = grn.supplier_id || 'DIR-SUP-LOCAL';
      const challanEl = document.getElementById('grn-dir-challan');
      if (challanEl) challanEl.value = grn.challan_no || '';
      const invoiceEl = document.getElementById('grn-dir-invoice');
      if (invoiceEl) invoiceEl.value = grn.invoice_no || '';
      const dateEl = document.getElementById('grn-dir-date');
      if (dateEl) dateEl.value = (grn.received_date || '').split('T')[0] || new Date().toISOString().split('T')[0];
      const purposeEl = document.getElementById('grn-dir-purpose');
      if (purposeEl) purposeEl.value = grn.purpose || 'DIRECT_PURCHASE';
      const remarksEl = document.getElementById('grn-dir-remarks');
      if (remarksEl) remarksEl.value = grn.remarks || '';
      const whEl = document.getElementById('grn-dir-wh-select');
      if (whEl) whEl.value = grn.warehouse_id || '';
      // Change Save button label
      const saveBtn = document.querySelector('#create-direct-grn-form button[type="submit"]');
      if (saveBtn) saveBtn.textContent = 'Update GRN';
      this.calcDirectGRNTotals();
    }, 80);
  },

  deleteGRN(grnId) {
    const grn = window.DB.getById('goodsReceipts', grnId);
    if (!grn) return;

    if (grn.status !== 'PENDING_APPROVAL' && grn.inspection_status !== 'PENDING_APPROVAL') {
      window.State.showToast('Only Pending Approval GRNs can be deleted.', 'warning');
      return;
    }

    if (!confirm(`Are you sure you want to DELETE GRN "${grn.grn_number}"?\n\nThis action cannot be undone. The GRN has NOT been approved yet so no stock will be affected.`)) {
      return;
    }

    // Remove from goodsReceipts using the DB delete API
    window.DB.delete('goodsReceipts', grnId);

    window.DB.logAudit(
      'DELETE_GRN',
      'INWARD',
      grn.grn_number,
      `GRN ${grn.grn_number} (Pending Approval) was deleted before authorization.`
    );

    window.State.showToast(`GRN ${grn.grn_number} deleted successfully.`, 'success');

    const container = document.getElementById('view-container');
    if (container) this.render(container);
  }
};
