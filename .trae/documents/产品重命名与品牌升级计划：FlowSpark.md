# 产品重命名与品牌升级计划：FlowSpark

根据您的要求，我将废弃平庸的 "Goal System" 名称，正式将产品重命名为 **"FlowSpark"**，并建议配套使用子域名 `flowspark.aiyazone.com`。

这个名字完美契合我们最新的产品愿景：
*   **Flow (心流)**: 代表我们希望用户进入的专注、忘我、高效的行动状态。
*   **Spark (火花)**: 代表 AI 带来的灵感激发、变量奖励带来的惊喜瞬间，以及打破常规的动力源泉。

## 执行计划

### 1. 代码层面的品牌替换
我们将修改前端 UI 中显示的所有品牌名称。
*   **修改组件**: `src/components/BrandLogo.tsx`
    *   将 `<span>Goal System</span>` 更改为 `<span>FlowSpark</span>`。
*   **修改元数据**: `src/app/layout.tsx`
    *   `title` 引用了字典，需修改字典文件。
*   **修改 PWA 配置**: `src/app/manifest.ts`
    *   `name`: "Goal System" -> "FlowSpark"
    *   `short_name`: "Goals" -> "FlowSpark"
*   **国际化文案替换**: `src/i18n/en.json` & `src/i18n/zh.json`
    *   `common.metaTitle`: "Goal System" -> "FlowSpark" / "FlowSpark"
    *   `sidebar.brand`: "Goal System" -> "FlowSpark" / "FlowSpark"
    *   `landing.hero.badge`: "Personal Growth OS" -> "FlowSpark OS" (可选)
    *   `landing.footer`: "Goal System" -> "FlowSpark"

### 2. 域名与环境配置更新
*   **代码配置**: `src/lib/get-site-url.ts`
    *   将默认的 `https://goals.aiyazone.com` 更新为 `https://flowspark.aiyazone.com`，以匹配新的品牌建议。
*   **部署建议 (User Action Required)**:
    *   建议您在 DNS 提供商处将 `flowspark.aiyazone.com` CNAME 指向 Vercel。
    *   在 Vercel 项目设置中添加新域名。

### 3. 文档层面的全面刷新
我们将更新核心文档中的产品名称，以保持一致性。
*   **README**: `00 README.md`
*   **路线图**: `产品 - 01 产品路线图.md`
*   **需求文档**: `产品 - 02 MVP产品需求文档.md`
*   **架构文档**: `技术 - 04 技术架构.md`

---

**您是否同意我执行上述代码和文档的修改？**