# API 与数据字典

## 概述
- 范围：Server Actions 输入/输出契约、错误码、枚举值、实体字段
- 目的：保证前后端协作一致性与可维护性

## Server Actions
- goals/createGoal
  - 输入：title, description, priority, category, start_date, end_date
  - 输出：goal对象（含id）
  - 错误：VALIDATION_ERROR, RLS_DENIED, DB_ERROR
- goals/updateGoal
  - 输入：id, 可选字段
  - 输出：更新后的goal对象
  - 错误：NOT_FOUND, VALIDATION_ERROR, RLS_DENIED, DB_ERROR
- goals/deleteGoal
  - 输入：id
  - 输出：{ deleted: true }
  - 错误：NOT_FOUND, RLS_DENIED, DB_ERROR
- actions/createAction
  - 输入：goal_id, title, type, start_date, end_date
  - 输出：action对象
  - 错误：VALIDATION_ERROR, RLS_DENIED, DB_ERROR
- actions/updateAction
  - 输入：id, 可选字段
  - 输出：更新后的action对象
  - 错误：NOT_FOUND, VALIDATION_ERROR, RLS_DENIED, DB_ERROR
- actions/deleteAction
  - 输入：id
  - 输出：{ deleted: true }
  - 错误：NOT_FOUND, RLS_DENIED, DB_ERROR
- dashboard/toggleAction
  - 输入：id, completed(boolean)
  - 输出：action对象
  - 错误：NOT_FOUND, RLS_DENIED, DB_ERROR
- dashboard/submitScore
  - 输入：score_date, score
  - 输出：daily_score对象（upsert）
  - 错误：VALIDATION_ERROR, DB_ERROR

## 错误码
- VALIDATION_ERROR：字段校验失败
- NOT_FOUND：资源不存在
- RLS_DENIED：行级安全拒绝
- DB_ERROR：数据库错误（泛化）
- AUTH_REQUIRED：未登录或会话失效

## 枚举值
- goal.priority：low | medium | high
- goal.status：active | completed | abandoned
- action.type：core | maintain | explore

## 数据字典（字段）
- goal：id(uuid), user_id(uuid), title, description, start_date, end_date, priority, category, status, created_at, updated_at
- action：id(uuid), goal_id(uuid), title, type, start_date, end_date, completed, created_at, updated_at
- daily_score：id(uuid), user_id(uuid), score_date, score
