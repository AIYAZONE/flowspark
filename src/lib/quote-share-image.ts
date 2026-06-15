import type { QuoteLocale } from '@/lib/daily-quote'

export type QuoteShareTemplate = 'calm' | 'spotlight' | 'dusk'

export type QuoteShareImageOutput = {
  width: number
  height: number
  type: 'image/png' | 'image/jpeg'
  quality?: number
}

export type QuoteShareImageParams = {
  quote: string
  dateISO: string
  name: string
  locale: QuoteLocale
  avatarUrl?: string | null
  avatarFallback: string
  template: QuoteShareTemplate
  output?: QuoteShareImageOutput
}

type RenderResult = {
  dataUrl: string
  blob: Blob
}

function wrapLines(params: {
  ctx: CanvasRenderingContext2D
  text: string
  maxWidth: number
  maxLines: number
}): { lines: string[]; truncated: boolean } {
  const { ctx, text, maxWidth, maxLines } = params
  const raw = String(text || '').trim()
  if (!raw) return { lines: [''], truncated: false }

  const words = raw.split(/\s+/g)
  const hasSpaces = words.length > 1

  const tokens = hasSpaces ? words : raw.split('')
  const joiner = hasSpaces ? ' ' : ''

  const lines: string[] = []
  let current = ''
  let truncated = false

  for (const token of tokens) {
    const next = current ? `${current}${joiner}${token}` : token
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
      continue
    }

    if (!current) {
      current = token
    }

    lines.push(current)
    current = token

    if (lines.length >= maxLines) {
      truncated = true
      current = ''
      break
    }
  }

  if (current && lines.length < maxLines) lines.push(current)
  return { lines, truncated }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Failed to render image'))
        else resolve(blob)
      },
      type,
      quality,
    )
  })
}

async function loadAvatarImage(src: string): Promise<HTMLImageElement> {
  const response = await fetch(src)
  if (!response.ok) throw new Error('Failed to fetch avatar')

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to load avatar'))
      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function getTemplateStyle(template: QuoteShareTemplate) {
  if (template === 'spotlight') {
    return {
      backgroundStops: ['#0f172a', '#172554', '#1d4ed8'],
      primaryText: '#f8fafc',
      secondaryText: 'rgba(226,232,240,0.8)',
      accentA: 'rgba(56,189,248,0.18)',
      accentB: 'rgba(250,204,21,0.14)',
      badgeFill: 'rgba(255,255,255,0.1)',
      badgeText: '#e0f2fe',
      footerFill: 'rgba(255,255,255,0.1)',
    }
  }

  if (template === 'dusk') {
    return {
      backgroundStops: ['#1f1632', '#312e81', '#0f172a'],
      primaryText: '#f8fafc',
      secondaryText: 'rgba(226,232,240,0.78)',
      accentA: 'rgba(244,114,182,0.14)',
      accentB: 'rgba(129,140,248,0.16)',
      badgeFill: 'rgba(255,255,255,0.09)',
      badgeText: '#f5d0fe',
      footerFill: 'rgba(255,255,255,0.1)',
    }
  }

  return {
    backgroundStops: ['#e0f2fe', '#ffffff', '#eef2ff'],
    primaryText: '#0f172a',
    secondaryText: 'rgba(15,23,42,0.6)',
    accentA: 'rgba(14,165,233,0.08)',
    accentB: 'rgba(99,102,241,0.08)',
    badgeFill: 'rgba(14,165,233,0.08)',
    badgeText: '#0369a1',
    footerFill: 'rgba(255,255,255,0.76)',
  }
}

export async function renderQuoteSharePng(params: QuoteShareImageParams): Promise<RenderResult> {
  const baseWidth = 1080
  const baseHeight = 1920

  const width = params.output?.width ?? baseWidth
  const height = params.output?.height ?? baseHeight
  const outputType = params.output?.type ?? 'image/png'
  const outputQuality = params.output?.quality
  const scale = width / baseWidth
  const px = (value: number) => value * scale

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const isZh = params.locale === 'zh'
  const title = isZh ? '今日金句' : 'Daily Quote'
  const brand = 'FlowSpark'
  const template = getTemplateStyle(params.template)

  const padX = px(96)
  const safeTop = px(210)
  const safeBottom = px(160)
  const padTop = safeTop
  const padBottom = safeBottom
  const contentW = width - padX * 2

  ctx.clearRect(0, 0, width, height)

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, template.backgroundStops[0])
  bg.addColorStop(0.45, template.backgroundStops[1])
  bg.addColorStop(1, template.backgroundStops[2])
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const orbAlpha = params.template === 'calm' ? 0.22 : 0.18
  const orbBlur = params.template === 'calm' ? px(18) : px(22)

  ctx.save()
  ctx.globalAlpha = orbAlpha
  ctx.filter = `blur(${orbBlur}px)`
  ctx.fillStyle = template.accentA
  ctx.beginPath()
  ctx.arc(width * 0.92, height * 0.12, px(260), 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = template.accentB
  ctx.beginPath()
  ctx.arc(width * 0.12, height * 0.86, px(340), 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = template.primaryText
  ctx.font = `700 ${px(46)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
  ctx.textBaseline = 'top'
  ctx.fillText(`${brand} · ${title}`, padX, padTop)

  ctx.fillStyle = template.secondaryText
  ctx.font = `500 ${px(32)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
  ctx.fillText(params.dateISO, padX, padTop + px(64))

  const quoteTop = padTop + px(260)
  ctx.fillStyle = template.primaryText
  ctx.font = isZh
    ? `700 ${px(78)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
    : `700 ${px(72)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`

  const maxLines = isZh ? 5 : 6
  const { lines, truncated } = wrapLines({
    ctx,
    text: params.quote,
    maxWidth: contentW,
    maxLines,
  })

  const lineHeight = isZh ? px(110) : px(102)
  let y = quoteTop

  for (const line of lines) {
    ctx.fillText(line, padX, y)
    y += lineHeight
  }

  if (truncated) {
    ctx.fillStyle = template.secondaryText
    ctx.font = `600 ${px(34)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
    ctx.fillText('…', padX, y - px(18))
  }

  const safeName = String(params.name || '').trim() || (isZh ? '你' : 'You')
  const fallbackLetter = String(params.avatarFallback || safeName || brand).trim().charAt(0).toUpperCase() || 'F'

  const footerW = px(276)
  const footerH = px(110)
  const footerX = width - padX - footerW
  const footerY = height - padBottom - footerH
  const avatarSize = px(60)
  const avatarX = footerX + px(20)
  const avatarY = footerY + px(25)

  ctx.fillStyle = template.footerFill
  ctx.beginPath()
  ctx.roundRect(footerX, footerY, footerW, footerH, px(26))
  ctx.fill()

  try {
    if (!params.avatarUrl) throw new Error('Missing avatar')
    const avatar = await loadAvatarImage(params.avatarUrl)
    ctx.save()
    ctx.beginPath()
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize)
    ctx.restore()
  } catch {
    ctx.fillStyle = template.badgeFill
    ctx.beginPath()
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = template.badgeText
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${px(30)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
    ctx.fillText(fallbackLetter, avatarX + avatarSize / 2, avatarY + avatarSize / 2 + px(2))
    ctx.textAlign = 'start'
    ctx.textBaseline = 'top'
  }

  ctx.fillStyle = template.primaryText
  ctx.font = `700 ${px(32)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
  ctx.fillText(safeName, avatarX + avatarSize + px(16), footerY + px(38))

  const defaultQuality = 0.92
  const dataUrl =
    outputType === 'image/png' ? canvas.toDataURL(outputType) : canvas.toDataURL(outputType, outputQuality ?? defaultQuality)
  const blob = await toBlob(canvas, outputType, outputType === 'image/png' ? undefined : outputQuality ?? defaultQuality)
  return { dataUrl, blob }
}
