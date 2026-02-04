export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function safeParseJSON(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) {
      const sliced = text.slice(start, end + 1)
      return JSON.parse(sliced)
    }
    throw new Error('invalid_json')
  }
}

