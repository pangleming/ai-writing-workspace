<template>
  <div
    class="gesture-indicator"
    :class="{ active: gesture.isActive, minimized: minimized }"
    @click="emit('toggle')"
    :title="gesture.currentGesture"
  >
    <span v-if="minimized" class="indicator-icon">
      {{ gesture.isActive ? '🖐' : '🖐️' }}
    </span>
    <span v-else class="indicator-text">
      {{ displayLabel }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGestureStore } from '../../stores/gesture.js'

defineProps({
  minimized: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle'])

const gesture = useGestureStore()

// 手势 → 功能说明（与 GestureOverlay 保持一致）
const GESTURE_LABELS = {
  'Open Palm':    '✋ AI 助手',
  'Index Finger': '☝️ 向上滚动',
  'Scissor':      '✌️ 向下滚动',
  'Fist':         '✊ 语音识别'
}

const displayLabel = computed(() =>
  GESTURE_LABELS[gesture.currentGesture] ?? gesture.currentGesture
)
</script>

<style scoped>
.gesture-indicator {
  position: fixed;
  bottom: 80px;
  left: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 900;
  transition: all var(--transition-normal);
}

.gesture-indicator.active {
  border-color: #16a34a;
  background: #f0fdf4;
}

.gesture-indicator.minimized {
  padding: 8px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.indicator-icon {
  font-size: 18px;
}

.indicator-text {
  font-weight: 500;
  color: var(--color-text);
}

.gesture-indicator.active .indicator-text {
  color: #16a34a;
}
</style>