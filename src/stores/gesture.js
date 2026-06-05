import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

// ─────────────────────────────────────────────
// 手势功能映射
//
//  Open Palm    → 调出 / 关闭 AI 助手
//  Index Finger → 向上滚动
//  Scissor      → 向下滚动
//  Fist         → 调出 / 关闭语音识别
// ─────────────────────────────────────────────

const COOLDOWNS = {
  'Open Palm':    2000,  // 召唤/关闭 AI，防误触
  'Index Finger':  600,  // 滚动，冷却短一些保持连续感
  'Scissor':       600,  // 滚动，同上
  'Fist':         2000   // 语音开关，防误触
}

const HOLD_TIMES = {
  'Open Palm':    700,  // 需要稳定张开手掌再触发
  'Index Finger':   0,  // 瞬态：检测到即触发，靠 cooldown 防重复
  'Scissor':        0,  // 瞬态：同上
  'Fist':         600   // 需要稳定握拳再触发，防误触
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
      // 手势切换时重置该手势的计时器
      if (prev !== name) {
        gestureStartTime[name] = now
      }

      const requiredHold = HOLD_TIMES[name] ?? 500

      // hold = 0 的瞬态手势直接进入 cooldown 判断
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