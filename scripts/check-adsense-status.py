#!/usr/bin/env python3
"""
ADMENSION AdSense Status Monitor
Checks if the ad client is READY and lists available ad units.

Usage:
    python3 scripts/check-adsense-status.py          # One-time check
    python3 scripts/check-adsense-status.py --watch   # Poll every 5 minutes until READY

Once ad units exist, prints the SLOT_IDS config to paste into src/ad-loader.js.
"""
import json
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
import os

ADC_PATH = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")
ACCOUNT = "accounts/pub-5584590642779290"
AD_CLIENT = f"{ACCOUNT}/adclients/ca-pub-5584590642779290"
AD_LOADER_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "ad-loader.js")

def get_token():
    with open(ADC_PATH) as f:
        creds = json.load(f)
    data = urllib.parse.urlencode({
        "client_id": creds["client_id"],
        "client_secret": creds["client_secret"],
        "refresh_token": creds["refresh_token"],
        "grant_type": "refresh_token"
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    resp = json.loads(urllib.request.urlopen(req).read())
    return resp["access_token"], creds.get("quota_project_id", "")

def api_get(token, quota, path):
    url = f"https://adsense.googleapis.com/v2/{path}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    if quota:
        req.add_header("x-goog-user-project", quota)
    try:
        return json.loads(urllib.request.urlopen(req).read())
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_body": e.read().decode()[:500]}

def check_status():
    token, quota = get_token()

    # Check account
    acct = api_get(token, quota, ACCOUNT)
    acct_state = acct.get("state", "UNKNOWN")
    print(f"Account:   {acct.get('displayName', '?')} — state: {acct_state}")

    # Check ad client
    client = api_get(token, quota, AD_CLIENT)
    client_state = client.get("state", "UNKNOWN")
    product = client.get("productCode", "?")
    print(f"Ad Client: {product} — state: {client_state}")

    if client_state == "GETTING_READY":
        print("\n⏳ Ad client is still being reviewed by Google.")
        print("   You cannot create ad units until state = READY.")
        print("   This typically takes 24-48 hours after adding AdSense to your site.")
        return False

    if client_state == "READY":
        print("\n✅ Ad client is READY!")

    # List ad units
    units = api_get(token, quota, f"{AD_CLIENT}/adunits")
    ad_units = units.get("adUnits", [])

    if not ad_units:
        print("\n⚠️  No ad units found.")
        print("   Go to https://adsense.google.com → Ads → By ad unit → Display ads")
        print("   Create 3 units: Banner (728x90), Rectangle (300x250), Vertical (160x600)")
        return client_state == "READY"

    print(f"\n📊 Found {len(ad_units)} ad unit(s):")
    slot_ids = {}
    for u in ad_units:
        name = u.get("displayName", "?")
        rid = u.get("reportingDimensionId", "?")
        state = u.get("state", "?")
        size = u.get("contentAdsSettings", {}).get("size", "?")
        print(f"   {name} | slot={rid} | size={size} | state={state}")

        # Auto-map to BANNER/RECTANGLE/VERTICAL
        name_lower = name.lower()
        if "banner" in name_lower or "horizontal" in name_lower:
            slot_ids["BANNER"] = rid
        elif "rectangle" in name_lower or "square" in name_lower:
            slot_ids["RECTANGLE"] = rid
        elif "vertical" in name_lower or "skyscraper" in name_lower:
            slot_ids["VERTICAL"] = rid

    # If we couldn't auto-map, just assign sequentially
    if len(slot_ids) < len(ad_units) and len(ad_units) >= 3:
        rids = [u.get("reportingDimensionId", "") for u in ad_units]
        if "BANNER" not in slot_ids and len(rids) > 0:
            slot_ids["BANNER"] = rids[0]
        if "RECTANGLE" not in slot_ids and len(rids) > 1:
            slot_ids["RECTANGLE"] = rids[1]
        if "VERTICAL" not in slot_ids and len(rids) > 2:
            slot_ids["VERTICAL"] = rids[2]

    if slot_ids:
        print("\n" + "=" * 55)
        print("  PASTE INTO src/ad-loader.js SLOT_IDS (~line 28):")
        print("=" * 55)
        print(f"  const SLOT_IDS = {{")
        print(f"    BANNER:    '{slot_ids.get('BANNER', '')}',")
        print(f"    RECTANGLE: '{slot_ids.get('RECTANGLE', '')}',")
        print(f"    VERTICAL:  '{slot_ids.get('VERTICAL', '')}',")
        print(f"  }};")
        print("=" * 55)

        # Save for automation
        with open("/tmp/adsense_slot_ids.json", "w") as f:
            json.dump(slot_ids, f, indent=2)
        print(f"\nSlot IDs saved to /tmp/adsense_slot_ids.json")

    return True

def main():
    watch = "--watch" in sys.argv

    if not watch:
        check_status()
        return

    print("🔄 Watching AdSense status (checking every 5 minutes)...")
    print("   Press Ctrl+C to stop.\n")

    while True:
        ts = time.strftime("%H:%M:%S")
        print(f"\n[{ts}] Checking...")
        try:
            ready = check_status()
            if ready:
                print("\n🎉 AdSense is ready! You can now create ad units.")
                break
        except Exception as e:
            print(f"   Error: {e}")
        print(f"\n   Next check in 5 minutes...")
        time.sleep(300)

if __name__ == "__main__":
    main()
