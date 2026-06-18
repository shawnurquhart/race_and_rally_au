# cPanel Backend Setup (MySQL + PHP API)

## 1) Upload backend files
Upload `backend/api/*` to your hosting web root (or subfolder), e.g.:

`public_html/backend/api/`

## 2) Configure DB connection
Copy `config.example.php` to `config.php` and set:
- db_host
- db_name
- db_user
- db_pass

## 3) Install DB tables
Open in browser:

`https://your-domain.com/backend/api/install.php`

Then verify:

`https://your-domain.com/backend/api/health.php`

## 4) Frontend env config
Set build env values:

- `VITE_USE_REMOTE_API=true`
- `VITE_API_BASE_URL=/backend/api`

Rebuild and deploy frontend.

## 5) Admin maintenance checks
In Admin → PIAA Products Display & Maintenance, use:
- Check Backend Status
- Install/Repair DB Tables

This confirms readiness and helps recover missing tables.
