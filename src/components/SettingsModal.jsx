import { useState } from 'react'
import { Close, Api, Refresh, CheckOne, Loading, Download, Upload, 
  Connection, Delete, Sun, Moon, Setting, Search
} from '@icon-park/react'
import useStore from '../store/useStore'
import { fetchModels, testConnection } from '../utils/api'
import './SettingsModal.css'

function SettingsModal({ onClose }) {
  const { apiConfig, setApiConfig, setModels, models, theme, setTheme, exportData, importData, clearAllData, tavilyConfig, setTavilyConfig } = useStore()
  const [baseUrl, setBaseUrl] = useState(apiConfig.baseUrl || '')
  const [apiKey, setApiKey] = useState(apiConfig.apiKey || '')
  const [tavilyEnabled, setTavilyEnabled] = useState(tavilyConfig.enabled || false)
  const [tavilyKey, setTavilyKey] = useState(tavilyConfig.apiKey || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [connectionTest, setConnectionTest] = useState(null)
  const [testing, setTesting] = useState(false)

  const handleRefreshModels = async () => {
    if (!baseUrl || !apiKey) {
      setError('请填写完整的配置信息')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setConnectionTest(null)

    try {
      const fetchedModels = await fetchModels(baseUrl, apiKey)
      setApiConfig({ baseUrl, apiKey })
      setModels(fetchedModels)
      setSuccess('模型列表已更新')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message || '获取模型列表失败')
    } finally {
      setLoading(false)
    }
  }
  
  const handleTestConnection = async () => {
    if (!baseUrl || !apiKey) {
      setError('请填写完整的配置信息')
      return
    }
    
    setTesting(true)
    setError('')
    
    try {
      const result = await testConnection(baseUrl, apiKey)
      setConnectionTest(result)
    } catch (err) {
      setConnectionTest({ success: false, error: err.message })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    setApiConfig({ baseUrl, apiKey })
    setTavilyConfig({ enabled: tavilyEnabled, apiKey: tavilyKey })
    onClose()
  }
  
  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mini-bot-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setSuccess('数据已导出')
    setTimeout(() => setSuccess(''), 2000)
  }
  
  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (confirm('导入将覆盖当前所有数据，确定继续？')) {
          importData(data)
          setSuccess('数据已导入，页面将刷新')
          setTimeout(() => window.location.reload(), 1000)
        }
      } catch (err) {
        setError('导入失败：文件格式错误')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }
  
  const handleClearAll = () => {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      if (confirm('再次确认：所有 Bot、对话记录、设置都将被删除！')) {
        clearAllData()
        setSuccess('数据已清空，页面将刷新')
        setTimeout(() => window.location.reload(), 1000)
      }
    }
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
            {success && <div className="success-message">{success}</div>}
            
            <div className="button-row">
              <button 
                className="test-btn"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? (
                  <Loading theme="outline" size="18" fill="#fff" />
                ) : (
                  <Connection theme="outline" size="18" fill="#fff" />
                )}
                <span>测试连接</span>
              </button>
              
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
            </div>
            
            {connectionTest && (
              <div className={`connection-result ${connectionTest.success ? 'success' : 'error'}`}>
                {connectionTest.success ? (
                  <>
                    <CheckOne theme="outline" size="16" fill="#52c41a" />
                    <span>连接成功 · 响应时间 {connectionTest.responseTime}ms · 发现 {connectionTest.modelCount} 个模型</span>
                  </>
                ) : (
                  <>
                    <Close theme="outline" size="16" fill="#ff4d4f" />
                    <span>{connectionTest.error}</span>
                  </>
                )}
              </div>
            )}

            {models.length > 0 && (
              <div className="models-info">
                <CheckOne theme="outline" size="16" fill="#52c41a" />
                <span>已获取 {models.length} 个模型</span>
              </div>
            )}
          </div>

          <div className="setting-section">
            <h3>主题</h3>
            <div className="theme-options">
              <button 
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <Sun theme="outline" size="18" />
                <span>浅色</span>
              </button>
              <button 
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <Moon theme="outline" size="18" />
                <span>深色</span>
              </button>
              <button 
                className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                onClick={() => setTheme('system')}
              >
                <Setting theme="outline" size="18" />
                <span>跟随系统</span>
              </button>
            </div>
          </div>

          <div className="setting-section">
            <h3>
              <Search theme="outline" size="18" fill="#4a90e2" />
              网页搜索 (Tavily)
            </h3>
            <div className="form-group toggle-group">
              <label>启用网页搜索</label>
              <button 
                className={`toggle-btn ${tavilyEnabled ? 'active' : ''}`}
                onClick={() => setTavilyEnabled(!tavilyEnabled)}
              >
                {tavilyEnabled ? '开启' : '关闭'}
              </button>
            </div>
            {tavilyEnabled && (
              <div className="form-group">
                <label>Tavily API Key</label>
                <input
                  type="password"
                  value={tavilyKey}
                  onChange={(e) => setTavilyKey(e.target.value)}
                  placeholder="tvly-..."
                />
                <span className="hint">
                  获取 API Key: <a href="https://tavily.com" target="_blank" rel="noopener noreferrer">tavily.com</a>
                </span>
              </div>
            )}
            <span className="hint">开启后，Bot 可根据需要自动搜索互联网获取最新信息</span>
          </div>

          <div className="setting-section">
            <h3>数据管理</h3>
            <div className="data-actions">
              <button className="export-btn" onClick={handleExport}>
                <Download theme="outline" size="18" fill="#4a90e2" />
                <span>导出备份</span>
              </button>
              <label className="import-btn">
                <Upload theme="outline" size="18" fill="#4a90e2" />
                <span>导入恢复</span>
                <input type="file" accept=".json" onChange={handleImport} hidden />
              </label>
              <button className="clear-btn" onClick={handleClearAll}>
                <Delete theme="outline" size="18" fill="#ff4d4f" />
                <span>清空数据</span>
              </button>
            </div>
            <span className="hint">所有数据仅存储在本地浏览器中</span>
          </div>

          <div className="setting-section">
            <h3>关于</h3>
            <div className="about-info">
              <p><strong>Mini Bot</strong> - 轻量级 AI 聊天助手</p>
              <p>版本: 0.2.0</p>
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
