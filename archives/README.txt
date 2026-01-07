CFAMM + ADMENSION — v1.3 (Advanced Publisher Stack + Production Hardening)
Generated: 2026-01-03

What this is
- A single-file, policy-safe ad base designed to earn via navigation/session depth (no timers, no incentives).
- Includes optional sponsor stickies (72-hour), local stats, and conservative projection tooling.
- Includes an ADMENSION pool model (post-revenue only, proportional) for transparent settlement summaries.

What’s new in v1.3
- Hard-lock admin page behind PIN (routing blocks /#admin unless unlocked).
- Conditional robots meta: admin route sets noindex/nofollow (best-effort).
- Context Skins: local selector that swaps title + meta description for context cloning.
- Traffic Tier Simulator: local selector to test density enforcement by tier.

Files
- index.html  (single-file app)
- CFAMM_ADMENSION_v12_Documentation.pdf  (payout + safety docs; still applies)

Deploy
- Any static host works (Netlify, Cloudflare Pages, GitHub Pages, S3, etc.)
- Upload index.html as the root (or serve it as /index.html).

Admin
- Open /#admin (or click Admin in nav) → click Unlock → PIN 979899
- Admin actions and inputs are local to the browser (localStorage).

Policy / safety rules (do not break)
- No auto-refresh timers for ads.
- No incentivized clicks or “watch to earn”.
- Only user intent triggers pageviews (route/step navigation).
