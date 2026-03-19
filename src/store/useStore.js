import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // API 配置
      apiConfig: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
      },
      models: [],
      
      // Bot 列表
      bots: [],
      currentBotId: null,
      
      // 聊天记录 { botId: [messages] }
      conversations: {},
      
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
          createdAt: Date.now(),
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
          }
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
            content
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
        set((state) => ({
          conversations: {
            ...state.conversations,
            [botId]: state.conversations[botId].filter((_, i) => i !== messageIndex)
          }
        }))
      }
    }),
    {
      name: 'mini-bot-storage',
    }
  )
)

export default useStore
