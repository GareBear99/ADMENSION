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

### Changed
- Cleaned up `.gitignore` — removed duplicate entries, reorganized into sections

### Known Issues
- `.DS_Store` and `node_modules/` are tracked from before `.gitignore` was added
  - Run `git rm -r --cached node_modules .DS_Store` locally to fix
