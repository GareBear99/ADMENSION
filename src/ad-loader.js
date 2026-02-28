/**
 * ADMENSION Manual Ad Placement System v2.0
 * 
 * NO Auto Ads. Every placement is explicitly defined and validated.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to AdSense → Ads → By ad unit → + New ad unit → Display ads
 * 2. Create THREE ad units:
 *    a) "ADMENSION Banner"    → Responsive → Horizontal → Copy slot ID
 *    b) "ADMENSION Rectangle" → Responsive → Square     → Copy slot ID
 *    c) "ADMENSION Vertical"  → Responsive → Vertical   → Copy slot ID
 * 3. Paste each slot ID into SLOT_IDS below
 * 4. Deploy. Ads will render in every container mapped to that type.
 * 
 * VALIDATION: After page load, open DevTools console and run:
 *   ADMENSION_AD_LOADER.diagnose()
 */

(function() {
  'use strict';

  // ============================================================
  // CONFIGURATION — FILL IN YOUR REAL ADSENSE SLOT IDS HERE
  // ============================================================
  const ADSENSE_CLIENT = 'ca-pub-5584590642779290';

  // Create these 3 ad units in your AdSense dashboard, then paste the slot IDs:
  const SLOT_IDS = {
    BANNER:    '',  // Paste your "Display ads → Horizontal" slot ID here (e.g. '1234567890')
    RECTANGLE: '',  // Paste your "Display ads → Square" slot ID here
    VERTICAL:  '',  // Paste your "Display ads → Vertical" slot ID here
  };

  // ============================================================
  // AD CONTAINER MAP — Every placement on the site
  // Maps container div ID → ad type (BANNER, RECTANGLE, or VERTICAL)
  // ============================================================
  const CONTAINER_MAP = {
    // Homepage
    'ad-top-banner':       { type: 'BANNER',    page: 'home',   format: 'horizontal', sizes: '728x90' },
    'ad-rail-right':       { type: 'VERTICAL',  page: 'home',   format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-in-content-tall':  { type: 'RECTANGLE', page: 'home',   format: 'rectangle',  sizes: '300x250' },
    'ad-footer-banner':    { type: 'BANNER',    page: 'home',   format: 'horizontal', sizes: '728x90' },

    // Stats page
    'ad-stats-banner':     { type: 'BANNER',    page: 'stats',  format: 'horizontal', sizes: '728x90' },
    'ad-stats-tall':       { type: 'RECTANGLE', page: 'stats',  format: 'rectangle',  sizes: '300x600' },
    'ad-stats-rail':       { type: 'VERTICAL',  page: 'stats',  format: 'vertical',   sizes: '160x600', desktopOnly: true },

    // Create page
    'ad-create-banner':    { type: 'BANNER',    page: 'create', format: 'horizontal', sizes: '728x90' },
    'ad-create-rail':      { type: 'VERTICAL',  page: 'create', format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-create-tall':      { type: 'RECTANGLE', page: 'create', format: 'rectangle',  sizes: '300x600' },
    'ad-create-footer':    { type: 'BANNER',    page: 'create', format: 'horizontal', sizes: '728x90' },

    // Manage page
    'ad-manage-banner':    { type: 'BANNER',    page: 'manage', format: 'horizontal', sizes: '728x90' },
    'ad-manage-rail':      { type: 'VERTICAL',  page: 'manage', format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-manage-tall':      { type: 'RECTANGLE', page: 'manage', format: 'rectangle',  sizes: '300x600' },
    'ad-manage-footer':    { type: 'BANNER',    page: 'manage', format: 'horizontal', sizes: '728x90' },

    // Docs page
    'ad-docs-banner':      { type: 'BANNER',    page: 'docs',   format: 'horizontal', sizes: '728x90' },
    'ad-docs-rail':        { type: 'VERTICAL',  page: 'docs',   format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-docs-tall':        { type: 'RECTANGLE', page: 'docs',   format: 'rectangle',  sizes: '300x600' },

    // Admin page
    'ad-admin-banner':     { type: 'BANNER',    page: 'admin',  format: 'horizontal', sizes: '728x90' },
    'ad-admin-rail':       { type: 'VERTICAL',  page: 'admin',  format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-admin-tall':       { type: 'RECTANGLE', page: 'admin',  format: 'rectangle',  sizes: '300x600' },

    // Interstitial page (THE money page — users spend 16+ seconds here)
    'ad-interstitial-sticky':  { type: 'BANNER',    page: 'interstitial', format: 'horizontal', sizes: '728x90' },
    'ad-interstitial-left':    { type: 'VERTICAL',  page: 'interstitial', format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-interstitial-right':   { type: 'VERTICAL',  page: 'interstitial', format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-interstitial-bottom':  { type: 'BANNER',    page: 'interstitial', format: 'horizontal', sizes: '728x90' },
  };

  // ============================================================
  // LOADER SETTINGS
  // ============================================================
  const CONFIG = {
    lazyLoadMargin: '300px',    // Start loading ads this far before viewport
    renderTimeout: 5000,        // Time to wait for ad to render before marking failed
    retryAttempts: 2,           // Retry failed placements
    retryDelay: 3000,           // Delay between retries
    showPlaceholders: true,     // Show placeholder boxes when slot IDs not configured
    validateAfterMs: 6000,      // Run validation this many ms after page load
  };

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    adsenseReady: false,
    adsenseBlocked: false,
    configured: false,
    placements: {},  // containerId → { status, ins, attempts, rendered }
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    // Check if any slot IDs are configured
    state.configured = Object.values(SLOT_IDS).some(id => id && id.length > 0);

    if (!state.configured) {
      console.warn(
        '%c[ADMENSION AdLoader] ⚠️ NO SLOT IDs CONFIGURED\n' +
        'Ads will NOT render until you create ad units in AdSense and paste slot IDs into src/ad-loader.js.\n' +
        'See SLOT_IDS at the top of the file.',
        'color: #ff6600; font-weight: bold; font-size: 14px;'
      );
    } else {
      console.log('%c[ADMENSION AdLoader] ✅ Slot IDs configured', 'color: #00ff00; font-weight: bold;');
      console.log('  BANNER:   ', SLOT_IDS.BANNER || '(not set)');
      console.log('  RECTANGLE:', SLOT_IDS.RECTANGLE || '(not set)');
      console.log('  VERTICAL: ', SLOT_IDS.VERTICAL || '(not set)');
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDomReady);
    } else {
      onDomReady();
    }
  }

  function onDomReady() {
    console.log('[ADMENSION AdLoader] DOM ready — scanning for ad containers...');

    // Wait for AdSense script to be available
    waitForAdSense(function() {
      scanAndPlaceAds();

      // Run validation after ads have had time to render
      setTimeout(validateAllPlacements, CONFIG.validateAfterMs);
    });
  }

  // ============================================================
  // ADSENSE DETECTION
  // ============================================================
  function waitForAdSense(callback) {
    var checks = 0;
    var maxChecks = 50; // 10 seconds

    var interval = setInterval(function() {
      checks++;

      if (window.adsbygoogle) {
        clearInterval(interval);
        state.adsenseReady = true;
        console.log('[ADMENSION AdLoader] ✅ AdSense script detected');
        callback();
        return;
      }

      if (checks >= maxChecks) {
        clearInterval(interval);
        state.adsenseBlocked = true;
        console.error(
          '%c[ADMENSION AdLoader] ❌ AdSense script NOT detected after 10s.\n' +
          'Possible causes: ad blocker, script removed, network error.',
          'color: #ff0000; font-weight: bold;'
        );
        callback(); // Still run to show placeholders
      }
    }, 200);
  }

  // ============================================================
  // AD PLACEMENT ENGINE
  // ============================================================
  function scanAndPlaceAds() {
    var containerIds = Object.keys(CONTAINER_MAP);
    var placed = 0;
    var skipped = 0;

    containerIds.forEach(function(containerId) {
      var container = document.getElementById(containerId);
      var config = CONTAINER_MAP[containerId];

      if (!container) {
        return;
      }

      // Skip desktop-only placements on mobile
      if (config.desktopOnly && window.innerWidth < 980) {
        skipped++;
        return;
      }

      var slotId = SLOT_IDS[config.type];

      if (!slotId) {
        // No slot ID configured for this type
        if (CONFIG.showPlaceholders) {
          renderPlaceholder(container, containerId, config);
        }
        state.placements[containerId] = { status: 'no-slot-id', ins: null, attempts: 0, rendered: false };
        return;
      }

      // Place the ad using lazy loading or immediate
      if (isNearViewport(container)) {
        placeAd(containerId, container, config, slotId, 1);
        placed++;
      } else {
        setupLazyLoad(containerId, container, config, slotId);
        placed++;
      }
    });

    console.log('[ADMENSION AdLoader] Scan complete: ' + placed + ' placed, ' + skipped + ' skipped (mobile)');
  }

  /**
   * Place a single AdSense ad unit into a container
   */
  function placeAd(containerId, container, config, slotId, attempt) {
    attempt = attempt || 1;

    console.log('[ADMENSION AdLoader] Placing ad: #' + containerId + ' (' + config.type + ', slot=' + slotId + ', attempt=' + attempt + ')');

    // Clear container
    container.innerHTML = '';

    // Create the <ins> element — this is the core AdSense manual placement
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', ADSENSE_CLIENT);
    ins.setAttribute('data-ad-slot', slotId);

    // Set format based on ad type
    switch (config.format) {
      case 'horizontal':
        ins.setAttribute('data-ad-format', 'horizontal');
        ins.setAttribute('data-full-width-responsive', 'true');
        break;
      case 'vertical':
        ins.setAttribute('data-ad-format', 'vertical');
        break;
      case 'rectangle':
        ins.setAttribute('data-ad-format', 'rectangle');
        ins.setAttribute('data-full-width-responsive', 'true');
        break;
      default:
        ins.setAttribute('data-ad-format', 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');
    }

    container.appendChild(ins);

    // Track placement state
    state.placements[containerId] = {
      status: 'pending',
      ins: ins,
      attempts: attempt,
      rendered: false,
      slotId: slotId,
      type: config.type,
      page: config.page,
      placedAt: Date.now(),
    };

    // Push to AdSense queue
    if (state.adsenseReady && !state.adsenseBlocked) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('[ADMENSION AdLoader] ✅ adsbygoogle.push() for #' + containerId);
      } catch (err) {
        console.error('[ADMENSION AdLoader] ❌ adsbygoogle.push() failed for #' + containerId + ':', err.message);
        state.placements[containerId].status = 'push-error';

        if (attempt < CONFIG.retryAttempts) {
          setTimeout(function() { placeAd(containerId, container, config, slotId, attempt + 1); }, CONFIG.retryDelay);
        }
      }
    } else {
      state.placements[containerId].status = 'adsense-not-ready';
    }

    // Check render status after timeout
    setTimeout(function() { checkRenderStatus(containerId); }, CONFIG.renderTimeout);
  }

  // ============================================================
  // RENDER VALIDATION
  // ============================================================
  function checkRenderStatus(containerId) {
    var placement = state.placements[containerId];
    if (!placement || !placement.ins) return;

    var ins = placement.ins;
    var hasIframe = ins.querySelector('iframe') !== null;
    var adStatus = ins.getAttribute('data-ad-status');
    var filled = adStatus === 'filled';
    var unfilled = adStatus === 'unfilled';

    if (filled || hasIframe) {
      placement.status = 'rendered';
      placement.rendered = true;
      console.log('%c[ADMENSION AdLoader] ✅ AD RENDERED: #' + containerId + ' (' + placement.type + ')', 'color: #00ff00;');
    } else if (unfilled) {
      placement.status = 'unfilled';
      console.warn('[ADMENSION AdLoader] ⚠️ AD UNFILLED: #' + containerId + ' — AdSense had no ad to show');

      // Retry if attempts remain
      var container = document.getElementById(containerId);
      var config = CONTAINER_MAP[containerId];
      if (container && config && placement.attempts < CONFIG.retryAttempts) {
        setTimeout(function() { placeAd(containerId, container, config, placement.slotId, placement.attempts + 1); }, CONFIG.retryDelay);
      }
    } else {
      placement.status = ins.clientHeight > 0 ? 'unknown-with-height' : 'not-rendered';
    }
  }

  /**
   * Run validation across ALL placements and generate a report
   */
  function validateAllPlacements() {
    console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffff;');
    console.log('%c  ADMENSION AD VALIDATION REPORT', 'color: #00ffff; font-weight: bold; font-size: 14px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffff;');

    var report = { total: 0, rendered: 0, unfilled: 0, failed: 0, noSlotId: 0, skipped: 0, details: [] };

    Object.keys(CONTAINER_MAP).forEach(function(containerId) {
      var config = CONTAINER_MAP[containerId];
      report.total++;
      var placement = state.placements[containerId];

      if (!placement) {
        report.skipped++;
        return;
      }

      if (placement.status === 'no-slot-id') {
        report.noSlotId++;
        console.log('%c  ⬜ ' + containerId + ' — NO SLOT ID (' + config.type + ')', 'color: #888;');
      } else if (placement.rendered) {
        report.rendered++;
        console.log('%c  ✅ ' + containerId + ' — RENDERED (' + config.type + ')', 'color: #00ff00;');
      } else if (placement.status === 'unfilled') {
        report.unfilled++;
        console.log('%c  ⚠️  ' + containerId + ' — UNFILLED (' + config.type + ')', 'color: #ff6600;');
      } else {
        report.failed++;
        console.log('%c  ❌ ' + containerId + ' — FAILED: ' + placement.status + ' (' + config.type + ')', 'color: #ff0000;');
      }

      report.details.push({ container: containerId, type: config.type, page: config.page, status: placement.status, rendered: placement.rendered });
    });

    var scoreColor = report.rendered > 0 ? '#00ff00' : report.noSlotId === report.total ? '#888' : '#ff0000';
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffff;');
    console.log('%c  RENDERED: ' + report.rendered + '/' + report.total, 'color: ' + scoreColor + '; font-weight: bold;');
    if (report.noSlotId > 0) console.log('%c  NO SLOT ID: ' + report.noSlotId + ' (configure SLOT_IDS in ad-loader.js)', 'color: #ff6600;');
    if (report.unfilled > 0) console.log('%c  UNFILLED: ' + report.unfilled + ' (AdSense had no ads — normal for new sites)', 'color: #ff6600;');
    if (report.failed > 0) console.log('%c  FAILED: ' + report.failed, 'color: #ff0000;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #00ffff;');

    updateDebugPill(report);
    return report;
  }

  // ============================================================
  // LAZY LOADING
  // ============================================================
  function setupLazyLoad(containerId, container, config, slotId) {
    if (!('IntersectionObserver' in window)) {
      placeAd(containerId, container, config, slotId, 1);
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          observer.unobserve(container);
          placeAd(containerId, container, config, slotId, 1);
        }
      });
    }, { rootMargin: CONFIG.lazyLoadMargin });

    observer.observe(container);
  }

  function isNearViewport(el) {
    var rect = el.getBoundingClientRect();
    var margin = parseInt(CONFIG.lazyLoadMargin) || 300;
    return rect.top < (window.innerHeight + margin) && rect.bottom > -margin;
  }

  // ============================================================
  // PLACEHOLDER RENDERING (when slot IDs not configured)
  // ============================================================
  function renderPlaceholder(container, containerId, config) {
    container.innerHTML =
      '<div style="' +
        'width:100%;min-height:' + (container.style.minHeight || '90px') + ';' +
        'background:rgba(255,255,255,0.02);border:1px dashed rgba(255,215,0,0.25);' +
        'border-radius:8px;display:flex;align-items:center;justify-content:center;' +
        'color:rgba(255,215,0,0.5);font-family:monospace;font-size:11px;padding:12px;text-align:center;' +
      '">' +
        '<div>' +
          '<div style="margin-bottom:6px">⚙️ Ad Slot: ' + config.type + '</div>' +
          '<div style="opacity:0.6">' + config.sizes + ' · ' + containerId + '</div>' +
          '<div style="opacity:0.4;margin-top:4px">Configure SLOT_IDS in ad-loader.js</div>' +
        '</div>' +
      '</div>';
  }

  // ============================================================
  // PAGE NAVIGATION REFRESH
  // ============================================================
  function refreshAdsForPage(pageName) {
    console.log('[ADMENSION AdLoader] Refreshing ads for page: ' + pageName);

    Object.keys(CONTAINER_MAP).forEach(function(containerId) {
      var config = CONTAINER_MAP[containerId];
      if (config.page !== pageName) return;

      var container = document.getElementById(containerId);
      if (!container) return;

      var slotId = SLOT_IDS[config.type];
      if (!slotId) return;

      if (config.desktopOnly && window.innerWidth < 980) return;

      if (isNearViewport(container)) {
        placeAd(containerId, container, config, slotId, 1);
      }
    });
  }

  window.addEventListener('hashchange', function() {
    var page = (window.location.hash.replace('#', '') || 'home').replace('page-', '');
    refreshAdsForPage(page);
  });

  window.addEventListener('popstate', function() {
    var params = new URLSearchParams(window.location.search);
    var page = params.get('page') || 'home';
    refreshAdsForPage(page);
  });

  // ============================================================
  // DEBUG PILL UPDATE
  // ============================================================
  function updateDebugPill(report) {
    var pill = document.getElementById('pillDebug');
    if (!pill) return;

    if (!state.configured) {
      pill.textContent = '⚙️ Ads: No slot IDs';
      pill.style.background = 'rgba(255,165,0,.15)';
      pill.style.borderColor = 'rgba(255,165,0,.4)';
    } else if (report.rendered > 0) {
      pill.textContent = '✅ Ads: ' + report.rendered + '/' + (report.total - report.skipped) + ' live';
      pill.style.background = 'rgba(34,197,94,.15)';
      pill.style.borderColor = 'rgba(34,197,94,.4)';
    } else if (state.adsenseBlocked) {
      pill.textContent = '🚫 Ads: AdSense blocked';
      pill.style.background = 'rgba(239,68,68,.15)';
      pill.style.borderColor = 'rgba(239,68,68,.4)';
    } else {
      pill.textContent = '⚠️ Ads: 0/' + (report.total - report.skipped) + ' rendered';
      pill.style.background = 'rgba(245,158,11,.15)';
      pill.style.borderColor = 'rgba(245,158,11,.4)';
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.ADMENSION_AD_LOADER = {
    version: '2.0.0',
    diagnose: function() {
      console.log('\n=== ADMENSION AD LOADER v2.0 DIAGNOSTIC ===');
      console.log('Publisher ID:', ADSENSE_CLIENT);
      console.log('AdSense Ready:', state.adsenseReady ? '✅' : '❌');
      console.log('AdSense Blocked:', state.adsenseBlocked ? '🚫 YES' : '✅ NO');
      console.log('Configured:', state.configured ? '✅' : '❌');
      console.log('Slot IDs:', JSON.stringify(SLOT_IDS));
      console.log('');
      return validateAllPlacements();
    },
    getState: function() {
      return { adsenseReady: state.adsenseReady, adsenseBlocked: state.adsenseBlocked, configured: state.configured, slotIds: SLOT_IDS, placements: state.placements, containerCount: Object.keys(CONTAINER_MAP).length };
    },
    refreshPage: refreshAdsForPage,
    refreshSlot: function(containerId) {
      var container = document.getElementById(containerId);
      var config = CONTAINER_MAP[containerId];
      var slotId = config ? SLOT_IDS[config.type] : null;
      if (container && config && slotId) placeAd(containerId, container, config, slotId, 1);
    },
    isRendered: function(containerId) { var p = state.placements[containerId]; return p ? p.rendered : false; },
    config: CONFIG,
    containerMap: CONTAINER_MAP,
    slotIds: SLOT_IDS,
    adsenseClient: ADSENSE_CLIENT,
  };

  // Boot
  init();
  console.log('[ADMENSION AdLoader] v2.0 loaded. Run ADMENSION_AD_LOADER.diagnose() in console for full status.');

})();
