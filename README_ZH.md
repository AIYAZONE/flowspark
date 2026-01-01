# Goal System (Personal Growth OS)

[English](README.md) | **中文**

一个极简、聚焦、可视化的个人目标管理系统，旨在帮助你将野心转化为现实。基于 Next.js 16 和 Supabase 构建。

## ✨ 功能特性

- **🎯 目标管理**：创建、追踪和管理你的长期目标，设定开始/结束日期和成功标准。
- **⚡️ 今日聚焦**：设定每日的“核心行动”，确保你始终在向前迈进。
- **📊 量化成长**：
  - **每日评分**：对你的一天进行评分 (1-5)，追踪主观表现。
  - **连胜统计**：通过连胜追踪和里程碑可视化你的坚持。
  - **趋势分析**：查看最近 30 天的表现趋势。
- **🔐 安全认证**：基于 Supabase Auth 的完整注册、登录和密码重置流程。
- **🌍 国际化**：内置英文和简体中文支持。
- **🌗 暗黑模式**：完美支持深色主题。

## 🛠 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) (App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI 组件**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/)
- **图表**: [Recharts](https://recharts.org/)
- **后端 & 认证**: [Supabase](https://supabase.com/)
- **状态管理**: Zustand
- **日期处理**: date-fns

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm, pnpm, 或 yarn
- 一个 Supabase 项目

### 安装步骤

1. **克隆仓库**

   ```bash
   git clone https://github.com/AIYAZONE/goals.git
   cd goals
   ```

2. **安装依赖**

   ```bash
   npm install
   # 或
   pnpm install
   ```

3. **环境配置**

   在根目录创建一个 `.env.local` 文件并添加你的 Supabase 凭证：

   ```env
   NEXT_PUBLIC_SUPABASE_URL=你的_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
   ```

4. **数据库设置**

   请参考 [Supabase 数据库初始化指南](supabase/README.md)，其中包含了设置数据库表、RLS 策略和存储桶的详细说明。

5. **启动开发服务器**

   ```bash
   npm run dev
   ```

   在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 📂 项目结构

```text
src/
├── app/                 # Next.js App Router 页面和布局
│   ├── (authenticated)/ # 受保护的路由 (仪表盘, 目标等)
│   ├── auth/            # 认证路由 (登录, 注册等)
│   └── api/             # API 路由
├── components/          # React 组件
│   ├── ui/              # 可复用的 UI 组件
│   └── ...              # 功能特定组件
├── lib/                 # 工具函数和 Supabase 客户端
├── i18n/                # 国际化文件 (en.json, zh.json)
└── ...
```

## 🤝 贡献

欢迎提交 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证。
