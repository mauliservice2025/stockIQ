/* ==========================================================================
   ENTERPRISE ISCM - STAGE 12: SALES DISPATCH, GATE PASS & SHIPMENT (OUTBOUND)
   Pick Lists, Packing, Transporter Assignment, Gate Pass & Proof of Delivery (POD)
   ========================================================================== */

window.DispatchModule = {
  search: '',
  statusFilter: 'ALL',

  render(container) {
    if (container) this.container = container;
    const target = this.container || document.getElementById('view-container') || document.getElementById('main-content');
    if (!target) return;

    const plantId = window.State.currentPlantId;
    const allShipments = window.DB.getAll('shipments').filter(s => {
      const pId = s.plant_id || s.plantId;
      if (pId && !window.DB.isPlantActive(pId)) return false;
      return plantId === 'ALL' || !pId || pId === plantId;
    });
    const salesOrders = window.DB.getAll('salesOrders');
    const customers = window.DB.getAll('customers');

    const searchLower = (this.search || '').toLowerCase().trim();
    const filtered = allShipments.filter(s => {
      if (this.statusFilter !== 'ALL' && s.status !== this.statusFilter) return false;
      if (searchLower) {
        const customer = window.DB.getById('customers', s.customer_id);
        const corpus = `${s.gate_pass_no || ''} ${s.shipment_number || ''} ${customer?.name || ''} ${customer?.city || ''} ${s.transporter || ''} ${s.vehicle_no || ''} ${s.eway_bill_no || ''}`.toLowerCase();
        if (!corpus.includes(searchLower)) return false;
      }
      return true;
    });

    const paged = (typeof window !== 'undefined' && window.PaginationHelper)
      ? window.PaginationHelper.paginate(filtered, 'dispatch')
      : { items: filtered, totalRecords: filtered.length, totalPages: 1, currentPage: 1, pageSize: 10 };

    target.innerHTML = `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Outbound Logistics, Dispatch & Shipping Gate Pass
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.DispatchModule.showCreateShipmentModal()">
            + Create Outbound Dispatch (Gate Pass)
          </button>
        </div>

        <div class="toolbar">
          <div class="toolbar-left">
            <input type="text" id="shp-search" class="filter-input" placeholder="Search Gate Pass #, vehicle, customer..." value="${this.search || ''}" oninput="window.DispatchModule.onSearchInput(this.value)" onkeydown="if(event.key==='Enter') window.DispatchModule.filterTable()">
            <select id="shp-status-filter" class="filter-select" onchange="window.DispatchModule.onStatusFilterChange(this.value)">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Shipment Statuses</option>
              <option value="IN_TRANSIT" ${this.statusFilter === 'IN_TRANSIT' ? 'selected' : ''}>In-Transit to Customer</option>
              <option value="DELIVERED" ${this.statusFilter === 'DELIVERED' ? 'selected' : ''}>Delivered (POD Verified)</option>
              <option value="READY" ${this.statusFilter === 'READY' ? 'selected' : ''}>Ready for Loading</option>
            </select>
          </div>
          <div class="toolbar-right">
            <span style="font-size:12px; color:var(--text-muted);">Total Dispatches: <b>${filtered.length}</b></span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="shp-table">
            <thead>
              <tr>
                <th>Gate Pass #</th>
                <th>Shipment Ref</th>
                <th>Customer Name</th>
                <th>Transporter & Fleet</th>
                <th>Vehicle #</th>
                <th>e-Waybill #</th>
                <th>Boxes & Wt.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${paged.items.length === 0 ? `
                <tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No outbound shipments recorded matching criteria.</td></tr>
              ` : paged.items.map(s => {
                const customer = window.DB.getById('customers', s.customer_id);
                return `
                  <tr data-status="${s.status}">
                    <td class="cell-mono cell-strong">
                      <a href="javascript:void(0)" onclick="window.DispatchModule.viewShipment('${s.id}')" style="color:var(--primary-300); text-decoration:none;">
                        ${s.gate_pass_no}
                      </a>
                    </td>
                    <td class="cell-mono">${s.shipment_number}</td>
                    <td class="cell-strong">
                      ${customer ? customer.name : 'Customer'}<br>
                      <span style="font-size:11px; color:var(--text-muted);">${customer ? customer.city : ''}</span>
                    </td>
                    <td>${s.transporter}</td>
                    <td class="cell-mono">${s.vehicle_no}</td>
                    <td class="cell-mono" style="color:var(--primary-300);">${s.eway_bill_no || 'N/A'}</td>
                    <td class="cell-num">${s.total_boxes} Pkgs (${s.total_weight_kg || 400} KG)</td>
                    <td>
                      <span class="status-pill ${
                        s.status === 'DELIVERED' ? 'status-approved' :
                        s.status === 'IN_TRANSIT' ? 'status-in-transit' : 'status-pending'
                      }">
                        ${s.status}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.DispatchModule.viewShipment('${s.id}')">
                          Gate Pass
                        </button>
                        ${s.status === 'IN_TRANSIT' ? `
                          <button class="btn btn-success btn-sm" onclick="window.DispatchModule.confirmPOD('${s.id}')">
                            POD Confirm ✓
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
          key: 'dispatch',
          pagination: paged,
          onPageChange: 'window.DispatchModule.setPage',
          onPageSizeChange: 'window.DispatchModule.setPageSize'
        }) : ''}
      </div>
    `;
  },

  onSearchInput(val) {
    this.search = val;
  },

  onStatusFilterChange(val) {
    this.statusFilter = val;
    if (window.PaginationHelper) window.PaginationHelper.reset('dispatch');
    this.render();
  },

  setPage(page) {
    if (window.PaginationHelper) window.PaginationHelper.setPage('dispatch', page);
    this.render();
  },

  setPageSize(size) {
    if (window.PaginationHelper) window.PaginationHelper.setPageSize('dispatch', size);
    this.render();
  },

  filterTable() {
    this.search = document.getElementById('shp-search')?.value || '';
    this.statusFilter = document.getElementById('shp-status-filter')?.value || 'ALL';
    if (window.PaginationHelper) window.PaginationHelper.reset('dispatch');
    this.render();
  },

  viewShipment(shpId) {
    const s = window.DB.getById('shipments', shpId);
    if (!s) return;
    const customer = window.DB.getById('customers', s.customer_id);
    const facId = s.plant_id || 'PLANT-01';

    // Check Document Print Configuration Master if configured for facility
    if (window.DocPrintConfigModule && typeof window.DocPrintConfigModule.generatePrintHtml === 'function') {
      const configuredHtml = window.DocPrintConfigModule.generatePrintHtml('DISPATCH', facId, s);
      if (configuredHtml) {
        window.State.showModal({
          title: `Official Outbound Gate Pass: ${s.gate_pass_no || s.id}`,
          maxWidth: '850px',
          contentHtml: `
            <div id="printable-gatepass">
              ${configuredHtml}
            </div>
          `,
          footerHtml: `
            <button class="btn btn-secondary" onclick="window.DispatchModule.printGatePass('${s.id}')">Print Official Gate Pass</button>
            <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
          `
        });
        return;
      }
    }

    window.State.showModal({
      title: `Official Outbound Gate Pass: ${s.gate_pass_no}`,
      maxWidth: '850px',
      contentHtml: `
        <div id="printable-gatepass" style="display:flex; flex-direction:column; gap:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--border-medium); padding-bottom:16px;">
            <div>
              <h2 style="color:var(--text-primary); font-size:20px; font-weight:800;">Apex Industrial & Automotive Dynamics Ltd.</h2>
              <div style="font-size:12px; color:var(--text-muted);">
                Pune Assembly & High-Precision Logistics Center<br>
                Official Materials Gate Pass & Transporter Challan
              </div>
            </div>
            <div style="text-align:right;">
              <div class="cell-mono" style="font-size:20px; font-weight:900; color:var(--primary-400);">${s.gate_pass_no}</div>
              <div style="font-size:12px; color:var(--text-secondary);">e-Waybill: <b>${s.eway_bill_no || '241088921045'}</b></div>
              <span class="status-pill status-approved" style="margin-top:6px;">${s.status}</span>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; background:var(--bg-surface); padding:16px; border-radius:var(--radius-md);">
            <div>
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Consignee / Customer:</span>
              <div style="font-size:15px; font-weight:800; color:var(--text-primary); margin:4px 0;">${customer?.name}</div>
              <div style="font-size:12px; color:var(--text-secondary);">
                Delivery Destination: ${customer?.city || 'Pune'}<br>
                Tax ID / GST: ${customer?.tax_id || '27AAACM1234E1Z1'}
              </div>
            </div>
            <div>
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Carrier & Logistics Fleet:</span>
              <div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">
                <b>Transporter:</b> ${s.transporter}<br>
                <b>Vehicle Number:</b> <span class="cell-mono" style="font-weight:700;">${s.vehicle_no}</span><br>
                <b>Driver:</b> ${s.driver_name || 'Balwant Singh'} (${s.driver_phone || '9823144552'})<br>
                <b>Total Gross Weight:</b> ${s.total_weight_kg || 420} KG (${s.total_boxes} Wooden Pallets)
              </div>
            </div>
          </div>

          <div>
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:8px;">Dispatched Finished Goods Inventory</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product SKU</th>
                  <th>Manufactured Batch / Serial</th>
                  <th class="text-right">Dispatched Quantity</th>
                  <th>Pallet & Box Identifiers</th>
                </tr>
              </thead>
              <tbody>
                ${(s.items || []).map(i => {
                  const item = window.DB.getById('items', i.item_id);
                  return `
                    <tr>
                      <td class="cell-strong">${item?.code} - ${item?.name}</td>
                      <td class="cell-mono" style="color:var(--primary-300);">${i.batch_number}</td>
                      <td class="cell-num" style="font-weight:800; color:var(--color-success);">${i.dispatched_qty || i.qty} Units</td>
                      <td class="cell-mono">${i.boxes || i.box_pallet_numbers || 'BOX-01 to BOX-12'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div style="display:flex; justify-content:space-between; margin-top:20px; padding-top:20px; border-top:1px dashed var(--border-subtle); font-size:12px; color:var(--text-muted);">
            <div>
              Security Gate Officer Signature: _______________________<br>
              Time Out: <b>${s.dispatched_at ? new Date(s.dispatched_at).toLocaleTimeString('en-IN') : '14:30:00'}</b>
            </div>
            <div style="text-align:right;">
              Carrier Driver Acknowledgment: _______________________<br>
              Vehicle Clean & Sealed: [✓] YES
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.DispatchModule.printGatePass('${s.id}')">Print Official Gate Pass</button>
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
      `
    });
  },

  printGatePass(shpId) {
    const s = window.DB.getById('shipments', shpId);
    if (!s) return;
    const facId = s.plant_id || 'PLANT-01';
    if (window.DocPrintConfigModule && typeof window.DocPrintConfigModule.printConfiguredDocument === 'function') {
      const printed = window.DocPrintConfigModule.printConfiguredDocument('DISPATCH', facId, s);
      if (printed) return;
    }
    window.print();
  },

  confirmPOD(shpId) {
    const s = window.DB.getById('shipments', shpId);
    if (!s) return;

    window.State.showModal({
      title: `📝 Confirm Proof of Delivery (POD)`,
      maxWidth: '550px',
      contentHtml: `
        <form id="pod-form" onsubmit="window.DispatchModule.submitPOD(event, '${s.id}')">
          <div style="font-size:13px; color:var(--text-secondary); margin-bottom:14px;">
            Confirm customer receipt and signed delivery acknowledgment for Gate Pass <b>${s.gate_pass_no}</b>.
          </div>
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">Customer Receiving Officer Name <span class="required">*</span></label>
              <input type="text" id="pod-receiver" class="form-control" value="Vikram Sengupta (Stores Head - Mahindra)" required>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Goods Condition at Unloading</label>
              <select id="pod-condition" class="filter-select" style="width:100%;">
                <option value="INTACT">100% Intact - Zero Transit Damage</option>
                <option value="MINOR_SEAL_LEAK">Minor Seal Wear (Acceptance with remarks)</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Signed POD Reference / Stamp ID</label>
              <input type="text" id="pod-ref" class="form-control cell-mono" value="POD-MHM-PUN-9921" required>
            </div>
          </div>
          <div class="modal-footer" style="padding-right:0; padding-bottom:0; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit & Close Shipment</button>
          </div>
        </form>
      `
    });
  },

  submitPOD(e, shpId) {
    e.preventDefault();
    const s = window.DB.getById('shipments', shpId);
    if (!s) return;

    const receiver = document.getElementById('pod-receiver').value;
    const ref = document.getElementById('pod-ref').value;

    window.DB.update('shipments', shpId, {
      status: 'DELIVERED',
      delivered_at: new Date().toISOString(),
      proof_of_delivery_signature: `Signed by ${receiver} under Ref ${ref}`
    });

    window.DB.logAudit('POD_CONFIRM', 'LOGISTICS', s.gate_pass_no, `Proof of delivery confirmed by ${receiver} for Gate Pass ${s.gate_pass_no}.`);
    window.State.closeModal();
    window.State.showToast(`Shipment ${s.gate_pass_no} delivered successfully! POD recorded.`);
    window.DispatchModule.render(document.getElementById('view-container'));
  },

  showCreateShipmentModal() {
    const customers = window.DB.getAll('customers');
    const fgItems = window.DB.getAll('items').filter(i => i.item_type === 'FINISHED_GOODS');
    const activePlants = window.DB.getActivePlants();
    const defaultPlantId = (window.State.currentPlantId !== 'ALL' && window.DB.isPlantActive(window.State.currentPlantId))
      ? window.State.currentPlantId
      : (activePlants[0]?.id || 'PLANT-01');

    window.State.showModal({
      title: '➕ Create Outbound Dispatch & Gate Pass',
      maxWidth: '750px',
      contentHtml: `
        <form id="create-shp-form" onsubmit="window.DispatchModule.submitNewShipment(event)">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Facility <span class="required">*</span></label>
              <select id="new-shp-plant" class="filter-select" style="width:100%;" required>
                ${activePlants.map(p => `<option value="${p.id}" ${p.id === defaultPlantId ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Select Customer <span class="required">*</span></label>
              <select id="new-shp-customer" class="filter-select" style="width:100%;" required>
                ${customers.map(c => `<option value="${c.id}">${c.name} (${c.city})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Transporter Company <span class="required">*</span></label>
              <input type="text" id="new-shp-transporter" class="form-control" value="Gati KWE Express Logistics" required>
            </div>
            <div class="form-group">
              <label class="form-label">Vehicle Registration # <span class="required">*</span></label>
              <input type="text" id="new-shp-vehicle" class="form-control cell-mono" value="MH-12-RN-7712" required>
            </div>
            <div class="form-group">
              <label class="form-label">Driver Name & Mobile (10 Digits)</label>
              <input type="text" id="new-shp-driver" class="form-control" value="Gurpreet Singh (9822133441)" required>
            </div>
            <div class="form-group">
              <label class="form-label">Total Wooden Crates / Pallets</label>
              <input type="number" id="new-shp-boxes" class="form-control" value="8" min="1" required>
            </div>
            <div class="form-group">
              <label class="form-label">Total Gross Weight (KG)</label>
              <input type="number" id="new-shp-weight" class="form-control" value="320" min="1" required>
            </div>
          </div>

          <div style="margin-top:16px; border-top:1px solid var(--border-subtle); padding-top:16px;">
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:10px;">Finished Goods SKU to Dispatch</div>
            <div style="display:grid; grid-template-columns: 3fr 1.5fr 1.5fr; gap:10px;">
              <div>
                <label class="form-label" style="font-size:10px;">Finished Good</label>
                <select id="new-shp-item" class="filter-select" style="width:100%;">
                  ${fgItems.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="form-label" style="font-size:10px;">Dispatch Qty</label>
                <input type="number" id="new-shp-qty" class="form-control" value="8" min="1" required>
              </div>
              <div>
                <label class="form-label" style="font-size:10px;">FG Batch #</label>
                <input type="text" id="new-shp-batch" class="form-control cell-mono" value="LOT-FG-ACT-001" required>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="padding-right:0; padding-bottom:0; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Generate Gate Pass & Dispatch</button>
          </div>
        </form>
      `
    });
  },

  submitNewShipment(e) {
    e.preventDefault();
    const customerId = document.getElementById('new-shp-customer').value;
    const transporter = document.getElementById('new-shp-transporter').value;
    const vehicle = document.getElementById('new-shp-vehicle').value;
    const driver = document.getElementById('new-shp-driver').value;
    const boxes = Number(document.getElementById('new-shp-boxes').value);
    const weight = Number(document.getElementById('new-shp-weight').value);
    const itemId = document.getElementById('new-shp-item').value;
    const qty = Number(document.getElementById('new-shp-qty').value);
    const batch = document.getElementById('new-shp-batch').value;

    const gatePass = `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const shpNumber = `SHP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const eway = `24${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const plantId = document.getElementById('new-shp-plant')?.value || (window.DB.isPlantActive(window.State.currentPlantId) ? window.State.currentPlantId : window.DB.getActivePlants()[0]?.id);

    window.DB.insert('shipments', {
      shipment_number: shpNumber,
      so_id: 'SO-001',
      plant_id: plantId,
      customer_id: customerId,
      transporter: transporter,
      vehicle_no: vehicle,
      driver_name: driver,
      gate_pass_no: gatePass,
      eway_bill_no: eway,
      total_boxes: boxes,
      total_weight_kg: weight,
      status: 'IN_TRANSIT',
      dispatched_at: new Date().toISOString(),
      items: [
        {
          item_id: itemId,
          batch_number: batch,
          dispatched_qty: qty,
          boxes: `CRATE-01 to CRATE-0${boxes}`
        }
      ]
    });

    window.DB.logAudit('CREATE_GATEPASS', 'LOGISTICS', gatePass, `Issued Outbound Gate Pass ${gatePass} for Vehicle ${vehicle}. Dispatched to customer.`);
    window.State.closeModal();
    window.State.showToast(`Gate Pass ${gatePass} issued! Vehicle dispatched.`);
    window.DispatchModule.render(document.getElementById('view-container'));
  }
};
