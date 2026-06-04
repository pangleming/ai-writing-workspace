<template>
  <div class="bottom-bar">
    <el-button size="small" @click="editor.addParagraph('')" title="New paragraph">
      + New
    </el-button>
    <el-button size="small" @click="pasteArticle" title="Paste article">
      📎 Paste
    </el-button>

    <el-input
      v-model="inputText"
      placeholder="Type and press Enter to add a paragraph..."
      @keyup.enter="addFromInput"
      class="bottom-input"
      clearable
    >
      <template #append>
        <VoiceButton
          ref="voiceButtonRef"
          @result="onVoiceResult"
          @interim="onVoiceInterim"
        />
      </template>
    </el-input>

    <el-button size="small" @click="addFromInput" :disabled="!inputText.trim()">
      Add
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../../stores/editor.js'
import VoiceButton from '../voice/VoiceButton.vue'

const editor = useEditorStore()
const inputText = ref('')
const voiceButtonRef = ref(null)

function addFromInput() {
  const text = inputText.value.trim()
  if (!text) return
  editor.addParagraph(text)
  inputText.value = ''
}

function onVoiceResult(text) {
  if (!text) return
  editor.addParagraph(text)
  inputText.value = ''
}

function onVoiceInterim(text) {
  inputText.value = text
}

async function pasteArticle() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) editor.pasteArticle(text)
  } catch (e) {
    console.error('Clipboard read failed:', e)
  }
}

function onGestureToggleVoice() {
  voiceButtonRef.value?.toggle()
}

onMounted(() => {
  window.addEventListener('gesture-toggle-voice', onGestureToggleVoice)
})

onUnmounted(() => {
  window.removeEventListener('gesture-toggle-voice', onGestureToggleVoice)
})
</script>

<style scoped>
.bottom-bar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.bottom-input {
  flex: 1;
}
</style>
