'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Calendar, FileText, ArrowRight, LayoutGrid, Target, FolderTree } from 'lucide-react'
import type { Dictionary } from '@/i18n/types'
import type { ContentIdea, ContentCalendarEntry } from '@/lib/contentBrand'
import type { ContentFolder, ContentAsset, CreatorDimension } from '@/lib/contentAsset'
import { useState } from 'react'

export function BrandStudioClient({
  dict,
  initialIdeas,
  initialCalendar,
  initialFolders: _initialFolders,
  initialAssets,
  initialDimensions,
}: {
  dict: Dictionary
  initialIdeas: ContentIdea[]
  initialCalendar: ContentCalendarEntry[]
  initialFolders: ContentFolder[]
  initialAssets: ContentAsset[]
  initialDimensions: CreatorDimension[]
}) {
  const r = dict.brandStudio
  const [activeDim, setActiveDim] = useState<string | null>(null)

  // 按更新时间倒序排列所有资产
  const timelineItems: TimelineItem[] = [
    ...initialIdeas.map((idea) => ({
      id: idea.id,
      kind: 'idea' as const,
      title: idea.title,
      subtitle: idea.angle || idea.hook || undefined,
      status: idea.status,
      updatedAt: idea.updated_at || idea.created_at,
      notes: idea.notes,
    })),
    ...initialCalendar.map((entry) => ({
      id: entry.id,
      kind: 'calendar' as const,
      title: entry.note || entry.platform,
      subtitle: entry.planned_date ? new Date(entry.planned_date).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      }) : undefined,
      status: 'planned',
      updatedAt: entry.updated_at || entry.created_at,
    })),
    ...initialAssets.map((asset) => ({
      id: asset.id,
      kind: 'asset' as const,
      title: asset.title || '未命名',
      subtitle: asset.kind || undefined,
      status: 'draft',
      updatedAt: asset.updated_at || asset.created_at,
    })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const hasIdeas = initialIdeas.length > 0
  const hasAnyContent = timelineItems.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {r.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {r.subtitle}
          </p>
        </div>
      </div>

      {/* IP定位摘要卡片 */}
      <Card className="border-border/60 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-primary" />
            {hasIdeas
              ? '你的IP已经有了初步方向'
              : '你的IP定位'}
          </CardTitle>
          <CardDescription className="text-sm">
            {hasIdeas
              ? `你已经积累了 ${initialIdeas.length} 个想法，它们正在帮你的IP逐渐成型。去聊天里继续聊聊，把想法变成内容。`
              : '去聊天里和AI聊聊你想做什么，它会帮你把模糊的想法一步步理清楚。'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 创作者维度视图：按标签聚合目标与资产 */}
      {initialDimensions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-muted-foreground">
              {r.dimensionsTitle}
            </h2>
          </div>

          {/* 标签云 */}
          <div className="flex flex-wrap gap-2">
            {initialDimensions.map((dim) => {
              const total = dim.goalCount + dim.assetCount
              const isActive = activeDim === dim.name
              return (
                <button
                  key={dim.name}
                  type="button"
                  onClick={() => setActiveDim(isActive ? null : dim.name)}
                  className={
                    'group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ' +
                    (isActive
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border/60 bg-card/40 text-foreground hover:border-primary/20 hover:bg-primary/5')
                  }
                >
                  <span>{dim.name}</span>
                  <span className="rounded-full bg-muted/70 px-1.5 text-[11px] text-muted-foreground">
                    {total}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 选中维度后展开的明细 */}
          {activeDim && (() => {
            const dim = initialDimensions.find((d) => d.name === activeDim)
            if (!dim) return null
            return (
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="border-border/50 bg-card/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-primary" />
                      {r.dimensionsGoals}（{dim.goalCount}）
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dim.goals.length ? (
                      <ul className="space-y-1.5">
                        {dim.goals.map((g) => (
                          <li key={g.id} className="flex items-center justify-between gap-2 text-sm">
                            <Link
                              href={`/goals/${g.id}`}
                              className="truncate text-foreground hover:text-primary hover:underline"
                            >
                              {g.title}
                            </Link>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {g.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">{r.dimensionsEmpty}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <FolderTree className="h-4 w-4 text-emerald-500" />
                      {r.dimensionsAssets}（{dim.assetCount}）
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dim.assets.length ? (
                      <ul className="space-y-1.5">
                        {dim.assets.map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="truncate text-foreground">{a.name}</span>
                            <span className="shrink-0 rounded bg-muted/70 px-1.5 text-[11px] text-muted-foreground">
                              {a.kind}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">{r.dimensionsEmpty}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })()}
        </div>
      )}

      {/* 内容资产时间线 */}
      {hasAnyContent ? (
        <div>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            你已沉淀的内容
          </h2>
          <div className="relative space-y-3">
            {/* 时间线竖线 */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border/40" />

            {timelineItems.map((item, i) => (
              <div key={item.id} className="relative flex items-start gap-4 pl-10">
                {/* 时间线圆点 */}
                <div className="absolute left-3.5 top-2.5 h-2 w-2 rounded-full bg-primary/40 ring-2 ring-background" />

                <Card className="flex-1 border-border/50 bg-card/30 transition-colors hover:bg-card/50">
                  <CardContent className="flex items-center gap-3 p-3">
                    {item.kind === 'idea' && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10">
                        <Lightbulb className="h-4 w-4 text-amber-400" />
                      </div>
                    )}
                    {item.kind === 'calendar' && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
                        <Calendar className="h-4 w-4 text-blue-400" />
                      </div>
                    )}
                    {item.kind === 'asset' && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
                        <FileText className="h-4 w-4 text-emerald-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="truncate text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(item.updatedAt)}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed border-border/50 bg-card/20">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              这里还没有任何内容。去聊天里聊几轮，你的想法会自动出现在这里。
            </p>
          </CardContent>
        </Card>
      )}

      {/* 底部：下一步建议卡片 */}
      <Card className="border-border/50 bg-card/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            建议的下一步
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {!hasIdeas && (
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] px-1.5 py-0">
                  1
                </Badge>
                <span>去聊天里告诉AI你想做什么类型的视频</span>
              </li>
            )}
            {hasIdeas && !initialCalendar.length && (
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] px-1.5 py-0">
                  {!hasIdeas ? 2 : 1}
                </Badge>
                <span>从已有想法里挑一个，聊聊怎么把它变成一条视频</span>
              </li>
            )}
            {hasIdeas && !initialAssets.length && (
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] px-1.5 py-0">
                  {initialCalendar.length ? 2 : 1}
                </Badge>
                <span>让AI帮你写第一条视频的脚本或大纲</span>
              </li>
            )}
            {hasAnyContent && (
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] px-1.5 py-0">
                  {timelineItems.length + 1}
                </Badge>
                <span>继续在聊天里推进你的下一个内容</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] px-1.5 py-0">
                💡
              </Badge>
              <span>不用着急，一条一条来。好的内容都是慢慢磨出来的。</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

type TimelineItem = {
  id: string
  kind: 'idea' | 'calendar' | 'asset'
  title: string
  subtitle?: string
  status: string
  updatedAt: string
  notes?: string | null
}

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const diff = now - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 周前`
  return `${Math.floor(days / 30)} 个月前`
}
