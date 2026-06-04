const ERROR_MESSAGES = {
  'not-allowed': 'Microphone permission denied. Allow mic access in browser settings.',
  'service-not-allowed': 'Speech recognition is blocked (needs HTTPS or localhost).',
  network: 'Speech recognition could not reach the server. Chrome uses Google STT — check network or VPN.',
  'audio-capture': 'No microphone found or it is in use by another app.',
  'language-not-supported': 'Selected language is not supported for speech recognition.',
  aborted: null,
  'no-speech': null
}

export function isSpeechSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

function isAppleBrowser() {
  return /Apple/.test(navigator.vendor)
}

export function createRecognition(lang = 'zh-CN') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return null

  const rec = new SpeechRecognition()
  // Safari mishandles continuous=true; Chrome needs onend restart when true
  rec.continuous = !isAppleBrowser()
  rec.interimResults = true
  rec.lang = lang
  rec.maxAlternatives = 1
  return rec
}

export function getSpeechErrorMessage(errorCode) {
  return ERROR_MESSAGES[errorCode] ?? `Speech recognition error: ${errorCode}`
}

export function detectLanguage(text) {
  const hasChinese = /[一-鿿]/.test(text)
  const hasEnglish = /[a-zA-Z]/.test(text)
  if (hasChinese && !hasEnglish) return 'zh-CN'
  if (hasEnglish && !hasChinese) return 'en-US'
  return 'zh-CN'
}

/**
 * Manages a speech session with safe stop/restart (new instance + delay on onend).
 */
export function createSpeechSession({ getLang, onFinal, onInterim, onError, onListeningChange }) {
  let recognition = null
  let shouldRun = false
  let restartTimer = null

  function clearRestartTimer() {
    if (restartTimer != null) {
      clearTimeout(restartTimer)
      restartTimer = null
    }
  }

  function attachHandlers(rec) {
    rec.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0]?.transcript
        if (!transcript?.trim()) continue
        if (result.isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      if (final.trim()) onFinal?.(final.trim())
      if (interim.trim()) onInterim?.(interim.trim())
    }

    rec.onerror = (event) => {
      const code = event.error
      if (code === 'no-speech' || code === 'aborted') return

      const message = getSpeechErrorMessage(code)
      if (message) onError?.(message, code)

      if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'network') {
        stop()
      }
    }

    rec.onend = () => {
      recognition = null
      if (!shouldRun) return
      clearRestartTimer()
      restartTimer = window.setTimeout(() => spawn(), 250)
    }
  }

  function spawn() {
    if (!shouldRun) return
    clearRestartTimer()

    const lang = getLang()
    const rec = createRecognition(lang)
    if (!rec) {
      onError?.('Speech recognition is not supported in this browser.', 'unsupported')
      stop()
      return
    }

    attachHandlers(rec)

    try {
      rec.start()
      recognition = rec
    } catch {
      if (shouldRun) {
        restartTimer = window.setTimeout(() => spawn(), 500)
      }
    }
  }

  function start() {
    if (shouldRun) return
    shouldRun = true
    onListeningChange?.(true)
    spawn()
  }

  function stop() {
    shouldRun = false
    clearRestartTimer()
    onListeningChange?.(false)

    const rec = recognition
    recognition = null
    if (rec) {
      try {
        rec.onend = null
        rec.stop()
      } catch {
        /* already stopped */
      }
    }
  }

  function toggle() {
    if (shouldRun) stop()
    else start()
  }

  return { start, stop, toggle, isRunning: () => shouldRun }
}

export function destroyRecognition(rec) {
  if (rec) {
    try {
      rec.onend = null
      rec.stop()
    } catch {
      /* already stopped */
    }
  }
}
