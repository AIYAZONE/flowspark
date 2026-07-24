import type { CommandDraft, CommandIntentKind, CommandLocale, DraftGoalCandidate } from '../command-bar/types.ts'
import { parseUserCommand } from '../command-bar/parse.ts'
import { aiChatUnderstand } from './parse.ts'
import type { ChatAgentSurface, ChatAgentUnderstanding } from './schemas.ts'

export type ChatAgentGoalRow = {
  id: string
  title: string
  priority: string | null
  start_date: string | null
  end_date: string | null
}

export type ChatAgentActionRow = {
  id: string
  title: string
  goalId: string | null
  goalTitle: string | null
  priority: string | null
  type: string | null
  start_date?: string | null
  end_date?: string | null
}

export type ChatAgentRecentTurn = {
  userText: string
  assistantText: string
  state: string
  sourcePage: ChatAgentSurface
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

function normalizeCompact(text: string) {
  return text.replace(/\s+/g, '').replace(/[。．.，,！？!?；;："“”‘’]/gu, '').trim()
}

function cleanUserFacingCopy(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return trimmed

  const patterns = [
    /^你(?:又|再次|刚刚)?问[^，。！？!?]*[，,]\s*/u,
    /^你(?:又|再次|刚刚)?问[^，。！？!?]*，所以/u,
    /^你(?:之前|前面|刚才)?问过[^，。！？!?]*(?:[，,]|。)\s*/u,
    /^用户[^，。！？!?]*[，,]\s*/u,
    /^最近(?:一次|这几次)[^，。！？!?]*[，,]\s*/u,
    /^我(?:已经)?给出了[^，。！？!?]*(?:[，,]|。)\s*/u,
    /^现在再看[^，。！？!?]*(?:[，,]|。)\s*/u,
    /^系统[^，。！？!?]*[，,]\s*/u,
  ]

  let next = trimmed
  let changed = true
  while (changed) {
    changed = false
    for (const pattern of patterns) {
      const replaced = next.replace(pattern, '')
      if (replaced !== next) {
        next = replaced
        changed = true
      }
    }
  }
  next = next.replace(/^所以/u, '').trim()

  return next || trimmed
}

function isListRequest(text: string) {
  return /列出来|列出|清单|任务列表|有哪些任务|重新看|我需要做什么/u.test(text)
}

function parseIndexSelection(text: string) {
  const cleaned = normalizeCompact(text)
  if (!cleaned) return null

  const matched = cleaned.match(/^(?:第)?([1-3一二三])(?:个)?(?:吧)?$/u)
  if (!matched) return null

  const token = matched[1]
  if (token === '1' || token === '一') return 0
  if (token === '2' || token === '二') return 1
  if (token === '3' || token === '三') return 2
  return null
}

function findActionByTitleHint(actions: ChatAgentActionRow[], hint: string) {
  const normalizedHint = normalize(hint)
  if (!normalizedHint) return null
  return (
    actions.find((action) => normalize(action.title) === normalizedHint) ||
    actions.find((action) => normalize(action.title).includes(normalizedHint)) ||
    actions.find((action) => normalizedHint.includes(normalize(action.title))) ||
    null
  )
}

function formatActionLine(locale: CommandLocale, action: ChatAgentActionRow, index: number) {
  const prefix = `${index + 1})`
  const goalSuffix = action.goalTitle ? ` · ${action.goalTitle}` : ''
  const priorityText =
    locale === 'zh'
      ? action.priority === 'high'
        ? '高'
        : action.priority === 'low'
          ? '低'
          : '中'
      : action.priority || 'medium'
  const date = (action.end_date || action.start_date) ? ` ${String(action.end_date || action.start_date).slice(5, 10)}` : ''
  return `${prefix} ${action.title}${goalSuffix}（${priorityText}${date}）`
}

function matchGoalByHint(params: {
  hint: string | null
  goals: ChatAgentGoalRow[]
  candidates: DraftGoalCandidate[]
}) {
  if (!params.hint) return null
  const hint = normalize(params.hint)
  if (!hint) return null

  const byTitle = params.goals.find((goal) => {
    const title = normalize(goal.title)
    return title.includes(hint) || hint.includes(title)
  })
  if (byTitle) return byTitle

  const candidateHit = params.candidates.find((goal) => {
    const title = normalize(goal.title)
    return title.includes(hint) || hint.includes(title)
  })
  if (!candidateHit) return null

  return params.goals.find((goal) => goal.id === candidateHit.id) || null
}

function pickActionForGoal(goalId: string | null, actions: ChatAgentActionRow[]) {
  if (!goalId) return actions[0] || null
  return actions.find((action) => action.goalId === goalId) || null
}

function shouldFallbackToRules(params: {
  text: string
  understanding: ChatAgentUnderstanding
}) {
  if (params.understanding.confidence !== 'low') return false
  const parsed = parseUserCommand(params.text)
  return parsed.kind !== 'unknown'
}

function buildChanges(params: {
  locale: CommandLocale
  understanding: ChatAgentUnderstanding
  selectedGoalTitle?: string | null
  selectedActionTitle?: string | null
}) {
  const changes: CommandDraft['changes'] = [
    {
      label: params.locale === 'zh' ? '系统理解' : 'System read',
      value: params.understanding.user_goal_summary,
      status: 'draft',
    },
    {
      label: params.locale === 'zh' ? '判断原因' : 'Reasoning',
      value: params.understanding.reasoning_summary,
      status: 'draft',
    },
  ]

  if (params.selectedGoalTitle) {
    changes.push({
      label: params.locale === 'zh' ? '命中路径' : 'Matched path',
      value: params.selectedGoalTitle,
      status: 'draft',
    })
  }

  if (params.selectedActionTitle) {
    changes.push({
      label: params.locale === 'zh' ? '执行动作' : 'Target action',
      value: params.selectedActionTitle,
      status: 'draft',
    })
  }

  return changes
}

function buildCapabilityCopy(locale: CommandLocale) {
  if (locale === 'zh') {
    return {
      judgement: '我可以帮你判断现在先做什么、识别当前主线、把推进意图整理成行动草案，也能把你带到今天的执行层。',
      nextStep: '你可以直接说“我现在该做什么”“今天主线是什么”，或“帮我创建一个行动”。',
      label: '直接问我',
      capability: '任务判断、主线识别、行动草案、执行跳转',
    }
  }

  return {
    judgement: 'I can help decide what to do now, identify the main path, turn an intent into an action draft, and send you into execution.',
    nextStep: 'Ask what to do now, what the main path is, or ask me to create an action.',
    label: 'Ask directly',
    capability: 'task guidance, main-path review, action drafting, execution handoff',
  }
}

function buildActionFocusDraft(params: {
  locale: CommandLocale
  rawText: string
  kind: CommandIntentKind
  understanding: ChatAgentUnderstanding
  action: ChatAgentActionRow | null
  goalCandidates: DraftGoalCandidate[]
  selectedGoalTitle?: string | null
}): CommandDraft {
  if (!params.action) {
    return {
      rawText: params.rawText,
      firstIntentText: params.rawText,
      followupText: null,
      kind: params.kind,
      status: 'not_ready',
      needsGoalConfirmation: false,
      goalCandidates: params.goalCandidates,
      suggestedActionTitle: params.understanding.suggested_action_title,
      suggestedGoalId: params.goalCandidates[0]?.id ?? null,
      naturalReply: cleanUserFacingCopy(params.understanding.judgement),
      nextStepLabel: cleanUserFacingCopy(params.understanding.next_step),
      primaryAction: {
        type: 'navigate',
        label: params.locale === 'zh' ? '去人生路径' : 'Go to paths',
        href: '/goals',
      },
      changes: buildChanges({
        locale: params.locale,
        understanding: params.understanding,
        selectedGoalTitle: params.selectedGoalTitle,
      }),
    }
  }

  return {
    rawText: params.rawText,
    firstIntentText: params.rawText,
    followupText: null,
    kind: params.kind,
    status: 'execute_now',
    needsGoalConfirmation: false,
    goalCandidates: [],
    suggestedActionTitle: null,
    suggestedGoalId: params.action.goalId,
    naturalReply: cleanUserFacingCopy(params.understanding.judgement),
    nextStepLabel: cleanUserFacingCopy(params.understanding.next_step),
    primaryAction: {
      type: 'navigate',
      label: params.locale === 'zh' ? '去执行' : 'Open execution',
      href: `/today?action=${params.action.id}#today-actions`,
    },
    changes: buildChanges({
      locale: params.locale,
      understanding: params.understanding,
      selectedGoalTitle: params.selectedGoalTitle ?? params.action.goalTitle,
      selectedActionTitle: params.action.goalTitle ? `${params.action.title} · ${params.action.goalTitle}` : params.action.title,
    }),
  }
}

export function draftFromUnderstanding(params: {
  locale: CommandLocale
  text: string
  understanding: ChatAgentUnderstanding
  goals: ChatAgentGoalRow[]
  openActions: ChatAgentActionRow[]
  goalCandidates: DraftGoalCandidate[]
  mainPath: { id: string; title: string } | null
}): CommandDraft | null {
  const understanding = params.understanding

  const selectedGoal =
    matchGoalByHint({
      hint: understanding.target_path_hint,
      goals: params.goals,
      candidates: params.goalCandidates,
    }) ||
    (understanding.intent_type === 'review_main_path' && params.mainPath
      ? params.goals.find((goal) => goal.id === params.mainPath?.id) || null
      : null)

  if (understanding.intent_type === 'capability_answer') {
    const capabilityCopy = buildCapabilityCopy(params.locale)
    return {
      rawText: params.text,
      firstIntentText: params.text,
      followupText: null,
      kind: 'ask_capabilities',
      status: 'execute_now',
      needsGoalConfirmation: false,
      goalCandidates: [],
      suggestedActionTitle: null,
      suggestedGoalId: null,
      naturalReply: capabilityCopy.judgement,
      nextStepLabel: capabilityCopy.nextStep,
      primaryAction: {
        type: 'confirm',
        label: capabilityCopy.label,
        href: null,
      },
      changes: [
        {
          label: params.locale === 'zh' ? '系统能力' : 'Capabilities',
          value: capabilityCopy.capability,
          status: 'draft',
        },
      ],
    }
  }

  if (understanding.intent_type === 'review_current_tasks') {
    const indexSelection = parseIndexSelection(params.text)
    const hintedAction = understanding.suggested_action_title
      ? findActionByTitleHint(params.openActions, understanding.suggested_action_title)
      : null
    const selectedAction =
      hintedAction ||
      (indexSelection != null ? params.openActions[indexSelection] || null : null)

    if (selectedAction) {
      return buildActionFocusDraft({
        locale: params.locale,
        rawText: params.text,
        kind: 'review_current_tasks',
        understanding,
        action: selectedAction,
        goalCandidates: params.goalCandidates,
        selectedGoalTitle: selectedAction.goalTitle ?? selectedGoal?.title ?? null,
      })
    }

    if (isListRequest(params.text) || understanding.reply_mode === 'answer') {
      const top = params.openActions.slice(0, 5)
      const list = top.length
        ? ['现在可开始的任务：', ...top.map((action, idx) => formatActionLine(params.locale, action, idx))].join('\n')
        : (params.locale === 'zh' ? '现在没有可立即开始的任务。' : 'No executable task right now.')

      return {
        rawText: params.text,
        firstIntentText: params.text,
        followupText: null,
        kind: 'review_current_tasks',
        status: 'execute_now',
        needsGoalConfirmation: false,
        goalCandidates: [],
        suggestedActionTitle: null,
        suggestedGoalId: selectedGoal?.id ?? null,
        naturalReply: list,
        nextStepLabel: params.locale === 'zh'
          ? '回复 1/2/3 或 “第一个” 来打开对应任务。'
          : 'Reply 1/2/3 to open a task.',
        primaryAction: {
          type: 'navigate',
          label: params.locale === 'zh' ? '去今日' : 'Open today',
          href: '/today#today-actions',
        },
        changes: [
          {
            label: params.locale === 'zh' ? '当前可执行' : 'Executable',
            value: params.locale === 'zh' ? `${top.length} 项` : `${top.length}`,
            status: 'draft',
          },
        ],
      }
    }

    return buildActionFocusDraft({
      locale: params.locale,
      rawText: params.text,
      kind: 'review_current_tasks',
      understanding,
      action: pickActionForGoal(selectedGoal?.id ?? null, params.openActions),
      goalCandidates: params.goalCandidates,
      selectedGoalTitle: selectedGoal?.title ?? null,
    })
  }

  if (understanding.intent_type === 'review_main_path') {
    return buildActionFocusDraft({
      locale: params.locale,
      rawText: params.text,
      kind: 'review_main_path',
      understanding,
      action: pickActionForGoal(selectedGoal?.id ?? params.mainPath?.id ?? null, params.openActions),
      goalCandidates: params.goalCandidates,
      selectedGoalTitle: selectedGoal?.title ?? params.mainPath?.title ?? null,
    })
  }

  if (understanding.intent_type === 'create_action_request') {
    const goalId = selectedGoal?.id ?? params.goalCandidates[0]?.id ?? null
    const needsClarification = understanding.needs_clarification || !understanding.suggested_action_title
    return {
      rawText: params.text,
      firstIntentText: params.text,
      followupText: null,
      kind: 'create_action_request',
      status: needsClarification ? 'need_confirmation' : params.goals.length ? 'need_confirmation' : 'not_ready',
      needsGoalConfirmation: needsClarification,
      goalCandidates: params.goalCandidates,
      suggestedActionTitle: understanding.suggested_action_title,
      suggestedGoalId: goalId,
      naturalReply: cleanUserFacingCopy(understanding.judgement),
      nextStepLabel: needsClarification
        ? cleanUserFacingCopy(understanding.clarifying_question || understanding.next_step)
        : cleanUserFacingCopy(understanding.next_step),
      primaryAction: params.goals.length
        ? {
            type: 'confirm',
            label: params.locale === 'zh' ? '继续补充行动' : 'Continue action setup',
            href: null,
          }
        : {
            type: 'navigate',
            label: params.locale === 'zh' ? '先定义人生路径' : 'Define a path',
            href: '/goals',
          },
      changes: buildChanges({
        locale: params.locale,
        understanding,
        selectedGoalTitle: selectedGoal?.title ?? null,
      }),
    }
  }

  if (understanding.intent_type === 'clarify_missing_info') {
    return {
      rawText: params.text,
      firstIntentText: params.text,
      followupText: null,
      kind: 'general_guidance',
      status: 'need_confirmation',
      needsGoalConfirmation: true,
      goalCandidates: params.goalCandidates,
      suggestedActionTitle: understanding.suggested_action_title,
      suggestedGoalId: selectedGoal?.id ?? null,
      naturalReply: cleanUserFacingCopy(understanding.judgement),
      nextStepLabel: cleanUserFacingCopy(understanding.clarifying_question || understanding.next_step),
      primaryAction: {
        type: 'confirm',
        label: params.locale === 'zh' ? '继续补充' : 'Continue',
        href: null,
      },
      changes: buildChanges({
        locale: params.locale,
        understanding,
        selectedGoalTitle: selectedGoal?.title ?? null,
      }),
    }
  }

  if (understanding.intent_type === 'unsupported_but_understood' || understanding.intent_type === 'general_guidance') {
    return {
      rawText: params.text,
      firstIntentText: params.text,
      followupText: null,
      kind: 'general_guidance',
      status: understanding.reply_mode === 'clarify' ? 'need_confirmation' : 'execute_now',
      needsGoalConfirmation: understanding.reply_mode === 'clarify',
      goalCandidates: params.goalCandidates,
      suggestedActionTitle: understanding.suggested_action_title,
      suggestedGoalId: selectedGoal?.id ?? null,
      naturalReply: cleanUserFacingCopy(understanding.judgement),
      nextStepLabel: understanding.reply_mode === 'clarify'
        ? cleanUserFacingCopy(understanding.clarifying_question || understanding.next_step)
        : cleanUserFacingCopy(understanding.next_step),
      primaryAction: understanding.recommended_surface === 'today' && params.openActions[0]
        ? {
            type: 'navigate',
            label: params.locale === 'zh' ? '去今日执行' : 'Open today',
            href: `/today?action=${params.openActions[0].id}#today-actions`,
          }
        : understanding.recommended_surface === 'goals'
          ? {
              type: 'navigate',
              label: params.locale === 'zh' ? '去人生路径' : 'Go to paths',
              href: '/goals',
            }
          : {
              type: 'confirm',
              label: params.locale === 'zh' ? '继续聊这个' : 'Continue',
              href: null,
            },
      changes: buildChanges({
        locale: params.locale,
        understanding,
        selectedGoalTitle: selectedGoal?.title ?? null,
      }),
    }
  }

  return null
}

export async function buildChatAgentDraft(params: {
  locale: CommandLocale
  text: string
  sourcePage: ChatAgentSurface
  recentTurns: ChatAgentRecentTurn[]
  goals: ChatAgentGoalRow[]
  openActions: ChatAgentActionRow[]
  goalCandidates: DraftGoalCandidate[]
  mainPath: { id: string; title: string } | null
}): Promise<CommandDraft | null> {
  const understanding = await aiChatUnderstand({
    locale: params.locale,
    userText: params.text,
    sourcePage: params.sourcePage,
    goals: params.goals,
    openActions: params.openActions,
    recentTurns: params.recentTurns,
  })

  if (shouldFallbackToRules({ text: params.text, understanding })) return null
  return draftFromUnderstanding({
    locale: params.locale,
    text: params.text,
    understanding,
    goals: params.goals,
    openActions: params.openActions,
    goalCandidates: params.goalCandidates,
    mainPath: params.mainPath,
  })
}
