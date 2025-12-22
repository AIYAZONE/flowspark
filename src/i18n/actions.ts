'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function switchLanguage(locale: string) {
  (await cookies()).set('NEXT_LOCALE', locale)
  revalidatePath('/')
}
