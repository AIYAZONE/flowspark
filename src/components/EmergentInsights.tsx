import Link from 'next/link'
import { AlertTriangle, Clock, Layers, Sparkles } from 'lucide-react'
import type { Dictionary } from '@/i18n/types'

export type StalledGoalInsight = {
  id: string
  title: string
  days: number
}

export type StaleActionInsight = {
  id: string
  title: string
  goalId: string | null
  days: number
}

export type EmergentInsightsData = {
  stalledGoals: StalledGoalInsight[]
  staleActions: StaleActionInsight[]
  quietAreas: string[]
}

function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''))
}

// 确定性"涌现回顾"：纯 SQL/日期计算，无 LLM 质量风险。
// LLM 主动"这几条可能是一件事"的链接建议留作后续 Phase 3c。
export function EmergentInsights({
  data,
  dict
}: {
  data: EmergentInsightsData
  dict: Dictionary['insights']
}) {
  const { stalledGoals, staleActions, quietAreas } = data
  const hasAny = stalledGoals.length > 0 || staleActions.length > 0 || quietAreas.length > 0
  if (!hasAny) return null

  return (
    <div className="mb-6 rounded-xl border border-amber-200/60 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
          {dict.title}
        </h2>
      </div>

      <div className="space-y-3">
        {stalledGoals.length > 0 && (
          <Section icon={AlertTriangle} title={dict.stalledTitle} desc={dict.stalledDesc}>
            <ul className="space-y-1.5">
              {stalledGoals.map((goal) => (
                <li key={goal.id} className="flex items-center gap-2 text-sm">
                  <Link
                    href={`/goals/${goal.id}`}
                    className="flex-1 truncate font-medium text-foreground hover:underline"
                  >
                    {goal.title}
                  </Link>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    {interpolate(dict.stalledItem, { days: goal.days })}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {staleActions.length > 0 && (
          <Section icon={Clock} title={dict.staleTitle} desc={dict.staleDesc}>
            <ul className="space-y-1.5">
              {staleActions.map((action) => (
                <li key={action.id} className="flex items-center gap-2 text-sm">
                  <Link
                    href={`/today?action=${action.id}`}
                    className="flex-1 truncate font-medium text-foreground hover:underline"
                  >
                    {action.title}
                  </Link>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {interpolate(dict.staleItem, { days: action.days })}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {quietAreas.length > 0 && (
          <Section icon={Layers} title={dict.quietTitle} desc={dict.quietDesc}>
            <div className="flex flex-wrap gap-1.5">
              {quietAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {interpolate(dict.quietItem, { area })}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  desc,
  children
}: {
  icon: typeof AlertTriangle
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {desc && <p className="mb-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>}
      {children}
    </div>
  )
}
