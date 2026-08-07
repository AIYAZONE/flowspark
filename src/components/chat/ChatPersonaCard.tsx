'use client'

import { Check, UserCog } from 'lucide-react'
import { PERSONA_CATEGORY_LABELS } from '@/lib/persona-types'
import type { ChatCopy, ChatPersonaDraft } from '@/lib/chat/types'

type Props = {
  items: ChatPersonaDraft[]
  copy: ChatCopy
}

// AI 已从对话中自动沉淀「关于你的个人记忆」，用户零操作，仅做只读提示。
export function ChatPersonaCard({ items, copy }: Props) {
  if (!items.length) return null
  return (
    <div className="relative mt-2 rounded-2xl border border-border/70 bg-card/70 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-sky-600">
          <UserCog className="mr-1 inline h-3 w-3" />
          {copy.personaCardTitle}
        </span>
      </div>
      <ul className="mt-2.5 space-y-2">
        {items.map((it, i) => {
          const label = PERSONA_CATEGORY_LABELS[it.category as keyof typeof PERSONA_CATEGORY_LABELS] ?? it.category
          return (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground">
                <UserCog className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-medium text-primary">
                    {label}
                  </span>
                  <span className="truncate text-[14px] font-medium text-foreground">
                    {it.title}
                  </span>
                </div>
                {it.detail && (
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-5 text-muted-foreground">
                    {it.detail}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] text-sky-600/90">
        <Check className="h-3.5 w-3.5" />
        {copy.personaAutoSaved}
      </div>
    </div>
  )
}
