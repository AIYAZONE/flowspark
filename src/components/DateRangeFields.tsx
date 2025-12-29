'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Labels {
  start: string
  end: string
  error: string
}

interface Props {
  defaultStart: string
  defaultEnd: string
  labels: Labels
  onValidityChange?: (valid: boolean) => void
  className?: string
}

export function DateRangeFields({ defaultStart, defaultEnd, labels, onValidityChange, className }: Props) {
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const valid = !end || end >= start

  useEffect(() => {
    onValidityChange?.(valid)
  }, [valid, onValidityChange])

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="grid gap-2">
        <Label htmlFor="start_date">{labels.start}</Label>
        <Input
          id="start_date"
          name="start_date"
          type="date"
          value={start}
          onChange={(e) => {
            const v = e.target.value
            setStart(v)
            if (end && end < v) setEnd(v)
          }}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="end_date">{labels.end}</Label>
        <Input
          id="end_date"
          name="end_date"
          type="date"
          value={end}
          min={start}
          onChange={(e) => setEnd(e.target.value)}
        />
        {!valid && <p className="text-xs text-destructive">{labels.error}</p>}
      </div>
    </div>
  )
}

