<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET,POST,OPTIONS');

if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start();
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function api_response($payload, $status = 200) {
  http_response_code($status);
  echo json_encode($payload);
  exit;
}

function api_read_json() {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $parsed = json_decode($raw, true);
  return is_array($parsed) ? $parsed : [];
}

function api_db() {
  $configPath = __DIR__ . '/config.php';
  if (!file_exists($configPath)) {
    api_response(['ok' => false, 'error' => 'Missing backend/api/config.php'], 500);
  }

  $cfg = require $configPath;
  try {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $cfg['db_host'], $cfg['db_name'], $cfg['db_charset'] ?? 'utf8mb4');
    $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
  } catch (Throwable $e) {
    api_response(['ok' => false, 'error' => 'DB connection failed', 'details' => $e->getMessage()], 500);
  }
}
