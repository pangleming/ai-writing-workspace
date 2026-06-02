<template>
  <div class="main-editor">
    <template v-if="editor.paragraphs.length === 0">
      <div class="editor-empty">
        <p class="empty-title">Start writing or paste an article</p>
        <p class="empty-hint">Use the bottom bar to add content, or paste from clipboard</p>
        <el-button type="primary" @click="editor.addParagraph('')">
          + New Paragraph
        </el-button>
      </div>
    </template>

    <template v-else>
      <ParagraphBlock
        v-for="p in editor.paragraphs"
        :key="p.id"
        :paragraph="p"
        @update="(text) => editor.updateParagraph(p.id, text)"
        @text-select="onTextSelect"
      />
    </template>

    <SelectionToolbar
      :visible="toolbar.visible"
      :text="toolbar.text"
      :x="toolbar.x"
      :y="toolbar.y"
      @explain="handleSelection('explain')"
      @polish="handleSelection('polish')"
      @expand="handleSelection('expand')"
      @ask="handleSelection('ask')"
    />
  </div>
</template>

<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../../stores/editor.js'
import { useAiChatStore } from '../../stores/aiChat.js'
import ParagraphBlock from './ParagraphBlock.vue'
import SelectionToolbar from './SelectionToolbar.vue'

const editor = useEditorStore()
const aiChat = useAiChatStore()

const toolbar = reactive({
  visible: false,
  text: '',
  x: 0,
  y: 0
})

function onTextSelect(text, rect) {
  if (!text) {
    toolbar.visible = false
    return
  }
  toolbar.text = text
  toolbar.x = rect.left + rect.width / 2
  toolbar.y = rect.top
  toolbar.visible = true
}

const actionPrompts = {
  explain: (text) => `Please explain the following text in detail:\n"${text}"`,
  polish: (text) => `Please polish and improve the writing of the following text. Keep the meaning but make it more fluent and professional:\n"${text}"`,
  expand: (text) => `Please expand on the following text, adding more details and depth while maintaining the original tone:\n"${text}"`,
  ask: (text) => `Regarding the following text:\n"${text}"\n\n`
}

function handleSelection(action) {
  const prompt = actionPrompts[action](toolbar.text)
  aiChat.openSidebar()
  aiChat.addMessage('user', prompt)
  toolbar.visible = false
  window.getSelection()?.removeAllRanges()
}

function onDocumentClick() {
  if (!window.getSelection()?.toString().trim()) {
    toolbar.visible = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<style scoped>
.main-editor {
  max-width: 800px;
  margin: 0 auto;
  min-height: 100%;
}

.editor-empty {
  text-align: center;
  padding: 80px 20px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}
</style>
