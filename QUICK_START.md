# ADMENSION Cloudflare Quick Start

## TL;DR - 5 Minute Setup

### 1. Install Wrangler
```bash
npm install -g wrangler
wrangler login
```

### 2. Create KV Namespace
```bash
cd /Users/TheRustySpoon/Desktop/Projects/Main\ projects/Trading_bots/ADMENSION
wrangler kv:namespace create "ADMENSION_LINKS"
```

Copy the `id` value from output.

### 3. Update wrangler.toml
Replace `YOUR_KV_NAMESPACE_ID_HERE` with the ID from step 2.

### 4. Deploy
```bash
wrangler deploy
```

Copy the URL (e.g., `https://admension-api.your-subdomain.workers.dev`)

### 5. Add to Frontend
Add to `index.html` and `interstitial.html` before `</body>`:

```html
<script>
  window.ADMENSION_API_URL = 'https://admension-api.YOUR-SUBDOMAIN.workers.dev';
</script>
<script src="./src/api-client.js"></script>
```

Replace `YOUR-SUBDOMAIN` with your actual subdomain.

## What You Get

✅ **100,000 API requests/day** (free)  
✅ **1,000 link creations/day** (free)  
✅ **Links work across all devices**  
✅ **Auto-expires after 90 days of inactivity**  
✅ **Falls back to localStorage if offline**

## Files Created

- `worker.js` - Cloudflare Worker API endpoints
- `wrangler.toml` - Configuration file
- `src/api-client.js` - Frontend API client library
- `CLOUDFLARE_SETUP.md` - Full deployment guide
- `FRONTEND_INTEGRATION.md` - Frontend integration guide

## Test It Works

```bash
# Test API health
curl https://admension-api.your-subdomain.workers.dev/api/health

# Should return: {"status":"ok","timestamp":...}
```

## Next Steps

1. Follow `FRONTEND_INTEGRATION.md` to connect frontend
2. Test creating a link
3. Test link in incognito/different browser
4. Monitor usage in Cloudflare Dashboard

## Need Help?

- Full setup: `CLOUDFLARE_SETUP.md`
- Frontend integration: `FRONTEND_INTEGRATION.md`
- Cloudflare Docs: https://developers.cloudflare.com/workers/

---

**That's it!** You now have a production-ready link shortener backend.
