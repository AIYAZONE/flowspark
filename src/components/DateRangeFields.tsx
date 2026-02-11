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
  valueStart?: string
  valueEnd?: string
  onChange?: (next: { start: string; end: string }) => void
  labels: Labels
  onValidityChange?: (valid: boolean) => void
  className?: string
}

export function DateRangeFields({
  defaultStart,
  defaultEnd,
  valueStart,
  valueEnd,
  onChange,
  labels,
  onValidityChange,
  className
}: Props) {
  const controlled = valueStart !== undefined || valueEnd !== undefined
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const startValue = controlled ? (valueStart ?? '') : start
  const endValue = controlled ? (valueEnd ?? '') : end
  const valid = !!startValue && !!endValue && endValue >= startValue
  const isRangeInvalid = !!startValue && !!endValue && endValue < startValue

  useEffect(() => {
    onValidityChange?.(valid)
  }, [valid, onValidityChange])

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="grid gap-2">
        <Label htmlFor="start_date" required>{labels.start}</Label>
        <Input
          id="start_date"
          name="start_date"
          type="date"
          value={startValue}
          onChange={(e) => {
            const v = e.target.value
            const nextStart = v
            const nextEnd = endValue && endValue < v ? v : endValue
            if (controlled) {
              onChange?.({ start: nextStart, end: nextEnd })
              return
            }
            setStart(nextStart)
            if (nextEnd !== endValue) setEnd(nextEnd)
          }}
          required
        />
      </div>
      <div className="grid gap-2 relative">
        <Label htmlFor="end_date" required>{labels.end}</Label>
        <Input
          id="end_date"
          name="end_date"
          type="date"
          value={endValue}
          min={startValue}
          onChange={(e) => {
            const v = e.target.value
            if (controlled) {
              onChange?.({ start: startValue, end: v })
              return
            }
            setEnd(v)
          }}
          required
        />
        {isRangeInvalid && <p className="text-xs text-destructive absolute top-full mt-1 left-0">{labels.error}</p>}
      </div>
    </div>
  )
}
