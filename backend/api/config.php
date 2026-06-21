<?php
return [
  'db_host' => 'localhost',
  'db_name' => 'raceandr_site',
  'db_user' => 'raceandr_admin',
  'db_pass' => 'bcx48c67yO',
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
  'till_success_url' => 'https://raceandrallyaustralia.com.au/checkout?payment=success',
  'till_cancel_url' => 'https://raceandrallyaustralia.com.au/checkout?payment=cancelled',
  'till_error_url' => 'https://raceandrallyaustralia.com.au/checkout?payment=error',
  'till_auth_mode' => 'basic',
  'till_enable_hmac' => false,

  // Production gateway credentials used when Admin Settings > Payment Gateway Environment = Production.
  'till_production_api_base_url' => 'https://gateway.tillpayments.com',
  'till_production_api_key' => 'Fqrb0FjDJKYI6PzFX2DdLQt1OWqUrg_t',
  'till_production_api_username' => '',
  'till_production_api_password' => '',
  'till_production_shared_secret' => 'xrcMCcWIhPXFHFWGMI7Gxvnk6d0mBf_t',
  'till_production_public_integration_key' => 'HtasN90oVEsbv4V31DOW_t',
  'till_production_merchant_id' => '534930050029158',
  'till_production_notification_url' => 'https://gateway.tillpayments.com/postback/CO-a384-317e-5f45-ef18-1328-286f',
  'till_production_success_url' => 'https://raceandrallyaustralia.com.au/checkout?payment=success',
  'till_production_cancel_url' => 'https://raceandrallyaustralia.com.au/checkout?payment=cancelled',
  'till_production_error_url' => 'https://raceandrallyaustralia.com.au/checkout?payment=error',
  'till_production_auth_mode' => 'basic',
  'till_production_enable_hmac' => false,

  // Sandbox gateway credentials used when Admin Settings > Payment Gateway Environment = Sandbox.
  'till_sandbox_api_base_url' => 'https://test-gateway.tillpayments.com',
  'till_sandbox_api_key' => 'JBxazoxYOTEEtdLzmpn4Ssvl4sdpLT8',
  'till_sandbox_api_username' => 'Race and Rally AU_API_Dev',
  'till_sandbox_api_password' => 'bFen@46vGK7BdAp&e!46brVzPNHhPG',
  'till_sandbox_shared_secret' => 'tVqZTcmnEMLXlZa4H9490mfUJkBB5P8',
  'till_sandbox_public_integration_key' => 'gOukMikMVZL6WJ9rj4Ta',
  'till_sandbox_merchant_id' => '534930050029158',
  'till_sandbox_notification_url' => 'https://test-gateway.tillpayments.com/postback/CO-a384-317e-5f45-ef18-1328-286f',
  'till_sandbox_success_url' => 'https://raceandrallyaustralia.com.au/checkout?payment=success',
  'till_sandbox_cancel_url' => 'https://raceandrallyaustralia.com.au/checkout?payment=cancelled',
  'till_sandbox_error_url' => 'https://raceandrallyaustralia.com.au/checkout?payment=error',
  'till_sandbox_auth_mode' => 'basic',
  'till_sandbox_enable_hmac' => false,
];









