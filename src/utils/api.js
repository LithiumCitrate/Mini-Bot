// API 工具函数

// 定义 save_memory 工具
export const memoryTools = [
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: '保存重要信息到长期记忆中。用于记录用户的偏好、重要事实、约定事项等需要持久记住的内容。',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: '要保存的记忆内容，应简洁明了'
          },
          mode: {
            type: 'string',
            enum: ['append', 'replace'],
            description: 'append: 追加到现有记忆末尾; replace: 替换全部记忆'
          }
        },
        required: ['content', 'mode']
      }
    }
  }
]

// 定义 web_search 工具 (Tavily)
export const webSearchTools = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: '在互联网上搜索最新信息。当用户询问时事新闻、最新数据、或你需要获取实时信息时使用此工具。搜索结果可能包含相关图片，你可以在回复中使用 Markdown 图片语法展示给用户。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索关键词或问题'
          },
          search_depth: {
            type: 'string',
            enum: ['basic', 'advanced'],
            description: '搜索深度：basic 快速搜索，advanced 深度搜索（默认 basic）'
          }
        },
        required: ['query']
      }
    }
  }
]

// 合并所有工具
export const getAllTools = (enableMemory, enableWebSearch) => {
  const tools = []
  if (enableMemory) tools.push(...memoryTools)
  if (enableWebSearch) tools.push(...webSearchTools)
  return tools
}

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
export async function sendChatMessage(baseUrl, apiKey, messages, model, temperature = 0.7, maxTokens = 2000, onChunk, signal, enableMemoryTools = false, enableWebSearch = false) {
  const url = `${baseUrl}/chat/completions`
  
  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true
  }
  
  // 添加工具
  const tools = getAllTools(enableMemoryTools, enableWebSearch)
  if (tools.length > 0) {
    requestBody.tools = tools
    requestBody.tool_choice = 'auto'
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody),
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
  let toolCalls = [] // 收集工具调用
  
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
            const delta = json.choices?.[0]?.delta
            
            // 处理内容
            if (delta?.content) {
              onChunk(delta.content)
            }
            
            // 处理工具调用
            if (delta?.tool_calls) {
              for (const toolCallDelta of delta.tool_calls) {
                const index = toolCallDelta.index
                if (!toolCalls[index]) {
                  toolCalls[index] = {
                    id: toolCallDelta.id || '',
                    type: 'function',
                    function: { name: '', arguments: '' }
                  }
                }
                if (toolCallDelta.id) {
                  toolCalls[index].id = toolCallDelta.id
                }
                if (toolCallDelta.function?.name) {
                  toolCalls[index].function.name = toolCallDelta.function.name
                }
                if (toolCallDelta.function?.arguments) {
                  toolCalls[index].function.arguments += toolCallDelta.function.arguments
                }
              }
            }
          } catch (e) {
            console.error('解析 SSE 数据失败:', e)
          }
        }
      }
    }
    
    // 返回工具调用（如果有）
    return { toolCalls: toolCalls.filter(tc => tc.id) }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('生成已停止')
    }
    throw error
  }
}

// Tavily 网页搜索
export async function tavilySearch(apiKey, query, searchDepth = 'basic') {
  const url = 'https://api.tavily.com/search'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query,
      search_depth: searchDepth,
      include_answer: true,
      include_raw_content: false,
      max_results: 5,
      include_images: true,
      include_image_descriptions: true
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Tavily API 错误 (${response.status})`)
  }
  
  const data = await response.json()
  
  // 格式化搜索结果
  let result = ''
  if (data.answer) {
    result += `**摘要:** ${data.answer}\n\n`
  }
  if (data.results && data.results.length > 0) {
    result += '**搜索结果:**\n'
    data.results.forEach((item, index) => {
      result += `${index + 1}. [${item.title}](${item.url})\n   ${item.content}\n\n`
    })
  }
  
  // 添加图片结果
  if (data.images && data.images.length > 0) {
    result += '**相关图片:**\n\n'
    data.images.forEach((image, index) => {
      if (image.description) {
        result += `![${image.description}](${image.url})\n\n`
      } else {
        result += `![图片${index + 1}](${image.url})\n\n`
      }
    })
  }
  
  return result
}
