<template>
  <div class="document-outline">
    <div v-if="headings.length === 0" class="outline-empty">
      <p class="empty-hint">No headings found.</p>
    </div>
    <div v-else class="outline-list">
      <div
        v-for="h in headings" :key="h.id"
        class="outline-item"
        :class="[`outline-level-${h.level}`, { active: h.id === activeHeadingId }]"
        :style="{ paddingLeft: (h.level * 12 + 4) + 'px' }"
        @click="$emit('navigate-heading', h.id)"
        :title="h.text"
      >
        {{ h.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, nextTick } from 'vue'
import { useDocumentStore } from '../../stores/document.js'
import { parseHeadings } from '../../services/headings.js'

const props = defineProps({
  activeHeadingId: { type: String, default: null }
})

defineEmits(['navigate-heading'])

const doc = useDocumentStore()

const headings = computed(() => {
  return parseHeadings(doc.activeMarkdown)
})

// Keep active outline item visible
watch(() => props.activeHeadingId, (id) => {
  if (!id) return
  nextTick(() => {
    const el = document.querySelector(`.outline-item.active`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
})
</script>

<style scoped>
.document-outline { padding: 6px 8px; }

.outline-empty {
  text-align: center; padding: 16px 8px;
  color: var(--color-text-secondary, #666); font-size: 12px;
}

.outline-list {
  border-left: 2px solid var(--color-border, #e5e5e5);
  padding: 2px 0;
}

.outline-item {
  font-size: 12px; line-height: 1.7; cursor: pointer;
  color: var(--color-text-secondary, #666);
  padding: 2px 0; border-radius: 3px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color 0.15s, background 0.15s;
  border-left: 2px solid transparent;
}
.outline-item:hover {
  color: var(--color-primary, #4f46e5);
  background: rgba(79, 70, 229, 0.05);
}
.outline-item.active {
  color: var(--color-primary, #4f46e5);
  background: rgba(79, 70, 229, 0.10);
  font-weight: 600;
  border-left-color: var(--color-primary, #4f46e5);
}
.outline-level-1 { font-weight: 600; color: var(--color-text, #1a1a1a); }
.outline-level-2 { font-weight: 500; }
</style>
