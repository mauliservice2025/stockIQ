/* ==========================================================================
   ENTERPRISE ISCM - CORE APPLICATION CONTROLLER & HASH ROUTER
   Coordinates Modules, Multi-Facility Sync, Global Hotkeys & UI Shell
   ========================================================================== */

// Standard Action Button Icons & Helpers matching Enterprise UI specification
window.AppIcons = {
  svgEdit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  svgLock: (isActive = true) => isActive ? `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-warning, #f59e0b);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  ` : `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success, #10b981);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
  `,
  svgDelete: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
  svgView: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,

  configure(onclick, title = 'Configure', extraStyle = '') {
    return `<button class="btn btn-outline btn-sm" title="${title}" onclick="${onclick}" style="padding: 3px 8px; font-size: 11.5px; font-weight: 600; ${extraStyle}">Configure</button>`;
  },
  edit(onclick, title = 'Edit Details', extraStyle = '', extraAttrs = '') {
    return `<button class="btn btn-icon btn-sm" title="${title}" onclick="${onclick}" style="${extraStyle}" ${extraAttrs}>${this.svgEdit}</button>`;
  },
  lock(onclick, isActive = true, titleActive = 'Deactivate / Lock', titleInactive = 'Activate / Unlock', extraStyle = '', extraAttrs = '') {
    return `<button class="btn btn-icon btn-sm" title="${isActive ? titleActive : titleInactive}" onclick="${onclick}" style="${extraStyle}" ${extraAttrs}>${this.svgLock(isActive)}</button>`;
  },
  delete(onclick, title = 'Delete', extraStyle = '', extraAttrs = '') {
    return `<button class="btn btn-icon btn-sm" title="${title}" style="color: var(--color-danger, #ef4444); ${extraStyle}" onclick="${onclick}" ${extraAttrs}>${this.svgDelete}</button>`;
  }
};

class AppController {
  constructor() {
    this.routes = {
      '#/dashboard': { module: window.DashboardModule, title: 'Executive Operations Dashboard', section: 'Overview' },
      '#/purchase-planning': { module: window.PurchasePlanningModule, title: 'Purchase Planning & MRP Replenishment', section: 'Procurement' },
      '#/requisitions': { module: window.RequisitionsModule, title: 'Purchase Requisitions (PR)', section: 'Procurement' },
      '#/orders': { module: window.PurchaseOrdersModule, title: 'Purchase Orders (PO) & Vendor Procurement', section: 'Procurement' },
      '#/grn': { module: window.GoodsReceiptModule, title: 'Goods Receipt Notes (GRN)', section: 'Procurement' },
      '#/quality': { module: window.QualityInspectionModule, title: 'Quality Assurance & Inspection (QA/QC)', section: 'Quality & Storage' },
      '#/putaway': { module: window.PutawayModule, title: 'Warehouse Putaway & Bin Allocation', section: 'Quality & Storage' },
      '#/warehouse-map': { module: window.WarehouseVisualizerModule, title: 'Visual Warehouse Map & Bin Matrix', section: 'Quality & Storage' },
      '#/inventory': { module: window.InventoryModule, title: 'Stock Balances', section: 'Inventory & Logistics' },
      '#/opening-balance': { module: window.OpeningBalanceModule, title: 'Opening Balance Management', section: 'Inventory & Logistics' },
      '#/inventory-opening': { module: window.OpeningBalanceModule, title: 'Inventory Opening Balance', section: 'Inventory & Logistics' },
      '#/opening-balance-config': { module: window.OpeningBalanceModule, title: 'Opening Balance Configuration', section: 'Inventory & Logistics' },
      '#/transfers': { module: window.TransfersModule, title: 'Stock Transfer', section: 'Inventory & Logistics' },
      '#/receive-transfers': { module: window.ReceiveTransfersModule, title: 'Receive Stock Transfer', section: 'Inventory & Logistics' },
      '#/receive-stock-transfer': { module: window.ReceiveTransfersModule, title: 'Receive Stock Transfer', section: 'Inventory & Logistics' },
      '#/production': { module: window.ProductionModule, title: 'Manufacturing Execution & BOM', section: 'Manufacturing' },
      '#/dispatch': { module: window.DispatchModule, title: 'Sales Order Dispatch & Gate Pass', section: 'Outbound' },
      '#/returns': { module: window.ReturnsModule, title: 'Reverse Logistics & Material Returns', section: 'Control & Audit' },
      '#/adjustments': { module: window.AdjustmentsModule, title: 'Physical Stock Counts & Adjustments', section: 'Control & Audit' },
      '#/reports': { module: window.ReportsModule, title: 'Enterprise MIS & Analytical Reports', section: 'Control & Audit' },
      '#/masters': { module: window.OrgLocationModule, title: 'Organization & Facility Setup', section: 'Organization & Facility Setup' },
      '#/audit': { module: window.AuditModule, title: 'Immutable System Audit Trail', section: 'Control & Audit' },

      // =====================================================================
      // ORGANIZATION & FACILITY SETUP MODULE
      // =====================================================================
      '#/org-location': { module: window.OrgLocationModule, title: 'Organization & Facility Setup', section: 'Organization & Facility Setup' },
      '#/organizations': { module: window.OrgLocationModule, title: 'Organization Master', section: 'Organization & Facility Setup' },
      '#/branches': { module: window.OrgLocationModule, title: 'Facility Master', section: 'Organization & Facility Setup' },
      '#/facilities': { module: window.OrgLocationModule, title: 'Facility Master', section: 'Organization & Facility Setup' },
      '#/suppliers': { module: window.MastersModule, title: 'Supplier & Vendor Master', section: 'Procurement' },
      '#/supplier-master': { module: window.MastersModule, title: 'Supplier & Vendor Master', section: 'Procurement' },
      '#/doc-print-config': { module: window.OrgLocationModule, title: 'Document Print Configuration Master', section: 'Organization & Facility Setup' },
      '#/document-print-config': { module: window.OrgLocationModule, title: 'Document Print Configuration Master', section: 'Organization & Facility Setup' },
      '#/document-print-configuration': { module: window.OrgLocationModule, title: 'Document Print Configuration Master', section: 'Organization & Facility Setup' },
      '#/financial-calendar': { module: window.OrgLocationModule, title: 'Financial Calendar Master', section: 'Organization & Facility Setup' },
      '#/doc-series': { module: window.OrgLocationModule, title: 'Document Number Series Master', section: 'Organization & Facility Setup' },
      '#/document-series': { module: window.OrgLocationModule, title: 'Document Number Series Master', section: 'Organization & Facility Setup' },
      '#/holiday-master': { module: window.OrgLocationModule, title: 'Holiday Master', section: 'Organization & Facility Setup' },
      '#/holidays': { module: window.OrgLocationModule, title: 'Holiday Master', section: 'Organization & Facility Setup' },
      '#/registration-config': { module: window.OrgLocationModule, title: 'Registration Configuration Master', section: 'Organization & Facility Setup' },
      '#/registration-configuration': { module: window.OrgLocationModule, title: 'Registration Configuration Master', section: 'Organization & Facility Setup' },
      '#/stores': { module: window.StoreInventoryModule, title: 'Store Master', section: 'Store Master Setup' },
      '#/storage-locations': { module: window.StoreInventoryModule, title: 'Storage Location Master', section: 'Store Master Setup' },
      '#/racks': { module: window.StoreInventoryModule, title: 'Rack Master', section: 'Store Master Setup' },
      '#/shelves': { module: window.StoreInventoryModule, title: 'Shelf Master', section: 'Store Master Setup' },
      '#/bins': { module: window.StoreInventoryModule, title: 'Bin Master', section: 'Store Master Setup' },

      // Address Master (Consolidated Master containing 5 Tabs: Country, State, District, City, Pin Code)
      '#/address-master': { module: window.CommonMasterModule, title: 'Address Master', section: 'Organization & Facility Setup' },
      '#/common-master': { module: window.CommonLookupMasterModule, title: 'Common Master', section: 'Organization & Facility Setup' },
      '#/tax-master': { module: window.TaxMasterModule, title: 'Tax Master', section: 'Organization & Facility Setup' },
      '#/common-masters-2': { module: window.CommonMasterModule, title: 'Address Master', section: 'Organization & Facility Setup' },
      '#/countries': { module: window.CommonMasterModule, title: 'Country Master', section: 'Organization & Facility Setup', subSection: 'Address Master' },
      '#/states': { module: window.CommonMasterModule, title: 'State Master', section: 'Organization & Facility Setup', subSection: 'Address Master' },
      '#/districts': { module: window.CommonMasterModule, title: 'District Master', section: 'Organization & Facility Setup', subSection: 'Address Master' },
      '#/cities': { module: window.CommonMasterModule, title: 'City Master', section: 'Organization & Facility Setup', subSection: 'Address Master' },
      '#/pincodes': { module: window.CommonMasterModule, title: 'Pin Code Master', section: 'Organization & Facility Setup', subSection: 'Address Master' },

      // Store Master Setup Suite (BRD Compliant)
      '#/store-master-setup': { module: window.StoreInventoryModule, title: 'Store Master Setup', section: 'Store Master Setup' },
      '#/store-inventory': { module: window.StoreInventoryModule, title: 'Store Master Setup', section: 'Store Master Setup' },
      '#/store-master': { module: window.StoreInventoryModule, title: 'Store Master', section: 'Store Master Setup' },

      // Billing & Workshop Suite (Two-Wheeler Garage / Service Center Flow)
      '#/billing': { module: window.BillingModule, title: 'Billing Dashboard', section: 'Billing' },
      '#/billing-dashboard': { module: window.BillingModule, title: 'Billing Dashboard', section: 'Billing' },
      '#/job-cards': { module: window.BillingModule, title: 'Job Card', section: 'Billing', subSection: 'Workshop' },
      '#/job-card-parts': { module: window.BillingModule, title: 'Job Card', section: 'Billing', subSection: 'Workshop' },
      '#/billing-estimates': { module: window.BillingModule, title: 'Estimate', section: 'Billing', subSection: 'Estimate' },
      '#/draft-bills': { module: window.BillingModule, title: 'Draft Bills & Review', section: 'Billing', subSection: 'Draft Bills' },
      '#/final-bills': { module: window.BillingModule, title: 'Bill List & GST Invoices', section: 'Billing', subSection: 'Bill List' },
      '#/bill-list': { module: window.BillingModule, title: 'Bill List & GST Invoices', section: 'Billing', subSection: 'Bill List' },
      '#/customer-billing': { module: window.BillingModule, title: 'Customer Billing (Draft & Final)', section: 'Billing', subSection: 'Customer Billing' },
      '#/vehicle-delivery': { module: window.BillingModule, title: 'Vehicle Delivery & Gate Pass', section: 'Billing', subSection: 'Vehicle Delivery' },

      // Consolidated MIS Reports Module (12 Comprehensive Workshop & Billing Reports)
      '#/mis-reports': { module: window.MisReportsModule, title: 'Consolidated MIS Reports', section: 'MIS Reports' },

      // Customer Relationship Management (CRM) - Two-Wheeler Service Reminders
      '#/customer-reminders': { module: window.CustomerRemindersModule, title: 'Service Reminder Dashboard', section: 'Customer Relationship (CRM)' },
      '#/reminder-dashboard': { module: window.CustomerRemindersModule, title: 'Service Reminder Dashboard', section: 'Customer Relationship (CRM)' },
      '#/reminder-configuration': { module: window.CustomerRemindersModule, title: 'Reminder Configuration', section: 'Customer Relationship (CRM)' },
      '#/reminder-processing': { module: window.CustomerRemindersModule, title: 'Reminder Processing', section: 'Customer Relationship (CRM)' },
      '#/reminder-history': { module: window.CustomerRemindersModule, title: 'Reminder History', section: 'Customer Relationship (CRM)' },
      '#/reminder-reports': { module: window.CustomerRemindersModule, title: 'Reminder Reports', section: 'Customer Relationship (CRM)' },
      '#/message-templates': { module: window.CustomerRemindersModule, title: 'Message Template Master', section: 'Customer Relationship (CRM)' },

      // Item Master Setup Suite
      '#/item-dashboard': { module: window.StoreInventoryModule, title: 'Item Master Dashboard', section: 'Item Master Setup' },
      '#/item-master-dashboard': { module: window.StoreInventoryModule, title: 'Item Master Dashboard', section: 'Item Master Setup' },
      '#/item-master-setup': { module: window.StoreInventoryModule, title: 'Item Master Setup', section: 'Item Master Setup' },
      '#/item-master': { module: window.StoreInventoryModule, title: 'Item Master (Two-Wheeler Spare Parts & Materials)', section: 'Item Master Setup' },
      '#/service-master': { module: window.StoreInventoryModule, title: 'Service Master (Labour & Workshop Services)', section: 'Item Master Setup' },
      '#/item-categories': { module: window.StoreInventoryModule, title: 'Item Category & Sub-Category Master', section: 'Item Master Setup' },
      '#/item-subcategories': { module: window.StoreInventoryModule, title: 'Item Category & Sub-Category Master', section: 'Item Master Setup' },
      '#/item-brands': { module: window.StoreInventoryModule, title: 'Brand Master', section: 'Item Master Setup' },
      '#/item-manufacturers': { module: window.StoreInventoryModule, title: 'Manufacturer Master', section: 'Item Master Setup' },
      '#/vehicle-compatibility': { module: window.StoreInventoryModule, title: 'Vehicle Model Compatibility Master', section: 'Item Master Setup' },
      '#/uom-master': { module: window.StoreInventoryModule, title: 'UOM Master (Unit of Measurement & Conversions)', section: 'Item Master Setup' },
      '#/hsn-master': { module: window.StoreInventoryModule, title: 'HSN / SAC & Tax Code Master', section: 'Item Master Setup' },
      '#/store-transactions': { module: window.StoreInventoryModule, title: 'Store Master & Inventory Management', section: 'Store Master Setup' },
      '#/store-mapping': { module: window.StoreInventoryModule, title: 'Category & Store Item Mapping', section: 'Store Master Setup' },
      '#/stock-transfers': { module: window.TransfersModule, title: 'Stock Transfer', section: 'Inventory & Logistics' },
      '#/stock-counts': { module: window.StoreInventoryModule, title: 'Physical Stock Count & Adjustments', section: 'Item Master Setup' },
      '#/warranty-scrap': { module: window.StoreInventoryModule, title: 'Warranty & Scrap Stores Management', section: 'Item Master Setup' },
      '#/inventory-rules': { module: window.StoreInventoryModule, title: 'Inventory Policy Rules & Access Matrix', section: 'Item Master Setup' },
      '#/stock-ledger': { module: window.StoreInventoryModule, title: 'Live Stock Valuation & Audit Ledger', section: 'Item Master Setup' },

      // User Roles & Security Suite (17 Sub-Modules conforming to BRD)
      '#/security-dashboard': { module: window.UserManagementModule, title: 'Security & RBAC Overview Dashboard', section: 'User Roles & Security' },
      '#/users': { module: window.UserManagementModule, title: 'User Master', section: 'User Roles & Security' },
      '#/user-access-control': { module: window.UserManagementModule, title: 'User Access Control & Status Governance', section: 'User Roles & Security' },
      '#/roles': { module: window.UserManagementModule, title: 'Role Master Definition', section: 'User Roles & Security' },
      '#/permissions': { module: window.UserManagementModule, title: 'Permission Master', section: 'User Roles & Security' },
      '#/role-permissions': { module: window.UserManagementModule, title: 'Role-Permission Mapping Matrix', section: 'User Roles & Security' },
      '#/user-roles': { module: window.UserManagementModule, title: 'User-Role Assignment & Hierarchy Mapping', section: 'User Roles & Security' },
      '#/sod-rules': { module: window.UserManagementModule, title: 'Segregation of Duties (SoD) Rules & Conflicts', section: 'User Roles & Security' },
      '#/approval-authorities': { module: window.UserManagementModule, title: 'Approval Authorities & Tiered Value Limits', section: 'User Roles & Security' },
      '#/delegations': { module: window.UserManagementModule, title: 'Approval Delegations & Temporary Access', section: 'User Roles & Security' },
      '#/access-requests': { module: window.UserManagementModule, title: 'User Access Request Workflow', section: 'User Roles & Security' },
      '#/password-policy': { module: window.UserManagementModule, title: 'Password Expiry & Policy Settings', section: 'User Roles & Security' },
      '#/login-security': { module: window.UserManagementModule, title: 'Login Security & Lockout Rules', section: 'User Roles & Security' },
      '#/sessions': { module: window.UserManagementModule, title: 'Active User Session Management', section: 'User Roles & Security' },
      '#/login-history': { module: window.UserManagementModule, title: 'User Authentication & Login History', section: 'User Roles & Security' },
      '#/access-reports': { module: window.UserManagementModule, title: 'Periodic Access Review & MIS Reports', section: 'User Roles & Security' },
      '#/user-activity': { module: window.UserManagementModule, title: 'User Activity & RBAC Audit Trail', section: 'User Roles & Security' },
      '#/login': { module: window.AuthModule, title: 'Portal Sign In', section: 'Authentication' }
    };

    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a.nav-item, a.sub-nav-item');
      if (link) {
        const href = link.getAttribute('href');
        if (window.BillingModule && href && !href.includes('billing-estimates')) {
          window.BillingModule._explicitNavigationContext = false;
        }
        if (href && href.startsWith('#/') && href === window.location.hash) {
          e.preventDefault();
          this.handleRoute();
        }
      }
    });
    window.addEventListener('DOMContentLoaded', () => {
      this.initTheme();
      this.initFacilityDropdowns();
      this.initPersonaDropdown();
      this.updateHeaderProfileInfo();
      this.initSidebar();
      this.setupShortcuts();
      if (window.PinnedSubmodulesModule && typeof window.PinnedSubmodulesModule.init === 'function') {
        window.PinnedSubmodulesModule.init();
      }
      this.handleRoute();
    });

    if (document.readyState !== 'loading') {
      this.initSidebar();
      this.initTheme();
      this.initPersonaDropdown();
      this.updateHeaderProfileInfo();
      if (window.PinnedSubmodulesModule && typeof window.PinnedSubmodulesModule.init === 'function') {
        window.PinnedSubmodulesModule.init();
      }
    }

    // Reactive listener on state change
    window.State.subscribe(() => {
      this.updateFacilityPills();
      this.initPersonaDropdown();
      this.updateHeaderProfileInfo();
      this.filterSidebarByPermissions();
    });

    window.addEventListener('iscm:login', () => {
      this.updateHeaderProfileInfo();
      this.filterSidebarByPermissions();
      this.handleRoute();
    });

    window.addEventListener('iscm:user-simulated', () => {
      this.initPersonaDropdown();
      this.updateHeaderProfileInfo();
      this.filterSidebarByPermissions();
      this.handleRoute();
    });

    // Re-render current route when DB state changes
    window.DB.subscribe('*', (collection) => {
      // User preference / toggle updates should NEVER destroy active UI or close open modals
      if (collection === 'userFavouriteVehicles' || collection === 'userPinnedSubmodules') {
        return;
      }
      // Never destroy active modal on generic background changes
      const overlay = document.getElementById('global-modal-overlay');
      if (overlay && overlay.classList.contains('active')) {
        return;
      }
      this.initFacilityDropdowns();
      this.initPersonaDropdown();
      this.updateHeaderProfileInfo();
      this.filterSidebarByPermissions();
      this.handleRoute(false);
    });

    window.DB.subscribe('role_permissions', () => {
      this.filterSidebarByPermissions();
    });

    window.DB.subscribe('roles', () => {
      this.filterSidebarByPermissions();
    });

    window.DB.subscribe('plants', () => {
      this.initFacilityDropdowns();
      this.renderProfileFacilityList();
      this.updateFacilityPills();
    });

    // Global mobile number 10-digit enforcer
    this.initMobileNumberEnforcer();
  }

  initMobileNumberEnforcer() {
    const isMobileField = (el) => {
      if (!el || el.tagName !== 'INPUT') return false;
      const type = (el.type || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const name = (el.name || '').toLowerCase();
      const placeholder = (el.placeholder || '').toLowerCase();
      const cls = (el.className || '').toLowerCase();

      // Exclude generic search bars
      if (id.includes('search') || name.includes('search')) return false;

      return type === 'tel' ||
        id.includes('mobile') ||
        id.includes('phone') ||
        name.includes('mobile') ||
        name.includes('phone') ||
        placeholder.includes('mobile') ||
        cls.includes('mobile-input');
    };

    // 1. Block non-numeric keystrokes in any mobile/phone input
    document.addEventListener('keydown', (e) => {
      const target = e.target;
      if (!isMobileField(target)) return;

      const allowedKeys = ['Backspace', 'Tab', 'Enter', 'Escape', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        return;
      }

      const selStart = target.selectionStart ?? target.value.length;
      const selEnd = target.selectionEnd ?? target.value.length;
      const selectedChars = selEnd - selStart;
      const digitsOnly = target.value.replace(/\D/g, '');

      if (digitsOnly.length >= 10 && selectedChars === 0) {
        e.preventDefault();
      }
    }, true);

    // 2. Enforce 10 digits on input event (handles virtual keyboards, autofill, etc.)
    document.addEventListener('input', (e) => {
      const target = e.target;
      if (!isMobileField(target)) return;

      target.maxLength = 10;
      target.pattern = '[0-9]{10}';
      
      const cleanDigits = target.value.replace(/\D/g, '').slice(0, 10);
      if (target.value !== cleanDigits) {
        target.value = cleanDigits;
      }
    }, true);

    // 3. Paste event sanitization
    document.addEventListener('paste', (e) => {
      const target = e.target;
      if (!isMobileField(target)) return;

      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      const cleanDigits = pasted.replace(/\D/g, '');

      const selStart = target.selectionStart ?? target.value.length;
      const selEnd = target.selectionEnd ?? target.value.length;

      const current = target.value;
      const before = current.substring(0, selStart);
      const after = current.substring(selEnd);

      const combined = (before + cleanDigits + after).replace(/\D/g, '').slice(0, 10);
      target.value = combined;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }, true);
  }

  initSidebar() {
    const isPinned = localStorage.getItem('STOCKIQ_SIDEBAR_PINNED') === 'true';
    const sidebar = document.getElementById('app-sidebar');
    const pinBtn = document.getElementById('sidebar-pin-btn');
    if (sidebar) {
      if (isPinned) {
        sidebar.classList.add('pinned');
        sidebar.classList.remove('collapsed');
      } else {
        sidebar.classList.remove('pinned');
        sidebar.classList.add('collapsed');
      }
    }
    this.filterSidebarByPermissions();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('STOCKIQ_THEME') || 'dark';
    this.setThemeMode(savedTheme, false);

    // Listen to OS theme changes if user selects system mode
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const currentTheme = localStorage.getItem('STOCKIQ_THEME');
        if (currentTheme === 'system') {
          this.setThemeMode('system', false);
        }
      });
    }
  }

  setThemeMode(mode, notify = true) {
    if (!['dark', 'light', 'system'].includes(mode)) {
      mode = 'dark';
    }

    localStorage.setItem('STOCKIQ_THEME', mode);
    document.documentElement.setAttribute('data-theme', mode);

    // Update single theme toggle button
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const toggleIcon = document.getElementById('theme-toggle-icon');
    const toggleText = document.getElementById('theme-toggle-text');
    if (toggleIcon) {
      toggleIcon.innerText = mode === 'light' ? '☀️' : '🌙';
    }
    if (toggleText) {
      toggleText.innerText = mode === 'light' ? 'Light' : 'Dark';
    }
    if (toggleBtn) {
      toggleBtn.setAttribute('title', mode === 'light' ? 'Switch to Dark Mode (Alt+T)' : 'Switch to Light Mode (Alt+T)');
      toggleBtn.setAttribute('data-theme', mode);
    }

    // Update header dropdown select and leading icon (if present)
    const themeSelect = document.getElementById('global-theme-select');
    if (themeSelect && themeSelect.value !== mode) {
      themeSelect.value = mode;
    }

    const themeIcon = document.getElementById('theme-select-icon');
    if (themeIcon) {
      const iconMap = { dark: '🌙', light: '☀️', system: '💻' };
      themeIcon.innerText = iconMap[mode] || '🌙';
    }

    // Update active state on header segmented buttons (if present)
    const headerBtns = document.querySelectorAll('.theme-btn');
    headerBtns.forEach(btn => {
      const btnMode = btn.getAttribute('data-theme-mode');
      if (btnMode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active state on profile dropdown options
    const effectiveTheme = (mode === 'system')
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : mode;

    ['dark', 'light'].forEach(m => {
      const opt = document.getElementById(`profile-opt-${m}`);
      if (opt) {
        opt.classList.toggle('active', m === effectiveTheme);
      }
    });

    const sysOpt = document.getElementById('profile-opt-system');
    if (sysOpt) {
      sysOpt.classList.toggle('active', mode === 'system');
    }

    // Update profile badge text if present
    const badge = document.getElementById('profile-theme-current-badge');
    if (badge) {
      badge.innerText = mode === 'system' ? 'Auto (System)' : mode;
    }

    if (notify && window.State && window.State.showToast) {
      const labels = {
        dark: '🌙 Dark Mode activated',
        light: '☀️ Light Mode activated',
        system: '💻 Theme synchronized with System'
      };
      window.State.showToast(labels[mode] || 'Theme updated', 'info');
    }

    // Trigger custom event in case modules need to re-render charts or visualizers
    window.dispatchEvent(new CustomEvent('iscm:theme-changed', { detail: { theme: mode } }));
  }

  toggleTheme() {
    const current = localStorage.getItem('STOCKIQ_THEME') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this.setThemeMode(next, true);
  }

  toggleSidebarPin() {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;
    const isCurrentlyPinned = sidebar.classList.contains('pinned');
    const isPinned = !isCurrentlyPinned;

    if (isPinned) {
      sidebar.classList.add('pinned');
      sidebar.classList.remove('collapsed');
    } else {
      sidebar.classList.remove('pinned');
      sidebar.classList.add('collapsed');
    }
    localStorage.setItem('STOCKIQ_SIDEBAR_PINNED', isPinned ? 'true' : 'false');

    const pinBtn = document.getElementById('sidebar-pin-btn');
    if (pinBtn) {
      pinBtn.classList.toggle('pinned', isPinned);
    }
    if (window.State && window.State.showToast) {
      window.State.showToast(isPinned ? 'Sidebar pinned (fixed open)' : 'Sidebar unpinned (works on mouse cursor)', 'info');
    }
  }

  toggleModuleGroup(headerEl) {
    const group = headerEl && headerEl.closest ? headerEl.closest('.module-group') : (typeof headerEl === 'string' ? document.getElementById(headerEl) : null);
    if (!group) return;
    if ((group.style && group.style.display === 'none') || (group.getAttribute && group.getAttribute('data-rbac-hidden') === 'true')) return;

    const isAlreadyOpen = group.classList.contains('open');

    // Accordion behavior: only one module can be expanded at a time
    document.querySelectorAll('.module-group').forEach(otherGroup => {
      otherGroup.classList.remove('open');
    });

    // Expand clicked module if it was closed; collapse if it was already open
    if (!isAlreadyOpen) {
      group.classList.add('open');
    }
  }

  toggleSubModuleGroup(headerEl, evt) {
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
    }
    const group = headerEl && headerEl.closest ? headerEl.closest('.sub-module-group') : (typeof headerEl === 'string' ? document.getElementById(headerEl) : null);
    if (!group) return;
    if ((group.style && group.style.display === 'none') || (group.getAttribute && group.getAttribute('data-rbac-hidden') === 'true')) return;
    group.classList.toggle('open');
  }

  initFacilityDropdowns() {
    const plants = (window.DB && typeof window.DB.getActivePlants === 'function') 
      ? window.DB.getActivePlants() 
      : ((window.DB && window.DB.getAll('plants')) || []);

    if (window.State && window.State.currentPlantId && window.State.currentPlantId !== 'ALL') {
      if (window.DB && typeof window.DB.isPlantActive === 'function' && !window.DB.isPlantActive(window.State.currentPlantId)) {
        const fallback = plants.length > 0 ? plants[0].id : 'ALL';
        window.State.setPlant(fallback);
      }
    }

    const currentPlantId = window.State.currentPlantId;
    const select = document.getElementById('global-facility-select');
    if (select) {
      select.innerHTML = `
        <option value="ALL">All Facilities (Consolidated)</option>
        ${plants.map(p => `<option value="${p.id}" ${p.id === currentPlantId ? 'selected' : ''}>${p.name}</option>`).join('')}
      `;
      select.value = currentPlantId;
    }

    this.renderProfileFacilityList();
    this.updateFacilityPills();
  }

  initPersonaDropdown() {
    const select = document.getElementById('global-persona-select');
    if (!select || !window.DB) return;

    const users = window.DB.getAll('users') || [];
    const roles = window.DB.getAll('roles') || [];
    const currentUser = window.State.getCurrentUser();

    select.innerHTML = users.map(u => {
      const roleObj = roles.find(r => r.id === u.primary_role) || { name: u.primary_role };
      const statusIcon = u.status === 'ACTIVE' ? '●' : (u.status === 'LOCKED' ? '🔒' : (u.status === 'SUSPENDED' ? '⛔' : '○'));
      return `
        <option value="${u.id}" ${u.id === (currentUser ? currentUser.id : '') ? 'selected' : ''}>
          ${statusIcon} ${u.full_name} (${roleObj.name || u.primary_role}) - ${u.status}
        </option>
      `;
    }).join('');

    this.updateHeaderProfileInfo();
  }

  updateHeaderProfileInfo() {
    const user = window.State ? window.State.getCurrentUser() : null;
    if (!user || !window.DB) return;
    const roles = window.DB.getAll('roles') || [];
    const roleObj = roles.find(r => r.id === user.primary_role) || { name: user.primary_role };
    const displayName = user.full_name || user.display_name || user.username || 'User';
    const roleTitle = roleObj.name || user.designation || user.primary_role || 'Operator';
    const initials = displayName.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'U';

    const avatarEl = document.getElementById('header-user-avatar') || document.querySelector('.user-avatar');
    if (avatarEl) avatarEl.innerText = initials;
    const nameEl = document.getElementById('header-user-profile-name') || document.querySelector('.user-profile-name');
    if (nameEl) nameEl.innerText = displayName;
    const roleEl = document.getElementById('header-user-profile-role') || document.querySelector('.user-profile-role');
    if (roleEl) roleEl.innerText = roleTitle;

    const flyAvatar = document.getElementById('profile-dropdown-avatar') || document.querySelector('.profile-dropdown-avatar');
    if (flyAvatar) flyAvatar.innerText = initials;
    const flyName = document.getElementById('profile-dropdown-name') || document.querySelector('.profile-dropdown-name');
    if (flyName) flyName.innerText = displayName;
    const flyEmail = document.getElementById('profile-dropdown-email') || document.querySelector('.profile-dropdown-email');
    if (flyEmail) flyEmail.innerText = user.email || `${user.username.toLowerCase()}@stockiq.com`;
    const flyBadge = document.getElementById('profile-dropdown-badge') || document.querySelector('.profile-dropdown-badge');
    if (flyBadge) flyBadge.remove();

    const dropRole = document.getElementById('profile-dropdown-role');
    if (dropRole) dropRole.innerText = roleTitle;
    const dropEmpId = document.getElementById('profile-dropdown-empid');
    if (dropEmpId) dropEmpId.innerText = user.employee_id || user.id || '--';
    const dropDept = document.getElementById('profile-dropdown-dept');
    if (dropDept) dropDept.innerText = user.department || user.designation || 'Store & Inventory Master';
    const dropPlant = document.getElementById('profile-dropdown-plant');
    if (dropPlant && window.State && typeof window.State.getCurrentPlant === 'function') {
      const p = window.State.getCurrentPlant();
      dropPlant.innerText = p ? p.name : 'All Facilities (Consolidated)';
    }
  }

  switchFacility(plantId) {
    window.State.setPlant(plantId);
    
    // Sync global header dropdown
    const select = document.getElementById('global-facility-select');
    if (select && select.value !== plantId) select.value = plantId;

    // Sync profile dropdown
    const profSelect = document.getElementById('profile-facility-select');
    if (profSelect && profSelect.value !== plantId) profSelect.value = plantId;

    const plant = window.State.getCurrentPlant();
    const plantName = plantId === 'ALL' ? 'All Facilities (Consolidated)' : (plant.name || plant.code || plantId);
    window.State.showToast(`Active working facility switched to: ${plantName}`, 'success');

    this.updateFacilityPills();
    this.handleRoute();

    // Close user profile dropdown after switching
    const dropdown = document.getElementById('user-profile-dropdown');
    const btn = document.getElementById('user-profile-trigger-btn');
    if (dropdown) dropdown.classList.remove('active');
    if (btn) btn.classList.remove('active');
  }

  renderProfileFacilityList() {
    const container = document.getElementById('profile-facility-list');
    if (!container) return;

    const plants = (window.DB && typeof window.DB.getActivePlants === 'function')
      ? window.DB.getActivePlants()
      : ((window.DB && window.DB.getAll('plants')) || []);
    const currentPlantId = window.State.currentPlantId;

    const allOptions = [
      {
        id: 'ALL',
        name: 'All Facilities (Consolidated)',
        code: 'CORP-OVERVIEW',
        location: 'Consolidated Enterprise View'
      },
      ...plants.map(p => ({
        id: p.id,
        name: p.name,
        code: p.branch_code || (p.code ? p.code.replace('BRANCH-', '') : (p.city || 'PUN').substring(0, 3)).toUpperCase(),
        location: `${p.city || ''}, ${p.state || ''}`.replace(/^, |, $/g, '') || 'Facility Workshop'
      }))
    ];

    const activeObj = allOptions.find(f => f.id === currentPlantId) || allOptions[0];

    container.innerHTML = `
      <div class="profile-facility-dropdown-wrapper">
        <select 
          id="profile-facility-select" 
          class="form-control profile-facility-select" 
          onchange="window.App.switchFacility(this.value)"
          title="Select Working Facility"
        >
          ${allOptions.map(fac => `<option value="${fac.id}" ${fac.id === currentPlantId ? 'selected' : ''}>${fac.name}</option>`).join('')}
        </select>
      </div>
    `;

    // Update active badge tag if present
    const tag = document.getElementById('profile-active-plant-tag');
    if (tag) {
      tag.style.display = 'none';
    }
  }

  updateFacilityPills() {
    const plant = window.State.getCurrentPlant();
    const currentPlantId = window.State.currentPlantId;

    const pill = document.getElementById('sidebar-facility-pill-name');
    if (pill) {
      pill.innerText = plant.name || 'Consolidated Facilities';
    }
    const dropPlant = document.getElementById('profile-dropdown-plant');
    if (dropPlant) {
      dropPlant.innerText = plant.name || 'All Facilities (Consolidated)';
    }

    // Keep global header dropdown in sync
    const headerSelect = document.getElementById('global-facility-select');
    if (headerSelect && headerSelect.value !== currentPlantId) {
      headerSelect.value = currentPlantId;
    }

    // Keep profile dropdown in sync
    const profileSelect = document.getElementById('profile-facility-select');
    if (profileSelect && profileSelect.value !== currentPlantId) {
      profileSelect.value = currentPlantId;
    }

    this.renderProfileFacilityList();
  }

  getRequiredPermCode(hash) {
    const moduleCodeMap = {
      '#/dashboard': 'DASHBOARD',
      '#/purchase-planning': 'PLANNING',
      '#/planning': 'PLANNING',
      '#/requisitions': 'REQUISITIONS',
      '#/orders': 'ORDERS',
      '#/grn': 'GRN',
      '#/quality': 'QUALITY',
      '#/putaway': 'PUTAWAY',
      '#/warehouse-map': 'WAREHOUSE_MAP',
      '#/warehouse': 'WAREHOUSE_MAP',
      '#/inventory': 'INVENTORY',
      '#/opening-balance': 'OPENING_BALANCE',
      '#/inventory-opening': 'OPENING_BALANCE',
      '#/opening-balance-config': 'OPENING_BALANCE',
      '#/transfers': 'TRANSFERS',
      '#/receive-transfers': 'RECEIVE_TRANSFERS',
      '#/receive-stock-transfer': 'RECEIVE_TRANSFERS',
      '#/production': 'PRODUCTION',
      '#/dispatch': 'DISPATCH',
      '#/returns': 'RETURNS',
      '#/adjustments': 'ADJUSTMENTS',
      '#/reports': 'REPORTS',
      '#/masters': 'MASTERS',
      '#/audit': 'AUDIT',

      // Common Master & Tax Master Suite
      '#/common-master': 'COMMON_MASTER',
      '#/tax-master': 'TAX_MASTER',
      '#/address-master': 'COMMON_MASTER',
      '#/common-masters-2': 'COMMON_MASTER',
      '#/countries': 'COMMON_MASTER',
      '#/states': 'COMMON_MASTER',
      '#/districts': 'COMMON_MASTER',
      '#/cities': 'COMMON_MASTER',
      '#/pincodes': 'COMMON_MASTER',

      // Organization & Location Management Suite (7 Masters)
      '#/org-location': 'ORG_MASTER',
      '#/organizations': 'ORG_MASTER',
      '#/branches': 'BRANCH_MASTER',
      '#/facilities': 'BRANCH_MASTER',
      '#/suppliers': 'SUPPLIER_MASTER',
      '#/supplier-master': 'SUPPLIER_MASTER',
      '#/doc-print-config': 'DOC_PRINT_CONFIG_MASTER',
      '#/document-print-config': 'DOC_PRINT_CONFIG_MASTER',
      '#/document-print-configuration': 'DOC_PRINT_CONFIG_MASTER',
      '#/financial-calendar': 'FINANCIAL_CALENDAR_MASTER',
      '#/doc-series': 'DOC_SERIES_MASTER',
      '#/document-series': 'DOC_SERIES_MASTER',
      '#/holiday-master': 'HOLIDAY_MASTER',
      '#/holidays': 'HOLIDAY_MASTER',
      '#/registration-config': 'CONFIG_REGISTRATION',
      '#/registration-configuration': 'CONFIG_REGISTRATION',
      '#/stores': 'STORE_MASTER',
      '#/storage-locations': 'LOC_MASTER',
      '#/racks': 'RACK_MASTER',
      '#/shelves': 'SHELF_MASTER',
      '#/bins': 'BIN_MASTER',

      // Billing & Workshop Suite (BRD Two-Wheeler Garage Flow)
      '#/billing': 'BILLING_DASHBOARD',
      '#/billing-dashboard': 'BILLING_DASHBOARD',
      '#/job-cards': 'STORE_TX_JOB_CARD_ISSUE',
      '#/job-card-parts': 'STORE_TX_JOB_CARD_ISSUE',
      '#/billing-estimates': 'BILLING_ESTIMATES',
      '#/draft-bills': 'DRAFT_BILLS',
      '#/final-bills': 'FINAL_BILLS',
      '#/bill-list': 'FINAL_BILLS',
      '#/customer-billing': 'CUSTOMER_BILLING',
      '#/vehicle-delivery': 'VEHICLE_DELIVERY',

      // Consolidated MIS Reports Module (12 Comprehensive Workshop & Billing Reports)
      '#/mis-reports': 'REPORTS',

      // Customer Relationship Management (CRM)
      '#/customer-reminders': 'CUSTOMER_REMINDERS',
      '#/reminder-dashboard': 'REMINDER_DASHBOARD',
      '#/reminder-configuration': 'REMINDER_CONFIG',
      '#/reminder-processing': 'REMINDER_PROCESS',
      '#/reminder-history': 'REMINDER_HISTORY',
      '#/reminder-reports': 'REMINDER_REPORTS',
      '#/message-templates': 'REMINDER_TEMPLATES',

      // Store Master Setup & Item Master Setup Suite (BRD Compliant)
      '#/store-master-setup': 'STORE_MASTER',
      '#/item-dashboard': 'STORE_MASTER',
      '#/item-master-dashboard': 'STORE_MASTER',
      '#/item-master-setup': 'STORE_MASTER',
      '#/store-inventory': 'STORE_MASTER',
      '#/store-master': 'STORE_MASTER',
      '#/item-master': 'STORE_MASTER',
      '#/service-master': 'STORE_MASTER',
      '#/item-categories': 'STORE_MASTER',
      '#/item-subcategories': 'STORE_MASTER',
      '#/item-brands': 'STORE_MASTER',
      '#/item-manufacturers': 'STORE_MASTER',
      '#/uom-master': 'STORE_MASTER',
      '#/hsn-master': 'STORE_MASTER',
      '#/store-transactions': 'STORE_MASTER',
      '#/store-mapping': 'STORE_CATEGORY_MAP',
      '#/vehicle-compatibility': 'STORE_VEHICLE_COMPAT',
      '#/job-card-parts': 'STORE_TX_JOB_CARD_ISSUE',
      '#/stock-transfers': 'TRANSFERS',
      '#/stock-counts': 'STORE_TX_PHYSICAL_COUNT',
      '#/warranty-scrap': 'STORE_TX_WARRANTY_RETURN',
      '#/inventory-rules': 'STORE_INVENTORY_RULES',
      '#/stock-ledger': 'STORE_STOCK_LEDGER',

      // User Roles & RBAC Security Suite (17 Sub-Modules conforming to BRD)
      '#/security-dashboard': 'SEC_DASHBOARD',
      '#/users': 'USER_MASTER',
      '#/user-access-control': 'USER_ACCESS',
      '#/roles': 'ROLE_MASTER',
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
    };

    return moduleCodeMap[hash] || null;
  }

  canAccessRoute(routeHash) {
    if (!routeHash) return true;
    const hash = routeHash.split('?')[0];
    if (hash === '#/login') return true;

    if (hash === '#/mis-reports') {
      if (!window.State || typeof window.State.hasPermission !== 'function') return true;
      return window.State.hasPermission('REPORTS', 'VIEW') ||
             window.State.hasPermission('FINAL_BILLS', 'VIEW') ||
             window.State.hasPermission('BILLING_DASHBOARD', 'VIEW') ||
             window.State.hasPermission('CUSTOMER_BILLING', 'VIEW');
    }

    const permCode = this.getRequiredPermCode(hash);
    if (!permCode) {
      return true;
    }

    if (!window.State || typeof window.State.hasPermission !== 'function') {
      return true;
    }

    return window.State.hasPermission(permCode, 'VIEW');
  }

  getFirstAuthorizedRoute() {
    const preferred = [
      '#/billing-dashboard',
      '#/job-cards',
      '#/billing-estimates',
      '#/customer-billing',
      '#/final-bills',
      '#/vehicle-delivery',
      '#/store-inventory',
      '#/dashboard',
      '#/job-card-parts',
      '#/stock-counts',
      '#/warranty-scrap',
      '#/inventory-rules',
      '#/stock-ledger',
      '#/grn',
      '#/putaway',
      '#/inventory',
      '#/transfers',
      '#/receive-transfers',
      '#/returns',
      '#/adjustments',
      '#/orders',
      '#/requisitions',
      '#/quality',
      '#/production',
      '#/dispatch',
      '#/reports',
      '#/common-master',
      '#/store-master',
      '#/organizations',
      '#/security-dashboard'
    ];

    for (const r of preferred) {
      if (this.canAccessRoute(r)) return r;
    }

    for (const r of Object.keys(this.routes)) {
      if (r !== '#/login' && this.canAccessRoute(r)) return r;
    }

    return '#/store-inventory';
  }

  navigateToFirstAuthorizedRoute() {
    const target = this.getFirstAuthorizedRoute();
    if (window.location.hash === target) {
      if (!this._navigatingToAuth) {
        this._navigatingToAuth = true;
        try {
          this.handleRoute();
        } finally {
          this._navigatingToAuth = false;
        }
      }
    } else {
      window.location.hash = target;
    }
  }

  filterSidebarByPermissions() {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    const currentUser = window.State ? window.State.getCurrentUser() : null;
    if (!currentUser) return;

    // 1. Standalone navigation links (e.g. Dashboard)
    const standaloneNavItems = sidebar.querySelectorAll(':scope > nav.sidebar-content > a.nav-item, .sidebar-content > a.nav-item');
    standaloneNavItems.forEach(el => {
      const href = el.getAttribute('href');
      const allowed = this.canAccessRoute(href);
      if (allowed) {
        el.style.display = '';
        el.removeAttribute('data-rbac-hidden');
      } else {
        el.style.display = 'none';
        el.setAttribute('data-rbac-hidden', 'true');
      }
    });

    // 2. Module groups (.module-group)
    const moduleGroups = sidebar.querySelectorAll('.module-group');
    moduleGroups.forEach(group => {
      const subItems = group.querySelectorAll('.module-sub-menu a.sub-nav-item, .module-sub-menu a.nav-item');
      let visibleCount = 0;

      subItems.forEach(sub => {
        const href = sub.getAttribute('href');
        const allowed = this.canAccessRoute(href);
        if (allowed) {
          sub.style.display = '';
          sub.removeAttribute('data-rbac-hidden');
          visibleCount++;
        } else {
          sub.style.display = 'none';
          sub.setAttribute('data-rbac-hidden', 'true');
        }
      });

      // Also check section dividers/labels in sub-menu (e.g. Storage Structure in #group-org-location)
      const sectionHeaders = group.querySelectorAll('.module-sub-menu > div');
      sectionHeaders.forEach(sh => {
        let sib = sh.nextElementSibling;
        let hasVisibleSib = false;
        while (sib && sib.tagName === 'A') {
          if (sib.style.display !== 'none' && sib.getAttribute('data-rbac-hidden') !== 'true') {
            hasVisibleSib = true;
            break;
          }
          sib = sib.nextElementSibling;
        }
        sh.style.display = hasVisibleSib ? '' : 'none';
      });

      // Also check nested sub-module groups (.sub-module-group)
      const subGroups = group.querySelectorAll('.sub-module-group');
      subGroups.forEach(sg => {
        const sgItems = sg.querySelectorAll('a.sub-nav-item, a.sub-sub-nav-item, a.nav-item');
        let sgVisibleCount = 0;
        sgItems.forEach(item => {
          if (item.style.display !== 'none' && item.getAttribute('data-rbac-hidden') !== 'true') {
            sgVisibleCount++;
          }
        });
        if (sgVisibleCount === 0) {
          sg.style.display = 'none';
          sg.setAttribute('data-rbac-hidden', 'true');
        } else {
          sg.style.display = '';
          sg.removeAttribute('data-rbac-hidden');
        }
      });

      // If NO sub-items are visible in this module group, hide the entire group!
      if (visibleCount === 0) {
        group.style.display = 'none';
        group.setAttribute('data-rbac-hidden', 'true');
        group.classList.remove('open');
      } else {
        group.style.display = '';
        group.removeAttribute('data-rbac-hidden');
      }
    });

    // Refresh sidebar pin action buttons
    if (window.PinnedSubmodulesModule && typeof window.PinnedSubmodulesModule.attachSidebarPinIcons === 'function') {
      window.PinnedSubmodulesModule.attachSidebarPinIcons();
    }
  }

  handleRoute(scroll = true) {
    if (this._isRouting) return;
    this._isRouting = true;
    try {
      this._handleRouteInternal(scroll);
    } finally {
      this._isRouting = false;
    }
  }

  _handleRouteInternal(scroll = true) {
    const hash = window.location.hash || '#/dashboard';
    if (hash === '#/traceability') {
      window.location.hash = '#/inventory';
      return;
    }

    // Close any lingering modal on route navigation
    if (window.State && typeof window.State.closeModal === 'function') {
      window.State.closeModal();
    }

    // If user is logged out and tries to access an authenticated route, redirect to #/login
    if (window.State && window.State.isLoggedIn === false && hash !== '#/login') {
      window.location.hash = '#/login';
      return;
    }

    // Filter sidebar navigation according to user permissions
    this.filterSidebarByPermissions();

    const baseHash = hash.split('?')[0];
    const routeConfig = this.routes[hash] || this.routes[baseHash] || this.routes['#/dashboard'];

    // Update active nav item in sidebar
    const currentParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const currentReport = currentParams.get('report') || (window.MisReportsModule ? window.MisReportsModule.activeReport : null);

    document.querySelectorAll('.nav-item').forEach(el => {
      const itemHref = el.getAttribute('href') || '';
      const isAddressChild = (itemHref === '#/address-master') && 
        ['#/address-master', '#/common-masters-2', '#/countries', '#/states', '#/districts', '#/cities', '#/pincodes'].includes(hash);
      const isJobCardChild = (itemHref === '#/job-cards') && 
        ['#/job-cards', '#/job-card-parts'].includes(hash);
      const isOpeningBalanceChild = (itemHref === '#/opening-balance') && 
        ['#/opening-balance', '#/inventory-opening', '#/opening-balance-config'].includes(hash);

      let isMatch = (itemHref === hash);
      if (!isMatch && baseHash === '#/mis-reports') {
        if (itemHref.startsWith('#/mis-reports')) {
          const itemParams = new URLSearchParams(itemHref.includes('?') ? itemHref.split('?')[1] : '');
          const itemReport = itemParams.get('report');
          if (itemReport && (itemReport === currentReport || (!currentReport && itemReport === 'BILL_REGISTER'))) {
            isMatch = true;
          } else if (!itemReport && (!currentReport || currentReport === 'BILL_REGISTER') && itemHref === '#/mis-reports') {
            isMatch = true;
          }
        }
      }

      if (isMatch || isAddressChild || isJobCardChild || isOpeningBalanceChild) {
        el.classList.add('active');
        // Auto-expand parent module group if contained (Level 1)
        const parentGroup = el.closest('.module-group');
        if (parentGroup && !parentGroup.hasAttribute('data-rbac-hidden')) {
          parentGroup.classList.add('open');
        }
        // Auto-expand parent sub-module group if contained (Level 2)
        const parentSubGroup = el.closest('.sub-module-group');
        if (parentSubGroup && !parentSubGroup.hasAttribute('data-rbac-hidden')) {
          parentSubGroup.classList.add('open');
        }
      } else {
        el.classList.remove('active');
      }
    });

    // Update breadcrumbs and titles (Supports Multi-Tier Hierarchy: Masters -> Sub-Module -> Sub-Sub-Module)
    const titleEl = document.getElementById('page-title-text');
    const breadcrumbSection = document.getElementById('breadcrumb-section');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    const breadcrumbsWrap = document.querySelector('.breadcrumbs');

    const isOpeningBalanceRoute = hash.startsWith('#/opening-balance') || hash.startsWith('#/inventory-opening') || hash.startsWith('#/opening-balance-config');

    const pageActionsContainer = document.getElementById('page-actions-container');
    if (pageActionsContainer && hash !== '#/grn' && !isOpeningBalanceRoute) {
      pageActionsContainer.innerHTML = '';
    }

    if (baseHash === '#/mis-reports') {
      const repId = currentReport || 'BILL_REGISTER';
      const def = window.MisReportsModule && window.MisReportsModule.reportCatalog ? window.MisReportsModule.reportCatalog.find(r => r.id === repId) : null;
      const repTitle = def ? def.title : 'Consolidated MIS Reports';
      if (titleEl) titleEl.innerText = repTitle;
      if (breadcrumbSection) breadcrumbSection.innerText = 'MIS Reports';
      if (breadcrumbCurrent) breadcrumbCurrent.innerText = repTitle;
      if (breadcrumbsWrap) {
        breadcrumbsWrap.style.display = '';
        breadcrumbsWrap.innerHTML = `
          <span id="breadcrumb-section">MIS Reports</span>
          <span>/</span>
          <span class="current" id="breadcrumb-current">${repTitle}</span>
        `;
      }
    } else {
      if (titleEl) titleEl.innerText = routeConfig.title;
      if (breadcrumbSection) breadcrumbSection.innerText = routeConfig.section;
      if (breadcrumbCurrent) breadcrumbCurrent.innerText = routeConfig.title;

      if (breadcrumbsWrap) {
        if (hash === '#/grn' || hash === '#/inventory' || isOpeningBalanceRoute) {
          breadcrumbsWrap.innerHTML = '';
          breadcrumbsWrap.style.display = 'none';
        } else {
          breadcrumbsWrap.style.display = '';
          if (routeConfig.subSection) {
            breadcrumbsWrap.innerHTML = `
              <span id="breadcrumb-section">${routeConfig.section}</span>
              <span>/</span>
              <span style="color: var(--text-secondary);">${routeConfig.subSection}</span>
              <span>/</span>
              <span class="current" id="breadcrumb-current">${routeConfig.title}</span>
            `;
          } else {
            breadcrumbsWrap.innerHTML = `
              <span id="breadcrumb-section">${routeConfig.section || 'Overview'}</span>
              <span>/</span>
              <span class="current" id="breadcrumb-current">${routeConfig.title}</span>
            `;
          }
        }
      }
    }

    // Toggle full-screen login mode if on #/login
    const appWrapper = typeof document !== 'undefined' ? document.querySelector('.app-wrapper') : null;
    if (appWrapper) {
      if (hash === '#/login') {
        appWrapper.classList.add('login-mode');
      } else {
        appWrapper.classList.remove('login-mode');
      }
    }

    // Always update header profile when navigating
    this.updateHeaderProfileInfo();

    // Auto-close mobile sidebar drawer on mobile/tab viewports
    if (typeof window !== 'undefined' && typeof window.closeMobileSidebar === 'function') {
      window.closeMobileSidebar();
    }

    // Toggle page top bar for Organization & Location, Store & Inventory Master, Billing, and Login modules
    const pageTopBar = (typeof document !== 'undefined' && document.getElementById) 
      ? (document.getElementById('page-top-bar') || (document.querySelector && document.querySelector('.page-top-bar'))) 
      : null;

    const isBilling = (routeConfig && (
      routeConfig.module === window.BillingModule ||
      routeConfig.section === 'Billing' ||
      routeConfig.section === 'Workshop'
    )) || (
      hash.startsWith('#/billing') ||
      hash.startsWith('#/job-card') ||
      hash.startsWith('#/draft-bill') ||
      hash.startsWith('#/final-bill') ||
      hash.startsWith('#/bill-list') ||
      hash.startsWith('#/customer-billing') ||
      hash.startsWith('#/vehicle-delivery')
    );

    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('is-billing-route', !!isBilling);
    }

    const isCRM = (routeConfig && (
      routeConfig.module === window.CustomerRemindersModule ||
      routeConfig.section === 'Customer Relationship (CRM)' ||
      routeConfig.section === 'CRM'
    )) || (
      hash.startsWith('#/customer-reminders') ||
      hash.startsWith('#/reminder') ||
      hash.startsWith('#/message-templates')
    );

    const isMIS = (routeConfig && (
      routeConfig.module === window.MisReportsModule ||
      routeConfig.section === 'MIS Reports'
    )) || hash.startsWith('#/mis-reports');

    const isTopTabsModule = isBilling || isCRM || isMIS || (routeConfig && (
      routeConfig.section === 'Masters' || 
      routeConfig.section === 'Organization & Facility Setup' || 
      routeConfig.section === 'User Roles & Security' || 
      routeConfig.section === 'Organization & Location' || 
      routeConfig.section === 'Common Master' || 
      routeConfig.section === 'Store Master Setup' || 
      routeConfig.section === 'Store & Inventory Master' || 
      routeConfig.section === 'Store & Inventory' || 
      routeConfig.section === 'Item Master Setup' || 
      routeConfig.section === 'Inventory & Logistics' ||
      hash === '#/inventory' ||
      hash.startsWith('#/opening-balance') ||
      hash.startsWith('#/inventory-opening') ||
      hash === '#/transfers'
    ));

    if (pageTopBar) {
      if (hash === '#/login' || isTopTabsModule) {
        pageTopBar.style.setProperty('display', 'none', 'important');
        pageTopBar.classList.add('hidden');
      } else {
        pageTopBar.style.removeProperty('display');
        pageTopBar.classList.remove('hidden');
      }
    }

    // Toggle Pinned Bar on login
    const pinnedBar = document.getElementById('pinned-submodules-bar');
    if (pinnedBar) {
      pinnedBar.style.display = (hash === '#/login') ? 'none' : 'flex';
    }
    if (window.PinnedSubmodulesModule && typeof window.PinnedSubmodulesModule.updateActiveState === 'function') {
      window.PinnedSubmodulesModule.updateActiveState();
      window.PinnedSubmodulesModule.updateScreenHeaderPinButton();
    }

    const container = document.getElementById('view-container');
    if (!container) return;

    // RBAC Authorization Enforcement: Hide unauthorized screen & automatically navigate to authorized workspace
    const currentUser = window.State.getCurrentUser();
    if (!this.canAccessRoute(hash)) {
      const authorizedRoute = this.getFirstAuthorizedRoute();

      if (!this.canAccessRoute(authorizedRoute)) {
        // User has no authorized routes in the system
        const user = window.State ? window.State.getCurrentUser() : null;
        const role = user ? (user.primary_role || 'User') : 'Assigned Role';
        container.innerHTML = `
          <div style="max-width: 540px; margin: 80px auto; padding: 36px 24px; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); text-align: center; box-shadow: var(--shadow-md);">
            <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(239, 68, 68, 0.12); color: var(--color-danger); display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px auto;">
              🛡️
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0 0 10px 0;">No Accessible Modules</h2>
            <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin: 0 auto 24px auto; max-width: 440px;">
              Your user account is assigned the role <strong>${role}</strong>, which currently does not have active permissions to access any modules. Please contact your system administrator to assign module privileges.
            </p>
            <div style="display: flex; justify-content: center; gap: 12px;">
              <button type="button" class="btn btn-danger" onclick="window.App.performSignOut()" style="background: var(--color-danger); color: #fff; border: none; padding: 10px 24px; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer;">
                Logout
              </button>
            </div>
          </div>
        `;
        return;
      }

      if (window.State && window.State.showToast) {
        const requiredModule = this.getRequiredPermCode(hash) || 'RESTRICTED';
        window.State.showToast(`Access to that screen is restricted based on your role. Showing your authorized workspace.`, 'info');
      }

      if (window.location.hash === authorizedRoute) {
        const authConfig = this.routes[authorizedRoute] || this.routes['#/dashboard'];
        if (authConfig && authConfig.module && authConfig.module.render) {
          authConfig.module.render(container);
        }
      } else {
        window.location.hash = authorizedRoute;
      }
      return;
    }

    // Render module
    if (routeConfig.module && routeConfig.module.render) {
      if (routeConfig.module === window.CustomerRemindersModule) {
        if (hash === '#/reminder-configuration') window.CustomerRemindersModule.activeTab = 'CONFIGURATION';
        else if (hash === '#/reminder-processing') window.CustomerRemindersModule.activeTab = 'PROCESSING';
        else if (hash === '#/reminder-history') window.CustomerRemindersModule.activeTab = 'HISTORY';
        else if (hash === '#/reminder-reports') window.CustomerRemindersModule.activeTab = 'REPORTS';
        else if (hash === '#/message-templates') window.CustomerRemindersModule.activeTab = 'TEMPLATES';
        else if (hash === '#/customer-reminders' || hash === '#/reminder-dashboard') window.CustomerRemindersModule.activeTab = 'DASHBOARD';
      }
      if (routeConfig.module === window.BillingModule) {
        if (hash === '#/job-cards') {
          window.BillingModule.activeTab = 'JOB_CARDS';
          window.BillingModule.jobCardSubView = 'REGISTER';
        } else if (hash === '#/job-card-parts') {
          window.BillingModule.activeTab = 'JOB_CARDS';
          window.BillingModule.jobCardSubView = 'PARTS_WORKFLOW';
        } else if (hash === '#/billing-estimates' || baseHash === '#/billing-estimates' || hash.startsWith('#/billing-estimates')) {
          window.BillingModule.activeTab = 'ESTIMATES';
          window.BillingModule._explicitNavigationContext = true;
        } else if (hash === '#/customer-billing') {
          window.BillingModule.activeTab = 'CUSTOMER_BILLING';
          if (!window.BillingModule._explicitNavigationContext && !window.BillingModule.activeBillingBillId) {
            window.BillingModule.activeBillingBillId = null;
          }
        } else if (hash === '#/draft-bills') {
          window.BillingModule.activeTab = 'CUSTOMER_BILLING';
          if (!window.BillingModule._explicitNavigationContext && !window.BillingModule.activeBillingBillId) {
            window.BillingModule.activeBillingBillId = null;
          }
          if (!window.BillingModule.customerBillingFilter || window.BillingModule.customerBillingFilter === 'ALL') {
            window.BillingModule.customerBillingFilter = 'DRAFT';
          }
        } else if (hash === '#/final-bills' || hash === '#/bill-list') {
          window.BillingModule.activeTab = 'FINAL_BILLS';
        } else if (hash === '#/vehicle-delivery') {
          window.BillingModule.activeTab = 'DELIVERY';
        } else if (hash === '#/billing' || hash === '#/billing-dashboard') {
          window.BillingModule.activeTab = 'DASHBOARD';
        }
      }
      if (routeConfig.module === window.MisReportsModule) {
        if (typeof window.MisReportsModule.parseUrlParams === 'function') {
          window.MisReportsModule.parseUrlParams();
        }
      }
      routeConfig.module.render(container);
      if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  setupShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Escape closes modal
      if (e.key === 'Escape') {
        window.State.closeModal();
      }

      // Ctrl + K or Cmd + K focuses search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const search = document.getElementById('global-search-input');
        if (search) search.focus();
      }

      // Alt + N opens quick transaction modal
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.openQuickActionModal();
      }

      // Alt + T toggles between Dark and Light mode
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  openQuickActionModal() {
    const actions = [
      {
        perm: 'REQUISITIONS',
        icon: '📝',
        title: 'Purchase Requisition',
        desc: 'Raise material demand',
        onClick: "window.State.closeModal(); window.RequisitionsModule.showCreateModal();"
      },
      {
        perm: 'ORDERS',
        icon: '📑',
        title: 'Purchase Order',
        desc: 'Issue direct vendor PO',
        onClick: "window.State.closeModal(); window.PurchaseOrdersModule.showCreateModal();"
      },
      {
        perm: 'GRN',
        icon: '📥',
        title: 'Goods Receipt (GRN)',
        desc: 'Receive supplier delivery',
        onClick: "window.State.closeModal(); window.GoodsReceiptModule.showInwardModal();"
      },
      {
        perm: 'DISPATCH',
        icon: '🚚',
        title: 'Outbound Gate Pass',
        desc: 'Dispatch sales shipment',
        onClick: "window.State.closeModal(); window.DispatchModule.showCreateShipmentModal();"
      },
      {
        perm: 'ADJUSTMENTS',
        icon: '⚖️',
        title: 'Stock Adjustment',
        desc: 'Post write-off or surplus',
        onClick: "window.State.closeModal(); window.AdjustmentsModule.showQuickAdjustmentModal();"
      },
      {
        perm: 'RETURNS',
        icon: '↩️',
        title: 'Log Return',
        desc: 'Vendor / Customer RMA',
        onClick: "window.State.closeModal(); window.ReturnsModule.showCreateModal();"
      }
    ];

    const permittedActions = actions.filter(a => {
      if (!window.State || typeof window.State.hasPermission !== 'function') return true;
      return window.State.hasPermission(a.perm, 'ADD') || window.State.hasPermission(a.perm, 'VIEW');
    });

    if (permittedActions.length === 0) {
      if (window.State && window.State.showToast) {
        window.State.showToast('No transaction creation actions authorized for your role.', 'info');
      }
      return;
    }

    window.State.showModal({
      title: '⚡ Quick Transaction Action Center',
      maxWidth: '600px',
      contentHtml: `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
          ${permittedActions.map(a => `
            <div class="content-card" style="margin:0; padding:16px; cursor:pointer; text-align:center;" onclick="${a.onClick}">
              <div style="font-size:24px; margin-bottom:6px;">${a.icon}</div>
              <div style="font-weight:700; color:var(--text-primary);">${a.title}</div>
              <div style="font-size:11px; color:var(--text-muted);">${a.desc}</div>
            </div>
          `).join('')}
        </div>
      `
    });
  }

  handleSignOut(bypassConfirm = false) {
    // Close user profile dropdown immediately
    const dropdown = document.getElementById('user-profile-dropdown');
    const btn = document.getElementById('user-profile-trigger-btn');
    if (dropdown) dropdown.classList.remove('active');
    if (btn) btn.classList.remove('active');

    if (bypassConfirm) {
      this.performSignOut();
      return;
    }

    try {
      const user = window.State ? window.State.getCurrentUser() : null;
      const userName = user ? (user.full_name || user.username) : 'User';
      const userRole = user ? (user.primary_role || 'User') : '';

      window.State.showModal({
        title: '🚪 Confirm Logout',
        maxWidth: '450px',
        contentHtml: `
          <div style="text-align: center; padding: 12px 0 16px 0;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.12); color: var(--color-danger); display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 14px auto;">
              🚪
            </div>
            <h3 style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px 0;">
              Logout of StockIQ?
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 auto; max-width: 360px;">
              You are currently signed in as <strong>${userName}</strong> (${userRole}). Click <strong>Logout</strong> to terminate your session and return to the login screen.
            </p>
          </div>
        `,
        footerHtml: `
          <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="button" class="btn btn-danger" style="background: var(--color-danger); color:#fff; border:none; padding: 8px 20px; border-radius: var(--radius-sm); font-weight:700; cursor:pointer;" onclick="window.App.performSignOut()">
              🚪 Logout
            </button>
          </div>
        `
      });
    } catch (err) {
      console.warn('Modal open failed, performing direct sign out:', err);
      this.performSignOut();
    }
  }

  performSignOut() {
    try {
      if (window.State && typeof window.State.closeModal === 'function') {
        window.State.closeModal();
      }
    } catch (_) {}

    // Force close any open overlays or dropdowns
    const overlay = document.getElementById('global-modal-overlay');
    if (overlay) overlay.classList.remove('active');
    const dropdown = document.getElementById('user-profile-dropdown');
    if (dropdown) dropdown.classList.remove('active');
    const btn = document.getElementById('user-profile-trigger-btn');
    if (btn) btn.classList.remove('active');

    // 1. Mark state as logged out & audit log
    if (window.State && typeof window.State.logout === 'function') {
      window.State.logout();
    } else {
      localStorage.setItem('ISCM_LOGGED_IN', 'false');
    }

    if (window.State && typeof window.State.showToast === 'function') {
      window.State.showToast('Logged out successfully. Please enter your credentials to sign in.', 'info');
    }

    // 2. Route directly to #/login
    window.location.hash = '#/login';
    this.handleRoute();

    // 3. Clear password and ensure username input is editable and ready for typing
    setTimeout(() => {
      const pwd = document.getElementById('login-password');
      if (pwd) pwd.value = '';
      if (window.AuthModule && typeof window.AuthModule.enableUsernameEdit === 'function') {
        window.AuthModule.enableUsernameEdit();
      }
    }, 100);
  }

  signInAsUser() {
    window.State.closeModal();
    const user = window.State ? window.State.getCurrentUser() : null;
    const userName = user ? (user.full_name || user.username) : 'User';
    window.State.showToast(`Welcome back, ${userName}! Session restored.`, 'success');
  }

  showProfileModal() {
    const dropdown = document.getElementById('user-profile-dropdown');
    const btn = document.getElementById('user-profile-trigger-btn');
    if (dropdown) dropdown.classList.remove('active');
    if (btn) btn.classList.remove('active');

    const plant = window.State.getCurrentPlant();
    const currentUser = (window.State && window.State.getCurrentUser()) || {};
    const displayName = currentUser.display_name || currentUser.full_name || currentUser.username || 'User';
    const initials = displayName.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'U';

    window.State.showModal({
      title: '👤 User Profile & Security Credentials',
      maxWidth: '620px',
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: 800; box-shadow: var(--shadow-glow);">
              ${initials}
            </div>
            <div>
              <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${displayName}</div>
              <div style="font-size: 12.5px; color: var(--primary-400); margin-bottom: 4px;">${currentUser.designation || 'Supply Chain Lead & General Manager'}</div>
              <div style="display: flex; gap: 6px;">
                <span class="badge badge-success">Active Session</span>
                <span class="badge badge-info">${currentUser.primary_role || 'Enterprise Admin'}</span>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="content-card" style="margin: 0; padding: 14px;">
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Employee Code / User ID</div>
              <div style="font-size: 13px; font-weight: 600; font-family: var(--font-mono); color: var(--text-primary);">${currentUser.employee_id || currentUser.id || 'EMP-9042'}</div>
            </div>
            <div class="content-card" style="margin: 0; padding: 14px;">
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Corporate Email</div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${currentUser.email || 'user@apexind.com'}</div>
            </div>
            <div class="content-card" style="margin: 0; padding: 14px;">
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Department</div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${currentUser.department || 'Logistics & Procurement'}</div>
            </div>
            <div class="content-card" style="margin: 0; padding: 14px;">
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Assigned Facility</div>
              <div style="font-size: 13px; font-weight: 600; color: var(--primary-300);">${plant.name || 'Pune Facility'} (${plant.code || 'FACILITY-01'})</div>
            </div>
          </div>

          <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: var(--radius-md); padding: 14px;">
            <div style="font-weight: 600; font-size: 12.5px; color: var(--primary-200); margin-bottom: 6px;">🔐 Security & Access Rights</div>
            <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
              Granted full approval authority over Purchase Requisitions (PR), Purchase Orders (PO), Quality Hold releases, Inter-Facility Stock Transfers, and physical inventory balance adjustments.
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
        <button class="btn btn-danger" style="background: var(--color-danger); color:#fff; border:none; padding: 8px 18px; border-radius: var(--radius-sm); font-weight:700; cursor:pointer;" onclick="window.App.handleSignOut()">🚪 Logout</button>
      `
    });
  }
}

// Instantiate App
window.App = new AppController();

// Global bindings for inline onclick attributes
window.toggleModuleGroup = function(headerEl) {
  if (window.App && typeof window.App.toggleModuleGroup === 'function') {
    window.App.toggleModuleGroup(headerEl);
  }
};

window.toggleSidebarPin = function() {
  if (window.App && typeof window.App.toggleSidebarPin === 'function') {
    window.App.toggleSidebarPin();
  }
};

window.setThemeMode = function(mode) {
  if (window.App && typeof window.App.setThemeMode === 'function') {
    window.App.setThemeMode(mode);
  }
};

window.toggleTheme = function() {
  if (window.App && typeof window.App.toggleTheme === 'function') {
    window.App.toggleTheme();
  }
};

window.handleSignOut = function(bypassConfirm) {
  if (window.App && typeof window.App.handleSignOut === 'function') {
    window.App.handleSignOut(bypassConfirm);
  } else {
    window.location.hash = '#/login';
  }
};

window.performSignOut = function() {
  if (window.App && typeof window.App.performSignOut === 'function') {
    window.App.performSignOut();
  } else {
    localStorage.setItem('ISCM_LOGGED_IN', 'false');
    window.location.hash = '#/login';
  }
};

/* ==========================================================================
   INVENTORY & LOGISTICS SUB-MODULE NAVIGATION TABS (BRD COMPLIANT)
   Renders horizontal tabs for instant switching across Inventory sub-modules
   ========================================================================== */
window.renderInventoryLogisticsTabs = function(activeHash) {
  const current = (activeHash || (typeof window !== 'undefined' && window.location ? window.location.hash : '#/inventory')).split('?')[0];
  const tabs = [
    { key: 'inventory', label: 'Stock Balances', route: '#/inventory', perm: 'INVENTORY' },
    { key: 'opening-balance', label: 'Opening Balance', route: '#/opening-balance', perm: 'OPENING_BALANCE' },
    { key: 'transfers', label: 'Stock Transfer', route: '#/transfers', perm: 'TRANSFERS' },
    { key: 'receive-transfers', label: 'Receive Stock Transfer', route: '#/receive-transfers', perm: 'RECEIVE_TRANSFERS' }
  ];

  const visibleTabs = tabs.filter(t => {
    if (window.App && typeof window.App.canAccessRoute === 'function') {
      return window.App.canAccessRoute(t.route);
    }
    if (window.State && typeof window.State.hasPermission === 'function') {
      return window.State.hasPermission(t.perm, 'VIEW');
    }
    return true;
  });

  return `
    <div class="tabs-header inventory-logistics-tabs" style="margin-top: 0 !important; margin-bottom: 4px !important; overflow-x: auto; white-space: nowrap;">
      ${visibleTabs.map(t => {
        const isActive = (current === t.route || 
          (t.key === 'inventory' && current === '#/inventory') ||
          (t.key === 'opening-balance' && (current.startsWith('#/opening-balance') || current.startsWith('#/inventory-opening') || current.startsWith('#/opening-balance-config'))) ||
          (t.key === 'transfers' && current === '#/transfers') ||
          (t.key === 'receive-transfers' && (current === '#/receive-transfers' || current === '#/receive-stock-transfer')));
        return `
          <button type="button" class="tab-btn ${isActive ? 'active' : ''}" onclick="window.location.hash='${t.route}'" style="cursor: pointer;">
            <span>${t.label}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
};

