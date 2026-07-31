'use client'

import { useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PERSONA_CATEGORY_LABELS,
  PERSONA_CONFIDENCE_LABELS,
  type UserPersona,
  type PersonaCategory,
  type PersonaConfidence,
} from '@/lib/persona-types'
import { savePersona, removePersona, refreshPersona } from '@/app/(authenticated)/persona/actions'

const CATEGORIES = Object.keys(PERSONA_CATEGORY_LABELS) as PersonaCategory[]
const CONFIDENCES = Object.keys(PERSONA_CONFIDENCE_LABELS) as PersonaConfidence[]

export function PersonaManager({ initialItems }: { initialItems: UserPersona[] }) {
  const [items, setItems] = useState<UserPersona[]>(initialItems)
  const [editing, setEditing] = useState<UserPersona | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const blank: UserPersona = {
    id: '',
    user_id: '',
    category: 'strength',
    title: '',
    detail: '',
    source: 'manual',
    confidence: 'medium',
    created_at: '',
    updated_at: '',
  }

  async function handleSave() {
    if (!editing || !editing.title.trim()) return
    setSaving(true)
    const res = await savePersona({
      id: editing.id || undefined,
      category: editing.category,
      title: editing.title.trim(),
      detail: editing.detail?.trim() || null,
      confidence: editing.confidence,
      source: 'manual',
    })
    setSaving(false)
    if (res.ok) {
      const { items: refreshed } = await refreshPersona()
      setItems(refreshed)
      setOpen(false)
      setEditing(null)
    }
  }

  async function handleDelete(id: string) {
    const res = await removePersona(id)
    if (res.ok) {
      const { items: refreshed } = await refreshPersona()
      setItems(refreshed)
    }
  }

  function openNew() {
    setEditing({ ...blank })
    setOpen(true)
  }
  function openEdit(item: UserPersona) {
    setEditing(item)
    setOpen(true)
  }

  async function handleImportFile(file: File) {
    const text = await file.text()
    setImportText((prev) => (prev ? `${prev}\n\n${text}` : text))
  }

  async function handleImport() {
    const docText = importText.trim()
    if (!docText) return
    setImporting(true)
    setImportMsg(null)
    try {
      const res = await fetch('/api/ai/import/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'import_failed')
      const { items: refreshed } = await refreshPersona()
      setItems(refreshed)
      setImportMsg({
        type: 'ok',
        text: data.saved > 0 ? `已导入 ${data.saved} 条个人记忆` : '未从文档中识别到新的个人记忆',
      })
      setImportText('')
    } catch (e) {
      setImportMsg({ type: 'err', text: e instanceof Error ? e.message : 'import_failed' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-2 h-4 w-4" /> 导入文档
        </Button>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> 新增记忆
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          还没有个人记忆。在对话里补充关于你自己的信息时，系统会自动沉淀到这里；也可以手动新增。
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {PERSONA_CATEGORY_LABELS[item.category]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {PERSONA_CONFIDENCE_LABELS[item.confidence]}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.detail ? (
                <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              ) : null}
              <div className="mt-2 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" /> 编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> 删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? '编辑个人记忆' : '新增个人记忆'}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>类别</Label>
                <Select
                  value={editing.category}
                  onValueChange={(v) => setEditing({ ...editing, category: v as PersonaCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {PERSONA_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>标签</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="如：擅长把复杂讲简单"
                />
              </div>
              <div className="space-y-1.5">
                <Label>说明</Label>
                <Textarea
                  value={editing.detail ?? ''}
                  onChange={(e) => setEditing({ ...editing, detail: e.target.value })}
                  placeholder="展开说明（可选）"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>置信度</Label>
                <Select
                  value={editing.confidence}
                  onValueChange={(v) => setEditing({ ...editing, confidence: v as PersonaConfidence })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIDENCES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {PERSONA_CONFIDENCE_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !editing?.title.trim()}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>导入已有规划 / 自我剖析</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            粘贴你在其他 AI 工具或文档里做过的自我剖析 / 人生规划。系统会抽取其中「关于你本人」的信息，沉淀为个人记忆（自动去重）。
          </p>
          <div className="space-y-1.5">
            <Label>资料内容</Label>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="粘贴文本，或点击下方按钮上传 .txt / .md 文件…"
              rows={8}
            />
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.markdown,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleImportFile(f)
                e.target.value = ''
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-3.5 w-3.5" /> 上传文件
            </Button>
          </div>
          {importMsg ? (
            <p
              className={
                importMsg.type === 'ok'
                  ? 'rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary'
                  : 'rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'
              }
            >
              {importMsg.text}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              关闭
            </Button>
            <Button onClick={handleImport} disabled={importing || !importText.trim()}>
              {importing ? '抽取中…' : '抽取并导入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
