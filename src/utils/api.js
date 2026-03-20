// API 工具函数

// 友好错误消息映射
const errorMessages = {
  400: '请求格式错误，请检查参数设置',
  401: 'API Key 无效或已过期',
  403: '没有权限访问此 API，请检查 API Key 权限',
  404: 'API 地址不存在，请检查 Base URL 是否正确',
  429: '请求过于频繁，请稍后重试',
  500: '服务器内部错误',
  502: '网关错误，服务暂时不可用',
  503: '服务暂时不可用，请稍后重试'
}

// 解析错误
function parseError(error, response) {
  if (error.name === 'AbortError') {
    return '生成已停止'
  }
  
  if (response) {
    const status = response.status
    const friendlyMsg = errorMessages[status]
    if (friendlyMsg) {
      return `${friendlyMsg} (${status})`
    }
    if (status >= 400 && status < 500) {
      return `请求错误 (${status}): ${response.statusText}`
    }
    if (status >= 500) {
      return `服务器错误 (${status}): ${response.statusText}`
    }
  }
  
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return '网络连接失败，请检查网络或 Base URL 是否正确'
  }
  
  return error.message || '未知错误'
}

// 测试 API 连接
export async function testConnection(baseUrl, apiKey) {
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    const responseTime = Date.now() - startTime
    
    if (!response.ok) {
      const error = new Error()
      throw { error, response }
    }
    
    const data = await response.json()
    
    return {
      success: true,
      responseTime,
      modelCount: data.data?.length || 0,
      isCompatible: Array.isArray(data.data)
    }
  } catch ({ error, response }) {
    return {
      success: false,
      error: parseError(error, response),
      responseTime: Date.now() - startTime
    }
  }
}

// 获取模型列表
export async function fetchModels(baseUrl, apiKey) {
  const url = `${baseUrl}/models`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  }).catch(error => {
    throw new Error(parseError(error))
  })
  
  if (!response.ok) {
    throw new Error(parseError(null, response))
  }
  
  const data = await response.json()
  return data.data || []
}

// 发送聊天消息（流式）
export async function sendChatMessage(baseUrl, apiKey, messages, model, temperature = 0.7, maxTokens = 2000, onChunk, signal) {
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
      max_tokens: maxTokens,
      stream: true
    }),
    signal
  }).catch(error => {
    if (error.name === 'AbortError') {
      throw new Error('生成已停止')
    }
    throw new Error(parseError(error))
  })
  
  if (!response.ok) {
    throw new Error(parseError(null, response))
  }
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  
  try {
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
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('生成已停止')
    }
    throw error
  }
}
