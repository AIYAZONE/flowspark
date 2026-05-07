'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export type ActionAttachmentDraft = {
  id: string
  file_path: string
  public_url: string
  mime_type: string
  size_bytes: number
}

type DictLite = {
  today: {
    descriptionLabel: string
    descriptionPlaceholder: string
  }
  common: {
    loading: string
    errors: Record<string, string>
  }
  goals: {
    new: Record<string, string>
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function escapeMarkdownAlt(name: string) {
  return name.replace(/[\[\]\(\)]/g, '').trim() || 'image'
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function markdownImageToHtml(text: string) {
  const imageRegexp = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g
  const escaped = escapeHtml(text)
  const withImages = escaped.replace(imageRegexp, (_full, alt, url) => {
    const safeAlt = escapeHtml(String(alt || 'image'))
    const safeUrl = String(url || '')
    return `<img src="${safeUrl}" alt="${safeAlt}" class="max-w-full rounded-md border border-border/40" />`
  })
  return withImages
    .split(/\n{2,}/g)
    .map((block) => `<p>${block.replaceAll('\n', '<br/>')}</p>`)
    .join('')
}

function toEditableHtml(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed)
  if (looksLikeHtml) return value
  return markdownImageToHtml(value)
}

export function ActionDescriptionEditor(props: {
  userId: string
  value: string
  onChange: (next: string) => void
  attachments: ActionAttachmentDraft[]
  onAttachmentsChange: (next: ActionAttachmentDraft[]) => void
  onUploadingChange: (uploading: boolean) => void
  dict: DictLite
}) {
  const supabase = createClient()
  const editorRef = useRef<HTMLDivElement | null>(null)
  const isComposingRef = useRef(false)
  const isInternalSyncRef = useRef(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hiddenValue, setHiddenValue] = useState(() => toEditableHtml(props.value))

  const helperText = useMemo(() => {
    return (
      props.dict.goals.new.richtextPasteHint || '直接粘贴截图或拖入图片（PNG/JPG/WebP，最大 5MB）'
    )
  }, [props.dict.goals.new.richtextPasteHint])

  useEffect(() => {
    if (isInternalSyncRef.current) {
      isInternalSyncRef.current = false
      setHiddenValue(props.value)
      return
    }
    const next = toEditableHtml(props.value)
    const editor = editorRef.current
    if (!editor) {
      setHiddenValue(next)
      return
    }
    if (isComposingRef.current) return
    if (editor.innerHTML !== next) {
      editor.innerHTML = next
    }
    setHiddenValue(next)
  }, [props.value])

  const setUploading = (next: boolean) => {
    setIsUploading(next)
    props.onUploadingChange(next)
  }

  const syncEditorValue = (html: string) => {
    isInternalSyncRef.current = true
    setHiddenValue(html)
    props.onChange(html)
  }

  const insertImageIntoEditor = (url: string, altText: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    const img = document.createElement('img')
    img.src = url
    img.alt = escapeMarkdownAlt(altText)
    img.className = 'max-w-full rounded-md border border-border/40'
    if (range && editor.contains(range.commonAncestorContainer)) {
      range.collapse(false)
      range.insertNode(img)
      range.setStartAfter(img)
      range.setEndAfter(img)
      selection?.removeAllRanges()
      selection?.addRange(range)
    } else {
      editor.appendChild(img)
    }
    syncEditorValue(editor.innerHTML)
  }

  const uploadImageFile = async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('image_too_large')
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('image_type_invalid')
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${props.userId}/${new Date().toISOString().slice(0, 10)}/${makeId()}.${ext}`

    const { error } = await supabase.storage.from('action-images').upload(path, file, {
      upsert: false,
      contentType: file.type,
    })
    if (error) throw error

    const { data } = supabase.storage.from('action-images').getPublicUrl(path)
    if (!data?.publicUrl) throw new Error('image_upload_failed')

    const attachment: ActionAttachmentDraft = {
      id: makeId(),
      file_path: path,
      public_url: data.publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
    }
    props.onAttachmentsChange([...props.attachments, attachment])
    insertImageIntoEditor(attachment.public_url, file.name)
  }

  const resolveErrorText = (err: unknown) => {
    const key = err instanceof Error ? err.message : 'image_upload_failed'
    return props.dict.common.errors[key] || props.dict.goals.new[key] || props.dict.common.errors.operation_failed || '上传失败'
  }

  const handleUpload = async (file: File) => {
    setUploadError(null)
    setUploading(true)
    try {
      await uploadImageFile(file)
    } catch (err) {
      setUploadError(resolveErrorText(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="description">{props.dict.today.descriptionLabel}</Label>
      <input type="hidden" name="description" value={hiddenValue} />
      <div
        ref={editorRef}
        id="description"
        contentEditable
        suppressContentEditableWarning
        className="min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
        data-placeholder={props.dict.today.descriptionPlaceholder}
        onInput={(e) => {
          if (isComposingRef.current) return
          const html = (e.currentTarget as HTMLDivElement).innerHTML
          syncEditorValue(html)
        }}
        onCompositionStart={() => {
          isComposingRef.current = true
        }}
        onCompositionEnd={(e) => {
          isComposingRef.current = false
          const html = (e.currentTarget as HTMLDivElement).innerHTML
          syncEditorValue(html)
        }}
        onPaste={(e) => {
          const file = Array.from(e.clipboardData.files || []).find((f) => f.type.startsWith('image/'))
          if (!file) return
          e.preventDefault()
          void handleUpload(file)
        }}
        onDrop={(e) => {
          const file = Array.from(e.dataTransfer.files || []).find((f) => f.type.startsWith('image/'))
          if (!file) return
          e.preventDefault()
          void handleUpload(file)
        }}
        onDragOver={(e) => {
          const hasImage = Array.from(e.dataTransfer.items || []).some((item) => item.type.startsWith('image/'))
          if (hasImage) {
            e.preventDefault()
          }
        }}
        onBlur={(e) => {
          const editor = e.currentTarget
          const hasImage = editor.querySelector('img') !== null
          if (!hasImage && editor.textContent?.trim() === '') {
            editor.innerHTML = ''
            syncEditorValue('')
          }
        }}
      />
      <input type="hidden" name="attachment_manifest" value={JSON.stringify(props.attachments)} />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        <span>{helperText}</span>
      </div>
      {uploadError ? <div className="text-xs text-destructive">{uploadError}</div> : null}
    </div>
  )
}
