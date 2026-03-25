/**
 * ADMENSION Anti-Abuse & Fraud Prevention System
 * Version: 1.1
 * Purpose: Prevent ad fraud, detect suspicious patterns, enforce policy-safe limits
 * 
 * Google Ad Manager Policy Compliance:
 * - No incentivized clicks/impressions
 * - No artificial traffic generation
 * - No automatic refreshing without user interaction
 * - Viewability standards: 50%+ visible for 1+ second
 * - Invalid Traffic (IVT) detection and filtering
 */

(function() {
  'use strict';

  // ===== Configuration =====
  const CONFIG = {
    // Refresh limits (policy-safe)
    MAX_REFRESHES_PER_SESSION: 10,
    MAX_REFRESHES_PER_HOUR: 15,
    MIN_TIME_BETWEEN_REFRESHES: 30000, // 30 seconds
    
    // Page stagnation detection (logging only - NO automatic refresh)
    // NOTE: Automatic page refresh is DISABLED to comply with Google AdSense
    // policies which prohibit automatic ad refreshing without user interaction.
    // The stagnation detector now only logs inactivity for analytics purposes.
    STAGNATION_MIN_MS: 5 * 60 * 1000, // 5 minutes
    STAGNATION_MAX_MS: 7 * 60 * 1000, // 7 minutes
    STAGNATION_ENABLED: true,
    
    // Abuse detection thresholds
    RAPID_REFRESH_THRESHOLD: 3, // 3 refreshes in 60 seconds = suspicious
    RAPID_REFRESH_WINDOW: 60000, // 60 seconds
    SESSION_VIEW_LIMIT: 50, // Max pageviews per session before flagging
    
    // Invalid Traffic (IVT) scoring
    IVT_SCORE_THRESHOLD: 70, // 70+ = likely bot/fraud
    
    // Viewability requirements (Google Ad Manager standard)
    MIN_VIEWABILITY_PERCENTAGE: 50, // 50% of ad visible
    MIN_VIEWABILITY_DURATION: 1000, // 1 second
    
    // Storage keys
    STORAGE_KEY: 'admension_abuse_tracker',
    REFRESH_LOG_KEY: 'admension_refresh_log',
    IVT_SCORE_KEY: 'admension_ivt_score',
    SESSION_START_KEY: 'admension_session_start'
  };

  // ===== Abuse Tracker Class =====
  class AbuseTracker {
    constructor() {
      this.data = this.loadData();
      this.sessionStart = this.getSessionStart();
      this.lastActivity = Date.now();
      this.refreshLog = this.loadRefreshLog();
      this.ivtScore = this.loadIVTScore();
      this.stagnationTimer = null;
      this.activityListeners = [];
      
      this.init();
    }

    init() {
      console.log('[Anti-Abuse] System initialized');
      
      // Track session start
      if (!this.sessionStart) {
        this.sessionStart = Date.now();
        sessionStorage.setItem(CONFIG.SESSION_START_KEY, this.sessionStart);
      }
      
      // Initialize activity listeners
      this.setupActivityListeners();
      
      // Start stagnation detector (logging only, no auto-refresh)
      if (CONFIG.STAGNATION_ENABLED) {
        this.startStagnationDetector();
      }
      
      // Calculate IVT score
      this.calculateIVTScore();
      
      // Clean old refresh logs (older than 24 hours)
      this.cleanOldRefreshLogs();
    }

    loadData() {
      try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (!stored) {
          return this.getDefaultData();
        }
        return JSON.parse(stored);
      } catch(e) {
        console.warn('[Anti-Abuse] Data load failed, using defaults:', e);
        return this.getDefaultData();
      }
    }

    getDefaultData() {
      return {
        totalRefreshes: 0,
        rapidRefreshCount: 0,
        suspiciousPatterns: [],
        sessionViews: 0,
        lastRefresh: 0,
        flags: [],
        createdAt: Date.now()
      };
    }

    saveData() {
      try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.data));
      } catch(e) {
        console.error('[Anti-Abuse] Failed to save data:', e);
      }
    }

    getSessionStart() {
      const stored = sessionStorage.getItem(CONFIG.SESSION_START_KEY);
      return stored ? parseInt(stored, 10) : Date.now();
    }

    loadRefreshLog() {
      try {
        const stored = localStorage.getItem(CONFIG.REFRESH_LOG_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch(e) {
        return [];
      }
    }

    saveRefreshLog() {
      try {
        localStorage.setItem(CONFIG.REFRESH_LOG_KEY, JSON.stringify(this.refreshLog));
      } catch(e) {
        console.error('[Anti-Abuse] Failed to save refresh log:', e);
      }
    }

    loadIVTScore() {
      try {
        const stored = localStorage.getItem(CONFIG.IVT_SCORE_KEY);
        return stored ? JSON.parse(stored) : { score: 0, factors: [], lastCalculated: 0 };
      } catch(e) {
        return { score: 0, factors: [], lastCalculated: 0 };
      }
    }

    saveIVTScore() {
      try {
        localStorage.setItem(CONFIG.IVT_SCORE_KEY, JSON.stringify(this.ivtScore));
      } catch(e) {
        console.error('[Anti-Abuse] Failed to save IVT score:', e);
      }
    }

    cleanOldRefreshLogs() {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      this.refreshLog = this.refreshLog.filter(log => log.timestamp > cutoff);
      this.saveRefreshLog();
    }

    // ===== Activity Detection =====
    setupActivityListeners() {
      const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
      
      activityEvents.forEach(event => {
        const listener = () => this.onUserActivity();
        document.addEventListener(event, listener, { passive: true });
        this.activityListeners.push({ event, listener });
      });
    }

    onUserActivity() {
      this.lastActivity = Date.now();
      
      // Reset stagnation timer on any activity
      if (this.stagnationTimer) {
        clearTimeout(this.stagnationTimer);
        this.startStagnationDetector();
      }
    }

    getTimeSinceActivity() {
      return Date.now() - this.lastActivity;
    }

    // ===== Stagnation Detector (Logging Only - NO Auto-Refresh) =====
    // NOTE: Google AdSense policy prohibits automatic page/ad refreshing.
    // This detector logs stagnation events for analytics but does NOT
    // trigger page reloads. See: https://support.google.com/adsense/answer/48182
    startStagnationDetector() {
      if (this.stagnationTimer) {
        clearTimeout(this.stagnationTimer);
      }

      // Random interval between 5-7 minutes
      const randomInterval = Math.floor(
        Math.random() * (CONFIG.STAGNATION_MAX_MS - CONFIG.STAGNATION_MIN_MS) + CONFIG.STAGNATION_MIN_MS
      );

      this.stagnationTimer = setTimeout(() => {
        this.handleStagnation(randomInterval);
      }, randomInterval);
    }

    handleStagnation(interval) {
      const timeSinceActivity = this.getTimeSinceActivity();
      
      // If user has been active recently, reset the timer
      if (timeSinceActivity < 30000) {
        this.startStagnationDetector(); // Restart timer
        return;
      }

      // Log stagnation event for analytics (NO page reload)
      console.log(`[Anti-Abuse] Page stagnant for ${(timeSinceActivity / 60000).toFixed(1)} min (logged, no refresh)`);
      
      this.logRefresh('stagnation_detected', {
        timeSinceActivity,
        interval,
        reason: 'Page inactive - logged for analytics (no auto-refresh per AdSense policy)'
      });

      // Restart detector for next interval
      this.startStagnationDetector();
    }

    // ===== Refresh Tracking & Limits =====
    canRefresh(reason = 'manual') {
      const now = Date.now();
      const sessionRefreshes = this.getSessionRefreshCount();
      const hourlyRefreshes = this.getHourlyRefreshCount();
      const timeSinceLastRefresh = now - this.data.lastRefresh;

      // Check session limit
      if (sessionRefreshes >= CONFIG.MAX_REFRESHES_PER_SESSION) {
        this.addFlag('session_refresh_limit_exceeded');
        console.warn('[Anti-Abuse] Session refresh limit exceeded:', sessionRefreshes);
        return false;
      }

      // Check hourly limit
      if (hourlyRefreshes >= CONFIG.MAX_REFRESHES_PER_HOUR) {
        this.addFlag('hourly_refresh_limit_exceeded');
        console.warn('[Anti-Abuse] Hourly refresh limit exceeded:', hourlyRefreshes);
        return false;
      }

      // Check minimum time between refreshes
      if (timeSinceLastRefresh < CONFIG.MIN_TIME_BETWEEN_REFRESHES) {
        this.addFlag('rapid_refresh_attempt');
        console.warn('[Anti-Abuse] Rapid refresh blocked:', timeSinceLastRefresh, 'ms');
        return false;
      }

      return true;
    }

    logRefresh(type, metadata = {}) {
      const now = Date.now();
      
      const refreshEntry = {
        timestamp: now,
        type, // 'manual', 'stagnation_detected', 'navigation', 'ad_refresh'
        metadata,
        sessionId: sessionStorage.getItem('cfamm_s') || 'unknown',
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      this.refreshLog.push(refreshEntry);
      this.data.totalRefreshes++;
      this.data.lastRefresh = now;

      // Check for rapid refresh pattern
      this.detectRapidRefreshPattern();

      this.saveRefreshLog();
      this.saveData();
    }

    getSessionRefreshCount() {
      return this.refreshLog.filter(log => log.timestamp > this.sessionStart).length;
    }

    getHourlyRefreshCount() {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      return this.refreshLog.filter(log => log.timestamp > oneHourAgo).length;
    }

    detectRapidRefreshPattern() {
      const cutoff = Date.now() - CONFIG.RAPID_REFRESH_WINDOW;
      const recentRefreshes = this.refreshLog.filter(log => log.timestamp > cutoff);

      if (recentRefreshes.length >= CONFIG.RAPID_REFRESH_THRESHOLD) {
        this.data.rapidRefreshCount++;
        this.addFlag('rapid_refresh_pattern_detected');
        console.warn('[Anti-Abuse] Rapid refresh pattern detected:', recentRefreshes.length, 'refreshes in', CONFIG.RAPID_REFRESH_WINDOW / 1000, 'seconds');
      }
    }

    // ===== Session View Tracking =====
    trackPageView(pageName) {
      this.data.sessionViews++;

      if (this.data.sessionViews > CONFIG.SESSION_VIEW_LIMIT) {
        this.addFlag('excessive_session_views');
        console.warn('[Anti-Abuse] Excessive pageviews:', this.data.sessionViews);
      }

      this.saveData();
    }

    // ===== Invalid Traffic (IVT) Scoring =====
    calculateIVTScore() {
      const factors = [];
      let score = 0;

      // Factor 1: Rapid refresh behavior (0-25 points)
      if (this.data.rapidRefreshCount > 0) {
        const rapidScore = Math.min(25, this.data.rapidRefreshCount * 5);
        score += rapidScore;
        factors.push({ name: 'rapid_refresh', score: rapidScore, weight: 0.25 });
      }

      // Factor 2: Excessive session views (0-20 points)
      if (this.data.sessionViews > CONFIG.SESSION_VIEW_LIMIT) {
        const excessViews = this.data.sessionViews - CONFIG.SESSION_VIEW_LIMIT;
        const viewScore = Math.min(20, excessViews);
        score += viewScore;
        factors.push({ name: 'excessive_views', score: viewScore, weight: 0.20 });
      }

      // Factor 3: Bot signatures (0-30 points)
      const botScore = this.detectBotSignatures();
      score += botScore;
      if (botScore > 0) {
        factors.push({ name: 'bot_signatures', score: botScore, weight: 0.30 });
      }

      // Factor 4: Suspicious patterns (0-15 points)
      const patternScore = Math.min(15, this.data.suspiciousPatterns.length * 3);
      score += patternScore;
      if (patternScore > 0) {
        factors.push({ name: 'suspicious_patterns', score: patternScore, weight: 0.15 });
      }

      // Factor 5: Time-based anomalies (0-10 points)
      const timeScore = this.detectTimeAnomalies();
      score += timeScore;
      if (timeScore > 0) {
        factors.push({ name: 'time_anomalies', score: timeScore, weight: 0.10 });
      }

      this.ivtScore = {
        score: Math.min(100, score),
        factors,
        lastCalculated: Date.now(),
        risk: score < 30 ? 'low' : score < 70 ? 'medium' : 'high'
      };

      this.saveIVTScore();

      if (score >= CONFIG.IVT_SCORE_THRESHOLD) {
        this.addFlag('high_ivt_score');
        console.warn('[Anti-Abuse] High IVT score detected:', score);
      }

      return this.ivtScore;
    }

    detectBotSignatures() {
      let score = 0;
      const ua = navigator.userAgent.toLowerCase();

      // Check for headless browsers
      if (navigator.webdriver) {
        score += 15;
        this.addSuspiciousPattern('webdriver_detected');
      }

      // Check for common bot user agents
      const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'phantomjs', 'headless'];
      for (const pattern of botPatterns) {
        if (ua.includes(pattern)) {
          score += 10;
          this.addSuspiciousPattern('bot_user_agent');
          break;
        }
      }

      // Check for missing browser features
      if (!window.chrome && !window.safari && !navigator.userAgent.includes('Firefox')) {
        score += 5;
        this.addSuspiciousPattern('unusual_browser');
      }

      return score;
    }

    detectTimeAnomalies() {
      let score = 0;

      // Check for impossibly fast session (< 5 seconds with 10+ views)
      const sessionDuration = Date.now() - this.sessionStart;
      if (sessionDuration < 5000 && this.data.sessionViews > 10) {
        score += 10;
        this.addSuspiciousPattern('impossibly_fast_session');
      }

      // Check for consistent timing patterns (bot-like)
      if (this.refreshLog.length > 5) {
        const intervals = [];
        for (let i = 1; i < this.refreshLog.length; i++) {
          intervals.push(this.refreshLog[i].timestamp - this.refreshLog[i - 1].timestamp);
        }

        // Calculate variance
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / intervals.length;

        // Low variance = consistent timing = bot-like
        if (variance < 1000 && intervals.length > 5) {
          score += 5;
          this.addSuspiciousPattern('consistent_timing_pattern');
        }
      }

      return score;
    }

    addSuspiciousPattern(pattern) {
      if (!this.data.suspiciousPatterns.includes(pattern)) {
        this.data.suspiciousPatterns.push(pattern);
        this.saveData();
      }
    }

    addFlag(flag) {
      const flagEntry = {
        type: flag,
        timestamp: Date.now(),
        sessionId: sessionStorage.getItem('cfamm_s') || 'unknown'
      };

      this.data.flags.push(flagEntry);
      this.saveData();
    }

    // ===== Ad Impression Tracking =====
    trackAdImpression(adUnit, viewability) {
      // Only count if meets viewability standards
      if (viewability.percentage < CONFIG.MIN_VIEWABILITY_PERCENTAGE) {
        console.log('[Anti-Abuse] Ad impression not counted: below viewability threshold', viewability.percentage + '%');
        return false;
      }

      if (viewability.duration < CONFIG.MIN_VIEWABILITY_DURATION) {
        console.log('[Anti-Abuse] Ad impression not counted: insufficient duration', viewability.duration + 'ms');
        return false;
      }

      // Track valid impression
      console.log('[Anti-Abuse] Valid ad impression tracked:', adUnit, viewability);
      return true;
    }

    // ===== Public API =====
    getStats() {
      return {
        sessionRefreshes: this.getSessionRefreshCount(),
        hourlyRefreshes: this.getHourlyRefreshCount(),
        totalRefreshes: this.data.totalRefreshes,
        sessionViews: this.data.sessionViews,
        rapidRefreshCount: this.data.rapidRefreshCount,
        flags: this.data.flags,
        suspiciousPatterns: this.data.suspiciousPatterns,
        ivtScore: this.ivtScore,
        timeSinceActivity: this.getTimeSinceActivity(),
        sessionDuration: Date.now() - this.sessionStart
      };
    }

    getRefreshLog() {
      return this.refreshLog;
    }

    isHealthy() {
      return this.ivtScore.score < CONFIG.IVT_SCORE_THRESHOLD &&
             this.data.flags.length < 5 &&
             this.getSessionRefreshCount() < CONFIG.MAX_REFRESHES_PER_SESSION;
    }

    reset() {
      console.log('[Anti-Abuse] Resetting abuse tracker');
      this.data = this.getDefaultData();
      this.refreshLog = [];
      this.ivtScore = { score: 0, factors: [], lastCalculated: 0 };
      this.saveData();
      this.saveRefreshLog();
      this.saveIVTScore();
    }

    destroy() {
      console.log('[Anti-Abuse] Shutting down');
      
      // Clear stagnation timer
      if (this.stagnationTimer) {
        clearTimeout(this.stagnationTimer);
      }

      // Remove activity listeners
      this.activityListeners.forEach(({ event, listener }) => {
        document.removeEventListener(event, listener);
      });
    }
  }

  // ===== Initialize Global Instance =====
  if (!window.ADMENSION_ANTI_ABUSE) {
    window.ADMENSION_ANTI_ABUSE = new AbuseTracker();
    console.log('[Anti-Abuse] System ready. IVT Score:', window.ADMENSION_ANTI_ABUSE.ivtScore.score);
  }

  // ===== Auto-tracking: Log page refreshes =====
  window.addEventListener('beforeunload', () => {
    if (window.ADMENSION_ANTI_ABUSE) {
      window.ADMENSION_ANTI_ABUSE.logRefresh('navigation', {
        page: window.location.hash || '#home',
        reason: 'User navigation or page close'
      });
    }
  });

  // ===== Expose to console for debugging =====
  window.getAbuseStats = () => {
    if (!window.ADMENSION_ANTI_ABUSE) return null;
    const stats = window.ADMENSION_ANTI_ABUSE.getStats();
    console.table({
      'Session Refreshes': stats.sessionRefreshes + ' / ' + CONFIG.MAX_REFRESHES_PER_SESSION,
      'Hourly Refreshes': stats.hourlyRefreshes + ' / ' + CONFIG.MAX_REFRESHES_PER_HOUR,
      'Session Views': stats.sessionViews,
      'IVT Score': stats.ivtScore.score + ' (' + stats.ivtScore.risk + ' risk)',
      'Flags': stats.flags.length,
      'Suspicious Patterns': stats.suspiciousPatterns.length,
      'Status': window.ADMENSION_ANTI_ABUSE.isHealthy() ? '✅ Healthy' : '⚠️ Issues Detected'
    });
    return stats;
  };

  // ================================================================
  // SENTINEL — Canonical Safety Entity (wraps AbuseTracker)
  // Canon: Sentinel is first. Every action passes through Sentinel.
  // If Sentinel denies, nothing executes.
  // ================================================================
  const SENTINEL_AUDIT_KEY = 'sentinel.audit_log';
  const SENTINEL_PAUSE_KEY = 'sentinel.emergency_pause';

  class Sentinel {
    constructor(tracker) {
      this.tracker = tracker;
      this.auditLog = this.loadAuditLog();
      this.paused = this.checkPaused();
      if (this.paused) {
        console.warn('[SENTINEL] ⚠️ EMERGENCY PAUSE ACTIVE — ad serving disabled');
      }
    }

    // ---- Gate: every action passes through here ----
    allow(action, context) {
      // Emergency pause overrides everything
      if (this.paused) {
        this.log('DENY', action, 'emergency_pause', context);
        return false;
      }
      // High IVT score → deny ad-related actions
      if (action.startsWith('ad_') && this.tracker.ivtScore.score >= CONFIG.IVT_SCORE_THRESHOLD) {
        this.log('DENY', action, 'high_ivt', context);
        return false;
      }
      // Rate limit: deny if refresh limits exceeded
      if (action === 'ad_refresh' && !this.tracker.canRefresh('sentinel_check')) {
        this.log('DENY', action, 'rate_limit', context);
        return false;
      }
      // Excessive session views
      if (this.tracker.data.sessionViews > CONFIG.SESSION_VIEW_LIMIT * 1.5) {
        this.log('DENY', action, 'excessive_views', context);
        return false;
      }
      this.log('ALLOW', action, 'passed', context);
      return true;
    }

    // ---- Emergency pause (admin-triggered) ----
    pause(reason) {
      this.paused = true;
      localStorage.setItem(SENTINEL_PAUSE_KEY, JSON.stringify({ active: true, reason, since: Date.now() }));
      this.log('PAUSE', 'system', reason || 'admin_triggered');
      console.warn('[SENTINEL] EMERGENCY PAUSE ACTIVATED:', reason);
    }

    resume() {
      this.paused = false;
      localStorage.removeItem(SENTINEL_PAUSE_KEY);
      this.log('RESUME', 'system', 'admin_resumed');
      console.log('[SENTINEL] ✅ System resumed');
    }

    checkPaused() {
      try {
        const p = JSON.parse(localStorage.getItem(SENTINEL_PAUSE_KEY) || 'null');
        return !!(p && p.active);
      } catch(e) { return false; }
    }

    // ---- Audit log ----
    log(decision, action, reason, context) {
      const entry = {
        t: Date.now(),
        d: decision,
        a: action,
        r: reason,
        ctx: context || null,
        ivt: this.tracker.ivtScore.score,
        views: this.tracker.data.sessionViews,
      };
      this.auditLog.push(entry);
      // Keep last 200 entries
      if (this.auditLog.length > 200) this.auditLog = this.auditLog.slice(-200);
      try { localStorage.setItem(SENTINEL_AUDIT_KEY, JSON.stringify(this.auditLog)); } catch(e) {}
    }

    loadAuditLog() {
      try { return JSON.parse(localStorage.getItem(SENTINEL_AUDIT_KEY) || '[]'); } catch(e) { return []; }
    }

    getAuditLog() { return this.auditLog; }

    getStatus() {
      return {
        paused: this.paused,
        healthy: this.tracker.isHealthy(),
        ivtScore: this.tracker.ivtScore.score,
        ivtRisk: this.tracker.ivtScore.risk,
        flags: this.tracker.data.flags.length,
        auditEntries: this.auditLog.length,
      };
    }
  }

  // Initialize SENTINEL
  window.SENTINEL = new Sentinel(window.ADMENSION_ANTI_ABUSE);
  console.log('[SENTINEL] Entity initialized | Status:', window.SENTINEL.getStatus().healthy ? '✅ Healthy' : '⚠️ Issues');

})();
