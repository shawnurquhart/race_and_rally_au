<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();

function recalc_order_fulfilment_status(PDO $pdo, string $orderId): void {
  $stmt = $pdo->prepare('SELECT fulfilment_status FROM sales_order_items WHERE order_id = ?');
  $stmt->execute([$orderId]);
  $rows = $stmt->fetchAll();
  if (!$rows) {
    $next = 'pending';
  } else {
    $statuses = array_map(function ($row) {
      return strtolower((string)($row['fulfilment_status'] ?? 'pending'));
    }, $rows);

    $allSent = count(array_filter($statuses, fn($s) => $s === 'sent')) === count($statuses);
    $anySent = count(array_filter($statuses, fn($s) => $s === 'sent')) > 0;
    $anyPending = count(array_filter($statuses, fn($s) => in_array($s, ['pending', 'back-order', 'manual-update'], true))) > 0;

    if ($allSent) {
      $next = 'fulfilled';
    } elseif ($anySent || $anyPending) {
      $next = 'partial';
    } else {
      $next = 'pending';
    }
  }

  $update = $pdo->prepare('UPDATE sales_orders SET fulfilment_status = ? WHERE id = ?');
  $update->execute([$next, $orderId]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $stmt = $pdo->query('SELECT * FROM sales_orders ORDER BY created_at DESC');
  $orders = $stmt->fetchAll();

  $itemsStmt = $pdo->prepare('SELECT * FROM sales_order_items WHERE order_id = ? ORDER BY id ASC');
  $result = [];

  foreach ($orders as $order) {
    $itemsStmt->execute([$order['id']]);
    $itemsRows = $itemsStmt->fetchAll();

    $items = array_map(function ($row) {
      return [
        'id' => (int)$row['id'],
        'productId' => $row['product_id'],
        'name' => $row['name'],
        'sku' => $row['sku'],
        'imageReference' => $row['image_reference'],
        'unitPrice' => (float)$row['unit_price'],
        'quantity' => (int)$row['quantity'],
        'fulfilmentStatus' => $row['fulfilment_status'] ?: 'pending',
        'fulfilmentNote' => $row['fulfilment_note'] ?: '',
        'shippedAt' => $row['shipped_at'] ?: null,
        'updatedAt' => $row['updated_at'] ?: null,
      ];
    }, $itemsRows);

    $result[] = [
      'id' => $order['id'],
      'createdAt' => $order['created_at'],
      'simulatedTransactionId' => $order['simulated_transaction_id'],
      'paymentMethod' => $order['payment_method'],
      'paymentStatus' => $order['payment_status'],
      'fulfilmentStatus' => $order['fulfilment_status'],
      'includeGst' => (bool)$order['include_gst'],
      'customer' => [
        'fullName' => $order['customer_full_name'],
        'phone' => $order['customer_phone'],
        'email' => $order['customer_email'],
        'shipToAddress' => $order['customer_ship_to_address'],
      ],
      'items' => $items,
      'totals' => [
        'subtotal' => (float)$order['subtotal'],
        'gst' => (float)$order['gst'],
        'total' => (float)$order['total'],
      ],
    ];
  }

  api_response(['ok' => true, 'orders' => $result]);
}

$payload = api_read_json();
$action = $payload['action'] ?? '';

if ($action === 'record') {
  $order = $payload['order'] ?? null;
  if (!is_array($order) || empty($order['id'])) {
    api_response(['ok' => false, 'error' => 'Invalid order payload'], 400);
  }

  $pdo->beginTransaction();
  try {
    $stmt = $pdo->prepare(
      'INSERT INTO sales_orders (
        id, created_at, simulated_transaction_id, payment_method, payment_status, fulfilment_status,
        include_gst, customer_full_name, customer_phone, customer_email, customer_ship_to_address,
        subtotal, gst, total, payment_provider, payment_reference, gateway_transaction_id, payment_date, payment_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        created_at = VALUES(created_at),
        simulated_transaction_id = VALUES(simulated_transaction_id),
        payment_method = VALUES(payment_method),
        payment_status = VALUES(payment_status),
        fulfilment_status = VALUES(fulfilment_status),
        include_gst = VALUES(include_gst),
        customer_full_name = VALUES(customer_full_name),
        customer_phone = VALUES(customer_phone),
        customer_email = VALUES(customer_email),
        customer_ship_to_address = VALUES(customer_ship_to_address),
        subtotal = VALUES(subtotal),
        gst = VALUES(gst),
        total = VALUES(total),
        payment_provider = VALUES(payment_provider),
        payment_reference = VALUES(payment_reference),
        gateway_transaction_id = VALUES(gateway_transaction_id),
        payment_date = VALUES(payment_date),
        payment_response = VALUES(payment_response)'
    );

    $stmt->execute([
      $order['id'] ?? '',
      $order['createdAt'] ?? date('c'),
      $order['simulatedTransactionId'] ?? '',
      $order['paymentMethod'] ?? 'simulated-card',
      $order['paymentStatus'] ?? 'captured',
      $order['fulfilmentStatus'] ?? 'pending',
      !empty($order['includeGst']) ? 1 : 0,
      $order['customer']['fullName'] ?? '',
      $order['customer']['phone'] ?? '',
      $order['customer']['email'] ?? '',
      $order['customer']['shipToAddress'] ?? '',
      (float)($order['totals']['subtotal'] ?? 0),
      (float)($order['totals']['gst'] ?? 0),
      (float)($order['totals']['total'] ?? 0),
      $order['paymentProvider'] ?? null,
      $order['paymentReference'] ?? null,
      $order['gatewayTransactionId'] ?? null,
      $order['paymentDate'] ?? null,
      isset($order['paymentResponse']) ? json_encode($order['paymentResponse']) : null,
    ]);

    $deleteItems = $pdo->prepare('DELETE FROM sales_order_items WHERE order_id = ?');
    $deleteItems->execute([$order['id']]);

    $insertItem = $pdo->prepare(
      'INSERT INTO sales_order_items (
        order_id, product_id, name, sku, image_reference, unit_price, quantity, line_total,
        fulfilment_status, fulfilment_note, shipped_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $items = is_array($order['items'] ?? null) ? $order['items'] : [];
    foreach ($items as $item) {
      $unitPrice = (float)($item['unitPrice'] ?? 0);
      $qty = (int)($item['quantity'] ?? 0);
      $insertItem->execute([
        $order['id'],
        $item['productId'] ?? '',
        $item['name'] ?? '',
        $item['sku'] ?? '',
        $item['imageReference'] ?? '',
        $unitPrice,
        $qty,
        $unitPrice * $qty,
        $item['fulfilmentStatus'] ?? 'pending',
        $item['fulfilmentNote'] ?? null,
        $item['shippedAt'] ?? null,
        $item['updatedAt'] ?? date('c'),
      ]);
    }

    recalc_order_fulfilment_status($pdo, (string)$order['id']);

    $pdo->commit();
    api_response(['ok' => true]);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    api_response(['ok' => false, 'error' => 'Failed to record sale', 'details' => $e->getMessage()], 500);
  }
}

if ($action === 'updateItemStatus') {
  $itemId = (int)($payload['itemId'] ?? 0);
  $status = trim((string)($payload['status'] ?? 'pending'));
  $note = isset($payload['note']) ? trim((string)$payload['note']) : null;
  $allowed = ['pending', 'sent', 'back-order', 'manual-update', 'cancelled'];
  if ($itemId <= 0 || !in_array($status, $allowed, true)) {
    api_response(['ok' => false, 'error' => 'Invalid item/status'], 400);
  }

  $find = $pdo->prepare('SELECT order_id FROM sales_order_items WHERE id = ?');
  $find->execute([$itemId]);
  $row = $find->fetch();
  if (!$row) {
    api_response(['ok' => false, 'error' => 'Item not found'], 404);
  }

  $shippedAt = $status === 'sent' ? date('c') : null;
  $update = $pdo->prepare('UPDATE sales_order_items SET fulfilment_status = ?, fulfilment_note = ?, shipped_at = ?, updated_at = ? WHERE id = ?');
  $update->execute([$status, $note, $shippedAt, date('c'), $itemId]);
  recalc_order_fulfilment_status($pdo, (string)$row['order_id']);
  api_response(['ok' => true]);
}

if ($action === 'bulkImportStatuses') {
  $updates = is_array($payload['updates'] ?? null) ? $payload['updates'] : [];
  $allowed = ['pending', 'sent', 'back-order', 'manual-update', 'cancelled'];
  $affectedOrders = [];

  $pdo->beginTransaction();
  try {
    $find = $pdo->prepare('SELECT id, order_id FROM sales_order_items WHERE order_id = ? AND sku = ? LIMIT 1');
    $update = $pdo->prepare('UPDATE sales_order_items SET fulfilment_status = ?, fulfilment_note = ?, shipped_at = ?, updated_at = ? WHERE id = ?');

    foreach ($updates as $entry) {
      $orderId = trim((string)($entry['orderId'] ?? ''));
      $sku = trim((string)($entry['sku'] ?? ''));
      $status = trim((string)($entry['status'] ?? 'pending'));
      $note = isset($entry['note']) ? trim((string)$entry['note']) : null;
      if ($orderId === '' || $sku === '' || !in_array($status, $allowed, true)) {
        continue;
      }

      $find->execute([$orderId, $sku]);
      $item = $find->fetch();
      if (!$item) {
        continue;
      }

      $shippedAt = $status === 'sent' ? date('c') : null;
      $update->execute([$status, $note, $shippedAt, date('c'), $item['id']]);
      $affectedOrders[$item['order_id']] = true;
    }

    foreach (array_keys($affectedOrders) as $oid) {
      recalc_order_fulfilment_status($pdo, (string)$oid);
    }

    $pdo->commit();
    api_response(['ok' => true, 'updatedOrders' => count($affectedOrders)]);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    api_response(['ok' => false, 'error' => 'Bulk import failed', 'details' => $e->getMessage()], 500);
  }
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
