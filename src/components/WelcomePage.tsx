import { useState } from 'react'
import { Robot, Api, Key, CheckOne } from '@icon-park/react'
import useStore from '../store/useStore'
import { fetchModels } from '../utils/api'
import './WelcomePage.css'

interface WelcomePageProps {
  onConfigured: () => void
}

function WelcomePage({ onConfigured }: WelcomePageProps) {
  const { setApiConfig, setModels } = useStore()
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    if (!baseUrl || !apiKey) {
      setError('请填写完整的配置信息')
      return
    }

    setLoading(true)
    setError('')

    try {
      const models = await fetchModels(baseUrl, apiKey)
      setApiConfig({ baseUrl, apiKey })
      setModels(models)
      onConfigured()
    } catch (err) {
      setError((err as Error).message || '连接失败，请检查配置')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <div className="welcome-header">
          <Robot theme="outline" size="64" fill="#4a90e2" />
          <h1>欢迎使用 Mini Bot</h1>
          <p>轻量级 AI 聊天助手，连接你的专属 AI 伙伴</p>
        </div>

        <div className="welcome-form">
          <div className="form-group">
            <label>
              <Api theme="outline" size="20" fill="#666" />
              <span>API Base URL</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="form-group">
            <label>
              <Key theme="outline" size="20" fill="#666" />
              <span>API Key</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="connect-button" 
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <>加载中...</>
            ) : (
              <>
                <CheckOne theme="outline" size="20" fill="#fff" />
                <span>连接并获取模型</span>
              </>
            )}
          </button>
        </div>

        <div className="welcome-footer">
          <p>所有数据仅存储在本地，绝不上传到服务器</p>
        </div>
      </div>
    </div>
  )
}

export default WelcomePage
