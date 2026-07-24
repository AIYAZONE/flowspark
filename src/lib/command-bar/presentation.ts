import type {
  CommandDraft,
  CommandIntentKind,
  CommandLocale,
  CommandTopOpenAction,
  DraftGoalCandidate,
} from './types.ts'

type BuildCommandPresentationParams = {
  locale: CommandLocale
  kind: CommandIntentKind
  firstIntentText: string
  followupText: string | null
  goalCandidates: DraftGoalCandidate[]
  suggestedActionTitle: string | null
  topOpenAction: CommandTopOpenAction | null
}

function buildReviewTone(firstIntentText: string) {
  if (/最重要|优先级|优先/u.test(firstIntentText)) return 'priority'
  if (/今天/u.test(firstIntentText)) return 'today'
  if (/下一步|接下来/u.test(firstIntentText)) return 'next'
  return 'current'
}

function looksLikeGenericCreateActionRequest(text: string) {
  const cleaned = text
    .replace(/[？?]/gu, '')
    .replace(/\s+/g, '')
    .replace(/你能|你可以|可以|能不能|帮我|给我|请|一下/gu, '')
    .replace(/创建|新建|新增|添加|加一个/gu, '')
    .replace(/行动|action/giu, '')
    .replace(/吗|么/gu, '')
    .trim()

  return cleaned.length === 0
}

function pushFollowupChange(
  locale: CommandLocale,
  followupText: string | null,
  changes: CommandDraft['changes']
) {
  if (!followupText) return
  changes.push({
    label: locale === 'zh' ? '未处理跟进' : 'Unprocessed follow-up',
    value: followupText,
    status: 'draft',
  })
}

export function buildCommandPresentation(
  params: BuildCommandPresentationParams
): Pick<CommandDraft, 'status' | 'naturalReply' | 'nextStepLabel' | 'primaryAction' | 'changes'> {
  const { locale, kind, firstIntentText, followupText, goalCandidates, suggestedActionTitle, topOpenAction } =
    params
  const tone = buildReviewTone(firstIntentText)

  if (kind === 'ask_capabilities') {
    return {
      status: 'execute_now',
      naturalReply:
        locale === 'zh'
          ? '我可以帮你判断现在先做什么、识别当前主线、把推进意图整理成行动草案，也能把你带到今天的执行层。'
          : 'I can help decide what to do now, identify the main path, turn an intent into an action draft, and send you into execution.',
      nextStepLabel:
        locale === 'zh'
          ? '你可以直接说“我现在该做什么”“今天主线是什么”，或“帮我创建一个行动”。'
          : 'Ask what to do now, what the main path is, or ask me to create an action.',
      primaryAction: {
        type: 'navigate',
        label: locale === 'zh' ? '去今日执行' : 'Open today',
        href: '/today',
      },
      changes: [
        {
          label: locale === 'zh' ? '系统能力' : 'Capabilities',
          value:
            locale === 'zh'
              ? '任务判断、主线识别、行动草案、执行跳转'
              : 'task guidance, main-path review, action drafting, execution handoff',
          status: 'draft',
        },
      ],
    }
  }

  if (kind === 'create_action_request') {
    const genericRequest = looksLikeGenericCreateActionRequest(firstIntentText)

    if (genericRequest) {
      return {
        status: 'need_confirmation',
        naturalReply:
          locale === 'zh'
            ? '可以，我能帮你创建行动。'
            : 'Yes, I can help create an action.',
        nextStepLabel:
          locale === 'zh'
            ? '直接告诉我要创建的行动内容；如果你知道归属哪条路径，也一起说。'
            : 'Tell me the action you want to create, and include the path if you already know it.',
        primaryAction: {
          type: 'confirm',
          label: locale === 'zh' ? '补充行动信息' : 'Add action details',
          href: null,
        },
        changes: [
          {
            label: locale === 'zh' ? '系统理解' : 'System read',
            value: locale === 'zh' ? '你想新建一条行动' : 'You want to create an action',
            status: 'draft',
          },
        ],
      }
    }

    if (goalCandidates.length === 0) {
      return {
        status: 'not_ready',
        naturalReply:
          locale === 'zh'
            ? '我能帮你创建这条行动，但现在还没有可归属的人生路径。'
            : 'I can create this action, but there is no path to attach it to yet.',
        nextStepLabel:
          locale === 'zh'
            ? '先定义一条人生路径，再回来告诉我这条行动要挂到哪里。'
            : 'Define a path first, then tell me where this action should belong.',
        primaryAction: {
          type: 'navigate',
          label: locale === 'zh' ? '先定义人生路径' : 'Define a path',
          href: '/goals',
        },
        changes: [
          {
            label: locale === 'zh' ? '待创建行动' : 'Pending action',
            value: suggestedActionTitle || firstIntentText,
            status: 'draft',
          },
        ],
      }
    }

    return {
      status: 'need_confirmation',
      naturalReply:
        locale === 'zh'
          ? `我已经接住你要创建的行动：${suggestedActionTitle || firstIntentText}。`
          : `I understand the action you want to create: ${suggestedActionTitle || firstIntentText}.`,
      nextStepLabel:
        locale === 'zh'
          ? goalCandidates.length > 1
            ? '再告诉我这条行动属于哪条人生路径，我就能继续整理。'
            : `如果这条行动归属「${goalCandidates[0].title}」，就直接继续补充细节。`
          : goalCandidates.length > 1
            ? 'Tell me which path this action belongs to so I can continue.'
            : `If this belongs to "${goalCandidates[0].title}", continue with the details.`,
      primaryAction: {
        type: 'confirm',
        label: locale === 'zh' ? '继续补充行动' : 'Continue action setup',
        href: null,
      },
      changes: [
        {
          label: locale === 'zh' ? '待创建行动' : 'Pending action',
          value: suggestedActionTitle || firstIntentText,
          status: 'draft',
        },
      ],
    }
  }

  if (kind === 'review_main_path') {
    const mainPath = goalCandidates[0] ?? null

    if (!mainPath) {
      return {
        status: 'not_ready',
        naturalReply:
          locale === 'zh'
            ? '你现在还没有明确的主线，因为还没有可用的人生路径。'
            : 'There is no clear main path yet because no path is available.',
        nextStepLabel:
          locale === 'zh'
            ? '先定义一条人生路径，我才能判断当前主线。'
            : 'Define a path first so the system can decide the main path.',
        primaryAction: {
          type: 'navigate',
          label: locale === 'zh' ? '先定义人生路径' : 'Define a path',
          href: '/goals',
        },
        changes: [
          {
            label: locale === 'zh' ? '当前状态' : 'Current state',
            value: locale === 'zh' ? '暂无可判断的主线' : 'No main path available',
            status: 'draft',
          },
        ],
      }
    }

    if (!topOpenAction) {
      return {
        status: 'not_ready',
        naturalReply:
          locale === 'zh'
            ? `你当前主线是「${mainPath.title}」，但这条主线下面还没有可直接执行的未完成 action。`
            : `Your current main path is "${mainPath.title}", but it has no open action yet.`,
        nextStepLabel:
          locale === 'zh'
            ? '先去这条路径下拆出下一步执行项。'
            : 'Break the next executable step under this path first.',
        primaryAction: {
          type: 'navigate',
          label: locale === 'zh' ? '查看人生路径' : 'Open paths',
          href: '/goals',
        },
        changes: [
          {
            label: locale === 'zh' ? '当前主线' : 'Current main path',
            value: mainPath.title,
            status: 'draft',
          },
        ],
      }
    }

    return {
      status: 'execute_now',
      naturalReply:
        locale === 'zh'
          ? tone === 'priority'
            ? `现在最该优先的是「${mainPath.title}」，先推进：${topOpenAction.title}。`
            : tone === 'today'
              ? `今天主线是「${mainPath.title}」，先推进：${topOpenAction.title}。`
              : `当前主线是「${mainPath.title}」，先推进：${topOpenAction.title}。`
          : `Your current main path is "${mainPath.title}". Start with ${topOpenAction.title}.`,
      nextStepLabel:
        locale === 'zh'
          ? topOpenAction.isCore
            ? '打开今日执行层，先把主线推进一格。'
            : '打开今日执行层，先把这条路径往前推一步。'
          : 'Open today and move this main path one step forward.',
      primaryAction: {
        type: 'navigate',
        label: locale === 'zh' ? '推进当前主线' : 'Advance main path',
        href: `/today?action=${topOpenAction.id}#today-actions`,
      },
      changes: [
        {
          label: locale === 'zh' ? '当前主线' : 'Current main path',
          value: mainPath.title,
          status: 'draft',
        },
        {
          label: locale === 'zh' ? '优先动作' : 'Priority action',
          value: topOpenAction.goalTitle
            ? `${topOpenAction.title} · ${topOpenAction.goalTitle}`
            : topOpenAction.title,
          status: 'draft',
        },
      ],
    }
  }

  if (kind === 'review_current_tasks') {
    if (!topOpenAction) {
      return {
        status: 'not_ready',
        naturalReply:
          locale === 'zh'
            ? '你现在没有未完成任务，执行层是空的。'
            : 'You have no unfinished tasks right now.',
        nextStepLabel:
          locale === 'zh'
            ? '如果你想继续推进，直接告诉系统你要推进哪条人生路径。'
            : 'Tell the system which path you want to move forward.',
        primaryAction: {
          type: 'navigate',
          label: locale === 'zh' ? '去人生路径' : 'Go to paths',
          href: '/goals',
        },
        changes: [
          {
            label: locale === 'zh' ? '当前状态' : 'Current state',
            value: locale === 'zh' ? '没有未完成任务' : 'No unfinished tasks',
            status: 'draft',
          },
        ],
      }
    }

    return {
      status: 'execute_now',
      naturalReply:
        locale === 'zh'
          ? tone === 'today'
            ? `今天先做：${topOpenAction.title}${topOpenAction.goalTitle ? `，归属「${topOpenAction.goalTitle}」` : ''}。`
            : tone === 'next'
              ? `你下一步先做：${topOpenAction.title}${topOpenAction.goalTitle ? `，归属「${topOpenAction.goalTitle}」` : ''}。`
              : `现在先做：${topOpenAction.title}${topOpenAction.goalTitle ? `，归属「${topOpenAction.goalTitle}」` : ''}。`
          : `Do this first: ${topOpenAction.title}.`,
      nextStepLabel:
        locale === 'zh'
          ? topOpenAction.isCore
            ? '打开今日执行层，直接开始主线。'
            : '打开今日执行层，先把这一项做掉。'
          : 'Open today and start executing.',
      primaryAction: {
        type: 'navigate',
        label: locale === 'zh' ? '执行系统安排' : 'Execute system plan',
        href: `/today?action=${topOpenAction.id}#today-actions`,
      },
      changes: [
        {
          label:
            locale === 'zh'
              ? topOpenAction.isCore
                ? '系统主线'
                : '优先任务'
              : topOpenAction.isCore
                ? 'Main thread'
                : 'Priority task',
          value: topOpenAction.goalTitle
            ? `${topOpenAction.title} · ${topOpenAction.goalTitle}`
            : topOpenAction.title,
          status: 'draft',
        },
      ],
    }
  }

  if (kind === 'unknown' || kind === 'complete_action') {
    const changes: CommandDraft['changes'] = [
      {
        label: locale === 'zh' ? '系统理解' : 'System read',
        value:
          kind === 'complete_action'
            ? locale === 'zh'
              ? '你在尝试收口一项行动'
              : 'You are trying to close an action'
            : locale === 'zh'
              ? '这句话还不足以直接写入系统'
              : 'This input is not ready to write into the system',
        status: 'draft',
      },
    ]
    pushFollowupChange(locale, followupText, changes)

    return {
      status: 'not_ready',
      naturalReply:
        kind === 'complete_action'
          ? locale === 'zh'
            ? '我知道你在尝试收口一项行动，但这一步还不适合用自由文本直接完成。'
            : 'I know you are trying to close an action, but free-text completion is not ready yet.'
          : locale === 'zh'
            ? '这句话我还不能安全写入系统。'
            : 'I cannot safely write this into the system yet.',
      nextStepLabel:
        locale === 'zh'
          ? '直接告诉我你要推进哪条人生路径，或问“我现在该干什么”。'
          : 'Tell me which path to move forward, or ask “what should I do now?”.',
      primaryAction: {
        type: 'navigate',
        label: locale === 'zh' ? '打开今日主线' : 'Open today',
        href: '/today',
      },
      changes,
    }
  }

  if (goalCandidates.length === 0) {
    const changes: CommandDraft['changes'] = [
      {
        label: locale === 'zh' ? '系统判断' : 'System judgment',
        value:
          suggestedActionTitle || firstIntentText || (locale === 'zh' ? '当前还没有可落地的推进对象' : 'No actionable target yet'),
        status: 'draft',
      },
    ]
    pushFollowupChange(locale, followupText, changes)

    return {
      status: 'not_ready',
      naturalReply:
        locale === 'zh'
          ? '我能接住这条推进意图，但你现在还没有可归属的人生路径，先定义一条人生路径。'
          : 'I can take this intent, but you need a path first.',
      nextStepLabel:
        locale === 'zh'
          ? '先定义一条人生路径，再回来告诉系统你要推进什么。'
          : 'Define a path first, then tell the system what to move forward.',
      primaryAction: {
        type: 'navigate',
        label: locale === 'zh' ? '先定义人生路径' : 'Define a path',
        href: '/goals',
      },
      changes,
    }
  }

  if (goalCandidates.length > 1) {
    const changes: CommandDraft['changes'] = [
      {
        label: locale === 'zh' ? '系统判断' : 'System judgment',
        value: suggestedActionTitle || firstIntentText,
        status: 'draft',
      },
    ]
    pushFollowupChange(locale, followupText, changes)

    return {
      status: 'need_confirmation',
      naturalReply:
        locale === 'zh'
          ? '系统已经理解你的推进方向，但还需要你确认这一步属于哪条人生路径。'
          : 'The system understands the intent, but still needs the target path.',
      nextStepLabel:
        locale === 'zh' ? '先选一条人生路径，我再把这一步落进去。' : 'Choose a path first.',
      primaryAction: {
        type: 'confirm',
        label: locale === 'zh' ? '先确认路径' : 'Confirm path',
        href: null,
      },
      changes,
    }
  }

  return {
    status: 'execute_now',
    naturalReply:
      locale === 'zh'
        ? `系统已为你准备好下一步：${suggestedActionTitle || firstIntentText}。`
        : `The next step is ready: ${suggestedActionTitle || firstIntentText}.`,
    nextStepLabel:
      locale === 'zh'
        ? '确认后，我会把这一步写进今天的执行层。'
        : 'Confirm and I will write this into today.',
    primaryAction: {
      type: 'commit',
      label: locale === 'zh' ? '确认执行' : 'Confirm',
      href: null,
    },
    changes: [
      {
        label: locale === 'zh' ? '将要落地' : 'Will add',
        value: suggestedActionTitle || firstIntentText,
        status: 'draft',
      },
      {
        label: locale === 'zh' ? '归属路径' : 'Path',
        value: goalCandidates[0].title,
        status: 'draft',
      },
    ],
  }
}
