#!/bin/bash
# AdSense Status Checker - Notifies when site is approved
# Created: 2026-02-18

export PATH="/usr/local/share/google-cloud-sdk/bin:$PATH"

SITE="garebear99.github.io"
LOG_FILE="$HOME/.adsense-status.log"
FIRST_RUN_FLAG="$HOME/.adsense-checker-started"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# First run notification (only once)
if [ ! -f "$FIRST_RUN_FLAG" ]; then
  osascript -e 'display notification "AdSense checker is now active. Checking twice daily at 9AM and 6PM." with title "🔔 AdSense Checker Started" sound name "Submarine"'
  echo "[$TIMESTAMP] 🚀 AdSense checker ACTIVATED - will check at 9AM and 6PM daily" >> "$LOG_FILE"
  touch "$FIRST_RUN_FLAG"
fi

# Get current status
TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "[$TIMESTAMP] ❌ ERROR: Could not get auth token" >> "$LOG_FILE"
  exit 1
fi

RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  -H "x-goog-  -r-project: admension-adsense-api" \
  "https://adsense.googleapis.com/v2/acco  "https://adsense.googleapis.com/v2/acco  "https://ao "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state','UNKNOWN'))" 2>/dev/null)

# Log the check
echo "[$TIMESTAMP] Site: $SITE | Status: $STATUS" >> "$LOG_FILE"

# Check if approved
if [ "$STATUS" = "READY" ]; then
  # Send APPROVAL notification
  osascript -e 'display notification   osascript -e 'display notification   osascript -e 'display notification   osascript -e 'display notification   osascript -e 'display ascript -e 'display alert "AdSense Approved!" message "Your site garebear99.github.io has been approved! Ads will now display on ADMENSION. Check your AdSense dashboard for earnings."'
  
  echo "[$TIMESTAMP] ✅ APPROVED! Notification sent." >> "$LOG_FILE"
  
  # Send DEACTIVATION notification
  osascript -e 'display notification "Checker has been disabled - no longer needed!" with title "🔕 AdSense Checker Stopped" sound name "Purr"'
  echo "[$TIMESTAMP] 🔕 Daily checker  echo "[$TIMESTAMP] 🔕 Daily checker  echo "[$TIMESTAMP] 🔕 Daily checker  echo "[$TIMESTAMP] 🔕 Daily checker  echo "[$TIMESTAMP] 🔕 Daily checker  echo "[$TIMESTAMP] 🔕 Daily checker  echo adsense-checker.plist 2>/dev/null
else
  echo "[$TIMESTAMP] ⏳ Still waiting... Status: $STATUS" >> "$LOG_FILE"
fi

# Output for manual runs
echo "AdSense Status: $STATUS"
