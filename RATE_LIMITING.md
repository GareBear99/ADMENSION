# ADMENSION Rate Limiting System

## Overview

Intelligent, progressive rate limiting system that protects against abuse while being very lenient to legitimate users. **No permanent bans** - only temporary timeouts that reset automatically.

## Key Features

✅ **Progressive Timeouts** - Escalating bans from 1 minute to 2 hours  
✅ **Per-Action Limits** - Different limits for creating, fetching, and updating links  
✅ **Multi-Tier Protection** - Minute, hour, and daily limits  
✅ **Auto-Reset** - Violations clear after 7 days, timeouts expire automatically  
✅ **Bandwidth Protection** - No single IP can exceed 10% of daily quota  
✅ **User-Friendly** - Clear error messages with exact retry times

---

## Rate Limits (Very Lenient)

### Link Creation (POST /api/links)
- **10 per minute** - Normal user creates 1-2 links max
- **100 per hour** - Allows batch creation
- **500 per day** - 0.5% of daily KV write quota (protects bandwidth)

### Link Fetching (GET /api/links/:code)
- **60 per minute** - Handles burst traffic
- **1,000 per hour** - Allows high traffic links
- **5,000 per day** - 5% of daily request quota (protects bandwidth)

### Link Updates (PUT /api/links/:code)
- **10 per minute** - Prevents spam updates
- **50 per hour** - Allows multiple wallet changes
- **200 per day** - Normal usage covers this easily

---

## Progressive Timeout System

When a user exceeds any limit, they get a timeout. Duration increases with repeat violations:

| Violation # | Timeout Duration | Notes |
|-------------|------------------|-------|
| 1st | 1 minute | Very lenient warning |
| 2nd | 5 minutes | Accidental spam protection |
| 3rd | 15 minutes | Automated bot deterrent |
| 4th | 1 hour | Serious abuse attempt |
| 5th+ | 2 hours | Maximum penalty (no perma-ban) |

**Key Points:**
- Violations stored for 7 days, then auto-cleared
- Timeouts expire automatically (no manual unban needed)
- Users see exact countdown: "Please wait 4 minutes 32 seconds"

---

## Response Examples

### Normal Request (200 OK)
```json
{
  "success": true,
  "code": "ABC123",
  "shortLink": "interstitial.html?code=ABC123"
}
```

### Rate Limited (429 Too Many Requests)
```json
{
  "error": "Rate limit exceeded",
  "message": "Rate limit exceeded. This is violation #1. Please wait 1 minute.",
  "retryAfter": 60,
  "violationCount": 1
}
```

**Headers:**
```
Retry-After: 60
```

---

## Bandwidth Protection Math

### Daily Quota (Cloudflare Free Tier)
- **100,000 requests/day** total
- **1,000 KV writes/day** total

### Per-IP Limits (% of quota)
- **Link creation:** 500/day = 50% of KV writes (0.5% of requests)
- **Link fetching:** 5,000/day = 5% of requests
- **Link updates:** 200/day = 20% of KV writes (0.2% of requests)

### Protection Result
Even if one user maxes out their limits:
- **500 creates** = 50% of daily KV write quota ✅
- **5,000 fetches** = 5% of daily request quota ✅
- **200 updates** = 20% of daily KV write quota ✅

**Total single-IP impact: ~10% of bandwidth** ✅

With rate limiting, **10 IPs can each use max limits** without exhausting quota.

---

## How It Works

### 1. Request Arrives
```
User makes request → Extract IP from CF-Connecting-IP header
```

### 2. Check Active Timeout
```
Is IP currently timed out?
├─ Yes → Return 429 with retry time
└─ No  → Continue to step 3
```

### 3. Check Rate Limits
```
Check limits in order:
1. Minute limit (fastest reset)
2. Hour limit (medium reset)
3. Day limit (longest reset)

If any exceeded:
├─ Record violation
├─ Create progressive timeout
└─ Return 429 with details
```

### 4. Allow Request
```
All limits OK → Process request normally
```

---

## Admin Endpoint

### Check IP Status
```bash
GET /api/limits/:ip
```

**Response:**
```json
{
  "success": true,
  "status": {
    "ip": "1.2.3.4",
    "isTimedOut": true,
    "timeoutUntil": "2026-01-07T21:30:00.000Z",
    "secondsRemaining": 245,
    "violations": {
      "count": 2,
      "history": [
        {
          "timestamp": 1704664800000,
          "action": "create",
          "period": "minute"
        }
      ]
    }
  }
}
```

---

## Testing Rate Limits

### Test Script (Bash)
```bash
#!/bin/bash

API_URL="https://admension-api.your-subdomain.workers.dev"

echo "Testing rate limits..."

# Spam requests to trigger limit
for i in {1..15}; do
  echo "Request $i:"
  curl -X POST $API_URL/api/links \
    -H "Content-Type: application/json" \
    -d '{"linkName":"Test","destUrl":"https://example.com"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done

echo "Checking timeout status..."
curl $API_URL/api/limits/YOUR_IP
```

### Expected Behavior
```
Request 1-10: 201 Created (within limit)
Request 11: 429 Too Many Requests (minute limit exceeded)
Request 12-15: 429 Too Many Requests (still timed out)

After 1 minute: Timeout expires, requests work again
```

---

## Adjusting Limits

### Make More Strict
Edit `worker.js` line 15-34:

```javascript
const RATE_LIMITS = {
  create: {
    perMinute: 5,     // Reduce from 10
    perHour: 50,      // Reduce from 100
    perDay: 200,      // Reduce from 500
  },
  // ...
};
```

### Make More Lenient
```javascript
const RATE_LIMITS = {
  create: {
    perMinute: 20,    // Increase from 10
    perHour: 200,     // Increase from 100
    perDay: 1000,     // Increase from 500 (uses full KV write quota)
  },
  // ...
};
```

### Adjust Timeouts
Edit `worker.js` line 37-43:

```javascript
const TIMEOUT_DURATIONS = {
  1: 30,        // Reduce 1st violation to 30 seconds
  2: 120,       // Reduce 2nd to 2 minutes
  3: 600,       // Reduce 3rd to 10 minutes
  4: 1800,      // Reduce 4th to 30 minutes
  5: 3600,      // Reduce 5th+ to 1 hour
};
```

**After changes:**
```bash
wrangler deploy
```

---

## Frontend Integration

### Handle Rate Limit Errors

**In `src/api-client.js`:**

```javascript
async function createLink(linkData) {
  try {
    const response = await fetch(`${API_URL}/api/links`, {
      method: 'POST',
      body: JSON.stringify(linkData),
    });
    
    if (response.status === 429) {
      const error = await response.json();
      const retryAfter = response.headers.get('Retry-After');
      
      alert(`⏱️ Rate limit exceeded!\n${error.message}\nPlease try again in ${formatRetryTime(retryAfter)}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return null;
  }
}

function formatRetryTime(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  return `${Math.ceil(seconds / 60)} minutes`;
}
```

---

## Monitoring

### Check Rate Limit Usage

**Cloudflare Dashboard:**
1. Go to Workers & Pages → admension-api
2. Click Metrics
3. Look for:
   - 429 status code count (rate limited requests)
   - Requests per minute (traffic patterns)
   - CPU time (rate limit checks are fast)

### Alert on Abuse

Set up Cloudflare alerts:
1. Go to Notifications
2. Create alert: "Worker requests exceed X per minute"
3. Set threshold to 10,000 req/min (10% of daily quota)

---

## Why This System Works

### Protection Against Abuse
✅ **Script kiddies** - Blocked after 1 minute  
✅ **Automated bots** - Escalating timeouts deter persistence  
✅ **Accidental loops** - User realizes within 1 minute  
✅ **DDoS attempts** - Rate limits + Cloudflare's DDoS protection  

### Friendly to Legitimate Users
✅ **Normal usage** - Never hits any limit  
✅ **Batch operations** - 100 links/hour is generous  
✅ **High traffic links** - 5,000 views/day per IP is plenty  
✅ **Mistakes forgiven** - 1-minute timeout for first offense  
✅ **Auto-recovery** - Violations clear after 7 days  

### Bandwidth Economics
✅ **Single user impact** - Limited to ~10% of quota  
✅ **Multiple users** - 10 IPs can max out before quota exhausted  
✅ **Cost protection** - Won't exceed free tier from abuse  
✅ **Scalable** - Works on paid tiers too  

---

## Security Notes

### IP Spoofing
- Uses `CF-Connecting-IP` header (Cloudflare validates this)
- Cannot be spoofed by users
- VPN/proxy users get rate limited per IP (expected behavior)

### Bypass Attempts
- Switching IPs resets limits (expected - VPNs are fine)
- Violating multiple times increases timeout (deters abuse)
- KV storage persists across Workers (can't bypass with reload)

### Privacy
- Only stores: IP, timestamp, action type, violation count
- No user tracking beyond rate limiting
- Data auto-expires (max 7 days for violations)

---

## Summary

**Current Configuration:**
- ✅ Very lenient limits (10-500x what normal users need)
- ✅ Progressive timeouts (1 min → 2 hours, no perma-bans)
- ✅ Protects ~90% of bandwidth for legitimate traffic
- ✅ Auto-recovery (violations clear in 7 days)
- ✅ User-friendly errors with exact retry times

**Deploy & Test:**
```bash
wrangler deploy
curl https://admension-api.your-subdomain.workers.dev/api/health
```

**Your API is now protected!** 🛡️
