'use client'

import { useEffect } from 'react'
import { logEvent } from '@/lib/analytics'

export function ExperimentExposureTracker(props: {
  source: 'dashboard' | 'today'
  ab1TodayPlanVariant?: 'A' | 'B' | null
  ab2ReviewVariant?: 'A' | 'B' | null
  showAIPlan?: boolean
}) {
  useEffect(() => {
    logEvent(`${props.source}_viewed`, {
      show_ai_plan: props.showAIPlan ?? null,
      ab1_variant: props.ab1TodayPlanVariant ?? null,
      ab2_variant: props.ab2ReviewVariant ?? null
    })

    if (props.source === 'dashboard' && props.showAIPlan) {
      logEvent('ai_today_plan_exposed', { variant: props.ab1TodayPlanVariant ?? null })
    }
  }, [props.source, props.ab1TodayPlanVariant, props.ab2ReviewVariant, props.showAIPlan])

  return null
}

