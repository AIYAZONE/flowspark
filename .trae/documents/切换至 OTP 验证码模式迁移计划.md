# 迁移到 OTP 验证码模式计划

为了解决邮件链接失效 (`otp_expired`) 问题，我们将把注册验证流程从“点击链接”切换为“输入 6 位验证码”。

## 1. 新增验证页面与组件
*   **创建页面**: `src/app/(auth)/verify/page.tsx`
    *   这是一个新页面，用户注册成功后会跳转到这里。
    *   页面包含一个表单，要求用户输入 6 位数字验证码。
    *   需要从 URL 参数中获取 `email`（为了用户体验，自动填充）。
*   **创建组件**: `src/components/VerifyForm.tsx`
    *   包含一个 6 位数字输入框（可以使用 Input OTP 组件优化体验，或者简单 Input）。
    *   包含“重新发送验证码”按钮。

## 2. 修改注册流程
*   **修改 `src/app/(auth)/login/actions.ts`**:
    *   在 `signup` 函数中，移除 `emailRedirectTo` 参数。这样 Supabase 将默认发送包含 OTP 的邮件（前提是 Supabase 邮件模板配置正确，通常默认模板包含 `{{ .Token }}`）。
    *   注册成功后，不再重定向到 `/?message=registration_success`，而是重定向到 `/verify?email=xxx`。

## 3. 实现验证 Action
*   **修改 `src/app/(auth)/login/actions.ts`**:
    *   新增 `verifyEmail(formData: FormData)` Action。
    *   调用 `supabase.auth.verifyOtp({ email, token, type: 'signup' })`。
    *   验证成功后，重定向到 `/dashboard`（或 `/verified` 欢迎页）。
    *   新增 `resendOtp(email: string)` Action，调用 `supabase.auth.resend({ type: 'signup', email })`。

## 4. 国际化适配
*   **更新 `zh.json` / `en.json`**:
    *   添加 `verify` 命名空间，包含标题、说明、输入框标签、按钮文本、错误提示等。

## 5. 路由清理 (可选)
*   现有的 `src/app/auth/callback/route.ts` 依然保留，以防万一有旧链接访问，但新流程不再依赖它。
*   现有的 `src/app/(auth)/verified/page.tsx` 可以复用或调整为验证成功后的过渡页。

## 用户操作流变化
**旧流程**: 注册 -> 提示去邮箱 -> 用户切出 -> 点链接 -> 跳回网站(自动登录)
**新流程**: 注册 -> 跳转到输入验证码页 -> 用户切出看邮件 -> 切回网站输入数字 -> 自动登录

这个方案能彻底规避邮件扫描器导致的链接失效问题。