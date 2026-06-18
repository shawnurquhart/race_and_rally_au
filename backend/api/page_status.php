<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$sessionKey = 'rra_admin_authenticated';

function ensure_page_status_table(PDO $pdo): void {
  $pdo->exec(
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
  );
}

function require_admin_page_status(): void {
  global $sessionKey;
  if (empty($_SESSION[$sessionKey])) {
    api_response(['ok' => false, 'error' => 'Unauthorized'], 401);
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  ensure_page_status_table($pdo);
  $stmt = $pdo->query('SELECT page_key, page_label, route_path, item_kind, update_status, is_online, notes, updated_at FROM page_status_availability ORDER BY item_kind ASC, page_label ASC');
  api_response(['ok' => true, 'rows' => $stmt->fetchAll()]);
}

$payload = api_read_json();
$action = trim((string)($payload['action'] ?? ''));

if ($action === 'setStatus') {
  require_admin_page_status();
  ensure_page_status_table($pdo);

  $pageKey = trim((string)($payload['pageKey'] ?? ''));
  $label = trim((string)($payload['label'] ?? ''));
  $routePathRaw = $payload['routePath'] ?? null;
  $routePath = $routePathRaw === null ? null : trim((string)$routePathRaw);
  $kind = trim((string)($payload['kind'] ?? ''));
  $updateStatus = trim((string)($payload['updateStatus'] ?? ''));
  $isOnline = !empty($payload['isOnline']) ? 1 : 0;
  $notes = trim((string)($payload['notes'] ?? ''));

  if ($pageKey === '' || $label === '') {
    api_response(['ok' => false, 'error' => 'Missing page key/label'], 400);
  }
  if (!in_array($kind, ['page', 'form'], true)) {
    api_response(['ok' => false, 'error' => 'Invalid item kind'], 400);
  }
  if (!in_array($updateStatus, ['up_to_date', 'needs_update'], true)) {
    api_response(['ok' => false, 'error' => 'Invalid update status'], 400);
  }
  if (strlen($notes) > 500) {
    api_response(['ok' => false, 'error' => 'Notes must be 500 characters or less'], 400);
  }

  $stmt = $pdo->prepare(
    'INSERT INTO page_status_availability (page_key, page_label, route_path, item_kind, update_status, is_online, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       page_label = VALUES(page_label),
       route_path = VALUES(route_path),
       item_kind = VALUES(item_kind),
       update_status = VALUES(update_status),
       is_online = VALUES(is_online),
       notes = VALUES(notes),
       updated_at = VALUES(updated_at)'
  );

  $stmt->execute([
    $pageKey,
    $label,
    $routePath,
    $kind,
    $updateStatus,
    $isOnline,
    $notes !== '' ? $notes : null,
    date('c'),
  ]);

  api_response(['ok' => true]);
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
