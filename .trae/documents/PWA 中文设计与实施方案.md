# PWA 配置与实现方案

我将为您实施一套完整的 PWA (Progressive Web App) 方案，使应用支持安装到桌面/手机，并具备离线缓存能力。

## 1. 技术选型
*   **核心插件**: 使用 `@ducanh2912/next-pwa`。这是目前社区推荐的适配 Next.js App Router 的 PWA 解决方案。
*   **Manifest 生成**: 使用 Next.js 14+ 原生支持的 `src/app/manifest.ts` 动态生成配置文件。
*   **元数据管理**: 利用 Next.js Metadata API 优化移动端显示效果。

## 2. 实施步骤

### 2.1 安装依赖
安装 PWA 插件：
`npm install @ducanh2912/next-pwa`

### 2.2 配置 Next.js
修改 `next.config.ts`，接入 PWA 插件配置。
- 启用 `dest: 'public'` 自动生成 Service Worker。
- 配置开发环境默认禁用（避免调试缓存干扰），生产环境启用。

### 2.3 创建 Manifest 文件
新建 `src/app/manifest.ts`：
- 定义应用名称 ("Goal System")。
- 设置主题色和背景色。
- 配置 `standalone` 显示模式（隐藏浏览器地址栏，提供原生体验）。
- 定义图标路径（指向 `public/icons`）。

### 2.4 准备图标资源
- 创建 `public/icons` 目录。
- **注意**: 由于我无法生成图像文件，我将创建脚本或占位符逻辑，并建议您后续替换为设计好的 Logo（需准备 192x192 和 512x512 尺寸的 PNG 图片）。暂时我们将复用现有的 SVG 或使用占位路径。

### 2.5 优化元数据 (Layout)
修改 `src/app/layout.tsx`：
- 添加 `apple-mobile-web-app` 相关配置（状态栏颜色、标题）。
- 确保 `viewport` 设置适配移动端禁止缩放（可选，视需求而定）。

### 2.6 更新 Git 忽略配置
修改 `.gitignore`，忽略 PWA 自动生成的 `sw.js` 和 `workbox-*.js` 文件，避免提交构建产物。

## 3. 预期效果
- **可安装**: 浏览器地址栏出现“安装”图标；手机 Safari/Chrome 可“添加到主屏幕”。
- **离线访问**: 应用核心页面会被缓存，断网后仍可打开。
- **原生体验**: 启动后无浏览器外框，全屏运行。
