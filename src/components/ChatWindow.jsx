import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Send, Setting, ApplicationMenu, Robot, User, Copy, Delete, 
  RefreshOne, Down, Up, Loading, Caution, Pause, Edit, Fork,
  CheckOne, Close
} from '@icon-park/react'
import useStore from '../store/useStore'
import { sendChatMessage } from '../utils/api'
import CodeBlock from './CodeBlock'
import './ChatWindow.css'

function ChatWindow({ onBotSettingsClick, onMobileMenuToggle }) {
  const { 
    apiConfig, models, bots, currentBotId, conversations,
    addMessage, updateLastMessage, clearConversation, deleteMessage, updateBot,
    setAbortController, stopGeneration, abortController,
    setDraft, getDraft, forkConversation, updateMessage, deleteMessagesFrom
  } = useStore()
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showForkModal, setShowForkModal] = useState(null)
  const [forkName, setForkName] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const currentBot = bots.find(bot => bot.id === currentBotId)
  const messages = conversations[currentBotId] || []
  
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
  
  const handleSend = async (customMessage = null) => {
    const messageContent = customMessage || input.trim()
    if (!messageContent || isLoading || !currentBot) return
    
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
      timestamp: Date.now()
    }
    
    addMessage(currentBotId, userMessage)
    if (!customMessage) {
      setInput('')
      setDraft(currentBotId, '')
    }
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
      
      const chatMessages = [
        { role: 'system', content: currentBot.systemPrompt + (currentBot.memory ? `\n\n[长期记忆]\n${currentBot.memory}` : '') },
        ...historyMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage.content }
      ]
      
      const model = currentBot.model || models[0]?.id
      if (!model) throw new Error('请先选择模型')
      
      await sendChatMessage(
        apiConfig.baseUrl,
        apiConfig.apiKey,
        chatMessages,
        model,
        currentBot.temperature,
        currentBot.maxTokens,
        (chunk) => {
          updateLastMessage(currentBotId, chunk)
        },
        controller.signal
      )
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
    
    // Delete assistant message at index
    deleteMessagesFrom(currentBotId, index)
    
    // Resend the user message before
    const lastUserMsg = messages[index - 1]
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
          <Robot theme="outline" size="80" fill="#ccc" />
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
                  {model.id}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button className="settings-btn" onClick={onBotSettingsClick}>
          <Setting theme="outline" size="20" fill="#666" />
        </button>
      </div>
      
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
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
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
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
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
              disabled={!input.trim() || isLoading}
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
