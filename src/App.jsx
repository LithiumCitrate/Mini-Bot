import { useEffect } from 'react'
import MainLayout from './components/MainLayout'
import useStore from './store/useStore'
import './App.css'

function App() {
  const { theme } = useStore()
  
  useEffect(() => {
    const applyTheme = () => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
      } else {
        document.documentElement.setAttribute('data-theme', theme)
      }
    }
    
    applyTheme()
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', applyTheme)
    
    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [theme])
  
  return (
    <div className="app">
      <MainLayout />
    </div>
  )
}

export default App
