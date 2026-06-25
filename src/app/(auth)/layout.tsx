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
    <div className="relative flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(720px,52vh)] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/18 via-violet-500/10 to-background" />
      <div className="pointer-events-none absolute inset-x-0 top-[22%] h-72 bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent_60%)] blur-3xl" />

      <header
        className="relative z-10 w-full border-b border-border/20 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/65"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
          <Link href="/">
            <BrandLogo />
          </Link>
          <LanguageSwitcher
            currentLocale={currentLocale}
            variant="ghost"
            size="sm"
            className="w-auto px-2"
          />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="relative z-10 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground lg:px-8">
          <p>
            {dict.landing.footer.replace('{years}', formatCopyrightYearRange(COPYRIGHT_START_YEAR))}
          </p>
        </div>
      </footer>
    </div>
  )
}
