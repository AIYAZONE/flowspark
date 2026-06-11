'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const IMAGE_MIN_WIDTH = 96
const IMAGE_RESIZE_HANDLES = ['nw', 'ne', 'sw', 'se'] as const

type ImageResizeHandle = (typeof IMAGE_RESIZE_HANDLES)[number]

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
  const { userId, value, onChange, attachments, onAttachmentsChange, onUploadingChange, dict } = props
  const supabase = createClient()
  const editorRef = useRef<HTMLDivElement | null>(null)
  const descriptionInputRef = useRef<HTMLInputElement | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const isComposingRef = useRef(false)
  const isInternalSyncRef = useRef(false)
  const selectedImageRef = useRef<HTMLImageElement | null>(null)
  const resizeStateRef = useRef<{
    handle: ImageResizeHandle
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    aspectRatio: number
  } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hiddenValue, setHiddenValue] = useState(() => toEditableHtml(value))
  const [selectedImageRect, setSelectedImageRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  const helperText = useMemo(() => {
    return (
      dict.goals.new.richtextPasteHint || '直接粘贴截图或拖入图片（PNG/JPG/WebP，最大 5MB）'
    )
  }, [dict.goals.new.richtextPasteHint])

  const syncEditorValue = useCallback((html: string) => {
    isInternalSyncRef.current = true
    setHiddenValue(html)
    if (descriptionInputRef.current) descriptionInputRef.current.value = html
    onChange(html)
  }, [onChange])

  useEffect(() => {
    if (isInternalSyncRef.current) {
      isInternalSyncRef.current = false
      setHiddenValue(value)
      return
    }
    const next = toEditableHtml(value)
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
  }, [value])

  useEffect(() => {
    if (descriptionInputRef.current) descriptionInputRef.current.value = hiddenValue
  }, [hiddenValue])

  useEffect(() => {
    if (attachmentInputRef.current) attachmentInputRef.current.value = JSON.stringify(props.attachments)
  }, [props.attachments])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const state = resizeStateRef.current
      const editor = editorRef.current
      const image = selectedImageRef.current
      if (!state || !editor || !image) return

      event.preventDefault()
      const editorWidth = editor.clientWidth - 24
      const deltaX = event.clientX - state.startX
      const widthDelta = state.handle === 'ne' || state.handle === 'se' ? deltaX : -deltaX
      const nextWidth = Math.min(
        Math.max(IMAGE_MIN_WIDTH, state.startWidth + widthDelta),
        Math.max(IMAGE_MIN_WIDTH, editorWidth)
      )

      image.style.width = `${nextWidth}px`
      image.style.maxWidth = '100%'
      image.style.height = 'auto'
      updateSelectedImageRect(image)
    }

    const handlePointerUp = () => {
      if (!resizeStateRef.current || !editorRef.current) return
      resizeStateRef.current = null
      syncEditorValue(editorRef.current.innerHTML)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [syncEditorValue])

  const setUploading = (next: boolean) => {
    setIsUploading(next)
    onUploadingChange(next)
  }

  const clearImageSelection = () => {
    if (selectedImageRef.current) {
      selectedImageRef.current.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background')
    }
    selectedImageRef.current = null
    setSelectedImageRect(null)
  }

  const updateSelectedImageRect = (image: HTMLImageElement) => {
    const editorRect = editorRef.current?.getBoundingClientRect()
    const imageRect = image.getBoundingClientRect()
    if (!editorRect) return
    setSelectedImageRect({
      left: imageRect.left - editorRect.left,
      top: imageRect.top - editorRect.top,
      width: imageRect.width,
      height: imageRect.height,
    })
  }

  const selectImage = (image: HTMLImageElement) => {
    if (selectedImageRef.current === image) {
      updateSelectedImageRect(image)
      return
    }

    clearImageSelection()
    image.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background')
    image.style.maxWidth = '100%'
    image.style.height = 'auto'
    selectedImageRef.current = image
    updateSelectedImageRect(image)
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
    selectImage(img)
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
    const path = `${userId}/${new Date().toISOString().slice(0, 10)}/${makeId()}.${ext}`

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
    onAttachmentsChange([...attachments, attachment])
    insertImageIntoEditor(attachment.public_url, file.name)
  }

  const resolveErrorText = (err: unknown) => {
    const key = err instanceof Error ? err.message : 'image_upload_failed'
    return dict.common.errors[key] || dict.goals.new[key] || dict.common.errors.operation_failed || '上传失败'
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

  const getResizeHandlePosition = (handle: ImageResizeHandle, rect: NonNullable<typeof selectedImageRect>) => {
    const halfSize = 8
    const horizontal = handle.endsWith('e') ? rect.left + rect.width - halfSize : rect.left - halfSize
    const vertical = handle.startsWith('s') ? rect.top + rect.height - halfSize : rect.top - halfSize
    return { left: horizontal, top: vertical }
  }

  const getResizeCursor = (handle: ImageResizeHandle) => {
    return handle === 'nw' || handle === 'se' ? 'cursor-nwse-resize' : 'cursor-nesw-resize'
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="description">{dict.today.descriptionLabel}</Label>
      <input ref={descriptionInputRef} type="hidden" name="description" defaultValue={hiddenValue} />
      <div className="relative">
        <div
          ref={editorRef}
          id="description"
          contentEditable
          suppressContentEditableWarning
          className="min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground [&_img]:my-3 [&_img]:block [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-border/40"
          data-placeholder={dict.today.descriptionPlaceholder}
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
          onClick={(e) => {
            const target = e.target
            if (target instanceof HTMLImageElement) {
              e.preventDefault()
              selectImage(target)
              return
            }
            clearImageSelection()
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

        {selectedImageRect ? (
          <>
            {IMAGE_RESIZE_HANDLES.map((handle) => {
              const position = getResizeHandlePosition(handle, selectedImageRect)
              return (
                <button
                  key={handle}
                  type="button"
                  aria-label={`Resize image from ${handle}`}
                  className={cn(
                    'absolute h-4 w-4 rounded-full border border-primary bg-background shadow-sm',
                    'touch-none',
                    getResizeCursor(handle)
                  )}
                  style={position}
                  onPointerDown={(event) => {
                    const image = selectedImageRef.current
                    if (!image) return
                    event.preventDefault()
                    event.stopPropagation()
                    const imageRect = image.getBoundingClientRect()
                    resizeStateRef.current = {
                      handle,
                      startX: event.clientX,
                      startY: event.clientY,
                      startWidth: imageRect.width,
                      startHeight: imageRect.height,
                      aspectRatio: imageRect.width / Math.max(1, imageRect.height),
                    }
                  }}
                />
              )
            })}
          </>
        ) : null}
      </div>
      <input ref={attachmentInputRef} type="hidden" name="attachment_manifest" defaultValue={JSON.stringify(props.attachments)} />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        <span>{helperText}</span>
      </div>
      {uploadError ? <div className="text-xs text-destructive">{uploadError}</div> : null}
    </div>
  )
}
