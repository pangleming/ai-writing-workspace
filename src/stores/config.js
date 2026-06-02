import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useConfigStore = defineStore('config', () => {
  const baiduAppId = ref(localStorage.getItem('baiduAppId') || '')
  const baiduSecretKey = ref(localStorage.getItem('baiduSecretKey') || '')
  const deepseekApiKey = ref(localStorage.getItem('deepseekApiKey') || '')
  const gestureEnabled = ref(localStorage.getItem('gestureEnabled') !== 'false')
  const openPalmDuration = ref(Number(localStorage.getItem('openPalmDuration')) || 1000)
  const cameraPosition = ref(localStorage.getItem('cameraPosition') || 'bottom-right')
  const voiceLanguage = ref(localStorage.getItem('voiceLanguage') || 'auto')

  function save(key, value) {
    localStorage.setItem(key, String(value))
  }

  watch(baiduAppId, v => save('baiduAppId', v))
  watch(baiduSecretKey, v => save('baiduSecretKey', v))
  watch(deepseekApiKey, v => save('deepseekApiKey', v))
  watch(gestureEnabled, v => save('gestureEnabled', v))
  watch(openPalmDuration, v => save('openPalmDuration', v))
  watch(cameraPosition, v => save('cameraPosition', v))
  watch(voiceLanguage, v => save('voiceLanguage', v))

  const hasAllKeys = () => {
    return baiduAppId.value && baiduSecretKey.value && deepseekApiKey.value
  }

  return {
    baiduAppId, baiduSecretKey, deepseekApiKey,
    gestureEnabled, openPalmDuration, cameraPosition,
    voiceLanguage,
    hasAllKeys
  }
})
