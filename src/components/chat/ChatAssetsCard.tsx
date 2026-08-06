'use client'

import { Check, FolderTree, FileText, PenLine, StickyNote, BarChart3, Target, Wrench, Lightbulb } from 'lucide-react'
import type { ChatAssetDraft, ChatAssetKind, ChatCopy } from '@/lib/chat/types'

const KIND_META: Record<ChatAssetKind, { icon: typeof FileText; label: string }> = {
  idea: { icon: Lightbulb, label: '选题' },
  script: { icon: PenLine, label: '脚本' },
  note: { icon: StickyNote, label: '笔记' },
  data: { icon: BarChart3, label: '数据' },
  strategy: { icon: Target, label: '战略' },
  tool: { icon: Wrench, label: '工具' },
  other: { icon: FileText, label: '资产' }
}

type Props = {
  assets: ChatAssetDraft[]
  copy: ChatCopy
}

// AI 已自动沉淀资产并归档，用户零操作，仅做只读提示。
export function ChatAssetsCard({ assets, copy }: Props) {
  if (!assets.length) return null
  return (
    <div className="relative mt-2 rounded-2xl border border-border/70 bg-card/70 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-emerald-600">
          <FolderTree className="mr-1 inline h-3 w-3" />
          {copy.assetCardTitle}
        </span>
      </div>
      <ul className="mt-2.5 space-y-2">
        {assets.map((asset) => {
          const meta = KIND_META[asset.kind] ?? KIND_META.other
          const Icon = meta.icon
          return (
            <li key={asset.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-medium text-primary">
                    {meta.label}
                  </span>
                  <span className="truncate text-[14px] font-medium text-foreground">
                    {asset.title}
                  </span>
                </div>
                {asset.summary && (
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-5 text-muted-foreground">
                    {asset.summary}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] text-emerald-600/90">
        <Check className="h-3.5 w-3.5" />
        {copy.assetAutoSaved}
      </div>
    </div>
  )
}
