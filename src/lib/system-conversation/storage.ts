export const SYSTEM_CONVERSATION_STORAGE_KEY = 'flowspark.systemConversation.v1'

const HISTORY_LIMIT = 3
const WORKING_MEMORY_LIMIT = 20

export function clipHistory<T>(history: T[]) {
  if (history.length <= HISTORY_LIMIT) return history
  return history.slice(-HISTORY_LIMIT)
}

export function clipWorkingMemory<T>(workingMemory: T[]) {
  if (workingMemory.length <= WORKING_MEMORY_LIMIT) return workingMemory
  return workingMemory.slice(-WORKING_MEMORY_LIMIT)
}
