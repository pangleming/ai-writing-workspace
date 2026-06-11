<template>
  <div class="document-panel">
    <div class="panel-actions">
      <el-button size="small" @click="$emit('new-document')" class="action-btn">＋ New</el-button>
      <el-button size="small" @click="handleImport" class="action-btn">📥 Import</el-button>
      <el-button size="small" @click="$emit('export-document')"
        :disabled="!doc.activeDocument" class="action-btn">📤 Export</el-button>
    </div>

    <div class="panel-divider"></div>

    <div class="document-list" v-if="doc.documents.length > 0">
      <div
        v-for="d in doc.documents" :key="d.id"
        class="document-item"
        :class="{ active: d.id === doc.activeDocumentId }"
        @click="$emit('switch-document', d.id)"
        @dblclick="startRename(d)"
        :title="d.title"
      >
        <div class="doc-item-main">
          <span class="doc-icon">{{ d.fileType === 'md' ? '📄' : '📝' }}</span>
          <div class="doc-item-info">
            <span class="doc-title">{{ d.title }}</span>
            <span class="doc-meta">{{ formatDate(d.updatedAt) }}</span>
          </div>
        </div>
        <div class="doc-item-actions">
          <span v-if="d.id === doc.activeDocumentId && doc.isDirty" class="dirty-dot" title="Unsaved">●</span>
          <span v-if="d.id === doc.activeDocumentId && !doc.isDirty" class="saved-check" title="Saved">✓</span>
          <el-button size="small" text @click.stop="handleDelete(d)" class="delete-btn" title="Delete">🗑</el-button>
        </div>
      </div>
    </div>

    <div v-else class="panel-empty">
      <p>No documents yet.</p>
      <p class="hint">Create or import a document.</p>
    </div>

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept=".md,.markdown,.txt"
      style="display:none" @change="onFileSelected" />

    <!-- Rename dialog -->
    <el-dialog v-model="renameVisible" title="Rename Document" width="360px" append-to-body>
      <el-input v-model="renameValue" placeholder="Document title" @keyup.enter="confirmRename" />
      <template #footer>
        <el-button @click="renameVisible = false">Cancel</el-button>
        <el-button type="primary" @click="confirmRename" :disabled="!renameValue.trim()">Rename</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDocumentStore } from '../../stores/document.js'

const doc = useDocumentStore()
const fileInputRef = ref(null)
const renameVisible = ref(false)
const renameValue = ref('')
let renameTargetId = null

const emit = defineEmits(['switch-document', 'export-document', 'new-document', 'import-document'])

function startRename(d) {
  renameTargetId = d.id
  renameValue.value = d.title
  renameVisible.value = true
}

function confirmRename() {
  if (!renameValue.value.trim() || !renameTargetId) return
  doc.renameDocument(renameTargetId, renameValue.value.trim())
  renameVisible.value = false
  ElMessage.success('Document renamed')
}

function handleImport() { fileInputRef.value?.click() }

function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  emit('import-document', file)
  // Reset input
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function handleDelete(d) {
  try {
    await ElMessageBox.confirm(
      `Delete "${d.title}"? This cannot be undone.`,
      'Confirm Delete',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' }
    )
    doc.deleteDocument(d.id)
    ElMessage.success('Document deleted')
  } catch { /* cancelled */ }
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.document-panel {
  display: flex; flex-direction: column; height: 100%;
}

.panel-actions {
  display: flex; flex-direction: column; gap: 4px; padding: 8px 10px;
}
.action-btn { justify-content: flex-start; width: 100%; }

.panel-divider {
  height: 1px; background: var(--color-border, #e5e5e5); margin: 4px 10px;
}

.document-list {
  flex: 1; overflow-y: auto; padding: 4px 6px;
}

.document-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; border-radius: 6px; cursor: pointer;
  transition: background 0.15s; margin-bottom: 2px;
}
.document-item:hover { background: #f5f5f5; }
.document-item.active { background: var(--color-primary-light, #eef2ff); }

.doc-item-main {
  display: flex; align-items: center; gap: 6px; overflow: hidden; flex: 1;
}
.doc-icon { font-size: 14px; flex-shrink: 0; }
.doc-item-info { display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.doc-title {
  font-size: 12px; font-weight: 500; color: var(--color-text, #1a1a1a);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.doc-meta { font-size: 10px; color: var(--color-text-secondary, #666); }

.doc-item-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.dirty-dot { color: #f59e0b; font-size: 10px; }
.saved-check { color: #16a34a; font-size: 10px; }
.delete-btn { opacity: 0; transition: opacity 0.15s; }
.document-item:hover .delete-btn { opacity: 1; }

.panel-empty {
  padding: 20px 12px; text-align: center;
  color: var(--color-text-secondary, #666); font-size: 12px;
}
.panel-empty .hint { font-size: 11px; color: #999; margin-top: 4px; }
</style>
