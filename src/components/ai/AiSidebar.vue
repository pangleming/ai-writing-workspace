<template>
  <div class="ai-sidebar">
    <div class="sidebar-toolbar">
      <span class="context-badge" v-if="contextLength > 0">
        📄 {{ contextLength }} chars
      </span>
      <el-button size="small" text @click="aiChat.clearHistory" title="Clear chat">🗑</el-button>
    </div>

    <div class="messages-container" ref="messagesRef">
      <ChatMessage
        v-for="(msg, i) in aiChat.messages"
        :key="i"
        :message="msg"
      />
      <div v-if="aiChat.messages.length === 0" class="empty-chat">
        <p>Ask questions about your document.</p>
        <p class="hint">Select text in the editor to get AI help — explain, polish, expand, summarize, translate, or make academic.</p>
      </div>
      <div v-if="aiChat.isStreaming" class="streaming-indicator">
        <span class="loading-icon">⟳</span>
        AI is thinking...
      </div>
    </div>

    <AiInputBar />
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useAiChatStore } from '../../stores/aiChat.js'
import { useDocumentStore } from '../../stores/document.js'
import ChatMessage from './ChatMessage.vue'
import AiInputBar from './AiInputBar.vue'

const aiChat = useAiChatStore()
const doc = useDocumentStore()
const messagesRef = ref(null)

const contextLength = computed(() => doc.activeMarkdown.length)

watch(() => aiChat.messages.length, async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
})
</script>

<style scoped>
.ai-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
}

.context-badge {
  font-size: 11px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: 10px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.empty-chat {
  text-align: center;
  padding: 40px 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.empty-chat .hint {
  font-size: 12px;
  margin-top: 8px;
  color: #999;
  line-height: 1.5;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
