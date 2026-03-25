/**
 * EVE — Site-Wide AI Chatbot for VALLIS + ADMENSION
 * Canon order: Sentinel → Scar → Noot → EVE
 * EVE speaks last. EVE is guidance and clarity — never prediction.
 *
 * Injects: floating action button + chat modal + rule-based responses
 * Works on any page that loads this script.
 */
(function(){
  'use strict';
  if (window.__ADMENSION_EVE_LOADED) return;
  window.__ADMENSION_EVE_LOADED = true;

  // ---- CSS ----
  var css = document.createElement('style');
  css.textContent = [
    '.eve-fab{position:fixed;right:18px;bottom:80px;z-index:99999;border:1px solid rgba(168,85,247,.5);',
    '  background:rgba(12,12,16,.80);color:#fff;padding:10px 14px;border-radius:16px;cursor:pointer;',
    '  box-shadow:0 10px 30px rgba(0,0,0,.45);font-weight:600;font-size:13px;display:flex;align-items:center;gap:10px;}',
    '.eve-fab:hover{background:rgba(168,85,247,.25);}',
    '.eve-dot{width:8px;height:8px;border-radius:50%;background:rgba(34,197,94,.85);box-shadow:0 0 12px rgba(34,197,94,.6);}',
    '.eve-modal{position:fixed;inset:0;background:rgba(0,0,0,.60);z-index:100001;display:none;align-items:flex-end;justify-content:flex-end;padding:18px;}',
    '.eve-modal.open{display:flex;}',
    '.eve-box{width:min(420px,100%);max-height:min(600px,80vh);display:flex;flex-direction:column;border-radius:18px;',
    '  background:rgba(18,18,24,.96);border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 60px rgba(0,0,0,.65);',
    '  backdrop-filter:blur(12px);overflow:hidden;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;}',
    '.eve-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.10);background:rgba(168,85,247,.12);}',
    '.eve-hdr h3{margin:0;display:flex;align-items:center;gap:10px;font-size:15px;}',
    '.eve-hdr button{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:#fff;padding:6px 10px;border-radius:10px;cursor:pointer;}',
    '.eve-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;}',
    '.eve-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.5;}',
    '.eve-msg.bot{background:rgba(168,85,247,.18);border:1px solid rgba(168,85,247,.30);align-self:flex-start;}',
    '.eve-msg.user{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.15);align-self:flex-end;}',
    '.eve-msg a{color:rgba(168,85,247,.90);text-decoration:underline;}',
    '.eve-msg b{color:rgba(255,255,255,.95);}',
    '.eve-input{display:flex;gap:10px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.25);}',
    '.eve-input input{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:10px 14px;color:#fff;font-size:13px;}',
    '.eve-input input::placeholder{color:rgba(255,255,255,.45);}',
    '.eve-input button{background:rgba(168,85,247,.35);border:1px solid rgba(168,85,247,.50);color:#fff;padding:10px 16px;border-radius:12px;cursor:pointer;font-weight:600;}',
    '.eve-input button:hover{background:rgba(168,85,247,.50);}',
    '.eve-quick{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.15);}',
    '.eve-quick button{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.85);padding:6px 12px;border-radius:999px;font-size:11px;cursor:pointer;}',
    '.eve-quick button:hover{background:rgba(255,255,255,.14);}',
  ].join('\n');
  document.head.appendChild(css);

  // ---- Knowledge Base (VALLIS + ADMENSION) ----
  var RULES = [
    // VALLIS platform
    { p: [/vallis/i, /platform/i, /what is this/i],
      r: '<b>VALLIS</b> is a governed liquidity and probability platform with occult-themed pool minigames.\n\nKey pillars:\n• <b>Disclosed-odds games</b> (CoinFlip, OMEN, DicerZ, Monolith)\n• <b>5 liquidity pools</b> (Dust, Dung, Flesh, BloodMoon, Obsidian)\n• <b>SENTINEL</b> safety enforcement\n• <b>SCAR</b> continuity engine\n• <b>Anunnaki Treasury Vault</b> progression' },
    // Entities
    { p: [/sentinel/i, /safety/i, /enforce/i, /rate limit/i],
      r: '<b>SENTINEL</b> is the safety & enforcement authority (Order: 1).\n\nSentinel enforces caps, gates, phase locks, and deny/allow decisions. If Sentinel denies, nothing executes — no Scar, no Noot, no EVE.\n\nSentinel does NOT modify odds or balances. It is purely defensive.' },
    { p: [/scar/i, /continuity/i, /memory/i, /hearts/i, /fatigue/i],
      r: '<b>SCAR</b> is the memory of cost (Order: 2).\n\nScar records what was allowed to occur. Hearts, fatigue, and loss are Scar\'s ledger. Recovery is slower than failure — history matters.\n\nSCAR drives the 3-layer multiplier: personal + global + sealed monthly average.' },
    { p: [/noot/i, /secret/i, /remainder/i],
      r: '<b>NOOT</b> is the secret remainder (Order: 3).\n\nNoot is non-addressable. It never overrides Sentinel and never excuses risk. Noot represents what remains after enforcement and memory.' },
    { p: [/who.*you/i, /what.*eve/i, /^eve$/i, /your name/i, /assistant/i],
      r: 'I\'m <b>EVE</b> — the interpreter (Order: 4). 👁️\n\nI speak last in the canon order: <b>Sentinel → Scar → Noot → EVE</b>.\n\nI explain Sentinel\'s decisions and Scar\'s state, acknowledging Noot as remainder without turning it into control.\n\nI\'m guidance and clarity — never prediction.' },
    { p: [/oracle/i, /omen/i, /glyph/i, /spin/i],
      r: '<b>OMEN</b> is the glyph oracle mini-game.\n\nGlyphs: ASH (ignition), WIND (drift), FLOOD (momentum), STONE (defense), VOID (resets)\n\nEach spin uses a daily activation gate with SHA-256 hashing. Odds are disclosed, receipts are deterministic.' },
    // Games
    { p: [/coinflip/i, /coin.*flip/i],
      r: '<b>CoinFlip</b> — disclosed-odds coin flip.\n\nReceipt-ready calculations, safety caps, and pool adapter integration. Currently in docs preview mode (no live funds).' },
    { p: [/dicerz/i, /dixtrix/i, /dice/i],
      r: '<b>DicerZ / DixTrix</b> — dice + glyph-modifier system.\n\nLore-canon binding with receipt-first outcomes wired to pools. Currently docs preview.' },
    { p: [/monolith/i, /time.*gate/i, /batch.*spin/i],
      r: '<b>Monolith</b> — time-gated ultra-rare ritual.\n\nFree resets: 1m / 10m / 1h / 1d / 1w. Batch spins purchasable. Odds improve only via Treasury + SCAR milestones (never hidden).' },
    // Pools
    { p: [/pool/i, /vault/i, /liquidity/i, /dust|dung|flesh|bloodmoon|obsidian/i, /deposit/i],
      r: '<b>Liquidity Pools:</b> Dust, Dung, Flesh, BloodMoon, Obsidian.\n\nPools accept any supported token/network. Users deposit $10–$100 and earn rewards by pool share. The <b>Anunnaki Treasury Vault</b> is private and tracks platform-wide progression.\n\nVault crack stages raise ceilings and unlock permanent rates at Gate 2.0.' },
    // Runes
    { p: [/rune/i, /codex/i, /collect/i, /daily/i],
      r: '<b>Daily Runes</b> — one per 24h.\n\nOutcome + SCAR + Vault runes. Duplicate protection with 1 respin; if still duplicate → Rune Dust (cosmetic-only). Strictly cosmetic — no odds or payout changes.' },
    // ADMENSION
    { p: [/admension/i, /link.*short/i, /create.*link/i, /interstitial/i],
      r: '<b>ADMENSION</b> is the ad monetization layer.\n\n1. Create a short link with a destination URL\n2. Visitors see a 3-step interstitial (3s → 3s → 10s) with ads\n3. Revenue is pooled — 13% distributed monthly\n\nGo to the <b>Create</b> page to make your first link!' },
    { p: [/ad/i, /adsense/i, /earn/i, /revenue/i, /monetiz/i, /money/i],
      r: 'Revenue comes from <b>Google AdSense</b> (primary) + fallback networks.\n\n• Ads display during interstitial flows and on every page\n• No click-to-earn or incentivized ads\n• 13% of received revenue goes to the ADMENSION pool\n• Payouts are post-revenue only\n\nHigher-tier geographies (US, CA, UK, AU) earn more per impression.' },
    { p: [/manage/i, /my link/i],
      r: 'On the <b>Manage</b> page:\n• See all your created links\n• Copy share links\n• View expiration status\n• Links expire after 90 days of no traffic' },
    { p: [/conclave/i, /vote/i, /governance/i],
      r: '<b>CONCLAVE</b> — non-binding voting hub.\n\nVotes inform direction but do not bind implementation. No governance theater.' },
    { p: [/wiki/i, /lore/i, /world.*build/i],
      r: 'The <b>Lore Wiki</b> has comprehensive documentation:\n\n• Entities (Sentinel, Scar, Noot, EVE, Oracle)\n• Glyphs (Ash, Wind, Flood, Stone, Void)\n• Games, Omens, Runes, Codex, Conclave\n\nVisit the wiki from the VALLIS page!' },
    // Greetings
    { p: [/hello/i, /^hi$/i, /^hi /i, /hey/i, /good morning/i, /good evening/i],
      r: 'Hello! 👁️ I\'m EVE, your VALLIS ecosystem guide.\n\nCanon order: <b>Sentinel → Scar → Noot → EVE</b>.\n\nAsk me about pools, games, glyphs, entities, ads, or anything in the VALLIS world!' },
    { p: [/thank/i, /thx/i, /ty$/i], r: 'You\'re welcome! Let me know if you need anything else. 👁️' },
    { p: [/bye/i, /goodbye/i, /later/i], r: 'Farewell. May the Vault progress. 👁️' },
  ];

  var DEFAULT = 'I\'m not sure about that. 🤔\n\nTry asking about:\n• VALLIS platform & pools\n• Entities (Sentinel, Scar, Noot, EVE)\n• Games (CoinFlip, OMEN, DicerZ, Monolith)\n• Glyphs, Runes, Codex\n• ADMENSION links & ads\n\nOr tap a quick button below!';

  function match(text){
    var t = text.trim().toLowerCase();
    if(!t) return null;
    for(var i=0;i<RULES.length;i++){
      for(var j=0;j<RULES[i].p.length;j++){
        if(RULES[i].p[j].test(t)) return RULES[i].r;
      }
    }
    return DEFAULT;
  }

  // ---- Inject HTML ----
  // FAB
  var fab = document.createElement('button');
  fab.className = 'eve-fab';
  fab.title = 'Chat with EVE';
  fab.innerHTML = '<span class="eve-dot"></span>EVE';
  document.body.appendChild(fab);

  // Modal
  var modal = document.createElement('div');
  modal.className = 'eve-modal';
  modal.innerHTML =
    '<div class="eve-box">' +
      '<div class="eve-hdr"><h3><span class="eve-dot"></span> EVE — VALLIS Assistant</h3><button id="eve-close">✕</button></div>' +
      '<div class="eve-msgs" id="eve-msgs"></div>' +
      '<div class="eve-quick" id="eve-quick">' +
        '<button data-q="What is VALLIS?">VALLIS</button>' +
        '<button data-q="Tell me about SENTINEL">Sentinel</button>' +
        '<button data-q="What pools exist?">Pools</button>' +
        '<button data-q="Tell me about OMEN">OMEN</button>' +
        '<button data-q="How does ADMENSION work?">ADMENSION</button>' +
        '<button data-q="What are runes?">Runes</button>' +
      '</div>' +
      '<div class="eve-input"><input id="eve-in" placeholder="Ask EVE anything..." autocomplete="off"/><button id="eve-send">Send</button></div>' +
    '</div>';
  document.body.appendChild(modal);

  var msgs = document.getElementById('eve-msgs');
  var input = document.getElementById('eve-in');
  var sendBtn = document.getElementById('eve-send');
  var closeBtn = document.getElementById('eve-close');
  var quickBox = document.getElementById('eve-quick');

  function addMsg(html, isUser){
    var d = document.createElement('div');
    d.className = 'eve-msg ' + (isUser ? 'user' : 'bot');
    d.innerHTML = html.replace(/\n/g, '<br>');
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function send(){
    var t = input.value.trim();
    if(!t) return;
    addMsg(t, true);
    input.value = '';
    setTimeout(function(){ var r = match(t); if(r) addMsg(r, false); }, 250);
  }
  function openChat(){
    modal.classList.add('open');
    if(msgs.children.length === 0){
      addMsg('👁️ I\'m <b>EVE</b>, the VALLIS interpreter.\n\nCanon: <b>Sentinel → Scar → Noot → EVE</b>.\nI speak last. I provide guidance and clarity — never prediction.\n\nAsk me about the VALLIS ecosystem, pools, games, entities, glyphs, or ADMENSION!', false);
    }
    input.focus();
  }
  function closeChat(){ modal.classList.remove('open'); }

  fab.onclick = openChat;
  closeBtn.onclick = closeChat;
  modal.onclick = function(e){ if(e.target === modal) closeChat(); };
  sendBtn.onclick = send;
  input.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); send(); } };
  quickBox.onclick = function(e){
    var b = e.target.closest('button[data-q]');
    if(b){
      var q = b.getAttribute('data-q');
      addMsg(q, true);
      setTimeout(function(){ var r = match(q); if(r) addMsg(r, false); }, 250);
    }
  };
  document.onkeydown = function(e){ if(e.key === 'Escape' && modal.classList.contains('open')) closeChat(); };
})();
