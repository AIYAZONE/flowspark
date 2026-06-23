import type { SupabaseClient } from '@supabase/supabase-js'
import { subDays } from 'date-fns'
import { queryWithOwnershipFallback } from './ownership.ts'

export type ShieldGrantRule = 'first_3_day' | 'refill_7_day'

export type ShieldGrantDecision = {
  shouldGrant: boolean
  nextBalance: number
  grantedRule: ShieldGrantRule | null
  grantedAtStreak: number | null
  nextGrantAtStreak: number
}

export type ComputeStreakSnapshotInput = {
  today: string
  completedDates: string[]
  repairDates: string[]
  shieldBalance?: number
}

export type StreakSnapshot = {
  currentStreak: number
  longestStreak: number
  recoverableMissDate: string | null
  completedToday: boolean
  shieldBalance: number
  usedRepairYesterday: boolean
}

export type ServerStreakSnapshot = StreakSnapshot & {
  completedDates: string[]
  repairDates: string[]
  lastShieldGrantedForStreak: number | null
  nextShieldGrantRule: {
    nextGrantAtStreak: number
    grantedRule: ShieldGrantRule | null
  }
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

function shiftDate(date: string, amount: number) {
  return toDateKey(subDays(new Date(`${date}T00:00:00.000Z`), amount))
}

function dateFromISO(isoLike: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoLike))
}

function buildDateSet(input: { completedDates: string[]; repairDates: string[] }) {
  return new Set(
    [...input.completedDates, ...input.repairDates]
      .map((value) => value.trim())
      .filter(Boolean)
  )
}

function countTrailingStreak(activeDates: Set<string>, anchorDate: string) {
  let streak = 0
  for (let cursor = anchorDate; activeDates.has(cursor); cursor = shiftDate(cursor, 1)) {
    streak += 1
  }
  return streak
}

function countLongestStreak(activeDates: Set<string>) {
  const sorted = [...activeDates].sort()
  if (sorted.length === 0) return 0

  let longest = 1
  let current = 1

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]
    const currentDate = sorted[index]
    if (currentDate === shiftDate(previous, -1)) {
      current += 1
      longest = Math.max(longest, current)
      continue
    }
    current = 1
  }

  return longest
}

export function getShieldGrantDecision(input: {
  currentStreak: number
  shieldBalance: number
  lastShieldGrantedForStreak: number | null
}): ShieldGrantDecision {
  const { currentStreak, shieldBalance, lastShieldGrantedForStreak } = input
  const lastGranted = lastShieldGrantedForStreak ?? 0

  const nextGrantAtStreak =
    lastGranted < 3
      ? 3
      : lastGranted < 7
        ? 7
        : lastGranted + 7

  if (shieldBalance >= 3 || currentStreak !== nextGrantAtStreak) {
    return {
      shouldGrant: false,
      nextBalance: shieldBalance,
      grantedRule: null,
      grantedAtStreak: null,
      nextGrantAtStreak,
    }
  }

  return {
    shouldGrant: true,
    nextBalance: Math.min(shieldBalance + 1, 3),
    grantedRule: nextGrantAtStreak === 3 ? 'first_3_day' : 'refill_7_day',
    grantedAtStreak: nextGrantAtStreak,
    nextGrantAtStreak: nextGrantAtStreak === 3 ? 7 : nextGrantAtStreak + 7,
  }
}

export function computeStreakSnapshot(input: ComputeStreakSnapshotInput): StreakSnapshot {
  const shieldBalance = Math.max(0, input.shieldBalance ?? 0)
  const activeDates = buildDateSet(input)
  const today = input.today
  const yesterday = shiftDate(today, 1)
  const dayBeforeYesterday = shiftDate(today, 2)
  const completedToday = activeDates.has(today)
  const usedRepairYesterday = input.repairDates.includes(yesterday)

  const currentStreak = completedToday
    ? countTrailingStreak(activeDates, today)
    : activeDates.has(yesterday)
      ? countTrailingStreak(activeDates, yesterday)
      : 0

  const longestStreak = countLongestStreak(activeDates)
  const recoverableMissDate =
    !activeDates.has(yesterday) && !usedRepairYesterday && activeDates.has(dayBeforeYesterday)
      ? yesterday
      : null

  return {
    currentStreak,
    longestStreak,
    recoverableMissDate,
    completedToday,
    shieldBalance,
    usedRepairYesterday,
  }
}

type StreakBenefitsRow = {
  available_shields?: number | null
  last_shield_granted_for_streak?: number | null
}

async function selectCompletedActions(params: {
  supabase: SupabaseClient
  userId: string
  sinceIso: string
}) {
  const { supabase, userId, sinceIso } = params
  const { data } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) => supabase
      .from('actions')
      .select('updated_at')
      .eq(ownershipColumn, userId)
      .eq('completed', true)
      .gte('updated_at', sinceIso),
  })

  return data ?? []
}

export async function listCompletedActionDates(params: {
  supabase: SupabaseClient
  userId: string
  timeZone: string
  sinceDays?: number
  today?: string
}): Promise<string[]> {
  const horizon = Math.max(30, params.sinceDays ?? 400)
  const today = params.today ?? toDateKey(new Date())
  const sinceIso = new Date(`${shiftDate(today, horizon - 1)}T00:00:00.000Z`).toISOString()
  const rows = await selectCompletedActions({
    supabase: params.supabase,
    userId: params.userId,
    sinceIso,
  })

  return [...new Set(
    (rows ?? [])
      .map((row) => {
        const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : null
        return updatedAt ? dateFromISO(updatedAt, params.timeZone) : null
      })
      .filter((value): value is string => Boolean(value))
  )]
}

export async function listRepairDates(params: {
  supabase: SupabaseClient
  userId: string
  sinceDays?: number
  today?: string
}): Promise<string[]> {
  const horizon = Math.max(30, params.sinceDays ?? 400)
  const today = params.today ?? toDateKey(new Date())
  const sinceDate = shiftDate(today, horizon - 1)
  const { data } = await params.supabase
    .from('streak_repairs')
    .select('target_date')
    .eq('user_id', params.userId)
    .gte('target_date', sinceDate)

  return [...new Set(
    (data ?? [])
      .map((row) => {
        const targetDate = row.target_date
        return typeof targetDate === 'string' ? targetDate : null
      })
      .filter((value): value is string => Boolean(value))
  )]
}

export async function getStreakBenefits(params: {
  supabase: SupabaseClient
  userId: string
}) {
  const { data } = await params.supabase
    .from('user_streak_benefits')
    .select('available_shields,last_shield_granted_for_streak')
    .eq('user_id', params.userId)
    .maybeSingle()

  const row = (data ?? {}) as StreakBenefitsRow

  return {
    shieldBalance: Math.max(0, Number(row.available_shields ?? 0)),
    lastShieldGrantedForStreak:
      typeof row.last_shield_granted_for_streak === 'number'
        ? row.last_shield_granted_for_streak
        : null,
  }
}

export async function getStreakSnapshot(params: {
  supabase: SupabaseClient
  userId: string
  timeZone: string
  today?: string
  sinceDays?: number
}): Promise<ServerStreakSnapshot> {
  const today = params.today ?? dateFromISO(new Date().toISOString(), params.timeZone)
  const [completedDates, repairDates, benefits] = await Promise.all([
    listCompletedActionDates({
      supabase: params.supabase,
      userId: params.userId,
      timeZone: params.timeZone,
      today,
      sinceDays: params.sinceDays,
    }),
    listRepairDates({
      supabase: params.supabase,
      userId: params.userId,
      today,
      sinceDays: params.sinceDays,
    }),
    getStreakBenefits({
      supabase: params.supabase,
      userId: params.userId,
    }),
  ])

  const snapshot = computeStreakSnapshot({
    today,
    completedDates,
    repairDates,
    shieldBalance: benefits.shieldBalance,
  })

  const decision = getShieldGrantDecision({
    currentStreak: snapshot.currentStreak,
    shieldBalance: snapshot.shieldBalance,
    lastShieldGrantedForStreak: benefits.lastShieldGrantedForStreak,
  })

  return {
    ...snapshot,
    completedDates,
    repairDates,
    lastShieldGrantedForStreak: benefits.lastShieldGrantedForStreak,
    nextShieldGrantRule: {
      nextGrantAtStreak: decision.nextGrantAtStreak,
      grantedRule: decision.grantedRule,
    },
  }
}

export async function grantShieldIfEligible(params: {
  supabase: SupabaseClient
  userId: string
  currentStreak: number
  shieldBalance: number
  lastShieldGrantedForStreak: number | null
}) {
  const decision = getShieldGrantDecision({
    currentStreak: params.currentStreak,
    shieldBalance: params.shieldBalance,
    lastShieldGrantedForStreak: params.lastShieldGrantedForStreak,
  })

  if (!decision.shouldGrant || !decision.grantedRule || !decision.grantedAtStreak) {
    return decision
  }

  const { error } = await params.supabase
    .from('user_streak_benefits')
    .upsert(
      {
        user_id: params.userId,
        available_shields: decision.nextBalance,
        last_shield_granted_for_streak: decision.grantedAtStreak,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) throw error

  return decision
}

export async function consumeShieldForYesterday(params: {
  supabase: SupabaseClient
  userId: string
  timeZone: string
  today?: string
}) {
  const snapshot = await getStreakSnapshot(params)

  if (!snapshot.recoverableMissDate) {
    throw new Error('streak_recovery_not_available')
  }

  if (snapshot.shieldBalance <= 0) {
    throw new Error('streak_shield_unavailable')
  }

  const { error: insertError } = await params.supabase
    .from('streak_repairs')
    .insert({
      user_id: params.userId,
      target_date: snapshot.recoverableMissDate,
      method: 'shield',
    })

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('streak_recovery_already_used')
    }
    throw insertError
  }

  const { error: updateError } = await params.supabase
    .from('user_streak_benefits')
    .upsert(
      {
        user_id: params.userId,
        available_shields: Math.max(0, snapshot.shieldBalance - 1),
        last_shield_granted_for_streak: snapshot.lastShieldGrantedForStreak,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (updateError) throw updateError

  return {
    targetDate: snapshot.recoverableMissDate,
    shieldBalanceAfter: Math.max(0, snapshot.shieldBalance - 1),
  }
}
