# Admin Setup Guide

## Secure Admin PIN Initialization

⚠️ **IMPORTANT:** For security, admin PINs are stored as SHA-256 hashes, not plaintext.

### Quick Setup (Recommended)

1. **Open the PIN initialization page:**
   ```
   https://your-username.github.io/ADMENSION/init-admin-pin.html
   ```

2. **Enter your 6-digit PIN** (choose a strong number)
3. **Confirm your PIN**
4. **Click "Initialize Admin PIN"**

Your PIN will be securely hashed using SHA-256 and stored in `localStorage['admension_pin_hash']`.

### Manual Setup (Advanced)

If you prefer to set it via console:

```javascript
// SHA-256 hash function
async function hashPIN(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Set your PIN (replace '123456' with your actual PIN)
const myPIN = '123456';
hashPIN(myPIN).then(hash => {
  localStorage.setItem('admension_pin_hash', hash);
  console.log('✅ Admin PIN hash stored securely');
});
```

### Security Best Practices

1. ✅ Set a custom PIN via localStorage
2. ✅ Never commit your custom PIN to git
3. ✅ Use strong 6-digit number (avoid 000000, 123456, etc.)
4. ✅ Don't share your PIN publicly
5. ✅ Change PIN periodically

### For Production Deployment

If deploying for public use, consider:

1. Remove admin features entirely for public instances
2. Create separate admin subdomain with auth
3. Use proper authentication (OAuth, JWT)
4. Implement server-side admin API

### Quick Fix for Now

Run this in your browser console on the ADMENSION page:

```javascript
// Set your custom PIN
localStorage.setItem('admension_admin_pin', '654321'); // CHANGE THIS

// Update the UI hint
document.querySelectorAll('*').forEach(el => {
  if (el.textContent && el.textContent.includes('979899')) {
    el.textContent = el.textContent.replace('979899', 'YOUR_CUSTOM_PIN');
  }
});

alert('Admin PIN updated! Remember your new PIN.');
```

## Admin Features Protected by PIN

- Sponsor sticky management
- Reset stats & links
- Clear all sponsors
- Settlement management (admin page only)

## Future Enhancements (v2.0)

- Server-side authentication
- Multi-user admin roles
- Audit logs for admin actions
- Two-factor authentication
- Session-based admin login
