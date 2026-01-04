'use client'

import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Globe } from 'lucide-react'
import { switchLanguage } from '@/i18n/actions'
import { useTransition } from 'react'

export function LanguageToggle({ currentLocale }: { currentLocale: string }) {
  const [isLanguagePending, startLanguageTransition] = useTransition()

  const handleLanguageSwitch = (locale: string) => {
    if (locale === currentLocale) return
    startLanguageTransition(() => {
      switchLanguage(locale)
    })
  }

  return (
    <div className="bg-muted/50 rounded-full p-1 flex items-center gap-1 border shadow-sm">
      <Globe className="h-4 w-4 ml-2 mr-1 text-muted-foreground" />
      <Button
        variant={currentLocale === 'zh' ? 'default' : 'ghost'}
        size="sm"
        className={`h-7 px-3 text-xs font-medium rounded-full ${currentLocale === 'zh' ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => handleLanguageSwitch('zh')}
        disabled={isLanguagePending}
      >
        中文
      </Button>
      <Button
        variant={currentLocale === 'en' ? 'default' : 'ghost'}
        size="sm"
        className={`h-7 px-3 text-xs font-medium rounded-full ${currentLocale === 'en' ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => handleLanguageSwitch('en')}
        disabled={isLanguagePending}
      >
        EN
      </Button>
      {isLanguagePending && <LoadingSpinner size={14} className="mx-2" />}
    </div>
  )
}
