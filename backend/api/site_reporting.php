<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$sessionKey = 'rra_admin_authenticated';

function require_admin_site_reporting(): void {
  global $sessionKey;
  if (empty($_SESSION[$sessionKey])) {
    api_response(['ok' => false, 'error' => 'Unauthorized'], 401);
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  require_admin_site_reporting();
  $stmt = $pdo->query('SELECT route_key, page_name, status_code, comment_text, updated_at FROM site_reporting_status ORDER BY page_name ASC');
  api_response(['ok' => true, 'rows' => $stmt->fetchAll()]);
}

$payload = api_read_json();
$action = trim((string)($payload['action'] ?? ''));

if ($action === 'setStatus') {
  require_admin_site_reporting();
  $routeKey = trim((string)($payload['routeKey'] ?? ''));
  $pageName = trim((string)($payload['pageName'] ?? ''));
  $statusCode = trim((string)($payload['statusCode'] ?? ''));
  $commentText = trim((string)($payload['commentText'] ?? ''));

  if ($routeKey === '' || $pageName === '') {
    api_response(['ok' => false, 'error' => 'Missing route/page'], 400);
  }
  if (!in_array($statusCode, ['not_started', 'wip', 'complete'], true)) {
    api_response(['ok' => false, 'error' => 'Invalid status'], 400);
  }
  if (strlen($commentText) > 100) {
    api_response(['ok' => false, 'error' => 'Comment must be 100 characters or less'], 400);
  }

  $stmt = $pdo->prepare(
    'INSERT INTO site_reporting_status (route_key, page_name, status_code, comment_text, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       page_name = VALUES(page_name),
       status_code = VALUES(status_code),
       comment_text = VALUES(comment_text),
       updated_at = VALUES(updated_at)'
  );
  $stmt->execute([
    $routeKey,
    $pageName,
    $statusCode,
    $commentText !== '' ? $commentText : null,
    date('c'),
  ]);

  api_response(['ok' => true]);
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
