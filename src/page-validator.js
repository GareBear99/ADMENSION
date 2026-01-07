/**
 * ADMENSION Page Validation System v1.0
 * Comprehensive validation for page rendering, ad placements, and system integrity
 * 
 * Features:
 * - Visual validation overlay (toggle with Ctrl+Shift+V)
 * - Real-time page element checks
 * - Ad placement verification
 * - Tracking system validation
 * - Console logging with color coding
 * - Auto-validation on page change
 */

(function() {
  'use strict';

  // Validation configuration
  const CONFIG = {
    AUTO_VALIDATE: true, // Run validation on every page change
    SHOW_OVERLAY: false, // Show validation overlay by default
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    STORAGE_KEY: 'admension_validation_config'
  };

  // Load saved config
  try {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) Object.assign(CONFIG, JSON.parse(saved));
  } catch(e) {}

  // Page element requirements
  const PAGE_REQUIREMENTS = {
    home: {
      required_elements: [
        { id: 'page-home', type: 'section', class: 'page' },
        { id: 'dailyQuoteContainer', type: 'div' },
        { id: 'liveRPM', type: 'div' },
        { id: 'homePoolWrap', type: 'div' },
        { id: 'homePoolBadge', type: 'div' },
        { id: 'homePoolFill', type: 'div' }
      ],
      required_ads: [
        { slot: 'anchor', description: 'Bottom sticky anchor bar' },
        { slot: 'home_top_banner', description: 'Top banner above content' },
        { slot: 'home_incontent', description: 'In-content ad placement' }
      ],
      validation_checks: [
        { name: 'Demo Visible', check: () => document.getElementById('demoWrap') !== null },
        { name: 'Daily Quote Loaded', check: () => {
          const container = document.getElementById('dailyQuoteContainer');
          return container && container.innerHTML.trim() !== '';
        }},
        { name: 'Pool Stats Visible', check: () => {
          const wrap = document.getElementById('homePoolWrap');
          return wrap && wrap.style.display !== 'none';
        }}
      ]
    },
    
    stats: {
      required_elements: [
        { id: 'page-stats', type: 'section', class: 'page' },
        { id: 'statsRevenue', type: 'div' },
        { id: 'statsPageviews', type: 'div' },
        { id: 'statsSessions', type: 'div' }
      ],
      required_ads: [
        { slot: 'anchor', description: 'Bottom sticky anchor bar' },
        { slot: 'stats_top_banner', description: 'Top banner' },
        { slot: 'stats_incontent', description: 'In-content ad' }
      ],
      validation_checks: [
        { name: 'Stats Data Loaded', check: () => {
          const rev = document.getElementById('statsRevenue');
          return rev && rev.textContent !== '$0.00';
        }},
        { name: 'Charts Visible', check: () => {
          const charts = document.querySelectorAll('#page-stats canvas');
          return charts.length > 0;
        }}
      ]
    },
    
    create: {
      required_elements: [
        { id: 'page-create', type: 'section', class: 'page' },
        { id: 'createForm', type: 'form' },
        { id: 'destinationURL', type: 'input' },
        { id: 'createBtn', type: 'button' }
      ],
      required_ads: [
        { slot: 'anchor', description: 'Bottom sticky anchor bar' },
        { slot: 'create_top_banner', description: 'Top banner' },
        { slot: 'create_incontent', description: 'In-content ad' }
      ],
      validation_checks: [
        { name: 'Form Functional', check: () => {
          const form = document.getElementById('createForm');
          return form && form.onsubmit !== null;
        }},
        { name: 'Input Validation', check: () => {
          const input = document.getElementById('destinationURL');
          return input && input.type === 'url';
        }}
      ]
    },
    
    manage: {
      required_elements: [
        { id: 'page-manage', type: 'section', class: 'page' },
        { id: 'manageList', type: 'div' }
      ],
      required_ads: [
        { slot: 'anchor', description: 'Bottom sticky anchor bar' },
        { slot: 'manage_top_banner', description: 'Top banner' },
        { slot: 'manage_incontent', description: 'In-content ad' }
      ],
      validation_checks: [
        { name: 'Link List Rendered', check: () => {
          const list = document.getElementById('manageList');
          return list !== null;
        }}
      ]
    },
    
    docs: {
      required_elements: [
        { id: 'page-docs', type: 'section', class: 'page' }
      ],
      required_ads: [
        { slot: 'anchor', description: 'Bottom sticky anchor bar' },
        { slot: 'docs_top_banner', description: 'Top banner' },
        { slot: 'docs_incontent', description: 'In-content ad' }
      ],
      validation_checks: [
        { name: 'Documentation Sections', check: () => {
          const sections = document.querySelectorAll('#page-docs .card');
          return sections.length >= 3;
        }}
      ]
    },
    
    admin: {
      required_elements: [
        { id: 'page-admin', type: 'section', class: 'page' },
        { id: 'adminStatus', type: 'div' },
        { id: 'adminContent', type: 'div' }
      ],
      required_ads: [
        { slot: 'anchor', description: 'Bottom sticky anchor bar' },
        { slot: 'admin_top_banner', description: 'Top banner' },
        { slot: 'admin_incontent', description: 'In-content ad' }
      ],
      validation_checks: [
        { name: 'Admin Lock Active', check: () => {
          return typeof adminUnlocked !== 'undefined';
        }},
        { name: 'Unlock Button Exists', check: () => {
          return document.querySelector('[onclick*="adminUnlock"]') !== null;
        }}
      ]
    }
  };

  // Global system checks (run on all pages)
  const GLOBAL_CHECKS = {
    'Navigation Bar': () => {
      const nav = document.getElementById('nav');
      return nav && nav.querySelectorAll('a').length === 7; // 6 pages + screenshot
    },
    'Pills Visible': () => {
      const pills = document.querySelector('.pills');
      return pills && pills.style.display !== 'none';
    },
    'Debug Pill Active': () => {
      const debug = document.getElementById('pillDebug');
      return debug && debug.textContent.includes('✅');
    },
    'Ad Tracking Loaded': () => {
      return typeof markAd === 'function' && typeof logEvent === 'function';
    },
    'AD_VALIDATOR Present': () => {
      return typeof window.ADMENSION_AD_VALIDATOR !== 'undefined';
    },
    'Sponsor System Loaded': () => {
      return typeof spRenderSticky === 'function';
    },
    'Current Page Detection': () => {
      return typeof currentPage === 'function' && currentPage() !== null;
    },
    'Session Storage Active': () => {
      try {
        const sid = localStorage.getItem('cfamm.sid');
        return sid && sid.length > 0;
      } catch(e) {
        return false;
      }
    }
  };

  // Ad placement validation
  const AD_PLACEMENT_CHECKS = {
    'Sidebar Ads Exist': () => {
      const left = document.getElementById('sideLeftWrap');
      const right = document.getElementById('sideRightWrap');
      return (left || right) !== null;
    },
    'Sticky Anchor Exists': () => {
      return document.getElementById('stickyBox') !== null;
    },
    'Ad Scripts Loaded': () => {
      const scripts = Array.from(document.scripts);
      return scripts.some(s => s.src.includes('ads-config'));
    }
  };

  // Validation result storage
  let lastValidation = null;
  let validationOverlay = null;

  // Validation class
  class PageValidator {
    constructor() {
      this.results = {
        timestamp: Date.now(),
        page: null,
        global_checks: {},
        page_checks: {},
        ad_placements: {},
        elements: {},
        ads: {},
        warnings: [],
        errors: [],
        score: 0
      };
    }

    validate(pageName) {
      console.log(`%c[VALIDATOR] Starting validation for page: ${pageName}`, 'color: #00ffff; font-weight: bold;');
      
      this.results.page = pageName;
      this.results.timestamp = Date.now();
      
      // Run global checks
      this.validateGlobalSystems();
      
      // Run page-specific checks
      if (PAGE_REQUIREMENTS[pageName]) {
        this.validatePageElements(pageName);
        this.validatePageChecks(pageName);
        this.validateAdPlacements(pageName);
      } else {
        this.results.warnings.push(`No validation rules defined for page: ${pageName}`);
      }
      
      // Run ad placement checks
      this.validateAdSystems();
      
      // Calculate score
      this.calculateScore();
      
      // Log results
      this.logResults();
      
      // Update overlay if visible
      if (CONFIG.SHOW_OVERLAY) {
        this.updateOverlay();
      }
      
      lastValidation = this.results;
      return this.results;
    }

    validateGlobalSystems() {
      console.log('%c[VALIDATOR] Checking global systems...', 'color: #ffaa00;');
      
      for (const [name, check] of Object.entries(GLOBAL_CHECKS)) {
        try {
          const passed = check();
          this.results.global_checks[name] = passed;
          
          if (passed) {
            console.log(`%c✓ ${name}`, 'color: #00ff00;');
          } else {
            console.warn(`%c✗ ${name}`, 'color: #ff6600;');
            this.results.warnings.push(`Global check failed: ${name}`);
          }
        } catch (e) {
          this.results.global_checks[name] = false;
          this.results.errors.push(`Global check error (${name}): ${e.message}`);
          console.error(`%c✗ ${name}: ${e.message}`, 'color: #ff0000;');
        }
      }
    }

    validatePageElements(pageName) {
      console.log('%c[VALIDATOR] Checking page elements...', 'color: #ffaa00;');
      
      const requirements = PAGE_REQUIREMENTS[pageName].required_elements || [];
      
      for (const req of requirements) {
        const element = document.getElementById(req.id);
        const exists = element !== null;
        
        this.results.elements[req.id] = {
          exists,
          type: req.type,
          visible: exists ? element.offsetParent !== null : false,
          class_correct: exists && req.class ? element.classList.contains(req.class) : true
        };
        
        if (!exists) {
          this.results.errors.push(`Required element missing: #${req.id}`);
          console.error(`%c✗ Element #${req.id} NOT FOUND`, 'color: #ff0000;');
        } else if (!this.results.elements[req.id].visible) {
          this.results.warnings.push(`Element not visible: #${req.id}`);
          console.warn(`%c⚠ Element #${req.id} exists but not visible`, 'color: #ff6600;');
        } else {
          console.log(`%c✓ Element #${req.id}`, 'color: #00ff00;');
        }
      }
    }

    validatePageChecks(pageName) {
      console.log('%c[VALIDATOR] Running page-specific checks...', 'color: #ffaa00;');
      
      const checks = PAGE_REQUIREMENTS[pageName].validation_checks || [];
      
      for (const check of checks) {
        try {
          const passed = check.check();
          this.results.page_checks[check.name] = passed;
          
          if (passed) {
            console.log(`%c✓ ${check.name}`, 'color: #00ff00;');
          } else {
            console.warn(`%c✗ ${check.name}`, 'color: #ff6600;');
            this.results.warnings.push(`Page check failed: ${check.name}`);
          }
        } catch (e) {
          this.results.page_checks[check.name] = false;
          this.results.errors.push(`Page check error (${check.name}): ${e.message}`);
          console.error(`%c✗ ${check.name}: ${e.message}`, 'color: #ff0000;');
        }
      }
    }

    validateAdPlacements(pageName) {
      console.log('%c[VALIDATOR] Checking ad placements...', 'color: #ffaa00;');
      
      const ads = PAGE_REQUIREMENTS[pageName].required_ads || [];
      
      for (const ad of ads) {
        // Check if ad slot was marked (tracked)
        const tracked = this.checkAdTracked(ad.slot);
        
        this.results.ads[ad.slot] = {
          description: ad.description,
          tracked: tracked,
          expected: true
        };
        
        if (tracked) {
          console.log(`%c✓ Ad slot tracked: ${ad.slot}`, 'color: #00ff00;');
        } else {
          console.warn(`%c⚠ Ad slot NOT tracked: ${ad.slot} (${ad.description})`, 'color: #ff6600;');
          this.results.warnings.push(`Ad slot not tracked: ${ad.slot}`);
        }
      }
    }

    validateAdSystems() {
      console.log('%c[VALIDATOR] Checking ad systems...', 'color: #ffaa00;');
      
      for (const [name, check] of Object.entries(AD_PLACEMENT_CHECKS)) {
        try {
          const passed = check();
          this.results.ad_placements[name] = passed;
          
          if (passed) {
            console.log(`%c✓ ${name}`, 'color: #00ff00;');
          } else {
            console.warn(`%c✗ ${name}`, 'color: #ff6600;');
            this.results.warnings.push(`Ad system check failed: ${name}`);
          }
        } catch (e) {
          this.results.ad_placements[name] = false;
          this.results.errors.push(`Ad system error (${name}): ${e.message}`);
          console.error(`%c✗ ${name}: ${e.message}`, 'color: #ff0000;');
        }
      }
    }

    checkAdTracked(slot) {
      // Check localStorage for ad tracking
      try {
        const ads = JSON.parse(localStorage.getItem('cfamm.ads') || '[]');
        return ads.some(ad => ad.slot === slot);
      } catch(e) {
        return false;
      }
    }

    calculateScore() {
      let total = 0;
      let passed = 0;
      
      // Global checks (20 points each)
      for (const result of Object.values(this.results.global_checks)) {
        total += 20;
        if (result) passed += 20;
      }
      
      // Element checks (10 points each)
      for (const elem of Object.values(this.results.elements)) {
        total += 10;
        if (elem.exists && elem.visible) passed += 10;
      }
      
      // Page checks (15 points each)
      for (const result of Object.values(this.results.page_checks)) {
        total += 15;
        if (result) passed += 15;
      }
      
      // Ad checks (10 points each)
      for (const ad of Object.values(this.results.ads)) {
        total += 10;
        if (ad.tracked) passed += 10;
      }
      
      // Ad placement checks (15 points each)
      for (const result of Object.values(this.results.ad_placements)) {
        total += 15;
        if (result) passed += 15;
      }
      
      this.results.score = total > 0 ? Math.round((passed / total) * 100) : 0;
    }

    logResults() {
      const { score, errors, warnings } = this.results;
      
      console.log(`\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: #00ffff;');
      console.log(`%c  VALIDATION COMPLETE: ${this.results.page.toUpperCase()}`, 'color: #00ffff; font-weight: bold; font-size: 14px;');
      console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: #00ffff;');
      
      // Score
      const scoreColor = score >= 90 ? '#00ff00' : score >= 70 ? '#ffaa00' : '#ff0000';
      console.log(`%c  SCORE: ${score}/100`, `color: ${scoreColor}; font-weight: bold; font-size: 16px;`);
      
      // Errors
      if (errors.length > 0) {
        console.log(`%c\n  ❌ ERRORS (${errors.length}):`, 'color: #ff0000; font-weight: bold;');
        errors.forEach(err => console.log(`%c    • ${err}`, 'color: #ff0000;'));
      }
      
      // Warnings
      if (warnings.length > 0) {
        console.log(`%c\n  ⚠️  WARNINGS (${warnings.length}):`, 'color: #ff6600; font-weight: bold;');
        warnings.forEach(warn => console.log(`%c    • ${warn}`, 'color: #ff6600;'));
      }
      
      if (errors.length === 0 && warnings.length === 0) {
        console.log(`%c\n  ✅ ALL CHECKS PASSED`, 'color: #00ff00; font-weight: bold;');
      }
      
      console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`, 'color: #00ffff;');
    }

    updateOverlay() {
      if (!validationOverlay) {
        this.createOverlay();
      }
      
      const content = this.generateOverlayHTML();
      validationOverlay.innerHTML = content;
    }

    createOverlay() {
      validationOverlay = document.createElement('div');
      validationOverlay.id = 'admension-validation-overlay';
      validationOverlay.style.cssText = `
        position: fixed;
        top: 60px;
        right: 10px;
        width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        background: rgba(12, 12, 16, 0.95);
        border: 2px solid #00ffff;
        border-radius: 12px;
        padding: 16px;
        z-index: 9999;
        font-family: ui-monospace, monospace;
        font-size: 12px;
        color: #fff;
        box-shadow: 0 8px 32px rgba(0, 255, 255, 0.3);
      `;
      document.body.appendChild(validationOverlay);
    }

    generateOverlayHTML() {
      const { page, score, global_checks, elements, page_checks, ads, ad_placements, errors, warnings } = this.results;
      const scoreColor = score >= 90 ? '#00ff00' : score >= 70 ? '#ffaa00' : '#ff0000';
      
      let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #00ffff; padding-bottom: 8px;">
          <div style="font-weight: bold; font-size: 14px; color: #00ffff;">VALIDATION: ${page.toUpperCase()}</div>
          <div style="font-weight: bold; font-size: 18px; color: ${scoreColor};">${score}/100</div>
        </div>
      `;
      
      // Global checks
      html += `<div style="margin-bottom: 12px;"><b style="color: #ffaa00;">Global Systems:</b>`;
      for (const [name, passed] of Object.entries(global_checks)) {
        const icon = passed ? '✓' : '✗';
        const color = passed ? '#00ff00' : '#ff0000';
        html += `<div style="color: ${color}; margin-left: 8px;">${icon} ${name}</div>`;
      }
      html += `</div>`;
      
      // Elements
      html += `<div style="margin-bottom: 12px;"><b style="color: #ffaa00;">Elements:</b>`;
      for (const [id, data] of Object.entries(elements)) {
        const icon = data.exists && data.visible ? '✓' : '✗';
        const color = data.exists && data.visible ? '#00ff00' : '#ff0000';
        html += `<div style="color: ${color}; margin-left: 8px;">${icon} #${id}</div>`;
      }
      html += `</div>`;
      
      // Page checks
      if (Object.keys(page_checks).length > 0) {
        html += `<div style="margin-bottom: 12px;"><b style="color: #ffaa00;">Page Checks:</b>`;
        for (const [name, passed] of Object.entries(page_checks)) {
          const icon = passed ? '✓' : '✗';
          const color = passed ? '#00ff00' : '#ff0000';
          html += `<div style="color: ${color}; margin-left: 8px;">${icon} ${name}</div>`;
        }
        html += `</div>`;
      }
      
      // Ads
      html += `<div style="margin-bottom: 12px;"><b style="color: #ffaa00;">Ad Slots:</b>`;
      for (const [slot, data] of Object.entries(ads)) {
        const icon = data.tracked ? '✓' : '⚠';
        const color = data.tracked ? '#00ff00' : '#ff6600';
        html += `<div style="color: ${color}; margin-left: 8px;">${icon} ${slot}</div>`;
      }
      html += `</div>`;
      
      // Ad placements
      html += `<div style="margin-bottom: 12px;"><b style="color: #ffaa00;">Ad Systems:</b>`;
      for (const [name, passed] of Object.entries(ad_placements)) {
        const icon = passed ? '✓' : '✗';
        const color = passed ? '#00ff00' : '#ff0000';
        html += `<div style="color: ${color}; margin-left: 8px;">${icon} ${name}</div>`;
      }
      html += `</div>`;
      
      // Errors and warnings summary
      if (errors.length > 0 || warnings.length > 0) {
        html += `<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #00ffff;">`;
        if (errors.length > 0) {
          html += `<div style="color: #ff0000; font-weight: bold;">❌ ${errors.length} Error(s)</div>`;
        }
        if (warnings.length > 0) {
          html += `<div style="color: #ff6600; font-weight: bold;">⚠️  ${warnings.length} Warning(s)</div>`;
        }
        html += `</div>`;
      }
      
      html += `<div style="margin-top: 12px; font-size: 10px; color: #666; text-align: center;">Ctrl+Shift+V to toggle</div>`;
      
      return html;
    }
  }

  // Create global instance
  window.ADMENSION_VALIDATOR = {
    version: '1.0.0',
    config: CONFIG,
    lastValidation: null,
    
    validate: function(pageName) {
      const validator = new PageValidator();
      const results = validator.validate(pageName || currentPage());
      this.lastValidation = results;
      return results;
    },
    
    toggleOverlay: function() {
      CONFIG.SHOW_OVERLAY = !CONFIG.SHOW_OVERLAY;
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(CONFIG));
      
      if (CONFIG.SHOW_OVERLAY) {
        this.validate(currentPage());
      } else if (validationOverlay) {
        validationOverlay.remove();
        validationOverlay = null;
      }
      
      console.log(`[VALIDATOR] Overlay ${CONFIG.SHOW_OVERLAY ? 'ENABLED' : 'DISABLED'}`);
    },
    
    getLastResults: function() {
      return this.lastValidation || lastValidation;
    },
    
    exportResults: function() {
      const results = this.getLastResults();
      if (!results) {
        console.warn('[VALIDATOR] No validation results to export');
        return null;
      }
      
      const json = JSON.stringify(results, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation_${results.page}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('[VALIDATOR] Results exported');
    }
  };

  // Keyboard shortcut: Ctrl+Shift+V to toggle overlay
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
      e.preventDefault();
      window.ADMENSION_VALIDATOR.toggleOverlay();
    }
  });

  // Auto-validate on page changes if enabled
  if (CONFIG.AUTO_VALIDATE) {
    window.addEventListener('hashchange', () => {
      setTimeout(() => {
        const page = currentPage();
        if (page && typeof window.ADMENSION_VALIDATOR !== 'undefined') {
          window.ADMENSION_VALIDATOR.validate(page);
        }
      }, 500); // Wait for page to render
    });
  }

  // Initial validation on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.ADMENSION_VALIDATOR.validate(currentPage());
      }, 1000);
    });
  } else {
    setTimeout(() => {
      window.ADMENSION_VALIDATOR.validate(currentPage());
    }, 1000);
  }

  console.log('%c[ADMENSION_VALIDATOR] Loaded successfully', 'color: #00ffff; font-weight: bold;');
  console.log('%cPress Ctrl+Shift+V to toggle validation overlay', 'color: #ffaa00;');

})();
