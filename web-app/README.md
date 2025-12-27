# Chunks Web App 3

Transform your browsing history into bite-sized knowledge stories with AI-powered content generation.

## ✨ Features

- **📱 Stories Format** - Instagram-style stories for easy learning
- **🤖 Multi-LLM Support** - OpenAI, Anthropic Claude, Google Gemini
- **📚 Chunks** - Bite-sized knowledge cards generated from your browsing history
- **💬 Reflection Chat** - AI-powered conversation to help you reflect on what you learned

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- An API key from one of:
  - [OpenAI](https://platform.openai.com/api-keys)
  - [Anthropic](https://console.anthropic.com/)
  - [Google AI Studio](https://aistudio.google.com/app/apikey) (Gemini - Free tier available!)

### Installation

```bash
# Clone the repository
git clone https://github.com/White-Peng/Chunks-web-app-3.git
cd chunks-web-app-3

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. **Configure API** - Go to Settings and enter your LLM API key
2. **Add URLs** - Paste URLs from your browsing history
3. **Generate Stories** - Click "Generate Stories from URLs"
4. **Learn** - Tap through Stories → Chunks → Chat

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **LLM APIs**: OpenAI, Anthropic, Google Gemini

## 📁 Project Structure

```
src/
├── components/
│   ├── pages/          # Page components
│   │   ├── WelcomePage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── StoriesPage.tsx
│   │   ├── ChunksPage.tsx
│   │   └── ChatbotPage.tsx
│   └── shared/         # Shared components
├── services/
│   ├── llm/            # LLM service implementations
│   ├── storageService.ts
│   └── contentGenerator.ts
├── types/              # TypeScript types
└── lib/                # Utilities
```

## 🔒 Privacy

- All data is stored locally in your browser (localStorage)
- API keys never leave your device
- No data is sent to any server except the LLM provider you choose

## 📝 License

MIT

## 🙏 Acknowledgments

- [Human-AI Project](https://github.com/adityachivu/human-ai) for inspiration
- [shadcn/ui](https://ui.shadcn.com/) for UI components
