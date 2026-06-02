<template>
  <div class="ai-sidebar">
    <div class="sidebar-header">
      <h3>🤖 AI Assistant</h3>
      <span class="context-badge" v-if="articleLength > 0">
        📄 {{ articleLength }} chars
      </span>
      <el-button size="small" text @click="aiChat.clearHistory" title="Clear chat">
        🗑
      </el-button>
      <el-button size="small" text @click="aiChat.closeSidebar" title="Close">
        ✕
      </el-button>
    </div>

    <div class="messages-container" ref="messagesRef">
      <ChatMessage
        v-for="(msg, i) in aiChat.messages"
        :key="i"
        :message="msg"
      />
      <div v-if="aiChat.messages.length === 0" class="empty-chat">
        <p>Ask questions about your article.</p>
        <p class="hint">Select text in the editor to get AI help.</p>
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
import { useEditorStore } from '../../stores/editor.js'
import ChatMessage from './ChatMessage.vue'
import AiInputBar from './AiInputBar.vue'

const aiChat = useAiChatStore()
const editor = useEditorStore()
const messagesRef = ref(null)

const articleLength = computed(() => editor.fullText().length)

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

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-header h3 {
  font-size: 15px;
  font-weight: 600;
  flex: 1;
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
