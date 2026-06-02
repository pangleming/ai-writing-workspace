import { defineStore } from 'pinia'
import { ref } from 'vue'

let nextId = 1

export const useEditorStore = defineStore('editor', () => {
  const paragraphs = ref([])
  const activeParagraphId = ref(null)

  function addParagraph(text) {
    const id = nextId++
    paragraphs.value.push({
      id,
      text,
      translation: null,
      translating: false
    })
    return id
  }

  function updateParagraph(id, text) {
    const p = paragraphs.value.find(p => p.id === id)
    if (p) {
      p.text = text
      p.translation = null
    }
  }

  function removeParagraph(id) {
    const idx = paragraphs.value.findIndex(p => p.id === id)
    if (idx !== -1) paragraphs.value.splice(idx, 1)
  }

  function setTranslation(id, translatedText) {
    const p = paragraphs.value.find(p => p.id === id)
    if (p) {
      p.translation = translatedText
      p.translating = false
    }
  }

  function setTranslating(id, val) {
    const p = paragraphs.value.find(p => p.id === id)
    if (p) p.translating = val
  }

  function setActiveParagraph(id) {
    activeParagraphId.value = id
  }

  function pasteArticle(text) {
    const lines = text.split('\n').filter(l => l.trim())
    lines.forEach(line => addParagraph(line.trim()))
  }

  const fullText = () => paragraphs.value.map(p => p.text).join('\n\n')

  return {
    paragraphs, activeParagraphId,
    addParagraph, updateParagraph, removeParagraph,
    setTranslation, setTranslating, setActiveParagraph,
    pasteArticle, fullText
  }
})
