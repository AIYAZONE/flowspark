# 文档索引与维护规范 (Project: FlowSpark)

## 目录分组

* 产品

  * [01 产品路线图.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/产品/01%20产品路线图.md)
    - 摘要：阶段目标与成功度量、风险与依赖

  * [02 MVP产品需求文档.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/产品/02%20MVP产品需求文档.md)
    - 摘要：MVP 范围、页面与流程、验收与 NFR

  * [05 着陆页设计与实现.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/产品/05%20着陆页设计与实现.md)
    - 摘要：Hero/Features/SEO，科技感与性能预算

  * [10 用户画像与用例.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/产品/10%20用户画像与用例.md)
    - 摘要：画像、关键场景、任务流与成功指标

  * [15 市场与竞品分析.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/产品/15%20市场与竞品分析.md)
    - 摘要：功能/体验/定价对比与差异化策略（占位）

* 设计

  * [03 UI\_UX设计规范.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/设计/03%20UI_UX设计规范.md)
    - 摘要：色彩与排版、组件与动效、无障碍与图表准则

  * [16 设计资产索引.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/设计/16%20设计资产索引.md)
    - 摘要：组件清单、图标与插画、配色 Token

  * [13 文案与术语规范.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/设计/13%20文案与术语规范.md)
    - 摘要：品牌语调、术语表、i18n 键与常见提示语

* 技术

  * [04 技术架构.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/技术/04%20技术架构.md)
    - 摘要：App Router + Supabase 架构，交互与错误分层

  * [06 账户管理体系（MVP）规划.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/技术/06%20账户管理体系（MVP）规划.md)
    - 摘要：认证/授权/RLS、页面闭环、邮件回跳与中间件

  * [07 非功能性需求规范.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/技术/07%20非功能性需求规范.md)
    - 摘要：性能/可靠性/安全/可维护性与可用性预算

  * [08 API与数据字典.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/技术/08%20API与数据字典.md)
    - 摘要：Server Actions 契约、错误码、枚举与字段

  * [09 运维与监控.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/技术/09%20运维与监控.md)
    - 摘要：日志最小化、SLI 监控与告警、备份与回滚

  * [11 测试与质量策略.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/技术/11%20测试与质量策略.md)
    - 摘要：Vitest/Playwright、CI 集成、覆盖率与回归

  * [18 架构决策记录（ADR）指南.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/技术/18%20架构决策记录（ADR）指南.md)
    - 摘要：记录重大技术决策与权衡，形成可追溯依据

* 运营与交付

  * [CHANGELOG.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/运营与交付/CHANGELOG.md)
    - 摘要：记录文档与发布变更，包含影响范围与回滚指引

  * [17 发布与版本管理.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/运营与交付/17%20发布与版本管理.md)
    - 摘要：语义化版本、预览到生产流程、灰度与回滚

  * [14 支持与反馈流程.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/运营与交付/14%20支持与反馈流程.md)
    - 摘要：收集渠道、优先级时效、工单闭环与 FAQ

  * [12 安全与合规策略.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/运营与交付/12%20安全与合规策略.md)
    - 摘要：隐私与合规路线、风控与速率、审计与责任分工

## 命名与编号

* 文件名：中文主标题，短横线分隔；必要时附英文副标题

* 编号：00 索引，01-产品，02-设计，03-技术，04-运营；新增文档按序递增

## 版本与变更

* 每次重要更新在 CHANGELOG.md 登记：日期、作者、摘要

* 文档页头建议包含版本/日期/作者信息

## 评审流程

* 新文档或重大改动进行轻量评审：产品/设计/技术各一人

* 通过后合入；在索引处更新分组链接

## 模板

* 模板位置：`/Users/brucewang/Documents/AIYA/goals/.trae/documents/templates/`

* 包含：PRD模板、API字典模板、架构说明模板、测试计划模板
