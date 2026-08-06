'use client'

import { useRef, useState } from 'react'
import { Sparkles, Target, Flag, ListChecks, CornerDownRight, Save, Loader2, Upload, Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

export interface BlueprintPositioning {
  persona?: string
  oneLiner?: string
  threePieces?: { who?: string; forWhom?: string; solves?: string }
  audience?: string
}

export interface BlueprintPillar {
  id?: string
  title: string
  rationale?: string | null
}

export interface BlueprintKR {
  id?: string
  title: string
  target?: string | null
  current?: string | null
}

export interface BlueprintMilestone {
  id?: string
  title: string
  target_date?: string | null
  key_results: BlueprintKR[]
  status?: 'pending' | 'active' | 'completed' | null
  started_at?: string | null
  completed_at?: string | null
}

export interface GoalBlueprintData {
  positioning: BlueprintPositioning | null
  pillars: BlueprintPillar[]
  milestones: BlueprintMilestone[]
}

export function GoalBlueprint({
  goalId,
  goalTitle,
  goalDescription,
  initial,
}: {
  goalId: string
  goalTitle: string
  goalDescription?: string | null
  initial: GoalBlueprintData
}) {
  const [data, setData] = useState<GoalBlueprintData>(initial)
  const [planning, setPlanning] = useState(false)
  const [planningOpen, setPlanningOpen] = useState(false)
  const [conversation, setConversation] = useState('')
  const [committed, setCommitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // 落成后的就地编辑状态：记录正在编辑的节点 key（如 'pillar:xxx' / 'milestone:yyy' / 'kr:zzz'）
  const [editing, setEditing] = useState<string | null>(null)
  const [savingNode, setSavingNode] = useState(false)

  type NodeOp =
    | { op: 'update'; node: 'pillar'; id: string; title?: string; rationale?: string }
    | { op: 'create'; node: 'pillar'; goalId: string; title: string; rationale?: string }
    | { op: 'delete'; node: 'pillar'; id: string }
    | { op: 'update'; node: 'milestone'; id: string; title?: string; target_date?: string }
    | { op: 'create'; node: 'milestone'; goalId: string; title: string; target_date?: string }
    | { op: 'delete'; node: 'milestone'; id: string }
    | { op: 'update'; node: 'key_result'; id: string; title?: string; target?: string }
    | { op: 'create'; node: 'key_result'; milestoneId: string; title: string; target?: string }
    | { op: 'delete'; node: 'key_result'; id: string }

  async function mutateNode(op: NodeOp): Promise<{ ok: boolean; id?: string }> {
    setSavingNode(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/path-plan/node', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(op),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || '操作失败')
        return { ok: false }
      }
      return { ok: true, id: json.id }
    } catch {
      setError('操作失败')
      return { ok: false }
    } finally {
      setSavingNode(false)
    }
  }

  const hasBlueprint =
    !!data.positioning?.persona || data.pillars.length > 0 || data.milestones.length > 0

  async function runPlanning() {
    setPlanning(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/path-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locale: 'zh',
          goalId,
          goalTitle,
          goalDescription,
          conversation: conversation
            .split('\n')
            .map((l) => ({ role: 'user' as const, content: l }))
            .filter((m) => m.content.trim()),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.plan) {
        setError(json.error || '生成失败')
        return
      }
      // 预览方案
      setData({
        positioning: json.plan.positioning,
        pillars: json.plan.pillars,
        milestones: json.plan.milestones,
      })
      setCommitted(false)
    } finally {
      setPlanning(false)
    }
  }

  async function commitPlan() {
    setError(null)
    try {
      const res = await fetch('/api/ai/path-plan/commit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ goalId, plan: data }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || '落写失败')
        return
      }
      setCommitted(true)
    } catch {
      setError('落写失败')
    }
  }

  async function handleImportFile(file: File) {
    const text = await file.text()
    setImportText((prev) => (prev ? `${prev}\n\n${text}` : text))
  }

  async function runImport() {
    const docText = importText.trim()
    if (!docText) return
    setImporting(true)
    setError(null)
    setImportMsg(null)
    try {
      const res = await fetch('/api/ai/import/path', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: 'zh', goalId, docText }),
      })
      const json = await res.json()
      if (!res.ok || !json.plan) {
        throw new Error(json.error || '解析失败')
      }
      setData({
        positioning: json.plan.positioning,
        pillars: json.plan.pillars,
        milestones: json.plan.milestones,
      })
      setCommitted(false)
      setImportOpen(false)
      setImportText('')
    } catch (e) {
      setImportMsg({ type: 'err', text: e instanceof Error ? e.message : '解析失败' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">路径蓝图</h2>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={planningOpen} onOpenChange={setPlanningOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Sparkles className="mr-1.5 h-4 w-4" /> AI 规划
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>以人生规划师身份规划这条路径</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  告诉系统你的想法或卡点（一行一条），它会以该领域专家身份生成定位与打法，并补全你的人设记忆。
                </p>
                <Textarea
                  value={conversation}
                  onChange={(e) => setConversation(e.target.value)}
                  rows={5}
                  placeholder={'例如：\n想做视频号个人IP但不知道怎么做\n我不太爱出镜\n之前做过线下读书会'}
                />
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPlanningOpen(false)}>
                  取消
                </Button>
                <Button onClick={runPlanning} disabled={planning}>
                  {planning ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  生成方案
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Upload className="mr-1.5 h-4 w-4" /> 导入已有规划
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>吸收你已有的规划</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                粘贴 / 上传你在其他 AI 工具或文档里做过的规划。系统会把它解析成 5 层路径结构，尽量忠实还原，不从头重做。
              </p>
              <div className="space-y-1.5">
                <Label>规划内容</Label>
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={8}
                  placeholder="粘贴文本，或点击下方按钮上传 .txt / .md 文件…"
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
                  取消
                </Button>
                <Button onClick={runImport} disabled={importing || !importText.trim()}>
                  {importing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  解析并预览
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {hasBlueprint && !committed ? (
            <Button size="sm" onClick={commitPlan}>
              <Save className="mr-1.5 h-4 w-4" /> 落成路径
            </Button>
          ) : null}
          {committed ? (
            <span className="text-xs font-medium text-primary">已落成 ✓</span>
          ) : null}
        </div>
      </div>

      {!hasBlueprint ? (
        <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          这条路径还没有蓝图。点「AI 规划」，让人生系统以专家身份帮你做定位、拆策略、排里程碑。
        </p>
      ) : (
        <div className="space-y-5">
          {data.positioning?.persona ? (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Target className="h-4 w-4 text-primary" /> 定位卡
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-sm">
                <p className="font-semibold text-foreground">{data.positioning.persona}</p>
                {data.positioning.oneLiner ? (
                  <p className="mt-1 text-muted-foreground">{data.positioning.oneLiner}</p>
                ) : null}
                {data.positioning.threePieces ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div>
                      <div className="text-xs text-muted-foreground">你是谁</div>
                      <div className="text-foreground">{data.positioning.threePieces.who}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">为谁</div>
                      <div className="text-foreground">{data.positioning.threePieces.forWhom}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">解决什么</div>
                      <div className="text-foreground">{data.positioning.threePieces.solves}</div>
                    </div>
                  </div>
                ) : null}
                {data.positioning.audience ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    受众：{data.positioning.audience}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {data.pillars.length > 0 ? (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Flag className="h-4 w-4 text-primary" /> 策略支柱
                </div>
                {committed ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    disabled={savingNode}
                    onClick={async () => {
                      const { ok, id } = await mutateNode({
                        op: 'create',
                        node: 'pillar',
                        goalId,
                        title: '新支柱',
                      })
                      if (ok && id) {
                        setData((d) => ({
                          ...d,
                          pillars: [...d.pillars, { id, title: '新支柱', rationale: null }],
                        }))
                        setEditing(`pillar:${id}`)
                      }
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> 新增
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.pillars.map((p, i) => {
                  const key = p.id ?? `p-${i}`
                  const isEditing = editing === `pillar:${key}`
                  return (
                    <div
                      key={key}
                      className="group rounded-xl border border-border/50 bg-muted/20 p-3"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            defaultValue={p.title}
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            }}
                            onBlur={async (e) => {
                              const title = e.target.value.trim() || p.title
                              const id = p.id
                              if (id) {
                                const { ok } = await mutateNode({
                                  op: 'update',
                                  node: 'pillar',
                                  id,
                                  title,
                                })
                                if (ok)
                                  setData((d) => ({
                                    ...d,
                                    pillars: d.pillars.map((x) =>
                                      x.id === id ? { ...x, title } : x,
                                    ),
                                  }))
                              } else {
                                setData((d) => ({
                                  ...d,
                                  pillars: d.pillars.map((x, xi) =>
                                    xi === i ? { ...x, title } : x,
                                  ),
                                }))
                              }
                              setEditing(null)
                            }}
                            autoFocus
                          />
                          <Textarea
                            defaultValue={p.rationale ?? ''}
                            rows={2}
                            className="text-xs"
                            placeholder="为什么（可选）"
                            onBlur={async (e) => {
                              const rationale = e.target.value.trim() || null
                              const id = p.id
                              if (id) {
                                const { ok } = await mutateNode({
                                  op: 'update',
                                  node: 'pillar',
                                  id,
                                  rationale: rationale ?? undefined,
                                })
                                if (ok)
                                  setData((d) => ({
                                    ...d,
                                    pillars: d.pillars.map((x) =>
                                      x.id === id ? { ...x, rationale } : x,
                                    ),
                                  }))
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground">{p.title}</p>
                          {p.rationale ? (
                            <p className="mt-1 text-xs text-muted-foreground">{p.rationale}</p>
                          ) : null}
                          {committed ? (
                            <div className="mt-2 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-primary"
                                onClick={() => setEditing(`pillar:${key}`)}
                              >
                                <Pencil className="mr-1 inline h-3 w-3" /> 编辑
                              </button>
                              <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-destructive"
                                onClick={async () => {
                                  if (!p.id) return
                                  const { ok } = await mutateNode({
                                    op: 'delete',
                                    node: 'pillar',
                                    id: p.id,
                                  })
                                  if (ok)
                                    setData((d) => ({
                                      ...d,
                                      pillars: d.pillars.filter((x) => x.id !== p.id),
                                    }))
                                }}
                              >
                                <Trash2 className="mr-1 inline h-3 w-3" /> 删除
                              </button>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          {data.milestones.length > 0 ? (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ListChecks className="h-4 w-4 text-primary" /> 里程碑 / 关键结果
                </div>
                {committed ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    disabled={savingNode}
                    onClick={async () => {
                      const { ok, id } = await mutateNode({
                        op: 'create',
                        node: 'milestone',
                        goalId,
                        title: '新里程碑',
                      })
                      if (ok && id) {
                        setData((d) => ({
                          ...d,
                          milestones: [
                            ...d.milestones,
                            { id, title: '新里程碑', key_results: [], status: 'pending' },
                          ],
                        }))
                        setEditing(`milestone:${id}`)
                      }
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> 新增
                  </Button>
                ) : null}
              </div>
              <ol className="space-y-3">
                {data.milestones.map((m, i) => {
                  const isActive = m.status === 'active'
                  const isCompleted = m.status === 'completed'
                  const mKey = m.id ?? `m-${i}`
                  const mEditing = editing === `milestone:${mKey}`
                  return (
                    <li
                      key={mKey}
                      className={
                        isActive
                          ? 'group rounded-xl border border-primary/30 bg-primary/5 p-3'
                          : isCompleted
                            ? 'group rounded-xl border border-border/50 bg-muted/15 p-3 opacity-70'
                            : 'group rounded-xl border border-border/50 bg-muted/20 p-3'
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            isCompleted
                              ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-600'
                              : isActive
                                ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary'
                                : 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary'
                          }
                        >
                          {isCompleted ? '✓' : i + 1}
                        </span>
                        {mEditing ? (
                          <Input
                            defaultValue={m.title}
                            className="h-8 flex-1 text-sm"
                            onBlur={async (e) => {
                              const title = e.target.value.trim() || m.title
                              const id = m.id
                              if (id) {
                                const { ok } = await mutateNode({
                                  op: 'update',
                                  node: 'milestone',
                                  id,
                                  title,
                                })
                                if (ok)
                                  setData((d) => ({
                                    ...d,
                                    milestones: d.milestones.map((x) =>
                                      x.id === id ? { ...x, title } : x,
                                    ),
                                  }))
                              }
                              setEditing(null)
                            }}
                            autoFocus
                          />
                        ) : (
                          <p
                            className={
                              isCompleted
                                ? 'text-sm font-medium text-muted-foreground line-through'
                                : 'text-sm font-medium text-foreground'
                            }
                          >
                            {m.title}
                          </p>
                        )}
                        {isActive ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            进行中
                          </span>
                        ) : isCompleted ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                            已完成
                          </span>
                        ) : null}
                        {m.target_date && !mEditing ? (
                          <span className="text-xs text-muted-foreground">· {m.target_date}</span>
                        ) : null}
                        {committed && !mEditing ? (
                          <div className="ml-auto flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-primary"
                              onClick={() => setEditing(`milestone:${mKey}`)}
                            >
                              <Pencil className="mr-1 inline h-3 w-3" /> 编辑
                            </button>
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-destructive"
                              onClick={async () => {
                                if (!m.id) return
                                const { ok } = await mutateNode({
                                  op: 'delete',
                                  node: 'milestone',
                                  id: m.id,
                                })
                                if (ok)
                                  setData((d) => ({
                                    ...d,
                                    milestones: d.milestones.filter((x) => x.id !== m.id),
                                  }))
                              }}
                            >
                              <Trash2 className="mr-1 inline h-3 w-3" /> 删除
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {m.key_results.length > 0 ? (
                        <ul className="mt-2 space-y-1.5 pl-7">
                          {m.key_results.map((kr, j) => {
                            const krKey = kr.id ?? `kr-${mKey}-${j}`
                            const krEditing = editing === `kr:${krKey}`
                            return (
                              <li
                                key={krKey}
                                className="group/kr flex items-start gap-1.5 text-xs text-muted-foreground"
                              >
                                <CornerDownRight className="mt-0.5 h-3 w-3 shrink-0 text-border" />
                                {krEditing ? (
                                  <Input
                                    defaultValue={kr.title}
                                    className="h-7 flex-1 text-xs"
                                    onBlur={async (e) => {
                                      const title = e.target.value.trim() || kr.title
                                      const id = kr.id
                                      if (id) {
                                        const { ok } = await mutateNode({
                                          op: 'update',
                                          node: 'key_result',
                                          id,
                                          title,
                                        })
                                        if (ok)
                                          setData((d) => ({
                                            ...d,
                                            milestones: d.milestones.map((x) =>
                                              x.id === m.id
                                                ? {
                                                    ...x,
                                                    key_results: x.key_results.map((k) =>
                                                      k.id === id ? { ...k, title } : k,
                                                    ),
                                                  }
                                                : x,
                                            ),
                                          }))
                                      }
                                      setEditing(null)
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <span className="flex-1">
                                    {kr.title}
                                    {kr.target ? (
                                      <span className="text-foreground"> → {kr.target}</span>
                                    ) : null}
                                  </span>
                                )}
                                {committed && !krEditing ? (
                                  <span className="flex gap-2 opacity-0 transition-opacity group-hover/kr:opacity-100">
                                    <button
                                      type="button"
                                      className="hover:text-primary"
                                      onClick={() => setEditing(`kr:${krKey}`)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      className="hover:text-destructive"
                                      onClick={async () => {
                                        if (!kr.id) return
                                        const { ok } = await mutateNode({
                                          op: 'delete',
                                          node: 'key_result',
                                          id: kr.id,
                                        })
                                        if (ok)
                                          setData((d) => ({
                                            ...d,
                                            milestones: d.milestones.map((x) =>
                                              x.id === m.id
                                                ? {
                                                    ...x,
                                                    key_results: x.key_results.filter(
                                                      (k) => k.id !== kr.id,
                                                    ),
                                                  }
                                                : x,
                                            ),
                                          }))
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </span>
                                ) : null}
                              </li>
                            )
                          })}
                        </ul>
                      ) : null}
                      {committed ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-6 px-2 text-xs text-muted-foreground"
                          disabled={savingNode}
                          onClick={async () => {
                            if (!m.id) return
                            const { ok, id } = await mutateNode({
                              op: 'create',
                              node: 'key_result',
                              milestoneId: m.id,
                              title: '新关键结果',
                            })
                            if (ok && id) {
                              setData((d) => ({
                                ...d,
                                milestones: d.milestones.map((x) =>
                                  x.id === m.id
                                    ? {
                                        ...x,
                                        key_results: [
                                          ...x.key_results,
                                          { id, title: '新关键结果', target: null, current: '0' },
                                        ],
                                      }
                                    : x,
                                ),
                              }))
                              setEditing(`kr:${id}`)
                            }
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" /> 加关键结果
                        </Button>
                      ) : null}
                    </li>
                  )
                })}
              </ol>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
