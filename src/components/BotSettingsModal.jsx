import { useState } from 'react'
import { Close, Robot, Edit, Text, Adjustment, ImageFiles } from '@icon-park/react'
import useStore from '../store/useStore'
import './BotSettingsModal.css'

function BotSettingsModal({ bot, onClose }) {
  const { updateBot, deleteBot } = useStore()
  const [name, setName] = useState(bot.name)
  const [avatar, setAvatar] = useState(bot.avatar)
  const [systemPrompt, setSystemPrompt] = useState(bot.systemPrompt)
  const [temperature, setTemperature] = useState(bot.temperature)
  const [maxTokens, setMaxTokens] = useState(bot.maxTokens)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    updateBot(bot.id, {
      name,
      avatar,
      systemPrompt,
      temperature,
      maxTokens
    })
    onClose()
  }

  const handleDelete = () => {
    if (confirm('确定要删除这个 Bot 吗？所有聊天记录将被清除。')) {
      deleteBot(bot.id)
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bot-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Edit theme="outline" size="20" fill="#4a90e2" />
            Bot 设置
          </h2>
          <button className="close-btn" onClick={onClose}>
            <Close theme="outline" size="20" fill="#666" />
          </button>
        </div>

        <div className="modal-body">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-preview">
              {avatar ? (
                <img src={avatar} alt={name} />
              ) : (
                <Robot theme="outline" size="48" fill="#4a90e2" />
              )}
            </div>
            <label className="avatar-upload-btn">
              <ImageFiles theme="outline" size="18" fill="#666" />
              <span>上传头像</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                hidden 
              />
            </label>
          </div>

          {/* Name */}
          <div className="form-group">
            <label>
              <Robot theme="outline" size="16" fill="#4a90e2" />
              昵称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给 Bot 起个名字"
            />
          </div>

          {/* System Prompt */}
          <div className="form-group">
            <label>
              <Text theme="outline" size="16" fill="#4a90e2" />
              人格提示词 (System Prompt)
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="设定 Bot 的行为逻辑、语气、身份..."
              rows={4}
            />
            <span className="hint">例如：你是一个傲娇的二次元猫娘，喜欢用"喵"结尾。</span>
          </div>

          {/* Temperature */}
          <div className="form-group">
            <label>
              <Adjustment theme="outline" size="16" fill="#4a90e2" />
              温度值 (Temperature): {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
            <div className="range-labels">
              <span>精确 (0)</span>
              <span>平衡 (1)</span>
              <span>创造 (2)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="form-group">
            <label>最大输出长度 (Max Tokens)</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2000)}
              min={100}
              max={8000}
            />
            <span className="hint">控制 Bot 回复的最大长度</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="delete-btn" onClick={handleDelete}>
            删除 Bot
          </button>
          <div className="footer-right">
            <button className="cancel-btn" onClick={onClose}>取消</button>
            <button className="save-btn" onClick={handleSave}>保存</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BotSettingsModal
