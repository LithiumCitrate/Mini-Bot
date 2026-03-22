import { useState } from 'react'
import { Down, Link } from '@icon-park/react'
import { SearchSource } from '../utils/api'
import './SourceCard.css'

interface SourceCardProps {
  sources: SearchSource[]
}

function SourceCard({ sources }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false)
  
  if (!sources || sources.length === 0) return null
  
  // 从 URL 提取域名
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }
  
  return (
    <div className="source-card">
      <button 
        className="source-card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <Link theme="outline" size="14" fill="currentColor" />
        <span className="source-card-title">
          {sources.length} 个来源
        </span>
        <Down 
          theme="outline" 
          size="14" 
          fill="currentColor"
          className={`source-card-arrow ${expanded ? 'expanded' : ''}`}
        />
      </button>
      
      {expanded && (
        <div className="source-card-content">
          {sources.map((source, index) => (
            <a 
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-item"
            >
              <span className="source-index">{index + 1}</span>
              <div className="source-info">
                <span className="source-name">{source.title}</span>
                <span className="source-domain">{getDomain(source.url)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default SourceCard
