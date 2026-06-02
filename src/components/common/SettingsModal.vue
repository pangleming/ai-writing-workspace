<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="⚙️ Settings"
    width="520px"
    destroy-on-close
  >
    <el-tabs>
      <el-tab-pane label="API Keys" name="api">
        <el-form label-position="top">
          <el-form-item label="Baidu Translate AppID">
            <el-input v-model="config.baiduAppId" placeholder="Enter your Baidu AppID" />
            <template #extra>
              <a href="https://fanyi-api.baidu.com" target="_blank" class="help-link">
                🔗 Get from Baidu Translate Open Platform
              </a>
            </template>
          </el-form-item>

          <el-form-item label="Baidu Translate SecretKey">
            <el-input
              v-model="config.baiduSecretKey"
              type="password"
              show-password
              placeholder="Enter your Baidu SecretKey"
            />
          </el-form-item>

          <el-form-item label="DeepSeek API Key">
            <el-input
              v-model="config.deepseekApiKey"
              type="password"
              show-password
              placeholder="Enter your DeepSeek API Key"
            />
            <template #extra>
              <a href="https://platform.deepseek.com/api_keys" target="_blank" class="help-link">
                🔗 Get from DeepSeek Platform → API Keys (free sign-up)
              </a>
            </template>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="Gesture" name="gesture">
        <el-form label-position="top">
          <el-form-item label="Gesture Control">
            <el-switch v-model="config.gestureEnabled" active-text="Enabled" inactive-text="Disabled" />
          </el-form-item>

          <el-form-item label="Open Palm Trigger Duration" v-if="config.gestureEnabled">
            <el-slider v-model="config.openPalmDuration" :min="500" :max="2000" :step="100" show-input />
            <template #extra>Hold Open Palm for this duration to trigger (ms)</template>
          </el-form-item>

          <el-form-item label="Camera Preview Position" v-if="config.gestureEnabled">
            <el-select v-model="config.cameraPosition">
              <el-option label="Bottom Right" value="bottom-right" />
              <el-option label="Bottom Left" value="bottom-left" />
              <el-option label="Top Right" value="top-right" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="Voice" name="voice">
        <el-form label-position="top">
          <el-form-item label="Speech Recognition Language">
            <el-select v-model="config.voiceLanguage">
              <el-option label="Auto-detect" value="auto" />
              <el-option label="Chinese (中文)" value="zh" />
              <el-option label="English" value="en" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="About" name="about">
        <div class="about-section">
          <h4>AI Writing &amp; Reading Workspace</h4>
          <p>Version 1.0</p>
          <p>User Interaction Technology — Final Project</p>
          <p>Tongji University, 2026</p>
          <el-divider />
          <h4>Three Functional Modules</h4>
          <ul>
            <li>🎤 Voice Input — Web Speech API</li>
            <li>🖐 Gesture Control — MediaPipe Hands</li>
            <li>🤖 AI + Translation — DeepSeek + Baidu Translate</li>
          </ul>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="emit('update:visible', false)">Close</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useConfigStore } from '../../stores/config.js'

defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible'])

const config = useConfigStore()
</script>

<style scoped>
.help-link {
  font-size: 12px;
  color: var(--color-primary);
  text-decoration: none;
  margin-top: 4px;
  display: inline-block;
}

.help-link:hover {
  text-decoration: underline;
}

.about-section {
  font-size: 13px;
  line-height: 1.8;
}

.about-section h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.about-section ul {
  padding-left: 16px;
}

.about-section li {
  margin: 4px 0;
}
</style>
