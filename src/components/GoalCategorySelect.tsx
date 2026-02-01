'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  BUILTIN_GOAL_CATEGORY_KEYS,
  getCategoryLabel,
  isBuiltinGoalCategory,
  normalizeCategoryInput,
} from '@/lib/goalCategories'
import { replaceGoalCategory } from '@/app/(authenticated)/goals/actions'
import type en from '@/i18n/en.json'

type Dict = typeof en

interface GoalCategorySelectProps {
  dict: Dict
  value: string
  onChange: (value: string) => void
  enableBulkReplace?: boolean
}

export function GoalCategorySelect({ dict, value, onChange, enableBulkReplace }: GoalCategorySelectProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [isDesktop, setIsDesktop] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [replaceChoice, setReplaceChoice] = useState<string>('other')
  const [replaceDraft, setReplaceDraft] = useState<string>('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const selected = value || 'other'
  const isCustom = selected !== 'other' && !isBuiltinGoalCategory(selected)

  const customItemValue = isCustom ? selected : undefined

  const options = useMemo(
    () => BUILTIN_GOAL_CATEGORY_KEYS.map((key) => ({ value: key, label: getCategoryLabel(dict, key) })),
    [dict],
  )

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const sync = () => setIsDesktop(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!customOpen) return
    const id = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
    return () => window.clearTimeout(id)
  }, [customOpen])

  function handleSelectChange(next: string) {
    if (next === '__custom__') {
      setDraft(isCustom ? selected : '')
      setReplaceChoice('other')
      setReplaceDraft('')
      setCustomOpen(true)
      return
    }
    onChange(next)
  }

  function handleConfirm() {
    const next = normalizeCategoryInput(draft)
    onChange(next)
    setCustomOpen(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  async function handleReplaceAndRemove() {
    if (!enableBulkReplace) return
    if (!isCustom) return
    if (replacing) return

    const to = normalizeCategoryInput(
      replaceChoice === '__custom__' ? replaceDraft : replaceChoice,
    )
    if (!to || to === selected) return

    const ok = window.confirm(dict.goals.category.replaceConfirm)
    if (!ok) return

    setReplacing(true)
    try {
      await replaceGoalCategory({ from: selected, to })
      onChange(to)
      setCustomOpen(false)
    } finally {
      setReplacing(false)
    }
  }

  return (
    <>
      <Select value={selected} onValueChange={handleSelectChange}>
        <SelectTrigger>
          <SelectValue placeholder={dict.goals.category.label} />
        </SelectTrigger>
        <SelectContent>
          {customItemValue && (
            <SelectItem value={customItemValue}>
              {customItemValue}
            </SelectItem>
          )}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
          <SelectItem value="__custom__">{dict.goals.category.custom}…</SelectItem>
        </SelectContent>
      </Select>

      {isDesktop ? (
        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
          <DialogContent className="max-w-sm gap-3">
            <DialogHeader>
              <DialogTitle>{dict.goals.category.custom}</DialogTitle>
            </DialogHeader>
            <div className="pt-1">
              <Input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={dict.goals.category.label}
                className="bg-background/50"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {dict.goals.category.customHint}
            </div>
            {enableBulkReplace && isCustom && (
              <div className="grid gap-3 rounded-md border border-border/60 p-3">
                <div className="grid gap-2">
                  <div className="text-sm font-medium">{dict.goals.category.replaceLabel}</div>
                  <Select value={replaceChoice} onValueChange={setReplaceChoice}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder={dict.goals.category.replaceLabel} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">{dict.goals.category.custom}…</SelectItem>
                    </SelectContent>
                  </Select>
                  {replaceChoice === '__custom__' && (
                    <Input
                      value={replaceDraft}
                      onChange={(e) => setReplaceDraft(e.target.value)}
                      placeholder={dict.goals.category.replacePlaceholder}
                      className="bg-background/50"
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReplaceAndRemove}
                  disabled={replacing}
                >
                  {dict.goals.category.replaceAndRemove}
                </Button>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setCustomOpen(false)}>
                {dict.common.cancel}
              </Button>
              <Button type="button" onClick={handleConfirm}>
                {dict.common.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={customOpen} onOpenChange={setCustomOpen}>
          <SheetContent side="bottom" className="pb-6">
            <SheetHeader>
              <SheetTitle>{dict.goals.category.custom}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <Input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={dict.goals.category.label}
                className="bg-background/50"
              />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {dict.goals.category.customHint}
            </div>
            {enableBulkReplace && isCustom && (
              <div className="mt-4 grid gap-3 rounded-md border border-border/60 p-3">
                <div className="grid gap-2">
                  <div className="text-sm font-medium">{dict.goals.category.replaceLabel}</div>
                  <Select value={replaceChoice} onValueChange={setReplaceChoice}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder={dict.goals.category.replaceLabel} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">{dict.goals.category.custom}…</SelectItem>
                    </SelectContent>
                  </Select>
                  {replaceChoice === '__custom__' && (
                    <Input
                      value={replaceDraft}
                      onChange={(e) => setReplaceDraft(e.target.value)}
                      placeholder={dict.goals.category.replacePlaceholder}
                      className="bg-background/50"
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReplaceAndRemove}
                  disabled={replacing}
                >
                  {dict.goals.category.replaceAndRemove}
                </Button>
              </div>
            )}
            <SheetFooter className="mt-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCustomOpen(false)}>
                {dict.common.cancel}
              </Button>
              <Button type="button" onClick={handleConfirm}>
                {dict.common.save}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
