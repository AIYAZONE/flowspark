'use client'

import { ArrowRight, Check } from 'lucide-react'
import type { ChatCopy, ChatReferencedAction } from '@/lib/chat/types'

type Props = {
  actions: ChatReferencedAction[]
  copy: ChatCopy
  onComplete: (id: string) => void
}

/**
 * 渲染助手回复里"引用已有行动"的卡片：每条可直接深链到 /today 展开，或在聊天内联标记完成，
 * 避免把用户已有的行动当成新待办重复创建。
 */
export function ChatReferenceCard({ actions, copy, onComplete }: Props) {
  if (!actions?.length) return null

  return (
    <div className="relative mt-2 rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
        {copy.refTitle}
      </div>
      <div className="space-y-2.5">
        {actions.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-muted/50"
          >
            <span
              className={`min-w-0 flex-1 truncate text-[14px] ${
                a.done ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}
            >
              {a.title}
            </span>
            {a.done ? (
              <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 text-[12px] font-medium text-primary">
                <Check className="h-3.5 w-3.5" />
                {copy.refDone}
              </span>
            ) : (
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`/today?action=${a.id}`}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-[12px] font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.985]"
                >
                  {copy.refGoToday}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => onComplete(a.id)}
                  className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[12px] text-muted-foreground transition hover:bg-muted active:scale-[0.985]"
                >
                  {copy.refComplete}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
