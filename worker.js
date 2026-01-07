/**
 * ADMENSION Cloudflare Worker API
 * Handles link creation and retrieval using KV storage
 * Features: Progressive rate limiting, abuse prevention, smart throttling
 */

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Rate limiting configuration (very lenient but protective)
const RATE_LIMITS = {
  // Link creation limits (POST /api/links)
  create: {
    perMinute: 10,      // 10 links per minute
    perHour: 100,       // 100 links per hour
    perDay: 500,        // 500 links per day (0.5% of daily quota)
  },
  // Link fetching limits (GET /api/links/:code)
  fetch: {
    perMinute: 60,      // 60 fetches per minute
    perHour: 1000,      // 1,000 fetches per hour
    perDay: 5000,       // 5,000 fetches per day (5% of daily quota)
  },
  // Update limits (PUT /api/links/:code)
  update: {
    perMinute: 10,      // 10 updates per minute
    perHour: 50,        // 50 updates per hour
    perDay: 200,        // 200 updates per day
  },
};

// Progressive timeout durations (in seconds)
const TIMEOUT_DURATIONS = {
  1: 60,        // 1st violation: 1 minute
  2: 300,       // 2nd violation: 5 minutes
  3: 900,       // 3rd violation: 15 minutes
  4: 3600,      // 4th violation: 1 hour
  5: 7200,      // 5th+ violations: 2 hours
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    try {
      // GET /api/health - Health check (no rate limit)
      if (request.method === 'GET' && path === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: Date.now() });
      }

      // GET /api/limits/:ip - Check rate limit status (admin)
      if (request.method === 'GET' && path.startsWith('/api/limits/')) {
        const ip = path.split('/').pop();
        return await getRateLimitStatus(ip, env);
      }

      // Apply rate limiting to all other endpoints
      const rateLimitCheck = await checkRateLimit(request, clientIP, path, env);
      if (!rateLimitCheck.allowed) {
        return jsonResponse({
          error: 'Rate limit exceeded',
          message: rateLimitCheck.message,
          retryAfter: rateLimitCheck.retryAfter,
          violationCount: rateLimitCheck.violationCount,
        }, 429, {
          'Retry-After': rateLimitCheck.retryAfter.toString(),
        });
      }

      // GET /api/links/:code - Fetch link data
      if (request.method === 'GET' && path.startsWith('/api/links/')) {
        const code = path.split('/').pop().toUpperCase();
        return await getLink(code, env);
      }

      // POST /api/links - Create new link
      if (request.method === 'POST' && path === '/api/links') {
        const body = await request.json();
        return await createLink(body, env);
      }

      // PUT /api/links/:code - Update link (wallet address)
      if (request.method === 'PUT' && path.startsWith('/api/links/')) {
        const code = path.split('/').pop().toUpperCase();
        const body = await request.json();
        return await updateLink(code, body, env);
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  },
};

/**
 * Create a new link
 */
async function createLink(data, env) {
  // Validate required fields
  if (!data.linkName || !data.destUrl) {
    return jsonResponse({ error: 'linkName and destUrl are required' }, 400);
  }

  // Generate unique 6-character code
  const code = generateCode();

  // Prepare link data
  const linkData = {
    code,
    linkName: data.linkName,
    destUrl: data.destUrl,
    message: data.message || '',
    chain: data.chain || 'TRON',
    addr: data.addr || '',
    created: Date.now(),
    lastPageview: 0,
    totalPageviews: 0,
  };

  // Store in KV (expires in 90 days = 7776000 seconds)
  await env.ADMENSION_LINKS.put(
    `link:${code}`,
    JSON.stringify(linkData),
    { expirationTtl: 7776000 }
  );

  return jsonResponse({
    success: true,
    code,
    shortLink: `interstitial.html?code=${code}`,
    fullLink: `interstitial.html?code=${code}&adm=${code}`,
  }, 201);
}

/**
 * Get link data by code
 */
async function getLink(code, env) {
  if (!code || code.length !== 6) {
    return jsonResponse({ error: 'Invalid code format' }, 400);
  }

  const data = await env.ADMENSION_LINKS.get(`link:${code}`);
  
  if (!data) {
    return jsonResponse({ error: 'Link not found or expired' }, 404);
  }

  const linkData = JSON.parse(data);

  // Update traffic stats
  linkData.lastPageview = Date.now();
  linkData.totalPageviews = (linkData.totalPageviews || 0) + 1;

  // Save updated stats back to KV
  await env.ADMENSION_LINKS.put(
    `link:${code}`,
    JSON.stringify(linkData),
    { expirationTtl: 7776000 } // Reset 90-day expiration on activity
  );

  return jsonResponse({
    success: true,
    data: linkData,
  });
}

/**
 * Update link (wallet address)
 */
async function updateLink(code, updates, env) {
  if (!code || code.length !== 6) {
    return jsonResponse({ error: 'Invalid code format' }, 400);
  }

  const data = await env.ADMENSION_LINKS.get(`link:${code}`);
  
  if (!data) {
    return jsonResponse({ error: 'Link not found or expired' }, 404);
  }

  const linkData = JSON.parse(data);

  // Update allowed fields
  if (updates.addr !== undefined) linkData.addr = updates.addr;
  if (updates.chain !== undefined) linkData.chain = updates.chain;

  // Save back to KV
  await env.ADMENSION_LINKS.put(
    `link:${code}`,
    JSON.stringify(linkData),
    { expirationTtl: 7776000 }
  );

  return jsonResponse({
    success: true,
    message: 'Link updated successfully',
  });
}

/**
 * Generate random 6-character alphanumeric code
 */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check rate limit for IP and endpoint
 */
async function checkRateLimit(request, clientIP, path, env) {
  // Check if IP is currently timed out
  const timeoutKey = `timeout:${clientIP}`;
  const timeout = await env.ADMENSION_LINKS.get(timeoutKey);
  
  if (timeout) {
    const timeoutData = JSON.parse(timeout);
    const now = Date.now();
    
    if (now < timeoutData.until) {
      const secondsRemaining = Math.ceil((timeoutData.until - now) / 1000);
      return {
        allowed: false,
        message: `Too many requests. Please wait ${formatDuration(secondsRemaining)} before trying again.`,
        retryAfter: secondsRemaining,
        violationCount: timeoutData.violationCount,
      };
    } else {
      // Timeout expired, clean up
      await env.ADMENSION_LINKS.delete(timeoutKey);
    }
  }
  
  // Determine action type
  let action = 'fetch';
  if (request.method === 'POST' && path === '/api/links') action = 'create';
  else if (request.method === 'PUT') action = 'update';
  
  const limits = RATE_LIMITS[action];
  
  // Check minute limit
  const minuteKey = `ratelimit:${clientIP}:${action}:minute:${getCurrentMinute()}`;
  const minuteCount = await incrementCounter(env, minuteKey, 60);
  
  if (minuteCount > limits.perMinute) {
    await recordViolation(env, clientIP, action, 'minute');
    return await createTimeoutResponse(env, clientIP);
  }
  
  // Check hour limit
  const hourKey = `ratelimit:${clientIP}:${action}:hour:${getCurrentHour()}`;
  const hourCount = await incrementCounter(env, hourKey, 3600);
  
  if (hourCount > limits.perHour) {
    await recordViolation(env, clientIP, action, 'hour');
    return await createTimeoutResponse(env, clientIP);
  }
  
  // Check day limit
  const dayKey = `ratelimit:${clientIP}:${action}:day:${getCurrentDay()}`;
  const dayCount = await incrementCounter(env, dayKey, 86400);
  
  if (dayCount > limits.perDay) {
    await recordViolation(env, clientIP, action, 'day');
    return await createTimeoutResponse(env, clientIP);
  }
  
  return { allowed: true };
}

/**
 * Increment counter in KV with expiration
 */
async function incrementCounter(env, key, ttl) {
  const current = await env.ADMENSION_LINKS.get(key);
  const count = current ? parseInt(current) + 1 : 1;
  await env.ADMENSION_LINKS.put(key, count.toString(), { expirationTtl: ttl });
  return count;
}

/**
 * Record rate limit violation
 */
async function recordViolation(env, clientIP, action, period) {
  const violationKey = `violations:${clientIP}`;
  const existing = await env.ADMENSION_LINKS.get(violationKey);
  
  let violations = existing ? JSON.parse(existing) : { count: 0, history: [] };
  violations.count += 1;
  violations.history.push({
    timestamp: Date.now(),
    action,
    period,
  });
  
  // Keep only last 10 violations
  if (violations.history.length > 10) {
    violations.history = violations.history.slice(-10);
  }
  
  // Store for 7 days
  await env.ADMENSION_LINKS.put(violationKey, JSON.stringify(violations), {
    expirationTtl: 604800,
  });
  
  return violations;
}

/**
 * Create timeout response based on violation count
 */
async function createTimeoutResponse(env, clientIP) {
  const violationKey = `violations:${clientIP}`;
  const existing = await env.ADMENSION_LINKS.get(violationKey);
  const violations = existing ? JSON.parse(existing) : { count: 1 };
  
  // Get timeout duration based on violation count
  const violationCount = violations.count;
  const timeoutSeconds = TIMEOUT_DURATIONS[Math.min(violationCount, 5)];
  const until = Date.now() + (timeoutSeconds * 1000);
  
  // Store timeout
  const timeoutKey = `timeout:${clientIP}`;
  await env.ADMENSION_LINKS.put(
    timeoutKey,
    JSON.stringify({ until, violationCount }),
    { expirationTtl: timeoutSeconds }
  );
  
  return {
    allowed: false,
    message: `Rate limit exceeded. This is violation #${violationCount}. Please wait ${formatDuration(timeoutSeconds)}.`,
    retryAfter: timeoutSeconds,
    violationCount,
  };
}

/**
 * Get rate limit status for an IP (admin endpoint)
 */
async function getRateLimitStatus(ip, env) {
  const timeoutKey = `timeout:${ip}`;
  const violationKey = `violations:${ip}`;
  
  const timeout = await env.ADMENSION_LINKS.get(timeoutKey);
  const violations = await env.ADMENSION_LINKS.get(violationKey);
  
  const status = {
    ip,
    isTimedOut: !!timeout,
    violations: violations ? JSON.parse(violations) : null,
  };
  
  if (timeout) {
    const timeoutData = JSON.parse(timeout);
    const secondsRemaining = Math.ceil((timeoutData.until - Date.now()) / 1000);
    status.timeoutUntil = new Date(timeoutData.until).toISOString();
    status.secondsRemaining = Math.max(0, secondsRemaining);
  }
  
  return jsonResponse({ success: true, status });
}

/**
 * Helper functions for time periods
 */
function getCurrentMinute() {
  return Math.floor(Date.now() / 60000);
}

function getCurrentHour() {
  return Math.floor(Date.now() / 3600000);
}

function getCurrentDay() {
  return Math.floor(Date.now() / 86400000);
}

/**
 * Format duration in human-readable format
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
  return `${Math.ceil(seconds / 3600)} hours`;
}

/**
 * Helper to return JSON response with CORS headers
 */
function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}
