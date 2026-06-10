'use client'

import { Maximize2, Minimize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ModalHeaderActionsProps = {
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  fullscreenLabel?: string
  exitFullscreenLabel?: string
  closeLabel?: string
  hideFullscreenOnMobile?: boolean
  renderCloseButton?: (button: React.ReactNode) => React.ReactNode
  className?: string
}

export function ModalHeaderActions({
  isFullscreen = false,
  onToggleFullscreen,
  fullscreenLabel = 'Fullscreen',
  exitFullscreenLabel = 'Exit fullscreen',
  closeLabel = 'Close',
  hideFullscreenOnMobile = false,
  renderCloseButton,
  className,
}: ModalHeaderActionsProps) {
  const closeButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">{closeLabel}</span>
    </Button>
  )

  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      {onToggleFullscreen ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground',
            hideFullscreenOnMobile && 'hidden md:inline-flex'
          )}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span className="sr-only">{isFullscreen ? exitFullscreenLabel : fullscreenLabel}</span>
        </Button>
      ) : null}
      {renderCloseButton ? renderCloseButton(closeButton) : closeButton}
    </div>
  )
}
