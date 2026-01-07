# ADMENSION Interstitial System

**AdFly-Style Link Shortener with Timed 3-Step Flow**

---

## Overview

The ADMENSION interstitial system is a timed redirect page that displays ads before sending visitors to their final destination. Similar to AdFly, it creates a mandatory viewing experience that generates revenue for link creators.

**Key Features:**
- 3-step timed flow: 3s → 3s → 10s before redirect
- Custom link names and messages
- Universal ad system integration (sidebar ads + anchor bar)
- Full attribution tracking throughout flow
- Clean short URL format

---

## User Flow

### 1. Link Creation

User visits **Create** page on ADMENSION and enters:
- **Link Name:** Friendly display name (e.g., "My Awesome Tool")
- **Destination URL:** Final destination (must start with http:// or https://)
- **Custom Message:** Optional personalized message shown on Step 1
- **Wallet Address:** Crypto wallet for payouts (optional)
- **Chain:** Blockchain network (ETH, BSC, MATIC, etc.)

System generates:
- **Short Link:** `interstitial.html?code=ABC123`
- **Full Link:** `index.html?adm=ABC123&s=1&seed=1234567890`

Both links are stored in `localStorage` with all metadata.

### 2. Visitor Experience

When someone clicks the short link:

#### Step 1 (3 seconds)
- Display link name as heading
- Show custom message from creator (or default message if none)
- Show progress dots (1 active, 2 inactive)
- Display countdown timer
- "Next" button disabled until timer reaches 0
- Sidebar ads and anchor bar visible

#### Step 2 (3 seconds)
- Display instructions: "How this works"
- Explain ADMENSION system briefly
- Show progress dots (2 active, 1 inactive)
- Display countdown timer
- "Next" button disabled until timer reaches 0
- Sidebar ads and anchor bar visible

#### Step 3 (10 seconds)
- Display "Preparing your destination…"
- Show final countdown
- Show progress dots (all 3 active)
- "Continue to destination" button disabled until timer reaches 0
- Sidebar ads and anchor bar visible
- After 10s, button enables and clicking redirects to destination URL

---

## Technical Implementation

### Storage Format

Link records stored in `localStorage` under key `cfamm.adm_refs`:

```javascript
{
  code: "ABC123",              // 6-char uppercase alphanumeric
  linkName: "My Cool Site",    // Display name for link
  destUrl: "https://example.com", // Final destination
  message: "Check this out!",  // Custom message (optional)
  chain: "ETH",                // Blockchain network
  addr: "0x1234...",           // Wallet address (optional)
  created: 1704672000000,      // Timestamp
  addr_set: true               // Boolean flag for wallet presence
}
```

### Short Link Generation

```javascript
function makeShortLink(code) {
  const base = new URL(location.href);
  const basePath = base.pathname.replace(/\/[^/]*$/, '');
  return `${base.origin}${basePath}/interstitial.html?code=${code}`;
}
```

### Full Link Generation

```javascript
function makeAdmLink(code) {
  const nu = new URL(location.href);
  nu.searchParams.set("adm", code);
  nu.searchParams.set("s", "1");
  nu.searchParams.set("seed", String(Date.now()));
  return nu.toString();
}
```

### Link Validation

Before creating link:
- Link name required (non-empty after trim)
- Destination URL required (non-empty after trim)
- Destination must start with `http://` or `https://`
- Wallet address optional
- Custom message optional

### Attribution Tracking

Throughout the entire flow:
1. `?code=CODE` parameter identifies the link
2. `?adm=CODE` parameter (if present) identifies attribution source
3. `sessionStorage.setItem('admension_code', admCode)` captures attribution
4. Analytics events logged at each step:
   - `interstitial_load` — Page loads with code
   - `interstitial_step1_complete` — User clicked "Next" on Step 1
   - `interstitial_step2_complete` — User clicked "Next" on Step 2
   - `interstitial_complete` — User clicked final button and is about to redirect

---

## Timer Implementation

### Step 1 Timer (3 seconds)

```javascript
let countdown1 = 3;
timer1El.textContent = countdown1;
const interval1 = setInterval(() => {
  countdown1--;
  if(countdown1 < 0) countdown1 = 0;
  timer1El.textContent = countdown1;
  if(countdown1 === 0) {
    clearInterval(interval1);
    btn1.disabled = false;
  }
}, 1000);
```

### Step 2 Timer (3 seconds)

Same as Step 1, triggered when Step 1 "Next" button clicked.

### Step 3 Timer (10 seconds)

Same pattern but 10 seconds instead of 3.

---

## Ad Integration

### Universal Ad System

The interstitial page imports:
- `universal-ads/admension-ads.css` — Styling for ads
- `universal-ads/admension-ads.js` — Attribution tracking + auto-injection

### Ad Hierarchy

**Sidebar Ads (Left & Right):**
- Show 72-hour sponsored ads (if 2+ active sponsors)
- Fallback to AdSense if no sponsors
- Always hideable by user (state persists in localStorage)

**Bottom Anchor Bar:**
- Show 3rd sponsor (if 3+ active sponsors)
- NOT hideable by design
- Hidden completely if <3 sponsors

### Sponsored Ad Format

Stored in `localStorage` under key `cfamm.sponsors`:

```javascript
[
  {
    id: "sp1",
    name: "Sponsor Name",
    logo: "https://cdn.example.com/logo.png",
    url: "https://sponsor.com",
    expiry: 1704758400000  // Timestamp 72 hours from booking
  },
  // ... more sponsors
]
```

---

## Error Handling

### Invalid Code

If `?code=ABC123` doesn't match any stored link:
- Alert: "Invalid or expired link code."
- Redirect to homepage (`./`)

### Missing Destination

If link record exists but `destUrl` is missing:
- Alert: "No destination URL found."
- Redirect to homepage (`./`)

### Browser Compatibility

- Uses `localStorage` — requires modern browser
- Uses `URLSearchParams` — IE11 not supported
- Falls back gracefully if `window.ADMENSION_ENGAGEMENT` unavailable

---

## Analytics Events

All events include:
- `code` — Link code (ABC123)
- `adm_code` — Attribution code (if present, otherwise "none")

### Event Types

| Event Name | Description | Additional Data |
|------------|-------------|----------------|
| `interstitial_load` | Page loaded | `linkName`, `hasMessage`, `step: 1` |
| `interstitial_step1_complete` | Completed Step 1 | — |
| `interstitial_step2_complete` | Completed Step 2 | — |
| `interstitial_complete` | Completed all steps | `destUrl`, `chain`, `hasAddr` |

Events logged to Google Apps Script collector (if configured).

---

## Design & Styling

### Visual Theme

- **Background:** Purple gradient (`#0f0c29` → `#302b63` → `#24243e`)
- **Card:** Frosted glass effect with `backdrop-filter: blur(10px)`
- **Typography:** Space Grotesk font
- **Colors:**
  - Primary gradient: `#6ee7b7` → `#3b82f6` (teal to blue)
  - Countdown gradient: `#f59e0b` → `#ef4444` (orange to red)
  - Text: White with varying opacity

### Responsive Design

- Max width: 600px
- Width: 90% on mobile
- Center-aligned vertically and horizontally
- Touch-friendly button sizes

### Progress Indicators

3 dots representing steps:
- **Active:** Gradient background + glow effect
- **Inactive:** Semi-transparent white

---

## Deployment Checklist

### Static Files
- ✅ `interstitial.html` — Main interstitial page
- ✅ `universal-ads/admension-ads.css` — Ad styling
- ✅ `universal-ads/admension-ads.js` — Ad logic + attribution

### Configuration
- ⚠️ Update `window.ADMENSION_COLLECTOR_URL` in ad JS for analytics
- ⚠️ Replace AdSense placeholder IDs with real IDs
- ⚠️ Configure sponsor management interface (if using 72-hour ads)

### Testing
- ✅ Create link via Create page
- ✅ Copy short link
- ✅ Open in new browser/incognito
- ✅ Complete all 3 steps
- ✅ Verify redirect to destination
- ✅ Check attribution tracking in localStorage
- ✅ Verify ads display on all steps

---

## Performance Considerations

### Page Load Speed
- Minimal CSS (inline in `<style>` tags)
- No external dependencies beyond fonts + ad system
- Ad JS lazy-loads AdSense SDK

### Timer Accuracy
- Uses `setInterval` with 1-second ticks
- Buttons stay disabled until `countdown === 0`
- Prevents premature clicks

### Memory Management
- Timers cleared on step transitions
- No memory leaks from abandoned intervals

---

## Security Considerations

### XSS Prevention
- Link name displayed as `textContent` (not `innerHTML`)
- Custom message displayed as `textContent`
- No user-controlled HTML injection

### URL Validation
- Destination URL validated on creation
- Must start with `http://` or `https://`
- No `javascript:` or `data:` protocols allowed

### Code Generation
- 6-character uppercase alphanumeric codes
- Generated via `Math.random().toString(36).slice(2,8).toUpperCase()`
- Collision probability extremely low for reasonable usage

---

## Compliance & Policy

### Google AdSense Safe
- ✅ No auto-refresh of ads
- ✅ No incentivized clicks ("click ads to earn")
- ✅ User-initiated navigation only
- ✅ High viewability (ads visible during countdown)
- ✅ Clearly labeled as ads

### User Experience
- ⚠️ Timers cannot be skipped (by design)
- ✅ Progress indicators show current step
- ✅ Instructions explain purpose of interstitial
- ✅ Footer link back to ADMENSION homepage

---

## Future Enhancements

### Planned Features
- **Link Analytics:** View stats for individual links (clicks, completions, revenue)
- **Custom Branding:** Allow creators to customize interstitial colors/theme
- **Skip After N Visits:** Let repeat visitors skip interstitial
- **Geotargeting:** Different ads based on visitor location
- **A/B Testing:** Test different timer durations for optimal revenue

### Optimizations
- Preload destination page during countdown
- Cache link data for faster repeat visits
- Progressive Web App (PWA) for offline support

---

## Troubleshooting

### Link not working?
- Check browser console for errors
- Verify `localStorage` not disabled/full
- Confirm link code exists in stored records

### Ads not showing?
- Check AdSense approval status
- Verify `universal-ads` files loaded correctly
- Check browser console for ad blocker interference

### Timer stuck?
- Refresh page
- Clear browser cache
- Check for JavaScript errors in console

---

## Support

For issues or questions:
- **GitHub Issues:** [ADMENSION Issues](https://github.com/GareBear99/ADMENSION/issues)
- **Documentation:** See `docs/` directory for more guides
- **Live Demo:** [garebear99.github.io/ADMENSION](https://garebear99.github.io/ADMENSION/)

---

**Last Updated:** January 6, 2026  
**Version:** 1.0
