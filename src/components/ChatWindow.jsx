import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Send, Setting, ApplicationMenu, Robot, User, Copy, Delete, 
  RefreshOne, Down, Up, Loading 
} from '@icon-park/react'
import useStore from '../store/useStore'
import { sendChatMessage } from '../utils/api'
import './ChatWindow.css'

function ChatWindow({ onBotSettingsClick, onMobileMenuToggle }) {
  const { 
    apiConfig, models, bots, currentBotId, conversations,
    addMessage, updateLastMessage, clearConversation, deleteMessage, updateBot
  } = useStore()
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const currentBot = bots.find(bot => bot.id === currentBotId)
  const messages = conversations[currentBotId] || []
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentBot) return
    
    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    }
    
    addMessage(currentBotId, userMessage)
    setInput('')
    setIsLoading(true)
    
    // 添加空的助手消息用于流式填充
    addMessage(currentBotId, {
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    })
    
    try {
      // 构建消息历史
      const chatMessages = [
        { role: 'system', content: currentBot.systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
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
        (chunk) => {
          updateLastMessage(currentBotId, chunk)
        }
      )
    } catch (error) {
      updateLastMessage(currentBotId, `错误: ${error.message}`)
    } finally {
      setIsLoading(false)
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
  
  const handleRegenerate = async (index) => {
    if (index < 1 || isLoading) return
    
    // 删除从该消息开始的所有消息
    const messagesToDelete = messages.length - index
    for (let i = 0; i < messagesToDelete; i++) {
      deleteMessage(currentBotId, messages.length - 1 - i)
    }
    
    // 重新发送上一条用户消息
    const lastUserMsg = messages[index - 1]
    if (lastUserMsg?.role === 'user') {
      setInput(lastUserMsg.content)
      setTimeout(handleSend, 100)
    }
  }
  
  const handleModelChange = (modelId) => {
    if (currentBot) {
      updateBot(currentBotId, { model: modelId })
    }
    setShowModelSelect(false)
  }
  
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
                <div className="message-bubble">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || (isLoading && index === messages.length - 1 ? '...' : '')}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                
                <div className="message-actions">
                  <button onClick={() => handleCopy(msg.content)} title="复制">
                    <Copy theme="outline" size="14" fill="#999" />
                  </button>
                  
                  {msg.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                    <button onClick={() => handleRegenerate(index)} title="重新生成">
                      <RefreshOne theme="outline" size="14" fill="#999" />
                    </button>
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
            <button 
              className="clear-btn"
              onClick={() => confirm('确定清空对话记录？') && clearConversation(currentBotId)}
              title="清空对话"
            >
              <Delete theme="outline" size="20" fill="#999" />
            </button>
            
            <button 
              className="send-btn"
              onClick={handleSend}
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
