# Community Web

基于 React + TypeScript + Vite 的 AI Agent 管理前端应用。

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具 (使用 rolldown-vite)
- **Ant Design 6** - UI 组件库
- **TanStack Query (React Query)** - 数据获取和缓存
- **React Router v6** - 路由管理
- **React Markdown** - Markdown 渲染

## 项目结构

```
community-web/
├── public/              # 静态资源目录
│   └── vite.svg        # 网站图标
├── src/                 # 源代码目录
│   ├── api/            # API 接口层
│   │   ├── agent.ts   # Agent 相关接口（创建、更新、删除、列表、运行）
│   │   └── client.ts  # Axios 客户端配置
│   ├── assets/         # 静态资源（图片、字体等）
│   ├── components/     # 通用组件
│   │   ├── ChangeConfirmModal/  # 修改确认弹窗（展示变更对比）
│   │   └── Layout/              # 应用布局（顶部导航、主题切换）
│   ├── contexts/       # React Context
│   │   └── ThemeContext.tsx    # 主题管理（白天/黑夜模式切换）
│   ├── pages/          # 页面组件
│   │   ├── Agent/              # Agent 管理页面
│   │   │   ├── index.tsx            # Agent 列表页
│   │   │   ├── CreateModal.tsx      # 创建 Agent 弹窗
│   │   │   ├── DetailModal.tsx      # Agent 详情/编辑弹窗
│   │   │   └── DeleteConfirmModal.tsx  # 删除确认弹窗
│   │   └── Chat/               # Agent 对话页面
│   │       ├── index.tsx            # 对话主页面
│   │       └── AgentSidebar.tsx     # 左侧 Agent 信息栏（支持编辑）
│   ├── types/          # TypeScript 类型定义
│   │   └── agent.ts   # Agent 相关类型（AgentDetail、CreateAgentReq 等）
│   ├── App.tsx         # 应用根组件（路由配置）
│   ├── main.tsx        # 应用入口文件
│   └── index.css       # 全局样式（主题变量、深色模式）
├── .gitignore          # Git 忽略配置
├── eslint.config.js    # ESLint 配置
├── index.html          # HTML 入口文件
├── package.json        # 项目依赖配置
├── tsconfig.json       # TypeScript 主配置
├── tsconfig.app.json   # 应用 TypeScript 配置
├── tsconfig.node.json  # Node TypeScript 配置
└── vite.config.ts      # Vite 配置
```

## 主要功能

### 1. Agent 管理
- **列表展示**：展示所有 Agent，支持筛选（正常/已删除）
- **创建 Agent**：配置模型、参数、工具、提示词等
- **编辑 Agent**：修改配置，保存时显示变更对比
- **删除 Agent**：3秒倒计时确认，展示完整信息
- **运行 Agent**：跳转到对话页面进行交互

### 2. Agent 对话
- **消息交互**：支持用户消息和 AI 回复
- **Markdown 渲染**：自动渲染消息中的 Markdown 格式
- **左侧信息栏**：实时展示和编辑 Agent 配置
  - 基本信息：名称、描述、创建时间
  - 模型配置：供应商、模型、温度、top_p 等参数
  - 深度思考：推理模式配置
  - 会话配置：会话模式、历史轮数、工具列表
  - 工具配置：知识库检索(KB)、网页搜索(Web)
  - 系统提示词：完整提示词内容

### 3. 主题切换
- **白天模式**：浅色背景，默认配色
- **黑夜模式**：深蓝色调背景（#0b1220, #0f1a2e），护眼舒适
- **状态持久化**：主题选择保存到 localStorage
- **全局适配**：所有组件和弹窗均适配深色模式

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview

# 代码检查
pnpm lint
```

## 环境要求

- Node.js >= 18
- pnpm >= 8

## 后端接口

后端服务地址配置在 `src/api/client.ts`，默认为 `http://localhost:8888`。

主要接口：
- `POST /api/ai/agent/list` - 获取 Agent 列表
- `POST /api/ai/agent/create` - 创建 Agent
- `POST /api/ai/agent/update` - 更新 Agent
- `POST /api/ai/agent/delete` - 删除 Agent
- `POST /api/ai/agent/run` - 运行 Agent
# community-web
