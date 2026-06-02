import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAiChatStore = defineStore('aiChat', () => {
  const messages = ref([])
  const sidebarOpen = ref(false)
  const isStreaming = ref(false)

  function addMessage(role, content) {
    messages.value.push({
      role,
      content,
      time: new Date().toLocaleTimeString()
    })
    return messages.value.length - 1
  }

  function updateLastAssistantMessage(chunk) {
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'assistant') {
      last.content += chunk
    }
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function openSidebar() {
    sidebarOpen.value = true
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  function clearHistory() {
    messages.value = []
  }

  return {
    messages, sidebarOpen, isStreaming,
    addMessage, updateLastAssistantMessage,
    toggleSidebar, openSidebar, closeSidebar,
    clearHistory
  }
})
