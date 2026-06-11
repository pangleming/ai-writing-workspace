/**
 * Filename utilities for LexiVault.
 * Handles sanitization and derivation of safe filenames.
 */

const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1f]/g
const LEADING_TRAILING_DOTS = /^\.+|\.+$/g
const MAX_LENGTH = 200

/**
 * Sanitize a filename for cross-platform file system safety.
 * Strips Windows-illegal characters, leading/trailing dots, and caps length.
 *
 * @param {string} name - Raw name to sanitize
 * @returns {string} Clean filename (without extension)
 */
export function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return 'untitled'

  let cleaned = name
    .replace(ILLEGAL_CHARS, '')
    .replace(LEADING_TRAILING_DOTS, '')
    .trim()

  if (cleaned.length === 0) return 'untitled'
  if (cleaned.length > MAX_LENGTH) cleaned = cleaned.slice(0, MAX_LENGTH)

  return cleaned
}

/**
 * Derive a .md filename from a document title.
 *
 * @param {string} title - Document title
 * @returns {string} title.md (sanitized)
 */
export function deriveFilename(title) {
  const base = sanitizeFilename(title)
  return `${base}.md`
}

/**
 * Strip file extension from a filename.
 *
 * @param {string} filename - e.g. "notes.md"
 * @returns {string} e.g. "notes"
 */
export function stripExtension(filename) {
  const idx = filename.lastIndexOf('.')
  return idx > 0 ? filename.slice(0, idx) : filename
}
