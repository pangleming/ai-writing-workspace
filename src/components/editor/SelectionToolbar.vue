<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="selection-toolbar"
      :style="{ top: y + 'px', left: x + 'px' }"
    >
      <span class="selected-preview">{{ truncatedText }}</span>
      <div class="toolbar-buttons">
        <el-button size="small" @click="emit('explain')">💡 Explain</el-button>
        <el-button size="small" @click="emit('polish')">✨ Polish</el-button>
        <el-button size="small" @click="emit('expand')">📝 Expand</el-button>
        <el-button size="small" @click="emit('ask')">❓ Ask...</el-button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  text: { type: String, default: '' },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 }
})

const emit = defineEmits(['explain', 'polish', 'expand', 'ask'])

const truncatedText = computed(() => {
  if (props.text.length <= 60) return `"${props.text}"`
  return `"${props.text.slice(0, 60)}..."`
})
</script>

<style scoped>
.selection-toolbar {
  position: fixed;
  z-index: 1000;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;
  transform: translateX(-50%) translateY(-100%);
  margin-top: -12px;
  max-width: 400px;
}

.selected-preview {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-buttons {
  display: flex;
  gap: 4px;
}
</style>
