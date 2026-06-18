<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$tables = [];
foreach (['products', 'upload_register_entries', 'upload_register_references', 'sales_orders', 'sales_order_items'] as $table) {
  $stmt = $pdo->prepare('SHOW TABLES LIKE ?');
  $stmt->execute([$table]);
  $tables[$table] = (bool)$stmt->fetch();
}

api_response([
  'ok' => true,
  'database' => 'connected',
  'tables' => $tables,
]);
