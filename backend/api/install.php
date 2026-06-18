<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$sql = [
  "CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(128) PRIMARY KEY,
    brand VARCHAR(64) NOT NULL,
    category VARCHAR(255) NOT NULL,
    sub_category VARCHAR(255) NULL,
    folder_name VARCHAR(255) NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NULL,
    units_per_package INT NULL,
    image_reference TEXT NOT NULL,
    gallery_image_references LONGTEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at VARCHAR(64) NOT NULL,
    updated_at VARCHAR(64) NOT NULL,
    INDEX idx_brand (brand),
    INDEX idx_category (category),
    INDEX idx_sku (sku)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS upload_register_entries (
    id VARCHAR(128) PRIMARY KEY,
    uploaded_at VARCHAR(64) NOT NULL,
    file_count INT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS upload_register_references (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entry_id VARCHAR(128) NOT NULL,
    reference_value TEXT NOT NULL,
    INDEX idx_entry (entry_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS sales_orders (
    id VARCHAR(128) PRIMARY KEY,
    created_at VARCHAR(64) NOT NULL,
    simulated_transaction_id VARCHAR(128) NOT NULL,
    payment_method VARCHAR(64) NOT NULL,
    payment_status VARCHAR(64) NOT NULL,
    fulfilment_status VARCHAR(64) NOT NULL,
    include_gst TINYINT(1) NOT NULL DEFAULT 1,
    customer_full_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_ship_to_address TEXT NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    gst DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    payment_provider VARCHAR(64) NULL,
    payment_reference VARCHAR(255) NULL,
    gateway_transaction_id VARCHAR(255) NULL,
    payment_date VARCHAR(64) NULL,
    payment_response LONGTEXT NULL,
    INDEX idx_sales_created_at (created_at),
    INDEX idx_sales_fulfilment_status (fulfilment_status),
    INDEX idx_sales_transaction_id (simulated_transaction_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS sales_order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(128) NOT NULL,
    product_id VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(128) NOT NULL,
    image_reference TEXT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    INDEX idx_sales_item_order_id (order_id),
    INDEX idx_sales_item_sku (sku)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS traffic_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    visited_at VARCHAR(64) NOT NULL,
    created_at VARCHAR(64) NOT NULL,
    page_path VARCHAR(512) NOT NULL,
    ip_address VARCHAR(128) NOT NULL,
    country_code VARCHAR(8) NULL,
    country_name VARCHAR(128) NULL,
    geo_lookup_status VARCHAR(32) NULL,
    geo_lookup_provider VARCHAR(64) NULL,
    session_id VARCHAR(128) NOT NULL,
    view_started_at VARCHAR(64) NULL,
    view_ended_at VARCHAR(64) NULL,
    view_duration_seconds INT NULL,
    referrer TEXT NULL,
    user_agent TEXT NULL,
    INDEX idx_traffic_visited_at (visited_at),
    INDEX idx_traffic_page_path (page_path),
    INDEX idx_traffic_session_id (session_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS contact_submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at VARCHAR(64) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NULL,
    company VARCHAR(255) NULL,
    inquiry_type VARCHAR(128) NULL,
    vehicle_details VARCHAR(255) NULL,
    preferred_contact VARCHAR(32) NULL,
    subject VARCHAR(255) NULL,
    message TEXT NOT NULL,
    newsletter_opt_in TINYINT(1) NOT NULL DEFAULT 0,
    vendor_interest TINYINT(1) NOT NULL DEFAULT 0,
    ip_address VARCHAR(128) NOT NULL,
    country_code VARCHAR(8) NULL,
    country_name VARCHAR(128) NULL,
    geo_lookup_status VARCHAR(32) NULL,
    geo_lookup_provider VARCHAR(64) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'new',
    INDEX idx_contact_created_at (created_at),
    INDEX idx_contact_email (email),
    INDEX idx_contact_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(128) PRIMARY KEY,
    setting_value TEXT NULL,
    updated_at VARCHAR(64) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS site_reporting_status (
    route_key VARCHAR(128) PRIMARY KEY,
    page_name VARCHAR(128) NOT NULL,
    status_code VARCHAR(16) NOT NULL,
    comment_text VARCHAR(100) NULL,
    updated_at VARCHAR(64) NOT NULL,
    INDEX idx_site_reporting_status_code (status_code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS page_status_availability (
    page_key VARCHAR(128) PRIMARY KEY,
    page_label VARCHAR(128) NOT NULL,
    route_path VARCHAR(255) NULL,
    item_kind VARCHAR(16) NOT NULL,
    update_status VARCHAR(16) NOT NULL,
    is_online TINYINT(1) NOT NULL DEFAULT 1,
    notes VARCHAR(500) NULL,
    updated_at VARCHAR(64) NOT NULL,
    INDEX idx_page_status_item_kind (item_kind),
    INDEX idx_page_status_online (is_online)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS payment_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at VARCHAR(64) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    action_name VARCHAR(64) NOT NULL,
    order_id VARCHAR(128) NULL,
    merchant_reference VARCHAR(255) NULL,
    status_code INT NULL,
    request_payload LONGTEXT NULL,
    response_payload LONGTEXT NULL,
    redirect_url TEXT NULL,
    error_message TEXT NULL,
    INDEX idx_payment_logs_created_at (created_at),
    INDEX idx_payment_logs_order_id (order_id),
    INDEX idx_payment_logs_action (action_name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS payment_callbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    received_at VARCHAR(64) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    order_id VARCHAR(128) NULL,
    merchant_reference VARCHAR(255) NULL,
    gateway_transaction_id VARCHAR(255) NULL,
    payment_status VARCHAR(64) NULL,
    signature_valid TINYINT(1) NULL,
    headers_payload LONGTEXT NULL,
    body_payload LONGTEXT NULL,
    INDEX idx_payment_callbacks_received_at (received_at),
    INDEX idx_payment_callbacks_order_id (order_id),
    INDEX idx_payment_callbacks_reference (merchant_reference)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

foreach ($sql as $statement) {
  $pdo->exec($statement);
}

// Lightweight schema migration for existing installations.
$columnsStmt = $pdo->query('SHOW COLUMNS FROM sales_order_items');
$existingColumns = array_map(function ($row) {
  return $row['Field'];
}, $columnsStmt->fetchAll());

if (!in_array('fulfilment_status', $existingColumns, true)) {
  $pdo->exec("ALTER TABLE sales_order_items ADD COLUMN fulfilment_status VARCHAR(64) NOT NULL DEFAULT 'pending'");
}
if (!in_array('fulfilment_note', $existingColumns, true)) {
  $pdo->exec("ALTER TABLE sales_order_items ADD COLUMN fulfilment_note VARCHAR(255) NULL");
}
if (!in_array('shipped_at', $existingColumns, true)) {
  $pdo->exec("ALTER TABLE sales_order_items ADD COLUMN shipped_at VARCHAR(64) NULL");
}
if (!in_array('updated_at', $existingColumns, true)) {
  $pdo->exec("ALTER TABLE sales_order_items ADD COLUMN updated_at VARCHAR(64) NULL");
}

$salesOrderColumnsStmt = $pdo->query('SHOW COLUMNS FROM sales_orders');
$salesOrderColumns = array_map(function ($row) {
  return $row['Field'];
}, $salesOrderColumnsStmt->fetchAll());

$salesOrderPaymentColumns = [
  'payment_provider' => "ALTER TABLE sales_orders ADD COLUMN payment_provider VARCHAR(64) NULL AFTER total",
  'payment_reference' => "ALTER TABLE sales_orders ADD COLUMN payment_reference VARCHAR(255) NULL AFTER payment_provider",
  'gateway_transaction_id' => "ALTER TABLE sales_orders ADD COLUMN gateway_transaction_id VARCHAR(255) NULL AFTER payment_reference",
  'payment_date' => "ALTER TABLE sales_orders ADD COLUMN payment_date VARCHAR(64) NULL AFTER gateway_transaction_id",
  'payment_response' => "ALTER TABLE sales_orders ADD COLUMN payment_response LONGTEXT NULL AFTER payment_date",
];

foreach ($salesOrderPaymentColumns as $column => $statement) {
  if (!in_array($column, $salesOrderColumns, true)) {
    $pdo->exec($statement);
  }
}

$trafficColumnsStmt = $pdo->query('SHOW COLUMNS FROM traffic_logs');
$trafficColumns = array_map(function ($row) {
  return $row['Field'];
}, $trafficColumnsStmt->fetchAll());

if (!in_array('country_code', $trafficColumns, true)) {
  $pdo->exec("ALTER TABLE traffic_logs ADD COLUMN country_code VARCHAR(8) NULL AFTER ip_address");
}
if (!in_array('country_name', $trafficColumns, true)) {
  $pdo->exec("ALTER TABLE traffic_logs ADD COLUMN country_name VARCHAR(128) NULL AFTER country_code");
}
if (!in_array('geo_lookup_status', $trafficColumns, true)) {
  $pdo->exec("ALTER TABLE traffic_logs ADD COLUMN geo_lookup_status VARCHAR(32) NULL AFTER country_name");
}
if (!in_array('geo_lookup_provider', $trafficColumns, true)) {
  $pdo->exec("ALTER TABLE traffic_logs ADD COLUMN geo_lookup_provider VARCHAR(64) NULL AFTER geo_lookup_status");
}
if (!in_array('created_at', $trafficColumns, true)) {
  $pdo->exec("ALTER TABLE traffic_logs ADD COLUMN created_at VARCHAR(64) NOT NULL DEFAULT '' AFTER visited_at");
  $pdo->exec("UPDATE traffic_logs SET created_at = visited_at WHERE created_at = '' OR created_at IS NULL");
}

api_response(['ok' => true, 'installed' => true]);
