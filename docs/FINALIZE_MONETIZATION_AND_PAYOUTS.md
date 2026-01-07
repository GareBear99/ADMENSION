# Finalizing Monetization and Payouts

This guide makes the site production-ready with AdSense and monthly payouts on the 1st.

## 1) Set up AdSense
1. Apply at https://www.google.com/adsense/start/
2. Add site: `https://garebear99.github.io/ADMENSION/`
3. Verify ownership (meta tag or file upload).
4. After approval, find your Publisher ID (looks like `ca-pub-1234567890123456`).
5. Update `ads.txt`:
   - Replace placeholder with: `google.com, pub-XXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
6. Update your config:
   - In `src/ads-config.js` set `ADSENSE_PUBLISHER_ID` to your publisher ID.
7. Test on live site: your ad requests should become "real" (validator turns green in Stats), and revenue estimates will start using real impressions.

## 2) Centralized contribution logging (free tier)
To pay users by contribution, the site must log events centrally. This repo includes a **Google Apps Script** collector (free):

A. Create the Sheet and Web App
- Create a new Google Sheet `ADMENSION_EVENTS`.
- Extensions → Apps Script → paste code from `cloud/apps_script_collector.gs.txt`.
- Deploy → New deployment → Type Web app → Execute as "Me" → Anyone with link.
- Copy the Web app URL.

B. Wire the site to your collector
- In browser devtools Console (or add to a small inline script), set:
  ```js
  window.ADMENSION_COLLECTOR_URL = 'https://script.google.com/macros/s/.../exec'
  ```
- Or hardcode the URL inside `src/event-collector.js` if you prefer.

C. Publish the events CSV for the workflow
- File → Share → Publish to web → Sheet `events` → CSV → copy the public CSV URL.
- In your GitHub repo: Settings → Variables → Repository variables → add
  - `SHEET_EVENTS_CSV_URL` = the CSV URL you copied.

## 3) Monthly payout ledger (runs on the 1st, free)
This repo ships with a GitHub Action: `.github/workflows/payouts.yml`.
- Schedule: 00:30 UTC on the **1st of each month**.
- It downloads last month's events CSV, keeps only **viewable + non‑IVT** ad events, and aggregates units by `adm_code`.
- Pool = `min(13% × received_revenue_usd, $10,000)`.
- Outputs ledger files at `payouts/YYYY-MM/ledger.json` and `ledger.csv` and commits them.

Admin step once per month:
- When AdSense pays for last month, add `admin/settlements/YYYY-MM.json` with:
  ```
  { "received_revenue_usd": 6500 }
  ```
- The next 1st (or via manual run), ledger is generated from that settlement amount.

Timeline example (typical AdSense cadence):
- December traffic → Google pays ~January 21–23 → You add `2025-12.json` → Ledger posts on February 1 → Payouts go out.

## 4) Paying users (Phase 1: manual, $0 setup)
- Use the generated `payouts/YYYY-MM/ledger.csv` as the source of truth.
- Export a filtered CSV of users with wallet addresses (when you begin collecting them—see note below).
- Send via your preferred exchange (Coinbase bulk send or similar). Fees can be deducted from the pool.

(Phase 2 automation can wire Coinbase Commerce API when monthly revenue justifies it.)

## 5) Collecting wallet addresses
- The collector supports `wallet_submit` events into the `wallets` sheet.
- You can add a simple form on Manage page to POST `{ adm_code, chain, address }` to the same collector endpoint (already supported in `src/event-collector.js`).
- For now, maintain a second CSV/Sheet view that maps `adm_code → address` and join manually when sending payouts.

## 6) Compliance and safety
- Only **viewable** ad impressions count. IVT‑flagged sessions are excluded.
- Users are paid pro‑rata from **revenue actually received**, not estimates.
- Pool is capped at **$10,000/month** until you raise the cap.
- Payouts on the **1st of the month** (for the correct lagged period) provide a predictable schedule.

## 7) QA checklist
- Ads render as real (not placeholders) after approval.
- Stats page shows: Real vs Placeholder, Viewability Rate, Estimated Revenue, Pool.
- Collector is receiving events (check Google Sheet rows increasing).
- Repo variable `SHEET_EVENTS_CSV_URL` set.
- `admin/settlements/YYYY-MM.json` exists for last completed month.
- Action succeeds and writes to `payouts/YYYY-MM/`.

You’re production‑ready once all boxes are checked. 🚀
