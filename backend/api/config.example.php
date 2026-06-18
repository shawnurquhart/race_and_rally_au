<?php
// Copy to config.php and fill with your cPanel MySQL details.
return [
  'db_host' => 'localhost',
  'db_name' => 'your_database_name',
  'db_user' => 'your_database_user',
  'db_pass' => 'your_database_password',
  'db_charset' => 'utf8mb4',
  'admin_username' => 'admin@example.com',
  'admin_password' => 'change_this_password',
  // Shared secret used by external systems (e.g. Supabase Edge Functions)
  // to remotely change site mode via backend/api/site_mode.php.
  'remote_site_mode_secret' => 'change_this_shared_secret',

  // Till Payments / Nuvei AU API v3 server-side payment configuration.
  // Keep all credentials server-side. Do not expose these as VITE_* browser variables.
  'till_api_base_url' => 'https://gateway.tillpayments.com',
  'till_debit_path_template' => '/api/v3/transaction/{apiKey}/debit',
  'till_api_key' => 'your_till_api_key',
  'till_api_username' => '',
  'till_api_password' => '',
  'till_shared_secret' => 'your_till_shared_secret',
  'till_public_integration_key' => 'your_public_integration_key',
  'till_merchant_id' => 'your_merchant_id',
  'till_notification_url' => 'https://your-domain.example/assets/backend/api/payment_callback.php',
  'till_success_url' => 'https://your-domain.example/checkout?payment=success',
  'till_cancel_url' => 'https://your-domain.example/checkout?payment=cancelled',
  'till_error_url' => 'https://your-domain.example/checkout?payment=error',
  'till_auth_mode' => 'basic', // basic | none
  'till_enable_hmac' => false,
];
