import { useState, ChangeEvent } from 'react'
import { Close, Robot, Edit, Text, Adjustment, ImageFiles, History, Bookmark } from '@icon-park/react'
import useStore, { Bot } from '../store/useStore'
import './BotSettingsModal.css'

interface BotSettingsModalProps {
  bot: Bot
  onClose: () => void
}

function BotSettingsModal({ bot, onClose }: BotSettingsModalProps) {
  const { updateBot, deleteBot } = useStore()
  const [name, setName] = useState(bot?.name || '')
  const [avatar, setAvatar] = useState(bot?.avatar || '')
  const [systemPrompt, setSystemPrompt] = useState(bot?.systemPrompt || '')
  const [temperature, setTemperature] = useState(bot?.temperature ?? 0.7)
  const [maxTokens, setMaxTokens] = useState(bot?.maxTokens ?? 2000)
  const [contextRounds, setContextRounds] = useState(bot?.contextRounds ?? 10)
  const [memory, setMemory] = useState(bot?.memory || '')
  const [memoryEnabled, setMemoryEnabled] = useState(bot?.memoryEnabled ?? false)

  // 防护：bot 为空时不渲染
  if (!bot) return null

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (!name.trim()) return
    updateBot(bot.id, {
      name: name.trim(),
      avatar,
      systemPrompt,
      temperature,
      maxTokens,
      contextRounds,
      memory,
      memoryEnabled
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
              <span>创意 (2)</span>
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

          {/* Context Rounds */}
          <div className="form-group">
            <label>
              <History theme="outline" size="16" fill="#4a90e2" />
              上下文轮数: {contextRounds === 0 ? '无限制' : contextRounds}
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={contextRounds}
              onChange={(e) => setContextRounds(parseInt(e.target.value))}
            />
            <div className="range-labels">
              <span>无限制 (0)</span>
              <span>10轮</span>
              <span>20轮</span>
            </div>
            <span className="hint">限制对话历史记忆轮数，避免 token 超限</span>
          </div>
          
          {/* Memory Enable Toggle */}
          <div className="form-group">
            <label className="toggle-label">
              <Bookmark theme="outline" size="16" fill="#4a90e2" />
              记忆功能
            </label>
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={memoryEnabled}
                  onChange={(e) => setMemoryEnabled(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-text">{memoryEnabled ? '已开启' : '已关闭'}</span>
            </div>
            <span className="hint">开启后，Bot 可在对话中自动写入长期记忆，并显示记忆面板</span>
          </div>
          
          {/* Long-term Memory - only show when memoryEnabled */}
          {memoryEnabled && (
            <div className="form-group">
              <label>
                <Bookmark theme="outline" size="16" fill="#4a90e2" />
                长期记忆内容
              </label>
              <textarea
                value={memory}
                onChange={(e) => setMemory(e.target.value)}
                placeholder="用户昵称、偏好、常做任务、语气要求...这部分内容会始终跟随对话发送"
                rows={3}
              />
              <span className="hint">Bot 会在对话中自动追加重要信息，你也可以手动编辑</span>
            </div>
          )}
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
