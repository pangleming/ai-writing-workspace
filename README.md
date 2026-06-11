# LexiVault

## A Local-first AI Markdown Workspace for Reading, Translation, and Writing

LexiVault is a local-first AI-assisted Markdown workspace that helps students import, read, understand, translate, and rewrite documents in one continuous workflow.

> **Course:** User Interaction Technology (HCI), Final Project · Tongji University, 2026
> **Team:** 廖毅玮 · 庞乐鸣 · 邹世豪

LexiVault is a lightweight course-project prototype inspired by modern Markdown-first and local-first writing tools such as Obsidian, SiYuan, and Burner-X. It is not a full replacement for any of them.

---

## Core Features

### 1. Markdown/TXT Document Workspace

- Import `.md`, `.markdown`, and `.txt` files via the Documents panel
- Edit documents with **Vditor** in Instant Rendering (IR) mode
- Manage multiple local documents in the left panel
- Export current document as clean Markdown (`.md`)
- Automatic save to `localStorage` with debounce
- Previous/next Markdown links are handled inside the workspace when the target document is imported — no new browser page opens

### 2. Outline Navigation

- H1/H2/H3 outline panel automatically generated from document headings
- Click any outline heading to jump to the corresponding section inside the editor
- Active heading is highlighted in the outline as you scroll through the document
- Duplicate heading titles are handled with deterministic IDs
- Collapsible and resizable outline panel

### 3. AI Reading and Writing Assistant

- **Select any text** in the editor to reveal the floating action toolbar
- Actions: **Explain**, **Summarize**, **Polish**, **Expand**, **Make Academic**, **Ask**
- AI sidebar uses the full current document as context
- Powered by the DeepSeek Chat API (streaming), configured in Settings

### 4. Translation Support

- **Selection-based translation** via the toolbar
- Original and translated text displayed clearly in the AI sidebar
- Powered by the Baidu Translate API, configured in Settings
- Translation does not trigger DeepSeek streaming — the two are independent

### 5. Voice and Gesture Interaction

- **Voice input**: click the microphone in the bottom bar to dictate text; inserted directly into the current editor
- **Hand gesture control**: camera overlay with MediaPipe-based gesture detection (Open Palm, Scissor, Index Finger, Fist, Rock)
- Gestures toggle the AI sidebar, scroll the editor, and control voice recognition
- These are experimental natural interaction features for the course project

### 6. Workspace Layout

- **Documents panel** (left) — New, Import, Export, document list
- **Outline panel** (left) — heading-based document navigation
- **Central Markdown editor** — Vditor IR mode
- **AI sidebar** (right) — slide-in conversational assistant
- All side panels are **collapsible** and **resizable** via drag splitters
- Layout state (widths, collapse) is persisted across sessions

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API) |
| Build Tool | Vite 5 |
| State Management | Pinia |
| UI Components | Element Plus |
| Markdown Editor | Vditor 3.11 (IR mode) |
| AI Chat | DeepSeek Chat API (streaming) |
| Translation | Baidu Translate API |
| Voice Recognition | Web Speech API |
| Gesture Recognition | MediaPipe Hands |
| Markdown Rendering | marked + DOMPurify |
| Persistence | localStorage (versioned payload) |

---

## Setup & Running

### Prerequisites

- Node.js 18 or later
- A Chromium-based browser (Chrome/Edge) for full Web Speech API and MediaPipe support
- A webcam for gesture control (optional — can be disabled in Settings)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The dev server starts at `http://localhost:3000` (follow the Vite terminal output).

### Production Build

```bash
npm run build
npm run preview
```

### API Key Configuration

Open the Settings modal (⚙️ in the top bar) and configure:

- **DeepSeek API Key** — required for AI assistant (register at [platform.deepseek.com](https://platform.deepseek.com))
- **Baidu Translate App ID & Secret Key** — required for translation (register at [fanyi-api.baidu.com](https://fanyi-api.baidu.com))

All API keys are stored in `localStorage` and never transmitted to third-party servers except their respective API endpoints.

---

## Manual Testing Checklist

- [ ] First launch: sample document appears in editor and left panel
- [ ] Import `docs/test-fixtures/complex-markdown-sample.md` — all headings, lists, code blocks, tables render correctly
- [ ] Edit the document, then export — exported Markdown contains all edits
- [ ] Create multiple documents, switch between them — edits persist
- [ ] Outline: click a heading → editor scrolls to that section
- [ ] Outline: scroll the editor → active heading highlight updates
- [ ] Previous/next Markdown links (`.md` relative links) do not open a new browser page
- [ ] If the linked document is imported, the link switches documents inside LexiVault
- [ ] If the linked document is not imported, a message is shown
- [ ] Selection toolbar: Explain, Summarize, Polish, Expand, Academic, Ask, Translate all work
- [ ] Translate Selection: shows original + translated text without triggering DeepSeek
- [ ] Voice input via bottom bar microphone inserts text into the editor
- [ ] Paste button inserts clipboard text at cursor
- [ ] Side panels collapse and resize via drag splitters
- [ ] Reload the page — documents, active document, and layout state are preserved
- [ ] Browser console: no Vditor 404 errors for `/vditor/dist/js/...`

---

## Directory Structure

```
src/
├── main.js
├── App.vue
├── views/
│   └── WorkspaceView.vue
├── components/
│   ├── layout/WorkspaceLayout.vue
│   ├── document/DocumentPanel.vue
│   ├── editor/
│   │   ├── MarkdownWorkspaceEditor.vue
│   │   ├── DocumentOutline.vue
│   │   └── SelectionToolbar.vue
│   ├── ai/AiSidebar.vue
│   ├── common/TopBar.vue, BottomBar.vue, SettingsModal.vue
│   ├── voice/VoiceButton.vue
│   └── gesture/GestureOverlay.vue
├── stores/
│   ├── document.js, editor.js, layout.js
│   ├── aiChat.js, config.js, gesture.js
├── services/
│   ├── headings.js, markdownFile.js, localDocumentStorage.js, filename.js
│   ├── aiWriter.js, translate.js, speech.js, gestureDetector.js
└── assets/styles/main.css
public/vditor/dist/       (Vditor runtime assets — served locally, no CDN required)
docs/test-fixtures/        (Markdown samples for manual testing)
```

---

## Known Limitations

- **localStorage** has a ~5 MB limit; suitable for tens of moderate documents, not large libraries
- **Markdown/TXT only** — no PDF or DOCX import in this iteration
- **Single-user local browser app** — no accounts, no cloud sync, no collaboration
- **No version history** — only the current state is persisted
- **Translation is selection-based**, not per-paragraph hover
- **Replace Selection** is not implemented; use Copy + Paste
- **Vditor runtime assets** are bundled locally in `public/vditor/dist/`, which increases the project size to ~6 MB
- **AI and translation** require user-provided API keys (DeepSeek, Baidu Translate)

---

## Design & References

LexiVault is designed as a **coursework prototype**. Its architecture is inspired by:

- **Obsidian** — local-first Markdown vault concept
- **SiYuan** — block-based note-taking with outline navigation
- **Burner-X** — browser-side AI document reading and translation
- **Vditor** — Markdown WYSIWYG/IR editing engine

No code was copied from SiYuan (AGPLv3) or Burner-X. Vditor is used as an npm dependency under the MIT license. All external APIs are used within their respective free-tier terms.

---

## License

This project is submitted as coursework for the User Interaction Technology course at Tongji University (2026).
