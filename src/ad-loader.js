/**
 * ADMENSION Manual Ad Placement System v3.0
 *
 * NO Auto Ads. Every placement is explicitly defined and validated.
 *
 * v3.0 — DYNAMIC DISCOVERY (2026-11-03)
 * v2.0 kept a hardcoded CONTAINER_MAP of 31 containers. Every new page or
 * section that was not in the map was silently skipped, so as content grew
 * the validation report filled with "skipped" entries and no ad ever
 * rendered on the new content. v3.0 discovers placements from the DOM
 * instead: any <div class="ad-container" id="..."> on the page is picked
 * up automatically. Adding a placement is now a markup-only change —
 * no JavaScript edit, no map entry, nothing to get out of sync.
 *
 * HOW TO ADD A PLACEMENT (no JS change needed):
 *   <div id="ad-<page>-<slot>" class="ad-container" style="min-height: 90px;"></div>
 * The loader infers type/format from the id suffix:
 *   -banner | -sticky | -bottom | -footer | -anchor  -> BANNER,    horizontal
 *   -rail | -left | -right                          -> VERTICAL,  vertical (desktop only)
 *   -tall | -in-content                             -> RECTANGLE, rectangle
 * Or be explicit with data attributes (these win over inference):
 *   <div class="ad-container" id="ad-x" data-ad-type="RECTANGLE"
 *        data-ad-format="rectangle" data-ad-page="home"></div>
 * Page attribution comes from data-ad-page, the legacy map, or the nearest
 * ancestor <section id="page-X">. Containers that match none of these are
 * reported as UNMAPPED in validation (visible, never silent).
 *
 * SETUP INSTRUCTIONS (slot IDs — DO NOT GUESS THESE):
 * 1. Go to AdSense → Ads → By ad unit → + New ad unit → Display ads
 * 2. Create THREE ad units:
 *    a) "ADMENSION Banner"    → Responsive → Horizontal → Copy slot ID
 *    b) "ADMENSION Rectangle" → Responsive → Square     → Copy slot ID
 *    c) "ADMENSION Vertical"  → Responsive → Vertical   → Copy slot ID
 * 3. Paste each slot ID into SLOT_IDS below. Until then they stay empty
 *    on purpose: the loader shows labelled placeholders and reports
 *    NO SLOT ID instead of rendering anything fake. Never invent a slot ID.
 *    NOTE (2026-11-03, verified in the AdSense account): ZERO ad units
 *    exist, so no slot IDs exist anywhere yet — that is a LATER step, not
 *    a blocker. Auto ads is ON for the site, so ads serve from the pub-ID
 *    script alone; these manual placements activate when Gary creates the
 *    three ad units and pastes the IDs here.
 * 4. Deploy. Ads will render in every discovered container of that type.
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

  // Create these 3 ad units in your AdSense dashboard, then paste the slot IDs.
  // DO NOT INVENT slot IDs: a wrong ID renders nothing and can flag the
  // account. Leave them empty until the real values are pasted in.
  // (2026-11-03: the AdSense account was checked — zero ad units exist, so
  // there are no IDs to fetch yet. Creating the units is a later step for
  // Gary; Auto ads serves from the pub-ID script in the meantime.)
  const SLOT_IDS = {
    BANNER:    '',  // Paste your "Display ads → Horizontal" slot ID here (e.g. '1234567890')
    RECTANGLE: '',  // Paste your "Display ads → Square" slot ID here
    VERTICAL:  '',  // Paste your "Display ads → Vertical" slot ID here
  };

  // When true, use auto-format <ins> elements even without slot IDs.
  // Set to false to use original placeholder + tracking system.
  const USE_AUTO_FORMAT_FALLBACK = false;

  // ============================================================
  // LEGACY CONTAINER MAP — DEPRECATED, kept as a fallback only
  // v3.0 discovers containers from the DOM. This map is consulted only
  // when a container carries no data attributes and its id matches no
  // known suffix pattern. Do NOT add new entries here — add the
  // container div to the page markup instead.
  // ============================================================
  const LEGACY_CONTAINER_MAP = {
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

    // VALLIS page
    'ad-vallis-banner':    { type: 'BANNER',    page: 'vallis', format: 'horizontal', sizes: '728x90' },
    'ad-vallis-rail':      { type: 'VERTICAL',  page: 'vallis', format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-vallis-tall':      { type: 'RECTANGLE', page: 'vallis', format: 'rectangle',  sizes: '300x600' },

    // Pools page
    'ad-pools-banner':     { type: 'BANNER',    page: 'pools',  format: 'horizontal', sizes: '728x90' },
    'ad-pools-rail':       { type: 'VERTICAL',  page: 'pools',  format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-pools-tall':       { type: 'RECTANGLE', page: 'pools',  format: 'rectangle',  sizes: '300x600' },

    // Interstitial page (THE money page — users spend 16+ seconds here)
    'ad-interstitial-sticky':  { type: 'BANNER',    page: 'interstitial', format: 'horizontal', sizes: '728x90' },
    'ad-interstitial-left':    { type: 'VERTICAL',  page: 'interstitial', format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-interstitial-right':   { type: 'VERTICAL',  page: 'interstitial', format: 'vertical',   sizes: '160x600', desktopOnly: true },
    'ad-interstitial-bottom':  { type: 'BANNER',    page: 'interstitial', format: 'horizontal', sizes: '728x90' },
  };

  // Id-suffix patterns used to infer type/format when a container has no
  // data attributes and no legacy map entry. Order matters: first match wins.
  const ID_PATTERNS = [
    { re: /-(banner|sticky|bottom|footer|anchor)$/, type: 'BANNER',    format: 'horizontal', sizes: '728x90',  desktopOnly: false },
    { re: /-(rail|left|right)$/,                    type: 'VERTICAL',  format: 'vertical',   sizes: '160x600', desktopOnly: true  },
    { re: /-(tall|in-content)$/,                   type: 'RECTANGLE', format: 'rectangle',  sizes: '300x250', desktopOnly: false },
  ];

  const VALID_TYPES = ['BANNER', 'RECTANGLE', 'VERTICAL'];

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
    discovered: [],  // [{ id, config }] from the last discovery pass
    unmapped: [],    // container ids that matched no config source
  };

  // ============================================================
  // DYNAMIC DISCOVERY (v3.0)
  // ============================================================

  /**
   * Resolve the ad config for one container element.
   * Priority: data attributes > legacy map > id-suffix inference.
   * Returns null when nothing can describe the container.
   */
  function resolveContainerConfig(el) {
    var id = el.id;
    var ds = el.dataset || {};

    // 1. Explicit data attributes (authoritative when present)
    if (ds.adType && VALID_TYPES.indexOf(ds.adType.toUpperCase()) !== -1) {
      return {
        type: ds.adType.toUpperCase(),
        page: ds.adPage || pageFromAncestor(el),
        format: ds.adFormat || formatForType(ds.adType.toUpperCase()),
        sizes: ds.adSizes || '',
        desktopOnly: ds.adDesktopOnly === 'true' || ds.adDesktopOnly === '1',
      };
    }

    // 2. Legacy map (deprecated fallback)
    if (LEGACY_CONTAINER_MAP[id]) {
      return LEGACY_CONTAINER_MAP[id];
    }

    // 3. Id-suffix inference
    for (var i = 0; i < ID_PATTERNS.length; i++) {
      var p = ID_PATTERNS[i];
      if (p.re.test(id)) {
        return {
          type: p.type,
          page: pageFromAncestor(el),
          format: p.format,
          sizes: p.sizes,
          desktopOnly: p.desktopOnly,
        };
      }
    }

    return null;
  }

  function formatForType(type) {
    return type === 'BANNER' ? 'horizontal' : type === 'VERTICAL' ? 'vertical' : 'rectangle';
  }

  /**
   * Page attribution: nearest ancestor <section id="page-X">, else 'unknown'.
   * Keeps SPA navigation refresh working without a hardcoded page list.
   */
  function pageFromAncestor(el) {
    var node = el;
    while (node && node !== document.body) {
      if (node.id && node.id.indexOf('page-') === 0) {
        return node.id.slice('page-'.length);
      }
      node = node.parentElement;
    }
    return 'unknown';
  }

  /**
   * Discover every ad container currently in the DOM.
   * Duplicate ids are warned about and counted once (first wins) — a
   * duplicate id is a markup bug, and silently double-placing would
   * corrupt the placement state keyed by id.
   */
  function discoverContainers() {
    var found = [];
    var unmapped = [];
    var seen = {};

    var nodes = document.querySelectorAll('.ad-container[id]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var id = el.id;

      if (seen[id]) {
        console.warn('[ADMENSION AdLoader] ⚠️ Duplicate ad container id #' + id + ' — ignoring the repeat. Fix the markup so ids are unique.');
        continue;
      }
      seen[id] = true;

      var config = resolveContainerConfig(el);
      if (!config) {
        unmapped.push(id);
        continue;
      }
      found.push({ id: id, el: el, config: config });
    }

    state.discovered = found;
    state.unmapped = unmapped;
    return { containers: found, unmapped: unmapped };
  }

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

    // Single source of truth for the VALLIS injector (VALLIS/admension-ads.js),
    // which reads these instead of keeping its own empty slot table.
    window.ADMENSION_SLOT_IDS = SLOT_IDS;
    window.ADMENSION_ADSENSE_CLIENT = ADSENSE_CLIENT;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDomReady);
    } else {
      onDomReady();
    }
  }

  function onDomReady() {
    console.log('[ADMENSION AdLoader] DOM ready — discovering ad containers...');

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
    var discovery = discoverContainers();
    var placed = 0;
    var skipped = 0;

    if (discovery.unmapped.length > 0) {
      console.warn(
        '[ADMENSION AdLoader] ⚠️ ' + discovery.unmapped.length +
        ' ad container(s) could not be mapped to an ad type (no data-ad-type, ' +
        'no legacy map entry, no recognised id suffix): ' + discovery.unmapped.join(', ') +
        '. Add data-ad-type="BANNER|RECTANGLE|VERTICAL" to the container div.'
      );
    }

    discovery.containers.forEach(function(item) {
      var containerId = item.id;
      var container = item.el;
      var config = item.config;

      // Skip desktop-only placements on mobile
      if (config.desktopOnly && window.innerWidth < 980) {
        skipped++;
        state.placements[containerId] = { status: 'skipped-mobile', ins: null, attempts: 0, rendered: false };
        return;
      }

      var slotId = SLOT_IDS[config.type];

      if (!slotId && !USE_AUTO_FORMAT_FALLBACK) {
        // No slot ID and auto-format disabled
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

    console.log('[ADMENSION AdLoader] Scan complete: ' + placed + ' placed, ' + skipped + ' skipped (mobile)' +
      (discovery.unmapped.length ? ', ' + discovery.unmapped.length + ' unmapped' : '') +
      ' — ' + discovery.containers.length + ' containers discovered');
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
    if (slotId) {
      ins.setAttribute('data-ad-slot', slotId);
    }

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
      var config = configForContainer(containerId);
      if (container && config && placement.attempts < CONFIG.retryAttempts) {
        setTimeout(function() { placeAd(containerId, container, config, placement.slotId, placement.attempts + 1); }, CONFIG.retryDelay);
      }
    } else {
      placement.status = ins.clientHeight > 0 ? 'unknown-with-height' : 'not-rendered';
    }
  }

  /** Look up the config for a container id from the last discovery pass. */
  function configForContainer(containerId) {
    for (var i = 0; i < state.discovered.length; i++) {
      if (state.discovered[i].id === containerId) return state.discovered[i].config;
    }
    return LEGACY_CONTAINER_MAP[containerId] || null;
  }

  /**
   * Run validation across ALL discovered placements and generate a report
   */
  function validateAllPlacements() {
    console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffff;');
    console.log('%c  ADMENSION AD VALIDATION REPORT', 'color: #00ffff; font-weight: bold; font-size: 14px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffff;');

    var report = { total: 0, rendered: 0, unfilled: 0, failed: 0, noSlotId: 0, skipped: 0, unmapped: state.unmapped.length, details: [] };

    state.discovered.forEach(function(item) {
      var containerId = item.id;
      var config = item.config;
      report.total++;
      var placement = state.placements[containerId];

      if (!placement) {
        report.skipped++;
        return;
      }

      if (placement.status === 'no-slot-id') {
        report.noSlotId++;
        console.log('%c  ⬜ ' + containerId + ' — NO SLOT ID (' + config.type + ')', 'color: #888;');
      } else if (placement.status === 'skipped-mobile') {
        report.skipped++;
        console.log('%c  📱 ' + containerId + ' — SKIPPED (mobile, desktop-only) (' + config.type + ')', 'color: #888;');
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

    state.unmapped.forEach(function(containerId) {
      console.log('%c  ❓ ' + containerId + ' — UNMAPPED (no ad type could be inferred)', 'color: #ff00ff;');
    });

    var scoreColor = report.rendered > 0 ? '#00ff00' : report.noSlotId === report.total ? '#888' : '#ff0000';
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffff;');
    console.log('%c  RENDERED: ' + report.rendered + '/' + report.total, 'color: ' + scoreColor + '; font-weight: bold;');
    if (report.noSlotId > 0) console.log('%c  NO SLOT ID: ' + report.noSlotId + ' (configure SLOT_IDS in ad-loader.js)', 'color: #ff6600;');
    if (report.unfilled > 0) console.log('%c  UNFILLED: ' + report.unfilled + ' (AdSense had no ads — normal for new sites)', 'color: #ff6600;');
    if (report.failed > 0) console.log('%c  FAILED: ' + report.failed, 'color: #ff0000;');
    if (report.unmapped > 0) console.log('%c  UNMAPPED: ' + report.unmapped + ' (add data-ad-type to the container div)', 'color: #ff00ff;');
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
  // NOTE (2026-11-03, AdSense review): re-placing ads on SPA navigation
  // without a full reload is a policy grey area (see ADSENSE_COMPLIANCE.md
  // recommendation). It is kept for now because the SPA has no other way
  // to show ads on a new section; the compliance decision is Gary's.
  function refreshAdsForPage(pageName) {
    console.log('[ADMENSION AdLoader] Refreshing ads for page: ' + pageName);

    // Re-discover: SPA section swaps can add/remove containers.
    var discovery = discoverContainers();

    discovery.containers.forEach(function(item) {
      var containerId = item.id;
      var config = item.config;
      if (config.page !== pageName) return;

      var container = item.el;
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
    version: '3.0.0',
    diagnose: function() {
      console.log('\n=== ADMENSION AD LOADER v3.0 DIAGNOSTIC ===');
      console.log('Publisher ID:', ADSENSE_CLIENT);
      console.log('AdSense Ready:', state.adsenseReady ? '✅' : '❌');
      console.log('AdSense Blocked:', state.adsenseBlocked ? '🚫 YES' : '✅ NO');
      console.log('Configured:', state.configured ? '✅' : '❌');
      console.log('Slot IDs:', JSON.stringify(SLOT_IDS));
      console.log('Discovered containers:', state.discovered.length);
      console.log('Unmapped containers:', JSON.stringify(state.unmapped));
      console.log('');
      return validateAllPlacements();
    },
    getState: function() {
      return { adsenseReady: state.adsenseReady, adsenseBlocked: state.adsenseBlocked, configured: state.configured, slotIds: SLOT_IDS, placements: state.placements, discovered: state.discovered.map(function(d) { return d.id; }), unmapped: state.unmapped, legacyMapSize: Object.keys(LEGACY_CONTAINER_MAP).length };
    },
    refreshPage: refreshAdsForPage,
    refreshSlot: function(containerId) {
      var container = document.getElementById(containerId);
      var config = configForContainer(containerId);
      var slotId = config ? SLOT_IDS[config.type] : null;
      if (container && config && slotId) placeAd(containerId, container, config, slotId, 1);
    },
    isRendered: function(containerId) { var p = state.placements[containerId]; return p ? p.rendered : false; },
    discover: discoverContainers,
    config: CONFIG,
    containerMap: LEGACY_CONTAINER_MAP,
    slotIds: SLOT_IDS,
    adsenseClient: ADSENSE_CLIENT,
  };

  // Boot
  init();
  console.log('[ADMENSION AdLoader] v3.0 loaded (dynamic discovery). Run ADMENSION_AD_LOADER.diagnose() in console for full status.');

})();
