/**
 * LocalStorage persistence adapter for LexiVault documents.
 * Versioned payload, graceful error handling, sample document fallback.
 */

const STORAGE_KEY = 'lexivault.documents.v1'
const STORAGE_VERSION = 1

const SAMPLE_MARKDOWN = `# Sample Reading Note

This is a sample document for **LexiVault** — your local-first AI Markdown workspace.

## Reading Section

Human-computer interaction studies how people use interactive systems and how systems can be designed to support human goals.

- Read the paragraph.
- Select a sentence.
- Ask the AI assistant to explain or polish it.

> Good interaction design reduces unnecessary context switching.

## Key Terms

1. **Usability** — how effectively, efficiently, and satisfactorily users achieve goals.
2. **Affordance** — the perceived and actual properties that suggest how to use an object.
3. **Feedback** — the system\'s response to user actions.

## Code Example

\`\`\`js
console.log("Markdown code blocks should be preserved during import and export.");
\`\`\`

## Tasks

- [ ] Import a Markdown file
- [ ] Edit the document
- [ ] Select text for AI help
- [ ] Export back to Markdown

---

*Select any text above and try the AI actions — Explain, Translate, Polish, Summarize, or Make Academic.*
`

export { STORAGE_KEY }

/**
 * Load documents and active document ID from localStorage.
 * Returns a sample document if storage is empty or corrupted.
 *
 * @returns {{ documents: Array, activeDocumentId: string | null }}
 */
export function loadDocuments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createFreshState()

    const data = JSON.parse(raw)

    // Version check
    if (!data || data.version !== STORAGE_VERSION) {
      return createFreshState()
    }

    // Validate structure
    if (!Array.isArray(data.documents)) {
      return createFreshState()
    }

    // If no documents, create sample
    if (data.documents.length === 0) {
      return createFreshState()
    }

    return {
      documents: data.documents,
      activeDocumentId: data.activeDocumentId || data.documents[0]?.id || null
    }
  } catch (e) {
    console.warn('LexiVault: Failed to load documents from localStorage:', e.message)
    return createFreshState()
  }
}

/**
 * Save documents and active document ID to localStorage.
 * Handles quota errors gracefully.
 *
 * @param {Array} documents - Array of document objects
 * @param {string | null} activeDocumentId - Currently active document ID
 */
export function saveDocuments(documents, activeDocumentId) {
  try {
    const payload = {
      version: STORAGE_VERSION,
      documents,
      activeDocumentId
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('LexiVault: localStorage quota exceeded. Some documents may not be saved.')
      // Don't crash — the app continues with in-memory state
    } else {
      console.error('LexiVault: Failed to save documents:', e.message)
    }
  }
}

/**
 * Generate a unique ID with crypto.randomUUID() fallback.
 *
 * @returns {string} Unique ID
 */
export function generateId() {
  try {
    return crypto.randomUUID()
  } catch {
    // Fallback for older browsers
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }
}

/**
 * Create the sample document object.
 *
 * @returns {import('../stores/document.js').Document}
 */
export function getSampleDocument() {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    title: 'Sample Reading Note',
    markdown: SAMPLE_MARKDOWN,
    filename: 'sample-reading-note.md',
    fileType: 'md',
    source: 'sample',
    createdAt: now,
    updatedAt: now,
    lastExportedAt: null
  }
}

function createFreshState() {
  const sample = getSampleDocument()
  return {
    documents: [sample],
    activeDocumentId: sample.id
  }
}
