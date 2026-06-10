'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dialog, DialogClose, DialogFormContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DESKTOP_MODAL_SHELL_CLASS } from '@/components/responsive-classes'

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
      <DialogFormContent
        mobileMode="fullscreen"
        hideCloseButton
        className={cn(
          'p-0',
          DESKTOP_MODAL_SHELL_CLASS,
          'md:left-[50%] md:top-[50%] md:bottom-auto md:right-auto md:h-auto md:w-full md:max-w-4xl md:max-h-[85vh] md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg md:border'
        )}
      >
        <div className="flex h-dvh flex-col md:h-[85vh]">
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
          <div className="min-h-0 flex flex-1 flex-col">
            {children}
          </div>
        </div>
      </DialogFormContent>
    </Dialog>
  )
}
