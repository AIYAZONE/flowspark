import type { SystemTurn } from '@/lib/system-conversation/types'

const WORKING_MEMORY_LIMIT = 20
const SUMMARY_QUEUE_LIMIT = 10

export const SYSTEM_SUMMARIZED_MEMORY_STORAGE_KEY = 'flowspark.systemConversation.summaries.v1'

export type SummarizedMemoryEvent = {
  id: string
  createdAt: string
  turnIds: string[]
  summary: string
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function splitWorkingMemoryForSummarization(turns: SystemTurn[]): {
  workingMemory: SystemTurn[]
  overflow: SystemTurn[]
} {
  if (turns.length <= WORKING_MEMORY_LIMIT) {
    return { workingMemory: turns, overflow: [] }
  }

  const overflowCount = turns.length - WORKING_MEMORY_LIMIT
  return {
    overflow: turns.slice(0, overflowCount),
    workingMemory: turns.slice(-WORKING_MEMORY_LIMIT),
  }
}

export function buildSummarizedMemoryEvent(turns: SystemTurn[]): SummarizedMemoryEvent | null {
  if (!turns.length) return null

  return {
    id: makeId(),
    createdAt: new Date().toISOString(),
    turnIds: turns.map((turn) => turn.id),
    summary: turns
      .map((turn) => `${turn.userText} -> ${turn.judgement}`)
      .join(' | '),
  }
}

export function clipSummarizedMemoryQueue(events: SummarizedMemoryEvent[]) {
  return events.slice(-SUMMARY_QUEUE_LIMIT)
}
