'use client'

import type en from '@/i18n/en.json'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { InboxItemRow } from '@/components/InboxItemRow'
import { InboxCard } from '@/components/InboxCard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'

type Dict = typeof en
type InboxTab = 'open' | 'archived'

type InboxItem = {
	id: string
	content: string
	note: string
	tags: string[]
	status: InboxTab
	created_at: string
}

type Counts = { open: number; archived: number }

const TTL_MS = 60_000

type TabCache = {
	preview10?: InboxItem[]
	full50?: InboxItem[]
	updatedAt?: number
}

type UserBucket = {
	byStatus: Record<InboxTab, TabCache>
	counts?: (Counts & { updatedAt: number })
	tokens: Record<InboxTab, number>
	controllers: Record<InboxTab, AbortController | null>
}

const cacheByUserId: Record<string, UserBucket> = {}

function getBucket(userId: string): UserBucket {
	if (!cacheByUserId[userId]) {
		cacheByUserId[userId] = {
			byStatus: { open: {}, archived: {} },
			tokens: { open: 0, archived: 0 },
			controllers: { open: null, archived: null }
		}
	}
	return cacheByUserId[userId]
}

function isFresh(updatedAt?: number) {
	if (!updatedAt) return false
	return Date.now() - updatedAt <= TTL_MS
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, { ...init, cache: 'no-store' })
	const data = (await res.json()) as unknown
	if (!res.ok) {
		if (isRecord(data) && isRecord(data.error) && typeof data.error.code === 'string') {
			throw new Error(data.error.code)
		}
		throw new Error('operation_failed')
	}
	return data as T
}

export function InboxTabsClient({
	userId,
	dict,
	initialTab,
	initialItems50,
	initialCounts,
	activeGoals,
	startDefault,
	endDefault
}: {
	userId: string
	dict: Dict
	initialTab: InboxTab
	initialItems50: InboxItem[]
	initialCounts: Counts
	activeGoals: { id: string; title: string }[]
	startDefault: string
	endDefault: string
}) {
	const router = useRouter()
	const bucket = useMemo(() => getBucket(userId), [userId])
	const [tab, setTab] = useState<InboxTab>(initialTab)
	const [items, setItems] = useState<InboxItem[]>(() => initialItems50)
	const [counts, setCounts] = useState<Counts>(initialCounts)
	const [isFetching, setIsFetching] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const tabRef = useRef<InboxTab>(initialTab)

	useEffect(() => {
		const now = Date.now()
		const initialCache = bucket.byStatus[initialTab]
		if (!initialCache.full50) {
			initialCache.full50 = initialItems50
			initialCache.preview10 = initialItems50.slice(0, 10)
			initialCache.updatedAt = now
		}
		if (!bucket.counts) {
			bucket.counts = { ...initialCounts, updatedAt: now }
		}
	}, [bucket, initialCounts, initialItems50, initialTab])
	useEffect(() => {
		tabRef.current = tab
	}, [tab])

	function toTabHref(nextTab: InboxTab) {
		return `/inbox?tab=${nextTab}`
	}

	function getCachedItems(nextTab: InboxTab) {
		const cache = bucket.byStatus[nextTab]
		if (cache.full50 && cache.full50.length > 0) return cache.full50
		if (cache.preview10 && cache.preview10.length > 0) return cache.preview10
		return []
	}

	async function refreshCounts(force = false) {
		const current = bucket.counts
		if (!force && current && isFresh(current.updatedAt)) return

		try {
			const next = await fetchJson<Counts>('/api/inbox/counts')
			const now = Date.now()
			bucket.counts = { ...next, updatedAt: now }
			setCounts(next)
		} catch (err) {
			const key = err instanceof Error ? err.message : 'operation_failed'
			const errors = dict.common.errors as unknown as Record<string, string>
			setError(errors[key] || dict.common.errors.operation_failed)
		}
	}

	async function loadTab(nextTab: InboxTab, force = false) {
		const cache = bucket.byStatus[nextTab]
		const shouldRefetch = force || !isFresh(cache.updatedAt)
		const needPreview = !cache.preview10 || cache.preview10.length === 0 || shouldRefetch
		const needFull = !cache.full50 || cache.full50.length === 0 || shouldRefetch
		if (!needPreview && !needFull) return

		setIsFetching(true)
		setError(null)

		const token = bucket.tokens[nextTab] + 1
		bucket.tokens[nextTab] = token
		bucket.controllers[nextTab]?.abort()
		const controller = new AbortController()
		bucket.controllers[nextTab] = controller

		try {
			if (needPreview) {
				const previewRes = await fetchJson<{ items: InboxItem[] }>(`/api/inbox/items?status=${nextTab}&limit=10`, {
					signal: controller.signal
				})
				if (bucket.tokens[nextTab] === token) {
					const now = Date.now()
					cache.preview10 = previewRes.items
					cache.updatedAt = now
					if (!cache.full50 || cache.full50.length === 0) {
						if (tabRef.current === nextTab) setItems(previewRes.items)
					}
				}
			}

			if (needFull) {
				const fullRes = await fetchJson<{ items: InboxItem[] }>(`/api/inbox/items?status=${nextTab}&limit=50`, {
					signal: controller.signal
				})
				if (bucket.tokens[nextTab] === token) {
					const now = Date.now()
					cache.full50 = fullRes.items
					cache.preview10 = fullRes.items.slice(0, 10)
					cache.updatedAt = now
					if (tabRef.current === nextTab) setItems(fullRes.items)
				}
			}
		} catch (err) {
			if (!controller.signal.aborted) {
				const key = err instanceof Error ? err.message : 'operation_failed'
				const errors = dict.common.errors as unknown as Record<string, string>
				setError(errors[key] || dict.common.errors.operation_failed)
			}
		} finally {
			if (bucket.tokens[nextTab] === token) {
				setIsFetching(false)
			}
		}
	}

	function invalidateCache() {
		bucket.byStatus.open.updatedAt = 0
		bucket.byStatus.archived.updatedAt = 0
		if (bucket.counts) bucket.counts.updatedAt = 0
	}

	async function refresh() {
		invalidateCache()
		await Promise.all([loadTab(tabRef.current, true), refreshCounts(true)])
	}

	async function handleTabChange(nextTab: InboxTab) {
		if (nextTab === tab) return
		tabRef.current = nextTab
		setTab(nextTab)
		setError(null)
		router.replace(toTabHref(nextTab))
		setItems(getCachedItems(nextTab))
		await Promise.all([loadTab(nextTab, false), refreshCounts(false)])
	}

	const openCount = counts.open ?? 0
	const archivedCount = counts.archived ?? 0
	const canShowOpenCard = tab === 'open'

	const isEmpty = items.length === 0
	const shouldShowSkeleton = isEmpty && isFetching

	return (
		<div className="space-y-6">
			<div className="inline-flex items-center rounded-full border border-border bg-muted/30 p-1">
				<button
					type="button"
					onClick={() => handleTabChange('open')}
					className={cn(
						'rounded-full px-3 py-1.5 text-sm transition-colors',
						tab === 'open' ? 'bg-background font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
					)}
				>
					{dict.inbox.tabOpen} ({openCount})
				</button>
				<button
					type="button"
					onClick={() => handleTabChange('archived')}
					className={cn(
						'rounded-full px-3 py-1.5 text-sm transition-colors',
						tab === 'archived' ? 'bg-background font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
					)}
				>
					{dict.inbox.tabArchived} ({archivedCount})
				</button>
			</div>

			<div className="grid min-w-0 gap-6">
				{canShowOpenCard ? (
					<InboxCard
						dict={dict}
						openCount={openCount}
						showViewAll={false}
						recentItems={items.slice(0, 3).map((it) => ({ id: it.id, content: it.content, tags: it.tags || [] }))}
					/>
				) : null}

				<div className="min-w-0 space-y-3">
					<div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
						<div className="flex items-center justify-between gap-3">
							<div className="text-sm font-medium">{tab === 'open' ? dict.inbox.listTitle : dict.inbox.tabArchived}</div>
							{isFetching ? <LoadingSpinner size={14} className="text-muted-foreground" /> : null}
						</div>
						<div className="mt-0.5 text-xs text-muted-foreground">{dict.inbox.listHint}</div>
					</div>

					{error ? <div className="text-sm text-destructive">{error}</div> : null}

					{shouldShowSkeleton ? (
						<div className="space-y-3">
							{Array.from({ length: 6 }).map((_, idx) => (
								<div key={idx} className="h-[116px] rounded-2xl border border-border/60 bg-muted/30" />
							))}
						</div>
					) : isEmpty ? (
						<div className="text-sm text-muted-foreground">{tab === 'open' ? dict.inbox.empty : dict.inbox.archivedEmpty}</div>
					) : (
						items.map((item) => (
							<InboxItemRow
								key={item.id}
								item={{
									id: item.id,
									content: item.content,
									note: item.note || '',
									tags: item.tags || [],
									created_at: item.created_at
								}}
								activeGoals={activeGoals}
								dict={dict}
								startDefault={startDefault}
								endDefault={endDefault}
								mode={tab}
								onMutateSuccess={refresh}
							/>
						))
					)}
				</div>
			</div>
		</div>
	)
}
