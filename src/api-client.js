/**
 * ADMENSION API Client
 * Handles communication with Cloudflare Worker backend
 * Falls back to localStorage when offline or API unavailable
 */

// API Configuration
const API_CONFIG = {
  // Set this to your Cloudflare Worker URL after deployment
  // Example: 'https://admension-api.your-subdomain.workers.dev'
  baseUrl: window.ADMENSION_API_URL || 'https://admension-api.your-subdomain.workers.dev',
  timeout: 10000, // 10 second timeout
};

// localStorage keys (fallback)
const STORAGE_KEY = 'cfamm.adm_refs';

/**
 * Create a new link
 * @param {Object} linkData - Link data (linkName, destUrl, message, chain, addr)
 * @returns {Promise<Object>} - {success, code, shortLink, fullLink}
 */
async function createLink(linkData) {
  try {
    // Try API first
    const response = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linkName: linkData.linkName,
        destUrl: linkData.destUrl,
        message: linkData.message || '',
        chain: linkData.chain || 'TRON',
        addr: linkData.addr || '',
      }),
    }, API_CONFIG.timeout);

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'API request failed');
    }

    // Also save to localStorage as backup
    saveLinkToLocalStorage({
      code: result.code,
      linkName: linkData.linkName,
      destUrl: linkData.destUrl,
      message: linkData.message || '',
      chain: linkData.chain || 'TRON',
      addr: linkData.addr || '',
      created: Date.now(),
      lastPageview: 0,
      totalPageviews: 0,
    });

    return result;
  } catch (error) {
    console.warn('API unavailable, falling back to localStorage:', error.message);
    
    // Fallback to localStorage
    return createLinkOffline(linkData);
  }
}

/**
 * Get link data by code
 * @param {string} code - 6-character link code
 * @returns {Promise<Object>} - Link data object
 */
async function getLink(code) {
  try {
    // Try API first
    const response = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/links/${code}`, {
      method: 'GET',
    }, API_CONFIG.timeout);

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Link not found');
    }

    // Update localStorage cache
    saveLinkToLocalStorage(result.data);

    return result.data;
  } catch (error) {
    console.warn('API unavailable, checking localStorage:', error.message);
    
    // Fallback to localStorage
    return getLinkFromLocalStorage(code);
  }
}

/**
 * Update link (wallet address)
 * @param {string} code - 6-character link code
 * @param {Object} updates - {addr, chain}
 * @returns {Promise<Object>} - {success, message}
 */
async function updateLink(code, updates) {
  try {
    // Try API first
    const response = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/links/${code}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }, API_CONFIG.timeout);

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Update failed');
    }

    // Update localStorage as well
    updateLinkInLocalStorage(code, updates);

    return result;
  } catch (error) {
    console.warn('API unavailable, updating localStorage only:', error.message);
    
    // Fallback to localStorage
    updateLinkInLocalStorage(code, updates);
    return { success: true, message: 'Updated locally (offline)' };
  }
}

/**
 * Get all links for current user (localStorage only)
 * @returns {Array} - Array of link objects
 */
function getAllLinks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to read links from localStorage:', error);
    return [];
  }
}

// ============================================
// OFFLINE/FALLBACK FUNCTIONS
// ============================================

function createLinkOffline(linkData) {
  const code = generateCode();
  const linkRecord = {
    code,
    linkName: linkData.linkName,
    destUrl: linkData.destUrl,
    message: linkData.message || '',
    chain: linkData.chain || 'TRON',
    addr: linkData.addr || '',
    created: Date.now(),
    lastPageview: 0,
    totalPageviews: 0,
  };

  saveLinkToLocalStorage(linkRecord);

  return {
    success: true,
    code,
    shortLink: `interstitial.html?code=${code}`,
    fullLink: `interstitial.html?code=${code}&adm=${code}`,
    offline: true,
  };
}

function saveLinkToLocalStorage(linkData) {
  try {
    const links = getAllLinks();
    const existingIndex = links.findIndex(l => l.code === linkData.code);
    
    if (existingIndex >= 0) {
      links[existingIndex] = linkData;
    } else {
      links.push(linkData);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

function getLinkFromLocalStorage(code) {
  const links = getAllLinks();
  const link = links.find(l => l.code === code.toUpperCase());
  
  if (!link) {
    throw new Error('Link not found in localStorage');
  }

  // Update pageview stats
  link.lastPageview = Date.now();
  link.totalPageviews = (link.totalPageviews || 0) + 1;
  saveLinkToLocalStorage(link);

  return link;
}

function updateLinkInLocalStorage(code, updates) {
  const links = getAllLinks();
  const linkIndex = links.findIndex(l => l.code === code.toUpperCase());
  
  if (linkIndex >= 0) {
    if (updates.addr !== undefined) links[linkIndex].addr = updates.addr;
    if (updates.chain !== undefined) links[linkIndex].chain = updates.chain;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function fetchWithTimeout(url, options, timeout) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
}

/**
 * Check API health
 * @returns {Promise<boolean>} - true if API is online
 */
async function checkApiHealth() {
  try {
    const response = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/health`, {
      method: 'GET',
    }, 5000);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// ============================================
// EXPORT API
// ============================================

if (typeof window !== 'undefined') {
  window.ADMENSION_API = {
    createLink,
    getLink,
    updateLink,
    getAllLinks,
    checkApiHealth,
    config: API_CONFIG,
  };
}
