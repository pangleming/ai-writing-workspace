import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useConfigStore = defineStore('config', () => {
  const baiduAppId = ref(localStorage.getItem('baiduAppId') || '')
  const baiduSecretKey = ref(localStorage.getItem('baiduSecretKey') || '')
  const deepseekApiKey = ref(localStorage.getItem('deepseekApiKey') || '')
  const gestureEnabled = ref(localStorage.getItem('gestureEnabled') !== 'false')
  const voiceLanguage = ref(localStorage.getItem('voiceLanguage') || 'auto')

  function save(key, value) {
    localStorage.setItem(key, String(value))
  }

  watch(baiduAppId, v => save('baiduAppId', v))
  watch(baiduSecretKey, v => save('baiduSecretKey', v))
  watch(deepseekApiKey, v => save('deepseekApiKey', v))
  watch(gestureEnabled, v => save('gestureEnabled', v))
  watch(voiceLanguage, v => save('voiceLanguage', v))

  const hasAllKeys = () => {
    return baiduAppId.value && baiduSecretKey.value && deepseekApiKey.value
  }

  return {
    baiduAppId, baiduSecretKey, deepseekApiKey,
    gestureEnabled,
    voiceLanguage,
    hasAllKeys
  }
})
