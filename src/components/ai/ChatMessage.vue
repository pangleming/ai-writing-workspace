<template>
  <div class="chat-message" :class="message.role">
    <div class="message-avatar">
      {{ message.role === 'user' ? '🧑' : '🤖' }}
    </div>
    <div class="message-body">
      <div class="message-content" v-html="renderedContent"></div>
      <div class="message-footer">
        <span class="message-time">{{ message.time }}</span>
        <el-button
          v-if="message.role === 'assistant'"
          size="small"
          text
          @click="copyContent"
        >
          📋
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'

const props = defineProps({
  message: { type: Object, required: true }
})

function copyContent() {
  navigator.clipboard.writeText(props.message.content)
  ElMessage.success('Copied')
}

const renderedContent = computed(() => {
  if (props.message.role === 'user') return props.message.content
  return marked.parse(props.message.content, { breaks: true })
})
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 10px;
  padding: 12px 0;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.message-body {
  max-width: 80%;
}

.chat-message.user .message-body {
  text-align: right;
}

.message-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg);
  padding: 10px 14px;
  border-radius: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-message.user .message-content {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.message-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 0 4px;
}

.chat-message.user .message-footer {
  justify-content: flex-end;
}

.message-time {
  font-size: 11px;
  color: var(--color-text-secondary);
}
</style>
