<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$sessionKey = 'rra_admin_authenticated';

function require_admin_contact(): void {
  global $sessionKey;
  if (empty($_SESSION[$sessionKey])) {
    api_response(['ok' => false, 'error' => 'Unauthorized'], 401);
  }
}

function contact_client_ip(): string {
  $candidates = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
  foreach ($candidates as $key) {
    $value = trim((string)($_SERVER[$key] ?? ''));
    if ($value === '') continue;
    if ($key === 'HTTP_X_FORWARDED_FOR') {
      $parts = array_map('trim', explode(',', $value));
      foreach ($parts as $ip) {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
          return $ip;
        }
      }
      if (!empty($parts[0])) return $parts[0];
    }
    return $value;
  }
  return 'unknown';
}

function contact_is_private_ip(string $ip): bool {
  if ($ip === '' || strtolower($ip) === 'unknown' || strtolower($ip) === 'localhost') return true;
  return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
}

function contact_lookup_country(string $ip): array {
  if (contact_is_private_ip($ip)) {
    return ['countryCode' => null, 'countryName' => 'Unknown', 'geoLookupStatus' => 'private_or_local_ip', 'geoLookupProvider' => null];
  }

  $fetchJson = function (string $url): ?array {
    if (function_exists('curl_init')) {
      $ch = curl_init($url);
      if ($ch === false) return null;
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
      curl_setopt($ch, CURLOPT_TIMEOUT, 4);
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
      curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
      curl_setopt($ch, CURLOPT_USERAGENT, 'RaceAndRallyContactGeo/1.0');
      $raw = curl_exec($ch);
      $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
      curl_close($ch);
      if (!is_string($raw) || $raw === '' || $httpCode < 200 || $httpCode >= 300) return null;
      $parsed = json_decode($raw, true);
      return is_array($parsed) ? $parsed : null;
    }
    return null;
  };

  $providers = [
    function (string $targetIp) use ($fetchJson): ?array {
      $parsed = $fetchJson('https://ipapi.co/' . rawurlencode($targetIp) . '/json/');
      if (!is_array($parsed) || !empty($parsed['error'])) return null;
      $code = isset($parsed['country_code']) ? strtoupper(trim((string)$parsed['country_code'])) : null;
      $name = isset($parsed['country_name']) ? trim((string)$parsed['country_name']) : null;
      return ['provider' => 'ipapi.co', 'countryCode' => $code ?: null, 'countryName' => $name ?: null];
    },
    function (string $targetIp) use ($fetchJson): ?array {
      $parsed = $fetchJson('https://ipwho.is/' . rawurlencode($targetIp));
      if (!is_array($parsed) || empty($parsed['success'])) return null;
      $code = isset($parsed['country_code']) ? strtoupper(trim((string)$parsed['country_code'])) : null;
      $name = isset($parsed['country']) ? trim((string)$parsed['country']) : null;
      return ['provider' => 'ipwho.is', 'countryCode' => $code ?: null, 'countryName' => $name ?: null];
    },
  ];

  foreach ($providers as $provider) {
    try {
      $result = $provider($ip);
      if (is_array($result)) {
        return [
          'countryCode' => $result['countryCode'] ?? null,
          'countryName' => ($result['countryName'] ?? null) ?: 'Unknown',
          'geoLookupStatus' => 'resolved',
          'geoLookupProvider' => $result['provider'] ?? null,
        ];
      }
    } catch (Throwable $e) {
    }
  }

  return ['countryCode' => null, 'countryName' => 'Unknown', 'geoLookupStatus' => 'lookup_failed', 'geoLookupProvider' => null];
}

function send_contact_notification(array $payload): void {
  $cfgPath = __DIR__ . '/config.php';
  $cfg = file_exists($cfgPath) ? require $cfgPath : [];
  $to = '';
  try {
    $pdo = api_db();
    $stmt = $pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1');
    $stmt->execute(['contact_form_to_email']);
    $row = $stmt->fetch();
    $to = is_array($row) ? trim((string)($row['setting_value'] ?? '')) : '';
  } catch (Throwable $e) {
    $to = '';
  }
  if ($to === '') {
    $to = trim((string)($cfg['contact_notify_email'] ?? 'manager@raceandrallyaustralia.com.au'));
  }
  if ($to === '') return;

  $subject = 'New Contact Form Submission: ' . (($payload['subject'] ?? '') !== '' ? $payload['subject'] : 'General enquiry');
  $lines = [
    'A new contact form submission was received.',
    '',
    'Name: ' . ($payload['full_name'] ?? ''),
    'Email: ' . ($payload['email'] ?? ''),
    'Phone: ' . ($payload['phone'] ?? ''),
    'Company: ' . ($payload['company'] ?? ''),
    'Inquiry Type: ' . ($payload['inquiry_type'] ?? ''),
    'Vehicle Details: ' . ($payload['vehicle_details'] ?? ''),
    'Preferred Contact: ' . ($payload['preferred_contact'] ?? ''),
    'Newsletter Opt-in: ' . (!empty($payload['newsletter_opt_in']) ? 'Yes' : 'No'),
    'Vendor Interest: ' . (!empty($payload['vendor_interest']) ? 'Yes' : 'No'),
    'IP Address: ' . ($payload['ip_address'] ?? ''),
    'Country: ' . ($payload['country_name'] ?? 'Unknown') . ' (' . (($payload['country_code'] ?? '') ?: '-') . ')',
    'Geo Status: ' . (($payload['geo_lookup_status'] ?? '') ?: '-'),
    'Geo Provider: ' . (($payload['geo_lookup_provider'] ?? '') ?: '-'),
    '',
    'Message:',
    (string)($payload['message'] ?? ''),
  ];
  $message = implode("\r\n", $lines);

  $from = trim((string)($cfg['mail_from'] ?? 'no-reply@raceandrallyaustralia.com.au'));
  $headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . $from,
    'Reply-To: ' . (string)($payload['email'] ?? $from),
  ];
  @mail($to, $subject, $message, implode("\r\n", $headers));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  require_admin_contact();
  $stmt = $pdo->query('SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 5000');
  api_response(['ok' => true, 'records' => $stmt->fetchAll()]);
}

$payload = api_read_json();
$action = trim((string)($payload['action'] ?? 'submit'));

if ($action === 'delete') {
  require_admin_contact();
  $id = (int)($payload['id'] ?? 0);
  if ($id <= 0) api_response(['ok' => false, 'error' => 'Invalid id'], 400);
  $stmt = $pdo->prepare('DELETE FROM contact_submissions WHERE id = ?');
  $stmt->execute([$id]);
  api_response(['ok' => true]);
}

if ($action === 'deleteMany') {
  require_admin_contact();
  $ids = is_array($payload['ids'] ?? null) ? $payload['ids'] : [];
  $intIds = array_values(array_filter(array_map('intval', $ids), fn($v) => $v > 0));
  if (!$intIds) api_response(['ok' => true, 'deleted' => 0]);
  $placeholders = implode(',', array_fill(0, count($intIds), '?'));
  $stmt = $pdo->prepare("DELETE FROM contact_submissions WHERE id IN ($placeholders)");
  $stmt->execute($intIds);
  api_response(['ok' => true, 'deleted' => count($intIds)]);
}

if ($action === 'submit') {
  $fullName = trim((string)($payload['fullName'] ?? ''));
  $email = trim((string)($payload['email'] ?? ''));
  $phone = trim((string)($payload['phone'] ?? ''));
  $company = trim((string)($payload['company'] ?? ''));
  $inquiryType = trim((string)($payload['inquiryType'] ?? 'General enquiry'));
  $vehicleDetails = trim((string)($payload['vehicleDetails'] ?? ''));
  $preferredContact = trim((string)($payload['preferredContact'] ?? 'email'));
  $subject = trim((string)($payload['subject'] ?? ''));
  $message = trim((string)($payload['message'] ?? ''));
  $newsletterOptIn = !empty($payload['newsletterOptIn']) ? 1 : 0;
  $vendorInterest = !empty($payload['vendorInterest']) ? 1 : 0;

  if ($fullName === '' || $email === '' || $message === '') {
    api_response(['ok' => false, 'error' => 'Missing required fields'], 400);
  }
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    api_response(['ok' => false, 'error' => 'Invalid email address'], 400);
  }

  $ipAddress = contact_client_ip();
  $geo = contact_lookup_country($ipAddress);
  $createdAt = date('c');

  $stmt = $pdo->prepare(
    'INSERT INTO contact_submissions (
      created_at, full_name, email, phone, company, inquiry_type, vehicle_details, preferred_contact,
      subject, message, newsletter_opt_in, vendor_interest,
      ip_address, country_code, country_name, geo_lookup_status, geo_lookup_provider
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  $stmt->execute([
    $createdAt,
    $fullName,
    $email,
    $phone !== '' ? $phone : null,
    $company !== '' ? $company : null,
    $inquiryType !== '' ? $inquiryType : null,
    $vehicleDetails !== '' ? $vehicleDetails : null,
    $preferredContact !== '' ? $preferredContact : null,
    $subject !== '' ? $subject : null,
    $message,
    $newsletterOptIn,
    $vendorInterest,
    $ipAddress,
    $geo['countryCode'] ?? null,
    $geo['countryName'] ?? 'Unknown',
    $geo['geoLookupStatus'] ?? null,
    $geo['geoLookupProvider'] ?? null,
  ]);

  send_contact_notification([
    'full_name' => $fullName,
    'email' => $email,
    'phone' => $phone,
    'company' => $company,
    'inquiry_type' => $inquiryType,
    'vehicle_details' => $vehicleDetails,
    'preferred_contact' => $preferredContact,
    'subject' => $subject,
    'message' => $message,
    'newsletter_opt_in' => $newsletterOptIn,
    'vendor_interest' => $vendorInterest,
    'ip_address' => $ipAddress,
    'country_code' => $geo['countryCode'] ?? null,
    'country_name' => $geo['countryName'] ?? 'Unknown',
    'geo_lookup_status' => $geo['geoLookupStatus'] ?? null,
    'geo_lookup_provider' => $geo['geoLookupProvider'] ?? null,
  ]);

  api_response(['ok' => true]);
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
