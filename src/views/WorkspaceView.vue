<template>
  <WorkspaceLayout>
    <template #top>
      <TopBar />
    </template>

    <template #editor>
      <MainEditor />
    </template>

    <template #sidebar>
      <AiSidebar />
    </template>

    <template #bottom>
      <BottomBar />
    </template>
  </WorkspaceLayout>
  <GestureOverlay />
</template>

<script setup>
import { watch } from 'vue'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.vue'
import TopBar from '../components/common/TopBar.vue'
import MainEditor from '../components/editor/MainEditor.vue'
import AiSidebar from '../components/ai/AiSidebar.vue'
import BottomBar from '../components/common/BottomBar.vue'
import GestureOverlay from '../components/gesture/GestureOverlay.vue'
import { useAiChatStore } from '../stores/aiChat.js'
import { useEditorStore } from '../stores/editor.js'
import { useConfigStore } from '../stores/config.js'
import { sendMessage, streamResponse } from '../services/aiWriter.js'

const aiChat = useAiChatStore()
const editor = useEditorStore()
const config = useConfigStore()

watch(() => aiChat.messages.length, async (newLen, oldLen) => {
  if (newLen === 0 || newLen <= oldLen) return
  const lastMsg = aiChat.messages[aiChat.messages.length - 1]
  if (lastMsg.role !== 'user') return

  try {
    aiChat.isStreaming = true
    aiChat.addMessage('assistant', '')

    const apiMessages = aiChat.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(0, -1)
      .map(m => ({ role: m.role, content: m.content }))

    const reader = await sendMessage(apiMessages, config.deepseekApiKey, editor.fullText())
    for await (const chunk of streamResponse(reader)) {
      aiChat.updateLastAssistantMessage(chunk)
    }
  } catch (e) {
    aiChat.updateLastAssistantMessage(`\n\nError: ${e.message}`)
  } finally {
    aiChat.isStreaming = false
  }
})
</script>

<style scoped>
</style>
