import { useState } from 'react'
import { Add, Setting, Delete, Robot, Message } from '@icon-park/react'
import useStore from '../store/useStore'
import './BotList.css'

function BotList({ onSettingsClick, onMobileClose }) {
  const { bots, currentBotId, createBot, setCurrentBot, deleteBot, conversations } = useStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBotName, setNewBotName] = useState('')

  const handleCreateBot = () => {
    if (newBotName.trim()) {
      createBot({ name: newBotName.trim() })
      setNewBotName('')
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

      <button 
        className="create-bot-btn"
        onClick={() => setShowCreateModal(true)}
      >
        <Add theme="outline" size="20" fill="#fff" />
        新建 Bot
      </button>

      <div className="bot-items">
        {bots.length === 0 ? (
          <div className="empty-list">
            <Message theme="outline" size="48" fill="#ccc" />
            <p>还没有 Bot</p>
            <p>点击上方按钮创建一个</p>
          </div>
        ) : (
          bots.map(bot => (
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>创建新 Bot</h3>
            <input
              type="text"
              placeholder="输入 Bot 名称"
              value={newBotName}
              onChange={(e) => setNewBotName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBot()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="primary" onClick={handleCreateBot}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BotList
