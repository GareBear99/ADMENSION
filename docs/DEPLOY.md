# 🚀 Deploy ADMENSION to GitHub Pages

**Status**: Ready to deploy  
**Account**: gdoman99@gmail.com  
**Estimated time**: 5 minutes  
**Cost**: $0 (free forever)

---

## 📋 Deployment Steps

### Step 1: Initialize Git & Commit Files (2 minutes)

Open Terminal and run:

```bash
cd "/Users/TheRustySpoon/Desktop/Projects/Main projects/Trading_bots/ADMENSION"

# Check if git is already initialized
if [ -d .git ]; then
    echo "Git already initialized"
else
    git init
    echo "Git initialized"
fi

# Add all files
git add .

# Commit
git commit -m "Initial ADMENSION deployment - v1.0 with engagement tracking, anti-abuse, daily quotes"
```

**Expected output:**
```
[main (root-commit) abc1234] Initial ADMENSION deployment...
 XX files changed, XXXX insertions(+)
 create mode 100644 index.html
 create mode 100644 src/consent.js
 ...
```

---

### Step 2: Create GitHub Repository (1 minute)

**Option A: Via Web Browser (Easier)**

1. Go to: https://github.com/new
2. Fill in:
   - **Repository name**: `ADMENSION`
   - **Description**: "Ad monetization platform with revenue sharing (13% pool)"
   - **Visibility**: ✅ **Public** (required for free GitHub Pages)
   - **Initialize with**: ❌ Leave all unchecked (we already have files)
3. Click **"Create repository"**

**Option B: Via GitHub CLI (if installed)**

```bash
# Check if GitHub CLI is installed
gh --version

# If installed, create repo:
gh repo create ADMENSION --public --source=. --remote=origin
```

---

### Step 3: Push Code to GitHub (1 minute)

**After creating the repo on GitHub.com, run:**

```bash
# Link to your repo
git remote add origin https://github.com/gdoman99/ADMENSION.git

# Set main branch
git branch -M main

# Push code
git push -u origin main
```

**If prompted for credentials:**
- Username: `gdoman99`
- Password: Use **Personal Access Token** (not your GitHub password)
  - If you don't have a token: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Select scopes: `repo` (all checkboxes)
  - Click "Generate token"
  - Copy token and paste as password

**Expected output:**
```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX), XXX KiB | XXX MiB/s, done.
Total XX (delta 0), reused 0 (delta 0)
To https://github.com/gdoman99/ADMENSION.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

### Step 4: Enable GitHub Pages (1 minute)

1. Go to your repo: https://github.com/gdoman99/ADMENSION
2. Click **"Settings"** tab (top right)
3. Click **"Pages"** in left sidebar
4. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **"Save"**

**You'll see:**
```
✅ Your site is live at https://gdoman99.github.io/ADMENSION/
```

**Wait 1-2 minutes for initial deployment.**

---

### Step 5: Verify Deployment (1 minute)

1. Visit: https://gdoman99.github.io/ADMENSION/
2. Open browser console (F12 → Console tab)
3. Check for:
   ```
   [ADMENSION Engagement] System initialized
   [Anti-Abuse] System initialized
   [Daily Quotes] Day X quote loaded
   ```
4. Navigate between pages (#home, #stats, #create, #manage, #docs, #admin)
5. Verify daily quote appears on homepage with GIF background

**If you see errors:**
- Check that all files are in `/src/` folder
- Verify script paths don't have leading `/`
- Check browser console for specific error messages

---

## 🔄 Update Your Site (After Deployment)

Whenever you make changes:

```bash
cd "/Users/TheRustySpoon/Desktop/Projects/Main projects/Trading_bots/ADMENSION"

# Stage changes
git add .

# Commit with message
git commit -m "Description of your changes"

# Push to GitHub
git push

# Live in 30-60 seconds!
```

**Example:**
```bash
git add .
git commit -m "Added new daily quotes, fixed mobile layout"
git push
```

---

## 🌐 Your Live URLs

**Main site:**
```
https://gdoman99.github.io/ADMENSION/
```

**Direct page access:**
```
https://gdoman99.github.io/ADMENSION/#home
https://gdoman99.github.io/ADMENSION/#stats
https://gdoman99.github.io/ADMENSION/#create
https://gdoman99.github.io/ADMENSION/#manage
https://gdoman99.github.io/ADMENSION/#docs
https://gdoman99.github.io/ADMENSION/#admin
```

**Privacy policy:**
```
https://gdoman99.github.io/ADMENSION/privacy-policy.html
```

---

## 📝 Next Steps After Deployment

### 1. Apply for AdSense (Today)

1. Go to: https://www.google.com/adsense/start/
2. Sign in with: `gdoman99@gmail.com` (or your preferred account)
3. Add your site URL: `https://gdoman99.github.io/ADMENSION/`
4. Wait 1-2 weeks for approval

**While waiting:**
- Share your site with friends/testers
- Create a few ADM links
- Test all features work correctly

### 2. Add AdSense Code (After Approval)

Once approved, paste ad code into `index.html` line 512-516:

```html
<!-- AD NETWORK SCRIPT HERE -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

Then push update:
```bash
git add index.html
git commit -m "Added AdSense publisher ID"
git push
```

### 3. Track First Revenue

- Wait 30 days after month-end for AdSense payment
- Calculate pool: `revenue × 0.13` (cap $10,000)
- Manual payout via Coinbase (see docs/CRITICAL_ISSUES_AND_RECOMMENDATIONS.md)

---

## 🔧 Troubleshooting

### "Permission denied (publickey)" error

**Fix:** Use HTTPS instead of SSH:
```bash
git remote set-url origin https://github.com/gdoman99/ADMENSION.git
```

### "fatal: remote origin already exists"

**Fix:** Remove and re-add:
```bash
git remote remove origin
git remote add origin https://github.com/gdoman99/ADMENSION.git
```

### Scripts not loading (404 errors)

**Check paths:**
- ✅ Correct: `src/consent.js`
- ❌ Wrong: `/src/consent.js` (leading slash breaks GitHub Pages)

### Changes not appearing on site

**Force refresh:**
- Hard reload: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Wait 1-2 minutes (GitHub Pages cache)
- Check repo: https://github.com/gdoman99/ADMENSION/actions (build status)

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| **Check status** | `git status` |
| **Stage all changes** | `git add .` |
| **Commit** | `git commit -m "message"` |
| **Push to GitHub** | `git push` |
| **View commit history** | `git log --oneline` |
| **Undo last commit** | `git reset --soft HEAD~1` |

---

## 🆘 Need Help?

**GitHub Pages Documentation:**
https://docs.github.com/en/pages

**Check build status:**
https://github.com/gdoman99/ADMENSION/deployments

**Contact GitHub Support:**
https://support.github.com/

---

**Ready to deploy? Run the commands in Step 1!** 🚀
