import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildGoalCalendarICS } from '@/lib/ics'

export const runtime = 'nodejs'

interface RouteProps {
  params: Promise<{ goalId: string }>
}

export async function GET(_req: Request, { params }: RouteProps) {
  const { goalId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  if (!goalId) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('id, title')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (goalError) {
    return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
  }

  if (!goal?.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { data: actions, error: actionsError } = await supabase
    .from('actions')
    .select('id, title, description, start_date, end_date, completed, priority, type')
    .eq('goal_id', goalId)
    .eq('user_id', user.id)
    .eq('completed', false)
    .not('start_date', 'is', null)
    .order('start_date', { ascending: true })
    .limit(500)

  if (actionsError) {
    return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
  }

  const { filename, content } = buildGoalCalendarICS({
    goalTitle: goal.title as string,
    events: (actions || []).map((action) => ({
      id: action.id as string,
      title: action.title as string,
      startDate: action.start_date as string,
      endDate: (action.end_date as string | null) || (action.start_date as string),
      description: (action.description as string | null) || null,
      priority: (action.priority as string | null) || null,
      type: (action.type as string | null) || null,
    })),
  })

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
