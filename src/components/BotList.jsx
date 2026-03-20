import { useState } from 'react'
import { Add, Setting, Delete, Robot, Message, Text, Caution, ImageFiles } from '@icon-park/react'
import useStore from '../store/useStore'
import './BotList.css'

function BotList({ onSettingsClick, onMobileClose }) {
  const { bots, currentBotId, createBot, setCurrentBot, deleteBot, conversations, models, apiConfig } = useStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBotName, setNewBotName] = useState('')
  const [newBotPrompt, setNewBotPrompt] = useState('')
  const [newBotModel, setNewBotModel] = useState('')
  const [newBotAvatar, setNewBotAvatar] = useState('')

  // 按 lastActiveAt 降序排列（最近活动的在前）
  const sortedBots = [...bots].sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0))

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
        model: newBotModel || (models[0]?.id || '')
      })
      setNewBotName('')
      setNewBotPrompt('')
      setNewBotModel('')
      setNewBotAvatar('')
      setShowCreateModal(false)
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
    return lastMsg.content.slice(0, 30) + (lastMsg.content.length > 30 ? '...' : '')
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

      <div className="bot-items">
        {sortedBots.length === 0 ? (
          <div className="empty-list">
            <Message theme="outline" size="48" fill="#ccc" />
            <p>还没有 Bot</p>
            <p>点击上方按钮创建一个</p>
          </div>
        ) : (
          sortedBots.map(bot => (
            <div
              key={bot.id}
              className={`bot-item ${currentBotId === bot.id ? 'active' : ''}`}
              onClick={() => handleSelectBot(bot.id)}
            >
              <div className="bot-avatar">
                {bot.avatar ? (
                  <img src={bot.avatar} alt={bot.name} />
                ) : (
                  <Robot theme="outline" size="32" fill="#4a90e2" />
                )}
              </div>
              <div className="bot-info">
                <div className="bot-name">{bot.name}</div>
                <div className="bot-last-msg">{getLastMessage(bot.id)}</div>
              </div>
              <button 
                className="delete-btn"
                onClick={(e) => handleDeleteBot(e, bot.id)}
                title="删除"
              >
                <Delete theme="outline" size="16" fill="#999" />
              </button>
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
              <button onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="primary" onClick={handleCreateBot} disabled={!newBotName.trim()}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BotList
