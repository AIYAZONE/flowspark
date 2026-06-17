import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { buildGoalCalendarICS, buildUserCalendarICS } from '@/lib/ics'

export const runtime = 'nodejs'

interface RouteProps {
  params: Promise<{ token: string }>
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

function isExpired(expiresAt?: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now())
}

export async function GET(_req: Request, { params }: RouteProps) {
  const { token } = await params

  if (!token) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role_key' }, { status: 500 })
  }
  const { data: feed, error: feedError } = await supabase
    .from('calendar_feeds')
    .select('owner_id, scope, goal_id, revoked_at, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (feedError) {
    return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
  }

  const invalid = !feed || Boolean(feed.revoked_at) || isExpired(feed.expires_at as string | null)
  if (invalid) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const ownerId = feed.owner_id as string
  const scope = feed.scope as 'user' | 'goal'
  const goalId = (feed.goal_id as string | null) || null

  if (scope === 'goal' && !goalId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (scope === 'goal' && goalId) {
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('id, title')
      .eq('id', goalId)
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
      .or(`user_id.eq.${ownerId},owner_id.eq.${ownerId}`)
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

  const { data: actions, error: actionsError } = await supabase
    .from('actions')
    .select('id, title, description, start_date, end_date, completed, priority, type, goal:goals(title)')
    .or(`user_id.eq.${ownerId},owner_id.eq.${ownerId}`)
    .eq('completed', false)
    .not('start_date', 'is', null)
    .order('start_date', { ascending: true })
    .limit(500)

  if (actionsError) {
    return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
  }

  const { filename, content } = buildUserCalendarICS({
    calendarTitle: 'FlowSpark · My Actions',
    events: (actions || []).map((action) => ({
      id: action.id as string,
      title: action.title as string,
      goalTitle: ((action as unknown as { goal?: { title?: string } | null }).goal?.title as string | undefined) || null,
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
