'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Copy, Download, Palette, RefreshCw, Send, Share2, Smartphone, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogClose, DialogFormContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DailyQuote, QuoteLocale } from '@/lib/daily-quote'
import { renderQuoteSharePng, type QuoteShareTemplate } from '@/lib/quote-share-image'
import { applyRefresh, ensureState, shouldPersistQuoteState, type DailyQuoteUiState } from '@/lib/daily-quote-state'
import { ModalActionFooter } from '@/components/ModalActionFooter'
import { canOpenSharePreviewFullscreen, getSharePreviewHeightClass } from '@/lib/share-image-dialog-layout'

const QUOTE_STORAGE_PREFIX = 'flowspark:daily-quote-choice'
const QUOTE_STATE_STORAGE_PREFIX = 'flowspark:daily-quote-state'
const DAILY_REFRESH_LIMIT = 5

type TemplateOption = {
  value: QuoteShareTemplate
  label: string
}

type ShareSize = 'auto' | '9:16' | '19.5:9' | '20:9'

type ShareSizeOption = {
  value: ShareSize
  label: string
}

interface WelcomeDict {
  morning: string
  afternoon: string
  evening: string
  new: string
  startJourney: string
  readyToFocus: string
  dailyQuoteLabel: string
  shareImage: string
  downloadImage: string
  systemShare: string
  copyText: string
  copied: string
  generating: string
  shareFailed: string
  refreshQuote: string
  quoteChoicesHint: string
  shareTemplateLabel: string
  templateCalm: string
  templateSpotlight: string
  templateDusk: string
  shareSizeLabel: string
  sizeAuto: string
  size9x16: string
  size19_5x9: string
  size20x9: string
  shareSizeMore: string
  shareSizeOptionalLabel: string
  shareFlowHint: string
  sharePreviewFullscreen: string
  quoteHistoryUndoCta: string
  quoteHistoryTitle: string
  quoteHistoryEmpty: string
  refreshUsedUp: string
  refreshRemaining: string
  wallpaperHint: string
}

export function DashboardWelcome({ 
  dict, 
  name,
  isNewUser = false,
  dailyQuotes,
  defaultQuoteIndex = 0,
  quoteDateISO,
  locale,
  avatarUrl,
}: { 
  dict: WelcomeDict
  name: string
  isNewUser?: boolean
  dailyQuotes: DailyQuote[]
  defaultQuoteIndex?: number
  quoteDateISO: string
  locale: QuoteLocale
  avatarUrl?: string | null
}) {
  const [greeting, setGreeting] = useState('')
  const [quoteState, setQuoteState] = useState<DailyQuoteUiState>(() => ({
    selectedIndex: defaultQuoteIndex,
    refreshUsed: 0,
    history: [defaultQuoteIndex],
  }))
  const [hasHydratedQuoteState, setHasHydratedQuoteState] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePreviewFullscreenOpen, setSharePreviewFullscreenOpen] = useState(false)
  const [shareTemplate, setShareTemplate] = useState<QuoteShareTemplate>('calm')
  const [shareSize, setShareSize] = useState<ShareSize>('auto')
  const [shareSizeExpanded, setShareSizeExpanded] = useState(false)
  const [shareMobileSizeOpen, setShareMobileSizeOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const selectedQuote = dailyQuotes[quoteState.selectedIndex] ?? dailyQuotes[0]
  const avatarFallback = String(name || '').trim().charAt(0).toUpperCase() || 'F'
  const quoteStateStorageKey = `${QUOTE_STATE_STORAGE_PREFIX}:${locale}:${quoteDateISO}`
  const legacyQuoteStorageKey = `${QUOTE_STORAGE_PREFIX}:${locale}:${quoteDateISO}`
  const canUseSystemShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const templateOptions = useMemo<TemplateOption[]>(() => [
    { value: 'calm', label: dict.templateCalm },
    { value: 'spotlight', label: dict.templateSpotlight },
    { value: 'dusk', label: dict.templateDusk },
  ], [dict.templateCalm, dict.templateSpotlight, dict.templateDusk])

  const primaryShareSizeOptions = useMemo<ShareSizeOption[]>(() => [
    { value: 'auto', label: dict.sizeAuto },
    { value: '19.5:9', label: dict.size19_5x9 },
    { value: '20:9', label: dict.size20x9 },
  ], [dict.sizeAuto, dict.size19_5x9, dict.size20x9])

  const classicShareSizeOption = useMemo<ShareSizeOption>(() => ({
    value: '9:16',
    label: dict.size9x16,
  }), [dict.size9x16])

  const shareOutput = useMemo(() => {
    const width = 1080
    let ratio = 16 / 9

    if (shareSize === 'auto') {
      if (typeof window !== 'undefined' && window.screen?.width && window.screen?.height) {
        const detected = window.screen.height / window.screen.width
        ratio = detected >= 1.6 ? detected : 16 / 9
      }
    } else if (shareSize === '19.5:9') {
      ratio = 19.5 / 9
    } else if (shareSize === '20:9') {
      ratio = 20 / 9
    } else {
      ratio = 16 / 9
    }

    const height = Math.round(width * ratio)
    return { width, height }
  }, [shareSize, shareOpen])
  const sharePreviewHeightClass = useMemo(() => getSharePreviewHeightClass(), [])

  const quoteHistory = useMemo(() => {
    const normalized = ensureState(quoteState, dailyQuotes.length, defaultQuoteIndex)
    return normalized.history
      .filter((idx) => idx >= 0 && idx < dailyQuotes.length)
      .map((idx) => ({ idx, text: dailyQuotes[idx]?.text ?? '' }))
  }, [quoteState, dailyQuotes, defaultQuoteIndex])
  const hasQuoteHistory = quoteHistory.length > 1

  useEffect(() => {
    const timer = setTimeout(() => {
      const hour = new Date().getHours()
      if (isNewUser) {
        setGreeting(dict.new)
      } else if (hour < 12) {
        setGreeting(dict.morning)
      } else if (hour < 18) {
        setGreeting(dict.afternoon)
      } else {
        setGreeting(dict.evening)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [dict, isNewUser])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setHasHydratedQuoteState(false)

    const timer = window.setTimeout(() => {
      if (dailyQuotes.length === 0) {
        setHasHydratedQuoteState(true)
        return
      }
      const raw = window.localStorage.getItem(quoteStateStorageKey)
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as unknown
          setQuoteState(ensureState(parsed, dailyQuotes.length, defaultQuoteIndex))
          setHasHydratedQuoteState(true)
          return
        } catch {
          window.localStorage.removeItem(quoteStateStorageKey)
        }
      }

      const legacy = window.localStorage.getItem(legacyQuoteStorageKey)
      if (!legacy) {
        setQuoteState(ensureState(undefined, dailyQuotes.length, defaultQuoteIndex))
        setHasHydratedQuoteState(true)
        return
      }

      const parsedLegacy = Number(legacy)
      if (!Number.isFinite(parsedLegacy)) {
        setQuoteState(ensureState(undefined, dailyQuotes.length, defaultQuoteIndex))
        setHasHydratedQuoteState(true)
        return
      }

      const migrated = ensureState({ selectedIndex: parsedLegacy, refreshUsed: 0, history: [parsedLegacy] }, dailyQuotes.length, defaultQuoteIndex)
      setQuoteState(migrated)
      window.localStorage.setItem(quoteStateStorageKey, JSON.stringify(migrated))
      setHasHydratedQuoteState(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [quoteStateStorageKey, legacyQuoteStorageKey, dailyQuotes.length, defaultQuoteIndex])

  useEffect(() => {
    if (typeof window === 'undefined' || !shouldPersistQuoteState(hasHydratedQuoteState, dailyQuotes.length)) return
    const normalized = ensureState(quoteState, dailyQuotes.length, defaultQuoteIndex)
    window.localStorage.setItem(quoteStateStorageKey, JSON.stringify(normalized))
  }, [quoteStateStorageKey, quoteState, dailyQuotes.length, defaultQuoteIndex, hasHydratedQuoteState])

  useEffect(() => {
    if (!shareOpen || !selectedQuote) return

    let cancelled = false
    const timer = setTimeout(() => {
      setIsGenerating(true)
      setShareError(null)
      setCopied(false)
      setImageDataUrl(null)
      setImageBlob(null)
    }, 0)

    renderQuoteSharePng({
      quote: selectedQuote.text,
      dateISO: quoteDateISO,
      name,
      locale,
      avatarUrl,
      avatarFallback,
      template: shareTemplate,
      output: { width: shareOutput.width, height: shareOutput.height, type: 'image/png' },
    })
      .then((res) => {
        if (cancelled) return
        setImageDataUrl(res.dataUrl)
        setImageBlob(res.blob)
      })
      .catch(() => {
        if (cancelled) return
        setImageDataUrl(null)
        setImageBlob(null)
        setShareError(dict.shareFailed)
      })
      .finally(() => {
        if (cancelled) return
        setIsGenerating(false)
      })

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [shareOpen, selectedQuote, quoteDateISO, name, locale, avatarUrl, avatarFallback, shareTemplate, shareOutput.width, shareOutput.height, dict.shareFailed])

  const handleDownload = () => {
    if (!imageBlob) return
    const url = URL.createObjectURL(imageBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flowspark-quote-${quoteDateISO}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const handleSystemShare = async () => {
    if (!imageBlob) return
    const nav = navigator as unknown as {
      share?: (data: unknown) => Promise<void>
      canShare?: (data: unknown) => boolean
    }
    if (typeof nav.share !== 'function') return

    const file = new File([imageBlob], `flowspark-quote-${quoteDateISO}.png`, { type: 'image/png' })
    const data = {
      files: [file],
      title: dict.shareImage,
      text: selectedQuote?.text || '',
    }
    if (typeof nav.canShare === 'function' && !nav.canShare(data)) return
    await nav.share(data)
  }

  const handleCopy = async () => {
    try {
      const text = `${selectedQuote?.text || ''}\n— ${quoteDateISO} · FlowSpark`
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  const handleRefreshQuote = () => {
    if (dailyQuotes.length <= 1) return
    setQuoteState((current) => applyRefresh(ensureState(current, dailyQuotes.length, defaultQuoteIndex), dailyQuotes.length, DAILY_REFRESH_LIMIT))
  }

  const handleSelectQuoteIndex = (nextIndex: number) => {
    if (dailyQuotes.length === 0) return
    const safeIndex = ((nextIndex % dailyQuotes.length) + dailyQuotes.length) % dailyQuotes.length
    setQuoteState((current) => {
      const normalized = ensureState(current, dailyQuotes.length, defaultQuoteIndex)
      const nextHistory = Array.from(new Set([...normalized.history, safeIndex])).slice(0, DAILY_REFRESH_LIMIT)
      return { ...normalized, selectedIndex: safeIndex, history: nextHistory }
    })
    setHistoryOpen(false)
  }

  const refreshHint = useMemo(() => {
    const used = Math.min(DAILY_REFRESH_LIMIT, Math.max(0, quoteState.refreshUsed))
    if (used >= DAILY_REFRESH_LIMIT) {
      return dict.refreshUsedUp.replace('{used}', String(DAILY_REFRESH_LIMIT)).replace('{total}', String(DAILY_REFRESH_LIMIT))
    }
    return dict.refreshRemaining.replace('{n}', String(DAILY_REFRESH_LIMIT - used))
  }, [dict.refreshRemaining, dict.refreshUsedUp, quoteState.refreshUsed])

  const isRefreshDisabled = dailyQuotes.length <= 1 || quoteState.refreshUsed >= DAILY_REFRESH_LIMIT
  const isClassicSizeVisible = shareSizeExpanded || shareSize === '9:16'
  const canOpenFullscreenPreview = canOpenSharePreviewFullscreen({ imageDataUrl, isGenerating })

  const handleShareOpenChange = (nextOpen: boolean) => {
    setShareOpen(nextOpen)
    if (!nextOpen) setSharePreviewFullscreenOpen(false)
    if (!nextOpen && shareSize !== '9:16') setShareSizeExpanded(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {greeting ? (
            <>
              {greeting}, {name}.
            </>
          ) : (
            <span className="inline-block h-8 w-32 bg-muted/20 animate-pulse rounded" />
          )}
          {isNewUser && <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />}
        </h1>
        <p className="text-sm text-muted-foreground hidden sm:block">
          {isNewUser ? dict.startJourney : dict.readyToFocus}
        </p>
      </div>

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {dict.dailyQuoteLabel}
            </span>
            <span className="text-xs text-muted-foreground">{quoteDateISO}</span>
          </div>
          <div className="text-sm sm:text-base leading-relaxed text-foreground/90 line-clamp-3 sm:line-clamp-2">
            {selectedQuote?.text}
          </div>
          <p className="mt-2 text-xs text-muted-foreground hidden sm:block">
            {dict.quoteChoicesHint} {refreshHint}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            shape="default"
            className="shrink-0"
            onClick={handleRefreshQuote}
            aria-label={dict.refreshQuote}
            disabled={isRefreshDisabled}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            shape="default"
            className="shrink-0"
            onClick={() => setShareOpen(true)}
            aria-label={dict.shareImage}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={shareOpen} onOpenChange={handleShareOpenChange}>
        <DialogFormContent
          mobileMode="fullscreen"
          hideCloseButton
          className="p-0 md:left-[50%]! md:right-auto! md:top-[50%]! md:bottom-auto! md:h-auto! md:w-full! md:max-w-[860px]! md:max-h-[92vh]! md:translate-x-[-50%]! md:translate-y-[-50%]! md:rounded-lg! md:border! md:p-0 md:gap-0"
        >
          <div className="flex h-dvh flex-col md:h-auto md:max-h-[92vh]">
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur md:px-6">
              <DialogHeader className="space-y-0 text-left">
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Send className="h-4 w-4 text-primary" />
                    {dict.shareImage}
                  </DialogTitle>
                  <DialogClose asChild>
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogClose>
                </div>
              </DialogHeader>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-5">
              <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] md:items-start md:gap-5">
                <div className="flex flex-col gap-4">
                  {hasQuoteHistory ? (
                    <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger asChild>
                          <Button
                            type="button"
                            variant="link"
                            shape="default"
                            size="sm"
                            className="h-auto px-0 py-0 text-xs font-medium"
                          >
                            {dict.quoteHistoryUndoCta}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="mt-2">
                        <div className="rounded-lg border border-border/50 bg-muted/10 p-2">
                          <div className="px-2 pb-1 text-xs text-muted-foreground">{dict.quoteHistoryTitle}</div>
                          <div className="flex max-h-44 flex-col gap-1 overflow-auto pr-1">
                            {quoteHistory.length > 0 ? (
                              quoteHistory.map((item) => (
                                <Button
                                  key={item.idx}
                                  type="button"
                                  variant="ghost"
                                  shape="default"
                                  title={item.text}
                                  className={`h-auto items-start justify-start gap-2 px-2 py-2 text-left text-sm ${
                                    item.idx === quoteState.selectedIndex ? 'text-foreground' : 'text-muted-foreground'
                                  }`}
                                  onClick={() => handleSelectQuoteIndex(item.idx)}
                                >
                                  {item.idx === quoteState.selectedIndex ? (
                                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                                  ) : (
                                    <span className="mt-0.5 h-4 w-4" />
                                  )}
                                  <span className="min-w-0 flex-1 whitespace-normal break-words line-clamp-2">
                                    {item.text}
                                  </span>
                                </Button>
                              ))
                            ) : (
                              <div className="px-2 py-2 text-sm text-muted-foreground">{dict.quoteHistoryEmpty}</div>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : null}

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Palette className="h-4 w-4 text-primary" />
                      {dict.shareTemplateLabel}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {templateOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={shareTemplate === option.value ? 'default' : 'outline'}
                          shape="default"
                          className="h-9 px-3"
                          onClick={() => setShareTemplate(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">{dict.shareFlowHint}</div>
                  </div>

                  <div className="hidden md:flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Smartphone className="h-4 w-4 text-primary" />
                      {dict.shareSizeLabel}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {primaryShareSizeOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={shareSize === option.value ? 'default' : 'outline'}
                          shape="default"
                          className="h-9 px-3"
                          onClick={() => setShareSize(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        shape="default"
                        className="h-9 px-2 text-muted-foreground"
                        onClick={() => setShareSizeExpanded((current) => !current)}
                      >
                        {dict.shareSizeMore}
                        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isClassicSizeVisible ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>

                    {isClassicSizeVisible ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant={shareSize === classicShareSizeOption.value ? 'default' : 'outline'}
                          shape="default"
                          className="h-9 px-3"
                          onClick={() => setShareSize(classicShareSizeOption.value)}
                        >
                          {classicShareSizeOption.label}
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <div className="md:hidden">
                    <Collapsible open={shareMobileSizeOpen} onOpenChange={setShareMobileSizeOpen}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Smartphone className="h-4 w-4 text-primary" />
                          {dict.shareSizeOptionalLabel}
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button type="button" variant="ghost" shape="default" className="h-9 px-2 text-muted-foreground">
                            {dict.shareSizeMore}
                            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${shareMobileSizeOpen ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="mt-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {primaryShareSizeOptions.map((option) => (
                            <Button
                              key={option.value}
                              type="button"
                              variant={shareSize === option.value ? 'default' : 'outline'}
                              shape="default"
                              className="h-9 px-3"
                              onClick={() => setShareSize(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                          <Button
                            type="button"
                            variant={shareSize === classicShareSizeOption.value ? 'default' : 'outline'}
                            shape="default"
                            className="h-9 px-3"
                            onClick={() => setShareSize(classicShareSizeOption.value)}
                          >
                            {classicShareSizeOption.label}
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>

                <div className="flex justify-center md:justify-end">
                  <div
                    className={`relative ${sharePreviewHeightClass} w-auto overflow-hidden rounded-xl border border-border/50 bg-muted/10 ${
                      canOpenFullscreenPreview ? 'cursor-zoom-in' : ''
                    }`}
                    style={{ aspectRatio: `${shareOutput.width} / ${shareOutput.height}` }}
                    role="button"
                    tabIndex={canOpenFullscreenPreview ? 0 : -1}
                    aria-label={dict.sharePreviewFullscreen}
                    aria-disabled={!canOpenFullscreenPreview}
                    onClick={() => {
                      if (!canOpenFullscreenPreview) return
                      setSharePreviewFullscreenOpen(true)
                    }}
                    onKeyDown={(event) => {
                      if (!canOpenFullscreenPreview) return
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      event.preventDefault()
                      setSharePreviewFullscreenOpen(true)
                    }}
                  >
                    {imageDataUrl ? (
                      <Image
                        src={imageDataUrl}
                        alt={dict.shareImage}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 92vw, 520px"
                        className="object-contain"
                      />
                    ) : (
                      <div className="h-full w-full animate-pulse bg-muted/20" />
                    )}

                    {isGenerating ? (
                      <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        {dict.generating}
                      </div>
                    ) : null}

                    {shareError ? (
                      <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs text-destructive shadow-sm">
                        {shareError}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <Dialog open={sharePreviewFullscreenOpen} onOpenChange={setSharePreviewFullscreenOpen}>
              <DialogFormContent mobileMode="fullscreen" hideCloseButton className="p-0 bg-black/95 text-white">
                <div className="relative h-dvh">
                  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 px-4 py-3">
                    <DialogTitle className="rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white/90 shadow-sm backdrop-blur-sm">
                      {dict.sharePreviewFullscreen}
                    </DialogTitle>
                    <DialogClose asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-full bg-black/55 text-white/90 shadow-sm backdrop-blur-sm hover:bg-black/65 hover:text-white/95"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </DialogClose>
                  </div>

                  <div className="flex h-dvh items-center justify-center px-4 py-6" onClick={() => setSharePreviewFullscreenOpen(false)}>
                    <div
                      className="relative flex max-h-[calc(100dvh-3rem)] max-w-[calc(100vw-2rem)] items-center justify-center md:max-h-[82vh] md:max-w-[360px]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {imageDataUrl ? (
                        <Image
                          src={imageDataUrl}
                          alt={dict.shareImage}
                          unoptimized
                          width={shareOutput.width}
                          height={shareOutput.height}
                          sizes="100vw"
                          className="h-auto max-h-full w-auto max-w-full object-contain"
                        />
                      ) : (
                        <div className="h-full w-full animate-pulse rounded-xl bg-white/10" />
                      )}
                    </div>
                  </div>
                </div>
              </DialogFormContent>
            </Dialog>

            <ModalActionFooter>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {canUseSystemShare ? (
                  <>
                    <Button
                      type="button"
                      variant="default"
                      shape="default"
                      className="gap-2"
                      disabled={!imageBlob || isGenerating}
                      onClick={handleSystemShare}
                    >
                      <Send className="h-4 w-4" />
                      {dict.systemShare}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      shape="default"
                      className="gap-2"
                      disabled={!imageBlob || isGenerating}
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4" />
                      {dict.downloadImage}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    shape="default"
                    className="gap-2"
                    disabled={!imageBlob || isGenerating}
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    {dict.downloadImage}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  shape="default"
                  className="gap-2"
                  disabled={isGenerating}
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                  {copied ? dict.copied : dict.copyText}
                </Button>
              </div>
            </ModalActionFooter>
          </div>
        </DialogFormContent>
      </Dialog>
    </div>
  )
}
