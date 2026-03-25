/* CoinFlip Theme Shell v1
   - effects are toggleable
   - dot grid is finite + anchored
   - settings dropdown lives next to reduce motion
*/

function $(id){ return document.getElementById(id); }

const FX = {
  dots: true,
  runes: true,
  grain: true,
  orbs: true,
  orbMotion: true,
  cardFloat: true,
  orbInteract: true,
  clickPulse: true,
  spotlight: true,
  parallax: true,
  glyphs: true,
  vignette: true,
  reveal: true,
  density: "med",
  debug: false
};

function applyFx(){
  const h = document.documentElement;
  h.classList.toggle("fx-no-dots", !FX.dots);
  h.classList.toggle("fx-no-runes", !FX.runes);
  $("fx-grain").style.display = FX.grain ? "block" : "none";
  $("fx-vignette").style.display = FX.vignette ? "block" : "none";
  $("fx-orbs").style.display = FX.orbs ? "block" : "none";
  document.documentElement.classList.toggle("fx-orb-motion-off", !FX.orbMotion);
  h.classList.toggle("fx-no-reveal", !FX.reveal);
  h.classList.toggle("fx-no-orbs", !FX.orbs);
  h.classList.toggle("fx-no-card-float", !FX.cardFloat);
  h.classList.toggle("fx-no-clickpulse", !FX.clickPulse);
  h.classList.toggle("fx-spotlight-on", !!FX.spotlight);
  h.classList.toggle("fx-parallax-on", !!FX.parallax);
  h.classList.toggle("fx-glyphs-on", !!FX.glyphs);

  $("fxDebugOut").classList.toggle("show", FX.debug);
}

function setupControls(){
  const panel = $("ctlPanel");
  const btn = $("ctlSettings");
  const reduceBtn = $("ctlReduceMotion");
  const themeBtn = $("ctlTheme");
  const themeSelect = $("themeSelect");

  btn.addEventListener("click", ()=>{
    panel.classList.toggle("open");
    panel.setAttribute("aria-hidden", panel.classList.contains("open") ? "false" : "true");
  });

  // click outside closes panel
  document.addEventListener("click", (e)=>{
    if(!panel.classList.contains("open")) return;
    const inPanel = panel.contains(e.target);
    const inBtn = btn.contains(e.target);
    if(!inPanel && !inBtn){
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  });

  reduceBtn.addEventListener("click", ()=>{
    document.documentElement.classList.toggle("reduce-motion");
    // restart animation loop if turning motion back on
    if(!document.documentElement.classList.contains('reduce-motion')){
      Effects.tick();
      Orbs.start();
      WindowDrift.start();
    }
  });

  function setTheme(mode){
    const h = document.documentElement;
    h.classList.remove("theme-ritual","theme-orbs");
    h.classList.add(mode === "orbs" ? "theme-orbs" : "theme-ritual");
    if(themeSelect) themeSelect.value = mode;
  }

  if(themeSelect){
    themeSelect.addEventListener("change", (e)=>{ setTheme(e.target.value); });
  }

  themeBtn.addEventListener("click", ()=>{
    // cycle themes for quick access
    const h = document.documentElement;
    const nowOrbs = h.classList.contains("theme-orbs");
    setTheme(nowOrbs ? "ritual" : "orbs");
  });

  // toggles
  $("fxDots").addEventListener("change", (e)=>{ FX.dots = e.target.checked; applyFx(); });
  $("fxRunes").addEventListener("change", (e)=>{ FX.runes = e.target.checked; applyFx(); });
  $("fxGrain").addEventListener("change", (e)=>{ FX.grain = e.target.checked; applyFx(); });
  $("fxVignette").addEventListener("change", (e)=>{ FX.vignette = e.target.checked; applyFx(); });
  $("fxReveal").addEventListener("change", (e)=>{ FX.reveal = e.target.checked; applyFx(); });

  $("fxDensity").addEventListener("change", (e)=>{
    FX.density = e.target.value;
    Effects.reset();
  Orbs.reset();
    Orbs.reset();
    Orbs.reset(); // rebuild orbs layout
  });

  $("fxDebug").addEventListener("change", (e)=>{
    FX.debug = e.target.checked;
    applyFx();
  });

  $("fxReset").addEventListener("click", ()=>{
    Effects.reset();
  });

  applyFx();
}

/* -------------------- Scroll reveals -------------------- */
function bootReveals(){
  if(!FX.reveal) return;
  const nodes = document.querySelectorAll(".card, .heroCard, .testerShell, .footer");
  nodes.forEach(n=>n.classList.add("reveal"));
  const io = new IntersectionObserver((entries)=>{
    for(const e of entries){
      if(e.isIntersecting) e.target.classList.add("in");
    }
  }, {threshold: 0.12});
  nodes.forEach(n=>io.observe(n));
}

/* reveal css injected via class (simple) */
(function injectRevealCSS(){
  const s = document.createElement("style");
  s.textContent = `
    .reveal{ opacity: 0; transform: translateY(10px); transition: opacity 520ms ease, transform 520ms ease; }
    .reveal.in{ opacity: 1; transform: none; }
    html.reduce-motion .reveal{ opacity:1 !important; transform:none !important; }
    html.fx-no-reveal .reveal{ opacity:1 !important; transform:none !important; }
  `;
  document.head.appendChild(s);
})();

/* -------------------- Effects engine -------------------- */
const Effects = (function(){
  const gridCanvas = $("fx-grid");
  const runeCanvas = $("fx-runes");
  const gctx = gridCanvas.getContext("2d");
  const rctx = runeCanvas.getContext("2d");

  let dpr = 1;
  let W = 0, H = 0;
  let dots = [];
  let runes = [];
  let mouse = {x:0,y:0, active:false, down:false};
  let stats = {frames:0, dots:0, runes:0, last:0};

  function resize(){
    dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = gridCanvas.getBoundingClientRect();
    W = Math.floor(rect.width * dpr);
    H = Math.floor(rect.height * dpr);
    gridCanvas.width = W; gridCanvas.height = H;
    runeCanvas.width = W; runeCanvas.height = H;
  }

  function densityToGrid(){
    // bounded counts
    if(FX.density === "low") return {cols: 12, rows: 7};
    if(FX.density === "high") return {cols: 18, rows: 10};
    return {cols: 15, rows: 8}; // med
  }

  function spawnDots(){
    dots = [];
    const {cols, rows} = densityToGrid();
    const cellW = W / cols;
    const cellH = H / rows;

    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const x0 = (c + 0.5) * cellW + (Math.random()-0.5) * cellW * 0.20;
        const y0 = (r + 0.5) * cellH + (Math.random()-0.5) * cellH * 0.20;
        const base = (Math.random()*0.6 + 0.20)*dpr;
        const ang = Math.random()*Math.PI*2;
        dots.push({
          x0, y0,
          x: x0, y: y0,
          r: (Math.random()*2.2 + 0.8)*dpr,
          vx: Math.cos(ang)*base,
          vy: Math.sin(ang)*base*0.55,
          a: Math.random()*0.18 + 0.06
        });
      }
    }
    stats.dots = dots.length;
  }

  function spawnRunes(){
    runes = [];
    // very light
    const count = FX.density === "high" ? 10 : (FX.density === "low" ? 5 : 7);
    const glyphs = ["⛧","⟡","✶","✦","✺","✹","✷"];
    for(let i=0;i<count;i++){
      runes.push({
        x: Math.random()*W,
        y: Math.random()*H,
        s: (Math.random()*12 + 10)*dpr,
        g: glyphs[Math.floor(Math.random()*glyphs.length)],
        vx: (Math.random()-0.5) * 0.08 * dpr,
        vy: (Math.random()-0.5) * 0.05 * dpr,
        a: Math.random()*0.09 + 0.03
      });
    }
    stats.runes = runes.length;
  }

  function drawGrid(){
    gctx.clearRect(0,0,W,H);
    if(!FX.dots) return;

    const repelR = 175 * dpr;
    const repelR2 = repelR*repelR;
    const drag = mouse.down ? 0.984 : 0.993;
    const springK = 0.0022 * dpr;
    const vmin = 0.05 * dpr;
    const vmax = 1.35 * dpr;

    for(const p of dots){
      p.x += p.vx;
      p.y += p.vy;

      // spring home
      const hx = p.x0 - p.x;
      const hy = p.y0 - p.y;
      p.vx += hx * springK;
      p.vy += hy * springK;

      // cursor repel
      if(mouse.active){
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx*dx + dy*dy;
        if(d2 < repelR2 && d2 > 0.0001){
          const d = Math.sqrt(d2);
          const push = (1 - d/repelR) * 0.50 * dpr;
          p.vx += (dx/d) * push;
          p.vy += (dy/d) * push;
        }
      }

      // friction
      p.vx *= drag;
      p.vy *= drag;

      // clamp speed
      const v = Math.hypot(p.vx, p.vy);
      if(v < vmin){
        const ang = Math.random()*Math.PI*2;
        p.vx += Math.cos(ang)*vmin;
        p.vy += Math.sin(ang)*vmin;
      } else if(v > vmax){
        p.vx = (p.vx/v)*vmax;
        p.vy = (p.vy/v)*vmax;
      }

      // draw
      gctx.beginPath();
      gctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      gctx.fillStyle = `rgba(255,255,255,${p.a})`;
      gctx.fill();
    }
  }

  function drawRunes(){
    rctx.clearRect(0,0,W,H);
    if(!FX.runes) return;
    rctx.textAlign = "center";
    rctx.textBaseline = "middle";
    for(const r of runes){
      r.x += r.vx;
      r.y += r.vy;

      // wrap
      if(r.x < -40*dpr) r.x = W + 40*dpr;
      if(r.x > W + 40*dpr) r.x = -40*dpr;
      if(r.y < -40*dpr) r.y = H + 40*dpr;
      if(r.y > H + 40*dpr) r.y = -40*dpr;

      rctx.font = `${Math.floor(r.s)}px ui-sans-serif`;
      rctx.fillStyle = `rgba(215,160,255,${r.a})`;
      rctx.fillText(r.g, r.x, r.y);
    }
  }

  function tick(){
    const reduce = document.documentElement.classList.contains('reduce-motion');
    if(reduce){
      // draw a still frame (no animation loop)
      drawGrid();
      drawRunes();
      pingValidator();
      return;
    }

    stats.frames++;
    drawGrid();
    drawRunes();
    pingValidator();
    requestAnimationFrame(tick);
  }

  function pingValidator(){
    if(!FX.debug) return;
    const out = $("fxDebugOut");
    const now = performance.now();
    if(now - stats.last < 250) return;
    stats.last = now;

    out.textContent =
`dot-grid validator
  canvas: ${W}×${H} @dpr ${dpr.toFixed(2)}
  dots: ${stats.dots}   runes: ${stats.runes}
  frames: ${stats.frames}
  density: ${FX.density}
  mouse: ${mouse.active ? "active" : "idle"} ${mouse.down ? "(down)" : ""}`;
  }

  function bindMouse(){
    const toDpr = (ev)=>({x: ev.clientX*dpr, y: ev.clientY*dpr});
    window.addEventListener("mousemove", (ev)=>{ const p = toDpr(ev); mouse.x=p.x; mouse.y=p.y; mouse.active=true; }, {passive:true});
    window.addEventListener("mouseleave", ()=>{ mouse.active=false; }, {passive:true});
    window.addEventListener("mousedown", ()=>{ mouse.down=true; }, {passive:true});
    window.addEventListener("mouseup", ()=>{ mouse.down=false; }, {passive:true});
  }

  function reset(){
    resize();
    spawnDots();
    spawnRunes();
  }

  return { reset, resize, bindMouse, tick };
})();

/* -------------------- Chips interactions (theme shell) -------------------- */
function bootChips(){
  document.querySelectorAll(".chip[data-chip]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".chip[data-chip]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  document.querySelectorAll(".chip[data-side]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".chip[data-side]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

/* -------------------- Boot -------------------- */
(function boot(){
  setupControls();
  bootChips();

  // effects
  Effects.bindMouse();
  Effects.reset();
  Effects.tick();
      Orbs.start();
      WindowDrift.start();

  // reveals
  bootReveals();
})();


/* Smooth scrolling (respects reduced motion) */
function smoothScrollTo(id){
  const el = document.querySelector(id);
  if(!el) return;
  const reduce = document.documentElement.classList.contains("reduce-motion");
  el.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"});
}
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener("click", (e)=>{
    const href = a.getAttribute("href");
    if(!href || href === "#") return;
    const target = href;
    if(document.querySelector(target)){
      e.preventDefault();
      smoothScrollTo(target);
      history.replaceState(null, "", target);
    }
  });
});


/* -------------------- Orbs engine (div-based, lightweight) -------------------- */
const Orbs = (function(){
  const root = $("fx-orbs");
  let orbs = [];
  let raf = null;
  let last = 0;

  function clear(){
    orbs = [];
    if(root) root.innerHTML = "";
    if(raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function spawn(){
    if(!root) return;
    root.innerHTML = "";
    orbs = [];

    const W = window.innerWidth;
    const H = window.innerHeight;

    // 3 main rings like your screenshot: one big top-right, one big center, one medium bottom-left
    const presets = [
      {cls:"orb big", x: W*0.58, y: H*0.08, vx: 0.010, vy: 0.006},
      {cls:"orb big", x: W*0.44, y: H*0.52, vx: -0.007, vy: 0.009},
      {cls:"orb med", x: W*0.18, y: H*0.62, vx: 0.008, vy: -0.006},
    ];

    // plus a few subtle extras depending on density
    const extraCount = (FX.density === "high") ? 4 : (FX.density === "low" ? 1 : 2);
    for(let i=0;i<extraCount;i++){
      presets.push({
        cls: "orb sm",
        x: Math.random()*W,
        y: Math.random()*H,
        vx: (Math.random()-0.5)*0.012,
        vy: (Math.random()-0.5)*0.010
      });
    }

    for(const p of presets){
      const el = document.createElement("div");
      el.className = p.cls;
      root.appendChild(el);
      orbs.push({el, x:p.x, y:p.y, vx:p.vx, vy:p.vy, ax:0, ay:0});
    }
  }

  function step(ts){
    const reduce = document.documentElement.classList.contains("reduce-motion");
    if(reduce || !FX.orbMotion || !FX.orbs){
      raf = null;
      return;
    }
    if(!last) last = ts;
    const dt = Math.min(32, ts-last);
    last = ts;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // very gentle "home" pull so they don't drift away
    const homeK = 0.00002;
    const drag = 0.9992;

    for(const o of orbs){
      // home point is initial layout area (keep within screen)
      const hx = (o.x < W*0.5) ? W*0.35 : W*0.62;
      const hy = (o.y < H*0.5) ? H*0.30 : H*0.60;

      const dx = hx - o.x;
      const dy = hy - o.y;
      o.vx += dx * homeK * dt;
      o.vy += dy * homeK * dt;

      o.x += o.vx * dt;
      o.y += o.vy * dt;

      o.vx *= drag;
      o.vy *= drag;

      // wrap softly
      if(o.x < -500) o.x = W + 500;
      if(o.x > W + 500) o.x = -500;
      if(o.y < -500) o.y = H + 500;
      if(o.y > H + 500) o.y = -500;

      // translate, centered by half size via CSS (we'll use translate(-50%,-50%) here)
      o.el.style.transform = `translate3d(${o.x}px, ${o.y}px, 0) translate(-50%, -50%)`;
    }

    raf = requestAnimationFrame(step);
  }

  function start(){
    if(raf) return;
    last = 0;
    raf = requestAnimationFrame(step);
  }

  function reset(){
    clear();
    spawn();
    // position once
    for(const o of orbs){
      o.el.style.transform = `translate3d(${o.x}px, ${o.y}px, 0) translate(-50%, -50%)`;
    }
    start();
  }

  return { reset, start, clear };
})();


/* -------------------- Live tester (pool tiers + two-way odds) -------------------- */
const DemoFlip = (function(){
  const HOUSE_EDGE_TARGET = 0.03; // 3% target house edge (planner; not a guarantee)
  const MIN_P = 0.40;

  const POOLS = [
    // Each pool includes tier gates (min liquidity required for each preset bet)
    { id:'none', name:'Select pool…', liquidity:0, alpha:0, fee:0, pMax:0.47, gates:{1:0,5:0,10:0} },
    { id:'bloodmoon', name:'BloodMoon • ETH/USDC (TVL $10k) — $1/$5/$10', liquidity:10000, alpha:0.0025, fee:0.01, pMax:0.47, gates:{1:200,5:1200,10:2200} },
    { id:'sigil',     name:'Sigil Vault • ETH/USDC (TVL $5k) — $1/$5',      liquidity:5000,  alpha:0.0025, fee:0.012, pMax:0.46, gates:{1:200,5:1200,10:999999} },
    { id:'bones',     name:'Bone Pile • ETH/USDC (TVL $2k) — $1 only',       liquidity:2000,  alpha:0.0020, fee:0.01,  pMax:0.47, gates:{1:200,5:999999,10:999999} },
    { id:'embers',    name:'Ember Cup • Small pool (TVL $900) — $1 (tight)', liquidity:900,   alpha:0.0015, fee:0.015, pMax:0.45, gates:{1:500,5:999999,10:999999} },
    { id:'dust',      name:'Dust Bowl • Too small (TVL $120) — locked',      liquidity:120,   alpha:0.0010, fee:0.02,  pMax:0.44, gates:{1:200,5:999999,10:999999} }
  ];

  let selectedPool = POOLS[0];
  let bet = 1;
  let side = 'heads';

  // live state
  let balanceStart = 50;
  let balance = 50;
  let flips = 0;
  let wins = 0;
  let losses = 0;
  const points = []; // {x, y, win}

  function el(id){ return document.getElementById(id); }
  function qa(sel){ return Array.from(document.querySelectorAll(sel)); }
  function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
  function money(n){
    if(!Number.isFinite(n)) return 'N/A';
    return '$' + (Math.round(n*100)/100).toFixed(2);
  }
  function pct(n){
    if(!Number.isFinite(n)) return 'N/A';
    return (n*100).toFixed(2) + '%';
  }

  function readNumber(input, fallback){
    if(!input) return fallback;
    const v = parseFloat(String(input.value ?? '').trim());
    return Number.isFinite(v) ? v : fallback;
  }

  // Two-way mapping between win probability p and profit multiplier m
  // EV = p*(bet*(1-fee)*m) - (1-p)*bet = -edge*bet
  // m(p) = ((1-p) - edge) / (p*(1-fee))
  // p(m) = (1-edge) / (1 + (1-fee)*m)
  function mFromP(p, fee){
    const denom = p * Math.max(1e-6, (1 - fee));
    return ((1 - p) - HOUSE_EDGE_TARGET) / denom;
  }
  function pFromM(m, fee){
    return (1 - HOUSE_EDGE_TARGET) / (1 + (1 - fee) * m);
  }

  function getFee(){ return selectedPool?.fee ?? 0.01; }
  function getAlpha(){ return selectedPool?.alpha ?? 0.0025; }

  function getP(){
    const pEl = el('playerWinProb');
    const p = clamp(readNumber(pEl, selectedPool?.pMax ?? 0.47)/100, 0, 1);
    return clamp(p, MIN_P, selectedPool?.pMax ?? 0.47);
  }
  function setP(p){
    const pEl = el('playerWinProb');
    const pNum = el('playerWinProbNum');
    const pClamped = clamp(p, MIN_P, selectedPool?.pMax ?? 0.47);
    if(pEl){ pEl.value = (pClamped*100).toFixed(2); }
    if(pNum){ pNum.value = (pClamped*100).toFixed(2); }
  }

  function getM(){
    const mEl = el('profitMult');
    const mNum = el('profitMultNum');
    const m = clamp(readNumber(mEl, 1.0), 0.05, 4.0);
    if(mNum && mNum.value !== m.toFixed(2)) mNum.value = m.toFixed(2);
    return m;
  }
  function setM(m){
    const mEl = el('profitMult');
    const mNum = el('profitMultNum');
    const mC = clamp(m, 0.05, 4.0);
    if(mEl){ mEl.value = mC.toFixed(2); }
    if(mNum){ mNum.value = mC.toFixed(2); }
  }

  function computeSafeMaxBet(){
    if(!selectedPool || selectedPool.id === 'none') return NaN;
    const L = selectedPool.liquidity;
    const alpha = getAlpha();
    const fee = getFee();
    const m = getM();
    const mult = (1 - fee) * (1 + m);
    if(mult <= 0) return 0;
    return (L * alpha) / mult;
  }

  function updateQuotePreview(){
    const fee = getFee();
    const p = getP();
    const m = getM();
    const betAfterFee = bet * (1 - fee);
    const winReturn = betAfterFee * (1 + m);
    const feeAmt = bet * fee;
    // preview box
    if(el('qBet')) el('qBet').textContent = money(bet);
    if(el('qFee')) el('qFee').textContent = money(feeAmt);
    if(el('qWinReturn')) el('qWinReturn').textContent = money(winReturn);
    if(el('qWinChance')) el('qWinChance').textContent = pct(p);
    if(el('qAlpha')) el('qAlpha').textContent = pct(getAlpha());

    // pool stats
    if(el('poolLiquidityVal')) el('poolLiquidityVal').textContent = selectedPool.id==='none' ? 'N/A' : money(selectedPool.liquidity);
    if(el('poolAlphaVal')) el('poolAlphaVal').textContent = selectedPool.id==='none' ? 'N/A' : pct(getAlpha());
    if(el('poolFeeVal')) el('poolFeeVal').textContent = selectedPool.id==='none' ? 'N/A' : pct(fee);
    if(el('poolProbVal')) el('poolProbVal').textContent = selectedPool.id==='none' ? 'N/A' : pct(selectedPool.pMax ?? p);
    if(el('poolProfitMult')) el('poolProfitMult').textContent = selectedPool.id==='none' ? 'N/A' : '×' + m.toFixed(2);
    if(el('poolEdgeVal')) el('poolEdgeVal').textContent = '≈ ' + pct(HOUSE_EDGE_TARGET);

    // topline
    if(el('poolTVL')) el('poolTVL').textContent = selectedPool.id==='none' ? 'N/A' : money(selectedPool.liquidity);
    const safe = computeSafeMaxBet();
    if(el('poolSafeMaxBet')) el('poolSafeMaxBet').textContent = selectedPool.id==='none' ? 'N/A' : money(safe);
  }

  function applyTwoWayFromP(){
    const fee = getFee();
    const p = getP();
    const m = mFromP(p, fee);
    setM(m);
    updateBetGates();
    updateQuotePreview();
  }
  function applyTwoWayFromM(){
    const fee = getFee();
    const m = getM();
    const p = pFromM(m, fee);
    setP(p);
    updateBetGates();
    updateQuotePreview();
  }

  function updateBetGates(){
    const hint = el('betGateHint');
    const safe = computeSafeMaxBet();
    const poolOk = selectedPool && selectedPool.id !== 'none';

    qa('.betBtn').forEach(btn=>{
      const v = parseFloat(btn.dataset.bet);
      const needs = (selectedPool?.gates?.[v] ?? 999999);
      const okTier = poolOk && selectedPool.liquidity >= needs;
      const okCap = poolOk && Number.isFinite(safe) && v <= safe;
      const ok = okTier && okCap;
      btn.disabled = !ok;
      btn.style.opacity = ok ? '' : '0.38';
      btn.style.cursor = ok ? '' : 'not-allowed';
    });

    const activeBetBtn = document.querySelector('.betBtn.active');
    if(activeBetBtn && activeBetBtn.disabled){
      // fallback to the smallest enabled bet
      const firstEnabled = qa('.betBtn').find(b=>!b.disabled);
      if(firstEnabled) selectBet(parseFloat(firstEnabled.dataset.bet));
    }

    const canFlip = poolOk && balance >= bet && !(document.querySelector('.betBtn.active')?.disabled);
    const btnFlip = el('btnFlip');
    if(btnFlip){
      btnFlip.disabled = !canFlip;
      btnFlip.title = !poolOk ? 'Select a pool first' : (balance < bet ? 'Not enough balance' : (document.querySelector('.betBtn.active')?.disabled ? 'Preset locked' : ''));
      btnFlip.style.opacity = canFlip ? '1' : '0.48';
    }

    if(hint){
      if(!poolOk) hint.textContent = 'Select a pool/coin to compute TVL + safe max bet. Presets lock automatically by tier + α cap.';
      else hint.textContent = `TVL ${money(selectedPool.liquidity)} • Safe max bet ${money(safe)} • p≤${pct(selectedPool.pMax)} • fee ${pct(getFee())}`;
    }
  }

  function selectBet(v){
    bet = v;
    qa('.betBtn').forEach(b=> b.classList.toggle('active', parseFloat(b.dataset.bet)===v));
    updateBetGates();
    updateQuotePreview();
  }
  function selectSide(s){
    side = s;
    qa('.sideBtn').forEach(b=> b.classList.toggle('active', b.dataset.side===s));
  }

  function resetRun(){
    const startEl = el('startBalance');
    balanceStart = clamp(readNumber(startEl, 50), 0, 1e12);
    balance = balanceStart;
    flips = 0; wins = 0; losses = 0;
    points.length = 0;
    points.push({x:0, y:balance, win:null});
    writeRunStats();
    drawChart();
    updateBetGates();
  }

  function writeRunStats(){
    if(el('balanceNow')) el('balanceNow').textContent = money(balance);
    if(el('flipsCount')) el('flipsCount').textContent = String(flips);
    if(el('winsCount')) el('winsCount').textContent = String(wins);
    if(el('lossesCount')) el('lossesCount').textContent = String(losses);
  }

  function drawChart(){
    const c = el('balanceChart');
    if(!c) return;
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    ctx.clearRect(0,0,w,h);
    // background
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = 1;

    if(points.length < 2) return;
    const ys = points.map(p=>p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = (maxY - minY) * 0.15 + 1;
    const lo = minY - pad;
    const hi = maxY + pad;

    function X(i){ return 16 + i*( (w-32) / Math.max(1, points.length-1) ); }
    function Y(v){ return h - 18 - ((v - lo) / (hi - lo)) * (h-36); }

    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for(let k=1;k<=3;k++){
      const yy = 18 + k*( (h-36)/4 );
      ctx.beginPath(); ctx.moveTo(16,yy); ctx.lineTo(w-16,yy); ctx.stroke();
    }

    // line
    ctx.strokeStyle = 'rgba(255,255,255,0.70)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(points[0].y));
    for(let i=1;i<points.length;i++) ctx.lineTo(X(i), Y(points[i].y));
    ctx.stroke();

    // markers (wins above, losses below)
    for(let i=1;i<points.length;i++){
      const p = points[i];
      if(p.win === null) continue;
      const x = X(i);
      const y = Y(p.y) + (p.win ? -10 : 10);
      ctx.fillStyle = p.win ? 'rgba(215,160,255,0.95)' : 'rgba(255,255,255,0.65)';
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI*2); ctx.fill();
    }
  }

  function appendReceipt(obj){
    const box = el('receiptPreview');
    if(!box) return;
    box.textContent = JSON.stringify(obj, null, 2);
  }

  function flip(){
    if(!selectedPool || selectedPool.id==='none') return;
    updateBetGates();
    const btnFlip = el('btnFlip');
    if(btnFlip && btnFlip.disabled) return;

    const fee = getFee();
    const p = getP();
    const m = getM();
    const alpha = getAlpha();
    const safe = computeSafeMaxBet();

    // debit stake
    balance -= bet;

    const betAfterFee = bet * (1 - fee);
    const winProfit = betAfterFee * m;
    const winReturn = betAfterFee + winProfit;

    const r = Math.random();
    const win = r < p;
    let outcome;
    if(win){
      // force the outcome to match the picked side for the demo
      outcome = side;
      balance += winReturn;
      wins += 1;
    } else {
      outcome = (side === 'heads') ? 'tails' : 'heads';
      losses += 1;
    }
    flips += 1;
    points.push({x:flips, y:balance, win});

    writeRunStats();
    drawChart();
    updateBetGates();

    appendReceipt({
      ts: new Date().toISOString(),
      pool: selectedPool.id,
      tvl: selectedPool.liquidity,
      alpha,
      safeMaxBet: safe,
      bet,
      side,
      outcome,
      win,
      playerWinProb: p,
      profitMult: m,
      feeRate: fee,
      betAfterFee,
      winProfit,
      winReturn,
      balanceAfter: balance
    });
  }

  function bindPoolSelect(){
    const sel = el('poolSelect');
  if(sel){ /* legacy poolSelect (removed in v6.11) */ }
}

  function bindTwoWayControls(){
    const pSlider = el('playerWinProb');
    const pNum = el('playerWinProbNum');
    const mSlider = el('profitMult');
    const mNum = el('profitMultNum');

    function onP(){
      // sync number
      const p = clamp(readNumber(pSlider, (selectedPool?.pMax ?? 0.47)*100)/100, MIN_P, (selectedPool?.pMax ?? 0.47));
      if(pNum) pNum.value = (p*100).toFixed(2);
      applyTwoWayFromP();
    }
    function onPNum(){
      const p = clamp(readNumber(pNum, (selectedPool?.pMax ?? 0.47)*100)/100, MIN_P, (selectedPool?.pMax ?? 0.47));
      if(pSlider) pSlider.value = (p*100).toFixed(2);
      applyTwoWayFromP();
    }
    function onM(){
      const m = getM();
      if(mNum) mNum.value = m.toFixed(2);
      applyTwoWayFromM();
    }
    function onMNum(){
      const m = clamp(readNumber(mNum, 1.0), 0.05, 4.0);
      if(mSlider) mSlider.value = m.toFixed(2);
      applyTwoWayFromM();
    }
    pSlider && pSlider.addEventListener('input', onP);
    pNum && pNum.addEventListener('input', onPNum);
    mSlider && mSlider.addEventListener('input', onM);
    mNum && mNum.addEventListener('input', onMNum);
  }

  function bindUI(){
    qa('.betBtn').forEach(b=> b.addEventListener('click', ()=> selectBet(parseFloat(b.dataset.bet))));
    qa('.sideBtn').forEach(b=> b.addEventListener('click', ()=> selectSide(b.dataset.side)));

    const btnFlip = el('btnFlip');
    btnFlip && btnFlip.addEventListener('click', flip);
    const btnReset = el('btnReset');
    btnReset && btnReset.addEventListener('click', resetRun);
    const startEl = el('startBalance');
    startEl && startEl.addEventListener('change', resetRun);

    bindPoolSelect();
    bindTwoWayControls();

    // defaults
    selectBet(1);
    selectSide('heads');
    setP(0.47);
    setM(1.0);
    resetRun();
    updateQuotePreview();
    updateBetGates();
  }

  return { bindUI };
})();
document.addEventListener('DOMContentLoaded', ()=> DemoFlip.bindUI());


/* -------------------- Orb interaction + click pulses -------------------- */
(function(){
  const pulses = document.getElementById("fx-pulses");
  let pointerDown = false;
  let lastX = 0, lastY = 0, lastT = 0;
  let vX = 0, vY = 0;

  function addPulse(x,y){
    if(!FX.clickPulse || !pulses) return;
    const el = document.createElement("div");
    el.className = "pulse";
    el.style.left = x + "px";
    el.style.top = y + "px";
    pulses.appendChild(el);
    setTimeout(()=> el.remove(), 950);
  }

  function onDown(e){
    if(document.documentElement.classList.contains("reduce-motion")) return;
    pointerDown = true;
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    vX = 0; vY = 0;
    addPulse(lastX, lastY);
  }
  function onMove(e){
    if(!pointerDown) return;
    const t = performance.now();
    const dt = Math.max(8, t-lastT);
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    vX = dx/dt;
    vY = dy/dt;
    lastX = e.clientX; lastY = e.clientY; lastT = t;

    // Apply drag force to orbs (impulse)
    if(FX.orbInteract && typeof Orbs !== "undefined"){
      Orbs.dragImpulse(e.clientX, e.clientY, vX, vY);
    }
  }
  function onUp(){
    pointerDown = false;
  }

  window.addEventListener("pointerdown", onDown, {passive:true});
  window.addEventListener("pointermove", onMove, {passive:true});
  window.addEventListener("pointerup", onUp, {passive:true});
  window.addEventListener("click", (e)=> addPulse(e.clientX, e.clientY), {passive:true});
})();


/* -------------------- Spotlight + parallax pointer handlers -------------------- */
(function(){
  let px=window.innerWidth*0.5, py=window.innerHeight*0.35;
  const root = document.documentElement;
  function setSpot(x,y){
    const X = (x/window.innerWidth*100).toFixed(2)+"%";
    const Y = (y/window.innerHeight*100).toFixed(2)+"%";
    root.style.setProperty("--spotX", X);
    root.style.setProperty("--spotY", Y);
  }
  setSpot(px,py);

  window.addEventListener("pointermove", (e)=>{
    px = e.clientX; py = e.clientY;
    if(FX.spotlight) setSpot(px,py);

    if(FX.parallax && !root.classList.contains("reduce-motion")){
      const targets = document.querySelectorAll(".parallaxTarget");
      const cx = window.innerWidth/2, cy = window.innerHeight/2;
      const dx = (px - cx)/cx;
      const dy = (py - cy)/cy;
      const tiltX = (-dy*4.0);
      const tiltY = (dx*5.0);
      targets.forEach(t=>{
        t.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      });
    } else {
      document.querySelectorAll(".parallaxTarget").forEach(t=> t.style.transform="");
    }
  }, {passive:true});
})();


/* -------------------- Window drift + border glow injection -------------------- */
function injectWindowBorderGlows(){
  document.querySelectorAll(".windowDriftTarget").forEach(el=>{
    if(el.querySelector(".windowBorderGlow")) return;
    const g = document.createElement("div");
    g.className = "windowBorderGlow";
    el.appendChild(g);
  });
}


/* -------------------- Hover window drift engine -------------------- */
const WindowDrift = (function(){
  let raf = null;
  let mx = 0, my = 0;
  let last = 0;

  function onMove(e){ mx = e.clientX; my = e.clientY; }
  function tick(ts){
    const reduce = document.documentElement.classList.contains("reduce-motion");
    if(reduce || !FX.windowDrift){
      raf = null;
      return;
    }
    if(!last) last = ts;
    const dt = Math.min(32, ts - last);
    last = ts;

    const W = window.innerWidth, H = window.innerHeight;

    document.querySelectorAll(".windowDriftTarget").forEach((el, i)=>{
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const cy = r.top + r.height/2;
      const dx = (mx - cx) / Math.max(220, r.width);
      const dy = (my - cy) / Math.max(220, r.height);

      // Only animate if hover-ish proximity (keeps subtle, performant)
      const dist = Math.hypot(mx - cx, my - cy);
      const near = dist < 520;

      if(!near){
        el.style.transform = "";
        return;
      }

      const amp = 10; // px
      const tx = Math.max(-1, Math.min(1, dx)) * amp;
      const ty = Math.max(-1, Math.min(1, dy)) * amp;

      // add a tiny independent "dot drift" wobble
      const wob = 0.6;
      const t = ts * 0.001 + i * 0.7;
      const wx = Math.sin(t) * wob;
      const wy = Math.cos(t*1.13) * wob;

      el.style.transform = `translate3d(${tx + wx}px, ${ty + wy}px, 0)`;
    });

    raf = requestAnimationFrame(tick);
  }

  function start(){
    if(raf) return;
    last = 0;
    window.addEventListener("pointermove", onMove, {passive:true});
    raf = requestAnimationFrame(tick);
  }

  return { start };
})();


/* -------------------- Mock pool profiles + ladder gating -------------------- */
const POOL_PROFILES = [
  {
    "id": "none",
    "name": "Select pool…",
    "coin": "",
    "symbol": "",
    "contract": null,
    "tvl": null,
    "alpha": null,
    "fee": null,
    "vol": null,
    "pMax": 0.47,
    "minTier": {
      "1": 1000000000,
      "5": 1000000000,
      "10": 1000000000
    }
  },
  {
    "id": "bloodmoon",
    "name": "BloodMoon",
    "coin": "WETH / USDC",
    "symbol": "WETH",
    "contract": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "tvl": 10000,
    "alpha": 0.0025,
    "fee": 0.01,
    "vol": 0.035,
    "pMax": 0.47,
    "minTier": {
      "1": 0,
      "5": 0,
      "10": 0
    }
  },
  {
    "id": "sigilvault",
    "name": "Sigil Vault",
    "coin": "PEPE / USDC",
    "symbol": "PEPE",
    "contract": "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    "tvl": 5000,
    "alpha": 0.0025,
    "fee": 0.01,
    "vol": 0.055,
    "pMax": 0.47,
    "minTier": {
      "1": 0,
      "5": 0,
      "10": 999999
    }
  },
  {
    "id": "bonepile",
    "name": "Bone Pile",
    "coin": "MOG / USDC",
    "symbol": "MOG",
    "contract": "0xaaeE1A9723cC2B7cbD1e13D41b1Bf5c74e8Aa0f2",
    "tvl": 2000,
    "alpha": 0.0025,
    "fee": 0.0125,
    "vol": 0.07,
    "pMax": 0.47,
    "minTier": {
      "1": 0,
      "5": 999999,
      "10": 999999
    }
  },
  {
    "id": "embercup",
    "name": "Ember Cup",
    "coin": "JASMY / USDC",
    "symbol": "JASMY",
    "contract": "0x7420B4B9a0110cdc71fb720908340c03f9bc03EC",
    "tvl": 900,
    "alpha": 0.002,
    "fee": 0.015,
    "vol": 0.085,
    "pMax": 0.47,
    "minTier": {
      "1": 0,
      "5": 999999,
      "10": 999999
    }
  },
  {
    "id": "dustbowl",
    "name": "Dust Bowl",
    "coin": "DUST (tiny cap)",
    "symbol": "DUST",
    "contract": "0x000000000000000000000000000000000000dEaD",
    "tvl": 120,
    "alpha": 0.001,
    "fee": 0.02,
    "vol": 0.14,
    "pMax": 0.47,
    "minTier": {
      "1": 999999,
      "5": 999999,
      "10": 999999
    }
  },
  {
    "id": "dungpool",
    "name": "Dung Pool",
    "coin": "DUNG (demo)",
    "symbol": "DUNG",
    "contract": "0x0000000000000000000000000000000000000001",
    "tvl": 1,
    "alpha": 0.001,
    "fee": 0.03,
    "vol": 0.2,
    "pMax": 0.47,
    "minTier": {
      "1": 999999,
      "5": 999999,
      "10": 999999
    }
  }
];

const COIN_CATALOG = [
  {
    "symbol": "WETH",
    "name": "Wrapped Ether",
    "chain": "Ethereum",
    "contract": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  },
  {
    "symbol": "USDC",
    "name": "USD Coin",
    "chain": "Ethereum",
    "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  },
  {
    "symbol": "USDT",
    "name": "Tether USD",
    "chain": "Ethereum",
    "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
  },
  {
    "symbol": "DAI",
    "name": "Dai Stablecoin",
    "chain": "Ethereum",
    "contract": "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  },
  {
    "symbol": "WBTC",
    "name": "Wrapped Bitcoin",
    "chain": "Ethereum",
    "contract": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
  },
  {
    "symbol": "LINK",
    "name": "Chainlink",
    "chain": "Ethereum",
    "contract": "0x514910771AF9Ca656af840dff83E8264EcF986CA"
  },
  {
    "symbol": "UNI",
    "name": "Uniswap",
    "chain": "Ethereum",
    "contract": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
  },
  {
    "symbol": "AAVE",
    "name": "Aave",
    "chain": "Ethereum",
    "contract": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
  },
  {
    "symbol": "PEPE",
    "name": "Pepe",
    "chain": "Ethereum",
    "contract": "0x6982508145454Ce325dDbE47a25d4ec3d2311933"
  },
  {
    "symbol": "SHIB",
    "name": "Shiba Inu",
    "chain": "Ethereum",
    "contract": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE"
  },
  {
    "symbol": "MOG",
    "name": "Mog Coin",
    "chain": "Ethereum",
    "contract": "0xaaeE1A9723cC2B7cbD1e13D41b1Bf5c74e8Aa0f2"
  },
  {
    "symbol": "JASMY",
    "name": "JasmyCoin",
    "chain": "Ethereum",
    "contract": "0x7420B4B9a0110cdc71fb720908340c03f9bc03EC"
  },
  {
    "symbol": "DUST",
    "name": "Dust (tiny cap demo)",
    "chain": "Demo",
    "contract": "0x000000000000000000000000000000000000dEaD"
  },
  {
    "symbol": "DUNG",
    "name": "Dung (dead pool demo)",
    "chain": "Demo",
    "contract": "0x0000000000000000000000000000000000000001"
  }
];

function fmtMoney(n){ return "$" + (Math.round(n*100)/100).toFixed(2); }

function computeSafeMaxBet(pool, feeRate){
  // maxPayout = L * alpha
  const maxPayout = pool.tvl * pool.alpha;
  // winReturn approx = bet*(1-fee)*(1+1) => bet*(1-fee)*2
  return maxPayout / (Math.max(0.0001, (1 - feeRate)) * 2.0);
}

function setBetChipEnabled(bet, enabled, reason){
  const btn = document.querySelector(`.betBtn[data-bet="${bet}"]`);
  if(!btn) return;
  btn.disabled = !enabled;
  btn.title = enabled ? "" : (reason || "Unavailable for this pool.");
  btn.style.opacity = enabled ? "1" : "0.45";
  btn.style.cursor = enabled ? "pointer" : "not-allowed";
}

function refreshPoolUI(){
  // No selection => N/A + lock everything
  const sel = document.getElementById('poolSelect');
  const selectedId = sel ? sel.value : '';
  if(!selectedId){
    setText('poolTVL','N/A');
    setText('poolSafeMaxBet','N/A');
    setText('poolLiquidityVal','N/A');
    setText('poolAlphaVal','N/A');
    setText('poolFeeVal','N/A');
    setText('poolProbVal','N/A');
    [1,5,10].forEach(b=> setBetChipEnabled(b,false,'Select a pool first.'));
    const hint = document.getElementById('betGateHint');
    if(hint) hint.textContent = 'Select a pool to unlock flip presets.';
    const btnFlip = document.getElementById('btnFlip');
    if(btnFlip){ btnFlip.disabled = true; btnFlip.style.opacity = '0.55'; btnFlip.title = 'Select a pool first.'; }
    return;
  }

  if(!sel) return;
  const pool = POOL_PROFILES.find(p=> p.id === selectedId) || POOL_PROFILES[0];
setText('poolLiquidityVal', '$' + pool.tvl.toLocaleString());
setText('poolAlphaVal', fmtPct(pool.alpha));
setText('poolFeeVal', fmtPct(pool.fee));
setText('poolProbVal', fmtPct(pool.p));


  const feeEl = document.getElementById("feeRate");
  if(feeEl && !feeEl.dataset.locked){ feeEl.value = pool.fee; }

  const fee = feeEl ? Math.max(0, Math.min(0.10, parseFloat(feeEl.value))) : 0.01;

  const safe = computeSafeMaxBet(pool, fee);

  const tvlEl = document.getElementById("poolTVL");
  const safeEl = document.getElementById("poolSafeMaxBet");
  if(tvlEl) tvlEl.textContent = fmtMoney(pool.tvl);
  if(safeEl) safeEl.textContent = fmtMoney(safe);

  // Gate $1/$5/$10 by tier + safe cap
  [1,5,10].forEach(b=>{
    const tierOk = pool.tvl >= (pool.minTier[b] || 0);
    const capOk = b <= safe + 1e-9;
    const enabled = tierOk && capOk;
    let reason = "";
    if(!tierOk) reason = `Pool TVL too low for $${b} tier.`;
    else if(!capOk) reason = `Safety cap: safe max bet ${fmtMoney(safe)}.`;
    setBetChipEnabled(b, enabled, reason);
  });
}


function initPoolSelect(){
  const sel = document.getElementById("poolSelect");
  if(!sel) return;

  sel.innerHTML = "";

  // Placeholder "no selection"
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Select a pool…";
  ph.selected = true;
  ph.disabled = true;
  sel.appendChild(ph);

  POOL_PROFILES.forEach(p=>{
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = `${p.name} • ${p.coin}`;
    sel.appendChild(o);
  });

  sel.value = "";
  sel.addEventListener("change", refreshPoolUI);

  // Update when fee slider changes too
  const feeEl = document.getElementById("feeRate");
  if(feeEl) feeEl.addEventListener("input", refreshPoolUI);

  refreshPoolUI(); // will show N/A until a pool is selected
}

document.addEventListener("DOMContentLoaded", ()=> initPoolSelect());


function setText(id, txt){ const el=document.getElementById(id); if(el) el.textContent = txt; }
function fmtPct(x){ return (x*100).toFixed(2) + "%"; }


function globalShockwave(x,y){
  // Orbs impulse (if module supports it)
  if(typeof Orbs !== "undefined" && Orbs.dragImpulse){
    Orbs.dragImpulse(x,y, 18, -12);
  }
  // Particles dot grid impulse (if exists)
  if(typeof Particles !== "undefined" && Particles.kick){
    Particles.kick(x,y);
  }
  // Window drift visual punch
  document.querySelectorAll('.windowDriftTarget').forEach(el=>{
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    const dx = cx - x;
    const dy = cy - y;
    const dist = Math.max(120, Math.hypot(dx,dy));
    const amp = 14 * (1 - Math.min(1, dist/900));
    el.style.setProperty('--sx', (dx/dist*amp).toFixed(2)+'px');
    el.style.setProperty('--sy', (dy/dist*amp).toFixed(2)+'px');
    el.classList.remove('shockwave');
    // reflow
    void el.offsetWidth;
    el.classList.add('shockwave');
  });
}

// Click handler: pulse + shockwave
window.addEventListener('click', (e)=>{
  const pulses = document.getElementById('fx-pulses');
  if(pulses && !(document.documentElement.classList.contains('fx-no-clickpulse'))){
    const el = document.createElement('div');
    el.className = 'pulse';
    el.style.left = e.clientX + 'px';
    el.style.top = e.clientY + 'px';
    pulses.appendChild(el);
    setTimeout(()=> el.remove(), 1000);
  }
  globalShockwave(e.clientX, e.clientY);
}, {passive:true});

// Guard: prevent flips when chosen preset is locked
document.addEventListener('click', (e)=>{
  if(e.target && e.target.id === 'btnFlip'){
    const activeBetBtn = document.querySelector('.betBtn.active');
    if(activeBetBtn && activeBetBtn.disabled){
      const hint = document.getElementById('betGateHint');
      if(hint) hint.textContent = 'That preset is locked for this pool (tier + α cap).';
      e.preventDefault();
      e.stopPropagation();
    }
  }
}, true);


/* v6.8 overrides */

function setFlipEnabled(on){
  const b = el('btnFlip');
  if(!b) return;
  b.disabled = !on;
  b.classList.toggle('disabled', !on);
}
function disableAllBetButtons(disabled){
  document.querySelectorAll('[data-bet]').forEach(btn=>{
    btn.disabled = disabled;
    btn.classList.toggle('locked', disabled);
  });
}

function updatePoolUI(){
  const tvlEl = el('poolTVL');
  const smbEl = el('poolSafeMaxBet');
  const liqEl = el('poolLiquidityVal');
  const aEl   = el('poolAlphaVal');
  const feeEl = el('poolFeeVal');

  if(!selectedPool || selectedPool.id==='none' || selectedPool.tvl==null){
    if(tvlEl) tvlEl.textContent = 'N/A';
    if(smbEl) smbEl.textContent = 'N/A';
    if(liqEl) liqEl.textContent = 'N/A';
    if(aEl) aEl.textContent = 'N/A';
    if(feeEl) feeEl.textContent = 'N/A';
    const probVal = el('poolProbVal'); if(probVal) probVal.textContent='N/A';
    const profVal = el('poolProfitMult'); if(profVal) profVal.textContent='N/A';
    const edgeVal = el('poolEdgeVal'); if(edgeVal) edgeVal.textContent='N/A';
    disableAllBetButtons(true);
    setFlipEnabled(false);
    return;
  }

  const tvl = selectedPool.tvl;
  const alpha = selectedPool.alpha ?? 0.0025;
  const fee = selectedPool.fee ?? 0.01;

  if(tvlEl) tvlEl.textContent = formatUSD(tvl);
  if(liqEl) liqEl.textContent = formatUSD(tvl);
  if(aEl) aEl.textContent = (alpha*100).toFixed(2)+'%';
  if(feeEl) feeEl.textContent = (fee*100).toFixed(2)+'%';

  
  const cEl = el('poolContractVal'); if(cEl) cEl.textContent = selectedPool.contract ? `${selectedPool.contract.slice(0,10)}…${selectedPool.contract.slice(-8)}` : 'N/A';
  const vEl = el('poolVolVal'); if(vEl) vEl.textContent = selectedPool.vol!=null ? `${(selectedPool.vol*100).toFixed(1)}%` : 'N/A';
  updateDetectedLine(); refreshBetGates();
updateLocks();
  setFlipEnabled(true);
  refreshBetGates();
}


function bindTwoWayControls(){
  const pSlider = el('pSlider');
  const pInput  = el('pInput');
  const mSlider = el('mSlider');
  const mInput  = el('mInput');
  const hintEl  = el('twoWayHint');
  if(!pSlider || !mSlider) return;

  const TARGET_EDGE = 0.03; // demo target

  function feeRate(){ return selectedPool ? (selectedPool.fee ?? 0.01) : 0.01; }
  function pMax(){ return selectedPool ? (selectedPool.pMax ?? 0.47) : 0.47; }

  function updateHint(p, m){
    if(!hintEl) return;
    const fr = feeRate();
    const ev = p*(1-fr)*m - (1-p);
    hintEl.textContent = `Higher win% lowers profit× (and vice‑versa). Demo target edge ≈ ${(TARGET_EDGE*100).toFixed(1)}%. Current EV per $1 ≈ ${ev.toFixed(3)}.`;
  }

  function updatePoolValueSpans(p, m){
    const probVal = el('poolProbVal');
    const profVal = el('poolProfitMult');
    const edgeVal = el('poolEdgeVal');
    if(probVal) probVal.textContent = (p*100).toFixed(2) + '%';
    if(profVal) profVal.textContent = m.toFixed(2) + '×';
    if(edgeVal){
      const fr = feeRate();
      const ev = p*(1-fr)*m - (1-p);
      edgeVal.textContent = (Math.max(0, -ev)*100).toFixed(2) + '%';
    }
  }

  function fromP(){
    const p = clamp(parseFloat(pSlider.value||'0.47'), 0.01, pMax());
    if(pInput) pInput.value = (p*100).toFixed(1);
    const fr = feeRate();
    let m = (1 - p - TARGET_EDGE) / (Math.max(1e-6, p*(1-fr)));
    m = clamp(m, parseFloat(mSlider.min||'0.10'), parseFloat(mSlider.max||'2.00'));
    mSlider.value = String(m);
    if(mInput) mInput.value = m.toFixed(2);
    updateHint(p,m); updatePoolValueSpans(p,m);
    updateLocks(); if(typeof updateQuotePreview==='function') updateQuotePreview();
  }

  function fromM(){
    const m = clamp(parseFloat(mSlider.value||'1.00'), parseFloat(mSlider.min||'0.10'), parseFloat(mSlider.max||'2.00'));
    if(mInput) mInput.value = m.toFixed(2);
    const fr = feeRate();
    let p = (1 - TARGET_EDGE) / (1 + (1-fr)*m);
    p = clamp(p, 0.01, pMax());
    pSlider.value = String(p);
    if(pInput) pInput.value = (p*100).toFixed(1);
    updateHint(p,m); updatePoolValueSpans(p,m);
    updateLocks(); if(typeof updateQuotePreview==='function') updateQuotePreview();
  }

  pSlider.addEventListener('input', fromP);
  if(pInput) pInput.addEventListener('input', ()=>{
    const p = clamp((parseFloat(pInput.value||'47')/100), 0.01, pMax());
    pSlider.value = String(p);
    fromP();
  });

  mSlider.addEventListener('input', fromM);
  if(mInput) mInput.addEventListener('input', ()=>{
    const m = clamp(parseFloat(mInput.value||'1.00'), parseFloat(mSlider.min||'0.10'), parseFloat(mSlider.max||'2.00'));
    mSlider.value = String(m);
    fromM();
  });

  fromP();
}

function updateLocks(){
  const smbEl = el('poolSafeMaxBet');
  if(!selectedPool || selectedPool.id==='none' || selectedPool.tvl==null){ if(smbEl) smbEl.textContent='N/A'; return; }

  const tvl = selectedPool.tvl ?? 0;
  const alpha = selectedPool.alpha ?? 0.0025;
  const fee = selectedPool.fee ?? 0.01;
  const m = clamp(parseFloat(el('mSlider')?.value || '1.00'), 0.10, 5.0);

  const maxPayout = tvl * alpha;
  const maxBet = maxPayout / ((1-fee) * (1+m));
  if(smbEl) smbEl.textContent = formatUSD(maxBet);

  document.querySelectorAll('[data-bet]').forEach(btn=>{
    const bet = parseFloat(btn.getAttribute('data-bet'));
    const minNeed = (selectedPool.minTier && selectedPool.minTier[String(bet)]) ? selectedPool.minTier[String(bet)] : 0;
    const locked = (tvl < minNeed) || (bet > maxBet);
    btn.disabled = locked;
    btn.classList.toggle('locked', locked);
  });

  const active = document.querySelector('[data-bet].active') || document.querySelector('[data-bet].selected') || document.querySelector('[data-bet]');
  const curBet = active ? parseFloat(active.getAttribute('data-bet')) : 1;
  const minNeed = (selectedPool.minTier && selectedPool.minTier[String(curBet)]) ? selectedPool.minTier[String(curBet)] : 0;
  const curLocked = (tvl < minNeed) || (curBet > maxBet);
  setFlipEnabled(!curLocked);
}


/* v6.9 contract allocator */
function isHexAddress(s){
  return /^0x[a-fA-F0-9]{40}$/.test((s||'').trim());
}
function sha256hex(str){
  const enc = new TextEncoder().encode(str);
  let h = 0x811c9dc5;
  for(let i=0;i<enc.length;i++){
    h ^= enc[i];
    h = (h * 0x01000193) >>> 0;
  }
  return ('00000000'+h.toString(16)).slice(-8);
}
function pseudoRand01(seedHex, idx){
  const v = (parseInt(seedHex,16) ^ ((idx+1)*0x9e3779b9)) >>> 0;
  let x = v;
  x ^= x << 13; x >>>= 0;
  x ^= x >> 17; x >>>= 0;
  x ^= x << 5;  x >>>= 0;
  return (x >>> 0) / 0xFFFFFFFF;
}
function tierFromTVL(tvl){
  if(tvl >= 8000) return 'bloodmoon';
  if(tvl >= 3500) return 'sigilvault';
  if(tvl >= 1500) return 'bonepile';
  if(tvl >= 700)  return 'embercup';
  if(tvl >= 50)   return 'dustbowl';
  return 'dungpool';
}
function deriveProfileFromContract(addr){
  const a = (addr||'').trim();
  const seed = sha256hex(a.toLowerCase());
  const r0 = pseudoRand01(seed,0);
  const tvl = Math.round(Math.pow(r0, 2.2) * 15000 + 1);
  const r1 = pseudoRand01(seed,1);
  const vol = 0.02 + r1 * 0.22;
  const fee = clamp(0.008 + (vol-0.02)*0.08, 0.008, 0.03);
  const alpha = clamp(0.0030 - (vol*0.006) - (tvl<1000?0.001:0), 0.0010, 0.0030);

  const tier = tierFromTVL(tvl);
  const base = POOL_PROFILES.find(p=>p.id===tier);
  const tokenSymbols = ["WETH", "USDC", "USDT", "DAI", "WBTC", "LINK", "UNI", "AAVE", "CRV", "MKR", "LDO", "SNX", "COMP", "SUSHI", "ARB", "OP", "RNDR", "FET", "IMX", "GRT", "MATIC", "MANA", "SAND", "APE", "RPL", "ENS", "1INCH", "DYDX", "PEPE", "SHIB", "FLOKI", "BONK", "WIF", "MOG", "JASMY", "JUP", "PYTH", "SEI", "TIA", "INJ", "STX", "ORDI", "DOGE", "SOL", "BTC", "ETH"];
  const sym = tokenSymbols[Math.floor(pseudoRand01(seed,2)*tokenSymbols.length)];
  const coin = `${sym} / USDC`;

  const minTier = JSON.parse(JSON.stringify(base?.minTier || {"1":0,"5":999999,"10":999999}));
  return {
    id:'auto',
    name:'Auto Pool',
    coin,
    symbol:sym,
    contract:a,
    tvl, alpha, fee, vol,
    pMax:0.47,
    minTier
  };
}
function randomHexAddress(){
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function updateDetectedLine(){
  const tok = el('detectedToken');
  const volEl = el('detectedVol');
  const tvlEl = el('detectedTVL');
  if(!selectedPool || selectedPool.id==='none' || selectedPool.tvl==null){
    if(tok) tok.textContent = 'N/A';
    if(volEl) volEl.textContent = 'N/A';
        if(tvlEl) tvlEl.textContent = 'N/A';
    return;
  }
  if(tok) tok.textContent = `${selectedPool.coin}${selectedPool.contract ? ` • ${selectedPool.contract.slice(0,6)}…${selectedPool.contract.slice(-4)}`:''}`;
  if(volEl) volEl.textContent = selectedPool.vol!=null ? `${(selectedPool.vol*100).toFixed(1)}%` : 'N/A';
      if(tvlEl) tvlEl.textContent = selectedPool.tvl!=null ? formatUSD(selectedPool.tvl) : 'N/A';
}
function upsertAutoProfile(profile){
  const idx = POOLS.findIndex(p=>p.id==='auto');
  if(idx>=0) POOLS.splice(idx,1);
  POOLS.splice(1,0,profile);
  initPools();
  const sel = el('poolSelect');
  if(sel) sel.value = 'auto';
  selectedPool = profile;
  updatePoolUI();
  bindTwoWayControls(); if(typeof updateQuotePreview==='function') updateQuotePreview(); updateDetectedLine(); refreshBetGates(); refreshBetGates(); }
function wireAllocatorUI(){
  const input = el('contractAddress');
  const btn = el('btnAutoDetect');
  const hint = el('contractHint');
  const refresh = el('btnPageRefresh');

  function applyAddr(a){
    if(input) input.value = a;
    const prof = deriveProfileFromContract(a);
    if(hint){
      hint.textContent = `Detected tier: ${tierFromTVL(prof.tvl)} • ${prof.coin}. TVL ≈ ${formatUSD(prof.tvl)} • Vol ≈ ${(prof.vol*100).toFixed(1)}% • Fee ≈ ${(prof.fee*100).toFixed(2)}%`;
    }
    upsertAutoProfile(prof); updateAllocatedPoolLine(prof);
    if(typeof triggerShockwave==='function') triggerShockwave();
  }

  if(btn){
    btn.addEventListener('click', ()=>{
      const a = (input?.value||'').trim();
      if(!isHexAddress(a)){
        if(hint) hint.textContent = 'Enter a valid 0x… address (40 hex chars).';
        return;
      }
      applyAddr(a);
    });
  }
  if(refresh){
    refresh.addEventListener('click', ()=> applyAddr(randomHexAddress()));
  }
  applyAddr(randomHexAddress());
}


// v6.10 gating helpers
function canBet(bet){
  if(!selectedPool || selectedPool.id==='none' || selectedPool.tvl==null) return false;
  // tier lock
  const lock = selectedPool.minTier ? selectedPool.minTier[String(bet)] : 0;
  if(lock && lock > 0) return false;
  const safe = computeSafeMaxBet();
  if(!isFinite(safe) || safe <= 0) return false;
  return bet <= safe + 1e-9;
}
function computeSafeMaxBet(){
  if(!selectedPool || selectedPool.tvl==null || selectedPool.alpha==null) return NaN;
  const fee = clamp((selectedPool.fee ?? 0.01), 0, 0.2);
  const alpha = clamp((selectedPool.alpha ?? 0.0025), 0.0001, 0.05);
  // payout model: winReturn = bet*(1-fee)*(1+profitMultiplier)
  const m = clamp(getProfitMultiplier(), 0.0, 5.0);
  const maxPayout = selectedPool.tvl * alpha;
  const denom = (1-fee) * (1+m);
  if(denom <= 0) return 0;
  return maxPayout / denom;
}

function refreshBetGates(){
  // bet buttons
  [1,5,10].forEach(b=>{
    const btn = el('bet'+b);
    if(!btn) return;
    const okTier = selectedPool && selectedPool.minTier ? !(selectedPool.minTier[String(b)]>0) : false;
    const ok = okTier && canBet(b);
    btn.disabled = !okTier; // tier lock shows disabled
    btn.classList.toggle('locked', !okTier);
    btn.classList.toggle('unsafe', okTier && !ok);
    btn.title = !selectedPool || selectedPool.id==='none' ? 'Select a pool first' :
      (!okTier ? 'Locked for this pool tier' : (!ok ? 'Unsafe: exceeds safe max bet' : ''));
  });
  // flip/quote
  const bet = currentBet || 1;
  const flipBtn = el('btnFlip');
  const quoteBtn = el('btnQuote');
  const ok = canBet(bet);
  if(flipBtn) flipBtn.disabled = !ok;
  if(quoteBtn) quoteBtn.disabled = !ok;
}

function getProfitMultiplier(){
  // profit multiplier control: slider or input
  const elMul = el('profitMul');
  const elVal = el('profitMulVal');
  const v = elMul ? parseFloat(elMul.value) : (elVal ? parseFloat(elVal.textContent) : 1.0);
  return isFinite(v) ? v : 1.0;
}


// v6.11 coin select (coin -> auto allocate pool)
let selectedCoin = null;
function initCoinSelect(){
  const sel = el('coinSelect');
  if(!sel) return;
  sel.innerHTML = '';
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = 'Select a coin…';
  sel.appendChild(opt0);

  // group by chain for readability
  const byChain = {};
  COIN_CATALOG.forEach(c=>{ (byChain[c.chain] ||= []).push(c); });
  Object.keys(byChain).forEach(chain=>{
    const og = document.createElement('optgroup');
    og.label = chain;
    byChain[chain].forEach(c=>{
      const o = document.createElement('option');
      o.value = c.contract;
      o.textContent = `${c.symbol} — ${c.name} (${c.contract.slice(0,6)}…${c.contract.slice(-4)})`;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });

  sel.addEventListener('change', ()=>{
    const addr = (sel.value||'').trim();
    if(!addr){
      selectedCoin = null;
      selectedPool = null;
      updateAllocatedPoolLine(null);
      updatePoolUI();
      refreshBetGates();
      return;
    }
    selectedCoin = COIN_CATALOG.find(c=>c.contract.toLowerCase()===addr.toLowerCase()) || {symbol:'TOKEN', name:'Token', chain:'', contract:addr};
    // Use the allocator to derive an "Auto Pool" profile from contract
    const prof = deriveProfileFromContract(addr);
    prof.name = 'Auto Pool';
    // Mirror the selected coin identity
    prof.symbol = selectedCoin.symbol || prof.symbol;
    prof.coin = `${selectedCoin.symbol || prof.symbol} / USDC`;
    upsertAutoProfile(prof); updateAllocatedPoolLine(prof);
    updateAllocatedPoolLine(prof);
  });
}

function updateAllocatedPoolLine(prof){
  const ap = el('allocatedPool');
  const ac = el('allocatedContract');
  if(!prof){
    if(ap) ap.textContent = 'N/A';
    if(ac) ac.textContent = 'N/A';
    return;
  }
  // tier name based on TVL ladder
  const tierId = tierFromTVL(prof.tvl);
  const tier = POOL_PROFILES.find(p=>p.id===tierId);
  if(ap) ap.textContent = tier ? `${tier.name} tier (TVL ${formatUSD(prof.tvl)})` : `Tier ${tierId}`;
  if(ac) ac.textContent = prof.contract ? `${prof.contract.slice(0,10)}…${prof.contract.slice(-8)}` : 'N/A';
}
