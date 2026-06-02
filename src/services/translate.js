import md5 from 'js-md5'

export async function translateText(text, appId, secretKey, toLang = 'auto') {
  if (!appId || !secretKey) {
    throw new Error('Baidu Translate API keys not configured')
  }

  const hasChinese = /[一-鿿]/.test(text)
  const targetLang = toLang === 'auto' ? (hasChinese ? 'en' : 'zh') : toLang

  const salt = String(Math.floor(Math.random() * 100000))
  const signStr = String(appId) + text + salt + String(secretKey)
  const sign = md5(signStr)

  const body = new URLSearchParams()
  body.append('q', text)
  body.append('from', 'auto')
  body.append('to', targetLang)
  body.append('appid', String(appId))
  body.append('salt', salt)
  body.append('sign', sign)

  const response = await fetch('/api/baidu-translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  const data = await response.json()

  if (data.trans_result) {
    return {
      text: data.trans_result.map(item => item.dst).join('\n'),
      from: data.from,
      to: data.to
    }
  } else {
    throw new Error(data.error_msg || 'Translation failed')
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
