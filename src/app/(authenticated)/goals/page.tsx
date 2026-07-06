import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { GoalListFilter } from '@/components/GoalListFilter'
import { AddGoalDialog } from '@/components/AddGoalDialog'

export default async function GoalsPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const locale = (dict.common.locale || '').toLowerCase()
  const isZh = locale.startsWith('zh')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeCount = (goals || []).filter((g) => g.status === 'active').length
  const starredCount = (goals || []).filter((g) => g.status === 'active' && g.is_starred).length
  const archivedCount = (goals || []).filter((g) => g.status === 'archived').length
  const eyebrow = isZh ? '人生路径' : 'Life Paths'
  const focusHint =
    activeCount >= 4
      ? isZh
        ? `你当前有 ${activeCount} 条进行中路径，建议先完成/归档一些再新建。`
        : `You have ${activeCount} active paths. Consider finishing/archiving some before creating more.`
      : isZh
        ? '建议同时推进 ≤3 条进行中路径（进行中上限 5）'
        : 'Try to keep ≤3 active paths (limit: 5).'

  return (
    <div className="space-y-7">
      <div className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/10 via-background to-background p-5 shadow-sm shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-background/60 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">{eyebrow}</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{dict.goals.title}</h1>
            <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{dict.goals.subtitle}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground/80 dark:border-white/10 dark:bg-background/40">
                <span className="text-muted-foreground">{dict.goals.status.active}</span>
                <span className="font-mono tabular-nums text-foreground">{activeCount}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground/80 dark:border-white/10 dark:bg-background/40">
                <span className="text-muted-foreground">{dict.goals.filter.starredGoals}</span>
                <span className="font-mono tabular-nums text-foreground">{starredCount}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground/80 dark:border-white/10 dark:bg-background/40">
                <span className="text-muted-foreground">{dict.goals.status.archived}</span>
                <span className="font-mono tabular-nums text-foreground">{archivedCount}</span>
              </div>
            </div>
            <div
              className={`mt-3 text-xs ${
                activeCount >= 4 ? 'text-amber-700/80 dark:text-amber-300/80' : 'text-muted-foreground'
              }`}
            >
              {focusHint}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AddGoalDialog
              dict={dict}
              trigger={
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-[color,background-color,box-shadow,transform] duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 active:scale-[0.985] active:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {dict.goals.newGoal}
                </button>
              }
            />
            {activeCount >= 5 ? (
              <div className="hidden text-xs text-amber-700/80 dark:text-amber-300/80 sm:block">已达进行中上限（5）</div>
            ) : null}
          </div>
        </div>
      </div>

      <GoalListFilter initialGoals={goals || []} dict={dict} />
    </div>
  )
}
