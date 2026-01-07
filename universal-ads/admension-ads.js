/**
 * ADMENSION Universal Ad System v1.0
 * Single JS import for consistent ad behavior across all properties
 * 
 * AD HIERARCHY:
 * - Sidebar (L+R): AdSense/programmatic ads - HIDEABLE by user
 * - Bottom Anchor: 72-hour sponsored ads ONLY - NOT HIDEABLE, hidden when no sponsors active
 * - Support FAB: Donation modal
 * 
 * REVENUE ATTRIBUTION:
 * - Only traffic with ?adm=CODE parameter counts toward pool
 * - Organic traffic revenue → founder (not pooled)
 */

(function() {
  'use strict';

  // Global API
  window.ADMENSION_ADS = {
    version: '1.0.0',
    config: {},
    
    /**
     * Initialize the ad system
     * @param {Object} config - Configuration object
     * @param {string} config.collectorURL - URL for analytics collection
     * @param {string} config.siteSource - Site identifier (e.g. 'coinflip', 'lore-wiki')
     * @param {Object} config.supportAddresses - Crypto donation addresses
     * @param {boolean} config.showOnInteraction - Show sidebar ads on first interaction (default: true)
     * @param {string} config.adsenseClientID - AdSense client ID for sidebar ads
     */
    init: function(config) {
      this.config = {
        collectorURL: config.collectorURL || '',
        siteSource: config.siteSource || 'unknown',
        supportAddresses: config.supportAddresses || {},
        showOnInteraction: config.showOnInteraction !== false,
        adsenseClientID: config.adsenseClientID || ''
      };
      
      this.checkAttribution();
      this.injectHTML();
      this.initSidebarAds();
      this.initAnchorBar();
      this.initSupportModal();
      this.addBodyClass();
    },
    
    /**
     * Check for ?adm= parameter and store attribution
     */
    checkAttribution: function() {
      const urlParams = new URLSearchParams(window.location.search);
      const admCode = (urlParams.get('adm') || '').toUpperCase();
      
      if (admCode) {
        sessionStorage.setItem('admension_code', admCode);
        console.log('[ADMENSION] Attribution captured:', admCode);
      }
    },
    
    /**
     * Get current attribution code
     */
    getAdmCode: function() {
      return sessionStorage.getItem('admension_code') || null;
    },
    
    /**
     * Check if traffic is pooled (has attribution)
     */
    isPooledTraffic: function() {
      return !!this.getAdmCode();
    },
    
    /**
     * Track ad impression (only if attributed)
     * NOTE: For index.html integration, markAd() in index.html handles tracking
     * via ADMENSION_AD_VALIDATOR to prevent double-counting.
     * This trackImpression() is for standalone Universal Ads deployments.
     */
    trackImpression: function(placement, adType) {
      // Check if centralized tracking system exists (index.html integration)
      if (typeof markAd === 'function') {
        // Delegate to centralized tracking in index.html (prevents double-counting)
        console.log('[ADMENSION_ADS] Delegating tracking to centralized markAd():', placement);
        markAd(placement);
        return;
      }
      
      // Standalone mode: track directly to collector
      const code = this.getAdmCode();
      if (!code) {
        console.log('[ADMENSION] No attribution - impression not pooled');
        return;
      }
      
      if (!this.config.collectorURL) return;
      
      const payload = {
        type: 'ad_impression',
        placement: placement,
        ad_type: adType, // 'adsense' or 'sponsored'
        adm_code: code,
        site_source: this.config.siteSource,
        timestamp: Date.now()
      };
      
      fetch(this.config.collectorURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => console.error('[ADMENSION] Track failed:', e));
    },
    
    /**
     * Inject HTML structure into page
     */
    injectHTML: function() {
      const html = `
        <!-- ADMENSION Sidebar Ads (AdSense - Hideable) -->
        <div id="admension-sidebar-left" class="admension-sidebar-wrap left" style="display:none">
          <div class="admension-sidebar-head">
            <span class="mini"><b>Ad</b></span>
            <button class="admension-sidebar-close" data-side="left">Hide</button>
          </div>
          <div class="admension-sidebar-ad" id="admension-sidebar-left-slot">
            <div class="admension-ad-label">AdSense ad space</div>
          </div>
        </div>
        
        <div id="admension-sidebar-right" class="admension-sidebar-wrap right" style="display:none">
          <div class="admension-sidebar-head">
            <span class="mini"><b>Ad</b></span>
            <button class="admension-sidebar-close" data-side="right">Hide</button>
          </div>
          <div class="admension-sidebar-ad" id="admension-sidebar-right-slot">
            <div class="admension-ad-label">AdSense ad space</div>
          </div>
        </div>
        
        <div id="admension-sidebar-tab-left" class="admension-sidebar-tab left" style="display:none">
          <button data-side="left">Show ad</button>
        </div>
        
        <div id="admension-sidebar-tab-right" class="admension-sidebar-tab right" style="display:none">
          <button data-side="right">Show ad</button>
        </div>
        
        <!-- ADMENSION Bottom Anchor (Sponsored Ads Only - NOT Hideable) -->
        <div id="admension-anchor-bar" class="admension-anchor-bar" style="display:none">
          <div class="admension-anchor-inner">
            <div class="admension-anchor-left">
              <div class="admension-anchor-title" id="admension-anchor-title">Sponsored</div>
              <div class="admension-anchor-meta" id="admension-anchor-meta">72-hour placement</div>
            </div>
            <div class="admension-anchor-ad" id="admension-anchor-slot">
              <div class="admension-ad-placeholder">Sponsored ad • 728×90</div>
            </div>
          </div>
        </div>
        
        <!-- ADMENSION Support FAB -->
        <div class="admension-support-fab">
          <button class="admension-support-btn" id="admension-support-btn">💚 Support</button>
        </div>
        
        <!-- ADMENSION Support Modal -->
        <div class="admension-modal-overlay" id="admension-support-modal" aria-hidden="true">
          <div class="admension-modal" role="dialog" aria-modal="true">
            <div class="admension-modal-header">
              <div>
                <h2>Support (Optional)</h2>
                <p class="admension-modal-sub">Donations help fund infrastructure. No rewards or guarantees.</p>
              </div>
              <button class="admension-modal-close" id="admension-support-close">✕</button>
            </div>
            <div class="admension-modal-body">
              <div class="admension-modal-card">
                <h3>Donate</h3>
                <div class="admension-notice">
                  Optional support. No guaranteed returns. Helps fund ${this.config.siteSource} and ADMENSION ecosystem.
                </div>
                <div class="admension-donate-grid">
                  <div>
                    <div class="admension-donate-label">TRON (recommended)</div>
                    <div class="admension-addr-box" id="admension-addr-tron">${this.config.supportAddresses.tron || 'TRON_ADDRESS_HERE'}</div>
                    <button class="admension-btn-small" data-copy="admension-addr-tron">Copy</button>
                  </div>
                  <div>
                    <div class="admension-donate-label">ETH</div>
                    <div class="admension-addr-box" id="admension-addr-eth">${this.config.supportAddresses.eth || 'ETH_ADDRESS_HERE'}</div>
                    <button class="admension-btn-small" data-copy="admension-addr-eth">Copy</button>
                  </div>
                  <div>
                    <div class="admension-donate-label">BTC</div>
                    <div class="admension-addr-box" id="admension-addr-btc">${this.config.supportAddresses.btc || 'BTC_ADDRESS_HERE'}</div>
                    <button class="admension-btn-small" data-copy="admension-addr-btc">Copy</button>
                  </div>
                </div>
              </div>
              <div class="admension-modal-card">
                <h3>Share</h3>
                <div class="admension-addr-box" id="admension-share-text">Check this out: ${window.location.href} — ADMENSION network site</div>
                <button class="admension-btn-small" data-copy="admension-share-text">Copy share text</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- ADMENSION Toast -->
        <div class="admension-toast" id="admension-toast"></div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
    },
    
    /**
     * Initialize sidebar ads (sponsored priority, AdSense fallback)
     */
    initSidebarAds: function() {
      // Load active sponsors first
      const activeSponsors = this.getActiveSponsors();
      
      // If we have sponsored ads, show them (NOT hideable)
      if (activeSponsors.length > 0) {
        this.showSponsoredSidebars(activeSponsors);
        return;
      }
      
      // Otherwise show AdSense (hideable)
      this.showAdSenseSidebars();
    },
    
    /**
     * Show sponsored ads in sidebars (hideable)
     */
    showSponsoredSidebars: function(sponsors) {
      const KEY_L = 'admension_sidebar_hide_left';
      const KEY_R = 'admension_sidebar_hide_right';
      const KEY_SHOWN = 'admension_sidebar_shown';
      
      const sidebarLeft = document.getElementById('admension-sidebar-left');
      const sidebarRight = document.getElementById('admension-sidebar-right');
      const tabLeft = document.getElementById('admension-sidebar-tab-left');
      const tabRight = document.getElementById('admension-sidebar-tab-right');
      const leftSlot = document.getElementById('admension-sidebar-left-slot');
      const rightSlot = document.getElementById('admension-sidebar-right-slot');
      
      // Show close buttons for sidebars
      document.querySelectorAll('.admension-sidebar-close').forEach(btn => {
        btn.style.display = 'inline-block';
      });
      
      const adsShown = () => sessionStorage.getItem(KEY_SHOWN) === '1';
      const markShown = () => sessionStorage.setItem(KEY_SHOWN, '1');
      
      // Apply visibility with hide/show logic
      const apply = () => {
        const hideL = localStorage.getItem(KEY_L) === '1';
        const hideR = localStorage.getItem(KEY_R) === '1';
        const shown = adsShown();
        
        // Left sidebar (sponsor #1)
        if (sponsors[0]) {
          leftSlot.innerHTML = this.renderSponsorContent(sponsors[0]);
          
          if (hideL || !shown) {
            sidebarLeft.style.display = 'none';
            tabLeft.style.display = shown && hideL ? 'block' : 'none';
          } else {
            sidebarLeft.style.display = 'block';
            tabLeft.style.display = 'none';
            this.trackImpression('sidebar-left', 'sponsored');
          }
        }
        
        // Right sidebar (sponsor #2)
        if (sponsors[1]) {
          rightSlot.innerHTML = this.renderSponsorContent(sponsors[1]);
          
          if (hideR || !shown) {
            sidebarRight.style.display = 'none';
            tabRight.style.display = shown && hideR ? 'block' : 'none';
          } else {
            sidebarRight.style.display = 'block';
            tabRight.style.display = 'none';
            this.trackImpression('sidebar-right', 'sponsored');
          }
        } else {
          sidebarRight.style.display = 'none';
          tabRight.style.display = 'none';
        }
      };
      
      // Show ads on first interaction
      const showAds = () => {
        if (adsShown()) return;
        markShown();
        apply();
        console.log('[ADMENSION] Sponsored sidebar ads shown on interaction');
      };
      
      // Bind hide buttons
      document.querySelectorAll('.admension-sidebar-close').forEach(btn => {
        btn.onclick = () => {
          const side = btn.getAttribute('data-side');
          localStorage.setItem(side === 'left' ? KEY_L : KEY_R, '1');
          apply();
        };
      });
      
      // Bind show buttons
      document.querySelectorAll('.admension-sidebar-tab button').forEach(btn => {
        btn.onclick = () => {
          const side = btn.getAttribute('data-side');
          localStorage.removeItem(side === 'left' ? KEY_L : KEY_R);
          apply();
        };
      });
      
      // Initial state
      apply();
      
      // Hook interactions if enabled
      if (this.config.showOnInteraction) {
        const events = ['click', 'keydown', 'touchstart', 'scroll'];
        const once = () => {
          showAds();
          events.forEach(e => window.removeEventListener(e, once));
        };
        events.forEach(e => window.addEventListener(e, once, { once: true, passive: true }));
      }
      
      console.log(`[ADMENSION] ${sponsors.length} sponsored sidebar ad(s) loaded`);
    },
    
    /**
     * Show AdSense ads in sidebars (hideable)
     */
    showAdSenseSidebars: function() {
      const KEY_L = 'admension_sidebar_hide_left';
      const KEY_R = 'admension_sidebar_hide_right';
      const KEY_SHOWN = 'admension_sidebar_shown';
      
      const sidebarLeft = document.getElementById('admension-sidebar-left');
      const sidebarRight = document.getElementById('admension-sidebar-right');
      const tabLeft = document.getElementById('admension-sidebar-tab-left');
      const tabRight = document.getElementById('admension-sidebar-tab-right');
      
      // Check if ads have been shown this session
      const adsShown = () => sessionStorage.getItem(KEY_SHOWN) === '1';
      const markShown = () => sessionStorage.setItem(KEY_SHOWN, '1');
      
      // Apply visibility state
      const apply = () => {
        const hideL = localStorage.getItem(KEY_L) === '1';
        const hideR = localStorage.getItem(KEY_R) === '1';
        const shown = adsShown();
        
        // Left sidebar
        if (hideL || !shown) {
          sidebarLeft.style.display = 'none';
          tabLeft.style.display = shown && hideL ? 'block' : 'none';
        } else {
          sidebarLeft.style.display = 'block';
          tabLeft.style.display = 'none';
          this.trackImpression('sidebar-left', 'adsense');
        }
        
        // Right sidebar
        if (hideR || !shown) {
          sidebarRight.style.display = 'none';
          tabRight.style.display = shown && hideR ? 'block' : 'none';
        } else {
          sidebarRight.style.display = 'block';
          tabRight.style.display = 'none';
          this.trackImpression('sidebar-right', 'adsense');
        }
      };
      
      // Show ads on first interaction
      const showAds = () => {
        if (adsShown()) return;
        markShown();
        apply();
        console.log('[ADMENSION] Sidebar ads shown on interaction');
      };
      
      // Bind hide buttons
      document.querySelectorAll('.admension-sidebar-close').forEach(btn => {
        btn.onclick = () => {
          const side = btn.getAttribute('data-side');
          localStorage.setItem(side === 'left' ? KEY_L : KEY_R, '1');
          apply();
        };
      });
      
      // Bind show buttons
      document.querySelectorAll('.admension-sidebar-tab button').forEach(btn => {
        btn.onclick = () => {
          const side = btn.getAttribute('data-side');
          localStorage.removeItem(side === 'left' ? KEY_L : KEY_R);
          apply();
        };
      });
      
      // Initial state
      apply();
      
      // Hook interactions if enabled
      if (this.config.showOnInteraction) {
        const events = ['click', 'keydown', 'touchstart', 'scroll'];
        const once = () => {
          showAds();
          events.forEach(e => window.removeEventListener(e, once));
        };
        events.forEach(e => window.addEventListener(e, once, { once: true, passive: true }));
      }
    },
    
    /**
     * Get active sponsors (shared helper)
     */
    getActiveSponsors: function() {
      try {
        const raw = localStorage.getItem('cfamm.sponsors');
        if (!raw) return [];
        const all = JSON.parse(raw);
        const now = Date.now();
        return all.filter(s => now >= s.starts_at && now <= s.ends_at);
      } catch (e) {
        return [];
      }
    },
    
    /**
     * Render sponsor content HTML
     */
    renderSponsorContent: function(sponsor) {
      return `
        <a href="${sponsor.url}" target="_blank" rel="noopener" style="
          display:flex;
          width:100%;
          min-height:100%;
          align-items:center;
          justify-content:center;
          text-decoration:none;
          border:1px solid rgba(255,255,255,0.20);
          border-radius:12px;
          background:rgba(255,255,255,0.03);
          color:rgba(255,255,255,0.85);
          padding:12px;
          transition:all 120ms ease;
        " onmouseover="this.style.borderColor='rgba(255,255,255,0.35)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.20)'">
          <span style="font-weight:900;font-size:14px;text-align:center;">${sponsor.title}</span>
        </a>
      `;
    },
    
    /**
     * Initialize bottom anchor bar (shows 3rd sponsor OR hidden)
     */
    initAnchorBar: function() {
      const anchorBar = document.getElementById('admension-anchor-bar');
      const anchorTitle = document.getElementById('admension-anchor-title');
      const anchorMeta = document.getElementById('admension-anchor-meta');
      const anchorSlot = document.getElementById('admension-anchor-slot');
      
      // Update anchor bar display
      const updateAnchorBar = () => {
        const active = this.getActiveSponsors();
        
        // Anchor bar shows 3rd sponsor only (if 3+ sponsors exist)
        if (active.length >= 3) {
          anchorBar.style.display = 'block';
          anchorTitle.textContent = active[2].title || 'Sponsored';
          anchorMeta.textContent = '72-hour placement';
          anchorSlot.innerHTML = this.renderSponsorContent(active[2]);
          this.trackImpression('anchor-sponsored', 'sponsored');
          console.log('[ADMENSION] 3rd sponsor displayed in anchor bar');
        } else {
          // Less than 3 sponsors - hide anchor bar completely
          anchorBar.style.display = 'none';
          console.log('[ADMENSION] <3 sponsors - anchor bar hidden');
        }
      };
      
      // Initial render
      updateAnchorBar();
      
      // Re-check every minute for sponsor changes
      setInterval(updateAnchorBar, 60000);
    },
    
    /**
     * Initialize support modal
     */
    initSupportModal: function() {
      const btn = document.getElementById('admension-support-btn');
      const modal = document.getElementById('admension-support-modal');
      const closeBtn = document.getElementById('admension-support-close');
      
      // Open modal
      if (btn) {
        btn.onclick = () => {
          modal.setAttribute('aria-hidden', 'false');
        };
      }
      
      // Close modal
      if (closeBtn) {
        closeBtn.onclick = () => {
          modal.setAttribute('aria-hidden', 'true');
        };
      }
      
      // Close on overlay click
      if (modal) {
        modal.onclick = (e) => {
          if (e.target === modal) {
            modal.setAttribute('aria-hidden', 'true');
          }
        };
      }
      
      // Copy to clipboard
      document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.onclick = () => {
          const targetId = btn.getAttribute('data-copy');
          const target = document.getElementById(targetId);
          if (!target) return;
          
          const text = target.textContent;
          
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
              this.showToast('Copied! ✓');
            }).catch(() => {
              this.fallbackCopy(text);
            });
          } else {
            this.fallbackCopy(text);
          }
        };
      });
    },
    
    /**
     * Fallback clipboard copy
     */
    fallbackCopy: function(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.showToast('Copied! ✓');
      } catch (e) {
        this.showToast('Copy failed');
      }
      document.body.removeChild(textarea);
    },
    
    /**
     * Show toast notification
     */
    showToast: function(message) {
      const toast = document.getElementById('admension-toast');
      if (!toast) return;
      
      toast.textContent = message;
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    },
    
    /**
     * Add body class for spacing
     */
    addBodyClass: function() {
      document.body.classList.add('admension-ads-active');
    }
  };
  
  console.log('[ADMENSION] Universal Ad System v1.0.0 loaded');
})();
