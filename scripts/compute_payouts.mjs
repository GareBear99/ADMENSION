#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import https from 'https';

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
  return lines.map(l=>l.split(',').map(s=>s.replace(/^\"|\"$/g,'')));
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
  const csvHead = 'adm_code,units,share,amount_usd\n';
  const csvBody = rows.map(r=>`${r.adm_code},${r.units},${r.share.toFixed(6)},${r.amount_usd.toFixed(2)}`).join('\n');
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

  const {start, end, tag} = lastMonthUTC();

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
  const pool = Math.min(received*0.13, poolCap);

  const rowsOut = Array.from(unitsByAdm.entries()).map(([adm_code, units])=>{
    const share = units/totalUnits;
    return { adm_code, units, share, amount_usd: share*pool };
  }).sort((a,b)=>b.amount_usd-a.amount_usd);

  writeLedger(tag, rowsOut, pool, { totalUnits, received, poolCap });
  console.log(`Ledger for ${tag} written with ${rowsOut.length} rows. Pool $${pool.toFixed(2)}.`);
}

main().catch(e=>{ console.error(e); process.exit(1); });
