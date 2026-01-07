# ADMENSION

**The Only Link Shortener That Pays You — Automatically**

No signup. No dashboard. No referrals. Share a link → people browse → ads run → revenue is pooled and distributed.

🔗 **Live:** [garebear99.github.io/ADMENSION](https://garebear99.github.io/ADMENSION/)

---

## Features

### ✨ Core Functionality
- **🔗 Link Shortening:** Create trackable links with both long and short URL options
- **💰 Automatic Payouts:** Monthly revenue distribution on the 1st (for prior month)
- **📊 Transparent Stats:** Real-time tracking of impressions, engagement, and revenue
- **🛡️ Anti-Abuse:** IVT filtering, viewability validation, engagement scoring
- **🌐 No Signup Required:** Works entirely in browser with optional wallet linking
- **🔐 Privacy-First:** No email, no accounts, no data mining

### 💸 Revenue Model
- **Ad Revenue:** Google AdSense integration with policy-compliant placement
- **Pool Distribution:** 33% of net revenue allocated to user pool
- **Wallet Cap:** Max 1% per wallet with transparent overflow redistribution
- **Walletless Rule:** Proceeds from links without wallets go to founder (not pool)
- **Daily Quotes:** Engagement-gated motivational content for session depth

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
3. Enter destination URL + optional message
4. Get both long and short links
5. Share anywhere
6. Go to **Manage** page to set your wallet address
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
User creates link
  ↓
Visitor clicks link
  ↓
Arrives at root hub (garebear99.github.io)
  ↓
UTM/adm parameters captured
  ↓
Redirected to ADMENSION 3-step flow
  ↓
Step 1: Choose option A or B
  ↓
Step 2: View daily quote + engagement
  ↓
Step 3: See creator message + next steps
  ↓
Redirect to final destination
  ↓
Ad impressions logged (real vs placeholder tracked)
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
├── create.html             # Link creation page
├── manage.html             # Wallet + links management
├── stats.html              # Transparency statistics
├── docs.html               # Comprehensive documentation
├── admin.html              # Admin controls (PIN protected)
├── consent.js              # GDPR/privacy consent logic
├── ads-config.js           # AdSense & collector config
├── cloud/
│   └── apps_script_collector.gs.txt  # Google Apps Script backend
├── scripts/
│   └── compute_payouts.mjs # Monthly payout calculation
├── .github/
│   └── workflows/
│       └── monthly-payout.yml  # Automated payout GitHub Action
├── SETUP_GUIDE.md          # Comprehensive deployment guide
├── DEPLOYMENT_COMPLETE.md  # Original deployment notes
└── README.md               # This file
```

---

## Key Features Explained

### 🔗 Link Shortening

- **Long URL:** Full tracking with all parameters visible
- **Short URL:** Clean `/r/CODE` format via root hub resolver
- **Unified Tracking:** Both URLs track to the same link record
- **Auto-Cleanup:** Links inactive for 90 days are auto-deleted
- **Hit Tracking:** Every visit increments hit counter

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
