**目标**

* 统一登录相关页面的视觉风格，与应用现有卡片样式保持一致。

* 简化交互流程：每个页面只做一件事（登录或注册）。

* 登录与注册分离展示，不再混在同一表单中。

**现状**

* 当前为合并页 /login，标题为“Login / Sign Up”，同一表单内包含 email、password、name 三个字段，并通过两个按钮分别触发登录/注册的服务端动作。

* 相关代码：页面 [page.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/app/login/page.tsx) 与动作 [actions.ts](file:///Users/brucewang/Documents/AIYA/goals/src/app/login/actions.ts)。

* 路由保护：未登录访问受保护页会跳转至 /login；已登录访问 /login 会跳转到 /dashboard（[middleware.ts](file:///Users/brucewang/Documents/AIYA/goals/src/lib/supabase/middleware.ts#L31-L56)）。

**设计与交互**

* 页面分离：新增 /signup 页面，仅展示注册所需字段。

  * /login：仅保留 email、password 两个字段，一个主按钮“登录”。

  * /signup：保留 name、email、password 三个字段，一个主按钮“注册”。

* 视觉风格：保持与详情页一致的卡片样式（圆角、细边框、去掉投影、浅色背景）。

  * 卡片容器：rounded-xl、border-border/50、bg-secondary/20、去掉 shadow。

* 文案与跳转：

  * /login 顶部提供“没有账号？去注册”链接跳转 /signup。

  * /signup 顶部提供“已有账号？去登录”链接跳转 /login。

* 反馈与易用性：

  * 顶部统一展示错误/成功提示；登录失败显示错误；注册成功但需邮箱验证时给出引导文案。

  * 表单提交状态禁用按钮并显示加载中的视觉反馈。

**技术改动**

* 页面拆分：

  * 新增文件 /src/app/signup/page.tsx，结构与 /login 类似，但仅绑定注册动作。

  * 复用现有注册动作 [signup](file:///Users/brucewang/Documents/AIYA/goals/src/app/login/actions.ts#L38-L83)，如需更清晰可迁移为 /src/app/signup/actions.ts，并导出同名函数（可选）。

* 现有页面优化：

  * 调整 /src/app/login/page.tsx 的卡片样式，移除 shadow，使用统一的 bg-secondary/20 与 border。

  * 删除 name 字段，仅保留 email、password；主按钮只绑定 [login](file:///Users/brucewang/Documents/AIYA/goals/src/app/login/actions.ts#L6-L36)。

  * 在卡片底部新增跳转链接到 /signup。

* 中间件与路由保护：

  * 在 [middleware.ts](file:///Users/brucewang/Documents/AIYA/goals/src/lib/supabase/middleware.ts) 的白名单/公共路径中加入 /signup；保持“已登录访问 /login 或 /signup 时跳转 /dashboard”的逻辑一致。

* i18n 文案：

  * 将“Login / Sign Up”拆分为独立键：login.title、signup.title、login.cta、signup.cta、login.toSignup、signup.toLogin。

  * 更新 [zh.json](file:///Users/brucewang/Documents/AIYA/goals/src/i18n/zh.json) 与 [en.json](file:///Users/brucewang/Documents/AIYA/goals/src/i18n/en.json) 的对应字段。

**验证**

* 未登录：访问 /login 与 /signup 均可；登录成功/注册成功后跳转 /dashboard。

* 已登录：访问 /login 或 /signup 应自动重定向至 /dashboard。

* 错误路径：错误信息通过 URL 查询或页面状态显示在卡片顶部；注册需要邮箱确认时展示成功提示与说明。

* UI一致性：检查卡片背景、边框、圆角、间距与其它页面统一；移动端下表单元素间

