# Till Payments API v3 Integration

## Architecture

```text
Customer checkout / Admin Payment Testing
  -> src/services/tillPayments.ts
  -> backend/api/payments.php
  -> Till API v3 POST /api/v3/transaction/{apiKey}/debit
  -> hosted gateway redirect URL, if returned

Till notifications
  -> backend/api/payment_callback.php
  -> payment_callbacks table
```

## Current order flow

1. Customer adds products to the local cart.
2. Checkout validates customer/shipping details.
3. `Proceed to Payment` calls `backend/api/payments.php` via `src/services/tillPayments.ts`.
4. Backend builds a Till request and calls `/api/v3/transaction/{apiKey}/debit`.
5. If Till returns a redirect URL, the browser redirects to the hosted gateway.
6. Fulfilment remains manual/pending until payment status is verified.

The previous simulated flow remains available as `Simulate Purchase (Admin/Test)`.

## Environment/configuration

Server-side PHP config keys are stored in `backend/api/config.php` and mirrored in `backend/api/config.example.php`:

- `till_api_base_url`
- `till_debit_path_template`
- `till_api_key`
- `till_api_username`
- `till_api_password`
- `till_shared_secret`
- `till_public_integration_key`
- `till_merchant_id`
- `till_notification_url`
- `till_success_url`
- `till_cancel_url`
- `till_error_url`
- `till_auth_mode`
- `till_enable_hmac`

Do not expose API username/password/shared secret in browser `VITE_*` variables.

## Database changes

`backend/api/install.php` creates/migrates:

- `sales_orders.payment_provider`
- `sales_orders.payment_reference`
- `sales_orders.gateway_transaction_id`
- `sales_orders.payment_date`
- `sales_orders.payment_response`
- `payment_logs`
- `payment_callbacks`

Run `backend/api/install.php` after deployment to apply schema updates.

## Callback flow

`backend/api/payment_callback.php`:

- Receives raw JSON or form postback payloads.
- Stores headers/body in `payment_callbacks`.
- Attempts HMAC verification if `X-Signature` and `till_shared_secret` are present.
- Does not automatically fulfil orders.

## Admin testing

Admin route:

`/admin/payment-testing`

Features:

- Enter amount/customer details.
- Create a Till payment request.
- View raw request preview.
- View raw response payload.
- Open returned redirect URL, if present.
- View recent payment logs.

## Assumptions / unknowns

- Payment initiation endpoint assumed: `POST /api/v3/transaction/{apiKey}/debit`.
- The debit path is configurable via `till_debit_path_template` so Till can provide a corrected AU endpoint without further frontend changes.
- Exact Till v3 hosted-payment payload field names still need confirmation against the AU account configuration.
- Basic Auth username/password are not currently supplied.
- HMAC request signing is implemented as a configurable placeholder but disabled until Till confirms required header/canonical format.
- The supplied Notification/Postback URL is not used for initiating payments.

## Go-live checklist

- Confirm credentials are production and approved for hosted payments.
- Confirm exact debit/hosted checkout request payload with Till AU support.
- Confirm whether Basic Auth is required and supply API username/password if needed.
- Confirm HMAC signing requirements and header name/canonical string.
- Set callback/notification URL to the Race & Rally backend callback if required.
- Run a controlled low-value payment and reconcile in Till dashboard.
- Keep fulfilment manual until payment/callback reconciliation is validated.
