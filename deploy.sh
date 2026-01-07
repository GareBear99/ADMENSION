#!/bin/bash

# ADMENSION - Automated GitHub Pages Deployment Script
# This script handles authentication and deployment without manual intervention

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   ADMENSION Deployment Automation${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Read GitHub token from passcodes folder
TOKEN_FILE="/Users/TheRustySpoon/Desktop/Projects/Main projects/passcodes/github_token.txt"

if [ ! -f "$TOKEN_FILE" ]; then
    echo -e "${RED}❌ Error: Token file not found at $TOKEN_FILE${NC}"
    exit 1
fi

GITHUB_TOKEN=$(grep "^github_pat_" "$TOKEN_FILE")

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Error: GitHub token is empty${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub token loaded${NC}\n"

# Configure git credentials using token
REPO_URL="https://${GITHUB_TOKEN}@github.com/GareBear99/ADMENSION.git"

echo -e "${BLUE}📝 Configuring git remote with authentication...${NC}"
git remote set-url origin "$REPO_URL"

echo -e "${GREEN}✅ Git remote configured${NC}\n"

# Push to GitHub
echo -e "${BLUE}🚀 Pushing code to GitHub...${NC}"
git push -u origin main

echo -e "${GREEN}✅ Code pushed successfully!${NC}\n"

# Reset remote URL (remove embedded token for security)
git remote set-url origin "https://github.com/GareBear99/ADMENSION.git"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "1. Enable GitHub Pages:"
echo -e "   ${BLUE}https://github.com/GareBear99/ADMENSION/settings/pages${NC}"
echo -e "   - Source: Deploy from a branch"
echo -e "   - Branch: main"
echo -e "   - Folder: / (root)"
echo -e "   - Click Save\n"

echo -e "2. Site will be live in 1-2 minutes at:"
echo -e "   ${GREEN}https://garebear99.github.io/ADMENSION/${NC}\n"

echo -e "3. Submit to Google Search Console:"
echo -e "   ${BLUE}https://search.google.com/search-console${NC}"
echo -e "   - Sitemap: ${GREEN}https://garebear99.github.io/ADMENSION/sitemap.xml${NC}\n"

echo -e "${GREEN}🎉 All systems ready for launch!${NC}"
