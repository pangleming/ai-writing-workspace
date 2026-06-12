<template>
  <WorkspaceLayout>
    <template #top>
      <TopBar />
    </template>

    <template #left>
      <DocumentPanel
        @switch-document="onSwitchDocument"
        @export-document="onExportDocument"
        @new-document="onNewDocument"
        @import-document="onImportDocument"
      />
    </template>

    <template #outline>
      <DocumentOutline
        :active-heading-id="activeHeadingId"
        @navigate-heading="onNavigateHeading"
      />
    </template>

    <template #editor>
      <div class="editor-area">
        <div class="editor-header">
          <input
            class="doc-title-input"
            :value="doc.activeDocument?.title || ''"
            @input="onTitleChange"
            placeholder="Document Title"
            title="Click to edit title"
          />
          <span class="editor-status">
            <span v-if="doc.isDirty" class="status-dirty" title="Unsaved changes">●</span>
            <span v-else-if="doc.initialized" class="status-saved" title="Saved">✓</span>
            <span v-if="doc.hasUnexportedChanges" class="status-export" title="Unexported changes">⚡</span>
          </span>
        </div>
        <MarkdownWorkspaceEditor
          ref="editorRef"
          :markdown="doc.activeMarkdown"
          @update:markdown="doc.updateActiveMarkdown"
          @active-heading-change="onActiveHeadingChange"
          @internal-link-click="onInternalLinkClick"
          placeholder="Start writing or import a Markdown file..."
        />
      </div>
    </template>

    <template #sidebar>
      <AiSidebar />
    </template>

    <template #bottom>
      <BottomBar />
    </template>
  </WorkspaceLayout>
  <GestureOverlay />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import TopBar from '../components/common/TopBar.vue'
import DocumentPanel from '../components/document/DocumentPanel.vue'
import BottomBar from '../components/common/BottomBar.vue'
import MarkdownWorkspaceEditor from '../components/editor/MarkdownWorkspaceEditor.vue'
import DocumentOutline from '../components/editor/DocumentOutline.vue'
import AiSidebar from '../components/ai/AiSidebar.vue'
import GestureOverlay from '../components/gesture/GestureOverlay.vue'
import { useDocumentStore } from '../stores/document.js'
import { useAiChatStore } from '../stores/aiChat.js'
import { useConfigStore } from '../stores/config.js'
import { sendMessage, streamResponse } from '../services/aiWriter.js'
import { parseHeadings } from '../services/headings.js'
import { ElMessage } from 'element-plus'

const doc = useDocumentStore()
const aiChat = useAiChatStore()
const config = useConfigStore()
const editorRef = ref(null)
const activeHeadingId = ref(null)

// ── Initialize ───────────────────────────────────────────────────────

onMounted(() => {
  doc.loadFromLocalStorage()
  // Initial heading sync after editor mounts
  nextTick(() => { syncHeadings() })
})

// ── Editor flush helper ──────────────────────────────────────────────

function flushEditor() {
  if (!editorRef.value) return
  const latest = editorRef.value.flushToStore?.()
  if (typeof latest === 'string' && latest !== doc.activeMarkdown) {
    doc.updateActiveMarkdown(latest)
  }
  doc.forceSave()
}

// ── Document panel event handlers ────────────────────────────────────

function onSwitchDocument(id) {
  flushEditor()
  doc.setActiveDocument(id)
}

function onExportDocument() {
  flushEditor()
  doc.exportActiveDocument()
}

function onNewDocument() {
  flushEditor()
  doc.createDocument()
}

function onImportDocument(file) {
  flushEditor()
  doc.importDocumentFromFile(file).then(() => {
    syncHeadings()
  }).catch(e => {
    console.error('Import failed:', e)
  })
}

// ── Outline navigation ───────────────────────────────────────────────

// Compute headings reactively from activeMarkdown
const outlineHeadings = computed(() => parseHeadings(doc.activeMarkdown))

function syncHeadings() {
  nextTick(() => {
    const headings = outlineHeadings.value
    editorRef.value?.scheduleHeadingSync(headings)
  })
}

function onNavigateHeading(id) {
  // Set active immediately for instant feedback
  activeHeadingId.value = id
  // Scroll inside the editor to the heading
  const ok = editorRef.value?.scrollToHeading(id)
  if (import.meta.env.DEV && !ok) {
    console.warn('[LexiVault Outline] scrollToHeading failed for:', id)
  }
}

function onActiveHeadingChange(id) {
  activeHeadingId.value = id
}

// Sync headings after document switch or markdown change
watch(() => doc.activeDocumentId, () => { syncHeadings() })
watch(() => doc.activeMarkdown, () => { syncHeadings() })

// ── Internal link handling ───────────────────────────────────────────

function onInternalLinkClick({ href, text }) {
  if (!href) return

  // Strip Markdown link syntax if href is malformed: [text](url) → url
  let clean = href
  const mdMatch = clean.match(/\]\((.+)\)$/)
  if (mdMatch) clean = mdMatch[1]

  // Remove leading ./ or .\ prefix
  clean = clean.replace(/^\.?[\\/]/, '')

  const decoded = decodeURI(clean)

  if (import.meta.env.DEV) {
    console.log('[LexiVault Link] route', { raw: href, clean, decoded, text })
  }

  // A. Hash links: #heading-name → navigate in current editor
  if (decoded.startsWith('#')) {
    const slug = decoded.slice(1).replace(/^lv-heading-/, '')
    const headings = parseHeadings(doc.activeMarkdown)
    // Exact id match
    let found = headings.find(h => h.id === slug)
    // Fuzzy text match (case-insensitive)
    if (!found) {
      found = headings.find(h =>
        h.text.toLowerCase() === slug.toLowerCase() ||
        h.text.toLowerCase().includes(slug.toLowerCase())
      )
    }
    if (found) {
      onNavigateHeading(found.id)
    } else {
      ElMessage.warning(`Heading not found: "${text || slug}"`)
    }
    return
  }

  // B. External links: open in new tab only
  if (/^https?:\/\//i.test(decoded) || /^mailto:/i.test(decoded)) {
    window.open(decoded, '_blank', 'noopener,noreferrer')
    return
  }

  // C. Relative Markdown links: previous.md, next.md, chapter.md#section
  if (/\.(md|markdown|txt)$/i.test(decoded) || /\.(md|markdown|txt)#/i.test(decoded)) {
    const hashIdx = decoded.indexOf('#')
    const filePart = hashIdx >= 0 ? decoded.slice(0, hashIdx) : decoded
    const hashPart = hashIdx >= 0 ? decoded.slice(hashIdx + 1) : ''
    const baseName = filePart.split('/').pop() || filePart
    const baseNoExt = baseName.replace(/\.(md|markdown|txt)$/i, '').toLowerCase().trim()

    // Normalize: replace separators (_, ·, ., -, spaces) with a single space
    function norm(s) {
      return s.replace(/[_·\.\-\s]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
    }

    // Extract chapter number prefix like "第01章" or "第1章"
    function chapterNum(s) {
      const m = s.match(/第\d+章/)
      return m ? m[0] : null
    }

    // Try to find matching document — strict first, then fuzzy
    let localDoc = null
    const allDocs = doc.documents

    // 1. Exact filename match
    localDoc = allDocs.find(d =>
      (d.filename || '').toLowerCase().trim() === baseName.toLowerCase()
    )
    // 2. Exact basename match (strip extensions)
    if (!localDoc) {
      localDoc = allDocs.find(d =>
        (d.filename || '').toLowerCase().replace(/\.(md|markdown|txt)$/i, '') === baseNoExt
      )
    }
    // 3. Exact title match
    if (!localDoc) {
      localDoc = allDocs.find(d =>
        (d.title || '').toLowerCase().trim() === baseNoExt
      )
    }
    // 4. Normalized name match (ignores separator differences like _ vs ·)
    if (!localDoc) {
      const linkNorm = norm(baseNoExt)
      localDoc = allDocs.find(d => {
        const dfNorm = norm((d.filename || '').replace(/\.(md|markdown|txt)$/i, ''))
        const dnNorm = norm(d.title || '')
        return dfNorm === linkNorm || dnNorm === linkNorm
      })
    }
    // 5. Normalized substring match
    if (!localDoc && baseNoExt.length >= 3) {
      const linkNorm = norm(baseNoExt)
      localDoc = allDocs.find(d => {
        const dfNorm = norm((d.filename || '').replace(/\.(md|markdown|txt)$/i, ''))
        const dnNorm = norm(d.title || '')
        return dfNorm.includes(linkNorm) || dnNorm.includes(linkNorm) ||
               linkNorm.includes(dfNorm) || linkNorm.includes(dnNorm)
      })
    }
    // 6. Chapter number match (e.g. "第01章" or "第1章")
    if (!localDoc) {
      const linkChap = chapterNum(baseNoExt)
      if (linkChap) {
        localDoc = allDocs.find(d => {
          const df = (d.filename || '') + (d.title || '')
          const docChap = chapterNum(df)
          return docChap === linkChap
        })
      }
    }

    if (localDoc) {
      flushEditor()
      doc.setActiveDocument(localDoc.id)
      if (hashPart) {
        nextTick(() => {
          const headings = parseHeadings(doc.activeMarkdown)
          const cleanHash = hashPart.replace(/^lv-heading-/, '')
          const found = headings.find(h =>
            h.id === cleanHash || h.text.toLowerCase().includes(cleanHash.toLowerCase())
          )
          if (found) onNavigateHeading(found.id)
        })
      }
    } else {
      const avail = allDocs.map(d => d.filename || d.title).filter(Boolean).slice(0, 5).join(', ')
      ElMessage.info({
        message: `"${text || baseName}" not found. Import it first. Available: ${avail || '(none)'}`,
        duration: 5000
      })
    }
    return
  }

  // D. Unrecognized: warn
  ElMessage.warning(`Cannot navigate to: "${decoded}"`)
}

// ── Title change ─────────────────────────────────────────────────────

function onTitleChange(e) {
  const val = e.target?.value
  if (val && val.trim()) doc.renameActiveDocument(val.trim())
}

// ── Text insert from BottomBar ───────────────────────────────────────

function onInsertText(e) {
  if (editorRef.value && e.detail?.text) {
    editorRef.value.insertValue(e.detail.text + '\n\n')
    if (e.detail.markHandled) e.detail.markHandled()
  }
}

// ── AI streaming watcher ─────────────────────────────────────────────

watch(() => aiChat.messages.length, async (newLen, oldLen) => {
  if (newLen === 0 || newLen <= oldLen) return
  const lastMsg = aiChat.messages[aiChat.messages.length - 1]
  if (!lastMsg || lastMsg.role !== 'user') return

  try {
    aiChat.isStreaming = true
    aiChat.addMessage('assistant', '')

    // Use latest editor content as context
    const latest = editorRef.value?.getValue?.()
    const context = latest || doc.activeMarkdown

    const apiMessages = aiChat.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(0, -1)
      .map(m => ({ role: m.role, content: m.content }))

    const reader = await sendMessage(apiMessages, config.deepseekApiKey, context)
    for await (const chunk of streamResponse(reader)) {
      aiChat.updateLastAssistantMessage(chunk)
    }
  } catch (e) {
    aiChat.updateLastAssistantMessage(`\n\nError: ${e.message}`)
  } finally {
    aiChat.isStreaming = false
  }
})

// ── Event listeners ──────────────────────────────────────────────────

onMounted(() => {
  window.addEventListener('lexivault:insert-text', onInsertText)
  window.addEventListener('beforeunload', flushEditor)
})

onUnmounted(() => {
  window.removeEventListener('lexivault:insert-text', onInsertText)
  window.removeEventListener('beforeunload', flushEditor)
})
</script>

<style scoped>
.editor-area {
  max-width: 860px; margin: 0 auto; padding: 16px 24px 48px; min-height: 100%;
}
.editor-header {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 12px; padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border, #e5e5e5);
}
.doc-title-input {
  flex: 1; font-size: 22px; font-weight: 700;
  border: none; outline: none; background: transparent;
  color: var(--color-text, #1a1a1a); font-family: inherit;
  padding: 2px 4px; border-radius: 4px; transition: background 0.15s;
}
.doc-title-input:hover { background: #f5f5f5; }
.doc-title-input:focus { background: #f0f0ff; outline: 2px solid var(--color-primary-light, #eef2ff); }
.editor-status { display: flex; gap: 6px; align-items: center; font-size: 13px; flex-shrink: 0; }
.status-dirty { color: #f59e0b; }
.status-saved { color: #16a34a; }
.status-export { color: #f59e0b; font-size: 11px; }
</style>
