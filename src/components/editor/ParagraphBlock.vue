<template>
  <div
    class="paragraph-block"
    :class="{ hovering: isHovered }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="paragraph-content">
      <p
        class="paragraph-text"
        :contenteditable="editable"
        @input="onInput"
        @mouseup="onTextSelect"
        @blur="onBlur"
        v-text="paragraph.text"
      ></p>

      <el-button
        v-if="isHovered"
        class="translate-trigger"
        size="small"
        circle
        @click.stop="toggleTranslation"
        :type="translationOpen ? 'primary' : 'default'"
        title="Translate paragraph"
      >
        {{ translationOpen ? '🔼' : '🌐' }}
      </el-button>
    </div>

    <InlineTranslation
      :visible="translationOpen"
      :translation="paragraph.translation"
      :translating="paragraph.translating"
      :error="translationError"
      @collapse="translationOpen = false"
      @copy="copyTranslation"
      @send-to-ai="sendToAi"
      @retry="toggleTranslation"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import InlineTranslation from './InlineTranslation.vue'
import { useEditorStore } from '../../stores/editor.js'
import { useAiChatStore } from '../../stores/aiChat.js'
import { useConfigStore } from '../../stores/config.js'
import { translateWithCache } from '../../services/translate.js'

const props = defineProps({
  paragraph: { type: Object, required: true },
  editable: { type: Boolean, default: true }
})

const emit = defineEmits(['update', 'textSelect'])

const isHovered = ref(false)
const translationOpen = ref(false)
const translationError = ref('')

const editor = useEditorStore()
const aiChat = useAiChatStore()
const config = useConfigStore()

async function toggleTranslation() {
  if (translationOpen.value) {
    translationOpen.value = false
    return
  }

  if (props.paragraph.translation) {
    translationOpen.value = true
    return
  }

  try {
    translationError.value = ''
    editor.setTranslating(props.paragraph.id, true)
    translationOpen.value = true

    const result = await translateWithCache(
      props.paragraph.text,
      config.baiduAppId,
      config.baiduSecretKey
    )

    editor.setTranslation(props.paragraph.id, result.text)
  } catch (e) {
    translationError.value = e.message || 'Translation failed'
    editor.setTranslating(props.paragraph.id, false)
  }
}

function copyTranslation() {
  navigator.clipboard.writeText(props.paragraph.translation)
  ElMessage.success('Translation copied')
}

function sendToAi() {
  aiChat.openSidebar()
  aiChat.addMessage('user', `Translate and explain this paragraph:\n"${props.paragraph.text}"`)
}

function onInput(e) {
  emit('update', e.target.innerText)
}

function onBlur(e) {
  emit('update', e.target.innerText)
}

function onTextSelect() {
  const selection = window.getSelection()
  const text = selection?.toString().trim()
  if (text && text.length > 0) {
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    emit('textSelect', text, rect)
  }
}
</script>

<style scoped>
.paragraph-block {
  position: relative;
  padding: 8px 0;
  border-radius: 8px;
  transition: background 0.15s;
}

.paragraph-block.hovering {
  background: #fafafa;
}

.paragraph-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.paragraph-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text);
  outline: none;
  min-height: 1.7em;
  white-space: pre-wrap;
}

.paragraph-text:focus {
  outline: 2px solid var(--color-primary-light);
  border-radius: 4px;
  padding: 2px 6px;
}

.translate-trigger {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
  margin-top: 2px;
}

.paragraph-block.hovering .translate-trigger {
  opacity: 1;
}
</style>
