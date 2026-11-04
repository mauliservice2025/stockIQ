/* ==========================================================================
   ENTERPRISE ISCM - PINNED SUB-MODULES CONTROLLER (BRD v1.0)
   Personalized Quick Access Bar with Max 7 Pins, Reordering & RBAC
   ========================================================================== */

(function() {
  'use strict';

  // Canonical Sub-Module Registry across ISCM platform
  const SUBMODULE_REGISTRY = [
    // 1. Procurement
    { id: 'purchase-planning', title: 'MRP & Planning', route: '#/purchase-planning', icon: '📋', group: 'Procurement', permCode: 'PLANNING' },
    { id: 'requisitions', title: 'Requisitions (PR)', route: '#/requisitions', icon: '📝', group: 'Procurement', permCode: 'REQUISITIONS' },
    { id: 'orders', title: 'Purchase Orders (PO)', route: '#/orders', icon: '🛒', group: 'Procurement', permCode: 'ORDERS' },
    { id: 'grn', title: 'Goods Receipt (GRN)', route: '#/grn', icon: '📥', group: 'Procurement', permCode: 'GRN' },
    { id: 'suppliers', title: 'Supplier & Vendor Master', route: '#/suppliers', icon: '🚚', group: 'Procurement', permCode: 'SUPPLIER_MASTER' },

    // 2. Quality & Warehousing
    { id: 'quality', title: 'Quality Inspection', route: '#/quality', icon: '🔬', group: 'Quality & Storage', permCode: 'QUALITY' },
    { id: 'putaway', title: 'Directed Putaway', route: '#/putaway', icon: '📦', group: 'Quality & Storage', permCode: 'PUTAWAY' },
    { id: 'warehouse-map', title: 'Warehouse Visualizer', route: '#/warehouse-map', icon: '🗺️', group: 'Quality & Storage', permCode: 'WAREHOUSE_MAP' },

    // 3. Inventory & Logistics
    { id: 'inventory', title: 'Stock Balances', route: '#/inventory', icon: '🏬', group: 'Inventory & Logistics', permCode: 'INVENTORY' },
    { id: 'opening-balance', title: 'Opening Balance', route: '#/opening-balance', icon: '📦', group: 'Inventory & Logistics', permCode: 'OPENING_BALANCE' },
    { id: 'transfers', title: 'Stock Transfer', route: '#/transfers', icon: '🔄', group: 'Inventory & Logistics', permCode: 'TRANSFERS' },
    { id: 'receive-transfers', title: 'Receive Stock Transfer', route: '#/receive-transfers', icon: '📥', group: 'Inventory & Logistics', permCode: 'RECEIVE_TRANSFERS' },

    // 4. Manufacturing
    { id: 'production', title: 'Work Orders & BOM', route: '#/production', icon: '⚙️', group: 'Manufacturing', permCode: 'PRODUCTION' },

    // 5. Outbound Sales & Dispatch
    { id: 'dispatch', title: 'Dispatch & Gate Pass', route: '#/dispatch', icon: '📤', group: 'Outbound Logistics', permCode: 'DISPATCH' },

    // 6. Audits & Reports
    { id: 'returns', title: 'Reverse Logistics (RMA)', route: '#/returns', icon: '↩️', group: 'Audits & Reports', permCode: 'RETURNS' },
    { id: 'adjustments', title: 'Cycle Counts & Adjust', route: '#/adjustments', icon: '⚖️', group: 'Audits & Reports', permCode: 'ADJUSTMENTS' },
    { id: 'reports', title: 'Executive MIS Reports', route: '#/reports', icon: '📈', group: 'Audits & Reports', permCode: 'REPORTS' },
    { id: 'audit', title: 'Audit Trail Log', route: '#/audit', icon: '🛡️', group: 'Audits & Reports', permCode: 'AUDIT' },

    // 7. Billing & Workshop Suite (Two-Wheeler Service Center Flow)
    { id: 'billing-dashboard', title: 'Billing Dashboard', route: '#/billing-dashboard', icon: '📊', group: 'Billing & Workshop', permCode: 'BILLING_DASHBOARD' },
    { id: 'job-cards', title: 'Job Card', route: '#/job-cards', icon: '🏍️', group: 'Billing & Workshop', permCode: 'STORE_TX_JOB_CARD_ISSUE' },
    { id: 'billing-estimates', title: 'Estimate', route: '#/billing-estimates', icon: '📝', group: 'Billing & Workshop', permCode: 'BILLING_ESTIMATES' },
    { id: 'customer-billing', title: 'Billing', route: '#/customer-billing', icon: '💳', group: 'Billing & Workshop', permCode: 'CUSTOMER_BILLING' },
    { id: 'draft-bills', title: 'Draft Bill', route: '#/draft-bills', icon: '📄', group: 'Billing & Workshop', permCode: 'DRAFT_BILLS' },
    { id: 'final-bills', title: 'Bill List', route: '#/final-bills', icon: '🧾', group: 'Billing & Workshop', permCode: 'FINAL_BILLS' },
    { id: 'vehicle-delivery', title: 'Vehicle Delivery', route: '#/vehicle-delivery', icon: '🏁', group: 'Billing & Workshop', permCode: 'VEHICLE_DELIVERY' },

    // 8. Item Master Setup Suite
    { id: 'item-dashboard', title: 'Item Master Dashboard', route: '#/item-dashboard', icon: '📦', group: 'Item Master Setup', permCode: 'STORE_MASTER' },
    { id: 'item-master', title: 'Item Master', route: '#/item-master', icon: '🔩', group: 'Item Master Setup', permCode: 'STORE_MASTER' },
    { id: 'service-master', title: 'Service Master', route: '#/service-master', icon: '🛠️', group: 'Item Master Setup', permCode: 'STORE_MASTER' },
    { id: 'item-categories', title: 'Item Category & Sub-Category', route: '#/item-categories', icon: '🏷️', group: 'Item Master Setup', permCode: 'STORE_MASTER' },
    { id: 'item-brands', title: 'Brand Master', route: '#/item-brands', icon: '✨', group: 'Item Master Setup', permCode: 'STORE_MASTER' },
    { id: 'item-manufacturers', title: 'Manufacturer Master', route: '#/item-manufacturers', icon: '🏭', group: 'Item Master Setup', permCode: 'STORE_MASTER' },
    { id: 'vehicle-compatibility', title: 'Vehicle Compatibility', route: '#/vehicle-compatibility', icon: '🏍️', group: 'Item Master Setup', permCode: 'STORE_VEHICLE_COMPAT' },
    { id: 'uom-master', title: 'UOM Master', route: '#/uom-master', icon: '📏', group: 'Item Master Setup', permCode: 'STORE_MASTER' },
    { id: 'hsn-master', title: 'HSN/SAC Master', route: '#/hsn-master', icon: '📜', group: 'Item Master Setup', permCode: 'STORE_MASTER' },
    { id: 'stock-counts', title: 'Physical Count & Adjust', route: '#/stock-counts', icon: '📋', group: 'Item Master Setup', permCode: 'STORE_TX_PHYSICAL_COUNT' },
    { id: 'warranty-scrap', title: 'Warranty & Scrap Stores', route: '#/warranty-scrap', icon: '♻️', group: 'Item Master Setup', permCode: 'STORE_TX_WARRANTY_RETURN' },
    { id: 'inventory-rules', title: 'Inventory Rules & Access', route: '#/inventory-rules', icon: '⚖️', group: 'Item Master Setup', permCode: 'STORE_INVENTORY_RULES' },
    { id: 'stock-ledger', title: 'Stock Ledger & Valuation', route: '#/stock-ledger', icon: '📚', group: 'Item Master Setup', permCode: 'STORE_STOCK_LEDGER' },

    // 9. Store Master Setup Suite
    { id: 'store-master', title: 'Store Master', route: '#/store-master', icon: '🏬', group: 'Store Master Setup', permCode: 'STORE_MASTER' },
    { id: 'storage-locations', title: 'Storage Location Master', route: '#/storage-locations', icon: '📍', group: 'Store Master Setup', permCode: 'LOC_MASTER' },
    { id: 'racks', title: 'Rack Master', route: '#/racks', icon: '🗄️', group: 'Store Master Setup', permCode: 'RACK_MASTER' },
    { id: 'shelves', title: 'Shelf Master', route: '#/shelves', icon: '📚', group: 'Store Master Setup', permCode: 'SHELF_MASTER' },
    { id: 'bins', title: 'Bin Master', route: '#/bins', icon: '📥', group: 'Store Master Setup', permCode: 'BIN_MASTER' },

    // 10. Organization & Facility Setup
    { id: 'organizations', title: 'Organisation Master', route: '#/organizations', icon: '🏢', group: 'Organization & Facility Setup', permCode: 'ORG_MASTER' },
    { id: 'branches', title: 'Facility Master', route: '#/branches', icon: '🏥', group: 'Organization & Facility Setup', permCode: 'BRANCH_MASTER' },
    { id: 'doc-print-config', title: 'Document Print Configuration', route: '#/doc-print-config', icon: '🖨️', group: 'Organization & Facility Setup', permCode: 'DOC_PRINT_CONFIG_MASTER' },
    { id: 'financial-calendar', title: 'Financial Calendar Master', route: '#/financial-calendar', icon: '📅', group: 'Organization & Facility Setup', permCode: 'FINANCIAL_CALENDAR_MASTER' },
    { id: 'doc-series', title: 'Document Number Series Master', route: '#/doc-series', icon: '🔢', group: 'Organization & Facility Setup', permCode: 'DOC_SERIES_MASTER' },
    { id: 'holiday-master', title: 'Holiday Master', route: '#/holiday-master', icon: '🏖️', group: 'Organization & Facility Setup', permCode: 'HOLIDAY_MASTER' },
    { id: 'registration-config', title: 'Registration Configuration', route: '#/registration-config', icon: '⚙️', group: 'Organization & Facility Setup', permCode: 'CONFIG_REGISTRATION' },
    { id: 'common-master', title: 'Common Master', route: '#/common-master', icon: '📑', group: 'Organization & Facility Setup', permCode: 'COMMON_MASTER' },
    { id: 'address-master', title: 'Address Master', route: '#/address-master', icon: '📍', group: 'Organization & Facility Setup', permCode: 'COMMON_MASTER' },
    { id: 'tax-master', title: 'Tax Master', route: '#/tax-master', icon: '💰', group: 'Organization & Facility Setup', permCode: 'TAX_MASTER' },

    // 11. User Roles & Security
    { id: 'security-dashboard', title: 'Security Dashboard', route: '#/security-dashboard', icon: '🛡️', group: 'User Roles & Security', permCode: 'SEC_DASHBOARD' },
    { id: 'users', title: 'User Master', route: '#/users', icon: '👤', group: 'User Roles & Security', permCode: 'USER_MASTER' },
    { id: 'roles', title: 'Role Master', route: '#/roles', icon: '🎭', group: 'User Roles & Security', permCode: 'ROLE_MASTER' },
    { id: 'permissions', title: 'Permission Master', route: '#/permissions', icon: '🔑', group: 'User Roles & Security', permCode: 'PERMISSIONS' },
    { id: 'role-permissions', title: 'Role-Permission Matrix', route: '#/role-permissions', icon: '🔀', group: 'User Roles & Security', permCode: 'ROLE_PERM_MAP' },
    { id: 'user-roles', title: 'User-Role Hierarchy', route: '#/user-roles', icon: '👥', group: 'User Roles & Security', permCode: 'USER_ROLE_MAP' },
    { id: 'sod-rules', title: 'Segregation of Duties (SoD)', route: '#/sod-rules', icon: '⚖️', group: 'User Roles & Security', permCode: 'SOD_RULES' },
    { id: 'approval-authorities', title: 'Approval Limits & Authority', route: '#/approval-authorities', icon: '💼', group: 'User Roles & Security', permCode: 'APPROVAL_LIMITS' },
    { id: 'delegations', title: 'Delegations & Temp Access', route: '#/delegations', icon: '🤝', group: 'User Roles & Security', permCode: 'DELEGATIONS' },
    { id: 'access-requests', title: 'Access Request Workflow', route: '#/access-requests', icon: '📩', group: 'User Roles & Security', permCode: 'ACCESS_REQUESTS' },
    { id: 'password-policy', title: 'Password Policy Config', route: '#/password-policy', icon: '🔒', group: 'User Roles & Security', permCode: 'PASSWORD_POLICY' },
    { id: 'login-security', title: 'Login Security & Lockouts', route: '#/login-security', icon: '⛔', group: 'User Roles & Security', permCode: 'LOGIN_SECURITY' },
    { id: 'sessions', title: 'Live User Sessions', route: '#/sessions', icon: '💻', group: 'User Roles & Security', permCode: 'SESSIONS' },
    { id: 'login-history', title: 'Authentication History', route: '#/login-history', icon: '🕒', group: 'User Roles & Security', permCode: 'LOGIN_HISTORY' },
    { id: 'access-reports', title: 'Periodic Access Review Reports', route: '#/access-reports', icon: '📊', group: 'User Roles & Security', permCode: 'ACCESS_REPORTS' },
    { id: 'user-activity', title: 'Security Audit Trail', route: '#/user-activity', icon: '📜', group: 'User Roles & Security', permCode: 'USER_ACTIVITY' },

    // 12. Customer Relationship Management (CRM)
    { id: 'reminder-dashboard', title: 'Service Reminder Dashboard', route: '#/reminder-dashboard', icon: '📊', group: 'Customer Relationship (CRM)', permCode: 'REMINDER_DASHBOARD' },
    { id: 'reminder-configuration', title: 'Reminder Configuration', route: '#/reminder-configuration', icon: '⚙️', group: 'Customer Relationship (CRM)', permCode: 'REMINDER_CONFIG' },
    { id: 'reminder-processing', title: 'Reminder Processing', route: '#/reminder-processing', icon: '⚡', group: 'Customer Relationship (CRM)', permCode: 'REMINDER_PROCESS' },
    { id: 'reminder-history', title: 'Reminder History', route: '#/reminder-history', icon: '📜', group: 'Customer Relationship (CRM)', permCode: 'REMINDER_HISTORY' },
    { id: 'reminder-reports', title: 'Reminder Reports', route: '#/reminder-reports', icon: '📈', group: 'Customer Relationship (CRM)', permCode: 'REMINDER_REPORTS' },
    { id: 'message-templates', title: 'Message Template Master', route: '#/message-templates', icon: '💬', group: 'Customer Relationship (CRM)', permCode: 'REMINDER_TEMPLATES' }
  ];

  class PinnedSubmodulesController {
    constructor() {
      this.registry = SUBMODULE_REGISTRY;
      this.isInitialized = false;
    }

    discoverAndRegisterAllPages() {
      // 1. Auto-discover from sidebar DOM
      if (typeof document !== 'undefined') {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) {
          const links = sidebar.querySelectorAll('a.sub-nav-item, a.nav-item');
          links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#') || href === '#/login' || href === '#/') return;

            const cleanHash = href.split('?')[0];
            if (this.registry.some(s => s.route === cleanHash)) return;

            // Extract title
            const titleEl = link.querySelector('.sub-nav-title') || link.querySelector('span:not(.nav-item-icon):not(.nav-item-badge)');
            const title = (titleEl ? titleEl.textContent : link.textContent).trim();
            if (!title) return;

            // Extract group & icon
            const groupEl = link.closest('.module-group');
            let group = 'General';
            let icon = '📌';
            if (groupEl) {
              const groupTitleEl = groupEl.querySelector('.module-header-title');
              if (groupTitleEl) group = groupTitleEl.textContent.trim();
              const groupIconEl = groupEl.querySelector('.module-header-icon');
              if (groupIconEl) icon = groupIconEl.textContent.trim();
            } else {
              const itemIconEl = link.querySelector('.nav-item-icon');
              if (itemIconEl) icon = itemIconEl.textContent.trim();
            }

            const id = cleanHash.replace(/^#\/?/, '').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase() || 'page-' + Date.now();
            const permCode = (typeof window !== 'undefined' && window.App && typeof window.App.getRequiredPermCode === 'function')
              ? window.App.getRequiredPermCode(cleanHash)
              : 'ALL';

            this.registry.push({
              id,
              title,
              route: cleanHash,
              icon,
              group,
              permCode
            });
          });
        }
      }

      // 2. Auto-discover from window.App.routes
      if (typeof window !== 'undefined' && window.App && window.App.routes) {
        Object.keys(window.App.routes).forEach(routeHash => {
          if (!routeHash.startsWith('#') || routeHash === '#/login') return;
          const cleanHash = routeHash.split('?')[0];
          if (this.registry.some(s => s.route === cleanHash)) return;

          const cfg = window.App.routes[routeHash];
          if (!cfg) return;

          const title = cfg.title || cleanHash.replace(/^#\/?/, '').replace(/-/g, ' ');
          const group = cfg.section || 'General';
          const icon = '📌';
          const id = cleanHash.replace(/^#\/?/, '').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
          const permCode = (typeof window.App.getRequiredPermCode === 'function')
            ? window.App.getRequiredPermCode(cleanHash)
            : 'ALL';

          this.registry.push({
            id,
            title,
            route: cleanHash,
            icon,
            group,
            permCode
          });
        });
      }
    }

    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      // Auto-discover all available pages
      this.discoverAndRegisterAllPages();

      // Render pinned bar on startup
      this.renderPinnedBar();
      this.attachSidebarPinIcons();
      this.updateScreenHeaderPinButton();

      // Reactive subscription to DB changes
      if (window.DB && typeof window.DB.subscribe === 'function') {
        window.DB.subscribe('userPinnedSubmodules', () => {
          this.renderPinnedBar();
          this.attachSidebarPinIcons();
          this.updateScreenHeaderPinButton();
        });
      }

      // Reactive update on route changes
      window.addEventListener('hashchange', () => {
        this.updateActiveState();
        this.updateScreenHeaderPinButton();
      });

      // Reactive update on user simulated / login
      window.addEventListener('iscm:user-simulated', () => {
        this.renderPinnedBar();
        this.attachSidebarPinIcons();
        this.updateScreenHeaderPinButton();
      });

      window.addEventListener('iscm:login', () => {
        this.renderPinnedBar();
        this.attachSidebarPinIcons();
        this.updateScreenHeaderPinButton();
      });
    }

    getCurrentUserId() {
      if (window.State && typeof window.State.getCurrentUser === 'function') {
        const u = window.State.getCurrentUser();
        if (u) return u.id || u.username;
      }
      return 'USR-001';
    }

    canAccessSubmodule(submodule) {
      if (!submodule) return false;
      if (!window.App || typeof window.App.canAccessRoute !== 'function') return true;
      return window.App.canAccessRoute(submodule.route);
    }

    getSubmoduleById(id) {
      if (!id) return null;
      let found = this.registry.find(s => s.id === id);
      if (!found) {
        this.discoverAndRegisterAllPages();
        found = this.registry.find(s => s.id === id);
      }
      return found || null;
    }

    getSubmoduleByRoute(routeHash) {
      if (!routeHash) return null;
      const cleanHash = routeHash.split('?')[0];

      // Exact match first
      const exact = this.registry.find(s => s.route === cleanHash);
      if (exact) return exact;

      // Aliases
      if (cleanHash === '#/inventory-opening' || cleanHash === '#/opening-balance-config') {
        return this.getSubmoduleById('opening-balance');
      }
      if (cleanHash === '#/billing') return this.getSubmoduleById('billing-dashboard');
      if (cleanHash === '#/job-card-parts') return this.getSubmoduleById('job-cards');
      if (cleanHash === '#/bill-list') return this.getSubmoduleById('final-bills');
      if (cleanHash === '#/store-inventory') return this.getSubmoduleById('store-master');
      if (cleanHash === '#/item-subcategories') return this.getSubmoduleById('item-categories');
      if (cleanHash === '#/countries' || cleanHash === '#/states' || cleanHash === '#/districts' || cleanHash === '#/cities' || cleanHash === '#/pincodes') {
        return this.getSubmoduleById('address-master');
      }

      // Check dynamic discovery for all new developed pages onwards
      this.discoverAndRegisterAllPages();
      const discovered = this.registry.find(s => s.route === cleanHash);
      if (discovered) return discovered;

      return null;
    }

    getUserPins() {
      const userId = this.getCurrentUserId();
      if (!window.DB || typeof window.DB.getUserPinnedSubmodules !== 'function') return [];
      const rawPins = window.DB.getUserPinnedSubmodules(userId);

      // PIN-FR-35 & PIN-FR-36: Only show pins the user currently has permission to access
      const activePins = [];
      rawPins.forEach(p => {
        const sub = this.getSubmoduleById(p.submodule_id);
        if (sub && this.canAccessSubmodule(sub)) {
          activePins.push({
            ...p,
            submodule: sub
          });
        }
      });

      return activePins;
    }

    isSubmodulePinned(submoduleId) {
      const pins = this.getUserPins();
      return pins.some(p => p.submodule_id === submoduleId);
    }

    // Toggle Pin/Unpin action from anywhere (sidebar, header, or manage modal)
    togglePin(submoduleId) {
      const userId = this.getCurrentUserId();
      const sub = this.getSubmoduleById(submoduleId);
      if (!sub) return;

      if (!this.canAccessSubmodule(sub)) {
        if (window.State && window.State.showToast) {
          window.State.showToast('You do not have permission to pin this sub-module.', 'error');
        }
        return;
      }

      const isPinned = this.isSubmodulePinned(submoduleId);

      if (isPinned) {
        // Unpin
        const res = window.DB.unpinUserSubmodule(userId, submoduleId);
        if (res && res.success) {
          if (window.State && window.State.showToast) {
            window.State.showToast(`"${sub.title}" unpinned from top bar.`, 'info');
          }
        }
      } else {
        // Pin
        const res = window.DB.pinUserSubmodule(userId, submoduleId);
        if (!res.success) {
          // PIN-FR-11: Handle Limit Reached
          if (res.code === 'LIMIT_REACHED') {
            if (window.State && window.State.showToast) {
              window.State.showToast(res.message, 'warning');
            } else {
              alert(res.message);
            }
          } else {
            if (window.State && window.State.showToast) {
              window.State.showToast(res.message || 'Could not pin sub-module.', 'error');
            }
          }
          return;
        }

        if (window.State && window.State.showToast) {
          window.State.showToast(`"${sub.title}" pinned to top bar!`, 'success');
        }
      }

      this.renderPinnedBar();
      this.attachSidebarPinIcons();
      this.updateScreenHeaderPinButton();
    }

    unpin(submoduleId, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      const userId = this.getCurrentUserId();
      const sub = this.getSubmoduleById(submoduleId);
      const title = sub ? sub.title : 'Sub-module';

      window.DB.unpinUserSubmodule(userId, submoduleId);
      if (window.State && window.State.showToast) {
        window.State.showToast(`"${title}" unpinned.`, 'info');
      }

      this.renderPinnedBar();
      this.attachSidebarPinIcons();
      this.updateScreenHeaderPinButton();
    }

    renderPinnedBar() {
      const container = document.getElementById('pinned-submodules-bar');
      if (!container) return;

      // Hide on login screen
      const hash = window.location.hash || '#/dashboard';
      if (hash === '#/login' || (window.State && window.State.isLoggedIn === false)) {
        container.style.display = 'none';
        return;
      } else {
        container.style.display = 'flex';
      }

      const pins = this.getUserPins();
      const maxLimit = (window.DB && typeof window.DB.getMaxPinnedSubmodules === 'function')
        ? window.DB.getMaxPinnedSubmodules()
        : 7;

      const currentSub = this.getSubmoduleByRoute(hash);
      const currentSubId = currentSub ? currentSub.id : null;

      let html = '';

      if (pins.length === 0) {
        // PIN-FR-20: Empty State
        html = `
          <div class="pinned-bar-inner empty-bar">
            <div class="pinned-empty-msg">
              <span class="pinned-empty-icon">📌</span>
              <span class="pinned-empty-text">Pin your frequently used sub-modules for quick access.</span>
            </div>
            <div class="pinned-bar-actions">
              <button type="button" class="btn-pin-action-sm" onclick="window.PinnedSubmodulesModule.openManageModal()" title="Add pinned sub-modules">
                <span>+ Pin Sub-Modules</span>
              </button>
            </div>
          </div>
        `;
      } else {
        // Active Pinned List
        html = `
          <div class="pinned-bar-inner">
            <div class="pinned-chips-scroll" id="pinned-chips-scroll">
              ${pins.map(p => {
                const sub = p.submodule;
                const isActive = (sub.id === currentSubId) || (sub.route === hash);
                return `
                  <div class="pinned-chip ${isActive ? 'active' : ''}" data-submodule-id="${sub.id}" title="${sub.title} (${sub.group})">
                    <a href="${sub.route}" class="pinned-chip-link" onclick="window.PinnedSubmodulesModule.onChipClick(event, '${sub.route}')">
                      <span class="pinned-chip-icon">${sub.icon}</span>
                      <span class="pinned-chip-title">${sub.title}</span>
                    </a>
                    <button type="button" class="pinned-chip-unpin" title="Unpin ${sub.title}" onclick="window.PinnedSubmodulesModule.unpin('${sub.id}', event)">✕</button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      container.innerHTML = html;
    }

    onChipClick(e, route) {
      // Smooth navigation
      if (window.location.hash === route) {
        e.preventDefault();
        if (window.App && typeof window.App.handleRoute === 'function') {
          window.App.handleRoute();
        }
      }
      // Pinned bar chips update highlight
      setTimeout(() => this.updateActiveState(), 50);
    }

    updateActiveState() {
      const container = document.getElementById('pinned-submodules-bar');
      if (!container) return;

      const hash = window.location.hash || '#/dashboard';
      if (hash === '#/login') {
        container.style.display = 'none';
        return;
      } else {
        container.style.display = 'flex';
      }

      const currentSub = this.getSubmoduleByRoute(hash);
      const currentSubId = currentSub ? currentSub.id : null;

      const chips = container.querySelectorAll('.pinned-chip');
      chips.forEach(chip => {
        const subId = chip.getAttribute('data-submodule-id');
        if (subId && subId === currentSubId) {
          chip.classList.add('active');
        } else {
          chip.classList.remove('active');
        }
      });
    }

    // PIN-FR-04: Attach Pin Icons in the Sidebar against every sub-module
    attachSidebarPinIcons() {
      this.discoverAndRegisterAllPages();
      const sidebar = document.getElementById('app-sidebar');
      if (!sidebar) return;

      const subNavItems = sidebar.querySelectorAll('a.sub-nav-item, a.nav-item');
      subNavItems.forEach(item => {
        const href = item.getAttribute('href');
        if (!href) return;

        const sub = this.getSubmoduleByRoute(href);
        if (!sub) return;

        const isPinned = this.isSubmodulePinned(sub.id);

        let pinBtn = item.querySelector('.sidebar-sub-pin-btn');
        if (!pinBtn) {
          pinBtn = document.createElement('button');
          pinBtn.type = 'button';
          pinBtn.className = 'sidebar-sub-pin-btn';
          item.appendChild(pinBtn);
        }

        pinBtn.setAttribute('data-submodule-id', sub.id);
        pinBtn.className = `sidebar-sub-pin-btn ${isPinned ? 'is-pinned' : ''}`;
        pinBtn.setAttribute('title', isPinned ? `Unpin ${sub.title}` : `Pin ${sub.title} to top bar`);
        pinBtn.innerHTML = `
          <svg class="pin-svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5"></path>
            <path d="M9 2h6l-1 7h3l-5 8 1-6H7l2-9z"></path>
          </svg>
        `;

        pinBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.togglePin(sub.id);
        };
      });
    }

    // PIN-FR-05: Update current screen header with a quick pin toggle button
    updateScreenHeaderPinButton() {
      const hash = (typeof window !== 'undefined' && window.location && window.location.hash) ? window.location.hash : '#/dashboard';
      const isBillingRoute = [
        '#/billing-dashboard', '#/job-cards', '#/billing-estimates',
        '#/customer-billing', '#/final-bills', '#/vehicle-delivery', '#/draft-bills'
      ].some(r => hash.startsWith(r));

      if (hash === '#/login' || hash === '#/grn' || isBillingRoute) {
        const pinActionBtn = (typeof document !== 'undefined') ? document.getElementById('header-screen-pin-btn') : null;
        if (pinActionBtn) pinActionBtn.remove();
        const billingPinBtn = (typeof document !== 'undefined') ? document.getElementById('billing-header-screen-pin-btn') : null;
        if (billingPinBtn) billingPinBtn.remove();
        return;
      }

      const sub = this.getSubmoduleByRoute(hash);
      if (!sub) return;

      const isPinned = this.isSubmodulePinned(sub.id);

      // Check if billing-header-pin-container is present
      const billingPinContainer = (typeof document !== 'undefined') ? document.getElementById('billing-header-pin-container') : null;
      if (billingPinContainer) {
        // Clean up standard header button if any to avoid duplicates
        const oldHeaderBtn = document.getElementById('header-screen-pin-btn');
        if (oldHeaderBtn) oldHeaderBtn.remove();

        let billingPinBtn = document.getElementById('billing-header-screen-pin-btn');
        if (!billingPinBtn) {
          billingPinBtn = document.createElement('button');
          billingPinBtn.type = 'button';
          billingPinBtn.id = 'billing-header-screen-pin-btn';
          billingPinContainer.appendChild(billingPinBtn);
        }

        billingPinBtn.className = `btn btn-sm ${isPinned ? 'btn-primary active' : 'btn-secondary'} header-pin-toggle-btn`;
        billingPinBtn.setAttribute('title', isPinned ? `Unpin ${sub.title} from top bar` : `Pin ${sub.title} to top bar`);
        billingPinBtn.style.display = 'inline-flex';
        billingPinBtn.style.alignItems = 'center';
        billingPinBtn.style.gap = '6px';
        billingPinBtn.style.fontWeight = '600';
        billingPinBtn.style.fontSize = '12px';
        billingPinBtn.style.padding = '6px 14px';
        billingPinBtn.style.borderRadius = '6px';
        billingPinBtn.style.cursor = 'pointer';
        billingPinBtn.innerHTML = `
          <span style="font-size: 13px;">${isPinned ? '📌' : '📍'}</span>
          <span>${isPinned ? 'Pinned' : 'Pin to Top Bar'}</span>
        `;
        billingPinBtn.onclick = (e) => {
          e.preventDefault();
          this.togglePin(sub.id);
        };
        return;
      }

      // If billing pin button remains after navigating away from billing, remove it
      const leftoverBillingPinBtn = document.getElementById('billing-header-screen-pin-btn');
      if (leftoverBillingPinBtn) leftoverBillingPinBtn.remove();

      // 1. In #page-actions-container if present
      const actionsContainer = document.getElementById('page-actions-container');
      if (actionsContainer) {
        let pinActionBtn = document.getElementById('header-screen-pin-btn');
        if (!pinActionBtn) {
          pinActionBtn = document.createElement('button');
          pinActionBtn.type = 'button';
          pinActionBtn.id = 'header-screen-pin-btn';
          actionsContainer.prepend(pinActionBtn);
        }

        pinActionBtn.className = `btn btn-sm ${isPinned ? 'btn-primary active' : 'btn-secondary'} header-pin-toggle-btn`;
        pinActionBtn.setAttribute('title', isPinned ? `Unpin ${sub.title} from top bar` : `Pin ${sub.title} to top bar`);
        pinActionBtn.innerHTML = `
          <span style="font-size: 13px;">${isPinned ? '📌' : '📍'}</span>
          <span>${isPinned ? 'Pinned' : 'Pin to Top Bar'}</span>
        `;
        pinActionBtn.onclick = (e) => {
          e.preventDefault();
          this.togglePin(sub.id);
        };
      }
    }

    // PIN-FR-40 to PIN-FR-42: Manage Pins Modal
    openManageModal() {
      this.discoverAndRegisterAllPages();
      const userId = this.getCurrentUserId();
      const pins = this.getUserPins();
      const maxLimit = (window.DB && typeof window.DB.getMaxPinnedSubmodules === 'function')
        ? window.DB.getMaxPinnedSubmodules()
        : 7;

      let modal = document.getElementById('manage-pins-modal');
      if (modal) modal.remove();

      modal = document.createElement('div');
      modal.id = 'manage-pins-modal';
      modal.className = 'modal active';
      modal.style.zIndex = '99999';

      modal.innerHTML = `
        <div class="modal-backdrop" onclick="window.PinnedSubmodulesModule.closeManageModal()"></div>
        <div class="modal-dialog" style="max-width: 680px; width: 95%; max-height: 90vh; display: flex; flex-direction: column;">
          <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid var(--border-subtle);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 22px;">📌</span>
              <div>
                <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: var(--text-primary);">Manage Pinned Sub-Modules</h3>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">Personalize your top quick-access bar (Up to ${maxLimit} sub-modules)</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="badge ${pins.length >= maxLimit ? 'badge-warning' : 'badge-primary'}" id="manage-pins-count-badge" style="font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">
                ${pins.length} of ${maxLimit} Pinned
              </span>
              <button type="button" class="modal-close-btn" onclick="window.PinnedSubmodulesModule.closeManageModal()" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer;">✕</button>
            </div>
          </div>

          <div class="modal-body" style="padding: 18px 22px; overflow-y: auto; flex: 1;">
            <!-- Active Pins Ordering Section -->
            <div style="margin-bottom: 22px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; font-size: 13.5px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>Currently Pinned</span>
                  <span style="font-size: 12px; font-weight: 400; color: var(--text-muted);">(Use arrows to reorder)</span>
                </h4>
                ${pins.length > 0 ? `
                  <button type="button" class="btn btn-sm btn-link text-danger" onclick="window.PinnedSubmodulesModule.confirmResetPins()" style="font-size: 12px; color: var(--color-danger); text-decoration: underline; background: none; border: none; cursor: pointer; padding: 0;">
                    Clear All Pins
                  </button>
                ` : ''}
              </div>

              <div id="manage-pins-active-list" style="display: flex; flex-direction: column; gap: 8px;">
                ${pins.length === 0 ? `
                  <div style="padding: 24px; text-align: center; background: var(--bg-surface-elevated); border: 1px dashed var(--border-medium); border-radius: var(--radius-md);">
                    <div style="font-size: 28px; margin-bottom: 6px;">💡</div>
                    <div style="font-size: 13.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No Sub-Modules Pinned Yet</div>
                    <div style="font-size: 12px; color: var(--text-muted); max-width: 380px; margin: 0 auto;">Select sub-modules from the catalog below to pin them to your top bar for 1-click access.</div>
                  </div>
                ` : pins.map((p, idx) => {
                  const sub = p.submodule;
                  const isFirst = idx === 0;
                  const isLast = idx === pins.length - 1;
                  return `
                    <div class="manage-pin-item" data-id="${sub.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); transition: all 0.2s;">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="width: 22px; height: 22px; border-radius: 50%; background: rgba(99, 102, 241, 0.12); color: var(--primary-400); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; font-family: var(--font-mono);">
                          ${idx + 1}
                        </span>
                        <span style="font-size: 18px;">${sub.icon}</span>
                        <div>
                          <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${sub.title}</div>
                          <div style="font-size: 11px; color: var(--text-muted);">${sub.group}</div>
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="window.PinnedSubmodulesModule.movePinOrder('${sub.id}', -1)" ${isFirst ? 'disabled' : ''} title="Move Up" style="padding: 4px 8px; font-size: 11px; cursor: ${isFirst ? 'not-allowed' : 'pointer'};">
                          ▲
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="window.PinnedSubmodulesModule.movePinOrder('${sub.id}', 1)" ${isLast ? 'disabled' : ''} title="Move Down" style="padding: 4px 8px; font-size: 11px; cursor: ${isLast ? 'not-allowed' : 'pointer'};">
                          ▼
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.PinnedSubmodulesModule.unpinFromModal('${sub.id}')" title="Unpin" style="padding: 4px 10px; font-size: 12px; color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; background: rgba(239, 68, 68, 0.05); cursor: pointer;">
                          ✕ Unpin
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Add New Pins Catalog Section -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; font-size: 13.5px; font-weight: 700; color: var(--text-primary);">
                  Available Sub-Modules Catalog
                </h4>
                <div style="position: relative; width: 220px;">
                  <input 
                    type="text" 
                    id="manage-pins-search-input" 
                    placeholder="Search sub-modules..." 
                    class="form-control" 
                    style="height: 30px; font-size: 12px; padding: 4px 28px 4px 10px !important; border-radius: var(--radius-sm);"
                    oninput="window.PinnedSubmodulesModule.filterModalCatalog(this.value)"
                  />
                  <span style="position: absolute; right: 8px; top: 6px; font-size: 12px; color: var(--text-muted); pointer-events: none;">🔍</span>
                </div>
              </div>

              ${pins.length >= maxLimit ? `
                <div style="padding: 10px 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-sm); color: #d97706; font-size: 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                  <span>⚠️</span>
                  <span><strong>Maximum ${maxLimit} sub-modules pinned.</strong> Unpin an existing item above to pin another.</span>
                </div>
              ` : ''}

              <div id="manage-pins-catalog-list" style="display: flex; flex-direction: column; gap: 6px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
                ${this.renderModalCatalogItems('')}
              </div>
            </div>
          </div>

          <div class="modal-footer" style="padding: 12px 22px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-primary" onclick="window.PinnedSubmodulesModule.closeManageModal()" style="padding: 8px 20px; font-weight: 600; cursor: pointer;">
              Done
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }

    renderModalCatalogItems(filterText = '') {
      const q = (filterText || '').trim().toLowerCase();
      const pins = this.getUserPins();
      const maxLimit = (window.DB && typeof window.DB.getMaxPinnedSubmodules === 'function')
        ? window.DB.getMaxPinnedSubmodules()
        : 7;
      const isLimitReached = pins.length >= maxLimit;

      const available = this.registry.filter(s => {
        if (!this.canAccessSubmodule(s)) return false;
        if (q && !s.title.toLowerCase().includes(q) && !s.group.toLowerCase().includes(q)) return false;
        return true;
      });

      if (available.length === 0) {
        return `
          <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 12px;">
            No sub-modules found matching &quot;${filterText}&quot;.
          </div>
        `;
      }

      return available.map(sub => {
        const isPinned = pins.some(p => p.submodule_id === sub.id);
        return `
          <div class="manage-catalog-item" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 16px;">${sub.icon}</span>
              <div>
                <span style="font-size: 12.5px; font-weight: 600; color: var(--text-primary);">${sub.title}</span>
                <span style="font-size: 10.5px; color: var(--text-muted); margin-left: 6px; padding: 1px 6px; background: var(--bg-surface-elevated); border-radius: 4px;">${sub.group}</span>
              </div>
            </div>
            <div>
              ${isPinned ? `
                <span style="font-size: 11px; color: var(--primary-400); font-weight: 700; padding: 3px 8px; background: rgba(99, 102, 241, 0.1); border-radius: 4px;">
                  ✓ Pinned
                </span>
              ` : `
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-primary" 
                  onclick="window.PinnedSubmodulesModule.pinFromModal('${sub.id}')"
                  ${isLimitReached ? 'disabled' : ''}
                  style="padding: 3px 10px; font-size: 11.5px; cursor: ${isLimitReached ? 'not-allowed' : 'pointer'}; opacity: ${isLimitReached ? '0.5' : '1'};"
                  title="${isLimitReached ? `Limit of ${maxLimit} reached` : 'Pin to top bar'}"
                >
                  + Pin
                </button>
              `}
            </div>
          </div>
        `;
      }).join('');
    }

    filterModalCatalog(filterText) {
      const container = document.getElementById('manage-pins-catalog-list');
      if (container) {
        container.innerHTML = this.renderModalCatalogItems(filterText);
      }
    }

    pinFromModal(submoduleId) {
      const userId = this.getCurrentUserId();
      const res = window.DB.pinUserSubmodule(userId, submoduleId);

      if (!res.success) {
        if (res.code === 'LIMIT_REACHED') {
          if (window.State && window.State.showToast) {
            window.State.showToast(res.message, 'warning');
          } else {
            alert(res.message);
          }
        }
        return;
      }

      const sub = this.getSubmoduleById(submoduleId);
      if (window.State && window.State.showToast) {
        window.State.showToast(`"${sub ? sub.title : 'Sub-module'}" pinned!`, 'success');
      }

      this.openManageModal(); // Refresh modal view
      this.renderPinnedBar();
      this.attachSidebarPinIcons();
      this.updateScreenHeaderPinButton();
    }

    unpinFromModal(submoduleId) {
      const userId = this.getCurrentUserId();
      window.DB.unpinUserSubmodule(userId, submoduleId);

      const sub = this.getSubmoduleById(submoduleId);
      if (window.State && window.State.showToast) {
        window.State.showToast(`"${sub ? sub.title : 'Sub-module'}" unpinned.`, 'info');
      }

      this.openManageModal(); // Refresh modal view
      this.renderPinnedBar();
      this.attachSidebarPinIcons();
      this.updateScreenHeaderPinButton();
    }

    movePinOrder(submoduleId, direction) {
      const userId = this.getCurrentUserId();
      const pins = this.getUserPins();
      const currentIdx = pins.findIndex(p => p.submodule_id === submoduleId);
      if (currentIdx < 0) return;

      const targetIdx = currentIdx + direction;
      if (targetIdx < 0 || targetIdx >= pins.length) return;

      const orderedIds = pins.map(p => p.submodule_id);
      const temp = orderedIds[currentIdx];
      orderedIds[currentIdx] = orderedIds[targetIdx];
      orderedIds[targetIdx] = temp;

      window.DB.reorderUserPinnedSubmodules(userId, orderedIds);
      this.openManageModal();
      this.renderPinnedBar();
    }

    confirmResetPins() {
      // PIN-FR-42: Reset all pins with confirmation prompt
      const ok = confirm('Are you sure you want to unpin all sub-modules from your top bar?');
      if (!ok) return;

      const userId = this.getCurrentUserId();
      window.DB.resetUserPinnedSubmodules(userId);

      if (window.State && window.State.showToast) {
        window.State.showToast('All pinned sub-modules have been cleared.', 'info');
      }

      this.openManageModal();
      this.renderPinnedBar();
      this.attachSidebarPinIcons();
      this.updateScreenHeaderPinButton();
    }

    closeManageModal() {
      const modal = document.getElementById('manage-pins-modal');
      if (modal) modal.remove();
    }
  }

  // Register Global Singleton Instance
  window.PinnedSubmodulesModule = new PinnedSubmodulesController();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PinnedSubmodulesController, SUBMODULE_REGISTRY };
  }
})();
