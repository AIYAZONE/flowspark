import { buildCommandPresentation } from '../command-bar/presentation.ts'
import { parseUserCommand } from '../command-bar/parse.ts'
import type { CommandDraft, CommandLocale, DraftGoalCandidate } from '../command-bar/types.ts'

export type FallbackActionRow = {
  id: string
  title: string
  goalId: string | null
  goalTitle: string | null
  type: string | null
}

function extractSuggestedActionTitle(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return null

  const cleaned = trimmed
    .replace(/^今天(的)?/u, '')
    .replace(/^(核心|主线)(是|要)?/u, '')
    .replace(/^(我想|我要|帮我|请帮我)/u, '')
    .replace(/^(推进|继续推进|往前推进|做一下|安排一下)/u, '')
    .trim()

  return cleaned || null
}

function extractCreateActionTitle(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return null

  const cleaned = trimmed
    .replace(/[？?]/gu, '')
    .replace(/^(你能|你可以|可以|能不能)/u, '')
    .replace(/^(帮我|给我|请)/u, '')
    .replace(/^(创建|新建|新增|添加|加一个)/u, '')
    .replace(/^(一个|一条|个)/u, '')
    .replace(/^(行动|action)/iu, '')
    .replace(/^(吗|么)/u, '')
    .trim()

  return cleaned || null
}

export function buildFallbackCommandDraft(params: {
  locale: CommandLocale
  text: string
  mainPathId: string | null
  goalCandidates: DraftGoalCandidate[]
  openActions: FallbackActionRow[]
}): CommandDraft {
  const parsed = parseUserCommand(params.text)
  const topAction =
    parsed.kind === 'review_main_path' && params.mainPathId
      ? params.openActions.find((action) => action.goalId === params.mainPathId) || null
      : params.openActions[0] || null

  const suggestedActionTitle =
    parsed.kind === 'create_action_request'
      ? extractCreateActionTitle(parsed.firstIntentText)
      : parsed.kind === 'set_today_core' || parsed.kind === 'push_next_step'
        ? extractSuggestedActionTitle(parsed.firstIntentText) || (params.locale === 'zh' ? '推进一步' : 'Move one step')
        : null

  const presentation = buildCommandPresentation({
    locale: params.locale,
    kind: parsed.kind,
    firstIntentText: parsed.firstIntentText,
    followupText: parsed.followupText,
    goalCandidates: parsed.kind === 'review_main_path' ? params.goalCandidates : params.goalCandidates,
    suggestedActionTitle,
    topOpenAction: topAction
      ? {
          id: topAction.id,
          title: topAction.title,
          goalTitle: topAction.goalTitle,
          isCore: topAction.type === 'core',
        }
      : null,
  })

  const changes = [...presentation.changes]
  if ((parsed.kind === 'review_current_tasks' || parsed.kind === 'review_main_path') && params.openActions.length > 1) {
    changes.push({
      label: params.locale === 'zh' ? '其余任务' : 'Other open tasks',
      value:
        params.locale === 'zh'
          ? `另外还有 ${params.openActions.length - 1} 项待推进`
          : `${params.openActions.length - 1} more task(s) waiting`,
      status: 'draft',
    })
  }

  return {
    rawText: parsed.rawText,
    firstIntentText: parsed.firstIntentText,
    followupText: parsed.followupText,
    kind: parsed.kind,
    status: presentation.status,
    needsGoalConfirmation: presentation.status === 'need_confirmation',
    goalCandidates: presentation.status === 'execute_now' && parsed.kind === 'review_current_tasks' ? [] : params.goalCandidates,
    suggestedActionTitle,
    suggestedGoalId: params.goalCandidates[0]?.id ?? null,
    naturalReply: presentation.naturalReply,
    nextStepLabel: presentation.nextStepLabel,
    primaryAction: presentation.primaryAction,
    changes,
  }
}
