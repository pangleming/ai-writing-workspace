export async function sendMessage(messages, apiKey, articleContext = '') {
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured')
  }

  const systemMessage = {
    role: 'system',
    content: `你是一个专业的 AI 写作与阅读助手。用户正在处理以下文章，请基于文章内容回答用户的问题。

=== 文章上下文 ===
${articleContext.slice(0, 4000)}
=== 上下文结束 ===

规则：
1. 始终用中文回复，除非用户明确使用英文提问。
2. 回答简洁、专业、有帮助。
3. 如果用户请求润色/扩写/解释某段文字，直接在中文语境下处理。`
  }

  const allMessages = [systemMessage, ...messages]

  const response = await fetch(
    'https://api.deepseek.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: allMessages,
        stream: true
      })
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `API error: ${response.status}`)
  }

  return response.body.getReader()
}

export async function* streamResponse(reader) {
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) yield content
      } catch (e) {
        // Skip unparseable chunks
      }
    }
  }
}
