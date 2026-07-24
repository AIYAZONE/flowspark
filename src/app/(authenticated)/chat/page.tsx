import { getDictionary } from '@/i18n/get-dictionary'
import { SystemChatComposer } from '@/components/SystemChatComposer'
import { SystemConversation } from '@/components/SystemConversation'
import { getSystemChatSourceCopy } from '@/lib/system-chat'

export default async function ChatPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const dict = await getDictionary()
  const locale = dict.common.locale.startsWith('zh') ? 'zh' : 'en'
  const searchParams = await props.searchParams
  const sourceParam = Array.isArray(searchParams?.source) ? searchParams?.source[0] : searchParams?.source
  const prefillParam = Array.isArray(searchParams?.prefill) ? searchParams?.prefill[0] : searchParams?.prefill
  const source = sourceParam === 'today' || sourceParam === 'profile' || sourceParam === 'system' ? sourceParam : 'system'
  const copy = getSystemChatSourceCopy({
    source,
    locale,
  })
  const emptyStateCopy = locale === 'zh'
    ? {
      title: '直接对系统说你现在想推进什么。',
      body: '你可以直接问“我现在该干什么”，也可以说出你想推进的人生路径。',
    }
    : {
      title: 'Tell the system what you want to move forward.',
      body: 'Ask what to do next, or name the path you want to advance.',
    }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-5xl flex-col">
      <div className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/65">
          {copy.eyebrow}
        </div>
        <span className="text-muted-foreground/60">/</span>
        <p className="truncate leading-5">
          {copy.body}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <SystemConversation
          className="h-full"
          emptyState={(
            <div className="mx-auto max-w-xl text-center">
              <div className="text-base font-medium tracking-tight text-foreground md:text-lg">
                {emptyStateCopy.title}
              </div>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {emptyStateCopy.body}
              </p>
            </div>
          )}
        />
      </div>

      <div className="mt-3 shrink-0 border-t border-border/30 bg-linear-to-t from-background via-background/96 to-transparent pt-4 pb-2">
        <SystemChatComposer
          locale={locale}
          sourcePage={source}
          initialPrefill={typeof prefillParam === 'string' ? prefillParam : null}
        />
      </div>
    </div>
  )
}
