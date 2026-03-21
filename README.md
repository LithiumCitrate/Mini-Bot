# Mini Bot

轻量级 AI 聊天助手，连接你的专属 AI 伙伴。

## 功能特性

- **API 配置**：支持自定义 Base URL 和 API Key，兼容 OpenAI 格式的所有中转 API
- **连接测试**：测试 API 连接状态，查看响应时间和可用模型数
- **模型管理**：一键获取模型列表，随时切换模型
- **多模态支持**：支持图片输入，自动识别多模态模型（GPT-4o、Claude-3、Gemini 等）
- **Bot 管理**：创建多个独立的 Bot 实例，每个 Bot 拥有独立的设置和聊天记录
- **Bot 置顶**：支持置顶常用 Bot，快速访问
- **Bot 搜索**：快速搜索和筛选 Bot
- **人格设定**：自定义 System Prompt，设定 Bot 的行为逻辑、语气、身份
- **长期记忆**：为 Bot 设置持久记忆，在所有对话中保留关键信息
- **网页搜索**：集成 Tavily 搜索，Bot 可自动搜索互联网获取最新信息
- **参数调节**：Temperature、Max Tokens、上下文轮数等参数可调节
- **流式输出**：支持打字机效果，消息实时返回
- **停止生成**：生成过程中可随时停止
- **Markdown 渲染**：支持代码块、表格、列表、数学公式等格式，代码高亮显示
- **消息编辑**：编辑已发送的消息并重新发送
- **重新生成**：对 AI 回复不满意？一键重新生成
- **对话分叉**：从任意消息创建新的对话分支，探索不同方向
- **草稿保存**：切换 Bot 时自动保存输入内容
- **主题切换**：支持浅色/深色/跟随系统三种主题模式
- **数据备份**：导出/导入 JSON 备份文件，轻松迁移数据
- **本地存储**：所有数据仅存储在本地，保护隐私安全
- **响应式设计**：支持桌面端和移动端
- **跨平台打包**：支持 Electron 打包为 Windows 桌面应用

## 技术栈

- **React 18** - UI 框架
- **Vite 5** - 构建工具
- **Zustand** - 状态管理
- **React Markdown** - Markdown 渲染
- **KaTeX** - 数学公式渲染
- **Icon Park** - 图标库
- **Electron** - 桌面应用打包

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
Mini-Bot/
├── src/
│   ├── components/       # UI 组件
│   │   ├── BotList.jsx         # Bot 列表侧边栏
│   │   ├── BotList.css
│   │   ├── ChatWindow.jsx      # 聊天窗口
│   │   ├── ChatWindow.css
│   │   ├── CodeBlock.jsx       # 代码块高亮
│   │   ├── CodeBlock.css
│   │   ├── MainLayout.jsx      # 主布局
│   │   ├── MainLayout.css
│   │   ├── SettingsModal.jsx   # 全局设置弹窗
│   │   ├── SettingsModal.css
│   │   ├── BotSettingsModal.jsx # Bot 设置弹窗
│   │   ├── BotSettingsModal.css
│   │   ├── WelcomePage.jsx     # 欢迎页面
│   │   └── WelcomePage.css
│   ├── store/           # 状态管理
│   │   └── useStore.js       # Zustand store
│   ├── utils/           # 工具函数
│   │   └── api.js            # API 调用
│   ├── App.jsx          # 根组件
│   ├── App.css          # 根样式
│   ├── main.jsx         # 入口文件
│   └── index.css        # 全局样式
├── electron/            # Electron 配置
│   └── main.js          # Electron 主进程
├── index.html           # HTML 模板
├── vite.config.js       # Vite 配置
├── postcss.config.js    # PostCSS 配置
├── package.json         # 项目配置
└── LICENSE              # 开源许可证
```

## 使用说明

1. **首次使用**：点击左侧「全局设置」，配置 API Base URL 和 API Key
2. **测试连接**：点击「测试连接」验证配置是否正确
3. **获取模型**：配置完成后点击「刷新模型列表」获取可用模型
4. **创建 Bot**：点击左侧「新建 Bot」按钮，输入名称和人格设定
5. **选择模型**：在聊天窗口顶部下拉菜单中选择要使用的模型
6. **开始对话**：在输入框输入消息，按 Enter 发送，Shift+Enter 换行

### 高级功能

- **消息编辑**：点击消息下方的编辑图标，修改后重新发送
- **重新生成**：对 AI 回复不满意？点击刷新图标重新生成
- **对话分叉**：点击分叉图标，从当前消息创建新的对话分支
- **停止生成**：生成过程中点击暂停按钮可随时停止
- **长期记忆**：在 Bot 设置中开启记忆功能，Bot 可在对话中自动记录重要信息
- **网页搜索**：在全局设置中配置 Tavily API Key，Bot 可自动搜索互联网获取最新信息
- **多模态对话**：选择支持视觉的模型（如 GPT-4o），点击图片按钮上传图片进行对话
- **Bot 置顶**：点击 Bot 列表中的置顶图标，将常用 Bot 固定在顶部
- **主题切换**：在全局设置中选择浅色/深色/跟随系统主题
- **数据备份**：在全局设置中导出/导入 JSON 备份文件

### 桌面应用

使用 Electron 打包为桌面应用：

```bash
# 开发模式运行 Electron
npm run electron:dev

# 构建生产版本并打包
npm run electron:build
```

## 数据管理

### 数据存储位置

所有数据存储在浏览器的 `localStorage` 中，键名为 `mini-bot-storage`。

### 清除用户数据

#### 方法一：浏览器开发者工具

1. 打开浏览器开发者工具（F12）
2. 切换到 `Application` 或 `存储` 标签页
3. 在左侧找到 `Local Storage` → 当前网站域名
4. 找到 `mini-bot-storage` 键，右键删除

#### 方法二：控制台命令

在浏览器控制台（Console）中执行：

```javascript
localStorage.removeItem('mini-bot-storage')
location.reload()
```

#### 方法三：清除所有本地数据

```javascript
localStorage.clear()
location.reload()
```

### 通过代码修改配置

在浏览器控制台中可以直接修改存储的数据：

```javascript
// 获取当前数据
const data = JSON.parse(localStorage.getItem('mini-bot-storage'))

// 修改 API 配置
data.state.apiConfig.baseUrl = 'https://your-api-endpoint.com/v1'
data.state.apiConfig.apiKey = 'your-api-key'

// 保存修改
localStorage.setItem('mini-bot-storage', JSON.stringify(data))

// 刷新页面生效
location.reload()
```

### 导出/导入数据

```javascript
// 导出所有数据
const exportData = localStorage.getItem('mini-bot-storage')
console.log(exportData)

// 导入数据（将导出的 JSON 字符串粘贴到此处）
localStorage.setItem('mini-bot-storage', '粘贴导出的数据')
location.reload()
```

## 隐私保护

- 所有数据（API Key、聊天记录、Bot 设置）**仅存储在浏览器本地**
- **不会向任何第三方服务器上传用户数据**
- API 请求直接发送到您配置的 API 地址
- 框架本身不收集任何用户信息

## 开发计划

- [x] Phase 1: MVP 版本 - 基础聊天功能
- [x] Phase 2: 上下文记忆、Bot 管理、本地持久化
- [x] Phase 3: 多模态支持、网页搜索、Electron 打包
- [ ] Phase 4: 语音输入/输出、更多 AI 平台支持

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

[MIT License](./LICENSE)
