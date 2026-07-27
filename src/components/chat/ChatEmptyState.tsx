'use client'

import type { ChatCopy } from '@/lib/chat/types'

type Props = {
  copy: ChatCopy
  onPick: (text: string) => void
}

export function ChatEmptyState({ copy, onPick }: Props) {
  return (
    <div className="flex h-full min-h-96 items-center justify-center">
      <div className="mx-auto max-w-xl text-center">
        <div className="text-base font-medium tracking-tight text-foreground md:text-lg">{copy.emptyTitle}</div>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{copy.emptyBody}</p>
        <div className="mx-auto mt-7 flex max-w-lg flex-wrap justify-center gap-2">
          {copy.emptyChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onPick(chip)}
              className="rounded-full border border-border bg-muted/40 px-3.5 py-2 text-[13px] text-foreground transition duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-[0.985]"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
