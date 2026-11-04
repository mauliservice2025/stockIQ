# StockIQ Enterprise - Parity Ledger & Traceability Matrix

**Plan Reference:** Section 3 (Phase 0 Discovery & Parity Ledger)
**Target Stack:** Angular (latest stable) · Node.js · Tailwind CSS · PostgreSQL · Capacitor
**Sign-off Status:** ⬜ Not started · 🟨 In progress · 🟩 Built · ✅ Verified & signed off · ❌ Dropped

---

## 1. Screens & UI Components Ledger

| ID | Screen / Component | Old file path | Route / Trigger | Roles | States Covered | New Component | Baseline Screenshot | Status |
|---|--------------------|---------------|-----------------|-------|----------------|---------------|---------------------|--------|
| UI-001 | Operations Dashboard | `js/modules/dashboard.js` | `#/dashboard` | All | Default, Filtered, Empty, Loading | `DashboardComponent` | `dashboard.png`, `dashboard_full.png` | 🟨 |
| UI-002 | Purchase Planning & MRP | `js/modules/purchase-planning.js` | `#/purchase-planning` | Buyer, Admin | Loading, Data, Action confirmation | `PurchasePlanningComponent` | - | 🟨 |
| UI-003 | Purchase Requisitions (PR) | `js/modules/requisitions.js` | `#/requisitions` | Creator, Approver | Draft, Approved, Rejected | `RequisitionsComponent` | - | 🟨 |
| UI-004 | Purchase Orders (PO) | `js/modules/purchase-orders.js` | `#/orders` | Buyer, Finance, Admin | List, Create, PDF View | `PurchaseOrdersComponent` | - | 🟨 |
| UI-005 | Goods Receipt Notes (GRN) | `js/modules/goods-receipt.js` | `#/grn` | Stores, QC, Admin | Pending, Received, Inspected | `GoodsReceiptComponent` | - | 🟨 |
| UI-006 | Quality Inspection (QA/QC)| `js/modules/quality-inspection.js` | `#/quality` | QA Inspector, Admin | Pass, Reject, Conditional | `QualityInspectionComponent` | - | 🟨 |
| UI-007 | Warehouse Putaway | `js/modules/putaway.js` | `#/putaway` | Warehouse Op, Admin | Suggested, Assigned, Done | `PutawayComponent` | - | 🟨 |
| UI-008 | Warehouse Visualizer Map | `js/modules/warehouse-visualizer.js` | `#/warehouse-map` | All | 2D Bin matrix, Capacity highlight | `WarehouseMapComponent` | - | 🟨 |
| UI-009 | Stock Balances & Inventory| `js/modules/inventory.js` | `#/inventory` | All | Real-time stock, Negative stock warning | `InventoryComponent` | - | 🟨 |
| UI-010 | Opening Balance Management | `js/modules/opening-balance.js` | `#/opening-balance` | Stores, Admin | Draft, Finalized, Locked | `OpeningBalanceComponent` | - | 🟨 |
| UI-011 | Stock Transfers (Inter-Store/Plant) | `js/modules/transfers.js` | `#/transfers`, `#/stock-transfers` | Stores, Admin | In-transit, Dispatched, Cancelled | `StockTransfersComponent` | - | 🟨 |
| UI-012 | Receive Stock Transfers | `js/modules/receive-transfers.js` | `#/receive-transfers` | Stores, Admin | Verification, Discrepancy, Accepted | `ReceiveTransfersComponent` | - | 🟨 |
| UI-013 | Manufacturing Execution & BOM | `js/modules/production.js` | `#/production` | Production, Admin | BOM Tree, Consumption log | `ProductionComponent` | - | 🟨 |
| UI-014 | Outbound Dispatch & Gate Pass | `js/modules/dispatch.js` | `#/dispatch` | Dispatch, Security | Loaded, Gate out, Verified | `DispatchComponent` | - | 🟨 |
| UI-015 | Reverse Logistics & Returns | `js/modules/returns.js` | `#/returns` | Stores, QA | RMA, Return-to-vendor | `ReturnsComponent` | - | 🟨 |
| UI-016 | Stock Physical Counts & Adjustments | `js/modules/adjustments.js` | `#/adjustments` | Auditor, Admin | Variance, Approved, Adjusted | `AdjustmentsComponent` | - | 🟨 |
| UI-017 | Organization & Facility Setup | `js/modules/org-location.js`, `organizations.js` | `#/org-location`, `#/organizations`, `#/facilities` | Org Admin | Multi-level hierarchy tree | `OrgLocationComponent` | - | 🟨 |
| UI-018 | Address Master (5-in-1 Tabs) | `js/modules/common-master.js` | `#/address-master`, `#/countries`, `#/states`, `#/cities` | Admin | Country, State, District, City, Pincode | `AddressMasterComponent` | - | 🟨 |
| UI-019 | Common Lookup Master | `js/modules/common-lookup-master.js` | `#/common-master` | Admin | Dynamic key-value pairs | `CommonLookupComponent` | - | 🟨 |
| UI-020 | Tax Master & GST Slab Setup | `js/modules/tax-master.js` | `#/tax-master` | Finance, Admin | CGST/SGST/IGST rates | `TaxMasterComponent` | - | 🟨 |
| UI-021 | Financial Calendar Master | `js/modules/financial-calendar.js` | `#/financial-calendar` | Finance, Admin | Year closing, Period lock | `FinancialCalendarComponent` | - | 🟨 |
| UI-022 | Document Number Series Master | `js/modules/doc-series-master.js` | `#/doc-series` | Admin | Prefix, Suffix, Auto-increment | `DocSeriesComponent` | - | 🟨 |
| UI-023 | Document Print Config Master | `js/modules/doc-print-config.js` | `#/doc-print-config` | Admin | Header, Footer, Stamp, Terms | `DocPrintConfigComponent` | - | 🟨 |
| UI-024 | Holiday Master | `js/modules/holiday-master.js` | `#/holiday-master` | HR, Admin | Restricted, National, Operational | `HolidayMasterComponent` | - | 🟨 |
| UI-025 | Registration Config Master | `js/modules/registration-config.js` | `#/registration-config` | Admin | KYC, GSTIN, Legal validations | `RegistrationConfigComponent` | - | 🟨 |
| UI-026 | Store Master Setup Suite | `js/modules/store-inventory.js` | `#/store-master-setup`, `#/stores`, `#/racks`, `#/bins` | Stores, Admin | Store -> Location -> Rack -> Shelf -> Bin | `StoreMasterSetupComponent` | - | 🟨 |
| UI-027 | Item Master & Setup Suite | `js/modules/item-setup-master.js`, `item-dashboard.js` | `#/item-master-setup`, `#/item-dashboard` | Stores, Admin | Spare parts, HSN, UOM, Categories | `ItemMasterComponent` | - | 🟨 |
| UI-028 | Service Master (Labour Rates) | `js/modules/service-master.js` | `#/service-master` | Service Mgr | Labour codes, Standard hours | `ServiceMasterComponent` | - | 🟨 |
| UI-029 | Vehicle Model Compatibility | `js/modules/item-setup-master.js` | `#/vehicle-compatibility` | Workshop, Parts | Starred favourites, Model mapping | `VehicleCompatibilityComponent` | `vehicle_compatibility.png`, `favourite_models_marked.png` | 🟨 |
| UI-030 | Workshop Billing Dashboard | `js/modules/billing.js` | `#/billing`, `#/billing-dashboard` | Service, Cashier | Quick counters, Turnaround time | `BillingDashboardComponent` | - | 🟨 |
| UI-031 | Job Card Intake & Workshop Flow | `js/modules/billing.js` | `#/job-cards` | Service Advisor | Vehicle check-in, Checklist, Parts | `JobCardComponent` | `job_card_favourite_dropdown.png` | 🟨 |
| UI-032 | Service Estimation & Quotations | `js/modules/billing.js` | `#/billing-estimates` | Service Advisor | Parts + Labour quote, WhatsApp share | `EstimateComponent` | - | 🟨 |
| UI-033 | Draft Bills & Review | `js/modules/billing.js` | `#/draft-bills` | Cashier, Advisor | Pre-invoice check, Discounts | `DraftBillsComponent` | - | 🟨 |
| UI-034 | Tax Invoices & Bill List | `js/modules/billing.js` | `#/final-bills`, `#/bill-list` | Cashier, Finance | GST compliant invoice, Payment record | `BillListComponent` | - | 🟨 |
| UI-035 | Vehicle Delivery & Gate Pass | `js/modules/billing.js` | `#/vehicle-delivery` | Security, Advisor | Payment clearance check, Gate pass | `VehicleDeliveryComponent` | - | 🟨 |
| UI-036 | Consolidated MIS Reports | `js/modules/mis-reports.js` | `#/mis-reports` | Management, All | 12 Workshop & Inventory reports | `MisReportsComponent` | - | 🟨 |
| UI-037 | CRM Service Reminders | `js/modules/customer-reminders.js` | `#/customer-reminders`, `#/reminder-dashboard`| CRM, Advisor | Due services, WhatsApp/SMS push | `CustomerRemindersComponent` | - | 🟨 |
| UI-038 | User Master & RBAC Suite | `js/modules/user-management.js` | `#/users`, `#/roles`, `#/permissions` | Super Admin | 17 Sub-modules, Matrix, SoD | `UserManagementComponent` | - | 🟨 |
| UI-039 | Portal Authentication (Login) | `js/modules/auth.js` | `#/login` | Anonymous | Single sign-on, Facility selection | `LoginComponent` | - | 🟨 |
| UI-040 | Pinned Sub-Modules Bar | `js/modules/pinned-submodules.js` | Top bar below header | All | User-customized shortcut bookmarks | `PinnedSubmodulesComponent`| - | 🟨 |

---

## 2. Functional Features & Business Rules Ledger

| ID | Feature | Old Location | Key Business Rules | API Endpoints | PostgreSQL Tables | Status |
|---|---------|--------------|-------------------|---------------|-------------------|--------|
| FN-001 | 10-Digit Mobile Number Enforcer | `js/app.js` | Strictly 10 digits; blocks non-digits and leading zeros where invalid; formats on blur | - | `users.phone`, `customers.phone` | 🟨 |
| FN-002 | Zero-Flicker Dual Theme | `index.html`, `css/variables.css` | Persistent theme in localStorage `STOCKIQ_THEME`; instant application before paint | - | - | 🟨 |
| FN-003 | Facility & Branch Context Switcher | `js/state.js`, `js/app.js` | Switches active facility without logging out; filters transactions by `facility_id` | `/api/facilities` | `facilities`, `user_facilities` | 🟨 |
| FN-004 | Starred Favourite Vehicle Models | `js/modules/item-setup-master.js` | Persists user-favorite vehicle models; sorts starred models to top in Job Card dropdown | `/api/items` | `items`, `userFavouriteVehicles` | 🟨 |
| FN-005 | Job Card Parts Allocation | `js/modules/billing.js` | Deducts live warehouse stock on issue; rejects if insufficient; creates inventory transaction | `/api/inventory/deduct` | `inventory_balances`, `inventory_transactions` | 🟨 |
| FN-006 | Estimate & Invoice Tax Engine | `js/modules/billing.js` | Automatic CGST + SGST (intra-state) or IGST (inter-state) calculation based on customer state vs facility state | `/api/tax-master` | `tax_master` | 🟨 |
| FN-007 | Document Number Auto-Sequencer | `js/modules/doc-series-master.js` | Fiscal-year prefixed document sequence generation (e.g. `JC/2026-27/0001`) with collision prevention | `/api/doc-series` | `document_series` | 🟨 |
| FN-008 | Segregation of Duties (SoD) | `js/modules/user-management.js` | Prevents a single user holding conflicting privileges (e.g. PR creator cannot approve PO) | `/api/sod-rules` | `sod_rules`, `role_permissions` | 🟨 |
| FN-009 | Immutable Audit Logging | `js/modules/audit.js` | All create, edit, delete, status change and print actions recorded with timestamp, user ID, IP | `/api/audit-logs` | `audit_logs`, `document_print_audit_logs` | 🟨 |

---

## 3. API Endpoints Ledger

| ID | Method | Old Path | Target Path | Auth Required | Request / Response Contract | Status |
|---|--------|----------|-------------|---------------|------------------------------|--------|
| API-001 | GET | `/api/health` | `/api/v1/health` | No | System uptime, version, PostgreSQL live state | 🟨 |
| API-002 | GET | `/api/db-status` | `/api/v1/db-status` | No | Connection pool statistics, version, latency | 🟨 |
| API-003 | POST | `/api/login` | `/api/v1/auth/login` | No | Credentials -> JWT token, user payload, roles | 🟨 |
| API-004 | GET | `/api/facilities` | `/api/v1/facilities` | Yes | List facilities assigned to active user | 🟨 |
| API-005 | GET | `/api/users` | `/api/v1/users` | Yes (Admin) | Paginated list of users with assigned roles | 🟨 |
| API-006 | POST | `/api/users` | `/api/v1/users` | Yes (Admin) | Create user with role & facility mappings | 🟨 |
| API-007 | PUT | `/api/users/:id` | `/api/v1/users/:id` | Yes (Admin) | Update user profile / status / roles | 🟨 |
| API-008 | DELETE | `/api/users/:id` | `/api/v1/users/:id` | Yes (Admin) | Soft-delete / deactivate user | 🟨 |
| API-009 | GET | `/api/roles` | `/api/v1/roles` | Yes | List roles with associated permissions | 🟨 |
| API-010 | GET | `/api/permissions` | `/api/v1/permissions` | Yes | Full list of granular system permissions | 🟨 |
| API-011 | GET | `/api/items` | `/api/v1/items` | Yes | Paginated spare parts, accessories, and items | 🟨 |
| API-012 | GET | `/api/inventory` | `/api/v1/inventory` | Yes | Live bin-level stock balances | 🟨 |
| API-013 | POST | `/api/inventory/deduct` | `/api/v1/inventory/deduct` | Yes | Atomic stock issue for job cards / sales | 🟨 |
| API-014 | POST | `/api/inventory/restock`| `/api/v1/inventory/restock`| Yes | Restock / GRN receiving adjustment | 🟨 |
| API-015 | GET | `/api/suppliers` | `/api/v1/suppliers` | Yes | Vendor catalog & credit terms | 🟨 |
| API-016 | GET | `/api/stores` | `/api/v1/stores` | Yes | Store, location, rack, and bin hierarchy | 🟨 |
| API-017 | GET | `/api/holidays` | `/api/v1/holidays` | Yes | Facility operational holiday calendar | 🟨 |
| API-018 | GET | `/api/document-print-configurations` | `/api/v1/doc-print-config` | Yes | Active print templates & header layouts | 🟨 |

---

## 4. PostgreSQL Database Entities Ledger (All 71 Tables)

| ID | Table Name | Purpose / Domain | Key Constraints | Migration Status |
|---|------------|------------------|-----------------|------------------|
| DB-001 | `access_requests` | User access workflow | FK to `users`, `roles` | 🟩 Built (`001_initial_schema.sql`) |
| DB-002 | `approval_authorities` | Financial approval thresholds | Unique role limit tier | 🟩 Built |
| DB-003 | `approval_delegations` | Out-of-office delegation | Date range validation | 🟩 Built |
| DB-004 | `audit_logs` | Immutable audit trail | Append-only, indexed `created_at` | 🟩 Built |
| DB-005 | `bom_headers` | Bill of Materials header | Unique item version | 🟩 Built |
| DB-006 | `bom_items` | BOM line items & consumption | FK to `bom_headers`, `items` | 🟩 Built |
| DB-007 | `companies` | Multi-company tenant root | Unique PAN / GSTIN | 🟩 Built |
| DB-008 | `customers` | Two-wheeler garage customers | Mobile unique, GSTIN optional | 🟩 Built |
| DB-009 | `departments` | Organizational cost centers | Unique department code | 🟩 Built |
| DB-010 | `document_print_audit_logs` | Print history tracking | User ID, copy counter | 🟩 Built |
| DB-011 | `document_print_configurations` | Print templates & formats | Unique doc type per plant | 🟩 Built |
| DB-012 | `document_print_template_versions` | Versioned print templates | SemVer format tracking | 🟩 Built |
| DB-013 | `facilities` | Workshop branches & plants | Unique code, FK to `organizations` | 🟩 Built |
| DB-014 | `finished_goods_receipts` | Production receiving | FK to `production_orders` | 🟩 Built |
| DB-015 | `goods_receipt_notes` | Inbound GRN headers | PO reference, vendor challan | 🟩 Built |
| DB-016 | `grn_items` | GRN line items | Received vs accepted qty | 🟩 Built |
| DB-017 | `holiday_audit` | Audit changes to holidays | Timestamped modification log | 🟩 Built |
| DB-018 | `holiday_types` | Holiday classifications | National, Gazetted, Restricted | 🟩 Built |
| DB-019 | `holidays` | Operational holiday calendar | Unique date per facility | 🟩 Built |
| DB-020 | `inventory_balances` | Real-time stock per bin | Composite key `(item_id, bin_id)` | 🟩 Built |
| DB-021 | `inventory_transactions` | Ledger transaction journal | Debit/Credit balance tracker | 🟩 Built |
| DB-022 | `item_batches` | Batch & Expiry tracking | Expiry date check constraint | 🟩 Built |
| DB-023 | `item_categories` | Category / Sub-category | Hierarchical parent-child FK | 🟩 Built |
| DB-024 | `items` | Spare parts & master items | Unique SKU / Part number | 🟩 Built |
| DB-025 | `login_history` | User authentication records | IP, device, timestamp | 🟩 Built |
| DB-026 | `organizations` | Legal corporate entities | Multi-tenant parent | 🟩 Built |
| DB-027 | `password_history` | Historic password hashes | Enforces no re-use policy | 🟩 Built |
| DB-028 | `password_policies` | Security constraints | Complexity & rotation days | 🟩 Built |
| DB-029 | `permissions` | Granular action keys | Unique permission code | 🟩 Built |
| DB-030 | `plants` | Manufacturing / branch units | Operational plant codes | 🟩 Built |
| DB-031 | `production_consumptions` | Raw material usage log | FIFO batch consumption | 🟩 Built |
| DB-032 | `production_order_materials` | Allocated materials | Target vs consumed qty | 🟩 Built |
| DB-033 | `production_orders` | Production work orders | Scheduled date & status | 🟩 Built |
| DB-034 | `purchase_order_items` | PO line items | Rate, tax, quantity | 🟩 Built |
| DB-035 | `purchase_orders` | Inbound purchase orders | Vendor FK, approval state | 🟩 Built |
| DB-036 | `purchase_requisition_items` | Requisition line items | Estimated cost, unit | 🟩 Built |
| DB-037 | `purchase_requisitions` | Internal PR workflow | Department & requestor FK | 🟩 Built |
| DB-038 | `putaway_tasks` | Inbound bin assignment | Suggested vs actual bin | 🟩 Built |
| DB-039 | `quality_inspection_tests` | QC parameter tests | Tolerance bounds | 🟩 Built |
| DB-040 | `quality_inspections` | Inspection records | Pass/Reject threshold | 🟩 Built |
| DB-041 | `returns_log` | Customer & vendor returns | Reason code, condition | 🟩 Built |
| DB-042 | `role_permissions` | RBAC mapping table | Composite `(role_id, perm_id)` | 🟩 Built |
| DB-043 | `roles` | System roles definition | Admin, Stores, Advisor, etc. | 🟩 Built |
| DB-044 | `routing_headers` | Manufacturing routing ops | Versioned production steps | 🟩 Built |
| DB-045 | `routing_operations` | Individual workstation steps| Sequence index & standard time | 🟩 Built |
| DB-046 | `sales_order_items` | Outbound sales lines | Pricing, discounts, GST | 🟩 Built |
| DB-047 | `sales_orders` | Outbound customer orders | Credit status & delivery | 🟩 Built |
| DB-048 | `shipment_items` | Gate pass dispatch items | Barcode/Serial tracking | 🟩 Built |
| DB-049 | `shipments` | Vehicle gate out passes | Transporter & vehicle number | 🟩 Built |
| DB-050 | `sod_rules` | Segregation of Duties matrix| Incompatible role pairs | 🟩 Built |
| DB-051 | `stock_adjustments` | Audit adjustments | Positive/Negative quantity | 🟩 Built |
| DB-052 | `stock_count_items` | Physical inventory count | System vs counted variance | 🟩 Built |
| DB-053 | `stock_count_plans` | Scheduled cycle counts | Frequency & warehouse scope | 🟩 Built |
| DB-054 | `stock_transfer_items` | Inter-branch transferred SKU | Shipped vs received qty | 🟩 Built |
| DB-055 | `stock_transfers` | Inter-facility shipments | Transit status tracking | 🟩 Built |
| DB-056 | `supplier_items` | Supplier catalog & lead times| Vendor item code mapping | 🟩 Built |
| DB-057 | `suppliers` | Vendor master | GSTIN, MSME, Bank details | 🟩 Built |
| DB-058 | `system_actions` | High-level operations | System action definition | 🟩 Built |
| DB-059 | `system_functions` | Business function grouping | Module subsystem grouping | 🟩 Built |
| DB-060 | `system_modules` | Top-level sidebar modules | Navigation ordering index | 🟩 Built |
| DB-061 | `system_sub_modules` | Granular sub-navigation | Routes & parent module FK | 🟩 Built |
| DB-062 | `uom_master` | Unit of Measurement | Base unit & conversion factor | 🟩 Built |
| DB-063 | `user_facilities` | User branch access mapping | Composite `(user_id, plant_id)` | 🟩 Built |
| DB-064 | `user_organizations` | User company assignment | Composite key | 🟩 Built |
| DB-065 | `user_plants` | Plant authorization | Multi-plant assignment | 🟩 Built |
| DB-066 | `user_roles` | User role mapping | Composite `(user_id, role_id)` | 🟩 Built |
| DB-067 | `user_sessions` | Active JWT tokens & sessions | Expiry & device fingerprint | 🟩 Built |
| DB-068 | `users` | User credentials & accounts | Unique username/email/mobile | 🟩 Built |
| DB-069 | `warehouse_bins` | Lowest storage unit | Capacity & coordinates | 🟩 Built |
| DB-070 | `warehouse_zones` | High-level storage zones | Ambient, cold, hazmat | 🟩 Built |
| DB-071 | `warehouses` | Physical storage sites | Facility reference & address | 🟩 Built |

