#!/bin/bash
# ADMENSION Screenshot Trigger
# Triggers the screenshot button on the live website via browser automation

URL="https://garebear99.github.io/ADMENSION/"

echo "🚀 Triggering ADMENSION screenshot..."
echo "📱 This will:"
echo "   1. Open/focus the browser"
echo "   2. Navigate to ADMENSION"
echo "   3. Click the screenshot button"
echo "   4. Download will start automatically"
echo ""

# macOS with Chrome
osascript <<EOF
tell application "Google Chrome"
    activate
    
    -- Check if tab with ADMENSION is open
    set foundTab to false
    set windowIndex to 1
    set tabIndex to 1
    
    repeat with w in windows
        set windowIndex to windowIndex
        set tabIndex to 1
        repeat with t in tabs of w
            if URL of t contains "garebear99.github.io/ADMENSION" then
                set foundTab to true
                set active tab index of w to tabIndex
                set index of w to 1
                exit repeat
            end if
            set tabIndex to tabIndex + 1
        end repeat
        if foundTab then exit repeat
        set windowIndex to windowIndex + 1
    end repeat
    
    -- If not found, open new tab
    if not foundTab then
        tell window 1
            make new tab with properties {URL:"$URL"}
        end tell
        delay 2
    end if
    
    -- Execute JavaScript to click screenshot button
    tell active tab of window 1
        execute javascript "
            // Wait for page to load
            if (typeof window.captureFullPageScreenshot === 'function') {
                window.captureFullPageScreenshot();
                'Screenshot triggered!';
            } else {
                'ERROR: Screenshot function not found. Page may not be loaded.';
            }
        "
    end tell
end tell
EOF

echo "✅ Screenshot command sent to browser!"
echo "📸 Check your Downloads folder for: ADMENSION_[page]_[timestamp].png"
