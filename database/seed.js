/* ==========================================================================
   STOCKIQ - POSTGRESQL DATA SEEDER
   Populates PostgreSQL database with all 40 enterprise master and transactional
   collections from js/data/mock-data.js
   Usage: node database/seed.js
   ========================================================================== */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('./pg');
const rawMock = require('../js/data/mock-data.js');
const mockData = rawMock.INITIAL_DATA || rawMock;

async function seedTable(client, tableName, columns, rows, onConflict = 'ON CONFLICT (id) DO NOTHING') {
  if (!rows || rows.length === 0) return 0;
  let inserted = 0;

  for (const row of rows) {
    const colNames = [];
    const values = [];
    const placeholders = [];

    columns.forEach((col, idx) => {
      let val = row[col];
      if (val === undefined) val = null;
      if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
        val = JSON.stringify(val);
      }
      colNames.push(`"${col}"`);
      values.push(val);
      placeholders.push(`$${idx + 1}`);
    });

    const sql = `INSERT INTO ${tableName} (${colNames.join(', ')}) VALUES (${placeholders.join(', ')}) ${onConflict};`;
    try {
      await client.query(sql, values);
      inserted++;
    } catch (e) {
      console.warn(`    ⚠️ Notice in ${tableName}: ${e.message}`);
    }
  }
  return inserted;
}

async function runSeeder(externalClient = null) {
  const isStandalone = !externalClient;
  const client = externalClient || await pool.connect();
  const report = {};

  try {
    if (isStandalone) {
      console.log('🌱 Starting StockIQ PostgreSQL Data Seeder...');
    }

    // Clean existing tables to remove non-2W data
    try {
      await client.query(`
        TRUNCATE TABLE 
          audit_logs,
          access_requests,
          approval_delegations,
          approval_authorities,
          sod_rules,
          role_permissions,
          shipments,
          sales_orders,
          production_orders,
          putaway_tasks,
          quality_inspections,
          goods_receipt_items,
          goods_receipts,
          purchase_order_lines,
          purchase_orders,
          purchase_requisition_items,
          purchase_requisitions,
          inventory_balances,
          bom_items,
          bom_headers,
          items,
          item_categories,
          warehouse_bins,
          warehouse_zones,
          warehouses,
          departments,
          plants,
          companies,
          roles,
          users,
          permissions
        CASCADE;
      `);
    } catch (truncErr) {
      // Ignore if some tables do not exist yet
    }

    // 1. Multi-Tier Organization Hierarchy
    report['companies'] = await seedTable(client, 'companies',
      ['id', 'code', 'name', 'tax_id', 'currency', 'is_active'],
      mockData.companies
    );

    report['plants'] = await seedTable(client, 'plants',
      ['id', 'company_id', 'code', 'name', 'plant_type', 'address', 'city', 'state', 'country', 'is_active'],
      mockData.plants
    );

    report['departments'] = await seedTable(client, 'departments',
      ['id', 'plant_id', 'code', 'name', 'cost_center_code', 'manager_name', 'is_active'],
      mockData.departments
    );

    report['warehouses'] = await seedTable(client, 'warehouses',
      ['id', 'plant_id', 'code', 'name', 'warehouse_type', 'storage_capacity_cbm', 'manager_name', 'is_active'],
      mockData.warehouses
    );

    report['warehouse_zones'] = await seedTable(client, 'warehouse_zones',
      ['id', 'warehouse_id', 'code', 'name', 'zone_type'],
      mockData.zones
    );

    report['warehouse_bins'] = await seedTable(client, 'warehouse_bins',
      ['id', 'zone_id', 'warehouse_id', 'code', 'rack', 'shelf', 'bin_number', 'max_weight_kg', 'max_volume_cbm', 'is_occupied', 'is_active'],
      mockData.bins
    );

    // 2. Master Data
    report['item_categories'] = await seedTable(client, 'item_categories',
      ['id', 'code', 'name', 'description'],
      mockData.itemCategories
    );

    report['items'] = await seedTable(client, 'items',
      ['id', 'code', 'name', 'description', 'category_id', 'item_type', 'base_uom', 'valuation_method', 'standard_cost', 'last_purchase_price', 'min_stock_qty', 'max_stock_qty', 'reorder_level', 'safety_stock_qty', 'lead_time_days', 'moq', 'is_batch_controlled', 'is_serial_controlled', 'has_expiry', 'shelf_life_days', 'hsn_code', 'is_active'],
      mockData.items.map(i => ({
        ...i,
        min_stock_qty: i.min_stock_qty ?? i.min_stock ?? 10,
        max_stock_qty: i.max_stock_qty ?? i.max_stock ?? 100,
        safety_stock_qty: i.safety_stock_qty ?? i.safety_stock ?? 5,
        is_active: i.is_active !== undefined ? i.is_active : true
      }))
    );

    report['suppliers'] = await seedTable(client, 'suppliers',
      ['id', 'code', 'name', 'category', 'contact_person', 'email', 'phone', 'address', 'city', 'tax_id', 'rating', 'payment_terms_days', 'is_approved', 'is_active'],
      mockData.suppliers
    );

    report['customers'] = await seedTable(client, 'customers',
      ['id', 'code', 'name', 'category', 'contact_person', 'email', 'phone', 'shipping_address', 'tax_id', 'credit_limit', 'payment_terms_days', 'is_active'],
      mockData.customers
    );

    // 3. Security, RBAC & Users
    report['roles'] = await seedTable(client, 'roles',
      ['id', 'code', 'name', 'description', 'role_type', 'is_system', 'status', 'user_count'],
      mockData.roles
    );

    report['users'] = await seedTable(client, 'users',
      [
        'id', 'employee_id', 'username', 'password_hash', 'password_salt', 'password_history',
        'email', 'full_name', 'first_name', 'middle_name', 'last_name', 'display_name',
        'mobile_number', 'department', 'designation', 'user_type', 'specialty',
        'company_id', 'plant_id', 'warehouse_id', 'reporting_manager', 'primary_role_id',
        'status', 'effective_from', 'effective_to', 'failed_logins', 'two_factor_enabled',
        'must_change_password', 'password_last_changed', 'assigned_plants'
      ],
      mockData.users
    );

    report['permissions'] = await seedTable(client, 'permissions',
      ['id', 'module', 'perm_code', 'name', 'description', 'risk_level'],
      mockData.permissions
    );

    report['role_permissions'] = await seedTable(client, 'role_permissions',
      ['role_id', 'perm_code', 'view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject', 'cancel', 'print', 'export', 'import', 'post', 'reverse', 'close', 'reopen'],
      mockData.role_permissions,
      'ON CONFLICT (role_id, perm_code) DO NOTHING'
    );

    report['sod_rules'] = await seedTable(client, 'sod_rules',
      ['id', 'code', 'description', 'conflicting_role_1', 'conflicting_role_2', 'risk_level', 'mitigation_control', 'status'],
      mockData.sod_rules
    );

    report['approval_authorities'] = await seedTable(client, 'approval_authorities',
      ['id', 'role_id', 'transaction_type', 'max_amount', 'requires_dual_approval', 'status'],
      mockData.approval_authorities
    );

    report['approval_delegations'] = await seedTable(client, 'approval_delegations',
      ['id', 'delegator_user_id', 'delegatee_user_id', 'role_id', 'start_date', 'end_date', 'justification', 'status'],
      mockData.approval_delegations
    );

    report['access_requests'] = await seedTable(client, 'access_requests',
      ['id', 'request_number', 'user_id', 'requested_role_id', 'requested_warehouse_id', 'reason', 'status', 'manager_reviewer_id', 'comments', 'created_at'],
      mockData.access_requests
    );

    if (mockData.password_policies) {
      report['password_policies'] = await seedTable(client, 'password_policies',
        ['id', 'min_length', 'require_uppercase', 'require_lowercase', 'require_number', 'require_special_char', 'expiry_days', 'history_limit', 'lockout_threshold', 'lockout_duration_mins'],
        [{ id: 'POL-01', ...mockData.password_policies }]
      );
    }

    report['user_sessions'] = await seedTable(client, 'user_sessions',
      ['id', 'user_id', 'session_token', 'ip_address', 'device_info', 'login_time', 'last_activity', 'status'],
      mockData.user_sessions
    );

    report['login_history'] = await seedTable(client, 'login_history',
      ['id', 'timestamp', 'user_id', 'user_name', 'ip_address', 'device_info', 'status', 'failure_reason'],
      mockData.login_history
    );

    // 4. Bills of Materials
    if (mockData.boms) {
      report['bom_headers'] = await seedTable(client, 'bom_headers',
        ['id', 'bom_number', 'item_id', 'version', 'description', 'base_quantity', 'is_active'],
        mockData.boms.map(b => ({
          id: b.id,
          bom_number: b.bom_number,
          item_id: b.item_id,
          version: b.version,
          description: b.description,
          base_quantity: b.base_qty,
          is_active: true
        }))
      );

      const bomItemsFlat = [];
      mockData.boms.forEach(b => {
        if (b.components) {
          b.components.forEach((c, idx) => {
            bomItemsFlat.push({
              id: `${b.id}-ITM-${idx + 1}`,
              bom_id: b.id,
              component_item_id: c.item_id,
              quantity_required: c.qty,
              scrap_allowance_percent: c.scrap_pct || 0,
              uom: c.uom || 'NOS',
              sequence_order: idx + 1
            });
          });
        }
      });
      report['bom_items'] = await seedTable(client, 'bom_items',
        ['id', 'bom_id', 'component_item_id', 'quantity_required', 'scrap_allowance_percent', 'uom', 'sequence_order'],
        bomItemsFlat
      );
    }

    // 5. Inventory Balances
    report['inventory_balances'] = await seedTable(client, 'inventory_balances',
      ['id', 'plant_id', 'warehouse_id', 'item_id', 'batch_number', 'serial_number', 'quantity_on_hand', 'quantity_allocated', 'quantity_available', 'quantity_in_quarantine', 'valuation_rate', 'last_counted_at'],
      mockData.inventoryBalances.map(b => ({
        ...b,
        quantity_on_hand: b.on_hand || 0,
        quantity_allocated: b.reserved || 0,
        quantity_available: b.available || 0,
        quantity_in_quarantine: 0,
        valuation_rate: b.valuation_rate || 0,
        last_counted_at: new Date().toISOString()
      }))
    );

    // 6. Procurement & Orders
    if (mockData.requisitions) {
      report['purchase_requisitions'] = await seedTable(client, 'purchase_requisitions',
        ['id', 'pr_number', 'plant_id', 'department_id', 'requested_by', 'required_date', 'priority', 'status', 'justification', 'created_at', 'approved_by', 'approved_at'],
        mockData.requisitions
      );

      const prItemsFlat = [];
      mockData.requisitions.forEach(pr => {
        if (pr.items) {
          pr.items.forEach((it, idx) => {
            prItemsFlat.push({
              id: `${pr.id}-ITM-${idx + 1}`,
              pr_id: pr.id,
              item_id: it.item_id,
              quantity: it.quantity,
              uom: it.uom || 'NOS',
              estimated_rate: it.estimated_rate || 0,
              suggested_supplier_id: it.suggested_supplier_id || null,
              status: it.status || 'OPEN'
            });
          });
        }
      });
      report['purchase_requisition_items'] = await seedTable(client, 'purchase_requisition_items',
        ['id', 'pr_id', 'item_id', 'quantity', 'uom', 'estimated_rate', 'suggested_supplier_id', 'status'],
        prItemsFlat
      );
    }

    if (mockData.purchaseOrders) {
      report['purchase_orders'] = await seedTable(client, 'purchase_orders',
        ['id', 'po_number', 'supplier_id', 'plant_id', 'pr_id', 'order_date', 'expected_delivery_date', 'payment_terms', 'subtotal', 'tax_amount', 'total_amount', 'status', 'approved_by', 'approved_at'],
        mockData.purchaseOrders.map(po => ({
          ...po,
          expected_delivery_date: po.expected_delivery
        }))
      );

      const poItemsFlat = [];
      mockData.purchaseOrders.forEach(po => {
        if (po.items) {
          po.items.forEach((it, idx) => {
            poItemsFlat.push({
              id: `${po.id}-ITM-${idx + 1}`,
              po_id: po.id,
              item_id: it.item_id,
              order_quantity: it.order_quantity,
              received_quantity: it.received_quantity || 0,
              uom: it.uom || 'NOS',
              unit_price: it.unit_price || 0,
              line_total: it.line_total || 0
            });
          });
        }
      });
      report['purchase_order_items'] = await seedTable(client, 'purchase_order_items',
        ['id', 'po_id', 'item_id', 'order_quantity', 'received_quantity', 'uom', 'unit_price', 'line_total'],
        poItemsFlat
      );
    }

    // 7. Goods Receipt Notes
    if (mockData.goodsReceipts) {
      report['goods_receipt_notes'] = await seedTable(client, 'goods_receipt_notes',
        ['id', 'grn_number', 'po_id', 'plant_id', 'warehouse_id', 'supplier_id', 'challan_no', 'invoice_no', 'vehicle_no', 'received_date', 'received_by', 'inspection_status', 'remarks'],
        mockData.goodsReceipts
      );
    }

    // 8. Quality Inspections
    if (mockData.qualityInspections) {
      report['quality_inspections'] = await seedTable(client, 'quality_inspections',
        ['id', 'inspection_number', 'plant_id', 'inspection_type', 'reference_doc_id', 'item_id', 'batch_number', 'sample_size', 'inspected_quantity', 'accepted_quantity', 'rejected_quantity', 'quarantined_quantity', 'inspection_status', 'inspector_name', 'inspected_at', 'coa_available', 'remarks'],
        mockData.qualityInspections
      );
    }

    // 9. Putaway Tasks
    if (mockData.putawayTasks) {
      report['putaway_tasks'] = await seedTable(client, 'putaway_tasks',
        ['id', 'task_number', 'grn_id', 'plant_id', 'warehouse_id', 'item_id', 'quantity', 'uom', 'target_bin_id', 'status', 'assigned_to', 'completed_at'],
        mockData.putawayTasks
      );
    }

    // 10. Production Orders
    if (mockData.productionOrders) {
      report['production_orders'] = await seedTable(client, 'production_orders',
        ['id', 'order_number', 'plant_id', 'item_id', 'bom_id', 'target_quantity', 'completed_quantity', 'scrapped_quantity', 'planned_start_date', 'planned_end_date', 'actual_start_date', 'priority', 'status'],
        mockData.productionOrders.map(p => ({
          ...p,
          target_quantity: p.target_qty,
          completed_quantity: p.completed_qty,
          scrapped_quantity: p.scrapped_qty,
          planned_start_date: p.planned_start,
          planned_end_date: p.planned_end,
          actual_start_date: p.actual_start
        }))
      );
    }

    // 11. Sales Orders & Shipments
    if (mockData.salesOrders) {
      report['sales_orders'] = await seedTable(client, 'sales_orders',
        ['id', 'so_number', 'customer_id', 'plant_id', 'order_date', 'delivery_due_date', 'total_amount', 'status'],
        mockData.salesOrders
      );
    }

    if (mockData.shipments) {
      report['shipments'] = await seedTable(client, 'shipments',
        ['id', 'shipment_number', 'so_id', 'customer_id', 'transporter_name', 'vehicle_number', 'gate_pass_number', 'status'],
        mockData.shipments.map(s => ({
          id: s.id,
          shipment_number: s.shipment_number,
          so_id: s.so_id,
          customer_id: s.customer_id,
          transporter_name: s.carrier || 'FastTrack Freight',
          vehicle_number: s.tracking_no || 'MH-12-AB-1001',
          gate_pass_number: `GP-${s.id}`,
          status: s.status || 'READY'
        }))
      );
    }

    // 12. Auditing
    report['audit_logs'] = await seedTable(client, 'audit_logs',
      ['id', 'user_id', 'user_name', 'role', 'action', 'module', 'record_id', 'details'],
      mockData.auditLogs
    );

    if (isStandalone) {
      console.log('\n====================================================');
      console.log('✅ PostgreSQL Database Seeding Complete!');
      console.log('====================================================');
      for (const [tbl, count] of Object.entries(report)) {
        console.log(`  ✓ ${tbl.padEnd(30)}: ${count} rows seeded`);
      }
    }

    return report;
  } catch (err) {
    if (isStandalone) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Seeder Error:', err);
    throw err;
  } finally {
    if (isStandalone) {
      client.release();
    }
  }
}

// Generate static database/seed.sql script
function generateSeedSqlFile() {
  const outputPath = path.join(__dirname, 'seed.sql');
  console.log(`📝 Generating static seed SQL to: ${outputPath}...`);
  
  let sqlContent = `-- ============================================================================
-- STOCKIQ ENTERPRISE - POSTGRESQL INITIAL SEED DATA
-- Generated from js/data/mock-data.js
-- ============================================================================

BEGIN;

`;

  function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return `'${String(val).replace(/'/g, "''")}'`;
  }

  function appendInserts(tableName, columns, rows, onConflict = 'ON CONFLICT (id) DO NOTHING') {
    if (!rows || rows.length === 0) return;
    sqlContent += `-- Table: ${tableName} (${rows.length} rows)\n`;
    const quotedCols = columns.map(c => `"${c}"`);
    for (const row of rows) {
      const vals = columns.map(col => escapeSql(row[col]));
      sqlContent += `INSERT INTO ${tableName} (${quotedCols.join(', ')}) VALUES (${vals.join(', ')}) ${onConflict};\n`;
    }
    sqlContent += '\n';
  }

  appendInserts('companies', ['id', 'code', 'name', 'tax_id', 'currency', 'is_active'], mockData.companies);
  appendInserts('plants', ['id', 'company_id', 'code', 'name', 'plant_type', 'address', 'city', 'state', 'country', 'is_active'], mockData.plants);
  appendInserts('departments', ['id', 'plant_id', 'code', 'name', 'cost_center_code', 'manager_name', 'is_active'], mockData.departments);
  appendInserts('warehouses', ['id', 'plant_id', 'code', 'name', 'warehouse_type', 'storage_capacity_cbm', 'manager_name', 'is_active'], mockData.warehouses);
  appendInserts('warehouse_zones', ['id', 'warehouse_id', 'code', 'name', 'zone_type'], mockData.zones);
  appendInserts('warehouse_bins', ['id', 'zone_id', 'warehouse_id', 'code', 'rack', 'shelf', 'bin_number', 'max_weight_kg', 'max_volume_cbm', 'is_occupied', 'is_active'], mockData.bins);
  appendInserts('item_categories', ['id', 'code', 'name', 'description'], mockData.itemCategories);
  appendInserts('items', ['id', 'code', 'name', 'description', 'category_id', 'item_type', 'base_uom', 'valuation_method', 'standard_cost', 'last_purchase_price', 'min_stock_qty', 'max_stock_qty', 'reorder_level', 'safety_stock_qty', 'lead_time_days', 'moq', 'is_batch_controlled', 'is_serial_controlled', 'has_expiry', 'shelf_life_days', 'hsn_code', 'is_active'], mockData.items.map(i => ({
    ...i,
    min_stock_qty: i.min_stock_qty ?? i.min_stock ?? 10,
    max_stock_qty: i.max_stock_qty ?? i.max_stock ?? 100,
    safety_stock_qty: i.safety_stock_qty ?? i.safety_stock ?? 5,
    is_active: i.is_active !== undefined ? i.is_active : true
  })));
  appendInserts('suppliers', ['id', 'code', 'name', 'category', 'contact_person', 'email', 'phone', 'address', 'city', 'tax_id', 'rating', 'payment_terms_days', 'is_approved', 'is_active'], mockData.suppliers);
  appendInserts('customers', ['id', 'code', 'name', 'category', 'contact_person', 'email', 'phone', 'shipping_address', 'tax_id', 'credit_limit', 'payment_terms_days', 'is_active'], mockData.customers);
  appendInserts('roles', ['id', 'code', 'name', 'description', 'role_type', 'is_system', 'status', 'user_count'], mockData.roles);
  appendInserts('users', ['id', 'username', 'email', 'full_name', 'mobile_number', 'department', 'designation', 'company_id', 'plant_id', 'warehouse_id', 'reporting_manager', 'status', 'effective_from', 'effective_to', 'failed_logins', 'two_factor_enabled'], mockData.users);
  appendInserts('permissions', ['id', 'module', 'perm_code', 'name', 'description', 'risk_level'], mockData.permissions);
  appendInserts('role_permissions', ['role_id', 'perm_code', 'view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject', 'cancel', 'print', 'export', 'import', 'post', 'reverse', 'close', 'reopen'], mockData.role_permissions, 'ON CONFLICT (role_id, perm_code) DO NOTHING');
  appendInserts('sod_rules', ['id', 'code', 'description', 'conflicting_role_1', 'conflicting_role_2', 'risk_level', 'mitigation_control', 'status'], mockData.sod_rules);
  appendInserts('approval_authorities', ['id', 'role_id', 'transaction_type', 'max_amount', 'requires_dual_approval', 'status'], mockData.approval_authorities);
  appendInserts('approval_delegations', ['id', 'delegator_user_id', 'delegatee_user_id', 'role_id', 'start_date', 'end_date', 'justification', 'status'], mockData.approval_delegations);
  appendInserts('access_requests', ['id', 'request_number', 'user_id', 'requested_role_id', 'requested_warehouse_id', 'reason', 'status', 'manager_reviewer_id', 'comments', 'created_at'], mockData.access_requests);
  appendInserts('inventory_balances', ['id', 'plant_id', 'warehouse_id', 'item_id', 'batch_number', 'serial_number', 'quantity_on_hand', 'quantity_allocated', 'quantity_available', 'quantity_in_quarantine', 'last_counted_at'], mockData.inventoryBalances);
  appendInserts('audit_logs', ['id', 'user_id', 'user_name', 'role', 'action', 'module', 'record_id', 'details'], mockData.auditLogs);

  if (mockData.boms) {
    appendInserts('bom_headers', ['id', 'bom_number', 'item_id', 'version', 'description', 'base_quantity', 'is_active'],
      mockData.boms.map(b => ({ id: b.id, bom_number: b.bom_number, item_id: b.item_id, version: b.version, description: b.description, base_quantity: b.base_qty, is_active: true }))
    );
  }

  if (mockData.requisitions) {
    appendInserts('purchase_requisitions', ['id', 'pr_number', 'plant_id', 'department_id', 'requested_by', 'required_date', 'priority', 'status', 'justification', 'created_at', 'approved_by', 'approved_at'], mockData.requisitions);
  }

  if (mockData.purchaseOrders) {
    appendInserts('purchase_orders', ['id', 'po_number', 'supplier_id', 'plant_id', 'pr_id', 'order_date', 'expected_delivery_date', 'payment_terms', 'subtotal', 'tax_amount', 'total_amount', 'status', 'approved_by', 'approved_at'],
      mockData.purchaseOrders.map(po => ({ ...po, expected_delivery_date: po.expected_delivery }))
    );
  }

  if (mockData.goodsReceipts) {
    appendInserts('goods_receipt_notes', ['id', 'grn_number', 'po_id', 'plant_id', 'warehouse_id', 'supplier_id', 'challan_no', 'invoice_no', 'vehicle_no', 'received_date', 'received_by', 'inspection_status', 'remarks'], mockData.goodsReceipts);
  }

  if (mockData.qualityInspections) {
    appendInserts('quality_inspections', ['id', 'inspection_number', 'plant_id', 'inspection_type', 'reference_doc_id', 'item_id', 'batch_number', 'sample_size', 'inspected_quantity', 'accepted_quantity', 'rejected_quantity', 'quarantined_quantity', 'inspection_status', 'inspector_name', 'inspected_at', 'coa_available', 'remarks'], mockData.qualityInspections);
  }

  if (mockData.productionOrders) {
    appendInserts('production_orders', ['id', 'order_number', 'plant_id', 'item_id', 'bom_id', 'target_quantity', 'completed_quantity', 'scrapped_quantity', 'planned_start_date', 'planned_end_date', 'actual_start_date', 'priority', 'status'],
      mockData.productionOrders.map(p => ({ ...p, target_quantity: p.target_qty, completed_quantity: p.completed_qty, scrapped_quantity: p.scrapped_qty, planned_start_date: p.planned_start, planned_end_date: p.planned_end, actual_start_date: p.actual_start }))
    );
  }

  if (mockData.salesOrders) {
    appendInserts('sales_orders', ['id', 'so_number', 'customer_id', 'plant_id', 'order_date', 'delivery_due_date', 'total_amount', 'status'], mockData.salesOrders);
  }

  if (mockData.shipments) {
    appendInserts('shipments', ['id', 'shipment_number', 'so_id', 'customer_id', 'transporter_name', 'vehicle_number', 'gate_pass_number', 'status'],
      mockData.shipments.map(s => ({
        id: s.id,
        shipment_number: s.shipment_number,
        so_id: s.so_id,
        customer_id: s.customer_id,
        transporter_name: s.carrier || 'FastTrack Freight',
        vehicle_number: s.tracking_no || 'MH-12-AB-1001',
        gate_pass_number: `GP-${s.id}`,
        status: s.status || 'READY'
      }))
    );
  }

  sqlContent += 'COMMIT;\n';
  fs.writeFileSync(outputPath, sqlContent, 'utf-8');
  console.log(`✓ Generated ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
}

if (require.main === module) {
  generateSeedSqlFile();
  testConnection().then(async (res) => {
    if (res.connected) {
      await runSeeder();
      process.exit(0);
    } else {
      console.log('\n💡 Note: PostgreSQL connection not established. Static seed.sql has been generated.');
      console.log('   Once your PostgreSQL server is running, execute: npm run db:init');
      process.exit(0);
    }
  });
}

module.exports = { runSeeder, generateSeedSqlFile };
