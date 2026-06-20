import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const raw = fs.readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue
    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(projectRoot, '.env.local'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('缺少 Supabase 环境变量：NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

function toNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`
}

function getArgValue(name, fallback) {
  const entry = process.argv.find((item) => item.startsWith(`${name}=`))
  if (!entry) return fallback
  return entry.slice(name.length + 1)
}

const EVENTS_ALLOW_MISSING_SCENE = new Set([
  'dashboard_viewed',
  'today_viewed',
])

function buildOverview(rows) {
  const userDayMap = new Map()
  for (const row of rows) {
    const key = `${row.user_id}:${row.event_date}`
    const current = userDayMap.get(key) || {
      pageViewDays: 1,
      todayPlanExposedUserDays: 0,
      todayPlanApplyUserDays: 0,
      reviewExposedUserDays: 0,
      rescueClickUserDays: 0,
      returnedNextDayUserDays: 0,
    }
    if (toNumber(row.today_plan_exposed_count) > 0) current.todayPlanExposedUserDays = 1
    if (toNumber(row.today_plan_apply_count) > 0) current.todayPlanApplyUserDays = 1
    if (toNumber(row.review_exposed_count) > 0) current.reviewExposedUserDays = 1
    if (toNumber(row.rescue_click_count) > 0) current.rescueClickUserDays = 1
    if (row.returned_next_day) current.returnedNextDayUserDays = 1
    userDayMap.set(key, current)
  }

  const total = [...userDayMap.values()].reduce(
    (acc, row) => ({
      pageViewDays: acc.pageViewDays + row.pageViewDays,
      todayPlanExposedUserDays: acc.todayPlanExposedUserDays + row.todayPlanExposedUserDays,
      todayPlanApplyUserDays: acc.todayPlanApplyUserDays + row.todayPlanApplyUserDays,
      reviewExposedUserDays: acc.reviewExposedUserDays + row.reviewExposedUserDays,
      rescueClickUserDays: acc.rescueClickUserDays + row.rescueClickUserDays,
      returnedNextDayUserDays: acc.returnedNextDayUserDays + row.returnedNextDayUserDays,
    }),
    {
      pageViewDays: 0,
      todayPlanExposedUserDays: 0,
      todayPlanApplyUserDays: 0,
      reviewExposedUserDays: 0,
      rescueClickUserDays: 0,
      returnedNextDayUserDays: 0,
    }
  )

  return {
    ...total,
    todayPlanExposureRate:
      total.pageViewDays > 0 ? total.todayPlanExposedUserDays / total.pageViewDays : 0,
    todayPlanApplyRate:
      total.todayPlanExposedUserDays > 0
        ? total.todayPlanApplyUserDays / total.todayPlanExposedUserDays
        : 0,
    returnedNextDayRate:
      total.pageViewDays > 0 ? total.returnedNextDayUserDays / total.pageViewDays : 0,
  }
}

function buildBreakdown(rows) {
  const groupedUserDays = new Map()
  for (const row of rows) {
    const hasSignal =
      toNumber(row.today_plan_exposed_count) > 0 ||
      toNumber(row.today_plan_apply_count) > 0 ||
      toNumber(row.review_exposed_count) > 0 ||
      toNumber(row.rescue_click_count) > 0
    if (!hasSignal) continue

    const key = `${row.source}:${row.scene}:${row.variant}:${row.user_id}:${row.event_date}`
    const current = groupedUserDays.get(key) || {
      source: row.source,
      scene: row.scene,
      variant: row.variant,
      todayPlanExposedUserDays: 0,
      todayPlanApplyUserDays: 0,
      reviewExposedUserDays: 0,
      rescueClickUserDays: 0,
      returnedNextDayUserDays: 0,
    }
    if (toNumber(row.today_plan_exposed_count) > 0) current.todayPlanExposedUserDays = 1
    if (toNumber(row.today_plan_apply_count) > 0) current.todayPlanApplyUserDays = 1
    if (toNumber(row.review_exposed_count) > 0) current.reviewExposedUserDays = 1
    if (toNumber(row.rescue_click_count) > 0) current.rescueClickUserDays = 1
    if (row.returned_next_day) current.returnedNextDayUserDays = 1
    groupedUserDays.set(key, current)
  }

  const merged = new Map()
  for (const row of groupedUserDays.values()) {
    const key = `${row.source}:${row.scene}:${row.variant}`
    const current = merged.get(key) || {
      source: row.source,
      scene: row.scene,
      variant: row.variant,
      todayPlanExposedUserDays: 0,
      todayPlanApplyUserDays: 0,
      reviewExposedUserDays: 0,
      rescueClickUserDays: 0,
      returnedNextDayUserDays: 0,
    }
    current.todayPlanExposedUserDays += row.todayPlanExposedUserDays
    current.todayPlanApplyUserDays += row.todayPlanApplyUserDays
    current.reviewExposedUserDays += row.reviewExposedUserDays
    current.rescueClickUserDays += row.rescueClickUserDays
    current.returnedNextDayUserDays += row.returnedNextDayUserDays
    merged.set(key, current)
  }

  return [...merged.values()].sort((a, b) => {
    const scoreA =
      a.todayPlanExposedUserDays + a.reviewExposedUserDays + a.rescueClickUserDays
    const scoreB =
      b.todayPlanExposedUserDays + b.reviewExposedUserDays + b.rescueClickUserDays
    return scoreB - scoreA
  })
}

function buildHistoricalNoiseReport(rows) {
  const stats = {
    pageViewUnknownSourceRows: 0,
    planExposureUnknownSceneRows: 0,
    reviewExposureUnknownSceneRows: 0,
    rescueUnknownSceneRows: 0,
    variantTaggedRows: 0,
  }

  for (const row of rows) {
    const hasPageViews =
      toNumber(row.dashboard_view_count) > 0 || toNumber(row.today_view_count) > 0
    if (hasPageViews && row.source === 'unknown') stats.pageViewUnknownSourceRows += 1
    if (toNumber(row.today_plan_exposed_count) > 0 && row.scene === 'unknown') {
      stats.planExposureUnknownSceneRows += 1
    }
    if (toNumber(row.review_exposed_count) > 0 && row.scene === 'unknown') {
      stats.reviewExposureUnknownSceneRows += 1
    }
    if (toNumber(row.rescue_click_count) > 0 && row.scene === 'unknown') {
      stats.rescueUnknownSceneRows += 1
    }
    if (row.variant && row.variant !== '-') stats.variantTaggedRows += 1
  }

  return stats
}

function isMissingSource(meta) {
  return !meta || typeof meta.source !== 'string' || !meta.source.trim()
}

function isMissingScene(params) {
  const { name, meta } = params
  if (EVENTS_ALLOW_MISSING_SCENE.has(name)) return false
  return !meta || typeof meta.scene !== 'string' || !meta.scene.trim()
}

function buildRecentEventIssues(profiles, recentSinceMs) {
  const issues = []

  for (const profile of profiles) {
    const events = Array.isArray(profile.ai_recent_events) ? profile.ai_recent_events : []
    for (const event of events) {
      if (!event || typeof event !== 'object' || Array.isArray(event)) continue
      const name = typeof event.name === 'string' ? event.name : ''
      const ts = typeof event.ts === 'string' ? event.ts : ''
      const meta = event.meta && typeof event.meta === 'object' && !Array.isArray(event.meta)
        ? event.meta
        : null

      if (!name || !ts) continue
      const eventTsMs = Date.parse(ts)
      if (!Number.isFinite(eventTsMs) || eventTsMs < recentSinceMs) continue

      const missingSource = isMissingSource(meta)
      const missingScene = isMissingScene({ name, meta })
      if (!missingSource && !missingScene) continue

      issues.push({
        user_id: profile.id,
        name,
        ts,
        scene: meta?.scene ?? null,
        source: meta?.source ?? null,
        missing_source: missingSource,
        missing_scene: missingScene,
      })
    }
  }

  return issues.sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
}

function buildRecentIssueSummary(issues) {
  const grouped = new Map()
  for (const issue of issues) {
    const key = issue.name
    const current = grouped.get(key) || {
      event_name: issue.name,
      count: 0,
      latest_ts: issue.ts,
      missing_source_count: 0,
      missing_scene_count: 0,
    }
    current.count += 1
    if (issue.ts > current.latest_ts) current.latest_ts = issue.ts
    if (issue.missing_source) current.missing_source_count += 1
    if (issue.missing_scene) current.missing_scene_count += 1
    grouped.set(key, current)
  }
  return [...grouped.values()].sort((a, b) => b.count - a.count || (a.event_name > b.event_name ? 1 : -1))
}

async function main() {
  const days = Number(getArgValue('--days', '30'))
  const rawLimit = Number(getArgValue('--raw-limit', '20'))
  const recentMinutes = Number(getArgValue('--recent-minutes', '1440'))
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const recentSinceMs = Date.now() - recentMinutes * 60000
  const recentSinceIso = new Date(recentSinceMs).toISOString()

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await supabase
    .from('ai_funnel_daily')
    .select(
      'user_id,event_date,source,scene,variant,dashboard_view_count,today_view_count,today_plan_exposed_count,today_plan_click_count,today_plan_apply_count,review_exposed_count,rescue_click_count,returned_next_day'
    )
    .gte('event_date', since)
    .order('event_date', { ascending: false })
    .limit(5000)

  if (error) {
    console.error('读取 ai_funnel_daily 失败:', error.message, error.code || '')
    process.exit(1)
  }

  const rows = data || []
  const overview = buildOverview(rows)
  const breakdown = buildBreakdown(rows).slice(0, 10)
  const historicalNoise = buildHistoricalNoiseReport(rows)
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, updated_at, ai_recent_events')
    .gte('updated_at', recentSinceIso)
    .order('updated_at', { ascending: false })
    .limit(5000)

  if (profilesError) {
    console.error('读取 user_profiles 原始事件失败:', profilesError.message, profilesError.code || '')
    process.exit(1)
  }

  const recentIssues = buildRecentEventIssues(profiles || [], recentSinceMs)
  const recentIssueSummary = buildRecentIssueSummary(recentIssues)

  console.log(`AI Funnel 检查窗口: 最近 ${days} 天`)
  console.log(`近期新漏标窗口: 最近 ${recentMinutes} 分钟`)
  console.log(`原始行数: ${rows.length}`)
  console.log('')
  console.log('总览:')
  console.table([
    {
      page_view_days: overview.pageViewDays,
      plan_exposed_user_days: overview.todayPlanExposedUserDays,
      plan_apply_user_days: overview.todayPlanApplyUserDays,
      review_exposed_user_days: overview.reviewExposedUserDays,
      rescue_click_user_days: overview.rescueClickUserDays,
      returned_next_day_user_days: overview.returnedNextDayUserDays,
      plan_exposure_rate: formatPercent(overview.todayPlanExposureRate),
      plan_apply_rate: formatPercent(overview.todayPlanApplyRate),
      returned_next_day_rate: formatPercent(overview.returnedNextDayRate),
    },
  ])

  console.log('分层 Top 10:')
  console.table(breakdown)

  console.log('历史噪音（view 聚合视角）:')
  console.table([historicalNoise])

  console.log('近期新漏标（原始事件视角）汇总:')
  console.table(recentIssueSummary)

  console.log(`近期新漏标明细（最近 ${Math.min(rawLimit, recentIssues.length)} 条）:`)
  console.table(recentIssues.slice(0, rawLimit))

  console.log(`最近 ${Math.min(rawLimit, rows.length)} 行原始 view 数据:`)
  console.table(rows.slice(0, rawLimit))
}

void main()
