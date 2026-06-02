<template>
  <el-button
    :type="isListening ? 'danger' : 'default'"
    :disabled="!supported || disabled"
    :title="!supported ? 'Speech recognition not supported in this browser' : 'Voice input'"
    @click="toggle"
    circle
  >
    {{ isListening ? '🛑' : '🎤' }}
  </el-button>
</template>

<script setup>
import { ref } from 'vue'
import { isSpeechSupported, createRecognition, destroyRecognition, detectLanguage } from '../../services/speech.js'
import { useConfigStore } from '../../stores/config.js'

const props = defineProps({
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['result', 'interim', 'listening'])

const supported = isSpeechSupported()
const isListening = ref(false)
let recognition = null

const config = useConfigStore()

function getLang() {
  if (config.voiceLanguage === 'auto') return detectLanguage('')
  if (config.voiceLanguage === 'zh') return 'zh-CN'
  return 'en-US'
}

function toggle() {
  if (isListening.value) {
    stopListening()
  } else {
    startListening()
  }
}

function startListening() {
  recognition = createRecognition(getLang())
  if (!recognition) return

  recognition.onresult = (event) => {
    let interim = ''
    let final = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        final += transcript
      } else {
        interim += transcript
      }
    }
    if (final) emit('result', final)
    if (interim) emit('interim', interim)
  }

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed') {
      console.error('Microphone access denied')
    }
    stopListening()
  }

  recognition.onend = () => {
    if (isListening.value) {
      recognition?.start()
    }
  }

  recognition.start()
  isListening.value = true
  emit('listening', true)
}

function stopListening() {
  destroyRecognition(recognition)
  recognition = null
  isListening.value = false
  emit('listening', false)
}
</script>
