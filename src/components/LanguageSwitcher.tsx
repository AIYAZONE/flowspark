'use client'

import { Button } from "@/components/ui/button"
import { switchLanguage } from "@/i18n/actions"
import { useTransition } from "react"

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const [isPending, startTransition] = useTransition()

  const toggleLanguage = () => {
    const nextLocale = currentLocale === 'en' ? 'zh' : 'en'
    startTransition(() => {
      switchLanguage(nextLocale)
    })
  }

  return (
    <Button 
      variant="outline" 
      onClick={toggleLanguage}
      disabled={isPending}
      className="w-full justify-start"
    >
      <span className="mr-2">🌐</span>
      {currentLocale === 'en' ? '中文' : 'English'}
    </Button>
  )
}
