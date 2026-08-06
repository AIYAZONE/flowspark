'use client'

import { useMemo } from 'react'
import { FolderTree, FileText, PenLine, StickyNote, BarChart3, Target, Wrench, Lightbulb } from 'lucide-react'
import type { ContentFolder, ContentAsset, ContentAssetKind } from '@/lib/contentAsset'

const KIND_ICON: Record<ContentAssetKind, typeof FileText> = {
  idea: Lightbulb,
  script: PenLine,
  note: StickyNote,
  data: BarChart3,
  strategy: Target,
  tool: Wrench,
  other: FileText,
}

type Props = {
  folders: ContentFolder[]
  assets: ContentAsset[]
}

// 把扁平 folder 列表按物化路径构建为树，再把 assets 挂到对应节点下。
export function BrandAssetsTree({ folders, assets }: Props) {
  const tree = useMemo(() => buildTree(folders, assets), [folders, assets])

  if (folders.length === 0 && assets.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
        <FolderTree className="mb-2 h-4 w-4" />
        还没有内容资产。在聊天中讨论选题、脚本、战略时，AI 会自动把它们沉淀到对应目录。
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <FolderTree className="h-3.5 w-3.5" />
        内容资产库（AI 自动归类）
      </div>
      <div className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
        {tree.map((node) => (
          <TreeNode key={node.folder.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}

type TreeNodeData = {
  folder: ContentFolder
  children: TreeNodeData[]
  assets: ContentAsset[]
}

function buildTree(folders: ContentFolder[], assets: ContentAsset[]): TreeNodeData[] {
  const byId = new Map<string, TreeNodeData>()
  folders.forEach((f) => byId.set(f.id, { folder: f, children: [], assets: [] }))
  const roots: TreeNodeData[] = []

  folders.forEach((f) => {
    const node = byId.get(f.id)!
    if (f.parent_id && byId.has(f.parent_id)) {
      byId.get(f.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  assets.forEach((a) => {
    if (a.folder_id && byId.has(a.folder_id)) {
      byId.get(a.folder_id)!.assets.push(a)
    } else {
      // 未归类资产归入虚拟根
      roots.push({ folder: { id: a.id, user_id: a.user_id, parent_id: null, name: a.title, sort_order: 0, path: '', created_at: a.created_at, updated_at: a.updated_at } as ContentFolder, children: [], assets: [a] })
    }
  })

  return roots
}

function TreeNode({ node, depth }: { node: TreeNodeData; depth: number }) {
  return (
    <div>
      <div
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] text-foreground"
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        <FolderTree className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{node.folder.name}</span>
        {node.assets.length > 0 && (
          <span className="ml-auto text-[11px] text-muted-foreground">{node.assets.length}</span>
        )}
      </div>
      {node.assets.map((asset) => {
        const Icon = KIND_ICON[asset.kind] ?? FileText
        return (
          <div
            key={asset.id}
            className="flex items-start gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] text-muted-foreground"
            style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}
          >
            <Icon className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="truncate">{asset.title}</span>
          </div>
        )
      })}
      {node.children.map((child) => (
        <TreeNode key={child.folder.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}
