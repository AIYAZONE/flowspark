## 目标原则

* 简洁高效：登录/注册/找回/重置/退出的最小闭环，页面与流程明确，一页只做一件事

* 安全可控：最小权限、服务端校验、强密码、邮箱确认、Row Level Security 保护用户数据

* 易扩展：在不影响 MVP 的前提下为后续 OAuth、角色权限、审计、风控预留结构

## 架构总览

* 身份与会话：Supabase Auth（Email/Password）+ App Router 中间件进行受保护路由控制

* 数据与权限：Postgres + RLS，所有业务表基于 auth.uid() 做行级保护

* 前端页面：/login、/signup、/forgot、/reset、/profile（已具备大部分能力，继续完善）

* 服务端动作：Next Server Actions 统一入口，所有数据写操作经由服务端动作并做校验

## 环境变量说明与获取

* NEXT\_PUBLIC\_SUPABASE\_URL：Supabase 项目 URL。

  * 获取路径：Supabase 控制台 → 项目 → Settings → API → Project URL。

  * 用途：在客户端/服务端创建 Supabase 客户端时指定后端地址。

* NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY：Supabase 项目匿名公钥（Anon Key）。

  * 获取路径：Supabase 控制台 → 项目 → Settings → API → anon public。仅用于公开环境，不可写入敏感数据。

  * 用途：客户端/服务端创建 Supabase 客户端所需的公开密钥。

* NEXT\_PUBLIC\_SITE\_URL：应用的对外访问完整 URL（含协议），例如 <https://goals.aiya.zone> 或 https\://<vercel-domain>.vercel.app。

  * 获取路径：你的部署平台域名（如 Vercel 项目 Domains）或自定义域名；本地开发使用 <http://localhost:3000。>

  * 用途：找回密码邮件的 redirectTo（Supabase 重置链接回跳地址）、在邮件/外链中生成正确的站点链接。

* 设置位置：

  * 本地开发：项目根目录 .env.local 文件中设置以上变量。

  * 线上部署（Vercel）：Project → Settings → Environment Variables 中分别配置 Production/Preview/Development 三个环境。

* 注意事项：

  * 切勿把服务端高权限的 Service Role Key 暴露到客户端；MVP 不需要该密钥。

  * 变更域名后应同步更新 NEXT\_PUBLIC\_SITE\_URL 以保证重置回跳正确。

## 认证（Auth）

* 登录（/login）：邮箱+密码，服务端动作处理，错误提示与国际化已适配

* 注册（/signup）：邮箱+密码+姓名，支持邮箱确认（无会话时回到登录并提示）

* 找回/重置（/forgot & /reset）：发送重置邮件、更新密码，重置成功 3 秒自动跳转登录

* 退出登录：客户端触发 supabase.auth.signOut() 并刷新页面

* 可选扩展：OAuth（GitHub/Google），在 MVP 后增加按钮与回调处理

## 授权与数据安全（AuthZ & RLS）

* 规则：所有表（goals、actions 等）添加列 owner\_id，RLS：用户仅能访问 owner\_id = auth.uid() 的记录

* 读策略：USING owner\_id = auth.uid()；写策略：WITH CHECK owner\_id = auth.uid()

* 服务端动作：写操作总是由服务端动作执行，服务端做字段白名单与约束校验

* 角色预留：user、admin 两层，admin 后续可读写全部数据并具备审计能力

## 账户生命周期

* 注册→邮箱确认→首次登录→填写基础资料（姓名/语言/时区）

* 登录→会话保持→受保护区域访问（/dashboard、/goals、/today、/profile）

* 找回密码：/forgot 发送邮件，/reset 更新新密码

* 资料维护：/profile 可更新姓名、语言（已实现）、后续补充头像、时区

* 可选：删除账户（软删除，标记 deleted\_at），后续安排数据保留与导出

## 个人资料（Profile）

* 表结构：user\_profiles(id uuid 主键 = auth.user.id, name, avatar\_url, locale, timezone, created\_at, updated\_at)

* 页面：/profile 展示邮箱（只读）、姓名、语言切换、后续头像与时区编辑

* 校验：服务端写入动作检查字符串长度、允许的语言与时区枚举

## 安全与合规

* 强密码：长度≥8、包含大小写/数字/特殊符号；实时校验与强度条已接入

* 邮箱确认：注册后要求验证；未验证时限制关键操作（可根据需要开启）

* 速率限制：MVP 先做按钮级 UX 限制与服务端简单节流（同邮箱 1 分钟一次）；后续引入边缘函数与 KV/RateLimit 实现

* 敏感信息：不在日志中输出密码与 Token，不在客户端暴露服务端密钥

* 环境变量：如上三项，部署时必填并校验

## 国际化与可用性

* i18n 键规范：login/signup/forgot/reset/profile 分模块键；错误映射使用统一规则

* 可用性：所有提交按钮具备加载态、禁用态；错误与成功提示靠近表单顶部

* 无障碍：表单 Label、aria-label 完备；Icon 切换具备辅助说明

## 前端页面与交互

* /login：登录 + 去注册链接 + 忘记密码链接

* /signup：注册 + 去登录链接

* /forgot：输入邮箱发送重置邮件 + 成功/失败提示

* /reset：新密码与确认密码 + 规则列表 + 强度条 + 3s 自动跳转

* /profile：个人资料展示与编辑（姓名/语言），后续加入头像上传与时区选择

## 服务端动作与中间件

* 中间件：未登录访问受保护路由跳转 /login；已登录访问 /login 或 /signup 或 /forgot 或 /reset 跳转 /dashboard

* 动作：login、signup、requestReset、profile 更新等统一在 server 侧校验与写库

## 数据库与策略（Supabase）

* 表：user\_profiles、goals、actions（均含 owner\_id）

* 索引：owner\_id 常用查询字段建立索引；created\_at 排序索引

* RLS：开启并验证读写策略；提供少量 SQL 测试脚本做策略验证

## 运维与监控

* 运行时日志：仅输出必要错误信息；屏蔽隐私数据

* 健康检查：构建与 Lint 作为基本质量门槛；后续引入端到端测试

* 事件记录（可选）：last\_login\_at、profile 更新写入 updated\_at；后续扩展审计日志表

## 增量扩展（可选）

* OAuth 登录、多因素认证（MFA）

* 账户删除与数据导出

* 邀请与团队多租户结构（projects/teams），以 owner\_id+tenant\_id 扩展 RLS

* 风控与安全：密码重复使用检测、常见泄露密码拦截

## 实施路径（MVP）

1. 完成与验证 RLS 策略（owner\_id + USING/WITH CHECK）
2. /profile 增强：头像、时区、姓名校验与服务端动作
3. /reset 继续完善密码强度与错误映射（已完成基础版本）
4. 部署变量与邮件回调域名配置（NEXT\_PUBLIC\_SITE\_URL、Supabase URL/Key）
5. 添加基础速率限制（同邮箱短期内限制发送）与日志最小化
