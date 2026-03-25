
/** ORACLE TRACKING (client-only static build)
 * Stores minimal event telemetry in localStorage:
 * - page_view
 * - donation_recorded
 * - sponsor_booked (if wired)
 * No promises; purely observational.
 */
function oracleKey(){ return 'vallis_oracle_telemetry_v2_1'; }
function oracleLoad(){
  const raw = localStorage.getItem(oracleKey());
  if(raw){ try{ return JSON.parse(raw); }catch(e){} }
  return { events: [], counts: { total:0, page_view:0, donation_recorded:0 }, pages: {}, donations_usd: 0 };
}
function oracleSave(st){
  // keep last 5000 events to avoid bloat
  if(st.events.length > 5000) st.events = st.events.slice(st.events.length-5000);
  localStorage.setItem(oracleKey(), JSON.stringify(st));
}
function oracleTrack(type, data){
  const st = oracleLoad();
  st.counts.total = (st.counts.total||0) + 1;
  st.counts[type] = (st.counts[type]||0) + 1;
  const evt = { type, ts: new Date().toISOString(), data: data || {} };
  st.events.push(evt);

  if(type === 'page_view'){
    const p = data?.path || location.pathname || 'unknown';
    st.pages[p] = (st.pages[p]||0) + 1;
  }
  if(type === 'donation_recorded'){
    const amt = Number(data?.usd || 0);
    st.donations_usd = Number((st.donations_usd||0) + amt);
  }
  oracleSave(st);
}

async function loadJSON(path){
  const res = await fetch(path,{cache:'no-store'});
  return await res.json();
}
function $(sel){return document.querySelector(sel)}
function el(tag, attrs={}, children=[]){
  const n=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k==='class') n.className=v;
    else if(k==='html') n.innerHTML=v;
    else n.setAttribute(k,v);
  }
  for(const c of children){
    if(typeof c==='string') n.appendChild(document.createTextNode(c));
    else n.appendChild(c);
  }
  return n;
}
async function initSearch(){
  const box = $('#searchBox');
  if(!box) return;
  const idx = await loadJSON('../search_index.json').catch(()=>loadJSON('search_index.json'));
  const out = $('#searchResults');
  const render = (items)=>{
    out.innerHTML='';
    if(!items.length){
      out.appendChild(el('div',{class:'muted',html:'No results.'}));
      return;
    }
    for(const it of items.slice(0,25)){
      const card = el('div',{class:'pill',html:`<a href="${it.url}"><b>${it.title}</b></a><span class="muted">— ${it.text.slice(0,90)}…</span>`});
      out.appendChild(card);
    }
  };
  box.addEventListener('input', ()=>{
    const q = box.value.trim().toLowerCase();
    if(q.length<2){ out.innerHTML=''; return; }
    const items = idx.filter(d => 
      d.title.toLowerCase().includes(q) ||
      d.text.toLowerCase().includes(q) ||
      (d.tags||[]).some(t=>t.toLowerCase().includes(q))
    );
    render(items);
  });
}
function markActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a=>{
    const href = a.getAttribute('href');
    if(!href) return;
    const clean = href.split('/').pop();
    if(clean===path) a.classList.add('active');
  });
}
document.addEventListener('DOMContentLoaded', ()=>{
  oracleTrack('page_view', {path: location.pathname});
  markActiveNav();
  initSearch();
  initSupportPanel();
  initStickyFooterAds();
  initFeaturedAssets();
  initGlyphVariants();
  initThemeColorWheel();
  initVallisMonetizationUI();
  initOracleEntity();
  initOracleWidget();
  initDonationGoal();
  initMinigames();
  initAdamLite();
  initRegionPage();
  initRegionBadge();
  initHomepagePortal();
  initVerifierUI();
  initSponsoredShowcaseBar();
  initSponsorBookingPage();
});


function initSupportPanel(){
  // Policy-safe: this is NOT an incentivized ad. It's an optional sponsor message / support panel.
  if(document.querySelector('.support-fab')) return;

  const fab = el('div',{class:'support-fab', title:'Support VALLIS'});
  fab.appendChild(el('div',{class:'dot'}));
  fab.appendChild(el('div',{html:'<b>Support</b> <span class="muted">VALLIS</span>'}));

  const bubble = el('div',{class:'support-bubble', 'aria-hidden':'true'});
  bubble.innerHTML = `
    <div class="panel">
      <div class="head">
        <div>
          <div class="title">Support VALLIS</div>
          <div class="muted" style="font-size:12px">Optional • no rewards • keeps the lights on</div>
        </div>
        <button class="close" type="button">Close</button>
      </div>
      <div class="body">
        <div class="row">
          <a class="btn" href="#" data-action="share">Share</a>
          <a class="btn" href="#" data-action="supporter">Become Supporter</a>
          <a class="btn" href="#" data-action="donate">Donate</a>
        </div>

        <div class="small">
          <b>Compliance note:</b> This panel does not incentivize viewing ads. If you embed a sponsor clip here,
          host it yourself (or use a direct sponsor embed). Do not place ad-network “rewarded” units here.
        </div>

        <div class="video-wrap">
          <video id="supportVideo" preload="none" controls playsinline>
            <!-- Optional: replace with your own hosted sponsor clip -->
            <!-- <source src="assets/misc/sponsor-30s.mp4" type="video/mp4"> -->
          </video>
        </div>

        <div class="timer">
          <div><b id="supportCountdown">30</b><span class="muted">s optional sponsor message timer</span></div>
          <button class="btn" style="padding:8px 10px" type="button" data-action="start">Start</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(bubble);

  const closeBtn = bubble.querySelector('.close');
  const countdownEl = bubble.querySelector('#supportCountdown');
  const startBtn = bubble.querySelector('[data-action="start"]');
  const video = bubble.querySelector('#supportVideo');

  let t = 30;
  let timer = null;

  function open(){
    bubble.classList.add('open');
    bubble.setAttribute('aria-hidden','false');
  }
  function close(){
    bubble.classList.remove('open');
    bubble.setAttribute('aria-hidden','true');
    if(timer){ clearInterval(timer); timer=null; }
    t = 30;
    countdownEl.textContent = String(t);
    // don't force-stop video; user controls
  }

  fab.addEventListener('click', ()=>{
    bubble.classList.toggle('open');
    bubble.setAttribute('aria-hidden', bubble.classList.contains('open') ? 'false' : 'true');
  });
  closeBtn.addEventListener('click', close);

  bubble.querySelectorAll('[data-action]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const act = a.getAttribute('data-action');
      if(act==='share'){
        const url = location.href;
        navigator.clipboard?.writeText(url);
        a.textContent='Copied Link';
        setTimeout(()=>a.textContent='Share',1200);
      }
      if(act==='supporter'){
        // Placeholder: point to your supporter page later
        alert('Supporter system: link this button to your Supporter page when you deploy on vallis.ai.');
      }
      if(act==='donate'){
        alert('Donations: link this button to your donate page or supporter checkout.');
      }
      if(act==='start'){
        if(timer) return;
        t = 30;
        countdownEl.textContent = String(t);
        timer = setInterval(()=>{
          t -= 1;
          countdownEl.textContent = String(Math.max(0,t));
          if(t<=0){
            clearInterval(timer); timer=null;
            // Auto-close after 30s to keep UX clean
            close();
          }
        }, 1000);
        // If video has a source, play it; otherwise do nothing.
        try { video.play(); } catch {}
      }
    });
  });

  // Close on ESC
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape' && bubble.classList.contains('open')) close();
  });
}



function initStickyFooterAds(){
  if(document.querySelector('.sticky-ads')) return;

  // Session-only persistence to avoid annoyance while still maximizing viewability
  const key = 'vallis_sticky_ads_hidden';
  if(sessionStorage.getItem(key)==='1') return;

  const wrap = document.createElement('div');
  wrap.className = 'sticky-ads';
  wrap.innerHTML = `
    <div class="bar">
      <div class="unit">
        <div class="label">Advertisement</div>
        <button class="close" type="button" aria-label="Hide ads">Hide</button>
        <div class="slot" id="stickyAdSlot1">
          Paste your <b>display</b> ad code here (non-incentivized)<br/>
          <span class="muted">Refresh on navigation only • no timers</span>
        </div>
      </div>

      <div class="unit mobile-only">
        <div class="label">Advertisement</div>
        <div class="slot small" id="stickyAdSlot2">
          Optional second unit (mobile-only)
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  const btn = wrap.querySelector('.close');
  btn.addEventListener('click', ()=>{
    wrap.classList.add('hidden');
    sessionStorage.setItem(key,'1');
    // reduce bottom padding when hidden
    document.body.style.paddingBottom = '40px';
  });
}



async function initFeaturedAssets(){
  const grid = document.getElementById('featuredGrid');
  const note = document.getElementById('missingAssetsNote');
  if(!grid && !note) return;

  const content = await loadJSON('content.json');
  const featured = content.featured || [];

  function exists(url){
    return fetch(url, {method:'HEAD'}).then(r=>r.ok).catch(()=>false);
  }

  // Render featured thumbs
  if(grid){
    grid.innerHTML='';
    for(const item of featured){
      const card = document.createElement('a');
      card.href = item.href || '#';
      card.className = 'thumb';
      card.style.display='block';
      const img = document.createElement('img');
      img.src = item.thumb || '';
      img.alt = item.title || 'Featured';
      // SVGs can fail in <img> in some setups; fallback text
      img.onerror = ()=>{ img.remove(); card.innerHTML = `<div style="padding:14px"><b>${item.title||'Asset'}</b><div class="muted" style="margin-top:6px">${item.note||''}</div></div>`; };
      card.appendChild(img);
      grid.appendChild(card);
    }
  }

  // Check for missing variant assets (best-effort)
  let missing = [];
  for(const g of (content.glyphs||[])){
    for(const v of (g.variants||[])){
      if(!v.file) continue;
      // only check placeholders (non-canonical) to avoid noise
      if(v.label==='Ritual' || v.label==='Orbs'){
        const ok = await exists(v.file);
        if(!ok) missing.push(v.file);
      }
    }
  }

  if(note){
    if(missing.length){
      note.innerHTML = `<b>Variants pending:</b> ${missing.length} placeholder files not found yet. Drop them into the mapped folders and they’ll auto-appear.`;
    }else{
      note.innerHTML = `<b>Variants ready:</b> All mapped Ritual/Orbs variant files were found.`;
    }
  }
}

async function initGlyphVariants(){
  // On glyph pages, if a container exists, render variant buttons.
  const host = document.getElementById('glyphVariants');
  if(!host) return;

  // Determine slug from URL (e.g., /glyphs/ash.html)
  const page = location.pathname.split('/').pop().replace('.html','');
  const content = await loadJSON('../content.json');
  const glyph = (content.glyphs||[]).find(g=>g.slug===page);
  if(!glyph) return;

  host.innerHTML='';
  const img = document.getElementById('glyphImg');
  const btnRow = document.createElement('div');
  btnRow.className = 'row';

  function setVariant(file,label){
    if(!img) return;
    img.src = '../'+file.replace(/^(\.\.\/)+/,'');
    const lab = document.getElementById('glyphVariantLabel');
    if(lab) lab.textContent = label;
  }

  for(const v of (glyph.variants||[])){
    const b = document.createElement('button');
    b.type='button';
    b.className='btn';
    b.textContent=v.label;
    b.addEventListener('click', ()=> setVariant(v.file, v.label));
    btnRow.appendChild(b);
  }
  host.appendChild(btnRow);
}


function setAccent(hex){
  const c = hex.replace('#','');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent2', `rgba(${r},${g},${b},.22)`);
  document.documentElement.style.setProperty('--accent3', `rgba(${r},${g},${b},.12)`);
}

function initThemeColorWheel(){
  if(document.querySelector('.theme-wheel')) return;

  const key = 'vallis_accent_hex';
  const keyMin = 'vallis_theme_wheel_min';
  const saved = localStorage.getItem(key);
  if(saved) setAccent(saved);

  const wrap = document.createElement('div');
  wrap.className = 'theme-wheel';
  wrap.innerHTML = `
    <div class="hdr">
      <div class="title">Theme Accent</div>
      <div class="controls">
        <button class="mini" type="button" id="twMin">Min</button>
        <button class="mini close" type="button" id="twClose" aria-label="Hide">Hide</button>
      </div>
    </div>
    <div class="body" id="twBody">
      <div class="row">
        <div class="muted">Pick an accent color</div>
        <input type="color" id="twColor" value="${saved || '#ffcc33'}" aria-label="Accent color"/>
      </div>
      <div style="height:10px"></div>
      <div class="row">
        <div class="muted">Reset to VALLIS Yellow</div>
        <button class="mini" type="button" id="twReset">Reset</button>
      </div>
      <div style="height:10px"></div>
      <div class="muted">Saved locally in your browser.</div>
    </div>
  `;
  document.body.appendChild(wrap);

  const body = wrap.querySelector('#twBody');
  const btnMin = wrap.querySelector('#twMin');
  const btnClose = wrap.querySelector('#twClose');
  const btnReset = wrap.querySelector('#twReset');
  const inp = wrap.querySelector('#twColor');

  const isMin = localStorage.getItem(keyMin)==='1';
  if(isMin){ body.style.display='none'; btnMin.textContent='Expand'; }

  btnMin.addEventListener('click', ()=>{
    const hidden = body.style.display==='none';
    body.style.display = hidden ? 'block' : 'none';
    btnMin.textContent = hidden ? 'Min' : 'Expand';
    localStorage.setItem(keyMin, hidden ? '0':'1');
  });

  btnClose.addEventListener('click', ()=>{ wrap.remove(); });

  inp.addEventListener('input', ()=>{
    const v = inp.value;
    setAccent(v);
    localStorage.setItem(key, v);
  });

  btnReset.addEventListener('click', ()=>{
    const v = '#ffcc33';
    inp.value = v;
    setAccent(v);
    localStorage.setItem(key, v);
  });
}

function utcDateString(){
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  const day = String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function utcMonthString(){
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  return `${y}-${m}`;
}
async function sha256hex(str){
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function getDailyTrace(){
  const seasonSeed = 'VALLIS_LORE_WIKI_V1';
  const input = `VALLIS|${utcDateString()}|SEASON_SEED=${seasonSeed}`;
  const h = await sha256hex(input);
  const code = 'CV-' + h.slice(8,16).toUpperCase();
  return { input, hash: h, conclaveCode: code, seasonSeed };
}
const DAILY_RUNES = ['ASH','WIND','STONE','FLOOD','VOID','SCAR','SENTINEL','NOOT','EVE'];
async function pickRuneOfDay(){
  const t = await getDailyTrace();
  const idx = parseInt(t.hash.slice(0,8),16) % DAILY_RUNES.length;
  return { rune: DAILY_RUNES[idx], trace: t };
}
function getSupportState(){
  const month = utcMonthString();
  const key = 'vallis_support_v2_1_'+month;
  const raw = localStorage.getItem(key);
  if(raw){ try{ return JSON.parse(raw); }catch(e){} }
  return { month, supporters: [], stats: { supporters:0, messages:0, thankYouCredits:0 } };
}
function saveSupportState(state){
  localStorage.setItem('vallis_support_v2_1_'+state.month, JSON.stringify(state));
}
function initSupportWall(){
  const nick = document.getElementById('supNick');
  const msg = document.getElementById('supMsg');
  const btnMsg = document.getElementById('supSaveMsg');
  const btnDonate = document.getElementById('supDonate');
  const statS = document.getElementById('supStatSupporters');
  const statM = document.getElementById('supStatMessages');
  const statC = document.getElementById('supStatCredits');
  const recent = document.getElementById('supRecent');
  const wall = document.getElementById('supWall');
  if(!btnMsg || !statS) return;

  function render(){
    const st = getSupportState();
    statS.textContent = st.stats.supporters;
    statM.textContent = st.stats.messages;
    statC.textContent = st.stats.thankYouCredits;

    const last5 = st.supporters.slice(-5).reverse().map(s=>`• ${escapeHtml(s.nickname)}${(s.type==='message' && s.message) ? ` — “${escapeHtml(s.message)}”` : ''}`);
    recent.innerHTML = last5.length ? last5.join('<br/>') : '<span class="muted">No recent supporters yet.</span>';

    const msgs = st.supporters.filter(s=>s.type==='message').slice(-10).reverse()
      .map(s=>`<div style="margin-bottom:6px;"><b>${escapeHtml(s.nickname)}</b>: ${escapeHtml(s.message||'')}</div>`);
    wall.innerHTML = msgs.length ? msgs.join('') : '<span class="muted">No messages this month yet.</span>';
  }

  btnMsg.addEventListener('click', ()=>{
    const n = (nick.value||'').trim();
    const m = (msg.value||'').trim();
    if(!n){ alert('Nickname is required.'); return; }
    const st = getSupportState();
    st.supporters.push({ nickname:n, message:m, type:'message', ts:new Date().toISOString() });
    st.stats.messages += 1;
    st.stats.supporters = new Set(st.supporters.map(s=>s.nickname)).size;
    st.stats.thankYouCredits += 1;
    saveSupportState(st);
    msg.value = '';
    render();
  });

  btnDonate.addEventListener('click', ()=>{
    const n = (nick.value||'').trim();
    if(!n){ alert('Nickname is required for the thank-you tracker.'); return; }
    const st = getSupportState();
    st.supporters.push({ nickname:n, type:'silent', ts:new Date().toISOString() });
    st.stats.supporters = new Set(st.supporters.map(s=>s.nickname)).size;
    st.stats.thankYouCredits += 1;
    saveSupportState(st);
    render();
    alert('Donation flow placeholder. Wire your donation link here.');
  });

  render();
}
async function initDailyTraceUI(){
  const rEl = document.getElementById('dailyRune');
  const cEl = document.getElementById('dailyConclaveCode');
  const cxR = document.getElementById('cxRune');
  const cxC = document.getElementById('cxCode');
  const pick = await pickRuneOfDay();
  if(rEl) rEl.textContent = pick.rune;
  if(cxR) cxR.textContent = pick.rune;
  if(cEl) cEl.textContent = pick.trace.conclaveCode;
  if(cxC) cxC.textContent = pick.trace.conclaveCode;
}
function getConclaveState(){
  const month = utcMonthString();
  const key = 'vallis_conclave_v2_1_'+month;
  const raw = localStorage.getItem(key);
  if(raw){ try{ return JSON.parse(raw); }catch(e){} }
  return { month, tokens: 0, vote: null, receipt: null };
}
function saveConclaveState(st){
  localStorage.setItem('vallis_conclave_v2_1_'+st.month, JSON.stringify(st));
}
async function renderConclave(){
  const monthEl = document.getElementById('conclaveMonth');
  const a = document.getElementById('bundleA');
  const b = document.getElementById('bundleB');
  const tokensEl = document.getElementById('myTokens');
  const claim = document.getElementById('claimToken');

  const cxTokens = document.getElementById('cxTokens');
  const cxClaim = document.getElementById('cxClaim');
  const cxA = document.getElementById('cxA');
  const cxB = document.getElementById('cxB');
  const cxReceipt = document.getElementById('cxReceipt');

  const data = await fetch('data/conclave.json').then(r=>r.json()).catch(()=>({bundles:[]}));
  const month = utcMonthString();
  if(monthEl) monthEl.textContent = `Month: ${month}`;

  const st = getConclaveState();
  if(tokensEl) tokensEl.textContent = st.tokens;
  if(cxTokens) cxTokens.textContent = st.tokens;
  if(cxReceipt) cxReceipt.textContent = st.receipt ? `Recorded: ${st.receipt}` : 'No vote recorded.';

  function bundleCard(bundle, target){
    if(!bundle || !target) return;
    const voted = st.vote === bundle.id;
    const items = (bundle.items||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
    const btn = st.tokens>0
      ? `<button class="btn ${voted?'':'ghost'}" data-vote="${bundle.id}">${voted?'Voted':'Vote '+bundle.id}</button>`
      : `<button class="btn ghost" disabled>Preview</button>`;
    target.innerHTML = `
      <div class="kicker">Selection ${escapeHtml(bundle.id)}</div>
      <div style="font-size:16px;font-weight:900;margin-bottom:6px;">${escapeHtml(bundle.title||'')}</div>
      <ul class="list">${items}</ul>
      <div style="margin-top:10px;">${btn}</div>
      ${voted && st.receipt ? `<div class="muted" style="margin-top:8px;font-size:12px;">Receipt: ${escapeHtml(st.receipt)}</div>` : ``}
    `;
    target.querySelectorAll('button[data-vote]').forEach(btnEl=>{
      btnEl.addEventListener('click', async ()=>{
        if(st.tokens<=0) return;
        const pick = await getDailyTrace();
        st.vote = btnEl.getAttribute('data-vote');
        st.tokens -= 1;
        st.receipt = `VOTE-${pick.hash.slice(0,6).toUpperCase()}-${st.vote}-${month}`;
        saveConclaveState(st);
        renderConclave();
      });
    });
  }

  const bundleA = data.bundles?.[0];
  const bundleB = data.bundles?.[1];
  bundleCard(bundleA, a);
  bundleCard(bundleB, b);
  bundleCard(bundleA, cxA);
  bundleCard(bundleB, cxB);

  function claimTokenAction(){
    if(st.tokens >= 1){
      alert('Token already claimed for this month (cap = 1).');
      return;
    }
    st.tokens = 1;
    saveConclaveState(st);
    renderConclave();
  }
  if(claim) claim.onclick = claimTokenAction;
  if(cxClaim) cxClaim.onclick = claimTokenAction;
}
function initVallisMonetizationUI(){
  initSupportWall();
  initDailyTraceUI();
  renderConclave();
}


function _utcNow(){
  return new Date();
}
function _dayOfYearUTC(d){
  const start = Date.UTC(d.getUTCFullYear(),0,1);
  const now = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((now - start) / 86400000) + 1;
}
function _hashToInt(str){
  // small deterministic hash (not crypto) for index selection
  let h=2166136261;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h>>>0);
}

async 
function initOracleEntity(){
  const page = document.getElementById('oracleEntityPage');
  // If the oracle page doesn't have a marker, try to detect by URL
  const isOracle = page || (location.pathname||'').includes('/entities/oracle.html') || (location.href||'').includes('entities/oracle.html');
  if(!isOracle) return;

  const fortuneBox = document.getElementById('oracleEntityFortune');
  const traceBox = document.getElementById('oracleEntityTrace');
  const statsBox = document.getElementById('oracleEntityStats');
  const pagesBox = document.getElementById('oracleEntityPages');
  const ledgerBox = document.getElementById('oracleEntityLedger');

  async function render(){
    const f = await oracleFortuneForHour();
    if(fortuneBox) fortuneBox.textContent = f.line;
    if(traceBox) traceBox.textContent = `${f.trace} • idx ${String(f.idx).padStart(3,'0')} • doy ${f.doy}`;
    const luckyE = document.getElementById('oracleLuckyEntity');
    if(luckyE) luckyE.textContent = oracleLuckyNumber24h();

    const st = oracleLoad();
    const c = st.counts || {};
    const total = st.donations_usd || 0;

    if(statsBox){
      statsBox.innerHTML = `
        <div class="row" style="flex-wrap:wrap;">
          <div><div style="font-size:22px;font-weight:900">${c.page_view||0}</div><div class="muted">Page Views</div></div>
          <div><div style="font-size:22px;font-weight:900">${fmtUsd(total)}</div><div class="muted">Donations</div></div>
          <div><div style="font-size:22px;font-weight:900">${c.total||0}</div><div class="muted">Tracked Events</div></div>
          <div><div style="font-size:22px;font-weight:900">${c.donation_recorded||0}</div><div class="muted">Donation Records</div></div>
        </div>
      `;
    }

    if(pagesBox){
      const entries = Object.entries(st.pages||{}).sort((a,b)=>b[1]-a[1]).slice(0,10);
      pagesBox.innerHTML = entries.length
        ? entries.map(([p,n])=>`• <b>${escapeHtml(p)}</b> — ${n}`).join('<br/>')
        : '<span class="muted">No page data yet.</span>';
    }

    if(ledgerBox){
      const last = (st.events||[]).slice(-20).reverse();
      ledgerBox.innerHTML = last.length
        ? last.map(e=>{
            const t = new Date(e.ts).toISOString().slice(0,19).replace('T',' ');
            return `• <b>${escapeHtml(e.type)}</b> <span class="muted">${t}Z</span> — ${escapeHtml(JSON.stringify(e.data||{}))}`;
          }).join('<br/>')
        : '<span class="muted">Oracle ledger is empty.</span>';
    }
  }

  render();
  setInterval(render, 30000);
}


/** Sponsored Showcase (client-only demo scheduler)
 * Rules:
 * - 72 hour windows
 * - 9 lanes per window
 * - schedule up to 3 months ahead (≈92 days)
 * - cap total scheduled bookings within horizon to 256
 */
function _sponsorStoreKey(){ return 'vallis_sponsor_bookings_v1'; }
function _loadSponsors(){
  try{ return JSON.parse(localStorage.getItem(_sponsorStoreKey())||'[]'); }catch(e){ return []; }
}
function _saveSponsors(arr){
  localStorage.setItem(_sponsorStoreKey(), JSON.stringify(arr));
}
function _epochUTC(){
  // Fixed epoch to align 72h windows deterministically
  return Date.UTC(2026,0,1,0,0,0);
}
function _windowIndexFor(ts){
  const win = 72*3600*1000;
  return Math.floor((ts - _epochUTC()) / win);
}
function _windowStartFor(index){
  const win = 72*3600*1000;
  return _epochUTC() + index*win;
}
function _formatUTC(ts){
  const d = new Date(ts);
  const y=d.getUTCFullYear();
  const mo=String(d.getUTCMonth()+1).padStart(2,'0');
  const da=String(d.getUTCDate()).padStart(2,'0');
  const h=String(d.getUTCHours()).padStart(2,'0');
  const mi=String(d.getUTCMinutes()).padStart(2,'0');
  return `${y}-${mo}-${da} ${h}:${mi} UTC`;
}
function _withinHorizon(ts){
  const now = Date.now();
  const max = now + 92*24*3600*1000;
  return ts <= max;
}
function _activeSponsors(nowTs){
  const items=_loadSponsors().filter(s=>s.status!=='refunded');
  return items.filter(s=> nowTs>=s.display_start && nowTs < s.display_end);
}
function _capacityForWindow(index){
  const items=_loadSponsors().filter(s=>s.status!=='refunded');
  const start=_windowStartFor(index);
  const end=start + 72*3600*1000;
  const inWin=items.filter(s=>s.display_start===start && s.display_end===end);
  const used=new Set(inWin.map(s=>s.lane));
  return {used, count: inWin.length};
}
function _assignSponsor(requestedStartTs){
  const now = Date.now();
  const minStart = Math.max(now, requestedStartTs);
  let idx=_windowIndexFor(minStart);
  if(idx<0) idx=0;

  // enforce horizon and cap
  const bookings=_loadSponsors();
  const horizonCut = now + 92*24*3600*1000;
  const within = bookings.filter(b=>b.display_start < horizonCut && b.status!=='refunded');
  if(within.length >= 256) return {ok:false, error:'Sold out: 256 bookings already scheduled within the 3‑month horizon.'};

  for(let hops=0; hops<40; hops++){
    const start=_windowStartFor(idx);
    const end=start + 72*3600*1000;
    if(!_withinHorizon(start)) return {ok:false, error:'No slots available within the 3‑month schedule window.'};

    const cap=_capacityForWindow(idx);
    if(cap.count < 9){
      // first free lane 0..8
      let lane=0;
      while(cap.used.has(lane) && lane<9) lane++;
      return {ok:true, windowIndex:idx, lane, start, end};
    }
    idx += 1;
  }
  return {ok:false, error:'Scheduler could not find a free lane. Try a later date.'};
}

function initSponsoredShowcaseBar(){
  // Appears when you reach the bottom area; shows active sponsors + booking CTA.
  if(document.querySelector('.sponsored-showcase')) return;

  const bar = document.createElement('div');
  bar.className = 'sponsored-showcase';
  bar.innerHTML = `
    <div class="inner">
      <div class="left">
        <div class="kicker">Sponsored Showcase</div>
        <div class="muted small">Max 9 active • 72h each • schedule up to 3 months ahead</div>
      </div>
      <div class="slots" id="sponsorSlots"></div>
      <div class="right">
        <a class="btn" href="../sponsor.html">Book 72h</a>
      </div>
    </div>
  `;
  // relative links depending on depth
  const depth = location.pathname.split('/').length;
  if(location.pathname.includes('/entities/') || location.pathname.includes('/glyphs/') || location.pathname.includes('/runes/') || location.pathname.includes('/games/') || location.pathname.includes('/omens/')){
    bar.querySelector('a.btn').setAttribute('href','../sponsor.html');
  } else {
    bar.querySelector('a.btn').setAttribute('href','sponsor.html');
  }

  document.body.appendChild(bar);

  // show only when near bottom
  function visible(v){ bar.classList.toggle('show', v); }
  const footer = document.querySelector('.wrap.footer') || document.body;
  const io = new IntersectionObserver((entries)=>{
    const e=entries[0];
    visible(e && e.isIntersecting);
  }, {root:null, threshold:0.1});
  io.observe(footer);

  function render(){
    const slots = bar.querySelector('#sponsorSlots');
    if(!slots) return;
    const nowTs=Date.now();
    const act=_activeSponsors(nowTs);
    const shown=act.slice(0,9);
    if(shown.length===0){
      slots.innerHTML = `<div class="pill">No active sponsors</div>`;
      return;
    }
    slots.innerHTML = shown.map(s=>`
      <a class="sponsor-pill" href="${s.url||'#'}" target="_blank" rel="noopener">
        <b>${(s.nickname||'Sponsor').slice(0,18)}</b>
        <span class="muted">${s.title?('— '+s.title.slice(0,22)):'— Active'}</span>
      </a>
    `).join('');
  }
  render();
  setInterval(render, 5000);
}

function initSponsorBookingPage(){
  const form = document.getElementById('sponsorBookingForm');
  if(!form) return;

  const startInput = document.getElementById('sponsorStart');
  const sinceInput = document.getElementById('sponsorSince');
  const out = document.getElementById('sponsorResult');
  const cap = document.getElementById('sponsorCap');
  const preview = document.getElementById('sponsorPreview');

  // set input bounds
  const now = new Date();
  const max = new Date(Date.now() + 92*24*3600*1000);
  const isoDate = d => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}T${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
  if(startInput){
    startInput.min = isoDate(now).slice(0,16);
    startInput.max = isoDate(max).slice(0,16);
  }
  if(sinceInput){
    const minSince = new Date(Date.now() - 30*24*3600*1000);
    sinceInput.min = isoDate(minSince).slice(0,16);
    sinceInput.max = isoDate(now).slice(0,16);
  }

  function updateCapHint(){
    const bookings=_loadSponsors();
    const horizonCut = Date.now() + 92*24*3600*1000;
    const within = bookings.filter(b=>b.display_start < horizonCut && b.status!=='refunded');
    cap.textContent = `${within.length}/256 scheduled in horizon`;
  }
  updateCapHint();

  function updatePreview(){
    const ts = startInput && startInput.value ? Date.parse(startInput.value+'Z') : Date.now();
    const idx=_windowIndexFor(ts);
    const start=_windowStartFor(idx);
    const c=_capacityForWindow(idx);
    preview.textContent = `Selected window: ${_formatUTC(start)} → ${_formatUTC(start + 72*3600*1000)} • Slots used: ${c.count}/9`;
  }
  if(startInput) startInput.addEventListener('input', updatePreview);
  updatePreview();

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    out.textContent='';
    const fd = new FormData(form);
    const nickname = (fd.get('nickname')||'').toString().trim();
    const title = (fd.get('title')||'').toString().trim();
    const url = (fd.get('url')||'').toString().trim();
    const startRaw = (fd.get('start')||'').toString().trim();
    const sinceRaw = (fd.get('since')||'').toString().trim();

    if(!nickname || nickname.length<2){ out.textContent='Enter a nickname (2+ chars).'; return; }
    if(!url || !/^https?:\/\//i.test(url)){ out.textContent='Enter a valid URL (https://...)'; return; }
    const reqTs = startRaw ? Date.parse(startRaw+'Z') : Date.now();
    const assign = _assignSponsor(reqTs);
    if(!assign.ok){ out.textContent=assign.error; return; }

    const nowTs=Date.now();
    let sinceTs = null;
    if(sinceRaw){
      sinceTs = Date.parse(sinceRaw+'Z');
      // clamp to last 30 days
      const min = nowTs - 30*24*3600*1000;
      if(sinceTs < min) sinceTs = min;
      if(sinceTs > nowTs) sinceTs = nowTs;
    }

    const booking = {
      id: 'sp_'+Math.random().toString(16).slice(2),
      nickname,
      title,
      url,
      purchased_at: nowTs,
      sponsored_since: sinceTs,
      requested_show_date: reqTs,
      display_start: assign.start,
      display_end: assign.end,
      lane: assign.lane,
      window_index: assign.windowIndex,
      status: (nowTs>=assign.start && nowTs<assign.end) ? 'active' : 'scheduled'
    };

    const all=_loadSponsors();
    all.push(booking);
    _saveSponsors(all);

    out.innerHTML = `<b>Booked.</b> Your 72h showcase is scheduled:<br/>
      <span class="muted">${_formatUTC(booking.display_start)} → ${_formatUTC(booking.display_end)}</span><br/>
      Lane <b>${booking.lane+1}/9</b> • Window #${booking.window_index}<br/>
      <span class="muted">This is a client-only demo scheduler. Production uses server-side assignment.</span>`;
    form.reset();
    updateCapHint();
    updatePreview();
  });
}


function fmtUsd(n){
  try{ return '$' + Number(n||0).toLocaleString(undefined,{maximumFractionDigits:0}); }catch(e){ return '$'+String(n||0); }
}
function oracleHourTrace(){
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  const day = String(d.getUTCDate()).padStart(2,'0');
  const h = String(d.getUTCHours()).padStart(2,'0');
  return `${y}-${m}-${day}T${h}:00Z`;
}
function dayOfYearUTC(){
  const d = new Date();
  const start = Date.UTC(d.getUTCFullYear(),0,0);
  const diff = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start;
  return Math.floor(diff / 86400000);
}
async function oracleFortuneForHour(){
  // deterministic: day-of-year + hour → [0..255]
  const doy = dayOfYearUTC();
  const hour = new Date().getUTCHours();
  const idx = ((doy * 24) + hour) % 256;
  // Load quotes if present; fallback to a generated line
  const q = await fetch('data/oracle_quotes.json').then(r=>r.json()).catch(()=>null);
  const line = q?.quotes?.[idx] || `Hour ${hour}: Hold the line. Let the system breathe.`;
  return { idx, line, doy, hour, trace: oracleHourTrace() };
}
async function initOracleWidget(){
  const box = document.getElementById('oracleWidget');
  if(!box) return;
  const fortuneEl = document.getElementById('oracleFortune');
  const hourEl = document.getElementById('oracleHour');
  const traceEl = document.getElementById('oracleTrace');
  const luckyEl = document.getElementById('oracleLucky');
  const vEl = document.getElementById('oracleStatViews');
  const dEl = document.getElementById('oracleStatDonations');
  const eEl = document.getElementById('oracleStatEvents');

  async function render(){
    const f = await oracleFortuneForHour();
    if(fortuneEl) fortuneEl.textContent = f.line;
    if(hourEl) hourEl.textContent = String(f.hour).padStart(2,'0') + ':00 UTC';
    if(traceEl) traceEl.textContent = `${f.trace} • Q#${String(f.idx).padStart(3,'0')}`;
    if(luckyEl) luckyEl.textContent = oracleLuckyNumber24h();

    const st = oracleLoad();
    const views = st.counts?.page_view || 0;
    if(vEl) vEl.textContent = String(views);
    if(dEl) dEl.textContent = fmtUsd(st.donations_usd||0);
    if(eEl) eEl.textContent = String(st.counts?.total || 0);
  }
  render();
  setInterval(render, 30000);
}
function getDonationGoalTotal(){ return oracleLoad().donations_usd || 0; }
function initDonationGoal(){
  const bar = document.getElementById('goalBar');
  const text = document.getElementById('goalText');
  const pct = document.getElementById('goalPct');
  const recent = document.getElementById('donRecent');
  const btn = document.getElementById('donSubmit');
  const nick = document.getElementById('donNick');
  const amt = document.getElementById('donAmt');
  const GOAL = 10000;

  function render(){
    const st = oracleLoad();
    const total = st.donations_usd || 0;
    const p = Math.max(0, Math.min(1, total/GOAL));
    if(bar) bar.style.width = (p*100).toFixed(2) + '%';
    if(text) text.textContent = `${fmtUsd(total)} / ${fmtUsd(GOAL)}`;
    if(pct) pct.textContent = `${Math.round(p*100)}%`;

    if(recent){
      const dons = (st.events||[]).filter(e=>e.type==='donation_recorded').slice(-5).reverse();
      if(!dons.length){ recent.textContent = 'No donations recorded yet.'; }
      else{
        recent.innerHTML = dons.map(d=>{
          const n = escapeHtml(d.data?.nickname||'anon');
          const a = fmtUsd(d.data?.usd||0);
          const t = new Date(d.ts).toISOString().slice(0,16).replace('T',' ');
          return `• <b>${n}</b> — ${a} <span class="muted">(${t}Z)</span>`;
        }).join('<br/>');
      }
    }
  }

  if(btn){
    btn.addEventListener('click', ()=>{
      const n = (nick?.value||'').trim() || 'anon';
      const a = Math.max(1, Number(amt?.value||5));
      oracleTrack('donation_recorded', {nickname:n, usd:a});
      // local-only confirmation
      alert('Donation recorded locally (static build). Wire receipt verification in production.');
      render();
      initOracleWidget();
    });
  }

  render();
}

function oracleDeviceKey(){
  // Static-site friendly “IP-like” key (NOT real IP). In production replace with server-side IP hash.
  const ua = navigator.userAgent || 'ua';
  const tz = String(new Date().getTimezoneOffset());
  const scr = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  const lang = navigator.language || 'en';
  const raw = [ua,tz,scr,lang].join('|');
  return sha256(raw).slice(0,24);
}
function oracleLuckyNumber24h(){
  const d = new Date();
  const y = d.getUTCFullYear();
  const doy = dayOfYearUTC();
  const key = oracleDeviceKey();
  const seed = sha256(`${y}-${doy}|${key}|oracle_lucky`);
  // 6-digit lucky pull
  const n = parseInt(seed.slice(0,8), 16) % 1000000;
  return String(n).padStart(6,'0');
}

function sha256(str){
  // deterministic non-crypto hash fallback (static build). Replace with real SHA-256 in production.
  let h1=0xdeadbeef ^ str.length, h2=0x41c6ce57 ^ str.length;
  for(let i=0, ch; i<str.length; i++){
    ch=str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
  h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
  const hex = (n)=>('00000000'+(n>>>0).toString(16)).slice(-8);
  return hex(h1)+hex(h2)+hex(h1^h2)+hex(h2^h1);
}

function initAdamLite(){
  const start = document.getElementById('adamStart');
  const stop = document.getElementById('adamStop');
  const msg = document.getElementById('adamMsg');
  const box = document.getElementById('adamContainer');
  const timerEl = document.getElementById('adamTimer');
  const thanks = document.getElementById('adamThanks');
  const ledger = document.getElementById('adamLedger');
  if(!start || !stop) return;

  let t=null, remaining=0;

  function renderLedger(){
    if(!ledger) return;
    const st = oracleLoad();
    const rows = (st.events||[]).filter(e=>e.type==='adam_lite_support').slice(-10).reverse();
    ledger.innerHTML = rows.length
      ? rows.map(e=>{
          const ts = new Date(e.ts).toISOString().slice(0,19).replace('T',' ');
          return `• <b>Support</b> <span class="muted">${ts}Z</span> — ${escapeHtml(e.data?.receipt||'receipt')}`;
        }).join('<br/>')
      : '<span class="muted">No receipts yet.</span>';
  }

  function stopSession(){
    if(t) clearInterval(t);
    t=null;
    remaining=0;
    if(box) box.style.display='none';
    if(thanks) thanks.style.display='none';
    if(msg) msg.textContent='No session running.';
  }

  start.addEventListener('click', ()=>{
    stopSession();
    remaining=30;
    if(box) box.style.display='block';
    if(thanks) thanks.style.display='none';
    if(timerEl) timerEl.textContent=String(remaining);
    if(msg) msg.textContent='Running…';
    const receipt = `ADAM-LITE-${oracleHourTrace()}-${oracleLuckyNumber24h()}`;
    t=setInterval(()=>{
      remaining--;
      if(timerEl) timerEl.textContent=String(Math.max(0,remaining));
      if(remaining<=0){
        clearInterval(t); t=null;
        if(thanks) thanks.style.display='block';
        if(msg) msg.textContent='Complete.';
        // Record a support receipt — no rewards, no gating.
        oracleTrack('adam_lite_support', {receipt});
        renderLedger();
      }
    }, 1000);
  });

  stop.addEventListener('click', stopSession);
  renderLedger();
}

function initMinigames(){
  oracleTrialStart('signal_vs_noise');
  oracleTrialStart('rune_match');
  oracleTrialStart('glyph_trace');

  const svns = document.getElementById('svnsGrid');
  const svnsCheck = document.getElementById('svnsCheck');
  const svnsMsg = document.getElementById('svnsMsg');
  const matchGrid = document.getElementById('matchGrid');
  const matchReset = document.getElementById('matchReset');
  const matchMsg = document.getElementById('matchMsg');
  const traceBoard = document.getElementById('traceBoard');
  const traceReset = document.getElementById('traceReset');
  const traceMsg = document.getElementById('traceMsg');

  // Signal vs Noise
  if(svns){
    const correct = new Set();
    // choose 3 "signal" tiles deterministically per day
    const seed = sha256(`${dayOfYearUTC()}|svns`).slice(0,8);
    let x=parseInt(seed,16);
    while(correct.size<3){
      x = (x*1664525 + 1013904223)>>>0;
      correct.add(x % 24);
    }
    for(let i=0;i<24;i++){
      const el=document.createElement('div');
      el.className='tile';
      el.dataset.idx=String(i);
      // create some pseudo-structure for "signal"
      const isSig=correct.has(i);
      el.innerHTML = `<svg class="sig" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        ${isSig ? `<path d="M10 70 Q30 20 50 60 T90 30" fill="none" stroke="rgba(255,214,0,.9)" stroke-width="3"/>` :
                  `<path d="M10 20 L90 80 M20 90 L80 10" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/>`}
      </svg>`;
      el.addEventListener('click', ()=>{
        el.classList.toggle('selected');
      });
      svns.appendChild(el);
    }
    svnsCheck?.addEventListener('click', ()=>{
      const selected=[...svns.querySelectorAll('.tile.selected')].map(t=>Number(t.dataset.idx));
      if(selected.length!==3){
        if(svnsMsg) svnsMsg.textContent='Select exactly 3 tiles.';
        return;
      }
      let hits=0;
      selected.forEach(i=>{ if(correct.has(i)) hits++; });
      const score = Math.round((hits/3)*100);
      oracleTrack('captcha_minigame', {game:'signal_vs_noise', hits, score});
      if(svnsMsg) svnsMsg.textContent = `Submitted. Accuracy: ${hits}/3 (${score}%).`;
    });
  }

  // Rune Match (12 cards / 6 pairs)
  if(matchGrid){
    const symbols=['A','B','C','D','E','F'];
    const deck=[...symbols,...symbols].sort(()=>Math.random()-0.5);
    let first=null, lock=false, matched=0;
    function build(){
      matchGrid.innerHTML='';
      first=null; lock=false; matched=0;
      const start=Date.now();
      deck.sort(()=>Math.random()-0.5);
      deck.forEach((s, i)=>{
        const el=document.createElement('div');
        el.className='cardTile';
        el.dataset.sym=s;
        el.dataset.i=String(i);
        el.textContent='?';
        el.addEventListener('click', ()=>{
          if(lock || el.classList.contains('matched')) return;
          el.classList.add('revealed');
          el.textContent=s;
          if(!first){
            first=el;
          }else if(first===el){
            return;
          }else{
            lock=true;
            const a=first.dataset.sym, b=el.dataset.sym;
            if(a===b){
              first.classList.add('matched');
              el.classList.add('matched');
              matched++;
              if(matched===6){
                const ms=Date.now()-start;
                const score=Math.max(10, Math.round(100000/ms)); // rough
                oracleTrack('captcha_minigame', {game:'rune_match', time_ms:ms, score});
                if(matchMsg) matchMsg.textContent=`Complete in ${(ms/1000).toFixed(1)}s • score ${score}`;
              }else{
                if(matchMsg) matchMsg.textContent=`Matched ${matched}/6`;
              }
              lock=false;
              first=null;
            }else{
              setTimeout(()=>{
                first.classList.remove('revealed');
                el.classList.remove('revealed');
                first.textContent='?';
                el.textContent='?';
                lock=false;
                first=null;
              }, 550);
            }
          }
        });
        matchGrid.appendChild(el);
      });
      if(matchMsg) matchMsg.textContent='Find all pairs.';
    }
    build();
    matchReset?.addEventListener('click', build);
  }

  // Glyph Trace
  if(traceBoard){
    // simple path 1->2->3->4->5->6 on chosen nodes
    const nodes=[1,2,3,4,5,6];
    const positions=[0,7,14,21,28,35]; // deterministic diagonal-ish in 6x6
    let step=0;
    const start=Date.now();
    function render(){
      traceBoard.innerHTML='';
      for(let i=0;i<36;i++){
        const el=document.createElement('div');
        el.className='traceNode';
        const nIndex=positions.indexOf(i);
        if(nIndex!==-1){
          const label=String(nodes[nIndex]);
          el.textContent=label;
          if(nIndex===step) el.classList.add('active');
          if(nIndex<step) el.classList.add('done');
          el.addEventListener('click', ()=>{
            if(nIndex===step){
              step++;
              if(step>=nodes.length){
                const ms=Date.now()-start;
                const score=Math.max(10, Math.round(80000/ms));
                oracleTrack('captcha_minigame', {game:'glyph_trace', time_ms:ms, score});
                if(traceMsg) traceMsg.textContent=`Complete in ${(ms/1000).toFixed(1)}s • score ${score}`;
              }else{
                if(traceMsg) traceMsg.textContent=`Good. Next: ${step+1}`;
              }
              render();
            }else{
              oracleTrack('captcha_minigame_fail', {game:'glyph_trace', clicked: label, expected: String(step+1)});
              if(traceMsg) traceMsg.textContent=`Miss. Expected ${step+1}.`;
            }
          });
        }else{
          el.textContent='';
        }
        traceBoard.appendChild(el);
      }
    }
    render();
    traceReset?.addEventListener('click', ()=>{
      step=0;
      if(traceMsg) traceMsg.textContent='Start at node 1.';
      render();
    });
  }
}

function getRegion(){
  return localStorage.getItem('vallis_region') || 'GLOBAL';
}
function setRegion(r){
  localStorage.setItem('vallis_region', r);
  oracleTrack('region_set', {region:r});
}
async function loadRegionsData(){
  try{
    const res = await fetch('data/regions.json').catch(()=>null);
    if(res && res.ok) return await res.json();
  }catch(e){}
  return null;
}
function initRegionBadge(){
  const el = document.getElementById('regionBadge');
  if(!el) return;
  const r = getRegion();
  el.textContent = r;
}
async function initRegionPage(){
  const current = document.getElementById('regionCurrent');
  const box = document.getElementById('regionRpmBox');
  if(!current && !box) return;
  const data = await fetch('../data/regions.json').then(r=>r.json()).catch(()=>null);
  const r = getRegion();
  if(current) current.textContent = r;
  if(box && data && data[r]){
    const rr = data[r].rpm_range;
    box.innerHTML = `<b>${r}</b> — estimated RPM range: <b>$${rr[0]}–$${rr[1]}</b><br/><span class="muted">${escapeHtml(data[r].note||'')}</span>`;
  }
  document.querySelectorAll('[data-region]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const nr = btn.getAttribute('data-region');
      setRegion(nr);
      if(current) current.textContent = nr;
      if(box && data && data[nr]){
        const rr = data[nr].rpm_range;
        box.innerHTML = `<b>${nr}</b> — estimated RPM range: <b>$${rr[0]}–$${rr[1]}</b><br/><span class="muted">${escapeHtml(data[nr].note||'')}</span>`;
      }
    });
  });
}

function dayKeyUTC(){
  const d = new Date();
  const y = d.getUTCFullYear();
  const start = Date.UTC(y,0,0);
  const diff = (Date.UTC(y,d.getUTCMonth(),d.getUTCDate())-start)/86400000;
  return `${y}-${Math.floor(diff)}`;
}
function getOracleEvents(){
  try{ return JSON.parse(localStorage.getItem('oracle_events_v2_1')||'[]'); }catch(e){ return []; }
}
function setOracleEvents(arr){
  localStorage.setItem('oracle_events_v2_1', JSON.stringify(arr.slice(-2000)));
}
function issueLocalVerifierToken(confidence){
  const dk = dayKeyUTC();
  const key = 'vallis_verifier_token_'+dk;
  if(localStorage.getItem(key)) return localStorage.getItem(key);
  const seed = (localStorage.getItem('oracle_device_key')||'dev') + '|' + dk + '|' + confidence;
  const tok = 'VERIFIED_LOCAL_' + dk + '_' + (sha256(seed).slice(0,16));
  localStorage.setItem(key, tok);
  return tok;
}
function computeVerifier(){
  const dk = dayKeyUTC();
  const ev = getOracleEvents().filter(e => (e && e.ts && (String(e.dayKey||'')===dk || true)));
  // only consider last 24h
  const now = Date.now();
  const last24 = ev.filter(e => (now - (e.ts||0)) <= 24*3600*1000);

  let plays=0, completes=0, fails=0;
  let accuracySum=0, accCount=0;
  let timeSum=0, timeCount=0;

  last24.forEach(e=>{
    if(e.type==='captcha_minigame'){ plays++; }
    if(e.type==='captcha_minigame_complete'){ completes++; }
    if(e.type==='captcha_minigame_fail'){ fails++; }
    // accept both generic and per-trial payload formats
    const p = e.payload||{};
    if(typeof p.accuracy==='number'){ accuracySum += Math.max(0, Math.min(1, p.accuracy)); accCount++; }
    if(typeof p.time_ms==='number'){ timeSum += Math.max(0, p.time_ms); timeCount++; }
  });

  // derive confidence:
  // base from completion ratio + accuracy, penalize fails, reward more trials up to 6
  const completionRatio = plays ? (completes/plays) : 0;
  const acc = accCount ? (accuracySum/accCount) : 0.6; // default modest
  // time score: assume good under 35s avg, degrade to 0 by 120s
  let tScore = 0.6;
  if(timeCount){
    const avg = timeSum/timeCount;
    tScore = 1 - (Math.max(0, Math.min(120000, avg) - 35000) / (120000-35000));
  }
  const trialFactor = Math.min(1, plays/6);
  const failPenalty = Math.min(0.35, fails*0.08);

  let conf = (0.35*completionRatio + 0.4*acc + 0.25*tScore) * (0.7 + 0.3*trialFactor) - failPenalty;
  conf = Math.max(0, Math.min(1, conf));
  const confidence = Math.round(conf*100);

  const eligible = (plays >= 2 && confidence >= 70);
  const token = eligible ? issueLocalVerifierToken(confidence) : null;

  return {plays, completes, fails, confidence, eligible, token, dayKey: dk};
}
function initHomepagePortal(){
  const featureEl = document.getElementById('featuredAssetImg');
  const tagEl = document.getElementById('featuredAssetTag');
  const rotateBtn = document.getElementById('featuredRotate');
  if(!featureEl || !tagEl) return;

  const assets = (window.VALLIS_ASSETS||[]);
  if(!assets.length) return;

  const dk = dayKeyUTC();
  const seed = (localStorage.getItem('oracle_device_key')||'dev') + '|' + dk;
  const h = sha256(seed);
  let idx = parseInt(h.slice(0,8),16) % assets.length;

  function setIdx(i){
    idx = (i+assets.length)%assets.length;
    const a = assets[idx];
    featureEl.src = a;
    // infer tag
    let label = 'Featured Asset';
    if(a.includes('/omens/')) label='Omen';
    else if(a.includes('/glyphs/')) label='Glyph';
    tagEl.innerHTML = `<b>${label}</b><div class="muted">${escapeHtml(a.split('/').slice(-1)[0])}</div>`;
    oracleTrack('featured_asset_view', {asset:a, label});
  }
  setIdx(idx);

  if(rotateBtn){
    rotateBtn.addEventListener('click', ()=> setIdx(idx+1));
  }
}
function initVerifierUI(){
  const box = document.getElementById('verifierBox');
  if(!box) return;
  const v = computeVerifier();
  const confEl = document.getElementById('verifierConfidence');
  const playsEl = document.getElementById('verifierPlays');
  const bar = document.getElementById('verifierBar');
  const status = document.getElementById('verifierStatus');
  const tokenEl = document.getElementById('verifierToken');

  if(confEl) confEl.textContent = v.confidence + '/100';
  if(playsEl) playsEl.textContent = String(v.plays);
  if(bar) bar.style.width = v.confidence + '%';
  if(status){
    status.innerHTML = v.eligible
      ? `✅ Local verification eligible today <span class="muted">(platform-wide receipts coming soon)</span>`
      : `Coming Soon: platform validator <span class="muted">— complete ≥2 trials with strong pattern score</span>`;
  }
  if(tokenEl){
    tokenEl.textContent = v.token ? v.token : '—';
  }
}

// Store Oracle events locally (static build) for verifier + analytics
(function(){
  if(typeof oracleTrack !== 'function') return;
  const _ot = oracleTrack;
  window.oracleTrackStored = function(type, payload){
    try{
      const ev = getOracleEvents();
      ev.push({type, payload: payload||{}, ts: Date.now(), dayKey: dayKeyUTC()});
      setOracleEvents(ev);
    }catch(e){}
    return _ot(type, payload);
  };
  // swap
  window.oracleTrack = window.oracleTrackStored;
})();

function oracleTrialStart(name){
  try{ localStorage.setItem('trial_start_'+name, String(Date.now())); }catch(e){}
  oracleTrack('captcha_minigame', {name});
}
function oracleTrialComplete(name, accuracy){
  let t = null;
  try{
    const s = parseInt(localStorage.getItem('trial_start_'+name)||'0',10);
    if(s) t = Date.now()-s;
  }catch(e){}
  const payload = {name, accuracy: (typeof accuracy==='number'? accuracy: null), time_ms: t};
  oracleTrack('captcha_minigame_complete', payload);
}
function oracleTrialFail(name){
  oracleTrack('captcha_minigame_fail', {name});
}
