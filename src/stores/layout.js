/**
 * LexiVault Layout Store — persistable sidebar state.
 * Tracks collapsed/open state and widths for Documents, Outline, and AI panels.
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'lexivault.layout.v1'

function loadLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function saveLayout(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export const useLayoutStore = defineStore('layout', () => {
  const saved = loadLayout()

  const documentsOpen = ref(saved?.documentsOpen ?? true)
  const outlineOpen = ref(saved?.outlineOpen ?? true)
  const aiSidebarOpen = ref(saved?.aiSidebarOpen ?? false)

  const documentsWidth = ref(saved?.documentsWidth ?? 220)
  const outlineWidth = ref(saved?.outlineWidth ?? 200)
  const aiSidebarWidth = ref(saved?.aiSidebarWidth ?? 380)

  function persist() {
    saveLayout({
      documentsOpen: documentsOpen.value,
      outlineOpen: outlineOpen.value,
      aiSidebarOpen: aiSidebarOpen.value,
      documentsWidth: documentsWidth.value,
      outlineWidth: outlineWidth.value,
      aiSidebarWidth: aiSidebarWidth.value
    })
  }

  watch([documentsOpen, outlineOpen, aiSidebarOpen,
         documentsWidth, outlineWidth, aiSidebarWidth], persist, { deep: false })

  function toggleDocuments() { documentsOpen.value = !documentsOpen.value }
  function toggleOutline() { outlineOpen.value = !outlineOpen.value }
  function toggleAiSidebar() { aiSidebarOpen.value = !aiSidebarOpen.value }

  return {
    documentsOpen, outlineOpen, aiSidebarOpen,
    documentsWidth, outlineWidth, aiSidebarWidth,
    toggleDocuments, toggleOutline, toggleAiSidebar
  }
})
