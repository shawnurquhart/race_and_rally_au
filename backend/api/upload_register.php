<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $entries = $pdo->query('SELECT * FROM upload_register_entries ORDER BY uploaded_at DESC')->fetchAll();
  $out = [];
  $refsStmt = $pdo->prepare('SELECT reference_value FROM upload_register_references WHERE entry_id = ?');
  foreach ($entries as $entry) {
    $refsStmt->execute([$entry['id']]);
    $refs = array_map(fn($r) => $r['reference_value'], $refsStmt->fetchAll());
    $out[] = [
      'id' => $entry['id'],
      'uploadedAt' => $entry['uploaded_at'],
      'fileCount' => (int)$entry['file_count'],
      'references' => $refs,
    ];
  }
  api_response(['ok' => true, 'entries' => $out]);
}

$payload = api_read_json();
$action = $payload['action'] ?? '';

if ($action === 'record') {
  $entry = $payload['entry'] ?? null;
  if (!$entry || empty($entry['id'])) {
    api_response(['ok' => false, 'error' => 'Invalid entry'], 400);
  }

  $stmt = $pdo->prepare('INSERT INTO upload_register_entries (id, uploaded_at, file_count) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE uploaded_at = VALUES(uploaded_at), file_count = VALUES(file_count)');
  $stmt->execute([$entry['id'], $entry['uploadedAt'], (int)$entry['fileCount']]);

  $pdo->prepare('DELETE FROM upload_register_references WHERE entry_id = ?')->execute([$entry['id']]);
  $refStmt = $pdo->prepare('INSERT INTO upload_register_references (entry_id, reference_value) VALUES (?, ?)');
  foreach (($entry['references'] ?? []) as $ref) {
    $refStmt->execute([$entry['id'], $ref]);
  }

  api_response(['ok' => true]);
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
