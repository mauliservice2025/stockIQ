const fs = require('fs');
const path = require('path');

const billingPath = path.resolve('js/modules/billing.js');
let code = fs.readFileSync(billingPath, 'utf8');

// Target showSearchBillModal through renderBillSearchResults
const targetSnippet = `  showSearchBillModal() {
    this.modalBillStatusFilter = 'ALL';
    this.modalBillPaymentFilter = 'ALL';
    this.modalBillSearchTerm = '';

    const allBills = this.getAllBillsForSearch();
    const fullyCount = allBills.filter(b => this.calculateSettlementStatus(b).code === 'FULLY_SETTLED').length;
    const partialCount = allBills.filter(b => this.calculateSettlementStatus(b).code === 'PARTIALLY_SETTLED').length;
    const pendingCount = allBills.filter(b => this.calculateSettlementStatus(b).code === 'PENDING').length;
    const cancelledCount = allBills.filter(b => b.status === 'CANCELLED').length;

    const initialResultsHtml = this.renderBillSearchResults(allBills, '');

    const contentHtml = \`
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- INTERACTIVE CATEGORY TABS & SEARCH CONTROLS (EXACTLY MATCHING SCREENSHOT) -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; background: rgba(0,0,0,0.15); padding: 10px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          
          <!-- Category Tabs (All / Fully Settled / Partially Settled / Pending) -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            <button 
              type="button" 
              id="modal-status-all"
              class="btn btn-sm btn-primary" 
              style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border-radius: 999px;"
              onclick="window.BillingModule.setModalBillStatusFilter('ALL')"
            >
              <span>All</span>
              <span class="badge badge-subtle" style="font-size: 10px; margin-left: 4px;">\${allBills.length}</span>
            </button>
            <button 
              type="button" 
              id="modal-status-fully"
              class="btn btn-sm btn-ghost" 
              style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border-radius: 999px; color: #10b981;"
              onclick="window.BillingModule.setModalBillStatusFilter('FULLY_SETTLED')"
            >
              <span>✓ Fully Settled</span>
              <span class="badge badge-subtle" style="font-size: 10px; margin-left: 4px;">\${fullyCount}</span>
            </button>
            <button 
              type="button" 
              id="modal-status-partially"
              class="btn btn-sm btn-ghost" 
              style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border-radius: 999px; color: #f59e0b;"
              onclick="window.BillingModule.setModalBillStatusFilter('PARTIALLY_SETTLED')"
            >
              <span>⏳ Partially Settled</span>
              <span class="badge badge-subtle" style="font-size: 10px; margin-left: 4px;">\${partialCount}</span>
            </button>
            <button 
              type="button" 
              id="modal-status-pending"
              class="btn btn-sm btn-ghost" 
              style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border-radius: 999px; color: #ef4444;"
              onclick="window.BillingModule.setModalBillStatusFilter('PENDING')"
            >
              <span>⚠️ Pending</span>
              <span class="badge badge-subtle" style="font-size: 10px; margin-left: 4px;">\${pendingCount}</span>
            </button>
            \${cancelledCount > 0 ? \`
              <button 
                type="button" 
                id="modal-status-cancelled"
                class="btn btn-sm btn-ghost" 
                style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border-radius: 999px;"
                onclick="window.BillingModule.setModalBillStatusFilter('CANCELLED')"
              >
                <span>✕ Cancelled</span>
                <span class="badge badge-subtle" style="font-size: 10px; margin-left: 4px;">\${cancelledCount}</span>
              </button>
            \` : ''}
          </div>

          <!-- Search & Payment Mode Filters -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <!-- Payment Mode Filter -->
            <select 
              id="modal-bill-pay-filter"
              class="form-control form-control-sm" 
              style="width: auto; min-width: 130px; font-size: 11.5px;" 
              onchange="window.BillingModule.setModalBillPaymentFilter(this.value)"
            >
              <option value="ALL">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI (GPay/PhonePe)</option>
              <option value="Card">Card (POS)</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="MIXED">Mixed Payment</option>
            </select>

            <!-- Search Input (Matching Screenshot Placeholder) -->
            <div style="position: relative; min-width: 240px; max-width: 320px;">
              <span style="position: absolute; left: 9px; top: 50%; transform: translateY(-50%); font-size: 11px; color: var(--text-muted); pointer-events: none;">🔍</span>
              <input 
                type="text" 
                id="modal-bill-search-input"
                class="form-control form-control-sm" 
                placeholder="Search Bill, Customer, Reg, J" 
                style="padding-left: 28px; padding-right: 28px; font-size: 11.5px;"
                oninput="window.BillingModule.handleModalBillSearch(this.value)"
                onkeydown="if(event.key === 'Enter'){ window.BillingModule.handleModalBillSearch(this.value); }"
              />
              <button 
                type="button" 
                id="modal-bill-clear-btn"
                onclick="const el = document.getElementById('modal-bill-search-input'); if(el){ el.value=''; el.focus(); window.BillingModule.handleModalBillSearch(''); }" 
                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 11px; display: none;" 
                title="Clear search"
              >✕</button>
            </div>
          </div>
        </div>

        <!-- Results Table Container with Horizontal Scroll -->
        <div id="bill-search-results-panel" style="max-height: 480px; overflow-y: auto; overflow-x: auto; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: rgba(0,0,0,0.1);">
          \${initialResultsHtml}
        </div>

        <!-- Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid var(--border-subtle);">
          <span id="bill-search-status-label" style="font-size: 11.5px; color: var(--text-muted);">
            Showing \${allBills.length} total bill records
          </span>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.State.closeModal()">Close</button>
        </div>
      </div>
    \`;

    window.State.showModal({ title: '🔍 Search bill', contentHtml, maxWidth: '96vw' });

    setTimeout(() => {
      if (typeof document !== 'undefined') {
        const input = document.getElementById('modal-bill-search-input');
        if (input) {
          input.focus();
        }
      }
    }, 150);
  },`;

if (!code.includes(targetSnippet)) {
  console.error('Could not find targetSnippet for showSearchBillModal');
  process.exit(1);
}

const replacementSnippet = `  showSearchBillModal() {
    this.modalBillStatusFilter = 'ALL';
    this.modalBillPaymentFilter = 'ALL';
    this.modalBillSearchTerm = '';
    this.modalBillViewMode = this.modalBillViewMode || 'FIT_SCREEN';

    const allBills = this.getAllBillsForSearch();
    const fullyCount = allBills.filter(b => this.calculateSettlementStatus(b).code === 'FULLY_SETTLED').length;
    const partialCount = allBills.filter(b => this.calculateSettlementStatus(b).code === 'PARTIALLY_SETTLED').length;
    const pendingCount = allBills.filter(b => this.calculateSettlementStatus(b).code === 'PENDING').length;
    const cancelledCount = allBills.filter(b => b.status === 'CANCELLED').length;

    const initialResultsHtml = this.renderBillSearchResults(allBills, '');

    const contentHtml = \`
      <!-- ZERO-WASTE CONTAINER: REMOVES TOP DEAD SPACE PER USER REQUEST -->
      <div style="display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0;">
        
        <!-- COMPACT FILTER & SEARCH STRIP -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; background: rgba(0,0,0,0.18); padding: 5px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin: 0;">
          
          <!-- Category Tabs (All / Fully Settled / Partially Settled / Pending) -->
          <div style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
            <button 
              type="button" 
              id="modal-status-all"
              class="btn btn-sm btn-primary" 
              style="padding: 3px 9px; font-size: 11px; font-weight: 600; border-radius: 999px;"
              onclick="window.BillingModule.setModalBillStatusFilter('ALL')"
            >
              <span>All</span>
              <span class="badge badge-subtle" style="font-size: 9.5px; margin-left: 3px;">\${allBills.length}</span>
            </button>
            <button 
              type="button" 
              id="modal-status-fully"
              class="btn btn-sm btn-ghost" 
              style="padding: 3px 9px; font-size: 11px; font-weight: 600; border-radius: 999px; color: #10b981;"
              onclick="window.BillingModule.setModalBillStatusFilter('FULLY_SETTLED')"
            >
              <span>✓ Fully Settled</span>
              <span class="badge badge-subtle" style="font-size: 9.5px; margin-left: 3px;">\${fullyCount}</span>
            </button>
            <button 
              type="button" 
              id="modal-status-partially"
              class="btn btn-sm btn-ghost" 
              style="padding: 3px 9px; font-size: 11px; font-weight: 600; border-radius: 999px; color: #f59e0b;"
              onclick="window.BillingModule.setModalBillStatusFilter('PARTIALLY_SETTLED')"
            >
              <span>⏳ Partially Settled</span>
              <span class="badge badge-subtle" style="font-size: 9.5px; margin-left: 3px;">\${partialCount}</span>
            </button>
            <button 
              type="button" 
              id="modal-status-pending"
              class="btn btn-sm btn-ghost" 
              style="padding: 3px 9px; font-size: 11px; font-weight: 600; border-radius: 999px; color: #ef4444;"
              onclick="window.BillingModule.setModalBillStatusFilter('PENDING')"
            >
              <span>⚠️ Pending</span>
              <span class="badge badge-subtle" style="font-size: 9.5px; margin-left: 3px;">\${pendingCount}</span>
            </button>
            \${cancelledCount > 0 ? \`
              <button 
                type="button" 
                id="modal-status-cancelled"
                class="btn btn-sm btn-ghost" 
                style="padding: 3px 9px; font-size: 11px; font-weight: 600; border-radius: 999px;"
                onclick="window.BillingModule.setModalBillStatusFilter('CANCELLED')"
              >
                <span>✕ Cancelled</span>
                <span class="badge badge-subtle" style="font-size: 9.5px; margin-left: 3px;">\${cancelledCount}</span>
              </button>
            \` : ''}
          </div>

          <!-- Controls: Mode Filter, Search Bar, View Mode Toggle -->
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            
            <!-- View Mode Switcher (Fit Screen to avoid scroll vs 17 Cols) -->
            <div style="display: inline-flex; border: 1px solid var(--border-medium); border-radius: var(--radius-sm); overflow: hidden; background: rgba(0,0,0,0.2);">
              <button 
                type="button" 
                id="btn-view-fit"
                class="btn btn-sm \${this.modalBillViewMode !== 'EXPANDED' ? 'btn-primary' : 'btn-ghost'}" 
                style="padding: 2px 7px; font-size: 10.5px; border-radius: 0; display: inline-flex; align-items: center; gap: 3px;"
                onclick="window.BillingModule.setModalBillViewMode('FIT_SCREEN')"
                title="Fit all columns on screen with zero horizontal scroll"
              >
                <span>⚡ Fit Screen</span>
              </button>
              <button 
                type="button" 
                id="btn-view-expanded"
                class="btn btn-sm \${this.modalBillViewMode === 'EXPANDED' ? 'btn-primary' : 'btn-ghost'}" 
                style="padding: 2px 7px; font-size: 10.5px; border-radius: 0; display: inline-flex; align-items: center; gap: 3px;"
                onclick="window.BillingModule.setModalBillViewMode('EXPANDED')"
                title="View all 17 separate columns"
              >
                <span>📑 17 Cols</span>
              </button>
            </div>

            <!-- Payment Mode Filter -->
            <select 
              id="modal-bill-pay-filter"
              class="form-control form-control-sm" 
              style="width: auto; min-width: 115px; font-size: 11px; padding: 2px 6px; height: 26px;" 
              onchange="window.BillingModule.setModalBillPaymentFilter(this.value)"
            >
              <option value="ALL">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI (GPay/PhonePe)</option>
              <option value="Card">Card (POS)</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="MIXED">Mixed Payment</option>
            </select>

            <!-- Search Input (Matching Screenshot Placeholder) -->
            <div style="position: relative; min-width: 220px; max-width: 280px;">
              <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 11px; color: var(--text-muted); pointer-events: none;">🔍</span>
              <input 
                type="text" 
                id="modal-bill-search-input"
                class="form-control form-control-sm" 
                placeholder="Search Bill, Customer, Reg, J" 
                style="padding-left: 26px; padding-right: 24px; font-size: 11px; height: 26px;"
                value="\${this.modalBillSearchTerm || ''}"
                oninput="window.BillingModule.handleModalBillSearch(this.value)"
                onkeydown="if(event.key === 'Enter'){ window.BillingModule.handleModalBillSearch(this.value); }"
              />
              <button 
                type="button" 
                id="modal-bill-clear-btn"
                onclick="const el = document.getElementById('modal-bill-search-input'); if(el){ el.value=''; el.focus(); window.BillingModule.handleModalBillSearch(''); }" 
                style="position: absolute; right: 7px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 11px; display: \${this.modalBillSearchTerm ? 'block' : 'none'};" 
                title="Clear search"
              >✕</button>
            </div>
          </div>
        </div>

        <!-- Results Table Container with Optimized Screen Fit -->
        <div id="bill-search-results-panel" style="max-height: 520px; overflow-y: auto; overflow-x: auto; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: rgba(0,0,0,0.12); margin: 0;">
          \${initialResultsHtml}
        </div>

        <!-- Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px; border-top: 1px solid var(--border-subtle); margin: 0;">
          <span id="bill-search-status-label" style="font-size: 11px; color: var(--text-muted);">
            Showing \${allBills.length} total bill records
          </span>
          <button type="button" class="btn btn-secondary btn-sm" style="padding: 2px 10px; font-size: 11.5px;" onclick="window.State.closeModal()">Close</button>
        </div>
      </div>
    \`;

    // Open modal with tightened padding to remove top empty space
    window.State.showModal({ 
      title: '🔍 Search bill', 
      contentHtml, 
      maxWidth: '98vw',
      bodyPadding: '4px 10px 8px 10px',
      compactHeader: true
    });

    setTimeout(() => {
      if (typeof document !== 'undefined') {
        const container = document.getElementById('global-modal-container');
        if (container) {
          const header = container.querySelector('.modal-header');
          if (header) {
            header.style.padding = '8px 14px';
            header.style.minHeight = 'auto';
            header.style.marginBottom = '0';
          }
        }
        const body = document.getElementById('global-modal-body');
        if (body) {
          body.style.padding = '4px 10px 8px 10px';
        }
        const input = document.getElementById('modal-bill-search-input');
        if (input) {
          input.focus();
        }
      }
    }, 40);
  },

  setModalBillViewMode(mode) {
    this.modalBillViewMode = mode;
    this.updateModalBillResults();
  },`;

code = code.replace(targetSnippet, replacementSnippet);
console.log('✓ showSearchBillModal & setModalBillViewMode updated');

// Now update renderBillSearchResults to support FIT_SCREEN (All columns visible on screen without scroll)
// and EXPANDED (17 separate columns)
const renderSearchTarget = `  renderBillSearchResults(bills, query) {
    if (!bills || bills.length === 0) {
      return \`
        <div style="text-align: center; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <div style="font-size: 36px;">🔍</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">No bills found matching "\${query}"</div>
          <div style="font-size: 12px; color: var(--text-muted); max-width: 440px;">
            Please check the entered Job Card No, Bill No, Draft Bill No, or CIN No and try again.
          </div>
        </div>
      \`;
    }

    return \`
      <div class="table-responsive" style="margin: 0; overflow-x: auto;">
        <table class="data-table" style="width: 100%; min-width: 1540px; font-size: 12px; margin: 0;">`;

if (!code.includes(renderSearchTarget)) {
  console.error('Could not find renderSearchTarget');
  process.exit(1);
}

// Find where renderBillSearchResults ends (up to loadSearchedBill)
const renderSearchEndTarget = `  loadSearchedBill(billId) {`;
const idxStart = code.indexOf(`  renderBillSearchResults(bills, query) {`);
const idxEnd = code.indexOf(renderSearchEndTarget, idxStart);

if (idxStart === -1 || idxEnd === -1) {
  console.error('Could not find boundary for renderBillSearchResults');
  process.exit(1);
}

const newRenderBillSearchResults = `  renderBillSearchResults(bills, query) {
    if (!bills || bills.length === 0) {
      return \`
        <div style="text-align: center; padding: 36px 20px; display: flex; flex-direction: column; align-items: center; gap: 6px;">
          <div style="font-size: 32px;">🔍</div>
          <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">No bills found matching "\${query}"</div>
          <div style="font-size: 11.5px; color: var(--text-muted); max-width: 440px;">
            Please check the entered Job Card No, Bill No, Draft Bill No, or CIN No and try again.
          </div>
        </div>
      \`;
    }

    const viewMode = this.modalBillViewMode || 'FIT_SCREEN';

    // 1. FIT_SCREEN MODE: MANAGE MAXIMUM COLUMNS ON SCREEN SIDE, TO AVOID SCROLL AT LAST
    if (viewMode === 'FIT_SCREEN') {
      return \`
        <div class="table-responsive" style="margin: 0; overflow-x: auto; width: 100%;">
          <table class="data-table" style="width: 100%; font-size: 11px; margin: 0; border-collapse: collapse; table-layout: auto;">
            <thead>
              <tr style="background: rgba(255,255,255,0.04); border-bottom: 1.5px solid var(--border-medium);">
                <th style="width: 28px; text-align: center; padding: 6px 4px;">SR</th>
                <th style="min-width: 115px; padding: 6px 6px;">BILL NO / DATE</th>
                <th style="min-width: 105px; padding: 6px 6px;">JOB CARD / EST</th>
                <th style="min-width: 125px; padding: 6px 6px;">CUSTOMER / CIN</th>
                <th style="min-width: 85px; padding: 6px 6px;">VEHICLE</th>
                <th class="text-right" style="min-width: 72px; padding: 6px 5px;">BILL AMT</th>
                <th class="text-right" style="min-width: 55px; padding: 6px 5px;">DISC</th>
                <th class="text-right" style="min-width: 58px; padding: 6px 5px;">TAX</th>
                <th class="text-right" style="min-width: 78px; padding: 6px 5px;">NET BILL</th>
                <th class="text-right" style="min-width: 72px; padding: 6px 5px;">PAID</th>
                <th class="text-right" style="min-width: 72px; padding: 6px 5px;">BALANCE</th>
                <th class="text-center" style="min-width: 90px; padding: 6px 5px;">STATUS</th>
                <th style="min-width: 65px; padding: 6px 5px;">MODE</th>
                <th class="text-right" style="min-width: 115px; padding: 6px 6px;">ACTION</th>
              </tr>
            </thead>
            <tbody>
              \${bills.map((b, idx) => {
                const settlement = this.calculateSettlementStatus(b);
                const isOfficial = (b.recordType === 'FINAL' && b.invoice_no && b.invoice_no !== '--');
                const displayNo = isOfficial ? b.invoice_no : (b.draft_bill_no || b.id);
                const billDate = this.formatBillDate ? this.formatBillDate(b.date) : b.date;

                return \`
                  <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.15s;">
                    <td style="text-align: center; color: var(--text-muted); font-size: 10.5px; padding: 5px 3px;">\${idx + 1}</td>
                    
                    <!-- 1. Bill Number & Date Stacked -->
                    <td style="padding: 5px 6px;">
                      <div style="display: flex; align-items: center; gap: 4px; flex-wrap: nowrap;">
                        <span class="cell-mono cell-strong" style="color: \${isOfficial ? 'var(--primary-300)' : '#a78bfa'}; font-weight: 700; font-size: 11px;">\${displayNo}</span>
                        <span class="badge \${isOfficial ? 'badge-success' : 'badge-warning'}" style="font-size: 8px; padding: 1px 4px; line-height: 1.1;">
                          \${isOfficial ? 'Bill' : 'Draft'}
                        </span>
                      </div>
                      <div style="font-size: 10px; color: var(--text-muted); margin-top: 1px;">\${billDate}</div>
                    </td>

                    <!-- 2. Job Card & Estimate Stacked -->
                    <td style="padding: 5px 6px;">
                      <div class="cell-mono font-bold" style="font-size: 11px; color: var(--text-primary);">\${b.job_card_no}</div>
                      <div class="cell-mono" style="font-size: 9.5px; color: var(--text-muted); margin-top: 1px;">Est: \${b.estimate_no}</div>
                    </td>

                    <!-- 3. Customer & CIN Stacked -->
                    <td style="padding: 5px 6px;">
                      <div style="font-weight: 700; font-size: 11.5px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">\${b.customer_name}</div>
                      <div style="font-size: 9.5px; color: #a78bfa; font-family: monospace; white-space: nowrap;">
                        \${b.customer_cin} \${b.customer_mobile ? \`&bull; \${b.customer_mobile}\` : ''}
                      </div>
                    </td>

                    <!-- 4. Vehicle -->
                    <td style="padding: 5px 6px;">
                      <span class="cell-mono cell-strong" style="font-weight: 700; font-size: 11px; color: var(--text-primary); white-space: nowrap;">\${b.vehicle_reg_no}</span>
                      \${b.vehicle_model ? \`<div style="font-size: 9.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 85px;">\${b.vehicle_model}</div>\` : ''}
                    </td>

                    <!-- 5. Financial Columns (Compact & Clear) -->
                    <td class="text-right" style="padding: 5px 5px;">
                      <span class="cell-mono" style="font-size: 11px;">₹\${b.gross_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td class="text-right" style="padding: 5px 5px;">
                      <span class="cell-mono" style="color: var(--text-muted); font-size: 10.5px;">₹\${b.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td class="text-right" style="padding: 5px 5px;">
                      <span class="cell-mono" style="color: var(--text-muted); font-size: 10.5px;">₹\${b.total_tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td class="text-right" style="padding: 5px 5px;">
                      <span class="cell-mono font-bold" style="font-size: 11.5px; font-weight: 700; color: var(--text-primary);">₹\${b.net_payable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td class="text-right" style="padding: 5px 5px;">
                      <span class="cell-mono font-bold" style="font-size: 11.5px; font-weight: 700; color: #10b981;">₹\${b.amount_paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td class="text-right" style="padding: 5px 5px;">
                      <span class="cell-mono font-bold" style="font-size: 11.5px; font-weight: 700; color: \${b.balance_amount > 0 ? '#ef4444' : 'var(--text-muted)'};">₹\${b.balance_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>

                    <!-- 6. Status & Mode -->
                    <td class="text-center" style="padding: 5px 4px;">
                      <span class="badge \${settlement.badgeClass}" style="font-size: 9.5px; font-weight: 700; padding: 2px 6px; white-space: nowrap;">
                        \${settlement.label}
                      </span>
                    </td>
                    <td style="padding: 5px 5px;">
                      <span style="font-size: 10.5px; color: var(--text-secondary); white-space: nowrap;">\${b.payment_mode}</span>
                    </td>

                    <!-- 7. Action Strip (Compact Inline Buttons) -->
                    <td class="text-right" style="padding: 5px 6px; white-space: nowrap;">
                      <div style="display: inline-flex; gap: 3px; justify-content: flex-end; align-items: center;">
                        <button 
                          type="button" 
                          class="btn btn-primary btn-sm" 
                          style="font-size: 10px; font-weight: 700; padding: 2px 6px;"
                          onclick="window.BillingModule.loadSearchedBill('\${b.id}')"
                          title="Open this bill in Customer Billing Workspace"
                        >
                          Open &rarr;
                        </button>
                        <button 
                          type="button" 
                          class="btn btn-ghost btn-sm" 
                          style="font-size: 10.5px; padding: 2px 5px;"
                          onclick="window.BillingModule.viewBillDetails('\${b.id}')"
                          title="View full bill details"
                        >
                          👁️
                        </button>
                        \${(b.balance_amount > 0 && b.status !== 'CANCELLED') ? \`
                          <button 
                            type="button" 
                            class="btn btn-primary btn-sm" 
                            style="font-size: 10px; font-weight: 700; padding: 2px 6px; background: #3b82f6;"
                            onclick="window.BillingModule.showPaymentModal('\${b.id}')"
                            title="Receive Payment"
                          >
                            💳 Pay
                          </button>
                        \` : ''}
                        <button 
                          type="button" 
                          class="btn btn-ghost btn-sm" 
                          style="font-size: 10.5px; padding: 2px 5px;"
                          onclick="window.BillingModule.printInvoice('\${b.id}')"
                          title="Print Tax Invoice"
                        >
                          🖨️
                        </button>
                        \${(b.amount_paid > 0) ? \`
                          <button 
                            type="button" 
                            class="btn btn-ghost btn-sm" 
                            style="font-size: 10.5px; padding: 2px 5px; color: #10b981;"
                            onclick="window.BillingModule.showBillReceiptsModal('\${b.id}')"
                            title="View & Print Payment Receipts"
                          >
                            🧾
                          </button>
                        \` : ''}
                      </div>
                    </td>
                  </tr>
                \`;
              }).join('')}
            </tbody>
          </table>
        </div>
      \`;
    }

    // 2. EXPANDED MODE: FULL 17 SEPARATE COLUMNS WITH COMPACT PADDING
    return \`
      <div class="table-responsive" style="margin: 0; overflow-x: auto; width: 100%;">
        <table class="data-table" style="width: 100%; font-size: 11px; margin: 0; border-collapse: collapse;">
          <thead>
            <tr style="background: rgba(255,255,255,0.04); border-bottom: 1.5px solid var(--border-medium);">
              <th style="width: 28px; text-align: center; padding: 6px 3px;">SR</th>
              <th style="padding: 6px 6px;">BILL NUMBER</th>
              <th style="padding: 6px 5px;">BILL DATE</th>
              <th style="padding: 6px 5px;">JOB CARD NO.</th>
              <th style="padding: 6px 5px;">ESTIMATE NO.</th>
              <th style="padding: 6px 5px;">CIN</th>
              <th style="padding: 6px 6px;">CUSTOMER NAME</th>
              <th style="padding: 6px 5px;">VEHICLE NUMBER</th>
              <th class="text-right" style="padding: 6px 5px;">BILL AMOUNT</th>
              <th class="text-right" style="padding: 6px 4px;">DISCOUNT</th>
              <th class="text-right" style="padding: 6px 4px;">TAX AMOUNT</th>
              <th class="text-right" style="padding: 6px 5px;">NET BILL AMOUNT</th>
              <th class="text-right" style="padding: 6px 5px;">PAID AMOUNT</th>
              <th class="text-right" style="padding: 6px 5px;">BALANCE AMOUNT</th>
              <th class="text-center" style="padding: 6px 4px;">SETTLEMENT STATUS</th>
              <th style="padding: 6px 5px;">PAYMENT MODE</th>
              <th class="text-right" style="padding: 6px 6px;">ACTION</th>
            </tr>
          </thead>
          <tbody>
            \${bills.map((b, idx) => {
              const settlement = this.calculateSettlementStatus(b);
              const isOfficial = (b.recordType === 'FINAL' && b.invoice_no && b.invoice_no !== '--');
              const displayNo = isOfficial ? b.invoice_no : (b.draft_bill_no || b.id);
              const billDate = this.formatBillDate ? this.formatBillDate(b.date) : b.date;

              return \`
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="text-align: center; color: var(--text-muted); font-size: 10.5px; padding: 5px 3px;">\${idx + 1}</td>
                  <td style="padding: 5px 6px;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <span class="cell-mono cell-strong" style="color: \${isOfficial ? 'var(--primary-300)' : '#a78bfa'}; font-weight: 700;">\${displayNo}</span>
                      <span class="badge \${isOfficial ? 'badge-success' : 'badge-warning'}" style="font-size: 8.5px; padding: 1px 4px;">
                        \${isOfficial ? 'Bill' : 'Draft'}
                      </span>
                    </div>
                  </td>
                  <td style="padding: 5px 5px; white-space: nowrap; font-size: 11px;">\${billDate}</td>
                  <td style="padding: 5px 5px;"><span class="cell-mono" style="font-size: 11px; font-weight: 600;">\${b.job_card_no}</span></td>
                  <td style="padding: 5px 5px;"><span class="cell-mono" style="font-size: 10.5px; color: var(--text-muted);">\${b.estimate_no}</span></td>
                  <td style="padding: 5px 5px;"><span class="cell-mono" style="font-size: 11px; font-weight: 600; color: #a78bfa;">\${b.customer_cin}</span></td>
                  <td style="padding: 5px 6px;">
                    <div style="font-weight: 700; font-size: 11.5px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">\${b.customer_name}</div>
                  </td>
                  <td style="padding: 5px 5px;"><span class="cell-mono cell-strong" style="font-weight: 700; font-size: 11px;">\${b.vehicle_reg_no}</span></td>
                  <td class="text-right" style="padding: 5px 5px;"><span class="cell-mono">₹\${b.gross_amount.toFixed(2)}</span></td>
                  <td class="text-right" style="padding: 5px 4px;"><span class="cell-mono" style="color: var(--text-muted);">₹\${b.discount_amount.toFixed(2)}</span></td>
                  <td class="text-right" style="padding: 5px 4px;"><span class="cell-mono" style="color: var(--text-muted);">₹\${b.total_tax.toFixed(2)}</span></td>
                  <td class="text-right" style="padding: 5px 5px;"><span class="cell-mono font-bold" style="font-weight: 700; color: var(--text-primary);">₹\${b.net_payable.toFixed(2)}</span></td>
                  <td class="text-right" style="padding: 5px 5px;"><span class="cell-mono font-bold" style="font-weight: 700; color: #10b981;">₹\${b.amount_paid.toFixed(2)}</span></td>
                  <td class="text-right" style="padding: 5px 5px;"><span class="cell-mono font-bold" style="font-weight: 700; color: \${b.balance_amount > 0 ? '#ef4444' : 'var(--text-muted)'};">₹\${b.balance_amount.toFixed(2)}</span></td>
                  <td class="text-center" style="padding: 5px 4px;">
                    <span class="badge \${settlement.badgeClass}" style="font-size: 9.5px; font-weight: 700; padding: 2px 6px; white-space: nowrap;">
                      \${settlement.label}
                    </span>
                  </td>
                  <td style="padding: 5px 5px;"><span style="font-size: 10.5px; color: var(--text-secondary); white-space: nowrap;">\${b.payment_mode}</span></td>
                  <td class="text-right" style="padding: 5px 6px; white-space: nowrap;">
                    <div style="display: inline-flex; gap: 3px; justify-content: flex-end; align-items: center;">
                      <button type="button" class="btn btn-primary btn-sm" style="font-size: 10px; font-weight: 700; padding: 2px 6px;" onclick="window.BillingModule.loadSearchedBill('\${b.id}')">Open &rarr;</button>
                      <button type="button" class="btn btn-ghost btn-sm" style="font-size: 10.5px; padding: 2px 5px;" onclick="window.BillingModule.viewBillDetails('\${b.id}')">👁️</button>
                      \${(b.balance_amount > 0 && b.status !== 'CANCELLED') ? \`
                        <button type="button" class="btn btn-primary btn-sm" style="font-size: 10px; font-weight: 700; padding: 2px 6px; background: #3b82f6;" onclick="window.BillingModule.showPaymentModal('\${b.id}')">💳 Pay</button>
                      \` : ''}
                      <button type="button" class="btn btn-ghost btn-sm" style="font-size: 10.5px; padding: 2px 5px;" onclick="window.BillingModule.printInvoice('\${b.id}')">🖨️</button>
                      \${(b.amount_paid > 0) ? \`
                        <button type="button" class="btn btn-ghost btn-sm" style="font-size: 10.5px; padding: 2px 5px; color: #10b981;" onclick="window.BillingModule.showBillReceiptsModal('\${b.id}')" title="Receipt">🧾</button>
                      \` : ''}
                    </div>
                  </td>
                </tr>
              \`;
            }).join('')}
          </tbody>
        </table>
      </div>
    \`;
  },
`;

code = code.slice(0, idxStart) + newRenderBillSearchResults + '\n' + code.slice(idxEnd);

fs.writeFileSync(billingPath, code, 'utf8');
console.log('✅ js/modules/billing.js updated with space removal and screen-fit column layout!');
