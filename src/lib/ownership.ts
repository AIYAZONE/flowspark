import type { PostgrestError } from '@supabase/supabase-js'

export type OwnershipColumn = 'user_id' | 'owner_id'

type OwnershipQueryResult<T> = {
  data: T
  error: PostgrestError | null
}

function shouldFallbackForEmptyData(data: unknown) {
  if (data == null) return true
  if (Array.isArray(data)) return data.length === 0
  return false
}

export function isOwnershipColumnMissingError(
  error?: Pick<PostgrestError, 'code' | 'message'> | { code?: string; message?: string } | null
) {
  return Boolean(error && (error.code === '42703' || error.message?.includes('column')))
}

export async function queryWithOwnershipFallback<T>(params: {
  execute: (column: OwnershipColumn) => PromiseLike<OwnershipQueryResult<T>>
  primary?: OwnershipColumn
  fallback?: OwnershipColumn
  fallbackOnEmpty?: boolean
  fallbackOnColumnMissing?: boolean
}) {
  const primary = params.primary ?? 'user_id'
  const fallback = params.fallback ?? (primary === 'user_id' ? 'owner_id' : 'user_id')
  const primaryResult = await params.execute(primary)

  if (primary === fallback) {
    return {
      ...primaryResult,
      ownershipColumn: primary,
    }
  }

  const fallbackOnColumnMissing = params.fallbackOnColumnMissing ?? true
  const fallbackOnEmpty = params.fallbackOnEmpty ?? true
  const shouldFallback =
    (fallbackOnColumnMissing && isOwnershipColumnMissingError(primaryResult.error)) ||
    (!primaryResult.error && fallbackOnEmpty && shouldFallbackForEmptyData(primaryResult.data))

  if (!shouldFallback) {
    return {
      ...primaryResult,
      ownershipColumn: primary,
    }
  }

  const fallbackResult = await params.execute(fallback)
  return {
    ...fallbackResult,
    ownershipColumn: fallback,
  }
}
