import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
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
      theme: 'system', // 'light' | 'dark' | 'system'
      
      // 设置 API 配置
      setApiConfig: (config) => set({ apiConfig: config }),
      
      // 设置模型列表
      setModels: (models) => set({ models }),
      
      // 创建新 Bot
      createBot: (bot) => {
        const newBot = {
          id: Date.now().toString(),
          name: bot.name || '新助手',
          avatar: bot.avatar || '',
          systemPrompt: bot.systemPrompt || '你是一个有帮助的AI助手。',
          model: bot.model || '',
          temperature: bot.temperature || 0.7,
          maxTokens: bot.maxTokens || 2000,
          contextRounds: bot.contextRounds ?? 10, // 上下文轮数，0表示不限制
          memory: bot.memory || '', // 长期记忆字段
          createdAt: Date.now(),
          lastActiveAt: Date.now(), // 最近活动时间
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
        set((state) => {
          const bot = state.bots.find(b => b.id === botId)
          return {
            conversations: {
              ...state.conversations,
              [botId]: [...(state.conversations[botId] || []), message]
            },
            // 更新 Bot 的最近活动时间
            bots: state.bots.map(b => 
              b.id === botId ? { ...b, lastActiveAt: Date.now() } : b
            )
          }
        })
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
      
      // 分支对话：从指定消息创建新会话
      forkConversation: (fromBotId, fromIndex, newBotName) => {
        const state = get()
        const messages = state.conversations[fromBotId] || []
        const forkedMessages = messages.slice(0, fromIndex + 1)
        const sourceBot = state.bots.find(b => b.id === fromBotId)
        
        const newBot = {
          id: Date.now().toString(),
          name: newBotName || `${sourceBot?.name || 'Bot'} (分支)`,
          avatar: sourceBot?.avatar || '',
          systemPrompt: sourceBot?.systemPrompt || '你是一个有帮助的AI助手。',
          model: sourceBot?.model || '',
          temperature: sourceBot?.temperature || 0.7,
          maxTokens: sourceBot?.maxTokens || 2000,
          contextRounds: sourceBot?.contextRounds ?? 10,
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
          theme: state.theme
        }
      },
      
      // 导入数据
      importData: (data) => {
        set({
          apiConfig: data.apiConfig || { baseUrl: '', apiKey: '' },
          bots: data.bots || [],
          conversations: data.conversations || {},
          theme: data.theme || 'system'
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
          theme: 'system'
        })
      }
    }),
    {
      name: 'mini-bot-storage',
      version: 1,
      migrate: (persistedState, version) => {
        // 迁移旧版本数据
        return persistedState
      }
    }
  )
)

export default useStore
