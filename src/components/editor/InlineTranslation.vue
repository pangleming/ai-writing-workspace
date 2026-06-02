<template>
  <transition name="expand">
    <div v-if="visible" class="inline-translation">
      <div class="translation-content">
        <div v-if="translating" class="translating-indicator">
          <span class="loading-icon">⟳</span>
          Translating...
        </div>
        <p v-else>{{ translation }}</p>
      </div>
      <div v-if="!translating && translation" class="translation-actions">
        <el-button size="small" text @click="emit('copy')">📋 Copy</el-button>
        <el-button size="small" text @click="emit('sendToAi')">📤 Ask AI</el-button>
        <el-button size="small" text @click="emit('collapse')">🔼 Collapse</el-button>
      </div>
      <div v-if="error" class="translation-error">
        {{ error }}
        <el-button size="small" text type="primary" @click="emit('retry')">Retry</el-button>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  translation: { type: String, default: '' },
  translating: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['copy', 'sendToAi', 'collapse', 'retry'])
</script>

<style scoped>
.inline-translation {
  margin-top: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid var(--color-primary);
}

.translation-content {
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.6;
}

.translation-content p {
  margin: 0;
}

.translating-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
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

.translation-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.translation-error {
  color: #dc2626;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
