/**
 * Heading parser for LexiVault outline navigation.
 * Extracts H1-H3 headings from Markdown, generates stable slug IDs,
 * and handles duplicate headings with numeric suffixes.
 */

/**
 * Strip common inline Markdown from heading text.
 * Removes: **bold**, *italic*, `code`, [links](url), ~~strikethrough~~, images
 * @param {string} text - Raw heading text
 * @returns {string} Clean text
 */
function stripInlineMarkdown(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')   // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')     // links
    .replace(/\*\*([^*]+)\*\*/g, '$1')            // bold
    .replace(/__([^_]+)__/g, '$1')                // bold alt
    .replace(/\*([^*]+)\*/g, '$1')                // italic
    .replace(/_([^_]+)_/g, '$1')                  // italic alt
    .replace(/`([^`]+)`/g, '$1')                  // inline code
    .replace(/~~([^~]+)~~/g, '$1')                // strikethrough
    .trim()
}

/**
 * Generate a URL-friendly slug from heading text.
 * @param {string} text - Clean heading text
 * @returns {string} Lowercase hyphenated slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿\s-]/g, '')  // keep word chars + CJK + spaces + hyphens
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'heading'
}

/**
 * Parse headings from raw Markdown.
 * Skips fenced code blocks. Generates stable, deduplicated IDs.
 *
 * @param {string} markdown - Raw Markdown content
 * @returns {Array<{id: string, slug: string, level: number, text: string, line: number}>}
 */
export function parseHeadings(markdown) {
  if (!markdown) return []

  const headings = []
  const lines = markdown.split('\n')
  let inCodeBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track fenced code block boundaries
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^(#{1,3})\s+(.+)$/)
    if (!match) continue

    const level = match[1].length
    const rawText = match[2]
    const cleanText = stripInlineMarkdown(rawText)
    if (!cleanText) continue

    const slug = slugify(cleanText)

    headings.push({
      level,
      text: cleanText,
      rawText,
      slug,
      line: i,
      id: null  // assigned after dedup
    })
  }

  // Assign deduplicated IDs
  const slugCounts = {}
  for (const h of headings) {
    const count = slugCounts[h.slug] || 0
    slugCounts[h.slug] = count + 1
    h.id = count === 0 ? h.slug : `${h.slug}-${count + 1}`
  }

  return headings
}
