'use client'

import * as React from 'react'
import { ChatProvider, useChat, type ChatSource } from '@/lib/chat/store'
import type { ChatCopy } from '@/lib/chat/types'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ChatComposer } from './ChatComposer'
import { ChatConversation } from './ChatConversation'

export function ChatSurface({
  copy,
  source,
  prefill
}: {
  copy: ChatCopy
  source: ChatSource
  prefill?: string
}) {
  return (
    <TooltipProvider delayDuration={120}>
      <ChatProvider source={source}>
        <ChatInner copy={copy} prefill={prefill} />
      </ChatProvider>
    </TooltipProvider>
  )
}

function ChatInner({ copy, prefill }: { copy: ChatCopy; prefill?: string }) {
  const {
    turns,
    isStreaming,
    send,
    applyAction,
    completeAction,
    dismissCompletion,
    completeReferencedAction,
    submitFeedback,
    cancelFeedback
  } = useChat()
  const [value, setValue] = React.useState(prefill || '')

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const main = document.querySelector<HTMLElement>('main.overflow-y-auto')
      if (main) {
        main.scrollTop = main.scrollHeight
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }
    })
    return () => window.cancelAnimationFrame(id)
  }, [turns])

  return (
    <>
      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="pt-4 pb-[calc(104px+1.5rem+env(safe-area-inset-bottom))] sm:pt-6 md:pb-44">
          <ChatConversation
            copy={copy}
            turns={turns}
            onApplyAction={applyAction}
            onCompleteAction={completeAction}
            onDismissCompletion={dismissCompletion}
            onCompleteReferenced={completeReferencedAction}
            onSubmitFeedback={submitFeedback}
            onCancelFeedback={cancelFeedback}
            onPickChip={(text) => setValue(text)}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 pl-0 md:pl-[108px] xl:pl-[118px] 2xl:pl-[126px] [@media(min-width:1920px)]:pl-[134px] [@media(min-width:2560px)]:pl-[142px] pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0">
        <div className="px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8 2xl:px-10 [@media(min-width:1920px)]:px-12 [@media(min-width:2560px)]:px-14">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mx-auto max-w-3xl">
              <ChatComposer
                value={value}
                onChange={setValue}
                onSend={send}
                placeholder={copy.placeholder}
                disabled={isStreaming}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
