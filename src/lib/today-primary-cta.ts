export function getTodayPrimaryCta(input: {
  locale: 'zh' | 'en'
  showStreakRiskBanner: boolean
  rescueActionId: string | null
  tomorrowHandoffTargetActionId: string | null
  nextIncompleteActionId: string | null
}): { href: string; label: string } {
  const label = (zh: string, en: string) => (input.locale === 'zh' ? zh : en)

  if (input.showStreakRiskBanner) {
    if (input.rescueActionId) {
      return {
        href: `/today?rescue=${input.rescueActionId}#today-actions`,
        label: label('打开 5 分钟救援', 'Open 5-min rescue'),
      }
    }

    return {
      href: '#today-actions',
      label: label('去做最小行动', 'Do a minimum action'),
    }
  }

  if (input.tomorrowHandoffTargetActionId) {
    return {
      href: `/today?action=${input.tomorrowHandoffTargetActionId}#today-actions`,
      label: label('开始推进', 'Start'),
    }
  }

  if (input.nextIncompleteActionId) {
    return {
      href: `/today?action=${input.nextIncompleteActionId}#today-actions`,
      label: label('开始推进', 'Start'),
    }
  }

  return {
    href: '#today-actions',
    label: label('查看行动', 'View actions'),
  }
}

