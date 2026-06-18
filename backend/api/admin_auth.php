<?php
require __DIR__ . '/_bootstrap.php';

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
  api_response(['ok' => false, 'error' => 'Missing backend/api/config.php'], 500);
}
$cfg = require $configPath;

$adminUsername = (string)($cfg['admin_username'] ?? '');
$adminPassword = (string)($cfg['admin_password'] ?? '');
$sessionKey = 'rra_admin_authenticated';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  api_response([
    'ok' => true,
    'authenticated' => !empty($_SESSION[$sessionKey]),
  ]);
}

$payload = api_read_json();
$action = (string)($payload['action'] ?? '');

if ($action === 'login') {
  $username = trim((string)($payload['username'] ?? ''));
  $password = (string)($payload['password'] ?? '');

  if ($adminUsername === '' || $adminPassword === '') {
    api_response(['ok' => false, 'error' => 'Admin credentials are not configured on server.'], 400);
  }

  $isValid = hash_equals($adminUsername, $username) && hash_equals($adminPassword, $password);
  if (!$isValid) {
    unset($_SESSION[$sessionKey]);
    api_response(['ok' => false, 'authenticated' => false], 401);
  }

  $_SESSION[$sessionKey] = true;
  api_response(['ok' => true, 'authenticated' => true]);
}

if ($action === 'logout') {
  unset($_SESSION[$sessionKey]);
  api_response(['ok' => true]);
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
