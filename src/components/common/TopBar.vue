<template>
  <div class="topbar">
    <div class="topbar-left">
      <span class="topbar-logo">📝 AI Workspace</span>
    </div>

    <div class="topbar-center">
      <span
        v-if="gesture.isActive"
        class="gesture-status"
        :class="{ active: gesture.currentGesture !== 'No Hand Detected' }"
      >
        Gesture: {{ gesture.currentGesture }}
      </span>
    </div>

    <div class="topbar-right">
      <el-button
        size="small"
        :type="aiChat.sidebarOpen ? 'primary' : 'default'"
        @click="aiChat.toggleSidebar()"
        title="Toggle AI Assistant"
      >
        🤖 AI
      </el-button>

      <el-button
        v-if="gesture.isActive"
        :type="config.gestureEnabled ? 'success' : 'info'"
        size="small"
        circle
        @click="config.gestureEnabled = !config.gestureEnabled"
        :title="config.gestureEnabled ? 'Gesture: ON' : 'Gesture: OFF'"
      >
        🖐
      </el-button>

      <el-button size="small" circle @click="settingsVisible = true" title="Settings">
        ⚙️
      </el-button>
    </div>

    <SettingsModal v-model:visible="settingsVisible" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useConfigStore } from '../../stores/config.js'
import { useGestureStore } from '../../stores/gesture.js'
import { useAiChatStore } from '../../stores/aiChat.js'
import SettingsModal from './SettingsModal.vue'

const config = useConfigStore()
const gesture = useGestureStore()
const aiChat = useAiChatStore()
const settingsVisible = ref(false)
</script>

<style scoped>
.topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-logo {
  font-weight: 600;
  font-size: 15px;
  color: var(--color-text);
}

.gesture-status {
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: 2px 10px;
  border-radius: 12px;
  background: var(--color-bg);
}

.gesture-status.active {
  color: #16a34a;
  background: #f0fdf4;
}

.topbar-right {
  display: flex;
  gap: 8px;
}
</style>
