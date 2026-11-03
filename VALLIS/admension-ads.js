/**
 * ADMENSION Ad Placements for VALLIS Pages v2.0
 * Injects: bottom sticky anchor + left/right side stickies (desktop only)
 * Matches the ADMENSION main site style.
 *
 * v2.0 changes (2026-11-03, AdSense cleanup):
 * - SLOT IDS: the injected <ins> tags now carry real data-ad-slot values
 *   when they exist. Slots are read from window.ADMENSION_SLOT_IDS (the
 *   single source of truth published by src/ad-loader.js on the main
 *   site) and fall back to the local SLOT_IDS below. DO NOT INVENT slot
 *   IDs: leave them empty until the real values are pasted in. Without a
 *   slot the <ins> is still created (auto-format) and a console warning
 *   is logged, exactly as before — but nothing fake is rendered.
 * - PATH RESOLUTION: this file is now loaded by a path-helper snippet on
 *   each VALLIS page (see the snippet: it resolves the script URL from
 *   location.pathname, so it works on GitHub Pages /ADMENSION/... and on
 *   a root-hosted copy alike). The EVE chatbot base is derived from
 *   location.pathname too — the old document.currentScript trick broke
 *   for dynamically injected scripts.
 * - DOM READY: the injector now waits for DOMContentLoaded when the
 *   document is still loading, so it is safe to inject at any point.
 * - GUARD renamed to __ADMENSION_VALLIS_ADS_LOADED (it previously shared
 *   the __ADMENSION_UNIVERSAL_ADS_LOADED name with the retired
 *   universal-ads system, which could suppress this file entirely).
 * - PRIVACY LINKS: any <a data-privacy-link> on the page has its href
 *   normalised to <base>/privacy-policy.html, so VALLIS pages link the
 *   policy correctly on both hosts.
 */
(function(){
  'use strict';
  if (window.__ADMENSION_VALLIS_ADS_LOADED) return;
  window.__ADMENSION_VALLIS_ADS_LOADED = true;
  var CLIENT = 'ca-pub-5584590642779290';

  // ---- Slot IDs: single source of truth is window.ADMENSION_SLOT_IDS
  // (published by src/ad-loader.js). Local fallback stays EMPTY on
  // purpose — never invent a slot ID; fill these in only from the
  // AdSense dashboard once the real ad units exist.
  var SLOT_IDS = {
    ANCHOR: '',  // VALLIS anchor bar — paste the BANNER slot ID here when it exists
    SIDE:   '',  // VALLIS side stickies — paste the VERTICAL slot ID here when it exists
  };
  var shared = window.ADMENSION_SLOT_IDS || {};
  var anchorSlotId = shared.BANNER || SLOT_IDS.ANCHOR || '';
  var sideSlotId = shared.VERTICAL || SLOT_IDS.SIDE || '';
  if (!anchorSlotId || !sideSlotId) {
    console.warn('[ADMENSION VALLIS Ads] ⚠️ No slot IDs configured — VALLIS manual <ins> tags are created without data-ad-slot and will not fill as manual units. Auto ads (pub ID only) still serves on this page. Create the ad units in AdSense and paste the IDs into src/ad-loader.js SLOT_IDS (single source of truth).');
  }

  // ---- Site base: everything before "/VALLIS/" in the page URL.
  // GitHub Pages: "/ADMENSION". Root-hosted copy (Netlify): "".
  function siteBase() {
    var p = location.pathname || '';
    var i = p.indexOf('/VALLIS/');
    return i >= 0 ? p.slice(0, i) : '';
  }

  // ---- Ensure the AdSense Auto ads script is present ----
  // Most VALLIS pages already carry the <script async src="...adsbygoogle.js">
  // tag, but the injector must not depend on that: any page that loads this
  // file gets the Auto ads code (pub ID only — no slot IDs needed, because
  // Auto ads is ON for the site and zero ad units exist in the account).
  // Idempotent: skips when the script tag (or the queue) already exists.
  function ensureAdSenseScript(){
    try {
      if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CLIENT;
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    } catch (e) {}
  }

  function run() {
    var isDesktop = window.innerWidth >= 1100;

    ensureAdSenseScript();

    // ---- Normalise privacy links on this page ----
    try {
      var base = siteBase();
      var links = document.querySelectorAll('a[data-privacy-link]');
      for (var li = 0; li < links.length; li++) {
        links[li].setAttribute('href', base + '/privacy-policy.html');
      }
    } catch (e) {}

  // ---- Inject CSS ----
  var css = document.createElement('style');
  css.textContent = [
    'body{ padding-bottom: 80px !important; }',

    /* Bottom anchor — matches ADMENSION main site .anchor styles */
    '.adm-anchor{',
    '  position:fixed;left:0;right:0;bottom:0;z-index:9999;',
    '  padding:10px 10px 12px;',
    '  background:linear-gradient(to top,rgba(11,10,16,.92),rgba(11,10,16,.55));',
    '  backdrop-filter:blur(10px);',
    '  border-top:1px solid rgba(255,255,255,.10);',
    '}',
    '.adm-anchor-inner{',
    '  max-width:1100px;margin:0 auto;display:flex;gap:10px;align-items:center;',
    '}',
    '.adm-anchor-left{flex:1;}',
    '.adm-anchor-title{font-size:12px;font-weight:950;color:rgba(255,255,255,.9);}',
    '.adm-anchor-meta{font-size:11px;color:rgba(255,255,255,.45);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}',
    '.adm-anchor-ad{flex:2;min-height:60px;border:1px dashed rgba(255,255,255,.20);border-radius:16px;',
    '  display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.45);',
    '  background:rgba(255,255,255,.03);overflow:hidden;}',
    '.adm-anchor-ad ins{width:100%;}',

    /* Side stickies — matches ADMENSION .sideSticky / .sideSponsorWrap */
    '.adm-side{',
    '  position:fixed;top:104px;z-index:9998;width:200px;',
    '  border:1px solid rgba(255,255,255,.10);',
    '  background:rgba(12,12,16,.86);',
    '  backdrop-filter:blur(10px);',
    '  border-radius:14px;',
    '  box-shadow:0 10px 30px rgba(0,0,0,.45);',
    '  overflow:hidden;',
    '}',
    '.adm-side-left{left:16px;}',
    '.adm-side-right{right:16px;}',
    '.adm-side-head{',
    '  display:flex;align-items:center;justify-content:space-between;',
    '  padding:10px 10px 8px;border-bottom:1px solid rgba(255,255,255,.08);',
    '}',
    '.adm-side-title{font-size:12px;color:rgba(255,255,255,.9);}',
    '.adm-side-hide{',
    '  border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.35);color:rgba(255,255,255,.85);',
    '  width:auto;padding:4px 8px;border-radius:10px;cursor:pointer;font-size:11px;',
    '}',
    '.adm-side-body{',
    '  padding:10px;min-height:160px;display:flex;align-items:center;justify-content:center;',
    '  color:rgba(255,255,255,.45);font-size:12px;',
    '  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;',
    '}',
    '.adm-side-tab{',
    '  position:fixed;top:140px;z-index:9998;',
    '}',
    '.adm-side-tab-left{left:10px;}',
    '.adm-side-tab-right{right:10px;}',
    '.adm-side-tab button{',
    '  border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.35);',
    '  color:rgba(255,255,255,.85);padding:10px 12px;border-radius:999px;cursor:pointer;',
    '  box-shadow:0 10px 30px rgba(0,0,0,.45);font-size:12px;',
    '}',
    '@media(max-width:1100px){',
    '  .adm-side,.adm-side-tab{display:none !important;}',
    '}',
  ].join('\n');
  document.head.appendChild(css);

  // ---- Helper: create ad ins element ----
  // slotId is '' until real AdSense slot IDs exist — the <ins> is still
  // created (auto-format) so the layout is identical before/after.
  function makeAdIns(slotId){
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', CLIENT);
    if (slotId) {
      ins.setAttribute('data-ad-slot', slotId);
    }
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    return ins;
  }
  function pushAd(){
    try{ (window.adsbygoogle = window.adsbygoogle || []).push({}); }catch(e){}
  }

  // ---- Bottom Anchor ----
  var anchor = document.createElement('div');
  anchor.className = 'adm-anchor';
  anchor.innerHTML =
    '<div class="adm-anchor-inner">' +
      '<div class="adm-anchor-left">' +
        '<div class="adm-anchor-title">Sponsored · ADMENSION</div>' +
        '<div class="adm-anchor-meta">VALLIS Ecosystem</div>' +
      '</div>' +
      '<div class="adm-anchor-ad" id="adm-vallis-anchor-ad"></div>' +
    '</div>';
  document.body.appendChild(anchor);

  var anchorSlot = document.getElementById('adm-vallis-anchor-ad');
  if(anchorSlot){
    var ins = makeAdIns(anchorSlotId);
    anchorSlot.appendChild(ins);
    pushAd();
  }

  // ---- Side Stickies (desktop only) ----
  if(isDesktop){
    // Left
    var sideL = document.createElement('div');
    sideL.className = 'adm-side adm-side-left';
    sideL.id = 'adm-side-left';
    sideL.innerHTML =
      '<div class="adm-side-head">' +
        '<span class="adm-side-title"><b>Sponsored</b></span>' +
        '<button class="adm-side-hide" id="adm-hide-left" title="Hide">✕</button>' +
      '</div>' +
      '<div class="adm-side-body" id="adm-side-left-body">Ad · Left</div>';
    document.body.appendChild(sideL);

    // Left tab (show button when hidden)
    var tabL = document.createElement('div');
    tabL.className = 'adm-side-tab adm-side-tab-left';
    tabL.id = 'adm-tab-left';
    tabL.style.display = 'none';
    tabL.innerHTML = '<button id="adm-show-left">◂ Show</button>';
    document.body.appendChild(tabL);

    // Right
    var sideR = document.createElement('div');
    sideR.className = 'adm-side adm-side-right';
    sideR.id = 'adm-side-right';
    sideR.innerHTML =
      '<div class="adm-side-head">' +
        '<span class="adm-side-title"><b>Sponsored</b></span>' +
        '<button class="adm-side-hide" id="adm-hide-right" title="Hide">✕</button>' +
      '</div>' +
      '<div class="adm-side-body" id="adm-side-right-body">Ad · Right</div>';
    document.body.appendChild(sideR);

    // Right tab
    var tabR = document.createElement('div');
    tabR.className = 'adm-side-tab adm-side-tab-right';
    tabR.id = 'adm-tab-right';
    tabR.style.display = 'none';
    tabR.innerHTML = '<button id="adm-show-right">Show ▸</button>';
    document.body.appendChild(tabR);

    // Fill with ad ins
    var lBody = document.getElementById('adm-side-left-body');
    var rBody = document.getElementById('adm-side-right-body');
    if(lBody){ var li = makeAdIns(sideSlotId); lBody.innerHTML=''; lBody.appendChild(li); pushAd(); }
    if(rBody){ var ri = makeAdIns(sideSlotId); rBody.innerHTML=''; rBody.appendChild(ri); pushAd(); }

    // Hide/show handlers
    document.getElementById('adm-hide-left').onclick = function(){
      sideL.style.display='none'; tabL.style.display='block';
    };
    document.getElementById('adm-show-left').onclick = function(){
      sideL.style.display='block'; tabL.style.display='none';
    };
    document.getElementById('adm-hide-right').onclick = function(){
      sideR.style.display='none'; tabR.style.display='block';
    };
    document.getElementById('adm-show-right').onclick = function(){
      sideR.style.display='block'; tabR.style.display='none';
    };
  }

  // ---- Track ad impressions (mirrors ADMENSION markAd system) ----
  function trackImpression(slot){
    try{
      var page = location.pathname.split('/').pop().replace('.html','') || 'index';
      var sid = localStorage.getItem('cfamm.sid') || 'unknown';
      var device = window.innerWidth < 980 ? 'mobile' : 'desktop';
      // Use validator if available (shared with ADMENSION SPA)
      if(window.ADMENSION_AD_VALIDATOR){
        window.ADMENSION_AD_VALIDATOR.logAd(slot, page, sid, device, {}, document.referrer);
      } else {
        // Fallback: log to localStorage
        var ads = JSON.parse(localStorage.getItem('cfamm.ads') || '[]');
        ads.push({ t: Date.now(), slot: slot, page: page, device: device, step: 1 });
        localStorage.setItem('cfamm.ads', JSON.stringify(ads));
      }
    }catch(e){}
  }
  // Track all placements we just created
  trackImpression('vallis_anchor');
  if(isDesktop){
    trackImpression('vallis_side_left');
    trackImpression('vallis_side_right');
  }

  // ---- Load shared EVE chatbot on every VALLIS/wiki page ----
  // Base is derived from the page URL (see siteBase above), not from
  // document.currentScript — this file is injected dynamically now, and
  // currentScript is null for dynamically injected scripts.
  try{
    if (!window.__ADMENSION_EVE_LOADED) {
      var eve = document.createElement('script');
      eve.src = siteBase() + '/VALLIS/eve-chatbot.js';
      document.body.appendChild(eve);
    }
  }catch(e){}
  }

  // Run now if the DOM is ready, otherwise wait — this file is injected
  // dynamically by the path-helper snippet and may execute before <body>.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Public API (for debugging and for the future slot-ID fill-in)
  window.ADMENSION_VALLIS_ADS = {
    version: '2.0.0',
    slotIds: { anchor: anchorSlotId, side: sideSlotId },
    client: CLIENT,
  };
})();
