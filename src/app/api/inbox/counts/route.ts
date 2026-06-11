import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getInboxCounts } from '@/lib/inbox/queries'

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

export async function GET() {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) return json({ error: { code: 'unauthenticated', message: 'unauthenticated' } }, 401)

	try {
		const counts = await getInboxCounts({ supabase, userId: user.id })
		return json(counts, 200)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'operation_failed'
		return json({ error: { code: message, message } }, 500)
	}
}

