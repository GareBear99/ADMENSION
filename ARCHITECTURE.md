# ADMENSION System Architecture v1.3

**Last Updated:** 2026-01-07  
**Status:** Production  
**Live URL:** https://garebear99.github.io/ADMENSION/

---

## Overview

ADMENSION is a signup-free link shortener with integrated ad monetization and revenue pooling. The system consists of **2 primary ad systems** working in harmony:

1. **Universal Ads** - UI/UX layer for sidebar and anchor bar management
2. **AdManager** - Monetization layer with AdSense, Prebid, and viewability tracking

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         USER VISITS PAGE                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              UNIVERSAL ADS (UI Layer)                         │
│  - Decides what to show (sponsors vs AdSense)                │
│  - Manages hide/show sidebar logic                           │
│  - Checks sponsor availability                               │
│  - Renders anchor bar for 72-hour sponsors                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
          ┌─────────────────┐
          │  Has Sponsors?  │
          └─────────┬───────┘
                    │
         ┌──────────┴──────────┐
         │ YES                 │ NO
         ▼                     ▼
┌────────────────┐    ┌────────────────┐
│ Show Sponsor   │    │ Call AdManager │
│ Content        │    │ to Load Ads    │
└───────┬────────┘    └────────┬───────┘
        │                      │
        └──────────┬───────────┘
                   ▼
┌──────────────────────────────────────────────────────────────┐
│              ADMANAGER (Monetization Layer)                   │
│  - Loads AdSense ads                                         │
│  - Runs Prebid header bidding (if enabled)                  │
│  - Applies geo-tiered floor prices                          │
│  - Tracks viewability (50%+ visible for 1s)                 │
│  - Lazy loading + navigation refresh                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              TRACKING (Single Source of Truth)                │
│                                                              │
│  index.html markAd(slot)                                     │
│       ↓                                                      │
│  ADMENSION_AD_VALIDATOR.logAd(...)                          │
│       ↓                                                      │
│  ADMENSION_COLLECTOR.ad_request(...)                        │
│       ↓                                                      │
│  localStorage: cfamm.ads (legacy) + validated tracking      │
└──────────────────────────────────────────────────────────────┘
```

---

## System Components

### 1. Universal Ads (UI Layer)

**File:** `universal-ads/admension-ads.js`  
**CSS:** `universal-ads/admension-ads.css`

**Responsibilities:**
- Inject sidebar and anchor bar HTML into page
- Check for active 72-hour sponsors
- Show sponsored content with priority
- Fallback to AdSense when no sponsors active
- Manage hide/show logic for sidebars
- Support modal (donation system)

**Ad Placements Managed:**
- `admension-sidebar-left` - Left sidebar (hideable)
- `admension-sidebar-right` - Right sidebar (hideable)
- `admension-anchor-bar` - Bottom sticky anchor (NOT hideable when sponsored)

**Key Functions:**
- `init(config)` - Initialize Universal Ads system
- `initSidebarAds()` - Check sponsors, show sidebar ads
- `initAnchorBar()` - Show 72-hour sponsor in anchor bar
- `trackImpression(placement, adType)` - Delegates to `markAd()` in index.html

**Configuration:**
```javascript
ADMENSION_ADS.init({
  collectorURL: 'https://your-collector.com/api/track',
  siteSource: 'admension-main',
  supportAddresses: {
    tron: 'TRON_ADDRESS',
    eth: 'ETH_ADDRESS',
    btc: 'BTC_ADDRESS'
  },
  showOnInteraction: true,
  adsenseClientID: 'ca-pub-XXXXXXXX'
});
```

---

### 2. AdManager (Monetization Layer)

**File:** `src/ads-config.js`

**Responsibilities:**
- Load and display AdSense ads
- Integrate Prebid.js header bidding (when enabled)
- Apply geo-tiered CPM floor prices
- Lazy load ads based on viewport visibility
- Track viewability (MRC standard: 50%+ visible for 1+ second)
- Refresh ads on navigation (policy-compliant)

**Ad Units Defined:**
| Unit ID | Type | Sizes | Priority | Refreshable | Geo Restriction |
|---------|------|-------|----------|-------------|-----------------|
| `sticky-footer` | Banner | 728×90, 970×90, 320×50 | 1 (Highest) | Yes | All tiers |
| `top-banner` | Banner | 728×90, 970×90, 320×100 | 2 | Yes | All tiers |
| `rail-left` | Sidebar | 300×250, 300×600 | 3 | Yes | Desktop only |
| `rail-right` | Sidebar | 300×250, 300×600 | 3 | Yes | Desktop only |
| `in-content-tall` | In-content | 300×600, 300×250, 336×280 | 2 | Yes | All tiers |
| `side-left` | Sticky side | 160×600, 120×600 | 4 | No | Wide screens (1280px+) |
| `side-right` | Sticky side | 160×600, 120×600 | 4 | No | Wide screens (1280px+) |

**Geo-Tiering:**
- **Tier 1:** US, CA, GB, AU, NZ, IE - Floor: $4.00 CPM
- **Tier 2:** EU, JP, SG - Floor: $1.50 CPM
- **Tier 3:** Rest of world - Floor: $0.40 CPM

**Key Functions:**
- `AdManager.init()` - Wait for consent, load AdSense/Prebid
- `loadAdUnit(unitId)` - Load specific ad unit
- `trackViewableImpression(unitId)` - Track MRC-compliant viewability
- `refreshOnNavigation()` - Refresh ads on page change (policy-safe)

**Tracking Integration:**
- Calls `logEvent('viewable_impression', {...})` for viewability
- Updates `localStorage: cfamm_viewable_{unitId}` counters

---

### 3. Tracking System (index.html)

**Single Source of Truth:** All ad impressions tracked through one path

**Primary Functions:**

#### `markAd(slot)`
**Location:** index.html line 1990  
**Purpose:** Centralized ad impression tracking

**Flow:**
1. Check if `ADMENSION_AD_VALIDATOR` exists
2. If YES: Use validator (preferred, prevents double-counting)
3. If NO: Fallback to legacy localStorage tracking
4. Notify `ADMENSION_COLLECTOR` for backend rollups

**Code:**
```javascript
function markAd(slot){
  if (window.ADMENSION_AD_VALIDATOR) {
    // Centralized validated tracking (preferred)
    window.ADMENSION_AD_VALIDATOR.logAd(slot, currentPage(), sid, device, utm, ref);
    if(window.ADMENSION_COLLECTOR){
      window.ADMENSION_COLLECTOR.ad_request({...});
    }
  } else {
    // Fallback: legacy localStorage only
    ads.push({...});
    localStorage.setItem(K.ads, JSON.stringify(ads));
  }
}
```

#### `logEvent(type, payload)`
**Location:** index.html line 1980  
**Purpose:** General event tracking (route changes, engagement)

**Usage:**
- Called by `showPage()` for navigation events
- Called by AdManager for viewable impressions
- Called by engagement system for page revenue potential

**Storage:**
- `localStorage: cfamm.sessions` - Event log array

---

### 4. Supporting Systems

#### Engagement System
**File:** `src/engagement-system.js`

- User profiling (NEW, ENGAGED, RETAINED, POWER tiers)
- Session tracking (pageviews, depth, retention)
- Page revenue potential calculation
- Ad density optimization by user tier

#### Anti-Abuse System
**File:** `src/anti-abuse-system.js`

- Refresh rate limiting (max 10/session, 15/hour)
- Invalid Traffic (IVT) scoring
- Bot signature detection
- Stagnation detection (random 5-7 min page refresh)

#### Ad Impression Validator
**File:** `src/ad-impression-validator.js`

- Validates ad impressions meet quality standards
- Filters duplicate impressions
- Applies fraud detection rules
- Called by `markAd()` for validated tracking

#### Event Collector
**File:** `src/event-collector.js`

- Sends lightweight events to backend
- Batches requests for efficiency
- Handles offline queue

---

## Tracking Flow (No Duplication)

### ✅ CORRECT: Single Tracking Path

```
User sees sidebar ad
      ↓
Universal Ads calls trackImpression('sidebar-left', 'adsense')
      ↓
trackImpression checks: typeof markAd === 'function'? YES
      ↓
Delegates to markAd('sidebar-left')
      ↓
markAd() calls ADMENSION_AD_VALIDATOR.logAd(...)
      ↓
Single impression logged ✓
```

### ❌ PREVIOUS (FIXED): Triple Counting

```
User sees sidebar ad
      ↓
Universal Ads: trackImpression() → fetch to collector (1st count)
      ↓
index.html: markAd() → legacy localStorage (2nd count)
      ↓
AdManager: trackViewableImpression() → logEvent() (3rd count)
      ↓
THREE impressions logged for ONE view ✗
```

---

## Revenue Calculation

**Pool Formula:**
```
monthly_pool = min($10,000, monthly_revenue × 13%)
```

**During Bootstrap (Months 1-3):**
- Pool capped at 6.5% (50% of normal rate)
- No payouts until Month 3
- First payout: April 1, 2026

**Attribution:**
- Only traffic with `?adm=CODE` parameter counts toward pool
- Organic traffic revenue goes to founder (not pooled)
- Stored in: `sessionStorage: admension_code`

**Payout Distribution:**
```
your_payout = pool × (your_ad_units / total_ad_units)
```

**Ad Units Counted:**
- Each validated impression from attributed traffic
- Tracked via `ADMENSION_AD_VALIDATOR`
- Stored in backend collector for monthly aggregation

---

## Deployment

**Repository:** [GareBear99/ADMENSION](https://github.com/GareBear99/ADMENSION)  
**Branch:** `main`  
**GitHub Pages:** Enabled (serves from `/` root)  
**Live URL:** https://garebear99.github.io/ADMENSION/

**Deployment Process:**
1. Commit changes to `main` branch
2. Push to GitHub: `git push origin main`
3. GitHub Pages auto-deploys (1-2 minutes)
4. Verify at live URL

**Critical Files:**
- `index.html` - Main application (must be in root)
- `src/*.js` - System scripts (loaded in order)
- `universal-ads/*` - Universal Ads system

---

## Configuration

### Ad System Scripts Load Order
**In index.html `<head>`:**
```html
<script src="src/consent.js"></script>
<script src="src/ads-config.js"></script>
<script src="src/engagement-tracker.js"></script>
<script src="src/anti-abuse-system.js"></script>
<script src="src/daily-quotes.js"></script>
<script src="src/ad-impression-validator.js"></script>
<script src="src/event-collector.js"></script>
```

**Note:** Universal Ads (`admension-ads.js`) is currently NOT loaded in index.html (future integration planned for multi-site network)

### AdSense Integration
**File:** `src/ads-config.js` line 18

```javascript
adsense: {
  client: 'ca-pub-XXXXXXXXXXXXXXXX', // Replace with actual publisher ID
  enabled: true,
  autoAds: false // Manual placement for control
}
```

### Prebid Integration (Optional)
**Enable after AdSense approval + 100 DAU:**

```javascript
prebid: {
  enabled: true, // Set to true when ready
  timeout: 1800,
  priceGranularity: 'medium',
  currency: 'USD'
}
```

---

## Admin System

**Security:**
- Admin PIN: `979899` (secured via prompt, NOT displayed in UI)
- Lock icon (🔒) in navigation changes to unlocked (🔓) after auth
- Admin page blocked until unlock
- Unlock function: `adminUnlockFlow()` at index.html line 1926

**Admin Features:**
- Sponsor management (72-hour placements)
- Revenue tracking dashboard
- Ad slot configuration
- Analytics review

---

## Testing

### Manual Testing Checklist

**Correct Live URL:**
- ✅ https://garebear99.github.io/ADMENSION/
- ❌ https://therustyspoon.github.io/ADMENSION/ (404)

**Pages to Test:**
1. Home (#home) - Daily quote, demo, pool stats
2. Stats (#stats) - Analytics dashboard
3. Create (#create) - Link shortener form
4. Manage (#manage) - Link management
5. Docs (#docs) - Documentation
6. Admin (#admin) - Requires PIN 979899

**Ad Display:**
- Sidebar ads show on user interaction (click/scroll/touch)
- Anchor bar shows when 72-hour sponsors active
- Pills show accurate tracking data
- No console errors

**Tracking Verification:**
1. Open DevTools Console
2. Navigate between pages
3. Check logs: `[ADMENSION_ADS] Delegating tracking...`
4. Verify only ONE impression per ad slot

---

## Future Enhancements

1. **Universal Ads Multi-Site:** Load `admension-ads.js` in index.html for consistent network-wide ads
2. **Prebid Activation:** Enable after AdSense approval + traffic threshold
3. **Amazon TAM Integration:** Add Amazon Transparent Ad Marketplace
4. **Real-time Revenue Dashboard:** Live RPM tracking by geo tier
5. **A/B Testing Framework:** Test ad layouts for optimal RPM

---

## Troubleshooting

### Issue: Blank Pages
**Cause:** JavaScript execution order (functions called before declaration)  
**Fixed:** Moved `currentPage()` before first use (commit 81c1891)

### Issue: Exposed Admin PIN
**Cause:** PIN displayed publicly in header  
**Fixed:** Removed from UI, kept in prompt only (commit 3d69cfb)

### Issue: Triple Ad Tracking
**Cause:** Universal Ads, AdManager, and legacy code all tracking separately  
**Fixed:** Centralized all tracking through `markAd()` → `AD_VALIDATOR` (commit 3d69cfb)

### Issue: Site Returns 404
**Cause:** Wrong URL (TheRustySpoon vs GareBear99)  
**Solution:** Use correct URL: https://garebear99.github.io/ADMENSION/

---

## Support

For questions or issues:
- Repository: https://github.com/GareBear99/ADMENSION
- Documentation: [docs/](docs/)
- Technical Design: This file (ARCHITECTURE.md)

---

**Version History:**
- v1.3 (2026-01-07): Consolidated ad tracking, fixed admin PIN exposure
- v1.2 (2025-12-XX): Advanced Publisher Stack release
- v1.1 (2025-XX-XX): RPM optimization layer
- v1.0 (2025-XX-XX): Initial release
