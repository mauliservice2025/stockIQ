/* ==========================================================================
   ENTERPRISE ISCM - CENTRAL REACTIVE STATE STORE & SESSION CONTEXT
   Manages Multi-Tenant Facility Scoping, User Session, RBAC & UI Dialogs
   ========================================================================== */

class AppState {
  constructor() {
    this.currentPlantId = localStorage.getItem('ISCM_PLANT_ID') || 'PLANT-01';
    this.currentWarehouseId = 'ALL';
    this.currentUserId = localStorage.getItem('ISCM_CURRENT_USER_ID') || 'USR-001';
    this.isLoggedIn = localStorage.getItem('ISCM_LOGGED_IN') !== 'false';
    this.activeRoute = 'dashboard';
    this.subscribers = new Set();
  }

  logout() {
    const user = this.getCurrentUser();
    if (user && window.DB && typeof window.DB.logAudit === 'function') {
      window.DB.logAudit('LOGOUT_SUCCESS', 'Security', user.id, `User ${user.username} logged out of application`);
    }
    this.isLoggedIn = false;
    localStorage.setItem('ISCM_LOGGED_IN', 'false');
    this.notify();
    window.dispatchEvent(new CustomEvent('iscm:logout'));
  }

  login(userId, chosenPlantId) {
    this.isLoggedIn = true;
    localStorage.setItem('ISCM_LOGGED_IN', 'true');
    this.currentUserId = userId;
    localStorage.setItem('ISCM_CURRENT_USER_ID', userId);

    const user = this.getCurrentUser();
    const effectivePlant = chosenPlantId || (user && user.selected_branch_id) || (user && user.plant_id && user.plant_id !== 'ALL' ? user.plant_id : this.currentPlantId) || 'PLANT-01';
    if (effectivePlant && typeof this.setPlant === 'function') {
      this.setPlant(effectivePlant);
    }
    this.notify();
    window.dispatchEvent(new CustomEvent('iscm:login', { detail: { user } }));
    window.dispatchEvent(new CustomEvent('iscm:user-simulated', { detail: { user } }));

    if (window.App && typeof window.App.updateHeaderProfileInfo === 'function') {
      window.App.updateHeaderProfileInfo();
    }
    if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
      window.App.filterSidebarByPermissions();
    }

    // Mandatory First Login Force Change Password Check
    if (user && user.must_change_password && window.UserManagementModule && window.UserManagementModule.showForceChangePasswordModal) {
      setTimeout(() => {
        window.UserManagementModule.showForceChangePasswordModal(userId);
      }, 250);
    }
    return user;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(cb => cb(this));
  }

  get currentUser() {
    const u = this.getCurrentUser();
    if (!u) {
      return {
        id: 'USR-001',
        name: 'Pravin Patil',
        username: 'p.patil',
        full_name: 'Pravin Patil',
        role: 'ROLE-ADMIN',
        primary_role: 'ROLE-ADMIN'
      };
    }
    return {
      ...u,
      name: u.full_name || u.display_name || u.employee_name || u.username || 'User',
      role: u.primary_role
    };
  }

  getCurrentUser() {
    if (!window.DB) return null;
    let user = window.DB.getById('users', this.currentUserId);
    if (!user) {
      const allUsers = window.DB.getAll('users') || [];
      const targetId = (this.currentUserId || '').toLowerCase();
      user = allUsers.find(u => 
        (u.id && u.id.toLowerCase() === targetId) ||
        (u.username && u.username.toLowerCase() === targetId)
      );
    }
    // Check INITIAL_DATA as fallback if DB is still synchronizing
    if (!user && typeof INITIAL_DATA !== 'undefined' && Array.isArray(INITIAL_DATA.users)) {
      const targetId = (this.currentUserId || '').toLowerCase();
      user = INITIAL_DATA.users.find(u => 
        (u.id && u.id.toLowerCase() === targetId) ||
        (u.username && u.username.toLowerCase() === targetId)
      );
      if (user && window.DB && typeof window.DB.upsert === 'function') {
        window.DB.upsert('users', user);
      }
    }
    // Only fall back to USR-001 if no user exists or if currentUserId was not provided
    if (!user) {
      if (!this.currentUserId) {
        user = window.DB.getById('users', 'USR-001');
        this.currentUserId = 'USR-001';
        localStorage.setItem('ISCM_CURRENT_USER_ID', 'USR-001');
      } else {
        user = window.DB.getById('users', 'USR-001');
      }
    }
    if (user) {
      return user;
    }
    const users = window.DB.getAll('users') || [];
    return users[0] || {
      id: 'USR-001',
      username: 'p.patil',
      full_name: 'Pravin Patil',
      primary_role: 'ROLE-ADMIN',
      status: 'ACTIVE'
    };
  }

  switchSimulatedUser(userId) {
    const user = window.DB.getById('users', userId);
    if (!user) return;
    this.currentUserId = userId;
    localStorage.setItem('ISCM_CURRENT_USER_ID', userId);

    const role = window.DB.getById('roles', user.primary_role) || { name: user.primary_role };
    
    if (user.status !== 'ACTIVE') {
      this.showToast(`Switched Persona to: ${user.full_name} (${role.name || user.primary_role}) - ⚠️ Account Status is ${user.status}`, 'error');
    } else {
      this.showToast(`Switched Persona to: ${user.full_name} (${role.name || user.primary_role})`, 'success');
    }

    this.notify();
    window.dispatchEvent(new CustomEvent('iscm:user-simulated', { detail: { user } }));

    if (window.App && typeof window.App.updateHeaderProfileInfo === 'function') {
      window.App.updateHeaderProfileInfo();
    }
    if (window.App && typeof window.App.filterSidebarByPermissions === 'function') {
      window.App.filterSidebarByPermissions();
    }

    // Mandatory First Login Force Change Password Check
    if (user.must_change_password && window.UserManagementModule && window.UserManagementModule.showForceChangePasswordModal) {
      setTimeout(() => {
        window.UserManagementModule.showForceChangePasswordModal(userId);
      }, 250);
    }
  }

  /* =========================================================================
     RBAC & PERMISSION EVALUATION ENGINE (BRD §10, §11, §12, §43)
     Evaluates User -> Role -> Module/Function -> 15 Granular Actions
     ========================================================================= */
  hasPermission(permCode, action = 'VIEW') {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Self-healing: USR-001 (Pravin Patil) is always ACTIVE
    if (user.id === 'USR-001' && user.status !== 'ACTIVE') {
      user.status = 'ACTIVE';
      if (window.DB) window.DB.update('users', 'USR-001', { status: 'ACTIVE' });
    }

    // Inactive, locked, or expired accounts are denied all operations (BRD §7 & §43)
    if (user.status !== 'ACTIVE') {
      return false;
    }

    // Developer / root system owner fallback account (USR-001 / Pravin Patil) and System Admin roles have universal unrestricted access
    const uName = (user.username || '').toUpperCase();
    if (
      user.id === 'USR-001' || 
      user.username === 'p.patil' ||
      uName === 'PRAVINP' ||
      uName === 'PRAVIN' ||
      user.user_type === 'Admin' ||
      user.primary_role === 'ROLE-ADMIN' ||
      user.primary_role === 'ROLE-001' ||
      user.primary_role_id === 'ROLE-ADMIN' ||
      user.primary_role_id === 'ROLE-001'
    ) {
      return true;
    }

    const rolePerms = window.DB.getAll('role_permissions') || [];
    const normalizedAction = action.toLowerCase(); // 'view', 'add', 'edit', 'delete', 'submit', 'approve', etc.
    
    // Gather ONLY candidate role IDs directly assigned to this user (never from user_type or foreign roles)
    const assignedRoles = new Set();
    if (user.primary_role) {
      assignedRoles.add(user.primary_role);
    } else if (user.primary_role_id) {
      assignedRoles.add(user.primary_role_id);
    }
    if (user.role && (!user.primary_role || user.role === user.primary_role)) assignedRoles.add(user.role);
    if (Array.isArray(user.secondary_roles)) user.secondary_roles.forEach(r => assignedRoles.add(r));
    if (Array.isArray(user.assigned_roles)) user.assigned_roles.forEach(r => assignedRoles.add(r));
    if (Array.isArray(user.roles)) user.roles.forEach(r => assignedRoles.add(r));

    // Map role ID to role Code and vice-versa (e.g. ROLE-STORE-MGR <-> STORE_MGR, ROLE-001 <-> 001)
    const allRoles = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('roles') || []) : [];
    const candidateRoleIds = [...assignedRoles];
    for (const rid of assignedRoles) {
      const foundRole = allRoles.find(r => r.id === rid || r.code === rid);
      if (foundRole) {
        if (foundRole.id && !candidateRoleIds.includes(foundRole.id)) candidateRoleIds.push(foundRole.id);
        if (foundRole.code && !candidateRoleIds.includes(foundRole.code)) candidateRoleIds.push(foundRole.code);
      }
    }

    if (
      candidateRoleIds.includes('ROLE-ADMIN') || 
      candidateRoleIds.includes('SYSTEM_ADMIN') ||
      candidateRoleIds.includes('ROLE-001')
    ) {
      return true;
    }

    // Check direct matching on sub-module permCode
    let mapping = null;
    for (const rid of candidateRoleIds) {
      mapping = rolePerms.find(rp => 
        rp.role_id === rid && 
        (rp.perm_code === permCode || rp.perm_code === permCode.toUpperCase())
      );
      if (mapping) break;
    }

    if (mapping) {
      return !!mapping[normalizedAction];
    }

    // If no specific sub-module entry found, check category fallback
    if (!mapping) {
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
        // Store & Inventory sub-modules
        'STORE_MASTER': 'INVENTORY',
        'STORE_CATEGORY_MAP': 'INVENTORY',
        'STORE_VEHICLE_COMPAT': 'INVENTORY',
        'STORE_TX_PR': 'REQUISITIONS',
        'STORE_TX_PO': 'ORDERS',
        'STORE_TX_GRN': 'GRN',
        'STORE_TX_PURCHASE_RETURN': 'RETURNS',
        'STORE_TX_MATERIAL_ISSUE': 'INVENTORY',
        'STORE_TX_MATERIAL_RETURN': 'RETURNS',
        'STORE_TX_JOB_CARD_ISSUE': 'INVENTORY',
        'STORE_TX_JOB_CARD_RETURN': 'RETURNS',
        'JOB_CARDS': 'STORE_TX_JOB_CARD_ISSUE',
        'JOB_CARD': 'STORE_TX_JOB_CARD_ISSUE',
        'BILLING_DASHBOARD': 'STORE_TX_JOB_CARD_ISSUE',
        'BILLING': 'STORE_TX_JOB_CARD_ISSUE',
        'BILLING_ESTIMATES': 'STORE_TX_JOB_CARD_ISSUE',
        'ESTIMATES': 'STORE_TX_JOB_CARD_ISSUE',
        'DRAFT_BILLS': 'STORE_TX_JOB_CARD_ISSUE',
        'FINAL_BILLS': 'STORE_TX_JOB_CARD_ISSUE',
        'BILL_LIST': 'STORE_TX_JOB_CARD_ISSUE',
        'CUSTOMER_BILLING': 'STORE_TX_JOB_CARD_ISSUE',
        'VEHICLE_DELIVERY': 'STORE_TX_JOB_CARD_ISSUE',
        'CHANGE_NEXT_SERVICE_DATE': 'VEHICLE_DELIVERY',
        'CUSTOMER_REMINDERS': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_DASHBOARD': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_CONFIG': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_PROCESS': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_HISTORY': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_REPORTS': 'STORE_TX_JOB_CARD_ISSUE',
        'REMINDER_TEMPLATES': 'STORE_TX_JOB_CARD_ISSUE',
        'STORE_TX_STOCK_ADJUSTMENT': 'ADJUSTMENTS',
        'STORE_TX_PHYSICAL_COUNT': 'ADJUSTMENTS',
        'STORE_TX_STOCK_RESERVATION': 'INVENTORY',
        'STORE_TX_WALK_IN_SALE': 'DISPATCH',
        'STORE_TX_COUNTER_SALE': 'DISPATCH',
        'STORE_TX_SALES_RETURN': 'RETURNS',
        'STORE_TX_WARRANTY_RETURN': 'RETURNS',
        'STORE_TX_SCRAP_DISPOSAL': 'RETURNS',
        'STORE_TX_INTER_BRANCH': 'TRANSFERS',
        'STORE_TX_BIN_TRANSFER': 'PUTAWAY',
        'STORE_TX_OPENING_STOCK': 'INVENTORY',
        'STORE_TX_QUARANTINE': 'QUALITY',
        'STORE_TX_QUALITY_INSP': 'QUALITY',
        'STORE_INVENTORY_RULES': 'INVENTORY',
        'STORE_STOCK_LEDGER': 'INVENTORY',
        'OPENING_BALANCE': 'INVENTORY',
        'RECEIVE_TRANSFERS': 'TRANSFERS',
        'RECEIVE_STOCK_TRANSFER': 'TRANSFERS',
        'STOCK_TRANSFER': 'TRANSFERS',
        'STOCK_BALANCES': 'INVENTORY',
        // Organization & Location sub-modules
        'ORG_MASTER': 'MASTERS',
        'BRANCH_MASTER': 'MASTERS',
        'SUPPLIER_MASTER': 'MASTERS',
        'DOC_PRINT_CONFIG_MASTER': 'MASTERS',
        'DOCUMENT_PRINT_CONFIG_MASTER': 'MASTERS',
        'FINANCIAL_CALENDAR_MASTER': 'MASTERS',
        'DOC_SERIES_MASTER': 'MASTERS',
        'HOLIDAY_MASTER': 'MASTERS',
        'LOC_MASTER': 'MASTERS',
        'RACK_MASTER': 'MASTERS',
        'SHELF_MASTER': 'MASTERS',
        'BIN_MASTER': 'MASTERS'
      };
      let catCode = aliasMap[permCode];
      let depth = 0;
      while (catCode && !mapping && depth < 3) {
        for (const rid of candidateRoleIds) {
          mapping = rolePerms.find(rp => 
            rp.role_id === rid && 
            (rp.perm_code === catCode || rp.perm_code === catCode.toUpperCase())
          );
          if (mapping) break;
        }
        if (mapping) break;
        catCode = aliasMap[catCode];
        depth++;
      }
    }

    if (!mapping) return false;
    return !!mapping[normalizedAction];
  }

  canAccessPlant(plantId) {
    if (!plantId || plantId === 'ALL') return true;
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.status !== 'ACTIVE') return false;
    if (
      user.id === 'USR-001' || 
      user.username === 'p.patil' || 
      user.username === 'PRAVINP' ||
      user.plant_id === 'ALL'
    ) return true;

    if (user.plant_id === plantId || user.selected_branch_id === plantId) return true;
    if (Array.isArray(user.assigned_plants) && (user.assigned_plants.includes('ALL') || user.assigned_plants.includes(plantId))) {
      return true;
    }
    return false;
  }

  canAccessWarehouse(warehouseId, targetUser = null) {
    if (warehouseId === 'ALL') return true;
    const user = targetUser || this.getCurrentUser();
    if (!user) return false;
    if (user.status !== 'ACTIVE') return false;
    if (
      user.id === 'USR-001' || 
      user.username === 'p.patil' || 
      user.username === 'PRAVINP'
    ) return true;

    // 1. Explicit store assignment check on user profile
    if (Array.isArray(user.assigned_stores) && user.assigned_stores.length > 0) {
      if (user.assigned_stores.includes('ALL') || user.assigned_stores.includes(warehouseId)) {
        return true;
      }
      return false;
    }
    if (Array.isArray(user.assigned_warehouses) && user.assigned_warehouses.length > 0) {
      if (user.assigned_warehouses.includes('ALL') || user.assigned_warehouses.includes(warehouseId)) {
        return true;
      }
      return false;
    }
    if (user.warehouse_id && user.warehouse_id === warehouseId) {
      return true;
    }

    // 2. Scoped warehouse access collection check
    const accessList = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('user_warehouse_access') || []) : [];
    const userAccess = accessList.filter(wa => wa.user_id === user.id);
    if (userAccess.length > 0) {
      return userAccess.some(wa => wa.warehouse_id === warehouseId);
    }

    // 3. Fallback for root / unrestricted plant-level accounts
    if (user.plant_id === 'ALL') return true;

    return false;
  }

  canAccessStore(storeId, targetUser = null) {
    return this.canAccessWarehouse(storeId, targetUser);
  }

  getUserStores(targetUser = null) {
    const user = targetUser || this.getCurrentUser();
    const allStores = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('warehouses') || []) : [];
    if (!user) return allStores;
    if (user.id === 'USR-001' || user.username === 'p.patil' || user.username === 'PRAVINP') {
      return allStores;
    }
    return allStores.filter(s => this.canAccessWarehouse(s.id, user));
  }

  checkAmountApprovalLimit(transType, amount) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (
      user.id === 'USR-001' || 
      user.username === 'p.patil' ||
      user.username === 'PRAVINP'
    ) return true;

    const rules = window.DB.getAll('approval_authorities') || [];
    const userRule = rules.find(r => r.role_id === user.primary_role && r.transaction_type === transType);
    if (!userRule) return false;
    return amount <= userRule.max_amount;
  }

  validateSoDConflict(roleId1, roleId2) {
    const sodRules = (window.DB && window.DB.getAll('sod_rules')) || [];
    
    // Support either validateSoDConflict(['ROLE-A', 'ROLE-B']) or validateSoDConflict('ROLE-A', 'ROLE-B')
    let roles = [];
    if (Array.isArray(roleId1)) {
      roles = roleId1.filter(Boolean);
    } else {
      roles = [roleId1, roleId2].filter(Boolean);
    }

    if (roles.length < 2) {
      return null;
    }

    // Check all pairs in roles against active SoD rules
    for (const rule of sodRules) {
      if (rule.status && rule.status !== 'ACTIVE') continue;
      const hasR1 = roles.includes(rule.conflicting_role_1);
      const hasR2 = roles.includes(rule.conflicting_role_2);
      if (hasR1 && hasR2) {
        return {
          rule: {
            ...rule,
            description: rule.description || rule.rule_description
          },
          role1: rule.conflicting_role_1,
          role2: rule.conflicting_role_2
        };
      }
    }

    return null;
  }

  showUnauthorizedAlert(message = 'You are not authorized to access this module or function.') {
    this.showModal({
      title: '🚫 Access Denied (RBAC Exception)',
      maxWidth: '460px',
      contentHtml: `
        <div style="text-align: center; padding: 10px 0 16px 0;">
          <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); color: var(--color-danger); display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 16px auto;">
            🔒
          </div>
          <h3 style="font-size: 16.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
            Authorization Restriced
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 auto; max-width: 380px;">
            ${message}
          </p>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Acknowledge</button>
      `
    });
  }

  setPlant(plantId) {
    this.currentPlantId = plantId;
    localStorage.setItem('ISCM_PLANT_ID', plantId);
    this.currentWarehouseId = 'ALL';
    this.notify();
    window.dispatchEvent(new CustomEvent('iscm:facility-changed', { detail: { plantId } }));
  }

  setWarehouse(warehouseId) {
    this.currentWarehouseId = warehouseId;
    this.notify();
    window.dispatchEvent(new CustomEvent('iscm:warehouse-changed', { detail: { warehouseId } }));
  }

  getCurrentPlant() {
    return window.DB.getById('plants', this.currentPlantId) || { name: 'All Facilities', code: 'ALL' };
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-message">${message}</div>
      <button class="modal-close-btn" style="padding:2px;" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4500);
  }

  showModal(optionsOrTitle, contentHtml, footerHtml, maxWidth = '750px', isFullScreen = false) {
    let title = '';
    let body = '';
    let footer = null;
    let width = '750px';
    let full = false;

    if (optionsOrTitle && typeof optionsOrTitle === 'object' && !(optionsOrTitle instanceof HTMLElement)) {
      title = optionsOrTitle.title || '';
      body = optionsOrTitle.contentHtml || optionsOrTitle.content || optionsOrTitle.body || '';
      footer = optionsOrTitle.footerHtml !== undefined ? optionsOrTitle.footerHtml : (optionsOrTitle.footer !== undefined ? optionsOrTitle.footer : null);
      width = optionsOrTitle.maxWidth || '750px';
      full = !!optionsOrTitle.isFullScreen;
      var footerPadding = optionsOrTitle.footerPadding || null;
      var bodyPadding = optionsOrTitle.bodyPadding || null;
      var noScroll = !!optionsOrTitle.noScroll;
      var compactHeader = !!optionsOrTitle.compactHeader;
      var bodyStyle = optionsOrTitle.bodyStyle || null;
      var bodyFlex = optionsOrTitle.bodyFlex !== undefined ? !!optionsOrTitle.bodyFlex : full;
    } else {
      title = optionsOrTitle || '';
      body = contentHtml || '';
      footer = footerHtml !== undefined ? footerHtml : null;
      width = maxWidth || '750px';
      full = !!isFullScreen;
      var footerPadding = null;
      var bodyPadding = null;
      var noScroll = false;
      var compactHeader = false;
      var bodyStyle = null;
      var bodyFlex = full;
    }

    const overlay = document.getElementById('global-modal-overlay');
    const container = document.getElementById('global-modal-container');
    const titleEl = document.getElementById('global-modal-title');
    const bodyEl = document.getElementById('global-modal-body');
    const footerEl = document.getElementById('global-modal-footer');
    const maxBtn = document.getElementById('modal-maximize-btn');

    if (!overlay || !container) return;

    this.isModalFullscreen = !!full;
    if (this.isModalFullscreen) {
      container.classList.add('modal-fullscreen');
      overlay.classList.add('is-fullscreen');
      container.style.maxWidth = '98vw';
      if (maxBtn) {
        maxBtn.innerHTML = '🗗';
        maxBtn.title = 'Restore Windowed Size';
      }
    } else {
      container.classList.remove('modal-fullscreen');
      overlay.classList.remove('is-fullscreen');
      container.style.maxWidth = width;
      if (maxBtn) {
        maxBtn.innerHTML = '🗖';
        maxBtn.title = 'Toggle Fullscreen View';
      }
    }

    if (titleEl) {
      titleEl.innerHTML = title;
      titleEl.style.flex = '1';
    }
    const headerEl = container.querySelector('.modal-header');
    if (headerEl) {
      if (compactHeader || noScroll) {
        headerEl.style.padding = '10px 18px';
      } else {
        headerEl.style.padding = '';
      }
    }
    if (bodyEl) {
      bodyEl.innerHTML = body;
      if (bodyPadding) {
        bodyEl.style.setProperty('padding', bodyPadding, 'important');
      } else {
        bodyEl.style.padding = '';
      }
      if (bodyFlex || full) {
        bodyEl.style.display = 'flex';
        bodyEl.style.flexDirection = 'column';
        bodyEl.style.minHeight = '0';
      } else {
        bodyEl.style.display = '';
        bodyEl.style.flexDirection = '';
        bodyEl.style.minHeight = '';
      }
      if (bodyStyle) {
        bodyEl.style.cssText += ';' + bodyStyle;
      }
      if (noScroll) {
        bodyEl.style.overflow = 'hidden';
      } else {
        bodyEl.style.overflow = '';
      }
    }
    if (footerEl) {
      if (footer === false || footer === null) {
        footerEl.style.display = 'none';
        footerEl.innerHTML = '';
      } else {
        footerEl.style.display = '';
        if (footerPadding) {
          footerEl.style.setProperty('padding', footerPadding, 'important');
        } else {
          footerEl.style.padding = '';
        }
        footerEl.innerHTML = footer || `
          <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
        `;
      }
    }

    overlay.classList.add('active');
  }

  openModal(arg1, contentHtml, footerHtml, maxWidth = '750px', isFullScreen = false) {
    return this.showModal(arg1, contentHtml, footerHtml, maxWidth, isFullScreen);
  }

  toggleModalFullscreen() {
    const overlay = document.getElementById('global-modal-overlay');
    const container = document.getElementById('global-modal-container');
    const maxBtn = document.getElementById('modal-maximize-btn');
    if (!container) return;

    this.isModalFullscreen = !this.isModalFullscreen;
    if (this.isModalFullscreen) {
      container.classList.add('modal-fullscreen');
      if (overlay) overlay.classList.add('is-fullscreen');
      container.style.maxWidth = '98vw';
      if (maxBtn) {
        maxBtn.innerHTML = '🗗';
        maxBtn.title = 'Restore Windowed Size';
      }
    } else {
      container.classList.remove('modal-fullscreen');
      if (overlay) overlay.classList.remove('is-fullscreen');
      container.style.maxWidth = '780px';
      if (maxBtn) {
        maxBtn.innerHTML = '🗖';
        maxBtn.title = 'Toggle Fullscreen View';
      }
    }
  }

  isValidMobile(mobile) {
    if (!mobile) return false;
    const digits = String(mobile).replace(/\D/g, '');
    return digits.length === 10;
  }

  sanitizeMobile(mobile) {
    if (!mobile) return '';
    return String(mobile).replace(/\D/g, '').slice(-10);
  }

  closeModal() {
    const overlay = document.getElementById('global-modal-overlay');
    const container = document.getElementById('global-modal-container');
    const titleEl = document.getElementById('global-modal-title');
    const bodyEl = document.getElementById('global-modal-body');
    const footerEl = document.getElementById('global-modal-footer');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.classList.remove('is-fullscreen');
    }
    if (container) {
      container.classList.remove('modal-fullscreen');
      container.style.maxWidth = '';
      const headerEl = container.querySelector('.modal-header');
      if (headerEl) headerEl.style.padding = '';
    }
    if (titleEl) {
      titleEl.style.flex = '';
    }
    if (bodyEl) {
      bodyEl.style.padding = '';
      bodyEl.style.overflow = '';
    }
    if (footerEl) {
      footerEl.style.padding = '';
    }
    this.isModalFullscreen = false;
  }

  getCurrentUserId() {
    return this.currentUserId || (this.getCurrentUser() && this.getCurrentUser().id) || 'USR-001';
  }

  // =========================================================================
  // FAVOURITE VEHICLE MODELS HELPER (User-Scoped & RBAC Enforced)
  // =========================================================================
  getUserFavouriteVehicleModelIds() {
    const userId = this.getCurrentUserId();
    if (window.DB && typeof window.DB.getUserFavouriteVehicleModelIds === 'function') {
      return window.DB.getUserFavouriteVehicleModelIds(userId);
    }
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`STOCKIQ_FAV_VEHICLES_${userId}`);
        return raw ? JSON.parse(raw) : [];
      }
    } catch (_) {}
    return [];
  }

  isVehicleModelFavourite(modelId) {
    if (!modelId) return false;
    const favs = this.getUserFavouriteVehicleModelIds();
    return favs.includes(modelId);
  }

  toggleVehicleModelFavourite(modelId) {
    const user = this.getCurrentUser();
    if (!user || user.status !== 'ACTIVE') {
      if (this.showToast) {
        this.showToast('Please log in with an active account to manage favourite vehicles.', 'warning');
      }
      return { success: false, message: 'Inactive or unauthorized user account.' };
    }
    const userId = user.id || user.username || this.getCurrentUserId();
    if (window.DB && typeof window.DB.toggleVehicleModelFavourite === 'function') {
      return window.DB.toggleVehicleModelFavourite(userId, modelId, user);
    }
    return { success: false, message: 'Database layer unavailable.' };
  }

  // -------------------------------------------------------------------------
  // GLOBAL STANDARD DATE FORMATTER (DD-MM-YYYY, e.g. 28-10-2026)
  // -------------------------------------------------------------------------
  formatDate(dateVal, fallback = '--') {
    if (dateVal === null || dateVal === undefined || dateVal === '') return fallback;
    if (typeof dateVal === 'string') {
      const s = dateVal.trim();
      if (!s || s === '--' || s === '-' || s === 'N/A') return fallback;
      // Already DD-MM-YYYY
      if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
      // YYYY-MM-DD (with optional time / ISO timezone)
      const mIso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (mIso) {
        const y = mIso[1];
        const m = mIso[2].padStart(2, '0');
        const d = mIso[3].padStart(2, '0');
        return `${d}-${m}-${y}`;
      }
      // DD/MM/YYYY or D/M/YYYY
      const mSlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (mSlash) {
        const d = mSlash[1].padStart(2, '0');
        const m = mSlash[2].padStart(2, '0');
        const y = mSlash[3];
        return `${d}-${m}-${y}`;
      }
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return s;
    }
    if (dateVal instanceof Date) {
      if (isNaN(dateVal.getTime())) return fallback;
      const day = String(dateVal.getDate()).padStart(2, '0');
      const month = String(dateVal.getMonth() + 1).padStart(2, '0');
      const year = dateVal.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return String(dateVal);
  }

  formatDateTime(dateVal, fallback = '--') {
    if (!dateVal) return fallback;
    try {
      const d = (dateVal instanceof Date) ? dateVal : new Date(dateVal);
      if (isNaN(d.getTime())) return this.formatDate(dateVal, fallback);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${mins}`;
    } catch (_) {
      return this.formatDate(dateVal, fallback);
    }
  }
}

// Global Singleton Instance
window.State = new AppState();
window.formatDate = (d, fb) => window.State.formatDate(d, fb);
window.formatDateTime = (d, fb) => window.State.formatDateTime(d, fb);
