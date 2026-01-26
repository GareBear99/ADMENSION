# Admin Setup Guide

## Setting Your Admin PIN

For security, you should set a custom admin PIN instead of using the default.

### Option 1: LocalStorage (Recommended for GitHub Pages)

Add this to your browser's console or create a bookmarklet:

```javascript
// Set your custom PIN (choose a secure 6-digit number)
localStorage.setItem('admension_admin_pin', 'YOUR_PIN_HERE');

// Verify it's set
console.log('Admin PIN set:', localStorage.getItem('admension_admin_pin'));
```

### Option 2: Environment Variable (For Self-Hosted)

If you're hosting on your own server with build process:

```bash
# .env file
VITE_ADMIN_PIN=123456
```

Then in your code:
```javascript
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '979899';
```

### Current Default PIN

⚠️ **WARNING:** The current default PIN is `979899`

This is visible in the source code and should be changed for production use.

### How to Change PIN in Code

1. Open `index.html`, `admin.html`, `stats.html`, `manage.html`, `create.html`
2. Find all instances of `"979899"`
3. Replace with your custom PIN
4. Commit and push changes

### Better Approach: Dynamic PIN Check

Replace hardcoded PIN checks with:

```javascript
function checkAdminPIN() {
  const customPIN = localStorage.getItem('admension_admin_pin');
  const defaultPIN = '979899'; // Fallback only
  const pin = prompt('Enter Admin PIN:');
  
  if (pin === null) return false;
  
  // Check custom PIN first, then fallback to default
  const validPIN = customPIN || defaultPIN;
  return String(pin).trim() === validPIN;
}
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
