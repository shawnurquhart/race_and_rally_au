# Race & Rally AU — Dev Status Reminder

Last updated: 2026-04-29 (AEST)

## Current project status snapshot

- Site has been deployed to cPanel and is now in live testing.
- PIAA audit chart has been created as CSV:
  - `docs/piaa-audit-chart.csv`
- Admin Product Upload logic has been updated to:
  - associate images to products by SKU (from filename first token)
  - prefer filenames ending in `main` as primary display image
- Build/deploy approach confirmed:
  - upload **contents of `dist/`** to cPanel `public_html/`
  - ensure SPA routing fallback via `.htaccess`

## Workflow reminder (for every new session/update)

1. Read this file first: `docs/dev-status-reminder.md`
2. Confirm current live/deploy state with user.
3. After each meaningful change, update this file with:
   - date/time
   - what changed
   - whether tested locally
   - whether deployed to cPanel
4. Keep this file as the single running status note for continuity.

## Next checks (while live testing)

- Verify latest frontend changes are visible on live domain (cache + asset hash checks).
- Confirm spreadsheet upload for pricing works with expected 4-column format.
- Confirm product-image association behavior in admin on deployed environment.

## Update log

- 2026-04-29: Created initial reminder/status file to track ongoing development and deployment continuity.
- 2026-04-29: Added Product Catalogue image modal feature and admin-configurable modal display size setting.
  - New admin setting: `Product Modal - display size` (default 800px)
  - Added new "Display Settings" section in Admin Settings between Uploading and Site configuration
  - Catalog image click now opens a large modal with close button and next/previous navigation when multiple images are available.
- 2026-04-29: Extended modal behavior to Product Detail page (`/brands/piaa/catalog/product/:productId`).
  - Clicking the main product image now opens large modal
  - Uses the same `Product Modal - display size` admin setting
  - Includes close button and next/previous navigation for multi-image galleries
