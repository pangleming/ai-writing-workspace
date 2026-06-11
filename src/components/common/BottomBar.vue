<template>
  <div class="bottom-bar">
    <div class="bottom-left">
      <VoiceButton ref="voiceButtonRef" @result="onVoiceResult" @interim="onVoiceInterim" />
    </div>

    <div class="bottom-center">
      <span class="bottom-hint">
        Select text for AI actions · IR Markdown editing · Import/Export in document panel
      </span>
    </div>

    <div class="bottom-right">
      <el-button size="small" text @click="handlePaste"
        title="Paste clipboard text into editor at cursor position">
        📎 Paste
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import VoiceButton from '../voice/VoiceButton.vue'
import { useDocumentStore } from '../../stores/document.js'

const doc = useDocumentStore()
const voiceButtonRef = ref(null)

function onVoiceResult(text) {
  if (!text) return
  dispatchInsertText(text)
  ElMessage.success('Voice input added to document')
}

function onVoiceInterim() { /* handled by VoiceButton internally */ }

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText()
    if (!text) { ElMessage.warning('Clipboard is empty'); return }
    dispatchInsertText(text.trim())
    ElMessage.success('Clipboard content inserted')
  } catch {
    ElMessage.error('Cannot access clipboard. Please paste directly (Ctrl+V).')
  }
}

/**
 * Dispatch a custom event to insert text at cursor in Vditor.
 * Uses a markHandled callback — NOT preventDefault() — so the caller knows
 * whether WorkspaceView's editor ref handled the insertion.
 * Falls back to appending through the document store if no listener handles it.
 */
function dispatchInsertText(text) {
  let handled = false
  window.dispatchEvent(new CustomEvent('lexivault:insert-text', {
    detail: {
      text,
      markHandled: () => { handled = true }
    }
  }))
  if (!handled) {
    const current = doc.activeMarkdown
    const appended = current ? current + '\n\n' + text : text
    doc.updateActiveMarkdown(appended)
  }
}

// ── Gesture toggle relay ─────────────────────────────────────────────

function onGestureToggle() {
  voiceButtonRef.value?.toggle()
}

onMounted(() => {
  window.addEventListener('gesture-toggle-voice', onGestureToggle)
  window.addEventListener('lexivault:toggle-voice', onGestureToggle)
})

onUnmounted(() => {
  window.removeEventListener('gesture-toggle-voice', onGestureToggle)
  window.removeEventListener('lexivault:toggle-voice', onGestureToggle)
})
</script>

<style scoped>
.bottom-bar {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.bottom-left { display: flex; align-items: center; }
.bottom-center { flex: 1; text-align: center; }
.bottom-hint { font-size: 11px; color: #aaa; }
.bottom-right { display: flex; align-items: center; }
</style>
