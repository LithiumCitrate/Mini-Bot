import { useState } from 'react'
import { Add, Setting, Delete, Robot, Message, Text, Caution, ImageFiles, Bookmark, Search, Pin } from '@icon-park/react'
import useStore from '../store/useStore'
import './BotList.css'

// Bot 模板预设
const BOT_TEMPLATES = [
  {
    id: 'general',
    name: '通用助手',
    icon: '🤖',
    systemPrompt: '你是一个有帮助的AI助手，请用清晰、准确的方式回答用户的问题。',
    temperature: 0.7,
    description: '适合日常问答'
  },
  {
    id: 'writer',
    name: '写作助手',
    icon: '✍️',
    systemPrompt: '你是一位专业的写作助手，擅长各类文体创作。请用优美、流畅的语言帮助用户完成写作任务，注重文字的表达力和感染力。',
    temperature: 0.8,
    description: '文章、文案创作'
  },
  {
    id: 'translator',
    name: '翻译助手',
    icon: '🌐',
    systemPrompt: '你是一位专业翻译，精通多国语言。请准确翻译用户提供的文本，保持原文的语气和风格，必要时提供注释说明。',
    temperature: 0.3,
    description: '多语言翻译'
  },
  {
    id: 'coder',
    name: '编程助手',
    icon: '💻',
    systemPrompt: '你是一位资深程序员，精通多种编程语言和框架。请用简洁、高效的代码回答问题，并附上必要的注释说明。',
    temperature: 0.5,
    description: '代码编写与调试'
  },
  {
    id: 'roleplay',
    name: '角色陪聊',
    icon: '🎭',
    systemPrompt: '你是一个有趣的角色扮演伙伴，请保持角色设定，用生动的语言与用户互动，让对话充满趣味和沉浸感。',
    temperature: 0.9,
    description: '角色扮演对话'
  },
  {
    id: 'summarizer',
    name: '总结提炼',
    icon: '📝',
    systemPrompt: '你是一位专业的信息提炼专家。请将用户提供的内容进行精炼总结，突出重点，条理清晰，便于快速理解。',
    temperature: 0.4,
    description: '内容摘要与提炼'
  }
]

function BotList({ onSettingsClick, onMobileClose }) {
  const { bots, currentBotId, createBot, setCurrentBot, deleteBot, conversations, models, apiConfig } = useStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBotName, setNewBotName] = useState('')
  const [newBotPrompt, setNewBotPrompt] = useState('')
  const [newBotModel, setNewBotModel] = useState('')
  const [newBotAvatar, setNewBotAvatar] = useState('')
  const [newBotTemperature, setNewBotTemperature] = useState(0.7)
  const [showTemplates, setShowTemplates] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 按 pinned 和 lastActiveAt 排序
  const sortedBots = [...bots].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return (b.lastActiveAt || 0) - (a.lastActiveAt || 0)
  })
  
  // 搜索过滤
  const filteredBots = sortedBots.filter(bot => {
    if (!searchQuery) return true
    return bot.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewBotAvatar(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateBot = () => {
    if (newBotName.trim()) {
      createBot({ 
        name: newBotName.trim(),
        avatar: newBotAvatar,
        systemPrompt: newBotPrompt || '你是一个有帮助的AI助手。',
        model: newBotModel || (models[0]?.id || ''),
        temperature: newBotTemperature
      })
      resetCreateForm()
      setShowCreateModal(false)
    }
  }
  
  const resetCreateForm = () => {
    setNewBotName('')
    setNewBotPrompt('')
    setNewBotModel('')
    setNewBotAvatar('')
    setNewBotTemperature(0.7)
  }
  
  const handleSelectTemplate = (template) => {
    setNewBotName(template.name)
    setNewBotPrompt(template.systemPrompt)
    setNewBotTemperature(template.temperature)
    setShowTemplates(false)
  }
  
  const handleTogglePin = (e, botId) => {
    e.stopPropagation()
    const bot = bots.find(b => b.id === botId)
    if (bot) {
      const { updateBot } = useStore.getState()
      updateBot(botId, { pinned: !bot.pinned })
    }
  }

  const handleSelectBot = (botId) => {
    setCurrentBot(botId)
    onMobileClose?.()
  }

  const handleDeleteBot = (e, botId) => {
    e.stopPropagation()
    if (confirm('确定要删除这个 Bot 吗？')) {
      deleteBot(botId)
    }
  }

  const getLastMessage = (botId) => {
    const messages = conversations[botId] || []
    if (messages.length === 0) return '暂无消息'
    const lastMsg = messages[messages.length - 1]
    const content = lastMsg.content || ''
    return content.slice(0, 30) + (content.length > 30 ? '...' : '')
  }

  return (
    <div className="bot-list">
      <div className="bot-list-header">
        <h2>
          <Robot theme="outline" size="24" fill="#4a90e2" />
          Mini Bot
        </h2>
      </div>

      {/* API 未配置提示 */}
      {!apiConfig.apiKey && (
        <div className="api-warning-banner" onClick={onSettingsClick}>
          <Caution theme="outline" size="16" fill="#faad14" />
          <span>请配置 API Key</span>
        </div>
      )}

      <button 
        className="create-bot-btn"
        onClick={() => setShowCreateModal(true)}
      >
        <Add theme="outline" size="20" fill="#fff" />
        新建 Bot
      </button>
      
      {/* Search */}
      <div className="search-box">
        <Search theme="outline" size="16" fill="#999" />
        <input
          type="text"
          placeholder="搜索 Bot..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bot-items">
        {filteredBots.length === 0 ? (
          <div className="empty-list">
            <Message theme="outline" size="48" fill="#ccc" />
            <p>{searchQuery ? '没有找到匹配的 Bot' : '还没有 Bot'}</p>
            <p>{searchQuery ? '试试其他关键词' : '点击上方按钮创建一个'}</p>
          </div>
        ) : (
          filteredBots.map(bot => (
            <div
              key={bot.id}
              className={`bot-item ${currentBotId === bot.id ? 'active' : ''} ${bot.pinned ? 'pinned' : ''}`}
              onClick={() => handleSelectBot(bot.id)}
            >
              <div className="bot-avatar">
                {bot.avatar ? (
                  <img src={bot.avatar} alt={bot.name} />
                ) : (
                  <Robot theme="outline" size="32" fill="#4a90e2" />
                )}
                {bot.pinned && <span className="pin-indicator">📌</span>}
              </div>
              <div className="bot-info">
                <div className="bot-name">
                  {bot.name}
                  {bot.isForked && <span className="fork-badge">分支</span>}
                </div>
                <div className="bot-last-msg">{getLastMessage(bot.id)}</div>
              </div>
              <div className="bot-item-actions">
                <button 
                  className={`pin-btn ${bot.pinned ? 'active' : ''}`}
                  onClick={(e) => handleTogglePin(e, bot.id)}
                  title={bot.pinned ? '取消置顶' : '置顶'}
                >
                  <Pin theme="outline" size="14" fill={bot.pinned ? '#4a90e2' : '#999'} />
                </button>
                <button 
                  className="delete-btn"
                  onClick={(e) => handleDeleteBot(e, bot.id)}
                  title="删除"
                >
                  <Delete theme="outline" size="16" fill="#999" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bot-list-footer">
        <button className="settings-btn" onClick={onSettingsClick}>
          <Setting theme="outline" size="20" fill="#666" />
          全局设置
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal create-bot-modal" onClick={e => e.stopPropagation()}>
            <h3>创建新 Bot</h3>
            
            {/* Template Selection */}
            <div className="template-section">
              <div className="template-header" onClick={() => setShowTemplates(!showTemplates)}>
                <Bookmark theme="outline" size="16" fill="#4a90e2" />
                <span>选择模板</span>
                <span className="toggle-icon">{showTemplates ? '▲' : '▼'}</span>
              </div>
              {showTemplates && (
                <div className="template-grid">
                  {BOT_TEMPLATES.map(template => (
                    <div 
                      key={template.id} 
                      className="template-card"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <span className="template-icon">{template.icon}</span>
                      <span className="template-name">{template.name}</span>
                      <span className="template-desc">{template.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Avatar Section */}
            <div className="create-avatar-section">
              <div className="create-avatar-preview">
                {newBotAvatar ? (
                  <img src={newBotAvatar} alt="avatar" />
                ) : (
                  <Robot theme="outline" size="32" fill="#4a90e2" />
                )}
              </div>
              <label className="create-avatar-btn">
                <ImageFiles theme="outline" size="16" fill="#666" />
                <span>选择头像</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange}
                  hidden 
                />
              </label>
            </div>

            <div className="form-group">
              <label>名称</label>
              <input
                type="text"
                placeholder="给 Bot 起个名字"
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label>
                <Text theme="outline" size="14" fill="#4a90e2" />
                人格提示词 (可选)
              </label>
              <textarea
                placeholder="设定 Bot 的行为逻辑、语气、身份..."
                value={newBotPrompt}
                onChange={(e) => setNewBotPrompt(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>温度值: {newBotTemperature}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={newBotTemperature}
                onChange={(e) => setNewBotTemperature(parseFloat(e.target.value))}
              />
              <div className="range-labels">
                <span>精确</span>
                <span>平衡</span>
                <span>创造</span>
              </div>
            </div>
            
            {models.length > 0 && (
              <div className="form-group">
                <label>模型 (可选)</label>
                <select
                  value={newBotModel}
                  onChange={(e) => setNewBotModel(e.target.value)}
                >
                  <option value="">默认模型</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>{model.id}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="modal-actions">
              <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>取消</button>
              <button className="primary" onClick={handleCreateBot} disabled={!newBotName.trim()}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BotList
