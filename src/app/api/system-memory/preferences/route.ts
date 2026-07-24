import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import {
  createSystemMemoryPreference,
  deleteSystemMemoryPreference,
  isSystemMemoryPreferenceKey,
  listSystemMemoryPreferences,
  updateSystemMemoryPreference,
} from '@/lib/system-memory/preferences'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(payload: unknown, status: number) {
  return NextResponse.json(payload, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
    },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null }
  return { supabase, user }
}

async function readBody(req: Request) {
  try {
    return await req.json()
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return json({ error: { code: 'unauthenticated', message: 'unauthenticated' } }, 401)

  const locale = new URL(req.url).searchParams.get('locale') === 'en' ? 'en' : 'zh'

  try {
    const preferences = await listSystemMemoryPreferences({ supabase, userId: user.id, locale })
    return json({ preferences }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    return json({ error: { code: message, message } }, 500)
  }
}

export async function POST(req: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return json({ error: { code: 'unauthenticated', message: 'unauthenticated' } }, 401)

  const body = await readBody(req)
  if (!isRecord(body)) return json({ error: { code: 'invalid_json', message: 'invalid_json' } }, 400)

  const key = typeof body.key === 'string' ? body.key : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : true
  if (!isSystemMemoryPreferenceKey(key) || !title || !description) {
    return json({ error: { code: 'missing_fields', message: 'missing_fields' } }, 400)
  }

  try {
    await createSystemMemoryPreference({
      supabase,
      userId: user.id,
      key,
      title,
      description,
      enabled,
    })
    return json({ ok: true }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    const status = message === 'missing_fields' ? 400 : 500
    return json({ error: { code: message, message } }, status)
  }
}

export async function PATCH(req: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return json({ error: { code: 'unauthenticated', message: 'unauthenticated' } }, 401)

  const body = await readBody(req)
  if (!isRecord(body)) return json({ error: { code: 'invalid_json', message: 'invalid_json' } }, 400)

  const key = typeof body.key === 'string' ? body.key : ''
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : undefined
  const description = typeof body.description === 'string' ? body.description : undefined
  if (!isSystemMemoryPreferenceKey(key)) {
    return json({ error: { code: 'missing_fields', message: 'missing_fields' } }, 400)
  }

  try {
    await updateSystemMemoryPreference({
      supabase,
      userId: user.id,
      key,
      enabled,
      description,
    })
    return json({ ok: true }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    const status = message === 'missing_fields' ? 400 : 500
    return json({ error: { code: message, message } }, status)
  }
}

export async function DELETE(req: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return json({ error: { code: 'unauthenticated', message: 'unauthenticated' } }, 401)

  const body = await readBody(req)
  if (!isRecord(body)) return json({ error: { code: 'invalid_json', message: 'invalid_json' } }, 400)

  const key = typeof body.key === 'string' ? body.key : ''
  if (!isSystemMemoryPreferenceKey(key)) {
    return json({ error: { code: 'missing_fields', message: 'missing_fields' } }, 400)
  }

  try {
    await deleteSystemMemoryPreference({ supabase, userId: user.id, key })
    return json({ ok: true }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    return json({ error: { code: message, message } }, 500)
  }
}
