<template>
  <div class="ai-input-bar">
    <el-input
      v-model="inputText"
      placeholder="Ask about the article..."
      @keyup.enter="send"
      :disabled="aiChat.isStreaming"
      clearable
    >
      <template #append>
        <VoiceButton
          :disabled="aiChat.isStreaming"
          @result="onVoiceResult"
        />
      </template>
    </el-input>
    <el-button
      type="primary"
      :disabled="!inputText.trim() || aiChat.isStreaming"
      @click="send"
      size="small"
    >
      Send
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAiChatStore } from '../../stores/aiChat.js'
import VoiceButton from '../voice/VoiceButton.vue'

const aiChat = useAiChatStore()
const inputText = ref('')

function send() {
  const text = inputText.value.trim()
  if (!text) return
  aiChat.addMessage('user', text)
  inputText.value = ''
}

function onVoiceResult(text) {
  inputText.value = text
}
</script>

<style scoped>
.ai-input-bar {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--color-border);
}
</style>
