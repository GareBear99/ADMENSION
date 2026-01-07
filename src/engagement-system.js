/**
 * ADMENSION Advanced Engagement & Retention System
 * Tracks user behavior, optimizes ad placements, validates links
 * Integrates with existing session/stats system in index.html
 */

// ===== ENGAGEMENT TRACKING SYSTEM =====
const ENGAGEMENT = {
  keys: {
    userProfile: 'admension.user_profile',
    sessionHistory: 'admension.session_history',
    retentionData: 'admension.retention',
    geoCache: 'admension.geo_cache',
    linkValidation: 'admension.link_validation'
  },
  
  tiers: {
    NEW: { name: 'New User', minSessions: 0, rpmMultiplier: 0.8, adDensity: 'light' },
    ENGAGED: { name: 'Engaged User', minSessions: 3, rpmMultiplier: 1.0, adDensity: 'balanced' },
    RETAINED: { name: 'Retained User', minSessions: 10, rpmMultiplier: 1.3, adDensity: 'full' },
    POWER: { name: 'Power User', minSessions: 25, rpmMultiplier: 1.6, adDensity: 'premium' }
  },
  
  pageValues: {
    // Higher value = more premium ad slots, better floor prices
    home: { value: 1.0, premium: false, description: 'Entry point' },
    stats: { value: 1.4, premium: true, description: 'High-intent data analysis' },
    create: { value: 1.8, premium: true, description: 'Revenue generation intent' },
    manage: { value: 1.5, premium: true, description: 'Account management (high-value)' },
    docs: { value: 1.1, premium: false, description: 'Educational content' },
    admin: { value: 2.0, premium: true, description: 'Administrative actions (highest value)' }
  }
};

// ===== USER PROFILE TRACKING =====
class UserProfile {
  constructor() {
    this.load();
  }
  
  load() {
    const stored = localStorage.getItem(ENGAGEMENT.keys.userProfile);
    if (stored) {
      Object.assign(this, JSON.parse(stored));
    } else {
      this.initializeNew();
    }
  }
  
  initializeNew() {
    this.userId = this.generateUserId();
    this.created = Date.now();
    this.totalSessions = 0;
    this.totalPageviews = 0;
    this.totalTimeSpent = 0; // milliseconds
    this.returningUser = false;
    this.lastVisit = null;
    this.sessionStarts = [];
    this.completedStep3Count = 0;
    this.linkCreations = 0;
    this.avgSessionDepth = 0;
    this.engagementTier = 'NEW';
    this.save();
  }
  
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  startSession() {
    this.totalSessions++;
    this.sessionStarts.push(Date.now());
    
    // Check if returning user (visited more than 1 hour ago)
    if (this.lastVisit && (Date.now() - this.lastVisit) > 3600000) {
      this.returningUser = true;
    }
    
    this.updateEngagementTier();
    this.save();
  }
  
  endSession(pageviews, reachedStep3) {
    const sessionStart = this.sessionStarts[this.sessionStarts.length - 1];
    if (sessionStart) {
      this.totalTimeSpent += Date.now() - sessionStart;
    }
    
    this.totalPageviews += pageviews;
    if (reachedStep3) this.completedStep3Count++;
    
    this.avgSessionDepth = this.totalPageviews / Math.max(1, this.totalSessions);
    this.lastVisit = Date.now();
    
    this.updateEngagementTier();
    this.save();
  }
  
  updateEngagementTier() {
    if (this.totalSessions >= ENGAGEMENT.tiers.POWER.minSessions) {
      this.engagementTier = 'POWER';
    } else if (this.totalSessions >= ENGAGEMENT.tiers.RETAINED.minSessions) {
      this.engagementTier = 'RETAINED';
    } else if (this.totalSessions >= ENGAGEMENT.tiers.ENGAGED.minSessions) {
      this.engagementTier = 'ENGAGED';
    } else {
      this.engagementTier = 'NEW';
    }
  }
  
  incrementLinkCreation() {
    this.linkCreations++;
    this.save();
  }
  
  getEngagementMultiplier() {
    const tier = ENGAGEMENT.tiers[this.engagementTier];
    return tier ? tier.rpmMultiplier : 1.0;
  }
  
  getAdDensity() {
    const tier = ENGAGEMENT.tiers[this.engagementTier];
    return tier ? tier.adDensity : 'balanced';
  }
  
  save() {
    localStorage.setItem(ENGAGEMENT.keys.userProfile, JSON.stringify(this));
  }
  
  getStats() {
    return {
      tier: this.engagementTier,
      tierName: ENGAGEMENT.tiers[this.engagementTier].name,
      sessions: this.totalSessions,
      pageviews: this.totalPageviews,
      avgDepth: this.avgSessionDepth.toFixed(2),
      returning: this.returningUser,
      rpmMultiplier: this.getEngagementMultiplier(),
      daysSinceCreated: Math.floor((Date.now() - this.created) / (24 * 60 * 60 * 1000))
    };
  }
}

// ===== GEO-IP ENHANCEMENT =====
class GeoTracker {
  constructor() {
    this.cache = this.loadCache();
  }
  
  loadCache() {
    const stored = localStorage.getItem(ENGAGEMENT.keys.geoCache);
    return stored ? JSON.parse(stored) : {};
  }
  
  saveCache() {
    localStorage.setItem(ENGAGEMENT.keys.geoCache, JSON.stringify(this.cache));
  }
  
  async fetchGeoData() {
    // Check cache first (24 hour TTL)
    if (this.cache.ip && this.cache.fetched && (Date.now() - this.cache.fetched) < 86400000) {
      return this.cache;
    }
    
    try {
      // Use free ipapi.co service (no key required, 1000 requests/day)
      const response = await fetch('https://ipapi.co/json/', { timeout: 3000 });
      if (!response.ok) throw new Error('Geo API failed');
      
      const data = await response.json();
      
      this.cache = {
        ip: data.ip,
        country: data.country_code,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        latitude: data.latitude,
        longitude: data.longitude,
        geoTier: this.determineGeoTier(data.country_code),
        fetched: Date.now()
      };
      
      this.saveCache();
      return this.cache;
    } catch (error) {
      console.warn('[GeoTracker] Fetch failed, using fallback', error);
      // Fallback to timezone-based detection (existing system)
      return {
        geoTier: window.inferGeoTier ? window.inferGeoTier() : 2,
        fallback: true
      };
    }
  }
  
  determineGeoTier(countryCode) {
    const tier1 = ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'DE', 'CH', 'NO', 'SE', 'DK'];
    const tier2 = ['FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'JP', 'SG', 'HK', 'KR'];
    
    if (tier1.includes(countryCode)) return 1;
    if (tier2.includes(countryCode)) return 2;
    return 3;
  }
  
  getFloorPrice(tier) {
    const floors = { 1: 4.00, 2: 1.50, 3: 0.40 };
    return floors[tier] || 0.40;
  }
}

// ===== PAGE VALUE & AD OPTIMIZATION =====
class PageOptimizer {
  constructor(userProfile, geoTracker) {
    this.userProfile = userProfile;
    this.geoTracker = geoTracker;
  }
  
  getPageRevenuePotential(pageName) {
    const pageConfig = ENGAGEMENT.pageValues[pageName] || ENGAGEMENT.pageValues.home;
    const userMultiplier = this.userProfile.getEngagementMultiplier();
    const geoTier = this.geoTracker.cache.geoTier || 2;
    const geoMultiplier = { 1: 1.5, 2: 1.0, 3: 0.6 }[geoTier];
    
    return {
      baseValue: pageConfig.value,
      userMultiplier,
      geoMultiplier,
      totalMultiplier: pageConfig.value * userMultiplier * geoMultiplier,
      isPremium: pageConfig.premium,
      floorPrice: this.geoTracker.getFloorPrice(geoTier) * pageConfig.value
    };
  }
  
  getOptimalAdUnits(pageName, step) {
    const potential = this.getPageRevenuePotential(pageName);
    const density = this.userProfile.getAdDensity();
    
    // Base units (always show)
    const units = ['sticky-footer', 'top-banner'];
    
    // Add units based on page premium status and user engagement
    if (potential.isPremium) {
      units.push('in-content-tall');
      if (density === 'full' || density === 'premium') {
        units.push('rail-right', 'rail-left');
      }
    }
    
    // Progressive reveal based on step
    if (step >= 2) {
      units.push('in-content-tall');
    }
    
    if (step >= 3 && (density === 'full' || density === 'premium')) {
      units.push('rail-right', 'side-left', 'side-right');
    }
    
    // Premium users get footer banner
    if (density === 'premium') {
      units.push('footer-banner');
    }
    
    return [...new Set(units)]; // Remove duplicates
  }
  
  logPageView(pageName, step) {
    const potential = this.getPageRevenuePotential(pageName);
    
    console.log(`[PageOptimizer] ${pageName} - Potential: ${potential.totalMultiplier.toFixed(2)}× | Floor: $${potential.floorPrice.toFixed(2)}`);
    
    // Track to analytics
    if (typeof logEvent === 'function') {
      logEvent('page_revenue_potential', {
        page: pageName,
        step,
        potential: potential.totalMultiplier,
        isPremium: potential.isPremium,
        userTier: this.userProfile.engagementTier
      });
    }
  }
}

// ===== LINK SHORTENER VALIDATION =====
class LinkValidator {
  constructor() {
    this.validationData = this.loadValidationData();
  }
  
  loadValidationData() {
    const stored = localStorage.getItem(ENGAGEMENT.keys.linkValidation);
    return stored ? JSON.parse(stored) : { created: {}, validated: {}, errors: [] };
  }
  
  saveValidationData() {
    localStorage.setItem(ENGAGEMENT.keys.linkValidation, JSON.stringify(this.validationData));
  }
  
  validateAdmLink(code, url) {
    const validation = {
      code,
      url,
      timestamp: Date.now(),
      isValid: false,
      errors: []
    };
    
    try {
      const urlObj = new URL(url);
      
      // Check required parameters
      if (!urlObj.searchParams.has('adm')) {
        validation.errors.push('Missing ADM parameter');
      } else if (urlObj.searchParams.get('adm') !== code) {
        validation.errors.push('ADM code mismatch');
      }
      
      if (!urlObj.searchParams.has('s')) {
        validation.errors.push('Missing step parameter');
      } else {
        const step = parseInt(urlObj.searchParams.get('s'));
        if (step < 1 || step > 3 || isNaN(step)) {
          validation.errors.push('Invalid step value (must be 1-3)');
        }
      }
      
      if (!urlObj.searchParams.has('seed')) {
        validation.errors.push('Missing seed parameter');
      }
      
      // Check URL structure
      if (!urlObj.hash) {
        validation.errors.push('Missing page hash (should have #home, #stats, etc)');
      }
      
      validation.isValid = validation.errors.length === 0;
      
    } catch (error) {
      validation.errors.push('Invalid URL format: ' + error.message);
    }
    
    this.validationData.validated[code] = validation;
    this.saveValidationData();
    
    return validation;
  }
  
  trackLinkCreation(code, url, chain, address) {
    this.validationData.created[code] = {
      code,
      url,
      chain,
      address,
      created: Date.now(),
      validated: this.validateAdmLink(code, url)
    };
    
    this.saveValidationData();
    
    return this.validationData.created[code];
  }
  
  getLinkStats(code) {
    const created = this.validationData.created[code];
    if (!created) return null;
    
    // Count how many times this link was used (from sessions data)
    const sessions = JSON.parse(localStorage.getItem('cfamm.sessions') || '[]');
    const linkSessions = sessions.filter(s => s.adm === code);
    
    return {
      code,
      created: created.created,
      url: created.url,
      isValid: created.validated.isValid,
      errors: created.validated.errors,
      totalSessions: linkSessions.length,
      uniqueUsers: new Set(linkSessions.map(s => s.sid)).size,
      pageviews: linkSessions.filter(s => s.type === 'pageview').length,
      step3Reached: linkSessions.filter(s => s.step === 3).length
    };
  }
  
  validateAllLinks() {
    const admRefs = JSON.parse(localStorage.getItem('admension.refs') || '[]');
    const results = [];
    
    for (const ref of admRefs) {
      const url = this.reconstructUrl(ref.code);
      const validation = this.validateAdmLink(ref.code, url);
      results.push({
        code: ref.code,
        chain: ref.chain,
        address: ref.addr,
        validation
      });
    }
    
    return results;
  }
  
  reconstructUrl(code) {
    // Reconstruct URL from code (assumes current domain)
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?adm=${code}&s=1&seed=${Date.now()}#home`;
  }
  
  fixBrokenLink(code) {
    const admRefs = JSON.parse(localStorage.getItem('admension.refs') || '[]');
    const ref = admRefs.find(r => r.code === code);
    if (!ref) return null;
    
    // Generate new valid URL
    const validUrl = this.reconstructUrl(code);
    
    console.log(`[LinkValidator] Fixed link for code: ${code}`);
    return validUrl;
  }
}

// ===== USER SATISFACTION METRICS =====
class SatisfactionTracker {
  measureSessionQuality(sessionData) {
    let qualityScore = 0;
    let factors = {};
    
    // Factor 1: Session depth (pages/session)
    const pageviews = sessionData.filter(s => s.type === 'pageview').length;
    if (pageviews >= 5) {
      qualityScore += 30;
      factors.depth = 'excellent';
    } else if (pageviews >= 3) {
      qualityScore += 20;
      factors.depth = 'good';
    } else if (pageviews >= 2) {
      qualityScore += 10;
      factors.depth = 'fair';
    } else {
      factors.depth = 'poor';
    }
    
    // Factor 2: Completion rate (reached step 3)
    const reachedStep3 = sessionData.some(s => s.step === 3);
    if (reachedStep3) {
      qualityScore += 30;
      factors.completion = 'completed';
    } else {
      factors.completion = 'incomplete';
    }
    
    // Factor 3: Time spent (heuristic: more events = more time)
    if (sessionData.length >= 10) {
      qualityScore += 20;
      factors.engagement = 'high';
    } else if (sessionData.length >= 5) {
      qualityScore += 10;
      factors.engagement = 'medium';
    } else {
      factors.engagement = 'low';
    }
    
    // Factor 4: Link creation (high-intent action)
    const createdLink = sessionData.some(s => s.type === 'adm_create');
    if (createdLink) {
      qualityScore += 20;
      factors.conversion = 'converted';
    } else {
      factors.conversion = 'browsing';
    }
    
    return {
      score: qualityScore, // 0-100
      grade: this.getGrade(qualityScore),
      factors,
      bounced: pageviews === 1,
      sessionLength: sessionData.length
    };
  }
  
  getGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'F';
  }
  
  getBounceRate() {
    const sessions = JSON.parse(localStorage.getItem('cfamm.sessions') || '[]');
    const sessionIds = [...new Set(sessions.map(s => s.sid))];
    
    let bounces = 0;
    for (const sid of sessionIds) {
      const sessionEvents = sessions.filter(s => s.sid === sid);
      const pageviews = sessionEvents.filter(s => s.type === 'pageview').length;
      if (pageviews === 1) bounces++;
    }
    
    return sessionIds.length > 0 ? (bounces / sessionIds.length) * 100 : 0;
  }
}

// ===== IDIOT-PROOFING & ERROR HANDLING =====
class UserGuidance {
  showLinkCreationHelp() {
    return {
      title: 'How Link Creation Works',
      steps: [
        '1. Optional: Enter your wallet address (TRON, ETH, or BTC)',
        '2. Click "Create Link" to generate your unique ADM code',
        '3. Share the link - visitors will complete a 3-step flow',
        '4. Earn a share of the ADMENSION pool (13% of revenue)',
        '5. Set wallet address later in "Manage" if you forgot'
      ],
      tips: [
        'TRON has lowest fees (recommended for small payouts)',
        'Links work immediately - no approval needed',
        'Track your link performance in "Stats" page',
        'You can create multiple links for different campaigns'
      ]
    };
  }
  
  validateUserInput(type, value) {
    const validations = {
      walletAddress: (addr) => {
        if (!addr || addr.trim() === '') return { valid: true, optional: true };
        
        const tronRegex = /^T[A-Za-z1-9]{33}$/;
        const ethRegex = /^0x[a-fA-F0-9]{40}$/;
        const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
        
        if (tronRegex.test(addr.trim())) return { valid: true, chain: 'TRON' };
        if (ethRegex.test(addr.trim())) return { valid: true, chain: 'ETH' };
        if (btcRegex.test(addr.trim())) return { valid: true, chain: 'BTC' };
        
        return { 
          valid: false, 
          error: 'Invalid wallet address format. Check for typos or extra spaces.' 
        };
      },
      
      admCode: (code) => {
        if (!code || code.trim().length < 6) {
          return { valid: false, error: 'ADM code must be at least 6 characters' };
        }
        return { valid: true };
      }
    };
    
    return validations[type] ? validations[type](value) : { valid: true };
  }
  
  getContextualHelp(page) {
    const help = {
      home: 'Complete the 3-step flow to see how the system works. Each step loads more content.',
      stats: 'Track your performance: sessions, pageviews, and estimated RPM. Data is saved locally.',
      create: 'Generate your unique ADM link. Wallet address is optional - you can add it later.',
      manage: 'View and update wallet addresses for your ADM codes. All changes save to browser.',
      docs: 'Learn how payouts work. Formula: pool × (your_units / total_units). Post-revenue only.',
      admin: 'Advanced settings. Requires PIN 979899. Use carefully.'
    };
    
    return help[page] || 'Navigate using the menu above. All data is saved locally in your browser.';
  }
}

// ===== INITIALIZATION & INTEGRATION =====
class EngagementSystem {
  constructor() {
    this.userProfile = new UserProfile();
    this.geoTracker = new GeoTracker();
    this.pageOptimizer = new PageOptimizer(this.userProfile, this.geoTracker);
    this.linkValidator = new LinkValidator();
    this.satisfactionTracker = new SatisfactionTracker();
    this.userGuidance = new UserGuidance();
    
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    console.log('[EngagementSystem] Initializing...');
    
    // Start session
    this.userProfile.startSession();
    
    // Fetch geo data (async, non-blocking)
    this.geoTracker.fetchGeoData().then(geo => {
      console.log('[EngagementSystem] Geo data loaded:', geo);
      // Update global geo tier if needed
      if (window.RPM && geo.geoTier) {
        window.RPM.geoTier = geo.geoTier;
      }
    });
    
    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      const sessions = JSON.parse(localStorage.getItem('cfamm.sessions') || '[]');
      const currentSid = localStorage.getItem('cfamm.sid');
      const sessionEvents = sessions.filter(s => s.sid === currentSid);
      const pageviews = sessionEvents.filter(s => s.type === 'pageview').length;
      const reachedStep3 = sessionEvents.some(s => s.step === 3);
      
      this.userProfile.endSession(pageviews, reachedStep3);
    });
    
    this.initialized = true;
    console.log('[EngagementSystem] Initialized. User tier:', this.userProfile.engagementTier);
  }
  
  onPageView(pageName, step) {
    this.pageOptimizer.logPageView(pageName, step);
    
    // Get optimal ad units for this page/step combination
    const units = this.pageOptimizer.getOptimalAdUnits(pageName, step);
    console.log(`[EngagementSystem] Optimal ad units for ${pageName} (step ${step}):`, units);
    
    return units;
  }
  
  onLinkCreated(code, url, chain, address) {
    this.userProfile.incrementLinkCreation();
    const validation = this.linkValidator.trackLinkCreation(code, url, chain, address);
    
    console.log('[EngagementSystem] Link created:', validation);
    
    return validation;
  }
  
  getSessionQuality() {
    const sessions = JSON.parse(localStorage.getItem('cfamm.sessions') || '[]');
    const currentSid = localStorage.getItem('cfamm.sid');
    const sessionData = sessions.filter(s => s.sid === currentSid);
    
    return this.satisfactionTracker.measureSessionQuality(sessionData);
  }
  
  getSystemStats() {
    return {
      user: this.userProfile.getStats(),
      geo: this.geoTracker.cache,
      bounceRate: this.satisfactionTracker.getBounceRate(),
      sessionQuality: this.getSessionQuality()
    };
  }
}

// ===== EXPORT FOR INTEGRATION =====
if (typeof window !== 'undefined') {
  window.EngagementSystem = EngagementSystem;
  window.ADMENSION_ENGAGEMENT = new EngagementSystem();
  
  // Auto-initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ADMENSION_ENGAGEMENT.initialize();
    });
  } else {
    window.ADMENSION_ENGAGEMENT.initialize();
  }
}

console.log('[ADMENSION] Engagement system loaded');
