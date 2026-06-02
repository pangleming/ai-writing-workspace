<template>
  <div class="workspace-layout">
    <header class="workspace-top">
      <slot name="top" />
    </header>

    <main class="workspace-main">
      <div class="workspace-editor">
        <slot name="editor" />
      </div>
      <transition name="slide">
        <aside v-if="aiChat.sidebarOpen" class="workspace-sidebar">
          <slot name="sidebar" />
        </aside>
      </transition>
    </main>

    <footer class="workspace-bottom">
      <slot name="bottom" />
    </footer>
  </div>
</template>

<script setup>
import { useAiChatStore } from '../../stores/aiChat.js'
const aiChat = useAiChatStore()
</script>

<style scoped>
.workspace-layout {
  display: grid;
  grid-template-rows: var(--topbar-height) 1fr var(--bottombar-height);
  height: 100vh;
  overflow: hidden;
}

.workspace-top {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.workspace-main {
  display: flex;
  overflow: hidden;
}

.workspace-editor {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.workspace-sidebar {
  width: var(--sidebar-width);
  min-width: 300px;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
  overflow-y: auto;
  flex-shrink: 0;
}

.workspace-bottom {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
}
</style>
