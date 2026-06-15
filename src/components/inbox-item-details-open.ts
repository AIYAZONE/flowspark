export function shouldOpenInboxItemDetails({ shouldIgnoreTarget }: { shouldIgnoreTarget: boolean }) {
  if (shouldIgnoreTarget) return false
  return true
}

