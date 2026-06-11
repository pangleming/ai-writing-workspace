<template>
  <div class="markdown-editor-wrapper">
    <div v-if="!isVditorReady && !initError" class="editor-loading">
      <span>Loading editor…</span>
    </div>
    <div v-if="initError" class="editor-error">
      <p>⚠️ Editor failed to load</p>
      <p class="error-detail">{{ initError }}</p>
    </div>
    <div ref="editorRef" class="vditor-container" :class="{ hidden: !isVditorReady }"></div>
    <SelectionToolbar
      :visible="toolbar.visible"
      :text="toolbar.text"
      :x="toolbar.x"
      :y="toolbar.y"
      @explain="handleAction('explain')"
      @polish="handleAction('polish')"
      @expand="handleAction('expand')"
      @summarize="handleAction('summarize')"
      @academic="handleAction('academic')"
      @ask="handleAction('ask')"
      @translate="handleTranslate"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import SelectionToolbar from './SelectionToolbar.vue'
import { useAiChatStore } from '../../stores/aiChat.js'
import { useConfigStore } from '../../stores/config.js'
import { translateWithCache } from '../../services/translate.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
  markdown: { type: String, default: '' },
  placeholder: { type: String, default: 'Start writing...' }
})

const emit = defineEmits(['update:markdown', 'active-heading-change', 'internal-link-click'])

const editorRef = ref(null)
const aiChat = useAiChatStore()
const config = useConfigStore()

let vditor = null
let updatingFromProp = false
const isVditorReady = ref(false)
const initError = ref('')
let pendingMarkdown = null

const toolbar = reactive({
  visible: false, text: '', x: 0, y: 0
})

// ── AI action templates ──────────────────────────────────────────────

const actionPrompts = {
  explain: (t) => `Please explain the following text in detail:\n> ${t}`,
  polish: (t) => `Please polish and improve the writing of the following text. Keep the meaning but make it more fluent and professional:\n> ${t}`,
  expand: (t) => `Please expand on the following text, adding more details and depth while maintaining the original tone:\n> ${t}`,
  summarize: (t) => `Please summarize the following text concisely:\n> ${t}`,
  academic: (t) => `Please rewrite the following text in a formal academic style suitable for a research paper:\n> ${t}`,
  ask: (t) => `Regarding the following text:\n> ${t}\n\n`
}

function handleAction(action) {
  const prompt = actionPrompts[action](toolbar.text)
  aiChat.openSidebar()
  aiChat.addMessage('user', prompt)
  toolbar.visible = false
  window.getSelection()?.removeAllRanges()
}

async function handleTranslate() {
  if (!config.baiduAppId || !config.baiduSecretKey) {
    ElMessage.warning('Please configure Baidu Translate API keys in Settings.')
    return
  }
  try {
    const result = await translateWithCache(
      toolbar.text, config.baiduAppId, config.baiduSecretKey
    )
    aiChat.openSidebar()
    // Add assistant message ONLY — no user message, so AI watcher won't fire
    aiChat.addMessage('assistant',
      `**🌐 Translation Result**\n\n**Original:**\n> ${toolbar.text}\n\n**Translation:**\n> ${result.text}`
    )
    toolbar.visible = false
    window.getSelection()?.removeAllRanges()
  } catch (e) {
    ElMessage.error(`Translation failed: ${e.message}`)
  }
}

// ── Selection ────────────────────────────────────────────────────────

function onEditorSelect(value) {
  if (!value || !value.trim()) { toolbar.visible = false; return }
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  toolbar.text = value.trim()
  toolbar.x = rect.left + rect.width / 2
  toolbar.y = rect.top
  toolbar.visible = true
}

function dismissToolbar() {
  toolbar.visible = false
}

// ── Vditor lifecycle ─────────────────────────────────────────────────

function initVditor() {
  if (!editorRef.value) return
  try {
    vditor = new Vditor(editorRef.value, {
      mode: 'ir',
      value: props.markdown || '',
      placeholder: props.placeholder,
      height: '100%',
      minHeight: 400,
      toolbar: [],
      toolbarConfig: { hide: true },
      outline: { enable: false },
      cache: { enable: false },
      link: {
        isOpen: false,
        click: (el) => {
          // Vditor passes .vditor-ir__marker--link (span with URL text)
          // or an <a> element. Extract the raw link target.
          let href = el.getAttribute('href') || el.textContent?.trim() || ''
          // Strip Markdown link syntax if present: [text](url) → url
          const mdMatch = href.match(/\]\((.+)\)$/)
          if (mdMatch) href = mdMatch[1]
          emit('internal-link-click', { href, text: el.textContent?.trim() || '' })
        }
      },
      input(value) {
        if (updatingFromProp) return
        emit('update:markdown', value)
      },
      select(value) { onEditorSelect(value) },
      blur() {
        setTimeout(() => {
          if (!document.querySelector('.selection-toolbar:hover')) dismissToolbar()
        }, 200)
      },
      after() {
        isVditorReady.value = true
        const md = pendingMarkdown ?? props.markdown
        if (md) {
          updatingFromProp = true
          try { vditor.setValue(md, false) } catch {}
          nextTick(() => { updatingFromProp = false })
        }
        pendingMarkdown = null
        // Set up scroll listener, heading sync, and link interception
        _setupScrollListener()
        _setupLinkInterceptor()
        nextTick(() => { _refreshHeadingElements() })
      },
      cdn: '/vditor'
    })
  } catch (e) {
    initError.value = e.message || 'Unknown error'
    console.error('LexiVault: Vditor initialization failed:', e.message)
  }
}

function destroyVditor() {
  try { vditor?.destroy() } catch {}
  vditor = null
}

// ── External markdown sync ───────────────────────────────────────────

watch(() => props.markdown, (newMd) => {
  if (updatingFromProp) return

  if (!vditor || !isVditorReady.value) {
    // Vditor not ready yet — stash for later
    pendingMarkdown = newMd
    return
  }

  const current = vditor.getValue()
  if (newMd !== current) {
    updatingFromProp = true
    try { vditor.setValue(newMd, false) } catch {}
    nextTick(() => { updatingFromProp = false })
  }
})

// ── Document click ───────────────────────────────────────────────────

function onDocumentClick(e) {
  const tb = document.querySelector('.selection-toolbar')
  if (tb && tb.contains(e.target)) return
  if (editorRef.value && editorRef.value.contains(e.target)) return
  dismissToolbar()
}

// ── Heading selectors (Vditor IR uses [data-type="heading"]) ──────────

const HEADING_SELECTORS = [
  '[data-type="heading"]',
  '.vditor-ir [data-type="heading"]',
  '.vditor-reset [data-type="heading"]',
  '.vditor-content [data-type="heading"]',
  '.vditor-ir h1, .vditor-ir h2, .vditor-ir h3',
  '.vditor-reset h1, .vditor-reset h2, .vditor-reset h3'
]

function _findHeadingSelector() {
  for (const sel of HEADING_SELECTORS) {
    const els = editorRef.value?.querySelectorAll(sel)
    if (els && els.length > 0) return sel
  }
  return HEADING_SELECTORS[0]
}

// ── Scroll container detection ───────────────────────────────────────
// In our layout, .workspace-editor has overflow-y: auto — it's the real scroller.
// .vditor-ir fills to content height and its parent scrolls.

let _scrollContainer = null

function isScrollable(el) {
  if (!el) return false
  const s = window.getComputedStyle(el)
  return el.scrollHeight > el.clientHeight + 10 &&
    ['auto', 'scroll', 'overlay'].includes(s.overflowY)
}

function getActualScrollContainer() {
  if (_scrollContainer && document.contains(_scrollContainer)) return _scrollContainer
  const root = editorRef.value
  if (!root) return null
  const candidates = [
    root.closest('.workspace-editor'),
    root.closest('.editor-area'),
    root.querySelector('.vditor-ir'),
    root.querySelector('.vditor-content'),
    root.querySelector('.vditor'),
    root.querySelector('.vditor-reset'),
    root.closest('.workspace-main')
  ].filter(Boolean)
  _scrollContainer = candidates.find(isScrollable) || candidates[0] || null
  return _scrollContainer
}

// ── Heading anchor sync ──────────────────────────────────────────────

function syncHeadingAnchors(headings) {
  if (!isVditorReady.value || !editorRef.value) return { parsedCount: 0, domHeadingCount: 0, mappedCount: 0 }
  const sel = _findHeadingSelector()
  const els = editorRef.value.querySelectorAll(sel)
  const domCount = els.length
  let mapped = 0
  const limit = Math.min(els.length, headings.length)
  for (let i = 0; i < limit; i++) {
    els[i].setAttribute('data-outline-id', headings[i].id)
    mapped++
  }
  return { parsedCount: headings.length, domHeadingCount: domCount, mappedCount: mapped }
}

function scrollToHeading(id) {
  const scrollContainer = getActualScrollContainer()
  const el = editorRef.value?.querySelector(`[data-outline-id="${CSS.escape(id)}"]`)
  if (!el || !scrollContainer) {
    if (import.meta.env.DEV) console.warn('[Outline] scrollToHeading failed', { id, hasEl: !!el, hasContainer: !!scrollContainer })
    return false
  }

  const before = scrollContainer.scrollTop
  const containerRect = scrollContainer.getBoundingClientRect()
  const headingRect = el.getBoundingClientRect()
  const targetTop = scrollContainer.scrollTop + (headingRect.top - containerRect.top) - 16

  scrollContainer.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })

  setTimeout(() => {
    const after = scrollContainer.scrollTop
    if (import.meta.env.DEV) {
      console.log('[Outline] scroll result', { id, before, after, moved: after !== before })
    }
  }, 400)

  return true
}

// ── Active heading tracking ──────────────────────────────────────────

let _activeScrollTimer = null
let _headingSyncTimer = null
let _activeElements = []  // [{ id, el }]

function _refreshActiveElements() {
  if (!editorRef.value) { _activeElements = []; return }
  const els = editorRef.value.querySelectorAll('[data-outline-id]')
  _activeElements = Array.from(els).map(el => ({ id: el.getAttribute('data-outline-id'), el }))
}

function _updateActiveHeading() {
  const scrollContainer = getActualScrollContainer()
  if (!scrollContainer || _activeElements.length === 0) return
  const containerRect = scrollContainer.getBoundingClientRect()
  const threshold = containerRect.top + 80
  let activeId = _activeElements[0]?.id || null
  for (const h of _activeElements) {
    const rect = h.el.getBoundingClientRect()
    if (rect.top <= threshold) activeId = h.id
    else break
  }
  emit('active-heading-change', activeId)
}

function _onEditorScroll() {
  if (_activeScrollTimer) clearTimeout(_activeScrollTimer)
  _activeScrollTimer = setTimeout(() => {
    _refreshActiveElements()
    _updateActiveHeading()
  }, 100)
}

let _lastScrollContainer = null

function _setupScrollListener() {
  nextTick(() => {
    const sc = getActualScrollContainer()
    if (sc && sc !== _lastScrollContainer) {
      if (_lastScrollContainer) _lastScrollContainer.removeEventListener('scroll', _onEditorScroll)
      sc.addEventListener('scroll', _onEditorScroll, { passive: true })
      _lastScrollContainer = sc
    }
    // initial active heading
    _refreshActiveElements()
    _updateActiveHeading()
  })
}

function _teardownScrollListener() {
  if (_lastScrollContainer) {
    _lastScrollContainer.removeEventListener('scroll', _onEditorScroll)
    _lastScrollContainer = null
  }
}

function scheduleHeadingSync(headings) {
  if (_headingSyncTimer) clearTimeout(_headingSyncTimer)
  _headingSyncTimer = setTimeout(() => {
    // Invalidate scroll container cache (layout may have changed)
    _scrollContainer = null
    syncHeadingAnchors(headings)
    _refreshActiveElements()
    _updateActiveHeading()
  }, 250)
}

// ── Window-level link interception safety net ─────────────────────────
// Vditor's link.click callback handles the primary interception, but this
// capture-phase window listener catches any link clicks that slip through.

function _isInsideEditor(target) {
  return editorRef.value?.contains(target)
}

function _findLinkTarget(target) {
  if (!_isInsideEditor(target)) return null
  let el = target
  while (el && el !== document.body) {
    if (!editorRef.value?.contains(el)) return null
    const tag = el.tagName?.toLowerCase()
    if (tag === 'a') return el
    if (el.hasAttribute?.('data-type') && el.getAttribute('data-type') === 'a') return el
    el = el.parentElement
  }
  return null
}

function _onGlobalLinkClick(e) {
  const link = _findLinkTarget(e.target)
  if (!link) return
  const href = link.getAttribute('href') || link.textContent?.trim() || ''
  if (!href) return

  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation?.()

  if (import.meta.env.DEV) {
    console.log('[LexiVault Link] intercepted (window capture)', {
      rawHref: href,
      tag: link.tagName,
      defaultPrevented: e.defaultPrevented
    })
  }

  emit('internal-link-click', { href, text: link.textContent?.trim() || '' })
}

function _onGlobalLinkMouseDown(e) {
  const link = _findLinkTarget(e.target)
  if (!link) return
  e.preventDefault()
}

function _setupLinkInterceptor() {
  window.addEventListener('click', _onGlobalLinkClick, true)
  window.addEventListener('mousedown', _onGlobalLinkMouseDown, true)
}

function _teardownLinkInterceptor() {
  window.removeEventListener('click', _onGlobalLinkClick, true)
  window.removeEventListener('mousedown', _onGlobalLinkMouseDown, true)
}

onMounted(() => {
  initVditor()
  document.addEventListener('click', onDocumentClick, true)
  // Watch for markdown changes → schedule heading re-sync
  watch(() => props.markdown, () => {
    nextTick(() => {
      _refreshActiveElements()
      _updateActiveHeading()
    })
  })
})

onUnmounted(() => {
  _teardownScrollListener()
  _teardownLinkInterceptor()
  destroyVditor()
  document.removeEventListener('click', onDocumentClick, true)
})

defineExpose({
  getValue: () => vditor?.getValue() || '',
  flushToStore: () => {
    if (!vditor) return ''
    const value = vditor.getValue() || ''
    emit('update:markdown', value)
    return value
  },
  setValue: (md) => {
    if (!vditor || !isVditorReady.value) {
      pendingMarkdown = md
      return
    }
    updatingFromProp = true
    try { vditor.setValue(md || '', false) } catch {}
    nextTick(() => { updatingFromProp = false })
  },
  insertValue: (value) => {
    if (vditor) {
      try {
        vditor.insertValue(value, true)
        const latest = vditor.getValue()
        if (latest !== undefined) emit('update:markdown', latest)
      } catch {}
    }
  },
  syncHeadingAnchors,
  scheduleHeadingSync,
  scrollToHeading,
  getActualScrollContainer,
  focus: () => vditor?.focus()
})
</script>

<style scoped>
.markdown-editor-wrapper {
  position: relative; height: 100%; min-height: 400px;
}

.vditor-container { height: 100%; }
.vditor-container.hidden { visibility: hidden; position: absolute; }

.editor-loading {
  display: flex; align-items: center; justify-content: center;
  height: 400px; color: var(--color-text-secondary, #666); font-size: 14px;
}

.editor-error {
  padding: 40px; text-align: center; color: #dc2626;
}
.editor-error .error-detail { font-size: 12px; color: #999; margin-top: 4px; }

:deep(.vditor) { border: none; border-radius: 0; }
:deep(.vditor-ir) {
  padding: 16px 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px; line-height: 1.8;
  color: var(--color-text, #1a1a1a); min-height: 400px;
}
:deep(.vditor-ir .vditor-reset) { font-size: 15px; line-height: 1.8; }
:deep(.vditor-ir h1) { font-size: 28px; }
:deep(.vditor-ir h2) { font-size: 22px; }
:deep(.vditor-ir h3) { font-size: 18px; }
:deep(.vditor-ir pre.vditor-reset[placeholder]:empty::before) {
  color: #aaa; font-style: italic;
}
</style>
