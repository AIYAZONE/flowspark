import { assignVariant, isEnvEnabled, type Variant } from '@/lib/experiments'

type ExperimentDecision = {
  enabled: boolean
  variant: Variant | null
  source: 'db' | 'env' | 'default'
}

function normalizeVariant(value: unknown): Variant | null {
  if (value === 'A' || value === 'B') return value
  return null
}

export async function getExperimentDecision(params: {
  // Server-only helper; the Supabase client type is inferred at call sites.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
  userId: string
  experimentKey: string
  envEnabled?: string | undefined
  defaultEnabled?: boolean
  splitPercentB?: number
}): Promise<ExperimentDecision> {
  const {
    supabase,
    userId,
    experimentKey,
    envEnabled,
    defaultEnabled = false,
    splitPercentB = 50,
  } = params

  let dbEnabled: boolean | null = null
  let dbSplitPercentB: number | null = null
  let assignedVariant: Variant | null = null

  const flagResult = await supabase
    .from('feature_flags')
    .select('enabled, rollout_percent')
    .eq('key', experimentKey)
    .maybeSingle()

  if (!flagResult.error && flagResult.data) {
    dbEnabled = typeof flagResult.data.enabled === 'boolean' ? flagResult.data.enabled : null
    dbSplitPercentB = typeof flagResult.data.rollout_percent === 'number'
      ? Math.max(0, Math.min(100, Math.trunc(flagResult.data.rollout_percent)))
      : null
  }

  const assignmentResult = await supabase
    .from('experiment_assignments')
    .select('variant')
    .eq('experiment_key', experimentKey)
    .eq('user_id', userId)
    .maybeSingle()

  if (!assignmentResult.error && assignmentResult.data) {
    assignedVariant = normalizeVariant(assignmentResult.data.variant)
  }

  const enabled = dbEnabled ?? (envEnabled != null ? isEnvEnabled(envEnabled) : defaultEnabled)
  const source: ExperimentDecision['source'] = dbEnabled != null
    ? 'db'
    : envEnabled != null
      ? 'env'
      : 'default'

  if (!enabled) {
    return { enabled: false, variant: null, source }
  }

  return {
    enabled: true,
    variant: assignedVariant ?? assignVariant(userId, experimentKey, dbSplitPercentB ?? splitPercentB),
    source,
  }
}
