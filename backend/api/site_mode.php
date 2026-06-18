<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$sessionKey = 'rra_admin_authenticated';

function ensure_site_mode_table(PDO $pdo): void {
  $pdo->exec(
    "CREATE TABLE IF NOT EXISTS app_settings (
      setting_key VARCHAR(128) PRIMARY KEY,
      setting_value TEXT NULL,
      updated_at VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
  );
}

function read_site_mode(PDO $pdo): string {
  $stmt = $pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1');
  $stmt->execute(['site_mode']);
  $row = $stmt->fetch();
  $mode = is_array($row) ? trim((string)($row['setting_value'] ?? '')) : '';
  if (!in_array($mode, ['standard', 'hide_admin', 'update_mode'], true)) {
    return 'standard';
  }
  return $mode;
}

function is_remote_secret_authorized(array $cfg): bool {
  $configured = trim((string)($cfg['remote_site_mode_secret'] ?? ''));
  if ($configured === '') {
    return false;
  }

  $provided = trim((string)($_SERVER['HTTP_X_RRA_SITE_MODE_SECRET'] ?? ''));
  if ($provided === '') {
    return false;
  }

  return hash_equals($configured, $provided);
}

function require_site_mode_write_access(array $cfg, string $sessionKey): void {
  $isAdminSession = !empty($_SESSION[$sessionKey]);
  $isRemoteSecret = is_remote_secret_authorized($cfg);

  if (!$isAdminSession && !$isRemoteSecret) {
    api_response(['ok' => false, 'error' => 'Unauthorized'], 401);
  }
}

ensure_site_mode_table($pdo);
$cfg = require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  api_response(['ok' => true, 'siteMode' => read_site_mode($pdo)]);
}

$payload = api_read_json();
$action = trim((string)($payload['action'] ?? ''));

if ($action === 'setMode') {
  require_site_mode_write_access($cfg, $sessionKey);

  $mode = trim((string)($payload['mode'] ?? ''));
  if (!in_array($mode, ['standard', 'hide_admin', 'update_mode'], true)) {
    api_response(['ok' => false, 'error' => 'Invalid mode'], 400);
  }

  $stmt = $pdo->prepare(
    'INSERT INTO app_settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)'
  );
  $stmt->execute(['site_mode', $mode, date('c')]);

  api_response(['ok' => true, 'siteMode' => $mode]);
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
