<?php
return [
  'db_host' => 'localhost',
  'db_name' => 'raceandr_site',
  'db_user' => 'raceandr_admin',
  'db_pass' => '5~W{xD68=^^{yI2',
  'db_charset' => 'utf8mb4',

  // Server-side admin auth credentials
  'admin_username' => 'urquhartdigital@gmail.com',
  'admin_password' => 'fT1DdS5APMiaUnVB',

  // Till Payments / Nuvei AU API v3 server-side payment configuration.
  // Keep all credentials server-side. Do not expose these as VITE_* browser variables.
  'till_api_base_url' => 'https://gateway.tillpayments.com',
  'till_debit_path_template' => '/api/v3/transaction/{apiKey}/debit',
  'till_api_key' => 'Fqrb0FjDJKYI6PzFX2DdLQt1OWqUrg_t',
  'till_api_username' => '',
  'till_api_password' => '',
  'till_shared_secret' => 'xrcMCcWIhPXFHFWGMI7Gxvnk6d0mBf_t',
  'till_public_integration_key' => 'HtasN90oVEsbv4V31DOW_t',
  'till_merchant_id' => '534930050029158',
  'till_notification_url' => 'https://gateway.tillpayments.com/postback/CO-a384-317e-5f45-ef18-1328-286f',
  'till_success_url' => 'https://raceandrally.com.au/checkout?payment=success',
  'till_cancel_url' => 'https://raceandrally.com.au/checkout?payment=cancelled',
  'till_error_url' => 'https://raceandrally.com.au/checkout?payment=error',
  'till_auth_mode' => 'basic',
  'till_enable_hmac' => false,
];



