# ADMENSION Complete Setup Guide

This guide walks you through deploying the complete ADMENSION ad monetization and payout system.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Part 1: Google Apps Script Collector](#part-1-google-apps-script-collector)
- [Part 2: AdSense Integration](#part-2-adsense-integration)
- [Part 3: GitHub Actions for Monthly Payouts](#part-3-github-actions-for-monthly-payouts)
- [Part 4: Root Hub Configuration](#part-4-root-hub-configuration)
- [Part 5: Testing & Verification](#part-5-testing--verification)

---

## Prerequisites

Before starting, ensure you have:
- A Google account
- A GitHub account with push access to your repositories
- Basic understanding of:
  - Google Sheets
  - Google Apps Script
  - GitHub Actions
  - Environment variables

---

## Part 1: Google Apps Script Collector

The collector is a serverless backend that logs events, manages links, and stores wallet addresses.

### Step 1.1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it **"ADMENSION_EVENTS"**
4. Note the spreadsheet URL/ID

### Step 1.2: Deploy Apps Script

1. In your sheet, go to **Extensions → Apps Script**
2. Delete any default code
3. Copy the entire content from `cloud/apps_script_collector.gs.txt`
4. Paste it into the Apps Script editor
5. Click **Save** (disk icon)
6. Name the project: **"ADMENSION Collector"**

### Step 1.3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type"
3. Choose **Web app**
4. Configure deployment:
   - **Description:** "ADMENSION Event Collector v1"
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone with the link
5. Click **Deploy**
6. Authorize the script (follow Google's prompts)
7. **IMPORTANT:** Copy the **Web app URL** (it looks like: `https://script.google.com/macros/s/.../exec`)

### Step 1.4: Configure Sheets Sharing

For the payout system to read data:

1. Go back to your Google Sheet
2. Click **Share** (top right)
3. Change general access to: **Anyone with the link → Viewer**
4. Copy the share URL
5. Transform it to CSV URL:
   - Original: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit?usp=sharing`
   - Events CSV: `https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&sheet=events`
   - Wallets CSV: `https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&sheet=wallets`
   - Links CSV: `https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&sheet=links`

### Step 1.5: Configure Frontend

Add the collector URL to your site by creating/editing `ads-config.js`:

```javascript
// ads-config.js
window.ADMENSION_COLLECTOR_URL = 'YOUR_WEB_APP_URL_HERE';
```

Make sure this file is loaded before `manage.html`.

---

## Part 2: AdSense Integration

### Step 2.1: Apply for AdSense

1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Sign up with your Google account
3. Provide your website URL: `https://garebear99.github.io`
4. Follow verification steps (add verification code to your site)
5. Wait for approval (typically 1-2 weeks)

### Step 2.2: Configure AdSense

Once approved:

1. Go to **Ads → Overview**
2. Click **Get code** for your ad units
3. Replace ad placeholders in your HTML with real AdSense code
4. **IMPORTANT:** Only replace placeholders labeled "Ad Slot"
5. Keep the existing container structure

### Step 2.3: Payment Setup

1. In AdSense, go to **Payments → Payment information**
2. Verify your identity and address
3. Set up payment method (bank transfer, Western Union, etc.)
4. Note: Payments are issued monthly after reaching $100 threshold

---

## Part 3: GitHub Actions for Monthly Payouts

The payout system runs automatically on the 1st of each month.

### Step 3.1: Set Repository Secrets

1. Go to your GitHub repo: `https://github.com/GareBear99/ADMENSION`
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret** for each:
   - `SHEET_EVENTS_CSV_URL`: Your events sheet CSV URL
   - `SHEET_WALLETS_CSV_URL`: Your wallets sheet CSV URL
   - `WALLET_CAP_PCT`: `0.01` (1% cap per wallet)
   - `CREATOR_ADM_CODE`: Your founder ADM code (optional)
   - `PAYOUT_WALLET_PRIVATE_KEY`: Your founder wallet private key (for distributing payouts)

### Step 3.2: Create GitHub Action

Create `.github/workflows/monthly-payout.yml`:

```yaml
name: Monthly Payout Distribution

on:
  schedule:
    # Run on the 1st of every month at 00:00 UTC
    - cron: '0 0 1 * *'
  workflow_dispatch: # Allow manual triggers for testing

jobs:
  compute-payouts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd scripts
          npm install node-fetch
      
      - name: Compute and distribute payouts
        env:
          SHEET_EVENTS_CSV_URL: ${{ secrets.SHEET_EVENTS_CSV_URL }}
          SHEET_WALLETS_CSV_URL: ${{ secrets.SHEET_WALLETS_CSV_URL }}
          WALLET_CAP_PCT: ${{ secrets.WALLET_CAP_PCT }}
          CREATOR_ADM_CODE: ${{ secrets.CREATOR_ADM_CODE }}
          PAYOUT_WALLET_PRIVATE_KEY: ${{ secrets.PAYOUT_WALLET_PRIVATE_KEY }}
        run: |
          cd scripts
          node compute_payouts.mjs
```

### Step 3.3: Manual Payout Calculation (for testing)

You can run payouts locally before the first automated run:

```bash
cd scripts
export SHEET_EVENTS_CSV_URL="your_events_csv_url"
export SHEET_WALLETS_CSV_URL="your_wallets_csv_url"
export WALLET_CAP_PCT="0.01"
export CREATOR_ADM_CODE="YOURCODE"
node compute_payouts.mjs
```

---

## Part 4: Root Hub Configuration

The root hub (`garebear99.github.io`) routes traffic and tracks attribution.

### Step 4.1: Deploy Root Hub

1. Ensure `garebear99.github.io` repository exists
2. Add `index.html` with routing logic (see `root_site_index.html`)
3. Add `/r/` subdirectory with `index.html` for short link resolver
4. Enable GitHub Pages in repo settings
5. Set custom domain if desired

### Step 4.2: Configure DNS (Optional)

If using a custom domain:

1. Go to your domain registrar
2. Add CNAME record pointing to `garebear99.github.io`
3. In GitHub repo settings, set custom domain
4. Enable HTTPS

---

## Part 5: Testing & Verification

### Step 5.1: Test Event Collection

1. Visit your site: `https://garebear99.github.io/ADMENSION/`
2. Navigate through pages
3. Check your Google Sheet → events tab
4. Verify events are being logged

### Step 5.2: Test Link Creation

1. Go to Create page
2. Enter a destination URL
3. Click "Create Link"
4. Verify both long and short URLs are generated
5. Check Google Sheet → links tab

### Step 5.3: Test Wallet Submission

1. Go to Manage page
2. Enter ADM code, chain, and wallet address
3. Click "Save Wallet"
4. Check Google Sheet → wallets tab

### Step 5.4: Test Short Link Resolver

1. Copy a short link (e.g., `https://garebear99.github.io/r/ABC123`)
2. Open in new tab
3. Verify redirect to 3-step flow
4. Check hits are incremented in links sheet

### Step 5.5: Test Monthly Payout (Manual)

Before the first automatic run:

1. Add test data to sheets (fake events, wallets)
2. Run payout script locally (see Step 3.3)
3. Verify calculations in console output
4. Check wallet cap enforcement
5. Verify founder receives overflow and walletless proceeds

---

## Payout Flow Summary

Here's how the complete payout flow works:

### Monthly Timeline

**Day 1-31 of Month N:**
- Users create links with ADM codes
- Traffic flows through root hub → ADMENSION
- Events logged to Google Sheets
- Ad impressions tracked (real + placeholder)
- IVT filtering applied
- Engagement scores calculated

**Day 1-21 of Month N+1:**
- AdSense calculates revenue for Month N
- AdSense performs final validation
- Revenue amount finalized

**Day 21-22 of Month N+1:**
- AdSense issues payment to your account
- You confirm receipt in bank account

**Day 1 of Month N+2:**
- GitHub Action triggers automatically
- Script fetches events from Month N
- Calculates validated units per ADM code
- Applies 1% wallet cap with overflow redistribution
- Walletless proceeds → founder wallet
- Distributes payouts via smart contract/manual transfers

### Payout Rules

1. **Pool Funding:** 33% of net AdSense revenue
2. **Wallet Cap:** Max 1% per wallet, enforced transparently
3. **Overflow:** Redistributed to other eligible wallets
4. **Walletless:** 100% to founder (not pool), acts as burn
5. **Real vs Placeholder:** Only viewable, non-IVT impressions count
6. **Minimum:** $20 payout threshold per wallet

---

## Maintenance & Monitoring

### Daily
- Monitor Google Sheet for event collection
- Check AdSense dashboard for ad performance

### Weekly
- Review link creation and hits
- Check wallet submissions
- Monitor IVT filter false-positive rate

### Monthly (after payout)
- Verify GitHub Action ran successfully
- Audit payout distribution
- Update docs with actual pool amount
- Communicate to users via stats page

---

## Troubleshooting

### Events Not Logging
- Check `ADMENSION_COLLECTOR_URL` is set correctly
- Verify Apps Script deployment is active
- Check browser console for CORS errors
- Ensure sheet has correct tab names (events, wallets, links)

### Link Creation Fails
- Verify Apps Script has write permissions
- Check if code conflicts (should auto-retry)
- Ensure owner_token is persisted in localStorage

### Wallet Submission Fails
- Check sheet "wallets" tab exists
- Verify ADM code format (6 uppercase chars)
- Ensure address is valid for selected chain

### Short Links Don't Resolve
- Verify root hub is deployed correctly
- Check `/r/` directory exists with resolver
- Ensure Apps Script GET handler returns link data

### Payout Script Errors
- Check all environment variables are set
- Verify CSV URLs are accessible (public sharing)
- Ensure Node.js version is 18+
- Check GitHub Action logs for specific errors

---

## Security Notes

### ⚠️ Important Security Practices

1. **Never commit private keys to Git**
   - Use GitHub Secrets for sensitive data
   - Rotate keys if accidentally exposed

2. **Validate all user inputs**
   - Apps Script does basic validation
   - Client-side validation is just UX, not security

3. **Monitor for abuse**
   - Check for bot traffic patterns
   - Review IVT filter effectiveness
   - Watch for wallet farming attempts

4. **Keep deployment URLs private**
   - Don't share Apps Script web app URL publicly
   - Use environment variables, not hardcoded URLs

---

## Support & Community

- **Documentation:** See `docs.html` on your live site
- **Issues:** GitHub Issues on ADMENSION repo
- **Updates:** Check commits for latest improvements

---

## License & Attribution

When distributing payouts or creating commits, always include:
```
Co-Authored-By: Warp <agent@warp.dev>
```

---

## Next Steps

1. Complete Part 1 (Google Apps Script)
2. Test event collection thoroughly
3. Apply for AdSense (if not already approved)
4. Set up GitHub Action with test run
5. Monitor first month of real traffic
6. Execute first real payout in Month 3
7. Optimize based on user feedback and data

Good luck with your deployment! 🚀
