-- ============================================================================
-- PET FOOD STORES ERP/POS SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Database: PostgreSQL 15+
-- Author: Ustym Kushnir
-- Created: December 2025
--
-- This schema is designed to support:
-- - 4 branches (scalable to more)
-- - Multi-register POS with offline capability
-- - Shift-based blind closings with daily consolidation
-- - FactuHoy/AFIP electronic invoicing
-- - Stock management with shrinkage allowance
-- - OCR-based price imports from suppliers
-- - Loyalty points and credit system
-- - Future: E-commerce, HR, Expenses, Wholesale
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: CORE ENTITIES (Branches, Users, Roles)
-- ============================================================================

-- Branches / Stores
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,                    -- e.g., 'BR001', 'BR002'
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    neighborhood VARCHAR(100),                           -- For shipping calculator
    city VARCHAR(100) DEFAULT 'Buenos Aires',
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(100),

    -- Operating hours
    midday_closing_time TIME DEFAULT '14:00',            -- 2:00 PM or 2:30 PM
    evening_closing_time TIME DEFAULT '20:00',           -- 8:00 PM - 8:30 PM
    has_shift_change BOOLEAN DEFAULT TRUE,               -- 3 branches have shift changes

    -- FactuHoy/AFIP configuration
    factuhoy_point_of_sale INTEGER,                      -- 2 POS for 4 branches initially
    default_invoice_type CHAR(1) DEFAULT 'B',            -- A, B, or C

    -- Hardware info
    device_type VARCHAR(20) DEFAULT 'PC',                -- PC or TABLET
    printer_model VARCHAR(100),
    printer_type VARCHAR(20) DEFAULT 'THERMAL',          -- THERMAL, LASER, PDF

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles and Permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,                    -- OWNER, MANAGER, CASHIER
    description VARCHAR(255),

    -- Permissions (granular for future expansion)
    can_void_sale BOOLEAN DEFAULT FALSE,
    can_give_discount BOOLEAN DEFAULT FALSE,
    can_view_all_branches BOOLEAN DEFAULT FALSE,
    can_close_register BOOLEAN DEFAULT TRUE,
    can_reopen_closing BOOLEAN DEFAULT FALSE,
    can_adjust_stock BOOLEAN DEFAULT FALSE,
    can_import_prices BOOLEAN DEFAULT FALSE,
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_view_reports BOOLEAN DEFAULT FALSE,
    can_view_financials BOOLEAN DEFAULT FALSE,           -- Bank balances, sensitive data
    can_manage_suppliers BOOLEAN DEFAULT FALSE,
    can_manage_products BOOLEAN DEFAULT FALSE,
    can_issue_invoice_a BOOLEAN DEFAULT FALSE,           -- Invoice A requires special permission
    max_discount_percent DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(20) UNIQUE,                    -- Internal employee ID
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(50),

    role_id UUID NOT NULL REFERENCES roles(id),
    primary_branch_id UUID REFERENCES branches(id),      -- Main branch assignment

    -- Authentication
    is_active BOOLEAN DEFAULT TRUE,
    pin_code VARCHAR(6),                                 -- Quick login at POS
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    -- Preferences
    language VARCHAR(10) DEFAULT 'es',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-Branch assignments (many-to-many for flexibility)
CREATE TABLE user_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, branch_id)
);

-- User Sessions (for token management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(255),
    ip_address INET,
    branch_id UUID REFERENCES branches(id),

    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- SECTION 2: PRODUCTS AND CATEGORIES
-- ============================================================================

-- Product Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id),            -- For subcategories
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Units of Measure
CREATE TABLE units_of_measure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,                    -- KG, UN, LT, etc.
    name VARCHAR(50) NOT NULL,                           -- Kilogram, Unit, Liter
    is_fractional BOOLEAN DEFAULT FALSE,                 -- Can be sold in fractions

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,                     -- Internal SKU
    barcode VARCHAR(50),                                 -- EAN/UPC barcode
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(50),                              -- For receipts/display
    description TEXT,

    category_id UUID REFERENCES categories(id),
    unit_id UUID NOT NULL REFERENCES units_of_measure(id),

    -- Pricing
    cost_price DECIMAL(12,2) DEFAULT 0,                  -- Purchase cost
    selling_price DECIMAL(12,2) NOT NULL,                -- Current selling price
    margin_percent DECIMAL(5,2),                         -- Profit margin %
    tax_rate DECIMAL(5,2) DEFAULT 21.00,                 -- IVA rate (21%, 10.5%, 0%)
    is_tax_included BOOLEAN DEFAULT TRUE,                -- Price includes tax

    -- Stock settings
    track_stock BOOLEAN DEFAULT TRUE,
    minimum_stock DECIMAL(12,3) DEFAULT 0,               -- Alert threshold
    is_weighable BOOLEAN DEFAULT FALSE,                  -- Sold by weight (pet food)
    shrinkage_percent DECIMAL(5,2) DEFAULT 0,            -- Expected loss % (powder, etc.)

    -- Kretz Aura scale integration
    scale_plu INTEGER,                                   -- PLU code for scale
    export_to_scale BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,                   -- For e-commerce

    -- Images (for e-commerce and social media generator)
    image_url VARCHAR(500),
    thumbnail_url VARCHAR(500),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product price history (for auditing price changes)
CREATE TABLE product_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    old_cost_price DECIMAL(12,2),
    new_cost_price DECIMAL(12,2),
    old_selling_price DECIMAL(12,2),
    new_selling_price DECIMAL(12,2),

    change_reason VARCHAR(50),                           -- MANUAL, OCR_IMPORT, MARGIN_UPDATE
    import_batch_id UUID,                                -- Reference to price import
    changed_by UUID REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 3: SUPPLIERS AND PRICE IMPORTS (OCR)
-- ============================================================================

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    cuit VARCHAR(20),                                    -- Tax ID (Argentina)

    address VARCHAR(255),
    city VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(200),

    -- Contact person
    contact_name VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),

    -- Payment terms
    payment_terms_days INTEGER DEFAULT 0,                -- Days to pay
    credit_limit DECIMAL(12,2) DEFAULT 0,

    -- For OCR import
    price_list_format VARCHAR(50),                       -- PDF, EXCEL, CSV
    default_margin_percent DECIMAL(5,2) DEFAULT 30,      -- Default markup

    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supplier-Product mapping (for matching during OCR import)
CREATE TABLE supplier_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    supplier_code VARCHAR(50),                           -- Supplier's product code
    supplier_description VARCHAR(255),                   -- Supplier's product name
    last_cost_price DECIMAL(12,2),

    is_preferred BOOLEAN DEFAULT FALSE,                  -- Primary supplier for this product

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(supplier_id, product_id)
);

-- Price Import Batches (OCR uploads)
CREATE TABLE price_import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id),

    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,                      -- PDF, XLSX, CSV
    file_url VARCHAR(500),                               -- Stored file location
    file_size_bytes INTEGER,

    -- OCR processing
    ocr_required BOOLEAN DEFAULT FALSE,                  -- True for scanned PDFs
    ocr_engine VARCHAR(50),                              -- Tesseract, Google Vision, etc.
    extraction_confidence DECIMAL(5,2),                  -- % confidence score

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',                -- PENDING, PROCESSING, PREVIEW, APPLIED, FAILED
    error_message TEXT,

    -- Stats
    total_rows_extracted INTEGER DEFAULT 0,
    rows_matched INTEGER DEFAULT 0,
    rows_unmatched INTEGER DEFAULT 0,
    rows_applied INTEGER DEFAULT 0,

    -- Pricing rules applied
    margin_type VARCHAR(20),                             -- FIXED, PERCENT, ROUNDING
    margin_value DECIMAL(12,2),
    rounding_rule VARCHAR(20),                           -- NONE, ROUND_5, ROUND_10, ROUND_100

    uploaded_by UUID REFERENCES users(id),
    applied_by UUID REFERENCES users(id),
    applied_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Price Import Items (individual rows from OCR)
CREATE TABLE price_import_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES price_import_batches(id) ON DELETE CASCADE,

    -- Extracted data
    row_number INTEGER,
    extracted_code VARCHAR(100),
    extracted_description VARCHAR(500),
    extracted_price DECIMAL(12,2),

    -- Matching
    product_id UUID REFERENCES products(id),
    match_type VARCHAR(20),                              -- EXACT_CODE, FUZZY_NAME, MANUAL, UNMATCHED
    match_confidence DECIMAL(5,2),

    -- Price calculation
    current_cost_price DECIMAL(12,2),
    new_cost_price DECIMAL(12,2),
    current_selling_price DECIMAL(12,2),
    new_selling_price DECIMAL(12,2),
    price_change_percent DECIMAL(5,2),

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',                -- PENDING, APPROVED, REJECTED, APPLIED
    rejection_reason VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 4: INVENTORY / STOCK
-- ============================================================================

-- Stock per branch
CREATE TABLE branch_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    quantity DECIMAL(12,3) NOT NULL DEFAULT 0,           -- Current stock
    reserved_quantity DECIMAL(12,3) DEFAULT 0,           -- Reserved for pending orders

    -- Shrinkage tracking
    expected_shrinkage DECIMAL(12,3) DEFAULT 0,          -- Calculated from product %
    actual_shrinkage DECIMAL(12,3) DEFAULT 0,            -- Recorded losses

    last_counted_at TIMESTAMP WITH TIME ZONE,
    last_counted_quantity DECIMAL(12,3),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(branch_id, product_id)
);

-- Stock Movement Types
CREATE TYPE stock_movement_type AS ENUM (
    'SALE',                  -- Sold to customer
    'RETURN',                -- Customer return
    'PURCHASE',              -- Received from supplier
    'TRANSFER_OUT',          -- Sent to another branch
    'TRANSFER_IN',           -- Received from another branch
    'ADJUSTMENT_PLUS',       -- Manual increase
    'ADJUSTMENT_MINUS',      -- Manual decrease
    'SHRINKAGE',             -- Loss (powder, spoilage)
    'INITIAL',               -- Initial stock load
    'INVENTORY_COUNT'        -- Physical count correction
);

-- Stock Movements (audit trail)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id),
    product_id UUID NOT NULL REFERENCES products(id),

    movement_type stock_movement_type NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,                     -- Positive or negative
    quantity_before DECIMAL(12,3) NOT NULL,
    quantity_after DECIMAL(12,3) NOT NULL,

    -- Reference to source document
    reference_type VARCHAR(50),                          -- SALE, PURCHASE_ORDER, TRANSFER, ADJUSTMENT
    reference_id UUID,                                   -- ID of the related document

    -- For adjustments
    adjustment_reason VARCHAR(255),

    -- For transfers
    related_branch_id UUID REFERENCES branches(id),      -- Source/destination branch

    performed_by UUID REFERENCES users(id),
    notes TEXT,

    -- Sync tracking
    local_id VARCHAR(50),                                -- ID from offline POS
    synced_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Transfers between branches
CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number VARCHAR(20) UNIQUE NOT NULL,

    source_branch_id UUID NOT NULL REFERENCES branches(id),
    destination_branch_id UUID NOT NULL REFERENCES branches(id),

    status VARCHAR(20) DEFAULT 'PENDING',                -- PENDING, IN_TRANSIT, RECEIVED, CANCELLED

    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    shipped_by UUID REFERENCES users(id),
    received_by UUID REFERENCES users(id),

    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Transfer Items
CREATE TABLE stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),

    requested_quantity DECIMAL(12,3) NOT NULL,
    shipped_quantity DECIMAL(12,3),
    received_quantity DECIMAL(12,3),

    notes VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 5: CUSTOMERS AND LOYALTY
-- ============================================================================

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(20) UNIQUE,

    -- Personal info
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(200),                           -- For Invoice A

    -- Tax info (for invoicing)
    document_type VARCHAR(10) DEFAULT 'DNI',             -- DNI, CUIT, CUIL
    document_number VARCHAR(20),
    tax_condition VARCHAR(50),                           -- CONSUMIDOR_FINAL, MONOTRIBUTO, RESP_INSCRIPTO

    -- Contact
    email VARCHAR(100),
    phone VARCHAR(50),

    -- Address (for delivery/shipping)
    address VARCHAR(255),
    neighborhood VARCHAR(100),                           -- For shipping calculator
    city VARCHAR(100),
    postal_code VARCHAR(20),

    -- Loyalty
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier VARCHAR(20) DEFAULT 'STANDARD',         -- STANDARD, SILVER, GOLD, PLATINUM
    qr_code VARCHAR(100) UNIQUE,                         -- For loyalty scanning

    -- Credit (change as credit)
    credit_balance DECIMAL(12,2) DEFAULT 0,

    -- Wholesale
    is_wholesale BOOLEAN DEFAULT FALSE,
    wholesale_discount_percent DECIMAL(5,2) DEFAULT 0,
    assigned_vendor_id UUID REFERENCES users(id),        -- For commission tracking

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Points Transactions
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    transaction_type VARCHAR(20) NOT NULL,               -- EARN, REDEEM, EXPIRE, ADJUST
    points INTEGER NOT NULL,                             -- Positive for earn, negative for redeem
    points_balance_after INTEGER NOT NULL,

    -- Reference
    sale_id UUID,                                        -- Reference to sale if earned/redeemed
    description VARCHAR(255),

    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,                 -- Points expiration date
    expired BOOLEAN DEFAULT FALSE,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Credit Transactions (change as credit)
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    transaction_type VARCHAR(20) NOT NULL,               -- CREDIT (from change), DEBIT (used in sale), ADJUST
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,

    sale_id UUID,                                        -- Reference to sale
    description VARCHAR(255),

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 6: CASH REGISTERS AND SHIFTS
-- ============================================================================

-- Cash Registers (physical registers at each branch)
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

    register_number INTEGER NOT NULL,                    -- 1, 2, etc. per branch
    name VARCHAR(50),                                    -- "Caja 1", "Caja Principal"

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(branch_id, register_number)
);

-- Shift Types
CREATE TYPE shift_type AS ENUM (
    'MORNING',       -- Opening to midday closing
    'AFTERNOON',     -- Midday to evening closing
    'FULL_DAY'       -- For branches without shift change
);

-- Cash Register Sessions (shifts)
CREATE TABLE register_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_id UUID NOT NULL REFERENCES cash_registers(id),
    branch_id UUID NOT NULL REFERENCES branches(id),

    session_number VARCHAR(20) NOT NULL,                 -- YYYYMMDD-BR01-R1-S1
    shift_type shift_type NOT NULL,
    business_date DATE NOT NULL,                         -- The operating date

    -- Opening
    opened_by UUID NOT NULL REFERENCES users(id),
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
    opening_cash DECIMAL(12,2) NOT NULL DEFAULT 0,       -- Starting cash
    opening_notes TEXT,

    -- Closing (Blind Closing)
    closed_by UUID REFERENCES users(id),
    closed_at TIMESTAMP WITH TIME ZONE,

    -- Cashier's declared amounts (blind - they don't see expected)
    declared_cash DECIMAL(12,2),
    declared_card DECIMAL(12,2),
    declared_qr DECIMAL(12,2),
    declared_transfer DECIMAL(12,2),

    -- System calculated amounts
    expected_cash DECIMAL(12,2),
    expected_card DECIMAL(12,2),
    expected_qr DECIMAL(12,2),
    expected_transfer DECIMAL(12,2),

    -- Discrepancies
    discrepancy_cash DECIMAL(12,2),
    discrepancy_card DECIMAL(12,2),
    discrepancy_qr DECIMAL(12,2),
    discrepancy_transfer DECIMAL(12,2),
    total_discrepancy DECIMAL(12,2),

    -- Status
    status VARCHAR(20) DEFAULT 'OPEN',                   -- OPEN, CLOSED, REOPENED
    closing_notes TEXT,

    -- Reopen tracking
    reopened_by UUID REFERENCES users(id),
    reopened_at TIMESTAMP WITH TIME ZONE,
    reopen_reason TEXT,

    -- Sync tracking
    local_id VARCHAR(50),
    synced_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Consolidated Reports (per branch)
CREATE TABLE daily_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id),
    business_date DATE NOT NULL,

    -- Totals by payment method
    total_cash DECIMAL(12,2) DEFAULT 0,
    total_card DECIMAL(12,2) DEFAULT 0,
    total_qr DECIMAL(12,2) DEFAULT 0,
    total_transfer DECIMAL(12,2) DEFAULT 0,
    total_credit_used DECIMAL(12,2) DEFAULT 0,           -- Customer credit
    total_points_redeemed INTEGER DEFAULT 0,

    -- Sales summary
    total_gross_sales DECIMAL(12,2) DEFAULT 0,
    total_discounts DECIMAL(12,2) DEFAULT 0,
    total_net_sales DECIMAL(12,2) DEFAULT 0,
    total_tax DECIMAL(12,2) DEFAULT 0,

    -- Transaction counts
    transaction_count INTEGER DEFAULT 0,
    voided_count INTEGER DEFAULT 0,
    voided_amount DECIMAL(12,2) DEFAULT 0,
    return_count INTEGER DEFAULT 0,
    return_amount DECIMAL(12,2) DEFAULT 0,

    -- Discrepancies
    total_discrepancy DECIMAL(12,2) DEFAULT 0,

    -- Status
    is_finalized BOOLEAN DEFAULT FALSE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    finalized_by UUID REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(branch_id, business_date)
);

-- ============================================================================
-- SECTION 7: SALES AND PAYMENTS
-- ============================================================================

-- Payment Methods
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,                    -- CASH, CARD, QR, TRANSFER
    name VARCHAR(50) NOT NULL,

    requires_reference BOOLEAN DEFAULT FALSE,            -- Transfer requires receipt number
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales/Tickets
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identifiers
    sale_number VARCHAR(30) UNIQUE NOT NULL,             -- Sequential per branch
    ticket_number VARCHAR(20),                           -- Printed ticket number

    -- Location
    branch_id UUID NOT NULL REFERENCES branches(id),
    register_id UUID NOT NULL REFERENCES cash_registers(id),
    session_id UUID NOT NULL REFERENCES register_sessions(id),

    -- Customer (optional for quick sales)
    customer_id UUID REFERENCES customers(id),

    -- Seller (for wholesale commission)
    seller_id UUID REFERENCES users(id),

    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,                     -- Before discounts
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,

    -- Loyalty
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    points_redemption_value DECIMAL(12,2) DEFAULT 0,

    -- Customer credit
    credit_used DECIMAL(12,2) DEFAULT 0,
    change_as_credit DECIMAL(12,2) DEFAULT 0,            -- Change given as credit

    -- Status
    status VARCHAR(20) DEFAULT 'COMPLETED',              -- COMPLETED, VOIDED, RETURNED

    -- Voiding
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by UUID REFERENCES users(id),
    void_reason VARCHAR(255),
    void_approved_by UUID REFERENCES users(id),

    -- Timestamps
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Sync tracking (for offline POS)
    local_id VARCHAR(50),                                -- Local UUID from offline device
    local_created_at TIMESTAMP WITH TIME ZONE,           -- When created offline
    synced_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'SYNCED',            -- PENDING, SYNCED, CONFLICT

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sale Items
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),

    -- Quantity and pricing at time of sale
    quantity DECIMAL(12,3) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,                   -- Price at time of sale
    cost_price DECIMAL(12,2),                            -- For profit tracking

    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,

    tax_rate DECIMAL(5,2) DEFAULT 21.00,
    tax_amount DECIMAL(12,2) DEFAULT 0,

    line_total DECIMAL(12,2) NOT NULL,

    notes VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sale Payments (supports mixed payments)
CREATE TABLE sale_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),

    amount DECIMAL(12,2) NOT NULL,

    -- For transfers (receipt number required)
    reference_number VARCHAR(100),

    -- For cards
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    authorization_code VARCHAR(50),

    -- For QR payments
    qr_provider VARCHAR(50),                             -- MercadoPago, etc.
    qr_transaction_id VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 8: INVOICING (FactuHoy / AFIP)
-- ============================================================================

-- Invoice Types (AFIP)
CREATE TABLE invoice_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code CHAR(1) NOT NULL,                               -- A, B, C
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    requires_customer_cuit BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id),

    -- AFIP/FactuHoy data
    invoice_type_id UUID NOT NULL REFERENCES invoice_types(id),
    point_of_sale INTEGER NOT NULL,                      -- FactuHoy POS number
    invoice_number INTEGER NOT NULL,                     -- Sequential number from AFIP

    -- CAE (Codigo de Autorizacion Electronico)
    cae VARCHAR(20),
    cae_expiration_date DATE,

    -- Customer data (snapshot at time of invoice)
    customer_name VARCHAR(200),
    customer_document_type VARCHAR(10),
    customer_document_number VARCHAR(20),
    customer_tax_condition VARCHAR(50),
    customer_address VARCHAR(255),

    -- Amounts
    net_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,

    -- FactuHoy response
    factuhoy_id VARCHAR(100),                            -- FactuHoy internal ID
    factuhoy_response JSONB,                             -- Full API response
    pdf_url VARCHAR(500),                                -- Invoice PDF URL

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',                -- PENDING, ISSUED, FAILED, CANCELLED
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,

    issued_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(point_of_sale, invoice_number, invoice_type_id)
);

-- Credit Notes (for returns/cancellations)
CREATE TABLE credit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_invoice_id UUID NOT NULL REFERENCES invoices(id),

    credit_note_type CHAR(1) NOT NULL,                   -- A, B, C (matches original)
    point_of_sale INTEGER NOT NULL,
    credit_note_number INTEGER NOT NULL,

    cae VARCHAR(20),
    cae_expiration_date DATE,

    reason VARCHAR(255) NOT NULL,

    net_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,

    factuhoy_id VARCHAR(100),
    factuhoy_response JSONB,
    pdf_url VARCHAR(500),

    status VARCHAR(20) DEFAULT 'PENDING',

    issued_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 9: ALERTS AND NOTIFICATIONS
-- ============================================================================

-- Alert Types
CREATE TYPE alert_type AS ENUM (
    'VOIDED_SALE',           -- Sale was voided
    'CASH_DISCREPANCY',      -- Cash doesn't match
    'LOW_STOCK',             -- Stock below minimum
    'LATE_CLOSING',          -- Closing after expected time
    'REOPEN_REGISTER',       -- Register was reopened
    'FAILED_INVOICE',        -- FactuHoy invoice failed
    'LARGE_DISCOUNT',        -- Discount above threshold
    'HIGH_VALUE_SALE',       -- Sale above threshold
    'SYNC_ERROR',            -- Offline sync failed
    'LOGIN_FAILED',          -- Multiple failed logins
    'PRICE_CHANGE'           -- Significant price change
);

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type alert_type NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM',               -- LOW, MEDIUM, HIGH, CRITICAL

    branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES users(id),                   -- User who triggered alert

    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    -- Reference to related entity
    reference_type VARCHAR(50),
    reference_id UUID,

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_by UUID REFERENCES users(id),
    read_at TIMESTAMP WITH TIME ZONE,

    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Notification Preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,

    email_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, alert_type)
);

-- ============================================================================
-- SECTION 10: SHIPPING ZONES AND RATES
-- ============================================================================

-- Shipping Zones
CREATE TABLE shipping_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,                          -- "Zona Centro", "Zona Norte"

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Neighborhoods in zones
CREATE TABLE shipping_neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,

    neighborhood_name VARCHAR(100) NOT NULL,             -- "La Tablada", "San Justo"
    postal_code VARCHAR(20),

    UNIQUE(neighborhood_name)
);

-- Shipping Rates
CREATE TABLE shipping_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,

    base_rate DECIMAL(12,2) NOT NULL,                    -- e.g., $7,500
    free_shipping_threshold DECIMAL(12,2),               -- Free if order above this

    -- Weight-based surcharges
    weight_surcharge_per_kg DECIMAL(12,2) DEFAULT 0,
    max_weight_kg DECIMAL(8,2),

    -- Time slots
    express_surcharge DECIMAL(12,2) DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 11: SYNCHRONIZATION (Offline Mode)
-- ============================================================================

-- Sync Queue (for offline operations)
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    branch_id UUID NOT NULL REFERENCES branches(id),
    register_id UUID REFERENCES cash_registers(id),

    -- Operation details
    entity_type VARCHAR(50) NOT NULL,                    -- SALE, STOCK_MOVEMENT, REGISTER_SESSION
    entity_local_id VARCHAR(50) NOT NULL,
    operation VARCHAR(20) NOT NULL,                      -- INSERT, UPDATE, DELETE

    payload JSONB NOT NULL,                              -- Full entity data

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',                -- PENDING, PROCESSING, SYNCED, FAILED, CONFLICT
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Conflict resolution
    conflict_type VARCHAR(50),
    conflict_resolution VARCHAR(50),                     -- LOCAL_WINS, SERVER_WINS, MERGED
    conflict_resolved_by UUID REFERENCES users(id),

    -- Timestamps
    local_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sync Log (history of all syncs)
CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    branch_id UUID NOT NULL REFERENCES branches(id),
    sync_type VARCHAR(20) NOT NULL,                      -- FULL, INCREMENTAL, MANUAL

    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Stats
    records_sent INTEGER DEFAULT 0,
    records_received INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    status VARCHAR(20) DEFAULT 'IN_PROGRESS',            -- IN_PROGRESS, COMPLETED, FAILED
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 12: AUDIT LOG
-- ============================================================================

-- Audit Log (comprehensive tracking)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(100),                             -- Snapshot in case user deleted

    -- Where
    branch_id UUID REFERENCES branches(id),
    ip_address INET,
    user_agent VARCHAR(500),

    -- What
    action VARCHAR(50) NOT NULL,                         -- CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type VARCHAR(50) NOT NULL,                    -- Table name
    entity_id UUID,

    -- Changes
    old_values JSONB,
    new_values JSONB,

    -- Context
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 13: FUTURE EXPANSION - E-COMMERCE
-- ============================================================================

-- Online Orders (for future e-commerce)
CREATE TABLE online_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(30) UNIQUE NOT NULL,

    customer_id UUID NOT NULL REFERENCES customers(id),

    -- Fulfillment
    fulfillment_branch_id UUID REFERENCES branches(id),
    order_type VARCHAR(20) DEFAULT 'DELIVERY',           -- DELIVERY, PICKUP

    -- Shipping
    shipping_zone_id UUID REFERENCES shipping_zones(id),
    shipping_address VARCHAR(255),
    shipping_neighborhood VARCHAR(100),
    shipping_cost DECIMAL(12,2) DEFAULT 0,

    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',                -- PENDING, CONFIRMED, PREPARING, SHIPPED, DELIVERED, CANCELLED

    -- Tracking
    tracking_number VARCHAR(100),
    estimated_delivery_date DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Online Order Items
CREATE TABLE online_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES online_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),

    quantity DECIMAL(12,3) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 14: FUTURE EXPANSION - HR AND PAYROLL
-- ============================================================================

-- Employee Extended Info (HR)
CREATE TABLE employee_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Personal
    birth_date DATE,
    national_id VARCHAR(20),                             -- DNI
    cuil VARCHAR(20),                                    -- Tax ID for employees

    -- Employment
    hire_date DATE,
    termination_date DATE,
    employment_type VARCHAR(20) DEFAULT 'FULL_TIME',     -- FULL_TIME, PART_TIME

    -- Compensation
    base_salary DECIMAL(12,2),
    hourly_rate DECIMAL(12,2),

    -- Bank info
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_cbu VARCHAR(30),

    -- Emergency contact
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Time Clock (for payroll)
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    branch_id UUID NOT NULL REFERENCES branches(id),

    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,

    -- Calculated
    regular_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),

    is_holiday BOOLEAN DEFAULT FALSE,
    notes VARCHAR(255),

    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Periods
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    payment_date DATE,

    status VARCHAR(20) DEFAULT 'OPEN',                   -- OPEN, CALCULATED, APPROVED, PAID

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Items
CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID NOT NULL REFERENCES payroll_periods(id),
    user_id UUID NOT NULL REFERENCES users(id),

    regular_hours DECIMAL(6,2) DEFAULT 0,
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    holiday_hours DECIMAL(6,2) DEFAULT 0,

    base_pay DECIMAL(12,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    holiday_pay DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,

    gross_pay DECIMAL(12,2) NOT NULL,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL,

    -- Wholesale commission (for salespeople)
    commission_sales DECIMAL(12,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    commission_amount DECIMAL(12,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(period_id, user_id)
);

-- ============================================================================
-- SECTION 15: FUTURE EXPANSION - EXPENSES
-- ============================================================================

-- Expense Categories
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,                          -- Rent, Taxes, Utilities, etc.
    is_recurring BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES expense_categories(id),
    branch_id UUID REFERENCES branches(id),              -- NULL for company-wide

    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,

    expense_date DATE NOT NULL,
    due_date DATE,
    paid_date DATE,

    -- For recurring
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_period VARCHAR(20),                       -- MONTHLY, QUARTERLY, ANNUAL

    status VARCHAR(20) DEFAULT 'PENDING',                -- PENDING, PAID, OVERDUE

    receipt_url VARCHAR(500),
    notes TEXT,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 16: INTER-BRANCH CHAT
-- ============================================================================

-- Chat Conversations
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Can be between users or branches
    conversation_type VARCHAR(20) DEFAULT 'DIRECT',      -- DIRECT, BRANCH, GROUP

    -- For branch-to-branch
    branch_a_id UUID REFERENCES branches(id),
    branch_b_id UUID REFERENCES branches(id),

    title VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Participants
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,

    last_read_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(conversation_id, user_id)
);

-- Chat Messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),

    message_type VARCHAR(20) DEFAULT 'TEXT',             -- TEXT, IMAGE, TRANSFER_REQUEST
    content TEXT NOT NULL,

    -- For transfer requests
    transfer_id UUID REFERENCES stock_transfers(id),

    is_deleted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 17: SOCIAL MEDIA / PROMOTIONS
-- ============================================================================

-- Promotions
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,

    promotion_type VARCHAR(30) NOT NULL,                 -- PERCENTAGE, FIXED_AMOUNT, BUY_X_GET_Y
    discount_value DECIMAL(12,2),

    -- Conditions
    minimum_purchase DECIMAL(12,2),
    applicable_products JSONB,                           -- Product IDs or category IDs

    -- Validity
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,

    -- Limits
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,

    -- Social media image
    generated_image_url VARCHAR(500),

    is_active BOOLEAN DEFAULT TRUE,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 18: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_branch ON users(primary_branch_id);

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- Stock
CREATE INDEX idx_branch_stock_branch ON branch_stock(branch_id);
CREATE INDEX idx_branch_stock_product ON branch_stock(product_id);
CREATE INDEX idx_stock_movements_branch ON stock_movements(branch_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);

-- Sales
CREATE INDEX idx_sales_branch ON sales(branch_id);
CREATE INDEX idx_sales_session ON sales(session_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_local_id ON sales(local_id);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- Register sessions
CREATE INDEX idx_register_sessions_register ON register_sessions(register_id);
CREATE INDEX idx_register_sessions_branch ON register_sessions(branch_id);
CREATE INDEX idx_register_sessions_date ON register_sessions(business_date);
CREATE INDEX idx_register_sessions_status ON register_sessions(status);

-- Daily reports
CREATE INDEX idx_daily_reports_branch_date ON daily_reports(branch_id, business_date);

-- Invoices
CREATE INDEX idx_invoices_sale ON invoices(sale_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(issued_at);

-- Customers
CREATE INDEX idx_customers_document ON customers(document_number);
CREATE INDEX idx_customers_qr ON customers(qr_code);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Alerts
CREATE INDEX idx_alerts_branch ON alerts(branch_id);
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_unread ON alerts(is_read) WHERE is_read = FALSE;

-- Sync queue
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_branch ON sync_queue(branch_id);

-- Audit log
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_date ON audit_log(created_at);

-- Suppliers
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);

-- ============================================================================
-- SECTION 19: DEFAULT DATA
-- ============================================================================

-- Default roles
INSERT INTO roles (name, description, can_void_sale, can_give_discount, can_view_all_branches, can_close_register, can_reopen_closing, can_adjust_stock, can_import_prices, can_manage_users, can_view_reports, can_view_financials, can_manage_suppliers, can_manage_products, can_issue_invoice_a, max_discount_percent) VALUES
('OWNER', 'Store owner with full access', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 100),
('MANAGER', 'Branch manager', TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, 20),
('CASHIER', 'Regular cashier', FALSE, TRUE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 5);

-- Default payment methods
INSERT INTO payment_methods (code, name, requires_reference, sort_order) VALUES
('CASH', 'Efectivo', FALSE, 1),
('CARD', 'Tarjeta', FALSE, 2),
('QR', 'QR / MercadoPago', FALSE, 3),
('TRANSFER', 'Transferencia', TRUE, 4);

-- Default invoice types
INSERT INTO invoice_types (code, name, description, requires_customer_cuit) VALUES
('A', 'Factura A', 'Para Responsables Inscriptos', TRUE),
('B', 'Factura B', 'Para Consumidores Finales y Exentos', FALSE),
('C', 'Factura C', 'Para Monotributistas', FALSE);

-- Default units of measure
INSERT INTO units_of_measure (code, name, is_fractional) VALUES
('UN', 'Unidad', FALSE),
('KG', 'Kilogramo', TRUE),
('GR', 'Gramo', TRUE),
('LT', 'Litro', TRUE),
('ML', 'Mililitro', TRUE),
('MT', 'Metro', TRUE),
('BL', 'Bolsa', FALSE),
('CJ', 'Caja', FALSE);

-- Default expense categories
INSERT INTO expense_categories (name, is_recurring) VALUES
('Alquiler', TRUE),
('Servicios (Luz/Gas/Agua)', TRUE),
('Internet/Teléfono', TRUE),
('Impuestos', TRUE),
('Seguros', TRUE),
('Mantenimiento', FALSE),
('Suministros', FALSE),
('Marketing', FALSE),
('Otros', FALSE);

-- ============================================================================
-- SECTION 20: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_register_sessions_updated_at BEFORE UPDATE ON register_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate sale number
CREATE OR REPLACE FUNCTION generate_sale_number(p_branch_id UUID)
RETURNS VARCHAR(30) AS $$
DECLARE
    v_branch_code VARCHAR(10);
    v_date_part VARCHAR(8);
    v_sequence INTEGER;
    v_sale_number VARCHAR(30);
BEGIN
    -- Get branch code
    SELECT code INTO v_branch_code FROM branches WHERE id = p_branch_id;

    -- Date part YYYYMMDD
    v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- Get next sequence for this branch and date
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(sale_number FROM LENGTH(v_branch_code) + 10) AS INTEGER)
    ), 0) + 1
    INTO v_sequence
    FROM sales
    WHERE branch_id = p_branch_id
    AND sale_number LIKE v_branch_code || '-' || v_date_part || '-%';

    -- Generate sale number: BR001-20251224-0001
    v_sale_number := v_branch_code || '-' || v_date_part || '-' || LPAD(v_sequence::TEXT, 4, '0');

    RETURN v_sale_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate session totals
CREATE OR REPLACE FUNCTION calculate_session_totals(p_session_id UUID)
RETURNS TABLE (
    expected_cash DECIMAL(12,2),
    expected_card DECIMAL(12,2),
    expected_qr DECIMAL(12,2),
    expected_transfer DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN pm.code = 'CASH' THEN sp.amount ELSE 0 END), 0) as expected_cash,
        COALESCE(SUM(CASE WHEN pm.code = 'CARD' THEN sp.amount ELSE 0 END), 0) as expected_card,
        COALESCE(SUM(CASE WHEN pm.code = 'QR' THEN sp.amount ELSE 0 END), 0) as expected_qr,
        COALESCE(SUM(CASE WHEN pm.code = 'TRANSFER' THEN sp.amount ELSE 0 END), 0) as expected_transfer
    FROM sales s
    JOIN sale_payments sp ON s.id = sp.sale_id
    JOIN payment_methods pm ON sp.payment_method_id = pm.id
    WHERE s.session_id = p_session_id
    AND s.status = 'COMPLETED';
END;
$$ LANGUAGE plpgsql;

-- Function to update daily report
CREATE OR REPLACE FUNCTION update_daily_report(p_branch_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_reports (branch_id, business_date)
    VALUES (p_branch_id, p_date)
    ON CONFLICT (branch_id, business_date) DO NOTHING;

    UPDATE daily_reports dr
    SET
        total_cash = subq.total_cash,
        total_card = subq.total_card,
        total_qr = subq.total_qr,
        total_transfer = subq.total_transfer,
        total_gross_sales = subq.total_gross,
        total_discounts = subq.total_discounts,
        total_net_sales = subq.total_net,
        transaction_count = subq.tx_count,
        voided_count = subq.void_count,
        voided_amount = subq.void_amount,
        updated_at = CURRENT_TIMESTAMP
    FROM (
        SELECT
            COALESCE(SUM(CASE WHEN pm.code = 'CASH' THEN sp.amount ELSE 0 END), 0) as total_cash,
            COALESCE(SUM(CASE WHEN pm.code = 'CARD' THEN sp.amount ELSE 0 END), 0) as total_card,
            COALESCE(SUM(CASE WHEN pm.code = 'QR' THEN sp.amount ELSE 0 END), 0) as total_qr,
            COALESCE(SUM(CASE WHEN pm.code = 'TRANSFER' THEN sp.amount ELSE 0 END), 0) as total_transfer,
            COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.subtotal ELSE 0 END), 0) as total_gross,
            COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.discount_amount ELSE 0 END), 0) as total_discounts,
            COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.total_amount ELSE 0 END), 0) as total_net,
            COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END) as tx_count,
            COUNT(CASE WHEN s.status = 'VOIDED' THEN 1 END) as void_count,
            COALESCE(SUM(CASE WHEN s.status = 'VOIDED' THEN s.total_amount ELSE 0 END), 0) as void_amount
        FROM sales s
        LEFT JOIN sale_payments sp ON s.id = sp.sale_id
        LEFT JOIN payment_methods pm ON sp.payment_method_id = pm.id
        WHERE s.branch_id = p_branch_id
        AND DATE(s.created_at) = p_date
    ) subq
    WHERE dr.branch_id = p_branch_id
    AND dr.business_date = p_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
