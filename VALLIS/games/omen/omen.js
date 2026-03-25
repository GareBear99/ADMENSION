/* OMEN Theme Shell v2 (CoinFlip-parity)
   - FX layer: dots + runes + orbs + glyph drift + pulses + spotlight + parallax
   - Controls: bottom-right + settings panel
   - Demo logic: daily hash id + donation free spin gate (client-side mock)
*/

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t)=>a+(b-a)*t;

const FX = {
  reduceMotion: false,
  theme: "ritual",
  dots: true,
  runes: true,
  grain: true,
  vignette: true,
  reveal: true,
  orbs: true,
  orbMotion: true,
  orbInteract: true,
  cardFloat: true,
  clickPulse: true,
  spotlight: true,
  parallax: true,
  glyphs: true,
  density: "med",
  debug: false,
};

function setHtmlFlag(flag, on){
  document.documentElement.classList.toggle(flag, !!on);
}

function applyFx(){
  // coarse feature toggles
  setHtmlFlag("fx-spotlight-on", FX.spotlight);
  setHtmlFlag("fx-glyphs-on", FX.glyphs);

  setHtmlFlag("fx-no-orbs", !FX.orbs);
  setHtmlFlag("fx-orb-motion-off", !FX.orbMotion);
  setHtmlFlag("fx-orb-interact-off", !FX.orbInteract);
  setHtmlFlag("fx-no-card-float", !FX.cardFloat);
  setHtmlFlag("fx-no-clickpulse", !FX.clickPulse);
  setHtmlFlag("fx-no-parallax", !FX.parallax);

  // canvas/display toggles
  const grid = $("fx-grid"); if(grid) grid.style.display = FX.dots ? "block":"none";
  const runes = $("fx-runes"); if(runes) runes.style.display = FX.runes ? "block":"none";
  const grain = $("fx-grain"); if(grain) grain.style.display = FX.grain ? "block":"none";
  const vig = $("fx-vignette"); if(vig) vig.style.display = FX.vignette ? "block":"none";

  // reveal is a subtle ramp on load (handled in boot)
  document.documentElement.style.setProperty("--vignetteOpacity", FX.reduceMotion ? "0.70" : "0.92");

  // debug
  const out = $("fxDebugOut");
  if(out){
    out.classList.toggle("show", FX.debug);
    out.textContent = JSON.stringify(FX, null, 2);
  }

  // density informs canvas particle count
  Effects.setDensity(FX.density);
}

function setTheme(name){
  FX.theme = name;
  document.documentElement.classList.remove("theme-ritual","theme-orbs");
  document.documentElement.classList.add(`theme-${name}`);
  if($("themeSelect")) $("themeSelect").value = name;
}

function setupControls(){
  const panel = $("ctlPanel");
  const open = () => panel?.classList.add("open");
  const close = () => panel?.classList.remove("open");

  $("ctlSettings")?.addEventListener("click", () => panel?.classList.contains("open") ? close() : open());
  $("ctlClose")?.addEventListener("click", close);

  $("ctlReduceMotion")?.addEventListener("click", () => {
    FX.reduceMotion = !FX.reduceMotion;
    document.documentElement.classList.toggle("reduce-motion", FX.reduceMotion);
    applyFx();
  });

  $("ctlTheme")?.addEventListener("click", () => {
    setTheme(FX.theme === "ritual" ? "orbs" : "ritual");
  });

  $("themeSelect")?.addEventListener("change", (e) => setTheme(e.target.value));

  const bindCheck = (id, key) => {
    const el = $(id); if(!el) return;
    el.checked = !!FX[key];
    el.addEventListener("change", () => { FX[key] = el.checked; applyFx(); });
  };

  bindCheck("fxDots","dots");
  bindCheck("fxRunes","runes");
  bindCheck("fxGrain","grain");
  bindCheck("fxVignette","vignette");
  bindCheck("fxReveal","reveal");
  bindCheck("fxOrbs","orbs");
  bindCheck("fxOrbMotion","orbMotion");
  bindCheck("fxOrbInteract","orbInteract");
  bindCheck("fxCardFloat","cardFloat");
  bindCheck("fxClickPulse","clickPulse");
  bindCheck("fxSpotlight","spotlight");
  bindCheck("fxParallax","parallax");
  bindCheck("fxGlyphs","glyphs");
  bindCheck("fxDebug","debug");

  $("fxDensity")?.addEventListener("change", (e)=>{ FX.density = e.target.value; applyFx(); });
  $("fxReset")?.addEventListener("click", () => {
    Object.assign(FX, {
      reduceMotion:false, theme:"ritual", dots:true, runes:true, grain:true, vignette:true, reveal:true,
      orbs:true, orbMotion:true, orbInteract:true, cardFloat:true, clickPulse:true, spotlight:true, parallax:true, glyphs:true,
      density:"med", debug:false
    });
    document.documentElement.classList.remove("reduce-motion");
    // re-sync UI
    ["fxDots","fxRunes","fxGrain","fxVignette","fxReveal","fxOrbs","fxOrbMotion","fxOrbInteract",
     "fxCardFloat","fxClickPulse","fxSpotlight","fxParallax","fxGlyphs","fxDebug"].forEach(id=>{
      const el=$(id); if(!el) return;
      const map = {
        fxDots:"dots", fxRunes:"runes", fxGrain:"grain", fxVignette:"vignette", fxReveal:"reveal",
        fxOrbs:"orbs", fxOrbMotion:"orbMotion", fxOrbInteract:"orbInteract",
        fxCardFloat:"cardFloat", fxClickPulse:"clickPulse", fxSpotlight:"spotlight", fxParallax:"parallax", fxGlyphs:"glyphs",
        fxDebug:"debug"
      };
      el.checked = !!FX[map[id]];
    });
    if($("fxDensity")) $("fxDensity").value = FX.density;
    setTheme(FX.theme);
    applyFx();
  });

  // close panel on outside click
  document.addEventListener("click", (e)=>{
    if(!panel?.classList.contains("open")) return;
    const inside = panel.contains(e.target) || ["ctlSettings","ctlClose"].includes(e.target?.id);
    if(!inside) close();
  });
}

/* ---------------------- Effects Engines ---------------------- */

const Effects = (() => {
  let gridC, runesC, gctx, rctx;
  let W=1, H=1, dpr=1;
  let density = "med";
  let mouse = {x:0,y:0, vx:0, vy:0, has:false};

  const dotField = [];
  const runeField = [];
  const runes = ["𒀭","𒆠","𒂗","𒄿","𒇻","𒋀","𒊩","𒌋","𒍣","𒁹","𒉺","𒅗"];

  function setDensity(val){ density = val; rebuild(); }

  function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = window.innerWidth; H = window.innerHeight;
    if(gridC){
      gridC.width = Math.floor(W*dpr); gridC.height = Math.floor(H*dpr);
      gridC.style.width = W+"px"; gridC.style.height = H+"px";
      gctx = gridC.getContext("2d");
      gctx.setTransform(dpr,0,0,dpr,0,0);
    }
    if(runesC){
      runesC.width = Math.floor(W*dpr); runesC.height = Math.floor(H*dpr);
      runesC.style.width = W+"px"; runesC.style.height = H+"px";
      rctx = runesC.getContext("2d");
      rctx.setTransform(dpr,0,0,dpr,0,0);
    }
    rebuild();
  }

  function counts(){
    const base = Math.floor((W*H) / 28000);
    if(density==="low") return clamp(Math.floor(base*0.7), 22, 90);
    if(density==="high") return clamp(Math.floor(base*1.6), 60, 220);
    return clamp(base, 40, 160);
  }

  function rebuild(){
    dotField.length = 0;
    runeField.length = 0;

    const n = counts();
    for(let i=0;i<n;i++){
      dotField.push({
        x: Math.random()*W,
        y: Math.random()*H,
        r: 0.9 + Math.random()*1.4,
        a: 0.06 + Math.random()*0.10,
        sp: 0.04 + Math.random()*0.14,
        phase: Math.random()*Math.PI*2
      });
    }

    const m = clamp(Math.floor(n*0.55), 18, 120);
    for(let i=0;i<m;i++){
      runeField.push({
        x: Math.random()*W,
        y: Math.random()*H,
        s: 10 + Math.random()*18,
        a: 0.03 + Math.random()*0.06,
        sp: 0.06 + Math.random()*0.12,
        ch: runes[Math.floor(Math.random()*runes.length)],
        drift: (Math.random()<0.5?-1:1) * (0.12 + Math.random()*0.18),
      });
    }
  }

  function tick(t){
    if(gctx && FX.dots){
      gctx.clearRect(0,0,W,H);
      const time = t*0.001;
      for(const d of dotField){
        d.phase += d.sp*0.02;
        const ox = Math.sin(d.phase + time)*10;
        const oy = Math.cos(d.phase + time)*10;
        let x = d.x + ox;
        let y = d.y + oy;

        // mouse repel
        if(mouse.has && !FX.reduceMotion){
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < 180){
            const k = (180-dist)/180;
            x += (dx/(dist||1)) * k * 18;
            y += (dy/(dist||1)) * k * 18;
          }
        }

        gctx.beginPath();
        gctx.fillStyle = `rgba(215,160,255,${d.a})`;
        gctx.arc(x,y,d.r,0,Math.PI*2);
        gctx.fill();
      }
    }

    if(rctx && FX.runes){
      rctx.clearRect(0,0,W,H);
      rctx.textBaseline = "middle";
      rctx.textAlign = "center";

      const time = t*0.001;
      for(const r of runeField){
        r.y += r.drift * (FX.reduceMotion ? 0.25 : 1);
        if(r.y < -40) r.y = H+40;
        if(r.y > H+40) r.y = -40;

        let x = r.x + Math.sin(time*r.sp + r.s)*12;
        let y = r.y;

        if(mouse.has && !FX.reduceMotion){
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < 220){
            const k = (220-dist)/220;
            x += (dx/(dist||1))*k*22;
            y += (dy/(dist||1))*k*22;
          }
        }

        rctx.font = `600 ${r.s}px ui-sans-serif, system-ui`;
        rctx.fillStyle = `rgba(215,160,255,${r.a})`;
        rctx.fillText(r.ch, x, y);
      }
    }

    requestAnimationFrame(tick);
  }

  function bindMouse(){
    window.addEventListener("mousemove",(e)=>{
      const x=e.clientX, y=e.clientY;
      mouse.vx = x - mouse.x;
      mouse.vy = y - mouse.y;
      mouse.x = x; mouse.y = y; mouse.has = true;

      // spotlight
      document.documentElement.style.setProperty("--spotX", `${x}px`);
      document.documentElement.style.setProperty("--spotY", `${y}px`);

      // parallax
      if(FX.parallax && !FX.reduceMotion){
        const px = (x/W - 0.5);
        const py = (y/H - 0.5);
        document.querySelectorAll(".parallaxTarget").forEach(el=>{
          const amt = 10;
          el.style.transform = `translate3d(${px*amt}px, ${py*amt}px, 0)`;
        });
      }
    });
  }

  function init(){
    gridC = $("fx-grid");
    runesC = $("fx-runes");
    resize();
    window.addEventListener("resize", resize);
    bindMouse();
    requestAnimationFrame(tick);
  }

  return { init, setDensity };
})();

const Orbs = (() => {
  let root;
  const orbs = [];
  let W=1,H=1;
  let t0 = performance.now();
  let mouse = {x:0,y:0,has:false};

  function spawn(){
    if(!root) return;
    root.innerHTML = "";
    orbs.length = 0;
    const mk=(cls)=>{ const d=document.createElement("div"); d.className=`orb ${cls}`; root.appendChild(d); return d; };
    orbs.push({el: mk("big"),  cx:0.25, cy:0.20, rx:0.22, ry:0.16, sp:0.22});
    orbs.push({el: mk("med"),  cx:0.72, cy:0.32, rx:0.18, ry:0.14, sp:0.28});
    orbs.push({el: mk("small"),cx:0.55, cy:0.72, rx:0.16, ry:0.12, sp:0.34});
  }

  function resize(){
    W=window.innerWidth; H=window.innerHeight;
  }

  function tick(now){
    const dt = (now-t0)*0.001;
    t0=now;

    if(FX.orbs){
      if(root) root.style.display="block";
    } else {
      if(root) root.style.display="none";
      requestAnimationFrame(tick);
      return;
    }

    for(const o of orbs){
      const time = now*0.001;
      const a = time * (FX.orbMotion && !FX.reduceMotion ? o.sp : 0.02);
      let x = (o.cx + Math.cos(a)*o.rx)*W;
      let y = (o.cy + Math.sin(a*1.12)*o.ry)*H;

      // interaction
      if(FX.orbInteract && mouse.has && !FX.reduceMotion){
        const dx = x - mouse.x;
        const dy = y - mouse.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        const rad = 260;
        if(dist < rad){
          const k = (rad-dist)/rad;
          x += (dx/(dist||1)) * k * 22;
          y += (dy/(dist||1)) * k * 22;
        }
      }

      o.el.style.left = x+"px";
      o.el.style.top  = y+"px";
    }

    requestAnimationFrame(tick);
  }

  function bind(){
    window.addEventListener("mousemove",(e)=>{ mouse.x=e.clientX; mouse.y=e.clientY; mouse.has=true; });
  }

  function init(){
    root = $("fx-orbs");
    resize();
    window.addEventListener("resize", resize);
    bind();
    spawn();
    requestAnimationFrame(tick);
  }

  return { init };
})();

const ClickPulses = (() => {
  let root;
  function spawn(x,y){
    if(!FX.clickPulse || FX.reduceMotion) return;
    if(!root) return;
    const p = document.createElement("div");
    p.className = "pulse";
    p.style.left = x+"px";
    p.style.top  = y+"px";
    root.appendChild(p);
    setTimeout(()=>p.remove(), 950);
  }
  function init(){
    root = $("fx-pulses");
    window.addEventListener("click",(e)=>spawn(e.clientX,e.clientY));
  }
  return { init };
})();

const GlyphDrift = (() => {
  let root;
  const glyphs = [
    "assets/omen/glyphs/ash/128.png",
    "assets/omen/glyphs/wind/128.png",
    "assets/omen/glyphs/flood/128.png",
    "assets/omen/glyphs/stone/128.png",
    "assets/omen/glyphs/void/128.png",
  ];
  const items = [];
  let W=1,H=1;

  function resize(){ W=window.innerWidth; H=window.innerHeight; }
  function spawn(n=12){
    if(!root) return;
    root.innerHTML = "";
    items.length=0;
    for(let i=0;i<n;i++){
      const d=document.createElement("img");
      d.className="g";
      d.src = glyphs[i%glyphs.length];
      const it={
        el:d,
        x: Math.random()*W,
        y: Math.random()*H,
        vx: (Math.random()-0.5)*0.14,
        vy: (Math.random()-0.5)*0.10,
        s: 0.75 + Math.random()*0.65,
      };
      d.style.width = `${44*it.s}px`;
      d.style.height = `${44*it.s}px`;
      root.appendChild(d);
      items.push(it);
    }
  }

  function tick(){
    if(!FX.glyphs || FX.reduceMotion){
      requestAnimationFrame(tick);
      return;
    }
    for(const it of items){
      it.x += it.vx*60;
      it.y += it.vy*60;
      if(it.x < -80) it.x = W+80;
      if(it.x > W+80) it.x = -80;
      if(it.y < -80) it.y = H+80;
      if(it.y > H+80) it.y = -80;
      it.el.style.left = it.x+"px";
      it.el.style.top  = it.y+"px";
    }
    requestAnimationFrame(tick);
  }

  function init(){
    root = $("fx-glyphs");
    resize();
    window.addEventListener("resize", ()=>{ resize(); spawn(); });
    spawn();
    requestAnimationFrame(tick);
  }
  return { init };
})();

/* ---------------------- OMEN Demo Logic ---------------------- */

const OMEN = (() => {
  const GLYPHS = [
    {key:"ASH",   img:"assets/omen/glyphs/ash/256.png",   msgs:[
      "A spark wants a sacrifice. Cut what is dead weight.",
      "Ignition is near — but only if you commit.",
      "A small burn prevents a large fire."
    ]},
    {key:"WIND",  img:"assets/omen/glyphs/wind/256.png",  msgs:[
      "Pressure changes in silence. Watch the invisible.",
      "A drift becomes a storm if ignored.",
      "Let the system breathe — loosen one constraint."
    ]},
    {key:"FLOOD", img:"assets/omen/glyphs/flood/256.png", msgs:[
      "Momentum is rising. Ride it — don’t fight it.",
      "A washout clears noise. Wait for the clean signal.",
      "Overflow means scale… or drown. Choose."
    ]},
    {key:"STONE", img:"assets/omen/glyphs/stone/256.png", msgs:[
      "Stability first. The next move must be safe.",
      "Anchor your risk; grow from the base.",
      "Hard rules protect soft minds."
    ]},
    {key:"VOID",  img:"assets/omen/glyphs/void/256.png",  msgs:[
      "Reset the loop. Begin again with one clean rule.",
      "Silence is a signal. Pause to avoid chaos.",
      "A void is not empty — it is potential."
    ]},
  ];

  const SALT = "anunnaki-omen-v1";

  const state = {
    lastSpinDay: null, // YYYYMMDD
    lastDailyKey: null,
    donatedAt: null, // epoch ms
    lastFreeClaimWindow: null, // YYYYMM
  };

  function ymd(date=new Date()){
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}${m}${d}`;
  }
  function ym(date=new Date()){
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    return `${y}${m}`;
  }

  async function sha256Hex(str){
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map(b=>b.toString(16).padStart(2,"0")).join("");
  }

  function ensureClientId(){
    const key="omen_client_id";
    let id = localStorage.getItem(key);
    if(!id){
      // 16 bytes hex
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      id = Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");
      localStorage.setItem(key,id);
    }
    return id;
  }

  function normalizeWallet(w){
    return (w||"").trim().toLowerCase() || "0xdemo";
  }

  async function computeDailyKey(wallet, clientId, day){
    return sha256Hex(`${wallet}|${clientId}|${day}|${SALT}`);
  }

  function pickGlyph(hex){
    // use first byte as index
    const b = parseInt(hex.slice(0,2),16);
    return GLYPHS[b % GLYPHS.length];
  }

  function pickMsg(glyph, hex){
    const b = parseInt(hex.slice(2,4),16);
    return glyph.msgs[b % glyph.msgs.length];
  }

  function setHero(glyphKey, hash){
    if($("heroGlyph")) $("heroGlyph").textContent = glyphKey;
    if($("heroHash")) $("heroHash").textContent = hash ? hash.slice(0,10)+"…" : "…";
  }

  async function refreshGateUI(){
    const wallet = normalizeWallet($("omenWallet")?.value);
    const clientId = ($("omenClientId")?.value || ensureClientId()).trim();
    if($("omenClientId")) $("omenClientId").value = clientId;

    const day = ymd();
    const dailyKey = await computeDailyKey(wallet, clientId, day);
    state.lastDailyKey = dailyKey;

    const already = (state.lastSpinDay === day);
    if($("omenGate")) $("omenGate").textContent = already ? "Used today" : "Ready";
    if($("heroDaily")) $("heroDaily").textContent = already ? "Used today" : "Ready";
    if($("heroHash")) $("heroHash").textContent = dailyKey.slice(0,10)+"…";
  }

  async function spin({isFree=false}={}){
    const wallet = normalizeWallet($("omenWallet")?.value);
    const clientId = ($("omenClientId")?.value || ensureClientId()).trim();
    const day = ymd();

    const dailyKey = await computeDailyKey(wallet, clientId, day);

    if(!isFree && state.lastSpinDay === day){
      $("omenText").textContent = "Daily spin already used. Return tomorrow or claim a free spin (if eligible).";
      $("omenGlyph").textContent = "—";
      $("omenHash").textContent = dailyKey.slice(0,16)+"…";
      return;
    }

    // deterministic "nonce" (free spins still include a nonce so receipts are unique)
    const nonce = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    const receipt = await sha256Hex(`${dailyKey}|${isFree?"FREE":"PAID"}|${nonce}`);

    const glyph = pickGlyph(receipt);
    const msg = pickMsg(glyph, receipt);

    $("omenGlyph").textContent = glyph.key + (isFree ? " (FREE)" : "");
    $("omenText").textContent = msg;
    $("omenHash").textContent = receipt;

    setHero(glyph.key, receipt);

    if(!isFree){
      state.lastSpinDay = day;
    }

    // little pulse burst
    if(FX.clickPulse && !FX.reduceMotion){
      const rect = $("omenFlow")?.getBoundingClientRect();
      if(rect){
        const cx = rect.left + rect.width*0.5;
        const cy = rect.top + rect.height*0.25;
        for(let i=0;i<4;i++){
          setTimeout(()=> {
            const e = new MouseEvent("click",{clientX:cx+(Math.random()-0.5)*40, clientY:cy+(Math.random()-0.5)*30});
            window.dispatchEvent(e);
          }, i*55);
        }
      }
    }
  }

  function donate(){
    state.donatedAt = Date.now();
    localStorage.setItem("omen_donated_at", String(state.donatedAt));
    $("omenDonateStatus").textContent = "Donated ✓";
    updateFreeSpinUI();
  }

  function loadDonation(){
    const v = localStorage.getItem("omen_donated_at");
    if(v){
      state.donatedAt = parseInt(v,10);
      if(!Number.isNaN(state.donatedAt)){
        $("omenDonateStatus").textContent = "Donated ✓";
      }
    }
  }

  function updateFreeSpinUI(){
    const donated = !!state.donatedAt;
    const windowKey = ym();
    const last = localStorage.getItem("omen_free_claim_window");
    const eligible = donated && (last !== windowKey);
    $("omenNextFree").textContent = donated
      ? (eligible ? "Available now" : "Next month window")
      : "Donate to unlock";
    return eligible;
  }

  async function claimFree(){
    const eligible = updateFreeSpinUI();
    if(!eligible){
      $("omenText").textContent = "No free spin available yet.";
      return;
    }
    const windowKey = ym();
    localStorage.setItem("omen_free_claim_window", windowKey);
    updateFreeSpinUI();
    await spin({isFree:true});
  }

  function copyReceipt(){
    const h = $("omenHash")?.textContent || "";
    if(!h || h==="—") return;
    navigator.clipboard?.writeText(h);
  }

  function reset(){
    state.lastSpinDay = null;
    $("omenGate").textContent = "Unknown";
    $("omenGlyph").textContent = "—";
    $("omenText").textContent = "—";
    $("omenHash").textContent = "—";
    refreshGateUI();
  }

  function bind(){
    // hydrate stored donation state
    loadDonation();
    updateFreeSpinUI();

    // initial clientId
    const cid = ensureClientId();
    if($("omenClientId")) $("omenClientId").value = cid;

    ["omenWallet","omenClientId"].forEach(id=>{
      $(id)?.addEventListener("input", ()=>refreshGateUI());
    });

    $("omenSpin")?.addEventListener("click", ()=>spin({isFree:false}));
    $("omenCopyHash")?.addEventListener("click", copyReceipt);
    $("omenReset")?.addEventListener("click", reset);

    $("omenDonate")?.addEventListener("click", donate);
    $("omenClaimFree")?.addEventListener("click", claimFree);

    refreshGateUI();
  }

  return { bind };
})();

/* ---------------------- Boot ---------------------- */
function boot(){
  setTheme("ritual");
  setupControls();
  applyFx();

  // subtle reveal fade
  if(FX.reveal){
    document.body.style.opacity = "0";
    requestAnimationFrame(()=> {
      document.body.style.transition = "opacity 260ms ease";
      document.body.style.opacity = "1";
    });
  }

  Effects.init();
  Orbs.init();
  ClickPulses.init();
  GlyphDrift.init();

  OMEN.bind();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
