'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function NewGoalDialogShell({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={[
          'p-0',
          'w-[100vw] h-[100dvh] max-w-none left-0 top-0 translate-x-0 translate-y-0 rounded-none',
          'sm:left-[50%] sm:top-[50%] sm:h-auto sm:w-full sm:max-w-4xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg'
        ].join(' ')}
      >
        <div className="flex h-[100dvh] flex-col sm:h-[85vh]">
          <div className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur px-4 py-3 sm:px-6">
            <DialogHeader className="space-y-0 text-left">
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
