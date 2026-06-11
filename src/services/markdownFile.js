/**
 * Markdown file import/export utilities for LexiVault.
 * Handles reading, title inference, and download of Markdown files.
 */

import { sanitizeFilename, stripExtension } from './filename.js'

const ALLOWED_EXTENSIONS = ['.md', '.markdown', '.txt']
const H1_REGEX = /^# (.+)$/

/**
 * Read a File object as UTF-8 text.
 * Validates extension (primary check) and MIME type (lenient fallback).
 *
 * @param {File} file - Browser File object
 * @returns {Promise<string>} File contents as string
 */
export function readMarkdownFile(file) {
  return new Promise((resolve, reject) => {
    const name = file.name.toLowerCase()

    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext))
    if (!hasValidExt) {
      reject(new Error(
        `Unsupported file type. Please use .md, .markdown, or .txt files.`
      ))
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`))
    }

    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * Infer document title from Markdown content.
 * Scans for the first H1 heading outside of fenced code blocks.
 *
 * @param {string} markdown - Raw Markdown content
 * @param {string} [fallbackFilename] - Original filename as fallback
 * @returns {string} Inferred title or fallback
 */
export function inferTitleFromMarkdown(markdown, fallbackFilename) {
  if (!markdown || typeof markdown !== 'string') {
    return fallbackFromFilename(fallbackFilename)
  }

  const lines = markdown.split('\n')
  let inCodeBlock = false

  for (const line of lines) {
    // Track fenced code block boundaries
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) continue

    const match = line.match(H1_REGEX)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return fallbackFromFilename(fallbackFilename)
}

function fallbackFromFilename(fallbackFilename) {
  if (fallbackFilename && typeof fallbackFilename === 'string') {
    const stripped = stripExtension(fallbackFilename)
    const sanitized = sanitizeFilename(stripped)
    if (sanitized && sanitized !== 'untitled') return sanitized
  }
  return 'Untitled Document'
}

/**
 * Trigger browser download of a Markdown file.
 *
 * @param {string} markdown - Markdown content to download
 * @param {string} filename - Desired filename (will be sanitized)
 */
export function downloadMarkdownFile(markdown, filename) {
  const safeName = sanitizeFilename(filename)
  const fullName = safeName.endsWith('.md') ? safeName : `${safeName}.md`

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fullName
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}
