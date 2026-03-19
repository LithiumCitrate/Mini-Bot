import { useState } from 'react'
import { Close, Api, Key, Refresh, CheckOne, Loading } from '@icon-park/react'
import useStore from '../store/useStore'
import { fetchModels } from '../utils/api'
import './SettingsModal.css'

function SettingsModal({ onClose }) {
  const { apiConfig, setApiConfig, setModels, models } = useStore()
  const [baseUrl, setBaseUrl] = useState(apiConfig.baseUrl || 'https://api.openai.com/v1')
  const [apiKey, setApiKey] = useState(apiConfig.apiKey || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRefreshModels = async () => {
    if (!baseUrl || !apiKey) {
      setError('请填写完整的配置信息')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const fetchedModels = await fetchModels(baseUrl, apiKey)
      setApiConfig({ baseUrl, apiKey })
      setModels(fetchedModels)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err.message || '获取模型列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    setApiConfig({ baseUrl, apiKey })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>全局设置</h2>
          <button className="close-btn" onClick={onClose}>
            <Close theme="outline" size="20" fill="#666" />
          </button>
        </div>

        <div className="modal-body">
          <div className="setting-section">
            <h3>
              <Api theme="outline" size="18" fill="#4a90e2" />
              API 配置
            </h3>

            <div className="form-group">
              <label>Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
              <span className="hint">支持 OpenAI 格式的 API 地址</span>
            </div>

            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <span className="hint">您的 API 密钥将安全存储在本地</span>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">模型列表已更新</div>}

            <button 
              className="refresh-btn"
              onClick={handleRefreshModels}
              disabled={loading}
            >
              {loading ? (
                <Loading theme="outline" size="18" fill="#fff" />
              ) : (
                <Refresh theme="outline" size="18" fill="#fff" />
              )}
              <span>刷新模型列表</span>
            </button>

            {models.length > 0 && (
              <div className="models-info">
                <CheckOne theme="outline" size="16" fill="#52c41a" />
                <span>已获取 {models.length} 个模型</span>
              </div>
            )}
          </div>

          <div className="setting-section">
            <h3>关于</h3>
            <div className="about-info">
              <p><strong>Mini Bot</strong> - 轻量级 AI 聊天助手</p>
              <p>版本: 0.1.0 (MVP)</p>
              <p className="privacy">所有数据仅存储在本地，绝不上传到服务器</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>取消</button>
          <button className="save-btn" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
