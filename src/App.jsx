import { useState, useEffect } from 'react'
import useStore from './store/useStore'
import WelcomePage from './components/WelcomePage'
import MainLayout from './components/MainLayout'
import './App.css'

function App() {
  const { apiConfig } = useStore()
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    // 检查是否已配置 API
    if (apiConfig.apiKey && apiConfig.baseUrl) {
      setIsConfigured(true)
    }
  }, [apiConfig])

  return (
    <div className="app">
      {!isConfigured ? (
        <WelcomePage onConfigured={() => setIsConfigured(true)} />
      ) : (
        <MainLayout />
      )}
    </div>
  )
}

export default App
