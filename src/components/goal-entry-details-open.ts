export function shouldOpenGoalEntryDetails({
  isTabletAndUp,
  shouldIgnoreTarget,
}: {
  isTabletAndUp: boolean
  shouldIgnoreTarget: boolean
}) {
  if (shouldIgnoreTarget) return false
  return true
}
