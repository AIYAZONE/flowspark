'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { SystemDraftResponse, SystemTurn } from '@/lib/system-conversation/types'
import {
  buildSummarizedMemoryEvent,
  clipSummarizedMemoryQueue,
  splitWorkingMemoryForSummarization,
  SYSTEM_SUMMARIZED_MEMORY_STORAGE_KEY,
  type SummarizedMemoryEvent,
} from '@/lib/system-memory/summarized'
import { clipHistory, SYSTEM_CONVERSATION_STORAGE_KEY } from '@/lib/system-conversation/storage'
import { buildTurnFromDraftResponse } from '@/lib/system-conversation/turn-builder'

type StoredConversation = {
  turns: SystemTurn[]
}

function safeParseStoredConversation(raw: string): StoredConversation | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const obj = parsed as Record<string, unknown>
    if (!Array.isArray(obj.turns)) return null
    const turns = obj.turns.filter(isSystemTurn)
    return { turns }
  } catch {
    return null
  }
}

function safeParseSummaries(raw: string): SummarizedMemoryEvent[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is SummarizedMemoryEvent => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false
      const obj = item as Record<string, unknown>
      return (
        typeof obj.id === 'string' &&
        typeof obj.createdAt === 'string' &&
        Array.isArray(obj.turnIds) &&
        typeof obj.summary === 'string'
      )
    })
  } catch {
    return []
  }
}

function isSystemTurn(input: unknown): input is SystemTurn {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false
  const obj = input as Record<string, unknown>

  if (typeof obj.id !== 'string') return false
  if (typeof obj.createdAt !== 'string') return false
  if (obj.sourcePage !== 'system' && obj.sourcePage !== 'today' && obj.sourcePage !== 'profile') return false
  if (typeof obj.userText !== 'string') return false
  if (typeof obj.state !== 'string') return false
  if (typeof obj.tag !== 'string') return false
  if (typeof obj.judgement !== 'string') return false
  if (typeof obj.reason !== 'string') return false
  if (typeof obj.nextStep !== 'string') return false
  if (obj.primaryAction !== null && typeof obj.primaryAction !== 'object') return false
  if (obj.traceId !== undefined && typeof obj.traceId !== 'string') return false

  return true
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function buildSubmittingTurn(params: {
  userText: string
  sourcePage: SystemTurn['sourcePage']
}): SystemTurn {
  return {
    id: makeId(),
    createdAt: new Date().toISOString(),
    sourcePage: params.sourcePage,
    userText: params.userText,
    state: 'submitting',
    tag: '系统判断',
    judgement: '正在处理…',
    reason: '',
    nextStep: '',
    primaryAction: null,
    traceId: undefined,
  }
}

type SystemConversationStore = {
  turnsWorking: SystemTurn[]
  turnsVisible: SystemTurn[]
  appendSubmittingTurn: (params: { userText: string; sourcePage: SystemTurn['sourcePage'] }) => void
  replaceLastTurnWithResponse: (draftResponse: SystemDraftResponse) => void
  clearConversation: () => void
}

const SystemConversationContext = createContext<SystemConversationStore | null>(null)

export function SystemConversationProvider(props: { children: React.ReactNode }) {
  const [turnsWorking, setTurnsWorking] = useState<SystemTurn[]>([])
  const hydratedRef = useRef(false)
  const summariesRef = useRef<SummarizedMemoryEvent[]>([])

  const persistSummaries = useCallback((nextSummaries: SummarizedMemoryEvent[]) => {
    summariesRef.current = clipSummarizedMemoryQueue(nextSummaries)
    if (typeof window === 'undefined') return
    if (!hydratedRef.current) return
    window.localStorage.setItem(
      SYSTEM_SUMMARIZED_MEMORY_STORAGE_KEY,
      JSON.stringify(summariesRef.current)
    )
  }, [])

  const applyWorkingMemoryLimit = useCallback((nextTurns: SystemTurn[]) => {
    const { workingMemory, overflow } = splitWorkingMemoryForSummarization(nextTurns)
    if (overflow.length > 0) {
      const event = buildSummarizedMemoryEvent(overflow)
      if (event) persistSummaries([...summariesRef.current, event])
    }
    return workingMemory
  }, [persistSummaries])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const t = window.setTimeout(() => {
      const raw = window.localStorage.getItem(SYSTEM_CONVERSATION_STORAGE_KEY)
      const summaryRaw = window.localStorage.getItem(SYSTEM_SUMMARIZED_MEMORY_STORAGE_KEY)
      summariesRef.current = summaryRaw ? safeParseSummaries(summaryRaw) : []
      if (!raw) {
        hydratedRef.current = true
        return
      }

      const stored = safeParseStoredConversation(raw)
      if (!stored) {
        hydratedRef.current = true
        return
      }

      setTurnsWorking(splitWorkingMemoryForSummarization(stored.turns).workingMemory)
      hydratedRef.current = true
    }, 0)

    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hydratedRef.current) return
    window.localStorage.setItem(
      SYSTEM_CONVERSATION_STORAGE_KEY,
      JSON.stringify({ turns: turnsWorking } satisfies StoredConversation)
    )
  }, [turnsWorking])

  const turnsVisible = useMemo(() => clipHistory(turnsWorking), [turnsWorking])

  const store = useMemo<SystemConversationStore>(() => {
    return {
      turnsWorking,
      turnsVisible,
      appendSubmittingTurn: ({ userText, sourcePage }) => {
        setTurnsWorking((prev) => applyWorkingMemoryLimit([...prev, buildSubmittingTurn({ userText, sourcePage })]))
      },
      replaceLastTurnWithResponse: (draftResponse) => {
        setTurnsWorking((prev) => {
          if (!prev.length) return prev
          const last = prev[prev.length - 1]
          const next = buildTurnFromDraftResponse({
            sourcePage: last.sourcePage,
            userText: last.userText,
            draftResponse,
          })
          const merged: SystemTurn = {
            ...next,
            id: last.id,
            createdAt: last.createdAt,
            traceId: last.traceId,
          }
          return applyWorkingMemoryLimit([...prev.slice(0, -1), merged])
        })
      },
      clearConversation: () => {
        setTurnsWorking([])
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(SYSTEM_CONVERSATION_STORAGE_KEY)
          window.localStorage.removeItem(SYSTEM_SUMMARIZED_MEMORY_STORAGE_KEY)
        }
        summariesRef.current = []
      },
    }
  }, [applyWorkingMemoryLimit, turnsVisible, turnsWorking])

  return <SystemConversationContext.Provider value={store}>{props.children}</SystemConversationContext.Provider>
}

export function useSystemConversation() {
  const ctx = useContext(SystemConversationContext)
  if (!ctx) throw new Error('SystemConversationProvider is missing')
  return ctx
}
