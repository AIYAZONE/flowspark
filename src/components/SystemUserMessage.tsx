'use client'

export function SystemUserMessage(props: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[40rem] rounded-[1.3rem] border border-border/22 bg-muted/22 px-4 py-3 text-sm leading-6 text-foreground shadow-[0_10px_24px_-24px_rgba(15,23,42,0.16)]">
        {props.text}
      </div>
    </div>
  )
}
