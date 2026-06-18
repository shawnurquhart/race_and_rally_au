<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$cfg = require __DIR__ . '/config.php';
$raw = file_get_contents('php://input') ?: '';
$decoded = json_decode($raw, true);
$body = is_array($decoded) ? $decoded : $_POST;
$headers = function_exists('getallheaders') ? getallheaders() : [];

$merchantReference = $body['merchantTransactionId'] ?? $body['reference'] ?? $body['merchantReference'] ?? null;
$gatewayTransactionId = $body['transactionId'] ?? $body['uuid'] ?? $body['id'] ?? null;
$paymentStatus = $body['status'] ?? $body['result'] ?? null;
$signature = $headers['X-Signature'] ?? $headers['x-signature'] ?? $body['signature'] ?? null;
$signatureValid = null;

if ($signature && !empty($cfg['till_shared_secret'])) {
  $expected = hash_hmac('sha256', $raw, (string)$cfg['till_shared_secret']);
  $signatureValid = hash_equals($expected, (string)$signature) ? 1 : 0;
}

$stmt = $pdo->prepare('INSERT INTO payment_callbacks (
  received_at, provider, order_id, merchant_reference, gateway_transaction_id,
  payment_status, signature_valid, headers_payload, body_payload
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([
  date('c'),
  'till',
  $body['orderId'] ?? null,
  $merchantReference,
  $gatewayTransactionId,
  $paymentStatus,
  $signatureValid,
  json_encode($headers, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
  $raw !== '' ? $raw : json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
]);

api_response(['ok' => true]);
