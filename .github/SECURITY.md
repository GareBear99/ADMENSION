# Security Policy

## 🔒 Reporting Security Vulnerabilities

The ADMENSION team takes security seriously. If you discover a security vulnerability, please follow these guidelines:

### ⚠️ Please DO NOT:
- Open a public GitHub issue
- Discuss the vulnerability publicly before it's fixed
- Exploit the vulnerability beyond what's necessary to demonstrate it

### ✅ Please DO:
1. **Email us privately:** security@garebear99.dev
2. **Use GitHub Security Advisory:** [Create a private security advisory](https://github.com/GareBear99/ADMENSION/security/advisories/new)
3. **Include detailed information:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)
   - Your contact information for follow-up

## 🕐 Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Depends on severity (see below)

## 🎯 Severity Levels

### Critical (Fix within 24-48 hours)
- Remote code execution
- Authentication bypass
- Exposure of sensitive user data
- Financial fraud vectors

### High (Fix within 7 days)
- XSS vulnerabilities
- CSRF vulnerabilities
- Unauthorized access to admin functions
- Payout calculation manipulation

### Medium (Fix within 30 days)
- Information disclosure
- Denial of service
- Rate limiting bypass

### Low (Fix in next release)
- Minor information leaks
- Non-critical UI issues
- Best practice improvements

## 🛡️ Security Best Practices

### For Users:
- Use strong, unique wallet addresses
- Don't share your admin PIN
- Be cautious of phishing attempts
- Keep your browser updated
- Report suspicious activity

### For Developers:
- Never commit API keys, secrets, or credentials
- Use environment variables for sensitive data
- Follow secure coding practices
- Validate all user inputs
- Sanitize outputs to prevent XSS
- Test AdSense policy compliance

## 🔐 Current Security Measures

ADMENSION implements several security measures:

1. **No Server-Side Data Storage:** All user data stored locally in browser
2. **Rate Limiting:** Prevents spam and abuse
3. **IVT Filtering:** Invalid traffic detection
4. **Input Validation:** All user inputs sanitized
5. **XSS Prevention:** Proper output encoding
6. **HTTPS Only:** All connections encrypted
7. **No PII Collection:** Privacy-first design
8. **Admin PIN Protection:** Access control for sensitive functions

## 📋 Known Security Considerations

### Local Storage
- User data (links, wallets) stored in browser localStorage
- Users should backup data (export JSON feature)
- Clearing browser data will delete all links

### Google Apps Script Backend
- Collector endpoint is public (required for tracking)
- Rate limiting prevents abuse
- No sensitive data transmitted
- IVT validation on server side

### AdSense Integration
- Third-party ads may load external content
- Google's security policies apply
- Ad content reviewed by Google

### Payout System
- Automated via GitHub Actions
- Requires repository secrets
- Wallet cap prevents concentration
- Transparent overflow redistribution

## 🔄 Updates

This security policy was last updated: January 2026

We will notify users of any security-related updates via:
- GitHub Security Advisories
- Release notes
- README updates (for critical issues)

## 📞 Contact

- **Security Email:** security@garebear99.dev
- **GitHub Security Advisory:** [Submit Private Advisory](https://github.com/GareBear99/ADMENSION/security/advisories/new)
- **General Issues:** [GitHub Issues](https://github.com/GareBear99/ADMENSION/issues) (non-security only)

## 🏆 Recognition

We appreciate security researchers who help make ADMENSION safer:
- Responsible disclosure will be credited (with permission)
- Significant findings will be acknowledged in release notes
- Hall of fame for contributors (coming soon)

## ⚖️ Legal

By participating in our security disclosure program, you agree to:
- Act in good faith to avoid privacy violations, service disruption, and data destruction
- Only test on your own accounts or with explicit permission
- Not exploit vulnerabilities beyond demonstrating the issue
- Give us reasonable time to fix issues before public disclosure

Thank you for helping keep ADMENSION secure! 🔒
