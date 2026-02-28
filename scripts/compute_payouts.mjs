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
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BOOTSTRAP PHASE CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════
  // The platform launched January 1, 2026
  // First 3 months (Jan, Feb, Mar 2026) = Bootstrap Phase
  // Purpose: Build initial treasury and ensure sustainable payouts
  // 
  // Month 1-2: NO user payouts (units tracked but $0 distributed)
  // Month 3+:  Pool split 50/50 between users and founder
  //            - Users get 6.5% of revenue (50% of the 13% pool)
  //            - Founder gets 93.5% (base 87% + 6.5% bootstrap share)
  // Month 4+:  Full 13% pool goes to users (founder keeps base 87%)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const LAUNCH_DATE = new Date('2026-01-01T00:00:00Z');
  const BOOTSTRAP_MONTHS = 3; // First payout in Month 3 (March 2026)
  const now = new Date();
  const monthsSinceLaunch = Math.floor((now - LAUNCH_DATE) / (30.44 * 24 * 60 * 60 * 1000)) + 1;
  
  if(monthsSinceLaunch < BOOTSTRAP_MONTHS){
    console.log(`\n⚠️  BOOTSTRAP PHASE: Month ${monthsSinceLaunch} of ${BOOTSTRAP_MONTHS}`);
    console.log(`No payouts until Month ${BOOTSTRAP_MONTHS}. First payout will occur in April 2026.`);
    console.log(`Ledger will be created but amounts will be $0 until bootstrap completes.\n`);
  }
  
  const isBootstrap = monthsSinceLaunch <= BOOTSTRAP_MONTHS;

  // ═══════════════════════════════════════════════════════════════════════════
  // AD IMPRESSION FILTERING - ANTI-FRAUD LAYER
  // ═══════════════════════════════════════════════════════════════════════════
  const eventsCSV = await fetchText(SHEET_EVENTS_CSV_URL);
  const rows = parseCSV(eventsCSV);
  
  // Expected columns: timestamp,type,sid_hash,page,slot,device,utm_json,viewable,ivt
  const header = rows[0];
  const idx = {
    ts: 0,      // Timestamp of impression
    type: 1,    // Event type (ad_viewable, ad_request, etc.)
    sid: 2,     // Session ID hash (for rate limiting)
    page: 3,    // Page where ad shown (homepage, stats, etc.)
    slot: 4,    // Ad slot ID (leaderboard, sidebar, etc.)
    device: 5,  // Desktop or mobile
    utm: 6,     // JSON with adm code: {"adm":"A4AGRZ"}
    viewable: 7,// TRUE if 50%+ visible for 1+ second
    ivt: 8      // TRUE if Invalid Traffic detected (fraud)
  };
  
  const filtered = [];
  
  for(let i=1; i<rows.length; i++){
    const r = rows[i];
    
    // Filter 1: Time range (last month only)
    const ts = new Date(r[idx.ts]);
    if(!(ts >= start && ts < end)) continue;
    
    // Filter 2: Event type (only ad_viewable and ad_request)
    const type = r[idx.type];
    if(type !== 'ad_viewable' && type !== 'ad_request') continue;
    
    // Filter 3: Viewability check (must be TRUE)
    const isViewable = (r[idx.viewable]||'').toString().toLowerCase() === 'true';
    if(!isViewable) continue; // Not seen = not billed
    
    // Filter 4: IVT check (must be FALSE = not fraud)
    const isIVT = (r[idx.ivt]||'').toString().toLowerCase() === 'true';
    if(isIVT) continue; // Fraud detected = excluded from payouts
    
    // Filter 5: Extract adm_code from UTM parameters
    let adm_code = '';
    try{ 
      const u = JSON.parse(r[idx.utm]||'{}'); 
      adm_code = (u.adm||'').toUpperCase(); 
    }catch{}
    if(!adm_code) continue; // No link code = no attribution = excluded
    
    // Impression passed all filters → count as 1 unit
    filtered.push({ ts, adm_code });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIT AGGREGATION - GROUP BY LINK CODE
  // ═══════════════════════════════════════════════════════════════════════════
  const unitsByAdm = aggregate(filtered); // Map of adm_code → unit count
  const totalUnits = Array.from(unitsByAdm.values()).reduce((a,b)=>a+b,0) || 1;

  // ═══════════════════════════════════════════════════════════════════════════
  // REVENUE SETTLEMENT - MANUAL VERIFICATION REQUIRED
  // ═══════════════════════════════════════════════════════════════════════════
  const settlement = readSettlement(tag);
  if(!settlement){
    console.error(`Missing admin/settlements/${tag}.json with { "received_revenue_usd": number }`);
    process.exit(2);
  }
  const received = Number(settlement.received_revenue_usd)||0;
  const poolCap = 10000; // Max pool per month: $10,000 (prevents unsustainable payouts)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // POOL CALCULATION - THE CORE MATH
  // ═══════════════════════════════════════════════════════════════════════════
  const fullPool = Math.min(received * 0.13, poolCap);
  
  let pool = fullPool;           // User pool (will be adjusted if bootstrap)
  let founderPoolShare = 0;      // Extra founder share during bootstrap
  
  if(isBootstrap){
    pool = fullPool * 0.5; // Users get 50% of 13% = 6.5%
    founderPoolShare = fullPool * 0.5; // Founder gets other 50%
    console.log(`\n💰 BOOTSTRAP POOL SPLIT:`);
    console.log(`   Full 13% Pool: $${fullPool.toFixed(2)}`);
    console.log(`   User Pool (50%): $${pool.toFixed(2)} (6.5% of revenue)`);
    console.log(`   Founder Pool (50%): $${founderPoolShare.toFixed(2)} (6.5% of revenue)`);
    console.log(`   Founder Total: $${(received * 0.87 + founderPoolShare).toFixed(2)} (87% + 6.5% = 93.5%)\n`);
  }
  
  // During bootstrap months 1-2, track units but set user pool to 0 for actual payouts
  if(monthsSinceLaunch < BOOTSTRAP_MONTHS){
    console.log(`⚠️  Month ${monthsSinceLaunch}: No user payouts yet (first payout Month ${BOOTSTRAP_MONTHS})`);
    console.log(`Setting user payout pool to $0 (units tracked for future reference)\n`);
    pool = 0; // No actual distribution during months 1-2
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WALLET MAPPING - USER CRYPTO ADDRESSES
  // ═══════════════════════════════════════════════════════════════════════════
  let walletByAdm = new Map();
  
  if(SHEET_WALLETS_CSV_URL){
    try{
      const walletsCSV = await fetchText(SHEET_WALLETS_CSV_URL);
      const wrows = parseCSV(walletsCSV);
      
      // Expected columns: ts, adm_code, chain, address, signature
      for(let i=1; i<wrows.length; i++){
        const r = wrows[i];
        const adm_code = (r[1]||'').toUpperCase();  // Link code (A4AGRZ)
        const chain = (r[2]||'').toLowerCase();     // solana, base, eth
        const addr = (r[3]||'').toLowerCase();      // Wallet address
        
        if(adm_code && chain && addr){
          // Store as "chain:address" (e.g. "solana:7xKXt...9aB")
          walletByAdm.set(adm_code, `${chain}:${addr}`);
        }
      }
    }catch(e){
      console.error('Wallet CSV fetch failed, proceeding without wallet map');
    }
  }
  
  // Helper: Get wallet for link code (or NO_WALLET if not set)
  const walletKeyForAdm = (adm) => walletByAdm.has(adm) ? walletByAdm.get(adm) : 'NO_WALLET';

  // Prepare allocations by units (initial)
  let baseRows = Array.from(unitsByAdm.entries()).map(([adm_code, units])=>({
    adm_code, units, wallet: walletKeyForAdm(adm_code)
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // WALLETLESS EARNINGS HANDLING ("BURN" MECHANISM)
  // ═══════════════════════════════════════════════════════════════════════════
  let poolAdjusted = pool;
  const unitsTotalAll = baseRows.reduce((s,r)=>s+r.units,0) || 1;
  const noWalletRows = baseRows.filter(r=>r.wallet==='NO_WALLET');
  const withWalletRows = baseRows.filter(r=>r.wallet!=='NO_WALLET');
  
  if(noWalletRows.length){
    // Calculate what % of pool belongs to walletless users
    const shareNoWallet = noWalletRows.reduce((s,r)=>s + (r.units/unitsTotalAll), 0);
    const amountNoWallet = pool * shareNoWallet;
    
    // Route burned earnings to founder (recorded in ledger for transparency)
    if(CREATOR_ADM_CODE){
      withWalletRows.push({ 
        adm_code: CREATOR_ADM_CODE, 
        wallet: CREATOR_ADM_CODE, 
        units: 0, 
        carry: amountNoWallet, 
        capped: false, 
        cap_reason: 'no_wallet_redirect' 
      });
    }
    
    // Reduce pool available to users with wallets
    poolAdjusted = pool - amountNoWallet;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WALLET CAPPING & WATERFALL DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════════════════
  const finalRows = enforceWalletCapWaterfill(withWalletRows, poolAdjusted, WALLET_CAP_PCT, CREATOR_ADM_CODE);

  const ledgerMeta = {
    totalUnits,
    received,
    poolCap,
    walletCapPct: WALLET_CAP_PCT,
    creatorRecipient: CREATOR_ADM_CODE||null,
    isBootstrap,
    monthsSinceLaunch,
    fullPool: isBootstrap ? fullPool : pool,
    founderPoolShare: isBootstrap ? founderPoolShare : 0,
    userPool: pool
  };
  
  writeLedger(tag, finalRows, pool, ledgerMeta);
  console.log(`\n✅ Ledger for ${tag} written with ${finalRows.length} rows.`);
  console.log(`   User Pool Distributed: $${pool.toFixed(2)}`);
  if(isBootstrap) console.log(`   Founder Pool Share: $${founderPoolShare.toFixed(2)}`);
  console.log();
}

// ═════════════════════════════════════════════════════════════════════════════
// WATERFALL DISTRIBUTION ALGORITHM
// ═════════════════════════════════════════════════════════════════════════════
function enforceWalletCapWaterfill(rows, pool, capPct, creatorAdm){
  const cap = pool * capPct;  // Max amount per wallet (e.g., $100 for $10k pool)
  const out = [];             // Final payout rows
  let poolRemaining = pool;   // Pool available for distribution
  const assignedWallets = new Set();  // Wallets already capped

  // Step 1: Aggregate units by wallet (handles multiple links per wallet)
  const unitsByWallet = new Map();
  for(const r of rows){
    unitsByWallet.set(r.wallet, (unitsByWallet.get(r.wallet)||0) + r.units);
  }

  // Step 2: Handle carry amounts (pre-allocated funds from burned wallets)
  const carryRows = rows.filter(r=>r.carry>EPS);
  if(carryRows.length){
    for(const r of carryRows){
      const amount = Math.min(poolRemaining, r.carry);
      out.push({ 
        adm_code: r.adm_code, 
        wallet: r.wallet, 
        units: r.units||0, 
        share: amount/pool, 
        amount_usd: amount, 
        capped: false, 
        cap_reason: r.cap_reason||'carry' 
      });
      poolRemaining -= amount;
    }
  }

  // Step 3: Iterative waterfall distribution
  let remaining = rows.filter(r=>!(r.carry>EPS));  // Exclude carry rows
  
  while(remaining.length && poolRemaining > EPS){
    const unitsTotal = remaining.reduce((s,r)=>s+r.units,0) || 1;
    
    // Calculate proposed allocation based on unit share
    const proposedByWallet = new Map();
    for(const r of remaining){
      const amount = poolRemaining * (r.units/unitsTotal);
      proposedByWallet.set(r.wallet, (proposedByWallet.get(r.wallet)||0) + amount);
    }
    
    // Check if any wallet exceeds cap
    const over = Array.from(proposedByWallet.entries())
      .filter(([w,a])=> a > cap + EPS && !assignedWallets.has(w));
    
    if(over.length === 0){
      // No wallets exceed cap → finalize distribution
      for(const r of remaining){
        const amount = poolRemaining * (r.units/unitsTotal);
        out.push({ 
          adm_code: r.adm_code, 
          wallet: r.wallet, 
          units: r.units, 
          share: amount/pool, 
          amount_usd: amount, 
          capped: false 
        });
      }
      poolRemaining = 0;
      break;
    }
    
    // Cap all over-limit wallets in this round
    for(const [w, totalAlloc] of over){
      // Get all links (adm_codes) for this wallet
      const walletRows = remaining.filter(r=>r.wallet===w);
      const unitsWallet = walletRows.reduce((s,r)=>s+r.units,0) || 1;
      
      // Distribute cap amount proportionally across wallet's links
      for(const r of walletRows){
        const amount = cap * (r.units/unitsWallet);
        out.push({ 
          adm_code: r.adm_code, 
          wallet: r.wallet, 
          units: r.units, 
          share: amount/pool, 
          amount_usd: amount, 
          capped: true, 
          cap_reason: 'wallet_cap_1pct' 
        });
      }
      
      // Remove capped wallet from next iteration
      remaining = remaining.filter(r=>r.wallet!==w);
      assignedWallets.add(w);
      poolRemaining -= cap;
      
      if(poolRemaining <= EPS) break;
    }
  }

  // Step 4: Handle overflow (all wallets capped, funds remain)
  if(poolRemaining > EPS){
    if(creatorAdm){
      out.push({ 
        adm_code: creatorAdm, 
        wallet: creatorAdm, 
        units: 0, 
        share: poolRemaining/pool, 
        amount_usd: poolRemaining, 
        capped: false, 
        cap_reason: 'creator_overflow' 
      });
      poolRemaining = 0;
    } else {
      out.push({ 
        adm_code: 'UNALLOCATED', 
        wallet: '', 
        units: 0, 
        share: poolRemaining/pool, 
        amount_usd: poolRemaining, 
        capped: false, 
        cap_reason: 'all_wallets_capped' 
      });
      poolRemaining = 0;
    }
  }

  // Step 5: Merge duplicate entries and finalize
  const merged = new Map();
  for(const r of out){
    const k = r.adm_code + '|' + r.wallet;  // Unique key per wallet
    const prev = merged.get(k);
    
    if(prev){
      // Merge with existing entry
      prev.units += r.units;
      prev.share += r.share;
      prev.amount_usd += r.amount_usd;
      prev.capped = prev.capped || r.capped;  // True if any entry capped
    } else {
      // First occurrence
      merged.set(k, { ...r });
    }
  }
  
  // Return sorted by payout amount (descending)
  return Array.from(merged.values()).sort((a,b) => b.amount_usd - a.amount_usd);
}

main().catch(e=>{ console.error(e); process.exit(1); });
