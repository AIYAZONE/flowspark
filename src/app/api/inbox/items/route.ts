import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { listInboxItems, type InboxStatus } from '@/lib/inbox/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(payload: unknown, status: number) {
	return NextResponse.json(payload, {
		status,
		headers: {
			'Cache-Control': 'private, no-store'
		}
	})
}

export async function GET(req: Request) {
	const url = new URL(req.url)
	const statusRaw = url.searchParams.get('status') || ''
	const status = statusRaw === 'archived' ? 'archived' : statusRaw === 'open' ? 'open' : null
	if (!status) {
		return json({ error: { code: 'invalid_status', message: 'invalid_status' } }, 400)
	}

	const limitRaw = url.searchParams.get('limit') || ''
	const limit = Number(limitRaw)
	if (!Number.isFinite(limit)) {
		return json({ error: { code: 'invalid_limit', message: 'invalid_limit' } }, 400)
	}

	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) return json({ error: { code: 'unauthenticated', message: 'unauthenticated' } }, 401)

	try {
		const items = await listInboxItems({
			supabase,
			userId: user.id,
			status: status as InboxStatus,
			limit
		})
		return json({ items }, 200)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'operation_failed'
		const statusCode = message === 'invalid_limit' ? 400 : 500
		return json({ error: { code: message, message } }, statusCode)
	}
}

