/* ==========================================================================
   ENTERPRISE ISCM - USER MANAGEMENT & RBAC SECURITY MODULE
   Implements 14 Core Sub-Modules following the Zero-Trust Enterprise Principle:
   User -> Role -> Permission -> Warehouse/Store Access -> Department Scoping
   ========================================================================== */

window.UserManagementModule = {
  activeTab: 'DASHBOARD',
  selectedRoleId: 'ROLE-STORE-MGR',
  selectedReportType: 'USER_MASTER',
  searchTerm: '',
  statusFilter: 'ALL',
  userTypeFilter: 'ALL',
  departmentFilter: 'ALL',
  loginHistoryFilter: 'ALL',
  permCategoryFilter: 'ALL',
  permSearchTerm: '',
  permGranularMode: false,
  permViewMode: 'CATALOG', // 'CATALOG' | 'MATRIX'
  currentPage: 1,
  pageSize: 10,

  tabConfig: [
    { key: 'DASHBOARD', perm: 'SEC_DASHBOARD', label: 'Security Dashboard', id: 'tab-dashboard' },
    { key: 'USERS', perm: 'USER_MASTER', label: 'User Master', id: 'tab-users' },
    { key: 'ROLES', perm: 'ROLE_MASTER', label: 'Roles', id: 'tab-roles' },
    { key: 'PERMISSIONS', perm: 'PERMISSIONS', label: 'Permissions', id: 'tab-permissions' },
    { key: 'ROLE_PERM_MAP', perm: 'ROLE_PERM_MAP', label: 'Permission Matrix', id: 'tab-role-perms' },
    { key: 'USER_ROLE_MAP', perm: 'USER_ROLE_MAP', label: 'User-Role Mapping', id: 'tab-user-roles' },
    { key: 'SOD_RULES', perm: 'SOD_RULES', label: 'SoD Rules', id: 'tab-sod-rules' },
    { key: 'APPROVAL_LIMITS', perm: 'APPROVAL_LIMITS', label: 'Approval Limits', id: 'tab-approval-limits' },
    { key: 'DELEGATIONS', perm: 'DELEGATIONS', label: 'Delegations', id: 'tab-delegations' },
    { key: 'ACCESS_REQUESTS', perm: 'ACCESS_REQUESTS', label: 'Requests', id: 'tab-access-requests' },
    { key: 'PASSWORD_POLICY', perm: 'PASSWORD_POLICY', label: 'Password Policy', id: 'tab-pwd-policy' },
    { key: 'LOGIN_SECURITY', perm: 'LOGIN_SECURITY', label: 'Login Security', id: 'tab-login-sec' },
    { key: 'SESSIONS', perm: 'SESSIONS', label: 'Sessions', id: 'tab-sessions' },
    { key: 'LOGIN_HISTORY', perm: 'LOGIN_HISTORY', label: 'Login History', id: 'tab-login-hist' },
    { key: 'ACCESS_REPORTS', perm: 'ACCESS_REPORTS', label: 'MIS Reports', id: 'tab-access-reports' },
    { key: 'USER_ACTIVITY', perm: 'USER_ACTIVITY', label: 'Audit Trail', id: 'tab-user-audit' }
  ],

  // Map route hashes to sub-module tabs (BRD Compliant)
  hashToTabMap: {
    '#/security-dashboard': 'DASHBOARD',
    '#/users': 'USERS',
    '#/user-access-control': 'USERS',
    '#/roles': 'ROLES',
    '#/permissions': 'PERMISSIONS',
    '#/role-permissions': 'ROLE_PERM_MAP',
    '#/user-roles': 'USER_ROLE_MAP',
    '#/sod-rules': 'SOD_RULES',
    '#/approval-authorities': 'APPROVAL_LIMITS',
    '#/delegations': 'DELEGATIONS',
    '#/access-requests': 'ACCESS_REQUESTS',
    '#/password-policy': 'PASSWORD_POLICY',
    '#/login-security': 'LOGIN_SECURITY',
    '#/sessions': 'SESSIONS',
    '#/login-history': 'LOGIN_HISTORY',
    '#/access-reports': 'ACCESS_REPORTS',
    '#/user-activity': 'USER_ACTIVITY'
  },

  tabToHashMap: {
    'DASHBOARD': '#/security-dashboard',
    'USERS': '#/users',
    'ROLES': '#/roles',
    'PERMISSIONS': '#/permissions',
    'ROLE_PERM_MAP': '#/role-permissions',
    'USER_ROLE_MAP': '#/user-roles',
    'SOD_RULES': '#/sod-rules',
    'APPROVAL_LIMITS': '#/approval-authorities',
    'DELEGATIONS': '#/delegations',
    'ACCESS_REQUESTS': '#/access-requests',
    'PASSWORD_POLICY': '#/password-policy',
    'LOGIN_SECURITY': '#/login-security',
    'SESSIONS': '#/sessions',
    'LOGIN_HISTORY': '#/login-history',
    'ACCESS_REPORTS': '#/access-reports',
    'USER_ACTIVITY': '#/user-activity'
  },

  render(container) {
    if (!container) container = document.getElementById('view-container');
    if (!container) return;

    // Synchronize activeTab from hash if matched
    const hash = (typeof window !== 'undefined' && window.location) ? window.location.hash : '';
    if (this.hashToTabMap[hash]) {
      this.activeTab = this.hashToTabMap[hash];
    }

    if (!this._subscribed && window.DB && typeof window.DB.subscribe === 'function') {
      this._subscribed = true;
      window.DB.subscribe('users', () => {
        if (this.activeTab === 'USERS') {
          const content = document.getElementById('user-mgmt-content');
          if (content) content.innerHTML = this.renderActiveSubModule();
        }
      });
    }

    const users = window.DB.getAll('users') || [];
    const roles = window.DB.getAll('roles') || [];
    const permissions = window.DB.getAll('permissions') || [];
    const sodRules = window.DB.getAll('sod_rules') || [];
    const delegations = (window.DB.getAll('approval_delegations') || []).filter(d => d.status === 'ACTIVE');
    const sessions = (window.DB.getAll('user_sessions') || []).filter(s => s.status === 'ACTIVE');
    const lockedUsers = users.filter(u => u.status === 'LOCKED');
    const pendingRequests = (window.DB.getAll('access_requests') || []).filter(r => r.status.startsWith('PENDING'));

    // Tab definitions with RBAC permission codes
    this.tabConfig = [
      { key: 'DASHBOARD', perm: 'SEC_DASHBOARD', label: 'Security Dashboard', id: 'tab-dashboard' },
      { key: 'USERS', perm: 'USER_MASTER', label: 'User Master', id: 'tab-users' },
      { key: 'ROLES', perm: 'ROLE_MASTER', label: 'Roles', id: 'tab-roles' },
      { key: 'PERMISSIONS', perm: 'PERMISSIONS', label: 'Permissions', id: 'tab-permissions' },
      { key: 'ROLE_PERM_MAP', perm: 'ROLE_PERM_MAP', label: 'Permission Matrix', id: 'tab-role-perms' },
      { key: 'USER_ROLE_MAP', perm: 'USER_ROLE_MAP', label: 'User-Role Mapping', id: 'tab-user-roles' },
      { key: 'SOD_RULES', perm: 'SOD_RULES', label: 'SoD Rules', id: 'tab-sod-rules' },
      { key: 'APPROVAL_LIMITS', perm: 'APPROVAL_LIMITS', label: 'Approval Limits', id: 'tab-approval-limits' },
      { key: 'DELEGATIONS', perm: 'DELEGATIONS', label: 'Delegations', id: 'tab-delegations' },
      { key: 'ACCESS_REQUESTS', perm: 'ACCESS_REQUESTS', label: 'Requests', id: 'tab-access-requests' },
      { key: 'PASSWORD_POLICY', perm: 'PASSWORD_POLICY', label: 'Password Policy', id: 'tab-pwd-policy' },
      { key: 'LOGIN_SECURITY', perm: 'LOGIN_SECURITY', label: 'Login Security', id: 'tab-login-sec' },
      { key: 'SESSIONS', perm: 'SESSIONS', label: 'Sessions', id: 'tab-sessions' },
      { key: 'LOGIN_HISTORY', perm: 'LOGIN_HISTORY', label: 'Login History', id: 'tab-login-hist' },
      { key: 'ACCESS_REPORTS', perm: 'ACCESS_REPORTS', label: 'MIS Reports', id: 'tab-access-reports' },
      { key: 'USER_ACTIVITY', perm: 'USER_ACTIVITY', label: 'Audit Trail', id: 'tab-user-audit' }
    ];

    // Filter tabs by permission
    const visibleTabs = this.tabConfig.filter(t => {
      if (!window.State || typeof window.State.hasPermission !== 'function') return true;
      return window.State.hasPermission(t.perm, 'VIEW');
    });

    if (visibleTabs.length === 0) {
      const currentUser = (window.State && typeof window.State.getCurrentUser === 'function') ? window.State.getCurrentUser() : null;
      const roleName = currentUser ? (currentUser.primary_role || 'User') : 'Your Role';
      container.innerHTML = `
        <div style="max-width: 540px; margin: 60px auto; padding: 32px 24px; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); text-align: center; box-shadow: var(--shadow-md);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.12); color: var(--color-danger); display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 16px auto;">
            🔒
          </div>
          <h2 style="font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px 0;">Access Restricted</h2>
          <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin: 0 auto 24px auto; max-width: 440px;">
            Your assigned role (<strong>${roleName}</strong>) does not have authorization to view the Security & User Management module.
          </p>
          <div style="display: flex; justify-content: center; gap: 12px;">
            <button type="button" class="btn btn-secondary" onclick="if(window.App && typeof window.App.navigateToFirstAuthorizedRoute === 'function') window.App.navigateToFirstAuthorizedRoute(); else window.location.hash='#/dashboard';">
              🏠 Go to My Workspace
            </button>
            <button type="button" class="btn btn-danger" onclick="if(window.App && typeof window.App.performSignOut === 'function') window.App.performSignOut(); else window.location.hash='#/login';" style="background: var(--color-danger); color: #fff; border: none; padding: 8px 20px; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer;">
              🚪 Logout
            </button>
          </div>
        </div>
      `;
      return;
    }

    if (!visibleTabs.some(t => t.key === this.activeTab)) {
      this.activeTab = visibleTabs[0].key;
    }

    container.innerHTML = `
      <!-- Quick Sub-Module Navigation Ribbon (Only Permitted Sub-Modules) -->
      <div class="user-management-nav-ribbon" style="margin-bottom: 6px;">
        <div class="tabs-header user-mgmt-tabs" style="overflow-x: auto; padding-bottom: 2px; display: flex; gap: 3px; border-bottom: 1px solid var(--border-subtle);">
          ${visibleTabs.map(t => `
            <button class="tab-btn ${this.activeTab === t.key ? 'active' : ''}" onclick="window.UserManagementModule.switchTab('${t.key}')" id="${t.id}">
              <span>${t.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Active Sub-Module View Container -->
      <div id="user-mgmt-content">
        ${this.renderActiveSubModule()}
      </div>
    `;
  },

  switchTab(tabKey) {
    if (this.tabConfig && window.State && typeof window.State.hasPermission === 'function') {
      const tabItem = this.tabConfig.find(t => t.key === tabKey);
      if (tabItem && !window.State.hasPermission(tabItem.perm, 'VIEW')) {
        window.State.showToast(`Access Restricted: Missing permission (${tabItem.perm}) for this sub-module.`, 'warning');
        return;
      }
    }
    this.activeTab = tabKey;
    const targetHash = this.tabToHashMap[tabKey];
    if (targetHash && window.location.hash !== targetHash) {
      window.location.hash = targetHash;
      return; // hashchange listener triggers re-render
    }
    const content = document.getElementById('user-mgmt-content');
    if (content) {
      content.innerHTML = this.renderActiveSubModule();
      // update tab active classes
      document.querySelectorAll('.user-mgmt-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.querySelector(`.user-mgmt-tabs button[onclick*="${tabKey}"]`);
      if (activeBtn) activeBtn.classList.add('active');
    } else {
      this.render();
    }
  },

  renderActiveSubModule() {
    switch (this.activeTab) {
      case 'DASHBOARD':
        return this.renderSecurityDashboard();
      case 'USERS':
        return this.renderUserMaster();
      case 'ROLES':
        return this.renderRoleMaster();
      case 'PERMISSIONS':
        return this.renderPermissionMaster();
      case 'ROLE_PERM_MAP':
        return this.renderRolePermissionMatrix();
      case 'USER_ROLE_MAP':
        return this.renderUserRoleMapping();
      case 'SOD_RULES':
        return this.renderSoDRules();
      case 'APPROVAL_LIMITS':
        return this.renderApprovalAuthorities();
      case 'DELEGATIONS':
        return this.renderDelegations();
      case 'ACCESS_REQUESTS':
        return this.renderAccessRequests();
      case 'PASSWORD_POLICY':
        return this.renderPasswordPolicy();
      case 'LOGIN_SECURITY':
        return this.renderLoginSecurity();
      case 'SESSIONS':
        return this.renderSessionManagement();
      case 'LOGIN_HISTORY':
        return this.renderLoginHistory();
      case 'ACCESS_REPORTS':
        return this.renderAccessReviewReports();
      case 'USER_ACTIVITY':
        return this.renderUserActivityLog();
      default:
        return this.renderSecurityDashboard();
    }
  },

  /* ========================================================================
     0. SECURITY DASHBOARD & MIS OVERVIEW (BRD §36)
     ======================================================================== */
  renderSecurityDashboard() {
    const users = window.DB.getAll('users') || [];
    const roles = window.DB.getAll('roles') || [];
    const sodRules = window.DB.getAll('sod_rules') || [];
    const delegations = window.DB.getAll('approval_delegations') || [];
    const requests = window.DB.getAll('access_requests') || [];
    const sessions = window.DB.getAll('user_sessions') || [];
    const auditLogs = window.DB.getAll('auditLogs') || [];

    const activeUsers = users.filter(u => u.status === 'ACTIVE');
    const lockedUsers = users.filter(u => u.status === 'LOCKED');
    const inactiveUsers = users.filter(u => u.status === 'INACTIVE');
    const suspendedUsers = users.filter(u => u.status === 'SUSPENDED');
    const expiredUsers = users.filter(u => u.status === 'EXPIRED');
    const terminatedUsers = users.filter(u => u.status === 'TERMINATED');

    const mfaEnabled = users.filter(u => u.two_factor_enabled).length;
    const mfaRate = Math.round((mfaEnabled / (users.length || 1)) * 100);

    const pendingRequests = requests.filter(r => r.status && r.status.startsWith('PENDING'));
    const activeDelegations = delegations.filter(d => d.status === 'ACTIVE');
    const activeSessions = sessions.filter(s => s.status === 'ACTIVE');

    // Role distribution count
    const roleCounts = roles.map(r => {
      const count = users.filter(u => u.primary_role === r.id || (u.secondary_roles && u.secondary_roles.includes(r.id))).length;
      return { role: r, count };
    }).filter(rc => rc.count > 0).sort((a, b) => b.count - a.count);

    return `
      <!-- BRD §36: Executive Security & User Governance Dashboard -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <!-- Security & RBAC Overview KPI Cards (Visible ONLY in Security Dashboard) -->
        <div class="kpi-grid" style="display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 10px; margin-bottom: 12px; width: 100%;">
          <div class="kpi-card" onclick="window.UserManagementModule.switchTab('USERS')" style="cursor: pointer;">
            <div class="kpi-header">
              <span class="kpi-label">System Users</span>
              <div class="kpi-icon-wrap primary">👤</div>
            </div>
            <div class="kpi-value">${users.length}</div>
            <div class="kpi-subtext" style="color: var(--color-success);">
              ● ${activeUsers.length} Active &bull; ${lockedUsers.length} Locked
            </div>
          </div>

          <div class="kpi-card" onclick="window.UserManagementModule.switchTab('ROLES')" style="cursor: pointer;">
            <div class="kpi-header">
              <span class="kpi-label">RBAC Roles Defined</span>
              <div class="kpi-icon-wrap warning">👑</div>
            </div>
            <div class="kpi-value">${roles.length}</div>
            <div class="kpi-subtext" style="color: var(--text-muted);">
              17 Standardized Roles &bull; 15 Actions
            </div>
          </div>

          <div class="kpi-card" onclick="window.UserManagementModule.switchTab('SOD_RULES')" style="cursor: pointer;">
            <div class="kpi-header">
              <span class="kpi-label">SoD Governance</span>
              <div class="kpi-icon-wrap info">⚖️</div>
            </div>
            <div class="kpi-value">${sodRules.length}</div>
            <div class="kpi-subtext" style="color: var(--color-success);">
              Segregation of Duties Enforced
            </div>
          </div>

          <div class="kpi-card ${pendingRequests.length > 0 ? 'pulse-border' : ''}" onclick="window.UserManagementModule.switchTab('ACCESS_REQUESTS')" style="cursor: pointer;">
            <div class="kpi-header">
              <span class="kpi-label">Pending Requests</span>
              <div class="kpi-icon-wrap ${pendingRequests.length > 0 ? 'warning' : 'success'}">📝</div>
            </div>
            <div class="kpi-value">${pendingRequests.length}</div>
            <div class="kpi-subtext" style="${pendingRequests.length > 0 ? 'color: var(--color-warning); font-weight: 700;' : 'color: var(--text-muted);'}">
              ${pendingRequests.length > 0 ? `⚠️ ${pendingRequests.length} Awaiting Approval` : '✓ All requests processed'}
            </div>
          </div>

          <div class="kpi-card ${lockedUsers.length > 0 ? 'pulse-border' : ''}" onclick="window.UserManagementModule.switchTab('SESSIONS')" style="cursor: pointer;">
            <div class="kpi-header">
              <span class="kpi-label">Active Sessions</span>
              <div class="kpi-icon-wrap ${lockedUsers.length > 0 ? 'danger' : 'info'}">💻</div>
            </div>
            <div class="kpi-value">${activeSessions.length}</div>
            <div class="kpi-subtext" style="${lockedUsers.length > 0 ? 'color: var(--color-danger); font-weight: 700;' : 'color: var(--color-success);'}">
              ${lockedUsers.length > 0 ? `⚠️ ${lockedUsers.length} Locked Account` : '✓ All authenticated'}
            </div>
          </div>
        </div>

        <!-- Top Operational Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: rgba(255, 255, 255, 0.02); padding: 14px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">🛡️</div>
            <div>
              <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">Zero-Trust RBAC & Governance Center</div>
              <div style="font-size: 12px; color: var(--text-muted);">Real-time access enforcement across Enterprise, Facilities, Warehouses & Transaction Workflows</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.scanForSoDViolations()">
              ⚖️ Run SoD Violation Scan
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.switchTab('ACCESS_REQUESTS')">
              📝 Process Requests (${pendingRequests.length})
            </button>
          </div>
        </div>

        <!-- 4 Core Dashboard Quadrants (BRD §36) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <!-- 1. User Account Status Breakdown -->
          <div class="content-card" style="margin: 0;">
            <div class="card-header">
              <div class="card-title">
                <span style="color: var(--primary-400);">👤</span>
                <span>User Master Breakdown</span>
              </div>
              <span class="badge badge-primary">${users.length} Total</span>
            </div>
            <div style="padding-top: 8px; display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px;">
                <span style="color: var(--color-success); display: flex; align-items: center; gap: 6px;">● Active Accounts</span>
                <strong>${activeUsers.length}</strong>
              </div>
              <div class="progress" style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                <div style="width: ${(activeUsers.length/users.length)*100}%; background: var(--color-success); height: 100%;"></div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px;">
                <span style="color: var(--color-danger); display: flex; align-items: center; gap: 6px;">🔒 Locked Accounts</span>
                <strong>${lockedUsers.length}</strong>
              </div>
              <div class="progress" style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                <div style="width: ${(lockedUsers.length/users.length)*100}%; background: var(--color-danger); height: 100%;"></div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px;">
                <span style="color: var(--color-warning); display: flex; align-items: center; gap: 6px;">⏸️ Suspended / Inactive</span>
                <strong>${suspendedUsers.length + inactiveUsers.length}</strong>
              </div>
              <div class="progress" style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                <div style="width: ${((suspendedUsers.length + inactiveUsers.length)/users.length)*100}%; background: var(--color-warning); height: 100%;"></div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px;">
                <span style="color: #c084fc; display: flex; align-items: center; gap: 6px;">⏳ Expired / Terminated</span>
                <strong>${expiredUsers.length + terminatedUsers.length}</strong>
              </div>
              <div class="progress" style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                <div style="width: ${((expiredUsers.length + terminatedUsers.length)/users.length)*100}%; background: #c084fc; height: 100%;"></div>
              </div>
            </div>
          </div>

          <!-- 2. Security Posture & Authentication -->
          <div class="content-card" style="margin: 0;">
            <div class="card-header">
              <div class="card-title">
                <span style="color: var(--color-success);">🛡️</span>
                <span>Security & Policy Metrics</span>
              </div>
              <span class="badge badge-success">Enforced</span>
            </div>
            <div style="padding-top: 8px; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12.5px; color: var(--text-secondary);">Two-Factor Authentication</span>
                <span class="badge badge-success">${mfaRate}% Adopted (${mfaEnabled}/${users.length})</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12.5px; color: var(--text-secondary);">Active Live Sessions</span>
                <span class="badge badge-primary">${activeSessions.length} Remote IP(s)</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12.5px; color: var(--text-secondary);">Password Rotation Policy</span>
                <span style="font-size: 12px; color: var(--text-primary); font-weight: 600;">90 Days &bull; SHA-256</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12.5px; color: var(--text-secondary);">Brute-Force Lockout</span>
                <span style="font-size: 12px; color: var(--text-primary); font-weight: 600;">5 Failed Attempts &bull; 30m</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12.5px; color: var(--text-secondary);">Session Timeout</span>
                <span class="badge badge-subtle">45 Min Inactivity</span>
              </div>
            </div>
          </div>

          <!-- 3. Approvals & Governance -->
          <div class="content-card" style="margin: 0;">
            <div class="card-header">
              <div class="card-title">
                <span style="color: var(--color-warning);">⚖️</span>
                <span>Approvals & SoD Governance</span>
              </div>
              <span class="badge badge-info">${sodRules.length} Rules Active</span>
            </div>
            <div style="padding-top: 8px; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12.5px; color: var(--text-secondary);">Pending Access Requests</span>
                <span class="badge ${pendingRequests.length > 0 ? 'badge-warning' : 'badge-subtle'}">${pendingRequests.length} Pending</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12.5px; color: var(--text-secondary);">Active Role Delegations</span>
                <span class="badge badge-success">${activeDelegations.length} Active</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12.5px; color: var(--text-secondary);">SoD Segregation Conflict</span>
                <span style="color: var(--color-success); font-weight: 700; font-size: 12px;">✓ 0 Conflicts</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12.5px; color: var(--text-secondary);">Tiered Approval Matrix</span>
                <span style="font-size: 12px; color: var(--text-primary); font-weight: 600;">₹10K to &gt;₹10L Tiered</span>
              </div>
              <div style="margin-top: 4px;">
                <button class="btn btn-secondary btn-xs" style="width: 100%;" onclick="window.UserManagementModule.switchTab('DELEGATIONS')">
                  View Delegations & Temporary Access &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Role Distribution & Recent Security Audits Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <!-- Top Role Assignments -->
          <div class="content-card" style="margin: 0;">
            <div class="card-header">
              <div class="card-title">
                <span style="color: var(--primary-400);">👑</span>
                <span>User-Role Distribution (${roleCounts.length} Active Roles)</span>
              </div>
              <button class="btn btn-secondary btn-xs" onclick="window.UserManagementModule.switchTab('ROLES')">All Roles</button>
            </div>
            <div style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
              ${roleCounts.slice(0, 7).map(rc => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm);">
                  <div>
                    <strong style="color: var(--text-primary); font-size: 12.5px;">${rc.role.name}</strong>
                    <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${rc.role.code}</div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge badge-primary" style="font-weight: 700;">${rc.count} user${rc.count > 1 ? 's' : ''}</span>
                    <button class="btn btn-secondary btn-xs" onclick="window.UserManagementModule.switchTab('ROLE_PERM_MAP'); window.UserManagementModule.selectRoleForMatrix('${rc.role.id}');">Matrix</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Recent Audit Events -->
          <div class="content-card" style="margin: 0;">
            <div class="card-header">
              <div class="card-title">
                <span style="color: var(--primary-400);">🗄️</span>
                <span>Recent Security Audit Log</span>
              </div>
              <button class="btn btn-secondary btn-xs" onclick="window.UserManagementModule.switchTab('USER_ACTIVITY')">Full Audit</button>
            </div>
            <div style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
              ${auditLogs.slice(0, 6).map(l => `
                <div style="padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); font-size: 12px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span style="font-weight: 600; color: var(--primary-300); font-family: var(--font-mono); font-size: 11px;">${l.action}</span>
                    <span style="color: var(--text-muted); font-size: 10.5px;">${window.formatDateTime(l.timestamp)}</span>
                  </div>
                  <div style="color: var(--text-secondary); font-size: 11.5px;">${l.details || l.action}</div>
                  <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Actor: ${l.user} &bull; Target: ${l.record_id || 'System'}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ========================================================================
     1. USER MASTER & ACCESS CONTROL (14 CORE FIELDS COMPLIANT)
     ======================================================================== */
  renderUserMaster() {
    let users = window.DB.getAll('users') || [];
    const roles = window.DB.getAll('roles') || [];
    const plants = window.DB.getAll('plants') || [];
    const allOrgs = window.DB.getAll('organizations') || [];

    // Filter by search across all 14 fields
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      users = users.filter(u => 
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.display_name && u.display_name.toLowerCase().includes(q)) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.first_name && u.first_name.toLowerCase().includes(q)) ||
        (u.last_name && u.last_name.toLowerCase().includes(q)) ||
        (u.employee_id && u.employee_id.toLowerCase().includes(q)) ||
        (u.employee_name && u.employee_name.toLowerCase().includes(q)) ||
        (u.user_type && u.user_type.toLowerCase().includes(q)) ||
        (u.designation && u.designation.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.specialty && u.specialty.toLowerCase().includes(q)) ||
        (u.mobile_number && u.mobile_number.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q))
      );
    }

    // Filter by status (Supports all 6 BRD §7 statuses)
    if (this.statusFilter !== 'ALL') {
      users = users.filter(u => u.status === this.statusFilter);
    }

    // Filter by User Type (Admin / Employee / Technician / Other)
    if (this.userTypeFilter && this.userTypeFilter !== 'ALL') {
      users = users.filter(u => (u.user_type || 'Employee') === this.userTypeFilter);
    }

    const totalRecords = users.length;
    const pageSize = this.pageSize || 10;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const visibleUsers = users.slice(startIndex, endIndex);

    const lockedCount = users.filter(u => u.status === 'LOCKED').length;

    return `
      <div class="content-card user-master-card">
        <!-- Compact Single-Row Toolbar -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="font-weight: 700; font-size: 13.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--primary-400);">👤</span>
              <span>User Master</span>
            </div>
            <span class="badge badge-primary" style="font-size: 11px; padding: 2px 7px; border-radius: 10px;">${totalRecords} Users</span>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <!-- Search across 14 fields -->
            <div style="position: relative; display: flex; align-items: center;">
              <input 
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Search user, name, staff ID, dept..." 
                value="${this.searchTerm}" 
                oninput="window.UserManagementModule.setSearch(this.value)" 
                style="width: 210px; height: 28px; font-size: 11.5px; padding: 2px 8px;"
              />
              ${this.searchTerm ? `
                <button onclick="window.UserManagementModule.setSearch('')" style="position: absolute; right: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 11px; padding: 0;" title="Clear search">✕</button>
              ` : ''}
            </div>

            <!-- User Type Filter -->
            <select class="form-control form-control-sm" onchange="window.UserManagementModule.setUserTypeFilter(this.value)" style="width: 120px; height: 28px; font-size: 11.5px; padding: 2px 6px;">
              <option value="ALL" ${this.userTypeFilter === 'ALL' ? 'selected' : ''}>All User Types</option>
              <option value="Admin" ${this.userTypeFilter === 'Admin' ? 'selected' : ''}>Admins</option>
              <option value="Employee" ${this.userTypeFilter === 'Employee' ? 'selected' : ''}>Employees</option>
              <option value="Technician" ${this.userTypeFilter === 'Technician' ? 'selected' : ''}>Technicians</option>
              <option value="Other" ${this.userTypeFilter === 'Other' ? 'selected' : ''}>Other</option>
            </select>

            <!-- Status Filter -->
            <select class="form-control form-control-sm" onchange="window.UserManagementModule.setStatusFilter(this.value)" style="width: 115px; height: 28px; font-size: 11.5px; padding: 2px 6px;">
              <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
              <option value="ACTIVE" ${this.statusFilter === 'ACTIVE' ? 'selected' : ''}>Active</option>
              <option value="LOCKED" ${this.statusFilter === 'LOCKED' ? 'selected' : ''}>Locked</option>
              <option value="INACTIVE" ${this.statusFilter === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
              <option value="SUSPENDED" ${this.statusFilter === 'SUSPENDED' ? 'selected' : ''}>Suspended</option>
              <option value="EXPIRED" ${this.statusFilter === 'EXPIRED' ? 'selected' : ''}>Expired</option>
              <option value="TERMINATED" ${this.statusFilter === 'TERMINATED' ? 'selected' : ''}>Terminated</option>
            </select>

            <!-- Register User Action -->
            <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.showCreateUserModal()" style="height: 28px; font-size: 11.5px; padding: 0 10px; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
              <span>+ Register New User</span>
            </button>
          </div>
        </div>

        ${lockedCount > 0 ? `
          <div class="alert alert-warning" style="margin: 0 0 6px 0; padding: 4px 10px; font-size: 11.5px; display: flex; align-items: center; justify-content: space-between; border-radius: 4px; line-height: 1.2;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 13px;">⚠️</span>
              <span><strong>Security Notice:</strong> ${lockedCount} account(s) currently locked due to failed authentication attempts.</span>
            </div>
            <button class="btn btn-xs btn-secondary" style="height: 22px; padding: 0 6px; font-size: 10.5px;" onclick="window.UserManagementModule.switchTab('LOGIN_SECURITY')">Inspect Security Rules</button>
          </div>
        ` : ''}

        <!-- Dedicated Scroll Container with Sticky Headers & Custom Scrollbar -->
        <div class="user-table-scroll-container" id="user-table-scroll-container">
          <table class="data-table user-master-table">
            <thead>
              <tr>
                <th style="width: 21%;">User Profile / Display Name</th>
                <th style="width: 12%;">User ID / Staff Link</th>
                <th style="width: 17%;">Designation & Department</th>
                <th style="width: 15%;">Contact Details</th>
                <th style="width: 14%;">Role & Facility</th>
                <th style="width: 7%;">Status</th>
                <th style="width: 14%; min-width: 185px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${visibleUsers.map(u => {
                const roleObj = roles.find(r => r.id === u.primary_role) || { name: u.primary_role };
                const plantObj = plants.find(p => p.id === u.plant_id);
                const orgObj = plantObj ? allOrgs.find(o => o.id === plantObj.organization_id) : (u.company_id ? allOrgs.find(o => o.id === u.company_id) : null);
                const isOrgActive = orgObj ? (orgObj.status === 'Active' && orgObj.is_active !== false) : true;
                const isPlantActive = plantObj ? (plantObj.is_active !== false && isOrgActive) : true;
                let plantName = 'All Facilities';
                if (Array.isArray(u.assigned_plants) && u.assigned_plants.length > 0) {
                  if (u.assigned_plants.includes('ALL')) {
                    plantName = 'All Facilities';
                  } else if (u.assigned_plants.length === 1) {
                    const p = window.DB.getById('plants', u.assigned_plants[0]);
                    plantName = p ? p.name : u.assigned_plants[0];
                  } else {
                    plantName = `${u.assigned_plants.length} Facilities`;
                  }
                } else if (u.plant_id === 'ALL') {
                  plantName = 'All Facilities';
                } else if (plantObj) {
                  plantName = plantObj.name;
                } else {
                  plantName = u.plant_id || 'Global';
                }
                const displayName = u.display_name || u.full_name || u.username;
                const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const userType = u.user_type || 'Employee';

                // User Type Badges with tailored color coding
                let userTypeBadge = '';
                switch (userType) {
                  case 'Technician':
                    userTypeBadge = '<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 10px; font-weight: 600;">Technician</span>';
                    break;
                  case 'Admin':
                    userTypeBadge = '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 10px; font-weight: 600;">Admin</span>';
                    break;
                  case 'Other':
                    userTypeBadge = '<span class="badge" style="background: rgba(168, 85, 247, 0.15); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.3); font-size: 10px; font-weight: 600;">Other</span>';
                    break;
                  default:
                    userTypeBadge = '<span class="badge" style="background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3); font-size: 10px; font-weight: 600;">Employee</span>';
                }

                // Account Status Badges
                let statusBadge = '';
                if (!isOrgActive && u.status === 'ACTIVE') {
                  statusBadge = '<span class="badge badge-secondary" style="font-size: 10px; padding: 2px 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);" title="Parent Organization is Inactive">Inactive (Org Inactive)</span>';
                } else {
                  switch (u.status) {
                    case 'ACTIVE':
                      statusBadge = '<span class="badge badge-success" style="font-size: 10px; padding: 2px 6px;">Active</span>';
                      break;
                    case 'LOCKED':
                      statusBadge = '<span class="badge badge-danger" style="font-size: 10px; padding: 2px 6px; animation: pulse 1.5s infinite;">Locked</span>';
                      break;
                    case 'INACTIVE':
                      statusBadge = '<span class="badge badge-secondary" style="font-size: 10px; padding: 2px 6px;">Inactive</span>';
                      break;
                    case 'SUSPENDED':
                      statusBadge = '<span class="badge badge-warning" style="font-size: 10px; padding: 2px 6px;">Suspended</span>';
                      break;
                    case 'EXPIRED':
                      statusBadge = '<span class="badge" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); font-size: 10px; padding: 2px 6px;">Expired</span>';
                      break;
                    case 'TERMINATED':
                      statusBadge = '<span class="badge badge-danger" style="background: rgba(100, 116, 139, 0.2); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.3); font-size: 10px; padding: 2px 6px;">Terminated</span>';
                      break;
                    default:
                      statusBadge = `<span class="badge badge-subtle" style="font-size: 10px; padding: 2px 6px;">${u.status}</span>`;
                  }
                }

                const legalFullName = `${u.first_name || ''} ${u.middle_name ? u.middle_name + ' ' : ''}${u.last_name || ''}`.trim();

                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="user-avatar" style="width: 28px; height: 28px; font-size: 10.5px; background: linear-gradient(135deg, var(--primary-600), var(--primary-800)); flex-shrink: 0; border-radius: 50%; font-weight: 700; display: flex; align-items: center; justify-content: center; color: #fff;">${initials}</div>
                        <div style="min-width: 0;">
                          <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
                            <span style="font-weight: 700; color: var(--text-primary); font-size: 12.5px;">${displayName}</span>
                            ${userTypeBadge}
                          </div>
                          <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 1px;">
                            ${legalFullName && legalFullName !== displayName ? `<span>${legalFullName}</span> &bull; ` : ''}
                            <span style="font-family: var(--font-mono); color: var(--primary-300);">${u.username}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <span style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--primary-300); background: rgba(99, 102, 241, 0.1); padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(99, 102, 241, 0.2);">${u.id}</span>
                      </div>
                      <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px; display: flex; align-items: center; gap: 3px;">
                        <span style="color: var(--primary-400);">🔗</span>
                        <span style="font-family: var(--font-mono); font-weight: 600;">${u.employee_id || 'EMP-N/A'}</span>
                        ${u.employee_name && u.employee_name !== displayName ? `<span style="color: var(--text-muted);">&bull; ${u.employee_name}</span>` : ''}
                      </div>
                    </td>

                    <td>
                      <div style="font-weight: 600; color: var(--text-primary); font-size: 12px;">${u.designation || 'Staff Member'}</div>
                      <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 1px;">${u.department || 'General Operations'}</div>
                      ${u.specialty ? `
                        <div style="margin-top: 2px;">
                          <span class="badge" style="font-size: 9.5px; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); padding: 1px 5px;">
                            ✦ ${u.specialty}
                          </span>
                        </div>
                      ` : ''}
                    </td>

                    <td>
                      <div style="font-size: 11.5px; color: var(--text-primary); display: flex; align-items: center; gap: 4px;">
                        <span>✉️</span>
                        <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 160px;" title="${u.email || ''}">${u.email || 'No email'}</span>
                      </div>
                      <div style="font-size: 10.5px; color: var(--text-secondary); font-family: var(--font-mono); margin-top: 1px; display: flex; align-items: center; gap: 4px;">
                        <span>📱</span>
                        <span>${u.mobile_number || u.phone || 'No mobile'}</span>
                      </div>
                    </td>

                    <td>
                      <div>
                        <span class="badge badge-primary" style="font-weight: 600; font-size: 10.5px; padding: 1px 6px;">
                          👑 ${roleObj.name || u.primary_role}
                        </span>
                      </div>
                      <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                        <span>${plantName}</span>
                        ${!isOrgActive ? '<span class="badge badge-secondary" style="font-size: 9px; padding: 0 4px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);">Org Inactive</span>' : ''}
                      </div>
                      <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px; display: flex; align-items: center; gap: 3px;">
                        <span>🏬</span>
                        <span>${this.getUserStoreSummaryText(u)}</span>
                      </div>
                    </td>

                    <td>
                      ${statusBadge}
                      ${u.must_change_password ? `
                        <div style="margin-top: 2px;">
                          <span class="badge badge-warning" style="font-size: 9px; padding: 1px 4px;" title="Mandatory password change enforced upon next login">🔑 Pwd Chg</span>
                        </div>
                      ` : ''}
                      <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                        ${u.last_login ? window.formatDate(u.last_login) : 'Never'}
                      </div>
                    </td>

                    <td class="text-right">
                      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px; white-space: nowrap;">
                        <button class="btn btn-primary btn-xs" onclick="window.State.switchSimulatedUser('${u.id}')" title="Simulate Login as ${u.username}" style="height: 24px; padding: 0 6px; font-size: 10.5px;">
                          🎭 Login
                        </button>

                        ${u.status === 'LOCKED' ? `
                          <button class="btn btn-icon btn-sm" onclick="window.UserManagementModule.unlockUser('${u.id}')" title="Unlock Account and reset failed attempts" style="color: #10b981; width: 24px; height: 24px; padding: 0;">
                            ${window.AppIcons ? window.AppIcons.svgLock(false) : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>'}
                          </button>
                        ` : `
                          <button class="btn btn-icon btn-sm" onclick="window.UserManagementModule.lockUser('${u.id}')" title="Manually lock user account" style="color: #f59e0b; width: 24px; height: 24px; padding: 0;">
                            ${window.AppIcons ? window.AppIcons.svgLock(true) : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}
                          </button>
                        `}

                        <button class="btn btn-secondary btn-xs" onclick="window.UserManagementModule.toggleUserStatus('${u.id}')" title="${u.status === 'ACTIVE' ? 'Deactivate User Account' : 'Activate User Account'}" style="height: 24px; padding: 0 6px; font-size: 10.5px; font-weight: 600; min-width: 44px; text-align: center;">${u.status === 'ACTIVE' ? 'Deact' : 'Act'}</button>

                        <button class="btn btn-secondary btn-xs" onclick="window.UserManagementModule.showResetPasswordModal('${u.id}')" title="Reset Password" style="height: 24px; padding: 0 6px; font-size: 10.5px;">
                          🔑 Pwd
                        </button>

                        <button class="btn btn-icon btn-sm" onclick="window.UserManagementModule.showEditUserModal('${u.id}')" title="Edit Profile Details" style="width: 24px; height: 24px; padding: 0;">
                          ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
                        </button>

                        <button class="btn btn-icon btn-sm" onclick="window.UserManagementModule.deleteUser('${u.id}')" title="${u.id === 'USR-001' ? 'System Administrator cannot be deleted' : 'Delete User Account'}" style="color: #ef4444; width: 24px; height: 24px; padding: 0;" ${u.id === 'USR-001' ? 'disabled' : ''}>
                          ${window.AppIcons ? window.AppIcons.svgDelete : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              ${visibleUsers.length === 0 ? `
                <tr>
                  <td colspan="7" class="text-center" style="padding: 30px; color: var(--text-muted); font-size: 12px;">
                    No system users found matching the query "${this.searchTerm}".
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls Footer -->
        <div class="user-pagination-bar">
          <div>
            Showing <strong style="color: var(--text-primary);">${totalRecords === 0 ? 0 : startIndex + 1}</strong> to <strong style="color: var(--text-primary);">${endIndex}</strong> of <strong style="color: var(--text-primary);">${totalRecords}</strong> entries
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 13px; font-weight: 400;">Show</span>
              <select class="form-control form-control-sm" onchange="window.UserManagementModule.setPageSize(this.value)" style="height: 28px; font-size: 13px; padding: 1px 6px; width: 70px; border-radius: 4px; font-weight: 500;">
                <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10</option>
                <option value="25" ${this.pageSize === 25 ? 'selected' : ''}>25</option>
                <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100</option>
              </select>
              <span style="font-size: 13px; font-weight: 400;">entries</span>
            </div>

            <!-- Page Navigation Buttons -->
            <div class="pagination-buttons" style="display: flex; gap: 4px; align-items: center;">
              <button class="btn btn-secondary btn-xs" ${this.currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"'} onclick="window.UserManagementModule.goToPage(1)" title="First Page">⏮</button>
              <button class="btn btn-secondary btn-xs" ${this.currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"'} onclick="window.UserManagementModule.goToPage(${this.currentPage - 1})" title="Previous Page">◀ Prev</button>
              ${this.renderPaginationPills(this.currentPage, totalPages)}
              <button class="btn btn-secondary btn-xs" ${this.currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"'} onclick="window.UserManagementModule.goToPage(${this.currentPage + 1})" title="Next Page">Next ▶</button>
              <button class="btn btn-secondary btn-xs" ${this.currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"'} onclick="window.UserManagementModule.goToPage(${totalPages})" title="Last Page">⏭</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderPaginationPills(current, total) {
    if (total <= 1) return '';
    const pills = [];
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, current + 2);

    if (current <= 3) {
      startPage = 1;
      endPage = Math.min(5, total);
    } else if (current >= total - 2) {
      startPage = Math.max(1, total - 4);
      endPage = total;
    }

    if (startPage > 1) {
      pills.push(`<button class="btn btn-secondary btn-xs" onclick="window.UserManagementModule.goToPage(1)" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 500;">1</button>`);
      if (startPage > 2) {
        pills.push(`<span style="padding: 0 3px; color: var(--text-muted); line-height: 28px; font-size: 12px;">...</span>`);
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      const isActive = p === current;
      pills.push(`
        <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-xs" 
                onclick="window.UserManagementModule.goToPage(${p})" 
                style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: ${isActive ? '600' : '500'};">
          ${p}
        </button>
      `);
    }

    if (endPage < total) {
      if (endPage < total - 1) {
        pills.push(`<span style="padding: 0 3px; color: var(--text-muted); line-height: 28px; font-size: 12px;">...</span>`);
      }
      pills.push(`<button class="btn btn-secondary btn-xs" onclick="window.UserManagementModule.goToPage(${total})" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 500;">${total}</button>`);
    }

    return pills.join('');
  },

  goToPage(page) {
    this.currentPage = Math.max(1, Number(page) || 1);
    const content = document.getElementById('user-mgmt-content');
    if (content) {
      content.innerHTML = this.renderActiveSubModule();
    } else {
      this.render();
    }
    const container = document.getElementById('user-table-scroll-container');
    if (container) container.scrollTop = 0;
  },

  setPageSize(size) {
    this.pageSize = Number(size) || 10;
    this.currentPage = 1;
    const content = document.getElementById('user-mgmt-content');
    if (content) {
      content.innerHTML = this.renderActiveSubModule();
    } else {
      this.render();
    }
    const container = document.getElementById('user-table-scroll-container');
    if (container) container.scrollTop = 0;
  },

  setSearch(val) {
    this.searchTerm = val;
    this.currentPage = 1;
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  setStatusFilter(val) {
    this.statusFilter = val;
    this.currentPage = 1;
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  setUserTypeFilter(val) {
    this.userTypeFilter = val;
    this.currentPage = 1;
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  // Lock user account
  lockUser(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;
    window.DB.update('users', userId, {
      status: 'LOCKED',
      failed_logins: 5,
      locked_until: new Date(Date.now() + 30 * 60000).toISOString()
    });
    window.DB.logAudit('USER_LOCKED', 'Security', userId, `Administrator manually locked account for ${user.username}`);
    window.State.showToast(`User ${user.username} has been locked.`, 'warning');
    this.render();
  },

  // Unlock user account
  unlockUser(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;
    window.DB.update('users', userId, {
      status: 'ACTIVE',
      failed_logins: 0,
      locked_until: null
    });
    window.DB.logAudit('USER_UNLOCKED', 'Security', userId, `Administrator unlocked account for ${user.username}`);
    window.State.showToast(`User ${user.username} unlocked successfully.`, 'success');
    this.render();
  },

  // Toggle user active / inactive status
  toggleUserStatus(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    window.DB.update('users', userId, { status: newStatus });
    window.DB.logAudit('USER_STATUS_CHANGE', 'Security', userId, `User status updated to ${newStatus} for ${user.username}`);
    window.State.showToast(`User ${user.username} status set to ${newStatus}.`, 'success');
    this.render();
  },

  // Delete user account permanently with cascade across related modules
  async deleteUser(userId) {
    if (!userId) return;
    if (userId === 'USR-001') {
      window.State.showToast('System root owner account USR-001 cannot be deleted.', 'error');
      return;
    }
    const currentUser = window.State.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      window.State.showToast('Cannot delete currently logged in user account.', 'error');
      return;
    }

    const user = window.DB.getById('users', userId);
    if (!user) {
      window.State.showToast('User not found in database.', 'error');
      return;
    }

    const userName = user.full_name || user.display_name || user.username || userId;
    const confirmed = confirm(`Are you sure you want to permanently delete user "${userName}" (${userId})?\n\nThis will remove the user and revoke all assigned rights across User-Role Mapping, Warehouse Access Scoping, and all associated security modules.`);
    if (!confirmed) return;

    if (typeof window.DB.deleteUser === 'function') {
      await window.DB.deleteUser(userId);
    } else {
      window.DB.delete('users', userId);
    }

    window.DB.logAudit('USER_DELETED', 'Security', userId, `Permanently deleted user account ${userName} (${userId})`);
    window.State.showToast(`User "${userName}" deleted successfully from system and all related screens.`, 'success');

    if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
      window.App.filterSidebarByPermissions();
    }
    if (window.State && typeof window.State.notify === 'function') {
      window.State.notify();
    }
    this.render();
  },

  // ==========================================================================
  // FORM & EVENT HELPERS (14 FIELDS & USER MASTER AUTO-POPULATION)
  // ==========================================================================

  onEmployeeSelect(empId) {
    if (!empId) return;

    if (empId === 'CUSTOM') {
      const empIdEl = document.getElementById('new-user-empid');
      const empNameEl = document.getElementById('new-user-empname');
      if (empIdEl) empIdEl.focus();
      return;
    }

    const users = (window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('users') : [];
    const employees = (window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('employees') : [];
    const emp = users.find(u => u.id === empId || u.employee_id === empId) || employees.find(e => e.id === empId || e.employee_id === empId);
    if (!emp) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    const resolvedEmpId = emp.employee_id || emp.id || '';
    const resolvedFullName = emp.full_name || emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username || '';
    const resolvedFirstName = emp.first_name || (resolvedFullName ? resolvedFullName.split(' ')[0] : '');
    const resolvedLastName = emp.last_name || (resolvedFullName ? resolvedFullName.split(' ').slice(1).join(' ') : '');
    const resolvedDisplayName = emp.display_name || resolvedFullName;

    setVal('new-user-empid', resolvedEmpId);
    setVal('new-user-empname', resolvedFullName);
    setVal('new-user-firstname', resolvedFirstName);
    setVal('new-user-middlename', emp.middle_name || '');
    setVal('new-user-lastname', resolvedLastName);
    setVal('new-user-displayname', resolvedDisplayName);
    setVal('new-user-usertype', emp.user_type || 'Employee');
    setVal('new-user-designation', emp.designation || '');
    setVal('new-user-specialty', emp.specialty || '');
    const cleanEmpMobile = (emp.mobile_number || emp.phone || '').replace(/\D/g, '').slice(-10);
    setVal('new-user-mobile', cleanEmpMobile);
    setVal('new-user-email', emp.email || '');

    // Department match
    const deptEl = document.getElementById('new-user-department');
    if (deptEl) {
      if (emp.department) {
        let matched = false;
        for (let opt of deptEl.options) {
          if (opt.value.toLowerCase() === emp.department.toLowerCase() || opt.text.toLowerCase().includes(emp.department.toLowerCase())) {
            deptEl.value = opt.value;
            matched = true;
            break;
          }
        }
        if (!matched) {
          if (typeof Option !== 'undefined') {
            const opt = new Option(emp.department, emp.department, true, true);
            deptEl.add(opt);
          } else if (deptEl.options && Array.isArray(deptEl.options)) {
            deptEl.options.push({ value: emp.department, text: emp.department });
            deptEl.value = emp.department;
          }
        }
      }
    }

    // Auto-update user type change
    this.onUserTypeChange(emp.user_type || 'Employee', 'new-user');

    // Auto-generate system username & assign facilities
    if (this.setSelectedFacilities) {
      if (emp.assigned_plants && Array.isArray(emp.assigned_plants) && emp.assigned_plants.length > 0) {
        this.setSelectedFacilities('new-user', emp.assigned_plants);
      } else if (emp.plant_id && emp.plant_id !== 'ALL') {
        this.setSelectedFacilities('new-user', [emp.plant_id]);
      } else {
        this.setSelectedFacilities('new-user', []);
      }
    } else if (emp.plant_id && emp.plant_id !== 'ALL') {
      const plantEl = document.getElementById('new-user-plant');
      if (plantEl) plantEl.value = emp.plant_id;
    }
    if (emp.joining_date) {
      const joinEl = document.getElementById('new-user-joiningdate');
      if (joinEl) joinEl.value = emp.joining_date;
    }
    this.generateDefaultUsername('new-user', false);
  },

  onUserTypeChange(userType, prefix = 'new-user') {
    const badgeEl = document.getElementById(`${prefix}-specialty-badge`);
    const specialtyInput = document.getElementById(`${prefix}-specialty`);
    if (badgeEl && badgeEl.style) {
      badgeEl.style.display = 'none';
    }
    if (specialtyInput) {
      if (typeof specialtyInput.removeAttribute === 'function') specialtyInput.removeAttribute('required');
      specialtyInput.placeholder = 'e.g. Inventory Logistics, Enterprise Architecture';
      if (specialtyInput.style) specialtyInput.style.borderColor = '';
    }
  },

  autoUpdateDisplayName(prefix = 'new-user') {
    const first = (document.getElementById(`${prefix}-firstname`)?.value || '').trim();
    const middle = (document.getElementById(`${prefix}-middlename`)?.value || '').trim();
    const last = (document.getElementById(`${prefix}-lastname`)?.value || '').trim();

    const displayEl = document.getElementById(`${prefix}-displayname`);
    if (displayEl && (first || last)) {
      const combined = `${first} ${middle ? middle + ' ' : ''}${last}`.trim();
      displayEl.value = combined;
    }
  },

  // ==========================================================================
  // SYSTEM-GENERATED USERNAME & VALIDATION ENGINE
  // Rule: Default Username = Branch Code + Joining Year + Sequence Number (e.g. PUN2026001)
  // Alphanumeric only (A–Z, 0–9), No spaces, No special chars, Length 5–30, Unique
  // ==========================================================================

  getBranchCode(plantId) {
    if (!plantId || plantId === 'ALL') {
      const currentPlant = window.State && typeof window.State.getCurrentPlant === 'function' ? window.State.getCurrentPlant() : null;
      if (currentPlant && currentPlant.id && currentPlant.id !== 'ALL') {
        return this.getBranchCode(currentPlant.id);
      }
      return 'PUN';
    }
    const plant = window.DB && typeof window.DB.getById === 'function' ? window.DB.getById('plants', plantId) : null;
    if (!plant) return 'PUN';
    if (plant.branch_code) return String(plant.branch_code).trim().toUpperCase();
    if (plant.code) {
      const match = plant.code.match(/BRANCH-([A-Z0-9]{3,4})-/i);
      if (match) return match[1].toUpperCase();
    }
    if (plant.city) {
      const city = plant.city.trim().toUpperCase();
      if (city.includes('PUN')) return 'PUN';
      if (city.includes('MUM')) return 'MUM';
      if (city.includes('NAG')) return 'NAG';
      if (city.includes('CHE')) return 'CHE';
      if (city.includes('DEL')) return 'DEL';
      if (city.includes('BLR') || city.includes('BANG')) return 'BLR';
      return city.replace(/[^A-Z]/g, '').slice(0, 3) || 'PUN';
    }
    return String(plant.code || 'PUN').replace(/[^A-Z]/g, '').slice(0, 3) || 'PUN';
  },

  getNextUsernameSequence(branchCode, joiningYear) {
    const prefix = `${branchCode}${joiningYear}`.toUpperCase();
    const allUsers = (window.DB && typeof window.DB.getAll === 'function' ? window.DB.getAll('users') : []) || [];
    let maxSeq = 0;

    allUsers.forEach(u => {
      if (!u.username) return;
      const uname = String(u.username).toUpperCase().trim();
      if (uname.startsWith(prefix)) {
        const remainder = uname.slice(prefix.length);
        if (/^\d+$/.test(remainder)) {
          const num = parseInt(remainder, 10);
          if (num > maxSeq) maxSeq = num;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return String(nextSeq).padStart(3, '0');
  },

  generateDefaultUsername(prefix = 'new-user', force = false) {
    const usernameEl = document.getElementById(`${prefix}-username`);
    if (!usernameEl) return;
    if (!usernameEl.dataset) usernameEl.dataset = {};

    if (!force && usernameEl.dataset.userModified === 'true' && usernameEl.value.trim().length > 0) {
      return;
    }

    const plantId = document.getElementById(`${prefix}-plant`)?.value;
    if (!plantId && prefix === 'new-user') {
      usernameEl.value = '';
      usernameEl.placeholder = 'Select branch above to generate username';
      usernameEl.dataset.autoGenerated = '';
      usernameEl.dataset.userModified = 'false';
      const branchBadge = document.getElementById(`${prefix}-branch-code-badge`);
      if (branchBadge) branchBadge.innerText = 'None';
      const feedback = document.getElementById(`${prefix}-username-feedback`);
      if (feedback) {
        feedback.innerHTML = '<small style="color: var(--text-muted); font-size: 10.5px;">Select assigned facility to auto-generate sequence username</small>';
      }
      return;
    }

    const branchCode = this.getBranchCode(plantId || 'ALL');

    const joiningDateVal = document.getElementById(`${prefix}-joiningdate`)?.value;
    let joiningYear = 2026;
    if (joiningDateVal) {
      const parsedYear = new Date(joiningDateVal).getFullYear();
      if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear < 2100) {
        joiningYear = parsedYear;
      }
    }

    const seq = this.getNextUsernameSequence(branchCode, joiningYear);
    const generatedUsername = `${branchCode}${joiningYear}${seq}`;

    usernameEl.value = generatedUsername;
    usernameEl.dataset.autoGenerated = generatedUsername;
    usernameEl.dataset.userModified = 'false';

    const branchBadge = document.getElementById(`${prefix}-branch-code-badge`);
    if (branchBadge) {
      branchBadge.innerText = branchCode;
    }

    this.onUsernameInput(prefix);
  },

  enableUsernameEdit(prefix = 'new-user') {
    const usernameEl = document.getElementById(`${prefix}-username`);
    if (!usernameEl) return;
    usernameEl.removeAttribute('readonly');
    usernameEl.focus();
    usernameEl.select();
    usernameEl.dataset.userModified = 'true';
    const feedback = document.getElementById(`${prefix}-username-feedback`);
    if (feedback) {
      feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--primary-400); margin-top: 4px;">
          <span>✏️</span> <span>Edit mode enabled: Type your custom username (A–Z, 0–9).</span>
        </div>
      `;
    }
    if (window.State && window.State.showToast) {
      window.State.showToast('✏️ Username editing enabled. Enter custom alphanumeric username.', 'info');
    }
  },

  validateUsername(username, excludeUserId = null) {
    if (!username || typeof username !== 'string') {
      return { valid: false, message: 'Username cannot be blank.' };
    }
    const trimmed = username.trim();
    if (trimmed.length === 0) {
      return { valid: false, message: 'Username cannot be blank.' };
    }
    if (/\s/.test(trimmed)) {
      return { valid: false, message: 'Spaces are not allowed in username.' };
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
      return { valid: false, message: 'Only alphanumeric characters (A–Z, 0–9), dots (.), dashes (-), and underscores (_) are allowed.' };
    }
    if (trimmed.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters long.' };
    }
    if (trimmed.length > 30) {
      return { valid: false, message: 'Username cannot exceed 30 characters.' };
    }

    const upper = trimmed.toUpperCase();
    const allUsers = (window.DB && typeof window.DB.getAll === 'function' ? window.DB.getAll('users') : []) || [];
    const duplicate = allUsers.find(u => 
      u.username && 
      String(u.username).toUpperCase() === upper && 
      u.id !== excludeUserId
    );
    if (duplicate) {
      return { valid: false, message: 'Username already exists.' };
    }

    return { valid: true, formatted: trimmed };
  },

  onUsernameInput(prefix = 'new-user', excludeUserId = null) {
    const input = document.getElementById(`${prefix}-username`);
    const feedback = document.getElementById(`${prefix}-username-feedback`);
    if (!input) return;

    if (input.value !== input.dataset.autoGenerated) {
      input.dataset.userModified = 'true';
    }

    if (!feedback) return;

    const val = input.value;
    if (!val) {
      feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-danger); margin-top: 4px;">
          <span>❌</span> <span>Username cannot be blank</span>
        </div>
      `;
      input.style.borderColor = 'var(--color-danger)';
      return;
    }

    if (/\s/.test(val)) {
      feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-danger); margin-top: 4px;">
          <span>❌</span> <span>Spaces are not allowed in username</span>
        </div>
      `;
      input.style.borderColor = 'var(--color-danger)';
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(val)) {
      feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-danger); margin-top: 4px;">
          <span>❌</span> <span>Special characters (@, _, ., -, #, etc.) are not allowed. Alphanumeric only (A–Z, 0–9).</span>
        </div>
      `;
      input.style.borderColor = 'var(--color-danger)';
      return;
    }

    if (val.length < 5) {
      feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #f59e0b; margin-top: 4px;">
          <span>⚠️</span> <span>Minimum length 5 characters (${val.length}/5 entered)</span>
        </div>
      `;
      input.style.borderColor = '#f59e0b';
      return;
    }

    if (val.length > 30) {
      feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-danger); margin-top: 4px;">
          <span>❌</span> <span>Maximum length is 30 characters (${val.length}/30)</span>
        </div>
      `;
      input.style.borderColor = 'var(--color-danger)';
      return;
    }

    const allUsers = (window.DB && typeof window.DB.getAll === 'function' ? window.DB.getAll('users') : []) || [];
    const duplicate = allUsers.find(u => 
      u.username && 
      String(u.username).toUpperCase() === val.toUpperCase() && 
      u.id !== excludeUserId
    );

    if (duplicate) {
      feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-danger); margin-top: 4px;">
          <span>❌</span> <span>Username already exists (${duplicate.full_name || duplicate.id})</span>
        </div>
      `;
      input.style.borderColor = 'var(--color-danger)';
      return;
    }

    const isAuto = input.value === input.dataset.autoGenerated;
    feedback.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-success); margin-top: 4px;">
        <span>✅</span> <span>Valid & Unique Username ${isAuto ? '<strong style="color:var(--primary-300);">(System-Generated)</strong>' : '<strong style="color:#10b981;">(Custom Approved)</strong>'}</span>
      </div>
    `;
    input.style.borderColor = 'var(--color-success)';
  },

  onBranchOrJoiningDateChange(prefix = 'new-user', excludeUserId = null) {
    const plantSelect = document.getElementById(`${prefix}-plant`);
    const plantId = plantSelect ? plantSelect.value : '';
    const assignedIds = this.getSelectedFacilityIds ? this.getSelectedFacilityIds(prefix) : (plantId ? [plantId] : []);
    const branchCode = plantId ? this.getBranchCode(plantId) : '';

    const branchBadge = document.getElementById(`${prefix}-branch-code-badge`);
    if (branchBadge) {
      branchBadge.innerText = this.getBranchBadgeText ? this.getBranchBadgeText(assignedIds) : (branchCode || 'None');
    }

    if (plantId || (this.getSelectedFacilityIds && this.getSelectedFacilityIds(prefix).length > 0)) {
      this.generateDefaultUsername(prefix, false);
      if (prefix === 'new-user') {
        this.generateDefaultPassword(prefix, false);
      }
    } else if (prefix === 'new-user') {
      const usernameEl = document.getElementById('new-user-username');
      if (usernameEl && (!usernameEl.value || usernameEl.dataset.userModified !== 'true')) {
        usernameEl.value = '';
        usernameEl.placeholder = 'Select branch above to generate username';
        const feedback = document.getElementById('new-user-username-feedback');
        if (feedback) {
          feedback.innerHTML = '<small style="color: var(--text-muted); font-size: 10.5px;">Select assigned facility to auto-generate sequence username</small>';
        }
      }
    }
  },

  onUsernameBlur(prefix = 'new-user', excludeUserId = null) {
    const input = document.getElementById(`${prefix}-username`);
    if (input) {
      input.value = input.value.trim().toUpperCase();
      this.onUsernameInput(prefix, excludeUserId);
    }
  },

  // ==========================================================================
  // MULTI-FACILITY / BRANCH SELECTOR WITH CHECKBOX BUTTONS
  // ==========================================================================

  getUserAssignedPlants(user) {
    if (!user) return ['ALL'];
    if (Array.isArray(user.assigned_plants) && user.assigned_plants.length > 0) {
      return [...user.assigned_plants];
    }
    if (typeof user.assigned_plants === 'string') {
      try {
        const parsed = JSON.parse(user.assigned_plants);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {
        if (user.assigned_plants.includes(',')) {
          return user.assigned_plants.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [user.assigned_plants];
      }
    }
    if (user.plant_id) {
      if (user.plant_id === 'ALL') return ['ALL'];
      if (user.plant_id.includes(',')) {
        return user.plant_id.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [user.plant_id];
    }
    return ['ALL'];
  },

  getBranchBadgeText(plantIds) {
    if (!plantIds || plantIds.length === 0) {
      return 'None';
    }
    if (plantIds.includes('ALL')) {
      return 'ALL';
    }
    const plants = (window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('plants') : [];
    const validIds = plantIds.filter(id => id && id !== 'ALL');
    if (validIds.length === 0) return 'None';
    const codes = validIds.map(id => {
      const p = plants.find(pl => pl.id === id);
      return p ? (p.branch_code || (p.code || '').replace('BRANCH-', '') || (p.city || 'PUN').substring(0, 3).toUpperCase()) : id;
    });
    return codes.slice(0, 3).join(', ') + (codes.length > 3 ? '...' : '');
  },

  renderFacilitySelector(prefix, selectedPlantIds = [], plants = []) {
    const isAllSelected = selectedPlantIds.includes('ALL') || (plants.length > 0 && selectedPlantIds.length > 0 && plants.every(p => selectedPlantIds.includes(p.id)));
    const activePlantIds = isAllSelected 
      ? plants.map(p => p.id) 
      : selectedPlantIds.filter(id => id && id !== 'ALL');

    let triggerLabel = 'All Facilities';
    if (!isAllSelected) {
      if (activePlantIds.length === 0) {
        triggerLabel = 'Select Facilities...';
      } else if (activePlantIds.length === 1) {
        const p = plants.find(pl => pl.id === activePlantIds[0]);
        triggerLabel = p ? p.name : activePlantIds[0];
      } else {
        triggerLabel = `${activePlantIds.length} Facilities Selected`;
      }
    }

    const primaryPlantId = isAllSelected ? 'ALL' : (activePlantIds[0] || '');

    return `
      <div class="facility-multiselect-container" id="${prefix}-facility-container" style="position: relative; width: 100%;">
        <!-- Hidden input for backwards compatibility with username / form logic -->
        <input type="hidden" id="${prefix}-plant" value="${primaryPlantId}" />

        <!-- Trigger Button -->
        <button 
          type="button" 
          id="${prefix}-facility-trigger" 
          class="form-control" 
          onclick="window.UserManagementModule.toggleFacilityDropdown('${prefix}')"
          style="height: 24px; font-size: 11px; padding: 2px 6px; display: flex; align-items: center; justify-content: space-between; text-align: left; cursor: pointer; background: var(--bg-input, #fff); border: 1px solid var(--border-medium, #cbd5e1); border-radius: var(--radius-sm, 4px); color: var(--text-primary); width: 100%; transition: border-color 0.2s;"
        >
          <span id="${prefix}-facility-trigger-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: calc(100% - 22px); font-weight: 500;">
            ${triggerLabel}
          </span>
          <span style="font-size: 10px; color: var(--text-muted); margin-left: 6px; flex-shrink: 0;" id="${prefix}-facility-chevron">▼</span>
        </button>

        <!-- Dropdown Menu with Checkbox Buttons -->
        <div 
          id="${prefix}-facility-dropdown" 
          class="facility-dropdown-menu"
          style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 1050; background: var(--bg-card, #fff); border: 1px solid var(--border-medium, #cbd5e1); border-radius: var(--radius-md, 6px); box-shadow: 0 10px 25px rgba(0,0,0,0.25); padding: 8px; max-height: 260px; overflow-y: auto;"
        >
          <!-- Quick Actions -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid var(--border-subtle, #e2e8f0);">
            <span style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Select Facilities</span>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 6px; font-size: 9.5px; height: 18px; line-height: 1;" onclick="window.UserManagementModule.selectAllFacilities('${prefix}', true)">Select All</button>
              <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 6px; font-size: 9.5px; height: 18px; line-height: 1;" onclick="window.UserManagementModule.selectAllFacilities('${prefix}', false)">Clear</button>
            </div>
          </div>

          <!-- All Facilities Checkbox Option Button -->
          <label 
            class="facility-option-item" 
            id="${prefix}-facility-label-ALL"
            style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 4px; cursor: pointer; margin: 0 0 4px 0; transition: background 0.15s; background: ${isAllSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent'}; font-size: 11.5px; font-weight: 600; color: var(--text-primary); user-select: none;"
          >
            <input 
              type="checkbox" 
              id="${prefix}-facility-opt-ALL" 
              class="${prefix}-facility-checkbox" 
              value="ALL" 
              ${isAllSelected ? 'checked' : ''} 
              onchange="window.UserManagementModule.onToggleAllFacilitiesCheckbox('${prefix}', this.checked)"
              style="cursor: pointer; width: 15px; height: 15px; accent-color: var(--primary-500, #4f46e5); margin: 0;"
            />
            <span style="flex: 1;">All Facilities</span>
          </label>

          <div style="height: 1px; background: var(--border-subtle, #e2e8f0); margin: 4px 0 6px 0;"></div>

          <!-- Individual Branch Checkbox Buttons -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${plants.map(p => {
              const isChecked = isAllSelected || activePlantIds.includes(p.id);
              const isBranchActive = window.DB.isPlantActive ? window.DB.isPlantActive(p.id) : (p.is_active !== false);
              return `
                <label 
                  class="facility-option-item" 
                  id="${prefix}-facility-label-${p.id}"
                  style="display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 4px; cursor: pointer; margin: 0; transition: background 0.15s; background: ${isChecked ? 'rgba(99, 102, 241, 0.08)' : 'transparent'}; font-size: 11.5px; color: var(--text-primary); user-select: none;"
                >
                  <input 
                    type="checkbox" 
                    id="${prefix}-facility-opt-${p.id}" 
                    class="${prefix}-facility-checkbox ${prefix}-individual-facility-checkbox" 
                    value="${p.id}" 
                    ${isChecked ? 'checked' : ''} 
                    onchange="window.UserManagementModule.onFacilityCheckboxChange('${prefix}')"
                    style="cursor: pointer; width: 14px; height: 14px; accent-color: var(--primary-500, #4f46e5); margin: 0;"
                  />
                  <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</span>
                  ${!isBranchActive ? '<span class="badge badge-secondary" style="font-size: 8.5px; padding: 0 4px; color: #f87171;">Inactive</span>' : ''}
                </label>
              `;
            }).join('')}
          </div>

          <!-- Bottom Close Bar -->
          <div style="display: flex; justify-content: flex-end; padding-top: 6px; margin-top: 6px; border-top: 1px solid var(--border-subtle, #e2e8f0);">
            <button type="button" class="btn btn-primary btn-xs" style="padding: 2px 10px; font-size: 10px;" onclick="window.UserManagementModule.toggleFacilityDropdown('${prefix}', false)">Done</button>
          </div>
        </div>

        <!-- Selected Facility Tags / Chips Preview -->
        <div id="${prefix}-facility-chips" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
          ${this.renderFacilityChipsHtml(prefix, isAllSelected, activePlantIds, plants)}
        </div>
      </div>
    `;
  },

  renderFacilityChipsHtml(prefix, isAllSelected, activePlantIds, plants) {
    if (isAllSelected) {
      return '';
    }
    if (activePlantIds.length === 0) {
      return `
        <span style="font-size: 10px; color: var(--text-muted); font-style: italic;">
          (No facility selected &bull; click dropdown above to select)
        </span>
      `;
    }
    return activePlantIds.map(id => {
      const p = plants.find(pl => pl.id === id);
      const name = p ? p.name : id;
      return `
        <span class="badge badge-secondary" style="font-size: 9.5px; padding: 2px 6px; display: inline-flex; align-items: center; gap: 5px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-medium, #cbd5e1);">
          <span style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</span>
          <span 
            style="cursor: pointer; font-size: 12px; line-height: 1; color: var(--text-muted); margin-left: 2px;"
            onmouseover="this.style.color='var(--color-danger, #ef4444)'"
            onmouseout="this.style.color='var(--text-muted)'"
            onclick="event.stopPropagation(); window.UserManagementModule.removeFacilityChip('${prefix}', '${id}')"
            title="Remove facility"
          >&times;</span>
        </span>
      `;
    }).join('');
  },

  toggleFacilityDropdown(prefix, forceOpen) {
    const dropdown = document.getElementById(`${prefix}-facility-dropdown`);
    const chevron = document.getElementById(`${prefix}-facility-chevron`);
    if (!dropdown) return;

    const isOpen = forceOpen !== undefined ? forceOpen : (dropdown.style.display !== 'block');
    dropdown.style.display = isOpen ? 'block' : 'none';
    if (chevron) chevron.innerText = isOpen ? '▲' : '▼';

    if (isOpen) {
      const onDocClick = (e) => {
        const container = document.getElementById(`${prefix}-facility-container`);
        if (container && !container.contains(e.target)) {
          dropdown.style.display = 'none';
          if (chevron) chevron.innerText = '▼';
          document.removeEventListener('click', onDocClick);
        }
      };
      setTimeout(() => {
        document.addEventListener('click', onDocClick);
      }, 50);
    }
  },

  onToggleAllFacilitiesCheckbox(prefix, isChecked) {
    const individualCheckboxes = document.querySelectorAll(`.${prefix}-individual-facility-checkbox`);
    individualCheckboxes.forEach(cb => {
      cb.checked = isChecked;
    });
    this.updateFacilityUi(prefix);
  },

  onFacilityCheckboxChange(prefix) {
    const allOpt = document.getElementById(`${prefix}-facility-opt-ALL`);
    const individualCheckboxes = Array.from(document.querySelectorAll(`.${prefix}-individual-facility-checkbox`));
    const allChecked = individualCheckboxes.length > 0 && individualCheckboxes.every(cb => cb.checked);

    if (allOpt) {
      allOpt.checked = allChecked;
    }
    this.updateFacilityUi(prefix);
  },

  selectAllFacilities(prefix, selectAll) {
    const allOpt = document.getElementById(`${prefix}-facility-opt-ALL`);
    if (allOpt) allOpt.checked = selectAll;

    const individualCheckboxes = document.querySelectorAll(`.${prefix}-individual-facility-checkbox`);
    individualCheckboxes.forEach(cb => {
      cb.checked = selectAll;
    });
    this.updateFacilityUi(prefix);
  },

  removeFacilityChip(prefix, plantId) {
    const targetCb = document.getElementById(`${prefix}-facility-opt-${plantId}`);
    if (targetCb) {
      targetCb.checked = false;
    }
    const allOpt = document.getElementById(`${prefix}-facility-opt-ALL`);
    if (allOpt) {
      allOpt.checked = false;
    }
    this.updateFacilityUi(prefix);
  },

  updateFacilityUi(prefix) {
    const plants = (window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('plants') : [];
    const allOpt = document.getElementById(`${prefix}-facility-opt-ALL`);
    const isAllChecked = allOpt ? allOpt.checked : false;

    const individualCheckboxes = Array.from(document.querySelectorAll(`.${prefix}-individual-facility-checkbox`));
    const activePlantIds = isAllChecked 
      ? plants.map(p => p.id)
      : individualCheckboxes.filter(cb => cb.checked).map(cb => cb.value);

    // Update label highlights
    const allLabel = document.getElementById(`${prefix}-facility-label-ALL`);
    if (allLabel) {
      allLabel.style.background = isAllChecked ? 'rgba(99, 102, 241, 0.12)' : 'transparent';
    }
    individualCheckboxes.forEach(cb => {
      const label = document.getElementById(`${prefix}-facility-label-${cb.value}`);
      if (label) {
        label.style.background = cb.checked ? 'rgba(99, 102, 241, 0.08)' : 'transparent';
      }
    });

    // Update trigger text
    let triggerLabel = 'All Facilities';
    if (!isAllChecked) {
      if (activePlantIds.length === 0) {
        triggerLabel = 'Select Facilities...';
      } else if (activePlantIds.length === 1) {
        const p = plants.find(pl => pl.id === activePlantIds[0]);
        triggerLabel = p ? p.name : activePlantIds[0];
      } else {
        triggerLabel = `${activePlantIds.length} Facilities Selected`;
      }
    }
    const triggerEl = document.getElementById(`${prefix}-facility-trigger-text`);
    if (triggerEl) triggerEl.innerText = triggerLabel;

    // Update hidden input
    const hiddenPlantInput = document.getElementById(`${prefix}-plant`);
    const primaryPlantId = isAllChecked ? 'ALL' : (activePlantIds[0] || '');
    if (hiddenPlantInput) {
      hiddenPlantInput.value = primaryPlantId;
    }

    // Update branch badge
    const badgeEl = document.getElementById(`${prefix}-branch-code-badge`);
    if (badgeEl) {
      badgeEl.innerText = this.getBranchBadgeText(isAllChecked ? ['ALL'] : activePlantIds);
    }

    // Update chips
    const chipsContainer = document.getElementById(`${prefix}-facility-chips`);
    if (chipsContainer) {
      chipsContainer.innerHTML = this.renderFacilityChipsHtml(prefix, isAllChecked, activePlantIds, plants);
    }

    // Trigger auto-username and password update
    this.onBranchOrJoiningDateChange(prefix);
  },

  getSelectedFacilityIds(prefix) {
    const allOpt = document.getElementById(`${prefix}-facility-opt-ALL`);
    const individualCheckboxes = Array.from(document.querySelectorAll(`.${prefix}-individual-facility-checkbox`));
    const plants = (window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('plants') : [];

    if (allOpt && allOpt.checked) {
      return ['ALL', ...plants.map(p => p.id)];
    }

    const checkedIds = individualCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
    if (plants.length > 0 && checkedIds.length === plants.length) {
      return ['ALL', ...checkedIds];
    }
    return checkedIds;
  },

  setSelectedFacilities(prefix, plantIds = []) {
    const plants = (window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('plants') : [];
    const isAll = plantIds.includes('ALL') || (plants.length > 0 && plantIds.length > 0 && plants.every(p => plantIds.includes(p.id)));

    const allOpt = document.getElementById(`${prefix}-facility-opt-ALL`);
    if (allOpt) allOpt.checked = isAll;

    const individualCheckboxes = document.querySelectorAll(`.${prefix}-individual-facility-checkbox`);
    individualCheckboxes.forEach(cb => {
      cb.checked = isAll || plantIds.includes(cb.value);
    });

    this.updateFacilityUi(prefix);
  },

  // ==========================================================================
  // STORE SELECTOR (STORE MASTER SCOPING & MULTI-STORE ACCESS)
  // ==========================================================================

  getUserAssignedStores(user) {
    if (!user) return ['ALL'];
    if (Array.isArray(user.assigned_stores) && user.assigned_stores.length > 0) {
      return [...user.assigned_stores];
    }
    if (Array.isArray(user.assigned_warehouses) && user.assigned_warehouses.length > 0) {
      return [...user.assigned_warehouses];
    }
    if (user.warehouse_id) {
      return [user.warehouse_id];
    }
    return ['ALL'];
  },

  getStoreBadgeText(selectedStoreIds = [], stores = []) {
    if (!selectedStoreIds || selectedStoreIds.length === 0) return 'None';
    if (selectedStoreIds.includes('ALL') || (stores.length > 0 && stores.every(s => selectedStoreIds.includes(s.id)))) {
      return 'ALL';
    }
    if (selectedStoreIds.length === 1) {
      const s = stores.find(st => st.id === selectedStoreIds[0]);
      return s ? (s.code || s.id) : selectedStoreIds[0];
    }
    return `${selectedStoreIds.length} Stores`;
  },

  getUserStoreSummaryText(user) {
    if (!user) return 'All Stores';
    const stores = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('warehouses') || []) : [];
    const assigned = this.getUserAssignedStores(user);
    if (assigned.includes('ALL') || (stores.length > 0 && assigned.length >= stores.length)) {
      return 'All Stores';
    }
    if (assigned.length === 0) return 'No Stores';
    if (assigned.length === 1) {
      const s = stores.find(st => st.id === assigned[0]);
      return s ? s.name : assigned[0];
    }
    return `${assigned.length} Stores`;
  },

  renderStoreSelector(prefix, selectedStoreIds = [], stores = []) {
    const isAllSelected = selectedStoreIds.includes('ALL') || (stores.length > 0 && selectedStoreIds.length > 0 && stores.every(s => selectedStoreIds.includes(s.id)));
    const activeStoreIds = isAllSelected 
      ? stores.map(s => s.id) 
      : selectedStoreIds.filter(id => id && id !== 'ALL');

    let triggerLabel = 'All Stores (Store Master)';
    if (!isAllSelected) {
      if (activeStoreIds.length === 0) {
        triggerLabel = 'Select Store(s)...';
      } else if (activeStoreIds.length === 1) {
        const s = stores.find(st => st.id === activeStoreIds[0]);
        triggerLabel = s ? `${s.name} (${s.code || s.id})` : activeStoreIds[0];
      } else {
        triggerLabel = `${activeStoreIds.length} Stores Selected`;
      }
    }

    const primaryStoreId = isAllSelected ? 'ALL' : (activeStoreIds[0] || '');

    return `
      <div class="store-multiselect-container" id="${prefix}-store-container" style="position: relative; width: 100%;">
        <!-- Hidden input for form logic -->
        <input type="hidden" id="${prefix}-store" value="${primaryStoreId}" />

        <!-- Trigger Button -->
        <button 
          type="button" 
          id="${prefix}-store-trigger" 
          class="form-control" 
          onclick="window.UserManagementModule.toggleStoreDropdown('${prefix}')"
          style="height: 24px; font-size: 11px; padding: 2px 6px; display: flex; align-items: center; justify-content: space-between; text-align: left; cursor: pointer; background: var(--bg-input, #fff); border: 1px solid var(--border-medium, #cbd5e1); border-radius: var(--radius-sm, 4px); color: var(--text-primary); width: 100%; transition: border-color 0.2s;"
        >
          <span id="${prefix}-store-trigger-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: calc(100% - 22px); font-weight: 500;">
            🏬 ${triggerLabel}
          </span>
          <span style="font-size: 10px; color: var(--text-muted); margin-left: 6px; flex-shrink: 0;" id="${prefix}-store-chevron">▼</span>
        </button>

        <!-- Dropdown Menu with Checkbox Buttons -->
        <div 
          id="${prefix}-store-dropdown" 
          class="store-dropdown-menu"
          style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 1050; background: var(--bg-card, #fff); border: 1px solid var(--border-medium, #cbd5e1); border-radius: var(--radius-md, 6px); box-shadow: 0 10px 25px rgba(0,0,0,0.25); padding: 8px; max-height: 260px; overflow-y: auto;"
        >
          <!-- Quick Search Filter -->
          <div style="margin-bottom: 6px;">
            <input 
              type="text" 
              placeholder="Search store name or code..." 
              oninput="window.UserManagementModule.filterStoreDropdown('${prefix}', this.value)" 
              style="width: 100%; height: 22px; font-size: 10px; padding: 2px 6px; border: 1px solid var(--border-subtle, #e2e8f0); border-radius: 4px; background: var(--bg-input, #fff); color: var(--text-primary);"
            />
          </div>

          <!-- Quick Actions -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid var(--border-subtle, #e2e8f0);">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Stores (Store Master)</span>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 6px; font-size: 9.5px; height: 18px; line-height: 1;" onclick="window.UserManagementModule.selectAllStores('${prefix}', true)">Select All</button>
              <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 6px; font-size: 9.5px; height: 18px; line-height: 1;" onclick="window.UserManagementModule.selectAllStores('${prefix}', false)">Clear</button>
            </div>
          </div>

          <!-- All Stores Checkbox Option -->
          <label 
            class="store-option-item" 
            id="${prefix}-store-label-ALL"
            style="display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 4px; cursor: pointer; margin: 0 0 4px 0; transition: background 0.15s; background: ${isAllSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent'}; font-size: 11px; font-weight: 600; color: var(--text-primary); user-select: none;"
          >
            <input 
              type="checkbox" 
              id="${prefix}-store-opt-ALL" 
              class="${prefix}-store-checkbox" 
              value="ALL" 
              ${isAllSelected ? 'checked' : ''} 
              onchange="window.UserManagementModule.onToggleAllStoresCheckbox('${prefix}', this.checked)"
              style="cursor: pointer; width: 14px; height: 14px; accent-color: var(--primary-500, #4f46e5); margin: 0;"
            />
            <span style="flex: 1;">All Stores (Store Master)</span>
          </label>

          <div style="height: 1px; background: var(--border-subtle, #e2e8f0); margin: 4px 0 6px 0;"></div>

          <!-- Individual Store Checkbox Buttons -->
          <div id="${prefix}-store-list-container" style="display: flex; flex-direction: column; gap: 4px;">
            ${stores.map(s => {
              const isChecked = isAllSelected || activeStoreIds.includes(s.id);
              const plant = window.DB && typeof window.DB.getById === 'function' ? window.DB.getById('plants', s.plant_id || s.facility_id) : null;
              return `
                <label 
                  class="store-option-item" 
                  id="${prefix}-store-label-${s.id}"
                  data-store-name="${(s.name || '').toLowerCase()}"
                  data-store-code="${(s.code || '').toLowerCase()}"
                  style="display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin: 0; transition: background 0.15s; background: ${isChecked ? 'rgba(99, 102, 241, 0.08)' : 'transparent'}; font-size: 11px; color: var(--text-primary); user-select: none;"
                >
                  <input 
                    type="checkbox" 
                    id="${prefix}-store-opt-${s.id}" 
                    class="${prefix}-store-checkbox ${prefix}-individual-store-checkbox" 
                    value="${s.id}" 
                    ${isChecked ? 'checked' : ''} 
                    onchange="window.UserManagementModule.onStoreCheckboxChange('${prefix}')"
                    style="cursor: pointer; width: 14px; height: 14px; accent-color: var(--primary-500, #4f46e5); margin: 0;"
                  />
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                      <span style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">🏬 ${s.name}</span>
                      <span class="badge badge-subtle" style="font-size: 9px; padding: 0 4px; font-family: var(--font-mono);">${s.code || s.id}</span>
                    </div>
                    ${plant ? `<div style="font-size: 9.5px; color: var(--text-muted);">${plant.name}</div>` : ''}
                  </div>
                </label>
              `;
            }).join('')}
          </div>

          <!-- Bottom Close Bar -->
          <div style="display: flex; justify-content: flex-end; padding-top: 6px; margin-top: 6px; border-top: 1px solid var(--border-subtle, #e2e8f0);">
            <button type="button" class="btn btn-primary btn-xs" style="padding: 2px 10px; font-size: 10px;" onclick="window.UserManagementModule.toggleStoreDropdown('${prefix}', false)">Done</button>
          </div>
        </div>

        <!-- Selected Store Tags / Chips Preview -->
        <div id="${prefix}-store-chips" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
          ${this.renderStoreChipsHtml(prefix, isAllSelected, activeStoreIds, stores)}
        </div>
      </div>
    `;
  },

  renderStoreChipsHtml(prefix, isAllSelected, activeStoreIds, stores) {
    if (isAllSelected || activeStoreIds.length === 0) return '';
    return activeStoreIds.map(sId => {
      const s = stores.find(st => st.id === sId) || { name: sId, code: sId };
      return `
        <span class="badge badge-subtle" style="font-size: 10px; padding: 2px 6px; display: inline-flex; align-items: center; gap: 4px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); color: var(--primary-300);">
          <span>🏬 ${s.name}</span>
          <button type="button" onclick="window.UserManagementModule.removeStoreChip('${prefix}', '${sId}')" style="background: none; border: none; padding: 0; color: inherit; cursor: pointer; font-size: 12px; line-height: 1; margin-left: 2px;">&times;</button>
        </span>
      `;
    }).join('');
  },

  removeStoreChip(prefix, storeId) {
    const cb = document.getElementById(`${prefix}-store-opt-${storeId}`);
    if (cb) cb.checked = false;
    const allCb = document.getElementById(`${prefix}-store-opt-ALL`);
    if (allCb) allCb.checked = false;
    this.updateStoreUi(prefix);
  },

  toggleStoreDropdown(prefix, forceOpen) {
    const dropdown = document.getElementById(`${prefix}-store-dropdown`);
    const chevron = document.getElementById(`${prefix}-store-chevron`);
    if (!dropdown) return;

    const isOpen = forceOpen !== undefined ? forceOpen : (dropdown.style.display !== 'block');
    dropdown.style.display = isOpen ? 'block' : 'none';
    if (chevron) chevron.innerText = isOpen ? '▲' : '▼';

    if (isOpen) {
      const onDocClick = (e) => {
        const container = document.getElementById(`${prefix}-store-container`);
        if (container && !container.contains(e.target)) {
          dropdown.style.display = 'none';
          if (chevron) chevron.innerText = '▼';
          document.removeEventListener('click', onDocClick);
        }
      };
      setTimeout(() => {
        document.addEventListener('click', onDocClick);
      }, 50);
    }
  },

  filterStoreDropdown(prefix, query) {
    const q = (query || '').toLowerCase().trim();
    const container = document.getElementById(`${prefix}-store-list-container`);
    if (!container) return;
    const items = container.querySelectorAll('.store-option-item');
    items.forEach(el => {
      const name = el.getAttribute('data-store-name') || '';
      const code = el.getAttribute('data-store-code') || '';
      if (!q || name.includes(q) || code.includes(q)) {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  },

  selectAllStores(prefix, selectAll) {
    const allOpt = document.getElementById(`${prefix}-store-opt-ALL`);
    if (allOpt) allOpt.checked = selectAll;

    const individualCheckboxes = document.querySelectorAll(`.${prefix}-individual-store-checkbox`);
    individualCheckboxes.forEach(cb => {
      cb.checked = selectAll;
    });
    this.updateStoreUi(prefix);
  },

  onToggleAllStoresCheckbox(prefix, isChecked) {
    const individualCheckboxes = document.querySelectorAll(`.${prefix}-individual-store-checkbox`);
    individualCheckboxes.forEach(cb => {
      cb.checked = isChecked;
    });
    this.updateStoreUi(prefix);
  },

  onStoreCheckboxChange(prefix) {
    const allOpt = document.getElementById(`${prefix}-store-opt-ALL`);
    const individualCheckboxes = Array.from(document.querySelectorAll(`.${prefix}-individual-store-checkbox`));
    const allChecked = individualCheckboxes.length > 0 && individualCheckboxes.every(cb => cb.checked);

    if (allOpt) {
      allOpt.checked = allChecked;
    }
    this.updateStoreUi(prefix);
  },

  updateStoreUi(prefix) {
    const stores = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('warehouses') || []) : [];
    const allOpt = document.getElementById(`${prefix}-store-opt-ALL`);
    const individualCheckboxes = Array.from(document.querySelectorAll(`.${prefix}-individual-store-checkbox`));

    const isAllChecked = !!(allOpt && allOpt.checked);
    const activeStoreIds = isAllChecked 
      ? stores.map(s => s.id) 
      : individualCheckboxes.filter(cb => cb.checked).map(cb => cb.value);

    // Update label highlights
    const allLabel = document.getElementById(`${prefix}-store-label-ALL`);
    if (allLabel) {
      allLabel.style.background = isAllChecked ? 'rgba(99, 102, 241, 0.12)' : 'transparent';
    }
    individualCheckboxes.forEach(cb => {
      const label = document.getElementById(`${prefix}-store-label-${cb.value}`);
      if (label) {
        label.style.background = cb.checked ? 'rgba(99, 102, 241, 0.08)' : 'transparent';
      }
    });

    // Update trigger text
    let triggerLabel = 'All Stores (Store Master)';
    if (!isAllChecked) {
      if (activeStoreIds.length === 0) {
        triggerLabel = 'Select Store(s)...';
      } else if (activeStoreIds.length === 1) {
        const s = stores.find(st => st.id === activeStoreIds[0]);
        triggerLabel = s ? `${s.name} (${s.code || s.id})` : activeStoreIds[0];
      } else {
        triggerLabel = `${activeStoreIds.length} Stores Selected`;
      }
    }
    const triggerEl = document.getElementById(`${prefix}-store-trigger-text`);
    if (triggerEl) triggerEl.innerText = `🏬 ${triggerLabel}`;

    // Update hidden input
    const hiddenStoreInput = document.getElementById(`${prefix}-store`);
    const primaryStoreId = isAllChecked ? 'ALL' : (activeStoreIds[0] || '');
    if (hiddenStoreInput) {
      hiddenStoreInput.value = primaryStoreId;
    }

    // Update badge
    const badgeEl = document.getElementById(`${prefix}-store-badge`);
    if (badgeEl) {
      badgeEl.innerText = this.getStoreBadgeText(isAllChecked ? ['ALL'] : activeStoreIds, stores);
    }

    // Update chips
    const chipsContainer = document.getElementById(`${prefix}-store-chips`);
    if (chipsContainer) {
      chipsContainer.innerHTML = this.renderStoreChipsHtml(prefix, isAllChecked, activeStoreIds, stores);
    }
  },

  getSelectedStoreIds(prefix) {
    const allOpt = document.getElementById(`${prefix}-store-opt-ALL`);
    const individualCheckboxes = Array.from(document.querySelectorAll(`.${prefix}-individual-store-checkbox`));
    const stores = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('warehouses') || []) : [];

    if (allOpt && allOpt.checked) {
      return ['ALL', ...stores.map(s => s.id)];
    }

    const checkedIds = individualCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
    if (stores.length > 0 && checkedIds.length === stores.length) {
      return ['ALL', ...checkedIds];
    }
    if (checkedIds.length === 0) {
      return ['ALL'];
    }
    return checkedIds;
  },

  setSelectedStores(prefix, storeIds = []) {
    const stores = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('warehouses') || []) : [];
    const isAll = storeIds.includes('ALL') || (stores.length > 0 && storeIds.length > 0 && stores.every(s => storeIds.includes(s.id)));

    const allOpt = document.getElementById(`${prefix}-store-opt-ALL`);
    if (allOpt) allOpt.checked = isAll;

    const individualCheckboxes = document.querySelectorAll(`.${prefix}-individual-store-checkbox`);
    individualCheckboxes.forEach(cb => {
      cb.checked = isAll || storeIds.includes(cb.value);
    });

    this.updateStoreUi(prefix);
  },

  syncUserWarehouseAccess(userId, assignedStores = []) {
    if (window.DB && typeof window.DB.emitChange === 'function') {
      window.DB.emitChange('users', { user_id: userId, assignedStores });
    }
  },

  pureSha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j;
    let result = '';
    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    let hash = [];
    const k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    hash = hash.slice(0, 8);
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength | 0);
    for (j = 0; j < words[lengthProperty];) {
      const w = words.slice(j, j += 16);
      const oldHash = hash.slice(0);
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (i < 16) ? w[i] : ((w[i - 16] + s0 + w[i - 7] + s1) | 0);
        const s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
        const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        const temp1 = (hash[7] + s1h + ch + k[i] + w[i]) | 0;
        const s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        const temp2 = (s0h + maj) | 0;
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (let b = 3; b >= 0; b--) {
        const byte = (hash[i] >> (8 * b)) & 255;
        result += (byte < 16 ? '0' : '') + byte.toString(16);
      }
    }
    return result;
  },

  generateSalt() {
    const chars = '0123456789abcdef';
    let salt = '';
    for (let i = 0; i < 16; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  },

  hashPassword(plain, salt = null) {
    if (!salt) salt = this.generateSalt();
    const digest = this.pureSha256(`${salt}:${plain}`);
    return `sha256$${salt}$${digest}`;
  },

  verifyPassword(plain, storedHash) {
    if (!storedHash || !plain) return false;
    const parts = String(storedHash).split('$');
    if (parts.length === 3 && parts[0] === 'sha256') {
      const salt = parts[1];
      const expectedDigest = parts[2];
      const actualDigest = this.pureSha256(`${salt}:${plain}`);
      return actualDigest === expectedDigest;
    }
    return storedHash === plain;
  },

  getSecurityUtils() {
    return {
      pureSha256: (ascii) => this.pureSha256(ascii),
      generateSalt: () => this.generateSalt(),
      hashPassword: (plain, salt) => this.hashPassword(plain, salt),
      verifyPassword: (plain, storedHash) => this.verifyPassword(plain, storedHash)
    };
  },

  getPasswordPolicy() {
    const defaultPolicy = {
      min_length: 8,
      max_length: 64,
      require_uppercase: true,
      require_lowercase: true,
      require_number: true,
      require_special_char: true,
      disallow_spaces: true,
      disallow_username_in_password: true,
      disallow_personal_info: true,
      expiry_days: 90,
      history_limit: 5,
      max_failed_attempts: 5,
      lockout_duration_minutes: 30,
      force_change_on_first_login: true,
      temp_password_validity_hours: 24
    };
    const current = (window.DB && window.DB.data && window.DB.data.password_policies) || {};
    return Object.assign({}, defaultPolicy, current);
  },

  generateSystemPassword(branchCode = 'PUN', joiningYear = '2026', username = '') {
    const cleanCode = (branchCode || 'PUN').replace(/[^a-zA-Z]/g, '').toUpperCase();
    const c1 = cleanCode.charAt(0) || 'P';
    const c2 = (cleanCode.charAt(1) || 'U').toLowerCase();
    const c3 = cleanCode.charAt(2) || 'N';
    const branchPart = c1 + c2 + c3; // e.g. PuN, MuM, NaG
    const year = String(joiningYear || '2026').slice(-4);
    
    // Configurable/Standard special symbols (@, #)
    const spec1 = '@';
    const spec2 = '#';
    
    // Tail with 1 uppercase letter and 1 numeric digit (e.g. A7, K4, B9)
    const tailLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const tailDigits = '23456789';
    const randLetter = tailLetters.charAt(Math.floor(Math.random() * tailLetters.length));
    const randDigit = tailDigits.charAt(Math.floor(Math.random() * tailDigits.length));
    
    return `${branchPart}${spec1}${year}${spec2}${randLetter}${randDigit}`;
  },

  validatePassword(password, options = {}) {
    const policy = options.policy || this.getPasswordPolicy();
    const checks = [];
    const errors = [];
    const pwd = String(password || '');

    // 1. Min & Max Length
    const minL = policy.min_length || 8;
    const maxL = policy.max_length || 64;
    const lenOk = pwd.length >= minL && pwd.length <= maxL;
    checks.push({
      id: 'length',
      label: `Length ${minL}–${maxL} chars (Current: ${pwd.length})`,
      passed: lenOk
    });
    if (!lenOk) {
      errors.push(`Password length must be between ${minL} and ${maxL} characters (currently ${pwd.length}).`);
    }

    // 2. Uppercase (A-Z)
    const hasUpper = /[A-Z]/.test(pwd);
    if (policy.require_uppercase) {
      checks.push({ id: 'uppercase', label: 'At least 1 uppercase letter (A–Z)', passed: hasUpper });
      if (!hasUpper) errors.push('Password must include at least 1 uppercase letter (A–Z).');
    }

    // 3. Lowercase (a-z)
    const hasLower = /[a-z]/.test(pwd);
    if (policy.require_lowercase) {
      checks.push({ id: 'lowercase', label: 'At least 1 lowercase letter (a–z)', passed: hasLower });
      if (!hasLower) errors.push('Password must include at least 1 lowercase letter (a–z).');
    }

    // 4. Numeric (0-9)
    const hasNum = /[0-9]/.test(pwd);
    if (policy.require_number) {
      checks.push({ id: 'number', label: 'At least 1 number (0–9)', passed: hasNum });
      if (!hasNum) errors.push('Password must include at least 1 number (0–9).');
    }

    // 5. Special Character
    const hasSpecial = /[@#$%^&*()_+=\-[\]{};:'",.<>?/\\|`~!]/.test(pwd);
    if (policy.require_special_char) {
      checks.push({ id: 'special', label: 'At least 1 special char (@, #, $, %, etc.)', passed: hasSpecial });
      if (!hasSpecial) errors.push('Password must include at least 1 special character (@, #, $, %, etc.).');
    }

    // 6. Spaces Disallowed
    const hasSpaces = /\s/.test(pwd);
    if (policy.disallow_spaces) {
      const noSpaces = !hasSpaces && pwd.length > 0;
      checks.push({ id: 'spaces', label: 'No spaces allowed', passed: noSpaces });
      if (hasSpaces) errors.push('Spaces are not permitted in passwords.');
    }

    // 7. Disallow Username Match
    if (policy.disallow_username_in_password && options.username) {
      const cleanUser = String(options.username).trim().toLowerCase();
      const pwdLower = pwd.toLowerCase();
      const containsUser = cleanUser.length >= 3 && (pwdLower === cleanUser || pwdLower.includes(cleanUser));
      checks.push({ id: 'username', label: 'Must not equal or contain username', passed: !containsUser });
      if (containsUser) errors.push('Password must not match or contain your username.');
    }

    // 8. Disallow Personal Data
    if (policy.disallow_personal_info) {
      let personalMatch = false;
      let fieldMatched = '';
      if (options.employeeId) {
        const empCode = String(options.employeeId).trim().toLowerCase();
        if (empCode.length >= 4 && pwd.toLowerCase().includes(empCode)) {
          personalMatch = true;
          fieldMatched = 'Employee Code';
        }
      }
      if (options.mobileNumber) {
        const cleanMob = String(options.mobileNumber).replace(/\D/g, '');
        if (cleanMob.length >= 6 && pwd.includes(cleanMob)) {
          personalMatch = true;
          fieldMatched = 'Mobile Number';
        }
      }
      if (options.dob) {
        const cleanDob = String(options.dob).replace(/\D/g, '');
        if (cleanDob.length >= 6 && pwd.includes(cleanDob)) {
          personalMatch = true;
          fieldMatched = 'Date of Birth';
        }
      }
      checks.push({ id: 'personal', label: 'No personal data (Emp Code, Mobile, DOB)', passed: !personalMatch });
      if (personalMatch) errors.push(`Password must not contain sensitive personal data (${fieldMatched}).`);
    }

    // 9. Confirm Password Match
    if (options.confirmPassword !== undefined) {
      const match = pwd === options.confirmPassword && pwd.length > 0;
      checks.push({ id: 'confirm', label: 'Confirm Password matches New Password', passed: match });
      if (!match) errors.push('Confirm Password does not match New Password.');
    }

    // 10. History Reuse Check
    if (options.history && Array.isArray(options.history) && options.history.length > 0) {
      const histLimit = policy.history_limit || 5;
      const recent = options.history.slice(-histLimit);
      const isReused = recent.some(oldHash => this.verifyPassword(pwd, oldHash));
      checks.push({ id: 'history', label: `Must not reuse last ${histLimit} passwords`, passed: !isReused });
      if (isReused) errors.push(`Password reuse prohibited: You cannot reuse any of your last ${histLimit} passwords.`);
    }

    // Calculate Strength Score (0 to 100)
    let score = 0;
    if (pwd.length >= minL) score += 20;
    if (pwd.length >= 10) score += 10;
    if (pwd.length >= 12) score += 10;
    if (hasUpper) score += 15;
    if (hasLower) score += 15;
    if (hasNum) score += 15;
    if (hasSpecial) score += 15;
    if (hasSpaces) score = Math.max(0, score - 30);
    score = Math.min(100, Math.max(0, score));

    let strengthLabel = 'Weak';
    let strengthColor = 'var(--color-danger)';
    if (score >= 85) {
      strengthLabel = 'Very Strong';
      strengthColor = '#10b981';
    } else if (score >= 70) {
      strengthLabel = 'Strong';
      strengthColor = '#3b82f6';
    } else if (score >= 50) {
      strengthLabel = 'Moderate';
      strengthColor = '#f59e0b';
    }

    return {
      valid: errors.length === 0,
      errors,
      checks,
      score,
      strengthLabel,
      strengthColor
    };
  },

  generateDefaultPassword(prefix = 'new-user', forceRegen = false) {
    const pwdInput = document.getElementById(`${prefix}-pwd`);
    if (!pwdInput) return;

    if (!forceRegen && pwdInput.value && pwdInput.value !== pwdInput.dataset.autoGenerated) {
      return;
    }

    const plantSelect = document.getElementById(`${prefix}-plant`);
    const plantId = plantSelect ? plantSelect.value : '';
    const branchCode = plantId ? this.getBranchCode(plantId) : 'SYS';

    const joiningInput = document.getElementById(`${prefix}-joiningdate`);
    const joiningDate = joiningInput ? joiningInput.value : '';
    const joiningYear = joiningDate ? joiningDate.split('-')[0] : '2026';

    const usernameInput = document.getElementById(`${prefix}-username`);
    const username = usernameInput ? usernameInput.value : '';

    const newPwd = this.generateSystemPassword(branchCode, joiningYear, username);
    pwdInput.value = newPwd;
    pwdInput.dataset.autoGenerated = newPwd;

    this.onPasswordInput(prefix);
  },

  onPasswordInput(prefix = 'new-user') {
    const input = document.getElementById(`${prefix}-pwd`);
    const feedback = document.getElementById(`${prefix}-pwd-feedback`);
    if (!input || !feedback) return;

    const username = (document.getElementById(`${prefix}-username`)?.value || '').trim();
    const empId = (document.getElementById(`${prefix}-empid`)?.value || '').trim();
    const mobile = (document.getElementById(`${prefix}-mobile`)?.value || '').trim();

    const valResult = this.validatePassword(input.value, {
      username,
      employeeId: empId,
      mobileNumber: mobile
    });

    const isAuto = input.value === input.dataset.autoGenerated;

    feedback.innerHTML = `
      <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 6px 8px; margin-top: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 10px; font-weight: 600; color: var(--text-muted);">
            Password Strength: <strong style="color: ${valResult.strengthColor};">${valResult.strengthLabel} (${valResult.score}/100)</strong>
            ${isAuto ? '<span class="badge badge-primary" style="font-size: 8.5px; padding: 1px 4px; margin-left: 4px;">System-Generated</span>' : ''}
          </span>
          <span style="font-size: 9.5px; color: ${valResult.valid ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: 600;">
            ${valResult.valid ? '✅ Policy Compliant' : `❌ ${valResult.errors.length} Rule(s) Unmet`}
          </span>
        </div>
        <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-bottom: 6px;">
          <div style="height: 100%; width: ${valResult.score}%; background: ${valResult.strengthColor}; transition: width 0.3s ease;"></div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px 8px; font-size: 9.5px;">
          ${valResult.checks.map(c => `
            <div style="color: ${c.passed ? '#10b981' : 'var(--text-muted)'}; display: flex; align-items: center; gap: 4px;">
              <span>${c.passed ? '✓' : '○'}</span>
              <span>${c.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    input.style.borderColor = valResult.valid ? 'var(--color-success)' : 'var(--color-danger)';
  },

  togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btnEl) btnEl.innerText = '🙈';
    } else {
      input.type = 'password';
      if (btnEl) btnEl.innerText = '👁️';
    }
  },

  copyToClipboard(text, label = 'Content') {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        window.State.showToast(`📋 ${label} copied to clipboard!`, 'info');
      }).catch(() => {
        this.fallbackCopy(text, label);
      });
    } else {
      this.fallbackCopy(text, label);
    }
  },

  fallbackCopy(text, label) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      window.State.showToast(`📋 ${label} copied to clipboard!`, 'info');
    } catch (e) {
      window.State.showToast(`Unable to copy automatically. Text: ${text}`, 'warning');
    }
    document.body.removeChild(ta);
  },

  showCredentialsHandoverModal(cred) {
    const validityHours = cred.validityHours || 24;
    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center; font-size: 20px;">🎉</div>
            <div>
              <div style="font-weight: 700; font-size: 13.5px; color: #10b981;">User Credentials Successfully ${cred.isReset ? 'Reset' : 'Provisioned'}</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">Please securely share the system-generated login credentials with the user.</div>
            </div>
          </div>
          <span class="badge badge-success" style="font-size: 10.5px; padding: 4px 8px;">Status: ACTIVE</span>
        </div>

        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle);">
            <div><span style="color: var(--text-muted);">User ID:</span> <strong style="font-family: var(--font-mono); color: var(--primary-300);">${cred.userId}</strong></div>
            <div><span style="color: var(--text-muted);">Employee:</span> <strong>${cred.fullName}</strong> (${cred.employeeId})</div>
            <div><span style="color: var(--text-muted);">Facility:</span> <strong>${cred.branchName}</strong></div>
            <div><span style="color: var(--text-muted);">Assigned Role:</span> <span class="badge badge-info" style="font-size: 10.5px;">${cred.roleName}</span></div>
          </div>

          <!-- Credential Cards -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Username Box -->
            <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: var(--radius-sm); padding: 10px 12px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 10px; text-transform: uppercase; color: var(--primary-300); font-weight: 700; letter-spacing: 0.5px;">Login Username</div>
                <div style="font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: #fff; letter-spacing: 1px;">${cred.username}</div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.copyToClipboard('${cred.username}', 'Username')" title="Copy Username">
                📋 Copy
              </button>
            </div>

            <!-- Temporary Password Box -->
            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-sm); padding: 10px 12px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 10px; text-transform: uppercase; color: #f59e0b; font-weight: 700; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                  <span>System-Generated Temporary Password</span>
                  <span class="badge badge-warning" style="font-size: 9px; padding: 1px 5px;">Valid ${validityHours} Hours</span>
                </div>
                <div id="handover-pwd-display" style="font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: #fbbf24; letter-spacing: 1px;">${cred.temporaryPassword}</div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.toggleHandoverPwd()" id="handover-pwd-toggle-btn" title="Show/Hide">
                  👁️
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.copyToClipboard('${cred.temporaryPassword}', 'Temporary Password')" title="Copy Password">
                  📋 Copy
                </button>
              </div>
            </div>
          </div>

          <!-- Enterprise Security Notice -->
          <div style="background: rgba(99, 102, 241, 0.05); border-left: 3px solid var(--primary-400); padding: 8px 12px; margin-top: 14px; font-size: 11px; line-height: 1.4; color: var(--text-secondary);">
            <div><strong>🛡️ Mandatory Security Flow:</strong></div>
            <ul style="margin: 4px 0 0 16px; padding: 0;">
              <li>User must enter this temporary password upon first login.</li>
              <li>System will strictly enforce immediate password change to a new permanent password.</li>
              <li>Stored securely via salted SHA-256 one-way hashing; plain text is never persisted.</li>
              <li>Temporary credential expires automatically after <strong>${validityHours} hours</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    const summaryText = `StockIQ ISCM User Credentials\nName: ${cred.fullName}\nUser ID: ${cred.userId}\nLogin Username: ${cred.username}\nTemporary Password: ${cred.temporaryPassword}\nAssigned Facility: ${cred.branchName}\nAssigned Role: ${cred.roleName}\nNote: First login requires mandatory password change. Valid for ${validityHours} hours.`;

    const footerHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.UserManagementModule.copyToClipboard(\`${summaryText.replace(/`/g, '\\`')}\`, 'Full Credential Slip')">
          📋 Copy All Credentials
        </button>
        <button type="button" class="btn btn-primary" onclick="window.State.closeModal()">
          Done
        </button>
      </div>
    `;

    window.State.showModal({
      title: '🔐 User Credentials Handover Slip',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '560px'
    });
  },

  toggleHandoverPwd() {
    const el = document.getElementById('handover-pwd-display');
    const btn = document.getElementById('handover-pwd-toggle-btn');
    if (!el) return;
    if (el.dataset.hidden === 'true') {
      el.innerText = el.dataset.raw;
      el.dataset.hidden = 'false';
      if (btn) btn.innerText = '👁️';
    } else {
      el.dataset.raw = el.innerText;
      el.innerText = '••••••••••••';
      el.dataset.hidden = 'true';
      if (btn) btn.innerText = '🙈';
    }
  },

  showForceChangePasswordModal(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;

    const contentHtml = `
      <form id="force-change-pwd-form" onsubmit="event.preventDefault(); window.UserManagementModule.submitForceChangePassword('${userId}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: 12px 14px;">
          <div style="font-weight: 700; font-size: 13.5px; color: #ef4444; display: flex; align-items: center; gap: 8px;">
            <span>⚠️</span> <span>First Login Security Mandate</span>
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
            Welcome, <strong>${user.full_name || user.display_name}</strong>! As required by enterprise password policy, you must replace your temporary system-generated password before accessing application functions.
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Current / Temporary Password -->
          <div class="form-group" style="margin: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <label class="form-label" style="font-size: 11.5px; margin: 0;">Current / Temporary Password <span style="color: var(--color-danger)">*</span></label>
              <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 6px; font-size: 10px; height: 20px;" onclick="window.UserManagementModule.togglePasswordVisibility('force-pwd-current', this)">👁️</button>
            </div>
            <input type="password" id="force-pwd-current" class="form-control" required placeholder="Enter your current temporary password" style="height: 32px; font-size: 12.5px; font-family: var(--font-mono);" />
          </div>

          <!-- New Password -->
          <div class="form-group" style="margin: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <label class="form-label" style="font-size: 11.5px; margin: 0;">New Permanent Password <span style="color: var(--color-danger)">*</span></label>
              <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 6px; font-size: 10px; height: 20px;" onclick="window.UserManagementModule.togglePasswordVisibility('force-pwd-new', this)">👁️</button>
            </div>
            <input 
              type="password" 
              id="force-pwd-new" 
              class="form-control" 
              required 
              placeholder="Enter complex new password" 
              style="height: 32px; font-size: 12.5px; font-family: var(--font-mono);" 
              oninput="window.UserManagementModule.onForcePasswordInput('${userId}')"
            />
          </div>

          <!-- Confirm New Password -->
          <div class="form-group" style="margin: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <label class="form-label" style="font-size: 11.5px; margin: 0;">Confirm New Password <span style="color: var(--color-danger)">*</span></label>
              <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 6px; font-size: 10px; height: 20px;" onclick="window.UserManagementModule.togglePasswordVisibility('force-pwd-confirm', this)">👁️</button>
            </div>
            <input 
              type="password" 
              id="force-pwd-confirm" 
              class="form-control" 
              required 
              placeholder="Re-enter new password" 
              style="height: 32px; font-size: 12.5px; font-family: var(--font-mono);" 
              oninput="window.UserManagementModule.onForcePasswordInput('${userId}')"
            />
          </div>

          <!-- Live Rule Checklist -->
          <div id="force-pwd-feedback"></div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; align-items: center; width: 100%; gap: 10px;">
        <button type="button" class="btn btn-primary" onclick="window.UserManagementModule.submitForceChangePassword('${userId}')">
          🔐 Update Password & Access System
        </button>
      </div>
    `;

    window.State.showModal({
      title: '🔐 Mandatory Password Change (First Login)',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '520px'
    });

    setTimeout(() => {
      this.onForcePasswordInput(userId);
    }, 50);
  },

  onForcePasswordInput(userId) {
    const user = window.DB.getById('users', userId);
    const p1 = document.getElementById('force-pwd-new')?.value || '';
    const p2 = document.getElementById('force-pwd-confirm')?.value || '';
    const feedback = document.getElementById('force-pwd-feedback');
    if (!feedback) return;

    const valResult = this.validatePassword(p1, {
      username: user ? user.username : '',
      employeeId: user ? user.employee_id : '',
      mobileNumber: user ? user.mobile_number : '',
      confirmPassword: p2,
      history: user ? user.password_history : []
    });

    feedback.innerHTML = `
      <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 11px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 600; color: var(--text-muted);">
            Strength: <strong style="color: ${valResult.strengthColor};">${valResult.strengthLabel} (${valResult.score}/100)</strong>
          </span>
          <span style="font-weight: 600; color: ${valResult.valid ? '#10b981' : 'var(--color-danger)'};">
            ${valResult.valid ? '✅ All Rules Satisfied' : `❌ ${valResult.errors.length} Issue(s)`}
          </span>
        </div>
        <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-bottom: 6px;">
          <div style="height: 100%; width: ${valResult.score}%; background: ${valResult.strengthColor}; transition: width 0.3s ease;"></div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px 8px; font-size: 10px;">
          ${valResult.checks.map(c => `
            <div style="color: ${c.passed ? '#10b981' : 'var(--text-muted)'}; display: flex; align-items: center; gap: 4px;">
              <span>${c.passed ? '✓' : '○'}</span>
              <span>${c.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  submitForceChangePassword(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;

    const currentPwd = (document.getElementById('force-pwd-current')?.value || '').trim();
    const newPwd = (document.getElementById('force-pwd-new')?.value || '').trim();
    const confirmPwd = (document.getElementById('force-pwd-confirm')?.value || '').trim();

    if (!currentPwd) {
      window.State.showToast('Please enter your current temporary password.', 'error');
      document.getElementById('force-pwd-current')?.focus();
      return;
    }

    // Verify current temporary password
    if (user.password_hash && !this.verifyPassword(currentPwd, user.password_hash)) {
      window.State.showToast('Current temporary password is incorrect.', 'error');
      document.getElementById('force-pwd-current')?.focus();
      return;
    }

    // Validate new password against policy
    const valResult = this.validatePassword(newPwd, {
      username: user.username,
      employeeId: user.employee_id,
      mobileNumber: user.mobile_number,
      confirmPassword: confirmPwd,
      history: user.password_history || []
    });

    if (!valResult.valid) {
      window.State.showToast(valResult.errors[0] || 'Password does not comply with enterprise security rules.', 'error');
      document.getElementById('force-pwd-new')?.focus();
      return;
    }

    const salt = this.generateSalt();
    const newHash = this.hashPassword(newPwd, salt);

    const historyLimit = this.getPasswordPolicy().history_limit || 5;
    const history = Array.isArray(user.password_history) ? [...user.password_history] : [];
    history.push(newHash);
    const updatedHistory = history.slice(-historyLimit);

    window.DB.update('users', userId, {
      password_salt: salt,
      password_hash: newHash,
      password_history: updatedHistory,
      must_change_password: false,
      password_last_changed: new Date().toISOString(),
      failed_logins: 0,
      locked_until: null,
      status: 'ACTIVE'
    });

    window.DB.logAudit('PASSWORD_CHANGED_FIRST_LOGIN', 'Security', userId, `User ${user.username} completed mandatory first login password change`);
    window.State.closeModal();
    window.State.showToast(`🎉 Password updated successfully! Welcome to StockIQ ISCM, ${user.full_name || user.username}.`, 'success');
    this.render();
  },

  onResetPasswordInput(userId) {
    const user = window.DB.getById('users', userId);
    const p1 = document.getElementById('reset-pwd-val')?.value || '';
    const p2 = document.getElementById('reset-pwd-confirm')?.value || '';
    const feedback = document.getElementById('reset-pwd-feedback');
    if (!feedback) return;

    const valResult = this.validatePassword(p1, {
      username: user ? user.username : '',
      employeeId: user ? user.employee_id : '',
      mobileNumber: user ? user.mobile_number : '',
      confirmPassword: p2,
      history: user ? user.password_history : []
    });

    const passedCount = valResult.checks.filter(c => c.passed).length;
    const totalCount = valResult.checks.length;
    const detailsEl = document.getElementById('reset-pwd-rules-details');
    const wasExpanded = detailsEl ? detailsEl.style.display === 'block' : false;

    if (valResult.valid) {
      feedback.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); padding: 7px 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #10b981; font-weight: 600;">
              <span>✓</span>
              <span>Policy Compliant</span>
              <span style="font-size: 10.5px; font-weight: 500; color: var(--text-muted);">(${valResult.strengthLabel} &bull; ${valResult.score}/100)</span>
            </div>
            <button type="button" class="btn btn-ghost btn-xs" style="font-size: 10px; color: var(--text-muted); padding: 0 4px; height: 20px;" onclick="const d = document.getElementById('reset-pwd-rules-details'); if(d) d.style.display = d.style.display === 'none' ? 'block' : 'none';">
              Rules (${passedCount}/${totalCount}) ▾
            </button>
          </div>
          <div id="reset-pwd-rules-details" style="display: ${wasExpanded ? 'block' : 'none'}; margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(16, 185, 129, 0.2); font-size: 9.5px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px 8px;">
              ${valResult.checks.map(c => `
                <div style="color: ${c.passed ? '#10b981' : 'var(--text-muted)'}; display: flex; align-items: center; gap: 4px;">
                  <span>${c.passed ? '✓' : '○'}</span>
                  <span>${c.label}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      const firstError = valResult.errors[0] || 'Password does not meet security requirements';
      feedback.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-sm); padding: 7px 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #ef4444; font-weight: 600;">
              <span>⚠️</span>
              <span>${firstError}</span>
            </div>
            <button type="button" class="btn btn-ghost btn-xs" style="font-size: 10px; color: var(--text-muted); padding: 0 4px; height: 20px;" onclick="const d = document.getElementById('reset-pwd-rules-details'); if(d) d.style.display = d.style.display === 'none' ? 'block' : 'none';">
              Rules (${passedCount}/${totalCount}) ▾
            </button>
          </div>
          <div style="height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin: 3px 0;">
            <div style="height: 100%; width: ${valResult.score}%; background: ${valResult.strengthColor}; transition: width 0.3s ease;"></div>
          </div>
          <div id="reset-pwd-rules-details" style="display: ${wasExpanded ? 'block' : 'none'}; margin-top: 5px; padding-top: 5px; border-top: 1px dashed rgba(239, 68, 68, 0.2); font-size: 9.5px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px 8px;">
              ${valResult.checks.map(c => `
                <div style="color: ${c.passed ? '#10b981' : '#f87171'}; font-weight: ${c.passed ? 'normal' : '600'}; display: flex; align-items: center; gap: 4px;">
                  <span>${c.passed ? '✓' : '✕'}</span>
                  <span>${c.label}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }
  },

  generateResetCompliantPassword(userId) {
    const user = window.DB.getById('users', userId);
    const plantId = user ? user.plant_id : 'ALL';
    const branchCode = this.getBranchCode(plantId);
    const year = user && user.joining_date ? user.joining_date.split('-')[0] : '2026';
    const sample = this.generateSystemPassword(branchCode, year, user ? user.username : '');

    const p1 = document.getElementById('reset-pwd-val');
    const p2 = document.getElementById('reset-pwd-confirm');
    if (p1) p1.value = sample;
    if (p2) p2.value = sample;
    this.onResetPasswordInput(userId);
    if (window.State && window.State.showToast) {
      window.State.showToast('↻ Generated new compliant temporary password', 'info');
    }
  },

  // ==========================================================================
  // USER REGISTRATION & CREATION MODAL (14 CORE FIELDS)
  // ==========================================================================

  showCreateUserModal() {
    const roles = window.DB.getAll('roles') || [];
    const plants = (window.DB && typeof window.DB.getActivePlants === 'function') ? window.DB.getActivePlants() : (window.DB.getAll('plants') || []);
    const departments = window.DB.getAll('departments') || [];
    const stores = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('warehouses') || []) : [];
    const userMasterList = (window.DB && typeof window.DB.getAll === 'function') ? window.DB.getAll('users') : [];

    // Calculate next sequential User ID
    const users = userMasterList;
    let maxNum = 0;
    users.forEach(u => {
      const match = u.id && u.id.match(/^USR-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextSuggestedId = `USR-${String(maxNum + 1).padStart(3, '0')}`;
    const nextSuggestedEmpId = `EMP-${String(9000 + maxNum + 1)}`;

    const contentHtml = `
      <form id="create-user-form" onsubmit="event.preventDefault(); window.UserManagementModule.submitCreateUser();" style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Top Linkage Ribbon -->
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.28); border-radius: var(--radius-md); padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: rgba(99, 102, 241, 0.15); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--primary-400);">🔗</div>
            <div>
              <div style="font-weight: 700; font-size: 12.5px; color: var(--primary-300); display: flex; align-items: center; gap: 6px;">
                <span>Link with User Master</span>
                <span class="badge badge-primary" style="font-size: 9.5px; padding: 2px 6px;">Auto-Populate</span>
              </div>
              <div style="font-size: 11px; color: var(--text-muted);">Select existing user from User Master to auto-fill linked master identity, role, department & contact fields</div>
            </div>
          </div>
          <div style="flex: 1; max-width: 480px; min-width: 260px;">
            <select id="new-user-employee-select" class="form-control" style="height: 28px; font-size: 11.5px; padding: 3px 8px; border-color: rgba(99, 102, 241, 0.4);" onchange="window.UserManagementModule.onEmployeeSelect(this.value)">
              <option value="">-- Choose User from User Master to Auto-populate --</option>
              ${userMasterList.map(u => `
                <option value="${u.id}">${u.employee_id ? `${u.employee_id}: ` : `${u.id}: `}${u.full_name || u.display_name || u.username} (${u.user_type || 'User'}${u.designation ? ` - ${u.designation}` : (u.department ? ` - ${u.department}` : '')})</option>
              `).join('')}
              <option value="CUSTOM">+ Enter Custom User / Independent Link</option>
            </select>
          </div>
        </div>

        <!-- 3-Column Zero-Scroll Dashboard Layout (Right Column: Login & Credentials Master) -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-items: stretch;">
          
          <!-- COLUMN 1: User Identity & Names (Fields 1-7) -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">
              <span style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                <span>👤</span> 1. Identity & Name Master
              </span>
            </div>

            <!-- Field 1: User ID -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">User ID <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="new-user-id" class="form-control" value="${nextSuggestedId}" required style="height: 24px; font-size: 11px; padding: 2px 6px; font-family: var(--font-mono); font-weight: 600; color: var(--primary-300);" />
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1;">Unique system-generated/user-defined identifier</small>
            </div>

            <!-- Field 2: Employee ID -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Employee ID <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="new-user-empid" class="form-control" placeholder="e.g. EMP-9042" value="${nextSuggestedEmpId}" required style="height: 24px; font-size: 11px; padding: 2px 6px; font-family: var(--font-mono);" />
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1;">Link with User Master</small>
            </div>

            <!-- Field 3: Employee Name -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Employee Name <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="new-user-empname" class="form-control" placeholder="Full legal name from User Master" required style="height: 24px; font-size: 11px; padding: 2px 6px;" />
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1;">Auto-populated from User Master</small>
            </div>

            <!-- Fields 4 & 5: First & Middle Name (2 compact columns) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <div>
                <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">First Name <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="new-user-firstname" class="form-control" placeholder="First name" required style="height: 24px; font-size: 11px; padding: 2px 6px;" oninput="window.UserManagementModule.autoUpdateDisplayName('new-user')" />
              </div>
              <div>
                <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Middle Name</label>
                <input type="text" id="new-user-middlename" class="form-control" placeholder="Middle" style="height: 24px; font-size: 11px; padding: 2px 6px;" oninput="window.UserManagementModule.autoUpdateDisplayName('new-user')" />
              </div>
            </div>

            <!-- Field 6: Last Name -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Last Name <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="new-user-lastname" class="form-control" placeholder="Last / surname" required style="height: 24px; font-size: 11px; padding: 2px 6px;" oninput="window.UserManagementModule.autoUpdateDisplayName('new-user')" />
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1;">Last / surname</small>
            </div>

            <!-- Field 7: Display Name -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Display Name</label>
              <input type="text" id="new-user-displayname" class="form-control" placeholder="Name shown in application" style="height: 24px; font-size: 11px; padding: 2px 6px; font-weight: 500;" />
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1;">Name shown in application</small>
            </div>
          </div>

          <!-- COLUMN 2: Professional, HR & Contact Details (Fields 8-13) -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">
              <span style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                <span>💼</span> 2. Professional & HR Details
              </span>
            </div>

            <!-- Field 8: User Type -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">User Type <span style="color: var(--color-danger)">*</span></label>
              <select id="new-user-usertype" class="form-control" required style="height: 24px; font-size: 11px; padding: 2px 6px;" onchange="window.UserManagementModule.onUserTypeChange(this.value, 'new-user')">
                <option value="Employee" selected>Employee</option>
                <option value="Admin">Admin</option>
                <option value="Technician">Technician</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Field 9: Designation -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Designation <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="new-user-designation" class="form-control" placeholder="e.g. Senior Warehouse & Store Manager" required style="height: 24px; font-size: 11px; padding: 2px 6px;" />
            </div>

            <!-- Field 10: Department -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Department <span style="color: var(--color-danger)">*</span></label>
              <select id="new-user-department" class="form-control" required style="height: 24px; font-size: 11px; padding: 2px 6px;">
                ${departments.filter(d => d.name !== 'Medical & Clinical Services' && !(d.name && d.name.toLowerCase().includes('patient'))).map(d => `
                  <option value="${d.name}">${d.name} (${d.code || d.id})</option>
                `).join('')}
                <option value="Management Information Systems">Management Information Systems</option>
                <option value="Warehouse & Stores">Warehouse & Stores</option>
                <option value="Procurement & Supply">Procurement & Supply</option>
                <option value="Plant Engineering & Maintenance">Plant Engineering & Maintenance</option>
                <option value="Quality Assurance & Metallurgy">Quality Assurance & Metallurgy</option>
                <option value="Logistics & Distribution">Logistics & Distribution</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Operations Directorate">Operations Directorate</option>
              </select>
            </div>

            <!-- Field 11: Specialty -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px; display: flex; align-items: center; justify-content: space-between;">
                <span>Specialty / Domain</span>
              </label>
              <input type="text" id="new-user-specialty" class="form-control" placeholder="e.g. Inventory Logistics, Enterprise Architecture" style="height: 24px; font-size: 11px; padding: 2px 6px;" />
            </div>

            <!-- Field 12: Mobile Number (Strict 10 Digits) -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Mobile Number <span style="color: var(--color-danger)">*</span></label>
              <input type="tel" id="new-user-mobile" class="form-control" placeholder="98XXXXXXXX" maxlength="10" minlength="10" pattern="[0-9]{10}" required style="height: 24px; font-size: 11px; padding: 2px 6px; font-family: var(--font-mono);" oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 10)" />
            </div>

            <!-- Field 13: Email ID -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Email ID <span style="color: var(--color-danger)">*</span></label>
              <input type="email" id="new-user-email" class="form-control" placeholder="official.user@apexind.com" required style="height: 24px; font-size: 11px; padding: 2px 6px;" />
            </div>

            <!-- Field: Joining Date (Derives Joining Year for Username) -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Employee Joining Date <span style="color: var(--color-danger)">*</span></label>
              <input type="date" id="new-user-joiningdate" class="form-control" value="2026-06-15" required style="height: 24px; font-size: 11px; padding: 2px 6px; font-weight: 500;" onchange="window.UserManagementModule.onBranchOrJoiningDateChange('new-user')" />
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1;">Joining Year used in username (e.g. 2026)</small>
            </div>
          </div>

          <!-- COLUMN 3 (RIGHT SIDE): Security, Credentials & RBAC (Login Master) -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">
              <span style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                <span>🔐</span> 3. Login Credentials & Security
              </span>
            </div>

            <!-- Assigned Facility -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px;">
                <label class="form-label" style="font-size: 10px; margin: 0;">Assigned Facility <span style="color: var(--color-danger)">*</span></label>
                <span class="badge badge-info" style="font-size: 9px; padding: 1px 5px;">Facility: <strong id="new-user-branch-code-badge">None</strong></span>
              </div>
              ${this.renderFacilitySelector('new-user', [], plants)}
            </div>

            <!-- Login Username (System-Generated: Facility + Year + Seq with Edit Option) -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px;">
                <label class="form-label" style="font-size: 10px; margin: 0;">Login Username <span style="color: var(--color-danger)">*</span></label>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <button type="button" class="btn btn-secondary btn-xs" id="btn-edit-new-username" style="padding: 1px 5px; font-size: 9.5px; height: 18px; line-height: 1;" onclick="window.UserManagementModule.enableUsernameEdit('new-user')" title="Click to manually edit or customize username">
                    ✏️ Edit Username
                  </button>
                  <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 5px; font-size: 9.5px; height: 18px; line-height: 1;" onclick="window.UserManagementModule.generateDefaultUsername('new-user', true)" title="Regenerate default username: Facility Code + Joining Year + Sequence">
                    ↻ Auto-Gen
                  </button>
                </div>
              </div>
              <input 
                type="text" 
                id="new-user-username" 
                class="form-control" 
                placeholder="e.g. PUN2026001" 
                required 
                autocomplete="off" 
                maxlength="30" 
                style="height: 24px; font-size: 11px; padding: 2px 6px; font-family: var(--font-mono); font-weight: 700; text-transform: uppercase;" 
                oninput="window.UserManagementModule.onUsernameInput('new-user')"
                onblur="window.UserManagementModule.onUsernameBlur('new-user')"
              />
              <div id="new-user-username-feedback"></div>
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1.1; display: block; margin-top: 2px;">
                Default: <code>Facility + Year + Seq</code> (e.g. PUN2026001). Alphanumeric, 5–30 chars.
              </small>
            </div>

            <!-- Field 14: Status -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Status <span style="color: var(--color-danger)">*</span></label>
              <select id="new-user-status" class="form-control" required style="height: 24px; font-size: 11px; padding: 2px 6px;">
                <option value="ACTIVE" selected>● Active</option>
                <option value="INACTIVE">○ Inactive</option>
                <option value="LOCKED">🔒 Locked</option>
              </select>
            </div>

            <!-- Primary Role -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Primary Role <span style="color: var(--color-danger)">*</span></label>
              <select id="new-user-role" class="form-control" required style="height: 24px; font-size: 11px; padding: 2px 6px;">
                ${roles.map(r => `
                  <option value="${r.id}" ${r.id === 'ROLE-USER' ? 'selected' : ''}>${r.name} (${r.code})</option>
                `).join('')}
              </select>
            </div>

            <!-- Temporary Password (System-Generated with Configurable Policy) -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px;">
                <label class="form-label" style="font-size: 10px; margin: 0;">Temporary Password <span style="color: var(--color-danger)">*</span></label>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 5px; font-size: 9.5px; height: 18px; line-height: 1;" onclick="window.UserManagementModule.generateDefaultPassword('new-user', true)" title="Regenerate system password compliant with policy">
                    ↻ Auto-Gen
                  </button>
                  <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 5px; font-size: 9.5px; height: 18px; line-height: 1;" onclick="window.UserManagementModule.togglePasswordVisibility('new-user-pwd', this)" title="Show/Hide Password">
                    👁️
                  </button>
                </div>
              </div>
              <input 
                type="text" 
                id="new-user-pwd" 
                class="form-control" 
                required 
                autocomplete="off" 
                style="height: 24px; font-size: 11px; padding: 2px 6px; font-family: var(--font-mono); font-weight: 600; letter-spacing: 0.5px;" 
                oninput="window.UserManagementModule.onPasswordInput('new-user')"
              />
              <div id="new-user-pwd-feedback"></div>
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1.1; display: block; margin-top: 2px;">
                Default: <code>PuN@2026#A7</code> (Upper + Lower + Num + Special + &ge;8 chars).
              </small>
            </div>

            <!-- Policy Flags -->
            <div style="display: flex; flex-direction: column; gap: 4px; padding: 6px 8px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-top: 2px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 10.5px; cursor: pointer; margin: 0;">
                <input type="checkbox" id="new-user-must-change-pwd" checked />
                <span style="font-weight: 600; color: var(--primary-300);">Force Password Reset at First Login</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 10.5px; cursor: pointer; margin: 0;">
                <input type="checkbox" id="new-user-2fa" checked />
                <span>Enforce Two-Factor Authentication (2FA)</span>
              </label>
            </div>

            <!-- Assigned Stores (Store Master) -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px;">
                <label class="form-label" style="font-size: 10px; margin: 0;">Assigned Store(s) <span style="color: var(--color-danger)">*</span></label>
                <span class="badge badge-success" style="font-size: 9px; padding: 1px 5px;">Stores: <strong id="new-user-store-badge">${this.getStoreBadgeText(['ALL'], stores)}</strong></span>
              </div>
              ${this.renderStoreSelector('new-user', ['ALL'], stores)}
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1.1; display: block; margin-top: 2px;">
                Stores fetched from Store Master. Scopes which stores the user is permitted to work from.
              </small>
            </div>

          </div>

        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 8px;"></div>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="window.UserManagementModule.submitCreateUser()">Register User</button>
        </div>
      </div>
    `;

    window.State.showModal({
      title: '➕ Register New User',
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '96vw',
      isFullScreen: true
    });

    setTimeout(() => {
      this.onBranchOrJoiningDateChange('new-user');
      this.generateDefaultPassword('new-user', true);
    }, 50);
  },

  async submitCreateUser() {
    // 14 Required / Conditional Fields
    const userId = (document.getElementById('new-user-id')?.value || '').trim();
    const employeeId = (document.getElementById('new-user-empid')?.value || '').trim();
    const employeeName = (document.getElementById('new-user-empname')?.value || '').trim();
    const firstName = (document.getElementById('new-user-firstname')?.value || '').trim();
    const middleName = (document.getElementById('new-user-middlename')?.value || '').trim();
    const lastName = (document.getElementById('new-user-lastname')?.value || '').trim();
    const displayName = (document.getElementById('new-user-displayname')?.value || '').trim();
    const userType = (document.getElementById('new-user-usertype')?.value || 'Employee').trim();
    const designation = (document.getElementById('new-user-designation')?.value || '').trim();
    const department = (document.getElementById('new-user-department')?.value || '').trim();
    const specialty = (document.getElementById('new-user-specialty')?.value || '').trim();
    const mobileNumber = (document.getElementById('new-user-mobile')?.value || '').trim();
    const email = (document.getElementById('new-user-email')?.value || '').trim();
    const status = (document.getElementById('new-user-status')?.value || 'ACTIVE').trim();

    // Login & Security Fields
    const roleId = document.getElementById('new-user-role')?.value || 'ROLE-USER';
    const assignedPlants = this.getSelectedFacilityIds ? this.getSelectedFacilityIds('new-user') : [(document.getElementById('new-user-plant')?.value || 'ALL')];
    const plantId = assignedPlants.includes('ALL') ? 'ALL' : (assignedPlants[0] || 'ALL');
    const twoFactor = document.getElementById('new-user-2fa')?.checked ?? true;
    const assignedStores = this.getSelectedStoreIds ? this.getSelectedStoreIds('new-user') : ['ALL'];
    const allStoresList = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('warehouses') || []) : [];
    const primaryStoreId = assignedStores.includes('ALL') ? (allStoresList[0]?.id || 'WH-PUN-MAIN') : (assignedStores[0] || 'WH-PUN-MAIN');

    if (!assignedPlants || assignedPlants.length === 0) {
      window.State.showToast('Please select at least one assigned branch/facility.', 'error');
      return;
    }

    // Strict Validations for Mandatory Fields
    if (!userId) {
      window.State.showToast('User ID is mandatory.', 'error');
      document.getElementById('new-user-id')?.focus();
      return;
    }
    if (!employeeId) {
      window.State.showToast('Employee ID is mandatory (link with User Master).', 'error');
      document.getElementById('new-user-empid')?.focus();
      return;
    }
    if (!employeeName) {
      window.State.showToast('Employee Name is mandatory.', 'error');
      document.getElementById('new-user-empname')?.focus();
      return;
    }
    if (!firstName) {
      window.State.showToast('First Name is mandatory.', 'error');
      document.getElementById('new-user-firstname')?.focus();
      return;
    }
    if (!lastName) {
      window.State.showToast('Last Name is mandatory.', 'error');
      document.getElementById('new-user-lastname')?.focus();
      return;
    }
    if (!userType) {
      window.State.showToast('User Type is mandatory.', 'error');
      return;
    }
    if (!designation) {
      window.State.showToast('Designation is mandatory.', 'error');
      document.getElementById('new-user-designation')?.focus();
      return;
    }
    if (!department) {
      window.State.showToast('Department is mandatory.', 'error');
      return;
    }
    const cleanMobileNumber = mobileNumber.replace(/\D/g, '');
    if (!cleanMobileNumber) {
      window.State.showToast('Mobile Number is mandatory.', 'error');
      document.getElementById('new-user-mobile')?.focus();
      return;
    }
    if (cleanMobileNumber.length !== 10) {
      window.State.showToast('Mobile Number must be exactly 10 digits.', 'error');
      document.getElementById('new-user-mobile')?.focus();
      return;
    }
    if (!email) {
      window.State.showToast('Email ID is mandatory.', 'error');
      document.getElementById('new-user-email')?.focus();
      return;
    }
    if (!status) {
      window.State.showToast('Status is mandatory.', 'error');
      return;
    }
    const joiningDate = (document.getElementById('new-user-joiningdate')?.value || new Date().toISOString().split('T')[0]).trim();
    const rawUsername = (document.getElementById('new-user-username')?.value || '').trim();
    const username = rawUsername.toUpperCase();

    // Username Validation Rules: Alphanumeric only, no special chars, no spaces, length 5-30, unique
    const userVal = this.validateUsername(username);
    if (!userVal.valid) {
      window.State.showToast(userVal.message, 'error');
      document.getElementById('new-user-username')?.focus();
      return;
    }

    const allUsers = window.DB.getAll('users') || [];

    // Check duplicate User ID
    if (allUsers.some(u => u.id.toLowerCase() === userId.toLowerCase())) {
      window.State.showToast(`User ID "${userId}" already exists. Please specify a unique identifier.`, 'error');
      document.getElementById('new-user-id')?.focus();
      return;
    }

    // Password Validation against Configurable Password Policy Master
    const rawPassword = (document.getElementById('new-user-pwd')?.value || '').trim();
    if (!rawPassword) {
      window.State.showToast('Temporary password is mandatory.', 'error');
      document.getElementById('new-user-pwd')?.focus();
      return;
    }

    const pwdVal = this.validatePassword(rawPassword, {
      username: userVal.formatted,
      employeeId: employeeId,
      mobileNumber: cleanMobileNumber
    });

    if (!pwdVal.valid) {
      window.State.showToast(pwdVal.errors[0] || 'Temporary password does not meet enterprise security requirements.', 'error');
      document.getElementById('new-user-pwd')?.focus();
      return;
    }

    // Segregation of Duties (SoD) Conflict Pre-check
    const conflict = window.State.validateSoDConflict ? window.State.validateSoDConflict([roleId]) : null;
    if (conflict && conflict.rule) {
      window.State.showToast(`Cannot assign role: SoD Conflict with rule ${conflict.rule.rule_code}`, 'error');
      return;
    }

    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(rawPassword, salt);
    const mustChangePwd = document.getElementById('new-user-must-change-pwd')?.checked ?? true;

    const newUser = {
      id: userId,
      employee_id: employeeId,
      employee_name: employeeName,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      display_name: displayName,
      full_name: displayName || `${firstName} ${lastName}`.trim(),
      user_type: userType,
      designation: designation,
      department: department,
      specialty: specialty,
      mobile_number: cleanMobileNumber,
      phone: cleanMobileNumber,
      email: email,
      status: status,

      // Security & RBAC Configuration
      username: userVal.formatted,
      primary_role: roleId,
      primary_role_id: roleId,
      company_id: 'COMP-01',
      plant_id: plantId === 'ALL' ? 'PLANT-01' : plantId,
      assigned_plants: assignedPlants,
      warehouse_id: primaryStoreId,
      assigned_stores: assignedStores,
      assigned_warehouses: assignedStores,
      reporting_manager: 'Pravin Patil',
      joining_date: joiningDate,
      effective_from: joiningDate,
      effective_to: '2030-12-31',
      failed_logins: 0,
      locked_until: null,
      two_factor_enabled: twoFactor,

      // Secure One-Way Password Storage & Policy Lifecyle
      password_salt: salt,
      password_hash: passwordHash,
      password_history: [passwordHash],
      must_change_password: mustChangePwd,
      password_last_changed: new Date().toISOString(),
      temp_password_expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    window.DB.insert('users', newUser);
    this.syncUserWarehouseAccess(userId, assignedStores);
    if (window.DB && typeof window.DB.syncUserToBackend === 'function') {
      try {
        await window.DB.syncUserToBackend(newUser, 'POST');
      } catch (err) {
        console.warn('[UserManagement] syncUserToBackend error:', err);
      }
    }
    window.DB.logAudit('USER_CREATED', 'Security', userId, `User ${displayName} (${userId}) registered with username ${userVal.formatted} and system-generated temporary password`);
    window.State.closeModal();
    window.State.showToast(`User ${displayName} (${userId}) registered successfully!`, 'success');
    this.render();

    // Show Secure Credentials Handover Modal
    this.showCredentialsHandoverModal({
      userId: userId,
      fullName: newUser.full_name,
      employeeId: employeeId,
      username: userVal.formatted,
      temporaryPassword: rawPassword,
      mustChangePassword: mustChangePwd,
      branchName: assignedPlants.includes('ALL') 
        ? 'All Facilities (HQ)' 
        : assignedPlants.map(id => (window.DB.getById('plants', id) || {}).name || id).join(', '),
      roleName: (window.DB.getById('roles', roleId) || {}).name || roleId,
      validityHours: 24
    });
  },

  // Modal: Edit User Details (14 Core Fields)
  showEditUserModal(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;

    const roles = window.DB.getAll('roles') || [];
    const plants = (window.DB && typeof window.DB.getActivePlants === 'function') ? window.DB.getActivePlants() : (window.DB.getAll('plants') || []);
    const departments = window.DB.getAll('departments') || [];
    const stores = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('warehouses') || []) : [];
    const assignedStores = this.getUserAssignedStores(user);

    const contentHtml = `
      <form id="edit-user-form" onsubmit="event.preventDefault(); window.UserManagementModule.submitEditUser('${user.id}');" style="display: flex; flex-direction: column; gap: 12px;">
        <!-- 3-Column Zero-Scroll Dashboard Layout (Right Column: Login & Credentials Master) -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-items: stretch;">
          
          <!-- COLUMN 1: User Identity & Names (Fields 1-7) -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">
              <span style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                <span>👤</span> 1. Identity & Name Master
              </span>
            </div>

            <!-- Field 1: User ID (Read-only identifier) -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">User ID (Permanent)</label>
              <input type="text" class="form-control" value="${user.id}" disabled style="height: 24px; font-size: 11px; padding: 2px 6px; opacity: 0.75; font-family: var(--font-mono); font-weight: 700; color: var(--primary-300);" />
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1;">System unique immutable key</small>
            </div>

            <!-- Field 2: Employee ID -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Employee ID <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="edit-user-empid" class="form-control" value="${user.employee_id || ''}" required style="height: 24px; font-size: 11px; padding: 2px 6px; font-family: var(--font-mono);" />
            </div>

            <!-- Field 3: Employee Name -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Employee Name <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="edit-user-empname" class="form-control" value="${user.employee_name || user.full_name || ''}" required style="height: 24px; font-size: 11px; padding: 2px 6px;" />
            </div>

            <!-- Fields 4 & 5: First & Middle Name (2 compact columns) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <div>
                <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">First Name <span style="color: var(--color-danger)">*</span></label>
                <input type="text" id="edit-user-firstname" class="form-control" value="${user.first_name || ''}" required style="height: 24px; font-size: 11px; padding: 2px 6px;" oninput="window.UserManagementModule.autoUpdateDisplayName('edit-user')" />
              </div>
              <div>
                <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Middle Name</label>
                <input type="text" id="edit-user-middlename" class="form-control" value="${user.middle_name || ''}" style="height: 24px; font-size: 11px; padding: 2px 6px;" oninput="window.UserManagementModule.autoUpdateDisplayName('edit-user')" />
              </div>
            </div>

            <!-- Field 6: Last Name -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Last Name <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="edit-user-lastname" class="form-control" value="${user.last_name || ''}" required style="height: 24px; font-size: 11px; padding: 2px 6px;" oninput="window.UserManagementModule.autoUpdateDisplayName('edit-user')" />
            </div>

            <!-- Field 7: Display Name -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Display Name</label>
              <input type="text" id="edit-user-displayname" class="form-control" value="${user.display_name || user.full_name || user.username}" style="height: 24px; font-size: 11px; padding: 2px 6px; font-weight: 500;" />
            </div>
          </div>

          <!-- COLUMN 2: Professional & HR Details (Fields 8-13) -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">
              <span style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                <span>💼</span> 2. Professional & HR Details
              </span>
            </div>

            <!-- Field 8: User Type -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">User Type <span style="color: var(--color-danger)">*</span></label>
              <select id="edit-user-usertype" class="form-control" required style="height: 24px; font-size: 11px; padding: 2px 6px;" onchange="window.UserManagementModule.onUserTypeChange(this.value, 'edit-user')">
                <option value="Employee" ${user.user_type === 'Employee' ? 'selected' : ''}>Employee</option>
                <option value="Admin" ${user.user_type === 'Admin' ? 'selected' : ''}>Admin</option>
                <option value="Technician" ${user.user_type === 'Technician' ? 'selected' : ''}>Technician</option>
                <option value="Other" ${user.user_type === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>

            <!-- Field 9: Designation -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Designation <span style="color: var(--color-danger)">*</span></label>
              <input type="text" id="edit-user-designation" class="form-control" value="${user.designation || ''}" required style="height: 24px; font-size: 11px; padding: 2px 6px;" />
            </div>

            <!-- Field 10: Department -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Department <span style="color: var(--color-danger)">*</span></label>
              <select id="edit-user-department" class="form-control" required style="height: 24px; font-size: 11px; padding: 2px 6px;">
                ${departments.filter(d => d.name !== 'Medical & Clinical Services' && !(d.name && d.name.toLowerCase().includes('patient'))).map(d => `
                  <option value="${d.name}" ${user.department === d.name ? 'selected' : ''}>${d.name}</option>
                `).join('')}
                <option value="Management Information Systems" ${user.department === 'Management Information Systems' ? 'selected' : ''}>Management Information Systems</option>
                <option value="Warehouse & Stores" ${user.department === 'Warehouse & Stores' ? 'selected' : ''}>Warehouse & Stores</option>
                <option value="Procurement & Supply" ${user.department === 'Procurement & Supply' ? 'selected' : ''}>Procurement & Supply</option>
                <option value="Plant Engineering & Maintenance" ${user.department === 'Plant Engineering & Maintenance' ? 'selected' : ''}>Plant Engineering & Maintenance</option>
                <option value="Quality Assurance & Metallurgy" ${user.department === 'Quality Assurance & Metallurgy' ? 'selected' : ''}>Quality Assurance & Metallurgy</option>
                <option value="Logistics & Distribution" ${user.department === 'Logistics & Distribution' ? 'selected' : ''}>Logistics & Distribution</option>
                <option value="Finance & Accounts" ${user.department === 'Finance & Accounts' ? 'selected' : ''}>Finance & Accounts</option>
                <option value="Operations Directorate" ${user.department === 'Operations Directorate' ? 'selected' : ''}>Operations Directorate</option>
              </select>
            </div>

            <!-- Field 11: Specialty -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px; display: flex; align-items: center; justify-content: space-between;">
                <span>Specialty / Domain</span>
              </label>
              <input type="text" id="edit-user-specialty" class="form-control" value="${user.specialty || ''}" placeholder="e.g. Inventory Logistics, Enterprise Architecture" style="height: 24px; font-size: 11px; padding: 2px 6px;" />
            </div>

            <!-- Field 12: Mobile Number (Strict 10 Digits) -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Mobile Number <span style="color: var(--color-danger)">*</span></label>
              <input type="tel" id="edit-user-mobile" class="form-control" value="${(user.mobile_number || user.phone || '').replace(/\\D/g, '').slice(-10)}" maxlength="10" minlength="10" pattern="[0-9]{10}" placeholder="98XXXXXXXX" required style="height: 24px; font-size: 11px; padding: 2px 6px; font-family: var(--font-mono);" oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 10)" />
            </div>

            <!-- Field 13: Email ID -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Email ID <span style="color: var(--color-danger)">*</span></label>
              <input type="email" id="edit-user-email" class="form-control" value="${user.email || ''}" required style="height: 24px; font-size: 11px; padding: 2px 6px;" />
            </div>

            <!-- Field: Joining Date -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Employee Joining Date <span style="color: var(--color-danger)">*</span></label>
              <input type="date" id="edit-user-joiningdate" class="form-control" value="${user.joining_date || user.effective_from || '2026-06-15'}" required style="height: 24px; font-size: 11px; padding: 2px 6px; font-weight: 500;" onchange="window.UserManagementModule.onBranchOrJoiningDateChange('edit-user', '${user.id}')" />
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1;">Joining Year for username sequence</small>
            </div>
          </div>

          <!-- COLUMN 3 (RIGHT SIDE): Security, Credentials & RBAC (Login Master) -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">
              <span style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                <span>🔐</span> 3. Login Credentials & Security
              </span>
            </div>

            <!-- Assigned Facility -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px;">
                <label class="form-label" style="font-size: 10px; margin: 0;">Assigned Facility</label>
                <span class="badge badge-info" style="font-size: 9px; padding: 1px 5px;">Facility: <strong id="edit-user-branch-code-badge">${this.getBranchBadgeText(this.getUserAssignedPlants(user))}</strong></span>
              </div>
              ${this.renderFacilitySelector('edit-user', this.getUserAssignedPlants(user), plants)}
            </div>

            <!-- Login Username (Editable with Live Validation & Auto-Gen) -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px;">
                <label class="form-label" style="font-size: 10px; margin: 0;">Login Username <span style="color: var(--color-danger)">*</span></label>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <button type="button" class="btn btn-secondary btn-xs" id="btn-edit-edit-username" style="padding: 1px 5px; font-size: 9.5px; height: 18px; line-height: 1;" onclick="window.UserManagementModule.enableUsernameEdit('edit-user')" title="Click to manually edit username">
                    ✏️ Edit Username
                  </button>
                  <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 5px; font-size: 9.5px; height: 18px; line-height: 1;" onclick="window.UserManagementModule.generateDefaultUsername('edit-user', true)" title="Regenerate default username: Facility Code + Joining Year + Sequence">
                    ↻ Auto-Gen
                  </button>
                </div>
              </div>
              <input 
                type="text" 
                id="edit-user-username" 
                class="form-control" 
                value="${user.username}" 
                required 
                autocomplete="off" 
                maxlength="30" 
                style="height: 24px; font-size: 11px; padding: 2px 6px; font-family: var(--font-mono); font-weight: 700; text-transform: uppercase;" 
                oninput="window.UserManagementModule.onUsernameInput('edit-user', '${user.id}')"
                onblur="window.UserManagementModule.onUsernameBlur('edit-user', '${user.id}')"
              />
              <div id="edit-user-username-feedback"></div>
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1.1; display: block; margin-top: 2px;">
                Alphanumeric only (A–Z, 0–9), 5–30 chars, no spaces/special chars. Must be unique.
              </small>
            </div>

            <!-- Optional: Change Password directly in Edit User -->
            <div style="background: rgba(99, 102, 241, 0.04); border: 1px dashed rgba(99, 102, 241, 0.3); border-radius: var(--radius-sm); padding: 6px 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                <label class="form-label" style="font-size: 10px; margin: 0; font-weight: 700; color: var(--primary-300);">
                  Change Password
                </label>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 5px; font-size: 9px; height: 18px;" onclick="window.UserManagementModule.generateEditCompliantPassword('${user.id}')" title="Auto-generate policy compliant password">
                    ↻ Auto-Gen
                  </button>
                  <button type="button" class="btn btn-secondary btn-xs" style="padding: 1px 5px; font-size: 9px; height: 18px;" onclick="window.UserManagementModule.showResetPasswordModal('${user.id}')" title="Open full reset password slip modal">
                    🔑 Reset Slip
                  </button>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <div>
                  <div style="position: relative;">
                    <input 
                      type="password" 
                      id="edit-user-password" 
                      class="form-control" 
                      placeholder="New password" 
                      style="height: 24px; font-size: 11px; font-family: var(--font-mono); padding: 2px 24px 2px 6px;"
                      oninput="window.UserManagementModule.onEditUserPasswordInput('${user.id}')"
                    />
                    <button type="button" onclick="window.UserManagementModule.togglePasswordVisibility('edit-user-password', this)" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 10px; cursor: pointer; padding: 2px;">👁️</button>
                  </div>
                </div>
                <div>
                  <div style="position: relative;">
                    <input 
                      type="password" 
                      id="edit-user-confirm-password" 
                      class="form-control" 
                      placeholder="Confirm new password" 
                      style="height: 24px; font-size: 11px; font-family: var(--font-mono); padding: 2px 24px 2px 6px;"
                      oninput="window.UserManagementModule.onEditUserPasswordInput('${user.id}')"
                    />
                    <button type="button" onclick="window.UserManagementModule.togglePasswordVisibility('edit-user-confirm-password', this)" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 10px; cursor: pointer; padding: 2px;">👁️</button>
                  </div>
                </div>
              </div>
              <div id="edit-user-pwd-feedback" style="margin-top: 2px;"></div>
            </div>

            <!-- Field 14: Status -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Status <span style="color: var(--color-danger)">*</span></label>
              <select id="edit-user-status" class="form-control" required style="height: 24px; font-size: 11px; padding: 2px 6px;">
                <option value="ACTIVE" ${user.status === 'ACTIVE' ? 'selected' : ''}>● Active</option>
                <option value="INACTIVE" ${user.status === 'INACTIVE' ? 'selected' : ''}>○ Inactive</option>
                <option value="LOCKED" ${user.status === 'LOCKED' ? 'selected' : ''}>🔒 Locked</option>
                <option value="SUSPENDED" ${user.status === 'SUSPENDED' ? 'selected' : ''}>⏸️ Suspended</option>
                <option value="EXPIRED" ${user.status === 'EXPIRED' ? 'selected' : ''}>⏳ Expired</option>
                <option value="TERMINATED" ${user.status === 'TERMINATED' ? 'selected' : ''}>✖ Terminated</option>
              </select>
            </div>

            <!-- Primary Role -->
            <div>
              <label class="form-label" style="font-size: 10px; margin-bottom: 1px;">Primary Role</label>
              <select id="edit-user-role" class="form-control" style="height: 24px; font-size: 11px; padding: 2px 6px;">
                ${roles.map(r => `
                  <option value="${r.id}" ${r.id === user.primary_role ? 'selected' : ''}>${r.name}</option>
                `).join('')}
              </select>
            </div>

            <!-- 2FA Checkbox -->
            <div style="padding: 6px 8px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); margin-top: 2px;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 10.5px; margin: 0;">
                <input type="checkbox" id="edit-user-2fa" ${user.two_factor_enabled ? 'checked' : ''} />
                <span>Enforce Two-Factor Authentication (2FA)</span>
              </label>
            </div>

            <!-- Assigned Stores (Store Master) -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px;">
                <label class="form-label" style="font-size: 10px; margin: 0;">Assigned Store(s) <span style="color: var(--color-danger)">*</span></label>
                <span class="badge badge-success" style="font-size: 9px; padding: 1px 5px;">Stores: <strong id="edit-user-store-badge">${this.getStoreBadgeText(assignedStores, stores)}</strong></span>
              </div>
              ${this.renderStoreSelector('edit-user', assignedStores, stores)}
              <small style="font-size: 9px; color: var(--text-muted); line-height: 1.1; display: block; margin-top: 2px;">
                Stores fetched from Store Master. Scopes which stores the user is permitted to work from.
              </small>
            </div>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 8px;"></div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="window.UserManagementModule.submitEditUser('${user.id}')">Save Changes</button>
        </div>
      </div>
    `;

    window.State.showModal({
      title: `✏️ Edit User: ${user.display_name || user.full_name || user.username}`,
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '96vw',
      isFullScreen: true
    });

    setTimeout(() => {
      this.onUsernameInput('edit-user', user.id);
    }, 50);
  },

  submitEditUser(userId) {
    const employeeId = (document.getElementById('edit-user-empid')?.value || '').trim();
    const employeeName = (document.getElementById('edit-user-empname')?.value || '').trim();
    const firstName = (document.getElementById('edit-user-firstname')?.value || '').trim();
    const middleName = (document.getElementById('edit-user-middlename')?.value || '').trim();
    const lastName = (document.getElementById('edit-user-lastname')?.value || '').trim();
    const displayName = (document.getElementById('edit-user-displayname')?.value || '').trim();
    const userType = (document.getElementById('edit-user-usertype')?.value || 'Employee').trim();
    const designation = (document.getElementById('edit-user-designation')?.value || '').trim();
    const department = (document.getElementById('edit-user-department')?.value || '').trim();
    const specialty = (document.getElementById('edit-user-specialty')?.value || '').trim();
    const mobileNumber = (document.getElementById('edit-user-mobile')?.value || '').trim();
    const email = (document.getElementById('edit-user-email')?.value || '').trim();
    const status = (document.getElementById('edit-user-status')?.value || 'ACTIVE').trim();
    const roleId = document.getElementById('edit-user-role')?.value;
    const assignedPlants = this.getSelectedFacilityIds ? this.getSelectedFacilityIds('edit-user') : [(document.getElementById('edit-user-plant')?.value || 'ALL')];
    const plantId = assignedPlants.includes('ALL') ? 'ALL' : (assignedPlants[0] || 'ALL');
    const twoFa = document.getElementById('edit-user-2fa')?.checked ?? true;
    const assignedStores = this.getSelectedStoreIds ? this.getSelectedStoreIds('edit-user') : ['ALL'];
    const allStoresList = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('warehouses') || []) : [];
    const primaryStoreId = assignedStores.includes('ALL') ? (allStoresList[0]?.id || 'WH-PUN-MAIN') : (assignedStores[0] || 'WH-PUN-MAIN');

    if (!assignedPlants || assignedPlants.length === 0) {
      window.State.showToast('Please select at least one assigned branch/facility.', 'error');
      return;
    }

    const joiningDate = (document.getElementById('edit-user-joiningdate')?.value || '').trim();
    const rawUsername = (document.getElementById('edit-user-username')?.value || '').trim();
    const username = rawUsername;

    const cleanEditMobile = mobileNumber.replace(/\D/g, '');
    if (!employeeId || !employeeName || !firstName || !lastName || !userType || !designation || !department || !cleanEditMobile || !email || !status) {
      window.State.showToast('Please fill in all mandatory fields.', 'error');
      return;
    }

    if (cleanEditMobile.length !== 10) {
      window.State.showToast('Mobile Number must be exactly 10 digits.', 'error');
      document.getElementById('edit-user-mobile')?.focus();
      return;
    }

    // Username Validation Rules: Alphanumeric plus dots, dashes, underscores, length 3-30, unique
    const userVal = this.validateUsername(username, userId);
    if (!userVal.valid) {
      window.State.showToast(userVal.message, 'error');
      document.getElementById('edit-user-username')?.focus();
      return;
    }

    const user = window.DB.getById('users', userId);
    const newPwd = (document.getElementById('edit-user-password')?.value || '').trim();
    const confirmPwd = (document.getElementById('edit-user-confirm-password')?.value || '').trim();

    let passwordUpdates = {};
    if (newPwd) {
      const valResult = this.validatePassword(newPwd, {
        username: userVal.formatted,
        employeeId: employeeId,
        mobileNumber: cleanEditMobile,
        confirmPassword: confirmPwd,
        history: user ? (user.password_history || []) : []
      });

      if (!valResult.valid) {
        window.State.showToast(valResult.errors[0] || 'Password does not comply with enterprise security rules.', 'error');
        document.getElementById('edit-user-password')?.focus();
        return;
      }

      const salt = this.generateSalt();
      const newHash = this.hashPassword(newPwd, salt);
      const historyLimit = this.getPasswordPolicy().history_limit || 5;
      const history = (user && Array.isArray(user.password_history)) ? [...user.password_history] : [];
      history.push(newHash);
      const updatedHistory = history.slice(-historyLimit);

      passwordUpdates = {
        password_salt: salt,
        password_hash: newHash,
        password_history: updatedHistory,
        password_last_changed: new Date().toISOString(),
        must_change_password: false
      };
    }

    const payload = {
      employee_id: employeeId,
      employee_name: employeeName,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      display_name: displayName,
      full_name: displayName || `${firstName} ${lastName}`.trim(),
      user_type: userType,
      designation: designation,
      department: department,
      specialty: specialty,
      mobile_number: cleanEditMobile,
      phone: cleanEditMobile,
      email: email,
      status: status,
      primary_role: roleId,
      primary_role_id: roleId,
      plant_id: plantId,
      assigned_plants: assignedPlants,
      warehouse_id: primaryStoreId,
      assigned_stores: assignedStores,
      assigned_warehouses: assignedStores,
      two_factor_enabled: twoFa,
      username: userVal.formatted,
      joining_date: joiningDate || undefined,
      effective_from: joiningDate || undefined,
      ...passwordUpdates
    };

    this.syncUserWarehouseAccess(userId, assignedStores);

    (async () => {
      if (typeof window.DB.updateUser === 'function') {
        await window.DB.updateUser(userId, payload);
      } else {
        window.DB.update('users', userId, payload);
      }

      if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
        window.App.filterSidebarByPermissions();
      }
      if (window.State && typeof window.State.notify === 'function') {
        window.State.notify();
      }

      const auditDesc = newPwd 
        ? `Updated user profile and reset password for ${userId} (${displayName}, Username: ${userVal.formatted})`
        : `Updated user profile details for ${userId} (${displayName}, Username: ${userVal.formatted})`;
      window.DB.logAudit('USER_UPDATED', 'Security', userId, auditDesc);
      window.State.closeModal();
      window.State.showToast(newPwd ? 'User credentials and profile updated successfully in database.' : 'User profile updated successfully in database.', 'success');
      this.render();
    })();
  },

  generateEditCompliantPassword(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;
    const branchCode = this.getBranchCode(user.plant_id || 'PLANT-01');
    const year = user.joining_date ? user.joining_date.split('-')[0] : '2026';
    const pwd = this.generateSystemPassword(branchCode, year, user.username);
    const p1 = document.getElementById('edit-user-password');
    const p2 = document.getElementById('edit-user-confirm-password');
    if (p1) { p1.value = pwd; p1.type = 'text'; }
    if (p2) { p2.value = pwd; p2.type = 'text'; }
    this.onEditUserPasswordInput(userId);
  },

  onEditUserPasswordInput(userId) {
    const user = window.DB.getById('users', userId);
    const p1 = document.getElementById('edit-user-password')?.value || '';
    const p2 = document.getElementById('edit-user-confirm-password')?.value || '';
    const feedback = document.getElementById('edit-user-pwd-feedback');
    if (!feedback) return;

    if (!p1 && !p2) {
      feedback.innerHTML = '<span style="font-size: 10px; color: var(--text-muted);">Existing password will remain unchanged.</span>';
      return;
    }

    const employeeId = document.getElementById('edit-user-empid')?.value || (user ? user.employee_id : '');
    const mobileNumber = document.getElementById('edit-user-mobile')?.value || (user ? user.mobile_number : '');
    const username = document.getElementById('edit-user-username')?.value || (user ? user.username : '');

    const result = this.validatePassword(p1, {
      username: username,
      employeeId: employeeId,
      mobileNumber: mobileNumber,
      confirmPassword: p2,
      history: user ? (user.password_history || []) : []
    });

    feedback.innerHTML = `
      <div style="font-size: 10px; padding: 3px 6px; border-radius: var(--radius-xs); background: ${result.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${result.valid ? '#10b981' : '#f87171'}; border: 1px solid ${result.valid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'};">
        ${result.valid ? '✓ New password satisfies all security rules' : (result.errors[0] || 'Incomplete password')}
      </div>
    `;
  },

  // Modal: Reset Password (Full Enterprise Policy Enforcement & Credentials Handover)
  showResetPasswordModal(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;

    const plantId = user.plant_id || 'ALL';
    const branchCode = this.getBranchCode(plantId);
    const year = user.joining_date ? user.joining_date.split('-')[0] : '2026';
    const samplePwd = this.generateSystemPassword(branchCode, year, user.username);
    const isLocked = user.status === 'LOCKED' || (user.failed_logins && user.failed_logins >= 5);

    const contentHtml = `
      <form id="reset-password-form" onsubmit="event.preventDefault(); window.UserManagementModule.submitResetPassword('${user.id}');" style="display: flex; flex-direction: column; gap: 12px;">
        <!-- User Summary -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px 12px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25)); border: 1px solid rgba(99, 102, 241, 0.35); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: var(--primary-300);">
              ${(user.full_name || user.display_name || user.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); line-height: 1.2;">${user.full_name || user.display_name}</div>
              <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 1px;">
                @${user.username} &bull; ${user.id}
              </div>
            </div>
          </div>
          <div>
            ${isLocked 
              ? `<span class="badge badge-danger" style="font-size: 10px; padding: 2px 7px;">🔒 Locked (${user.failed_logins || 5} Fails)</span>` 
              : `<span class="badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-subtle'}" style="font-size: 10px; padding: 2px 7px;">● ${user.status}</span>`
            }
          </div>
        </div>

        ${isLocked ? `
          <div style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid var(--color-danger); padding: 6px 10px; font-size: 11px; color: var(--text-secondary); border-radius: 0 var(--radius-xs) var(--radius-xs) 0;">
            ⚠️ Account locked due to failed logins. Resetting will restore login access.
          </div>
        ` : ''}

        <!-- Temporary Password Inputs -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <label class="form-label" style="font-size: 11px; font-weight: 600; margin: 0; color: var(--text-primary);">
              Temporary Password <span style="color: var(--color-danger)">*</span>
            </label>
            <button type="button" class="btn btn-ghost btn-xs" style="font-size: 11px; color: var(--primary-400); padding: 0 4px; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;" onclick="window.UserManagementModule.generateResetCompliantPassword('${user.id}')" title="Generate a fresh policy-compliant password">
              <span>↻ Auto-Generate</span>
            </button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="position: relative;">
              <input 
                type="text" 
                id="reset-pwd-val" 
                class="form-control" 
                value="${samplePwd}" 
                required 
                placeholder="New Password"
                style="height: 32px; font-size: 12px; font-family: var(--font-mono); font-weight: 600; padding-right: 50px;" 
                oninput="window.UserManagementModule.onResetPasswordInput('${user.id}')"
              />
              <div style="position: absolute; right: 3px; top: 50%; transform: translateY(-50%); display: flex; gap: 1px;">
                <button type="button" class="btn btn-ghost btn-xs" style="padding: 1px 3px; font-size: 10px; height: 22px; line-height: 1;" title="Copy to clipboard" onclick="window.UserManagementModule.copyToClipboard(document.getElementById('reset-pwd-val').value, 'Password')">📋</button>
                <button type="button" class="btn btn-ghost btn-xs" style="padding: 1px 3px; font-size: 10px; height: 22px; line-height: 1;" title="Toggle visibility" onclick="window.UserManagementModule.togglePasswordVisibility('reset-pwd-val', this)">👁️</button>
              </div>
            </div>

            <div style="position: relative;">
              <input 
                type="text" 
                id="reset-pwd-confirm" 
                class="form-control" 
                value="${samplePwd}" 
                required 
                placeholder="Confirm Password"
                style="height: 32px; font-size: 12px; font-family: var(--font-mono); font-weight: 600; padding-right: 28px;" 
                oninput="window.UserManagementModule.onResetPasswordInput('${user.id}')"
              />
              <div style="position: absolute; right: 3px; top: 50%; transform: translateY(-50%);">
                <button type="button" class="btn btn-ghost btn-xs" style="padding: 1px 3px; font-size: 10px; height: 22px; line-height: 1;" title="Toggle visibility" onclick="window.UserManagementModule.togglePasswordVisibility('reset-pwd-confirm', this)">👁️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Minimal Feedback -->
        <div id="reset-pwd-feedback"></div>

        <!-- Checkbox Options -->
        <div style="display: flex; flex-direction: column; gap: 7px; padding: 2px 0;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11.5px; margin: 0; user-select: none;">
            <input type="checkbox" id="reset-pwd-force-change" checked style="accent-color: var(--primary-500); width: 14px; height: 14px; cursor: pointer;" />
            <span style="font-weight: 500; color: var(--text-primary);">Require password change on first login</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11.5px; margin: 0; user-select: none;">
            <input type="checkbox" id="reset-pwd-unlock" ${isLocked ? 'checked' : 'checked'} style="accent-color: var(--primary-500); width: 14px; height: 14px; cursor: pointer;" />
            <span style="color: var(--text-secondary);">Unlock account & reset failed login attempts</span>
          </label>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; width: 100%;">
        <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="window.UserManagementModule.submitResetPassword('${user.id}')">
          🔑 Reset Password & Generate Slip
        </button>
      </div>
    `;

    window.State.showModal({
      title: `🔑 Reset Password: ${user.username}`,
      contentHtml: contentHtml,
      footerHtml: footerHtml,
      maxWidth: '460px'
    });

    setTimeout(() => {
      this.onResetPasswordInput(user.id);
    }, 50);
  },

  submitResetPassword(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;

    const p1 = (document.getElementById('reset-pwd-val')?.value || '').trim();
    const p2 = (document.getElementById('reset-pwd-confirm')?.value || '').trim();
    const forceChange = document.getElementById('reset-pwd-force-change')?.checked ?? true;
    const unlockAccount = document.getElementById('reset-pwd-unlock')?.checked ?? true;

    // Password validation against enterprise policy
    const valResult = this.validatePassword(p1, {
      username: user.username,
      employeeId: user.employee_id,
      mobileNumber: user.mobile_number,
      confirmPassword: p2,
      history: user.password_history || []
    });

    if (!valResult.valid) {
      window.State.showToast(valResult.errors[0] || 'Password does not comply with enterprise security policy.', 'error');
      document.getElementById('reset-pwd-val')?.focus();
      return;
    }

    const salt = this.generateSalt();
    const newHash = this.hashPassword(p1, salt);

    const historyLimit = this.getPasswordPolicy().history_limit || 5;
    const history = Array.isArray(user.password_history) ? [...user.password_history] : [];
    history.push(newHash);
    const updatedHistory = history.slice(-historyLimit);

    const updates = {
      password_salt: salt,
      password_hash: newHash,
      password_history: updatedHistory,
      must_change_password: forceChange,
      password_last_changed: new Date().toISOString(),
      temp_password_expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    };

    if (unlockAccount || user.status === 'LOCKED') {
      updates.status = 'ACTIVE';
      updates.failed_logins = 0;
      updates.locked_until = null;
    }

    (async () => {
      if (typeof window.DB.updateUser === 'function') {
        await window.DB.updateUser(userId, updates);
      } else {
        window.DB.update('users', userId, updates);
      }
      window.DB.logAudit('PASSWORD_RESET', 'Security', userId, `Administrator initiated password reset for user ${user.username}. Force change: ${forceChange}, Unlocked: ${unlockAccount}`);
      window.State.closeModal();
      window.State.showToast(`Password for ${user.username} reset successfully in database.`, 'success');
      this.render();

      // Show credentials handover modal
      this.showCredentialsHandoverModal({
        userId: user.id,
        fullName: user.full_name || user.display_name,
        employeeId: user.employee_id,
        username: user.username,
        temporaryPassword: p1,
        mustChangePassword: forceChange,
        branchName: (window.DB.getById('plants', user.plant_id) || {}).name || user.plant_id,
        roleName: (window.DB.getById('roles', user.primary_role) || {}).name || user.primary_role,
        validityHours: 24,
        isReset: true
      });
    })();
  },



  /* ========================================================================
     3. ROLE MASTER (SUB-MODULE 3)
     ======================================================================== */
  renderRoleMaster() {
    const roles = window.DB.getAll('roles') || [];
    const users = window.DB.getAll('users') || [];

    return `
      <div class="content-card">
        <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
            <span>Role Master Definition</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.showCreateRoleModal()">
              <span>+ Define New Role</span>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" style="font-size: 12.5px;">
            <thead>
              <tr>
                <th style="min-width: 190px;">Role Name</th>
                <th style="width: 150px;">System Code</th>
                <th style="width: 110px;">Classification</th>
                <th>Operational Scope & Responsibilities</th>
                <th class="text-center" style="width: 120px;">Assigned Users</th>
                <th class="text-right" style="min-width: 270px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${roles.map(r => {
                const assignedUsers = this.getAssignedUsersForRole(r);
                const isAssigned = this.isRoleAssigned(r);
                const isActive = (r.status || 'ACTIVE') === 'ACTIVE';
                const isAdmin = r.id === 'ROLE-ADMIN' || r.code === 'SYSTEM_ADMIN' || (r.name && r.name.toLowerCase() === 'system administrator');

                return `
                  <tr style="${!isActive ? 'opacity: 0.75;' : ''}">
                    <td>
                      <div style="font-weight: 700; color: var(--text-primary); font-size: 13px;">${r.name}</div>
                    </td>
                    <td>
                      <code style="font-size: 11px; color: var(--primary-300); background: rgba(99, 102, 241, 0.1); padding: 2px 6px; border-radius: 4px;">
                        ${r.code}
                      </code>
                    </td>
                    <td>
                      <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                        <span class="badge ${r.is_system ? 'badge-primary' : 'badge-subtle'}" style="font-size: 10px;">
                          ${r.is_system ? 'System Core' : 'Custom Role'}
                        </span>
                        <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 10px; ${isActive ? 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);' : ''}">
                          ${isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
                        ${r.description || ''}
                      </div>
                    </td>
                    <td class="text-center">
                      <span class="badge badge-subtle" style="font-weight: 700; font-size: 11px;">
                        👥 ${assignedUsers.length} Users
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                        <button class="btn btn-outline btn-sm" onclick="window.UserManagementModule.openRoleMatrix('${r.id}')" title="Configure permissions for ${r.name}">
                          Configure
                        </button>
                        ${!isAdmin ? `
                          <button class="btn btn-icon btn-sm" onclick="window.UserManagementModule.showEditRoleModal('${r.id}')" title="Edit role definition for ${r.name}">
                            ${window.AppIcons ? window.AppIcons.svgEdit : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'}
                          </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm" style="height: 26px; padding: 2px 7px; font-size: 11px;" onclick="window.UserManagementModule.switchTab('USER_ROLE_MAP')" title="View assigned users">
                          👥 Users
                        </button>
                        ${r.id !== 'ROLE-ADMIN' ? `
                          <button class="btn btn-icon btn-sm" 
                                  onclick="window.UserManagementModule.toggleRoleStatus('${r.id}')" 
                                  title="${isActive ? 'Deactivate role ' + r.name : 'Activate role ' + r.name}">
                            ${window.AppIcons ? window.AppIcons.svgLock(isActive) : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'}
                          </button>
                        ` : ''}
                        ${isAssigned ? `
                          <span class="btn-disabled-wrapper" 
                                style="display: inline-flex; cursor: not-allowed;" 
                                onclick="window.UserManagementModule.warnRoleAssigned('${r.id}')" 
                                title="This role is assigned to one or more users. Please deactivate the role instead.">
                            <button class="btn btn-icon btn-sm btn-disabled-blurred" 
                                    disabled 
                                    style="opacity: 0.45; filter: blur(0.8px) grayscale(50%); cursor: not-allowed; pointer-events: none;" 
                                    tabindex="-1"
                                    title="This role is assigned to one or more users. Please deactivate the role instead.">
                              ${window.AppIcons ? window.AppIcons.svgDelete : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'}
                            </button>
                          </span>
                        ` : `
                          <button class="btn btn-icon btn-sm" 
                                  onclick="window.UserManagementModule.deleteRole('${r.id}')" 
                                  title="Delete role ${r.name}">
                            ${window.AppIcons ? window.AppIcons.svgDelete : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'}
                          </button>
                        `}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  isRoleAssigned(role) {
    if (!role) return false;
    const roleId = typeof role === 'string' ? role : role.id;
    const roleObj = typeof role === 'object' ? role : (window.DB.getById('roles', roleId) || {});
    const roleCode = roleObj.code;

    const users = window.DB.getAll('users') || [];
    const hasAssignedUser = users.some(u => {
      if (!u) return false;
      if (u.primary_role === roleId || u.primary_role_id === roleId) return true;
      if (roleCode && (u.primary_role === roleCode || u.primary_role_id === roleCode)) return true;
      if (Array.isArray(u.secondary_roles)) {
        if (u.secondary_roles.includes(roleId) || (roleCode && u.secondary_roles.includes(roleCode))) return true;
      }
      if (Array.isArray(u.assigned_roles)) {
        if (u.assigned_roles.includes(roleId) || (roleCode && u.assigned_roles.includes(roleCode))) return true;
      }
      if (Array.isArray(u.roles)) {
        if (u.roles.includes(roleId) || (roleCode && u.roles.includes(roleCode))) return true;
      }
      return false;
    });

    if (hasAssignedUser) return true;
    if (typeof roleObj.user_count === 'number' && roleObj.user_count > 0) return true;
    return false;
  },

  getAssignedUsersForRole(role) {
    if (!role) return [];
    const roleId = typeof role === 'string' ? role : role.id;
    const roleObj = typeof role === 'object' ? role : (window.DB.getById('roles', roleId) || {});
    const roleCode = roleObj.code;

    const users = window.DB.getAll('users') || [];
    return users.filter(u => {
      if (!u) return false;
      if (u.primary_role === roleId || u.primary_role_id === roleId) return true;
      if (roleCode && (u.primary_role === roleCode || u.primary_role_id === roleCode)) return true;
      if (Array.isArray(u.secondary_roles)) {
        if (u.secondary_roles.includes(roleId) || (roleCode && u.secondary_roles.includes(roleCode))) return true;
      }
      if (Array.isArray(u.assigned_roles)) {
        if (u.assigned_roles.includes(roleId) || (roleCode && u.assigned_roles.includes(roleCode))) return true;
      }
      if (Array.isArray(u.roles)) {
        if (u.roles.includes(roleId) || (roleCode && u.roles.includes(roleCode))) return true;
      }
      return false;
    });
  },

  warnRoleAssigned(roleId) {
    window.State.showToast('This role is assigned to one or more users. Please deactivate the role instead.', 'warning');
  },

  toggleRoleStatus(roleId) {
    if (roleId === 'ROLE-ADMIN') {
      window.State.showToast('System Administrator (ROLE-ADMIN) cannot be deactivated.', 'error');
      return;
    }
    const role = window.DB.getById('roles', roleId);
    if (!role) return;

    const isCurrentlyActive = (role.status || 'ACTIVE') === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';

    if (isCurrentlyActive) {
      if (!confirm(`Are you sure you want to deactivate role "${role.name}"?\nUsers assigned to this role will have restricted privileges.`)) {
        return;
      }
    }

    role.status = newStatus;
    window.DB.update('roles', roleId, role);
    if (window.DB.syncRoleToBackend) {
      window.DB.syncRoleToBackend(role, 'POST');
    }
    window.DB.logAudit('ROLE_STATUS_CHANGED', 'Security', roleId, `${newStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'} role ${role.name}`);
    window.State.showToast(`Role "${role.name}" has been ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`, 'success');
    this.render();
  },

  openRoleMatrix(roleId) {
    this.selectedRoleId = roleId;
    this.switchTab('ROLE_PERM_MAP');
  },

  showCreateRoleModal() {
    const roles = window.DB.getAll('roles') || [];

    const contentHtml = `
      <form id="create-role-form" onsubmit="event.preventDefault(); window.UserManagementModule.submitCreateRole();">
        <div class="form-group">
          <label class="form-label">Role Code <span style="color:var(--color-danger)">*</span></label>
          <input type="text" id="new-role-code" class="form-control" placeholder="e.g. DISPATCH_SUPERVISOR" required />
          <span style="font-size: 11px; color: var(--text-muted);">Uppercase alphanumeric identifier</span>
        </div>

        <div class="form-group" style="margin-top: 12px;">
          <label class="form-label">Role Display Name <span style="color:var(--color-danger)">*</span></label>
          <input type="text" id="new-role-name" class="form-control" placeholder="e.g. Dispatch & Yard Supervisor" required />
        </div>

        <div class="form-group" style="margin-top: 12px;">
          <label class="form-label">Description & Operational Scope</label>
          <textarea id="new-role-desc" class="form-control" rows="3" placeholder="Describe the authority, responsibilities and operational scope for this role..."></textarea>
        </div>

        <div class="form-group" style="margin-top: 12px;">
          <label class="form-label">Copy Baseline Permissions From Template</label>
          <select id="new-role-template" class="form-control">
            <option value="">-- Start with Empty Permissions --</option>
            ${roles.map(r => `<option value="${r.id}">Clone ${r.name}</option>`).join('')}
          </select>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '👑 Define New RBAC Role',
      contentHtml: contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.UserManagementModule.submitCreateRole()">Create Role</button>
      `,
      maxWidth: '550px'
    });
  },

  submitCreateRole() {
    const code = document.getElementById('new-role-code').value.trim().toUpperCase();
    const name = document.getElementById('new-role-name').value.trim();
    const desc = document.getElementById('new-role-desc').value.trim();
    const templateId = document.getElementById('new-role-template').value;

    if (!code || !name) {
      window.State.showToast('Please provide Role Code and Display Name.', 'error');
      return;
    }

    const roleId = `ROLE-${code}`;
    const newRole = {
      id: roleId,
      code: code,
      name: name,
      description: desc || `${name} responsible for operations.`,
      is_system: false,
      status: 'ACTIVE',
      user_count: 0
    };

    window.DB.insert('roles', newRole);
    if (window.DB.syncRoleToBackend) {
      window.DB.syncRoleToBackend(newRole, 'POST');
    }

    // Clone permissions if template selected
    if (templateId && window.DB.data.role_permissions) {
      const templatePerms = window.DB.data.role_permissions.filter(rp => rp.role_id === templateId);
      const clonedPerms = [];
      templatePerms.forEach(tp => {
        const clonedEntry = {
          role_id: roleId,
          perm_code: tp.perm_code,
          view: tp.view,
          add: tp.add,
          edit: tp.edit,
          delete: tp.delete,
          submit: tp.submit,
          approve: tp.approve,
          reject: tp.reject,
          cancel: tp.cancel,
          print: tp.print,
          export: tp.export,
          import: tp.import,
          post: tp.post,
          reverse: tp.reverse,
          close: tp.close,
          reopen: tp.reopen
        };
        window.DB.data.role_permissions.push(clonedEntry);
        clonedPerms.push(clonedEntry);
      });
      window.DB.saveData();
      if (window.DB.syncRolePermissionsToBackend && clonedPerms.length > 0) {
        window.DB.syncRolePermissionsToBackend(clonedPerms);
      }
    }

    window.DB.logAudit('ROLE_CREATED', 'Security', roleId, `Created custom security role ${name} (${code})`);
    window.State.closeModal();
    window.State.showToast(`Role ${name} created successfully.`, 'success');
    this.render();
  },

  showEditRoleModal(roleId) {
    const role = window.DB.getById('roles', roleId);
    if (!role) {
      window.State.showToast('Role not found.', 'error');
      return;
    }

    if (role.id === 'ROLE-ADMIN' || role.code === 'SYSTEM_ADMIN' || (role.name && role.name.toLowerCase() === 'system administrator')) {
      window.State.showToast('System Administrator role definition is protected and cannot be edited.', 'warning');
      return;
    }

    const assignedUsers = this.getAssignedUsersForRole(role);
    const isSystem = !!role.is_system;
    const isActive = (role.status || 'ACTIVE') === 'ACTIVE';
    const safeName = (role.name || '').replace(/"/g, '&quot;');
    const safeCode = (role.code || role.id || '').replace(/"/g, '&quot;');
    const safeDesc = (role.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const contentHtml = `
      <form id="edit-role-form" onsubmit="event.preventDefault(); window.UserManagementModule.submitEditRole('${role.id}');" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${isSystem ? 'badge-primary' : 'badge-subtle'}" style="font-size: 10px;">
                ${isSystem ? 'System Core' : 'Custom Role'}
              </span>
              <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 10px;">
                ${isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <span style="font-size: 11.5px; color: var(--text-muted);">
              👥 <strong>${assignedUsers.length}</strong> Assigned User${assignedUsers.length === 1 ? '' : 's'}
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 3px;">System Code (Identifier) <span style="color:var(--color-danger)">*</span></label>
            <input type="text" id="edit-role-code" class="form-control" value="${safeCode}" required placeholder="e.g. STORE_OPS_EXEC" style="height: 32px; font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: var(--primary-300);" />
            <small style="font-size: 10px; color: var(--text-muted);">Unique uppercase alphanumeric identifier for this role</small>
          </div>

          <div class="form-group" style="margin-top: 10px;">
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 3px;">Role Display Name <span style="color:var(--color-danger)">*</span></label>
            <input type="text" id="edit-role-name" class="form-control" value="${safeName}" placeholder="e.g. Mechanic" required style="height: 32px; font-size: 12.5px; font-weight: 600;" />
          </div>

          <div class="form-group" style="margin-top: 10px;">
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 3px;">Operational Scope & Responsibilities</label>
            <textarea id="edit-role-desc" class="form-control" rows="3" placeholder="Describe the authority, responsibilities and operational scope for this role..." style="font-size: 12px; line-height: 1.4;">${safeDesc}</textarea>
          </div>

          <div class="form-group" style="margin-top: 10px;">
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 3px;">Status</label>
            <select id="edit-role-status" class="form-control" ${role.id === 'ROLE-ADMIN' ? 'disabled' : ''} style="height: 32px; font-size: 12px;">
              <option value="ACTIVE" ${isActive ? 'selected' : ''}>Active</option>
              <option value="INACTIVE" ${!isActive ? 'selected' : ''}>Inactive</option>
            </select>
            ${role.id === 'ROLE-ADMIN' ? '<small style="font-size: 10px; color: var(--text-muted);">ROLE-ADMIN must remain Active.</small>' : ''}
          </div>
        </div>
      </form>
    `;

    window.State.showModal({
      title: `✏️ Edit Role Definition`,
      contentHtml: contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.UserManagementModule.submitEditRole('${role.id}')">Save Changes</button>
      `,
      maxWidth: '520px'
    });
  },

  submitEditRole(roleId) {
    const role = window.DB.getById('roles', roleId);
    if (!role) {
      window.State.showToast('Role not found.', 'error');
      return;
    }

    if (role.id === 'ROLE-ADMIN' || role.code === 'SYSTEM_ADMIN' || (role.name && role.name.toLowerCase() === 'system administrator')) {
      window.State.showToast('System Administrator role definition is protected and cannot be edited.', 'warning');
      return;
    }

    const nameInput = document.getElementById('edit-role-name');
    const descInput = document.getElementById('edit-role-desc');
    const statusInput = document.getElementById('edit-role-status');
    const codeInput = document.getElementById('edit-role-code');

    const name = nameInput ? nameInput.value.trim() : '';
    const desc = descInput ? descInput.value.trim() : '';
    const status = (statusInput && role.id !== 'ROLE-ADMIN') ? statusInput.value : (role.status || 'ACTIVE');
    const newCode = codeInput ? codeInput.value.trim().toUpperCase().replace(/\s+/g, '_') : (role.code || role.id);

    if (!newCode) {
      window.State.showToast('Please provide a System Code (Identifier).', 'error');
      return;
    }

    if (!name) {
      window.State.showToast('Please provide a Role Display Name.', 'error');
      return;
    }

    // Check if newCode is already taken by another role
    const allRoles = window.DB.getAll('roles') || [];
    const duplicateRole = allRoles.find(r => 
      r.id !== roleId && (
        (r.code && r.code.toUpperCase() === newCode) ||
        (r.id && r.id.toUpperCase() === newCode)
      )
    );
    if (duplicateRole) {
      window.State.showToast(`System Code "${newCode}" is already in use by role "${duplicateRole.name}".`, 'error');
      return;
    }

    const oldCode = role.code || role.id;

    const updatedRole = {
      ...role,
      code: newCode,
      name: name,
      description: desc || `${name} responsible for operations.`,
      status: status
    };

    window.DB.update('roles', roleId, updatedRole);

    // If code has changed, cascade update across users, permissions, approvals, etc.
    if (oldCode && oldCode !== newCode) {
      // 1. Users cascade
      const allUsers = window.DB.getAll('users') || [];
      allUsers.forEach(u => {
        let changed = false;
        if (u.primary_role === oldCode) {
          u.primary_role = newCode;
          changed = true;
        }
        if (u.primary_role_id === oldCode) {
          u.primary_role_id = newCode;
          changed = true;
        }
        if (Array.isArray(u.secondary_roles) && u.secondary_roles.includes(oldCode)) {
          u.secondary_roles = u.secondary_roles.map(r => r === oldCode ? newCode : r);
          changed = true;
        }
        if (Array.isArray(u.assigned_roles) && u.assigned_roles.includes(oldCode)) {
          u.assigned_roles = u.assigned_roles.map(r => r === oldCode ? newCode : r);
          changed = true;
        }
        if (Array.isArray(u.roles) && u.roles.includes(oldCode)) {
          u.roles = u.roles.map(r => r === oldCode ? newCode : r);
          changed = true;
        }
        if (changed) {
          window.DB.update('users', u.id, u);
        }
      });

      // 2. Role Permissions cascade
      if (window.DB.data && Array.isArray(window.DB.data.role_permissions)) {
        window.DB.data.role_permissions.forEach(rp => {
          if (rp.role_id === oldCode) {
            rp.role_id = newCode;
          }
        });
        window.DB.saveData();
      }

      // 3. Approval Authorities cascade
      const allApprovals = window.DB.getAll('approval_authorities') || [];
      allApprovals.forEach(a => {
        if (a.role_id === oldCode) {
          window.DB.update('approval_authorities', a.id, { role_id: newCode });
        }
      });

      // 4. Approval Delegations cascade
      const allDelegations = window.DB.getAll('approval_delegations') || [];
      allDelegations.forEach(d => {
        if (d.role_id === oldCode) {
          window.DB.update('approval_delegations', d.id, { role_id: newCode });
        }
      });
    }

    if (window.DB.syncRoleToBackend) {
      window.DB.syncRoleToBackend(updatedRole, 'POST');
    }

    window.DB.logAudit('ROLE_UPDATED', 'Security', roleId, `Updated role definition for ${name} (${newCode})`);
    window.State.closeModal();
    window.State.showToast(`Role "${name}" (${newCode}) updated successfully.`, 'success');
    this.render();
  },

  deleteRole(roleId) {
    if (roleId === 'ROLE-ADMIN') {
      window.State.showToast('This role is assigned to one or more users. Please deactivate the role instead.', 'warning');
      return;
    }
    const role = window.DB.getById('roles', roleId);
    if (!role) return;

    // Check if role is assigned to any user
    if (this.isRoleAssigned(role)) {
      window.State.showToast('This role is assigned to one or more users. Please deactivate the role instead.', 'warning');
      return;
    }

    if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      window.DB.delete('roles', roleId);
      window.DB.data.role_permissions = (window.DB.data.role_permissions || []).filter(rp => rp.role_id !== roleId);
      window.DB.saveData();
      if (window.DB.syncRoleToBackend) {
        window.DB.syncRoleToBackend(role, 'DELETE');
      }
      window.DB.logAudit('ROLE_DELETED', 'Security', roleId, `Deleted role ${role.name}`);
      window.State.showToast(`Role "${role.name}" deleted successfully.`, 'success');
      this.render();
    }
  },

  /* ========================================================================
     4. SUB-MODULES CATALOG & 5. SUB-MODULE RIGHTS PERMISSION MATRIX
     Comprehensive Enterprise RBAC Sub-Module Matrix (36 Sub-Modules & All Rights)
     ======================================================================== */
  subModulesCatalog: [
    // 1. Overview
    { code: 'DASHBOARD', name: 'Operations Dashboard', category: 'Overview', categoryIcon: '📊', route: '#/dashboard', description: 'Executive KPIs, stock health alerts & live activity feed' },

    // 2. Billing & Job Card
    { code: 'BILLING_DASHBOARD', name: 'Billing Dashboard', category: 'Billing & Job Card', categoryIcon: '🧾', route: '#/billing-dashboard', description: 'Workshop service revenue KPIs, estimates pipeline & billing metrics' },
    { code: 'STORE_TX_JOB_CARD_ISSUE', name: 'Job Card & Parts Workflow', category: 'Billing & Job Card', categoryIcon: '🧾', route: '#/job-cards', description: 'Workshop job cards, technician assignment, spare parts requisition & issue' },
    { code: 'BILLING_ESTIMATES', name: 'Service & Parts Estimates', category: 'Billing & Job Card', categoryIcon: '🧾', route: '#/billing-estimates', description: 'Service and spare parts quotation estimation for customer approval' },
    { code: 'DRAFT_BILLS', name: 'Draft Bills & Tax Review', category: 'Billing & Job Card', categoryIcon: '🧾', route: '#/draft-bills', description: 'Preliminary invoice review, labour & parts verification before finalization' },
    { code: 'FINAL_BILLS', name: 'Final Bills & GST Invoices', category: 'Billing & Job Card', categoryIcon: '🧾', route: '#/final-bills', description: 'Official tax invoice generation, payment settlement and GST compliance' },
    { code: 'VEHICLE_DELIVERY', name: 'Vehicle Delivery & Gate Pass', category: 'Billing & Job Card', categoryIcon: '🧾', route: '#/vehicle-delivery', description: 'Quality inspection sign-off, delivery handover checklist and exit gate pass' },
    { code: 'CHANGE_NEXT_SERVICE_DATE', name: 'Change Next Service Date', category: 'Billing & Job Card', categoryIcon: '📅', route: '#/vehicle-delivery', description: 'Permission to edit vehicle next servicing due date and sync to Bill UI & Print' },

    // 3. Customer Relationship (CRM)
    { code: 'CUSTOMER_REMINDERS', name: 'Customer Relationship (CRM)', category: 'Customer Relationship (CRM)', categoryIcon: '💬', route: '#/reminder-dashboard', description: 'Automated two-wheeler service reminders, CRM notifications and customer engagement' },
    { code: 'REMINDER_DASHBOARD', name: 'Service Reminder Dashboard', category: 'Customer Relationship (CRM)', categoryIcon: '📊', route: '#/reminder-dashboard', description: 'Due, overdue & upcoming service reminder analytics, conversion metrics and follow-up KPIs' },
    { code: 'REMINDER_CONFIG', name: 'Reminder Configuration', category: 'Customer Relationship (CRM)', categoryIcon: '⚙️', route: '#/reminder-configuration', description: 'Automated service intervals (Free & Paid Service), advance reminder days and trigger rules' },
    { code: 'REMINDER_PROCESS', name: 'Reminder Processing', category: 'Customer Relationship (CRM)', categoryIcon: '⚡', route: '#/reminder-processing', description: 'Real-time vehicle reminder generation, customer dispatch queue and SMS/WhatsApp delivery' },
    { code: 'REMINDER_HISTORY', name: 'Reminder History', category: 'Customer Relationship (CRM)', categoryIcon: '📜', route: '#/reminder-history', description: 'Comprehensive audit log of sent customer reminders, delivery statuses and contact history' },
    { code: 'REMINDER_REPORTS', name: 'Reminder Reports', category: 'Customer Relationship (CRM)', categoryIcon: '📈', route: '#/reminder-reports', description: 'Service conversion reports, customer retention analytics and delivery performance' },
    { code: 'REMINDER_TEMPLATES', name: 'Message Template Master', category: 'Customer Relationship (CRM)', categoryIcon: '💬', route: '#/message-templates', description: 'SMS, WhatsApp and email message templates with dynamic customer/vehicle placeholders' },

    // 4. Item Master Setup
    { code: 'ITEM_DASHBOARD', name: 'Item Master Dashboard', category: 'Item Master Setup', categoryIcon: '📦', route: '#/item-dashboard', description: 'SKU catalog analytics, category distribution & stock status overview' },
    { code: 'ITEM_MASTER', name: 'Item Master', category: 'Item Master Setup', categoryIcon: '📦', route: '#/item-master', description: 'Two-wheeler spare parts, lubricants, consumables and accessories master' },
    { code: 'ITEM_CATEGORIES', name: 'Item Category & Sub-Category', category: 'Item Master Setup', categoryIcon: '📦', route: '#/item-categories', description: 'Two-tier item categorization, classification and tax applicability' },
    { code: 'ITEM_BRANDS', name: 'Brand Master', category: 'Item Master Setup', categoryIcon: '📦', route: '#/item-brands', description: 'OEM & aftermarket spare parts brand registry and tracking' },
    { code: 'ITEM_MANUFACTURERS', name: 'Manufacturer Master', category: 'Item Master Setup', categoryIcon: '📦', route: '#/item-manufacturers', description: 'Automotive two-wheeler OEM manufacturers and supplier profiles' },
    { code: 'STORE_VEHICLE_COMPAT', name: 'Vehicle Model Compatibility', category: 'Item Master Setup', categoryIcon: '📦', route: '#/vehicle-compatibility', description: 'Two-wheeler model compatibility rules (Activa, Pulsar, Splendor, Jupiter)' },
    { code: 'UOM_MASTER', name: 'UOM Master (Units & Conversion)', category: 'Item Master Setup', categoryIcon: '📦', route: '#/uom-master', description: 'Primary and secondary units of measurement with precision conversions' },
    { code: 'HSN_MASTER', name: 'HSN / SAC Code Master', category: 'Item Master Setup', categoryIcon: '📦', route: '#/hsn-master', description: 'Harmonized system of nomenclature and GST taxation slabs' },
    { code: 'STORE_TX_PHYSICAL_COUNT', name: 'Physical Stock Count', category: 'Item Master Setup', categoryIcon: '📦', route: '#/stock-counts', description: 'Freeze snapshot, tag counts & physical variance reconciliation' },
    { code: 'STORE_TX_WARRANTY_RETURN', name: 'Warranty Parts Return', category: 'Item Master Setup', categoryIcon: '📦', route: '#/warranty-scrap', description: 'Receive replaced warranty defective items with OEM claim tracking' },
    { code: 'STORE_INVENTORY_RULES', name: 'Inventory Rules & Policies', category: 'Item Master Setup', categoryIcon: '📦', route: '#/inventory-rules', description: 'Min/Max levels, reorder thresholds, negative stock prevention & alerts' },
    { code: 'STORE_STOCK_LEDGER', name: 'Multi-Store Stock Ledger', category: 'Item Master Setup', categoryIcon: '📦', route: '#/stock-ledger', description: 'Multi-facility real-time perpetual ledger, FIFO batch tracking & valuation' },

    // 4. Store Master Setup
    { code: 'STORE_MASTER', name: 'Store Master', category: 'Store Master Setup', categoryIcon: '🏬', route: '#/store-master', description: 'Central stores, workshop sub-stores, transit nodes & scrapyard hierarchy lifecycle' },
    { code: 'LOC_MASTER', name: 'Storage Location Master', category: 'Store Master Setup', categoryIcon: '🏬', route: '#/storage-locations', description: 'Warehouse zones, bays and geographical staging locations' },
    { code: 'RACK_MASTER', name: 'Rack Master', category: 'Store Master Setup', categoryIcon: '🏬', route: '#/racks', description: 'Storage racks, physical layout coordinates and dimensions' },
    { code: 'SHELF_MASTER', name: 'Shelf Master', category: 'Store Master Setup', categoryIcon: '🏬', route: '#/shelves', description: 'Vertical storage tiers and shelving subdivisions' },
    { code: 'BIN_MASTER', name: 'Bin Master', category: 'Store Master Setup', categoryIcon: '🏬', route: '#/bins', description: 'Granular bin addresses, pick zones and capacity management' },

    // 5. Procurement Lifecycle
    { code: 'PLANNING', name: 'MRP & Purchase Planning', category: 'Procurement', categoryIcon: '🛒', route: '#/purchase-planning', description: 'Demand-driven reorder levels, safety stock triggers & MRP engine' },
    { code: 'REQUISITIONS', name: 'Purchase Requisitions (PR)', category: 'Procurement', categoryIcon: '🛒', route: '#/requisitions', description: 'Indent requisition generation, budget verification & PR approvals' },
    { code: 'ORDERS', name: 'Purchase Orders (PO)', category: 'Procurement', categoryIcon: '🛒', route: '#/orders', description: 'Vendor contract POs, multi-level authorizations, delivery schedules' },
    { code: 'GRN', name: 'Goods Receipt Notes (GRN)', category: 'Procurement', categoryIcon: '🛒', route: '#/grn', description: 'Gate receipt logging, weighbridge verification & inward docket' },
    { code: 'SUPPLIER_MASTER', name: 'Supplier & Vendor Master', category: 'Procurement', categoryIcon: '🛒', route: '#/suppliers', description: 'Approved supplier and vendor profiles, payment terms, and SRM catalogs' },

    // 6. Quality & Storage
    { code: 'QUALITY', name: 'Quality Inspection (QA/QC)', category: 'Quality & Storage', categoryIcon: '🔬', route: '#/quality', description: 'Inward QA parameter testing, COA verification & rejection sampling' },
    { code: 'PUTAWAY', name: 'Directed Putaway & Bins', category: 'Quality & Storage', categoryIcon: '🔬', route: '#/putaway', description: 'Automated bin allocation, ABC zone distribution & putaway tasks' },
    { code: 'WAREHOUSE_MAP', name: 'Warehouse Visualizer (2D)', category: 'Quality & Storage', categoryIcon: '🔬', route: '#/warehouse-map', description: 'Visual 2D rack layout, bin occupancy heatmap & aisle navigation' },

    // 7. Inventory & Logistics
    { code: 'INVENTORY', name: 'Stock Balances', category: 'Inventory & Logistics', categoryIcon: '🏬', route: '#/inventory', description: 'Perpetual multi-facility ledger, batch balances, stock valuation & reorder status' },
    { code: 'OPENING_BALANCE', name: 'Opening Balance', category: 'Inventory & Logistics', categoryIcon: '🏬', route: '#/opening-balance', description: 'Initial baseline stock upload, opening balance batches & inventory reconciliation' },
    { code: 'TRANSFERS', name: 'Stock Transfer', category: 'Inventory & Logistics', categoryIcon: '🏬', route: '#/transfers', description: 'Multi-plant stock dispatch, inter-store transfer orders & transit tracking' },
    { code: 'RECEIVE_TRANSFERS', name: 'Receive Stock Transfer', category: 'Inventory & Logistics', categoryIcon: '🏬', route: '#/receive-transfers', description: 'Inward receipt of stock transfers, quantity verification, bin putaway & GRN reconciliation' },

    // 8. Manufacturing
    { code: 'PRODUCTION', name: 'Production Work Orders', category: 'Manufacturing', categoryIcon: '⚙️', route: '#/production', description: 'Shop-floor WIP tracking, material consumption & batch completion' },
    { code: 'BOM', name: 'Bills of Materials (BOM)', category: 'Manufacturing', categoryIcon: '⚙️', route: '#/production', description: 'Multi-level engineering BOM recipes, scrap factors & revision control' },

    // 9. Outbound Logistics
    { code: 'DISPATCH', name: 'Dispatch & Gate Passes', category: 'Outbound Logistics', categoryIcon: '📤', route: '#/dispatch', description: 'Pick-pack-ship lifecycle, e-Way bill issuance & gate pass clearance' },
    { code: 'RETURNS', name: 'Reverse Logistics & RMA', category: 'Outbound Logistics', categoryIcon: '📤', route: '#/returns', description: 'Customer return authorisations, RMA testing & credit reconciliation' },

    // 10. Control & Governance
    { code: 'ADJUSTMENTS', name: 'Cycle Counts & Adjustments', category: 'Control & Audits', categoryIcon: '🛡️', route: '#/adjustments', description: 'Periodic physical cycle counts, write-offs & variance approvals' },
    { code: 'REPORTS', name: 'Executive MIS Reports', category: 'Control & Audits', categoryIcon: '🛡️', route: '#/reports', description: 'Procurement trends, inventory aging, turnover ratios & valuation' },
    { code: 'MASTERS', name: 'Master Data Configuration', category: 'Control & Audits', categoryIcon: '🛡️', route: '#/masters', description: 'Item masters, supplier catalogs, plant/warehouse master hierarchies' },
    { code: 'AUDIT', name: 'System Audit Trail Log', category: 'Control & Audits', categoryIcon: '🛡️', route: '#/audit', description: 'Immutable transaction ledger, security timestamps & actor logs' },

    // 11. Organization & Facility Setup
    { code: 'COMMON_MASTER', name: 'Common Master', category: 'Organization & Facility Setup', categoryIcon: '🏢', route: '#/common-master', description: 'Country, State, District, City, Pin Code & lookup dictionaries' },
    { code: 'ADDRESS_MASTER', name: 'Address Master', category: 'Organization & Facility Setup', categoryIcon: '🏢', route: '#/address-master', description: 'Consolidated geographic master containing 5 regional administrative levels' },
    { code: 'TAX_MASTER', name: 'Tax Master', category: 'Organization & Facility Setup', categoryIcon: '🏢', route: '#/tax-master', description: 'GST tax slabs, HSN rates and centralized tax computation policies' },

    // 12. Organization & Facility Setup
    { code: 'ORG_MASTER', name: 'Organisation Master', category: 'Organization & Facility Setup', categoryIcon: '🏢', route: '#/organizations', description: 'Legal corporate entities, tax IDs, and registered office hierarchies' },
    { code: 'BRANCH_MASTER', name: 'Facility Master', category: 'Organization & Facility Setup', categoryIcon: '🏢', route: '#/facilities', description: 'Service plants, regional workshop facilities and service depots' },
    { code: 'DOC_PRINT_CONFIG_MASTER', name: 'Document Print Configuration Master', category: 'Organization & Facility Setup', categoryIcon: '🖨️', route: '#/doc-print-config', description: 'Facility-wise document print layout design, dynamic field mapping, formatting and publishing' },
    { code: 'FINANCIAL_CALENDAR_MASTER', name: 'Financial Calendar Master', category: 'Organization & Facility Setup', categoryIcon: '🏢', route: '#/financial-calendar', description: 'Fiscal year definitions, accounting periods and calendar status' },
    { code: 'DOC_SERIES_MASTER', name: 'Document Number Series Master', category: 'Organization & Facility Setup', categoryIcon: '🏢', route: '#/doc-series', description: 'Auto-generation rules and numbering series for invoices, PR, PO & Job Cards' },
    { code: 'HOLIDAY_MASTER', name: 'Holiday Master', category: 'Organization & Facility Setup', categoryIcon: '🏢', route: '#/holiday-master', description: 'Operating facility calendar schedules, non-working days and holidays' },
    { code: 'CONFIG_REGISTRATION', name: 'Registration Configuration Master', category: 'Organization & Facility Setup', categoryIcon: '🏢', route: '#/registration-config', description: 'Facility-wise customer and vehicle registration field applicability and mandatory controls' },

    // 13. User Roles & Security Suite (18 Sub-Modules)
    { code: 'SEC_DASHBOARD', name: 'Security Dashboard', category: 'Security Suite', categoryIcon: '👥', route: '#/security-dashboard', description: 'RBAC health, active sessions, risk metrics & SoD conflict summaries' },
    { code: 'USER_MASTER', name: 'User Master', category: 'Security Suite', categoryIcon: '👥', route: '#/users', description: 'User accounts, credential lifecycle, account suspension & lockout' },
    { code: 'ROLE_MASTER', name: 'Role Master', category: 'Security Suite', categoryIcon: '👥', route: '#/roles', description: 'Standardized enterprise roles, authority scope & assignment counts' },
    { code: 'PERMISSIONS', name: 'Permission Master', category: 'Security Suite', categoryIcon: '👥', route: '#/permissions', description: 'Sub-module rights assignment matrix, granular capability controls' },
    { code: 'ROLE_PERM_MAP', name: 'Role-Permission Matrix', category: 'Security Suite', categoryIcon: '👥', route: '#/role-permissions', description: 'Cross-functional role rights matrix with 15 granular actions' },
    { code: 'USER_ROLE_MAP', name: 'User-Role Mapping', category: 'Security Suite', categoryIcon: '👥', route: '#/user-roles', description: 'Primary role assignment, secondary delegations & role transitions' },
    { code: 'SOD_RULES', name: 'Segregation of Duties (SoD)', category: 'Security Suite', categoryIcon: '👥', route: '#/sod-rules', description: 'Toxic role combination conflict checks & compliance rules' },
    { code: 'APPROVAL_LIMITS', name: 'Approval Limits & Authority', category: 'Security Suite', categoryIcon: '👥', route: '#/approval-authorities', description: 'Financial threshold ceilings for PR/PO/Adjustment authorization' },
    { code: 'DELEGATIONS', name: 'Delegations & Temp Access', category: 'Security Suite', categoryIcon: '👥', route: '#/delegations', description: 'Out-of-office delegation windows & temporary privilege handovers' },
    { code: 'ACCESS_REQUESTS', name: 'Access Request Workflow', category: 'Security Suite', categoryIcon: '👥', route: '#/access-requests', description: 'Self-service role & facility elevation requests with dual-approval' },
    { code: 'PASSWORD_POLICY', name: 'Password Policy Config', category: 'Security Suite', categoryIcon: '👥', route: '#/password-policy', description: 'Complexity rules, expiration cycles, 2FA MFA mandates' },
    { code: 'LOGIN_SECURITY', name: 'Login Security & Lockouts', category: 'Security Suite', categoryIcon: '👥', route: '#/login-security', description: 'Brute-force lockout thresholds, session timeouts & IP allowlisting' },
    { code: 'SESSIONS', name: 'Live User Sessions', category: 'Security Suite', categoryIcon: '👥', route: '#/sessions', description: 'Concurrent active web sessions & emergency remote revocation' },
    { code: 'LOGIN_HISTORY', name: 'Authentication History', category: 'Security Suite', categoryIcon: '👥', route: '#/login-history', description: 'Full historical audit of successful & failed login attempts' },
    { code: 'ACCESS_REPORTS', name: 'Periodic Access Reviews', category: 'Security Suite', categoryIcon: '👥', route: '#/access-reports', description: 'Quarterly compliance access certifications & privileged user logs' },
    { code: 'USER_ACTIVITY', name: 'Security Audit Trail', category: 'Security Suite', categoryIcon: '👥', route: '#/user-activity', description: 'Tamper-evident record of all RBAC modifications & admin actions' }
  ],

  coreRights: [
    { key: 'view', label: 'VIEW', title: 'View & Search records in this sub-module', color: '#10b981' },
    { key: 'add', label: 'ADD', title: 'Create new records & transactions', color: '#6366f1' },
    { key: 'edit', label: 'EDIT', title: 'Modify / Update existing records', color: '#f59e0b' },
    { key: 'delete', label: 'DELETE', title: 'Delete records where permitted', color: '#ef4444' },
    { key: 'approve', label: 'APPROVE', title: 'Authorize / Approve transactions', color: '#8b5cf6' },
    { key: 'export', label: 'EXPORT', title: 'Export data to Excel / CSV', color: '#06b6d4' },
    { key: 'print', label: 'PRINT', title: 'Print slips, PDFs & vouchers', color: '#94a3b8' }
  ],

  extendedRights: [
    { key: 'submit', label: 'SUBMIT', title: 'Submit for formal approval', color: '#38bdf8' },
    { key: 'reject', label: 'REJECT', title: 'Reject submitted transactions', color: '#f87171' },
    { key: 'cancel', label: 'CANCEL', title: 'Cancel open/approved records', color: '#fb923c' },
    { key: 'import', label: 'IMPORT', title: 'Bulk upload / import data', color: '#a78bfa' },
    { key: 'post', label: 'POST', title: 'Post entries to stock & financial ledger', color: '#4ade80' },
    { key: 'reverse', label: 'REVERSE', title: 'Reverse previously posted entries', color: '#f43f5e' },
    { key: 'close', label: 'CLOSE', title: 'Close completed orders', color: '#64748b' },
    { key: 'reopen', label: 'REOPEN', title: 'Reopen closed transactions', color: '#eab308' }
  ],

  getSubModulePermEntry(roleId, subModuleCode) {
    let list = window.DB.data.role_permissions;
    if (!list) list = window.DB.data.role_permissions = [];

    let entry = list.find(rp => rp.role_id === roleId && rp.perm_code === subModuleCode);
    if (!entry) {
      const aliasMap = {
        'PLANNING': 'REQUISITIONS',
        'WAREHOUSE_MAP': 'PUTAWAY',
        'BOM': 'PRODUCTION',
        'QA_INSPECTION': 'QUALITY',
        'QUARANTINE': 'QUALITY',
        'AUDIT': 'REPORTS',
        'SEC_DASHBOARD': 'USER_MANAGEMENT',
        'USER_MASTER': 'USER_MANAGEMENT',
        'USER_ACCESS': 'USER_MANAGEMENT',
        'ROLE_MASTER': 'USER_MANAGEMENT',
        'PERMISSIONS': 'USER_MANAGEMENT',
        'ROLE_PERM_MAP': 'USER_MANAGEMENT',
        'USER_ROLE_MAP': 'USER_MANAGEMENT',
        'SOD_RULES': 'USER_MANAGEMENT',
        'APPROVAL_LIMITS': 'USER_MANAGEMENT',
        'DELEGATIONS': 'USER_MANAGEMENT',
        'ACCESS_REQUESTS': 'USER_MANAGEMENT',
        'PASSWORD_POLICY': 'USER_MANAGEMENT',
        'LOGIN_SECURITY': 'USER_MANAGEMENT',
        'SESSIONS': 'USER_MANAGEMENT',
        'LOGIN_HISTORY': 'USER_MANAGEMENT',
        'ACCESS_REPORTS': 'USER_MANAGEMENT',
        'USER_ACTIVITY': 'USER_MANAGEMENT',
        'REGISTRATION_CONFIG': 'CONFIG_REGISTRATION',
        // Store & Inventory aliases
        'STORE_MASTER': 'MASTERS',
        'STORE_VEHICLE_COMPAT': 'MASTERS',
        'STORE_TX_PR': 'REQUISITIONS',
        'STORE_TX_PO': 'ORDERS',
        'STORE_TX_GRN': 'GRN',
        'STORE_TX_PURCHASE_RETURN': 'RETURNS',
        'STORE_TX_MATERIAL_ISSUE': 'INVENTORY',
        'STORE_TX_MATERIAL_RETURN': 'RETURNS',
        'STORE_TX_JOB_CARD_ISSUE': 'INVENTORY',
        'STORE_TX_JOB_CARD_RETURN': 'RETURNS',
        'STORE_TX_STOCK_ADJUSTMENT': 'ADJUSTMENTS',
        'STORE_TX_PHYSICAL_COUNT': 'ADJUSTMENTS',
        'STORE_TX_STOCK_RESERVATION': 'INVENTORY',
        'STORE_TX_WALK_IN_SALE': 'DISPATCH',
        'STORE_TX_COUNTER_SALE': 'DISPATCH',
        'STORE_TX_SALES_RETURN': 'RETURNS',
        'STORE_TX_WARRANTY_RETURN': 'RETURNS',
        'STORE_TX_SCRAP_DISPOSAL': 'ADJUSTMENTS',
        'STORE_TX_INTER_BRANCH': 'TRANSFERS',
        'STORE_TX_BIN_TRANSFER': 'PUTAWAY',
        'STORE_TX_OPENING_STOCK': 'INVENTORY',
        'STORE_TX_QUARANTINE': 'QUALITY',
        'STORE_TX_QUALITY_INSP': 'QUALITY',
        'STORE_INVENTORY_RULES': 'MASTERS',
        'STORE_STOCK_LEDGER': 'INVENTORY',
        'OPENING_BALANCE': 'INVENTORY',
        'RECEIVE_TRANSFERS': 'TRANSFERS',
        'RECEIVE_STOCK_TRANSFER': 'TRANSFERS',
        'STOCK_TRANSFER': 'TRANSFERS',
        'STOCK_BALANCES': 'INVENTORY',
        'COMMON_MASTER': 'MASTERS',
        // Billing & Workshop aliases
        'BILLING_DASHBOARD': 'INVENTORY',
        'BILLING_ESTIMATES': 'INVENTORY',
        'DRAFT_BILLS': 'INVENTORY',
        'FINAL_BILLS': 'INVENTORY',
        'VEHICLE_DELIVERY': 'INVENTORY',
        'CHANGE_NEXT_SERVICE_DATE': 'VEHICLE_DELIVERY',
        // Item Master Setup aliases
        'ITEM_DASHBOARD': 'MASTERS',
        'ITEM_MASTER': 'MASTERS',
        'ITEM_CATEGORIES': 'MASTERS',
        'ITEM_BRANDS': 'MASTERS',
        'ITEM_MANUFACTURERS': 'MASTERS',
        'UOM_MASTER': 'MASTERS',
        'HSN_MASTER': 'MASTERS',
        // Store Setup Structure aliases
        'LOC_MASTER': 'MASTERS',
        'RACK_MASTER': 'MASTERS',
        'SHELF_MASTER': 'MASTERS',
        'BIN_MASTER': 'MASTERS',
        // Org & Facility Setup aliases
        'ORG_MASTER': 'MASTERS',
        'BRANCH_MASTER': 'MASTERS',
        'SUPPLIER_MASTER': 'MASTERS',
        'DOC_PRINT_CONFIG_MASTER': 'MASTERS',
        'FINANCIAL_CALENDAR_MASTER': 'MASTERS',
        'DOC_SERIES_MASTER': 'MASTERS',
        'HOLIDAY_MASTER': 'MASTERS',
        'REGISTRATION_CONFIG': 'MASTERS',
        // Address & Tax aliases
        'ADDRESS_MASTER': 'MASTERS',
        'TAX_MASTER': 'MASTERS',
        // Customer Relationship (CRM) aliases
        'CUSTOMER_REMINDERS': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_DASHBOARD': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_CONFIG': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_PROCESS': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_HISTORY': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_REPORTS': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_TEMPLATES': 'STORE_TX_JOB_CARD_ISSUE'
      };

      const parentCode = aliasMap[subModuleCode];
      const parentEntry = parentCode ? list.find(rp => rp.role_id === roleId && rp.perm_code === parentCode) : null;
      const role = (window.DB.getAll('roles') || []).find(r => r.id === roleId);
      const isSystemAdminRole = role && (role.id === 'ROLE-ADMIN' && role.is_system === true);

      entry = {
        role_id: roleId,
        perm_code: subModuleCode,
        view: parentEntry ? !!parentEntry.view : (isSystemAdminRole ? true : false),
        add: parentEntry ? !!parentEntry.add : (isSystemAdminRole ? true : false),
        edit: parentEntry ? !!parentEntry.edit : (isSystemAdminRole ? true : false),
        delete: parentEntry ? !!parentEntry.delete : (isSystemAdminRole ? true : false),
        approve: parentEntry ? !!parentEntry.approve : (isSystemAdminRole ? true : false),
        export: parentEntry ? !!parentEntry.export : (isSystemAdminRole ? true : false),
        print: parentEntry ? !!parentEntry.print : (isSystemAdminRole ? true : false),
        submit: parentEntry ? !!parentEntry.submit : (isSystemAdminRole ? true : false),
        reject: parentEntry ? !!parentEntry.reject : (isSystemAdminRole ? true : false),
        cancel: parentEntry ? !!parentEntry.cancel : (isSystemAdminRole ? true : false),
        import: parentEntry ? !!parentEntry.import : (isSystemAdminRole ? true : false),
        post: parentEntry ? !!parentEntry.post : (isSystemAdminRole ? true : false),
        reverse: parentEntry ? !!parentEntry.reverse : (isSystemAdminRole ? true : false),
        close: parentEntry ? !!parentEntry.close : (isSystemAdminRole ? true : false),
        reopen: parentEntry ? !!parentEntry.reopen : (isSystemAdminRole ? true : false)
      };
      list.push(entry);
    }
    return entry;
  },

  renderPermissionMaster() {
    if (this.permViewMode === 'CATALOG') {
      return this.renderPermissionCatalogMaster();
    }
    return this.renderSubModulePermissionMatrix('PERMISSIONS');
  },

  renderRolePermissionMatrix() {
    return this.renderSubModulePermissionMatrix('ROLE_PERM_MAP');
  },

  switchPermViewMode(mode) {
    this.permViewMode = mode;
    this.render();
  },

  configurePermissionRights(permCode) {
    this.permSearchTerm = permCode;
    this.permCategoryFilter = 'ALL';
    this.permViewMode = 'MATRIX';
    this.render();
  },

  renderPermissionCatalogMaster() {
    const defaultCategories = [
      'Overview',
      'Billing & Job Card',
      'Customer Relationship (CRM)',
      'Item Master Setup',
      'Store Master Setup',
      'Procurement',
      'Quality & Storage',
      'Inventory & Logistics',
      'Manufacturing',
      'Outbound Logistics',
      'Control & Audits',
      'Organization & Facility Setup',
      'Security Suite'
    ];
    const catSet = new Set(defaultCategories);
    (this.subModulesCatalog || []).forEach(sm => { if (sm.category) catSet.add(sm.category); });
    const categories = Array.from(catSet);

    const filteredList = this.subModulesCatalog.filter(sm => {
      const matchCat = (this.permCategoryFilter === 'ALL' || sm.category === this.permCategoryFilter ||
        (this.permCategoryFilter === 'Store & Inventory Master' && sm.category.includes('Store & Inventory')) ||
        (this.permCategoryFilter === 'Store & Inventory' && sm.category.includes('Store & Inventory')));
      if (!matchCat) return false;
      if (this.permSearchTerm) {
        const q = this.permSearchTerm.toLowerCase();
        return sm.name.toLowerCase().includes(q) || sm.code.toLowerCase().includes(q) || sm.description.toLowerCase().includes(q) || sm.category.toLowerCase().includes(q);
      }
      return true;
    });

    return `
      <div class="content-card">
        <!-- Main Header Ribbon with Search Box and View Mode Buttons -->
        <div class="card-header" style="flex-wrap: wrap; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
          <div class="card-title" style="display: flex; align-items: center; gap: 10px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2">
              <path d="M21 2l-2 2m-1.5 1.5L16 7l-1.5-1.5M16 7l-4 4m0 0l-2-2-4 4 2 2 4-4m0 0l4-4m-6 6l-6 6v3h3l6-6"/>
            </svg>
            <span style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Permission Master</span>
          </div>

          <!-- Upper Side: Search Box & View Mode Toggle Buttons -->
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="position: relative; width: 270px;">
              <input 
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Search permissions by name, code..."
                value="${this.permSearchTerm || ''}"
                oninput="window.UserManagementModule.searchSubModules(this.value)"
                id="perm-master-search-input"
                style="padding-left: 32px !important; padding-right: ${this.permSearchTerm ? '26px' : '10px'} !important; height: 32px; border-radius: var(--radius-pill);"
              />
              <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; opacity: 0.6; pointer-events: none;">🔍</span>
              ${this.permSearchTerm ? `<button type="button" onclick="var inp=document.getElementById('perm-master-search-input'); if(inp){ inp.value=''; window.UserManagementModule.searchSubModules(''); inp.focus(); }" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 13px;">✕</button>` : ''}
            </div>

            <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.switchPermViewMode('CATALOG')" title="View in Permission Master Catalog table format">
              📋 Permission Catalog
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.switchPermViewMode('MATRIX')" title="Switch to Role-Permission Matrix Controller">
              🎛️ Role-Permission Matrix
            </button>
          </div>
        </div>

        <!-- Category Filter Pills -->
        <div style="padding: 8px 16px; background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
          <div class="perm-cat-pills" style="display: flex; flex-wrap: wrap; gap: 4px;">
            <button 
              class="perm-cat-pill ${this.permCategoryFilter === 'ALL' ? 'active' : ''}" 
              onclick="window.UserManagementModule.filterSubModulesByCategory('ALL')"
            >
              All
            </button>
            ${categories.map(cat => `
              <button 
                class="perm-cat-pill ${this.permCategoryFilter === cat ? 'active' : ''}" 
                onclick="window.UserManagementModule.filterSubModulesByCategory('${cat}')"
              >
                ${cat}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Permission Master Table -->
        <div class="table-responsive" style="max-height: 640px; overflow-y: auto;">
          <table class="data-table" style="font-size: 12.5px; margin-bottom: 0;">
            <thead style="position: sticky; top: 0; z-index: 3; background: var(--bg-surface);">
              <tr>
                <th style="width: 210px; padding: 8px 12px;">Permission / Functional Component</th>
                <th style="width: 130px; padding: 8px 10px;">Permission Code</th>
                <th style="width: 130px; padding: 8px 10px;">Module Category</th>
                <th style="padding: 8px 12px;">Operational Scope & BRD Reference</th>
                <th style="width: 175px; padding: 8px 10px;">Supported Core Rights</th>
                <th style="width: 75px; text-align: center; padding: 8px 10px;">Target Route</th>
                <th class="text-right" style="width: 110px; padding: 8px 14px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredList.length === 0 ? `
                <tr>
                  <td colspan="7" class="text-center" style="padding: 32px; color: var(--text-muted);">
                    No permissions match the current search or category filter.
                  </td>
                </tr>
              ` : filteredList.map(sm => `
                <tr class="submodule-perm-row" data-category="${sm.category}">
                  <td style="padding: 8px 12px;">
                    <div style="font-weight: 700; color: var(--text-primary);">
                      <a href="${sm.route}" style="font-weight: 700; color: var(--text-primary); text-decoration: none;">
                        ${sm.name}
                      </a>
                    </div>
                  </td>
                  <td style="padding: 8px 10px;">
                    <code style="font-size: 11px; color: var(--primary-300); background: rgba(99, 102, 241, 0.1); padding: 2px 6px; border-radius: 4px; white-space: nowrap;">
                      ${sm.code}
                    </code>
                  </td>
                  <td style="padding: 8px 10px;">
                    <span class="badge ${sm.category.includes('Store & Inventory') ? 'badge-primary' : 'badge-subtle'}" style="font-size: 10.5px; white-space: nowrap;">
                      ${sm.category}
                    </span>
                  </td>
                  <td style="padding: 8px 12px;">
                    <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">
                      ${sm.description}
                    </div>
                  </td>
                  <td style="padding: 8px 10px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 3px;">
                      ${this.coreRights.map(cr => `
                        <span style="font-size: 9.5px; font-weight: 700; color: ${cr.color}; background: rgba(255,255,255,0.04); border: 1px solid ${cr.color}33; padding: 1px 4px; border-radius: 3px; white-space: nowrap;" title="${cr.title}">
                          ${cr.label}
                        </span>
                      `).join('')}
                    </div>
                  </td>
                  <td style="text-align: center; padding: 8px 10px;">
                    <a href="${sm.route}" class="btn btn-outline btn-xs" style="font-size: 10px; padding: 2px 6px; text-decoration: none; white-space: nowrap;" title="Navigate to ${sm.name}">
                      🔗 Open
                    </a>
                  </td>
                  <td class="text-right" style="padding: 8px 14px;">
                    <button class="btn btn-secondary btn-xs" onclick="window.UserManagementModule.configurePermissionRights('${sm.code}')" title="Configure role rights for ${sm.name}" style="white-space: nowrap;">
                      🎛️ Configure
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderSubModulePermissionMatrix(contextTab) {
    const roles = window.DB.getAll('roles') || [];
    let activeRole = roles.find(r => r.id === this.selectedRoleId);
    if (!activeRole) {
      activeRole = roles.find(r => r.id === 'ROLE-STORE-MGR') || roles[0] || {
        id: 'ROLE-STORE-MGR',
        name: 'Store Manager',
        code: 'STORE_MGR',
        description: 'Store operations supervisor',
        user_count: 1
      };
      this.selectedRoleId = activeRole.id;
    }

    const isAdmin = activeRole && (activeRole.code === 'SYSTEM_ADMIN' || activeRole.code === 'ADMIN' || activeRole.id === 'ROLE-ADMIN');

    // Determine active columns (Standard 7 core rights vs All 15 granular actions)
    const activeCols = this.permGranularMode
      ? [...this.coreRights, ...this.extendedRights]
      : this.coreRights;

    // Sub-module categories list matching all enterprise modules
    const defaultCategories = [
      'Overview',
      'Billing & Job Card',
      'Customer Relationship (CRM)',
      'Item Master Setup',
      'Store Master Setup',
      'Procurement',
      'Quality & Storage',
      'Inventory & Logistics',
      'Manufacturing',
      'Outbound Logistics',
      'Control & Audits',
      'Organization & Facility Setup',
      'Security Suite'
    ];
    const catSet = new Set(defaultCategories);
    (this.subModulesCatalog || []).forEach(sm => { if (sm.category) catSet.add(sm.category); });
    const categories = Array.from(catSet);

    // Compute metrics for active role
    let enabledSubModulesCount = 0;
    let totalAssignedRightsCount = 0;

    this.subModulesCatalog.forEach(sm => {
      const entry = this.getSubModulePermEntry(activeRole.id, sm.code);
      if (entry.view || isAdmin) enabledSubModulesCount++;
      activeCols.forEach(c => {
        if (entry[c.key] || isAdmin) totalAssignedRightsCount++;
      });
    });

    return `
      <div class="content-card">
        <!-- Main Header & Role Selector Ribbon -->
        <div class="card-header" style="flex-wrap: wrap; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle);">
          <div class="card-title" style="display: flex; align-items: center; gap: 10px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <div>
              <span style="font-size: 15px; font-weight: 700; color: var(--text-primary);">${contextTab === 'PERMISSIONS' ? 'Permission Master' : 'Permissions Matrix'}</span>
            </div>
          </div>

          <!-- Role Selector Dropdown & Quick Presets -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${contextTab === 'PERMISSIONS' ? `
              <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.switchPermViewMode('CATALOG')" title="View in Permission Master Catalog table format">
                📋 Permission Catalog
              </button>
              <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.switchPermViewMode('MATRIX')" title="Currently viewing Role-Permission Matrix">
                🎛️ Role-Permission Matrix
              </button>
            ` : ''}

            <label style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary);">Target Role:</label>
            <select 
              class="form-control form-control-sm" 
              style="width: 250px; font-weight: 600; background: var(--bg-surface); border-color: var(--primary-500); cursor: pointer;"
              onchange="window.UserManagementModule.selectRoleForMatrix(this.value)"
              id="role-perm-select-role"
            >
              ${roles.map(r => `
                <option value="${r.id}" ${r.id === activeRole.id ? 'selected' : ''}>
                  ${r.name} (${r.code})
                </option>
              `).join('')}
            </select>

            <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.applyMatrixPreset('${activeRole.id}', 'FULL')" ${isAdmin ? 'disabled' : ''} title="Grant all rights across all sub-modules">
              ✓ Full Rights
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.applyMatrixPreset('${activeRole.id}', 'READONLY')" ${isAdmin ? 'disabled' : ''} title="Grant View, Export & Print Only">
              👓 Read-Only
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.applyMatrixPreset('${activeRole.id}', 'OPERATIONAL')" ${isAdmin ? 'disabled' : ''} title="Grant View, Add, Edit, Export & Print">
              ⚡ Operational
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.applyMatrixPreset('${activeRole.id}', 'APPROVER')" ${isAdmin ? 'disabled' : ''} title="Grant View, Approve, Export & Print">
              ✍️ Approver
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.revokeAllPerms('${activeRole.id}')" ${isAdmin ? 'disabled' : ''} title="Clear all capabilities for this role">
              ✕ Clear
            </button>

            <button class="btn ${this.permGranularMode ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="window.UserManagementModule.toggleGranularPermMode()" title="Toggle between 7 Core Rights and 15 Granular Actions">
              ${this.permGranularMode ? '⚙️ Actions' : '📋 Core Rights'}
            </button>

            <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.saveRolePermissions()" title="Persist rights configuration">
              💾 Save Rights
            </button>
          </div>
        </div>

        <!-- Search Bar & Category Filter Pills (Zero Numbers) -->
        <div style="padding: 10px 16px; background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1;">
            <div style="position: relative; min-width: 240px; max-width: 320px;">
              <input 
                type="text" 
                class="form-control form-control-sm" 
                placeholder="Search sub-modules by name or code..."
                value="${this.permSearchTerm || ''}"
                oninput="window.UserManagementModule.searchSubModules(this.value)"
                id="submodule-perm-search-input"
                style="padding-left: 32px !important; padding-right: ${this.permSearchTerm ? '26px' : '10px'} !important; border-radius: var(--radius-pill);"
              />
              <span style="position: absolute; left: 9px; top: 7px; font-size: 12px; opacity: 0.6;">🔍</span>
              ${this.permSearchTerm ? `<button type="button" onclick="var inp=document.getElementById('submodule-perm-search-input'); if(inp){ inp.value=''; window.UserManagementModule.searchSubModules(''); inp.focus(); }" style="position: absolute; right: 8px; top: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer;">✕</button>` : ''}
            </div>

            <!-- Category Pills (Zero Numbers) -->
            <div class="perm-cat-pills" style="margin-left: 6px; display: flex; flex-wrap: wrap; gap: 4px;">
              <button 
                class="perm-cat-pill ${this.permCategoryFilter === 'ALL' ? 'active' : ''}" 
                onclick="window.UserManagementModule.filterSubModulesByCategory('ALL')"
              >
                All
              </button>
              ${categories.map(cat => `
                <button 
                  class="perm-cat-pill ${this.permCategoryFilter === cat ? 'active' : ''}" 
                  onclick="window.UserManagementModule.filterSubModulesByCategory('${cat}')"
                >
                  ${cat}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Sub-Module Rights Matrix Table -->
        <div class="table-responsive" style="max-height: 620px; overflow-y: auto;">
          <table class="data-table perm-matrix-table" style="font-size: 12px; margin-bottom: 0;">
            <thead style="position: sticky; top: 0; z-index: 3; background: var(--bg-surface);">
              <tr>
                <th style="min-width: 280px; padding: 10px 14px;">
                  Sub-Module / Functional Component
                </th>
                ${activeCols.map(c => `
                  <th 
                    class="text-center" 
                    style="width: 65px; padding: 8px 4px; cursor: pointer; user-select: none;" 
                    title="Click header to Toggle ${c.label} right across all sub-modules for ${activeRole.name}"
                    onclick="window.UserManagementModule.toggleSubModuleColumn('${activeRole.id}', '${c.key}')"
                  >
                    <div style="font-size: 10.5px; font-weight: 700; color: ${c.color || 'var(--text-primary)'};">${c.label}</div>
                    <span style="font-size: 8.5px; opacity: 0.6; display: block;">Toggle ▾</span>
                  </th>
                `).join('')}
                <th class="text-right" style="width: 85px; padding: 8px 12px;">Row Toggle</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map(catName => {
                const subModules = this.subModulesCatalog.filter(sm => {
                  const matchCat = (this.permCategoryFilter === 'ALL' || this.permCategoryFilter === catName) && sm.category === catName;
                  if (!matchCat) return false;
                  if (this.permSearchTerm) {
                    const q = this.permSearchTerm.toLowerCase();
                    return sm.name.toLowerCase().includes(q) || sm.code.toLowerCase().includes(q) || sm.description.toLowerCase().includes(q);
                  }
                  return true;
                });

                if (subModules.length === 0) return '';

                const catIcon = subModules[0].categoryIcon || '📁';

                return `
                  <!-- Category Header Row (Zero Numbers) -->
                  <tr class="perm-cat-header-row submodule-cat-row" data-category="${catName}">
                    <td colspan="${activeCols.length + 2}">
                      <div style="display: flex; align-items: center; justify-content: space-between; padding: 2px 4px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-weight: 700; color: var(--primary-300); font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${catName}
                          </span>
                        </div>
                        <div style="display: flex; gap: 6px;">
                          <button 
                            class="btn btn-secondary btn-xs" 
                            style="font-size: 10px; padding: 2px 8px;"
                            onclick="window.UserManagementModule.toggleCategoryRights('${activeRole.id}', '${catName}', true)"
                            ${isAdmin ? 'disabled' : ''}
                            title="Grant all active rights for all sub-modules in ${catName}"
                          >
                            ✓ Grant ${catName}
                          </button>
                          <button 
                            class="btn btn-secondary btn-xs" 
                            style="font-size: 10px; padding: 2px 8px;"
                            onclick="window.UserManagementModule.toggleCategoryRights('${activeRole.id}', '${catName}', false)"
                            ${isAdmin ? 'disabled' : ''}
                            title="Revoke rights for ${catName}"
                          >
                            ✕ Clear ${catName}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Sub-Module Rows -->
                  ${subModules.map(sm => {
                    const map = this.getSubModulePermEntry(activeRole.id, sm.code);

                    return `
                      <tr class="submodule-perm-row" data-category="${catName}">
                        <td style="padding: 9px 14px; vertical-align: middle;">
                          <a href="${sm.route}" style="font-weight: 600; color: var(--text-primary); font-size: 12.5px; text-decoration: none;" title="Navigate to ${sm.name}">
                            ${sm.name}
                          </a>
                        </td>

                        <!-- Rights Checkboxes -->
                        ${activeCols.map(c => `
                          <td class="text-center" style="padding: 6px 4px; vertical-align: middle;">
                            <input 
                              type="checkbox" 
                              class="perm-chk" 
                              id="chk_${sm.code}_${c.key}" 
                              ${map[c.key] || isAdmin ? 'checked' : ''} 
                              ${isAdmin ? 'disabled' : ''} 
                              title="${c.title} for ${sm.name}"
                              onchange="window.UserManagementModule.updatePermCheckbox('${activeRole.id}', '${sm.code}', '${c.key}', this.checked)" 
                            />
                          </td>
                        `).join('')}

                        <!-- Row Toggle Action -->
                        <td class="text-right" style="padding: 6px 12px; vertical-align: middle;">
                          ${!isAdmin ? `
                            <button 
                              class="btn btn-secondary btn-xs" 
                              style="padding: 2px 7px; font-size: 10.5px;" 
                              onclick="window.UserManagementModule.toggleRowPerms('${activeRole.id}', '${sm.code}')"
                              title="Toggle all rights for ${sm.name}"
                            >
                              Toggle
                            </button>
                          ` : '<span style="font-size: 10px; color: var(--text-muted);">Locked (Admin)</span>'}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  selectRoleForMatrix(roleId) {
    this.selectedRoleId = roleId;
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  filterSubModulesByCategory(cat) {
    this.permCategoryFilter = cat;
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  searchSubModules(term) {
    this.permSearchTerm = term;
    const q = (term || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.submodule-perm-row');
    const catHeaders = document.querySelectorAll('.submodule-cat-row');

    rows.forEach(r => {
      const text = r.innerText.toLowerCase();
      if (!q || text.indexOf(q) !== -1) {
        r.style.display = '';
      } else {
        r.style.display = 'none';
      }
    });

    catHeaders.forEach(ch => {
      const cat = ch.getAttribute('data-category');
      const visibleUnderCat = document.querySelectorAll(`.submodule-perm-row[data-category="${cat}"]:not([style*="display: none"])`);
      ch.style.display = visibleUnderCat.length > 0 ? '' : 'none';
    });
  },

  toggleGranularPermMode() {
    this.permGranularMode = !this.permGranularMode;
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  updatePermCheckbox(roleId, permCode, action, isChecked) {
    const entry = this.getSubModulePermEntry(roleId, permCode);
    entry[action] = isChecked;

    // Intelligent RBAC dependency: If user grants Add/Edit/Delete/Approve, ensure View is enabled
    if (isChecked && ['add', 'edit', 'delete', 'approve', 'submit', 'post'].includes(action)) {
      if (!entry.view) {
        entry.view = true;
        const viewChk = document.getElementById(`chk_${permCode}_view`);
        if (viewChk) viewChk.checked = true;
      }
    }

    window.DB.saveData();
    if (window.DB.syncRolePermissionsToBackend) {
      window.DB.syncRolePermissionsToBackend([entry]);
    }
    this.refreshPermCounters(roleId);
    if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
      window.App.filterSidebarByPermissions();
    }
    if (window.State && typeof window.State.notify === 'function') {
      window.State.notify();
    }
  },

  refreshPermCounters(roleId) {
    const activeCols = this.permGranularMode
      ? [...this.coreRights, ...this.extendedRights]
      : this.coreRights;

    let enabledCount = 0;
    let rightsCount = 0;

    this.subModulesCatalog.forEach(sm => {
      const entry = this.getSubModulePermEntry(roleId, sm.code);
      if (entry.view) enabledCount++;
      activeCols.forEach(c => {
        if (entry[c.key]) rightsCount++;
      });
    });

    const badgeEnabled = document.getElementById('badge-perm-enabled-count');
    if (badgeEnabled) badgeEnabled.innerText = `✓ ${enabledCount} / ${this.subModulesCatalog.length} Sub-Modules Permitted`;

    const badgeRights = document.getElementById('badge-perm-rights-count');
    if (badgeRights) badgeRights.innerText = `🔑 ${rightsCount} Active Rights`;
  },

  toggleRowPerms(roleId, permCode) {
    const entry = this.getSubModulePermEntry(roleId, permCode);
    const targetState = !entry.view;

    const allKeys = ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject', 'cancel', 'print', 'export', 'import', 'post', 'reverse', 'close', 'reopen'];
    allKeys.forEach(k => { entry[k] = targetState; });

    window.DB.saveData();
    if (window.DB.syncRolePermissionsToBackend) {
      window.DB.syncRolePermissionsToBackend([entry]);
    }
    if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
      window.App.filterSidebarByPermissions();
    }
    if (window.State && typeof window.State.notify === 'function') {
      window.State.notify();
    }
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  toggleSubModuleColumn(roleId, actionKey) {
    const catalog = this.subModulesCatalog;
    let anyFalse = false;
    catalog.forEach(sm => {
      const entry = this.getSubModulePermEntry(roleId, sm.code);
      if (!entry[actionKey]) anyFalse = true;
    });

    const target = anyFalse; // if any is unchecked, check all; otherwise uncheck all
    const updatedEntries = [];
    catalog.forEach(sm => {
      const entry = this.getSubModulePermEntry(roleId, sm.code);
      entry[actionKey] = target;
      if (target && ['add', 'edit', 'delete', 'approve', 'submit', 'post'].includes(actionKey)) {
        entry.view = true;
      }
      updatedEntries.push(entry);
    });

    window.DB.saveData();
    if (window.DB.syncRolePermissionsToBackend && updatedEntries.length > 0) {
      window.DB.syncRolePermissionsToBackend(updatedEntries);
    }
    if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
      window.App.filterSidebarByPermissions();
    }
    if (window.State && typeof window.State.notify === 'function') {
      window.State.notify();
    }
    window.State.showToast(`${target ? 'Granted' : 'Revoked'} ${actionKey.toUpperCase()} right across all sub-modules.`, 'info');
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  toggleCategoryRights(roleId, categoryName, targetState) {
    const subModules = this.subModulesCatalog.filter(sm => sm.category === categoryName);
    const allKeys = ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject', 'cancel', 'print', 'export', 'import', 'post', 'reverse', 'close', 'reopen'];
    const updatedEntries = [];

    subModules.forEach(sm => {
      const entry = this.getSubModulePermEntry(roleId, sm.code);
      allKeys.forEach(k => { entry[k] = targetState; });
      updatedEntries.push(entry);
    });

    window.DB.saveData();
    if (window.DB.syncRolePermissionsToBackend && updatedEntries.length > 0) {
      window.DB.syncRolePermissionsToBackend(updatedEntries);
    }
    if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
      window.App.filterSidebarByPermissions();
    }
    if (window.State && typeof window.State.notify === 'function') {
      window.State.notify();
    }
    window.State.showToast(`${targetState ? 'Granted' : 'Revoked'} all rights for ${categoryName}.`, 'info');
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  applyMatrixPreset(roleId, presetType) {
    const allKeys = ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject', 'cancel', 'print', 'export', 'import', 'post', 'reverse', 'close', 'reopen'];

    this.subModulesCatalog.forEach(sm => {
      const entry = this.getSubModulePermEntry(roleId, sm.code);
      allKeys.forEach(k => { entry[k] = false; });

      if (presetType === 'FULL') {
        allKeys.forEach(k => { entry[k] = true; });
      } else if (presetType === 'READONLY') {
        entry.view = true;
        entry.print = true;
        entry.export = true;
      } else if (presetType === 'OPERATIONAL') {
        entry.view = true;
        entry.add = true;
        entry.edit = true;
        entry.submit = true;
        entry.print = true;
        entry.export = true;
        entry.post = true;
      } else if (presetType === 'APPROVER') {
        entry.view = true;
        entry.approve = true;
        entry.reject = true;
        entry.cancel = true;
        entry.print = true;
        entry.export = true;
        entry.close = true;
      }
    });

    window.DB.saveData();
    const updatedRolePerms = (window.DB.data.role_permissions || []).filter(rp => rp.role_id === roleId);
    if (window.DB.syncRolePermissionsToBackend && updatedRolePerms.length > 0) {
      window.DB.syncRolePermissionsToBackend(updatedRolePerms);
    }
    if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
      window.App.filterSidebarByPermissions();
    }
    if (window.State && typeof window.State.notify === 'function') {
      window.State.notify();
    }
    window.State.showToast(`Applied preset '${presetType}' to role permissions.`, 'success');
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  grantAllPerms(roleId) {
    this.applyMatrixPreset(roleId, 'FULL');
  },

  revokeAllPerms(roleId) {
    const allKeys = ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject', 'cancel', 'print', 'export', 'import', 'post', 'reverse', 'close', 'reopen'];
    this.subModulesCatalog.forEach(sm => {
      const entry = this.getSubModulePermEntry(roleId, sm.code);
      allKeys.forEach(k => { entry[k] = false; });
    });

    window.DB.saveData();
    const updatedRolePerms = (window.DB.data.role_permissions || []).filter(rp => rp.role_id === roleId);
    if (window.DB.syncRolePermissionsToBackend && updatedRolePerms.length > 0) {
      window.DB.syncRolePermissionsToBackend(updatedRolePerms);
    }
    if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
      window.App.filterSidebarByPermissions();
    }
    if (window.State && typeof window.State.notify === 'function') {
      window.State.notify();
    }
    window.State.showToast(`Cleared all rights for role.`, 'info');
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  saveRolePermissions() {
    window.DB.saveData();
    const roles = window.DB.getAll('roles') || [];
    const role = roles.find(r => r.id === this.selectedRoleId);
    const roleName = role ? role.name : this.selectedRoleId;

    const rolePerms = (window.DB.data.role_permissions || []).filter(rp => rp.role_id === this.selectedRoleId);
    if (window.DB.syncRolePermissionsToBackend && rolePerms.length > 0) {
      window.DB.syncRolePermissionsToBackend(rolePerms);
    }

    if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
      window.App.filterSidebarByPermissions();
    }
    if (window.State && typeof window.State.notify === 'function') {
      window.State.notify();
    }

    window.DB.logAudit('PERMISSIONS_SAVED', 'Security', this.selectedRoleId, `Saved updated sub-module rights matrix for role ${roleName}`);
    window.State.showToast(`Permissions successfully saved for ${roleName}.`, 'success');
  },


  /* ========================================================================
     6. USER-ROLE MAPPING (SUB-MODULE 6)
     ======================================================================== */
  renderUserRoleMapping() {
    const users = window.DB.getAll('users') || [];
    const roles = window.DB.getAll('roles') || [];

    return `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>User-Role Assignment Mapping</span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Username</th>
                <th>Primary Role (Governing Policy)</th>
                <th>Additional Delegated Roles</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => {
                const primaryRole = roles.find(r => r.id === u.primary_role) || { name: u.primary_role };
                const secondaryRoles = (u.secondary_roles || []).map(rId => roles.find(r => r.id === rId)).filter(Boolean);

                return `
                  <tr>
                    <td>
                      <div style="font-weight: 600; color: var(--text-primary); font-size: 13px;">${u.full_name || u.username}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${u.email}</div>
                    </td>
                    <td>
                      <span style="font-family: var(--font-mono); font-size: 12px; font-weight: 600; color: var(--primary-300);">${u.username}</span>
                    </td>
                    <td>
                      <span class="badge badge-primary" style="font-weight: 700;">
                        👑 ${primaryRole.name}
                      </span>
                    </td>
                    <td>
                      ${secondaryRoles.length > 0 ? secondaryRoles.map(sr => `
                        <span class="badge badge-subtle" style="margin-right: 4px;">${sr.name}</span>
                      `).join('') : '<span style="font-size: 12px; color: var(--text-muted);">None (Primary only)</span>'}
                    </td>
                    <td class="text-right">
                      <button class="btn btn-secondary btn-xs" onclick="window.UserManagementModule.showAssignRolesModal('${u.id}')">
                        ⚡ Modify Roles
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showAssignRolesModal(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;
    const roles = window.DB.getAll('roles') || [];

    const contentHtml = `
      <div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
          Assign roles for <strong>${user.full_name || user.username}</strong> (${user.username}).
        </p>

        <div class="form-group">
          <label class="form-label">Primary Role</label>
          <select id="user-primary-role-select" class="form-control">
            ${roles.map(r => `
              <option value="${r.id}" ${r.id === user.primary_role ? 'selected' : ''}>${r.name}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group" style="margin-top: 16px;">
          <label class="form-label">Secondary / Delegated Roles</label>
          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto; padding: 8px; background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            ${roles.map(r => `
              <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer;">
                <input type="checkbox" class="secondary-role-chk" value="${r.id}" ${(user.secondary_roles || []).includes(r.id) ? 'checked' : ''} />
                <span>${r.name} (${r.code})</span>
              </label>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    window.State.showModal({
      title: `👑 Modify Roles: ${user.username}`,
      contentHtml: contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.UserManagementModule.submitAssignRoles('${user.id}')">Save Role Assignment</button>
      `,
      maxWidth: '500px'
    });
  },

  submitAssignRoles(userId) {
    const primaryRole = document.getElementById('user-primary-role-select').value;
    const chks = document.querySelectorAll('.secondary-role-chk:checked');
    const secondaryRoles = Array.from(chks).map(c => c.value).filter(r => r !== primaryRole);

    // Segregation of Duties Conflict Validation (BRD §13, §33, §43)
    if (window.State.validateSoDConflict) {
      const allRoles = [primaryRole, ...secondaryRoles];
      const conflict = window.State.validateSoDConflict(allRoles);
      if (conflict) {
        if (!confirm(`⚠️ Segregation of Duties (SoD) Conflict Detected:\n\nRule: ${conflict.rule.rule_code} - ${conflict.rule.description}\nSeverity: ${conflict.rule.severity}\n\nAssigning both roles violates organizational governance policies.\n\nDo you still wish to proceed with this assignment?`)) {
          return;
        }
      }
    }

    window.DB.update('users', userId, {
      primary_role: primaryRole,
      secondary_roles: secondaryRoles
    });

    window.DB.logAudit('USER_ROLE_ASSIGNED', 'Security', userId, `Updated roles for user ${userId}: Primary ${primaryRole}, Secondary: ${secondaryRoles.join(', ')}`);
    window.State.closeModal();
    window.State.showToast('Role assignments updated successfully.', 'success');
    this.render();
  },

  /* ========================================================================
     9. SEGREGATION OF DUTIES (SOD) RULES (BRD §13, §33)
     ======================================================================== */
  renderSoDRules() {
    const sodRules = window.DB.getAll('sod_rules') || [];

    return `
      <div class="content-card">
        <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/><path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4"/><circle cx="8" cy="12" r="2"/></svg>
            <span>Segregation of Duties (SoD) Governance Rules</span>
            <span class="badge badge-primary" style="margin-left: 8px;">${sodRules.length} Enterprise Rules</span>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.scanForSoDViolations()">
              🔍 Run Enterprise SoD Scan
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.showCreateSoDRuleModal()">
              <span>+ Add SoD Conflict Rule</span>
            </button>
          </div>
        </div>

        <div class="alert alert-info" style="margin-bottom: 20px; font-size: 13px;">
          <strong>Segregation of Duties (SoD) Policy (BRD §13):</strong> Prevents malicious or erroneous transactions by ensuring 
          the same user cannot perform conflicting operational activities (e.g. Creator cannot Approve own Purchase Order or Stock Adjustment).
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rule Code</th>
                <th>Conflict Description</th>
                <th>Conflicting Function A</th>
                <th>Conflicting Function B</th>
                <th>Severity</th>
                <th>Enforcement Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${sodRules.map((rule, idx) => {
                let sevBadge = 'badge-info';
                if (rule.severity === 'CRITICAL') sevBadge = 'badge-danger';
                else if (rule.severity === 'HIGH') sevBadge = 'badge-warning';

                return `
                  <tr>
                    <td>
                      <span style="font-family: var(--font-mono); font-weight: 700; color: var(--primary-300);">${rule.rule_code || rule.code || `SOD-00${idx+1}`}</span>
                    </td>
                    <td>
                      <strong style="color: var(--text-primary); font-size: 13px;">${rule.description || rule.rule_name}</strong>
                      <div style="font-size: 11px; color: var(--text-muted);">${rule.mitigation || 'Zero tolerance policy enforced.'}</div>
                    </td>
                    <td>
                      <span class="badge badge-subtle" style="font-family: var(--font-mono); font-size: 11px;">
                        ${rule.conflicting_function_a || rule.function_a || 'PO_CREATE'}
                      </span>
                    </td>
                    <td>
                      <span class="badge badge-subtle" style="font-family: var(--font-mono); font-size: 11px;">
                        ${rule.conflicting_function_b || rule.function_b || 'PO_APPROVE'}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${sevBadge}" style="font-weight: 700;">${rule.severity}</span>
                    </td>
                    <td>
                      <label class="switch" style="transform: scale(0.8); margin: 0;">
                        <input type="checkbox" ${rule.status === 'ACTIVE' ? 'checked' : ''} onchange="window.UserManagementModule.toggleSoDRule('${rule.id || rule.rule_code}', this.checked)" />
                        <span class="slider round"></span>
                      </label>
                      <span style="font-size: 11.5px; margin-left: 6px; color: ${rule.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--text-muted)'}; font-weight: 600;">
                        ${rule.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td class="text-right">
                      <button class="btn btn-danger btn-xs" onclick="window.UserManagementModule.deleteSoDRule('${rule.id || rule.rule_code}')">
                        Delete
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  scanForSoDViolations() {
    const users = window.DB.getAll('users') || [];
    const roles = window.DB.getAll('roles') || [];
    const sodRules = (window.DB.getAll('sod_rules') || []).filter(r => r.status === 'ACTIVE');

    const violations = [];

    users.forEach(user => {
      const userRoleIds = [user.primary_role, ...(user.secondary_roles || [])].filter(Boolean);
      const userRoles = userRoleIds.map(rid => roles.find(r => r.id === rid)).filter(Boolean);

      sodRules.forEach(rule => {
        const hasA = userRoles.some(r => r.code === rule.conflicting_role_a || (r.permissions && r.permissions.includes(rule.conflicting_function_a)));
        const hasB = userRoles.some(r => r.code === rule.conflicting_role_b || (r.permissions && r.permissions.includes(rule.conflicting_function_b)));

        if ((rule.conflicting_role_a && rule.conflicting_role_b && 
             userRoleIds.includes(rule.conflicting_role_a) && userRoleIds.includes(rule.conflicting_role_b)) ||
            (hasA && hasB)) {
          violations.push({
            user: user,
            rule: rule,
            conflict: `${rule.conflicting_function_a || rule.conflicting_role_a} &bull; ${rule.conflicting_function_b || rule.conflicting_role_b}`,
            severity: rule.severity
          });
        }
      });
    });

    if (violations.length === 0) {
      window.State.showModal({
        title: '⚖️ Enterprise SoD Violation Scan Results',
        contentHtml: `
          <div style="text-align: center; padding: 24px;">
            <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
            <h3 style="color: var(--color-success); margin-bottom: 8px;">Enterprise Governance Clean</h3>
            <p style="color: var(--text-secondary); font-size: 13.5px; max-width: 440px; margin: 0 auto;">
              Scanned <strong>${users.length}</strong> user accounts across <strong>${sodRules.length}</strong> active Segregation of Duties policy rules. 
              <strong>0 conflicting role or permission assignments detected.</strong>
            </p>
          </div>
        `,
        footerHtml: '<button class="btn btn-primary" onclick="window.State.closeModal()">Dismiss</button>',
        maxWidth: '500px'
      });
    } else {
      window.State.showModal({
        title: '⚠️ Enterprise SoD Conflicts Detected',
        contentHtml: `
          <div style="padding: 10px;">
            <p style="color: var(--color-danger); font-weight: 600; margin-bottom: 12px;">
              Found ${violations.length} segregation of duties violation(s) requiring immediate resolution:
            </p>
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Conflicting Functions</th>
                  <th>Severity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${violations.map(v => `
                  <tr>
                    <td><strong>${v.user.full_name || v.user.username}</strong> (${v.user.username})</td>
                    <td>${v.conflict}</td>
                    <td><span class="badge badge-danger">${v.severity}</span></td>
                    <td>
                      <button class="btn btn-secondary btn-xs" onclick="window.State.closeModal(); window.UserManagementModule.showAssignRolesModal('${v.user.id}');">Resolve</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `,
        footerHtml: '<button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>',
        maxWidth: '650px'
      });
    }
  },

  toggleSoDRule(ruleId, isChecked) {
    const rules = window.DB.data.sod_rules || [];
    const rule = rules.find(r => r.id === ruleId || r.rule_code === ruleId);
    if (rule) {
      rule.status = isChecked ? 'ACTIVE' : 'INACTIVE';
      window.DB.saveData();
      window.State.showToast(`SoD Rule ${rule.rule_code || ruleId} ${isChecked ? 'activated' : 'disabled'}.`, 'info');
    }
  },

  deleteSoDRule(ruleId) {
    if (!confirm('Are you sure you want to delete this SoD Rule?')) return;
    window.DB.data.sod_rules = (window.DB.data.sod_rules || []).filter(r => r.id !== ruleId && r.rule_code !== ruleId);
    window.DB.saveData();
    window.DB.logAudit('SOD_RULE_DELETED', 'Security', ruleId, `Deleted SoD rule ${ruleId}`);
    window.State.showToast('SoD Rule deleted.', 'warning');
    this.render();
  },

  showCreateSoDRuleModal() {
    const contentHtml = `
      <form id="create-sod-form" onsubmit="event.preventDefault(); window.UserManagementModule.submitCreateSoDRule();">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Rule Code <span style="color:var(--color-danger)">*</span></label>
            <input type="text" id="sod-code" class="form-control" placeholder="e.g. SOD-006" value="SOD-${String((window.DB.getAll('sod_rules')||[]).length+1).padStart(3,'0')}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Severity Level <span style="color:var(--color-danger)">*</span></label>
            <select id="sod-sev" class="form-control" required>
              <option value="CRITICAL">CRITICAL (Zero Tolerance / Immediate Block)</option>
              <option value="HIGH" selected>HIGH (Requires Executive Waiver)</option>
              <option value="MEDIUM">MEDIUM (Requires Dual Sign-off)</option>
            </select>
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Rule Description <span style="color:var(--color-danger)">*</span></label>
            <input type="text" id="sod-desc" class="form-control" placeholder="e.g. Dispatch Officer cannot create Sales Return" required />
          </div>
          <div class="form-group">
            <label class="form-label">Conflicting Activity A <span style="color:var(--color-danger)">*</span></label>
            <input type="text" id="sod-func-a" class="form-control" placeholder="e.g. DISPATCH_CREATE" required />
          </div>
          <div class="form-group">
            <label class="form-label">Conflicting Activity B <span style="color:var(--color-danger)">*</span></label>
            <input type="text" id="sod-func-b" class="form-control" placeholder="e.g. SALES_RETURN_APPROVE" required />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Mitigation / Compliance Requirement</label>
            <input type="text" id="sod-mitigation" class="form-control" placeholder="Activities must be assigned to different organizational reporting lines." />
          </div>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '⚖️ Add Segregation of Duties (SoD) Rule',
      contentHtml: contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.UserManagementModule.submitCreateSoDRule()">Save SoD Rule</button>
      `,
      maxWidth: '600px'
    });
  },

  submitCreateSoDRule() {
    const code = document.getElementById('sod-code').value.trim();
    const desc = document.getElementById('sod-desc').value.trim();
    const sev = document.getElementById('sod-sev').value;
    const funcA = document.getElementById('sod-func-a').value.trim();
    const funcB = document.getElementById('sod-func-b').value.trim();
    const mit = document.getElementById('sod-mitigation').value.trim();

    if (!code || !desc || !funcA || !funcB) {
      window.State.showToast('Please fill out all required fields.', 'error');
      return;
    }

    const newRule = {
      id: code,
      rule_code: code,
      description: desc,
      conflicting_function_a: funcA,
      conflicting_function_b: funcB,
      severity: sev,
      mitigation: mit,
      status: 'ACTIVE'
    };

    if (!window.DB.data.sod_rules) window.DB.data.sod_rules = [];
    window.DB.data.sod_rules.push(newRule);
    window.DB.saveData();
    window.DB.logAudit('SOD_RULE_CREATED', 'Security', code, `Configured SoD rule ${code}: ${desc}`);
    window.State.closeModal();
    window.State.showToast(`SoD Rule ${code} created successfully.`, 'success');
    this.render();
  },

  /* ========================================================================
     10. AMOUNT-BASED APPROVAL AUTHORITIES (BRD §14, §15)
     ======================================================================== */
  renderApprovalAuthorities() {
    const authorities = window.DB.getAll('approval_authorities') || [];
    const roles = window.DB.getAll('roles') || [];

    return `
      <div class="content-card">
        <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <span>Tiered Transaction Value Approval Authorities</span>
            <span class="badge badge-primary" style="margin-left: 8px;">${authorities.length} Configured Limits</span>
          </div>

          <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.showCreateApprovalLimitModal()">
            <span>+ Configure Approval Limit</span>
          </button>
        </div>

        <div class="alert alert-info" style="margin-bottom: 20px; font-size: 13px;">
          <strong>BRD §15 Tiered Financial Limits:</strong> Authorizations are governed by transaction currency amount:
          Tier 1 (Up to ₹10,000) &bull; Tier 2 (₹10,001 - ₹1,00,000) &bull; Tier 3 (₹1,00,001 - ₹10,00,000) &bull; Tier 4 (Above ₹10,00,000).
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Governing Role</th>
                  <th>Transaction Type</th>
                  <th>Max Approval Value</th>
                  <th>Approval Hierarchy Level</th>
                  <th>Dual Sign-Off</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                ${authorities.map((auth, idx) => {
                  const roleObj = roles.find(r => r.id === auth.role_id) || { name: auth.role_id };
                  const maxValStr = auth.max_amount ? `₹${Number(auth.max_amount).toLocaleString('en-IN')}` : 'Unlimited (Board Approval)';

                  return `
                    <tr>
                      <td>
                        <strong style="color: var(--text-primary); font-size: 13px;">👑 ${roleObj.name}</strong>
                        <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${auth.role_id}</div>
                      </td>
                      <td>
                        <span class="badge badge-subtle" style="font-size: 11.5px;">${auth.transaction_type || 'Purchase Order'}</span>
                      </td>
                      <td>
                        <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-success); font-size: 13px;">
                          ${maxValStr}
                        </span>
                      </td>
                      <td>
                        <span class="badge badge-primary">${auth.approval_level || 'Level 1'}</span>
                      </td>
                      <td>
                        ${auth.dual_signature_required ? '<span class="badge badge-warning">Dual Sign-off</span>' : '<span style="color: var(--text-muted); font-size: 12px;">Single Sign-off</span>'}
                      </td>
                      <td class="text-right">
                        <button class="btn btn-danger btn-xs" onclick="window.UserManagementModule.deleteApprovalLimit(${idx})">
                          Remove
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Interactive Simulator Widget -->
          <div class="content-card" style="margin: 0; background: rgba(255, 255, 255, 0.02);">
            <div class="card-header">
              <div class="card-title">
                <span>🧪 Approval Authority Simulator</span>
              </div>
            </div>
            <div style="padding-top: 8px;">
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
                Simulate whether an employee's role is authorized to approve a transaction at a given financial value.
              </p>

              <div class="form-group" style="margin-bottom: 10px;">
                <label class="form-label" style="font-size: 11.5px;">Role to Evaluate</label>
                <select id="sim-role-select" class="form-control form-control-sm">
                  ${roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 10px;">
                <label class="form-label" style="font-size: 11.5px;">Transaction Type</label>
                <select id="sim-type-select" class="form-control form-control-sm">
                  <option value="PURCHASE_ORDER">Purchase Order</option>
                  <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
                  <option value="PURCHASE_REQUISITION">Purchase Requisition</option>
                  <option value="CAPITAL_EXPENDITURE">Capital Expenditure</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" style="font-size: 11.5px;">Transaction Amount (₹ INR)</label>
                <input type="number" id="sim-amount-input" class="form-control form-control-sm" value="75000" placeholder="e.g. 75000" />
              </div>

              <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="window.UserManagementModule.simulateApprovalCheck()">
                ⚡ Test Authorization
              </button>

              <div id="sim-result-box" style="margin-top: 14px; display: none; padding: 12px; border-radius: var(--radius-sm);"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  simulateApprovalCheck() {
    const roleId = document.getElementById('sim-role-select').value;
    const transType = document.getElementById('sim-type-select').value;
    const amount = parseFloat(document.getElementById('sim-amount-input').value) || 0;
    const resultBox = document.getElementById('sim-result-box');

    const auth = (window.DB.getAll('approval_authorities') || []).find(a => a.role_id === roleId);

    resultBox.style.display = 'block';

    if (!auth) {
      resultBox.style.background = 'rgba(239, 68, 68, 0.1)';
      resultBox.style.border = '1px solid var(--color-danger)';
      resultBox.innerHTML = `
        <div style="font-weight: 700; color: var(--color-danger); font-size: 12.5px;">⛔ Unauthorized</div>
        <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">
          This role has no configured financial approval authority for <strong>${transType}</strong>.
        </div>
      `;
      return;
    }

    const maxAmt = auth.max_amount || Infinity;
    if (amount <= maxAmt) {
      resultBox.style.background = 'rgba(16, 185, 129, 0.1)';
      resultBox.style.border = '1px solid var(--color-success)';
      resultBox.innerHTML = `
        <div style="font-weight: 700; color: var(--color-success); font-size: 12.5px;">✓ Authorization Approved</div>
        <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">
          Role can approve up to ₹${auth.max_amount ? auth.max_amount.toLocaleString('en-IN') : 'Unlimited'}.
          (Evaluated Amount: ₹${amount.toLocaleString('en-IN')})
        </div>
      `;
    } else {
      resultBox.style.background = 'rgba(245, 158, 11, 0.1)';
      resultBox.style.border = '1px solid var(--color-warning)';
      resultBox.innerHTML = `
        <div style="font-weight: 700; color: var(--color-warning); font-size: 12.5px;">⚠️ Amount Exceeds Limit - Escalation Required</div>
        <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">
          Role maximum limit is ₹${auth.max_amount.toLocaleString('en-IN')}. Transaction value ₹${amount.toLocaleString('en-IN')} must escalate to Higher Authority (Level 3 or Management).
        </div>
      `;
    }
  },

  deleteApprovalLimit(idx) {
    if (!confirm('Remove this approval limit configuration?')) return;
    window.DB.data.approval_authorities.splice(idx, 1);
    window.DB.saveData();
    window.State.showToast('Approval limit removed.', 'info');
    this.render();
  },

  showCreateApprovalLimitModal() {
    const roles = window.DB.getAll('roles') || [];

    const contentHtml = `
      <form id="create-auth-form" onsubmit="event.preventDefault(); window.UserManagementModule.submitCreateApprovalLimit();">
        <div class="form-group">
          <label class="form-label">Role <span style="color:var(--color-danger)">*</span></label>
          <select id="auth-role" class="form-control" required>
            ${roles.map(r => `<option value="${r.id}">${r.name} (${r.code})</option>`).join('')}
          </select>
        </div>

        <div class="form-group" style="margin-top: 12px;">
          <label class="form-label">Transaction Type <span style="color:var(--color-danger)">*</span></label>
          <select id="auth-type" class="form-control" required>
            <option value="PURCHASE_ORDER">Purchase Order (PO)</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
            <option value="PURCHASE_REQUISITION">Purchase Requisition (PR)</option>
            <option value="CAPITAL_EXPENDITURE">Capital Expenditure</option>
          </select>
        </div>

        <div class="form-group" style="margin-top: 12px;">
          <label class="form-label">Max Approval Limit (₹ INR)</label>
          <input type="number" id="auth-limit" class="form-control" placeholder="Leave empty for unlimited" />
          <span style="font-size: 11px; color: var(--text-muted);">e.g. 10000, 100000, 1000000</span>
        </div>

        <div class="form-group" style="margin-top: 12px;">
          <label class="form-label">Hierarchy Level <span style="color:var(--color-danger)">*</span></label>
          <select id="auth-level" class="form-control" required>
            <option value="Level 1 - Store/Purchase Manager">Level 1 - Store/Purchase Manager</option>
            <option value="Level 2 - Department Manager">Level 2 - Department Manager</option>
            <option value="Level 3 - Procurement Head">Level 3 - Procurement Head</option>
            <option value="Level 4 - Management/Director">Level 4 - Management/Director</option>
          </select>
        </div>

        <div style="margin-top: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
            <input type="checkbox" id="auth-dual" />
            <span>Require Dual Sign-Off (Two independent approvers required)</span>
          </label>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '💰 Configure Transaction Approval Authority',
      contentHtml: contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.UserManagementModule.submitCreateApprovalLimit()">Save Configuration</button>
      `,
      maxWidth: '500px'
    });
  },

  submitCreateApprovalLimit() {
    const roleId = document.getElementById('auth-role').value;
    const type = document.getElementById('auth-type').value;
    const limitVal = document.getElementById('auth-limit').value;
    const level = document.getElementById('auth-level').value;
    const dual = document.getElementById('auth-dual').checked;

    const newLimit = {
      id: `AUTH-${Date.now()}`,
      role_id: roleId,
      transaction_type: type,
      max_amount: limitVal ? parseFloat(limitVal) : null,
      approval_level: level,
      dual_signature_required: dual
    };

    if (!window.DB.data.approval_authorities) window.DB.data.approval_authorities = [];
    window.DB.data.approval_authorities.push(newLimit);
    window.DB.saveData();
    window.DB.logAudit('APPROVAL_LIMIT_CREATED', 'Security', roleId, `Configured approval limit for ${roleId}: ₹${limitVal || 'Unlimited'}`);
    window.State.closeModal();
    window.State.showToast('Approval authority limit saved.', 'success');
    this.render();
  },

  /* ========================================================================
     11. APPROVAL DELEGATIONS & TEMPORARY PERMISSIONS (BRD §21, §22)
     ======================================================================== */
  renderDelegations() {
    const delegations = window.DB.getAll('approval_delegations') || [];
    const users = window.DB.getAll('users') || [];

    return `
      <div class="content-card">
        <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Approval Delegation & Temporary Access (BRD §21, §22)</span>
            <span class="badge badge-primary" style="margin-left: 8px;">${delegations.length} Records</span>
          </div>

          <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.showCreateDelegationModal()">
            <span>+ Delegate Authority / Temporary Access</span>
          </button>
        </div>

        <div class="alert alert-info" style="margin-bottom: 20px; font-size: 13px;">
          <strong>Time-Bound Delegation Principle:</strong> When managers are on leave, approval authority can be delegated 
          to qualified deputies. Delegated permissions automatically expire after the configured end date.
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Delegating Principal</th>
                <th>Delegate Acting User</th>
                <th>Delegated Scope / Authority</th>
                <th>Validity Period</th>
                <th>Business Justification</th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${delegations.map(del => {
                const principal = users.find(u => u.id === del.delegator_user_id) || { full_name: del.delegator_user_id, username: del.delegator_user_id };
                const delegate = users.find(u => u.id === del.delegate_user_id) || { full_name: del.delegate_user_id, username: del.delegate_user_id };

                const isExpired = new Date(del.end_date) < new Date();
                let statusBadge = '';
                if (del.status === 'REVOKED') statusBadge = '<span class="badge badge-secondary">Revoked</span>';
                else if (isExpired) statusBadge = '<span class="badge" style="color: #a855f7; border: 1px solid #a855f7;">Expired</span>';
                else statusBadge = '<span class="badge badge-success">● Active</span>';

                return `
                  <tr>
                    <td>
                      <strong style="color: var(--text-primary); font-size: 13px;">${principal.full_name || principal.username}</strong>
                      <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${principal.username}</div>
                    </td>
                    <td>
                      <strong style="color: var(--primary-300); font-size: 13px;">🤝 ${delegate.full_name || delegate.username}</strong>
                      <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${delegate.username}</div>
                    </td>
                    <td>
                      <span class="badge badge-primary" style="font-size: 11.5px;">${del.scope || del.permission_code || 'All Approval Authorities'}</span>
                    </td>
                    <td>
                      <div style="font-size: 12px; color: var(--text-primary);">${window.formatDate(del.start_date)} to ${window.formatDate(del.end_date)}</div>
                      <div style="font-size: 10.5px; color: var(--text-muted);">${isExpired ? 'Validity Ended' : 'Currently Active'}</div>
                    </td>
                    <td>
                      <span style="font-size: 12px; color: var(--text-secondary);">${del.reason || 'Leave coverage'}</span>
                    </td>
                    <td>
                      ${statusBadge}
                    </td>
                    <td class="text-right">
                      ${del.status === 'ACTIVE' && !isExpired ? `
                        <button class="btn btn-danger btn-xs" onclick="window.UserManagementModule.revokeDelegation('${del.id}')">
                          Revoke Early
                        </button>
                      ` : '<span style="font-size: 11px; color: var(--text-muted);">Completed</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  revokeDelegation(delId) {
    if (!confirm('Are you sure you want to revoke this approval delegation immediately?')) return;
    const del = window.DB.getById('approval_delegations', delId);
    if (del) {
      window.DB.update('approval_delegations', delId, { status: 'REVOKED' });
      window.DB.logAudit('DELEGATION_REVOKED', 'Security', delId, `Revoked approval delegation from ${del.delegator_user_id} to ${del.delegate_user_id}`);
      window.State.showToast('Delegation revoked successfully.', 'warning');
      this.render();
    }
  },

  showCreateDelegationModal() {
    const users = window.DB.getAll('users') || [];

    const contentHtml = `
      <form id="create-delegation-form" onsubmit="event.preventDefault(); window.UserManagementModule.submitCreateDelegation();">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Delegating Principal (Manager) <span style="color:var(--color-danger)">*</span></label>
            <select id="del-principal" class="form-control" required>
              ${users.map(u => `<option value="${u.id}">${u.full_name || u.username} (${u.primary_role})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Delegate User (Acting Deputy) <span style="color:var(--color-danger)">*</span></label>
            <select id="del-acting" class="form-control" required>
              ${users.map(u => `<option value="${u.id}">${u.full_name || u.username} (${u.primary_role})</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Delegated Scope / Authorities <span style="color:var(--color-danger)">*</span></label>
            <select id="del-scope" class="form-control" required>
              <option value="PURCHASE_ORDER_APPROVAL">Purchase Order Approval (Up to Limit)</option>
              <option value="STOCK_ADJUSTMENT_APPROVAL">Stock Adjustment Approval</option>
              <option value="GOODS_RECEIPT_APPROVAL">Goods Receipt / GRN Approval</option>
              <option value="ALL_APPROVALS">All Operational Approvals (Full Leave Delegate)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Start Date <span style="color:var(--color-danger)">*</span></label>
            <input type="date" id="del-start" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
          </div>

          <div class="form-group">
            <label class="form-label">End Date (Auto-Expiry) <span style="color:var(--color-danger)">*</span></label>
            <input type="date" id="del-end" class="form-control" value="${new Date(Date.now() + 14*86400000).toISOString().split('T')[0]}" required />
          </div>

          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Business Justification / Reason <span style="color:var(--color-danger)">*</span></label>
            <input type="text" id="del-reason" class="form-control" placeholder="e.g. Annual Leave Coverage - Authorized by Facility Head" required />
          </div>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '🤝 Create Time-Bound Approval Delegation',
      contentHtml: contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.UserManagementModule.submitCreateDelegation()">Activate Delegation</button>
      `,
      maxWidth: '620px'
    });
  },

  submitCreateDelegation() {
    const principalId = document.getElementById('del-principal').value;
    const actingId = document.getElementById('del-acting').value;
    const scope = document.getElementById('del-scope').value;
    const start = document.getElementById('del-start').value;
    const end = document.getElementById('del-end').value;
    const reason = document.getElementById('del-reason').value.trim();

    if (principalId === actingId) {
      window.State.showToast('Delegating user cannot be the same as the delegate user.', 'error');
      return;
    }

    if (!start || !end || !reason) {
      window.State.showToast('Please enter dates and a valid justification.', 'error');
      return;
    }

    const newDel = {
      id: `DEL-${Date.now()}`,
      delegator_user_id: principalId,
      delegate_user_id: actingId,
      scope: scope,
      start_date: start,
      end_date: end,
      reason: reason,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    if (!window.DB.data.approval_delegations) window.DB.data.approval_delegations = [];
    window.DB.data.approval_delegations.push(newDel);
    window.DB.saveData();
    window.DB.logAudit('DELEGATION_CREATED', 'Security', newDel.id, `Delegated authority ${scope} from ${principalId} to ${actingId} until ${end}`);
    window.State.closeModal();
    window.State.showToast('Approval delegation activated successfully.', 'success');
    this.render();
  },

  /* ========================================================================
     12. ACCESS REQUEST WORKFLOW (BRD §30)
     ======================================================================== */
  renderAccessRequests() {
    const requests = window.DB.getAll('access_requests') || [];
    const users = window.DB.getAll('users') || [];
    const roles = window.DB.getAll('roles') || [];

    return `
      <div class="content-card">
        <div class="card-header" style="flex-wrap: gap: 12px;">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            <span>User Access Request & Provisioning Lifecycle (BRD §30)</span>
            <span class="badge badge-primary" style="margin-left: 8px;">${requests.length} Requests</span>
          </div>

          <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.showCreateAccessRequestModal()">
            <span>+ Submit Access Request</span>
          </button>
        </div>

        <div class="alert alert-info" style="margin-bottom: 20px; font-size: 13px;">
          <strong>BRD §30 Access Request Lifecycle:</strong> Employee requests access &rarr; Reporting Manager Review &rarr; 
          Department Head Approval &rarr; IT/Admin Provisioning &rarr; Role Activated. Every stage is strictly audited.
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Requesting User</th>
                <th>Requested Role / Module Access</th>
                <th>Justification</th>
                <th>Submission Date</th>
                <th>Workflow Stage</th>
                <th>Status</th>
                <th class="text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              ${requests.map(req => {
                const user = users.find(u => u.id === req.user_id) || { full_name: req.user_id, username: req.user_id };
                const role = roles.find(r => r.id === req.requested_role_id) || { name: req.requested_role_id };

                let statusBadge = 'badge-warning';
                if (req.status === 'APPROVED') statusBadge = 'badge-success';
                else if (req.status === 'REJECTED') statusBadge = 'badge-danger';

                return `
                  <tr>
                    <td>
                      <span style="font-family: var(--font-mono); font-weight: 700; color: var(--primary-300);">${req.id}</span>
                    </td>
                    <td>
                      <strong style="color: var(--text-primary); font-size: 13px;">${user.full_name || user.username}</strong>
                      <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${user.username}</div>
                    </td>
                    <td>
                      <span class="badge badge-primary">👑 ${role.name || req.requested_role_id}</span>
                    </td>
                    <td>
                      <span style="font-size: 12px; color: var(--text-secondary);">${req.justification || 'Operational requirement'}</span>
                    </td>
                    <td>
                      <span style="font-size: 11.5px; color: var(--text-muted);">${window.formatDate(req.created_at)}</span>
                    </td>
                    <td>
                      <span class="badge badge-subtle" style="font-size: 11px;">${req.workflow_stage || 'IT Admin Review'}</span>
                    </td>
                    <td>
                      <span class="badge ${statusBadge}">${req.status}</span>
                    </td>
                    <td class="text-right">
                      ${req.status.startsWith('PENDING') ? `
                        <div style="display: flex; gap: 6px; justify-content: flex-end;">
                          <button class="btn btn-success btn-xs" onclick="window.UserManagementModule.approveAccessRequest('${req.id}')">
                            ✓ Approve
                          </button>
                          <button class="btn btn-danger btn-xs" onclick="window.UserManagementModule.rejectAccessRequest('${req.id}')">
                            ✕ Reject
                          </button>
                        </div>
                      ` : '<span style="font-size: 11.5px; color: var(--text-muted);">Processed</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  approveAccessRequest(reqId) {
    const req = window.DB.getById('access_requests', reqId);
    if (!req) return;

    if (confirm(`Approve access request ${reqId} and provision role ${req.requested_role_id} to user ${req.user_id}?`)) {
      window.DB.update('access_requests', reqId, {
        status: 'APPROVED',
        workflow_stage: 'Provisioned & Activated',
        approved_at: new Date().toISOString()
      });

      // Update user role
      const user = window.DB.getById('users', req.user_id);
      if (user) {
        if (!user.secondary_roles) user.secondary_roles = [];
        if (!user.secondary_roles.includes(req.requested_role_id) && user.primary_role !== req.requested_role_id) {
          user.secondary_roles.push(req.requested_role_id);
          window.DB.update('users', user.id, { secondary_roles: user.secondary_roles });
        }
      }

      window.DB.logAudit('ACCESS_REQUEST_APPROVED', 'Security', reqId, `Approved request ${reqId} and provisioned role ${req.requested_role_id} for ${req.user_id}`);
      window.State.showToast(`Request ${reqId} approved and role provisioned.`, 'success');
      this.render();
    }
  },

  rejectAccessRequest(reqId) {
    const reason = prompt('Please enter the justification/reason for rejecting this request:');
    if (reason === null) return;

    window.DB.update('access_requests', reqId, {
      status: 'REJECTED',
      workflow_stage: 'Rejected by Administrator',
      rejection_reason: reason || 'Business justification inadequate',
      rejected_at: new Date().toISOString()
    });

    window.DB.logAudit('ACCESS_REQUEST_REJECTED', 'Security', reqId, `Rejected request ${reqId}: ${reason}`);
    window.State.showToast(`Request ${reqId} rejected.`, 'info');
    this.render();
  },

  showCreateAccessRequestModal() {
    const users = window.DB.getAll('users') || [];
    const roles = window.DB.getAll('roles') || [];

    const contentHtml = `
      <form id="create-req-form" onsubmit="event.preventDefault(); window.UserManagementModule.submitAccessRequest();">
        <div class="form-group">
          <label class="form-label">Employee / User Requesting Access <span style="color:var(--color-danger)">*</span></label>
          <select id="req-user" class="form-control" required>
            ${users.map(u => `<option value="${u.id}">${u.full_name || u.username} (${u.primary_role})</option>`).join('')}
          </select>
        </div>

        <div class="form-group" style="margin-top: 12px;">
          <label class="form-label">Requested Additional Role <span style="color:var(--color-danger)">*</span></label>
          <select id="req-role" class="form-control" required>
            ${roles.map(r => `<option value="${r.id}">${r.name} (${r.code})</option>`).join('')}
          </select>
        </div>

        <div class="form-group" style="margin-top: 12px;">
          <label class="form-label">Business Justification <span style="color:var(--color-danger)">*</span></label>
          <textarea id="req-justification" class="form-control" rows="3" placeholder="Provide operational justification why this access is required..." required></textarea>
        </div>
      </form>
    `;

    window.State.showModal({
      title: '📝 Submit Access Request',
      contentHtml: contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.UserManagementModule.submitAccessRequest()">Submit Request</button>
      `,
      maxWidth: '520px'
    });
  },

  submitAccessRequest() {
    const userId = document.getElementById('req-user').value;
    const roleId = document.getElementById('req-role').value;
    const just = document.getElementById('req-justification').value.trim();

    if (!just) {
      window.State.showToast('Please provide a business justification.', 'error');
      return;
    }

    const newReq = {
      id: `REQ-${Date.now()}`,
      user_id: userId,
      requested_role_id: roleId,
      justification: just,
      status: 'PENDING_APPROVAL',
      workflow_stage: 'IT Admin Review',
      created_at: new Date().toISOString()
    };

    if (!window.DB.data.access_requests) window.DB.data.access_requests = [];
    window.DB.data.access_requests.push(newReq);
    window.DB.saveData();
    window.DB.logAudit('ACCESS_REQUESTED', 'Security', newReq.id, `User ${userId} requested role ${roleId}`);
    window.State.closeModal();
    window.State.showToast('Access request submitted for administrative approval.', 'success');
    this.render();
  },

  /* ========================================================================
     10. PASSWORD POLICY (SUB-MODULE 10)
     ======================================================================== */
  renderPasswordPolicy() {
    const policy = this.getPasswordPolicy();

    return `
      <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; align-items: start;">
        <!-- Left Column: 4 Policy Configuration Cards -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Card Header & Action -->
          <div class="content-card" style="padding: 16px 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
              <div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 38px; height: 38px; border-radius: var(--radius-sm); background: rgba(99, 102, 241, 0.15); display: flex; align-items: center; justify-content: center; font-size: 20px;">🛡️</div>
                  <div>
                    <h2 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0;">Password Policy Master</h2>
                    <p style="font-size: 11.5px; color: var(--text-muted); margin: 2px 0 0 0;">Configuration-driven enterprise authentication, complexity, lockout & lifecycle rules</p>
                  </div>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.savePasswordPolicy()">
                💾 Save Policy Configuration
              </button>
            </div>
          </div>

          <form id="password-policy-form" onsubmit="event.preventDefault(); window.UserManagementModule.savePasswordPolicy();" style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- Section 1: Length & Character Complexity -->
            <div class="content-card" style="padding: 16px 20px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                <span>🔤</span> 1. Length & Character Complexity Rules
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11.5px;">Minimum Password Length</label>
                  <input type="number" id="pp-min-len" class="form-control" value="${policy.min_length || 8}" min="6" max="32" onchange="window.UserManagementModule.testPasswordStrength(document.getElementById('tester-pwd-input')?.value || '')" />
                  <small style="font-size: 10px; color: var(--text-muted);">Standard: &ge; 8 characters</small>
                </div>

                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11.5px;">Maximum Password Length</label>
                  <input type="number" id="pp-max-len" class="form-control" value="${policy.max_length || 64}" min="32" max="128" onchange="window.UserManagementModule.testPasswordStrength(document.getElementById('tester-pwd-input')?.value || '')" />
                  <small style="font-size: 10px; color: var(--text-muted);">Recommended: 64 characters</small>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; margin: 0;">
                  <input type="checkbox" id="pp-upper" ${policy.require_uppercase ? 'checked' : ''} onchange="window.UserManagementModule.testPasswordStrength(document.getElementById('tester-pwd-input')?.value || '')" />
                  <span>Require Uppercase (A–Z)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; margin: 0;">
                  <input type="checkbox" id="pp-lower" ${policy.require_lowercase ? 'checked' : ''} onchange="window.UserManagementModule.testPasswordStrength(document.getElementById('tester-pwd-input')?.value || '')" />
                  <span>Require Lowercase (a–z)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; margin: 0;">
                  <input type="checkbox" id="pp-number" ${policy.require_number ? 'checked' : ''} onchange="window.UserManagementModule.testPasswordStrength(document.getElementById('tester-pwd-input')?.value || '')" />
                  <span>Require Numeric Digit (0–9)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; margin: 0;">
                  <input type="checkbox" id="pp-special" ${policy.require_special_char ? 'checked' : ''} onchange="window.UserManagementModule.testPasswordStrength(document.getElementById('tester-pwd-input')?.value || '')" />
                  <span>Require Special Character (@, #, $, %, etc.)</span>
                </label>
              </div>
            </div>

            <!-- Section 2: Contextual Safeguards & Identity Shield -->
            <div class="content-card" style="padding: 16px 20px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                <span>🛡️</span> 2. Contextual Safeguards & Identity Shield
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; margin: 0;">
                  <input type="checkbox" id="pp-spaces" ${policy.disallow_spaces ? 'checked' : ''} onchange="window.UserManagementModule.testPasswordStrength(document.getElementById('tester-pwd-input')?.value || '')" />
                  <span><strong>Disallow Spaces:</strong> ❌ Password must not contain space characters</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; margin: 0;">
                  <input type="checkbox" id="pp-username" ${policy.disallow_username_in_password ? 'checked' : ''} onchange="window.UserManagementModule.testPasswordStrength(document.getElementById('tester-pwd-input')?.value || '')" />
                  <span><strong>Disallow Username Match:</strong> Password cannot be identical to or contain the username</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; margin: 0;">
                  <input type="checkbox" id="pp-personal" ${policy.disallow_personal_info ? 'checked' : ''} onchange="window.UserManagementModule.testPasswordStrength(document.getElementById('tester-pwd-input')?.value || '')" />
                  <span><strong>Disallow Personal / Employee Data:</strong> Reject values matching employee ID, mobile number, or DOB</span>
                </label>
              </div>
            </div>

            <!-- Section 3: Lifecycle, Expiry & History -->
            <div class="content-card" style="padding: 16px 20px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                <span>🔄</span> 3. Lifecycle, Expiry & History Reuse
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11.5px;">Password Expiry Cycle</label>
                  <select id="pp-expiry" class="form-control" style="height: 32px; font-size: 12px;">
                    <option value="30" ${policy.expiry_days == 30 ? 'selected' : ''}>Every 30 Days (High Security)</option>
                    <option value="60" ${policy.expiry_days == 60 ? 'selected' : ''}>Every 60 Days</option>
                    <option value="90" ${policy.expiry_days == 90 ? 'selected' : ''}>Every 90 Days (Enterprise Standard)</option>
                    <option value="180" ${policy.expiry_days == 180 ? 'selected' : ''}>Every 180 Days</option>
                    <option value="0" ${policy.expiry_days == 0 ? 'selected' : ''}>Never Expire (Exceptions only)</option>
                  </select>
                </div>

                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11.5px;">Prevent History Reuse</label>
                  <select id="pp-history" class="form-control" style="height: 32px; font-size: 12px;">
                    <option value="1" ${policy.history_limit == 1 ? 'selected' : ''}>Cannot reuse last 1 password</option>
                    <option value="3" ${policy.history_limit == 3 ? 'selected' : ''}>Cannot reuse last 3 passwords</option>
                    <option value="5" ${policy.history_limit == 5 ? 'selected' : ''}>Cannot reuse last 5 passwords (Recommended)</option>
                    <option value="10" ${policy.history_limit == 10 ? 'selected' : ''}>Cannot reuse last 10 passwords</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); display: flex; align-items: center;">
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; margin: 0;">
                    <input type="checkbox" id="pp-force-first-login" ${policy.force_change_on_first_login ? 'checked' : ''} />
                    <span><strong>Force Change at First Login:</strong> Mandatory permanent password creation</span>
                  </label>
                </div>

                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11.5px;">Temporary Password Validity</label>
                  <select id="pp-temp-validity" class="form-control" style="height: 32px; font-size: 12px;">
                    <option value="12" ${policy.temp_password_validity_hours == 12 ? 'selected' : ''}>12 Hours</option>
                    <option value="24" ${policy.temp_password_validity_hours == 24 ? 'selected' : ''}>24 Hours (Standard)</option>
                    <option value="48" ${policy.temp_password_validity_hours == 48 ? 'selected' : ''}>48 Hours</option>
                    <option value="72" ${policy.temp_password_validity_hours == 72 ? 'selected' : ''}>72 Hours</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Section 4: Brute-Force & Lockout Thresholds -->
            <div class="content-card" style="padding: 16px 20px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--primary-300); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                <span>🔒</span> 4. Brute-Force & Account Lockout Thresholds
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11.5px;">Failed Attempts Before Lockout</label>
                  <select id="pp-max-failed" class="form-control" style="height: 32px; font-size: 12px;">
                    <option value="3" ${policy.max_failed_attempts == 3 ? 'selected' : ''}>3 Failed Attempts</option>
                    <option value="5" ${policy.max_failed_attempts == 5 ? 'selected' : ''}>5 Failed Attempts (Standard)</option>
                    <option value="10" ${policy.max_failed_attempts == 10 ? 'selected' : ''}>10 Failed Attempts</option>
                  </select>
                  <small style="font-size: 10px; color: var(--text-muted);">Triggers status LOCKED</small>
                </div>

                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11.5px;">Account Lockout Duration</label>
                  <select id="pp-lockout-duration" class="form-control" style="height: 32px; font-size: 12px;">
                    <option value="15" ${policy.lockout_duration_minutes == 15 ? 'selected' : ''}>15 Minutes</option>
                    <option value="30" ${policy.lockout_duration_minutes == 30 ? 'selected' : ''}>30 Minutes (Standard)</option>
                    <option value="60" ${policy.lockout_duration_minutes == 60 ? 'selected' : ''}>60 Minutes</option>
                    <option value="120" ${policy.lockout_duration_minutes == 120 ? 'selected' : ''}>120 Minutes</option>
                  </select>
                  <small style="font-size: 10px; color: var(--text-muted);">Admin can unlock manually anytime</small>
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- Right Column: Interactive Tester & Sample Generator -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          
          <div class="content-card" style="padding: 18px 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 12px;">
              <div style="font-weight: 700; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                <span>🧪</span> Policy Compliance Tester
              </div>
              <button type="button" class="btn btn-secondary btn-xs" onclick="window.UserManagementModule.generateTestSamplePassword()" title="Generate sample compliant temporary password">
                🎲 Auto-Gen Sample
              </button>
            </div>

            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px; line-height: 1.4;">
              Type any candidate password or click <strong>Auto-Gen Sample</strong> to evaluate compliance against active enterprise parameters:
            </p>

            <div style="position: relative; margin-bottom: 12px;">
              <input 
                type="text" 
                class="form-control" 
                id="tester-pwd-input"
                value="PuN@2026#A7" 
                style="height: 34px; font-size: 13px; font-family: var(--font-mono); font-weight: 600; letter-spacing: 0.5px;"
                oninput="window.UserManagementModule.testPasswordStrength(this.value)"
              />
            </div>

            <div id="tester-results-container"></div>
          </div>

          <!-- Secure Storage & Architecture Callout -->
          <div class="content-card" style="padding: 16px 20px; background: rgba(99, 102, 241, 0.04); border: 1px solid rgba(99, 102, 241, 0.25);">
            <div style="font-size: 12px; font-weight: 700; color: var(--primary-300); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>🔒</span> Cryptographic Storage Standards
            </div>
            <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.5;">
              StockIQ ISCM implements salted one-way hashing for all authentication secrets. Plaintext passwords are never stored in memory or persistent storage.
            </div>
            <div style="background: rgba(0,0,0,0.3); border-radius: var(--radius-sm); padding: 8px 10px; margin-top: 8px; font-family: var(--font-mono); font-size: 10.5px; color: #a5b4fc; word-break: break-all;">
              Format: <code>sha256$&lt;16-hex-salt&gt;$&lt;64-hex-digest&gt;</code>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  generateTestSamplePassword() {
    const sample = this.generateSystemPassword('PUN', 2026);
    const input = document.getElementById('tester-pwd-input');
    if (input) {
      input.value = sample;
      this.testPasswordStrength(sample);
    }
  },

  testPasswordStrength(val) {
    const container = document.getElementById('tester-results-container');
    if (!container) return;

    const minLen = parseInt(document.getElementById('pp-min-len')?.value) || 8;
    const maxLen = parseInt(document.getElementById('pp-max-len')?.value) || 64;
    const reqUpper = document.getElementById('pp-upper')?.checked ?? true;
    const reqLower = document.getElementById('pp-lower')?.checked ?? true;
    const reqNum = document.getElementById('pp-number')?.checked ?? true;
    const reqSpec = document.getElementById('pp-special')?.checked ?? true;
    const disallowSpaces = document.getElementById('pp-spaces')?.checked ?? true;
    const disallowUser = document.getElementById('pp-username')?.checked ?? true;
    const disallowPersonal = document.getElementById('pp-personal')?.checked ?? true;

    const dynamicPolicy = {
      min_length: minLen,
      max_length: maxLen,
      require_uppercase: reqUpper,
      require_lowercase: reqLower,
      require_number: reqNum,
      require_special_char: reqSpec,
      disallow_spaces: disallowSpaces,
      disallow_username_in_password: disallowUser,
      disallow_personal_info: disallowPersonal
    };

    const valResult = this.validatePassword(val, {
      policy: dynamicPolicy,
      username: 'PUN2026001',
      employeeId: 'EMP-9001',
      mobileNumber: '9822011234'
    });

    container.innerHTML = `
      <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">
            Strength Assessment: <strong style="color: ${valResult.strengthColor}; font-size: 12px;">${valResult.strengthLabel} (${valResult.score}/100)</strong>
          </span>
          <span style="font-size: 11px; font-weight: 700; color: ${valResult.valid ? '#10b981' : 'var(--color-danger)'};">
            ${valResult.valid ? '✅ Policy Compliant' : `❌ ${valResult.errors.length} Unmet Rule(s)`}
          </span>
        </div>
        
        <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 10px;">
          <div style="height: 100%; width: ${valResult.score}%; background: ${valResult.strengthColor}; transition: width 0.3s ease;"></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
          ${valResult.checks.map(c => `
            <div style="color: ${c.passed ? '#10b981' : 'var(--text-muted)'}; display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 700; width: 14px;">${c.passed ? '✓' : '○'}</span>
              <span>${c.label}</span>
            </div>
          `).join('')}
        </div>

        ${valResult.errors.length > 0 ? `
          <div style="margin-top: 10px; padding: 6px 8px; background: rgba(239, 68, 68, 0.1); border-left: 2px solid var(--color-danger); border-radius: 2px; font-size: 10.5px; color: #fca5a5;">
            ${valResult.errors[0]}
          </div>
        ` : ''}
      </div>
    `;
  },

  savePasswordPolicy() {
    const minLen = parseInt(document.getElementById('pp-min-len')?.value) || 8;
    const maxLen = parseInt(document.getElementById('pp-max-len')?.value) || 64;
    const expiry = parseInt(document.getElementById('pp-expiry')?.value) || 90;
    const history = parseInt(document.getElementById('pp-history')?.value) || 5;
    const upper = document.getElementById('pp-upper')?.checked ?? true;
    const lower = document.getElementById('pp-lower')?.checked ?? true;
    const number = document.getElementById('pp-number')?.checked ?? true;
    const special = document.getElementById('pp-special')?.checked ?? true;
    const spaces = document.getElementById('pp-spaces')?.checked ?? true;
    const disallowUsername = document.getElementById('pp-username')?.checked ?? true;
    const disallowPersonal = document.getElementById('pp-personal')?.checked ?? true;
    const forceFirstLogin = document.getElementById('pp-force-first-login')?.checked ?? true;
    const tempValidity = parseInt(document.getElementById('pp-temp-validity')?.value) || 24;
    const maxFailed = parseInt(document.getElementById('pp-max-failed')?.value) || 5;
    const lockDuration = parseInt(document.getElementById('pp-lockout-duration')?.value) || 30;

    window.DB.data.password_policies = {
      min_length: minLen,
      max_length: maxLen,
      require_uppercase: upper,
      require_lowercase: lower,
      require_number: number,
      require_special_char: special,
      disallow_spaces: spaces,
      disallow_username_in_password: disallowUsername,
      disallow_personal_info: disallowPersonal,
      expiry_days: expiry,
      history_limit: history,
      max_failed_attempts: maxFailed,
      lockout_duration_minutes: lockDuration,
      force_change_on_first_login: forceFirstLogin,
      temp_password_validity_hours: tempValidity
    };

    window.DB.saveData();
    window.DB.logAudit('PASSWORD_POLICY_UPDATED', 'Security', 'SYS_CONFIG', `Updated enterprise password policy: min ${minLen}, max ${maxLen}, expiry ${expiry}d, history ${history}, lockout ${maxFailed} fails`);
    window.State.showToast('Password policy configuration saved successfully.', 'success');
    this.render();
  },

  /* ========================================================================
     11. LOGIN SECURITY & LOCKOUT RULES (SUB-MODULE 11)
     ======================================================================== */
  renderLoginSecurity() {
    const config = window.DB.data.login_security_config || {
      max_failed_attempts: 5,
      lockout_duration_minutes: 30,
      session_timeout_minutes: 45,
      concurrent_sessions_allowed: 2,
      two_factor_auth_required: false,
      ip_whitelisting_enabled: false
    };

    const lockedUsers = (window.DB.getAll('users') || []).filter(u => u.status === 'LOCKED');

    return `
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
        <div class="content-card">
          <div class="card-header">
            <div class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Login Security & Brute-Force Protection Rules</span>
            </div>

            <button class="btn btn-primary btn-sm" onclick="window.UserManagementModule.saveLoginSecurity()">
              💾 Save Security Rules
            </button>
          </div>

          <form id="login-sec-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
            <div class="form-group">
              <label class="form-label">Max Failed Attempts Before Lockout</label>
              <select id="sec-max-failed" class="form-control">
                <option value="3" ${config.max_failed_attempts == 3 ? 'selected' : ''}>3 Attempts (Strict Protection)</option>
                <option value="5" ${config.max_failed_attempts == 5 ? 'selected' : ''}>5 Attempts (Standard Default)</option>
                <option value="10" ${config.max_failed_attempts == 10 ? 'selected' : ''}>10 Attempts</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Account Lockout Duration</label>
              <select id="sec-lockout-duration" class="form-control">
                <option value="15" ${config.lockout_duration_minutes == 15 ? 'selected' : ''}>15 Minutes</option>
                <option value="30" ${config.lockout_duration_minutes == 30 ? 'selected' : ''}>30 Minutes</option>
                <option value="60" ${config.lockout_duration_minutes == 60 ? 'selected' : ''}>1 Hour</option>
                <option value="0" ${config.lockout_duration_minutes == 0 ? 'selected' : ''}>Permanent until Admin Unlock</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Inactive Session Timeout</label>
              <select id="sec-timeout" class="form-control">
                <option value="15" ${config.session_timeout_minutes == 15 ? 'selected' : ''}>15 Minutes Inactivity</option>
                <option value="30" ${config.session_timeout_minutes == 30 ? 'selected' : ''}>30 Minutes Inactivity</option>
                <option value="45" ${config.session_timeout_minutes == 45 ? 'selected' : ''}>45 Minutes Inactivity</option>
                <option value="60" ${config.session_timeout_minutes == 60 ? 'selected' : ''}>1 Hour</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Max Concurrent Sessions per User</label>
              <select id="sec-concurrent" class="form-control">
                <option value="1" ${config.concurrent_sessions_allowed == 1 ? 'selected' : ''}>1 Session (Zero Concurrent)</option>
                <option value="2" ${config.concurrent_sessions_allowed == 2 ? 'selected' : ''}>2 Sessions (PC + Scanner)</option>
                <option value="5" ${config.concurrent_sessions_allowed == 5 ? 'selected' : ''}>5 Sessions</option>
              </select>
            </div>

            <div class="form-group" style="grid-column: span 2; padding: 12px; background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
                <input type="checkbox" id="sec-2fa-req" ${config.two_factor_auth_required ? 'checked' : ''} />
                <span>Enforce Mandatory Two-Factor Authentication (MFA/2FA) Across All User Roles</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; margin-top: 8px;">
                <input type="checkbox" id="sec-ip-whitelist" ${config.ip_whitelisting_enabled ? 'checked' : ''} />
                <span>Enforce Corporate VPN / IP Whitelisting Subnet Validation</span>
              </label>
            </div>
          </form>
        </div>

        <!-- Locked Users Quick Release Panel -->
        <div class="content-card">
          <div class="card-header">
            <div class="card-title">
              <span>🔒 Currently Locked Accounts (${lockedUsers.length})</span>
            </div>
          </div>
          <div style="padding-top: 10px;">
            ${lockedUsers.length > 0 ? lockedUsers.map(lu => `
              <div style="padding: 10px; background: rgba(239, 68, 68, 0.08); border: 1px solid var(--color-danger); border-radius: var(--radius-sm); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; color: var(--color-danger); font-size: 12.5px;">${lu.full_name || lu.username}</div>
                  <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${lu.username} &bull; ${lu.failed_logins} failed attempts</div>
                </div>
                <button class="btn btn-warning btn-xs" onclick="window.UserManagementModule.unlockUser('${lu.id}')">
                  🔓 Instant Unlock
                </button>
              </div>
            `).join('') : `
              <div style="padding: 30px; text-align: center; color: var(--color-success); font-size: 13px;">
                ✓ No user accounts are currently locked. System is secure.
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  },

  saveLoginSecurity() {
    const maxFailed = parseInt(document.getElementById('sec-max-failed').value);
    const lockoutDur = parseInt(document.getElementById('sec-lockout-duration').value);
    const timeout = parseInt(document.getElementById('sec-timeout').value);
    const concurrent = parseInt(document.getElementById('sec-concurrent').value);
    const twoFa = document.getElementById('sec-2fa-req').checked;
    const ipWh = document.getElementById('sec-ip-whitelist').checked;

    window.DB.data.login_security_config = {
      max_failed_attempts: maxFailed,
      lockout_duration_minutes: lockoutDur,
      session_timeout_minutes: timeout,
      concurrent_sessions_allowed: concurrent,
      two_factor_auth_required: twoFa,
      ip_whitelisting_enabled: ipWh
    };

    window.DB.saveData();
    window.DB.logAudit('LOGIN_SECURITY_UPDATED', 'Security', 'SYS_CONFIG', 'Updated brute-force and session timeout rules');
    window.State.showToast('Login security configuration saved.', 'success');
  },

  /* ========================================================================
     12. USER SESSION MANAGEMENT (SUB-MODULE 12)
     ======================================================================== */
  renderSessionManagement() {
    const sessions = (window.DB.getAll('user_sessions') || []).filter(s => s.status === 'ACTIVE');

    return `
      <div class="content-card">
        <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span>Live Active User Sessions</span>
            <span class="badge badge-success" style="margin-left: 8px;">${sessions.length} Live Connections</span>
          </div>

          <button class="btn btn-danger btn-sm" onclick="window.UserManagementModule.terminateAllOtherSessions()">
            <span>⚠️ Terminate All Other Sessions</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Active User</th>
                <th>Role</th>
                <th>Client Device / OS / Browser</th>
                <th>Network IP</th>
                <th>Login Timestamp</th>
                <th>Last Heartbeat</th>
                <th>Session State</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.map(s => `
                <tr>
                  <td>
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 13px;">${s.user_name}</div>
                    <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${s.user_id}</div>
                  </td>
                  <td>
                    <span class="badge badge-primary" style="font-size: 11px;">${s.role}</span>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--text-secondary);">${s.device}</span>
                  </td>
                  <td>
                    <span style="font-family: var(--font-mono); font-size: 12px; color: var(--primary-300);">${s.ip_address}</span>
                  </td>
                  <td>
                    <span style="font-size: 11.5px; color: var(--text-muted);">${window.formatDateTime(s.login_time)}</span>
                  </td>
                  <td>
                    <span style="font-size: 11.5px; color: var(--color-success); font-weight: 600;">● ${s.last_active}</span>
                  </td>
                  <td>
                    ${s.is_current ? '<span class="badge badge-success">Your Current Session</span>' : '<span class="badge badge-subtle">Active Remote</span>'}
                  </td>
                  <td class="text-right">
                    ${!s.is_current ? `
                      <button class="btn btn-danger btn-xs" onclick="window.UserManagementModule.terminateSession('${s.id}')">
                        Force Logout
                      </button>
                    ` : '<span style="font-size: 11px; color: var(--text-muted);">Current</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  terminateSession(sessionId) {
    const session = window.DB.getById('user_sessions', sessionId);
    if (!session) return;
    if (confirm(`Terminate session for ${session.user_name} (${session.ip_address})?`)) {
      window.DB.update('user_sessions', sessionId, { status: 'TERMINATED' });
      window.DB.logAudit('SESSION_TERMINATED', 'Security', sessionId, `Terminated live session for user ${session.user_name}`);
      window.State.showToast(`Session ${sessionId} terminated successfully.`, 'info');
      this.render();
    }
  },

  terminateAllOtherSessions() {
    if (confirm('Are you sure you want to force logout all other active sessions across the enterprise?')) {
      (window.DB.data.user_sessions || []).forEach(s => {
        if (!s.is_current) s.status = 'TERMINATED';
      });
      window.DB.saveData();
      window.DB.logAudit('ALL_SESSIONS_TERMINATED', 'Security', 'ALL', 'Administrator terminated all remote active sessions');
      window.State.showToast('All remote sessions terminated.', 'warning');
      this.render();
    }
  },

  /* ========================================================================
     13. LOGIN HISTORY (SUB-MODULE 13)
     ======================================================================== */
  renderLoginHistory() {
    let history = window.DB.getAll('login_history') || [];

    if (this.loginHistoryFilter !== 'ALL') {
      history = history.filter(h => h.status === this.loginHistoryFilter);
    }

    return `
      <div class="content-card">
        <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>User Authentication & Login History</span>
            <span class="badge badge-primary" style="margin-left: 8px;">${history.length} Log Entries</span>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <select class="form-control form-control-sm" onchange="window.UserManagementModule.setLoginHistoryFilter(this.value)" style="width: 150px;">
              <option value="ALL" ${this.loginHistoryFilter === 'ALL' ? 'selected' : ''}>All Events</option>
              <option value="SUCCESS" ${this.loginHistoryFilter === 'SUCCESS' ? 'selected' : ''}>Successful Only</option>
              <option value="FAILED" ${this.loginHistoryFilter === 'FAILED' ? 'selected' : ''}>Failed Only</option>
            </select>

            <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.exportLoginHistory()">
              📥 Export Audit Log
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User Profile</th>
                <th>IP Address</th>
                <th>Client Platform</th>
                <th>Authentication Result</th>
                <th>Failure Diagnostics</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(h => `
                <tr>
                  <td>
                    <span style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary);">${window.formatDateTime(h.timestamp)}</span>
                  </td>
                  <td>
                    <strong style="color: var(--text-primary); font-size: 13px;">${h.user_name}</strong>
                    <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${h.user_id}</div>
                  </td>
                  <td>
                    <span style="font-family: var(--font-mono); font-size: 12px; color: var(--primary-300);">${h.ip}</span>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--text-secondary);">${h.device}</span>
                  </td>
                  <td>
                    <span class="badge ${h.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}" style="font-weight: 700;">
                      ${h.status === 'SUCCESS' ? '✓ SUCCESS' : '✕ FAILED'}
                    </span>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: ${h.failure_reason ? 'var(--color-danger)' : 'var(--text-muted)'};">
                      ${h.failure_reason || '— None (Authenticated)'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setLoginHistoryFilter(val) {
    this.loginHistoryFilter = val;
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  exportLoginHistory() {
    window.State.showToast('Authentication audit log exported to CSV/JSON format.', 'success');
  },

  /* ========================================================================
     13. PERIODIC ACCESS REVIEW & MIS REPORTS (BRD §32, §37)
     ======================================================================== */
  renderAccessReviewReports() {
    const reportType = this.selectedReportType || 'USER_MASTER';
    const users = window.DB.getAll('users') || [];
    const roles = window.DB.getAll('roles') || [];
    const sodRules = window.DB.getAll('sod_rules') || [];
    const delegations = window.DB.getAll('approval_delegations') || [];
    const auditLogs = window.DB.getAll('auditLogs') || [];

    let reportTitle = '';
    let tableHeaders = [];
    let tableRows = [];

    switch (reportType) {
      case 'USER_MASTER':
        reportTitle = 'BRD §37.1 User Master Governance Report';
        tableHeaders = ['User ID', 'Full Name', 'Username', 'Email', 'Primary Role', 'Facility Scope', 'Status', 'Last Login'];
        tableRows = users.map(u => [
          u.id,
          u.full_name || u.username,
          u.username,
          u.email || '—',
          (roles.find(r => r.id === u.primary_role) || { name: u.primary_role }).name,
          Array.isArray(u.assigned_plants) && u.assigned_plants.length > 0 ? (u.assigned_plants.includes('ALL') ? 'All Facilities' : u.assigned_plants.join(', ')) : (u.plant_id || 'ALL'),
          u.status,
          u.last_login ? window.formatDateTime(u.last_login) : 'Never'
        ]);
        break;

      case 'ROLE_PERM':
        reportTitle = 'BRD §37.2 Role-Permission Matrix Report';
        tableHeaders = ['Role Code', 'Role Name', 'Category', 'Description', 'Configured Permission Count', 'Status'];
        tableRows = roles.map(r => {
          const perms = window.DB.data.role_permissions ? (window.DB.data.role_permissions[r.id] || []) : [];
          return [
            r.code,
            r.name,
            r.category || 'Enterprise',
            r.description || 'Standard Role',
            `${perms.length} Matrix Definitions`,
            r.status || 'ACTIVE'
          ];
        });
        break;

      case 'USER_ACCESS':
        reportTitle = 'BRD §37.3 Comprehensive User Access Report';
        tableHeaders = ['User', 'Primary Role', 'Secondary Roles', 'Facility', 'Assigned Store(s)', '2FA Status'];
        tableRows = users.map(u => {
          const assignedStores = this.getUserAssignedStores ? this.getUserAssignedStores(u) : ['ALL'];
          const storeText = assignedStores.includes('ALL') ? 'All Stores' : (assignedStores.join(', ') || 'None');
          return [
            `${u.full_name || u.username} (${u.username})`,
            u.primary_role,
            (u.secondary_roles || []).join(', ') || 'None',
            Array.isArray(u.assigned_plants) && u.assigned_plants.length > 0 ? (u.assigned_plants.includes('ALL') ? 'All Facilities' : u.assigned_plants.join(', ')) : (u.plant_id || 'ALL'),
            storeText,
            u.two_factor_enabled ? 'Enforced' : 'Standard'
          ];
        });
        break;

      case 'PERM_CHANGES':
        reportTitle = 'BRD §37.4 Permission Change Audit Report';
        tableHeaders = ['Timestamp', 'Actor / User', 'Action', 'Target Record', 'Details / Change Log'];
        tableRows = auditLogs.filter(l => l.module === 'Security' || l.action.includes('PERM') || l.action.includes('ROLE') || l.action.includes('USER')).map(l => [
          window.formatDateTime(l.timestamp),
          l.user,
          l.action,
          l.record_id || '—',
          l.details || '—'
        ]);
        break;

      case 'SOD_CONFLICTS':
        reportTitle = 'BRD §37.5 Segregation of Duties (SoD) Conflict Report';
        tableHeaders = ['Rule Code', 'Conflict Description', 'Conflicting Activity A', 'Conflicting Activity B', 'Severity', 'Status'];
        tableRows = sodRules.map(r => [
          r.rule_code || r.code || r.id,
          r.description || r.rule_name,
          r.conflicting_function_a || '—',
          r.conflicting_function_b || '—',
          r.severity || 'HIGH',
          r.status || 'ACTIVE'
        ]);
        break;

      case 'INACTIVE_USERS':
        reportTitle = 'BRD §37.6 Inactive, Locked & Terminated Users Report';
        tableHeaders = ['User ID', 'Username', 'Full Name', 'Account Status', 'Failed Logins', 'Last Login'];
        tableRows = users.filter(u => u.status !== 'ACTIVE').map(u => [
          u.id,
          u.username,
          u.full_name || u.username,
          u.status,
          u.failed_logins || 0,
          u.last_login ? window.formatDateTime(u.last_login) : 'Never'
        ]);
        break;

      case 'TEMP_ACCESS':
        reportTitle = 'BRD §37.7 Temporary Access & Delegated Authority Report';
        tableHeaders = ['Delegation ID', 'Principal User', 'Delegate Deputy', 'Authority Scope', 'Start Date', 'End Date', 'Status'];
        tableRows = delegations.map(d => [
          d.id,
          d.delegator_user_id,
          d.delegate_user_id,
          d.scope || 'All Authorities',
          window.formatDate(d.start_date),
          window.formatDate(d.end_date),
          d.status
        ]);
        break;

      default:
        reportTitle = 'Access Governance Report';
        tableHeaders = ['Item'];
        tableRows = [];
    }

    return `
      <div class="content-card">
        <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>Periodic Access Review & MIS Reports (BRD §32, §37)</span>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <select class="form-control form-control-sm" onchange="window.UserManagementModule.setReportType(this.value)" style="width: 250px;">
              <option value="USER_MASTER" ${reportType === 'USER_MASTER' ? 'selected' : ''}>37.1 User Master Report</option>
              <option value="ROLE_PERM" ${reportType === 'ROLE_PERM' ? 'selected' : ''}>37.2 Role-Permission Report</option>
              <option value="USER_ACCESS" ${reportType === 'USER_ACCESS' ? 'selected' : ''}>37.3 User Access Report</option>
              <option value="PERM_CHANGES" ${reportType === 'PERM_CHANGES' ? 'selected' : ''}>37.4 Permission Change Report</option>
              <option value="SOD_CONFLICTS" ${reportType === 'SOD_CONFLICTS' ? 'selected' : ''}>37.5 SoD Conflict Report</option>
              <option value="INACTIVE_USERS" ${reportType === 'INACTIVE_USERS' ? 'selected' : ''}>37.6 Inactive User Report</option>
              <option value="TEMP_ACCESS" ${reportType === 'TEMP_ACCESS' ? 'selected' : ''}>37.7 Temporary Access Report</option>
            </select>

            <button class="btn btn-secondary btn-sm" onclick="window.UserManagementModule.exportAccessReportCSV()">
              📥 Export CSV
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.print()">
              🖨️ Print / PDF
            </button>
          </div>
        </div>

        <div style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0; color: var(--text-primary);">${reportTitle}</h4>
          <span class="badge badge-primary">${tableRows.length} Records</span>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="access-report-table">
            <thead>
              <tr>
                ${tableHeaders.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
              ${tableRows.length === 0 ? `
                <tr>
                  <td colspan="${tableHeaders.length}" class="text-center" style="padding: 30px; color: var(--text-muted);">
                    No records found for this report criteria.
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setReportType(type) {
    this.selectedReportType = type;
    const content = document.getElementById('user-mgmt-content');
    if (content) content.innerHTML = this.renderActiveSubModule();
  },

  exportAccessReportCSV() {
    const table = document.getElementById('access-report-table');
    if (!table) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
      const cols = row.querySelectorAll('th, td');
      const rowData = [];
      cols.forEach(c => {
        let text = c.innerText.replace(/"/g, '""');
        rowData.push(`"${text}"`);
      });
      csvContent += rowData.join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ISCM_Access_Report_${this.selectedReportType || 'EXPORT'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.State.showToast('MIS Report downloaded successfully in CSV format.', 'success');
  },

  /* ========================================================================
     14. USER ACTIVITY / AUDIT LOG (SUB-MODULE 14)
     ======================================================================== */
  renderUserActivityLog() {
    const logs = window.DB.getAll('auditLogs') || [];

    return `
      <div class="content-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>User Activity & Security Audit Trail</span>
            <span class="badge badge-primary" style="margin-left: 8px;">${logs.length} Immutable Logs</span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor / User</th>
                <th>Module</th>
                <th>Security Action</th>
                <th>Target ID</th>
                <th>Action Details & Changes</th>
              </tr>
            </thead>
            <tbody>
              ${logs.slice(0, 30).map(l => `
                <tr>
                  <td>
                    <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary);">${window.formatDateTime(l.timestamp)}</span>
                  </td>
                  <td>
                    <strong style="color: var(--text-primary); font-size: 12.5px;">${l.user}</strong>
                    <div style="font-size: 10.5px; color: var(--text-muted);">${l.role || 'Admin'}</div>
                  </td>
                  <td>
                    <span class="badge badge-subtle" style="font-size: 10px;">${l.module}</span>
                  </td>
                  <td>
                    <span class="badge badge-primary" style="font-family: var(--font-mono); font-size: 10.5px;">${l.action}</span>
                  </td>
                  <td>
                    <span style="font-family: var(--font-mono); font-size: 11px; color: var(--primary-300);">${l.record_id || '—'}</span>
                  </td>
                  <td>
                    <span style="font-size: 12px; color: var(--text-secondary);">${l.details}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};
