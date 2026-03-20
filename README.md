# Mini Bot

轻量级 AI 聊天助手，连接你的专属 AI 伙伴。

## 功能特性

- **API 配置**：支持自定义 Base URL 和 API Key，兼容 OpenAI 格式的所有中转 API
- **模型管理**：一键获取模型列表，随时切换模型
- **Bot 管理**：创建多个独立的 Bot 实例，每个 Bot 拥有独立的设置和聊天记录
- **人格设定**：自定义 System Prompt，设定 Bot 的行为逻辑、语气、身份
- **参数调节**：Temperature、Max Tokens、上下文轮数等参数可调节
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
├── package.json         # 项目配置
└── LICENSE              # 开源许可证
```

## 使用说明

1. **首次使用**：点击左侧「全局设置」，配置 API Base URL 和 API Key
2. **获取模型**：配置完成后点击「刷新模型列表」获取可用模型
3. **创建 Bot**：点击左侧「新建 Bot」按钮，输入名称和人格设定
4. **选择模型**：在聊天窗口顶部下拉菜单中选择要使用的模型
5. **开始对话**：在输入框输入消息，按 Enter 发送，Shift+Enter 换行

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
- [ ] Phase 3: 跨平台打包（Tauri）、语音输入/输出、多模态支持

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

[MIT License](./LICENSE)
