-- ============================================================================
-- ENTERPRISE INVENTORY & SUPPLY CHAIN MANAGEMENT SYSTEM (ISCM)
-- Complete Relational Database Schema (PostgreSQL Standard)
-- Compliant with 38-Section Manufacturing Supply Chain BRD
-- ============================================================================

-- PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. MULTI-TIER ORGANIZATION & LOCATION HIERARCHY
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facilities (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL REFERENCES companies(id),
    code VARCHAR(30) UNIQUE NOT NULL,
    facility_code VARCHAR(30),
    name VARCHAR(150) NOT NULL,
    facility_type VARCHAR(50) DEFAULT 'TWO_WHEELER_WORKSHOP', -- TWO_WHEELER_WORKSHOP, MANUFACTURING, ASSEMBLY
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(20),
    gstin VARCHAR(50),
    contact_person VARCHAR(100),
    mobile_number VARCHAR(30),
    is_gst_applicable BOOLEAN DEFAULT TRUE,
    gst_applicable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backward compatibility view
CREATE OR REPLACE VIEW plants AS SELECT *, facility_code AS branch_code, facility_type AS plant_type FROM facilities;

CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    facility_id VARCHAR(36) REFERENCES facilities(id),
    plant_id VARCHAR(36) REFERENCES facilities(id),
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    cost_center_code VARCHAR(50),
    manager_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(36) PRIMARY KEY,
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    warehouse_type VARCHAR(50) NOT NULL, -- RAW_MATERIAL, WIP_STORE, FINISHED_GOODS, QUARANTINE, PACKAGING, SPARES
    storage_capacity_cbm NUMERIC(12, 2) DEFAULT 0,
    manager_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plant_id, code)
);

CREATE TABLE IF NOT EXISTS warehouse_zones (
    id VARCHAR(36) PRIMARY KEY,
    warehouse_id VARCHAR(36) NOT NULL REFERENCES warehouses(id),
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50) DEFAULT 'STORAGE', -- RECEIVING, STORAGE, PICKING, STAGING, QUARANTINE
    UNIQUE(warehouse_id, code)
);

CREATE TABLE IF NOT EXISTS warehouse_bins (
    id VARCHAR(36) PRIMARY KEY,
    zone_id VARCHAR(36) NOT NULL REFERENCES warehouse_zones(id),
    warehouse_id VARCHAR(36) NOT NULL REFERENCES warehouses(id),
    code VARCHAR(50) NOT NULL, -- e.g. RMS-Z1-R02-S03-B04
    rack VARCHAR(20),
    shelf VARCHAR(20),
    bin_number VARCHAR(20),
    max_weight_kg NUMERIC(10, 2) DEFAULT 1000.00,
    max_volume_cbm NUMERIC(10, 2) DEFAULT 10.00,
    is_occupied BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(warehouse_id, code)
);

-- ----------------------------------------------------------------------------
-- 2. ITEM & MASTER DATA MANAGEMENT
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS item_categories (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id VARCHAR(36) REFERENCES item_categories(id)
);

CREATE TABLE IF NOT EXISTS uom_master (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- KG, NOS, MTR, LTR, SET, BOX
    name VARCHAR(100) NOT NULL,
    uom_type VARCHAR(50) NOT NULL -- WEIGHT, COUNT, LENGTH, VOLUME
);

CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id VARCHAR(36) NOT NULL REFERENCES item_categories(id),
    item_type VARCHAR(50) NOT NULL, -- RAW_MATERIAL, SUB_ASSEMBLY, FINISHED_GOODS, CONSUMABLE, SPARE_PART
    base_uom VARCHAR(20) NOT NULL,
    valuation_method VARCHAR(20) DEFAULT 'FIFO', -- FIFO, WEIGHTED_AVG, STANDARD
    standard_cost NUMERIC(14, 4) DEFAULT 0.00,
    last_purchase_price NUMERIC(14, 4) DEFAULT 0.00,
    min_stock_qty NUMERIC(12, 2) DEFAULT 0,
    max_stock_qty NUMERIC(12, 2) DEFAULT 0,
    reorder_level NUMERIC(12, 2) DEFAULT 0,
    safety_stock_qty NUMERIC(12, 2) DEFAULT 0,
    lead_time_days INT DEFAULT 7,
    moq NUMERIC(12, 2) DEFAULT 1, -- Minimum Order Quantity
    is_batch_controlled BOOLEAN DEFAULT FALSE,
    is_serial_controlled BOOLEAN DEFAULT FALSE,
    has_expiry BOOLEAN DEFAULT FALSE,
    shelf_life_days INT DEFAULT 0,
    hsn_code VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50), -- OEM, DISTRIBUTOR, FABRICATOR, RAW_MATERIAL
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    city VARCHAR(100),
    tax_id VARCHAR(50),
    rating NUMERIC(3, 2) DEFAULT 4.5, -- 1.0 to 5.0
    payment_terms_days INT DEFAULT 30,
    is_approved BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_items (
    id VARCHAR(36) PRIMARY KEY,
    supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    supplier_part_number VARCHAR(100),
    unit_price NUMERIC(14, 4) NOT NULL,
    lead_time_days INT DEFAULT 7,
    moq NUMERIC(12, 2) DEFAULT 1,
    is_preferred BOOLEAN DEFAULT FALSE,
    UNIQUE(supplier_id, item_id)
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50), -- TIER1_OEM, AFTERMARKET, EXPORT
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(30),
    shipping_address TEXT,
    tax_id VARCHAR(50),
    credit_limit NUMERIC(14, 2) DEFAULT 5000000.00,
    payment_terms_days INT DEFAULT 45,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. BILL OF MATERIALS (BOM) & MANUFACTURING ROUTING
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bom_headers (
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36) NOT NULL REFERENCES items(id), -- Finished Good / Sub-Assembly
    bom_number VARCHAR(50) UNIQUE NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    description TEXT,
    base_quantity NUMERIC(10, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bom_items (
    id VARCHAR(36) PRIMARY KEY,
    bom_id VARCHAR(36) NOT NULL REFERENCES bom_headers(id),
    component_item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    quantity_required NUMERIC(12, 4) NOT NULL,
    scrap_allowance_percent NUMERIC(5, 2) DEFAULT 0.00,
    uom VARCHAR(20) NOT NULL,
    sequence_order INT DEFAULT 1,
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS routing_headers (
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    routing_number VARCHAR(50) UNIQUE NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS routing_operations (
    id VARCHAR(36) PRIMARY KEY,
    routing_id VARCHAR(36) NOT NULL REFERENCES routing_headers(id),
    operation_sequence INT NOT NULL,
    operation_name VARCHAR(100) NOT NULL, -- e.g. CNC Turning, Milling, Induction Hardening, QA
    work_center_name VARCHAR(100),
    setup_time_mins INT DEFAULT 15,
    run_time_per_unit_mins NUMERIC(8, 2) DEFAULT 5.00,
    description TEXT
);

-- ----------------------------------------------------------------------------
-- 4. PROCUREMENT: REQUISITION, ORDER & INWARD (GRN)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id VARCHAR(36) PRIMARY KEY,
    pr_number VARCHAR(50) UNIQUE NOT NULL,
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    department_id VARCHAR(36) NOT NULL REFERENCES departments(id),
    requested_by VARCHAR(100) NOT NULL,
    required_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL', -- DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, PO_CREATED
    justification TEXT,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_requisition_items (
    id VARCHAR(36) PRIMARY KEY,
    pr_id VARCHAR(36) NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    quantity NUMERIC(12, 2) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    estimated_rate NUMERIC(14, 4),
    suggested_supplier_id VARCHAR(36) REFERENCES suppliers(id),
    status VARCHAR(30) DEFAULT 'OPEN'
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(36) PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    pr_id VARCHAR(36) REFERENCES purchase_requisitions(id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    payment_terms VARCHAR(100),
    incoterms VARCHAR(50) DEFAULT 'EXW', -- FOB, CIF, EXW
    subtotal_amount NUMERIC(14, 2) DEFAULT 0.00,
    subtotal NUMERIC(14, 2) DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_amount NUMERIC(14, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'DRAFT', -- DRAFT, PENDING_APPROVAL, APPROVED, PARTIALLY_RECEIVED, FULLY_RECEIVED, CANCELLED, CLOSED
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id VARCHAR(36) PRIMARY KEY,
    po_id VARCHAR(36) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    ordered_qty NUMERIC(12, 2) NOT NULL,
    received_qty NUMERIC(12, 2) DEFAULT 0.00,
    uom VARCHAR(20) NOT NULL,
    unit_price NUMERIC(14, 4) NOT NULL,
    tax_percent NUMERIC(5, 2) DEFAULT 18.00,
    total_price NUMERIC(14, 2) NOT NULL,
    delivery_date DATE
);

CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id VARCHAR(36) PRIMARY KEY,
    grn_number VARCHAR(50) UNIQUE NOT NULL,
    po_id VARCHAR(36) REFERENCES purchase_orders(id),
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    warehouse_id VARCHAR(36) NOT NULL REFERENCES warehouses(id),
    supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
    delivery_challan_no VARCHAR(50),
    challan_no VARCHAR(50),
    invoice_no VARCHAR(50),
    vehicle_number VARCHAR(30),
    vehicle_no VARCHAR(30),
    received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_by VARCHAR(100) NOT NULL,
    inspection_status VARCHAR(30) DEFAULT 'PENDING_INSPECTION', -- PENDING_INSPECTION, INSPECTED, PUTAWAY_COMPLETED
    remarks TEXT,
    total_gross_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_discount_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_taxable_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_tax_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_net_amount NUMERIC(14, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS grn_items (
    id VARCHAR(36) PRIMARY KEY,
    grn_id VARCHAR(36) NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
    po_item_id VARCHAR(36) REFERENCES purchase_order_items(id),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    received_qty NUMERIC(12, 2) NOT NULL,
    accepted_qty NUMERIC(12, 2) DEFAULT 0.00,
    rejected_qty NUMERIC(12, 2) DEFAULT 0.00,
    quarantine_qty NUMERIC(12, 2) DEFAULT 0.00,
    uom VARCHAR(20) NOT NULL,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    gross_amount NUMERIC(14, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    taxable_amount NUMERIC(14, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    net_amount NUMERIC(14, 2) DEFAULT 0.00,
    batch_number VARCHAR(50),
    manufacturing_date DATE,
    expiry_date DATE,
    heat_number VARCHAR(50), -- For steel/metal parts
    inspection_result VARCHAR(30) DEFAULT 'PENDING'
);

-- ----------------------------------------------------------------------------
-- 5. QUALITY INSPECTION (QA / QC)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS quality_inspections (
    id VARCHAR(36) PRIMARY KEY,
    inspection_number VARCHAR(50) UNIQUE NOT NULL,
    plant_id VARCHAR(36) REFERENCES plants(id),
    inspection_type VARCHAR(30) NOT NULL, -- INCOMING, IN_PROCESS, FINAL_FG
    reference_doc_type VARCHAR(30) DEFAULT 'GRN', -- GRN, PRODUCTION_ORDER
    reference_doc_id VARCHAR(36),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(50),
    sample_size NUMERIC(12, 2) DEFAULT 0.00,
    inspected_quantity NUMERIC(12, 2) DEFAULT 0.00,
    accepted_quantity NUMERIC(12, 2) DEFAULT 0.00,
    rejected_quantity NUMERIC(12, 2) DEFAULT 0.00,
    quarantined_quantity NUMERIC(12, 2) DEFAULT 0.00,
    lot_quantity NUMERIC(12, 2) DEFAULT 0.00,
    accepted_qty NUMERIC(12, 2) DEFAULT 0.00,
    rejected_qty NUMERIC(12, 2) DEFAULT 0.00,
    quarantine_qty NUMERIC(12, 2) DEFAULT 0.00,
    defect_type VARCHAR(100),
    defect_notes TEXT,
    coa_number VARCHAR(100), -- Certificate of Analysis
    coa_available BOOLEAN DEFAULT FALSE,
    inspection_status VARCHAR(30) DEFAULT 'PENDING',
    status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, QUARANTINE
    inspector_name VARCHAR(100),
    remarks TEXT,
    inspected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quality_inspection_tests (
    id VARCHAR(36) PRIMARY KEY,
    inspection_id VARCHAR(36) NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL, -- e.g. Outer Diameter, Tensile Strength, Surface Roughness
    specification_target VARCHAR(100),
    min_tolerance VARCHAR(50),
    max_tolerance VARCHAR(50),
    observed_value VARCHAR(100) NOT NULL,
    test_result VARCHAR(20) NOT NULL -- PASS, FAIL
);

-- ----------------------------------------------------------------------------
-- 6. WAREHOUSE MANAGEMENT & PUTAWAY
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS putaway_tasks (
    id VARCHAR(36) PRIMARY KEY,
    task_number VARCHAR(50) UNIQUE NOT NULL,
    inspection_id VARCHAR(36) NOT NULL REFERENCES quality_inspections(id),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(50),
    quantity NUMERIC(12, 2) NOT NULL,
    source_dock_area VARCHAR(100) DEFAULT 'RECEIVING_DOCK',
    suggested_bin_id VARCHAR(36) NOT NULL REFERENCES warehouse_bins(id),
    actual_bin_id VARCHAR(36) REFERENCES warehouse_bins(id),
    status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
    completed_by VARCHAR(100),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. CENTRAL INVENTORY
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inventory_balances (
    id VARCHAR(36) PRIMARY KEY,
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    warehouse_id VARCHAR(36) NOT NULL REFERENCES warehouses(id),
    bin_id VARCHAR(36) REFERENCES warehouse_bins(id),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(50) DEFAULT 'DEFAULT',
    serial_number VARCHAR(50),
    quantity_on_hand NUMERIC(12, 2) DEFAULT 0.00,
    quantity_allocated NUMERIC(12, 2) DEFAULT 0.00,
    quantity_reserved NUMERIC(12, 2) DEFAULT 0.00,
    quantity_available NUMERIC(12, 2) DEFAULT 0.00,
    quantity_in_quarantine NUMERIC(12, 2) DEFAULT 0.00,
    stock_status VARCHAR(30) DEFAULT 'AVAILABLE', -- AVAILABLE, RESERVED, QUARANTINE, BLOCKED, IN_TRANSIT
    valuation_rate NUMERIC(14, 4) DEFAULT 0.00,
    manufacturing_date DATE,
    expiry_date DATE,
    last_counted_at TIMESTAMP,
    last_movement_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id VARCHAR(36) PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(40) NOT NULL, -- GRN_RECEIPT, PUTAWAY, PROD_ISSUE, PROD_CONSUMPTION, FG_RECEIPT, TRANSFER_DISPATCH, TRANSFER_RECEIPT, SALES_DISPATCH, ADJUSTMENT_IN, ADJUSTMENT_OUT, VENDOR_RETURN, CUST_RETURN
    reference_doc_type VARCHAR(40),
    reference_doc_no VARCHAR(50),
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    warehouse_id VARCHAR(36) NOT NULL REFERENCES warehouses(id),
    bin_id VARCHAR(36) REFERENCES warehouse_bins(id),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(50),
    serial_number VARCHAR(50),
    quantity NUMERIC(12, 2) NOT NULL,
    direction VARCHAR(10) NOT NULL, -- IN, OUT
    unit_cost NUMERIC(14, 4) DEFAULT 0.00,
    total_valuation NUMERIC(14, 2) DEFAULT 0.00,
    performed_by VARCHAR(100) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_batches (
    id VARCHAR(36) PRIMARY KEY,
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    supplier_id VARCHAR(36) REFERENCES suppliers(id),
    supplier_batch_no VARCHAR(50),
    grn_id VARCHAR(36) REFERENCES goods_receipt_notes(id),
    production_order_id VARCHAR(36),
    initial_quantity NUMERIC(12, 2) NOT NULL,
    current_quantity NUMERIC(12, 2) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    heat_treatment_lot VARCHAR(50),
    qc_certificate_no VARCHAR(50),
    status VARCHAR(30) DEFAULT 'APPROVED', -- APPROVED, QUARANTINE, EXPIRED, BLOCKED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. MANUFACTURING & PRODUCTION EXECUTION
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS production_orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id), -- FG or Sub-Assembly
    bom_id VARCHAR(36) NOT NULL REFERENCES bom_headers(id),
    target_quantity NUMERIC(12, 2) NOT NULL,
    completed_quantity NUMERIC(12, 2) DEFAULT 0.00,
    scrapped_quantity NUMERIC(12, 2) DEFAULT 0.00,
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_start_date TIMESTAMP,
    actual_end_date TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(30) DEFAULT 'PLANNED', -- PLANNED, RELEASED, IN_PROGRESS, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_order_materials (
    id VARCHAR(36) PRIMARY KEY,
    production_order_id VARCHAR(36) NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    component_item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    required_qty NUMERIC(12, 4) NOT NULL,
    reserved_qty NUMERIC(12, 4) DEFAULT 0.00,
    issued_qty NUMERIC(12, 4) DEFAULT 0.00,
    consumed_qty NUMERIC(12, 4) DEFAULT 0.00,
    scrapped_qty NUMERIC(12, 4) DEFAULT 0.00,
    uom VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS production_consumptions (
    id VARCHAR(36) PRIMARY KEY,
    consumption_number VARCHAR(50) UNIQUE NOT NULL,
    production_order_id VARCHAR(36) NOT NULL REFERENCES production_orders(id),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(50) NOT NULL,
    consumed_quantity NUMERIC(12, 4) NOT NULL,
    standard_quantity NUMERIC(12, 4) NOT NULL,
    variance_quantity NUMERIC(12, 4) NOT NULL,
    scrap_quantity NUMERIC(12, 4) DEFAULT 0.00,
    work_center_name VARCHAR(100),
    logged_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finished_goods_receipts (
    id VARCHAR(36) PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    production_order_id VARCHAR(36) NOT NULL REFERENCES production_orders(id),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    quantity_produced NUMERIC(12, 2) NOT NULL,
    generated_batch_number VARCHAR(50) NOT NULL,
    serial_numbers_list TEXT,
    manufacturing_date DATE,
    inspection_status VARCHAR(30) DEFAULT 'PENDING_QA',
    stored_warehouse_id VARCHAR(36) REFERENCES warehouses(id),
    stored_bin_id VARCHAR(36) REFERENCES warehouse_bins(id),
    logged_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. INTER-PLANT & INTER-WAREHOUSE STOCK TRANSFERS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stock_transfers (
    id VARCHAR(36) PRIMARY KEY,
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    source_plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    source_warehouse_id VARCHAR(36) NOT NULL REFERENCES warehouses(id),
    dest_plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    dest_warehouse_id VARCHAR(36) NOT NULL REFERENCES warehouses(id),
    transfer_reason VARCHAR(100),
    status VARCHAR(30) DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, PICKED, IN_TRANSIT, RECEIVED, CANCELLED
    transporter_name VARCHAR(100),
    vehicle_number VARCHAR(30),
    dispatched_by VARCHAR(100),
    dispatched_at TIMESTAMP,
    received_by VARCHAR(100),
    received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id VARCHAR(36) PRIMARY KEY,
    transfer_id VARCHAR(36) NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(50),
    requested_qty NUMERIC(12, 2) NOT NULL,
    dispatched_qty NUMERIC(12, 2) DEFAULT 0.00,
    received_qty NUMERIC(12, 2) DEFAULT 0.00,
    discrepancy_qty NUMERIC(12, 2) DEFAULT 0.00,
    uom VARCHAR(20) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 10. SALES ORDER FULFILLMENT & DISPATCH
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sales_orders (
    id VARCHAR(36) PRIMARY KEY,
    so_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(36) NOT NULL REFERENCES customers(id),
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    order_date DATE NOT NULL,
    delivery_due_date DATE NOT NULL,
    total_amount NUMERIC(14, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'CONFIRMED' -- CONFIRMED, ALLOCATED, PICKING, PACKED, DISPATCHED, DELIVERED, CANCELLED
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    id VARCHAR(36) PRIMARY KEY,
    so_id VARCHAR(36) NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    ordered_qty NUMERIC(12, 2) NOT NULL,
    allocated_qty NUMERIC(12, 2) DEFAULT 0.00,
    dispatched_qty NUMERIC(12, 2) DEFAULT 0.00,
    unit_price NUMERIC(14, 2) NOT NULL,
    total_price NUMERIC(14, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(36) PRIMARY KEY,
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    so_id VARCHAR(36) NOT NULL REFERENCES sales_orders(id),
    customer_id VARCHAR(36) NOT NULL REFERENCES customers(id),
    transporter_name VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(30) NOT NULL,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(30),
    gate_pass_number VARCHAR(50) UNIQUE NOT NULL,
    eway_bill_number VARCHAR(50),
    total_boxes INT DEFAULT 1,
    total_weight_kg NUMERIC(10, 2),
    status VARCHAR(30) DEFAULT 'READY', -- READY, DISPATCHED, IN_TRANSIT, DELIVERED
    dispatched_at TIMESTAMP,
    delivered_at TIMESTAMP,
    proof_of_delivery_signature TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipment_items (
    id VARCHAR(36) PRIMARY KEY,
    shipment_id VARCHAR(36) NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(50) NOT NULL,
    dispatched_qty NUMERIC(12, 2) NOT NULL,
    box_pallet_numbers VARCHAR(100)
);

-- ----------------------------------------------------------------------------
-- 11. REVERSE LOGISTICS & RETURNS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS returns_log (
    id VARCHAR(36) PRIMARY KEY,
    return_number VARCHAR(50) UNIQUE NOT NULL,
    return_type VARCHAR(30) NOT NULL, -- PURCHASE_RETURN_VENDOR, PRODUCTION_RETURN_FLOOR, CUSTOMER_RETURN_RMA
    reference_doc_no VARCHAR(50),
    entity_name VARCHAR(150), -- Supplier or Customer or Dept
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(50),
    quantity NUMERIC(12, 2) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    reason_code VARCHAR(100) NOT NULL,
    action_disposition VARCHAR(50) NOT NULL, -- RE_STOCK, QUARANTINE, SCRAP, VENDOR_REPLACEMENT, CREDIT_NOTE
    approval_status VARCHAR(30) DEFAULT 'APPROVED',
    logged_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 12. PHYSICAL INVENTORY COUNTING & STOCK ADJUSTMENTS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stock_count_plans (
    id VARCHAR(36) PRIMARY KEY,
    plan_number VARCHAR(50) UNIQUE NOT NULL,
    count_type VARCHAR(30) NOT NULL, -- CYCLE_COUNT, ANNUAL_PHYSICAL, ABC_COUNT
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    warehouse_id VARCHAR(36) NOT NULL REFERENCES warehouses(id),
    scheduled_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, RECONCILED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_count_items (
    id VARCHAR(36) PRIMARY KEY,
    count_plan_id VARCHAR(36) NOT NULL REFERENCES stock_count_plans(id) ON DELETE CASCADE,
    bin_id VARCHAR(36) NOT NULL REFERENCES warehouse_bins(id),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(50),
    system_qty NUMERIC(12, 2) NOT NULL,
    counted_qty NUMERIC(12, 2) DEFAULT 0.00,
    variance_qty NUMERIC(12, 2) DEFAULT 0.00,
    variance_value NUMERIC(14, 2) DEFAULT 0.00,
    recount_needed BOOLEAN DEFAULT FALSE,
    reconciled BOOLEAN DEFAULT FALSE,
    counter_name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS stock_adjustments (
    id VARCHAR(36) PRIMARY KEY,
    adjustment_number VARCHAR(50) UNIQUE NOT NULL,
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    warehouse_id VARCHAR(36) NOT NULL REFERENCES warehouses(id),
    bin_id VARCHAR(36) NOT NULL REFERENCES warehouse_bins(id),
    item_id VARCHAR(36) NOT NULL REFERENCES items(id),
    batch_number VARCHAR(50),
    adjustment_type VARCHAR(20) NOT NULL, -- INCREASE, DECREASE
    quantity NUMERIC(12, 2) NOT NULL,
    reason_code VARCHAR(100) NOT NULL, -- DAMAGE, COUNT_VARIANCE, EXPIRY_SCRAP, PILFERAGE, SYSTEM_CORRECTION
    approved_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 13. SECURITY, USERS, RBAC & AUDIT LOGS (BRD SECTION 39 COMPLIANT)
-- ----------------------------------------------------------------------------

-- User Master with Granular Account Status & Effective Dates (BRD §6, §7 & §34)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(50), -- Optional external reference code (BRD §6.1)
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    mobile_number VARCHAR(30),
    department VARCHAR(100),
    designation VARCHAR(100),
    company_id VARCHAR(36) REFERENCES companies(id),
    plant_id VARCHAR(36) REFERENCES plants(id),
    warehouse_id VARCHAR(36) REFERENCES warehouses(id),
    reporting_manager VARCHAR(100),
    primary_role_id VARCHAR(36),
    status VARCHAR(30) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, LOCKED, SUSPENDED, EXPIRED, TERMINATED
    effective_from DATE,
    effective_to DATE,
    failed_logins INT DEFAULT 0,
    locked_until TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Master (BRD §8, §34, §35)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    role_type VARCHAR(50) DEFAULT 'OPERATIONAL', -- SYSTEM, ADMINISTRATIVE, OPERATIONAL, AUDIT, EXECUTIVE
    is_system BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    user_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modules, Sub-Modules, Functions & Actions Catalog (BRD §10, §11, §34)
CREATE TABLE IF NOT EXISTS system_modules (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(30),
    display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS system_sub_modules (
    code VARCHAR(50) PRIMARY KEY,
    module_code VARCHAR(50) NOT NULL REFERENCES system_modules(code),
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS system_functions (
    code VARCHAR(50) PRIMARY KEY,
    sub_module_code VARCHAR(50) NOT NULL REFERENCES system_sub_modules(code),
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0
);

-- 15 Granular Actions Catalog (BRD §10.4)
CREATE TABLE IF NOT EXISTS system_actions (
    code VARCHAR(30) PRIMARY KEY, -- VIEW, ADD, EDIT, DELETE, SUBMIT, APPROVE, REJECT, CANCEL, PRINT, EXPORT, IMPORT, POST, REVERSE, CLOSE, REOPEN
    name VARCHAR(50) NOT NULL,
    description TEXT
);

-- Permissions Master (BRD §10 & §34)
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(36) PRIMARY KEY,
    module VARCHAR(50),
    module_code VARCHAR(50),
    perm_code VARCHAR(100),
    name VARCHAR(150),
    description TEXT,
    risk_level VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- User-Role Mapping (Multi-Role Support) (BRD §9, §39)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    effective_from DATE,
    effective_to DATE,
    assigned_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, role_id)
);

-- Role-Permission Matrix with 15 Granular Actions (BRD §10.4, §12)
CREATE TABLE IF NOT EXISTS role_permissions (
    id VARCHAR(50),
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    perm_code VARCHAR(50) NOT NULL,
    "view" BOOLEAN DEFAULT FALSE,
    "add" BOOLEAN DEFAULT FALSE,
    "edit" BOOLEAN DEFAULT FALSE,
    "delete" BOOLEAN DEFAULT FALSE,
    "submit" BOOLEAN DEFAULT FALSE,
    "approve" BOOLEAN DEFAULT FALSE,
    "reject" BOOLEAN DEFAULT FALSE,
    "cancel" BOOLEAN DEFAULT FALSE,
    "print" BOOLEAN DEFAULT FALSE,
    "export" BOOLEAN DEFAULT FALSE,
    "import" BOOLEAN DEFAULT FALSE,
    "post" BOOLEAN DEFAULT FALSE,
    "reverse" BOOLEAN DEFAULT FALSE,
    "close" BOOLEAN DEFAULT FALSE,
    "reopen" BOOLEAN DEFAULT FALSE,
    UNIQUE(role_id, perm_code)
);

-- Organizational Access Hierarchy Scoping (BRD §5, §16-19, §34, §39)
CREATE TABLE IF NOT EXISTS user_organizations (
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id VARCHAR(36) NOT NULL REFERENCES companies(id),
    PRIMARY KEY(user_id, company_id)
);

CREATE TABLE IF NOT EXISTS user_plants (
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plant_id VARCHAR(36) NOT NULL REFERENCES plants(id),
    is_default BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(user_id, plant_id)
);

-- Approval Authority Master & Amount-Based Limits (BRD §14, §15, §34)
CREATE TABLE IF NOT EXISTS approval_authorities (
    id VARCHAR(36) PRIMARY KEY,
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id),
    designation VARCHAR(100),
    department_id VARCHAR(36) REFERENCES departments(id),
    transaction_type VARCHAR(50) NOT NULL, -- PURCHASE_REQUISITION, PURCHASE_ORDER, GRN, STOCK_ADJUSTMENT, STOCK_TRANSFER
    min_amount NUMERIC(14, 2) DEFAULT 0.00,
    max_amount NUMERIC(14, 2) NOT NULL, -- e.g. 10000, 100000, 1000000, 999999999
    approval_level VARCHAR(30) DEFAULT 'LEVEL_1', -- LEVEL_1, LEVEL_2, LEVEL_3, EXECUTIVE
    requires_dual_approval BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval Delegation & Temporary Permissions (BRD §21, §22, §39)
CREATE TABLE IF NOT EXISTS approval_delegations (
    id VARCHAR(36) PRIMARY KEY,
    delegator_user_id VARCHAR(36) REFERENCES users(id),
    delegatee_user_id VARCHAR(36) REFERENCES users(id),
    delegating_user_id VARCHAR(36) REFERENCES users(id),
    delegate_user_id VARCHAR(36) REFERENCES users(id),
    role_id VARCHAR(36) REFERENCES roles(id),
    permission_type VARCHAR(100) DEFAULT 'ALL_APPROVALS', -- ALL_APPROVALS, PURCHASE_ORDER, STOCK_ADJUSTMENT, GRN
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    justification TEXT,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, REVOKED
    approved_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Segregation of Duties (SoD) Rule Master & Conflicts (BRD §13, §33, §34)
CREATE TABLE IF NOT EXISTS sod_rules (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50),
    rule_code VARCHAR(50),
    description TEXT,
    rule_description TEXT,
    conflicting_role_1 VARCHAR(100),
    conflicting_role_2 VARCHAR(100),
    conflicting_function_1 VARCHAR(100),
    conflicting_action_1 VARCHAR(50),
    conflicting_function_2 VARCHAR(100),
    conflicting_action_2 VARCHAR(50),
    risk_level VARCHAR(20) DEFAULT 'HIGH',
    severity VARCHAR(20) DEFAULT 'HIGH', -- CRITICAL, HIGH, MEDIUM
    mitigation_control TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Access Request Workflow (BRD §30, §39)
CREATE TABLE IF NOT EXISTS access_requests (
    id VARCHAR(36) PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    employee_id VARCHAR(50),
    requested_role_id VARCHAR(36) REFERENCES roles(id),
    requested_warehouse_id VARCHAR(36) REFERENCES warehouses(id),
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING_MANAGER', -- PENDING_MANAGER, PENDING_DEPT_HEAD, PENDING_IT_ADMIN, APPROVED_ACTIVE, REJECTED
    manager_reviewer_id VARCHAR(36) REFERENCES users(id),
    manager_approval_date TIMESTAMP,
    dept_head_reviewer_id VARCHAR(36) REFERENCES users(id),
    dept_head_approval_date TIMESTAMP,
    it_admin_id VARCHAR(36) REFERENCES users(id),
    it_activation_date TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password Policies & History (BRD §24, §39)
CREATE TABLE IF NOT EXISTS password_policies (
    id VARCHAR(36) PRIMARY KEY,
    min_length INT DEFAULT 8,
    require_uppercase BOOLEAN DEFAULT TRUE,
    require_lowercase BOOLEAN DEFAULT TRUE,
    require_number BOOLEAN DEFAULT TRUE,
    require_special_char BOOLEAN DEFAULT TRUE,
    expiry_days INT DEFAULT 90,
    history_limit INT DEFAULT 3,
    enforce_on_next_login BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Sessions & Login Security (BRD §25, §39)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    device_info TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE' -- ACTIVE, EXPIRED, TERMINATED
);

CREATE TABLE IF NOT EXISTS login_history (
    id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(36),
    user_name VARCHAR(150),
    ip_address VARCHAR(50),
    device_info TEXT,
    status VARCHAR(20) NOT NULL, -- SUCCESS, FAILED
    failure_reason VARCHAR(150)
);

-- Immutable Security & Access Audit Log (BRD §40)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    user_name VARCHAR(100),
    role VARCHAR(100),
    action VARCHAR(50) NOT NULL, -- USER_CREATED, ROLE_ASSIGNED, PERMISSION_CHANGED, SOD_OVERRIDE, LOGIN_FAILED, DELEGATION_GRANTED
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(50),
    ip_address VARCHAR(50),
    old_value_json TEXT,
    new_value_json TEXT,
    reason TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 14. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_inv_bal_lookup ON inventory_balances(plant_id, warehouse_id, item_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_lookup ON inventory_transactions(plant_id, item_id, created_at);
CREATE INDEX IF NOT EXISTS idx_grn_po ON goods_receipt_notes(po_id);
CREATE INDEX IF NOT EXISTS idx_qa_ref ON quality_inspections(reference_doc_id);
CREATE INDEX IF NOT EXISTS idx_prod_order ON production_orders(plant_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ----------------------------------------------------------------------------
-- 15. DOCUMENT PRINT CONFIGURATION MASTER (BRD v1.0)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_print_configurations (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    facility_id VARCHAR(50) DEFAULT 'ALL',
    document_type VARCHAR(50) NOT NULL, -- JC (Job Card), EST (Estimate), DB (Draft Bill), INV (Final Bill), GP (Delivery Receipt)
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(30) DEFAULT 'Published', -- Draft, Pending Approval, Approved, Published, Inactive
    effective_from DATE DEFAULT CURRENT_DATE,
    page_settings JSONB DEFAULT '{}',
    header_config JSONB DEFAULT '{}',
    body_config JSONB DEFAULT '{}',
    columns_config JSONB DEFAULT '[]',
    footer_config JSONB DEFAULT '{}',
    conditional_rules JSONB DEFAULT '[]',
    remarks TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_print_template_versions (
    id VARCHAR(50) PRIMARY KEY,
    configuration_id VARCHAR(50) NOT NULL REFERENCES document_print_configurations(id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL,
    configuration_name VARCHAR(150) NOT NULL,
    facility_id VARCHAR(50) DEFAULT 'ALL',
    document_type VARCHAR(50) NOT NULL,
    template_snapshot JSONB NOT NULL,
    status VARCHAR(30) NOT NULL,
    publication_date TIMESTAMP,
    change_remarks TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_print_audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    configuration_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, SUBMIT, APPROVE, REJECT, PUBLISH, DEACTIVATE, RESTORE, COPY
    facility_id VARCHAR(50),
    document_type VARCHAR(50),
    version_number VARCHAR(20),
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    remarks TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_print_cfg_fac_type ON document_print_configurations(facility_id, document_type, status);
CREATE INDEX IF NOT EXISTS idx_doc_print_versions_cfg ON document_print_template_versions(configuration_id, version_number);
CREATE INDEX IF NOT EXISTS idx_doc_print_audit_cfg ON document_print_audit_logs(configuration_id, created_at);

-- Migrations: Goods Receipt Financial Columns (With PO and Without PO)
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS total_gross_amount NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS total_discount_amount NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS total_taxable_amount NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS total_tax_amount NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS total_net_amount NUMERIC(14, 2) DEFAULT 0.00;

ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS net_amount NUMERIC(14, 2) DEFAULT 0.00;
