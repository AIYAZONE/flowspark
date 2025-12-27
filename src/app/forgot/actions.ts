'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requestReset(formData: FormData) {
  const email = (formData.get('email') as string || '').trim()
  if (!email) {
    redirect('/forgot?error=' + encodeURIComponent('Email is required'))
  }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset`,
  })

  if (error) {
    redirect('/forgot?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/forgot?message=' + encodeURIComponent('Reset email sent'))
}
