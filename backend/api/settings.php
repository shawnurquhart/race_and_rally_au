<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$sessionKey = 'rra_admin_authenticated';

function normalize_payment_environment($value): string {
  return $value === 'sandbox' ? 'sandbox' : 'production';
}

function get_app_setting(PDO $pdo, string $key, string $fallback = ''): string {
  $stmt = $pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1');
  $stmt->execute([$key]);
  $row = $stmt->fetch();
  $value = is_array($row) ? trim((string)($row['setting_value'] ?? '')) : '';
  return $value !== '' ? $value : $fallback;
}

function save_app_setting(PDO $pdo, string $key, string $value): void {
  $stmt = $pdo->prepare(
    'INSERT INTO app_settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)'
  );
  $stmt->execute([$key, $value, date('c')]);
}

function require_admin_settings(): void {
  global $sessionKey;
  if (empty($_SESSION[$sessionKey])) {
    api_response(['ok' => false, 'error' => 'Unauthorized'], 401);
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  require_admin_settings();
  api_response([
    'ok' => true,
    'contactFormToEmail' => get_app_setting($pdo, 'contact_form_to_email', 'manager@raceandrallyaustralia.com.au'),
    'paymentEnvironment' => normalize_payment_environment(get_app_setting($pdo, 'payment_environment', 'production')),
  ]);
}

$payload = api_read_json();
$action = trim((string)($payload['action'] ?? ''));

if ($action === 'saveContactFormEmail') {
  require_admin_settings();
  $email = trim((string)($payload['email'] ?? ''));
  if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    api_response(['ok' => false, 'error' => 'Invalid email address'], 400);
  }

  $stmt = $pdo->prepare(
    'INSERT INTO app_settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)'
  );
  $stmt->execute(['contact_form_to_email', $email, date('c')]);

  api_response(['ok' => true, 'contactFormToEmail' => $email]);
}

if ($action === 'savePaymentEnvironment') {
  require_admin_settings();
  $environment = normalize_payment_environment((string)($payload['environment'] ?? 'production'));
  save_app_setting($pdo, 'payment_environment', $environment);

  api_response(['ok' => true, 'paymentEnvironment' => $environment]);
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
