'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

function sanitizeRichText(input: string) {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\son\w+=\S+/gi, '')
    .replace(/javascript:/gi, '')
}

function normalizeImageStyles(html: string) {
  return html.replace(/<img([^>]*?)>/gi, (_full, attrs: string) => {
    const hasClass = /\sclass=/.test(attrs)
    const hasStyle = /\sstyle=/.test(attrs)
    const attrsWithClass = hasClass
      ? attrs.replace(/class=(['"])(.*?)\1/i, (_m: string, q: string, cls: string) => `class=${q}${cls} cursor-zoom-in block my-3${q}`)
      : `${attrs} class="cursor-zoom-in block my-3"`
    const attrsWithStyle = hasStyle
      ? attrsWithClass.replace(/style=(['"])(.*?)\1/i, (_m: string, q: string, style: string) => {
          const safeStyle = style
            .replace(/(?:^|;)\s*height\s*:\s*[^;]+/gi, '')
            .replace(/(?:^|;)\s*max-width\s*:\s*[^;]+/gi, '')
          const nextStyle = safeStyle.trim().replace(/;+\s*$/, '')
          const normalizedStyle = nextStyle ? `${nextStyle}; max-width: 100%; height: auto;` : 'max-width: 100%; height: auto;'
          return `style=${q}${normalizedStyle}${q}`
        })
      : `${attrsWithClass} style="max-width: 100%; height: auto;"`

    const attrsWithMarker = /data-richtext-image=/.test(attrsWithStyle)
      ? attrsWithStyle
      : `${attrsWithStyle} data-richtext-image="true"`

    return `<img${attrsWithMarker}>`
  })
}

export function RichTextContentView(props: {
  html: string
  compact?: boolean
  onImageClick?: (url: string) => void
}) {
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(props.html.trim())
  const safeHtml = useMemo(() => normalizeImageStyles(sanitizeRichText(props.html)), [props.html])

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none wrap-break-word',
        'prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0',
        'prose-img:block prose-img:my-3 prose-img:max-w-full prose-img:rounded-md prose-img:border prose-img:border-border/40',
        props.compact && 'max-h-24 overflow-hidden'
      )}
      onClick={(event) => {
        const target = event.target
        if (!(target instanceof HTMLImageElement)) return
        const imageUrl = target.getAttribute('src')
        if (!imageUrl || !props.onImageClick) return
        props.onImageClick(imageUrl)
      }}
    >
      {looksLikeHtml ? (
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {props.html}
        </ReactMarkdown>
      )}
    </div>
  )
}
