<template>
  <div v-if="!config.gestureEnabled" />

  <template v-else>
    <GestureIndicator
      v-if="minimized"
      :minimized="true"
      @toggle="minimized = false"
    />

    <div
      v-else
      class="gesture-overlay"
      ref="overlayRef"
      :style="overlayStyle"
    >
      <div class="overlay-header" @mousedown="startDrag">
        <span class="overlay-title">📷 Gesture</span>
        <div class="overlay-controls">
          <el-button size="small" text @click="minimized = true" title="Minimize">
            ─
          </el-button>
          <el-button size="small" text @click="config.gestureEnabled = false" title="Close">
            ✕
          </el-button>
        </div>
      </div>

      <div class="camera-container">
        <video ref="videoRef" autoplay playsinline class="camera-feed" />

        <div v-if="cameraError" class="camera-error">
          <p>⚠️ {{ cameraError }}</p>
          <el-button size="small" @click="requestCamera">
            Retry
          </el-button>
        </div>
      </div>

      <div class="overlay-gestures">
        <span
          v-for="g in gestures"
          :key="g"
          class="gesture-tag"
          :class="{ highlighted: gesture.currentGesture === g }"
        >
          {{ g }}
        </span>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { useConfigStore } from '../../stores/config.js'
import { useGestureStore } from '../../stores/gesture.js'
import { useAiChatStore } from '../../stores/aiChat.js'
import { GestureDetector } from '../../services/gestureDetector.js'
import GestureIndicator from './GestureIndicator.vue'

const config = useConfigStore()
const gesture = useGestureStore()
const aiChat = useAiChatStore()

const minimized = ref(false)
const cameraError = ref('')
const videoRef = ref(null)
const overlayRef = ref(null)

const gestures = ['Open Palm', 'Scissor', 'Index Finger', 'Fist', 'Rock Gesture']

const dragPos = reactive({ x: 20, y: 96 })
const dragging = ref(false)
const dragStart = reactive({ x: 0, y: 0 })

const overlayStyle = computed(() => ({
  position: 'fixed',
  bottom: dragPos.y + 'px',
  left: dragPos.x + 'px'
}))

let detector = null
let stream = null

function startDrag(e) {
  dragging.value = true
  dragStart.x = e.clientX - dragPos.x
  dragStart.y = e.clientY - dragPos.y
}

function onDrag(e) {
  if (!dragging.value) return
  dragPos.x = Math.min(window.innerWidth - 260, Math.max(0, e.clientX - dragStart.x))
  dragPos.y = Math.min(window.innerHeight - 120, Math.max(60, e.clientY - dragStart.y))
}

function stopDrag() {
  dragging.value = false
}

function handleGestureAction(name) {
  switch (name) {
    case 'Open Palm':
      aiChat.toggleSidebar()
      break
    case 'Scissor':
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })
      break
    case 'Index Finger':
      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' })
      break
    case 'Fist':
      window.dispatchEvent(new CustomEvent('gesture-toggle-voice'))
      break
    case 'Rock Gesture':
      window.dispatchEvent(new CustomEvent('gesture-switch-focus'))
      break
  }
}

async function requestCamera() {
  try {
    cameraError.value = ''
    stream = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()

      gesture.setActive(true)

      detector = new GestureDetector((gestureName) => {
        const triggered = gesture.updateGesture(gestureName)
        if (triggered) handleGestureAction(triggered)
      })

      await detector.start(videoRef.value)
    }
  } catch (e) {
    console.error('Camera error details:', e.name, e.message)
    if (e.name === 'NotAllowedError') {
      cameraError.value = 'Camera permission denied. Click the camera icon in the address bar and set to Allow, then refresh.'
    } else if (e.name === 'NotFoundError') {
      cameraError.value = 'No camera found. Please connect a camera and try again.'
    } else if (e.name === 'NotReadableError') {
      cameraError.value = 'Camera is in use by another app. Please close other apps using the camera.'
    } else {
      cameraError.value = `Camera error: ${e.message}`
    }
    gesture.setActive(false)
  }
}

watch(() => config.gestureEnabled, async (enabled) => {
  if (enabled) {
    await requestCamera()
  } else {
    if (detector) detector.stop()
    if (stream) stream.getTracks().forEach(t => t.stop())
    gesture.setActive(false)
    gesture.updateGesture('No Hand Detected')
  }
})

onMounted(() => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  if (config.gestureEnabled) requestCamera()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  if (detector) detector.stop()
  if (stream) stream.getTracks().forEach(t => t.stop())
})
</script>

<style scoped>
.gesture-overlay {
  z-index: 900;
  width: 240px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.overlay-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: move;
  border-bottom: 1px solid var(--color-border);
  user-select: none;
}

.overlay-title {
  font-size: 12px;
  font-weight: 600;
  flex: 1;
}

.overlay-controls {
  display: flex;
  gap: 2px;
}

.camera-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #000;
}

.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.camera-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  text-align: center;
  padding: 16px;
  gap: 8px;
}

.overlay-gestures {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
}

.gesture-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

.gesture-tag.highlighted {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}
</style>
