// theme-selector.js (Base v2)
// Canon:
// - No Theme = universal shell (no theme visuals). (Temp: shares Orbs background layer.)
// - Ritual theme visuals = CoinFlip-like grid + runes (orbs hidden).
// - Universal interactions (pulse + spotlight/vignette + nested hover glows) work in BOTH themes.

const $ = (q)=>document.querySelector(q);
const $$ = (q)=>Array.from(document.querySelectorAll(q));

// 🔒 Production default: Theme 3 hidden until shipped.
const ENABLE_THEME_THREE = false;

const DEFAULT_STATE = {
  version: "theme-config-v1",
  activeTheme: "none",
  themes: {
    none:   { enabled: true,  label: "No Theme",   baseline: "Universal",     notes: "Universal theme settings only (no theme visuals)."},
    ritual: { enabled: true,  label: "Ritual", baseline: "CoinFlip", notes: "Ritual visuals only (CoinFlip baseline)."},
    third:  { enabled: false, label: "Theme 3", baseline: "—",       notes: "Reserved slot (hidden behind flag)."}
  },
  ritualVariant: "v1",
  noThemeVariant: "v1",
  universals: {
    clickPulse: true,
    spotlight: true,
    vignette: true,
    vignetteStrength: 0.60,
    hoverGlows: true,
    density: "med",

    // CoinFlip shell toggles (applies to this Theme Selector too)
    dots: true,
    runes: true,
    grain: true,
    orbs: true,
    orbMotion: true,
    orbInteract: true,
    cardFloat: true,
    windowDrift: true,
    reveal: true,
    debug: false,
    reduceMotion: false
  }
};

const STORAGE_KEY = "POOL_THEME_SELECTOR_STATE_V1";
const state = JSON.parse(JSON.stringify(DEFAULT_STATE));

/* -------------------- Persistence -------------------- */
function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if(s && s.version === DEFAULT_STATE.version){
      Object.assign(state, s);
      state.themes = Object.assign({}, DEFAULT_STATE.themes, s.themes || {});
      state.ritualVariant = (s.ritualVariant === "v2") ? "v2" : "v1";
      state.universals = Object.assign({}, DEFAULT_STATE.universals, s.universals || {});
    }
  }catch{}
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

/* -------------------- Apply (Theme + Universals) -------------------- */
function applyTheme(){
  // Theme visuals (strict fork)
  document.body.classList.toggle("theme-none", state.activeTheme === "none");
  document.body.classList.toggle("theme-ritual", state.activeTheme === "ritual");

  // mode classes for settings visibility
  document.body.classList.toggle("mode-none", state.activeTheme === "none");
  document.body.classList.toggle("mode-ritual", state.activeTheme === "ritual");
  document.body.classList.toggle("mode-orbs", state.activeTheme === "orbs");

  // No Theme v2 (dark shell)
  document.body.classList.toggle("theme-none-v2", state.activeTheme === "none" && (state.noThemeVariant||"v1") === "v2");

  // Ritual variants (visual-only)
  document.body.classList.toggle("ritual-v1", state.ritualVariant !== "v2");
  document.body.classList.toggle("ritual-v2", state.ritualVariant === "v2");

  // Universal interactions
  document.body.classList.toggle("hover-glows", !!state.universals.hoverGlows);

  const u = state.universals;

  // FX toggles (CoinFlip-style)
  document.body.classList.toggle("fx-no-clickpulse", !u.clickPulse);
  document.body.classList.toggle("fx-no-orbs", !u.orbs);
  document.body.classList.toggle("fx-no-dots", !u.dots);
  document.body.classList.toggle("fx-no-runes", !u.runes);
  document.body.classList.toggle("fx-no-grain", !u.grain);
  document.body.classList.toggle("fx-no-orb-motion", !u.orbMotion);
  document.body.classList.toggle("fx-no-orb-interact", !u.orbInteract);
  document.body.classList.toggle("fx-no-card-float", !u.cardFloat);
  document.body.classList.toggle("fx-no-window-drift", !u.windowDrift);
  document.body.classList.toggle("fx-no-reveal", !u.reveal);
  document.body.classList.toggle("reduce-motion", !!u.reduceMotion);

  // Layer visibility
  $("#fx-grain").style.display = u.grain ? "block" : "none";
  $("#fx-pulses").style.display = u.clickPulse ? "block" : "none";
  $("#fx-spotlight").style.display = u.spotlight ? "block" : "none";
  $("#fx-vignette").style.display = u.vignette ? "block" : "none";

  // Theme defaults: Ritual shows grid+runes; No Theme shows orbs.
  $("#fx-orbs").style.display = (u.orbs && state.activeTheme !== "ritual") ? "block" : (u.orbs ? "block" : "none");
  $("#fx-grid").style.display = (state.activeTheme === "ritual" && u.dots) ? "block" : "none";
  $("#fx-runes").style.display = (state.activeTheme === "ritual" && u.runes) ? "block" : "none";

  // Vignette strength (0..1)
  document.documentElement.style.setProperty("--vignetteStrength", String(u.vignetteStrength ?? 0.6));


  // Density affects Ritual visuals (grid/runes intensity) and can map to orb intensity
  applyDensity();

  $("#activeThemeLabel").textContent = (state.activeTheme === "ritual") ? "Ritual" : "No Theme";
  
  const pTheme = $("#previewActiveTheme"); if(pTheme) pTheme.textContent = (state.activeTheme==="none") ? "No Theme" : "Ritual";
  const pVar = $("#previewRitualVariant"); if(pVar) pVar.textContent = (state.activeTheme==="ritual") ? (state.ritualVariant || "v1").toUpperCase().replace("V","v") : "—";
saveState();
}


function syncChooseThemeCards(){
  // Mark active/inactive and control variant interactivity
  const cards = $$("label.themeCard[data-theme]");
  cards.forEach(card=>{
    const t = card.getAttribute("data-theme");
    const isActive = (t === state.activeTheme);
    card.classList.toggle("isActive", isActive);
    card.classList.toggle("isInactive", !isActive);
    const badge = card.querySelector("[data-active-badge]");
    if(badge){
      badge.textContent = isActive ? "ACTIVE" : "";
    }
    // disable variant radios on inactive cards (visual + safety)
    // keep radios enabled; disable via CSS only
    card.querySelectorAll(".variantRow").forEach(row=>{
      row.classList.toggle("disabled", !isActive);
    });
  });
}

function reapplyVariantChecks(){
  $$('input[name="noThemeVariant"]').forEach(x=> x.checked = (x.value === (state.noThemeVariant||"v1")));
  $$('input[name="ritualVariant"], input[name="ritualVariantCard"]').forEach(x=> x.checked = (x.value === state.ritualVariant));
  $$('input[name="orbsVariant"]').forEach(x=> x.checked = (x.value === (state.orbsVariant||"v1")));
}

function syncUI(){
  syncChooseThemeCards();
  reapplyVariantChecks();

  $$("input[name=\"noThemeVariant\"]").forEach(x=> x.checked = (x.value === (state.noThemeVariant||"v1")));
  $$('input[name="theme"]').forEach(x=> x.checked = (x.value === state.activeTheme));
  $$('input[name="ritualVariant"]').forEach(x=> x.checked = (x.value === state.ritualVariant));

  const u = state.universals;

  // Theme Settings controls
  $("#optPulse").checked = !!u.clickPulse;
  $("#optSpotlight").checked = !!u.spotlight;
  $("#optVignette").checked = !!u.vignette;
  $("#optHover").checked = !!u.hoverGlows;

  $("#optOrbs").checked = !!u.orbs;
  $("#optDots").checked = !!u.dots;
  $("#optRunes").checked = !!u.runes;
  $("#optGrain").checked = !!u.grain;

  $("#optOrbMotion").checked = !!u.orbMotion;
  $("#optOrbInteract").checked = !!u.orbInteract;
  $("#optCardFloat").checked = !!u.cardFloat;
  $("#optWindowDrift").checked = !!u.windowDrift;

  $("#optReveal").checked = !!u.reveal;
  $("#optDebug").checked = !!u.debug;
  $("#optReduceMotion").checked = !!u.reduceMotion;

  $("#optDensity").value = u.density || "med";

  const strengthPct = Math.round((u.vignetteStrength ?? 0.6) * 100);
  $("#optVignetteStrength").value = String(strengthPct);
  $("#optVignetteStrengthVal").textContent = `${strengthPct}%`;

  // Update variant UI enablement hint
  const ritualOn = (state.activeTheme === "ritual");
  document.querySelectorAll('.segWide input[name="ritualVariant"]').forEach(inp=>{
    inp.disabled = false; // can preselect even if not active
  });

  applyTheme();
}

function resetDefaults(){
  Object.assign(state, JSON.parse(JSON.stringify(DEFAULT_STATE)));
  syncUI();
  applyTheme();
}

/* -------------------- Theme Visuals: Ritual Grid + Runes -------------------- */
let gridCtx=null, gridCanvas=null;
let runes=[], runeWrap=null;

function densityToParams(d){
  if(d==="low")  return { gridStep: 46, dotR: 1.2, dotA: 0.24, runeCount: 10, runeA: 0.20 };
  if(d==="high") return { gridStep: 24, dotR: 1.5, dotA: 0.32, runeCount: 22, runeA: 0.30 };
  return            { gridStep: 34, dotR: 1.35, dotA: 0.28, runeCount: 16, runeA: 0.26 };
}

function resizeGrid(){
  gridCanvas = $("#fx-grid");
  gridCtx = gridCanvas.getContext("2d");
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  gridCanvas.width = Math.floor(window.innerWidth * dpr);
  gridCanvas.height = Math.floor(window.innerHeight * dpr);
  gridCanvas.style.width = "100%";
  gridCanvas.style.height = "100%";
  gridCtx.setTransform(dpr,0,0,dpr,0,0);
}

function drawGrid(offsetX=0, offsetY=0){
  if(!gridCtx) return;
  const { gridStep, dotR, dotA } = densityToParams(state.universals.density);

  gridCtx.clearRect(0,0,window.innerWidth, window.innerHeight);

  // slightly warmer for ritual
  const pal = ritualPalette();
  const base = state.activeTheme === "ritual"
    ? pal.dot(dotA)
    : `rgba(215,160,255,${dotA*0.6})`;

  gridCtx.fillStyle = base;

  const startX = (offsetX % gridStep) - gridStep;
  const startY = (offsetY % gridStep) - gridStep;

  for(let y=startY; y<window.innerHeight+gridStep; y+=gridStep){
    for(let x=startX; x<window.innerWidth+gridStep; x+=gridStep){
      gridCtx.beginPath();
      gridCtx.arc(x, y, dotR, 0, Math.PI*2);
      gridCtx.fill();
    }
  }
}


const RUNE_SET = ["⟠","⟟","⟡","⟁","⟣","⟢","⟤","⟞","⟝","⟜","⟛","⟚","⟙","⟘","⟦","⟧","⟨","⟩","⟪","⟫","⟬","⟭","⌁","⌇","⌗","⌭","⌽","⍟","⍣","⍜","⍝","⍥"];

let runeCanvas, runeCtx, runeObjs = [];
let _runeRAF = null;

function ensureRuneCanvas(){
  runeCanvas = $("#fx-runes");
  if(!runeCanvas) return;
  runeCtx = runeCanvas.getContext("2d");
  resizeRuneCanvas();
}

function resizeRuneCanvas(){
  if(!runeCanvas) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  runeCanvas.width = Math.floor(window.innerWidth * dpr);
  runeCanvas.height = Math.floor(window.innerHeight * dpr);
  runeCanvas.style.width = "100%";
  runeCanvas.style.height = "100%";
  runeCtx.setTransform(dpr,0,0,dpr,0,0);
}

function ritualPalette(){
  // CoinFlip-ritual baseline; v2 is a hotter variant.
  if(state.ritualVariant === "v2"){
    return {
      rune: "rgba(255,160,220,0.42)",
      runeGlow: "rgba(255,160,220,0.12)",
      dot: (a)=>`rgba(255,160,220,${a})`
    };
  }
  return {
    rune: "rgba(215,160,255,0.40)",
    runeGlow: "rgba(215,160,255,0.10)",
    dot: (a)=>`rgba(215,160,255,${a})`
  };
}

function clearRunes(){
  runeObjs = [];
  if(runeCtx){
    runeCtx.clearRect(0,0,window.innerWidth, window.innerHeight);
  }
}

function spawnRunes(){
  clearRunes();
  const { runeCount, runeA } = densityToParams(state.universals.density);

  for(let i=0;i<runeCount;i++){
    const glyph = RUNE_SET[(Math.random()*RUNE_SET.length)|0];
    runeObjs.push({
      glyph,
      x: Math.random()*window.innerWidth,
      y: Math.random()*window.innerHeight,
      vx: (Math.random()*2-1) * 0.18,
      vy: (Math.random()*2-1) * 0.12,
      size: 14 + Math.random()*18,
      a: Math.min(0.85, runeA + Math.random()*0.18)
    });
  }
}

function tickRunes(){
  _runeRAF = requestAnimationFrame(tickRunes);
  if(state.activeTheme !== "ritual" || !state.universals.runes){
    // keep canvas clean when not in ritual
    if(runeCtx) runeCtx.clearRect(0,0,window.innerWidth, window.innerHeight);
    return;
  }
  if(!runeCtx) return;

  const pal = ritualPalette();
  runeCtx.clearRect(0,0,window.innerWidth, window.innerHeight);
  runeCtx.textAlign = "center";
  runeCtx.textBaseline = "middle";

  for(const r of runeObjs){
    r.x += r.vx;
    r.y += r.vy;

    if(r.x < -40) r.x = window.innerWidth + 40;
    if(r.x > window.innerWidth + 40) r.x = -40;
    if(r.y < -40) r.y = window.innerHeight + 40;
    if(r.y > window.innerHeight + 40) r.y = -40;

    runeCtx.font = `${r.size}px ui-sans-serif, system-ui`;
    runeCtx.fillStyle = pal.rune.replace(/0\.\d+\)/, `${r.a})`);
    runeCtx.shadowColor = pal.runeGlow;
    runeCtx.shadowBlur = 10;
    runeCtx.fillText(r.glyph, r.x, r.y);
  }
  runeCtx.shadowBlur = 0;
}


function applyDensity(){
  const u = state.universals;

  // ritual intensity
  $("#fx-grid").style.opacity = (state.activeTheme==="ritual" && u.dots) ? "0.90" : "0.0";
  $("#fx-runes").style.opacity = (state.activeTheme==="ritual" && u.runes) ? "0.90" : "0.0";

  // orb intensity
  const orb = $("#fx-orbs");
  if(orb){
    orb.style.opacity = (u.density==="low") ? "0.80" : (u.density==="high" ? "1" : "0.92");
  }

  // vignette strength
  document.documentElement.style.setProperty("--vignetteStrength", String(u.vignetteStrength ?? 0.6));

  // re-spawn runes when density changes (if ritual)
  if(state.activeTheme==="ritual"){
    spawnRunes();
    drawGrid(window._gridOffX||0, window._gridOffY||0);
  }
}

/* -------------------- Universal Interactions: Spotlight/Vignette + Pulse -------------------- */
function setupSpotlight(){
  const el = $("#fx-spotlight");
  const v = $("#fx-vignette");

  function move(e){
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    // spotlight (universal)
    el.style.background = `radial-gradient(600px 420px at ${x}% ${y}%, rgba(215,160,255,.16), transparent 70%)`;

    // vignette (universal)
    v.style.background = `radial-gradient(1200px 800px at ${x}% ${y}%, transparent 58%, rgba(0,0,0,.60) 100%)`;

    // grid parallax (ritual visuals only)
    window._gridOffX = (e.clientX - window.innerWidth/2) * 0.08;
    window._gridOffY = (e.clientY - window.innerHeight/2) * 0.08;
    if(state.activeTheme==="ritual"){
      drawGrid(window._gridOffX, window._gridOffY);
    }
  }

  window.addEventListener("mousemove", move, {passive:true});
  move({clientX: window.innerWidth/2, clientY: window.innerHeight/2});
}


/* -------------------- Orb Interact (cursor parallax) -------------------- */
function setupOrbInteract(){
  const layer = $("#fx-orbs");
  if(!layer) return;
  let mx = 0, my = 0;
  window.addEventListener("mousemove", (e)=>{
    mx = (e.clientX / Math.max(1, window.innerWidth)) - 0.5;
    my = (e.clientY / Math.max(1, window.innerHeight)) - 0.5;
    if(state.universals.reduceMotion) return;
    if(!state.universals.orbInteract) return;
    const amt = 18; // px
    layer.style.transform = `translate3d(${(-mx*amt).toFixed(2)}px, ${(-my*amt).toFixed(2)}px, 0)`;
  }, {passive:true});
}

/* -------------------- Simple reveals -------------------- */
function bootReveals(){
  const nodes = document.querySelectorAll(".card, .themeCard, .panelTitle, .topbar");
  nodes.forEach(n=> n.classList.add("reveal"));
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add("in"); });
  }, {threshold: 0.10});
  nodes.forEach(n=> io.observe(n));
}

/* -------------------- Debug overlay -------------------- */
let _dbgLast = 0;
function tickDebug(){
  if(!state.universals.debug){
    const out = $("#debugOut");
    if(out){ out.classList.remove("show"); out.textContent = ""; }
    requestAnimationFrame(tickDebug);
    return;
  }
  const out = $("#debugOut");
  if(out){
    out.classList.add("show");
    const now = performance.now();
    if(now - _dbgLast > 200){
      _dbgLast = now;
      out.textContent =
`theme: ${state.activeTheme}${state.activeTheme==="ritual" ? " ("+state.ritualVariant+")" : ""}
density: ${state.universals.density}
toggles: orbs=${!!state.universals.orbs} dots=${!!state.universals.dots} runes=${!!state.universals.runes} grain=${!!state.universals.grain}
motion: orbMotion=${!!state.universals.orbMotion} orbInteract=${!!state.universals.orbInteract} cardFloat=${!!state.universals.cardFloat} windowDrift=${!!state.universals.windowDrift}
a11y: reduceMotion=${!!state.universals.reduceMotion} reveal=${!!state.universals.reveal}`;
    }
  }
  requestAnimationFrame(tickDebug);
}

function setupPulse(){
  const style = document.createElement("style");
  style.textContent = `
    .pulse{
      position:absolute;
      width:12px;height:12px;
      transform: translate(-50%,-50%);
      border-radius:999px;
      background: rgba(215,160,255,.40);
      box-shadow: 0 0 18px rgba(215,160,255,.30);
      animation: pulseOut .85s ease forwards;
    }
    @keyframes pulseOut{
      0%{opacity:1; transform:translate(-50%,-50%) scale(1);}
      100%{opacity:0; transform:translate(-50%,-50%) scale(18);}
    }
    .rune{
      position:absolute;
      color: rgba(244,240,255,.78);
      text-shadow: 0 0 14px rgba(215,160,255,.22);
      transform: translate3d(0,0,0);
      animation-name: runeDrift;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      will-change: transform;
    }
    @keyframes runeDrift{
      from{ transform: translate3d(0,0,0); }
      to{ transform: translate3d(var(--dx), var(--dy), 0); }
    }
  `;
  document.head.appendChild(style);

  window.addEventListener("click", (e)=>{
    if(!state.universals.clickPulse) return;
    const root = $("#fx-pulses");
    const p = document.createElement("div");
    p.className = "pulse";
    p.style.left = e.clientX + "px";
    p.style.top = e.clientY + "px";
    root.appendChild(p);
    setTimeout(()=>p.remove(), 850);
  });
}

/* -------------------- Export -------------------- */
function exportThemeConfig(){
  const payload = {
    ...state,
    exportedAt: new Date().toISOString(),
    notes: "Universal pool-game theme config. Themes are visual only; universals are platform-wide."
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `theme-config-${state.activeTheme}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* -------------------- Wiring -------------------- */
function setUniversal(key, value){
  state.universals[key] = value;
  syncUI();
  applyTheme();
}

function wire(){
  if(!ENABLE_THEME_THREE){
    document.body.classList.add("hideThird");
  
  // Make variant segments clickable without "eating" the click as a theme-card click.
  $$(".themeCard .variantRow").forEach(row=>{
    // prevent clicks inside variant controls from toggling the theme radio unexpectedly
    row.addEventListener("pointerdown", (e)=>{ e.stopPropagation(); }, {capture:true});
    row.addEventListener("click", (e)=>{ e.stopPropagation(); }, {capture:true});
  });

  // Clicking a segment label should always select its inner radio + fire change
  $$(".themeCard .variantRow .seg label").forEach(lbl=>{
    lbl.addEventListener("click", (e)=>{
      e.stopPropagation();
      const r = lbl.querySelector('input[type="radio"]');
      if(!r || r.disabled) return;
      r.checked = true;
      r.dispatchEvent(new Event("change", { bubbles:true }));
    });
  });
}

  // Cards -> select theme
  $$(".themeCard").forEach(card=>{
    card.addEventListener("click", ()=>{
      const t = card.getAttribute("data-theme");
      if(t === "third") return;
      state.activeTheme = t;
      syncUI();
      applyTheme();
    });
  });

  // Radio -> select theme
  $$('input[name="theme"]').forEach(r=>{
    r.addEventListener("change", ()=>{
      if(r.value === "third") return;
      state.activeTheme = r.value;
      saveState();
      applyTheme();
      syncUI();
    });
  });
// theme settings
  $("#optPulse").addEventListener("change", (e)=> setUniversal("clickPulse", e.target.checked));
  $("#optSpotlight").addEventListener("change", (e)=> setUniversal("spotlight", e.target.checked));
  $("#optVignette").addEventListener("change", (e)=> setUniversal("vignette", e.target.checked));
  $("#optHover").addEventListener("change", (e)=> setUniversal("hoverGlows", e.target.checked));

  $("#optOrbs").addEventListener("change", (e)=> setUniversal("orbs", e.target.checked));
  $("#optDots").addEventListener("change", (e)=> setUniversal("dots", e.target.checked));
  $("#optRunes").addEventListener("change", (e)=> setUniversal("runes", e.target.checked));
  $("#optGrain").addEventListener("change", (e)=> setUniversal("grain", e.target.checked));

  $("#optOrbMotion").addEventListener("change", (e)=> setUniversal("orbMotion", e.target.checked));
  $("#optOrbInteract").addEventListener("change", (e)=> setUniversal("orbInteract", e.target.checked));
  $("#optCardFloat").addEventListener("change", (e)=> setUniversal("cardFloat", e.target.checked));
  $("#optWindowDrift").addEventListener("change", (e)=> setUniversal("windowDrift", e.target.checked));

  $("#optReveal").addEventListener("change", (e)=> setUniversal("reveal", e.target.checked));
  $("#optDebug").addEventListener("change", (e)=> setUniversal("debug", e.target.checked));
  $("#optReduceMotion").addEventListener("change", (e)=> setUniversal("reduceMotion", e.target.checked));

  $("#optDensity").addEventListener("change", (e)=> setUniversal("density", e.target.value));

  $("#optVignetteStrength").addEventListener("input", (e)=>{
    const pct = Math.max(0, Math.min(100, parseFloat(e.target.value||'60')));
    $("#optVignetteStrengthVal").textContent = `${Math.round(pct)}%`;
    setUniversal("vignetteStrength", Math.round(pct)/100);
  });

  
  // no theme variants
  $$('input[name="noThemeVariant"]').forEach(r=>{
    r.addEventListener("change", (e)=>{
      state.noThemeVariant = e.target.value;
      saveState();
      applyTheme();
      syncUI();
    });
  });


  // no theme variants
  $$('input[name="noThemeVariant"]').forEach(r=>{
    r.addEventListener("change", (e)=>{
      state.noThemeVariant = e.target.value;
      saveState(); applyTheme(); syncUI();
    });
  });

// ritual variants
  $$('input[name="ritualVariant"]').forEach(r=>{
    r.addEventListener("change", (e)=>{
      state.ritualVariant = e.target.value;
      saveState();
      applyTheme();
      syncUI();
    });
  });

  // reset effects (coinflip-style)
  $("#btnResetFx").addEventListener("click", ()=>{
    resetDefaults();
    syncUI();
  });


  // buttons
  $("#resetDefaults").addEventListener("click", resetDefaults);
  $("#applyThemeBtn").addEventListener("click", applyTheme);
  $("#exportTheme").addEventListener("click", exportThemeConfig);

  // resizing
  window.addEventListener("resize", ()=>{
    resizeGrid();
    resizeRuneCanvas();
    if(state.activeTheme==="ritual") drawGrid(window._gridOffX||0, window._gridOffY||0);
  });
}

/* -------------------- Boot -------------------- */
loadState();
syncUI();
resizeGrid();
ensureRuneCanvas();
resizeRuneCanvas();
spawnRunes();
if(!_runeRAF) tickRunes();
drawGrid(0,0);
applyTheme();
setupSpotlight();
setupPulse();
setupOrbInteract();
bootReveals();
tickDebug();
wire();