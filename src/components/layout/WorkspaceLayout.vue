<template>
  <div class="workspace-layout">
    <header class="workspace-top">
      <slot name="top" />
    </header>

    <div class="workspace-body">
      <!-- Documents Panel -->
      <aside
        class="panel documents-panel"
        :class="{ collapsed: !layout.documentsOpen }"
        :style="{ width: layout.documentsOpen ? layout.documentsWidth + 'px' : '44px' }"
      >
        <div class="panel-header">
          <span v-if="layout.documentsOpen" class="panel-title">Documents</span>
          <button class="panel-toggle" @click="layout.toggleDocuments()"
            :title="layout.documentsOpen ? 'Collapse' : 'Expand documents'">
            {{ layout.documentsOpen ? '◀' : '▶' }}
          </button>
        </div>
        <div v-show="layout.documentsOpen" class="panel-body">
          <slot name="left" />
        </div>
      </aside>

      <!-- Splitter: Documents | Outline -->
      <div
        v-if="layout.documentsOpen && layout.outlineOpen"
        class="splitter"
        @mousedown="startDrag('documents', $event)"
      ></div>

      <!-- Outline Panel -->
      <aside
        class="panel outline-panel"
        :class="{ collapsed: !layout.outlineOpen }"
        :style="{ width: layout.outlineOpen ? layout.outlineWidth + 'px' : '36px' }"
      >
        <div class="panel-header">
          <span v-if="layout.outlineOpen" class="panel-title">Outline</span>
          <button class="panel-toggle" @click="layout.toggleOutline()"
            :title="layout.outlineOpen ? 'Collapse' : 'Expand outline'">
            {{ layout.outlineOpen ? '◀' : '▶' }}
          </button>
        </div>
        <div v-show="layout.outlineOpen" class="panel-body">
          <slot name="outline" />
        </div>
      </aside>

      <!-- Splitter: Outline | Editor -->
      <div
        v-if="layout.outlineOpen"
        class="splitter"
        @mousedown="startDrag('outline', $event)"
      ></div>

      <!-- Editor -->
      <main class="workspace-main">
        <div class="workspace-editor">
          <slot name="editor" />
        </div>
      </main>

      <!-- Splitter: Editor | AI Sidebar -->
      <div
        v-if="aiChat.sidebarOpen"
        class="splitter"
        @mousedown="startDrag('ai', $event)"
      ></div>

      <!-- AI Sidebar -->
      <transition name="slide">
        <aside v-if="aiChat.sidebarOpen" class="panel ai-panel"
          :style="{ width: layout.aiSidebarWidth + 'px' }"
        >
          <div class="panel-header">
            <span class="panel-title">AI Assistant</span>
            <button class="panel-toggle" @click="aiChat.closeSidebar()" title="Close">✕</button>
          </div>
          <div class="panel-body">
            <slot name="sidebar" />
          </div>
        </aside>
      </transition>
    </div>

    <footer class="workspace-bottom">
      <slot name="bottom" />
    </footer>
  </div>
</template>

<script setup>
import { useAiChatStore } from '../../stores/aiChat.js'
import { useLayoutStore } from '../../stores/layout.js'

const aiChat = useAiChatStore()
const layout = useLayoutStore()

// ── Drag-to-resize ───────────────────────────────────────────────────

function startDrag(panel, e) {
  e.preventDefault()
  const startX = e.clientX

  const onMove = (ev) => {
    const delta = ev.clientX - startX
    if (panel === 'documents') {
      const w = layout.documentsWidth + delta
      layout.documentsWidth = Math.max(180, Math.min(360, w))
    } else if (panel === 'outline') {
      const w = layout.outlineWidth - delta  // dragging right shrinks outline
      layout.outlineWidth = Math.max(160, Math.min(320, w))
    } else if (panel === 'ai') {
      const w = layout.aiSidebarWidth - delta
      layout.aiSidebarWidth = Math.max(300, Math.min(520, w))
    }
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.workspace-layout {
  display: grid;
  grid-template-rows: var(--topbar-height) 1fr var(--bottombar-height);
  height: 100vh; overflow: hidden;
}
.workspace-top {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex; align-items: center; padding: 0 16px;
}
.workspace-body {
  display: flex; overflow: hidden; flex: 1;
}

/* ── Panels ─────────────────────────────────────────── */
.panel {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex; flex-direction: column;
  overflow: hidden; transition: width 0.2s ease;
  flex-shrink: 0;
}
.panel.collapsed { border-right: 1px solid var(--color-border); }

.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-bottom: 1px solid var(--color-border);
  min-height: 36px; gap: 4px;
}
.panel-title {
  font-size: 13px; font-weight: 600; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  flex: 1;
}
.panel-toggle {
  background: none; border: none; cursor: pointer; font-size: 12px;
  color: var(--color-text-secondary); padding: 2px 4px; flex-shrink: 0;
}
.panel-toggle:hover { color: var(--color-primary); }
.panel-body {
  flex: 1; overflow-y: auto; overflow-x: hidden;
}

.ai-panel {
  border-right: none; border-left: 1px solid var(--color-border);
}

/* ── Splitter ────────────────────────────────────────── */
.splitter {
  width: 5px; cursor: col-resize; background: transparent;
  flex-shrink: 0; transition: background 0.15s; z-index: 5;
}
.splitter:hover { background: var(--color-primary-light); }

/* ── Editor area ─────────────────────────────────────── */
.workspace-main {
  flex: 1; overflow: hidden; display: flex;
}
.workspace-editor {
  flex: 1; overflow-y: auto; padding: 0;
}

/* ── Bottom ──────────────────────────────────────────── */
.workspace-bottom {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex; align-items: center; padding: 0 16px; gap: 8px;
}

/* ── AI Sidebar slide ────────────────────────────────── */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease, width 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%); width: 0;
}
</style>
