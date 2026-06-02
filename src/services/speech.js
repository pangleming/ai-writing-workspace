let recognition = null

export function isSpeechSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function createRecognition(lang = 'zh-CN') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return null

  const rec = new SpeechRecognition()
  rec.continuous = true
  rec.interimResults = true
  rec.lang = lang
  return rec
}

export function detectLanguage(text) {
  const hasChinese = /[一-鿿]/.test(text)
  const hasEnglish = /[a-zA-Z]/.test(text)
  if (hasChinese && !hasEnglish) return 'zh-CN'
  if (hasEnglish && !hasChinese) return 'en-US'
  return 'zh-CN'
}

export function destroyRecognition(rec) {
  if (rec) {
    try { rec.stop() } catch (e) { /* already stopped */ }
  }
}
