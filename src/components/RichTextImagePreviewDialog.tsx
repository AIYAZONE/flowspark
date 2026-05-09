'use client'

import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function RichTextImagePreviewDialog(props: {
  open: boolean
  imageUrl: string | null
  title: string
  openOriginalLabel: string
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1rem,1100px)] max-w-none overflow-hidden border-border/60 bg-background p-0">
        <DialogHeader className="border-b border-border/50 px-5 py-4 pr-14">
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[calc(90vh-4.5rem)] flex-col gap-4 overflow-auto p-4">
          {props.imageUrl ? (
            <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-muted/20">
              <Image
                src={props.imageUrl}
                alt={props.title}
                width={1600}
                height={1200}
                unoptimized
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button asChild variant="outline" className="gap-2">
              <a href={props.imageUrl || '#'} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="h-4 w-4" />
                {props.openOriginalLabel}
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
