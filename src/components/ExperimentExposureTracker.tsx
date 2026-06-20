'use client'

import { useEffect } from 'react'
import { logEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'

export function ExperimentExposureTracker(props: {
  source: 'dashboard' | 'today'
  ab1TodayPlanVariant?: 'A' | 'B' | null
  ab2ReviewVariant?: 'A' | 'B' | null
  showAIPlan?: boolean
  showAIReview?: boolean
  showStreakRiskBanner?: boolean
  dateBucket?: string
}) {
  useEffect(() => {
    const pageViewPayload = {
      show_ai_plan: props.showAIPlan ?? null,
      show_ai_review: props.showAIReview ?? null,
      show_streak_risk_banner: props.showStreakRiskBanner ?? null,
      ab1_variant: props.ab1TodayPlanVariant ?? null,
      ab2_variant: props.ab2ReviewVariant ?? null,
      date_bucket: props.dateBucket ?? null,
    }
    logEvent(`${props.source}_viewed`, pageViewPayload)
    sendAIFeedback(`${props.source}_viewed`, pageViewPayload)

    if (props.source === 'dashboard' && props.showAIPlan) {
      const planExposurePayload = {
        source: props.source,
        variant: props.ab1TodayPlanVariant ?? null,
        date_bucket: props.dateBucket ?? null,
      }
      logEvent('ai_today_plan_exposed', planExposurePayload)
      sendAIFeedback('ai_today_plan_exposed', planExposurePayload)
    }

    if (props.source === 'dashboard' && props.showAIReview) {
      const reviewExposurePayload = {
        source: props.source,
        variant: props.ab2ReviewVariant ?? null,
        date_bucket: props.dateBucket ?? null,
      }
      logEvent('ai_review_exposed', reviewExposurePayload)
      sendAIFeedback('ai_review_exposed', reviewExposurePayload)
    }

    if (props.showStreakRiskBanner) {
      const streakExposurePayload = {
        source: props.source,
        date_bucket: props.dateBucket ?? null,
      }
      logEvent('streak_risk_banner_exposed', streakExposurePayload)
      sendAIFeedback('streak_risk_banner_exposed', streakExposurePayload)
    }
  }, [
    props.source,
    props.ab1TodayPlanVariant,
    props.ab2ReviewVariant,
    props.showAIPlan,
    props.showAIReview,
    props.showStreakRiskBanner,
    props.dateBucket,
  ])

  return null
}
