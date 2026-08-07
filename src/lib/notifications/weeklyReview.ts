import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { insertUserNotification } from '@/lib/notifications/commands'

export const WEEKLY_REVIEW_INTERVAL_DAYS = 7

/**
 * Monday-based ISO week key (YYYY-Www) for a given date in a timezone.
 * Used as the dedupe key so at most one reminder is raised per calendar week.
 */
export function getIsoWeekKey(date: Date, tz: string): string {
  // Compute the Monday-based ISO week for `date` in the given timezone.
  const local = new Date(date.toLocaleString('en-US', { timeZone: tz }))
  const day = local.getUTCDay() || 7 // Sunday(0) -> 7
  local.setUTCDate(local.getUTCDate() + 4 - day) // shift to Thursday of the week
  const yearStart = new Date(Date.UTC(local.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((local.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${local.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export type WeeklyReviewReminder = {
  daysSinceReview: number
  weekKey: string
}

/**
 * Lightweight weekly-review nudge. Runs on dashboard/today page load.
 *
 * Logic:
 * - If the user has no active goals, a review has nothing to anchor on → skip.
 * - Find the most recent `ai_recommendations` row with scene='review'.
 * - If none, or the last review is >= 7 days old, raise a `weekly_review_reminder`
 *   notification (deduped once per ISO week via the dedupe key).
 *
 * Returns the reminder payload when one was newly created, otherwise null.
 */
export async function ensureWeeklyReviewReminder(params: {
  supabase: SupabaseClient
  userId: string
  tz: string
  today: string
  hasActiveGoals: boolean
}): Promise<WeeklyReviewReminder | null> {
  if (!params.hasActiveGoals) return null

  const todayDate = new Date(`${params.today}T00:00:00`)
  if (!Number.isFinite(todayDate.getTime())) return null

  const { data: lastReview, error } = await params.supabase
    .from('ai_recommendations')
    .select('created_at')
    .eq('user_id', params.userId)
    .eq('scene', 'review')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null

  const lastReviewDate = lastReview?.created_at ? new Date(lastReview.created_at) : null
  const daysSinceReview = lastReviewDate
    ? Math.floor((todayDate.getTime() - lastReviewDate.getTime()) / 86400000)
    : Number.POSITIVE_INFINITY

  if (Number.isFinite(daysSinceReview) && daysSinceReview < WEEKLY_REVIEW_INTERVAL_DAYS) {
    return null
  }

  const weekKey = getIsoWeekKey(todayDate, params.tz)
  const payload = { daysSinceReview: Number.isFinite(daysSinceReview) ? daysSinceReview : 999, weekKey }

  const result = await insertUserNotification({
    supabase: params.supabase,
    userId: params.userId,
    kind: 'weekly_review_reminder',
    payload,
  })

  return result.inserted ? payload : null
}
