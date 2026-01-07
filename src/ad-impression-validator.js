/**
 * ADMENSION Ad Impression Validator
 * 
 * Distinguishes between:
 * 1. Placeholder requests (pre-AdSense) - NOT revenue generating
 * 2. Real AdSense impressions (post-approval) - Revenue generating
 * 3. IVT-filtered impressions - Removed from revenue calculations
 * 4. Viewable impressions - Actually billed by AdSense
 * 
 * Provides accurate pool balance estimates based on validated impressions only.
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    STORAGE_KEY: 'admension_impression_log',
    ADSENSE_STATUS_KEY: 'admension_adsense_status',
    PUBLISHER_ID_KEY: 'admension_publisher_id',
    
    // Viewability thresholds (IAB/MRC standard)
    MIN_VIEWABLE_PERCENTAGE: 50, // 50% of ad visible
    MIN_VIEWABLE_DURATION: 1000,  // 1 second
    
    // Revenue estimation (Week 12 targets, adjusted for IVT)
    BASE_RPM: {
      NEW: 12.05,      // 0-2 sessions
      ENGAGED: 15.22,  // 3-9 sessions
      RETAINED: 19.79, // 10-24 sessions
      POWER: 24.35     // 25+ sessions
    },
    
    // Viewability rates by ad type (from industry data)
    VIEWABILITY_RATES: {
      anchor: 0.95,      // Sticky anchor ads
      banner: 0.85,      // Top banner ads
      incontent: 0.85,   // In-content ads
      rail: 0.70,        // Desktop rail ads
      tall: 0.60,        // Tall sidebar ads
      default: 0.82      // Weighted average
    },
    
    // IVT filtering rate (conservative estimate)
    IVT_FILTER_RATE: 0.92  // 8% filtered as invalid
  };

  class AdImpressionValidator {
    constructor() {
      this.impressions = this.loadImpressions();
      this.adsenseStatus = this.loadAdSenseStatus();
      
      console.log('[ADMENSION] Ad Impression Validator initialized');
      console.log(`[ADMENSION] AdSense Status: ${this.adsenseStatus.approved ? 'APPROVED' : 'PENDING'}`);
      console.log(`[ADMENSION] Publisher ID: ${this.adsenseStatus.publisherId || 'NOT SET'}`);
    }

    /**
     * Load impression log from localStorage
     */
    loadImpressions() {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch(e) {
        console.error('[ADMENSION] Failed to load impressions:', e);
        return [];
      }
    }

    /**
     * Save impression log to localStorage
     */
    saveImpressions() {
      try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.impressions));
      } catch(e) {
        console.error('[ADMENSION] Failed to save impressions:', e);
      }
    }

    /**
     * Load AdSense approval status
     */
    loadAdSenseStatus() {
      try {
        const data = localStorage.getItem(CONFIG.ADSENSE_STATUS_KEY);
        if (data) {
          return JSON.parse(data);
        }
      } catch(e) {}
      
      // Default: Check if publisher ID is set in ads-config
      const publisherId = this.getPublisherId();
      return {
        approved: publisherId && publisherId !== 'ca-pub-0000000000000000',
        publisherId: publisherId,
        approvalDate: null
      };
    }

    /**
     * Get AdSense Publisher ID from config
     */
    getPublisherId() {
      try {
        if (window.ADMENSION_ADS_CONFIG && window.ADMENSION_ADS_CONFIG.ADSENSE_PUBLISHER_ID) {
          return window.ADMENSION_ADS_CONFIG.ADSENSE_PUBLISHER_ID;
        }
      } catch(e) {}
      return null;
    }

    /**
     * Update AdSense status (called when publisher adds their ID)
     */
    setAdSenseApproved(publisherId) {
      this.adsenseStatus = {
        approved: true,
        publisherId: publisherId,
        approvalDate: Date.now()
      };
      localStorage.setItem(CONFIG.ADSENSE_STATUS_KEY, JSON.stringify(this.adsenseStatus));
      console.log(`[ADMENSION] AdSense approved with Publisher ID: ${publisherId}`);
    }

    /**
     * Log an ad impression with full validation data
     */
    logImpression(data) {
      const impression = {
        timestamp: Date.now(),
        slot: data.slot || 'unknown',
        page: data.page || 'unknown',
        
        // AdSense status at time of impression
        adsenseApproved: this.adsenseStatus.approved,
        publisherId: this.adsenseStatus.publisherId,
        
        // Impression type
        type: this.adsenseStatus.approved ? 'real' : 'placeholder',
        
        // Viewability data (will be updated when measured)
        viewable: null,
        viewabilityData: {
          visiblePercentage: null,
          visibleDuration: null,
          measured: false
        },
        
        // Validation flags
        ivtFiltered: false,
        ivtReason: null,
        
        // Engagement tier at time of impression
        engagementTier: this.getEngagementTier(),
        
        // Session data
        sessionId: data.sessionId || null,
        deviceType: data.device || 'unknown',
        
        // Revenue estimation
        estimatedRPM: null,
        estimatedRevenue: null,
        
        // Metadata
        utmSource: data.utm?.utm_source || null,
        referrer: data.referrer || null
      };
      
      // Calculate estimated RPM based on tier
      if (impression.adsenseApproved) {
        impression.estimatedRPM = this.getEstimatedRPM(impression.engagementTier);
      }
      
      this.impressions.push(impression);
      this.saveImpressions();
      
      return impression;
    }

    /**
     * Update impression with viewability measurement
     */
    updateViewability(impressionId, visiblePercentage, visibleDuration) {
      const impression = this.impressions[impressionId];
      if (!impression) return;
      
      impression.viewabilityData = {
        visiblePercentage: visiblePercentage,
        visibleDuration: visibleDuration,
        measured: true
      };
      
      // Determine if viewable (IAB/MRC standard)
      impression.viewable = (
        visiblePercentage >= CONFIG.MIN_VIEWABLE_PERCENTAGE &&
        visibleDuration >= CONFIG.MIN_VIEWABLE_DURATION
      );
      
      // Calculate estimated revenue if viewable and real
      if (impression.viewable && impression.adsenseApproved) {
        impression.estimatedRevenue = (impression.estimatedRPM / 1000);
      }
      
      this.saveImpressions();
    }

    /**
     * Mark impression as IVT-filtered
     */
    markAsIVT(impressionId, reason) {
      const impression = this.impressions[impressionId];
      if (!impression) return;
      
      impression.ivtFiltered = true;
      impression.ivtReason = reason;
      impression.estimatedRevenue = 0; // No revenue from IVT
      
      this.saveImpressions();
    }

    /**
     * Get current engagement tier from engagement tracker
     */
    getEngagementTier() {
      try {
        if (window.ADMENSION_ENGAGEMENT) {
          const stats = window.ADMENSION_ENGAGEMENT.getEngagementStats();
          return stats.tier || 'NEW';
        }
      } catch(e) {}
      return 'NEW';
    }

    /**
     * Get estimated RPM for engagement tier
     */
    getEstimatedRPM(tier) {
      return CONFIG.BASE_RPM[tier] || CONFIG.BASE_RPM.NEW;
    }

    /**
     * Get impressions filtered by criteria
     */
    getImpressions(filters = {}) {
      let filtered = [...this.impressions];
      
      // Time range filter
      if (filters.since) {
        filtered = filtered.filter(imp => imp.timestamp >= filters.since);
      }
      
      // Type filter (real vs placeholder)
      if (filters.type) {
        filtered = filtered.filter(imp => imp.type === filters.type);
      }
      
      // Viewability filter
      if (filters.viewable !== undefined) {
        filtered = filtered.filter(imp => imp.viewable === filters.viewable);
      }
      
      // IVT filter (exclude invalid traffic)
      if (filters.excludeIVT) {
        filtered = filtered.filter(imp => !imp.ivtFiltered);
      }
      
      // Page filter
      if (filters.page) {
        filtered = filtered.filter(imp => imp.page === filters.page);
      }
      
      return filtered;
    }

    /**
     * Get comprehensive stats for time period
     */
    getStats(timeRange = 24 * 60 * 60 * 1000) { // Default: 24 hours
      const since = Date.now() - timeRange;
      const all = this.getImpressions({ since });
      
      // Categorize impressions
      const placeholder = all.filter(imp => imp.type === 'placeholder');
      const real = all.filter(imp => imp.type === 'real');
      const ivtFiltered = all.filter(imp => imp.ivtFiltered);
      const valid = all.filter(imp => imp.type === 'real' && !imp.ivtFiltered);
      const viewable = valid.filter(imp => imp.viewable === true);
      const measured = all.filter(imp => imp.viewabilityData.measured);
      
      // Calculate viewability rate (only for measured impressions)
      const viewabilityRate = measured.length > 0
        ? (viewable.length / measured.length) * 100
        : this.estimateViewabilityRate(all);
      
      // Estimate viewable impressions for unmeasured
      const unmeasured = valid.filter(imp => !imp.viewabilityData.measured);
      const estimatedViewable = unmeasured.length * (viewabilityRate / 100);
      const totalViewable = viewable.length + estimatedViewable;
      
      // Calculate estimated revenue (only for real, valid, viewable impressions)
      const estimatedRevenue = valid.reduce((sum, imp) => {
        if (imp.viewable) {
          return sum + (imp.estimatedRevenue || 0);
        } else if (!imp.viewabilityData.measured) {
          // Estimate revenue for unmeasured based on viewability rate
          const estimatedRPM = imp.estimatedRPM || CONFIG.BASE_RPM.ENGAGED;
          return sum + (estimatedRPM / 1000) * (viewabilityRate / 100);
        }
        return sum;
      }, 0);
      
      // Pool calculation (13% of estimated revenue, capped at $10k)
      const poolPercentage = 0.13;
      const poolCap = 10000;
      const estimatedPool = Math.min(estimatedRevenue * poolPercentage, poolCap);
      
      return {
        timeRange: {
          duration: timeRange,
          since: since,
          until: Date.now()
        },
        
        impressions: {
          total: all.length,
          placeholder: placeholder.length,
          real: real.length,
          ivtFiltered: ivtFiltered.length,
          valid: valid.length,
          viewable: viewable.length,
          estimatedViewable: Math.round(totalViewable)
        },
        
        viewability: {
          measured: measured.length,
          rate: Math.round(viewabilityRate),
          viewableCount: viewable.length,
          estimatedViewableCount: Math.round(totalViewable)
        },
        
        revenue: {
          adsenseApproved: this.adsenseStatus.approved,
          publisherId: this.adsenseStatus.publisherId,
          estimatedRevenue: estimatedRevenue,
          estimatedPool: estimatedPool,
          poolPercentage: poolPercentage,
          poolCap: poolCap,
          currentTier: this.getEngagementTier(),
          currentRPM: this.getEstimatedRPM(this.getEngagementTier())
        },
        
        byPage: this.getStatsByPage(all),
        byTier: this.getStatsByTier(all)
      };
    }

    /**
     * Estimate viewability rate based on ad types in sample
     */
    estimateViewabilityRate(impressions) {
      if (impressions.length === 0) return 82; // Default weighted average
      
      const typeCounts = impressions.reduce((acc, imp) => {
        const type = this.getAdType(imp.slot);
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      let totalWeight = 0;
      let weightedSum = 0;
      
      for (const [type, count] of Object.entries(typeCounts)) {
        const rate = CONFIG.VIEWABILITY_RATES[type] || CONFIG.VIEWABILITY_RATES.default;
        weightedSum += rate * count;
        totalWeight += count;
      }
      
      return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 82;
    }

    /**
     * Determine ad type from slot name
     */
    getAdType(slot) {
      if (slot.includes('anchor')) return 'anchor';
      if (slot.includes('banner')) return 'banner';
      if (slot.includes('incontent')) return 'incontent';
      if (slot.includes('rail')) return 'rail';
      if (slot.includes('tall')) return 'tall';
      return 'default';
    }

    /**
     * Get stats breakdown by page
     */
    getStatsByPage(impressions) {
      const pages = {};
      
      for (const imp of impressions) {
        if (!pages[imp.page]) {
          pages[imp.page] = { total: 0, viewable: 0, revenue: 0 };
        }
        pages[imp.page].total++;
        if (imp.viewable) pages[imp.page].viewable++;
        if (imp.estimatedRevenue) pages[imp.page].revenue += imp.estimatedRevenue;
      }
      
      return pages;
    }

    /**
     * Get stats breakdown by engagement tier
     */
    getStatsByTier(impressions) {
      const tiers = {};
      
      for (const imp of impressions) {
        const tier = imp.engagementTier;
        if (!tiers[tier]) {
          tiers[tier] = { total: 0, viewable: 0, revenue: 0, rpm: CONFIG.BASE_RPM[tier] || 0 };
        }
        tiers[tier].total++;
        if (imp.viewable) tiers[tier].viewable++;
        if (imp.estimatedRevenue) tiers[tier].revenue += imp.estimatedRevenue;
      }
      
      return tiers;
    }

    /**
     * Export all impression data
     */
    exportData() {
      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        adsenseStatus: this.adsenseStatus,
        impressions: this.impressions,
        stats24h: this.getStats(24 * 60 * 60 * 1000),
        stats7d: this.getStats(7 * 24 * 60 * 60 * 1000),
        stats30d: this.getStats(30 * 24 * 60 * 60 * 1000)
      };
    }

    /**
     * Clear old impressions (keep last 90 days)
     */
    cleanup(daysToKeep = 90) {
      const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      const before = this.impressions.length;
      this.impressions = this.impressions.filter(imp => imp.timestamp >= cutoff);
      this.saveImpressions();
      const removed = before - this.impressions.length;
      console.log(`[ADMENSION] Cleaned up ${removed} old impressions`);
      return removed;
    }
  }

  // Initialize and expose globally
  const validator = new AdImpressionValidator();
  window.ADMENSION_AD_VALIDATOR = validator;

  // Expose helper methods
  window.ADMENSION_AD_VALIDATOR.logAd = (slot, page, sessionId, device, utm, referrer) => {
    return validator.logImpression({
      slot, page, sessionId, device, utm, referrer
    });
  };

  window.ADMENSION_AD_VALIDATOR.getStats24h = () => validator.getStats(24 * 60 * 60 * 1000);
  window.ADMENSION_AD_VALIDATOR.getStats7d = () => validator.getStats(7 * 24 * 60 * 60 * 1000);
  window.ADMENSION_AD_VALIDATOR.exportAll = () => validator.exportData();

  console.log('[ADMENSION] Ad Impression Validator ready');
  console.log('Commands: ADMENSION_AD_VALIDATOR.getStats24h(), .getStats7d(), .exportAll()');

})();
