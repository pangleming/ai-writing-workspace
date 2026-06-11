<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="selection-toolbar"
      :style="{ top: y + 'px', left: x + 'px' }"
    >
      <span class="selected-preview">{{ truncatedText }}</span>
      <div class="toolbar-buttons">
        <el-button size="small" @click.stop="emit('explain')" title="Explain the selected text">
          💡 Explain
        </el-button>
        <el-button size="small" @click.stop="emit('polish')" title="Polish and improve writing">
          ✨ Polish
        </el-button>
        <el-button size="small" @click.stop="emit('expand')" title="Expand with more detail">
          📝 Expand
        </el-button>
        <el-button size="small" type="success" @click.stop="emit('summarize')" title="Summarize concisely">
          📋 Summarize
        </el-button>
        <el-button size="small" type="warning" @click.stop="emit('academic')" title="Rewrite in academic style">
          🎓 Academic
        </el-button>
        <el-button size="small" type="info" @click.stop="emit('translate')" title="Translate selected text">
          🌐 Translate
        </el-button>
        <el-button size="small" @click.stop="emit('ask')" title="Ask a question about this text">
          ❓ Ask...
        </el-button>
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

const emit = defineEmits([
  'explain', 'polish', 'expand', 'summarize', 'academic', 'translate', 'ask'
])

const truncatedText = computed(() => {
  if (!props.text) return ''
  if (props.text.length <= 60) return `"${props.text}"`
  return `"${props.text.slice(0, 60)}..."`
})
</script>

<style scoped>
.selection-toolbar {
  position: fixed;
  z-index: 1000;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e5e5);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 8px 10px;
  transform: translateX(-50%) translateY(-100%);
  margin-top: -12px;
  max-width: 520px;
}

.selected-preview {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary, #666);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
