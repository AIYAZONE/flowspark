export function getTodayActionViewToggleState(view: 'focus' | 'all') {
  if (view === 'focus') {
    return {
      focusDisabled: true,
      focusVariant: 'default' as const,
      allDisabled: false,
      allVariant: 'outline' as const,
    }
  }

  return {
    focusDisabled: false,
    focusVariant: 'outline' as const,
    allDisabled: true,
    allVariant: 'default' as const,
  }
}

