'use client'

import { Button, ButtonProps } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { switchLanguage } from "@/i18n/actions"
import { useTransition } from "react"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  currentLocale: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
}

export function LanguageSwitcher({ 
  currentLocale,
  variant = "outline",
  size = "default",
  className
}: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition()

  const toggleLanguage = () => {
    const nextLocale = currentLocale === 'en' ? 'zh' : 'en'
    startTransition(() => {
      switchLanguage(nextLocale)
    })
  }

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={toggleLanguage}
      disabled={isPending}
      className={cn("w-full justify-start", className)}
    >
      {isPending ? <LoadingSpinner size={16} className="mr-2" /> : <span className="mr-2">🌐</span>}
      {currentLocale === 'en' ? '中文' : 'English'}
    </Button>
  )
}
