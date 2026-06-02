export async function sendMessage(messages, apiKey, articleContext = '') {
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured')
  }

  const systemMessage = {
    role: 'system',
    content: `You are a helpful AI writing and reading assistant. The user is working on the following article. When they ask questions, use this context to provide relevant answers.

=== ARTICLE CONTEXT ===
${articleContext.slice(0, 4000)}
=== END CONTEXT ===

Respond concisely and helpfully in the same language the user uses.`
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
