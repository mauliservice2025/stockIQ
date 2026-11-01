/* ==========================================================================
   ENTERPRISE ISCM - SECURITY & IMMUTABLE AUDIT TRAIL (SECTION 21 BRD)
   Full Compliance Audit Logs, User Session Events, IP & State Diff
   ========================================================================== */

window.AuditModule = {
  render(container) {
    const logs = window.DB.getAll('auditLogs');

    container.innerHTML = `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            System Security & Immutable Transaction Audit Trail
          </div>
          <span class="status-pill status-approved">21 CFR Part 11 / SOX Compliant</span>
        </div>

        <div class="toolbar">
          <div class="toolbar-left">
            <input type="text" id="audit-search" class="filter-input" placeholder="Search user, action, record ID, IP..." oninput="window.AuditModule.filterTable()">
            <select id="audit-module-filter" class="filter-select" onchange="window.AuditModule.filterTable()">
              <option value="ALL">All Modules</option>
              <option value="PROCUREMENT">Procurement & Orders</option>
              <option value="INWARD">Inward & GRN</option>
              <option value="QUALITY">Quality Inspection</option>
              <option value="WAREHOUSE">Warehouse & Putaway</option>
              <option value="INVENTORY">Inventory & Stock</option>
              <option value="PRODUCTION">Manufacturing & BOM</option>
              <option value="LOGISTICS">Sales & Dispatch</option>
              <option value="STOCK_TRANSFER">Stock Transfers</option>
              <option value="REVERSE_LOGISTICS">Returns</option>
            </select>
          </div>
          <div class="toolbar-right">
            <span style="font-size:12px; color:var(--text-muted);">Audited Log Entries: <b>${logs.length}</b></span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="audit-table">
            <thead>
              <tr>
                <th>Timestamp (IST)</th>
                <th>Operator / User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Module</th>
                <th>Target Reference</th>
                <th>Client IP</th>
                <th>Transaction Details</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `
                <tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No audit logs captured.</td></tr>
              ` : logs.map(l => `
                <tr data-module="${l.module}" data-search="${(l.user + ' ' + l.action + ' ' + l.module + ' ' + l.record_id + ' ' + (l.ip || '') + ' ' + l.details).toLowerCase()}">
                  <td class="cell-mono">${window.formatDateTime(l.timestamp)}</td>
                  <td class="cell-strong">${l.user}</td>
                  <td style="font-size:11px; color:var(--text-muted);">${l.role || 'Staff'}</td>
                  <td>
                    <span class="status-pill ${
                      l.action.includes('APPROVE') ? 'status-approved' :
                      l.action.includes('REJECT') ? 'status-rejected' :
                      l.action.includes('DISPATCH') ? 'status-in-transit' : 'status-draft'
                    }">
                      ${l.action}
                    </span>
                  </td>
                  <td><span class="cell-mono">${l.module}</span></td>
                  <td class="cell-mono" style="color:var(--primary-300);">${l.record_id}</td>
                  <td class="cell-mono" style="color:var(--text-muted); font-size:11px;">${l.ip || '127.0.0.1'}</td>
                  <td style="max-width:380px; color:var(--text-secondary); font-size:12px;">${l.details}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  filterTable() {
    const search = (document.getElementById('audit-search')?.value || '').toLowerCase();
    const moduleFilter = document.getElementById('audit-module-filter')?.value || 'ALL';
    const rows = document.querySelectorAll('#audit-table tbody tr');

    rows.forEach(row => {
      const mod = row.getAttribute('data-module');
      const text = row.getAttribute('data-search') || '';
      const matchSearch = text.includes(search);
      const matchModule = moduleFilter === 'ALL' || mod === moduleFilter;
      row.style.display = matchSearch && matchModule ? '' : 'none';
    });
  }
};
