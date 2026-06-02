import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

const COOLDOWNS = {
  'Open Palm': 2000,
  'Scissor': 1000,
  'Index Finger': 1000,
  'Fist': 2000,
  'Rock Gesture': 2000
}

const HOLD_TIMES = {
  'Open Palm': 1000,
  'Scissor': 500,
  'Index Finger': 500,
  'Fist': 500,
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
      if (prev !== name) {
        gestureStartTime[name] = now
      }

      const elapsed = now - (gestureStartTime[name] || now)
      const requiredHold = HOLD_TIMES[name] || 500

      if (elapsed >= requiredHold) {
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
