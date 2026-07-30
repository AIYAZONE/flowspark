'use client'

import { useEffect, useState, useTransition, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Circle,
  GraduationCap,
  HeartPulse,
  Loader2,
  Smile,
  Sparkles,
  TrendingUp,
  Trash2,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  buildCategoryOptions,
  getAreaDefaultIcon,
  getAreaDefaultOrder,
  type AreaMeta,
} from '@/lib/goalCategories'
import {
  deleteAreaMeta,
  deleteAreaMetaRow,
  replaceGoalCategory,
  upsertAreaMeta,
} from '@/app/(authenticated)/goals/actions'
import type en from '@/i18n/en.json'

type Dict = typeof en

const ICON_OPTIONS: { name: string; Icon: LucideIcon }[] = [
  { name: 'sparkles', Icon: Sparkles },
  { name: 'briefcase', Icon: Briefcase },
  { name: 'heart-pulse', Icon: HeartPulse },
  { name: 'trending-up', Icon: TrendingUp },
  { name: 'graduation-cap', Icon: GraduationCap },
  { name: 'wallet', Icon: Wallet },
  { name: 'smile', Icon: Smile },
  { name: 'users', Icon: Users },
  { name: 'circle', Icon: Circle },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.name, o.Icon]),
) as Record<string, LucideIcon>

interface AreaRow {
  categoryKey: string
  label: string
  icon: string
  description: string
  sortOrder: number
  isBuiltin: boolean
}

function buildRows(areaMeta: AreaMeta[], usedCategories: string[], dict: Dict): AreaRow[] {
  const options = buildCategoryOptions({ dict, usedCategories })
  const metaByKey = new Map(areaMeta.map((m) => [m.category_key, m]))
  const rows = options.map((opt) => {
    const meta = metaByKey.get(opt.value)
    return {
      categoryKey: opt.value,
      label: opt.label,
      icon: meta?.icon || getAreaDefaultIcon(opt.value),
      description: meta?.description || '',
      sortOrder: meta?.sort_order ?? getAreaDefaultOrder(opt.value),
      isBuiltin: opt.isBuiltin,
    }
  })
  rows.sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
  return rows
}

function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  const Current = ICON_MAP[value] ?? Circle
  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg border border-border/50"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select icon"
      >
        <Current className="h-4 w-4" />
      </Button>
      {open ? (
        <div className="absolute left-0 top-9 z-20 grid w-44 grid-cols-5 gap-1 rounded-xl border border-border/50 bg-background p-2 shadow-md">
          {ICON_OPTIONS.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                onChange(name)
                setOpen(false)
              }}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                value === name
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/40',
              )}
              aria-label={name}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface AreaManageDialogProps {
  dict: Dict
  areaMeta: AreaMeta[]
  usedCategories: string[]
  trigger: ReactNode
}

export function AreaManageDialog({ dict, areaMeta, usedCategories, trigger }: AreaManageDialogProps) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<AreaRow[]>(() => buildRows(areaMeta, usedCategories, dict))
  const [errorText, setErrorText] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [isSaving, startSave] = useTransition()

  // revalidate 后同步外部数据
  useEffect(() => {
    if (open) setRows(buildRows(areaMeta, usedCategories, dict))
  }, [areaMeta, usedCategories, dict, open])

  function persist(row: AreaRow) {
    setErrorText(null)
    startSave(() => {
      void (async () => {
        try {
          const fd = new FormData()
          fd.set('category_key', row.categoryKey)
          fd.set('sort_order', String(row.sortOrder))
          fd.set('icon', row.icon)
          fd.set('description', row.description)
          await upsertAreaMeta(fd)
        } catch {
          setErrorText(dict.common.errors.operation_failed)
        }
      })()
    })
  }

  function updateRow(categoryKey: string, patch: Partial<AreaRow>) {
    setRows((prev) => prev.map((r) => (r.categoryKey === categoryKey ? { ...r, ...patch } : r)))
  }

  function handleReorder(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= rows.length) return
    const next = [...rows]
    const a = next[index]
    const b = next[target]
    next[index] = { ...a, sortOrder: b.sortOrder }
    next[target] = { ...b, sortOrder: a.sortOrder }
    setRows(next)
    setErrorText(null)
    startSave(() => {
      void (async () => {
        try {
          for (const r of [next[index], next[target]]) {
            const fd = new FormData()
            fd.set('category_key', r.categoryKey)
            fd.set('sort_order', String(r.sortOrder))
            fd.set('icon', r.icon)
            fd.set('description', r.description)
            await upsertAreaMeta(fd)
          }
        } catch {
          setErrorText(dict.common.errors.operation_failed)
        }
      })()
    })
  }

  async function handleRename(row: AreaRow, newLabel: string) {
    const trimmed = newLabel.trim()
    if (!trimmed || trimmed === row.label || row.isBuiltin) return
    setErrorText(null)
    const snapshot = rows
    const newKey = trimmed
    updateRow(row.categoryKey, { categoryKey: newKey, label: newKey })
    try {
      await replaceGoalCategory({ from: row.categoryKey, to: newKey })
      const fd = new FormData()
      fd.set('category_key', newKey)
      fd.set('sort_order', String(row.sortOrder))
      fd.set('icon', row.icon)
      fd.set('description', row.description)
      await upsertAreaMeta(fd)
      const oldFd = new FormData()
      oldFd.set('category_key', row.categoryKey)
      await deleteAreaMetaRow(oldFd)
    } catch {
      setRows(snapshot)
      setErrorText(dict.common.errors.operation_failed)
    }
  }

  async function handleDelete(row: AreaRow) {
    setErrorText(null)
    const snapshot = rows
    setRows((prev) => prev.filter((r) => r.categoryKey !== row.categoryKey))
    setPendingDelete(null)
    try {
      const fd = new FormData()
      fd.set('category_key', row.categoryKey)
      await deleteAreaMeta(fd)
    } catch {
      setRows(snapshot)
      setErrorText(dict.common.errors.operation_failed)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{dict.goals.areas.title}</DialogTitle>
          <DialogDescription>{dict.goals.areas.description}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {rows.map((row, index) => (
            <div
              key={row.categoryKey}
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 p-2"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground/70 hover:text-foreground disabled:opacity-30"
                  onClick={() => handleReorder(index, -1)}
                  disabled={index === 0 || isSaving}
                  aria-label={dict.goals.areas.moveUp}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground/70 hover:text-foreground disabled:opacity-30"
                  onClick={() => handleReorder(index, 1)}
                  disabled={index === rows.length - 1 || isSaving}
                  aria-label={dict.goals.areas.moveDown}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <IconPicker value={row.icon} onChange={(name) => { updateRow(row.categoryKey, { icon: name }); persist({ ...row, icon: name }) }} />

              <div className="min-w-0 flex-1 space-y-1">
                {row.isBuiltin ? (
                  <div className="truncate text-sm font-medium text-foreground">{row.label}</div>
                ) : (
                  <Input
                    className="h-8 text-sm"
                    defaultValue={row.label}
                    placeholder={dict.goals.areas.renamePlaceholder}
                    disabled={isSaving}
                    onBlur={(event) => void handleRename(row, event.target.value)}
                  />
                )}
                <Input
                  className="h-8 text-xs"
                  defaultValue={row.description}
                  placeholder={dict.goals.areas.descriptionPlaceholder}
                  disabled={isSaving}
                  onBlur={(event) => {
                    if (event.target.value !== row.description) {
                      updateRow(row.categoryKey, { description: event.target.value })
                      persist({ ...row, description: event.target.value })
                    }
                  }}
                />
              </div>

              <div className="flex shrink-0 items-center">
                {pendingDelete === row.categoryKey ? (
                  <div className="flex items-center gap-1">
                    <span className="max-w-[120px] truncate text-[11px] text-muted-foreground">
                      {dict.goals.areas.deleteConfirm}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-7"
                      onClick={() => void handleDelete(row)}
                    >
                      {dict.goals.areas.confirm}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => setPendingDelete(null)}
                    >
                      {dict.goals.areas.cancel}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setPendingDelete(row.categoryKey)}
                    aria-label={dict.goals.areas.delete}
                    title={dict.goals.areas.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {errorText ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorText}
          </div>
        ) : null}

        <div className="flex items-center justify-end pt-1">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
