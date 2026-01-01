'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getSiteUrl } from '@/lib/get-site-url'

export async function requestReset(formData: FormData) {
  const email = (formData.get('email') as string || '').trim()
  if (!email) {
    redirect('/forgot?error=email_required')
  }

  const supabase = await createClient()
  const siteUrl = getSiteUrl()
  const cookieStore = await cookies()
  const last = cookieStore.get('PW_RESET_LAST')?.value
  if (last) {
    const lastTs = Number(last)
    if (!Number.isNaN(lastTs)) {
      const now = Date.now()
      if (now - lastTs < 60_000) {
        redirect('/forgot?error=rate_limit')
      }
    }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}reset`,
  })

  if (error) {
    console.error('Reset password error:', error)
    redirect('/forgot?error=unexpected_error')
  }

  cookieStore.set('PW_RESET_LAST', String(Date.now()))
  revalidatePath('/', 'layout')
  redirect('/forgot?message=email_sent')
}
