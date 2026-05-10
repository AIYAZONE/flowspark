import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { computeTopFrictionFromFeedback } from '@/lib/ai/aiInsightsFriction'
import { formatAIOptionLabel } from '@/lib/ai/analyticsPresentation'

type Dict = Record<string, string>

type Props = {
  dict: Dict
  locale: 'zh' | 'en'
  recent: Array<{ feedback_label: string | null }>
  scope: 'global' | 'scene'
}

function suggestionFor(key: string, dict: Dict) {
  if (key === 'no_time') return dict.aiAnalyticsFrictionSuggestionNoTime || ''
  if (key === 'too_hard') return dict.aiAnalyticsFrictionSuggestionTooHard || ''
  if (key === 'not_fit') return dict.aiAnalyticsFrictionSuggestionNotFit || ''
  if (key === 'already_planned') return dict.aiAnalyticsFrictionSuggestionAlreadyPlanned || ''
  return dict.aiAnalyticsFrictionSuggestionOther || ''
}

export function AIAnalyticsFrictionTop(props: Props) {
  const result = computeTopFrictionFromFeedback({ recent: props.recent, topN: 3 })
  const title =
    props.scope === 'scene'
      ? props.dict.aiAnalyticsFrictionTitleScene || (props.locale === 'zh' ? '本场景主要阻力' : 'Top frictions (scene)')
      : props.dict.aiAnalyticsFrictionTitle || (props.locale === 'zh' ? '你的主要阻力' : 'Top frictions')

  const desc =
    props.dict.aiAnalyticsFrictionDesc
    || (props.locale === 'zh' ? '来自你最近的反馈（点进回放可继续反馈）' : 'Based on your recent feedback (you can leave more feedback in the replay).')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </CardHeader>
      <CardContent>
        {result.top.length === 0 ? (
          <div className="text-sm leading-6 text-muted-foreground">
            {props.dict.aiAnalyticsFrictionEmpty
              || (props.locale === 'zh'
                ? '你还没有足够的反馈数据。去任意一条“查看详情”里点“没用”并选原因，系统会越来越贴合你。'
                : 'Not enough feedback yet. Open any replay, tap “Not useful”, and pick a reason so the system can adapt.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {result.top.map(item => (
              <div key={item.key} className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{formatAIOptionLabel(item.key, props.locale)}</div>
                  <div className="text-sm text-muted-foreground">
                    {props.locale === 'zh' ? `${item.count} 次` : `${item.count} times`}
                  </div>
                </div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">
                  {suggestionFor(item.key, props.dict)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

