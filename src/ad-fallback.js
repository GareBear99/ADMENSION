/**
 * ADMENSION Ad Fallback Waterfall v1.0
 *
 * Priority: Google AdSense (Tier-1 geos) → Fallback network (Tier-2/3 or AdSense blocked) → Placeholder
 *
 * SETUP:
 * 1. Sign up for a fallback network (AdsTerra, PropellerAds, or similar)
 * 2. Paste your fallback network script URL + zone ID below
 * 3. The waterfall auto-routes based on geo tier and AdSense availability
 */
(function(){
  'use strict';

  var CFG = {
    // AdSense publisher ID (already loaded globally)
    adsenseClient: 'ca-pub-5584590642779290',

    // Fallback ad network config — FILL IN AFTER SIGNING UP
    // Example: AdsTerra native banner
    fallback: {
      enabled: false,       // Set to true after configuring
      provider: 'adsterra', // 'adsterra', 'propellerads', or 'custom'
      scriptUrl: '',        // Paste fallback network script URL here
      zoneId: '',           // Paste zone/placement ID here
      bannerZoneId: '',     // Banner zone for anchor ads
      nativeZoneId: '',     // Native zone for in-content
    },

    // Geo-tier ad routing
    // Tier-1: Always use AdSense (highest CPM)
    // Tier-2: AdSense primary, fallback if unfilled
    // Tier-3: Fallback primary (preserves AdSense fill rate for premium geos)
    tierRouting: {
      1: 'adsense',           // Premium geos: always AdSense
      2: 'adsense-fallback',  // Mid geos: AdSense first, fallback if blocked/unfilled
      3: 'fallback-adsense',  // Low geos: fallback first (preserves AdSense quality)
    },

    // Timing
    adsenseTimeout: 3000,  // Wait 3s for AdSense before trying fallback
    checkInterval: 500,    // Check fill status every 500ms
  };

  // ---- State ----
  var state = {
    geoTier: 2,
    adsenseAvailable: false,
    fallbackLoaded: false,
    fillAttempts: {},
  };

  // ---- Detect geo tier ----
  function detectGeoTier(){
    // Use engagement system's geo cache if available
    try{
      var cache = JSON.parse(localStorage.getItem('admension.geo_cache') || '{}');
      if(cache.geoTier) { state.geoTier = cache.geoTier; return; }
    }catch(e){}

    // Fallback: timezone heuristic
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if(/America\/(New_York|Chicago|Denver|Los_Angeles|Toronto|Vancouver)/.test(tz) ||
       /Europe\/(London|Dublin)/.test(tz) || /Australia/.test(tz)) {
      state.geoTier = 1;
    } else if(/Europe\//.test(tz) || /Asia\/(Tokyo|Singapore|Hong_Kong|Seoul)/.test(tz)) {
      state.geoTier = 2;
    } else {
      state.geoTier = 3;
    }
  }

  // ---- Check if AdSense is available ----
  function checkAdSense(){
    state.adsenseAvailable = !!(window.adsbygoogle);
    return state.adsenseAvailable;
  }

  // ---- Load fallback network script ----
  function loadFallbackScript(callback){
    if(!CFG.fallback.enabled || !CFG.fallback.scriptUrl){
      if(callback) callback(false);
      return;
    }
    if(state.fallbackLoaded){
      if(callback) callback(true);
      return;
    }
    var s = document.createElement('script');
    s.src = CFG.fallback.scriptUrl;
    s.async = true;
    s.onload = function(){ state.fallbackLoaded = true; if(callback) callback(true); };
    s.onerror = function(){ if(callback) callback(false); };
    document.head.appendChild(s);
  }

  // ---- Render fallback ad in a container ----
  function renderFallbackAd(container, zoneId){
    if(!zoneId) return false;
    container.innerHTML = '';
    // Generic fallback: create a div for the fallback network to target
    var div = document.createElement('div');
    div.setAttribute('data-fallback-zone', zoneId);
    div.style.width = '100%';
    div.style.minHeight = container.style.minHeight || '90px';
    container.appendChild(div);
    // If fallback provider has a push API, use it
    try{
      if(CFG.fallback.provider === 'adsterra' && window.atOptions){
        // AdsTerra native
      } else if(CFG.fallback.provider === 'propellerads' && window._paN){
        // PropellerAds
      }
    }catch(e){}
    return true;
  }

  // ---- Check if an AdSense <ins> element filled ----
  function isAdFilled(ins){
    if(!ins) return false;
    var status = ins.getAttribute('data-ad-status');
    if(status === 'filled') return true;
    if(status === 'unfilled') return false;
    // Check for iframe (rendered ad)
    return ins.querySelector('iframe') !== null;
  }

  // ---- Waterfall: try AdSense → fallback → placeholder ----
  function waterfallFill(containerId, ins){
    var route = CFG.tierRouting[state.geoTier] || 'adsense-fallback';

    if(route === 'adsense'){
      // Tier-1: just use AdSense, no fallback
      return;
    }

    if(route === 'fallback-adsense' && CFG.fallback.enabled){
      // Tier-3: try fallback first
      var container = document.getElementById(containerId);
      if(container){
        loadFallbackScript(function(ok){
          if(ok) renderFallbackAd(container, CFG.fallback.bannerZoneId || CFG.fallback.zoneId);
        });
      }
      return;
    }

    // Tier-2 or default: wait for AdSense, fallback if unfilled
    if(!CFG.fallback.enabled) return;

    setTimeout(function(){
      if(!isAdFilled(ins)){
        var container = ins ? ins.parentElement : document.getElementById(containerId);
        if(container){
          console.log('[AdFallback] AdSense unfilled for #' + containerId + ', loading fallback');
          loadFallbackScript(function(ok){
            if(ok) renderFallbackAd(container, CFG.fallback.bannerZoneId || CFG.fallback.zoneId);
          });
        }
      }
    }, CFG.adsenseTimeout);
  }

  // ---- Hook into ad-loader placements ----
  function hookAdLoader(){
    // Monitor for new AdSense <ins> elements and apply waterfall
    var observer = new MutationObserver(function(mutations){
      mutations.forEach(function(m){
        m.addedNodes.forEach(function(node){
          if(node.nodeType === 1 && node.classList && node.classList.contains('adsbygoogle')){
            var container = node.parentElement;
            if(container && container.id){
              waterfallFill(container.id, node);
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ---- Initialize ----
  detectGeoTier();
  checkAdSense();
  hookAdLoader();

  console.log('[AdFallback] Waterfall v1.0 initialized | Geo Tier:', state.geoTier,
    '| Route:', CFG.tierRouting[state.geoTier],
    '| Fallback:', CFG.fallback.enabled ? 'configured' : 'not configured (set up in ad-fallback.js)');

  // Expose for debugging
  window.ADMENSION_AD_FALLBACK = {
    state: state,
    config: CFG,
    checkAdSense: checkAdSense,
    detectGeoTier: detectGeoTier,
  };
})();
