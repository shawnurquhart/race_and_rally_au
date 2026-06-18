<?php
require __DIR__ . '/_bootstrap.php';

$pdo = api_db();
$sessionKey = 'rra_admin_authenticated';

function client_ip_address(): string {
  $isPublicIp = function (string $ip): bool {
    return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
  };

  $candidates = [
    'HTTP_CF_CONNECTING_IP',
    'HTTP_X_FORWARDED_FOR',
    'HTTP_X_REAL_IP',
    'REMOTE_ADDR',
  ];

  foreach ($candidates as $key) {
    $value = trim((string)($_SERVER[$key] ?? ''));
    if ($value === '') {
      continue;
    }
    if ($key === 'HTTP_X_FORWARDED_FOR') {
      $parts = array_map('trim', explode(',', $value));
      foreach ($parts as $candidateIp) {
        if ($candidateIp !== '' && $isPublicIp($candidateIp)) {
          return $candidateIp;
        }
      }
      if (!empty($parts[0])) {
        return $parts[0];
      }
    }
    return $value;
  }

  return 'unknown';
}

function require_admin(): void {
  global $sessionKey;
  if (empty($_SESSION[$sessionKey])) {
    api_response(['ok' => false, 'error' => 'Unauthorized'], 401);
  }
}

function is_private_or_local_ip(string $ip): bool {
  if ($ip === '' || strtolower($ip) === 'unknown' || strtolower($ip) === 'localhost') {
    return true;
  }
  return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
}

function resolve_ip_country(string $ip): array {
  $fallback = [
    'countryCode' => null,
    'countryName' => 'Unknown',
    'geoLookupStatus' => 'unknown',
    'geoLookupProvider' => null,
  ];
  if ($ip === '' || strtolower($ip) === 'unknown') {
    return $fallback;
  }
  if (is_private_or_local_ip($ip)) {
    return [
      'countryCode' => null,
      'countryName' => 'Unknown',
      'geoLookupStatus' => 'private_or_local_ip',
      'geoLookupProvider' => null,
    ];
  }

  $fetchJson = function (string $url): ?array {
    // Prefer cURL for better host compatibility/timeouts.
    if (function_exists('curl_init')) {
      $ch = curl_init($url);
      if ($ch === false) return null;
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
      curl_setopt($ch, CURLOPT_TIMEOUT, 4);
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
      curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
      curl_setopt($ch, CURLOPT_USERAGENT, 'RaceAndRallyTrafficGeo/1.0');
      $raw = curl_exec($ch);
      $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
      curl_close($ch);
      if (!is_string($raw) || $raw === '' || $httpCode < 200 || $httpCode >= 300) {
        return null;
      }
      $parsed = json_decode($raw, true);
      return is_array($parsed) ? $parsed : null;
    }

    $context = stream_context_create([
      'http' => [
        'method' => 'GET',
        'timeout' => 4,
        'header' => "User-Agent: RaceAndRallyTrafficGeo/1.0\r\n",
      ],
    ]);
    $raw = @file_get_contents($url, false, $context);
    if (!is_string($raw) || $raw === '') return null;
    $parsed = json_decode($raw, true);
    return is_array($parsed) ? $parsed : null;
  };

  // Provider abstraction (easy to swap later).
  $providers = [
    function (string $targetIp) use ($fetchJson): ?array {
      $url = 'https://ipapi.co/' . rawurlencode($targetIp) . '/json/';
      $parsed = $fetchJson($url);
      if (!is_array($parsed)) return null;
      if (!empty($parsed['error'])) return null;

      $code = isset($parsed['country_code']) ? strtoupper(trim((string)$parsed['country_code'])) : null;
      $name = isset($parsed['country_name']) ? trim((string)$parsed['country_name']) : null;
      return [
        'provider' => 'ipapi.co',
        'countryCode' => $code !== '' ? $code : null,
        'countryName' => $name !== '' ? $name : null,
      ];
    },
    function (string $targetIp) use ($fetchJson): ?array {
      $url = 'https://ipwho.is/' . rawurlencode($targetIp);
      $parsed = $fetchJson($url);
      if (!is_array($parsed) || empty($parsed['success'])) return null;
      $code = isset($parsed['country_code']) ? strtoupper(trim((string)$parsed['country_code'])) : null;
      $name = isset($parsed['country']) ? trim((string)$parsed['country']) : null;
      return [
        'provider' => 'ipwho.is',
        'countryCode' => $code !== '' ? $code : null,
        'countryName' => $name !== '' ? $name : null,
      ];
    },
    function (string $targetIp) use ($fetchJson): ?array {
      $url = 'http://ip-api.com/json/' . rawurlencode($targetIp) . '?fields=status,country,countryCode';
      $parsed = $fetchJson($url);
      if (!is_array($parsed) || (($parsed['status'] ?? '') !== 'success')) return null;
      $code = isset($parsed['countryCode']) ? strtoupper(trim((string)$parsed['countryCode'])) : null;
      $name = isset($parsed['country']) ? trim((string)$parsed['country']) : null;
      return [
        'provider' => 'ip-api.com',
        'countryCode' => $code !== '' ? $code : null,
        'countryName' => $name !== '' ? $name : null,
      ];
    },
  ];

  foreach ($providers as $provider) {
    try {
      $result = $provider($ip);
      if (is_array($result)) {
        return [
          'countryCode' => $result['countryCode'] ?? null,
          'countryName' => ($result['countryName'] ?? null) ?: 'Unknown',
          'geoLookupStatus' => (($result['countryCode'] ?? null) || ($result['countryName'] ?? null)) ? 'resolved' : 'not_found',
          'geoLookupProvider' => $result['provider'] ?? null,
        ];
      }
    } catch (Throwable $e) {
      // Graceful fallback: never block logging.
    }
  }

  return [
    'countryCode' => null,
    'countryName' => 'Unknown',
    'geoLookupStatus' => 'lookup_failed',
    'geoLookupProvider' => null,
  ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  require_admin();

  $format = strtolower(trim((string)($_GET['format'] ?? 'json')));
  $page = trim((string)($_GET['page'] ?? ''));
  $from = trim((string)($_GET['from'] ?? ''));
  $to = trim((string)($_GET['to'] ?? ''));
  $sessionId = trim((string)($_GET['sessionId'] ?? ''));

  $where = [];
  $params = [];

  if ($page !== '') {
    $where[] = 'page_path = ?';
    $params[] = $page;
  }
  if ($sessionId !== '') {
    $where[] = 'session_id = ?';
    $params[] = $sessionId;
  }
  if ($from !== '') {
    $where[] = 'visited_at >= ?';
    $params[] = $from;
  }
  if ($to !== '') {
    $where[] = 'visited_at <= ?';
    $params[] = $to;
  }

  $sql = 'SELECT * FROM traffic_logs';
  if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
  }
  $sql .= ' ORDER BY visited_at DESC LIMIT 5000';

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll();

  if ($format === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="traffic-report-' . date('Y-m-d') . '.csv"');

    $out = fopen('php://output', 'w');
    fputcsv($out, ['id', 'visitedAt', 'createdAt', 'pagePath', 'ipAddress', 'countryCode', 'countryName', 'geoLookupStatus', 'geoLookupProvider', 'sessionId', 'viewStartedAt', 'viewEndedAt', 'viewDurationSeconds', 'referrer', 'userAgent']);
    foreach ($rows as $row) {
      fputcsv($out, [
        $row['id'],
        $row['visited_at'],
        $row['created_at'],
        $row['page_path'],
        $row['ip_address'],
        $row['country_code'],
        $row['country_name'],
        $row['geo_lookup_status'],
        $row['geo_lookup_provider'],
        $row['session_id'],
        $row['view_started_at'],
        $row['view_ended_at'],
        $row['view_duration_seconds'],
        $row['referrer'],
        $row['user_agent'],
      ]);
    }
    fclose($out);
    exit;
  }

  $pages = array_values(array_unique(array_map(function ($row) {
    return (string)$row['page_path'];
  }, $rows)));
  sort($pages);

  $mapped = array_map(function ($row) {
    return [
      'id' => (int)$row['id'],
      'visitedAt' => (string)$row['visited_at'],
      'createdAt' => isset($row['created_at']) ? (string)$row['created_at'] : (string)$row['visited_at'],
      'pagePath' => (string)$row['page_path'],
      'ipAddress' => (string)$row['ip_address'],
      'countryCode' => $row['country_code'] !== null ? (string)$row['country_code'] : null,
      'countryName' => $row['country_name'] !== null ? (string)$row['country_name'] : 'Unknown',
      'geoLookupStatus' => $row['geo_lookup_status'] !== null ? (string)$row['geo_lookup_status'] : null,
      'geoLookupProvider' => $row['geo_lookup_provider'] !== null ? (string)$row['geo_lookup_provider'] : null,
      'sessionId' => (string)$row['session_id'],
      'viewStartedAt' => $row['view_started_at'] !== null ? (string)$row['view_started_at'] : null,
      'viewEndedAt' => $row['view_ended_at'] !== null ? (string)$row['view_ended_at'] : null,
      'viewDurationSeconds' => $row['view_duration_seconds'] !== null ? (int)$row['view_duration_seconds'] : null,
      'referrer' => $row['referrer'] !== null ? (string)$row['referrer'] : null,
      'userAgent' => $row['user_agent'] !== null ? (string)$row['user_agent'] : null,
    ];
  }, $rows);

  api_response(['ok' => true, 'logs' => $mapped, 'pages' => $pages]);
}

$payload = api_read_json();
$action = trim((string)($payload['action'] ?? 'track'));

if ($action === 'track') {
  $pagePath = trim((string)($payload['pagePath'] ?? ''));
  $sessionId = trim((string)($payload['sessionId'] ?? ''));
  $visitedAt = trim((string)($payload['visitedAt'] ?? date('c')));
  $viewStartedAt = isset($payload['viewStartedAt']) ? trim((string)$payload['viewStartedAt']) : null;
  $viewEndedAt = isset($payload['viewEndedAt']) ? trim((string)$payload['viewEndedAt']) : null;
  $viewDurationSeconds = isset($payload['viewDurationSeconds']) ? (int)$payload['viewDurationSeconds'] : null;
  $referrer = isset($payload['referrer']) ? trim((string)$payload['referrer']) : null;
  $userAgent = trim((string)($_SERVER['HTTP_USER_AGENT'] ?? ''));

  if ($pagePath === '' || $sessionId === '') {
    api_response(['ok' => false, 'error' => 'Missing pagePath/sessionId'], 400);
  }

  $clientIp = client_ip_address();
  $country = resolve_ip_country($clientIp);

  $stmt = $pdo->prepare(
    'INSERT INTO traffic_logs (
      visited_at, created_at, page_path, ip_address, country_code, country_name, geo_lookup_status, geo_lookup_provider, session_id,
      view_started_at, view_ended_at, view_duration_seconds,
      referrer, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  $stmt->execute([
    $visitedAt,
    date('c'),
    $pagePath,
    $clientIp,
    $country['countryCode'] ?? null,
    $country['countryName'] ?? null,
    $country['geoLookupStatus'] ?? null,
    $country['geoLookupProvider'] ?? null,
    $sessionId,
    $viewStartedAt,
    $viewEndedAt,
    $viewDurationSeconds,
    $referrer,
    $userAgent !== '' ? $userAgent : null,
  ]);

  api_response(['ok' => true]);
}

if ($action === 'reset') {
  require_admin();
  $pdo->exec('TRUNCATE TABLE traffic_logs');
  api_response(['ok' => true]);
}

api_response(['ok' => false, 'error' => 'Unsupported action'], 400);
