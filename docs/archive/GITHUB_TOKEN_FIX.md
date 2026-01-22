# 🔧 GitHub Token Permission Fix

## Problem
Your current GitHub token lacks **write permissions** needed to push code.

## Solution: Create New Token (2 minutes)

### Step 1: Generate New Token
1. Go to https://github.com/settings/tokens/new
2. **Note**: `ADMENSION Deployment`
3. **Expiration**: 90 days (or No expiration)
4. **Select scopes**:
   - ✅ `repo` (Full control of private repositories)
     - This auto-selects: repo:status, repo_deployment, public_repo, repo:invite, security_events
   - ✅ `workflow` (Update GitHub Action workflows) ← **IMPORTANT**
5. Click **Generate token**
6. **Copy token immediately** (looks like `github_pat_11AQ6Q...`)

### Step 2: Replace Token File
1. Open: `/Users/TheRustySpoon/Desktop/Projects/Main projects/passcodes/github_token.txt`
2. Replace entire contents with JUST the new token:
   ```
   github_pat_11AQ6QBFI0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   (No comments, no extra lines - just the token)

### Step 3: Run Deployment
```bash
cd "/Users/TheRustySpoon/Desktop/Projects/Main projects/Trading_bots/ADMENSION"
./deploy.sh
```

---

## Alternative: Use GitHub Desktop (Zero Config)

If token creation is annoying:

1. Download **GitHub Desktop**: https://desktop.github.com
2. Sign in with your GitHub account (gdoman99@gmail.com)
3. File → Add Local Repository → Select ADMENSION folder
4. Click **Publish repository**
   - Name: ADMENSION
   - Description: Ad monetization platform
   - ✅ Keep code private (or uncheck for public)
5. Click **Publish**

Done! GitHub Desktop handles authentication automatically.

---

## Then Enable GitHub Pages

After code is pushed (either method):

1. Go to https://github.com/GareBear99/ADMENSION/settings/pages
2. **Source**: Deploy from a branch
3. **Branch**: main
4. **Folder**: / (root)
5. Click **Save**
6. Site live in 1-2 minutes at: https://garebear99.github.io/ADMENSION/

---

## Why This Happened

Your current token was created with **read-only** scope. GitHub changed their permission model in 2022:
- Old tokens: `repo` scope = read + write
- New tokens: Need explicit `workflow` scope for write access

The fix takes 2 minutes and will work forever.
