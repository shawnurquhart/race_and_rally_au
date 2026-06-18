<?php
require __DIR__ . '/_bootstrap.php';

$sessionKey = 'rra_admin_authenticated';
if (empty($_SESSION[$sessionKey])) {
  api_response(['ok' => false, 'error' => 'Unauthorized'], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  api_response(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$payload = api_read_json();
$root = trim((string)($payload['root'] ?? 'assets'));
$files = $payload['files'] ?? [];

if (!is_array($files) || count($files) === 0) {
  api_response(['ok' => false, 'error' => 'No files provided'], 400);
}

if (count($files) > 500) {
  api_response(['ok' => false, 'error' => 'Too many files in one request'], 400);
}

$root = str_replace('\\', '/', ltrim($root, '/'));
if ($root === '' || str_contains($root, '..')) {
  api_response(['ok' => false, 'error' => 'Invalid root path'], 400);
}

// Deletion is intentionally restricted to assets only for safety.
$firstPart = explode('/', $root)[0] ?? '';
if ($firstPart !== 'assets') {
  api_response(['ok' => false, 'error' => 'Delete is allowed only under assets'], 403);
}

$apiDirReal = realpath(__DIR__);
$apiDirNormalized = $apiDirReal ? str_replace('\\', '/', $apiDirReal) : '';

// Support both layouts:
// 1) public_html/backend/api          -> go up 2
// 2) public_html/assets/backend/api   -> go up 3
$baseRoot = str_ends_with($apiDirNormalized, '/assets/backend/api')
  ? realpath(dirname(__DIR__, 3))
  : realpath(dirname(__DIR__, 2));
if ($baseRoot === false) {
  api_response(['ok' => false, 'error' => 'Unable to resolve base path'], 500);
}

$targetRoot = realpath($baseRoot . DIRECTORY_SEPARATOR . $root);
if ($targetRoot === false || !str_starts_with($targetRoot, $baseRoot) || !is_dir($targetRoot)) {
  api_response(['ok' => false, 'error' => 'Root path not found'], 404);
}

$deleted = [];
$failed = [];

foreach ($files as $relativePath) {
  $rel = trim((string)$relativePath);
  $rel = str_replace('\\', '/', ltrim($rel, '/'));
  if ($rel === '' || str_contains($rel, '..')) {
    $failed[] = ['path' => $relativePath, 'reason' => 'Invalid relative path'];
    continue;
  }

  $fullPath = $targetRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rel);
  $resolvedParent = realpath(dirname($fullPath));
  if ($resolvedParent === false || !str_starts_with($resolvedParent, $targetRoot)) {
    $failed[] = ['path' => $relativePath, 'reason' => 'Path escapes root'];
    continue;
  }

  if (!file_exists($fullPath)) {
    $failed[] = ['path' => $relativePath, 'reason' => 'File not found'];
    continue;
  }

  if (!is_file($fullPath)) {
    $failed[] = ['path' => $relativePath, 'reason' => 'Not a file'];
    continue;
  }

  if (@unlink($fullPath)) {
    $deleted[] = $relativePath;
  } else {
    $failed[] = ['path' => $relativePath, 'reason' => 'Delete failed'];
  }
}

api_response([
  'ok' => true,
  'root' => $root,
  'requested' => count($files),
  'deletedCount' => count($deleted),
  'deleted' => $deleted,
  'failedCount' => count($failed),
  'failed' => $failed,
]);
