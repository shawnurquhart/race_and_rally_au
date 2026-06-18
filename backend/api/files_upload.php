<?php
require __DIR__ . '/_bootstrap.php';

$sessionKey = 'rra_admin_authenticated';
if (empty($_SESSION[$sessionKey])) {
  api_response(['ok' => false, 'error' => 'Unauthorized'], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  api_response(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$root = trim((string)($_POST['root'] ?? 'assets/graphics'));
$replace = (string)($_POST['replace'] ?? 'false') === 'true';
$root = str_replace('\\', '/', ltrim($root, '/'));

if ($root === '' || str_contains($root, '..')) {
  api_response(['ok' => false, 'error' => 'Invalid root path'], 400);
}

$firstPart = explode('/', $root)[0] ?? '';
if ($firstPart !== 'assets') {
  api_response(['ok' => false, 'error' => 'Upload is allowed only under assets'], 403);
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

$targetRoot = $baseRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $root);
if (!is_dir($targetRoot)) {
  if (!@mkdir($targetRoot, 0775, true) && !is_dir($targetRoot)) {
    api_response(['ok' => false, 'error' => 'Failed to create target directory'], 500);
  }
}

$resolvedTargetRoot = realpath($targetRoot);
if ($resolvedTargetRoot === false || !str_starts_with($resolvedTargetRoot, $baseRoot)) {
  api_response(['ok' => false, 'error' => 'Resolved target path is invalid'], 500);
}

if (!isset($_FILES['files'])) {
  api_response(['ok' => false, 'error' => 'No files uploaded'], 400);
}

$files = $_FILES['files'];
$fileNames = $files['name'] ?? [];
$tmpNames = $files['tmp_name'] ?? [];
$errors = $files['error'] ?? [];

if (!is_array($fileNames) || count($fileNames) === 0) {
  api_response(['ok' => false, 'error' => 'No files uploaded'], 400);
}

if (count($fileNames) > 2000) {
  api_response(['ok' => false, 'error' => 'Too many files in one request'], 400);
}

$allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif'];
$uploaded = [];
$skipped = [];
$failed = [];

for ($i = 0; $i < count($fileNames); $i += 1) {
  $rawName = (string)($fileNames[$i] ?? '');
  $tmpPath = (string)($tmpNames[$i] ?? '');
  $err = (int)($errors[$i] ?? UPLOAD_ERR_NO_FILE);

  if ($err !== UPLOAD_ERR_OK) {
    $failed[] = ['name' => $rawName, 'reason' => 'Upload error code ' . $err];
    continue;
  }

  $safeName = basename(str_replace('\\', '/', $rawName));
  if ($safeName === '' || str_contains($safeName, '..')) {
    $failed[] = ['name' => $rawName, 'reason' => 'Invalid filename'];
    continue;
  }

  $ext = strtolower(pathinfo($safeName, PATHINFO_EXTENSION));
  if (!in_array($ext, $allowedExt, true)) {
    $failed[] = ['name' => $rawName, 'reason' => 'Unsupported file type'];
    continue;
  }

  $destPath = $resolvedTargetRoot . DIRECTORY_SEPARATOR . $safeName;
  if (file_exists($destPath) && !$replace) {
    $skipped[] = $safeName;
    continue;
  }

  if (!@move_uploaded_file($tmpPath, $destPath)) {
    $failed[] = ['name' => $rawName, 'reason' => 'Failed to move uploaded file'];
    continue;
  }

  $uploaded[] = $safeName;
}

api_response([
  'ok' => true,
  'root' => $root,
  'receivedCount' => count($fileNames),
  'phpMaxFileUploads' => (int)ini_get('max_file_uploads'),
  'phpUploadMaxFilesize' => (string)ini_get('upload_max_filesize'),
  'phpPostMaxSize' => (string)ini_get('post_max_size'),
  'uploadedCount' => count($uploaded),
  'uploaded' => $uploaded,
  'skippedCount' => count($skipped),
  'skipped' => $skipped,
  'failedCount' => count($failed),
  'failed' => $failed,
]);
