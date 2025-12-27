# Chunks Chrome Extension

A Chrome extension that collects your browsing history and sends it to the Chunks Web App for generating personalized learning stories.

## Installation

### From Source (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top right corner
3. Click "Load unpacked"
4. Select this `extension` folder
5. The Chunks extension icon will appear in your browser toolbar

## Usage

1. Click the Chunks icon in your Chrome toolbar
2. Select a time range (last 24 hours, 7 days, 30 days, 3 months, or all time)
3. Review the statistics:
   - **Total URLs**: All URLs in your history for the selected time range
   - **After Filter**: URLs remaining after blacklist filtering
   - **Removed**: URLs filtered out (social media, search engines, etc.)
4. Click "Send to Chunks App"
5. The web app will open and automatically receive your browsing history

## Privacy

### What gets filtered out:
- Browser internal pages (chrome://, about:, etc.)
- Search engine results
- Social media sites
- Video platform main pages
- Email and messaging apps
- Calendar and productivity apps
- Login/authentication pages
- Shopping carts and checkout pages
- Development/localhost URLs
- Tracking parameters

### What's sent:
Only content-rich URLs (articles, documentation, tutorials, etc.) are sent to the web app for story generation.

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup UI
- `popup.js` - Popup logic and history collection
- `popup.css` - Popup styles
- `blacklist.js` - URL filtering rules
- `content.js` - Content script for injecting data into web app

## Permissions

- `history` - Read browsing history
- `storage` - Store extension data
- `tabs` - Open new tabs
- `scripting` - Inject scripts into web app page

## Troubleshooting

### Extension not sending data
1. Make sure the extension has "history" permission enabled
2. Try refreshing the extension in `chrome://extensions/`
3. Check the browser console for errors

### Web app not receiving data
1. Make sure you're using the correct web app URL
2. Check if pop-up blocker is preventing the new tab
3. Try the "Add URLs Manually" option in the web app

