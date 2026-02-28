# Changelog

All notable changes to ADMENSION will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Link shortener with automatic ad revenue sharing
- No-signup, no-dashboard link creation flow
- Interstitial ad pages with configurable wait times
- Admin dashboard with PIN-based authentication
- Link management interface (create, edit, stats)
- Privacy policy and terms of service pages
- Google AdSense integration with `ads.txt`
- Cloudflare Workers API backend
- Anti-fraud and rate limiting system
- Revenue validation and earnings tracking
- Sitemap and SEO-ready `robots.txt`
- GitHub Pages deployment
- Contributing guidelines and code of conduct
- Issue templates and PR template
- Security policy (`.github/SECURITY.md`)
- Production audit and validation checklists
- `.editorconfig` for consistent code style across editors
- Complete 365 unique daily motivational quotes (replaced Jul-Dec placeholders)

### Fixed
- **CRITICAL**: `compute_payouts.mjs` — removed extra closing brace that caused syntax error, breaking all payout calculations
- **CRITICAL**: `check-adsense-status.sh` — rewrote corrupted/garbled script that was completely non-functional
- **CRITICAL**: Removed duplicate `monthly-payout.yml` workflow (kept modern `payouts.yml` with Node 20 + v4 actions)
- **SECURITY**: Removed plaintext admin PIN (979899) from `engagement-system.js` help text
- **POLICY**: Disabled `window.location.reload()` in `anti-abuse-system.js` stagnation handler (violates AdSense auto-refresh policy)
- `sitemap.xml` — replaced hash fragment URLs (`/#page`) with real HTML URLs
- `netlify.toml` — reduced JS/CSS cache from 1 year to 1 hour (no content hashing = stale deploys)
- `netlify.toml` — restricted admin CORS from wildcard `*` to GitHub Pages origin
- `package.json` — moved `puppeteer` from `dependencies` to `devDependencies` (not needed at runtime)

### Changed
- Cleaned up `.gitignore` — removed duplicate entries, reorganized into sections

### Known Issues
- `.DS_Store` and `node_modules/` are tracked from before `.gitignore` was added
  - Run `git rm -r --cached node_modules .DS_Store` locally to fix
- Duplicate AdSense `<script>` tag in `index.html` `<head>` (see Issue #6)
- `<ul class="micro-proof">` appears before `<!doctype html>` — invalid HTML (see Issue #15)
- Pool percentage inconsistency: docs section says 33% but should be 13% (see Issue #15)
- Zero ad units rendering — AdSense Auto Ads not enabled in dashboard (see Issue #12)
- Event collector (`cloud/apps_script_collector.gs.txt`) not yet deployed (see Issue #13)
- All ad slot IDs in `ads-config.js` are placeholders — need real AdSense approval first
