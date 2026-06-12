'use client'

import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react'
import { Bold, Eraser, Italic, List, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichTextToolbar, RichTextToolbarButton } from '@/components/RichTextToolbar'

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function toEditableHtml(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed)
  if (looksLikeHtml) return value

  return trimmed
    .split(/\n{2,}/g)
    .map((block) => `<p>${escapeHtml(block).replaceAll('\n', '<br/>')}</p>`)
    .join('')
}

type BasicRichTextEditorProps = {
  id: string
  name: string
  value: string
  onChange: (next: string) => void
  placeholder: string
  className?: string
  minHeightClassName?: string
}

export const BasicRichTextEditor = forwardRef<HTMLDivElement, BasicRichTextEditorProps>(function BasicRichTextEditor(
  { id, name, value, onChange, placeholder, className, minHeightClassName },
  forwardedRef
) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)
  const isComposingRef = useRef(false)
  const isInternalSyncRef = useRef(false)
  const normalizedValue = useMemo(() => toEditableHtml(value), [value])
  const handleEditorRef = useCallback(
    (node: HTMLDivElement | null) => {
      editorRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
        return
      }
      if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef]
  )

  const syncValue = useCallback(
    (next: string) => {
      isInternalSyncRef.current = true
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = next
      }
      onChange(next)
    },
    [onChange]
  )

  useEffect(() => {
    if (isInternalSyncRef.current) {
      isInternalSyncRef.current = false
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = value
      }
      return
    }

    const editor = editorRef.current
    if (!editor) {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = normalizedValue
      }
      return
    }

    if (isComposingRef.current) return

    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue
    }
  }, [normalizedValue, value])

  const applyCommand = (command: string) => {
    const editor = editorRef.current
    if (!editor || typeof document === 'undefined') return

    editor.focus()
    document.execCommand(command, false)
    syncValue(editor.innerHTML)
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <input ref={hiddenInputRef} type="hidden" name={name} defaultValue={normalizedValue} />

      <RichTextToolbar
        left={
          <>
            <RichTextToolbarButton type="button" aria-label="Bold" onClick={() => applyCommand('bold')}>
              <Bold className="h-4 w-4" />
            </RichTextToolbarButton>
            <RichTextToolbarButton type="button" aria-label="Italic" onClick={() => applyCommand('italic')}>
              <Italic className="h-4 w-4" />
            </RichTextToolbarButton>
            <RichTextToolbarButton type="button" aria-label="Bullet list" onClick={() => applyCommand('insertUnorderedList')}>
              <List className="h-4 w-4" />
            </RichTextToolbarButton>
            <RichTextToolbarButton type="button" aria-label="Numbered list" onClick={() => applyCommand('insertOrderedList')}>
              <ListOrdered className="h-4 w-4" />
            </RichTextToolbarButton>
            <RichTextToolbarButton type="button" aria-label="Clear formatting" onClick={() => applyCommand('removeFormat')}>
              <Eraser className="h-4 w-4" />
            </RichTextToolbarButton>
          </>
        }
      />

      <div
        ref={handleEditorRef}
        id={id}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          'rounded-xl border border-input bg-background px-3 py-3 text-sm leading-7 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground',
          'prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-img:my-3 prose-img:max-w-full prose-img:rounded-md prose-img:border prose-img:border-border/40',
          '[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0',
          minHeightClassName || 'min-h-[140px]'
        )}
        data-placeholder={placeholder}
        onInput={(event) => {
          if (isComposingRef.current) return
          syncValue((event.currentTarget as HTMLDivElement).innerHTML)
        }}
        onCompositionStart={() => {
          isComposingRef.current = true
        }}
        onCompositionEnd={(event) => {
          isComposingRef.current = false
          syncValue((event.currentTarget as HTMLDivElement).innerHTML)
        }}
        onBlur={(event) => {
          const editor = event.currentTarget
          if (editor.textContent?.trim()) {
            syncValue(editor.innerHTML)
            return
          }
          editor.innerHTML = ''
          syncValue('')
        }}
      />
    </div>
  )
})
