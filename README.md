# AI Writing & Reading Workspace

An integrated AI-powered workspace for writing and reading — built with Vue 3, Element Plus, MediaPipe, and multiple AI APIs.

> **Course**: User Interaction Technology (HCI), Final Project
> **University**: Tongji University, 2026

## Features

- 📝 **Smart Editor** — Paragraph-based editor with contenteditable text blocks
- 🌐 **Inline Translation** — Hover any paragraph to translate (Baidu Translate API)
- 🤖 **AI Assistant Sidebar** — Chat with DeepSeek v4 Flash about your article
- 🎤 **Voice Input** — Dictate text via Web Speech API
- 🖐 **Gesture Control** — Control the app hands-free with MediaPipe Hands

## Quick Start

### Prerequisites

- Node.js 18+
- Chrome browser (for Web Speech API and MediaPipe)

### Install

```bash
npm install
```

### Configure API Keys

1. Start the app: `npm run dev`
2. Click the gear icon in the top-right corner to open Settings
3. Fill in your API keys:
   - **Baidu Translate AppID & SecretKey** — Get from [Baidu Translate Open Platform](https://fanyi-api.baidu.com)
   - **DeepSeek API Key** — Get from [Alibaba Cloud Bailian](https://bailian.console.aliyun.com) → API Keys

Keys are stored in your browser's localStorage and never sent anywhere except to their respective API endpoints.

### Run

```bash
npm run dev        # Development server (http://localhost:3000)
npm run build      # Production build → dist/
npm run preview    # Preview production build
```

## Team & Module Assignment

| Member | Module | Technology |
|--------|--------|------------|
| Member A | Voice Input | Web Speech API |
| Member B | Gesture Control | MediaPipe Hands |
| Member C | AI + Translation | DeepSeek API + Baidu Translate API |

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **UI Library**: Element Plus
- **State Management**: Pinia
- **Build Tool**: Vite
- **Gesture**: @mediapipe/hands
- **APIs**: Baidu Translate, DeepSeek v4 Flash, Web Speech API
