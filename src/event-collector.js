(function(){
  'use strict';

  const CFG = {
    // Paste your collector endpoint (Google Apps Script web app URL) here:
    COLLECTOR_URL: window.ADMENSION_COLLECTOR_URL || null,
    TIMEOUT_MS: 1500,
  };

  async function send(type, payload){
    if(!CFG.COLLECTOR_URL) return; // silent no-op if not configured
    try{
      const ctrl = new AbortController();
      const id = setTimeout(()=>ctrl.abort(), CFG.TIMEOUT_MS);
      await fetch(CFG.COLLECTOR_URL, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          t: Date.now(),
          type,
          payload
        }),
        signal: ctrl.signal
      });
      clearTimeout(id);
    }catch(e){ /* ignore network failures */ }
  }

  window.ADMENSION_COLLECTOR = {
    send,
    pageview: (ev)=> send('pageview', ev),
    ad_request: (ev)=> send('ad_request', ev),
    ad_viewable: (ev)=> send('ad_viewable', ev),
    wallet_submit: (ev)=> send('wallet_submit', ev),
  };
})();
