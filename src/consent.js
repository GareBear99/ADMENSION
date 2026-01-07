/**
 * ADMENSION Consent Management v1.0
 * GDPR & CCPA compliant privacy consent system
 * 
 * Features:
 * - Cookie consent banner
 * - Geo-based consent requirements
 * - IAB TCF 2.0 compatible (ready for CMP integration)
 * - localStorage-based consent tracking
 * - Policy-compliant ad serving
 */

const CONSENT_CONFIG = {
  // Consent storage key
  storageKey: 'admension_consent',
  
  // Consent types
  types: {
    necessary: { required: true, default: true },
    analytics: { required: false, default: true },
    advertising: { required: false, default: true },
    personalization: { required: false, default: true }
  },
  
  // Geo-based consent requirements
  geoRequirements: {
    // EU/EEA + UK require explicit consent (GDPR)
    gdpr: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 
           'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB'],
    // California requires opt-out (CCPA/CPRA)
    ccpa: ['US-CA'],
    // Other regions: implied consent with opt-out option
    other: []
  },
  
  // Privacy policy URL (REQUIRED - update this)
  privacyPolicyUrl: '/privacy-policy.html',
  
  // Banner timeout (show after X ms)
  bannerDelay: 1000
};

class ConsentManager {
  constructor() {
    this.consent = this.loadConsent();
    this.geo = this.detectGeo();
    this.requiresExplicitConsent = this.checkConsentRequirement();
  }
  
  init() {
    console.log('[Consent] Initializing', { geo: this.geo, requiresExplicit: this.requiresExplicitConsent });
    
    // Check if consent already given
    if (this.consent && this.consent.timestamp) {
      const age = Date.now() - this.consent.timestamp;
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
      
      if (age < maxAge) {
        console.log('[Consent] Valid consent found');
        this.applyConsent();
        return;
      }
    }
    
    // Show banner if needed
    if (this.requiresExplicitConsent || !this.consent) {
      setTimeout(() => this.showBanner(), CONSENT_CONFIG.bannerDelay);
    } else {
      // Implied consent for non-GDPR/CCPA regions
      this.grantImpliedConsent();
    }
  }
  
  detectGeo() {
    // Try to detect from existing geo system
    if (window.__geoCountry) {
      return window.__geoCountry;
    }
    
    // Try to detect from timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Europe/')) return 'EU';
    if (tz.includes('America/Los_Angeles') || tz.includes('America/Phoenix')) return 'US-CA';
    if (tz.includes('America/')) return 'US';
    
    // Default to unknown
    return 'UNKNOWN';
  }
  
  checkConsentRequirement() {
    const geo = this.geo;
    
    // Check GDPR
    if (CONSENT_CONFIG.geoRequirements.gdpr.includes(geo) || geo === 'EU') {
      return 'gdpr';
    }
    
    // Check CCPA
    if (CONSENT_CONFIG.geoRequirements.ccpa.includes(geo)) {
      return 'ccpa';
    }
    
    return false;
  }
  
  loadConsent() {
    try {
      const stored = localStorage.getItem(CONSENT_CONFIG.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }
  
  saveConsent(consent) {
    try {
      consent.timestamp = Date.now();
      consent.version = '1.0';
      localStorage.setItem(CONSENT_CONFIG.storageKey, JSON.stringify(consent));
      this.consent = consent;
      console.log('[Consent] Saved:', consent);
    } catch (e) {
      console.error('[Consent] Failed to save:', e);
    }
  }
  
  grantImpliedConsent() {
    const consent = {};
    Object.keys(CONSENT_CONFIG.types).forEach(type => {
      consent[type] = CONSENT_CONFIG.types[type].default;
    });
    this.saveConsent(consent);
    this.applyConsent();
  }
  
  showBanner() {
    // Create banner HTML
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.className = 'consent-banner';
    banner.innerHTML = `
      <div class="consent-content">
        <div class="consent-text">
          <h3>Privacy & Cookies</h3>
          <p>We use cookies and similar technologies to improve your experience, analyze traffic, and serve personalized ads. 
          ${this.requiresExplicitConsent === 'gdpr' ? 'We need your consent to process your data.' : 'You can opt out anytime.'}
          </p>
          <a href="${CONSENT_CONFIG.privacyPolicyUrl}" target="_blank">Privacy Policy</a>
        </div>
        <div class="consent-buttons">
          <button id="consent-customize" class="consent-btn consent-btn-secondary">Customize</button>
          ${this.requiresExplicitConsent === 'gdpr' 
            ? '<button id="consent-reject" class="consent-btn consent-btn-secondary">Reject All</button>' 
            : ''}
          <button id="consent-accept" class="consent-btn consent-btn-primary">Accept All</button>
        </div>
      </div>
      <div id="consent-details" class="consent-details" style="display: none;">
        <h4>Privacy Preferences</h4>
        <div class="consent-option">
          <label>
            <input type="checkbox" id="consent-necessary" checked disabled>
            <span><strong>Necessary</strong> - Required for basic site functionality</span>
          </label>
        </div>
        <div class="consent-option">
          <label>
            <input type="checkbox" id="consent-analytics" checked>
            <span><strong>Analytics</strong> - Help us improve by collecting anonymous usage data</span>
          </label>
        </div>
        <div class="consent-option">
          <label>
            <input type="checkbox" id="consent-advertising" checked>
            <span><strong>Advertising</strong> - Enable personalized ads and revenue generation</span>
          </label>
        </div>
        <div class="consent-option">
          <label>
            <input type="checkbox" id="consent-personalization" checked>
            <span><strong>Personalization</strong> - Remember your preferences and settings</span>
          </label>
        </div>
        <div class="consent-buttons">
          <button id="consent-save" class="consent-btn consent-btn-primary">Save Preferences</button>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .consent-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(20, 20, 26, 0.98);
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        padding: 20px;
        z-index: 999999;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
      }
      .consent-content {
        max-width: 1100px;
        margin: 0 auto;
        display: flex;
        gap: 20px;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .consent-text {
        flex: 1;
        min-width: 300px;
        color: rgba(255, 255, 255, 0.92);
      }
      .consent-text h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 950;
      }
      .consent-text p {
        margin: 0 0 8px 0;
        font-size: 13px;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.75);
      }
      .consent-text a {
        color: #22d3ee;
        text-decoration: none;
        font-size: 12px;
      }
      .consent-text a:hover {
        text-decoration: underline;
      }
      .consent-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .consent-btn {
        padding: 11px 18px;
        border-radius: 12px;
        font-weight: 950;
        font-size: 13px;
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.12);
        transition: all 0.2s;
      }
      .consent-btn-primary {
        background: rgba(168, 85, 247, 0.22);
        border-color: rgba(168, 85, 247, 0.6);
        color: rgba(255, 255, 255, 0.92);
      }
      .consent-btn-primary:hover {
        background: rgba(168, 85, 247, 0.35);
      }
      .consent-btn-secondary {
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.85);
      }
      .consent-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.10);
      }
      .consent-details {
        max-width: 1100px;
        margin: 20px auto 0;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .consent-details h4 {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 950;
        color: rgba(255, 255, 255, 0.92);
      }
      .consent-option {
        margin: 10px 0;
      }
      .consent-option label {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.85);
        font-size: 13px;
      }
      .consent-option input[type="checkbox"] {
        margin-top: 2px;
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      @media (max-width: 768px) {
        .consent-content {
          flex-direction: column;
          align-items: flex-start;
        }
        .consent-buttons {
          width: 100%;
        }
        .consent-btn {
          flex: 1;
          min-width: 120px;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(banner);
    
    // Setup event listeners
    document.getElementById('consent-accept').onclick = () => this.acceptAll();
    document.getElementById('consent-customize').onclick = () => this.showCustomize();
    
    const rejectBtn = document.getElementById('consent-reject');
    if (rejectBtn) {
      rejectBtn.onclick = () => this.rejectAll();
    }
    
    const saveBtn = document.getElementById('consent-save');
    if (saveBtn) {
      saveBtn.onclick = () => this.saveCustom();
    }
  }
  
  showCustomize() {
    const details = document.getElementById('consent-details');
    if (details) {
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
  }
  
  acceptAll() {
    const consent = {};
    Object.keys(CONSENT_CONFIG.types).forEach(type => {
      consent[type] = true;
    });
    this.saveConsent(consent);
    this.hideBanner();
    this.applyConsent();
  }
  
  rejectAll() {
    const consent = {};
    Object.keys(CONSENT_CONFIG.types).forEach(type => {
      consent[type] = CONSENT_CONFIG.types[type].required;
    });
    this.saveConsent(consent);
    this.hideBanner();
    this.applyConsent();
  }
  
  saveCustom() {
    const consent = {
      necessary: true,
      analytics: document.getElementById('consent-analytics').checked,
      advertising: document.getElementById('consent-advertising').checked,
      personalization: document.getElementById('consent-personalization').checked
    };
    this.saveConsent(consent);
    this.hideBanner();
    this.applyConsent();
  }
  
  hideBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) {
      banner.style.opacity = '0';
      banner.style.transition = 'opacity 0.3s';
      setTimeout(() => banner.remove(), 300);
    }
  }
  
  applyConsent() {
    console.log('[Consent] Applying consent:', this.consent);
    
    // Apply to ad system
    if (window.AD_CONFIG) {
      window.AD_CONFIG.consentGranted = {
        analytics: this.consent.analytics,
        advertising: this.consent.advertising,
        personalization: this.consent.personalization
      };
    }
    
    // Enable/disable ads based on consent
    if (!this.consent.advertising) {
      console.log('[Consent] Advertising disabled - ads will not load');
      if (window.AD_CONFIG) {
        window.AD_CONFIG.adsense.enabled = false;
        window.AD_CONFIG.prebid.enabled = false;
      }
    }
    
    // Fire consent event
    window.dispatchEvent(new CustomEvent('consent-ready', { detail: this.consent }));
    
    // Update data layer for analytics
    if (typeof window.dataLayer !== 'undefined' && this.consent.analytics) {
      window.dataLayer.push({
        event: 'consent_update',
        consent: this.consent
      });
    }
  }
  
  // Public API
  hasConsent(type) {
    return this.consent && this.consent[type] === true;
  }
  
  revokeConsent() {
    localStorage.removeItem(CONSENT_CONFIG.storageKey);
    location.reload();
  }
  
  getConsent() {
    return { ...this.consent };
  }
}

// Initialize
let consentManager = null;

function initConsent() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConsent);
    return;
  }
  
  consentManager = new ConsentManager();
  consentManager.init();
  
  window.consentManager = consentManager;
}

// Auto-init
if (typeof window !== 'undefined') {
  initConsent();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConsentManager, CONSENT_CONFIG };
}
