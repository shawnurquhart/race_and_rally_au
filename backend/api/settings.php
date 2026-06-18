<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$sessionKey = 'rra_admin_authenticated';

function require_admin_settings(): void {
  global $sessionKey;
  if (empty($_SESSION[$sessionKey])) {
    api_response(['ok' => false, 'error' => 'Unauthorized'], 401);
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  require_admin_settings();
  $stmt = $pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1');
  $stmt->execute(['contact_form_to_email']);
  $row = $stmt->fetch();
  $value = is_array($row) ? trim((string)($row['setting_value'] ?? '')) : '';
  if ($value === '') {
    $value = 'manager@raceandrallyaustralia.com.au';
  }
  api_response(['ok' => true, 'contactFormToEmail' => $value]);
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

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
