export type ParsedAITodayPlan = {
  variantLabel: string
  basedOn?: string | null
  firstStep: string
  definitionOfDone: string
  reason?: string | null
  remainingDescription: string
}

export function parseAITodayPlanFromDescription(
  input: string | null | undefined
): ParsedAITodayPlan | null {
  if (typeof input !== 'string') return null
  const text = input.trim()
  if (!text) return null

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 4) return null

  const header = lines[0]
  const zhHeader = /^AI 今日推进建议（(.+?)）$/.exec(header)
  const enHeader = /^AI today focus \((.+?)\)$/.exec(header)
  const variantLabel = zhHeader?.[1] || enHeader?.[1]
  if (!variantLabel) return null

  let index = 1
  let basedOn: string | null = null

  if (lines[index]?.startsWith('基于任务：')) {
    basedOn = lines[index].slice('基于任务：'.length).trim()
    index += 1
  } else if (lines[index]?.startsWith('Based on:')) {
    basedOn = lines[index].slice('Based on:'.length).trim()
    index += 1
  }

  const firstStepLine = lines[index]
  const definitionLine = lines[index + 1]
  if (!firstStepLine || !definitionLine) return null

  const firstStep = firstStepLine.startsWith('第一步：')
    ? firstStepLine.slice('第一步：'.length).trim()
    : firstStepLine.startsWith('First step:')
      ? firstStepLine.slice('First step:'.length).trim()
      : ''

  const definitionOfDone = definitionLine.startsWith('完成标准：')
    ? definitionLine.slice('完成标准：'.length).trim()
    : definitionLine.startsWith('DoD:')
      ? definitionLine.slice('DoD:'.length).trim()
      : ''

  if (!firstStep || !definitionOfDone) return null

  index += 2
  let reason: string | null = null

  const reasonLine = lines[index]
  if (reasonLine?.startsWith('建议原因：')) {
    reason = reasonLine.slice('建议原因：'.length).trim()
    index += 1
  } else if (reasonLine?.startsWith('Reason:')) {
    reason = reasonLine.slice('Reason:'.length).trim()
    index += 1
  }

  return {
    variantLabel,
    basedOn,
    firstStep,
    definitionOfDone,
    reason,
    remainingDescription: lines.slice(index).join('\n').trim()
  }
}

export function buildAITodayPlanNote(params: {
  locale: 'zh' | 'en'
  variantLabel: string
  sourceActionTitle?: string | null
  firstStep: string
  definitionOfDone: string
  reason: string
}) {
  const {
    locale,
    variantLabel,
    sourceActionTitle,
    firstStep,
    definitionOfDone,
    reason
  } = params
  const zh = locale === 'zh'
  return [
    zh ? `AI 今日推进建议（${variantLabel}）` : `AI today focus (${variantLabel})`,
    sourceActionTitle
      ? zh
        ? `基于任务：${sourceActionTitle}`
        : `Based on: ${sourceActionTitle}`
      : null,
    zh ? `第一步：${firstStep}` : `First step: ${firstStep}`,
    zh ? `完成标准：${definitionOfDone}` : `DoD: ${definitionOfDone}`,
    zh ? `建议原因：${reason}` : `Reason: ${reason}`
  ]
    .filter(Boolean)
    .join('\n')
}

export function mergeAITodayPlanIntoDescription(params: {
  existingDescription?: string | null
  note: string
}) {
  const { existingDescription, note } = params
  const parsed = parseAITodayPlanFromDescription(existingDescription)
  const body = parsed?.remainingDescription ?? (existingDescription || '').trim()
  return body ? `${note}\n\n${body}` : note
}
