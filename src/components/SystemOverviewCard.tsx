import { BrainCircuit, Route, Shield, Sparkles } from 'lucide-react'

export function SystemOverviewCard({
  locale,
  activeGoalsCount,
  streak,
  shieldBalance,
  todayScore,
  incompleteActionsCount,
}: {
  locale: 'zh' | 'en'
  activeGoalsCount: number
  streak: number
  shieldBalance: number
  todayScore: number | null
  incompleteActionsCount: number
}) {
  const title = locale === 'zh' ? '系统' : 'System'
  const subtitle =
    locale === 'zh'
      ? '查看你的人生系统最近如何运转，以及下一步应该把重心放在哪里。'
      : 'See how your life system has been running lately, and where to put your focus next.'
  const activePathsLabel = locale === 'zh' ? '活跃路径' : 'Active paths'
  const activePathsBody = locale === 'zh' ? '你当前真正持续推进的长期方向。' : 'The long arcs you are actively moving forward.'
  const continuityLabel = locale === 'zh' ? '连续系统' : 'Continuity'
  const continuityBody =
    locale === 'zh'
      ? `连续 ${streak} 天，护盾 ${shieldBalance} 个。`
      : `${streak}-day streak, ${shieldBalance} shield(s).`
  const todayLabel = locale === 'zh' ? '今日执行' : 'Today state'
  const todayValue = todayScore ?? incompleteActionsCount
  const todayBody =
    todayScore != null
      ? locale === 'zh'
        ? `今日评分已记录，剩余 ${incompleteActionsCount} 个行动待推进。`
        : `Score submitted. ${incompleteActionsCount} action(s) still open.`
      : locale === 'zh'
        ? `${incompleteActionsCount} 个行动待推进，系统仍在等待今日输入。`
        : `${incompleteActionsCount} action(s) still open. The system is still waiting for today’s input.`

  return (
    <div className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/10 via-background to-background p-5 shadow-sm md:p-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        <span>{locale === 'zh' ? 'Premium Life OS' : 'Premium Life OS'}</span>
      </div>
      <div className="mt-4 space-y-2">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
        <div className="max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <Route className="h-3.5 w-3.5" />
            <span>{activePathsLabel}</span>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight">{activeGoalsCount}</div>
          <div className="mt-1 text-xs text-muted-foreground">{activePathsBody}</div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>{continuityLabel}</span>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight">{streak}</div>
          <div className="mt-1 text-xs text-muted-foreground">{continuityBody}</div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>{todayLabel}</span>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight">{todayValue}</div>
          <div className="mt-1 text-xs text-muted-foreground">{todayBody}</div>
        </div>
      </div>
    </div>
  )
}

