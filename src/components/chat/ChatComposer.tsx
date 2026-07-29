'use client'

import * as React from 'react'
import { ArrowUp } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
  onSend: (text: string) => void
  placeholder: string
  disabled?: boolean
}

export function ChatComposer({ value, onChange, onSend, placeholder, disabled = false }: Props) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  const autoGrow = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }, [])

  React.useEffect(() => {
    autoGrow()
  }, [value, autoGrow])

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    onChange('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border bg-background px-3 py-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] md:px-4">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="flex w-full resize-none rounded-md border-0 bg-transparent px-0 py-2 text-[15px] leading-7 text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-0"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim() || disabled}
        aria-label="发送"
        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:bg-primary/90 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-40"
      >
        <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  )
}
