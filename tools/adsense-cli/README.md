# ADMENSION AdSense CLI

A command-line tool to monitor and manage Google AdSense for ADMENSION.

## Features

- 📊 Check AdSense approval status via API
- 🔔 Automatic notifications when site is approved
- ⏰ Scheduled status checks (9 AM & 6 PM daily)
- 🛠️ Interactive menu and direct commands
- ✅ Setup verification

## Quick Install

```bash
./install.sh
```

## Usage

### Interactive Menu
```bash
adsense
```

### Direct Commands
```bash
adsense status      # Quick status check
adsense verify      # Verify full setup
adsense check       # Run manual check now
adsense log         # View status log
adsense start       # Start checker daemon
adsense stop        # Stop checker daemon
adsense dashboard   # Open AdSense dashboard
adsense sites       # Open Sites page
adsense help        # Show all commands
```

## Files

| File | Description |
|------|-------------|
| `adsense` | Main CLI tool |
| `check-adsense-status.sh` | Background checker script |
| `com.admension.adsense-checker.plist` | macOS LaunchAgent for scheduling |
| `install.sh` | Installation script |

## Requirements

- macOS
- Google Cloud SDK (`gcloud`)
- AdSense API access configured

## Configuration

Before using, you need to:

1. Install Google Cloud SDK:
   ```bash
   brew install --cask google-cloud-sdk
   ```

2. Authenticate with AdSense scope:
   ```bash
   gcloud auth application-default login \
     --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/adsense.readonly"
   ```

3. Create a Google Cloud project and enable AdSense API:
   ```bash
   gcloud projects create your-project-name
   gcloud config set project your-project-name
   gcloud services enable adsense.googleapis.com
   gcloud auth application-default set-quota-project your-project-name
   ```

## Notifications

The checker sends macOS notifications for:
- 🔔 **Activation**: When the checker starts
- 🎉 **Approval**: When your site is approved (with sound!)
- 🔕 **Deactivation**: When checker stops (after approval)

## Log File

Status checks are logged to `~/.adsense-status.log`

View with:
```bash
adsense log
# or
cat ~/.adsense-status.log
```

## Customization

Edit the config variables at the top of `adsense`:
```bash
SITE="garebear99.github.io"
PUB_ID="pub-5584590642779290"
```

## License

Part of the ADMENSION project.
