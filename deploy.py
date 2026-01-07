#!/usr/bin/env python3

"""
ADMENSION - Automated GitHub Deployment via API
Bypasses git authentication issues by using GitHub API directly
"""

import os
import sys
import json
import base64
import subprocess
from pathlib import Path

# Colors
GREEN = '\033[0;32m'
BLUE = '\033[0;34m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
NC = '\033[0m'

def log(msg, color=BLUE):
    print(f"{color}{msg}{NC}")

def error(msg):
    print(f"{RED}❌ {msg}{NC}")
    sys.exit(1)

def success(msg):
    print(f"{GREEN}✅ {msg}{NC}")

# Read token
TOKEN_FILE = "/Users/TheRustySpoon/Desktop/Projects/Main projects/passcodes/github_token.txt"
if not os.path.exists(TOKEN_FILE):
    error(f"Token file not found: {TOKEN_FILE}")

with open(TOKEN_FILE) as f:
    lines = [line.strip() for line in f if line.strip().startswith('github_pat_')]
    if not lines:
        error("No token found in file")
    GITHUB_TOKEN = lines[0]

success("GitHub token loaded\n")

# Get list of files to upload
log("📂 Collecting files...")
repo_root = Path("/Users/TheRustySpoon/Desktop/Projects/Main projects/Trading_bots/ADMENSION")
os.chdir(repo_root)

# Get all tracked files from git
result = subprocess.run(['git', 'ls-files'], capture_output=True, text=True)
if result.returncode != 0:
    error("Failed to list git files")

files = [f for f in result.stdout.strip().split('\n') if f]
success(f"Found {len(files)} files to upload\n")

# Get current commit SHA
result = subprocess.run(['git', 'rev-parse', 'HEAD'], capture_output=True, text=True)
if result.returncode != 0:
    error("Failed to get commit SHA")
commit_sha = result.stdout.strip()

log(f"📝 Current commit: {commit_sha[:7]}\n")

# Upload files via GitHub API
import urllib.request
import urllib.error

OWNER = "GareBear99"
REPO = "ADMENSION"
BRANCH = "main"

def github_api(method, endpoint, data=None):
    """Make GitHub API request"""
    url = f"https://api.github.com{endpoint}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    
    if data:
        data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        error(f"API request failed: {e.code} {e.reason}\n{error_body}")

log("🚀 Uploading files to GitHub...\n")

uploaded = 0
for file_path in files:
    full_path = repo_root / file_path
    if not full_path.exists():
        continue
    
    # Read file content
    with open(full_path, 'rb') as f:
        content = base64.b64encode(f.read()).decode('utf-8')
    
    # Check if file exists on GitHub
    try:
        existing = github_api('GET', f"/repos/{OWNER}/{REPO}/contents/{file_path}?ref={BRANCH}")
        sha = existing.get('sha')
    except:
        sha = None
    
    # Upload/update file
    payload = {
        "message": f"Update {file_path}",
        "content": content,
        "branch": BRANCH
    }
    
    if sha:
        payload["sha"] = sha
    
    github_api('PUT', f"/repos/{OWNER}/{REPO}/contents/{file_path}", payload)
    uploaded += 1
    
    if uploaded % 5 == 0:
        print(f"   Uploaded {uploaded}/{len(files)} files...")

success(f"\n✅ All {uploaded} files uploaded!\n")

log("=" * 50)
success("🎉 Deployment Complete!")
log("=" * 50 + "\n")

print(f"{YELLOW}📋 Next Steps:{NC}")
print("1. Enable GitHub Pages:")
print(f"   {BLUE}https://github.com/{OWNER}/{REPO}/settings/pages{NC}")
print("   - Source: Deploy from a branch")
print("   - Branch: main")
print("   - Folder: / (root)")
print("   - Click Save\n")

print("2. Site will be live in 1-2 minutes at:")
print(f"   {GREEN}https://garebear99.github.io/ADMENSION/{NC}\n")

print("3. Submit to Google Search Console:")
print(f"   {BLUE}https://search.google.com/search-console{NC}")
print(f"   - Sitemap: {GREEN}https://garebear99.github.io/ADMENSION/sitemap.xml{NC}\n")

success("🚀 All systems ready for launch!")
