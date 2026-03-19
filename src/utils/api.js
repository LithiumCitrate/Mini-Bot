// API 工具函数

// 获取模型列表
export async function fetchModels(baseUrl, apiKey) {
  const url = `${baseUrl}/models`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`获取模型列表失败: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.data || []
}

// 发送聊天消息（流式）
export async function sendChatMessage(baseUrl, apiKey, messages, model, temperature = 0.7, onChunk) {
  const url = `${baseUrl}/chat/completions`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: true
    })
  })
  
  if (!response.ok) {
    throw new Error(`发送消息失败: ${response.statusText}`)
  }
  
  const reader = response.body.getReader()
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
      if (!trimmed || trimmed === 'data: [DONE]') continue
      
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6))
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            onChunk(content)
          }
        } catch (e) {
          console.error('解析 SSE 数据失败:', e)
        }
      }
    }
  }
}
