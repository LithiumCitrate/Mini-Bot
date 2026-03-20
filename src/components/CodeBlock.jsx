import { useState } from 'react'
import { Copy, CheckOne, Down, Up } from '@icon-park/react'

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  
  // Extract language from className (e.g., "language-javascript")
  const language = className?.replace('language-', '') || 'code'
  const codeContent = String(children).replace(/\n$/, '')
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  // Check if code is long enough to warrant folding
  const lineCount = codeContent.split('\n').length
  const canFold = lineCount > 10
  
  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-language">{language}</span>
        <div className="code-actions">
          {canFold && (
            <button 
              className="code-fold-btn"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? '展开' : '折叠'}
            >
              {collapsed ? (
                <>
                  <Down theme="outline" size="14" fill="#999" />
                  <span>展开 ({lineCount} 行)</span>
                </>
              ) : (
                <>
                  <Up theme="outline" size="14" fill="#999" />
                  <span>折叠</span>
                </>
              )}
            </button>
          )}
          <button 
            className="code-copy-btn"
            onClick={handleCopy}
            title="复制代码"
          >
            {copied ? (
              <>
                <CheckOne theme="outline" size="14" fill="#52c41a" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy theme="outline" size="14" fill="#999" />
                <span>复制</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className={`code-content ${collapsed ? 'collapsed' : ''}`}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

export default CodeBlock
