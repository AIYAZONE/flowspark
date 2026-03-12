# 关键流程（Auth 与 AI）

## 1) 登录回调：`/auth/callback` 交换 session 并重定向

```mermaid
C4Dynamic
title Auth Callback Flow - exchangeCodeForSession

Person(user, "用户", "点击登录/验证链接")
Container(web, "FlowSpark Web App", "Next.js", "App Router（含 Route Handlers）")
Container_Ext(supabaseAuth, "Supabase Auth", "Supabase", "Code -> Session")

Rel(user, web, "1. 打开 /auth/callback?code=...&next=...", "HTTPS GET")
Rel(web, supabaseAuth, "2. exchangeCodeForSession(code)", "supabase-js/@supabase/ssr")
Rel(web, user, "3. 302 Redirect 到 next（默认 /）", "HTTP Redirect")
```

实现入口：
- 回调处理：`../../src/app/auth/callback/route.ts`
- 路由保护与 session 刷新：`../../middleware.ts` + `../../src/lib/supabase/middleware.ts`

关键行为（现状）：
- 受保护路由（`/dashboard|/goals|/profile|/today`）未登录会被 middleware 重定向到 `/login`
- 受保护路由强制邮箱已验证（`email_confirmed_at`），否则重定向到 `/login?error=...`
- refresh token 异常时会清理 Supabase 相关 cookie 并按未登录处理

## 2) AI 拆解：`POST /api/ai/breakdown` 生成行动草案

```mermaid
C4Dynamic
title AI Breakdown Flow - /api/ai/breakdown

Person(user, "用户", "发起目标拆解")
Container(web, "FlowSpark Web App", "Next.js", "Route Handler: /api/ai/breakdown")
Container_Ext(supabase, "Supabase", "Auth", "鉴权 getUser()")
Container_Ext(aiApi, "AI Provider API", "OpenAI Compatible", "Chat Completions")

Rel(user, web, "1. POST /api/ai/breakdown（goalTitle/startDate/endDate/...）", "JSON/HTTPS")
Rel(web, supabase, "2. auth.getUser() 鉴权", "supabase-js/@supabase/ssr")
Rel(web, aiApi, "3. POST /chat/completions（OpenAI 兼容）", "JSON/HTTPS")
Rel(web, user, "4. 返回 actions[] 草案", "JSON 200")
```

实现入口：
- 路由：`../../src/app/api/ai/breakdown/route.ts`
- 业务逻辑：`../../src/lib/ai/breakdown.ts`
- Provider 调用：`../../src/lib/ai/client.ts`

错误映射（现状）：
- 入参/日期范围等校验失败：400
- 缺少 AI Key：500（`missing_ai_key`）
- provider/网络类失败：502（例如 `ai_provider_error`、`empty_ai_response` 等）
