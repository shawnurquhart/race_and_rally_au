# Remote Image Sync Implementation Checklist (cPanel + PHP)

Use this as the single source of truth for rollout status.

## Legend
- [x] Completed
- [ ] Outstanding
- **Owner: Assistant** = implemented in code by me
- **Owner: You** = action needed in cPanel/hosting by you

---

## A) Backend/API foundations

- [x] **Owner: Assistant** — Add PHP API bootstrap and DB config template
  - Files: `backend/api/_bootstrap.php`, `backend/api/config.example.php`

- [x] **Owner: Assistant** — Add DB install endpoint for required tables
  - File: `backend/api/install.php`

- [x] **Owner: Assistant** — Add backend health endpoint (DB + table status)
  - File: `backend/api/health.php`

- [x] **Owner: Assistant** — Add product CRUD/list API endpoint
  - File: `backend/api/products.php`

- [x] **Owner: Assistant** — Add upload register read/write API endpoint
  - File: `backend/api/upload_register.php`

---

## B) Frontend backend integration

- [x] **Owner: Assistant** — Add API product repository
  - File: `src/repositories/apiProductRepository.ts`

- [x] **Owner: Assistant** — Add env-toggle repository switch (remote vs local)
  - File: `src/services/productService.ts`
  - Env: `VITE_USE_REMOTE_API`, `VITE_API_BASE_URL`

- [x] **Owner: Assistant** — Add backend maintenance service (health/install)
  - File: `src/services/backendSyncService.ts`

- [x] **Owner: Assistant** — Add Admin maintenance UI for backend checks
  - File: `src/pages/admin/AdminPiaaMaintenancePage.tsx`

---

## C) Upload register sync improvements

- [x] **Owner: Assistant** — Add remote upload register service
  - File: `src/services/remoteUploadRegisterService.ts`

- [x] **Owner: Assistant** — Add image service sync-from-remote + record-to-remote hooks
  - File: `src/services/imageAssetService.ts`

- [x] **Owner: Assistant** — Auto-load register sync on Product Upload page
  - File: `src/pages/admin/AdminProductUploadPage.tsx`

---

## D) Remaining work for full cross-device image persistence

- [ ] **Owner: Assistant** — Add server-side image upload endpoint (`multipart/form-data`)
  - Proposed file: `backend/api/upload_image.php`
  - Includes: MIME/type validation, size limits, safe path sanitation

- [ ] **Owner: Assistant** — Add server-side image existence/batch status endpoint
  - Proposed file: `backend/api/image_status.php`

- [ ] **Owner: Assistant** — Switch client image upload flow to server file paths in remote mode
  - Main file: `src/services/imageAssetService.ts`
  - Goal: stop localStorage binary dependency when remote API is on

- [ ] **Owner: Assistant** — Update report/rebuild logic to use server existence checks
  - Main file: `src/pages/admin/AdminProductUploadPage.tsx`

- [ ] **Owner: Assistant** — Add admin maintenance “Server Assets Health Check” panel/actions
  - Main file: `src/pages/admin/AdminPiaaMaintenancePage.tsx`

---

## E) cPanel/hosting actions (required from you)

- [x] **Owner: You** — Copy backend files to hosting path
  - Target used: `public_html/assets/backend/api/`

- [x] **Owner: You** — Create `config.php` from `config.example.php` with real DB creds

- [x] **Owner: You** — Run install endpoint in browser
  - Working URL: `https://raceandrallyaustralia.com.au/assets/backend/api/install.php`

- [x] **Owner: You** — Verify health endpoint returns OK + all tables true
  - Verified URL: `https://raceandrallyaustralia.com.au/assets/backend/api/health.php`

- [ ] **Owner: You** — Set frontend env for remote mode before build/deploy
  - `VITE_USE_REMOTE_API=true`
  - `VITE_API_BASE_URL=/backend/api`

- [ ] **Owner: You** — Confirm PHP upload limits are sufficient (for next phase)
  - `upload_max_filesize`, `post_max_size`, `max_file_uploads`

---

## F) Validation gates

- [x] **Owner: Assistant** — Local build passes
  - Command: `npm run build`

- [x] **Owner: You** — Confirm backend status panel shows API/DB ready in deployed admin

- [ ] **Owner: You** — Confirm Product Upload + register report persist across two browsers/devices

---

## Notes
- Setup guide: `docs/cpanel-backend-setup.md`
- If you want, I can keep updating this checklist after each of your cPanel steps and mark items complete as you report results.
