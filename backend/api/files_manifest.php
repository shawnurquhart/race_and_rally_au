<?php
require __DIR__ . '/_bootstrap.php';

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

$requested = trim((string)($_GET['path'] ?? 'assets'));
$requested = str_replace('\\', '/', $requested);
$requested = ltrim($requested, '/');

if ($requested === '' || str_contains($requested, '..')) {
  api_response(['ok' => false, 'error' => 'Invalid path'], 400);
}

$allowedRoots = ['assets', 'backend'];
$firstPart = explode('/', $requested)[0] ?? '';
if (!in_array($firstPart, $allowedRoots, true)) {
  api_response(['ok' => false, 'error' => 'Path not allowed'], 403);
}

$target = realpath($baseRoot . DIRECTORY_SEPARATOR . $requested);
if ($target === false || !str_starts_with($target, $baseRoot)) {
  api_response(['ok' => false, 'error' => 'Path does not exist'], 404);
}

if (!is_dir($target)) {
  api_response(['ok' => false, 'error' => 'Path is not a directory'], 400);
}

$requestedMax = (int)($_GET['max'] ?? 4000);
$maxEntries = max(500, min(20000, $requestedMax));
$entries = [];
$directoryCount = 0;
$fileCount = 0;

$rootLen = strlen($target) + 1;
$iter = new RecursiveIteratorIterator(
  new RecursiveDirectoryIterator($target, FilesystemIterator::SKIP_DOTS),
  RecursiveIteratorIterator::SELF_FIRST
);

foreach ($iter as $item) {
  if (count($entries) >= $maxEntries) {
    break;
  }

  $fullPath = $item->getPathname();
  $relative = substr($fullPath, $rootLen);
  $relative = str_replace('\\', '/', $relative);

  if ($item->isDir()) {
    $directoryCount += 1;
    $entries[] = [
      'type' => 'dir',
      'path' => $relative,
      'size' => 0,
      'modifiedAt' => date('c', $item->getMTime()),
    ];
  } elseif ($item->isFile()) {
    $fileCount += 1;
    $entries[] = [
      'type' => 'file',
      'path' => $relative,
      'size' => (int)$item->getSize(),
      'modifiedAt' => date('c', $item->getMTime()),
    ];
  }
}

api_response([
  'ok' => true,
  'root' => $requested,
  'directoryCount' => $directoryCount,
  'fileCount' => $fileCount,
  'truncated' => count($entries) >= $maxEntries,
  'entries' => $entries,
]);
