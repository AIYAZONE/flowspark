// 轻量埋点提交辅助：向 /api/ai/feedback 发送一次事件。
// 失败时静默吞掉，避免影响主流程。
export async function trackFeedbackEvent(
  name: string,
  meta?: Record<string, string>
): Promise<void> {
  try {
    await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, meta }),
      keepalive: true,
    })
  } catch {
    // 埋点丢失不应阻断用户操作
  }
}
