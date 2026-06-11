/**
 * LEGACY COMPATIBILITY SHIM
 *
 * This store is retained ONLY to avoid breaking existing imports during the
 * transition to the Markdown-first document model. It delegates to the new
 * documentStore where possible and provides empty stubs for removed features.
 *
 * All new code should use `useDocumentStore()` from './document.js' directly.
 *
 * TODO: Remove this file once all consumers have migrated to documentStore.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDocumentStore } from './document.js'

export const useEditorStore = defineStore('editor', () => {
  const doc = useDocumentStore()

  // Empty paragraphs array for consumers that still check .length
  const paragraphs = ref([])
  const activeParagraphId = ref(null)

  /**
   * Returns the full text of the active document as a single string.
   * Used by WorkspaceView for AI context injection.
   */
  function fullText() {
    return doc.activeMarkdown
  }

  // ── Stubs for removed paragraph operations ─────────────────────────
  // These no-ops exist so existing imports don't throw.
  // Components that called these should migrate to the new document model.

  function addParagraph() { /* no-op — use Markdown editor directly */ }
  function updateParagraph() { /* no-op */ }
  function removeParagraph() { /* no-op */ }
  function setTranslation() { /* no-op — now selection-based */ }
  function setTranslating() { /* no-op */ }
  function setActiveParagraph() { /* no-op */ }
  function pasteArticle(text) {
    // Simple compatibility: append to markdown
    if (text && doc.activeDocument) {
      const current = doc.activeMarkdown
      const appended = current ? current + '\n\n' + text.trim() : text.trim()
      doc.updateActiveMarkdown(appended)
    }
  }

  return {
    paragraphs,
    activeParagraphId,
    fullText,
    addParagraph,
    updateParagraph,
    removeParagraph,
    setTranslation,
    setTranslating,
    setActiveParagraph,
    pasteArticle
  }
})
