# AI Writing & Reading Workspace

A unified, multimodal workspace for writing and reading — integrating real-time gesture control, speech-to-text dictation, inline machine translation, and an AI-powered conversational assistant into a single browser-based interface.

> **Course:** User Interaction Technology (HCI), Final Project · Tongji University, 2026
> **Team:** 廖毅玮 · 庞乐鸣 · 邹世豪

---

## Overview

Modern writing and reading workflows are fractured across tools: you draft in one window, translate in another, ask an AI chatbot in a third, and switch input modalities with a keyboard and mouse. The AI Writing & Reading Workspace collapses these boundaries. It presents a paragraph-oriented editor at the center, flanked by a slide-out AI sidebar. Three interaction modalities — keyboard, voice, and hand gesture — operate simultaneously, each bound to distinct actions without modal conflicts. Every paragraph is independently translatable with a single click. Selecting text surfaces a contextual toolbar that dispatches targeted AI prompts. The result is a tool that serves both authors composing in multiple languages and readers working through foreign-language articles.

---

## Features

### Paragraph-Based Smart Editor

The editor treats each paragraph as an independent, operable unit. Paragraphs are separated by newline characters and rendered as `contenteditable` blocks. Users add paragraphs by typing in the bottom input bar and pressing Enter, or by pasting multi-paragraph text from the clipboard — the paste handler splits lines into individual paragraph blocks automatically.

**Hover interactions.** Hovering over a paragraph reveals a translate button at its right edge. Clicking it expands an inline translation panel beneath the paragraph with a smooth `max-height` + opacity transition. Each translation panel exposes three actions: copy the result to clipboard, send the text to the AI assistant for deeper inquiry, or collapse the panel. Only one paragraph's translation stays open at a time.

**Selection interactions.** Selecting text within any paragraph triggers a floating toolbar positioned above the selection. The toolbar offers four AI-assisted operations on the selected text: **Explain** (interpret the passage), **Polish** (improve fluency and professionalism), **Expand** (add detail while preserving tone), and **Ask** (open a free-form query in the AI sidebar with the selection pre-filled as context). Clicking anywhere outside the selection dismisses the toolbar.

### AI Assistant Sidebar

A slide-in panel on the right side of the workspace hosts a conversational AI interface powered by the DeepSeek Chat API. The sidebar toggles via a button in the top bar, the Open Palm gesture, or automatically when a selection-triggered AI action fires.

**Context awareness.** Every message sent to the AI includes the full text of the current article as a system-level context injection (truncated at 4,000 characters). The assistant therefore understands the entire document without the user needing to repeat or summarize it. Questions about specific paragraphs, terminology, or the article's overall argument all benefit from this implicit context.

**Streaming responses.** AI responses stream token-by-token into the chat, producing a real-time typing effect. Messages render as styled chat bubbles with user and assistant avatars, timestamps, and per-message copy buttons.

**Markdown rendering.** Assistant responses support full Markdown formatting — bold, italic, inline code, code blocks, lists, and headings — rendered to HTML via `marked` and sanitized through DOMPurify to prevent XSS injection.

**Independent voice input.** The sidebar's own input bar includes a dedicated microphone button, allowing users to dictate questions to the AI without leaving the sidebar.

### Inline Paragraph Translation

Each paragraph supports one-click translation via the Baidu Translate API. Translation direction is auto-detected: Chinese text translates to English, English text to Chinese. Results are cached in memory keyed by `(text, targetLanguage)`, so re-opening the same paragraph's translation incurs no additional API call.

Translation requests are proxied through the Vite development server to avoid browser CORS restrictions. API authentication uses MD5-based request signing with a cryptographically random salt, computed client-side from the user's Baidu Translate AppID and Secret Key stored in `localStorage`.

### Voice Dictation

Voice input uses the browser-native Web Speech API (`SpeechRecognition`), available in Chromium-based browsers. Two independent microphone instances operate simultaneously:

- **Bottom bar microphone:** Converts speech to text appended directly to the article as a new paragraph. Interim results stream into the input field for visual feedback; final transcripts commit on recognition completion.
- **AI sidebar microphone:** Feeds dictated text into the sidebar's chat input field, where the user can edit before sending to the AI.

Voice recognition language auto-detects based on the first spoken phrase, with manual overrides for Chinese and English in Settings. The Fist gesture toggles the bottom bar microphone on and off.

### Hand Gesture Control

A draggable, minimizable camera overlay in the bottom-left corner displays the live webcam feed with real-time hand landmark detection via MediaPipe Hands. Five gestures map to workspace actions with configurable hold-time gating and per-gesture cooldown periods to prevent accidental triggers:

| Gesture | Detection | Action | Hold Time | Cooldown |
|---|---|---|---|---|
| ✋ Open Palm | Five extended fingers | Toggle AI sidebar | 1.0 s | 2.0 s |
| ✌️ Scissor | Index + middle fingers extended | Scroll down one viewport | 0.5 s | 1.0 s |
| ☝️ Index Finger | Single index finger extended | Scroll up one viewport | 0.5 s | 1.0 s |
| ✊ Fist | All fingers curled | Toggle voice recognition | 0.5 s | 2.0 s |
| 🤘 Rock | Thumb + pinky extended | Switch input focus | 0.5 s | 2.0 s |

Gesture state is indicated in the top bar — a green badge shows the currently detected gesture when the camera is active. The overlay can be minimized to a single icon or disabled entirely from Settings.

### Configuration

The Settings dialog (⚙️ in the top bar) organizes configuration into four tabs:

- **API Keys:** Baidu Translate AppID and Secret Key, DeepSeek API Key. All keys persist in `localStorage` and are never transmitted to any server except their respective API endpoints.
- **Gesture:** Enable/disable toggle, Open Palm hold duration slider (500–2000 ms), camera preview position selector.
- **Voice:** Speech recognition language (Auto-detect, Chinese, English).
- **About:** Version information and module attribution.

---

## Architecture

### Technology Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 with Composition API (`<script setup>`) |
| UI Components | Element Plus |
| State Management | Pinia (four stores) |
| Build Tool | Vite 5 |
| Gesture Recognition | @mediapipe/hands (MediaPipe Hands) |
| Speech Recognition | Web Speech API (`SpeechRecognition`) |
| Translation | Baidu Translate API (MD5-signed, Vite-proxied) |
| AI Chat | DeepSeek Chat API (streaming, OpenAI-compatible endpoint) |
| Markdown Rendering | `marked` + `DOMPurify` (XSS-sanitized) |
| MD5 Hashing | `blueimp-md5` |

### Directory Structure

```
src/
├── main.js                         # App bootstrap: Vue + Pinia + ElementPlus
├── App.vue                         # Root component
├── views/
│   └── WorkspaceView.vue           # Single view: layout orchestration, AI streaming watcher
├── components/
│   ├── layout/
│   │   └── WorkspaceLayout.vue     # CSS Grid shell: top / editor+sidebar / bottom
│   ├── editor/
│   │   ├── MainEditor.vue          # Paragraph list + selection toolbar controller
│   │   ├── ParagraphBlock.vue      # Single paragraph: editable text, hover translate, selection emit
│   │   ├── InlineTranslation.vue   # Expandable translation panel with actions
│   │   └── SelectionToolbar.vue    # Floating mini-toolbar (teleported to body)
│   ├── ai/
│   │   ├── AiSidebar.vue           # Slide-in panel: header, message list, streaming indicator
│   │   ├── ChatMessage.vue         # Chat bubble: avatar, rendered markdown, timestamp, copy
│   │   └── AiInputBar.vue          # Text input + integrated voice button
│   ├── gesture/
│   │   ├── GestureOverlay.vue      # Draggable camera window with MediaPipe pipeline
│   │   └── GestureIndicator.vue    # Minimized status icon
│   ├── voice/
│   │   └── VoiceButton.vue         # Mic toggle: idle / listening / error states
│   └── common/
│       ├── TopBar.vue              # Logo, gesture status badge, AI toggle, settings button
│       ├── BottomBar.vue           # Quick input, paste handler, add-paragraph, voice mic
│       └── SettingsModal.vue       # API keys, gesture config, voice language, about
├── services/
│   ├── speech.js                   # Web Speech API wrapper (create, start, stop, language detect)
│   ├── translate.js                # Baidu Translate API: MD5 signing, Vite proxy, in-memory cache
│   ├── aiWriter.js                 # DeepSeek API: system prompt, streaming SSE parser
│   └── gestureDetector.js          # MediaPipe Hands: init, frame loop, gesture classifier
├── stores/
│   ├── editor.js                   # Paragraphs array, CRUD, translation state, paste bulk-add
│   ├── aiChat.js                   # Message history, sidebar toggle, streaming flag
│   ├── config.js                   # API keys + settings, localStorage persistence with watchers
│   └── gesture.js                  # Current gesture, hold-time gating, per-gesture cooldowns
└── assets/styles/
    └── main.css                    # CSS custom properties, reset, transitions, scrollbar, animations
```

### State Management

Four Pinia stores handle all application state. Each store uses the Composition API style (`defineStore` with a setup function):

- **`config` store:** Persists API keys and user preferences to `localStorage` via reactive watchers. The `hasAllKeys()` getter checks whether both Baidu and DeepSeek credentials are configured.
- **`editor` store:** Manages an ordered array of paragraph objects — each holding an `id`, `text`, optional `translation`, and `translating` flag. Provides `addParagraph`, `updateParagraph`, `removeParagraph`, `setTranslation`, `pasteArticle` (bulk split by newline), and `fullText` (concatenated article string).
- **`aiChat` store:** Maintains the chat message list, `sidebarOpen` boolean, and `isStreaming` flag. The `updateLastAssistantMessage` method appends tokens incrementally during streaming.
- **`gesture` store:** Tracks the current detected gesture, hold-time gating (a gesture must persist for a configurable duration before it fires), and per-gesture cooldown timestamps to suppress retriggering.

### Data Flow

**AI conversation flow:**

```
User sends message → aiChat.addMessage('user', text)
  → WorkspaceView watcher detects new user message
    → sendMessage(history, apiKey, articleContext)
      → POST to api.deepseek.com/v1/chat/completions (streaming)
        → streamResponse() generator yields token chunks
          → aiChat.updateLastAssistantMessage(chunk) per chunk
            → ChatMessage renders accumulated content via marked + DOMPurify
```

**Translation flow:**

```
User clicks 🌐 on paragraph → ParagraphBlock.toggleTranslation()
  → translateWithCache(text, appId, secretKey)
    → Cache hit? Return cached result
    → Cache miss: MD5-sign request → POST via Vite proxy to Baidu API
    → editor.setTranslation(id, result.text)
      → InlineTranslation renders with copy / send-to-AI / collapse actions
```

**Gesture pipeline:**

```
MediaPipe Hands processes video frame
  → classifyGesture(landmarks): finger-tip heuristics → gesture name
    → GestureOverlay callback invokes gesture.updateGesture(name)
      → Hold-time gate (gesture must persist N ms)
        → Cooldown check (last trigger > N seconds ago)
          → Emit action: toggle sidebar / scroll / toggle voice / switch focus
```

---

## Setup & Running

### Prerequisites

- Node.js 18 or later
- A Chromium-based browser (Chrome or Edge) for Web Speech API and MediaPipe support
- A webcam for gesture control (optional — the feature can be disabled)

### Installation

```bash
npm install
```

### API Key Configuration

The application requires API keys for translation and AI features. Both are free to obtain:

**Baidu Translate (required for inline translation):**
1. Register at [fanyi-api.baidu.com](https://fanyi-api.baidu.com)
2. Complete identity verification (required by Chinese regulations for API access)
3. In the Management Console, create an application and select the General Translation API
4. Copy the **AppID** and **Secret Key** (not the API Key — the Secret Key is hidden behind a "Show" toggle)

**DeepSeek (required for AI assistant):**
1. Register at [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
2. Create an API key — new accounts receive 5 million free tokens

### Running

```bash
npm run dev
```

Opens `http://localhost:3000` (use `http://127.0.0.1:3000` if localhost is blocked by a proxy).

On first launch, click the gear icon (⚙️) in the top-right corner and fill in your API keys under the **API Keys** tab. Keys are stored in the browser's `localStorage` and sent only to their respective API endpoints.

```bash
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally
```

### Troubleshooting

**"Failed to fetch" on translation:** Ensure the Vite dev server is running (not a static file server). Translation requests are proxied through Vite to avoid CORS — this only works in development mode.

**"Invalid Sign" (54001):** Verify you entered the **Secret Key** (hidden behind "Show"), not the API Key. The two are displayed separately on the Baidu console.

**Camera access denied:** Click the camera icon in the browser address bar and set the permission to "Allow." On Windows, also check Settings → Privacy & Security → Camera to ensure camera access is enabled system-wide.

**Port 3000 unreachable:** System proxy software (Clash, V2Ray, etc.) may intercept localhost connections. Use `http://127.0.0.1:3000` instead, or configure your proxy to bypass local addresses.

---

## Team & Contributions

| Member | Module | Responsibilities |
|---|---|---|
| 廖毅玮 | Voice Input | Web Speech API integration, VoiceButton component, dual-microphone architecture (bottom bar + AI sidebar), interim/final result handling |
| 庞乐鸣 | Gesture Control | MediaPipe Hands pipeline, GestureOverlay (draggable camera window), GestureIndicator, five-gesture classifier with hold-time gating, action mapping to workspace controls |
| 邹世豪 | AI + Translation | DeepSeek Chat API streaming integration, AiSidebar / ChatMessage / AiInputBar components, Markdown rendering with XSS sanitization, Baidu Translate API MD5 signing, Vite proxy configuration, inline translation UI, translation result caching, Settings modal API configuration, system prompt design |

---

## License

This project is submitted as coursework for the User Interaction Technology course at Tongji University (2026). All external API usage complies with the respective services' free-tier terms.
