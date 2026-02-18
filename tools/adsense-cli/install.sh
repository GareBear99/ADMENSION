#!/bin/bash
# ADMENSION AdSense CLI Installer

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║    ADMENSION AdSense CLI Installer                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$HOME/bin"
LAUNCH_AGENTS="$HOME/Library/LaunchAgents"

# Create directories
mkdir -p "$BIN_DIR"
mkdir -p "$LAUNCH_AGENTS"

echo "📁 Installing to $BIN_DIR..."

# Copy scripts
cp "$SCRIPT_DIR/adsense" "$BIN_DIR/"
cp "$SCRIPT_DIR/check-adsense-status.sh" "$BIN_DIR/"
chmod +x "$BIN_DIR/adsense"
chmod +x "$BIN_DIR/check-adsense-status.sh"

echo "✅ Scripts installed"

# Install LaunchAgent
echo "⏰ Installing scheduled checker..."
cp "$SCRIPT_DIR/com.admension.adsense-checker.plist" "$LAUNCH_AGENTS/"

# Update plist with correct path
sed -i '' "s|/Users/TheRustySpoon/bin|$BIN_DIR|g" "$LAUNCH_AGENTS/com.admension.adsense-checker.plist"

echo "✅ LaunchAgent installed"

# Add to PATH
echo "🔧 Configuring PATH..."
for rc in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.bash_profile"; do
  if [ -f "$rc" ]; then
    if ! grep -q 'export PATH="$HOME/bin:$PATH"' "$rc" 2>/dev/null; then
      echo 'export PATH="$HOME/bin:$PATH"' >> "$rc"
    fi
  fi
done

export PATH="$BIN_DIR:$PATH"
echo "✅ PATH configured"

# Load the checker
echo "🚀 Starting checker daemon..."
launchctl unload "$LAUNCH_AGENTS/com.admension.adsense-checker.plist" 2>/dev/null || true
launchctl load -w "$LAUNCH_AGENTS/com.admension.adsense-checker.plist"
echo "✅ Checker daemon started (runs at 9 AM and 6 PM)"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║    ✅ Installation Complete!                           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Usage:"
echo "  adsense          # Interactive menu"
echo "  adsense status   # Quick status check"
echo "  adsense verify   # Verify setup"
echo "  adsense help     # All commands"
echo ""
echo "Note: You may need to restart your terminal or run:"
echo "  export PATH=\"\$HOME/bin:\$PATH\""
echo ""
