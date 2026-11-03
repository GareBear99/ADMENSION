# AdSense Compliance — Decisions Needed (2026-11-03)

This document is the companion to the 2026-11-03 AdSense cleanup
(see `FIX_LOG.md` in the work folder and the audit in
`~/workspace/vallis-adsense-audit.md`).
The technical fixes are done. The items below are **business-model
decisions that only Gary can make** — the cleanup deliberately did not
change them on its own. Nothing in this file is a redesign; it is the
exact list of what has to change (or be accepted) before AdSense can
approve the site.

**Current state after the cleanup:**
- Ads are technically wired and verifiable: `src/ad-loader.js` v3.0
  discovers containers dynamically; `VALLIS/admension-ads.js` v2.0
  carries slot plumbing and guarantees the AdSense Auto ads script is
  present on every VALLIS page. The manual placements still render
  placeholders because **SLOT_IDS are empty by design** — verified
  2026-11-03, **zero ad units exist in the AdSense account**, so there
  are no slot IDs anywhere yet. Creating the units is a later step for
  Gary; Auto ads (pub ID only, ON for the site) serves in the meantime.
- **Continuity restored (the point of this pass):** VALLIS stays
  integrated in the portal — portal → VALLIS home → wiki/games →
  ads — verified end to end 2026-11-03 (42/42 checks: every hop 200,
  Auto ads code on every path page, loader discovers containers with
  none unmapped, injector places units with exactly one AdSense
  script, no broken internal links on the path). The wiki was
  unreachable from the VALLIS home (no link either way) and the paper
  page linked a PDF at the wrong path; both are fixed.
- Copy is consistent at **13%** pool share everywhere (standardised
  2026-11-03 per CHANGELOG Issue #15, which already decided 13% is
  correct over 33% / 1/3). The VALLIS paper PDFs still say 1/3 and
  33.33% — they need regenerating from the corrected HTML paper.
- The duplicate `privacy.html` (which collected wallet addresses for
  payouts) was deleted; `privacy-policy.html` is now the single policy
  and is linked from the footer of every main page. It contains no
  wallet-address collection.
- Pools are labelled honestly (not live, illustrative APR/TVL).
  The stale "First payout April 1, 2026" / "Next payout February 1,
  2026" claims are removed. The repo no longer claims "Integration
  Complete ✅" or fabricated $41–74 RPM figures.

---

## Decision 1 — AD'AM: paying users to view ads

**What it is:** ADMENSION's core promise is "The Only Link Shortener
That Pays You". Users earn a share of ad revenue (13% pool, redeemable
at $20) for viewing ads / sharing links that show ads.

**Why AdSense blocks it:** paying users to view (or click) ads is
incentivized viewing, which violates Google's invalid-traffic policy.
An AdSense reviewer who reads "users receive 13% of net ad revenue"
on the home page, the VALLIS page and the paper will reject the
application — or approve it and ban the account later when the
incentive is detected. This is the single biggest blocker.

**Exact changes needed for AdSense compliance (pick one):**

- **Option A — Restructure the model (recommended for AdSense):**
  stop compensating ad viewing entirely. Pay users only for something
  unrelated to ads (e.g. link creation, referrals, content), or drop
  payouts and keep the shortener free. Concretely: delete the AD'AM
  revenue-share copy from `index.html` (VALLIS section), `VALLIS/homepage.html`,
  `VALLIS/vallis-paper.html`, the README/docs pool-distribution
  sections, and the payout schedule; remove the wallet-address payout
  flow from the link-creation UI; keep the ads as plain site revenue.
- **Option B — Keep the model, drop AdSense for ADMENSION:**
  monetize ADMENSION with a non-AdSense network that permits
  revenue sharing, and submit a different property (the TizWildin HUB,
  which has no payout model) to AdSense instead. The HUB still needs
  its own ad infrastructure and cleanup first.

**Until Gary picks A or B, do not submit ADMENSION to AdSense.**

## Decision 2 — The 3-step timed interstitial as the monetization core

**What it is:** every shortened link routes through
`interstitial.html` — a 3-step, 6-click, 4-timer, ~19s forced wait
whose purpose is to show ads before the redirect. The SPA also
re-places ads on navigation without a full page reload
(`ad-loader.js` `refreshAdsForPage`, `ads-config.js` heritage).

**Why AdSense blocks it:** a forced wait whose purpose is ad exposure
is the classic shape of "encouraging clicks" / invalid-traffic risk.
Timer-driven ad refresh is explicitly against policy (the repo's own
`anti-abuse-system.js` already disables automatic refresh for this
reason — the interstitial is the remaining timer-driven piece).

**Exact changes needed for AdSense compliance (pick one):**

- **Option A — De-gate the interstitial (recommended for AdSense):**
  keep the shortener, but make the wait optional/skippable and stop
  tying progress to ad exposure: one screen, a visible "Continue"
  button that works immediately, ads shown as normal page placements
  (not as a toll). Remove the 3s → 3s → 10s timer chain and the
  step-gated ad reveal. Keep `refreshAdsForPage` only for genuine
  SPA section changes, with a per-session refresh cap (already 5 in
  the retired config — re-apply it in `ad-loader.js` if kept).
- **Option B — Keep the interstitial, drop AdSense for ADMENSION:**
  same consequence as Decision 1, Option B — the interstitial is a
  legitimate monetization design for other networks, just not for
  AdSense.

**Until Gary picks A or B, do not submit ADMENSION to AdSense.**

## Required action (not a decision — just do it): certified CMP

`src/consent.js` is a home-built banner ("ready for CMP
integration"). AdSense requires a **Google-certified CMP** for
EEA/UK/CH traffic. The free path is Google Funding Choices
(AdSense → Privacy & messaging → Funding Choices) — no code purchase
needed. Wire it in and retire the homebrew banner for that traffic
before applying.

## Notes (no decision needed, already handled or low-risk)

- **Gambling-adjacent framing:** the VALLIS minigames are docs
  previews (labelled as such) and the pools are labelled not-live
  with illustrative APRs. Keep it that way until pools/games are
  real; if they go live with payouts, Canada requires
  gambling-content approval and restricted-category opt-in, with
  near-zero fill otherwise.
- **"154 ad placements" (repo description):** the number appears
  nowhere in code or docs; the real count is 31 loader containers +
  3 injected VALLIS units per VALLIS page. The GitHub repo
  description can only be edited on GitHub — Gary (or someone with
  repo settings access) must correct it there.
- **13% vs 1/3 vs 33%:** standardised to 13% per CHANGELOG Issue
  #15. If Gary says the real number is 1/3, flip it the other way —
  one `sed` across the repo; the fix log lists every file touched.
- **Slot IDs:** verified 2026-11-03 — the AdSense account has ZERO ad
  units, so no slot IDs exist anywhere to fetch. Creating the three
  units (Banner / Rectangle / Vertical) is a later step for Gary, after
  approval; one edit then fills both systems: `src/ad-loader.js`
  SLOT_IDS (single source of truth; `VALLIS/admension-ads.js` reads
  `window.ADMENSION_SLOT_IDS`). Auto ads serves from the pub-ID code
  until then — slot IDs are NOT a blocker for the review.
- **Finish line — resubmission:** the site (`garebear99.github.io`,
  "Requires review") was first declined for not enough content;
  adding VALLIS into the portal got it accepted, but the integration
  broke placements and structure. This cleanup restores that
  continuity. After the fixes are pushed AND the root site
  (`garebear99.github.io` repo: `ads.txt` + landing page with the
  Auto ads code) is live AND Gary has decided Decisions 1–2 below,
  the site is resubmitted for review. Gary approves the push and the
  resubmission separately — nothing is submitted from here.
- **No traffic:** the site shows $0.00 RPM / $0.00 daily revenue.
  AdSense has no traffic minimum, but a zero-traffic application is
  weak. Consider applying after some real traffic exists.
