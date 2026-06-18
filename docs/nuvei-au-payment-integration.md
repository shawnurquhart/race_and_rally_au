# Nuvei AU / Till Payment Integration Notes

## Current status

- No Nuvei/Till payment creation endpoint has been connected in code yet.
- A safe no-card reachability probe was run against the supplied Notification URL; it reached the Till gateway and returned HTTP `400 Bad Request`.
- No real payment request, card transaction, or fulfilment order was created.
- Existing checkout remains simulated and records orders as `simulated-card` with fulfilment `pending`.
- Credentials were stored only in `.env.local`, which is ignored by Git via `.gitignore`.

## Provider support response

Nuvei AU support asked us to confirm:

1. The endpoint we are connecting to.
2. Which credential form we are using:
   - Site Id + Merchant Id + Secret key
   - API Key + API Username + API Password
   - Public Integration Key + Shared Secret

## Response to send back to support

Endpoint:

> We have not connected to an endpoint yet. We are intentionally waiting for the correct AU/Till endpoint before running any API request, so that we do not hit the wrong Nuvei US endpoint or accidentally create live payment activity.

Credential form:

> The supplied credential form appears to be **Public Integration Key + Shared Secret**. We were also supplied an additional value labelled **API key**. We were not supplied Site Id + Merchant Id, nor API Username + API Password.

Notification URL supplied by provider/account:

> `https://gateway.tillpayments.com/postback/CO-a384-317e-5f45-ef18-1328-286f`

Additional supplied field:

> `description`: `534930050029158`

Merchant ID:

> `534930050029158`

Note:

> The Notification URL appears to be a provider-hosted Till gateway postback URL. The additional `description` value is now confirmed to match the Merchant ID, which helps identify the account/profile configuration, but it does not by itself identify the API/session/payment creation endpoint that our backend should call.

## Safety rules before testing

- Confirm whether the supplied credentials are sandbox/test or live.
- Confirm the exact AU/Till API base URL and endpoint for the intended integration type.
- Confirm how the supplied Notification URL should be used in the checkout flow, and whether our application also needs its own server-side return/webhook URL.
- Confirm whether the Public Integration Key is safe for browser use, and whether the Shared Secret/API Key must remain server-side only.
- Start with a $0.10 or $1.00 test-only product if the provider supports low-value sandbox transactions.
- Do not mark orders as fulfilment-ready automatically after payment; keep fulfilment `pending` until manually reviewed.

## Safe test buyer details

- Name: Shawn Urquhart
- Email: urquhartdigital@gmail.com
- Phone: 0417356491
- Address: 1 Test St Melbourne Vic 3000
- Test amount: AUD $1.00
- Card details: not supplied and not stored.

## Notification URL reachability test plan

The supplied URL is labelled a Notification URL, so the first test should be treated as a connectivity/shape probe only, not a real payment attempt.

Safe request constraints:

- Do not send card data.
- Do not record a fulfilment-ready order.
- Use a clearly marked test merchant reference.
- Expect the endpoint may reject the request, because postback endpoints are usually provider-to-merchant callbacks rather than merchant-to-provider payment creation endpoints.

## Notification URL reachability test result

Test run: 2026-06-10

Request type:

- `POST https://gateway.tillpayments.com/postback/CO-a384-317e-5f45-ef18-1328-286f`
- JSON payload only.
- No card data sent.
- Test merchant reference: `RRA-SAFE-CONNECTIVITY-TEST-20260610-NODE`
- Amount: AUD $1.00

Result:

- HTTP status: `400 Bad Request`
- Content type: `text/html; charset=utf-8`
- Response title/body indicated: `Error :: Gateway` / `An error occurred during processing`

Interpretation:

> The Till gateway was reachable, but the Notification/Postback URL rejected the request. This is consistent with the URL being a provider-side notification/postback endpoint rather than the endpoint our backend should call to create a payment session or test charge.

Recommended support follow-up:

> We tested connectivity to the supplied Notification URL with a JSON-only, no-card, AUD $1.00 test payload. The gateway was reachable but returned HTTP 400 `Error :: Gateway`. We were also supplied Merchant ID `534930050029158` and `description = 534930050029158`. Please confirm the correct AU/Till endpoint and request format for creating a hosted payment/session using Merchant ID + Public Integration Key + Shared Secret, and clarify whether the additional API key is required for this flow. Please also clarify how the supplied Notification URL is intended to be used.

## Suggested integration shape

1. Frontend checkout collects customer and cart details.
2. Frontend calls a server-side endpoint such as `backend/api/payments.php` to create a hosted payment/session/token.
3. Backend uses server-side credentials from `config.php` or deployed environment/config values.
4. Payment provider redirects/posts back to a backend postback endpoint.
5. Backend verifies the postback signature/shared-secret before recording payment as captured.
6. Sales order is recorded with fulfilment status `pending` for manual review.
