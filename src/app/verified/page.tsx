import { getDictionary } from '@/i18n/get-dictionary'
import { VerifiedPageContent } from '@/components/VerifiedPageContent'

export default async function VerifiedPage() {
  const dict = await getDictionary()

  return <VerifiedPageContent dict={dict} />
}
