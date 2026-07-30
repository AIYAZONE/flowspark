'use client'

import Link from 'next/link'
import type { Dictionary } from '@/i18n/types'

// 入口卡：指向可操作周回顾 /review 的入口。
export function WeeklyInsightCard({
  dict
}: {
  dict: Dictionary
}) {
  const r = dict.review
  return (
    <Link
      href="/review"
      className="group block rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-card/80"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.title}</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight">{r.subtitle}</h3>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
        {r.startBtn}
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  )
}
