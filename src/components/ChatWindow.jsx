import { useState, useRef, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { 
  Send, Setting, ApplicationMenu, Robot, User, Copy, Delete, 
  RefreshOne, Down, Loading, Caution, Pause, Edit, Fork,
  CheckOne, Close, Bookmark, Eyes, PictureOne, CloseSmall
} from '@icon-park/react'
import useStore from '../store/useStore'
import { sendChatMessage, tavilySearch, isMultimodalModel } from '../utils/api'
import CodeBlock from './CodeBlock'
import './ChatWindow.css'

// 处理记忆工具调用
function processMemoryToolCalls(toolCalls, currentMemory, onMemoryUpdate) {
  for (const toolCall of toolCalls) {
    if (toolCall.function.name === 'save_memory') {
      try {
        const args = JSON.parse(toolCall.function.arguments)
        const { content, mode } = args
        
        if (mode === 'replace') {
          onMemoryUpdate(content)
          return { updated: true, mode: 'replace' }
        } else if (mode === 'append') {
          const newMemory = currentMemory ? `${currentMemory}\n${content}` : content
          onMemoryUpdate(newMemory)
          return { updated: true, mode: 'append' }
        }
      } catch (e) {
        console.error('解析记忆工具参数失败:', e)
      }
    }
  }
  return { updated: false }
}

// 处理网页搜索工具调用
async function processWebSearchToolCalls(toolCalls, tavilyApiKey) {
  const results = []
  for (const toolCall of toolCalls) {
    if (toolCall.function.name === 'web_search') {
      try {
        const args = JSON.parse(toolCall.function.arguments)
        const { query, search_depth = 'basic' } = args
        
        const searchResult = await tavilySearch(tavilyApiKey, query, search_depth)
        results.push({
          toolCallId: toolCall.id,
          result: searchResult
        })
      } catch (e) {
        console.error('网页搜索失败:', e)
        results.push({
          toolCallId: toolCall.id,
          result: `搜索失败: ${e.message}`
        })
      }
    }
  }
  return results
}

function ChatWindow({ onBotSettingsClick, onMobileMenuToggle }) {
  const { 
    apiConfig, models, bots, currentBotId, conversations,
    addMessage, updateLastMessage, clearConversation, deleteMessage, updateBot,
    setAbortController, stopGeneration,
    setDraft, getDraft, forkConversation, updateMessage, deleteMessagesFrom,
    tavilyConfig
  } = useStore()
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showForkModal, setShowForkModal] = useState(null)
  const [forkName, setForkName] = useState('')
  const [showMemoryPanel, setShowMemoryPanel] = useState(false)
  const [pendingImages, setPendingImages] = useState([]) // 待发送的图片列表
  const messagesEndRef = useRef(null)
  const imageInputRef = useRef(null)
  
  const currentBot = bots.find(bot => bot.id === currentBotId)
  const messages = conversations[currentBotId] || []
  
  // 判断当前模型是否为多模态模型
  const isCurrentModelMultimodal = useMemo(() => {
    const modelId = currentBot?.model || models[0]?.id
    if (!modelId) return false
    // 优先使用 models 列表中的 isMultimodal 属性
    const modelInfo = models.find(m => m.id === modelId)
    if (modelInfo?.isMultimodal !== undefined) return modelInfo.isMultimodal
    // 否则使用判断函数
    return isMultimodalModel(modelId)
  }, [currentBot?.model, models])
  
  // Load draft when switching bots
  useEffect(() => {
    if (currentBotId) {
      const draft = getDraft(currentBotId)
      setInput(draft)
    }
  }, [currentBotId])
  
  // Auto-save draft
  useEffect(() => {
    if (currentBotId && input) {
      const timer = setTimeout(() => {
        setDraft(currentBotId, input)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [input, currentBotId])
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // 处理图片上传
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPendingImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          data: reader.result, // base64 data URL
          name: file.name
        }])
      }
      reader.readAsDataURL(file)
    })
    
    // 清空 input 以便重复选择同一文件
    e.target.value = ''
  }
  
  // 移除待发送的图片
  const handleRemoveImage = (imageId) => {
    setPendingImages(prev => prev.filter(img => img.id !== imageId))
  }
  
  const handleSend = async (customMessage = null) => {
    const messageContent = customMessage || input.trim()
    const hasImages = pendingImages.length > 0
    
    // 如果没有文本且没有图片，不发送
    if (!messageContent && !hasImages) return
    if (isLoading || !currentBot) return
    
    // 检查 API 配置
    if (!apiConfig.apiKey) {
      addMessage(currentBotId, {
        role: 'assistant',
        content: '⚠️ 请先在「全局设置」中配置 API Key 后再开始对话。',
        timestamp: Date.now()
      })
      return
    }
    
    const userMessage = {
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
      // 如果有图片，保存图片数据用于显示
      images: hasImages ? pendingImages.map(img => img.data) : undefined
    }
    
    addMessage(currentBotId, userMessage)
    if (!customMessage) {
      setInput('')
      setDraft(currentBotId, '')
    }
    // 清空待发送的图片
    const imagesToSend = [...pendingImages]
    setPendingImages([])
    
    setIsLoading(true)
    
    // Create AbortController for this request
    const controller = new AbortController()
    setAbortController(controller)
    
    // 添加空的助手消息用于流式填充
    addMessage(currentBotId, {
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    })
    
    try {
      // 构建消息历史，根据 contextRounds 限制历史轮数
      const contextRounds = currentBot.contextRounds ?? 10
      let historyMessages = messages
      
      if (contextRounds > 0) {
        // 每轮对话包含用户消息和助手回复，所以需要取 contextRounds * 2 条消息
        const maxMessages = contextRounds * 2
        historyMessages = messages.slice(-maxMessages)
      }
      
      // 构建当前用户消息（可能包含图片）
      let currentUserMsg
      if (hasImages && isCurrentModelMultimodal) {
        // 多模态格式：content 为数组
        currentUserMsg = {
          role: 'user',
          content: [
            ...imagesToSend.map(img => ({
              type: 'image_url',
              image_url: { url: img.data }
            })),
            { type: 'text', text: messageContent || '请描述这张图片' }
          ]
        }
      } else {
        // 纯文本格式
        currentUserMsg = { role: 'user', content: messageContent }
      }
      
      // 构建历史消息（历史消息中的图片也需要特殊处理）
      const formattedHistory = historyMessages.map(m => {
        // 如果历史消息有图片且当前模型支持多模态，使用多模态格式
        if (m.images && m.images.length > 0 && isCurrentModelMultimodal) {
          return {
            role: m.role,
            content: [
              ...m.images.map(imgData => ({
                type: 'image_url',
                image_url: { url: imgData }
              })),
              { type: 'text', text: m.content || '' }
            ]
          }
        }
        return { role: m.role, content: m.content }
      })
      
      const chatMessages = [
        { role: 'system', content: currentBot.systemPrompt + (currentBot.memory ? `\n\n[长期记忆]\n${currentBot.memory}` : '') },
        ...formattedHistory,
        currentUserMsg
      ]
      
      const model = currentBot.model || models[0]?.id
      if (!model) throw new Error('请先选择模型')
      
      // 判断是否启用网页搜索
      const enableWebSearch = tavilyConfig.enabled && tavilyConfig.apiKey
      
      // 发送消息，启用相应的工具
      const result = await sendChatMessage(
        apiConfig.baseUrl,
        apiConfig.apiKey,
        chatMessages,
        model,
        currentBot.temperature,
        currentBot.maxTokens,
        (chunk) => {
          updateLastMessage(currentBotId, chunk)
        },
        controller.signal,
        currentBot.memoryEnabled, // 记忆工具
        enableWebSearch // 网页搜索工具
      )
      
      // 处理工具调用
      if (result?.toolCalls?.length > 0) {
        // 处理记忆工具调用
        if (currentBot.memoryEnabled) {
          const memoryResult = processMemoryToolCalls(
            result.toolCalls,
            currentBot.memory,
            (newMemory) => updateBot(currentBotId, { memory: newMemory })
          )
          
          if (memoryResult.updated) {
            updateLastMessage(currentBotId, `\n\n---\n✅ 已${memoryResult.mode === 'replace' ? '更新' : '追加'}长期记忆`)
          }
        }
        
        // 处理网页搜索工具调用
        if (enableWebSearch) {
          const searchResults = await processWebSearchToolCalls(result.toolCalls, tavilyConfig.apiKey)
          
          if (searchResults.length > 0) {
            // 添加搜索提示
            updateLastMessage(currentBotId, '\n\n🔍 正在搜索网页...')
            
            // 构建工具结果消息
            const toolResultsMessages = searchResults.map(sr => ({
              role: 'tool',
              tool_call_id: sr.toolCallId,
              content: sr.result
            }))
            
            // 将助手消息和工具结果添加到消息历史
            // 从 store 获取最新的消息内容（流式输出后的完整内容）
            const latestMessages = useStore.getState().conversations[currentBotId] || []
            const assistantMessage = {
              role: 'assistant',
              content: latestMessages[latestMessages.length - 1]?.content || '',
              tool_calls: result.toolCalls
            }
            
            // 重新请求模型处理搜索结果
            // 注意：保留原始用户消息格式（可能包含图片）
            const newChatMessages = [
              { role: 'system', content: currentBot.systemPrompt + (currentBot.memory ? `\n\n[长期记忆]\n${currentBot.memory}` : '') },
              ...formattedHistory,
              currentUserMsg,
              assistantMessage,
              ...toolResultsMessages
            ]
            
            // 清空当前消息并重新生成
            updateLastMessage(currentBotId, '')
            
            await sendChatMessage(
              apiConfig.baseUrl,
              apiConfig.apiKey,
              newChatMessages,
              model,
              currentBot.temperature,
              currentBot.maxTokens,
              (chunk) => {
                updateLastMessage(currentBotId, chunk)
              },
              controller.signal,
              false, // 第二次请求不需要记忆工具
              false  // 第二次请求不需要搜索工具
            )
          }
        }
      }
    } catch (error) {
      if (error.message !== '生成已停止') {
        updateLastMessage(currentBotId, `❌ ${error.message}`)
      }
    } finally {
      setIsLoading(false)
      setAbortController(null)
    }
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
  }
  
  const handleStop = () => {
    stopGeneration()
    setIsLoading(false)
  }
  
  const handleEdit = (index) => {
    if (index < 0 || index >= messages.length) return
    setEditingIndex(index)
    setEditContent(messages[index].content)
  }
  
  const handleSaveEdit = (index) => {
    if (editContent.trim()) {
      updateMessage(currentBotId, index, editContent.trim())
      // If editing user message, delete all messages after and resend
      if (messages[index].role === 'user') {
        deleteMessagesFrom(currentBotId, index + 1)
        setEditingIndex(null)
        setEditContent('')
        // Resend the edited message
        setTimeout(() => handleSend(editContent.trim()), 100)
      } else {
        setEditingIndex(null)
        setEditContent('')
      }
    }
  }
  
  const handleFork = (index) => {
    if (index < 0 || index >= messages.length) return
    setShowForkModal(index)
    setForkName(`${currentBot.name} (分支)`)
  }
  
  const handleConfirmFork = () => {
    if (showForkModal !== null) {
      forkConversation(currentBotId, showForkModal, forkName)
      setShowForkModal(null)
      setForkName('')
    }
  }
  
  const handleRegenerate = async (index) => {
    if (index < 1 || isLoading) return
    
    // Get the user message before deleting (using current messages reference)
    const lastUserMsg = messages[index - 1]
    
    // Delete assistant message at index
    deleteMessagesFrom(currentBotId, index)
    
    // Resend the user message before
    if (lastUserMsg?.role === 'user') {
      setTimeout(() => handleSend(lastUserMsg.content), 100)
    }
  }
  
  const handleModelChange = (modelId) => {
    if (currentBot) {
      updateBot(currentBotId, { model: modelId })
    }
    setShowModelSelect(false)
  }
  
  // 检查是否已配置 API
  const isApiConfigured = !!apiConfig.apiKey
  
  if (!currentBot) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <div className="empty-icon">
            <Robot theme="outline" size="80" fill="currentColor" />
          </div>
          <h2>选择或创建一个 Bot 开始聊天</h2>
          <p>左侧列表中选择已有的 Bot，或点击"新建 Bot"创建新的助手</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="chat-window">
      {/* API 未配置提示 */}
      {!isApiConfigured && (
        <div className="api-warning">
          <Caution theme="outline" size="16" fill="#faad14" />
          <span>请先在「全局设置」中配置 API Key</span>
        </div>
      )}
      
      {/* Header */}
      <div className="chat-header">
        <button className="mobile-menu-btn" onClick={onMobileMenuToggle}>
          <ApplicationMenu theme="outline" size="24" fill="#666" />
        </button>
        
        <div className="chat-title">
          <div className="bot-avatar-small">
            {currentBot.avatar ? (
              <img src={currentBot.avatar} alt={currentBot.name} />
            ) : (
              <Robot theme="outline" size="20" fill="#4a90e2" />
            )}
          </div>
          <span>{currentBot.name}</span>
        </div>
        
        <div className="model-selector">
          <button 
            className="model-btn"
            onClick={() => setShowModelSelect(!showModelSelect)}
          >
            {currentBot.model || models[0]?.id || '选择模型'}
            <Down theme="outline" size="16" fill="#666" />
          </button>
          
          {showModelSelect && (
            <div className="model-dropdown">
              {models.map(model => (
                <div
                  key={model.id}
                  className={`model-option ${currentBot.model === model.id ? 'active' : ''}`}
                  onClick={() => handleModelChange(model.id)}
                >
                  <span className="model-name">{model.id}</span>
                  {model.isMultimodal && (
                    <span className="multimodal-badge" title="支持图像输入">
                      <Eyes theme="outline" size="14" fill="#4a90e2" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button className="settings-btn" onClick={onBotSettingsClick}>
          <Setting theme="outline" size="20" fill="#666" />
        </button>
      </div>
      
      {/* Memory Panel - only show when memoryEnabled */}
      {currentBot.memoryEnabled && showMemoryPanel && (
        <div className="memory-panel">
          <div className="memory-panel-header">
            <Bookmark theme="outline" size="16" fill="#4a90e2" />
            <span>长期记忆</span>
            <button className="memory-close-btn" onClick={() => setShowMemoryPanel(false)}>
              <Close theme="outline" size="14" fill="#666" />
            </button>
          </div>
          <div className="memory-content">
            {currentBot.memory || '暂无记忆内容。Bot 会在对话中自动记录重要信息。'}
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <Robot theme="outline" size="48" fill="#ddd" />
            <p>发送消息开始对话</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? (
                  <User theme="outline" size="28" fill="#fff" />
                ) : (
                  currentBot.avatar ? (
                    <img src={currentBot.avatar} alt={currentBot.name} />
                  ) : (
                    <Robot theme="outline" size="28" fill="#4a90e2" />
                  )
                )}
              </div>
              
              <div className="message-content">
                {editingIndex === index ? (
                  <div className="edit-container">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="message-bubble">
                    {/* 显示用户消息中的图片 */}
                    {msg.role === 'user' && msg.images && msg.images.length > 0 && (
                      <div className="message-images">
                        {msg.images.map((imgData, imgIndex) => (
                          <img key={imgIndex} src={imgData} alt={`图片 ${imgIndex + 1}`} />
                        ))}
                      </div>
                    )}
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code({ inline, className, children, ...props }) {
                            if (inline) {
                              return <code className={className} {...props}>{children}</code>
                            }
                            return <CodeBlock className={className}>{children}</CodeBlock>
                          }
                        }}
                      >
                        {msg.content || (isLoading && index === messages.length - 1 ? '...' : '')}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )
                    }
                  </div>
                )}
                
                <div className="message-actions">
                  <button onClick={() => handleCopy(msg.content)} title="复制">
                    <Copy theme="outline" size="14" fill="#999" />
                  </button>
                  
                  {editingIndex === index ? (
                    <>
                      <button onClick={() => handleSaveEdit(index)} title="保存" className="save-edit-btn">
                        <CheckOne theme="outline" size="14" fill="#52c41a" />
                      </button>
                      <button onClick={() => setEditingIndex(null)} title="取消">
                        <Close theme="outline" size="14" fill="#999" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(index)} title="编辑">
                        <Edit theme="outline" size="14" fill="#999" />
                      </button>
                      
                      {msg.role === 'assistant' && !isLoading && (
                        <button onClick={() => handleRegenerate(index)} title="重新生成">
                          <RefreshOne theme="outline" size="14" fill="#999" />
                        </button>
                      )}
                      
                      <button onClick={() => handleFork(index)} title="从此分叉">
                        <Fork theme="outline" size="14" fill="#999" />
                      </button>
                    </>
                  )}
                  
                  <button onClick={() => deleteMessage(currentBotId, index)} title="删除">
                    <Delete theme="outline" size="14" fill="#999" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Fork Modal */}
      {showForkModal !== null && (
        <div className="modal-overlay" onClick={() => setShowForkModal(null)}>
          <div className="fork-modal" onClick={e => e.stopPropagation()}>
            <h3>分叉对话</h3>
            <p>将从此消息创建一个新的对话分支</p>
            <div className="form-group">
              <label>新 Bot 名称</label>
              <input
                type="text"
                value={forkName}
                onChange={(e) => setForkName(e.target.value)}
                placeholder="输入名称"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowForkModal(null)}>取消</button>
              <button className="primary" onClick={handleConfirmFork}>创建分支</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="chat-input-area">
        {/* Memory toggle button - only show when memoryEnabled */}
        {currentBot.memoryEnabled && (
          <button 
            className={`memory-toggle-btn ${showMemoryPanel ? 'active' : ''}`}
            onClick={() => setShowMemoryPanel(!showMemoryPanel)}
            title="查看记忆"
          >
            <Bookmark theme="outline" size="16" fill={showMemoryPanel ? '#4a90e2' : '#999'} />
          </button>
        )}
        
        {/* Pending images preview */}
        {pendingImages.length > 0 && (
          <div className="pending-images">
            {pendingImages.map(img => (
              <div key={img.id} className="pending-image">
                <img src={img.data} alt={img.name} />
                <button 
                  className="remove-image-btn"
                  onClick={() => handleRemoveImage(img.id)}
                  title="移除图片"
                >
                  <CloseSmall theme="outline" size="12" fill="#fff" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="input-container">
          {/* Image upload button */}
          <button 
            className={`image-upload-btn ${!isCurrentModelMultimodal ? 'disabled' : ''}`}
            onClick={() => imageInputRef.current?.click()}
            disabled={!isCurrentModelMultimodal}
            title={isCurrentModelMultimodal ? '上传图片' : '当前模型不支持图片'}
          >
            <PictureOne theme="outline" size="20" fill={isCurrentModelMultimodal ? '#666' : '#ccc'} />
          </button>
          <input 
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            hidden
          />
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCurrentModelMultimodal ? "输入消息... (Enter 发送, Shift+Enter 换行)" : "输入消息... (当前模型不支持图片)"}
            rows={1}
            disabled={isLoading}
          />
          
          <div className="input-actions">
            {isLoading && (
              <button 
                className="stop-btn"
                onClick={handleStop}
                title="停止生成"
              >
                <Pause theme="outline" size="20" fill="#fff" />
              </button>
            )}
            
            <button 
              className="clear-btn"
              onClick={() => confirm('确定清空对话记录？') && clearConversation(currentBotId)}
              title="清空对话"
            >
              <Delete theme="outline" size="20" fill="#999" />
            </button>
            
            <button 
              className="send-btn"
              onClick={() => handleSend()}
              disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
            >
              {isLoading ? (
                <Loading theme="outline" size="20" fill="#fff" />
              ) : (
                <Send theme="outline" size="20" fill="#fff" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow
