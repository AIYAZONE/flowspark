import Link from 'next/link'
import { CalendarClock } from 'lucide-react'

import type { Dict } from '@/lib/goalCategories'

export function WeeklyReviewReminderBanner({
  dict,
  locale,
}: {
  dict: Dict
  locale: 'zh' | 'en'
}) {
  const t = dict.review.reminderBanner
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-0.5">
          <div className="text-sm font-semibold">{t.title}</div>
          <div className="text-sm text-muted-foreground">{t.body}</div>
        </div>
      </div>
      <Link
        href="/review"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t.cta}
        <span aria-hidden>{locale === 'zh' ? '→' : '→'}</span>
      </Link>
    </div>
  )
}
