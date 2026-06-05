import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

// ─────────────────────────────────────────────
// 手势功能映射（供 UI 展示与业务逻辑参考）
//
//  Open Palm      → 召唤 AI 助手（打开侧栏）
//  Open Palm Up   → 向上滚动
//  Open Palm Down → 向下滚动
//  Index Finger   → 选择 / 切换当前段落
//  Fist           → 关闭 AI 助手（收起侧栏）
//  Scissor        → AI 分析当前段落
//  Rock Gesture   → 开启 / 关闭语音输入
// ─────────────────────────────────────────────

const COOLDOWNS = {
  'Open Palm': 2000,
  'Scissor': 1200,
  'Index Finger': 800,
  'Fist': 2000,
  'Rock Gesture': 2000
}

const HOLD_TIMES = {
  'Open Palm': 800,
  'Scissor': 400,
  'Index Finger': 400,
  'Fist': 600,
  'Rock Gesture': 500
}

export const useGestureStore = defineStore('gesture', () => {
  const currentGesture = ref('No Hand Detected')
  const isActive = ref(false)
  const lastTriggered = reactive({})
  const gestureStartTime = reactive({})

  function updateGesture(name) {
    const prev = currentGesture.value
    currentGesture.value = name

    const now = Date.now()

    if (name !== 'No Hand Detected') {
      // 仅在手势真正切换时重置计时器
      // 注意：Open Palm Up/Down 是 Open Palm 的动态变体，切换时也需要重置
      if (prev !== name) {
        gestureStartTime[name] = now
      }

      const requiredHold = HOLD_TIMES[name] ?? 500

      // 瞬态手势（hold = 0）：跳过持续时间检查，直接进入 cooldown 判断
      const holdOk = requiredHold === 0
        ? true
        : (now - (gestureStartTime[name] || now)) >= requiredHold

      if (holdOk) {
        const lastTime = lastTriggered[name] || 0
        const cooldown = COOLDOWNS[name] || 2000

        if (now - lastTime >= cooldown) {
          lastTriggered[name] = now
          return name
        }
      }
    } else {
      Object.keys(gestureStartTime).forEach(k => delete gestureStartTime[k])
    }

    return null
  }

  function setActive(val) {
    isActive.value = val
  }

  return { currentGesture, isActive, updateGesture, setActive }
})