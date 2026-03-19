# Mini Bot

轻量级 AI 聊天助手，连接你的专属 AI 伙伴。

## 功能特性

- **API 配置**：支持自定义 Base URL 和 API Key，兼容 OpenAI 格式的所有中转 API
- **模型管理**：一键获取模型列表，随时切换模型
- **Bot 管理**：创建多个独立的 Bot 实例，每个 Bot 拥有独立的设置和聊天记录
- **人格设定**：自定义 System Prompt，设定 Bot 的行为逻辑、语气、身份
- **参数调节**：Temperature、Max Tokens 等参数可调节
- **流式输出**：支持打字机效果，消息实时返回
- **Markdown 渲染**：支持代码块、表格、列表等格式
- **本地存储**：所有数据仅存储在本地，保护隐私安全
- **响应式设计**：支持桌面端和移动端

## 技术栈

- **React 18** - UI 框架
- **Vite 5** - 构建工具
- **Zustand** - 状态管理
- **React Markdown** - Markdown 渲染
- **Icon Park** - 图标库

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
Mini-Bot/
├── src/
│   ├── components/       # UI 组件
│   │   ├── BotList.jsx       # Bot 列表侧边栏
│   │   ├── ChatWindow.jsx    # 聊天窗口
│   │   ├── WelcomePage.jsx   # 欢迎页/API配置
│   │   ├── SettingsModal.jsx # 全局设置弹窗
│   │   └── BotSettingsModal.jsx # Bot 设置弹窗
│   ├── store/           # 状态管理
│   │   └── useStore.js       # Zustand store
│   ├── utils/           # 工具函数
│   │   └── api.js            # API 调用
│   ├── App.jsx          # 根组件
│   ├── App.css          # 根样式
│   ├── main.jsx         # 入口文件
│   └── index.css        # 全局样式
├── index.html           # HTML 模板
├── vite.config.js       # Vite 配置
├── postcss.config.js    # PostCSS 配置
└── package.json         # 项目配置
```

## 使用说明

1. **首次使用**：输入 API Base URL 和 API Key，点击"连接并获取模型"
2. **创建 Bot**：点击左侧"新建 Bot"按钮，输入名称创建新的 AI 助手
3. **配置 Bot**：点击右上角设置按钮，可修改头像、昵称、人格提示词等
4. **选择模型**：在聊天窗口顶部下拉菜单中选择要使用的模型
5. **开始对话**：在输入框输入消息，按 Enter 发送，Shift+Enter 换行

## 隐私保护

- 所有数据（API Key、聊天记录、Bot 设置）仅存储在浏览器本地
- 不会向任何第三方服务器上传用户数据
- API 请求直接发送到您配置的 API 地址

## 开发计划

- [ ] Phase 2: 本地数据库持久化、上下文记忆
- [ ] Phase 3: 跨平台打包（Tauri）、语音输入/输出、多模态支持

## License

MIT
