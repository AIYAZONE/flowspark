'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  createActionFromChat,
  completeActionFromChat,
  createGoalFromChat,
  submitChatFeedback,
  cancelChatFeedback
} from '@/app/(authenticated)/chat/actions'
import type {
  ChatActionDraft,
  ChatCompleteDraft,
  ChatFeedbackReason,
  ChatHistoryEntry,
  ChatStreamEvent,
  ChatTurn
} from './types'
import { buildChatSummary } from './summary'

// 与 /api/chat/stream 的 MAX_HISTORY 保持一致：仅最近 20 轮进入工作记忆，
// 更旧的轮次由 buildChatSummary 压缩为摘要随请求回传。
const CHAT_HISTORY_WINDOW = 20

const STORAGE_KEY = 'flowspark_chat_turns'
const FALLBACK_ERROR_TEXT =
  '系统暂时无法生成判断。你可以换一种说法，或稍后再试——对话会一直留在这里。'

export type ChatSource = 'today' | 'profile' | 'system' | null

type ChatContextValue = {
  turns: ChatTurn[]
  isStreaming: boolean
  source: ChatSource
  send: (text: string) => void
  applyAction: (turnId: string) => void
  completeAction: (turnId: string) => void
  dismissCompletion: (turnId: string) => void
  completeReferencedAction: (turnId: string, actionId: string) => void
  submitFeedback: (turnId: string, rating: 'up' | 'down', reason?: ChatFeedbackReason | null, excerpt?: string | null, reasonText?: string | null) => void
  cancelFeedback: (turnId: string) => void
  clear: () => void
}

const ChatContext = React.createContext<ChatContextValue | null>(null)

function getClientLocale(): 'zh' | 'en' {
  if (typeof document === 'undefined') return 'zh'
  const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
  return match && match[1] === 'en' ? 'en' : 'zh'
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `t_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function ChatProvider({
  children,
  source = null
}: {
  children: React.ReactNode
  source?: ChatSource
}) {
  const router = useRouter()
  const [turns, setTurns] = React.useState<ChatTurn[]>([])
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [hydrated, setHydrated] = React.useState(false)
  const turnsRef = React.useRef<ChatTurn[]>([])

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ChatTurn[]
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setTurns(parsed)
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    turnsRef.current = turns
  }, [turns])

  React.useEffect(() => {
    if (!hydrated) return
    if (turns.some((t) => t.status === 'streaming')) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(turns))
    } catch {
      // ignore quota errors
    }
  }, [turns, hydrated])

  const updateTurn = React.useCallback((id: string, patch: Partial<ChatTurn>) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const extractAction = React.useCallback(async (assistantId: string, transcript: ChatHistoryEntry[]) => {
    try {
      const res = await fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, locale: getClientLocale() })
      })
      const data = (await res.json()) as { hasAction?: boolean; draft?: ChatActionDraft }
      if (data?.hasAction && data?.draft?.title) {
        updateTurn(assistantId, { action: data.draft, actionState: 'idle' })
      }
    } catch {
      // no action card on failure
    }
  }, [updateTurn])

  const extractCompletion = React.useCallback(async (assistantId: string, transcript: ChatHistoryEntry[]) => {
    try {
      const res = await fetch('/api/chat/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, locale: getClientLocale() })
      })
      const data = (await res.json()) as { hasComplete?: boolean; draft?: ChatCompleteDraft }
      if (data?.hasComplete && data?.draft?.actionId && data?.draft?.title) {
        updateTurn(assistantId, { completion: data.draft, completionState: 'idle' })
      }
    } catch {
      // no completion card on failure
    }
  }, [updateTurn])

  const send = React.useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      const historyForRequest: ChatHistoryEntry[] = turnsRef.current
        .filter((t) => t.status === 'done' && t.text)
        .map((t) => ({ role: t.role, text: t.text }))

      // P1：仅最近 CHAT_HISTORY_WINDOW 轮作为工作记忆发送，
      // 更早的轮次压缩为摘要，回传服务端以保留长期背景。
      const workingMemory = historyForRequest.slice(-CHAT_HISTORY_WINDOW)
      const overflow = historyForRequest.slice(0, historyForRequest.length - CHAT_HISTORY_WINDOW)
      const historySummary = buildChatSummary(overflow)

      const userTurn: ChatTurn = {
        id: newId(),
        role: 'user',
        text: trimmed,
        status: 'done',
        createdAt: new Date().toISOString()
      }
      const assistantId = newId()
      const assistantTurn: ChatTurn = {
        id: assistantId,
        role: 'assistant',
        text: '',
        status: 'streaming',
        createdAt: new Date().toISOString()
      }

      setTurns((prev) => [...prev, userTurn, assistantTurn])
      setIsStreaming(true)

      const run = async () => {
        let receivedText = ''
        try {
          const res = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: trimmed,
              history: workingMemory,
              summary: historySummary ?? undefined,
              locale: getClientLocale()
            })
          })
          if (!res.ok || !res.body) throw new Error('network')

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            let sep: number
            while ((sep = buffer.indexOf('\n\n')) >= 0) {
              const chunk = buffer.slice(0, sep)
              buffer = buffer.slice(sep + 2)
              const lines = chunk.split('\n').filter((l) => l.startsWith('data:'))
              const last = lines[lines.length - 1]
              if (!last) continue
              const payload = last.slice(5).trim()
              if (!payload) continue

              let evt: ChatStreamEvent
              try {
                evt = JSON.parse(payload) as ChatStreamEvent
              } catch {
                continue
              }

              if (evt.type === 'text') {
                receivedText += evt.value
                updateTurn(assistantId, { text: receivedText })
              } else if (evt.type === 'references') {
                updateTurn(assistantId, {
                  referencedActions: evt.actions.map((a) => ({ ...a, done: false }))
                })
              } else if (evt.type === 'assets') {
                // 资产已由后端直接入库，前端仅做只读展示
                updateTurn(assistantId, { assets: evt.assets })
              } else if (evt.type === 'persona') {
                // 个人记忆已由后端直接入库，前端仅做只读展示
                updateTurn(assistantId, { persona: evt.items })
              } else if (evt.type === 'error') {
                updateTurn(assistantId, { status: 'error', text: receivedText || FALLBACK_ERROR_TEXT })
              }
            }
          }

          updateTurn(assistantId, { status: 'done' })
          const fullTranscript: ChatHistoryEntry[] = [
            ...historyForRequest,
            { role: 'user', text: trimmed },
            { role: 'assistant', text: receivedText }
          ]
          await Promise.all([extractAction(assistantId, fullTranscript), extractCompletion(assistantId, fullTranscript)])
        } catch {
          updateTurn(assistantId, { status: 'error', text: receivedText || FALLBACK_ERROR_TEXT })
        } finally {
          setIsStreaming(false)
        }
      }

      void run()
    },
    [isStreaming, extractAction, extractCompletion, updateTurn]
  )

  const applyAction = React.useCallback(
    async (turnId: string) => {
      const turn = turnsRef.current.find((t) => t.id === turnId)
      if (!turn?.action) return
      updateTurn(turnId, { actionState: 'confirming' })

      // B 闭环：聊天里的「新路径」草案直接落成完整 5 层路径蓝图
      if (turn.action.kind === 'goal') {
        const history: ChatHistoryEntry[] = turnsRef.current
          .filter((t) => t.status === 'done' && t.text)
          .map((t) => ({ role: t.role, text: t.text }))
        const fd = new FormData()
        fd.set('title', turn.action.title)
        if (turn.action.reason) fd.set('reason', turn.action.reason)
        fd.set('locale', getClientLocale())
        fd.set('conversation', JSON.stringify(history))
        try {
          const result = await createGoalFromChat(fd)
          if (result.error) throw new Error(result.error)
          updateTurn(turnId, { actionState: 'done' })
          if (result.goalId) router.push(`/goals/${result.goalId}`)
        } catch {
          updateTurn(turnId, { actionState: 'error' })
        }
        return
      }

      const fd = new FormData()
      fd.set('title', turn.action.title)
      if (turn.action.goalHint) fd.set('goalHint', turn.action.goalHint)
      if (turn.action.reason) fd.set('reason', turn.action.reason)
      try {
    const result = await createActionFromChat(fd)
    if (result.error) throw new Error(result.error)
    if (result.duplicate) {
      updateTurn(turnId, { actionState: 'duplicate' })
      return
    }
    updateTurn(turnId, { actionState: 'done' })
      } catch {
        updateTurn(turnId, { actionState: 'error' })
      }
    },
    [updateTurn, router]
  )

  const completeAction = React.useCallback(
    async (turnId: string) => {
      const turn = turnsRef.current.find((t) => t.id === turnId)
      if (!turn?.completion) return
      updateTurn(turnId, { completionState: 'confirming' })
      const fd = new FormData()
      fd.set('actionId', turn.completion.actionId)
      try {
        const result = await completeActionFromChat(fd)
        if (result.error) throw new Error(result.error)
        updateTurn(turnId, { completionState: 'done' })
      } catch {
        updateTurn(turnId, { completionState: 'error' })
      }
    },
    [updateTurn]
  )

  const dismissCompletion = React.useCallback(
    (turnId: string) => {
      updateTurn(turnId, { completion: null, completionState: undefined })
    },
    [updateTurn]
  )

  const completeReferencedAction = React.useCallback(
    async (turnId: string, actionId: string) => {
      const fd = new FormData()
      fd.set('actionId', actionId)
      try {
        const result = await completeActionFromChat(fd)
        if (result.error) throw new Error(result.error)
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  referencedActions: (t.referencedActions ?? []).map((a) =>
                    a.id === actionId ? { ...a, done: true } : a
                  )
                }
              : t
          )
        )
      } catch {
        // 保留未勾选状态，允许重试
      }
    },
    []
  )

  const clear = React.useCallback(() => {
    setTurns([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const submitFeedback = React.useCallback(
    async (
      turnId: string,
      rating: 'up' | 'down',
      reason: ChatFeedbackReason | null = null,
      excerpt: string | null = null,
      reasonText: string | null = null
    ) => {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId ? { ...t, feedback: { rating, reason, reasonText } } : t
        )
      )
      const fd = new FormData()
      fd.set('turnId', turnId)
      fd.set('rating', rating)
      if (reason) fd.set('reason', reason)
      if (reasonText) fd.set('reasonText', reasonText)
      if (excerpt) fd.set('excerpt', excerpt)
      try {
        const result = await submitChatFeedback(fd)
        if (result.error) throw new Error(result.error)
      } catch {
      }
    },
    []
  )

  const cancelFeedback = React.useCallback(async (turnId: string) => {
    setTurns((prev) =>
      prev.map((t) => (t.id === turnId ? { ...t, feedback: null } : t))
    )
    const fd = new FormData()
    fd.set('turnId', turnId)
    try {
      const result = await cancelChatFeedback(fd)
      if (result.error) throw new Error(result.error)
    } catch {
    }
  }, [])

  const value = React.useMemo<ChatContextValue>(
    () => ({
      turns,
      isStreaming,
      source,
      send,
      applyAction,
      completeAction,
      dismissCompletion,
      completeReferencedAction,
      submitFeedback,
      cancelFeedback,
      clear
    }),
    [
      turns,
      isStreaming,
      source,
      send,
      applyAction,
      completeAction,
      dismissCompletion,
      completeReferencedAction,
      submitFeedback,
      cancelFeedback,
      clear
    ]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat(): ChatContextValue {
  const ctx = React.useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
