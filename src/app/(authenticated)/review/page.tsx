import { createClient } from '@/lib/supabase/server'
import { getDictionary, getCurrentLocale } from '@/i18n/get-dictionary'
import { WeeklyReviewClient } from '@/components/WeeklyReviewClient'

export default async function ReviewPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const locale = await getCurrentLocale()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().slice(0, 10)

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <WeeklyReviewClient dict={dict} locale={locale} today={today} />
    </main>
  )
}
