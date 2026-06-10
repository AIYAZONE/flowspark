'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
          'md:left-[50%] md:top-[50%] md:h-auto md:w-full md:max-w-4xl md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg'
        ].join(' ')}
      >
        <div className="flex h-[100dvh] flex-col md:h-[85vh]">
          <div className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur px-4 py-3 md:px-6">
            <DialogHeader className="space-y-0 text-left">
              <div className="flex items-center justify-between gap-4">
                <DialogTitle>{title}</DialogTitle>
                <DialogClose asChild>
                  <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
