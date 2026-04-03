# Supabase 数据库初始化指南

**中文** | [English](README.md)

本目录包含了初始化 FlowSpark 数据库所需的所有 SQL 脚本。请按照以下顺序在 Supabase SQL Editor 中执行这些脚本。

## 脚本说明

### 1. `00_init_tables.sql` (核心表结构)

初始化项目的核心数据表：

- `user_profiles`: 存储用户的额外信息（昵称、头像、时区等）。
- `goals`: 存储用户的长期目标。
- `actions`: 存储与目标关联的具体行动项。
- `daily_scores`: 存储用户的每日评分数据。

**注意**：为了兼容现有的后端逻辑，部分表同时定义了 `user_id` 和 `owner_id` 字段。

### 2. `01_rls_policies.sql` (安全策略)

配置行级安全 (Row Level Security) 策略，确保数据的安全性：

- 启用所有表的 RLS。
- 限制用户只能查询、插入、更新和删除属于自己的数据（基于 `auth.uid()`）。

### 3. `02_storage_setup.sql` (存储配置)

配置文件存储系统：

- 创建 `avatars` 存储桶用于存放用户头像。
- 配置公开读取权限（Public Read）。
- 配置仅认证用户可上传/修改自己文件的权限。

### 4. `03_functions_and_triggers.sql` (自动化逻辑)

设置数据库的自动化触发器：

- **新用户处理**：当用户注册时，自动在 `user_profiles` 表中创建对应记录。
- **时间戳更新**：当记录被更新时，自动更新 `updated_at` 字段为当前时间。

### 5. `04_gamification.sql` (游戏化结构)

补齐最小游戏化数据结构：

- `user_profiles`：增加 `xp` 与 `level`。
- `xp_logs`：记录经验值变化日志。

### 6. `05_gamification_rls.sql` (游戏化 RLS)

为 `xp_logs` 启用 RLS 并配置策略。

### 7. `06_ai_feedback.sql` (AI 反馈存储)

为 `user_profiles` 增加 `ai_recent_events`，用于基础 AI 反馈/事件记录。

### 8. `07_inbox.sql` (灵感速记 Inbox)

新增 `inbox_items` 表，用于快速记录灵感、标签，并支持后续转为行动。

### 9. `08_inbox_rls.sql` (Inbox RLS)

为 `inbox_items` 启用 RLS 并配置策略。

## 执行步骤

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 进入项目的 **SQL Editor**。
3. 依次复制上述文件的内容并运行：
   - `00_init_tables.sql`
   - `01_rls_policies.sql`
   - `02_storage_setup.sql`
   - `03_functions_and_triggers.sql`
   - `04_gamification.sql`
   - `05_gamification_rls.sql`
   - `06_ai_feedback.sql`
   - `07_inbox.sql`
   - `08_inbox_rls.sql`
4. 执行完毕后，数据库即初始化完成。
