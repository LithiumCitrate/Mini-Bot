import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import BotList from './BotList'
import ChatWindow from './ChatWindow'
import SettingsModal from './SettingsModal'
import BotSettingsModal from './BotSettingsModal'
import './MainLayout.css'

function MainLayout() {
  const { currentBotId, bots } = useStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showBotSettings, setShowBotSettings] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const currentBot = bots.find(bot => bot.id === currentBotId)

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 768)
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    window.addEventListener('orientationchange', updateIsMobile)
    return () => {
      window.removeEventListener('resize', updateIsMobile)
      window.removeEventListener('orientationchange', updateIsMobile)
    }
  }, [])

  useEffect(() => {
    if (isMobile && !currentBotId) {
      setIsMobileMenuOpen(true)
    }
  }, [isMobile, currentBotId])

  const showBotListAsMain = isMobile && !currentBotId

  return (
    <div className={`main-layout ${showBotListAsMain ? 'mobile-botlist-only' : ''}`}>
      {/* Mobile overlay */}
      {isMobileMenuOpen && !showBotListAsMain && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div className={`bot-list-panel ${(isMobileMenuOpen || showBotListAsMain) ? 'mobile-open' : ''}`}>
        <BotList 
          onSettingsClick={() => setShowSettings(true)}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      <div className="chat-panel">
        <ChatWindow 
          onBotSettingsClick={() => setShowBotSettings(true)}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showBotSettings && currentBot && (
        <BotSettingsModal 
          bot={currentBot}
          onClose={() => setShowBotSettings(false)} 
        />
      )}
    </div>
  )
}

export default MainLayout
