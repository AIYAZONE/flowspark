export function logEvent(name: string, payload?: unknown) {
  try {
    if (typeof window !== 'undefined') {
      // 轻量埋点占位实现，后续可替换为真实上报
      console.log('[event]', name, payload ?? null)
    }
  } catch {
    // ignore
  }
}
