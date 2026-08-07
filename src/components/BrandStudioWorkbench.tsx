'use client'

import { useMemo, useState } from 'react'
import {
  Lightbulb,
  ScrollText,
  StickyNote,
  Database,
  Target,
  Wrench,
  Box,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ContentIdea, ContentCalendarEntry } from '@/lib/contentBrand'
import type { ContentAsset, ContentAssetKind } from '@/lib/contentAsset'
import { brandStudioMock, type BrandStudioMock } from '@/lib/brandStudioMock'
import { BrandInsightsBar } from '@/components/BrandInsightsBar'
import { BrandCheckPanel } from '@/components/BrandCheckPanel'
import type { Dictionary } from '@/i18n/types'

const STATUS_META: Record<
  ContentIdea['status'],
  { label: string; dot: string; chip: string }
> = {
  idea: { label: '灵感', dot: 'bg-slate-400', chip: 'bg-slate-400/15 text-slate-600 dark:text-slate-300' },
  approved: { label: '已立项', dot: 'bg-[#2a9d90]', chip: 'bg-[#2a9d90]/15 text-[#2a9d90]' },
  produced: { label: '已制作', dot: 'bg-[#e76e50]', chip: 'bg-[#e76e50]/15 text-[#e76e50]' },
  published: { label: '已发布', dot: 'bg-[#059669]', chip: 'bg-[#059669]/15 text-[#059669]' },
  archived: { label: '归档', dot: 'bg-zinc-500', chip: 'bg-zinc-500/15 text-zinc-500' },
}

const ASSET_ICON: Record<ContentAssetKind, LucideIcon> = {
  idea: Lightbulb,
  script: ScrollText,
  note: StickyNote,
  data: Database,
  strategy: Target,
  tool: Wrench,
  other: Box,
}

function PrototypeBadge() {
  return (
    <div className="mb-3 flex items-center gap-1.5 self-start rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      原型预览 · 交互不落库
    </div>
  )
}

function IpOverview({ summary, pillars }: { summary: string; pillars: string[] }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-primary/80">IP 定位</p>
          <p className="mt-1.5 text-base leading-relaxed text-foreground">{summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pillars.map((p) => (
              <Badge key={p} variant="secondary" className="bg-muted/60">
                {p}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            + 新建选题
          </button>
          <button className="inline-flex h-9 items-center rounded-lg border border-border/60 px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/50">
            跨账号排期
          </button>
        </div>
      </div>
    </Card>
  )
}

function IdeaPipeline({
  ideas,
  onStatus,
  onDelete,
}: {
  ideas: ContentIdea[]
  onStatus: (id: string, s: ContentIdea['status']) => void
  onDelete: (id: string) => void
}) {
  const [menu, setMenu] = useState<string | null>(null)
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">选题管线</h3>
        <span className="text-xs text-muted-foreground">{ideas.length} 条</span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {ideas.map((idea) => {
          const meta = STATUS_META[idea.status]
          return (
            <div
              key={idea.id}
              className="group rounded-xl border border-border/50 bg-background/40 p-3 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${meta.chip}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                <button
                  onClick={() => setMenu(menu === idea.id ? null : idea.id)}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  ⋯
                </button>
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground">{idea.title}</p>
              {idea.angle && (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">#{idea.angle}</p>
              )}
              <div className="mt-2.5 flex items-center gap-1.5">
                <select
                  value={idea.status}
                  onChange={(e) => onStatus(idea.id, e.target.value as ContentIdea['status'])}
                  className="h-7 rounded-md border border-border/50 bg-background px-1.5 text-[11px] text-foreground"
                >
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                {menu === idea.id && (
                  <button
                    onClick={() => {
                      onDelete(idea.id)
                      setMenu(null)
                    }}
                    className="h-7 rounded-md border border-destructive/40 px-2 text-[11px] text-destructive transition-colors hover:bg-destructive/10"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function weekDays() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(monday.getDate() - monday.getDay() + 1)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function CalendarBoard({
  calendar,
  accounts,
}: {
  calendar: ContentCalendarEntry[]
  accounts: { name: string }[]
}) {
  const days = useMemo(weekDays, [])
  const byDate = useMemo(() => {
    const map = new Map<string, ContentCalendarEntry[]>()
    for (const c of calendar) {
      const key = c.planned_date.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    return map
  }, [calendar])
  const accountNames = useMemo(() => new Set(accounts.map((a) => a.name)), [accounts])

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">本周排期 · 按账号</h3>
        <span className="text-xs text-muted-foreground">拖拽创意到日期即可排期（原型）</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const key = d.toISOString().slice(0, 10)
          const items = byDate.get(key) ?? []
          const isToday = key === new Date().toISOString().slice(0, 10)
          return (
            <div
              key={key}
              className={`min-h-24 rounded-lg border p-1.5 transition-colors ${
                isToday ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-background/40'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {['一', '二', '三', '四', '五', '六', '日'][i]}
                </span>
                <span className={`text-[10px] tabular-nums ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {d.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {items.map((c) => {
                  const known = accountNames.has(c.platform)
                  const color = accountColor(c.platform)
                  return (
                    <div
                      key={c.id}
                      className="cursor-grab rounded-md border px-1.5 py-1 text-[10px] leading-tight"
                      style={{
                        borderColor: `${color}40`,
                        backgroundColor: `${color}1a`,
                      }}
                    >
                      <span className="block truncate font-medium text-foreground">{c.note}</span>
                      <span className="block truncate" style={{ color: known ? color : undefined }}>
                        {c.platform}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function AssetTree({ assets }: { assets: ContentAsset[] }) {
  const byKind = useMemo(() => {
    const map = new Map<ContentAsset['kind'], ContentAsset[]>()
    for (const a of assets) {
      if (!map.has(a.kind)) map.set(a.kind, [])
      map.get(a.kind)!.push(a)
    }
    return map
  }, [assets])

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">资产库</h3>
        <span className="text-xs text-muted-foreground">{assets.length} 项</span>
      </div>
      <div className="space-y-1">
        {Array.from(byKind.entries()).map(([kind, list]) => {
          const Icon = ASSET_ICON[kind]
          return (
            <div key={kind} className="rounded-lg border border-border/50 bg-background/40">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  {kind}
                </span>
                <span className="text-xs text-muted-foreground">{list.length}</span>
              </div>
              <div className="space-y-0.5 px-3 pb-2">
                {list.map((a) => (
                  <div
                    key={a.id}
                    className="truncate rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    {a.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// 账号标识 → 稳定配色（chart 色板），用于矩阵 / 排期 / 资产统一着色。
const ACCOUNT_COLORS: Record<string, string> = {
  '视频号·东方经典': '#059669',
  '公众号·深度长文': '#2a9d90',
  '小红书·图文卡片': '#e76e50',
  '播客·内在秩序': '#274754',
  '抖音·金句短视频': '#e8c468',
}
function accountColor(name: string): string {
  return ACCOUNT_COLORS[name] ?? '#94a3b8'
}

function AccountMatrixOverview({
  accounts,
  calendar,
}: {
  accounts: { id: string; name: string; platform: string; tone: string; isPrimary?: boolean; publishedTotal: number }[]
  calendar: ContentCalendarEntry[]
}) {
  const plannedByAccount = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of calendar) {
      if (c.status === 'published') continue
      map.set(c.platform, (map.get(c.platform) ?? 0) + 1)
    }
    return map
  }, [calendar])

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">账号矩阵</h3>
        <span className="text-xs text-muted-foreground">{accounts.length} 个账号 · {new Set(accounts.map((a) => a.platform)).size} 个平台</span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const color = accountColor(a.name)
          const due = plannedByAccount.get(a.name) ?? 0
          return (
            <div
              key={a.id}
              className="group rounded-xl border border-border/50 bg-background/40 p-3 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {a.name}
                </span>
                {a.isPrimary && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">主账号</span>
                )}
              </div>
              <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">{a.tone}</p>
              <div className="mt-2.5 flex items-center gap-4 text-[11px]">
                <span className="text-muted-foreground">
                  累计发布 <span className="font-semibold text-foreground tabular-nums">{a.publishedTotal}</span>
                </span>
                <span className="text-muted-foreground">
                  本周待发 <span className="font-semibold tabular-nums" style={{ color }}>{due}</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function BrandStudioWorkbench({ brandCheckDict }: { brandCheckDict: Dictionary['brandCheck'] }) {
  const [ideas, setIdeas] = useState<ContentIdea[]>(brandStudioMock.ideas)
  const [calendar, setCalendar] = useState<ContentCalendarEntry[]>(brandStudioMock.calendar)
  const [assets] = useState<ContentAsset[]>(brandStudioMock.assets)
  const [accounts] = useState<BrandStudioMock['accounts']>(brandStudioMock.accounts)
  const { positioning } = brandStudioMock

  function handleStatus(id: string, s: ContentIdea['status']) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status: s } : i)))
  }
  function handleDelete(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id))
    setCalendar((prev) => prev.filter((c) => c.idea_id !== id))
  }

  return (
    <div className="space-y-4">
      <PrototypeBadge />
      <IpOverview summary={positioning.summary} pillars={positioning.pillars} />
      <BrandInsightsBar ideas={ideas} calendar={calendar} accounts={accounts} />

      <AccountMatrixOverview accounts={accounts} calendar={calendar} />

      <div className="grid gap-4 lg:grid-cols-2">
        <IdeaPipeline ideas={ideas} onStatus={handleStatus} onDelete={handleDelete} />
        <div className="space-y-4">
          <CalendarBoard calendar={calendar} accounts={accounts} />
          <AssetTree assets={assets} />
        </div>
      </div>

      <BrandCheckPanel r={brandCheckDict} />

      <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
        原型阶段：所有新建 / 编辑 / 排期 / 删除仅在本地生效，刷新即还原。确认方向后将接入真实后端。
      </div>
    </div>
  )
}
