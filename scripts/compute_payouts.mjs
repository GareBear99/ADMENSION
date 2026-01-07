#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import https from 'https';

const EPS = 1e-9;

function fetchText(url){
  return new Promise((resolve,reject)=>{
    https.get(url,(res)=>{
      let data='';
      res.on('data',(c)=>data+=c);
      res.on('end',()=>resolve(data));
    }).on('error',reject);
  });
}

function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  return lines.map(l=>{
    // naive CSV split; acceptable for our simple sheets
    return l.split(',').map(s=>s.replace(/^\"|\"$/g,''));
  });
}

function lastMonthUTC(){
  const d = new Date();
  d.setUTCDate(1); // first of this month
  d.setUTCHours(0,0,0,0);
  d.setUTCMonth(d.getUTCMonth()-1);
  const start = new Date(d);
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 1, 0,0,0,0));
  const tag = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
  return {start, end, tag};
}

function readSettlement(tag){
  const p = path.join(process.cwd(), 'admin', 'settlements', `${tag}.json`);
  if(!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p,'utf-8'));
}

function writeLedger(tag, rows, pool, meta){
  const outDir = path.join(process.cwd(), 'payouts', tag);
  fs.mkdirSync(outDir, { recursive: true });
  const json = { tag, generatedAt: new Date().toISOString(), poolUSD: pool, meta, rows };
  fs.writeFileSync(path.join(outDir, 'ledger.json'), JSON.stringify(json,null,2));
  const csvHead = 'adm_code,wallet,units,share,amount_usd,capped,cap_reason\n';
  const csvBody = rows.map(r=>`${r.adm_code},${r.wallet||''},${r.units},${r.share.toFixed(6)},${r.amount_usd.toFixed(2)},${r.capped?1:0},${r.cap_reason||''}`).join('\n');
  fs.writeFileSync(path.join(outDir,'ledger.csv'), csvHead+csvBody);
}

function aggregate(events){
  const unitsByAdm = new Map();
  for(const ev of events){
    const adm = ev.adm_code || '';
    if(!adm) continue;
    const cur = unitsByAdm.get(adm) || 0;
    unitsByAdm.set(adm, cur + 1);
  }
  return unitsByAdm;
}

async function main(){
  const SHEET_EVENTS_CSV_URL = process.env.SHEET_EVENTS_CSV_URL;
  if(!SHEET_EVENTS_CSV_URL){
    console.error('Missing SHEET_EVENTS_CSV_URL env var');
    process.exit(1);
  }
  const SHEET_WALLETS_CSV_URL = process.env.SHEET_WALLETS_CSV_URL || '';
  const WALLET_CAP_PCT = Number(process.env.WALLET_CAP_PCT || '0.01');
  const CREATOR_ADM_CODE = process.env.CREATOR_ADM_CODE || '';

  const {start, end, tag} = lastMonthUTC();
  
  // Bootstrap phase check: launched Jan 2026
  const LAUNCH_DATE = new Date('2026-01-01T00:00:00Z');
  const BOOTSTRAP_MONTHS = 3;
  const now = new Date();
  const monthsSinceLaunch = Math.floor((now - LAUNCH_DATE) / (30.44 * 24 * 60 * 60 * 1000)) + 1;
  
  if(monthsSinceLaunch < BOOTSTRAP_MONTHS){
    console.log(`\n⚠️  BOOTSTRAP PHASE: Month ${monthsSinceLaunch} of ${BOOTSTRAP_MONTHS}`);
    console.log(`No payouts until Month ${BOOTSTRAP_MONTHS}. First payout will occur in April 2026.`);
    console.log(`Ledger will be created but amounts will be $0 until bootstrap completes.\n`);
  }
  
  const isBootstrap = monthsSinceLaunch <= BOOTSTRAP_MONTHS;

  const eventsCSV = await fetchText(SHEET_EVENTS_CSV_URL);
  const rows = parseCSV(eventsCSV);
  // Expected columns: timestamp,type,sid_hash,page,slot,device,utm_json,viewable,ivt
  const header = rows[0];
  const idx = {
    ts: 0, type:1, sid:2, page:3, slot:4, device:5, utm:6, viewable:7, ivt:8
  };
  const filtered = [];
  for(let i=1;i<rows.length;i++){
    const r = rows[i];
    const ts = new Date(r[idx.ts]);
    if(!(ts>=start && ts<end)) continue; // last month only
    const type = r[idx.type];
    if(type !== 'ad_viewable' && type !== 'ad_request') continue;
    const isViewable = (r[idx.viewable]||'').toString().toLowerCase()==='true';
    const isIVT = (r[idx.ivt]||'').toString().toLowerCase()==='true';
    if(isIVT) continue;
    if(!isViewable) continue; // only count billed
    // Extract adm_code from utm json if present
    let adm_code = '';
    try{ const u = JSON.parse(r[idx.utm]||'{}'); adm_code = (u.adm||'').toUpperCase(); }catch{}
    if(!adm_code) continue;
    filtered.push({ ts, adm_code });
  }

  const unitsByAdm = aggregate(filtered);
  const totalUnits = Array.from(unitsByAdm.values()).reduce((a,b)=>a+b,0) || 1;

  const settlement = readSettlement(tag);
  if(!settlement){
    console.error(`Missing admin/settlements/${tag}.json with { "received_revenue_usd": number }`);
    process.exit(2);
  }
  const received = Number(settlement.received_revenue_usd)||0;
  const poolCap = 10000;
  
  // Bootstrap phase: 6.5% pool (50% of 13%), no actual payouts until month 3
  const poolPct = isBootstrap ? 0.065 : 0.13;
  let pool = Math.min(received * poolPct, poolCap);
  
  // During bootstrap (months 1-2), track units but set pool to 0 for actual payouts
  if(monthsSinceLaunch < BOOTSTRAP_MONTHS){
    console.log(`Bootstrap phase active: Pool calculated at ${poolPct*100}% = $${pool.toFixed(2)}`);
    console.log(`Setting actual payout pool to $0 (units tracked for future reference)`);
    pool = 0; // No actual distribution during bootstrap
  }

  // Optional wallet mapping
  let walletByAdm = new Map();
  if(SHEET_WALLETS_CSV_URL){
    try{
      const walletsCSV = await fetchText(SHEET_WALLETS_CSV_URL);
      const wrows = parseCSV(walletsCSV);
      // Expect: ts,adm_code,chain,address,signature
      for(let i=1;i<wrows.length;i++){
        const r = wrows[i];
        const adm_code = (r[1]||'').toUpperCase();
        const chain = (r[2]||'').toLowerCase();
        const addr = (r[3]||'').toLowerCase();
        if(adm_code && chain && addr){
          walletByAdm.set(adm_code, `${chain}:${addr}`);
        }
      }
    }catch(e){
      console.error('Wallet CSV fetch failed, proceeding without wallet map');
    }
  }
  // Default: cap per adm_code if no wallet map
  const walletKeyForAdm = (adm)=> walletByAdm.has(adm) ? walletByAdm.get(adm) : 'NO_WALLET';

  // Prepare allocations by units (initial)
  let baseRows = Array.from(unitsByAdm.entries()).map(([adm_code, units])=>({
    adm_code, units, wallet: walletKeyForAdm(adm_code)
  }));

  // Extract "no wallet" rows: their entire share goes to founder (burn) and not to pool recipients
  let poolAdjusted = pool;
  const unitsTotalAll = baseRows.reduce((s,r)=>s+r.units,0) || 1;
  const noWalletRows = baseRows.filter(r=>r.wallet==='NO_WALLET');
  const withWalletRows = baseRows.filter(r=>r.wallet!=='NO_WALLET');
  if(noWalletRows.length){
    const shareNoWallet = noWalletRows.reduce((s,r)=>s + (r.units/unitsTotalAll), 0);
    const amountNoWallet = pool * shareNoWallet;
    // route to founder if provided; otherwise mark UNALLOCATED
    if(CREATOR_ADM_CODE){
      // record as separate row to founder
      withWalletRows.push({ adm_code: CREATOR_ADM_CODE, wallet: CREATOR_ADM_CODE, units: 0, carry: amountNoWallet, capped:false, cap_reason:'no_wallet_redirect' });
    }
    poolAdjusted = pool - amountNoWallet;
  }

  const finalRows = enforceWalletCapWaterfill(withWalletRows, poolAdjusted, WALLET_CAP_PCT, CREATOR_ADM_CODE);

  writeLedger(tag, finalRows, pool, { totalUnits, received, poolCap, walletCapPct: WALLET_CAP_PCT, creatorRecipient: CREATOR_ADM_CODE||null });
  console.log(`Ledger for ${tag} written with ${finalRows.length} rows. Pool $${pool.toFixed(2)}.`);
}

function enforceWalletCapWaterfill(rows, pool, capPct, creatorAdm){
  const cap = pool * capPct;
  const out = [];
  let poolRemaining = pool;
  const assignedWallets = new Set();

  // Compute units per wallet
  const unitsByWallet = new Map();
  for(const r of rows){
    unitsByWallet.set(r.wallet, (unitsByWallet.get(r.wallet)||0) + r.units);
  }

  // Pre-assign any explicit carry amounts (e.g., redirected no-wallet proceeds)
  const carryRows = rows.filter(r=>r.carry>EPS);
  if(carryRows.length){
    for(const r of carryRows){
      const amount = Math.min(poolRemaining, r.carry);
      out.push({ adm_code: r.adm_code, wallet: r.wallet, units: r.units||0, share: amount/pool, amount_usd: amount, capped:false, cap_reason:r.cap_reason||'carry' });
      poolRemaining -= amount;
    }
  }
  // water-filling across remaining (non-carry)
  let remaining = rows.filter(r=>!(r.carry>EPS));
  while(remaining.length && poolRemaining > EPS){
    const unitsTotal = remaining.reduce((s,r)=>s+r.units,0) || 1;
    // proposed allocation
    const proposedByWallet = new Map();
    for(const r of remaining){
      const amount = poolRemaining * (r.units/unitsTotal);
      proposedByWallet.set(r.wallet, (proposedByWallet.get(r.wallet)||0) + amount);
    }
    // any wallet exceeding cap?
    const over = Array.from(proposedByWallet.entries()).filter(([w,a])=> a > cap + EPS && !assignedWallets.has(w));
    if(over.length===0){
      // Assign as proposed and finish
      for(const r of remaining){
        const amount = poolRemaining * (r.units/unitsTotal);
        out.push({ adm_code: r.adm_code, wallet: r.wallet, units: r.units, share: amount/pool, amount_usd: amount, capped:false });
      }
      poolRemaining = 0;
      break;
    }
    // Cap all over-wallets this round proportionally by their units within the wallet
    for(const [w,totalAlloc] of over){
      // collect rows for this wallet
      const walletRows = remaining.filter(r=>r.wallet===w);
      const unitsWallet = walletRows.reduce((s,r)=>s+r.units,0) || 1;
      for(const r of walletRows){
        const amount = cap * (r.units/unitsWallet);
        out.push({ adm_code: r.adm_code, wallet: r.wallet, units: r.units, share: amount/pool, amount_usd: amount, capped:true, cap_reason:'wallet_cap_1pct' });
      }
      // remove wallet rows from remaining
      remaining = remaining.filter(r=>r.wallet!==w);
      assignedWallets.add(w);
      poolRemaining -= cap;
      if(poolRemaining <= EPS) break;
    }
  }

  // If any poolRemaining and no remaining recipients (all capped), allocate to creator or mark unallocated
  if(poolRemaining > EPS){
    if(creatorAdm){
      out.push({ adm_code: creatorAdm, wallet: creatorAdm, units: 0, share: poolRemaining/pool, amount_usd: poolRemaining, capped:false, cap_reason:'creator_overflow' });
      poolRemaining = 0;
    } else {
      // append metadata pseudo-row
      out.push({ adm_code: 'UNALLOCATED', wallet: '', units: 0, share: poolRemaining/pool, amount_usd: poolRemaining, capped:false, cap_reason:'all_wallets_capped' });
      poolRemaining = 0;
    }
  }

  // Merge rows for same adm_code if duplicated
  const merged = new Map();
  for(const r of out){
    const k = r.adm_code + '|' + r.wallet;
    const prev = merged.get(k);
    if(prev){
      prev.units += r.units;
      prev.share += r.share;
      prev.amount_usd += r.amount_usd;
      prev.capped = prev.capped || r.capped;
    } else {
      merged.set(k, { ...r });
    }
  }
  return Array.from(merged.values()).sort((a,b)=>b.amount_usd-a.amount_usd);
}

main().catch(e=>{ console.error(e); process.exit(1); });
