import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { getDictionary, getCurrentLocale } from '@/i18n/get-dictionary'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { COPYRIGHT_START_YEAR, formatCopyrightYearRange } from '@/lib/copyright'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dict = await getDictionary()
  const currentLocale = await getCurrentLocale()

  return (
    <div className="auth-bg flex min-h-screen flex-col">
      <header className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <BrandLogo />
        </Link>
        <div>
            <LanguageSwitcher 
              currentLocale={currentLocale} 
              variant="ghost" 
              size="sm" 
              className="w-auto px-2"
            />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground lg:px-8">
          <p>
            {dict.landing.footer.replace('{years}', formatCopyrightYearRange(COPYRIGHT_START_YEAR))}
          </p>
        </div>
      </footer>
    </div>
  )
}
