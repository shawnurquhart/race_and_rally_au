<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$cfg = require __DIR__ . '/config.php';
$sessionKey = 'rra_admin_authenticated';

function require_payment_admin(): void {
  global $sessionKey;
  if (empty($_SESSION[$sessionKey])) {
    api_response(['ok' => false, 'error' => 'Unauthorized'], 401);
  }
}

function payment_environment(PDO $pdo): string {
  try {
    $stmt = $pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1');
    $stmt->execute(['payment_environment']);
    $row = $stmt->fetch();
    return is_array($row) && ($row['setting_value'] ?? '') === 'sandbox' ? 'sandbox' : 'production';
  } catch (Throwable $e) {
    return 'production';
  }
}

function till_effective_config(array $cfg, string $environment): array {
  $effective = $cfg;
  $prefix = $environment === 'sandbox' ? 'till_sandbox_' : 'till_production_';
  $keys = [
    'api_base_url',
    'debit_path_template',
    'api_key',
    'api_username',
    'api_password',
    'shared_secret',
    'public_integration_key',
    'merchant_id',
    'notification_url',
    'success_url',
    'cancel_url',
    'error_url',
    'auth_mode',
    'enable_hmac',
  ];

  foreach ($keys as $key) {
    $sourceKey = $prefix . $key;
    if (array_key_exists($sourceKey, $cfg)) {
      $effective['till_' . $key] = $cfg[$sourceKey];
    }
  }

  $effective['payment_environment'] = $environment;
  return $effective;
}

function payment_config_setting_key(string $environment): string {
  return 'payment_config_' . ($environment === 'sandbox' ? 'sandbox' : 'production');
}

function payment_config_editable_keys(): array {
  return [
    'api_base_url',
    'debit_path_template',
    'api_key',
    'api_username',
    'api_password',
    'shared_secret',
    'public_integration_key',
    'merchant_id',
    'notification_url',
    'success_url',
    'cancel_url',
    'error_url',
    'auth_mode',
    'enable_hmac',
  ];
}

function payment_load_saved_config(PDO $pdo, string $environment): array {
  try {
    $stmt = $pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1');
    $stmt->execute([payment_config_setting_key($environment)]);
    $row = $stmt->fetch();
    $decoded = is_array($row) ? json_decode((string)($row['setting_value'] ?? ''), true) : null;
    return is_array($decoded) ? $decoded : [];
  } catch (Throwable $e) {
    return [];
  }
}

function payment_apply_saved_config(array $cfg, array $saved): array {
  $configProtectedKeys = [
    'api_key' => true,
    'api_username' => true,
    'api_password' => true,
    'shared_secret' => true,
    'public_integration_key' => true,
  ];
  foreach (payment_config_editable_keys() as $key) {
    // Credentials should come from config.php when present so stale DB overrides
    // cannot silently beat a freshly deployed secure server config.
    if (isset($configProtectedKeys[$key]) && trim((string)($cfg['till_' . $key] ?? '')) !== '') {
      continue;
    }
    if (array_key_exists($key, $saved)) {
      $cfg['till_' . $key] = $saved[$key];
    }
  }
  return $cfg;
}

function payment_save_config(PDO $pdo, string $environment, array $incoming, array $currentSaved): array {
  $next = $currentSaved;
  foreach (payment_config_editable_keys() as $key) {
    if (!array_key_exists($key, $incoming)) continue;
    if (in_array($key, ['api_key', 'api_password', 'shared_secret'], true) && trim((string)$incoming[$key]) === '') {
      continue;
    }
    if ($key === 'enable_hmac') {
      $next[$key] = !empty($incoming[$key]);
    } else {
      $next[$key] = trim((string)$incoming[$key]);
    }
  }

  $stmt = $pdo->prepare(
    'INSERT INTO app_settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)'
  );
  $stmt->execute([payment_config_setting_key($environment), payment_json($next), date('c')]);
  return $next;
}

function payment_mask($value) {
  if (!is_string($value) || strlen($value) <= 8) return '***';
  return substr($value, 0, 4) . '...' . substr($value, -4);
}

function payment_mask_header(string $header): string {
  if (stripos($header, 'Authorization: Basic ') === 0) return 'Authorization: Basic ***';
  foreach (['X-API-Key:', 'X-Public-Integration-Key:', 'X-Signature:'] as $prefix) {
    if (stripos($header, $prefix) === 0) {
      $value = trim(substr($header, strlen($prefix)));
      return $prefix . ' ' . payment_mask($value);
    }
  }
  return $header;
}

function payment_json($value) {
  return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function payment_log(PDO $pdo, array $entry): void {
  try {
    $stmt = $pdo->prepare('INSERT INTO payment_logs (
      created_at, provider, action_name, order_id, merchant_reference, status_code,
      request_payload, response_payload, redirect_url, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
      date('c'),
      $entry['provider'] ?? 'till',
      $entry['action'] ?? 'unknown',
      $entry['orderId'] ?? null,
      $entry['merchantReference'] ?? null,
      $entry['statusCode'] ?? null,
      isset($entry['request']) ? payment_json($entry['request']) : null,
      isset($entry['response']) ? payment_json($entry['response']) : null,
      $entry['redirectUrl'] ?? null,
      $entry['error'] ?? null,
    ]);
  } catch (Throwable $e) {
    // Do not fail customer checkout purely because logging failed.
  }
}

function till_config_public(array $cfg): array {
  $apiKey = (string)($cfg['till_api_key'] ?? '');
  $sharedSecret = (string)($cfg['till_shared_secret'] ?? '');
  $apiPassword = (string)($cfg['till_api_password'] ?? '');
  $pathTemplate = $cfg['till_debit_path_template'] ?? '/api/v3/transaction/{apiKey}/debit';
  return [
    'environment' => $cfg['payment_environment'] ?? 'production',
    'configured' => !empty($cfg['till_api_key']) && !empty($cfg['till_shared_secret']),
    'apiBaseUrl' => $cfg['till_api_base_url'] ?? 'https://gateway.tillpayments.com',
    'debitPathTemplate' => $pathTemplate,
    'attemptedEndpointMasked' => rtrim((string)($cfg['till_api_base_url'] ?? 'https://gateway.tillpayments.com'), '/') . str_replace('{apiKey}', payment_mask($apiKey), $pathTemplate),
    'merchantId' => $cfg['till_merchant_id'] ?? '',
    'apiKey' => '',
    'apiKeyMasked' => !empty($cfg['till_api_key']) ? payment_mask($cfg['till_api_key']) : '',
    'apiKeySet' => $apiKey !== '',
    'apiUsername' => $cfg['till_api_username'] ?? '',
    'apiPassword' => '',
    'apiPasswordMasked' => $apiPassword !== '' ? payment_mask($apiPassword) : '',
    'apiPasswordSet' => $apiPassword !== '',
    'sharedSecret' => '',
    'sharedSecretMasked' => $sharedSecret !== '' ? payment_mask($sharedSecret) : '',
    'sharedSecretSet' => $sharedSecret !== '',
    'publicIntegrationKey' => $cfg['till_public_integration_key'] ?? '',
    'authMode' => $cfg['till_auth_mode'] ?? 'basic',
    'hmacEnabled' => !empty($cfg['till_enable_hmac']),
    'notificationUrl' => $cfg['till_notification_url'] ?? '',
    'successUrl' => $cfg['till_success_url'] ?? '',
    'cancelUrl' => $cfg['till_cancel_url'] ?? '',
    'errorUrl' => $cfg['till_error_url'] ?? '',
  ];
}

function till_build_payload(array $payload, array $cfg): array {
  $amount = number_format((float)($payload['amount'] ?? 0), 2, '.', '');
  $merchantReference = trim((string)($payload['merchantTransactionId'] ?? ($payload['merchantReference'] ?? '')));
  $merchantMetaData = substr((string)($payload['merchantMetaData'] ?? ('source=race-and-rally-australia|testMode=' . (!empty($payload['testMode']) ? 'true' : 'false'))), 0, 255);
  $allowTestOverrides = !empty($payload['testMode']) || stripos($merchantMetaData, 'testMode=true') !== false;
  if ($merchantReference === '') {
    $merchantReference = 'RRA-' . date('YmdHis') . '-' . random_int(1000, 9999);
  }
  $customer = is_array($payload['customer'] ?? null) ? $payload['customer'] : [];
  $defaultCallbackUrl = 'https://raceandrallyaustralia.com.au/api/till/postback';

  return [
    'merchantTransactionId' => $merchantReference,
    'amount' => $amount,
    'currency' => strtoupper((string)($payload['currency'] ?? 'AUD')),
    'description' => (string)($payload['description'] ?? 'Race & Rally Australia order ' . $merchantReference),
    'successUrl' => $allowTestOverrides ? (string)($payload['successUrl'] ?? ($cfg['till_success_url'] ?? '')) : ($cfg['till_success_url'] ?? ''),
    'cancelUrl' => $allowTestOverrides ? (string)($payload['cancelUrl'] ?? ($cfg['till_cancel_url'] ?? '')) : ($cfg['till_cancel_url'] ?? ''),
    'errorUrl' => $allowTestOverrides ? (string)($payload['errorUrl'] ?? ($cfg['till_error_url'] ?? '')) : ($cfg['till_error_url'] ?? ''),
    'callbackUrl' => $allowTestOverrides ? (string)($payload['callbackUrl'] ?? $defaultCallbackUrl) : $defaultCallbackUrl,
    'customer' => [
      'firstName' => $customer['firstName'] ?? '',
      'lastName' => $customer['lastName'] ?? '',
      'email' => $customer['email'] ?? '',
      'billingPhone' => $customer['billingPhone'] ?? ($customer['phone'] ?? ''),
      'billingAddress1' => $customer['billingAddress1'] ?? ($customer['address'] ?? ''),
      'billingCity' => $customer['billingCity'] ?? '',
      'billingState' => $customer['billingState'] ?? '',
      'billingPostcode' => $customer['billingPostcode'] ?? '',
      'billingCountry' => $customer['billingCountry'] ?? 'AU',
    ],
    'merchantMetaData' => $merchantMetaData,
  ];
}

function till_extract_redirect_url($decoded): ?string {
  if (!is_array($decoded)) return null;
  $keys = ['redirectUrl', 'redirect_url', 'paymentUrl', 'payment_url', 'checkoutUrl', 'checkout_url'];
  foreach ($keys as $key) {
    if (!empty($decoded[$key]) && is_string($decoded[$key])) return $decoded[$key];
  }
  foreach (['transaction', 'result', 'data'] as $container) {
    if (isset($decoded[$container]) && is_array($decoded[$container])) {
      $nested = till_extract_redirect_url($decoded[$container]);
      if ($nested) return $nested;
    }
  }
  return null;
}

$payload = api_read_json();
$action = $payload['action'] ?? '';
$environment = payment_environment($pdo);
$cfg = till_effective_config($cfg, $environment);
$cfg = payment_apply_saved_config($cfg, payment_load_saved_config($pdo, $environment));

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $stmt = $pdo->query('SELECT * FROM payment_logs ORDER BY id DESC LIMIT 50');
  api_response(['ok' => true, 'config' => till_config_public($cfg), 'logs' => $stmt->fetchAll()]);
}

if ($action === 'savePaymentConfig') {
  require_payment_admin();
  $incomingEnvironment = ($payload['environment'] ?? $environment) === 'sandbox' ? 'sandbox' : 'production';
  $baseCfg = till_effective_config(require __DIR__ . '/config.php', $incomingEnvironment);
  $currentSaved = payment_load_saved_config($pdo, $incomingEnvironment);
  $saved = payment_save_config($pdo, $incomingEnvironment, is_array($payload['config'] ?? null) ? $payload['config'] : [], $currentSaved);
  $nextCfg = payment_apply_saved_config($baseCfg, $saved);
  api_response(['ok' => true, 'config' => till_config_public($nextCfg)]);
}

if ($action === 'createTillPayment') {
  $apiKey = trim((string)($cfg['till_api_key'] ?? ''));
  if ($apiKey === '') {
    api_response(['ok' => false, 'error' => 'Till API key is not configured'], 500);
  }

  $requestPayload = till_build_payload($payload['payment'] ?? [], $cfg);
  $merchantReference = $requestPayload['merchantTransactionId'];
  $baseUrl = rtrim((string)($cfg['till_api_base_url'] ?? 'https://gateway.tillpayments.com'), '/');
  $pathTemplate = (string)($cfg['till_debit_path_template'] ?? '/api/v3/transaction/{apiKey}/debit');
  $url = $baseUrl . str_replace('{apiKey}', rawurlencode($apiKey), $pathTemplate);
  $urlMasked = $baseUrl . str_replace('{apiKey}', payment_mask($apiKey), $pathTemplate);

  $headers = ['Content-Type: application/json', 'Accept: application/json'];
  $body = payment_json($requestPayload);
  $authMode = (string)($cfg['till_auth_mode'] ?? 'basic');
  if ($authMode === 'basic' && !empty($cfg['till_api_username']) && !empty($cfg['till_api_password'])) {
    $headers[] = 'Authorization: Basic ' . base64_encode($cfg['till_api_username'] . ':' . $cfg['till_api_password']);
  }
  if ($authMode === 'public_hmac') {
    if (!empty($cfg['till_api_key'])) {
      $headers[] = 'X-API-Key: ' . (string)$cfg['till_api_key'];
    }
    if (!empty($cfg['till_public_integration_key'])) {
      $headers[] = 'X-Public-Integration-Key: ' . (string)$cfg['till_public_integration_key'];
    }
    if (!empty($cfg['till_shared_secret'])) {
      $headers[] = 'X-Signature: ' . hash_hmac('sha256', $body, (string)$cfg['till_shared_secret']);
      $headers[] = 'X-Signature-Algorithm: HMAC-SHA256';
    }
  } elseif (!empty($cfg['till_enable_hmac']) && !empty($cfg['till_shared_secret'])) {
    $headers[] = 'X-Signature: ' . hash_hmac('sha256', $body, (string)$cfg['till_shared_secret']);
  }
  $maskedHeaders = array_map('payment_mask_header', $headers);

  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_TIMEOUT => 30,
  ]);
  $raw = curl_exec($ch);
  $curlError = curl_error($ch);
  $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  $decoded = is_string($raw) ? json_decode($raw, true) : null;
  $responsePayload = is_array($decoded) ? $decoded : ['raw' => $raw];
  $redirectUrl = till_extract_redirect_url($responsePayload);

  payment_log($pdo, [
    'action' => 'createTillPayment',
    'orderId' => $payload['payment']['orderId'] ?? null,
    'merchantReference' => $merchantReference,
    'statusCode' => $status,
    'request' => $requestPayload,
    'response' => ['attemptedEndpoint' => $urlMasked, 'requestHeaders' => $maskedHeaders, 'authMode' => $authMode, 'body' => $responsePayload],
    'redirectUrl' => $redirectUrl,
    'error' => $curlError ?: null,
  ]);

  api_response([
    'ok' => $status >= 200 && $status < 300,
    'statusCode' => $status,
    'merchantReference' => $merchantReference,
    'redirectUrl' => $redirectUrl,
    'attemptedEndpoint' => $urlMasked,
    'authMode' => $authMode,
    'requestHeaders' => $maskedHeaders,
    'requestPayload' => $requestPayload,
    'responsePayload' => $responsePayload,
    'error' => $curlError ?: null,
  ], $status >= 200 && $status < 300 ? 200 : 502);
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
