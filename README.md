# KiwiVM Dashboard

一个简单的 KiwiVM（搬瓦工）VPS 管理仪表板，基于 Next.js 构建，提供直观的服务器监控和管理功能。

## ✨ 功能特性

- 🖥️ **多服务器管理** - 同时管理多个 KiwiVM 服务器实例
- 📊 **实时监控** - CPU 使用率、网络流量、磁盘 I/O 等关键指标的实时图表
- 🎛️ **服务器控制** - 启动、停止、重启服务器操作
- 🌙 **深色模式** - 支持明暗主题切换
- 📱 **响应式设计** - 适配桌面和移动端设备
- 🔄 **自动刷新** - 定时获取最新的服务器状态
- 🔐 **安全存储** - 本地存储 API 凭证，不会上传到服务器

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- pnpm、npm 或 yarn 包管理器

### 安装依赖

```bash
pnpm install
# 或
npm install
# 或
yarn install
```

### 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
# 或
yarn dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
pnpm build
pnpm start
# 或
npm run build
npm start
```

## 📖 使用指南

### 添加服务器

1. 点击页面右上角的"添加服务器"按钮
2. 输入服务器名称、VEID 和 API Key
3. 点击"添加"完成配置

### 获取 API 凭证

1. 登录 [BandwagonHost 控制面板](https://bwh81.net/clientarea.php)
2. 进入你的 VPS 服务详情页面
3. 在 "KiwiVM Control Panel" 中找到 API 相关信息：
   - VEID: 虚拟机 ID
   - API Key: 在控制面板中生成

### 监控功能

- **CPU 使用率**: 实时显示 CPU 负载情况
- **网络流量**: 入站和出站网络流量统计
- **磁盘 I/O**: 磁盘读写操作监控
- **服务器状态**: 显示服务器运行状态和基本信息

## 🛠️ 技术栈

- **框架**: [Next.js 15](https://nextjs.org/) with App Router
- **语言**: TypeScript
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **UI 组件**: [Radix UI](https://radix-ui.com/)
- **图表**: [Recharts](https://recharts.org/)
- **主题**: [next-themes](https://github.com/pacocoursey/next-themes)
- **通知**: [Sonner](https://sonner.emilkowal.ski/)
- **图标**: [Lucide React](https://lucide.dev/)


## 🔒 安全说明

- API 凭证仅存储在浏览器本地存储中
- 所有 API 请求通过 Next.js API 路由代理，不会暴露凭证
- 支持多个服务器配置的独立管理
