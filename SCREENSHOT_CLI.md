# ADMENSION Screenshot CLI

Simple, reliable command-line tool to capture full-page screenshots of all ADMENSION pages.

## Quick Start

```bash
# Install dependencies
pip3 install selenium

# Install Chrome driver (macOS)
brew install chromedriver

# Run the screenshot tool
python3 screenshot-cli.py
```

## What It Does

- Captures all 6 pages (Home, Stats, Create, Manage, Docs, Admin)
- Full-page screenshots (entire scrollable content)
- Saves as PNG with timestamps
- Works headlessly (no browser window)
- Handles SSL/certificate issues automatically
- Output: `screenshots/` directory

## Requirements

- Python 3.7+
- Selenium (`pip3 install selenium`)
- Chrome browser
- ChromeDriver

## Installation

### macOS
```bash
# Install Chrome (if not installed)
brew install --cask google-chrome

# Install ChromeDriver
brew install chromedriver

# Install Selenium
pip3 install selenium
```

### Linux (Ubuntu/Debian)
```bash
# Install Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb

# Install ChromeDriver
sudo apt-get install chromium-chromedriver

# Install Selenium
pip3 install selenium
```

### Windows
```powershell
# Install Chrome from: https://www.google.com/chrome/

# Download ChromeDriver from: https://chromedriver.chromium.org/
# Add to PATH

# Install Selenium
pip install selenium
```

## Usage

### Capture All Pages
```bash
python3 screenshot-cli.py
```

Output:
```
🚀 ADMENSION Screenshot CLI
📂 Output: /path/to/screenshots

📸 Capturing home...
✅ Saved: screenshots/admension_home_2026-01-07_14-05-30.png
📸 Capturing stats...
✅ Saved: screenshots/admension_stats_2026-01-07_14-05-32.png
...

🎉 Captured 6/6 pages
📂 Location: /path/to/screenshots
```

### Modify for Specific Pages

Edit `screenshot-cli.py` and change the `PAGES` dictionary:

```python
PAGES = {
    "home": "#home",
    # Comment out pages you don't need
    # "stats": "#stats",
}
```

## Troubleshooting

### ChromeDriver Not Found
```bash
# Check if installed
which chromedriver

# If not found, install:
brew install chromedriver

# If permission denied (macOS):
xattr -d com.apple.quarantine $(which chromedriver)
```

### Selenium Not Found
```bash
pip3 install --upgrade selenium
```

### SSL Certificate Errors
The script includes these flags to ignore SSL issues:
- `--ignore-certificate-errors`
- `--allow-insecure-localhost`

### Chrome Version Mismatch
```bash
# Check Chrome version
google-chrome --version

# Update ChromeDriver to match
brew upgrade chromedriver
```

## For AI Assistants / Automation

This tool is specifically designed to work reliably in automated environments:

```bash
# Run from any directory
python3 /path/to/ADMENSION/screenshot-cli.py

# Screenshots saved to: /path/to/ADMENSION/screenshots/
```

### Integration Example
```python
import subprocess
import os

# Run screenshot CLI
result = subprocess.run([
    "python3",
    "/path/to/ADMENSION/screenshot-cli.py"
], capture_output=True, text=True)

print(result.stdout)

# Read screenshots
screenshot_dir = "/path/to/ADMENSION/screenshots"
screenshots = [
    os.path.join(screenshot_dir, f) 
    for f in os.listdir(screenshot_dir) 
    if f.endswith('.png')
]

# Process screenshots...
```

## Alternative: Use Built-in Browser Screenshot

For end users, the 📸 Screenshot button in the navigation bar is easier:

1. Visit https://garebear99.github.io/ADMENSION/
2. Click 📸 Screenshot button
3. Full-page PNG downloads automatically

No CLI setup required!

## Output Format

Filenames: `admension_[page]_[timestamp].png`

Examples:
- `admension_home_2026-01-07_14-05-30.png`
- `admension_stats_2026-01-07_14-05-32.png`
- `admension_create_2026-01-07_14-05-34.png`

Resolution: 1920px width, full page height (varies by page)

## License

Part of ADMENSION project. See main README.md for details.
