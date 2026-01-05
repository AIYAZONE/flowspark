# 文档变更日志

## 2026-01-05
- 新增：目标归档功能（后端状态支持 + 前端交互）
- 优化：目标列表 UI（支持分类折叠、归档分组分离、整行点击）
- 修复：Dashboard 目标时间进度显示 NaN 问题
- 修复：AddActionDialog 类型定义错误
- 优化：统一删除与归档按钮的 UI 风格

## 2025-12-30
- 修复：Vercel 构建 TS 报错（today 页使用 dict.common.locale，补充 i18n 键；补充 ScoreCard 与 ActionListFilter 相关键）
- 更新：统一 Action 类型枚举为 {core, maintenance, learning, review, rest}
- 更新：API 与数据字典（submitScore 入参改为 {date, score}，daily_scores 表结构补充 owner_id 兼容）
- 更新：时区工具与“今日”逻辑文档，采用 getUserTimezone/getTodayInTZ/toLocaleDateStringTZ
- 优化：文案与术语规范，补充 common 与 today 关键 i18n 键

## 2025-12-28
- 新增：docs/README 索引与维护规范
- 重命名：05 为“着陆页设计与实现”
- 新增：07 非功能性需求规范、08 API与数据字典、09 运维与监控
- 补充：路线图、PRD、UI/UX、技术架构、账户管理的关键缺失段落
- 新增：10 用户画像与用例、11 测试与质量策略、12 安全与合规策略、13 文案与术语规范、14 支持与反馈流程
- 新增：15 市场与竞品分析（占位）、16 设计资产索引、17 发布与版本管理、18 ADR 指南
- 更新：docs/README 分组索引与编号；为 PRD/技术架构/账户管理添加交叉引用
