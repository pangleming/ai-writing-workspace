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
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  isSpeechSupported,
  createSpeechSession,
  detectLanguage
} from '../../services/speech.js'
import { useConfigStore } from '../../stores/config.js'

const props = defineProps({
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['result', 'interim', 'listening', 'error'])

const supported = isSpeechSupported()
const isListening = ref(false)
const config = useConfigStore()

function getLang() {
  if (config.voiceLanguage === 'auto') return detectLanguage('')
  if (config.voiceLanguage === 'zh') return 'zh-CN'
  return 'en-US'
}

const session = createSpeechSession({
  getLang,
  onFinal: (text) => emit('result', text),
  onInterim: (text) => emit('interim', text),
  onError: (message) => {
    emit('error', message)
    ElMessage.warning({ message, duration: 5000, showClose: true })
  },
  onListeningChange: (listening) => {
    isListening.value = listening
    emit('listening', listening)
  }
})

function toggle() {
  session.toggle()
}

onUnmounted(() => {
  session.stop()
})

defineExpose({ toggle, isListening })
</script>
