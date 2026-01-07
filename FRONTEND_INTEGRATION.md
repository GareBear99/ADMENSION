# ADMENSION Frontend Integration Guide

This guide shows you how to integrate the Cloudflare Worker API into your ADMENSION frontend.

## What We're Doing

**Before:** Links stored only in browser localStorage (can't share with others)  
**After:** Links stored in Cloudflare KV (anyone can access shared links)

**Benefits:**
- ✅ Links work across all devices/browsers
- ✅ Real link shortener functionality
- ✅ Automatic 90-day expiration with activity-based refresh
- ✅ Traffic tracking per link
- ✅ Falls back to localStorage if API is offline

## Step 1: Deploy the API First

Make sure you've completed the steps in `CLOUDFLARE_SETUP.md` first. You should have:
- ✅ Cloudflare Worker deployed
- ✅ KV namespace created
- ✅ API URL (e.g., `https://admension-api.your-subdomain.workers.dev`)

## Step 2: Add API Client to index.html

Add this script tag to `index.html` **before** the closing `</body>` tag:

```html
<!-- Load API configuration first -->
<script>
  // Set your Cloudflare Worker URL here
  window.ADMENSION_API_URL = 'https://admension-api.YOUR-SUBDOMAIN.workers.dev';
</script>

<!-- Load API client library -->
<script src="./src/api-client.js"></script>
```

**Replace `YOUR-SUBDOMAIN`** with your actual Workers subdomain from deployment.

## Step 3: Update Link Creation Code

Find the link creation function in `index.html` (search for `admCreate`). 

**Current code (localStorage only):**
```javascript
document.getElementById('admCreate').onclick = function() {
  // ... validation code ...
  
  const linkData = {
    code: generateCode(),
    linkName: linkName,
    destUrl: destUrl,
    // ...
  };
  
  // Save to localStorage
  localStorage.setItem('cfamm.adm_refs', JSON.stringify(refs));
};
```

**New code (API + localStorage fallback):**
```javascript
document.getElementById('admCreate').onclick = async function() {
  // ... validation code ...
  
  try {
    // Use API client (falls back to localStorage if offline)
    const result = await window.ADMENSION_API.createLink({
      linkName: linkName,
      destUrl: destUrl,
      message: message,
      chain: chain,
      addr: addr,
    });
    
    if (result.success) {
      // Show success + links
      document.getElementById('admOut').textContent = result.shortLink;
      document.getElementById('admOutFull').textContent = result.fullLink;
      
      if (result.offline) {
        alert('⚠️ API offline - link saved locally only');
      }
    }
  } catch (error) {
    alert('Error creating link: ' + error.message);
  }
};
```

## Step 4: Add API Client to interstitial.html

Add the same scripts to `interstitial.html` **before** the closing `</body>` tag:

```html
<!-- Load API configuration -->
<script>
  window.ADMENSION_API_URL = 'https://admension-api.YOUR-SUBDOMAIN.workers.dev';
</script>

<!-- Load API client library -->
<script src="./src/api-client.js"></script>
```

## Step 5: Update Interstitial Link Fetching

Find the link loading code in `interstitial.html`.

**Current code (localStorage only):**
```javascript
const params = new URLSearchParams(location.search);
const code = params.get('code') || '';

try {
  const refs = JSON.parse(localStorage.getItem('cfamm.adm_refs') || '[]');
  linkData = refs.find(r => r.code === code.toUpperCase());
} catch(e) {
  console.error('Failed to load link data:', e);
}

if(!linkData) {
  alert('Invalid or expired link code.');
  location.href = './';
}
```

**New code (API + localStorage fallback):**
```javascript
const params = new URLSearchParams(location.search);
const code = params.get('code') || '';

let linkData = null;

// Fetch from API (with localStorage fallback)
try {
  linkData = await window.ADMENSION_API.getLink(code);
} catch(error) {
  console.error('Failed to load link:', error);
  alert('Invalid or expired link code.');
  location.href = './';
}
```

## Step 6: Update Wallet Management

Find the wallet update function in `index.html` (manage page).

**Current code:**
```javascript
document.getElementById('admSaveAddr').onclick = function() {
  const code = document.getElementById('admCodeUpdate').value.trim().toUpperCase();
  const addr = document.getElementById('admAddrUpdate').value.trim();
  
  // Update in localStorage
  const refs = JSON.parse(localStorage.getItem('cfamm.adm_refs') || '[]');
  const link = refs.find(r => r.code === code);
  if (link) {
    link.addr = addr;
    localStorage.setItem('cfamm.adm_refs', JSON.stringify(refs));
  }
};
```

**New code:**
```javascript
document.getElementById('admSaveAddr').onclick = async function() {
  const code = document.getElementById('admCodeUpdate').value.trim().toUpperCase();
  const addr = document.getElementById('admAddrUpdate').value.trim();
  
  try {
    const result = await window.ADMENSION_API.updateLink(code, { addr });
    if (result.success) {
      alert('✅ Wallet address updated!');
    }
  } catch (error) {
    alert('Error updating address: ' + error.message);
  }
};
```

## Step 7: Test the Integration

### Test 1: API Health Check
Open browser console and run:
```javascript
await window.ADMENSION_API.checkApiHealth()
// Should return: true (if API is online)
```

### Test 2: Create a Link
1. Go to Create page
2. Fill in link details
3. Click "Generate Short Link"
4. Check browser console - should see API request
5. Copy the short link

### Test 3: Share the Link
1. Open the short link in an **incognito/private window**
2. Should load the interstitial (3-step flow)
3. Complete all 3 steps
4. Should redirect to destination

### Test 4: Offline Mode
1. Open browser DevTools → Network tab
2. Set to "Offline" mode
3. Create a new link
4. Should show alert: "⚠️ API offline - link saved locally only"
5. This link won't work for others, but works locally

## Verification Checklist

After integration, verify:

- [ ] `api-client.js` loaded in both index.html and interstitial.html
- [ ] `ADMENSION_API_URL` set correctly in both files
- [ ] Link creation saves to API (check Network tab)
- [ ] Interstitial fetches from API (check Network tab)
- [ ] Links work in incognito/different browsers
- [ ] Wallet updates save to API
- [ ] Offline fallback works (create link while offline)
- [ ] No console errors

## Common Issues

### "API is not defined"
- Make sure `api-client.js` is loaded before your code runs
- Check script order in HTML

### "CORS error"
- Worker includes CORS headers by default
- Check worker.js has corsHeaders in responses

### "Link not found"
- Code may not have been saved to KV yet (check Worker logs)
- Try again in a few seconds

### "Request timeout"
- API might be slow or down
- Increase timeout in api-client.js (line 12)

## Monitoring

### Check API Usage
Visit Cloudflare Dashboard:
1. Go to Workers & Pages
2. Click on `admension-api`
3. View Metrics tab

You'll see:
- Requests per minute
- Success rate
- Errors
- CPU time

### Check KV Storage
1. Go to Workers & Pages → KV
2. Click on `ADMENSION_LINKS`
3. View keys to see stored links

## Next Steps

Once integrated and tested:
1. ✅ Deploy to production (GitHub Pages, Cloudflare Pages, etc.)
2. ✅ Share links with real users
3. ✅ Monitor API usage in Cloudflare Dashboard
4. ✅ Consider adding rate limiting for production

## Advanced: Custom Domain

If you want `api.yourdomain.com` instead of `workers.dev`:

1. Update `wrangler.toml`:
```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

2. Update API URL in frontend:
```javascript
window.ADMENSION_API_URL = 'https://api.yourdomain.com';
```

3. Redeploy:
```bash
wrangler deploy
```

---

**That's it!** Your ADMENSION app is now a fully functional link shortener with cloud storage.
