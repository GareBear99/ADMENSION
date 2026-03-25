/**
 * ADMENSION Ad Placements for VALLIS Pages
 * Injects: bottom sticky anchor + left/right side stickies (desktop only)
 * Matches the ADMENSION main site style.
 */
(function(){
  'use strict';
  var CLIENT = 'ca-pub-5584590642779290';
  var isDesktop = window.innerWidth >= 1100;

  // ---- Inject CSS ----
  var css = document.createElement('style');
  css.textContent = [
    'body{ padding-bottom: 80px !important; }',

    /* Bottom anchor */
    '.adm-anchor{',
    '  position:fixed;left:0;right:0;bottom:0;z-index:9999;',
    '  padding:10px 10px 12px;',
    '  background:linear-gradient(to top,rgba(11,10,16,.94),rgba(11,10,16,.55));',
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

    /* Side stickies */
    '.adm-side{',
    '  position:fixed;top:120px;z-index:9998;width:200px;',
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
    '  border:none;background:rgba(255,255,255,.07);color:#fff;',
    '  width:26px;height:26px;border-radius:10px;cursor:pointer;font-size:12px;',
    '}',
    '.adm-side-body{',
    '  padding:10px;min-height:160px;display:flex;align-items:center;justify-content:center;',
    '  color:rgba(255,255,255,.45);font-size:12px;',
    '  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;',
    '}',
    '.adm-side-tab{',
    '  position:fixed;top:160px;z-index:9998;',
    '}',
    '.adm-side-tab-left{left:10px;}',
    '.adm-side-tab-right{right:10px;}',
    '.adm-side-tab button{',
    '  border:1px solid rgba(255,255,255,.12);background:rgba(12,12,16,.78);',
    '  color:#fff;padding:10px 12px;border-radius:14px;cursor:pointer;',
    '  box-shadow:0 10px 30px rgba(0,0,0,.45);font-size:12px;',
    '}',
    '@media(max-width:1100px){',
    '  .adm-side,.adm-side-tab{display:none !important;}',
    '}',
  ].join('\n');
  document.head.appendChild(css);

  // ---- Helper: create ad ins element ----
  function makeAdIns(){
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', CLIENT);
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
    var ins = makeAdIns();
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
    if(lBody){ var li = makeAdIns(); lBody.innerHTML=''; lBody.appendChild(li); pushAd(); }
    if(rBody){ var ri = makeAdIns(); rBody.innerHTML=''; rBody.appendChild(ri); pushAd(); }

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
})();
