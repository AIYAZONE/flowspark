import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pickTopGoalCandidates } from '@/lib/command-bar/candidates'
import type { CommandDraft } from '@/lib/command-bar/types'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import { buildFallbackCommandDraft } from '@/lib/chat-agent/fallback'
import { buildChatAgentDraft } from '@/lib/chat-agent/orchestrator'
import type { ChatAgentSurface } from '@/lib/chat-agent/schemas'
import { filterExecutableActionsForToday } from '@/lib/chat-agent/action-availability'
import { sortActionsForToday } from '@/lib/chat-agent/action-ranking'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'

export const runtime = 'nodejs'

type GoalRow = {
  id: string
  title: string
  priority: string | null
  start_date: string | null
  end_date: string | null
}

type ActionRow = {
  id: string
  title: string
  goalId: string | null
  start_date: string | null
  end_date: string | null
  priority: string | null
  type: string | null
  goalTitle: string | null
}

type RecentTurnPayload = {
  userText: string
  assistantText: string
  state: string
  sourcePage: ChatAgentSurface
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function coerceGoalRow(row: unknown): GoalRow | null {
  if (!isRecord(row)) return null
  const id = typeof row.id === 'string' ? row.id : ''
  const title = typeof row.title === 'string' ? row.title : ''
  if (!id || !title) return null
  return {
    id,
    title,
    priority: typeof row.priority === 'string' ? row.priority : null,
    start_date: typeof row.start_date === 'string' ? row.start_date : null,
    end_date: typeof row.end_date === 'string' ? row.end_date : null,
  }
}

function coerceActionRow(row: unknown): ActionRow | null {
  if (!isRecord(row)) return null
  const id = typeof row.id === 'string' ? row.id : ''
  const title = typeof row.title === 'string' ? row.title : ''
  if (!id || !title) return null
  const goal = isRecord(row.goal) ? row.goal : null
  return {
    id,
    title,
    goalId: typeof row.goal_id === 'string' ? row.goal_id : null,
    start_date: typeof row.start_date === 'string' ? row.start_date : null,
    end_date: typeof row.end_date === 'string' ? row.end_date : null,
    priority: typeof row.priority === 'string' ? row.priority : null,
    type: typeof row.type === 'string' ? row.type : null,
    goalTitle: goal && typeof goal.title === 'string' ? goal.title : null,
  }
}

function coerceRecentTurn(row: unknown): RecentTurnPayload | null {
  if (!isRecord(row)) return null
  const userText = typeof row.userText === 'string' ? row.userText.trim() : ''
  const assistantText = typeof row.assistantText === 'string' ? row.assistantText.trim() : ''
  const state = typeof row.state === 'string' ? row.state.trim() : ''
  const sourcePage = row.sourcePage === 'today' || row.sourcePage === 'profile' || row.sourcePage === 'chat'
    ? row.sourcePage
    : row.sourcePage === 'system'
      ? 'system'
      : null
  if (!userText || !assistantText || !state || !sourcePage) return null
  return { userText, assistantText, state, sourcePage }
}

function compareGoals(a: GoalRow, b: GoalRow) {
  const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
  const pA = pMap[a.priority || 'medium'] ?? 2
  const pB = pMap[b.priority || 'medium'] ?? 2
  if (pA !== pB) return pB - pA

  const endA = a.end_date || '9999-12-31'
  const endB = b.end_date || '9999-12-31'
  if (endA !== endB) return endA < endB ? -1 : 1

  const startA = a.start_date || '9999-12-31'
  const startB = b.start_date || '9999-12-31'
  if (startA !== startB) return startA < startB ? -1 : 1

  return a.title.localeCompare(b.title)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const input = body as Record<string, unknown>
  const text = typeof input.text === 'string' ? input.text : ''
  const locale = input.locale === 'zh' ? 'zh' : 'en'
  const sourcePage =
    input.sourcePage === 'today' || input.sourcePage === 'profile' || input.sourcePage === 'system'
      ? input.sourcePage
      : 'system'
  const recentTurns = Array.isArray(input.recentTurns)
    ? input.recentTurns
      .map(coerceRecentTurn)
      .filter((turn): turn is RecentTurnPayload => Boolean(turn))
      .slice(-3)
    : []
  if (!text.trim()) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)

  const { data: goalRows, error: goalsError } = await supabase
    .from('goals')
    .select('id,title,priority,start_date,end_date')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (goalsError) return NextResponse.json({ error: 'operation_failed' }, { status: 502 })

  const rows: unknown[] = Array.isArray(goalRows) ? goalRows : []
  const goals = rows
    .map(coerceGoalRow)
    .filter((g): g is GoalRow => Boolean(g))
    .sort(compareGoals)

  const mainPath = goals[0] ? { id: goals[0].id, title: goals[0].title } : null

  const recentActive = goals.slice(1, 3).map((g) => ({ id: g.id, title: g.title }))

  const candidates = pickTopGoalCandidates({
    mainPath,
    recentActive,
    allGoals: goals.map((g) => ({ id: g.id, title: g.title })),
    queryText: text,
  })

  const { data: actionRows, error: actionsError } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) =>
      supabase
        .from('actions')
        .select('id, title, goal_id, start_date, end_date, priority, type, goal:goals(title)')
        .eq(ownershipColumn, user.id)
        .eq('completed', false)
        .limit(12),
  })

  if (actionsError) {
    return NextResponse.json({ error: 'operation_failed' }, { status: 502 })
  }

  const executableActions = filterExecutableActionsForToday({
    actions: ((Array.isArray(actionRows) ? actionRows : []) as unknown[])
      .map(coerceActionRow)
      .filter((action): action is ActionRow => Boolean(action)),
    today,
  })
  const actions = sortActionsForToday({
    actions: executableActions,
    today,
    primaryGoalId: mainPath?.id ?? null,
  })

  let draft: CommandDraft | null = null
  try {
    draft = await buildChatAgentDraft({
      locale,
      text,
      sourcePage,
      recentTurns,
      goals,
      openActions: actions,
      goalCandidates: candidates,
      mainPath,
    })
  } catch {
    draft = null
  }

  if (!draft) {
    draft = buildFallbackCommandDraft({
      locale,
      text,
      mainPathId: mainPath?.id ?? null,
      goalCandidates: candidates,
      openActions: actions,
    })
  }

  return NextResponse.json(draft, { status: 200 })
}
