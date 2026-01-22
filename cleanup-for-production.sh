#!/bin/bash
# ADMENSION Production Cleanup Script
# Removes development artifacts and consolidates documentation

echo "🧹 ADMENSION Production Cleanup"
echo "================================"
echo ""

# Safety check
if [ ! -f "README.md" ]; then
    echo "❌ Error: Run this from ADMENSION root directory"
    exit 1
fi

echo "📦 Current directory size:"
du -sh .
echo ""

# 1. Remove screenshot utilities (not needed in production)
echo "🗑️  Removing screenshot utilities..."
rm -f screenshot-cli.py screenshot.sh trigger-screenshot.sh screenshot-all-pages.js
rm -f capture-cli.js debug-page.js
rm -f SCREENSHOT_CLI.md

# 2. Remove old screenshot files (keep in git history)
echo "🗑️  Removing old screenshot files..."
rm -f ADMENSION_home_*.png debug-fullpage.png
rm -rf screenshots/

# 3. Clean up duplicate/redundant documentation
echo "📚 Consolidating documentation..."

# Move all critical docs to docs/ folder if not already there
mkdir -p docs/archive

# Archive old deployment guides (superseded by CLOUDFLARE_API_DEPLOYED.md)
mv -f docs/DEPLOY.md docs/archive/ 2>/dev/null || true
mv -f docs/DEPLOYMENT_COMPLETE.md docs/archive/ 2>/dev/null || true
mv -f docs/DEPLOY_WITH_GITHUB_DESKTOP.md docs/archive/ 2>/dev/null || true
mv -f docs/GITHUB_TOKEN_FIX.md docs/archive/ 2>/dev/null || true
mv -f docs/FINAL_DEPLOYMENT_GUIDE.md docs/archive/ 2>/dev/null || true

# Archive old analysis docs (superseded by ANTI_FRAUD_AND_EARNING_MECHANICS.md)
mv -f docs/CRITICAL_ISSUES_AND_RECOMMENDATIONS.md docs/archive/ 2>/dev/null || true
mv -f docs/FINALIZE_MONETIZATION_AND_PAYOUTS.md docs/archive/ 2>/dev/null || true
mv -f docs/REVENUE_ANALYSIS_STRATEGIC_PLAN.md docs/archive/ 2>/dev/null || true
mv -f docs/SYSTEM_AUDIT_AND_FINAL_PLAN.md docs/archive/ 2>/dev/null || true

# Archive old status docs
mv -f docs/IMPLEMENTATION_STATUS.md docs/archive/ 2>/dev/null || true
mv -f docs/PROJECT_STATUS.md docs/archive/ 2>/dev/null || true
mv -f docs/PROJECT_REVIEW_EXECUTION_PLAN.md docs/archive/ 2>/dev/null || true
mv -f docs/EXECUTION_SUMMARY.md docs/archive/ 2>/dev/null || true
mv -f docs/FINAL_COMPLETION_SUMMARY.md docs/archive/ 2>/dev/null || true
mv -f docs/ARCHIVE_SUMMARY_v1_3.md docs/archive/ 2>/dev/null || true
mv -f docs/UPGRADE_SUMMARY.md docs/archive/ 2>/dev/null || true

# Remove duplicate README files
rm -f docs/QUICK_START.md  # We have QUICK_START.md in root

# 4. Update .gitignore with production exclusions
echo "📝 Updating .gitignore..."
cat >> .gitignore << 'EOF'

# Development files
*.pyc
__pycache__/
*.log
.env.local

# Screenshots and test artifacts
*.png
screenshots/
debug-*.js
capture-*.js
screenshot*.js
screenshot*.py
screenshot*.sh

# Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db
EOF

# 5. Verify critical files exist
echo ""
echo "✅ Verifying critical production files..."

CRITICAL_FILES=(
    "index.html"
    "interstitial.html"
    "create.html"
    "manage.html"
    "stats.html"
    "docs.html"
    "admin.html"
    "privacy-policy.html"
    "src/api-client.js"
    "src/anti-abuse-system.js"
    "src/engagement-system.js"
    "src/daily-quotes.js"
    "worker.js"
    "wrangler.toml"
    "README.md"
    "ANTI_FRAUD_AND_EARNING_MECHANICS.md"
    "CLOUDFLARE_API_DEPLOYED.md"
)

MISSING_FILES=()
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
        echo "   ⚠️  Missing: $file"
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo "   ✅ All critical files present"
else
    echo "   ⚠️  ${#MISSING_FILES[@]} critical files missing"
fi

# 6. Clean node_modules (can be reinstalled)
echo ""
read -p "🗑️  Remove node_modules/ to save space? (can reinstall with npm install) [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Removing node_modules/..."
    rm -rf node_modules/
    echo "   ✅ Removed (reinstall with: npm install)"
fi

# 7. Summary
echo ""
echo "📊 Cleanup Summary"
echo "=================="
echo ""
echo "New directory size:"
du -sh .
echo ""
echo "✅ Production cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Review changes: git status"
echo "   2. Commit cleaned state: git add . && git commit -m 'Production cleanup'"
echo "   3. Push to GitHub: git push"
echo ""
echo "🚀 Your ADMENSION deployment is now production-ready!"
