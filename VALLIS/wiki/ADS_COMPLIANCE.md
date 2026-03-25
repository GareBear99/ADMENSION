# Ads & Compliance (Operator Notes)

## Paste-In Points
All ad placements are isolated to dedicated "ad windows":
- Right column slot
- Footer slot

Paste your ad network code inside the `.adslot` containers.
Do NOT place ads inside content blocks, glyph pages, or over omen imagery.

## Refresh Rules (LOCKED)
Allowed refresh triggers:
- navigation (page change)
- route change
- game round completion (when implemented in game sites)

Optional timed refresh is DISABLED by default. If you later enable it:
- >= 5 minutes
- tab visible
- user active
- viewable slot
- jittered
- max 2 per session

## Forbidden (will get flagged)
- incentivized viewing
- reward gating
- blind timer refresh
- hidden-tab refresh
- click-bait deception


## Sticky Footer Ads (Added v1.2)
- 1 universal sticky display unit + optional mobile-only second unit.
- Must be non-incentivized.
- No autoplay video. No rewarded units.
- No timer refresh. Navigation-only.
- Dismissible (Hide) to preserve user autonomy.
