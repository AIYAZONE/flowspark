import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAIChatJSON } from '@/lib/ai/client'

export const runtime = 'nodejs'

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1))
    throw new Error('invalid_json')
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const profile = typeof payload.profile === 'string' ? payload.profile.trim() : ''
  const goal = typeof payload.goal === 'string' ? payload.goal.trim() : ''
  const locale = payload.locale === 'zh' ? 'zh' : 'en'
  if (!profile || !goal) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const system =
    locale === 'zh'
      ? '你是职业发展与个人成长教练。仅输出严格JSON。格式: {"summary":string,"strengths":string[],"risks":string[],"opportunities":string[],"execution_style":string,"next_7_days":[{"day":string,"focus":string}],"actions":[{"title":string,"reason":string}]}. actions 返回3-5条。'
      : 'You are a personal growth coach. Output strict JSON only: {"summary":string,"strengths":string[],"risks":string[],"opportunities":string[],"execution_style":string,"next_7_days":[{"day":string,"focus":string}],"actions":[{"title":string,"reason":string}]}. Return 3-5 actions.'
  const userPrompt = locale === 'zh'
    ? `用户背景:\n${profile}\n\n突破方向:\n${goal}`
    : `User background:\n${profile}\n\nBreakthrough goal:\n${goal}`

  try {
    const raw = await callAIChatJSON({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    })

    const parsed = safeParse(raw) as {
      summary?: unknown
      strengths?: unknown
      risks?: unknown
      opportunities?: unknown
      execution_style?: unknown
      next_7_days?: unknown
      actions?: unknown
    }

    const summary = typeof parsed.summary === 'string' ? parsed.summary : ''
    const strengths = Array.isArray(parsed.strengths) ? parsed.strengths.filter((x): x is string => typeof x === 'string').slice(0, 5) : []
    const risks = Array.isArray(parsed.risks) ? parsed.risks.filter((x): x is string => typeof x === 'string').slice(0, 5) : []
    const opportunities = Array.isArray(parsed.opportunities) ? parsed.opportunities.filter((x): x is string => typeof x === 'string').slice(0, 5) : []
    const executionStyle = typeof parsed.execution_style === 'string' ? parsed.execution_style : ''
    const next7Days = Array.isArray(parsed.next_7_days)
      ? parsed.next_7_days
        .filter((x): x is { day?: unknown; focus?: unknown } => !!x && typeof x === 'object')
        .map((x) => ({
          day: typeof x.day === 'string' ? x.day : '',
          focus: typeof x.focus === 'string' ? x.focus : ''
        }))
        .filter((x) => x.day && x.focus)
        .slice(0, 7)
      : []
    const actions = Array.isArray(parsed.actions)
      ? parsed.actions
        .filter((x): x is { title?: unknown; reason?: unknown } => !!x && typeof x === 'object')
        .map((x) => ({
          title: typeof x.title === 'string' ? x.title : '',
          reason: typeof x.reason === 'string' ? x.reason : ''
        }))
        .filter((x) => x.title)
        .slice(0, 5)
      : []

    if (!summary || actions.length === 0) {
      return NextResponse.json({ error: 'invalid_ai_output' }, { status: 502 })
    }

    const result = {
      summary,
      strengths,
      risks,
      opportunities,
      execution_style: executionStyle,
      next_7_days: next7Days,
      actions
    }

    const { data: session, error: sessionError } = await supabase
      .from('potential_sessions')
      .insert({
        user_id: user.id,
        owner_id: user.id,
        profile_input: profile,
        goal_input: goal,
        result_json: result
      })
      .select('id')
      .single()

    if (sessionError) {
      return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
    }

    return NextResponse.json({
      sessionId: session.id,
      result
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    const status = message === 'missing_ai_key' ? 500 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
