import md5 from 'blueimp-md5'

export async function translateText(text, appId, secretKey, toLang = 'auto') {
  const appIdClean = String(appId).trim()
  const secretKeyClean = String(secretKey).trim()

  if (!appIdClean || !secretKeyClean) {
    throw new Error('Baidu Translate API keys not configured')
  }

  const hasChinese = /[一-鿿]/.test(text)
  const targetLang = toLang === 'auto' ? (hasChinese ? 'en' : 'zh') : toLang

  const salt = Math.floor(Math.random() * 32768) + 32768
  const signStr = appIdClean + text + salt + secretKeyClean
  const sign = md5(signStr)

  const formBody = new URLSearchParams()
  formBody.append('q', text)
  formBody.append('from', 'auto')
  formBody.append('to', targetLang)
  formBody.append('appid', appIdClean)
  formBody.append('salt', String(salt))
  formBody.append('sign', sign)

  const response = await fetch('/api/baidu-translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody.toString()
  })

  const data = await response.json()

  if (data.trans_result) {
    return {
      text: data.trans_result.map(item => item.dst).join('\n'),
      from: data.from,
      to: data.to
    }
  } else {
    const errCode = data.error_code || 'unknown'
    const errMsg = data.error_msg || 'Translation failed'
    throw new Error(`${errMsg} (code: ${errCode})`)
  }
}

const cache = new Map()

export async function translateWithCache(text, appId, secretKey, toLang = 'auto') {
  const cacheKey = `${text}::${toLang}`
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }
  const result = await translateText(text, appId, secretKey, toLang)
  cache.set(cacheKey, result)
  return result
}
