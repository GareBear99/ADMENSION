/**
 * ADMENSION Admin Authentication
 * Secure PIN verification using SHA-256 hashing
 */

(function() {
  'use strict';

  // SHA-256 hash function
  async function hashPIN(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(String(pin).trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verify PIN against stored hash
  async function verifyPIN(enteredPIN) {
    const storedHash = localStorage.getItem('admension_pin_hash');
    
    if (!storedHash) {
      return {
        valid: false,
        error: 'NO_PIN_SET',
        message: 'No admin PIN configured. Please visit init-admin-pin.html to set up your PIN.'
      };
    }
    
    const enteredHash = await hashPIN(enteredPIN);
    
    if (enteredHash === storedHash) {
      return {
        valid: true,
        error: null,
        message: 'PIN verified successfully'
      };
    } else {
      return {
        valid: false,
        error: 'INVALID_PIN',
        message: 'Invalid PIN'
      };
    }
  }

  // Prompt user for PIN and verify
  async function promptAndVerifyPIN(promptMessage = 'Enter Admin PIN:') {
    const pin = prompt(promptMessage);
    
    if (pin === null) {
      return {
        valid: false,
        error: 'CANCELLED',
        message: 'PIN entry cancelled'
      };
    }
    
    return await verifyPIN(pin);
  }

  // Check if PIN is configured
  function isPINConfigured() {
    return !!localStorage.getItem('admension_pin_hash');
  }

  // Export global API
  window.ADMENSION_ADMIN_AUTH = {
    verifyPIN,
    promptAndVerifyPIN,
    isPINConfigured,
    hashPIN // For manual PIN setup
  };

})();
