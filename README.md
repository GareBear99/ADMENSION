# ADMENSION

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/GareBear99/ADMENSION/releases)
[![GitHub Stars](https://img.shields.io/github/stars/GareBear99/ADMENSION?style=social)](https://github.com/GareBear99/ADMENSION/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/GareBear99/ADMENSION)](https://github.com/GareBear99/ADMENSION/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://garebear99.github.io/ADMENSION/)

**The Only Link Shortener That Pays You — Automatically**

No signup. No dashboard. No referrals. Share a link → people browse → ads run → revenue is pooled and distributed.

🔗 **Live:** [garebear99.github.io/ADMENSION](https://garebear99.github.io/ADMENSION/)

---

## Features

### ✨ Core Functionality
- **🔗 Link Shortening:** Create trackable links with 3-step timed interstitial (like AdFly)
- **⏱️ Interstitial Flow:** 3s → 3s → 10s countdown before destination redirect
- **💰 Automatic Payouts:** Monthly revenue distribution on the 1st (for prior month)
- **📊 Transparent Stats:** Real-time tracking of impressions, engagement, and revenue
- **🛡️ Anti-Abuse:** IVT filtering, viewability validation, engagement scoring
- **🌐 No Signup Required:** Works entirely in browser with optional wallet linking
- **🔐 Privacy-First:** No email, no accounts, no data mining

### 💸 Revenue Model
- **Ad Revenue:** Google AdSense integration with policy-compliant placement
- **Pool Distribution:** 6.5% during bootstrap (Months 1-2), then 13% from Month 3
- **Wallet Cap:** Max 1% per wallet with transparent overflow redistribution
- **Walletless Rule:** Proceeds from links without wallets go to founder (not pool)
- **Bootstrap Phase:** No payouts until Month 3 (first payout April 1, 2026)
- **Daily Quotes:** 365 motivational money/hustle quotes with rotating GIF backgrounds

### 🛠️ Technical Stack
- **Frontend:** Pure HTML/CSS/JS (no build step)
- **Backend:** Google Apps Script (serverless)
- **Payouts:** Node.js script + GitHub Actions (automated)
- **Routing:** Root hub at garebear99.github.io for traffic attribution
- **Tracking:** Google Sheets as database (CSV export for payouts)

---

## Quick Start

### For Users (Create Links & Earn)

1. Visit [garebear99.github.io/ADMENSION](https://garebear99.github.io/ADMENSION/)
2. Go to **Create** page
3. Enter link name, destination URL, custom message, and wallet address
4. Get both short and full tracking links
5. Share anywhere
6. Visitors see 3-step interstitial (3s → 3s → 10s) with ads before destination
7. Receive monthly payouts on the 1st

### For Developers (Deploy Your Own)

1. **Clone the repo:**
   ```bash
   git clone https://github.com/GareBear99/ADMENSION.git
   cd ADMENSION
   ```

2. **Follow the setup guide:**
   See [SETUP_GUIDE.md](SETUP_GUIDE.md) for comprehensive deployment instructions.

3. **Deploy to GitHub Pages:**
   - Enable GitHub Pages in repo settings
   - Set source to `main` branch
   - Your site will be live at `yourusername.github.io/ADMENSION`

4. **Configure collector:**
   - Deploy Google Apps Script from `cloud/apps_script_collector.gs.txt`
   - Set `window.ADMENSION_COLLECTOR_URL` in `ads-config.js`

5. **Set up payouts:**
   - Configure GitHub Secrets (see SETUP_GUIDE.md)
   - GitHub Action runs automatically on 1st of each month

---

## How It Works

### User Flow

```
User creates link with name, URL, message
  ↓
Visitor clicks short link
  ↓
Arrives at interstitial page with ?code=ABC123
  ↓
Step 1 (3s): Link name + timer instructions
  ↓
Step 2 (3s): Simple timer wait
  ↓
Step 3 (10s): Custom message + disclaimer + click to continue
  ↓
User clicks button → redirects to destination URL
  ↓
Ads shown on all steps (sidebars + anchor bar)
  ↓
Attribution tracked (?adm=CODE) throughout flow
  ↓
Impressions logged and validated for payouts
```

### Payout Flow

```
Month N: Traffic accumulates
  ↓
Month N+1: AdSense calculates revenue
  ↓
Day 21-22 of Month N+1: AdSense pays out
  ↓
Day 1 of Month N+2: GitHub Action runs
  ↓
Script fetches events from Google Sheets
  ↓
Validates impressions (viewability, IVT filter)
  ↓
Calculates units per ADM code
  ↓
Applies 1% wallet cap with overflow
  ↓
Walletless proceeds → founder
  ↓
Distributes payouts to qualified wallets
```

---

## Project Structure

```
ADMENSION/
├── index.html              # Main landing/flow page
├── interstitial.html       # 3-step timed redirect page (AdFly-style)
├── create.html             # Link creation page (DEPRECATED: merged into index.html)
├── manage.html             # Wallet + links management
├── stats.html              # Transparency statistics
├── docs.html               # Comprehensive documentation
├── admin.html              # Admin controls (PIN protected)
├── universal-ads/
│   ├── admension-ads.css   # Universal ad system CSS
│   └── admension-ads.js    # Universal ad system JS (attribution tracking)
├── cloud/
│   └── apps_script_collector.gs.txt  # Google Apps Script backend
├── scripts/
│   └── compute_payouts.mjs # Monthly payout calculation
├── .github/
│   └── workflows/
│       └── monthly-payout.yml  # Automated payout GitHub Action
├── SETUP_GUIDE.md          # Comprehensive deployment guide
└── README.md               # This file
```

---

## Key Features Explained

### 🔗 Link Shortening & Interstitial

- **Short URL:** Clean `interstitial.html?code=CODE` format
- **Full URL:** Tracking link with `?adm=CODE` attribution parameters
- **3-Step Flow:** Timed interstitial (3s → 3s → 10s) before destination
- **Custom Messages:** Link creator can add personalized message shown on Step 3
- **Link Names:** Friendly display names shown on Step 1 and Step 3
- **Manual Redirect:** User must click button after Step 3 timer (no auto-redirect)
- **Ad Display:** Sidebar ads + anchor bar on all 3 steps
- **Attribution:** `?adm=CODE` tracked throughout entire flow

### 💰 Payout System

- **Monthly Distribution:** Runs automatically on 1st of each month
- **Wallet Cap:** Max 1% per wallet, enforced transparently
- **Overflow Logic:** Excess from capped wallets redistributes to others
- **Walletless Rule:** Links without wallets contribute to founder (not pool)
- **Validation:** Only viewable, non-IVT impressions count
- **Minimum:** $20 threshold per wallet to qualify

### 🛡️ Anti-Abuse

- **IVT Filtering:** Invalid traffic detection (bots, datacenter IPs)
- **Viewability:** Only impressions meeting IAB viewability standards count
- **Engagement Scoring:** Bonus for completing 3-step flow
- **Rate Limiting:** Prevents spam and farming attempts
- **Unique Codes:** 6-character alphanumeric ADM codes

### 📊 Stats & Transparency

- **Real-Time:** Live tracking of impressions and engagement
- **Validated Metrics:** Separate counts for real vs placeholder ads
- **Pool Progress:** Visual indicators for monthly pool accumulation
- **Historical Data:** Monthly summaries with received revenue
- **Exportable:** JSON export of all local data

---

## Compliance & Policy

### ✅ Google AdSense Safe

- **No Auto-Refresh:** Ads only refresh on user navigation
- **No Incentivized Clicks:** Never ask users to "click ads to earn"
- **User Intent Only:** All ad exposure driven by legitimate navigation
- **Proper Labeling:** All ads clearly labeled as sponsored/advertisement
- **Viewability-First:** High viewability scores via sticky placements

### ✅ Privacy-Conscious

- **No Email Collection:** Zero personal data required
- **Browser-Based:** All user data stored locally in browser
- **Optional Wallet:** Users can participate without wallet (founder benefits)
- **GDPR Compliant:** Consent management built-in
- **Transparent:** All tracking logic open-source and auditable

### ✅ Platform Rules

- **GitHub Pages:** Static hosting, no server-side logic
- **Google Apps Script:** Serverless backend within Google's TOS
- **No Deception:** Honest messaging about revenue model
- **Attribution:** Co-author attribution on all commits

---

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** — Complete deployment instructions
- **[DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md)** — Original deployment notes
- **Live Docs:** Visit `/docs.html` on your deployed site

---

## Support & Community

- **Issues:** [GitHub Issues](https://github.com/GareBear99/ADMENSION/issues)
- **Discussions:** [GitHub Discussions](https://github.com/GareBear99/ADMENSION/discussions)
- **Live Site:** [garebear99.github.io/ADMENSION](https://garebear99.github.io/ADMENSION/)

---

## Bootstrap Phase (January - March 2026)

ADMENSION launched with a **3-month bootstrap phase** to ensure sustainable long-term payouts.

**Bootstrap Policies:**
- ⚠️ **No payouts during Months 1-2** (Jan-Feb 2026)
- 📅 **First payout:** April 1, 2026 (for March activity)
- 💰 **Pool rate:** 6.5% during bootstrap (50% of normal 13%)
- 📈 **After Month 3:** Full 13% pool + monthly payouts resume
- 🔢 **Units tracked:** All contribution tracked during bootstrap for transparency

**Why Bootstrap?**
1. Validate system stability with real traffic
2. Confirm AdSense revenue consistency
3. Test anti-abuse and IVT filters
4. Build user confidence with proven model
5. Ensure sustainable long-term payouts

**Dynamic UI:** The homepage automatically shows bootstrap status and auto-hides the notice after Month 3.

---

## Roadmap

### ✅ Completed (v1.0)
- Core 3-step flow with engagement tracking
- Link shortener with long + short URLs
- Wallet submission and management
- Google Apps Script collector backend
- Monthly payout automation via GitHub Actions
- IVT filtering and viewability validation
- Daily motivational quotes
- Comprehensive documentation
- **Bootstrap phase implementation**

### 🚧 In Progress (v1.1)
- Real AdSense integration (pending approval)
- First production payout distribution
- User feedback integration
- Performance optimization

### 🔮 Planned (v2.0)
- Smart contract-based payout distribution
- Multi-network support (Ethereum, Polygon, BSC)
- Advanced analytics dashboard
- A/B testing for ad placements
- Custom domains for short links
- API for programmatic link creation
- Mobile app (PWA)

---

## License

MIT License

When distributing payouts or creating commits, always include:
```
Co-Authored-By: Warp <agent@warp.dev>
```

---

## Acknowledgments

- **Google AdSense:** For ad serving and revenue
- **GitHub Pages:** For free hosting
- **Google Apps Script:** For serverless backend
- **Warp AI:** For development assistance

---

## Security

### Reporting Vulnerabilities

If you discover a security vulnerability, please email security@garebear99.dev (or open a private GitHub security advisory).

### Best Practices

1. **Never commit private keys** to this repo
2. **Use GitHub Secrets** for sensitive data
3. **Rotate keys** if accidentally exposed
4. **Monitor for abuse** in Google Sheets logs
5. **Keep dependencies updated**

---

## FAQ

**Q: Do I need an account?**  
A: No. The system works entirely in your browser.

**Q: Are payouts guaranteed?**  
A: No. Payouts exist only after real revenue settles from AdSense.

**Q: Can I use this on my own domain?**  
A: Yes. Deploy to your own GitHub Pages or any static host.

**Q: What if I don't set a wallet address?**  
A: Your link's proceeds go to the founder wallet (not the pool). This acts as a burn mechanism.

**Q: Is there a referral system?**  
A: No. Revenue is earned purely from ad impressions on your links.

**Q: How do I know the system is fair?**  
A: All code is open-source. Payout calculations are transparent and auditable.

**Q: Can I create multiple links?**  
A: Yes. Each link gets its own unique ADM code.

**Q: What's the minimum payout?**  
A: $20 per wallet per month.

**Q: When do payouts occur?**  
A: Automatically on the 1st of each month (for prior month's validated traffic).

---

## Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

All commits must include co-author attribution:
```
Co-Authored-By: Warp <agent@warp.dev>
```

---

## Credits

Created by [GareBear99](https://github.com/GareBear99) with assistance from Warp AI.

Part of the **VALLIS Ecosystem** of decentralized tools.

---

**Ready to get started?** → [Read the Setup Guide](SETUP_GUIDE.md)
