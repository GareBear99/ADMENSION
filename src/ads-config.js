/**
 * ADMENSION Ad Configuration v2.0
 * Production-ready monetization with $6-20 RPM target
 * 
 * Features:
 * - Google AdSense integration
 * - Prebid.js header bidding
 * - Lazy loading (viewability optimized)
 * - Navigation-based refresh (policy-compliant)
 * - Geo-tiered ad density
 * - Real-time performance tracking
 */

// ===== CONFIGURATION =====
const AD_CONFIG = {
  // REPLACE THESE WITH YOUR ACTUAL IDS
  adsense: {
    client: 'ca-pub-XXXXXXXXXXXXXXXX', // Your AdSense publisher ID
    enabled: true,
    autoAds: false // We use manual placement for better control
  },
  
  prebid: {
    enabled: false, // Enable after AdSense approval and 100+ DAU
    timeout: 1800, // 1.8 seconds
    priceGranularity: 'medium',
    currency: 'USD'
  },
  
  amazon: {
    enabled: false, // Enable after prebid setup
    pubID: 'XXXXX' // Your Amazon TAM publisher ID
  },
  
  // Lazy loading settings
  lazyLoad: {
    enabled: true,
    rootMargin: '300px', // Optimized for better viewability (changed from 500px)
    threshold: 0.01
  },
  
  // Navigation refresh (policy-compliant, no timers)
  refresh: {
    enabled: true,
    onNavigation: true,
    onStepChange: true,
    maxRefreshes: 5 // Per session per unit
  },
  
  // Geo-based configuration
  geoTiers: {
    1: { // Premium: US, CA, UK, AU, NZ, IE
      density: 'full',
      expectedCPM: 12.00,
      floorPrice: 4.00, // Minimum CPM for Tier-1
      placements: ['sticky', 'top', 'rail-left', 'rail-right', 'tall', 'side-left', 'side-right']
    },
    2: { // Mid: EU, JP, SG, developed markets
      density: 'balanced',
      expectedCPM: 5.00,
      floorPrice: 1.50, // Minimum CPM for Tier-2
      placements: ['sticky', 'top', 'rail-left', 'tall']
    },
    3: { // Rest of world
      density: 'light',
      expectedCPM: 1.50,
      floorPrice: 0.40, // Minimum CPM for Tier-3
      placements: ['sticky', 'top']
    }
  },
  
  // Viewability tracking (50%+ visible for 1+ second)
  viewability: {
    enabled: true,
    minViewablePercentage: 0.50, // 50% visible
    minViewableTime: 1000, // 1 second in milliseconds
    trackingInterval: 100 // Check every 100ms
  },
  
  // Sponsor fallback (show ads when sponsors not active)
  sponsorFallback: {
    enabled: true,
    checkInterval: 5000, // Check every 5 seconds
    fallbackSlots: ['side-left', 'side-right'] // Use these slots when no sponsors
  }
};

// ===== PAGE REFRESH MAPPING =====
// Maps which ad units should be refreshed on each page navigation
const PAGE_REFRESH_MAP = {
  home: ['top-banner', 'rail-right', 'in-content-tall', 'footer-banner'],
  stats: ['sticky-footer', 'top-banner', 'in-content-tall', 'rail-right'],
  create: ['top-banner', 'rail-left', 'in-content-tall', 'footer-banner'],
  manage: ['top-banner', 'rail-left', 'in-content-tall'],
  docs: ['top-banner', 'in-content-tall', 'rail-left'],
  admin: ['top-banner', 'in-content-tall', 'rail-left']
};

// ===== AD UNIT DEFINITIONS =====
const AD_UNITS = {
  'sticky-footer': {
    id: 'sticky-footer',
    type: 'banner',
    sizes: [[728, 90], [970, 90], [320, 50]],
    divId: 'ad-sticky-footer',
    priority: 1, // Highest viewability
    adsenseSlot: '/XXXXXXX/sticky-footer', // Replace with your slot
    refreshable: true
  },
  
  'top-banner': {
    id: 'top-banner',
    type: 'banner',
    sizes: [[728, 90], [970, 90], [320, 100]],
    divId: 'ad-top-banner',
    priority: 2,
    adsenseSlot: '/XXXXXXX/top-banner',
    refreshable: true
  },
  
  'rail-left': {
    id: 'rail-left',
    type: 'sidebar',
    sizes: [[300, 250], [300, 600]],
    divId: 'ad-rail-left',
    priority: 3,
    adsenseSlot: '/XXXXXXX/rail-left',
    refreshable: true,
    minWidth: 980 // Desktop only
  },
  
  'rail-right': {
    id: 'rail-right',
    type: 'sidebar',
    sizes: [[300, 250], [300, 600]],
    divId: 'ad-rail-right',
    priority: 3,
    adsenseSlot: '/XXXXXXX/rail-right',
    refreshable: true,
    minWidth: 980
  },
  
  'in-content-tall': {
    id: 'in-content-tall',
    type: 'in-content',
    sizes: [[300, 600], [300, 250], [336, 280]],
    divId: 'ad-in-content-tall',
    priority: 2,
    adsenseSlot: '/XXXXXXX/in-content',
    refreshable: true
  },
  
  'side-left': {
    id: 'side-left',
    type: 'sticky-side',
    sizes: [[160, 600], [120, 600]],
    divId: 'ad-side-left',
    priority: 4,
    adsenseSlot: '/XXXXXXX/side-left',
    refreshable: false,
    minWidth: 1280 // Wide screens only
  },
  
  'side-right': {
    id: 'side-right',
    type: 'sticky-side',
    sizes: [[160, 600], [120, 600]],
    divId: 'ad-side-right',
    priority: 4,
    adsenseSlot: '/XXXXXXX/side-right',
    refreshable: false,
    minWidth: 1280
  }
};

// ===== AD MANAGER =====
class AdManager {
  constructor() {
    this.loadedUnits = new Set();
    this.refreshCounts = {};
    this.observer = null;
    this.geoTier = window.__geoTier || 2;
    this.allowedPlacements = AD_CONFIG.geoTiers[this.geoTier].placements;
  }
  
  init() {
    console.log('[AdManager] Waiting for user consent before initializing ads');
    
    // CRITICAL: Wait for consent before loading any ads (GDPR/CCPA compliance)
    window.addEventListener('consent-ready', (e) => {
      if (e.detail && e.detail.advertising) {
        console.log('[AdManager] Consent granted, proceeding with ad initialization');
        this.proceedWithInit();
      } else {
        console.log('[AdManager] Advertising consent not granted, ads disabled');
      }
    });
    
    // Fallback: if consent already granted before this script loads
    if (window.__consentGranted && window.__consentGranted.advertising) {
      console.log('[AdManager] Consent already granted, initializing immediately');
      this.proceedWithInit();
    }
  }
  
  proceedWithInit() {
    console.log('[AdManager] Initializing with geo tier:', this.geoTier);
    
    // Load AdSense
    if (AD_CONFIG.adsense.enabled) {
      this.loadAdSense();
    }
    
    // Load Prebid if enabled
    if (AD_CONFIG.prebid.enabled) {
      this.loadPrebid();
    }
    
    // Setup lazy loading
    if (AD_CONFIG.lazyLoad.enabled) {
      this.setupLazyLoading();
    }
    
    // Setup navigation refresh
    if (AD_CONFIG.refresh.enabled) {
      this.setupRefresh();
    }
    
    // Initial ad load
    this.loadInitialAds();
  }
  
  loadAdSense() {
    console.log('[AdManager] Loading AdSense');
    
    // Load AdSense script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CONFIG.adsense.client}`;
    script.crossOrigin = 'anonymous';
    
    script.onerror = () => {
      console.error('[AdManager] AdSense script failed to load');
    };
    
    document.head.appendChild(script);
    
    // Initialize adsbygoogle
    window.adsbygoogle = window.adsbygoogle || [];
  }
  
  loadPrebid() {
    console.log('[AdManager] Loading Prebid.js');
    
    // Load Prebid script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://cdn.jsdelivr.net/npm/prebid.js@latest/dist/not-for-prod/prebid.js';
    
    script.onload = () => {
      this.initPrebid();
    };
    
    document.head.appendChild(script);
  }
  
  initPrebid() {
    if (!window.pbjs) {
      console.error('[AdManager] Prebid not loaded');
      return;
    }
    
    const pbjs = window.pbjs;
    pbjs.que = pbjs.que || [];
    
    pbjs.que.push(() => {
      // Get floor price for current geo tier
      const floorPrice = AD_CONFIG.geoTiers[this.geoTier]?.floorPrice || 0.40;
      
      // Configure Prebid with floor prices
      pbjs.setConfig({
        priceGranularity: AD_CONFIG.prebid.priceGranularity,
        currency: {
          adServerCurrency: AD_CONFIG.prebid.currency,
          granularityMultiplier: 1
        },
        userSync: {
          syncDelay: 3000,
          userIds: [{
            name: 'unifiedId',
            storage: { type: 'cookie', name: 'pbjs-unifiedid' }
          }]
        },
        // Floor prices by geo tier (prevents low-value bids)
        floors: {
          enforcement: {
            enforceJS: true, // Enforce in JavaScript
            floorDeals: false // Don't apply floor to deals
          },
          data: {
            currency: 'USD',
            schema: {
              fields: ['geoPath', 'mediaType']
            },
            values: {
              '*|banner': floorPrice // Apply floor to all banner ads
            }
          }
        }
      });
      
      console.log('[AdManager] Floor price set to $' + floorPrice + ' for Tier-' + this.geoTier);
      
      // Define ad units for header bidding
      const prebidUnits = this.buildPrebidUnits();
      pbjs.addAdUnits(prebidUnits);
      
      console.log('[AdManager] Prebid initialized with', prebidUnits.length, 'units');
    });
  }
  
  buildPrebidUnits() {
    const units = [];
    
    Object.values(AD_UNITS).forEach(unit => {
      if (!this.isPlacementAllowed(unit.id)) return;
      
      units.push({
        code: unit.id,
        mediaTypes: {
          banner: { sizes: unit.sizes }
        },
        bids: [
          {
            bidder: 'ix',
            params: { siteId: 'XXXXX' } // Replace with actual ID
          },
          {
            bidder: 'openx',
            params: { unit: 'XXXXX', delDomain: 'XXXXX-d.openx.net' }
          },
          {
            bidder: 'sovrn',
            params: { tagid: 'XXXXX' }
          },
          {
            bidder: 'pubmatic',
            params: { publisherId: 'XXXXX', adSlot: 'XXXXX' }
          }
        ]
      });
    });
    
    return units;
  }
  
  setupLazyLoading() {
    console.log('[AdManager] Setting up lazy loading with viewability tracking');
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.dataset.adLoaded) {
            const unitId = entry.target.dataset.unitId;
            if (unitId) {
              this.loadAdUnit(unitId);
              entry.target.dataset.adLoaded = 'true';
            }
          }
        });
      },
      {
        rootMargin: AD_CONFIG.lazyLoad.rootMargin,
        threshold: AD_CONFIG.lazyLoad.threshold
      }
    );
    
    // Setup viewability tracking
    if (AD_CONFIG.viewability.enabled) {
      this.setupViewabilityTracking();
    }
  }
  
  setupViewabilityTracking() {
    console.log('[AdManager] Setting up viewability tracking (50%+ for 1+ second)');
    
    this.viewabilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const unitId = entry.target.dataset.unitId;
          if (!unitId) return;
          
          if (entry.intersectionRatio >= AD_CONFIG.viewability.minViewablePercentage) {
            // Start viewability timer
            if (!entry.target.dataset.viewableStart) {
              entry.target.dataset.viewableStart = Date.now();
            }
            
            // Check if ad has been viewable for required time
            const viewableTime = Date.now() - parseInt(entry.target.dataset.viewableStart);
            if (viewableTime >= AD_CONFIG.viewability.minViewableTime) {
              if (!entry.target.dataset.viewabilityTracked) {
                this.trackViewableImpression(unitId);
                entry.target.dataset.viewabilityTracked = 'true';
                console.log('[AdManager] Viewable impression:', unitId, viewableTime + 'ms');
              }
            }
          } else {
            // Reset timer if ad becomes less visible
            delete entry.target.dataset.viewableStart;
          }
        });
      },
      {
        threshold: [0, 0.25, 0.50, 0.75, 1.0] // Track visibility percentages
      }
    );
    
    // Observe all loaded ad containers
    Object.values(AD_UNITS).forEach(unit => {
      const div = document.getElementById(unit.divId);
      if (div) {
        div.dataset.unitId = unit.id;
        this.viewabilityObserver.observe(div);
      }
    });
  }
  
  trackViewableImpression(unitId) {
    // Track to stats system
    if (typeof logEvent === 'function') {
      logEvent('viewable_impression', {
        unit: unitId,
        geoTier: this.geoTier,
        timestamp: Date.now()
      });
    }
    
    // Update stats counter
    const key = 'cfamm_viewable_' + unitId;
    const count = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (count + 1).toString());
  }
  
  setupRefresh() {
    console.log('[AdManager] Setting up navigation-based refresh (hashchange events)');
    
    // ENHANCED: Listen to hashchange events directly (no polling)
    window.addEventListener('hashchange', () => {
      console.log('[AdManager] Hash changed, refreshing visible ads');
      this.refreshOnNavigation();
    });
    
    // Hook into step changes via custom event (not polling)
    window.addEventListener('step-changed', (e) => {
      console.log('[AdManager] Step changed to', e.detail?.step, '- refreshing ads');
      this.refreshOnNavigation();
    });
    
    // Note: Sponsor fallback handled by Universal Ads (admension-ads.js) and index.html sponsor system
    // Removed setupSponsorFallback() to prevent duplicate tracking
  }
  
  // Sponsor fallback removed - handled by Universal Ads system to prevent conflicts
  
  loadInitialAds() {
    console.log('[AdManager] Loading initial ads');
    
    // Load above-the-fold ads immediately
    const priorityUnits = Object.values(AD_UNITS)
      .filter(u => u.priority <= 2 && this.isPlacementAllowed(u.id))
      .sort((a, b) => a.priority - b.priority);
    
    priorityUnits.forEach(unit => {
      const div = document.getElementById(unit.divId);
      if (div && this.isVisible(div)) {
        this.loadAdUnit(unit.id);
      }
    });
    
    // Setup lazy loading for other units
    if (this.observer) {
      Object.values(AD_UNITS).forEach(unit => {
        if (unit.priority > 2 && this.isPlacementAllowed(unit.id)) {
          const div = document.getElementById(unit.divId);
          if (div) {
            div.dataset.unitId = unit.id;
            this.observer.observe(div);
          }
        }
      });
    }
  }
  
  isPlacementAllowed(unitId) {
    // Check geo tier restrictions
    const unit = AD_UNITS[unitId];
    if (!unit) return false;
    
    const allowed = this.allowedPlacements.some(p => unitId.includes(p));
    if (!allowed) return false;
    
    // Check screen width restrictions
    if (unit.minWidth && window.innerWidth < unit.minWidth) {
      return false;
    }
    
    return true;
  }
  
  isVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }
  
  loadAdUnit(unitId) {
    if (this.loadedUnits.has(unitId)) {
      console.log('[AdManager] Unit already loaded:', unitId);
      return;
    }
    
    const unit = AD_UNITS[unitId];
    if (!unit) {
      console.error('[AdManager] Unknown unit:', unitId);
      return;
    }
    
    console.log('[AdManager] Loading unit:', unitId);
    
    const div = document.getElementById(unit.divId);
    if (!div) {
      console.error('[AdManager] Div not found:', unit.divId);
      return;
    }
    
    // Clear placeholder content
    div.innerHTML = '';
    
    if (AD_CONFIG.prebid.enabled && window.pbjs) {
      // Load with header bidding
      this.loadWithPrebid(unit, div);
    } else if (AD_CONFIG.adsense.enabled) {
      // Load AdSense directly
      this.loadAdSense Unit(unit, div);
    }
    
    this.loadedUnits.add(unitId);
    this.refreshCounts[unitId] = 0;
    
    // Track impression
    if (typeof apsMarkPlacement === 'function') {
      apsMarkPlacement(unitId);
    }
  }
  
  loadWithPrebid(unit, div) {
    const pbjs = window.pbjs;
    
    pbjs.que.push(() => {
      pbjs.requestBids({
        adUnitCodes: [unit.id],
        timeout: AD_CONFIG.prebid.timeout,
        bidsBackHandler: () => {
          pbjs.setTargetingForGPTAsync([unit.id]);
          this.loadAdSenseUnit(unit, div);
        }
      });
    });
  }
  
  loadAdSenseUnit(unit, div) {
    // Create AdSense ad
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.dataset.adClient = AD_CONFIG.adsense.client;
    ins.dataset.adSlot = unit.adsenseSlot;
    ins.dataset.adFormat = 'auto';
    ins.dataset.fullWidthResponsive = 'true';
    
    div.appendChild(ins);
    
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      console.log('[AdManager] AdSense unit pushed:', unit.id);
    } catch (e) {
      console.error('[AdManager] AdSense push error:', e);
    }
  }
  
  refreshOnNavigation() {
    if (!AD_CONFIG.refresh.onNavigation) return;
    
    // Detect current page from URL hash
    const currentPage = window.location.hash.replace('#', '') || 'home';
    console.log('[AdManager] Refreshing ads on navigation to:', currentPage);
    
    // Get units that should refresh on this page
    const refreshUnits = PAGE_REFRESH_MAP[currentPage] || [];
    
    if (refreshUnits.length === 0) {
      console.log('[AdManager] No refresh mapping for page:', currentPage);
      return;
    }
    
    // Refresh mapped units that are loaded and visible
    refreshUnits.forEach(unitId => {
      if (!this.loadedUnits.has(unitId)) return;
      
      const unit = AD_UNITS[unitId];
      if (!unit || !unit.refreshable) return;
      
      const count = this.refreshCounts[unitId] || 0;
      if (count >= AD_CONFIG.refresh.maxRefreshes) {
        console.log('[AdManager] Max refreshes reached for:', unitId);
        return;
      }
      
      const div = document.getElementById(unit.divId);
      if (div && this.isVisible(div)) {
        this.refreshUnit(unitId);
      }
    });
  }
  
  refreshUnit(unitId) {
    const unit = AD_UNITS[unitId];
    const div = document.getElementById(unit.divId);
    
    if (!div) return;
    
    console.log('[AdManager] Refreshing unit:', unitId);
    
    // Clear and reload
    div.innerHTML = '';
    
    if (AD_CONFIG.prebid.enabled && window.pbjs) {
      this.loadWithPrebid(unit, div);
    } else {
      this.loadAdSenseUnit(unit, div);
    }
    
    this.refreshCounts[unitId] = (this.refreshCounts[unitId] || 0) + 1;
    
    // Track refresh event
    if (typeof logEvent === 'function') {
      logEvent('ad_refresh', { unit: unitId, count: this.refreshCounts[unitId] });
    }
  }
  
  // Public API
  refresh(unitIds) {
    if (Array.isArray(unitIds)) {
      unitIds.forEach(id => this.refreshUnit(id));
    } else {
      this.refreshUnit(unitIds);
    }
  }
  
  getStats() {
    return {
      loadedUnits: Array.from(this.loadedUnits),
      refreshCounts: { ...this.refreshCounts },
      geoTier: this.geoTier,
      allowedPlacements: this.allowedPlacements
    };
  }
}

// ===== INITIALIZATION =====
let adManager = null;

function initAds() {
  console.log('[ADMENSION] Initializing ad system');
  
  // Wait for DOM and core systems
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAds);
    return;
  }
  
  // Create and initialize ad manager
  adManager = new AdManager();
  adManager.init();
  
  // Expose to window for debugging
  window.adManager = adManager;
  
  console.log('[ADMENSION] Ad system initialized');
}

// Auto-init
if (typeof window !== 'undefined') {
  initAds();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdManager, AD_CONFIG, AD_UNITS };
}
