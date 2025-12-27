# Chunks - Browser History to Learning Stories

Transform your browsing history into personalized learning stories using AI.

This project consists of two parts:
1. **Chrome Extension** - Collects and filters your browsing history
2. **Web App** - Generates and displays personalized learning stories

## 🚀 Quick Start

### 1. Install the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The Chunks extension icon will appear in your toolbar

### 2. Use the Web App

The web app is deployed at: **https://chunks-browser-web-app.vercel.app**

Or run locally:
```bash
cd web-app
npm install
npm run dev
```

## 📖 How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Chrome Ext.    │────▶│    Web App      │────▶│   AI (Deepseek) │
│  - Read history │     │  - Receive URLs │     │  - Generate     │
│  - Filter URLs  │     │  - Display UI   │     │    stories      │
│  - Send to app  │     │  - Show stories │     │  - Create chunks│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Flow:
1. Click the extension icon
2. Choose time range (1 day - all time)
3. Click "Send to Chunks App"
4. Web app receives your filtered history
5. AI generates personalized stories
6. Swipe through stories and chunks
7. Chat with AI to reflect on what you learned

## 🔒 Privacy

- **All filtering happens locally** in your browser
- URLs are filtered to remove:
  - Social media (Facebook, Twitter, Instagram, etc.)
  - Search engines (Google, Bing, etc.)
  - Email and messaging apps
  - Login/authentication pages
  - Local development URLs
- **Your browsing history never leaves your control**

## 📁 Project Structure

```
chunks-browser-web-app/
├── extension/           # Chrome Extension
│   ├── manifest.json    # Extension config
│   ├── popup.html       # Extension popup UI
│   ├── popup.js         # Popup logic
│   ├── popup.css        # Popup styles
│   ├── blacklist.js     # URL filtering rules
│   └── content.js       # Content script for data transfer
│
└── web-app/             # React Web App
    ├── src/
    │   ├── components/  # React components
    │   ├── services/    # API and storage services
    │   └── types/       # TypeScript types
    ├── package.json
    └── vite.config.ts
```

## 🛠️ Development

### Extension Development
1. Make changes to files in `extension/`
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Chunks extension

### Web App Development
```bash
cd web-app
npm install
npm run dev
```

## 🌐 Deployment

### Web App (Vercel)
1. Push to GitHub
2. Import to Vercel
3. Set root directory to `web-app`
4. Deploy

### Extension (Chrome Web Store)
1. Zip the `extension` folder
2. Upload to Chrome Web Store Developer Dashboard

## 📝 License

MIT License

## 🙏 Credits

- LLM: [Deepseek](https://deepseek.com)
- Images: [Unsplash](https://unsplash.com)
- UI Framework: React + Tailwind CSS + shadcn/ui
- Animations: Motion (Framer Motion)

