import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Type definitions
export interface ApiConfig {
  baseUrl: string
  apiKey: string
}

export interface TavilyConfig {
  enabled: boolean
  apiKey: string
}

export interface Bot {
  id: string
  name: string
  avatar: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  contextRounds: number
  memory: string
  memoryEnabled: boolean
  createdAt: number
  lastActiveAt: number
  isForked?: boolean
  forkedFrom?: string
  pinned?: boolean
}

export interface SearchSource {
  title: string
  url: string
  content: string
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
  sources?: SearchSource[]  // 网页搜索来源
}

export interface StoreState {
  // API 配置
  apiConfig: ApiConfig
  models: Model[]
  
  // Bot 列表
  bots: Bot[]
  currentBotId: string | null
  
  // 聊天记录 { botId: [messages] }
  conversations: Record<string, Message[]>
  
  // 草稿 { botId: draftText }
  drafts: Record<string, string>
  
  // AbortController 用于停止生成
  abortController: AbortController | null
  
  // 主题设置
  theme: 'light' | 'dark' | 'system'
  
  // Tavily 网页搜索配置
  tavilyConfig: TavilyConfig
  
  // Actions
  setApiConfig: (config: ApiConfig) => void
  setModels: (models: Model[]) => void
  createBot: (bot: Partial<Bot>) => string
  updateBot: (botId: string, updates: Partial<Bot>) => void
  deleteBot: (botId: string) => void
  setCurrentBot: (botId: string | null) => void
  addMessage: (botId: string, message: Message) => void
  updateLastMessage: (botId: string, content: string) => void
  updateLastMessageSources: (botId: string, sources: SearchSource[]) => void
  clearConversation: (botId: string) => void
  deleteMessage: (botId: string, messageIndex: number) => void
  updateMessage: (botId: string, messageIndex: number, newContent: string) => void
  deleteMessagesFrom: (botId: string, fromIndex: number) => void
  setAbortController: (controller: AbortController | null) => void
  stopGeneration: () => void
  setDraft: (botId: string, text: string) => void
  getDraft: (botId: string) => string
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setTavilyConfig: (config: TavilyConfig) => void
  forkConversation: (fromBotId: string, fromIndex: number, newBotName?: string) => string | null
  exportData: () => ExportData
  importData: (data: Partial<ExportData>) => void
  clearAllData: () => void
}

export interface Model {
  id: string
  name?: string
  isMultimodal: boolean
  [key: string]: unknown
}

export interface ExportData {
  version: string
  exportedAt: string
  apiConfig: ApiConfig
  bots: Bot[]
  conversations: Record<string, Message[]>
  theme: 'light' | 'dark' | 'system'
  tavilyConfig: TavilyConfig
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // API 配置
      apiConfig: {
        baseUrl: '',
        apiKey: '',
      },
      models: [],
      
      // Bot 列表
      bots: [],
      currentBotId: null,
      
      // 聊天记录 { botId: [messages] }
      conversations: {},
      
      // 草稿 { botId: draftText }
      drafts: {},
      
      // AbortController 用于停止生成
      abortController: null,
      
      // 主题设置
      theme: 'system',
      
      // Tavily 网页搜索配置
      tavilyConfig: {
        enabled: false,
        apiKey: '',
      },
      
      // 设置 API 配置
      setApiConfig: (config) => set({ apiConfig: config }),
      
      // 设置模型列表
      setModels: (models) => set({ models }),
      
      // 创建新 Bot
      createBot: (bot) => {
        const newBot: Bot = {
          id: Date.now().toString(),
          name: bot.name || '新助手',
          avatar: bot.avatar || '',
          systemPrompt: bot.systemPrompt || '你是一个有帮助的AI助手。',
          model: bot.model || '',
          temperature: bot.temperature || 0.7,
          maxTokens: bot.maxTokens || 2000,
          contextRounds: bot.contextRounds ?? 10,
          memory: bot.memory || '',
          memoryEnabled: bot.memoryEnabled ?? false,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        }
        set((state) => ({
          bots: [...state.bots, newBot],
          currentBotId: newBot.id,
          conversations: { ...state.conversations, [newBot.id]: [] }
        }))
        return newBot.id
      },
      
      // 更新 Bot
      updateBot: (botId, updates) => {
        set((state) => ({
          bots: state.bots.map(bot => 
            bot.id === botId ? { ...bot, ...updates } : bot
          )
        }))
      },
      
      // 删除 Bot
      deleteBot: (botId) => {
        set((state) => {
          const newConversations = { ...state.conversations }
          delete newConversations[botId]
          return {
            bots: state.bots.filter(bot => bot.id !== botId),
            conversations: newConversations,
            currentBotId: state.currentBotId === botId ? null : state.currentBotId
          }
        })
      },
      
      // 选择当前 Bot
      setCurrentBot: (botId) => set({ currentBotId: botId }),
      
      // 添加消息
      addMessage: (botId, message) => {
        set((state) => ({
          conversations: {
            ...state.conversations,
            [botId]: [...(state.conversations[botId] || []), message]
          },
          // 更新 Bot 的最近活动时间
          bots: state.bots.map(b => 
            b.id === botId ? { ...b, lastActiveAt: Date.now() } : b
          )
        }))
      },
      
      // 更新最后一条消息（用于流式输出）
      updateLastMessage: (botId, content) => {
        set((state) => {
          const messages = state.conversations[botId] || []
          if (messages.length === 0) return state
          
          const newMessages = [...messages]
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: `${newMessages[newMessages.length - 1].content || ''}${content || ''}`
          }
          
          return {
            conversations: {
              ...state.conversations,
              [botId]: newMessages
            }
          }
        })
      },
      
      // 更新最后一条消息的来源（用于网页搜索）
      updateLastMessageSources: (botId, sources) => {
        set((state) => {
          const messages = state.conversations[botId] || []
          if (messages.length === 0) return state
          
          const newMessages = [...messages]
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            sources
          }
          
          return {
            conversations: {
              ...state.conversations,
              [botId]: newMessages
            }
          }
        })
      },
      
      // 清空对话
      clearConversation: (botId) => {
        set((state) => ({
          conversations: {
            ...state.conversations,
            [botId]: []
          }
        }))
      },
      
      // 删除消息
      deleteMessage: (botId, messageIndex) => {
        set((state) => {
          const messages = state.conversations[botId] || []
          // 边界检查
          if (messageIndex < 0 || messageIndex >= messages.length) return state
          
          return {
            conversations: {
              ...state.conversations,
              [botId]: messages.filter((_, i) => i !== messageIndex)
            }
          }
        })
      },
      
      // 更新消息（用于编辑后重发）
      updateMessage: (botId, messageIndex, newContent) => {
        set((state) => {
          const messages = state.conversations[botId] || []
          // 边界检查
          if (messageIndex < 0 || messageIndex >= messages.length) return state
          
          const newMessages = [...messages]
          newMessages[messageIndex] = { ...newMessages[messageIndex], content: newContent }
          return {
            conversations: {
              ...state.conversations,
              [botId]: newMessages
            }
          }
        })
      },
      
      // 删除消息及其后续所有消息
      deleteMessagesFrom: (botId, fromIndex) => {
        set((state) => {
          const messages = state.conversations[botId] || []
          // 边界检查：fromIndex 超出范围时不做任何操作
          if (fromIndex < 0 || fromIndex > messages.length) return state
          
          return {
            conversations: {
              ...state.conversations,
              [botId]: messages.slice(0, fromIndex)
            }
          }
        })
      },
      
      // 设置 AbortController
      setAbortController: (controller) => set({ abortController: controller }),
      
      // 停止生成
      stopGeneration: () => {
        const { abortController } = get()
        if (abortController) {
          abortController.abort()
          set({ abortController: null })
        }
      },
      
      // 草稿管理
      setDraft: (botId, text) => {
        set((state) => ({
          drafts: { ...state.drafts, [botId]: text }
        }))
      },
      
      getDraft: (botId) => {
        return get().drafts[botId] || ''
      },
      
      // 主题管理
      setTheme: (theme) => set({ theme }),
      
      // Tavily 配置管理
      setTavilyConfig: (config) => set({ tavilyConfig: config }),
      
      // 分支对话：从指定消息创建新会话
      forkConversation: (fromBotId, fromIndex, newBotName) => {
        const state = get()
        const messages = state.conversations[fromBotId] || []
        const sourceBot = state.bots.find(b => b.id === fromBotId)
        
        // 验证：源 Bot 不存在或消息索引越界时返回 null
        if (!sourceBot || fromIndex < 0 || fromIndex >= messages.length) {
          return null
        }
        
        const forkedMessages = messages.slice(0, fromIndex + 1)
        
        const newBot: Bot = {
          id: Date.now().toString(),
          name: newBotName || `${sourceBot.name} (分支)`,
          avatar: sourceBot.avatar || '',
          systemPrompt: sourceBot.systemPrompt || '你是一个有帮助的AI助手。',
          model: sourceBot.model || '',
          temperature: sourceBot.temperature || 0.7,
          maxTokens: sourceBot.maxTokens || 2000,
          contextRounds: sourceBot.contextRounds ?? 10,
          memory: sourceBot.memory || '',
          memoryEnabled: sourceBot.memoryEnabled ?? false,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          isForked: true,
          forkedFrom: fromBotId
        }
        
        set((state) => ({
          bots: [...state.bots, newBot],
          currentBotId: newBot.id,
          conversations: { ...state.conversations, [newBot.id]: forkedMessages }
        }))
        
        return newBot.id
      },
      
      // 导出数据
      exportData: () => {
        const state = get()
        return {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          apiConfig: state.apiConfig,
          bots: state.bots,
          conversations: state.conversations,
          theme: state.theme,
          tavilyConfig: state.tavilyConfig
        }
      },
      
      // 导入数据
      importData: (data) => {
        set({
          apiConfig: data.apiConfig || { baseUrl: '', apiKey: '' },
          bots: data.bots || [],
          conversations: data.conversations || {},
          theme: data.theme || 'system',
          tavilyConfig: data.tavilyConfig || { enabled: false, apiKey: '' }
        })
      },
      
      // 清空所有数据
      clearAllData: () => {
        set({
          apiConfig: { baseUrl: '', apiKey: '' },
          bots: [],
          currentBotId: null,
          conversations: {},
          drafts: {},
          models: [],
          theme: 'system',
          tavilyConfig: { enabled: false, apiKey: '' }
        })
      }
    }),
    {
      name: 'mini-bot-storage',
      version: 1,
      migrate: (persistedState) => {
        // 迁移旧版本数据
        return persistedState
      }
    }
  )
)

export default useStore
