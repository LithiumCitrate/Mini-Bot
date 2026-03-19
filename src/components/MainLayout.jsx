import { useState } from 'react'
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

  const currentBot = bots.find(bot => bot.id === currentBotId)

  return (
    <div className="main-layout">
      <div className={`bot-list-panel ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
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
