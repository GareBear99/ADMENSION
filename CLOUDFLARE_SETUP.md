# ADMENSION Cloudflare Workers Deployment Guide

This guide will help you deploy the ADMENSION API to Cloudflare Workers + KV storage in about 5-10 minutes.

## Prerequisites

- Cloudflare account (free tier works perfectly)
- Node.js installed on your machine
- Basic terminal/command line knowledge

## Step 1: Install Wrangler CLI

Wrangler is Cloudflare's CLI tool for Workers.

```bash
npm install -g wrangler
```

Verify installation:
```bash
wrangler --version
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

## Step 3: Create KV Namespace

KV (Key-Value) storage will hold all your link data.

```bash
cd /Users/TheRustySpoon/Desktop/Projects/Main\ projects/Trading_bots/ADMENSION
wrangler kv:namespace create "ADMENSION_LINKS"
```

You'll see output like:
```
✨ Success!
Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "ADMENSION_LINKS"
id = "abc123def456..."
```

**IMPORTANT:** Copy the `id` value (e.g., `abc123def456...`)

## Step 4: Update wrangler.toml

Open `wrangler.toml` and replace `YOUR_KV_NAMESPACE_ID_HERE` with the ID from Step 3:

```toml
[[kv_namespaces]]
binding = "ADMENSION_LINKS"
id = "abc123def456..."  # <- Your actual ID here
```

## Step 5: Deploy the Worker

```bash
wrangler deploy
```

You'll see output like:
```
✨ Success! Uploaded worker 'admension-api'
  https://admension-api.your-subdomain.workers.dev
```

**Copy this URL** - this is your API endpoint!

## Step 6: Test the API

Test that it's working:

```bash
curl https://admension-api.your-subdomain.workers.dev/api/health
```

Should return:
```json
{"status":"ok","timestamp":1234567890}
```

## Step 7: Update ADMENSION Frontend

Now you need to update your frontend code to use the API.

### Option A: Add API URL as environment variable

Add this to the top of `index.html` in a `<script>` tag:

```javascript
// Cloudflare Worker API endpoint
const API_BASE_URL = 'https://admension-api.your-subdomain.workers.dev';
```

### Option B: Use .env file (if you add a build step later)

Create `.env`:
```
VITE_API_URL=https://admension-api.your-subdomain.workers.dev
```

## Step 8: Update Frontend Code

I'll create a separate guide for updating the frontend code to use the API instead of localStorage.

## Free Tier Limits

Cloudflare Workers Free Tier includes:
- ✅ **100,000 requests per day**
- ✅ **1 GB KV storage**
- ✅ **Unlimited KV read operations**
- ✅ **1,000 KV write operations per day**

**For ADMENSION:**
- Creating 1 link = 1 write operation
- Viewing 1 link = 1 read operation
- **You can create 1,000 links/day** (more than enough!)
- **100K link views per day** before hitting request limit

## Monitoring & Logs

View logs in real-time:
```bash
wrangler tail
```

View analytics:
```bash
wrangler analytics
```

Or visit: https://dash.cloudflare.com → Workers & Pages → admension-api

## Custom Domain (Optional)

If you want to use your own domain instead of `workers.dev`:

1. Add your domain to Cloudflare
2. Update `wrangler.toml`:
```toml
routes = [
  { pattern = "yourdomain.com/api/*", zone_name = "yourdomain.com" }
]
```
3. Redeploy:
```bash
wrangler deploy
```

## Updating the Worker

To update after making changes:

```bash
wrangler deploy
```

Changes are live instantly (no downtime).

## Local Development

Test locally before deploying:

```bash
wrangler dev
```

This starts a local server at `http://localhost:8787`

## Troubleshooting

### Error: "KV namespace not found"
- Make sure you updated `wrangler.toml` with the correct KV namespace ID
- Run `wrangler kv:namespace list` to see all namespaces

### Error: "Authentication failed"
- Run `wrangler login` again
- Check you're logged into the correct Cloudflare account

### Error: "Worker exceeded CPU time"
- Unlikely with this simple API
- Check for infinite loops in worker.js

### CORS errors in browser
- The worker includes CORS headers by default
- If still seeing errors, check browser console for details

## Next Steps

After deployment:
1. ✅ Update `index.html` to call API for link creation
2. ✅ Update `interstitial.html` to fetch links from API
3. ✅ Test end-to-end: create link → share → visitor clicks
4. ✅ Monitor usage in Cloudflare dashboard

## Security Notes

**Current setup:**
- ✅ Public API (anyone can create links)
- ✅ CORS enabled for all origins
- ✅ Rate limiting handled by Cloudflare (10,000 req/min default)

**For production, consider adding:**
- API key authentication
- Rate limiting per IP
- Honeypot/CAPTCHA for link creation
- Content filtering for destUrl

## Cost Breakdown

**Free tier is sufficient for:**
- Up to 1,000 new links per day
- Up to 100,000 link clicks per day
- Storage for ~100,000 active links

**If you exceed free tier:**
- Workers: $5/month for 10M requests
- KV: $0.50/GB storage, $0.50 per million reads
- Still incredibly cheap!

## Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/
- Cloudflare Discord: https://discord.gg/cloudflaredev

---

**Your API is now live!** Next, update the frontend code to use it.
