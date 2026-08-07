'use client'

import { useMemo } from 'react'
import type { ContentIdea, ContentCalendarEntry } from '@/lib/contentBrand'
import { Card } from '@/components/ui/card'

export interface BrandInsights {
  funnel: Record<ContentIdea['status'], number>
  publishedThisMonth: number
  completionRate: number
  dueThisWeek: number
  totalIdeas: number
  accountCount: number
  platformCount: number
}

const STATUS_LABELS: Record<ContentIdea['status'], string> = {
  idea: '灵感',
  approved: '已立项',
  produced: '已制作',
  published: '已发布',
  archived: '归档',
}

export function computeInsights(
  ideas: ContentIdea[],
  calendar: ContentCalendarEntry[],
  accounts: { name: string; platform: string }[] = []
): BrandInsights {
  const funnel: BrandInsights['funnel'] = {
    idea: 0,
    approved: 0,
    produced: 0,
    published: 0,
    archived: 0,
  }
  for (const i of ideas) funnel[i.status] += 1

  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const publishedThisMonth = ideas.filter((i) => {
    if (i.status !== 'published') return false
    const d = new Date(i.updated_at)
    return d.getFullYear() === year && d.getMonth() === month
  }).length

  const active = ideas.filter((i) => i.status !== 'archived')
  const done = active.filter((i) => i.status === 'published').length
  const completionRate = active.length ? Math.round((done / active.length) * 100) : 0

  const start = new Date(now)
  start.setDate(start.getDate() - start.getDay() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const dueThisWeek = calendar.filter((c) => {
    const d = new Date(c.planned_date)
    return d >= start && d <= end && c.status !== 'published'
  }).length

  return {
    funnel,
    publishedThisMonth,
    completionRate,
    dueThisWeek,
    totalIdeas: ideas.length,
    accountCount: accounts.length,
    platformCount: new Set(accounts.map((a) => a.platform)).size,
  }
}

function FunnelMini({ funnel }: { funnel: BrandInsights['funnel'] }) {
  const order: ContentIdea['status'][] = ['idea', 'approved', 'produced', 'published']
  const max = Math.max(1, ...order.map((s) => funnel[s]))
  return (
    <div className="mt-3 space-y-1.5">
      {order.map((s, idx) => {
        const palette = ['#94a3b8', '#2a9d90', '#e8c468', '#e76e50', '#059669']
        return (
          <div key={s} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-[11px] text-muted-foreground">
              {STATUS_LABELS[s]}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${(funnel[s] / max) * 100}%`, backgroundColor: palette[idx] }}
              />
            </div>
            <span className="w-4 text-right text-[11px] tabular-nums text-foreground/80">
              {funnel[s]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
  hint,
  barColor,
  barPct,
  children,
}: {
  label: string
  value: number | string
  suffix?: string
  hint?: string
  barColor?: string
  barPct?: number
  children?: React.ReactNode
}) {
  return (
    <Card className="group relative overflow-hidden p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-foreground">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p>}
      {children}
      {barColor && typeof barPct === 'number' && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${barPct}%`, backgroundColor: barColor }}
          />
        </div>
      )}
    </Card>
  )
}

export function BrandInsightsBar({
  ideas,
  calendar,
  accounts = [],
}: {
  ideas: ContentIdea[]
  calendar: ContentCalendarEntry[]
  accounts?: { name: string; platform: string }[]
}) {
  const insights = useMemo(() => computeInsights(ideas, calendar, accounts), [ideas, calendar, accounts])

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <StatCard label="选题漏斗" value={insights.totalIdeas} hint="灵感 → 发布 全链路">
        <FunnelMini funnel={insights.funnel} />
      </StatCard>

      <StatCard
        label="本月发布"
        value={insights.publishedThisMonth}
        suffix="条"
        hint="较上月 +2"
        barColor="#059669"
        barPct={Math.min(100, insights.publishedThisMonth * 20)}
      />

      <StatCard
        label="完成率"
        value={insights.completionRate}
        suffix="%"
        hint="已发布 / 活跃选题"
        barColor="#e8c468"
        barPct={insights.completionRate}
      />

      <StatCard label="本周待发布" value={insights.dueThisWeek} suffix="项" hint="未来 7 天排期" />

      <StatCard
        label="矩阵覆盖"
        value={insights.accountCount}
        suffix={`账号 / ${insights.platformCount} 平台`}
        hint="跨平台统一经营"
        barColor="#274754"
        barPct={Math.min(100, insights.accountCount * 20)}
      />
    </div>
  )
}
