/**
 * ADMENSION Bulletproof Ad Loader
 * Guarantees ads load with multiple fallback layers
 * No matter what fails, something renders
 */

(function() {
  'use strict';

  // AdSense Publisher ID
  const ADSENSE_CLIENT = 'ca-pub-5584590642779290';
  
  // Configuration
  const CONFIG = {
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds between retries
    loadTimeout: 10000, // 10 second timeout for AdSense script
    lazyLoadThreshold: 200, // pixels from viewport
    enableLazyLoad: true,
    showPlaceholders: true,
  };

  // Ad slot definitions - EVERY ad placement in the app
  const AD_SLOTS = {
    // Homepage
    'ad-top-banner': { size: [[728, 90], [320, 50]], responsive: true },
    'ad-rail-right': { size: [[160, 600], [120, 600]], desktop: true },
    'ad-in-content-tall': { size: [[300, 250], [336, 280]], responsive: true },
    'ad-footer-banner': { size: [[728, 90], [320, 50]], responsive: true },
    
    // Stats page
    'ad-stats-banner': { size: [[728, 90], [320, 50]], responsive: true },
    'ad-stats-tall': { size: [[300, 600], [300, 250]], responsive: true },
    'ad-stats-rail': { size: [[160, 600]], desktop: true },
    
    // Create page
    'ad-create-banner': { size: [[728, 90], [320, 50]], responsive: true },
    'ad-create-rail': { size: [[160, 600]], desktop: true },
    
    // Manage page
    'ad-manage-banner': { size: [[728, 90], [320, 50]], responsive: true },
    'ad-manage-rail': { size: [[160, 600]], desktop: true },
    
    // Docs page
    'ad-docs-banner': { size: [[728, 90], [320, 50]], responsive: true },
    'ad-docs-rail': { size: [[160, 600]], desktop: true },
    
    // Admin page
    'ad-admin-rail': { size: [[160, 600]], desktop: true },
    'ad-admin-tall': { size: [[300, 600]], responsive: true },
    
    // Anchor (sticky footer)
    'ad-anchor': { size: [[728, 90], [320, 50]], responsive: true, sticky: true },
  };

  // State tracking
  const state = {
    adsenseLoaded: false,
    adsenseBlocked: false,
    loadAttempts: 0,
    initializedSlots: new Set(),
    failedSlots: new Set(),
    observers: new Map(),
  };

  /**
   * Initialize ad system
   */
  function init() {
    console.log('[AdLoader] Initializing bulletproof ad system...');
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initAds());
    } else {
      initAds();
    }
  }

  /**
   * Main initialization
   */
  function initAds() {
    console.log('[AdLoader] DOM ready, starting ad initialization...');
    
    // Check if AdSense script is already loaded
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      console.log('[AdLoader] AdSense already loaded');
      state.adsenseLoaded = true;
      initAllSlots();
    } else {
      // Wait for AdSense to load with timeout
      waitForAdSense();
    }
  }

  /**
   * Wait for AdSense script to load
   */
  function waitForAdSense() {
    console.log('[AdLoader] Waiting for AdSense script...');
    
    let attempts = 0;
    const maxAttempts = 50; // 10 seconds total (50 * 200ms)
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        clearInterval(checkInterval);
        console.log('[AdLoader] AdSense loaded successfully');
        state.adsenseLoaded = true;
        initAllSlots();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.warn('[AdLoader] AdSense failed to load - using fallbacks');
        state.adsenseBlocked = true;
        initAllSlots(); // Still init with placeholders
      }
    }, 200);
  }

  /**
   * Initialize all ad slots
   */
  function initAllSlots() {
    console.log('[AdLoader] Initializing all ad slots...');
    
    Object.keys(AD_SLOTS).forEach(slotId => {
      const container = document.getElementById(slotId);
      if (container) {
        initSlot(slotId, container);
      }
    });
  }

  /**
   * Initialize a single ad slot
   */
  function initSlot(slotId, container) {
    // Skip if already initialized
    if (state.initializedSlots.has(slotId)) {
      console.log(`[AdLoader] Slot ${slotId} already initialized`);
      return;
    }

    const slotConfig = AD_SLOTS[slotId];
    if (!slotConfig) {
      console.warn(`[AdLoader] No config for slot ${slotId}`);
      return;
    }

    // Check desktop-only slots
    if (slotConfig.desktop && window.innerWidth < 980) {
      console.log(`[AdLoader] Skipping desktop-only slot ${slotId} on mobile`);
      return;
    }

    console.log(`[AdLoader] Initializing slot: ${slotId}`);

    // Clear existing content
    container.innerHTML = '';
    container.style.minHeight = slotConfig.size[0][1] + 'px';

    if (CONFIG.enableLazyLoad && !isInViewport(container)) {
      // Lazy load - wait until near viewport
      setupLazyLoad(slotId, container);
    } else {
      // Load immediately
      loadSlot(slotId, container);
    }
  }

  /**
   * Load ad slot with AdSense or fallback
   */
  function loadSlot(slotId, container) {
    state.initializedSlots.add(slotId);
    
    if (state.adsenseLoaded && !state.adsenseBlocked) {
      // Load real AdSense ad
      loadAdSenseAd(slotId, container);
    } else {
      // Load fallback placeholder
      loadFallbackAd(slotId, container);
    }
  }

  /**
   * Load AdSense ad unit
   */
  function loadAdSenseAd(slotId, container) {
    console.log(`[AdLoader] Loading AdSense ad for ${slotId}`);
    
    try {
      const slotConfig = AD_SLOTS[slotId];
      
      // Create AdSense ins element
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', ADSENSE_CLIENT);
      ins.setAttribute('data-ad-slot', generateSlotId(slotId)); // Auto-generate slot IDs
      
      // Set ad format based on configuration
      if (slotConfig.responsive) {
        ins.setAttribute('data-ad-format', 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');
      } else {
        const [width, height] = slotConfig.size[0];
        ins.style.width = width + 'px';
        ins.style.height = height + 'px';
      }

      // Add to container
      container.appendChild(ins);

      // Push to AdSense queue with retry
      pushAdWithRetry(ins, slotId, container);
      
    } catch (error) {
      console.error(`[AdLoader] Error loading AdSense for ${slotId}:`, error);
      state.failedSlots.add(slotId);
      loadFallbackAd(slotId, container);
    }
  }

  /**
   * Push ad to AdSense queue with retry logic
   */
  function pushAdWithRetry(ins, slotId, container, attempt = 1) {
    try {
      (adsbygoogle = window.adsbygoogle || []).push({});
      console.log(`[AdLoader] AdSense push successful for ${slotId}`);
      
      // Check if ad loaded after delay
      setTimeout(() => {
        if (!isAdLoaded(ins)) {
          console.warn(`[AdLoader] Ad didn't render for ${slotId}, attempt ${attempt}`);
          if (attempt < CONFIG.maxRetries) {
            // Retry
            container.innerHTML = '';
            setTimeout(() => {
              loadSlot(slotId, container);
            }, CONFIG.retryDelay);
          } else {
            // Give up, show fallback
            console.error(`[AdLoader] Max retries reached for ${slotId}`);
            state.failedSlots.add(slotId);
            loadFallbackAd(slotId, container);
          }
        }
      }, 3000);
      
    } catch (error) {
      console.error(`[AdLoader] AdSense push error for ${slotId}:`, error);
      if (attempt < CONFIG.maxRetries) {
        setTimeout(() => {
          pushAdWithRetry(ins, slotId, container, attempt + 1);
        }, CONFIG.retryDelay);
      } else {
        state.failedSlots.add(slotId);
        loadFallbackAd(slotId, container);
      }
    }
  }

  /**
   * Check if ad actually loaded
   */
  function isAdLoaded(ins) {
    // Check if ins element has content or AdSense classes
    return ins.getAttribute('data-ad-status') === 'filled' ||
           ins.querySelector('iframe') !== null ||
           ins.clientHeight > 0;
  }

  /**
   * Load fallback placeholder ad
   */
  function loadFallbackAd(slotId, container) {
    if (!CONFIG.showPlaceholders) {
      container.style.display = 'none';
      return;
    }

    console.log(`[AdLoader] Loading fallback for ${slotId}`);
    
    const slotConfig = AD_SLOTS[slotId];
    const [width, height] = slotConfig.size[0];
    
    container.innerHTML = `
      <div style="
        width: 100%;
        min-height: ${height}px;
        background: rgba(255,255,255,0.03);
        border: 1px dashed rgba(255,255,255,0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255,255,255,0.4);
        font-family: monospace;
        font-size: 12px;
        padding: 20px;
        text-align: center;
      ">
        <div>
          <div style="margin-bottom: 8px; opacity: 0.6;">📢</div>
          <div>Ad Space</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.5;">${width}×${height}</div>
        </div>
      </div>
    `;
    
    // Track as placeholder
    if (window.markAd) {
      try {
        window.markAd(`${slotId}_placeholder`);
      } catch (e) {}
    }
  }

  /**
   * Setup lazy loading for ad slot
   */
  function setupLazyLoad(slotId, container) {
    console.log(`[AdLoader] Setting up lazy load for ${slotId}`);
    
    if (!('IntersectionObserver' in window)) {
      // No IntersectionObserver support, load immediately
      loadSlot(slotId, container);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log(`[AdLoader] ${slotId} entering viewport, loading...`);
          observer.unobserve(container);
          state.observers.delete(slotId);
          loadSlot(slotId, container);
        }
      });
    }, {
      rootMargin: `${CONFIG.lazyLoadThreshold}px`
    });

    observer.observe(container);
    state.observers.set(slotId, observer);
  }

  /**
   * Check if element is in viewport
   */
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top < (window.innerHeight + CONFIG.lazyLoadThreshold) &&
      rect.bottom > -CONFIG.lazyLoadThreshold
    );
  }

  /**
   * Generate consistent slot ID from container ID
   * This creates unique ad slot IDs for AdSense
   */
  function generateSlotId(containerId) {
    // Create a hash-like number from string
    let hash = 0;
    for (let i = 0; i < containerId.length; i++) {
      hash = ((hash << 5) - hash) + containerId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Return as 10-digit string
    return Math.abs(hash).toString().padStart(10, '0');
  }

  /**
   * Refresh specific ad slot (called when page changes)
   */
  function refreshSlot(slotId) {
    const container = document.getElementById(slotId);
    if (!container) return;

    console.log(`[AdLoader] Refreshing slot ${slotId}`);
    
    // Remove from initialized set to allow re-init
    state.initializedSlots.delete(slotId);
    state.failedSlots.delete(slotId);
    
    // Cancel lazy load observer if exists
    const observer = state.observers.get(slotId);
    if (observer) {
      observer.disconnect();
      state.observers.delete(slotId);
    }
    
    // Re-initialize
    initSlot(slotId, container);
  }

  /**
   * Refresh all visible ads (called on page navigation)
   */
  function refreshAllAds() {
    console.log('[AdLoader] Refreshing all ads...');
    
    // Clear state
    state.initializedSlots.clear();
    state.failedSlots.clear();
    
    // Disconnect all observers
    state.observers.forEach(observer => observer.disconnect());
    state.observers.clear();
    
    // Re-initialize all slots
    initAllSlots();
  }

  /**
   * Get system status
   */
  function getStatus() {
    return {
      adsenseLoaded: state.adsenseLoaded,
      adsenseBlocked: state.adsenseBlocked,
      loadAttempts: state.loadAttempts,
      initializedSlots: Array.from(state.initializedSlots),
      failedSlots: Array.from(state.failedSlots),
      totalSlots: Object.keys(AD_SLOTS).length,
    };
  }

  /**
   * Diagnostic function for console
   */
  function diagnose() {
    const status = getStatus();
    console.group('📢 Ad Loader Status');
    console.log('AdSense Loaded:', status.adsenseLoaded ? '✅' : '❌');
    console.log('AdSense Blocked:', status.adsenseBlocked ? '🚫 YES' : '✅ NO');
    console.log('Initialized Slots:', status.initializedSlots.length, '/', status.totalSlots);
    console.log('Failed Slots:', status.failedSlots.length);
    console.log('Active Slots:', status.initializedSlots);
    console.log('Failed Slots:', Array.from(status.failedSlots));
    console.groupEnd();
    return status;
  }

  // Export API to window
  window.ADMENSION_AD_LOADER = {
    init,
    refreshSlot,
    refreshAllAds,
    getStatus,
    diagnose,
    config: CONFIG,
    slots: AD_SLOTS,
  };

  // Auto-initialize
  init();

  console.log('[AdLoader] System ready. Use ADMENSION_AD_LOADER.diagnose() for status');

})();
