# Contributing to ADMENSION

Thank you for your interest in contributing to ADMENSION! This document provides guidelines and instructions for contributing to the project.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🚀 Getting Started

### Prerequisites

- Git
- Node.js 14+ (for running scripts)
- A GitHub account
- Basic understanding of HTML/CSS/JavaScript
- Familiarity with Google Apps Script (for backend contributions)

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ADMENSION.git
   cd ADMENSION
   ```

3. **Install dependencies** (optional, for payout scripts)
   ```bash
   npm install
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Test locally**
   - Open `index.html` in your browser
   - Test the 3-step interstitial flow
   - Verify ad placements (if you have AdSense configured)

## 📝 How to Contribute

### Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser/OS information
- Console errors (if any)

### Suggesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:

- Clear description of the feature
- Use case and benefits
- Potential implementation approach
- Alternative solutions considered

### Submitting Pull Requests

1. **Ensure your code follows project standards**
   - Clean, readable code
   - Comments for complex logic
   - Consistent indentation (2 spaces)
   - No console.log statements in production code

2. **Test thoroughly**
   - Test on multiple browsers (Chrome, Firefox, Safari)
   - Test mobile responsiveness
   - Verify ad placements don't violate AdSense policies
   - Test the payout calculation logic (if modified)

3. **Write clear commit messages**
   ```bash
   git commit -m "Add feature: description of change
   
   - Detailed point 1
   - Detailed point 2
   
   Co-Authored-By: Warp <agent@warp.dev>"
   ```

4. **Include co-author attribution**
   All commits must include:
   ```
   Co-Authored-By: Warp <agent@warp.dev>
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create pull request**
   - Use the PR template
   - Link related issues
   - Provide clear description of changes
   - Add screenshots/videos if UI changes

## 🎯 Contribution Areas

### Frontend
- UI/UX improvements
- Mobile responsiveness
- Accessibility enhancements
- Animation/transition polish
- Browser compatibility fixes

### Backend
- Google Apps Script optimization
- Data validation improvements
- API endpoint enhancements
- Error handling

### Documentation
- README improvements
- Code comments
- Setup guide clarifications
- FAQ additions
- Tutorial creation

### Testing
- Manual testing procedures
- Browser compatibility testing
- Performance testing
- Security testing

### Anti-Abuse
- IVT detection improvements
- Viewability validation
- Rate limiting enhancements
- Bot detection

## 🚫 What NOT to Do

- ❌ Don't commit API keys or secrets
- ❌ Don't violate Google AdSense policies
- ❌ Don't implement auto-refresh or forced ad clicks
- ❌ Don't add tracking that collects PII
- ❌ Don't modify payout logic without discussion
- ❌ Don't remove co-author attribution
- ❌ Don't submit PRs directly to main without testing

## 📋 Pull Request Checklist

Before submitting, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass (if applicable)
- [ ] Documentation updated (if needed)
- [ ] Commit messages are clear and include co-author
- [ ] PR description explains what/why
- [ ] No merge conflicts with main
- [ ] AdSense policy compliance verified
- [ ] Mobile tested (if UI changes)
- [ ] Console errors checked

## 🔍 Code Review Process

1. Maintainer reviews PR within 3-5 days
2. Feedback provided via PR comments
3. Changes requested if needed
4. Approval given when ready
5. Merge to main branch
6. Deploy to GitHub Pages (automatic)

## 🏷️ Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

Examples:
- `feature/add-wallet-validation`
- `fix/timer-sync-issue`
- `docs/update-setup-guide`

## 📊 Commit Message Format

```
<type>: <short summary>

<detailed description>

<footer with co-author>
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructure
- `test:` - Adding tests
- `chore:` - Maintenance

## 🛡️ Security

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@garebear99.dev (or use GitHub Security Advisory)
3. Include detailed description
4. Wait for response before disclosure

See [SECURITY.md](SECURITY.md) for more details.

## 💰 Financial Contributions

ADMENSION is open source and free. If you'd like to support development:

- Share the project
- Report bugs
- Submit PRs
- Star the repo ⭐

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

All contributors will be:
- Listed in GitHub contributors
- Mentioned in release notes (for significant contributions)
- Credited in documentation (for major features)

## 📬 Questions?

- Open a [Discussion](https://github.com/GareBear99/ADMENSION/discussions)
- Check existing [Issues](https://github.com/GareBear99/ADMENSION/issues)
- Read the [Documentation](docs.html)

## 🎉 First Time Contributing?

Welcome! Here are some good first issues:
- Documentation improvements
- UI polish
- Browser compatibility testing
- Adding code comments

Look for issues tagged with `good-first-issue` or `help-wanted`.

---

**Thank you for contributing to ADMENSION!** 🚀

Together, we're building the fairest, most transparent link monetization platform.
