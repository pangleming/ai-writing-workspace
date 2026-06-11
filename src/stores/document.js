/**
 * LexiVault Document Store — single source of truth for all document state.
 *
 * All editor content, AI context, export, persistence, and word count derive from
 * activeMarkdown. Replaces the old paragraph-array model.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  loadDocuments,
  saveDocuments,
  generateId
} from '../services/localDocumentStorage.js'
import {
  readMarkdownFile,
  inferTitleFromMarkdown,
  downloadMarkdownFile
} from '../services/markdownFile.js'
import { deriveFilename } from '../services/filename.js'

export const useDocumentStore = defineStore('document', () => {
  // ── State ──────────────────────────────────────────────────────────

  const documents = ref([])
  const activeDocumentId = ref(null)
  const isDirty = ref(false)
  const lastSavedMarkdown = ref('')
  const hasUnexportedChanges = ref(false)
  const initialized = ref(false)

  // ── Getters ────────────────────────────────────────────────────────

  const activeDocument = computed(() =>
    documents.value.find(d => d.id === activeDocumentId.value) || null
  )
  const activeMarkdown = computed(() =>
    activeDocument.value?.markdown || ''
  )
  const documentCount = computed(() => documents.value.length)
  const wordCount = computed(() => {
    const md = activeMarkdown.value
    if (!md) return 0
    return md.trim().split(/\s+/).filter(Boolean).length
  })
  const charCount = computed(() => activeMarkdown.value.length)

  // ── Persistence helpers ────────────────────────────────────────────

  let _saveTimer = null

  function saveToLocalStorage() {
    saveDocuments(documents.value, activeDocumentId.value)
    isDirty.value = false
    if (activeDocument.value) {
      lastSavedMarkdown.value = activeDocument.value.markdown
    }
  }

  function debouncedSave() {
    if (_saveTimer) clearTimeout(_saveTimer)
    _saveTimer = setTimeout(() => { saveToLocalStorage() }, 500)
  }

  function forceSave() {
    if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null }
    saveToLocalStorage()
    isDirty.value = false
  }

  // ── Actions ────────────────────────────────────────────────────────

  function createDocument(title) {
    forceSave()
    const now = new Date().toISOString()
    const docTitle = title || 'Untitled Document'
    const newDoc = {
      id: generateId(),
      title: docTitle,
      markdown: '',
      filename: deriveFilename(docTitle),
      fileType: 'manual',
      source: 'created',
      createdAt: now,
      updatedAt: now,
      lastExportedAt: null
    }
    documents.value.push(newDoc)
    activeDocumentId.value = newDoc.id
    isDirty.value = false
    lastSavedMarkdown.value = ''
    hasUnexportedChanges.value = false
    debouncedSave()
    return newDoc.id
  }

  async function importDocumentFromFile(file) {
    forceSave()
    const markdown = await readMarkdownFile(file)

    // Defensive check: reject truly empty files
    if (!markdown || markdown.length === 0) {
      throw new Error('Imported file is empty.')
    }

    const title = inferTitleFromMarkdown(markdown, file.name)
    const now = new Date().toISOString()
    const ext = file.name.toLowerCase().endsWith('.txt') ? 'txt' : 'md'

    const newDoc = {
      id: generateId(),
      title,
      markdown,
      filename: file.name,           // preserve original filename
      fileType: ext,
      source: 'imported',
      createdAt: now,
      updatedAt: now,
      lastExportedAt: null
    }

    documents.value.push(newDoc)
    activeDocumentId.value = newDoc.id
    isDirty.value = false
    lastSavedMarkdown.value = markdown
    hasUnexportedChanges.value = true

    forceSave()
    return newDoc.id
  }

  function setActiveDocument(id) {
    if (activeDocumentId.value === id) return
    forceSave()
    activeDocumentId.value = id
    isDirty.value = false
    lastSavedMarkdown.value = activeDocument.value?.markdown || ''
    hasUnexportedChanges.value = activeDocument.value?.lastExportedAt == null
    debouncedSave()
  }

  function updateActiveMarkdown(markdown) {
    const d = activeDocument.value
    if (!d) return
    if (d.markdown === markdown) return
    d.markdown = markdown
    d.updatedAt = new Date().toISOString()
    isDirty.value = true
    hasUnexportedChanges.value = true
    debouncedSave()
  }

  function renameActiveDocument(title) {
    if (!activeDocument.value || !title) return
    activeDocument.value.title = title
    if (activeDocument.value.source !== 'imported' || !activeDocument.value.filename) {
      activeDocument.value.filename = deriveFilename(title)
    }
    activeDocument.value.updatedAt = new Date().toISOString()
    debouncedSave()
  }

  /** Rename a specific document by ID (not necessarily the active one). */
  function renameDocument(id, title) {
    const d = documents.value.find(x => x.id === id)
    if (!d || !title) return
    d.title = title
    if (d.source !== 'imported' || !d.filename) {
      d.filename = deriveFilename(title)
    }
    d.updatedAt = new Date().toISOString()
    debouncedSave()
  }

  function deleteDocument(id) {
    const idx = documents.value.findIndex(d => d.id === id)
    if (idx === -1) return

    documents.value.splice(idx, 1)

    if (activeDocumentId.value === id) {
      if (documents.value.length > 0) {
        activeDocumentId.value = documents.value[0].id
      } else {
        // Last document deleted — auto-create a safe replacement
        forceSave()
        createDocument('Untitled Document')
        return
      }
    }

    isDirty.value = false
    lastSavedMarkdown.value = activeDocument.value?.markdown || ''
    forceSave()
  }

  function exportActiveDocument() {
    const d = activeDocument.value
    if (!d) return
    // 1. Save latest markdown (caller should flush editor first)
    forceSave()
    // 2. Download
    const filename = d.filename || deriveFilename(d.title)
    downloadMarkdownFile(d.markdown, filename)
    // 3. Update export status
    d.lastExportedAt = new Date().toISOString()
    hasUnexportedChanges.value = false
    // 4. Persist export status
    forceSave()
  }

  // ── Initialization ─────────────────────────────────────────────────

  function loadFromLocalStorage() {
    if (initialized.value) {
      // Prevent double-init from overwriting in-memory state
      return
    }
    const data = loadDocuments()
    documents.value = data.documents
    // Ensure activeDocumentId is valid
    if (data.documents.length > 0 && !data.documents.some(d => d.id === data.activeDocumentId)) {
      activeDocumentId.value = data.documents[0].id
    } else {
      activeDocumentId.value = data.activeDocumentId
    }
    if (activeDocument.value) {
      lastSavedMarkdown.value = activeDocument.value.markdown
    }
    initialized.value = true

    // Development debug helper
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      window.__lexivaultDebug = {
        getDocuments: () => documents.value,
        getActive: () => activeDocument.value,
        getMarkdownLength: () => activeMarkdown.value.length,
        getActiveId: () => activeDocumentId.value,
        isInitialized: () => initialized.value,
        getStoreMarkdown: () => activeMarkdown.value
      }
    }
  }

  // ── beforeunload ────────────────────────────────────────────────────

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => { forceSave() })
  }

  // ── Return ─────────────────────────────────────────────────────────

  return {
    documents, activeDocumentId, isDirty, lastSavedMarkdown,
    hasUnexportedChanges, initialized,
    activeDocument, activeMarkdown, documentCount, wordCount, charCount,
    createDocument, importDocumentFromFile, setActiveDocument,
    updateActiveMarkdown, renameActiveDocument, renameDocument,
    deleteDocument, exportActiveDocument,
    forceSave, loadFromLocalStorage, saveToLocalStorage
  }
})
